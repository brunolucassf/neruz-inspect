import { nearestTailwind, parseCssColor, toHex } from './color';

export type LengthUnit = 'px' | 'rem';

export const REM_BASE_PX = 16;

export const camelToKebab = (name: string): string =>
  name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

export const getComputedSubset = (
  element: Element,
  properties: readonly string[],
): Record<string, string> => {
  const style = getComputedStyle(element);
  const result: Record<string, string> = {};
  for (const property of properties) {
    const name = camelToKebab(property);
    result[name] = style.getPropertyValue(name).trim();
  }
  return result;
};

export type CssTextOptions = { selector?: string; indent?: string };

export const toCssText = (
  map: Readonly<Record<string, string>>,
  { selector, indent = '  ' }: CssTextOptions = {},
): string => {
  const entries = Object.entries(map).filter(([, value]) => value !== '');
  if (!selector) return entries.map(([name, value]) => `${name}: ${value};`).join('\n');
  const body = entries.map(([name, value]) => `${indent}${name}: ${value};`).join('\n');
  return `${selector} {\n${body}\n}`;
};

export const parsePx = (value: string | undefined): number => {
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const trimDecimals = (value: number, decimals: number): string => {
  const factor = 10 ** decimals;
  return String(Math.round(value * factor) / factor);
};

export const formatLength = (px: number, unit: LengthUnit, base: number = REM_BASE_PX): string =>
  unit === 'rem' ? `${trimDecimals(px / base, 4)}rem` : `${trimDecimals(px, 2)}px`;

const SPACING_PROPERTY_PREFIX: Readonly<Record<string, string>> = {
  padding: 'p',
  margin: 'm',
};

const FONT_SIZE_CLASSES: Readonly<Record<number, string>> = {
  12: 'text-xs',
  14: 'text-sm',
  16: 'text-base',
  18: 'text-lg',
  20: 'text-xl',
  24: 'text-2xl',
  30: 'text-3xl',
  36: 'text-4xl',
  48: 'text-5xl',
  60: 'text-6xl',
  72: 'text-7xl',
  96: 'text-8xl',
  128: 'text-9xl',
};

const FONT_WEIGHT_CLASSES: Readonly<Record<string, string>> = {
  '100': 'font-thin',
  '200': 'font-extralight',
  '300': 'font-light',
  '500': 'font-medium',
  '600': 'font-semibold',
  '700': 'font-bold',
  '800': 'font-extrabold',
  '900': 'font-black',
};

const DISPLAY_CLASSES: Readonly<Record<string, string>> = {
  block: 'block',
  flex: 'flex',
  grid: 'grid',
  inline: 'inline',
  'inline-block': 'inline-block',
  'inline-flex': 'inline-flex',
  'inline-grid': 'inline-grid',
  contents: 'contents',
  none: 'hidden',
};

const POSITION_CLASSES: Readonly<Record<string, string>> = {
  relative: 'relative',
  absolute: 'absolute',
  fixed: 'fixed',
  sticky: 'sticky',
};

const FLEX_DIRECTION_CLASSES: Readonly<Record<string, string>> = {
  column: 'flex-col',
  'row-reverse': 'flex-row-reverse',
  'column-reverse': 'flex-col-reverse',
};

const JUSTIFY_CLASSES: Readonly<Record<string, string>> = {
  center: 'justify-center',
  'flex-start': 'justify-start',
  'flex-end': 'justify-end',
  'space-between': 'justify-between',
  'space-around': 'justify-around',
  'space-evenly': 'justify-evenly',
};

const ALIGN_ITEMS_CLASSES: Readonly<Record<string, string>> = {
  center: 'items-center',
  'flex-start': 'items-start',
  'flex-end': 'items-end',
  baseline: 'items-baseline',
};

const TEXT_ALIGN_CLASSES: Readonly<Record<string, string>> = {
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
};

const RADIUS_CLASSES: Readonly<Record<number, string>> = {
  0: 'rounded-none',
  2: 'rounded-xs',
  4: 'rounded-sm',
  6: 'rounded-md',
  8: 'rounded-lg',
  12: 'rounded-xl',
  16: 'rounded-2xl',
  24: 'rounded-3xl',
  32: 'rounded-4xl',
};

const BORDER_WIDTH_CLASSES: Readonly<Record<number, string>> = {
  1: 'border',
  2: 'border-2',
  4: 'border-4',
  8: 'border-8',
};

const spacingToken = (px: number): string => {
  if (px === 1) return 'px';
  if (px % 2 === 0) return trimDecimals(px / 4, 2);
  return `[${trimDecimals(px, 2)}px]`;
};

const colorToken = (value: string): string | null => {
  const color = parseCssColor(value);
  if (!color || color.a === 0) return null;
  const match = nearestTailwind(color);
  if (match.distance < 1.5 && color.a === 1) return match.name;
  return `[${toHex(color)}]`;
};

type EdgeValues = { top: string; right: string; bottom: string; left: string };

const readEdges = (
  map: Readonly<Record<string, string>>,
  property: string,
  suffix = '',
): EdgeValues | null => {
  const top = map[`${property}-top${suffix}`];
  const right = map[`${property}-right${suffix}`];
  const bottom = map[`${property}-bottom${suffix}`];
  const left = map[`${property}-left${suffix}`];
  if (top === undefined || right === undefined || bottom === undefined || left === undefined) {
    return null;
  }
  return { top, right, bottom, left };
};

const spacingClasses = (prefix: string, edges: EdgeValues): string[] => {
  const toToken = (value: string): string | null => {
    if (value === 'auto') return 'auto';
    const px = parsePx(value);
    return px === 0 ? null : spacingToken(px);
  };
  const { top, right, bottom, left } = edges;
  if (top === right && right === bottom && bottom === left) {
    const token = toToken(top);
    return token ? [`${prefix}-${token}`] : [];
  }
  const classes: string[] = [];
  const emit = (name: string, first: string, second?: string): void => {
    if (second !== undefined && first !== second) return;
    const token = toToken(first);
    if (token) classes.push(`${prefix}${name}-${token}`);
  };
  if (left === right) emit('x', left);
  else {
    emit('l', left);
    emit('r', right);
  }
  if (top === bottom) emit('y', top);
  else {
    emit('t', top);
    emit('b', bottom);
  }
  return classes;
};

const lengthClass = (prefix: string, value: string | undefined): string[] => {
  if (!value || value === 'auto' || value === 'none' || value === 'normal') return [];
  const px = parsePx(value);
  if (value.endsWith('px')) return [`${prefix}-${spacingToken(px)}`];
  return [`${prefix}-[${value.replace(/\s+/g, '_')}]`];
};

const radiusClasses = (map: Readonly<Record<string, string>>): string[] => {
  const corners = [
    map['border-top-left-radius'],
    map['border-top-right-radius'],
    map['border-bottom-right-radius'],
    map['border-bottom-left-radius'],
  ];
  const single =
    map['border-radius'] ?? (corners.every((c) => c === corners[0]) ? corners[0] : undefined);
  if (single === undefined) return [];
  const px = parsePx(single);
  if (px === 0) return [];
  if (px >= 9999) return ['rounded-full'];
  return [RADIUS_CLASSES[px] ?? `rounded-[${trimDecimals(px, 2)}px]`];
};

const borderClasses = (map: Readonly<Record<string, string>>): string[] => {
  const widths = readEdges(map, 'border', '-width');
  if (!widths) return [];
  const values = [widths.top, widths.right, widths.bottom, widths.left].map(parsePx);
  const first = values[0] ?? 0;
  if (first === 0 || values.some((value) => value !== first)) return [];
  const classes = [BORDER_WIDTH_CLASSES[first] ?? `border-[${trimDecimals(first, 2)}px]`];
  const borderColor = map['border-top-color'] ?? map['border-color'];
  const token = borderColor ? colorToken(borderColor) : null;
  if (token) classes.push(`border-${token}`);
  return classes;
};

export const toTailwindClassList = (map: Readonly<Record<string, string>>): string[] => {
  const classes: string[] = [];
  const push = (...values: (string | undefined)[]): void => {
    for (const value of values) if (value) classes.push(value);
  };

  const display = map.display;
  if (display) push(DISPLAY_CLASSES[display]);
  const position = map.position;
  if (position) push(POSITION_CLASSES[position]);
  push(FLEX_DIRECTION_CLASSES[map['flex-direction'] ?? '']);
  push(JUSTIFY_CLASSES[map['justify-content'] ?? '']);
  push(ALIGN_ITEMS_CLASSES[map['align-items'] ?? '']);

  const rowGap = map['row-gap'] ?? map.gap;
  const columnGap = map['column-gap'] ?? map.gap;
  if (rowGap && rowGap === columnGap)
    classes.push(
      ...lengthClass('gap', rowGap === 'normal' ? undefined : rowGap).filter((c) => c !== 'gap-0'),
    );
  else {
    classes.push(...lengthClass('gap-x', columnGap === 'normal' ? undefined : columnGap));
    classes.push(...lengthClass('gap-y', rowGap === 'normal' ? undefined : rowGap));
  }

  for (const [property, prefix] of Object.entries(SPACING_PROPERTY_PREFIX)) {
    const edges = readEdges(map, property);
    if (edges) classes.push(...spacingClasses(prefix, edges));
  }

  classes.push(...lengthClass('w', map.width));
  classes.push(...lengthClass('h', map.height));

  const fontSize = map['font-size'];
  if (fontSize) {
    const px = parsePx(fontSize);
    push(FONT_SIZE_CLASSES[px] ?? (px > 0 ? `text-[${trimDecimals(px, 2)}px]` : undefined));
  }
  push(FONT_WEIGHT_CLASSES[map['font-weight'] ?? '']);
  const lineHeight = map['line-height'];
  if (lineHeight && lineHeight !== 'normal') push(`leading-[${lineHeight.replace(/\s+/g, '_')}]`);
  const letterSpacing = map['letter-spacing'];
  if (letterSpacing && letterSpacing !== 'normal' && parsePx(letterSpacing) !== 0) {
    push(`tracking-[${letterSpacing}]`);
  }
  push(TEXT_ALIGN_CLASSES[map['text-align'] ?? '']);

  const textColor = map.color ? colorToken(map.color) : null;
  if (textColor) push(`text-${textColor}`);
  const backgroundColor = map['background-color'] ? colorToken(map['background-color']) : null;
  if (backgroundColor) push(`bg-${backgroundColor}`);

  classes.push(...radiusClasses(map));
  classes.push(...borderClasses(map));

  const opacity = map.opacity;
  if (opacity && opacity !== '1') {
    const percent = Math.round(Number.parseFloat(opacity) * 100);
    if (Number.isFinite(percent)) push(`opacity-${percent}`);
  }
  return classes;
};

export const toTailwindClasses = (map: Readonly<Record<string, string>>): string =>
  toTailwindClassList(map).join(' ');

export const convertPxValues = (
  text: string,
  unit: LengthUnit,
  base: number = REM_BASE_PX,
): string =>
  unit === 'px'
    ? text
    : text.replace(/(-?\d*\.?\d+)px\b/g, (_match, amount: string) =>
        formatLength(Number.parseFloat(amount), unit, base),
      );
