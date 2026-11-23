const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';

export const INTRO_TIMING = {
  highlightAt: 900,
  poseStart: 1000,
  poseEnd: 1600,
};

export interface IntroParts {
  dock: HTMLElement;
  groups: HTMLElement[];
  indicator: HTMLElement;
  panel: HTMLElement;
  laminas: HTMLElement[];
}

function reveal(element: HTMLElement, from: Keyframe, delay: number, duration: number): Animation {
  const neutral: Keyframe = {
    opacity: 1,
    translate: '0 0',
    scale: '1',
    clipPath: 'inset(0 0 0 0%)',
  };
  const to = Object.fromEntries(Object.keys(from).map((key) => [key, neutral[key]])) as Keyframe;
  return element.animate([from, to], {
    delay,
    duration,
    easing: EASE_OUT,
    fill: 'backwards',
  });
}

export function runIntroReveal(parts: IntroParts): Animation[] {
  const animations = [
    reveal(parts.dock, { opacity: 0, translate: '0 12px' }, 100, 360),
    reveal(parts.indicator, { opacity: 0, scale: '0.95' }, 420, 240),
    reveal(parts.panel, { clipPath: 'inset(0 0 0 100%)' }, 520, 320),
  ];
  parts.groups.forEach((group, index) => {
    animations.push(reveal(group, { opacity: 0, translate: '0 6px' }, 180 + index * 24, 240));
  });
  parts.laminas.forEach((lamina, index) => {
    animations.push(reveal(lamina, { opacity: 0, translate: '0 8px' }, 640 + index * 50, 280));
  });
  return animations;
}
