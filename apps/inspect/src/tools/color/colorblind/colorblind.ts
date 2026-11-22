export const VISION_MODES = [
  'protanopia',
  'deuteranopia',
  'tritanopia',
  'achromatopsia',
  'blur',
] as const;

export type VisionMode = (typeof VISION_MODES)[number];

type Matrix3 = readonly [number, number, number, number, number, number, number, number, number];

const DICHROMACY_MATRICES: Readonly<Record<'protanopia' | 'deuteranopia' | 'tritanopia', Matrix3>> =
  {
    protanopia: [
      0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998,
    ],
    deuteranopia: [
      0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881,
    ],
    tritanopia: [
      1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039,
    ],
  };

const LUMA: Matrix3 = [0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722];

export const BLUR_DEVIATION = 2;

export const getVisionMatrix = (mode: VisionMode): number[] | null => {
  if (mode === 'blur') return null;
  const rows = mode === 'achromatopsia' ? LUMA : DICHROMACY_MATRICES[mode];
  const values: number[] = [];
  for (let row = 0; row < 3; row += 1) {
    values.push(rows[row * 3] ?? 0, rows[row * 3 + 1] ?? 0, rows[row * 3 + 2] ?? 0, 0, 0);
  }
  values.push(0, 0, 0, 1, 0);
  return values;
};

export const matrixToAttribute = (values: readonly number[]): string => values.join(' ');

const FILTER_ID = 'neruz-inspect-vision-filter';
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

export type AppliedVision = { remove: () => void };

export const applyVisionMode = (mode: VisionMode): AppliedVision => {
  const root = document.documentElement;
  const previousValue = root.style.getPropertyValue('filter');
  const previousPriority = root.style.getPropertyPriority('filter');

  const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';
  const filter = document.createElementNS(SVG_NAMESPACE, 'filter');
  filter.setAttribute('id', FILTER_ID);
  filter.setAttribute('color-interpolation-filters', 'linearRGB');
  const matrix = getVisionMatrix(mode);
  if (matrix) {
    const primitive = document.createElementNS(SVG_NAMESPACE, 'feColorMatrix');
    primitive.setAttribute('type', 'matrix');
    primitive.setAttribute('values', matrixToAttribute(matrix));
    filter.append(primitive);
  } else {
    const primitive = document.createElementNS(SVG_NAMESPACE, 'feGaussianBlur');
    primitive.setAttribute('stdDeviation', String(BLUR_DEVIATION));
    filter.append(primitive);
  }
  svg.append(filter);
  root.append(svg);
  root.style.setProperty('filter', `url(#${FILTER_ID})`, 'important');

  return {
    remove: () => {
      svg.remove();
      if (previousValue) root.style.setProperty('filter', previousValue, previousPriority);
      else root.style.removeProperty('filter');
    },
  };
};
