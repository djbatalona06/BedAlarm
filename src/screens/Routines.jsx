import { Link, useNavigate } from 'react-router-dom';
import { useLibraryStore } from '../store/libraryStore.js';
import { useHistoryStore } from '../store/historyStore.js';
import { EXERCISES } from '../routine/exercises.js';
import { newId } from '../routine/runner.js';

const stepsText = (steps) => steps.map((s) => `${s.target} ${EXERCISES[s.kind].name.toLowerCase()}`).join(' · ');

export default function Routines() {
  const navigate = useNavigate();
  const { routines, objects, saveRoutine } = useLibraryStore();

  async function create() {
    const r = { id: newId('routine'), name: 'My routine', objectId: null, steps: [{ id: newId('step'), kind: 'squat', target: 5 }, { id: newId('step'), kind: 'breathe', target: 3 }] };
    await saveRoutine(r);
    navigate(`/routines/${r.id}`);
  }

  async function practise(routine) {
    await useHistoryStore.getState().start(routine);
    navigate(routine.objectId ? '/scan' : '/run');
  }

  return (
    <main className="screen">
      <header className="topbar">
        <h1 className="topbar__title">Routines</h1>
        <button className="btn btn--small" onClick={create}>
          + New
        </button>
      </header>
      <p className="muted">A routine is the set of tasks that switches the alarm off. You pick the order each morning, and the calm-down is always last. Small is good — consistency beats intensity.</p>
      <ul className="list">
        {routines.map((r) => {
          const obj = objects.find((o) => o.id === r.objectId);
          return (
            <li key={r.id} className="list__item list__item--stack">
              <Link to={`/routines/${r.id}`} className="list__main">
                <span className="list__title">{r.name}</span>
                <span className="muted small">
                  {obj ? `📷 Scan ${obj.name} → ` : ''}
                  {stepsText(r.steps)}
                </span>
              </Link>
              <button className="btn btn--small btn--ghost" onClick={() => practise(r)}>
                ▶ Practise
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
