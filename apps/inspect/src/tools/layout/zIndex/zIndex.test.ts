import { describe, expect, it } from 'vitest';
import {
  flattenLayerTree,
  type LayerNode,
  parseZIndex,
  type StackingInput,
  stackingReason,
} from './zIndex';

const baseInput: StackingInput = {
  isRoot: false,
  position: 'static',
  zIndex: 'auto',
  opacity: '1',
  transform: 'none',
  filter: 'none',
  backdropFilter: 'none',
  perspective: 'none',
  clipPath: 'none',
  maskImage: 'none',
  isolation: 'auto',
  mixBlendMode: 'normal',
  willChange: 'auto',
  contain: 'none',
  containerType: 'normal',
  parentDisplay: 'block',
};

const input = (overrides: Partial<StackingInput>): StackingInput => ({
  ...baseInput,
  ...overrides,
});

describe('stackingReason', () => {
  it('returns null for a plain element', () => {
    expect(stackingReason(baseInput)).toBeNull();
  });

  it('ignores positioned elements with z-index auto', () => {
    expect(stackingReason(input({ position: 'relative' }))).toBeNull();
  });

  it('detects z-index on positioned elements', () => {
    expect(stackingReason(input({ position: 'absolute', zIndex: '3' }))).toBe('z-index');
  });

  it('ignores z-index on static block children', () => {
    expect(stackingReason(input({ zIndex: '3' }))).toBeNull();
  });

  it('detects z-index on flex items', () => {
    expect(stackingReason(input({ zIndex: '1', parentDisplay: 'flex' }))).toBe('flex-item');
  });

  it('detects fixed and sticky positions', () => {
    expect(stackingReason(input({ position: 'fixed' }))).toBe('position-fixed');
    expect(stackingReason(input({ position: 'sticky' }))).toBe('position-sticky');
  });

  it('detects opacity, transform and other creators', () => {
    expect(stackingReason(input({ opacity: '0.5' }))).toBe('opacity');
    expect(stackingReason(input({ transform: 'matrix(1, 0, 0, 1, 0, 0)' }))).toBe('transform');
    expect(stackingReason(input({ isolation: 'isolate' }))).toBe('isolation');
    expect(stackingReason(input({ willChange: 'transform' }))).toBe('will-change');
    expect(stackingReason(input({ contain: 'layout paint' }))).toBe('contain');
  });

  it('marks the root', () => {
    expect(stackingReason(input({ isRoot: true }))).toBe('root');
  });
});

describe('parseZIndex', () => {
  it('parses integers and falls back to zero for auto', () => {
    expect(parseZIndex('-2')).toBe(-2);
    expect(parseZIndex('auto')).toBe(0);
  });
});

describe('flattenLayerTree', () => {
  const nodes: LayerNode[] = [
    { id: 0, parentId: null, order: 0, z: 0 },
    { id: 1, parentId: 0, order: 1, z: 5 },
    { id: 2, parentId: 0, order: 2, z: 10 },
    { id: 3, parentId: 1, order: 3, z: 1 },
    { id: 4, parentId: 0, order: 4, z: 5 },
  ];

  it('nests by context and orders siblings from front to back', () => {
    const flat = flattenLayerTree(nodes).map((entry) => [entry.node.id, entry.depth]);
    expect(flat).toEqual([
      [0, 0],
      [2, 1],
      [4, 1],
      [1, 1],
      [3, 2],
    ]);
  });

  it('promotes orphans to the top level', () => {
    const flat = flattenLayerTree([{ id: 9, parentId: 77, order: 0, z: 0 }]);
    expect(flat[0]?.depth).toBe(0);
  });
});
