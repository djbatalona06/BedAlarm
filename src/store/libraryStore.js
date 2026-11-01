import { create } from 'zustand';
import { storage, KEYS } from './storage.js';
import { defaultRoutines } from '../routine/defaults.js';

// Routines (step lists) and paired objects (things you scan to start).
export const useLibraryStore = create((set, get) => ({
  routines: [],
  objects: [],
  async hydrate() {
    const [routines, objects] = await Promise.all([storage.get(KEYS.routines), storage.get(KEYS.objects)]);
    set({ routines: routines?.length ? routines : defaultRoutines(), objects: objects || [] });
  },
  saveRoutine(routine) {
    const exists = get().routines.some((r) => r.id === routine.id);
    const routines = exists ? get().routines.map((r) => (r.id === routine.id ? routine : r)) : [...get().routines, routine];
    set({ routines });
    return storage.set(KEYS.routines, routines);
  },
  deleteRoutine(id) {
    const routines = get().routines.filter((r) => r.id !== id);
    set({ routines });
    return storage.set(KEYS.routines, routines);
  },
  saveObject(obj) {
    const objects = [...get().objects.filter((o) => o.id !== obj.id), obj];
    set({ objects });
    return storage.set(KEYS.objects, objects);
  },
  deleteObject(id) {
    const objects = get().objects.filter((o) => o.id !== id);
    const routines = get().routines.map((r) => (r.objectId === id ? { ...r, objectId: null } : r));
    set({ objects, routines });
    return Promise.all([storage.set(KEYS.objects, objects), storage.set(KEYS.routines, routines)]);
  },
  routineById: (id) => get().routines.find((r) => r.id === id),
  objectById: (id) => get().objects.find((o) => o.id === id),
}));
