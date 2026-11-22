import type { KeyboardEvent, ReactNode } from 'react';
import { useId, useRef } from 'react';
import './ui.css';

export type TabItem<TId extends string> = { id: TId; label: string };

type TabsProps<TId extends string> = {
  label: string;
  items: readonly TabItem<TId>[];
  value: TId;
  onChange: (id: TId) => void;
  children: ReactNode;
};

export const Tabs = <TId extends string>({
  label,
  items,
  value,
  onChange,
  children,
}: TabsProps<TId>) => {
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);

  const moveTo = (index: number): void => {
    const wrapped = (index + items.length) % items.length;
    const next = items[wrapped];
    if (!next) return;
    onChange(next.id);
    listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]')[wrapped]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    const current = items.findIndex((item) => item.id === value);
    if (event.key === 'ArrowRight') moveTo(current + 1);
    else if (event.key === 'ArrowLeft') moveTo(current - 1);
    else if (event.key === 'Home') moveTo(0);
    else if (event.key === 'End') moveTo(items.length - 1);
    else return;
    event.preventDefault();
  };

  return (
    <div className="ni-tabs">
      <div
        className="ni-tabs__list"
        role="tablist"
        aria-label={label}
        ref={listRef}
        onKeyDown={handleKeyDown}
      >
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`${baseId}-tab-${item.id}`}
            aria-selected={item.id === value}
            aria-controls={`${baseId}-panel`}
            tabIndex={item.id === value ? 0 : -1}
            className="ni-tabs__tab"
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        className="ni-tabs__panel"
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${value}`}
      >
        {children}
      </div>
    </div>
  );
};
