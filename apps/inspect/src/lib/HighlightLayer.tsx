import type { CSSProperties } from 'react';
import { type HighlightItem, useHighlightStore, type ViewportRect } from './highlight';
import './highlight-layer.css';

const rectStyle = (rect: ViewportRect): CSSProperties => ({
  transform: `translate(${rect.x}px, ${rect.y}px)`,
  width: Math.max(rect.width, 1),
  height: Math.max(rect.height, 1),
});

const ringRects = (outer: ViewportRect, hole: ViewportRect): ViewportRect[] => {
  const topHeight = Math.max(0, hole.y - outer.y);
  const bottomY = hole.y + hole.height;
  const bottomHeight = Math.max(0, outer.y + outer.height - bottomY);
  const middleHeight = Math.max(0, bottomY - (outer.y + topHeight));
  const leftWidth = Math.max(0, hole.x - outer.x);
  const rightX = hole.x + hole.width;
  const rightWidth = Math.max(0, outer.x + outer.width - rightX);
  return [
    { x: outer.x, y: outer.y, width: outer.width, height: topHeight },
    { x: outer.x, y: outer.y + topHeight, width: leftWidth, height: middleHeight },
    { x: rightX, y: outer.y + topHeight, width: rightWidth, height: middleHeight },
    { x: outer.x, y: bottomY, width: outer.width, height: bottomHeight },
  ].filter((rect) => rect.width > 0 && rect.height > 0);
};

const labelPosition = (item: HighlightItem): CSSProperties => {
  const { rect, kind } = item;
  if (kind === 'line') {
    return { transform: `translate(${rect.x + rect.width / 2}px, ${rect.y + rect.height / 2}px)` };
  }
  const placeAbove = rect.y > 24;
  return {
    transform: `translate(${Math.max(rect.x, 0)}px, ${placeAbove ? rect.y - 22 : rect.y + 2}px)`,
  };
};

const HighlightShape = ({ item }: { item: HighlightItem }) => {
  const { kind, rect, hole } = item;
  if (kind === 'label') return null;
  if (hole) {
    return (
      <>
        {ringRects(rect, hole).map((part) => (
          <div
            key={`${part.x}:${part.y}:${part.width}:${part.height}`}
            className={`ni-hl ni-hl--${kind}`}
            style={rectStyle(part)}
          />
        ))}
      </>
    );
  }
  return <div className={`ni-hl ni-hl--${kind}`} style={rectStyle(rect)} />;
};

export const HighlightLayer = () => {
  const items = useHighlightStore((state) => state.items);
  if (items.length === 0) return null;
  return (
    <div className="ni-highlights" aria-hidden="true">
      {items.map((item, index) => (
        <HighlightShape
          // biome-ignore lint/suspicious/noArrayIndexKey: items are positional and rebuilt on every update
          key={index}
          item={item}
        />
      ))}
      {items.map((item, index) =>
        item.text ? (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: items are positional and rebuilt on every update
            key={index}
            className={`ni-hl-label ni-hl-label--${item.kind}`}
            style={labelPosition(item)}
          >
            {item.text}
          </span>
        ) : null,
      )}
    </div>
  );
};
