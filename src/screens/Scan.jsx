import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraView from '../components/CameraView.jsx';
import { useHistoryStore } from '../store/historyStore.js';
import { useLibraryStore } from '../store/libraryStore.js';
import { getImageClassifier, toCategories } from '../vision/visionEngine.js';
import { useVideoLoop } from '../vision/useVideoLoop.js';
import { frameMatches, createMatchHold } from '../vision/objectMatch.js';
import { resolveScan } from '../routine/runner.js';
import { FALLBACK_EXTRA_SQUATS } from '../routine/defaults.js';
import * as haptics from '../platform/haptics.js';
import { say } from '../platform/speech.js';

const CLASSIFY_EVERY_MS = 150; // ~7 fps is plenty for "is the mug there?"

/** Scan-to-start: hold the paired object in view for about a second. */
export default function Scan() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const active = useHistoryStore((s) => s.active);
  const { routineById, objectById } = useLibraryStore();
  const routine = active && routineById(active.routineId);
  const object = routine?.objectId ? objectById(routine.objectId) : null;
  const [classifier, setClassifier] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [seeing, setSeeing] = useState('');
  const [progress, setProgress] = useState(0);
  const hold = useRef(createMatchHold());
  const lastRun = useRef(0);
  const done = useRef(false);

  useEffect(() => {
    if (!active) navigate('/', { replace: true });
    else if (!object) finish('none');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let alive = true;
    getImageClassifier()
      .then((c) => alive && setClassifier(c))
      .catch((e) => alive && setLoadError(e.message || 'Could not load the scanner.'));
    if (object) say(`Find your ${object.name}`);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish(method) {
    if (done.current) return;
    done.current = true;
    const s = useHistoryStore.getState().active;
    if (s) useHistoryStore.getState().update(resolveScan(s, method));
    if (method === 'object') {
      haptics.success();
      say('Got it! Let’s move.');
    }
    navigate('/run', { replace: true });
  }

  useVideoLoop(videoRef, Boolean(classifier && cameraOn && object), (video, ts) => {
    if (ts - lastRun.current < CLASSIFY_EVERY_MS) return;
    lastRun.current = ts;
    const cats = toCategories(classifier.classifyForVideo(video, ts));
    setSeeing(cats[0] && cats[0].score > 0.15 ? cats[0].label : '');
    const p = hold.current(frameMatches(cats, object.labels), ts);
    setProgress(p);
    if (p >= 1) finish('object');
  });

  if (!active || !object) return null;

  return (
    <main className="screen screen--camera">
      <CameraView facingMode="environment" videoRef={videoRef} onReady={() => setCameraOn(true)}>
        <div className="scan__frame" style={{ '--p': progress }} aria-hidden="true" />
      </CameraView>
      <div className="hud hud--bottom">
        <h1 className="hud__title">Find your {object.name}</h1>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label="Scan match">
          <span className="progress__fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <p className="muted small" aria-live="polite">
          {loadError ? loadError : !classifier ? 'Loading scanner…' : seeing ? `I see: ${seeing}` : 'Point the camera at it and hold still.'}
        </p>
        <button className="btn btn--ghost" onClick={() => finish('fallback')}>
          Can’t scan? Do {FALLBACK_EXTRA_SQUATS} extra squats instead
        </button>
      </div>
    </main>
  );
}
