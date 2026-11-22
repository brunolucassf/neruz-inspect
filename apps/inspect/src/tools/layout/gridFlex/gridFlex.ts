export type ContainerKind = 'grid' | 'flex';

export const containerKindOf = (display: string): ContainerKind | null => {
  if (display === 'grid' || display === 'inline-grid') return 'grid';
  if (display === 'flex' || display === 'inline-flex') return 'flex';
  return null;
};

export type TrackList = { sizes: number[]; lineNames: string[][] };

export const parseTrackList = (value: string): TrackList => {
  const sizes: number[] = [];
  const lineNames: string[][] = [[]];
  if (!value || value === 'none') return { sizes, lineNames };
  const tokens = value.matchAll(/\[([^\]]*)\]|([^\s[\]]+)/g);
  for (const token of tokens) {
    const [, names, size] = token;
    if (names !== undefined) {
      const current = lineNames[lineNames.length - 1];
      current?.push(...names.split(/\s+/).filter(Boolean));
    } else if (size !== undefined) {
      const px = Number.parseFloat(size);
      if (!Number.isFinite(px)) continue;
      sizes.push(px);
      lineNames.push([]);
    }
  }
  return { sizes, lineNames };
};

export type TrackSpan = { start: number; size: number };

export const buildTrackSpans = (
  origin: number,
  sizes: readonly number[],
  gap: number,
): TrackSpan[] => {
  const spans: TrackSpan[] = [];
  let cursor = origin;
  for (const size of sizes) {
    spans.push({ start: cursor, size });
    cursor += size + gap;
  }
  return spans;
};

export type GridArea = {
  name: string;
  rowStart: number;
  rowEnd: number;
  columnStart: number;
  columnEnd: number;
};

export const parseGridAreas = (value: string): GridArea[] => {
  if (!value || value === 'none') return [];
  const areas = new Map<string, GridArea>();
  const rows = Array.from(value.matchAll(/"([^"]*)"/g), (match) => match[1] ?? '');
  rows.forEach((row, rowIndex) => {
    row
      .split(/\s+/)
      .filter(Boolean)
      .forEach((name, columnIndex) => {
        if (name === '.') return;
        const existing = areas.get(name);
        if (!existing) {
          areas.set(name, {
            name,
            rowStart: rowIndex,
            rowEnd: rowIndex + 1,
            columnStart: columnIndex,
            columnEnd: columnIndex + 1,
          });
          return;
        }
        existing.rowStart = Math.min(existing.rowStart, rowIndex);
        existing.rowEnd = Math.max(existing.rowEnd, rowIndex + 1);
        existing.columnStart = Math.min(existing.columnStart, columnIndex);
        existing.columnEnd = Math.max(existing.columnEnd, columnIndex + 1);
      });
  });
  return Array.from(areas.values());
};

export const spanExtent = (
  spans: readonly TrackSpan[],
  startIndex: number,
  endIndex: number,
): TrackSpan | null => {
  const first = spans[startIndex];
  const last = spans[endIndex - 1];
  if (!first || !last) return null;
  return { start: first.start, size: last.start + last.size - first.start };
};

const GRID_PROPERTIES = [
  'display',
  'grid-template-columns',
  'grid-template-rows',
  'grid-template-areas',
  'row-gap',
  'column-gap',
  'grid-auto-flow',
  'justify-items',
  'align-items',
  'justify-content',
  'align-content',
] as const;

const FLEX_PROPERTIES = [
  'display',
  'flex-direction',
  'flex-wrap',
  'justify-content',
  'align-items',
  'align-content',
  'row-gap',
  'column-gap',
] as const;

const HIDDEN_VALUES = new Set(['none', '']);

export const propertyNamesFor = (kind: ContainerKind): readonly string[] =>
  kind === 'grid' ? GRID_PROPERTIES : FLEX_PROPERTIES;

export type PropertyEntry = { name: string; value: string };

export const readProperties = (
  kind: ContainerKind,
  read: (name: string) => string,
): PropertyEntry[] =>
  propertyNamesFor(kind)
    .map((name) => ({ name, value: read(name).trim() }))
    .filter((entry) => !HIDDEN_VALUES.has(entry.value));

export const propertiesToCss = (entries: readonly PropertyEntry[]): string =>
  entries.map((entry) => `${entry.name}: ${entry.value};`).join('\n');

export type FlexAxis = { main: 'x' | 'y'; reversed: boolean };

export const flexAxisOf = (direction: string): FlexAxis => ({
  main: direction.startsWith('column') ? 'y' : 'x',
  reversed: direction.endsWith('reverse'),
});
