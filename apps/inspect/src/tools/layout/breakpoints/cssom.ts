import { parseMediaWidths, type WidthCondition } from './breakpoints';

export type MediaScan = { conditions: WidthCondition[]; blockedSheets: number };

const MAX_NESTING = 8;

const readRules = (sheet: CSSStyleSheet): CSSRuleList | null => {
  try {
    return sheet.cssRules;
  } catch {
    return null;
  }
};

const hasNestedRules = (rule: CSSRule): rule is CSSGroupingRule => 'cssRules' in rule;

export const scanMediaQueries = (): MediaScan => {
  const conditions: WidthCondition[] = [];
  let blockedSheets = 0;
  const visited = new Set<CSSStyleSheet>();

  const collect = (mediaText: string): void => {
    if (mediaText) conditions.push(...parseMediaWidths(mediaText));
  };

  const walkRules = (rules: CSSRuleList, nesting: number): void => {
    if (nesting > MAX_NESTING) return;
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSImportRule) {
        collect(rule.media.mediaText);
        if (rule.styleSheet) walkSheet(rule.styleSheet, nesting + 1);
      } else if (rule instanceof CSSMediaRule) {
        collect(rule.media.mediaText);
        walkRules(rule.cssRules, nesting + 1);
      } else if (hasNestedRules(rule)) {
        walkRules(rule.cssRules, nesting + 1);
      }
    }
  };

  const walkSheet = (sheet: CSSStyleSheet, nesting: number): void => {
    if (visited.has(sheet)) return;
    visited.add(sheet);
    collect(sheet.media.mediaText);
    const rules = readRules(sheet);
    if (!rules) {
      blockedSheets += 1;
      return;
    }
    walkRules(rules, nesting);
  };

  for (const sheet of Array.from(document.styleSheets)) walkSheet(sheet, 0);
  for (const sheet of document.adoptedStyleSheets) walkSheet(sheet, 0);

  return { conditions, blockedSheets };
};
