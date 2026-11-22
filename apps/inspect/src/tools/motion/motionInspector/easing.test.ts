import { describe, expect, it } from 'vitest';
import { buildCurveGeometry, easingValueAt, formatDuration, parseEasing } from './easing';

describe('parseEasing', () => {
  it('reads cubic-bezier with spaces and decimals', () => {
    expect(parseEasing('cubic-bezier(0.4, 0, 0.2, 1)')).toEqual({
      kind: 'bezier',
      x1: 0.4,
      y1: 0,
      x2: 0.2,
      y2: 1,
    });
    expect(parseEasing('cubic-bezier(.25,.1,.25,1)')).toMatchObject({ kind: 'bezier', x1: 0.25 });
  });

  it('keeps overshoot on the y axis', () => {
    expect(parseEasing('cubic-bezier(0.34, 1.56, 0.64, 1)')).toMatchObject({ y1: 1.56 });
  });

  it('maps keywords', () => {
    expect(parseEasing('ease-in-out')).toMatchObject({ kind: 'bezier', x1: 0.42, x2: 0.58 });
    expect(parseEasing('linear')).toEqual({ kind: 'linear' });
    expect(parseEasing('step-end')).toEqual({ kind: 'steps', count: 1, position: 'end' });
  });

  it('parses steps with and without position', () => {
    expect(parseEasing('steps(4, jump-start)')).toEqual({
      kind: 'steps',
      count: 4,
      position: 'start',
    });
    expect(parseEasing('steps(3)')).toEqual({ kind: 'steps', count: 3, position: 'end' });
  });

  it('falls back to linear for invalid input', () => {
    expect(parseEasing('cubic-bezier(2, 0, 0.5, 1)')).toEqual({ kind: 'linear' });
    expect(parseEasing('linear(0, 0.5 40%, 1)')).toEqual({ kind: 'linear' });
    expect(parseEasing('nonsense')).toEqual({ kind: 'linear' });
  });
});

describe('easingValueAt', () => {
  it('hits the endpoints and is symmetric for ease-in-out', () => {
    const spec = parseEasing('ease-in-out');
    expect(easingValueAt(spec, 0)).toBeCloseTo(0, 3);
    expect(easingValueAt(spec, 1)).toBeCloseTo(1, 3);
    expect(easingValueAt(spec, 0.5)).toBeCloseTo(0.5, 2);
    expect(easingValueAt(spec, 0.25)).toBeLessThan(0.25);
  });

  it('steps in jumps', () => {
    const spec = parseEasing('steps(4, end)');
    expect(easingValueAt(spec, 0.3)).toBe(0.25);
    expect(easingValueAt(spec, 1)).toBe(1);
  });
});

describe('buildCurveGeometry', () => {
  it('draws a path inside the box and exposes handles for beziers', () => {
    const geometry = buildCurveGeometry(parseEasing('ease'), 64, 44, 6);
    expect(geometry.path.startsWith('M6')).toBe(true);
    expect(geometry.handles).not.toBeNull();
    expect(geometry.endpoints.end.x).toBe(58);
  });
});

describe('formatDuration', () => {
  it('formats milliseconds and seconds', () => {
    expect(formatDuration(250)).toBe('250 ms');
    expect(formatDuration(1500)).toBe('1.5 s');
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe('∞');
  });
});
