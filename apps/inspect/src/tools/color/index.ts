import type { ToolModule } from '../types';
import colorblind from './colorblind';
import colorTools from './colorTools';
import contrast from './contrast';
import eyedropper from './eyedropper';
import gradientShadow from './gradientShadow';
import palette from './palette';

const tools: readonly ToolModule[] = [
  eyedropper,
  palette,
  contrast,
  colorTools,
  gradientShadow,
  colorblind,
];

export default tools;
