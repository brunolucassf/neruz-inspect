import { LOCALE_NATIVE_NAMES, LOCALE_PREFERENCES, type LocalePreference } from '@neruz/i18n';
import { useCallback, useEffect, useId, useState } from 'react';
import { clearClipboardHistory, getClipboardHistory } from '../lib/clipboard';
import { COLOR_FORMATS, type ColorFormat } from '../lib/color';
import { useLocale, useT } from '../lib/i18n';
import {
  type DockSide,
  LENGTH_UNITS,
  type Settings,
  updateSettings,
  useSettingsStore,
} from '../lib/settings';
import { Credits } from '../overlay/Credits';
import './options.css';

type SelectFieldProps<TValue extends string> = {
  label: string;
  hint?: string;
  value: TValue;
  options: readonly { value: TValue; label: string }[];
  onChange: (value: TValue) => void;
};

const SelectField = <TValue extends string>({
  label,
  hint,
  value,
  options,
  onChange,
}: SelectFieldProps<TValue>) => {
  const id = useId();
  return (
    <div className="ni-field">
      <label className="ni-field__label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="ni-field__control"
        value={value}
        onChange={(event) => onChange(event.target.value as TValue)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <p className="ni-field__hint">{hint}</p> : null}
    </div>
  );
};

const useHistoryCount = (): { count: number; clear: () => Promise<void> } => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    void getClipboardHistory().then((entries) => setCount(entries.length));
  }, []);
  const clear = useCallback(async () => {
    await clearClipboardHistory();
    setCount(0);
  }, []);
  return { count, clear };
};

export const OptionsApp = () => {
  const t = useT();
  const locale = useLocale();
  const settings = useSettingsStore((state) => state);
  const history = useHistoryCount();
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = t('core.options.title');
  }, [locale, t]);

  const save = useCallback((patch: Partial<Settings>) => void updateSettings(patch), []);

  const clearHistory = async (): Promise<void> => {
    await history.clear();
    setStatusMessage(t('core.options.history.cleared'));
  };

  const localeOptions = LOCALE_PREFERENCES.map((preference) => ({
    value: preference,
    label:
      preference === 'auto' ? t('core.options.language.auto') : LOCALE_NATIVE_NAMES[preference],
  }));

  return (
    <main className="ni-options">
      <h1 className="ni-options__title">{t('core.options.title')}</h1>
      <p className="ni-options__lead">{t('core.options.privacy')}</p>

      <SelectField<LocalePreference>
        label={t('core.options.language')}
        value={settings.locale}
        options={localeOptions}
        onChange={(locale) => save({ locale })}
      />
      <SelectField<ColorFormat>
        label={t('core.options.colorFormat')}
        value={settings.colorFormat}
        options={COLOR_FORMATS.map((format) => ({ value: format, label: format.toUpperCase() }))}
        onChange={(colorFormat) => save({ colorFormat })}
      />
      <SelectField<Settings['unit']>
        label={t('core.options.unit')}
        hint={t('core.options.unit.hint')}
        value={settings.unit}
        options={LENGTH_UNITS.map((unit) => ({ value: unit, label: unit }))}
        onChange={(unit) => save({ unit })}
      />
      <SelectField<DockSide>
        label={t('core.options.dock')}
        value={settings.dock}
        options={[
          { value: 'left', label: t('core.panel.dockLeft') },
          { value: 'right', label: t('core.panel.dockRight') },
        ]}
        onChange={(dock) => save({ dock })}
      />

      <div className="ni-field">
        <span className="ni-field__label">{t('core.options.history')}</span>
        <div className="ni-field__row">
          <span>{t('core.options.history.count', { n: history.count })}</span>
          <button
            type="button"
            className="ni-button"
            disabled={history.count === 0}
            onClick={() => void clearHistory()}
          >
            {t('core.options.history.clear')}
          </button>
        </div>
        <p className="ni-field__hint" role="status">
          {statusMessage}
        </p>
      </div>

      <p className="ni-options__shortcut">{t('core.options.shortcut')}</p>
      <Credits />
    </main>
  );
};
