import { describe, it, expect } from 'vitest';
import { nextOccurrence, nextAlarm, isDue, formatCountdown } from '../src/platform/schedule.js';

// Sunday 2026-11-01 22:00 local
const sundayNight = new Date(2026, 10, 1, 22, 0);

describe('alarm schedule', () => {
  it('one-time alarm rings next time the clock hits it', () => {
    const at = nextOccurrence({ enabled: true, time: '06:30', days: [] }, sundayNight);
    expect(at).toEqual(new Date(2026, 10, 2, 6, 30));
  });
  it('weekday alarm skips the weekend', () => {
    const fri = new Date(2026, 10, 6, 8, 0); // Friday after the alarm
    const at = nextOccurrence({ enabled: true, time: '07:00', days: [1, 2, 3, 4, 5] }, fri);
    expect(at.getDay()).toBe(1);
  });
  it('disabled alarms never ring', () => {
    expect(nextOccurrence({ enabled: false, time: '07:00', days: [] }, sundayNight)).toBeNull();
  });
  it('picks the soonest alarm', () => {
    const a = { id: 'a', enabled: true, time: '07:00', days: [] };
    const b = { id: 'b', enabled: true, time: '06:00', days: [] };
    expect(nextAlarm([a, b], sundayNight).alarm.id).toBe('b');
  });
  it('is due only once during its minute', () => {
    const alarm = { enabled: true, time: '06:30', days: [] };
    const t = new Date(2026, 10, 2, 6, 30, 5);
    expect(isDue(alarm, t)).toBe(true);
    expect(isDue({ ...alarm, lastFiredAt: t.getTime() }, new Date(2026, 10, 2, 6, 30, 40))).toBe(false);
    expect(isDue(alarm, new Date(2026, 10, 2, 6, 31))).toBe(false);
  });
  it('rings again when a snooze ends', () => {
    const t = new Date(2026, 10, 2, 6, 40);
    expect(isDue({ enabled: true, time: '06:30', days: [], snoozeUntil: t.getTime() - 1000 }, t)).toBe(true);
  });
  it('formats countdowns', () => {
    expect(formatCountdown(8.5 * 3600000)).toBe('8 h 30 min');
    expect(formatCountdown(5 * 60000)).toBe('5 min');
  });
});
