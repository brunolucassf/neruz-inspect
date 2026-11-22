export type VitalMetric = 'lcp' | 'cls' | 'inp' | 'fcp' | 'ttfb';

export type VitalRating = 'good' | 'needs-improvement' | 'poor';

export const VITAL_THRESHOLDS: Record<VitalMetric, readonly [number, number]> = {
  lcp: [2500, 4000],
  cls: [0.1, 0.25],
  inp: [200, 500],
  fcp: [1800, 3000],
  ttfb: [800, 1800],
};

export const classifyVital = (metric: VitalMetric, value: number): VitalRating => {
  const [good, poor] = VITAL_THRESHOLDS[metric];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
};

export const formatVital = (metric: VitalMetric, value: number): string => {
  if (metric === 'cls') return value.toFixed(3);
  return value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${Math.round(value)} ms`;
};

export const vitalFill = (metric: VitalMetric, value: number): number => {
  const [, poor] = VITAL_THRESHOLDS[metric];
  return Math.min(value / (poor * 1.5), 1);
};

type ShiftLike = { value: number; startTime: number; hadRecentInput: boolean };

const SESSION_GAP_MS = 1000;
const SESSION_MAX_MS = 5000;

export const computeCls = <TShift extends ShiftLike>(
  shifts: readonly TShift[],
): { value: number; worst: TShift[] } => {
  let best: { value: number; items: TShift[] } = { value: 0, items: [] };
  let current: { value: number; items: TShift[] } = { value: 0, items: [] };
  let sessionStart = 0;
  let previousStart = 0;
  for (const shift of shifts) {
    if (shift.hadRecentInput) continue;
    const startsNewSession =
      current.items.length === 0 ||
      shift.startTime - previousStart > SESSION_GAP_MS ||
      shift.startTime - sessionStart > SESSION_MAX_MS;
    if (startsNewSession) {
      current = { value: 0, items: [] };
      sessionStart = shift.startTime;
    }
    current.value += shift.value;
    current.items.push(shift);
    previousStart = shift.startTime;
    if (current.value > best.value) best = { value: current.value, items: [...current.items] };
  }
  return { value: best.value, worst: best.items };
};

type InteractionLike = { interactionId: number; duration: number };

export const computeInp = <TEntry extends InteractionLike>(
  entries: readonly TEntry[],
): { value: number; slowest: TEntry[] } | null => {
  const longestById = new Map<number, TEntry>();
  for (const entry of entries) {
    if (entry.interactionId <= 0) continue;
    const known = longestById.get(entry.interactionId);
    if (!known || entry.duration > known.duration) longestById.set(entry.interactionId, entry);
  }
  const slowest = [...longestById.values()].sort((a, b) => b.duration - a.duration);
  if (slowest.length === 0) return null;
  const index = Math.min(slowest.length - 1, Math.floor(slowest.length / 50));
  return { value: (slowest[index] as TEntry).duration, slowest };
};

export type ResourceGroup = 'script' | 'style' | 'image' | 'font' | 'fetch' | 'media' | 'other';

export const RESOURCE_GROUPS: readonly ResourceGroup[] = [
  'script',
  'style',
  'image',
  'font',
  'fetch',
  'media',
  'other',
];

type ResourceLike = {
  name: string;
  initiatorType: string;
  transferSize?: number;
  encodedBodySize?: number;
};

export const categorizeResource = (
  entry: Pick<ResourceLike, 'name' | 'initiatorType'>,
): ResourceGroup => {
  const path = (() => {
    try {
      return new URL(entry.name).pathname.toLowerCase();
    } catch {
      return entry.name.toLowerCase();
    }
  })();
  if (/\.(woff2?|ttf|otf|eot)$/.test(path)) return 'font';
  if (entry.initiatorType === 'script' || /\.m?js$/.test(path)) return 'script';
  if (/\.css$/.test(path) || entry.initiatorType === 'link') return 'style';
  if (entry.initiatorType === 'img' || /\.(png|jpe?g|gif|webp|avif|svg|ico|bmp)$/.test(path)) {
    return 'image';
  }
  if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') return 'fetch';
  if (entry.initiatorType === 'video' || entry.initiatorType === 'audio') return 'media';
  return 'other';
};

export type ResourceSummary = {
  groups: Record<ResourceGroup, { count: number; bytes: number }>;
  totalCount: number;
  totalBytes: number;
};

export const summarizeResources = (entries: readonly ResourceLike[]): ResourceSummary => {
  const groups = Object.fromEntries(
    RESOURCE_GROUPS.map((group) => [group, { count: 0, bytes: 0 }]),
  ) as ResourceSummary['groups'];
  let totalBytes = 0;
  for (const entry of entries) {
    const bytes = entry.transferSize || entry.encodedBodySize || 0;
    const group = groups[categorizeResource(entry)];
    group.count += 1;
    group.bytes += bytes;
    totalBytes += bytes;
  }
  return { groups, totalCount: entries.length, totalBytes };
};

export const classifyDomSize = (nodes: number): VitalRating => {
  if (nodes <= 800) return 'good';
  if (nodes <= 1400) return 'needs-improvement';
  return 'poor';
};
