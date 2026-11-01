import { describe, it, expect } from 'vitest';
import { speakable, pickVoice } from '../src/platform/speech.js';

describe('voice coach', () => {
  it('cleans text so it sounds natural when read aloud', () => {
    expect(speakable('Good depth ✓')).toBe('Good depth');
    expect(speakable('Let’s move 🎉')).toBe("Let's move");
    expect(speakable('Loading pose model…')).toBe('Loading pose model.');
    expect(speakable('Put the phone on the floor about 2 m away, side-on.')).toBe('Put the phone on the floor about 2 metres away, side-on.');
    expect(speakable('Push-ups — knees down is fine!')).toBe('Push-ups, knees down is fine!');
  });

  it('prefers a natural voice in the right language over a robotic one', () => {
    const voices = [
      { name: 'eSpeak English', lang: 'en-US', localService: true },
      { name: 'Google UK English Female', lang: 'en-GB', localService: false },
      { name: 'Monica', lang: 'es-ES', localService: true },
    ];
    expect(pickVoice(voices, 'en-US').name).toBe('Google UK English Female');
    expect(pickVoice([voices[2]], 'en-US')).toBeNull(); // never the wrong language
    expect(pickVoice([], 'en-US')).toBeNull();
  });
});
