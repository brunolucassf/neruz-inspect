export type MotionLibrary = { name: string; version: string | null; detail: string | null };

export type MotionProbeResult = { libraries: MotionLibrary[]; applied: string[] };

export default function motionProbe(action?: string, value?: number): MotionProbeResult {
  const win = window as unknown as Record<string | symbol, unknown>;
  const storeKey = Symbol.for('neruz.inspect.motion');
  const store = (win[storeKey] ?? {}) as Record<string, number>;
  win[storeKey] = store;

  const isObjectLike = (candidate: unknown): candidate is Record<string, unknown> =>
    candidate !== null && (typeof candidate === 'object' || typeof candidate === 'function');
  const read = (source: unknown, key: string): unknown =>
    isObjectLike(source) ? source[key] : undefined;
  const call = (source: unknown, key: string, ...args: unknown[]): unknown => {
    const method = read(source, key);
    return typeof method === 'function' ? method.apply(source, args) : undefined;
  };
  const asText = (candidate: unknown): string | null =>
    typeof candidate === 'string' || typeof candidate === 'number' ? String(candidate) : null;
  const count = (selector: string): number => document.querySelectorAll(selector).length;

  const gsap = win.gsap;
  const hasGsap = isObjectLike(gsap) && isObjectLike(read(gsap, 'globalTimeline'));
  const animeGlobal = win.anime;
  const lenisInstance = isObjectLike(win.lenis) ? win.lenis : undefined;
  const lottie = win.lottie ?? win.bodymovin;
  const applied: string[] = [];

  const GSAP_PLUGINS = [
    'ScrollTrigger',
    'ScrollSmoother',
    'ScrollToPlugin',
    'SplitText',
    'Draggable',
    'Flip',
    'MotionPathPlugin',
    'Observer',
    'CustomEase',
    'DrawSVGPlugin',
    'MorphSVGPlugin',
    'TextPlugin',
    'InertiaPlugin',
  ];

  const detect = (): MotionLibrary[] => {
    const libraries: MotionLibrary[] = [];
    if (hasGsap) {
      const registered = read(gsap, 'plugins');
      const registeredKeys = isObjectLike(registered)
        ? Object.keys(registered).map((key) => key.toLowerCase())
        : [];
      const found = GSAP_PLUGINS.filter(
        (name) => isObjectLike(win[name]) || registeredKeys.includes(name.toLowerCase()),
      ).map((name) => {
        const version = asText(read(win[name], 'version'));
        return version ? `${name} ${version}` : name;
      });
      libraries.push({
        name: 'GSAP',
        version: asText(read(gsap, 'version')),
        detail: found.length ? found.join(', ') : null,
      });
    }
    const lenisClass = win.Lenis;
    if (lenisInstance || lenisClass || document.documentElement.classList.contains('lenis')) {
      libraries.push({
        name: 'Lenis',
        version: asText(read(lenisInstance, 'version') ?? read(lenisClass, 'version')),
        detail: null,
      });
    }
    if (
      win.LocomotiveScroll ||
      document.querySelector('[data-scroll-container], .has-scroll-init')
    ) {
      libraries.push({ name: 'Locomotive Scroll', version: null, detail: null });
    }
    const threeRevision = asText(read(win.THREE, 'REVISION') ?? win.__THREE__);
    if (threeRevision)
      libraries.push({ name: 'Three.js', version: `r${threeRevision}`, detail: null });
    if (count('[data-projection-id], [data-framer-appear-id]') > 0) {
      libraries.push({ name: 'Framer Motion', version: null, detail: 'probable' });
    }
    const aosCount = count('[data-aos]');
    if (win.AOS || aosCount > 0) {
      libraries.push({
        name: 'AOS',
        version: asText(read(win.AOS, 'version')),
        detail: aosCount > 0 ? `${aosCount} elements` : null,
      });
    }
    if (animeGlobal) {
      libraries.push({
        name: 'anime.js',
        version: asText(read(animeGlobal, 'version')),
        detail: null,
      });
    }
    if (lottie || count('lottie-player, dotlottie-player, dotlottie-wc') > 0) {
      libraries.push({ name: 'Lottie', version: asText(read(lottie, 'version')), detail: null });
    }
    const swiperCount = count('.swiper, .swiper-container');
    if (win.Swiper || swiperCount > 0) {
      libraries.push({
        name: 'Swiper',
        version: asText(read(win.Swiper, 'version')),
        detail: swiperCount > 0 ? `${swiperCount} sliders` : null,
      });
    }
    return libraries;
  };

  const remember = (key: string, current: unknown): number | null => {
    if (typeof current !== 'number') return null;
    if (store[key] === undefined) store[key] = current;
    return store[key] ?? null;
  };

  const applySpeed = (factor: number): void => {
    if (hasGsap) {
      const timeline = read(gsap, 'globalTimeline');
      const saved = remember('gsapTimeScale', call(timeline, 'timeScale'));
      if (saved !== null) {
        call(timeline, 'timeScale', factor === 1 ? saved : saved * factor);
        applied.push('GSAP');
      }
    }
    if (isObjectLike(animeGlobal)) {
      const engine = read(animeGlobal, 'engine');
      const holder = typeof read(engine, 'speed') === 'number' ? engine : animeGlobal;
      const saved = remember('animeSpeed', read(holder, 'speed'));
      if (saved !== null && isObjectLike(holder)) {
        holder.speed = factor === 1 ? saved : saved * factor;
        applied.push('anime.js');
      }
    }
    const options = read(lenisInstance, 'options');
    if (isObjectLike(options)) {
      const savedLerp = remember('lenisLerp', options.lerp);
      const savedDuration = remember('lenisDuration', options.duration);
      if (savedLerp !== null)
        options.lerp = Math.min(1, factor === 1 ? savedLerp : savedLerp * factor);
      if (savedDuration !== null)
        options.duration = factor === 1 ? savedDuration : savedDuration / factor;
      if (savedLerp !== null || savedDuration !== null) applied.push('Lenis');
    }
    if (lottie && typeof read(lottie, 'setSpeed') === 'function') {
      call(lottie, 'setSpeed', factor);
      applied.push('Lottie');
    }
  };

  const applyPause = (paused: boolean): void => {
    if (hasGsap && (paused || store.gsapPaused === 1)) {
      call(read(gsap, 'globalTimeline'), paused ? 'pause' : 'resume');
      store.gsapPaused = paused ? 1 : 0;
      applied.push('GSAP');
    }
    if (lottie && (paused || store.lottiePaused === 1)) {
      call(lottie, paused ? 'pause' : 'play');
      store.lottiePaused = paused ? 1 : 0;
      applied.push('Lottie');
    }
  };

  if (action === 'speed' && typeof value === 'number' && value > 0) applySpeed(value);
  else if (action === 'pause') applyPause(true);
  else if (action === 'resume') applyPause(false);
  else if (action === 'restore') {
    applySpeed(1);
    applyPause(false);
    for (const key of Object.keys(store)) delete store[key];
  }

  return { libraries: detect(), applied: Array.from(new Set(applied)) };
}
