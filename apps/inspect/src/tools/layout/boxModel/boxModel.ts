import { convertPxValues, formatLength, type LengthUnit, parsePx } from '../../../lib/css';
import type { ViewportRect } from '../../../lib/highlight';

export type Edges = { top: number; right: number; bottom: number; left: number };

export type BoxMetrics = {
  width: number;
  height: number;
  margin: Edges;
  padding: Edges;
  border: Edges;
  radius: string;
  display: string;
  rects: {
    margin: ViewportRect;
    border: ViewportRect;
    padding: ViewportRect;
    content: ViewportRect;
  };
};

type StyleReader = { getPropertyValue: (name: string) => string };

const readEdges = (style: StyleReader, property: string, suffix = ''): Edges => ({
  top: parsePx(style.getPropertyValue(`${property}-top${suffix}`)),
  right: parsePx(style.getPropertyValue(`${property}-right${suffix}`)),
  bottom: parsePx(style.getPropertyValue(`${property}-bottom${suffix}`)),
  left: parsePx(style.getPropertyValue(`${property}-left${suffix}`)),
});

const grow = (rect: ViewportRect, edges: Edges): ViewportRect => ({
  x: rect.x - edges.left,
  y: rect.y - edges.top,
  width: rect.width + edges.left + edges.right,
  height: rect.height + edges.top + edges.bottom,
});

const shrink = (rect: ViewportRect, edges: Edges): ViewportRect => ({
  x: rect.x + edges.left,
  y: rect.y + edges.top,
  width: Math.max(0, rect.width - edges.left - edges.right),
  height: Math.max(0, rect.height - edges.top - edges.bottom),
});

export const readBoxMetrics = (style: StyleReader, borderBox: ViewportRect): BoxMetrics => {
  const margin = readEdges(style, 'margin');
  const padding = readEdges(style, 'padding');
  const border = readEdges(style, 'border', '-width');
  const paddingBox = shrink(borderBox, border);
  return {
    width: borderBox.width,
    height: borderBox.height,
    margin,
    padding,
    border,
    radius: style.getPropertyValue('border-radius').trim() || '0px',
    display: style.getPropertyValue('display').trim(),
    rects: {
      margin: grow(borderBox, margin),
      border: borderBox,
      padding: paddingBox,
      content: shrink(paddingBox, padding),
    },
  };
};

export const formatEdges = (edges: Edges, unit: LengthUnit): string => {
  const [top, right, bottom, left] = [edges.top, edges.right, edges.bottom, edges.left].map(
    (value) => formatLength(value, unit),
  );
  if (top === right && right === bottom && bottom === left) return top ?? '0px';
  if (top === bottom && right === left) return `${top} ${right}`;
  return `${top} ${right} ${bottom} ${left}`;
};

export const formatRadius = (radius: string, unit: LengthUnit): string =>
  convertPxValues(radius, unit);

export const formatSize = (width: number, height: number): string =>
  `${Math.round(width * 100) / 100} × ${Math.round(height * 100) / 100}`;
