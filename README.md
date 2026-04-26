# Lumina

A premium iOS/Android mobile app that pulls live grades from Infinite Campus,
runs the math your teachers actually use, and helps high-school students plan
the rest of their semester. Per-class AI assessments use *preset prompts only* —
no open chat surface to misuse.

Built with **React Native 0.85** on **Expo SDK 55** with **React 19** (managed
workflow with `expo run:*` prebuild, TypeScript strict mode).

---

## Quick start

```bash
cd LuminaApp
npm install

# iOS (requires macOS + Xcode 16+)
npm run ios            # debug build → simulator
npm run ios:release    # release configuration

# Android (requires Android Studio + SDK 34+)
npm run android

# Metro only (use Expo Go or a dev build)
npm start

# TypeScript check (no emit)
npm run typecheck
```

The first `expo run:*` command will generate the native `ios/` and `android/`
folders via prebuild.

> **Heads up:** there is no `npm run ios build` script — `expo run:ios` does
> not take a `build` subcommand. Use `npm run ios` for a debug build or
> `npm run ios:release` for a Release-configuration build.

## Project layout

```
LuminaApp/
├── App.tsx                          Root entry point
├── index.ts                         Expo registerRootComponent
├── app.json                         Expo config (iOS/Android, ATS, plugins)
├── src/
│   ├── tokens/index.ts              Design tokens — dark/light, fonts, helpers
│   ├── context/
│   │   ├── ThemeContext.tsx         Theme state (dark default)
│   │   └── DataContext.tsx          IC data state + auth trigger (DataProvider)
│   ├── types/index.ts               Domain + navigation param types
│   ├── data/mock.ts                 Mock student data (kept for offline dev)
│   ├── hooks/
│   │   └── useIcAuth.ts             Triggers SSO WebView, captures cookies, runs sync
│   ├── services/
│   │   ├── icTypes.ts               Raw IC API response shapes (TypeScript interfaces)
│   │   ├── icClient.ts              HTTP layer — native fetch with explicit Cookie header
│   │   ├── icMapper.ts              Raw IC JSON → app domain types (ClassItem, SubjectDetail)
│   │   └── infiniteCampus.ts        District registry (kept for district-picker screen)
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
│       │   ├── SignInWebViewScreen.tsx   ← SSO WebView; closes after cookie capture
│       │   └── FirstSyncScreen.tsx       ← animates sync progress, then enters app
│       └── main/
│           ├── DashboardScreen.tsx
│           ├── SubjectDetailScreen.tsx   ← floating "Assess my plan" button
│           ├── AIReportScreen.tsx        ← Performance / Risks / Plan report
│           ├── WhatIfScreen.tsx
│           ├── AttentionScreen.tsx
│           └── SettingsScreen.tsx
```

## Infinite Campus integration

There is no public IC API. Lumina integrates via **cookie-capture + native
fetch** — no JS injection, no code running inside the WebView.

### Login flow

1. **DistrictScreen** — student picks a district from the registry in
   `src/services/infiniteCampus.ts`. Each entry maps to its IC portal URL.
2. **SignInWebViewScreen** — opens `district.portalUrl` in a `<WebView>`. The
   student authenticates via ClassLink / Azure / native IC. Once the post-auth
   redirect lands, `useIcAuth` (via NitroCookies) captures the session cookies
   and closes the WebView. The student's password never leaves the WebView —
   the app only ever sees opaque session cookies.
3. **Native fetch** — all subsequent IC calls are made from RN with an explicit
   `Cookie:` header assembled from the captured cookies. No WebView is involved
   after login.

### Layered architecture

```
IcClient (HTTP)
  └─ icMapper (raw IC JSON → app domain types)
       └─ DataContext (in-memory state, exposes data + triggerSync)
            └─ hooks: useUser · useClasses · useSubjectDetail · useAttention
                 └─ screens (6 main + 2 onboarding)
```

| Layer | File | Responsibility |
| --- | --- | --- |
| HTTP | `src/services/icClient.ts` | `buildIcClient(baseUrl, cookieHeader)` — returns typed fetch wrappers |
| Types | `src/services/icTypes.ts` | Raw IC API response shapes (TypeScript interfaces) |
| Mapper | `src/services/icMapper.ts` | `mapUser`, `mapClasses`, `mapSubjectDetail` — IC JSON → `ClassItem` / `SubjectDetail` |
| State | `src/context/DataContext.tsx` | `DataProvider` holds synced data in memory; `useUser/useClasses/useSubjectDetail/useAttention` hooks |
| Auth | `src/hooks/useIcAuth.ts` | Mounts SSO WebView, captures cookies via NitroCookies, calls `IcClient`, feeds `DataContext` |

### Endpoints

| Endpoint | Used by |
| --- | --- |
| `/campus/resources/my/userAccount` | `useIcAuth` — student identity |
| `/campus/resources/portal/grades` | `icMapper.mapClasses` — all class grades |
| `/campus/api/portal/assignment/recentlyScored` | `icMapper.mapSubjectDetail` — recent assignment scores |
| `/campus/resources/portal/roster` | `IcClient` (available, not yet consumed — Phase 2) |

### Persistence model

Everything is **in-memory only**. Nothing is written to disk, AsyncStorage, or
SecureStore. Every cold launch re-auths via the SSO WebView (cookies are still
present in the WebView's cookie jar, so the ClassLink/Azure redirect typically
completes without the student re-entering credentials). The captured cookie
string lives only inside the `IcClient` closure held by `DataContext`.

This is a deliberate design choice for Phase 1 — it avoids storing session
tokens on device while the security model is still being reviewed.

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

> Note: this project uses the TypeScript types that ship with `react-native`
> directly (RN 0.71+). Do **not** add `@types/react-native` — it is deprecated
> and will shadow / conflict with the bundled types.

## Dependency versions

This repo intentionally tracks **latest** versions of React, React Native, and
the supporting libraries, which can drift slightly ahead of the versions Expo
SDK 55 was tested against. Current pins:

| Package                          | Version |
| -------------------------------- | ------- |
| expo                             | ^55.0.17 |
| react                            | ^19.2.5 |
| react-native                     | ^0.85.2 |
| @react-navigation/native         | ^7.2.2  |
| @react-navigation/native-stack   | ^7.14.12 |
| @react-navigation/bottom-tabs    | ^7.15.10 |
| react-native-safe-area-context   | ^5.7.0  |
| react-native-screens             | ^4.24.0 |
| react-native-svg                 | ^15.15.4 |
| react-native-webview             | ^13.16.1 |
| expo-blur                        | ^55.0.14 |
| expo-linear-gradient             | ^55.0.13 |
| expo-status-bar                  | ^55.0.5 |
| expo-build-properties            | ^55.0.13 |
| typescript                       | ^5.9.3  |

`npx expo-doctor` will report the minor/patch drift against Expo's tested
matrix — that is expected. To realign with Expo's tested set instead, run
`npx expo install --check`.

### Notes on the upgrade

- **`expo-blur` is no longer a config plugin in SDK 55.** Do **not** add
  `"expo-blur"` to the `plugins` array in `app.json` — it ships as a regular
  auto-linked Expo module now and listing it as a plugin will break prebuild
  with `Cannot find module .../expo-blur/build/BlurView`.
- **`StyleSheet.absoluteFillObject` was removed in RN 0.85.** Use
  `StyleSheet.absoluteFill` for direct `style=` props, or inline
  `{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }` when
  you need to spread/extend with other style properties inside
  `StyleSheet.create({...})`.

## Do I need to eject from Expo?

**No.** This project uses Expo's **prebuild** workflow, which is just native
React Native with `ios/` and `android/` generated on demand from `app.json`.
The binary that lands on the simulator from `npm run ios` is a normal
Xcode-built `.app` — there is no Expo Go sandbox at runtime, and every
autolinked native module (Expo or community) works without manual Xcode
wiring.

The `expo eject` command no longer exists. The modern model is a sliding
scale:

| Mode                       | What it gives you                                                                | When to use                                       |
| -------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------- |
| Expo Go                    | JS-only, runs inside the prebuilt Expo Go app                                    | Pure-JS prototypes only                           |
| **Prebuild (this app)**    | Full native build via `expo run:*`. All autolinked native modules work.          | 99% of production Expo apps                       |
| Bare / fully ejected       | You commit `ios/` + `android/` and stop running `expo prebuild`                  | Forking a native lib, or non-automated native code |

Eject only if you need to (a) fork a native library's source, (b) wire a
non-autolinked native lib by hand, or (c) edit `Info.plist` /
`AndroidManifest.xml` in ways that `app.json` + `expo-build-properties` and
config plugins can't express. None of those apply to LuminaApp today, and the
roadmap features (push, camera, secure storage, IC cookie reading) all have
first-party Expo or autolinking-compatible community modules.

For production / TestFlight builds, use **EAS Build** (`eas build --platform ios`)
rather than ejecting — it runs the same prebuild + Xcode pipeline on Expo's CI.

## Status

- ✅ All 8 screens built (onboarding × 2, main × 6)
- ✅ Light / dark themes
- ✅ React Navigation wired (root stack + onboarding stack + main tabs + classes stack)
- ✅ IC Phase 1 integration — cookie-capture login, native fetch, `IcClient` + `icMapper` + `DataContext`
- ✅ Live data wired into all screens via `useUser` / `useClasses` / `useSubjectDetail` / `useAttention` hooks
- ✅ Persistence — deliberate non-goal for Phase 1; in-memory only, re-auths on cold launch
- ⏳ Roster endpoint consumed by screens (Phase 2)
- ⏳ Push notifications, syllabus upload — not yet implemented

## License

Private — all rights reserved.
