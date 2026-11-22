import { useEffect, useRef } from 'react';
import { HighlightLayer } from '../lib/HighlightLayer';
import { isEditableTarget, isPickerLocked } from '../lib/picker';
import { getTool } from '../tools/registry';
import { Toaster } from '../ui';
import { Panel } from './Panel';
import { useOverlayStore } from './store';
import { Toolbar } from './Toolbar';
import './overlay.css';

type OverlayAppProps = { onClose: () => void };

const KEY_EVENTS_KEPT_FROM_PAGE = ['keydown', 'keyup', 'keypress'] as const;

export const OverlayApp = ({ onClose }: OverlayAppProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const activeTool = useOverlayStore((state) => state.activeTool);
  const tool = activeTool ? getTool(activeTool) : undefined;

  useEffect(() => {
    const handleKey = (event: KeyboardEvent): void => {
      const state = useOverlayStore.getState();
      if (event.key === 'Escape') {
        if (isPickerLocked()) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (state.menuGroup) state.closeMenu();
        else if (state.searchQuery) {
          state.setSearchQuery('');
          searchRef.current?.blur();
        } else if (state.activeTool) state.clearTool();
        else onClose();
        return;
      }
      const isPlainSlash = event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey;
      if (isPlainSlash && !isEditableTarget(event.composedPath()[0] ?? null)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [onClose]);

  useEffect(() => {
    const shadowRoot = rootRef.current?.getRootNode();
    if (!shadowRoot) return;
    const keepFromPage = (event: Event): void => event.stopPropagation();
    for (const type of KEY_EVENTS_KEPT_FROM_PAGE) shadowRoot.addEventListener(type, keepFromPage);
    return () => {
      for (const type of KEY_EVENTS_KEPT_FROM_PAGE) {
        shadowRoot.removeEventListener(type, keepFromPage);
      }
    };
  }, []);

  return (
    <div className="ni-overlay" ref={rootRef}>
      <HighlightLayer />
      <Toolbar searchRef={searchRef} onClose={onClose} />
      {tool ? <Panel tool={tool} /> : null}
      <Toaster />
    </div>
  );
};
