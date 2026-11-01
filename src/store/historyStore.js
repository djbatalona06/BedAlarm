import { create } from 'zustand';
import { storage, KEYS } from './storage.js';
import { startSession } from '../routine/runner.js';

// Sessions are saved after EVERY change (every rep), so a crash, reload or
// dead battery never loses your morning.
export const useHistoryStore = create((set, get) => ({
  sessions: [],
  active: null,
  async hydrate() {
    const [sessions, active] = await Promise.all([storage.get(KEYS.sessions), storage.get(KEYS.activeSession)]);
    set({ sessions: sessions || [], active: active || null });
  },
  start(routine, alarmId = null) {
    const active = startSession(routine, { alarmId });
    set({ active });
    return storage.set(KEYS.activeSession, active);
  },
  update(session) {
    if (session.status === 'complete') {
      const sessions = [...get().sessions.filter((s) => s.id !== session.id), session];
      set({ sessions, active: session });
      return Promise.all([storage.set(KEYS.sessions, sessions), storage.set(KEYS.activeSession, session)]);
    }
    set({ active: session });
    return storage.set(KEYS.activeSession, session);
  },
  clearActive() {
    set({ active: null });
    return storage.remove(KEYS.activeSession);
  },
}));
