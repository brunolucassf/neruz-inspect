import { Check, Download, Images } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useT } from '../../../lib/i18n';
import {
  Badge,
  Card,
  EmptyState,
  FilterChips,
  PanelSection,
  Ratio,
  Thumb,
  Tile,
  Tiles,
} from '../../../ui';
import type { ToolModule } from '../../types';
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
const TRANSPARENT_FORMATS: readonly string[] = ['png', 'svg', 'gif', 'webp', 'avif'];

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
      ? `${input.naturalWidth}×${input.naturalHeight}`
      : input.displayWidth > 0
        ? `${Math.round(input.displayWidth)}×${Math.round(input.displayHeight)}`
        : '';
  const canDownload = item.category !== 'video' || item.url !== '';
  const hasOversizeAlert = alerts.some((alert) => alert.id === 'oversized');
  const renderedWidth = input.displayWidth * Math.max(input.devicePixelRatio, 1);
  const chipAlerts = alerts.filter((alert) => alert.id !== 'oversized');

  return (
    <div className="ni-pg-row ni-pg-row--thumb">
      <Thumb
        src={item.thumbnail || undefined}
        hasTransparency={TRANSPARENT_FORMATS.includes(item.format)}
      />
      <button
        type="button"
        className="ni-pg-row__main ni-pg-row__select ni-pg-row--button"
        onClick={() => onSelect(item)}
        disabled={!item.element}
      >
        <span className="ni-pg-row__title">{item.name}</span>
        <span className="ni-pg-row__sub">
          {[
            t(`page.assets.filter.${item.category}`),
            item.format !== 'unknown' ? item.format.toUpperCase() : '',
            sizeText,
            bytes !== null ? formatBytes(bytes) : '',
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
        {hasOversizeAlert ? (
          <Ratio
            shown={renderedWidth}
            actual={input.naturalWidth}
            label={t('page.assets.ratio', {
              n: (input.naturalWidth / Math.max(renderedWidth, 1)).toFixed(1),
            })}
          />
        ) : null}
      </button>
      {canDownload ? (
        <button
          type="button"
          className="ni-icon-button"
          aria-label={t('page.assets.download', { name: item.name })}
          title={t('page.assets.download', { name: item.name })}
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
      {chipAlerts.length > 0 ? (
        <div className="ni-pg-row__chips">
          {chipAlerts.map((alert) => (
            <Badge key={alert.id} tone={severityTone(alert.severity)}>
              {t(`page.assets.alert.${alert.id}`, alert.params)}
            </Badge>
          ))}
        </div>
      ) : null}
      {alerts.length === 0 ? (
        <span className="ni-pg-row__ok">
          <Check aria-hidden="true" />
          {t('page.assets.noAlerts')}
        </span>
      ) : null}
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

  const matchesFilter = (item: AssetItem, entry: AssetFilter): boolean =>
    entry === 'all'
      ? true
      : entry === 'alerts'
        ? withAlerts(item).length > 0
        : item.category === entry;
  const filtered = items.filter((item) => matchesFilter(item, filter));
  const filterItems = FILTERS.map((entry) => ({
    id: entry,
    label: t(`page.assets.filter.${entry}`),
    count: items.filter((item) => matchesFilter(item, entry)).length,
    isWarning: entry === 'alerts',
  })).filter((entry) => entry.id === 'all' || entry.count > 0);
  const unmeasured = items.filter(
    (item) =>
      item.url &&
      !item.url.startsWith('data:') &&
      bytesOf(item) === null &&
      item.category !== 'video',
  );
  const allAlerts = items.flatMap(withAlerts);
  const counts = countBySeverity(allAlerts);
  const hasProblems = counts.warning + counts.error > 0;
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
      <Tiles columns={3}>
        <Tile label={t('page.assets.section.summary')} value={items.length} />
        <Tile label={t('page.assets.weight')} value={formatBytes(totalBytes)} />
        <Tile
          label={t('page.assets.alerts')}
          value={allAlerts.length}
          tone={hasProblems ? 'warning' : 'success'}
        />
      </Tiles>
      {truncated ? <p className="ni-hint">{t('page.assets.truncated')}</p> : null}
      {unmeasured.length > 0 || inlineSvgs.length > 0 ? (
        <div className="ni-actions">
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
          {inlineSvgs.length > 0 ? (
            <button
              type="button"
              className="ni-button"
              onClick={() => void downloadAllInlineSvgs(inlineSvgs)}
            >
              {t('page.assets.downloadSvgs', { n: inlineSvgs.length })}
            </button>
          ) : null}
        </div>
      ) : null}
      <p className="ni-hint">{t('page.assets.permissionNote')}</p>
      <FilterChips
        label={t('page.assets.filter')}
        items={filterItems}
        value={filter}
        onChange={(entry) => {
          setFilter(entry);
          setVisible(PAGE_SIZE);
        }}
      />
      {filtered.length === 0 ? (
        <EmptyState title={t('page.assets.empty')} />
      ) : (
        <PanelSection title={t('page.assets.section.summary')} count={filtered.length}>
          <Card variant="rows">
            <ul className="ni-pg-list">
              {filtered.slice(0, visible).map((item) => (
                <li key={item.id}>
                  <AssetRow
                    item={item}
                    bytes={bytesOf(item)}
                    onSelect={(selected) =>
                      selected.element && focus(selected.element, selected.name)
                    }
                  />
                </li>
              ))}
            </ul>
          </Card>
          {filtered.length > visible ? (
            <button
              type="button"
              className="ni-button"
              onClick={() => setVisible((n) => n + PAGE_SIZE)}
            >
              {t('page.common.showMore', { n: filtered.length - visible })}
            </button>
          ) : null}
        </PanelSection>
      )}
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
