import { describe, it, expect } from 'vitest';
import { buildQuietWav, createKeepAlive } from '../src/platform/keepAlive.js';

function fakeBrowser({ blockPlay = false } = {}) {
  const audio = {
    paused: true,
    plays: 0,
    blockPlay,
    handlers: {},
    setAttribute() {},
    addEventListener(name, fn) {
      this.handlers[name] = fn;
    },
    async play() {
      this.plays++;
      if (this.blockPlay) throw new Error('NotAllowedError');
      this.paused = false;
    },
    pause() {
      this.paused = true;
      this.handlers.pause?.();
    },
  };
  const buttons = {};
  const nav = { mediaSession: { metadata: null, playbackState: 'none', setActionHandler: (name, fn) => (buttons[name] = fn) } };
  const win = { MediaMetadata: class { constructor(info) { Object.assign(this, info); } } };
  return { audio, buttons, nav, win, makeAudio: () => audio, makeUrl: () => 'blob:quiet' };
}

describe('buildQuietWav', () => {
  const wav = buildQuietWav();
  const view = new DataView(wav.buffer);
  const word = (at) => String.fromCharCode(...wav.slice(at, at + 4));

  it('is a valid WAV file', () => {
    expect(word(0)).toBe('RIFF');
    expect(word(8)).toBe('WAVE');
    expect(word(36)).toBe('data');
    expect(view.getUint32(4, true)).toBe(wav.length - 8);
    expect(view.getUint32(40, true)).toBe(wav.length - 44);
  });

  it('is far too quiet to hear but not pure silence', () => {
    let loudest = 0;
    for (let i = 44; i < wav.length; i += 2) loudest = Math.max(loudest, Math.abs(view.getInt16(i, true)));
    expect(loudest).toBeGreaterThan(0);
    expect(loudest).toBeLessThan(33); // under 0.1% of full volume (32767)
  });

  it('starts at zero so the loop has no click', () => {
    expect(view.getInt16(44, true)).toBe(0);
  });
});

describe('keep-alive helper', () => {
  it('loops the quiet sound and fills in the lock-screen card', async () => {
    const b = fakeBrowser();
    const helper = createKeepAlive(b);
    expect(await helper.start({ title: 'BedAlarm', subtitle: 'Alarm at 6:45 AM' })).toBe(true);
    expect(b.audio.loop).toBe(true);
    expect(b.audio.src).toBe('blob:quiet');
    expect(helper.isRunning()).toBe(true);
    expect(b.nav.mediaSession.metadata.artist).toBe('Alarm at 6:45 AM');
    expect(b.nav.mediaSession.playbackState).toBe('playing');
  });

  it('starts again if something pauses it', async () => {
    const b = fakeBrowser();
    const helper = createKeepAlive(b);
    await helper.start();
    b.audio.pause(); // e.g. the pause button on the lock screen
    await Promise.resolve();
    expect(b.audio.paused).toBe(false);
    expect(b.audio.plays).toBe(2);
  });

  it('stays off after stop', async () => {
    const b = fakeBrowser();
    const helper = createKeepAlive(b);
    await helper.start();
    helper.stop();
    await Promise.resolve();
    expect(b.audio.paused).toBe(true);
    expect(b.audio.plays).toBe(1);
    expect(helper.isRunning()).toBe(false);
    expect(b.nav.mediaSession.metadata).toBe(null);
    expect(b.buttons.pause).toBe(null);
  });

  it('reports off when the browser blocks sound, and can retry later', async () => {
    const b = fakeBrowser({ blockPlay: true });
    const helper = createKeepAlive(b);
    expect(await helper.start()).toBe(false);
    expect(helper.isRunning()).toBe(false);
    b.audio.blockPlay = false;
    expect(await helper.resume()).toBe(true);
  });

  it('does nothing on a browser with no audio', async () => {
    const helper = createKeepAlive({});
    expect(helper.supported()).toBe(false);
    expect(await helper.start()).toBe(false);
    helper.stop();
  });
});
