import { describe, expect, it } from 'vitest';
import { toFileSlug } from './format';

describe('toFileSlug', () => {
  it('transliterates accents instead of replacing them with a hyphen', () => {
    expect(toFileSlug('círculo.svg')).toBe('circulo.svg');
    expect(toFileSlug('ícone de ação.svg')).toBe('icone-de-acao.svg');
  });

  it('keeps dots and hyphens and collapses other symbols', () => {
    expect(toFileSlug('logo v2/final?.svg')).toBe('logo-v2-final-.svg');
  });
});
