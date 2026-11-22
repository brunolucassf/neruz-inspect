import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { t } from '../lib/i18n';
import { getTool } from '../tools/registry';
import { buildSearchIndex } from '../tools/search';
import { Panel } from './Panel';
import { ToolList } from './ToolList';

it('renders the boxModel panel with credits and a tool list', () => {
  const tool = getTool('boxModel');
  if (!tool) throw new Error('boxModel is not registered');
  const panel = renderToString(<Panel tool={tool} />);
  expect(panel).toContain('Modelo de caixa');
  expect(panel).toContain('https://fontedev.com');
  expect(panel).toContain('Nenhum elemento selecionado');
  const entries = buildSearchIndex([tool], t);
  const list = renderToString(
    <ToolList
      listId="x"
      label="l"
      entries={entries}
      activeIndex={0}
      onActivate={() => undefined}
      onChoose={() => undefined}
    />,
  );
  expect(list).toContain('Passe o mouse e veja');
});
