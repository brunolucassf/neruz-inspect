import { describe, expect, it } from 'vitest';
import { TOOLS } from '../tools/registry';
import { DICTIONARIES, MESSAGES } from './index';

const LOCALES = ['pt-BR', 'en', 'es'] as const;

describe('dictionaries', () => {
  it('keep the same keys in every language', () => {
    for (const dictionary of DICTIONARIES) {
      const source = Object.keys(dictionary['pt-BR']).sort();
      for (const locale of LOCALES) {
        expect(Object.keys(dictionary[locale]).sort()).toEqual(source);
      }
    }
  });

  it('give every registered tool a name, description and keywords in every language', () => {
    for (const tool of TOOLS) {
      for (const locale of LOCALES) {
        for (const field of ['name', 'desc', 'keywords']) {
          const key = `${tool.group}.${tool.id}.${field}`;
          expect(MESSAGES[locale][key], `${locale}:${key}`).toBeTruthy();
        }
      }
    }
  });

  it('never leave a message empty', () => {
    for (const locale of LOCALES) {
      for (const [key, value] of Object.entries(MESSAGES[locale])) {
        expect(value.trim(), `${locale}:${key}`).not.toBe('');
      }
    }
  });
});
