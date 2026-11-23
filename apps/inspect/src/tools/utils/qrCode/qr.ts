const MIN_VERSION = 1;
const MAX_VERSION = 40;
const ECC_CODEWORDS_PER_BLOCK_M = [
  0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28,
  28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
] as const;
const ERROR_CORRECTION_BLOCKS_M = [
  0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25,
  26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49,
] as const;
const FORMAT_ECC_BITS_M = 0;
const FORMAT_MASK = 0x5412;
const FORMAT_GENERATOR = 0x537;
const VERSION_GENERATOR = 0x1f25;
const PAD_BYTES = [0xec, 0x11] as const;
const QUIET_ZONE = 4;

export type QrMatrix = {
  version: number;
  size: number;
  modules: readonly (readonly boolean[])[];
};

export class QrTooLongError extends Error {
  constructor() {
    super('Text is too long for a QR code with error correction level M');
    this.name = 'QrTooLongError';
  }
}

const utf8Bytes = (text: string): number[] => [...new TextEncoder().encode(text)];

const bitAt = (value: number, index: number): boolean => ((value >>> index) & 1) !== 0;

const rawDataModules = (version: number): number => {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const alignCount = Math.floor(version / 7) + 2;
    result -= (25 * alignCount - 10) * alignCount - 55;
    if (version >= 7) result -= 36;
  }
  return result;
};

const eccPerBlock = (version: number): number => ECC_CODEWORDS_PER_BLOCK_M[version] ?? 0;

const blockCount = (version: number): number => ERROR_CORRECTION_BLOCKS_M[version] ?? 1;

export const dataCodewordCount = (version: number): number =>
  Math.floor(rawDataModules(version) / 8) - eccPerBlock(version) * blockCount(version);

const countBits = (version: number): number => (version <= 9 ? 8 : 16);

export const byteCapacity = (version: number): number =>
  dataCodewordCount(version) - Math.ceil((4 + countBits(version)) / 8);

export const galoisMultiply = (x: number, y: number): number => {
  let product = 0;
  for (let bit = 7; bit >= 0; bit -= 1) {
    product = (product << 1) ^ ((product >>> 7) * 0x11d);
    product ^= ((y >>> bit) & 1) * x;
  }
  return product;
};

export const reedSolomonDivisor = (degree: number): number[] => {
  const result: number[] = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < degree; j += 1) {
      result[j] = galoisMultiply(result[j] ?? 0, root);
      if (j + 1 < degree) result[j] = (result[j] ?? 0) ^ (result[j + 1] ?? 0);
    }
    root = galoisMultiply(root, 0x02);
  }
  return result;
};

export const reedSolomonRemainder = (
  data: readonly number[],
  divisor: readonly number[],
): number[] => {
  const result: number[] = divisor.map(() => 0);
  for (const byte of data) {
    const factor = byte ^ (result.shift() ?? 0);
    result.push(0);
    divisor.forEach((coefficient, index) => {
      result[index] = (result[index] ?? 0) ^ galoisMultiply(coefficient, factor);
    });
  }
  return result;
};

export const buildDataCodewords = (bytes: readonly number[], version: number): number[] => {
  const capacityBits = dataCodewordCount(version) * 8;
  const bits: number[] = [];
  const append = (value: number, length: number): void => {
    for (let index = length - 1; index >= 0; index -= 1) bits.push((value >>> index) & 1);
  };
  append(0b0100, 4);
  append(bytes.length, countBits(version));
  for (const byte of bytes) append(byte, 8);
  append(0, Math.min(4, capacityBits - bits.length));
  append(0, (8 - (bits.length % 8)) % 8);
  const codewords: number[] = [];
  for (let index = 0; index < bits.length; index += 8) {
    codewords.push(bits.slice(index, index + 8).reduce((acc, bit) => (acc << 1) | bit, 0));
  }
  for (let pad = 0; codewords.length < dataCodewordCount(version); pad += 1) {
    codewords.push(PAD_BYTES[pad % 2] ?? 0xec);
  }
  return codewords;
};

export const interleaveWithErrorCorrection = (
  data: readonly number[],
  version: number,
): number[] => {
  const blocks = blockCount(version);
  const eccLength = eccPerBlock(version);
  const rawCodewords = Math.floor(rawDataModules(version) / 8);
  const shortBlocks = blocks - (rawCodewords % blocks);
  const shortBlockLength = Math.floor(rawCodewords / blocks);
  const divisor = reedSolomonDivisor(eccLength);
  const assembled: number[][] = [];
  let offset = 0;
  for (let index = 0; index < blocks; index += 1) {
    const length = shortBlockLength - eccLength + (index < shortBlocks ? 0 : 1);
    const block = data.slice(offset, offset + length);
    offset += length;
    const ecc = reedSolomonRemainder(block, divisor);
    if (index < shortBlocks) block.push(0);
    assembled.push([...block, ...ecc]);
  }
  const result: number[] = [];
  for (let column = 0; column < (assembled[0]?.length ?? 0); column += 1) {
    assembled.forEach((block, row) => {
      if (column !== shortBlockLength - eccLength || row >= shortBlocks) {
        result.push(block[column] ?? 0);
      }
    });
  }
  return result;
};

export const alignmentPositions = (version: number): number[] => {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2;
  const positions = [6];
  for (let position = version * 4 + 10; positions.length < count; position -= step) {
    positions.splice(1, 0, position);
  }
  return positions;
};

export const formatBits = (mask: number): number => {
  const data = (FORMAT_ECC_BITS_M << 3) | mask;
  let remainder = data;
  for (let i = 0; i < 10; i += 1)
    remainder = (remainder << 1) ^ ((remainder >>> 9) * FORMAT_GENERATOR);
  return ((data << 10) | remainder) ^ FORMAT_MASK;
};

export const versionBits = (version: number): number => {
  let remainder = version;
  for (let i = 0; i < 12; i += 1)
    remainder = (remainder << 1) ^ ((remainder >>> 11) * VERSION_GENERATOR);
  return (version << 12) | remainder;
};

type Grid = { size: number; dark: boolean[][]; reserved: boolean[][] };

const createGrid = (size: number): Grid => ({
  size,
  dark: Array.from({ length: size }, () => new Array<boolean>(size).fill(false)),
  reserved: Array.from({ length: size }, () => new Array<boolean>(size).fill(false)),
});

const setFunction = (grid: Grid, x: number, y: number, isDark: boolean): void => {
  const darkRow = grid.dark[y];
  const reservedRow = grid.reserved[y];
  if (!darkRow || !reservedRow) return;
  darkRow[x] = isDark;
  reservedRow[x] = true;
};

const drawFinder = (grid: Grid, centerX: number, centerY: number): void => {
  for (let dy = -4; dy <= 4; dy += 1) {
    for (let dx = -4; dx <= 4; dx += 1) {
      const distance = Math.max(Math.abs(dx), Math.abs(dy));
      const x = centerX + dx;
      const y = centerY + dy;
      if (x >= 0 && x < grid.size && y >= 0 && y < grid.size) {
        setFunction(grid, x, y, distance !== 2 && distance !== 4);
      }
    }
  }
};

const drawAlignment = (grid: Grid, centerX: number, centerY: number): void => {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      setFunction(grid, centerX + dx, centerY + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }
};

const drawFormat = (grid: Grid, mask: number): void => {
  const bits = formatBits(mask);
  const { size } = grid;
  for (let i = 0; i <= 5; i += 1) setFunction(grid, 8, i, bitAt(bits, i));
  setFunction(grid, 8, 7, bitAt(bits, 6));
  setFunction(grid, 8, 8, bitAt(bits, 7));
  setFunction(grid, 7, 8, bitAt(bits, 8));
  for (let i = 9; i < 15; i += 1) setFunction(grid, 14 - i, 8, bitAt(bits, i));
  for (let i = 0; i < 8; i += 1) setFunction(grid, size - 1 - i, 8, bitAt(bits, i));
  for (let i = 8; i < 15; i += 1) setFunction(grid, 8, size - 15 + i, bitAt(bits, i));
  setFunction(grid, 8, size - 8, true);
};

const drawVersion = (grid: Grid, version: number): void => {
  if (version < 7) return;
  const bits = versionBits(version);
  for (let i = 0; i < 18; i += 1) {
    const isDark = bitAt(bits, i);
    const a = grid.size - 11 + (i % 3);
    const b = Math.floor(i / 3);
    setFunction(grid, a, b, isDark);
    setFunction(grid, b, a, isDark);
  }
};

const drawFunctionPatterns = (grid: Grid, version: number): void => {
  const { size } = grid;
  for (let i = 0; i < size; i += 1) {
    setFunction(grid, 6, i, i % 2 === 0);
    setFunction(grid, i, 6, i % 2 === 0);
  }
  drawFinder(grid, 3, 3);
  drawFinder(grid, size - 4, 3);
  drawFinder(grid, 3, size - 4);
  const positions = alignmentPositions(version);
  const last = positions.length - 1;
  positions.forEach((x, i) => {
    positions.forEach((y, j) => {
      const isCorner = (i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0);
      if (!isCorner) drawAlignment(grid, x, y);
    });
  });
  drawFormat(grid, 0);
  drawVersion(grid, version);
};

const placeCodewords = (grid: Grid, codewords: readonly number[]): void => {
  const { size } = grid;
  let bitIndex = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    const column = right === 6 ? 5 : right;
    for (let vertical = 0; vertical < size; vertical += 1) {
      for (let j = 0; j < 2; j += 1) {
        const x = column - j;
        const isUpward = ((column + 1) & 2) === 0;
        const y = isUpward ? size - 1 - vertical : vertical;
        const row = grid.dark[y];
        if (!row || grid.reserved[y]?.[x] || bitIndex >= codewords.length * 8) continue;
        row[x] = bitAt(codewords[bitIndex >>> 3] ?? 0, 7 - (bitIndex & 7));
        bitIndex += 1;
      }
    }
  }
};

const maskApplies = (mask: number, x: number, y: number): boolean => {
  switch (mask) {
    case 0:
      return (x + y) % 2 === 0;
    case 1:
      return y % 2 === 0;
    case 2:
      return x % 3 === 0;
    case 3:
      return (x + y) % 3 === 0;
    case 4:
      return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
    case 5:
      return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6:
      return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    default:
      return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
  }
};

const applyMask = (grid: Grid, mask: number): void => {
  for (let y = 0; y < grid.size; y += 1) {
    for (let x = 0; x < grid.size; x += 1) {
      const row = grid.dark[y];
      if (row && !grid.reserved[y]?.[x] && maskApplies(mask, x, y)) row[x] = !row[x];
    }
  }
};

const FINDER_LIKE_A = [true, false, true, true, true, false, true, false, false, false, false];
const FINDER_LIKE_B = [false, false, false, false, true, false, true, true, true, false, true];

const matchesAt = (line: readonly boolean[], start: number, pattern: readonly boolean[]): boolean =>
  pattern.every((value, offset) => line[start + offset] === value);

const linePenalty = (line: readonly boolean[]): number => {
  let penalty = 0;
  let run = 1;
  for (let i = 1; i <= line.length; i += 1) {
    if (i < line.length && line[i] === line[i - 1]) run += 1;
    else {
      if (run >= 5) penalty += 3 + (run - 5);
      run = 1;
    }
  }
  for (let i = 0; i + FINDER_LIKE_A.length <= line.length; i += 1) {
    if (matchesAt(line, i, FINDER_LIKE_A)) penalty += 40;
    if (matchesAt(line, i, FINDER_LIKE_B)) penalty += 40;
  }
  return penalty;
};

const penaltyScore = (grid: Grid): number => {
  const { size, dark } = grid;
  let penalty = 0;
  let darkCount = 0;
  for (let y = 0; y < size; y += 1) {
    const row = dark[y] ?? [];
    penalty += linePenalty(row);
    penalty += linePenalty(dark.map((line) => line[y] ?? false));
    for (let x = 0; x < size; x += 1) {
      if (row[x]) darkCount += 1;
      if (x + 1 < size && y + 1 < size) {
        const color = row[x];
        const next = dark[y + 1] ?? [];
        if (color === row[x + 1] && color === next[x] && color === next[x + 1]) penalty += 3;
      }
    }
  }
  const total = size * size;
  const deviation = Math.ceil(Math.abs(darkCount * 20 - total * 10) / total) - 1;
  return penalty + Math.max(0, deviation) * 10;
};

const chooseVersion = (byteLengthOfText: number): number => {
  for (let version = MIN_VERSION; version <= MAX_VERSION; version += 1) {
    if (byteLengthOfText <= byteCapacity(version)) return version;
  }
  throw new QrTooLongError();
};

export const encodeQr = (text: string): QrMatrix => {
  const bytes = utf8Bytes(text);
  const version = chooseVersion(bytes.length);
  const codewords = interleaveWithErrorCorrection(buildDataCodewords(bytes, version), version);
  const size = version * 4 + 17;
  const grid = createGrid(size);
  drawFunctionPatterns(grid, version);
  placeCodewords(grid, codewords);

  let bestMask = 0;
  let bestPenalty = Number.POSITIVE_INFINITY;
  for (let mask = 0; mask < 8; mask += 1) {
    applyMask(grid, mask);
    drawFormat(grid, mask);
    const penalty = penaltyScore(grid);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMask = mask;
    }
    applyMask(grid, mask);
  }
  applyMask(grid, bestMask);
  drawFormat(grid, bestMask);
  return { version, size, modules: grid.dark };
};

export const isHexColor = (value: string): boolean => /^#[0-9a-f]{6}$/i.test(value);

export const toPathData = (matrix: QrMatrix, margin = QUIET_ZONE): string => {
  const commands: string[] = [];
  matrix.modules.forEach((row, y) => {
    let x = 0;
    while (x < matrix.size) {
      if (!row[x]) {
        x += 1;
        continue;
      }
      let end = x;
      while (end < matrix.size && row[end]) end += 1;
      commands.push(`M${x + margin} ${y + margin}h${end - x}v1h-${end - x}z`);
      x = end;
    }
  });
  return commands.join('');
};

export const toSvg = (
  matrix: QrMatrix,
  options: { foreground: string; background: string; margin?: number },
): string => {
  const margin = options.margin ?? QUIET_ZONE;
  const total = matrix.size + margin * 2;
  const foreground = isHexColor(options.foreground) ? options.foreground : '#000000';
  const background = isHexColor(options.background) ? options.background : '#ffffff';
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total * 8}" height="${total * 8}" shape-rendering="crispEdges">`,
    `<rect width="${total}" height="${total}" fill="${background}"/>`,
    `<path d="${toPathData(matrix, margin)}" fill="${foreground}"/>`,
    '</svg>',
  ].join('');
};

export const QR_QUIET_ZONE = QUIET_ZONE;
