import { LayoutGrid, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { copyText } from '../../../lib/clipboard';
import { useHighlights, useViewportVersion } from '../../../lib/highlight';
import { useT } from '../../../lib/i18n';
import { getElementLabel } from '../../../lib/picker';
import { Badge, Card, CopyRow, EmptyState, FilterChips, PanelSection } from '../../../ui';
import { PanelActions } from '../../../ui/PanelSlots';
import type { ToolModule } from '../../types';
import { ElementMeta } from '../shared/ElementMeta';
import { isVisibleRect, revealElement, useElementScan } from '../shared/scan';
import '../shared/layout-tools.css';
import { buildContainerHighlights } from './containerHighlights';
import {
  type ContainerKind,
  containerKindOf,
  type PropertyEntry,
  propertiesToCss,
  readProperties,
} from './gridFlex';

type ContainerEntry = { id: number; element: Element; kind: ContainerKind; label: string };

let nextEntryId = 0;

type Filter = 'all' | ContainerKind;

const visitContainer = (element: Element): ContainerEntry | null => {
  const style = getComputedStyle(element);
  const kind = containerKindOf(style.display);
  if (!kind || style.visibility === 'hidden') return null;
  if (!isVisibleRect(element.getBoundingClientRect())) return null;
  nextEntryId += 1;
  return { id: nextEntryId, element, kind, label: getElementLabel(element) };
};

const SelectedContainer = ({ entry }: { entry: ContainerEntry }) => {
  const t = useT();
  useViewportVersion();
  useHighlights(
    entry.element.isConnected ? buildContainerHighlights(entry.element, entry.kind) : [],
  );

  if (!entry.element.isConnected) {
    return <p className="ni-hint">{t('layout.gridFlex.gone')}</p>;
  }

  const style = getComputedStyle(entry.element);
  const properties: PropertyEntry[] = readProperties(entry.kind, (name) =>
    style.getPropertyValue(name),
  );

  return (
    <>
      <ElementMeta element={entry.element} isLocked={false} />
      <PanelSection title={t('layout.gridFlex.section.props')} count={properties.length}>
        <Card variant="rows">
          {properties.map((property) => (
            <CopyRow
              key={property.name}
              label={property.name}
              value={property.value}
              copyValue={`${property.name}: ${property.value};`}
            />
          ))}
        </Card>
      </PanelSection>
      <div className="ni-actions">
        <button
          type="button"
          className="ni-button ni-button--primary"
          onClick={() => void copyText(propertiesToCss(properties), entry.label)}
        >
          {t('layout.gridFlex.copy.all')}
        </button>
      </div>
    </>
  );
};

const GridFlexPanel = () => {
  const t = useT();
  const { state, rescan } = useElementScan(visitContainer);
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<ContainerEntry | null>(null);

  if (state.status === 'loading') {
    return <EmptyState kind="loading" title={t('layout.gridFlex.loading.title')} />;
  }

  if (state.items.length === 0) {
    return (
      <EmptyState
        title={t('layout.gridFlex.empty.title')}
        hint={t('layout.gridFlex.empty.hint')}
        action={
          <button type="button" className="ni-button ni-button--primary" onClick={rescan}>
            {t('layout.gridFlex.rescan')}
          </button>
        }
      />
    );
  }

  const visible = state.items.filter((entry) => filter === 'all' || entry.kind === filter);

  const countOf = (kind: ContainerKind): number =>
    state.items.filter((entry) => entry.kind === kind).length;

  return (
    <>
      <PanelActions>
        <button
          type="button"
          className="ni-icon-button"
          aria-label={t('layout.gridFlex.rescan')}
          onClick={rescan}
        >
          <RefreshCw size={14} aria-hidden="true" />
        </button>
      </PanelActions>
      <PanelSection title={t('layout.gridFlex.section.list')} count={visible.length}>
        <FilterChips
          label={t('layout.gridFlex.filter.label')}
          value={filter}
          onChange={setFilter}
          items={[
            { id: 'all', label: t('layout.gridFlex.filter.all'), count: state.items.length },
            { id: 'grid', label: 'Grid', count: countOf('grid') },
            { id: 'flex', label: 'Flex', count: countOf('flex') },
          ]}
        />
        <Card variant="rows" className="ni-lt-list">
          {visible.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className="ni-lt-item"
              aria-pressed={selected?.element === entry.element}
              onClick={() => {
                setSelected(entry);
                revealElement(entry.element);
              }}
            >
              <span className="ni-lt-item__main">{entry.label}</span>
              <Badge tone={entry.kind === 'grid' ? 'accent' : 'neutral'}>{entry.kind}</Badge>
            </button>
          ))}
        </Card>
        {state.truncated ? (
          <p className="ni-lt-warning">{t('layout.gridFlex.truncated', { n: 5000 })}</p>
        ) : null}
      </PanelSection>
      {selected ? (
        <SelectedContainer entry={selected} />
      ) : (
        <p className="ni-hint">{t('layout.gridFlex.select.hint')}</p>
      )}
    </>
  );
};

const gridFlex: ToolModule = {
  id: 'gridFlex',
  group: 'layout',
  icon: LayoutGrid,
  mode: 'panel',
  Panel: GridFlexPanel,
};

export default gridFlex;
