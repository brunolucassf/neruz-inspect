import { Layers, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  getViewportRect,
  type HighlightItem,
  useHighlights,
  useViewportVersion,
} from '../../../lib/highlight';
import { useT } from '../../../lib/i18n';
import { getElementLabel } from '../../../lib/picker';
import { Badge, Card, EmptyState, PanelSection } from '../../../ui';
import { PanelActions } from '../../../ui/PanelSlots';
import type { ToolModule } from '../../types';
import { revealElement, SCAN_LIMIT, useElementScan } from '../shared/scan';
import '../shared/layout-tools.css';
import {
  type FlatLayer,
  flattenLayerTree,
  type LayerNode,
  parseZIndex,
  type StackingReason,
  stackingReason,
} from './zIndex';

const ROW_LIMIT = 400;
const INDENT_PX = 12;
const ROOT_ID = 0;

type LayerEntry = LayerNode & {
  element: Element;
  label: string;
  reason: StackingReason;
  zText: string;
};

let nextLayerId = ROOT_ID;

const describeElement = (element: Element, isRoot: boolean): LayerEntry | null => {
  const style = getComputedStyle(element);
  const parent = element.parentElement;
  const reason = stackingReason({
    isRoot,
    position: style.position,
    zIndex: style.zIndex,
    opacity: style.opacity,
    transform: style.transform,
    filter: style.filter,
    backdropFilter: style.getPropertyValue('backdrop-filter'),
    perspective: style.perspective,
    clipPath: style.clipPath,
    maskImage: style.getPropertyValue('mask-image'),
    isolation: style.isolation,
    mixBlendMode: style.mixBlendMode,
    willChange: style.willChange,
    contain: style.getPropertyValue('contain'),
    containerType: style.getPropertyValue('container-type'),
    parentDisplay: parent ? getComputedStyle(parent).display : '',
  });
  if (!reason) return null;
  const id = isRoot ? ROOT_ID : ++nextLayerId;
  return {
    id,
    parentId: null,
    order: id,
    z: parseZIndex(style.zIndex),
    element,
    label: getElementLabel(element),
    reason,
    zText: style.zIndex,
  };
};

const visitLayer = (element: Element): LayerEntry | null => describeElement(element, false);

const attachParents = (entries: readonly LayerEntry[]): LayerEntry[] => {
  const byElement = new Map<Element, LayerEntry>();
  for (const entry of entries) byElement.set(entry.element, entry);
  return entries.map((entry) => {
    let parentId = ROOT_ID;
    for (let node = entry.element.parentElement; node; node = node.parentElement) {
      const found = byElement.get(node);
      if (found) {
        parentId = found.id;
        break;
      }
    }
    return { ...entry, parentId };
  });
};

const ZIndexPanel = () => {
  const t = useT();
  const { state, rescan } = useElementScan(visitLayer);
  const [active, setActive] = useState<LayerEntry | null>(null);
  useViewportVersion();

  const rows = useMemo<FlatLayer<LayerEntry>[]>(() => {
    if (state.status !== 'ready') return [];
    const root = describeElement(document.documentElement, true);
    const all = root ? [root, ...attachParents(state.items)] : attachParents(state.items);
    return flattenLayerTree(all);
  }, [state]);

  const highlights: HighlightItem[] = [];
  if (active?.element.isConnected) {
    highlights.push({
      kind: 'box',
      rect: getViewportRect(active.element),
      text: `z-index: ${active.zText} · ${t(`layout.zIndex.reason.${active.reason}`)}`,
    });
  }
  useHighlights(highlights);

  if (state.status === 'loading') {
    return <EmptyState kind="loading" title={t('layout.zIndex.loading.title')} />;
  }

  if (rows.length <= 1) {
    return (
      <EmptyState
        title={t('layout.zIndex.empty.title')}
        hint={t('layout.zIndex.empty.hint')}
        action={
          <button type="button" className="ni-button ni-button--primary" onClick={rescan}>
            {t('layout.zIndex.rescan')}
          </button>
        }
      />
    );
  }

  return (
    <>
      <PanelActions>
        <button
          type="button"
          className="ni-icon-button"
          aria-label={t('layout.zIndex.rescan')}
          onClick={rescan}
        >
          <RefreshCw size={14} aria-hidden="true" />
        </button>
      </PanelActions>
      <PanelSection title={t('layout.zIndex.tree.title', { n: rows.length })}>
        <Card variant="rows">
          <div className="ni-lt-list" role="tree" aria-label={t('layout.zIndex.tree.label')}>
            {rows.slice(0, ROW_LIMIT).map(({ node, depth }) => (
              <button
                key={node.id}
                type="button"
                role="treeitem"
                aria-level={depth + 1}
                aria-selected={active?.id === node.id}
                className="ni-lt-item"
                style={{ paddingLeft: 10 + depth * INDENT_PX }}
                onMouseEnter={() => setActive(node)}
                onFocus={() => setActive(node)}
                onClick={() => {
                  setActive(node);
                  revealElement(node.element);
                }}
              >
                <span className="ni-lt-item__main">
                  {node.label}
                  <span className="ni-lt-item__reason">
                    {t(`layout.zIndex.reason.${node.reason}`)}
                  </span>
                </span>
                <Badge tone={node.zText === 'auto' ? 'neutral' : 'accent'}>
                  {node.zText === 'auto' ? t('layout.zIndex.auto') : node.zText}
                </Badge>
              </button>
            ))}
          </div>
        </Card>
      </PanelSection>
      {state.truncated ? (
        <p className="ni-lt-warning">{t('layout.zIndex.truncated', { n: SCAN_LIMIT })}</p>
      ) : null}
      <p className="ni-hint">{t('layout.zIndex.hint')}</p>
    </>
  );
};

const zIndex: ToolModule = {
  id: 'zIndex',
  group: 'layout',
  icon: Layers,
  mode: 'panel',
  Panel: ZIndexPanel,
};

export default zIndex;
