import { RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { useT } from '../../../lib/i18n';
import { EmptyState } from '../../../ui';
import type { ScanState } from './useScan';
import './page.css';

type ScanViewProps<TData> = {
  state: ScanState<TData>;
  onRescan: () => void;
  note?: string;
  loadingLabel?: string;
  children: (data: TData) => ReactNode;
};

export const RescanButton = ({ onRescan }: { onRescan: () => void }) => {
  const t = useT();
  return (
    <button type="button" className="ni-button ni-pg-rescan" onClick={onRescan}>
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
      <div className="ni-pg-toolbar">
        <RescanButton onRescan={onRescan} />
      </div>
      {children(state.data)}
      {note ? <p className="ni-hint">{note}</p> : null}
    </>
  );
};
