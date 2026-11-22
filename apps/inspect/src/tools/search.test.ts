import { describe, expect, it } from 'vitest';
import { buildSearchIndex, normalizeText, searchTools } from './search';
import type { ToolModule } from './types';

const NullIcon = () => null;
const NullPanel = () => null;

const fakeTool = (group: ToolModule['group'], id: ToolModule['id']): ToolModule => ({
  group,
  id,
  mode: 'panel',
  icon: NullIcon as unknown as ToolModule['icon'],
  Panel: NullPanel,
});

const MESSAGES: Record<string, string> = {
  'color.eyedropper.name': 'Conta-gotas',
  'color.eyedropper.desc': 'Pega a cor de qualquer pixel',
  'color.eyedropper.keywords': 'cor, pixel, picker, hex',
  'layout.boxModel.name': 'Modelo de caixa',
  'layout.boxModel.desc': 'Mostra margem, padding e borda',
  'layout.boxModel.keywords': 'margin, padding, espaçamento',
};

const index = buildSearchIndex(
  [fakeTool('color', 'eyedropper'), fakeTool('layout', 'boxModel')],
  (key) => MESSAGES[key] ?? key,
);

describe('normalizeText', () => {
  it('drops accents and case', () => {
    expect(normalizeText('  Espaçamento ')).toBe('espacamento');
  });
});

describe('searchTools', () => {
  it('matches by name, keywords and description', () => {
    expect(searchTools(index, 'conta')[0]?.tool.id).toBe('eyedropper');
    expect(searchTools(index, 'espacamento')[0]?.tool.id).toBe('boxModel');
    expect(searchTools(index, 'qualquer pixel')[0]?.tool.id).toBe('eyedropper');
  });

  it('requires every term and ranks name matches first', () => {
    expect(searchTools(index, 'cor zzz')).toEqual([]);
    expect(searchTools(index, 'margem')[0]?.tool.id).toBe('boxModel');
    expect(searchTools(index, '')).toEqual([]);
  });
});
