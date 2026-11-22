import { describe, expect, it } from 'vitest';
import {
  type Color,
  contrastApca,
  contrastWcag,
  formatColor,
  nearestTailwind,
  parseCssColor,
  toHex,
  toHsl,
  toOklch,
  toOklchValues,
  toRgb,
  wcagVerdict,
} from './color';

const parse = (input: string): Color => {
  const color = parseCssColor(input);
  if (!color) throw new Error(`could not parse ${input}`);
  return color;
};

const BLACK = parse('#000');
const WHITE = parse('#fff');

describe('parseCssColor', () => {
  it('reads hex in 3, 4, 6 and 8 digits', () => {
    expect(parse('#f00')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(parse('#0f08').a).toBeCloseTo(0x88 / 255, 5);
    expect(parse('#336699')).toEqual({ r: 51, g: 102, b: 153, a: 1 });
    expect(parse('#33669980').a).toBeCloseTo(128 / 255, 5);
  });

  it('reads rgb in legacy and modern syntax', () => {
    expect(parse('rgb(10, 20, 30)')).toEqual({ r: 10, g: 20, b: 30, a: 1 });
    expect(parse('rgb(10 20 30 / 50%)')).toEqual({ r: 10, g: 20, b: 30, a: 0.5 });
    expect(parse('rgba(255, 255, 255, 0.25)').a).toBe(0.25);
    expect(parse('rgb(100% 0% 0%)')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it('reads hsl, hwb and named colors', () => {
    const green = parse('hsl(120, 100%, 50%)');
    expect(Math.round(green.g)).toBe(255);
    expect(Math.round(green.r)).toBe(0);
    expect(toHex(parse('hsl(0.5turn 100% 50%)'))).toBe('#00ffff');
    expect(toHex(parse('hwb(0 0% 0%)'))).toBe('#ff0000');
    expect(toHex(parse('hwb(0 100% 0%)'))).toBe('#ffffff');
    expect(toHex(parse('rebeccapurple'))).toBe('#663399');
    expect(parse('transparent').a).toBe(0);
  });

  it('reads oklch, oklab, lab and color(srgb)', () => {
    expect(toHex(parse('oklch(62.8% 0.2577 29.23)'))).toBe('#ff0000');
    expect(toHex(parse('oklab(1 0 0)'))).toBe('#ffffff');
    expect(toHex(parse('lab(100 0 0)'))).toBe('#ffffff');
    expect(toHex(parse('lab(0 0 0)'))).toBe('#000000');
    expect(toHex(parse('color(srgb 1 0 0)'))).toBe('#ff0000');
    const lch = parse('lch(54.29 106.84 40.85)');
    expect(Math.round(lch.r)).toBe(255);
    expect(Math.round(lch.g)).toBeLessThan(5);
  });

  it('rejects garbage', () => {
    expect(parseCssColor('')).toBeNull();
    expect(parseCssColor('notacolor')).toBeNull();
    expect(parseCssColor('#12')).toBeNull();
    expect(parseCssColor('rgb(1 2)')).toBeNull();
    expect(parseCssColor('url(x)')).toBeNull();
  });
});

describe('conversions', () => {
  const orange = parse('#ff8800');

  it('writes hex, rgb and hsl', () => {
    expect(toHex(orange)).toBe('#ff8800');
    expect(toRgb(orange)).toBe('rgb(255, 136, 0)');
    expect(toHsl(orange)).toBe('hsl(32, 100%, 50%)');
    expect(toRgb({ ...orange, a: 0.5 })).toBe('rgba(255, 136, 0, 0.5)');
    expect(toHex({ ...orange, a: 0.5 })).toBe('#ff880080');
  });

  it('writes oklch matching the reference for red and white', () => {
    expect(toOklch(parse('#f00'))).toBe('oklch(62.8% 0.258 29.23)');
    expect(toOklch(WHITE)).toBe('oklch(100% 0 0)');
    const { l, c, h } = toOklchValues(parse('#00f'));
    expect(l).toBeCloseTo(0.452, 3);
    expect(c).toBeCloseTo(0.313, 3);
    expect(h).toBeCloseTo(264.05, 1);
  });

  it('round-trips through every format', () => {
    for (const hex of ['#0a84ff', '#7cf29a', '#ff3d7f', '#123456']) {
      const original = parse(hex);
      expect(toHex(parse(formatColor(original, 'rgb')))).toBe(hex);
      for (const format of ['oklch', 'hsl'] as const) {
        const back = parse(formatColor(original, format));
        expect(Math.abs(back.r - original.r)).toBeLessThan(3);
        expect(Math.abs(back.g - original.g)).toBeLessThan(3);
        expect(Math.abs(back.b - original.b)).toBeLessThan(3);
      }
    }
  });
});

describe('contrast', () => {
  it('matches WCAG reference ratios', () => {
    expect(contrastWcag(BLACK, WHITE)).toBeCloseTo(21, 5);
    expect(contrastWcag(WHITE, WHITE)).toBeCloseTo(1, 5);
    expect(contrastWcag(parse('#767676'), WHITE)).toBeCloseTo(4.54, 2);
    expect(contrastWcag(parse('#777'), WHITE)).toBeCloseTo(4.48, 2);
  });

  it('composites translucent text over the background', () => {
    const halfBlack = { ...BLACK, a: 0.5 };
    expect(contrastWcag(halfBlack, WHITE)).toBeCloseTo(contrastWcag(parse('#808080'), WHITE), 1);
  });

  it('classifies ratios', () => {
    expect(wcagVerdict(4.5)).toEqual({ aa: true, aaLarge: true, aaa: false, aaaLarge: true });
    expect(wcagVerdict(3.2)).toEqual({ aa: false, aaLarge: true, aaa: false, aaaLarge: false });
    expect(wcagVerdict(7.1).aaa).toBe(true);
  });

  it('matches APCA reference values', () => {
    expect(contrastApca(BLACK, WHITE)).toBeCloseTo(106.04, 0);
    expect(contrastApca(WHITE, BLACK)).toBeCloseTo(-107.88, 0);
    expect(contrastApca(WHITE, WHITE)).toBe(0);
    expect(Math.abs(contrastApca(parse('#888'), WHITE))).toBeGreaterThan(55);
    expect(Math.abs(contrastApca(parse('#888'), WHITE))).toBeLessThan(65);
  });
});

describe('nearestTailwind', () => {
  it('finds exact palette entries', () => {
    expect(nearestTailwind(parse('oklch(63.7% 0.237 25.331)')).name).toBe('red-500');
    expect(nearestTailwind(parse('oklch(54.6% 0.245 262.881)')).name).toBe('blue-600');
    expect(nearestTailwind(parse('oklch(98.4% 0.003 247.858)')).name).toBe('slate-50');
    expect(nearestTailwind(WHITE).name).toBe('white');
    expect(nearestTailwind(BLACK).name).toBe('black');
  });

  it('returns hex and a small distance for near matches', () => {
    const match = nearestTailwind(parse('#ef4444'));
    expect(match.name).toBe('red-500');
    expect(match.hex).toMatch(/^#[\da-f]{6}$/);
    expect(match.distance).toBeLessThan(3);
  });
});
