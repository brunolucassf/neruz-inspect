export type IconLibraryId =
  | 'lucide'
  | 'fontawesome'
  | 'material'
  | 'bootstrap'
  | 'heroicons'
  | 'phosphor'
  | 'remix'
  | 'ionicons'
  | 'feather'
  | 'tabler';

export type IconSignals = {
  classes: readonly string[];
  attributes: readonly string[];
  tags: readonly string[];
  fonts: readonly string[];
  resources: readonly string[];
  spriteRefs: readonly string[];
};

export type IconLibrary = {
  id: IconLibraryId;
  name: string;
  version: string | null;
  confidence: 'certain' | 'probable';
  evidence: string[];
};

type Evidence = { strong: string[]; weak: string[] };

const MAX_EVIDENCE = 3;

const matching = (values: readonly string[], pattern: RegExp): string[] => {
  const found: string[] = [];
  for (const value of values) {
    if (pattern.test(value) && !found.includes(value)) found.push(value);
    if (found.length >= MAX_EVIDENCE) break;
  }
  return found;
};

const firstVersion = (values: readonly string[], pattern: RegExp): string | null => {
  for (const value of values) {
    const match = pattern.exec(value);
    if (match?.[1]) return match[1];
  }
  return null;
};

const FA_STYLE_V6 = /^fa-(solid|regular|brands|light|thin|duotone|sharp|classic)$/;
const FA_STYLE_V5 = /^fa[srbld]$/;

const fontAwesomeVersion = (signals: IconSignals): string | null => {
  const fromResource = firstVersion(
    signals.resources,
    /(?:font-?awesome|fortawesome)[^\d]{0,40}?(\d+\.\d+(?:\.\d+)?)/i,
  );
  if (fromResource) return fromResource;
  const fromFont = firstVersion(signals.fonts, /font awesome\s+(\d+)/i);
  if (fromFont) return fromFont;
  if (signals.classes.some((name) => FA_STYLE_V6.test(name))) return '6+';
  if (signals.classes.some((name) => FA_STYLE_V5.test(name))) return '5';
  if (signals.classes.includes('fa')) return '4';
  return null;
};

type Detector = {
  id: IconLibraryId;
  name: (signals: IconSignals) => string;
  collect: (signals: IconSignals) => Evidence;
  version?: (signals: IconSignals) => string | null;
};

const staticName = (name: string) => () => name;

const DETECTORS: readonly Detector[] = [
  {
    id: 'lucide',
    name: staticName('Lucide'),
    collect: (s) => ({
      strong: [
        ...matching(s.classes, /^lucide(-|$)/),
        ...matching(s.attributes, /^data-lucide$/),
        ...matching(s.resources, /lucide/i),
      ],
      weak: [],
    }),
  },
  {
    id: 'fontawesome',
    name: staticName('Font Awesome'),
    version: fontAwesomeVersion,
    collect: (s) => {
      const styled = s.classes.some(
        (name) => FA_STYLE_V6.test(name) || FA_STYLE_V5.test(name) || name === 'fa',
      );
      return {
        strong: [
          ...(styled
            ? matching(
                s.classes,
                /^fa(-(solid|regular|brands|light|thin|duotone|sharp|classic)|[srbld])?$/,
              )
            : []),
          ...matching(s.fonts, /font ?awesome/i),
          ...matching(s.resources, /font-?awesome|fortawesome/i),
        ],
        weak: styled ? matching(s.classes, /^fa-[a-z0-9-]+$/) : [],
      };
    },
  },
  {
    id: 'material',
    name: (s) =>
      s.classes.some((name) => /^material-symbols/.test(name)) ||
      s.fonts.some((name) => /material symbols/i.test(name)) ||
      s.resources.some((url) => /material\+?symbols/i.test(url))
        ? 'Material Symbols'
        : 'Material Icons',
    collect: (s) => ({
      strong: [
        ...matching(s.classes, /^material-(icons|symbols)(-[a-z-]+)?$/),
        ...matching(s.fonts, /material (icons|symbols)/i),
        ...matching(s.resources, /material\+?(icons|symbols)/i),
      ],
      weak: [],
    }),
  },
  {
    id: 'bootstrap',
    name: staticName('Bootstrap Icons'),
    collect: (s) => ({
      strong: [
        ...(s.classes.includes('bi') ? matching(s.classes, /^bi(-[a-z0-9-]+)?$/) : []),
        ...matching(s.fonts, /bootstrap-icons/i),
        ...matching(s.resources, /bootstrap-icons/i),
        ...matching(s.spriteRefs, /bootstrap-icons/i),
      ],
      weak: [],
    }),
    version: (s) => firstVersion(s.resources, /bootstrap-icons[^\d]{0,20}(\d+\.\d+(?:\.\d+)?)/i),
  },
  {
    id: 'heroicons',
    name: staticName('Heroicons'),
    collect: (s) => ({
      strong: [...matching(s.resources, /heroicons/i), ...matching(s.classes, /^heroicon/)],
      weak: matching(s.attributes, /^data-slot=icon$/),
    }),
  },
  {
    id: 'phosphor',
    name: staticName('Phosphor'),
    collect: (s) => ({
      strong: [
        ...(s.classes.includes('ph') ||
        s.classes.some((name) => /^ph-(bold|fill|light|thin|duotone)$/.test(name))
          ? matching(s.classes, /^ph(-(bold|fill|light|thin|duotone))?$/)
          : []),
        ...matching(s.fonts, /phosphor/i),
        ...matching(s.resources, /phosphor/i),
        ...matching(s.tags, /^ph-icon$/),
      ],
      weak: [],
    }),
  },
  {
    id: 'remix',
    name: staticName('Remix Icon'),
    collect: (s) => ({
      strong: [
        ...matching(s.classes, /^ri-[a-z0-9-]+-(line|fill)$/),
        ...matching(s.fonts, /remixicon/i),
        ...matching(s.resources, /remixicon/i),
      ],
      weak: [],
    }),
  },
  {
    id: 'ionicons',
    name: staticName('Ionicons'),
    collect: (s) => ({
      strong: [
        ...matching(s.tags, /^ion-icon$/),
        ...matching(s.classes, /^ion-(md|ios|logo)-|^ionicons$/),
        ...matching(s.fonts, /ionicons/i),
        ...matching(s.resources, /ionicons/i),
      ],
      weak: [],
    }),
  },
  {
    id: 'feather',
    name: staticName('Feather'),
    collect: (s) => ({
      strong: [
        ...matching(s.classes, /^feather(-[a-z0-9-]+)?$/),
        ...matching(s.attributes, /^data-feather$/),
        ...matching(s.resources, /feather-?icons|feathericons|unpkg\.com\/feather/i),
      ],
      weak: [],
    }),
  },
  {
    id: 'tabler',
    name: staticName('Tabler Icons'),
    collect: (s) => ({
      strong: [
        ...(s.classes.includes('ti') ? matching(s.classes, /^ti(-[a-z0-9-]+)?$/) : []),
        ...matching(s.classes, /^(icon-tabler|tabler-icon)(-[a-z0-9-]+)?$/),
        ...matching(s.fonts, /tabler-icons/i),
        ...matching(s.resources, /tabler/i),
      ],
      weak: [],
    }),
  },
];

export const detectIconLibraries = (signals: IconSignals): IconLibrary[] => {
  const found: (IconLibrary & { score: number })[] = [];
  for (const detector of DETECTORS) {
    const { strong, weak } = detector.collect(signals);
    if (strong.length === 0 && weak.length === 0) continue;
    found.push({
      id: detector.id,
      name: detector.name(signals),
      version: detector.version?.(signals) ?? null,
      confidence: strong.length > 0 ? 'certain' : 'probable',
      evidence: [...strong, ...weak].slice(0, MAX_EVIDENCE),
      score: strong.length * 2 + weak.length,
    });
  }
  return found.sort((a, b) => b.score - a.score).map(({ score: _score, ...library }) => library);
};

const REFERENCE_PATTERN = /url\(#|href=["']#/;
const STRIPPED_ATTRIBUTES =
  /\s(?:class|aria-hidden|focusable|tabindex|data-[\w:-]+|xml:space|xmlns:xlink)=(?:"[^"]*"|'[^']*')/g;

export const cleanSvgMarkup = (markup: string): string => {
  let cleaned = markup
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(STRIPPED_ATTRIBUTES, '');
  if (!REFERENCE_PATTERN.test(cleaned)) {
    cleaned = cleaned.replace(/\sid=(?:"[^"]*"|'[^']*')/g, '');
  }
  cleaned = cleaned.replace(/<svg\b[^>]*>/i, (open) => {
    let tag = open;
    if (/\sviewBox=/i.test(tag)) tag = tag.replace(/\s(?:width|height)=(?:"[^"]*"|'[^']*')/g, '');
    if (!/\sxmlns=/.test(tag))
      tag = tag.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
    return tag;
  });
  return cleaned
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
};
