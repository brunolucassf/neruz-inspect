import { type Color, nearestTailwind, parseCssColor, toHex } from '../../../lib/color';
import { type ColorCluster, groupSimilarColors } from '../shared/colorMath';
import { hasOwnText } from '../shared/scan';

export type ColorRole = 'text' | 'background' | 'border' | 'fill' | 'stroke' | 'gradient';

export type PaletteEntry = ColorCluster & { elements: Element[]; roles: ColorRole[] };

export type ExportFormat = 'css' | 'tailwind' | 'json';

const GRADIENT_COLOR_PATTERN =
  /(?:rgba?|hsla?|hwb|oklab|oklch|lab|lch|color)\([^()]*\)|#[\da-f]{8}\b|#[\da-f]{6}\b|#[\da-f]{3,4}\b/gi;

const SHAPE_TAGS = new Set([
  'path',
  'circle',
  'rect',
  'ellipse',
  'polygon',
  'polyline',
  'line',
  'text',
  'tspan',
]);

const BORDER_SIDES = ['top', 'right', 'bottom', 'left'] as const;

const MAX_ELEMENTS_PER_COLOR = 200;

export const extractGradientColors = (value: string): Color[] => {
  if (!value.includes('gradient(')) return [];
  const found: Color[] = [];
  for (const token of value.match(GRADIENT_COLOR_PATTERN) ?? []) {
    const color = parseCssColor(token);
    if (color && color.a > 0) found.push(color);
  }
  return found;
};

export type ElementColor = { color: Color; role: ColorRole };

export const readElementColors = (element: Element, style: CSSStyleDeclaration): ElementColor[] => {
  const found: ElementColor[] = [];
  const push = (value: string, role: ColorRole): void => {
    const color = parseCssColor(value);
    if (color && color.a > 0) found.push({ color, role });
  };

  if (element instanceof SVGElement) {
    if (!SHAPE_TAGS.has(element.localName)) return found;
    if (style.fill !== 'none') push(style.fill, 'fill');
    if (style.stroke !== 'none') push(style.stroke, 'stroke');
    return found;
  }

  if (hasOwnText(element)) push(style.color, 'text');
  push(style.backgroundColor, 'background');

  const borderColors = new Set<string>();
  for (const side of BORDER_SIDES) {
    const borderStyle = style.getPropertyValue(`border-${side}-style`);
    const width = Number.parseFloat(style.getPropertyValue(`border-${side}-width`));
    if (borderStyle === 'none' || borderStyle === 'hidden' || !(width > 0)) continue;
    borderColors.add(style.getPropertyValue(`border-${side}-color`));
  }
  for (const value of borderColors) push(value, 'border');

  for (const color of extractGradientColors(style.backgroundImage)) {
    found.push({ color, role: 'gradient' });
  }
  return found;
};

export class PaletteCollector {
  private readonly byHex = new Map<
    string,
    { color: Color; count: number; elements: Element[]; roles: Set<ColorRole> }
  >();

  add(element: Element, style: CSSStyleDeclaration): void {
    for (const { color, role } of readElementColors(element, style)) {
      const hex = toHex(color);
      const entry = this.byHex.get(hex) ?? { color, count: 0, elements: [], roles: new Set() };
      entry.count += 1;
      entry.roles.add(role);
      if (entry.elements.length < MAX_ELEMENTS_PER_COLOR && !entry.elements.includes(element)) {
        entry.elements.push(element);
      }
      this.byHex.set(hex, entry);
    }
  }

  build(): PaletteEntry[] {
    const clusters = groupSimilarColors(
      [...this.byHex.values()].map(({ color, count }) => ({ color, count })),
    );
    return clusters.map((cluster) => {
      const elements: Element[] = [];
      const roles = new Set<ColorRole>();
      for (const hex of cluster.hexes) {
        const entry = this.byHex.get(hex);
        if (!entry) continue;
        for (const element of entry.elements)
          if (!elements.includes(element)) elements.push(element);
        for (const role of entry.roles) roles.add(role);
      }
      return { ...cluster, elements, roles: [...roles] };
    });
  }
}

export const nameColors = (hexes: readonly string[]): string[] => {
  const used = new Set<string>();
  return hexes.map((hex, index) => {
    const color = parseCssColor(hex);
    const match = color ? nearestTailwind(color) : null;
    let name = match && match.distance < 2.5 ? match.name : `color-${index + 1}`;
    if (used.has(name)) name = `${name}-${index + 1}`;
    used.add(name);
    return name;
  });
};

export const buildPaletteExport = (hexes: readonly string[], format: ExportFormat): string => {
  const names = nameColors(hexes);
  const pairs = hexes.map((hex, index) => [names[index] ?? `color-${index + 1}`, hex] as const);
  switch (format) {
    case 'css':
      return `:root {\n${pairs.map(([name, hex]) => `  --color-${name}: ${hex};`).join('\n')}\n}`;
    case 'tailwind':
      return `@theme {\n${pairs.map(([name, hex]) => `  --color-${name}: ${hex};`).join('\n')}\n}`;
    case 'json':
      return JSON.stringify(Object.fromEntries(pairs), null, 2);
  }
};
