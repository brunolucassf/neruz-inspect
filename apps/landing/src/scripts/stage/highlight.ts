import { DEMO_WIDTH, type InspectTarget } from '../../demo/layout';

export interface HighlightController {
  show(target: InspectTarget | null): void;
  setLocked(isLocked: boolean): void;
  relayout(): void;
}

export function createHighlight(plane: HTMLElement): HighlightController {
  const box = plane.querySelector<HTMLElement>('[data-hl]');
  const tag = plane.querySelector<HTMLElement>('[data-hl-tag]');
  const className = plane.querySelector<HTMLElement>('[data-hl-class]');
  const size = plane.querySelector<HTMLElement>('[data-hl-size]');
  const measureText = plane.querySelector<HTMLElement>('[data-hl-measure-text]');
  if (!box || !tag || !className || !size || !measureText) {
    throw new Error('Highlight markup incomplete');
  }
  let current: InspectTarget | null = null;

  const place = () => {
    if (!current || current.id === 'paper') {
      box.classList.remove('is-on');
      return;
    }
    const scale = plane.clientWidth / DEMO_WIDTH;
    const { rect } = current;
    box.style.transform = `translate(${(rect.x * scale).toFixed(1)}px, ${(rect.y * scale).toFixed(1)}px)`;
    box.style.width = `${(rect.w * scale).toFixed(1)}px`;
    box.style.height = `${(rect.h * scale).toFixed(1)}px`;
    const spacing = current.box;
    box.classList.toggle('has-box', Boolean(spacing));
    if (spacing) {
      const sides = ['t', 'r', 'b', 'l'];
      for (const [index, side] of sides.entries()) {
        box.style.setProperty(`--m${side}`, `${(spacing.margin[index] * scale).toFixed(1)}px`);
        box.style.setProperty(`--p${side}`, `${(spacing.padding[index] * scale).toFixed(1)}px`);
      }
    }
    box.classList.add('is-on');
  };

  return {
    show(target) {
      current = target;
      if (target) {
        tag.textContent = target.tag;
        className.textContent = target.className ? `.${target.className}` : '';
        size.textContent = `${target.rect.w} × ${target.rect.h}`;
        measureText.textContent = `${target.rect.w} px`;
      }
      place();
    },
    setLocked(isLocked) {
      box.classList.toggle('is-locked', isLocked);
    },
    relayout: place,
  };
}
