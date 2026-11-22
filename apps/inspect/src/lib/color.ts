import { TAILWIND_PALETTE } from './tailwind-palette';

export type Color = { r: number; g: number; b: number; a: number };

export const COLOR_FORMATS = ['hex', 'rgb', 'hsl', 'oklch'] as const;
export type ColorFormat = (typeof COLOR_FORMATS)[number];

type Triple = readonly [number, number, number];

const NAMED_COLORS: Readonly<Record<string, string>> = {
  aliceblue: 'f0f8ff',
  antiquewhite: 'faebd7',
  aqua: '00ffff',
  aquamarine: '7fffd4',
  azure: 'f0ffff',
  beige: 'f5f5dc',
  bisque: 'ffe4c4',
  black: '000000',
  blanchedalmond: 'ffebcd',
  blue: '0000ff',
  blueviolet: '8a2be2',
  brown: 'a52a2a',
  burlywood: 'deb887',
  cadetblue: '5f9ea0',
  chartreuse: '7fff00',
  chocolate: 'd2691e',
  coral: 'ff7f50',
  cornflowerblue: '6495ed',
  cornsilk: 'fff8dc',
  crimson: 'dc143c',
  cyan: '00ffff',
  darkblue: '00008b',
  darkcyan: '008b8b',
  darkgoldenrod: 'b8860b',
  darkgray: 'a9a9a9',
  darkgreen: '006400',
  darkgrey: 'a9a9a9',
  darkkhaki: 'bdb76b',
  darkmagenta: '8b008b',
  darkolivegreen: '556b2f',
  darkorange: 'ff8c00',
  darkorchid: '9932cc',
  darkred: '8b0000',
  darksalmon: 'e9967a',
  darkseagreen: '8fbc8f',
  darkslateblue: '483d8b',
  darkslategray: '2f4f4f',
  darkslategrey: '2f4f4f',
  darkturquoise: '00ced1',
  darkviolet: '9400d3',
  deeppink: 'ff1493',
  deepskyblue: '00bfff',
  dimgray: '696969',
  dimgrey: '696969',
  dodgerblue: '1e90ff',
  firebrick: 'b22222',
  floralwhite: 'fffaf0',
  forestgreen: '228b22',
  fuchsia: 'ff00ff',
  gainsboro: 'dcdcdc',
  ghostwhite: 'f8f8ff',
  gold: 'ffd700',
  goldenrod: 'daa520',
  gray: '808080',
  green: '008000',
  greenyellow: 'adff2f',
  grey: '808080',
  honeydew: 'f0fff0',
  hotpink: 'ff69b4',
  indianred: 'cd5c5c',
  indigo: '4b0082',
  ivory: 'fffff0',
  khaki: 'f0e68c',
  lavender: 'e6e6fa',
  lavenderblush: 'fff0f5',
  lawngreen: '7cfc00',
  lemonchiffon: 'fffacd',
  lightblue: 'add8e6',
  lightcoral: 'f08080',
  lightcyan: 'e0ffff',
  lightgoldenrodyellow: 'fafad2',
  lightgray: 'd3d3d3',
  lightgreen: '90ee90',
  lightgrey: 'd3d3d3',
  lightpink: 'ffb6c1',
  lightsalmon: 'ffa07a',
  lightseagreen: '20b2aa',
  lightskyblue: '87cefa',
  lightslategray: '778899',
  lightslategrey: '778899',
  lightsteelblue: 'b0c4de',
  lightyellow: 'ffffe0',
  lime: '00ff00',
  limegreen: '32cd32',
  linen: 'faf0e6',
  magenta: 'ff00ff',
  maroon: '800000',
  mediumaquamarine: '66cdaa',
  mediumblue: '0000cd',
  mediumorchid: 'ba55d3',
  mediumpurple: '9370db',
  mediumseagreen: '3cb371',
  mediumslateblue: '7b68ee',
  mediumspringgreen: '00fa9a',
  mediumturquoise: '48d1cc',
  mediumvioletred: 'c71585',
  midnightblue: '191970',
  mintcream: 'f5fffa',
  mistyrose: 'ffe4e1',
  moccasin: 'ffe4b5',
  navajowhite: 'ffdead',
  navy: '000080',
  oldlace: 'fdf5e6',
  olive: '808000',
  olivedrab: '6b8e23',
  orange: 'ffa500',
  orangered: 'ff4500',
  orchid: 'da70d6',
  palegoldenrod: 'eee8aa',
  palegreen: '98fb98',
  paleturquoise: 'afeeee',
  palevioletred: 'db7093',
  papayawhip: 'ffefd5',
  peachpuff: 'ffdab9',
  peru: 'cd853f',
  pink: 'ffc0cb',
  plum: 'dda0dd',
  powderblue: 'b0e0e6',
  purple: '800080',
  rebeccapurple: '663399',
  red: 'ff0000',
  rosybrown: 'bc8f8f',
  royalblue: '4169e1',
  saddlebrown: '8b4513',
  salmon: 'fa8072',
  sandybrown: 'f4a460',
  seagreen: '2e8b57',
  seashell: 'fff5ee',
  sienna: 'a0522d',
  silver: 'c0c0c0',
  skyblue: '87ceeb',
  slateblue: '6a5acd',
  slategray: '708090',
  slategrey: '708090',
  snow: 'fffafa',
  springgreen: '00ff7f',
  steelblue: '4682b4',
  tan: 'd2b48c',
  teal: '008080',
  thistle: 'd8bfd8',
  tomato: 'ff6347',
  turquoise: '40e0d0',
  violet: 'ee82ee',
  wheat: 'f5deb3',
  white: 'ffffff',
  whitesmoke: 'f5f5f5',
  yellow: 'ffff00',
  yellowgreen: '9acd32',
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const roundTo = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const trimNumber = (value: number, decimals: number): string => String(roundTo(value, decimals));

const srgbToLinear = (channel: number): number =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

const linearToSrgb = (channel: number): number =>
  channel <= 0.0031308 ? channel * 12.92 : 1.055 * Math.abs(channel) ** (1 / 2.4) - 0.055;

const unitToByte = (unit: number): number => clamp(unit, 0, 1) * 255;

const linearRgbToColor = (r: number, g: number, b: number, a: number): Color => ({
  r: unitToByte(linearToSrgb(r)),
  g: unitToByte(linearToSrgb(g)),
  b: unitToByte(linearToSrgb(b)),
  a: clamp(a, 0, 1),
});

const multiplyMatrix = (m: readonly number[], v: Triple): Triple => [
  (m[0] ?? 0) * v[0] + (m[1] ?? 0) * v[1] + (m[2] ?? 0) * v[2],
  (m[3] ?? 0) * v[0] + (m[4] ?? 0) * v[1] + (m[5] ?? 0) * v[2],
  (m[6] ?? 0) * v[0] + (m[7] ?? 0) * v[1] + (m[8] ?? 0) * v[2],
];

const oklabToColor = (lightness: number, a: number, b: number, alpha: number): Color => {
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return linearRgbToColor(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    alpha,
  );
};

const colorToOklab = (color: Color): Triple => {
  const r = srgbToLinear(color.r / 255);
  const g = srgbToLinear(color.g / 255);
  const b = srgbToLinear(color.b / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
};

const D50_WHITE: Triple = [0.96429567643, 1, 0.82510460251];
const D50_TO_D65 = [
  0.9554734527042182, -0.023098536874261423, 0.0632593086610217, -0.028369706963208136,
  1.0099954580058226, 0.021041398966943008, 0.012314001688319899, -0.020507696433477912,
  1.3303659366080753,
];
const XYZ_D65_TO_LINEAR_SRGB = [
  3.2409699419045226, -1.537383177570094, -0.4986107602930034, -0.9692436362808796,
  1.8759675015077202, 0.04155505740717559, 0.05563007969699366, -0.20397695888897652,
  1.0569715142428786,
];

const labToColor = (lightness: number, a: number, b: number, alpha: number): Color => {
  const epsilon = 216 / 24389;
  const kappa = 24389 / 27;
  const fy = (lightness + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const xr = fx ** 3 > epsilon ? fx ** 3 : (116 * fx - 16) / kappa;
  const yr = lightness > kappa * epsilon ? fy ** 3 : lightness / kappa;
  const zr = fz ** 3 > epsilon ? fz ** 3 : (116 * fz - 16) / kappa;
  const xyzD50: Triple = [xr * D50_WHITE[0], yr * D50_WHITE[1], zr * D50_WHITE[2]];
  const xyzD65 = multiplyMatrix(D50_TO_D65, xyzD50);
  const [r, g, bl] = multiplyMatrix(XYZ_D65_TO_LINEAR_SRGB, xyzD65);
  return linearRgbToColor(r, g, bl, alpha);
};

const hslToColor = (hue: number, saturation: number, lightness: number, alpha: number): Color => {
  const h = ((hue % 360) + 360) % 360;
  const s = clamp(saturation, 0, 1);
  const l = clamp(lightness, 0, 1);
  const channel = (n: number): number => {
    const k = (n + h / 30) % 12;
    return (l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255;
  };
  return { r: channel(0), g: channel(8), b: channel(4), a: clamp(alpha, 0, 1) };
};

const hwbToColor = (hue: number, whiteness: number, blackness: number, alpha: number): Color => {
  const w = clamp(whiteness, 0, 1);
  const bl = clamp(blackness, 0, 1);
  if (w + bl >= 1) {
    const gray = (w / (w + bl)) * 255;
    return { r: gray, g: gray, b: gray, a: clamp(alpha, 0, 1) };
  }
  const base = hslToColor(hue, 1, 0.5, alpha);
  const mix = (value: number): number => value * (1 - w - bl) + w * 255;
  return { r: mix(base.r), g: mix(base.g), b: mix(base.b), a: base.a };
};

const parseHex = (value: string): Color | null => {
  if (!/^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/.test(value)) return null;
  const digits = value.slice(1);
  const expanded =
    digits.length <= 4
      ? digits
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : digits;
  const byte = (index: number): number => Number.parseInt(expanded.slice(index, index + 2), 16);
  return {
    r: byte(0),
    g: byte(2),
    b: byte(4),
    a: expanded.length === 8 ? byte(6) / 255 : 1,
  };
};

const parseNumberToken = (token: string): number | null => {
  if (token === 'none') return 0;
  if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/.test(token)) return null;
  return Number.parseFloat(token);
};

const parseScaled = (token: string, percentScale: number): number | null => {
  if (token.endsWith('%')) {
    const percent = parseNumberToken(token.slice(0, -1));
    return percent === null ? null : (percent / 100) * percentScale;
  }
  return parseNumberToken(token);
};

const parseUnitOrPercent = (token: string): number | null => {
  const value = parseScaled(token, 1);
  if (value === null) return null;
  return token.endsWith('%') || token === 'none' ? value : value / 100;
};

const parseHue = (token: string): number | null => {
  if (token === 'none') return 0;
  const match = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(deg|grad|rad|turn)?$/.exec(token);
  if (!match?.[1]) return null;
  const value = Number.parseFloat(match[1]);
  switch (match[2]) {
    case 'grad':
      return value * 0.9;
    case 'rad':
      return (value * 180) / Math.PI;
    case 'turn':
      return value * 360;
    default:
      return value;
  }
};

const parseAlpha = (token: string | undefined): number | null => {
  if (token === undefined) return 1;
  const value = parseScaled(token, 1);
  return value === null ? null : clamp(value, 0, 1);
};

const buildFunctional = (name: string, tokens: readonly string[]): Color | null => {
  const [first = '', second = '', third = ''] = tokens;
  const alpha = parseAlpha(tokens[3]);
  if (tokens.length < 3 || tokens.length > 4 || alpha === null) return null;
  switch (name) {
    case 'rgb':
    case 'rgba': {
      const r = parseScaled(first, 255);
      const g = parseScaled(second, 255);
      const b = parseScaled(third, 255);
      if (r === null || g === null || b === null) return null;
      return { r: clamp(r, 0, 255), g: clamp(g, 0, 255), b: clamp(b, 0, 255), a: alpha };
    }
    case 'hsl':
    case 'hsla': {
      const h = parseHue(first);
      const s = parseUnitOrPercent(second);
      const l = parseUnitOrPercent(third);
      if (h === null || s === null || l === null) return null;
      return hslToColor(h, s, l, alpha);
    }
    case 'hwb': {
      const h = parseHue(first);
      const w = parseUnitOrPercent(second);
      const b = parseUnitOrPercent(third);
      if (h === null || w === null || b === null) return null;
      return hwbToColor(h, w, b, alpha);
    }
    case 'oklab': {
      const l = parseScaled(first, 1);
      const a = parseScaled(second, 0.4);
      const b = parseScaled(third, 0.4);
      if (l === null || a === null || b === null) return null;
      return oklabToColor(l, a, b, alpha);
    }
    case 'oklch': {
      const l = parseScaled(first, 1);
      const c = parseScaled(second, 0.4);
      const h = parseHue(third);
      if (l === null || c === null || h === null) return null;
      const radians = (h * Math.PI) / 180;
      return oklabToColor(l, c * Math.cos(radians), c * Math.sin(radians), alpha);
    }
    case 'lab': {
      const l = parseScaled(first, 100);
      const a = parseScaled(second, 125);
      const b = parseScaled(third, 125);
      if (l === null || a === null || b === null) return null;
      return labToColor(l, a, b, alpha);
    }
    case 'lch': {
      const l = parseScaled(first, 100);
      const c = parseScaled(second, 150);
      const h = parseHue(third);
      if (l === null || c === null || h === null) return null;
      const radians = (h * Math.PI) / 180;
      return labToColor(l, c * Math.cos(radians), c * Math.sin(radians), alpha);
    }
    default:
      return null;
  }
};

const parseColorFunction = (tokens: readonly string[]): Color | null => {
  const [space, ...rest] = tokens;
  if (space !== 'srgb' && space !== 'srgb-linear') return null;
  if (rest.length < 3 || rest.length > 4) return null;
  const alpha = parseAlpha(rest[3]);
  const r = parseScaled(rest[0] ?? '', 1);
  const g = parseScaled(rest[1] ?? '', 1);
  const b = parseScaled(rest[2] ?? '', 1);
  if (r === null || g === null || b === null || alpha === null) return null;
  if (space === 'srgb') return { r: unitToByte(r), g: unitToByte(g), b: unitToByte(b), a: alpha };
  return linearRgbToColor(r, g, b, alpha);
};

export const parseCssColor = (input: string): Color | null => {
  const value = input.trim().toLowerCase();
  if (!value) return null;
  if (value === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  if (value.startsWith('#')) return parseHex(value);
  const named = NAMED_COLORS[value];
  if (named) return parseHex(`#${named}`);
  const match = /^([a-z]+)\(\s*(.*?)\s*\)$/.exec(value);
  if (!match?.[1] || match[2] === undefined) return null;
  const tokens = match[2].replace(/[,/]/g, ' ').split(/\s+/).filter(Boolean);
  if (match[1] === 'color') return parseColorFunction(tokens);
  return buildFunctional(match[1], tokens);
};

const hex2 = (value: number): string =>
  Math.round(clamp(value, 0, 255))
    .toString(16)
    .padStart(2, '0');

export const toHex = (color: Color): string =>
  `#${hex2(color.r)}${hex2(color.g)}${hex2(color.b)}${color.a < 1 ? hex2(color.a * 255) : ''}`;

export const toRgb = (color: Color): string => {
  const r = Math.round(clamp(color.r, 0, 255));
  const g = Math.round(clamp(color.g, 0, 255));
  const b = Math.round(clamp(color.b, 0, 255));
  return color.a < 1
    ? `rgba(${r}, ${g}, ${b}, ${trimNumber(color.a, 3)})`
    : `rgb(${r}, ${g}, ${b})`;
};

export type HslValues = { h: number; s: number; l: number };

export const toHslValues = (color: Color): HslValues => {
  const r = clamp(color.r, 0, 255) / 255;
  const g = clamp(color.g, 0, 255) / 255;
  const b = clamp(color.b, 0, 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  if (delta === 0) return { h: 0, s: 0, l: lightness * 100 };
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue: number;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  return { h: (hue * 60 + 360) % 360, s: saturation * 100, l: lightness * 100 };
};

export const toHsl = (color: Color): string => {
  const { h, s, l } = toHslValues(color);
  const body = `${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%`;
  return color.a < 1 ? `hsla(${body}, ${trimNumber(color.a, 3)})` : `hsl(${body})`;
};

export type OklchValues = { l: number; c: number; h: number };

export const toOklchValues = (color: Color): OklchValues => {
  const [l, a, b] = colorToOklab(color);
  const chroma = Math.hypot(a, b);
  const hue = chroma < 0.0002 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  return { l, c: chroma, h: hue };
};

export const toOklch = (color: Color): string => {
  const { l, c, h } = toOklchValues(color);
  const alpha = color.a < 1 ? ` / ${trimNumber(color.a, 3)}` : '';
  return `oklch(${trimNumber(l * 100, 1)}% ${trimNumber(c, 3)} ${trimNumber(h, 2)}${alpha})`;
};

export const formatColor = (color: Color, format: ColorFormat): string => {
  switch (format) {
    case 'hex':
      return toHex(color);
    case 'rgb':
      return toRgb(color);
    case 'hsl':
      return toHsl(color);
    case 'oklch':
      return toOklch(color);
  }
};

export const compositeOver = (foreground: Color, background: Color): Color => {
  const alpha = foreground.a + background.a * (1 - foreground.a);
  if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const mix = (front: number, back: number): number =>
    (front * foreground.a + back * background.a * (1 - foreground.a)) / alpha;
  return {
    r: mix(foreground.r, background.r),
    g: mix(foreground.g, background.g),
    b: mix(foreground.b, background.b),
    a: alpha,
  };
};

const WHITE: Color = { r: 255, g: 255, b: 255, a: 1 };

const flatten = (foreground: Color, background: Color): { text: Color; surface: Color } => {
  const surface = compositeOver(background, WHITE);
  return { text: compositeOver(foreground, surface), surface };
};

export const relativeLuminance = (color: Color): number =>
  0.2126 * srgbToLinear(color.r / 255) +
  0.7152 * srgbToLinear(color.g / 255) +
  0.0722 * srgbToLinear(color.b / 255);

export const contrastWcag = (foreground: Color, background: Color): number => {
  const { text, surface } = flatten(foreground, background);
  const a = relativeLuminance(text);
  const b = relativeLuminance(surface);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

export type WcagVerdict = { aa: boolean; aaLarge: boolean; aaa: boolean; aaaLarge: boolean };

export const wcagVerdict = (ratio: number): WcagVerdict => ({
  aa: ratio >= 4.5,
  aaLarge: ratio >= 3,
  aaa: ratio >= 7,
  aaaLarge: ratio >= 4.5,
});

const apcaLuminance = (color: Color): number => {
  const y =
    0.2126729 * (color.r / 255) ** 2.4 +
    0.7151522 * (color.g / 255) ** 2.4 +
    0.072175 * (color.b / 255) ** 2.4;
  // biome-ignore lint/suspicious/noApproximativeNumericConstant: APCA soft black clamp exponent
  return y < 0.022 ? y + (0.022 - y) ** 1.414 : y;
};

export const contrastApca = (text: Color, background: Color): number => {
  const flat = flatten(text, background);
  const textY = apcaLuminance(flat.text);
  const backgroundY = apcaLuminance(flat.surface);
  if (Math.abs(backgroundY - textY) < 0.0005) return 0;
  if (backgroundY > textY) {
    const contrast = (backgroundY ** 0.56 - textY ** 0.57) * 1.14;
    return contrast < 0.1 ? 0 : (contrast - 0.027) * 100;
  }
  const contrast = (backgroundY ** 0.65 - textY ** 0.62) * 1.14;
  return contrast > -0.1 ? 0 : (contrast + 0.027) * 100;
};

export type TailwindMatch = { name: string; hex: string; distance: number };

type PaletteEntry = { name: string; lab: Triple; hex: string };

let paletteCache: readonly PaletteEntry[] | undefined;

const getPalette = (): readonly PaletteEntry[] => {
  paletteCache ??= TAILWIND_PALETTE.map(([name, lightness, chroma, hue]) => {
    const radians = (hue * Math.PI) / 180;
    const a = chroma * Math.cos(radians);
    const b = chroma * Math.sin(radians);
    return {
      name,
      lab: [lightness, a, b] as const,
      hex: toHex(oklabToColor(lightness, a, b, 1)),
    };
  });
  return paletteCache;
};

export const nearestTailwind = (color: Color): TailwindMatch => {
  const [l, a, b] = colorToOklab(color);
  let best: PaletteEntry | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const entry of getPalette()) {
    const distance = Math.hypot(entry.lab[0] - l, entry.lab[1] - a, entry.lab[2] - b);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = entry;
    }
  }
  return {
    name: best?.name ?? 'black',
    hex: best?.hex ?? '#000000',
    distance: roundTo(bestDistance * 100, 2),
  };
};
