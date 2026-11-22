import type { HighlightItem, ViewportRect } from '../../../lib/highlight';

export type Point = { x: number; y: number };

export type MeasureSide = 'left' | 'right' | 'top' | 'bottom';

export type Measure = {
  side: MeasureSide;
  axis: 'x' | 'y';
  from: Point;
  to: Point;
  length: number;
};

const MIN_LENGTH = 0.5;

const overlapOf = (aStart: number, aEnd: number, bStart: number, bEnd: number): number =>
  Math.min(aEnd, bEnd) - Math.max(aStart, bStart);

const middle = (start: number, end: number): number => (start + end) / 2;

export const measureBetween = (a: ViewportRect, b: ViewportRect): Measure[] => {
  const aRight = a.x + a.width;
  const aBottom = a.y + a.height;
  const bRight = b.x + b.width;
  const bBottom = b.y + b.height;
  const overlapX = overlapOf(a.x, aRight, b.x, bRight);
  const overlapY = overlapOf(a.y, aBottom, b.y, bBottom);
  const measures: Measure[] = [];

  const pushX = (side: MeasureSide, x1: number, x2: number, y: number): void => {
    const length = Math.abs(x2 - x1);
    if (length < MIN_LENGTH) return;
    measures.push({
      side,
      axis: 'x',
      from: { x: Math.min(x1, x2), y },
      to: { x: Math.max(x1, x2), y },
      length,
    });
  };

  const pushY = (side: MeasureSide, y1: number, y2: number, x: number): void => {
    const length = Math.abs(y2 - y1);
    if (length < MIN_LENGTH) return;
    measures.push({
      side,
      axis: 'y',
      from: { x, y: Math.min(y1, y2) },
      to: { x, y: Math.max(y1, y2) },
      length,
    });
  };

  if (overlapX > 0 && overlapY > 0) {
    const centerY = middle(a.y, aBottom);
    const centerX = middle(a.x, aRight);
    pushX('left', a.x, b.x, centerY);
    pushX('right', aRight, bRight, centerY);
    pushY('top', a.y, b.y, centerX);
    pushY('bottom', aBottom, bBottom, centerX);
    return measures;
  }

  if (overlapX <= 0) {
    const crossY =
      overlapY > 0 ? middle(Math.max(a.y, b.y), Math.min(aBottom, bBottom)) : middle(a.y, aBottom);
    if (a.x < b.x) pushX('right', aRight, b.x, crossY);
    else pushX('left', bRight, a.x, crossY);
  }

  if (overlapY <= 0) {
    const crossX =
      overlapX > 0 ? middle(Math.max(a.x, b.x), Math.min(aRight, bRight)) : middle(a.x, aRight);
    if (a.y < b.y) pushY('bottom', aBottom, b.y, crossX);
    else pushY('top', bBottom, a.y, crossX);
  }

  return measures;
};

export type FreeMeasure = { measures: Measure[]; distance: number };

export const measureFree = (from: Point, to: Point): FreeMeasure => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const measures: Measure[] = [];
  if (Math.abs(dx) >= MIN_LENGTH) {
    measures.push({
      side: dx > 0 ? 'right' : 'left',
      axis: 'x',
      from: { x: Math.min(from.x, to.x), y: from.y },
      to: { x: Math.max(from.x, to.x), y: from.y },
      length: Math.abs(dx),
    });
  }
  if (Math.abs(dy) >= MIN_LENGTH) {
    measures.push({
      side: dy > 0 ? 'bottom' : 'top',
      axis: 'y',
      from: { x: to.x, y: Math.min(from.y, to.y) },
      to: { x: to.x, y: Math.max(from.y, to.y) },
      length: Math.abs(dy),
    });
  }
  return { measures, distance: Math.hypot(dx, dy) };
};

export const measuresToHighlights = (
  measures: readonly Measure[],
  format: (px: number) => string,
): HighlightItem[] =>
  measures.map((measure) => ({
    kind: 'line',
    rect:
      measure.axis === 'x'
        ? { x: measure.from.x, y: measure.from.y, width: measure.length, height: 1 }
        : { x: measure.from.x, y: measure.from.y, width: 1, height: measure.length },
    text: format(measure.length),
  }));
