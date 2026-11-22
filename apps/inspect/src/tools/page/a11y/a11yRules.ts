import { compositeOver, contrastWcag, parseCssColor } from '../../../lib/color';

const BASE_ROLES = [
  'alert',
  'alertdialog',
  'application',
  'article',
  'banner',
  'blockquote',
  'button',
  'caption',
  'cell',
  'checkbox',
  'code',
  'columnheader',
  'combobox',
  'complementary',
  'contentinfo',
  'definition',
  'deletion',
  'dialog',
  'directory',
  'document',
  'emphasis',
  'feed',
  'figure',
  'form',
  'generic',
  'grid',
  'gridcell',
  'group',
  'heading',
  'img',
  'insertion',
  'link',
  'list',
  'listbox',
  'listitem',
  'log',
  'main',
  'marquee',
  'math',
  'menu',
  'menubar',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'meter',
  'navigation',
  'none',
  'note',
  'option',
  'paragraph',
  'presentation',
  'progressbar',
  'radio',
  'radiogroup',
  'region',
  'row',
  'rowgroup',
  'rowheader',
  'scrollbar',
  'search',
  'searchbox',
  'separator',
  'slider',
  'spinbutton',
  'status',
  'strong',
  'subscript',
  'superscript',
  'switch',
  'tab',
  'table',
  'tablist',
  'tabpanel',
  'term',
  'textbox',
  'time',
  'timer',
  'toolbar',
  'tooltip',
  'tree',
  'treegrid',
  'treeitem',
] as const;

const VALID_ROLES: ReadonlySet<string> = new Set(BASE_ROLES);

const ARIA_ATTRIBUTES = [
  'activedescendant',
  'atomic',
  'autocomplete',
  'braillelabel',
  'brailleroledescription',
  'busy',
  'checked',
  'colcount',
  'colindex',
  'colindextext',
  'colspan',
  'controls',
  'current',
  'describedby',
  'description',
  'details',
  'disabled',
  'dropeffect',
  'errormessage',
  'expanded',
  'flowto',
  'grabbed',
  'haspopup',
  'hidden',
  'invalid',
  'keyshortcuts',
  'label',
  'labelledby',
  'level',
  'live',
  'modal',
  'multiline',
  'multiselectable',
  'orientation',
  'owns',
  'placeholder',
  'posinset',
  'pressed',
  'readonly',
  'relevant',
  'required',
  'roledescription',
  'rowcount',
  'rowindex',
  'rowindextext',
  'rowspan',
  'selected',
  'setsize',
  'sort',
  'valuemax',
  'valuemin',
  'valuenow',
  'valuetext',
] as const;

const VALID_ARIA_ATTRIBUTES: ReadonlySet<string> = new Set(
  ARIA_ATTRIBUTES.map((name) => `aria-${name}`),
);

const REFERENCE_ATTRIBUTES = ['aria-labelledby', 'aria-describedby'] as const;

export const isValidRole = (role: string): boolean =>
  VALID_ROLES.has(role) || role.startsWith('doc-') || role.startsWith('graphics-');

export type AriaIssueKind =
  | 'invalidRole'
  | 'invalidAttribute'
  | 'missingReference'
  | 'hiddenFocusable';

export type AriaIssue = { kind: AriaIssueKind; detail: string };

export type AriaInput = {
  attributes: readonly { name: string; value: string }[];
  role: string | null;
  focusable: boolean;
  idExists: (id: string) => boolean;
};

export const validateAria = (input: AriaInput): AriaIssue[] => {
  const issues: AriaIssue[] = [];
  if (input.role) {
    const tokens = input.role.trim().toLowerCase().split(/\s+/);
    if (!tokens.some(isValidRole)) issues.push({ kind: 'invalidRole', detail: input.role });
  }
  for (const { name, value } of input.attributes) {
    const lowered = name.toLowerCase();
    if (!lowered.startsWith('aria-')) continue;
    if (!VALID_ARIA_ATTRIBUTES.has(lowered)) {
      issues.push({ kind: 'invalidAttribute', detail: lowered });
      continue;
    }
    if ((REFERENCE_ATTRIBUTES as readonly string[]).includes(lowered)) {
      const missing = value.split(/\s+/).filter((id) => id && !input.idExists(id));
      if (missing.length > 0) {
        issues.push({ kind: 'missingReference', detail: `${lowered}="${missing.join(' ')}"` });
      }
    }
    if (lowered === 'aria-hidden' && value === 'true' && input.focusable) {
      issues.push({ kind: 'hiddenFocusable', detail: 'aria-hidden="true"' });
    }
  }
  return issues;
};

export type FocusRuleStyle = {
  outlineStyle: string;
  outlineWidth: string;
  outline: string;
  boxShadow: string;
  border: string;
};

const isZeroLength = (value: string): boolean => /^0(px|em|rem)?$/.test(value.trim());

export const isFocusRuleSuspicious = (style: FocusRuleStyle): boolean => {
  const outlineRemoved =
    style.outlineStyle === 'none' ||
    isZeroLength(style.outlineWidth) ||
    /^(none|0)(\s|$)/.test(style.outline.trim());
  if (!outlineRemoved) return false;
  const hasShadow = style.boxShadow !== '' && style.boxShadow !== 'none';
  return !hasShadow && style.border === '';
};

export type ContrastVerdict = { ratio: number; required: number; passes: boolean };

const LARGE_TEXT_PX = 24;
const LARGE_BOLD_TEXT_PX = 18.66;

export const isLargeText = (fontSizePx: number, fontWeight: number): boolean =>
  fontSizePx >= LARGE_TEXT_PX || (fontSizePx >= LARGE_BOLD_TEXT_PX && fontWeight >= 700);

export const evaluateContrast = (
  textColor: string,
  backgroundLayers: readonly string[],
  fontSizePx: number,
  fontWeight: number,
): ContrastVerdict | null => {
  const text = parseCssColor(textColor);
  if (!text) return null;
  let surface = { r: 255, g: 255, b: 255, a: 1 };
  for (const layer of [...backgroundLayers].reverse()) {
    const parsed = parseCssColor(layer);
    if (!parsed) return null;
    surface = compositeOver(parsed, surface);
  }
  const ratio = contrastWcag(text, surface);
  const required = isLargeText(fontSizePx, fontWeight) ? 3 : 4.5;
  return { ratio, required, passes: ratio >= required };
};
