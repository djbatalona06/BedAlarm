// The building blocks of every routine. `calm: true` marks the cool-down task,
// which is always done last so the morning ends relaxed, never out of breath.
export const EXERCISES = {
  squat: { kind: 'squat', name: 'Squats', unit: 'reps', icon: '🦵', camera: true, min: 1, max: 100, tip: 'Stand sideways to the camera, phone at hip height, whole body in view.' },
  pushup: { kind: 'pushup', name: 'Push-ups', unit: 'reps', icon: '💪', camera: true, min: 1, max: 100, tip: 'Put the phone on the floor about 2 m away, side-on. Knees down is fine!' },
  breathe: { kind: 'breathe', name: 'Deep breaths', unit: 'breaths', icon: '🌬️', camera: false, calm: true, min: 1, max: 30, tip: 'Breathe in as the circle grows, out as it shrinks.' },
};

export const EXERCISE_KINDS = Object.keys(EXERCISES);
