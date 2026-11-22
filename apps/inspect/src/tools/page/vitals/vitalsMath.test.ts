import { describe, expect, it } from 'vitest';
import {
  categorizeResource,
  classifyDomSize,
  classifyVital,
  computeCls,
  computeInp,
  formatVital,
  summarizeResources,
} from './vitalsMath';

describe('classifyVital', () => {
  it('uses the Core Web Vitals boundaries', () => {
    expect(classifyVital('lcp', 2500)).toBe('good');
    expect(classifyVital('lcp', 2501)).toBe('needs-improvement');
    expect(classifyVital('lcp', 4001)).toBe('poor');
    expect(classifyVital('cls', 0.1)).toBe('good');
    expect(classifyVital('cls', 0.26)).toBe('poor');
    expect(classifyVital('inp', 200)).toBe('good');
    expect(classifyVital('inp', 500)).toBe('needs-improvement');
    expect(classifyVital('fcp', 3001)).toBe('poor');
    expect(classifyVital('ttfb', 800)).toBe('good');
  });
});

describe('formatVital', () => {
  it('formats times and the unitless CLS', () => {
    expect(formatVital('lcp', 1800.4)).toBe('1.80 s');
    expect(formatVital('inp', 96.2)).toBe('96 ms');
    expect(formatVital('cls', 0.12345)).toBe('0.123');
  });
});

describe('computeCls', () => {
  const shift = (startTime: number, value: number, hadRecentInput = false) => ({
    startTime,
    value,
    hadRecentInput,
  });

  it('ignores shifts that follow user input', () => {
    expect(computeCls([shift(100, 0.5, true)]).value).toBe(0);
  });

  it('sums shifts inside a session window and keeps the worst window', () => {
    const result = computeCls([shift(100, 0.05), shift(600, 0.04), shift(5000, 0.08)]);
    expect(result.value).toBeCloseTo(0.09);
    expect(result.worst).toHaveLength(2);
  });

  it('starts a new window after a one second gap', () => {
    expect(computeCls([shift(0, 0.02), shift(1500, 0.03)]).value).toBeCloseTo(0.03);
  });

  it('caps a window at five seconds', () => {
    const shifts = [0, 900, 1800, 2700, 3600, 4500, 5400].map((time) => shift(time, 0.01));
    expect(computeCls(shifts).value).toBeCloseTo(0.06);
  });
});

describe('computeInp', () => {
  const entry = (interactionId: number, duration: number) => ({ interactionId, duration });

  it('returns null without interactions', () => {
    expect(computeInp([entry(0, 300)])).toBeNull();
  });

  it('takes the longest event per interaction and the slowest for few interactions', () => {
    const result = computeInp([entry(1, 80), entry(1, 120), entry(2, 64)]);
    expect(result?.value).toBe(120);
    expect(result?.slowest.map((item) => item.duration)).toEqual([120, 64]);
  });

  it('skips the worst outlier per 50 interactions', () => {
    const entries = Array.from({ length: 50 }, (_, index) => entry(index + 1, 100 + index));
    expect(computeInp(entries)?.value).toBe(148);
  });
});

describe('resources', () => {
  it('groups resources by type', () => {
    expect(categorizeResource({ name: 'https://a.test/app.js', initiatorType: 'script' })).toBe(
      'script',
    );
    expect(categorizeResource({ name: 'https://a.test/f.woff2', initiatorType: 'css' })).toBe(
      'font',
    );
    expect(categorizeResource({ name: 'https://a.test/x', initiatorType: 'img' })).toBe('image');
    expect(categorizeResource({ name: 'https://a.test/a.css', initiatorType: 'link' })).toBe(
      'style',
    );
    expect(categorizeResource({ name: 'https://a.test/api', initiatorType: 'fetch' })).toBe(
      'fetch',
    );
  });

  it('sums counts and weight', () => {
    const summary = summarizeResources([
      { name: 'https://a.test/a.js', initiatorType: 'script', transferSize: 1000 },
      { name: 'https://a.test/b.js', initiatorType: 'script', encodedBodySize: 500 },
      { name: 'https://a.test/c.png', initiatorType: 'img', transferSize: 0 },
    ]);
    expect(summary.groups.script).toEqual({ count: 2, bytes: 1500 });
    expect(summary.groups.image.count).toBe(1);
    expect(summary.totalBytes).toBe(1500);
    expect(summary.totalCount).toBe(3);
  });
});

describe('classifyDomSize', () => {
  it('follows the Lighthouse DOM size guidance', () => {
    expect(classifyDomSize(600)).toBe('good');
    expect(classifyDomSize(1000)).toBe('needs-improvement');
    expect(classifyDomSize(2000)).toBe('poor');
  });
});
