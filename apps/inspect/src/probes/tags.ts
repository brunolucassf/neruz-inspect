export default function tagsProbe(args: {
  resourcePattern: string;
  inlinePatterns: string[];
  globals: string[];
  layers: string[];
}) {
  const MAX_RESOURCES = 800;
  const MAX_LAYER_ENTRIES = 300;
  const MAX_INLINE_SCRIPTS = 80;
  const MAX_INLINE_LENGTH = 40000;
  const root = window as unknown as Record<string, unknown>;

  try {
    performance.setResourceTimingBufferSize(1500);
  } catch {}

  const readPath = (path: string): unknown => {
    let current: unknown = root;
    for (const key of path.split('.')) {
      if (current === null || current === undefined) return undefined;
      try {
        current = (current as Record<string, unknown>)[key];
      } catch {
        return undefined;
      }
    }
    return current;
  };

  const globals: Record<string, string | true> = {};
  for (const path of args.globals) {
    const value = readPath(path);
    if (value === undefined || value === null || value === false) continue;
    globals[path] = typeof value === 'string' || typeof value === 'number' ? String(value) : true;
  }

  const resourceMatcher = new RegExp(args.resourcePattern, 'i');

  const domScripts: string[] = [];
  for (const element of document.querySelectorAll<HTMLElement>(
    'script[src], iframe[src], img[src]',
  )) {
    const url = (element as HTMLScriptElement).src;
    if (url && resourceMatcher.test(url)) domScripts.push(url);
    if (domScripts.length >= 150) break;
  }

  const resources: { url: string; type: string; at: number }[] = [];
  for (const entry of performance.getEntriesByType('resource') as PerformanceResourceTiming[]) {
    if (!resourceMatcher.test(entry.name)) continue;
    resources.push({
      url: entry.name.slice(0, 1200),
      type: entry.initiatorType,
      at: Math.round(entry.startTime),
    });
    if (resources.length >= MAX_RESOURCES) break;
  }

  const inline: { index: number; value: string }[] = [];
  const inlineScripts = Array.from(document.querySelectorAll('script:not([src])')).slice(
    0,
    MAX_INLINE_SCRIPTS,
  );
  args.inlinePatterns.forEach((source, index) => {
    const matcher = new RegExp(source, 'gi');
    const seen = new Set<string>();
    for (const script of inlineScripts) {
      const text = (script.textContent ?? '').slice(0, MAX_INLINE_LENGTH);
      matcher.lastIndex = 0;
      let found = matcher.exec(text);
      while (found && seen.size < 20) {
        const value = found[1];
        if (value && !seen.has(value)) {
          seen.add(value);
          inline.push({ index, value });
        }
        found = matcher.exec(text);
      }
    }
  });

  let gtmKeys: string[] = [];
  try {
    const container = root.google_tag_manager;
    if (container && typeof container === 'object') {
      gtmKeys = Object.keys(container).filter((key) => /^(?:GTM|G|AW|UA|DC|GT)-/.test(key));
    }
  } catch {
    gtmKeys = [];
  }

  const knownIds: { platform: string; id: string }[] = [];
  try {
    const fbq = root.fbq as
      | { getState?: () => { pixels?: { id?: string }[] }; instance?: { pixelsByID?: object } }
      | undefined;
    for (const pixel of fbq?.getState?.()?.pixels ?? []) {
      if (pixel.id) knownIds.push({ platform: 'metaPixel', id: String(pixel.id) });
    }
    for (const id of Object.keys(fbq?.instance?.pixelsByID ?? {})) {
      knownIds.push({ platform: 'metaPixel', id });
    }
  } catch {}
  try {
    const ttq = root.ttq as { _i?: object } | undefined;
    for (const id of Object.keys(ttq?._i ?? {})) knownIds.push({ platform: 'tiktok', id });
  } catch {}
  try {
    const partnerIds = root._linkedin_data_partner_ids;
    if (Array.isArray(partnerIds)) {
      for (const id of partnerIds) knownIds.push({ platform: 'linkedin', id: String(id) });
    }
  } catch {}
  try {
    const settings = root._hjSettings as { hjid?: number | string } | undefined;
    if (settings?.hjid) knownIds.push({ platform: 'hotjar', id: String(settings.hjid) });
  } catch {}

  const layerNames = new Set<string>(args.layers);
  for (const script of document.querySelectorAll<HTMLScriptElement>(
    'script[src*="googletagmanager.com"]',
  )) {
    const name = /[?&]l=([\w$]+)/.exec(script.src)?.[1];
    if (name) layerNames.add(name);
  }

  const preview = (value: unknown): string => {
    try {
      const text = JSON.stringify(value, (_key, item) => {
        if (typeof item === 'function') return '[function]';
        if (typeof Node !== 'undefined' && item instanceof Node) return '[node]';
        return item;
      });
      return text ? text.slice(0, 400) : '';
    } catch {
      return '[unserializable]';
    }
  };

  const layers: {
    name: string;
    total: number;
    entries: {
      index: number;
      kind: 'event' | 'config' | 'consent' | 'data';
      name: string;
      id?: string;
      preview: string;
    }[];
  }[] = [];

  for (const layerName of layerNames) {
    const layer = root[layerName];
    if (!Array.isArray(layer)) continue;
    const offset = Math.max(0, layer.length - MAX_LAYER_ENTRIES);
    const entries: (typeof layers)[number]['entries'] = [];
    for (let index = offset; index < layer.length; index += 1) {
      const item: unknown = layer[index];
      const isArguments = Object.prototype.toString.call(item) === '[object Arguments]';
      if (Array.isArray(item) || isArguments) {
        const parts = Array.from(item as ArrayLike<unknown>);
        const command = parts[0];
        if (command === 'event' && typeof parts[1] === 'string') {
          entries.push({ index, kind: 'event', name: parts[1], preview: preview(parts[2]) });
        } else if (command === 'config' && typeof parts[1] === 'string') {
          entries.push({
            index,
            kind: 'config',
            name: 'config',
            id: parts[1],
            preview: preview(parts[2]),
          });
        } else if (command === 'consent' && typeof parts[1] === 'string') {
          entries.push({ index, kind: 'consent', name: parts[1], preview: preview(parts[2]) });
        }
        continue;
      }
      if (item && typeof item === 'object') {
        const eventName = (item as Record<string, unknown>).event;
        entries.push(
          typeof eventName === 'string'
            ? { index, kind: 'event', name: eventName, preview: preview(item) }
            : { index, kind: 'data', name: '', preview: preview(item) },
        );
      }
    }
    layers.push({ name: layerName, total: layer.length, entries });
  }

  return { domScripts, resources, inline, globals, gtmKeys, knownIds, layers };
}
