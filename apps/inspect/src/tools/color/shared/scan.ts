import { isOverlayElement } from '../../../lib/picker';

export const SCAN_ELEMENT_LIMIT = 5000;

const SKIPPED_TAGS = new Set([
  'script',
  'style',
  'link',
  'meta',
  'head',
  'title',
  'noscript',
  'template',
  'base',
]);

const SLICE_SIZE = 250;

export type ScanProgress = { scanned: number; total: number };

export type ScanOptions = {
  signal?: AbortSignal;
  onProgress?: (progress: ScanProgress) => void;
  limit?: number;
};

const waitForIdle = (): Promise<void> =>
  new Promise((resolve) => {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => resolve(), { timeout: 60 });
    } else {
      setTimeout(resolve, 0);
    }
  });

export const isRenderedElement = (element: Element, style: CSSStyleDeclaration): boolean => {
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

export const hasOwnText = (element: Element): boolean => {
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) return true;
  }
  return false;
};

export const scanElements = async (
  visit: (element: Element, style: CSSStyleDeclaration) => void,
  { signal, onProgress, limit = SCAN_ELEMENT_LIMIT }: ScanOptions = {},
): Promise<{ truncated: boolean }> => {
  const all = Array.from(document.querySelectorAll('*')).filter(
    (element) => !SKIPPED_TAGS.has(element.localName) && !isOverlayElement(element),
  );
  const truncated = all.length > limit;
  const targets = truncated ? all.slice(0, limit) : all;
  for (let index = 0; index < targets.length; index += 1) {
    if (signal?.aborted) return { truncated };
    const element = targets[index];
    if (element?.isConnected) {
      const style = getComputedStyle(element);
      if (isRenderedElement(element, style)) visit(element, style);
    }
    if ((index + 1) % SLICE_SIZE === 0) {
      onProgress?.({ scanned: index + 1, total: targets.length });
      await waitForIdle();
    }
  }
  onProgress?.({ scanned: targets.length, total: targets.length });
  return { truncated };
};
