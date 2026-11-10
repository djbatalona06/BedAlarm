// Keeps the screen on while BedAlarm is on the nightstand (Screen Wake Lock API).
//
// The phone is allowed to take the lock away at any time — when you switch apps,
// or when the battery is very low. So we remember that you *want* the screen on
// and ask again every time the app comes back into view.
//
// `createWakeLock` takes the browser pieces as arguments so tests can pass fakes.

/** 'on' = lock held · 'off' = not asked for · 'blocked' = asked but the phone said no · 'unsupported' */
export function createWakeLock({ nav, doc }) {
  let sentinel = null;
  let wanted = false;
  let refused = false;
  const listeners = new Set();
  const emit = () => listeners.forEach((fn) => fn());

  const supported = () => !!nav && 'wakeLock' in nav;

  async function acquire() {
    if (!supported() || sentinel || doc.visibilityState !== 'visible') return sentinel != null;
    try {
      const lock = await nav.wakeLock.request('screen');
      if (!wanted) {
        // "Exit" was tapped while we were still asking — hand it straight back.
        lock.release().catch(() => {});
        return false;
      }
      sentinel = lock;
      refused = false;
      lock.addEventListener('release', () => {
        if (sentinel === lock) sentinel = null;
        emit();
      });
    } catch {
      refused = true; // e.g. Low Power Mode / Battery Saver
    }
    emit();
    return sentinel != null;
  }

  function onVisibility() {
    if (wanted && doc.visibilityState === 'visible') acquire();
  }

  return {
    supported,
    async keepAwake() {
      wanted = true;
      doc.addEventListener('visibilitychange', onVisibility);
      return acquire();
    },
    async allowSleep() {
      wanted = false;
      refused = false;
      doc.removeEventListener('visibilitychange', onVisibility);
      const lock = sentinel;
      sentinel = null;
      if (lock) await lock.release().catch(() => {});
      emit();
    },
    isLocked: () => sentinel != null,
    state() {
      if (!supported()) return 'unsupported';
      if (sentinel) return 'on';
      return wanted && refused ? 'blocked' : 'off';
    },
    /** Call `fn` whenever the state changes. Returns a function that stops listening. */
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

const inBrowser = typeof navigator !== 'undefined' && typeof document !== 'undefined';
const lock = createWakeLock(inBrowser ? { nav: navigator, doc: document } : { nav: null, doc: null });

export const wakeLockSupported = lock.supported;
export const keepAwake = lock.keepAwake;
export const allowSleep = lock.allowSleep;
export const isAwakeLocked = lock.isLocked;
export const wakeLockState = lock.state;
export const subscribeWakeLock = lock.subscribe;
