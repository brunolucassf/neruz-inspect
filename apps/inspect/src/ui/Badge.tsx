import { Check, CircleAlert, Info, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from './cx';
import './ui.css';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

type BadgeProps = {
  tone?: BadgeTone;
  icon?: ReactNode | false;
  children: ReactNode;
};

const TONE_ICONS: Partial<Record<BadgeTone, ReactNode>> = {
  success: <Check aria-hidden="true" />,
  warning: <TriangleAlert aria-hidden="true" />,
  danger: <CircleAlert aria-hidden="true" />,
  info: <Info aria-hidden="true" />,
};

export const Badge = ({ tone = 'neutral', icon, children }: BadgeProps) => (
  <span className={cx('ni-badge', `ni-badge--${tone}`)}>
    {icon === false ? null : (icon ?? TONE_ICONS[tone])}
    {children}
  </span>
);
