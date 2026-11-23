import { boxContentSize, cssShorthand, type InspectTarget, type ToolId } from '../../demo/layout';

const COPIED_MS = 1200;
const TOAST_MS = 1600;
const TOOLS_WITHOUT_SELECTOR = new Set<ToolId>([
  'assets',
  'tokens',
  'motion',
  'tags',
  'tech',
  'utils',
]);

interface ToolHead {
  eyebrow: string;
  title: string;
}

export interface PanelController {
  element: HTMLElement;
  show(target: InspectTarget): void;
  showTool(tool: ToolId, target?: InspectTarget | null): void;
  setLocked(isLocked: boolean): void;
  tool(): ToolId;
  activeBody(): HTMLElement | null;
}

function setFields(root: HTMLElement, field: string, value: string): void {
  for (const node of root.querySelectorAll<HTMLElement>(`[data-field="${field}"]`)) {
    if (node.textContent !== value) node.textContent = value;
  }
}

function setSwatch(root: HTMLElement, field: string, color: string): void {
  for (const node of root.querySelectorAll<HTMLElement>(`[data-field="${field}"]`)) {
    node.style.background = color;
  }
}

function fillBody(body: HTMLElement, target: InspectTarget): void {
  if (target.box) {
    const { box } = target;
    const [mt, mr, mb, ml] = box.margin;
    const [pt, pr, pb, pl] = box.padding;
    const pairs: [string, number][] = [
      ['mt', mt],
      ['mr', mr],
      ['mb', mb],
      ['ml', ml],
      ['pt', pt],
      ['pr', pr],
      ['pb', pb],
      ['pl', pl],
      ['bw', box.border],
      ['width', box.width],
      ['height', box.height],
      ['border', box.border],
      ['radius', box.radius],
    ];
    for (const [field, value] of pairs) setFields(body, field, String(value));
    setFields(body, 'content', boxContentSize(box));
    setFields(body, 'margin', cssShorthand(box.margin));
    setFields(body, 'padding', cssShorthand(box.padding));
    setFields(body, 'display', box.display);
  }
  if (target.font) {
    const { font } = target;
    setFields(body, 'family', font.family);
    setFields(body, 'declared', font.declared);
    setFields(body, 'weight', String(font.weight));
    setFields(body, 'size', String(font.size));
    setFields(body, 'lineHeight', String(font.lineHeight));
    setFields(body, 'color', font.color);
    setFields(body, 'summary', `${font.weight} · ${font.size}/${font.lineHeight}`);
    setSwatch(body, 'colorSwatch', font.color);
    const glyph = body.querySelector<HTMLElement>('[data-field="glyph"]');
    if (glyph) glyph.dataset.family = font.family;
  }
  if (target.color) {
    const { color } = target;
    setFields(body, 'hex', color.hex);
    setFields(body, 'rgb', color.rgb);
    setFields(body, 'hsl', color.hsl);
    setFields(body, 'oklch', color.oklch);
    setSwatch(body, 'swatch', color.hex);
    for (const chip of body.querySelectorAll<HTMLElement>('[data-recent]')) {
      chip.classList.toggle('is-current', chip.dataset.recent === color.hex);
    }
  }
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {}
}

function selectTab(tabs: HTMLElement[], selected: HTMLElement): void {
  for (const tab of tabs) tab.setAttribute('aria-selected', String(tab === selected));
}

function wireTabs(body: HTMLElement): void {
  for (const group of body.querySelectorAll<HTMLElement>('[data-np-tabs]')) {
    const tabs = [...group.querySelectorAll<HTMLElement>('[data-np-tab]')];
    const panels = [...group.querySelectorAll<HTMLElement>('[data-np-tabpanel]')];
    for (const tab of tabs) {
      tab.addEventListener('click', (event) => {
        event.stopPropagation();
        selectTab(tabs, tab);
        for (const panel of panels) panel.hidden = panel.dataset.npTabpanel !== tab.dataset.npTab;
      });
    }
  }
}

function wireSpeed(body: HTMLElement): void {
  const options = [...body.querySelectorAll<HTMLElement>('[data-np-speed-value]')];
  for (const option of options) {
    option.addEventListener('click', (event) => {
      event.stopPropagation();
      selectTab(options, option);
      body.dispatchEvent(
        new CustomEvent('np:speed', {
          bubbles: true,
          detail: Number(option.dataset.npSpeedValue ?? 1),
        }),
      );
    });
  }
}

function wireCopyButton(body: HTMLElement): void {
  const button = body.querySelector<HTMLElement>('[data-np-copy]');
  const toast = body.querySelector<HTMLElement>('[data-np-toast]');
  if (!button || !toast) return;
  let timer = 0;
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    const code = body.querySelector<HTMLElement>('[data-np-tabpanel]:not([hidden])');
    void copyText(code?.textContent ?? '');
    toast.hidden = false;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      toast.hidden = true;
    }, TOAST_MS);
  });
}

function wireBody(body: HTMLElement): void {
  wireCopyRows(body);
  wireTabs(body);
  wireSpeed(body);
  wireCopyButton(body);
}

function wireCopyRows(body: HTMLElement): void {
  for (const row of body.querySelectorAll<HTMLElement>('[data-copyrow]')) {
    let timer = 0;
    row.addEventListener('click', (event) => {
      event.stopPropagation();
      const value = row.querySelector('.ni-copyrow__value')?.textContent?.trim() ?? '';
      void copyText(value);
      row.classList.add('is-copied');
      window.clearTimeout(timer);
      timer = window.setTimeout(() => row.classList.remove('is-copied'), COPIED_MS);
    });
  }
}

const SCROLL_END_SLACK_PX = 8;

function trackScrollEnd(panel: HTMLElement, body: HTMLElement): void {
  const update = () => {
    const isAtEnd = body.scrollTop + body.clientHeight >= body.scrollHeight - SCROLL_END_SLACK_PX;
    panel.classList.toggle('is-scroll-end', isAtEnd);
  };
  body.addEventListener(
    'scroll',
    () => {
      if (body.classList.contains('is-active')) update();
    },
    { passive: true },
  );
  body.addEventListener('np:measure', update);
}

export function createPanel(element: HTMLElement): PanelController {
  const bodies = element.querySelector<HTMLElement>('[data-panel-bodies]');
  const eyebrow = element.querySelector<HTMLElement>('[data-panel-eyebrow]');
  const title = element.querySelector<HTMLElement>('[data-panel-title]');
  const selector = element.querySelector<HTMLElement>('[data-panel-selector]');
  const webFont = element.querySelector<HTMLElement>('[data-panel-webfont]');
  const locked = element.querySelector<HTMLElement>('[data-panel-locked]');
  const found = element.querySelector<HTMLElement>('[data-panel-found]');
  if (!bodies || !eyebrow || !title || !selector || !webFont || !locked || !found) {
    throw new Error('Panel markup incomplete');
  }
  const heads = JSON.parse(element.dataset.heads ?? '{}') as Record<ToolId, ToolHead>;
  const bodyByTool = new Map<ToolId, HTMLElement>();
  let currentTool = (element.dataset.tool ?? 'box') as ToolId;
  let isLocked = false;

  for (const body of bodies.querySelectorAll<HTMLElement>('[data-tool-body]')) {
    bodyByTool.set(body.dataset.toolBody as ToolId, body);
    wireBody(body);
    trackScrollEnd(element, body);
  }
  bodyByTool.get(currentTool)?.classList.add('is-active');
  requestAnimationFrame(() => bodyByTool.get(currentTool)?.dispatchEvent(new Event('np:measure')));
  element.classList.add('is-live');

  const bodyFor = (tool: ToolId): HTMLElement | null => {
    const existing = bodyByTool.get(tool);
    if (existing) return existing;
    const template = element.querySelector<HTMLTemplateElement>(
      `template[data-tool-template="${tool}"]`,
    );
    const body = template?.content.firstElementChild?.cloneNode(true);
    if (!(body instanceof HTMLElement)) return null;
    bodies.append(body);
    body.getBoundingClientRect();
    wireBody(body);
    trackScrollEnd(element, body);
    bodyByTool.set(tool, body);
    body.dispatchEvent(new CustomEvent('np:body', { bubbles: true }));
    return body;
  };

  const renderSelector = (target: InspectTarget) => {
    const tag = document.createElement('b');
    tag.textContent = target.tag;
    selector.replaceChildren(tag, target.className ? `.${target.className}` : '');
  };

  const showTool = (tool: ToolId, target: InspectTarget | null = null) => {
    const body = bodyFor(tool);
    if (!body) return;
    if (tool !== currentTool) {
      bodyByTool.get(currentTool)?.classList.remove('is-active');
      body.classList.add('is-active');
      currentTool = tool;
      element.dataset.tool = currentTool;
      eyebrow.textContent = heads[currentTool]?.eyebrow ?? '';
      title.textContent = heads[currentTool]?.title ?? '';
    }
    const hasSelector = target !== null && !TOOLS_WITHOUT_SELECTOR.has(tool);
    selector.hidden = !hasSelector;
    found.hidden = tool !== 'assets';
    webFont.hidden = tool !== 'font';
    locked.hidden = !isLocked;
    if (target && hasSelector) renderSelector(target);
    if (target) fillBody(body, target);
    requestAnimationFrame(() => body.dispatchEvent(new Event('np:measure')));
  };

  const show = (target: InspectTarget) => showTool(target.tool, target);

  return {
    element,
    show,
    showTool,
    setLocked(next) {
      isLocked = next;
      locked.hidden = !next;
    },
    tool: () => currentTool,
    activeBody: () => bodyByTool.get(currentTool) ?? null,
  };
}
