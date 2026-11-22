import { serializeSvg, svgDataUrl } from '../assets/analyzeAssets';
import { collectFavicons, type FaviconEntry } from '../shared/favicons';
import {
  cleanSvgMarkup,
  detectIconLibraries,
  type IconLibrary,
  type IconSignals,
} from './detectIconLibraries';

export type PageIcon = {
  id: string;
  name: string;
  markup: string;
  preview: string;
  width: number;
  height: number;
  element: Element | null;
};

export type IconsResult = {
  libraries: IconLibrary[];
  icons: PageIcon[];
  favicons: FaviconEntry[];
  truncated: boolean;
};

const MAX_SCAN_ELEMENTS = 5000;
const MAX_ICONS = 200;
const MAX_ICON_SIZE = 96;
const MAX_SIGNAL_CLASSES = 4000;

export const collectIconSignals = (doc: Document): { signals: IconSignals; truncated: boolean } => {
  const all = doc.querySelectorAll('body *, head link, head script');
  const classes = new Set<string>();
  const attributes = new Set<string>();
  const tags = new Set<string>();
  const spriteRefs = new Set<string>();
  const limit = Math.min(all.length, MAX_SCAN_ELEMENTS);

  for (let index = 0; index < limit; index++) {
    const element = all[index] as Element;
    for (const name of element.classList) {
      if (classes.size < MAX_SIGNAL_CLASSES) classes.add(name);
    }
    for (const attr of ['data-lucide', 'data-feather', 'data-prefix', 'data-icon']) {
      if (element.hasAttribute(attr)) attributes.add(attr);
    }
    if (element.getAttribute('data-slot') === 'icon') attributes.add('data-slot=icon');
    if (element.localName.includes('-')) tags.add(element.localName);
    if (element.localName === 'use') {
      const ref = element.getAttribute('href') ?? element.getAttribute('xlink:href');
      if (ref) spriteRefs.add(ref);
    }
  }

  const fonts: string[] = [];
  doc.fonts?.forEach((face) => {
    fonts.push(face.family.replace(/^["']|["']$/g, ''));
  });

  const resources = new Set<string>();
  for (const link of doc.querySelectorAll<HTMLLinkElement>('link[href]')) resources.add(link.href);
  for (const script of doc.querySelectorAll<HTMLScriptElement>('script[src]')) {
    resources.add(script.src);
  }
  for (const entry of performance.getEntriesByType('resource')) {
    const type = (entry as PerformanceResourceTiming).initiatorType;
    if (type === 'css' || type === 'link' || type === 'script') resources.add(entry.name);
  }

  return {
    signals: {
      classes: [...classes],
      attributes: [...attributes],
      tags: [...tags],
      fonts,
      resources: [...resources],
      spriteRefs: [...spriteRefs],
    },
    truncated: all.length > MAX_SCAN_ELEMENTS,
  };
};

const symbolToSvg = (symbol: Element, doc: Document): SVGElement => {
  const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const viewBox = symbol.getAttribute('viewBox');
  if (viewBox) svg.setAttribute('viewBox', viewBox);
  for (const child of Array.from(symbol.childNodes)) svg.append(child.cloneNode(true));
  return svg;
};

export const analyzeIcons = (doc: Document): IconsResult => {
  const { signals, truncated } = collectIconSignals(doc);
  const icons: PageIcon[] = [];
  const seen = new Set<string>();

  const add = (
    svg: Element,
    name: string,
    element: Element | null,
    width: number,
    height: number,
  ): void => {
    if (icons.length >= MAX_ICONS) return;
    const markup = cleanSvgMarkup(serializeSvg(svg));
    if (seen.has(markup)) return;
    seen.add(markup);
    icons.push({
      id: `icon-${icons.length}`,
      name,
      markup,
      preview: svgDataUrl(markup),
      width,
      height,
      element,
    });
  };

  for (const svg of doc.querySelectorAll('svg')) {
    if (svg.parentElement?.closest('svg') || svg.closest('symbol, defs')) continue;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (rect.width > MAX_ICON_SIZE || rect.height > MAX_ICON_SIZE) continue;
    const name =
      svg.getAttribute('aria-label') ||
      svg.querySelector('title')?.textContent?.trim() ||
      svg.getAttribute('data-icon') ||
      `${Math.round(rect.width)}px`;
    add(svg, name, svg, rect.width, rect.height);
  }

  for (const symbol of doc.querySelectorAll('symbol[id]')) {
    add(symbolToSvg(symbol, doc), symbol.id, null, 0, 0);
  }

  return {
    libraries: detectIconLibraries(signals),
    icons,
    favicons: collectFavicons(doc),
    truncated,
  };
};
