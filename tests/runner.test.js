import { describe, it, expect } from 'vitest';
import { startSession, recordProgress, resolveScan, currentStep, summarize, smallWins } from '../src/routine/runner.js';

const routine = {
  id: 'r1',
  name: 'Test',
  objectId: 'obj1',
  steps: [
    { id: 'a', kind: 'squat', target: 3 },
    { id: 'b', kind: 'breathe', target: 2 },
  ],
};

describe('routine runner', () => {
  it('walks through steps and completes', () => {
    let s = startSession(routine, { now: 0 });
    expect(s.scan).toBe('pending');
    s = resolveScan(s, 'object');
    expect(currentStep(s).kind).toBe('squat');
    s = recordProgress(s, 1, 100);
    s = recordProgress(s, 3, 200);
    expect(currentStep(s).kind).toBe('breathe');
    s = recordProgress(s, 2, 5000);
    expect(s.status).toBe('complete');
    expect(s.finishedAt).toBe(5000);
    expect(summarize(s)).toEqual({ totals: { squat: 3, pushup: 0, breathe: 2 }, durationMs: 5000 });
  });

  it('fallback scan adds bonus squats at the front', () => {
    const s = resolveScan(startSession(routine), 'fallback');
    expect(s.steps).toHaveLength(3);
    expect(s.steps[0]).toMatchObject({ kind: 'squat', target: 2, bonus: true });
  });

  it('clamps progress and ignores updates after completion', () => {
    let s = startSession({ ...routine, steps: [{ kind: 'squat', target: 2 }] });
    s = recordProgress(s, 99, 10);
    expect(s.steps[0].done).toBe(2);
    expect(recordProgress(s, 5)).toBe(s);
  });

  it('celebrates small wins against the previous run', () => {
    let prev = startSession(routine, { now: 0 });
    prev = recordProgress(recordProgress(prev, 3, 1000), 2, 20000);
    let now = startSession({ ...routine, steps: [{ kind: 'squat', target: 6 }, { kind: 'breathe', target: 2 }] }, { now: 100000 });
    now = recordProgress(recordProgress(now, 6, 101000), 2, 110000);
    const wins = smallWins(now, [prev]);
    expect(wins.join(' ')).toMatch(/\+3 reps/);
    expect(wins.join(' ')).toMatch(/quicker/);
    expect(wins.join(' ')).toMatch(/2 mornings/);
  });
});
