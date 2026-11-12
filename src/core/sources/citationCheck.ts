/**
 * src/core/sources/citationCheck.ts
 *
 * Code-rule verification of every hand-authored entry against the original sources:
 *   1. every canon number the entry cites is parsed by one generic ID rule;
 *   2. each cited number must exist in CBETA (else `inCbeta: false`);
 *   3. the entry's Chinese transliteration is aligned (phonetic-folded 3-grams, IDF-weighted)
 *      against the cited text and against every fetched canon text, to auto-locate the real source;
 *   4. the entry's Sanskrit (IAST) is aligned (letter 6-grams) against the Sanskrit witnesses
 *      (cited GRETIL file and all GRETIL texts held locally).
 * The result is generated into src/data/kosa-generated/citationCheck.ts by
 * scripts/build-citation-check.ts and re-verified by tests/unit/citation-check.test.ts.
 * No per-entry exceptions exist: classification uses the generic thresholds only.
 */
import type { DharaniEntry } from '../../types/kosaTypes';
import {
  COVERAGE_MATCH,
  COVERAGE_VARIANT,
  HAN_GRAM,
  LATIN_GRAM,
  entryHanQuery,
  entryLatinQuery,
  hanUnits,
  latinUnits,
  locateUnitSpan,
  stripShortHanAnnotations,
} from './textAlignment';

export const CANON_ID_RE = /(?<![A-Za-z0-9])([A-Z]{1,2})(\d{2,3})n(\d{4})([A-Za-z]?)(?![A-Za-z0-9])/g;

export function parseCanonIds(...texts: Array<string | undefined>): string[] {
  const out: string[] = [];
  for (const t of texts) {
    for (const m of (t || '').matchAll(CANON_ID_RE)) if (!out.includes(m[0])) out.push(m[0]);
  }
  return out;
}

export function cbetaXmlUrl(id: string): string {
  const m = id.match(/^([A-Z]{1,2})(\d{2,3})n/);
  if (!m) return '';
  return `https://raw.githubusercontent.com/cbeta-org/xml-p5/master/${m[1]}/${m[1]}${m[2]}/${id}.xml`;
}

export function cbetaOnlineUrl(id: string): string {
  return `https://cbetaonline.dila.edu.tw/zh/${id}`;
}

/** Canon numbers cited by an entry, in citation order. */
export function citedCanonIds(entry: DharaniEntry): string[] {
  const p = entry.provenance || ({} as DharaniEntry['provenance']);
  return parseCanonIds(
    p.cbetaId,
    entry.taishoNo,
    entry.sutraSourceZh,
    p.editionCitation,
    p.cbetaRawXmlUrl,
    p.cbetaOnlineUrl,
    p.databaseBadgeZh
  );
}

/** File name of the Sanskrit witness an entry cites (GRETIL), if any. */
export function citedSanskritFile(entry: DharaniEntry): string | undefined {
  const u = entry.provenance?.gretilRawUrl;
  return u ? u.split('/').pop() || u : undefined;
}

export type CitationStatus =
  | 'verified' //            cited text contains the entry's text (≥ COVERAGE_MATCH)
  | 'located-elsewhere' //   found (≥ COVERAGE_MATCH) in a different source than cited
  | 'variant' //             best match is partial (COVERAGE_VARIANT … COVERAGE_MATCH): another recension
  | 'unverified' //          no source text contains it (liturgical / modern / reconstructed)
  | 'short-formula' //       too short to attribute to one text, and absent from the cited one
  | 'no-han-text'; //        entry has no text in this script to check

/** Below this many distinct n-grams a text is a stock formula found in many sources. */
export const MIN_LOCATABLE_GRAMS = 6;

export interface SourceMatch {
  id: string;
  title: string;
  coverage: number;
  cited: boolean;
  /** Readable (CORS-enabled) URL of the source file, for Sanskrit witnesses. */
  url?: string;
}

/** GRETIL page URL → CORS-readable GitHub mirror URL (identity for URLs already on the mirror). */
export function gretilMirrorUrl(u: string): string {
  return u.replace(
    /^https?:\/\/gretil\.sub\.uni-goettingen\.de\//,
    'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/'
  );
}

export interface CitationCheckRecord {
  cited: Array<{ id: string; inCbeta: boolean; coverage: number }>;
  best?: SourceMatch;
  status: CitationStatus;
  /** IAST ↔ Sanskrit witness (GRETIL). Absent when the entry has no IAST. */
  sanskrit?: { status: CitationStatus; best?: SourceMatch; citedFile?: string };
}

export interface CanonTextCorpus {
  /** id → plain text (Traditional or Simplified; folding makes both comparable). */
  texts: Record<string, string>;
  titles: Record<string, string>;
  /** Cited ids that CBETA does not contain. */
  missing: string[];
  /** Sanskrit witnesses: file → plain text. */
  sanskrit?: Record<string, string>;
  /** Sanskrit witnesses: file → source URL. */
  sanskritUrls?: Record<string, string>;
  /**
   * Fixed reference collections for n-gram document frequency (IDF), so a text's coverage never
   * depends on which other texts happen to be loaded. Default: the matched collection itself.
   */
  hanIdfTexts?: Record<string, string>;
  sanskritIdfTexts?: Record<string, string>;
}

const round2 = (x: number) => Math.round(x * 100) / 100;
const CANDIDATES = 8;

interface CorpusMatcher {
  gramCount: number[];
  /** Coverage of query `qi` inside text `id` (best window, IDF-weighted). */
  coverage: (qi: number, id: string) => number;
  /** Top candidate texts for query `qi` by weighted gram overlap. */
  candidates: (qi: number) => string[];
  has: (id: string) => boolean;
}

/** Generic n-gram matcher of many queries against many texts (one scan per text). */
function buildMatcher(
  queries: string[][],
  texts: Map<string, string[]>,
  n: number,
  idfTexts: Map<string, string[]> = texts
): CorpusMatcher {
  const gram = (k: string[], i: number) => {
    let g = k[i];
    for (let j = 1; j < n; j++) g += k[i + j];
    return g;
  };
  const gramEntries = new Map<string, number[]>();
  const gramCount = queries.map((q, qi) => {
    const seen = new Set<string>();
    for (let i = 0; i + n <= q.length; i++) {
      const g = gram(q, i);
      if (seen.has(g)) continue;
      seen.add(g);
      const list = gramEntries.get(g);
      if (list) list.push(qi);
      else gramEntries.set(g, [qi]);
    }
    return seen.size;
  });
  const hitsOf = (k: string[]) => {
    const hit = new Set<string>();
    for (let i = 0; i + n <= k.length; i++) {
      const g = gram(k, i);
      if (gramEntries.has(g)) hit.add(g);
    }
    return hit;
  };
  const textHits = new Map<string, Set<string>>();
  for (const [id, k] of texts) textHits.set(id, hitsOf(k));
  const df = new Map<string, number>();
  for (const [id, k] of idfTexts) {
    for (const g of idfTexts === texts ? textHits.get(id)! : hitsOf(k)) df.set(g, (df.get(g) || 0) + 1);
  }
  // Inverse document frequency: stock formulae found in hundreds of texts carry ~no evidence.
  const N = idfTexts.size;
  const idf = (g: string) => Math.log((N + 1) / ((df.get(g) || 0) + 1));
  const overlap: Array<Map<string, number>> = queries.map(() => new Map());
  for (const [id, hit] of textHits) {
    for (const g of hit) {
      const w = idf(g);
      for (const qi of gramEntries.get(g)!) overlap[qi].set(id, (overlap[qi].get(id) || 0) + w);
    }
  }
  return {
    gramCount,
    has: (id) => texts.has(id),
    coverage: (qi, id) => {
      const k = texts.get(id);
      return k ? round2(locateUnitSpan(queries[qi], k, n, idf)?.coverage || 0) : 0;
    },
    candidates: (qi) =>
      [...overlap[qi].entries()]
        .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
        .slice(0, CANDIDATES)
        .map(([id]) => id),
  };
}

/** Canon collection rank: Taishō first, then the other collections. */
const collectionRank = (id: string) => (/^T\d/.test(id) ? 0 : 1);

/**
 * Source preference: higher coverage; then the cited text; then the Taishō canon; then the
 * lower canon number. Deterministic, no per-text exceptions.
 */
export function compareSource(
  a: { id: string; coverage: number; cited: boolean },
  b: { id: string; coverage: number; cited: boolean }
): number {
  if (a.coverage !== b.coverage) return b.coverage - a.coverage;
  if (a.cited !== b.cited) return a.cited ? -1 : 1;
  const r = collectionRank(a.id) - collectionRank(b.id);
  if (r) return r;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function classify(
  m: CorpusMatcher,
  qi: number,
  citedIds: string[],
  titleOf: (id: string) => string
): { status: CitationStatus; best?: SourceMatch; citedCoverage: Map<string, number> } {
  const citedCoverage = new Map<string, number>();
  for (const id of citedIds) citedCoverage.set(id, m.gramCount[qi] && m.has(id) ? m.coverage(qi, id) : 0);
  if (!m.gramCount[qi]) return { status: 'no-han-text', citedCoverage };
  let best: SourceMatch | undefined;
  const consider = (id: string, coverage: number, cited: boolean) => {
    if (coverage <= 0) return;
    if (!best || compareSource({ id, coverage, cited }, best) < 0) {
      best = { id, title: titleOf(id), coverage, cited };
    }
  };
  for (const id of citedIds) if (m.has(id)) consider(id, citedCoverage.get(id)!, true);
  for (const id of m.candidates(qi)) if (!citedIds.includes(id)) consider(id, m.coverage(qi, id), false);

  const bestCited = Math.max(0, ...citedCoverage.values());
  const locatable = m.gramCount[qi] >= MIN_LOCATABLE_GRAMS;
  let status: CitationStatus;
  if (bestCited >= COVERAGE_MATCH) status = 'verified';
  else if (!locatable) status = 'short-formula';
  else if (best && best.coverage < COVERAGE_MATCH && best.coverage * m.gramCount[qi] < MIN_LOCATABLE_GRAMS) {
    // A partial match sharing fewer n-grams than a locatable text has is not evidence of a source.
    status = 'unverified';
    best = undefined;
  } else if (best && best.coverage >= COVERAGE_MATCH) status = 'located-elsewhere';
  else if (best && best.coverage >= COVERAGE_VARIANT) status = 'variant';
  else status = 'unverified';
  // A short formula's "best" text outside the citation is arbitrary, and a match below the
  // variant threshold is not a match — neither is reported as a source.
  if (best && ((!locatable && !best.cited) || best.coverage < COVERAGE_VARIANT)) best = undefined;
  return { status, best, citedCoverage };
}

/**
 * IDF weight function over a fixed reference collection, for the n-grams of `queries`
 * (the same weighting the matcher uses for coverage).
 */
export function idfWeights(
  queries: string[][],
  idfTexts: Record<string, string>,
  script: 'han' | 'latin'
): (gram: string) => number {
  const n = script === 'han' ? HAN_GRAM : LATIN_GRAM;
  const units = (s: string) => (script === 'han' ? hanUnits(stripShortHanAnnotations(s)) : latinUnits(s)).keys;
  const wanted = new Set<string>();
  for (const q of queries) for (let i = 0; i + n <= q.length; i++) wanted.add(q.slice(i, i + n).join(''));
  const df = new Map<string, number>();
  const ids = Object.keys(idfTexts).sort();
  for (const id of ids) {
    const k = units(idfTexts[id]);
    const seen = new Set<string>();
    for (let i = 0; i + n <= k.length; i++) {
      const g = k.slice(i, i + n).join('');
      if (wanted.has(g)) seen.add(g);
    }
    for (const g of seen) df.set(g, (df.get(g) || 0) + 1);
  }
  const N = ids.length;
  return (g) => Math.log((N + 1) / ((df.get(g) || 0) + 1));
}

/** Top candidate texts (by weighted n-gram overlap) for each entry's Chinese, keyed by entry id. */
export function rankHanCandidates(
  entries: DharaniEntry[],
  texts: Record<string, string>,
  idfTexts: Record<string, string> = texts
): Record<string, string[]> {
  const units = (rec: Record<string, string>) =>
    new Map(
      Object.keys(rec)
        .sort()
        .map((id) => [id, hanUnits(stripShortHanAnnotations(rec[id])).keys] as [string, string[]])
    );
  const t = units(texts);
  const m = buildMatcher(
    entries.map((e) => entryHanQuery(e.verses).keys),
    t,
    HAN_GRAM,
    idfTexts === texts ? t : units(idfTexts)
  );
  return Object.fromEntries(entries.map((e, qi) => [e.id, m.gramCount[qi] ? m.candidates(qi) : []]));
}

export function computeCitationCheck(
  entries: DharaniEntry[],
  corpus: CanonTextCorpus
): Record<string, CitationCheckRecord> {
  const sortedMap = (rec: Record<string, string>, units: (s: string) => { keys: string[] }) =>
    new Map(
      Object.keys(rec)
        .sort()
        .map((id) => [id, units(rec[id]).keys] as [string, string[]])
    );
  const hanTarget = (s: string) => hanUnits(stripShortHanAnnotations(s));
  const hanTexts = sortedMap(corpus.texts, hanTarget);
  const han = buildMatcher(
    entries.map((e) => entryHanQuery(e.verses).keys),
    hanTexts,
    HAN_GRAM,
    corpus.hanIdfTexts ? sortedMap(corpus.hanIdfTexts, hanTarget) : hanTexts
  );
  const saTexts = sortedMap(corpus.sanskrit || {}, latinUnits);
  const sa = buildMatcher(
    entries.map((e) => entryLatinQuery(e.verses).keys),
    saTexts,
    LATIN_GRAM,
    corpus.sanskritIdfTexts ? sortedMap(corpus.sanskritIdfTexts, latinUnits) : saTexts
  );

  const out: Record<string, CitationCheckRecord> = {};
  entries.forEach((entry, qi) => {
    const citedIds = citedCanonIds(entry);
    const h = classify(han, qi, citedIds, (id) => corpus.titles[id] || id);
    const rec: CitationCheckRecord = {
      cited: citedIds.map((id) => ({
        id,
        inCbeta: !corpus.missing.includes(id) && han.has(id),
        coverage: h.citedCoverage.get(id) || 0,
      })),
      status: h.status,
    };
    if (h.best) rec.best = h.best;
    if (sa.gramCount[qi]) {
      const file = citedSanskritFile(entry);
      const s = classify(sa, qi, file ? [file] : [], (id) => id);
      rec.sanskrit = { status: s.status };
      if (s.best) {
        const url = corpus.sanskritUrls?.[s.best.id];
        rec.sanskrit.best = url ? { ...s.best, url: gretilMirrorUrl(url) } : s.best;
      }
      if (file) rec.sanskrit.citedFile = file;
    }
    out[entry.id] = rec;
  });
  return out;
}

export const CITATION_STATUS_LABEL_ZH: Record<CitationStatus, string> = {
  verified: '已与所标原典核对一致',
  'located-elsewhere': '所标经号中未见此咒，代码已在另一部原典中定位到它',
  variant: '与原典为不同传本／译本（部分吻合）',
  unverified: '原典中未检得此汉字咒文（多为后世课诵本或现代音译）',
  'short-formula': '咒文过短，为众经通用短咒，无法判定单一出处；所标经号中亦未检得',
  'no-han-text': '本条无汉字咒文可供核对',
};

export const SANSKRIT_STATUS_LABEL_ZH: Record<CitationStatus, string> = {
  verified: '梵文转写与所标梵文原典（GRETIL）核对一致',
  'located-elsewhere': '梵文转写在另一部梵文原典（GRETIL）中检得',
  variant: '梵文转写与梵文原典部分吻合（不同校本或有改写）',
  unverified: '已收梵文原典（GRETIL）中未检得此梵文转写——应视为整理者还原／参考转写，而非梵文原典原文',
  'short-formula': '梵文过短，为通用短咒，无法判定单一出处',
  'no-han-text': '本条无梵文转写',
};
