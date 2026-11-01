# 02 · TRD — Technical Requirements

## Stack
| Layer | Choice | Why |
|---|---|---|
| Language | JavaScript (ES2022 modules) | Chosen for readability; no build-time types. |
| UI | React 19 + react-router-dom 7 | Component model, huge ecosystem. |
| Build | Vite 8 | Fast dev server, simple config, code-splitting. |
| PWA | vite-plugin-pwa 2 (Workbox `generateSW`) | Manifest + service worker + offline caching. |
| Computer vision | `@mediapipe/tasks-vision` 1.2 | One library for both pose and object classification; WebAssembly + GPU; runs in the browser. |
| Pose model | `pose_landmarker_lite.task` (5.6 MB) | 33 landmarks, real-time on phones. GPU delegate, CPU fallback. |
| Object model | `efficientnet_lite0.tflite` int8 (5.2 MB) | 1000 ImageNet labels (coffee mug, running shoe, toothbrush, water bottle…). **Must run on CPU delegate** — the int8 model fails on GPU in MediaPipe 1.2. |
| State | zustand 5, split by domain | `settingsStore`, `libraryStore`, `alarmStore`, `historyStore`, `captionStore`. |
| Storage | localforage 1.10 (IndexedDB) | Async, large quota, survives reloads. |
| Styling | Plain CSS with design tokens | `index.html` holds only HTML; all styles in `.css` files. |
| Tests | vitest 5 (unit) + Playwright (end-to-end smoke) | Pure logic is fully unit-tested; smoke test drives a real Chromium with a fake camera. |

## Browser APIs used
| API | Purpose | Fallback |
|---|---|---|
| `getUserMedia` | Camera (only after the user taps Start/Scan) | Tap-to-count button; "Can't scan?" bonus squats. |
| Screen Wake Lock | Keep the nightstand screen on | Message: turn off auto-lock. |
| Web Audio | Generated alarm tone & chimes (no audio files) | — |
| Vibration | Haptics | Silently ignored (iOS). |
| SpeechSynthesis | Voice coach | Captions always shown. |
| Notifications | Alert if the tab is hidden when the alarm fires | — |
| `requestVideoFrameCallback` | Run models once per real frame | `requestAnimationFrame`. |

## Hard constraints
- **HTTPS required** for camera and service worker (localhost is fine for dev).
- **No network after first load.** Models/wasm are served from our own origin (`/models`, `/wasm`) and cached by the service worker on first use. If they're missing, the app falls back to Google's model bucket.
- **No data leaves the device.** No analytics, no third-party scripts.
- Models are **not committed** to git (binary, 11 MB); `scripts/fetch-models.js` downloads them on `npm install`.

## Known platform limits
- A PWA cannot ring a locked or closed phone. MVP = bedside mode (app open + wake lock + plugged in). All alarm calls go through `src/platform/alarm.js` so a Capacitor build can swap in `@capacitor/local-notifications` without touching screens.
- iOS Safari: no Vibration API; Wake Lock supported from iOS 16.4 (installed PWA).

## Performance budget
- Main JS ≤ 120 kB gzip (MediaPipe is code-split and only loaded when the camera is used).
- Pose ≥ 20 fps on a mid-range phone; classifier throttled to ~7 fps.

## Security & privacy
- Camera stream tracks are stopped on unmount.
- Import validates the file format before writing.
- No secrets, no backend.
