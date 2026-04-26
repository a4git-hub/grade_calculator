# Infinite Campus Integration Plan — React Native + Expo

## Context

The user is rewriting the Lumina grade-calculator app from Capacitor + React → React Native + Expo (a parallel agent is rebuilding the UI/UX from scratch). The IC integration must be ported into the new RN app.

Today's Capacitor implementation (`frontend/src/components/Login.jsx`) uses a fragile pattern: open a Cordova `InAppBrowser`, inject ~200 lines of scraper JS that hunts for `personID` via four fallback heuristics, stash the result in WebView `localStorage`, and poll for it from React via `executeScript`. This works but is hard to test, hard to debug, and breaks whenever IC changes its DOM.

In the React Native rewrite we have a cleaner option:
- RN's `fetch` is **native** (`NSURLSession` / `OkHttp`) → **no CORS** for `infinitecampus.org` calls.
- WebView only needs to handle the **SSO redirect chain** (ClassLink → Microsoft Azure SAML/OIDC → IC).
- **Cookies set in the WebView during login** can be read natively via `@react-native-cookies/cookies`, including the `HttpOnly` `JSESSIONID` that JS injection can't see.
- Once we have cookies + `personID`, every IC API call is a plain `fetch()` from React with a `Cookie` header.

This collapses the architecture: the WebView is a one-shot login surface, not a long-lived scraping host. All data flow is normal async React code.

## Goals

1. Reproduce all data the current app shows: courses, grades (T2/T3/T4 priority), assignments (S2 only), categories, grade detail.
2. Reproduce all current login features: ClassLink SSO login, district picker, demo mode.
3. Eliminate the JS-injection scraper. Keep only what's strictly needed (popup neutralizer + a tiny success-detection helper).
4. Allow re-syncing without reopening the WebView when cookies are still valid.

## Non-goals

- Backend proxy. Stays client-only for now (matches current architecture).
- Android support. iOS-only matches the current target. (Plan stays Android-portable, but no Android-specific testing in scope.)
- Auth refresh tokens / silent re-login. If cookies expire, reopen WebView.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│  React Native (Expo) App                                           │
│                                                                    │
│   screens/LoginScreen.tsx                                          │
│        │                                                           │
│        │ uses                                                      │
│        ▼                                                           │
│   hooks/useIcAuth.ts ─────────────► services/icClient.ts           │
│        │                              │                            │
│        │                              ├─ loginViaWebView()         │
│        │                              ├─ fetchStudent()            │
│        │                              ├─ fetchRoster()             │
│        │                              ├─ fetchAssignments()        │
│        │                              ├─ fetchGrades()             │
│        │                              ├─ fetchCategories()         │
│        │                              ├─ fetchGradeDetail()        │
│        │                              └─ syncAll()                 │
│        │                                                           │
│        ▼                                                           │
│   services/icMapper.ts (pure functions, easily unit-tested)        │
│        │                                                           │
│        ▼                                                           │
│   AsyncStorage (personID, district URL — never cookies)            │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
        │                                  ▲
        │ <WebView> for SSO only           │ Native fetch with Cookie header
        ▼                                  │
┌─────────────────────────┐         ┌──────────────────────────┐
│  ClassLink → Microsoft  │  sets   │  srvusd.infinitecampus   │
│  SAML/OIDC redirects    │ cookies │  .org JSON APIs          │
└─────────────────────────┘────────►└──────────────────────────┘
```

---

## End-to-end auth + data flow

### Step 1 — User taps "Sync via ClassLink"
- `useIcAuth` checks AsyncStorage for cached `personID`.
- Tries a probe `GET /campus/resources/portal/students` with whatever cookies are already in `HTTPCookieStorage` (from previous login this session).
- 200 + non-empty body → skip login, jump to Step 5.
- 401/403/redirect → continue to Step 2.

### Step 2 — Open `<WebView>` for SSO
- Mount full-screen `<WebView source={{ uri: districtLoginUrl }} />`.
- Default district: `https://srvusd.infinitecampus.org/campus/portal/students/sanRamon.jsp` (from AsyncStorage; user-configurable).
- Pass `injectedJavaScriptBeforeContentLoaded` with the **popup neutralizer** (port of the existing trick):
  ```js
  document.querySelectorAll('form').forEach(f => f.target='_self');
  document.querySelectorAll('a').forEach(a => a.target='_self');
  window.open = u => { window.location.href = u; return null; };
  true;
  ```
  Why: ClassLink → Azure OIDC SAML POSTs sometimes target `_blank`, and RN's WebView blocks new-window opens by default. Same root cause as Capacitor.
- Set `sharedCookiesEnabled={true}` and `thirdPartyCookiesEnabled={true}` props — required so cookies set during the multi-domain SSO chain are persisted in the shared cookie store.

### Step 3 — Detect login completion
- Use `onNavigationStateChange` (preferred over `onLoadEnd` — fires on every URL change including SPA pushState).
- Success signal: URL matches `/portal/main.jsp` OR contains `?appName=portal` (more specific than current code's `infinitecampus.org` check, which fires during SAML redirects too).
- Fall-back signal: any URL on the IC domain that responds 200 to a probe call. We'll empirically tune this during dev.
- On success, advance to Step 4. Don't close the WebView yet — we still want the cookie store stable.

### Step 4 — Capture cookies natively
- Call:
  ```ts
  import CookieManager from '@react-native-cookies/cookies';
  const cookies = await CookieManager.get('https://srvusd.infinitecampus.org', true /* useWebKit */);
  ```
- This returns ALL cookies for that origin, including `HttpOnly` ones that `document.cookie` can't read. Critically, this is how we get `JSESSIONID`.
- Build a `Cookie` header string: `Object.entries(cookies).map(([k,v]) => `${k}=${v.value}`).join('; ')`.
- Hold this in memory (React state via Zustand or Context — never persist to disk).
- Now close the WebView (`setShowWebView(false)`).

### Step 5 — Resolve `personID`
- One call: `GET /campus/resources/portal/students` with the captured `Cookie` header.
- Read `[0].personID` (and `[0].firstName` for display name).
- Cache `personID` in AsyncStorage for next launch.
- This single call replaces the entire 4-heuristic personID dance in the current code, because the user's session cookie is enough — IC will return *their* student record.

### Step 6 — Fetch all data in parallel
Six endpoints (same as current Capacitor scraper, just from native fetch):

| Call | Endpoint | Purpose |
|---|---|---|
| Student info | `/campus/resources/portal/students` | name, personID |
| Roster | `/campus/resources/portal/roster?personID={id}` | course list, sectionIDs |
| Assignments | `/campus/api/portal/assignment/listView?personID={id}` | all assignments |
| Grades (primary) | `/campus/resources/portal/grades` | grading tasks (monolithic structure) |
| Grades (fallback) | `/campus/api/portal/grades?personID={id}` | flat-array fallback |
| Categories (per course) | `/campus/api/instruction/categories?sectionID={sid}` | weight categories |
| Detail (per course) | `/campus/resources/portal/grades/detail/{sid}?showAllTerms=false&classroomSectionID={sid}` | breakdown |

All requests:
- Include the `Cookie` header.
- Add `Accept: application/json`, `Cache-Control: no-cache, no-store`, `Pragma: no-cache`.
- Append `?_t={Date.now()}` cache-buster (matches existing behavior; defensive against any intermediate caches).
- Run student/roster/assignments/grades **in parallel** (Promise.all). Then run per-course categories+detail in parallel (one Promise.all per course).

### Step 7 — Map raw → app schema
- Port `services/icMapper.ts` directly from the mapping logic in `Login.jsx:281-374`.
- Pure function, no side effects. **Unit-testable** in isolation — this is the biggest testability win over the current architecture.
- Same rules:
  - Filter "Student Support" / "Unscheduled" courses.
  - Grade priority: T4 > T3 > T2; within term: Semester > Quarter > Progress.
  - Map term to semester (T3/T4 → S2, T1/T2 → S1).
  - Filter assignments to current semester (T3/T4).
- Keep the hardcoded `sem2TermIDs = [3403, 3404]` for now to match current behavior, but add a `// TODO: derive from term dates` comment — this is a known portability bug and will need fixing if other districts come into scope.

### Step 8 — Hand off to UI
- Mapped data flows into app state (Zustand store or whatever the parallel UI agent is using).
- LoginScreen navigates to dashboard.

### Step 9 — Re-sync (no WebView needed)
- "Pull to refresh" or explicit re-sync triggers Steps 5-7 only.
- If any call returns 401/403: clear in-memory cookies, route back to Step 2 (reopen WebView).

---

## Files to create

```
src/
  screens/
    LoginScreen.tsx              # Login UI + WebView mount logic
    DistrictPickerScreen.tsx     # Port of "Change District" feature
  components/
    IcLoginWebView.tsx           # Wraps <WebView> with success detection
  services/
    icClient.ts                  # All HTTP calls + login orchestration
    icMapper.ts                  # Pure mapping fns (port from Login.jsx)
    icTypes.ts                   # TypeScript interfaces for IC raw + app shapes
  hooks/
    useIcAuth.ts                 # Login state, cached personID, retry logic
  store/
    icStore.ts                   # In-memory cookie + raw data store
```

---

## Dependencies to add

```bash
npx expo install react-native-webview
npx expo install @react-native-cookies/cookies   # native module → requires Expo dev client (NOT Expo Go)
npx expo install @react-native-async-storage/async-storage
```

**Important:** `@react-native-cookies/cookies` has native code, so the Expo app must be built as a **dev client** (`eas build --profile development` or `expo prebuild`). Vanilla Expo Go won't load it. If the parallel UI agent has been working in Expo Go, this is the moment to switch to dev client.

---

## Critical caveats (worth knowing before coding)

1. **HttpOnly cookies and the iOS WebView store.**
   `JSESSIONID` is HttpOnly — `document.cookie` returns nothing useful. `@react-native-cookies/cookies` with `useWebKit: true` reads from `WKHTTPCookieStore` natively, which sees HttpOnly cookies. Verify this works on first run before building further.

2. **Cookie sharing between WebView and `fetch`.**
   On iOS, RN's `fetch` (NSURLSession) reads from `HTTPCookieStorage.shared` by default. WKWebView writes to its own `WKWebsiteDataStore`. They are NOT automatically synchronized. Two options:
   - **(Recommended)** Pass the `Cookie` header explicitly on every `fetch` from React. Most transparent; no implicit state.
   - Use `CookieManager.set(...)` to copy cookies into `HTTPCookieStorage` so fetch picks them up automatically. Less typing per request, more magic.
   Plan recommends explicit headers — easier to debug, easier to test.

3. **Login completion detection is empirical.**
   The exact post-login URL pattern depends on district config. Plan to log every navigation event during dev, then tighten the success signal once we see the real flow. Don't over-specify upfront.

4. **The IC API base URL is district-specific.**
   `srvusd.infinitecampus.org` is hardcoded today. The "Change District" flow stores a custom base URL in AsyncStorage. The new client must derive base URL from the configured district URL (parse origin once, reuse).

5. **Cookie scope.**
   The SSO chain sets cookies on `classlink.com`, `login.microsoftonline.com`, AND `srvusd.infinitecampus.org`. We only need IC's. Calling `CookieManager.get('https://srvusd.infinitecampus.org', true)` gives us only that origin's cookies, which is exactly right.

6. **Demo mode parity.**
   Keep the "App Reviewer? Use Demo Login" tappable text. Apple reviewers can't get past ClassLink without real credentials, so this is mandatory for App Review. Hardcoded mock data goes through the same `onLogin` path.

7. **Hardcoded term IDs.**
   `sem2TermIDs = [3403, 3404]` are SRVUSD-specific and rotate yearly. Port as-is for now, flag as known issue.

---

## Testing strategy

| Layer | How |
|---|---|
| `icMapper.ts` | Unit tests with fixture JSON captured from a real IC response. Pure functions → trivial to test. |
| `icClient.ts` | Integration test against fixture HTTP responses (msw or similar). |
| WebView login flow | Manual on device. Cannot meaningfully unit-test the SSO chain. |
| End-to-end | Manual: login → see grades → pull-to-refresh → see fresh grades. |

The mapper is where most of the historical bugs live (term picking, grade priority). Putting it behind unit tests is the single biggest reliability win in this rewrite.

---

## Verification (how to confirm it works end-to-end)

1. `npx expo start --dev-client` and load on a real iPhone.
2. Tap "Sync via ClassLink" → WebView opens.
3. Complete real ClassLink → Microsoft → IC login flow. Verify no popups blocked.
4. WebView closes within ~1 second of landing on `/portal/main.jsp`.
5. Dashboard shows real courses + grades within ~5 seconds.
6. Pull-to-refresh: data refreshes WITHOUT reopening WebView (cookies still valid).
7. Background the app for 1 hour, return, pull-to-refresh: should still work.
8. Background overnight, return, pull-to-refresh: 401 expected → WebView reopens automatically.
9. Demo mode: tap "App Reviewer? Use Demo Login" → dashboard renders mock data instantly.

---

## Reference: critical existing code

| What | Where (current Capacitor app) | Port target |
|---|---|---|
| Popup neutralizer JS | `frontend/src/components/Login.jsx:94-96` | `IcLoginWebView.tsx` `injectedJavaScriptBeforeContentLoaded` prop |
| IC API endpoint list | `Login.jsx:170-209` | `icClient.ts` |
| Raw → app mapping | `Login.jsx:281-374` | `icMapper.ts` (pure function) |
| Demo data | `Login.jsx:48-57` | `icClient.ts` `getDemoData()` |
| District picker URL | `Login.jsx:20` (`infinitecampus.com/audience/parents-students/login-search`) | `DistrictPickerScreen.tsx` |
| Term ID hardcodes | `Login.jsx:351` | `icMapper.ts`, flagged TODO |

---

## Open questions for the user

1. **Cookie passthrough style:** explicit `Cookie` header on each fetch (transparent) vs. `CookieManager.set` to share automatically (less typing)?
2. **State management:** what's the parallel UI agent using? Zustand? Context? Redux Toolkit? The IC store should match.
3. **Dev client vs. Expo Go:** is the new app already on a dev client build? If still in Expo Go, we'll need to migrate before adding `@react-native-cookies/cookies`.
4. **District URL handling:** keep AsyncStorage-based custom district feature, or simplify to SRVUSD-only for v1?
