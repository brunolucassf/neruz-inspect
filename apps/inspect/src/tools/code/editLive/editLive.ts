import { parseCssColor, toHex } from '../../../lib/color';

export type StyleChangeGroup = { selector: string; declarations: Readonly<Record<string, string>> };

export type TextChange = { selector: string; before: string; after: string };

export const formatStyleChangesCss = (groups: readonly StyleChangeGroup[]): string =>
  groups
    .filter((group) => Object.keys(group.declarations).length > 0)
    .map((group) => {
      const lines = Object.entries(group.declarations).map(
        ([property, value]) => `  ${property}: ${value};`,
      );
      return `${group.selector} {\n${lines.join('\n')}\n}`;
    })
    .join('\n\n');

export const formatTextChanges = (changes: readonly TextChange[]): string =>
  changes
    .map((change) => `${change.selector}\n- ${change.before.trim()}\n+ ${change.after.trim()}`)
    .join('\n\n');

export const colorToInputValue = (value: string): string => {
  const parsed = parseCssColor(value);
  if (!parsed) return '#000000';
  return toHex({ ...parsed, a: 1 });
};

export const parsePxInput = (raw: string): number | null => {
  if (raw.trim() === '') return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

export const readUniformPx = (values: readonly string[]): number | null => {
  const first = values[0];
  if (first === undefined || values.some((value) => value !== first)) return null;
  const parsed = Number.parseFloat(first);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null;
};

export const hasTextChanged = (before: string, after: string): boolean =>
  before.replace(/\s+/g, ' ').trim() !== after.replace(/\s+/g, ' ').trim();
