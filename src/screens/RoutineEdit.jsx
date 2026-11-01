import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLibraryStore } from '../store/libraryStore.js';
import { useAlarmStore } from '../store/alarmStore.js';
import { EXERCISES, EXERCISE_KINDS } from '../routine/exercises.js';
import { newId } from '../routine/runner.js';
import Stepper from '../components/Stepper.jsx';

export default function RoutineEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { routineById, objects, saveRoutine, deleteRoutine, deleteObject } = useLibraryStore();
  const alarms = useAlarmStore((s) => s.alarms);
  const original = routineById(id);
  const [routine, setRoutine] = useState(original);
  if (!routine) {
    return (
      <main className="screen">
        <p>Routine not found.</p>
      </main>
    );
  }

  const set = (patch) => setRoutine((r) => ({ ...r, ...patch }));
  const setStep = (i, patch) => set({ steps: routine.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const move = (i, dir) => {
    const steps = routine.steps.slice();
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    [steps[i], steps[j]] = [steps[j], steps[i]];
    set({ steps });
  };
  const usedByAlarm = alarms.some((a) => a.routineId === routine.id);

  async function save() {
    await saveRoutine(routine);
    navigate('/routines');
  }

  async function pairNew() {
    await saveRoutine(routine); // keep edits before leaving
    navigate(`/pair?routine=${routine.id}`);
  }

  return (
    <main className="screen">
      <header className="topbar">
        <button className="btn btn--small btn--ghost" onClick={() => navigate('/routines')}>
          ← Back
        </button>
        <h1 className="topbar__title">Edit routine</h1>
      </header>

      <div className="form">
        <label className="field">
          <span className="field__label">Name</span>
          <input className="input" value={routine.name} maxLength={30} onChange={(e) => set({ name: e.target.value })} />
        </label>

        <fieldset className="field">
          <legend className="field__label">Scan to start (optional)</legend>
          <select className="input" value={routine.objectId || ''} onChange={(e) => set({ objectId: e.target.value || null })}>
            <option value="">No object — start right away</option>
            {objects.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <div className="row">
            <button type="button" className="btn btn--small" onClick={pairNew}>
              📷 Pair a new object
            </button>
            {routine.objectId && (
              <button type="button" className="btn btn--small btn--ghost" onClick={() => deleteObject(routine.objectId).then(() => set({ objectId: null }))}>
                Forget this object
              </button>
            )}
          </div>
        </fieldset>

        <fieldset className="field">
          <legend className="field__label">Steps</legend>
          <ol className="steps-edit">
            {routine.steps.map((s, i) => (
              <li key={s.id || i} className="steps-edit__item">
                <span className="steps-edit__icon" aria-hidden="true">
                  {EXERCISES[s.kind].icon}
                </span>
                <span className="steps-edit__name">{EXERCISES[s.kind].name}</span>
                <Stepper
                  value={s.target}
                  min={EXERCISES[s.kind].min}
                  max={EXERCISES[s.kind].max}
                  label={EXERCISES[s.kind].unit}
                  onChange={(target) => setStep(i, { target })}
                />
                <div className="steps-edit__tools">
                  <button type="button" className="btn btn--icon btn--ghost" onClick={() => move(i, -1)} aria-label="Move up" disabled={i === 0}>
                    ↑
                  </button>
                  <button type="button" className="btn btn--icon btn--ghost" onClick={() => move(i, 1)} aria-label="Move down" disabled={i === routine.steps.length - 1}>
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn btn--icon btn--ghost"
                    onClick={() => set({ steps: routine.steps.filter((_, j) => j !== i) })}
                    aria-label={`Remove ${EXERCISES[s.kind].name}`}
                    disabled={routine.steps.length === 1}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <div className="row">
            {EXERCISE_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                className="btn btn--small"
                onClick={() => set({ steps: [...routine.steps, { id: newId('step'), kind: k, target: k === 'breathe' ? 3 : 5 }] })}
              >
                + {EXERCISES[k].name}
              </button>
            ))}
          </div>
        </fieldset>

        <button className="btn btn--primary btn--big" onClick={save}>
          Save routine
        </button>
        <button
          className="btn btn--danger"
          disabled={usedByAlarm}
          title={usedByAlarm ? 'An alarm uses this routine' : undefined}
          onClick={async () => {
            await deleteRoutine(routine.id);
            navigate('/routines');
          }}
        >
          {usedByAlarm ? 'In use by an alarm' : 'Delete routine'}
        </button>
      </div>
    </main>
  );
}
