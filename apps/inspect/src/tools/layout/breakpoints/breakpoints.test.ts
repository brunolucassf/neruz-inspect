import { describe, expect, it } from 'vitest';
import {
  findViewportRange,
  mergeBreakpoints,
  parseMediaWidths,
  rulerPercent,
  rulerScaleMax,
} from './breakpoints';

describe('parseMediaWidths', () => {
  it('reads min-width and max-width in px', () => {
    expect(parseMediaWidths('(min-width: 768px) and (max-width: 1023px)')).toEqual([
      { kind: 'min', px: 768 },
      { kind: 'max', px: 1023 },
    ]);
  });

  it('converts em and rem to px', () => {
    expect(parseMediaWidths('(min-width: 48em)')).toEqual([{ kind: 'min', px: 768 }]);
    expect(parseMediaWidths('(max-width: 47.9375rem)')).toEqual([{ kind: 'max', px: 767 }]);
  });

  it('reads range syntax', () => {
    expect(parseMediaWidths('(width >= 640px)')).toEqual([{ kind: 'min', px: 640 }]);
    expect(parseMediaWidths('(width < 40rem)')).toEqual([{ kind: 'max', px: 640 }]);
  });

  it('reads chained ranges', () => {
    const conditions = parseMediaWidths('(400px <= width <= 800px)');
    expect(conditions).toContainEqual({ kind: 'min', px: 400 });
    expect(conditions).toContainEqual({ kind: 'max', px: 800 });
  });

  it('ignores heights, device widths and unrelated queries', () => {
    expect(parseMediaWidths('(min-height: 500px)')).toEqual([]);
    expect(parseMediaWidths('(min-device-width: 500px)')).toEqual([]);
    expect(parseMediaWidths('print')).toEqual([]);
    expect(parseMediaWidths('(prefers-reduced-motion: reduce)')).toEqual([]);
  });

  it('is case insensitive', () => {
    expect(parseMediaWidths('(MIN-WIDTH: 600PX)')).toEqual([{ kind: 'min', px: 600 }]);
  });
});

describe('mergeBreakpoints', () => {
  it('merges unique widths, counts by kind and sorts ascending', () => {
    const points = mergeBreakpoints([
      { kind: 'min', px: 1024 },
      { kind: 'min', px: 768 },
      { kind: 'max', px: 768 },
      { kind: 'min', px: 768 },
    ]);
    expect(points).toEqual([
      { px: 768, min: 2, max: 1 },
      { px: 1024, min: 1, max: 0 },
    ]);
  });
});

describe('findViewportRange', () => {
  const points = mergeBreakpoints([
    { kind: 'min', px: 640 },
    { kind: 'min', px: 1024 },
  ]);

  it('finds the surrounding breakpoints', () => {
    const range = findViewportRange(points, 800);
    expect(range.lower?.px).toBe(640);
    expect(range.upper?.px).toBe(1024);
  });

  it('has no lower bound below the first breakpoint', () => {
    expect(findViewportRange(points, 360).lower).toBeNull();
  });

  it('has no upper bound above the last breakpoint', () => {
    expect(findViewportRange(points, 1920).upper).toBeNull();
  });

  it('counts an exact match as the lower bound', () => {
    expect(findViewportRange(points, 1024).lower?.px).toBe(1024);
  });
});

describe('ruler scale', () => {
  it('covers the largest value with headroom', () => {
    const points = mergeBreakpoints([{ kind: 'min', px: 1280 }]);
    expect(rulerScaleMax(points, 800)).toBe(1400);
  });

  it('clamps percentages', () => {
    expect(rulerPercent(500, 1000)).toBe(50);
    expect(rulerPercent(2000, 1000)).toBe(100);
  });
});
