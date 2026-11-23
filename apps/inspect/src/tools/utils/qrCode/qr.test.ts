import { describe, expect, it } from 'vitest';
import {
  alignmentPositions,
  buildDataCodewords,
  byteCapacity,
  dataCodewordCount,
  encodeQr,
  formatBits,
  galoisMultiply,
  interleaveWithErrorCorrection,
  isHexColor,
  QrTooLongError,
  reedSolomonDivisor,
  reedSolomonRemainder,
  toPathData,
  toSvg,
  versionBits,
} from './qr';

const KNOWN_BYTE_CAPACITY_M = [
  14, 26, 42, 62, 84, 106, 122, 152, 180, 213, 251, 287, 331, 362, 412, 450, 504, 560, 624, 666,
  711, 779, 857, 911, 997, 1059, 1125, 1190, 1264, 1370, 1452, 1538, 1628, 1722, 1809, 1911, 1989,
  2099, 2213, 2331,
];

const rowsOf = (text: string): string[] =>
  encodeQr(text).modules.map((row) => row.map((dark) => (dark ? '#' : '.')).join(''));

describe('Galois field and Reed-Solomon', () => {
  it('multiplies in GF(256) with the 0x11D polynomial', () => {
    expect(galoisMultiply(0x02, 0x80)).toBe(0x1d);
    expect(galoisMultiply(1, 77)).toBe(77);
    expect(galoisMultiply(0, 77)).toBe(0);
  });

  it('builds the degree 7 generator from the specification', () => {
    expect(reedSolomonDivisor(7)).toEqual([127, 122, 154, 164, 11, 68, 117]);
  });

  it('computes the known error correction for the HELLO WORLD 1-M example', () => {
    const data = [32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17];
    expect(reedSolomonRemainder(data, reedSolomonDivisor(10))).toEqual([
      196, 35, 39, 119, 235, 215, 231, 226, 93, 23,
    ]);
  });
});

describe('format and version information', () => {
  it('matches the specification for level M', () => {
    expect(formatBits(0)).toBe(0b101010000010010);
    expect(formatBits(1)).toBe(0b101000100100101);
    expect(formatBits(5)).toBe(0b100000011001110);
    expect(formatBits(7)).toBe(0b100101010100000);
  });

  it('matches the version information table', () => {
    expect(versionBits(7)).toBe(0x07c94);
    expect(versionBits(8)).toBe(0x085bc);
    expect(versionBits(40)).toBe(0x28c69);
  });
});

describe('capacity and structure tables', () => {
  it('matches the byte mode capacity of every version at level M', () => {
    for (let version = 1; version <= 40; version += 1) {
      expect(byteCapacity(version), `version ${version}`).toBe(KNOWN_BYTE_CAPACITY_M[version - 1]);
    }
  });

  it('knows the data codeword counts of the first versions', () => {
    expect(dataCodewordCount(1)).toBe(16);
    expect(dataCodewordCount(2)).toBe(28);
    expect(dataCodewordCount(3)).toBe(44);
  });

  it('places alignment patterns like the specification', () => {
    expect(alignmentPositions(1)).toEqual([]);
    expect(alignmentPositions(2)).toEqual([6, 18]);
    expect(alignmentPositions(7)).toEqual([6, 22, 38]);
    expect(alignmentPositions(32)).toEqual([6, 34, 60, 86, 112, 138]);
    expect(alignmentPositions(40)).toEqual([6, 30, 58, 86, 114, 142, 170]);
  });
});

describe('data assembly', () => {
  it('encodes byte mode with terminator and alternating pad bytes', () => {
    const codewords = buildDataCodewords([...new TextEncoder().encode('a')], 1);
    expect(codewords).toHaveLength(16);
    expect(codewords.slice(0, 3)).toEqual([0x40, 0x16, 0x10]);
    expect(codewords.slice(3, 7)).toEqual([0xec, 0x11, 0xec, 0x11]);
  });

  it('interleaves blocks into the full codeword count', () => {
    for (const [version, totalCodewords] of [
      [1, 26],
      [5, 134],
      [10, 346],
      [40, 3706],
    ] as const) {
      const data = buildDataCodewords([...new TextEncoder().encode('block test')], version);
      expect(interleaveWithErrorCorrection(data, version)).toHaveLength(totalCodewords);
    }
  });
});

describe('encodeQr', () => {
  it('chooses the smallest version that fits', () => {
    expect(encodeQr('a').version).toBe(1);
    expect(encodeQr('x'.repeat(14)).version).toBe(1);
    expect(encodeQr('x'.repeat(15)).version).toBe(2);
    expect(encodeQr('x'.repeat(27)).version).toBe(3);
    expect(encodeQr('https://example.com').size).toBe(25);
  });

  it('counts UTF-8 bytes, not characters', () => {
    expect(encodeQr('ééééééééé').version).toBe(2);
  });

  it('throws when the text exceeds version 40', () => {
    expect(() => encodeQr('x'.repeat(2332))).toThrow(QrTooLongError);
    expect(encodeQr('x'.repeat(2331)).version).toBe(40);
  });

  it('draws finder patterns, timing lines and the dark module', () => {
    const { modules, size } = encodeQr('https://example.com');
    for (const [top, left] of [
      [0, 0],
      [0, size - 7],
      [size - 7, 0],
    ] as const) {
      for (let dy = 0; dy < 7; dy += 1) {
        for (let dx = 0; dx < 7; dx += 1) {
          const onRing = dy === 0 || dy === 6 || dx === 0 || dx === 6;
          const inCore = dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4;
          expect(modules[top + dy]?.[left + dx]).toBe(onRing || inCore);
        }
      }
    }
    for (let i = 8; i < size - 8; i += 1) {
      expect(modules[6]?.[i]).toBe(i % 2 === 0);
      expect(modules[i]?.[6]).toBe(i % 2 === 0);
    }
    expect(modules[size - 8]?.[8]).toBe(true);
  });

  it('is deterministic and reproduces a decoder-verified symbol', () => {
    expect(rowsOf('a')).toEqual([
      '#######.#.#.#.#######',
      '#.....#...##..#.....#',
      '#.###.#..##.#.#.###.#',
      '#.###.#.###.#.#.###.#',
      '#.###.#.#...#.#.###.#',
      '#.....#.#.##..#.....#',
      '#######.#.#.#.#######',
      '........#.###........',
      '#...#.######.#####..#',
      '#####..#..###..#.#.##',
      '.#....#..#.#..#####..',
      '.###...####..##.#.##.',
      '####.####.#.###...###',
      '........##..###...##.',
      '#######.##..##.....#.',
      '#.....#..####..#.#.#.',
      '#.###.#.#.##..#######',
      '#.###.#..#.##..#.#.##',
      '#.###.#..#.#..#####..',
      '#.....#..#...##.#.#..',
      '#######.###.###...#.#',
    ]);
    expect(rowsOf('a')).toEqual(rowsOf('a'));
  });
});

describe('vector output', () => {
  it('writes one path command per horizontal run', () => {
    const matrix = {
      version: 1,
      size: 3,
      modules: [
        [true, true, false],
        [false, false, false],
        [true, false, true],
      ],
    };
    expect(toPathData(matrix, 1)).toBe('M1 1h2v1h-2zM1 3h1v1h-1zM3 3h1v1h-1z');
  });

  it('builds a safe svg and ignores invalid colors', () => {
    const matrix = encodeQr('a');
    const svg = toSvg(matrix, { foreground: '#112233', background: '#ffffff' });
    expect(svg).toContain('viewBox="0 0 29 29"');
    expect(svg).toContain('fill="#112233"');
    const unsafe = toSvg(matrix, { foreground: '"><script>', background: 'red' });
    expect(unsafe).not.toContain('script');
    expect(unsafe).toContain('fill="#000000"');
    expect(unsafe).toContain('fill="#ffffff"');
  });

  it('validates hex colors', () => {
    expect(isHexColor('#a1B2c3')).toBe(true);
    expect(isHexColor('#abc')).toBe(false);
    expect(isHexColor('red')).toBe(false);
  });
});
