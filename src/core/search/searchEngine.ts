import type { ActiveWorkspaceTab, DharaniCategoryId, DharaniEntry } from '../../types/kosaTypes';
import type { TaishoMikkyoFileEntry } from '../../data/kosa-generated/taishoMikkyoIndex';
import type { CanonCatalogItem } from '../canon/canonLibraryTypes';
import { stripDiacritics } from '../sanskrit/transliterator';
import { devanagariToSlp1, siddhamUnicodeToSlp1, slp1ToIast } from '../transliterator';
import { foldCjkPhonetic } from './cjkFold';

export interface SearchFilterOptions {
  query: string;
  categoryId: DharaniCategoryId | 'all';
  onlyBookmarked: boolean;
  bookmarkedIds: Set<string>;
  sourceFilter: 'all' | 'global-12db' | 'cbeta-siddham' | 'gretil-sanskrit';
}

export interface SearchSuggestionItem {
  kind: 'canon-entry' | 'canon-scripture' | 'taisho-scripture' | 'global-12db-hit';
  entry?: DharaniEntry;
  canonItem?: CanonCatalogItem;
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
  db11_idp_dunhuang: { labelZh: 'DB11 · 大英图书馆IDP/CEToM与敦煌丝路梵本', tab: 'hub' },
  db11_idp_cetom: { labelZh: 'DB11 · 大英图书馆IDP/CEToM西域丝路梵本', tab: 'hub' },
  db12_muktabodha_ochs: { labelZh: 'DB12 · 牛津OCHS种子字辞典与金刚顶经', tab: 'phonetics-academy' },
  db12_ochs_muktabodha: { labelZh: 'DB12 · 牛津OCHS种子字辞典与金刚顶经', tab: 'phonetics-academy' },
};

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

interface IndexedCanonItem {
  raw: CanonCatalogItem;
  normTitle: string;
  normId: string;
  normHay: string;
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
let loadedCanonCatalogIndex: IndexedCanonItem[] = [];

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

/**
 * Hydrates the full CBETA Canon catalog (all 27 collections, BOTH pure sutras without dhāraṇīs
 * and scriptures with dhāraṇīs) into the unified homophone/Simplified-Traditional search engine.
 */
export function hydrateCanonCatalogForSearch(items: CanonCatalogItem[]): void {
  if (!Array.isArray(items) || items.length === 0) return;
  loadedCanonCatalogIndex = items.map((raw) => {
    const normTitle = normalizeSearchText(raw.title);
    const normId = raw.id.toLowerCase();
    const shortNum = raw.id.replace(/^[A-Z]+\d+n0*/i, '').toLowerCase();
    const normByline = normalizeSearchText(raw.byline || '');
    return {
      raw,
      normTitle,
      normId,
      normHay: `${normId} ${shortNum} ${normTitle} ${normByline}`,
    };
  });
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
    const eagerWords =
      wordsDesc && 'value' in wordsDesc && Array.isArray(wordsDesc.value) ? wordsDesc.value : [];
    const wordsStr = eagerWords
      .map((w: { iast: string; transliterationZh: string; meaningZh: string }) => `${w.iast} ${w.transliterationZh} ${w.meaningZh}`)
      .join(' ');
    const classicalDesc = Object.getOwnPropertyDescriptor(v, 'classicalTranslitZh');
    const classicalStr =
      classicalDesc && 'value' in classicalDesc ? String(classicalDesc.value || '') : '';
    const modernDesc = Object.getOwnPropertyDescriptor(v, 'modernPhoneticZh');
    const modernStr =
      modernDesc && 'value' in modernDesc ? String(modernDesc.value || '') : '';
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
  if (!ts.normHay) {
    ts.normHay = normalizeSearchText(
      `${ts.id} ${ts.titleZh} ${ts.titleTrad} ${ts.translator} ${(ts.blockTitles || []).join(' ')} ${ts.sampleDharanis.join(' ')}`
    );
  }
  return ts.normHay;
}

function matchesHay(hay: string, normQuery: string, tokens: string[]): boolean {
  return hay.includes(normQuery) || (tokens.length > 1 && tokens.every((tk) => hay.includes(tk)));
}

function resolveQuery(
  entries: DharaniEntry[],
  rawQuery: string
): { normQuery: string; tokens: string[] } {
  const full = normalizeSearchText(rawQuery).replace(/\s+/g, ' ').trim();
  for (const q of [full, ...relaxedCjkQueries(full)]) {
    const tokens = tokensOf(q);
    if (
      entries.some((e) => matchesDoc(getIndexedEntryDoc(e), q, tokens)) ||
      loadedCanonCatalogIndex.some((c) => matchesHay(c.normHay, q, tokens)) ||
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
      if (!entry.provenance.gretilFile && !entry.provenance.gretilRawUrl) return false;
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
  const isPureSutra = entry.verses.length === 0;
  return {
    kind: 'canon-entry',
    entry,
    titleZh: entry.titleZh,
    taishoNo: entry.taishoNo,
    matchTypeLabel: isPureSutra
      ? `${badgePrefix}经文原文直看（无陀罗尼）`
      : `${badgePrefix}${matchTypeLabel}`,
    matchedVerseId: matchedVerse?.id,
    matchedVerseIndex: matchedVerse?.index,
    snippetPrimary: previewVerse
      ? `梵音：${sliceCp(previewVerse.iast, 72)}`
      : `原典全文：${sliceCp(entry.sutraSourceZh || entry.titleSanskritIast, 72)}`,
    snippetSecondary: previewVerse
      ? `古汉语：${sliceCp(previewVerse.classicalTranslitZh, 42)} · 梵音拼读：${sliceCp(previewVerse.modernPhoneticZh, 42)}`
      : `${entry.translatorZh} · 点击直接查看经文原文全文`,
  };
}

export function getSearchSuggestions(
  entries: DharaniEntry[],
  rawQuery: string,
  limit = 24
): SearchSuggestionItem[] {
  const { normQuery: q, tokens } = rawQuery.trim()
    ? resolveQuery(entries, rawQuery)
    : { normQuery: '', tokens: [] as string[] };

  if (!q) {
    const classicPicks = entries
      .filter((e) => !e.provenance.databaseId)
      .slice(0, 6)
      .map((entry) => toCanonSuggestionItem(entry, '原文+四体陀罗尼'));

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

    const pureSutraPicks: SearchSuggestionItem[] = loadedCanonCatalogIndex
      .filter((c) => c.raw.collection === 'T' && c.raw.dharani === 0)
      .slice(0, 4)
      .map((c) => ({
        kind: 'canon-scripture' as const,
        canonItem: c.raw,
        titleZh: `《${c.raw.title}》`,
        taishoNo: c.raw.id,
        matchTypeLabel: `${c.raw.id} · 纯经文原典（无陀罗尼）`,
        snippetPrimary: `${c.raw.byline || '藏经原典'} · 全文 ${(c.raw.chars || 0).toLocaleString()} 字`,
        snippetSecondary: '点击直接在主阅读器查看整卷经文原文（自动隐藏陀罗尼栏目）',
      }));

    return [...classicPicks, ...pureSutraPicks, ...dbPicks].slice(0, limit);
  }

  const scoredCanon: Array<{
    score: number;
    is12Db: boolean;
    entry: DharaniEntry;
    matchTypeLabel: string;
    matchedVerse?: DharaniEntry['verses'][number];
  }> = [];

  for (const entry of entries) {
    const doc = getIndexedEntryDoc(entry);
    if (!matchesDoc(doc, q, tokens)) continue;

    const is12Db = Boolean(
      entry.provenance.databaseId || entry.provenance.sourceType === 'GLOBAL-12DB'
    );
    const titleMatch =
      doc.normTitle.includes(q) ||
      (tokens.length > 1 && tokens.every((tk) => doc.normTitle.includes(tk)));
    const dbOrNoMatch =
      doc.normDbAndNo.includes(q) ||
      (tokens.length > 1 && tokens.every((tk) => doc.normDbAndNo.includes(tk)));
    const deityMatch = doc.normDeity.includes(q);

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

    let matchTypeLabel = is12Db ? '原文 + 12库梵音' : '原文 + 四体陀罗尼';
    if (entry.categoryId === 'gretil-canonical') {
      matchTypeLabel = `GRETIL 梵本原文+咒 (${entry.provenance.gretilFile || ''})`;
    } else if (dbOrNoMatch && !titleMatch) {
      matchTypeLabel = `经号/数据库匹配 (${entry.taishoNo})`;
    } else if (deityMatch && !titleMatch) {
      matchTypeLabel = `本尊/译者匹配 (${entry.deityZh.slice(0, 14)})`;
    } else if (matchedVerse && !titleMatch) {
      matchTypeLabel = `匹配第 ${matchedVerse.index} 句梵音/古汉语`;
    }

    scoredCanon.push({ score, is12Db, entry, matchTypeLabel, matchedVerse });
  }

  scoredCanon.sort((a, b) => b.score - a.score);

  const classicResults = scoredCanon.filter((x) => !x.is12Db);
  const db12CanonResults = scoredCanon.filter((x) => x.is12Db);

  // Full CBETA Canon scripture hits (both pure non-dharani sutras & dharani sutras!)
  const canonScriptureHits: Array<{ score: number; item: SearchSuggestionItem }> = [];
  const rawLower = rawQuery.trim().toLowerCase();
  for (const c of loadedCanonCatalogIndex) {
    if (!matchesHay(c.normHay, q, tokens) && !c.normId.includes(rawLower)) continue;
    let s = 30;
    if (c.normId === rawLower) s += 160;
    else if (c.normTitle === q) s += 145;
    else if (c.normTitle.startsWith(q)) s += 115;
    else if (c.normTitle.includes(q)) s += 85;
    if (c.raw.collection === 'T') s += 20;

    const hasDh = c.raw.dharani > 0;
    canonScriptureHits.push({
      score: s,
      item: {
        kind: 'canon-scripture',
        canonItem: c.raw,
        titleZh: `《${c.raw.title}》`,
        taishoNo: c.raw.id,
        matchTypeLabel: hasDh
          ? `${c.raw.id} · 原文 + 陀罗尼 ${c.raw.dharani} 段`
          : `${c.raw.id} · 经典全文（无陀罗尼）`,
        snippetPrimary: `${c.raw.byline || '藏经原典'} · 全文 ${(c.raw.chars || 0).toLocaleString()} 字`,
        snippetSecondary: hasDh
          ? `含 ${c.raw.dharani} 段陀罗尼：点击同时查看整卷原文与陀罗尼多体发音`
          : '无陀罗尼纯经文：点击直接查看整卷经文原文（不显示陀罗尼栏目）',
      },
    });
  }
  canonScriptureHits.sort((a, b) => b.score - a.score);

  const results: SearchSuggestionItem[] = [];
  let cIdx = 0;
  let dIdx = 0;
  let sIdx = 0;
  const maxMainSlots = Math.max(12, limit - 6);

  // Interleave curated/12db entries AND full-canon scriptures so pure non-dharani sutras always surface!
  while (
    results.length < maxMainSlots &&
    (cIdx < classicResults.length ||
      dIdx < db12CanonResults.length ||
      sIdx < canonScriptureHits.length)
  ) {
    if (cIdx < classicResults.length) {
      const hit = classicResults[cIdx++];
      results.push(toCanonSuggestionItem(hit.entry, hit.matchTypeLabel, hit.matchedVerse));
    }
    if (results.length < maxMainSlots && sIdx < canonScriptureHits.length) {
      results.push(canonScriptureHits[sIdx++].item);
    }
    if (results.length < maxMainSlots && dIdx < db12CanonResults.length) {
      const hit = db12CanonResults[dIdx++];
      results.push(toCanonSuggestionItem(hit.entry, hit.matchTypeLabel, hit.matchedVerse));
    }
  }

  try {
    const existingTitles = new Set(results.map((r) => normalizeSearchText(r.titleZh)));
    let added12Db = 0;

    for (const hit of loadedSpecialized12DbRecords) {
      if (results.length >= limit || added12Db >= 5) break;
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
    // Ignore edge case
  }

  const taishoHits: Array<{ titleHit: boolean; item: SearchSuggestionItem }> = [];
  for (const ts of loadedTaishoIndex) {
    if (!matchesHay(taishoHay(ts), q, tokens)) continue;
    const tsAny = ts as TaishoMikkyoFileEntry & { normTitlePair?: string };
    if (!tsAny.normTitlePair) tsAny.normTitlePair = normalizeSearchText(`${ts.titleZh} ${ts.titleTrad || ''}`);
    const titleHit = tsAny.normTitlePair.includes(q);
    taishoHits.push({
      titleHit,
      item: {
        kind: 'taisho-scripture',
        taishoScriptureId: ts.id,
        titleZh: `【大正藏原典】${ts.titleZh}`,
        taishoNo: `${ts.id} (${ts.vol})`,
        matchTypeLabel:
          ts.dharaniBlockCount > 0
            ? `大正藏密教部 · 原文 + 真言 ${ts.dharaniBlockCount} 段`
            : `大正藏密教部 · 纯汉文仪轨全文（无陀罗尼）`,
        snippetPrimary: `译者：${ts.translator} · 点击查看整卷原文${ts.dharaniBlockCount > 0 ? '与全部真言' : ''}`,
        snippetSecondary: ts.sampleDharanis[0]
          ? `原典咒句：${sliceCp(ts.sampleDharanis[0], 72)}...`
          : `CBETA 经号 ${ts.id}.xml 原文全文`,
      },
    });
  }
  taishoHits.sort((a, b) => Number(b.titleHit) - Number(a.titleHit));
  const reserved = Math.min(taishoHits.length, Math.max(3, Math.floor(limit / 5)));
  const head = results.slice(0, limit - reserved);
  return [...head, ...taishoHits.slice(0, limit - head.length).map((h) => h.item)];
}
