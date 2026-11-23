import type { Severity } from '../shared/severity';

export const REPORT_VERSION = 1;

export const REPORT_SECTIONS = [
  'summary',
  'tech',
  'tags',
  'seo',
  'structured',
  'performance',
  'a11y',
  'assets',
  'links',
  'design',
] as const;

export type ReportSectionId = (typeof REPORT_SECTIONS)[number];

export const SLOW_SECTIONS: readonly ReportSectionId[] = ['links'];

export const DEFAULT_SECTIONS: readonly ReportSectionId[] = REPORT_SECTIONS.filter(
  (section) => !SLOW_SECTIONS.includes(section),
);

export const SCORED_AREAS = [
  'seo',
  'indexing',
  'structured',
  'performance',
  'a11y',
  'assets',
  'links',
] as const;

export type AreaId = (typeof SCORED_AREAS)[number];

export type Light = 'good' | 'attention' | 'critical' | 'unmeasured';

export type Finding = {
  id: string;
  area: AreaId;
  severity: Severity;
  count: number;
  params?: Record<string, string | number>;
};

export type AreaScore = {
  area: AreaId;
  measured: boolean;
  score: number | null;
  light: Light;
  findingCount: number;
};

export type OverallScore = {
  score: number | null;
  light: Light;
  measuredAreas: number;
  totalAreas: number;
};

export type Collected<TData> = { status: 'ok'; data: TData } | { status: 'failed' };

export type TechEntry = {
  name: string;
  category: string;
  version: string;
  confidence: 'high' | 'medium' | 'low';
  website: string;
};

export type TechSection = { list: TechEntry[]; headersAvailable: boolean };

export type TagPlatformEntry = {
  name: string;
  active: boolean;
  ids: string[];
  events: { name: string; count: number }[];
};

export type TagsSection = { platforms: TagPlatformEntry[] };

export type SeoSection = {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  lang: string;
  viewport: string;
  openGraph: Record<string, string>;
  twitter: Record<string, string>;
  hreflangCount: number;
  headings: { level: number; text: string }[];
  headingsTotal: number;
};

export type SitemapEntry = { url: string; status: number | null; kind: string; entries: number };

export type IndexingSection = {
  robotsFound: boolean;
  robotsStatus: number | null;
  pathBlockedForAll: boolean | null;
  sitemaps: SitemapEntry[];
};

export type StructuredSection = {
  types: string[];
  items: { format: string; types: string[]; missing: string[] }[];
  invalidCount: number;
  itemTotal: number;
};

export type VitalName = 'lcp' | 'cls' | 'inp' | 'fcp' | 'ttfb';

export type VitalReading = {
  metric: VitalName;
  value: number | null;
  rating: 'good' | 'needs-improvement' | 'poor' | null;
};

export type PerformanceSection = {
  vitals: VitalReading[];
  domNodes: number;
  domRating: 'good' | 'needs-improvement' | 'poor';
  resources: { group: string; count: number; bytes: number }[];
  totalRequests: number;
  totalBytes: number;
};

export type A11yRuleEntry = {
  rule: string;
  severity: Severity;
  count: number;
  example: string;
};

export type A11ySection = {
  rules: A11yRuleEntry[];
  scanned: number;
  truncated: boolean;
};

export type AssetsSection = {
  total: number;
  byCategory: { category: string; count: number }[];
  withProblems: number;
  knownBytes: number;
  alerts: { id: string; count: number; severity: Severity }[];
  truncated: boolean;
};

export type BrokenLink = { url: string; status: number | null };

export type LinksSection = {
  total: number;
  internal: number;
  external: number;
  contact: number;
  nofollow: number;
  unsafeBlank: number;
  brokenAnchors: number;
  statusChecked: boolean;
  checkedCount: number;
  okCount: number;
  restrictedCount: number;
  unreachableCount: number;
  broken: BrokenLink[];
  brokenTotal: number;
  truncated: boolean;
};

export type DesignSection = {
  colors: { name: string; hex: string; count: number }[];
  fonts: { name: string; stack: string; count: number }[];
  typeScale: { name: string; px: number; count: number }[];
  spacing: { name: string; px: number; count: number }[];
  radii: { name: string; px: number; count: number }[];
  scanned: number;
  limited: boolean;
};

export type ReportData = {
  version: typeof REPORT_VERSION;
  url: string;
  host: string;
  title: string;
  generatedAt: number;
  preparedFor: string;
  preparedBy: string;
  thumbnail: string | null;
  included: ReportSectionId[];
  findings: Finding[];
  areas: AreaScore[];
  overall: OverallScore;
  tech?: Collected<TechSection>;
  tags?: Collected<TagsSection>;
  seo?: Collected<SeoSection>;
  indexing?: Collected<IndexingSection>;
  structured?: Collected<StructuredSection>;
  performance?: Collected<PerformanceSection>;
  a11y?: Collected<A11ySection>;
  assets?: Collected<AssetsSection>;
  links?: Collected<LinksSection>;
  design?: Collected<DesignSection>;
};

export const isReportData = (value: unknown): value is ReportData =>
  typeof value === 'object' &&
  value !== null &&
  (value as { version?: unknown }).version === REPORT_VERSION &&
  typeof (value as { url?: unknown }).url === 'string' &&
  Array.isArray((value as { areas?: unknown }).areas) &&
  Array.isArray((value as { findings?: unknown }).findings) &&
  Array.isArray((value as { included?: unknown }).included);
