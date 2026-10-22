# Flappy Wings

A Flappy Bird style game that runs on **web, Android and iOS from one shared codebase**, built with
Expo + React Native + react-native-web.

## Controls

| Action | Phone / tablet | Desktop browser |
| --- | --- | --- |
| Flap | Tap anywhere (or swipe up) | Click, `Space`, `↑`, `W` |
| Dive through a gap | Swipe down | `↓`, `S` |
| Pause / resume | Pause button | Pause button, `P`, `Esc` |
| Restart | Play again button | Button or `Space` |

Native touches: zero-latency flap on touch-down, haptic feedback (light tap on flap, tick on score,
error buzz on crash), press-in animations on buttons, safe-area aware HUD (notches, Dynamic Island),
auto-pause when the app goes to the background or the browser tab is hidden. On the web the page
never scrolls, zooms or selects text while you play, and mobile browsers vibrate on a crash.

## Shared-code architecture

```
src/
  engine/       Pure TypeScript game logic: physics, pipes, scoring, collisions (no React, no platform APIs)
  hooks/        Game loop (fixed 120 Hz timestep), swipe/tap gestures, keyboard, auto-pause, high score
  platform/     The only platform-aware code: haptics, storage, browser page setup
  components/   React Native UI rendered on all three platforms (web via react-native-web)
App.tsx         Entry point
```

- The physics runs at a fixed step, so the game plays the same on 60, 90 and 120 Hz screens.
- The world is a fixed 640px tall and scales to any screen; wider screens see further ahead.
- The high score is saved with AsyncStorage (native storage on mobile, localStorage on web).

## Run it

```bash
npm install
npm run web        # browser
npm run ios        # iOS simulator, or scan the QR code with Expo Go on an iPhone
npm run android    # Android emulator, or Expo Go on an Android phone
```

Checks:

```bash
npm test           # engine unit tests
npm run typecheck
npm run build:web  # static web build in dist/
```

## Web deployment

Every push to `main` runs CI (typecheck, tests, web build) and publishes the web version to GitHub
Pages. Enable it once under **Settings → Pages → Source: GitHub Actions** if it is not already on.

## Store builds

Use [EAS Build](https://docs.expo.dev/build/introduction/) (`npx eas build -p ios` / `-p android`)
with your Apple and Google developer accounts to produce App Store and Play Store binaries.
