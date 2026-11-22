import type { ToolModule } from '../types';
import fontHover from './fontHover';
import fontList from './fontList';
import fontSwap from './fontSwap';
import typeScale from './typeScale';

const tools: readonly ToolModule[] = [fontHover, fontList, fontSwap, typeScale];

export default tools;
