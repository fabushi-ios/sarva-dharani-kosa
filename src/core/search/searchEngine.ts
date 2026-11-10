import type { DharaniCategoryId, DharaniEntry } from '../../types/kosaTypes';
import { stripDiacritics } from '../sanskrit/transliterator';
import { TAISHO_MIKKYO_FILE_INDEX } from '../../data/kosa-generated/taishoMikkyoIndex';

export interface SearchFilterOptions {
  query: string;
  categoryId: DharaniCategoryId | 'all';
  onlyBookmarked: boolean;
  bookmarkedIds: Set<string>;
  sourceFilter: 'all' | 'cbeta-siddham' | 'gretil-sanskrit';
}

export interface SearchSuggestionItem {
  kind: 'canon-entry' | 'taisho-scripture';
  entry?: DharaniEntry;
  taishoScriptureId?: string;
  titleZh: string;
  taishoNo: string;
  matchTypeLabel: string;
  matchedVerseId?: string;
  matchedVerseIndex?: number;
  snippetPrimary: string;
  snippetSecondary: string;
}

const TRAD_TO_SIMP_SEARCH_MAP: Record<string, string> = {
  毘: '毗', 盧: '卢', 變: '变', 經: '经', 說: '说', 誦: '诵', 攝: '摄',
  蓮: '莲', 華: '华', 會: '会', 攞: '罗', 廣: '广', 儀: '仪', 軌: '轨',
  養: '养', 羅: '罗', 標: '标', 幟: '帜', 龍: '龙', 記: '记', 隨: '随',
  門: '门', 頂: '顶', 勝: '胜', 薩: '萨', 觀: '观', 聖: '圣', 礙: '碍',
  呪: '咒', 剛: '刚', 輪: '轮', 寶: '宝', 篋: '箧', 樓: '楼', 閣: '阁',
  祕: '秘', 藥: '药', 師: '师', 灌: '灌', 無: '无', 壽: '寿', 決: '决',
  準: '准', 葉: '叶', 羂: '罥', 馬: '马', 頭: '头', 穢: '秽', 跡: '迹',
  烏: '乌', 樞: '枢', 軍: '军', 閻: '阎', 愛: '爱', 動: '动', 歡: '欢',
  雙: '双', 堅: '坚', 辯: '辩', 熾: '炽', 災: '灾', 難: '难', 滅: '灭',
  業: '业', 淨: '净', 彌: '弥', 閦: '閼', 虛: '虚', 聞: '闻', 賢: '贤',
  釋: '释', 鉢: '钵', 囉: '啰', 謨: '谟', 馱: '驮', 滿: '满', 願: '愿',
  莊: '庄', 嚴: '严', 傘: '伞', 蓋: '盖', 迴: '回', 壞: '坏', 諸: '诸',
  眾: '众', 衆: '众', 離: '离', 惡: '恶', 獄: '狱', 幢: '幢', 瓔: '璎',
};

export function normalizeSearchText(input: string): string {
  const base = stripDiacritics(input);
  let out = '';
  for (const ch of base) {
    out += TRAD_TO_SIMP_SEARCH_MAP[ch] || ch;
  }
  return out;
}

export function filterDharanis(
  entries: DharaniEntry[],
  options: SearchFilterOptions
): DharaniEntry[] {
  const normalizedQuery = normalizeSearchText(options.query.trim());

  return entries.filter((entry) => {
    if (options.categoryId !== 'all' && entry.categoryId !== options.categoryId) {
      return false;
    }

    if (options.onlyBookmarked && !options.bookmarkedIds.has(entry.id)) {
      return false;
    }

    if (options.sourceFilter === 'cbeta-siddham') {
      const hasSiddham =
        (entry.provenance.cbetaInterlinearTokens &&
          entry.provenance.cbetaInterlinearTokens.length > 0) ||
        Boolean(entry.provenance.cbetaId);
      if (!hasSiddham) return false;
    } else if (options.sourceFilter === 'gretil-sanskrit') {
      if (!entry.provenance.gretilFile) return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchableHeader = normalizeSearchText(
      [
        entry.titleZh,
        entry.titleSanskritIast,
        entry.titleEnglish,
        entry.taishoNo,
        entry.deityZh,
        entry.translatorZh,
        entry.sutraSourceZh,
        entry.meritsAndSummaryZh,
        entry.provenance.gretilFile || '',
        entry.provenance.cbetaId || '',
      ].join(' ')
    );

    if (searchableHeader.includes(normalizedQuery)) {
      return true;
    }

    return entry.verses.some((v) => {
      const verseText = normalizeSearchText(
        `${v.iast} ${v.classicalTranslitZh} ${v.modernPhoneticZh} ${v.meaningZh} ${v.meaningEn}`
      );
      if (verseText.includes(normalizedQuery)) return true;
      return v.words.some((w) =>
        normalizeSearchText(`${w.iast} ${w.transliterationZh} ${w.meaningZh}`).includes(
          normalizedQuery
        )
      );
    });
  });
}

/**
 * Generates instant selectable autocomplete results below the header search input,
 * searching across all 250+ authentic Sanskrit entries (Curated Multi-Script + World Mantras Encyclopedia +
 * 200 GRETIL Sanskrit Manuscripts) + 614 Taishō Esoteric Canon Scriptures.
 */
export function getSearchSuggestions(
  entries: DharaniEntry[],
  rawQuery: string,
  limit = 16
): SearchSuggestionItem[] {
  const q = normalizeSearchText(rawQuery.trim());

  if (!q) {
    return entries.slice(0, 12).map((entry) => {
      const firstVerse = entry.verses[0];
      return {
        kind: 'canon-entry',
        entry,
        titleZh: entry.titleZh,
        taishoNo: entry.taishoNo,
        matchTypeLabel: '热门核心经咒',
        matchedVerseId: firstVerse?.id,
        matchedVerseIndex: firstVerse?.index,
        snippetPrimary: firstVerse
          ? `梵音：${firstVerse.iast.slice(0, 65)}`
          : entry.titleSanskritIast,
        snippetSecondary: firstVerse
          ? `古汉语：${firstVerse.classicalTranslitZh.slice(0, 42)} · 拼读：${firstVerse.modernPhoneticZh.slice(0, 42)}`
          : entry.deityZh,
      };
    });
  }

  const results: SearchSuggestionItem[] = [];

  for (const entry of entries) {
    if (results.length >= limit) break;

    const titleMatch = normalizeSearchText(
      `${entry.titleZh} ${entry.titleSanskritIast} ${entry.titleEnglish}`
    ).includes(q);
    const taishoMatch = normalizeSearchText(
      `${entry.taishoNo} ${entry.provenance.cbetaId || ''} ${entry.provenance.gretilFile || ''}`
    ).includes(q);
    const deityMatch = normalizeSearchText(
      `${entry.deityZh} ${entry.translatorZh} ${entry.meritsAndSummaryZh}`
    ).includes(q);

    const matchedVerse = entry.verses.find((v) => {
      const vStr = normalizeSearchText(
        `${v.iast} ${v.classicalTranslitZh} ${v.modernPhoneticZh} ${v.meaningZh} ${v.meaningEn}`
      );
      if (vStr.includes(q)) return true;
      return v.words.some((w) =>
        normalizeSearchText(`${w.iast} ${w.transliterationZh} ${w.meaningZh}`).includes(q)
      );
    });

    if (titleMatch || taishoMatch || deityMatch || matchedVerse) {
      const v = matchedVerse || entry.verses[0];
      let matchTypeLabel = '四体梵音对照库';
      if (entry.categoryId === 'gretil-canonical') {
        matchTypeLabel = `GRETIL 梵文贝叶经 (${entry.provenance.gretilFile || ''})`;
      } else if (taishoMatch && !titleMatch) {
        matchTypeLabel = `藏经号 (${entry.taishoNo})`;
      } else if (deityMatch && !titleMatch) {
        matchTypeLabel = `本尊/别名匹配 (${entry.deityZh.slice(0, 14)})`;
      } else if (matchedVerse && !titleMatch) {
        matchTypeLabel = `匹配第 ${matchedVerse.index} 句梵音/古汉语`;
      }

      results.push({
        kind: 'canon-entry',
        entry,
        titleZh: entry.titleZh,
        taishoNo: entry.taishoNo,
        matchTypeLabel,
        matchedVerseId: v?.id,
        matchedVerseIndex: v?.index,
        snippetPrimary: v ? `梵文：${v.iast.slice(0, 72)}` : entry.titleSanskritIast,
        snippetSecondary: v
          ? `古汉语：${v.classicalTranslitZh.slice(0, 40)} | 梵音拼读：${v.modernPhoneticZh.slice(0, 40)}`
          : entry.meritsAndSummaryZh.slice(0, 60),
      });
    }
  }

  for (const ts of TAISHO_MIKKYO_FILE_INDEX) {
    if (results.length >= limit) break;
    const hay = normalizeSearchText(
      `${ts.id} ${ts.titleZh} ${ts.titleTrad} ${ts.translator} ${ts.sampleDharanis.join(' ')}`
    );
    if (hay.includes(q)) {
      results.push({
        kind: 'taisho-scripture',
        taishoScriptureId: ts.id,
        titleZh: `【大正藏原典】${ts.titleZh}`,
        taishoNo: `${ts.id} (${ts.vol})`,
        matchTypeLabel: `大正藏密教部原典 · 含真言 ${ts.dharaniBlockCount} 段`,
        snippetPrimary: `译者：${ts.translator} · 点击查看 CBETA TEI-P5 原典全部真言`,
        snippetSecondary: ts.sampleDharanis[0]
          ? `原典咒句：${ts.sampleDharanis[0].slice(0, 72)}...`
          : `CBETA 经号 ${ts.id}.xml`,
      });
    }
  }

  return results;
}
