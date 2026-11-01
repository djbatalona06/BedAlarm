import { useRef, useState } from 'react';
import { useHistoryStore } from '../store/historyStore.js';
import { summarize } from '../routine/runner.js';
import { storage } from '../store/storage.js';
import { hydrateAll } from '../store/hydrate.js';

const DAY_MS = 86400000;
const dayKey = (t) => new Date(t).toDateString();

export default function History() {
  const sessions = useHistoryStore((s) => s.sessions);
  const done = sessions.filter((s) => s.status === 'complete').sort((a, b) => b.finishedAt - a.finishedAt);
  const fileRef = useRef(null);
  const [msg, setMsg] = useState('');

  const totals = done.reduce(
    (acc, s) => {
      const t = summarize(s).totals;
      acc.squat += t.squat;
      acc.pushup += t.pushup;
      acc.breathe += t.breathe;
      return acc;
    },
    { squat: 0, pushup: 0, breathe: 0 },
  );

  // Last 7 days: which mornings you showed up. No "streak lost" shame.
  const daysDone = new Set(done.map((s) => dayKey(s.finishedAt)));
  const week = Array.from({ length: 7 }, (_, i) => {
    const t = Date.now() - (6 - i) * DAY_MS;
    return { label: new Date(t).toLocaleDateString([], { weekday: 'narrow' }), on: daysDone.has(dayKey(t)) };
  });

  async function exportData() {
    const payload = await storage.exportAll();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bedalarm-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg('Backup saved to your downloads.');
  }

  async function importData(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await storage.importAll(JSON.parse(await file.text()));
      await hydrateAll();
      setMsg('Backup restored.');
    } catch (err) {
      setMsg(err.message);
    }
    e.target.value = '';
  }

  return (
    <main className="screen">
      <header className="topbar">
        <h1 className="topbar__title">History</h1>
      </header>

      <section className="card">
        <h2 className="small muted">This week</h2>
        <ol className="week" aria-label="Mornings completed in the last 7 days">
          {week.map((d, i) => (
            <li key={i} className={d.on ? 'is-on' : ''}>
              <span className="week__dot" aria-hidden="true" />
              <span className="small">{d.label}</span>
              <span className="sr-only">{d.on ? 'done' : 'not done'}</span>
            </li>
          ))}
        </ol>
      </section>

      <dl className="stats">
        <div>
          <dt>Mornings</dt>
          <dd>{done.length}</dd>
        </div>
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
      </dl>

      <h2>Recent mornings</h2>
      {done.length === 0 && <p className="muted">Your first finished routine will show up here.</p>}
      <ul className="list">
        {done.slice(0, 30).map((s) => {
          const { totals: t, durationMs } = summarize(s);
          return (
            <li key={s.id} className="list__item">
              <div className="list__main">
                <span className="list__title">{new Date(s.finishedAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                <span className="muted small">
                  {s.routineName} · {t.squat + t.pushup} reps · {t.breathe} breaths · {Math.round((durationMs || 0) / 1000)}s
                  {s.scan === 'object' ? ' · 📷' : ''}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <section className="card">
        <h2>Your data is yours</h2>
        <p className="muted small">Everything is stored only on this device. Back it up or move it to another device as a JSON file.</p>
        <div className="row">
          <button className="btn btn--small" onClick={exportData}>
            ⬇ Export
          </button>
          <button className="btn btn--small btn--ghost" onClick={() => fileRef.current.click()}>
            ⬆ Import
          </button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={importData} />
        </div>
        {msg && (
          <p className="small" role="status">
            {msg}
          </p>
        )}
      </section>
    </main>
  );
}
