import { Copy, ExternalLink, Layers, RefreshCw } from 'lucide-react';
import { type CSSProperties, useEffect, useState } from 'react';
import { fetchViaBackground, runProbe } from '../../../lib/bridge';
import { copyText } from '../../../lib/clipboard';
import { useT } from '../../../lib/i18n';
import { Badge, EmptyState, PanelSection } from '../../../ui';
import type { ToolModule } from '../../types';
import '../tech.css';
import { buildProbeArgs, detectTechnologies, groupByCategory } from './detect';
import type { Confidence, DetectedTech, TechSnapshot } from './types';

type ScanState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; list: DetectedTech[]; headersAvailable: boolean };

const CONFIDENCE_TONE: Record<Confidence, 'success' | 'accent' | 'neutral'> = {
  high: 'success',
  medium: 'accent',
  low: 'neutral',
};

const PROBE_ARGS = buildProbeArgs();

const hueFromId = (id: string): number => {
  let hash = 0;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) % 360;
  return hash;
};

const initialsOf = (name: string): string => name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2);

const scanPage = async (): Promise<Exclude<ScanState, { status: 'loading' }>> => {
  const [probe, head] = await Promise.allSettled([
    runProbe<TechSnapshot | null>('tech', [PROBE_ARGS]),
    fetchViaBackground(location.href, { method: 'HEAD' }),
  ]);
  if (probe.status === 'rejected' || !probe.value) return { status: 'error' };
  const headersAvailable = head.status === 'fulfilled';
  return {
    status: 'ready',
    list: detectTechnologies(probe.value, headersAvailable ? head.value.headers : {}),
    headersAvailable,
  };
};

const TechRow = ({ item, index }: { item: DetectedTech; index: number }) => {
  const t = useT();
  const style = { '--ni-tech-hue': hueFromId(item.id), '--ni-tech-index': index } as CSSProperties;
  return (
    <li className="ni-tech-item" style={style}>
      <span className="ni-tech-avatar" aria-hidden="true">
        {initialsOf(item.name)}
      </span>
      <div className="ni-tech-main">
        <span className="ni-tech-name">
          {item.name}
          {item.version ? <Badge>{item.version}</Badge> : null}
        </span>
        {item.details.length > 0 ? (
          <span className="ni-tech-details">
            {item.details.map((detail) => (
              <Badge key={`${detail.label}-${detail.value}`}>
                {t(`tech.techStack.detail.${detail.label}`)}: {detail.value}
              </Badge>
            ))}
          </span>
        ) : null}
        <span className="ni-tech-evidence" title={item.evidence.join('\n')}>
          {item.evidence[0]}
        </span>
      </div>
      <Badge tone={CONFIDENCE_TONE[item.confidence]}>
        {t(`tech.techStack.confidence.${item.confidence}`)}
      </Badge>
      <a
        className="ni-tech-link"
        href={item.website}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('tech.techStack.site', { name: item.name })}
        title={t('tech.techStack.site', { name: item.name })}
      >
        <ExternalLink size={14} aria-hidden="true" />
      </a>
    </li>
  );
};

const TechStackPanel = () => {
  const t = useT();
  const [state, setState] = useState<ScanState>({ status: 'loading' });
  const [scanId, setScanId] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scanId re-runs the scan on demand
  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    void scanPage().then((result) => {
      if (!cancelled) setState(result);
    });
    return () => {
      cancelled = true;
    };
  }, [scanId]);

  if (state.status === 'loading') {
    return <EmptyState kind="loading" title={t('tech.techStack.loading')} />;
  }

  const rescanLabel = t('tech.techStack.rescan');
  const rescan = (
    <button
      type="button"
      className="ni-button ni-tech-button"
      onClick={() => setScanId(scanId + 1)}
    >
      <RefreshCw size={13} aria-hidden="true" />
      {rescanLabel}
    </button>
  );

  if (state.status === 'error') {
    return (
      <EmptyState
        kind="error"
        title={t('tech.techStack.error.title')}
        hint={t('tech.techStack.error.hint')}
        action={rescan}
      />
    );
  }

  const groups = groupByCategory(state.list);
  const plainText = groups
    .map(
      (group) =>
        `${t(`tech.techStack.cat.${group.category}`)}\n${group.items
          .map((item) => `- ${item.name}${item.version ? ` ${item.version}` : ''}`)
          .join('\n')}`,
    )
    .join('\n\n');
  let rowIndex = 0;

  return (
    <>
      <div className="ni-tech-bar">
        <span className="ni-tech-bar__status">
          {t('tech.techStack.count', { n: state.list.length })}
        </span>
        <span className="ni-tech-bar__spacer" />
        {state.list.length > 0 ? (
          <button
            type="button"
            className="ni-icon-button"
            aria-label={t('tech.techStack.copy')}
            title={t('tech.techStack.copy')}
            onClick={() => void copyText(plainText, t('tech.techStack.copyLabel'))}
          >
            <Copy size={14} aria-hidden="true" />
          </button>
        ) : null}
        <button
          type="button"
          className="ni-icon-button"
          aria-label={rescanLabel}
          title={rescanLabel}
          onClick={() => setScanId(scanId + 1)}
        >
          <RefreshCw size={14} aria-hidden="true" />
        </button>
      </div>
      {groups.length === 0 ? (
        <EmptyState title={t('tech.techStack.empty.title')} hint={t('tech.techStack.empty.hint')} />
      ) : (
        groups.map((group) => (
          <PanelSection
            key={group.category}
            title={`${t(`tech.techStack.cat.${group.category}`)} · ${group.items.length}`}
          >
            <ul className="ni-tech-list">
              {group.items.map((item) => (
                <TechRow key={item.id} item={item} index={rowIndex++} />
              ))}
            </ul>
          </PanelSection>
        ))
      )}
      {state.headersAvailable ? null : (
        <p className="ni-hint">{t('tech.techStack.headersUnavailable')}</p>
      )}
      <p className="ni-hint">{t('tech.techStack.note')}</p>
    </>
  );
};

const techStack: ToolModule = {
  id: 'techStack',
  group: 'tech',
  icon: Layers,
  mode: 'panel',
  Panel: TechStackPanel,
};

export default techStack;
