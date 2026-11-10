import { describe, it, expect } from 'vitest';
import { createWakeLock } from '../src/platform/wakeLock.js';

// A pretend phone: hands out screen locks and lets the test take them away.
function fakePhone({ refuse = false, visible = true } = {}) {
  const handlers = new Set();
  const locks = [];
  const doc = {
    visibilityState: visible ? 'visible' : 'hidden',
    addEventListener: (_, fn) => handlers.add(fn),
    removeEventListener: (_, fn) => handlers.delete(fn),
  };
  const phone = { refuse, requests: 0 };
  const nav = {
    wakeLock: {
      async request() {
        phone.requests++;
        if (phone.refuse) throw new Error('NotAllowedError');
        const lock = {
          released: false,
          onRelease: null,
          addEventListener(_, fn) {
            this.onRelease = fn;
          },
          async release() {
            this.released = true;
            this.onRelease?.();
          },
        };
        locks.push(lock);
        return lock;
      },
    },
  };
  const setVisible = (v) => {
    doc.visibilityState = v ? 'visible' : 'hidden';
    handlers.forEach((fn) => fn());
  };
  return { nav, doc, locks, phone, setVisible, handlers };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('wake lock', () => {
  it('holds the screen on after keepAwake', async () => {
    const { nav, doc } = fakePhone();
    const lock = createWakeLock({ nav, doc });
    expect(lock.state()).toBe('off');
    expect(await lock.keepAwake()).toBe(true);
    expect(lock.state()).toBe('on');
  });

  it('asks again when you come back to the app', async () => {
    const { nav, doc, locks, setVisible } = fakePhone();
    const lock = createWakeLock({ nav, doc });
    await lock.keepAwake();
    setVisible(false);
    await locks[0].release(); // the phone takes the lock when the app is hidden
    expect(lock.state()).toBe('off');
    setVisible(true);
    await tick();
    expect(lock.state()).toBe('on');
    expect(locks).toHaveLength(2);
  });

  it('does not ask while the app is hidden', async () => {
    const { nav, doc, phone } = fakePhone({ visible: false });
    const lock = createWakeLock({ nav, doc });
    expect(await lock.keepAwake()).toBe(false);
    expect(phone.requests).toBe(0);
  });

  it('reports "blocked" when the phone refuses (Low Power Mode), then recovers', async () => {
    const { nav, doc, phone, setVisible } = fakePhone({ refuse: true });
    const lock = createWakeLock({ nav, doc });
    expect(await lock.keepAwake()).toBe(false);
    expect(lock.state()).toBe('blocked');
    phone.refuse = false;
    setVisible(true);
    await tick();
    expect(lock.state()).toBe('on');
  });

  it('lets go and stops listening after allowSleep', async () => {
    const { nav, doc, locks, handlers, setVisible } = fakePhone();
    const lock = createWakeLock({ nav, doc });
    await lock.keepAwake();
    await lock.allowSleep();
    expect(locks[0].released).toBe(true);
    expect(lock.state()).toBe('off');
    expect(handlers.size).toBe(0);
    setVisible(true);
    await tick();
    expect(locks).toHaveLength(1);
  });

  it('tells listeners when the state changes', async () => {
    const { nav, doc, locks } = fakePhone();
    const lock = createWakeLock({ nav, doc });
    let calls = 0;
    const stop = lock.subscribe(() => calls++);
    await lock.keepAwake();
    expect(calls).toBe(1);
    await locks[0].release();
    expect(calls).toBe(2);
    stop();
    await lock.allowSleep();
    expect(calls).toBe(2);
  });

  it('says "unsupported" on browsers without the feature', async () => {
    const lock = createWakeLock({ nav: {}, doc: { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} } });
    expect(lock.state()).toBe('unsupported');
    expect(await lock.keepAwake()).toBe(false);
  });
});
