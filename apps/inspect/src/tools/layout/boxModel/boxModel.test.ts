import { describe, expect, it } from 'vitest';
import { formatEdges, formatRadius, formatSize, readBoxMetrics } from './boxModel';

const styleFrom = (values: Record<string, string>) => ({
  getPropertyValue: (name: string) => values[name] ?? '',
});

describe('readBoxMetrics', () => {
  const metrics = readBoxMetrics(
    styleFrom({
      'margin-top': '10px',
      'margin-right': '20px',
      'margin-bottom': '10px',
      'margin-left': '20px',
      'padding-top': '8px',
      'padding-right': '8px',
      'padding-bottom': '8px',
      'padding-left': '8px',
      'border-top-width': '1px',
      'border-right-width': '1px',
      'border-bottom-width': '1px',
      'border-left-width': '1px',
      'border-radius': '6px',
      display: 'flex',
    }),
    { x: 100, y: 50, width: 200, height: 80 },
  );

  it('reads edges, radius and display', () => {
    expect(metrics.margin).toEqual({ top: 10, right: 20, bottom: 10, left: 20 });
    expect(metrics.padding.left).toBe(8);
    expect(metrics.border.top).toBe(1);
    expect(metrics.radius).toBe('6px');
    expect(metrics.display).toBe('flex');
  });

  it('derives nested rects from the border box', () => {
    expect(metrics.rects.margin).toEqual({ x: 80, y: 40, width: 240, height: 100 });
    expect(metrics.rects.border).toEqual({ x: 100, y: 50, width: 200, height: 80 });
    expect(metrics.rects.padding).toEqual({ x: 101, y: 51, width: 198, height: 78 });
    expect(metrics.rects.content).toEqual({ x: 109, y: 59, width: 182, height: 62 });
  });

  it('never returns a negative content size', () => {
    const tiny = readBoxMetrics(styleFrom({ 'padding-left': '20px', 'padding-right': '20px' }), {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    expect(tiny.rects.content.width).toBe(0);
  });
});

describe('formatting', () => {
  it('collapses edges like CSS shorthand', () => {
    expect(formatEdges({ top: 8, right: 8, bottom: 8, left: 8 }, 'px')).toBe('8px');
    expect(formatEdges({ top: 8, right: 16, bottom: 8, left: 16 }, 'px')).toBe('8px 16px');
    expect(formatEdges({ top: 1, right: 2, bottom: 3, left: 4 }, 'px')).toBe('1px 2px 3px 4px');
    expect(formatEdges({ top: 8, right: 16, bottom: 8, left: 16 }, 'rem')).toBe('0.5rem 1rem');
  });

  it('formats radius and size', () => {
    expect(formatRadius('8px 4px', 'rem')).toBe('0.5rem 0.25rem');
    expect(formatSize(320.456, 48)).toBe('320.46 × 48');
  });
});
