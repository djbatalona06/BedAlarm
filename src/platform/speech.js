import { useCaptionStore } from '../store/captionStore.js';
import { useSettingsStore } from '../store/settingsStore.js';

// Spoken coaching cues. Every cue is also shown as an on-screen caption,
// so nothing is audio-only.
export function say(text) {
  const { voice, captions } = useSettingsStore.getState().settings;
  if (captions) useCaptionStore.getState().show(text);
  if (!voice || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    window.speechSynthesis.speak(u);
  } catch {
    /* speech not available */
  }
}
