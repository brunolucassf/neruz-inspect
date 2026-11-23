import { ALargeSmall } from 'lucide-react';
import { useMemo, useState } from 'react';
import { copyText } from '../../../lib/clipboard';
import { formatLength } from '../../../lib/css';
import { downloadText } from '../../../lib/download';
import { useHighlights, useViewportVersion } from '../../../lib/highlight';
import { useT } from '../../../lib/i18n';
import { useSettingsStore } from '../../../lib/settings';
import { Badge, Card, EmptyState, PanelSection, Tabs, Tile, Tiles } from '../../../ui';
import { buildElementHighlights, revealFirstOffscreen } from '../../color/shared/ElementHighlights';
import { scanElements } from '../../color/shared/scan';
import '../../color/shared/tools.css';
import { type ScanRunner, useScan } from '../../color/shared/useScan';
import type { ToolModule } from '../../types';
import '../shared/type.css';
import { SizeCollector, type SizeEntry } from './sizeCollector';
import { buildSizeTokens, detectScale, type TokenFormat } from './typeScale';

const NO_SIZES: SizeEntry[] = [];

const TOKEN_FORMATS: readonly TokenFormat[] = ['css', 'tailwind'];

const SAMPLE_MAX_PX = 44;

const runSizeScan: ScanRunner<SizeEntry[]> = async (signal, onProgress) => {
  const collector = new SizeCollector();
  const { truncated } = await scanElements((element, style) => collector.add(element, style), {
    signal,
    onProgress,
  });
  return { result: collector.build(), truncated };
};

const TypeScalePanel = () => {
  const t = useT();
  const unit = useSettingsStore((state) => state.unit);
  const { state, rescan } = useScan(runSizeScan);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [format, setFormat] = useState<TokenFormat>('css');
  useViewportVersion();

  const sizes = state.status === 'done' ? state.result : NO_SIZES;
  const selected = sizes.find((entry) => entry.size === selectedSize) ?? null;
  const detection = useMemo(
    () => detectScale(sizes.map(({ size, count }) => ({ size, count }))),
    [sizes],
  );
  const tokens = useMemo(
    () =>
      buildSizeTokens(
        sizes.map(({ size }) => size),
        format,
        unit,
      ),
    [sizes, format, unit],
  );

  useHighlights(
    selected
      ? buildElementHighlights(
          selected.elements,
          t('type.typeScale.uses', { n: selected.count, size: formatLength(selected.size, unit) }),
        )
      : [],
  );

  const select = (entry: SizeEntry): void => {
    if (selectedSize === entry.size) {
      setSelectedSize(null);
      return;
    }
    setSelectedSize(entry.size);
    revealFirstOffscreen(entry.elements);
  };

  const rescanButton = (
    <button type="button" className="ni-button ni-button--sm" onClick={rescan}>
      {t('type.typeScale.rescan')}
    </button>
  );

  if (state.status === 'scanning') {
    const { scanned, total } = state.progress;
    return (
      <EmptyState
        kind="loading"
        title={t('type.typeScale.scanning')}
        hint={total > 0 ? `${scanned} / ${total}` : undefined}
      />
    );
  }

  if (state.status === 'error') {
    return (
      <EmptyState
        kind="error"
        title={t('type.typeScale.error.title')}
        hint={t('type.typeScale.error.hint')}
        action={rescanButton}
      />
    );
  }

  if (sizes.length === 0) {
    return (
      <EmptyState
        title={t('type.typeScale.empty.title')}
        hint={t('type.typeScale.empty.hint')}
        action={rescanButton}
      />
    );
  }

  const scaleSummary = (() => {
    if (!detection) return t('type.typeScale.scale.few');
    if (detection.fit < 0.5) return t('type.typeScale.scale.none', { ratio: detection.measured });
    return t('type.typeScale.scale.found', {
      ratio: detection.ratio,
      name: t(`type.typeScale.ratio.${detection.id}`),
      fit: Math.round(detection.fit * 100),
    });
  })();

  return (
    <>
      {state.truncated ? <p className="ni-notice">{t('type.typeScale.limit')}</p> : null}
      <Tiles columns={3}>
        <Tile label={t('type.typeScale.tile.sizes')} value={sizes.length} />
        <Tile label={t('type.typeScale.tile.ratio')} value={detection ? detection.ratio : '—'} />
        <Tile
          label={t('type.typeScale.tile.base')}
          value={detection ? formatLength(detection.base, unit) : '—'}
        />
      </Tiles>
      <PanelSection title={t('type.typeScale.section.scale')} actions={rescanButton}>
        <p className="ni-hint" aria-live="polite">
          {scaleSummary}
        </p>
      </PanelSection>
      <PanelSection title={t('type.typeScale.section.sizes')} count={sizes.length}>
        <Card variant="rows">
          {sizes.map((entry) => (
            <button
              key={entry.size}
              type="button"
              className="ni-listbtn"
              aria-pressed={entry.size === selectedSize}
              onClick={() => select(entry)}
            >
              <span
                className="ni-sample-text"
                style={{ fontSize: Math.min(entry.size, SAMPLE_MAX_PX), lineHeight: 1.1 }}
                aria-hidden="true"
              >
                Aa
              </span>
              <span className="ni-listbtn__main">
                <span className="ni-listbtn__title">{formatLength(entry.size, unit)}</span>
                <span className="ni-listbtn__sub">
                  {entry.tags.map((tag) => `<${tag}>`).join(' ')}
                </span>
              </span>
              <Badge tone={entry.size === selectedSize ? 'accent' : 'neutral'}>{entry.count}</Badge>
            </button>
          ))}
        </Card>
      </PanelSection>
      <PanelSection title={t('type.typeScale.section.export')}>
        <Tabs
          label={t('type.typeScale.export.label')}
          items={TOKEN_FORMATS.map((id) => ({ id, label: t(`type.typeScale.export.${id}`) }))}
          value={format}
          onChange={setFormat}
        >
          <pre className="ni-code">{tokens}</pre>
          <div className="ni-actions">
            <button
              type="button"
              className="ni-button ni-button--primary"
              onClick={() => void copyText(tokens, t(`type.typeScale.export.${format}`))}
            >
              {t('type.typeScale.copy')}
            </button>
            <button
              type="button"
              className="ni-button"
              onClick={() =>
                downloadText(
                  tokens,
                  format === 'css' ? 'font-sizes.css' : 'font-sizes.js',
                  format === 'css' ? 'text/css' : 'text/javascript',
                )
              }
            >
              {t('type.typeScale.download')}
            </button>
          </div>
        </Tabs>
        <p className="ni-hint">{t('type.typeScale.tailwindNote')}</p>
      </PanelSection>
    </>
  );
};

const typeScale: ToolModule = {
  id: 'typeScale',
  group: 'type',
  icon: ALargeSmall,
  mode: 'panel',
  Panel: TypeScalePanel,
};

export default typeScale;
