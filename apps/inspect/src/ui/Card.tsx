import type { ReactNode } from 'react';
import { cx } from './cx';
import './ui.css';

type CardProps = {
  variant?: 'plain' | 'rows' | 'padded';
  className?: string;
  children: ReactNode;
};

export const Card = ({ variant = 'plain', className, children }: CardProps) => (
  <div className={cx('ni-card', variant !== 'plain' && `ni-card--${variant}`, className)}>
    {children}
  </div>
);
