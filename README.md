# Lumina

A premium iOS/Android mobile app that pulls live grades from Infinite Campus,
runs the math your teachers actually use, and helps high-school students plan
the rest of their semester. Per-class AI assessments use *preset prompts only* —
no open chat surface to misuse.

Built with **React Native 0.76** on **Expo SDK 52** (bare workflow, TypeScript).

---

## Quick start

```bash
cd LuminaApp
npm install

# iOS (requires macOS + Xcode 15+)
npx expo run:ios

# Android (requires Android Studio + SDK 34+)
npx expo run:android

# Metro only (use Expo Go or a dev build)
npm start
```

The first `expo run:*` command will generate the native `ios/` and `android/`
folders via prebuild.

## Project layout

```
LuminaApp/
├── App.tsx                          Root entry point
├── index.ts                         Expo registerRootComponent
├── app.json                         Expo config (iOS/Android, ATS, plugins)
├── src/
│   ├── tokens/index.ts              Design tokens — dark/light, fonts, helpers
│   ├── context/ThemeContext.tsx     Theme state (dark default)
│   ├── types/index.ts               Domain + navigation param types
│   ├── data/mock.ts                 Mock student data (Aditya, 6 classes)
│   ├── services/
│   │   └── infiniteCampus.ts        IC integration: districts, scraper JS, parser
│   ├── components/
│   │   ├── LIcon.tsx                SVG icon set (~24 icons)
│   │   ├── Sparkline.tsx            Mini grade chart (react-native-svg)
│   │   ├── ClassCard.tsx            Dashboard class card
│   │   ├── TabBar.tsx               Custom blurred tab bar (expo-blur)
│   │   ├── AISheet.tsx              Preset-prompt bottom sheet
│   │   └── LuminaMark.tsx           Animated logo mark
│   ├── navigation/
│   │   ├── RootNavigator.tsx        Onboarding ↔ Main switcher
│   │   ├── OnboardingNavigator.tsx  Welcome → District → SignInWebView → FirstSync
│   │   ├── ClassesStackNavigator.tsx
│   │   └── MainNavigator.tsx        Bottom tabs
│   └── screens/
│       ├── onboarding/
│       │   ├── WelcomeScreen.tsx
│       │   ├── DistrictScreen.tsx
│       │   ├── SignInWebViewScreen.tsx   ← inline WKWebView for IC SSO
│       │   └── FirstSyncScreen.tsx
│       └── main/
│           ├── DashboardScreen.tsx
│           ├── SubjectDetailScreen.tsx   ← floating "Assess my plan" button
│           ├── AIReportScreen.tsx        ← Performance / Risks / Plan report
│           ├── WhatIfScreen.tsx
│           ├── AttentionScreen.tsx
│           └── SettingsScreen.tsx
```

## Infinite Campus integration

There is no public IC API. Lumina integrates by opening the district's IC
student portal in an **inline `WKWebView`** (iOS) / `android.webkit.WebView`
(Android), letting the student authenticate via their district SSO, and then
running an injected script inside the WebView that calls IC's internal portal
endpoints with the authed cookies and posts the JSON back to RN.

The student's password never leaves the WebView's cookie jar — RN never sees
it.

Flow:

1. **DistrictScreen** — student picks a district from `DISTRICTS` in
   `src/services/infiniteCampus.ts`. Each entry maps to its IC portal URL.
2. **SignInWebViewScreen** — opens `district.portalUrl` in a `<WebView>`.
   The student logs in (ClassLink / Azure / native IC). Cookies are persisted
   via `sharedCookiesEnabled` (iOS) and `thirdPartyCookiesEnabled` (Android).
3. **`IC_SCRAPER_JS`** — injected JS that polls until auth completes, then
   `fetch()`es `/campus/api/portal/students`, `/campus/resources/portal/grades`,
   `/campus/resources/portal/assignments`, and `/campus/resources/portal/grades/history`.
   Each step posts a `progress` message back to RN; the final `done` message
   carries the raw IC payload.
4. **`parseICPayload`** — maps the IC JSON to the app's `ClassItem` and
   `SubjectDetail` types defined in `src/types/index.ts`.
5. **FirstSyncScreen** — animates the sync progress, then advances to the main app.

The parser is intentionally tolerant of missing fields because IC schemas vary
by district configuration.

### Wiring real data into the screens

The screens currently read from `src/data/mock.ts`. To use live data:

1. Wrap the app in a `DataProvider` that holds `parsed.classes` and
   `parsed.subjectDetails` in state (and persists with `expo-secure-store` or
   `@react-native-async-storage/async-storage`).
2. Replace the `MockClasses` / `MockPreCalc` imports in
   `DashboardScreen`, `SubjectDetailScreen`, `AttentionScreen`, etc. with
   `useData()` from that provider.
3. Surface a "Re-sync now" action in `SettingsScreen` that re-mounts the
   `SignInWebView` (cookies will already be present, so the auth poll completes
   immediately).

## Design

This app implements the design exported from Claude Design — see `../project/Lumina.html`
and `../chats/chat1.md` for the original prototype and design conversation.

System choices baked into `src/tokens/index.ts`:

- **Palette** — deep ink (`#070C14`) / teal (`#5BC8C2`) / ink-blue (`#3E7BFA`). No purple.
- **Type** — system (SF Pro on iOS, Roboto on Android), tabular numerals for grades.
- **Nav** — 4-tab bottom bar (Classes / Attention / What-If / Settings).
- **AI** — preset prompts only, scoped per-class, no open chat.
- **Theme** — dark-first, light supported, toggle in Settings.

## Skipping onboarding during development

In `src/navigation/RootNavigator.tsx`, set `onboardingDone` to `true`:

```ts
const [onboardingDone] = useState(true);
```

## Type-checking

```bash
npm run typecheck
```

## Status

- ✅ All 9 screens built (onboarding × 3, main × 6) + IC WebView screen
- ✅ Light / dark themes
- ✅ React Navigation wired (root stack + onboarding stack + main tabs + classes stack)
- ✅ IC integration scaffolded — scraper JS, parser, WebView screen
- ⏳ Live data wiring — currently uses mock data; next step is the `DataProvider` described above
- ⏳ Persistence — no AsyncStorage / SecureStore yet
- ⏳ Push notifications, syllabus upload — not yet implemented

## License

Private — all rights reserved.
