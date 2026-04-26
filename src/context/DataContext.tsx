import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ClassItem, SubjectDetail, AttentionGroup } from '../types';
import type { UserProfile } from '../services/icTypes';
import { IcClient } from '../services/icClient';
import {
  mapUserAccount, mapGradesToClasses, mapGradesToSubjectDetails,
  mapRecentlyScoredToAttention,
} from '../services/icMapper';

export type SyncStep = 'idle' | 'user' | 'grades' | 'attention' | 'done';

interface DataState {
  client: IcClient | null;
  user: UserProfile | null;
  classes: ClassItem[];
  subjectDetails: Record<string, SubjectDetail>;
  attention: AttentionGroup[];
  syncedAt: number | null;
  syncStep: SyncStep;
  syncError: string | null;
}

interface DataContextValue extends DataState {
  setClient: (client: IcClient) => void;
  refresh: () => Promise<void>;
  signOut: () => void;
}

const initialState: DataState = {
  client: null,
  user: null,
  classes: [],
  subjectDetails: {},
  attention: [],
  syncedAt: null,
  syncStep: 'idle',
  syncError: null,
};

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
      // recentlyScored requires a modifiedDate (returns 422 without it — IC
      // treats it as a delta endpoint). 60 days back covers a typical
      // grading window without flooding the response with stale items.
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19); // → "YYYY-MM-DDTHH:mm:ss" (no ms, no Z — IC's format)
      const recentRaw = await client.getRecentlyScored(sixtyDaysAgo);

      const user = mapUserAccount(userRaw, gradesRaw);
      const classes = mapGradesToClasses(gradesRaw);
      const subjectDetails = mapGradesToSubjectDetails(gradesRaw);
      const attention = mapRecentlyScoredToAttention(recentRaw);

      setState(s => ({
        ...s,
        user,
        classes,
        subjectDetails,
        attention,
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
    setState(initialState);
  }, []);

  return (
    <DataContext.Provider value={{ ...state, setClient, refresh, signOut }}>
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
