import { ArrowLeft, PanelLeft, PanelRight, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useT } from '../lib/i18n';
import { updateSettings, useSettingsStore } from '../lib/settings';
import type { ToolModule } from '../tools/types';
import { Credits } from './Credits';
import { useOverlayStore } from './store';
import { ToolErrorBoundary } from './ToolErrorBoundary';

type PanelProps = { tool: ToolModule };

export const Panel = ({ tool }: PanelProps) => {
  const t = useT();
  const dock = useSettingsStore((state) => state.dock);
  const clearTool = useOverlayStore((state) => state.clearTool);
  const panelRef = useRef<HTMLElement>(null);
  const toolKey = `${tool.group}.${tool.id}`;
  const ToolPanel = tool.Panel;
  const Icon = tool.icon;
  const nextDock = dock === 'right' ? 'left' : 'right';
  const DockIcon = nextDock === 'left' ? PanelLeft : PanelRight;
  const dockLabel = t(nextDock === 'left' ? 'core.panel.dockLeft' : 'core.panel.dockRight');

  // biome-ignore lint/correctness/useExhaustiveDependencies: focus moves into the panel only when another tool opens
  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
  }, [tool.id]);

  return (
    <aside
      ref={panelRef}
      className="ni-panel"
      data-dock={dock}
      aria-label={t(`${toolKey}.name`)}
      tabIndex={-1}
    >
      <header className="ni-panel__header">
        <button
          type="button"
          className="ni-icon-button"
          aria-label={t('core.panel.back')}
          title={t('core.panel.back')}
          onClick={() => clearTool(tool.group)}
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </button>
        <div className="ni-panel__heading">
          <Icon size={16} aria-hidden="true" className="ni-panel__icon" />
          <div className="ni-panel__titles">
            <h2 className="ni-panel__title">{t(`${toolKey}.name`)}</h2>
            <p className="ni-panel__mode">{t(`core.mode.${tool.mode}`)}</p>
          </div>
        </div>
        <button
          type="button"
          className="ni-icon-button"
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
      </header>
      <div className="ni-panel__body">
        <ToolErrorBoundary key={tool.id}>
          <ToolPanel />
        </ToolErrorBoundary>
      </div>
      <Credits />
    </aside>
  );
};
