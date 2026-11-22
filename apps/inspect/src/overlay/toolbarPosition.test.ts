import { describe, expect, it } from 'vitest';
import { clampPosition, getMenuPlacement } from './toolbarPosition';

const viewport = { width: 1000, height: 600 };
const bar = { width: 500, height: 44 };

describe('clampPosition', () => {
  it('keeps the bar inside the viewport with a margin', () => {
    expect(clampPosition({ x: -50, y: -10 }, bar, viewport)).toEqual({ x: 8, y: 8 });
    expect(clampPosition({ x: 900, y: 900 }, bar, viewport)).toEqual({ x: 492, y: 548 });
    expect(clampPosition({ x: 100, y: 100 }, bar, viewport)).toEqual({ x: 100, y: 100 });
  });

  it('survives a bar wider than the viewport', () => {
    expect(clampPosition({ x: 300, y: 0 }, { width: 2000, height: 44 }, viewport).x).toBe(8);
  });
});

describe('getMenuPlacement', () => {
  it('opens upward in the lower half and aligns to the end near the right edge', () => {
    expect(getMenuPlacement({ x: 100, y: 20, ...bar }, viewport)).toEqual({
      vertical: 'below',
      align: 'start',
    });
    expect(getMenuPlacement({ x: 700, y: 540, ...bar }, viewport)).toEqual({
      vertical: 'above',
      align: 'end',
    });
  });
});
