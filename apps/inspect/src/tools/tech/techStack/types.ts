export const TECH_CATEGORIES = [
  'framework',
  'cms',
  'builder',
  'ecommerce',
  'payment',
  'css',
  'library',
  'analytics',
  'marketing',
  'security',
  'fonts',
  'cdn',
  'server',
  'pwa',
] as const;

export type TechCategory = (typeof TECH_CATEGORIES)[number];

export type Signal =
  | { kind: 'global'; path: string; weight: number; version?: string }
  | { kind: 'selector'; css: string; weight: number; versionAttr?: string }
  | { kind: 'domKey'; prefix: string; weight: number }
  | { kind: 'cssVar'; name: string; weight: number }
  | { kind: 'meta'; name: string; weight: number; pattern?: string }
  | { kind: 'script' | 'link' | 'asset'; pattern: string; weight: number }
  | { kind: 'class'; pattern: string; weight: number; min: number }
  | { kind: 'header'; name: string; weight: number; pattern?: string }
  | { kind: 'serviceWorker'; weight: number };

export type DetailRule =
  | { label: 'theme' | 'plugin'; source: 'asset'; pattern: string; max: number }
  | { label: 'theme' | 'plugin'; source: 'global'; path: string };

export type TechSignature = {
  id: string;
  name: string;
  category: TechCategory;
  website: string;
  signals: readonly Signal[];
  implies?: readonly string[];
  details?: readonly DetailRule[];
  versionTemplate?: string;
};

export type TechSnapshot = {
  globals: Readonly<Record<string, string | true>>;
  selectors: Readonly<Record<string, string | true>>;
  meta: readonly { name: string; content: string }[];
  scripts: readonly string[];
  links: readonly string[];
  images: readonly string[];
  classTokens: readonly string[];
  domKeys: readonly string[];
  cssVars: readonly string[];
  serviceWorker: boolean;
};

export type TechProbeArgs = {
  globals: string[];
  selectors: { css: string; attr?: string }[];
  domKeys: string[];
  cssVars: string[];
};

export type ResponseHeaders = Readonly<Record<string, string>>;

export type Confidence = 'high' | 'medium' | 'low';

export type TechDetail = { label: 'theme' | 'plugin'; value: string };

export type DetectedTech = {
  id: string;
  name: string;
  category: TechCategory;
  website: string;
  version: string | undefined;
  score: number;
  confidence: Confidence;
  evidence: string[];
  details: TechDetail[];
  implied: boolean;
};
