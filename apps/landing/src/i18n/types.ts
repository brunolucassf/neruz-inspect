export const LOCALES = ['pt-BR', 'en', 'es'] as const;

export type Locale = (typeof LOCALES)[number];

export type BrowserId = 'chrome' | 'edge' | 'firefox' | 'brave' | 'opera';

export interface SectionCopy {
  id: string;
  layers: string[];
  title: string;
  text: string;
  tools: string[];
  note?: string;
}

export interface PrivacyPageCopy {
  title: string;
  description: string;
  heading: string;
  updated: string;
  back: string;
  blocks: { title: string; paragraphs: string[]; items?: string[] }[];
}

export interface StageCopy {
  label: string;
  dock: {
    search: string;
    groups: { short: string; name: string }[];
  };
  panel: {
    creditsPrefix: string;
    locked: string;
  };
  box: {
    title: string;
    size: string;
    spacing: string;
    box: string;
    width: string;
    height: string;
    margin: string;
    padding: string;
    border: string;
    radius: string;
    display: string;
  };
  font: {
    title: string;
    webFont: string;
    family: string;
    rendered: string;
    declared: string;
    text: string;
    weight: string;
    size: string;
    lineHeight: string;
    color: string;
    copyCss: string;
  };
  eyedropper: {
    title: string;
    picked: string;
    recent: string;
    start: string;
  };
  assets: {
    title: string;
    found: string;
    files: string;
    weight: string;
    alerts: string;
    filterAll: string;
    filterImages: string;
    filterBackgrounds: string;
    filterSvg: string;
    noLazy: string;
    tryModern: string;
    noAlerts: string;
    ratio: string;
    cssBackground: string;
  };
}

export interface LandingCopy {
  locale: Locale;
  htmlLang: string;
  path: string;
  privacyPath: string;
  meta: { title: string; description: string; ogDescription: string };
  skipLink: string;
  languageLabel: string;
  languageNames: Record<Locale, string>;
  language: { current: string; short: string; selected: string };
  header: { navLabel: string; github: string };
  cta: {
    addTo: Record<BrowserId, string>;
    addShort: string;
    chooseBrowser: string;
    alsoFor: string;
    browserNotes: Partial<Record<BrowserId, string>>;
    mobileInstall: string;
    copyLink: string;
    linkCopied: string;
    share: string;
    comingSoon: string;
    followOnGithub: string;
    viewOnGithub: string;
  };
  hero: {
    title: string;
    subtitle: string;
    micro: string[];
    skipIntro: string;
  };
  demo: {
    nav: string[];
    title: string;
    text: string;
    button: string;
    marquee: string;
  };
  explode: {
    eyebrow: string;
    title: string;
    subtitle: string;
    indexLabel: string;
  };
  groups: { name: string; desc: string }[];
  stage: StageCopy;
  sections: SectionCopy[];
  visuals: {
    exampleTag: string;
    techChips: string[];
    ogHost: string;
    vitals: { name: string; value: string }[];
    typeLabel: string;
  };
  privacy: {
    eyebrow: string;
    title: string;
    text: string;
    ask: string;
    policy: string;
    proofsTitle: string;
    proofs: string[];
    permsTitle: string;
    requiredWord: string;
    optionalWord: string;
    perms: { name: string; kind: 'required' | 'optional'; why: string }[];
    familyEyebrow: string;
    familyTitle: string;
    familyText: string;
    familyButton: string;
  };
  faq: { title: string; items: { q: string; a: string }[] };
  final: { title: string; subtitle: string };
  trail: { label: string };
  footer: {
    navLabel: string;
    privacy: string;
    github: string;
    license: string;
    family: string;
    credit: string;
  };
  privacyPage: PrivacyPageCopy;
}
