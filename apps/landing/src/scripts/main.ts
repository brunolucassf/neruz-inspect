import { canUseWebGl, isMotion } from './env';
import { initDomTrail } from './domTrail';
import { initHero, type HeroController } from './hero';
import { initInspectOverlay } from './inspectOverlay';
import { initLanguageMenus } from './languageMenu';
import { initStoreCta } from './storeCta';
import { initWidgets } from './widgets';
import { initWireButtons } from './wireButtons';

const SCROLL_KEY = 'ni-scroll-ratio';

function preserveScrollOnLanguageSwitch(): void {
  try {
    const stored = sessionStorage.getItem(SCROLL_KEY);
    if (stored) {
      sessionStorage.removeItem(SCROLL_KEY);
      const ratio = Number(stored);
      requestAnimationFrame(() => {
        window.scrollTo(0, ratio * (document.documentElement.scrollHeight - window.innerHeight));
      });
    }
  } catch {}
  for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-lang-link]')) {
    link.addEventListener('click', () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      try {
        sessionStorage.setItem(SCROLL_KEY, String(maxScroll > 0 ? window.scrollY / maxScroll : 0));
      } catch {}
    });
  }
}

function revealVisualsOnView(): void {
  const visuals = document.querySelectorAll<HTMLElement>('[data-viz]');
  if (!isMotion) {
    for (const visual of visuals) visual.classList.add('is-in');
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  for (const visual of visuals) observer.observe(visual);
}

function afterFirstPaint(task: () => void): void {
  const schedule = () => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(task, { timeout: 1500 });
    else setTimeout(task, 300);
  };
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
}

function loadGl(hero: HeroController): void {
  if (!canUseWebGl()) return;
  const canvas = hero.stage.querySelector<HTMLCanvasElement>('[data-gl]');
  if (!canvas) return;
  afterFirstPaint(async () => {
    try {
      const { createHeroGl } = await import('./gl/heroGl');
      document.documentElement.classList.add('has-gl');
      const isReady = await createHeroGl(canvas, hero);
      if (!isReady) {
        document.documentElement.classList.remove('has-gl');
        return;
      }
      requestAnimationFrame(() => document.documentElement.classList.add('gl-ready'));
    } catch {
      document.documentElement.classList.remove('has-gl', 'gl-ready');
    }
  });
}

function boot(): void {
  initStoreCta();
  initWireButtons();
  initLanguageMenus();
  preserveScrollOnLanguageSwitch();
  initWidgets();
  revealVisualsOnView();
  initDomTrail();
  initInspectOverlay();
  const hero = initHero();
  if (hero) loadGl(hero);
  if (isMotion) {
    afterFirstPaint(async () => {
      const { initMotion } = await import('./motion');
      initMotion();
    });
  }
}

boot();
