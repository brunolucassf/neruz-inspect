import { Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useT } from '../../../lib/i18n';
import { PanelSection } from '../../../ui';
import type { ToolModule } from '../../types';
import '../shared/tools.css';
import { applyVisionMode, VISION_MODES, type VisionMode } from './colorblind';

type ModeChoice = VisionMode | 'original';

const CHOICES: readonly ModeChoice[] = ['original', ...VISION_MODES];

const DEFAULT_MODE: ModeChoice = 'deuteranopia';

const ColorblindPanel = () => {
  const t = useT();
  const [choice, setChoice] = useState<ModeChoice>(DEFAULT_MODE);

  useEffect(() => {
    if (choice === 'original') return;
    const applied = applyVisionMode(choice);
    return applied.remove;
  }, [choice]);

  return (
    <>
      <PanelSection title={t('color.colorblind.section.mode')}>
        <fieldset className="ni-segments">
          <legend className="ni-visually-hidden">{t('color.colorblind.section.mode')}</legend>
          {CHOICES.map((item) => (
            <button
              key={item}
              type="button"
              className="ni-segment"
              aria-pressed={item === choice}
              onClick={() => setChoice(item)}
            >
              {t(`color.colorblind.mode.${item}`)}
            </button>
          ))}
        </fieldset>
        <p className="ni-hint" aria-live="polite">
          {t(`color.colorblind.desc.${choice}`)}
        </p>
      </PanelSection>
      <p className="ni-hint">{t('color.colorblind.note')}</p>
    </>
  );
};

const colorblind: ToolModule = {
  id: 'colorblind',
  group: 'color',
  icon: Eye,
  mode: 'action',
  Panel: ColorblindPanel,
};

export default colorblind;
