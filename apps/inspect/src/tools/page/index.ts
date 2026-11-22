import type { ToolModule } from '../types';
import a11y from './a11y';
import assets from './assets';
import icons from './icons';
import links from './links';
import robotsSitemap from './robotsSitemap';
import seoMeta from './seoMeta';
import structuredData from './structuredData';
import vitals from './vitals';

const tools: readonly ToolModule[] = [
  seoMeta,
  structuredData,
  robotsSitemap,
  links,
  assets,
  icons,
  vitals,
  a11y,
];

export default tools;
