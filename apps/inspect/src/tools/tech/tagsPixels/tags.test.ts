import { describe, expect, it } from 'vitest';
import {
  analyzeTags,
  buildTagsProbeArgs,
  eventsSince,
  isInternalLayerEntry,
  PLATFORM_IDS,
  parseHit,
  type TagsProbeResult,
} from './tags';

const emptyResult: TagsProbeResult = {
  domScripts: [],
  resources: [],
  inline: [],
  globals: {},
  gtmKeys: [],
  knownIds: [],
  layers: [],
};

const resultWith = (patch: Partial<TagsProbeResult>): TagsProbeResult => ({
  ...emptyResult,
  ...patch,
});

describe('parseHit', () => {
  it('reads Meta Pixel id and event', () => {
    expect(
      parseHit('https://www.facebook.com/tr/?id=1234567890123&ev=PageView&dl=https%3A%2F%2Fa.com'),
    ).toEqual({ platform: 'metaPixel', id: '1234567890123', event: 'PageView' });
  });

  it('reads GA4 measurement id and event', () => {
    expect(
      parseHit('https://region1.google-analytics.com/g/collect?v=2&tid=G-ABC123XYZ9&en=purchase'),
    ).toEqual({ platform: 'ga4', id: 'G-ABC123XYZ9', event: 'purchase' });
  });

  it('prefixes Google Ads ids found in the path and keeps the label', () => {
    expect(
      parseHit('https://www.googleadservices.com/pagead/conversion/123456789/?label=abcDEF'),
    ).toEqual({ platform: 'googleAds', id: 'AW-123456789', event: 'abcDEF' });
  });

  it('reads Taboola ids from the path', () => {
    expect(parseHit('https://trc.taboola.com/1234567/log/3/unip?en=page_view')).toEqual({
      platform: 'taboola',
      id: '1234567',
      event: 'page_view',
    });
  });

  it('ignores unrelated urls and malformed input', () => {
    expect(parseHit('https://example.com/app.js')).toBeUndefined();
    expect(parseHit('not a url')).toBeUndefined();
  });
});

describe('analyzeTags', () => {
  it('marks a pixel active when its script loaded and groups events with counts', () => {
    const analysis = analyzeTags(
      resultWith({
        domScripts: ['https://connect.facebook.net/en_US/fbevents.js'],
        resources: [
          { url: 'https://connect.facebook.net/en_US/fbevents.js', type: 'script', at: 100 },
          { url: 'https://www.facebook.com/tr/?id=111111111&ev=PageView', type: 'img', at: 200 },
          { url: 'https://www.facebook.com/tr/?id=111111111&ev=PageView', type: 'img', at: 900 },
          { url: 'https://www.facebook.com/tr/?id=111111111&ev=Lead', type: 'img', at: 950 },
        ],
        inline: [{ index: 3, value: '111111111' }],
      }),
    );
    const meta = analysis.platforms.find((platform) => platform.id === 'metaPixel');
    expect(meta?.status).toBe('active');
    expect(meta?.ids).toEqual(['111111111']);
    expect(meta?.events.map((event) => [event.name, event.count])).toEqual([
      ['PageView', 2],
      ['Lead', 1],
    ]);
  });

  it('flags a pixel declared in the page that never loaded', () => {
    const analysis = analyzeTags(
      resultWith({
        domScripts: ['https://connect.facebook.net/en_US/fbevents.js'],
        globals: { fbq: true },
        knownIds: [{ platform: 'metaPixel', id: '222222222' }],
      }),
    );
    const meta = analysis.platforms.find((platform) => platform.id === 'metaPixel');
    expect(meta?.status).toBe('notLoaded');
    expect(meta?.ids).toEqual(['222222222']);
  });

  it('treats the real fbevents flag as loaded', () => {
    const analysis = analyzeTags(resultWith({ globals: { fbq: true, 'fbq.loaded': true } }));
    expect(analysis.platforms[0]?.status).toBe('active');
  });

  it('detects GTM and GA4 from container keys', () => {
    const analysis = analyzeTags(
      resultWith({ gtmKeys: ['GTM-ABCD12', 'G-ABC123XYZ9', 'AW-99999'] }),
    );
    const byId = Object.fromEntries(analysis.platforms.map((platform) => [platform.id, platform]));
    expect(byId.gtm?.status).toBe('active');
    expect(byId.ga4?.ids).toEqual(['G-ABC123XYZ9']);
    expect(byId.googleAds?.ids).toEqual(['AW-99999']);
  });

  it('reads config entries from dataLayer as declared but not loaded', () => {
    const analysis = analyzeTags(
      resultWith({
        layers: [
          {
            name: 'dataLayer',
            total: 1,
            entries: [
              { index: 0, kind: 'config', name: 'config', id: 'G-ABC123XYZ9', preview: '' },
            ],
          },
        ],
      }),
    );
    expect(analysis.platforms[0]).toMatchObject({ id: 'ga4', status: 'notLoaded' });
  });

  it('takes ids from inline snippets in platform order', () => {
    const args = buildTagsProbeArgs();
    const gtmIndex = 0;
    expect(new RegExp(args.inlinePatterns[gtmIndex] ?? '', 'i').test("'GTM-ABCD12'")).toBe(true);
    const analysis = analyzeTags(
      resultWith({ inline: [{ index: gtmIndex, value: 'GTM-ABCD12' }] }),
    );
    expect(analysis.platforms[0]).toMatchObject({ id: 'gtm', ids: ['GTM-ABCD12'] });
  });

  it('returns nothing for a page without tags', () => {
    expect(analyzeTags(emptyResult).platforms).toEqual([]);
  });

  it('lists every known platform as missing when nothing was found', () => {
    const analysis = analyzeTags(emptyResult);
    expect(analysis.missing).toHaveLength(PLATFORM_IDS.length);
    expect(analysis.missing[0]).toEqual({ id: 'gtm', name: 'Google Tag Manager' });
  });

  it('keeps found platforms out of the missing list', () => {
    const analysis = analyzeTags(resultWith({ globals: { fbq: true } }));
    expect(analysis.platforms.map((platform) => platform.id)).toEqual(['metaPixel']);
    expect(analysis.missing.map((platform) => platform.id)).not.toContain('metaPixel');
    expect(analysis.missing).toHaveLength(PLATFORM_IDS.length - 1);
  });
});

describe('eventsSince', () => {
  const events = [
    { key: 'a', id: undefined, name: 'PageView', count: 2 },
    { key: 'b', id: undefined, name: 'Lead', count: 1 },
  ];

  it('has no baseline on the first scan', () => {
    expect(eventsSince(null, events).size).toBe(0);
  });

  it('flags new keys and grown counts', () => {
    const fresh = eventsSince(new Map([['a', 1]]), events);
    expect([...fresh].sort()).toEqual(['a', 'b']);
    expect(
      eventsSince(
        new Map([
          ['a', 2],
          ['b', 1],
        ]),
        events,
      ).size,
    ).toBe(0);
  });
});

describe('probe args', () => {
  it('builds a valid combined resource pattern', () => {
    const args = buildTagsProbeArgs();
    const matcher = new RegExp(args.resourcePattern, 'i');
    expect(matcher.test('https://connect.facebook.net/pt_BR/fbevents.js')).toBe(true);
    expect(matcher.test('https://example.com/app.js')).toBe(false);
    for (const source of args.inlinePatterns) expect(() => new RegExp(source, 'gi')).not.toThrow();
  });

  it('recognises internal GTM layer entries', () => {
    expect(isInternalLayerEntry({ index: 0, kind: 'event', name: 'gtm.js', preview: '' })).toBe(
      true,
    );
    expect(isInternalLayerEntry({ index: 1, kind: 'event', name: 'purchase', preview: '' })).toBe(
      false,
    );
  });
});
