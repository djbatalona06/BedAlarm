# 03 · App Flow

## Map
```
                    ┌──────────── Tab bar ─────────────┐
                    │ Alarm   Routines   History  Settings │
                    └──────────────────────────────────┘
 Alarm (/) ──+Add──▶ Alarm edit (/alarms/:id) ──Save──▶ Alarm (/)
    │  └─Try a wake-up now──────────────┐
    └─Go to bed──▶ Night (/night) ──(alarm time)──▶ Ringing (/ring)
                       │                              │  └─Snooze (once, 5 min)──▶ Night
                       └─Exit bedside mode──▶ Alarm   │
                                                      ▼ I'm up
                                   routine has object? ──yes──▶ Scan (/scan) ──match held 1 s──┐
                                                      │              └─Can't scan? (+2 squats)─┤
                                                      no                                       ▼
                                                      └──────────────────────────────▶ Routine run (/run)
                                                                                    step intro → Start
                                                                                    camera reps / breathing
                                                                                    …next step…
                                                                                          ▼
                                                                                 Results (/results) ──Done──▶ Alarm
 Routines (/routines) ──tap──▶ Routine edit (/routines/:id) ──Pair a new object──▶ Pair (/pair?routine=id)
        └─Practise──▶ Scan / Routine run (no alarm)
 History (/history): week dots, totals, recent mornings, Export / Import JSON
 Settings (/settings): sound, vibration, voice, captions, colour-blind, tap-to-count, text size, breathing pace, delete data
```

## Screen-by-screen
| Screen | What you see | Actions |
|---|---|---|
| **Alarm (home)** | Welcome card (first run), resume card (if a routine was interrupted), next alarm + countdown, alarm list with on/off switches. | Go to bed · + Add · edit alarm · toggle · Try a wake-up now |
| **Alarm edit** | Big time picker, day chips, routine picker, label. | Save · Delete · Back |
| **Night** | Dim amber clock, next alarm, wake-lock status. No tab bar. | Exit bedside mode |
| **Ringing** | Wobbling ⏰, current time, what you must do to stop it. Sound ramps up over 60 s. | I'm up · Snooze (once) |
| **Scan** | Rear camera, square frame that fills green while the object is held, "I see: …". | Can't scan? (adds 2 bonus squats) |
| **Routine run** | Step dots. Intro card per step (icon, target, setup tip). Then camera HUD (reps, form status, timer) or breathing orb. | Start · +1 rep (if tap-to-count or camera fails) |
| **Results** | 🎉, totals, small wins. | Done |
| **Routines** | Routine list with steps summary. | + New · Practise · edit |
| **Routine edit** | Name, object picker, steps with −/+ counts, reorder, remove, add. | Pair a new object · Forget object · Save · Delete (blocked if an alarm uses it) |
| **Pair** | Rear camera, live top-3 guesses with meters, name field. | Save object · Cancel |
| **History** | 7-day dots, totals, recent mornings. | Export · Import |
| **Settings** | Toggles + test buttons, privacy statement. | Delete all my data |

## Edge cases
- **Reload/crash mid-routine:** session is saved after every rep → Home shows "Resume".
- **Go back to bed mid-routine:** after 60 s without progress the alarm rings again.
- **Camera blocked/no camera:** error message + tap-to-count button appears.
- **Object won't scan (dark, moved):** fallback adds 2 squats so you are never stuck.
- **One-time alarm:** switches itself off after the routine is done.
