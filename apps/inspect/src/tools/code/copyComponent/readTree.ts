import {
  buildRuleIndex,
  createDefaultsProvider,
  type DefaultsProvider,
  diffElementStyles,
  lookupRules,
} from '../shared/domStyles';
import type { ElementNode } from './htmlTree';

export const MAX_NODES = 1500;
export const MAX_OUTPUT_CHARS = 60_000;

const SKIPPED_TAGS: ReadonlySet<string> = new Set([
  'script',
  'style',
  'noscript',
  'template',
  'link',
  'meta',
  'iframe',
]);

const REPLACED_TAGS: ReadonlySet<string> = new Set(['img', 'video', 'canvas', 'svg', 'picture']);

export type ReadTreeResult = {
  root: ElementNode;
  truncated: boolean;
};

const readAttributes = (element: Element): Record<string, string> => {
  const attrs: Record<string, string> = {};
  for (const attribute of Array.from(element.attributes)) attrs[attribute.name] = attribute.value;
  if (element instanceof HTMLImageElement && element.currentSrc) attrs.src = element.currentSrc;
  return attrs;
};

export const readComponentTree = (rootElement: Element): ReadTreeResult => {
  const defaults: DefaultsProvider = createDefaultsProvider();
  const rootAuthored = lookupRules(rootElement, buildRuleIndex()).authored;
  let visited = 0;
  let truncated = false;

  const readElement = (element: Element, isRoot: boolean): ElementNode => {
    visited += 1;
    const isSvg = element.localName === 'svg' || element.namespaceURI?.endsWith('/svg') === true;
    const isInsideSvg = isSvg && element.localName !== 'svg';
    const authored = new Set<string>(isRoot ? rootAuthored : []);
    if (REPLACED_TAGS.has(element.localName) && !isInsideSvg) {
      authored.add('width');
      authored.add('height');
    }
    const node: ElementNode = {
      kind: 'element',
      tag: element.localName,
      attrs: readAttributes(element),
      styles: isInsideSvg ? {} : diffElementStyles(element, defaults, authored),
      children: [],
    };
    for (const child of Array.from(element.childNodes)) {
      if (visited >= MAX_NODES) {
        truncated = true;
        break;
      }
      if (child instanceof Text) {
        if (child.data.trim() !== '' || child.data.includes(' ')) {
          node.children.push({ kind: 'text', text: child.data });
        }
      } else if (child instanceof Element && !SKIPPED_TAGS.has(child.localName)) {
        node.children.push(readElement(child, false));
      }
    }
    return node;
  };

  const root = readElement(rootElement, true);
  defaults.dispose();
  return { root, truncated };
};
