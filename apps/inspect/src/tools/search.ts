import type { Translate } from '../lib/i18n';
import type { ToolModule } from './types';

export const normalizeText = (value: string): string =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export type ToolSearchEntry = {
  tool: ToolModule;
  name: string;
  description: string;
  haystackName: string;
  haystackKeywords: string;
  haystackDescription: string;
};

export const buildSearchIndex = (
  tools: readonly ToolModule[],
  translate: Translate,
): ToolSearchEntry[] =>
  tools.map((tool) => {
    const prefix = `${tool.group}.${tool.id}`;
    const name = translate(`${prefix}.name`);
    const description = translate(`${prefix}.desc`);
    return {
      tool,
      name,
      description,
      haystackName: normalizeText(name),
      haystackKeywords: normalizeText(translate(`${prefix}.keywords`)),
      haystackDescription: normalizeText(description),
    };
  });

const scoreTerm = (entry: ToolSearchEntry, term: string): number => {
  if (entry.haystackName.startsWith(term)) return 100;
  if (entry.haystackName.split(/\s+/).some((word) => word.startsWith(term))) return 80;
  if (entry.haystackName.includes(term)) return 60;
  if (entry.haystackKeywords.includes(term)) return 40;
  if (entry.haystackDescription.includes(term)) return 20;
  return 0;
};

export const searchTools = (
  index: readonly ToolSearchEntry[],
  query: string,
): ToolSearchEntry[] => {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  const scored: { entry: ToolSearchEntry; score: number; order: number }[] = [];
  index.forEach((entry, order) => {
    const scores = terms.map((term) => scoreTerm(entry, term));
    if (scores.some((score) => score === 0)) return;
    scored.push({ entry, score: scores.reduce((sum, score) => sum + score, 0), order });
  });
  return scored.sort((a, b) => b.score - a.score || a.order - b.order).map((item) => item.entry);
};
