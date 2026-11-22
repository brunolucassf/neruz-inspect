import { describe, expect, it } from 'vitest';
import {
  collapseShorthands,
  diffComputed,
  hoverSubjectSelectors,
  styleMapToCss,
  toCamelCase,
} from './styleDiff';

describe('diffComputed', () => {
  it('drops defaults and inherited values equal to the parent', () => {
    const result = diffComputed({
      computed: {
        display: 'flex',
        color: 'rgb(0, 0, 0)',
        'font-size': '16px',
        'padding-top': '8px',
        'padding-right': '8px',
        'padding-bottom': '8px',
        'padding-left': '8px',
        'margin-top': '0px',
        width: '300px',
      },
      defaults: {
        display: 'block',
        color: 'rgb(0, 0, 0)',
        'padding-top': '0px',
        'margin-top': '0px',
      },
      parent: { color: 'rgb(0, 0, 0)', 'font-size': '16px' },
      authored: new Set(),
    });
    expect(result).toEqual({
      display: 'flex',
      'padding-top': '8px',
      'padding-right': '8px',
      'padding-bottom': '8px',
      'padding-left': '8px',
    });
  });

  it('keeps inherited values that differ from the parent and authored sizes', () => {
    const result = diffComputed({
      computed: { color: 'rgb(255, 0, 0)', width: '300px', height: 'auto' },
      defaults: {},
      parent: { color: 'rgb(0, 0, 0)' },
      authored: new Set(['width', 'height']),
    });
    expect(result).toEqual({ color: 'rgb(255, 0, 0)', width: '300px' });
  });

  it('removes hidden border sides', () => {
    const none = {
      'border-right-style': 'none',
      'border-bottom-style': 'none',
      'border-left-style': 'none',
    };
    const result = diffComputed({
      computed: {
        'border-top-style': 'solid',
        'border-top-width': '1px',
        'border-top-color': 'rgb(1, 2, 3)',
        'border-right-width': '0px',
        'border-bottom-width': '0px',
        'border-left-width': '0px',
        ...none,
      },
      defaults: { 'border-top-style': 'none', ...none },
      parent: null,
      authored: new Set(),
    });
    expect(Object.keys(result).sort()).toEqual([
      'border-top-color',
      'border-top-style',
      'border-top-width',
    ]);
  });
});

describe('collapseShorthands', () => {
  it('collapses equal and paired edges', () => {
    expect(
      collapseShorthands({
        'padding-top': '8px',
        'padding-right': '16px',
        'padding-bottom': '8px',
        'padding-left': '16px',
        'margin-top': '0px',
        'margin-right': '0px',
        'margin-bottom': '0px',
        'margin-left': '0px',
      }),
    ).toEqual({ padding: '8px 16px', margin: '0px' });
  });

  it('builds a border shorthand and gap', () => {
    const sides = ['top', 'right', 'bottom', 'left'];
    const input: Record<string, string> = { 'row-gap': '8px', 'column-gap': '16px' };
    for (const side of sides) {
      input[`border-${side}-width`] = '1px';
      input[`border-${side}-style`] = 'solid';
      input[`border-${side}-color`] = 'rgb(1, 2, 3)';
    }
    const result = collapseShorthands(input);
    expect(result.border).toBe('1px solid rgb(1, 2, 3)');
    expect(result.gap).toBe('8px 16px');
  });
});

describe('helpers', () => {
  it('renders css text and camel case', () => {
    expect(styleMapToCss({ display: 'flex' }, '.a')).toBe('.a {\n  display: flex;\n}');
    expect(toCamelCase('background-color')).toBe('backgroundColor');
    expect(toCamelCase('--brand-color')).toBe('--brand-color');
  });

  it('finds hover subjects only on the last compound', () => {
    expect(hoverSubjectSelectors('a:hover, .btn:hover')).toEqual(['a', '.btn']);
    expect(hoverSubjectSelectors('.card:hover .title')).toEqual([]);
    expect(hoverSubjectSelectors('.card:hover > .title:hover')).toEqual(['.card > .title']);
    expect(hoverSubjectSelectors('.a')).toEqual([]);
  });
});
