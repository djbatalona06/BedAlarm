import { create } from 'zustand';
import { storage, KEYS } from './storage.js';
import { DEFAULT_SETTINGS } from '../routine/defaults.js';

export const useSettingsStore = create((set, get) => ({
  settings: DEFAULT_SETTINGS,
  async hydrate() {
    const saved = await storage.get(KEYS.settings);
    set({ settings: { ...DEFAULT_SETTINGS, ...(saved || {}) } });
  },
  update(patch) {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    return storage.set(KEYS.settings, settings);
  },
}));
