import type { ReactNode } from 'react';
import './page.css';

export const ChipGroup = ({ label, children }: { label: string; children: ReactNode }) => (
  <fieldset className="ni-pg-chips">
    <legend className="ni-visually-hidden">{label}</legend>
    {children}
  </fieldset>
);
