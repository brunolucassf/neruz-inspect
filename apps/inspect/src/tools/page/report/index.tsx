import { FileText } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { openReport } from '../../../lib/bridge';
import { useT } from '../../../lib/i18n';
import { toast } from '../../../lib/toast';
import { Badge } from '../../../ui';
import type { ToolModule } from '../../types';
import { type CollectStep, collectReport } from './collect';
import { DEFAULT_PREPARED_BY, loadPrefs, savePrefs } from './prefs';
import {
  DEFAULT_SECTIONS,
  REPORT_SECTIONS,
  type ReportSectionId,
  SLOW_SECTIONS,
} from './reportTypes';
import '../shared/page.css';
import './report-panel.css';

type RunState =
  | { status: 'idle' }
  | { status: 'running'; step: CollectStep; ratio: number }
  | { status: 'error' };

const ReportPanel = () => {
  const t = useT();
  const [selected, setSelected] = useState<ReadonlySet<ReportSectionId>>(
    () => new Set(DEFAULT_SECTIONS),
  );
  const [preparedFor, setPreparedFor] = useState('');
  const [preparedBy, setPreparedBy] = useState(DEFAULT_PREPARED_BY);
  const [includeThumbnail, setIncludeThumbnail] = useState(true);
  const [run, setRun] = useState<RunState>({ status: 'idle' });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    void loadPrefs().then((prefs) => {
      if (mounted.current) setPreparedBy(prefs.preparedBy);
    });
    return () => {
      mounted.current = false;
    };
  }, []);

  const toggle = (section: ReportSectionId): void => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const analysisCount = [...selected].filter((section) => section !== 'summary').length;
  const running = run.status === 'running';

  const generate = async (): Promise<void> => {
    if (analysisCount === 0 || running) return;
    setRun({ status: 'running', step: 'thumbnail', ratio: 0 });
    const effectivePreparedBy = preparedBy.trim() || DEFAULT_PREPARED_BY;
    try {
      await savePrefs({ preparedBy: effectivePreparedBy });
      const data = await collectReport({
        sections: REPORT_SECTIONS.filter((section) => selected.has(section)),
        preparedFor,
        preparedBy: effectivePreparedBy,
        includeThumbnail,
        onProgress: (step, done, total) => {
          if (mounted.current) setRun({ status: 'running', step, ratio: done / total });
        },
      });
      await openReport(data);
      if (!mounted.current) return;
      setRun({ status: 'idle' });
      toast(t('page.report.done'), 'success');
      const failedCount = Object.values(data).filter(
        (value) =>
          typeof value === 'object' &&
          value !== null &&
          (value as { status?: unknown }).status === 'failed',
      ).length;
      if (failedCount > 0) toast(t('page.report.partialFailed', { n: failedCount }), 'info');
    } catch {
      if (mounted.current) setRun({ status: 'error' });
    }
  };

  const stepLabel = (step: CollectStep): string =>
    step === 'thumbnail' ? t('page.report.thumbnail') : t(`page.report.section.${step}`);

  return (
    <div className="ni-rp">
      <p className="ni-hint">{t('page.report.panel.hint')}</p>

      <fieldset className="ni-rp__group" disabled={running}>
        <legend className="ni-rp__legend">{t('page.report.sections')}</legend>
        {REPORT_SECTIONS.map((section) => (
          <label key={section} className="ni-rp__check">
            <input
              type="checkbox"
              checked={selected.has(section)}
              onChange={() => toggle(section)}
            />
            <span>{t(`page.report.section.${section}`)}</span>
            {SLOW_SECTIONS.includes(section) ? (
              <Badge tone="warning">{t('page.report.slow')}</Badge>
            ) : null}
          </label>
        ))}
        <label className="ni-rp__check">
          <input
            type="checkbox"
            checked={includeThumbnail}
            onChange={(event) => setIncludeThumbnail(event.target.checked)}
          />
          <span>{t('page.report.thumbnail')}</span>
        </label>
      </fieldset>

      <label className="ni-rp__field">
        <span className="ni-rp__label">{t('page.report.forLabel')}</span>
        <input
          className="ni-rp__input"
          type="text"
          maxLength={120}
          value={preparedFor}
          placeholder={t('page.report.forHint')}
          disabled={running}
          onChange={(event) => setPreparedFor(event.target.value)}
        />
      </label>
      <label className="ni-rp__field">
        <span className="ni-rp__label">{t('page.report.byLabel')}</span>
        <input
          className="ni-rp__input"
          type="text"
          maxLength={120}
          value={preparedBy}
          disabled={running}
          onChange={(event) => setPreparedBy(event.target.value)}
        />
      </label>

      <button
        type="button"
        className="ni-button ni-button--primary ni-rp__generate"
        disabled={running || analysisCount === 0}
        onClick={() => void generate()}
      >
        {running ? t('page.report.generating') : t('page.report.generate')}
      </button>

      {analysisCount === 0 ? <p className="ni-pg-muted">{t('page.report.noneSelected')}</p> : null}

      {run.status === 'running' ? (
        <div className="ni-rp__progress" role="status" aria-live="polite">
          <div
            className="ni-pg-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(run.ratio * 100)}
          >
            <div className="ni-pg-progress__bar" style={{ width: `${run.ratio * 100}%` }} />
          </div>
          <span className="ni-pg-muted">
            {t('page.report.progressStep', { step: stepLabel(run.step) })}
          </span>
        </div>
      ) : null}

      {run.status === 'error' ? (
        <p className="ni-rp__error" role="alert">
          {t('page.report.error')}
        </p>
      ) : null}

      <p className="ni-pg-muted">{t('page.report.printHint')}</p>
    </div>
  );
};

const report: ToolModule = {
  id: 'report',
  group: 'page',
  icon: FileText,
  mode: 'panel',
  Panel: ReportPanel,
};

export default report;
