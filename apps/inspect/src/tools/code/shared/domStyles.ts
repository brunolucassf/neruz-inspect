import { isOverlayElement } from '../../../lib/picker';
import {
  diffComputed,
  hoverSubjectSelectors,
  type StyleMap,
  TRACKED_PROPERTIES,
} from './styleDiff';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

export const readTrackedStyles = (style: CSSStyleDeclaration): StyleMap => {
  const result: StyleMap = {};
  for (const name of TRACKED_PROPERTIES) result[name] = style.getPropertyValue(name).trim();
  return result;
};

export type DefaultsProvider = {
  get: (element: Element) => StyleMap;
  dispose: () => void;
};

export const createDefaultsProvider = (): DefaultsProvider => {
  const cache = new Map<string, StyleMap>();
  let frame: HTMLIFrameElement | null = null;

  const ensureFrame = (): Document | null => {
    if (frame?.contentDocument?.body) return frame.contentDocument;
    frame?.remove();
    frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.style.cssText =
      'position:fixed;left:-99999px;top:0;width:1200px;height:800px;visibility:hidden;border:0;pointer-events:none';
    document.documentElement.append(frame);
    return frame.contentDocument?.body ? frame.contentDocument : null;
  };

  const get = (element: Element): StyleMap => {
    const isSvg = element.namespaceURI === SVG_NAMESPACE;
    const key = `${isSvg ? 'svg:' : ''}${element.localName}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const frameDocument = ensureFrame();
    if (!frameDocument) return {};
    const probe = isSvg
      ? frameDocument.createElementNS(SVG_NAMESPACE, element.localName)
      : frameDocument.createElement(element.localName);
    frameDocument.body.append(probe);
    const view = frameDocument.defaultView;
    const defaults = view ? readTrackedStyles(view.getComputedStyle(probe)) : {};
    probe.remove();
    cache.set(key, defaults);
    return defaults;
  };

  const dispose = (): void => {
    frame?.remove();
    frame = null;
  };

  return { get, dispose };
};

export type FlatRule = {
  selectorText: string;
  style: CSSStyleDeclaration;
};

const MAX_RULES = 30_000;

const isMediaActive = (rule: CSSMediaRule): boolean => {
  try {
    return window.matchMedia(rule.conditionText || rule.media.mediaText).matches;
  } catch {
    return false;
  }
};

const collectRules = (rules: CSSRuleList, output: FlatRule[]): void => {
  for (const rule of Array.from(rules)) {
    if (output.length >= MAX_RULES) return;
    if (rule instanceof CSSStyleRule) {
      output.push({ selectorText: rule.selectorText, style: rule.style });
    } else if (rule instanceof CSSMediaRule) {
      if (isMediaActive(rule)) collectRules(rule.cssRules, output);
    } else if ('cssRules' in rule && rule.constructor.name !== 'CSSFontFaceRule') {
      collectRules((rule as CSSGroupingRule).cssRules, output);
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

export const buildRuleIndex = (): FlatRule[] => {
  const output: FlatRule[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    if (sheet.disabled) continue;
    const rules = readSheetRules(sheet);
    if (rules) collectRules(rules, output);
  }
  return output;
};

const safeMatches = (element: Element, selector: string): boolean => {
  try {
    return element.matches(selector);
  } catch {
    return false;
  }
};

const declaredProperties = (style: CSSStyleDeclaration): StyleMap => {
  const result: StyleMap = {};
  for (let index = 0; index < style.length; index += 1) {
    const name = style.item(index);
    result[name] = style.getPropertyValue(name).trim();
  }
  return result;
};

export type RuleLookup = {
  authored: Set<string>;
  hover: StyleMap;
  variables: Map<string, string>;
};

const VARIABLE_REFERENCE = /var\(\s*(--[\w-]+)/g;

export const lookupRules = (element: Element, rules: readonly FlatRule[]): RuleLookup => {
  const authored = new Set<string>();
  const hover: StyleMap = {};
  const variableNames = new Set<string>();
  const trackValue = (value: string): void => {
    for (const match of value.matchAll(VARIABLE_REFERENCE)) {
      if (match[1]) variableNames.add(match[1]);
    }
  };
  for (const rule of rules) {
    if (rule.selectorText.includes(':hover')) {
      const subjects = hoverSubjectSelectors(rule.selectorText);
      if (subjects.some((selector) => safeMatches(element, selector))) {
        Object.assign(hover, declaredProperties(rule.style));
        for (const value of Object.values(hover)) trackValue(value);
      }
      continue;
    }
    if (!safeMatches(element, rule.selectorText)) continue;
    const declared = declaredProperties(rule.style);
    for (const [name, value] of Object.entries(declared)) {
      authored.add(name);
      trackValue(value);
    }
  }
  const inline = (element as HTMLElement).style;
  if (inline) {
    for (const [name, value] of Object.entries(declaredProperties(inline))) {
      authored.add(name);
      trackValue(value);
    }
  }
  const computed = getComputedStyle(element);
  const variables = new Map<string, string>();
  for (const name of variableNames) {
    variables.set(name, computed.getPropertyValue(name).trim());
  }
  return { authored, hover, variables };
};

export const diffElementStyles = (
  element: Element,
  defaults: DefaultsProvider,
  authored: ReadonlySet<string>,
): StyleMap => {
  const parentElement = element.parentElement;
  return diffComputed({
    computed: readTrackedStyles(getComputedStyle(element)),
    defaults: defaults.get(element),
    parent:
      parentElement && !isOverlayElement(parentElement)
        ? readTrackedStyles(getComputedStyle(parentElement))
        : null,
    authored,
  });
};
