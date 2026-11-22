import { describe, expect, it } from 'vitest';
import {
  buildSeoAlerts,
  checkHeadings,
  DESCRIPTION_RANGE,
  rateLength,
  TITLE_RANGE,
} from './analyzeSeo';

const heading = (level: number, text = 'x') => ({ level, text });

describe('rateLength', () => {
  it('classifies against the ideal range', () => {
    expect(rateLength(0, TITLE_RANGE)).toBe('empty');
    expect(rateLength(12, TITLE_RANGE)).toBe('short');
    expect(rateLength(45, TITLE_RANGE)).toBe('good');
    expect(rateLength(61, TITLE_RANGE)).toBe('long');
    expect(rateLength(160, DESCRIPTION_RANGE)).toBe('good');
    expect(rateLength(161, DESCRIPTION_RANGE)).toBe('long');
  });
});

describe('checkHeadings', () => {
  it('accepts a clean outline', () => {
    expect(checkHeadings([heading(1), heading(2), heading(3), heading(2)])).toEqual([]);
  });

  it('flags a missing h1', () => {
    expect(checkHeadings([heading(2), heading(3)])).toContainEqual({ kind: 'noH1' });
  });

  it('flags several h1', () => {
    expect(checkHeadings([heading(1), heading(1)])).toContainEqual({
      kind: 'multipleH1',
      count: 2,
    });
  });

  it('flags skipped levels and empty headings', () => {
    const issues = checkHeadings([heading(1), heading(4, '')]);
    expect(issues).toContainEqual({ kind: 'skip', index: 1, from: 1, to: 4 });
    expect(issues).toContainEqual({ kind: 'empty', index: 1 });
  });

  it('reports nothing for a page without headings', () => {
    expect(checkHeadings([])).toEqual([]);
  });
});

describe('buildSeoAlerts', () => {
  const base = {
    title: 'A title that is just right for search results',
    description: 'd'.repeat(120),
    canonical: 'https://a.test/',
    robots: '',
    lang: 'en',
    viewport: 'width=device-width',
    openGraph: { 'og:image': 'x', 'og:title': 'x' },
    twitter: { 'twitter:card': 'summary' },
    headingIssues: [],
  };

  it('is quiet when everything is fine', () => {
    expect(buildSeoAlerts(base)).toEqual([]);
  });

  it('reports errors for missing basics and noindex', () => {
    const ids = buildSeoAlerts({ ...base, title: '', description: '', robots: 'noindex' }).map(
      (alert) => alert.id,
    );
    expect(ids).toEqual(expect.arrayContaining(['titleMissing', 'descriptionMissing', 'noindex']));
  });
});
