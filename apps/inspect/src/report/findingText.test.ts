import { describe, expect, it } from 'vitest';
import type { Finding } from '../tools/page/report/reportTypes';
import { findingTitleKey, recommendationKey, uniqueRecommendations } from './findingText';

const finding = (overrides: Partial<Finding>): Finding => ({
  id: 'x',
  area: 'seo',
  severity: 'warning',
  count: 1,
  ...overrides,
});

describe('findingTitleKey', () => {
  it('reuses the existing tool messages for seo and accessibility', () => {
    expect(findingTitleKey(finding({ id: 'titleMissing' }))).toBe(
      'page.seoMeta.alert.titleMissing',
    );
    expect(findingTitleKey(finding({ area: 'a11y', id: 'imgAlt' }))).toBe('page.a11y.rule.imgAlt');
    expect(findingTitleKey(finding({ area: 'links', id: 'broken' }))).toBe(
      'page.report.find.links.broken',
    );
  });
});

describe('recommendationKey', () => {
  it('groups related seo alerts into one recommendation', () => {
    expect(recommendationKey(finding({ id: 'titleShort' }))).toBe('page.report.rec.seo.title');
    expect(recommendationKey(finding({ id: 'headingSkip' }))).toBe('page.report.rec.seo.headings');
    expect(recommendationKey(finding({ id: 'canonicalMissing' }))).toBe(
      'page.report.rec.seo.canonicalMissing',
    );
  });
});

describe('uniqueRecommendations', () => {
  it('keeps the first finding of each recommendation', () => {
    const result = uniqueRecommendations([
      finding({ id: 'titleShort' }),
      finding({ id: 'titleLong' }),
      finding({ id: 'h1Missing' }),
    ]);
    expect(result.map((item) => item.id)).toEqual(['titleShort', 'h1Missing']);
  });
});
