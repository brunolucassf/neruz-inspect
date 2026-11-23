import { AlignLeft, Copy, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { copyText } from '../../../lib/clipboard';
import { useT } from '../../../lib/i18n';
import { Card } from '../../../ui';
import { PanelMeta } from '../../../ui/PanelSlots';
import type { ToolModule } from '../../types';
import '../utils.css';
import {
  clampCount,
  countWords,
  generateLorem,
  LOREM_LANGUAGES,
  LOREM_UNITS,
  type LoremLanguage,
  type LoremUnit,
  MAX_COUNT,
} from './lorem';

const LoremPanel = () => {
  const t = useT();
  const [language, setLanguage] = useState<LoremLanguage>('latin');
  const [unit, setUnit] = useState<LoremUnit>('paragraphs');
  const [countText, setCountText] = useState('3');
  const [startWithClassic, setStartWithClassic] = useState(true);
  const [nonce, setNonce] = useState(0);

  const count = clampCount(Number(countText), unit);

  // biome-ignore lint/correctness/useExhaustiveDependencies: nonce asks for a fresh random text
  const text = useMemo(
    () => generateLorem({ language, unit, count, startWithClassic }),
    [language, unit, count, startWithClassic, nonce],
  );

  const handleUnitChange = (next: LoremUnit): void => {
    setUnit(next);
    setCountText(next === 'words' ? '50' : next === 'sentences' ? '5' : '3');
  };

  return (
    <div className="ni-ut-body">
      <PanelMeta>
        <span aria-live="polite">{t('utils.lorem.words', { n: countWords(text) })}</span>
      </PanelMeta>
      <Card variant="padded" className="ni-ut-grid">
        <label className="ni-ut-label">
          {t('utils.lorem.language')}
          <select
            className="ni-ut-field"
            value={language}
            onChange={(event) => setLanguage(event.target.value as LoremLanguage)}
          >
            {LOREM_LANGUAGES.map((value) => (
              <option key={value} value={value}>
                {t(`utils.lorem.lang.${value}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="ni-ut-label">
          {t('utils.lorem.unit')}
          <select
            className="ni-ut-field"
            value={unit}
            onChange={(event) => handleUnitChange(event.target.value as LoremUnit)}
          >
            {LOREM_UNITS.map((value) => (
              <option key={value} value={value}>
                {t(`utils.lorem.unit.${value}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="ni-ut-label">
          {t('utils.lorem.count')}
          <input
            type="number"
            className="ni-ut-field"
            min={1}
            max={MAX_COUNT[unit]}
            value={countText}
            onChange={(event) => setCountText(event.target.value)}
          />
        </label>
        <label className="ni-ut-check">
          <input
            type="checkbox"
            checked={startWithClassic}
            onChange={(event) => setStartWithClassic(event.target.checked)}
          />
          {t('utils.lorem.classic')}
        </label>
      </Card>
      <pre className="ni-ut-output">{text}</pre>
      <div className="ni-actions">
        <button
          type="button"
          className="ni-button ni-button--primary"
          onClick={() => void copyText(text, t('utils.lorem.copyLabel'))}
        >
          <Copy size={14} aria-hidden="true" />
          {t('utils.lorem.copy')}
        </button>
        <button type="button" className="ni-button" onClick={() => setNonce(nonce + 1)}>
          <RefreshCw size={14} aria-hidden="true" />
          {t('utils.lorem.regenerate')}
        </button>
      </div>
    </div>
  );
};

const lorem: ToolModule = {
  id: 'lorem',
  group: 'utils',
  icon: AlignLeft,
  mode: 'panel',
  Panel: LoremPanel,
};

export default lorem;
