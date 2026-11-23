import { Check, Copy } from 'lucide-react';
import { useT } from '../lib/i18n';
import { useCopied } from './useCopied';
import './ui.css';

type IdChipProps = {
  value: string;
  label?: string;
};

export const IdChip = ({ value, label = 'ID' }: IdChipProps) => {
  const t = useT();
  const { isCopied, copy } = useCopied();
  return (
    <button
      type="button"
      className="ni-id"
      data-copied={isCopied ? 'true' : undefined}
      aria-label={t('core.copy.aria', { label: `${label} ${value}` })}
      onClick={() => void copy(value, label)}
    >
      <small>{label}</small>
      {value}
      {isCopied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
    </button>
  );
};
