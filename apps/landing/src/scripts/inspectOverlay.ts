interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

const LABEL_HEIGHT = 20;
const LABEL_OFFSET = 8;
const IGNORED_TAGS = new Set(['HTML', 'BODY', 'MAIN']);

function toBox(element: Element): Box {
  const rect = element.getBoundingClientRect();
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
}

function describe(element: Element): { tag: string; classes: string } {
  const tag = element.tagName.toLowerCase();
  const classes = [...element.classList]
    .slice(0, 2)
    .map((name) => `.${name}`)
    .join('');
  return { tag, classes };
}

function create(className: string): HTMLElement {
  const node = document.createElement('div');
  node.className = className;
  node.setAttribute('aria-hidden', 'true');
  return node;
}

export function initInspectOverlay(): void {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const overlay = create('ni-overlay');
  overlay.hidden = true;
  document.body.append(overlay);

  let isAltDown = false;
  let hovered: Element | null = null;
  let locked: Element | null = null;
  let pointerX = 0;
  let pointerY = 0;
  let frame = 0;

  const placeBox = (box: Box, isLocked: boolean): HTMLElement => {
    const node = create(isLocked ? 'ni-box ni-box--locked' : 'ni-box');
    node.style.cssText = `left:${box.left}px;top:${box.top}px;width:${box.width}px;height:${box.height}px`;
    return node;
  };

  const placeLabel = (element: Element, box: Box): HTMLElement => {
    const { tag, classes } = describe(element);
    const node = create('ni-label');
    node.innerHTML = '';
    const tagNode = document.createElement('b');
    tagNode.textContent = tag;
    const classNode = document.createElement('span');
    classNode.textContent = `${classes} ${Math.round(box.width)} × ${Math.round(box.height)}`;
    node.append(tagNode, classNode);
    const fitsAbove = box.top - LABEL_HEIGHT - LABEL_OFFSET >= 0;
    const top = fitsAbove ? box.top - LABEL_HEIGHT - LABEL_OFFSET : box.top + box.height + LABEL_OFFSET;
    node.style.cssText = `left:${Math.max(4, Math.min(box.left, window.innerWidth - 220))}px;top:${Math.min(top, window.innerHeight - LABEL_HEIGHT - 4)}px`;
    return node;
  };

  const placeCota = (isHorizontal: boolean, start: number, end: number, fixed: number): HTMLElement => {
    const node = create('ni-cota');
    const length = Math.abs(end - start);
    const from = Math.min(start, end);
    node.style.cssText = isHorizontal
      ? `left:${from}px;top:${fixed}px;width:${length}px;height:1px`
      : `left:${fixed}px;top:${from}px;width:1px;height:${length}px`;
    const label = document.createElement('b');
    label.textContent = String(Math.round(length));
    node.append(label);
    return node;
  };

  const drawDistances = (from: Box, to: Box, nodes: HTMLElement[]) => {
    const overlapX = Math.min(from.left + from.width, to.left + to.width) - Math.max(from.left, to.left);
    const overlapY = Math.min(from.top + from.height, to.top + to.height) - Math.max(from.top, to.top);
    if (overlapY > 0) {
      const y = Math.max(from.top, to.top) + overlapY / 2;
      const gap = to.left >= from.left + from.width ? [from.left + from.width, to.left] : [to.left + to.width, from.left];
      if (gap[1] > gap[0]) nodes.push(placeCota(true, gap[0], gap[1], y));
    }
    if (overlapX > 0) {
      const x = Math.max(from.left, to.left) + overlapX / 2;
      const gap = to.top >= from.top + from.height ? [from.top + from.height, to.top] : [to.top + to.height, from.top];
      if (gap[1] > gap[0]) nodes.push(placeCota(false, gap[0], gap[1], x));
    }
  };

  const draw = () => {
    frame = 0;
    overlay.replaceChildren();
    if (!isAltDown) {
      overlay.hidden = true;
      return;
    }
    overlay.hidden = false;
    const nodes: HTMLElement[] = [];
    if (locked?.isConnected) {
      const box = toBox(locked);
      nodes.push(placeBox(box, true));
      if (hovered && hovered !== locked) {
        const hoverBox = toBox(hovered);
        nodes.push(placeBox(hoverBox, false), placeLabel(hovered, hoverBox));
        drawDistances(box, hoverBox, nodes);
      } else nodes.push(placeLabel(locked, box));
    } else if (hovered) {
      const box = toBox(hovered);
      nodes.push(placeBox(box, false), placeLabel(hovered, box));
    }
    overlay.append(...nodes);
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(draw);
  };

  const pick = () => {
    const target = document.elementFromPoint(pointerX, pointerY);
    hovered = target && !IGNORED_TAGS.has(target.tagName) && !overlay.contains(target) ? target : null;
  };

  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Alt' || event.repeat) return;
    isAltDown = true;
    pick();
    schedule();
  });
  window.addEventListener('keyup', (event) => {
    if (event.key !== 'Alt') return;
    isAltDown = false;
    schedule();
  });
  window.addEventListener('blur', () => {
    isAltDown = false;
    schedule();
  });
  window.addEventListener(
    'pointermove',
    (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!isAltDown) return;
      pick();
      schedule();
    },
    { passive: true },
  );
  window.addEventListener(
    'click',
    (event) => {
      if (!event.altKey) return;
      event.preventDefault();
      event.stopPropagation();
      locked = locked === hovered ? null : hovered;
      schedule();
    },
    true,
  );
  window.addEventListener('scroll', schedule, { passive: true });
}
