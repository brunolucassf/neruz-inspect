import { Layers } from 'lucide-react';
import type { CSSProperties } from 'react';
import {
  getViewportRect,
  type HighlightItem,
  useHighlights,
  useViewportVersion,
} from '../../../lib/highlight';
import { useT } from '../../../lib/i18n';
import { getElementLabel, useElementPicker } from '../../../lib/picker';
import { Card, CopyRow, EmptyState, PanelSection } from '../../../ui';
import type { ToolModule } from '../../types';
import '../shared/tools.css';
import './gradient-shadow.css';
import {
  filterToTailwind,
  gradientToTailwind,
  hasAnyEffect,
  readEffects,
  shadowToTailwind,
} from './effects';

type PreviewProps = { style: CSSProperties; text?: string };

const Preview = ({ style, text }: PreviewProps) => (
  <div className="ni-effect-preview" style={style} aria-hidden="true">
    {text}
  </div>
);

const GradientShadowPanel = () => {
  const t = useT();
  const { hovered, locked } = useElementPicker();
  useViewportVersion();

  const target = locked ?? hovered;
  const effects = target ? readEffects(getComputedStyle(target)) : null;

  const highlights: HighlightItem[] = target
    ? [
        { kind: 'box', rect: getViewportRect(target) },
        { kind: 'label', rect: getViewportRect(target), text: getElementLabel(target) },
      ]
    : [];
  useHighlights(highlights);

  if (!target || !effects) {
    return (
      <EmptyState
        title={t('color.gradientShadow.empty.title')}
        hint={t('color.gradientShadow.empty.hint')}
      />
    );
  }

  if (!hasAnyEffect(effects)) {
    return (
      <>
        <EmptyState
          title={t('color.gradientShadow.none.title')}
          hint={t('color.gradientShadow.none.hint')}
        />
        <p className="ni-hint">{t(locked ? 'core.picker.locked' : 'core.picker.hint')}</p>
      </>
    );
  }

  const boxShadowText = effects.boxShadows.join(', ');
  const textShadowText = effects.textShadows.join(', ');

  return (
    <>
      {effects.gradients.length > 0 ? (
        <PanelSection title={t('color.gradientShadow.section.gradients')}>
          {effects.gradients.map((gradient) => (
            <Card key={gradient} variant="rows">
              <Preview style={{ backgroundImage: gradient }} />
              <CopyRow
                label="CSS"
                value={`background-image: ${gradient};`}
                copyValue={`background-image: ${gradient};`}
              />
              <CopyRow label="Tailwind" value={gradientToTailwind(gradient)} />
            </Card>
          ))}
        </PanelSection>
      ) : null}
      {effects.boxShadows.length > 0 ? (
        <PanelSection title={t('color.gradientShadow.section.boxShadow')}>
          <Card variant="rows">
            <Preview style={{ boxShadow: boxShadowText }} />
            <CopyRow
              label="CSS"
              value={`box-shadow: ${boxShadowText};`}
              copyValue={`box-shadow: ${boxShadowText};`}
            />
            <CopyRow label="Tailwind" value={shadowToTailwind(effects.boxShadows, 'box')} />
          </Card>
        </PanelSection>
      ) : null}
      {effects.textShadows.length > 0 ? (
        <PanelSection title={t('color.gradientShadow.section.textShadow')}>
          <Card variant="rows">
            <Preview style={{ textShadow: textShadowText }} text="Aa" />
            <CopyRow
              label="CSS"
              value={`text-shadow: ${textShadowText};`}
              copyValue={`text-shadow: ${textShadowText};`}
            />
            <CopyRow label="Tailwind" value={shadowToTailwind(effects.textShadows, 'text')} />
          </Card>
        </PanelSection>
      ) : null}
      {effects.filter || effects.backdropFilter ? (
        <PanelSection title={t('color.gradientShadow.section.filters')}>
          <Card variant="rows">
            {effects.filter ? (
              <>
                <CopyRow
                  label="CSS"
                  value={`filter: ${effects.filter};`}
                  copyValue={`filter: ${effects.filter};`}
                />
                <CopyRow label="Tailwind" value={filterToTailwind(effects.filter)} />
              </>
            ) : null}
            {effects.backdropFilter ? (
              <>
                <CopyRow
                  label="CSS"
                  value={`backdrop-filter: ${effects.backdropFilter};`}
                  copyValue={`backdrop-filter: ${effects.backdropFilter};`}
                />
                <CopyRow
                  label="Tailwind"
                  value={filterToTailwind(effects.backdropFilter, 'backdrop-')}
                />
              </>
            ) : null}
          </Card>
        </PanelSection>
      ) : null}
      <p className="ni-hint">{t('color.gradientShadow.tailwindNote')}</p>
      <p className="ni-hint">{t(locked ? 'core.picker.locked' : 'core.picker.hint')}</p>
    </>
  );
};

const gradientShadow: ToolModule = {
  id: 'gradientShadow',
  group: 'color',
  icon: Layers,
  mode: 'hover',
  Panel: GradientShadowPanel,
};

export default gradientShadow;
