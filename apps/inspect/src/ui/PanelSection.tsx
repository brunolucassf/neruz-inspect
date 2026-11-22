import type { ReactNode } from 'react';
import { useId } from 'react';
import './ui.css';

type PanelSectionProps = {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
};

export const PanelSection = ({ title, actions, children }: PanelSectionProps) => {
  const headingId = useId();
  return (
    <section className="ni-section" aria-labelledby={headingId}>
      <header className="ni-section__header">
        <h3 className="ni-section__title" id={headingId}>
          {title}
        </h3>
        {actions ? <div className="ni-section__actions">{actions}</div> : null}
      </header>
      <div className="ni-section__body">{children}</div>
    </section>
  );
};
