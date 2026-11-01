import { EXERCISE_JOINTS } from './landmarks.js';
import { minVisibility } from './angles.js';

export const MIN_VISIBILITY = 0.5;

/**
 * Squats and push-ups are counted from the side. Pick whichever body side the
 * camera sees best. Returns 'left' | 'right' | null (null = not in frame).
 */
export function pickSide(landmarks, exercise) {
  const joints = EXERCISE_JOINTS[exercise];
  if (!landmarks || !joints) return null;
  const score = (ids) => minVisibility(...ids.map((i) => landmarks[i]));
  const left = score(joints.left);
  const right = score(joints.right);
  const best = left >= right ? 'left' : 'right';
  return Math.max(left, right) >= MIN_VISIBILITY ? best : null;
}
