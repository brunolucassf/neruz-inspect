import { cx } from './cx';
import './ui.css';

export type FilterChipItem<TId extends string> = {
  id: TId;
  label: string;
  count?: number;
  isWarning?: boolean;
};

type FilterChipsProps<TId extends string> = {
  label: string;
  items: readonly FilterChipItem<TId>[];
  value: TId;
  onChange: (id: TId) => void;
};

export const FilterChips = <TId extends string>({
  label,
  items,
  value,
  onChange,
}: FilterChipsProps<TId>) => (
  <div className="ni-filter" role="group" aria-label={label}>
    {items.map((item) => (
      <button
        key={item.id}
        type="button"
        className={cx('ni-filter__chip', item.isWarning && 'ni-filter__chip--warn')}
        aria-pressed={item.id === value}
        onClick={() => onChange(item.id)}
      >
        {item.label}
        {item.count === undefined ? null : <span>{item.count}</span>}
      </button>
    ))}
  </div>
);
