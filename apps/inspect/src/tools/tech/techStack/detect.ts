import { SIGNATURES } from './signatures';
import {
  type Confidence,
  type DetailRule,
  type DetectedTech,
  type ResponseHeaders,
  type Signal,
  TECH_CATEGORIES,
  type TechCategory,
  type TechDetail,
  type TechProbeArgs,
  type TechSignature,
  type TechSnapshot,
} from './types';

const MAX_SCORE = 100;
const HIGH_SCORE = 80;
const MEDIUM_SCORE = 50;
const IMPLIED_SCORE = 40;
const VERSION_PATTERN = /\d+(?:\.\d+){0,3}(?:[-+][0-9A-Za-z.-]+)?/;
const MAX_VERSION_LENGTH = 40;
const MAX_EVIDENCE_LENGTH = 90;

const patternCache = new Map<string, RegExp>();

const compile = (pattern: string): RegExp => {
  const cached = patternCache.get(pattern);
  if (cached) return cached;
  const created = new RegExp(pattern, 'i');
  patternCache.set(pattern, created);
  return created;
};

export const selectorKey = (css: string, attr?: string): string => `${css}@${attr ?? ''}`;

export const parseVersion = (raw: string | undefined): string | undefined => {
  if (!raw || raw.length > MAX_VERSION_LENGTH) return undefined;
  return VERSION_PATTERN.exec(raw)?.[0];
};

const segmentCount = (version: string): number => version.split('.').length;

export const pickVersion = (candidates: readonly (string | undefined)[]): string | undefined => {
  let best: string | undefined;
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (!best || segmentCount(candidate) > segmentCount(best)) best = candidate;
  }
  return best;
};

export const confidenceFromScore = (score: number): Confidence => {
  if (score >= HIGH_SCORE) return 'high';
  if (score >= MEDIUM_SCORE) return 'medium';
  return 'low';
};

export const buildProbeArgs = (
  signatures: readonly TechSignature[] = SIGNATURES,
): TechProbeArgs => {
  const globals = new Set<string>();
  const selectors = new Map<string, { css: string; attr?: string }>();
  const domKeys = new Set<string>();
  const cssVars = new Set<string>();
  for (const signature of signatures) {
    for (const signal of signature.signals) {
      if (signal.kind === 'global') {
        globals.add(signal.path);
        if (signal.version) globals.add(signal.version);
      } else if (signal.kind === 'selector') {
        selectors.set(selectorKey(signal.css, signal.versionAttr), {
          css: signal.css,
          ...(signal.versionAttr ? { attr: signal.versionAttr } : {}),
        });
      } else if (signal.kind === 'domKey') {
        domKeys.add(signal.prefix);
      } else if (signal.kind === 'cssVar') {
        cssVars.add(signal.name);
      }
    }
    for (const detail of signature.details ?? []) {
      if (detail.source === 'global') globals.add(detail.path);
    }
  }
  return {
    globals: [...globals],
    selectors: [...selectors.values()],
    domKeys: [...domKeys],
    cssVars: [...cssVars],
  };
};

type MatchContext = { snapshot: TechSnapshot; headers: ResponseHeaders };

type SignalMatch = { version?: string; evidence: string };

const shorten = (value: string): string =>
  value.length > MAX_EVIDENCE_LENGTH ? `${value.slice(0, MAX_EVIDENCE_LENGTH)}…` : value;

const matchUrls = (
  urls: readonly string[],
  pattern: string,
  label: string,
): SignalMatch | undefined => {
  const expression = compile(pattern);
  for (const url of urls) {
    const found = expression.exec(url);
    if (!found) continue;
    const version = parseVersion(found[1]);
    return { evidence: `${label} ${shorten(url)}`, ...(version ? { version } : {}) };
  }
  return undefined;
};

const matchTextValue = (
  value: string | undefined,
  pattern: string | undefined,
  label: string,
): SignalMatch | undefined => {
  if (value === undefined) return undefined;
  if (!pattern) return { evidence: label };
  const found = compile(pattern).exec(value);
  if (!found) return undefined;
  const version = parseVersion(found[1]);
  return { evidence: `${label}: ${shorten(value)}`, ...(version ? { version } : {}) };
};

const matchSignal = (
  signal: Signal,
  { snapshot, headers }: MatchContext,
): SignalMatch | undefined => {
  switch (signal.kind) {
    case 'global': {
      if (snapshot.globals[signal.path] === undefined) return undefined;
      const raw = signal.version ? snapshot.globals[signal.version] : undefined;
      const version = typeof raw === 'string' ? parseVersion(raw) : undefined;
      return { evidence: `window.${signal.path}`, ...(version ? { version } : {}) };
    }
    case 'selector': {
      const value = snapshot.selectors[selectorKey(signal.css, signal.versionAttr)];
      if (value === undefined) return undefined;
      const version = typeof value === 'string' ? parseVersion(value) : undefined;
      return { evidence: signal.css, ...(version ? { version } : {}) };
    }
    case 'domKey':
      return snapshot.domKeys.includes(signal.prefix)
        ? { evidence: `DOM ${signal.prefix}` }
        : undefined;
    case 'cssVar':
      return snapshot.cssVars.includes(signal.name) ? { evidence: signal.name } : undefined;
    case 'meta': {
      for (const entry of snapshot.meta) {
        if (entry.name !== signal.name) continue;
        const found = matchTextValue(entry.content, signal.pattern, `meta ${signal.name}`);
        if (found) return found;
      }
      return undefined;
    }
    case 'script':
      return matchUrls(snapshot.scripts, signal.pattern, 'script');
    case 'link':
      return matchUrls(snapshot.links, signal.pattern, 'link');
    case 'asset':
      return (
        matchUrls(snapshot.scripts, signal.pattern, 'script') ??
        matchUrls(snapshot.links, signal.pattern, 'link') ??
        matchUrls(snapshot.images, signal.pattern, 'image')
      );
    case 'class': {
      const expression = compile(signal.pattern);
      let count = 0;
      for (const token of snapshot.classTokens) {
        if (expression.test(token)) count += 1;
        if (count >= signal.min) return { evidence: `class ${signal.pattern}` };
      }
      return undefined;
    }
    case 'header':
      return matchTextValue(headers[signal.name], signal.pattern, `header ${signal.name}`);
    case 'serviceWorker':
      return snapshot.serviceWorker ? { evidence: 'service worker' } : undefined;
  }
};

const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const extractDetails = (rules: readonly DetailRule[], snapshot: TechSnapshot): TechDetail[] => {
  const details: TechDetail[] = [];
  const urls = [...snapshot.scripts, ...snapshot.links, ...snapshot.images];
  for (const rule of rules) {
    if (rule.source === 'global') {
      const value = snapshot.globals[rule.path];
      if (typeof value === 'string' && value) details.push({ label: rule.label, value });
      continue;
    }
    const expression = compile(rule.pattern);
    const seen = new Set<string>();
    for (const url of urls) {
      const value = expression.exec(url)?.[1];
      if (!value || seen.has(value)) continue;
      seen.add(value);
      details.push({ label: rule.label, value: safeDecode(value) });
      if (seen.size >= rule.max) break;
    }
  }
  return details;
};

const formatVersion = (
  version: string | undefined,
  template: string | undefined,
): string | undefined => (version && template ? template.replace('{v}', version) : version);

const evaluate = (signature: TechSignature, context: MatchContext): DetectedTech | undefined => {
  let score = 0;
  const evidence: string[] = [];
  const versions: (string | undefined)[] = [];
  for (const signal of signature.signals) {
    const match = matchSignal(signal, context);
    if (!match) continue;
    score += signal.weight;
    evidence.push(match.evidence);
    versions.push(match.version);
  }
  if (evidence.length === 0) return undefined;
  const capped = Math.min(score, MAX_SCORE);
  return {
    id: signature.id,
    name: signature.name,
    category: signature.category,
    website: signature.website,
    version: formatVersion(pickVersion(versions), signature.versionTemplate),
    score: capped,
    confidence: confidenceFromScore(capped),
    evidence,
    details: extractDetails(signature.details ?? [], context.snapshot),
    implied: false,
  };
};

const categoryRank = (category: TechCategory): number => TECH_CATEGORIES.indexOf(category);

const lowerCaseKeys = (headers: ResponseHeaders): ResponseHeaders =>
  Object.fromEntries(Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]));

export const detectTechnologies = (
  snapshot: TechSnapshot,
  headers: ResponseHeaders = {},
  signatures: readonly TechSignature[] = SIGNATURES,
): DetectedTech[] => {
  const context: MatchContext = { snapshot, headers: lowerCaseKeys(headers) };
  const found = new Map<string, DetectedTech>();
  for (const signature of signatures) {
    const result = evaluate(signature, context);
    if (result) found.set(signature.id, result);
  }
  const byId = new Map(signatures.map((signature) => [signature.id, signature]));
  for (const detected of [...found.values()]) {
    for (const impliedId of byId.get(detected.id)?.implies ?? []) {
      const target = byId.get(impliedId);
      if (!target || found.has(impliedId)) continue;
      found.set(impliedId, {
        id: target.id,
        name: target.name,
        category: target.category,
        website: target.website,
        version: undefined,
        score: IMPLIED_SCORE,
        confidence: confidenceFromScore(IMPLIED_SCORE),
        evidence: [`implied by ${detected.name}`],
        details: extractDetails(target.details ?? [], snapshot),
        implied: true,
      });
    }
  }
  return [...found.values()].sort(
    (a, b) =>
      categoryRank(a.category) - categoryRank(b.category) ||
      b.score - a.score ||
      a.name.localeCompare(b.name),
  );
};

export type TechGroup = { category: TechCategory; items: DetectedTech[] };

export const groupByCategory = (list: readonly DetectedTech[]): TechGroup[] =>
  TECH_CATEGORIES.map((category) => ({
    category,
    items: list.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);
