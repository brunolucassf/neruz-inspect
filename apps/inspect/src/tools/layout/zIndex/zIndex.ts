export type StackingInput = {
  isRoot: boolean;
  position: string;
  zIndex: string;
  opacity: string;
  transform: string;
  filter: string;
  backdropFilter: string;
  perspective: string;
  clipPath: string;
  maskImage: string;
  isolation: string;
  mixBlendMode: string;
  willChange: string;
  contain: string;
  containerType: string;
  parentDisplay: string;
};

export type StackingReason =
  | 'root'
  | 'position-fixed'
  | 'position-sticky'
  | 'z-index'
  | 'flex-item'
  | 'opacity'
  | 'transform'
  | 'filter'
  | 'backdrop-filter'
  | 'perspective'
  | 'clip-path'
  | 'mask'
  | 'isolation'
  | 'mix-blend-mode'
  | 'will-change'
  | 'contain'
  | 'container-type';

const isSet = (value: string): boolean => value !== '' && value !== 'none';

export const stackingReason = (input: StackingInput): StackingReason | null => {
  if (input.isRoot) return 'root';
  const hasZIndex = input.zIndex !== 'auto' && input.zIndex !== '';
  if (input.position === 'fixed') return 'position-fixed';
  if (input.position === 'sticky') return 'position-sticky';
  if (hasZIndex && input.position !== 'static') return 'z-index';
  if (hasZIndex && /flex|grid/.test(input.parentDisplay)) return 'flex-item';
  if (Number.parseFloat(input.opacity) < 1) return 'opacity';
  if (isSet(input.transform)) return 'transform';
  if (isSet(input.filter)) return 'filter';
  if (isSet(input.backdropFilter)) return 'backdrop-filter';
  if (isSet(input.perspective)) return 'perspective';
  if (isSet(input.clipPath)) return 'clip-path';
  if (isSet(input.maskImage)) return 'mask';
  if (input.isolation === 'isolate') return 'isolation';
  if (input.mixBlendMode !== 'normal' && input.mixBlendMode !== '') return 'mix-blend-mode';
  if (/transform|opacity|filter|perspective|isolation|clip-path|mask/.test(input.willChange)) {
    return 'will-change';
  }
  if (/layout|paint|strict|content/.test(input.contain)) return 'contain';
  if (input.containerType === 'size' || input.containerType === 'inline-size') {
    return 'container-type';
  }
  return null;
};

export const parseZIndex = (value: string): number => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

export type LayerNode = {
  id: number;
  parentId: number | null;
  order: number;
  z: number;
};

export type FlatLayer<T extends LayerNode> = { node: T; depth: number };

const byVisualOrder = (a: LayerNode, b: LayerNode): number => b.z - a.z || b.order - a.order;

export const flattenLayerTree = <T extends LayerNode>(nodes: readonly T[]): FlatLayer<T>[] => {
  const ids = new Set(nodes.map((node) => node.id));
  const children = new Map<number | null, T[]>();
  for (const node of nodes) {
    const parent = node.parentId !== null && ids.has(node.parentId) ? node.parentId : null;
    const siblings = children.get(parent) ?? [];
    siblings.push(node);
    children.set(parent, siblings);
  }
  const flat: FlatLayer<T>[] = [];
  const walk = (parent: number | null, depth: number): void => {
    for (const node of (children.get(parent) ?? []).sort(byVisualOrder)) {
      flat.push({ node, depth });
      walk(node.id, depth + 1);
    }
  };
  walk(null, 0);
  return flat;
};
