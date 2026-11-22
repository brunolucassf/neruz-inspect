import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import { useLocale, useT } from '../lib/i18n';
import { STORAGE_KEYS } from '../lib/storage-keys';
import { Credits } from '../overlay/Credits';
import { EmptyState } from '../ui';
import './report.css';

const HOST_PERMISSIONS = { origins: ['http://*/*', 'https://*/*'] };

type StoredReport = { data: Record<string, unknown>; openedAt: number };

const isStoredReport = (value: unknown): value is StoredReport =>
  typeof value === 'object' &&
  value !== null &&
  'data' in value &&
  'openedAt' in value &&
  typeof value.openedAt === 'number' &&
  typeof value.data === 'object' &&
  value.data !== null;

type LoadState = { status: 'loading' } | { status: 'ready'; report: StoredReport | null };

const useStoredReport = (): LoadState => {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  useEffect(() => {
    void browser.storage.session.get(STORAGE_KEYS.report).then((stored) => {
      const value: unknown = stored[STORAGE_KEYS.report];
      setState({ status: 'ready', report: isStoredReport(value) ? value : null });
    });
  }, []);
  return state;
};

type PermissionState = 'idle' | 'granted' | 'denied';

const PermissionRequest = () => {
  const t = useT();
  const [state, setState] = useState<PermissionState>('idle');

  useEffect(() => {
    void browser.permissions
      .contains(HOST_PERMISSIONS)
      .then((granted) => granted && setState('granted'));
  }, []);

  const requestAccess = async (): Promise<void> => {
    const granted = await browser.permissions.request(HOST_PERMISSIONS);
    setState(granted ? 'granted' : 'denied');
  };

  return (
    <section className="ni-report__permissions">
      <h2>{t('core.report.permissions.title')}</h2>
      <p>{t('core.report.permissions.hint')}</p>
      <button
        type="button"
        className="ni-button"
        disabled={state === 'granted'}
        onClick={() => void requestAccess()}
      >
        {t('core.report.permissions.grant')}
      </button>
      <p role="status">
        {state === 'granted' ? t('core.report.permissions.granted') : null}
        {state === 'denied' ? t('core.report.permissions.denied') : null}
      </p>
    </section>
  );
};

export const ReportApp = () => {
  const t = useT();
  const locale = useLocale();
  const load = useStoredReport();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = `${t('core.report.title')} · Neruz Inspect`;
  }, [locale, t]);

  const report = load.status === 'ready' ? load.report : null;
  const generatedAt = report
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short' }).format(
        report.openedAt,
      )
    : '';
  const source = typeof report?.data.url === 'string' ? report.data.url : '';

  return (
    <main className="ni-report">
      <header className="ni-report__header">
        <div>
          <h1>{t('core.report.title')}</h1>
          {report ? <p>{t('core.report.generatedAt', { date: generatedAt })}</p> : null}
          {source ? (
            <p>
              {t('core.report.source')}: <code>{source}</code>
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="ni-button ni-button--primary"
          onClick={() => window.print()}
        >
          {t('core.report.print')}
        </button>
      </header>

      {load.status === 'loading' ? (
        <EmptyState kind="loading" title={t('core.state.loading')} />
      ) : report ? (
        <>
          <p className="ni-report__note">{t('core.report.placeholder')}</p>
          {Object.entries(report.data).map(([section, value]) => (
            <section key={section} className="ni-report__section">
              <h2>{section}</h2>
              <pre>{JSON.stringify(value, null, 2)}</pre>
            </section>
          ))}
        </>
      ) : (
        <EmptyState title={t('core.state.empty')} hint={t('core.report.empty')} />
      )}

      <PermissionRequest />
      <Credits />
    </main>
  );
};
