import { useEffect, useRef, useState } from 'react';
import CameraView from './CameraView.jsx';
import SkeletonOverlay from './SkeletonOverlay.jsx';
import { getPoseLandmarker } from '../vision/visionEngine.js';
import { useVideoLoop } from '../vision/useVideoLoop.js';
import { createRepCounter } from '../vision/repCounter.js';
import { EXERCISES } from '../routine/exercises.js';
import { useSettingsStore } from '../store/settingsStore.js';
import { playRepChime } from '../platform/sound.js';
import * as haptics from '../platform/haptics.js';
import { say } from '../platform/speech.js';

const CUE_RED_MS = 1500;

function useElapsed() {
  const [start] = useState(() => Date.now());
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSecs(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, [start]);
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

/**
 * One camera-counted exercise. Minimal HUD: reps, form status, timer.
 * `onProgress(totalDone)` is called on every counted rep.
 */
export default function ExerciseStep({ step, onProgress }) {
  const ex = EXERCISES[step.kind];
  const settings = useSettingsStore((s) => s.settings);
  const videoRef = useRef(null);
  const landmarksRef = useRef(null);
  const counter = useRef(createRepCounter(step.kind));
  const base = useRef(step.done); // resume support: reps already saved
  const lastCueAt = useRef(-Infinity);
  const [landmarker, setLandmarker] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [modelError, setModelError] = useState(null);
  const [reps, setReps] = useState(step.done);
  const [status, setStatus] = useState('Loading pose model…');
  const [good, setGood] = useState(true);
  const [pop, setPop] = useState(0);
  const elapsed = useElapsed();

  useEffect(() => {
    let alive = true;
    getPoseLandmarker()
      .then((l) => alive && setLandmarker(l))
      .catch((e) => alive && setModelError(e.message || 'Pose model failed to load.'));
    say(ex.tip);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function countRep(total) {
    setReps(total);
    setPop((p) => p + 1);
    if (settings.sound) playRepChime(total);
    if (settings.haptics) haptics.tap();
    const left = step.target - total;
    say(left > 0 ? String(total) : 'Done!');
    onProgress(total);
  }

  useVideoLoop(videoRef, Boolean(landmarker && cameraOn), (video, ts) => {
    const result = landmarker.detectForVideo(video, ts);
    const lm = result.landmarks?.[0] || null;
    landmarksRef.current = lm;
    if (!lm) {
      setStatus('Step into view');
      setGood(false);
      return;
    }
    const ev = counter.current.update(lm, ts);
    if (ev.type === 'rep') countRep(base.current + ev.reps);
    if (ev.type === 'cue') {
      lastCueAt.current = ts;
      say(ev.text);
    }
    const cueActive = ts - lastCueAt.current < CUE_RED_MS;
    setGood(ev.side != null && !cueActive);
    setStatus(ev.side == null ? 'Turn side-on to the camera' : ev.phase === 'down' ? 'Good depth ✓' : 'Ready — go!');
  });

  const showTap = settings.allowTapCount || cameraFailed || Boolean(modelError);
  return (
    <div className="exercise">
      <CameraView
        facingMode="user"
        videoRef={videoRef}
        onReady={() => setCameraOn(true)}
        onError={() => setCameraFailed(true)}
      >
        <SkeletonOverlay landmarksRef={landmarksRef} good={good} colorBlind={settings.colorBlind} />
      </CameraView>
      <div className="hud hud--top">
        <p className="hud__reps" key={pop} aria-live="polite" aria-label={`${reps} of ${step.target} ${ex.name}`}>
          <span className="hud__count">{reps}</span>
          <span className="hud__target">/{step.target}</span>
        </p>
        <p className="hud__name">{ex.name}</p>
      </div>
      <div className="hud hud--bottom hud--row">
        <p className={`hud__status ${good ? 'is-good' : 'is-bad'}`}>
          <span className="hud__shape" aria-hidden="true" />
          {modelError || status}
        </p>
        <p className="hud__timer" aria-label="Time on this step">
          {elapsed}
        </p>
      </div>
      {showTap && (
        <button className="btn btn--primary btn--big exercise__tap" onClick={() => countRep(reps + 1)}>
          +1 rep (tap to count)
        </button>
      )}
    </div>
  );
}
