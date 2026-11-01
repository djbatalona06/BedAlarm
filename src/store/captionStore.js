import { create } from 'zustand';

let timer = null;
export const useCaptionStore = create((set) => ({
  text: '',
  key: 0,
  show(text, ms = 3500) {
    clearTimeout(timer);
    set((s) => ({ text, key: s.key + 1 }));
    timer = setTimeout(() => set({ text: '' }), ms);
  },
  clear() {
    clearTimeout(timer);
    set({ text: '' });
  },
}));
