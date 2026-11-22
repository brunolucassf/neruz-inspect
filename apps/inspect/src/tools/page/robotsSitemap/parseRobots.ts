export type RobotsRule = { type: 'allow' | 'disallow'; path: string };

export type RobotsGroup = {
  agents: string[];
  rules: RobotsRule[];
  crawlDelay: number | null;
};

export type RobotsFile = { groups: RobotsGroup[]; sitemaps: string[] };

export const parseRobots = (text: string): RobotsFile => {
  const groups: RobotsGroup[] = [];
  const sitemaps: string[] = [];
  let current: RobotsGroup | null = null;
  let collectingAgents = false;

  for (const rawLine of text.replace(/^﻿/, '').split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    const separator = line.indexOf(':');
    if (separator < 1) continue;
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (field === 'sitemap') {
      if (value) sitemaps.push(value);
      continue;
    }
    if (field === 'user-agent') {
      if (!current || !collectingAgents) {
        current = { agents: [], rules: [], crawlDelay: null };
        groups.push(current);
      }
      current.agents.push(value);
      collectingAgents = true;
      continue;
    }
    if (!current) continue;
    collectingAgents = false;
    if (field === 'allow' || field === 'disallow') current.rules.push({ type: field, path: value });
    else if (field === 'crawl-delay') {
      const delay = Number(value);
      if (Number.isFinite(delay)) current.crawlDelay = delay;
    }
  }
  return { groups, sitemaps };
};

const patternToRegExp = (pattern: string): RegExp => {
  const anchored = pattern.endsWith('$');
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${body}${anchored ? '$' : ''}`);
};

export type BlockVerdict = {
  blocked: boolean;
  rule: RobotsRule | null;
  matchedAgent: string | null;
};

const groupsForAgent = (file: RobotsFile, agent: string) => {
  const token = agent.toLowerCase();
  const specific = file.groups.filter((group) =>
    group.agents.some((name) => name !== '*' && token.includes(name.toLowerCase())),
  );
  if (specific.length > 0) return { groups: specific, matchedAgent: agent };
  const wildcard = file.groups.filter((group) => group.agents.includes('*'));
  return { groups: wildcard, matchedAgent: wildcard.length > 0 ? '*' : null };
};

export const isPathBlocked = (file: RobotsFile, path: string, agent = '*'): BlockVerdict => {
  const { groups, matchedAgent } = groupsForAgent(file, agent);
  let best: RobotsRule | null = null;
  for (const rule of groups.flatMap((group) => group.rules)) {
    if (rule.path === '') continue;
    if (!patternToRegExp(rule.path).test(path)) continue;
    const longer = !best || rule.path.length > best.path.length;
    const tieAllows = best && rule.path.length === best.path.length && rule.type === 'allow';
    if (longer || tieAllows) best = rule;
  }
  return { blocked: best?.type === 'disallow', rule: best, matchedAgent };
};

export type SitemapEntry = { loc: string; lastmod: string };

export type ParsedSitemap = {
  kind: 'index' | 'urlset' | 'unknown';
  entries: SitemapEntry[];
};

const decodeXml = (value: string): string =>
  value
    .replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();

const readTag = (block: string, tag: string): string => {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i').exec(block);
  return match?.[1] ? decodeXml(match[1]) : '';
};

export const parseSitemap = (xml: string): ParsedSitemap => {
  const isIndex = /<sitemapindex[\s>]/i.test(xml);
  const isUrlset = /<urlset[\s>]/i.test(xml);
  if (!isIndex && !isUrlset) return { kind: 'unknown', entries: [] };
  const tag = isIndex ? 'sitemap' : 'url';
  const blocks = xml.match(new RegExp(`<${tag}[\\s>][\\s\\S]*?</${tag}>`, 'gi')) ?? [];
  const entries = blocks
    .map((block) => ({ loc: readTag(block, 'loc'), lastmod: readTag(block, 'lastmod') }))
    .filter((entry) => entry.loc !== '');
  return { kind: isIndex ? 'index' : 'urlset', entries };
};
