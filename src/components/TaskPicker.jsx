import { useEffect } from 'react';
import { EXERCISES, EXERCISE_KINDS } from '../routine/exercises.js';
import { isCalm } from '../routine/tasks.js';
import { isStepDone, isStepOpen } from '../routine/runner.js';
import { say } from '../platform/speech.js';

/**
 * "Pick your next task." Nothing starts by itself: you choose each task, in
 * the order you like. The calm-down unlocks once the exercises are done.
 */
export default function TaskPicker({ session, onPick, onAdd }) {
  const doneCount = session.steps.filter(isStepDone).length;

  useEffect(() => {
    say('Pick your next task.');
  }, [doneCount]);

  return (
    <section className="picker" aria-labelledby="picker-h">
      <h1 id="picker-h">Pick your next task</h1>
      <p className="muted">
        {doneCount} of {session.steps.length} done. Choose any order — the calm-down comes last.
      </p>
      <ul className="picker__list">
        {session.steps.map((s, i) => {
          const ex = EXERCISES[s.kind];
          const done = isStepDone(s);
          const open = isStepOpen(session, i);
          return (
            <li key={`${s.kind}-${i}`}>
              <button type="button" className={`picker__task ${done ? 'is-done' : ''}`} disabled={!open} onClick={() => onPick(i)}>
                <span className="picker__icon" aria-hidden="true">
                  {done ? '✅' : ex.icon}
                </span>
                <span className="picker__text">
                  <span className="picker__name">
                    {s.target} {ex.name}
                    {s.bonus && <span className="tag">bonus</span>}
                  </span>
                  <span className="muted small">
                    {done ? 'Done' : open ? (s.done > 0 ? `${s.done} done so far — tap to continue` : isCalm(s.kind) ? 'Last step: slow down and relax' : 'Tap to start') : 'Unlocks after the exercises'}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="picker__more">
        <p className="muted small">Want a little extra? It goes before the calm-down.</p>
        <div className="row">
          {EXERCISE_KINDS.filter((k) => !isCalm(k)).map((k) => (
            <button key={k} type="button" className="btn btn--small btn--ghost" onClick={() => onAdd(k)}>
              + 5 {EXERCISES[k].name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
