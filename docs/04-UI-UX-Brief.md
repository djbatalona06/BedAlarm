# 04 · UI/UX Design Brief

**Feel:** calm sunrise in a dark room. Dark, minimal, high contrast, rounded, friendly. Think "Notion-calm meets game-HUD clarity".

## AAA principles → concrete rules
| Principle | Rule in BedAlarm |
|---|---|
| Minimal HUD (80% attention on the activity) | During exercise show only **reps**, **form status**, **timer** (+ step dots and the on-device badge). |
| Immediate, juicy feedback | Rep counter "pops" (scale 0.8 → 1.15 → 1), rising-pitch chime, 30 ms haptic tap, spoken count. Success: 4-note arpeggio + long vibration + 🎉. |
| Form feedback, not nagging | Skeleton green = good, red = fix. Cues ("Go a little lower") debounced ≥ 3 s. |
| Progressive disclosure | Ringing → Scan → Do it → Results. Stats live in the History tab. No tab bar during focus screens. |
| Respect the player | No streak-loss shame, no account wall, no ads. Results show *small wins* only. |

## Design tokens (`src/styles/tokens.css`)
| Token | Value | Use |
|---|---|---|
| `--bg` | `#0b0d17` | App background (deep night) |
| `--bg-raised` | `#151a2c` | Cards |
| `--text` / `--muted` | `#f1f3fb` / `#a3abc6` | Body / secondary text |
| `--accent` | `#ffb547` | Sunrise orange: primary buttons, active tab |
| `--accent-2` | `#7c8cff` | Selected chips, focus ring, breathing orb |
| `--good` / `--bad` | `#3ddc84` / `#ff5c5c` | Form status. **Colour-blind mode:** `#4da3ff` / `#ff9f1c` + square markers |
| `--radius` | `1rem` | Cards; buttons are pills |
| `--tap` | `3rem` (48 px) | Minimum touch target |

Typography: system UI font; numbers use `ui-rounded`. Base 16 px, everything in `rem` so the **Text size** setting scales the whole UI to 125 / 150 / 200 %.

## Accessibility checklist
- [x] Min 16 px text, scalable to 200 %.
- [x] Touch targets ≥ 48 px.
- [x] Every spoken cue is also a caption (`role="status"`).
- [x] Colour-blind palette + shape redundancy (round vs square).
- [x] `prefers-reduced-motion` disables animations.
- [x] Safe-area insets for notches and home indicators.
- [x] Visible focus ring; labelled controls; progress bars with ARIA values.
- [x] Tap-to-count for seated/adapted exercises or no camera.

## Screen notes
- **Night:** near-black, amber clock at low brightness so it doesn't light the bedroom.
- **Ringing:** warm radial glow, oversized time, one primary action.
- **Camera screens:** dark gradients behind HUD text for legibility on any background; mirrored front camera.
