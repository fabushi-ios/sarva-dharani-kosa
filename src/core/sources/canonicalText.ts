/**
 * src/core/sources/canonicalText.ts
 *
 * The correctness standard for a dhāraṇī's text is the source database (CBETA for Chinese,
 * GRETIL for Sanskrit). Given an entry's verses and the full text of the source located by
 * src/core/sources/citationCheck.ts, this module extracts the source's own wording of the
 * dhāraṇī and distributes it over the entry's verses. Generic rules only:
 *   1. locate the passage (phonetic-folded n-gram window, see textAlignment.ts);
 *   2. take the core matched by local (Smith–Waterman) alignment of the entry onto that window;
 *   3. extend it by the entry's unaligned head / tail length, never across a strong break
 *      (quotation mark, full stop, colon, paragraph end), then snap to the nearest clause
 *      boundary (punctuation, clause-number interlinear note, word break);
 *   4. split the extracted text into the entry's verse count by global alignment of the entry's
 *      text onto it — every character of the extracted text lands in exactly one verse.
 * The entry's own text is used only as the locator key; the output text is the source's.
 */
import {
  alignPositions,
  localAlign,
  hanUnits,
  latinUnits,
  candidateWindows,
  nGrams,
  stripShortHanAnnotations,
  type AlignUnits,
} from './textAlignment';

export interface SourceParagraph {
  kind: 'head' | 'text' | 'dharani';
  text: string;
}

export interface CanonicalExtraction {
  /** Source wording, verse by verse (joined = the extracted passage). */
  verses: string[];
  /** Share of the entry's n-grams found in the extracted passage (weighted by `weightOf`, e.g. IDF). */
  coverage: number;
  /** Share of the extracted passage's n-grams found in the entry (guards against over-extraction). */
  precision: number;
  /** Distinct n-grams shared by the entry and the passage (amount of evidence). */
  sharedGrams: number;
  /** Distinct n-grams of the entry. */
  entryGrams: number;
}

export type Script = 'han' | 'latin';

const GRAM: Record<Script, number> = { han: 3, latin: 6 };
/** Units beyond the passage up to which it extends to a strong break / the text edge. */
const EDGE_SLACK = 4;
/** Max units walked to reach a clause boundary. */
const SNAP: Record<Script, number> = { han: 4, latin: 12 };

const unitsOf = (script: Script, s: string): AlignUnits =>
  script === 'han' ? hanUnits(stripShortHanAnnotations(s)) : latinUnits(s);

function charEnd(text: string, pos: number): number {
  const cp = text.codePointAt(pos) || 0;
  return pos + (cp > 0xffff ? 2 : 1);
}

const CLAUSE_PUNCT = /[。，、；：！？「」『』|｜\n]/;
const LATIN_BREAK = /[\s|/।॥]/;
/** An interlinear note carrying a clause number, e.g. (一) (十一) — it closes a clause. */
const CLAUSE_NUMBER_NOTE = /^[(（][^()（）]*[一二三四五六七八九十百千][^()（）]*[)）]$/;
const NOTE_RUN = /^(?:\s*[(（][^()（）\n]{1,80}[)）])+/;

/** Does a clause begin at `off`? (start of text, after punctuation, or after a clause-number note) */
function clauseStartsAt(script: Script, text: string, off: number): boolean {
  if (off <= 0) return true;
  if (script === 'latin') return LATIN_BREAK.test(text[off - 1]);
  const before = text.slice(Math.max(0, off - 90), off).replace(/\s+$/, '');
  if (!before || CLAUSE_PUNCT.test(before[before.length - 1])) return true;
  const note = before.match(/[(（][^()（）\n]{1,80}[)）]$/);
  return Boolean(note && CLAUSE_NUMBER_NOTE.test(note[0]));
}

/** If a clause ends at `off` (notes after the syllable included), the clause end offset; else -1. */
function clauseEndAfter(script: Script, text: string, off: number): number {
  if (off >= text.length) return text.length;
  if (script === 'latin') return LATIN_BREAK.test(text[off]) ? off : -1;
  const notes = text.slice(off).match(NOTE_RUN)?.[0] || '';
  const all = notes.match(/[(（][^()（）\n]{1,80}[)）]/g) || [];
  const end = off + notes.length;
  if (all.some((x) => CLAUSE_NUMBER_NOTE.test(x))) return end;
  const next = text.slice(end).replace(/^[ \t]+/, '')[0];
  return next === undefined || CLAUSE_PUNCT.test(next) ? end : -1;
}

/** Breaks a dhāraṇī never runs across when the passage is extended beyond its aligned core. */
const STRONG_BREAK = /[「」。：:！？\n]/;

/**
 * Extracts the source's wording of the passage that `queryVerses` transliterate.
 * Returns null when the passage cannot be located in `paragraphs`.
 */
export function extractCanonical(
  script: Script,
  queryVerses: string[],
  paragraphs: SourceParagraph[],
  weightOf?: (gram: string) => number
): CanonicalExtraction | null {
  const n = GRAM[script];
  const qKeys: string[] = [];
  const verseStart: number[] = [];
  for (const v of queryVerses) {
    verseStart.push(qKeys.length);
    qKeys.push(...unitsOf(script, v || '').keys);
  }
  if (qKeys.length < n) return null;
  const m = qKeys.length;
  const qGrams = nGrams(qKeys, n);

  const full = paragraphs.map((p) => p.text).join('\n');
  const target = unitsOf(script, full);
  // 1. Dense windows of the entry's n-grams (a text may hold the dhāraṇī more than once).
  // 2. Local alignment inside each window (± half the entry's length); the best-scoring one wins
  //    (earliest on ties). Its matched core is the passage: stray n-gram hits in surrounding
  //    prose cannot join it.
  let r0 = 0;
  let la: ReturnType<typeof localAlign> = null;
  for (const w of candidateWindows(qKeys, target.keys, n, weightOf)) {
    const a0 = Math.max(0, w.startUnit - (m >> 1));
    const a1 = Math.min(target.keys.length, w.endUnit + (m >> 1));
    const x = localAlign(qKeys, target.keys.slice(a0, a1));
    if (x && (!la || x.score > la.score)) {
      la = x;
      r0 = a0;
    }
  }
  if (!la) return null;
  let first = r0 + la.bStart;
  let last = r0 + la.bEnd - 1;

  // 3. The entry's text outside the aligned core (head / tail) maps onto as many source units
  //    beyond it — never across a strong break (quotation mark, full stop, colon, paragraph).
  const gapHasBreak = (u: number, v: number) =>
    STRONG_BREAK.test(full.slice(charEnd(full, target.pos[u]), target.pos[v]));
  for (let k = 0; k < la.aStart && first > 0 && !gapHasBreak(first - 1, first); k++) first--;
  for (let k = 0; k < m - la.aEnd && last + 1 < target.keys.length && !gapHasBreak(last, last + 1); k++) last++;
  // Up to EDGE_SLACK more units are taken in when that reaches a strong break or the text edge.
  const L = target.keys.length;
  const atStartEdge = (j: number) => j === 0 || gapHasBreak(j - 1, j);
  const atEndEdge = (j: number) => j === L - 1 || gapHasBreak(j, j + 1);
  for (let j = first, t = 0; t <= EDGE_SLACK; t++, j--) {
    if (atStartEdge(j)) {
      first = j;
      break;
    }
  }
  for (let j = last, t = 0; t <= EDGE_SLACK; t++, j++) {
    if (atEndEdge(j)) {
      last = j;
      break;
    }
  }
  // 4. Snap to clause boundaries (punctuation, clause-number notes, word breaks).
  let startOff = target.pos[first];
  for (let k = 0; k <= SNAP[script] && first - k >= 0; k++) {
    const off = target.pos[first - k];
    if (clauseStartsAt(script, full, off)) {
      startOff = off;
      break;
    }
    if (first - k > 0 && gapHasBreak(first - k - 1, first - k)) break;
  }
  let endOff = charEnd(full, target.pos[last]);
  // Notes annotating the last syllable stay with it.
  if (script === 'han') endOff += full.slice(endOff).match(NOTE_RUN)?.[0].length || 0;
  for (let k = 0; k <= SNAP[script] && last + k < target.keys.length; k++) {
    const e = clauseEndAfter(script, full, charEnd(full, target.pos[last + k]));
    if (e >= 0) {
      endOff = Math.max(endOff, e);
      break;
    }
    if (last + k + 1 < target.keys.length && gapHasBreak(last + k, last + k + 1)) break;
  }

  const passage = full.slice(startOff, endOff);
  const lead = passage.match(/^[\s「」『』：:，。、；]*/)?.[0].length || 0;
  const trail = passage.match(/[\s「」『』：:，、；]*$/)?.[0].length || 0;
  const text = passage.slice(lead, passage.length - trail).replace(/\n+/g, ' ');
  const tUnits = unitsOf(script, text);
  if (tUnits.keys.length < n) return null;

  // Coverage / precision of the extraction (unweighted).
  const tGrams = nGrams(tUnits.keys, n);
  let qIn = 0;
  let wIn = 0;
  let wAll = 0;
  for (const g of qGrams) {
    const w = weightOf ? weightOf(g) : 1;
    wAll += w;
    if (tGrams.has(g)) {
      qIn++;
      wIn += w;
    }
  }
  let tIn = 0;
  for (const g of tGrams) if (qGrams.has(g)) tIn++;

  // 4. Verses by alignment; cut points move back to the preceding clause boundary.
  const map = alignPositions(qKeys, tUnits.keys);
  const cutUnit = verseStart.map((b, k) => (k === 0 ? 0 : b >= qKeys.length ? tUnits.keys.length : map[b]));
  const cutOff = cutUnit.map((u, k) => {
    if (k === 0) return 0;
    if (u >= tUnits.keys.length) return text.length;
    let off = tUnits.pos[u];
    if (script === 'latin') while (off > 0 && !/\s/.test(text[off - 1])) off--;
    return off;
  });
  for (let k = 1; k < cutOff.length; k++) if (cutOff[k] < cutOff[k - 1]) cutOff[k] = cutOff[k - 1];
  const verses = cutOff.map((off, k) =>
    text.slice(off, k + 1 < cutOff.length ? cutOff[k + 1] : text.length).trim()
  );
  return {
    verses,
    coverage: Math.round((wAll > 0 ? wIn / wAll : 0) * 100) / 100,
    precision: Math.round((tIn / tGrams.size) * 100) / 100,
    sharedGrams: qIn,
    entryGrams: qGrams.size,
  };
}
