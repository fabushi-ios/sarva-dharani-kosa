/**
 * scripts/build_cloud_corpus_shards.ts
 *
 * Plan 3 Cloud Corpus & Pre-built Search Index Compiler:
 * Compiles the 2,051 Dhāraṇī entries, 12 Global Databases (DB1–DB12),
 * 735 Göttingen GRETIL Sanskrit manuscripts, 24 CBETA Siddhaṃ interlinear records,
 * and 614 Taishō Mikkyō (T18–T21, 14,485 dharani blocks) scriptures into:
 *
 * 1. `src/data/corpusStats.ts` & `src/data/firstScreenCorpus.ts`
 *    — Ultra-lightweight zero-wait first-screen bootstrap corpus so the React app
 *      renders and becomes interactive in < 80ms with ZERO loading screen.
 * 2. `public/corpus/*.json` and `public/corpus/*.json.gz`
 *    — Cloud-hosted corpus shards & pre-computed search index deployed to Hugging Face Hub CDN
 *      (`https://huggingface.co/bhrum108/sarva-dharani-kosa-tts/resolve/main/corpus/...`)
 *      and served via `/api/search` & `/api/corpus/*` with persistent Browser CacheStorage.
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {
  BUILTIN_DHARANI_CORPUS,
  CORPUS_AUTHORITATIVE_STATS,
  DHARANI_CATEGORIES,
} from '../src/data/index';
import { TAISHO_MIKKYO_FILE_INDEX } from '../src/data/kosa-generated/taishoMikkyoIndex';
import { normalizeSearchText } from '../src/core/search/searchEngine';
import {
  CANONICAL_DATABASE_IDS,
  UNIFIED_QUADRILINGUAL_GLOSSARY,
} from '../src/data/unifiedCorpusRegistry';
import { searchAllDatabases } from '../src/core/searchEngine';
import type { DharaniEntry, DharaniVerse } from '../src/types/kosaTypes';

const ROOT_DIR = process.cwd();
const OUT_CORPUS_DIR = path.join(ROOT_DIR, 'public', 'corpus');

function serializeVerse(v: DharaniVerse, isCurated: boolean): DharaniVerse {
  const wordsDesc = Object.getOwnPropertyDescriptor(v, 'words');
  const hasExplicitWords =
    isCurated &&
    wordsDesc &&
    'value' in wordsDesc &&
    Array.isArray(wordsDesc.value) &&
    wordsDesc.value.length > 0 &&
    v.fieldSources?.words !== 'derived-reference';

  const classicalDesc = Object.getOwnPropertyDescriptor(v, 'classicalTranslitZh');
  const hasExplicitClassical =
    Boolean(classicalDesc && 'value' in classicalDesc && classicalDesc.value) &&
    v.fieldSources?.classicalTranslitZh !== 'derived-reference';

  const modernDesc = Object.getOwnPropertyDescriptor(v, 'modernPhoneticZh');
  const hasExplicitModern =
    Boolean(modernDesc && 'value' in modernDesc && modernDesc.value) &&
    v.fieldSources?.modernPhoneticZh !== 'derived-reference';

  const out: Record<string, unknown> = {
    id: v.id,
    index: v.index,
    iast: v.iast,
    meaningZh: v.meaningZh,
    meaningEn: v.meaningEn,
  };
  if (hasExplicitClassical) {
    out.classicalTranslitZh = v.classicalTranslitZh;
  }
  if (hasExplicitModern) {
    out.modernPhoneticZh = v.modernPhoneticZh;
  }
  if (v.tangNoteZh) {
    out.tangNoteZh = v.tangNoteZh;
  }
  if (hasExplicitWords) {
    out.words = wordsDesc.value;
  }
  if (v.fieldSources) {
    out.fieldSources =
      !hasExplicitWords && v.fieldSources.words === 'db-original'
        ? { ...v.fieldSources, words: 'derived-reference' }
        : v.fieldSources;
  }
  if (v.siddhamOriginal) {
    out.siddhamOriginal = v.siddhamOriginal;
  }
  if (v.devanagariOriginal) {
    out.devanagariOriginal = v.devanagariOriginal;
  }
  if (v.diplomaticOriginal) {
    out.diplomaticOriginal = v.diplomaticOriginal;
  }
  return out as unknown as DharaniVerse;
}

function serializeEntry(entry: DharaniEntry, isCurated: boolean): DharaniEntry {
  return {
    ...entry,
    verses: entry.verses.map((v) => serializeVerse(v, isCurated)),
  };
}

function writeJsonAndGzip(filePath: string, data: unknown): { rawBytes: number; gzBytes: number } {
  const jsonStr = JSON.stringify(data);
  const rawBuf = Buffer.from(jsonStr, 'utf8');
  const gzBuf = zlib.gzipSync(rawBuf, { level: 9 });
  fs.writeFileSync(filePath, rawBuf);
  fs.writeFileSync(`${filePath}.gz`, gzBuf);
  return { rawBytes: rawBuf.length, gzBytes: gzBuf.length };
}

function main() {
  fs.mkdirSync(OUT_CORPUS_DIR, { recursive: true });

  console.log(`[1/5] Partitioning ${BUILTIN_DHARANI_CORPUS.length} authoritative Dhāraṇī entries...`);

  const curatedEntries: DharaniEntry[] = [];
  const global12DbEntries: DharaniEntry[] = [];
  const gretilEntries: DharaniEntry[] = [];

  for (const entry of BUILTIN_DHARANI_CORPUS) {
    if (entry.provenance.sourceType === 'GLOBAL-12DB' || entry.provenance.databaseId) {
      global12DbEntries.push(serializeEntry(entry, false));
    } else if (entry.categoryId === 'gretil-canonical') {
      gretilEntries.push(serializeEntry(entry, false));
    } else {
      curatedEntries.push(serializeEntry(entry, true));
    }
  }

  console.log(
    `  -> Curated: ${curatedEntries.length}, Global 12-DB: ${global12DbEntries.length}, GRETIL: ${gretilEntries.length}`
  );

  // 2. Build Pre-computed Search Index (all 2,051 entries + 614 Taisho scriptures + 12-DB glossary/specialized records)
  console.log('[2/5] Pre-computing normalized multi-script search index...');
  const prebuiltEntryIndex: Array<{
    id: string;
    t: string; // normTitle
    d: string; // normDbAndNo
    m: string; // normDeity
    v: string[]; // normVerses
  }> = [];

  for (const entry of BUILTIN_DHARANI_CORPUS) {
    const normTitle = normalizeSearchText(
      `${entry.titleZh} ${entry.titleSanskritIast} ${entry.titleEnglish}`
    );
    const normDbAndNo = normalizeSearchText(
      `${entry.taishoNo} ${entry.provenance.cbetaId || ''} ${entry.provenance.gretilFile || ''} ${entry.provenance.databaseId || ''} ${entry.provenance.databaseBadgeZh || ''}`
    );
    const normDeity = normalizeSearchText(
      `${entry.deityZh} ${entry.translatorZh} ${entry.sutraSourceZh} ${entry.meritsAndSummaryZh}`
    );
    const normVerses = entry.verses.map((v) => {
      const classicalDesc = Object.getOwnPropertyDescriptor(v, 'classicalTranslitZh');
      const classicalStr =
        classicalDesc && 'value' in classicalDesc ? String(classicalDesc.value || '') : '';
      const modernDesc = Object.getOwnPropertyDescriptor(v, 'modernPhoneticZh');
      const modernStr =
        modernDesc && 'value' in modernDesc ? String(modernDesc.value || '') : '';
      return normalizeSearchText(`${v.iast} ${classicalStr} ${modernStr} ${v.meaningZh || ''}`);
    });
    prebuiltEntryIndex.push({
      id: entry.id,
      t: normTitle,
      d: normDbAndNo,
      m: normDeity,
      v: normVerses,
    });
  }

  const taishoCompactIndex = TAISHO_MIKKYO_FILE_INDEX.map((ts) => ({
    ...ts,
    normHay: normalizeSearchText(
      `${ts.id} ${ts.titleZh} ${ts.titleTrad} ${ts.translator} ${ts.sampleDharanis.join(' ')}`
    ),
  }));

  // Pre-extract representative searchable hits across all 12 databases for specialized queries
  const specialized12DbRecords: Array<{
    id: string;
    dbId: string;
    databaseNumber: number;
    title: string;
    subtitle: string;
    sanskritIast?: string;
    chineseText?: string;
    tibetanText?: string;
    snippet: string;
    canonicalRefs?: string[];
    normHay: string;
  }> = [];

  for (const dbId of CANONICAL_DATABASE_IDS) {
    const hits = searchAllDatabases('a', { dbId, limit: 80 });
    for (const h of hits) {
      specialized12DbRecords.push({
        id: h.id,
        dbId: h.dbId,
        databaseNumber: h.databaseNumber,
        title: h.title,
        subtitle: h.subtitle,
        sanskritIast: h.sanskritIast,
        chineseText: h.chineseText,
        tibetanText: h.tibetanText,
        snippet: h.snippet,
        canonicalRefs: h.canonicalRefs,
        normHay: normalizeSearchText(
          `${h.id} ${h.title} ${h.subtitle} ${h.sanskritIast || ''} ${h.chineseText || ''} ${h.tibetanText || ''} ${h.snippet} ${(h.canonicalRefs || []).join(' ')}`
        ),
      });
    }
  }

  // 3. Write Cloud Shards to public/corpus/
  console.log('[3/5] Writing cloud shards (.json and .json.gz) to public/corpus/...');
  const sCurated = writeJsonAndGzip(path.join(OUT_CORPUS_DIR, 'shard-curated.json'), curatedEntries);
  const s12Db = writeJsonAndGzip(path.join(OUT_CORPUS_DIR, 'shard-12db.json'), global12DbEntries);
  const sGretil = writeJsonAndGzip(path.join(OUT_CORPUS_DIR, 'shard-gretil.json'), gretilEntries);
  const sTaisho = writeJsonAndGzip(
    path.join(OUT_CORPUS_DIR, 'shard-taisho-index.json'),
    taishoCompactIndex
  );
  const sSearch = writeJsonAndGzip(path.join(OUT_CORPUS_DIR, 'search-index-v1.json'), {
    version: '1.0.0',
    entries: prebuiltEntryIndex,
    specialized12DbRecords,
    quadrilingualGlossary: UNIFIED_QUADRILINGUAL_GLOSSARY,
  });

  const lexFile = path.join(OUT_CORPUS_DIR, 'sanskrit-lexicon-v1.json');
  const lexGzFile = path.join(OUT_CORPUS_DIR, 'sanskrit-lexicon-v1.json.gz');
  const hasLexShard = fs.existsSync(lexFile) && fs.existsSync(lexGzFile);
  const lexCount = hasLexShard
    ? Object.keys(JSON.parse(fs.readFileSync(lexFile, 'utf8')) as Record<string, unknown>).length
    : 0;

  const manifest = {
    version: '1.1.0',
    generatedAt: new Date().toISOString(),
    stats: CORPUS_AUTHORITATIVE_STATS,
    shards: {
      curated: {
        file: 'shard-curated.json',
        gzFile: 'shard-curated.json.gz',
        count: curatedEntries.length,
        ...sCurated,
      },
      global12db: {
        file: 'shard-12db.json',
        gzFile: 'shard-12db.json.gz',
        count: global12DbEntries.length,
        ...s12Db,
      },
      gretil: {
        file: 'shard-gretil.json',
        gzFile: 'shard-gretil.json.gz',
        count: gretilEntries.length,
        ...sGretil,
      },
      taishoIndex: {
        file: 'shard-taisho-index.json',
        gzFile: 'shard-taisho-index.json.gz',
        count: taishoCompactIndex.length,
        ...sTaisho,
      },
      searchIndex: {
        file: 'search-index-v1.json',
        gzFile: 'search-index-v1.json.gz',
        count: prebuiltEntryIndex.length,
        ...sSearch,
      },
      ...(hasLexShard
        ? {
            sanskritLexicon: {
              file: 'sanskrit-lexicon-v1.json',
              gzFile: 'sanskrit-lexicon-v1.json.gz',
              count: lexCount,
              rawBytes: fs.statSync(lexFile).size,
              gzBytes: fs.statSync(lexGzFile).size,
            },
          }
        : {}),
    },
  };
  writeJsonAndGzip(path.join(OUT_CORPUS_DIR, 'manifest.json'), manifest);

  console.log('  Shard sizes (raw -> gzip):');
  for (const [k, v] of Object.entries(manifest.shards)) {
    console.log(
      `    • ${k.padEnd(12)}: ${(v.rawBytes / 1024).toFixed(1)} KB -> ${(v.gzBytes / 1024).toFixed(1)} KB (${v.count} items)`
    );
  }

  // 4. Generate src/data/corpusStats.ts (Zero-dependency authoritative stats)
  console.log('[4/5] Generating src/data/corpusStats.ts...');
  const statsCode = `/**
 * Auto-generated zero-dependency authoritative corpus statistics.
 * Decouples Header & UI badges from loading 6 MB of raw corpus modules on startup.
 */
export const CORPUS_AUTHORITATIVE_STATS = ${JSON.stringify(CORPUS_AUTHORITATIVE_STATS, null, 2)};
`;
  fs.writeFileSync(path.join(ROOT_DIR, 'src', 'data', 'corpusStats.ts'), statsCode, 'utf8');

  // 5. Generate src/data/firstScreenCorpus.ts (Ultra-fast instant-boot corpus)
  console.log('[5/5] Generating src/data/firstScreenCorpus.ts...');
  const selectedIds = new Set<string>();
  const fastBootEntries: DharaniEntry[] = [];

  const addEntry = (e: DharaniEntry | undefined, isPrimaryFirstEntry = false) => {
    if (!e || selectedIds.has(e.id)) return;
    selectedIds.add(e.id);
    const cloned = serializeEntry(e, isPrimaryFirstEntry);
    if (!isPrimaryFirstEntry) {
      cloned.provenance = {
        ...cloned.provenance,
        rawSnippet: cloned.provenance.rawSnippet
          ? Array.from(cloned.provenance.rawSnippet).slice(0, 260).join('')
          : undefined,
        cbetaInterlinearTokens: cloned.provenance.cbetaInterlinearTokens
          ? cloned.provenance.cbetaInterlinearTokens.slice(0, 12)
          : undefined,
      };
    }
    fastBootEntries.push(cloned);
  };

  // Always include top 6 major/curated dharanis first (with full tokens/words on #1)
  for (let i = 0; i < Math.min(6, curatedEntries.length); i++) {
    addEntry(curatedEntries[i], i === 0);
  }

  // Ensure every category has at least 2 immediate entries at 0ms
  for (const cat of DHARANI_CATEGORIES) {
    const matches = BUILTIN_DHARANI_CORPUS.filter((e) => e.categoryId === cat.id).slice(0, 2);
    for (const m of matches) addEntry(m, false);
  }

  // Ensure every one of the 12 Global Databases (DB1-DB12) has an immediate flagship entry at 0ms
  for (const dbId of CANONICAL_DATABASE_IDS) {
    const match = global12DbEntries.find((e) => e.provenance.databaseId === dbId);
    addEntry(match, false);
  }

  const firstScreenCode = `/**
 * Auto-generated First-Screen Instant-Boot Corpus (${fastBootEntries.length} flagship entries).
 * Enables < 80ms zero-wait first render while the remaining 2,000+ entries stream
 * from Hugging Face Cloud Corpus Shards & Browser CacheStorage ('sarva-dharani-corpus-v1').
 */
import type { DharaniEntry, DharaniVerse } from '../types/kosaTypes';
import {
  buildWordGlossesFromIast,
  generateVerseChinesePhonetics,
} from '../core/sanskrit/phoneticMapper';

export function attachLazyWordsToVerse(v: DharaniVerse): DharaniVerse {
  const wordsDesc = Object.getOwnPropertyDescriptor(v, 'words');
  const classicalDesc = Object.getOwnPropertyDescriptor(v, 'classicalTranslitZh');
  const modernDesc = Object.getOwnPropertyDescriptor(v, 'modernPhoneticZh');

  const hasWords =
    (wordsDesc && typeof wordsDesc.get === 'function') ||
    (Array.isArray(v.words) && v.words.length > 0);
  const hasClassical =
    (classicalDesc && typeof classicalDesc.get === 'function') ||
    Boolean(classicalDesc && 'value' in classicalDesc && classicalDesc.value);
  const hasModern =
    (modernDesc && typeof modernDesc.get === 'function') ||
    Boolean(modernDesc && 'value' in modernDesc && modernDesc.value);

  if (hasWords && hasClassical && hasModern) {
    return v;
  }

  let cachedPhonetics: { classicalTranslitZh: string; modernPhoneticZh: string } | null = null;
  let cachedWords: DharaniVerse['words'] | null = null;
  const getPhon = () => {
    if (!cachedPhonetics) {
      cachedPhonetics = generateVerseChinesePhonetics(v.iast);
    }
    return cachedPhonetics;
  };

  const clone = { ...v };
  if (!hasClassical) {
    Object.defineProperty(clone, 'classicalTranslitZh', {
      enumerable: true,
      configurable: true,
      get() {
        return getPhon().classicalTranslitZh;
      },
    });
  }
  if (!hasModern) {
    Object.defineProperty(clone, 'modernPhoneticZh', {
      enumerable: true,
      configurable: true,
      get() {
        return getPhon().modernPhoneticZh;
      },
    });
  }
  if (!hasWords) {
    Object.defineProperty(clone, 'words', {
      enumerable: true,
      configurable: true,
      get() {
        if (!cachedWords) {
          cachedWords = buildWordGlossesFromIast(v.iast);
        }
        return cachedWords;
      },
    });
  }
  return clone;
}

export function attachLazyWordsToEntries(entries: DharaniEntry[]): DharaniEntry[] {
  return entries.map((entry) => ({
    ...entry,
    verses: entry.verses.map(attachLazyWordsToVerse),
  }));
}

const RAW_FIRST_SCREEN_ENTRIES = (${JSON.stringify(fastBootEntries)} as unknown) as DharaniEntry[];

export const FIRST_SCREEN_CORPUS: DharaniEntry[] = attachLazyWordsToEntries(RAW_FIRST_SCREEN_ENTRIES);
`;
  const firstScreenPath = path.join(ROOT_DIR, 'src', 'data', 'firstScreenCorpus.ts');
  fs.writeFileSync(firstScreenPath, firstScreenCode, 'utf8');
  console.log(
    `  -> firstScreenCorpus.ts: ${fastBootEntries.length} entries (${(fs.statSync(firstScreenPath).size / 1024).toFixed(1)} KB)`
  );
}

main();
