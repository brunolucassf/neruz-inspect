import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import { downloadText } from '../lib/download';
import { useLocale, useT } from '../lib/i18n';
import { STORAGE_KEYS } from '../lib/storage-keys';
import { Credits } from '../overlay/Credits';
import { isReportData, type ReportData } from '../tools/page/report/reportTypes';
import { EmptyState } from '../ui';
import { ReportDocument } from './ReportDocument';
import './report.css';

const HOST_PERMISSIONS = { origins: ['http://*/*', 'https://*/*'] };

type LoadState = { status: 'loading' } | { status: 'ready'; report: ReportData | null };

const useStoredReport = (): LoadState => {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  useEffect(() => {
    void browser.storage.session.get(STORAGE_KEYS.report).then((stored) => {
      const value: unknown = stored[STORAGE_KEYS.report];
      const data =
        typeof value === 'object' && value !== null ? (value as { data?: unknown }).data : null;
      setState({ status: 'ready', report: isReportData(data) ? data : null });
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

const safeFileName = (host: string): string =>
  `neruz-inspect-${host.replace(/[^a-z0-9.-]+/gi, '-') || 'report'}`;

export const ReportApp = () => {
  const t = useT();
  const locale = useLocale();
  const load = useStoredReport();
  const report = load.status === 'ready' ? load.report : null;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = report
      ? `${t('page.report.doc.pageLabel', { host: report.host })} · Neruz Inspect`
      : `${t('core.report.title')} · Neruz Inspect`;
  }, [locale, t, report]);

  if (load.status === 'loading') {
    return (
      <main className="ni-report">
        <EmptyState kind="loading" title={t('core.state.loading')} />
      </main>
    );
  }

  if (!report) {
    return (
      <main className="ni-report">
        <EmptyState title={t('core.state.empty')} hint={t('core.report.empty')} />
        <Credits />
      </main>
    );
  }

  return (
    <main className="ni-report">
      <div className="ni-report__toolbar">
        <div>
          <p className="ni-report__toolbar-title">{t('core.report.title')}</p>
          <p>{t('page.report.printHint')}</p>
        </div>
        <div className="ni-report__actions">
          <button
            type="button"
            className="ni-button ni-button--primary"
            onClick={() => window.print()}
          >
            {t('page.report.print')}
          </button>
          <button
            type="button"
            className="ni-button"
            onClick={() =>
              downloadText(
                JSON.stringify(report, null, 2),
                `${safeFileName(report.host)}.json`,
                'application/json',
              )
            }
          >
            {t('page.report.doc.downloadJson')}
          </button>
        </div>
      </div>

      <ReportDocument data={report} />
      <PermissionRequest />
    </main>
  );
};
