import { Download, Images } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useT } from '../../../lib/i18n';
import { Badge, EmptyState, PanelSection } from '../../../ui';
import type { ToolModule } from '../../types';
import { ChipGroup } from '../shared/ChipGroup';
import { runPool } from '../shared/concurrency';
import { formatBytes } from '../shared/format';
import { readContentLength, readText } from '../shared/readers';
import { ScanView } from '../shared/ScanView';
import { countBySeverity, severityTone } from '../shared/severity';
import { useElementFocus } from '../shared/useElementFocus';
import { useScan } from '../shared/useScan';
import { type AssetCategory, type AssetItem, analyzeAssets, assessImage } from './analyzeAssets';
import { downloadAllInlineSvgs, downloadAssetUrl, downloadInlineSvg } from './assetDownload';
import { loadManifestIconItems } from './manifestIcons';
import '../shared/page.css';

type AssetFilter = 'all' | AssetCategory | 'alerts';

const FILTERS: readonly AssetFilter[] = [
  'all',
  'image',
  'background',
  'svg',
  'video',
  'favicon',
  'alerts',
];
const PAGE_SIZE = 80;
const CONCURRENCY = 4;

const AssetRow = ({
  item,
  bytes,
  onSelect,
}: {
  item: AssetItem;
  bytes: number | null;
  onSelect: (item: AssetItem) => void;
}) => {
  const t = useT();
  const alerts = assessImage({ ...item.input, bytes });
  const { input } = item;
  const sizeText =
    input.naturalWidth > 0
      ? `${input.naturalWidth}×${input.naturalHeight} → ${Math.round(input.displayWidth)}×${Math.round(input.displayHeight)}`
      : input.displayWidth > 0
        ? `${Math.round(input.displayWidth)}×${Math.round(input.displayHeight)}`
        : '';
  const canDownload = item.category !== 'video' || item.url !== '';

  return (
    <div className="ni-pg-row" style={{ gridTemplateColumns: 'auto 1fr auto' }}>
      <span className="ni-pg-thumb">
        {item.thumbnail ? <img src={item.thumbnail} alt="" loading="lazy" /> : null}
      </span>
      <button
        type="button"
        className="ni-pg-row__main ni-pg-row--button"
        style={{
          border: 0,
          background: 'transparent',
          color: 'inherit',
          font: 'inherit',
          textAlign: 'left',
          padding: 0,
        }}
        onClick={() => onSelect(item)}
        disabled={!item.element}
      >
        <span className="ni-pg-row__title">{item.name}</span>
        <span className="ni-pg-row__sub">
          {[
            t(`page.assets.filter.${item.category}`),
            item.format !== 'unknown' ? item.format : '',
            sizeText,
            bytes !== null ? formatBytes(bytes) : '',
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
        {alerts.length > 0 ? (
          <span className="ni-pg-inline">
            {alerts.map((alert) => (
              <Badge key={alert.id} tone={severityTone(alert.severity)}>
                {t(`page.assets.alert.${alert.id}`, alert.params)}
              </Badge>
            ))}
          </span>
        ) : null}
      </button>
      {canDownload ? (
        <button
          type="button"
          className="ni-icon-button"
          aria-label={t('page.assets.download', { name: item.name })}
          onClick={() =>
            item.svgMarkup
              ? downloadInlineSvg(item.svgMarkup, item.name)
              : void downloadAssetUrl(item.url, item.name)
          }
        >
          <Download size={14} aria-hidden="true" />
        </button>
      ) : (
        <span />
      )}
    </div>
  );
};

const AssetsView = ({ items: scanned, truncated }: { items: AssetItem[]; truncated: boolean }) => {
  const t = useT();
  const { focus } = useElementFocus();
  const [filter, setFilter] = useState<AssetFilter>('all');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [measured, setMeasured] = useState<ReadonlyMap<string, number>>(new Map());
  const [measuring, setMeasuring] = useState(false);
  const aborted = useRef(new AbortController());
  const [manifestItems, setManifestItems] = useState<AssetItem[]>([]);
  const items = [...scanned, ...manifestItems];

  useEffect(() => {
    let active = true;
    void loadManifestIconItems(document, readText).then((loaded) => {
      if (active) setManifestItems(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const controller = aborted.current;
    return () => controller.abort();
  }, []);

  const bytesOf = (item: AssetItem): number | null =>
    item.input.bytes ?? measured.get(item.url) ?? null;
  const withAlerts = (item: AssetItem) => assessImage({ ...item.input, bytes: bytesOf(item) });

  const filtered = items.filter((item) =>
    filter === 'all'
      ? true
      : filter === 'alerts'
        ? withAlerts(item).length > 0
        : item.category === filter,
  );
  const unmeasured = items.filter(
    (item) =>
      item.url &&
      !item.url.startsWith('data:') &&
      bytesOf(item) === null &&
      item.category !== 'video',
  );
  const allAlerts = items.flatMap(withAlerts);
  const counts = countBySeverity(allAlerts);
  const totalBytes = items.reduce((sum, item) => sum + (bytesOf(item) ?? 0), 0);
  const inlineSvgs = items.flatMap((item) =>
    item.svgMarkup ? [{ markup: item.svgMarkup, name: item.name }] : [],
  );

  const measureMissing = async (): Promise<void> => {
    setMeasuring(true);
    const urls = [...new Set(unmeasured.map((item) => item.url))];
    await runPool(
      urls,
      CONCURRENCY,
      async (url) => ({ url, length: await readContentLength(url) }),
      {
        signal: aborted.current.signal,
        onResult: ({ url, length }) => {
          if (length !== null) setMeasured((current) => new Map(current).set(url, length));
        },
      },
    );
    setMeasuring(false);
  };

  return (
    <>
      <PanelSection
        title={t('page.assets.section.summary', { n: items.length })}
        actions={
          inlineSvgs.length > 0 ? (
            <button
              type="button"
              className="ni-button"
              onClick={() => void downloadAllInlineSvgs(inlineSvgs)}
            >
              {t('page.assets.downloadSvgs', { n: inlineSvgs.length })}
            </button>
          ) : undefined
        }
      >
        <div className="ni-pg-inline">
          <Badge tone="accent">{formatBytes(totalBytes)}</Badge>
          <Badge tone={counts.warning + counts.error > 0 ? 'warning' : 'success'}>
            {t('page.assets.alertCount', { n: allAlerts.length })}
          </Badge>
        </div>
        {truncated ? <p className="ni-pg-muted">{t('page.assets.truncated')}</p> : null}
        {unmeasured.length > 0 ? (
          <button
            type="button"
            className="ni-button"
            disabled={measuring}
            onClick={() => void measureMissing()}
          >
            {t(measuring ? 'page.assets.measuring' : 'page.assets.measure', {
              n: unmeasured.length,
            })}
          </button>
        ) : null}
        <p className="ni-pg-muted">{t('page.assets.permissionNote')}</p>
      </PanelSection>
      <ChipGroup label={t('page.assets.filter')}>
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
            {t(`page.assets.filter.${entry}`)}
          </button>
        ))}
      </ChipGroup>
      <div className="ni-pg-pad">
        {filtered.length === 0 ? (
          <EmptyState title={t('page.assets.empty')} />
        ) : (
          filtered
            .slice(0, visible)
            .map((item) => (
              <AssetRow
                key={item.id}
                item={item}
                bytes={bytesOf(item)}
                onSelect={(selected) => selected.element && focus(selected.element, selected.name)}
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

const AssetsPanel = () => {
  const t = useT();
  const { state, rescan } = useScan(() => analyzeAssets(document));
  return (
    <ScanView state={state} onRescan={rescan}>
      {(result) =>
        result.items.length === 0 ? (
          <EmptyState title={t('page.assets.none.title')} hint={t('page.assets.none.hint')} />
        ) : (
          <AssetsView items={result.items} truncated={result.truncated} />
        )
      }
    </ScanView>
  );
};

const assets: ToolModule = {
  id: 'assets',
  group: 'page',
  icon: Images,
  mode: 'panel',
  Panel: AssetsPanel,
};

export default assets;
