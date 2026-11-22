import { describe, expect, it } from 'vitest';
import {
  centerLeft,
  clampDimension,
  clampOpacity,
  DEFAULT_OPACITY,
  isImageFile,
  scaleByFactor,
  scaleToWidth,
} from './figma';

describe('figma helpers', () => {
  it('clamps opacity to 0..100', () => {
    expect(clampOpacity(150)).toBe(100);
    expect(clampOpacity(-4)).toBe(0);
    expect(clampOpacity(Number.NaN)).toBe(DEFAULT_OPACITY);
  });

  it('keeps the aspect ratio when fitting to a width', () => {
    expect(scaleToWidth({ width: 2000, height: 1000 }, 500)).toEqual({ width: 500, height: 250 });
  });

  it('scales by factor', () => {
    expect(scaleByFactor({ width: 800, height: 600 }, 0.5)).toEqual({ width: 400, height: 300 });
  });

  it('centres horizontally, allowing negative offsets', () => {
    expect(centerLeft(400, 1000)).toBe(300);
    expect(centerLeft(1200, 1000)).toBe(-100);
  });

  it('accepts only image files', () => {
    expect(isImageFile({ type: 'image/png' })).toBe(true);
    expect(isImageFile({ type: 'application/pdf' })).toBe(false);
  });

  it('guards invalid dimensions', () => {
    expect(clampDimension(0, 10)).toBe(10);
    expect(clampDimension(99999, 10)).toBe(20000);
    expect(clampDimension(320, 10)).toBe(320);
  });
});
