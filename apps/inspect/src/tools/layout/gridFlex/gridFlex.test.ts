import { describe, expect, it } from 'vitest';
import {
  buildTrackSpans,
  containerKindOf,
  flexAxisOf,
  parseGridAreas,
  parseTrackList,
  readProperties,
  spanExtent,
} from './gridFlex';

describe('containerKindOf', () => {
  it('recognises grid and flex displays', () => {
    expect(containerKindOf('grid')).toBe('grid');
    expect(containerKindOf('inline-flex')).toBe('flex');
    expect(containerKindOf('block')).toBeNull();
  });
});

describe('parseTrackList', () => {
  it('reads resolved pixel tracks', () => {
    expect(parseTrackList('100px 200.5px 50px').sizes).toEqual([100, 200.5, 50]);
  });

  it('collects named lines around tracks', () => {
    const list = parseTrackList('[full-start] 100px [content-start main-start] 300px [full-end]');
    expect(list.sizes).toEqual([100, 300]);
    expect(list.lineNames).toEqual([['full-start'], ['content-start', 'main-start'], ['full-end']]);
  });

  it('returns no tracks for none', () => {
    expect(parseTrackList('none').sizes).toEqual([]);
  });
});

describe('buildTrackSpans', () => {
  it('places tracks separated by the gap', () => {
    expect(buildTrackSpans(10, [100, 50], 8)).toEqual([
      { start: 10, size: 100 },
      { start: 118, size: 50 },
    ]);
  });

  it('extends a span across several tracks', () => {
    const spans = buildTrackSpans(0, [100, 100, 100], 10);
    expect(spanExtent(spans, 0, 2)).toEqual({ start: 0, size: 210 });
    expect(spanExtent(spans, 2, 5)).toBeNull();
  });
});

describe('parseGridAreas', () => {
  it('merges repeated names into one rectangle', () => {
    const areas = parseGridAreas('"header header" "nav main" "nav footer"');
    const nav = areas.find((area) => area.name === 'nav');
    const header = areas.find((area) => area.name === 'header');
    expect(nav).toEqual({ name: 'nav', rowStart: 1, rowEnd: 3, columnStart: 0, columnEnd: 1 });
    expect(header).toEqual({
      name: 'header',
      rowStart: 0,
      rowEnd: 1,
      columnStart: 0,
      columnEnd: 2,
    });
  });

  it('ignores empty cells and none', () => {
    expect(parseGridAreas('none')).toEqual([]);
    expect(parseGridAreas('"a ." ". b"').map((area) => area.name)).toEqual(['a', 'b']);
  });
});

describe('readProperties', () => {
  it('drops none and empty values', () => {
    const values: Record<string, string> = {
      display: 'grid',
      'grid-template-columns': '100px 100px',
      'grid-template-areas': 'none',
    };
    const names = readProperties('grid', (name) => values[name] ?? '').map((entry) => entry.name);
    expect(names).toEqual(['display', 'grid-template-columns']);
  });
});

describe('flexAxisOf', () => {
  it('maps direction to axis', () => {
    expect(flexAxisOf('row')).toEqual({ main: 'x', reversed: false });
    expect(flexAxisOf('column-reverse')).toEqual({ main: 'y', reversed: true });
  });
});
