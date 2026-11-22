import { type Color, parseCssColor, toHex, toOklchValues } from '../../../lib/color';

const BLACK: Color = { r: 0, g: 0, b: 0, a: 1 };

export const colorFromOklch = (lightness: number, chroma: number, hue: number): Color =>
  parseCssColor(`oklch(${lightness * 100}% ${chroma} ${hue})`) ?? BLACK;

const toOklabPoint = (color: Color): { l: number; a: number; b: number } => {
  const { l, c, h } = toOklchValues(color);
  const radians = (h * Math.PI) / 180;
  return { l, a: c * Math.cos(radians), b: c * Math.sin(radians) };
};

export const colorDistance = (first: Color, second: Color): number => {
  const a = toOklabPoint(first);
  const b = toOklabPoint(second);
  return Math.hypot(a.l - b.l, a.a - b.a, a.b - b.b) + Math.abs(first.a - second.a) * 0.5;
};

export type ColorUse = { color: Color; count: number };

export type ColorCluster = { color: Color; hex: string; count: number; hexes: string[] };

export const SIMILAR_COLOR_DISTANCE = 0.025;

export const groupSimilarColors = (
  uses: readonly ColorUse[],
  threshold: number = SIMILAR_COLOR_DISTANCE,
): ColorCluster[] => {
  const byHex = new Map<string, ColorUse>();
  for (const use of uses) {
    const hex = toHex(use.color);
    const existing = byHex.get(hex);
    byHex.set(hex, { color: use.color, count: (existing?.count ?? 0) + use.count });
  }
  const sorted = [...byHex.entries()].sort((a, b) => b[1].count - a[1].count);
  const clusters: ColorCluster[] = [];
  for (const [hex, use] of sorted) {
    const home = clusters.find((cluster) => colorDistance(cluster.color, use.color) <= threshold);
    if (home) {
      home.count += use.count;
      home.hexes.push(hex);
    } else {
      clusters.push({ color: use.color, hex, count: use.count, hexes: [hex] });
    }
  }
  return clusters.sort((a, b) => b.count - a.count);
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const rotateHue = (color: Color, degrees: number): Color => {
  const { l, c, h } = toOklchValues(color);
  return { ...colorFromOklch(l, c, (h + degrees + 360) % 360), a: color.a };
};

export type Harmony = { id: 'complementary' | 'analogous' | 'triadic'; colors: Color[] };

export const buildHarmonies = (base: Color): Harmony[] => [
  { id: 'complementary', colors: [base, rotateHue(base, 180)] },
  { id: 'analogous', colors: [rotateHue(base, -30), base, rotateHue(base, 30)] },
  { id: 'triadic', colors: [base, rotateHue(base, 120), rotateHue(base, 240)] },
];

export const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

const SCALE_LIGHTNESS: Readonly<Record<number, number>> = {
  50: 0.98,
  100: 0.955,
  200: 0.91,
  300: 0.845,
  400: 0.76,
  500: 0.67,
  600: 0.58,
  700: 0.49,
  800: 0.41,
  900: 0.34,
  950: 0.26,
};

const SCALE_CHROMA_FACTOR: Readonly<Record<number, number>> = {
  50: 0.12,
  100: 0.25,
  200: 0.45,
  300: 0.7,
  400: 0.9,
  500: 1,
  600: 1,
  700: 0.92,
  800: 0.78,
  900: 0.62,
  950: 0.45,
};

export type ScaleStep = { step: number; color: Color };

export const buildColorScale = (base: Color): ScaleStep[] => {
  const { c, h } = toOklchValues(base);
  const peakChroma = Math.min(c, 0.3);
  return SCALE_STEPS.map((step) => ({
    step,
    color: colorFromOklch(
      SCALE_LIGHTNESS[step] ?? 0.5,
      clamp01(peakChroma * (SCALE_CHROMA_FACTOR[step] ?? 1)),
      h,
    ),
  }));
};

export const buildScaleCssVariables = (name: string, scale: readonly ScaleStep[]): string =>
  `:root {\n${scale.map(({ step, color }) => `  --color-${name}-${step}: ${toHex(color)};`).join('\n')}\n}`;

export const buildScaleTailwind = (name: string, scale: readonly ScaleStep[]): string =>
  `colors: {\n  ${name}: {\n${scale.map(({ step, color }) => `    ${step}: '${toHex(color)}',`).join('\n')}\n  },\n},`;

export const buildScaleJson = (name: string, scale: readonly ScaleStep[]): string =>
  JSON.stringify(
    { [name]: Object.fromEntries(scale.map(({ step, color }) => [step, toHex(color)])) },
    null,
    2,
  );
