import { hasOwnText } from '../../color/shared/scan';
import {
  type CollectedFontSources,
  classifyForFamily,
  createFamilyProbe,
  type FamilyProbe,
  type FontSource,
  inferRenderedFamily,
  parseFontFamilyList,
  type RenderedFamily,
} from '../shared/fonts';

export type FontUsage = {
  family: string;
  source: FontSource;
  count: number;
  weights: number[];
  elements: Element[];
};

const MAX_ELEMENTS_PER_FAMILY = 200;

export class FontCollector {
  private readonly probe: FamilyProbe = createFamilyProbe();
  private readonly renderedByDeclaration = new Map<string, RenderedFamily>();
  private readonly byFamily = new Map<
    string,
    { rendered: RenderedFamily; count: number; weights: Set<number>; elements: Element[] }
  >();

  constructor(private readonly sources: CollectedFontSources) {}

  add(element: Element, style: CSSStyleDeclaration): void {
    if (!hasOwnText(element)) return;
    const declaration = style.fontFamily;
    let rendered = this.renderedByDeclaration.get(declaration);
    if (!rendered) {
      rendered = inferRenderedFamily(parseFontFamilyList(declaration), this.probe);
      this.renderedByDeclaration.set(declaration, rendered);
    }
    const key = rendered.family.toLowerCase();
    const entry = this.byFamily.get(key) ?? {
      rendered,
      count: 0,
      weights: new Set<number>(),
      elements: [],
    };
    entry.count += 1;
    const weight = Number.parseInt(style.fontWeight, 10);
    if (Number.isFinite(weight)) entry.weights.add(weight);
    if (entry.elements.length < MAX_ELEMENTS_PER_FAMILY) entry.elements.push(element);
    this.byFamily.set(key, entry);
  }

  build(): FontUsage[] {
    return [...this.byFamily.values()]
      .map(({ rendered, count, weights, elements }) => ({
        family: rendered.family,
        source: classifyForFamily(rendered, this.sources),
        count,
        weights: [...weights].sort((a, b) => a - b),
        elements,
      }))
      .sort((a, b) => b.count - a.count);
  }
}
