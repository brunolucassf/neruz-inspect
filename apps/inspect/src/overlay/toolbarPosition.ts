export type Point = { x: number; y: number };
export type Size = { width: number; height: number };

export const VIEWPORT_MARGIN = 8;

export const clampPosition = (position: Point, bar: Size, viewport: Size): Point => {
  const maxX = Math.max(VIEWPORT_MARGIN, viewport.width - bar.width - VIEWPORT_MARGIN);
  const maxY = Math.max(VIEWPORT_MARGIN, viewport.height - bar.height - VIEWPORT_MARGIN);
  return {
    x: Math.min(Math.max(position.x, VIEWPORT_MARGIN), maxX),
    y: Math.min(Math.max(position.y, VIEWPORT_MARGIN), maxY),
  };
};

export type MenuPlacement = { vertical: 'above' | 'below'; align: 'start' | 'end' };

export const MENU_WIDTH = 340;

export const getMenuPlacement = (bar: Point & Size, viewport: Size): MenuPlacement => ({
  vertical: bar.y + bar.height / 2 > viewport.height / 2 ? 'above' : 'below',
  align: bar.x + MENU_WIDTH > viewport.width - VIEWPORT_MARGIN ? 'end' : 'start',
});
