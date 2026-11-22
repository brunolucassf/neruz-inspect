import { useEffect, useState } from 'react';
import { create } from 'zustand';

export type ViewportRect = { x: number; y: number; width: number; height: number };

export type HighlightKind = 'box' | 'margin' | 'padding' | 'line' | 'label' | 'grid';

export type HighlightItem = {
  kind: HighlightKind;
  rect: ViewportRect;
  hole?: ViewportRect;
  text?: string;
};

type HighlightState = {
  items: readonly HighlightItem[];
  setHighlights: (items: readonly HighlightItem[]) => void;
  clearHighlights: () => void;
};

export const useHighlightStore = create<HighlightState>((set) => ({
  items: [],
  setHighlights: (items) => set({ items }),
  clearHighlights: () => set({ items: [] }),
}));

export const setHighlights = (items: readonly HighlightItem[]): void =>
  useHighlightStore.getState().setHighlights(items);

export const clearHighlights = (): void => useHighlightStore.getState().clearHighlights();

export const getViewportRect = (element: Element): ViewportRect => {
  const { x, y, width, height } = element.getBoundingClientRect();
  return { x, y, width, height };
};

export const useHighlights = (items: readonly HighlightItem[]): void => {
  useEffect(() => {
    setHighlights(items);
    return clearHighlights;
  }, [items]);
};

export const useViewportVersion = (): number => {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let frame = 0;
    const schedule = (): void => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setVersion((current) => current + 1);
      });
    };
    window.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule, { capture: true });
      window.removeEventListener('resize', schedule);
    };
  }, []);
  return version;
};
