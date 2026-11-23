import { type CSSProperties, type KeyboardEvent, type Ref, useEffect, useRef } from 'react';
import { useT } from '../lib/i18n';
import { GROUP_ICONS } from '../tools/registry';
import type { ToolSearchEntry } from '../tools/search';
import type { ToolModule } from '../tools/types';

type ToolListProps = {
  listId: string;
  label: string;
  entries: readonly ToolSearchEntry[];
  activeIndex: number;
  showGroup?: boolean;
  listRef?: Ref<HTMLDivElement>;
  onListKeyDown?: (event: KeyboardEvent) => void;
  onActivate: (index: number) => void;
  onChoose: (tool: ToolModule) => void;
};

export const toolOptionId = (listId: string, index: number): string => `${listId}-option-${index}`;

export const ToolList = ({
  listId,
  label,
  entries,
  activeIndex,
  showGroup = false,
  listRef,
  onListKeyDown,
  onActivate,
  onChoose,
}: ToolListProps) => {
  const t = useT();
  const activeRef = useRef<HTMLButtonElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll must follow the active option
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  return (
    <div
      ref={listRef}
      className="ni-list"
      id={listId}
      role="listbox"
      aria-label={label}
      tabIndex={onListKeyDown ? -1 : undefined}
      aria-activedescendant={onListKeyDown ? toolOptionId(listId, activeIndex) : undefined}
      onKeyDown={onListKeyDown}
    >
      {entries.map(({ tool, name, description }, index) => {
        const Icon = tool.icon;
        const GroupIcon = GROUP_ICONS[tool.group];
        const isActive = index === activeIndex;
        return (
          <button
            key={tool.id}
            ref={isActive ? activeRef : undefined}
            id={toolOptionId(listId, index)}
            type="button"
            role="option"
            tabIndex={-1}
            aria-selected={isActive}
            className="ni-list__item"
            style={{ '--ni-delay': `${Math.min(index, 8) * 24}ms` } as CSSProperties}
            onPointerMove={() => onActivate(index)}
            onClick={() => onChoose(tool)}
          >
            <span className="ni-list__icon" aria-hidden="true">
              <Icon size={16} />
            </span>
            <span className="ni-list__text">
              <span className="ni-list__name">{name}</span>
              <span className="ni-list__desc">{description}</span>
            </span>
            {showGroup ? (
              <span className="ni-list__group">
                <GroupIcon size={11} aria-hidden="true" />
                {t(`core.group.${tool.group}`)}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};
