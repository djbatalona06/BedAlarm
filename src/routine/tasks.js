import { EXERCISES } from './exercises.js';

// Rules for the tasks inside a routine. Pure functions, easy to test.
//
//  - Exercise tasks (squats, push-ups) can be done in any order you choose.
//  - The calm-down task (deep breaths) always comes last.

export const CALM_KIND = 'breathe';
export const DEFAULT_CALM_TARGET = 3;

export const isCalm = (kind) => Boolean(EXERCISES[kind]?.calm);

/** Exercises first, calm-down last. A calm-down is added if there is none. */
export function normalizeSteps(steps = []) {
  const work = steps.filter((s) => !isCalm(s.kind));
  const calm = steps.filter((s) => isCalm(s.kind));
  return [...work, ...(calm.length ? calm : [{ id: 'step-calm', kind: CALM_KIND, target: DEFAULT_CALM_TARGET }])];
}

export const normalizeRoutine = (routine) => ({ ...routine, steps: normalizeSteps(routine.steps) });

/** Reps of the first exercise task (what the home-page dial shows). */
export function exerciseReps(routine) {
  return routine?.steps.find((s) => !isCalm(s.kind))?.target ?? null;
}

/** Same routine, with every exercise task set to `reps` (breaths untouched). */
export function withExerciseReps(routine, reps) {
  return {
    ...routine,
    steps: routine.steps.map((s) => {
      if (isCalm(s.kind)) return s;
      const { min, max } = EXERCISES[s.kind];
      return { ...s, target: Math.max(min, Math.min(max, Math.round(reps))) };
    }),
  };
}
