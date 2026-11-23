import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import './ui.css';

type ErrorStateProps = {
  title: string;
  hint?: string;
  action?: ReactNode;
};

export const ErrorState = ({ title, hint, action }: ErrorStateProps) => (
  <div className="ni-error" role="alert">
    <CircleAlert className="ni-error__icon" size={20} aria-hidden="true" />
    <p className="ni-error__title">{title}</p>
    {hint ? <p className="ni-error__hint">{hint}</p> : null}
    {action ? <div className="ni-error__action">{action}</div> : null}
  </div>
);
