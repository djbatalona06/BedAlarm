// Geometry helpers for pose landmarks. Landmarks are {x, y, z?, visibility?}
// in normalised image coordinates (0..1).

/** Angle at point b (in degrees, 0..180) formed by segments b->a and b->c. */
export function jointAngle(a, b, c) {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const mag = Math.hypot(abx, aby) * Math.hypot(cbx, cby);
  if (mag === 0) return NaN;
  const cos = Math.min(1, Math.max(-1, dot / mag));
  return (Math.acos(cos) * 180) / Math.PI;
}

/** Lowest visibility among the given landmarks (missing counts as 0). */
export function minVisibility(...points) {
  return Math.min(...points.map((p) => (p && p.visibility != null ? p.visibility : p ? 1 : 0)));
}
