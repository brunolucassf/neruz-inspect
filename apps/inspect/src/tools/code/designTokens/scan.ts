import { isOverlayElement } from '../../../lib/picker';
import { type ColorUsage, extractBreakpoints, type RawScan } from './tokens';

export const MAX_SCANNED_ELEMENTS = 5000;

const SLICE_SIZE = 250;
const SKIPPED_TAGS: ReadonlySet<string> = new Set([
  'script',
  'style',
  'link',
  'meta',
  'head',
  'title',
  'noscript',
  'template',
]);

const scheduleIdle = (callback: () => void): void => {
  if (typeof requestIdleCallback === 'function') requestIdleCallback(() => callback());
  else setTimeout(callback, 0);
};

const parsePxValue = (value: string): number => {
  if (!value.endsWith('px')) return Number.NaN;
  return Number.parseFloat(value);
};

const increment = <TKey>(map: Map<TKey, number>, key: TKey, amount = 1): void => {
  map.set(key, (map.get(key) ?? 0) + amount);
};

type MutableScan = {
  colors: Map<string, ColorUsage>;
  fontFamilies: Map<string, number>;
  fontSizes: Map<number, number>;
  spacing: Map<number, number>;
  radii: Map<number, number>;
  shadows: Map<string, number>;
  breakpoints: Map<number, number>;
  containers: Map<number, number>;
};

const addColor = (
  colors: Map<string, ColorUsage>,
  value: string,
  role: 'text' | 'background' | 'border',
  weight: number,
): void => {
  if (!value || value === 'rgba(0, 0, 0, 0)' || value === 'transparent') return;
  const usage = colors.get(value) ?? { value, text: 0, background: 0, border: 0 };
  usage[role] += weight;
  colors.set(value, usage);
};

const hasOwnText = (element: Element): boolean =>
  Array.from(element.childNodes).some(
    (child) => child.nodeType === Node.TEXT_NODE && (child.textContent ?? '').trim() !== '',
  );

const areaWeight = (element: Element): number => {
  const { width, height } = element.getBoundingClientRect();
  return Math.min(200, 1 + Math.floor((width * height) / 20_000));
};

const SPACING_PROPERTIES = [
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'row-gap',
  'column-gap',
] as const;

const scanElement = (element: Element, scan: MutableScan): void => {
  const style = getComputedStyle(element);
  if (style.display === 'none') return;

  if (hasOwnText(element)) {
    addColor(scan.colors, style.color, 'text', 1);
    increment(scan.fontFamilies, style.fontFamily);
    const size = Number.parseFloat(style.fontSize);
    if (Number.isFinite(size)) increment(scan.fontSizes, size);
  }

  const background = style.backgroundColor;
  if (background && background !== 'rgba(0, 0, 0, 0)') {
    addColor(scan.colors, background, 'background', areaWeight(element));
  }

  if (style.borderTopStyle !== 'none' && Number.parseFloat(style.borderTopWidth) > 0) {
    addColor(scan.colors, style.borderTopColor, 'border', 1);
  }

  for (const property of SPACING_PROPERTIES) {
    const value = parsePxValue(style.getPropertyValue(property));
    if (value > 0) increment(scan.spacing, value);
  }

  const radius = parsePxValue(style.borderTopLeftRadius);
  if (radius > 0) increment(scan.radii, radius);

  if (style.boxShadow && style.boxShadow !== 'none') increment(scan.shadows, style.boxShadow);

  const maxWidth = parsePxValue(style.maxWidth);
  if (maxWidth >= 480) increment(scan.containers, maxWidth);
};

const collectMediaConditions = (rules: CSSRuleList, scan: MutableScan): void => {
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSMediaRule) {
      for (const breakpoint of extractBreakpoints(rule.conditionText || rule.media.mediaText)) {
        increment(scan.breakpoints, breakpoint);
      }
      collectMediaConditions(rule.cssRules, scan);
    } else if ('cssRules' in rule) {
      collectMediaConditions((rule as CSSGroupingRule).cssRules, scan);
    }
  }
};

const readSheetRules = (sheet: CSSStyleSheet): CSSRuleList | null => {
  try {
    return sheet.cssRules;
  } catch {
    return null;
  }
};

const scanBreakpoints = (scan: MutableScan): void => {
  for (const sheet of Array.from(document.styleSheets)) {
    const rules = readSheetRules(sheet);
    if (rules) collectMediaConditions(rules, scan);
  }
};

export type ScanResult = { scan: RawScan; scannedElements: number; limited: boolean };

export type ScanHandle = { promise: Promise<ScanResult>; cancel: () => void };

export const scanPage = (onProgress: (ratio: number) => void): ScanHandle => {
  let cancelled = false;
  const promise = new Promise<ScanResult>((resolve, reject) => {
    const scan: MutableScan = {
      colors: new Map(),
      fontFamilies: new Map(),
      fontSizes: new Map(),
      spacing: new Map(),
      radii: new Map(),
      shadows: new Map(),
      breakpoints: new Map(),
      containers: new Map(),
    };
    const all = Array.from(document.querySelectorAll('*')).filter(
      (element) => !SKIPPED_TAGS.has(element.localName) && !isOverlayElement(element),
    );
    const limited = all.length > MAX_SCANNED_ELEMENTS;
    const elements = all.slice(0, MAX_SCANNED_ELEMENTS);
    let cursor = 0;
    const step = (): void => {
      if (cancelled) {
        reject(new DOMException('cancelled', 'AbortError'));
        return;
      }
      try {
        const end = Math.min(cursor + SLICE_SIZE, elements.length);
        for (; cursor < end; cursor += 1) {
          const element = elements[cursor];
          if (element) scanElement(element, scan);
        }
        onProgress(elements.length === 0 ? 1 : cursor / elements.length);
        if (cursor < elements.length) {
          scheduleIdle(step);
          return;
        }
        scanBreakpoints(scan);
        resolve({ scan, scannedElements: elements.length, limited });
      } catch (cause) {
        reject(cause);
      }
    };
    scheduleIdle(step);
  });
  return {
    promise,
    cancel: () => {
      cancelled = true;
    },
  };
};
