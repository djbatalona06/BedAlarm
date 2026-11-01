import { create } from 'zustand';
import { storage, KEYS } from './storage.js';
import { SNOOZE_MINUTES } from '../platform/alarm.js';

export const useAlarmStore = create((set, get) => ({
  alarms: [],
  ringing: null, // { alarmId, since, snoozed }
  async hydrate() {
    set({ alarms: (await storage.get(KEYS.alarms)) || [] });
  },
  persist() {
    return storage.set(KEYS.alarms, get().alarms);
  },
  saveAlarm(alarm) {
    const alarms = [...get().alarms.filter((a) => a.id !== alarm.id), alarm].sort((a, b) => a.time.localeCompare(b.time));
    set({ alarms });
    return get().persist();
  },
  deleteAlarm(id) {
    set({ alarms: get().alarms.filter((a) => a.id !== id) });
    return get().persist();
  },
  /** Called by the scheduler when an alarm's minute arrives (or snooze ends). */
  startRinging(alarm, now = new Date()) {
    const alarms = get().alarms.map((a) =>
      a.id === alarm.id
        ? { ...a, lastFiredAt: now.getTime(), snoozeUntil: null }
        : a,
    );
    const snoozed = get().ringing?.alarmId === alarm.id ? get().ringing.snoozed : Boolean(alarm.snoozeUntil);
    set({ alarms, ringing: { alarmId: alarm.id, since: now.getTime(), snoozed } });
    return get().persist();
  },
  /** Ringing for a manual test (no saved alarm). */
  testRing() {
    set({ ringing: { alarmId: null, since: Date.now(), snoozed: true } });
  },
  snooze() {
    const r = get().ringing;
    if (!r || r.snoozed || !r.alarmId) return false;
    const until = Date.now() + SNOOZE_MINUTES * 60000;
    set({
      alarms: get().alarms.map((a) => (a.id === r.alarmId ? { ...a, snoozeUntil: until } : a)),
      ringing: null,
    });
    get().persist();
    return true;
  },
  /** Routine done: stop ringing; one-time alarms switch themselves off. */
  dismiss() {
    const r = get().ringing;
    const alarms = get().alarms.map((a) =>
      r && a.id === r.alarmId ? { ...a, snoozeUntil: null, enabled: a.days.length > 0 } : a,
    );
    set({ alarms, ringing: null });
    return get().persist();
  },
}));
