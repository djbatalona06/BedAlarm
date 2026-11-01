# 05 · Data Schema (on-device)

There is **no server and no account**. All data lives in the browser's IndexedDB (via localforage, database `bedalarm`, store `data`). Each key below holds one JSON value.

## Keys
| Key | Type | Written when |
|---|---|---|
| `settings` | `Settings` | Any setting changes |
| `routines` | `Routine[]` | Routine saved/deleted |
| `objects` | `PairedObject[]` | Object paired/forgotten |
| `alarms` | `Alarm[]` | Alarm saved/toggled/fired/snoozed/dismissed |
| `sessions` | `Session[]` | A routine is completed |
| `activeSession` | `Session \| null` | **After every rep/breath** (crash-safe resume) |

## Shapes
```js
Settings = {
  onboarded: boolean, colorBlind: boolean, voice: boolean, captions: boolean,
  haptics: boolean, sound: boolean, textScale: 1 | 1.25 | 1.5 | 2,
  allowTapCount: boolean, breathIn: number /* s */, breathOut: number /* s */
}

Routine = {
  id: string, name: string,
  objectId: string | null,            // → PairedObject.id (scan-to-start)
  steps: [{ id: string, kind: 'squat' | 'pushup' | 'breathe', target: number }]
}

PairedObject = {
  id: string, name: string,            // "Coffee mug"
  labels: string[],                    // top ImageNet labels seen while pairing, lower-case
  createdAt: number                    // epoch ms
}

Alarm = {
  id: string, time: 'HH:MM', days: number[] /* 0=Sun…6=Sat, [] = once */,
  routineId: string,                   // → Routine.id
  label: string, enabled: boolean,
  lastFiredAt: number | null, snoozeUntil: number | null
}

Session = {
  id: string, routineId: string, routineName: string, alarmId: string | null,
  startedAt: number, finishedAt: number | null,
  scan: 'pending' | 'object' | 'fallback' | 'none',
  stepIndex: number,
  steps: [{ kind, target, done, startedAt, finishedAt, bonus? }],
  status: 'in_progress' | 'complete'
}
```

## Relationships
```
Alarm ──routineId──▶ Routine ──objectId──▶ PairedObject
Session ──routineId──▶ Routine (name is copied in, so history survives deleting a routine)
```
- Deleting an object clears `objectId` on routines that used it.
- A routine used by an alarm cannot be deleted.

## Export format (`History → Export`)
```json
{ "format": "bedalarm-export", "version": 1, "exportedAt": "ISO date",
  "data": { "settings": {}, "routines": [], "objects": [], "alarms": [], "sessions": [], "activeSession": null } }
```
Import rejects any file whose `format` isn't `bedalarm-export`.

## Auth
None. The device is the account. Future cloud sync (paid, opt-in) would encrypt this same export client-side.
