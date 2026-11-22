import {
  blockAt,
  DEMO_HEIGHT,
  DEMO_LENS_LABELS,
  DEMO_RECTS,
  DEMO_TOUR,
  DEMO_WIDTH,
  rectCenter,
} from '../demo/layout';
import { clamp, isMotion } from './env';
import { createSpring, snapSpring, stepSpring } from './spring';

export interface Point {
  x: number;
  y: number;
}

export interface Surface {
  toDesign(stageX: number, stageY: number): Point | null;
  fromDesign(designX: number, designY: number): Point | null;
}

export interface LensState {
  x: number;
  y: number;
  radius: number;
  on: boolean;
  scan: number;
}

export interface HeroController {
  stage: HTMLElement;
  setSurface(surface: Surface): void;
  onChange(listener: (state: LensState) => void): void;
  pointerRatio(): Point;
  isVisible(): boolean;
}

const IDLE_MS = 2000;
const TOUR_STEP_MS = 1900;
const SCAN_MS = 700;
const SCAN_HOLD_MS = 300;

function easeOutCubic(value: number): number {
  return 1 - (1 - value) ** 3;
}

export function initHero(): HeroController | null {
  const stage = document.querySelector<HTMLElement>('[data-stage]');
  const page = stage?.querySelector<HTMLElement>('[data-page]');
  const lens = stage?.querySelector<HTMLElement>('[data-lens]');
  const label = stage?.querySelector<HTMLElement>('[data-lens-label]');
  const skip = stage?.querySelector<HTMLButtonElement>('[data-skip-intro]');
  if (!stage || !page || !lens || !label) return null;

  const root = document.documentElement;
  const springX = createSpring(0);
  const springY = createSpring(0);
  const listeners: ((state: LensState) => void)[] = [];
  const pointer: Point = { x: 0.5, y: 0.5 };
  const state: LensState = { x: 0, y: 0, radius: 100, on: false, scan: -1 };

  let stageRect = stage.getBoundingClientRect();
  let pageRect = page.getBoundingClientRect();
  let isVisible = true;
  let isRunning = false;
  let lastFrame = 0;
  let lastInput = performance.now();
  let tourIndex = 0;
  let nextTourAt = Number.POSITIVE_INFINITY;
  let isPlayingIntro = false;
  let hasPointer = false;

  const htmlSurface: Surface = {
    toDesign(stageX, stageY) {
      const scale = DEMO_WIDTH / pageRect.width;
      const x = (stageX - (pageRect.left - stageRect.left)) * scale;
      const y = (stageY - (pageRect.top - stageRect.top)) * scale;
      if (x < 0 || y < 0 || x > DEMO_WIDTH || y > DEMO_HEIGHT) return null;
      return { x, y };
    },
    fromDesign(designX, designY) {
      const scale = pageRect.width / DEMO_WIDTH;
      return {
        x: pageRect.left - stageRect.left + designX * scale,
        y: pageRect.top - stageRect.top + designY * scale,
      };
    },
  };
  let surface: Surface = htmlSurface;

  const measure = () => {
    stageRect = stage.getBoundingClientRect();
    pageRect = page.getBoundingClientRect();
    state.radius = Math.min(parseFloat(getComputedStyle(stage).getPropertyValue('--lr')) || 100, stageRect.width * 0.2);
    stage.style.setProperty('--lr', `${state.radius}px`);
  };

  const render = () => {
    state.x = springX.value;
    state.y = springY.value;
    const pageLeft = pageRect.left - stageRect.left;
    const pageTop = pageRect.top - stageRect.top;
    stage.style.setProperty('--sx', `${state.x.toFixed(1)}px`);
    stage.style.setProperty('--sy', `${state.y.toFixed(1)}px`);
    stage.style.setProperty('--px', `${(state.x - pageLeft).toFixed(1)}px`);
    stage.style.setProperty('--py', `${(state.y - pageTop).toFixed(1)}px`);
    const design = surface.toDesign(state.x, state.y);
    const block = design ? blockAt(design.x, design.y) : null;
    const text = block ? (DEMO_LENS_LABELS[block] ?? '') : '';
    if (label.textContent !== text) label.textContent = text;
    label.hidden = text === '';
    const halfLabel = label.offsetWidth / 2;
    const shift = clamp(state.x, halfLabel + 4, stageRect.width - halfLabel - 4) - state.x;
    label.style.setProperty('--label-shift', `${shift.toFixed(0)}px`);
    for (const listener of listeners) listener(state);
  };

  const tourTarget = (): Point | null => {
    const block = DEMO_TOUR[tourIndex % DEMO_TOUR.length];
    const center = rectCenter(DEMO_RECTS[block]);
    return surface.fromDesign(center.x, center.y);
  };

  const frame = (now: number) => {
    const delta = Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;
    if (!isMotion) {
      snapSpring(springX, springX.target);
      snapSpring(springY, springY.target);
    }
    const movingX = isMotion ? stepSpring(springX, delta) : false;
    const movingY = isMotion ? stepSpring(springY, delta) : false;
    if (!hasPointer && !isPlayingIntro && isMotion && now - lastInput > IDLE_MS && now >= nextTourAt) {
      const target = tourTarget();
      if (target) {
        springX.target = target.x;
        springY.target = target.y;
      }
      tourIndex += 1;
      nextTourAt = now + TOUR_STEP_MS;
    }
    render();
    const isTouring = !hasPointer && isMotion && Number.isFinite(nextTourAt);
    if ((movingX || movingY || isPlayingIntro || isTouring) && isVisible) requestAnimationFrame(frame);
    else isRunning = false;
  };

  const wake = () => {
    if (isRunning || !isVisible) return;
    isRunning = true;
    lastFrame = performance.now();
    requestAnimationFrame(frame);
  };

  const setTarget = (clientX: number, clientY: number) => {
    const x = clamp(clientX - stageRect.left, 0, stageRect.width);
    const y = clamp(clientY - stageRect.top, 0, stageRect.height);
    springX.target = x;
    springY.target = y;
    pointer.x = x / stageRect.width;
    pointer.y = y / stageRect.height;
    if (!isMotion) {
      snapSpring(springX, x);
      snapSpring(springY, y);
    }
  };

  const showLens = () => {
    lens.classList.add('is-on');
    state.on = true;
  };

  const finishIntro = () => {
    isPlayingIntro = false;
    state.scan = -1;
    stage.classList.remove('stage--scan');
    stage.style.removeProperty('--scan-y');
    if (skip) skip.hidden = true;
    showLens();
    nextTourAt = performance.now();
    lastInput = performance.now() - IDLE_MS;
    wake();
  };

  const playIntro = () => {
    isPlayingIntro = true;
    try {
      sessionStorage.setItem('ni-intro', '1');
    } catch {}
    if (skip) {
      skip.hidden = false;
      skip.addEventListener('click', finishIntro, { once: true });
    }
    window.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Escape' && isPlayingIntro) finishIntro();
      },
      { once: true },
    );
    stage.classList.add('stage--scan');
    const started = performance.now();
    const tick = (now: number) => {
      if (!isPlayingIntro) return;
      const elapsed = now - started;
      const progress = clamp(elapsed / SCAN_MS, 0, 1);
      state.scan = easeOutCubic(progress);
      stage.style.setProperty('--scan-y', `${(state.scan * 100).toFixed(2)}%`);
      if (elapsed >= SCAN_MS + SCAN_HOLD_MS) {
        finishIntro();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    wake();
  };

  measure();
  new ResizeObserver(() => {
    measure();
    if (!hasPointer) {
      const target = tourTarget();
      if (target && !Number.isFinite(nextTourAt)) {
        snapSpring(springX, target.x);
        snapSpring(springY, target.y);
      }
    }
    render();
  }).observe(stage);
  window.addEventListener('scroll', () => {
    stageRect = stage.getBoundingClientRect();
    pageRect = page.getBoundingClientRect();
  }, { passive: true });

  new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible) wake();
  }).observe(stage);

  const start = htmlSurface.fromDesign(
    rectCenter(DEMO_RECTS.title).x,
    rectCenter(DEMO_RECTS.title).y,
  );
  if (start) {
    snapSpring(springX, start.x);
    snapSpring(springY, start.y);
  }

  const onPointer = (event: PointerEvent) => {
    stageRect = stage.getBoundingClientRect();
    pageRect = page.getBoundingClientRect();
    hasPointer = true;
    lastInput = performance.now();
    nextTourAt = Number.POSITIVE_INFINITY;
    stage.classList.remove('stage--split');
    if (!state.on && !isPlayingIntro) showLens();
    setTarget(event.clientX, event.clientY);
    wake();
  };
  stage.addEventListener('pointermove', onPointer);
  stage.addEventListener('pointerdown', onPointer);
  const release = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') return;
    hasPointer = false;
    lastInput = performance.now();
    nextTourAt = performance.now() + IDLE_MS;
    wake();
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  stage.addEventListener('pointerleave', (event) => {
    if (event.pointerType !== 'mouse') return;
    hasPointer = false;
    lastInput = performance.now();
    nextTourAt = performance.now() + IDLE_MS;
    wake();
  });

  if (!isMotion) {
    stage.classList.add('stage--split');
    lens.classList.remove('is-on');
    render();
  } else if (root.classList.contains('is-intro')) {
    playIntro();
  } else {
    showLens();
    nextTourAt = performance.now() + IDLE_MS;
    wake();
  }
  render();

  return {
    stage,
    setSurface(next) {
      surface = next;
      render();
    },
    onChange(listener) {
      listeners.push(listener);
    },
    pointerRatio: () => pointer,
    isVisible: () => isVisible,
  };
}
