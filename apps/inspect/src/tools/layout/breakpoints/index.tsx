import { MonitorSmartphone, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatLength } from '../../../lib/css';
import { useViewportVersion } from '../../../lib/highlight';
import { useT } from '../../../lib/i18n';
import { useSettingsStore } from '../../../lib/settings';
import { Badge, CopyRow, EmptyState, PanelSection } from '../../../ui';
import type { ToolModule } from '../../types';
import '../shared/layout-tools.css';
import {
  type BreakpointPoint,
  findViewportRange,
  mergeBreakpoints,
  rulerPercent,
  rulerScaleMax,
} from './breakpoints';
import { scanMediaQueries } from './cssom';

type ScanResult = { points: BreakpointPoint[]; blockedSheets: number };

const TICK_ROWS = 3;

const BreakpointsPanel = () => {
  const t = useT();
  const unit = useSettingsStore((state) => state.unit);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [run, setRun] = useState(0);
  useViewportVersion();

  // biome-ignore lint/correctness/useExhaustiveDependencies: run restarts the scan on demand
  useEffect(() => {
    setResult(null);
    const handle = setTimeout(() => {
      const { conditions, blockedSheets } = scanMediaQueries();
      setResult({ points: mergeBreakpoints(conditions), blockedSheets });
    }, 0);
    return () => clearTimeout(handle);
  }, [run]);

  if (!result) {
    return <EmptyState kind="loading" title={t('layout.breakpoints.loading.title')} />;
  }

  const viewportWidth = window.innerWidth;
  const { points, blockedSheets } = result;
  const rescanButton = (
    <button
      type="button"
      className="ni-icon-button"
      aria-label={t('layout.breakpoints.rescan')}
      onClick={() => setRun((current) => current + 1)}
    >
      <RefreshCw size={14} aria-hidden="true" />
    </button>
  );

  const blockedNotice =
    blockedSheets > 0 ? (
      <p className="ni-lt-warning" role="status">
        {t('layout.breakpoints.blocked', { n: blockedSheets })}
      </p>
    ) : null;

  if (points.length === 0) {
    return (
      <>
        <EmptyState
          title={t('layout.breakpoints.empty.title')}
          hint={t('layout.breakpoints.empty.hint')}
          action={rescanButton}
        />
        {blockedNotice}
      </>
    );
  }

  const { lower, upper } = findViewportRange(points, viewportWidth);
  const format = (px: number): string => formatLength(px, unit);
  let rangeText = t('layout.breakpoints.range.between', {
    lower: format(lower?.px ?? 0),
    upper: format(upper?.px ?? 0),
  });
  if (lower && !upper) {
    rangeText = t('layout.breakpoints.range.above', { lower: format(lower.px) });
  } else if (!lower && upper) {
    rangeText = t('layout.breakpoints.range.below', { upper: format(upper.px) });
  }
  const scaleMax = rulerScaleMax(points, viewportWidth);

  return (
    <>
      <div className="ni-lt-stat">
        <Badge tone="accent">{`${viewportWidth}px`}</Badge>
        <span>{rangeText}</span>
      </div>
      <div
        className="ni-lt-bp"
        role="img"
        aria-label={t('layout.breakpoints.ruler.label', { n: points.length })}
      >
        <div className="ni-lt-bp__axis" />
        {points.map((point, index) => {
          const left = `${rulerPercent(point.px, scaleMax)}%`;
          const row = index % TICK_ROWS;
          const below = row === 1;
          return (
            <div key={point.px}>
              <span className="ni-lt-bp__tick" style={{ left }} />
              <span
                className="ni-lt-bp__tick-label"
                style={{ left, top: below ? 48 : row === 2 ? 60 : 14 }}
              >
                {point.px}
              </span>
            </div>
          );
        })}
        <span
          className="ni-lt-bp__now"
          style={{ left: `${rulerPercent(viewportWidth, scaleMax)}%` }}
        />
        <span
          className="ni-lt-bp__now-label"
          style={{ left: `${rulerPercent(viewportWidth, scaleMax)}%` }}
        >
          {viewportWidth}
        </span>
      </div>
      <PanelSection
        title={t('layout.breakpoints.list.title', { n: points.length })}
        actions={rescanButton}
      >
        {points.map((point) => (
          <CopyRow
            key={point.px}
            label={format(point.px)}
            value={t('layout.breakpoints.usage', { min: point.min, max: point.max })}
            copyValue={`@media (min-width: ${point.px}px)`}
            className={lower?.px === point.px ? 'ni-copyrow--active' : undefined}
          />
        ))}
      </PanelSection>
      {blockedNotice}
    </>
  );
};

const breakpoints: ToolModule = {
  id: 'breakpoints',
  group: 'layout',
  icon: MonitorSmartphone,
  mode: 'panel',
  Panel: BreakpointsPanel,
};

export default breakpoints;
