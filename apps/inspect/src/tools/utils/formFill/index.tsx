import { Eraser, RefreshCw, TextCursorInput } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useT } from '../../../lib/i18n';
import { toast } from '../../../lib/toast';
import { Badge, Card, CopyRow, PanelSection } from '../../../ui';
import type { ToolModule } from '../../types';
import '../utils.css';
import { type FakePerson, generatePerson } from './fakeData';
import { clearFilled, type FillReport, fillForms, unmarkFilled } from './fill';

const TEST_KINDS = new Set(['cpf', 'cnpj']);

const PersonRows = ({ person }: { person: FakePerson }) => {
  const t = useT();
  const rows: readonly (readonly [string, string])[] = [
    ['name', person.fullName],
    ['email', person.email],
    ['phone', person.phone],
    ['cpf', person.cpf],
    ['cnpj', person.cnpj],
    ['company', person.company],
    ['birth', person.birthDate],
    ['cep', person.cep],
    ['street', `${person.street}, ${person.number}`],
    ['city', `${person.city} - ${person.state}`],
  ];
  return (
    <>
      {rows.map(([key, value]) => (
        <CopyRow
          key={key}
          label={t(`utils.formFill.person.${key}`)}
          value={value}
          leading={
            TEST_KINDS.has(key) ? <Badge tone="warning">{t('utils.formFill.test')}</Badge> : null
          }
        />
      ))}
    </>
  );
};

const FormFillPanel = () => {
  const t = useT();
  const [person, setPerson] = useState(() => generatePerson(Math.random));
  const [includePasswords, setIncludePasswords] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const [report, setReport] = useState<FillReport | null>(null);
  const reportRef = useRef<FillReport | null>(null);
  reportRef.current = report;

  useEffect(
    () => () => {
      if (reportRef.current) unmarkFilled(reportRef.current.filled);
    },
    [],
  );

  const runFill = (nextPerson: FakePerson): void => {
    if (report) clearFilled(report.filled);
    const result = fillForms(nextPerson, { includePasswords, overwrite }, Math.random);
    setReport(result);
    toast(
      t(result.filled.length > 0 ? 'utils.formFill.done' : 'utils.formFill.nothing', {
        n: result.filled.length,
      }),
      result.filled.length > 0 ? 'success' : 'info',
    );
  };

  const handleRegenerate = (): void => {
    const next = generatePerson(Math.random);
    setPerson(next);
    if (report) runFill(next);
  };

  const handleClear = (): void => {
    if (!report) return;
    const restored = clearFilled(report.filled);
    setReport(null);
    toast(t('utils.formFill.cleared', { n: restored }), 'success');
  };

  return (
    <>
      <Card variant="padded" className="ni-ut-form">
        <label className="ni-ut-check">
          <input
            type="checkbox"
            checked={includePasswords}
            onChange={(event) => setIncludePasswords(event.target.checked)}
          />
          {t('utils.formFill.passwords')}
        </label>
        <label className="ni-ut-check">
          <input
            type="checkbox"
            checked={overwrite}
            onChange={(event) => setOverwrite(event.target.checked)}
          />
          {t('utils.formFill.overwrite')}
        </label>
      </Card>
      {report && report.filled.length > 0 ? (
        <PanelSection title={t('utils.formFill.section.filled')} count={report.filled.length}>
          <Card variant="rows">
            <ul className="ni-ut-result">
              {report.filled.map((item) => (
                <li key={item.id}>
                  <span className="ni-ut-result__kind">
                    {t(`utils.formFill.kind.${item.kind}`)}
                  </span>
                  <span className="ni-ut-result__value" title={item.value}>
                    {item.kind === 'password' ? '••••••••' : item.value}
                  </span>
                  {TEST_KINDS.has(item.kind) ? (
                    <Badge tone="warning">{t('utils.formFill.test')}</Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>
        </PanelSection>
      ) : null}
      <PanelSection title={t('utils.formFill.section.data')}>
        <Card variant="rows">
          <PersonRows person={person} />
        </Card>
      </PanelSection>
      {report ? (
        <p className="ni-ut-muted" role="status">
          {t('utils.formFill.summary', {
            filled: report.filled.length,
            skipped: report.skipped,
          })}
          {report.passwordsSkipped > 0
            ? ` ${t('utils.formFill.passwordsSkipped', { n: report.passwordsSkipped })}`
            : ''}
        </p>
      ) : (
        <p className="ni-ut-muted">{t('utils.formFill.hint')}</p>
      )}
      <div className="ni-actions">
        <button
          type="button"
          className="ni-button ni-button--primary"
          onClick={() => runFill(person)}
        >
          <TextCursorInput size={14} aria-hidden="true" />
          {t('utils.formFill.fill')}
        </button>
        <button type="button" className="ni-button" onClick={handleRegenerate}>
          <RefreshCw size={14} aria-hidden="true" />
          {t('utils.formFill.regenerate')}
        </button>
        <button
          type="button"
          className="ni-button ni-ut-button"
          disabled={!report || report.filled.length === 0}
          onClick={handleClear}
        >
          <Eraser size={14} aria-hidden="true" />
          {t('utils.formFill.clear')}
        </button>
      </div>
      <p className="ni-hint">{t('utils.formFill.note')}</p>
    </>
  );
};

const formFill: ToolModule = {
  id: 'formFill',
  group: 'utils',
  icon: TextCursorInput,
  mode: 'action',
  Panel: FormFillPanel,
};

export default formFill;
