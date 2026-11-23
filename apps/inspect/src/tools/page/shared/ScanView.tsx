import { RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { useT } from '../../../lib/i18n';
import { EmptyState } from '../../../ui';
import { PanelActions } from '../../../ui/PanelSlots';
import type { ScanState } from './useScan';
import './page.css';

type ScanViewProps<TData> = {
  state: ScanState<TData>;
  onRescan: () => void;
  note?: string;
  loadingLabel?: string;
  children: (data: TData) => ReactNode;
};

const RescanButton = ({ onRescan }: { onRescan: () => void }) => {
  const t = useT();
  return (
    <button type="button" className="ni-button ni-button--sm" onClick={onRescan}>
      <RefreshCw size={12} aria-hidden="true" />
      {t('page.common.rescan')}
    </button>
  );
};

export const ScanView = <TData,>({
  state,
  onRescan,
  note,
  loadingLabel,
  children,
}: ScanViewProps<TData>) => {
  const t = useT();
  if (state.status === 'loading') {
    return <EmptyState kind="loading" title={loadingLabel ?? t('page.common.scanning')} />;
  }
  if (state.status === 'error') {
    return (
      <EmptyState
        kind="error"
        title={t('page.common.error')}
        hint={state.message}
        action={<RescanButton onRescan={onRescan} />}
      />
    );
  }
  return (
    <>
      <PanelActions>
        <button
          type="button"
          className="ni-icon-button"
          aria-label={t('page.common.rescan')}
          title={t('page.common.rescan')}
          onClick={onRescan}
        >
          <RefreshCw size={16} aria-hidden="true" />
        </button>
      </PanelActions>
      {children(state.data)}
      {note ? <p className="ni-hint">{note}</p> : null}
    </>
  );
};
