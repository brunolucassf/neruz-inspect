export default async function techProbe(args: {
  globals: string[];
  selectors: { css: string; attr?: string }[];
  domKeys: string[];
  cssVars: string[];
}) {
  const MAX_URLS = 500;
  const MAX_TOKENS = 6000;
  const MAX_ELEMENTS = 3000;
  const root = window as unknown as Record<string, unknown>;

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

  const selectors: Record<string, string | true> = {};
  for (const { css, attr } of args.selectors) {
    try {
      const element = document.querySelector(css);
      if (!element) continue;
      const value = attr ? element.getAttribute(attr) : null;
      selectors[`${css}@${attr ?? ''}`] = value ? value.slice(0, 80) : true;
    } catch {}
  }

  const meta: { name: string; content: string }[] = [];
  for (const element of document.querySelectorAll('meta[name], meta[property]')) {
    const name = (element.getAttribute('name') ?? element.getAttribute('property') ?? '')
      .toLowerCase()
      .trim();
    if (name) meta.push({ name, content: (element.getAttribute('content') ?? '').slice(0, 300) });
    if (meta.length >= 200) break;
  }

  const unique = (values: Iterable<string>): string[] => [...new Set(values)].slice(0, MAX_URLS);
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const fromEntries = (types: string[]): string[] =>
    entries.filter((entry) => types.includes(entry.initiatorType)).map((entry) => entry.name);

  const scripts = unique([
    ...Array.from(document.scripts, (element) => element.src).filter(Boolean),
    ...fromEntries(['script']),
  ]);
  const links = unique([
    ...Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[href]'),
      (element) => element.href,
    ),
    ...Array.from(
      document.querySelectorAll<HTMLIFrameElement>('iframe[src]'),
      (element) => element.src,
    ),
    ...fromEntries(['link', 'css']),
  ]);
  const images = unique([
    ...Array.from(document.images, (element) => element.currentSrc || element.src).filter(Boolean),
    ...fromEntries(['img']),
  ]);

  const classTokens = new Set<string>();
  const elements = Array.from(document.querySelectorAll('html, body, body *')).slice(
    0,
    MAX_ELEMENTS,
  );
  for (const element of elements) {
    for (const token of element.classList) {
      classTokens.add(token);
    }
    if (classTokens.size >= MAX_TOKENS) break;
  }

  const domKeys = new Set<string>();
  for (const element of elements.slice(0, 800)) {
    for (const key of Object.keys(element)) {
      for (const prefix of args.domKeys) {
        if (key.startsWith(prefix)) domKeys.add(prefix);
      }
    }
  }

  const computed = getComputedStyle(document.documentElement);
  const cssVars = args.cssVars.filter((name) => computed.getPropertyValue(name).trim() !== '');

  let serviceWorker = false;
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      serviceWorker = navigator.serviceWorker.controller !== null || registrations.length > 0;
    }
  } catch {
    serviceWorker = false;
  }

  return {
    globals,
    selectors,
    meta,
    scripts,
    links,
    images,
    classTokens: [...classTokens],
    domKeys: [...domKeys],
    cssVars,
    serviceWorker,
  };
}
