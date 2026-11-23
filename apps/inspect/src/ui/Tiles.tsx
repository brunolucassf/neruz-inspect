import type { CSSProperties, ReactNode } from 'react';
import { cx } from './cx';
import './ui.css';

type TilesProps = {
  columns?: 2 | 3;
  className?: string;
  children: ReactNode;
};

type TileProps = {
  label: string;
  value: ReactNode;
  unit?: string;
  icon?: ReactNode;
  tone?: 'success' | 'warning' | 'danger';
};

export const Tiles = ({ columns = 2, className, children }: TilesProps) => (
  <div className={cx('ni-tiles', className)} style={{ '--cols': columns } as CSSProperties}>
    {children}
  </div>
);

export const Tile = ({ label, value, unit, icon, tone }: TileProps) => (
  <div className={cx('ni-tile', tone && `ni-tile--${tone}`)}>
    <div className="ni-tile__label">
      {icon}
      {label}
    </div>
    <div className="ni-tile__value">
      {value}
      {unit ? <small>{unit}</small> : null}
    </div>
  </div>
);
