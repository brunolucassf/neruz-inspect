import { isOverlayElement } from '../../../lib/picker';
import { computeCls, computeInp, type ResourceSummary, summarizeResources } from './vitalsMath';

type LayoutShiftSource = { node: Node | null };

type LayoutShiftEntry = PerformanceEntry & {
  value: number;
  hadRecentInput: boolean;
  sources?: LayoutShiftSource[];
};

type LargestPaintEntry = PerformanceEntry & {
  element: Element | null;
  size: number;
  url: string;
};

type EventEntry = PerformanceEntry & {
  interactionId: number;
  target: Node | null;
};

export type LayoutShiftInfo = {
  value: number;
  startTime: number;
  hadRecentInput: boolean;
  elements: Element[];
};

export type InteractionInfo = {
  interactionId: number;
  duration: number;
  name: string;
  target: Element | null;
};

export type VitalsSnapshot = {
  lcp: { value: number; element: Element | null; url: string; size: number } | null;
  cls: { value: number; shifts: LayoutShiftInfo[] };
  inp: { value: number; interactions: InteractionInfo[] } | null;
  fcp: number | null;
  ttfb: number | null;
  resources: ResourceSummary;
  domNodes: number;
};

const MAX_EVENTS = 600;
const MAX_SHIFTS = 400;
const EVENT_DURATION_THRESHOLD_MS = 16;

const toElement = (node: Node | null | undefined): Element | null =>
  node instanceof Element ? node : (node?.parentElement ?? null);

export type VitalsCollector = {
  snapshot: () => VitalsSnapshot;
  stop: () => void;
};

export const createVitalsCollector = (onChange: () => void): VitalsCollector => {
  let lcpEntry: LargestPaintEntry | null = null;
  let fcp: number | null = null;
  const shifts: LayoutShiftInfo[] = [];
  const interactions: InteractionInfo[] = [];
  const observers: PerformanceObserver[] = [];

  const observe = (
    type: string,
    handle: (entries: PerformanceEntryList) => void,
    extra: Record<string, unknown> = {},
  ): void => {
    try {
      const observer = new PerformanceObserver((list) => {
        handle(list.getEntries());
        onChange();
      });
      observer.observe({ type, buffered: true, ...extra } as PerformanceObserverInit);
      observers.push(observer);
    } catch {}
  };

  observe('largest-contentful-paint', (entries) => {
    const last = entries.at(-1);
    if (last) lcpEntry = last as LargestPaintEntry;
  });

  observe('layout-shift', (entries) => {
    for (const entry of entries as LayoutShiftEntry[]) {
      if (shifts.length >= MAX_SHIFTS) break;
      shifts.push({
        value: entry.value,
        startTime: entry.startTime,
        hadRecentInput: entry.hadRecentInput,
        elements: (entry.sources ?? [])
          .map((source) => toElement(source.node))
          .filter((element): element is Element => element !== null),
      });
    }
  });

  observe(
    'event',
    (entries) => {
      for (const entry of entries as EventEntry[]) {
        const target = toElement(entry.target);
        if (isOverlayElement(target)) continue;
        if (entry.interactionId > 0 && interactions.length < MAX_EVENTS) {
          interactions.push({
            interactionId: entry.interactionId,
            duration: entry.duration,
            name: entry.name,
            target,
          });
        }
      }
    },
    { durationThreshold: EVENT_DURATION_THRESHOLD_MS },
  );

  observe('paint', (entries) => {
    const paint = entries.find((entry) => entry.name === 'first-contentful-paint');
    if (paint) fcp = paint.startTime;
  });

  const snapshot = (): VitalsSnapshot => {
    const navigation = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    const cls = computeCls(shifts);
    const inp = computeInp(interactions);
    return {
      lcp: lcpEntry
        ? {
            value: lcpEntry.startTime,
            element: lcpEntry.element?.isConnected ? lcpEntry.element : null,
            url: lcpEntry.url,
            size: lcpEntry.size,
          }
        : null,
      cls: { value: cls.value, shifts: cls.worst },
      inp: inp ? { value: inp.value, interactions: inp.slowest.slice(0, 8) } : null,
      fcp,
      ttfb: navigation ? navigation.responseStart : null,
      resources: summarizeResources(
        performance.getEntriesByType('resource') as PerformanceResourceTiming[],
      ),
      domNodes: document.getElementsByTagName('*').length,
    };
  };

  return {
    snapshot,
    stop: () => {
      for (const observer of observers) observer.disconnect();
    },
  };
};

const SETTLE_MS = 150;

export const analyzeVitals = async (_doc: Document): Promise<VitalsSnapshot> => {
  const collector = createVitalsCollector(() => undefined);
  await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
  const snapshot = collector.snapshot();
  collector.stop();
  return snapshot;
};
