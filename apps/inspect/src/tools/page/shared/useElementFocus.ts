import { useCallback, useState } from 'react';
import {
  getViewportRect,
  type HighlightItem,
  useHighlights,
  useViewportVersion,
} from '../../../lib/highlight';

type FocusTarget = { element: Element; label?: string };

const MAX_BOXES = 60;

const prefersReducedMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;

export const useElementFocus = () => {
  const [targets, setTargets] = useState<readonly FocusTarget[]>([]);
  useViewportVersion();

  const items: HighlightItem[] = [];
  for (const { element, label } of targets.slice(0, MAX_BOXES)) {
    if (!element.isConnected) continue;
    const rect = getViewportRect(element);
    if (rect.width <= 0 || rect.height <= 0) continue;
    items.push({ kind: 'box', rect });
    if (label) items.push({ kind: 'label', rect, text: label });
  }
  useHighlights(items);

  const focus = useCallback((elements: Element | readonly Element[], label?: string): void => {
    const list: readonly Element[] = elements instanceof Element ? [elements] : elements;
    const first = list[0];
    if (!first) return;
    first.scrollIntoView({
      block: 'center',
      inline: 'nearest',
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
    setTargets(list.map((element, index) => ({ element, label: index === 0 ? label : undefined })));
  }, []);

  const clear = useCallback(() => setTargets([]), []);

  return { focus, clear, activeCount: targets.length };
};
