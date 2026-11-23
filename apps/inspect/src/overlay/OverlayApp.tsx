import { useEffect, useRef } from 'react';
import { HighlightLayer } from '../lib/HighlightLayer';
import { isEditableTarget, isPickerLocked } from '../lib/picker';
import { useSettingsStore } from '../lib/settings';
import { GROUPS, getTool } from '../tools/registry';
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
  const dock = useSettingsStore((state) => state.dock);
  const tool = activeTool ? getTool(activeTool) : undefined;

  useEffect(() => {
    const getFocusedElement = (): Element | null => {
      const root = rootRef.current?.getRootNode();
      const insideOverlay = root instanceof ShadowRoot ? root.activeElement : null;
      return insideOverlay ?? document.activeElement;
    };
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
      const hasModifier = event.ctrlKey || event.metaKey || event.altKey;
      if (hasModifier || isEditableTarget(getFocusedElement())) return;
      const shortcutGroup = /^[1-9]$/.test(event.key) ? GROUPS[Number(event.key) - 1] : undefined;
      if (event.key === '/') {
        event.preventDefault();
        event.stopImmediatePropagation();
        searchRef.current?.focus();
      } else if (shortcutGroup) {
        event.preventDefault();
        event.stopImmediatePropagation();
        state.toggleMenu(shortcutGroup);
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
    <div className="ni-overlay" ref={rootRef} data-panel={tool ? dock : undefined}>
      <HighlightLayer />
      <Toolbar searchRef={searchRef} onClose={onClose} />
      {tool ? <Panel tool={tool} /> : null}
      <Toaster />
    </div>
  );
};
