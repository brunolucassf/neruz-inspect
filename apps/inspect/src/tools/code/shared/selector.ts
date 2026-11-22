export type SelectorNode = {
  tag: string;
  id: string;
  classes: readonly string[];
  index: number;
  siblingsWithSameTag: number;
  parent: SelectorNode | null;
};

const UNSTABLE_CLASS_PATTERNS: readonly RegExp[] = [
  /^(css|sc|jsx|svelte|emotion|astro|chakra|styled|_)[-_]/i,
  /\d{3,}/,
  /^[a-z]+_[A-Za-z0-9]{5,}$/,
  /^[A-Za-z0-9]{1,2}$/,
];

const UNSTABLE_ID_PATTERNS: readonly RegExp[] = [/^:r/, /^\d/, /\d{4,}/, /^[a-f0-9]{8,}$/i];

const SAFE_IDENTIFIER = /^-?[A-Za-z_][A-Za-z0-9_-]*$/;

export const isStableClass = (name: string): boolean =>
  SAFE_IDENTIFIER.test(name) &&
  name.length <= 32 &&
  !UNSTABLE_CLASS_PATTERNS.some((pattern) => pattern.test(name));

export const isStableId = (id: string): boolean =>
  SAFE_IDENTIFIER.test(id) && !UNSTABLE_ID_PATTERNS.some((pattern) => pattern.test(id));

const MAX_CLASSES_PER_SEGMENT = 2;

const buildSegment = (node: SelectorNode, withIndex: boolean): string => {
  const classes = node.classes.filter(isStableClass).slice(0, MAX_CLASSES_PER_SEGMENT);
  const base = `${node.tag}${classes.map((name) => `.${name}`).join('')}`;
  if (withIndex && node.siblingsWithSameTag > 1) return `${base}:nth-of-type(${node.index})`;
  return base;
};

export const buildSelector = (
  node: SelectorNode,
  isUnique: (selector: string) => boolean,
): string => {
  if (node.id && isStableId(node.id)) {
    const byId = `#${node.id}`;
    if (isUnique(byId)) return byId;
  }
  const segments: string[] = [];
  let current: SelectorNode | null = node;
  let lastCandidate = '';
  while (current) {
    if (current.id && isStableId(current.id) && current !== node) {
      const anchor = `#${current.id}`;
      if (isUnique(anchor)) {
        segments.unshift(anchor);
        const anchored = segments.join(' > ');
        if (isUnique(anchored)) return anchored;
        lastCandidate = anchored;
        break;
      }
    }
    const plain = buildSegment(current, false);
    const trial = [plain, ...segments].join(' > ');
    if (isUnique(trial)) return trial;
    segments.unshift(buildSegment(current, true));
    lastCandidate = segments.join(' > ');
    if (isUnique(lastCandidate)) return lastCandidate;
    current = current.parent;
  }
  return lastCandidate;
};

export const toSelectorNode = (element: Element): SelectorNode => {
  const parentElement = element.parentElement;
  let index = 1;
  let siblingsWithSameTag = 1;
  if (parentElement) {
    const sameTag = Array.from(parentElement.children).filter(
      (sibling) => sibling.localName === element.localName,
    );
    siblingsWithSameTag = sameTag.length;
    index = sameTag.indexOf(element) + 1;
  }
  return {
    tag: element.localName,
    id: element.id,
    classes: Array.from(element.classList),
    index,
    siblingsWithSameTag,
    parent:
      parentElement && parentElement !== document.documentElement
        ? toSelectorNode(parentElement)
        : null,
  };
};

export const selectorFor = (element: Element): string => {
  if (element === document.documentElement) return 'html';
  return buildSelector(toSelectorNode(element), (selector) => {
    try {
      return document.querySelectorAll(selector).length === 1;
    } catch {
      return false;
    }
  });
};
