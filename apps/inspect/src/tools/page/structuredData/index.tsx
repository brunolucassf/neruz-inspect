import { Crosshair, Database } from 'lucide-react';
import { useT } from '../../../lib/i18n';
import { Badge, EmptyState, PanelSection } from '../../../ui';
import type { ToolModule } from '../../types';
import { Alert } from '../shared/Alert';
import { ScanView } from '../shared/ScanView';
import { useElementFocus } from '../shared/useElementFocus';
import { useScan } from '../shared/useScan';
import { analyzeStructuredData, type SchemaItem } from './analyzeStructuredData';
import '../shared/page.css';

const MAX_DEPTH = 8;

const DataTree = ({ value, depth = 0 }: { value: unknown; depth?: number }) => {
  if (value === null || typeof value !== 'object') {
    return <span className="ni-pg-tree__value">{JSON.stringify(value)}</span>;
  }
  if (depth >= MAX_DEPTH) return <span className="ni-pg-muted">…</span>;
  const entries: [string, unknown][] = Array.isArray(value)
    ? value.map((entry, index) => [String(index), entry])
    : Object.entries(value);
  return (
    <ul className="ni-pg-tree">
      {entries.map(([key, entry]) => (
        <li key={key}>
          {typeof entry === 'object' && entry !== null ? (
            <details open={depth < 1}>
              <summary>
                <span className="ni-pg-tree__key">{key}</span>
              </summary>
              <DataTree value={entry} depth={depth + 1} />
            </details>
          ) : (
            <>
              <span className="ni-pg-tree__key">{key}</span>:{' '}
              <DataTree value={entry} depth={depth} />
            </>
          )}
        </li>
      ))}
    </ul>
  );
};

const ItemCard = ({ item, onFocus }: { item: SchemaItem; onFocus: (item: SchemaItem) => void }) => {
  const t = useT();
  return (
    <PanelSection
      title={item.types.join(', ') || t('page.structuredData.untyped')}
      actions={
        <span className="ni-pg-inline">
          <Badge tone="accent">{t(`page.structuredData.format.${item.format}`)}</Badge>
          {item.element ? (
            <button
              type="button"
              className="ni-icon-button"
              aria-label={t('page.common.highlight')}
              onClick={() => onFocus(item)}
            >
              <Crosshair size={14} aria-hidden="true" />
            </button>
          ) : null}
        </span>
      }
    >
      {item.missing.length > 0 ? (
        <Alert
          severity="warning"
          message={t('page.structuredData.alert.missing', { fields: item.missing.join(', ') })}
        />
      ) : null}
      <DataTree value={item.data} />
    </PanelSection>
  );
};

const StructuredDataPanel = () => {
  const t = useT();
  const { focus } = useElementFocus();
  const { state, rescan } = useScan(() => analyzeStructuredData(document));
  return (
    <ScanView state={state} onRescan={rescan}>
      {(result) =>
        result.items.length === 0 && result.invalid.length === 0 ? (
          <EmptyState
            title={t('page.structuredData.empty.title')}
            hint={t('page.structuredData.empty.hint')}
          />
        ) : (
          <>
            <PanelSection title={t('page.structuredData.section.types')}>
              <div className="ni-pg-inline">
                {result.types.length === 0 ? (
                  <span className="ni-pg-muted">{t('page.structuredData.untyped')}</span>
                ) : (
                  result.types.map((type) => (
                    <Badge key={type} tone="accent">
                      {type}
                    </Badge>
                  ))
                )}
              </div>
            </PanelSection>
            {result.invalid.length > 0 ? (
              <PanelSection title={t('page.structuredData.section.invalid')}>
                {result.invalid.map((entry) => (
                  <div key={entry.id} className="ni-pg-stack">
                    <Alert
                      severity="error"
                      message={t('page.structuredData.alert.invalidJson', {
                        message: entry.message,
                      })}
                    />
                    <pre className="ni-pg-code">{entry.snippet}</pre>
                  </div>
                ))}
              </PanelSection>
            ) : null}
            {result.items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onFocus={(target) => target.element && focus(target.element, target.types[0])}
              />
            ))}
          </>
        )
      }
    </ScanView>
  );
};

const structuredData: ToolModule = {
  id: 'structuredData',
  group: 'page',
  icon: Database,
  mode: 'panel',
  Panel: StructuredDataPanel,
};

export default structuredData;
