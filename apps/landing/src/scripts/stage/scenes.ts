import { findTarget, TOOL_GROUP, type ToolId } from '../../demo/layout';
import { SCENES, TOOL_TARGET } from '../../demo/scenes';
import { createDock, type DockController } from './dock';
import { createPanel, type PanelController } from './panel';
import type { StageController } from './rig';

const CART_REVEAL_MS = 1400;

interface SceneSheet {
  panel: PanelController;
  dock: DockController;
}

function createSheet(section: HTMLElement): SceneSheet | null {
  const panelElement = section.querySelector<HTMLElement>('[data-scene-sheet] [data-panel]');
  const dockElement = section.querySelector<HTMLElement>('[data-scene-sheet] [data-dock]');
  if (!panelElement || !dockElement) return null;
  return { panel: createPanel(panelElement), dock: createDock(dockElement) };
}

function showOnSheet(sheet: SceneSheet, tool: ToolId): void {
  const targetId = TOOL_TARGET[tool];
  sheet.panel.showTool(tool, targetId ? (findTarget(targetId) ?? null) : null);
  sheet.dock.open(TOOL_GROUP[tool]);
}

function revealCartOnEnter(section: HTMLElement, sheet: SceneSheet): void {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      window.setTimeout(() => {
        const event = sheet.panel.element.querySelector<HTMLElement>('[data-np-new-event]');
        const count = sheet.panel.element.querySelector<HTMLElement>('[data-np-event-count]');
        if (!event || !event.hidden) return;
        event.hidden = false;
        if (count) count.textContent = String(Number(count.textContent ?? 0) + 1);
      }, CART_REVEAL_MS);
    },
    { threshold: 0.5 },
  );
  observer.observe(section);
}

function bindChips(
  section: HTMLElement,
  sheet: SceneSheet | null,
  stage: StageController | null,
): void {
  const sceneId = section.dataset.scene ?? '';
  const spec = SCENES[sceneId];
  if (!spec) return;
  const chips = [...section.querySelectorAll<HTMLButtonElement>('[data-scene-tool]')];
  let pinned: ToolId = spec.tool;
  const isStageLive = () => stage?.mode() === 'sticky';
  const display = (tool: ToolId) => {
    if (sheet) showOnSheet(sheet, tool);
  };
  const preview = (tool: ToolId | null) => {
    if (isStageLive()) {
      stage?.showScene(sceneId);
      stage?.previewTool(tool);
    }
    display(tool ?? pinned);
  };
  for (const chip of chips) {
    const tool = chip.dataset.sceneTool as ToolId;
    chip.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') preview(tool);
    });
    chip.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'mouse') preview(null);
    });
    chip.addEventListener('focus', () => preview(tool));
    chip.addEventListener('blur', () => preview(null));
    chip.addEventListener('click', () => {
      pinned = tool;
      for (const other of chips) other.setAttribute('aria-pressed', String(other === chip));
      if (isStageLive()) {
        stage?.showScene(sceneId);
        stage?.pinTool(tool);
      }
      display(tool);
    });
  }
}

export function initScenes(stage: StageController | null): void {
  for (const section of document.querySelectorAll<HTMLElement>('[data-scene]')) {
    const sheet = createSheet(section);
    bindChips(section, sheet, stage);
    if (sheet && section.dataset.scene === 'tecnologia') revealCartOnEnter(section, sheet);
  }
}
