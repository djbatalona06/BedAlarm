import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAlarmStore } from '../store/alarmStore.js';
import { useLibraryStore } from '../store/libraryStore.js';
import { DAY_LABELS } from '../platform/schedule.js';
import { newId } from '../routine/runner.js';
import { DEFAULT_ROUTINE_ID } from '../routine/defaults.js';

export default function AlarmEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { alarms, saveAlarm, deleteAlarm } = useAlarmStore();
  const routines = useLibraryStore((s) => s.routines);
  const existing = alarms.find((a) => a.id === id);
  const [alarm, setAlarm] = useState(
    () =>
      existing ?? {
        id: newId('alarm'),
        time: '07:00',
        days: [1, 2, 3, 4, 5],
        routineId: routines[0]?.id ?? DEFAULT_ROUTINE_ID,
        label: '',
        enabled: true,
      },
  );
  const set = (patch) => setAlarm((a) => ({ ...a, ...patch }));
  const toggleDay = (d) => set({ days: alarm.days.includes(d) ? alarm.days.filter((x) => x !== d) : [...alarm.days, d].sort() });

  async function save(e) {
    e.preventDefault();
    await saveAlarm({ ...alarm, enabled: true, lastFiredAt: null, snoozeUntil: null });
    navigate('/');
  }

  return (
    <main className="screen">
      <header className="topbar">
        <button className="btn btn--small btn--ghost" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="topbar__title">{existing ? 'Edit alarm' : 'New alarm'}</h1>
      </header>
      <form className="form" onSubmit={save}>
        <label className="field">
          <span className="field__label">Wake-up time</span>
          <input className="input input--time" type="time" required value={alarm.time} onChange={(e) => set({ time: e.target.value })} />
        </label>

        <fieldset className="field">
          <legend className="field__label">Repeat</legend>
          <div className="chips">
            {DAY_LABELS.map((label, d) => (
              <button
                type="button"
                key={label}
                className={`chip ${alarm.days.includes(d) ? 'chip--on' : ''}`}
                aria-pressed={alarm.days.includes(d)}
                onClick={() => toggleDay(d)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="muted small">{alarm.days.length ? 'Rings on the selected days.' : 'Rings once, then switches off.'}</p>
        </fieldset>

        <label className="field">
          <span className="field__label">Routine to turn it off</span>
          <select className="input" value={alarm.routineId} onChange={(e) => set({ routineId: e.target.value })}>
            {routines.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label">Label (optional)</span>
          <input className="input" value={alarm.label} maxLength={40} placeholder="e.g. Work days" onChange={(e) => set({ label: e.target.value })} />
        </label>

        <button className="btn btn--primary btn--big" type="submit">
          Save alarm
        </button>
        {existing && (
          <button
            type="button"
            className="btn btn--danger"
            onClick={async () => {
              await deleteAlarm(alarm.id);
              navigate('/');
            }}
          >
            Delete alarm
          </button>
        )}
      </form>
    </main>
  );
}
