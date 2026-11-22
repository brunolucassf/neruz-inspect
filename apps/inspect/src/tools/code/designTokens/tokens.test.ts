import { describe, expect, it } from 'vitest';
import {
  buildBreakpoints,
  buildRadii,
  buildTypeScale,
  type DesignTokens,
  extractBreakpoints,
  extractColorTokens,
  normalizeSpacingScale,
  parseBoxShadow,
  splitFontStack,
  toCssVariables,
  toDesignTokensJson,
  toTailwindTheme,
} from './tokens';

describe('normalizeSpacingScale', () => {
  it('snaps close values to the 4px grid and merges their counts', () => {
    const scale = normalizeSpacingScale(
      new Map([
        [15, 3],
        [16, 10],
        [17, 2],
        [8, 5],
        [3, 1],
        [0, 100],
      ]),
    );
    expect(scale).toEqual([
      { name: '1', px: 4, count: 1 },
      { name: '2', px: 8, count: 5 },
      { name: '4', px: 16, count: 15 },
    ]);
  });

  it('keeps only the most used steps, sorted ascending', () => {
    const counts = new Map<number, number>();
    for (let index = 1; index <= 20; index += 1) counts.set(index * 4, index);
    const scale = normalizeSpacingScale(counts, 4, 5);
    expect(scale).toHaveLength(5);
    expect(scale.map((step) => step.px)).toEqual([64, 68, 72, 76, 80]);
  });

  it('turns tiny values into a 2px step and ignores sub-pixel noise', () => {
    expect(
      normalizeSpacingScale(
        new Map([
          [2, 4],
          [0.5, 9],
        ]),
      ),
    ).toEqual([{ name: '0_5', px: 2, count: 4 }]);
  });
});

describe('extractBreakpoints', () => {
  it('reads min/max width in px, em and range syntax', () => {
    expect(extractBreakpoints('(min-width: 768px)')).toEqual([768]);
    expect(extractBreakpoints('screen and (max-width: 48em)')).toEqual([768]);
    expect(extractBreakpoints('(width >= 1024px) and (width < 80rem)')).toEqual([1024, 1280]);
    expect(extractBreakpoints('(prefers-reduced-motion: reduce)')).toEqual([]);
  });

  it('names tailwind-aligned breakpoints', () => {
    const named = buildBreakpoints(
      new Map([
        [768, 4],
        [1024, 3],
        [900, 1],
      ]),
    );
    expect(named.map((item) => item.name)).toEqual(['md', 'bp-900', 'lg']);
  });
});

describe('colors', () => {
  it('merges near colors and names by role', () => {
    const tokens = extractColorTokens([
      { value: 'rgb(255, 255, 255)', text: 0, background: 50, border: 0 },
      { value: 'rgb(254, 254, 254)', text: 0, background: 5, border: 0 },
      { value: 'rgb(17, 17, 17)', text: 40, background: 0, border: 0 },
      { value: 'rgb(229, 229, 229)', text: 0, background: 0, border: 12 },
      { value: 'rgb(37, 99, 235)', text: 6, background: 8, border: 0 },
      { value: 'rgba(0, 0, 0, 0)', text: 0, background: 99, border: 0 },
    ]);
    const byName = Object.fromEntries(tokens.map((item) => [item.name, item.hex]));
    expect(byName.background).toBe('#ffffff');
    expect(byName.text).toBe('#111111');
    expect(byName.border).toBe('#e5e5e5');
    expect(byName.primary).toBe('#2563eb');
    expect(tokens).toHaveLength(4);
  });
});

describe('type and radii', () => {
  it('names the type scale around the base size', () => {
    const scale = buildTypeScale(
      new Map([
        [12, 5],
        [16, 100],
        [20, 10],
        [32, 3],
      ]),
    );
    expect(scale.map((step) => [step.px, step.name])).toEqual([
      [12, 'sm'],
      [16, 'base'],
      [20, 'lg'],
      [32, 'xl'],
    ]);
  });

  it('collapses huge radii into full', () => {
    const radii = buildRadii(
      new Map([
        [4, 3],
        [8, 9],
        [9999, 2],
        [3.35544e7, 1],
      ]),
    );
    expect(radii.map((item) => item.name)).toEqual(['xs', 'sm', 'full']);
  });
});

describe('parsing helpers', () => {
  it('splits font stacks respecting quotes', () => {
    expect(splitFontStack('"Inter Tight", system-ui, \'Helvetica, Neue\', sans-serif')).toEqual([
      'Inter Tight',
      'system-ui',
      'Helvetica, Neue',
      'sans-serif',
    ]);
  });

  it('parses computed box shadows and rejects inset', () => {
    expect(parseBoxShadow('rgba(0, 0, 0, 0.1) 0px 4px 6px -1px')).toEqual([
      { color: '#0000001a', offsetX: '0px', offsetY: '4px', blur: '6px', spread: '-1px' },
    ]);
    expect(
      parseBoxShadow('rgb(0, 0, 0) 0px 1px 2px 0px, rgb(0, 0, 0) 0px 2px 4px 0px'),
    ).toHaveLength(2);
    expect(parseBoxShadow('inset rgb(0, 0, 0) 0px 1px 2px 0px')).toBeNull();
  });
});

describe('exports', () => {
  const tokens: DesignTokens = {
    colors: [{ name: 'primary', hex: '#2563eb', count: 4 }],
    fontFamilies: [{ name: 'sans', stack: 'Inter, sans-serif', count: 9 }],
    typeScale: [{ name: 'base', px: 16, count: 9 }],
    spacing: [{ name: '4', px: 16, count: 9 }],
    radii: [{ name: 'md', px: 8, count: 2 }],
    shadows: [{ name: 'sm', value: 'rgba(0, 0, 0, 0.1) 0px 1px 2px 0px', count: 1 }],
    breakpoints: [{ name: 'md', px: 768, count: 2 }],
    containers: [{ name: 'lg', px: 1200, count: 1 }],
  };

  it('writes css variables and a tailwind v4 theme', () => {
    const css = toCssVariables(tokens);
    expect(css.startsWith(':root {')).toBe(true);
    expect(css).toContain('--color-primary: #2563eb;');
    expect(css).toContain('--font-sans: Inter, sans-serif;');
    expect(css).toContain('--spacing-4: 16px;');
    expect(toTailwindTheme(tokens).startsWith('@theme {')).toBe(true);
  });

  it('writes W3C design tokens json', () => {
    const json = JSON.parse(toDesignTokensJson(tokens));
    expect(json.color.primary).toEqual({ $type: 'color', $value: '#2563eb' });
    expect(json.fontFamily.sans.$value).toEqual(['Inter', 'sans-serif']);
    expect(json.spacing['4']).toEqual({ $type: 'dimension', $value: '16px' });
    expect(json.shadow.sm.$type).toBe('shadow');
    expect(json.shadow.sm.$value.blur).toBe('2px');
  });
});
