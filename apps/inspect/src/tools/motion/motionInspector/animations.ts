import { getElementLabel, isOverlayElement } from '../../../lib/picker';

export type AnimationKind = 'css-animation' | 'css-transition' | 'web-animation';

export type AnimationInfo = {
  key: string;
  kind: AnimationKind;
  name: string;
  targetLabel: string;
  target: Element | null;
  duration: number;
  delay: number;
  iterations: number;
  easing: string;
  direction: string;
  playState: string;
  isScrollDriven: boolean;
};

export const FRAME_MS = 1000 / 60;
export const MAX_LISTED_ANIMATIONS = 60;

const getTarget = (animation: Animation): Element | null => {
  const effect = animation.effect;
  return effect instanceof KeyframeEffect ? effect.target : null;
};

export const isOwnAnimation = (animation: Animation): boolean => {
  const target = getTarget(animation);
  if (!target) return false;
  if (isOverlayElement(target)) return true;
  const root = target.getRootNode();
  return root instanceof ShadowRoot && isOverlayElement(root.host);
};

const isScrollDriven = (animation: Animation): boolean =>
  typeof ScrollTimeline !== 'undefined' && animation.timeline instanceof ScrollTimeline;

export const listPageAnimations = (): Animation[] =>
  document.getAnimations().filter((animation) => !isOwnAnimation(animation));

const kindOf = (animation: Animation): AnimationKind => {
  if (typeof CSSAnimation !== 'undefined' && animation instanceof CSSAnimation) {
    return 'css-animation';
  }
  if (typeof CSSTransition !== 'undefined' && animation instanceof CSSTransition) {
    return 'css-transition';
  }
  return 'web-animation';
};

const nameOf = (animation: Animation, kind: AnimationKind): string => {
  if (kind === 'css-animation') return (animation as CSSAnimation).animationName;
  if (kind === 'css-transition') return (animation as CSSTransition).transitionProperty;
  return animation.id || 'animate()';
};

export const describeAnimation = (animation: Animation, index: number): AnimationInfo => {
  const effect = animation.effect;
  const kind = kindOf(animation);
  const target = getTarget(animation);
  const pseudo =
    effect instanceof KeyframeEffect && effect.pseudoElement ? effect.pseudoElement : '';
  const timing = effect?.getTiming();
  const computed = effect?.getComputedTiming();
  const firstKeyframeEasing =
    effect instanceof KeyframeEffect
      ? (effect.getKeyframes()[0]?.easing as string | undefined)
      : undefined;
  const timingEasing = timing?.easing ?? 'linear';
  const easing =
    kind === 'css-animation' && timingEasing === 'linear' && firstKeyframeEasing
      ? firstKeyframeEasing
      : timingEasing;
  const durationValue = computed?.duration;
  return {
    key: `${index}:${kind}:${nameOf(animation, kind)}:${target ? getElementLabel(target) : ''}`,
    kind,
    name: nameOf(animation, kind),
    targetLabel: target ? `${getElementLabel(target)}${pseudo}` : '—',
    target,
    duration: typeof durationValue === 'number' ? durationValue : 0,
    delay: Number(timing?.delay ?? 0),
    iterations: Number(timing?.iterations ?? 1),
    easing,
    direction: timing?.direction ?? 'normal',
    playState: animation.playState,
    isScrollDriven: isScrollDriven(animation),
  };
};

export const takeSnapshot = (): AnimationInfo[] =>
  listPageAnimations()
    .slice(0, MAX_LISTED_ANIMATIONS)
    .map((animation, index) => describeAnimation(animation, index));

export const snapshotSignature = (items: readonly AnimationInfo[]): string =>
  items
    .map(
      (item) =>
        `${item.key}|${item.duration}|${item.delay}|${item.iterations}|${item.easing}|${item.playState}`,
    )
    .join('\n');

export type SpeedController = {
  setSpeed: (speed: number) => void;
  setPaused: (paused: boolean) => void;
  stepFrame: (direction: 1 | -1) => void;
  refresh: () => void;
  dispose: () => void;
};

const WATCHED_EVENTS = ['animationstart', 'transitionrun', 'transitionstart'] as const;
const POLL_MS = 200;

export const createSpeedController = (): SpeedController => {
  const originalRates = new WeakMap<Animation, number>();
  const touched = new Set<Animation>();
  const pausedByUs = new Set<Animation>();
  let speed = 1;
  let paused = false;

  const prune = (): void => {
    for (const animation of touched) if (animation.playState === 'idle') touched.delete(animation);
    for (const animation of pausedByUs)
      if (animation.playState === 'idle') pausedByUs.delete(animation);
  };

  const applyToAnimation = (animation: Animation): void => {
    if (isScrollDriven(animation)) return;
    const shouldChangeRate = speed !== 1 || originalRates.has(animation);
    if (shouldChangeRate) {
      if (!originalRates.has(animation)) originalRates.set(animation, animation.playbackRate);
      touched.add(animation);
      const wanted = (originalRates.get(animation) ?? 1) * speed;
      if (animation.playbackRate !== wanted) animation.playbackRate = wanted;
    }
    if (paused && animation.playState === 'running') {
      pausedByUs.add(animation);
      animation.pause();
    }
  };

  const refresh = (): void => {
    if (speed === 1 && !paused && touched.size === 0) return;
    for (const animation of listPageAnimations()) applyToAnimation(animation);
    prune();
  };

  const handleAnimationEvent = (): void => refresh();
  for (const type of WATCHED_EVENTS) window.addEventListener(type, handleAnimationEvent, true);
  const timer = window.setInterval(refresh, POLL_MS);

  const setSpeed = (next: number): void => {
    speed = next;
    refresh();
    if (speed === 1) {
      for (const animation of touched) {
        const original = originalRates.get(animation);
        if (original !== undefined && animation.playbackRate !== original) {
          animation.playbackRate = original;
        }
      }
      touched.clear();
    }
  };

  const setPaused = (next: boolean): void => {
    paused = next;
    if (paused) {
      for (const animation of listPageAnimations()) {
        if (animation.playState === 'running' && !isScrollDriven(animation)) {
          pausedByUs.add(animation);
          animation.pause();
        }
      }
      return;
    }
    for (const animation of pausedByUs) {
      if (animation.playState === 'paused') animation.play();
    }
    pausedByUs.clear();
  };

  const stepFrame = (direction: 1 | -1): void => {
    if (!paused) return;
    for (const animation of listPageAnimations()) {
      if (isScrollDriven(animation) || animation.playState === 'idle') continue;
      if (animation.playState === 'running') {
        pausedByUs.add(animation);
        animation.pause();
      }
      const current = Number(animation.currentTime ?? 0);
      animation.currentTime = Math.max(
        0,
        current + direction * FRAME_MS * Math.abs(animation.playbackRate),
      );
    }
  };

  const dispose = (): void => {
    window.clearInterval(timer);
    for (const type of WATCHED_EVENTS) window.removeEventListener(type, handleAnimationEvent, true);
    for (const animation of pausedByUs) {
      if (animation.playState === 'paused') animation.play();
    }
    pausedByUs.clear();
    speed = 1;
    paused = false;
    for (const animation of touched) {
      const original = originalRates.get(animation);
      if (original !== undefined) animation.playbackRate = original;
    }
    touched.clear();
  };

  return { setSpeed, setPaused, stepFrame, refresh, dispose };
};
