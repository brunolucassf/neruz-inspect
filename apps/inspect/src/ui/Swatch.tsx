import type { CSSProperties } from 'react';
import { cx } from './cx';
import './ui.css';

type SwatchProps = {
  color: string;
  size?: number;
  label?: string;
  className?: string;
};

export const Swatch = ({ color, size = 20, label, className }: SwatchProps) => {
  const style: CSSProperties = { width: size, height: size };
  const fill = <span className="ni-swatch__fill" style={{ background: color }} />;
  if (label) {
    return (
      <span className={cx('ni-swatch', className)} style={style} role="img" aria-label={label}>
        {fill}
      </span>
    );
  }
  return (
    <span className={cx('ni-swatch', className)} style={style} aria-hidden="true">
      {fill}
    </span>
  );
};
