import { collapseWhitespace } from '../shared/format';
import type { Severity } from '../shared/severity';

export const TITLE_RANGE = { min: 30, max: 60 } as const;
export const DESCRIPTION_RANGE = { min: 70, max: 160 } as const;

export type LengthRating = 'empty' | 'short' | 'good' | 'long';

export const rateLength = (
  length: number,
  range: { readonly min: number; readonly max: number },
): LengthRating => {
  if (length === 0) return 'empty';
  if (length < range.min) return 'short';
  if (length > range.max) return 'long';
  return 'good';
};

export type HeadingInfo = { level: number; text: string };

export type HeadingIssue =
  | { kind: 'noH1' }
  | { kind: 'multipleH1'; count: number }
  | { kind: 'skip'; index: number; from: number; to: number }
  | { kind: 'empty'; index: number };

export const checkHeadings = (headings: readonly HeadingInfo[]): HeadingIssue[] => {
  const issues: HeadingIssue[] = [];
  const h1Count = headings.filter((heading) => heading.level === 1).length;
  if (headings.length > 0 && h1Count === 0) issues.push({ kind: 'noH1' });
  if (h1Count > 1) issues.push({ kind: 'multipleH1', count: h1Count });
  let previous = 0;
  headings.forEach((heading, index) => {
    if (previous > 0 && heading.level > previous + 1) {
      issues.push({ kind: 'skip', index, from: previous, to: heading.level });
    }
    if (heading.text.trim() === '') issues.push({ kind: 'empty', index });
    previous = heading.level;
  });
  return issues;
};

export type HeadingEntry = HeadingInfo & { id: string; element: Element };

export type SeoAlert = {
  id: string;
  severity: Severity;
  params?: Record<string, string | number>;
};

export type HreflangEntry = { lang: string; href: string };

export type SeoResult = {
  url: string;
  title: string;
  description: string;
  canonical: string;
  robots: string;
  lang: string;
  viewport: string;
  charset: string;
  hreflangs: HreflangEntry[];
  openGraph: Record<string, string>;
  twitter: Record<string, string>;
  headings: HeadingEntry[];
  headingIssues: HeadingIssue[];
  alerts: SeoAlert[];
};

type AlertInput = Pick<
  SeoResult,
  | 'title'
  | 'description'
  | 'canonical'
  | 'robots'
  | 'lang'
  | 'viewport'
  | 'openGraph'
  | 'twitter'
  | 'headingIssues'
>;

export const buildSeoAlerts = (input: AlertInput): SeoAlert[] => {
  const alerts: SeoAlert[] = [];
  const titleRating = rateLength(input.title.length, TITLE_RANGE);
  if (titleRating === 'empty') alerts.push({ id: 'titleMissing', severity: 'error' });
  else if (titleRating !== 'good') {
    alerts.push({
      id: titleRating === 'short' ? 'titleShort' : 'titleLong',
      severity: 'warning',
      params: { n: input.title.length },
    });
  }
  const descriptionRating = rateLength(input.description.length, DESCRIPTION_RANGE);
  if (descriptionRating === 'empty') alerts.push({ id: 'descriptionMissing', severity: 'error' });
  else if (descriptionRating !== 'good') {
    alerts.push({
      id: descriptionRating === 'short' ? 'descriptionShort' : 'descriptionLong',
      severity: 'warning',
      params: { n: input.description.length },
    });
  }
  if (!input.canonical) alerts.push({ id: 'canonicalMissing', severity: 'warning' });
  if (!input.lang) alerts.push({ id: 'langMissing', severity: 'warning' });
  if (!input.viewport) alerts.push({ id: 'viewportMissing', severity: 'warning' });
  if (/noindex/i.test(input.robots)) alerts.push({ id: 'noindex', severity: 'error' });
  if (/nofollow/i.test(input.robots)) alerts.push({ id: 'nofollow', severity: 'warning' });
  if (!input.openGraph['og:image']) alerts.push({ id: 'ogImageMissing', severity: 'warning' });
  if (!input.openGraph['og:title']) alerts.push({ id: 'ogTitleMissing', severity: 'info' });
  if (!input.twitter['twitter:card']) alerts.push({ id: 'twitterCardMissing', severity: 'info' });
  for (const issue of input.headingIssues) {
    if (issue.kind === 'noH1') alerts.push({ id: 'h1Missing', severity: 'error' });
    else if (issue.kind === 'multipleH1') {
      alerts.push({ id: 'h1Multiple', severity: 'warning', params: { n: issue.count } });
    } else if (issue.kind === 'skip') {
      alerts.push({
        id: 'headingSkip',
        severity: 'warning',
        params: { from: issue.from, to: issue.to },
      });
    } else alerts.push({ id: 'headingEmpty', severity: 'warning' });
  }
  return alerts;
};

const metaContent = (doc: Document, selector: string): string =>
  doc.querySelector<HTMLMetaElement>(selector)?.content.trim() ?? '';

const collectMeta = (doc: Document, attribute: 'property' | 'name', prefix: string) => {
  const collected: Record<string, string> = {};
  for (const meta of doc.querySelectorAll<HTMLMetaElement>(`meta[${attribute}^="${prefix}"]`)) {
    const key = (meta.getAttribute(attribute) ?? '').toLowerCase();
    if (key && !(key in collected)) collected[key] = meta.content.trim();
  }
  return collected;
};

export const analyzeSeo = (doc: Document): SeoResult => {
  const headings: HeadingEntry[] = Array.from(
    doc.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6'),
  ).map((element, index) => ({
    id: `heading-${index}`,
    level: Number(element.localName.slice(1)),
    text: collapseWhitespace(element.textContent ?? ''),
    element,
  }));
  const headingIssues = checkHeadings(headings);
  const partial = {
    title: collapseWhitespace(doc.title),
    description: metaContent(doc, 'meta[name="description" i]'),
    canonical: doc.querySelector<HTMLLinkElement>('link[rel~="canonical" i]')?.href ?? '',
    robots: metaContent(doc, 'meta[name="robots" i]'),
    lang: doc.documentElement.lang.trim(),
    viewport: metaContent(doc, 'meta[name="viewport" i]'),
    openGraph: collectMeta(doc, 'property', 'og:'),
    twitter: collectMeta(doc, 'name', 'twitter:'),
    headingIssues,
  };
  return {
    ...partial,
    url: doc.URL,
    charset: doc.characterSet,
    hreflangs: Array.from(
      doc.querySelectorAll<HTMLLinkElement>('link[rel~="alternate" i][hreflang]'),
    ).map((link) => ({ lang: link.hreflang, href: link.href })),
    headings,
    alerts: buildSeoAlerts(partial),
  };
};
