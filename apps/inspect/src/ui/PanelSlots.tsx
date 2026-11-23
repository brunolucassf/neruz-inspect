import { createContext, type ReactNode, useContext } from 'react';
import { createPortal } from 'react-dom';

export type PanelSlotTargets = { meta: HTMLElement | null; actions: HTMLElement | null };

export const PanelSlotsContext = createContext<PanelSlotTargets>({ meta: null, actions: null });

export const PanelMeta = ({ children }: { children: ReactNode }) => {
  const { meta } = useContext(PanelSlotsContext);
  return meta ? createPortal(children, meta) : null;
};

export const PanelActions = ({ children }: { children: ReactNode }) => {
  const { actions } = useContext(PanelSlotsContext);
  return actions ? createPortal(children, actions) : null;
};
