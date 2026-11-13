/**
 * src/core/share/qrCodeEncoder.ts
 *
 * Pure TypeScript ISO/IEC 18004 Standard QR Code Matrix Encoder (Byte Mode, UTF-8).
 * Zero external dependencies — supports Versions 1–14 (ECC Level M) for crisp,
 * instant mobile camera & WeChat "识别图中二维码" recognition.
 */

export interface QrMatrix {
  version: number;
  size: number;
  modules: boolean[][];
}

interface VersionSpecM {
  version: number;
  totalCodewords: number;
  ecPerBlock: number;
  g1Blocks: number;
  g1DataCodewords: number;
  g2Blocks: number;
  g2DataCodewords: number;
  alignmentCoords: number[];
}

// ISO/IEC 18004 Table 9 & Annex E specifications for Error Correction Level M (15% recovery)
const VERSION_SPECS_M: VersionSpecM[] = [
  { version: 1, totalCodewords: 26, ecPerBlock: 10, g1Blocks: 1, g1DataCodewords: 16, g2Blocks: 0, g2DataCodewords: 0, alignmentCoords: [] },
  { version: 2, totalCodewords: 44, ecPerBlock: 16, g1Blocks: 1, g1DataCodewords: 28, g2Blocks: 0, g2DataCodewords: 0, alignmentCoords: [6, 18] },
  { version: 3, totalCodewords: 70, ecPerBlock: 26, g1Blocks: 1, g1DataCodewords: 44, g2Blocks: 0, g2DataCodewords: 0, alignmentCoords: [6, 22] },
  { version: 4, totalCodewords: 100, ecPerBlock: 18, g1Blocks: 2, g1DataCodewords: 32, g2Blocks: 0, g2DataCodewords: 0, alignmentCoords: [6, 26] },
  { version: 5, totalCodewords: 134, ecPerBlock: 24, g1Blocks: 2, g1DataCodewords: 43, g2Blocks: 0, g2DataCodewords: 0, alignmentCoords: [6, 30] },
  { version: 6, totalCodewords: 172, ecPerBlock: 16, g1Blocks: 4, g1DataCodewords: 27, g2Blocks: 0, g2DataCodewords: 0, alignmentCoords: [6, 34] },
  { version: 7, totalCodewords: 196, ecPerBlock: 18, g1Blocks: 4, g1DataCodewords: 31, g2Blocks: 0, g2DataCodewords: 0, alignmentCoords: [6, 22, 38] },
  { version: 8, totalCodewords: 242, ecPerBlock: 22, g1Blocks: 2, g1DataCodewords: 38, g2Blocks: 2, g2DataCodewords: 39, alignmentCoords: [6, 24, 42] },
  { version: 9, totalCodewords: 292, ecPerBlock: 22, g1Blocks: 3, g1DataCodewords: 36, g2Blocks: 2, g2DataCodewords: 37, alignmentCoords: [6, 26, 46] },
  { version: 10, totalCodewords: 346, ecPerBlock: 26, g1Blocks: 4, g1DataCodewords: 43, g2Blocks: 1, g2DataCodewords: 44, alignmentCoords: [6, 28, 50] },
  { version: 11, totalCodewords: 404, ecPerBlock: 30, g1Blocks: 1, g1DataCodewords: 50, g2Blocks: 4, g2DataCodewords: 51, alignmentCoords: [6, 30, 54] },
  { version: 12, totalCodewords: 466, ecPerBlock: 22, g1Blocks: 6, g1DataCodewords: 36, g2Blocks: 2, g2DataCodewords: 37, alignmentCoords: [6, 32, 58] },
  { version: 13, totalCodewords: 532, ecPerBlock: 22, g1Blocks: 8, g1DataCodewords: 37, g2Blocks: 1, g2DataCodewords: 38, alignmentCoords: [6, 34, 62] },
  { version: 14, totalCodewords: 581, ecPerBlock: 24, g1Blocks: 4, g1DataCodewords: 40, g2Blocks: 5, g2DataCodewords: 41, alignmentCoords: [6, 26, 46, 66] },
];

// GF(256) lookup tables with primitive polynomial x^8 + x^4 + x^3 + x^2 + 1 (0x11D)
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d;
    }
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function buildReedSolomonGenerator(degree: number): Uint8Array {
  let poly: Uint8Array = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const root = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], root);
    }
    poly = next;
  }
  return poly;
}

function computeReedSolomonEcBytes(data: Uint8Array, ecDegree: number): Uint8Array {
  const gen = buildReedSolomonGenerator(ecDegree);
  const rem = new Uint8Array(ecDegree);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ rem[0];
    rem.copyWithin(0, 1);
    rem[ecDegree - 1] = 0;
    if (factor !== 0) {
      for (let j = 0; j < ecDegree; j++) {
        rem[j] ^= gfMul(gen[j + 1], factor);
      }
    }
  }
  return rem;
}

function appendBits(bits: number[], val: number, bitLen: number): void {
  for (let i = bitLen - 1; i >= 0; i--) {
    bits.push((val >>> i) & 1);
  }
}

function selectSpecForPayload(byteLen: number): VersionSpecM {
  for (const spec of VERSION_SPECS_M) {
    const dataCapacityBytes =
      spec.g1Blocks * spec.g1DataCodewords + spec.g2Blocks * spec.g2DataCodewords;
    const countIndicatorBits = spec.version <= 9 ? 8 : 16;
    const neededBits = 4 + countIndicatorBits + byteLen * 8;
    if (neededBits <= dataCapacityBytes * 8) {
      return spec;
    }
  }
  throw new Error(`二维码链接长度超出上限 (${byteLen} bytes)`);
}

function computeFormatBitsM(maskPattern: number): number {
  // ECC Level M format indicator is 00
  const data = (0b00 << 3) | (maskPattern & 0x07);
  let rem = data << 10;
  for (let i = 14; i >= 10; i--) {
    if ((rem >>> i) & 1) {
      rem ^= 0x537 << (i - 10);
    }
  }
  return ((data << 10) | rem) ^ 0x5412;
}

function computeVersionBits(version: number): number {
  let rem = version << 12;
  for (let i = 17; i >= 12; i--) {
    if ((rem >>> i) & 1) {
      rem ^= 0x1f25 << (i - 12);
    }
  }
  return (version << 12) | rem;
}

function shouldInvertForMask(mask: number, r: number, c: number): boolean {
  switch (mask) {
    case 0:
      return (r + c) % 2 === 0;
    case 1:
      return r % 2 === 0;
    case 2:
      return c % 3 === 0;
    case 3:
      return (r + c) % 3 === 0;
    case 4:
      return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5:
      return ((r * c) % 2) + ((r * c) % 3) === 0;
    case 6:
      return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    case 7:
      return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    default:
      return false;
  }
}

function drawFormatBits(
  modules: boolean[][],
  isFunction: boolean[][],
  size: number,
  maskPattern: number
): void {
  const bits = computeFormatBitsM(maskPattern);

  // Top-left copy (bits 14..0)
  const tlCoords: Array<[number, number]> = [
    [8, 0],
    [8, 1],
    [8, 2],
    [8, 3],
    [8, 4],
    [8, 5],
    [8, 7],
    [8, 8],
    [7, 8],
    [5, 8],
    [4, 8],
    [3, 8],
    [2, 8],
    [1, 8],
    [0, 8],
  ];
  for (let idx = 0; idx < 15; idx++) {
    const bitIndex = 14 - idx;
    const dark = ((bits >>> bitIndex) & 1) === 1;
    const [r, c] = tlCoords[idx];
    modules[r][c] = dark;
    isFunction[r][c] = true;
  }

  // Split copy: bottom-left (bits 14..8) + top-right (bits 7..0)
  for (let i = 0; i < 7; i++) {
    const bitIndex = 14 - i;
    const r = size - 1 - i;
    modules[r][8] = ((bits >>> bitIndex) & 1) === 1;
    isFunction[r][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    const bitIndex = 7 - i;
    const c = size - 8 + i;
    modules[8][c] = ((bits >>> bitIndex) & 1) === 1;
    isFunction[8][c] = true;
  }

  // Always-dark module
  modules[size - 8][8] = true;
  isFunction[size - 8][8] = true;
}

function computePenaltyScore(modules: boolean[][]): number {
  const n = modules.length;
  let penalty = 0;

  // Rule 1: 5+ consecutive same-color modules in row or column
  for (let r = 0; r < n; r++) {
    let runColor = modules[r][0];
    let runLen = 1;
    for (let c = 1; c < n; c++) {
      if (modules[r][c] === runColor) {
        runLen++;
      } else {
        if (runLen >= 5) penalty += 3 + (runLen - 5);
        runColor = modules[r][c];
        runLen = 1;
      }
    }
    if (runLen >= 5) penalty += 3 + (runLen - 5);
  }

  for (let c = 0; c < n; c++) {
    let runColor = modules[0][c];
    let runLen = 1;
    for (let r = 1; r < n; r++) {
      if (modules[r][c] === runColor) {
        runLen++;
      } else {
        if (runLen >= 5) penalty += 3 + (runLen - 5);
        runColor = modules[r][c];
        runLen = 1;
      }
    }
    if (runLen >= 5) penalty += 3 + (runLen - 5);
  }

  // Rule 2: 2x2 blocks of same color
  for (let r = 0; r < n - 1; r++) {
    for (let c = 0; c < n - 1; c++) {
      const color = modules[r][c];
      if (
        modules[r][c + 1] === color &&
        modules[r + 1][c] === color &&
        modules[r + 1][c + 1] === color
      ) {
        penalty += 3;
      }
    }
  }

  // Rule 3: Finder-like 1:1:3:1:1 patterns preceded or followed by 4 light modules
  const hasFinderLikeInLine = (getBit: (idx: number) => boolean): number => {
    let hits = 0;
    for (let i = 0; i <= n - 11; i++) {
      const p1 =
        getBit(i) &&
        !getBit(i + 1) &&
        getBit(i + 2) &&
        getBit(i + 3) &&
        getBit(i + 4) &&
        !getBit(i + 5) &&
        getBit(i + 6) &&
        !getBit(i + 7) &&
        !getBit(i + 8) &&
        !getBit(i + 9) &&
        !getBit(i + 10);
      const p2 =
        !getBit(i) &&
        !getBit(i + 1) &&
        !getBit(i + 2) &&
        !getBit(i + 3) &&
        getBit(i + 4) &&
        !getBit(i + 5) &&
        getBit(i + 6) &&
        getBit(i + 7) &&
        getBit(i + 8) &&
        !getBit(i + 9) &&
        getBit(i + 10);
      if (p1 || p2) hits += 40;
    }
    return hits;
  };

  for (let r = 0; r < n; r++) {
    penalty += hasFinderLikeInLine((c) => modules[r][c]);
  }
  for (let c = 0; c < n; c++) {
    penalty += hasFinderLikeInLine((r) => modules[r][c]);
  }

  // Rule 4: Balance of dark modules
  let darkCount = 0;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (modules[r][c]) darkCount++;
    }
  }
  const total = n * n;
  const fivePercentSteps = Math.floor(Math.abs(darkCount * 20 - total * 10) / total);
  penalty += fivePercentSteps * 10;

  return penalty;
}

export function encodeQrMatrix(text: string): QrMatrix {
  const payloadBytes = new TextEncoder().encode(text);
  const spec = selectSpecForPayload(payloadBytes.length);
  const dataCapacityBytes =
    spec.g1Blocks * spec.g1DataCodewords + spec.g2Blocks * spec.g2DataCodewords;

  // 1. Build data bit stream (Byte mode = 0b0100)
  const dataBits: number[] = [];
  appendBits(dataBits, 0b0100, 4);
  appendBits(dataBits, payloadBytes.length, spec.version <= 9 ? 8 : 16);
  for (let i = 0; i < payloadBytes.length; i++) {
    appendBits(dataBits, payloadBytes[i], 8);
  }

  const capacityBits = dataCapacityBytes * 8;
  appendBits(dataBits, 0, Math.min(4, capacityBits - dataBits.length));
  while (dataBits.length % 8 !== 0) {
    dataBits.push(0);
  }

  const dataCodewords = new Uint8Array(dataCapacityBytes);
  let byteIdx = 0;
  for (let i = 0; i < dataBits.length; i += 8) {
    let b = 0;
    for (let k = 0; k < 8; k++) {
      b = (b << 1) | dataBits[i + k];
    }
    dataCodewords[byteIdx++] = b;
  }

  let padToggle = true;
  while (byteIdx < dataCapacityBytes) {
    dataCodewords[byteIdx++] = padToggle ? 0xec : 0x11;
    padToggle = !padToggle;
  }

  // 2. Split into Reed-Solomon blocks and interleave
  const blocksData: Uint8Array[] = [];
  const blocksEc: Uint8Array[] = [];
  let offset = 0;

  for (let i = 0; i < spec.g1Blocks; i++) {
    const slice = dataCodewords.slice(offset, offset + spec.g1DataCodewords);
    offset += spec.g1DataCodewords;
    blocksData.push(slice);
    blocksEc.push(computeReedSolomonEcBytes(slice, spec.ecPerBlock));
  }
  for (let i = 0; i < spec.g2Blocks; i++) {
    const slice = dataCodewords.slice(offset, offset + spec.g2DataCodewords);
    offset += spec.g2DataCodewords;
    blocksData.push(slice);
    blocksEc.push(computeReedSolomonEcBytes(slice, spec.ecPerBlock));
  }

  const interleaved: number[] = [];
  const maxDataLen = Math.max(spec.g1DataCodewords, spec.g2DataCodewords);
  for (let col = 0; col < maxDataLen; col++) {
    for (let b = 0; b < blocksData.length; b++) {
      if (col < blocksData[b].length) {
        interleaved.push(blocksData[b][col]);
      }
    }
  }
  for (let col = 0; col < spec.ecPerBlock; col++) {
    for (let b = 0; b < blocksEc.length; b++) {
      interleaved.push(blocksEc[b][col]);
    }
  }

  // 3. Construct matrix and function patterns
  const size = 17 + spec.version * 4;
  const baseModules: boolean[][] = Array.from({ length: size }, () =>
    Array<boolean>(size).fill(false)
  );
  const isFunction: boolean[][] = Array.from({ length: size }, () =>
    Array<boolean>(size).fill(false)
  );

  const setFunctionModule = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      baseModules[r][c] = dark;
      isFunction[r][c] = true;
    }
  };

  // Finder patterns (7x7) + 1-module light separator at 3 corners
  const placeFinderPattern = (topRow: number, leftCol: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = topRow + dr;
        const c = leftCol + dc;
        if (r < 0 || r >= size || c < 0 || c >= size) continue;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const onRing = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inCore = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFunctionModule(r, c, inOuter && (onRing || inCore));
      }
    }
  };

  placeFinderPattern(0, 0);
  placeFinderPattern(0, size - 7);
  placeFinderPattern(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFunctionModule(6, i, i % 2 === 0);
    setFunctionModule(i, 6, i % 2 === 0);
  }

  // Alignment patterns (5x5)
  const coords = spec.alignmentCoords;
  for (let i = 0; i < coords.length; i++) {
    for (let j = 0; j < coords.length; j++) {
      const cr = coords[i];
      const cc = coords[j];
      const overlapsFinder =
        (i === 0 && j === 0) ||
        (i === 0 && j === coords.length - 1) ||
        (i === coords.length - 1 && j === 0);
      if (overlapsFinder) continue;

      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dist = Math.max(Math.abs(dr), Math.abs(dc));
          setFunctionModule(cr + dr, cc + dc, dist !== 1);
        }
      }
    }
  }

  // Reserve format info strips & dark module
  drawFormatBits(baseModules, isFunction, size, 0);

  // Version info blocks (for version >= 7)
  if (spec.version >= 7) {
    const vBits = computeVersionBits(spec.version);
    for (let i = 0; i < 18; i++) {
      const dark = ((vBits >>> i) & 1) === 1;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFunctionModule(a, b, dark);
      setFunctionModule(b, a, dark);
    }
  }

  // 4. Zigzag data placement
  let bitIdx = 0;
  const totalBits = interleaved.length * 8;
  let upward = true;

  for (let rightCol = size - 1; rightCol >= 1; rightCol -= 2) {
    if (rightCol === 6) rightCol = 5; // Skip vertical timing column
    for (let step = 0; step < size; step++) {
      const r = upward ? size - 1 - step : step;
      for (let dx = 0; dx < 2; dx++) {
        const c = rightCol - dx;
        if (!isFunction[r][c]) {
          let dark = false;
          if (bitIdx < totalBits) {
            const cw = interleaved[bitIdx >>> 3];
            dark = ((cw >>> (7 - (bitIdx & 7))) & 1) === 1;
            bitIdx++;
          }
          baseModules[r][c] = dark;
        }
      }
    }
    upward = !upward;
  }

  // 5. Evaluate all 8 masks & pick minimum penalty
  let bestMask = 0;
  let bestPenalty = Number.POSITIVE_INFINITY;
  let bestGrid: boolean[][] = baseModules;

  for (let mask = 0; mask < 8; mask++) {
    const candidate = baseModules.map((row, r) =>
      row.map((val, c) =>
        !isFunction[r][c] && shouldInvertForMask(mask, r, c) ? !val : val
      )
    );
    drawFormatBits(candidate, isFunction, size, mask);
    const penalty = computePenaltyScore(candidate);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMask = mask;
      bestGrid = candidate;
    }
  }

  drawFormatBits(bestGrid, isFunction, size, bestMask);

  return {
    version: spec.version,
    size,
    modules: bestGrid,
  };
}

export function renderQrToCanvas(
  ctx: CanvasRenderingContext2D,
  matrix: QrMatrix,
  opts: {
    x: number;
    y: number;
    size: number;
    darkColor?: string;
    lightColor?: string;
    quietZoneModules?: number;
    cornerRadius?: number;
  }
): void {
  const quiet = opts.quietZoneModules ?? 3;
  const darkColor = opts.darkColor ?? '#1a1410';
  const lightColor = opts.lightColor ?? '#ffffff';
  const radius = opts.cornerRadius ?? 14;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(opts.x, opts.y, opts.size, opts.size, radius);
  ctx.fillStyle = lightColor;
  ctx.fill();

  const totalUnits = matrix.size + quiet * 2;
  // Snap module size to crisp subpixel-free coordinates where possible
  const modulePx = opts.size / totalUnits;
  const startX = opts.x + quiet * modulePx;
  const startY = opts.y + quiet * modulePx;

  ctx.fillStyle = darkColor;
  for (let r = 0; r < matrix.size; r++) {
    for (let c = 0; c < matrix.size; c++) {
      if (!matrix.modules[r][c]) continue;
      const mx = Math.round(startX + c * modulePx);
      const my = Math.round(startY + r * modulePx);
      const mxEnd = Math.round(startX + (c + 1) * modulePx);
      const myEnd = Math.round(startY + (r + 1) * modulePx);
      ctx.fillRect(mx, my, Math.max(1, mxEnd - mx), Math.max(1, myEnd - my));
    }
  }
  ctx.restore();
}
