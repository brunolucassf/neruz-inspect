import { Download, Link2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { downloadText } from '../../../lib/download';
import { useT } from '../../../lib/i18n';
import { toast } from '../../../lib/toast';
import { Badge, EmptyState, PanelSection } from '../../../ui';
import type { ToolModule } from '../../types';
import { Alert } from '../shared/Alert';
import { ChipGroup } from '../shared/ChipGroup';
import { runPool } from '../shared/concurrency';
import { isSameOrigin, readStatus } from '../shared/readers';
import { ScanView } from '../shared/ScanView';
import { useElementFocus } from '../shared/useElementFocus';
import { useScan } from '../shared/useScan';
import {
  analyzeLinks,
  classifyStatus,
  type LinkItem,
  linksToCsv,
  MAX_CHECKED_LINKS,
  stripHash,
  uniqueCheckableUrls,
} from './analyzeLinks';
import '../shared/page.css';

type LinkFilter = 'all' | 'internal' | 'external' | 'problems' | 'nofollow' | 'contact';

const FILTERS: readonly LinkFilter[] = [
  'all',
  'internal',
  'external',
  'problems',
  'nofollow',
  'contact',
];
const CONCURRENCY = 4;
const PAGE_SIZE = 150;

type StatusMap = ReadonlyMap<string, number | null>;

const isProblem = (item: LinkItem, statuses: StatusMap): boolean => {
  if (item.brokenAnchor || item.unsafeBlank) return true;
  const status = statuses.get(stripHash(item.url));
  return status !== undefined && ['broken', 'unreachable'].includes(classifyStatus(status));
};

const matchesFilter = (item: LinkItem, filter: LinkFilter, statuses: StatusMap): boolean => {
  switch (filter) {
    case 'internal':
      return item.kind === 'internal' || item.kind === 'anchor';
    case 'external':
      return item.kind === 'external';
    case 'problems':
      return isProblem(item, statuses);
    case 'nofollow':
      return item.rel.nofollow || item.rel.sponsored || item.rel.ugc;
    case 'contact':
      return item.kind === 'mailto' || item.kind === 'tel';
    default:
      return true;
  }
};

const StatusBadge = ({ status }: { status: number | null | undefined }) => {
  const t = useT();
  if (status === undefined) return null;
  const kind = classifyStatus(status);
  const tone = kind === 'ok' ? 'success' : kind === 'restricted' ? 'warning' : 'danger';
  return <Badge tone={tone}>{status === null ? t('page.links.unreachable') : status}</Badge>;
};

const LinkRow = ({
  item,
  status,
  onSelect,
}: {
  item: LinkItem;
  status: number | null | undefined;
  onSelect: (item: LinkItem) => void;
}) => {
  const t = useT();
  return (
    <button type="button" className="ni-pg-row ni-pg-row--button" onClick={() => onSelect(item)}>
      <Badge tone={item.kind === 'external' ? 'accent' : 'neutral'}>
        {t(`page.links.kind.${item.kind}`)}
      </Badge>
      <span className="ni-pg-row__main">
        <span className="ni-pg-row__title">{item.text || t('page.links.noText')}</span>
        <span className="ni-pg-row__sub" title={item.url}>
          {item.rawHref}
        </span>
        <span className="ni-pg-inline">
          {item.rel.nofollow ? <Badge>nofollow</Badge> : null}
          {item.rel.sponsored ? <Badge>sponsored</Badge> : null}
          {item.rel.ugc ? <Badge>ugc</Badge> : null}
          {item.unsafeBlank ? <Badge tone="warning">{t('page.links.unsafeBlank')}</Badge> : null}
          {item.brokenAnchor ? <Badge tone="danger">{t('page.links.brokenAnchor')}</Badge> : null}
        </span>
      </span>
      <StatusBadge status={status} />
    </button>
  );
};

const LinksView = ({ items, truncated }: { items: LinkItem[]; truncated: boolean }) => {
  const t = useT();
  const { focus } = useElementFocus();
  const [filter, setFilter] = useState<LinkFilter>('all');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [statuses, setStatuses] = useState<StatusMap>(new Map());
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const targets = uniqueCheckableUrls(items);
  const totalCheckable = new Set(
    items.filter((item) => item.checkable).map((item) => stripHash(item.url)),
  ).size;
  const checking = progress !== null && progress.done < progress.total;
  const crossOriginFailures = items.filter(
    (item) =>
      item.kind === 'external' &&
      statuses.has(stripHash(item.url)) &&
      statuses.get(stripHash(item.url)) === null,
  ).length;

  const startCheck = async (): Promise<void> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatuses(new Map());
    setProgress({ done: 0, total: targets.length });
    let done = 0;
    await runPool(targets, CONCURRENCY, async (url) => ({ url, result: await readStatus(url) }), {
      signal: controller.signal,
      onResult: ({ url, result }) => {
        done += 1;
        setStatuses((current) => new Map(current).set(url, result.status));
        setProgress({ done, total: targets.length });
      },
    });
  };

  const exportCsv = (): void => {
    downloadText(linksToCsv(items, statuses), 'links.csv', 'text/csv');
    toast(t('page.common.downloaded'), 'success');
  };

  const filtered = items.filter((item) => matchesFilter(item, filter, statuses));
  const counts = {
    internal: items.filter((item) => item.kind === 'internal' || item.kind === 'anchor').length,
    external: items.filter((item) => item.kind === 'external').length,
    problems: items.filter((item) => isProblem(item, statuses)).length,
  };

  return (
    <>
      <PanelSection
        title={t('page.links.section.summary', { n: items.length })}
        actions={
          <button type="button" className="ni-button" onClick={exportCsv}>
            <Download size={12} aria-hidden="true" /> CSV
          </button>
        }
      >
        <div className="ni-pg-inline">
          <Badge>{t('page.links.count.internal', { n: counts.internal })}</Badge>
          <Badge tone="accent">{t('page.links.count.external', { n: counts.external })}</Badge>
          <Badge tone={counts.problems > 0 ? 'danger' : 'success'}>
            {t('page.links.count.problems', { n: counts.problems })}
          </Badge>
        </div>
        {truncated ? <p className="ni-pg-muted">{t('page.links.truncated')}</p> : null}
        <button
          type="button"
          className="ni-button ni-button--primary"
          disabled={checking || targets.length === 0}
          onClick={() => void startCheck()}
        >
          {t(checking ? 'page.links.checking' : 'page.links.check', { n: targets.length })}
        </button>
        {totalCheckable > MAX_CHECKED_LINKS ? (
          <p className="ni-pg-muted">{t('page.links.limit', { max: MAX_CHECKED_LINKS })}</p>
        ) : null}
        {progress ? (
          <>
            <div
              className="ni-pg-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-valuenow={progress.done}
              aria-label={t('page.links.progress', { done: progress.done, total: progress.total })}
            >
              <div
                className="ni-pg-progress__bar"
                style={{ width: `${(progress.done / Math.max(progress.total, 1)) * 100}%` }}
              />
            </div>
            <p className="ni-pg-muted" aria-live="polite">
              {t('page.links.progress', { done: progress.done, total: progress.total })}
            </p>
          </>
        ) : null}
        {crossOriginFailures > 0 && !checking ? (
          <Alert
            severity="warning"
            message={t('page.links.permissionHint', { n: crossOriginFailures })}
          />
        ) : null}
        {items.some((item) => item.kind === 'external' && !isSameOrigin(item.url)) ? (
          <p className="ni-pg-muted">{t('page.links.permissionNote')}</p>
        ) : null}
      </PanelSection>
      <ChipGroup label={t('page.links.filter')}>
        {FILTERS.map((entry) => (
          <button
            key={entry}
            type="button"
            className="ni-pg-chip"
            aria-pressed={filter === entry}
            onClick={() => {
              setFilter(entry);
              setVisible(PAGE_SIZE);
            }}
          >
            {t(`page.links.filter.${entry}`)}
          </button>
        ))}
      </ChipGroup>
      <div className="ni-pg-pad">
        {filtered.length === 0 ? (
          <EmptyState title={t('page.links.empty')} />
        ) : (
          filtered
            .slice(0, visible)
            .map((item) => (
              <LinkRow
                key={item.id}
                item={item}
                status={statuses.get(stripHash(item.url))}
                onSelect={(selected) => focus(selected.element, selected.kind)}
              />
            ))
        )}
        {filtered.length > visible ? (
          <button
            type="button"
            className="ni-button"
            onClick={() => setVisible((n) => n + PAGE_SIZE)}
          >
            {t('page.common.showMore', { n: filtered.length - visible })}
          </button>
        ) : null}
      </div>
    </>
  );
};

const LinksPanel = () => {
  const t = useT();
  const { state, rescan } = useScan(() => analyzeLinks(document));
  return (
    <ScanView state={state} onRescan={rescan}>
      {(result) =>
        result.items.length === 0 ? (
          <EmptyState title={t('page.links.none.title')} hint={t('page.links.none.hint')} />
        ) : (
          <LinksView items={result.items} truncated={result.truncated} />
        )
      }
    </ScanView>
  );
};

const links: ToolModule = {
  id: 'links',
  group: 'page',
  icon: Link2,
  mode: 'panel',
  Panel: LinksPanel,
};

export default links;
