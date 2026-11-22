import { createTranslator, type Locale, type MessageParams, resolveLocale } from '@neruz/i18n';
import { useMemo } from 'react';
import { MESSAGES } from '../i18n';
import { useSettingsStore } from './settings';

export type Translate = (key: string, params?: MessageParams) => string;

const translators = new Map<Locale, Translate>();

const getTranslator = (locale: Locale): Translate => {
  const cached = translators.get(locale);
  if (cached) return cached;
  const created = createTranslator(locale, MESSAGES[locale]);
  translators.set(locale, created);
  return created;
};

const getBrowserLanguages = (): readonly string[] =>
  typeof navigator === 'undefined' ? [] : navigator.languages;

export const getLocale = (): Locale =>
  resolveLocale(useSettingsStore.getState().locale, getBrowserLanguages());

export const t: Translate = (key, params) => getTranslator(getLocale())(key, params);

export const useLocale = (): Locale => {
  const preference = useSettingsStore((state) => state.locale);
  return useMemo(() => resolveLocale(preference, getBrowserLanguages()), [preference]);
};

export const useT = (): Translate => {
  const locale = useLocale();
  return useMemo(() => getTranslator(locale), [locale]);
};
