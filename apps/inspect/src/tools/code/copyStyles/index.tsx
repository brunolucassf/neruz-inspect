import { Paintbrush } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { parseCssColor } from '../../../lib/color';
import {
  getViewportRect,
  type HighlightItem,
  useHighlights,
  useViewportVersion,
} from '../../../lib/highlight';
import { useT } from '../../../lib/i18n';
import { getElementLabel, useElementPicker } from '../../../lib/picker';
import { Card, CodeChip, CopyRow, EmptyState, PanelSection, Swatch, Tabs } from '../../../ui';
import { PanelMeta } from '../../../ui/PanelSlots';
import type { ToolModule } from '../../types';
import { CodeBlock } from '../shared/CodeBlock';
import {
  buildRuleIndex,
  createDefaultsProvider,
  type DefaultsProvider,
  diffElementStyles,
  type FlatRule,
  lookupRules,
  type RuleLookup,
} from '../shared/domStyles';
import { selectorFor } from '../shared/selector';
import type { StyleMap } from '../shared/styleDiff';
import { buildCssText, buildTailwindText } from './copyStyles';
import '../shared/code.css';

type TabId = 'css' | 'tailwind' | 'variables';

type Analysis = {
  selector: string;
  styles: StyleMap;
  hover: StyleMap;
  variables: ReadonlyMap<string, string>;
  rulesScanned: boolean;
};

const EMPTY_LOOKUP: RuleLookup = { authored: new Set(), hover: {}, variables: new Map() };

const CopyStylesPanel = () => {
  const t = useT();
  const { hovered, locked } = useElementPicker();
  const [tab, setTab] = useState<TabId>('css');
  const defaultsRef = useRef<DefaultsProvider | null>(null);
  const rulesRef = useRef<FlatRule[] | null>(null);
  useViewportVersion();

  useEffect(
    () => () => {
      defaultsRef.current?.dispose();
      defaultsRef.current = null;
      rulesRef.current = null;
    },
    [],
  );

  const target = locked ?? hovered;
  const isLocked = locked !== null;

  const analysis = useMemo<Analysis | null>(() => {
    if (!target) return null;
    defaultsRef.current ??= createDefaultsProvider();
    let lookup = EMPTY_LOOKUP;
    if (isLocked) {
      rulesRef.current ??= buildRuleIndex();
      lookup = lookupRules(target, rulesRef.current);
    }
    return {
      selector: selectorFor(target),
      styles: diffElementStyles(target, defaultsRef.current, lookup.authored),
      hover: lookup.hover,
      variables: lookup.variables,
      rulesScanned: isLocked,
    };
  }, [target, isLocked]);

  const highlights: HighlightItem[] = target
    ? [
        { kind: 'box', rect: getViewportRect(target) },
        { kind: 'label', rect: getViewportRect(target), text: getElementLabel(target) },
      ]
    : [];
  useHighlights(highlights);

  if (!analysis) {
    return (
      <EmptyState title={t('code.copyStyles.empty.title')} hint={t('code.copyStyles.empty.hint')} />
    );
  }

  const cssText = buildCssText(analysis.selector, analysis.styles, analysis.hover);
  const tailwindText = buildTailwindText(analysis.styles, analysis.hover);
  const variables = Array.from(analysis.variables.entries());

  return (
    <>
      <PanelMeta>
        <CodeChip>{analysis.selector}</CodeChip>
      </PanelMeta>
      <Tabs
        label={t('code.copyStyles.tabs')}
        value={tab}
        onChange={setTab}
        items={[
          { id: 'css', label: 'CSS' },
          { id: 'tailwind', label: 'Tailwind' },
          { id: 'variables', label: t('code.copyStyles.tab.variables') },
        ]}
      >
        <div className="ni-cd-stack">
          {tab === 'css' ? (
            <CodeBlock code={cssText} label="CSS" filename="styles.css" mime="text/css" />
          ) : null}
          {tab === 'tailwind' ? (
            <>
              <CodeBlock code={tailwindText} label="Tailwind" />
              <p className="ni-cd-note">{t('code.shared.tailwindApprox')}</p>
            </>
          ) : null}
          {tab === 'variables' ? (
            variables.length > 0 ? (
              <PanelSection title={t('code.copyStyles.section.variables')} count={variables.length}>
                <Card variant="rows">
                  {variables.map(([name, value]) => (
                    <CopyRow
                      key={name}
                      label={name}
                      value={value || '—'}
                      copyValue={`${name}: ${value};`}
                      leading={
                        parseCssColor(value) ? <Swatch color={value} size={14} /> : undefined
                      }
                    />
                  ))}
                </Card>
              </PanelSection>
            ) : (
              <EmptyState
                title={t('code.copyStyles.variables.empty')}
                hint={analysis.rulesScanned ? undefined : t('code.copyStyles.variables.lockHint')}
              />
            )
          ) : null}
        </div>
      </Tabs>
      {tab !== 'variables' && Object.keys(analysis.hover).length === 0 ? (
        <p className="ni-cd-note">
          {t(
            analysis.rulesScanned ? 'code.copyStyles.hover.none' : 'code.copyStyles.hover.lockHint',
          )}
        </p>
      ) : null}
      <p className="ni-hint">{t(isLocked ? 'core.picker.locked' : 'core.picker.hint')}</p>
    </>
  );
};

const copyStyles: ToolModule = {
  id: 'copyStyles',
  group: 'code',
  icon: Paintbrush,
  mode: 'hover',
  Panel: CopyStylesPanel,
};

export default copyStyles;
