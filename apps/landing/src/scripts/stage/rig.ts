import {
  DEMO_HEIGHT,
  DEMO_TOUR,
  DEMO_WIDTH,
  findTarget,
  INTRO_TARGET,
  type InspectTarget,
  TOOL_GROUP,
  type ToolId,
} from '../../demo/layout';
import { HERO_POSE, SCENES, type ScenePose, TOOL_TARGET } from '../../demo/scenes';
import { clamp, isDesktopPointer, isMotion, lerp, rampProgress } from '../env';
import { createSpring, snapSpring, stepSpring } from '../spring';
import { createCallouts } from './callouts';
import { createDock } from './dock';
import { createHighlight } from './highlight';
import { INTRO_TIMING, runIntroReveal } from './intro';
import { createPanel } from './panel';

export type StageMode = 'sticky' | 'inline' | 'phone';

export interface StageFrame {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  scale: number;
  rigWidth: number;
  rigHeight: number;
  lightX: number;
  lightY: number;
  lightStrength: number;
}

export interface StageController {
  stage: HTMLElement;
  mode(): StageMode;
  setScene(enter: number, explode: number): void;
  setPose(pose: ScenePose): void;
  showScene(id: string | null): void;
  previewTool(tool: ToolId | null): void;
  pinTool(tool: ToolId): void;
  onFrame(listener: (frame: StageFrame) => void): void;
  onModeChange(listener: (mode: StageMode) => void): void;
}

interface Pose {
  rx: number;
  ry: number;
  rz: number;
}

interface Layout {
  shiftForZoom: number;
  width: number;
  height: number;
  rigWidth: number;
  rigHeight: number;
  heroX: number;
  heroY: number;
  heroSpan: number;
  explodeX: number;
  explodeY: number;
  explodeScale: number;
  dockFlatX: number;
  dockFlatY: number;
  layerGap: number;
}

const EXPLODED: Pose = { rx: 58, ry: 0, rz: -32 };
const TILT_Y_DEG = 6;
const TILT_X_DEG = 4;
const PANEL_WIDTH = 368;
const BAR_HEIGHT = 28;
const PANEL_LEFT = 0.8;
const DOCK_CENTER = 0.4;
const HEADER_HEIGHT = 64;
const LAYER_GAP = 72;
const LAYER_LIFT = 40;
const DIM_OPACITY = 0.55;
const IDLE_MS = 2500;
const TOUR_STEP_MS = 1800;
const TOUR_ARRIVE_MS = 560;
const LAYER_COUNT = 8;
const CART_CLICK_DELAY_MS = 900;
const EDGE_SAFETY = 12;
const DEG = Math.PI / 180;

function smooth(value: number): number {
  const clamped = clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

function easeOutCubic(value: number): number {
  return 1 - (1 - clamp(value, 0, 1)) ** 3;
}

function contentBounds(stage: HTMLElement): { left: number; right: number } {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const stageRect = stage.getBoundingClientRect();
  if (!hero) return { left: 0, right: stageRect.width };
  const heroRect = hero.getBoundingClientRect();
  const style = getComputedStyle(hero);
  return {
    left: heroRect.left - stageRect.left + Number.parseFloat(style.paddingLeft),
    right: heroRect.right - stageRect.left - Number.parseFloat(style.paddingRight),
  };
}

function detectMode(): StageMode {
  if (!matchMedia('(min-width: 1200px)').matches) return 'phone';
  const isLite = document.documentElement.classList.contains('is-lite');
  return isMotion && !isLite ? 'sticky' : 'inline';
}

export function initStage(): StageController | null {
  const stage = document.querySelector<HTMLElement>('[data-stage]');
  const view = stage?.querySelector<HTMLElement>('[data-stage-view]');
  const rig = stage?.querySelector<HTMLElement>('[data-rig]');
  const dockRig = stage?.querySelector<HTMLElement>('[data-dock-rig]');
  const page = stage?.querySelector<HTMLElement>('[data-demo-page]');
  const panelElement = stage?.querySelector<HTMLElement>('[data-panel]');
  const dockElement = stage?.querySelector<HTMLElement>('[data-plane="dock"] [data-dock]');
  const hlPlane = stage?.querySelector<HTMLElement>('[data-plane="hl"]');
  const framePlane = stage?.querySelector<HTMLElement>('[data-plane="frame"]');
  const panelPlane = stage?.querySelector<HTMLElement>('[data-plane="panel"]');
  const cursor = stage?.querySelector<HTMLElement>('[data-ghost-cursor]');
  const callouts = stage?.querySelector<SVGSVGElement>('[data-callouts]');
  const skip = stage?.querySelector<HTMLButtonElement>('[data-skip-intro]');
  if (
    !stage ||
    !view ||
    !rig ||
    !dockRig ||
    !page ||
    !panelElement ||
    !dockElement ||
    !hlPlane ||
    !framePlane ||
    !panelPlane ||
    !cursor ||
    !callouts
  ) {
    return null;
  }

  const root = document.documentElement;
  const panel = createPanel(panelElement);
  const dock = createDock(dockElement);
  const highlight = createHighlight(hlPlane);
  const layers = [...rig.querySelectorAll<HTMLElement>('[data-plane="layers"] [data-layer]')];
  const anchors = layers.map(
    (layer) => layer.querySelector<HTMLElement>('[data-layer-anchor]') ?? layer,
  );
  const labelItems = [...document.querySelectorAll<HTMLElement>('[data-explode-label]')];
  const labelLinks = labelItems.map((item) => item.querySelector<HTMLElement>('a') ?? item);
  const calloutLines = createCallouts(callouts, view, labelLinks, anchors);
  const frameListeners: ((frame: StageFrame) => void)[] = [];
  const modeListeners: ((mode: StageMode) => void)[] = [];
  const tiltX = createSpring(0, 170, 26);
  const tiltY = createSpring(0, 170, 26);
  const lightX = createSpring(0, 120, 22);
  const lightY = createSpring(0, 120, 22);
  const lifts = layers.map(() => createSpring(0, 170, 26));

  let mode = detectMode();
  let layout: Layout | null = null;
  let scene = { enter: 0, explode: 0 };
  let introStart = Number.NEGATIVE_INFINITY;
  let isIntroRunning = false;
  let introAnimations: Animation[] = [];
  let isVisible = true;
  let isRunning = false;
  let lastFrame = performance.now();
  let lastSpread = -1;
  let activeLayer = -1;
  let hoverLayer: number | null = null;
  let current: InspectTarget | null = null;
  let hovered: InspectTarget | null = null;
  let isLocked = false;
  let tourIndex = 0;
  let tourTimer = 0;
  let arriveTimer = 0;
  let blend = 0;
  let sceneId: string | null = null;
  let scenePose: ScenePose = { ...HERO_POSE };
  let pinnedTool: ToolId | null = null;
  let previewedTool: ToolId | null = null;
  let cartTimer = 0;

  const computeLayout = (): Layout => {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const isSticky = mode === 'sticky';
    const bounds = isSticky ? contentBounds(stage) : { left: 0, right: width };
    const contentWidth = bounds.right - bounds.left;
    const areaLeft = isSticky ? bounds.left + contentWidth * 0.38 : 0;
    const areaRight = bounds.right;
    const areaTop = isSticky ? HEADER_HEIGHT : 0;
    const areaWidth = areaRight - areaLeft;
    const areaHeight = height - areaTop;
    const panelScale = clamp(areaWidth / 1000, 0.86, 1);
    const panelWidth = PANEL_WIDTH * panelScale;
    const rigWidth = Math.min(
      (areaWidth * 0.96 - panelWidth) / PANEL_LEFT,
      (areaHeight * 0.72 - BAR_HEIGHT) * 1.5,
      1180,
    );
    const rigHeight = (rigWidth * DEMO_HEIGHT) / DEMO_WIDTH;
    const compositionWidth = rigWidth * PANEL_LEFT + panelWidth;
    const heroX =
      areaLeft + (areaWidth - compositionWidth) / 2 - compositionWidth * 0.04 + rigWidth / 2;
    const heroY = areaTop + areaHeight / 2 + BAR_HEIGHT / 2 - 12;
    const layerGap = (LAYER_GAP * rigWidth) / DEMO_WIDTH;
    const stackDepth = layerGap * LAYER_COUNT + LAYER_LIFT;
    const cosZ = Math.cos(32 * DEG);
    const sinZ = Math.sin(32 * DEG);
    const footWidth = rigWidth * cosZ + rigHeight * sinZ;
    const footHeight =
      (rigWidth * sinZ + rigHeight * cosZ) * Math.cos(58 * DEG) + stackDepth * Math.sin(58 * DEG);
    const explodeLeft = bounds.left + contentWidth * 0.3;
    const explodeRight = bounds.right;
    const explodeTop = HEADER_HEIGHT + 24;
    const explodeBottom = height - 104;
    const explodeScale = Math.min(
      ((explodeRight - explodeLeft) * 0.84) / footWidth,
      ((explodeBottom - explodeTop) * 0.78) / footHeight,
      1.3,
    );
    const explodeX = (explodeLeft + explodeRight) / 2;
    const explodeY =
      (explodeTop + explodeBottom) / 2 + (stackDepth * Math.sin(58 * DEG) * explodeScale) / 2;
    rig.style.setProperty('--rig-w', `${rigWidth.toFixed(1)}px`);
    rig.style.setProperty('--rig-h', `${rigHeight.toFixed(1)}px`);
    rig.style.setProperty('--bar-h', `${BAR_HEIGHT}px`);
    rig.style.setProperty('--panel-scale', panelScale.toFixed(3));
    dockRig.style.setProperty('--rig-w', `${rigWidth.toFixed(1)}px`);
    dockRig.style.setProperty('--rig-h', `${rigHeight.toFixed(1)}px`);
    dockRig.style.setProperty('--dock-scale', panelScale.toFixed(3));
    dock.setCompact(false);
    dock.setCompact(dockElement.offsetWidth * panelScale > rigWidth * PANEL_LEFT * 1.08);
    const dockHalf = (dockElement.offsetWidth * panelScale) / 2;
    const dockCenter = Math.max(DOCK_CENTER, (dockHalf + 12) / rigWidth);
    dockRig.style.setProperty('--dock-left', `${(dockCenter * 100).toFixed(2)}%`);
    return {
      shiftForZoom: compositionWidth / 2,
      width,
      height,
      rigWidth,
      rigHeight,
      heroX,
      heroY,
      heroSpan: areaWidth / 2,
      explodeX,
      explodeY,
      explodeScale,
      dockFlatX: explodeX + rigWidth * (0.5 - dockCenter),
      dockFlatY: height - 52 - rigHeight / 2,
      layerGap,
    };
  };

  const emitFrame = (frame: StageFrame) => {
    for (const listener of frameListeners) listener(frame);
  };

  const introPose = (now: number) =>
    easeOutCubic(rampProgress(now - introStart, INTRO_TIMING.poseStart, INTRO_TIMING.poseEnd));

  const updateActiveLayer = (index: number) => {
    if (index === activeLayer) return;
    activeLayer = index;
    labelItems.forEach((item, itemIndex) => {
      item.classList.toggle('is-active', itemIndex === index);
    });
    layers.forEach((layer, layerIndex) => {
      layer.classList.toggle('is-active', layerIndex === index);
    });
    dock.open(index >= 0 ? index : TOOL_GROUP[panel.tool()]);
  };

  const render = (now: number, delta: number): boolean => {
    if (!layout || mode === 'phone') return false;
    let isMoving = false;
    if (isMotion) {
      isMoving = stepSpring(tiltX, delta) || isMoving;
      isMoving = stepSpring(tiltY, delta) || isMoving;
      isMoving = stepSpring(lightX, delta) || isMoving;
      isMoving = stepSpring(lightY, delta) || isMoving;
    }
    const intro = isIntroRunning ? introPose(now) : 1;
    const enter = mode === 'sticky' ? scene.enter : 0;
    const explode = mode === 'sticky' ? scene.explode : 0;
    const exitBlend = smooth(rampProgress(explode, 0.8, 1));
    blend = smooth(enter) * (1 - exitBlend);
    const tiltWeight = 1 - blend;
    const heroPose: Pose = {
      rx: scenePose.rx * intro - tiltY.value * TILT_X_DEG * tiltWeight,
      ry: scenePose.ry * intro + tiltX.value * TILT_Y_DEG * tiltWeight,
      rz: 0,
    };
    const zoom = scenePose.zoom;
    const heroX = layout.heroX - (zoom - 1) * layout.shiftForZoom;
    const rx = lerp(heroPose.rx, EXPLODED.rx, blend);
    const ry = lerp(heroPose.ry, EXPLODED.ry, blend);
    const rz = lerp(heroPose.rz, EXPLODED.rz, blend);
    const scale = lerp(zoom, layout.explodeScale, blend);
    const centerX = lerp(heroX, layout.explodeX, blend);
    const centerY = lerp(layout.heroY, layout.explodeY, blend);
    const { rigWidth, rigHeight } = layout;
    rig.style.transform = `translate3d(${(centerX - rigWidth / 2).toFixed(2)}px, ${(centerY - rigHeight / 2).toFixed(2)}px, 0) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg) scale(${scale.toFixed(4)})`;
    view.style.perspectiveOrigin = `${centerX.toFixed(1)}px ${centerY.toFixed(1)}px`;

    const dockX = lerp(heroX, layout.dockFlatX, blend);
    const dockY = lerp(layout.heroY, layout.dockFlatY, blend);
    const flat = 1 - blend;
    dockRig.style.transform = `translate3d(${(dockX - rigWidth / 2).toFixed(2)}px, ${(dockY - rigHeight / 2).toFixed(2)}px, 0) rotateX(${(heroPose.rx * flat).toFixed(3)}deg) rotateY(${(heroPose.ry * flat).toFixed(3)}deg)`;

    const spread = intro;
    if (Math.abs(spread - lastSpread) > 0.0005) {
      rig.style.setProperty('--spread', spread.toFixed(4));
      dockRig.style.setProperty('--spread', spread.toFixed(4));
      lastSpread = spread;
    }

    const autoLayer =
      blend > 0.5
        ? Math.min(LAYER_COUNT - 1, Math.floor(rampProgress(explode, 0.03, 0.74) * LAYER_COUNT))
        : -1;
    updateActiveLayer(blend > 0.5 && hoverLayer !== null ? hoverLayer : autoLayer);

    let separationTotal = 0;
    layers.forEach((layer, index) => {
      const separateIn = smooth(rampProgress(enter, 0.42 + index * 0.035, 0.72 + index * 0.035));
      const mergeOut = smooth(
        rampProgress(
          explode,
          0.74 + (LAYER_COUNT - 1 - index) * 0.018,
          0.82 + (LAYER_COUNT - 1 - index) * 0.018,
        ),
      );
      const separation = separateIn * (1 - mergeOut);
      separationTotal += separation;
      const lift = lifts[index];
      lift.target = index === activeLayer ? LAYER_LIFT : 0;
      if (isMotion) isMoving = stepSpring(lift, delta) || isMoving;
      else snapSpring(lift, lift.target);
      const z =
        separation * (layout ? layout.layerGap : 0) * (LAYER_COUNT - index) +
        lift.value * separation;
      const baseOpacity = activeLayer < 0 || index === activeLayer ? 1 : DIM_OPACITY;
      const opacity = clamp(separation * 2.2, 0, 1) * baseOpacity;
      layer.style.transform = `translateZ(${z.toFixed(2)}px)`;
      layer.style.opacity = opacity.toFixed(3);
    });
    const separationAverage = separationTotal / Math.max(1, layers.length);
    framePlane.style.opacity = (1 - 0.72 * separationAverage).toFixed(3);
    const hlVisibility = Math.max(1 - rampProgress(enter, 0, 0.25), rampProgress(explode, 0.92, 1));
    hlPlane.style.opacity = (mode === 'sticky' ? hlVisibility : 1).toFixed(3);
    const panelOut = rampProgress(enter, 0.04, 0.42) * (1 - rampProgress(explode, 0.84, 0.98));
    panelPlane.style.clipPath =
      panelOut > 0.001 ? `inset(0 0 0 ${(panelOut * 100).toFixed(2)}%)` : '';
    calloutLines.update(
      mode === 'sticky' ? smooth(rampProgress(blend, 0.7, 1)) * smooth(separationAverage * 1.4) : 0,
      activeLayer,
    );

    const lightBlend = blend;
    emitFrame({
      width: layout.width,
      height: layout.height,
      centerX,
      centerY,
      rotateX: rx,
      rotateY: ry,
      rotateZ: rz,
      scale,
      rigWidth,
      rigHeight,
      lightX: lerp(lightX.value, 0, lightBlend),
      lightY: lerp(lightY.value, 0, lightBlend),
      lightStrength: Math.max(lightBlend, current && current.id !== 'paper' ? 1 : 0.5),
    });
    return isMoving || isIntroRunning;
  };

  const frame = (now: number) => {
    const delta = Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;
    const shouldContinue = render(now, delta);
    if (shouldContinue && isVisible) requestAnimationFrame(frame);
    else isRunning = false;
  };

  const wake = () => {
    if (isRunning || !isVisible || mode === 'phone') return;
    isRunning = true;
    lastFrame = performance.now();
    requestAnimationFrame(frame);
  };

  const keepInsideContent = (target: Layout) => {
    const bounds = contentBounds(stage);
    const savedTransform = rig.style.transform;
    const savedSpread = rig.style.getPropertyValue('--spread');
    const savedOrigin = view.style.perspectiveOrigin;
    rig.style.setProperty('--spread', '1');
    rig.style.transform = `translate3d(${(target.heroX - target.rigWidth / 2).toFixed(2)}px, ${(target.heroY - target.rigHeight / 2).toFixed(2)}px, 0) rotateX(${HERO_POSE.rx}deg) rotateY(${HERO_POSE.ry}deg)`;
    view.style.perspectiveOrigin = `${target.heroX.toFixed(1)}px ${target.heroY.toFixed(1)}px`;
    const right = panelElement.getBoundingClientRect().right - stage.getBoundingClientRect().left;
    rig.style.transform = savedTransform;
    rig.style.setProperty('--spread', savedSpread);
    view.style.perspectiveOrigin = savedOrigin;
    const overshoot = right + EDGE_SAFETY - bounds.right;
    if (overshoot > 0) target.heroX -= overshoot;
  };

  const relayout = () => {
    mode = detectMode();
    stage.dataset.mode = mode;
    if (mode === 'phone') {
      layout = null;
      rig.style.removeProperty('transform');
      dockRig.style.removeProperty('transform');
      view.style.removeProperty('perspective-origin');
      for (const layer of layers) {
        layer.style.removeProperty('transform');
        layer.style.removeProperty('opacity');
      }
      framePlane.style.removeProperty('opacity');
      hlPlane.style.removeProperty('opacity');
      panelPlane.style.removeProperty('clip-path');
      dock.setCompact(false);
    } else {
      layout = computeLayout();
      if (mode === 'sticky') keepInsideContent(layout);
    }
    dock.relayout();
    highlight.relayout();
    if (layout) {
      const scale = layout.rigWidth / DEMO_WIDTH;
      const target = current?.rect;
      if (target) {
        snapSpring(lightX, (target.x + target.w / 2 - DEMO_WIDTH / 2) * scale);
        snapSpring(lightY, (target.y + target.h / 2 - DEMO_HEIGHT / 2) * scale);
      }
    }
    render(performance.now(), 0);
    for (const listener of modeListeners) listener(mode);
  };

  const inspect = (target: InspectTarget | null) => {
    if (!target) return;
    current = target;
    panel.show(target);
    highlight.show(target);
    if (blend < 0.5) dock.open(TOOL_GROUP[target.tool]);
    if (layout) {
      const scale = layout.rigWidth / DEMO_WIDTH;
      lightX.target = (target.rect.x + target.rect.w / 2 - DEMO_WIDTH / 2) * scale;
      lightY.target = (target.rect.y + target.rect.h / 2 - DEMO_HEIGHT / 2) * scale;
      if (!isMotion) {
        snapSpring(lightX, lightX.target);
        snapSpring(lightY, lightY.target);
      }
    }
    wake();
  };

  const setLocked = (next: boolean) => {
    isLocked = next;
    panel.setLocked(next);
    highlight.setLocked(next);
  };

  const hideCursor = () => {
    cursor.classList.remove('is-on');
    window.clearTimeout(arriveTimer);
  };

  const moveCursorTo = (id: string, onArrive: () => void) => {
    const element = page.querySelector<HTMLElement>(`[data-inspect="${id}"]`);
    if (!element) return;
    const viewRect = view.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width * 0.5 - viewRect.left;
    const y = rect.top + rect.height * 0.55 - viewRect.top;
    cursor.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    cursor.classList.add('is-on');
    window.clearTimeout(arriveTimer);
    arriveTimer = window.setTimeout(onArrive, TOUR_ARRIVE_MS);
  };

  const revealCartEvent = () => {
    const event = panelElement.querySelector<HTMLElement>('[data-np-new-event]');
    const count = panelElement.querySelector<HTMLElement>('[data-np-event-count]');
    if (!event || !event.hidden) return;
    event.hidden = false;
    if (count) count.textContent = String(Number(count.textContent ?? 0) + 1);
  };

  const applySceneTool = () => {
    if (sceneId === null) return;
    const spec = SCENES[sceneId];
    if (!spec) return;
    const tool = previewedTool ?? pinnedTool ?? spec.tool;
    const targetId = TOOL_TARGET[tool];
    const target = targetId ? (findTarget(targetId) ?? null) : null;
    if (target) current = target;
    panel.showTool(tool, target);
    highlight.show(target);
    dock.open(TOOL_GROUP[tool]);
    wake();
  };

  const scheduleCartClick = () => {
    window.clearTimeout(cartTimer);
    if (sceneId !== 'tecnologia') return;
    cartTimer = window.setTimeout(() => {
      if (sceneId !== 'tecnologia') return;
      const reveal = () => {
        revealCartEvent();
        window.setTimeout(hideCursor, TOUR_ARRIVE_MS);
      };
      if (isMotion) moveCursorTo('button', reveal);
      else reveal();
    }, CART_CLICK_DELAY_MS);
  };

  const scheduleTour = (delay = IDLE_MS) => {
    window.clearTimeout(tourTimer);
    if (!isMotion) return;
    tourTimer = window.setTimeout(stepTour, delay);
  };

  const stepTour = () => {
    if (!isVisible || isLocked || isIntroRunning || blend > 0.05 || sceneId !== null) {
      hideCursor();
      scheduleTour(TOUR_STEP_MS);
      return;
    }
    const id = DEMO_TOUR[tourIndex % DEMO_TOUR.length];
    tourIndex += 1;
    moveCursorTo(id, () => inspect(findTarget(id) ?? null));
    scheduleTour(TOUR_STEP_MS);
  };

  const targetFromEvent = (event: Event): InspectTarget | null => {
    const element = (event.target as Element | null)?.closest<HTMLElement>('[data-inspect]');
    return element ? (findTarget(element.dataset.inspect ?? '') ?? null) : null;
  };

  const noteActivity = () => {
    hideCursor();
    scheduleTour();
  };

  page.addEventListener('pointerover', (event) => {
    noteActivity();
    if (isLocked || isIntroRunning) return;
    const target = targetFromEvent(event);
    if (!target || target === hovered) return;
    if (target.id === 'paper' && sceneId !== null) return;
    hovered = target;
    inspect(target);
  });
  page.addEventListener('pointerleave', () => {
    hovered = null;
    if (isLocked) return;
    if (sceneId !== null) applySceneTool();
    else if (current?.tool !== 'eyedropper') highlight.show(null);
  });
  page.addEventListener('click', (event) => {
    const target = targetFromEvent(event);
    if (!target) return;
    if (target.id === 'button' && panel.tool() === 'tags') {
      revealCartEvent();
      return;
    }
    hovered = target;
    if ((event as PointerEvent).pointerType === 'touch') {
      setLocked(false);
      inspect(target);
      return;
    }
    if (isLocked && target === current) {
      setLocked(false);
      return;
    }
    inspect(target);
    setLocked(true);
  });
  stage.addEventListener('pointermove', noteActivity, { passive: true });
  stage.addEventListener('np:speed', (event) => {
    const speed = (event as CustomEvent<number>).detail;
    for (const animation of page.getAnimations({ subtree: true })) animation.playbackRate = speed;
  });

  if (isMotion && isDesktopPointer()) {
    window.addEventListener(
      'pointermove',
      (event) => {
        if (!layout || mode === 'phone' || blend >= 1) return;
        const stageRect = stage.getBoundingClientRect();
        const offsetX = event.clientX - stageRect.left - layout.heroX;
        const offsetY = event.clientY - stageRect.top - layout.heroY;
        tiltX.target = clamp(offsetX / layout.heroSpan, -1, 1);
        tiltY.target = clamp(offsetY / (layout.height / 2), -1, 1);
        wake();
      },
      { passive: true },
    );
  }

  for (const [index, item] of labelItems.entries()) {
    const enter = () => {
      hoverLayer = index;
      wake();
    };
    const leave = () => {
      hoverLayer = null;
      wake();
    };
    item.addEventListener('pointerenter', enter);
    item.addEventListener('pointerleave', leave);
    item.addEventListener('focusin', enter);
    item.addEventListener('focusout', leave);
  }

  new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible) wake();
    else hideCursor();
  }).observe(stage);

  new ResizeObserver(() => relayout()).observe(stage);

  function finishIntro() {
    if (!isIntroRunning) return;
    isIntroRunning = false;
    for (const animation of introAnimations) animation.finish();
    introAnimations = [];
    introStart = Number.NEGATIVE_INFINITY;
    if (skip) skip.hidden = true;
    root.classList.remove('is-intro');
    inspect(findTarget(INTRO_TARGET) ?? null);
    scheduleTour();
    wake();
  }

  const playIntro = () => {
    const body = panel.activeBody();
    isIntroRunning = true;
    introStart = performance.now();
    try {
      sessionStorage.setItem('ni-intro', '1');
    } catch {}
    introAnimations = runIntroReveal({
      dock: dockElement,
      groups: [...dockElement.querySelectorAll<HTMLElement>('[data-dock-group]')],
      indicator: dockElement.querySelector<HTMLElement>('[data-dock-indicator]') ?? dockElement,
      panel: panelElement,
      laminas: body ? [...body.querySelectorAll<HTMLElement>('.np-lamina')] : [],
    });
    window.setTimeout(() => {
      if (isIntroRunning) inspect(findTarget(INTRO_TARGET) ?? null);
    }, INTRO_TIMING.highlightAt);
    window.setTimeout(finishIntro, INTRO_TIMING.poseEnd);
    if (skip) {
      skip.hidden = false;
      skip.addEventListener('click', finishIntro, { once: true });
    }
    window.addEventListener('keydown', finishIntro, { once: true });
    stage.addEventListener('pointerdown', finishIntro, { once: true });
    window.addEventListener('wheel', finishIntro, { once: true, passive: true });
    wake();
  };

  relayout();
  stage.classList.add('is-ready');

  if (isMotion && root.classList.contains('is-intro')) {
    playIntro();
  } else {
    inspect(findTarget(INTRO_TARGET) ?? null);
    scheduleTour();
  }

  return {
    stage,
    mode: () => mode,
    setScene(enter, explode) {
      scene = { enter, explode };
      if (isIntroRunning && enter > 0) finishIntro();
      wake();
    },
    setPose(pose) {
      scenePose = pose;
      wake();
    },
    showScene(id) {
      if (id === sceneId) return;
      sceneId = id;
      pinnedTool = null;
      previewedTool = null;
      stage.dataset.scene = id ?? '';
      setLocked(false);
      hideCursor();
      if (id === null) {
        inspect(findTarget(INTRO_TARGET) ?? null);
        scheduleTour();
        return;
      }
      applySceneTool();
      scheduleCartClick();
    },
    previewTool(tool) {
      if (tool === previewedTool) return;
      previewedTool = tool;
      applySceneTool();
    },
    pinTool(tool) {
      pinnedTool = tool;
      previewedTool = null;
      applySceneTool();
    },
    onFrame(listener) {
      frameListeners.push(listener);
    },
    onModeChange(listener) {
      modeListeners.push(listener);
    },
  };
}
