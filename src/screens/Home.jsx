import { Link, useNavigate } from 'react-router-dom';
import { useAlarmStore } from '../store/alarmStore.js';
import { useLibraryStore } from '../store/libraryStore.js';
import { useSettingsStore } from '../store/settingsStore.js';
import { useHistoryStore } from '../store/historyStore.js';
import { nextAlarm, formatCountdown, DAY_LABELS } from '../platform/schedule.js';
import { armBedside, ring, requestNotifyPermission } from '../platform/alarm.js';
import { useClock, formatClock, formatAlarmTime } from '../hooks/useClock.js';

function daysText(days) {
  if (!days.length) return 'Once';
  if (days.length === 7) return 'Every day';
  if (days.join() === '1,2,3,4,5') return 'Weekdays';
  if (days.join() === '0,6') return 'Weekends';
  return days.map((d) => DAY_LABELS[d]).join(' ');
}

export default function Home() {
  const now = useClock(15000);
  const navigate = useNavigate();
  const { alarms, saveAlarm, testRing } = useAlarmStore();
  const routines = useLibraryStore((s) => s.routines);
  const objects = useLibraryStore((s) => s.objects);
  const { settings, update } = useSettingsStore();
  const active = useHistoryStore((s) => s.active);
  const next = nextAlarm(alarms, now);
  const routineName = (id) => routines.find((r) => r.id === id)?.name ?? 'Tiny wake-up';
  const objectFor = (routineId) => objects.find((o) => o.id === routines.find((r) => r.id === routineId)?.objectId);

  async function goToBed() {
    await armBedside();
    requestNotifyPermission();
    navigate('/night');
  }

  async function tryNow() {
    await armBedside();
    testRing();
    ring({ sound: settings.sound, vibrate: settings.haptics });
    navigate('/ring');
  }

  return (
    <main className="screen">
      <header className="topbar">
        <h1 className="brand">
          Bed<span>Alarm</span>
        </h1>
        <p className="topbar__clock">{formatClock(now)}</p>
      </header>

      {!settings.onboarded && (
        <section className="card card--hero" aria-labelledby="welcome">
          <h2 id="welcome">Wake up by moving 🌅</h2>
          <ol className="steps-list">
            <li>Set an alarm and pick a tiny routine.</li>
            <li>(Optional) Pair an object — like your coffee mug in the kitchen.</li>
            <li>When it rings: scan the object, do a few squats and breaths. Done!</li>
          </ol>
          <p className="muted small">No account. The camera only turns on when you start, and video never leaves your phone.</p>
          <button className="btn btn--ghost" onClick={() => update({ onboarded: true })}>
            Got it
          </button>
        </section>
      )}

      {active && active.status === 'in_progress' && (
        <section className="card card--accent">
          <h2>Routine in progress</h2>
          <p className="muted">You were partway through “{active.routineName}”. Your reps are saved.</p>
          <Link className="btn btn--primary" to={active.scan === 'pending' ? '/scan' : '/run'}>
            Resume
          </Link>
        </section>
      )}

      <section className="card next" aria-live="polite">
        {next ? (
          <>
            <p className="next__label">Next alarm</p>
            <p className="next__time">{formatAlarmTime(next.alarm.time)}</p>
            <p className="muted">
              in {formatCountdown(next.at - now)} · {routineName(next.alarm.routineId)}
              {objectFor(next.alarm.routineId) && ` · scan ${objectFor(next.alarm.routineId).name}`}
            </p>
          </>
        ) : (
          <>
            <p className="next__label">No alarm set</p>
            <p className="muted">Add one below to get started.</p>
          </>
        )}
        <button className="btn btn--primary btn--big" onClick={goToBed} disabled={!next}>
          🌙 Go to bed
        </button>
        <p className="hint small">
          Bedside mode keeps BedAlarm awake on your nightstand. Keep it plugged in, and set a backup alarm in your
          phone’s clock app too.
        </p>
      </section>

      <section aria-labelledby="alarms-h">
        <div className="section-head">
          <h2 id="alarms-h">Alarms</h2>
          <Link className="btn btn--small" to="/alarms/new">
            + Add
          </Link>
        </div>
        {alarms.length === 0 && <p className="muted">No alarms yet.</p>}
        <ul className="list">
          {alarms.map((a) => (
            <li key={a.id} className="list__item">
              <Link to={`/alarms/${a.id}`} className="list__main">
                <span className="list__title">{formatAlarmTime(a.time)}</span>
                <span className="muted small">
                  {daysText(a.days)} · {routineName(a.routineId)}
                  {a.label ? ` · ${a.label}` : ''}
                </span>
              </Link>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={a.enabled}
                  onChange={(e) => saveAlarm({ ...a, enabled: e.target.checked, snoozeUntil: null })}
                  aria-label={`Alarm at ${formatAlarmTime(a.time)} ${a.enabled ? 'on' : 'off'}`}
                />
                <span className="switch__track" aria-hidden="true" />
              </label>
            </li>
          ))}
        </ul>
      </section>

      <button className="btn btn--ghost" onClick={tryNow}>
        ▶ Try a wake-up now
      </button>
    </main>
  );
}
