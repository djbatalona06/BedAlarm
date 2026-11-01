import { describe, it, expect } from 'vitest';
import { jointAngle, minVisibility } from '../src/vision/angles.js';

describe('jointAngle', () => {
  it('is 180 for a straight line', () => {
    expect(jointAngle({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 })).toBeCloseTo(180);
  });
  it('is 90 for a right angle', () => {
    expect(jointAngle({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 })).toBeCloseTo(90);
  });
  it('returns NaN when points overlap', () => {
    expect(jointAngle({ x: 1, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 2 })).toBeNaN();
  });
});

describe('minVisibility', () => {
  it('treats missing points as invisible', () => {
    expect(minVisibility({ visibility: 0.9 }, undefined)).toBe(0);
    expect(minVisibility({ visibility: 0.9 }, { visibility: 0.6 })).toBe(0.6);
  });
});
