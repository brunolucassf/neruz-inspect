import type { Locale } from '@neruz/i18n';
import type { GroupMessages } from '../tools/types';
import code from './code';
import color from './color';
import core from './core';
import layout from './layout';
import motion from './motion';
import page from './page';
import tech from './tech';
import type from './type';
import utils from './utils';

export const DICTIONARIES: readonly GroupMessages[] = [
  core,
  color,
  type,
  layout,
  code,
  motion,
  tech,
  page,
  utils,
];

const mergeLocale = (locale: Locale): Record<string, string> =>
  Object.assign({}, ...DICTIONARIES.map((dictionary) => dictionary[locale]));

const PT_BR = mergeLocale('pt-BR');

export const MESSAGES: Record<Locale, Readonly<Record<string, string>>> = {
  'pt-BR': PT_BR,
  en: { ...PT_BR, ...mergeLocale('en') },
  es: { ...PT_BR, ...mergeLocale('es') },
};
