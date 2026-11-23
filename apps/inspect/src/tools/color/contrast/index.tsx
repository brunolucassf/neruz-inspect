import { SunMoon } from 'lucide-react';
import {
  type Color,
  contrastApca,
  contrastWcag,
  formatColor,
  parseCssColor,
  toHex,
  wcagVerdict,
} from '../../../lib/color';
import {
  getViewportRect,
  type HighlightItem,
  useHighlights,
  useViewportVersion,
} from '../../../lib/highlight';
import { useT } from '../../../lib/i18n';
import { getElementLabel, useElementPicker } from '../../../lib/picker';
import { useSettingsStore } from '../../../lib/settings';
import { Badge, Card, CopyRow, EmptyState, PanelSection, Swatch, Tile, Tiles } from '../../../ui';
import type { ToolModule } from '../../types';
import '../shared/tools.css';
import {
  isLargeText,
  readEffectiveBackground,
  requiredAaRatio,
  suggestPassingColor,
} from './contrast';

type Reading = {
  foreground: Color;
  background: Color;
  uncertain: boolean;
  large: boolean;
  ratio: number;
};

const readContrast = (element: Element): Reading | null => {
  const style = getComputedStyle(element);
  const foreground = parseCssColor(style.color);
  if (!foreground) return null;
  const { color: background, uncertain } = readEffectiveBackground(element);
  const large = isLargeText(
    Number.parseFloat(style.fontSize),
    Number.parseInt(style.fontWeight, 10),
  );
  return { foreground, background, uncertain, large, ratio: contrastWcag(foreground, background) };
};

const VerdictBadge = ({ label, passes }: { label: string; passes: boolean }) => (
  <Badge tone={passes ? 'success' : 'danger'}>
    {label} {passes ? '✓' : '✗'}
  </Badge>
);

const ContrastPanel = () => {
  const t = useT();
  const colorFormat = useSettingsStore((state) => state.colorFormat);
  const { hovered, locked } = useElementPicker();
  useViewportVersion();

  const target = locked ?? hovered;
  const reading = target ? readContrast(target) : null;
  const verdict = reading ? wcagVerdict(reading.ratio) : null;
  const apca = reading ? contrastApca(reading.foreground, reading.background) : 0;
  const suggestion =
    reading && verdict && !(reading.large ? verdict.aaLarge : verdict.aa)
      ? suggestPassingColor(reading.foreground, reading.background, requiredAaRatio(reading.large))
      : null;

  const highlights: HighlightItem[] =
    target && reading
      ? [
          { kind: 'box', rect: getViewportRect(target) },
          {
            kind: 'label',
            rect: getViewportRect(target),
            text: `${getElementLabel(target)}  ${reading.ratio.toFixed(2)}:1`,
          },
        ]
      : [];
  useHighlights(highlights);

  if (!target || !reading || !verdict) {
    return (
      <EmptyState title={t('color.contrast.empty.title')} hint={t('color.contrast.empty.hint')} />
    );
  }

  const foregroundHex = toHex(reading.foreground);
  const backgroundHex = toHex(reading.background);

  return (
    <>
      <div
        className="ni-sample"
        style={{ color: foregroundHex, background: backgroundHex }}
        role="img"
        aria-label={t('color.contrast.sample.aria')}
      >
        {t('color.contrast.sample')}
      </div>
      <PanelSection title={t('color.contrast.section.colors')}>
        <Card variant="rows">
          <CopyRow
            label={t('color.contrast.text')}
            value={formatColor(reading.foreground, colorFormat)}
            leading={<Swatch color={foregroundHex} />}
          />
          <CopyRow
            label={t('color.contrast.background')}
            value={formatColor(reading.background, colorFormat)}
            leading={<Swatch color={backgroundHex} />}
          />
        </Card>
        {reading.uncertain ? <p className="ni-notice">{t('color.contrast.uncertain')}</p> : null}
      </PanelSection>
      <PanelSection title={t('color.contrast.section.scores')}>
        <Tiles columns={2}>
          <Tile
            label="WCAG"
            value={reading.ratio.toFixed(2)}
            unit=":1"
            tone={(reading.large ? verdict.aaLarge : verdict.aa) ? 'success' : 'danger'}
          />
          <Tile label="APCA" value={apca.toFixed(1)} unit="Lc" />
        </Tiles>
        <div className="ni-verdicts">
          <VerdictBadge label={t('color.contrast.aaNormal')} passes={verdict.aa} />
          <VerdictBadge label={t('color.contrast.aaLarge')} passes={verdict.aaLarge} />
          <VerdictBadge label={t('color.contrast.aaaNormal')} passes={verdict.aaa} />
          <VerdictBadge label={t('color.contrast.aaaLarge')} passes={verdict.aaaLarge} />
        </div>
        <p className="ni-hint">
          {t(reading.large ? 'color.contrast.sizeLarge' : 'color.contrast.sizeNormal')}
        </p>
      </PanelSection>
      {suggestion ? (
        <PanelSection title={t('color.contrast.section.suggestion')}>
          <Card variant="rows">
            <CopyRow
              label={t('color.contrast.suggested')}
              value={formatColor(suggestion, colorFormat)}
              leading={<Swatch color={toHex(suggestion)} />}
            />
            <CopyRow
              label={t('color.contrast.suggestedRatio')}
              value={`${contrastWcag(suggestion, reading.background).toFixed(2)}:1`}
            />
          </Card>
        </PanelSection>
      ) : null}
      <p className="ni-hint">{t(locked ? 'core.picker.locked' : 'core.picker.hint')}</p>
    </>
  );
};

const contrast: ToolModule = {
  id: 'contrast',
  group: 'color',
  icon: SunMoon,
  mode: 'hover',
  Panel: ContrastPanel,
};

export default contrast;
