import { type Color, parseCssColor, toHex, toHslValues } from '../../../lib/color';

export type ColorUsage = { value: string; text: number; background: number; border: number };

export type NamedColor = { name: string; hex: string; count: number };
export type FontFamilyToken = { name: string; stack: string; count: number };
export type ScaleToken = { name: string; px: number; count: number };
export type ShadowToken = { name: string; value: string; count: number };

export type DesignTokens = {
  colors: NamedColor[];
  fontFamilies: FontFamilyToken[];
  typeScale: ScaleToken[];
  spacing: ScaleToken[];
  radii: ScaleToken[];
  shadows: ShadowToken[];
  breakpoints: ScaleToken[];
  containers: ScaleToken[];
};

export type RawScan = {
  colors: ReadonlyMap<string, ColorUsage>;
  fontFamilies: ReadonlyMap<string, number>;
  fontSizes: ReadonlyMap<number, number>;
  spacing: ReadonlyMap<number, number>;
  radii: ReadonlyMap<number, number>;
  shadows: ReadonlyMap<string, number>;
  breakpoints: ReadonlyMap<number, number>;
  containers: ReadonlyMap<number, number>;
};

const MAX_COLORS = 24;
const COLOR_MERGE_DISTANCE = 10;

const sortByCount = <T extends { count: number }>(items: T[]): T[] =>
  items.sort((a, b) => b.count - a.count);

const trimNumber = (value: number): string => String(Math.round(value * 100) / 100);

const colorDistance = (a: Color, b: Color): number => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);

type ColorCluster = {
  color: Color;
  hex: string;
  text: number;
  background: number;
  border: number;
};

const total = (cluster: ColorCluster): number => cluster.text + cluster.background + cluster.border;

export const clusterColors = (usages: Iterable<ColorUsage>): ColorCluster[] => {
  const parsed: ColorCluster[] = [];
  for (const usage of usages) {
    const color = parseCssColor(usage.value);
    if (!color || color.a === 0) continue;
    parsed.push({
      color,
      hex: toHex(color),
      text: usage.text,
      background: usage.background,
      border: usage.border,
    });
  }
  parsed.sort((a, b) => total(b) - total(a));
  const clusters: ColorCluster[] = [];
  for (const item of parsed) {
    const near = clusters.find(
      (cluster) =>
        cluster.color.a === item.color.a &&
        colorDistance(cluster.color, item.color) < COLOR_MERGE_DISTANCE,
    );
    if (near) {
      near.text += item.text;
      near.background += item.background;
      near.border += item.border;
    } else clusters.push({ ...item });
  }
  return clusters;
};

const isChromatic = (color: Color): boolean => {
  const { s, l } = toHslValues(color);
  return s > 25 && l > 12 && l < 90;
};

export const nameColors = (clusters: readonly ColorCluster[]): NamedColor[] => {
  const pool = [...clusters].sort((a, b) => total(b) - total(a)).slice(0, MAX_COLORS);
  const named = new Map<ColorCluster, string>();
  const assign = (role: string, pick: ColorCluster | undefined): void => {
    if (pick && !named.has(pick)) named.set(pick, role);
  };
  const best = (key: 'text' | 'background' | 'border', skipChromatic = false) =>
    [...pool]
      .filter(
        (item) => !named.has(item) && item[key] > 0 && !(skipChromatic && isChromatic(item.color)),
      )
      .sort((a, b) => b[key] - a[key])[0];

  assign('background', best('background'));
  assign('text', best('text', true));
  assign('border', best('border', true));
  assign('surface', best('background', true));
  assign('text-muted', best('text', true));

  const chromatic = pool.filter((item) => !named.has(item) && isChromatic(item.color));
  const chromaticRoles = ['primary', 'secondary', 'accent'];
  chromatic.forEach((item, index) => {
    named.set(item, chromaticRoles[index] ?? `accent-${index - 1}`);
  });

  let neutralIndex = 0;
  for (const item of pool) {
    if (named.has(item)) continue;
    neutralIndex += 1;
    named.set(item, `neutral-${neutralIndex}`);
  }

  return pool.map((item) => ({
    name: named.get(item) ?? 'color',
    hex: item.hex,
    count: total(item),
  }));
};

export const extractColorTokens = (usages: Iterable<ColorUsage>): NamedColor[] =>
  nameColors(clusterColors(usages));

export const splitFontStack = (stack: string): string[] => {
  const families: string[] = [];
  let current = '';
  let quote = '';
  for (const char of stack) {
    if (quote) {
      if (char === quote) quote = '';
      else current += char;
    } else if (char === '"' || char === "'") quote = char;
    else if (char === ',') {
      if (current.trim()) families.push(current.trim());
      current = '';
    } else current += char;
  }
  if (current.trim()) families.push(current.trim());
  return families;
};

const classifyFamily = (stack: string): string => {
  const lower = stack.toLowerCase();
  if (/mono|consolas|courier|menlo|code/.test(lower)) return 'mono';
  if (/serif/.test(lower) && !/sans-serif/.test(lower)) return 'serif';
  if (/georgia|times|garamond|playfair|merriweather/.test(lower) && !/sans/.test(lower)) {
    return 'serif';
  }
  return 'sans';
};

export const extractFontFamilies = (counts: ReadonlyMap<string, number>): FontFamilyToken[] => {
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const used = new Map<string, number>();
  return sorted.map(([stack, count]) => {
    const kind = classifyFamily(stack);
    const seen = (used.get(kind) ?? 0) + 1;
    used.set(kind, seen);
    return { name: seen > 1 ? `${kind}-${seen}` : kind, stack, count };
  });
};

const SIZE_NAMES = [
  '3xs',
  '2xs',
  'xs',
  'sm',
  'base',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl',
  '7xl',
  '8xl',
  '9xl',
] as const;

const BASE_SIZE_INDEX = 4;
const MAX_TYPE_STEPS = 10;

export const buildTypeScale = (counts: ReadonlyMap<number, number>): ScaleToken[] => {
  const merged = new Map<number, number>();
  for (const [size, count] of counts) {
    if (size < 8 || size > 200) continue;
    const rounded = Math.round(size * 2) / 2;
    merged.set(rounded, (merged.get(rounded) ?? 0) + count);
  }
  const top = sortByCount([...merged.entries()].map(([px, count]) => ({ name: '', px, count })))
    .slice(0, MAX_TYPE_STEPS)
    .sort((a, b) => a.px - b.px);
  if (top.length === 0) return [];
  const baseCandidates = top.filter((step) => step.px >= 14 && step.px <= 18);
  const base = sortByCount([...(baseCandidates.length ? baseCandidates : top)])[0];
  const baseIndex = base ? top.indexOf(base) : 0;
  return top.map((step, index) => {
    const nameIndex = Math.min(
      SIZE_NAMES.length - 1,
      Math.max(0, BASE_SIZE_INDEX + index - baseIndex),
    );
    return { ...step, name: SIZE_NAMES[nameIndex] ?? 'base' };
  });
};

export const normalizeSpacingScale = (
  counts: ReadonlyMap<number, number>,
  base = 4,
  maxSteps = 12,
): ScaleToken[] => {
  const merged = new Map<number, number>();
  for (const [px, count] of counts) {
    if (!Number.isFinite(px) || px < 1) continue;
    if (px < base * 0.75 && px < 1.5) continue;
    const snapped = px < base * 0.75 ? 2 : Math.round(px / base) * base;
    merged.set(snapped, (merged.get(snapped) ?? 0) + count);
  }
  return sortByCount([...merged.entries()].map(([px, count]) => ({ name: '', px, count })))
    .slice(0, maxSteps)
    .sort((a, b) => a.px - b.px)
    .map((step) => ({ ...step, name: trimNumber(step.px / base).replace('.', '_') }));
};

const RADIUS_NAMES = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const;
const FULL_RADIUS_PX = 9999;

export const buildRadii = (counts: ReadonlyMap<number, number>): ScaleToken[] => {
  const merged = new Map<number, number>();
  for (const [px, count] of counts) {
    if (px <= 0) continue;
    const key = px >= 999 ? FULL_RADIUS_PX : Math.round(px);
    merged.set(key, (merged.get(key) ?? 0) + count);
  }
  const top = sortByCount([...merged.entries()].map(([px, count]) => ({ name: '', px, count })))
    .slice(0, RADIUS_NAMES.length + 1)
    .sort((a, b) => a.px - b.px);
  let index = 0;
  return top.map((step) => {
    if (step.px === FULL_RADIUS_PX) return { ...step, name: 'full' };
    const name = RADIUS_NAMES[Math.min(index, RADIUS_NAMES.length - 1)] ?? 'md';
    index += 1;
    return { ...step, name };
  });
};

const SHADOW_NAMES = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;

const shadowSize = (value: string): number => {
  const numbers = [...value.replace(/rgba?\([^)]*\)/g, '').matchAll(/-?\d+(\.\d+)?px/g)].map(
    (match) => Number.parseFloat(match[0]),
  );
  const [, offsetY = 0, blur = 0] = numbers;
  return Math.abs(offsetY) + blur;
};

export const buildShadows = (counts: ReadonlyMap<string, number>): ShadowToken[] => {
  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, SHADOW_NAMES.length)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => shadowSize(a.value) - shadowSize(b.value));
  return top.map((item, index) => ({
    ...item,
    name: SHADOW_NAMES[index] ?? `shadow-${index + 1}`,
  }));
};

export const extractBreakpoints = (conditionText: string): number[] => {
  const result: number[] = [];
  const toPx = (amount: string, unit: string): number =>
    Math.round(Number.parseFloat(amount) * (unit === 'px' ? 1 : 16));
  for (const match of conditionText.matchAll(
    /\(\s*(?:min|max)-width\s*:\s*([\d.]+)(px|em|rem)\s*\)/g,
  )) {
    if (match[1] && match[2]) result.push(toPx(match[1], match[2]));
  }
  for (const match of conditionText.matchAll(/width\s*(?:>=|<=|>|<)\s*([\d.]+)(px|em|rem)/g)) {
    if (match[1] && match[2]) result.push(toPx(match[1], match[2]));
  }
  return result.filter((px) => Number.isFinite(px) && px > 0);
};

const TAILWIND_BREAKPOINTS: Readonly<Record<number, string>> = {
  640: 'sm',
  768: 'md',
  1024: 'lg',
  1280: 'xl',
  1536: '2xl',
};

export const buildBreakpoints = (counts: ReadonlyMap<number, number>): ScaleToken[] =>
  sortByCount([...counts.entries()].map(([px, count]) => ({ name: '', px, count })))
    .slice(0, 8)
    .sort((a, b) => a.px - b.px)
    .map((step) => ({ ...step, name: TAILWIND_BREAKPOINTS[step.px] ?? `bp-${step.px}` }));

const CONTAINER_NAMES = ['sm', 'md', 'lg', 'xl', '2xl'] as const;

export const buildContainers = (counts: ReadonlyMap<number, number>): ScaleToken[] =>
  sortByCount(
    [...counts.entries()]
      .filter(([px]) => px >= 480 && px <= 2560)
      .map(([px, count]) => ({ name: '', px: Math.round(px), count })),
  )
    .slice(0, CONTAINER_NAMES.length)
    .sort((a, b) => a.px - b.px)
    .map((step, index) => ({ ...step, name: CONTAINER_NAMES[index] ?? `container-${index + 1}` }));

export const buildDesignTokens = (scan: RawScan): DesignTokens => ({
  colors: extractColorTokens(scan.colors.values()),
  fontFamilies: extractFontFamilies(scan.fontFamilies),
  typeScale: buildTypeScale(scan.fontSizes),
  spacing: normalizeSpacingScale(scan.spacing),
  radii: buildRadii(scan.radii),
  shadows: buildShadows(scan.shadows),
  breakpoints: buildBreakpoints(scan.breakpoints),
  containers: buildContainers(scan.containers),
});

const px = (value: number): string => `${trimNumber(value)}px`;

const variableLines = (tokens: DesignTokens, indent: string): string[] => [
  ...tokens.colors.map((item) => `${indent}--color-${item.name}: ${item.hex};`),
  ...tokens.fontFamilies.map((item) => `${indent}--font-${item.name}: ${item.stack};`),
  ...tokens.typeScale.map((item) => `${indent}--text-${item.name}: ${px(item.px)};`),
  ...tokens.spacing.map((item) => `${indent}--spacing-${item.name}: ${px(item.px)};`),
  ...tokens.radii.map((item) => `${indent}--radius-${item.name}: ${px(item.px)};`),
  ...tokens.shadows.map((item) => `${indent}--shadow-${item.name}: ${item.value};`),
  ...tokens.breakpoints.map((item) => `${indent}--breakpoint-${item.name}: ${px(item.px)};`),
  ...tokens.containers.map((item) => `${indent}--container-${item.name}: ${px(item.px)};`),
];

export const toCssVariables = (tokens: DesignTokens): string =>
  `:root {\n${variableLines(tokens, '  ').join('\n')}\n}`;

export const toTailwindTheme = (tokens: DesignTokens): string =>
  `@theme {\n${variableLines(tokens, '  ').join('\n')}\n}`;

export type ShadowParts = {
  color: string;
  offsetX: string;
  offsetY: string;
  blur: string;
  spread: string;
};

const splitTopLevel = (value: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of value) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
};

export const parseBoxShadow = (value: string): ShadowParts[] | null => {
  const layers: ShadowParts[] = [];
  for (const layer of splitTopLevel(value)) {
    if (/\binset\b/.test(layer)) return null;
    const colorMatch = /rgba?\([^)]*\)|hsla?\([^)]*\)|#[0-9a-f]{3,8}\b/i.exec(layer);
    if (!colorMatch) return null;
    const lengths = layer.replace(colorMatch[0], '').trim().split(/\s+/).filter(Boolean);
    if (lengths.length < 2 || lengths.length > 4) return null;
    const [offsetX = '0px', offsetY = '0px', blur = '0px', spread = '0px'] = lengths;
    const parsed = parseCssColor(colorMatch[0]);
    layers.push({
      color: parsed ? toHex(parsed) : colorMatch[0],
      offsetX,
      offsetY,
      blur,
      spread,
    });
  }
  return layers.length ? layers : null;
};

type TokenLeaf = { $type: string; $value: unknown };

const dimensionGroup = (items: readonly ScaleToken[]): Record<string, TokenLeaf> =>
  Object.fromEntries(items.map((item) => [item.name, { $type: 'dimension', $value: px(item.px) }]));

export const toDesignTokensJson = (tokens: DesignTokens): string => {
  const shadow: Record<string, TokenLeaf> = {};
  for (const item of tokens.shadows) {
    const parts = parseBoxShadow(item.value);
    if (parts)
      shadow[item.name] = { $type: 'shadow', $value: parts.length === 1 ? parts[0] : parts };
  }
  const document = {
    color: Object.fromEntries(
      tokens.colors.map((item) => [item.name, { $type: 'color', $value: item.hex }]),
    ),
    fontFamily: Object.fromEntries(
      tokens.fontFamilies.map((item) => [
        item.name,
        { $type: 'fontFamily', $value: splitFontStack(item.stack) },
      ]),
    ),
    fontSize: dimensionGroup(tokens.typeScale),
    spacing: dimensionGroup(tokens.spacing),
    radius: dimensionGroup(tokens.radii),
    shadow,
    breakpoint: dimensionGroup(tokens.breakpoints),
    container: dimensionGroup(tokens.containers),
  };
  return JSON.stringify(document, null, 2);
};
