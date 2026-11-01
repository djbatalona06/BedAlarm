import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHistoryStore } from '../store/historyStore.js';
import { summarize, smallWins } from '../routine/runner.js';
import { useCaptionStore } from '../store/captionStore.js';

export default function Results() {
  const navigate = useNavigate();
  const { active, sessions } = useHistoryStore();

  useEffect(() => useCaptionStore.getState().clear(), []);
  useEffect(() => {
    if (!active || active.status !== 'complete') navigate('/', { replace: true });
  }, [active, navigate]);
  if (!active || active.status !== 'complete') return null;

  const { totals, durationMs } = summarize(active);
  const wins = smallWins(active, sessions);
  const mins = Math.floor((durationMs || 0) / 60000);
  const secs = Math.round(((durationMs || 0) % 60000) / 1000);

  async function done() {
    await useHistoryStore.getState().clearActive();
    navigate('/', { replace: true });
  }

  return (
    <main className="screen results">
      <p className="results__burst" aria-hidden="true">
        🎉
      </p>
      <h1>You’re up!</h1>
      <p className="muted">Alarm off. Morning started.</p>
      <dl className="stats">
        <div>
          <dt>Squats</dt>
          <dd>{totals.squat}</dd>
        </div>
        <div>
          <dt>Push-ups</dt>
          <dd>{totals.pushup}</dd>
        </div>
        <div>
          <dt>Breaths</dt>
          <dd>{totals.breathe}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>
            {mins}:{String(secs).padStart(2, '0')}
          </dd>
        </div>
      </dl>
      <ul className="wins">
        {wins.map((w) => (
          <li key={w}>✨ {w}</li>
        ))}
      </ul>
      <button className="btn btn--primary btn--big" onClick={done} autoFocus>
        Done
      </button>
    </main>
  );
}
