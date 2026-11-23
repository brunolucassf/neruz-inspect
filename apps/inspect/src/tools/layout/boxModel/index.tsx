import { BoxSelect } from 'lucide-react';
import { formatLength } from '../../../lib/css';
import {
  getViewportRect,
  type HighlightItem,
  useHighlights,
  useViewportVersion,
} from '../../../lib/highlight';
import { useT } from '../../../lib/i18n';
import { getElementLabel, useElementPicker } from '../../../lib/picker';
import { useSettingsStore } from '../../../lib/settings';
import { Card, CopyRow, EmptyState, PanelSection, Tile, Tiles } from '../../../ui';
import type { ToolModule } from '../../types';
import { ElementMeta } from '../shared/ElementMeta';
import { splitLength } from '../shared/splitLength';
import { BoxDiagram } from './BoxDiagram';
import { type BoxMetrics, formatEdges, formatRadius, formatSize, readBoxMetrics } from './boxModel';

const buildHighlights = (metrics: BoxMetrics | null, label: string): HighlightItem[] => {
  if (!metrics) return [];
  const { rects } = metrics;
  return [
    { kind: 'margin', rect: rects.margin, hole: rects.border },
    { kind: 'padding', rect: rects.padding, hole: rects.content },
    { kind: 'box', rect: rects.content },
    {
      kind: 'label',
      rect: rects.border,
      text: `${label}  ${formatSize(metrics.width, metrics.height)}`,
    },
  ];
};

const BoxModelPanel = () => {
  const t = useT();
  const unit = useSettingsStore((state) => state.unit);
  const { hovered, locked } = useElementPicker();
  useViewportVersion();

  const target = locked ?? hovered;
  const metrics = target ? readBoxMetrics(getComputedStyle(target), getViewportRect(target)) : null;
  const label = target ? getElementLabel(target) : '';

  useHighlights(buildHighlights(metrics, label));

  if (!metrics) {
    return (
      <EmptyState title={t('layout.boxModel.empty.title')} hint={t('layout.boxModel.empty.hint')} />
    );
  }

  const margin = formatEdges(metrics.margin, unit);
  const padding = formatEdges(metrics.padding, unit);
  const border = formatEdges(metrics.border, unit);
  const radius = formatRadius(metrics.radius, unit);

  const width = splitLength(formatLength(metrics.width, unit));
  const height = splitLength(formatLength(metrics.height, unit));

  return (
    <>
      <ElementMeta element={target} isLocked={locked !== null} />
      <BoxDiagram
        label={t('layout.boxModel.diagram')}
        margin={metrics.margin}
        border={metrics.border}
        padding={metrics.padding}
      >
        {formatSize(metrics.rects.content.width, metrics.rects.content.height)}
      </BoxDiagram>
      <PanelSection title={t('layout.boxModel.section.size')}>
        <Tiles>
          <Tile label={t('layout.boxModel.width')} value={width.value} unit={width.unit} />
          <Tile label={t('layout.boxModel.height')} value={height.value} unit={height.unit} />
        </Tiles>
      </PanelSection>
      <PanelSection title={t('layout.boxModel.section.spacing')}>
        <Card variant="rows">
          <CopyRow
            label={t('layout.boxModel.margin')}
            value={margin}
            copyValue={`margin: ${margin};`}
          />
          <CopyRow
            label={t('layout.boxModel.padding')}
            value={padding}
            copyValue={`padding: ${padding};`}
          />
        </Card>
      </PanelSection>
      <PanelSection title={t('layout.boxModel.section.box')}>
        <Card variant="rows">
          <CopyRow
            label={t('layout.boxModel.border')}
            value={border}
            copyValue={`border-width: ${border};`}
          />
          <CopyRow
            label={t('layout.boxModel.radius')}
            value={radius}
            copyValue={`border-radius: ${radius};`}
          />
          <CopyRow
            label={t('layout.boxModel.display')}
            value={metrics.display}
            copyValue={`display: ${metrics.display};`}
          />
        </Card>
      </PanelSection>
      <p className="ni-hint">{t(locked ? 'core.picker.locked' : 'core.picker.hint')}</p>
    </>
  );
};

const boxModel: ToolModule = {
  id: 'boxModel',
  group: 'layout',
  icon: BoxSelect,
  mode: 'hover',
  Panel: BoxModelPanel,
};

export default boxModel;
