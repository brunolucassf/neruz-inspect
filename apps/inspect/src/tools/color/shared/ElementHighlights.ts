import { getViewportRect, type HighlightItem } from '../../../lib/highlight';

const MAX_HIGHLIGHTED = 80;

export const buildElementHighlights = (
  elements: readonly Element[],
  labelText?: string,
): HighlightItem[] => {
  const items: HighlightItem[] = [];
  let labelled = false;
  for (const element of elements.slice(0, MAX_HIGHLIGHTED)) {
    if (!element.isConnected) continue;
    const rect = getViewportRect(element);
    const visible =
      rect.width > 0 &&
      rect.height > 0 &&
      rect.y < window.innerHeight &&
      rect.x < window.innerWidth &&
      rect.y + rect.height > 0 &&
      rect.x + rect.width > 0;
    if (!visible) continue;
    items.push({ kind: 'box', rect });
    if (labelText && !labelled) {
      items.push({ kind: 'label', rect, text: labelText });
      labelled = true;
    }
  }
  return items;
};

export const revealFirstOffscreen = (elements: readonly Element[]): void => {
  const first = elements.find((element) => element.isConnected);
  if (!first) return;
  const rect = first.getBoundingClientRect();
  const inView = rect.bottom > 0 && rect.top < window.innerHeight;
  if (!inView) first.scrollIntoView({ block: 'center', behavior: 'auto' });
};
