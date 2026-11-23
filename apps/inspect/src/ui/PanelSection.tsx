import type { ReactNode } from 'react';
import { useId } from 'react';
import './ui.css';

type PanelSectionProps = {
  title: string;
  count?: number;
  actions?: ReactNode;
  children: ReactNode;
};

export const PanelSection = ({ title, count, actions, children }: PanelSectionProps) => {
  const headingId = useId();
  return (
    <section className="ni-section" aria-labelledby={headingId}>
      <header className="ni-section__header">
        <h3 className="ni-section__title" id={headingId}>
          {title}
          {count === undefined ? null : <em className="ni-section__count"> · {count}</em>}
        </h3>
        {actions ? <div className="ni-section__actions">{actions}</div> : null}
      </header>
      <div className="ni-section__body">{children}</div>
    </section>
  );
};
