import { ArrowLeft, PanelLeft, PanelRight, X } from 'lucide-react';
import { type PointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../lib/i18n';
import { updateSettings, useSettingsStore } from '../lib/settings';
import type { ToolModule } from '../tools/types';
import { PanelSlotsContext } from '../ui/PanelSlots';
import { Credits } from './Credits';
import { useOverlayStore } from './store';
import { ToolErrorBoundary } from './ToolErrorBoundary';
import { NARROW_QUERY, useMediaQuery } from './useMediaQuery';

type PanelProps = { tool: ToolModule };

type SheetSize = 'peek' | 'open';

const SHEET_DRAG_THRESHOLD = 24;

export const Panel = ({ tool }: PanelProps) => {
  const t = useT();
  const dock = useSettingsStore((state) => state.dock);
  const clearTool = useOverlayStore((state) => state.clearTool);
  const isNarrow = useMediaQuery(NARROW_QUERY);
  const panelRef = useRef<HTMLElement>(null);
  const sheetDragStart = useRef<number | null>(null);
  const wasSheetDragged = useRef(false);
  const [metaSlot, setMetaSlot] = useState<HTMLDivElement | null>(null);
  const [actionsSlot, setActionsSlot] = useState<HTMLDivElement | null>(null);
  const [sheetSize, setSheetSize] = useState<SheetSize>('open');
  const slots = useMemo(() => ({ meta: metaSlot, actions: actionsSlot }), [metaSlot, actionsSlot]);

  const toolKey = `${tool.group}.${tool.id}`;
  const ToolPanel = tool.Panel;
  const nextDock = dock === 'right' ? 'left' : 'right';
  const DockIcon = nextDock === 'left' ? PanelLeft : PanelRight;
  const dockLabel = t(nextDock === 'left' ? 'core.panel.dockLeft' : 'core.panel.dockRight');
  const sheetLabel = t(sheetSize === 'open' ? 'core.panel.collapse' : 'core.panel.expand');

  // biome-ignore lint/correctness/useExhaustiveDependencies: focus moves into the panel only when another tool opens
  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
  }, [tool.id]);

  const handleGrabberClick = (): void => {
    if (wasSheetDragged.current) {
      wasSheetDragged.current = false;
      return;
    }
    setSheetSize((size) => (size === 'open' ? 'peek' : 'open'));
  };

  const handleGrabberPointerDown = (event: PointerEvent<HTMLButtonElement>): void => {
    sheetDragStart.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleGrabberPointerUp = (event: PointerEvent<HTMLButtonElement>): void => {
    const start = sheetDragStart.current;
    sheetDragStart.current = null;
    if (start === null) return;
    const travelled = event.clientY - start;
    wasSheetDragged.current = Math.abs(travelled) > SHEET_DRAG_THRESHOLD;
    if (!wasSheetDragged.current) return;
    setSheetSize(travelled < 0 ? 'open' : 'peek');
  };

  return (
    <aside
      ref={panelRef}
      className={isNarrow ? 'ni-panel ni-shell ni-sheet' : 'ni-panel ni-shell'}
      data-dock={dock}
      data-sheet={isNarrow ? sheetSize : undefined}
      aria-label={t(`${toolKey}.name`)}
      tabIndex={-1}
    >
      <header className="ni-panel__header">
        {isNarrow ? (
          <button
            type="button"
            className="ni-sheet__grabber"
            aria-label={sheetLabel}
            title={sheetLabel}
            aria-expanded={sheetSize === 'open'}
            onPointerDown={handleGrabberPointerDown}
            onPointerUp={handleGrabberPointerUp}
            onPointerCancel={() => {
              sheetDragStart.current = null;
            }}
            onClick={handleGrabberClick}
          />
        ) : null}
        <div className="ni-panel__top">
          <button
            type="button"
            className="ni-icon-button"
            aria-label={t('core.panel.back')}
            title={t('core.panel.back')}
            onClick={() => clearTool(tool.group)}
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </button>
          <span className="ni-panel__eyebrow">{t(`core.group.${tool.group}`)}</span>
          <div className="ni-panel__actions" ref={setActionsSlot} />
          <button
            type="button"
            className="ni-icon-button ni-panel__dock"
            aria-label={dockLabel}
            title={dockLabel}
            onClick={() => void updateSettings({ dock: nextDock })}
          >
            <DockIcon size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="ni-icon-button"
            aria-label={t('core.panel.close')}
            title={t('core.panel.close')}
            onClick={() => clearTool()}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <h2 className="ni-panel__title">{t(`${toolKey}.name`)}</h2>
        <div className="ni-panel__meta">
          <span className="ni-panel__meta-default">{t(`core.mode.${tool.mode}`)}</span>
          <div className="ni-panel__meta-slot" ref={setMetaSlot} />
        </div>
      </header>
      <div className="ni-panel__body" key={tool.id}>
        <PanelSlotsContext.Provider value={slots}>
          <ToolErrorBoundary key={tool.id}>
            <ToolPanel />
          </ToolErrorBoundary>
        </PanelSlotsContext.Provider>
      </div>
      <Credits />
    </aside>
  );
};
