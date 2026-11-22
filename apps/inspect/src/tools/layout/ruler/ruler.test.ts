import { describe, expect, it } from 'vitest';
import { measureBetween, measureFree, measuresToHighlights } from './ruler';

const bySide = (measures: ReturnType<typeof measureBetween>) =>
  Object.fromEntries(measures.map((measure) => [measure.side, measure.length]));

describe('measureBetween', () => {
  it('measures the four distances of a contained element', () => {
    const inner = { x: 100, y: 100, width: 50, height: 50 };
    const outer = { x: 0, y: 0, width: 300, height: 400 };
    expect(bySide(measureBetween(inner, outer))).toEqual({
      left: 100,
      right: 150,
      top: 100,
      bottom: 250,
    });
  });

  it('skips sides with zero distance', () => {
    const inner = { x: 0, y: 10, width: 100, height: 20 };
    const outer = { x: 0, y: 0, width: 100, height: 100 };
    const sides = bySide(measureBetween(inner, outer));
    expect(sides.left).toBeUndefined();
    expect(sides.right).toBeUndefined();
    expect(sides.top).toBe(10);
    expect(sides.bottom).toBe(70);
  });

  it('measures only the horizontal gap between side-by-side rects', () => {
    const left = { x: 0, y: 0, width: 100, height: 50 };
    const right = { x: 124, y: 10, width: 80, height: 30 };
    const measures = measureBetween(left, right);
    expect(measures).toHaveLength(1);
    expect(measures[0]).toMatchObject({ side: 'right', axis: 'x', length: 24 });
    expect(measures[0]?.from.y).toBe(25);
  });

  it('measures the vertical gap when the target is above', () => {
    const lower = { x: 0, y: 200, width: 100, height: 50 };
    const upper = { x: 10, y: 0, width: 100, height: 120 };
    const measures = measureBetween(lower, upper);
    expect(measures).toHaveLength(1);
    expect(measures[0]).toMatchObject({ side: 'top', axis: 'y', length: 80 });
  });

  it('measures both gaps for diagonal rects', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 30, y: 50, width: 10, height: 10 };
    expect(bySide(measureBetween(a, b))).toEqual({ right: 20, bottom: 40 });
  });

  it('returns nothing for identical rects', () => {
    const rect = { x: 5, y: 5, width: 20, height: 20 };
    expect(measureBetween(rect, rect)).toEqual([]);
  });
});

describe('measureFree', () => {
  it('splits a diagonal into dx, dy and straight distance', () => {
    const result = measureFree({ x: 0, y: 0 }, { x: 30, y: 40 });
    expect(result.distance).toBe(50);
    expect(result.measures.map((measure) => measure.length)).toEqual([30, 40]);
  });

  it('handles negative direction', () => {
    const result = measureFree({ x: 50, y: 50 }, { x: 20, y: 50 });
    expect(result.measures).toHaveLength(1);
    expect(result.measures[0]).toMatchObject({ side: 'left', length: 30 });
  });
});

describe('measuresToHighlights', () => {
  it('turns measures into labelled line rects', () => {
    const items = measuresToHighlights(
      measureFree({ x: 0, y: 0 }, { x: 12, y: 0 }).measures,
      (px) => `${px}px`,
    );
    expect(items).toEqual([
      { kind: 'line', rect: { x: 0, y: 0, width: 12, height: 1 }, text: '12px' },
    ]);
  });
});
