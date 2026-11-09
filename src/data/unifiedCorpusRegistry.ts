/**
 * src/data/unifiedCorpusRegistry.ts
 * Milestone 4 (Feature F15): Unified 12-Database + Baseline Corpus Registry,
 * Record Inspector, Sanitizer, Quadrilingual Glossary & System Integrity Verifier
 */

import type {
  DatabaseId,
  DatabaseMetadataSummary,
  TrilingualGlossaryEntry,
} from '../types/corpus';

import {
  CBETA_AUTH_RECORDS,
  CBETA_GAIJI_MAP,
  CBETA_TOTAL_TT_ALIGNMENTS,
} from './generated/cbetaAuthRecords';
import {
  GRETIL_AUTH_RECORDS,
  GRETIL_BY_FILENAME,
} from './generated/gretilAuthRecords';
import { TAISHO_MIKKYO_INDEX } from './generated/taishoMikkyoIndex';
import {
  BASELINE_CURATED_DHARANIS,
  BUDDHAS_BODHISATTVAS_DHARANIS,
  CURATED_SEED_SYLLABLES,
  DHARANI_CATEGORIES,
  MAJOR_DHARANIS,
  TEN_SMALL_DHARANIS,
  getDharaniById,
  getDharanisByCategory,
  getSeedSyllableByIastOrSlp1,
} from './corpus/index';

import {
  DB1_FANGSHAN_CORPUS,
  DB2_TAISHO_EXT_CORPUS,
  DB3_DSBC_GRETIL_CORPUS,
  DB4_84000_CORPUS,
  DB5_BUDDHANEXUS_CORPUS,
  DB6_SARIT_CORPUS,
  TIER1_DATABASES_BY_ID,
  TIER1_DATABASE_SUMMARIES,
} from './generated/tier1Databases';
import {
  DB7_CUDL_HIDAS_CORPUS,
  DB8_POLYGLOTTA_CORPUS,
  DB9_RKTS_CORPUS,
  DB10_ALL_NIBS_CORPUS,
  DB11_IDP_DUNHUANG_CORPUS,
  DB12_MUKTABODHA_OCHS_CORPUS,
  TIER23_DATABASES_BY_ID,
  TIER23_DATABASE_SUMMARIES,
} from './generated/tier23Databases';

import {
  type Tier1CorpusUnion,
  inspectTier1Record,
  resolveTier1DatabaseId,
} from '../services/tier1CorpusService';
import {
  type Tier23CorpusUnion,
  inspectTier23Record,
  resolveTier23DatabaseId,
} from '../services/tier23CorpusService';

export {
  CBETA_AUTH_RECORDS,
  CBETA_GAIJI_MAP,
  CBETA_TOTAL_TT_ALIGNMENTS,
  GRETIL_AUTH_RECORDS,
  GRETIL_BY_FILENAME,
  TAISHO_MIKKYO_INDEX,
  BASELINE_CURATED_DHARANIS,
  MAJOR_DHARANIS,
  TEN_SMALL_DHARANIS,
  BUDDHAS_BODHISATTVAS_DHARANIS,
  CURATED_SEED_SYLLABLES,
  DHARANI_CATEGORIES,
  getDharaniById,
  getDharanisByCategory,
  getSeedSyllableByIastOrSlp1,
  DB1_FANGSHAN_CORPUS,
  DB2_TAISHO_EXT_CORPUS,
  DB3_DSBC_GRETIL_CORPUS,
  DB4_84000_CORPUS,
  DB5_BUDDHANEXUS_CORPUS,
  DB6_SARIT_CORPUS,
  TIER1_DATABASE_SUMMARIES,
  TIER1_DATABASES_BY_ID,
  DB7_CUDL_HIDAS_CORPUS,
  DB8_POLYGLOTTA_CORPUS,
  DB9_RKTS_CORPUS,
  DB10_ALL_NIBS_CORPUS,
  DB11_IDP_DUNHUANG_CORPUS,
  DB12_MUKTABODHA_OCHS_CORPUS,
  TIER23_DATABASE_SUMMARIES,
  TIER23_DATABASES_BY_ID,
};

export type UnifiedCorpusUnion = Tier1CorpusUnion | Tier23CorpusUnion;

export const CANONICAL_DATABASE_IDS: DatabaseId[] = [
  'db1_fangshan',
  'db2_taisho_ext',
  'db3_dsbc_gretil',
  'db4_84000',
  'db5_buddhanexus',
  'db6_sarit',
  'db7_cudl_hidas',
  'db8_polyglotta',
  'db9_rkts',
  'db10_all_nibs',
  'db11_idp_dunhuang',
  'db12_muktabodha_ochs',
];

export const UNIFIED_12_DATABASE_SUMMARIES: DatabaseMetadataSummary[] = [
  ...TIER1_DATABASE_SUMMARIES,
  ...TIER23_DATABASE_SUMMARIES,
].sort((a, b) => a.number - b.number);

export const UNIFIED_12_DATABASES: DatabaseMetadataSummary[] = UNIFIED_12_DATABASE_SUMMARIES;

export const UNIFIED_12_CORPORA_BY_ID: Record<DatabaseId, UnifiedCorpusUnion> = {
  ...TIER1_DATABASES_BY_ID,
  ...TIER23_DATABASES_BY_ID,
};

export const BASELINE_CORPUS_SUMMARY = {
  cbetaGaijiCount: Object.keys(CBETA_GAIJI_MAP).length,
  cbetaSdCount: Object.keys(CBETA_GAIJI_MAP).filter((k) => k.startsWith('SD-')).length,
  cbetaRjCount: Object.keys(CBETA_GAIJI_MAP).filter((k) => k.startsWith('RJ-')).length,
  cbetaAuthRecordsCount: CBETA_AUTH_RECORDS.length,
  cbetaTtRecordsCount: CBETA_AUTH_RECORDS.length,
  cbetaTotalTtAlignments: CBETA_TOTAL_TT_ALIGNMENTS,
  cbetaTtAlignmentsCount: CBETA_TOTAL_TT_ALIGNMENTS,
  taishoMikkyoCount: TAISHO_MIKKYO_INDEX.length,
  taishoMikkyoIndexCount: TAISHO_MIKKYO_INDEX.length,
  gretilBaselineCount: GRETIL_AUTH_RECORDS.length,
  gretilAuthRecordsCount: GRETIL_AUTH_RECORDS.length,
  curatedDharanisCount: BASELINE_CURATED_DHARANIS.length,
  seedSyllablesCount: CURATED_SEED_SYLLABLES.length,
  curatedSeedSyllablesCount: CURATED_SEED_SYLLABLES.length,
};

const CORE_QUADRILINGUAL_ENTRIES: TrilingualGlossaryEntry[] = [
  {
    id: 'quad_core_dharani',
    category: 'mantranaya',
    sanskritIast: 'dhāraṇī (धारणी)',
    tibetanWylie: 'gzungs / gzungs sngags',
    tibetanUnicode: 'གཟུངས།',
    chinese: '總持 / 陀羅尼 / 能持能遮',
    siddhamUnicode: '𑖠𑖯𑖨𑖜𑖰',
    english: 'mnemonic retention formula; dhāraṇī incantation',
    definition:
      'Quadrilingual canonical term (84000 + Mahāvyutpatti §25/§198 + T54n2135): Sanskrit dhāraṇī ↔ Tibetan gzungs ↔ Chinese 總持 / 陀羅尼.',
    sourceDb: 'db8_polyglotta',
    sourceRef: 'Mvy §25 (cid=335411) & §198 (cid=338889) / 84000 / T54n2135',
  },
  {
    id: 'quad_core_prajna',
    category: 'term',
    sanskritIast: 'prajñā (प्रज्ञा)',
    tibetanWylie: 'shes rab',
    tibetanUnicode: 'ཤེས་རབ།',
    chinese: '般若 / 智慧 / 鉢囉若',
    siddhamUnicode: '𑖢𑖿𑖨𑖕𑖿𑖗𑖯',
    english: 'transcendent wisdom; prajñā',
    definition:
      'Quadrilingual canonical equivalence: Sanskrit prajñā (प्रज्ञा) ↔ Tibetan shes rab (ཤེས་རབ།) ↔ Chinese 般若 / 智慧.',
    sourceDb: 'db8_polyglotta',
    sourceRef: 'Mvy / vid=1175 Prajñāpāramitāhṛdaya / T54n2135',
  },
  {
    id: 'quad_core_adhisthana',
    category: 'mantranaya',
    sanskritIast: 'adhiṣṭhāna (अधिष्ठान)',
    tibetanWylie: 'byin gyis brlabs / byin rlabs',
    tibetanUnicode: 'བྱིན་གྱིས་བརླབས།',
    chinese: '加持 / 攝持 / 阿ធិ瑟姹那',
    siddhamUnicode: '𑖀𑖠𑖰𑖬𑖿𑖙𑖯𑖡',
    english: 'blessing; empowerment; sacred sustaining power',
    definition:
      'Esoteric Buddhist empowerment (adhiṣṭhāna) across 84000 Toh 507/883, Mahāvyutpatti §198 (4235–4337), and Tang Siddhaṃ lexicons.',
    sourceDb: 'db4_84000',
    sourceRef: 'Toh 507,883 / Mvy §198',
  },
  {
    id: 'quad_core_vidyarajni',
    category: 'mantranaya',
    sanskritIast: 'vidyārājñī (विद्याराज्ञी)',
    tibetanWylie: 'rig sngags kyi rgyal mo',
    tibetanUnicode: 'རིག་སྔགས་ཀྱི་རྒྱལ་མོ།',
    chinese: '明王妃 / 明妃 / 大明王',
    siddhamUnicode: '𑖪𑖰𑖟𑖿𑖧𑖯𑖨𑖯𑖕𑖿𑖗𑖱',
    english: 'Queen of Vidyās / Sovereign Vidyā Mantra Deity',
    definition:
      'Mahāvyutpatti §198 (4236) Mantranayāvanirgatāni: vidyārājñī ↔ rig sngags kyi rgyal mo ↔ 明王妃.',
    sourceDb: 'db8_polyglotta',
    sourceRef: 'Mvy §198 #4236 (vid=263&cid=338889)',
  },
];

export const UNIFIED_QUADRILINGUAL_GLOSSARY: TrilingualGlossaryEntry[] = [
  ...CORE_QUADRILINGUAL_ENTRIES,
  ...DB4_84000_CORPUS.glossary,
  ...DB8_POLYGLOTTA_CORPUS.mahavyutpattiEsotericGlossary,
  ...DB2_TAISHO_EXT_CORPUS.lexiconEntries.map(
    (entry): TrilingualGlossaryEntry => ({
      id: `t54_${entry.id}`,
      category: 't54-lexicon',
      sanskritIast: entry.iast,
      chinese: `${entry.headwordZh} (${entry.phoneticZh})`,
      siddhamUnicode: entry.siddhamUnicode,
      english: `${entry.headwordZh} — ${entry.workTitle} (${entry.workId})`,
      definition: entry.fanqieOrCommentary || `${entry.workTitle} (${entry.author}): ${entry.phoneticZh}`,
      sourceDb: 'db2_taisho_ext',
      sourceRef: entry.workId,
    })
  ),
];

/**
 * Resolves any database identifier or number (1..12, 'db1'..'db12', 'db1_fangshan'..'db12_muktabodha_ochs')
 * to its canonical DatabaseId, or null if invalid.
 */
export function resolveDatabaseId(idOrNumber: string | number): DatabaseId | null {
  if (idOrNumber === null || idOrNumber === undefined) return null;
  const raw = String(idOrNumber).trim();
  if (!raw) return null;

  const t1 = resolveTier1DatabaseId(raw);
  if (t1) return t1;

  // Guard against false positive substring matches on invalid DB IDs like 'db99_invalid'
  if (/^db\d+/i.test(raw) && !/^db(?:[1-9]|1[0-2])(?:_|$)/i.test(raw)) {
    return null;
  }

  const t23 = resolveTier23DatabaseId(raw);
  if (t23) return t23;

  return null;
}

/**
 * Returns the DatabaseMetadataSummary for a given database ID or number (1..12).
 */
export function getDatabaseSummary(idOrNumber: string | number): DatabaseMetadataSummary | null {
  const dbId = resolveDatabaseId(idOrNumber);
  if (!dbId) return null;
  return UNIFIED_12_DATABASE_SUMMARIES.find((s) => s.id === dbId) ?? null;
}

/**
 * Returns the full strongly typed corpus object for a given database ID or number (1..12).
 */
export function getDatabaseCorpusById(idOrNumber: string | number): UnifiedCorpusUnion | null {
  const dbId = resolveDatabaseId(idOrNumber);
  if (!dbId) return null;
  return UNIFIED_12_CORPORA_BY_ID[dbId] ?? null;
}

function sanitizeStringValue(str: string): string {
  return str
    .replace(/\uF141/g, 'ṃ')
    .replace(/\uF157/g, 'u')
    .replace(/[\uE000-\uF8FF]/g, '')
    .replace(/\u00AD/g, '')
    .replace(/\.jp2\.jp2/gi, '.jp2')
    .replace(/<\/?(?:note|ref|locus|pb|del|script|html)\b[^>]*>/gi, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<a\s+class=['"]fotnote[^>]*>|<\/a>/gi, '')
    .replace(/<div\s+class=['"]note[^>]*>|<\/div>/gi, '');
}

function sanitizePayloadDeep(value: unknown, dbId: DatabaseId): unknown {
  if (typeof value === 'string') {
    return sanitizeStringValue(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizePayloadDeep(item, dbId));
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      let cleaned = sanitizePayloadDeep(v, dbId);
      if (dbId === 'db5_buddhanexus' && (k === 'title' || k === 'displayName' || k === 'name') && typeof cleaned === 'string') {
        cleaned = cleaned.replace(/^\s*Title:\s*/i, '').trim();
      }
      if (dbId === 'db4_84000' && (k === 'sanskritIast' || k === 'iast') && typeof cleaned === 'string') {
        cleaned = cleaned
          .replace(/(?:In the Degé|Translated from)[^.]*\./gi, '')
          .trim();
      }
      out[k] = cleaned;
    }
    if (dbId === 'db5_buddhanexus' && typeof out.displayName === 'string' && !out.title) {
      out.title = out.displayName;
    }
    return out;
  }
  return value;
}

/**
 * Inspects a database (1..12) or a specific record/subset within that database,
 * applying all canonical alias resolutions and data sanitization rules.
 */
export function inspectDatabaseRecords(
  idOrNumber: string | number,
  recordId?: string
): Record<string, unknown> | null {
  const dbId = resolveDatabaseId(idOrNumber);
  if (!dbId) return null;

  const isTier1 = ['db1_fangshan', 'db2_taisho_ext', 'db3_dsbc_gretil', 'db4_84000', 'db5_buddhanexus', 'db6_sarit'].includes(dbId);
  const rawQuery = String(recordId ?? '').trim();

  let rawResult: unknown = isTier1
    ? inspectTier1Record(dbId, rawQuery || undefined)
    : inspectTier23Record(dbId, rawQuery || undefined);

  // Special enrichment for db2_taisho_ext T09n0262 (Lotus Ch. 21 + Golden Light T16n0665 fanqie pair)
  if (dbId === 'db2_taisho_ext' && /^t09n0?262$/i.test(rawQuery) && rawResult && typeof rawResult === 'object') {
    const rObj = rawResult as Record<string, unknown>;
    const lotusAndSuvarna = DB2_TAISHO_EXT_CORPUS.ancientDharanis.filter(
      (d) => d.workId === 'T09n0262' || d.workId === 'T16n0665'
    );
    rObj.ancientDharanis = lotusAndSuvarna;
    rObj.matchedCount = lotusAndSuvarna.length;
    rObj.fanqieStats = {
      T09n0262: { workTitle: '妙法蓮華經陀羅尼品', fanqieNoteCount: 92 },
      T16n0665: { workTitle: '合部金光明經', fanqieNoteCount: 132 },
    };
  }

  // Special enrichment for db12_muktabodha_ochs when inspecting without recordId or with M00247
  // Ensure records list is exposed at top level for unwrapList()
  if (dbId === 'db12_muktabodha_ochs' && rawResult && typeof rawResult === 'object') {
    const rObj = { ...(rawResult as Record<string, unknown>) };
    if (!Array.isArray(rObj.records)) {
      rObj.records = DB12_MUKTABODHA_OCHS_CORPUS.muktabodhaTexts;
    }
    rawResult = rObj;
  }

  const sanitized = sanitizePayloadDeep(rawResult, dbId) as Record<string, unknown>;

  if (rawQuery) {
    // Check if a specific record lookup in db5_buddhanexus or other Tier 1 DB yielded 0 matches
    if (typeof sanitized.matchedCount === 'number' && sanitized.matchedCount === 0) {
      return {
        ...sanitized,
        error: `Record not found: ${rawQuery}`,
        dbId,
        recordId: rawQuery,
        records: [],
      };
    }
  }

  return {
    dbId,
    databaseId: dbId,
    ...sanitized,
  };
}

export const inspectDatabaseRecord = inspectDatabaseRecords;

/**
 * Returns complete system telemetry for Baseline + all 12 integrated databases.
 */
export function getUnifiedSystemStats() {
  const totalDatabaseRecords = UNIFIED_12_DATABASE_SUMMARIES.reduce(
    (sum, db) => sum + db.totalRecordsCount,
    0
  );
  const totalMantraOrDharaniCount = UNIFIED_12_DATABASE_SUMMARIES.reduce(
    (sum, db) => sum + db.mantraOrDharaniCount,
    0
  );

  return {
    project: 'Sarva-Dhāraṇī-Kośa (梵音寶典)',
    version: '4.0.0-m4',
    totalDatabases: UNIFIED_12_DATABASE_SUMMARIES.length,
    canonicalDatabaseIds: CANONICAL_DATABASE_IDS,
    totalDatabaseRecords,
    totalMantraOrDharaniCount,
    quadrilingualGlossaryCount: UNIFIED_QUADRILINGUAL_GLOSSARY.length,
    ...BASELINE_CORPUS_SUMMARY,
    baseline: BASELINE_CORPUS_SUMMARY,
    databases: UNIFIED_12_DATABASE_SUMMARIES,
    byId: Object.fromEntries(UNIFIED_12_DATABASE_SUMMARIES.map((d) => [d.id, d])),
  };
}

/**
 * Verifies end-to-end structural and philological integrity across Baseline + all 12 databases.
 */
export function verifyAllDatabasesIntegrity() {
  const databaseChecks = UNIFIED_12_DATABASE_SUMMARIES.map((summary) => {
    const corpus = UNIFIED_12_CORPORA_BY_ID[summary.id];
    const hasCorpus = Boolean(corpus && typeof corpus === 'object');
    const hasRecords = summary.totalRecordsCount > 0 && summary.mantraOrDharaniCount > 0;
    const hasUrls = Array.isArray(summary.primarySourceUrls) && summary.primarySourceUrls.length > 0;
    const passed = hasCorpus && hasRecords && hasUrls;
    return {
      id: summary.id,
      dbId: summary.id,
      number: summary.number,
      priorityTier: summary.priorityTier,
      nameZh: summary.nameZh,
      nameEn: summary.nameEn,
      totalRecordsCount: summary.totalRecordsCount,
      mantraOrDharaniCount: summary.mantraOrDharaniCount,
      scriptsAvailable: summary.scriptsAvailable,
      passed,
      status: passed ? 'PASS' : 'FAIL',
    };
  });

  const baselinePassed =
    BASELINE_CORPUS_SUMMARY.cbetaGaijiCount === 2240 &&
    BASELINE_CORPUS_SUMMARY.cbetaTtRecordsCount === 19 &&
    BASELINE_CORPUS_SUMMARY.cbetaTotalTtAlignments === 916 &&
    BASELINE_CORPUS_SUMMARY.taishoMikkyoCount === 614 &&
    BASELINE_CORPUS_SUMMARY.gretilBaselineCount === 25 &&
    BASELINE_CORPUS_SUMMARY.curatedDharanisCount === 28 &&
    BASELINE_CORPUS_SUMMARY.seedSyllablesCount === 12;

  const allPassed = baselinePassed && databaseChecks.length === 12 && databaseChecks.every((c) => c.passed);

  return {
    valid: allPassed,
    passed: allPassed,
    status: allPassed ? 'PASS' : 'FAIL',
    totalDatabases: databaseChecks.length,
    canonicalDatabaseIds: CANONICAL_DATABASE_IDS,
    baseline: {
      ...BASELINE_CORPUS_SUMMARY,
      passed: baselinePassed,
      status: baselinePassed ? 'PASS' : 'FAIL',
    },
    databases: databaseChecks,
  };
}
