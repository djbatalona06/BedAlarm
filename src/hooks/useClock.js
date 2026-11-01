import { useEffect, useState } from 'react';

export function useClock(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export const formatClock = (d) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export function formatAlarmTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return formatClock(new Date(2000, 0, 1, h, m));
}
