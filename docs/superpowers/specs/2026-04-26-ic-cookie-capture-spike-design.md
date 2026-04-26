# Infinite Campus cookie-capture spike — Design

**Date:** 2026-04-26
**Status:** Design — pending implementation plan
**Scope:** Risk-driven feasibility spike. NOT the full IC rewrite.

## Context

The Lumina app integrates with Infinite Campus, which has no public API.
Today's scaffolding in `src/services/infiniteCampus.ts` and
`src/screens/onboarding/SignInWebViewScreen.tsx` follows the **old pattern**
ported from the previous Capacitor app (`docs/ref/Login.jsx.txt`):

> Inject ~100 lines of JavaScript into the WebView after login. The injected
> JS calls IC's portal endpoints from inside the WebView using `fetch()` with
> `credentials: 'include'`, then `postMessage`s the JSON back to React Native.

That pattern works but is fragile:

- The injected scraper has to find `personID` via four fallback heuristics
  (regex on raw HTML, hidden `<a>` tags, blind API probe, XHR/fetch monkey
  patch). Any DOM change in IC breaks it.
- The "scraper running inside a hostile DOM" model is hard to test, hard to
  debug, and has implicit timing dependencies (15-second polling).
- Cookies set as `HttpOnly` (notably `JSESSIONID`) cannot be read by injected
  JS at all, so the scraper has to rely on the WebView's `credentials:
  'include'` semantics rather than knowing what session it's authenticated as.

The proposed replacement (per `docs/infinitecampus_integration_plan.md`):

- WebView is used **only** for the SSO chain (ClassLink → Microsoft → IC).
- After login completes, React Native reads cookies natively via
  `@react-native-cookies/cookies` with `useWebKit: true`. This sees HttpOnly
  cookies that JS injection can't.
- All data fetching becomes plain `fetch()` from RN with an explicit `Cookie`
  header. Native fetch (NSURLSession on iOS) — no CORS, no DOM, no popup
  weirdness, no scraper.

This rewrite is large and replacing existing working code is destructive. So
we are going to **prove the new architecture works on a small isolated slice
first**, before touching any existing code. That slice is this spike.

## Goal

Validate three assumptions, end-to-end, on a real device or simulator with
real ClassLink credentials:

1. **HttpOnly cookie capture works.** `CookieManager.get(origin, true)` after
   ClassLink → Microsoft → IC SSO returns a non-empty cookie set including
   `JSESSIONID`.
2. **Native fetch with that cookie header succeeds.** A plain RN `fetch()` to
   `https://srvusd.infinitecampus.org/campus/resources/portal/students` with
   the captured cookie header returns HTTP 200 with a non-empty body.
3. **The response contains a usable `personID`.** We can pull `[0].personID`
   from the JSON without any HTML parsing or heuristics.

If all three pass → the architecture is proven. We then proceed to delete
`IC_SCRAPER_JS` and build the full integration.
If any fail → we know exactly which assumption was wrong, with **zero deleted
code** and minimal investment.

## Non-goals (explicitly deferred)

- Mapper rewrite (`parseICPayload` stays untouched)
- Replacement of `SignInWebViewScreen.tsx` or `IC_SCRAPER_JS`
- Persistence of cookies, `personID`, or fetched data
- Demo mode, district picker, re-sync logic
- Mapping IC raw → app domain shapes (`ClassItem`, `SubjectDetail`)
- Multi-district support (SRVUSD only for the spike)
- Android-specific testing (iOS only)
- Error recovery / retry logic
- Production-quality UI (the spike is a debug screen)

These all happen in **Phase 1 proper**, gated on this spike succeeding.

## Approach

Add a *new* debug screen alongside the existing flow. Do **not** modify
`SignInWebViewScreen.tsx`, `IC_SCRAPER_JS`, or `parseICPayload` — they keep
working as-is. The spike lives in its own files and is reachable only via a
hidden 5-tap gesture on the Settings screen's app-version label.

### Why not modify the existing screen?

- The existing `SignInWebViewScreen` injects `IC_SCRAPER_JS` and listens to
  `postMessage`. If we A/B both paths in the same screen, the injected
  scraper would race the cookie capture — either the scraper runs and fires
  before we get a chance to capture cookies, or we have to disable the
  injection conditionally, which means two code paths to test for one
  experiment.
- The point of a spike is reversibility. A new screen can be deleted in one
  commit. An A/B'd existing screen leaves cleanup debt.

### Why not branch and rewrite?

- A spike's value is *learning per unit of code written*. A branch/rewrite
  has high write-cost, and we don't yet know which of the three assumptions
  (if any) is the failure point. Better to learn the answer first with
  minimal code, then write the rewrite once with full information.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  IcSpikeScreen (new, src/screens/main/IcSpikeScreen.tsx)     │
│                                                              │
│   <WebView source={{ uri: SRVUSD_PORTAL_URL }}               │
│      sharedCookiesEnabled                                    │
│      thirdPartyCookiesEnabled                                │
│      onNavigationStateChange={detectLogin}                   │
│      // NO injectedJavaScript                                │
│      // NO onMessage                                         │
│   />                                                         │
│                                                              │
│   <Button "Capture cookies & test fetch" disabled={!loggedIn}│
│      onPress={runSpike}                                      │
│   />                                                         │
│                                                              │
│   <ResultPanel>                                              │
│      ✓/✗ Cookie names captured (JSESSIONID present?)         │
│      ✓/✗ HTTP status from /students                          │
│      ✓/✗ personID parsed                                     │
│      <ScrollView mono>{rawJson}</ScrollView>                 │
│   </ResultPanel>                                             │
└──────────────────────────────────────────────────────────────┘
            │ uses                       │ uses
            ▼                            ▼
┌────────────────────────┐    ┌─────────────────────────────────┐
│ src/services/icSpike.ts│    │ @react-native-cookies/cookies   │
│  extractIcCookies()    │    │ (native module — requires       │
│  fetchStudents()       │    │  prebuild rebuild)              │
└────────────────────────┘    └─────────────────────────────────┘
```

## Files to add

| File | Purpose |
|---|---|
| `src/services/icSpike.ts` | Two pure-ish functions: `extractIcCookies(origin)` returns `{ cookieHeader, cookieNames, hasJSESSIONID }`. `fetchStudents(cookieHeader, origin)` returns `{ status, body }`. Isolated so the spike can be deleted as a single file when done. |
| `src/screens/main/IcSpikeScreen.tsx` | The screen described above. Self-contained, no shared state with the rest of the app. |

## Files to modify

| File | Change |
|---|---|
| `package.json` | Add `@react-native-cookies/cookies` to dependencies via `npx expo install @react-native-cookies/cookies`. |
| `src/navigation/MainNavigator.tsx` | Add `IcSpike` route to the existing main navigator (modal or stacked screen, doesn't matter). |
| `src/screens/main/SettingsScreen.tsx` | Wrap the existing app-version label with a `TouchableOpacity` that counts taps; on the 5th tap within 2 seconds, `navigation.navigate('IcSpike')`. |

That's the entire change set: 2 new files, 3 small mods. No deletions, no
refactors.

## Data flow

1. User opens Settings, taps app-version 5×, lands in `IcSpikeScreen`.
2. WebView mounts pointing at
   `https://srvusd.infinitecampus.org/campus/portal/students/srvusd.jsp`
   (the existing SRVUSD entry from `DISTRICTS`).
3. User completes the real ClassLink → Microsoft → IC SSO flow inside the
   WebView. We do not inject any JS. We only watch
   `onNavigationStateChange`.
4. Login-detected predicate (any of):
   - URL path includes `/portal/main.jsp`
   - URL query string contains `appName=portal`
   - URL hostname is `srvusd.infinitecampus.org` AND has been stable for >2s
     (debounced fallback — protects against IC redirecting to a non-default
     landing page in some district configs)
5. State flips to `phase: 'logged-in'`. The "Capture cookies & test fetch"
   button enables.
6. User taps button. `runSpike()` runs:
   - `cookies = await CookieManager.get('https://srvusd.infinitecampus.org', true)`
   - `cookieHeader = Object.entries(cookies).map(([k,v]) => k + '=' + v.value).join('; ')`
   - `cookieNames = Object.keys(cookies)`
   - `hasJSESSIONID = 'JSESSIONID' in cookies`
   - `res = await fetch('https://srvusd.infinitecampus.org/campus/resources/portal/students', { headers: { Cookie: cookieHeader, Accept: 'application/json', 'Cache-Control': 'no-cache' } })`
   - `body = await res.json()` (or raw text on parse fail — capture both)
   - `personID = body?.[0]?.personID ?? null`
7. Result panel renders the three pass/fail rows + the raw response body in a
   scrollable monospace block. Cookie names are shown; cookie values are NOT
   shown (privacy — they're session credentials).

## Cookie passthrough decision

**Explicit `Cookie` header per request.** We considered setting cookies into
`HTTPCookieStorage` via `CookieManager.set` so RN's fetch picks them up
automatically — that's less typing per request, but the implicit shared
state is harder to reason about when something breaks ("which cookie store
is fetch reading from right now?"). Explicit headers make every request
self-describing, which is what we want during a spike where we may be
debugging.

This decision can be revisited in Phase 1 proper if the explicit-header
ergonomics become painful at 7 endpoints.

## Login completion detection

`onNavigationStateChange` (not `onLoadEnd`) — fires on SPA `pushState`
transitions too, which IC's portal does after authentication.

Predicate: any of the three signals listed in step 4 above. We will
`console.log` every navigation state during the spike so we can see the real
URL flow on a live ClassLink session and tighten the heuristic if needed.

## Pass / fail criteria

The spike succeeds iff all three of the following render as ✓ on the result
panel:

| # | Criterion | What it proves |
|---|---|---|
| 1 | `JSESSIONID` is present in `cookieNames` | `CookieManager.get(..., true)` actually reads HttpOnly cookies from `WKHTTPCookieStore` (not just `document.cookie`) |
| 2 | HTTP status from `/campus/resources/portal/students` is 200 | RN's native `fetch` accepts the `Cookie` header and IC's server treats us as authenticated |
| 3 | `body[0].personID` is a non-empty string/number | The student-listing endpoint returns the user's record under their session, no `personID` heuristic needed |

If any criterion fails, the panel shows ✗ + the diagnostic data needed to
investigate (HTTP status, response body excerpt, list of captured cookie
names, navigation URL log).

## Manual verification

1. `npm install` (picks up new `@react-native-cookies/cookies` dependency).
2. `npm run ios` (Expo prebuild regenerates `ios/` with the new native
   module, then Xcode builds and launches on simulator).
3. App opens. Tap **Settings** tab. Tap the app-version label 5× within
   ~2 seconds. Navigation pushes `IcSpikeScreen`.
4. Sign in with real SRVUSD ClassLink credentials inside the embedded
   WebView. (No injected JS interferes.)
5. Wait for the "Capture cookies & test fetch" button to enable (login
   detected via navigation predicate).
6. Tap the button.
7. Read result panel:
   - All three ✓ → spike passes → ready to plan Phase 1 (full rewrite,
     deletion of `IC_SCRAPER_JS`, etc.).
   - Any ✗ → capture screenshot of result panel + Metro logs, hand back.
     Each ✗ pattern points at a specific architectural change needed (e.g.
     ✗ on JSESSIONID + ✓ on others ⇒ may need `CookieManager.set` round-trip;
     ✓ on cookies + ✗ on HTTP 401 ⇒ IC requires additional headers like
     `X-Requested-With`).

## Open questions (none blocking — defaults chosen)

All four open questions from `docs/infinitecampus_integration_plan.md` are
either answered or deferred:

1. *Cookie passthrough style* — answered: **explicit headers** (this design).
2. *State management* — deferred to Phase 1; the spike has no shared state.
3. *Dev client vs Expo Go* — already on dev client (`expo run:ios`); spike
   gets a free rebuild via prebuild.
4. *District URL handling* — deferred to Phase 1; spike hardcodes SRVUSD.

## Outcome artifact

After running the spike, I should produce a short go/no-go writeup including:

- Which of the three pass criteria succeeded
- Sanitized list of captured cookie names (no values)
- Full HTTP response status and body excerpt for `/students`
- Screenshot of the result panel
- Decision: proceed to Phase 1 rewrite as-designed, or revise architecture

That writeup is what I'll bring back before we start the actual rewrite.
