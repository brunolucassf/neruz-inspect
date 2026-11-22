export type OverflowCandidate = {
  id: number;
  label: string;
  documentRight: number;
  width: number;
  depth: number;
};

export type OverflowCulprit = OverflowCandidate & { excess: number };

const TOLERANCE_PX = 0.5;

export const rankOverflow = (
  candidates: readonly OverflowCandidate[],
  viewportWidth: number,
  limit: number,
): OverflowCulprit[] =>
  candidates
    .map((candidate) => ({ ...candidate, excess: candidate.documentRight - viewportWidth }))
    .filter((candidate) => candidate.excess > TOLERANCE_PX)
    .sort((a, b) => b.excess - a.excess || b.depth - a.depth || a.id - b.id)
    .slice(0, limit);

export const documentOverflowAmount = (scrollWidth: number, viewportWidth: number): number =>
  Math.max(0, scrollWidth - viewportWidth);

export const isHorizontalClipValue = (value: string): boolean =>
  value === 'hidden' || value === 'clip' || value === 'auto' || value === 'scroll';
