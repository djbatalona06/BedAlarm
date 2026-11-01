# 06 · Implementation Plan

## Phase 1 — Foundations ✅
- [x] Vite + React (JS) project, PWA plugin, manifest, hand-drawn SVG icon → PNGs (`scripts/render-icons.js`).
- [x] `scripts/fetch-models.js` downloads models + copies MediaPipe wasm on `npm install`.
- [x] Design tokens, base styles, accessibility settings wired to `<html>`.

## Phase 2 — The "exercise brain" (pure, tested) ✅
- [x] `vision/angles.js` — joint angles.
- [x] `vision/smoothing.js` — EMA to kill jitter.
- [x] `vision/sideDetect.js` — pick the visible body side.
- [x] `vision/repCounter.js` — UP→DOWN→UP state machine with hysteresis, min rep time, debounced form cues.
- [x] `vision/objectMatch.js` — pairing labels, frame matching, 1 s hold.
- [x] Unit tests for all of the above.

## Phase 3 — Camera + models ✅
- [x] `vision/camera.js`, `vision/visionEngine.js` (lazy-loaded MediaPipe, GPU→CPU fallback for pose, CPU for int8 classifier), `vision/useVideoLoop.js`.
- [x] `CameraView`, `SkeletonOverlay`, HUD, Pair and Scan screens.

## Phase 4 — Routine loop ✅
- [x] `routine/runner.js` (pure session state machine) + tests.
- [x] `RoutineRun`, `ExerciseStep`, `BreathingOrb`, `Results` with small wins.

## Phase 5 — Alarm ✅
- [x] `platform/schedule.js` (pure, tested), `platform/alarm.js` adapter (bedside impl), wake lock, Web Audio, haptics, speech + captions.
- [x] Home, Alarm edit, Night, Ringing; re-ring after 60 s idle; one snooze.

## Phase 6 — Library, history, settings ✅
- [x] Routines list/editor, History (week dots, totals, export/import), Settings.

## Phase 7 — Verify ✅
- [x] `npm test` (unit), `npm run build`, `npm run smoke` (Chromium + fake camera: alarm → camera → routine → results → history → offline reload).

## Phase 8 — Next
1. **Real-device testing protocol:** 20 squats + 20 push-ups × 3 lighting conditions × 2 phones; record counted vs actual. Tune `THRESHOLDS` in `repCounter.js`.
2. **Deploy** to any static HTTPS host (Vercel / Netlify / GitHub Pages). `npm run build` → `dist/`.
3. **Capacitor wrapper** for lock-screen alarms: implement `platform/alarm.js` with `@capacitor/local-notifications` + a full-screen intent on Android.
4. Breath detection from shoulder landmarks.
5. More exercises; friend pact; one-time Plus unlock.

## Manual test checklist (phone)
- [ ] Install to home screen; airplane mode; app still opens and counts reps.
- [ ] Bedside: set alarm 2 min ahead → Go to bed → screen stays on → rings.
- [ ] Pair a mug, then scan it from another angle — match within ~2 s.
- [ ] Walk away mid-routine for 60 s → alarm rings again.
- [ ] Kill the tab mid-routine → reopen → Resume keeps reps.
- [ ] 200 % text + colour-blind mode: nothing overlaps, status still readable.
