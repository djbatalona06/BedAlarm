// All sounds are generated live with the Web Audio API, so the app ships no
// audio files (nothing to license, nothing to download).
let ctx = null;
let alarmTimer = null;
let alarmGain = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** Browsers only allow sound after a tap. Call this from a button handler. */
export async function unlockAudio() {
  const c = audio();
  if (c && c.state === 'suspended') await c.resume().catch(() => {});
  return c?.state === 'running';
}

function beep(c, { freq, start, dur, gain, type = 'sine', dest }) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(dest || c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

/** Gentle-to-loud alarm: a rising three-note pattern that gets louder over 60s. */
export function startAlarmSound() {
  const c = audio();
  if (!c || alarmTimer) return;
  if (c.state !== 'running') c.resume().catch(() => {}); // the phone may have paused it overnight
  alarmGain = c.createGain();
  alarmGain.gain.value = 0.15;
  alarmGain.gain.linearRampToValueAtTime(1, c.currentTime + 60);
  alarmGain.connect(c.destination);
  const play = () => {
    const t = c.currentTime + 0.05;
    [523.25, 659.25, 783.99].forEach((freq, i) => beep(c, { freq, start: t + i * 0.18, dur: 0.16, gain: 0.6, type: 'triangle', dest: alarmGain }));
  };
  play();
  alarmTimer = setInterval(play, 1200);
}

export function stopAlarmSound() {
  clearInterval(alarmTimer);
  alarmTimer = null;
  if (alarmGain) {
    try {
      alarmGain.disconnect();
    } catch {
      /* already disconnected */
    }
  }
  alarmGain = null;
}

export function playRepChime(rep = 1) {
  const c = audio();
  if (!c || c.state !== 'running') return;
  const base = 660 + Math.min(rep, 12) * 20; // pitch climbs a little each rep
  beep(c, { freq: base, start: c.currentTime, dur: 0.12, gain: 0.25 });
}

export function playSuccess() {
  const c = audio();
  if (!c || c.state !== 'running') return;
  const t = c.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => beep(c, { freq, start: t + i * 0.1, dur: 0.3, gain: 0.3 }));
}
