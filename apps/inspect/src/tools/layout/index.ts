import type { ToolModule } from '../types';
import boxModel from './boxModel';
import breakpoints from './breakpoints';
import gridFlex from './gridFlex';
import outlines from './outlines';
import overflow from './overflow';
import ruler from './ruler';
import zIndex from './zIndex';

const tools: readonly ToolModule[] = [
  ruler,
  boxModel,
  gridFlex,
  overflow,
  zIndex,
  breakpoints,
  outlines,
];

export default tools;
