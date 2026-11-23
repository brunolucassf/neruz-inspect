import { describe, expect, it } from 'vitest';
import {
  CLASSIC_OPENINGS,
  clampCount,
  countWords,
  generateLorem,
  LOREM_LANGUAGES,
  type LoremOptions,
  MAX_COUNT,
} from './lorem';

const seeded = (seed: number) => {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const options = (patch: Partial<LoremOptions>): LoremOptions => ({
  language: 'latin',
  unit: 'paragraphs',
  count: 3,
  startWithClassic: false,
  ...patch,
});

describe('generateLorem', () => {
  it('produces the exact number of words', () => {
    for (const language of LOREM_LANGUAGES) {
      const text = generateLorem(options({ language, unit: 'words', count: 25 }), seeded(1));
      expect(countWords(text)).toBe(25);
      expect(text).not.toMatch(/[.,]/);
    }
  });

  it('produces the exact number of sentences, each capitalised and closed', () => {
    const text = generateLorem(options({ unit: 'sentences', count: 7 }), seeded(2));
    const sentences = text.match(/[^.]+\./g) ?? [];
    expect(sentences).toHaveLength(7);
    for (const sentence of sentences) expect(sentence.trim()).toMatch(/^[A-ZÀ-Ý]/);
  });

  it('produces the exact number of paragraphs separated by blank lines', () => {
    const text = generateLorem(options({ unit: 'paragraphs', count: 4 }), seeded(3));
    const paragraphs = text.split('\n\n');
    expect(paragraphs).toHaveLength(4);
    for (const paragraph of paragraphs) {
      expect(paragraph.length).toBeGreaterThan(40);
      expect(paragraph.endsWith('.')).toBe(true);
    }
  });

  it('starts with the classic opening when asked, in every language', () => {
    for (const language of LOREM_LANGUAGES) {
      const text = generateLorem(options({ language, startWithClassic: true }), seeded(4));
      expect(text.startsWith(CLASSIC_OPENINGS[language])).toBe(true);
    }
    const words = generateLorem(
      options({ unit: 'words', count: 4, startWithClassic: true }),
      seeded(4),
    );
    expect(words).toBe('lorem ipsum dolor sit');
  });

  it('is deterministic for a given random source and never repeats a word back to back', () => {
    const first = generateLorem(options({ unit: 'words', count: 300 }), seeded(9));
    expect(generateLorem(options({ unit: 'words', count: 300 }), seeded(9))).toBe(first);
    const words = first.split(' ');
    words.forEach((word, index) => {
      if (index > 0) expect(word).not.toBe(words[index - 1]);
    });
  });

  it('uses language specific vocabulary', () => {
    const pt = generateLorem(options({ language: 'pt', unit: 'words', count: 400 }), seeded(5));
    expect(pt).toContain('serviço');
    const es = generateLorem(options({ language: 'es', unit: 'words', count: 400 }), seeded(5));
    expect(es).toContain('también');
  });
});

describe('clampCount', () => {
  it('keeps counts inside the allowed range', () => {
    expect(clampCount(0, 'words')).toBe(1);
    expect(clampCount(-5, 'sentences')).toBe(1);
    expect(clampCount(5000, 'words')).toBe(MAX_COUNT.words);
    expect(clampCount(2.9, 'paragraphs')).toBe(2);
    expect(clampCount(Number.NaN, 'paragraphs')).toBe(1);
  });
});
