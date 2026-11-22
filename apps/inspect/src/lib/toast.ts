import { create } from 'zustand';

export type ToastTone = 'info' | 'success' | 'error';

export type ToastItem = { id: number; message: string; tone: ToastTone };

type ToastState = {
  items: readonly ToastItem[];
  dismiss: (id: number) => void;
};

const MAX_VISIBLE = 3;
const VISIBLE_MS = 2400;

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  items: [],
  dismiss: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
}));

export const toast = (message: string, tone: ToastTone = 'info'): number => {
  const id = nextId++;
  useToastStore.setState((state) => ({
    items: [...state.items, { id, message, tone }].slice(-MAX_VISIBLE),
  }));
  setTimeout(() => useToastStore.getState().dismiss(id), VISIBLE_MS);
  return id;
};
