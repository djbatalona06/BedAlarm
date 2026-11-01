import { useCaptionStore } from '../store/captionStore.js';

/** Subtitles for every spoken cue (role=status so screen readers announce them). */
export default function Captions() {
  const { text, key } = useCaptionStore();
  return (
    <div className="captions" role="status" aria-live="polite">
      {text && (
        <p key={key} className="captions__text">
          {text}
        </p>
      )}
    </div>
  );
}
