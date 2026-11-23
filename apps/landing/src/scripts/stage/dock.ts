import { isMotion } from '../env';

const SLIDE_MS = 280;
const SLIDE_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

export interface DockController {
  element: HTMLElement;
  open(index: number): void;
  openIndex(): number;
  setCompact(isCompact: boolean): void;
  relayout(): void;
}

function isStrip(groups: HTMLElement): boolean {
  return groups.scrollWidth > groups.clientWidth + 1;
}

export function createDock(element: HTMLElement): DockController {
  const groupsRow = element.querySelector<HTMLElement>('[data-dock-groups]');
  const indicator = element.querySelector<HTMLElement>('[data-dock-indicator]');
  const groups = [...element.querySelectorAll<HTMLElement>('[data-dock-group]')];
  if (!groupsRow || !indicator || groups.length === 0) {
    throw new Error('Dock markup incomplete');
  }
  let current = Math.max(
    0,
    groups.findIndex((group) => group.classList.contains('is-open')),
  );

  const placeIndicator = (isInstant: boolean) => {
    const target = groups[current];
    if (isInstant) indicator.style.transition = 'none';
    indicator.style.setProperty('--indicator-x', `${target.offsetLeft}px`);
    indicator.style.setProperty('--indicator-w', `${target.offsetWidth}px`);
    if (isInstant) {
      indicator.getBoundingClientRect();
      indicator.style.removeProperty('transition');
    }
    if (isStrip(groupsRow)) {
      const left = target.offsetLeft - (groupsRow.clientWidth - target.offsetWidth) / 2;
      groupsRow.scrollTo({ left, behavior: isMotion && !isInstant ? 'smooth' : 'auto' });
    }
  };

  const flipGroups = (apply: () => void) => {
    const before = groups.map((group) => group.offsetLeft);
    apply();
    if (!isMotion) return;
    groups.forEach((group, index) => {
      const delta = before[index] - group.offsetLeft;
      if (Math.abs(delta) < 0.5) return;
      group.animate([{ transform: `translateX(${delta}px)` }, { transform: 'translateX(0)' }], {
        duration: SLIDE_MS,
        easing: SLIDE_EASE,
      });
    });
  };

  const open = (index: number) => {
    if (index === current || !groups[index]) return;
    flipGroups(() => {
      groups[current].classList.remove('is-open');
      current = index;
      groups[current].classList.add('is-open');
    });
    placeIndicator(false);
  };

  const setCompact = (isCompact: boolean) => {
    if (element.classList.contains('is-compact') === isCompact) return;
    element.classList.toggle('is-compact', isCompact);
    placeIndicator(true);
  };

  placeIndicator(true);

  return {
    element,
    open,
    openIndex: () => current,
    setCompact,
    relayout: () => placeIndicator(true),
  };
}
