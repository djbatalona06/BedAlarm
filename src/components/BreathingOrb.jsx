import { useEffect, useRef, useState } from 'react';
import { say } from '../platform/speech.js';
import * as haptics from '../platform/haptics.js';

/**
 * Guided breathing: the orb grows while you breathe in and shrinks while you
 * breathe out. Each full in+out counts as one breath.
 */
export default function BreathingOrb({ target, done, inSeconds = 4, outSeconds = 6, onBreath }) {
  const [phase, setPhase] = useState('ready'); // ready | in | out
  const [secondsLeft, setSecondsLeft] = useState(3);
  const doneRef = useRef(done);
  doneRef.current = done;
  const onBreathRef = useRef(onBreath);
  onBreathRef.current = onBreath;

  useEffect(() => {
    let cancelled = false;
    let timer = null;
    const wait = (s) =>
      new Promise((resolve) => {
        let left = s;
        setSecondsLeft(left);
        timer = setInterval(() => {
          left -= 1;
          setSecondsLeft(Math.max(left, 0));
          if (left <= 0) {
            clearInterval(timer);
            resolve();
          }
        }, 1000);
      });

    (async () => {
      say('Get comfortable. Breathe with the circle.');
      await wait(3);
      // Count locally: the parent's `done` prop only updates after a re-render,
      // and reading it here could start one extra "Breathe in" after the last breath.
      let count = doneRef.current;
      while (!cancelled && count < target) {
        setPhase('in');
        say('Breathe in');
        await wait(inSeconds);
        if (cancelled) return;
        setPhase('out');
        say('And out');
        await wait(outSeconds);
        if (cancelled) return;
        haptics.tap();
        count += 1;
        onBreathRef.current(count);
      }
    })();
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [target, inSeconds, outSeconds]);

  const label = phase === 'ready' ? 'Get ready' : phase === 'in' ? 'Breathe in' : 'Breathe out';
  return (
    <div className="breath">
      <div
        className={`breath__orb breath__orb--${phase}`}
        style={{ '--in': `${inSeconds}s`, '--out': `${outSeconds}s` }}
        aria-hidden="true"
      />
      <p className="breath__label" aria-live="polite">
        {label} <span className="breath__secs">{secondsLeft}</span>
      </p>
    </div>
  );
}
