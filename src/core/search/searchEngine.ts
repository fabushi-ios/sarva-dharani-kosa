import type { ActiveWorkspaceTab, DharaniCategoryId, DharaniEntry } from '../../types/kosaTypes';
import type { TaishoMikkyoFileEntry } from '../../data/kosa-generated/taishoMikkyoIndex';
import { stripDiacritics } from '../sanskrit/transliterator';
import { devanagariToSlp1, siddhamUnicodeToSlp1, slp1ToIast } from '../transliterator';

export interface SearchFilterOptions {
  query: string;
  categoryId: DharaniCategoryId | 'all';
  onlyBookmarked: boolean;
  bookmarkedIds: Set<string>;
  sourceFilter: 'all' | 'global-12db' | 'cbeta-siddham' | 'gretil-sanskrit';
}

export interface SearchSuggestionItem {
  kind: 'canon-entry' | 'taisho-scripture' | 'global-12db-hit';
  entry?: DharaniEntry;
  taishoScriptureId?: string;
  targetTab?: ActiveWorkspaceTab;
  titleZh: string;
  taishoNo: string;
  matchTypeLabel: string;
  matchedVerseId?: string;
  matchedVerseIndex?: number;
  snippetPrimary: string;
  snippetSecondary: string;
}

import { foldCjkPhonetic } from './cjkFold';

const DB_BADGE_MAP: Record<string, { labelZh: string; tab: ActiveWorkspaceTab }> = {
  db1_fangshan: { labelZh: 'DB1 · 房山石经与释教最上乘陀罗尼集', tab: 'interlinear' },
  db2_taisho_ext: { labelZh: 'DB2 · 大正藏T54悉昙字书与续藏', tab: 'interlinear' },
  db3_dsbc_gretil: { labelZh: 'DB3 · 尼泊尔DSBC百品陀罗尼集', tab: 'hub' },
  db4_84000: { labelZh: 'DB4 · 84000藏文大藏经陀罗尼集', tab: 'hub' },
  db5_buddhanexus: { labelZh: 'DB5 · BuddhaNexus梵汉藏巴四语平行库', tab: 'concordance' },
  db6_sarit: { labelZh: 'DB6 · SARIT密续与金刚幕续梵本', tab: 'hub' },
  db7_cudl_hidas: { labelZh: 'DB7 · 剑桥CUDL贝叶经与Hidas校勘本', tab: 'cudl' },
  db8_polyglotta: { labelZh: 'DB8 · 奥斯陆16本心经与多语对勘库', tab: 'concordance' },
  db9_rkts: { labelZh: 'DB9 · 维也纳rKTs德格版陀罗尼集(Zungdu)', tab: 'hub' },
  db10_all_nibs: { labelZh: 'DB10 · ALL-NIBS尼瓦尔梵本写本库', tab: 'hub' },
  db11_idp_cetom: { labelZh: 'DB11 · 大英图书馆IDP/CEToM西域丝路梵本', tab: 'hub' },
  db12_ochs_muktabodha: { labelZh: 'DB12 · 牛津OCHS种子字辞典与金刚顶经', tab: 'phonetics-academy' },
};

/**
 * Search normalisation — one generic pipeline applied identically to indexed text and queries.
 * There are NO per-dhāraṇī aliases or hand-written character lists here:
 *  1. Devanāgarī / Siddham are transliterated to IAST, then all diacritics are stripped;
 *  2. Latin romanisation schemes are folded (sh→s, w→v, ee→i, oo→u, doubled letters),
 *     so IAST, Harvard-Kyoto and popular spellings (shree / swaha / hreem) coincide;
 *  3. interlinear annotations — any bracketed run of ≤4 CJK characters, e.g. (一) [二合] （引）
 *     — are removed, so a mantra typed with or without clause numbers matches the canon;
 *  4. every CJK character is folded to the representative of its Mandarin syllable
 *     (Unihan-derived), so Traditional/Simplified, transliteration variants (儞/你, 陁/陀)
 *     and homophones compare equal.
 */
export function normalizeSearchText(input: string): string {
  let raw = (input || '').replace(/[₍₎]/g, '');
  if (/[\u0900-\u097F]/.test(raw)) {
    try {
      raw += ' ' + slp1ToIast(devanagariToSlp1(raw));
    } catch {
      // keep raw
    }
  }
  if (/[\u{11580}-\u{115FF}]/u.test(raw)) {
    try {
      raw += ' ' + slp1ToIast(siddhamUnicodeToSlp1(raw));
    } catch {
      // keep raw
    }
  }
  const base = stripDiacritics(raw.normalize('NFKC'))
    .replace(/[(（[【〔〈<][\p{Script=Han}]{1,4}[)）\]】〕〉>]/gu, '')
    .replace(/\u3000/g, ' ')
    // whitespace between Han characters is layout (line breaks in the source), not a word break
    .replace(/(?<=\p{Script=Han})\s+(?=\p{Script=Han})/gu, '');
  const latin = base
    .toLowerCase()
    .replace(/sh/g, 's')
    .replace(/w/g, 'v')
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/([a-z])\1+/g, '$1');
  return foldCjkPhonetic(latin);
}

/** CJK-only queries that find nothing are relaxed by dropping trailing characters (≥2 kept). */
export function relaxedCjkQueries(normQuery: string): string[] {
  const chars = Array.from(normQuery);
  if (chars.length < 3 || !chars.every((c) => /\p{Script=Han}/u.test(c))) return [];
  const out: string[] = [];
  for (let n = chars.length - 1; n >= 2; n--) out.push(chars.slice(0, n).join(''));
  return out;
}

interface IndexedEntryDoc {
  normTitle: string;
  normDbAndNo: string;
  normDeity: string;
  normHeader: string;
  normVerses: string[];
  normFull: string;
}

const ENTRY_INDEX_CACHE = new WeakMap<DharaniEntry, IndexedEntryDoc>();
const PREBUILT_ENTRY_INDEX_BY_ID = new Map<string, IndexedEntryDoc>();

export interface PrebuiltEntrySearchRecord {
  id: string;
  t: string;
  d: string;
  m: string;
  v: string[];
}

export interface Specialized12DbSearchRecord {
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
}

export interface CloudSearchIndexPayload {
  version?: string;
  entries?: PrebuiltEntrySearchRecord[];
  specialized12DbRecords?: Specialized12DbSearchRecord[];
}

let loadedTaishoIndex: Array<TaishoMikkyoFileEntry & { normHay?: string }> = [];
let loadedSpecialized12DbRecords: Specialized12DbSearchRecord[] = [];

export function hydrateCloudSearchIndex(payload: CloudSearchIndexPayload): void {
  if (Array.isArray(payload.entries)) {
    for (const item of payload.entries) {
      const normHeader = `${item.t} ${item.d} ${item.m}`;
      const normFull = `${normHeader} ${item.v.join(' ')}`;
      PREBUILT_ENTRY_INDEX_BY_ID.set(item.id, {
        normTitle: item.t,
        normDbAndNo: item.d,
        normDeity: item.m,
        normHeader,
        normVerses: item.v,
        normFull,
      });
    }
  }
  if (Array.isArray(payload.specialized12DbRecords)) {
    loadedSpecialized12DbRecords = payload.specialized12DbRecords;
  }
}

export function hydrateTaishoSearchIndex(
  items: Array<TaishoMikkyoFileEntry & { normHay?: string }>
): void {
  if (Array.isArray(items)) {
    loadedTaishoIndex = items;
  }
}

function getIndexedEntryDoc(entry: DharaniEntry): IndexedEntryDoc {
  const cached = ENTRY_INDEX_CACHE.get(entry);
  if (cached) return cached;

  const prebuilt = PREBUILT_ENTRY_INDEX_BY_ID.get(entry.id);
  if (prebuilt) {
    ENTRY_INDEX_CACHE.set(entry, prebuilt);
    return prebuilt;
  }

  const normTitle = normalizeSearchText(
    `${entry.titleZh} ${entry.titleSanskritIast} ${entry.titleEnglish}`
  );
  const normDbAndNo = normalizeSearchText(
    `${entry.taishoNo} ${entry.provenance.cbetaId || ''} ${entry.provenance.gretilFile || ''} ${entry.provenance.databaseId || ''} ${entry.provenance.databaseBadgeZh || ''}`
  );
  const normDeity = normalizeSearchText(
    `${entry.deityZh} ${entry.translatorZh} ${entry.sutraSourceZh} ${entry.meritsAndSummaryZh} ${entry.provenance.editionCitation || ''} ${entry.provenance.manuscriptNotesZh || ''} ${entry.provenance.rawSnippet || ''}`
  );
  const normHeader = `${normTitle} ${normDbAndNo} ${normDeity}`;
  const normVerses = entry.verses.map((v) => {
    const wordsDesc = Object.getOwnPropertyDescriptor(v, 'words');
    const eagerWords = wordsDesc && 'value' in wordsDesc && Array.isArray(wordsDesc.value) ? wordsDesc.value : [];
    const wordsStr = eagerWords
      .map((w: { iast: string; transliterationZh: string; meaningZh: string }) => `${w.iast} ${w.transliterationZh} ${w.meaningZh}`)
      .join(' ');
    const classicalDesc = Object.getOwnPropertyDescriptor(v, 'classicalTranslitZh');
    const classicalStr = classicalDesc && 'value' in classicalDesc ? String(classicalDesc.value || '') : '';
    const modernDesc = Object.getOwnPropertyDescriptor(v, 'modernPhoneticZh');
    const modernStr = modernDesc && 'value' in modernDesc ? String(modernDesc.value || '') : '';
    return normalizeSearchText(
      `${v.iast} ${classicalStr} ${modernStr} ${v.meaningZh} ${v.meaningEn} ${wordsStr}`
    );
  });
  const normFull = `${normHeader} ${normVerses.join(' ')}`;

  const doc: IndexedEntryDoc = {
    normTitle,
    normDbAndNo,
    normDeity,
    normHeader,
    normVerses,
    normFull,
  };
  ENTRY_INDEX_CACHE.set(entry, doc);
  return doc;
}

function tokensOf(normQuery: string): string[] {
  return normQuery.split(/\s+/).filter(Boolean);
}

function matchesDoc(doc: IndexedEntryDoc, normQuery: string, tokens: string[]): boolean {
  if (!normQuery) return true;
  if (doc.normFull.includes(normQuery)) return true;
  return tokens.length > 1 && tokens.every((tk) => doc.normFull.includes(tk));
}

function taishoHay(ts: TaishoMikkyoFileEntry & { normHay?: string }): string {
  return (
    ts.normHay ||
    normalizeSearchText(
      `${ts.id} ${ts.titleZh} ${ts.titleTrad} ${ts.translator} ${(ts.blockTitles || []).join(' ')} ${ts.sampleDharanis.join(' ')}`
    )
  );
}

function matchesHay(hay: string, normQuery: string, tokens: string[]): boolean {
  return hay.includes(normQuery) || (tokens.length > 1 && tokens.every((tk) => hay.includes(tk)));
}

/**
 * The normalised query actually used: the full query, or — only when it finds nothing at all —
 * the longest CJK prefix that does (e.g. 「坚牢地天神咒」 → 「坚牢地天」). Purely structural.
 */
function resolveQuery(entries: DharaniEntry[], rawQuery: string): { normQuery: string; tokens: string[] } {
  const full = normalizeSearchText(rawQuery).replace(/\s+/g, ' ').trim();
  for (const q of [full, ...relaxedCjkQueries(full)]) {
    const tokens = tokensOf(q);
    if (
      entries.some((e) => matchesDoc(getIndexedEntryDoc(e), q, tokens)) ||
      loadedTaishoIndex.some((ts) => matchesHay(taishoHay(ts), q, tokens))
    ) {
      return { normQuery: q, tokens };
    }
  }
  return { normQuery: full, tokens: tokensOf(full) };
}

export function filterDharanis(
  entries: DharaniEntry[],
  options: SearchFilterOptions
): DharaniEntry[] {
  const { normQuery, tokens } = resolveQuery(entries, options.query);

  return entries.filter((entry) => {
    if (options.categoryId !== 'all' && entry.categoryId !== options.categoryId) {
      return false;
    }

    if (options.onlyBookmarked && !options.bookmarkedIds.has(entry.id)) {
      return false;
    }

    if (options.sourceFilter === 'global-12db') {
      if (
        entry.provenance.sourceType !== 'GLOBAL-12DB' &&
        !entry.provenance.databaseId
      ) {
        return false;
      }
    } else if (options.sourceFilter === 'cbeta-siddham') {
      const hasSiddham =
        (entry.provenance.cbetaInterlinearTokens &&
          entry.provenance.cbetaInterlinearTokens.length > 0) ||
        Boolean(entry.provenance.cbetaId);
      if (!hasSiddham) return false;
    } else if (options.sourceFilter === 'gretil-sanskrit') {
      if (!entry.provenance.gretilFile) return false;
    }

    if (!normQuery) {
      return true;
    }

    const doc = getIndexedEntryDoc(entry);
    return matchesDoc(doc, normQuery, tokens);
  });
}

function sliceCp(text: string | undefined | null, maxCodePoints: number): string {
  if (!text) return '';
  return Array.from(text).slice(0, maxCodePoints).join('');
}

function toCanonSuggestionItem(
  entry: DharaniEntry,
  matchTypeLabel: string,
  matchedVerse?: DharaniEntry['verses'][number]
): SearchSuggestionItem {
  const previewVerse = matchedVerse || entry.verses[0];
  const badgePrefix = entry.provenance.databaseBadgeZh
    ? `🌐 ${entry.provenance.databaseBadgeZh} · `
    : '';
  return {
    kind: 'canon-entry',
    entry,
    titleZh: entry.titleZh,
    taishoNo: entry.taishoNo,
    matchTypeLabel: `${badgePrefix}${matchTypeLabel}`,
    matchedVerseId: matchedVerse?.id,
    matchedVerseIndex: matchedVerse?.index,
    snippetPrimary: previewVerse
      ? `梵音：${sliceCp(previewVerse.iast, 72)}`
      : entry.titleSanskritIast,
    snippetSecondary: previewVerse
      ? `古汉语：${sliceCp(previewVerse.classicalTranslitZh, 42)} · 梵音拼读：${sliceCp(previewVerse.modernPhoneticZh, 42)}`
      : entry.deityZh,
  };
}

/**
 * Generates instant selectable autocomplete results below the header search input,
 * searching across all 1,419+ authentic Sanskrit entries (including all 12 International Databases DB1–DB12,
 * Curated Multi-Script, World Mantras Encyclopedia, 200 GRETIL Sanskrit Manuscripts) +
 * Unified 12-Database Specialized Lexicons/Catalogs + 614 Taishō Esoteric Canon Scriptures.
 */
export function getSearchSuggestions(
  entries: DharaniEntry[],
  rawQuery: string,
  limit = 20
): SearchSuggestionItem[] {
  const { normQuery: q, tokens } = rawQuery.trim()
    ? resolveQuery(entries, rawQuery)
    : { normQuery: '', tokens: [] as string[] };

  if (!q) {
    // Show 6 classic flagship Dhāraṇīs + 10 representative entries across DB1–DB12
    const classicPicks = entries
      .filter((e) => !e.provenance.databaseId)
      .slice(0, 6)
      .map((entry) => toCanonSuggestionItem(entry, '核心经典陀罗尼'));

    const dbSeen = new Set<string>();
    const dbPicks: SearchSuggestionItem[] = [];
    for (const entry of entries) {
      const dbId = entry.provenance.databaseId;
      if (dbId && !dbSeen.has(dbId)) {
        dbSeen.add(dbId);
        dbPicks.push(toCanonSuggestionItem(entry, '12大国际权威梵典库'));
        if (dbPicks.length >= 10) break;
      }
    }

    return [...classicPicks, ...dbPicks].slice(0, limit);
  }

  // Score all matching entries across the entire 2,051-entry corpus so DB1–DB12 are never starved
  const scoredCanon: Array<{
    score: number;
    is12Db: boolean;
    entry: DharaniEntry;
    matchTypeLabel: string;
    matchedVerse?: DharaniEntry['verses'][number];
  }> = [];

  for (const entry of entries) {
    const doc = getIndexedEntryDoc(entry);
    if (!matchesDoc(doc, q, tokens)) {
      continue;
    }

    const is12Db = Boolean(
      entry.provenance.databaseId || entry.provenance.sourceType === 'GLOBAL-12DB'
    );

    const titleMatch =
      doc.normTitle.includes(q) ||
      (tokens.length > 1 && tokens.every((tk) => doc.normTitle.includes(tk)));
    const dbOrNoMatch =
      doc.normDbAndNo.includes(q) ||
      (tokens.length > 1 && tokens.every((tk) => doc.normDbAndNo.includes(tk)));
    const deityMatch =
      doc.normDeity.includes(q);

    let matchedVerse: DharaniEntry['verses'][number] | undefined;
    if (!titleMatch && !dbOrNoMatch && !deityMatch) {
      const vIdx = doc.normVerses.findIndex(
        (vStr) =>
          vStr.includes(q) ||
          (tokens.length > 1 && tokens.every((tk) => vStr.includes(tk)))
      );
      if (vIdx >= 0) {
        matchedVerse = entry.verses[vIdx];
      }
    }

    let score = 20;
    if (doc.normTitle.startsWith(q)) score += 120;
    else if (titleMatch) score += 90;
    if (dbOrNoMatch) score += 85;
    if (deityMatch) score += 55;
    if (matchedVerse) score += 35;
    if (is12Db && dbOrNoMatch) score += 30;

    let matchTypeLabel = is12Db ? '全球12大梵典专集' : '四体梵音精校库';
    if (entry.categoryId === 'gretil-canonical') {
      matchTypeLabel = `GRETIL 梵文贝叶经 (${entry.provenance.gretilFile || ''})`;
    } else if (dbOrNoMatch && !titleMatch) {
      matchTypeLabel = `经号/数据库匹配 (${entry.taishoNo})`;
    } else if (deityMatch && !titleMatch) {
      matchTypeLabel = `本尊/译者匹配 (${entry.deityZh.slice(0, 14)})`;
    } else if (matchedVerse && !titleMatch) {
      matchTypeLabel = `匹配第 ${matchedVerse.index} 句梵音/古汉语`;
    }

    scoredCanon.push({
      score,
      is12Db,
      entry,
      matchTypeLabel,
      matchedVerse,
    });
  }

  scoredCanon.sort((a, b) => b.score - a.score);

  // Interleave top curated & top 12-DB canon entries so both appear prominently in dropdown
  const classicResults = scoredCanon.filter((x) => !x.is12Db);
  const db12CanonResults = scoredCanon.filter((x) => x.is12Db);

  const results: SearchSuggestionItem[] = [];
  let cIdx = 0;
  let dIdx = 0;
  const maxCanonSlots = Math.max(10, limit - 6);

  while (
    results.length < maxCanonSlots &&
    (cIdx < classicResults.length || dIdx < db12CanonResults.length)
  ) {
    if (cIdx < classicResults.length) {
      const hit = classicResults[cIdx++];
      results.push(toCanonSuggestionItem(hit.entry, hit.matchTypeLabel, hit.matchedVerse));
    }
    if (results.length < maxCanonSlots && dIdx < db12CanonResults.length) {
      const hit = db12CanonResults[dIdx++];
      results.push(toCanonSuggestionItem(hit.entry, hit.matchTypeLabel, hit.matchedVerse));
    }
  }

  // Also query the Cloud-Hydrated Unified 12-Database Records for specialized lexicon/glossary/manuscript hits
  try {
    const existingTitles = new Set(results.map((r) => normalizeSearchText(r.titleZh)));
    let added12Db = 0;

    for (const hit of loadedSpecialized12DbRecords) {
      if (results.length >= limit || added12Db >= 6) break;
      if (hit.dbId === 'baseline') continue;
      const matchesHit =
        hit.normHay.includes(q) ||
        (tokens.length > 1 && tokens.every((tk) => hit.normHay.includes(tk)));
      if (!matchesHit) continue;

      const normHitTitle = normalizeSearchText(hit.title);
      if (existingTitles.has(normHitTitle)) continue;
      existingTitles.add(normHitTitle);

      const dbMeta = DB_BADGE_MAP[hit.dbId] || {
        labelZh: `DB${hit.databaseNumber} · 国际梵典数据库`,
        tab: 'hub' as ActiveWorkspaceTab,
      };

      const linkedEntry = entries.find(
        (e) =>
          e.id.includes(hit.id) ||
          (hit.canonicalRefs &&
            hit.canonicalRefs.some((ref) => e.taishoNo.includes(ref)))
      );

      results.push({
        kind: linkedEntry ? 'canon-entry' : 'global-12db-hit',
        entry: linkedEntry,
        targetTab: dbMeta.tab,
        titleZh: hit.title,
        taishoNo: (hit.canonicalRefs && hit.canonicalRefs[0]) || hit.id,
        matchTypeLabel: `🌐 ${dbMeta.labelZh}`,
        snippetPrimary: hit.sanskritIast
          ? `梵音/转写：${sliceCp(hit.sanskritIast, 76)}`
          : sliceCp(hit.snippet, 76),
        snippetSecondary: `${hit.subtitle} · ${hit.chineseText || hit.tibetanText || sliceCp(hit.snippet, 48)}`,
      });
      added12Db++;
    }
  } catch {
    // Ignore if unified search encounters edge case
  }

  // Taishō Esoteric Canon scriptures: ranked (title match first) and given reserved slots so
  // the 3,600-entry canon can never starve primary CBETA scripture hits out of the list.
  const taishoHits: Array<{ titleHit: boolean; item: SearchSuggestionItem }> = [];
  for (const ts of loadedTaishoIndex) {
    if (!matchesHay(taishoHay(ts), q, tokens)) continue;
    const titleHit = normalizeSearchText(`${ts.titleZh} ${ts.titleTrad || ''}`).includes(q);
    taishoHits.push({
      titleHit,
      item: {
        kind: 'taisho-scripture',
        taishoScriptureId: ts.id,
        titleZh: `【大正藏原典】${ts.titleZh}`,
        taishoNo: `${ts.id} (${ts.vol})`,
        matchTypeLabel: `大正藏密教部原典 · 含真言 ${ts.dharaniBlockCount} 段`,
        snippetPrimary: `译者：${ts.translator} · 点击查看 CBETA TEI-P5 原典全部真言`,
        snippetSecondary: ts.sampleDharanis[0]
          ? `原典咒句：${sliceCp(ts.sampleDharanis[0], 72)}...`
          : `CBETA 经号 ${ts.id}.xml`,
      },
    });
  }
  taishoHits.sort((a, b) => Number(b.titleHit) - Number(a.titleHit));
  const reserved = Math.min(taishoHits.length, Math.max(3, Math.floor(limit / 4)));
  const head = results.slice(0, limit - reserved);
  return [...head, ...taishoHits.slice(0, limit - head.length).map((h) => h.item)];
}
