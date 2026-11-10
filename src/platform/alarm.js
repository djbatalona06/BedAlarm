// ─────────────────────────────────────────────────────────────────────────────
// Alarm adapter. The rest of the app ONLY talks to this file.
//
// Today: "bedside" mode — the PWA stays open on the nightstand, a 1-second
// ticker checks the schedule, the screen is kept on with the Wake Lock API
// (backed up by a silent looping sound, see keepAlive.js), and the ring is
// Web Audio + vibration.
//
// Later (native): wrap the app with Capacitor and swap the implementation of
// armBedside/scheduleNative below for @capacitor/local-notifications so the
// alarm can ring from a locked phone. Callers don't change.
// ─────────────────────────────────────────────────────────────────────────────
import { isDue } from './schedule.js';
import { keepAwake, allowSleep } from './wakeLock.js';
import { startKeepAlive, stopKeepAlive } from './keepAlive.js';
import { unlockAudio, startAlarmSound, stopAlarmSound } from './sound.js';
import * as haptics from './haptics.js';

export const SNOOZE_MINUTES = 5;
let ticker = null;
let buzzTimer = null;

/** Start watching the clock. `getAlarms` returns the current list; `onDue(alarm)` fires once per ring. */
export function startScheduler(getAlarms, onDue) {
  stopScheduler();
  ticker = setInterval(() => {
    const now = new Date();
    for (const alarm of getAlarms()) {
      if (isDue(alarm, now)) onDue(alarm, now);
    }
  }, 1000);
}

export function stopScheduler() {
  clearInterval(ticker);
  ticker = null;
}

/** "Going to bed" — must be called from a tap so audio is allowed later. */
export async function armBedside({ screenOn = true, helper = true } = {}) {
  // Start all three straight away: browsers only allow sound "during" the tap,
  // and waiting for one before starting the next can use that moment up.
  const [audioOk, awake, helperOn] = await Promise.all([
    unlockAudio(),
    screenOn ? keepAwake() : false,
    helper ? startKeepAlive({ icon: `${import.meta.env.BASE_URL}icons/icon-512.png` }) : false,
  ]);
  return { audioOk, awake, helperOn };
}

export async function disarmBedside() {
  stopKeepAlive();
  await allowSleep();
}

export function ring({ sound = true, vibrate = true } = {}) {
  if (sound) startAlarmSound();
  if (vibrate) {
    haptics.alarmPattern();
    clearInterval(buzzTimer);
    buzzTimer = setInterval(haptics.alarmPattern, 2400);
  }
}

export function silence() {
  stopAlarmSound();
  clearInterval(buzzTimer);
  buzzTimer = null;
  haptics.stop();
}

/** Ask for permission to show a notification if the tab is in the background when the alarm fires. */
export async function requestNotifyPermission() {
  if (!('Notification' in window) || Notification.permission !== 'default') return Notification?.permission;
  return Notification.requestPermission();
}

export function notify(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon: `${import.meta.env.BASE_URL}icons/icon-192.png`, tag: 'bedalarm', requireInteraction: true });
  } catch {
    /* some browsers only allow notifications from the service worker */
  }
}
