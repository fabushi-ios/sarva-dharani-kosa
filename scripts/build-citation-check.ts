/**
 * scripts/build-citation-check.ts
 *
 * Generates, for every hand-authored entry (the curated modules):
 *   src/data/kosa-generated/citationCheck.ts — code-rule verification of its citations and the
 *     auto-located real source (see src/core/sources/citationCheck.ts);
 *   src/data/kosa-generated/curatedCanon.ts  — the source database's own wording of the entry's
 *     dhāraṇī (CBETA Chinese, GRETIL Sanskrit), split into the entry's verses
 *     (see src/core/sources/canonicalText.ts). src/data/index.ts serves this text instead of the
 *     hand-typed one, so the database is the standard of correctness.
 *
 * Inputs (produced by scripts/fetch-canon-sources.ts from CBETA TEI-P5 XML and GRETIL):
 *   data/raw/cbeta/canon-sources.json.gz  — full paragraphs of every cited / located canon text
 *   data/raw/taisho/dharani-fulltext.json — dhāraṇī blocks of the 614 Taishō esoteric texts
 *     (fixed IDF reference and fallback match targets)
 *   Sanskrit witnesses: GRETIL files (in the .gz), data/raw/gretil/*.htm, GRETIL mantra extracts.
 *
 * Run: npx tsx scripts/build-citation-check.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import type { DharaniEntry } from '../src/types/kosaTypes';
import {
  computeCitationCheck,
  gretilMirrorUrl,
  idfWeights,
  MIN_LOCATABLE_GRAMS,
  type CanonTextCorpus,
  type CitationCheckRecord,
} from '../src/core/sources/citationCheck';
import { extractCanonical, type SourceParagraph } from '../src/core/sources/canonicalText';
import {
  COVERAGE_MATCH,
  COVERAGE_VARIANT,
  entryHanQuery,
  entryLatinQuery,
} from '../src/core/sources/textAlignment';
import type { CuratedCanonRecord } from '../src/core/sources/curatedCanonTypes';
import { MAJOR_DHARANIS } from '../src/data/kosa-corpus/major-dharanis';
import { TEN_SMALL_DHARANIS } from '../src/data/kosa-corpus/ten-small-dharanis';
import { BUDDHAS_AND_PROTECTORS_DHARANIS } from '../src/data/kosa-corpus/buddhas-bodhisattvas';
import { EXPANDED_FAMOUS_DHARANIS } from '../src/data/kosa-corpus/expanded-famous-dharanis';
import { WORLD_ENCYCLOPEDIA_DHARANIS } from '../src/data/kosa-corpus/world-mantras-encyclopedia';
import { TAISHO_MIKKYO_FILE_INDEX } from '../src/data/kosa-generated/taishoMikkyoIndex';
import { ALL_GRETIL_MANTRA_RECORDS } from '../src/data/kosa-generated/gretilAllMantras';
import { AUTHORITATIVE_GRETIL_RECORDS } from '../src/data/kosa-generated/gretilAuthRecords';
import { htmlToText } from '../src/core/sources/htmlText';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const OUT_FILE = path.join(ROOT, 'src/data/kosa-generated/citationCheck.ts');
export const CANON_OUT_FILE = path.join(ROOT, 'src/data/kosa-generated/curatedCanon.ts');
export const CANON_SOURCES_FILE = path.join(ROOT, 'data/raw/cbeta/canon-sources.json.gz');

/** Hand-authored modules = every corpus module that is not generated from a source database. */
export function curatedEntries(): DharaniEntry[] {
  return [
    ...MAJOR_DHARANIS,
    ...TEN_SMALL_DHARANIS,
    ...BUDDHAS_AND_PROTECTORS_DHARANIS,
    ...EXPANDED_FAMOUS_DHARANIS,
    ...WORLD_ENCYCLOPEDIA_DHARANIS,
  ];
}

/** Paragraph kinds stored compactly: d = dhāraṇī, h = heading/byline, t = prose. */
export type PackedParagraph = [string, string];
export interface CanonSources {
  paragraphs: Record<string, PackedParagraph[]>;
  titles: Record<string, string>;
  bylines: Record<string, string>;
  missing: string[];
  gretil: Record<string, string>;
}

const KIND: Record<string, SourceParagraph['kind']> = { d: 'dharani', h: 'head', t: 'text' };
export const packParagraphs = (ps: SourceParagraph[]): PackedParagraph[] =>
  ps.map((p) => [p.kind[0] === 'd' ? 'd' : p.kind[0] === 'h' ? 'h' : 't', p.text]);
export const unpackParagraphs = (ps: PackedParagraph[]): SourceParagraph[] =>
  ps.map(([k, text]) => ({ kind: KIND[k] || 'text', text }));
export const joinParagraphs = (ps: Array<{ text: string }>) => ps.map((p) => p.text).join('\n');
const linesAsParagraphs = (s: string): SourceParagraph[] =>
  s
    .split('\n')
    .filter((l) => l.trim())
    .map((text) => ({ kind: 'text' as const, text }));

export function readCanonSources(file = CANON_SOURCES_FILE): CanonSources {
  return JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString('utf8')) as CanonSources;
}

export function readMikkyoExtracts(): Record<string, string> {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'data/raw/taisho/dharani-fulltext.json'), 'utf8'));
}

/**
 * Corpus for the check: the full paragraphs of every fetched canon text (IDF over the fixed
 * collection of the 614 Taishō esoteric dhāraṇī extracts); Sanskrit witnesses.
 */
export function assembleCorpus(src: CanonSources): CanonTextCorpus {
  const mikkyo = readMikkyoExtracts();
  // Match targets are complete texts only (a source must be readable in full to take its wording);
  // the esoteric dhāraṇī extracts serve as the fixed IDF reference.
  const texts: Record<string, string> = {};
  const titles: Record<string, string> = {};
  for (const f of TAISHO_MIKKYO_FILE_INDEX) titles[f.id] = f.titleTrad;
  for (const [id, ps] of Object.entries(src.paragraphs)) texts[id] = joinParagraphs(unpackParagraphs(ps));
  Object.assign(titles, src.titles);
  const sanskrit: Record<string, string> = {};
  const sanskritUrls: Record<string, string> = {};
  for (const r of ALL_GRETIL_MANTRA_RECORDS) {
    sanskrit[r.file] = r.mantraVerses.join('\n');
    sanskritUrls[r.file] = r.gretilUrl;
  }
  for (const r of AUTHORITATIVE_GRETIL_RECORDS) {
    sanskrit[r.file] = r.extractedVerses.join('\n');
    sanskritUrls[r.file] = r.gretilRawUrl;
  }
  for (const e of curatedEntries()) {
    const u = e.provenance.gretilRawUrl;
    if (u) sanskritUrls[u.split('/').pop() || u] = u;
  }
  const gretilDir = path.join(ROOT, 'data/raw/gretil');
  for (const f of fs.readdirSync(gretilDir).filter((x) => /\.html?$/.test(x)).sort()) {
    sanskrit[f] = htmlToText(fs.readFileSync(path.join(gretilDir, f), 'utf8'));
  }
  Object.assign(sanskrit, src.gretil);
  return {
    texts,
    titles,
    missing: src.missing,
    sanskrit,
    sanskritUrls,
    hanIdfTexts: mikkyo,
    // Sanskrit IDF reference: the GRETIL collection held in the repository (fixed).
    sanskritIdfTexts: Object.fromEntries(Object.entries(sanskrit).filter(([f]) => !(f in src.gretil))),
  };
}

/** The canon text an entry's Chinese is taken from: a cited text that contains it, else the located best. */
export function chosenHanSource(rec: CitationCheckRecord): string | undefined {
  const cited = rec.cited
    .filter((c) => c.inCbeta && c.coverage >= COVERAGE_MATCH)
    .sort((a, b) => b.coverage - a.coverage || (a.id < b.id ? -1 : 1))[0];
  if (cited) return cited.id;
  if (rec.best && rec.best.coverage >= COVERAGE_VARIANT && rec.status !== 'short-formula') return rec.best.id;
  return undefined;
}

/**
 * An extraction is accepted when the passage corresponds to the entry both ways at least at the
 * variant level (coverage and precision ≥ COVERAGE_VARIANT) and shares enough n-grams to be a
 * located text at all (≥ MIN_LOCATABLE_GRAMS) — or, for a short entry, matches fully (a short entry
 * only gets here when its cited text contains it, see chosenHanSource).
 */
const acceptable = (
  x: { coverage: number; precision: number; sharedGrams: number } | null,
  minCoverage: number
) =>
  Boolean(
    x &&
      x.coverage >= minCoverage &&
      x.precision >= COVERAGE_VARIANT &&
      (x.sharedGrams >= MIN_LOCATABLE_GRAMS || x.coverage >= COVERAGE_MATCH)
  );

export function computeCuratedCanon(
  entries: DharaniEntry[],
  check: Record<string, CitationCheckRecord>,
  src: CanonSources,
  corpus: CanonTextCorpus
): Record<string, CuratedCanonRecord> {
  const out: Record<string, CuratedCanonRecord> = {};
  // Evidence is weighted like the check: stock formulae (曩莫三滿多沒馱喃 …) count for little.
  const hanW = idfWeights(entries.map((e) => entryHanQuery(e.verses).keys), corpus.hanIdfTexts || corpus.texts, 'han');
  const saW = idfWeights(
    entries.map((e) => entryLatinQuery(e.verses).keys),
    corpus.sanskritIdfTexts || corpus.sanskrit || {},
    'latin'
  );
  for (const e of entries) {
    const rec = check[e.id];
    const r: CuratedCanonRecord = {};
    const hanId = rec && chosenHanSource(rec);
    if (hanId && src.paragraphs[hanId]) {
      const x = extractCanonical(
        'han',
        e.verses.map((v) => v.classicalTranslitZh || ''),
        unpackParagraphs(src.paragraphs[hanId]),
        hanW
      );
      if (x && acceptable(x, COVERAGE_VARIANT)) {
        r.han = {
          sourceId: hanId,
          title: src.titles[hanId] || hanId,
          byline: src.bylines[hanId] || '',
          coverage: x.coverage,
          precision: x.precision,
          verses: x.verses,
        };
      }
    }
    const sb = rec?.sanskrit?.best;
    // Same rule as the Chinese: the nearest Sanskrit witness (≥ variant level) is the standard.
    if (sb && sb.coverage >= COVERAGE_VARIANT && rec.sanskrit?.status !== 'short-formula' && corpus.sanskrit?.[sb.id]) {
      const x = extractCanonical(
        'latin',
        e.verses.map((v) => v.iast || ''),
        linesAsParagraphs(corpus.sanskrit[sb.id]),
        saW
      );
      if (x && acceptable(x, COVERAGE_VARIANT)) {
        const url = corpus.sanskritUrls?.[sb.id];
        r.sanskrit = {
          file: sb.id,
          url: url ? gretilMirrorUrl(url) : '',
          coverage: x.coverage,
          precision: x.precision,
          verses: x.verses,
        };
      }
    }
    out[e.id] = r;
  }
  return out;
}

const sortedObj = <T>(o: Record<string, T>) =>
  Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : 1)));

export function renderCitationCheckModule(data: Record<string, CitationCheckRecord>): string {
  return [
    '// AUTO-GENERATED BY scripts/build-citation-check.ts — do not edit by hand.',
    '// Code-rule verification of hand-authored entries against the CBETA canon.',
    "import type { CitationCheckRecord } from '../../core/sources/citationCheck';",
    '',
    `export const CITATION_CHECK: Record<string, CitationCheckRecord> = ${JSON.stringify(sortedObj(data), null, 1)};`,
    '',
  ].join('\n');
}

export function renderCuratedCanonModule(data: Record<string, CuratedCanonRecord>): string {
  return [
    '// AUTO-GENERATED BY scripts/build-citation-check.ts — do not edit by hand.',
    '// Source-database wording (CBETA / GRETIL) of every hand-authored entry, split into its verses.',
    "import type { CuratedCanonRecord } from '../../core/sources/curatedCanonTypes';",
    '',
    `export const CURATED_CANON: Record<string, CuratedCanonRecord> = ${JSON.stringify(sortedObj(data), null, 1)};`,
    '',
  ].join('\n');
}

export function buildAll() {
  const src = readCanonSources();
  const corpus = assembleCorpus(src);
  const entries = curatedEntries();
  const check = computeCitationCheck(entries, corpus);
  const canon = computeCuratedCanon(entries, check, src, corpus);
  return { check, canon };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { check, canon } = buildAll();
  fs.writeFileSync(OUT_FILE, renderCitationCheckModule(check));
  fs.writeFileSync(CANON_OUT_FILE, renderCuratedCanonModule(canon));
  const counts: Record<string, number> = {};
  const sa: Record<string, number> = {};
  for (const r of Object.values(check)) {
    counts[r.status] = (counts[r.status] || 0) + 1;
    if (r.sanskrit) sa[r.sanskrit.status] = (sa[r.sanskrit.status] || 0) + 1;
  }
  const canonHan = Object.values(canon).filter((r) => r.han).length;
  const canonSa = Object.values(canon).filter((r) => r.sanskrit).length;
  console.log(`entries: ${Object.keys(check).length}`, counts, 'sanskrit', sa);
  console.log(`Chinese from CBETA: ${canonHan}, Sanskrit from GRETIL: ${canonSa}`);
}
