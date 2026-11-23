import { describe, expect, it } from 'vitest';
import {
  buildQuickTable,
  convertAll,
  formatNumber,
  formatWithUnit,
  fromPx,
  parseInputNumber,
  toPx,
  type UnitContext,
} from './units';

const context: UnitContext = { rootPx: 16, emPx: 20, viewportWidth: 1280, viewportHeight: 720 };

describe('toPx', () => {
  it('converts every unit with the configured bases', () => {
    expect(toPx(10, 'px', context)).toBe(10);
    expect(toPx(2, 'rem', context)).toBe(32);
    expect(toPx(2, 'em', context)).toBe(40);
    expect(toPx(12, 'pt', context)).toBe(16);
    expect(toPx(50, 'vw', context)).toBe(640);
    expect(toPx(50, 'vh', context)).toBe(360);
    expect(toPx(150, '%', context)).toBe(30);
  });
});

describe('fromPx', () => {
  it('is the inverse of toPx', () => {
    for (const unit of ['px', 'rem', 'em', 'pt', 'vw', 'vh', '%'] as const) {
      expect(fromPx(toPx(7.5, unit, context), unit, context)).toBeCloseTo(7.5, 10);
    }
  });

  it('returns NaN instead of dividing by a zero base', () => {
    const broken: UnitContext = { rootPx: 0, emPx: 0, viewportWidth: 0, viewportHeight: 0 };
    expect(fromPx(10, 'rem', broken)).toBeNaN();
    expect(fromPx(10, 'vw', broken)).toBeNaN();
    expect(fromPx(10, 'pt', broken)).toBe(7.5);
  });
});

describe('convertAll', () => {
  it('returns every unit for 1rem at a 16px root', () => {
    const result = convertAll(1, 'rem', context);
    expect(result.px).toBe(16);
    expect(result.rem).toBe(1);
    expect(result.em).toBe(0.8);
    expect(result.pt).toBe(12);
    expect(result.vw).toBeCloseTo(1.25, 10);
    expect(result['%']).toBe(80);
  });
});

describe('formatting and parsing', () => {
  it('trims decimals and handles non finite values', () => {
    expect(formatNumber(0.123456)).toBe('0.1235');
    expect(formatNumber(2)).toBe('2');
    expect(formatNumber(-0.00001)).toBe('0');
    expect(formatNumber(Number.NaN)).toBe('—');
    expect(formatWithUnit(1.5, 'rem')).toBe('1.5rem');
    expect(formatWithUnit(12.3456, 'pt', 2)).toBe('12.35pt');
  });

  it('accepts comma decimals and rejects junk', () => {
    expect(parseInputNumber('1,5')).toBe(1.5);
    expect(parseInputNumber(' 24 ')).toBe(24);
    expect(parseInputNumber('')).toBeNull();
    expect(parseInputNumber('abc')).toBeNull();
  });
});

describe('buildQuickTable', () => {
  it('lists common pixel sizes in rem, em, pt and vw', () => {
    const table = buildQuickTable({
      rootPx: 16,
      emPx: 16,
      viewportWidth: 1000,
      viewportHeight: 800,
    });
    const row16 = table.find((row) => row.px === 16);
    expect(row16?.values.rem).toBe(1);
    expect(row16?.values.em).toBe(1);
    expect(row16?.values.pt).toBe(12);
    expect(row16?.values.vw).toBe(1.6);
    expect(table.length).toBeGreaterThan(10);
  });
});
