import { Type } from 'lucide-react';
import { useMemo } from 'react';
import { copyText } from '../../../lib/clipboard';
import { formatColor, parseCssColor, toHex } from '../../../lib/color';
import { formatLength, parsePx, toCssText } from '../../../lib/css';
import {
  getViewportRect,
  type HighlightItem,
  useHighlights,
  useViewportVersion,
} from '../../../lib/highlight';
import { useT } from '../../../lib/i18n';
import { getElementLabel, useElementPicker } from '../../../lib/picker';
import { useSettingsStore } from '../../../lib/settings';
import { Badge, Card, CopyRow, EmptyState, PanelSection, Swatch } from '../../../ui';
import '../../color/shared/tools.css';
import type { ToolModule } from '../../types';
import { createFamilyProbe, inferRenderedFamily, parseFontFamilyList } from '../shared/fonts';

const FONT_PROPERTIES = [
  'font-family',
  'font-weight',
  'font-size',
  'font-style',
  'line-height',
  'letter-spacing',
  'text-transform',
  'color',
] as const;

const lineHeightLabel = (lineHeight: string, fontSize: number, unit: 'px' | 'rem'): string => {
  if (lineHeight === 'normal') return 'normal';
  const px = parsePx(lineHeight);
  const ratio = fontSize > 0 ? Math.round((px / fontSize) * 100) / 100 : 0;
  return `${formatLength(px, unit)} (${ratio})`;
};

const FontHoverPanel = () => {
  const t = useT();
  const unit = useSettingsStore((state) => state.unit);
  const colorFormat = useSettingsStore((state) => state.colorFormat);
  const { hovered, locked } = useElementPicker();
  useViewportVersion();

  const target = locked ?? hovered;
  const style = target ? getComputedStyle(target) : null;
  const fontFamily = style?.fontFamily ?? '';
  const rendered = useMemo(
    () =>
      fontFamily ? inferRenderedFamily(parseFontFamilyList(fontFamily), createFamilyProbe()) : null,
    [fontFamily],
  );

  const highlights: HighlightItem[] =
    target && style && rendered
      ? [
          { kind: 'box', rect: getViewportRect(target) },
          {
            kind: 'label',
            rect: getViewportRect(target),
            text: `${getElementLabel(target)}  ${rendered.family} ${style.fontWeight} ${style.fontSize}`,
          },
        ]
      : [];
  useHighlights(highlights);

  if (!target || !style || !rendered) {
    return (
      <EmptyState title={t('type.fontHover.empty.title')} hint={t('type.fontHover.empty.hint')} />
    );
  }

  const fontSize = parsePx(style.fontSize);
  const color = parseCssColor(style.color);
  const cssBlock = toCssText(
    Object.fromEntries(FONT_PROPERTIES.map((name) => [name, style.getPropertyValue(name)])),
    { selector: getElementLabel(target) },
  );
  const letterSpacing =
    style.letterSpacing === 'normal' ? 'normal' : formatLength(parsePx(style.letterSpacing), unit);

  return (
    <>
      <PanelSection
        title={t('type.fontHover.section.family')}
        actions={<Badge tone="accent">{t(`type.fontHover.kind.${rendered.kind}`)}</Badge>}
      >
        <Card variant="rows">
          <CopyRow
            label={t('type.fontHover.rendered')}
            value={rendered.family}
            copyValue={`font-family: ${rendered.family};`}
          />
          <CopyRow
            label={t('type.fontHover.declared')}
            value={style.fontFamily}
            copyValue={`font-family: ${style.fontFamily};`}
          />
        </Card>
        {rendered.fellBack ? (
          <p className="ni-hint">{t('type.fontHover.fallback', { family: rendered.declared })}</p>
        ) : null}
      </PanelSection>
      <PanelSection title={t('type.fontHover.section.text')}>
        <Card variant="rows">
          <CopyRow
            label={t('type.fontHover.weight')}
            value={style.fontWeight}
            copyValue={`font-weight: ${style.fontWeight};`}
          />
          <CopyRow
            label={t('type.fontHover.size')}
            value={formatLength(fontSize, unit)}
            copyValue={`font-size: ${formatLength(fontSize, unit)};`}
          />
          <CopyRow
            label={t('type.fontHover.lineHeight')}
            value={lineHeightLabel(style.lineHeight, fontSize, unit)}
            copyValue={`line-height: ${style.lineHeight};`}
          />
          <CopyRow
            label={t('type.fontHover.letterSpacing')}
            value={letterSpacing}
            copyValue={`letter-spacing: ${style.letterSpacing};`}
          />
          <CopyRow
            label={t('type.fontHover.transform')}
            value={style.textTransform}
            copyValue={`text-transform: ${style.textTransform};`}
          />
          {style.fontStyle !== 'normal' ? (
            <CopyRow
              label={t('type.fontHover.style')}
              value={style.fontStyle}
              copyValue={`font-style: ${style.fontStyle};`}
            />
          ) : null}
          {color ? (
            <CopyRow
              label={t('type.fontHover.color')}
              value={formatColor(color, colorFormat)}
              leading={<Swatch color={toHex(color)} />}
            />
          ) : null}
        </Card>
      </PanelSection>
      <div className="ni-actions">
        <button
          type="button"
          className="ni-button ni-button--primary"
          onClick={() => void copyText(cssBlock, 'CSS')}
        >
          {t('type.fontHover.copyCss')}
        </button>
      </div>
      <p className="ni-hint">{t(locked ? 'core.picker.locked' : 'core.picker.hint')}</p>
    </>
  );
};

const fontHover: ToolModule = {
  id: 'fontHover',
  group: 'type',
  icon: Type,
  mode: 'hover',
  Panel: FontHoverPanel,
};

export default fontHover;
