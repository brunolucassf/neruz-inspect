import { describe, expect, it } from 'vitest';
import { type Color, contrastWcag, parseCssColor, toHex } from '../../lib/color';
import { getVisionMatrix, matrixToAttribute, VISION_MODES } from './colorblind/colorblind';
import { flattenBackgroundLayers, isLargeText, suggestPassingColor } from './contrast/contrast';
import { pushRecentColor } from './eyedropper/recentColors';
import {
  filterToTailwind,
  gradientToTailwind,
  shadowToTailwind,
  splitTopLevel,
} from './gradientShadow/effects';
import { buildPaletteExport, extractGradientColors, nameColors } from './palette/palette';
import {
  buildColorScale,
  buildHarmonies,
  groupSimilarColors,
  SCALE_STEPS,
} from './shared/colorMath';

const parse = (input: string): Color => {
  const color = parseCssColor(input);
  if (!color) throw new Error(`could not parse ${input}`);
  return color;
};

describe('groupSimilarColors', () => {
  it('merges near-identical colors and sums their counts', () => {
    const groups = groupSimilarColors([
      { color: parse('#3366ff'), count: 5 },
      { color: parse('#3467ff'), count: 2 },
      { color: parse('#ff0000'), count: 4 },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.count).toBe(7);
    expect(groups[0]?.hex).toBe('#3366ff');
    expect(groups[0]?.hexes).toEqual(['#3366ff', '#3467ff']);
    expect(groups[1]?.hex).toBe('#ff0000');
  });

  it('keeps distinct colors apart and sorts by usage', () => {
    const groups = groupSimilarColors([
      { color: parse('#000000'), count: 1 },
      { color: parse('#ffffff'), count: 9 },
    ]);
    expect(groups.map((group) => group.hex)).toEqual(['#ffffff', '#000000']);
  });

  it('sums repeated hex values before grouping', () => {
    const groups = groupSimilarColors([
      { color: parse('#112233'), count: 1 },
      { color: parse('#112233'), count: 3 },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.count).toBe(4);
  });

  it('treats different opacity as a different color', () => {
    const groups = groupSimilarColors([
      { color: parse('#000000'), count: 1 },
      { color: parse('rgba(0, 0, 0, 0.4)'), count: 1 },
    ]);
    expect(groups).toHaveLength(2);
  });
});

describe('harmonies and scale', () => {
  it('builds complementary, analogous and triadic sets', () => {
    const harmonies = buildHarmonies(parse('#3366ff'));
    expect(harmonies.map((harmony) => harmony.colors.length)).toEqual([2, 3, 3]);
    expect(harmonies[0]?.colors[0] && toHex(harmonies[0].colors[0])).toBe('#3366ff');
  });

  it('builds a 50-950 scale that darkens monotonically', () => {
    const scale = buildColorScale(parse('#3366ff'));
    expect(scale.map((item) => item.step)).toEqual([...SCALE_STEPS]);
    const luminance = scale.map(
      ({ color }) => color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722,
    );
    for (let index = 1; index < luminance.length; index += 1) {
      expect(luminance[index] ?? 0).toBeLessThan(luminance[index - 1] ?? 0);
    }
  });
});

describe('contrast helpers', () => {
  it('composes translucent layers over an opaque one', () => {
    const flat = flattenBackgroundLayers([parse('rgba(0, 0, 0, 0.5)'), parse('#ffffff')]);
    expect(Math.round(flat.r)).toBe(128);
    expect(flat.a).toBe(1);
  });

  it('falls back to white when there is no background', () => {
    expect(toHex(flattenBackgroundLayers([]))).toBe('#ffffff');
  });

  it('finds a passing color close to the original', () => {
    const background = parse('#ffffff');
    const suggestion = suggestPassingColor(parse('#999999'), background, 4.5);
    expect(suggestion).not.toBeNull();
    if (suggestion) expect(contrastWcag(suggestion, background)).toBeGreaterThanOrEqual(4.5);
  });

  it('returns the same color when it already passes', () => {
    const color = parse('#000000');
    expect(suggestPassingColor(color, parse('#ffffff'))).toBe(color);
  });

  it('classifies large text', () => {
    expect(isLargeText(24, 400)).toBe(true);
    expect(isLargeText(19, 700)).toBe(true);
    expect(isLargeText(16, 700)).toBe(false);
  });
});

describe('vision matrices', () => {
  it('returns 20 values for every color mode and none for blur', () => {
    for (const mode of VISION_MODES) {
      const matrix = getVisionMatrix(mode);
      if (mode === 'blur') expect(matrix).toBeNull();
      else expect(matrix).toHaveLength(20);
    }
  });

  it('keeps white as white for dichromacy matrices', () => {
    for (const mode of ['protanopia', 'deuteranopia', 'tritanopia'] as const) {
      const matrix = getVisionMatrix(mode) ?? [];
      for (let row = 0; row < 3; row += 1) {
        const sum =
          (matrix[row * 5] ?? 0) + (matrix[row * 5 + 1] ?? 0) + (matrix[row * 5 + 2] ?? 0);
        expect(sum).toBeCloseTo(1, 3);
      }
    }
  });

  it('makes achromatopsia rows identical and leaves alpha alone', () => {
    const matrix = getVisionMatrix('achromatopsia') ?? [];
    expect(matrix.slice(0, 5)).toEqual(matrix.slice(5, 10));
    expect(matrix.slice(15)).toEqual([0, 0, 0, 1, 0]);
    expect(matrixToAttribute(matrix.slice(15))).toBe('0 0 0 1 0');
  });
});

describe('gradient and shadow helpers', () => {
  it('splits only on top-level commas', () => {
    expect(splitTopLevel('rgb(0, 0, 0) 0px 1px, rgb(1, 2, 3) 0px 2px')).toEqual([
      'rgb(0, 0, 0) 0px 1px',
      'rgb(1, 2, 3) 0px 2px',
    ]);
  });

  it('moves the shadow color last for Tailwind', () => {
    expect(shadowToTailwind(['rgba(0, 0, 0, 0.1) 0px 4px 6px -1px'], 'box')).toBe(
      'shadow-[0px_4px_6px_-1px_rgba(0,_0,_0,_0.1)]',
    );
  });

  it('maps simple linear gradients to Tailwind utilities', () => {
    expect(gradientToTailwind('linear-gradient(90deg, rgb(255, 0, 0), rgb(0, 0, 255))')).toBe(
      'bg-linear-to-r from-[#ff0000] to-[#0000ff]',
    );
  });

  it('falls back to an arbitrary value for complex gradients', () => {
    expect(gradientToTailwind('radial-gradient(circle, rgb(0, 0, 0), rgb(1, 1, 1))')).toMatch(
      /^bg-\[radial-gradient/,
    );
  });

  it('maps filter functions to Tailwind utilities', () => {
    expect(filterToTailwind('blur(4px) brightness(1.2)')).toBe('blur-[4px] brightness-[1.2]');
  });

  it('extracts colors from gradients', () => {
    expect(
      extractGradientColors('linear-gradient(rgb(255, 0, 0), rgba(0, 0, 255, 0.5))'),
    ).toHaveLength(2);
    expect(extractGradientColors('none')).toEqual([]);
  });
});

describe('palette and recent colors', () => {
  it('names colors uniquely', () => {
    const names = nameColors(['#ffffff', '#fefefe', '#123456']);
    expect(new Set(names).size).toBe(names.length);
  });

  it('exports css, tailwind and json', () => {
    expect(buildPaletteExport(['#ff0000'], 'css')).toMatch(/^:root \{/);
    expect(buildPaletteExport(['#ff0000'], 'tailwind')).toMatch(/^@theme \{/);
    expect(JSON.parse(buildPaletteExport(['#ff0000'], 'json'))).toBeTypeOf('object');
  });

  it('keeps recent colors unique, newest first and capped', () => {
    expect(pushRecentColor(['#111111', '#222222'], '#222222')).toEqual(['#222222', '#111111']);
    expect(pushRecentColor(['#111111', '#222222'], '#333333', 2)).toEqual(['#333333', '#111111']);
  });
});
