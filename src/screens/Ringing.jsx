import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlarmStore } from '../store/alarmStore.js';
import { useLibraryStore } from '../store/libraryStore.js';
import { useHistoryStore } from '../store/historyStore.js';
import { silence, SNOOZE_MINUTES } from '../platform/alarm.js';
import { useClock, formatClock } from '../hooks/useClock.js';
import { DEFAULT_ROUTINE_ID } from '../routine/defaults.js';

export default function Ringing() {
  const now = useClock(1000);
  const navigate = useNavigate();
  const { ringing, alarms, snooze } = useAlarmStore();
  const { routineById, objectById } = useLibraryStore();
  const alarm = alarms.find((a) => a.id === ringing?.alarmId);
  const routine = routineById(alarm?.routineId) || routineById(DEFAULT_ROUTINE_ID) || useLibraryStore.getState().routines[0];
  const object = routine?.objectId ? objectById(routine.objectId) : null;

  useEffect(() => {
    if (!ringing) navigate('/', { replace: true });
  }, [ringing, navigate]);

  if (!ringing || !routine) return null;

  async function start() {
    await useHistoryStore.getState().start(routine, alarm?.id ?? null);
    navigate(object ? '/scan' : '/run');
  }

  function doSnooze() {
    if (snooze()) {
      silence();
      navigate('/night');
    }
  }

  return (
    <main className="screen ring">
      <p className="ring__pulse" aria-hidden="true">
        ⏰
      </p>
      <h1 className="ring__time">{formatClock(now)}</h1>
      <p className="ring__msg">{alarm?.label || 'Good morning!'}</p>
      <p className="muted">
        To stop the alarm: {object ? <>scan your <strong>{object.name}</strong>, then </> : ''}finish “{routine.name}”.
      </p>
      <button className="btn btn--primary btn--big" onClick={start} autoFocus>
        I’m up — let’s go
      </button>
      {!ringing.snoozed && ringing.alarmId && (
        <button className="btn btn--ghost" onClick={doSnooze}>
          Snooze {SNOOZE_MINUTES} min (once)
        </button>
      )}
    </main>
  );
}
