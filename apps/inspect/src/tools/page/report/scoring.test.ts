import { describe, expect, it } from 'vitest';
import type { AreaScore, Finding } from './reportTypes';
import { lightFor, scoreArea, scoreFindings, scoreOverall, sortFindings } from './scoring';

const finding = (overrides: Partial<Finding> = {}): Finding => ({
  id: 'x',
  area: 'seo',
  severity: 'warning',
  count: 1,
  ...overrides,
});

describe('scoreFindings', () => {
  it('is 100 without findings', () => {
    expect(scoreFindings([])).toBe(100);
  });

  it('weighs errors more than warnings and tips', () => {
    const error = scoreFindings([finding({ severity: 'error' })]);
    const warning = scoreFindings([finding({ severity: 'warning' })]);
    const info = scoreFindings([finding({ severity: 'info' })]);
    expect(error).toBeLessThan(warning);
    expect(warning).toBeLessThan(info);
  });

  it('penalizes repeated occurrences, but with a cap', () => {
    const single = scoreFindings([finding({ count: 1 })]);
    const many = scoreFindings([finding({ count: 50 })]);
    const huge = scoreFindings([finding({ count: 5000 })]);
    expect(many).toBeLessThan(single);
    expect(huge).toBe(many);
  });

  it('never goes below 0', () => {
    const findings = Array.from({ length: 20 }, () => finding({ severity: 'error' }));
    expect(scoreFindings(findings)).toBe(0);
  });
});

describe('lightFor', () => {
  it('maps thresholds', () => {
    expect(lightFor(95, false)).toBe('good');
    expect(lightFor(80, false)).toBe('good');
    expect(lightFor(79, false)).toBe('attention');
    expect(lightFor(50, false)).toBe('attention');
    expect(lightFor(49, false)).toBe('critical');
  });

  it('never shows green when there is an error', () => {
    expect(lightFor(90, true)).toBe('attention');
  });
});

describe('scoreArea', () => {
  it('stays unmeasured instead of inventing a score', () => {
    expect(scoreArea('seo', false, [finding()])).toEqual({
      area: 'seo',
      measured: false,
      score: null,
      light: 'unmeasured',
      findingCount: 0,
    });
  });

  it('only counts findings from its own area', () => {
    const result = scoreArea('seo', true, [
      finding({ area: 'a11y', severity: 'error' }),
      finding({ area: 'seo', severity: 'info' }),
    ]);
    expect(result.score).toBe(98);
    expect(result.findingCount).toBe(1);
    expect(result.light).toBe('good');
  });
});

describe('scoreOverall', () => {
  const area = (overrides: Partial<AreaScore>): AreaScore => ({
    area: 'seo',
    measured: true,
    score: 100,
    light: 'good',
    findingCount: 0,
    ...overrides,
  });

  it('has no score when nothing was measured', () => {
    const overall = scoreOverall([area({ measured: false, score: null, light: 'unmeasured' })]);
    expect(overall).toMatchObject({ score: null, light: 'unmeasured', measuredAreas: 0 });
  });

  it('averages only the measured areas', () => {
    const overall = scoreOverall([
      area({ area: 'seo', score: 90 }),
      area({ area: 'a11y', score: 70, light: 'attention' }),
      area({ area: 'links', measured: false, score: null, light: 'unmeasured' }),
    ]);
    expect(overall.score).toBe(80);
    expect(overall.measuredAreas).toBe(2);
  });

  it('does not turn green while some area is not green', () => {
    const overall = scoreOverall([
      area({ area: 'seo', score: 100 }),
      area({ area: 'a11y', score: 75, light: 'attention' }),
      area({ area: 'assets', score: 100 }),
      area({ area: 'links', score: 100 }),
    ]);
    expect(overall.score).toBe(94);
    expect(overall.light).toBe('attention');
  });
});

describe('sortFindings', () => {
  it('puts errors first and heavier counts ahead inside the same severity', () => {
    const sorted = sortFindings([
      finding({ id: 'a', severity: 'info' }),
      finding({ id: 'b', severity: 'warning', count: 1 }),
      finding({ id: 'c', severity: 'warning', count: 30 }),
      finding({ id: 'd', severity: 'error' }),
    ]);
    expect(sorted.map((item) => item.id)).toEqual(['d', 'c', 'b', 'a']);
  });
});
