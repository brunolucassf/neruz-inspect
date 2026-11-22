import { useEffect } from 'react';
import { TOOLS } from '../tools/registry';
import { useOverlayStore } from './store';

type OverlayAppProps = { onClose: () => void };

export const OverlayApp = ({ onClose }: OverlayAppProps) => {
  const activeTool = useOverlayStore((state) => state.activeTool);
  const isPanelOpen = useOverlayStore((state) => state.isPanelOpen);
  const selectTool = useOverlayStore((state) => state.selectTool);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (useOverlayStore.getState().activeTool) selectTool(null);
      else onClose();
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [onClose, selectTool]);

  return (
    <div className="ni-overlay">
      <nav className="ni-toolbar" aria-label="Neruz Inspect">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className="ni-tool"
            aria-pressed={activeTool === tool.id}
            onClick={() => selectTool(activeTool === tool.id ? null : tool.id)}
          >
            {tool.shortcut}
          </button>
        ))}
        <button type="button" className="ni-tool" onClick={onClose} aria-label="Close">
          ×
        </button>
      </nav>
      {isPanelOpen && activeTool ? <aside className="ni-panel">{activeTool}</aside> : null}
    </div>
  );
};
