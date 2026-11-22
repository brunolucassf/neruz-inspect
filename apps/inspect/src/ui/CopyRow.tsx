import { Check, Copy } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { copyText } from '../lib/clipboard';
import { useT } from '../lib/i18n';
import { cx } from './cx';
import './ui.css';

type CopyRowProps = {
  label: string;
  value: string;
  copyValue?: string;
  leading?: ReactNode;
  className?: string;
};

const CONFIRM_MS = 1200;

export const CopyRow = ({ label, value, copyValue, leading, className }: CopyRowProps) => {
  const t = useT();
  const [isCopied, setIsCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleCopy = async (): Promise<void> => {
    const copied = await copyText(copyValue ?? value, label);
    if (!copied) return;
    setIsCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setIsCopied(false), CONFIRM_MS);
  };

  return (
    <div className={cx('ni-copyrow', className)}>
      {leading}
      <span className="ni-copyrow__label">{label}</span>
      <code className="ni-copyrow__value" title={value}>
        {value}
      </code>
      <button
        type="button"
        className="ni-icon-button ni-copyrow__button"
        aria-label={t('core.copy.aria', { label })}
        onClick={() => void handleCopy()}
      >
        {isCopied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      </button>
    </div>
  );
};
