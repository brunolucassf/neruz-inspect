import { initDomTrail } from './domTrail';
import { canUseWebGl, isMotion } from './env';
import { initFamily } from './family';
import { initInspectOverlay } from './inspectOverlay';
import { initLanguageMenus } from './languageMenu';
import { createDock } from './stage/dock';
import { initStage, type StageController } from './stage/rig';
import { initScenes } from './stage/scenes';
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

function afterFirstPaint(task: () => void): void {
  const schedule = () => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(task, { timeout: 1500 });
    else setTimeout(task, 300);
  };
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
}

function loadBench(stage: StageController): void {
  const canvas = stage.stage.querySelector<HTMLCanvasElement>('[data-bench-gl]');
  if (!canvas || stage.mode() !== 'sticky' || !canUseWebGl()) return;
  afterFirstPaint(async () => {
    try {
      const { createBench } = await import('./gl/benchGl');
      if (createBench(canvas, stage)) stage.stage.classList.add('has-bench');
    } catch {
      stage.stage.classList.remove('has-bench');
    }
  });
}

function boot(): void {
  initStoreCta();
  initWireButtons();
  initLanguageMenus();
  preserveScrollOnLanguageSwitch();
  initWidgets();
  initDomTrail();
  initFamily();
  initInspectOverlay();
  const stage = initStage();
  initScenes(stage);
  if (!isMotion) {
    for (const dock of document.querySelectorAll<HTMLElement>('[data-explode-mini] [data-dock]')) {
      createDock(dock);
    }
  }
  if (stage) loadBench(stage);
  if (isMotion) {
    afterFirstPaint(async () => {
      const [{ initMotion }, { initJourney }] = await Promise.all([
        import('./motion'),
        import('./stage/journey'),
      ]);
      initMotion();
      initJourney(stage);
    });
  }
}

boot();
