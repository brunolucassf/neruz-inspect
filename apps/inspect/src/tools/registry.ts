export type ToolGroup = 'color' | 'type' | 'measure' | 'tech' | 'page';

export type ToolId =
  | 'eyedropper'
  | 'palette'
  | 'contrast'
  | 'fontHover'
  | 'fontList'
  | 'ruler'
  | 'boxModel'
  | 'copyStyles'
  | 'techStack'
  | 'seoMeta'
  | 'assets'
  | 'vitals'
  | 'a11y';

export type ToolDefinition = {
  id: ToolId;
  group: ToolGroup;
  shortcut: string;
  isHoverTool: boolean;
};

export const TOOLS: readonly ToolDefinition[] = [
  { id: 'eyedropper', group: 'color', shortcut: 'C', isHoverTool: false },
  { id: 'palette', group: 'color', shortcut: 'P', isHoverTool: false },
  { id: 'contrast', group: 'color', shortcut: 'K', isHoverTool: true },
  { id: 'fontHover', group: 'type', shortcut: 'F', isHoverTool: true },
  { id: 'fontList', group: 'type', shortcut: 'L', isHoverTool: false },
  { id: 'ruler', group: 'measure', shortcut: 'M', isHoverTool: true },
  { id: 'boxModel', group: 'measure', shortcut: 'B', isHoverTool: true },
  { id: 'copyStyles', group: 'measure', shortcut: 'S', isHoverTool: true },
  { id: 'techStack', group: 'tech', shortcut: 'T', isHoverTool: false },
  { id: 'seoMeta', group: 'page', shortcut: 'O', isHoverTool: false },
  { id: 'assets', group: 'page', shortcut: 'A', isHoverTool: false },
  { id: 'vitals', group: 'page', shortcut: 'V', isHoverTool: false },
  { id: 'a11y', group: 'page', shortcut: 'Y', isHoverTool: false },
];
