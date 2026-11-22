import { checkHeadings } from '../seoMeta/analyzeSeo';
import { collapseWhitespace } from '../shared/format';
import type { Severity } from '../shared/severity';
import { evaluateContrast, isFocusRuleSuspicious, validateAria } from './a11yRules';

export type A11yRule =
  | 'imgAlt'
  | 'linkName'
  | 'buttonName'
  | 'inputLabel'
  | 'contrast'
  | 'headingOrder'
  | 'langMissing'
  | 'focusStyle'
  | 'ariaInvalid'
  | 'tabindexPositive';

export type A11yIssue = {
  id: string;
  rule: A11yRule;
  severity: Severity;
  detail: string;
  element: Element | null;
};

export type A11yResult = {
  issues: A11yIssue[];
  scanned: number;
  truncated: boolean;
  focusSheetsSkipped: number;
};

const MAX_ELEMENTS = 5000;
const MAX_CONTRAST_SAMPLES = 300;
const MAX_FOCUS_RULES = 40;

const isRendered = (element: Element): boolean => element.getClientRects().length > 0;

const textOfIds = (doc: Document, ids: string): string =>
  ids
    .split(/\s+/)
    .map((id) => collapseWhitespace(doc.getElementById(id)?.textContent ?? ''))
    .join(' ')
    .trim();

export const accessibleName = (element: Element, doc: Document): string => {
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const text = textOfIds(doc, labelledBy);
    if (text) return text;
  }
  const label = element.getAttribute('aria-label')?.trim();
  if (label) return label;
  if (element instanceof HTMLInputElement && ['button', 'submit', 'reset'].includes(element.type)) {
    if (element.value.trim()) return element.value.trim();
  }
  if (element instanceof HTMLInputElement && element.type === 'image') {
    return element.alt.trim() || element.title.trim();
  }
  const text = collapseWhitespace(element.textContent ?? '');
  if (text) return text;
  const imageAlt = element.querySelector('img[alt]')?.getAttribute('alt')?.trim();
  if (imageAlt) return imageAlt;
  const svgTitle = element.querySelector('svg title')?.textContent?.trim();
  if (svgTitle) return svgTitle;
  return element.getAttribute('title')?.trim() ?? '';
};

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';

const isFocusable = (element: Element): boolean =>
  element.matches(FOCUSABLE) &&
  element.getAttribute('tabindex') !== '-1' &&
  !element.hasAttribute('disabled');

const hasLabel = (
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  doc: Document,
): boolean => {
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy && textOfIds(doc, labelledBy)) return true;
  if (element.getAttribute('aria-label')?.trim()) return true;
  if (element.labels && element.labels.length > 0) return true;
  return Boolean(element.title.trim());
};

const backgroundLayers = (element: Element, view: Window): string[] | null => {
  const layers: string[] = [];
  for (let node: Element | null = element; node; node = node.parentElement) {
    const style = view.getComputedStyle(node);
    if (style.backgroundImage !== 'none') return null;
    const color = style.backgroundColor;
    if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
      layers.push(color);
      const alpha = /,\s*([\d.]+)\)$/.exec(color)?.[1];
      if (alpha === undefined || Number(alpha) >= 1) break;
    }
  }
  return layers;
};

const hasOwnText = (element: Element): boolean =>
  Array.from(element.childNodes).some(
    (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== '',
  );

export const analyzeA11y = (doc: Document): A11yResult => {
  const view = doc.defaultView ?? window;
  const issues: A11yIssue[] = [];
  let counter = 0;
  const add = (rule: A11yRule, severity: Severity, element: Element | null, detail = ''): void => {
    issues.push({ id: `a11y-${counter++}`, rule, severity, detail, element });
  };

  const all = Array.from(doc.querySelectorAll('body *'));
  const truncated = all.length > MAX_ELEMENTS;
  const elements = truncated ? all.slice(0, MAX_ELEMENTS) : all;
  const idExists = (id: string): boolean => doc.getElementById(id) !== null;
  const contrastSeen = new Map<string, A11yIssue>();
  const contrastCounts = new Map<string, number>();
  let contrastSamples = 0;

  if (!doc.documentElement.getAttribute('lang')?.trim())
    add('langMissing', 'error', doc.documentElement);

  for (const element of elements) {
    const tag = element.localName;
    const role = element.getAttribute('role');
    const rendered = isRendered(element);

    if (
      tag === 'img' &&
      !element.hasAttribute('alt') &&
      role !== 'presentation' &&
      role !== 'none'
    ) {
      add(
        'imgAlt',
        'error',
        element,
        (element as HTMLImageElement).currentSrc || (element as HTMLImageElement).src,
      );
    }

    const isLink = (tag === 'a' && element.hasAttribute('href')) || role === 'link';
    const isButton =
      tag === 'button' ||
      role === 'button' ||
      (tag === 'input' &&
        ['button', 'submit', 'reset', 'image'].includes((element as HTMLInputElement).type));
    if ((isLink || isButton) && rendered && element.getAttribute('aria-hidden') !== 'true') {
      if (!accessibleName(element, doc)) add(isLink ? 'linkName' : 'buttonName', 'error', element);
    }

    if (tag === 'input' || tag === 'select' || tag === 'textarea') {
      const field = element as HTMLInputElement;
      const skipped =
        tag === 'input' && ['hidden', 'submit', 'button', 'reset', 'image'].includes(field.type);
      if (!skipped && rendered && !hasLabel(field, doc)) {
        add('inputLabel', field.placeholder ? 'warning' : 'error', element, field.placeholder);
      }
    }

    const tabindex = Number(element.getAttribute('tabindex'));
    if (element.hasAttribute('tabindex') && Number.isFinite(tabindex) && tabindex > 0) {
      add('tabindexPositive', 'warning', element, `tabindex="${tabindex}"`);
    }

    const ariaAttributes = Array.from(element.attributes).filter((attr) =>
      attr.name.startsWith('aria-'),
    );
    if (role || ariaAttributes.length > 0) {
      for (const issue of validateAria({
        attributes: ariaAttributes.map((attr) => ({ name: attr.name, value: attr.value })),
        role,
        focusable: isFocusable(element),
        idExists,
      })) {
        add(
          'ariaInvalid',
          issue.kind === 'invalidAttribute' ? 'warning' : 'error',
          element,
          `${issue.kind}: ${issue.detail}`,
        );
      }
    }

    if (contrastSamples < MAX_CONTRAST_SAMPLES && rendered && hasOwnText(element)) {
      contrastSamples += 1;
      const style = view.getComputedStyle(element);
      if (style.visibility === 'hidden' || style.opacity === '0') continue;
      const layers = backgroundLayers(element, view);
      if (!layers) continue;
      const fontSize = Number.parseFloat(style.fontSize);
      const verdict = evaluateContrast(
        style.color,
        layers,
        fontSize,
        Number(style.fontWeight) || 400,
      );
      if (!verdict || verdict.passes) continue;
      const key = `${style.color}|${layers.join('+')}|${fontSize}`;
      contrastCounts.set(key, (contrastCounts.get(key) ?? 0) + 1);
      if (!contrastSeen.has(key)) {
        const issue: A11yIssue = {
          id: `a11y-${counter++}`,
          rule: 'contrast',
          severity: 'warning',
          detail: `${verdict.ratio.toFixed(2)}:1 / ${verdict.required}:1`,
          element,
        };
        contrastSeen.set(key, issue);
        issues.push(issue);
      }
    }
  }

  for (const [key, issue] of contrastSeen) {
    const count = contrastCounts.get(key) ?? 1;
    if (count > 1) issue.detail = `${issue.detail} ×${count}`;
  }

  const headings = Array.from(doc.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6')).map(
    (element) => ({
      level: Number(element.localName.slice(1)),
      text: collapseWhitespace(element.textContent ?? ''),
      element,
    }),
  );
  for (const issue of checkHeadings(headings)) {
    if (issue.kind === 'noH1') add('headingOrder', 'error', null, 'h1');
    else if (issue.kind === 'multipleH1')
      add(
        'headingOrder',
        'warning',
        headings.filter((h) => h.level === 1)[1]?.element ?? null,
        `h1 ×${issue.count}`,
      );
    else if (issue.kind === 'skip')
      add(
        'headingOrder',
        'warning',
        headings[issue.index]?.element ?? null,
        `h${issue.from} → h${issue.to}`,
      );
    else add('headingOrder', 'warning', headings[issue.index]?.element ?? null, 'empty');
  }

  let focusSheetsSkipped = 0;
  let focusRules = 0;
  for (const sheet of Array.from(doc.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      focusSheetsSkipped += 1;
      continue;
    }
    for (const rule of Array.from(rules)) {
      if (focusRules >= MAX_FOCUS_RULES) break;
      if (!(rule instanceof CSSStyleRule) || !/:focus(?!-within)/.test(rule.selectorText)) continue;
      const { style } = rule;
      const suspicious = isFocusRuleSuspicious({
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outline: style.getPropertyValue('outline'),
        boxShadow: style.boxShadow,
        border: style.border,
      });
      if (!suspicious) continue;
      focusRules += 1;
      let target: Element | null = null;
      try {
        target = doc.querySelector(rule.selectorText.replace(/:focus(-visible)?/g, ''));
      } catch {}
      add('focusStyle', 'warning', target, rule.selectorText);
    }
  }

  return { issues, scanned: elements.length, truncated, focusSheetsSkipped };
};
