import type { Locale } from '@neruz/i18n';
import type { LucideIcon } from 'lucide-react';
import type { FC } from 'react';

export const TOOL_GROUPS = [
  'color',
  'type',
  'layout',
  'code',
  'motion',
  'tech',
  'page',
  'utils',
] as const;

export type ToolGroup = (typeof TOOL_GROUPS)[number];

export type ToolId =
  | 'eyedropper'
  | 'palette'
  | 'contrast'
  | 'colorTools'
  | 'gradientShadow'
  | 'colorblind'
  | 'fontHover'
  | 'fontList'
  | 'fontSwap'
  | 'typeScale'
  | 'ruler'
  | 'boxModel'
  | 'gridFlex'
  | 'overflow'
  | 'zIndex'
  | 'breakpoints'
  | 'outlines'
  | 'figmaOverlay'
  | 'copyStyles'
  | 'copyComponent'
  | 'designTokens'
  | 'editLive'
  | 'motionInspector'
  | 'pageToggles'
  | 'techStack'
  | 'tagsPixels'
  | 'storageViewer'
  | 'jsonViewer'
  | 'seoMeta'
  | 'structuredData'
  | 'robotsSitemap'
  | 'links'
  | 'assets'
  | 'icons'
  | 'vitals'
  | 'a11y'
  | 'report'
  | 'units'
  | 'lorem'
  | 'formFill'
  | 'qrCode'
  | 'clipboardHistory';

export const PROBE_NAMES = ['tech', 'tags', 'motion', 'vitals'] as const;
export type ProbeName = (typeof PROBE_NAMES)[number];

export type ToolMode = 'hover' | 'panel' | 'action';

export type ToolModule = {
  id: ToolId;
  group: ToolGroup;
  icon: LucideIcon;
  mode: ToolMode;
  Panel: FC;
};

export type GroupMessages = Record<Locale, Readonly<Record<string, string>>>;
