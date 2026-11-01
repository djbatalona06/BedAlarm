import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CameraView from '../components/CameraView.jsx';
import { useLibraryStore } from '../store/libraryStore.js';
import { getImageClassifier, toCategories } from '../vision/visionEngine.js';
import { useVideoLoop } from '../vision/useVideoLoop.js';
import { labelsForPairing } from '../vision/objectMatch.js';
import { newId } from '../routine/runner.js';
import * as haptics from '../platform/haptics.js';

const WINDOW = 20; // average the last ~20 classifications so one odd frame doesn't decide

/** Teach BedAlarm an object: point at it, name it, save. */
export default function Pair() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const routineId = params.get('routine');
  const { saveObject, saveRoutine, routineById } = useLibraryStore();
  const videoRef = useRef(null);
  const [classifier, setClassifier] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState(null);
  const [top, setTop] = useState([]);
  const [name, setName] = useState('');
  const recent = useRef([]);
  const lastRun = useRef(0);

  useEffect(() => {
    let alive = true;
    getImageClassifier()
      .then((c) => alive && setClassifier(c))
      .catch((e) => alive && setError(e.message || 'Could not load the scanner.'));
    return () => {
      alive = false;
    };
  }, []);

  useVideoLoop(videoRef, Boolean(classifier && cameraOn), (video, ts) => {
    if (ts - lastRun.current < 150) return;
    lastRun.current = ts;
    recent.current = [...recent.current.slice(-(WINDOW - 1)), toCategories(classifier.classifyForVideo(video, ts))];
    const sums = new Map();
    for (const frame of recent.current) for (const c of frame) sums.set(c.label, (sums.get(c.label) || 0) + c.score);
    const avg = [...sums].map(([label, s]) => ({ label, score: s / recent.current.length })).sort((a, b) => b.score - a.score);
    setTop(avg.slice(0, 3));
  });

  const labels = labelsForPairing(top);
  const canSave = labels.length > 0 && name.trim().length > 0;

  async function save() {
    const obj = { id: newId('object'), name: name.trim(), labels, createdAt: Date.now() };
    await saveObject(obj);
    const routine = routineId && routineById(routineId);
    if (routine) await saveRoutine({ ...routine, objectId: obj.id });
    haptics.success();
    navigate(routineId ? `/routines/${routineId}` : '/routines', { replace: true });
  }

  return (
    <main className="screen screen--camera">
      <CameraView facingMode="environment" videoRef={videoRef} onReady={() => setCameraOn(true)} />
      <div className="hud hud--bottom">
        <h1 className="hud__title">Pair an object</h1>
        <p className="muted small">
          Pick something you only reach by getting out of bed — your coffee mug, toothbrush or running shoes. Fill the
          frame with it.
        </p>
        <ul className="seeing" aria-live="polite" aria-label="What the scanner sees">
          {error && <li className="error">{error}</li>}
          {!error && !classifier && <li className="muted">Loading scanner…</li>}
          {top.map((c) => (
            <li key={c.label}>
              <span>{c.label}</span>
              <meter min={0} max={1} value={c.score} />
            </li>
          ))}
        </ul>
        <label className="field">
          <span className="field__label">Give it a name</span>
          <input className="input" value={name} maxLength={30} placeholder="e.g. Coffee mug" onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="row">
          <button className="btn btn--ghost" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button className="btn btn--primary" disabled={!canSave} onClick={save}>
            Save object
          </button>
        </div>
      </div>
    </main>
  );
}
