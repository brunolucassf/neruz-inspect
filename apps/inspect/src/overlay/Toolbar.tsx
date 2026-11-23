import { GripVertical, Search, X } from 'lucide-react';
import {
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useT } from '../lib/i18n';
import { updateSettings, useSettingsStore } from '../lib/settings';
import { GROUP_ICONS, GROUPS, TOOLS } from '../tools/registry';
import { buildSearchIndex, searchTools } from '../tools/search';
import type { ToolGroup, ToolModule } from '../tools/types';
import { useOverlayStore } from './store';
import { ToolList, toolOptionId } from './ToolList';
import { clampPosition, getMenuPlacement, type MenuPlacement, type Point } from './toolbarPosition';
import { useListNavigation } from './useListNavigation';

type ToolbarProps = {
  searchRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
};

const KEYBOARD_STEP = 10;
const KEYBOARD_STEP_LARGE = 40;
const DRAG_THRESHOLD = 3;

const readBarGeometry = (bar: HTMLElement) => {
  const rect = bar.getBoundingClientRect();
  return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
};

const getViewport = () => ({ width: window.innerWidth, height: window.innerHeight });

export const Toolbar = ({ searchRef, onClose }: ToolbarProps) => {
  const t = useT();
  const menuId = useId();
  const resultsId = useId();
  const barRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dragStart = useRef<{ offset: Point; origin: Point; moved: boolean } | null>(null);
  const latestDrag = useRef<Point | null>(null);

  const activeTool = useOverlayStore((state) => state.activeTool);
  const menuGroup = useOverlayStore((state) => state.menuGroup);
  const searchQuery = useOverlayStore((state) => state.searchQuery);
  const selectTool = useOverlayStore((state) => state.selectTool);
  const toggleMenu = useOverlayStore((state) => state.toggleMenu);
  const setSearchQuery = useOverlayStore((state) => state.setSearchQuery);
  const savedPosition = useSettingsStore((state) => state.toolbarPosition);

  const [rovingIndex, setRovingIndex] = useState(0);
  const [dragPosition, setDragPosition] = useState<Point | null>(null);
  const [placement, setPlacement] = useState<MenuPlacement>({ vertical: 'below', align: 'start' });

  const searchIndex = useMemo(() => buildSearchIndex(TOOLS, t), [t]);
  const results = useMemo(() => searchTools(searchIndex, searchQuery), [searchIndex, searchQuery]);
  const menuEntries = useMemo(
    () => searchIndex.filter((entry) => entry.tool.group === menuGroup),
    [searchIndex, menuGroup],
  );

  const choose = useCallback((tool: ToolModule) => selectTool(tool.id), [selectTool]);
  const menuNavigation = useListNavigation(menuEntries.length, (index) => {
    const entry = menuEntries[index];
    if (entry) choose(entry.tool);
  });
  const searchNavigation = useListNavigation(results.length, (index) => {
    const entry = results[index];
    if (entry) choose(entry.tool);
  });

  const shownPosition = dragPosition ?? savedPosition;
  const isSearching = searchQuery.trim().length > 0;
  const activeGroup = activeTool ? TOOLS.find((tool) => tool.id === activeTool)?.group : undefined;
  const shownX = shownPosition?.x;
  const shownY = shownPosition?.y;

  // biome-ignore lint/correctness/useExhaustiveDependencies: placement must be recomputed when the bar moves or a popup opens
  useLayoutEffect(() => {
    if (!barRef.current || (!menuGroup && !isSearching)) return;
    setPlacement(getMenuPlacement(readBarGeometry(barRef.current), getViewport()));
  }, [menuGroup, isSearching, shownX, shownY]);

  useEffect(() => {
    if (menuGroup) {
      menuNavigation.setActiveIndex(0);
      menuRef.current?.focus();
    }
  }, [menuGroup, menuNavigation.setActiveIndex]);

  const wasMenuOpen = useRef(false);
  useEffect(() => {
    if (menuGroup) {
      wasMenuOpen.current = true;
      return;
    }
    if (!wasMenuOpen.current) return;
    wasMenuOpen.current = false;
    const root = barRef.current?.getRootNode();
    const focused = root instanceof ShadowRoot ? root.activeElement : null;
    if (!focused) triggerRef.current?.focus();
  }, [menuGroup]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new query restarts the highlighted result
  useEffect(() => {
    searchNavigation.setActiveIndex(0);
  }, [searchQuery, searchNavigation.setActiveIndex]);

  useEffect(() => {
    const keepInsideViewport = (): void => {
      const bar = barRef.current;
      const current = savedPosition;
      if (!bar || !current) return;
      const { offsetWidth: width, offsetHeight: height } = bar;
      const clamped = clampPosition(current, { width, height }, getViewport());
      if (clamped.x !== current.x || clamped.y !== current.y) {
        void updateSettings({ toolbarPosition: clamped });
      }
    };
    keepInsideViewport();
    window.addEventListener('resize', keepInsideViewport);
    return () => window.removeEventListener('resize', keepInsideViewport);
  }, [savedPosition]);

  const moveTo = (point: Point): void => {
    const bar = barRef.current;
    if (!bar) return;
    const { offsetWidth: width, offsetHeight: height } = bar;
    const clamped = clampPosition(point, { width, height }, getViewport());
    latestDrag.current = clamped;
    setDragPosition(clamped);
  };

  const commitPosition = (): void => {
    const final = latestDrag.current;
    latestDrag.current = null;
    setDragPosition(null);
    if (final) void updateSettings({ toolbarPosition: final });
  };

  const handleGripPointerDown = (event: PointerEvent<HTMLButtonElement>): void => {
    if (event.button !== 0 || !barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    dragStart.current = {
      offset: { x: event.clientX - rect.left, y: event.clientY - rect.top },
      origin: { x: event.clientX, y: event.clientY },
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleGripPointerMove = (event: PointerEvent<HTMLButtonElement>): void => {
    const start = dragStart.current;
    if (!start) return;
    const travelled = Math.hypot(event.clientX - start.origin.x, event.clientY - start.origin.y);
    if (!start.moved && travelled < DRAG_THRESHOLD) return;
    start.moved = true;
    moveTo({ x: event.clientX - start.offset.x, y: event.clientY - start.offset.y });
  };

  const handleGripPointerEnd = (event: PointerEvent<HTMLButtonElement>): void => {
    if (!dragStart.current) return;
    dragStart.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    commitPosition();
  };

  const handleGripKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    const bar = barRef.current;
    if (!bar) return;
    const step = event.shiftKey ? KEYBOARD_STEP_LARGE : KEYBOARD_STEP;
    const deltas: Record<string, Point> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    };
    const delta = deltas[event.key];
    if (!delta) return;
    event.preventDefault();
    const rect = bar.getBoundingClientRect();
    moveTo({ x: rect.left + delta.x, y: rect.top + delta.y });
    commitPosition();
  };

  const handleGroupsKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button'));
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    if (current === -1) return;
    const steps: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    const step = steps[event.key];
    const target =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : step === undefined
            ? undefined
            : (current + step + buttons.length) % buttons.length;
    if (target === undefined) return;
    event.preventDefault();
    buttons[target]?.focus();
  };

  const handleGroupClick = (group: ToolGroup, trigger: HTMLButtonElement): void => {
    triggerRef.current = trigger;
    toggleMenu(group);
  };

  const positionStyle = shownPosition ? { left: shownPosition.x, top: shownPosition.y } : undefined;
  const searchActiveId =
    isSearching && results.length > 0
      ? toolOptionId(resultsId, searchNavigation.activeIndex)
      : undefined;

  return (
    <div
      ref={barRef}
      className="ni-toolbar"
      data-placed={shownPosition ? 'true' : undefined}
      data-dragging={dragPosition ? 'true' : undefined}
      style={positionStyle}
    >
      <button
        type="button"
        className="ni-toolbar__grip"
        aria-label={t('core.toolbar.drag')}
        title={t('core.toolbar.drag')}
        onPointerDown={handleGripPointerDown}
        onPointerMove={handleGripPointerMove}
        onPointerUp={handleGripPointerEnd}
        onPointerCancel={handleGripPointerEnd}
        onKeyDown={handleGripKeyDown}
      >
        <GripVertical size={16} aria-hidden="true" />
      </button>

      <div
        className="ni-toolbar__groups"
        role="toolbar"
        aria-label={t('core.toolbar.label')}
        onKeyDown={handleGroupsKeyDown}
      >
        {GROUPS.map((group, index) => {
          const Icon = GROUP_ICONS[group];
          const name = t(`core.group.${group}`);
          return (
            <button
              key={group}
              type="button"
              className="ni-toolbar__group"
              aria-label={name}
              title={name}
              tabIndex={index === rovingIndex ? 0 : -1}
              onFocus={() => setRovingIndex(index)}
              aria-haspopup="listbox"
              aria-expanded={menuGroup === group}
              aria-controls={menuGroup === group ? menuId : undefined}
              data-active={activeGroup === group ? 'true' : undefined}
              onClick={(event) => handleGroupClick(group, event.currentTarget)}
            >
              <Icon size={17} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <div className="ni-search">
        <Search size={14} aria-hidden="true" className="ni-search__icon" />
        <input
          ref={searchRef}
          type="text"
          className="ni-search__input"
          role="combobox"
          aria-label={t('core.search.label')}
          aria-autocomplete="list"
          aria-expanded={isSearching}
          aria-controls={isSearching ? resultsId : undefined}
          aria-activedescendant={searchActiveId}
          placeholder={t('core.search.placeholder')}
          autoComplete="off"
          spellCheck={false}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onKeyDown={searchNavigation.handleKeyDown}
        />
        <span className="ni-kbd" aria-hidden="true">
          /
        </span>
      </div>

      <button
        type="button"
        className="ni-icon-button"
        aria-label={t('core.toolbar.close')}
        title={t('core.toolbar.close')}
        onClick={onClose}
      >
        <X size={16} aria-hidden="true" />
      </button>

      {menuGroup ? (
        <div
          id={menuId}
          className="ni-popup"
          data-vertical={placement.vertical}
          data-align={placement.align}
        >
          {menuEntries.length > 0 ? (
            <ToolList
              listId={`${menuId}-list`}
              listRef={menuRef}
              onListKeyDown={menuNavigation.handleKeyDown}
              label={t('core.group.menuLabel', { group: t(`core.group.${menuGroup}`) })}
              entries={menuEntries}
              activeIndex={menuNavigation.activeIndex}
              onActivate={menuNavigation.setActiveIndex}
              onChoose={choose}
            />
          ) : (
            <p className="ni-popup__empty">{t('core.menu.empty')}</p>
          )}
        </div>
      ) : null}

      {isSearching ? (
        <div className="ni-popup" data-vertical={placement.vertical} data-align={placement.align}>
          {results.length > 0 ? (
            <ToolList
              listId={resultsId}
              label={t('core.search.label')}
              entries={results}
              activeIndex={searchNavigation.activeIndex}
              showGroup
              onActivate={searchNavigation.setActiveIndex}
              onChoose={choose}
            />
          ) : (
            <p className="ni-popup__empty">{t('core.search.empty')}</p>
          )}
          <p className="ni-visually-hidden" role="status">
            {t('core.search.count', { n: results.length })}
          </p>
        </div>
      ) : null}
    </div>
  );
};
