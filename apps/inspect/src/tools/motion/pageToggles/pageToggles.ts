import { isOverlayElement } from '../../../lib/picker';

export const TOGGLE_IDS = ['cssOff', 'hideMedia', 'stopMotion', 'reducedMotion'] as const;
export type ToggleId = (typeof TOGGLE_IDS)[number];

export const HIDE_MEDIA_CSS = `img, picture, video, canvas, object, embed {
  visibility: hidden !important;
}
* {
  background-image: none !important;
}`;

export const STOP_MOTION_CSS = `*, *::before, *::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0s !important;
  transition-delay: 0s !important;
  scroll-behavior: auto !important;
}`;

const OWN_ATTRIBUTE = 'data-neruz-toggle';
const REDUCE_CONDITION = /prefers-reduced-motion\s*:\s*reduce/i;

export const isReducedMotionCondition = (conditionText: string): boolean =>
  REDUCE_CONDITION.test(conditionText);

const collectReducedMotionRules = (rules: CSSRuleList, output: string[]): void => {
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSMediaRule) {
      const condition = rule.conditionText || rule.media.mediaText;
      if (isReducedMotionCondition(condition)) {
        for (const inner of Array.from(rule.cssRules)) output.push(inner.cssText);
      } else collectReducedMotionRules(rule.cssRules, output);
    } else if ('cssRules' in rule) {
      collectReducedMotionRules((rule as CSSGroupingRule).cssRules, output);
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

export const readPageReducedMotionRules = (): string[] => {
  const output: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    if (sheet.ownerNode instanceof Element && sheet.ownerNode.hasAttribute(OWN_ATTRIBUTE)) continue;
    const rules = readSheetRules(sheet);
    if (rules) collectReducedMotionRules(rules, output);
  }
  return output;
};

export type PageToggles = {
  set: (id: ToggleId, enabled: boolean) => void;
  isOn: (id: ToggleId) => boolean;
  reducedRulesApplied: () => number;
  dispose: () => void;
};

const isOwnSheetNode = (node: Node | null): boolean =>
  node instanceof Element && node.hasAttribute(OWN_ATTRIBUTE);

type InjectedStyle = { remove: () => void };

const injectStyle = (css: string, ownSheets: CSSStyleSheet[]): InjectedStyle => {
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    ownSheets.push(sheet);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    return {
      remove: () => {
        const index = ownSheets.indexOf(sheet);
        if (index >= 0) ownSheets.splice(index, 1);
        document.adoptedStyleSheets = document.adoptedStyleSheets.filter((item) => item !== sheet);
      },
    };
  } catch {
    const element = document.createElement('style');
    element.setAttribute(OWN_ATTRIBUTE, '');
    element.textContent = css;
    (document.head ?? document.documentElement).append(element);
    return { remove: () => element.remove() };
  }
};

export const createPageToggles = (): PageToggles => {
  const active = new Set<ToggleId>();
  const injected = new Map<ToggleId, InjectedStyle>();
  const ownSheets: CSSStyleSheet[] = [];
  const disabledSheets = new Set<CSSStyleSheet>();
  const strippedInline = new Map<Element, string>();
  let pageAdopted: CSSStyleSheet[] = [];
  let observer: MutationObserver | null = null;
  let frame = 0;
  let reducedRules = 0;

  const disablePageCss = (): void => {
    for (const sheet of Array.from(document.styleSheets)) {
      if (sheet.disabled || isOwnSheetNode(sheet.ownerNode)) continue;
      sheet.disabled = true;
      disabledSheets.add(sheet);
    }
    for (const element of Array.from(document.querySelectorAll('[style]'))) {
      if (isOverlayElement(element) || strippedInline.has(element)) continue;
      const value = element.getAttribute('style');
      if (value === null) continue;
      strippedInline.set(element, value);
      element.removeAttribute('style');
    }
  };

  const startCssOff = (): void => {
    pageAdopted = document.adoptedStyleSheets.filter((sheet) => !ownSheets.includes(sheet));
    document.adoptedStyleSheets = [...ownSheets];
    disablePageCss();
    observer = new MutationObserver(() => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        disablePageCss();
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  };

  const stopCssOff = (): void => {
    observer?.disconnect();
    observer = null;
    cancelAnimationFrame(frame);
    frame = 0;
    for (const sheet of disabledSheets) sheet.disabled = false;
    disabledSheets.clear();
    for (const [element, value] of strippedInline) {
      if (!element.hasAttribute('style')) element.setAttribute('style', value);
    }
    strippedInline.clear();
    document.adoptedStyleSheets = [...pageAdopted, ...ownSheets];
    pageAdopted = [];
  };

  const enable = (id: ToggleId): void => {
    if (id === 'cssOff') startCssOff();
    else if (id === 'hideMedia') injected.set(id, injectStyle(HIDE_MEDIA_CSS, ownSheets));
    else if (id === 'stopMotion') injected.set(id, injectStyle(STOP_MOTION_CSS, ownSheets));
    else {
      const pageRules = readPageReducedMotionRules();
      reducedRules = pageRules.length;
      injected.set(id, injectStyle(`${pageRules.join('\n')}\n${STOP_MOTION_CSS}`, ownSheets));
    }
  };

  const disable = (id: ToggleId): void => {
    if (id === 'cssOff') stopCssOff();
    else {
      injected.get(id)?.remove();
      injected.delete(id);
      if (id === 'reducedMotion') reducedRules = 0;
    }
  };

  const set = (id: ToggleId, enabled: boolean): void => {
    if (enabled === active.has(id)) return;
    if (enabled) {
      enable(id);
      active.add(id);
    } else {
      disable(id);
      active.delete(id);
    }
  };

  return {
    set,
    isOn: (id) => active.has(id),
    reducedRulesApplied: () => reducedRules,
    dispose: () => {
      for (const id of Array.from(active)) set(id, false);
    },
  };
};
