import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';
import './ui.css';

type EmptyStateProps = {
  kind?: 'empty' | 'loading' | 'error';
  title: string;
  hint?: string;
  action?: ReactNode;
  icon?: ReactNode;
};

export const EmptyState = ({ kind = 'empty', title, hint, action, icon }: EmptyStateProps) => {
  if (kind === 'loading') return <LoadingState title={title} />;
  if (kind === 'error') return <ErrorState title={title} hint={hint} action={action} />;
  return (
    <div className="ni-empty" role="status">
      <span className="ni-empty__icon" aria-hidden="true">
        {icon ?? <Inbox />}
      </span>
      <p className="ni-empty__title">{title}</p>
      {hint ? <p className="ni-empty__hint">{hint}</p> : null}
      {action ? <div className="ni-empty__action">{action}</div> : null}
    </div>
  );
};
