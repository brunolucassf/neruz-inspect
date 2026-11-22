import { describe, expect, it } from 'vitest';
import {
  classifyHref,
  classifyStatus,
  hasUnsafeBlank,
  isAnchorBroken,
  type LinkItem,
  linksToCsv,
  parseRel,
  uniqueCheckableUrls,
} from './analyzeLinks';

const PAGE = 'https://a.test/blog/post?x=1';

describe('classifyHref', () => {
  it('separates internal, external, anchor, mailto and tel', () => {
    expect(classifyHref('/about', PAGE).kind).toBe('internal');
    expect(classifyHref('https://b.test/', PAGE).kind).toBe('external');
    expect(classifyHref('#section', PAGE).kind).toBe('anchor');
    expect(classifyHref('mailto:x@a.test', PAGE).kind).toBe('mailto');
    expect(classifyHref('tel:+5511', PAGE).kind).toBe('tel');
    expect(classifyHref('javascript:void(0)', PAGE).kind).toBe('other');
  });

  it('keeps links to another page with a hash as internal', () => {
    expect(classifyHref('/blog/other#a', PAGE).kind).toBe('internal');
  });
});

describe('rel and target', () => {
  it('reads rel tokens', () => {
    expect(parseRel('NoFollow sponsored')).toMatchObject({
      nofollow: true,
      sponsored: true,
      ugc: false,
    });
  });

  it('flags _blank without noopener or noreferrer', () => {
    expect(hasUnsafeBlank('_blank', parseRel(''))).toBe(true);
    expect(hasUnsafeBlank('_blank', parseRel('noopener'))).toBe(false);
    expect(hasUnsafeBlank('_blank', parseRel('noreferrer'))).toBe(false);
    expect(hasUnsafeBlank('_self', parseRel(''))).toBe(false);
  });
});

describe('isAnchorBroken', () => {
  const exists = (id: string) => id === 'faq';

  it('detects missing targets', () => {
    expect(isAnchorBroken('#faq', exists)).toBe(false);
    expect(isAnchorBroken('#nope', exists)).toBe(true);
  });

  it('treats # and #top as valid', () => {
    expect(isAnchorBroken('#', exists)).toBe(false);
    expect(isAnchorBroken('#top', exists)).toBe(false);
  });
});

describe('classifyStatus', () => {
  it('groups status codes', () => {
    expect(classifyStatus(200)).toBe('ok');
    expect(classifyStatus(301)).toBe('ok');
    expect(classifyStatus(404)).toBe('broken');
    expect(classifyStatus(500)).toBe('broken');
    expect(classifyStatus(403)).toBe('restricted');
    expect(classifyStatus(null)).toBe('unreachable');
  });
});

const item = (url: string, checkable = true): LinkItem => ({
  id: url,
  url,
  rawHref: url,
  text: 'a "quoted", text',
  kind: 'internal',
  rel: parseRel(''),
  targetBlank: false,
  unsafeBlank: false,
  brokenAnchor: false,
  checkable,
  element: {} as Element,
});

describe('uniqueCheckableUrls', () => {
  it('dedupes by url without hash and respects the limit', () => {
    const items = [
      item('https://a.test/x#1'),
      item('https://a.test/x#2'),
      item('https://a.test/y'),
    ];
    expect(uniqueCheckableUrls(items)).toEqual(['https://a.test/x', 'https://a.test/y']);
    expect(uniqueCheckableUrls(items, 1)).toHaveLength(1);
  });

  it('skips non-checkable links', () => {
    expect(uniqueCheckableUrls([item('mailto:a@b.c', false)])).toEqual([]);
  });
});

describe('linksToCsv', () => {
  it('escapes quotes and fills the status column', () => {
    const csv = linksToCsv([item('https://a.test/x')], new Map([['https://a.test/x', 404]]));
    const [header, row] = csv.split('\r\n');
    expect(header?.startsWith('url,text')).toBe(true);
    expect(row).toContain('"a ""quoted"", text"');
    expect(row?.endsWith(',404')).toBe(true);
  });

  it('neutralizes spreadsheet formulas', () => {
    const csv = linksToCsv([{ ...item('https://a.test/'), text: '=HYPERLINK("x")' }], new Map());
    expect(csv).toContain("'=HYPERLINK");
  });
});
