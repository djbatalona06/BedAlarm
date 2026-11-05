// Light / dark theme helpers. No React in here so it is easy to unit-test.
//
// The page colours themselves live in src/styles/tokens.css and switch on
// <html data-theme="system|light|dark">. This file only decides which value to
// put there, keeps the phone's top bar colour in sync, and remembers the choice.

export const THEMES = ['system', 'light', 'dark'];
export const THEME_STORAGE_KEY = 'bedalarm-theme';
// Same colours as --bg in tokens.css (used for the browser / status bar tint).
export const THEME_COLORS = { dark: '#0b0d17', light: '#f2f2f7' };

const LIGHT_QUERY = '(prefers-color-scheme: light)';

export function normalizeTheme(value) {
  return THEMES.includes(value) ? value : 'system';
}

/** Turn the user's choice ("system" | "light" | "dark") into what is actually shown. */
export function resolveTheme(theme, prefersLight, forceDark = false) {
  if (forceDark) return 'dark';
  const t = normalizeTheme(theme);
  if (t === 'system') return prefersLight ? 'light' : 'dark';
  return t;
}

export function systemPrefersLight(win = globalThis.window) {
  return Boolean(win?.matchMedia?.(LIGHT_QUERY)?.matches);
}

/**
 * Apply the theme to the page. Returns the resolved theme ("light" | "dark").
 * forceDark is for screens that must stay dark (bedside clock, camera).
 */
export function applyTheme(theme, { forceDark = false, doc = globalThis.document, win = globalThis.window, remember = true } = {}) {
  const choice = normalizeTheme(theme);
  const resolved = resolveTheme(choice, systemPrefersLight(win), forceDark);
  if (!doc) return resolved;

  doc.documentElement.dataset.theme = choice;
  doc.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[resolved]);

  if (remember) {
    // Settings live in IndexedDB (async). This tiny copy lets index.html set the
    // theme before the first paint, so there is no light/dark flash on launch.
    try {
      win?.localStorage?.setItem(THEME_STORAGE_KEY, choice);
    } catch {
      /* private mode etc. — the theme still works, it just may flash on launch */
    }
  }
  return resolved;
}

/** Call handler whenever the phone switches between Light and Dark. Returns an unsubscribe fn. */
export function subscribeSystemTheme(handler, win = globalThis.window) {
  const mq = win?.matchMedia?.(LIGHT_QUERY);
  if (!mq?.addEventListener) return () => {};
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}
