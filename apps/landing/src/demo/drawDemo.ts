import {
  DEMO_COLORS,
  DEMO_HEIGHT,
  DEMO_RECTS,
  DEMO_SWATCHES,
  DEMO_WIDTH,
  type DemoRect,
} from './layout';

export interface DemoTexts {
  nav: string[];
  title: string;
  text: string;
  button: string;
}

const SERIF = '"Fraunces", "Iowan Old Style", Georgia, serif';
const SANS = '"Inter", system-ui, sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, Consolas, monospace';
const MAGENTA = '#FF4FD0';
const NIGHT = '#080D14';

export function readDemoTexts(stage: ParentNode): DemoTexts {
  const root = stage.querySelector('.demo') ?? stage;
  const read = (selector: string) => root.querySelector(selector)?.textContent?.trim() ?? '';
  return {
    nav: [...root.querySelectorAll('.demo__links li')].map(
      (item) => item.textContent?.trim() ?? '',
    ),
    title: read('.demo__title'),
    text: read('.demo__text'),
    button: read('.demo__button'),
  };
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of text.split(/\s+/)) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else current = candidate;
  }
  if (current) lines.push(current);
  return lines;
}

function drawLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
): void {
  for (const [index, line] of lines.entries()) ctx.fillText(line, x, y + index * lineHeight);
}

function roundedPath(ctx: CanvasRenderingContext2D, rect: DemoRect, radius: number): void {
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, radius);
}

function drawFinished(ctx: CanvasRenderingContext2D, texts: DemoTexts): void {
  ctx.fillStyle = DEMO_COLORS.paper;
  ctx.fillRect(0, 0, DEMO_WIDTH, DEMO_HEIGHT);

  ctx.fillStyle = '#E3E7D8';
  ctx.fillRect(0, 0, DEMO_WIDTH, DEMO_RECTS.nav.h);
  ctx.fillStyle = '#C9CFBA';
  ctx.fillRect(0, DEMO_RECTS.nav.h - 1, DEMO_WIDTH, 1);

  ctx.fillStyle = DEMO_COLORS.ink;
  ctx.textBaseline = 'alphabetic';
  ctx.font = `600 24px ${SERIF}`;
  ctx.fillText('Maré', DEMO_RECTS.brand.x, DEMO_RECTS.brand.y + 24);

  ctx.font = `500 15px ${SANS}`;
  const links = DEMO_RECTS.links;
  const widths = texts.nav.map((item) => ctx.measureText(item).width);
  const gap =
    (links.w - widths.reduce((sum, width) => sum + width, 0)) / Math.max(1, texts.nav.length - 1);
  let cursor = links.x;
  texts.nav.forEach((item, index) => {
    ctx.fillText(item, cursor, links.y + 19);
    cursor += widths[index] + gap;
  });

  ctx.font = `600 54px ${SERIF}`;
  drawLines(
    ctx,
    wrapLines(ctx, texts.title, DEMO_RECTS.title.w),
    DEMO_RECTS.title.x,
    DEMO_RECTS.title.y + 44,
    58,
  );

  ctx.font = `400 17px ${SANS}`;
  drawLines(
    ctx,
    wrapLines(ctx, texts.text, DEMO_RECTS.text.w),
    DEMO_RECTS.text.x,
    DEMO_RECTS.text.y + 19,
    26,
  );

  ctx.fillStyle = DEMO_COLORS.clay;
  roundedPath(ctx, DEMO_RECTS.button, 6);
  ctx.fill();
  ctx.fillStyle = DEMO_COLORS.onClay;
  ctx.font = `600 17px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.fillText(
    texts.button,
    DEMO_RECTS.button.x + DEMO_RECTS.button.w / 2,
    DEMO_RECTS.button.y + 32,
  );
  ctx.textAlign = 'left';

  const chipSize = 64;
  const colors = [DEMO_COLORS.clay, DEMO_COLORS.moss, DEMO_COLORS.ink];
  colors.forEach((color, index) => {
    ctx.fillStyle = color;
    roundedPath(
      ctx,
      {
        x: DEMO_RECTS.swatches.x + index * (chipSize + 24),
        y: DEMO_RECTS.swatches.y,
        w: chipSize,
        h: chipSize,
      },
      5,
    );
    ctx.fill();
  });

  const art = DEMO_RECTS.art;
  ctx.save();
  roundedPath(ctx, art, 6);
  ctx.clip();
  ctx.translate(art.x, art.y);
  ctx.fillStyle = '#DDE3D0';
  ctx.fillRect(0, 0, art.w, art.h);
  ctx.fillStyle = 'rgba(28,38,32,.14)';
  ctx.beginPath();
  ctx.ellipse(146, 392, 96, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = DEMO_COLORS.clay;
  ctx.fill(
    new Path2D(
      'M118 96h56v34c44 22 64 62 64 112 0 56-34 100-92 100s-92-44-92-100c0-50 20-90 64-112Z',
    ),
  );
  ctx.strokeStyle = DEMO_COLORS.paper;
  ctx.lineWidth = 4;
  ctx.stroke(new Path2D('M96 252c28 14 72 14 100 0'));
  ctx.fillStyle = DEMO_COLORS.moss;
  ctx.beginPath();
  ctx.arc(146, 300, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function hatch(ctx: CanvasRenderingContext2D, rect: DemoRect): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,79,208,.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let offset = -rect.h; offset < rect.w; offset += 7) {
    ctx.moveTo(rect.x + offset, rect.y + rect.h);
    ctx.lineTo(rect.x + offset + rect.h, rect.y);
  }
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = MAGENTA;
  ctx.lineWidth = 1;
  ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
}

function tag(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  background: string,
  color: string,
  bold = false,
): void {
  ctx.font = `${bold ? 600 : 400} 11px ${MONO}`;
  const width = ctx.measureText(text).width + 10;
  ctx.fillStyle = background;
  ctx.fillRect(x, y, width, 16);
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 5, y + 8.5);
  ctx.textBaseline = 'alphabetic';
}

function drawProofOverlay(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(8,13,20,.06)';
  ctx.fillRect(0, 0, DEMO_WIDTH, DEMO_HEIGHT);
  const hatched: DemoRect[] = [
    DEMO_RECTS.nav,
    DEMO_RECTS.brand,
    DEMO_RECTS.links,
    DEMO_RECTS.title,
    DEMO_RECTS.text,
    DEMO_RECTS.button,
    DEMO_RECTS.art,
  ];
  for (const rect of hatched) hatch(ctx, rect);
  ctx.strokeStyle = MAGENTA;
  ctx.lineWidth = 1;
  ctx.strokeRect(
    DEMO_RECTS.swatches.x + 0.5,
    DEMO_RECTS.swatches.y + 0.5,
    DEMO_RECTS.swatches.w - 1,
    63,
  );

  DEMO_SWATCHES.forEach((swatch, index) => {
    tag(
      ctx,
      swatch.hex,
      DEMO_RECTS.swatches.x + index * 88,
      DEMO_RECTS.swatches.y + 72,
      NIGHT,
      '#F4F8FC',
    );
  });

  const cotas: { x: number; y: number; w: number; h: number; label: string }[] = [
    { x: 300, y: 288, w: 0, h: 24, label: '24' },
    { x: 300, y: 370, w: 0, h: 28, label: '28' },
    { x: 0, y: 424, w: 48, h: 0, label: '48' },
  ];
  ctx.strokeStyle = MAGENTA;
  cotas.forEach((cota) => {
    ctx.beginPath();
    ctx.moveTo(cota.x, cota.y);
    ctx.lineTo(cota.x + cota.w, cota.y + cota.h);
    ctx.stroke();
    const labelWidth = ctx.measureText(cota.label).width + 10;
    tag(
      ctx,
      cota.label,
      cota.x + cota.w / 2 - labelWidth / 2 + 2,
      cota.y + cota.h / 2 - 8,
      MAGENTA,
      NIGHT,
      true,
    );
  });

  tag(ctx, 'Fraunces 600 · 54/58', 48, 84, NIGHT, MAGENTA);
  tag(
    ctx,
    '560 × 180',
    DEMO_RECTS.title.x + DEMO_RECTS.title.w - 76,
    DEMO_RECTS.title.y + DEMO_RECTS.title.h + 4,
    NIGHT,
    '#A6B5C5',
  );
}

export function drawDemoTexture(
  canvas: HTMLCanvasElement,
  texts: DemoTexts,
  proof: boolean,
  scale: number,
): void {
  canvas.width = DEMO_WIDTH * scale;
  canvas.height = DEMO_HEIGHT * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(scale, scale);
  drawFinished(ctx, texts);
  if (proof) drawProofOverlay(ctx);
}
