export type FontDefinition = { family: string; file: string; weight: string };

export const FONT_DIRECTORY = 'fonts';

export const INSPECT_FONTS: readonly FontDefinition[] = [
  { family: 'Neruz Sora', file: 'Sora-600.woff2', weight: '600' },
  { family: 'Neruz Sora', file: 'Sora-700.woff2', weight: '700' },
  { family: 'Neruz Inter', file: 'Inter-400.woff2', weight: '400' },
  { family: 'Neruz Inter', file: 'Inter-500.woff2', weight: '500' },
  { family: 'Neruz Inter', file: 'Inter-600.woff2', weight: '600' },
  { family: 'Neruz Mono', file: 'JetBrainsMono-400.woff2', weight: '400' },
  { family: 'Neruz Mono', file: 'JetBrainsMono-500.woff2', weight: '500' },
  { family: 'Neruz Mono', file: 'JetBrainsMono-600.woff2', weight: '600' },
];
