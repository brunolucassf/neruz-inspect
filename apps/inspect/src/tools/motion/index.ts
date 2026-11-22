import type { ToolModule } from '../types';
import motionInspector from './motionInspector';
import pageToggles from './pageToggles';

const tools: readonly ToolModule[] = [motionInspector, pageToggles];

export default tools;
