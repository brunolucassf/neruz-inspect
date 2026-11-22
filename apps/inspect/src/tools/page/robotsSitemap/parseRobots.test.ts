import { describe, expect, it } from 'vitest';
import { isPathBlocked, parseRobots, parseSitemap } from './parseRobots';

const ROBOTS = `
# comment
User-agent: *
Disallow: /admin/
Allow: /admin/public/
Disallow: /*.pdf$
Crawl-delay: 5

User-agent: Googlebot
User-agent: Bingbot
Disallow: /private

Sitemap: https://a.test/sitemap.xml
sitemap: https://a.test/news.xml
`;

describe('parseRobots', () => {
  const file = parseRobots(ROBOTS);

  it('groups consecutive user-agents and keeps rules', () => {
    expect(file.groups).toHaveLength(2);
    expect(file.groups[1]?.agents).toEqual(['Googlebot', 'Bingbot']);
    expect(file.groups[0]?.rules).toHaveLength(3);
    expect(file.groups[0]?.crawlDelay).toBe(5);
  });

  it('collects sitemap lines', () => {
    expect(file.sitemaps).toEqual(['https://a.test/sitemap.xml', 'https://a.test/news.xml']);
  });

  it('handles an empty file', () => {
    expect(parseRobots('')).toEqual({ groups: [], sitemaps: [] });
  });
});

describe('isPathBlocked', () => {
  const file = parseRobots(ROBOTS);

  it('blocks by prefix and lets the longest allow win', () => {
    expect(isPathBlocked(file, '/admin/x').blocked).toBe(true);
    expect(isPathBlocked(file, '/admin/public/x').blocked).toBe(false);
    expect(isPathBlocked(file, '/blog').blocked).toBe(false);
  });

  it('supports wildcards and end anchors', () => {
    expect(isPathBlocked(file, '/files/doc.pdf').blocked).toBe(true);
    expect(isPathBlocked(file, '/files/doc.pdf?x=1').blocked).toBe(false);
  });

  it('prefers the specific agent group over the wildcard', () => {
    expect(isPathBlocked(file, '/private/a', 'Googlebot').blocked).toBe(true);
    expect(isPathBlocked(file, '/admin/a', 'Googlebot').blocked).toBe(false);
  });
});

describe('parseSitemap', () => {
  it('reads a urlset', () => {
    const parsed = parseSitemap(
      '<urlset><url><loc>https://a.test/?a=1&amp;b=2</loc><lastmod>2026-01-01</lastmod></url><url><loc><![CDATA[https://a.test/x]]></loc></url></urlset>',
    );
    expect(parsed.kind).toBe('urlset');
    expect(parsed.entries).toEqual([
      { loc: 'https://a.test/?a=1&b=2', lastmod: '2026-01-01' },
      { loc: 'https://a.test/x', lastmod: '' },
    ]);
  });

  it('reads a sitemap index', () => {
    const parsed = parseSitemap(
      '<sitemapindex><sitemap><loc>https://a.test/s1.xml</loc></sitemap></sitemapindex>',
    );
    expect(parsed.kind).toBe('index');
    expect(parsed.entries).toHaveLength(1);
  });

  it('flags non-sitemap content', () => {
    expect(parseSitemap('<html></html>').kind).toBe('unknown');
  });
});
