// Pure alarm-time maths. An alarm: { time: 'HH:MM', days: [0..6] } where
// days uses Date#getDay (0 = Sunday). Empty days = one-time alarm.

export function parseTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return { h, m };
}

/** Next Date (>= from, to the minute) the alarm should ring, or null. */
export function nextOccurrence(alarm, from = new Date()) {
  if (!alarm || !alarm.enabled) return null;
  const { h, m } = parseTime(alarm.time);
  for (let add = 0; add <= 7; add++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + add, h, m, 0, 0);
    if (d < from) continue;
    if (alarm.days.length === 0 || alarm.days.includes(d.getDay())) return d;
  }
  return null;
}

/** Soonest upcoming ring across all alarms: { alarm, at } or null. */
export function nextAlarm(alarms, from = new Date()) {
  let best = null;
  for (const alarm of alarms) {
    const at = nextOccurrence(alarm, from);
    if (at && (!best || at < best.at)) best = { alarm, at };
  }
  return best;
}

/** Should this alarm be ringing at `now`? (fires during its minute, once) */
export function isDue(alarm, now = new Date()) {
  if (!alarm.enabled) return false;
  if (alarm.snoozeUntil && now.getTime() >= alarm.snoozeUntil) return true;
  const { h, m } = parseTime(alarm.time);
  if (now.getHours() !== h || now.getMinutes() !== m) return false;
  if (alarm.days.length && !alarm.days.includes(now.getDay())) return false;
  const minuteStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime();
  return !(alarm.lastFiredAt && alarm.lastFiredAt >= minuteStart);
}

export function formatCountdown(ms) {
  const mins = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  return `${h} h ${m} min`;
}

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
