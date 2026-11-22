import { collapseWhitespace } from '../shared/format';

export type LinkKind = 'internal' | 'external' | 'anchor' | 'mailto' | 'tel' | 'other';

export type RelFlags = {
  nofollow: boolean;
  sponsored: boolean;
  ugc: boolean;
  noopener: boolean;
  noreferrer: boolean;
};

export const parseRel = (rel: string): RelFlags => {
  const tokens = new Set(rel.toLowerCase().split(/\s+/).filter(Boolean));
  return {
    nofollow: tokens.has('nofollow'),
    sponsored: tokens.has('sponsored'),
    ugc: tokens.has('ugc'),
    noopener: tokens.has('noopener'),
    noreferrer: tokens.has('noreferrer'),
  };
};

export const hasUnsafeBlank = (target: string, flags: RelFlags): boolean =>
  target.toLowerCase() === '_blank' && !flags.noopener && !flags.noreferrer;

export const classifyHref = (
  rawHref: string,
  pageUrl: string,
): { kind: LinkKind; url: string; hash: string } => {
  const trimmed = rawHref.trim();
  if (/^mailto:/i.test(trimmed)) return { kind: 'mailto', url: trimmed, hash: '' };
  if (/^tel:/i.test(trimmed)) return { kind: 'tel', url: trimmed, hash: '' };
  try {
    const page = new URL(pageUrl);
    const url = new URL(trimmed, page);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { kind: 'other', url: url.href, hash: '' };
    }
    const samePage =
      url.origin === page.origin && url.pathname === page.pathname && url.search === page.search;
    if (samePage && url.hash !== '') return { kind: 'anchor', url: url.href, hash: url.hash };
    return {
      kind: url.origin === page.origin ? 'internal' : 'external',
      url: url.href,
      hash: url.hash,
    };
  } catch {
    return { kind: 'other', url: trimmed, hash: '' };
  }
};

const TOP_ANCHORS = new Set(['', '#', '#top']);

export const isAnchorBroken = (hash: string, targetExists: (id: string) => boolean): boolean => {
  if (TOP_ANCHORS.has(hash)) return false;
  let id = hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {}
  return !targetExists(id);
};

export type LinkItem = {
  id: string;
  url: string;
  rawHref: string;
  text: string;
  kind: LinkKind;
  rel: RelFlags;
  targetBlank: boolean;
  unsafeBlank: boolean;
  brokenAnchor: boolean;
  checkable: boolean;
  element: Element;
};

export type LinksResult = {
  items: LinkItem[];
  truncated: boolean;
};

const MAX_LINKS = 5000;

const linkLabel = (anchor: HTMLAnchorElement): string =>
  collapseWhitespace(anchor.textContent ?? '') ||
  anchor.getAttribute('aria-label') ||
  anchor.querySelector('img[alt]')?.getAttribute('alt') ||
  anchor.title ||
  '';

export const analyzeLinks = (doc: Document): LinksResult => {
  const anchors = Array.from(doc.querySelectorAll<HTMLAnchorElement>('a[href]'));
  const targetExists = (id: string): boolean =>
    doc.getElementById(id) !== null || doc.getElementsByName(id).length > 0;
  const items = anchors.slice(0, MAX_LINKS).map((anchor, index): LinkItem => {
    const rawHref = anchor.getAttribute('href') ?? '';
    const { kind, url, hash } = classifyHref(rawHref, doc.URL);
    const rel = parseRel(anchor.rel);
    const target = anchor.getAttribute('target') ?? '';
    return {
      id: `link-${index}`,
      url,
      rawHref,
      text: linkLabel(anchor),
      kind,
      rel,
      targetBlank: target.toLowerCase() === '_blank',
      unsafeBlank: hasUnsafeBlank(target, rel),
      brokenAnchor: kind === 'anchor' && isAnchorBroken(hash, targetExists),
      checkable: kind === 'internal' || kind === 'external',
      element: anchor,
    };
  });
  return { items, truncated: anchors.length > MAX_LINKS };
};

export type StatusClass = 'ok' | 'restricted' | 'broken' | 'unreachable';

const RESTRICTED_STATUSES = new Set([401, 403, 429, 999]);

export const classifyStatus = (status: number | null): StatusClass => {
  if (status === null) return 'unreachable';
  if (status >= 200 && status < 400) return 'ok';
  if (RESTRICTED_STATUSES.has(status)) return 'restricted';
  return 'broken';
};

export const stripHash = (url: string): string => url.split('#')[0] ?? url;

export const MAX_CHECKED_LINKS = 300;

export const uniqueCheckableUrls = (
  items: readonly LinkItem[],
  limit = MAX_CHECKED_LINKS,
): string[] =>
  [...new Set(items.filter((item) => item.checkable).map((item) => stripHash(item.url)))].slice(
    0,
    limit,
  );

const csvCell = (value: string): string => {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export const linksToCsv = (
  items: readonly LinkItem[],
  statuses: ReadonlyMap<string, number | null>,
): string => {
  const header = [
    'url',
    'text',
    'type',
    'nofollow',
    'sponsored',
    'ugc',
    'target_blank',
    'broken_anchor',
    'status',
  ];
  const rows = items.map((item) => {
    const status = statuses.get(stripHash(item.url));
    return [
      item.url,
      item.text,
      item.kind,
      String(item.rel.nofollow),
      String(item.rel.sponsored),
      String(item.rel.ugc),
      String(item.targetBlank),
      String(item.brokenAnchor),
      status === undefined ? '' : status === null ? 'unreachable' : String(status),
    ];
  });
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
};
