import { Ruler } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import {
  type FreeMeasure,
  type Measure,
  measureBetween,
  measureFree,
  measuresToHighlights,
  type Point,
} from './ruler';

type ShiftSpan = { from: Point; to: Point };

const useShiftSpan = (): ShiftSpan | null => {
  const [span, setSpan] = useState<ShiftSpan | null>(null);

  useEffect(() => {
    let last: Point = { x: 0, y: 0 };
    let anchor: Point | null = null;
    let frame = 0;
    const publish = (): void => {
      frame = 0;
      setSpan(anchor ? { from: anchor, to: last } : null);
    };
    const schedule = (): void => {
      if (!frame) frame = requestAnimationFrame(publish);
    };
    const handleMove = (event: MouseEvent): void => {
      last = { x: event.clientX, y: event.clientY };
      const wasAnchored = anchor !== null;
      if (event.shiftKey && !anchor) anchor = last;
      if (!event.shiftKey) anchor = null;
      if (anchor || wasAnchored) schedule();
    };
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Shift' || anchor) return;
      anchor = last;
      schedule();
    };
    const handleKeyUp = (event: KeyboardEvent): void => {
      if (event.key !== 'Shift') return;
      anchor = null;
      schedule();
    };
    window.addEventListener('mousemove', handleMove, { capture: true, passive: true });
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('mousemove', handleMove, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, []);

  return span;
};

const sideKey = (measure: Measure): string => `layout.ruler.${measure.side}`;

const RulerPanel = () => {
  const t = useT();
  const unit = useSettingsStore((state) => state.unit);
  const { hovered, locked } = useElementPicker();
  const span = useShiftSpan();
  useViewportVersion();

  const format = (px: number): string => formatLength(px, unit);
  const reference = hovered
    ? locked && locked !== hovered
      ? locked
      : hovered.parentElement
    : null;

  const free: FreeMeasure | null = span ? measureFree(span.from, span.to) : null;
  const measures: Measure[] =
    hovered && reference
      ? measureBetween(getViewportRect(hovered), getViewportRect(reference))
      : [];

  let items: HighlightItem[] = [];
  if (free && span) {
    items = [
      ...measuresToHighlights(free.measures, format),
      {
        kind: 'label',
        rect: { x: span.to.x + 12, y: span.to.y + 12, width: 0, height: 0 },
        text: format(free.distance),
      },
    ];
  } else if (hovered) {
    items = [{ kind: 'box', rect: getViewportRect(hovered) }];
    if (reference) items.push({ kind: 'grid', rect: getViewportRect(reference) });
    items.push(...measuresToHighlights(measures, format));
  }
  useHighlights(items);

  if (free) {
    const horizontal = splitLength(format(free.measures.find((m) => m.axis === 'x')?.length ?? 0));
    const vertical = splitLength(format(free.measures.find((m) => m.axis === 'y')?.length ?? 0));
    return (
      <>
        <PanelSection title={t('layout.ruler.free.title')}>
          <Tiles>
            <Tile
              label={t('layout.ruler.free.dx')}
              value={horizontal.value}
              unit={horizontal.unit}
            />
            <Tile label={t('layout.ruler.free.dy')} value={vertical.value} unit={vertical.unit} />
          </Tiles>
          <Card variant="rows">
            <CopyRow label={t('layout.ruler.free.distance')} value={format(free.distance)} />
          </Card>
        </PanelSection>
        <p className="ni-hint">{t('layout.ruler.hint')}</p>
      </>
    );
  }

  if (!hovered) {
    return <EmptyState title={t('layout.ruler.empty.title')} hint={t('layout.ruler.empty.hint')} />;
  }

  return (
    <>
      <ElementMeta element={hovered} isLocked={locked !== null} />
      <PanelSection title={t('layout.ruler.pair.title')}>
        <Card variant="rows">
          <CopyRow label={t('layout.ruler.element')} value={getElementLabel(hovered)} />
          {reference ? (
            <CopyRow
              label={t(
                locked && locked !== hovered ? 'layout.ruler.locked' : 'layout.ruler.parent',
              )}
              value={getElementLabel(reference)}
            />
          ) : null}
        </Card>
      </PanelSection>
      <PanelSection title={t('layout.ruler.distances')} count={measures.length}>
        {measures.length === 0 ? (
          <p className="ni-hint">{t('layout.ruler.none')}</p>
        ) : (
          <Card variant="rows">
            {measures.map((measure) => (
              <CopyRow
                key={measure.side}
                label={t(sideKey(measure))}
                value={format(measure.length)}
              />
            ))}
          </Card>
        )}
      </PanelSection>
      <p className="ni-hint">{t('layout.ruler.hint')}</p>
    </>
  );
};

const ruler: ToolModule = {
  id: 'ruler',
  group: 'layout',
  icon: Ruler,
  mode: 'hover',
  Panel: RulerPanel,
};

export default ruler;
