export const GENERIC_FAMILIES: ReadonlySet<string> = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'ui-rounded',
  'math',
  'emoji',
  'fangsong',
]);

export const stripQuotes = (name: string): string =>
  name
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();

export const parseFontFamilyList = (value: string): string[] => {
  const families: string[] = [];
  let quote = '';
  let current = '';
  for (const char of value) {
    if (quote) {
      if (char === quote) quote = '';
      current += char;
    } else if (char === '"' || char === "'") {
      quote = char;
      current += char;
    } else if (char === ',') {
      families.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  families.push(current);
  return families.map(stripQuotes).filter(Boolean);
};

export type FamilyKind = 'webfont' | 'system' | 'generic' | 'unknown';

export type RenderedFamily = {
  family: string;
  kind: FamilyKind;
  declared: string;
  fellBack: boolean;
};

export type FamilyProbe = {
  isWebFontLoaded: (family: string) => boolean;
  isInstalled: (family: string) => boolean;
};

export const inferRenderedFamily = (
  declaredFamilies: readonly string[],
  probe: FamilyProbe,
): RenderedFamily => {
  const declared = declaredFamilies[0] ?? 'serif';
  const finish = (family: string, kind: FamilyKind): RenderedFamily => ({
    family,
    kind,
    declared,
    fellBack: family.toLowerCase() !== declared.toLowerCase(),
  });
  for (const family of declaredFamilies) {
    if (GENERIC_FAMILIES.has(family.toLowerCase())) return finish(family.toLowerCase(), 'generic');
    if (probe.isWebFontLoaded(family)) return finish(family, 'webfont');
    if (probe.isInstalled(family)) return finish(family, 'system');
  }
  return finish('serif', 'unknown');
};

export type FontSource = 'google' | 'adobe' | 'selfHosted' | 'system' | 'generic';

export type SourceHints = {
  googleFamilies: ReadonlySet<string>;
  faceUrls: readonly string[];
  hasAdobeLink: boolean;
};

const GOOGLE_HOST = /fonts\.(?:gstatic|googleapis)\.com/i;
const ADOBE_HOST = /(?:use|p)\.typekit\.net|fonts\.adobe\.com/i;

export const classifyFontSource = (
  { family, kind }: Pick<RenderedFamily, 'family' | 'kind'>,
  hints: SourceHints,
): FontSource => {
  if (kind === 'generic' || kind === 'unknown') return 'generic';
  if (kind === 'system') return 'system';
  if (
    hints.googleFamilies.has(family.toLowerCase()) ||
    hints.faceUrls.some((url) => GOOGLE_HOST.test(url))
  ) {
    return 'google';
  }
  if (
    hints.faceUrls.some((url) => ADOBE_HOST.test(url)) ||
    (hints.faceUrls.length === 0 && hints.hasAdobeLink)
  ) {
    return 'adobe';
  }
  return 'selfHosted';
};

export const parseGoogleFontsHref = (href: string): string[] => {
  let url: URL;
  try {
    url = new URL(href, 'https://fonts.googleapis.com');
  } catch {
    return [];
  }
  const names: string[] = [];
  for (const value of url.searchParams.getAll('family')) {
    for (const part of value.split('|')) {
      const name = part.split(':')[0]?.replace(/\+/g, ' ').trim();
      if (name) names.push(name);
    }
  }
  return names;
};

export const googleSpecimenUrl = (family: string): string =>
  `https://fonts.google.com/specimen/${encodeURIComponent(family).replace(/%20/g, '+')}`;

const loadedWebFontFamilies = (): Set<string> => {
  const families = new Set<string>();
  if (typeof document === 'undefined' || !document.fonts) return families;
  document.fonts.forEach((face) => {
    if (face.status === 'loaded' || face.status === 'loading') {
      families.add(stripQuotes(face.family).toLowerCase());
    }
  });
  return families;
};

const BASELINES = ['monospace', 'sans-serif', 'serif'] as const;
const PROBE_TEXT = 'mmmmmmmmmmlliWQ@#0Oo';

export const createFamilyProbe = (): FamilyProbe => {
  const loaded = loadedWebFontFamilies();
  const context = document.createElement('canvas').getContext('2d');
  const installedCache = new Map<string, boolean>();
  const isInstalled = (family: string): boolean => {
    const cached = installedCache.get(family);
    if (cached !== undefined) return cached;
    let result = false;
    if (context && !/["'\\]/.test(family)) {
      result = BASELINES.some((baseline) => {
        context.font = `72px ${baseline}`;
        const baseWidth = context.measureText(PROBE_TEXT).width;
        context.font = `72px "${family}", ${baseline}`;
        return context.measureText(PROBE_TEXT).width !== baseWidth;
      });
    }
    installedCache.set(family, result);
    return result;
  };
  return {
    isWebFontLoaded: (family) => loaded.has(family.toLowerCase()),
    isInstalled,
  };
};

export type FontSourceCollection = SourceHints;

const FONT_URL = /url\(\s*["']?([^"')]+)/g;

const collectFromRules = (
  rules: CSSRuleList,
  hints: { googleFamilies: Set<string>; faceUrls: string[]; faceFamilies: Map<string, string[]> },
  depth: number,
): void => {
  for (const rule of rules) {
    if (rule instanceof CSSFontFaceRule) {
      const family = stripQuotes(rule.style.getPropertyValue('font-family')).toLowerCase();
      const urls = Array.from(
        rule.style.getPropertyValue('src').matchAll(FONT_URL),
        (m) => m[1] ?? '',
      );
      hints.faceFamilies.set(family, [...(hints.faceFamilies.get(family) ?? []), ...urls]);
      hints.faceUrls.push(...urls);
    } else if (rule instanceof CSSImportRule) {
      if (GOOGLE_HOST.test(rule.href)) {
        for (const name of parseGoogleFontsHref(rule.href)) {
          hints.googleFamilies.add(name.toLowerCase());
        }
      }
    } else if (depth < 4 && rule instanceof CSSGroupingRule) {
      collectFromRules(rule.cssRules, hints, depth + 1);
    }
  }
};

export type CollectedFontSources = {
  hints: SourceHints;
  faceFamilies: ReadonlyMap<string, readonly string[]>;
};

export const collectFontSources = (): CollectedFontSources => {
  const collected = {
    googleFamilies: new Set<string>(),
    faceUrls: [] as string[],
    faceFamilies: new Map<string, string[]>(),
  };
  let hasAdobeLink = false;
  for (const link of document.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"]')) {
    if (GOOGLE_HOST.test(link.href)) {
      for (const name of parseGoogleFontsHref(link.href)) {
        collected.googleFamilies.add(name.toLowerCase());
      }
    }
    if (ADOBE_HOST.test(link.href)) hasAdobeLink = true;
  }
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      collectFromRules(sheet.cssRules, collected, 0);
    } catch {}
  }
  return {
    hints: {
      googleFamilies: collected.googleFamilies,
      faceUrls: collected.faceUrls,
      hasAdobeLink,
    },
    faceFamilies: collected.faceFamilies,
  };
};

export const classifyForFamily = (
  rendered: Pick<RenderedFamily, 'family' | 'kind'>,
  sources: CollectedFontSources,
): FontSource =>
  classifyFontSource(rendered, {
    ...sources.hints,
    faceUrls: sources.faceFamilies.get(rendered.family.toLowerCase()) ?? [],
  });
