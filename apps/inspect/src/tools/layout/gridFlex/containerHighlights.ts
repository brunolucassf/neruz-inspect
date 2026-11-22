import { parsePx } from '../../../lib/css';
import { getViewportRect, type HighlightItem, type ViewportRect } from '../../../lib/highlight';
import {
  buildTrackSpans,
  type ContainerKind,
  flexAxisOf,
  parseGridAreas,
  parseTrackList,
  spanExtent,
} from './gridFlex';

const MAX_LINE_LABELS = 12;

const contentRectOf = (rect: ViewportRect, style: CSSStyleDeclaration): ViewportRect => {
  const left = parsePx(style.borderLeftWidth) + parsePx(style.paddingLeft);
  const right = parsePx(style.borderRightWidth) + parsePx(style.paddingRight);
  const top = parsePx(style.borderTopWidth) + parsePx(style.paddingTop);
  const bottom = parsePx(style.borderBottomWidth) + parsePx(style.paddingBottom);
  return {
    x: rect.x + left,
    y: rect.y + top,
    width: Math.max(0, rect.width - left - right),
    height: Math.max(0, rect.height - top - bottom),
  };
};

const gapOf = (value: string): number => (value === 'normal' ? 0 : parsePx(value));

const buildGridHighlights = (rect: ViewportRect, style: CSSStyleDeclaration): HighlightItem[] => {
  const content = contentRectOf(rect, style);
  const columnGap = gapOf(style.columnGap);
  const rowGap = gapOf(style.rowGap);
  const columns = parseTrackList(style.gridTemplateColumns);
  const rows = parseTrackList(style.gridTemplateRows);
  const columnSpans = buildTrackSpans(content.x, columns.sizes, columnGap);
  const rowSpans = buildTrackSpans(content.y, rows.sizes, rowGap);
  const items: HighlightItem[] = [{ kind: 'grid', rect }];

  columnSpans.forEach((span, index) => {
    items.push({
      kind: 'grid',
      rect: { x: span.start, y: content.y, width: span.size, height: content.height },
    });
    const next = columnSpans[index + 1];
    if (next && columnGap > 0) {
      items.push({
        kind: 'margin',
        rect: {
          x: span.start + span.size,
          y: content.y,
          width: next.start - span.start - span.size,
          height: content.height,
        },
      });
    }
  });

  rowSpans.forEach((span, index) => {
    items.push({
      kind: 'grid',
      rect: { x: content.x, y: span.start, width: content.width, height: span.size },
    });
    const next = rowSpans[index + 1];
    if (next && rowGap > 0) {
      items.push({
        kind: 'margin',
        rect: {
          x: content.x,
          y: span.start + span.size,
          width: content.width,
          height: next.start - span.start - span.size,
        },
      });
    }
  });

  if (columnSpans.length <= MAX_LINE_LABELS) {
    columnSpans.forEach((span, index) => {
      items.push({
        kind: 'label',
        rect: { x: span.start, y: content.y, width: 0, height: 0 },
        text: String(index + 1),
      });
    });
  }
  if (rowSpans.length <= MAX_LINE_LABELS) {
    rowSpans.forEach((span, index) => {
      items.push({
        kind: 'label',
        rect: { x: content.x - 14, y: span.start + 22, width: 0, height: 0 },
        text: String(index + 1),
      });
    });
  }

  for (const area of parseGridAreas(style.gridTemplateAreas)) {
    const horizontal = spanExtent(columnSpans, area.columnStart, area.columnEnd);
    const vertical = spanExtent(rowSpans, area.rowStart, area.rowEnd);
    if (!horizontal || !vertical) continue;
    items.push({
      kind: 'box',
      rect: {
        x: horizontal.start,
        y: vertical.start,
        width: horizontal.size,
        height: vertical.size,
      },
      text: area.name,
    });
  }
  return items;
};

const buildFlexHighlights = (
  element: Element,
  rect: ViewportRect,
  style: CSSStyleDeclaration,
): HighlightItem[] => {
  const content = contentRectOf(rect, style);
  const axis = flexAxisOf(style.flexDirection);
  const gap = gapOf(axis.main === 'x' ? style.columnGap : style.rowGap);
  const arrow = axis.main === 'x' ? (axis.reversed ? '←' : '→') : axis.reversed ? '↑' : '↓';
  const items: HighlightItem[] = [{ kind: 'grid', rect }];

  const childRects = Array.from(element.children)
    .filter((child) => getComputedStyle(child).display !== 'none')
    .map(getViewportRect)
    .filter((childRect) => childRect.width > 0 && childRect.height > 0);

  for (const childRect of childRects) items.push({ kind: 'grid', rect: childRect });

  if (gap > 0) {
    childRects.forEach((current, index) => {
      const next = childRects[index + 1];
      if (!next) return;
      if (axis.main === 'x') {
        const space = next.x - (current.x + current.width);
        const overlap =
          Math.min(current.y + current.height, next.y + next.height) - Math.max(current.y, next.y);
        if (Math.abs(space - gap) < 1 && overlap > 0) {
          items.push({
            kind: 'margin',
            rect: {
              x: current.x + current.width,
              y: current.y,
              width: space,
              height: current.height,
            },
          });
        }
      } else {
        const space = next.y - (current.y + current.height);
        const overlap =
          Math.min(current.x + current.width, next.x + next.width) - Math.max(current.x, next.x);
        if (Math.abs(space - gap) < 1 && overlap > 0) {
          items.push({
            kind: 'margin',
            rect: {
              x: current.x,
              y: current.y + current.height,
              width: current.width,
              height: space,
            },
          });
        }
      }
    });
  }

  const axisText = `${style.flexDirection} ${arrow}`;
  items.push(
    axis.main === 'x'
      ? {
          kind: 'line',
          rect: {
            x: content.x,
            y: content.y + content.height / 2,
            width: content.width,
            height: 1,
          },
          text: axisText,
        }
      : {
          kind: 'line',
          rect: {
            x: content.x + content.width / 2,
            y: content.y,
            width: 1,
            height: content.height,
          },
          text: axisText,
        },
  );
  return items;
};

export const buildContainerHighlights = (
  element: Element,
  kind: ContainerKind,
): HighlightItem[] => {
  const style = getComputedStyle(element);
  const rect = getViewportRect(element);
  return kind === 'grid'
    ? buildGridHighlights(rect, style)
    : buildFlexHighlights(element, rect, style);
};
