import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlarmStore } from '../store/alarmStore.js';
import { nextAlarm, formatCountdown } from '../platform/schedule.js';
import { disarmBedside } from '../platform/alarm.js';
import { isAwakeLocked, wakeLockSupported } from '../platform/wakeLock.js';
import { useClock, formatClock, formatAlarmTime } from '../hooks/useClock.js';

/** Dim nightstand clock. Stays on all night (Wake Lock) so the alarm can ring. */
export default function Night() {
  const now = useClock(1000);
  const navigate = useNavigate();
  const alarms = useAlarmStore((s) => s.alarms);
  const next = nextAlarm(alarms, now);
  const [awake, setAwake] = useState(isAwakeLocked());

  useEffect(() => {
    const t = setInterval(() => setAwake(isAwakeLocked()), 2000);
    return () => clearInterval(t);
  }, []);

  async function exit() {
    await disarmBedside();
    navigate('/');
  }

  return (
    <main className="screen night">
      <p className="night__clock" aria-label={`Time now ${formatClock(now)}`}>
        {formatClock(now)}
      </p>
      {next ? (
        <p className="night__next">
          ⏰ {formatAlarmTime(next.alarm.time)} · in {formatCountdown(next.at - now)}
        </p>
      ) : (
        <p className="night__next">No alarm set</p>
      )}
      <p className="night__status small">
        {awake ? '● Screen will stay on' : wakeLockSupported() ? '○ Tap the screen if it dims' : '○ Turn off auto-lock in your phone settings'}
        {' · '}Keep plugged in
      </p>
      <button className="btn btn--ghost night__exit" onClick={exit}>
        Exit bedside mode
      </button>
    </main>
  );
}
