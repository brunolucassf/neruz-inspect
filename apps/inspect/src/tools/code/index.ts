import type { ToolModule } from '../types';
import copyComponent from './copyComponent';
import copyStyles from './copyStyles';
import designTokens from './designTokens';
import editLive from './editLive';

const tools: readonly ToolModule[] = [copyStyles, copyComponent, designTokens, editLive];

export default tools;
