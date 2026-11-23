import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ToolId } from '../../demo/layout';
import { HERO_POSE, SCENES, type ScenePose } from '../../demo/scenes';
import { clamp, lerp, rampProgress } from '../env';
import { createDock } from './dock';
import type { StageController } from './rig';

gsap.registerPlugin(ScrollTrigger);

const SCRUB = 0.6;
const POSE_SPAN = 0.6;

function smooth(value: number): number {
  const clamped = clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

function bindStageScenes(section: HTMLElement, stage: StageController): () => void {
  const proxy = { enter: 0, explode: 0 };
  const push = () => stage.setScene(proxy.enter, proxy.explode);
  const enterTween = gsap.to(proxy, {
    enter: 1,
    ease: 'none',
    onUpdate: push,
    scrollTrigger: { trigger: section, start: 'top bottom', end: 'top top', scrub: SCRUB },
  });
  const explodeTween = gsap.to(proxy, {
    explode: 1,
    ease: 'none',
    onUpdate: push,
    scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: SCRUB },
  });
  return () => {
    enterTween.scrollTrigger?.kill();
    explodeTween.scrollTrigger?.kill();
    enterTween.kill();
    explodeTween.kill();
    stage.setScene(0, 0);
  };
}

function mixPose(from: ScenePose, to: ScenePose, amount: number): ScenePose {
  return {
    rx: lerp(from.rx, to.rx, amount),
    ry: lerp(from.ry, to.ry, amount),
    zoom: lerp(from.zoom, to.zoom, amount),
  };
}

function bindScenes(stage: StageController): () => void {
  const wrapper = document.querySelector<HTMLElement>('[data-scenes]');
  const sections = [...document.querySelectorAll<HTMLElement>('[data-scene]')];
  if (!wrapper || sections.length === 0) return () => {};
  const poses = sections.map((section) => SCENES[section.dataset.scene ?? '']?.pose ?? HERO_POSE);
  let arrivals: number[] = [];
  const measure = () => {
    arrivals = sections.map(
      (section) => section.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.5,
    );
  };
  const poseAt = (scrollY: number): ScenePose => {
    const span = window.innerHeight * POSE_SPAN;
    let pose = HERO_POSE;
    arrivals.forEach((arrival, index) => {
      const amount = smooth((scrollY - (arrival - span)) / span);
      if (amount > 0)
        pose = mixPose(index === 0 ? HERO_POSE : poses[index - 1], poses[index], amount);
    });
    return pose;
  };
  const proxy = { progress: 0 };
  let poseTrigger: ScrollTrigger | undefined;
  const poseTween = gsap.to(proxy, {
    progress: 1,
    ease: 'none',
    onUpdate: () => {
      if (poseTrigger)
        stage.setPose(poseAt(lerp(poseTrigger.start, poseTrigger.end, proxy.progress)));
    },
    scrollTrigger: {
      trigger: wrapper,
      start: 'top bottom',
      end: 'bottom top',
      scrub: SCRUB,
      onRefresh: measure,
    },
  });
  const toggles = sections.map((section, index) =>
    ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => {
        if (self.isActive) {
          stage.showScene(section.dataset.scene ?? null);
          const pressed = section.querySelector<HTMLElement>(
            '[data-scene-tool][aria-pressed="true"]',
          );
          const tool = pressed?.dataset.sceneTool as ToolId | undefined;
          if (tool && tool !== SCENES[section.dataset.scene ?? '']?.tool) stage.pinTool(tool);
        } else if (index === 0 && self.direction < 0) {
          stage.showScene(null);
        }
      },
    }),
  );
  poseTrigger = poseTween.scrollTrigger;
  measure();
  return () => {
    poseTween.scrollTrigger?.kill();
    poseTween.kill();
    for (const toggle of toggles) toggle.kill();
    stage.showScene(null);
    stage.setPose(HERO_POSE);
  };
}

function bindMiniScene(section: HTMLElement): () => void {
  const track = section.querySelector<HTMLElement>('[data-explode-mini-track]');
  const mini = section.querySelector<HTMLElement>('[data-explode-mini]');
  const dockElement = mini?.querySelector<HTMLElement>('[data-dock]');
  if (!track || !mini || !dockElement) return () => {};
  const dock = createDock(dockElement);
  const labels = [...section.querySelectorAll<HTMLElement>('[data-explode-label]')];
  const layers = [...mini.querySelectorAll<HTMLElement>('[data-layer]')].filter(
    (layer) => getComputedStyle(layer).display !== 'none',
  );
  let activeIndex = -1;
  const render = (progress: number) => {
    mini.style.setProperty('--spread', smooth(rampProgress(progress, 0, 0.3)).toFixed(4));
    const index = Math.min(
      layers.length - 1,
      Math.floor(rampProgress(progress, 0.3, 1) * layers.length),
    );
    if (index === activeIndex) return;
    activeIndex = index;
    const group = Number(layers[index]?.dataset.layer ?? 0);
    for (const layer of layers) layer.classList.toggle('is-active', layer === layers[index]);
    for (const label of labels) {
      label.classList.toggle('is-active', Number(label.dataset.explodeLabel) === group);
    }
    dock.open(group);
  };
  const proxy = { value: 0 };
  const tween = gsap.to(proxy, {
    value: 1,
    ease: 'none',
    onUpdate: () => render(proxy.value),
    scrollTrigger: { trigger: track, start: 'top 64px', end: 'bottom bottom', scrub: SCRUB },
  });
  render(0);
  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
    mini.style.removeProperty('--spread');
  };
}

export function initJourney(stage: StageController | null): void {
  const section = document.querySelector<HTMLElement>('[data-explode]');
  if (!section) return;
  let cleanup = () => {};
  const bind = () => {
    cleanup();
    if (stage && stage.mode() === 'sticky') {
      const unbindExplode = bindStageScenes(section, stage);
      const unbindScenes = bindScenes(stage);
      cleanup = () => {
        unbindExplode();
        unbindScenes();
      };
    } else {
      cleanup = bindMiniScene(section);
    }
    ScrollTrigger.refresh();
  };
  let lastMode = stage?.mode();
  stage?.onModeChange((mode) => {
    if (mode === lastMode) return;
    lastMode = mode;
    bind();
  });
  bind();
}
