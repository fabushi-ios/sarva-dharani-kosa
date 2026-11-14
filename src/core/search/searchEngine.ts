import type { ActiveWorkspaceTab, DharaniCategoryId, DharaniEntry } from '../../types/kosaTypes';
import type { TaishoMikkyoFileEntry } from '../../data/kosa-generated/taishoMikkyoIndex';
import type { CanonCatalogItem } from '../canon/canonLibraryTypes';
import {
  resolveEntryBulei,
  resolveCanonItemBulei,
  type CbetaBuleiId,
} from '../canon/cbetaBulei';
import {
  hasEntryCompleteOriginalSanskrit,
  isClassicalChineseOnlyEntry,
} from '../provenance/fieldProvenance';
import { stripDiacritics } from '../sanskrit/transliterator';
import { devanagariToSlp1, siddhamUnicodeToSlp1, slp1ToIast } from '../transliterator';
import { foldCjkPhonetic, foldCjkVariant } from './cjkFold';

export type SearchScope =
  | 'all'
  | 'dharani'
  | 'dharani-sanskrit'
  | 'dharani-phonetic'
  | 'sutra'
  | 'sutra-text'
  | 'sutra-title'
  | 'notes';

export type DharaniEntryKind = 'dharani-sanskrit' | 'dharani-phonetic' | 'sutra-only';

export function classifyDharaniEntryKind(entry: DharaniEntry): DharaniEntryKind {
  if (entry.verses.length === 0) return 'sutra-only';
  if (hasEntryCompleteOriginalSanskrit(entry)) return 'dharani-sanskrit';
  return 'dharani-phonetic';
}

export interface SearchFilterOptions {
  query: string;
  categoryId: DharaniCategoryId | 'all';
  buleiId?: CbetaBuleiId | 'all';
  buleiSet?: Set<CbetaBuleiId>;
  scope?: SearchScope;
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

export interface ScopedEntryHit {
  entry: DharaniEntry;
  kind: DharaniEntryKind;
  buleiId: CbetaBuleiId;
  hitCount: number;
  matchedSnippets: string[];
  matchedVerseIndex?: number;
  score: number;
}

export interface DharaniNoteSearchHit {
  entry: DharaniEntry;
  buleiId: CbetaBuleiId;
  noteSourceLabel: string;
  snippet: string;
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

function precleanSearchInput(input: string): string {
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
  return base
    .toLowerCase()
    .replace(/sh/g, 's')
    .replace(/w/g, 'v')
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/([a-z])\1+/g, '$1');
}

export function normalizeLiteralSearchText(input: string): string {
  return foldCjkVariant(precleanSearchInput(input));
}

export function normalizeSearchText(input: string): string {
  return foldCjkPhonetic(precleanSearchInput(input));
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
  litNotes: string;
  litVerses: string[];
  litFull: string;
  phonTitle: string;
  phonDbAndNo: string;
  phonDeity: string;
  phonVerses: string[];
  phonFull: string;
}

interface IndexedCanonItem {
  raw: CanonCatalogItem;
  litTitle: string;
  litHay: string;
  phonTitle: string;
  phonHay: string;
  normId: string;
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

let loadedTaishoIndex: Array<TaishoMikkyoFileEntry & { normHay?: string; litHay?: string }> = [];
let loadedSpecialized12DbRecords: Specialized12DbSearchRecord[] = [];
let loadedCanonCatalogIndex: IndexedCanonItem[] = [];

export function hydrateCloudSearchIndex(payload: CloudSearchIndexPayload): void {
  if (Array.isArray(payload.entries)) {
    for (const item of payload.entries) {
      const phonFull = `${item.t} ${item.d} ${item.m} ${item.v.join(' ')}`;
      PREBUILT_ENTRY_INDEX_BY_ID.set(item.id, {
        litTitle: item.t,
        litDbAndNo: item.d,
        litDeity: item.m,
        litNotes: '',
        litVerses: item.v,
        litFull: phonFull,
        phonTitle: item.t,
        phonDbAndNo: item.d,
        phonDeity: item.m,
        phonVerses: item.v,
        phonFull,
      });
    }
  }
  if (Array.isArray(payload.specialized12DbRecords)) {
    loadedSpecialized12DbRecords = payload.specialized12DbRecords;
  }
}

export function hydrateTaishoSearchIndex(
  items: Array<TaishoMikkyoFileEntry & { normHay?: string; litHay?: string }>
): void {
  if (Array.isArray(items)) {
    loadedTaishoIndex = items;
  }
}

export function hydrateCanonCatalogForSearch(items: CanonCatalogItem[]): void {
  if (!Array.isArray(items) || items.length === 0) return;
  loadedCanonCatalogIndex = items.map((raw) => {
    const normId = raw.id.toLowerCase();
    const shortNum = raw.id.replace(/^[A-Z]+\d+n0*/i, '').toLowerCase();
    const litTitle = normalizeLiteralSearchText(raw.title);
    const litByline = normalizeLiteralSearchText(raw.byline || '');
    const phonTitle = normalizeSearchText(raw.title);
    const phonByline = normalizeSearchText(raw.byline || '');
    return {
      raw,
      normId,
      litTitle,
      litHay: `${normId} ${shortNum} ${litTitle} ${litByline}`,
      phonTitle,
      phonHay: `${normId} ${shortNum} ${phonTitle} ${phonByline}`,
    };
  });
}

function getIndexedEntryDoc(entry: DharaniEntry): IndexedEntryDoc {
  const cached = ENTRY_INDEX_CACHE.get(entry);
  if (cached) return cached;

  const chineseOnly = isClassicalChineseOnlyEntry(entry);

  const rawTitle = `${entry.titleZh} ${chineseOnly ? '' : entry.titleSanskritIast} ${entry.titleEnglish}`;
  const rawDbAndNo = `${entry.taishoNo} ${entry.provenance.cbetaId || ''} ${entry.provenance.gretilFile || ''} ${entry.provenance.databaseId || ''} ${entry.provenance.databaseBadgeZh || ''}`;
  const rawDeity = `${entry.deityZh} ${entry.translatorZh} ${entry.sutraSourceZh}`;
  const stoneNotes = (entry.provenance.cbetaInterlinearTokens || [])
    .map((t) => `${t.zh} ${t.iast || ''} ${t.siddham || ''}`)
    .join(' ');
  const verseNotes = entry.verses.map((v) => v.tangNoteZh || '').join(' ');
  const rawNotes = `${entry.provenance.manuscriptNotesZh || ''} ${entry.provenance.editionCitation || ''} ${stoneNotes} ${verseNotes}`;

  const litTitle = normalizeLiteralSearchText(rawTitle);
  const litDbAndNo = normalizeLiteralSearchText(rawDbAndNo);
  const litDeity = normalizeLiteralSearchText(rawDeity);
  const litNotes = normalizeLiteralSearchText(rawNotes);

  const phonTitle = normalizeSearchText(rawTitle);
  const phonDbAndNo = normalizeSearchText(rawDbAndNo);
  const phonDeity = normalizeSearchText(rawDeity);

  const litVerses: string[] = [];
  const phonVerses: string[] = [];

  for (const v of entry.verses) {
    const classicalDesc = Object.getOwnPropertyDescriptor(v, 'classicalTranslitZh');
    const classicalStr =
      classicalDesc && 'value' in classicalDesc ? String(classicalDesc.value || '') : '';
    if (chineseOnly) {
      const rawV = `${classicalStr} ${v.tangNoteZh || ''}`;
      litVerses.push(normalizeLiteralSearchText(rawV));
      phonVerses.push(normalizeSearchText(rawV));
    } else {
      const wordsDesc = Object.getOwnPropertyDescriptor(v, 'words');
      const eagerWords =
        wordsDesc && 'value' in wordsDesc && Array.isArray(wordsDesc.value) ? wordsDesc.value : [];
      const wordsStr = eagerWords
        .map(
          (w: { iast: string; transliterationZh: string; meaningZh: string }) =>
            `${w.iast} ${w.transliterationZh} ${w.meaningZh}`
        )
        .join(' ');
      const modernDesc = Object.getOwnPropertyDescriptor(v, 'modernPhoneticZh');
      const modernStr =
        modernDesc && 'value' in modernDesc ? String(modernDesc.value || '') : '';
      const rawV = `${v.iast} ${v.siddhamOriginal || ''} ${v.devanagariOriginal || ''} ${v.diplomaticOriginal || ''} ${classicalStr} ${modernStr} ${v.meaningZh} ${v.meaningEn} ${wordsStr}`;
      litVerses.push(normalizeLiteralSearchText(rawV));
      phonVerses.push(normalizeSearchText(rawV));
    }
  }

  const litFull = `${litTitle} ${litDbAndNo} ${litDeity} ${litNotes} ${litVerses.join(' ')}`;
  const phonFull = `${phonTitle} ${phonDbAndNo} ${phonDeity} ${phonVerses.join(' ')}`;

  const doc: IndexedEntryDoc = {
    litTitle,
    litDbAndNo,
    litDeity,
    litNotes,
    litVerses,
    litFull,
    phonTitle,
    phonDbAndNo,
    phonDeity,
    phonVerses,
    phonFull,
  };
  ENTRY_INDEX_CACHE.set(entry, doc);
  return doc;
}

function tokensOf(q: string): string[] {
  return q.split(/\s+/).filter(Boolean);
}

function matchesHay(hay: string, q: string, tokens: string[]): boolean {
  if (!q) return true;
  if (hay.includes(q)) return true;
  return tokens.length > 1 && tokens.every((tk) => hay.includes(tk));
}

function taishoLitHay(ts: TaishoMikkyoFileEntry & { litHay?: string }): string {
  if (!ts.litHay) {
    ts.litHay = normalizeLiteralSearchText(
      `${ts.id} ${ts.titleZh} ${ts.titleTrad} ${ts.translator} ${(ts.blockTitles || []).join(' ')} ${ts.sampleDharanis.join(' ')}`
    );
  }
  return ts.litHay;
}

function taishoPhonHay(ts: TaishoMikkyoFileEntry & { normHay?: string }): string {
  return (
    ts.normHay ||
    normalizeSearchText(
      `${ts.id} ${ts.titleZh} ${ts.titleTrad} ${ts.translator} ${(ts.blockTitles || []).join(' ')} ${ts.sampleDharanis.join(' ')}`
    )
  );
}

interface ResolvedQueryPlan {
  mode: 'literal' | 'phonetic';
  q: string;
  tokens: string[];
}

function resolveQueryPlan(rawEntries: DharaniEntry[], rawQuery: string): ResolvedQueryPlan {
  const entries = Array.isArray(rawEntries) ? rawEntries : [];
  const trimmed = rawQuery.trim();
  if (!trimmed) return { mode: 'literal', q: '', tokens: [] };

  const litQ = normalizeLiteralSearchText(trimmed).replace(/\s+/g, ' ').trim();
  const litTokens = tokensOf(litQ);

  if (
    litQ &&
    (entries.some((e) => matchesHay(getIndexedEntryDoc(e).litFull, litQ, litTokens)) ||
      loadedCanonCatalogIndex.some((c) => matchesHay(c.litHay, litQ, litTokens)) ||
      loadedTaishoIndex.some((ts) => matchesHay(taishoLitHay(ts), litQ, litTokens)))
  ) {
    return { mode: 'literal', q: litQ, tokens: litTokens };
  }

  const phonFull = normalizeSearchText(trimmed).replace(/\s+/g, ' ').trim();
  for (const pq of [phonFull, ...relaxedCjkQueries(phonFull)]) {
    const pTokens = tokensOf(pq);
    if (
      pq &&
      (entries.some((e) => matchesHay(getIndexedEntryDoc(e).phonFull, pq, pTokens)) ||
        loadedCanonCatalogIndex.some((c) => matchesHay(c.phonHay, pq, pTokens)) ||
        loadedTaishoIndex.some((ts) => matchesHay(taishoPhonHay(ts), pq, pTokens)))
    ) {
      return { mode: 'phonetic', q: pq, tokens: pTokens };
    }
  }

  return { mode: 'literal', q: litQ, tokens: litTokens };
}

function matchesEntryInScope(entry: DharaniEntry, scope: SearchScope | undefined): boolean {
  if (!scope || scope === 'all') return true;
  const kind = classifyDharaniEntryKind(entry);
  switch (scope) {
    case 'dharani':
      return kind !== 'sutra-only';
    case 'dharani-sanskrit':
      return kind === 'dharani-sanskrit';
    case 'dharani-phonetic':
      return kind === 'dharani-phonetic';
    case 'sutra':
    case 'sutra-text':
    case 'sutra-title':
      return kind === 'sutra-only' || Boolean(entry.provenance.cbetaId);
    case 'notes':
      return true;
  }
}

export function filterDharanis(
  entries: DharaniEntry[],
  options: SearchFilterOptions
): DharaniEntry[] {
  const plan = resolveQueryPlan(entries, options.query);

  return entries.filter((entry) => {
    if (!matchesEntryInScope(entry, options.scope)) return false;
    if (options.categoryId !== 'all' && entry.categoryId !== options.categoryId) return false;
    if (options.buleiId && options.buleiId !== 'all') {
      if (resolveEntryBulei(entry) !== options.buleiId) return false;
    }
    if (options.buleiSet && options.buleiSet.size > 0) {
      if (!options.buleiSet.has(resolveEntryBulei(entry))) return false;
    }
    if (options.onlyBookmarked && !options.bookmarkedIds.has(entry.id)) return false;

    if (options.sourceFilter === 'global-12db') {
      if (entry.provenance.sourceType !== 'GLOBAL-12DB' && !entry.provenance.databaseId) {
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

    if (!plan.q) return true;

    const doc = getIndexedEntryDoc(entry);
    if (options.scope === 'sutra-title') {
      return plan.mode === 'literal'
        ? matchesHay(doc.litTitle, plan.q, plan.tokens)
        : matchesHay(doc.phonTitle, plan.q, plan.tokens);
    }
    if (options.scope === 'notes') {
      return matchesHay(doc.litNotes, plan.q, plan.tokens);
    }
    return plan.mode === 'literal'
      ? matchesHay(doc.litFull, plan.q, plan.tokens)
      : matchesHay(doc.phonFull, plan.q, plan.tokens);
  });
}

function sliceCp(text: string | undefined | null, maxCodePoints: number): string {
  if (!text) return '';
  return Array.from(text).slice(0, maxCodePoints).join('');
}

export function searchEntriesByTab(
  entries: DharaniEntry[],
  rawQuery: string,
  tab: 'dharani-sanskrit' | 'dharani-phonetic' | 'sutra-title',
  buleiSet?: Set<CbetaBuleiId>,
  limit = 200
): ScopedEntryHit[] {
  const trimmed = rawQuery.trim();
  if (!trimmed) return [];

  const plan = resolveQueryPlan(entries, trimmed);
  const out: ScopedEntryHit[] = [];

  for (const entry of entries) {
    const kind = classifyDharaniEntryKind(entry);
    if (tab === 'dharani-sanskrit' && kind !== 'dharani-sanskrit') continue;
    if (tab === 'dharani-phonetic' && kind !== 'dharani-phonetic') continue;

    const buleiId = resolveEntryBulei(entry);
    if (buleiSet && buleiSet.size > 0 && !buleiSet.has(buleiId)) continue;

    const doc = getIndexedEntryDoc(entry);
    const titleHay = plan.mode === 'literal' ? doc.litTitle : doc.phonTitle;
    const fullHay = plan.mode === 'literal' ? doc.litFull : doc.phonFull;
    const versesHay = plan.mode === 'literal' ? doc.litVerses : doc.phonVerses;

    if (tab === 'sutra-title') {
      if (!matchesHay(titleHay, plan.q, plan.tokens)) continue;
    } else {
      if (!matchesHay(fullHay, plan.q, plan.tokens)) continue;
    }

    let score = 20;
    const titleMatch = matchesHay(titleHay, plan.q, plan.tokens);
    if (titleHay.startsWith(plan.q)) score += 130;
    else if (titleMatch) score += 95;

    const matchedSnippets: string[] = [];
    let firstMatchedVerseIdx: number | undefined;
    let hitCount = titleMatch ? 1 : 0;

    for (let i = 0; i < versesHay.length; i++) {
      if (matchesHay(versesHay[i], plan.q, plan.tokens)) {
        hitCount += 1;
        if (firstMatchedVerseIdx === undefined) firstMatchedVerseIdx = i;
        if (matchedSnippets.length < 2) {
          const v = entry.verses[i];
          if (kind === 'dharani-phonetic') {
            matchedSnippets.push(v.classicalTranslitZh || '');
          } else {
            matchedSnippets.push(
              `${v.iast}${v.classicalTranslitZh ? `  ｜  ${v.classicalTranslitZh}` : ''}`
            );
          }
        }
      }
    }

    if (matchedSnippets.length === 0 && entry.verses.length > 0) {
      const v0 = entry.verses[0];
      matchedSnippets.push(
        kind === 'dharani-phonetic'
          ? v0.classicalTranslitZh || entry.provenance.rawSnippet || ''
          : `${v0.iast}${v0.classicalTranslitZh ? `  ｜  ${v0.classicalTranslitZh}` : ''}`
      );
    } else if (matchedSnippets.length === 0) {
      matchedSnippets.push(entry.sutraSourceZh || entry.meritsAndSummaryZh.slice(0, 110));
    }

    if (firstMatchedVerseIdx !== undefined) score += 40;

    out.push({
      entry,
      kind,
      buleiId,
      hitCount: Math.max(1, hitCount),
      matchedSnippets,
      matchedVerseIndex: firstMatchedVerseIdx,
      score,
    });
  }

  out.sort((a, b) => b.score - a.score);
  return out.slice(0, limit);
}

export function searchDharaniNotes(
  entries: DharaniEntry[],
  rawQuery: string,
  buleiSet?: Set<CbetaBuleiId>,
  limit = 120
): DharaniNoteSearchHit[] {
  const trimmed = rawQuery.trim();
  if (!trimmed) return [];
  const litQ = normalizeLiteralSearchText(trimmed).replace(/\s+/g, ' ').trim();
  const tokens = tokensOf(litQ);
  if (!litQ) return [];

  const hits: DharaniNoteSearchHit[] = [];
  for (const entry of entries) {
    const buleiId = resolveEntryBulei(entry);
    if (buleiSet && buleiSet.size > 0 && !buleiSet.has(buleiId)) continue;

    let matchedNote = '';
    let noteLabel = '';
    for (const v of entry.verses) {
      if (v.tangNoteZh && matchesHay(normalizeLiteralSearchText(v.tangNoteZh), litQ, tokens)) {
        matchedNote = `${v.classicalTranslitZh ? `${v.classicalTranslitZh} — ` : ''}夾注：${v.tangNoteZh}`;
        noteLabel = `第 ${v.index} 句原典夾注`;
        break;
      }
    }

    if (!matchedNote && entry.provenance.cbetaInterlinearTokens?.length) {
      const tokStr = entry.provenance.cbetaInterlinearTokens
        .map((t) => `${t.siddham || ''} (${t.iast || ''}) = ${t.zh}`)
        .join(' · ');
      if (matchesHay(normalizeLiteralSearchText(`${entry.titleZh} ${tokStr}`), litQ, tokens)) {
        matchedNote = `原刻悉曇對音夾注：${sliceCp(tokStr, 140)}`;
        noteLabel = 'CBETA <cb:tt> 悉曇對音注';
      }
    }

    if (!matchedNote && entry.provenance.manuscriptNotesZh) {
      if (matchesHay(normalizeLiteralSearchText(entry.provenance.manuscriptNotesZh), litQ, tokens)) {
        matchedNote = entry.provenance.manuscriptNotesZh;
        noteLabel = '校勘題記';
      }
    }

    if (matchedNote) {
      hits.push({ entry, buleiId, noteSourceLabel: noteLabel, snippet: matchedNote });
      if (hits.length >= limit) break;
    }
  }
  return hits;
}

function toCanonSuggestionItem(
  entry: DharaniEntry,
  matchTypeLabel: string,
  matchedVerse?: DharaniEntry['verses'][number]
): SearchSuggestionItem {
  const previewVerse = matchedVerse || entry.verses[0];
  const kind = classifyDharaniEntryKind(entry);
  const buleiId = resolveEntryBulei(entry);
  const badgePrefix = entry.provenance.databaseBadgeZh ? `${entry.provenance.databaseBadgeZh} · ` : '';

  if (kind === 'sutra-only') {
    return {
      kind: 'canon-entry',
      entry,
      titleZh: entry.titleZh,
      taishoNo: entry.taishoNo,
      matchTypeLabel: `${badgePrefix}經文原典`,
      snippetPrimary: sliceCp(entry.sutraSourceZh || entry.meritsAndSummaryZh, 72),
      snippetSecondary: `${entry.translatorZh}`,
    };
  }

  if (kind === 'dharani-phonetic') {
    return {
      kind: 'canon-entry',
      entry,
      titleZh: entry.titleZh,
      taishoNo: entry.taishoNo,
      matchTypeLabel: `${badgePrefix}陀羅尼·梵音`,
      matchedVerseId: matchedVerse?.id,
      matchedVerseIndex: matchedVerse?.index,
      snippetPrimary: previewVerse
        ? `原典古漢音：${sliceCp(previewVerse.classicalTranslitZh, 72)}`
        : sliceCp(entry.sutraSourceZh, 72),
      snippetSecondary: `${entry.translatorZh} · 部類：${buleiId}`,
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
      ? `梵文原典：${sliceCp(previewVerse.iast, 72)}`
      : sliceCp(entry.sutraSourceZh || entry.titleSanskritIast, 72),
    snippetSecondary: previewVerse?.classicalTranslitZh
      ? `古漢音：${sliceCp(previewVerse.classicalTranslitZh, 48)}`
      : `${entry.translatorZh}`,
  };
}

export function getSearchSuggestions(
  entries: DharaniEntry[],
  rawQuery: string,
  limit = 24,
  scope: SearchScope = 'all'
): SearchSuggestionItem[] {
  const plan = rawQuery.trim()
    ? resolveQueryPlan(entries, rawQuery)
    : { mode: 'literal' as const, q: '', tokens: [] as string[] };
  const q = plan.q;
  const tokens = plan.tokens;

  if (!q) {
    const classicPicks = entries
      .filter((e) => !e.provenance.databaseId && matchesEntryInScope(e, scope))
      .slice(0, 6)
      .map((entry) => toCanonSuggestionItem(entry, '陀羅尼·梵文'));

    const dbSeen = new Set<string>();
    const dbPicks: SearchSuggestionItem[] = [];
    for (const entry of entries) {
      if (!matchesEntryInScope(entry, scope)) continue;
      const dbId = entry.provenance.databaseId;
      if (dbId && !dbSeen.has(dbId)) {
        dbSeen.add(dbId);
        dbPicks.push(
          toCanonSuggestionItem(
            entry,
            hasEntryCompleteOriginalSanskrit(entry) ? '陀羅尼·梵文' : '陀羅尼·梵音'
          )
        );
        if (dbPicks.length >= 8) break;
      }
    }

    const pureSutraPicks: SearchSuggestionItem[] =
      scope === 'dharani' || scope === 'dharani-sanskrit' || scope === 'dharani-phonetic'
        ? []
        : loadedCanonCatalogIndex
            .filter((c) => c.raw.collection === 'T' && c.raw.dharani === 0)
            .slice(0, 4)
            .map((c) => ({
              kind: 'canon-scripture' as const,
              canonItem: c.raw,
              titleZh: `《${c.raw.title}》`,
              taishoNo: c.raw.id,
              matchTypeLabel: `${c.raw.id} · 經文`,
              snippetPrimary: `${c.raw.byline || '藏經原典'} · 全文 ${(c.raw.chars || 0).toLocaleString()} 字`,
              snippetSecondary: `部類：${resolveCanonItemBulei(c.raw)}`,
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

  if (scope !== 'sutra' && scope !== 'sutra-text') {
    for (const entry of entries) {
      if (!matchesEntryInScope(entry, scope)) continue;
      const doc = getIndexedEntryDoc(entry);
      const fullHay = plan.mode === 'literal' ? doc.litFull : doc.phonFull;
      if (!matchesHay(fullHay, q, tokens)) continue;

      const titleHay = plan.mode === 'literal' ? doc.litTitle : doc.phonTitle;
      const dbHay = plan.mode === 'literal' ? doc.litDbAndNo : doc.phonDbAndNo;
      const deityHay = plan.mode === 'literal' ? doc.litDeity : doc.phonDeity;
      const versesHay = plan.mode === 'literal' ? doc.litVerses : doc.phonVerses;

      const is12Db = Boolean(entry.provenance.databaseId || entry.provenance.sourceType === 'GLOBAL-12DB');
      const titleMatch = matchesHay(titleHay, q, tokens);
      const dbOrNoMatch = matchesHay(dbHay, q, tokens);
      const deityMatch = deityHay.includes(q);

      if (scope === 'sutra-title' && !titleMatch) continue;

      let matchedVerse: DharaniEntry['verses'][number] | undefined;
      if (!titleMatch && !dbOrNoMatch && !deityMatch) {
        const vIdx = versesHay.findIndex((vStr) => matchesHay(vStr, q, tokens));
        if (vIdx >= 0) matchedVerse = entry.verses[vIdx];
      }

      let score = 20;
      if (titleHay.startsWith(q)) score += 120;
      else if (titleMatch) score += 90;
      if (dbOrNoMatch) score += 85;
      if (deityMatch) score += 55;
      if (matchedVerse) score += 35;
      if (is12Db && dbOrNoMatch) score += 30;

      const entryKind = classifyDharaniEntryKind(entry);
      let matchTypeLabel = entryKind === 'dharani-sanskrit' ? '陀羅尼·梵文' : '陀羅尼·梵音';
      if (matchedVerse && !titleMatch) {
        matchTypeLabel = `${matchTypeLabel}（第 ${matchedVerse.index} 句）`;
      }

      scoredCanon.push({ score, is12Db, entry, matchTypeLabel, matchedVerse });
    }
  }

  scoredCanon.sort((a, b) => b.score - a.score);
  const classicResults = scoredCanon.filter((x) => !x.is12Db);
  const db12CanonResults = scoredCanon.filter((x) => x.is12Db);

  const canonScriptureHits: Array<{ score: number; item: SearchSuggestionItem }> = [];
  if (scope === 'all' || scope === 'sutra' || scope === 'sutra-text' || scope === 'sutra-title') {
    const rawLower = rawQuery.trim().toLowerCase();
    for (const c of loadedCanonCatalogIndex) {
      const hay = plan.mode === 'literal' ? c.litHay : c.phonHay;
      const titleH = plan.mode === 'literal' ? c.litTitle : c.phonTitle;
      if (!matchesHay(hay, q, tokens) && !c.normId.includes(rawLower)) continue;
      let s = 30;
      if (c.normId === rawLower) s += 160;
      else if (titleH === q) s += 145;
      else if (titleH.startsWith(q)) s += 115;
      else if (titleH.includes(q)) s += 85;
      if (c.raw.collection === 'T') s += 20;

      const hasDh = c.raw.dharani > 0;
      canonScriptureHits.push({
        score: s,
        item: {
          kind: 'canon-scripture',
          canonItem: c.raw,
          titleZh: `《${c.raw.title}》`,
          taishoNo: c.raw.id,
          matchTypeLabel: hasDh ? `${c.raw.id} · 經文+咒` : `${c.raw.id} · 經文`,
          snippetPrimary: `${c.raw.byline || '藏經原典'} · 全文 ${(c.raw.chars || 0).toLocaleString()} 字`,
          snippetSecondary: hasDh ? `含 ${c.raw.dharani} 段陀羅尼` : '純經文原典',
        },
      });
    }
    canonScriptureHits.sort((a, b) => b.score - a.score);
  }

  const results: SearchSuggestionItem[] = [];
  let cIdx = 0;
  let dIdx = 0;
  let sIdx = 0;
  const maxMainSlots = Math.max(12, limit - 6);

  while (
    results.length < maxMainSlots &&
    (cIdx < classicResults.length || dIdx < db12CanonResults.length || sIdx < canonScriptureHits.length)
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

  if (scope === 'all' || scope === 'dharani' || scope === 'dharani-sanskrit') {
    try {
      const existingTitles = new Set(results.map((r) => normalizeSearchText(r.titleZh)));
      let added12Db = 0;
      for (const hit of loadedSpecialized12DbRecords) {
        if (results.length >= limit || added12Db >= 5) break;
        if (hit.dbId === 'baseline') continue;
        if (scope === 'dharani-sanskrit' && !hit.sanskritIast) continue;
        if (!matchesHay(hit.normHay, q, tokens)) continue;

        const normHitTitle = normalizeSearchText(hit.title);
        if (existingTitles.has(normHitTitle)) continue;
        existingTitles.add(normHitTitle);

        const dbMeta = DB_BADGE_MAP[hit.dbId] || {
          labelZh: `DB${hit.databaseNumber} · 國際梵典數據庫`,
          tab: 'hub' as ActiveWorkspaceTab,
        };

        const linkedEntry = entries.find(
          (e) =>
            e.id.includes(hit.id) ||
            (hit.canonicalRefs && hit.canonicalRefs.some((ref) => e.taishoNo.includes(ref)))
        );

        results.push({
          kind: linkedEntry ? 'canon-entry' : 'global-12db-hit',
          entry: linkedEntry,
          targetTab: dbMeta.tab,
          titleZh: hit.title,
          taishoNo: (hit.canonicalRefs && hit.canonicalRefs[0]) || hit.id,
          matchTypeLabel: dbMeta.labelZh,
          snippetPrimary: hit.sanskritIast ? `梵文原典：${sliceCp(hit.sanskritIast, 76)}` : sliceCp(hit.snippet, 76),
          snippetSecondary: `${hit.subtitle} · ${hit.chineseText || hit.tibetanText || sliceCp(hit.snippet, 48)}`,
        });
        added12Db++;
      }
    } catch {
      // ignore optional shard edge case
    }
  }

  if (scope === 'all' || scope === 'sutra' || scope === 'sutra-text' || scope === 'sutra-title') {
    const taishoHits: Array<{ titleHit: boolean; item: SearchSuggestionItem }> = [];
    for (const ts of loadedTaishoIndex) {
      const hay = plan.mode === 'literal' ? taishoLitHay(ts) : taishoPhonHay(ts);
      if (!matchesHay(hay, q, tokens)) continue;
      const titleHit = normalizeLiteralSearchText(`${ts.titleZh} ${ts.titleTrad || ''}`).includes(
        normalizeLiteralSearchText(rawQuery)
      );
      taishoHits.push({
        titleHit,
        item: {
          kind: 'taisho-scripture',
          taishoScriptureId: ts.id,
          titleZh: `【大正藏原典】${ts.titleZh}`,
          taishoNo: `${ts.id} (${ts.vol})`,
          matchTypeLabel:
            ts.dharaniBlockCount > 0
              ? `密教部 · 原文 + 真言 ${ts.dharaniBlockCount} 段`
              : `密教部 · 純漢文儀軌`,
          snippetPrimary: `譯者：${ts.translator}`,
          snippetSecondary: ts.sampleDharanis[0]
            ? `原典咒句：${sliceCp(ts.sampleDharanis[0], 72)}`
            : `CBETA 經號 ${ts.id}.xml 原文全文`,
        },
      });
    }
    taishoHits.sort((a, b) => Number(b.titleHit) - Number(a.titleHit));
    const reserved = Math.min(taishoHits.length, Math.max(3, Math.floor(limit / 5)));
    const head = results.slice(0, limit - reserved);
    return [...head, ...taishoHits.slice(0, limit - head.length).map((h) => h.item)];
  }

  return results.slice(0, limit);
}
