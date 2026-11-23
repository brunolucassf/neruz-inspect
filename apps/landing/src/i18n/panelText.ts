import code from '../../../inspect/src/i18n/code';
import color from '../../../inspect/src/i18n/color';
import core from '../../../inspect/src/i18n/core';
import layout from '../../../inspect/src/i18n/layout';
import motion from '../../../inspect/src/i18n/motion';
import page from '../../../inspect/src/i18n/page';
import tech from '../../../inspect/src/i18n/tech';
import utils from '../../../inspect/src/i18n/utils';
import type { Locale } from './types';

const DICTIONARIES = [code, color, core, layout, motion, page, tech, utils];

export type PanelText = (key: string, vars?: Record<string, string | number>) => string;

export function createPanelText(locale: Locale): PanelText {
  const messages: Record<string, string> = Object.assign(
    {},
    ...DICTIONARIES.map((dictionary) => dictionary['pt-BR']),
    ...DICTIONARIES.map((dictionary) => dictionary[locale]),
  );
  return (key, vars = {}) => {
    const message = messages[key];
    if (message === undefined) throw new Error(`Missing panel message: ${key}`);
    return message.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in vars ? String(vars[name]) : match,
    );
  };
}
