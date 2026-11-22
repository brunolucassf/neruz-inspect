import { create } from 'zustand';
import type { ToolId } from '../tools/registry';

type OverlayState = {
  activeTool: ToolId | null;
  isPanelOpen: boolean;
  selectTool: (tool: ToolId | null) => void;
  togglePanel: () => void;
};

export const useOverlayStore = create<OverlayState>((set) => ({
  activeTool: null,
  isPanelOpen: false,
  selectTool: (tool) => set({ activeTool: tool, isPanelOpen: tool !== null }),
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
}));
