// Backup for the screen wake lock: a looping sound you can't hear, plus a
// "now playing" card (Media Session) on the lock screen.
//
// Why: a phone treats an app that is playing audio as "busy", so it is slower to
// put it to sleep. That gives the alarm a better chance of ringing if the wake
// lock is refused (Low Power Mode) or the screen turns off anyway.
//
// The sound is made in code — the app still ships no audio files.
//
// `createKeepAlive` takes the browser pieces as arguments so tests can pass fakes.

/**
 * Build a tiny WAV file: a 20 Hz hum at about one-thousandth of full volume.
 * That is far too low and too quiet to hear, but it is not pure digital
 * silence, which some browsers treat the same as "nothing is playing".
 */
export function buildQuietWav({ seconds = 2, sampleRate = 8000, hz = 20, amplitude = 24 } = {}) {
  const samples = seconds * sampleRate;
  const bytes = new Uint8Array(44 + samples * 2);
  const view = new DataView(bytes.buffer);
  const text = (at, s) => [...s].forEach((ch, i) => view.setUint8(at + i, ch.charCodeAt(0)));
  text(0, 'RIFF');
  view.setUint32(4, 36 + samples * 2, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true); // size of this block
  view.setUint16(20, 1, true); // 1 = plain, uncompressed sound
  view.setUint16(22, 1, true); // one channel (mono)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // bytes per second
  view.setUint16(32, 2, true); // bytes per sample
  view.setUint16(34, 16, true); // bits per sample
  text(36, 'data');
  view.setUint32(40, samples * 2, true);
  // A whole number of waves fits in the clip, so the loop has no click at the join.
  for (let i = 0; i < samples; i++) {
    view.setInt16(44 + i * 2, Math.round(amplitude * Math.sin((2 * Math.PI * hz * i) / sampleRate)), true);
  }
  return bytes;
}

export function createKeepAlive({ win, nav, makeAudio, makeUrl }) {
  let el = null;
  let wanted = false;
  let playing = false;
  const listeners = new Set();
  const setPlaying = (v) => {
    if (playing === v) return;
    playing = v;
    listeners.forEach((fn) => fn());
  };

  const session = () => nav?.mediaSession ?? null;

  async function play() {
    if (!wanted || !el) return false;
    try {
      await el.play();
      if (!wanted) {
        el.pause(); // stop() was called while the browser was still starting it
        return false;
      }
      setPlaying(true);
      if (session()) session().playbackState = 'playing';
      return true;
    } catch {
      setPlaying(false); // the browser refused (no tap yet, or blocked)
      return false;
    }
  }

  function setInfo({ title = 'BedAlarm', subtitle = 'Bedside mode', icon } = {}) {
    const s = session();
    if (!s || !win?.MediaMetadata) return;
    s.metadata = new win.MediaMetadata({
      title,
      artist: subtitle,
      album: 'BedAlarm',
      artwork: icon ? [{ src: icon, sizes: '512x512', type: 'image/png' }] : [],
    });
  }

  function setButtons(handler) {
    const s = session();
    if (!s?.setActionHandler) return;
    for (const action of ['play', 'pause', 'stop']) {
      try {
        s.setActionHandler(action, handler);
      } catch {
        /* this phone doesn't have that button */
      }
    }
  }

  return {
    supported: () => typeof makeAudio === 'function',
    /** Must be called from a tap — browsers only let sound start after one. */
    async start(info) {
      if (!makeAudio) return false;
      wanted = true;
      if (!el) {
        el = makeAudio();
        el.loop = true;
        el.preload = 'auto';
        el.setAttribute?.('playsinline', '');
        el.src = makeUrl(buildQuietWav());
        // A phone call or another app can pause us. Start again while we're still wanted.
        el.addEventListener('pause', () => {
          setPlaying(false);
          if (wanted) play();
        });
      }
      setInfo(info);
      // Pressing pause on the lock screen must not switch the helper off.
      setButtons(() => play());
      return play();
    },
    stop() {
      wanted = false;
      el?.pause();
      setPlaying(false);
      setButtons(null);
      const s = session();
      if (s) {
        s.metadata = null;
        s.playbackState = 'none';
      }
    },
    /** Try again when the app comes back into view. */
    resume: () => (wanted && !playing ? play() : Promise.resolve(playing)),
    setInfo,
    isRunning: () => playing,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

const inBrowser = typeof window !== 'undefined' && typeof Audio !== 'undefined';
const helper = createKeepAlive(
  inBrowser
    ? {
        win: window,
        nav: navigator,
        makeAudio: () => new Audio(),
        makeUrl: (bytes) => URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' })),
      }
    : {},
);

if (inBrowser) {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') helper.resume();
  });
}

export const keepAliveSupported = helper.supported;
export const startKeepAlive = helper.start;
export const stopKeepAlive = helper.stop;
export const setKeepAliveInfo = helper.setInfo;
export const isKeepAliveRunning = helper.isRunning;
export const subscribeKeepAlive = helper.subscribe;
