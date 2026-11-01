import localforage from 'localforage';

// Thin wrapper over IndexedDB (via localforage). Everything lives on the
// device. The backend is swappable so tests can use an in-memory Map.

export const KEYS = {
  settings: 'settings',
  routines: 'routines',
  objects: 'objects',
  alarms: 'alarms',
  sessions: 'sessions',
  activeSession: 'activeSession',
};

export const EXPORT_FORMAT = 'bedalarm-export';
export const EXPORT_VERSION = 1;

export function memoryBackend() {
  const map = new Map();
  return {
    getItem: async (k) => (map.has(k) ? structuredClone(map.get(k)) : null),
    setItem: async (k, v) => {
      map.set(k, structuredClone(v));
      return v;
    },
    removeItem: async (k) => void map.delete(k),
    clear: async () => map.clear(),
  };
}

export function createStorage(backend) {
  const db =
    backend ??
    localforage.createInstance({ name: 'bedalarm', storeName: 'data', description: 'BedAlarm local data' });

  return {
    get: (key) => db.getItem(key),
    set: (key, value) => db.setItem(key, value),
    remove: (key) => db.removeItem(key),
    clear: () => db.clear(),

    async exportAll() {
      const data = {};
      for (const key of Object.values(KEYS)) data[key] = await db.getItem(key);
      return { format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedAt: new Date().toISOString(), data };
    },

    async importAll(payload) {
      if (!payload || payload.format !== EXPORT_FORMAT || typeof payload.data !== 'object') {
        throw new Error('This file is not a BedAlarm export.');
      }
      for (const key of Object.values(KEYS)) {
        if (payload.data[key] != null) await db.setItem(key, payload.data[key]);
      }
    },
  };
}

export const storage = typeof indexedDB !== 'undefined' ? createStorage() : createStorage(memoryBackend());
