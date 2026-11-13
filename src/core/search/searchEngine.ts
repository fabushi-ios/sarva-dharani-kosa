import type { ActiveWorkspaceTab, DharaniCategoryId, DharaniEntry } from '../../types/kosaTypes';
import type { TaishoMikkyoFileEntry } from '../../data/kosa-generated/taishoMikkyoIndex';
import type { CanonCatalogItem } from '../canon/canonLibraryTypes';
import {
  isClassicalChineseOnlyEntry,
  isClassicalChineseOnlyVerse,
} from '../provenance/fieldProvenance';
import { generateVerseChinesePhonetics } from '../sanskrit/phoneticMapper';
import { stripDiacritics } from '../sanskrit/transliterator';
import { devanagariToSlp1, siddhamUnicodeToSlp1, slp1ToIast } from '../transliterator';
import { foldCjkPhonetic, foldCjkVariant } from './cjkFold';

export type SearchScope = 'all' | 'dharani' | 'sutra';

export interface SearchFilterOptions {
  query: string;
  categoryId: DharaniCategoryId | 'all';
  onlyBookmarked: boolean;
  bookmarkedIds: Set<string>;
  sourceFilter: 'all' | 'global-12db' | 'cbeta-siddham' | 'gretil-sanskrit';
  searchScope?: SearchScope;
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

function normalizePreCjk(input: string): string {
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
    .replace(/[《》「」『』]/g, ' ')
    .replace(/\u3000/g, ' ')
    .replace(/(?<=\p{Script=Han})\s+(?=\p{Script=Han})/gu, '');
  return base
    .toLowerCase()
    .replace(/sh/g, 's')
    .replace(/w/g, 'v')
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/([a-z])\1+/g, '$1');
}

/**
 * Phonetic-folded normalisation (Traditional/Simplified + dhāraṇī transliteration homophones).
 */
export function normalizeSearchText(input: string): string {
  return foldCjkPhonetic(normalizePreCjk(input));
}

/**
 * Lexical Traditional/Simplified/Variant normalisation WITHOUT collapsing distinct homophones
 * (e.g. 地天 never collides with 威德天 / 的天 / 帝天).
 */
export function normalizeLiteralSearchText(input: string): string {
  return foldCjkVariant(normalizePreCjk(input));
}

export function relaxedCjkQueries(normQuery: string): string[] {
  const chars = Array.from(normQuery);
  if (chars.length < 3 || !chars.every((c) => /\p{Script=Han}/u.test(c))) return [];
  const out: string[] = [];
  for (let n = chars.length - 1; n >= 2; n--) out.push(chars.slice(0, n).join(''));
  return out;
}

interface IndexedEntryDoc {
  litTitle: string;
  litDbAndNo: string;
  litDeity: string;
  litVerses: string[];
  litFull: string;
  normTitle: string;
  normDbAndNo: string;
  normDeity: string;
  normVerses: string[];
  normFull: string;
}

interface IndexedCanonItem {
  raw: CanonCatalogItem;
  litTitle: string;
  litId: string;
  litHay: string;
  normTitle: string;
  normId: string;
  normHay: string;
}

const ENTRY_INDEX_CACHE = new WeakMap<DharaniEntry, IndexedEntryDoc>();
const SPEC12_LIT_CACHE = new WeakMap<Specialized12DbSearchRecord, { litHay: string; litTitle: string }>();

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

let loadedTaishoIndex: Array<TaishoMikkyoFileEntry & { normHay?: string; litHay?: string; litTitle?: string; normTitle?: string }> = [];
let loadedSpecialized12DbRecords: Specialized12DbSearchRecord[] = [];
let loadedCanonCatalogIndex: IndexedCanonItem[] = [];

export function hydrateCloudSearchIndex(payload: CloudSearchIndexPayload): void {
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

export function hydrateCanonCatalogForSearch(items: CanonCatalogItem[]): void {
  if (!Array.isArray(items) || items.length === 0) return;
  loadedCanonCatalogIndex = items.map((raw) => {
    const litTitle = normalizeLiteralSearchText(raw.title);
    const normTitle = normalizeSearchText(raw.title);
    const normId = raw.id.toLowerCase();
    const shortNum = raw.id.replace(/^[A-Z]+\d+n0*/i, '').toLowerCase();
    const litByline = normalizeLiteralSearchText(raw.byline || '');
    const normByline = normalizeSearchText(raw.byline || '');
    return {
      raw,
      litTitle,
      litId: normId,
      litHay: `${normId} ${shortNum} ${litTitle} ${litByline}`,
      normTitle,
      normId,
      normHay: `${normId} ${shortNum} ${normTitle} ${normByline}`,
    };
  });
}

function getIndexedEntryDoc(entry: DharaniEntry): IndexedEntryDoc {
  const cached = ENTRY_INDEX_CACHE.get(entry);
  if (cached) return cached;

  const titleRaw = `${entry.titleZh} ${entry.titleSanskritIast} ${entry.titleEnglish}`;
  const dbRaw = `${entry.taishoNo} ${entry.provenance.cbetaId || ''} ${entry.provenance.gretilFile || ''} ${entry.provenance.databaseId || ''} ${entry.provenance.databaseBadgeZh || ''}`;
  const deityRaw = `${entry.deityZh} ${entry.translatorZh} ${entry.sutraSourceZh}`;

  const litTitle = normalizeLiteralSearchText(titleRaw);
  const litDbAndNo = normalizeLiteralSearchText(dbRaw);
  const litDeity = normalizeLiteralSearchText(deityRaw);

  const normTitle = normalizeSearchText(titleRaw);
  const normDbAndNo = normalizeSearchText(dbRaw);
  const normDeity = normalizeSearchText(deityRaw);

  const litVerses: string[] = [];
  const normVerses: string[] = [];

  for (const v of entry.verses) {
    const zhOnly = isClassicalChineseOnlyVerse(v);
    const classicalDesc = Object.getOwnPropertyDescriptor(v, 'classicalTranslitZh');
    const classicalStr =
      classicalDesc && 'value' in classicalDesc ? String(classicalDesc.value || '') : '';
    const modernDesc = Object.getOwnPropertyDescriptor(v, 'modernPhoneticZh');
    const rawModern =
      modernDesc && 'value' in modernDesc ? String(modernDesc.value || '') : '';
    const modernStr = zhOnly
      ? ''
      : rawModern ||
        (!entry.provenance.databaseId && entry.categoryId !== 'gretil-canonical' && v.iast
          ? generateVerseChinesePhonetics(v.iast, false).modernPhoneticZh
          : '');
    const vRaw = zhOnly
      ? `${classicalStr} ${v.tangNoteZh || ''}`
      : `${v.iast} ${classicalStr} ${modernStr} ${v.siddhamOriginal || ''} ${v.devanagariOriginal || ''} ${v.diplomaticOriginal || ''}`;
    litVerses.push(normalizeLiteralSearchText(vRaw));
    normVerses.push(normalizeSearchText(vRaw));
  }

  const rawSnip = entry.provenance.rawSnippet || '';
  const litFull = `${litTitle} ${litDbAndNo} ${litDeity} ${litVerses.join(' ')} ${normalizeLiteralSearchText(rawSnip)}`;
  const normFull = `${normTitle} ${normDbAndNo} ${normDeity} ${normVerses.join(' ')} ${normalizeSearchText(rawSnip)}`;

  const doc: IndexedEntryDoc = {
    litTitle,
    litDbAndNo,
    litDeity,
    litVerses,
    litFull,
    normTitle,
    normDbAndNo,
    normDeity,
    normVerses,
    normFull,
  };
  ENTRY_INDEX_CACHE.set(entry, doc);
  return doc;
}

function tokensOf(q: string): string[] {
  return q.split(/\s+/).filter(Boolean);
}

function taishoLitHay(ts: TaishoMikkyoFileEntry & { litHay?: string }): string {
  if (!ts.litHay) {
    ts.litHay = normalizeLiteralSearchText(
      `${ts.id} ${ts.titleZh} ${ts.titleTrad} ${ts.translator} ${(ts.blockTitles || []).join(' ')} ${ts.sampleDharanis.join(' ')}`
    );
  }
  return ts.litHay;
}

function taishoNormHay(ts: TaishoMikkyoFileEntry & { normHay?: string }): string {
  return (
    ts.normHay ||
    normalizeSearchText(
      `${ts.id} ${ts.titleZh} ${ts.titleTrad} ${ts.translator} ${(ts.blockTitles || []).join(' ')} ${ts.sampleDharanis.join(' ')}`
    )
  );
}

function matchesHay(hay: string, q: string, tokens: string[]): boolean {
  if (!q) return true;
  return hay.includes(q) || (tokens.length > 1 && tokens.every((tk) => hay.includes(tk)));
}

interface ResolvedSearchPlan {
  litQuery: string;
  litTokens: string[];
  normQuery: string;
  normTokens: string[];
  allowPhonetic: boolean;
}

function resolveSearchPlan(entries: DharaniEntry[], rawQuery: string): ResolvedSearchPlan {
  const litFull = normalizeLiteralSearchText(rawQuery).replace(/\s+/g, ' ').trim();
  const normFull = normalizeSearchText(rawQuery).replace(/\s+/g, ' ').trim();
  if (!litFull && !normFull) {
    return {
      litQuery: '',
      litTokens: [],
      normQuery: '',
      normTokens: [],
      allowPhonetic: false,
    };
  }

  const hanCount = (rawQuery.match(/\p{Script=Han}/gu) || []).length;
  const looksLikeMantraTranslit =
    hanCount >= 7 || /^[唵嗡南曩怛娑梭吽阿摩囉啰鉢钵嚩缚]/u.test(rawQuery.trim());

  const litTokens = tokensOf(litFull);
  if (!looksLikeMantraTranslit) {
    const hasLiteralMatch =
      loadedCanonCatalogIndex.some((c) => matchesHay(c.litHay, litFull, litTokens)) ||
      loadedTaishoIndex.some((ts) => matchesHay(taishoLitHay(ts), litFull, litTokens)) ||
      entries.some((e) => matchesHay(getIndexedEntryDoc(e).litTitle, litFull, litTokens)) ||
      entries.some((e) => matchesHay(getIndexedEntryDoc(e).litFull, litFull, litTokens));
    if (hasLiteralMatch) {
      return {
        litQuery: litFull,
        litTokens,
        normQuery: normFull,
        normTokens: tokensOf(normFull),
        allowPhonetic: false,
      };
    }
  }
  if (false) {
    return {
      litQuery: litFull,
      litTokens,
      normQuery: normFull,
      normTokens: tokensOf(normFull),
      allowPhonetic: false,
    };
  }

  for (const q of [normFull, ...relaxedCjkQueries(normFull)]) {
    const tks = tokensOf(q);
    if (
      loadedCanonCatalogIndex.some((c) => matchesHay(c.normHay, q, tks)) ||
      loadedTaishoIndex.some((ts) => matchesHay(taishoNormHay(ts), q, tks)) ||
      entries.some((e) => matchesHay(getIndexedEntryDoc(e).normTitle, q, tks)) ||
      entries.some((e) => matchesHay(getIndexedEntryDoc(e).normFull, q, tks))
    ) {
      return {
        litQuery: litFull,
        litTokens,
        normQuery: q,
        normTokens: tks,
        allowPhonetic: true,
      };
    }
  }

  return {
    litQuery: litFull,
    litTokens,
    normQuery: normFull,
    normTokens: tokensOf(normFull),
    allowPhonetic: true,
  };
}

function scoreEntryAgainstPlan(
  entry: DharaniEntry,
  doc: IndexedEntryDoc,
  plan: ResolvedSearchPlan
): {
  matched: boolean;
  score: number;
  titleMatch: boolean;
  dbOrNoMatch: boolean;
  deityMatch: boolean;
  matchedVerse?: DharaniEntry['verses'][number];
} {
  const { litQuery, litTokens, normQuery, normTokens, allowPhonetic } = plan;

  const litFullHit = matchesHay(doc.litFull, litQuery, litTokens);
  const phonFullHit = allowPhonetic && !litFullHit && matchesHay(doc.normFull, normQuery, normTokens);

  if (!litFullHit && !phonFullHit) {
    return {
      matched: false,
      score: 0,
      titleMatch: false,
      dbOrNoMatch: false,
      deityMatch: false,
    };
  }

  const litTitleHit = litFullHit && matchesHay(doc.litTitle, litQuery, litTokens);
  const litDbHit = litFullHit && matchesHay(doc.litDbAndNo, litQuery, litTokens);
  const litDeityHit = litFullHit && matchesHay(doc.litDeity, litQuery, litTokens);

  const phonTitleHit = phonFullHit && matchesHay(doc.normTitle, normQuery, normTokens);
  const phonDbHit = phonFullHit && matchesHay(doc.normDbAndNo, normQuery, normTokens);
  const phonDeityHit = phonFullHit && matchesHay(doc.normDeity, normQuery, normTokens);

  const titleMatch = litTitleHit || phonTitleHit;
  const dbOrNoMatch = litDbHit || phonDbHit;
  const deityMatch = litDeityHit || phonDeityHit;

  let matchedVerse: DharaniEntry['verses'][number] | undefined;
  if (!titleMatch && !dbOrNoMatch && !deityMatch) {
    let vIdx = doc.litVerses.findIndex((vStr) => matchesHay(vStr, litQuery, litTokens));
    if (vIdx < 0 && allowPhonetic) {
      vIdx = doc.normVerses.findIndex((vStr) => matchesHay(vStr, normQuery, normTokens));
    }
    if (vIdx >= 0) {
      matchedVerse = entry.verses[vIdx];
    }
  }

  let score = litFullHit ? 50 : 15;
  if (doc.litTitle === litQuery) score += 240;
  else if (doc.litTitle.startsWith(litQuery)) score += 190;
  else if (litTitleHit) score += 150;
  else if (phonTitleHit) score += 85;

  if (litDbHit) score += 145;
  else if (phonDbHit) score += 80;

  if (litDeityHit) score += 95;
  else if (phonDeityHit) score += 45;

  if (matchedVerse) score += litFullHit ? 65 : 40;
  if (!entry.provenance.databaseId) score += 18;

  return {
    matched: true,
    score,
    titleMatch,
    dbOrNoMatch,
    deityMatch,
    matchedVerse,
  };
}

export function filterDharanis(
  entries: DharaniEntry[],
  options: SearchFilterOptions
): DharaniEntry[] {
  const scope = options.searchScope ?? 'all';
  const trimmed = options.query.trim();
  const plan = trimmed ? resolveSearchPlan(entries, trimmed) : null;

  const matchedWithScore: Array<{ entry: DharaniEntry; score: number }> = [];

  for (const entry of entries) {
    if (scope === 'dharani' && entry.verses.length === 0) {
      continue;
    }
    if (scope === 'sutra' && entry.verses.length > 0 && !entry.id.startsWith('canon-scripture-')) {
      continue;
    }

    if (options.categoryId !== 'all' && entry.categoryId !== options.categoryId) {
      continue;
    }

    if (options.onlyBookmarked && !options.bookmarkedIds.has(entry.id)) {
      continue;
    }

    if (options.sourceFilter === 'global-12db') {
      if (
        entry.provenance.sourceType !== 'GLOBAL-12DB' &&
        !entry.provenance.databaseId
      ) {
        continue;
      }
    } else if (options.sourceFilter === 'cbeta-siddham') {
      const hasSiddham =
        (entry.provenance.cbetaInterlinearTokens &&
          entry.provenance.cbetaInterlinearTokens.length > 0) ||
        Boolean(entry.provenance.cbetaId);
      if (!hasSiddham) continue;
    } else if (options.sourceFilter === 'gretil-sanskrit') {
      if (!entry.provenance.gretilFile && !entry.provenance.gretilRawUrl) continue;
    }

    if (!plan || (!plan.litQuery && !plan.normQuery)) {
      matchedWithScore.push({ entry, score: 0 });
      continue;
    }

    const doc = getIndexedEntryDoc(entry);
    const res = scoreEntryAgainstPlan(entry, doc, plan);
    if (res.matched) {
      matchedWithScore.push({ entry, score: res.score });
    }
  }

  if (plan && (plan.litQuery || plan.normQuery)) {
    matchedWithScore.sort((a, b) => b.score - a.score);
  }

  return matchedWithScore.map((x) => x.entry);
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
  const isZhOnly =
    !isPureSutra &&
    (isClassicalChineseOnlyEntry(entry) ||
      (previewVerse ? isClassicalChineseOnlyVerse(previewVerse) : false));

  if (isPureSutra) {
    return {
      kind: 'canon-entry',
      entry,
      titleZh: entry.titleZh,
      taishoNo: entry.taishoNo,
      matchTypeLabel: `${badgePrefix}经文原文直看（无陀罗尼）`,
      snippetPrimary: `原典全文：${sliceCp(entry.sutraSourceZh || entry.titleSanskritIast, 72)}`,
      snippetSecondary: `${entry.translatorZh} · 点击直接查看经文原文全文`,
    };
  }

  if (isZhOnly) {
    return {
      kind: 'canon-entry',
      entry,
      titleZh: entry.titleZh,
      taishoNo: entry.taishoNo,
      matchTypeLabel: `${badgePrefix}原典古汉陀罗尼（未附梵本）`,
      matchedVerseId: matchedVerse?.id,
      matchedVerseIndex: matchedVerse?.index,
      snippetPrimary: `古汉原载：${sliceCp(previewVerse?.classicalTranslitZh, 72)}`,
      snippetSecondary: `${entry.translatorZh || '古译'} · ${entry.taishoNo}（仅存古汉音译，不作梵文反推）`,
    };
  }

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
      : `原典全文：${sliceCp(entry.sutraSourceZh || entry.titleSanskritIast, 72)}`,
    snippetSecondary: previewVerse
      ? `古汉语：${sliceCp(previewVerse.classicalTranslitZh, 42)} · 梵音拼读：${sliceCp(previewVerse.modernPhoneticZh, 42)}`
      : `${entry.translatorZh} · 点击直接查看经文原文全文`,
  };
}

export function getSearchSuggestions(
  entries: DharaniEntry[],
  rawQuery: string,
  limit = 24,
  scope: SearchScope = 'all'
): SearchSuggestionItem[] {
  const trimmed = rawQuery.trim();
  const plan = trimmed ? resolveSearchPlan(entries, trimmed) : null;

  if (!plan || (!plan.litQuery && !plan.normQuery)) {
    const classicPicks =
      scope === 'sutra'
        ? []
        : entries
            .filter((e) => !e.provenance.databaseId && e.verses.length > 0)
            .slice(0, 6)
            .map((entry) => toCanonSuggestionItem(entry, '原文+多体陀罗尼'));

    const dbSeen = new Set<string>();
    const dbPicks: SearchSuggestionItem[] = [];
    if (scope !== 'sutra') {
      for (const entry of entries) {
        const dbId = entry.provenance.databaseId;
        if (dbId && !dbSeen.has(dbId) && entry.verses.length > 0) {
          dbSeen.add(dbId);
          dbPicks.push(toCanonSuggestionItem(entry, '12大国际权威梵典库'));
          if (dbPicks.length >= 8) break;
        }
      }
    }

    const sutraPicks: SearchSuggestionItem[] =
      scope === 'dharani'
        ? []
        : loadedCanonCatalogIndex
            .filter((c) => c.raw.collection === 'T' && (scope === 'sutra' || c.raw.dharani === 0))
            .slice(0, scope === 'sutra' ? 12 : 4)
            .map((c) => ({
              kind: 'canon-scripture' as const,
              canonItem: c.raw,
              titleZh: `《${c.raw.title}》`,
              taishoNo: c.raw.id,
              matchTypeLabel:
                c.raw.dharani > 0
                  ? `${c.raw.id} · 经典全文 + 陀罗尼 ${c.raw.dharani} 段`
                  : `${c.raw.id} · 纯经文原典（无陀罗尼）`,
              snippetPrimary: `${c.raw.byline || '藏经原典'} · 全文 ${(c.raw.chars || 0).toLocaleString()} 字`,
              snippetSecondary: '点击直接在主阅读器查看整卷经文原文',
            }));

    return [...classicPicks, ...sutraPicks, ...dbPicks].slice(0, limit);
  }

  const scoredEntries: Array<{
    score: number;
    entry: DharaniEntry;
    matchTypeLabel: string;
    matchedVerse?: DharaniEntry['verses'][number];
  }> = [];

  if (scope !== 'sutra') {
    for (const entry of entries) {
      if (entry.id.startsWith('canon-scripture-')) continue;
      if (scope === 'dharani' && entry.verses.length === 0) continue;

      const doc = getIndexedEntryDoc(entry);
      const res = scoreEntryAgainstPlan(entry, doc, plan);
      if (!res.matched) continue;

      const is12Db = Boolean(
        entry.provenance.databaseId || entry.provenance.sourceType === 'GLOBAL-12DB'
      );
      let matchTypeLabel = is12Db ? '原文 + 12库陀罗尼' : '原文 + 多体陀罗尼';
      if (entry.categoryId === 'gretil-canonical') {
        matchTypeLabel = `GRETIL 梵本原文+咒 (${entry.provenance.gretilFile || ''})`;
      } else if (res.dbOrNoMatch && !res.titleMatch) {
        matchTypeLabel = `经号/数据库匹配 (${entry.taishoNo})`;
      } else if (res.deityMatch && !res.titleMatch) {
        matchTypeLabel = `本尊/出处匹配 (${entry.deityZh.slice(0, 14)})`;
      } else if (res.matchedVerse && !res.titleMatch) {
        matchTypeLabel = `匹配第 ${res.matchedVerse.index} 句咒文`;
      }

      scoredEntries.push({
        score: res.score,
        entry,
        matchTypeLabel,
        matchedVerse: res.matchedVerse,
      });
    }
    scoredEntries.sort((a, b) => b.score - a.score);
  }

  const coveredCanonIds = new Set<string>();
  for (const se of scoredEntries) {
    if (se.entry.provenance.cbetaId) coveredCanonIds.add(se.entry.provenance.cbetaId);
    const m = se.entry.taishoNo.match(/^([A-Z]{1,2}\d{2,3}n[0-9A-Za-z]+)/);
    if (m) coveredCanonIds.add(m[1]);
  }

  const canonScriptureHits: Array<{ score: number; item: SearchSuggestionItem }> = [];
  const rawLower = trimmed.toLowerCase();
  for (const c of loadedCanonCatalogIndex) {
    if (scope === 'dharani' && c.raw.dharani <= 0) continue;
    if (scope !== 'sutra' && coveredCanonIds.has(c.raw.id)) continue;

    const litHit = matchesHay(c.litHay, plan.litQuery, plan.litTokens);
    const phonHit =
      plan.allowPhonetic && matchesHay(c.normHay, plan.normQuery, plan.normTokens);
    if (!litHit && !phonHit && !c.normId.includes(rawLower)) continue;

    let s = litHit ? 45 : 20;
    if (c.normId === rawLower) s += 260;
    else if (c.litTitle === plan.litQuery) s += 230;
    else if (c.litTitle.startsWith(plan.litQuery)) s += 180;
    else if (c.litTitle.includes(plan.litQuery)) s += 140;
    else if (phonHit && c.normTitle.includes(plan.normQuery)) s += 75;
    if (c.raw.collection === 'T') s += 25;

    const hasDh = c.raw.dharani > 0;
    canonScriptureHits.push({
      score: s,
      item: {
        kind: 'canon-scripture',
        canonItem: c.raw,
        titleZh: `《${c.raw.title}》`,
        taishoNo: c.raw.id,
        matchTypeLabel: hasDh
          ? `${c.raw.id} · 经文原文 + 古汉陀罗尼 ${c.raw.dharani} 段`
          : `${c.raw.id} · 经典全文（无陀罗尼）`,
        snippetPrimary: `${c.raw.byline || '藏经原典'} · 全文 ${(c.raw.chars || 0).toLocaleString()} 字`,
        snippetSecondary: hasDh
          ? `含 ${c.raw.dharani} 段原典陀罗尼：点击查看整卷经文与原典咒文`
          : '无陀罗尼纯经文：点击直接阅读整卷经文原文',
      },
    });
  }
  canonScriptureHits.sort((a, b) => b.score - a.score);

  if (scope === 'sutra') {
    return canonScriptureHits.slice(0, limit).map((x) => x.item);
  }

  const combinedRanked: Array<{ score: number; item: SearchSuggestionItem }> = [
    ...scoredEntries.map((se) => ({
      score: se.score,
      item: toCanonSuggestionItem(se.entry, se.matchTypeLabel, se.matchedVerse),
    })),
    ...canonScriptureHits,
  ];
  combinedRanked.sort((a, b) => b.score - a.score);

  const results: SearchSuggestionItem[] = combinedRanked
    .slice(0, Math.max(12, limit - 6))
    .map((x) => x.item);

  try {
    const existingTitles = new Set(results.map((r) => normalizeLiteralSearchText(r.titleZh)));
    let added12Db = 0;

    for (const hit of loadedSpecialized12DbRecords) {
      if (results.length >= limit || added12Db >= 4) break;
      if (hit.dbId === 'baseline') continue;
      let specCached = SPEC12_LIT_CACHE.get(hit);
      if (!specCached) {
        specCached = {
          litHay: normalizeLiteralSearchText(
            `${hit.id} ${hit.title} ${hit.subtitle} ${hit.sanskritIast || ''} ${hit.chineseText || ''} ${hit.tibetanText || ''}`
          ),
          litTitle: normalizeLiteralSearchText(hit.title),
        };
        SPEC12_LIT_CACHE.set(hit, specCached);
      }
      const matchesHit =
        matchesHay(specCached.litHay, plan.litQuery, plan.litTokens) ||
        (plan.allowPhonetic && matchesHay(hit.normHay, plan.normQuery, plan.normTokens));
      if (!matchesHit) continue;

      const litHitTitle = specCached.litTitle;
      if (existingTitles.has(litHitTitle)) continue;
      existingTitles.add(litHitTitle);

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
    if (scope === 'dharani' && ts.dharaniBlockCount <= 0) continue;
    const litHit = matchesHay(taishoLitHay(ts), plan.litQuery, plan.litTokens);
    const phonHit =
      plan.allowPhonetic && matchesHay(taishoNormHay(ts), plan.normQuery, plan.normTokens);
    if (!litHit && !phonHit) continue;

    if (ts.litTitle === undefined) {
      ts.litTitle = normalizeLiteralSearchText(`${ts.titleZh} ${ts.titleTrad || ''}`);
      ts.normTitle = normalizeSearchText(`${ts.titleZh} ${ts.titleTrad || ''}`);
    }
    const titleHit =
      ts.litTitle.includes(plan.litQuery) ||
      Boolean(plan.allowPhonetic && ts.normTitle!.includes(plan.normQuery));

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
