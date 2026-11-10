import { useEffect, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlarmStore } from '../store/alarmStore.js';
import { useSettingsStore } from '../store/settingsStore.js';
import { nextAlarm, formatCountdown } from '../platform/schedule.js';
import { disarmBedside } from '../platform/alarm.js';
import { wakeLockState, subscribeWakeLock, keepAwake, allowSleep } from '../platform/wakeLock.js';
import { isKeepAliveRunning, subscribeKeepAlive, setKeepAliveInfo } from '../platform/keepAlive.js';
import { useClock, formatClock, formatAlarmTime } from '../hooks/useClock.js';
import StayAwakeTips from '../components/StayAwakeTips.jsx';

function statusText({ lock, helperOn, wantScreenOn }) {
  if (lock === 'on') return '● Screen will stay on';
  const why = wantScreenOn ? 'Your phone won’t hold the screen on' : '“Keep screen on” is off';
  return helperOn ? `◐ ${why} — the silent helper is running` : `○ ${why} — it may turn off`;
}

/** Dim nightstand clock. Stays on all night (Wake Lock) so the alarm can ring. */
export default function Night() {
  const now = useClock(1000);
  const navigate = useNavigate();
  const alarms = useAlarmStore((s) => s.alarms);
  const { settings, update } = useSettingsStore();
  const next = nextAlarm(alarms, now);
  // Live status straight from the phone, so the label is never out of date.
  const lock = useSyncExternalStore(subscribeWakeLock, wakeLockState);
  const helperOn = useSyncExternalStore(subscribeKeepAlive, isKeepAliveRunning);

  // Show the next alarm on the lock-screen card.
  const nextTime = next ? formatAlarmTime(next.alarm.time) : null;
  useEffect(() => {
    setKeepAliveInfo({
      title: 'BedAlarm — bedside mode',
      subtitle: nextTime ? `Alarm at ${nextTime}` : 'No alarm set',
      icon: `${import.meta.env.BASE_URL}icons/icon-512.png`,
    });
  }, [nextTime]);

  function toggleScreen(e) {
    const on = e.target.checked;
    update({ keepScreenOn: on });
    if (on) keepAwake();
    else allowSleep();
  }

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
      <p className="night__status small" role="status">
        {statusText({ lock, helperOn, wantScreenOn: settings.keepScreenOn })} · Keep plugged in
      </p>
      <label className="night__toggle small">
        <input type="checkbox" checked={settings.keepScreenOn} onChange={toggleScreen} disabled={lock === 'unsupported'} />
        Keep screen on
      </label>
      <details className="night__tips" open={lock !== 'on' || undefined}>
        <summary>How to keep it on all night</summary>
        <StayAwakeTips />
      </details>
      <button className="btn btn--ghost night__exit" onClick={exit}>
        Exit bedside mode
      </button>
    </main>
  );
}
