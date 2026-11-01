// Vibration is ignored on devices/browsers that don't support it (e.g. iOS Safari).
const can = () => typeof navigator !== 'undefined' && 'vibrate' in navigator;

export const tap = () => can() && navigator.vibrate(30);
export const success = () => can() && navigator.vibrate([40, 60, 40, 60, 120]);
export const alarmPattern = () => can() && navigator.vibrate([600, 300, 600, 300, 600]);
export const stop = () => can() && navigator.vibrate(0);
