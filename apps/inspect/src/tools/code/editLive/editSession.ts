import { isOverlayElement } from '../../../lib/picker';
import { selectorFor } from '../shared/selector';
import { hasTextChanged, type StyleChangeGroup, type TextChange } from './editLive';

type StyleEntry = { originalValue: string; originalPriority: string; value: string };

const toElement = (node: Node | null): Element | null => {
  if (!node) return null;
  return node instanceof Element ? node : node.parentElement;
};

export class EditSession {
  private readonly textSnapshots = new Map<Element, Node[]>();
  private readonly styleChanges = new Map<HTMLElement, Map<string, StyleEntry>>();
  private readonly listeners = new Set<() => void>();
  private previousContentEditable: string | null = null;
  private previousSpellcheck: string | null = null;
  private editingText = false;
  private cleanupTextListeners: (() => void) | null = null;

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private version = 0;

  get snapshotVersion(): number {
    return this.version;
  }

  private notify(): void {
    this.version += 1;
    for (const listener of this.listeners) listener();
  }

  get isEditingText(): boolean {
    return this.editingText;
  }

  setTextEditing(enabled: boolean): void {
    if (enabled === this.editingText) return;
    this.editingText = enabled;
    const body = document.body;
    if (!enabled) {
      this.cleanupTextListeners?.();
      this.cleanupTextListeners = null;
      this.restoreBodyAttributes(body);
      this.notify();
      return;
    }
    this.previousContentEditable = body.getAttribute('contenteditable');
    this.previousSpellcheck = body.getAttribute('spellcheck');
    body.setAttribute('contenteditable', 'true');
    body.setAttribute('spellcheck', 'false');

    const handleBeforeInput = (): void => {
      const selection = window.getSelection();
      const element = toElement(selection?.anchorNode ?? null);
      if (!element || isOverlayElement(element) || this.textSnapshots.has(element)) return;
      this.textSnapshots.set(
        element,
        Array.from(element.childNodes, (child) => child.cloneNode(true)),
      );
    };
    const handleInput = (): void => this.notify();
    const blockNavigation = (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof Element) || isOverlayElement(target)) return;
      if (target.closest('a[href], button, [role="button"], summary')) event.preventDefault();
    };
    document.addEventListener('beforeinput', handleBeforeInput, true);
    document.addEventListener('input', handleInput, true);
    document.addEventListener('click', blockNavigation, true);
    this.cleanupTextListeners = () => {
      document.removeEventListener('beforeinput', handleBeforeInput, true);
      document.removeEventListener('input', handleInput, true);
      document.removeEventListener('click', blockNavigation, true);
    };
    this.notify();
  }

  private restoreBodyAttributes(body: HTMLElement): void {
    if (this.previousContentEditable === null) body.removeAttribute('contenteditable');
    else body.setAttribute('contenteditable', this.previousContentEditable);
    if (this.previousSpellcheck === null) body.removeAttribute('spellcheck');
    else body.setAttribute('spellcheck', this.previousSpellcheck);
  }

  setStyle(element: HTMLElement, property: string, value: string): void {
    let properties = this.styleChanges.get(element);
    if (!properties) {
      properties = new Map();
      this.styleChanges.set(element, properties);
    }
    const existing = properties.get(property);
    properties.set(property, {
      originalValue: existing?.originalValue ?? element.style.getPropertyValue(property),
      originalPriority: existing?.originalPriority ?? element.style.getPropertyPriority(property),
      value,
    });
    element.style.setProperty(property, value, 'important');
    this.notify();
  }

  getStyleChanges(): StyleChangeGroup[] {
    const groups: StyleChangeGroup[] = [];
    for (const [element, properties] of this.styleChanges) {
      if (!element.isConnected) continue;
      const declarations: Record<string, string> = {};
      for (const [property, entry] of properties) declarations[property] = entry.value;
      groups.push({ selector: selectorFor(element), declarations });
    }
    return groups;
  }

  getTextChanges(): TextChange[] {
    const changes: TextChange[] = [];
    for (const [element, snapshot] of this.textSnapshots) {
      if (!element.isConnected) continue;
      const before = snapshot.map((node) => node.textContent ?? '').join('');
      const after = element.textContent ?? '';
      if (hasTextChanged(before, after)) {
        changes.push({ selector: selectorFor(element), before, after });
      }
    }
    return changes;
  }

  get changeCount(): number {
    return this.getTextChanges().length + this.styleChanges.size;
  }

  undoAll(): void {
    for (const [element, properties] of this.styleChanges) {
      for (const [property, entry] of properties) {
        if (entry.originalValue === '') element.style.removeProperty(property);
        else element.style.setProperty(property, entry.originalValue, entry.originalPriority);
      }
    }
    this.styleChanges.clear();
    const snapshots = Array.from(this.textSnapshots.entries()).reverse();
    for (const [element, nodes] of snapshots) {
      if (element.isConnected)
        element.replaceChildren(...nodes.map((node) => node.cloneNode(true)));
    }
    this.textSnapshots.clear();
    this.notify();
  }

  dispose(): void {
    this.undoAll();
    this.setTextEditing(false);
    this.listeners.clear();
  }
}
