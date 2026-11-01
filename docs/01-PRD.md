# 01 · PRD — Product Requirements

## One-liner
**BedAlarm is an alarm you can only switch off by getting up: scan an object you keep away from your bed, then finish a tiny morning routine that the camera counts for you.** Free, private, no account.

## Who it's for
| Person | Pain today | What BedAlarm gives them |
|---|---|---|
| **Snoozer** (primary) | Hits snooze 4× and starts the day late and groggy. | An alarm that needs you standing, moving and breathing before it stops. |
| **Habit builder** | Fitness apps feel like a chore; streak-loss guilt makes them quit. | A 60-second "minimum viable morning" that still counts on bad days. |
| **Privacy-conscious user** | Camera fitness apps upload body data or force sign-ups. | Everything on-device, camera only when you start, no account. |
| **Neurodivergent / ADHD user** | Low activation energy, needs novelty and instant reward. | Scan ritual (novelty), tiny default routine, juicy instant feedback. |
| **User with limited mobility** | Standard apps assume standing exercises. | Tap-to-count, adjustable targets, breathing-only routines, captions, big text. |

## Problem
Alarms are easy to dismiss half-asleep. Existing "mission" alarms use maths puzzles or barcode scans; camera fitness apps (Fitlock, Impakt) are workout-first, have reported rep-counting misses, push accounts/permissions, and often send data to servers.

## Goals (MVP)
1. Set alarms (time, repeat days, routine) and ring reliably while the app is open on the nightstand.
2. **Scan-to-start:** pair any everyday object once; scan it to begin the routine.
3. Count **squats** and **push-ups** with the camera, reliably (no phantom reps), with live form feedback.
4. **Guided breathing** step.
5. Routine builder (any order, any count) with a tiny default routine.
6. History that never loses data, exportable as JSON.
7. Installable PWA that works offline after first load.

## Non-goals (MVP)
- Ringing from a locked/killed phone (needs native wrapper — see roadmap).
- Accounts, cloud sync, social features, payments.
- Camera-based breath detection (guided timer for now).

## Success metrics (measured on-device only, never sent anywhere)
- Routine completion rate after an alarm ≥ 80%.
- Rep-count accuracy ≥ 95% on side-view squats in good light (manual test protocol in docs/06).
- Zero lost sessions after reload/crash.

## Differentiators
1. **Scan-to-start ritual** — no competitor uses an object scan as the routine trigger.
2. **Routine-first, not workout-first.**
3. **True on-device privacy** with a visible "🔒 On-device" badge.
4. **Zero-friction free tier** — the whole loop is free, no sign-up.
5. **Reliability** — save after every rep; smoothed, hysteresis-based counting.
6. **Accessibility first** — captions, colour-blind mode, 200% text, tap-to-count.

## Roadmap after MVP
- **v0.2 native wrapper (Capacitor)** — real lock-screen alarms via local notifications; same web code.
- Breath detection from shoulder movement in the pose skeleton.
- More exercises (lunges, jumping jacks, seated arm raises).
- Optional friend pact (shared morning streak, 1 friend, end-to-end private).
- One-time "Plus" unlock (no subscription): detailed form analytics, voice packs, unlimited custom routines.
