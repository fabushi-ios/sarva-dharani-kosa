import { pinyin } from 'pinyin-pro';
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

import { TRAD_TO_SIMP_SEARCH_MAP } from './tradSimp';

const COLLOQUIAL_ALIAS_MAP: Array<{ pattern: RegExp; expansion: string }> = [
  { pattern: /日光菩萨|日光遍照/g, expansion: 'suryaprabha 日光菩萨护持大悲神咒' },
  { pattern: /月光菩萨|月光遍照/g, expansion: 'candraprabha 月光菩萨护持大悲神咒' },
  { pattern: /嗡嘛呢呗美吽|嗡嘛呢叭咪吽|六字大明/g, expansion: 'mani padme 观自在 六字' },
  { pattern: /揭谛揭谛|波罗揭谛|心经咒/g, expansion: 'gate paragate prajnaparamita 般若心经' },
  { pattern: /绿度母|度母心咒|二十一度母/g, expansion: 'tarauttare tare tuttare 圣救度佛母 多罗' },
  { pattern: /白度母/g, expansion: 'tara ayuh punya 如意轮 救度' },
  { pattern: /往生咒|拔一切业障/g, expansion: 'sukhavati amrta 阿弥陀 拔一切业障根本得生净土' },
  { pattern: /大悲咒|千手千眼/g, expansion: 'nilakantha 千手千眼观世音菩萨广大圆满无碍大悲心陀罗尼' },
  { pattern: /楞严咒|首楞严/g, expansion: 'surangama sitatapatra 大佛顶首楞严' },
  { pattern: /尊胜咒|佛顶尊胜/g, expansion: 'usnisavijaya 佛顶尊胜陀罗尼' },
  { pattern: /宝箧印|一切如来心秘密/g, expansion: 'sarvatathagata karandamudra 一切如来心秘密全身舍利宝箧印陀罗尼' },
  { pattern: /大随求|随求即得|如意宝印/g, expansion: 'mahapratisara vipulagarbhe 普遍光明清净炽盛如意宝印心无能胜大明王大随求' },
  { pattern: /五护陀罗尼|五护经/g, expansion: 'pancaraksa mahapratisara mahamayuri mahasahasrapramardani mahasitavati mahamantranusarini' },
  { pattern: /准提咒|准提神咒/g, expansion: 'cundi cale cule 七俱胝佛母准提大明陀罗尼' },
  { pattern: /药师咒|药师灌顶/g, expansion: 'bhaisajya 药师琉璃光如来' },
  { pattern: /秽迹金刚|乌枢沙摩|乌刍瑟摩/g, expansion: 'ucchusma 秽迹金刚禁百变法 乌枢沙摩' },
  { pattern: /孔雀明王/g, expansion: 'mahamayuri mayurakrante 佛母大孔雀明王' },
  { pattern: /光明真言|大灌顶光/g, expansion: 'amogha vairocana 不空罥索毗卢遮那佛大灌顶光真言' },
  { pattern: /黄财神|财宝天王|瞻巴拉|毗沙门/g, expansion: 'jambhala vaisravana vasudhara 宝藏神 财源 毗沙门' },
  { pattern: /雨宝陀罗尼|持世菩萨|财源天母/g, expansion: 'vasudhara 雨宝 持世 财源' },
  { pattern: /宝楼阁|大宝广博楼阁/g, expansion: 'vipulavimana 宝楼阁善住秘密陀罗尼' },
  { pattern: /金刚摧碎|坏相金刚/g, expansion: 'vajravidarana 金刚摧碎陀罗尼' },
  { pattern: /不动佛|阿閦佛|阿閦如来/g, expansion: 'aksobhya 不动如来 阿閦' },
  { pattern: /智炬如来|破地狱/g, expansion: 'jnanolka 智炬如来 破地狱' },
  { pattern: /白伞盖/g, expansion: 'sitatapatra 大白伞盖' },
  { pattern: /文殊心咒|五字真言|八字文殊/g, expansion: 'arapacana manjusri abhavira 文殊师利' },
  { pattern: /不动明王/g, expansion: 'acala candamaharosana 不动尊' },
  { pattern: /摩利支天|具光佛母/g, expansion: 'marici 摩利支' },
  { pattern: /叶衣佛母|叶衣观音/g, expansion: 'parnasavari 叶衣' },
  { pattern: /伽耶特黎|太阳神咒|吠陀母咒/g, expansion: 'gayatri savitur tat savitur varenyam 梨俱吠陀' },
  { pattern: /大死胜咒|湿婆长寿咒|三目神咒/g, expansion: 'mahamrtyunjaya tryambakam yajamahe 湿婆' },
  { pattern: /湿婆|五字圣咒|嗡那玛希瓦亚/g, expansion: 'siva sivaya pancaksara rudra aghora' },
  { pattern: /毗湿奴|那罗延|克里希纳|黑天|罗摩/g, expansion: 'visnu narayana vasudevaya krsna rama narsimha' },
  { pattern: /难近母|杜尔迦|九字真言|十慧母|时母|卡莉/g, expansion: 'durga camundaye navarna mahavidya kali sri vidya' },
  { pattern: /象头神|伽内什|欢喜天/g, expansion: 'ganapati ganesa vakratunda' },
  { pattern: /吉祥天女|辩才天女|妙音天女/g, expansion: 'mahalaksmi srisukta sarasvati vagvadini' },
  { pattern: /九曜|星宿|行星咒|宿曜/g, expansion: 'navagraha grahamatrka surya candra 炽盛光' },
  { pattern: /耆那|五敬礼咒/g, expansion: 'namokara pancanamaskara arham arihantanam' },
  { pattern: /奥义书|平安咒|商蒂/g, expansion: 'upanisad santi pavamana purnamadah' },
  { pattern: /娑婆诃|梭哈|娑诃/g, expansion: 'svaha' },
  { pattern: /南无|那摩|曩谟/g, expansion: 'namo namah' },
];

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
 * Removes interlinear dhāraṇī annotations — clause numbers and phonetic notes such as
 * (一) [二合] （引） — so a mantra typed with or without them matches the canonical text.
 */
export function stripInlineDharaniNotes(text: string): string {
  return (text || '').replace(/[(（\[【][一二三四五六七八九十百〇零廿卅\d引二合半音去上入重轻聲声]{1,6}[)）\]】]/g, '');
}

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
  const base = stripDiacritics(raw.normalize('NFKC'));
  let out = '';
  for (const ch of base) {
    out += TRAD_TO_SIMP_SEARCH_MAP[ch] || ch;
  }
  out = out
    .replace(/\bswaha\b/g, 'svaha')
    .replace(/\bnamaha\b/g, 'namah')
    .replace(/\baum\b/g, 'om')
    .replace(/\bhreem\b/g, 'hrim')
    .replace(/\bkleem\b/g, 'klim')
    .replace(/\bshree\b/g, 'sri')
    .replace(/\bshri\b/g, 'sri');
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

function buildQueryVariantsAndTokens(rawQuery: string): {
  normQuery: string;
  tokens: string[];
  aliasTerms: string[];
} {
  const normQuery = normalizeSearchText(rawQuery.trim());
  const tokens = normQuery.split(/\s+/).filter(Boolean);
  const aliasTerms: string[] = [];
  for (const rule of COLLOQUIAL_ALIAS_MAP) {
    if (rule.pattern.test(normQuery)) {
      aliasTerms.push(...normalizeSearchText(rule.expansion).split(/\s+/).filter(Boolean));
    }
    rule.pattern.lastIndex = 0;
  }
  return { normQuery, tokens, aliasTerms };
}

function matchesDoc(
  doc: IndexedEntryDoc,
  normQuery: string,
  tokens: string[],
  aliasTerms: string[]
): boolean {
  if (!normQuery) return true;
  if (doc.normFull.includes(normQuery)) return true;
  if (tokens.length > 1 && tokens.every((tk) => doc.normFull.includes(tk))) {
    return true;
  }
  if (aliasTerms.length > 0 && aliasTerms.some((term) => doc.normFull.includes(term))) {
    return true;
  }
  return matchesTitleByPinyin(doc, normQuery);
}

/**
 * Generic homophone fallback (no per-dhāraṇī alias lists): a Chinese query also matches
 * any title whose toneless pinyin contains the query's pinyin. Handles mis-typed or
 * spoken-form names (帝天 ≈ 地天, 准提 ≈ 准胝) and variant characters (陁/陀) uniformly.
 * Generic genre words (神咒/真言/陀罗尼…) are dropped from the query so 「X神咒」 finds
 * 「X陁羅尼」.
 */
const GENRE_WORDS_RE = /(神咒|心咒|明咒|咒语|真言|陀罗尼|陁罗尼|陀羅尼|陁羅尼|仪轨|儀軌|咒|呪|经|經)/g;
const QUERY_PINYIN_CACHE = new Map<string, string>();
const TITLE_PINYIN_CACHE = new WeakMap<IndexedEntryDoc, string>();

function cjkPinyinKey(text: string): string {
  const cjk = (text.match(/[\u3400-\u9FFF\uF900-\uFAFF]+/g) || []).join(' ');
  if (!cjk) return '';
  return ' ' + pinyin(cjk, { toneType: 'none', type: 'array', v: true }).filter((x) => x.trim()).join(' ') + ' ';
}

function queryPinyinKey(normQuery: string): string {
  let key = QUERY_PINYIN_CACHE.get(normQuery);
  if (key === undefined) {
    const core = normQuery.replace(GENRE_WORDS_RE, '');
    const n = (core.match(/[\u3400-\u9FFF\uF900-\uFAFF]/g) || []).length;
    key = n >= 2 ? cjkPinyinKey(core) : '';
    QUERY_PINYIN_CACHE.set(normQuery, key);
  }
  return key;
}

export function matchesTitleByPinyin(doc: IndexedEntryDoc, normQuery: string): boolean {
  const qk = queryPinyinKey(normQuery);
  if (!qk) return false;
  let tk = TITLE_PINYIN_CACHE.get(doc);
  if (tk === undefined) {
    tk = cjkPinyinKey(doc.normTitle);
    TITLE_PINYIN_CACHE.set(doc, tk);
  }
  if (tk.includes(qk)) return true;
  // Reordered compounds (帝释天 ↔ 天帝释): ≥3 syllables, every one present in the title.
  const qs = qk.trim().split(' ');
  if (qs.length < 3) return false;
  const ts = new Set(tk.trim().split(' '));
  return qs.every((syl) => ts.has(syl));
}

export function filterDharanis(
  entries: DharaniEntry[],
  options: SearchFilterOptions
): DharaniEntry[] {
  const { normQuery, tokens, aliasTerms } = buildQueryVariantsAndTokens(options.query);

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
    return matchesDoc(doc, normQuery, tokens, aliasTerms);
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
  const { normQuery: q, tokens, aliasTerms } = buildQueryVariantsAndTokens(rawQuery);

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
    if (!matchesDoc(doc, q, tokens, aliasTerms)) {
      continue;
    }

    const is12Db = Boolean(
      entry.provenance.databaseId || entry.provenance.sourceType === 'GLOBAL-12DB'
    );

    const titleMatch =
      doc.normTitle.includes(q) ||
      matchesTitleByPinyin(doc, q) ||
      (tokens.length > 1 && tokens.every((tk) => doc.normTitle.includes(tk))) ||
      (aliasTerms.length > 0 && aliasTerms.some((term) => doc.normTitle.includes(term)));
    const dbOrNoMatch =
      doc.normDbAndNo.includes(q) ||
      (tokens.length > 1 && tokens.every((tk) => doc.normDbAndNo.includes(tk)));
    const deityMatch =
      doc.normDeity.includes(q) ||
      (aliasTerms.length > 0 && aliasTerms.some((term) => doc.normDeity.includes(term)));

    let matchedVerse: DharaniEntry['verses'][number] | undefined;
    if (!titleMatch && !dbOrNoMatch && !deityMatch) {
      const vIdx = doc.normVerses.findIndex(
        (vStr) =>
          vStr.includes(q) ||
          (tokens.length > 1 && tokens.every((tk) => vStr.includes(tk))) ||
          (aliasTerms.length > 0 && aliasTerms.some((term) => vStr.includes(term)))
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
        (tokens.length > 1 && tokens.every((tk) => hit.normHay.includes(tk))) ||
        (aliasTerms.length > 0 && aliasTerms.some((term) => hit.normHay.includes(term)));
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

  // Also include Taishō Esoteric Canon XML Scripture matches
  for (const ts of loadedTaishoIndex) {
    if (results.length >= limit) break;
    const hay =
      ts.normHay ||
      normalizeSearchText(
        stripInlineDharaniNotes(
        `${ts.id} ${ts.titleZh} ${ts.titleTrad} ${ts.translator} ${(ts.blockTitles || []).join(' ')} ${ts.sampleDharanis.join(' ')}`
        )
      );
    const qNoNotes = normalizeSearchText(stripInlineDharaniNotes(rawQuery));
    const matchesTaisho =
      hay.includes(q) ||
      (qNoNotes.length > 0 && hay.replace(/\s+/g, '').includes(qNoNotes.replace(/\s+/g, ''))) ||
      (tokens.length > 1 && tokens.every((tk) => hay.includes(tk))) ||
      (aliasTerms.length > 0 && aliasTerms.some((term) => hay.includes(term))) ||
      matchesTitleByPinyin(
        { normTitle: normalizeSearchText(`${ts.titleZh} ${ts.titleTrad || ''}`) } as IndexedEntryDoc,
        q
      );
    if (matchesTaisho) {
      results.push({
        kind: 'taisho-scripture',
        taishoScriptureId: ts.id,
        titleZh: `【大正藏原典】${ts.titleZh}`,
        taishoNo: `${ts.id} (${ts.vol})`,
        matchTypeLabel: `大正藏密教部原典 · 含真言 ${ts.dharaniBlockCount} 段`,
        snippetPrimary: `译者：${ts.translator} · 点击查看 CBETA TEI-P5 原典全部真言`,
        snippetSecondary: ts.sampleDharanis[0]
          ? `原典咒句：${sliceCp(ts.sampleDharanis[0], 72)}...`
          : `CBETA 经号 ${ts.id}.xml`,
      });
    }
  }

  return results;
}
