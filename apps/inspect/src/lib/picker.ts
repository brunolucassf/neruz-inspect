import { useCallback, useEffect, useRef, useState } from 'react';

export const OVERLAY_HOST_TAG = 'neruz-inspect';

const BLOCKED_POINTER_EVENTS = [
  'pointerdown',
  'pointerup',
  'mousedown',
  'mouseup',
  'auxclick',
  'dblclick',
  'contextmenu',
] as const;

let activeLocks = 0;

export const isPickerLocked = (): boolean => activeLocks > 0;

export const isOverlayElement = (target: EventTarget | null): boolean =>
  target instanceof Element && target.localName === OVERLAY_HOST_TAG;

export const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return target.matches('input, textarea, select');
};

export const getElementLabel = (element: Element): string => {
  const tag = element.localName;
  const id = element.id ? `#${element.id}` : '';
  const classes = Array.from(element.classList)
    .slice(0, 2)
    .map((name) => `.${name}`)
    .join('');
  return `${tag}${id}${classes}`;
};

const toPageElement = (target: EventTarget | null): Element | null =>
  target instanceof Element && !isOverlayElement(target) ? target : null;

export type HoverOptions = { enabled?: boolean };

export const useHoverElement = ({ enabled = true }: HoverOptions = {}): Element | null => {
  const [hovered, setHovered] = useState<Element | null>(null);

  useEffect(() => {
    if (!enabled) {
      setHovered(null);
      return;
    }
    let frame = 0;
    let latest: Element | null = null;
    const flush = (): void => {
      frame = 0;
      setHovered((current) => (current === latest ? current : latest));
    };
    const handleMove = (event: MouseEvent): void => {
      const element = toPageElement(event.target);
      if (!element) return;
      latest = element;
      if (!frame) frame = requestAnimationFrame(flush);
    };
    window.addEventListener('mousemove', handleMove, { capture: true, passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('mousemove', handleMove, { capture: true });
    };
  }, [enabled]);

  return hovered;
};

export type ElementPicker = {
  hovered: Element | null;
  locked: Element | null;
  unlock: () => void;
};

export const useElementPicker = ({ enabled = true }: HoverOptions = {}): ElementPicker => {
  const hovered = useHoverElement({ enabled });
  const [locked, setLocked] = useState<Element | null>(null);
  const hoveredRef = useRef<Element | null>(null);
  hoveredRef.current = hovered;
  const lockedRef = useRef<Element | null>(null);
  lockedRef.current = locked;

  const unlock = useCallback(() => setLocked(null), []);

  useEffect(() => {
    if (!enabled) return;
    const swallow = (event: Event): void => {
      if (isOverlayElement(event.target)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const handleClick = (event: MouseEvent): void => {
      const element = toPageElement(event.target);
      if (!element) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const picked = hoveredRef.current ?? element;
      setLocked((current) => (current === picked ? null : picked));
    };
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || !lockedRef.current) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setLocked(null);
    };
    for (const type of BLOCKED_POINTER_EVENTS) window.addEventListener(type, swallow, true);
    window.addEventListener('click', handleClick, true);
    window.addEventListener('keydown', handleKey, true);
    return () => {
      for (const type of BLOCKED_POINTER_EVENTS) window.removeEventListener(type, swallow, true);
      window.removeEventListener('click', handleClick, true);
      window.removeEventListener('keydown', handleKey, true);
    };
  }, [enabled]);

  useEffect(() => {
    if (!locked) return;
    activeLocks += 1;
    return () => {
      activeLocks -= 1;
    };
  }, [locked]);

  useEffect(() => {
    if (!enabled) setLocked(null);
  }, [enabled]);

  return { hovered, locked, unlock };
};
