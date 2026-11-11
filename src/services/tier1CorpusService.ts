/**
 * src/services/tier1CorpusService.ts
 * Strongly Typed Query, Inspection, Diacritic-Insensitive Search & Live API Service
 * for Milestone 2 Category I Databases (#1–#6, Features F3–F8):
 *   - DB #1 (db1_fangshan): CBETA Fangshan Stone Canon (F28n1071 30 rolls + F24/F27 + F28n1072)
 *   - DB #2 (db2_taisho_ext): CBETA Taishō Siddhaṃ (T84 / bkkbooks / 18 Chapters), Lexicons (T54) & Ancient Dhāraṇīs (T08–T21)
 *   - DB #3 (db3_dsbc_gretil): Nepal DSBC (Dhāraṇī Saṃgraha 820/2949 & 824/2953, list/4, 486/475 catalogs) & GRETIL 108 Stotras / 261 texts
 *   - DB #4 (db4_84000): 84000 Open TEI (Toh 502–808 & Toh 846–1095), TM Alignments, RDF & Trilingual Glossary
 *   - DB #5 (db5_buddhanexus): BuddhaNexus Segmented Sanskrit (K12*, T01*, T02*) & Live DharmaMitra REST API
 *   - DB #6 (db6_sarit): SARIT Indology TEI-P5 Corpus (Caryāmelāpakapradīpa Ch. 3 Mantratattva & 26 Buddhist/Tantric Works)
 */

import type {
  DatabaseId,
  DatabaseMetadataSummary,
  Db1FangshanCorpus,
  Db2TaishoExtCorpus,
  Db3DsbcGretilCorpus,
  Db4EightFourThousandCorpus,
  Db5BuddhaNexusCorpus,
  Db6SaritCorpus,
  UnifiedSearchHit,
} from '../types/corpus';
import {
  DB1_FANGSHAN_CORPUS,
  DB2_TAISHO_EXT_CORPUS,
  DB3_DSBC_GRETIL_CORPUS,
  DB4_84000_CORPUS,
  DB5_BUDDHANEXUS_CORPUS,
  DB6_SARIT_CORPUS,
  TIER1_DATABASES_BY_ID,
  TIER1_DATABASE_SUMMARIES,
} from '../data/generated/tier1Databases';

export type Tier1DatabaseId = keyof typeof TIER1_DATABASES_BY_ID;

export type Tier1CorpusUnion =
  | Db1FangshanCorpus
  | Db2TaishoExtCorpus
  | Db3DsbcGretilCorpus
  | Db4EightFourThousandCorpus
  | Db5BuddhaNexusCorpus
  | Db6SaritCorpus;

const TIER1_ID_ALIASES: Record<string, Tier1DatabaseId> = {
  '1': 'db1_fangshan',
  db1: 'db1_fangshan',
  db1_fangshan: 'db1_fangshan',
  fangshan: 'db1_fangshan',
  f28n1071: 'db1_fangshan',
  '2': 'db2_taisho_ext',
  db2: 'db2_taisho_ext',
  db2_taisho_ext: 'db2_taisho_ext',
  taisho_ext: 'db2_taisho_ext',
  t54: 'db2_taisho_ext',
  t84: 'db2_taisho_ext',
  '3': 'db3_dsbc_gretil',
  db3: 'db3_dsbc_gretil',
  db3_dsbc_gretil: 'db3_dsbc_gretil',
  dsbc: 'db3_dsbc_gretil',
  dsbc_gretil: 'db3_dsbc_gretil',
  gretil: 'db3_dsbc_gretil',
  '4': 'db4_84000',
  db4: 'db4_84000',
  db4_84000: 'db4_84000',
  '84000': 'db4_84000',
  '5': 'db5_buddhanexus',
  db5: 'db5_buddhanexus',
  db5_buddhanexus: 'db5_buddhanexus',
  buddhanexus: 'db5_buddhanexus',
  dharmamitra: 'db5_buddhanexus',
  '6': 'db6_sarit',
  db6: 'db6_sarit',
  db6_sarit: 'db6_sarit',
  sarit: 'db6_sarit',
};

/**
 * Strips combining diacritical marks (NFD -> remove \u0300-\u036f) and normalizes whitespace/case
 * so that ASCII queries like 'Sitatapatra', 'vajrajapa', 'adhisthana', 'Manjusri' match
 * 'Sitātapatrā', 'vajrajāpa', 'adhiṣṭhāna', 'Mañjuśrī'.
 */
export function normalizeDiacritics(input: string): string {
  if (!input) return '';
  return String(input)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesQuery(haystack: string | undefined | null, rawQuery: string, normQuery: string): boolean {
  if (!haystack || !rawQuery) return false;
  const hLower = haystack.normalize('NFC').toLowerCase();
  if (hLower.includes(rawQuery.normalize('NFC').toLowerCase())) return true;
  if (haystack.normalize('NFKC').toLowerCase().includes(rawQuery.normalize('NFKC').toLowerCase())) return true;
  if (normQuery.length >= 2 && normalizeDiacritics(haystack).includes(normQuery)) return true;
  return false;
}

/**
 * Resolves a Tier 1 database identifier or number (1..6) to its canonical Tier1DatabaseId.
 */
export function resolveTier1DatabaseId(dbIdOrNumber: string | number): Tier1DatabaseId | null {
  const key = String(dbIdOrNumber ?? '')
    .trim()
    .toLowerCase();
  return TIER1_ID_ALIASES[key] ?? null;
}

/**
 * Returns the 6 DatabaseMetadataSummary objects for DB #1 through DB #6.
 */
export function getTier1DatabaseSummaries(): DatabaseMetadataSummary[] {
  return TIER1_DATABASE_SUMMARIES;
}

/**
 * Returns the strongly typed corpus object for DB #1 through DB #6.
 */
export function getTier1CorpusById(dbIdOrNumber: string | number): Tier1CorpusUnion | null {
  const resolved = resolveTier1DatabaseId(dbIdOrNumber);
  if (!resolved) return null;
  return TIER1_DATABASES_BY_ID[resolved];
}

/**
 * Resolves bidirectional BuddhaNexus static fileId <-> DharmaMitra API filename aliases.
 * Example: 'K12n2949u' <-> 'SA_K12_n2949u', 'K12Xbsu017_u' <-> 'SA_K12_bsu017_u'
 */
export function resolveBuddhaNexusDualId(inputId: string): {
  staticFileId: string;
  dharmaMitraApiId: string;
} {
  const trimmed = String(inputId || '')
    .trim()
    .replace(/\.json$/i, '');
  if (!trimmed) {
    return { staticFileId: '', dharmaMitraApiId: '' };
  }
  const existing = DB5_BUDDHANEXUS_CORPUS.records.find(
    (r) =>
      r.fileId.toLowerCase() === trimmed.toLowerCase() ||
      r.dharmaMitraApiId.toLowerCase() === trimmed.toLowerCase()
  );
  if (existing) {
    return {
      staticFileId: existing.fileId,
      dharmaMitraApiId: existing.dharmaMitraApiId,
    };
  }
  if (trimmed === 'K12Xbsu017_u' || trimmed === 'SA_K12_bsu017_u') {
    return { staticFileId: 'K12Xbsu017_u', dharmaMitraApiId: 'SA_K12_bsu017_u' };
  }
  if (trimmed.startsWith('SA_')) {
    const m = trimmed.match(/^SA_(K\d{2}|T\d{2})_(.+)$/);
    if (m) {
      return { staticFileId: `${m[1]}${m[2]}`, dharmaMitraApiId: trimmed };
    }
    return { staticFileId: trimmed, dharmaMitraApiId: trimmed };
  }
  const m = trimmed.match(/^(K\d{2}|T\d{2})(.+)$/);
  if (m) {
    return { staticFileId: trimmed, dharmaMitraApiId: `SA_${m[1]}_${m[2]}` };
  }
  return { staticFileId: trimmed, dharmaMitraApiId: `SA_${trimmed}` };
}

/**
 * Inspects a Tier 1 database or a specific record/subset within that database.
 */
export function inspectTier1Record(dbIdOrNumber: string | number, recordId?: string): Record<string, unknown> | null {
  const dbId = resolveTier1DatabaseId(dbIdOrNumber);
  if (!dbId) return null;

  const rawQuery = String(recordId ?? '').trim();
  if (!rawQuery) {
    return TIER1_DATABASES_BY_ID[dbId] as unknown as Record<string, unknown>;
  }
  const normQuery = normalizeDiacritics(rawQuery);

  switch (dbId) {
    case 'db1_fangshan': {
      const matched = DB1_FANGSHAN_CORPUS.records.filter(
        (r) =>
          matchesQuery(r.id, rawQuery, normQuery) ||
          matchesQuery(r.workId, rawQuery, normQuery) ||
          matchesQuery(r.xmlId, rawQuery, normQuery) ||
          matchesQuery(r.dharaniTitle, rawQuery, normQuery) ||
          matchesQuery(r.workTitle, rawQuery, normQuery) ||
          matchesQuery(r.plainChineseText, rawQuery, normQuery) ||
          r.tokens.some(
            (t) =>
              matchesQuery(t.textZh, rawQuery, normQuery) ||
              matchesQuery(t.siddhamRef, rawQuery, normQuery) ||
              matchesQuery(t.cbGaijiRef, rawQuery, normQuery) ||
              matchesQuery(t.iast, rawQuery, normQuery)
          )
      );
      return {
        databaseId: 'db1_fangshan',
        recordId: rawQuery,
        summary: DB1_FANGSHAN_CORPUS.summary,
        f28n1071Stats: DB1_FANGSHAN_CORPUS.f28n1071Stats,
        matchedCount: matched.length,
        record: matched[0] ?? null,
        records: matched,
      };
    }

    case 'db2_taisho_ext': {
      // Handle T08n0256 alias gracefully (CBETA T08 Heart Sūtra range is 250..255, 257)
      const isT08n0256Query = /^t08n0?256$/i.test(rawQuery);
      const chapNumMatch = rawQuery.match(/^(?:ch(?:apter)?\s*)?(\d{1,2})$/i);
      const chapNum = chapNumMatch ? parseInt(chapNumMatch[1], 10) : null;

      const lexiconEntries = DB2_TAISHO_EXT_CORPUS.lexiconEntries.filter(
        (e) =>
          matchesQuery(e.id, rawQuery, normQuery) ||
          matchesQuery(e.workId, rawQuery, normQuery) ||
          matchesQuery(e.workTitle, rawQuery, normQuery) ||
          matchesQuery(e.author, rawQuery, normQuery) ||
          matchesQuery(e.headwordZh, rawQuery, normQuery) ||
          matchesQuery(e.phoneticZh, rawQuery, normQuery) ||
          matchesQuery(e.iast, rawQuery, normQuery) ||
          matchesQuery(e.fanqieOrCommentary, rawQuery, normQuery)
      );

      const siddhamTreatises = DB2_TAISHO_EXT_CORPUS.siddhamTreatises.filter(
        (t) =>
          matchesQuery(t.taishoId, rawQuery, normQuery) ||
          matchesQuery(t.bkkbooksRepoId, rawQuery, normQuery) ||
          matchesQuery(t.title, rawQuery, normQuery) ||
          matchesQuery(t.author, rawQuery, normQuery) ||
          matchesQuery(t.excerptText, rawQuery, normQuery) ||
          t.keyTopics.some((k) => matchesQuery(k, rawQuery, normQuery))
      );

      const siddham18Chapters = DB2_TAISHO_EXT_CORPUS.siddham18Chapters.filter(
        (c) =>
          (chapNum !== null && c.chapterNumber === chapNum) ||
          matchesQuery(c.titleZh, rawQuery, normQuery) ||
          matchesQuery(c.titleEn, rawQuery, normQuery) ||
          matchesQuery(c.description, rawQuery, normQuery) ||
          /siddham|十八章|parivarta/i.test(rawQuery)
      );

      const ancientDharanis = isT08n0256Query
        ? DB2_TAISHO_EXT_CORPUS.ancientDharanis.filter((d) => d.workId.startsWith('T08'))
        : DB2_TAISHO_EXT_CORPUS.ancientDharanis.filter(
            (d) =>
              matchesQuery(d.id, rawQuery, normQuery) ||
              matchesQuery(d.workId, rawQuery, normQuery) ||
              matchesQuery(d.workTitle, rawQuery, normQuery) ||
              matchesQuery(d.translator, rawQuery, normQuery) ||
              matchesQuery(d.dharaniTitle, rawQuery, normQuery) ||
              matchesQuery(d.dharaniTextZh, rawQuery, normQuery) ||
              d.inlineNotes.some((n) => matchesQuery(n, rawQuery, normQuery))
          );

      return {
        databaseId: 'db2_taisho_ext',
        recordId: rawQuery,
        ...(isT08n0256Query
          ? {
              note: 'In CBETA XML-P5 T/T08, the 7 Prajñāpāramitāhṛdaya (Heart Sūtra) editions are T08n0250–T08n0255 and T08n0257 (T0256 is not a separate XML file in T08). Returning all 7 T08 Heart Sūtra dhāraṇī records.',
            }
          : {}),
        summary: DB2_TAISHO_EXT_CORPUS.summary,
        siddhamRegistryStats: DB2_TAISHO_EXT_CORPUS.siddhamRegistryStats,
        matchedCount:
          lexiconEntries.length + siddhamTreatises.length + siddham18Chapters.length + ancientDharanis.length,
        lexiconEntries,
        siddhamTreatises,
        siddham18Chapters,
        ancientDharanis,
      };
    }

    case 'db3_dsbc_gretil': {
      const isSamgrahaAlias = /^(?:820\/2949|2949|820|824\/2953|2953|824|dharani\s*samgraha|dharanisamgraha)$/i.test(
        normQuery
      );
      const isGrahamatrkaAlias = /^(?:862\/2990|2990|862)$/i.test(normQuery);
      const isStotra108Alias = /^(?:bst-108u(?:\.htm)?|108|bauddha\s*stotra)$/i.test(normQuery);

      const dharaniSamgrahaSections = isSamgrahaAlias
        ? DB3_DSBC_GRETIL_CORPUS.dharaniSamgrahaSections
        : DB3_DSBC_GRETIL_CORPUS.dharaniSamgrahaSections.filter(
            (s) =>
              String(s.sectionNumber) === rawQuery ||
              matchesQuery(s.titleIast, rawQuery, normQuery) ||
              matchesQuery(s.titleDevanagari, rawQuery, normQuery) ||
              matchesQuery(s.colophonIast, rawQuery, normQuery) ||
              s.paragraphsIast.some((p) => matchesQuery(p, rawQuery, normQuery)) ||
              (s.paragraphsDevanagari || []).some((p) => matchesQuery(p, rawQuery, normQuery)) ||
              s.extractedMantras.some((m) => matchesQuery(m, rawQuery, normQuery))
          );

      const dsbcBooks = DB3_DSBC_GRETIL_CORPUS.dsbcBooks.filter(
        (b) =>
          (isSamgrahaAlias && b.bookId === 820) ||
          (isGrahamatrkaAlias && b.bookId === 862) ||
          String(b.bookId) === rawQuery ||
          (b.chapterIds || []).some((cid) => String(cid) === rawQuery || `${b.bookId}/${cid}` === rawQuery) ||
          matchesQuery(b.titleIast, rawQuery, normQuery) ||
          matchesQuery(b.titleDevanagari, rawQuery, normQuery) ||
          matchesQuery(b.fullTextExcerptIast, rawQuery, normQuery) ||
          matchesQuery(b.sourceUrl, rawQuery, normQuery)
      );

      const gretilExpandedRecords = isStotra108Alias
        ? DB3_DSBC_GRETIL_CORPUS.gretilExpandedRecords.filter((g) => g.filename === 'bst-108u.htm')
        : DB3_DSBC_GRETIL_CORPUS.gretilExpandedRecords.filter(
            (g) =>
              matchesQuery(g.id, rawQuery, normQuery) ||
              matchesQuery(g.filename, rawQuery, normQuery) ||
              (g.stotraNumber !== undefined && String(g.stotraNumber) === rawQuery) ||
              matchesQuery(g.titleSanskrit, rawQuery, normQuery) ||
              matchesQuery(g.editorOrSource, rawQuery, normQuery) ||
              matchesQuery(g.textExcerptIast, rawQuery, normQuery)
          );

      return {
        databaseId: 'db3_dsbc_gretil',
        recordId: rawQuery,
        summary: DB3_DSBC_GRETIL_CORPUS.summary,
        dsbcCatalogStats: DB3_DSBC_GRETIL_CORPUS.dsbcCatalogStats,
        matchedCount: dharaniSamgrahaSections.length + dsbcBooks.length + gretilExpandedRecords.length,
        dharaniSamgrahaSections,
        dsbcBooks,
        gretilExpandedRecords,
      };
    }

    case 'db4_84000': {
      // Normalize numeric or toh-prefixed query (e.g. '507' -> 'toh507', 'toh507,883' -> ['toh507', 'toh883'])
      const queryTohTokens = rawQuery
        .toLowerCase()
        .split(/[\s,/]+/)
        .filter(Boolean)
        .map((tok) => (/^\d+[a-z]?$/i.test(tok) ? `toh${tok}` : tok.replace(/^toh\s+/i, 'toh')));

      const matchedRecords = DB4_84000_CORPUS.records.filter((r) => {
        const lowerTohs = r.tohokuIds.map((t) => t.toLowerCase());
        if (queryTohTokens.some((qt) => lowerTohs.includes(qt))) return true;
        return (
          matchesQuery(r.utId, rawQuery, normQuery) ||
          matchesQuery(r.bdrcWorkId, rawQuery, normQuery) ||
          matchesQuery(r.titles.saLtn, rawQuery, normQuery) ||
          matchesQuery(r.titles.saLtnLong, rawQuery, normQuery) ||
          matchesQuery(r.titles.boLtn, rawQuery, normQuery) ||
          matchesQuery(r.titles.boUnicode, rawQuery, normQuery) ||
          matchesQuery(r.titles.en, rawQuery, normQuery) ||
          matchesQuery(r.sourceUrl, rawQuery, normQuery) ||
          r.mantras.some(
            (m) =>
              matchesQuery(m.sanskritIast, rawQuery, normQuery) ||
              matchesQuery(m.englishTranslation, rawQuery, normQuery) ||
              m.criticalNotes.some((n) => matchesQuery(n, rawQuery, normQuery))
          )
        );
      });

      const matchedGlossary = DB4_84000_CORPUS.glossary.filter(
        (g) =>
          matchesQuery(g.sanskritIast, rawQuery, normQuery) ||
          matchesQuery(g.tibetanWylie, rawQuery, normQuery) ||
          matchesQuery(g.tibetanUnicode, rawQuery, normQuery) ||
          matchesQuery(g.english, rawQuery, normQuery) ||
          matchesQuery(g.sourceRef, rawQuery, normQuery)
      );

      return {
        databaseId: 'db4_84000',
        recordId: rawQuery,
        summary: DB4_84000_CORPUS.summary,
        repoStats: DB4_84000_CORPUS.repoStats,
        matchedCount: matchedRecords.length + matchedGlossary.length,
        record: matchedRecords[0] ?? null,
        records: matchedRecords,
        glossary: matchedGlossary,
      };
    }

    case 'db5_buddhanexus': {
      const dualIds = resolveBuddhaNexusDualId(rawQuery);
      const normStatic = normalizeDiacritics(dualIds.staticFileId);
      const normApi = normalizeDiacritics(dualIds.dharmaMitraApiId);

      const matchedRecords = DB5_BUDDHANEXUS_CORPUS.records.filter(
        (r) =>
          matchesQuery(r.fileId, rawQuery, normQuery) ||
          matchesQuery(r.dharmaMitraApiId, rawQuery, normQuery) ||
          (normStatic && normalizeDiacritics(r.fileId) === normStatic) ||
          (normApi && normalizeDiacritics(r.dharmaMitraApiId) === normApi) ||
          matchesQuery(r.displayName, rawQuery, normQuery) ||
          matchesQuery(r.sourceCitation, rawQuery, normQuery) ||
          r.sampleSegments.some((s) => matchesQuery(s.text, rawQuery, normQuery) || matchesQuery(s.segnr, rawQuery, normQuery)) ||
          (r.colophonsExtracted || []).some((c) => matchesQuery(c, rawQuery, normQuery))
      );

      const matchedCatalog = DB5_BUDDHANEXUS_CORPUS.dharmaMitraCatalogSample.filter(
        (c) =>
          matchesQuery(c.filename, rawQuery, normQuery) ||
          (normApi && normalizeDiacritics(c.filename) === normApi) ||
          matchesQuery(c.displayName, rawQuery, normQuery) ||
          matchesQuery(c.category, rawQuery, normQuery)
      );

      return {
        databaseId: 'db5_buddhanexus',
        recordId: rawQuery,
        resolvedIds: dualIds,
        status: matchedRecords.length + matchedCatalog.length > 0 ? 'ok' : 'not_found',
        summary: DB5_BUDDHANEXUS_CORPUS.summary,
        catalogStats: DB5_BUDDHANEXUS_CORPUS.catalogStats,
        matchedCount: matchedRecords.length + matchedCatalog.length,
        record: matchedRecords[0] ?? null,
        records: matchedRecords,
        dharmaMitraCatalogSample: matchedCatalog,
      };
    }

    case 'db6_sarit': {
      const matchedRecords = DB6_SARIT_CORPUS.records.filter(
        (r) =>
          matchesQuery(r.xmlId, rawQuery, normQuery) ||
          matchesQuery(r.filename, rawQuery, normQuery) ||
          matchesQuery(r.titleSanskrit, rawQuery, normQuery) ||
          matchesQuery(r.author, rawQuery, normQuery) ||
          matchesQuery(r.editor, rawQuery, normQuery) ||
          matchesQuery(r.scriptEncoding, rawQuery, normQuery) ||
          r.featuredUnits.some(
            (u) =>
              matchesQuery(u.unitId, rawQuery, normQuery) ||
              matchesQuery(u.chapterOrSection, rawQuery, normQuery) ||
              matchesQuery(u.cleanSanskritIast, rawQuery, normQuery) ||
              u.criticalApparatus.some((a) => matchesQuery(a, rawQuery, normQuery))
          )
      );

      const matchedUnits = DB6_SARIT_CORPUS.records.flatMap((r) =>
        r.featuredUnits.filter(
          (u) =>
            matchesQuery(u.unitId, rawQuery, normQuery) ||
            matchesQuery(u.cleanSanskritIast, rawQuery, normQuery) ||
            u.criticalApparatus.some((a) => matchesQuery(a, rawQuery, normQuery))
        )
      );

      return {
        databaseId: 'db6_sarit',
        recordId: rawQuery,
        summary: DB6_SARIT_CORPUS.summary,
        matchedCount: matchedRecords.length,
        record: matchedRecords[0] ?? null,
        records: matchedRecords,
        matchedUnits,
      };
    }
  }
}

/**
 * Unified diacritic-insensitive, multi-script search across all 6 Category I databases (DB #1–#6).
 */
export function searchTier1Databases(
  query: string,
  options?: { dbId?: DatabaseId; limit?: number }
): UnifiedSearchHit[] {
  const rawQuery = String(query ?? '').trim();
  if (!rawQuery) return [];
  const normQuery = normalizeDiacritics(rawQuery);
  const limit = options?.limit ?? 50;
  const targetDb = options?.dbId ? resolveTier1DatabaseId(options.dbId) : null;
  if (options?.dbId && !targetDb) return [];

  const hits: UnifiedSearchHit[] = [];
  const pushHit = (hit: UnifiedSearchHit) => {
    if (hits.length < limit) {
      hits.push(hit);
    }
  };

  // 1. Search DB #1: CBETA Fangshan Stone Canon
  if (!targetDb || targetDb === 'db1_fangshan') {
    for (const r of DB1_FANGSHAN_CORPUS.records) {
      if (hits.length >= limit) break;
      const tokenMatch = r.tokens.find(
        (t) =>
          matchesQuery(t.textZh, rawQuery, normQuery) ||
          matchesQuery(t.siddhamRef, rawQuery, normQuery) ||
          matchesQuery(t.cbGaijiRef, rawQuery, normQuery) ||
          matchesQuery(t.siddhamUnicode, rawQuery, normQuery) ||
          matchesQuery(t.iast, rawQuery, normQuery)
      );
      if (
        matchesQuery(r.id, rawQuery, normQuery) ||
        matchesQuery(r.workId, rawQuery, normQuery) ||
        matchesQuery(r.xmlId, rawQuery, normQuery) ||
        matchesQuery(r.dharaniTitle, rawQuery, normQuery) ||
        matchesQuery(r.workTitle, rawQuery, normQuery) ||
        matchesQuery(r.compilerOrTranslator, rawQuery, normQuery) ||
        matchesQuery(r.plainChineseText, rawQuery, normQuery) ||
        matchesQuery(r.reconstructedIast, rawQuery, normQuery) ||
        Boolean(tokenMatch)
      ) {
        pushHit({
          id: r.id,
          sourceDb: 'db1_fangshan',
          databaseNumber: 1,
          title: `${r.dharaniTitle} (${r.workId} 卷${r.juan})`,
          subtitle: `${r.workTitle} · ${r.compilerOrTranslator}`,
          matchedField: tokenMatch ? 'tokens' : 'dharaniTitle / plainChineseText',
          snippet: r.plainChineseText,
          sanskritIast: r.reconstructedIast || tokenMatch?.iast,
          siddhamUnicode: tokenMatch?.siddhamUnicode,
          chineseText: r.plainChineseText,
          canonicalRefs: [r.workId, r.xmlId],
          sourceUrl: r.sourceUrl,
        });
      }
    }
  }

  // 2. Search DB #2: CBETA Taishō T54, T84 & Ancient Dhāraṇīs
  if (!targetDb || targetDb === 'db2_taisho_ext') {
    for (const l of DB2_TAISHO_EXT_CORPUS.lexiconEntries) {
      if (hits.length >= limit) break;
      if (
        matchesQuery(l.workId, rawQuery, normQuery) ||
        matchesQuery(l.workTitle, rawQuery, normQuery) ||
        matchesQuery(l.author, rawQuery, normQuery) ||
        matchesQuery(l.headwordZh, rawQuery, normQuery) ||
        matchesQuery(l.phoneticZh, rawQuery, normQuery) ||
        matchesQuery(l.siddhamUnicode, rawQuery, normQuery) ||
        matchesQuery(l.iast, rawQuery, normQuery) ||
        matchesQuery(l.devanagari, rawQuery, normQuery) ||
        matchesQuery(l.fanqieOrCommentary, rawQuery, normQuery) ||
        l.siddhamRefs.some((ref) => matchesQuery(ref, rawQuery, normQuery))
      ) {
        pushHit({
          id: l.id,
          sourceDb: 'db2_taisho_ext',
          databaseNumber: 2,
          title: `${l.workTitle} (${l.workId}): ${l.headwordZh}`,
          subtitle: `${l.author} · 音譯: ${l.phoneticZh}`,
          matchedField: 'lexiconEntries',
          snippet: `${l.headwordZh} / ${l.phoneticZh} → ${l.siddhamUnicode} (${l.iast}) ${l.fanqieOrCommentary || ''}`.trim(),
          sanskritIast: l.iast,
          siddhamUnicode: l.siddhamUnicode,
          chineseText: `${l.headwordZh} (${l.phoneticZh})`,
          canonicalRefs: [l.workId, ...l.siddhamRefs],
          sourceUrl: l.sourceUrl,
        });
      }
    }

    for (const t of DB2_TAISHO_EXT_CORPUS.siddhamTreatises) {
      if (hits.length >= limit) break;
      if (
        matchesQuery(t.taishoId, rawQuery, normQuery) ||
        matchesQuery(t.bkkbooksRepoId, rawQuery, normQuery) ||
        matchesQuery(t.title, rawQuery, normQuery) ||
        matchesQuery(t.author, rawQuery, normQuery) ||
        matchesQuery(t.excerptText, rawQuery, normQuery) ||
        t.keyTopics.some((k) => matchesQuery(k, rawQuery, normQuery))
      ) {
        pushHit({
          id: t.taishoId,
          sourceDb: 'db2_taisho_ext',
          databaseNumber: 2,
          title: `${t.title} (${t.taishoId} / ${t.bkkbooksRepoId})`,
          subtitle: `${t.author} (${t.rolls}卷)`,
          matchedField: 'siddhamTreatises',
          snippet: t.excerptText,
          chineseText: t.excerptText,
          canonicalRefs: [t.taishoId, t.bkkbooksRepoId],
          sourceUrl: t.sourceUrl,
        });
      }
    }

    for (const d of DB2_TAISHO_EXT_CORPUS.ancientDharanis) {
      if (hits.length >= limit) break;
      if (
        matchesQuery(d.id, rawQuery, normQuery) ||
        matchesQuery(d.workId, rawQuery, normQuery) ||
        matchesQuery(d.workTitle, rawQuery, normQuery) ||
        matchesQuery(d.translator, rawQuery, normQuery) ||
        matchesQuery(d.dharaniTitle, rawQuery, normQuery) ||
        matchesQuery(d.dharaniTextZh, rawQuery, normQuery) ||
        d.inlineNotes.some((n) => matchesQuery(n, rawQuery, normQuery))
      ) {
        pushHit({
          id: d.id,
          sourceDb: 'db2_taisho_ext',
          databaseNumber: 2,
          title: `${d.dharaniTitle} (${d.workId} 卷${d.juan})`,
          subtitle: `${d.workTitle} · ${d.translator}`,
          matchedField: 'ancientDharanis',
          snippet: d.dharaniTextZh,
          chineseText: d.dharaniTextZh,
          canonicalRefs: [d.workId, d.id],
          sourceUrl: d.sourceUrl,
        });
      }
    }
  }

  // 3. Search DB #3: Nepal DSBC & GRETIL Expansion
  if (!targetDb || targetDb === 'db3_dsbc_gretil') {
    for (const s of DB3_DSBC_GRETIL_CORPUS.dharaniSamgrahaSections) {
      if (hits.length >= limit) break;
      if (
        matchesQuery(s.titleIast, rawQuery, normQuery) ||
        matchesQuery(s.titleDevanagari, rawQuery, normQuery) ||
        matchesQuery(s.colophonIast, rawQuery, normQuery) ||
        s.paragraphsIast.some((p) => matchesQuery(p, rawQuery, normQuery)) ||
        (s.paragraphsDevanagari || []).some((p) => matchesQuery(p, rawQuery, normQuery)) ||
        s.extractedMantras.some((m) => matchesQuery(m, rawQuery, normQuery))
      ) {
        pushHit({
          id: `dsbc_820_2949_sec_${s.sectionNumber}`,
          sourceDb: 'db3_dsbc_gretil',
          databaseNumber: 3,
          title: s.titleIast,
          subtitle: s.titleDevanagari || `DSBC Dhāraṇī Saṃgraha Section (${s.sectionNumber})`,
          matchedField: 'dharaniSamgrahaSections',
          snippet: s.extractedMantras[0] || s.paragraphsIast[0] || s.titleIast,
          sanskritIast: s.extractedMantras[0] || s.paragraphsIast[0],
          canonicalRefs: ['DSBC 820/2949', 'DSBC 824/2953', `Section (${s.sectionNumber})`],
          sourceUrl: s.sourceUrlIast,
        });
      }
    }

    for (const b of DB3_DSBC_GRETIL_CORPUS.dsbcBooks) {
      if (hits.length >= limit) break;
      if (
        String(b.bookId) === rawQuery ||
        matchesQuery(b.titleIast, rawQuery, normQuery) ||
        matchesQuery(b.titleDevanagari, rawQuery, normQuery) ||
        matchesQuery(b.fullTextExcerptIast, rawQuery, normQuery) ||
        (b.extractedMantras || []).some((m) => matchesQuery(m, rawQuery, normQuery))
      ) {
        pushHit({
          id: `dsbc_book_${b.bookId}`,
          sourceDb: 'db3_dsbc_gretil',
          databaseNumber: 3,
          title: b.titleIast,
          subtitle: b.titleDevanagari || `DSBC Book #${b.bookId} (${b.category})`,
          matchedField: 'dsbcBooks',
          snippet: b.fullTextExcerptIast || b.titleIast,
          sanskritIast: (b.extractedMantras || [])[0] || b.fullTextExcerptIast,
          canonicalRefs: [`DSBC book/${b.bookId}`],
          sourceUrl: b.sourceUrl,
        });
      }
    }

    for (const g of DB3_DSBC_GRETIL_CORPUS.gretilExpandedRecords) {
      if (hits.length >= limit) break;
      if (
        matchesQuery(g.id, rawQuery, normQuery) ||
        matchesQuery(g.filename, rawQuery, normQuery) ||
        matchesQuery(g.titleSanskrit, rawQuery, normQuery) ||
        matchesQuery(g.textExcerptIast, rawQuery, normQuery) ||
        g.extractedMantras.some((m) => matchesQuery(m, rawQuery, normQuery))
      ) {
        pushHit({
          id: g.id,
          sourceDb: 'db3_dsbc_gretil',
          databaseNumber: 3,
          title: g.titleSanskrit,
          subtitle: `${g.filename} · ${g.editorOrSource}`,
          matchedField: 'gretilExpandedRecords',
          snippet: g.textExcerptIast,
          sanskritIast: g.extractedMantras[0] || g.textExcerptIast,
          canonicalRefs: [g.id, g.filename],
          sourceUrl: g.sourceUrl,
        });
      }
    }
  }

  // 4. Search DB #4: 84000 Open TEI & Trilingual Glossary
  if (!targetDb || targetDb === 'db4_84000') {
    for (const r of DB4_84000_CORPUS.records) {
      if (hits.length >= limit) break;
      const mantraHit = r.mantras.find(
        (m) =>
          matchesQuery(m.sanskritIast, rawQuery, normQuery) ||
          matchesQuery(m.englishTranslation, rawQuery, normQuery)
      );
      if (
        matchesQuery(r.utId, rawQuery, normQuery) ||
        r.tohokuIds.some((t) => matchesQuery(t, rawQuery, normQuery) || matchesQuery(t.replace(/^toh/i, ''), rawQuery, normQuery)) ||
        matchesQuery(r.titles.saLtn, rawQuery, normQuery) ||
        matchesQuery(r.titles.saLtnLong, rawQuery, normQuery) ||
        matchesQuery(r.titles.boLtn, rawQuery, normQuery) ||
        matchesQuery(r.titles.boUnicode, rawQuery, normQuery) ||
        matchesQuery(r.titles.en, rawQuery, normQuery) ||
        Boolean(mantraHit)
      ) {
        const firstMantra = mantraHit || r.mantras[0];
        pushHit({
          id: r.utId,
          sourceDb: 'db4_84000',
          databaseNumber: 4,
          title: `${r.titles.en} (${r.tohokuIds.join(', ')})`,
          subtitle: `${r.titles.saLtn} · ${r.titles.boUnicode}`,
          matchedField: mantraHit ? 'mantras' : 'titles / tohokuIds',
          snippet: firstMantra ? firstMantra.sanskritIast : r.titles.en,
          sanskritIast: firstMantra?.sanskritIast || r.titles.saLtn,
          tibetanText: r.titles.boUnicode || r.titles.boLtn,
          canonicalRefs: [r.utId, ...r.tohokuIds],
          sourceUrl: r.sourceUrl,
        });
      }
    }

    for (const g of DB4_84000_CORPUS.glossary) {
      if (hits.length >= limit) break;
      if (
        matchesQuery(g.sanskritIast, rawQuery, normQuery) ||
        matchesQuery(g.tibetanWylie, rawQuery, normQuery) ||
        matchesQuery(g.tibetanUnicode, rawQuery, normQuery) ||
        matchesQuery(g.english, rawQuery, normQuery) ||
        matchesQuery(g.definition, rawQuery, normQuery)
      ) {
        pushHit({
          id: g.id,
          sourceDb: 'db4_84000',
          databaseNumber: 4,
          title: `84000 Glossary: ${g.sanskritIast} → ${g.english}`,
          subtitle: `${g.tibetanUnicode || ''} (${g.tibetanWylie || ''}) [${g.sourceRef}]`,
          matchedField: 'glossary',
          snippet: `${g.sanskritIast} | ${g.tibetanWylie || ''} | ${g.english}: ${g.definition || ''}`.trim(),
          sanskritIast: g.sanskritIast,
          tibetanText: g.tibetanUnicode || g.tibetanWylie,
          canonicalRefs: [g.sourceRef],
          sourceUrl: 'https://github.com/84000/data-tei',
        });
      }
    }
  }

  // 5. Search DB #5: BuddhaNexus Segmented Sanskrit & DharmaMitra
  if (!targetDb || targetDb === 'db5_buddhanexus') {
    for (const r of DB5_BUDDHANEXUS_CORPUS.records) {
      if (hits.length >= limit) break;
      const segHit = r.sampleSegments.find((s) => matchesQuery(s.text, rawQuery, normQuery));
      const colHit = (r.colophonsExtracted || []).find((c) => matchesQuery(c, rawQuery, normQuery));
      if (
        matchesQuery(r.fileId, rawQuery, normQuery) ||
        matchesQuery(r.dharmaMitraApiId, rawQuery, normQuery) ||
        matchesQuery(r.displayName, rawQuery, normQuery) ||
        matchesQuery(r.sourceCitation, rawQuery, normQuery) ||
        Boolean(segHit) ||
        Boolean(colHit)
      ) {
        const snippet = colHit || segHit?.text || r.sampleSegments[0]?.text || r.displayName;
        pushHit({
          id: r.fileId,
          sourceDb: 'db5_buddhanexus',
          databaseNumber: 5,
          title: `${r.displayName} (${r.fileId} / ${r.dharmaMitraApiId})`,
          subtitle: `Category ${r.category} · ${r.totalSegments} segments`,
          matchedField: colHit ? 'colophonsExtracted' : segHit ? 'sampleSegments' : 'displayName',
          snippet,
          sanskritIast: snippet,
          canonicalRefs: [r.fileId, r.dharmaMitraApiId],
          sourceUrl: r.rawJsonUrl || 'https://dharmamitra.org/api-db/text-view/text-parallels/',
        });
      }
    }
  }

  // 6. Search DB #6: SARIT Indology TEI-P5 Corpus
  if (!targetDb || targetDb === 'db6_sarit') {
    for (const r of DB6_SARIT_CORPUS.records) {
      if (hits.length >= limit) break;
      const unitHit = r.featuredUnits.find(
        (u) =>
          matchesQuery(u.unitId, rawQuery, normQuery) ||
          matchesQuery(u.cleanSanskritIast, rawQuery, normQuery) ||
          u.criticalApparatus.some((a) => matchesQuery(a, rawQuery, normQuery))
      );
      if (
        matchesQuery(r.xmlId, rawQuery, normQuery) ||
        matchesQuery(r.filename, rawQuery, normQuery) ||
        matchesQuery(r.titleSanskrit, rawQuery, normQuery) ||
        matchesQuery(r.author, rawQuery, normQuery) ||
        matchesQuery(r.editor, rawQuery, normQuery) ||
        Boolean(unitHit)
      ) {
        const firstUnit = unitHit || r.featuredUnits[0];
        pushHit({
          id: r.xmlId,
          sourceDb: 'db6_sarit',
          databaseNumber: 6,
          title: `${r.titleSanskrit} (${r.filename})`,
          subtitle: `${r.author} · ed. ${r.editor} [${r.scriptEncoding}]`,
          matchedField: unitHit ? `featuredUnits (${unitHit.unitId})` : 'titleSanskrit / metadata',
          snippet: firstUnit ? firstUnit.cleanSanskritIast : r.titleSanskrit,
          sanskritIast: firstUnit?.cleanSanskritIast,
          canonicalRefs: [r.xmlId, r.filename, ...(firstUnit ? [firstUnit.unitId] : [])],
          sourceUrl: r.sourceUrl,
        });
      }
    }
  }

  return hits;
}

let lastDharmaMitraCallMs = 0;

/**
 * Live async client for DharmaMitra `POST https://dharmamitra.org/api-db/text-view/text-parallels/`
 * with `filters: { par_length: 1000, score: 100, languages: ["sa"] }`, 350ms rate-limit guard,
 * and automatic fallback to local DB5_BUDDHANEXUS_CORPUS segments when offline.
 */
export async function fetchDharmaMitraTextParallelsLive(
  filename: string,
  page = 0
): Promise<{
  filename: string;
  resolvedApiId: string;
  page: number;
  source: 'live_api' | 'local_fallback' | 'not_found';
  segments: Array<{ segnr: string; text: string }>;
}> {
  const dual = resolveBuddhaNexusDualId(filename);
  const apiId = dual.dharmaMitraApiId;
  if (!apiId) {
    return { filename, resolvedApiId: '', page, source: 'not_found', segments: [] };
  }

  const now = Date.now();
  const elapsed = now - lastDharmaMitraCallMs;
  if (elapsed < 350) {
    await new Promise((r) => setTimeout(r, 350 - elapsed));
  }
  lastDharmaMitraCallMs = Date.now();

  try {
    const res = await fetch('https://dharmamitra.org/api-db/text-view/text-parallels/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Sarva-Dharani-Kosa/1.0)',
      },
      body: JSON.stringify({
        filename: apiId,
        page,
        filters: { par_length: 1000, score: 100, languages: ['sa'] },
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as unknown;
      const arr = Array.isArray(data)
        ? data
        : data && typeof data === 'object' && 'items' in data && Array.isArray((data as { items: unknown[] }).items)
        ? (data as { items: Array<{ segnr?: string; segtext?: Array<{ text?: string }> }> }).items
        : [];
      if (arr.length > 0) {
        const segments = arr.map((it: { segnr?: string; segtext?: Array<{ text?: string }> }, idx: number) => ({
          segnr: String(it.segnr ?? `${apiId}:${idx}`),
          text: (it.segtext || [])
            .map((s) => s.text || '')
            .join('')
            .replace(/^\s*Title:\s*/i, '')
            .trim(),
        }));
        return { filename, resolvedApiId: apiId, page, source: 'live_api', segments };
      }
    }
  } catch {
    // Fall back to local pre-bundled corpus below
  }

  const localMatch = DB5_BUDDHANEXUS_CORPUS.records.find(
    (r) =>
      r.fileId.toLowerCase() === dual.staticFileId.toLowerCase() ||
      r.dharmaMitraApiId.toLowerCase() === apiId.toLowerCase()
  );
  if (localMatch) {
    return {
      filename,
      resolvedApiId: localMatch.dharmaMitraApiId,
      page,
      source: 'local_fallback',
      segments: localMatch.sampleSegments,
    };
  }

  return { filename, resolvedApiId: apiId, page, source: 'not_found', segments: [] };
}
