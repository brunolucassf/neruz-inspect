export type WidthCondition = { kind: 'min' | 'max'; px: number };

export type BreakpointPoint = { px: number; min: number; max: number };

const EM_BASE_PX = 16;

const toPx = (amount: string, unit: string): number => {
  const value = Number.parseFloat(amount);
  return unit === 'px' ? value : value * EM_BASE_PX;
};

const round = (value: number): number => Math.round(value * 100) / 100;

export const parseMediaWidths = (mediaText: string): WidthCondition[] => {
  const conditions: WidthCondition[] = [];
  const text = mediaText.toLowerCase();

  for (const match of text.matchAll(/(?<![\w-])(min|max)-width\s*:\s*(-?[\d.]+)(px|em|rem)/g)) {
    const [, kind, amount, unit] = match;
    if (!kind || !amount || !unit) continue;
    conditions.push({ kind: kind as 'min' | 'max', px: round(toPx(amount, unit)) });
  }

  for (const match of text.matchAll(/(?<![\w-])width\s*(>=|<=|>|<)\s*(-?[\d.]+)(px|em|rem)/g)) {
    const [, operator, amount, unit] = match;
    if (!operator || !amount || !unit) continue;
    conditions.push({
      kind: operator.startsWith('>') ? 'min' : 'max',
      px: round(toPx(amount, unit)),
    });
  }

  for (const match of text.matchAll(/(-?[\d.]+)(px|em|rem)\s*(>=|<=|>|<)\s*width(?![\w-])/g)) {
    const [, amount, unit, operator] = match;
    if (!operator || !amount || !unit) continue;
    conditions.push({
      kind: operator.startsWith('<') ? 'min' : 'max',
      px: round(toPx(amount, unit)),
    });
  }

  return conditions.filter((condition) => Number.isFinite(condition.px) && condition.px > 0);
};

export const mergeBreakpoints = (conditions: readonly WidthCondition[]): BreakpointPoint[] => {
  const points = new Map<number, BreakpointPoint>();
  for (const condition of conditions) {
    const point = points.get(condition.px) ?? { px: condition.px, min: 0, max: 0 };
    point[condition.kind] += 1;
    points.set(condition.px, point);
  }
  return Array.from(points.values()).sort((a, b) => a.px - b.px);
};

export type ViewportRange = { lower: BreakpointPoint | null; upper: BreakpointPoint | null };

export const findViewportRange = (
  points: readonly BreakpointPoint[],
  viewportWidth: number,
): ViewportRange => {
  let lower: BreakpointPoint | null = null;
  let upper: BreakpointPoint | null = null;
  for (const point of points) {
    if (point.px <= viewportWidth) lower = point;
    else if (!upper) upper = point;
  }
  return { lower, upper };
};

export const rulerScaleMax = (
  points: readonly BreakpointPoint[],
  viewportWidth: number,
): number => {
  const largest = points.reduce((max, point) => Math.max(max, point.px), viewportWidth);
  return Math.ceil((largest * 1.08) / 100) * 100;
};

export const rulerPercent = (px: number, scaleMax: number): number =>
  Math.min(100, Math.max(0, (px / scaleMax) * 100));
