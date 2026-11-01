import { useSettingsStore } from './settingsStore.js';
import { useLibraryStore } from './libraryStore.js';
import { useAlarmStore } from './alarmStore.js';
import { useHistoryStore } from './historyStore.js';

export function hydrateAll() {
  return Promise.all([
    useSettingsStore.getState().hydrate(),
    useLibraryStore.getState().hydrate(),
    useAlarmStore.getState().hydrate(),
    useHistoryStore.getState().hydrate(),
  ]);
}
