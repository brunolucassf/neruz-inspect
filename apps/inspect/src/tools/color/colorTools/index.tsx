import { Wand } from 'lucide-react';
import { useMemo, useState } from 'react';
import { copyText } from '../../../lib/clipboard';
import { nearestTailwind, parseCssColor, toHex } from '../../../lib/color';
import { downloadText } from '../../../lib/download';
import { useT } from '../../../lib/i18n';
import { Card, CopyRow, EmptyState, PanelSection, Swatch, Tabs } from '../../../ui';
import type { ToolModule } from '../../types';
import { ColorReadout } from '../shared/ColorReadout';
import {
  buildColorScale,
  buildHarmonies,
  buildScaleCssVariables,
  buildScaleJson,
  buildScaleTailwind,
  type Harmony,
} from '../shared/colorMath';
import '../shared/tools.css';

type ScaleFormat = 'css' | 'tailwind' | 'json';

const SCALE_FORMATS: readonly ScaleFormat[] = ['css', 'tailwind', 'json'];

const SCALE_NAME = 'brand';

const DEFAULT_COLOR = '#4f46e5';

const HARMONY_LABELS: Readonly<Record<Harmony['id'], readonly string[]>> = {
  complementary: ['0°', '180°'],
  analogous: ['-30°', '0°', '+30°'],
  triadic: ['0°', '120°', '240°'],
};

const SCALE_FILES: Readonly<Record<ScaleFormat, { name: string; mime: string }>> = {
  css: { name: 'color-scale.css', mime: 'text/css' },
  tailwind: { name: 'color-scale.js', mime: 'text/javascript' },
  json: { name: 'color-scale.json', mime: 'application/json' },
};

const ColorToolsPanel = () => {
  const t = useT();
  const [text, setText] = useState(DEFAULT_COLOR);
  const [scaleFormat, setScaleFormat] = useState<ScaleFormat>('css');
  const color = useMemo(() => parseCssColor(text), [text]);

  const harmonies = useMemo(() => (color ? buildHarmonies(color) : []), [color]);
  const scale = useMemo(() => (color ? buildColorScale(color) : []), [color]);
  const nearest = useMemo(() => (color ? nearestTailwind(color) : null), [color]);

  const scaleText = useMemo(() => {
    if (scaleFormat === 'css') return buildScaleCssVariables(SCALE_NAME, scale);
    if (scaleFormat === 'tailwind') return buildScaleTailwind(SCALE_NAME, scale);
    return buildScaleJson(SCALE_NAME, scale);
  }, [scale, scaleFormat]);

  return (
    <>
      <PanelSection title={t('color.colorTools.input.label')}>
        <div className="ni-field-row">
          <input
            aria-label={t('color.colorTools.input.label')}
            className="ni-input"
            type="text"
            value={text}
            spellCheck={false}
            autoComplete="off"
            placeholder={t('color.colorTools.input.placeholder')}
            aria-invalid={color ? undefined : true}
            onChange={(event) => setText(event.target.value)}
          />
          <input
            className="ni-color-input"
            type="color"
            value={color ? toHex({ ...color, a: 1 }) : DEFAULT_COLOR}
            aria-label={t('color.colorTools.input.picker')}
            onChange={(event) => setText(event.target.value)}
          />
        </div>
      </PanelSection>
      {!color || !nearest ? (
        <EmptyState
          kind="error"
          title={t('color.colorTools.invalid.title')}
          hint={t('color.colorTools.invalid.hint')}
        />
      ) : (
        <>
          <PanelSection title={t('color.colorTools.section.formats')}>
            <ColorReadout color={color} />
          </PanelSection>
          <PanelSection title={t('color.colorTools.section.tailwind')}>
            <Card variant="rows">
              <CopyRow
                label={t('color.colorTools.nearest')}
                value={nearest.name}
                leading={<Swatch color={nearest.hex} />}
              />
              <CopyRow label={t('color.colorTools.nearestHex')} value={nearest.hex} />
              <CopyRow label={t('color.colorTools.distance')} value={String(nearest.distance)} />
            </Card>
          </PanelSection>
          {harmonies.map((harmony) => (
            <PanelSection key={harmony.id} title={t(`color.colorTools.harmony.${harmony.id}`)}>
              <Card variant="rows">
                {harmony.colors.map((harmonyColor, index) => (
                  <CopyRow
                    key={`${harmony.id}-${HARMONY_LABELS[harmony.id][index]}`}
                    label={HARMONY_LABELS[harmony.id][index] ?? ''}
                    value={toHex(harmonyColor)}
                    leading={<Swatch color={toHex(harmonyColor)} />}
                  />
                ))}
              </Card>
            </PanelSection>
          ))}
          <PanelSection title={t('color.colorTools.section.scale')}>
            <fieldset className="ni-strip">
              <legend className="ni-visually-hidden">{t('color.colorTools.scale.aria')}</legend>
              {scale.map(({ step, color: stepColor }) => (
                <button
                  key={step}
                  type="button"
                  className="ni-strip__cell"
                  style={{ background: toHex(stepColor) }}
                  title={`${step} ${toHex(stepColor)}`}
                  aria-label={t('core.copy.aria', { label: `${step} ${toHex(stepColor)}` })}
                  onClick={() => void copyText(toHex(stepColor), `${step}`)}
                />
              ))}
            </fieldset>
            <Tabs
              label={t('color.colorTools.scale.format')}
              items={SCALE_FORMATS.map((id) => ({ id, label: t(`color.colorTools.scale.${id}`) }))}
              value={scaleFormat}
              onChange={setScaleFormat}
            >
              <pre className="ni-code">{scaleText}</pre>
              <div className="ni-actions">
                <button
                  type="button"
                  className="ni-button ni-button--primary"
                  onClick={() =>
                    void copyText(scaleText, t(`color.colorTools.scale.${scaleFormat}`))
                  }
                >
                  {t('color.copy')}
                </button>
                <button
                  type="button"
                  className="ni-button"
                  onClick={() => {
                    const file = SCALE_FILES[scaleFormat];
                    downloadText(scaleText, file.name, file.mime);
                  }}
                >
                  {t('color.download')}
                </button>
              </div>
            </Tabs>
          </PanelSection>
        </>
      )}
    </>
  );
};

const colorTools: ToolModule = {
  id: 'colorTools',
  group: 'color',
  icon: Wand,
  mode: 'panel',
  Panel: ColorToolsPanel,
};

export default colorTools;
