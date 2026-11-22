import type { ReactNode } from 'react';
import { cx } from './cx';
import './ui.css';

type BadgeProps = {
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
  children: ReactNode;
};

export const Badge = ({ tone = 'neutral', children }: BadgeProps) => (
  <span className={cx('ni-badge', `ni-badge--${tone}`)}>{children}</span>
);
