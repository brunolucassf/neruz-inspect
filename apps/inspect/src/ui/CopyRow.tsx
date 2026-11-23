import { Check, Copy } from 'lucide-react';
import type { ReactNode } from 'react';
import { useT } from '../lib/i18n';
import { cx } from './cx';
import { useCopied } from './useCopied';
import './ui.css';

type CopyRowProps = {
  label: string;
  value: string;
  copyValue?: string;
  leading?: ReactNode;
  className?: string;
};

export const CopyRow = ({ label, value, copyValue, leading, className }: CopyRowProps) => {
  const t = useT();
  const { isCopied, copy } = useCopied();

  return (
    <div className={cx('ni-copyrow', className)} data-copied={isCopied ? 'true' : undefined}>
      {leading}
      <span className="ni-copyrow__label">{label}</span>
      <code className="ni-copyrow__value" title={value}>
        {value}
      </code>
      <button
        type="button"
        className="ni-icon-button ni-copyrow__button"
        aria-label={t('core.copy.aria', { label })}
        onClick={() => void copy(copyValue ?? value, label)}
      >
        {isCopied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      </button>
    </div>
  );
};
