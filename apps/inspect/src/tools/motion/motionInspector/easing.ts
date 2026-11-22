export type StepPosition = 'start' | 'end' | 'jump-both' | 'jump-none';

export type EasingSpec =
  | { kind: 'bezier'; x1: number; y1: number; x2: number; y2: number }
  | { kind: 'steps'; count: number; position: StepPosition }
  | { kind: 'linear' };

const KEYWORDS: Readonly<Record<string, EasingSpec>> = {
  linear: { kind: 'linear' },
  ease: { kind: 'bezier', x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 },
  'ease-in': { kind: 'bezier', x1: 0.42, y1: 0, x2: 1, y2: 1 },
  'ease-out': { kind: 'bezier', x1: 0, y1: 0, x2: 0.58, y2: 1 },
  'ease-in-out': { kind: 'bezier', x1: 0.42, y1: 0, x2: 0.58, y2: 1 },
  'step-start': { kind: 'steps', count: 1, position: 'start' },
  'step-end': { kind: 'steps', count: 1, position: 'end' },
};

const STEP_POSITIONS: ReadonlySet<string> = new Set([
  'start',
  'end',
  'jump-start',
  'jump-end',
  'jump-both',
  'jump-none',
]);

const normalizePosition = (value: string): StepPosition => {
  if (value === 'start' || value === 'jump-start') return 'start';
  if (value === 'jump-both') return 'jump-both';
  if (value === 'jump-none') return 'jump-none';
  return 'end';
};

export const parseEasing = (input: string): EasingSpec => {
  const value = input.trim().toLowerCase();
  const keyword = KEYWORDS[value];
  if (keyword) return keyword;

  const bezier = /^cubic-bezier\(\s*([^)]*)\)$/.exec(value);
  if (bezier?.[1] !== undefined) {
    const numbers = bezier[1].split(',').map((part) => Number(part.trim()));
    const [x1, y1, x2, y2] = numbers;
    if (
      numbers.length === 4 &&
      numbers.every(Number.isFinite) &&
      x1 !== undefined &&
      y1 !== undefined &&
      x2 !== undefined &&
      y2 !== undefined &&
      x1 >= 0 &&
      x1 <= 1 &&
      x2 >= 0 &&
      x2 <= 1
    ) {
      return { kind: 'bezier', x1, y1, x2, y2 };
    }
    return { kind: 'linear' };
  }

  const steps = /^steps\(\s*(\d+)\s*(?:,\s*([a-z-]+)\s*)?\)$/.exec(value);
  if (steps?.[1] !== undefined) {
    const count = Number.parseInt(steps[1], 10);
    const rawPosition = steps[2] ?? 'end';
    if (count >= 1 && STEP_POSITIONS.has(rawPosition)) {
      return { kind: 'steps', count, position: normalizePosition(rawPosition) };
    }
  }
  return { kind: 'linear' };
};

const cubic = (a: number, b: number, t: number): number => {
  const inverse = 1 - t;
  return 3 * inverse * inverse * t * a + 3 * inverse * t * t * b + t * t * t;
};

const solveBezierY = (spec: Extract<EasingSpec, { kind: 'bezier' }>, x: number): number => {
  let low = 0;
  let high = 1;
  let t = x;
  for (let iteration = 0; iteration < 24; iteration += 1) {
    const current = cubic(spec.x1, spec.x2, t);
    if (Math.abs(current - x) < 1e-5) break;
    if (current < x) low = t;
    else high = t;
    t = (low + high) / 2;
  }
  return cubic(spec.y1, spec.y2, t);
};

const stepValue = (count: number, position: StepPosition, x: number): number => {
  if (position === 'start') return Math.ceil(x * count) / count;
  if (position === 'jump-both') return Math.min(1, (Math.floor(x * count) + 1) / (count + 1));
  if (position === 'jump-none')
    return count < 2 ? x : Math.min(1, Math.floor(x * count) / (count - 1));
  return Math.floor(x * count) / count;
};

export const easingValueAt = (spec: EasingSpec, progress: number): number => {
  const x = Math.min(1, Math.max(0, progress));
  if (spec.kind === 'linear') return x;
  if (spec.kind === 'bezier') return solveBezierY(spec, x);
  return stepValue(spec.count, spec.position, x);
};

export type CurvePoint = { x: number; y: number };

export const sampleEasing = (spec: EasingSpec, samples = 48): CurvePoint[] => {
  const points: CurvePoint[] = [];
  for (let index = 0; index <= samples; index += 1) {
    const x = index / samples;
    points.push({ x, y: easingValueAt(spec, x) });
  }
  return points;
};

export type CurveGeometry = {
  path: string;
  endpoints: { start: CurvePoint; end: CurvePoint };
  handles: { first: CurvePoint; second: CurvePoint } | null;
};

const round = (value: number): number => Math.round(value * 100) / 100;

export const buildCurveGeometry = (
  spec: EasingSpec,
  width: number,
  height: number,
  padding: number,
): CurveGeometry => {
  const points = sampleEasing(spec);
  const ys = points.map((point) => point.y);
  const minY = Math.min(0, ...ys);
  const maxY = Math.max(1, ...ys);
  const range = maxY - minY || 1;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const toX = (x: number): number => round(padding + x * innerWidth);
  const toY = (y: number): number => round(padding + (1 - (y - minY) / range) * innerHeight);
  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${toX(point.x)} ${toY(point.y)}`)
    .join(' ');
  const handles =
    spec.kind === 'bezier'
      ? {
          first: { x: toX(spec.x1), y: toY(spec.y1) },
          second: { x: toX(spec.x2), y: toY(spec.y2) },
        }
      : null;
  return {
    path,
    endpoints: {
      start: { x: toX(0), y: toY(0) },
      end: { x: toX(1), y: toY(1) },
    },
    handles,
  };
};

export const formatDuration = (milliseconds: number): string => {
  if (!Number.isFinite(milliseconds)) return '∞';
  if (milliseconds < 1000) return `${Math.round(milliseconds)} ms`;
  return `${Math.round(milliseconds) / 1000} s`;
};
