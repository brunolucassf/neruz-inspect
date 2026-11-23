import { Component } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toTailwindClasses } from '../../../lib/css';
import {
  getViewportRect,
  type HighlightItem,
  useHighlights,
  useViewportVersion,
} from '../../../lib/highlight';
import { useT } from '../../../lib/i18n';
import { getElementLabel, useElementPicker } from '../../../lib/picker';
import { Card, EmptyState, Tabs } from '../../../ui';
import { PanelMeta } from '../../../ui/PanelSlots';
import type { ToolModule } from '../../types';
import { CodeBlock } from '../shared/CodeBlock';
import {
  assignClassNames,
  buildCss,
  cleanTree,
  countNodes,
  type ElementNode,
  limitText,
  serializeHtml,
  serializeTailwindHtml,
  toJsx,
} from './htmlTree';
import { MAX_OUTPUT_CHARS, readComponentTree } from './readTree';
import '../shared/code.css';

type TabId = 'htmlCss' | 'tailwind' | 'jsx';

type Output = {
  html: string;
  css: string;
  tailwindHtml: string;
  jsx: string;
  nodeCount: number;
  truncated: boolean;
};

const buildOutput = (element: Element, keepDataAttributes: boolean): Output => {
  const read = readComponentTree(element);
  const [cleaned] = cleanTree([read.root], document.baseURI, { keepDataAttributes });
  const root = cleaned as ElementNode;
  const rules = assignClassNames(root);
  const limited = [
    limitText(serializeHtml(root), MAX_OUTPUT_CHARS),
    limitText(buildCss(rules), MAX_OUTPUT_CHARS),
    limitText(serializeTailwindHtml(root, toTailwindClasses), MAX_OUTPUT_CHARS),
    limitText(toJsx(root), MAX_OUTPUT_CHARS),
  ];
  const [html, css, tailwindHtml, jsx] = limited;
  return {
    html: html?.text ?? '',
    css: css?.text ?? '',
    tailwindHtml: tailwindHtml?.text ?? '',
    jsx: jsx?.text ?? '',
    nodeCount: countNodes([root]),
    truncated: read.truncated || limited.some((item) => item.truncated),
  };
};

const CopyComponentPanel = () => {
  const t = useT();
  const { hovered, locked } = useElementPicker();
  const [tab, setTab] = useState<TabId>('htmlCss');
  const [keepDataAttributes, setKeepDataAttributes] = useState(false);
  useViewportVersion();

  const target = locked ?? hovered;

  const output = useMemo(
    () => (locked ? buildOutput(locked, keepDataAttributes) : null),
    [locked, keepDataAttributes],
  );

  const highlights: HighlightItem[] = target
    ? [
        { kind: 'box', rect: getViewportRect(target) },
        { kind: 'label', rect: getViewportRect(target), text: getElementLabel(target) },
      ]
    : [];
  useHighlights(highlights);

  if (!output) {
    return (
      <>
        <EmptyState
          title={t('code.copyComponent.empty.title')}
          hint={t('code.copyComponent.empty.hint')}
        />
        <p className="ni-hint">{t('core.picker.hint')}</p>
      </>
    );
  }

  return (
    <>
      <PanelMeta>{t('code.copyComponent.nodes', { n: output.nodeCount })}</PanelMeta>
      <Card variant="padded" className="ni-cd-stack">
        <label className="ni-cd-check">
          <input
            type="checkbox"
            checked={keepDataAttributes}
            onChange={(event) => setKeepDataAttributes(event.target.checked)}
          />
          {t('code.copyComponent.keepData')}
        </label>
        {output.truncated ? (
          <p className="ni-cd-note ni-cd-note--warning" role="status">
            {t('code.copyComponent.truncated')}
          </p>
        ) : null}
      </Card>
      <Tabs
        label={t('code.copyComponent.tabs')}
        value={tab}
        onChange={setTab}
        items={[
          { id: 'htmlCss', label: 'HTML + CSS' },
          { id: 'tailwind', label: 'Tailwind' },
          { id: 'jsx', label: 'React JSX' },
        ]}
      >
        <div className="ni-cd-stack">
          {tab === 'htmlCss' ? (
            <>
              <CodeBlock
                code={output.html}
                label="HTML"
                filename="component.html"
                mime="text/html"
              />
              <CodeBlock code={output.css} label="CSS" filename="component.css" mime="text/css" />
            </>
          ) : null}
          {tab === 'tailwind' ? (
            <>
              <CodeBlock code={output.tailwindHtml} label="HTML Tailwind" />
              <p className="ni-cd-note">{t('code.shared.tailwindApprox')}</p>
            </>
          ) : null}
          {tab === 'jsx' ? (
            <CodeBlock
              code={output.jsx}
              label="JSX"
              filename="Component.jsx"
              mime="text/javascript"
            />
          ) : null}
        </div>
      </Tabs>
      <p className="ni-hint">{t('core.picker.locked')}</p>
    </>
  );
};

const copyComponent: ToolModule = {
  id: 'copyComponent',
  group: 'code',
  icon: Component,
  mode: 'hover',
  Panel: CopyComponentPanel,
};

export default copyComponent;
