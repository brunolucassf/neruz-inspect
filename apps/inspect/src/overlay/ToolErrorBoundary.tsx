import { Component, type ReactNode } from 'react';
import { useT } from '../lib/i18n';
import { EmptyState } from '../ui';

type ToolErrorBoundaryProps = { children: ReactNode };
type ToolErrorBoundaryState = { hasFailed: boolean };

const ToolFailure = ({ onRetry }: { onRetry: () => void }) => {
  const t = useT();
  return (
    <EmptyState
      kind="error"
      title={t('core.error.tool.title')}
      hint={t('core.error.tool.hint')}
      action={
        <button type="button" className="ni-button" onClick={onRetry}>
          {t('core.error.retry')}
        </button>
      }
    />
  );
};

export class ToolErrorBoundary extends Component<ToolErrorBoundaryProps, ToolErrorBoundaryState> {
  override state: ToolErrorBoundaryState = { hasFailed: false };

  static getDerivedStateFromError(): ToolErrorBoundaryState {
    return { hasFailed: true };
  }

  override render() {
    if (this.state.hasFailed) {
      return <ToolFailure onRetry={() => this.setState({ hasFailed: false })} />;
    }
    return this.props.children;
  }
}
