import { type Color, toHex } from '../../../lib/color';

const CELLS = 11;
const CELL_SIZE = 12;
const LOUPE_SIZE = CELLS * CELL_SIZE;
const CURSOR_GAP = 18;
const HOST_TAG = 'neruz-loupe';

export type LoupeOptions = {
  dataUrl: string;
  hint: string;
  onPick: (color: Color) => void;
  onCancel: () => void;
};

const loadImage = (dataUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('capture could not be decoded'));
    image.src = dataUrl;
  });

const element = <TTag extends keyof HTMLElementTagNameMap>(
  tag: TTag,
  css: string,
): HTMLElementTagNameMap[TTag] => {
  const created = document.createElement(tag);
  created.style.cssText = css;
  return created;
};

export const openLoupe = async ({
  dataUrl,
  hint,
  onPick,
  onCancel,
}: LoupeOptions): Promise<() => void> => {
  const image = await loadImage(dataUrl);
  const source = document.createElement('canvas');
  source.width = image.naturalWidth;
  source.height = image.naturalHeight;
  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  if (!sourceContext) throw new Error('canvas is not available');
  sourceContext.drawImage(image, 0, 0);
  const scale = image.naturalWidth / window.innerWidth;

  const host = document.createElement(HOST_TAG);
  host.style.cssText =
    'all:initial;position:fixed;inset:0;z-index:2147483647;cursor:crosshair;display:block;';
  const shadow = host.attachShadow({ mode: 'closed' });
  const frame = element(
    'div',
    'position:fixed;left:0;top:0;display:none;width:132px;pointer-events:none;will-change:transform;font:600 12px/16px ui-monospace,Consolas,monospace;',
  );
  const canvas = element(
    'canvas',
    `display:block;width:${LOUPE_SIZE}px;height:${LOUPE_SIZE}px;image-rendering:pixelated;border:1px solid #f4f8fc;box-shadow:0 0 0 1px #080d14,0 8px 24px rgba(0,0,0,.5);box-sizing:content-box;margin:-1px;`,
  );
  canvas.width = LOUPE_SIZE;
  canvas.height = LOUPE_SIZE;
  const readout = element(
    'div',
    'margin-top:6px;padding:2px 6px;color:#f4f8fc;background:#080d14;border:1px solid #64798f;border-radius:2px;text-align:center;',
  );
  const tip = element(
    'div',
    'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);padding:6px 12px;color:#f4f8fc;background:#080d14;border:1px solid #ff4fd0;border-radius:2px;font:500 12px/16px system-ui,sans-serif;pointer-events:none;',
  );
  tip.textContent = hint;
  frame.append(canvas, readout);
  shadow.append(frame, tip);

  const context = canvas.getContext('2d');
  const half = Math.floor(CELLS / 2);
  let frameId = 0;
  let lastX = 0;
  let lastY = 0;

  const readPixel = (x: number, y: number): Color => {
    const data = sourceContext.getImageData(
      Math.min(source.width - 1, Math.max(0, Math.round(x * scale))),
      Math.min(source.height - 1, Math.max(0, Math.round(y * scale))),
      1,
      1,
    ).data;
    return { r: data[0] ?? 0, g: data[1] ?? 0, b: data[2] ?? 0, a: 1 };
  };

  const draw = (): void => {
    frameId = 0;
    if (!context) return;
    const centerX = Math.round(lastX * scale);
    const centerY = Math.round(lastY * scale);
    const grid = sourceContext.getImageData(centerX - half, centerY - half, CELLS, CELLS).data;
    for (let row = 0; row < CELLS; row += 1) {
      for (let column = 0; column < CELLS; column += 1) {
        const offset = (row * CELLS + column) * 4;
        context.fillStyle = `rgb(${grid[offset]},${grid[offset + 1]},${grid[offset + 2]})`;
        context.fillRect(column * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
    const centerStart = half * CELL_SIZE;
    context.lineWidth = 2;
    context.strokeStyle = '#080d14';
    context.strokeRect(centerStart, centerStart, CELL_SIZE, CELL_SIZE);
    context.lineWidth = 1;
    context.strokeStyle = '#ffffff';
    context.strokeRect(centerStart + 1, centerStart + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    readout.textContent = toHex(readPixel(lastX, lastY)).toUpperCase();
    const flipX = lastX + CURSOR_GAP + LOUPE_SIZE > window.innerWidth;
    const flipY = lastY + CURSOR_GAP + LOUPE_SIZE + 30 > window.innerHeight;
    const left = flipX ? lastX - CURSOR_GAP - LOUPE_SIZE : lastX + CURSOR_GAP;
    const top = flipY ? lastY - CURSOR_GAP - LOUPE_SIZE - 30 : lastY + CURSOR_GAP;
    frame.style.transform = `translate(${left}px, ${top}px)`;
    frame.style.display = 'block';
  };

  const handleMove = (event: PointerEvent): void => {
    lastX = event.clientX;
    lastY = event.clientY;
    if (!frameId) frameId = requestAnimationFrame(draw);
  };

  const destroy = (): void => {
    cancelAnimationFrame(frameId);
    window.removeEventListener('keydown', handleKey, true);
    window.removeEventListener('resize', handleCancel);
    host.remove();
  };

  function handleCancel(): void {
    destroy();
    onCancel();
  }

  function handleKey(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    handleCancel();
  }

  host.addEventListener('pointermove', handleMove);
  host.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const color = readPixel(event.clientX, event.clientY);
    destroy();
    onPick(color);
  });
  host.addEventListener('wheel', (event) => event.preventDefault(), { passive: false });
  host.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    handleCancel();
  });
  window.addEventListener('keydown', handleKey, true);
  window.addEventListener('resize', handleCancel);
  document.documentElement.append(host);
  return destroy;
};
