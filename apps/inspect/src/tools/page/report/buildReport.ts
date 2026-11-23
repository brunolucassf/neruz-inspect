import type { DesignTokens } from '../../code/designTokens/tokens';
import type { TagsAnalysis } from '../../tech/tagsPixels/tags';
import type { DetectedTech } from '../../tech/techStack/types';
import type { A11yResult } from '../a11y/analyzeA11y';
import type { AssetsResult } from '../assets/analyzeAssets';
import { classifyStatus, type LinkItem, stripHash } from '../links/analyzeLinks';
import type { RobotsSitemapResult } from '../robotsSitemap/analyzeRobotsSitemap';
import type { SeoResult } from '../seoMeta/analyzeSeo';
import { truncate } from '../shared/format';
import type { Severity } from '../shared/severity';
import type { StructuredDataResult } from '../structuredData/analyzeStructuredData';
import type { VitalsSnapshot } from '../vitals/analyzeVitals';
import { classifyDomSize, classifyVital, RESOURCE_GROUPS } from '../vitals/vitalsMath';
import {
  type A11ySection,
  type AreaId,
  type AssetsSection,
  type Collected,
  type DesignSection,
  type Finding,
  type IndexingSection,
  type LinksSection,
  type PerformanceSection,
  REPORT_VERSION,
  type ReportData,
  type ReportSectionId,
  SCORED_AREAS,
  type SeoSection,
  type StructuredSection,
  type TagsSection,
  type TechSection,
  type VitalName,
  type VitalReading,
} from './reportTypes';
import { scoreArea, scoreOverall, sortFindings } from './scoring';

export type Part<TData> =
  | { status: 'ok'; data: TData; findings: Finding[]; measured: boolean }
  | { status: 'failed' };

const ok = <TData>(data: TData, findings: Finding[] = [], measured = true): Part<TData> => ({
  status: 'ok',
  data,
  findings,
  measured,
});

const finding = (area: AreaId, id: string, severity: Severity, count = 1): Finding => ({
  id,
  area,
  severity,
  count,
});

const MAX_TEXT = 160;
const MAX_HEADINGS = 60;
const MAX_STRUCTURED_ITEMS = 40;
const MAX_BROKEN_LINKS = 25;

export const buildSeoPart = (seo: SeoResult): Part<SeoSection> =>
  ok(
    {
      title: truncate(seo.title, MAX_TEXT),
      description: truncate(seo.description, 320),
      canonical: truncate(seo.canonical, 300),
      robots: seo.robots,
      lang: seo.lang,
      viewport: truncate(seo.viewport, MAX_TEXT),
      openGraph: Object.fromEntries(
        Object.entries(seo.openGraph).map(([key, value]) => [key, truncate(value, 300)]),
      ),
      twitter: Object.fromEntries(
        Object.entries(seo.twitter).map(([key, value]) => [key, truncate(value, 300)]),
      ),
      hreflangCount: seo.hreflangs.length,
      headings: seo.headings
        .slice(0, MAX_HEADINGS)
        .map((heading) => ({ level: heading.level, text: truncate(heading.text, 120) })),
      headingsTotal: seo.headings.length,
    },
    seo.alerts.map((alert) => ({
      ...finding('seo', alert.id, alert.severity),
      ...(alert.params ? { params: alert.params } : {}),
    })),
  );

export const buildIndexingPart = (result: RobotsSitemapResult): Part<IndexingSection> => {
  const robotsFound = result.robots.found;
  const robotsStatus = result.robots.status;
  const anySitemapReached = result.sitemaps.some((sitemap) => sitemap.status !== null);
  const reachable = robotsStatus !== null || anySitemapReached;
  const wildcardVerdict = result.verdicts.find((entry) => entry.agent === '*');
  const sitemaps = result.sitemaps.map((sitemap) => ({
    url: truncate(sitemap.url, 200),
    status: sitemap.status,
    kind: sitemap.parsed?.kind ?? (sitemap.gzipped ? 'gzip' : 'none'),
    entries: sitemap.parsed?.entries.length ?? 0,
  }));
  const findings: Finding[] = [];
  if (reachable) {
    if (!robotsFound && robotsStatus !== null) {
      findings.push(finding('indexing', 'robotsMissing', 'warning'));
    }
    const hasSitemap = result.sitemaps.some(
      (sitemap) =>
        sitemap.gzipped || (sitemap.parsed !== null && sitemap.parsed.kind !== 'unknown'),
    );
    if (!hasSitemap && anySitemapReached) {
      findings.push(finding('indexing', 'sitemapMissing', 'warning'));
    }
    if (wildcardVerdict?.verdict.blocked) findings.push(finding('indexing', 'blocked', 'error'));
  }
  return ok(
    {
      robotsFound,
      robotsStatus,
      pathBlockedForAll: robotsFound ? (wildcardVerdict?.verdict.blocked ?? null) : null,
      sitemaps,
    },
    findings,
    reachable,
  );
};

export const buildStructuredPart = (result: StructuredDataResult): Part<StructuredSection> => {
  const withMissing = result.items.filter((item) => item.missing.length > 0).length;
  const findings: Finding[] = [];
  if (result.items.length === 0 && result.invalid.length === 0) {
    findings.push(finding('structured', 'none', 'info'));
  }
  if (result.invalid.length > 0) {
    findings.push(finding('structured', 'invalid', 'error', result.invalid.length));
  }
  if (withMissing > 0)
    findings.push(finding('structured', 'missingFields', 'warning', withMissing));
  return ok(
    {
      types: result.types.slice(0, 40),
      items: result.items.slice(0, MAX_STRUCTURED_ITEMS).map((item) => ({
        format: item.format,
        types: item.types,
        missing: item.missing,
      })),
      invalidCount: result.invalid.length,
      itemTotal: result.items.length,
    },
    findings,
  );
};

const RATING_SEVERITY = { poor: 'error', 'needs-improvement': 'warning' } as const;

export const buildPerformancePart = (snapshot: VitalsSnapshot): Part<PerformanceSection> => {
  const pageHasPainted = snapshot.lcp !== null || snapshot.fcp !== null;
  const raw: [VitalName, number | null][] = [
    ['lcp', snapshot.lcp?.value ?? null],
    ['cls', pageHasPainted ? snapshot.cls.value : null],
    ['inp', snapshot.inp?.value ?? null],
    ['fcp', snapshot.fcp],
    ['ttfb', snapshot.ttfb],
  ];
  const vitals: VitalReading[] = raw.map(([metric, value]) => ({
    metric,
    value,
    rating: value === null ? null : classifyVital(metric, value),
  }));
  const domRating = classifyDomSize(snapshot.domNodes);
  const findings: Finding[] = [];
  for (const reading of vitals) {
    if (reading.rating === null || reading.rating === 'good') continue;
    findings.push(finding('performance', reading.metric, RATING_SEVERITY[reading.rating]));
  }
  if (domRating !== 'good') {
    findings.push(
      finding('performance', 'dom', domRating === 'poor' ? 'warning' : 'info', snapshot.domNodes),
    );
  }
  const measured = vitals.some((reading) => reading.value !== null);
  return ok(
    {
      vitals,
      domNodes: snapshot.domNodes,
      domRating,
      resources: RESOURCE_GROUPS.filter((group) => snapshot.resources.groups[group].count > 0).map(
        (group) => ({
          group,
          count: snapshot.resources.groups[group].count,
          bytes: snapshot.resources.groups[group].bytes,
        }),
      ),
      totalRequests: snapshot.resources.totalCount,
      totalBytes: snapshot.resources.totalBytes,
    },
    findings,
    measured,
  );
};

const SEVERITY_RANK: Record<Severity, number> = { error: 0, warning: 1, info: 2 };

export const buildA11yPart = (result: A11yResult): Part<A11ySection> => {
  const grouped = new Map<string, { severity: Severity; count: number; example: string }>();
  for (const issue of result.issues) {
    const current = grouped.get(issue.rule);
    if (!current) {
      grouped.set(issue.rule, {
        severity: issue.severity,
        count: 1,
        example: truncate(issue.detail, 100),
      });
      continue;
    }
    current.count += 1;
    if (SEVERITY_RANK[issue.severity] < SEVERITY_RANK[current.severity]) {
      current.severity = issue.severity;
    }
  }
  const rules = [...grouped.entries()]
    .map(([rule, entry]) => ({ rule, ...entry }))
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.count - a.count);
  return ok(
    { rules, scanned: result.scanned, truncated: result.truncated },
    rules.map((entry) => finding('a11y', entry.rule, entry.severity, entry.count)),
  );
};

export const buildAssetsPart = (result: AssetsResult): Part<AssetsSection> => {
  const categories = new Map<string, number>();
  const alerts = new Map<string, { severity: Severity; count: number }>();
  let withProblems = 0;
  let knownBytes = 0;
  for (const item of result.items) {
    categories.set(item.category, (categories.get(item.category) ?? 0) + 1);
    knownBytes += item.input.bytes ?? 0;
    if (item.alerts.some((alert) => alert.severity !== 'info')) withProblems += 1;
    for (const alert of item.alerts) {
      const current = alerts.get(alert.id);
      if (current) current.count += 1;
      else alerts.set(alert.id, { severity: alert.severity, count: 1 });
    }
  }
  const alertList = [...alerts.entries()]
    .map(([id, entry]) => ({ id, ...entry }))
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.count - a.count);
  return ok(
    {
      total: result.items.length,
      byCategory: [...categories.entries()].map(([category, count]) => ({ category, count })),
      withProblems,
      knownBytes,
      alerts: alertList,
      truncated: result.truncated,
    },
    alertList.map((alert) => finding('assets', alert.id, alert.severity, alert.count)),
  );
};

export const buildLinksPart = (
  items: readonly LinkItem[],
  truncated: boolean,
  statuses: ReadonlyMap<string, number | null> | null,
): Part<LinksSection> => {
  const count = (predicate: (item: LinkItem) => boolean): number => items.filter(predicate).length;
  const unsafeBlank = count((item) => item.unsafeBlank);
  const brokenAnchors = count((item) => item.brokenAnchor);
  const broken: { url: string; status: number | null }[] = [];
  let okCount = 0;
  let restrictedCount = 0;
  let unreachableCount = 0;
  let brokenTotal = 0;
  if (statuses) {
    for (const [url, status] of statuses) {
      const kind = classifyStatus(status);
      if (kind === 'ok') okCount += 1;
      else if (kind === 'restricted') restrictedCount += 1;
      else if (kind === 'unreachable') unreachableCount += 1;
      else {
        brokenTotal += 1;
        if (broken.length < MAX_BROKEN_LINKS) broken.push({ url: truncate(url, 200), status });
      }
    }
  }
  const findings: Finding[] = [];
  if (brokenTotal > 0) findings.push(finding('links', 'broken', 'error', brokenTotal));
  if (unsafeBlank > 0) findings.push(finding('links', 'unsafeBlank', 'warning', unsafeBlank));
  if (brokenAnchors > 0) findings.push(finding('links', 'brokenAnchor', 'warning', brokenAnchors));
  return ok(
    {
      total: items.length,
      internal: count((item) => item.kind === 'internal' || item.kind === 'anchor'),
      external: count((item) => item.kind === 'external'),
      contact: count((item) => item.kind === 'mailto' || item.kind === 'tel'),
      nofollow: count((item) => item.rel.nofollow),
      unsafeBlank,
      brokenAnchors,
      statusChecked: statuses !== null,
      checkedCount: statuses?.size ?? 0,
      okCount,
      restrictedCount,
      unreachableCount,
      broken,
      brokenTotal,
      truncated,
    },
    findings,
  );
};

export const statusMapFrom = (
  entries: readonly { url: string; status: number | null }[],
): Map<string, number | null> =>
  new Map(entries.map((entry) => [stripHash(entry.url), entry.status]));

export const buildTechPart = (
  list: readonly DetectedTech[],
  headersAvailable: boolean,
): Part<TechSection> =>
  ok({
    headersAvailable,
    list: list.map((item) => ({
      name: item.name,
      category: item.category,
      version: item.version ?? '',
      confidence: item.confidence,
      website: item.website,
    })),
  });

export const buildTagsPart = (analysis: TagsAnalysis): Part<TagsSection> =>
  ok({
    platforms: analysis.platforms.map((platform) => ({
      name: platform.name,
      active: platform.status === 'active',
      ids: platform.ids.slice(0, 6),
      events: platform.events
        .slice(0, 15)
        .map((event) => ({ name: event.name ?? '', count: event.count })),
    })),
  });

export const buildDesignPart = (
  tokens: DesignTokens,
  scanned: number,
  limited: boolean,
): Part<DesignSection> =>
  ok({
    colors: tokens.colors.slice(0, 16).map(({ name, hex, count }) => ({ name, hex, count })),
    fonts: tokens.fontFamilies
      .slice(0, 6)
      .map(({ name, stack, count }) => ({ name, stack: truncate(stack, 160), count })),
    typeScale: tokens.typeScale.slice(0, 10).map(({ name, px, count }) => ({ name, px, count })),
    spacing: tokens.spacing.slice(0, 10).map(({ name, px, count }) => ({ name, px, count })),
    radii: tokens.radii.slice(0, 8).map(({ name, px, count }) => ({ name, px, count })),
    scanned,
    limited,
  });

export type ReportMeta = {
  url: string;
  title: string;
  generatedAt: number;
  preparedFor: string;
  preparedBy: string;
  thumbnail: string | null;
  included: ReportSectionId[];
};

export type ReportParts = {
  tech?: Part<TechSection>;
  tags?: Part<TagsSection>;
  seo?: Part<SeoSection>;
  indexing?: Part<IndexingSection>;
  structured?: Part<StructuredSection>;
  performance?: Part<PerformanceSection>;
  a11y?: Part<A11ySection>;
  assets?: Part<AssetsSection>;
  links?: Part<LinksSection>;
  design?: Part<DesignSection>;
};

const hostOf = (url: string): string => {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
};

const unwrap = <TData>(part: Part<TData> | undefined): Collected<TData> | undefined =>
  part === undefined
    ? undefined
    : part.status === 'ok'
      ? { status: 'ok', data: part.data }
      : { status: 'failed' };

const isMeasured = (part: Part<unknown> | undefined): boolean =>
  part !== undefined && part.status === 'ok' && part.measured;

const findingsOf = (part: Part<unknown> | undefined): Finding[] =>
  part !== undefined && part.status === 'ok' && part.measured ? part.findings : [];

export const assembleReport = (meta: ReportMeta, parts: ReportParts): ReportData => {
  const findings = sortFindings(SCORED_AREAS.flatMap((area) => findingsOf(parts[area])));
  const areas = SCORED_AREAS.map((area) => scoreArea(area, isMeasured(parts[area]), findings));
  const report: ReportData = {
    version: REPORT_VERSION,
    url: meta.url,
    host: hostOf(meta.url),
    title: truncate(meta.title, MAX_TEXT),
    generatedAt: meta.generatedAt,
    preparedFor: truncate(meta.preparedFor, 120),
    preparedBy: truncate(meta.preparedBy, 120),
    thumbnail: meta.thumbnail,
    included: meta.included,
    findings,
    areas,
    overall: scoreOverall(areas),
  };
  const sections = {
    tech: unwrap(parts.tech),
    tags: unwrap(parts.tags),
    seo: unwrap(parts.seo),
    indexing: unwrap(parts.indexing),
    structured: unwrap(parts.structured),
    performance: unwrap(parts.performance),
    a11y: unwrap(parts.a11y),
    assets: unwrap(parts.assets),
    links: unwrap(parts.links),
    design: unwrap(parts.design),
  };
  for (const [key, value] of Object.entries(sections)) {
    if (value !== undefined) Object.assign(report, { [key]: value });
  }
  return report;
};
