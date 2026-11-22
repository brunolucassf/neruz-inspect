import { en } from './en';
import { es } from './es';
import { pt } from './pt';
import type { LandingCopy, Locale } from './types';

export const DICTIONARIES: Record<Locale, LandingCopy> = { 'pt-BR': pt, en, es };

export function getCopy(locale: Locale): LandingCopy {
  return DICTIONARIES[locale];
}

export const SITE_URL = 'https://inspect.neruz.tech';

const REPO_URL = 'https://github.com/brunolucassf/neruz-inspect';
const PAGE_VIEW_URL = 'https://github.com/brunolucassf/neruz-page-view';
const INSTALL_URL = `${REPO_URL}#instalar`;

export const STORE_LINKS = {
  chrome: INSTALL_URL,
  edge: INSTALL_URL,
  firefox: INSTALL_URL,
  brave: INSTALL_URL,
  opera: INSTALL_URL,
  github: REPO_URL,
  license: `${REPO_URL}/blob/main/LICENSE`,
  issues: `${REPO_URL}/issues`,
  pageView: PAGE_VIEW_URL,
} as const;

export const IS_STORE_LIVE = false;

export const FONTE_DEV_URL = 'https://fontedev.com';
export const FONTE_DEV_CREDIT = 'Desenvolvido por Fonte Dev · Bruno Lucas';

export const BROWSER_ORDER = ['chrome', 'edge', 'firefox', 'opera', 'brave'] as const;
export const BROWSER_NAMES = {
  chrome: 'Chrome',
  edge: 'Edge',
  firefox: 'Firefox',
  opera: 'Opera',
  brave: 'Brave',
} as const;

export type { BrowserId, LandingCopy, Locale } from './types';
