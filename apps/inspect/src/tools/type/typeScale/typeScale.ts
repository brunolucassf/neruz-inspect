import { formatLength, type LengthUnit } from '../../../lib/css';

export type SizeUse = { size: number; count: number };

export type NamedRatio = { ratio: number; id: string };

export const NAMED_RATIOS: readonly NamedRatio[] = [
  { ratio: 1.067, id: 'minorSecond' },
  { ratio: 1.125, id: 'majorSecond' },
  { ratio: 1.2, id: 'minorThird' },
  { ratio: 1.25, id: 'majorThird' },
  { ratio: 1.333, id: 'perfectFourth' },
  // biome-ignore lint/suspicious/noApproximativeNumericConstant: augmented fourth is a named ratio, not the square root of two
  { ratio: 1.414, id: 'augmentedFourth' },
  { ratio: 1.5, id: 'perfectFifth' },
  { ratio: 1.618, id: 'goldenRatio' },
];

export type ScaleDetection = {
  ratio: number;
  id: string;
  base: number;
  fit: number;
  measured: number;
};

const MIN_DISTINCT_SIZES = 3;
const RANDOM_MEAN_ERROR = 0.25;
const TIE_MARGIN = 0.005;

const roundTo = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const pickBase = (uses: readonly SizeUse[]): number => {
  const inBodyRange = uses.filter(({ size }) => size >= 12 && size <= 20);
  const pool = inBodyRange.length > 0 ? inBodyRange : uses;
  return pool.reduce((best, use) => (use.count > best.count ? use : best)).size;
};

const median = (values: readonly number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length === 0) return 0;
  return sorted.length % 2 === 0
    ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
    : (sorted[middle] ?? 0);
};

const stepError = (sizes: readonly number[], base: number, ratio: number): number => {
  const logRatio = Math.log(ratio);
  const total = sizes.reduce((sum, size) => {
    const steps = Math.log(size / base) / logRatio;
    return sum + Math.abs(steps - Math.round(steps));
  }, 0);
  return total / sizes.length;
};

export const detectScale = (uses: readonly SizeUse[]): ScaleDetection | null => {
  const valid = uses.filter(({ size }) => size > 0);
  const sizes = [...new Set(valid.map(({ size }) => size))].sort((a, b) => a - b);
  if (sizes.length < MIN_DISTINCT_SIZES) return null;
  const base = pickBase(valid);
  const candidates = NAMED_RATIOS.map((named) => ({
    named,
    error: stepError(sizes, base, named.ratio),
  }));
  const lowestError = Math.min(...candidates.map(({ error }) => error));
  const best = candidates.findLast(({ error }) => error <= lowestError + TIE_MARGIN);
  if (!best) return null;
  const consecutive: number[] = [];
  for (let index = 1; index < sizes.length; index += 1) {
    const previous = sizes[index - 1] ?? 1;
    const ratio = (sizes[index] ?? 1) / previous;
    if (ratio >= 1.04) consecutive.push(ratio);
  }
  return {
    ratio: best.named.ratio,
    id: best.named.id,
    base,
    fit: Math.min(1, Math.max(0, 1 - best.error / RANDOM_MEAN_ERROR)),
    measured: roundTo(median(consecutive), 3),
  };
};

const UP_NAMES = ['base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'];
const DOWN_NAMES = ['sm', 'xs', '2xs', '3xs'];

export const nameSizes = (sizes: readonly number[], reference = 16): string[] => {
  const ascending = [...sizes].sort((a, b) => a - b);
  let baseIndex = 0;
  ascending.forEach((size, index) => {
    if (Math.abs(size - reference) < Math.abs((ascending[baseIndex] ?? 0) - reference)) {
      baseIndex = index;
    }
  });
  return ascending.map((_, index) => {
    const offset = index - baseIndex;
    if (offset >= 0) return UP_NAMES[offset] ?? `step-${offset}`;
    return DOWN_NAMES[-offset - 1] ?? `minus-${-offset}`;
  });
};

export type TokenFormat = 'css' | 'tailwind';

export const buildSizeTokens = (
  sizes: readonly number[],
  format: TokenFormat,
  unit: LengthUnit,
): string => {
  const ascending = [...sizes].sort((a, b) => a - b);
  const names = nameSizes(ascending);
  const pairs = ascending.map((size, index) => [names[index] ?? `step-${index}`, size] as const);
  if (format === 'css') {
    return `:root {\n${pairs
      .map(([name, size]) => `  --font-size-${name}: ${formatLength(size, unit)};`)
      .join('\n')}\n}`;
  }
  return `fontSize: {\n${pairs
    .map(([name, size]) => `  '${name}': '${formatLength(size, unit)}',`)
    .join('\n')}\n},`;
};
