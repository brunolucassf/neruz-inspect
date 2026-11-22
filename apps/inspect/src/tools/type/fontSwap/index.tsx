import { ExternalLink, Replace } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useT } from '../../../lib/i18n';
import { toast } from '../../../lib/toast';
import { Badge, CopyRow, EmptyState, PanelSection } from '../../../ui';
import '../../color/shared/tools.css';
import type { ToolModule } from '../../types';
import { googleSpecimenUrl } from '../shared/fonts';
import '../shared/type.css';
import {
  applyFontSwap,
  buildCssFontFamily,
  CURATED_FONTS,
  getFallbackGeneric,
  isValidFamilyName,
  normalizeFamilyName,
  SWAP_SCOPES,
  type SwapScope,
} from './fontSwap';

type Selection = { family: string; scope: SwapScope };

type Status = 'idle' | 'loading' | 'applied' | 'blocked' | 'failed';

const FontSwapPanel = () => {
  const t = useT();
  const selectId = useId();
  const fieldId = useId();
  const [scope, setScope] = useState<SwapScope>('all');
  const [selection, setSelection] = useState<Selection | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [customName, setCustomName] = useState('');
  const [customInvalid, setCustomInvalid] = useState(false);

  useEffect(() => {
    if (!selection) {
      setStatus('idle');
      return;
    }
    setStatus('loading');
    let active = true;
    const handle = applyFontSwap(
      selection.family,
      selection.scope,
      getFallbackGeneric(selection.family),
    );
    handle.result.then((outcome) => {
      if (active) setStatus(outcome);
    });
    return () => {
      active = false;
      handle.remove();
    };
  }, [selection]);

  const choose = (family: string, nextScope: SwapScope = scope): void => {
    setSelection({ family, scope: nextScope });
  };

  const changeScope = (nextScope: SwapScope): void => {
    setScope(nextScope);
    if (selection) choose(selection.family, nextScope);
  };

  const applyCustom = (): void => {
    const name = normalizeFamilyName(customName);
    if (!isValidFamilyName(name)) {
      setCustomInvalid(true);
      return;
    }
    setCustomInvalid(false);
    choose(name);
  };

  const restore = (): void => {
    setSelection(null);
    toast(t('type.fontSwap.restored'), 'success');
  };

  const curatedValue = CURATED_FONTS.some((font) => font.name === selection?.family)
    ? (selection?.family ?? '')
    : '';

  return (
    <>
      <PanelSection title={t('type.fontSwap.section.scope')}>
        <fieldset className="ni-segments">
          <legend className="ni-visually-hidden">{t('type.fontSwap.section.scope')}</legend>
          {SWAP_SCOPES.map((item) => (
            <button
              key={item}
              type="button"
              className="ni-segment"
              aria-pressed={item === scope}
              onClick={() => changeScope(item)}
            >
              {t(`type.fontSwap.scope.${item}`)}
            </button>
          ))}
        </fieldset>
      </PanelSection>
      <PanelSection title={t('type.fontSwap.section.font')}>
        <label htmlFor={selectId} className="ni-hint">
          {t('type.fontSwap.popular')}
        </label>
        <select
          id={selectId}
          className="ni-field"
          value={curatedValue}
          onChange={(event) => {
            if (event.target.value) choose(event.target.value);
          }}
        >
          <option value="">{t('type.fontSwap.choose')}</option>
          {CURATED_FONTS.map((font) => (
            <option key={font.name} value={font.name}>
              {font.name}
            </option>
          ))}
        </select>
        <label htmlFor={fieldId} className="ni-hint">
          {t('type.fontSwap.custom')}
        </label>
        <div className="ni-field-row">
          <input
            id={fieldId}
            className="ni-field"
            type="text"
            value={customName}
            spellCheck={false}
            autoComplete="off"
            placeholder={t('type.fontSwap.custom.placeholder')}
            aria-invalid={customInvalid ? true : undefined}
            onChange={(event) => {
              setCustomName(event.target.value);
              setCustomInvalid(false);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') applyCustom();
            }}
          />
          <button type="button" className="ni-button" onClick={applyCustom}>
            {t('type.fontSwap.apply')}
          </button>
        </div>
        {customInvalid ? (
          <p className="ni-notice ni-notice--danger">{t('type.fontSwap.invalid')}</p>
        ) : null}
      </PanelSection>
      {status === 'loading' ? (
        <EmptyState
          kind="loading"
          title={t('type.fontSwap.loading', { family: selection?.family ?? '' })}
        />
      ) : null}
      {status === 'blocked' ? (
        <EmptyState
          kind="error"
          title={t('type.fontSwap.blocked.title')}
          hint={t('type.fontSwap.blocked.hint')}
        />
      ) : null}
      {status === 'failed' ? (
        <EmptyState
          kind="error"
          title={t('type.fontSwap.failed.title', { family: selection?.family ?? '' })}
          hint={t('type.fontSwap.failed.hint')}
        />
      ) : null}
      {status === 'applied' && selection ? (
        <PanelSection
          title={t('type.fontSwap.section.applied')}
          actions={<Badge tone="success">{selection.family}</Badge>}
        >
          <CopyRow
            label="CSS"
            value={`font-family: ${buildCssFontFamily(selection.family, getFallbackGeneric(selection.family))};`}
          />
          <a
            className="ni-button ni-link-button"
            href={googleSpecimenUrl(selection.family)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={14} aria-hidden="true" />
            {t('type.fontSwap.googleLink')}
          </a>
        </PanelSection>
      ) : null}
      {selection ? (
        <div className="ni-tool-pad">
          <button type="button" className="ni-button" onClick={restore}>
            {t('type.fontSwap.reset')}
          </button>
        </div>
      ) : null}
      <p className="ni-hint">{t('type.fontSwap.googleNote')}</p>
    </>
  );
};

const fontSwap: ToolModule = {
  id: 'fontSwap',
  group: 'type',
  icon: Replace,
  mode: 'action',
  Panel: FontSwapPanel,
};

export default fontSwap;
