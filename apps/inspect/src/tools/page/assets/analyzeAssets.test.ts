import { describe, expect, it } from 'vitest';
import { type AssessInput, assessImage, bytesFromTiming, detectFormat } from './analyzeAssets';

const input = (overrides: Partial<AssessInput> = {}): AssessInput => ({
  category: 'image',
  isImgElement: true,
  format: 'webp',
  naturalWidth: 400,
  naturalHeight: 300,
  displayWidth: 400,
  displayHeight: 300,
  devicePixelRatio: 1,
  bytes: 20_000,
  hasDimensionAttributes: true,
  loading: 'lazy',
  aboveFold: false,
  alt: 'photo',
  ...overrides,
});

const ids = (overrides: Partial<AssessInput>) => assessImage(input(overrides)).map((a) => a.id);

describe('assessImage', () => {
  it('is quiet for a healthy image', () => {
    expect(ids({})).toEqual([]);
  });

  it('flags images much larger than displayed, accounting for pixel ratio', () => {
    expect(ids({ naturalWidth: 1600, naturalHeight: 1200 })).toContain('oversized');
    expect(ids({ naturalWidth: 700, devicePixelRatio: 2 })).not.toContain('oversized');
  });

  it('flags missing dimensions, lazy and alt only on img elements', () => {
    expect(ids({ hasDimensionAttributes: false })).toContain('noDimensions');
    expect(ids({ loading: '', aboveFold: false })).toContain('noLazy');
    expect(ids({ loading: '', aboveFold: true })).not.toContain('noLazy');
    expect(ids({ alt: null })).toContain('noAlt');
    expect(ids({ alt: '' })).not.toContain('noAlt');
    expect(ids({ isImgElement: false, alt: null, hasDimensionAttributes: false })).toEqual([]);
  });

  it('suggests modern formats for heavier legacy files', () => {
    expect(ids({ format: 'jpeg', bytes: 80_000 })).toContain('legacyFormat');
    expect(ids({ format: 'png', bytes: 2_000 })).not.toContain('legacyFormat');
    expect(ids({ format: 'avif', bytes: 80_000 })).not.toContain('legacyFormat');
  });

  it('flags heavy files', () => {
    expect(ids({ bytes: 700_000 })).toContain('heavy');
  });

  it('never calls an svg oversized or legacy', () => {
    expect(ids({ format: 'svg', category: 'svg', naturalWidth: 5000 })).toEqual([]);
  });
});

describe('detectFormat', () => {
  it('reads extension, data uri and mime', () => {
    expect(detectFormat('https://a.test/x/photo.JPG?v=2')).toBe('jpeg');
    expect(detectFormat('data:image/svg+xml;base64,AAA')).toBe('svg');
    expect(detectFormat('https://a.test/img', 'image/avif')).toBe('avif');
    expect(detectFormat('https://a.test/noext')).toBe('unknown');
  });
});

describe('bytesFromTiming', () => {
  it('prefers transfer size and treats zero as unknown', () => {
    expect(bytesFromTiming({ transferSize: 1200, encodedBodySize: 1000 })).toBe(1200);
    expect(bytesFromTiming({ transferSize: 0, encodedBodySize: 900 })).toBe(900);
    expect(bytesFromTiming({ transferSize: 0, encodedBodySize: 0 })).toBeNull();
  });
});
