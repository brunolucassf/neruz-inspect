export const PLATFORM_IDS = [
  'gtm',
  'ga4',
  'googleAds',
  'metaPixel',
  'tiktok',
  'linkedin',
  'hotjar',
  'clarity',
  'pinterest',
  'taboola',
  'rdStation',
  'kwai',
] as const;

export type PlatformId = (typeof PLATFORM_IDS)[number];

type PlatformDefinition = {
  id: PlatformId;
  name: string;
  script: RegExp;
  hit?: RegExp;
  hitIdParams?: readonly string[];
  hitIdFromPath?: RegExp;
  hitIdPrefix?: string;
  hitEventParams?: readonly string[];
  inline: readonly RegExp[];
  declaredGlobals: readonly string[];
  loadedGlobals: readonly string[];
};

export const PLATFORMS: readonly PlatformDefinition[] = [
  {
    id: 'gtm',
    name: 'Google Tag Manager',
    script: /googletagmanager\.com\/(?:gtm\.js|ns\.html)\?[^#]*?\bid=(GTM-[A-Z0-9]+)/i,
    inline: [/['"](GTM-[A-Z0-9]{4,10})['"]/g],
    declaredGlobals: ['google_tag_manager'],
    loadedGlobals: [],
  },
  {
    id: 'ga4',
    name: 'Google Analytics 4',
    script: /googletagmanager\.com\/gtag\/js\?[^#]*?\bid=(G-[A-Z0-9]+)/i,
    hit: /\/g\/collect\?/i,
    hitIdParams: ['tid'],
    hitEventParams: ['en'],
    inline: [/gtag\(\s*['"]config['"]\s*,\s*['"](G-[A-Z0-9]+)/g],
    declaredGlobals: [],
    loadedGlobals: [],
  },
  {
    id: 'googleAds',
    name: 'Google Ads',
    script: /googletagmanager\.com\/gtag\/js\?[^#]*?\bid=(AW-\d+)/i,
    hit: /(?:googleadservices\.com\/pagead\/conversion|google\.[a-z.]+\/pagead\/1p-conversion|doubleclick\.net\/pagead\/viewthroughconversion)\/\d+|\/ccm\/collect\?[^#]*\btid=AW-/i,
    hitIdFromPath: /\/(?:conversion|1p-conversion|viewthroughconversion)\/(\d+)/i,
    hitIdPrefix: 'AW-',
    hitIdParams: ['tid'],
    hitEventParams: ['label', 'en'],
    inline: [/gtag\(\s*['"]config['"]\s*,\s*['"](AW-\d+)/g],
    declaredGlobals: [],
    loadedGlobals: [],
  },
  {
    id: 'metaPixel',
    name: 'Meta Pixel',
    script: /connect\.facebook\.net\/[\w_-]+\/fbevents\.js()/i,
    hit: /facebook\.com\/tr\/?\?/i,
    hitIdParams: ['id'],
    hitEventParams: ['ev'],
    inline: [/fbq\(\s*['"]init['"]\s*,\s*['"]?(\d{8,20})/g],
    declaredGlobals: ['fbq'],
    loadedGlobals: ['fbq.loaded', 'fbq.version'],
  },
  {
    id: 'tiktok',
    name: 'TikTok Pixel',
    script: /analytics\.tiktok\.com\/i18n\/pixel\/[^?#]*(?:\?[^#]*?\bsdkid=([A-Z0-9]+))?/i,
    hit: /analytics\.tiktok\.com\/api\/v\d\/(?:pixel|track)/i,
    hitIdParams: ['sdkid', 'pixel_code'],
    hitEventParams: ['event', 'ev'],
    inline: [/ttq\.load\(\s*['"]([A-Z0-9]{10,})['"]/g],
    declaredGlobals: ['ttq'],
    loadedGlobals: [],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Insight Tag',
    script: /snap\.licdn\.com\/li\.lms-analytics\/insight\.min\.js()/i,
    hit: /px\.ads\.linkedin\.com\/collect/i,
    hitIdParams: ['pid'],
    inline: [/_linkedin_partner_id\s*=\s*['"]?(\d+)/g],
    declaredGlobals: ['_linkedin_data_partner_ids', 'lintrk'],
    loadedGlobals: [],
  },
  {
    id: 'hotjar',
    name: 'Hotjar',
    script: /static\.hotjar\.com\/c\/hotjar-(\d+)\.js/i,
    hit: /(?:in|insights|vc)\.hotjar\.(?:com|io)\//i,
    inline: [/hjid\s*[:=]\s*(\d+)/g],
    declaredGlobals: ['hj'],
    loadedGlobals: ['_hjSettings', 'hjSiteSettings'],
  },
  {
    id: 'clarity',
    name: 'Microsoft Clarity',
    script: /clarity\.ms\/tag\/([a-z0-9]+)/i,
    hit: /clarity\.ms\/collect/i,
    inline: [/\(window,\s*document,\s*['"]clarity['"],\s*['"]script['"],\s*['"]([a-z0-9]+)['"]\)/g],
    declaredGlobals: ['clarity'],
    loadedGlobals: [],
  },
  {
    id: 'pinterest',
    name: 'Pinterest Tag',
    script: /s\.pinimg\.com\/ct\/core\.js()/i,
    hit: /ct\.pinterest\.com\/(?:v3|user)/i,
    hitIdParams: ['tid'],
    hitEventParams: ['event'],
    inline: [/pintrk\(\s*['"]load['"]\s*,\s*['"](\d+)/g],
    declaredGlobals: ['pintrk'],
    loadedGlobals: [],
  },
  {
    id: 'taboola',
    name: 'Taboola Pixel',
    script: /cdn\.taboola\.com\/libtrc\/(?:unip\/)?(\d+)\/tfa\.js/i,
    hit: /trc\.taboola\.com\/\d+\/log\//i,
    hitIdFromPath: /trc\.taboola\.com\/(\d+)\/log\//i,
    hitEventParams: ['en'],
    inline: [/_tfa\.push\(\{\s*notify:\s*['"]newPageLoad['"]\s*,\s*id:\s*(\d+)/g],
    declaredGlobals: ['_tfa'],
    loadedGlobals: [],
  },
  {
    id: 'rdStation',
    name: 'RD Station',
    script: /d335luupugsy2\.cloudfront\.net\/js\/loader-scripts\/([0-9a-f-]{20,})-loader\.js/i,
    hit: /api\.rd\.services|rdstation\.com(?:\.br)?\/(?:conversions|events|tracking)/i,
    inline: [],
    declaredGlobals: ['RdIntegration'],
    loadedGlobals: [],
  },
  {
    id: 'kwai',
    name: 'Kwai Pixel',
    script: /kwai[\w.-]*\.com\/[^\s"']*events\.js()/i,
    hit: /adsapi\.kwai\.com|kwai[\w.-]*\.com\/[^\s"']*(?:track|event)/i,
    hitIdParams: ['pixelId'],
    hitEventParams: ['eventName'],
    inline: [/kwaiq\.load\(\s*['"]([\w-]+)/g],
    declaredGlobals: ['kwaiq'],
    loadedGlobals: [],
  },
];

export const DATA_LAYER_NAME = 'dataLayer';

export type TagsProbeArgs = {
  resourcePattern: string;
  inlinePatterns: string[];
  globals: string[];
  layers: string[];
};

export const buildTagsProbeArgs = (): TagsProbeArgs => {
  const sources = PLATFORMS.flatMap((platform) =>
    platform.hit ? [platform.script.source, platform.hit.source] : [platform.script.source],
  );
  return {
    resourcePattern: sources.join('|'),
    inlinePatterns: PLATFORMS.flatMap((platform) =>
      platform.inline.map((pattern) => pattern.source),
    ),
    globals: [...new Set(PLATFORMS.flatMap((p) => [...p.declaredGlobals, ...p.loadedGlobals]))],
    layers: [DATA_LAYER_NAME],
  };
};

export type LayerEntryKind = 'event' | 'config' | 'consent' | 'data';

export type LayerEntry = {
  index: number;
  kind: LayerEntryKind;
  name: string;
  id?: string;
  preview: string;
};

export type TagsProbeResult = {
  domScripts: string[];
  resources: { url: string; type: string; at: number }[];
  inline: { index: number; value: string }[];
  globals: Record<string, string | true>;
  gtmKeys: string[];
  knownIds: { platform: string; id: string }[];
  layers: { name: string; total: number; entries: LayerEntry[] }[];
};

export type TagEvent = {
  key: string;
  id: string | undefined;
  name: string | undefined;
  count: number;
};

export type PlatformStatus = 'active' | 'notLoaded';

export type PlatformReport = {
  id: PlatformId;
  name: string;
  status: PlatformStatus;
  ids: string[];
  events: TagEvent[];
  foundBy: string[];
};

export type LayerReport = { name: string; total: number; entries: LayerEntry[] };

export type MissingPlatform = { id: PlatformId; name: string };

export type TagsAnalysis = {
  platforms: PlatformReport[];
  missing: MissingPlatform[];
  layers: LayerReport[];
};

export type ParsedHit = { platform: PlatformId; id: string | undefined; event: string | undefined };

const readParam = (url: URL, names: readonly string[] | undefined): string | undefined => {
  for (const name of names ?? []) {
    const value = url.searchParams.get(name);
    if (value) return value;
  }
  return undefined;
};

const toUrl = (value: string): URL | undefined => {
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
};

export const parseHit = (rawUrl: string): ParsedHit | undefined => {
  const url = toUrl(rawUrl);
  for (const platform of PLATFORMS) {
    if (!platform.hit?.test(rawUrl)) continue;
    const fromPath = platform.hitIdFromPath?.exec(rawUrl)?.[1];
    const fromParam = url ? readParam(url, platform.hitIdParams) : undefined;
    const rawId = fromPath ?? fromParam;
    const id =
      rawId && platform.hitIdPrefix && !rawId.startsWith(platform.hitIdPrefix)
        ? `${platform.hitIdPrefix}${rawId}`
        : rawId;
    return {
      platform: platform.id,
      id,
      event: url ? readParam(url, platform.hitEventParams) : undefined,
    };
  }
  return undefined;
};

export const idsFromScriptUrl = (platform: PlatformDefinition, rawUrl: string): string[] => {
  const found = platform.script.exec(rawUrl);
  return found?.[1] ? [found[1]] : [];
};

type Collector = {
  ids: Set<string>;
  scriptInDom: boolean;
  scriptLoaded: boolean;
  declared: boolean;
  loadedByGlobal: boolean;
  events: Map<string, TagEvent>;
  foundBy: Set<string>;
};

const newCollector = (): Collector => ({
  ids: new Set(),
  scriptInDom: false,
  scriptLoaded: false,
  declared: false,
  loadedByGlobal: false,
  events: new Map(),
  foundBy: new Set(),
});

const platformOfId = (id: string): PlatformId | undefined => {
  if (id.startsWith('GTM-')) return 'gtm';
  if (id.startsWith('G-')) return 'ga4';
  if (id.startsWith('AW-')) return 'googleAds';
  return undefined;
};

export const eventKey = (platform: PlatformId, id: string | undefined, name: string | undefined) =>
  `${platform}|${id ?? ''}|${name ?? ''}`;

const isPlatformId = (value: string): value is PlatformId =>
  (PLATFORM_IDS as readonly string[]).includes(value);

export const analyzeTags = (result: TagsProbeResult): TagsAnalysis => {
  const collectors = new Map<PlatformId, Collector>(
    PLATFORMS.map((platform) => [platform.id, newCollector()]),
  );
  const collectorOf = (id: PlatformId): Collector => collectors.get(id) ?? newCollector();
  const inlinePatterns = PLATFORMS.flatMap((platform) => platform.inline.map(() => platform.id));

  for (const platform of PLATFORMS) {
    const collector = collectorOf(platform.id);
    for (const url of result.domScripts) {
      if (!platform.script.test(url)) continue;
      collector.scriptInDom = true;
      collector.foundBy.add('script');
      for (const id of idsFromScriptUrl(platform, url)) collector.ids.add(id);
    }
    for (const resource of result.resources) {
      if (platform.hit?.test(resource.url)) continue;
      if (!platform.script.test(resource.url)) continue;
      collector.scriptLoaded = true;
      collector.foundBy.add('script');
      for (const id of idsFromScriptUrl(platform, resource.url)) collector.ids.add(id);
    }
    for (const name of platform.declaredGlobals) {
      if (result.globals[name] === undefined) continue;
      collector.declared = true;
      collector.foundBy.add(`window.${name}`);
    }
    for (const name of platform.loadedGlobals) {
      if (result.globals[name] === undefined) continue;
      collector.loadedByGlobal = true;
    }
  }

  for (const match of result.inline) {
    const platformId = inlinePatterns[match.index];
    if (!platformId) continue;
    const collector = collectorOf(platformId);
    collector.ids.add(match.value);
    collector.declared = true;
    collector.foundBy.add('inline');
  }

  for (const known of result.knownIds) {
    if (!isPlatformId(known.platform)) continue;
    const collector = collectorOf(known.platform);
    collector.ids.add(known.id);
    collector.declared = true;
    collector.foundBy.add('window');
  }

  for (const key of result.gtmKeys) {
    const platformId = platformOfId(key);
    if (!platformId) continue;
    const collector = collectorOf(platformId);
    collector.ids.add(key);
    collector.loadedByGlobal = true;
    collector.foundBy.add('google_tag_manager');
  }

  for (const resource of result.resources) {
    const hit = parseHit(resource.url);
    if (!hit) continue;
    const collector = collectorOf(hit.platform);
    collector.foundBy.add('network');
    if (hit.id) collector.ids.add(hit.id);
    const key = eventKey(hit.platform, hit.id, hit.event);
    const existing = collector.events.get(key);
    if (existing) existing.count += 1;
    else collector.events.set(key, { key, id: hit.id, name: hit.event, count: 1 });
  }

  for (const layer of result.layers) {
    for (const entry of layer.entries) {
      if (entry.kind === 'config' && entry.id) {
        const platformId = platformOfId(entry.id);
        if (!platformId) continue;
        const collector = collectorOf(platformId);
        collector.ids.add(entry.id);
        collector.declared = true;
        collector.foundBy.add('dataLayer');
      }
      if (entry.kind === 'event' && entry.name === 'gtm.js') {
        const collector = collectorOf('gtm');
        collector.loadedByGlobal = true;
        collector.declared = true;
        collector.foundBy.add('dataLayer');
      }
    }
  }

  const platforms: PlatformReport[] = [];
  const missing: MissingPlatform[] = [];
  for (const platform of PLATFORMS) {
    const collector = collectorOf(platform.id);
    const hitTotal = [...collector.events.values()].reduce((sum, event) => sum + event.count, 0);
    const found =
      collector.ids.size > 0 ||
      collector.scriptInDom ||
      collector.scriptLoaded ||
      collector.declared ||
      hitTotal > 0;
    if (!found) {
      missing.push({ id: platform.id, name: platform.name });
      continue;
    }
    const loaded = collector.scriptLoaded || hitTotal > 0 || collector.loadedByGlobal;
    platforms.push({
      id: platform.id,
      name: platform.name,
      status: loaded ? 'active' : 'notLoaded',
      ids: [...collector.ids],
      events: [...collector.events.values()],
      foundBy: [...collector.foundBy],
    });
  }

  return {
    platforms,
    missing,
    layers: result.layers.map((layer) => ({
      name: layer.name,
      total: layer.total,
      entries: layer.entries,
    })),
  };
};

export const isInternalLayerEntry = (entry: LayerEntry): boolean =>
  entry.kind === 'event' && entry.name.startsWith('gtm.');

export const eventsSince = (
  previous: ReadonlyMap<string, number> | null,
  events: readonly TagEvent[],
): Set<string> => {
  const fresh = new Set<string>();
  if (!previous) return fresh;
  for (const event of events) {
    if (event.count > (previous.get(event.key) ?? 0)) fresh.add(event.key);
  }
  return fresh;
};
