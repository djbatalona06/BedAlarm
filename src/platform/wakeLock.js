// Keeps the screen on while BedAlarm is on the nightstand. The browser drops
// the lock when the tab is hidden, so we re-acquire it when it comes back.
let sentinel = null;
let wanted = false;

async function acquire() {
  if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return false;
  try {
    sentinel = await navigator.wakeLock.request('screen');
    sentinel.addEventListener('release', () => (sentinel = null));
    return true;
  } catch {
    return false;
  }
}

function onVisibility() {
  if (wanted && !sentinel) acquire();
}

export const wakeLockSupported = () => typeof navigator !== 'undefined' && 'wakeLock' in navigator;

export async function keepAwake() {
  wanted = true;
  document.addEventListener('visibilitychange', onVisibility);
  return acquire();
}

export async function allowSleep() {
  wanted = false;
  document.removeEventListener('visibilitychange', onVisibility);
  if (sentinel) await sentinel.release().catch(() => {});
  sentinel = null;
}

export const isAwakeLocked = () => sentinel != null;
