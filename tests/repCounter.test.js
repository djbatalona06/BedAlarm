import { describe, it, expect } from 'vitest';
import { createRepCounter } from '../src/vision/repCounter.js';
import { createEma } from '../src/vision/smoothing.js';
import { pickSide } from '../src/vision/sideDetect.js';
import { LM } from '../src/vision/landmarks.js';

// Feed a list of angles at 30fps; return all events.
function run(counter, angles, start = 0) {
  return angles.map((a, i) => counter.updateAngle(a, start + i * 33));
}
// One clean squat: stand (170) -> bottom (80) -> stand (170) over ~1.6s.
function squatCurve(bottom = 80) {
  const down = Array.from({ length: 25 }, (_, i) => 170 - ((170 - bottom) * i) / 24);
  const up = [...down].reverse();
  return [...down, ...up, ...Array(5).fill(170)];
}

describe('createEma', () => {
  it('smooths and ignores NaN', () => {
    const ema = createEma(0.5);
    expect(ema.push(100)).toBe(100);
    expect(ema.push(NaN)).toBe(100);
    expect(ema.push(200)).toBe(150);
  });
});

describe('rep counter', () => {
  it('counts clean squats', () => {
    const c = createRepCounter('squat');
    const angles = [...squatCurve(), ...squatCurve(), ...squatCurve()];
    const events = run(c, angles);
    expect(events.filter((e) => e.type === 'rep')).toHaveLength(3);
    expect(c.reps).toBe(3);
  });

  it('does not count jitter around standing as reps', () => {
    const c = createRepCounter('squat');
    const jitter = Array.from({ length: 300 }, (_, i) => 165 + Math.sin(i) * 12);
    run(c, jitter);
    expect(c.reps).toBe(0);
  });

  it('does not count a single-frame spike down (phantom rep)', () => {
    const c = createRepCounter('squat');
    run(c, [170, 170, 170, 60, 170, 170, 170, 170, 170]);
    expect(c.reps).toBe(0);
  });

  it('gives a depth cue for a shallow squat instead of a rep', () => {
    const c = createRepCounter('squat');
    const events = run(c, squatCurve(118));
    expect(c.reps).toBe(0);
    expect(events.some((e) => e.type === 'cue' && /lower/i.test(e.text))).toBe(true);
  });

  it('counts push-ups with their own thresholds', () => {
    const c = createRepCounter('pushup');
    run(c, [...squatCurve(70), ...squatCurve(70)]);
    expect(c.reps).toBe(2);
  });

  it('rejects unknown exercises', () => {
    expect(() => createRepCounter('jumping')).toThrow();
  });
});

describe('pickSide', () => {
  const body = (leftVis, rightVis) => {
    const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0 }));
    [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE].forEach((i) => (lm[i].visibility = leftVis));
    [LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE].forEach((i) => (lm[i].visibility = rightVis));
    return lm;
  };
  it('picks the better-seen side', () => {
    expect(pickSide(body(0.9, 0.4), 'squat')).toBe('left');
    expect(pickSide(body(0.3, 0.8), 'squat')).toBe('right');
  });
  it('returns null when the body is not in view', () => {
    expect(pickSide(body(0.2, 0.1), 'squat')).toBeNull();
    expect(pickSide(null, 'squat')).toBeNull();
  });
});
