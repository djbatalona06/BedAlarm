import { describe, it, expect } from 'vitest';
import { labelsForPairing, frameMatches, createMatchHold } from '../src/vision/objectMatch.js';

const cats = [
  { label: 'Coffee mug', score: 0.62 },
  { label: 'cup', score: 0.2 },
  { label: 'teapot', score: 0.04 },
];

describe('object matching', () => {
  it('remembers the top labels, lower-cased, skipping tiny scores', () => {
    expect(labelsForPairing(cats)).toEqual(['coffee mug', 'cup']);
  });
  it('matches when a paired label is confidently in view', () => {
    expect(frameMatches(cats, ['coffee mug'])).toBe(true);
    expect(frameMatches(cats, ['cup'])).toBe(false); // 0.2 < 0.3
    expect(frameMatches(cats, ['running shoe'])).toBe(false);
  });
  it('needs the match held for about a second', () => {
    const hold = createMatchHold(1000);
    expect(hold(true, 0)).toBe(0);
    expect(hold(true, 500)).toBe(0.5);
    expect(hold(false, 600)).toBe(0);
    expect(hold(true, 700)).toBe(0);
    expect(hold(true, 1700)).toBe(1);
  });
});
