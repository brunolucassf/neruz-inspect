import { collectFavicons } from '../shared/favicons';
import { fileNameFromUrl } from '../shared/format';
import type { Severity } from '../shared/severity';

export type AssetCategory = 'image' | 'background' | 'svg' | 'video' | 'favicon';

export type ImageFormat =
  | 'jpeg'
  | 'png'
  | 'gif'
  | 'webp'
  | 'avif'
  | 'svg'
  | 'bmp'
  | 'ico'
  | 'unknown';

const EXTENSION_FORMATS: Record<string, ImageFormat> = {
  jpg: 'jpeg',
  jpeg: 'jpeg',
  jpe: 'jpeg',
  png: 'png',
  gif: 'gif',
  webp: 'webp',
  avif: 'avif',
  svg: 'svg',
  bmp: 'bmp',
  ico: 'ico',
};

export const detectFormat = (url: string, mime = ''): ImageFormat => {
  const dataMatch = /^data:image\/([a-z0-9.+-]+)/i.exec(url);
  const source = dataMatch?.[1] ?? mime.replace(/^image\//, '');
  if (source) {
    const normalized = source.toLowerCase().replace('svg+xml', 'svg').replace('x-icon', 'ico');
    const known = EXTENSION_FORMATS[normalized];
    if (known) return known;
  }
  if (url.startsWith('data:')) return 'unknown';
  try {
    const extension = new URL(url, 'https://x.test').pathname.split('.').pop()?.toLowerCase() ?? '';
    return EXTENSION_FORMATS[extension] ?? 'unknown';
  } catch {
    return 'unknown';
  }
};

export type AssessInput = {
  category: AssetCategory;
  isImgElement: boolean;
  format: ImageFormat;
  naturalWidth: number;
  naturalHeight: number;
  displayWidth: number;
  displayHeight: number;
  devicePixelRatio: number;
  bytes: number | null;
  hasDimensionAttributes: boolean;
  loading: string;
  aboveFold: boolean;
  alt: string | null;
};

export type AssetAlertId =
  | 'oversized'
  | 'noDimensions'
  | 'noLazy'
  | 'legacyFormat'
  | 'noAlt'
  | 'heavy';

export type AssetAlert = {
  id: AssetAlertId;
  severity: Severity;
  params?: Record<string, string | number>;
};

export const OVERSIZE_RATIO = 1.5;
export const HEAVY_BYTES = 500 * 1024;
const LEGACY_FORMATS: readonly ImageFormat[] = ['jpeg', 'png', 'gif', 'bmp'];
const LEGACY_MIN_BYTES = 10 * 1024;

export const assessImage = (input: AssessInput): AssetAlert[] => {
  const alerts: AssetAlert[] = [];
  const scale = Math.max(input.devicePixelRatio, 1);
  const isBitmap = input.format !== 'svg' && input.category !== 'svg';

  if (
    isBitmap &&
    input.displayWidth > 0 &&
    input.naturalWidth > input.displayWidth * scale * OVERSIZE_RATIO
  ) {
    alerts.push({
      id: 'oversized',
      severity: 'warning',
      params: {
        natural: `${input.naturalWidth}×${input.naturalHeight}`,
        shown: `${Math.round(input.displayWidth)}×${Math.round(input.displayHeight)}`,
      },
    });
  }
  if (input.isImgElement && !input.hasDimensionAttributes) {
    alerts.push({ id: 'noDimensions', severity: 'warning' });
  }
  if (input.isImgElement && !input.aboveFold && input.loading !== 'lazy') {
    alerts.push({ id: 'noLazy', severity: 'info' });
  }
  if (
    isBitmap &&
    LEGACY_FORMATS.includes(input.format) &&
    (input.bytes === null || input.bytes > LEGACY_MIN_BYTES)
  ) {
    alerts.push({ id: 'legacyFormat', severity: 'info', params: { format: input.format } });
  }
  if (input.isImgElement && input.alt === null) {
    alerts.push({ id: 'noAlt', severity: 'warning' });
  }
  if (input.bytes !== null && input.bytes > HEAVY_BYTES) {
    alerts.push({ id: 'heavy', severity: 'warning' });
  }
  return alerts;
};

type TimingLike = {
  transferSize?: number;
  encodedBodySize?: number;
  decodedBodySize?: number;
};

export const bytesFromTiming = (entry: TimingLike): number | null => {
  const size = entry.transferSize || entry.encodedBodySize || entry.decodedBodySize || 0;
  return size > 0 ? size : null;
};

export type AssetItem = {
  id: string;
  category: AssetCategory;
  name: string;
  url: string;
  thumbnail: string;
  format: ImageFormat;
  input: AssessInput;
  alerts: AssetAlert[];
  svgMarkup: string | null;
  srcsetCount: number;
  element: Element | null;
};

export type AssetsResult = { items: AssetItem[]; truncated: boolean };

const MAX_BACKGROUND_SCAN = 3000;
const MAX_ITEMS_PER_CATEGORY = 300;

const resourceBytes = (): Map<string, number> => {
  const map = new Map<string, number>();
  for (const entry of performance.getEntriesByType('resource')) {
    const bytes = bytesFromTiming(entry as PerformanceResourceTiming);
    if (bytes !== null) map.set(entry.name, bytes);
  }
  return map;
};

export const serializeSvg = (svg: Element): string => {
  const clone = svg.cloneNode(true) as SVGElement;
  if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  return new XMLSerializer().serializeToString(clone);
};

export const svgDataUrl = (markup: string): string =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;

const parseBackgroundUrls = (value: string): string[] =>
  Array.from(value.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/g), (match) => match[2] ?? '').filter(
    Boolean,
  );

export const analyzeAssets = (doc: Document): AssetsResult => {
  const view = doc.defaultView ?? window;
  const weights = resourceBytes();
  const dpr = view.devicePixelRatio || 1;
  const fold = view.innerHeight;
  const items: AssetItem[] = [];
  let truncated = false;
  let counter = 0;

  const push = (partial: Omit<AssetItem, 'id' | 'alerts' | 'name'> & { name?: string }): void => {
    const id = `asset-${counter++}`;
    items.push({
      ...partial,
      id,
      name: partial.name ?? fileNameFromUrl(partial.url, partial.category),
      alerts: assessImage(partial.input),
    });
  };

  const baseInput = (
    category: AssetCategory,
    format: ImageFormat,
    bytes: number | null,
  ): AssessInput => ({
    category,
    isImgElement: false,
    format,
    naturalWidth: 0,
    naturalHeight: 0,
    displayWidth: 0,
    displayHeight: 0,
    devicePixelRatio: dpr,
    bytes,
    hasDimensionAttributes: true,
    loading: '',
    aboveFold: true,
    alt: '',
  });

  const images = Array.from(doc.images);
  if (images.length > MAX_ITEMS_PER_CATEGORY) truncated = true;
  for (const image of images.slice(0, MAX_ITEMS_PER_CATEGORY)) {
    const url = image.currentSrc || image.src;
    if (!url) continue;
    const rect = image.getBoundingClientRect();
    const format = detectFormat(url);
    const input: AssessInput = {
      ...baseInput('image', format, weights.get(url) ?? null),
      isImgElement: true,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      displayWidth: rect.width,
      displayHeight: rect.height,
      hasDimensionAttributes: image.hasAttribute('width') && image.hasAttribute('height'),
      loading: image.loading,
      aboveFold: rect.top < fold,
      alt: image.getAttribute('alt'),
    };
    push({
      category: 'image',
      url,
      thumbnail: url,
      format,
      input,
      svgMarkup: null,
      srcsetCount: (image.getAttribute('srcset') ?? '').split(',').filter((part) => part.trim())
        .length,
      element: image,
    });
  }

  const svgRoots = Array.from(doc.querySelectorAll('svg')).filter(
    (svg) => !svg.parentElement?.closest('svg') && !svg.closest('symbol, defs'),
  );
  for (const svg of svgRoots.slice(0, MAX_ITEMS_PER_CATEGORY)) {
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    const markup = serializeSvg(svg);
    const input: AssessInput = {
      ...baseInput('svg', 'svg', new Blob([markup]).size),
      displayWidth: rect.width,
      displayHeight: rect.height,
      aboveFold: rect.top < fold,
    };
    push({
      category: 'svg',
      name: `${svg.getAttribute('aria-label') || svg.id || 'inline'}.svg`,
      url: '',
      thumbnail: svgDataUrl(markup),
      format: 'svg',
      input,
      svgMarkup: markup,
      srcsetCount: 0,
      element: svg,
    });
  }

  const seenBackgrounds = new Set<string>();
  const candidates = Array.from(doc.querySelectorAll<HTMLElement>('body *')).slice(
    0,
    MAX_BACKGROUND_SCAN,
  );
  if (doc.querySelectorAll('body *').length > MAX_BACKGROUND_SCAN) truncated = true;
  for (const element of candidates) {
    const background = view.getComputedStyle(element).backgroundImage;
    if (!background || background === 'none') continue;
    for (const raw of parseBackgroundUrls(background)) {
      let url = raw;
      try {
        url = new URL(raw, doc.baseURI).href;
      } catch {}
      if (seenBackgrounds.has(url)) continue;
      seenBackgrounds.add(url);
      const rect = element.getBoundingClientRect();
      const format = detectFormat(url);
      push({
        category: 'background',
        url,
        thumbnail: url,
        format,
        input: {
          ...baseInput('background', format, weights.get(url) ?? null),
          displayWidth: rect.width,
          displayHeight: rect.height,
          aboveFold: rect.top < fold,
        },
        svgMarkup: null,
        srcsetCount: 0,
        element,
      });
    }
  }

  for (const video of doc.querySelectorAll('video')) {
    const url = video.currentSrc || video.src || video.querySelector('source')?.src || '';
    const rect = video.getBoundingClientRect();
    push({
      category: 'video',
      url,
      thumbnail: video.poster,
      format: 'unknown',
      input: {
        ...baseInput('video', 'unknown', url ? (weights.get(url) ?? null) : null),
        naturalWidth: video.videoWidth,
        naturalHeight: video.videoHeight,
        displayWidth: rect.width,
        displayHeight: rect.height,
      },
      svgMarkup: null,
      srcsetCount: 0,
      element: video,
    });
  }

  for (const favicon of collectFavicons(doc)) {
    const format = detectFormat(favicon.url, favicon.type);
    push({
      category: 'favicon',
      url: favicon.url,
      thumbnail: favicon.url,
      format,
      input: baseInput('favicon', format, weights.get(favicon.url) ?? null),
      svgMarkup: null,
      srcsetCount: 0,
      element: null,
    });
  }

  return { items, truncated };
};
