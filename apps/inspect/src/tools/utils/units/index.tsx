import { Calculator, RotateCcw } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { copyText } from '../../../lib/clipboard';
import { useT } from '../../../lib/i18n';
import {
  Card,
  CopyRow,
  ListTable,
  type ListTableColumn,
  type ListTableRow,
  PanelSection,
} from '../../../ui';
import type { ToolModule } from '../../types';
import '../utils.css';
import {
  buildQuickTable,
  convertAll,
  DEFAULT_ROOT_PX,
  formatNumber,
  formatWithUnit,
  parseInputNumber,
  QUICK_TABLE_UNITS,
  UNITS,
  type Unit,
  type UnitContext,
} from './units';

const readPageRootPx = (): number => {
  const size = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(size) && size > 0 ? size : DEFAULT_ROOT_PX;
};

const useViewport = (): { width: number; height: number } => {
  const [viewport, setViewport] = useState({ width: innerWidth, height: innerHeight });
  useEffect(() => {
    const handleResize = (): void => setViewport({ width: innerWidth, height: innerHeight });
    addEventListener('resize', handleResize);
    return () => removeEventListener('resize', handleResize);
  }, []);
  return viewport;
};

type QuickKey = 'px' | (typeof QUICK_TABLE_UNITS)[number];

const QuickTable = ({ context }: { context: UnitContext }) => {
  const t = useT();
  const rows = useMemo(() => buildQuickTable(context), [context]);
  const columns: readonly ListTableColumn<QuickKey>[] = [
    { key: 'px', header: 'px', align: 'end' },
    ...QUICK_TABLE_UNITS.map((unit) => ({ key: unit, header: unit, align: 'end' as const })),
  ];

  const copyButton = (label: string, text: string): ReactNode => (
    <button type="button" className="ni-ut-table-button" onClick={() => void copyText(text, text)}>
      {label}
    </button>
  );

  const tableRows: ListTableRow<QuickKey>[] = rows.map((row) => ({
    id: String(row.px),
    cells: {
      px: copyButton(String(row.px), `${row.px}px`),
      rem: copyButton(formatNumber(row.values.rem, 3), formatWithUnit(row.values.rem, 'rem')),
      em: copyButton(formatNumber(row.values.em, 3), formatWithUnit(row.values.em, 'em')),
      pt: copyButton(formatNumber(row.values.pt, 3), formatWithUnit(row.values.pt, 'pt')),
      vw: copyButton(formatNumber(row.values.vw, 3), formatWithUnit(row.values.vw, 'vw')),
    },
  }));

  return <ListTable caption={t('utils.units.quick.caption')} columns={columns} rows={tableRows} />;
};

const UnitsPanel = () => {
  const t = useT();
  const viewport = useViewport();
  const [valueText, setValueText] = useState('16');
  const [from, setFrom] = useState<Unit>('px');
  const [rootText, setRootText] = useState(() => String(readPageRootPx()));
  const [emText, setEmText] = useState(() => String(readPageRootPx()));

  const rootPx = parseInputNumber(rootText) ?? DEFAULT_ROOT_PX;
  const emPx = parseInputNumber(emText) ?? rootPx;
  const context = useMemo<UnitContext>(
    () => ({
      rootPx,
      emPx,
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
    }),
    [rootPx, emPx, viewport.width, viewport.height],
  );

  const value = parseInputNumber(valueText);
  const converted = value === null ? null : convertAll(value, from, context);

  const resetBases = (): void => {
    const pageRoot = readPageRootPx();
    setRootText(String(pageRoot));
    setEmText(String(pageRoot));
  };

  return (
    <>
      <Card variant="padded" className="ni-ut-form">
        <div className="ni-ut-grid">
          <label className="ni-ut-label">
            {t('utils.units.value')}
            <input
              className="ni-ut-field"
              inputMode="decimal"
              value={valueText}
              onChange={(event) => setValueText(event.target.value)}
            />
          </label>
          <label className="ni-ut-label">
            {t('utils.units.from')}
            <select
              className="ni-ut-field"
              value={from}
              onChange={(event) => setFrom(event.target.value as Unit)}
            >
              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </label>
          <label className="ni-ut-label">
            {t('utils.units.rootBase')}
            <input
              className="ni-ut-field"
              inputMode="decimal"
              value={rootText}
              onChange={(event) => setRootText(event.target.value)}
            />
          </label>
          <label className="ni-ut-label">
            {t('utils.units.emBase')}
            <input
              className="ni-ut-field"
              inputMode="decimal"
              value={emText}
              onChange={(event) => setEmText(event.target.value)}
            />
          </label>
        </div>
        <div className="ni-ut-row">
          <button type="button" className="ni-button ni-button--sm" onClick={resetBases}>
            <RotateCcw size={14} aria-hidden="true" />
            {t('utils.units.usePage')}
          </button>
          <span className="ni-ut-muted">
            {t('utils.units.viewport', { w: String(viewport.width), h: String(viewport.height) })}
          </span>
        </div>
      </Card>
      <PanelSection title={t('utils.units.section.result')}>
        {converted === null ? (
          <p className="ni-ut-muted">{t('utils.units.invalid')}</p>
        ) : (
          <Card variant="rows">
            {UNITS.filter((unit) => unit !== from).map((unit) => (
              <CopyRow key={unit} label={unit} value={formatWithUnit(converted[unit], unit)} />
            ))}
          </Card>
        )}
      </PanelSection>
      <PanelSection title={t('utils.units.section.quick')}>
        <QuickTable context={context} />
      </PanelSection>
      <p className="ni-hint">{t('utils.units.note')}</p>
    </>
  );
};

const units: ToolModule = {
  id: 'units',
  group: 'utils',
  icon: Calculator,
  mode: 'panel',
  Panel: UnitsPanel,
};

export default units;
