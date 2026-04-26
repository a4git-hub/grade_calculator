# IC Cookie Capture Spike — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a hidden debug screen that proves we can capture HttpOnly cookies after ClassLink SSO and use them in a native fetch — validating the architecture before we touch any existing IC scraper code.

**Architecture:** A new isolated screen (`IcSpikeScreen`) reachable only via a 5-tap gesture on the Settings app-version label. The screen mounts a stripped-down `<WebView>` (no injected JS), watches `onNavigationStateChange` to detect login completion, then on user tap calls `CookieManager.get(origin, true)` to read cookies including HttpOnly `JSESSIONID`, builds an explicit `Cookie` header, and issues a native RN `fetch()` to `/campus/resources/portal/students`. Pure logic lives in a separate `icSpike.ts` service file so it's trivially deletable when promoted to Phase 1.

**Tech Stack:** React Native 0.83 + Expo SDK 55, TypeScript, `react-native-webview`, `@react-native-cookies/cookies` (new), React Navigation 7 (existing).

**Companion spec:** `docs/superpowers/specs/2026-04-26-ic-cookie-capture-spike-design.md`

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `src/services/icSpike.ts` | **create** | Pure logic: `buildCookieHeader`, `isLoginUrl`, `extractIcCookies`, `fetchStudents`. No React, no UI. Easy to delete or promote when done. |
| `src/screens/main/IcSpikeScreen.tsx` | **create** | The debug screen UI: WebView + capture button + result panel. Self-contained. |
| `src/types/index.ts` | **modify** | Add `IcSpike: undefined` to `RootStackParamList`. |
| `src/navigation/RootNavigator.tsx` | **modify** | Register `IcSpike` as a modal screen on the root stack so it can be pushed from anywhere. |
| `src/screens/main/SettingsScreen.tsx` | **modify** | Wrap the existing app-version `Text` with a `TouchableOpacity` that counts 5 rapid taps and navigates to `IcSpike`. |
| `package.json` / `package-lock.json` | **modify** | Add `@react-native-cookies/cookies` via `npx expo install`. |

No existing IC scraper code is touched. The whole spike is reversible by deleting two files and undoing three small edits.

---

## Task 1: Add the `@react-native-cookies/cookies` dependency

**Files:**
- Modify: `package.json`, `package-lock.json` (auto-updated)

**Why:** This is the native module that reads from `WKHTTPCookieStore` with `useWebKit: true`, which is the only way to access HttpOnly cookies like `JSESSIONID`. `npx expo install` (rather than plain `npm install`) picks the version aligned with the installed Expo SDK.

- [ ] **Step 1: Install the dependency**

Run from the repo root:

```bash
npx expo install @react-native-cookies/cookies
```

Expected output: line containing `+ @react-native-cookies/cookies@<version>` and the `package.json` `dependencies` block now contains the new entry.

- [ ] **Step 2: Verify install**

```bash
node -e "console.log(require('@react-native-cookies/cookies/package.json').version)"
```

Expected output: a version string (e.g. `6.x.y`). If you get `Cannot find module`, rerun step 1.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add @react-native-cookies/cookies for IC cookie spike"
```

---

## Task 2: Create the pure logic service `src/services/icSpike.ts`

**Files:**
- Create: `src/services/icSpike.ts`

**Why:** Pure functions in their own file are trivially testable, trivially deletable, and trivially promotable to a real `icClient.ts` once the spike validates the architecture.

- [ ] **Step 1: Create the file with all pure logic**

Write `src/services/icSpike.ts` with the following exact content:

```typescript
// Cookie-capture spike — pure logic only.
// All UI lives in IcSpikeScreen.tsx. Delete this file when the spike is
// promoted to Phase 1 (icClient.ts) or rolled back.

import CookieManager from '@react-native-cookies/cookies';

/** SRVUSD portal entry URL — matches the existing DISTRICTS[2] entry. */
export const SPIKE_PORTAL_URL =
  'https://srvusd.infinitecampus.org/campus/portal/students/srvusd.jsp';

/** Origin used for cookie reads + fetch base. Origin = scheme + host. */
export const SPIKE_ORIGIN = 'https://srvusd.infinitecampus.org';

/** Single endpoint we hit to validate the cookie-based architecture. */
export const STUDENTS_ENDPOINT = '/campus/resources/portal/students';

/** Shape returned by CookieManager.get(). */
type CookieMap = Record<string, { value: string; name?: string }>;

/**
 * Serialize a CookieManager response into an HTTP Cookie header.
 * Example output: "JSESSIONID=ABC123; ic_sis_login_session=xyz"
 */
export function buildCookieHeader(cookies: CookieMap): string {
  return Object.entries(cookies)
    .map(([name, c]) => `${name}=${c.value}`)
    .join('; ');
}

/**
 * Returns true when a navigation URL indicates the IC portal SPA has loaded
 * post-authentication. Heuristic — we'll log every nav event during the
 * spike and tighten this if real flows show different patterns.
 */
export function isLoginUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (lower.includes('/portal/main.jsp')) return true;
  if (lower.includes('appname=portal')) return true;
  return false;
}

export interface CookieCaptureResult {
  /** Names only — values omitted from logging for privacy. */
  cookieNames: string[];
  /** Pass criterion #1: HttpOnly session cookie was readable. */
  hasJSESSIONID: boolean;
  /** Ready to drop into a fetch() Authorization-equivalent header. */
  cookieHeader: string;
}

/**
 * Read cookies for the given origin via WKHTTPCookieStore.
 * useWebKit:true is REQUIRED — without it we get document.cookie semantics
 * which cannot see HttpOnly cookies.
 */
export async function extractIcCookies(
  origin: string = SPIKE_ORIGIN,
): Promise<CookieCaptureResult> {
  const cookies = (await CookieManager.get(origin, true)) as CookieMap;
  return {
    cookieNames: Object.keys(cookies),
    hasJSESSIONID: 'JSESSIONID' in cookies,
    cookieHeader: buildCookieHeader(cookies),
  };
}

export interface FetchStudentsResult {
  /** Pass criterion #2: HTTP 200 from a real authenticated endpoint. */
  status: number;
  ok: boolean;
  /** Parsed JSON if the body parsed cleanly, else null. */
  body: unknown;
  /** Raw response text — populated when JSON parse fails so we can debug. */
  rawText: string | null;
  /** Pass criterion #3: a personID we can use for downstream calls. */
  personID: string | number | null;
}

/**
 * Native RN fetch with the explicit Cookie header. NSURLSession on iOS —
 * no CORS, no DOM, no popup weirdness.
 */
export async function fetchStudents(
  cookieHeader: string,
  origin: string = SPIKE_ORIGIN,
): Promise<FetchStudentsResult> {
  const url = `${origin}${STUDENTS_ENDPOINT}?_t=${Date.now()}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Cookie: cookieHeader,
      Accept: 'application/json',
      'Cache-Control': 'no-cache, no-store',
      Pragma: 'no-cache',
    },
  });
  const rawText = await res.text();
  let body: unknown = null;
  let personID: string | number | null = null;
  let parseFailed = false;
  try {
    body = JSON.parse(rawText);
    if (Array.isArray(body) && body.length > 0) {
      const first = body[0] as { personID?: string | number; studentPersonID?: string | number };
      personID = first.personID ?? first.studentPersonID ?? null;
    }
  } catch {
    parseFailed = true;
  }
  return {
    status: res.status,
    ok: res.ok,
    body: parseFailed ? null : body,
    rawText: parseFailed ? rawText : null,
    personID,
  };
}
```

- [ ] **Step 2: Typecheck**

Run:

```bash
npm run typecheck
```

Expected: clean exit, no errors.

If you get `Cannot find module '@react-native-cookies/cookies'`, Task 1 wasn't completed — go back.

- [ ] **Step 3: Commit**

```bash
git add src/services/icSpike.ts
git commit -m "feat: add icSpike service with pure cookie + fetch helpers"
```

---

## Task 3: Add `IcSpike` to `RootStackParamList`

**Files:**
- Modify: `src/types/index.ts:56-59`

**Why:** Registering the route in the type alias means TypeScript catches mismatched navigation calls at compile time, AND the screen lives at the root stack level (above the tab navigator) so it presents over the entire UI like a modal — no tab bar at the bottom of a debug screen.

- [ ] **Step 1: Add the route to the type**

Edit `src/types/index.ts`. Find this block (lines 56-59):

```typescript
export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};
```

Replace with:

```typescript
export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  IcSpike: undefined;
};
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: clean exit. (No consumers reference `IcSpike` yet — that's coming.)

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "types: register IcSpike route on RootStackParamList"
```

---

## Task 4: Create `src/screens/main/IcSpikeScreen.tsx`

**Files:**
- Create: `src/screens/main/IcSpikeScreen.tsx`

**Why:** The debug screen itself. Renders a WebView for SSO, a capture button that activates after login is detected, and a result panel showing pass/fail for each of the three spike criteria plus the raw response body for debugging.

- [ ] **Step 1: Create the file with the full screen**

Write `src/screens/main/IcSpikeScreen.tsx` with the following exact content:

```typescript
import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { monoStyle } from '../../tokens';
import {
  SPIKE_PORTAL_URL, SPIKE_ORIGIN,
  isLoginUrl, extractIcCookies, fetchStudents,
  type CookieCaptureResult, type FetchStudentsResult,
} from '../../services/icSpike';

type Props = NativeStackScreenProps<RootStackParamList, 'IcSpike'>;
type Phase = 'awaiting-login' | 'logged-in' | 'running' | 'done';

export function IcSpikeScreen({ navigation }: Props) {
  const { T } = useTheme();
  const webRef = useRef<WebView>(null);

  const [phase, setPhase] = useState<Phase>('awaiting-login');
  const [navLog, setNavLog] = useState<string[]>([]);
  const [cookies, setCookies] = useState<CookieCaptureResult | null>(null);
  const [fetched, setFetched] = useState<FetchStudentsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onNav = (e: WebViewNavigation) => {
    // Keep last 10 navigation URLs visible so we can tighten the predicate.
    setNavLog((prev) => [...prev.slice(-9), e.url]);
    // eslint-disable-next-line no-console
    console.log('[IcSpike] nav →', e.url);
    if (phase === 'awaiting-login' && isLoginUrl(e.url)) {
      setPhase('logged-in');
    }
  };

  const runSpike = async () => {
    setPhase('running');
    setError(null);
    try {
      const c = await extractIcCookies(SPIKE_ORIGIN);
      setCookies(c);
      const f = await fetchStudents(c.cookieHeader, SPIKE_ORIGIN);
      setFetched(f);
      setPhase('done');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setPhase('done');
    }
  };

  const passJSession = !!cookies?.hasJSESSIONID;
  const passStatus = !!fetched && fetched.status === 200;
  const passPersonID = !!fetched && fetched.personID != null && fetched.personID !== '';

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={[styles.backText, { color: T.ink }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[monoStyle(T)]} numberOfLines={1}>IC Cookie Spike</Text>
          <View style={{ width: 64 }} />
        </View>

        {/* Phase strip */}
        <View style={[styles.status, { backgroundColor: T.surface, borderColor: T.hairline }]}>
          {phase === 'running'
            ? <ActivityIndicator size="small" color={T.accent} />
            : <View style={[styles.dot, {
                backgroundColor:
                  phase === 'done' ? (passJSession && passStatus && passPersonID ? T.good : T.bad)
                  : phase === 'logged-in' ? T.accent
                  : T.text3,
              }]} />}
          <Text style={[styles.statusText, { color: T.text }]}>
            {phase === 'awaiting-login' && 'Awaiting ClassLink login…'}
            {phase === 'logged-in' && 'Login detected — ready to capture.'}
            {phase === 'running' && 'Capturing cookies & calling IC…'}
            {phase === 'done' && 'Spike complete — see results below.'}
          </Text>
        </View>

        {/* WebView (SSO surface only — no injected JS) */}
        <View style={[styles.webWrap, { borderColor: T.hairline }]}>
          <WebView
            ref={webRef}
            source={{ uri: SPIKE_PORTAL_URL }}
            originWhitelist={['https://*']}
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            javaScriptEnabled
            domStorageEnabled
            onNavigationStateChange={onNav}
            startInLoadingState
            renderLoading={() => (
              <View style={[styles.loading, { backgroundColor: T.bg }]}>
                <ActivityIndicator color={T.accent} />
              </View>
            )}
          />
        </View>

        {/* Capture button */}
        <TouchableOpacity
          onPress={runSpike}
          disabled={phase !== 'logged-in'}
          activeOpacity={0.85}
          style={[
            styles.button,
            { backgroundColor: phase === 'logged-in' ? T.accent : T.surface3 },
          ]}
        >
          <Text style={[styles.buttonText, { color: phase === 'logged-in' ? '#fff' : T.text3 }]}>
            {phase === 'running' ? 'Running…' : 'Capture cookies & test fetch'}
          </Text>
        </TouchableOpacity>

        {/* Result panel */}
        <ScrollView
          style={styles.results}
          contentContainerStyle={{ padding: 14 }}
          showsVerticalScrollIndicator
        >
          {phase === 'done' && (
            <>
              <ResultRow
                T={T}
                label="1. JSESSIONID captured (HttpOnly readable)"
                pass={passJSession}
                detail={cookies?.cookieNames.length
                  ? `Cookies: ${cookies.cookieNames.join(', ')}`
                  : 'No cookies returned'}
              />
              <ResultRow
                T={T}
                label="2. HTTP 200 from /campus/resources/portal/students"
                pass={passStatus}
                detail={fetched ? `status=${fetched.status}` : '(fetch did not run)'}
              />
              <ResultRow
                T={T}
                label="3. personID parseable from response body"
                pass={passPersonID}
                detail={fetched
                  ? `personID=${String(fetched.personID ?? 'null')}`
                  : '(no body)'}
              />

              {error && (
                <Text style={[styles.errorText, { color: T.bad }]}>
                  Error: {error}
                </Text>
              )}

              <Text style={[styles.sectionLabel, { color: T.text2 }]}>Response body</Text>
              <View style={[styles.codeBlock, { backgroundColor: T.surface, borderColor: T.hairline }]}>
                <Text style={[styles.code, { color: T.text }]} selectable>
                  {fetched
                    ? (fetched.body
                        ? JSON.stringify(fetched.body, null, 2).slice(0, 4000)
                        : (fetched.rawText ?? '(empty)').slice(0, 4000))
                    : '(no fetch result yet)'}
                </Text>
              </View>

              <Text style={[styles.sectionLabel, { color: T.text2 }]}>Recent navigation URLs</Text>
              <View style={[styles.codeBlock, { backgroundColor: T.surface, borderColor: T.hairline }]}>
                <Text style={[styles.code, { color: T.text3 }]} selectable>
                  {navLog.length ? navLog.join('\n') : '(none)'}
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ResultRow({
  T, label, pass, detail,
}: { T: any; label: string; pass: boolean; detail: string }) {
  return (
    <View style={styles.resultRow}>
      <Text style={[styles.resultMark, { color: pass ? T.good : T.bad }]}>
        {pass ? '✓' : '✗'}
      </Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.resultLabel, { color: T.text }]}>{label}</Text>
        <Text style={[styles.resultDetail, { color: T.text3 }]} selectable>{detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10,
  },
  back:     { width: 64 },
  backText: { fontSize: 15, fontWeight: '500' },
  status: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 18, marginBottom: 10,
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 12, borderWidth: 1,
  },
  statusText: { flex: 1, fontSize: 13, fontWeight: '500' },
  dot:        { width: 8, height: 8, borderRadius: 4 },
  webWrap: {
    height: 380, marginHorizontal: 18, marginBottom: 10,
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
  },
  loading: {
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  button: {
    marginHorizontal: 18, marginBottom: 10,
    paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  buttonText: { fontSize: 14, fontWeight: '600' },
  results:    { flex: 1, marginHorizontal: 18 },
  resultRow:  { flexDirection: 'row', gap: 10, marginBottom: 10 },
  resultMark: { fontSize: 18, fontWeight: '700', width: 18 },
  resultLabel:  { fontSize: 13, fontWeight: '600' },
  resultDetail: { fontSize: 11, marginTop: 2, fontVariant: ['tabular-nums'] },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 14, marginBottom: 6 },
  codeBlock:    { borderRadius: 10, borderWidth: 1, padding: 10 },
  code:         { fontSize: 11, fontFamily: 'Menlo', lineHeight: 14 },
  errorText:    { fontSize: 12, marginTop: 4, marginBottom: 4 },
});
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: clean exit.

If you get errors about `T` being typed `any` in `ResultRow`, that's intentional — the existing screens in this codebase use the same `T: any` pattern (see `SettingsScreen.tsx:27`). Match the existing style; we'll improve theme typing in a separate cleanup.

- [ ] **Step 3: Commit**

```bash
git add src/screens/main/IcSpikeScreen.tsx
git commit -m "feat: add IcSpikeScreen for cookie-capture feasibility test"
```

---

## Task 5: Register `IcSpike` in `RootNavigator`

**Files:**
- Modify: `src/navigation/RootNavigator.tsx:1-27`

**Why:** Adding the screen at the root stack (rather than inside `MainNavigator`'s tab bar) means it presents fullscreen over the tab UI — appropriate for a debug screen that doesn't belong in the tab hierarchy.

- [ ] **Step 1: Import the screen and register the route**

Edit `src/navigation/RootNavigator.tsx`. Replace the entire file contents with:

```typescript
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainNavigator } from './MainNavigator';
import { IcSpikeScreen } from '../screens/main/IcSpikeScreen';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { dark } = useTheme();
  // Set to true to skip onboarding during development
  const [onboardingDone] = useState(false);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={onboardingDone ? 'Main' : 'Onboarding'}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        <Stack.Screen name="Main"       component={MainNavigator} />
        <Stack.Screen
          name="IcSpike"
          component={IcSpikeScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: clean exit.

- [ ] **Step 3: Commit**

```bash
git add src/navigation/RootNavigator.tsx
git commit -m "nav: register IcSpike modal screen on root stack"
```

---

## Task 6: Add the 5-tap detector to `SettingsScreen`

**Files:**
- Modify: `src/screens/main/SettingsScreen.tsx:1-2, 55-159`

**Why:** This is the only entry point to the spike screen. Five rapid taps on the existing app-version label is invisible to normal users but reachable for testing. Counter resets after 2 seconds of inactivity.

- [ ] **Step 1: Update imports**

In `src/screens/main/SettingsScreen.tsx`, change line 1 from:

```typescript
import React from 'react';
```

to:

```typescript
import React, { useRef } from 'react';
```

And add this import after the existing import block (after line 8):

```typescript
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types';
```

- [ ] **Step 2: Add tap-counter logic to the component**

In `src/screens/main/SettingsScreen.tsx`, find the line:

```typescript
export function SettingsScreen() {
  const { T, dark, toggleTheme } = useTheme();
```

Replace those two lines with:

```typescript
export function SettingsScreen() {
  const { T, dark, toggleTheme } = useTheme();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onVersionTap = () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      rootNav.navigate('IcSpike');
      return;
    }
    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, 2000);
  };
```

- [ ] **Step 3: Wrap the version label in a TouchableOpacity**

In `src/screens/main/SettingsScreen.tsx`, find this line (around line 152):

```typescript
          <Text style={[monoStyle(T), styles.version]}>Lumina · v1.0 · build 240426</Text>
```

Replace with:

```typescript
          <TouchableOpacity onPress={onVersionTap} activeOpacity={1}>
            <Text style={[monoStyle(T), styles.version]}>Lumina · v1.0 · build 240426</Text>
          </TouchableOpacity>
```

(`TouchableOpacity` is already imported on line 2.)

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: clean exit.

- [ ] **Step 5: Commit**

```bash
git add src/screens/main/SettingsScreen.tsx
git commit -m "settings: add hidden 5-tap entry to IcSpike screen"
```

---

## Task 7: Pre-build verification

**Files:** None modified — verification only.

**Why:** Before triggering the long Xcode prebuild + build cycle, confirm everything still compiles and the spike code is reachable from the type system.

- [ ] **Step 1: Final typecheck**

```bash
npm run typecheck
```

Expected: clean exit, zero errors.

- [ ] **Step 2: Confirm files exist**

```bash
ls -la src/services/icSpike.ts src/screens/main/IcSpikeScreen.tsx
```

Expected: both files present, non-empty.

- [ ] **Step 3: Confirm git history is clean**

```bash
git log --oneline -7
```

Expected: 6 spike commits visible (one per task), working tree clean.

```bash
git status
```

Expected: `nothing to commit, working tree clean` (other than the unrelated `docs/` and any prior workspace changes).

---

## Task 8: On-device manual verification

**Files:** None modified.

**Why:** This is the actual test. The whole point of the spike is to validate three architectural assumptions against real ClassLink + IC infrastructure. There is no meaningful unit test for "did `WKHTTPCookieStore` give us `JSESSIONID` after a real Microsoft SAML round-trip" — only an iOS simulator with real credentials.

**Pre-requisite:** Xcode + iOS simulator are installed (the user has stated they're downloading these).

- [ ] **Step 1: First-time prebuild + build**

⚠️ This step takes 5–15 minutes the first time because Expo runs `prebuild` (generates `ios/` folder), then `pod install` (downloads CocoaPods), then Xcode compiles the dev client with the new native module. Subsequent builds are much faster.

Run from repo root:

```bash
npm run ios
```

Expected outcome: Metro starts, Xcode log streams scroll past, simulator launches, app loads to the **Welcome** screen of onboarding (since `onboardingDone` is hardcoded `false` in `RootNavigator.tsx:14`).

If you get `Pod install failed`, run `cd ios && pod install --repo-update && cd ..` then retry.

If you get `Unable to resolve "@react-native-cookies/cookies"`, you missed Task 1 — go back.

- [ ] **Step 2: Skip onboarding to reach Settings**

The spike entry point is on the Settings screen which lives inside the Main navigator. The fastest way to reach it during testing is to flip the dev flag.

Edit `src/navigation/RootNavigator.tsx:14` temporarily:

```typescript
const [onboardingDone] = useState(true);
```

The Metro bundler will hot-reload. The app should now boot directly into the dashboard (Classes tab).

(Remember to revert this before any commit that's going out for review.)

- [ ] **Step 3: Trigger the spike**

In the simulator:
1. Tap the **Settings** tab in the bottom bar.
2. Scroll to the bottom of the Settings screen — you'll see `Lumina · v1.0 · build 240426`.
3. Tap that text **5 times rapidly** (within ~2 seconds).
4. The IcSpike modal should slide up from the bottom.

If the modal doesn't appear:
- Check Metro logs for `[IcSpike] nav →` messages — they only appear after the WebView mounts, so absence means the modal never opened.
- Make sure your taps were within 2 seconds of each other.

- [ ] **Step 4: Complete the SSO login**

The WebView shows the SRVUSD portal login. Sign in with **real ClassLink credentials**. The flow goes ClassLink → Microsoft Azure → IC portal. There may be popup-blocker quirks (we are *not* injecting the popup-neutralizer JS in the spike, on purpose — we want to see what raw SSO behavior looks like).

If a popup is blocked: that's data, write it down. We'll revisit popup neutralization in Phase 1 if needed.

- [ ] **Step 5: Watch the phase strip flip**

When the URL settles on something matching `/portal/main.jsp` or containing `appName=portal`, the status strip text changes to **"Login detected — ready to capture."** and the **"Capture cookies & test fetch"** button activates (turns from gray to accent color).

If the strip never flips: check Metro for the `[IcSpike] nav →` log lines. The last URL printed is what we need to add to `isLoginUrl()` in `src/services/icSpike.ts`. Tighten the predicate, save, hot-reload, retry.

- [ ] **Step 6: Tap the capture button**

Read the result panel below the WebView:

| Pass criterion | What ✓ means | What ✗ means |
|---|---|---|
| **1. JSESSIONID captured** | `CookieManager.get(..., true)` saw the HttpOnly cookie. The architecture works. | We can't read HttpOnly cookies — likely a `useWebKit:true` issue or `sharedCookiesEnabled` plumbing. |
| **2. HTTP 200 from /students** | Native fetch + explicit Cookie header authenticates against IC. | Could be 401 (cookies wrong/expired), 403 (missing header IC requires), or network error (cert pinning, etc). |
| **3. personID parseable** | The endpoint returns the user's record under their session. | Body is in an unexpected shape — capture and review. |

- [ ] **Step 7: Capture evidence**

Regardless of outcome, screenshot the result panel and save Metro logs. The spike's deliverable is a writeup of which criteria passed.

```bash
# Save Metro logs to a file for the writeup (run while Metro is still up):
# (You'll need to copy the relevant log lines manually — Metro doesn't write them to disk by default.)
```

- [ ] **Step 8: Decision gate**

- All three ✓ → spike passes. Architecture validated. Move to Phase 1 planning: rewrite `infiniteCampus.ts` to use this pattern, delete `IC_SCRAPER_JS`, build `icClient.ts` properly.
- Any ✗ → architecture needs adjustment before Phase 1 begins. Diagnose with the captured evidence; do not delete the existing scraper.

- [ ] **Step 9: Revert dev-only changes**

If you flipped `onboardingDone` to `true` in step 2, revert it back to `false` so onboarding still works for the next person:

Edit `src/navigation/RootNavigator.tsx:14`:

```typescript
const [onboardingDone] = useState(false);
```

(Do not commit this revert separately — just leave it as part of your working tree.)

---

## Self-review (already performed)

- **Spec coverage:** Every section of the design spec has a corresponding task. Cookie passthrough decision = Task 2 (explicit header in `fetchStudents`). Login completion detection = Task 2 (`isLoginUrl`) + Task 4 (debounce-free predicate; logs every nav for tightening). Result panel pass/fail criteria = Task 4 (`ResultRow`). Hidden 5-tap entry = Task 6. SRVUSD-only = `SPIKE_PORTAL_URL` constant in Task 2.
- **Placeholders:** Searched for "TBD", "TODO", "fill in", "appropriate" — none in implementation steps. The single "TODO" comment in the project is in pre-existing code (`SignInWebViewScreen.tsx:57`) and is out of scope.
- **Type consistency:** `CookieCaptureResult` and `FetchStudentsResult` defined in Task 2, consumed in Task 4 with matching property names. `RootStackParamList` extended in Task 3, consumed in Task 4 (`NativeStackScreenProps<…, 'IcSpike'>`) and Task 6 (`NativeStackNavigationProp<…>`).
- **Scope:** Single isolated subsystem. Two new files, three small edits, six commits. Reversible by deleting the new files and reverting three diffs.
