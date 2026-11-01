import { useCaptionStore } from '../store/captionStore.js';
import { useSettingsStore } from '../store/settingsStore.js';

// Spoken coaching cues. Every cue is also shown as an on-screen caption,
// so nothing is audio-only.

const SYMBOLS = /[\u{1F000}-\u{1FFFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}\u{FE0F}]/gu; // emoji, arrows, ticks

/** Turn on-screen text into text that sounds natural when read aloud. */
export function speakable(text) {
  return String(text)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(SYMBOLS, ' ')
    .replace(/…/g, '.')
    .replace(/\s[—–-]\s|[—–]/g, ', ')
    .replace(/(\d+)\s?m\b/g, (_, n) => `${n} ${n === '1' ? 'metre' : 'metres'}`)
    .replace(/\s+/g, ' ')
    .trim();
}

const GOOD = /natural|neural|premium|enhanced|samantha|google|siri|aria|jenny|ava|allison|zoe/i;
const ROBOTIC = /espeak|compact/i;

/** Choose the friendliest voice for the language (null = let the browser decide). */
export function pickVoice(voices, lang = 'en-US') {
  const want = lang.toLowerCase().replace('_', '-');
  const base = want.split('-')[0];
  let best = null;
  let bestScore = -Infinity;
  for (const v of voices || []) {
    const have = String(v.lang).toLowerCase().replace('_', '-');
    let score;
    if (have === want) score = 40;
    else if (have.split('-')[0] === base) score = 30;
    else continue; // never read English text with a Spanish voice, etc.
    if (GOOD.test(v.name)) score += 20;
    if (ROBOTIC.test(v.name)) score -= 30;
    if (v.localService) score += 3;
    if (v.default) score += 2;
    if (score > bestScore) {
      best = v;
      bestScore = score;
    }
  }
  return best;
}

const synth = () => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null);

let voice = null;
let started = false;
const inFlight = new Set(); // keeps utterances alive: some browsers drop them if garbage-collected

function loadVoice() {
  const s = synth();
  if (s) voice = pickVoice(s.getVoices(), (typeof navigator !== 'undefined' && navigator.language) || 'en-US');
}
function warmUp() {
  const s = synth();
  if (started || !s) return;
  started = true;
  loadVoice();
  s.addEventListener?.('voiceschanged', loadVoice); // voices often arrive a moment after page load
}

export function say(text) {
  const { voice: voiceOn, captions } = useSettingsStore.getState().settings;
  if (captions) useCaptionStore.getState().show(text);
  const s = synth();
  if (!voiceOn || !s) return;
  const clean = speakable(text);
  if (!clean) return;
  warmUp();
  try {
    if (s.speaking || s.pending) s.cancel(); // newest cue wins
    s.resume?.(); // un-stick browsers that stay "paused" after a cancel
    // One short utterance per sentence: long ones get cut off by some browsers.
    for (const sentence of clean.match(/[^.!?]+[.!?]*/g) || []) {
      const u = new SpeechSynthesisUtterance(sentence.trim());
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      }
      u.rate = 0.95; // a touch slower: clearer when you are half asleep
      u.pitch = 1;
      u.volume = 1;
      const release = () => inFlight.delete(u);
      u.onend = release;
      u.onerror = release;
      inFlight.add(u);
      s.speak(u);
    }
  } catch {
    /* speech not available */
  }
}
