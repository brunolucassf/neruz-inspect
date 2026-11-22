import type { Locale } from '../runtime';

export const LOCALE_PREFERENCES = ['auto', 'pt-BR', 'en', 'es'] as const;
export type LocalePreference = (typeof LOCALE_PREFERENCES)[number];

export const LOCALE_NATIVE_NAMES: Record<Locale, string> = {
  'pt-BR': 'Português (Brasil)',
  en: 'English',
  es: 'Español',
};

export function detectBrowserLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const base = language.toLowerCase().split('-')[0];
    if (base === 'pt') return 'pt-BR';
    if (base === 'es') return 'es';
    if (base === 'en') return 'en';
  }
  return 'en';
}

export const resolveLocale = (
  preference: LocalePreference,
  languages: readonly string[],
): Locale => (preference === 'auto' ? detectBrowserLocale(languages) : preference);
