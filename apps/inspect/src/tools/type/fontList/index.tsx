import { ExternalLink, ListTree } from 'lucide-react';
import { useState } from 'react';
import { useHighlights, useViewportVersion } from '../../../lib/highlight';
import { useT } from '../../../lib/i18n';
import { Badge, Card, CopyRow, EmptyState, PanelSection, Tile, Tiles } from '../../../ui';
import { buildElementHighlights, revealFirstOffscreen } from '../../color/shared/ElementHighlights';
import { scanElements } from '../../color/shared/scan';
import '../../color/shared/tools.css';
import { type ScanRunner, useScan } from '../../color/shared/useScan';
import type { ToolModule } from '../../types';
import { collectFontSources, type FontSource, googleSpecimenUrl } from '../shared/fonts';
import '../shared/type.css';
import { FontCollector, type FontUsage } from './fontList';

const NO_FONTS: FontUsage[] = [];

const SOURCE_TONE: Readonly<Record<FontSource, 'accent' | 'success' | 'neutral' | 'warning'>> = {
  google: 'success',
  adobe: 'success',
  selfHosted: 'accent',
  system: 'neutral',
  generic: 'neutral',
};

const runFontScan: ScanRunner<FontUsage[]> = async (signal, onProgress) => {
  const collector = new FontCollector(collectFontSources());
  const { truncated } = await scanElements((element, style) => collector.add(element, style), {
    signal,
    onProgress,
  });
  return { result: collector.build(), truncated };
};

const FontListPanel = () => {
  const t = useT();
  const { state, rescan } = useScan(runFontScan);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  useViewportVersion();

  const fonts = state.status === 'done' ? state.result : NO_FONTS;
  const selected = fonts.find((font) => font.family === selectedFamily) ?? null;

  useHighlights(
    selected
      ? buildElementHighlights(
          selected.elements,
          t('type.fontList.uses', { n: selected.count, family: selected.family }),
        )
      : [],
  );

  const totalUses = fonts.reduce((sum, font) => sum + font.count, 0);

  const select = (font: FontUsage): void => {
    if (selectedFamily === font.family) {
      setSelectedFamily(null);
      return;
    }
    setSelectedFamily(font.family);
    revealFirstOffscreen(font.elements);
  };

  if (state.status === 'scanning') {
    const { scanned, total } = state.progress;
    return (
      <EmptyState
        kind="loading"
        title={t('type.fontList.scanning')}
        hint={total > 0 ? `${scanned} / ${total}` : undefined}
      />
    );
  }

  const rescanButton = (
    <button type="button" className="ni-button ni-button--sm" onClick={rescan}>
      {t('type.fontList.rescan')}
    </button>
  );

  if (state.status === 'error') {
    return (
      <EmptyState
        kind="error"
        title={t('type.fontList.error.title')}
        hint={t('type.fontList.error.hint')}
        action={rescanButton}
      />
    );
  }

  if (fonts.length === 0) {
    return (
      <EmptyState
        title={t('type.fontList.empty.title')}
        hint={t('type.fontList.empty.hint')}
        action={rescanButton}
      />
    );
  }

  return (
    <>
      {state.truncated ? <p className="ni-notice">{t('type.fontList.limit')}</p> : null}
      <Tiles columns={2}>
        <Tile label={t('type.fontList.tile.fonts')} value={fonts.length} />
        <Tile label={t('type.fontList.tile.uses')} value={totalUses} />
      </Tiles>
      <PanelSection
        title={t('type.fontList.section.fonts')}
        count={fonts.length}
        actions={rescanButton}
      >
        <Card variant="rows">
          {fonts.map((font) => (
            <button
              key={font.family}
              type="button"
              className="ni-listbtn"
              aria-pressed={font.family === selectedFamily}
              onClick={() => select(font)}
            >
              <Badge tone={SOURCE_TONE[font.source]}>
                {t(`type.fontList.source.${font.source}`)}
              </Badge>
              <span className="ni-listbtn__main">
                <span className="ni-listbtn__title">{font.family}</span>
                <span className="ni-listbtn__sub">
                  {t('type.fontList.weights', { list: font.weights.join(', ') })}
                </span>
              </span>
              <Badge tone={font.family === selectedFamily ? 'accent' : 'neutral'}>
                {font.count}
              </Badge>
            </button>
          ))}
        </Card>
      </PanelSection>
      {selected ? (
        <PanelSection title={t('type.fontList.section.selected')}>
          <Card variant="rows">
            <CopyRow
              label={t('type.fontList.family')}
              value={selected.family}
              copyValue={`font-family: ${selected.family};`}
            />
            <CopyRow
              label={t('type.fontList.origin')}
              value={t(`type.fontList.source.${selected.source}`)}
            />
          </Card>
          {selected.source === 'google' ? (
            <a
              className="ni-button ni-button--sm ni-link-button"
              href={googleSpecimenUrl(selected.family)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={14} aria-hidden="true" />
              {t('type.fontList.googleLink')}
            </a>
          ) : null}
        </PanelSection>
      ) : (
        <p className="ni-hint">{t('type.fontList.hint')}</p>
      )}
    </>
  );
};

const fontList: ToolModule = {
  id: 'fontList',
  group: 'type',
  icon: ListTree,
  mode: 'panel',
  Panel: FontListPanel,
};

export default fontList;
