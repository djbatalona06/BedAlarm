# BedAlarm ⏰🌅

**An alarm you can only turn off by getting up.**
When it rings, you walk to an object you chose (like your coffee mug), scan it with your phone, then do a tiny morning routine — a few squats, some deep breaths — while the camera counts for you. Then the alarm stops.

- 🔒 **Private:** the camera's video never leaves your phone. No account, no ads, no tracking.
- 📱 **Works like an app:** install it from the browser, works offline.
- 🧩 **Your routine, your way:** squats, push-ups and guided breathing, in any order and amount.
- ♿ **For everyone:** captions, colour-blind mode, text up to 200 %, tap-to-count.

> **Heads-up:** websites can't ring a locked phone. Use **bedside mode**: tap *Go to bed*, leave BedAlarm open and plugged in on your nightstand. Keep a backup alarm in your phone's clock app. A native version with lock-screen alarms is on the roadmap.

## How it works (in plain words)
1. **Pose detection** finds 33 points on your body (shoulders, hips, knees…) in every camera frame.
2. BedAlarm measures the **angle of your knee** (squats) or **elbow** (push-ups).
3. Going **down** past a line and back **up** past another line = **one rep**. Two separate lines stop wobbles from counting as extra reps.
4. **Object scanning** recognises everyday things (1,000 kinds). You "pair" your object once; later, holding it in view for one second unlocks the routine.

All of it runs on your phone using Google's open-source MediaPipe models.

## Run it yourself
Requirements: Node 20+.

```bash
npm install        # also downloads the two AI models (~11 MB) into public/models
npm run dev        # open the printed URL (camera works on localhost)
npm test           # unit tests for the rep counter, scheduler, routine runner, storage
npm run build      # production build in dist/
npm run smoke      # end-to-end test in Chromium with a fake camera (after build)
```

To test on your phone, the site must be served over **HTTPS** (camera rule). Easiest: deploy to Vercel (`vercel.json` handles page routes), or run `npx vite --host` and use a tunnel.

## Project map
```
docs/              01 PRD · 02 TRD · 03 App flow · 04 UI/UX brief · 05 Data schema · 06 Implementation plan
index.html         HTML only
src/vision/        camera, MediaPipe engine, angle maths, smoothing, rep counter, object matching
src/routine/       exercises, default routines, session state machine
src/platform/      alarm adapter (bedside today, native later), schedule maths, sound, wake lock, haptics, voice
src/store/         zustand stores + IndexedDB storage
src/screens/       one file per screen
src/components/    camera view, skeleton overlay, breathing orb, tab bar…
src/styles/        tokens.css (colours/sizes), base.css, screens.css
tests/             vitest unit tests
scripts/           model download, icon rendering, smoke test
```

## Credits
- Pose and image models: [MediaPipe](https://ai.google.dev/edge/mediapipe) (Apache 2.0), downloaded at install time, not stored in this repo.
- Icon: drawn for this project (`public/icons/icon.svg`). Sounds are generated in code — no audio files.

## Licence
MIT — see `LICENSE`.
