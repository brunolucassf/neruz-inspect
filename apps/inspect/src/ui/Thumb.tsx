import type { ReactNode } from 'react';
import { cx } from './cx';
import './ui.css';

type ThumbProps = {
  src?: string;
  alt?: string;
  hasTransparency?: boolean;
  fallback?: ReactNode;
};

const THUMB_SIZE = 44;

export const Thumb = ({ src, alt = '', hasTransparency = false, fallback }: ThumbProps) => (
  <span className={cx('ni-pg-thumb', hasTransparency && 'ni-pg-thumb--checker')}>
    {src ? (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        width={THUMB_SIZE}
        height={THUMB_SIZE}
      />
    ) : (
      fallback
    )}
  </span>
);
