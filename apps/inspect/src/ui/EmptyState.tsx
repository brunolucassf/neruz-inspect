import type { ReactNode } from 'react';
import { cx } from './cx';
import './ui.css';

type EmptyStateProps = {
  kind?: 'empty' | 'loading' | 'error';
  title: string;
  hint?: string;
  action?: ReactNode;
};

export const EmptyState = ({ kind = 'empty', title, hint, action }: EmptyStateProps) => (
  <div
    className={cx('ni-empty', `ni-empty--${kind}`)}
    role={kind === 'error' ? 'alert' : 'status'}
    aria-busy={kind === 'loading' ? true : undefined}
  >
    {kind === 'loading' ? <span className="ni-spinner" aria-hidden="true" /> : null}
    <p className="ni-empty__title">{title}</p>
    {hint ? <p className="ni-empty__hint">{hint}</p> : null}
    {action}
  </div>
);
