import { ClipboardList, Copy, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import {
  type ClipboardEntry,
  clearClipboardHistory,
  copyText,
  getClipboardHistory,
} from '../../../lib/clipboard';
import { useLocale, useT } from '../../../lib/i18n';
import { STORAGE_KEYS } from '../../../lib/storage-keys';
import { toast } from '../../../lib/toast';
import { Card, EmptyState } from '../../../ui';
import { PanelMeta } from '../../../ui/PanelSlots';
import type { ToolModule } from '../../types';
import '../utils.css';

type HistoryState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; entries: ClipboardEntry[] };

const removeEntry = async (entry: ClipboardEntry): Promise<void> => {
  const current = await getClipboardHistory();
  const next = current.filter((item) => !(item.text === entry.text && item.at === entry.at));
  await browser.storage.local.set({ [STORAGE_KEYS.clipboardHistory]: next });
};

const ClipboardHistoryPanel = () => {
  const t = useT();
  const locale = useLocale();
  const [state, setState] = useState<HistoryState>({ status: 'loading' });
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    try {
      setState({ status: 'ready', entries: await getClipboardHistory() });
    } catch {
      setState({ status: 'error' });
    }
  }, []);

  useEffect(() => {
    void load();
    const handleChange = (changes: Record<string, unknown>, area: string): void => {
      if (area === 'local' && STORAGE_KEYS.clipboardHistory in changes) void load();
    };
    browser.storage.onChanged.addListener(handleChange);
    return () => browser.storage.onChanged.removeListener(handleChange);
  }, [load]);

  useEffect(() => {
    if (!isConfirmingClear) return;
    const timer = setTimeout(() => setIsConfirmingClear(false), 4000);
    return () => clearTimeout(timer);
  }, [isConfirmingClear]);

  if (state.status === 'loading') {
    return <EmptyState kind="loading" title={t('utils.clipboardHistory.loading')} />;
  }
  if (state.status === 'error') {
    return (
      <EmptyState
        kind="error"
        title={t('utils.clipboardHistory.error.title')}
        hint={t('utils.clipboardHistory.error.hint')}
        action={
          <button type="button" className="ni-button" onClick={() => void load()}>
            {t('core.error.retry')}
          </button>
        }
      />
    );
  }
  if (state.entries.length === 0) {
    return (
      <EmptyState
        title={t('utils.clipboardHistory.empty.title')}
        hint={t('utils.clipboardHistory.empty.hint')}
      />
    );
  }

  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' });

  const handleClear = async (): Promise<void> => {
    await clearClipboardHistory();
    setIsConfirmingClear(false);
    toast(t('utils.clipboardHistory.cleared'), 'success');
  };

  return (
    <>
      <PanelMeta>
        <span aria-live="polite">
          {t('utils.clipboardHistory.count', { n: state.entries.length })}
        </span>
      </PanelMeta>
      <div className="ni-ut-body">
        <Card variant="rows">
          <ul className="ni-ut-list">
            {state.entries.map((entry) => (
              <li key={`${entry.at}-${entry.text}`} className="ni-ut-item">
                <div className="ni-ut-item__text">
                  <span className="ni-ut-item__value" title={entry.text}>
                    {entry.text.replace(/\s+/g, ' ')}
                  </span>
                  <span className="ni-ut-item__meta">
                    {entry.label} · {formatter.format(entry.at)}
                  </span>
                </div>
                <button
                  type="button"
                  className="ni-icon-button"
                  aria-label={t('utils.clipboardHistory.copyAgain', { label: entry.label })}
                  title={t('utils.clipboardHistory.copyAgain', { label: entry.label })}
                  onClick={() => void copyText(entry.text, entry.label)}
                >
                  <Copy size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="ni-icon-button"
                  aria-label={t('utils.clipboardHistory.delete', { label: entry.label })}
                  title={t('utils.clipboardHistory.delete', { label: entry.label })}
                  onClick={() => void removeEntry(entry)}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <div className="ni-actions">
          {isConfirmingClear ? (
            <>
              <button
                type="button"
                className="ni-button ni-button--primary"
                onClick={() => void handleClear()}
              >
                {t('utils.clipboardHistory.confirmClear')}
              </button>
              <button
                type="button"
                className="ni-button"
                onClick={() => setIsConfirmingClear(false)}
              >
                {t('utils.clipboardHistory.cancel')}
              </button>
            </>
          ) : (
            <button type="button" className="ni-button" onClick={() => setIsConfirmingClear(true)}>
              <Trash2 size={14} aria-hidden="true" />
              {t('utils.clipboardHistory.clear')}
            </button>
          )}
        </div>
      </div>
      <p className="ni-hint">{t('utils.clipboardHistory.note')}</p>
    </>
  );
};

const clipboardHistory: ToolModule = {
  id: 'clipboardHistory',
  group: 'utils',
  icon: ClipboardList,
  mode: 'panel',
  Panel: ClipboardHistoryPanel,
};

export default clipboardHistory;
