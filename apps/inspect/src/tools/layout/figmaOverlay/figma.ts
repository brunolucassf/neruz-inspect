export type Size = { width: number; height: number };

export const DEFAULT_OPACITY = 50;

export const clampOpacity = (percent: number): number =>
  Number.isFinite(percent) ? Math.min(100, Math.max(0, Math.round(percent))) : DEFAULT_OPACITY;

export const scaleToWidth = (natural: Size, width: number): Size => ({
  width,
  height: (natural.height * width) / natural.width,
});

export const scaleByFactor = (natural: Size, factor: number): Size => ({
  width: natural.width * factor,
  height: natural.height * factor,
});

export const centerLeft = (imageWidth: number, containerWidth: number): number =>
  Math.round((containerWidth - imageWidth) / 2);

export const isImageFile = (file: { type: string }): boolean => file.type.startsWith('image/');

export const clampDimension = (value: number, fallback: number): number =>
  Number.isFinite(value) && value >= 1 ? Math.min(value, 20000) : fallback;
