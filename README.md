# Flappy Bomber

A war-themed survival runner that plays on **web, Android and iOS from one shared codebase**
(Expo + React Native + react-native-web).

Bombers circle over a torn city. You are a civilian with nothing but a bag on your back: run across
the rubble, leap and flap through the smoke, and grab the air-dropped supplies to stay alive.

- **Play in the browser:** https://nandita2021.github.io/flappy-bomber/
- **Android APK:** [latest build](https://github.com/nandita2021/flappy-bomber/releases/tag/android-latest)

## How to play

| Action | Phone / tablet | Desktop browser |
| --- | --- | --- |
| Leap / flap upward | Tap anywhere | Click, `Space`, `↑`, `W` |
| Drop fast | Swipe down | `↓`, `S` |
| Pause / resume | Pause button | Pause button, `P`, `Esc` |
| Mute | Speaker button | Speaker button |

- Your **strength bar** drains all the time. 🍞 🥫 🍎 🍚 food and 💧 🥛 🧃 drinks refill it. Hit zero and you collapse.
- 💵 🪙 **money** adds 10 points each.
- 💣 **Bombs** whistle down from the planes. A blinking red mark shows where each one lands.
  A blast takes one of your 3 hearts and throws you into the air; you are briefly invincible afterwards.
- Score = metres run + 10 × money. The game speeds up, bombs fall faster and hunger bites harder the longer you last.

## Sound, animation and feel

- Sound effects for leaps, food, drinks, coins, bomb whistles, explosions, getting hurt, low strength, the
  air-raid siren and game over, plus a looping war ambience. All sounds are generated for this project.
- Animated survivor (running legs, flailing arms in the air, collapse), parallax ruined skyline with burning
  buildings and smoke columns, planes overhead, parachuted supplies, fireballs, shock rings, flying debris,
  sparks, craters, screen shake and flashes.
- Haptics on iOS/Android (and vibration on mobile browsers), safe-area aware HUD, auto-pause when the app is
  backgrounded, no page scroll/zoom while playing on the web, high score and mute setting saved per device.

## Shared-code architecture

```
src/
  engine/       Pure TypeScript game logic: survivor physics, energy, supplies, bombs, blasts, scoring (no React)
  hooks/        Fixed 120 Hz game loop, tap/swipe gestures, keyboard, auto-pause, high score, mute
  platform/     The only platform-aware code: sound (expo-audio on native, Web Audio in browsers), haptics, storage, page setup
  render/       Shared scene drawing (drawScene, drawHud) through a tiny Painter interface, with two backends:
                HTML canvas on the web, Skia on iOS/Android. One canvas per frame keeps phones at 60 fps.
  components/   React Native screen, menus and buttons shared by all three platforms
assets/sounds/  Sound effects (WAV)
```

## Develop

```bash
npm install
npm run web        # browser
npm run ios        # iOS simulator, or scan the QR code with Expo Go on an iPhone
npm run android    # Android emulator, or Expo Go on an Android phone
npm test           # engine unit tests
npm run typecheck
```

## Deployment

Every push to `main` deploys automatically:

- **Web:** `.github/workflows/ci.yml` typechecks, runs the tests, builds the web version and publishes it to
  GitHub Pages.
- **Android:** `.github/workflows/android.yml` builds a release APK and attaches it to the `android-latest`
  GitHub Release.
- **iOS / App Store and Google Play:** these need the owner's Apple Developer and Google Play accounts. Use
  [EAS](https://docs.expo.dev/build/introduction/): `npx eas build -p ios --profile production` then
  `npx eas submit -p ios` (and the same with `-p android` for the Play Store).
