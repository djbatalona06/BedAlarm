import { describe, it, expect } from 'vitest';
import { startSession, recordProgress, resolveScan, currentStep, summarize, smallWins, pickStep, leaveStep, addExtraStep, isStepOpen } from '../src/routine/runner.js';

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
  it('only moves when you pick a task, and finishes after the last one', () => {
    let s = resolveScan(startSession(routine, { now: 0 }), 'object');
    expect(s.scan).toBe('object');
    expect(currentStep(s)).toBeNull(); // starts on the task menu: nothing is automatic
    s = pickStep(s, 0);
    expect(currentStep(s).kind).toBe('squat');
    s = recordProgress(s, 1, 100);
    s = recordProgress(s, 3, 200);
    expect(currentStep(s)).toBeNull(); // finished a task -> back to the menu, not the next task
    s = pickStep(s, 1);
    expect(currentStep(s).kind).toBe('breathe');
    s = recordProgress(s, 2, 5000);
    expect(s.status).toBe('complete');
    expect(s.finishedAt).toBe(5000);
    expect(summarize(s)).toEqual({ totals: { squat: 3, pushup: 0, breathe: 2 }, durationMs: 5000 });
  });

  it('lets you do the exercises in any order but keeps the calm-down last', () => {
    const r = { ...routine, steps: [{ kind: 'squat', target: 1 }, { kind: 'pushup', target: 1 }, { kind: 'breathe', target: 1 }] };
    let s = startSession(r, { now: 0 });
    expect(isStepOpen(s, 2)).toBe(false); // calm-down locked
    expect(pickStep(s, 2)).toBe(s);
    s = recordProgress(pickStep(s, 1), 1, 10); // push-up first
    expect(isStepOpen(s, 2)).toBe(false); // squats still to do
    s = recordProgress(pickStep(s, 0), 1, 20);
    expect(isStepOpen(s, 2)).toBe(true);
    s = recordProgress(pickStep(s, 2), 1, 30);
    expect(s.status).toBe('complete');
  });

  it('puts a calm-down at the end even if the routine has it first or not at all', () => {
    const mixed = startSession({ ...routine, steps: [{ kind: 'breathe', target: 2 }, { kind: 'pushup', target: 4 }] });
    expect(mixed.steps.map((x) => x.kind)).toEqual(['pushup', 'breathe']);
    const none = startSession({ ...routine, steps: [{ kind: 'squat', target: 2 }] });
    expect(none.steps.map((x) => x.kind)).toEqual(['squat', 'breathe']);
  });

  it('can go back to the menu and keeps the progress', () => {
    let s = pickStep(startSession(routine), 0);
    s = recordProgress(s, 2, 10);
    s = leaveStep(s);
    expect(currentStep(s)).toBeNull();
    expect(s.steps[0].done).toBe(2);
  });

  it('extra exercises are added before the calm-down', () => {
    const s = addExtraStep(startSession(routine), 'pushup', 5);
    expect(s.steps.map((x) => x.kind)).toEqual(['squat', 'pushup', 'breathe']);
    expect(addExtraStep(s, 'breathe', 5)).toBe(s);
  });

  it('fallback scan adds bonus squats at the front', () => {
    const s = resolveScan(startSession(routine), 'fallback');
    expect(s.steps).toHaveLength(3);
    expect(s.steps.at(-1).kind).toBe('breathe');
    expect(s.steps[0]).toMatchObject({ kind: 'squat', target: 2, bonus: true });
  });

  it('clamps progress and ignores updates after completion', () => {
    let s = pickStep(startSession({ ...routine, steps: [{ kind: 'squat', target: 2 }] }), 0);
    s = recordProgress(s, 99, 10);
    expect(s.steps[0].done).toBe(2);
    expect(recordProgress(s, 5)).toBe(s);
  });

  it('celebrates small wins against the previous run', () => {
    let prev = startSession(routine, { now: 0 });
    prev = recordProgress(pickStep(recordProgress(pickStep(prev, 0), 3, 1000), 1), 2, 20000);
    let now = startSession({ ...routine, steps: [{ kind: 'squat', target: 6 }, { kind: 'breathe', target: 2 }] }, { now: 100000 });
    now = recordProgress(pickStep(recordProgress(pickStep(now, 0), 6, 101000), 1), 2, 110000);
    const wins = smallWins(now, [prev]);
    expect(wins.join(' ')).toMatch(/\+3 reps/);
    expect(wins.join(' ')).toMatch(/quicker/);
    expect(wins.join(' ')).toMatch(/2 mornings/);
  });
});
