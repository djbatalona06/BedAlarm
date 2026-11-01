import { jointAngle } from './angles.js';
import { createEma } from './smoothing.js';
import { pickSide } from './sideDetect.js';
import { EXERCISE_JOINTS } from './landmarks.js';

// Hysteresis thresholds (degrees). You must go BELOW `down` and then back
// ABOVE `up` for one rep. The gap between them stops jitter double-counting.
export const THRESHOLDS = {
  squat: { down: 100, up: 160, shallow: 130 },
  pushup: { down: 90, up: 155, shallow: 120 },
};

export const MIN_REP_MS = 600; // faster than this is almost certainly noise
export const CUE_COOLDOWN_MS = 3000; // don't nag

/**
 * Rep-counting state machine: UP -> DOWN -> UP = 1 rep.
 * Feed it either landmarks (update) or a ready-made angle (updateAngle).
 * Returns an event: { type: 'rep' | 'cue' | 'none' | 'lost', ... }.
 */
export function createRepCounter(exercise, { alpha = 0.35 } = {}) {
  const t = THRESHOLDS[exercise];
  if (!t) throw new Error(`Unknown exercise: ${exercise}`);
  const ema = createEma(alpha);
  let phase = 'up';
  let reps = 0;
  let minAngleThisRep = 180;
  let downAt = 0;
  let lastCueAt = -Infinity;
  let lastRepAt = -Infinity;

  function cue(text, now) {
    if (now - lastCueAt < CUE_COOLDOWN_MS) return null;
    lastCueAt = now;
    return { type: 'cue', text };
  }

  function updateAngle(rawAngle, now) {
    const angle = ema.push(rawAngle);
    if (angle == null) return { type: 'none', reps, phase, angle };

    if (phase === 'up') {
      if (angle < t.down) {
        phase = 'down';
        downAt = now;
        minAngleThisRep = angle;
      } else if (angle < t.shallow) {
        minAngleThisRep = Math.min(minAngleThisRep, angle);
      } else if (angle > t.up && minAngleThisRep < t.shallow && minAngleThisRep >= t.down) {
        // Came back up without reaching depth.
        minAngleThisRep = 180;
        const c = cue(exercise === 'squat' ? 'Go a little lower' : 'Chest closer to the floor', now);
        if (c) return { ...c, reps, phase, angle };
      }
    } else {
      minAngleThisRep = Math.min(minAngleThisRep, angle);
      if (angle > t.up) {
        phase = 'up';
        minAngleThisRep = 180;
        if (now - lastRepAt >= MIN_REP_MS && now - downAt >= MIN_REP_MS / 3) {
          reps += 1;
          lastRepAt = now;
          return { type: 'rep', reps, phase, angle };
        }
      }
    }
    return { type: 'none', reps, phase, angle };
  }

  function update(landmarks, now) {
    const side = pickSide(landmarks, exercise);
    if (!side) {
      const c = cue('Turn sideways so your whole body is in view', now);
      return { ...(c || { type: 'lost' }), reps, phase, side: null };
    }
    const [a, b, c] = EXERCISE_JOINTS[exercise][side].map((i) => landmarks[i]);
    return { ...updateAngle(jointAngle(a, b, c), now), side };
  }

  return {
    update,
    updateAngle,
    get reps() {
      return reps;
    },
    get phase() {
      return phase;
    },
    reset() {
      ema.reset();
      phase = 'up';
      reps = 0;
      minAngleThisRep = 180;
      lastRepAt = -Infinity;
    },
  };
}
