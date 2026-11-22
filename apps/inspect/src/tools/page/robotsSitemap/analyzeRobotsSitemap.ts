import type { TextReader } from '../shared/readers';
import {
  type BlockVerdict,
  isPathBlocked,
  type ParsedSitemap,
  parseRobots,
  parseSitemap,
  type RobotsFile,
} from './parseRobots';

export const CHECKED_AGENTS = ['*', 'Googlebot', 'Bingbot'] as const;

export type RobotsState =
  | { found: false; status: number | null }
  | { found: true; status: number; file: RobotsFile; raw: string };

export type SitemapState = {
  url: string;
  status: number | null;
  parsed: ParsedSitemap | null;
  gzipped: boolean;
};

export type RobotsSitemapResult = {
  origin: string;
  robotsUrl: string;
  robots: RobotsState;
  currentPath: string;
  verdicts: { agent: string; verdict: BlockVerdict }[];
  sitemaps: SitemapState[];
};

const MAX_DECLARED_SITEMAPS = 5;

export const loadSitemap = async (url: string, readText: TextReader): Promise<SitemapState> => {
  if (/\.gz(\?|$)/i.test(url)) return { url, status: null, parsed: null, gzipped: true };
  const response = await readText(url);
  if (!response) return { url, status: null, parsed: null, gzipped: false };
  return {
    url,
    status: response.status,
    parsed: response.ok ? parseSitemap(response.text) : null,
    gzipped: false,
  };
};

export const analyzeRobotsSitemap = async (
  doc: Document,
  readText: TextReader,
): Promise<RobotsSitemapResult> => {
  const location = new URL(doc.URL);
  const origin = location.origin;
  const robotsUrl = `${origin}/robots.txt`;
  const currentPath = `${location.pathname}${location.search}`;

  const response = await readText(robotsUrl);
  const looksLikeRobots = response?.ok && !/^\s*<(!doctype|html)/i.test(response.text);
  const robots: RobotsState =
    response && looksLikeRobots
      ? {
          found: true,
          status: response.status,
          file: parseRobots(response.text),
          raw: response.text,
        }
      : { found: false, status: response?.status ?? null };

  const declared = robots.found ? robots.file.sitemaps : [];
  const sitemapUrls = (declared.length > 0 ? declared : [`${origin}/sitemap.xml`]).slice(
    0,
    MAX_DECLARED_SITEMAPS,
  );
  const sitemaps = await Promise.all(sitemapUrls.map((url) => loadSitemap(url, readText)));

  const verdicts = robots.found
    ? CHECKED_AGENTS.map((agent) => ({
        agent,
        verdict: isPathBlocked(robots.file, currentPath, agent),
      }))
    : [];

  return { origin, robotsUrl, robots, currentPath, verdicts, sitemaps };
};
