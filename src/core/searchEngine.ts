/**
 * src/core/searchEngine.ts
 * Milestone 4 (Feature F15): Unified Multi-Script, Diacritic-Insensitive Search Engine
 * Across All 12 Databases + Baseline + Quadrilingual Glossary
 */

import type {
  CorpusScriptType,
  DatabaseId,
  UnifiedSearchHit,
  UnifiedSearchQueryOptions,
} from '../types/corpus';
import {
  BASELINE_CURATED_DHARANIS,
  CANONICAL_DATABASE_IDS,
  CBETA_AUTH_RECORDS,
  GRETIL_AUTH_RECORDS,
  UNIFIED_QUADRILINGUAL_GLOSSARY,
  resolveDatabaseId,
} from '../data/unifiedCorpusRegistry';
import {
  normalizeDiacritics,
  searchTier1Databases,
} from '../services/tier1CorpusService';
import { searchTier23Databases } from '../services/tier23CorpusService';
import {
  devanagariToSlp1,
  siddhamUnicodeToSlp1,
  slp1ToIast,
} from './transliterator';

export interface EnrichedUnifiedSearchHit extends UnifiedSearchHit {
  dbId: DatabaseId | 'baseline';
  databaseId: DatabaseId | 'baseline';
}

export interface UnifiedSearchInputOptions extends Omit<UnifiedSearchQueryOptions, 'dbId'> {
  dbId?: DatabaseId | 'baseline' | string | number;
  script?: CorpusScriptType;
  limit?: number;
}

function toEnrichedHit(hit: UnifiedSearchHit): EnrichedUnifiedSearchHit {
  return {
    ...hit,
    dbId: hit.sourceDb,
    databaseId: hit.sourceDb,
  };
}

/**
 * Expands a query across scripts (Devanāgarī → IAST, Siddhaṃ → IAST,
 * and quadrilingual glossary terms like 般若 / shes rab ↔ prajñā) for cross-script retrieval.
 */
function expandCrossScriptQueries(rawQuery: string): string[] {
  const queries = new Set<string>([rawQuery]);
  const norm = normalizeDiacritics(rawQuery);

  // Devanāgarī range U+0900..U+097F
  if (/[\u0900-\u097F]/.test(rawQuery)) {
    const iast = slp1ToIast(devanagariToSlp1(rawQuery)).trim();
    if (iast && iast.length >= 2) {
      queries.add(iast);
    }
  }

  // Siddhaṃ Unicode range U+11580..U+115FF
  if (/[\u{11580}-\u{115FF}]/u.test(rawQuery)) {
    const iast = slp1ToIast(siddhamUnicodeToSlp1(rawQuery)).trim();
    if (iast && iast.length >= 2) {
      queries.add(iast);
    }
  }

  // Cross-script canonical equivalence for key quadrilingual terms
  if (rawQuery === 'प्रज्ञा' || rawQuery === '般若' || norm === 'shes rab' || norm === 'prajna') {
    queries.add('prajñā');
  }
  if (rawQuery === 'धारणी' || rawQuery === '陀羅尼' || rawQuery === '總持' || norm === 'gzungs') {
    queries.add('dhāraṇī');
  }
  if (norm === 'svaha') {
    queries.add('娑嚩');
    queries.add('薩婆訶');
  }
  if (norm.includes('avalokitesvara')) {
    queries.add('觀自在');
    queries.add('觀世音');
  }
  if (norm.includes('usnisavijaya')) {
    queries.add('尊勝');
  }

  return Array.from(queries);
}

function searchBaselineAndGlossary(
  rawQuery: string,
  normQuery: string,
  targetDb: DatabaseId | 'baseline' | null
): EnrichedUnifiedSearchHit[] {
  const hits: EnrichedUnifiedSearchHit[] = [];

  // 1. Search Unified Quadrilingual Glossary
  for (const g of UNIFIED_QUADRILINGUAL_GLOSSARY) {
    if (targetDb && targetDb !== 'baseline' && g.sourceDb !== targetDb) {
      continue;
    }
    const combined = [
      g.sanskritIast,
      g.tibetanWylie,
      g.tibetanUnicode,
      g.chinese,
      g.siddhamUnicode,
      g.english,
      g.definition,
      g.sourceRef,
    ]
      .filter(Boolean)
      .join(' ');
    if (
      combined.toLowerCase().includes(rawQuery.toLowerCase()) ||
      (normQuery.length >= 2 && normalizeDiacritics(combined).includes(normQuery))
    ) {
      const dbNum = g.sourceDb === 'db2_taisho_ext' ? 2 : g.sourceDb === 'db4_84000' ? 4 : 8;
      hits.push({
        id: `glossary_${g.id}`,
        sourceDb: g.sourceDb,
        dbId: g.sourceDb,
        databaseId: g.sourceDb,
        databaseNumber: dbNum,
        title: `Quadrilingual Glossary: ${g.sanskritIast} → ${g.english}`,
        subtitle: `BO: ${g.tibetanWylie || ''} | ZH: ${g.chinese || ''} [${g.sourceRef}]`,
        matchedField: 'quadrilingualGlossary',
        snippet: `SA: ${g.sanskritIast} | BO: ${g.tibetanWylie || ''} (${g.tibetanUnicode || ''}) | ZH: ${g.chinese || ''} | EN: ${g.english} — ${g.definition || ''}`.trim(),
        sanskritIast: g.sanskritIast,
        siddhamUnicode: g.siddhamUnicode,
        chineseText: g.chinese,
        tibetanText: g.tibetanWylie || g.tibetanUnicode,
        canonicalRefs: [g.sourceRef],
        sourceUrl: 'https://polyglotta.uio.no/index.php?page=fulltext&view=fulltext&vid=263',
      });
    }
  }

  // 2. If not restricted to a single database (or restricted to 'baseline'), also search Baseline Curated Dhāraṇīs, CBETA & GRETIL
  if (!targetDb || targetDb === 'baseline') {
    for (const d of BASELINE_CURATED_DHARANIS) {
      const verseText = d.verses.map((v) => `${v.iast} ${v.tangChinese} ${v.meaningZh} ${v.meaningEn}`).join(' ');
      const combined = `${d.id} ${d.titleZh} ${d.shortTitleZh} ${d.titleSanskrit} ${d.titleEn} ${d.taishoId} ${d.deity} ${verseText}`;
      if (
        combined.toLowerCase().includes(rawQuery.toLowerCase()) ||
        (normQuery.length >= 2 && normalizeDiacritics(combined).includes(normQuery))
      ) {
        hits.push({
          id: `baseline_dharani_${d.id}`,
          sourceDb: 'baseline',
          dbId: 'baseline',
          databaseId: 'baseline',
          databaseNumber: 0,
          title: `${d.titleZh} (${d.titleSanskrit} · ${d.taishoId})`,
          subtitle: `${d.translator} · ${d.deity}`,
          matchedField: 'baselineCuratedDharani',
          snippet: `${d.verses[0]?.iast || ''} | ${d.verses[0]?.tangChinese || ''}`.trim(),
          sanskritIast: d.verses[0]?.iast,
          siddhamUnicode: d.verses[0]?.siddham,
          chineseText: d.verses[0]?.tangChinese,
          canonicalRefs: [d.taishoId, ...(d.authoritativeSource.crossRefs?.tohokuIds || [])],
          sourceUrl: d.authoritativeSource.cbetaRawUrl || 'https://cbetaonline.dila.edu.tw',
        });
      }
    }

    for (const cb of CBETA_AUTH_RECORDS) {
      const combined = `${cb.taishoId} ${cb.title} ${cb.translator} ${cb.dharaniBlocks.map((b) => `${b.iastReconstruction} ${b.chineseText}`).join(' ')}`;
      if (
        combined.toLowerCase().includes(rawQuery.toLowerCase()) ||
        (normQuery.length >= 2 && normalizeDiacritics(combined).includes(normQuery))
      ) {
        const firstBlock = cb.dharaniBlocks[0];
        hits.push({
          id: `baseline_cbeta_${cb.taishoId}`,
          sourceDb: 'baseline',
          dbId: 'baseline',
          databaseId: 'baseline',
          databaseNumber: 0,
          title: `${cb.title} (${cb.taishoId})`,
          subtitle: `${cb.translator} · ${cb.ttAlignmentsCount} <cb:tt> pairs`,
          matchedField: 'cbetaAuthRecord',
          snippet: firstBlock ? `${firstBlock.iastReconstruction} | ${firstBlock.chineseText}` : cb.title,
          sanskritIast: firstBlock?.iastReconstruction,
          siddhamUnicode: firstBlock?.siddhamUnicodeText,
          chineseText: firstBlock?.chineseText,
          canonicalRefs: [cb.taishoId],
          sourceUrl: cb.sourceUrl,
        });
      }
    }

    for (const gr of GRETIL_AUTH_RECORDS) {
      const combined = `${gr.id} ${gr.filename} ${gr.titleSanskrit} ${gr.extractedMantras.join(' ')} ${gr.fullTextExcerpt}`;
      if (
        combined.toLowerCase().includes(rawQuery.toLowerCase()) ||
        (normQuery.length >= 2 && normalizeDiacritics(combined).includes(normQuery))
      ) {
        hits.push({
          id: `baseline_gretil_${gr.id}`,
          sourceDb: 'baseline',
          dbId: 'baseline',
          databaseId: 'baseline',
          databaseNumber: 0,
          title: `${gr.titleSanskrit} (${gr.filename})`,
          subtitle: gr.editionCitation,
          matchedField: 'gretilAuthRecord',
          snippet: gr.extractedMantras[0] || gr.fullTextExcerpt,
          sanskritIast: gr.extractedMantras[0] || gr.fullTextExcerpt,
          canonicalRefs: [gr.filename, gr.id],
          sourceUrl: gr.sourceUrl,
        });
      }
    }
  }

  return hits;
}

/**
 * Searches across all 12 databases + baseline + quadrilingual glossary with
 * cross-script expansion, diacritic-insensitive matching, and strict `--db` isolation.
 */
export function searchAllDatabases(
  query: string,
  options?: UnifiedSearchInputOptions
): EnrichedUnifiedSearchHit[] {
  const rawQuery = String(query ?? '').trim();
  if (!rawQuery) return [];

  const limit = options?.limit ?? 60;
  let targetDb: DatabaseId | 'baseline' | null = null;

  if (options?.dbId !== undefined && options?.dbId !== null && String(options.dbId).trim() !== '') {
    const rawDb = String(options.dbId).trim();
    if (rawDb.toLowerCase() === 'baseline') {
      targetDb = 'baseline';
    } else {
      const resolved = resolveDatabaseId(rawDb);
      if (!resolved) {
        return [];
      }
      targetDb = resolved;
    }
  }

  const expandedQueries = expandCrossScriptQueries(rawQuery);
  const seenIds = new Set<string>();
  const finalHits: EnrichedUnifiedSearchHit[] = [];

  const pushUnique = (hit: EnrichedUnifiedSearchHit) => {
    const key = `${hit.dbId}::${hit.id}`;
    if (!seenIds.has(key) && finalHits.length < limit) {
      seenIds.add(key);
      finalHits.push(hit);
    }
  };

  // Case 1: Strict single-database scoped search (--db specified)
  if (targetDb && targetDb !== 'baseline') {
    const isTier1 = ['db1_fangshan', 'db2_taisho_ext', 'db3_dsbc_gretil', 'db4_84000', 'db5_buddhanexus', 'db6_sarit'].includes(targetDb);
    for (const q of expandedQueries) {
      const dbHits = isTier1
        ? searchTier1Databases(q, { dbId: targetDb, limit })
        : searchTier23Databases(q, { dbId: targetDb, limit });
      for (const h of dbHits) {
        pushUnique({
          ...h,
          sourceDb: targetDb,
          dbId: targetDb,
          databaseId: targetDb,
        });
      }
    }
    return finalHits;
  }

  if (targetDb === 'baseline') {
    for (const q of expandedQueries) {
      const bHits = searchBaselineAndGlossary(q, normalizeDiacritics(q), 'baseline');
      for (const h of bHits) {
        if (h.dbId === 'baseline') pushUnique(h);
      }
    }
    return finalHits;
  }

  // Case 2: Unfiltered search across all 12 databases + baseline + quadrilingual glossary
  // Collect balanced hits per database first so large DBs never starve db9..db12, then fill remaining capacity
  const perDbCap = Math.max(2, Math.floor(limit / 13));
  const overflowHits: EnrichedUnifiedSearchHit[] = [];

  for (const q of expandedQueries) {
    const normQ = normalizeDiacritics(q);

    // First include quadrilingual glossary & baseline hits (capped to keep room for all 12 DBs)
    const glossAndBase = searchBaselineAndGlossary(q, normQ, null);
    for (const gh of glossAndBase.slice(0, 4)) {
      pushUnique(gh);
    }
    for (const gh of glossAndBase.slice(4)) {
      overflowHits.push(gh);
    }

    // Query each of the 12 canonical databases with balanced perDbCap + overflow buffer
    for (const dbId of CANONICAL_DATABASE_IDS) {
      const isTier1 = ['db1_fangshan', 'db2_taisho_ext', 'db3_dsbc_gretil', 'db4_84000', 'db5_buddhanexus', 'db6_sarit'].includes(dbId);
      const fetchLimit = Math.max(perDbCap, Math.ceil(limit / 6));
      const dbHits = isTier1
        ? searchTier1Databases(q, { dbId, limit: fetchLimit })
        : searchTier23Databases(q, { dbId, limit: fetchLimit });
      for (const h of dbHits.slice(0, perDbCap)) {
        pushUnique(toEnrichedHit(h));
      }
      for (const h of dbHits.slice(perDbCap)) {
        overflowHits.push(toEnrichedHit(h));
      }
    }
  }

  for (const h of overflowHits) {
    if (finalHits.length >= limit) break;
    pushUnique(h);
  }

  return finalHits;
}

/**
 * Structured wrapper around `searchAllDatabases` returning query telemetry and matched DB list.
 */
export function searchUnifiedCorpus(
  query: string,
  options?: UnifiedSearchInputOptions
) {
  const rawQuery = String(query ?? '').trim();
  const hits = searchAllDatabases(rawQuery, options);
  const databasesMatched = Array.from(new Set(hits.map((h) => h.dbId)));

  return {
    query: rawQuery,
    normalizedQuery: normalizeDiacritics(rawQuery),
    dbFilter: options?.dbId ? String(options.dbId) : null,
    count: hits.length,
    totalHits: hits.length,
    databasesMatched,
    results: hits,
    hits,
  };
}
