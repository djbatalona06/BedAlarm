import { describe, it, expect } from 'vitest';
import { normalizeSteps, exerciseReps, withExerciseReps } from '../src/routine/tasks.js';
import { defaultRoutines } from '../src/routine/defaults.js';

describe('task rules', () => {
  it('every built-in routine ends with the calm-down', () => {
    for (const r of defaultRoutines()) expect(r.steps.at(-1).kind).toBe('breathe');
  });

  it('moves the calm-down last and adds one when missing', () => {
    expect(normalizeSteps([{ kind: 'breathe', target: 5 }, { kind: 'squat', target: 5 }, { kind: 'pushup', target: 5 }]).map((s) => s.kind)).toEqual(['squat', 'pushup', 'breathe']);
    expect(normalizeSteps([{ kind: 'pushup', target: 5 }]).at(-1)).toMatchObject({ kind: 'breathe', target: 3 });
  });

  it('the home dial changes exercise reps but not breaths', () => {
    const r = { steps: [{ kind: 'squat', target: 5 }, { kind: 'pushup', target: 8 }, { kind: 'breathe', target: 4 }] };
    expect(exerciseReps(r)).toBe(5);
    expect(withExerciseReps(r, 12).steps.map((s) => s.target)).toEqual([12, 12, 4]);
    expect(withExerciseReps(r, 999).steps[0].target).toBe(100); // clamped to the exercise's max
  });
});
