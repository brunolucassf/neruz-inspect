import {
  Activity,
  Code2,
  Cpu,
  FileSearch,
  type LucideIcon,
  Palette,
  Ruler,
  Type,
  Wrench,
} from 'lucide-react';
import code from './code';
import color from './color';
import layout from './layout';
import motion from './motion';
import page from './page';
import tech from './tech';
import typeTools from './type';
import type { ToolGroup, ToolId, ToolModule } from './types';
import { TOOL_GROUPS } from './types';
import utils from './utils';

export const GROUP_ICONS: Record<ToolGroup, LucideIcon> = {
  color: Palette,
  type: Type,
  layout: Ruler,
  code: Code2,
  motion: Activity,
  tech: Cpu,
  page: FileSearch,
  utils: Wrench,
};

export const GROUPS: readonly ToolGroup[] = TOOL_GROUPS;

export const TOOLS: readonly ToolModule[] = [
  ...color,
  ...typeTools,
  ...layout,
  ...code,
  ...motion,
  ...tech,
  ...page,
  ...utils,
];

const toolsById = new Map<ToolId, ToolModule>(TOOLS.map((tool) => [tool.id, tool]));

export const getTool = (id: ToolId): ToolModule | undefined => toolsById.get(id);

export const getToolsByGroup = (group: ToolGroup): readonly ToolModule[] =>
  TOOLS.filter((tool) => tool.group === group);
