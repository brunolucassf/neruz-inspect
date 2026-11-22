export const DEMO_WIDTH = 960;
export const DEMO_HEIGHT = 640;

export const DEMO_COLORS = {
  paper: '#EEF0E6',
  ink: '#1C2620',
  clay: '#B4582F',
  moss: '#6F8A5B',
  onClay: '#FFFFFF',
} as const;

export interface DemoRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const DEMO_RECTS = {
  nav: { x: 0, y: 0, w: 960, h: 60 },
  brand: { x: 40, y: 16, w: 78, h: 30 },
  links: { x: 600, y: 18, w: 320, h: 26 },
  title: { x: 48, y: 108, w: 560, h: 180 },
  text: { x: 48, y: 312, w: 440, h: 58 },
  button: { x: 48, y: 398, w: 176, h: 52 },
  swatches: { x: 48, y: 486, w: 240, h: 92 },
  art: { x: 628, y: 100, w: 292, h: 440 },
} satisfies Record<string, DemoRect>;

export type DemoBlockId = keyof typeof DEMO_RECTS;

export const DEMO_SWATCHES = [
  { hex: '#B4582F', key: 'clay' },
  { hex: '#6F8A5B', key: 'moss' },
  { hex: '#1C2620', key: 'ink' },
] as const;

export const DEMO_LENS_LABELS: Partial<Record<DemoBlockId, string>> = {
  nav: 'nav · 960 × 60',
  brand: 'a.brand · Fraunces 600 · 24/30',
  links: 'ul.nav · Inter 500 · 15/24',
  title: 'h1 · Fraunces 600 · 54/58',
  text: 'p · Inter 400 · 17/26',
  button: 'a.btn · #B4582F · 4,8:1 AA',
  swatches: 'ul.palette · 3 cores',
  art: 'div.art · 292 × 440',
};

export const DEMO_TOUR: DemoBlockId[] = ['title', 'swatches', 'button', 'text'];

export function rectCenter(rect: DemoRect): { x: number; y: number } {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

export function blockAt(x: number, y: number): DemoBlockId | null {
  const order: DemoBlockId[] = [
    'button',
    'title',
    'text',
    'swatches',
    'art',
    'brand',
    'links',
    'nav',
  ];
  for (const id of order) {
    const rect = DEMO_RECTS[id];
    if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) return id;
  }
  return null;
}
