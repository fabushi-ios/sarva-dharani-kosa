/**
 * scripts/fetch-canon-sources.ts (run: npx tsx scripts/fetch-canon-sources.ts)
 *
 * Gathers, from the source databases, every canon text a hand-authored entry may come from:
 *   1. every canon number the entry cites (T, X, J, F, … — one generic ID rule);
 *   2. texts found by CBETA's full-text search over the WHOLE CBETA collection (all canons):
 *      evenly spaced 4-character probes of the entry's Chinese (interlinear annotations removed);
 *   3. the best-overlapping texts among the 614 Taishō esoteric dhāraṇī extracts.
 * Each candidate's CBETA TEI-P5 XML is downloaded (cached in data/raw/cbeta/xml-cache/, gitignored)
 * and parsed by the same parser the reader uses (parseCbetaXml → full paragraphs). The citation
 * check then picks each entry's real source; only cited and chosen texts are written to the
 * committed compact corpus, so scripts/build-citation-check.ts reproduces the same choice offline.
 *
 * Every Sanskrit witness cited by an entry (provenance.gretilRawUrl) is downloaded as plain text.
 *
 * Output: data/raw/cbeta/canon-sources.json.gz
 *   { paragraphs: {id: [[kind, text]]}, titles, bylines, missing: [id], gretil: {file: text} }
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {
  CANON_SOURCES_FILE,
  assembleCorpus,
  chosenHanSource,
  curatedEntries,
  packParagraphs,
  readMikkyoExtracts,
  type CanonSources,
} from './build-citation-check';
import {
  cbetaXmlUrl,
  citedCanonIds,
  computeCitationCheck,
  rankHanCandidates,
} from '../src/core/sources/citationCheck';
import { htmlToText } from '../src/core/sources/htmlText';
import { stripShortHanAnnotations } from '../src/core/sources/textAlignment';
import { parseCbetaXml } from '../src/services/cbeta/cbetaLiveService';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CACHE = path.join(ROOT, 'data/raw/cbeta/xml-cache');
const SEARCH = 'https://cbdata.dila.edu.tw/stable/search';
const PROBE_LEN = 4;
const PROBES_PER_ENTRY = 16;
/** A probe found in more texts than this is a stock formula: no evidence of the source. */
const PROBE_MAX_HITS = 40;
const SEARCH_CANDIDATES = 6;
const DOWNLOAD_CONCURRENCY = 8;
/** The CBETA search service is a shared public API: few parallel requests. */
const SEARCH_CONCURRENCY = 2;

async function pool<T>(items: T[], fn: (x: T) => Promise<void>, CONCURRENCY = DOWNLOAD_CONCURRENCY) {
  let i = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (i < items.length) await fn(items[i++]);
    })
  );
}

async function fetchRetry(url: string): Promise<Response | null> {
  for (let i = 0; i < 5; i++) {
    const r = await fetch(url, { signal: AbortSignal.timeout(30_000) }).catch(() => null);
    if (r && (r.ok || r.status === 404)) return r;
    await new Promise((res) => setTimeout(res, 500 * (i + 1)));
  }
  return null;
}

const entries = curatedEntries();
const failed: string[] = [];

// 1. Cited canon numbers and Sanskrit witnesses.
const cited = new Set<string>();
const gretilUrls = new Set<string>();
for (const e of entries) {
  for (const id of citedCanonIds(e)) cited.add(id);
  if (e.provenance.gretilRawUrl) gretilUrls.add(e.provenance.gretilRawUrl);
}

// 2. CBETA full-text search over all collections.
const hanRuns = (e: (typeof entries)[number]) =>
  stripShortHanAnnotations(e.verses.map((v) => v.classicalTranslitZh || '').join(''))
    .replace(/\s+/g, '')
    .split(/[^\p{Script=Han}]+/u)
    .filter((r) => r.length >= PROBE_LEN);
const searched = new Map<string, string[]>();
const probeJobs: Array<{ entry: string; q: string }> = [];
for (const e of entries) {
  const grams: string[] = [];
  for (const run of hanRuns(e)) {
    const cs = Array.from(run);
    for (let i = 0; i + PROBE_LEN <= cs.length; i += PROBE_LEN) grams.push(cs.slice(i, i + PROBE_LEN).join(''));
  }
  const step = Math.max(1, grams.length / PROBES_PER_ENTRY);
  const picked = new Set<string>();
  for (let k = 0; k < grams.length && picked.size < PROBES_PER_ENTRY; k += step) picked.add(grams[Math.floor(k)]);
  for (const q of picked) probeJobs.push({ entry: e.id, q });
}
fs.mkdirSync(CACHE, { recursive: true });
// Search answers are cached (gitignored) so an interrupted run resumes where it stopped.
const PROBE_CACHE = path.join(CACHE, 'search-probes.json');
const probeResult = new Map<string, string[] | null>(
  fs.existsSync(PROBE_CACHE) ? Object.entries(JSON.parse(fs.readFileSync(PROBE_CACHE, 'utf8'))) : []
);
const uniqueProbes = [...new Set(probeJobs.map((j) => j.q))];
let done = 0;
const saveProbes = () => fs.writeFileSync(PROBE_CACHE, JSON.stringify(Object.fromEntries(probeResult)));
// SEARCH=cache-only: use cached answers only (development when the public API is unavailable).
const cacheOnly = process.env.SEARCH === 'cache-only';
if (cacheOnly) console.warn('SEARCH=cache-only: uncached probes skipped — do not commit this output');
await pool(uniqueProbes.filter((q) => !cacheOnly && !probeResult.has(q)), async (q) => {
  const url = `${SEARCH}?q=${encodeURIComponent(q)}&rows=${PROBE_MAX_HITS}&fields=file`;
  const r = await fetchRetry(url);
  if (!r || !r.ok) {
    failed.push(`search:${q}`);
    return;
  }
  const d = (await r.json()) as { num_found: number; results: Array<{ file: string }> };
  probeResult.set(q, d.num_found > PROBE_MAX_HITS ? null : [...new Set(d.results.map((x) => x.file))]);
  if (++done % 100 === 0) {
    saveProbes();
    console.log(`search probes: ${done}`);
  }
}, SEARCH_CONCURRENCY);
saveProbes();
console.log(`search probes done: ${uniqueProbes.length}`);
for (const e of entries) {
  const score = new Map<string, number>();
  for (const j of probeJobs) {
    if (j.entry !== e.id) continue;
    for (const f of probeResult.get(j.q) || []) score.set(f, (score.get(f) || 0) + 1);
  }
  searched.set(
    e.id,
    [...score.entries()]
      .filter(([, s]) => s >= 2)
      .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
      .slice(0, SEARCH_CANDIDATES)
      .map(([f]) => f)
  );
}

// 3. Best-overlapping Taishō esoteric texts.
const mikkyo = readMikkyoExtracts();
const mikkyoTop = rankHanCandidates(entries, mikkyo);

const candidates = new Set<string>(cited);
for (const e of entries) {
  for (const f of searched.get(e.id) || []) candidates.add(f);
  for (const f of mikkyoTop[e.id] || []) candidates.add(f);
}

// Download + parse.
console.log(`candidate texts: ${candidates.size}`);
const src: CanonSources = { paragraphs: {}, titles: {}, bylines: {}, missing: [], gretil: {} };
await pool([...candidates].sort(), async (id) => {
  const file = path.join(CACHE, `${id}.xml`);
  let xml: string | null = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (xml === null) {
    const r = await fetchRetry(cbetaXmlUrl(id));
    if (!r) {
      failed.push(id);
      return;
    }
    if (r.status === 404) {
      if (cited.has(id)) src.missing.push(id);
      return;
    }
    xml = await r.text();
    fs.writeFileSync(file, xml);
  }
  const vol = (id.match(/^([A-Z]{1,2}\d{2,3})n/) || ['', ''])[1];
  const parsed = parseCbetaXml(id, vol, xml, cbetaXmlUrl(id));
  src.paragraphs[id] = packParagraphs(parsed.fullParagraphs);
  src.titles[id] = parsed.titleZh;
  src.bylines[id] = parsed.translator;
});
await pool([...gretilUrls].sort(), async (url) => {
  const file = url.split('/').pop() || url;
  const r = await fetchRetry(url);
  if (!r) failed.push(url);
  else if (r.status === 404) src.missing.push(file);
  else src.gretil[file] = htmlToText(await r.text());
});
if (failed.length) {
  console.error(`network failures (nothing written): ${failed.slice(0, 20).join(', ')} … (${failed.length})`);
  process.exit(1);
}

// Choose each entry's source over all candidates; keep cited + chosen texts only.
const check = computeCitationCheck(entries, assembleCorpus(src));
const keep = new Set<string>([...cited].filter((id) => src.paragraphs[id]));
for (const e of entries) {
  const rec = check[e.id];
  const id = chosenHanSource(rec);
  if (id && src.paragraphs[id]) keep.add(id);
  if (rec.best && src.paragraphs[rec.best.id]) keep.add(rec.best.id);
}
const pick = <T>(o: Record<string, T>) =>
  Object.fromEntries(Object.entries(o).filter(([id]) => keep.has(id)).sort(([a], [b]) => (a < b ? -1 : 1)));
const out: CanonSources = {
  paragraphs: pick(src.paragraphs),
  titles: pick(src.titles),
  bylines: pick(src.bylines),
  missing: src.missing.sort(),
  gretil: Object.fromEntries(Object.entries(src.gretil).sort(([a], [b]) => (a < b ? -1 : 1))),
};
fs.writeFileSync(CANON_SOURCES_FILE, zlib.gzipSync(JSON.stringify(out), { level: 9 }));
console.log(
  `probes: ${uniqueProbes.length}; candidates: ${candidates.size}; kept: ${keep.size}; ` +
    `not in CBETA: ${out.missing.join(', ') || 'none'}; ` +
    `size: ${(fs.statSync(CANON_SOURCES_FILE).size / 1e6).toFixed(1)} MB`
);
