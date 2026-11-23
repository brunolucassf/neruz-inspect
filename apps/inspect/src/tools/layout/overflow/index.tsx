import { MoveHorizontal, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  getViewportRect,
  type HighlightItem,
  useHighlights,
  useViewportVersion,
} from '../../../lib/highlight';
import { useT } from '../../../lib/i18n';
import { getElementLabel } from '../../../lib/picker';
import { Card, EmptyState, PanelSection, Tile, Tiles } from '../../../ui';
import { PanelActions } from '../../../ui/PanelSlots';
import type { ToolModule } from '../../types';
import { isVisibleRect, revealElement, SCAN_LIMIT, useElementScan } from '../shared/scan';
import { splitLength } from '../shared/splitLength';
import '../shared/layout-tools.css';
import {
  documentOverflowAmount,
  isHorizontalClipValue,
  type OverflowCandidate,
  rankOverflow,
} from './overflow';

const CULPRIT_LIMIT = 40;

type OverflowEntry = OverflowCandidate & { element: Element };

let nextCandidateId = 0;

const depthOf = (element: Element): number => {
  let depth = 0;
  for (let node = element.parentElement; node; node = node.parentElement) depth += 1;
  return depth;
};

const isEscapedFromFlow = (element: Element): boolean => {
  for (
    let node: Element | null = element;
    node && node !== document.documentElement;
    node = node.parentElement
  ) {
    if (getComputedStyle(node).position === 'fixed') return true;
  }
  return false;
};

const isClippedByAncestor = (element: Element): boolean => {
  for (
    let node = element.parentElement;
    node && node !== document.body && node !== document.documentElement;
    node = node.parentElement
  ) {
    if (isHorizontalClipValue(getComputedStyle(node).overflowX)) return true;
  }
  return false;
};

const visitOverflow = (element: Element): OverflowEntry | null => {
  const viewportWidth = document.documentElement.clientWidth;
  const rect = element.getBoundingClientRect();
  if (!isVisibleRect(rect)) return null;
  const documentRight = rect.right + window.scrollX;
  if (documentRight <= viewportWidth + 0.5) return null;
  const style = getComputedStyle(element);
  if (style.visibility === 'hidden') return null;
  if (isEscapedFromFlow(element) || isClippedByAncestor(element)) return null;
  nextCandidateId += 1;
  return {
    id: nextCandidateId,
    element,
    label: getElementLabel(element),
    documentRight,
    width: rect.width,
    depth: depthOf(element),
  };
};

const formatPx = (value: number): string => `${Math.round(value * 100) / 100}px`;

const OverflowPanel = () => {
  const t = useT();
  const { state, rescan } = useElementScan(visitOverflow);
  const [active, setActive] = useState<number | null>(null);
  useViewportVersion();

  const culprits = useMemo(
    () =>
      state.status === 'ready'
        ? rankOverflow(state.items, document.documentElement.clientWidth, CULPRIT_LIMIT)
        : [],
    [state],
  );
  const entries = culprits.map((culprit) => ({
    culprit,
    element:
      state.status === 'ready'
        ? state.items.find((item) => item.id === culprit.id)?.element
        : undefined,
  }));

  const highlights: HighlightItem[] = [];
  for (const { culprit, element } of entries) {
    if (!element?.isConnected) continue;
    const rect = getViewportRect(element);
    highlights.push(
      culprit.id === active
        ? { kind: 'box', rect, text: `+${formatPx(culprit.excess)}` }
        : { kind: 'grid', rect },
    );
  }
  useHighlights(highlights);

  if (state.status === 'loading') {
    return <EmptyState kind="loading" title={t('layout.overflow.loading.title')} />;
  }

  const viewportWidth = document.documentElement.clientWidth;
  const excess = documentOverflowAmount(document.documentElement.scrollWidth, viewportWidth);

  if (excess === 0) {
    return (
      <EmptyState
        title={t('layout.overflow.ok.title')}
        hint={t('layout.overflow.ok.hint', { n: viewportWidth })}
        action={
          <button type="button" className="ni-button ni-button--primary" onClick={rescan}>
            {t('layout.overflow.rescan')}
          </button>
        }
      />
    );
  }

  const excessAmount = splitLength(formatPx(excess));

  return (
    <>
      <PanelActions>
        <button
          type="button"
          className="ni-icon-button"
          aria-label={t('layout.overflow.rescan')}
          onClick={rescan}
        >
          <RefreshCw size={14} aria-hidden="true" />
        </button>
      </PanelActions>
      <Tiles columns={3}>
        <Tile
          label={t('layout.overflow.tile.excess')}
          value={excessAmount.value}
          unit={excessAmount.unit}
          tone="danger"
        />
        <Tile label={t('layout.overflow.tile.viewport')} value={viewportWidth} unit="px" />
        <Tile
          label={t('layout.overflow.tile.page')}
          value={document.documentElement.scrollWidth}
          unit="px"
        />
      </Tiles>
      {entries.length === 0 ? (
        <EmptyState title={t('layout.overflow.none.title')} hint={t('layout.overflow.none.hint')} />
      ) : (
        <PanelSection title={t('layout.overflow.culprits.title', { n: entries.length })}>
          <Card variant="rows" className="ni-lt-list">
            {entries.map(({ culprit, element }) => (
              <button
                key={culprit.id}
                type="button"
                className="ni-lt-item"
                aria-pressed={active === culprit.id}
                aria-label={t('layout.overflow.reveal', { label: culprit.label })}
                onMouseEnter={() => setActive(culprit.id)}
                onFocus={() => setActive(culprit.id)}
                onClick={() => {
                  setActive(culprit.id);
                  if (element?.isConnected) revealElement(element);
                }}
              >
                <span className="ni-lt-item__main">{culprit.label}</span>
                <span className="ni-lt-item__meta">
                  {t('layout.overflow.excess', { n: formatPx(culprit.excess) })}
                </span>
              </button>
            ))}
          </Card>
        </PanelSection>
      )}
      {state.truncated ? (
        <p className="ni-lt-warning">{t('layout.overflow.truncated', { n: SCAN_LIMIT })}</p>
      ) : null}
    </>
  );
};

const overflow: ToolModule = {
  id: 'overflow',
  group: 'layout',
  icon: MoveHorizontal,
  mode: 'panel',
  Panel: OverflowPanel,
};

export default overflow;
