import {
  type Color,
  compositeOver,
  contrastWcag,
  parseCssColor,
  toOklchValues,
} from '../../../lib/color';
import { colorFromOklch } from '../shared/colorMath';

const OPAQUE_THRESHOLD = 0.999;
const LIGHTNESS_STEP = 0.005;
const MAX_SEARCH_STEPS = 200;

export const WCAG_AA_NORMAL = 4.5;
export const WCAG_AA_LARGE = 3;

export const flattenBackgroundLayers = (layers: readonly Color[]): Color => {
  let result: Color | null = null;
  for (const layer of layers) {
    result = result ? compositeOver(result, layer) : layer;
    if (result.a >= OPAQUE_THRESHOLD) break;
  }
  const base = result ?? { r: 255, g: 255, b: 255, a: 1 };
  return base.a >= OPAQUE_THRESHOLD
    ? { ...base, a: 1 }
    : compositeOver(base, { r: 255, g: 255, b: 255, a: 1 });
};

export const isLargeText = (fontSizePx: number, fontWeight: number): boolean =>
  fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeight >= 700);

export const requiredAaRatio = (large: boolean): number => (large ? WCAG_AA_LARGE : WCAG_AA_NORMAL);

export const suggestPassingColor = (
  foreground: Color,
  background: Color,
  target: number = WCAG_AA_NORMAL,
): Color | null => {
  if (contrastWcag(foreground, background) >= target) return foreground;
  const { l, c, h } = toOklchValues(foreground);
  let best: { color: Color; steps: number } | null = null;
  for (const direction of [-1, 1]) {
    for (let step = 1; step <= MAX_SEARCH_STEPS; step += 1) {
      const lightness = l + direction * step * LIGHTNESS_STEP;
      if (lightness < 0 || lightness > 1) break;
      const candidate = colorFromOklch(lightness, c, h);
      if (contrastWcag(candidate, background) >= target) {
        if (!best || step < best.steps) best = { color: candidate, steps: step };
        break;
      }
    }
  }
  return best?.color ?? null;
};

export type EffectiveBackground = { color: Color; uncertain: boolean };

export const readEffectiveBackground = (element: Element): EffectiveBackground => {
  const layers: Color[] = [];
  let uncertain = false;
  let current: Element | null = element;
  while (current) {
    const style = getComputedStyle(current);
    const layer = parseCssColor(style.backgroundColor);
    if (style.backgroundImage !== 'none') uncertain = true;
    if (layer && layer.a > 0) {
      layers.push(layer);
      if (layer.a >= OPAQUE_THRESHOLD) break;
    }
    current = current.parentElement;
  }
  return { color: flattenBackgroundLayers(layers), uncertain };
};
