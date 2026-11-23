import type { CSSProperties } from 'react';
import './ui.css';

type RatioProps = {
  shown: number;
  actual: number;
  label: string;
};

const MIN_FILL_PERCENT = 4;

export const Ratio = ({ shown, actual, label }: RatioProps) => {
  const share = actual > 0 ? (shown / actual) * 100 : 100;
  const fill = Math.max(MIN_FILL_PERCENT, Math.min(100, share));
  const style = { '--ni-ratio': `${fill}%` } as CSSProperties;
  return (
    <div className="ni-ratio">
      <span className="ni-ratio__bar" aria-hidden="true" style={style}>
        <i />
      </span>
      <span>{label}</span>
    </div>
  );
};
