import { create } from 'zustand';
import { notifyToolOpened } from '../lib/bridge';
import type { ToolGroup, ToolId } from '../tools/types';

type OverlayState = {
  activeTool: ToolId | null;
  menuGroup: ToolGroup | null;
  searchQuery: string;
  selectTool: (tool: ToolId) => void;
  clearTool: (reopenGroup?: ToolGroup) => void;
  toggleMenu: (group: ToolGroup) => void;
  closeMenu: () => void;
  setSearchQuery: (query: string) => void;
};

export const useOverlayStore = create<OverlayState>((set) => ({
  activeTool: null,
  menuGroup: null,
  searchQuery: '',
  selectTool: (tool) => {
    void notifyToolOpened(tool);
    set({ activeTool: tool, menuGroup: null, searchQuery: '' });
  },
  clearTool: (reopenGroup) => set({ activeTool: null, menuGroup: reopenGroup ?? null }),
  toggleMenu: (group) =>
    set((state) => ({
      menuGroup: state.menuGroup === group ? null : group,
      searchQuery: '',
    })),
  closeMenu: () => set({ menuGroup: null }),
  setSearchQuery: (query) => set({ searchQuery: query, menuGroup: null }),
}));
