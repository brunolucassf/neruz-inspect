import { useCallback, useEffect, useRef, useState } from 'react';
import { OVERLAY_HOST_TAG } from '../../../lib/picker';

export const SCAN_LIMIT = 5000;

const SLICE_BUDGET_MS = 8;
const IDLE_TIMEOUT_MS = 120;

export type CollectedElements = { elements: Element[]; total: number };

export const collectPageElements = (limit: number = SCAN_LIMIT): CollectedElements => {
  if (!document.body) return { elements: [], total: 0 };
  const all = document.body.querySelectorAll('*');
  const elements: Element[] = [];
  for (let index = 0; index < all.length && elements.length < limit; index += 1) {
    const element = all[index];
    if (element && element.localName !== OVERLAY_HOST_TAG) elements.push(element);
  }
  const ownHosts = document.body.querySelectorAll(OVERLAY_HOST_TAG).length;
  return { elements, total: all.length - ownHosts };
};

const waitForIdle = (): Promise<void> =>
  new Promise((resolve) => {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => resolve(), { timeout: IDLE_TIMEOUT_MS });
    } else {
      setTimeout(resolve, 0);
    }
  });

export const scanInSlices = async <T>(
  elements: readonly Element[],
  visit: (element: Element) => T | null,
  isCancelled: () => boolean,
): Promise<T[] | null> => {
  const results: T[] = [];
  let index = 0;
  while (index < elements.length) {
    const deadline = performance.now() + SLICE_BUDGET_MS;
    while (index < elements.length && performance.now() < deadline) {
      const element = elements[index];
      index += 1;
      if (!element) continue;
      const result = visit(element);
      if (result !== null) results.push(result);
    }
    if (index < elements.length) {
      await waitForIdle();
      if (isCancelled()) return null;
    }
  }
  return results;
};

export type ScanState<T> =
  | { status: 'loading' }
  | { status: 'ready'; items: T[]; truncated: boolean };

export const useElementScan = <T>(
  visit: (element: Element) => T | null,
): { state: ScanState<T>; rescan: () => void } => {
  const visitRef = useRef(visit);
  visitRef.current = visit;
  const [run, setRun] = useState(0);
  const [state, setState] = useState<ScanState<T>>({ status: 'loading' });

  // biome-ignore lint/correctness/useExhaustiveDependencies: run restarts the scan on demand
  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    const { elements, total } = collectPageElements();
    void scanInSlices(
      elements,
      (element) => visitRef.current(element),
      () => cancelled,
    ).then((items) => {
      if (cancelled || !items) return;
      setState({ status: 'ready', items, truncated: total > elements.length });
    });
    return () => {
      cancelled = true;
    };
  }, [run]);

  const rescan = useCallback(() => setRun((current) => current + 1), []);
  return { state, rescan };
};

export const isVisibleRect = (rect: { width: number; height: number }): boolean =>
  rect.width > 0 && rect.height > 0;

export const revealElement = (element: Element): void => {
  element.scrollIntoView({ block: 'center', inline: 'center' });
};
