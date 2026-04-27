import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ClassItem, SubjectDetail, AttentionGroup } from '../types';
import type { UserProfile } from '../services/icTypes';
import { IcClient } from '../services/icClient';
import {
  mapUserAccount, mapGradesToClasses, mapGradesToSubjectDetails,
  mapRecentlyScoredToAttention, computeGpa, mapIcGpa, pickActiveTermGrade,
  type GpaSummary,
} from '../services/icMapper';
import {
  loadDistrict, saveDistrict, type PersistedDistrict,
} from '../lib/persistDistrict';

export type SyncStep = 'idle' | 'user' | 'grades' | 'attention' | 'categories' | 'detail' | 'gpa' | 'done';

interface DataState {
  client: IcClient | null;
  user: UserProfile | null;
  classes: ClassItem[];
  subjectDetails: Record<string, SubjectDetail>;
  attention: AttentionGroup[];
  gpa: GpaSummary;
  syncedAt: number | null;
  syncStep: SyncStep;
  syncError: string | null;
  /** Persisted district selection. Hydrated from AsyncStorage on mount. */
  district: PersistedDistrict | null;
  /**
   * False until AsyncStorage hydration completes. RootNavigator gates on this
   * so we don't flash the wrong onboarding initial route during cold launch.
   */
  hydrated: boolean;
  /**
   * True once first-sync has completed and the user is "in the app". Drives
   * the conditional Onboarding-vs-Main routing in RootNavigator. signOut()
   * resets to false; FirstSyncScreen flips it true on syncStep === 'done'.
   */
  inApp: boolean;
}

interface DataContextValue extends DataState {
  setClient: (client: IcClient) => void;
  refresh: () => Promise<void>;
  /** Clears in-memory session (preserves persisted district + hydrated flag). */
  signOut: () => void;
  /** Persists + caches the chosen district. */
  setDistrict: (d: PersistedDistrict) => Promise<void>;
  /** Called by FirstSyncScreen when first-time sync completes. */
  enterApp: () => void;
}

const initialState: DataState = {
  client: null,
  user: null,
  classes: [],
  subjectDetails: {},
  attention: [],
  gpa: { uw: 0, w: 0, trend: 0 },
  syncedAt: null,
  syncStep: 'idle',
  syncError: null,
  district: null,
  hydrated: false,
  inApp: false,
};

/** Fields that get cleared on sign-out (everything except district + hydrated). */
function sessionResetState(prev: DataState): DataState {
  return {
    ...prev,
    client: null,
    user: null,
    classes: [],
    subjectDetails: {},
    attention: [],
    gpa: { uw: 0, w: 0, trend: 0 },
    syncedAt: null,
    syncStep: 'idle',
    syncError: null,
    inApp: false,
  };
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DataState>(initialState);
  // Ref mirror of state so async callbacks can read the latest client without
  // re-creating refresh() on every state change.
  const stateRef = useRef(state);
  stateRef.current = state;

  const setClient = useCallback((client: IcClient) => {
    setState(s => ({ ...s, client }));
  }, []);

  const refresh = useCallback(async () => {
    const client = stateRef.current.client;
    if (!client) {
      setState(s => ({ ...s, syncError: 'Not authenticated', syncStep: 'idle' }));
      return;
    }
    setState(s => ({ ...s, syncStep: 'user', syncError: null }));
    try {
      const userRaw = await client.getUserAccount();
      setState(s => ({ ...s, syncStep: 'grades' }));
      const gradesRaw = await client.getGrades();
      setState(s => ({ ...s, syncStep: 'attention' }));
      // listView returns the full assignment list (every section, every
      // assignment, no date filter). Same row shape as recentlyScored, but
      // complete — preferred under in-memory-only since we have no need
      // for a delta-since-X optimization.
      const recentRaw = await client.getAssignmentListView();
      setState(s => ({ ...s, syncStep: 'categories' }));
      // Fan-fetch categories for every section in parallel. Active courses only.
      const activeCourses = gradesRaw
        .flatMap(e => e.courses)
        .filter(c => !c.dropped);
      const sectionIds = activeCourses.map(c => c.sectionID);
      const categoriesBySection: Record<string, Awaited<ReturnType<typeof client.getCategoriesForSection>>> = {};
      const catResults = await Promise.allSettled(
        sectionIds.map(sid => client.getCategoriesForSection(sid).then(cats => ({ sid, cats }))),
      );
      for (const r of catResults) {
        if (r.status === 'fulfilled') {
          categoriesBySection[String(r.value.sid)] = r.value.cats;
        } else {
          // eslint-disable-next-line no-console
          console.log('[DataContext] categories fetch failed for one section:', r.reason);
        }
      }

      setState(s => ({ ...s, syncStep: 'detail' }));
      // Fan-fetch grade detail per section. Pick the active term-task (most
      // recent grading task with a percent) so IC returns the most relevant
      // detail snapshot. Used to populate per-category pct + count.
      const detailBySection: Record<string, Awaited<ReturnType<typeof client.getGradeDetail>>> = {};
      const detailResults = await Promise.allSettled(
        activeCourses.map(course => {
          const task = pickActiveTermGrade(course.gradingTasks);
          return client
            .getGradeDetail(course.sectionID, task?.termID, task?.taskID)
            .then(detail => ({ sid: course.sectionID, detail }));
        }),
      );
      for (const r of detailResults) {
        if (r.status === 'fulfilled') {
          detailBySection[String(r.value.sid)] = r.value.detail;
        } else {
          // eslint-disable-next-line no-console
          console.log('[DataContext] grade detail fetch failed for one section:', r.reason);
        }
      }

      setState(s => ({ ...s, syncStep: 'gpa' }));
      // IC's official GPA endpoint. Falls back to computed if unavailable.
      let gpaRaw: Awaited<ReturnType<typeof client.getGpa>> | null = null;
      try {
        gpaRaw = await client.getGpa();
      } catch (e) {
        // Non-fatal: we'll fall back to computeGpa from class list.
        // eslint-disable-next-line no-console
        console.log('[DataContext] GPA endpoint failed, using computed fallback:', e);
      }

      const user = mapUserAccount(userRaw, gradesRaw);
      const classes = mapGradesToClasses(gradesRaw, recentRaw);
      const subjectDetails = mapGradesToSubjectDetails(
        gradesRaw, recentRaw, categoriesBySection, detailBySection,
      );
      
      const activeTermMap: Record<string, number> = {};
      for (const enrollment of gradesRaw) {
        for (const course of enrollment.courses) {
          const task = pickActiveTermGrade(course.gradingTasks);
          if (task?.termID) {
            activeTermMap[String(course.sectionID)] = task.termID;
          }
        }
      }
      
      const attention = mapRecentlyScoredToAttention(recentRaw, activeTermMap);
      const computedGpa = computeGpa(classes);
      const gpa = gpaRaw ? mapIcGpa(gpaRaw, computedGpa) : computedGpa;

      setState(s => ({
        ...s,
        user,
        classes,
        subjectDetails,
        attention,
        gpa,
        syncedAt: Date.now(),
        syncStep: 'done',
        syncError: null,
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setState(s => ({ ...s, syncError: msg, syncStep: 'idle' }));
    }
  }, []);

  const signOut = useCallback(() => {
    // Preserves district + hydrated; clears everything else.
    setState(s => sessionResetState(s));
  }, []);

  const setDistrict = useCallback(async (d: PersistedDistrict) => {
    setState(s => ({ ...s, district: d }));
    try {
      await saveDistrict(d);
    } catch (e) {
      // Persistence failure is non-fatal — in-memory state still updated so
      // the current session works. Next cold launch would see no persisted
      // district and treat as first-time. Worst case = one extra District pick.
      // eslint-disable-next-line no-console
      console.log('[DataContext] saveDistrict failed:', e);
    }
  }, []);

  const enterApp = useCallback(() => {
    setState(s => ({ ...s, inApp: true }));
  }, []);

  // Hydrate persisted district once on mount.
  useEffect(() => {
    let cancelled = false;
    loadDistrict().then(d => {
      if (cancelled) return;
      setState(s => ({ ...s, district: d, hydrated: true }));
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <DataContext.Provider value={{
      ...state,
      setClient,
      refresh,
      signOut,
      setDistrict,
      enterApp,
    }}>
      {children}
    </DataContext.Provider>
  );
}

function useDataContext(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

export const useData = useDataContext;
export const useUser = (): UserProfile | null => useDataContext().user;
export const useClasses = (): ClassItem[] => useDataContext().classes;
export const useSubjectDetail = (id: string): SubjectDetail | null =>
  useDataContext().subjectDetails[id] ?? null;
export const useAttention = (): AttentionGroup[] => useDataContext().attention;
export const useGpa = (): GpaSummary => useDataContext().gpa;
export const useDistrict = (): PersistedDistrict | null => useDataContext().district;
