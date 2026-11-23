import type { ToolModule } from '../types';
import clipboardHistory from './clipboardHistory';
import formFill from './formFill';
import lorem from './lorem';
import qrCode from './qrCode';
import units from './units';

const tools: readonly ToolModule[] = [units, lorem, formFill, qrCode, clipboardHistory];

export default tools;
