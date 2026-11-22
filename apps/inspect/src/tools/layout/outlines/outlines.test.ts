import { describe, expect, it } from 'vitest';
import { buildOutlineCss, depthColor, pickTagLabels } from './outlines';

describe('depthColor', () => {
  it('gives neighbouring depths different hues', () => {
    expect(depthColor(0)).not.toBe(depthColor(1));
    expect(depthColor(1)).toBe('hsl(47 85% 58%)');
  });
});

describe('buildOutlineCss', () => {
  const css = buildOutlineCss('neruz-inspect', 3);

  it('builds one rule per depth plus a catch-all', () => {
    expect(css.split('\n')).toHaveLength(1 + 3 + 1);
  });

  it('never selects the overlay host', () => {
    expect(css).toContain('body > *:not(neruz-inspect) > *:not(neruz-inspect)');
  });

  it('uses important to beat page rules', () => {
    expect(css.split('\n').every((line) => line.includes('!important'))).toBe(true);
  });
});

describe('pickTagLabels', () => {
  const viewport = { width: 1000, height: 800 };
  const at = (tag: string, x: number, y: number, width = 50, height = 50) => ({
    tag,
    rect: { x, y, width, height },
  });

  it('keeps only elements inside the viewport', () => {
    const picked = pickTagLabels(
      [at('a', 10, 10), at('b', -500, 10), at('c', 10, 5000)],
      viewport,
      10,
    );
    expect(picked.map((item) => item.tag)).toEqual(['a']);
  });

  it('skips empty rects and honours the limit', () => {
    const many = Array.from({ length: 20 }, (_, index) => at(`t${index}`, 10, 10));
    expect(pickTagLabels([at('empty', 0, 0, 0, 0), ...many], viewport, 5)).toHaveLength(5);
  });
});
