import { CircleDashed, TriangleAlert } from 'lucide-react';
import { cx } from './cx';
import './ui.css';

export type StatusKind = 'active' | 'notLoaded' | 'missing';

type StatusPillProps = {
  status: StatusKind;
  label: string;
  className?: string;
};

const StatusIcon = ({ status }: { status: StatusKind }) => {
  if (status === 'active') return <span className="ni-dot ni-dot--pulse" aria-hidden="true" />;
  if (status === 'notLoaded') return <TriangleAlert aria-hidden="true" />;
  return <CircleDashed aria-hidden="true" strokeDasharray="3 3" />;
};

export const StatusPill = ({ status, label, className }: StatusPillProps) => (
  <span className={cx('ni-status', `ni-status--${status}`, className)}>
    <StatusIcon status={status} />
    {label}
  </span>
);
