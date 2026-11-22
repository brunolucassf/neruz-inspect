import { describe, expect, it } from 'vitest';
import { buildSelector, isStableClass, isStableId, type SelectorNode } from './selector';

const node = (tag: string, options: Partial<SelectorNode> = {}): SelectorNode => ({
  tag,
  id: '',
  classes: [],
  index: 1,
  siblingsWithSameTag: 1,
  parent: null,
  ...options,
});

describe('stability heuristics', () => {
  it('rejects generated class names and ids', () => {
    expect(isStableClass('card-title')).toBe(true);
    expect(isStableClass('css-1x2y3z4')).toBe(false);
    expect(isStableClass('sc-a1b2c3')).toBe(false);
    expect(isStableClass('hover:bg-red')).toBe(false);
    expect(isStableId('hero')).toBe(true);
    expect(isStableId(':r1:')).toBe(false);
    expect(isStableId('a1b2c3d4e5')).toBe(false);
  });
});

describe('buildSelector', () => {
  it('prefers a unique stable id', () => {
    const target = node('div', { id: 'hero', classes: ['x'] });
    expect(buildSelector(target, (selector) => selector === '#hero')).toBe('#hero');
  });

  it('uses tag and stable classes when unique', () => {
    const target = node('button', { classes: ['btn', 'css-9a8b7c6'] });
    expect(buildSelector(target, (selector) => selector === 'button.btn')).toBe('button.btn');
  });

  it('climbs parents and adds nth-of-type until unique', () => {
    const parent = node('ul', { classes: ['menu'] });
    const target = node('li', { parent, index: 2, siblingsWithSameTag: 3 });
    const known = new Set(['ul.menu > li:nth-of-type(2)']);
    expect(buildSelector(target, (selector) => known.has(selector))).toBe(
      'ul.menu > li:nth-of-type(2)',
    );
  });

  it('anchors on an ancestor id', () => {
    const root = node('section', { id: 'pricing' });
    const target = node('p', { parent: root, index: 1, siblingsWithSameTag: 2 });
    const known = new Set(['#pricing', '#pricing > p:nth-of-type(1)']);
    expect(buildSelector(target, (selector) => known.has(selector))).toBe(
      '#pricing > p:nth-of-type(1)',
    );
  });
});
