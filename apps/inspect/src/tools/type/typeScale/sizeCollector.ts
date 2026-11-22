import { hasOwnText } from '../../color/shared/scan';

export type SizeEntry = {
  size: number;
  count: number;
  tags: string[];
  elements: Element[];
};

const MAX_ELEMENTS_PER_SIZE = 200;
const MAX_TAGS_SHOWN = 3;

export class SizeCollector {
  private readonly bySize = new Map<
    number,
    { count: number; tags: Map<string, number>; elements: Element[] }
  >();

  add(element: Element, style: CSSStyleDeclaration): void {
    if (!hasOwnText(element)) return;
    const size = Math.round(Number.parseFloat(style.fontSize) * 100) / 100;
    if (!(size > 0)) return;
    const entry = this.bySize.get(size) ?? {
      count: 0,
      tags: new Map<string, number>(),
      elements: [] as Element[],
    };
    entry.count += 1;
    entry.tags.set(element.localName, (entry.tags.get(element.localName) ?? 0) + 1);
    if (entry.elements.length < MAX_ELEMENTS_PER_SIZE) entry.elements.push(element);
    this.bySize.set(size, entry);
  }

  build(): SizeEntry[] {
    return [...this.bySize.entries()]
      .map(([size, { count, tags, elements }]) => ({
        size,
        count,
        tags: [...tags.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, MAX_TAGS_SHOWN)
          .map(([tag]) => tag),
        elements,
      }))
      .sort((a, b) => b.size - a.size);
  }
}
