import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  camelToKebab,
  convertPxValues,
  formatLength,
  getComputedSubset,
  parsePx,
  toCssText,
  toTailwindClasses,
} from './css';

describe('camelToKebab', () => {
  it('converts camelCase property names', () => {
    expect(camelToKebab('backgroundColor')).toBe('background-color');
    expect(camelToKebab('color')).toBe('color');
    expect(camelToKebab('border-top-width')).toBe('border-top-width');
  });
});

describe('getComputedSubset', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads only the requested properties with kebab-case keys', () => {
    const values: Record<string, string> = { 'font-size': ' 16px ', color: 'rgb(0, 0, 0)' };
    vi.stubGlobal('getComputedStyle', () => ({
      getPropertyValue: (name: string) => values[name] ?? '',
    }));
    expect(getComputedSubset({} as Element, ['fontSize', 'color', 'margin'])).toEqual({
      'font-size': '16px',
      color: 'rgb(0, 0, 0)',
      margin: '',
    });
  });
});

describe('toCssText', () => {
  it('writes declarations and skips empty values', () => {
    expect(toCssText({ color: 'red', margin: '', display: 'flex' })).toBe(
      'color: red;\ndisplay: flex;',
    );
  });

  it('wraps declarations in a selector block', () => {
    expect(toCssText({ color: 'red' }, { selector: '.a' })).toBe('.a {\n  color: red;\n}');
  });
});

describe('lengths', () => {
  it('parses px values and ignores junk', () => {
    expect(parsePx('12.5px')).toBe(12.5);
    expect(parsePx('auto')).toBe(0);
    expect(parsePx(undefined)).toBe(0);
  });

  it('formats px and rem with base 16', () => {
    expect(formatLength(24, 'px')).toBe('24px');
    expect(formatLength(24, 'rem')).toBe('1.5rem');
    expect(formatLength(10, 'rem')).toBe('0.625rem');
    expect(formatLength(13.3333, 'px')).toBe('13.33px');
  });
});

describe('toTailwindClasses', () => {
  it('maps layout, spacing and typography', () => {
    const classes = toTailwindClasses({
      display: 'flex',
      'flex-direction': 'column',
      'justify-content': 'space-between',
      'padding-top': '16px',
      'padding-right': '24px',
      'padding-bottom': '16px',
      'padding-left': '24px',
      'margin-top': '0px',
      'margin-right': '0px',
      'margin-bottom': '0px',
      'margin-left': '0px',
      'font-size': '14px',
      'font-weight': '600',
      'border-top-left-radius': '8px',
      'border-top-right-radius': '8px',
      'border-bottom-right-radius': '8px',
      'border-bottom-left-radius': '8px',
    }).split(' ');
    expect(classes).toEqual(
      expect.arrayContaining([
        'flex',
        'flex-col',
        'justify-between',
        'px-6',
        'py-4',
        'text-sm',
        'font-semibold',
        'rounded-lg',
      ]),
    );
    expect(classes.some((name) => name.startsWith('m'))).toBe(false);
  });

  it('uses the nearest palette color and arbitrary values as fallback', () => {
    const classes = toTailwindClasses({
      color: 'oklch(63.7% 0.237 25.331)',
      'background-color': '#123457',
      'font-size': '13px',
      'padding-top': '13px',
      'padding-right': '13px',
      'padding-bottom': '13px',
      'padding-left': '13px',
    }).split(' ');
    expect(classes).toContain('text-red-500');
    expect(classes).toContain('bg-[#123457]');
    expect(classes).toContain('text-[13px]');
    expect(classes).toContain('p-[13px]');
  });

  it('skips transparent backgrounds and zero borders', () => {
    expect(
      toTailwindClasses({
        'background-color': 'rgba(0, 0, 0, 0)',
        'border-top-width': '0px',
        'border-right-width': '0px',
        'border-bottom-width': '0px',
        'border-left-width': '0px',
      }),
    ).toBe('');
  });
});

describe('convertPxValues', () => {
  it('rewrites every px token and leaves other units alone', () => {
    expect(convertPxValues('8px 16px 50%', 'rem')).toBe('0.5rem 1rem 50%');
    expect(convertPxValues('8px 16px', 'px')).toBe('8px 16px');
  });
});
