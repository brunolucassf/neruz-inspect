import { Blend } from 'lucide-react';
import { useMemo, useState } from 'react';
import { copyText } from '../../../lib/clipboard';
import { downloadText } from '../../../lib/download';
import { useHighlights, useViewportVersion } from '../../../lib/highlight';
import { useT } from '../../../lib/i18n';
import { Badge, Card, EmptyState, PanelSection, Swatch, Tabs, Tile, Tiles } from '../../../ui';
import type { ToolModule } from '../../types';
import { ColorReadout } from '../shared/ColorReadout';
import { buildElementHighlights, revealFirstOffscreen } from '../shared/ElementHighlights';
import { scanElements } from '../shared/scan';
import '../shared/tools.css';
import { type ScanRunner, useScan } from '../shared/useScan';
import {
  buildPaletteExport,
  type ExportFormat,
  PaletteCollector,
  type PaletteEntry,
} from './palette';

const EXPORT_FORMATS: readonly ExportFormat[] = ['css', 'tailwind', 'json'];

const EXPORT_FILES: Readonly<Record<ExportFormat, { name: string; mime: string }>> = {
  css: { name: 'palette.css', mime: 'text/css' },
  tailwind: { name: 'palette-theme.css', mime: 'text/css' },
  json: { name: 'palette.json', mime: 'application/json' },
};

const NO_ENTRIES: PaletteEntry[] = [];

const runPaletteScan: ScanRunner<PaletteEntry[]> = async (signal, onProgress) => {
  const collector = new PaletteCollector();
  const { truncated } = await scanElements((element, style) => collector.add(element, style), {
    signal,
    onProgress,
  });
  return { result: collector.build(), truncated };
};

const PalettePanel = () => {
  const t = useT();
  const { state, rescan } = useScan(runPaletteScan);
  const [selectedHex, setSelectedHex] = useState<string | null>(null);
  const [format, setFormat] = useState<ExportFormat>('css');
  useViewportVersion();

  const entries = state.status === 'done' ? state.result : NO_ENTRIES;
  const selected = entries.find((entry) => entry.hex === selectedHex) ?? null;
  const exportText = useMemo(
    () =>
      buildPaletteExport(
        entries.map((entry) => entry.hex),
        format,
      ),
    [entries, format],
  );

  useHighlights(
    selected
      ? buildElementHighlights(
          selected.elements,
          t('color.palette.uses', { n: selected.count, hex: selected.hex }),
        )
      : [],
  );

  const totalUses = entries.reduce((sum, entry) => sum + entry.count, 0);

  const select = (entry: PaletteEntry): void => {
    if (selectedHex === entry.hex) {
      setSelectedHex(null);
      return;
    }
    setSelectedHex(entry.hex);
    revealFirstOffscreen(entry.elements);
  };

  if (state.status === 'scanning') {
    const { scanned, total } = state.progress;
    return (
      <EmptyState
        kind="loading"
        title={t('color.palette.scanning')}
        hint={total > 0 ? `${scanned} / ${total}` : undefined}
      />
    );
  }

  if (state.status === 'error') {
    return (
      <EmptyState
        kind="error"
        title={t('color.palette.error.title')}
        hint={t('color.palette.error.hint')}
        action={
          <button type="button" className="ni-button" onClick={rescan}>
            {t('color.palette.rescan')}
          </button>
        }
      />
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        title={t('color.palette.empty.title')}
        hint={t('color.palette.empty.hint')}
        action={
          <button type="button" className="ni-button" onClick={rescan}>
            {t('color.palette.rescan')}
          </button>
        }
      />
    );
  }

  return (
    <>
      {state.truncated ? <p className="ni-notice">{t('color.palette.limit')}</p> : null}
      <Tiles columns={2}>
        <Tile label={t('color.palette.tile.colors')} value={entries.length} />
        <Tile label={t('color.palette.tile.uses')} value={totalUses} />
      </Tiles>
      <PanelSection
        title={t('color.palette.section.colors')}
        count={entries.length}
        actions={
          <button type="button" className="ni-button ni-button--sm" onClick={rescan}>
            {t('color.palette.rescan')}
          </button>
        }
      >
        <Card variant="rows">
          {entries.map((entry) => (
            <button
              key={entry.hex}
              type="button"
              className="ni-listbtn"
              aria-pressed={entry.hex === selectedHex}
              onClick={() => select(entry)}
            >
              <Swatch color={entry.hex} size={22} />
              <span className="ni-listbtn__main">
                <span className="ni-listbtn__title">{entry.hex}</span>
                <span className="ni-listbtn__sub">
                  {entry.roles.map((role) => t(`color.palette.role.${role}`)).join(' · ')}
                  {entry.hexes.length > 1
                    ? ` · ${t('color.palette.similar', { n: entry.hexes.length - 1 })}`
                    : ''}
                </span>
              </span>
              <Badge tone={entry.hex === selectedHex ? 'accent' : 'neutral'}>{entry.count}</Badge>
            </button>
          ))}
        </Card>
      </PanelSection>
      {selected ? (
        <PanelSection title={t('color.palette.section.selected')}>
          <ColorReadout color={selected.color} />
        </PanelSection>
      ) : (
        <p className="ni-hint">{t('color.palette.hint')}</p>
      )}
      <PanelSection title={t('color.palette.section.export')}>
        <Tabs
          label={t('color.palette.export.label')}
          items={EXPORT_FORMATS.map((id) => ({ id, label: t(`color.palette.export.${id}`) }))}
          value={format}
          onChange={setFormat}
        >
          <pre className="ni-code">{exportText}</pre>
          <div className="ni-actions">
            <button
              type="button"
              className="ni-button ni-button--primary"
              onClick={() => void copyText(exportText, t(`color.palette.export.${format}`))}
            >
              {t('color.copy')}
            </button>
            <button
              type="button"
              className="ni-button"
              onClick={() => {
                const file = EXPORT_FILES[format];
                downloadText(exportText, file.name, file.mime);
              }}
            >
              {t('color.download')}
            </button>
          </div>
        </Tabs>
      </PanelSection>
    </>
  );
};

const palette: ToolModule = {
  id: 'palette',
  group: 'color',
  icon: Blend,
  mode: 'panel',
  Panel: PalettePanel,
};

export default palette;
