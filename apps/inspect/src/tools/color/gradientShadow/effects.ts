import { parseCssColor, toHex } from '../../../lib/color';

const COLOR_TOKEN = /(?:rgba?|hsla?|hwb|oklab|oklch|lab|lch|color)\([^()]*\)|#[\da-f]{3,8}\b/i;

const FILTER_FUNCTIONS = new Set([
  'blur',
  'brightness',
  'contrast',
  'grayscale',
  'hue-rotate',
  'invert',
  'saturate',
  'sepia',
  'drop-shadow',
]);

const DIRECTION_CLASSES: Readonly<Record<string, string>> = {
  '0': 't',
  '45': 'tr',
  '90': 'r',
  '135': 'br',
  '180': 'b',
  '225': 'bl',
  '270': 'l',
  '315': 'tl',
  'to top': 't',
  'to top right': 'tr',
  'to right': 'r',
  'to bottom right': 'br',
  'to bottom': 'b',
  'to bottom left': 'bl',
  'to left': 'l',
  'to top left': 'tl',
};

export const splitTopLevel = (value: string, separator: ',' | ' ' = ','): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '(') depth += 1;
    else if (char === ')') depth -= 1;
    else if (depth === 0 && char === separator) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(value.slice(start));
  return parts.map((part) => part.trim()).filter(Boolean);
};

const toArbitrary = (value: string): string => value.replace(/\s+/g, '_');

export type ElementEffects = {
  gradients: string[];
  boxShadows: string[];
  textShadows: string[];
  filter: string | null;
  backdropFilter: string | null;
};

const meaningful = (value: string): string | null =>
  value && value !== 'none' && value !== 'normal' ? value : null;

export const readEffects = (style: CSSStyleDeclaration): ElementEffects => ({
  gradients: splitTopLevel(style.backgroundImage).filter((layer) => layer.includes('gradient(')),
  boxShadows: splitTopLevel(meaningful(style.boxShadow) ?? ''),
  textShadows: splitTopLevel(meaningful(style.textShadow) ?? ''),
  filter: meaningful(style.filter),
  backdropFilter: meaningful(style.getPropertyValue('backdrop-filter')),
});

export const hasAnyEffect = (effects: ElementEffects): boolean =>
  effects.gradients.length > 0 ||
  effects.boxShadows.length > 0 ||
  effects.textShadows.length > 0 ||
  effects.filter !== null ||
  effects.backdropFilter !== null;

const moveColorToEnd = (layer: string): string => {
  const match = COLOR_TOKEN.exec(layer);
  if (!match) return layer.trim();
  const rest = layer.replace(match[0], '').replace(/\s+/g, ' ').trim();
  return `${rest} ${match[0]}`.trim();
};

export const shadowToTailwind = (layers: readonly string[], property: 'box' | 'text'): string => {
  const value = layers.map((layer) => toArbitrary(moveColorToEnd(layer))).join(',');
  return property === 'box' ? `shadow-[${value}]` : `[text-shadow:${value}]`;
};

const stopToTailwindColor = (stop: string): string | null => {
  const match = COLOR_TOKEN.exec(stop);
  if (!match || stop.replace(match[0], '').trim() !== '') return null;
  const color = parseCssColor(match[0]);
  return color ? `[${toHex(color)}]` : null;
};

export const gradientToTailwind = (gradient: string): string => {
  const arbitrary = `bg-[${toArbitrary(gradient)}]`;
  const match = /^linear-gradient\((.*)\)$/i.exec(gradient.trim());
  if (!match?.[1]) return arbitrary;
  const parts = splitTopLevel(match[1]);
  const first = parts[0] ?? '';
  const hasDirection = /^(?:-?[\d.]+deg|to\s)/.test(first);
  const direction = hasDirection ? first.replace(/deg$/, '').trim() : '180';
  const stops = hasDirection ? parts.slice(1) : parts;
  const directionClass = DIRECTION_CLASSES[direction];
  const colors = stops.map(stopToTailwindColor);
  if (!directionClass || stops.length < 2 || stops.length > 3 || colors.some((c) => c === null)) {
    return arbitrary;
  }
  const [from, second, third] = colors as string[];
  const classes = [`bg-linear-to-${directionClass}`, `from-${from}`];
  if (third !== undefined) classes.push(`via-${second}`, `to-${third}`);
  else classes.push(`to-${second}`);
  return classes.join(' ');
};

export const filterToTailwind = (value: string, prefix: '' | 'backdrop-' = ''): string => {
  const functions = splitTopLevel(value, ' ');
  const classes = functions.map((fn) => {
    const match = /^([a-z-]+)\((.*)\)$/i.exec(fn);
    const name = match?.[1] ?? '';
    if (!match?.[2] || !FILTER_FUNCTIONS.has(name)) return null;
    return `${prefix}${name}-[${toArbitrary(match[2])}]`;
  });
  if (classes.some((item) => item === null)) {
    return `[${prefix}filter:${toArbitrary(value)}]`;
  }
  return classes.join(' ');
};
