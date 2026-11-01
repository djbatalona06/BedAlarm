// Object "pairing" and matching for the scan-to-start ritual.
// Classifier output: [{ label, score }] sorted by score (desc).

export const MATCH_SCORE = 0.3;
export const MATCH_HOLD_MS = 1000;

/** Labels to remember for an object, taken from a pairing scan. */
export function labelsForPairing(categories, count = 3, minScore = 0.05) {
  return categories
    .filter((c) => c.score >= minScore)
    .slice(0, count)
    .map((c) => c.label.toLowerCase());
}

/** Does this frame's top-5 contain one of the paired labels? */
export function frameMatches(categories, pairedLabels, minScore = MATCH_SCORE) {
  const wanted = new Set(pairedLabels.map((l) => l.toLowerCase()));
  return categories.slice(0, 5).some((c) => c.score >= minScore && wanted.has(c.label.toLowerCase()));
}

/**
 * Requires a match to be held steadily (~1s) so a passing glimpse
 * doesn't count. Returns a function: (matchedThisFrame, now) => progress 0..1.
 */
export function createMatchHold(holdMs = MATCH_HOLD_MS) {
  let since = null;
  return (matched, now) => {
    if (!matched) {
      since = null;
      return 0;
    }
    if (since == null) since = now;
    return Math.min(1, (now - since) / holdMs);
  };
}
