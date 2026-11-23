import type { ToolModule } from '../types';
import jsonViewer from './jsonViewer';
import storageViewer from './storageViewer';
import tagsPixels from './tagsPixels';
import techStack from './techStack';

const tools: readonly ToolModule[] = [techStack, tagsPixels, storageViewer, jsonViewer];

export default tools;
