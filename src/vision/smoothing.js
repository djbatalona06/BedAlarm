// Raw landmarks jitter frame to frame. An exponential moving average (EMA)
// smooths the joint angle so tiny wobbles can't create "phantom reps".

export function createEma(alpha = 0.35) {
  let value = null;
  return {
    /** Feed a new sample; returns the smoothed value. NaN samples are ignored. */
    push(sample) {
      if (!Number.isFinite(sample)) return value;
      value = value == null ? sample : alpha * sample + (1 - alpha) * value;
      return value;
    },
    get value() {
      return value;
    },
    reset() {
      value = null;
    },
  };
}
