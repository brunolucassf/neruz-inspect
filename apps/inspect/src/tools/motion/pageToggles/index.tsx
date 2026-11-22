import { ToggleRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useT } from '../../../lib/i18n';
import type { ToolModule } from '../../types';
import { createPageToggles, TOGGLE_IDS, type ToggleId } from './pageToggles';
import './page-toggles.css';

type ToggleState = Record<ToggleId, boolean>;

const INITIAL_STATE: ToggleState = {
  cssOff: false,
  hideMedia: false,
  stopMotion: false,
  reducedMotion: false,
};

const PageTogglesPanel = () => {
  const t = useT();
  const [toggles] = useState(createPageToggles);
  const [state, setState] = useState<ToggleState>(INITIAL_STATE);
  const [reducedRules, setReducedRules] = useState(0);

  useEffect(() => () => toggles.dispose(), [toggles]);

  const flip = (id: ToggleId): void => {
    const next = !toggles.isOn(id);
    toggles.set(id, next);
    setState((current) => ({ ...current, [id]: next }));
    if (id === 'reducedMotion') setReducedRules(toggles.reducedRulesApplied());
  };

  const turnAllOff = (): void => {
    toggles.dispose();
    setState(INITIAL_STATE);
    setReducedRules(0);
  };

  const anyOn = TOGGLE_IDS.some((id) => state[id]);

  return (
    <>
      <ul className="ni-toggles">
        {TOGGLE_IDS.map((id) => (
          <li key={id} className="ni-toggles__item">
            <div className="ni-toggles__text">
              <span className="ni-toggles__title" id={`ni-toggle-${id}`}>
                {t(`motion.pageToggles.${id}.title`)}
              </span>
              <span className="ni-toggles__desc">{t(`motion.pageToggles.${id}.desc`)}</span>
              {id === 'reducedMotion' && state.reducedMotion ? (
                <span className="ni-toggles__desc">
                  {t('motion.pageToggles.reducedMotion.applied', { n: reducedRules })}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={state[id]}
              aria-labelledby={`ni-toggle-${id}`}
              className="ni-switch"
              onClick={() => flip(id)}
            >
              <span className="ni-switch__thumb" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <div className="ni-toggles__footer">
        <button type="button" className="ni-button" disabled={!anyOn} onClick={turnAllOff}>
          {t('motion.pageToggles.reset')}
        </button>
      </div>
      <p className="ni-hint">{t('motion.pageToggles.note')}</p>
    </>
  );
};

const pageToggles: ToolModule = {
  id: 'pageToggles',
  group: 'motion',
  icon: ToggleRight,
  mode: 'action',
  Panel: PageTogglesPanel,
};

export default pageToggles;
