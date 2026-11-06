import { describe, it, expect } from 'vitest';
import {
  normalizeTheme,
  resolveTheme,
  applyTheme,
  systemPrefersLight,
  subscribeSystemTheme,
  THEME_COLORS,
  THEME_STORAGE_KEY,
} from '../src/platform/theme.js';

// Tiny fake page + phone so we can test without a browser.
function fakeEnv({ prefersLight = false, storageThrows = false } = {}) {
  const meta = { content: '#000', setAttribute(name, value) { if (name === 'content') this.content = value; } };
  const doc = { documentElement: { dataset: {} }, querySelector: (sel) => (sel === 'meta[name="theme-color"]' ? meta : null) };
  const store = {};
  const listeners = new Set();
  const win = {
    matchMedia: () => ({
      matches: prefersLight,
      addEventListener: (_, fn) => listeners.add(fn),
      removeEventListener: (_, fn) => listeners.delete(fn),
    }),
    localStorage: {
      setItem: (k, v) => {
        if (storageThrows) throw new Error('blocked');
        store[k] = v;
      },
    },
  };
  return { doc, win, meta, store, listeners };
}

describe('normalizeTheme', () => {
  it('keeps valid choices', () => {
    expect(normalizeTheme('light')).toBe('light');
    expect(normalizeTheme('dark')).toBe('dark');
    expect(normalizeTheme('system')).toBe('system');
  });
  it('falls back to system for anything else', () => {
    expect(normalizeTheme(undefined)).toBe('system');
    expect(normalizeTheme('blue')).toBe('system');
  });
});

describe('resolveTheme', () => {
  it('system follows the phone', () => {
    expect(resolveTheme('system', true)).toBe('light');
    expect(resolveTheme('system', false)).toBe('dark');
  });
  it('an explicit choice ignores the phone', () => {
    expect(resolveTheme('dark', true)).toBe('dark');
    expect(resolveTheme('light', false)).toBe('light');
  });
  it('forceDark always wins (bedside + camera screens)', () => {
    expect(resolveTheme('light', true, true)).toBe('dark');
    expect(resolveTheme('system', true, true)).toBe('dark');
  });
});

describe('applyTheme', () => {
  it('sets data-theme, the top-bar colour, and remembers the choice', () => {
    const { doc, win, meta, store } = fakeEnv({ prefersLight: true });
    const resolved = applyTheme('system', { doc, win });
    expect(resolved).toBe('light');
    expect(doc.documentElement.dataset.theme).toBe('system');
    expect(meta.content).toBe(THEME_COLORS.light);
    expect(store[THEME_STORAGE_KEY]).toBe('system');
  });
  it('forceDark tints the top bar dark but keeps the saved choice', () => {
    const { doc, win, meta, store } = fakeEnv();
    applyTheme('light', { doc, win, forceDark: true });
    expect(meta.content).toBe(THEME_COLORS.dark);
    expect(doc.documentElement.dataset.theme).toBe('light');
    expect(store[THEME_STORAGE_KEY]).toBe('light');
  });
  it('still works when storage is blocked', () => {
    const { doc, win } = fakeEnv({ storageThrows: true });
    expect(applyTheme('dark', { doc, win })).toBe('dark');
  });
  it('can skip remembering', () => {
    const { doc, win, store } = fakeEnv();
    applyTheme('dark', { doc, win, remember: false });
    expect(store[THEME_STORAGE_KEY]).toBeUndefined();
  });
});

describe('system theme helpers', () => {
  it('reads the phone setting', () => {
    expect(systemPrefersLight(fakeEnv({ prefersLight: true }).win)).toBe(true);
    expect(systemPrefersLight(fakeEnv({ prefersLight: false }).win)).toBe(false);
    expect(systemPrefersLight(undefined)).toBe(false);
  });
  it('subscribe adds and removes the listener', () => {
    const { win, listeners } = fakeEnv();
    const off = subscribeSystemTheme(() => {}, win);
    expect(listeners.size).toBe(1);
    off();
    expect(listeners.size).toBe(0);
  });
});
