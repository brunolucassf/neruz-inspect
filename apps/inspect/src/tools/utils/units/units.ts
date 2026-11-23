export const UNITS = ['px', 'rem', 'em', 'pt', 'vw', 'vh', '%'] as const;

export type Unit = (typeof UNITS)[number];

export type UnitContext = {
  rootPx: number;
  emPx: number;
  viewportWidth: number;
  viewportHeight: number;
};

export const DEFAULT_ROOT_PX = 16;

const POINTS_PER_PIXEL = 0.75;

export const toPx = (value: number, unit: Unit, context: UnitContext): number => {
  switch (unit) {
    case 'px':
      return value;
    case 'rem':
      return value * context.rootPx;
    case 'em':
      return value * context.emPx;
    case 'pt':
      return value / POINTS_PER_PIXEL;
    case 'vw':
      return (value / 100) * context.viewportWidth;
    case 'vh':
      return (value / 100) * context.viewportHeight;
    case '%':
      return (value / 100) * context.emPx;
  }
};

const divide = (px: number, base: number): number => (base > 0 ? px / base : Number.NaN);

export const fromPx = (px: number, unit: Unit, context: UnitContext): number => {
  switch (unit) {
    case 'px':
      return px;
    case 'rem':
      return divide(px, context.rootPx);
    case 'em':
      return divide(px, context.emPx);
    case 'pt':
      return px * POINTS_PER_PIXEL;
    case 'vw':
      return divide(px * 100, context.viewportWidth);
    case 'vh':
      return divide(px * 100, context.viewportHeight);
    case '%':
      return divide(px * 100, context.emPx);
  }
};

export const convertAll = (
  value: number,
  from: Unit,
  context: UnitContext,
): Record<Unit, number> => {
  const px = toPx(value, from, context);
  return Object.fromEntries(UNITS.map((unit) => [unit, fromPx(px, unit, context)])) as Record<
    Unit,
    number
  >;
};

export const formatNumber = (value: number, decimals = 4): string => {
  if (!Number.isFinite(value)) return '—';
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  return String(Object.is(rounded, -0) ? 0 : rounded);
};

export const formatWithUnit = (value: number, unit: Unit, decimals = 4): string =>
  `${formatNumber(value, decimals)}${unit}`;

export const parseInputNumber = (raw: string): number | null => {
  const normalized = raw.trim().replace(',', '.');
  if (normalized === '') return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const QUICK_PX_VALUES = [
  4, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96, 128,
] as const;

export const QUICK_TABLE_UNITS = ['rem', 'em', 'pt', 'vw'] as const;

export type QuickRow = { px: number; values: Record<(typeof QUICK_TABLE_UNITS)[number], number> };

export const buildQuickTable = (context: UnitContext): QuickRow[] =>
  QUICK_PX_VALUES.map((px) => ({
    px,
    values: {
      rem: fromPx(px, 'rem', context),
      em: fromPx(px, 'em', context),
      pt: fromPx(px, 'pt', context),
      vw: fromPx(px, 'vw', context),
    },
  }));
