import { Gauge } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useT } from '../../../lib/i18n';
import { getElementLabel } from '../../../lib/picker';
import { Badge, PanelSection } from '../../../ui';
import type { ToolModule } from '../../types';
import { formatBytes } from '../shared/format';
import { useElementFocus } from '../shared/useElementFocus';
import { createVitalsCollector, type VitalsSnapshot } from './analyzeVitals';
import {
  classifyDomSize,
  classifyVital,
  formatVital,
  RESOURCE_GROUPS,
  type VitalMetric,
  type VitalRating,
  vitalFill,
} from './vitalsMath';
import '../shared/page.css';

const RATING_TONE: Record<VitalRating, 'success' | 'warning' | 'danger'> = {
  good: 'success',
  'needs-improvement': 'warning',
  poor: 'danger',
};

const VitalCard = ({
  metric,
  value,
  action,
  pending,
}: {
  metric: VitalMetric;
  value: number | null;
  action?: { label: string; onClick: () => void; disabled?: boolean };
  pending?: string;
}) => {
  const t = useT();
  const rating = value === null ? null : classifyVital(metric, value);
  return (
    <div className="ni-pg-vital">
      <div className="ni-pg-vital__head">
        <span>
          <strong>{metric.toUpperCase()}</strong>{' '}
          <span className="ni-pg-muted">{t(`page.vitals.metric.${metric}`)}</span>
        </span>
        {rating ? (
          <Badge tone={RATING_TONE[rating]}>{t(`page.vitals.rating.${rating}`)}</Badge>
        ) : null}
      </div>
      {value === null ? (
        <p className="ni-pg-muted">{pending ?? t('page.vitals.waiting')}</p>
      ) : (
        <>
          <span className="ni-pg-vital__value">{formatVital(metric, value)}</span>
          <div className="ni-pg-meter" aria-hidden="true">
            <div
              className="ni-pg-meter__fill"
              data-tone={rating ? RATING_TONE[rating] : undefined}
              style={{ width: `${vitalFill(metric, value) * 100}%` }}
            />
          </div>
        </>
      )}
      {action ? (
        <button
          type="button"
          className="ni-button"
          disabled={action.disabled}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
};

const VitalsView = ({ snapshot }: { snapshot: VitalsSnapshot }) => {
  const t = useT();
  const { focus, clear } = useElementFocus();
  const shiftElements = [...new Set(snapshot.cls.shifts.flatMap((shift) => shift.elements))];
  const domRating = classifyDomSize(snapshot.domNodes);

  return (
    <>
      <p className="ni-hint">{t('page.vitals.note')}</p>
      <div className="ni-pg-pad">
        <VitalCard
          metric="lcp"
          value={snapshot.lcp?.value ?? null}
          action={
            snapshot.lcp?.element
              ? {
                  label: t('page.vitals.highlightLcp', {
                    element: getElementLabel(snapshot.lcp.element),
                  }),
                  onClick: () => snapshot.lcp?.element && focus(snapshot.lcp.element, 'LCP'),
                }
              : undefined
          }
        />
        <VitalCard
          metric="cls"
          value={snapshot.cls.value}
          action={
            shiftElements.length > 0
              ? {
                  label: t('page.vitals.highlightCls', { n: shiftElements.length }),
                  onClick: () => focus(shiftElements, 'CLS'),
                }
              : undefined
          }
        />
        <VitalCard
          metric="inp"
          value={snapshot.inp?.value ?? null}
          pending={t('page.vitals.inpWaiting')}
        />
        {snapshot.inp ? (
          <PanelSection title={t('page.vitals.interactions')}>
            {snapshot.inp.interactions.slice(0, 5).map((interaction) => (
              <button
                key={`${interaction.interactionId}-${interaction.name}`}
                type="button"
                className="ni-pg-row ni-pg-row--button"
                disabled={!interaction.target?.isConnected}
                onClick={() => interaction.target && focus(interaction.target, interaction.name)}
              >
                <Badge tone={RATING_TONE[classifyVital('inp', interaction.duration)]}>
                  {formatVital('inp', interaction.duration)}
                </Badge>
                <span className="ni-pg-row__main">
                  <span className="ni-pg-row__title">{interaction.name}</span>
                  <span className="ni-pg-row__sub">
                    {interaction.target ? getElementLabel(interaction.target) : ''}
                  </span>
                </span>
                <span />
              </button>
            ))}
          </PanelSection>
        ) : null}
        <VitalCard metric="fcp" value={snapshot.fcp} />
        <VitalCard metric="ttfb" value={snapshot.ttfb} />
      </div>
      <PanelSection
        title={t('page.vitals.section.resources')}
        actions={
          <Badge tone="accent">
            {snapshot.resources.totalCount} · {formatBytes(snapshot.resources.totalBytes)}
          </Badge>
        }
      >
        {RESOURCE_GROUPS.filter((group) => snapshot.resources.groups[group].count > 0).map(
          (group) => (
            <div key={group} className="ni-pg-row" style={{ gridTemplateColumns: '1fr auto auto' }}>
              <span>{t(`page.vitals.resource.${group}`)}</span>
              <span className="ni-pg-count">{snapshot.resources.groups[group].count}</span>
              <span className="ni-pg-count">
                {formatBytes(snapshot.resources.groups[group].bytes)}
              </span>
            </div>
          ),
        )}
        <p className="ni-pg-muted">{t('page.vitals.resourcesNote')}</p>
      </PanelSection>
      <PanelSection title={t('page.vitals.section.dom')}>
        <div className="ni-pg-inline">
          <span className="ni-pg-vital__value">{snapshot.domNodes}</span>
          <Badge tone={RATING_TONE[domRating]}>{t(`page.vitals.rating.${domRating}`)}</Badge>
        </div>
        <button type="button" className="ni-button" onClick={clear}>
          {t('page.common.clearHighlight')}
        </button>
      </PanelSection>
    </>
  );
};

const VitalsPanel = () => {
  const [snapshot, setSnapshot] = useState<VitalsSnapshot | null>(null);
  const frame = useRef(0);

  useEffect(() => {
    const collector = createVitalsCollector(() => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        setSnapshot(collector.snapshot());
      });
    });
    setSnapshot(collector.snapshot());
    return () => {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      collector.stop();
    };
  }, []);

  return snapshot ? <VitalsView snapshot={snapshot} /> : null;
};

const vitals: ToolModule = {
  id: 'vitals',
  group: 'page',
  icon: Gauge,
  mode: 'panel',
  Panel: VitalsPanel,
};

export default vitals;
