import { describe, expect, it } from 'vitest';
import type { LinkItem } from '../links/analyzeLinks';
import type { RobotsSitemapResult } from '../robotsSitemap/analyzeRobotsSitemap';
import type { VitalsSnapshot } from '../vitals/analyzeVitals';
import { summarizeResources } from '../vitals/vitalsMath';
import type { ReportMeta } from './buildReport';
import {
  assembleReport,
  buildIndexingPart,
  buildLinksPart,
  buildPerformancePart,
  buildStructuredPart,
  statusMapFrom,
} from './buildReport';
import { isReportData } from './reportTypes';

const meta = {
  url: 'https://example.com/',
  title: 'Example',
  generatedAt: 1_700_000_000_000,
  preparedFor: ' Cliente ',
  preparedBy: 'Fonte Dev',
  thumbnail: null,
  included: ['summary', 'performance'],
} satisfies ReportMeta;

const snapshot = (overrides: Partial<VitalsSnapshot> = {}): VitalsSnapshot => ({
  lcp: { value: 3000, element: null, url: '', size: 0 },
  cls: { value: 0.3, shifts: [] },
  inp: null,
  fcp: 1200,
  ttfb: 500,
  resources: summarizeResources([]),
  domNodes: 500,
  ...overrides,
});

const link = (overrides: Partial<LinkItem>): LinkItem => ({
  id: 'link-0',
  url: 'https://example.com/a',
  rawHref: '/a',
  text: 'a',
  kind: 'internal',
  rel: { nofollow: false, sponsored: false, ugc: false, noopener: false, noreferrer: false },
  targetBlank: false,
  unsafeBlank: false,
  brokenAnchor: false,
  checkable: true,
  element: {} as Element,
  ...overrides,
});

describe('buildPerformancePart', () => {
  it('rates measured vitals and leaves INP unmeasured without interactions', () => {
    const part = buildPerformancePart(snapshot());
    if (part.status !== 'ok') throw new Error('expected ok');
    const byMetric = Object.fromEntries(part.data.vitals.map((entry) => [entry.metric, entry]));
    expect(byMetric.lcp?.rating).toBe('needs-improvement');
    expect(byMetric.cls?.rating).toBe('poor');
    expect(byMetric.inp).toMatchObject({ value: null, rating: null });
    expect(part.findings.map((item) => `${item.id}:${item.severity}`)).toEqual([
      'lcp:warning',
      'cls:error',
    ]);
    expect(part.measured).toBe(true);
  });

  it('is not measured when the page has no paint data', () => {
    const part = buildPerformancePart(snapshot({ lcp: null, fcp: null, ttfb: null }));
    if (part.status !== 'ok') throw new Error('expected ok');
    expect(part.measured).toBe(false);
    expect(part.data.vitals.every((entry) => entry.value === null)).toBe(true);
  });
});

describe('buildIndexingPart', () => {
  const result = (overrides: Partial<RobotsSitemapResult>): RobotsSitemapResult => ({
    origin: 'https://example.com',
    robotsUrl: 'https://example.com/robots.txt',
    robots: { found: false, status: 404 },
    currentPath: '/',
    verdicts: [],
    sitemaps: [
      { url: 'https://example.com/sitemap.xml', status: 404, parsed: null, gzipped: false },
    ],
    ...overrides,
  });

  it('flags missing robots and sitemap only when the site answered', () => {
    const part = buildIndexingPart(result({}));
    if (part.status !== 'ok') throw new Error('expected ok');
    expect(part.findings.map((item) => item.id)).toEqual(['robotsMissing', 'sitemapMissing']);
  });

  it('does not guess when nothing could be fetched', () => {
    const part = buildIndexingPart(
      result({
        robots: { found: false, status: null },
        sitemaps: [
          { url: 'https://example.com/sitemap.xml', status: null, parsed: null, gzipped: false },
        ],
      }),
    );
    if (part.status !== 'ok') throw new Error('expected ok');
    expect(part.measured).toBe(false);
    expect(part.findings).toEqual([]);
  });
});

describe('buildStructuredPart', () => {
  it('reports absence as a tip, not an error', () => {
    const part = buildStructuredPart({ items: [], invalid: [], types: [] });
    if (part.status !== 'ok') throw new Error('expected ok');
    expect(part.findings).toEqual([{ id: 'none', area: 'structured', severity: 'info', count: 1 }]);
  });
});

describe('buildLinksPart', () => {
  it('counts only real error statuses as broken', () => {
    const items = [
      link({ url: 'https://example.com/ok' }),
      link({ url: 'https://example.com/gone' }),
      link({ url: 'https://other.com/blocked', kind: 'external' }),
      link({ url: 'https://other.com/down', kind: 'external' }),
      link({ unsafeBlank: true, url: 'https://example.com/ok' }),
    ];
    const statuses = statusMapFrom([
      { url: 'https://example.com/ok', status: 200 },
      { url: 'https://example.com/gone', status: 404 },
      { url: 'https://other.com/blocked', status: 403 },
      { url: 'https://other.com/down', status: null },
    ]);
    const part = buildLinksPart(items, false, statuses);
    if (part.status !== 'ok') throw new Error('expected ok');
    expect(part.data).toMatchObject({
      total: 5,
      okCount: 1,
      brokenTotal: 1,
      restrictedCount: 1,
      unreachableCount: 1,
      unsafeBlank: 1,
      statusChecked: true,
    });
    expect(part.findings.map((item) => item.id)).toEqual(['broken', 'unsafeBlank']);
  });

  it('does not report statuses that were never checked', () => {
    const part = buildLinksPart([link({})], false, null);
    if (part.status !== 'ok') throw new Error('expected ok');
    expect(part.data.statusChecked).toBe(false);
    expect(part.data.brokenTotal).toBe(0);
  });
});

describe('assembleReport', () => {
  it('only scores what was measured and survives a JSON round trip', () => {
    const performance = buildPerformancePart(snapshot());
    const report = assembleReport(meta, {
      performance,
      links: { status: 'failed' },
    });
    expect(report.areas.find((area) => area.area === 'links')).toMatchObject({
      measured: false,
      score: null,
    });
    expect(report.areas.find((area) => area.area === 'performance')?.measured).toBe(true);
    expect(report.overall.measuredAreas).toBe(1);
    expect(report.links).toEqual({ status: 'failed' });
    expect(report.seo).toBeUndefined();
    expect(report.host).toBe('example.com');
    expect(report.preparedFor).toBe(' Cliente ');

    const restored: unknown = JSON.parse(JSON.stringify(report));
    expect(isReportData(restored)).toBe(true);
    expect(restored).toEqual(report);
  });

  it('rejects data that is not a report', () => {
    expect(isReportData({ url: 'x' })).toBe(false);
    expect(isReportData(null)).toBe(false);
  });
});
