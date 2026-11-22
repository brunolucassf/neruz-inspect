import { describe, expect, it } from 'vitest';
import {
  documentOverflowAmount,
  isHorizontalClipValue,
  type OverflowCandidate,
  rankOverflow,
} from './overflow';

const candidate = (id: number, documentRight: number, depth = 1): OverflowCandidate => ({
  id,
  label: `el${id}`,
  documentRight,
  width: 100,
  depth,
});

describe('rankOverflow', () => {
  it('keeps only elements past the viewport and sorts by excess', () => {
    const ranked = rankOverflow([candidate(1, 380), candidate(2, 520), candidate(3, 400)], 400, 10);
    expect(ranked.map((item) => item.id)).toEqual([2]);
    expect(ranked[0]?.excess).toBe(120);
  });

  it('orders descending by excess', () => {
    const ranked = rankOverflow([candidate(1, 450), candidate(2, 700), candidate(3, 500)], 400, 10);
    expect(ranked.map((item) => item.id)).toEqual([2, 3, 1]);
  });

  it('prefers the deeper element on a tie', () => {
    const ranked = rankOverflow([candidate(1, 500, 1), candidate(2, 500, 4)], 400, 10);
    expect(ranked.map((item) => item.id)).toEqual([2, 1]);
  });

  it('ignores sub-pixel rounding noise', () => {
    expect(rankOverflow([candidate(1, 400.3)], 400, 10)).toEqual([]);
  });

  it('respects the limit', () => {
    const many = Array.from({ length: 30 }, (_, index) => candidate(index, 500 + index));
    expect(rankOverflow(many, 400, 5)).toHaveLength(5);
  });
});

describe('documentOverflowAmount', () => {
  it('returns the horizontal excess or zero', () => {
    expect(documentOverflowAmount(520, 400)).toBe(120);
    expect(documentOverflowAmount(400, 400)).toBe(0);
    expect(documentOverflowAmount(390, 400)).toBe(0);
  });
});

describe('isHorizontalClipValue', () => {
  it('detects values that contain overflow', () => {
    expect(isHorizontalClipValue('hidden')).toBe(true);
    expect(isHorizontalClipValue('visible')).toBe(false);
  });
});
