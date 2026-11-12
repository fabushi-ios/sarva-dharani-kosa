/**
 * src/core/sources/textAlignment.ts
 *
 * Generic, rule-based alignment of an entry's dhāraṇī text against a source text
 * (CBETA scripture body, GRETIL file, …). Used both at build time (citation verification,
 * scripts/build-citation-check.ts) and in the UI (locating the passage inside the
 * full original text). No per-entry data: Chinese is compared by sound via the Unihan
 * phonetic fold, Latin by diacritic-free letters.
 */
import { foldCjkPhonetic } from '../search/cjkFold';

const HAN = /\p{Script=Han}/u;

/** Comparable units of a text (`keys`) and each unit's offset in the original string (`pos`). */
export interface AlignUnits {
  keys: string[];
  pos: number[];
}

/**
 * Bracketed interlinear annotations, e.g. (一) (二合) (引) (丁以切) (娑婆訶者云散去…) — editorial
 * notes (clause numbers, pronunciation, glosses), never mantra text.
 */
const SHORT_HAN_ANNOTATION = /[(（[【〔〈<][^()（）[\]【】〔〕〈〉<>\n]{1,80}[)）\]】〕〉>]/gu;

export function stripShortHanAnnotations(text: string): string {
  return (text || '').replace(SHORT_HAN_ANNOTATION, (m) => ' '.repeat(m.length));
}

/** Han characters, folded by Mandarin reading, with original offsets. */
export function hanUnits(text: string): AlignUnits {
  const keys: string[] = [];
  const pos: number[] = [];
  let p = 0;
  for (const ch of text || '') {
    if (HAN.test(ch)) {
      keys.push(foldCjkPhonetic(ch));
      pos.push(p);
    }
    p += ch.length;
  }
  return { keys, pos };
}

/** Latin letters, lower-cased and stripped of diacritics, with original offsets. */
export function latinUnits(text: string): AlignUnits {
  const keys: string[] = [];
  const pos: number[] = [];
  let p = 0;
  for (const ch of text || '') {
    const base = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (/^[a-z]$/.test(base)) {
      keys.push(base);
      pos.push(p);
    }
    p += ch.length;
  }
  return { keys, pos };
}

export function nGrams(keys: string[], n: number): Set<string> {
  const s = new Set<string>();
  for (let i = 0; i + n <= keys.length; i++) s.add(keys.slice(i, i + n).join(''));
  return s;
}

export interface UnitSpan {
  /** Share of the query's distinct n-grams found inside the best window (0–1). */
  coverage: number;
  /** Unit indices [startUnit, endUnit) in the target. */
  startUnit: number;
  endUnit: number;
}

/**
 * Finds the window of the target with the highest density of the query's n-grams.
 * Window length = query length × 1.5 (allows interpolated notes and minor variants).
 */
export function locateUnitSpan(
  queryKeys: string[],
  targetKeys: string[],
  n: number,
  /** Optional per-gram weight (e.g. IDF over the canon); default 1. */
  weightOf?: (gram: string) => number
): UnitSpan | null {
  if (queryKeys.length < n || targetKeys.length < n) return null;
  const qGrams = nGrams(queryKeys, n);
  const w = (g: string) => (weightOf ? weightOf(g) : 1);
  let total = 0;
  for (const g of qGrams) total += w(g);
  if (total <= 0) return { coverage: 0, startUnit: 0, endUnit: 0 };
  const L = targetKeys.length;
  const hit = new Float64Array(L);
  const gramAt: string[] = new Array(L);
  for (let i = 0; i + n <= L; i++) {
    let g = targetKeys[i];
    for (let k = 1; k < n; k++) g += targetKeys[i + k];
    gramAt[i] = g;
    if (qGrams.has(g)) hit[i] = w(g) || 1e-9;
  }
  const win = Math.max(n, Math.ceil(queryKeys.length * 1.5));
  let sum = 0;
  let best = 0;
  let bestStart = -1;
  for (let i = 0; i < L; i++) {
    sum += hit[i];
    if (i >= win) sum -= hit[i - win];
    if (sum > best + 1e-12) {
      best = sum;
      bestStart = Math.max(0, i - win + 1);
    }
  }
  if (bestStart < 0) return { coverage: 0, startUnit: 0, endUnit: 0 };
  const seen = new Set<string>();
  let first = -1;
  let last = -1;
  const stop = Math.min(L, bestStart + win);
  for (let i = bestStart; i < stop; i++) {
    if (!hit[i]) continue;
    seen.add(gramAt[i]);
    if (first < 0) first = i;
    last = i;
  }
  let got = 0;
  for (const g of seen) got += w(g);
  return { coverage: got / total, startUnit: first, endUnit: Math.min(L, last + n) };
}

export interface SpanMatch {
  coverage: number;
  /** Offsets into the original target string. */
  start: number;
  end: number;
}

export function locateSpan(query: AlignUnits, target: AlignUnits, n: number): SpanMatch | null {
  const s = locateUnitSpan(query.keys, target.keys, n);
  if (!s) return null;
  if (s.endUnit <= s.startUnit) return { coverage: 0, start: 0, end: 0 };
  return {
    coverage: s.coverage,
    start: target.pos[s.startUnit],
    end: target.pos[s.endUnit - 1] + 1,
  };
}

/** Chinese transliteration of an entry (classical Han text of all verses, annotations removed). */
export function entryHanQuery(verses: Array<{ classicalTranslitZh?: string }>): AlignUnits {
  return hanUnits(stripShortHanAnnotations(verses.map((v) => v.classicalTranslitZh || '').join(' ')));
}

/** Sanskrit (IAST) of an entry. */
export function entryLatinQuery(verses: Array<{ iast?: string }>): AlignUnits {
  return latinUnits(verses.map((v) => v.iast || '').join(' '));
}

export const HAN_GRAM = 3;
export const LATIN_GRAM = 6;

/** Generic thresholds used to classify a citation (build-time check and UI labels share them). */
export const COVERAGE_MATCH = 0.8;
export const COVERAGE_VARIANT = 0.4;

/**
 * Global (Needleman–Wunsch) alignment of `a` onto `b`; returns, for every index of `a`, the number
 * of `b` units that precede its aligned position (non-decreasing, 0…b.length). A unit of `a` that
 * aligns to a gap maps to the position where it would have been. Match +2, mismatch −1, gap −1.
 */
export function alignPositions(a: string[], b: string[]): number[] {
  const m = a.length;
  const n = b.length;
  const W = n + 1;
  // Traceback: 0 = diagonal, 1 = up (a[i] against gap), 2 = left (b[j] against gap).
  const tb = new Uint8Array((m + 1) * W);
  let prev = new Int32Array(W);
  let cur = new Int32Array(W);
  for (let j = 1; j <= n; j++) {
    prev[j] = -j;
    tb[j] = 2;
  }
  for (let i = 1; i <= m; i++) {
    cur[0] = -i;
    tb[i * W] = 1;
    const ai = a[i - 1];
    for (let j = 1; j <= n; j++) {
      const d = prev[j - 1] + (ai === b[j - 1] ? 2 : -1);
      const u = prev[j] - 1;
      const l = cur[j - 1] - 1;
      if (d >= u && d >= l) {
        cur[j] = d;
        tb[i * W + j] = 0;
      } else if (u >= l) {
        cur[j] = u;
        tb[i * W + j] = 1;
      } else {
        cur[j] = l;
        tb[i * W + j] = 2;
      }
    }
    [prev, cur] = [cur, prev];
  }
  const out = new Array<number>(m).fill(0);
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    const t = tb[i * W + j];
    if (i > 0 && j > 0 && t === 0) {
      out[--i] = --j;
    } else if (i > 0 && (j === 0 || t === 1)) {
      out[--i] = j;
    } else {
      j--;
    }
  }
  for (let k = 1; k < m; k++) if (out[k] < out[k - 1]) out[k] = out[k - 1];
  return out;
}

export interface LocalAlignment {
  /** Aligned core: a[aStart, aEnd) against b[bStart, bEnd). */
  aStart: number;
  aEnd: number;
  bStart: number;
  bEnd: number;
  score: number;
}

/**
 * Local (Smith–Waterman) alignment of `a` and `b` (match +2, mismatch −1, gap −1): the
 * best-scoring pair of sub-sequences. Returns null when nothing aligns.
 */
export function localAlign(a: string[], b: string[]): LocalAlignment | null {
  const m = a.length;
  const n = b.length;
  const W = n + 1;
  // Traceback: 0 = stop, 1 = diagonal, 2 = up, 3 = left.
  const tb = new Uint8Array((m + 1) * W);
  let prev = new Int32Array(W);
  let cur = new Int32Array(W);
  let best = 0;
  let bi = 0;
  let bj = 0;
  for (let i = 1; i <= m; i++) {
    cur[0] = 0;
    const ai = a[i - 1];
    for (let j = 1; j <= n; j++) {
      const d = prev[j - 1] + (ai === b[j - 1] ? 2 : -1);
      const u = prev[j] - 1;
      const l = cur[j - 1] - 1;
      let v = 0;
      let t = 0;
      if (d > v) {
        v = d;
        t = 1;
      }
      if (u > v) {
        v = u;
        t = 2;
      }
      if (l > v) {
        v = l;
        t = 3;
      }
      cur[j] = v;
      tb[i * W + j] = t;
      if (v > best) {
        best = v;
        bi = i;
        bj = j;
      }
    }
    [prev, cur] = [cur, prev];
  }
  if (best <= 0) return null;
  let i = bi;
  let j = bj;
  let si = i;
  let sj = j;
  while (i > 0 && j > 0) {
    const t = tb[i * W + j];
    if (t === 0) break;
    // Record the last matched diagonal as the alignment start.
    if (t === 1) {
      i--;
      j--;
      if (a[i] === b[j]) {
        si = i;
        sj = j;
      }
    } else if (t === 2) i--;
    else j--;
  }
  return { aStart: si, aEnd: bi, bStart: sj, bEnd: bj, score: best };
}

/**
 * Candidate windows of the target holding the query's n-grams densely: non-overlapping windows
 * whose weighted hit sum is ≥ `ratio` × the best one (at most `maxK`), in target order. A text
 * may repeat a dhāraṇī (full and abbreviated); callers pick among them by alignment score.
 */
export function candidateWindows(
  queryKeys: string[],
  targetKeys: string[],
  n: number,
  weightOf?: (gram: string) => number,
  ratio = 0.8,
  maxK = 6
): Array<{ startUnit: number; endUnit: number }> {
  if (queryKeys.length < n || targetKeys.length < n) return [];
  const qGrams = nGrams(queryKeys, n);
  const L = targetKeys.length;
  const hit = new Float64Array(L);
  for (let i = 0; i + n <= L; i++) {
    let g = targetKeys[i];
    for (let k = 1; k < n; k++) g += targetKeys[i + k];
    if (qGrams.has(g)) hit[i] = (weightOf ? weightOf(g) : 1) || 1e-9;
  }
  const win = Math.max(n, Math.ceil(queryKeys.length * 1.5));
  // Window sums by start position.
  const sums = new Float64Array(L);
  let s = 0;
  for (let i = 0; i < L; i++) {
    s += hit[i];
    if (i >= win) s -= hit[i - win];
    const start = Math.max(0, i - win + 1);
    if (s > sums[start]) sums[start] = s;
  }
  const order = [...sums.keys()].filter((i) => sums[i] > 0).sort((a, b) => sums[b] - sums[a] || a - b);
  if (!order.length) return [];
  const best = sums[order[0]];
  const out: Array<{ startUnit: number; endUnit: number }> = [];
  for (const st of order) {
    if (sums[st] < best * ratio || out.length >= maxK) break;
    const en = Math.min(L, st + win + n);
    if (out.some((w) => st < w.endUnit && en > w.startUnit)) continue;
    out.push({ startUnit: st, endUnit: en });
  }
  return out.sort((a, b) => a.startUnit - b.startUnit);
}
