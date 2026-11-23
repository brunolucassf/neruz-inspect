import { Check, CircleDashed, Radar, RefreshCw, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { runProbe } from '../../../lib/bridge';
import { useT } from '../../../lib/i18n';
import { Card, EmptyState, IdChip, PanelSection, StatusPill, Tile, Tiles } from '../../../ui';
import { PanelMeta } from '../../../ui/PanelSlots';
import type { ToolModule } from '../../types';
import '../tech.css';
import { PLATFORM_MARKS } from './platformMarks';
import {
  analyzeTags,
  buildTagsProbeArgs,
  eventsSince,
  isInternalLayerEntry,
  type LayerReport,
  type MissingPlatform,
  type PlatformReport,
  type TagsAnalysis,
  type TagsProbeResult,
} from './tags';

type ScanState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; analysis: TagsAnalysis; fresh: ReadonlySet<string>; at: number };

const PROBE_ARGS = buildTagsProbeArgs();
const MISSING_OPEN_LIMIT = 12;

const formatClock = (at: number): string =>
  new Date(at).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const totalEventCount = (platform: PlatformReport): number =>
  platform.events.reduce((sum, event) => sum + event.count, 0);

const EventChips = ({
  platform,
  fresh,
}: {
  platform: PlatformReport;
  fresh: ReadonlySet<string>;
}) => {
  const t = useT();
  const hasManyIds = platform.ids.length > 1;
  return (
    <ul className="ni-tech-events" aria-label={t('tech.tagsPixels.events')}>
      {platform.events.map((event) => (
        <li
          key={event.key}
          className={fresh.has(event.key) ? 'ni-tech-event ni-tech-event--new' : 'ni-tech-event'}
        >
          {event.name ?? t('tech.tagsPixels.hit')}
          {hasManyIds && event.id ? <em>{event.id}</em> : null}
          {event.count > 1 ? <em>×{event.count}</em> : null}
          {fresh.has(event.key) ? <strong>{t('tech.tagsPixels.new')}</strong> : null}
        </li>
      ))}
    </ul>
  );
};

const NotLoadedNote = ({ signals }: { signals: readonly string[] }) => {
  const t = useT();
  return (
    <p className="ni-tag-card__note">
      {t('tech.tagsPixels.notLoadedBefore')}{' '}
      {signals.map((signal, index) => (
        <span key={signal}>
          {index > 0 ? ', ' : ''}
          <code>{signal}</code>
        </span>
      ))}
      {', '}
      {t('tech.tagsPixels.notLoadedAfter')}
    </p>
  );
};

const PlatformCard = ({
  platform,
  fresh,
}: {
  platform: PlatformReport;
  fresh: ReadonlySet<string>;
}) => {
  const t = useT();
  const isActive = platform.status === 'active';
  const source =
    platform.ids.length === 0 ? t('tech.tagsPixels.noId') : platform.foundBy.join(' · ');
  return (
    <article className="ni-tag-card" data-status={platform.status} aria-label={platform.name}>
      <div className="ni-tag-card__head">
        <span className="ni-tag-card__mark" aria-hidden="true">
          {PLATFORM_MARKS[platform.id]}
        </span>
        <div className="ni-tag-card__titles">
          <h4 className="ni-tag-card__title">{platform.name}</h4>
          <div className="ni-tag-card__src">{source}</div>
        </div>
        <StatusPill
          status={platform.status}
          label={t(isActive ? 'tech.tagsPixels.status.active' : 'tech.tagsPixels.status.notLoaded')}
        />
      </div>
      {platform.ids.length > 0 ? (
        <div className="ni-tag-card__ids">
          {platform.ids.map((id) => (
            <IdChip key={id} value={id} label={t('tech.tagsPixels.id')} />
          ))}
        </div>
      ) : null}
      {platform.events.length > 0 ? (
        <div className="ni-tag-card__events">
          <div className="ni-tag-card__events-head">
            <span>{t('tech.tagsPixels.events')}</span>
            <b>{totalEventCount(platform)}</b>
          </div>
          <EventChips platform={platform} fresh={fresh} />
        </div>
      ) : isActive ? (
        <p className="ni-tag-card__note">{t('tech.tagsPixels.noEvents')}</p>
      ) : null}
      {isActive ? null : <NotLoadedNote signals={platform.foundBy} />}
    </article>
  );
};

const MissingPlatforms = ({ missing }: { missing: readonly MissingPlatform[] }) => {
  const t = useT();
  const [isOpen, setIsOpen] = useState(missing.length <= MISSING_OPEN_LIMIT);
  return (
    <PanelSection
      title={t('tech.tagsPixels.summary.missing')}
      count={missing.length}
      actions={
        <button
          type="button"
          className="ni-button ni-button--sm"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
        >
          {t(isOpen ? 'tech.tagsPixels.missing.hide' : 'tech.tagsPixels.missing.show')}
        </button>
      }
    >
      {isOpen ? (
        <ul className="ni-tags-missing">
          {missing.map((platform) => (
            <li key={platform.id}>
              <StatusPill status="missing" label={platform.name} />
            </li>
          ))}
        </ul>
      ) : null}
    </PanelSection>
  );
};

const LayerList = ({ layer }: { layer: LayerReport }) => {
  const t = useT();
  const [showInternal, setShowInternal] = useState(false);
  const entries = layer.entries.filter((entry) => showInternal || !isInternalLayerEntry(entry));
  const label = (kind: string, name: string): string => name || t(`tech.tagsPixels.layer.${kind}`);
  return (
    <PanelSection
      title={layer.name}
      count={layer.total}
      actions={
        <label className="ni-tech-check">
          <input
            type="checkbox"
            checked={showInternal}
            onChange={(event) => setShowInternal(event.target.checked)}
          />
          {t('tech.tagsPixels.showInternal')}
        </label>
      }
    >
      {entries.length === 0 ? (
        <p className="ni-hint">{t('tech.tagsPixels.layerEmpty')}</p>
      ) : (
        <Card variant="rows">
          <ul className="ni-tech-layer">
            {entries.map((entry) => (
              <li
                key={entry.index}
                className={
                  isInternalLayerEntry(entry)
                    ? 'ni-tech-layer__item ni-tech-layer__item--muted'
                    : 'ni-tech-layer__item'
                }
              >
                <details>
                  <summary>
                    #{entry.index + 1} {label(entry.kind, entry.name)}
                    {entry.id ? ` ${entry.id}` : ''}
                  </summary>
                  <pre className="ni-tech-pre">{entry.preview || '—'}</pre>
                </details>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </PanelSection>
  );
};

const TagsSummary = ({
  active,
  notLoaded,
  missing,
}: {
  active: number;
  notLoaded: number;
  missing: number;
}) => {
  const t = useT();
  return (
    <Tiles columns={3} className="ni-tags-summary">
      <Tile
        label={t('tech.tagsPixels.summary.active')}
        value={active}
        tone="success"
        icon={<Check size={16} aria-hidden="true" />}
      />
      <Tile
        label={t('tech.tagsPixels.status.notLoaded')}
        value={notLoaded}
        tone="warning"
        icon={<TriangleAlert size={16} aria-hidden="true" />}
      />
      <Tile
        label={t('tech.tagsPixels.summary.missing')}
        value={missing}
        icon={<CircleDashed size={16} aria-hidden="true" />}
      />
    </Tiles>
  );
};

const TagsPixelsPanel = () => {
  const t = useT();
  const [state, setState] = useState<ScanState>({ status: 'loading' });
  const baseline = useRef<ReadonlyMap<string, number> | null>(null);
  const active = useRef(true);

  const scan = useCallback(async (): Promise<void> => {
    try {
      const raw = await runProbe<TagsProbeResult | null>('tags', [PROBE_ARGS]);
      if (!active.current) return;
      if (!raw) {
        setState({ status: 'error' });
        return;
      }
      const analysis = analyzeTags(raw);
      const allEvents = analysis.platforms.flatMap((platform) => platform.events);
      const fresh = eventsSince(baseline.current, allEvents);
      baseline.current = new Map(allEvents.map((event) => [event.key, event.count]));
      setState({ status: 'ready', analysis, fresh, at: Date.now() });
    } catch {
      if (active.current) setState({ status: 'error' });
    }
  }, []);

  useEffect(() => {
    active.current = true;
    void scan();
    return () => {
      active.current = false;
    };
  }, [scan]);

  const refresh = (
    <button type="button" className="ni-button ni-button--sm" onClick={() => void scan()}>
      <RefreshCw size={13} aria-hidden="true" />
      {t('tech.tagsPixels.refresh')}
    </button>
  );

  if (state.status === 'loading') {
    return <EmptyState kind="loading" title={t('tech.tagsPixels.loading')} />;
  }
  if (state.status === 'error') {
    return (
      <EmptyState
        kind="error"
        title={t('tech.tagsPixels.error.title')}
        hint={t('tech.tagsPixels.error.hint')}
        action={refresh}
      />
    );
  }

  const { analysis, fresh, at } = state;
  const activePlatforms = analysis.platforms.filter((platform) => platform.status === 'active');
  const attentionPlatforms = analysis.platforms.filter(
    (platform) => platform.status === 'notLoaded',
  );
  const hasData = analysis.platforms.length > 0 || analysis.layers.some((l) => l.total > 0);

  return (
    <>
      <PanelMeta>
        <span className="ni-live" style={{ color: 'var(--ni-success)' }}>
          <i className="ni-dot ni-dot--pulse" aria-hidden="true" />
        </span>
        <span className="ni-tech-updated" aria-live="polite">
          {t('tech.tagsPixels.updatedAt', { time: formatClock(at) })}
          {fresh.size > 0 ? ` · ${t('tech.tagsPixels.newCount', { n: fresh.size })}` : ''}
        </span>
        <span className="ni-tech-spacer" />
        {refresh}
      </PanelMeta>
      <TagsSummary
        active={activePlatforms.length}
        notLoaded={attentionPlatforms.length}
        missing={analysis.missing.length}
      />
      {activePlatforms.length > 0 ? (
        <PanelSection title={t('tech.tagsPixels.summary.active')} count={activePlatforms.length}>
          {activePlatforms.map((platform) => (
            <PlatformCard key={platform.id} platform={platform} fresh={fresh} />
          ))}
        </PanelSection>
      ) : null}
      {attentionPlatforms.length > 0 ? (
        <PanelSection
          title={t('tech.tagsPixels.section.attention')}
          count={attentionPlatforms.length}
        >
          {attentionPlatforms.map((platform) => (
            <PlatformCard key={platform.id} platform={platform} fresh={fresh} />
          ))}
        </PanelSection>
      ) : null}
      {hasData ? null : (
        <EmptyState
          title={t('tech.tagsPixels.empty.title')}
          hint={t('tech.tagsPixels.empty.hint')}
        />
      )}
      {analysis.missing.length > 0 ? <MissingPlatforms missing={analysis.missing} /> : null}
      {analysis.layers
        .filter((layer) => layer.total > 0)
        .map((layer) => (
          <LayerList key={layer.name} layer={layer} />
        ))}
      <p className="ni-hint">{t('tech.tagsPixels.note')}</p>
    </>
  );
};

const tagsPixels: ToolModule = {
  id: 'tagsPixels',
  group: 'tech',
  icon: Radar,
  mode: 'panel',
  Panel: TagsPixelsPanel,
};

export default tagsPixels;
