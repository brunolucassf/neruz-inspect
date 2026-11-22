export type FaviconKind = 'icon' | 'apple-touch-icon' | 'mask-icon' | 'manifest';

export type FaviconEntry = {
  url: string;
  kind: FaviconKind;
  sizes: string;
  type: string;
};

const ICON_RELS: readonly { rel: string; kind: FaviconKind }[] = [
  { rel: 'apple-touch-icon', kind: 'apple-touch-icon' },
  { rel: 'apple-touch-icon-precomposed', kind: 'apple-touch-icon' },
  { rel: 'mask-icon', kind: 'mask-icon' },
  { rel: 'icon', kind: 'icon' },
  { rel: 'shortcut', kind: 'icon' },
];

export const collectFavicons = (doc: Document): FaviconEntry[] => {
  const found = new Map<string, FaviconEntry>();
  for (const link of doc.querySelectorAll<HTMLLinkElement>('link[rel][href]')) {
    const rels = link.rel.toLowerCase().split(/\s+/);
    const match = ICON_RELS.find((item) => rels.includes(item.rel));
    if (!match || !link.href) continue;
    found.set(link.href, {
      url: link.href,
      kind: match.kind,
      sizes: link.getAttribute('sizes') ?? '',
      type: link.type,
    });
  }
  if (found.size === 0) {
    const fallback = new URL('/favicon.ico', doc.baseURI).href;
    found.set(fallback, { url: fallback, kind: 'icon', sizes: '', type: 'image/x-icon' });
  }
  return [...found.values()];
};

type ManifestIcon = { src?: unknown; sizes?: unknown; type?: unknown };

export const parseManifestIcons = (text: string, manifestUrl: string): FaviconEntry[] => {
  try {
    const manifest = JSON.parse(text) as { icons?: ManifestIcon[] };
    return (manifest.icons ?? []).flatMap((icon) =>
      typeof icon.src === 'string'
        ? [
            {
              url: new URL(icon.src, manifestUrl).href,
              kind: 'manifest' as const,
              sizes: typeof icon.sizes === 'string' ? icon.sizes : '',
              type: typeof icon.type === 'string' ? icon.type : '',
            },
          ]
        : [],
    );
  } catch {
    return [];
  }
};
