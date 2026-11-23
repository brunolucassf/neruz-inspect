import type { ReactNode } from 'react';
import { cx } from './cx';
import './ui.css';

type CodeChipProps = {
  accent?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export const CodeChip = ({ accent, className, children }: CodeChipProps) => (
  <code className={cx('ni-code-chip', className)}>
    {accent ? <b>{accent}</b> : null}
    {children}
  </code>
);
