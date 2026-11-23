import type { ToolId } from './layout';

export interface ScenePose {
  rx: number;
  ry: number;
  zoom: number;
}

export interface SceneSpec {
  tool: ToolId;
  pose: ScenePose;
  chipTools: (ToolId | null)[];
}

export const TOOL_TARGET: Record<ToolId, string | null> = {
  box: 'button',
  font: 'title',
  eyedropper: 'swatch-clay',
  assets: 'art',
  contrast: 'title',
  tokens: null,
  component: 'art',
  overflow: 'marquee',
  motion: 'art',
  tags: 'button',
  tech: null,
  utils: null,
};

export const HERO_POSE: ScenePose = { rx: 10, ry: -16, zoom: 1 };

export const SCENES: Record<string, SceneSpec> = {
  cor: {
    tool: 'contrast',
    pose: { rx: 8, ry: -12, zoom: 1.06 },
    chipTools: ['eyedropper', null, 'contrast', 'font', 'font'],
  },
  'design-system': {
    tool: 'tokens',
    pose: { rx: 9, ry: -18, zoom: 1 },
    chipTools: ['tokens', null, null],
  },
  componente: {
    tool: 'component',
    pose: { rx: 6, ry: -8, zoom: 1 },
    chipTools: ['component', null],
  },
  layout: {
    tool: 'overflow',
    pose: { rx: 6, ry: -6, zoom: 1 },
    chipTools: ['overflow', null, 'box', null, null, null],
  },
  movimento: {
    tool: 'motion',
    pose: { rx: 8, ry: -10, zoom: 1 },
    chipTools: ['motion', null],
  },
  tecnologia: {
    tool: 'tags',
    pose: { rx: 8, ry: -14, zoom: 1 },
    chipTools: ['tags', 'tech', null, null],
  },
  pagina: {
    tool: 'assets',
    pose: { rx: 2, ry: 0, zoom: 1 },
    chipTools: [null, null, null, null, null, 'assets'],
  },
  utilitarios: {
    tool: 'utils',
    pose: { rx: 6, ry: -10, zoom: 1.04 },
    chipTools: ['utils', null, null, null, null],
  },
};

export function sceneTools(spec: SceneSpec): ToolId[] {
  return [
    ...new Set([spec.tool, ...spec.chipTools.filter((tool): tool is ToolId => tool !== null)]),
  ];
}
