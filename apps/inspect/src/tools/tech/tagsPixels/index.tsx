import { Radar, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { runProbe } from '../../../lib/bridge';
import { useT } from '../../../lib/i18n';
import { Badge, CopyRow, EmptyState, PanelSection } from '../../../ui';
import type { ToolModule } from '../../types';
import '../tech.css';
import {
  analyzeTags,
  buildTagsProbeArgs,
  eventsSince,
  isInternalLayerEntry,
  type LayerReport,
  type PlatformReport,
  type TagsAnalysis,
  type TagsProbeResult,
} from './tags';

type ScanState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; analysis: TagsAnalysis; fresh: ReadonlySet<string>; at: number };

const PROBE_ARGS = buildTagsProbeArgs();

const formatClock = (at: number): string =>
  new Date(at).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const PlatformCard = ({
  platform,
  fresh,
}: {
  platform: PlatformReport;
  fresh: ReadonlySet<string>;
}) => {
  const t = useT();
  const isActive = platform.status === 'active';
  return (
    <section className="ni-tech-card" aria-label={platform.name}>
      <div className="ni-tech-card__head">
        <h3 className="ni-tech-card__title">{platform.name}</h3>
        <Badge tone={isActive ? 'success' : 'warning'}>
          {t(isActive ? 'tech.tagsPixels.status.active' : 'tech.tagsPixels.status.notLoaded')}
        </Badge>
      </div>
      {platform.ids.map((id) => (
        <CopyRow key={id} label={t('tech.tagsPixels.id')} value={id} />
      ))}
      {platform.ids.length === 0 ? (
        <p className="ni-tech-muted">{t('tech.tagsPixels.noId')}</p>
      ) : null}
      {platform.events.length > 0 ? (
        <ul className="ni-tech-events" aria-label={t('tech.tagsPixels.events')}>
          {platform.events.map((event) => (
            <li
              key={event.key}
              className={
                fresh.has(event.key) ? 'ni-tech-event ni-tech-event--new' : 'ni-tech-event'
              }
            >
              <span className="ni-tech-event__name">{event.name ?? t('tech.tagsPixels.hit')}</span>
              {event.id ? <Badge>{event.id}</Badge> : null}
              {event.count > 1 ? <Badge>×{event.count}</Badge> : null}
              {fresh.has(event.key) ? (
                <Badge tone="accent">{t('tech.tagsPixels.new')}</Badge>
              ) : null}
            </li>
          ))}
        </ul>
      ) : isActive ? (
        <p className="ni-tech-muted">{t('tech.tagsPixels.noEvents')}</p>
      ) : null}
      {isActive ? null : (
        <p className="ni-tech-muted">
          {t('tech.tagsPixels.notLoadedHint', { found: platform.foundBy.join(', ') })}
        </p>
      )}
    </section>
  );
};

const LayerList = ({ layer }: { layer: LayerReport }) => {
  const t = useT();
  const [showInternal, setShowInternal] = useState(false);
  const entries = layer.entries.filter((entry) => showInternal || !isInternalLayerEntry(entry));
  const label = (kind: string, name: string): string => name || t(`tech.tagsPixels.layer.${kind}`);
  return (
    <PanelSection
      title={`${layer.name} · ${t('tech.tagsPixels.layerCount', { n: layer.total })}`}
      actions={
        <label className="ni-tech-muted">
          <input
            type="checkbox"
            checked={showInternal}
            onChange={(event) => setShowInternal(event.target.checked)}
          />{' '}
          {t('tech.tagsPixels.showInternal')}
        </label>
      }
    >
      {entries.length === 0 ? (
        <p className="ni-tech-muted">{t('tech.tagsPixels.layerEmpty')}</p>
      ) : (
        <ul className="ni-tech-events">
          {entries.map((entry) => (
            <li
              key={entry.index}
              className={
                isInternalLayerEntry(entry) ? 'ni-tech-event ni-tech-event--muted' : 'ni-tech-event'
              }
            >
              <details>
                <summary>
                  <span className="ni-tech-event__name">
                    #{entry.index + 1} {label(entry.kind, entry.name)}
                    {entry.id ? ` ${entry.id}` : ''}
                  </span>
                </summary>
                <pre className="ni-tech-pre">{entry.preview || '—'}</pre>
              </details>
            </li>
          ))}
        </ul>
      )}
    </PanelSection>
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
    <button type="button" className="ni-button ni-tech-button" onClick={() => void scan()}>
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
  const hasData = analysis.platforms.length > 0 || analysis.layers.some((l) => l.total > 0);

  return (
    <>
      <div className="ni-tech-bar">
        <span className="ni-tech-bar__status" aria-live="polite">
          {t('tech.tagsPixels.updatedAt', { time: formatClock(at) })}
          {fresh.size > 0 ? ` · ${t('tech.tagsPixels.newCount', { n: fresh.size })}` : ''}
        </span>
        <span className="ni-tech-bar__spacer" />
        {refresh}
      </div>
      {hasData ? (
        <>
          {analysis.platforms.length > 0 ? (
            <PanelSection title={t('tech.tagsPixels.section.tags')}>
              {analysis.platforms.map((platform) => (
                <PlatformCard key={platform.id} platform={platform} fresh={fresh} />
              ))}
            </PanelSection>
          ) : null}
          {analysis.layers
            .filter((layer) => layer.total > 0)
            .map((layer) => (
              <LayerList key={layer.name} layer={layer} />
            ))}
        </>
      ) : (
        <EmptyState
          title={t('tech.tagsPixels.empty.title')}
          hint={t('tech.tagsPixels.empty.hint')}
        />
      )}
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
