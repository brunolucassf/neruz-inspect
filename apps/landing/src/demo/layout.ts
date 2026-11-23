export const DEMO_WIDTH = 960;
export const DEMO_HEIGHT = 640;

export const DEMO_COLORS = {
  paper: '#EEF0E6',
  navPaper: '#E3E7D8',
  artPaper: '#DDE3D0',
  ink: '#1C2620',
  clay: '#B4582F',
  moss: '#6F8A5B',
  onClay: '#FFFFFF',
} as const;

export interface DemoRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const DEMO_RECTS = {
  nav: { x: 0, y: 0, w: 960, h: 60 },
  brand: { x: 40, y: 16, w: 78, h: 30 },
  links: { x: 600, y: 18, w: 320, h: 26 },
  title: { x: 48, y: 108, w: 560, h: 180 },
  text: { x: 48, y: 312, w: 440, h: 58 },
  button: { x: 48, y: 398, w: 176, h: 52 },
  swatches: { x: 48, y: 486, w: 240, h: 92 },
  art: { x: 628, y: 100, w: 292, h: 440 },
  marquee: { x: 0, y: 598, w: 1046, h: 30 },
} satisfies Record<string, DemoRect>;

export type DemoBlockId = keyof typeof DEMO_RECTS;

export const DEMO_SWATCHES = [
  { hex: DEMO_COLORS.clay, key: 'clay', rect: { x: 48, y: 486, w: 64, h: 64 } },
  { hex: DEMO_COLORS.moss, key: 'moss', rect: { x: 136, y: 486, w: 64, h: 64 } },
  { hex: DEMO_COLORS.ink, key: 'ink', rect: { x: 224, y: 486, w: 64, h: 64 } },
] as const;

export const TOOL_IDS = [
  'box',
  'font',
  'eyedropper',
  'assets',
  'contrast',
  'tokens',
  'component',
  'overflow',
  'motion',
  'tags',
  'tech',
  'utils',
] as const;

export type ToolId = (typeof TOOL_IDS)[number];

export const TOOL_GROUP: Record<ToolId, number> = {
  eyedropper: 0,
  contrast: 0,
  font: 1,
  box: 2,
  overflow: 2,
  tokens: 3,
  component: 3,
  motion: 4,
  tags: 5,
  tech: 5,
  assets: 6,
  utils: 7,
};

export const MARQUEE_EXCESS = DEMO_RECTS.marquee.w - DEMO_WIDTH;

export interface FontReading {
  family: string;
  declared: string;
  weight: number;
  size: number;
  lineHeight: number;
  color: string;
}

export interface BoxReading {
  width: number;
  height: number;
  margin: [number, number, number, number];
  padding: [number, number, number, number];
  border: number;
  radius: number;
  display: string;
}

export interface ColorReading {
  hex: string;
  rgb: string;
  hsl: string;
  oklch: string;
}

export interface InspectTarget {
  id: string;
  rect: DemoRect;
  tag: string;
  className?: string;
  tool: ToolId;
  font?: FontReading;
  box?: BoxReading;
  color?: ColorReading;
}

const SERIF_STACK = 'Fraunces, Georgia, serif';
const SANS_STACK = 'Inter, system-ui, sans-serif';

function toLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function hexChannels(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function toHsl([red, green, blue]: [number, number, number]): string {
  const [r, g, b] = [red / 255, green / 255, blue / 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return `hsl(0 0% ${Math.round(lightness * 100)}%)`;
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue = Math.round(hue * 60 + 360) % 360;
  return `hsl(${hue} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%)`;
}

function toOklch(channels: [number, number, number]): string {
  const [r, g, b] = channels.map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const chroma = Math.sqrt(a * a + bAxis * bAxis);
  const hue = (Math.atan2(bAxis, a) * 180) / Math.PI;
  return `oklch(${(lightness * 100).toFixed(1)}% ${chroma.toFixed(3)} ${Math.round((hue + 360) % 360)})`;
}

export function readColor(hex: string): ColorReading {
  const channels = hexChannels(hex);
  return {
    hex: hex.toUpperCase(),
    rgb: `rgb(${channels.join(' ')})`,
    hsl: toHsl(channels),
    oklch: toOklch(channels),
  };
}

export const DEMO_TARGETS: InspectTarget[] = [
  {
    id: 'title',
    rect: DEMO_RECTS.title,
    tag: 'h1',
    tool: 'font',
    font: {
      family: 'Fraunces',
      declared: SERIF_STACK,
      weight: 600,
      size: 54,
      lineHeight: 58,
      color: DEMO_COLORS.ink,
    },
  },
  {
    id: 'text',
    rect: DEMO_RECTS.text,
    tag: 'p',
    className: 'lead',
    tool: 'font',
    font: {
      family: 'Inter',
      declared: SANS_STACK,
      weight: 400,
      size: 17,
      lineHeight: 26,
      color: DEMO_COLORS.ink,
    },
  },
  {
    id: 'brand',
    rect: DEMO_RECTS.brand,
    tag: 'a',
    className: 'brand',
    tool: 'font',
    font: {
      family: 'Fraunces',
      declared: SERIF_STACK,
      weight: 600,
      size: 24,
      lineHeight: 30,
      color: DEMO_COLORS.ink,
    },
  },
  {
    id: 'links',
    rect: DEMO_RECTS.links,
    tag: 'ul',
    className: 'nav',
    tool: 'font',
    font: {
      family: 'Inter',
      declared: SANS_STACK,
      weight: 500,
      size: 15,
      lineHeight: 24,
      color: DEMO_COLORS.ink,
    },
  },
  {
    id: 'button',
    rect: DEMO_RECTS.button,
    tag: 'a',
    className: 'btn',
    tool: 'box',
    box: {
      width: 176,
      height: 52,
      margin: [28, 0, 36, 0],
      padding: [14, 28, 14, 28],
      border: 0,
      radius: 6,
      display: 'inline-grid',
    },
  },
  {
    id: 'nav',
    rect: DEMO_RECTS.nav,
    tag: 'header',
    tool: 'box',
    box: {
      width: 960,
      height: 60,
      margin: [0, 0, 0, 0],
      padding: [16, 40, 14, 40],
      border: 1,
      radius: 0,
      display: 'flex',
    },
  },
  ...DEMO_SWATCHES.map(
    (swatch): InspectTarget => ({
      id: `swatch-${swatch.key}`,
      rect: swatch.rect,
      tag: 'li',
      className: 'swatch',
      tool: 'eyedropper',
      color: readColor(swatch.hex),
    }),
  ),
  {
    id: 'art',
    rect: DEMO_RECTS.art,
    tag: 'img',
    className: 'vaso',
    tool: 'assets',
  },
  {
    id: 'marquee',
    rect: DEMO_RECTS.marquee,
    tag: 'div',
    className: 'marquee',
    tool: 'overflow',
  },
  {
    id: 'paper',
    rect: { x: 0, y: 0, w: DEMO_WIDTH, h: DEMO_HEIGHT },
    tag: 'body',
    tool: 'eyedropper',
    color: readColor(DEMO_COLORS.paper),
  },
];

export const DEMO_TOUR = ['title', 'swatch-clay', 'button', 'art'] as const;

export const INTRO_TARGET = 'button';

export function contrastRatio(foreground: string, background: string): number {
  const luminance = (hex: string) => {
    const [r, g, b] = hexChannels(hex).map(toLinear);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

export function placeRect(rect: DemoRect): string {
  return `left:${(rect.x / DEMO_WIDTH) * 100}%;top:${(rect.y / DEMO_HEIGHT) * 100}%;width:${(rect.w / DEMO_WIDTH) * 100}%;height:${(rect.h / DEMO_HEIGHT) * 100}%`;
}

export function cssShorthand(values: readonly number[]): string {
  const [top, right, bottom, left] = values;
  if (top === bottom && right === left) return top === right ? `${top}` : `${top} ${right}`;
  return right === left ? `${top} ${right} ${bottom}` : values.join(' ');
}

export function boxContentSize(box: BoxReading): string {
  const width = box.width - box.padding[1] - box.padding[3] - box.border * 2;
  const height = box.height - box.padding[0] - box.padding[2] - box.border * 2;
  return `${width} × ${height}`;
}

export function findTarget(id: string): InspectTarget | undefined {
  return DEMO_TARGETS.find((target) => target.id === id);
}
