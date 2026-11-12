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

/** Bracketed interlinear annotations of ≤4 Han chars, e.g. (一) (二合) (引) — editorial, not mantra text. */
const SHORT_HAN_ANNOTATION = /[(（[【〔〈<][\p{Script=Han}]{1,4}[)）\]】〕〉>]/gu;

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
