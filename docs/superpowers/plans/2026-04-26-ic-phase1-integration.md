# IC Phase 1 Integration — Implementation Plan

**Branch:** `feat/infinitecampus-integration`
**Spike outcome:** All 3 architectural assumptions validated — see commits `5658ebe`, `a392911`, `7ff2eaf`.
**Approved scope:** Full Phase 1, all 4 endpoints, all 6 main screens, in-memory state only.

**Goal:** Replace mock data and the legacy `IC_SCRAPER_JS` injection scraper with a clean cookie-capture + native-fetch architecture. Live data only, never persisted to disk.

**Architecture:** WebView is a one-shot SSO surface that closes immediately on cookie capture. A typed `IcClient` (held in memory by a React Context) owns the cookie header and exposes typed methods for IC's 4 portal endpoints. Pure mapper functions transform raw IC responses into the app's existing domain types. Every cold launch re-auths.

**Tech Stack:** React Native 0.83 + Expo SDK 55 + React 19, TypeScript strict, `react-native-webview`, `react-native-nitro-cookies` (replacing deprecated `@react-native-cookies/cookies`), React Context (no Redux/Zustand).

---

## File structure

| File | Status | Responsibility |
|---|---|---|
| `src/services/icTypes.ts` | new | Raw IC API response types — pinned to schemas captured from real DevTools traffic |
| `src/services/icClient.ts` | new | Typed methods: `getUserAccount()`, `getGrades()`, `getRecentlyScored()`, `getRoster()`. Holds cookie header in closure. |
| `src/services/icMapper.ts` | new | Pure functions: raw IC JSON → app domain (`UserProfile`, `ClassItem[]`, `SubjectDetail`, `AttentionGroup[]`) |
| `src/context/DataContext.tsx` | new | Provider + hooks (`useData`, `useUser`, `useClasses`, `useAttention`). State only, no persistence. |
| `src/hooks/useIcAuth.ts` | new | WebView mount + `onNavigationStateChange` watcher + cookie capture + `IcClient` factory |
| `App.tsx` | modify | Wrap children with `DataProvider` inside `ThemeProvider` |
| `src/types/index.ts` | modify | Add `UserProfile`; remove `IcSpike` from `RootStackParamList` |
| `src/screens/onboarding/SignInWebViewScreen.tsx` | modify | Strip injection scraper; cookie-capture flow; **close WebView immediately on capture** |
| `src/screens/onboarding/FirstSyncScreen.tsx` | modify | Call `refresh()`; show progress; advance to Main on done |
| `src/screens/main/DashboardScreen.tsx` | modify | `useClasses()` instead of `MockClasses` |
| `src/screens/main/SubjectDetailScreen.tsx` | modify | `useData().subjectDetails[id]` instead of `MockPreCalc` |
| `src/screens/main/AttentionScreen.tsx` | modify | `useAttention()` instead of `MockAttention` |
| `src/screens/main/SettingsScreen.tsx` | modify | `useUser()` instead of `MockUser`; remove the spike 5-tap |
| `src/screens/main/WhatIfScreen.tsx` | modify | `useClasses()` |
| `src/screens/main/AIReportScreen.tsx` | modify | `useClasses()` for context |
| `src/services/infiniteCampus.ts` | modify | Fix wrong portal URLs in `DISTRICTS`; delete `IC_SCRAPER_JS`, `parseICPayload`, `ICMessage`, `ICPayload`, `ParsedICData` |
| `src/services/icSpike.ts` | **delete** | Spike code, replaced by `icClient.ts` + `icMapper.ts` |
| `src/screens/main/IcSpikeScreen.tsx` | **delete** | Spike UI, no longer needed |
| `src/navigation/RootNavigator.tsx` | modify | Drop `IcSpike` route + import; restore dynamic `onboardingDone` handling |
| `src/data/mock.ts` | keep | Becomes demo-mode fallback (Phase 2 wires the toggle) |
| `package.json` | modify | Remove `@react-native-cookies/cookies`; add `react-native-nitro-cookies` |
| `README.md` | modify | Document new architecture, drop spike sections |

---

## Layered architecture

```
[Screens] ─use*─→ [DataContext] ─owns→ [IcClient] ─Cookie→ [native fetch]
                       │                    ↑
                       │                    │ created by
                       └─uses────→ [useIcAuth hook] ─watches→ [WebView]
                       │                    │
                       │                    └─reads→ [react-native-nitro-cookies]
                       │
                       └─maps─via→ [icMapper] (pure functions)
```

---

## Endpoint mapping

| Endpoint | Maps to | Screen consumers |
|---|---|---|
| `/campus/resources/my/userAccount` | `UserProfile` | Settings (profile card) |
| `/campus/resources/portal/grades?modifiedDate=...` | `ClassItem[]` + `Record<string, SubjectDetail>` | Dashboard, SubjectDetail, WhatIf, AIReport |
| `/campus/api/portal/assignment/recentlyScored?modifiedDate=...` | `AttentionGroup[]` | Attention |
| `/campus/resources/portal/roster?_expand={sectionPlacements-{term}}&_date=...` | term/period metadata | (deferred to Phase 2 schedule view) |

---

## Mapper logic notes

- **Term picking** (`pickActiveTermGrade`): within a course's `gradingTasks[]`, prefer the latest term (T4 > T3 > T2 > T1), and within a term prefer `Semester Grade` > `Quarter Grade` > `Progress Grade`.
- **Letter grade**: use IC's `progressScore` when present (it respects `curveID` and `groupWeighted`), fallback to derived letter from `progressPercent`.
- **Color thresholds**: keep current `colorForPct()` logic from `services/infiniteCampus.ts` (≥87 good, ≥75 warn, else bad).
- **Attention items** from `recentlyScored`: flag `late || missing || cheated || incomplete || dropped` as `sev: 'bad'`; `scorePercentage < 75` (and not flagged) as `sev: 'warn'`.
- **Term portability** — instead of hardcoding SRVUSD's `sem2TermIDs = [3403, 3404]` like `Login.jsx` did, use `parseInt(termName.replace(/^T/, '')) >= 3` to detect Sem 2 (works for any district using T1–T4 naming).

---

## Auth flow

```
1. App boot → RootNavigator checks DataContext.user
2. If null → push Onboarding stack
3. WelcomeScreen → DistrictScreen → SignInWebViewScreen
4. SignInWebViewScreen mounts <WebView source={districtPortalUrl}>
   - watches onNavigationStateChange for IC SPA shell URL
   - on detection: extractIcCookies(origin) → buildCookieHeader → close WebView
   - constructs IcClient(cookieHeader) → stashes in DataContext
5. FirstSyncScreen → DataContext.refresh() fires all 4 endpoints in parallel
6. On done: navigation.replace('Main')
7. Main screens render real data via use* hooks
8. Sign out (or app kill): DataContext clears all state → re-auth on next launch
```

---

## Implementation tasks (numbered for execution)

### Step 1 — Install dependencies (sequential, main session)

- [ ] `npm uninstall @react-native-cookies/cookies && npx expo install react-native-nitro-cookies`
- [ ] Verify install: `node -e "console.log(require('react-native-nitro-cookies/package.json').version)"`
- [ ] Commit: `deps: swap to react-native-nitro-cookies (deprecation fix + New Arch ready)`

### Step 2 — Create `src/services/icTypes.ts` (sequential, main session)

Pure types file. No imports from other project files (foundation for all of Step 3).

Contents (raw IC response types pinned to captured schemas):

```typescript
// Raw response types from IC's portal API. Pinned to schemas captured
// from real SRVUSD DevTools traffic on 2026-04-26.

export interface RawUserAccount {
  _id: string;
  userID: number;
  personID: number;
  username: string;
  currentIdentityID: number;
  firstName: string;
  lastName: string;
  isSAMLAccount: boolean;
  homepage: string;
  active: boolean;
  hasEmail: boolean;
}

export interface RawGradingTask {
  _id: string;
  personID: number;
  trialID: number;
  calendarID: number;
  structureID: number;
  courseID: number;
  courseName: string;
  sectionID: number;
  taskID: number;
  termGPA?: number;
  termID: number;
  hasAssignments: boolean;
  taskName: string; // "Semester Grade" | "Quarter Grade" | "Progress Grade" | other
  scoreID?: number;
  progressScore?: string; // letter grade (IC's official)
  progressPercent?: number;
  progressPointsEarned?: number;
  progressTotalPoints?: number;
  modifiedDate?: string;
  termName: string; // "T1" | "T2" | "T3" | "T4"
  termSeq: number;
}

export interface RawCourse {
  _id: string;
  rosterID: number;
  personID: number;
  structureID: number;
  calendarID: number;
  schoolID: number;
  courseID: number;
  sectionID: number;
  courseName: string;
  courseNumber: string;
  sectionNumber: string;
  endYear: number;
  schoolName: string;
  trialID: number;
  trialActive: boolean;
  roomName: string;
  teacherDisplay: string;
  dropped?: boolean;
  gradingTasks: RawGradingTask[];
  sectionPlacements: unknown[];
}

export interface RawGradesEnrollment {
  enrollmentID: number;
  schoolID: number;
  calendarID: number;
  structureID: number;
  displayName: string; // "25-26 [school name]"
  endDate: string | null;
  grade: string; // grade level e.g. "10"
  gradesEnabled: boolean;
  assignmentsEnabled: boolean;
  courses: RawCourse[];
}

export type RawGradesResponse = RawGradesEnrollment[];

export interface RawRecentlyScored {
  objectSectionID: number;
  parentObjectSectionID: number | null;
  type: number;
  personID: number;
  taskID: number;
  groupActivityID: number;
  termIDs: number[];
  assignmentName: string;
  calendarID: number;
  structureID: number;
  sectionID: number;
  dueDate: string;
  assignedDate: string;
  scoreModifiedDate: string;
  courseName: string;
  active: boolean;
  scoringType: string;
  score: string | null;
  scorePoints: string | null;
  scorePercentage: string | null;
  totalPoints: number;
  late: boolean;
  missing: boolean;
  cheated: boolean;
  dropped: boolean;
  incomplete: boolean;
  turnedIn: boolean;
}

export interface RawRosterEntry {
  _id: string;
  rosterID: number;
  personID: number;
  sectionID: number;
  courseID: number;
  courseName: string;
  courseNumber: string;
  sectionNumber: string;
  schoolName: string;
  teacherDisplay: string;
  roomName: string;
  sectionPlacements: Array<{
    sectionID: number;
    termID: number;
    termName: string;
    termSeq: number;
    periodName: string;
    teacherDisplay: string;
    term: {
      termID: number;
      termName: string;
      seq: number;
      startDate: string;
      endDate: string;
    };
    roomName: string;
  }>;
}

// App-domain projection of the user (replaces MockUser shape).
export interface UserProfile {
  personID: number;
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  username: string;
  school: string | null;       // derived from grades.displayName
  gradeLevel: string | null;   // from grades.grade
}
```

- [ ] Run `npm run typecheck` after creation
- [ ] Commit: `feat(ic): add raw + domain types for IC integration`

### Step 3 — Parallel: `icClient.ts` + `icMapper.ts`

Two subagents dispatched simultaneously. Both depend only on `icTypes.ts` (now committed) + existing app types + `react-native-nitro-cookies` (now installed).

#### Step 3a — `src/services/icClient.ts`

Class with a private `cookieHeader` and typed methods. Each method does a native `fetch` with the explicit `Cookie` header, throws on non-2xx, returns parsed JSON.

```typescript
import type {
  RawUserAccount, RawGradesResponse, RawRecentlyScored, RawRosterEntry,
} from './icTypes';

export class IcClient {
  constructor(
    private readonly origin: string,
    private readonly cookieHeader: string,
  ) {}

  private async getJson<T>(path: string): Promise<T> {
    const url = `${this.origin}${path}${path.includes('?') ? '&' : '?'}_t=${Date.now()}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Cookie: this.cookieHeader,
        Accept: 'application/json, text/plain, */*',
        'Cache-Control': 'no-cache, no-store',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) {
      throw new IcClientError(res.status, path, await res.text().catch(() => ''));
    }
    return res.json() as Promise<T>;
  }

  getUserAccount() {
    return this.getJson<RawUserAccount>('/campus/resources/my/userAccount');
  }

  getGrades(modifiedDateIso?: string) {
    const q = modifiedDateIso ? `?modifiedDate=${encodeURIComponent(modifiedDateIso)}` : '';
    return this.getJson<RawGradesResponse>(`/campus/resources/portal/grades${q}`);
  }

  getRecentlyScored(modifiedDateIso?: string) {
    const q = modifiedDateIso ? `?modifiedDate=${encodeURIComponent(modifiedDateIso)}` : '';
    return this.getJson<RawRecentlyScored[]>(`/campus/api/portal/assignment/recentlyScored${q}`);
  }

  getRoster(dateIso?: string) {
    const expand = '_expand=' + encodeURIComponent('{sectionPlacements-{term}}');
    const date = dateIso ? `&_date=${encodeURIComponent(dateIso)}` : '';
    return this.getJson<RawRosterEntry[]>(`/campus/resources/portal/roster?${expand}${date}`);
  }
}

export class IcClientError extends Error {
  constructor(public status: number, public path: string, public body: string) {
    super(`IC ${status} on ${path}`);
    this.name = 'IcClientError';
  }
}

export const SRVUSD_ORIGIN = 'https://srvusd.infinitecampus.org';
export const SRVUSD_PORTAL_URL =
  'https://srvusd.infinitecampus.org/campus/portal/students/sanRamon.jsp';
```

- [ ] Subagent runs `npm run typecheck` after creation
- [ ] Commit (subagent): `feat(ic): add IcClient with typed methods for the 4 portal endpoints`

#### Step 3b — `src/services/icMapper.ts`

Pure functions only — no React, no async. Each function takes raw IC types and returns app domain types from `src/types/index.ts`.

```typescript
import type {
  ClassItem, SubjectDetail, Category, HistoryPoint, Assignment,
  AttentionGroup, AttentionItem,
} from '../types';
import type {
  RawUserAccount, RawGradesResponse, RawRecentlyScored,
  RawCourse, RawGradingTask, UserProfile,
} from './icTypes';

const TASK_PRIORITY: Record<string, number> = {
  'Semester Grade': 3,
  'Quarter Grade': 2,
  'Progress Grade': 1,
};

export function colorForPct(pct: number): 'good' | 'warn' | 'bad' {
  if (pct >= 87) return 'good';
  if (pct >= 75) return 'warn';
  return 'bad';
}

export function letterForPct(pct: number): string {
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 67) return 'D+';
  if (pct >= 60) return 'D';
  return 'F';
}

/** Pick the most recent, highest-priority grading task that has an actual percent. */
export function pickActiveTermGrade(tasks: RawGradingTask[]): RawGradingTask | null {
  const scored = tasks.filter(t => t.progressPercent != null);
  if (scored.length === 0) return null;
  return scored.slice().sort((a, b) => {
    if (b.termSeq !== a.termSeq) return b.termSeq - a.termSeq;
    return (TASK_PRIORITY[b.taskName] ?? 0) - (TASK_PRIORITY[a.taskName] ?? 0);
  })[0]!;
}

/** T3/T4 → S2, T1/T2 → S1. Portable across districts using Tn naming. */
export function semesterFromTermName(termName: string): string {
  const n = parseInt(termName.replace(/^T/i, ''), 10);
  if (Number.isNaN(n)) return termName;
  return n >= 3 ? 'S2' : 'S1';
}

export function mapUserAccount(raw: RawUserAccount, grades?: RawGradesResponse): UserProfile {
  const enrollment = grades?.[0];
  const fullName = `${raw.firstName} ${raw.lastName}`.trim();
  const initials = `${raw.firstName[0] ?? ''}${raw.lastName[0] ?? ''}`.toUpperCase();
  // displayName looks like "25-26 [School Name]" — strip the year prefix.
  const school = enrollment?.displayName
    ? enrollment.displayName.replace(/^\d{2}-\d{2}\s+/, '')
    : null;
  return {
    personID: raw.personID,
    firstName: raw.firstName,
    lastName: raw.lastName,
    fullName,
    initials,
    username: raw.username,
    school,
    gradeLevel: enrollment?.grade ?? null,
  };
}

export function mapGradesToClasses(raw: RawGradesResponse): ClassItem[] {
  const classes: ClassItem[] = [];
  for (const enrollment of raw) {
    for (const course of enrollment.courses) {
      if (course.dropped) continue;
      const task = pickActiveTermGrade(course.gradingTasks);
      const pct = task?.progressPercent ?? 0;
      const letter = task?.progressScore?.trim() || letterForPct(pct);
      classes.push({
        id: String(course.sectionID),
        code: course.courseNumber,
        name: course.courseName,
        term: task ? semesterFromTermName(task.termName) : 'S2',
        teacher: course.teacherDisplay,
        letter,
        pct,
        trend: 0, // history endpoint not in Phase 1
        color: colorForPct(pct),
        next: '',
        flags: 0,
      });
    }
  }
  return classes;
}

export function mapGradesToSubjectDetails(raw: RawGradesResponse): Record<string, SubjectDetail> {
  const out: Record<string, SubjectDetail> = {};
  for (const enrollment of raw) {
    for (const course of enrollment.courses) {
      if (course.dropped) continue;
      const sid = String(course.sectionID);
      // Categories + history not in current grades response — will be empty in v1.
      // Phase 2 wires per-section categories + assignment listings.
      out[sid] = {
        categories: [],
        history: [],
        assignments: [],
      };
    }
  }
  return out;
}

export function mapRecentlyScoredToAttention(raw: RawRecentlyScored[]): AttentionGroup[] {
  const flagged: AttentionItem[] = [];
  const lowScore: AttentionItem[] = [];

  for (const item of raw) {
    const isFlagged = item.late || item.missing || item.cheated || item.dropped || item.incomplete;
    const pct = parseFloat(item.scorePercentage ?? '');
    const score = item.scorePoints != null && item.totalPoints != null
      ? `${item.scorePoints} / ${item.totalPoints}`
      : '—';
    const due = item.dueDate ? item.dueDate.slice(0, 10) : '';
    const entry: AttentionItem = {
      class: item.courseName,
      title: item.assignmentName,
      due,
      score,
      pct: item.scorePercentage ? `${item.scorePercentage}%` : undefined,
    };
    if (isFlagged) flagged.push(entry);
    else if (!Number.isNaN(pct) && pct < 75) lowScore.push(entry);
  }

  const groups: AttentionGroup[] = [];
  if (flagged.length) groups.push({ name: 'Missing or flagged', sev: 'bad', items: flagged });
  if (lowScore.length) groups.push({ name: 'Low scores (<75%)', sev: 'warn', items: lowScore });
  return groups;
}
```

- [ ] Subagent runs `npm run typecheck` after creation
- [ ] Commit (subagent): `feat(ic): add icMapper pure functions for IC raw → app domain`

### Step 4 — `src/context/DataContext.tsx` + `src/hooks/useIcAuth.ts` (sequential, main session)

These integrate everything from Steps 2–3.

#### Step 4a — `src/context/DataContext.tsx`

```typescript
import React, { createContext, useCallback, useContext, useState } from 'react';
import type { ClassItem, SubjectDetail, AttentionGroup } from '../types';
import type { UserProfile } from '../services/icTypes';
import { IcClient, SRVUSD_ORIGIN } from '../services/icClient';
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
  client: null, user: null, classes: [],
  subjectDetails: {}, attention: [],
  syncedAt: null, syncStep: 'idle', syncError: null,
};

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DataState>(initialState);

  const setClient = useCallback((client: IcClient) => {
    setState(s => ({ ...s, client }));
  }, []);

  const refresh = useCallback(async () => {
    setState(s => {
      if (!s.client) {
        return { ...s, syncError: 'Not authenticated', syncStep: 'idle' };
      }
      return { ...s, syncStep: 'user', syncError: null };
    });

    // Re-read state synchronously inside the closure isn't safe with useState;
    // capture the client ref via setState callback above is fine because if
    // there's no client we set syncError and the rest of the function bails.
    let client: IcClient | null = null;
    setState(s => { client = s.client; return s; });
    if (!client) return;

    try {
      const userRaw = await client.getUserAccount();
      setState(s => ({ ...s, syncStep: 'grades' }));
      const gradesRaw = await client.getGrades();
      setState(s => ({ ...s, syncStep: 'attention' }));
      const recentRaw = await client.getRecentlyScored();

      const user = mapUserAccount(userRaw, gradesRaw);
      const classes = mapGradesToClasses(gradesRaw);
      const subjectDetails = mapGradesToSubjectDetails(gradesRaw);
      const attention = mapRecentlyScoredToAttention(recentRaw);

      setState(s => ({
        ...s,
        user, classes, subjectDetails, attention,
        syncedAt: Date.now(), syncStep: 'done', syncError: null,
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setState(s => ({ ...s, syncError: msg, syncStep: 'idle' }));
    }
  }, []);

  const signOut = useCallback(() => setState(initialState), []);

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
export const useUser = () => useDataContext().user;
export const useClasses = () => useDataContext().classes;
export const useSubjectDetail = (id: string) => useDataContext().subjectDetails[id] ?? null;
export const useAttention = () => useDataContext().attention;
```

#### Step 4b — `src/hooks/useIcAuth.ts`

Exports a small helper that does the cookie capture and creates an `IcClient`. The actual WebView lives in `SignInWebViewScreen` — this hook is just the capture-and-build logic so the screen stays focused on UI.

```typescript
import CookieManager from 'react-native-nitro-cookies';
import { IcClient, SRVUSD_ORIGIN } from '../services/icClient';

type CookieMap = Record<string, { value: string }>;

export async function captureIcClient(origin: string = SRVUSD_ORIGIN): Promise<IcClient> {
  const cookies = (await CookieManager.get(origin, true)) as CookieMap;
  if (!('JSESSIONID' in cookies)) {
    throw new Error('No JSESSIONID in WKHTTPCookieStore — login may not have completed');
  }
  const cookieHeader = Object.entries(cookies)
    .map(([name, c]) => `${name}=${c.value}`)
    .join('; ');
  return new IcClient(origin, cookieHeader);
}

/** Heuristic for "WebView reached the IC SPA shell, cookies are now durable." */
export function isPostLoginUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (!lower.includes('infinitecampus.org')) return false;
  if (lower.includes('/campus/nav-wrapper')) return true;
  if (lower.includes('/campus/sso/') && lower.includes('/sis/')) return true;
  if (lower.includes('appname=')) return true;
  return false;
}
```

- [ ] Run `npm run typecheck`
- [ ] Commit: `feat(ic): add DataContext + useIcAuth hook`

### Step 5 — Wire `App.tsx` + update `src/types/index.ts` (sequential, main session)

#### Step 5a — `App.tsx`

```typescript
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { DataProvider } from './src/context/DataContext';
import { RootNavigator } from './src/navigation/RootNavigator';

function AppContent() {
  const { dark } = useTheme();
  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
```

#### Step 5b — `src/types/index.ts`

Add `UserProfile` re-export (so screens import from a single domain types module) and remove `IcSpike` from `RootStackParamList`.

```diff
+export type { UserProfile } from '../services/icTypes';

 export type RootStackParamList = {
   Onboarding: undefined;
   Main: undefined;
-  IcSpike: undefined;
 };
```

- [ ] Run `npm run typecheck` (will fail on screens that reference removed `IcSpike` or use `MockUser`/`MockClasses` — that's expected, fixed in Step 6).
- [ ] **Don't commit yet** — type-broken state is OK because Step 6 resolves it.

### Step 6 — PARALLEL ×8: Screen wiring (subagent fan-out)

Each subagent gets one screen and a self-contained prompt. All 8 dispatched simultaneously.

| Agent | File | Change | New imports / hooks used |
|---|---|---|---|
| A | `src/screens/main/DashboardScreen.tsx` | Replace `MockClasses` with `useClasses()` | `import { useClasses } from '../../context/DataContext'` |
| B | `src/screens/main/SubjectDetailScreen.tsx` | Replace `MockPreCalc` with `useSubjectDetail(classId)` + class lookup from `useClasses()` | `useClasses, useSubjectDetail` |
| C | `src/screens/main/AttentionScreen.tsx` | Replace `MockAttention` with `useAttention()` | `useAttention` |
| D | `src/screens/main/SettingsScreen.tsx` | Replace `MockUser` with `useUser()`. **Also remove**: 5-tap detector, `tapCount`/`tapTimer` refs, `useNavigation`+`RootStackParamList` imports, `onVersionTap` handler. Restore version label to plain `<Text>`. | `useUser` |
| E | `src/screens/main/WhatIfScreen.tsx` | Use `useClasses()` instead of mock import | `useClasses` |
| F | `src/screens/main/AIReportScreen.tsx` | Use `useClasses()` for class lookup | `useClasses` |
| G | `src/screens/onboarding/SignInWebViewScreen.tsx` | Strip `IC_SCRAPER_JS` injection, `onMessage`/`postMessage`, parser-driven phases. New flow: `onNavigationStateChange` watches for `isPostLoginUrl(url)`; on match → `captureIcClient()` → `setClient()` from DataContext → `navigation.replace('FirstSync')`. Close WebView via unmount on navigation. | `useData, captureIcClient, isPostLoginUrl` |
| H | `src/screens/onboarding/FirstSyncScreen.tsx` | On mount: call `useData().refresh()`. Display step-by-step progress (`syncStep`). On `syncStep === 'done'`: `navigation.replace('Main')`. On `syncError`: render error with retry button. | `useData` |

Each subagent commit prefix: `feat(ic): wire <ScreenName> to DataContext` (or `refactor(auth):` for G/H).

### Step 7 — PARALLEL ×3: Cleanup (subagent fan-out)

Three subagents in parallel:

| Agent | Task | Files |
|---|---|---|
| I | Delete spike code | `rm src/services/icSpike.ts src/screens/main/IcSpikeScreen.tsx`; in `src/navigation/RootNavigator.tsx` remove `IcSpikeScreen` import + the `IcSpike` `<Stack.Screen>` element + restore `onboardingDone = false` default |
| J | Fix DISTRICTS portal URLs in `src/services/infiniteCampus.ts` to use real schoolKeys (verify each via the IC public district lookup if known; for now: SRVUSD → `sanRamon.jsp`, others → flag with `// TODO: verify schoolKey` comment); also delete `IC_SCRAPER_JS`, `parseICPayload`, `ICMessage`, `ICPayload`, `ParsedICData` exports | `src/services/infiniteCampus.ts` |
| K | Update `README.md`: remove the spike section, document the new IC integration architecture (DataContext + IcClient layered design), update Status section | `README.md` |

Commit prefixes: `chore(cleanup):` for I and K, `fix:` for J.

### Step 8 — Final verification + integration commit (sequential, main session)

- [ ] `npm run typecheck` — must be clean
- [ ] `git status` — should show only `ios/` untracked, working tree otherwise clean
- [ ] `git log --oneline -20` — review the per-step commit history

### Step 9 — On-device manual verification (you, after build)

- [ ] `npm run ios`
- [ ] App boots → Welcome → District → SignInWebView → real ClassLink login
- [ ] WebView **closes immediately** when `isPostLoginUrl()` fires (visible: modal disappears as soon as `/campus/nav-wrapper` is reached)
- [ ] FirstSync shows progress through user → grades → attention steps
- [ ] Dashboard renders **real classes** (not mock Pre-Calc/AP CS/etc.)
- [ ] Tap a class → SubjectDetail renders real class header (categories/history empty in v1 — Phase 2 fills them)
- [ ] Attention tab shows real recently-graded items grouped by missing/low-score
- [ ] Settings tab shows real student name + school
- [ ] Sign out (when implemented) → state clears, re-auth on next launch

---

## Verification (end-to-end)

1. `npm run typecheck` exits clean
2. App boots without crashes (no `useData must be used within DataProvider` errors)
3. ClassLink → Microsoft → IC → cookies captured → 4 endpoints fetch → all 6 main screens render real data
4. Killing the app and relaunching forces re-auth (no AsyncStorage means no auto-restore — that's the design)
5. Network kill mid-sync surfaces an error in FirstSyncScreen with a retry button

---

## Self-review checklist (already performed)

- **Spec coverage:** Every section of the design from the brainstorm conversation has a corresponding step. Auth flow → Step 5–6 (G/H). Mapper logic → Step 3b. State management = React Context → Step 4a. In-memory only → no `persist.ts` task. Cookie-package swap → Step 1. Spike cleanup → Step 7.
- **Placeholders:** Searched for "TBD"/"TODO" inside implementation steps — only real TODOs are: (a) districts other than SRVUSD have `// TODO: verify schoolKey` comments in Step 7 task J, (b) per-section categories + assignments deferred to Phase 2 (called out explicitly in `mapGradesToSubjectDetails` body).
- **Type consistency:** `IcClient`, `RawUserAccount`, `RawGradesResponse`, `RawRecentlyScored` defined in Steps 2–3 are consumed verbatim in Step 4. `UserProfile` defined in Step 2 is re-exported via Step 5b and consumed via `useUser()` in Step 6 task D.
- **Scope:** Single subsystem (IC integration). Within bounds for one Phase 1 PR per the user's explicit decision.
