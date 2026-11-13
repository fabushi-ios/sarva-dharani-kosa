import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  buildReaderEntryFromCanonItem,
  filterCatalog,
} from '../../src/services/canon/canonLibraryService';
import {
  isClassicalChineseOnlyEntry,
  isClassicalChineseOnlyVerse,
} from '../../src/core/provenance/fieldProvenance';
import {
  filterDharanis,
  getSearchSuggestions,
  hydrateCanonCatalogForSearch,
  normalizeLiteralSearchText,
} from '../../src/core/search/searchEngine';
import { FIRST_SCREEN_CORPUS } from '../../src/data/firstScreenCorpus';
import { DharaniReader } from '../../src/components/reader/DharaniReader';
import type { CanonCatalogItem, CanonTextFile } from '../../src/core/canon/canonLibraryTypes';
import type { ScriptVisibilityConfig } from '../../src/types/kosaTypes';

const DEFAULT_SCRIPT_CONFIG: ScriptVisibilityConfig = {
  showSiddham: true,
  showDevanagari: true,
  showIast: true,
  showModernPhoneticZh: true,
  showPhoneticIastBracket: false,
  showClassicalZh: true,
  showIpa: true,
  showProsodyMeter: true,
  showMeaningZh: true,
  showMeaningEn: true,
  showWordGloss: true,
  showFullCombinedSummary: true,
  hideDerivedReference: false,
};

describe('Classical-Chinese-Only No-Reconstruction & Scoped Search (陀罗尼 vs 经文)', () => {
  it('never reverse-reconstructs Sanskrit IAST, Siddhaṃ, IPA, or akṣara-gate glosses on Chinese-only canon scriptures (e.g. T21n1286 堅牢地天儀軌)', () => {
    const item: CanonCatalogItem = {
      id: 'T21n1286',
      collection: 'T',
      vol: 'T21',
      title: '堅牢地天儀軌',
      byline: '唐 善無畏譯',
      chars: 1206,
      dharani: 1,
    };
    const canonText: CanonTextFile = {
      id: 'T21n1286',
      collection: 'T',
      vol: 'T21',
      title: '堅牢地天儀軌',
      byline: '唐 善無畏譯',
      url: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T21/T21n1286.xml',
      paragraphs: [['t', '爾時堅牢地天白佛言。']],
      dharani: [
        {
          text: '曩莫三曼多母馱南 唵 鉢羅 婆 囉怛 儞 設哩三曼多 阿馱阿馱 阿豆阿豆 比 里底毘比里底毘曳 莎訶',
        },
      ],
    };

    const entry = buildReaderEntryFromCanonItem(item, canonText, []);
    expect(entry.verses).toHaveLength(1);
    expect(entry.verses[0].iast).toBe('');
    expect(entry.verses[0].modernPhoneticZh).toBe('');
    expect(entry.verses[0].meaningZh).toBe('');
    expect(isClassicalChineseOnlyVerse(entry.verses[0])).toBe(true);
    expect(isClassicalChineseOnlyEntry(entry)).toBe(true);

    const html = renderToStaticMarkup(
      React.createElement(DharaniReader, {
        entry,
        scriptConfig: DEFAULT_SCRIPT_CONFIG,
        onScriptConfigChange: () => {},
        isBookmarked: false,
        onToggleBookmark: () => {},
        playbackState: {
          isPlaying: false,
          currentVerseIndex: null,
          currentSyllableIndex: null,
          currentSyllableInfo: null,
          currentSyllableClassicalZh: '',
          currentSyllableModernZh: '',
          syllableProgress: 0,
          verseProgress: 0,
          rate: 1.0,
          loopVerse: false,
          autoScroll: true,
          mode: 'neural-vits-48k',
          voice: 'male',
          omDroneActive: false,
          backendOnline: true,
          spriteCount: 612,
        },
        onPlayAllVerses: () => {},
        onStopPlayback: () => {},
        onPlaySingleVerse: () => {},
        onPlaySingleSyllable: () => {},
      })
    );

    expect(html).toContain('古汉音译原典模式');
    expect(html).toContain('曩莫三曼多母馱南');
    expect(html).not.toContain('◇ 重构参考');
    expect(html).not.toContain('◇ 拟译参考');
    expect(html).not.toContain('汇总·悉昙梵字');
    expect(html).not.toContain('汇总·梵文 IAST');
    expect(html).not.toContain('梵音讽诵本句');
    expect(html).not.toContain('归命娑字门');
  });

  it('prevents polyphonic homophone collisions (地天 != 威德天 != 的天) while keeping Traditional/Simplified equivalence', () => {
    expect(normalizeLiteralSearchText('堅牢地天儀軌')).toBe(
      normalizeLiteralSearchText('坚牢地天仪轨')
    );
    expect(normalizeLiteralSearchText('供養十二大威德天報恩品')).not.toContain(
      normalizeLiteralSearchText('地天')
    );

    const sampleCatalog: CanonCatalogItem[] = [
      {
        id: 'T21n1286',
        collection: 'T',
        vol: 'T21',
        title: '堅牢地天儀軌',
        byline: '唐 善無畏譯',
        chars: 1206,
        dharani: 1,
      },
      {
        id: 'T21n1297',
        collection: 'T',
        vol: 'T21',
        title: '供養十二大威德天報恩品',
        byline: '唐 不空譯',
        chars: 2843,
        dharani: 0,
      },
      {
        id: 'T08n0235',
        collection: 'T',
        vol: 'T08',
        title: '金剛般若波羅蜜經',
        byline: '姚秦 鳩摩羅什譯',
        chars: 5180,
        dharani: 0,
      },
    ];

    expect(filterCatalog(sampleCatalog, '地天').map((c) => c.id)).toEqual(['T21n1286']);
    expect(filterCatalog(sampleCatalog, '金刚经').map((c) => c.id)).toEqual(['T08n0235']);

    hydrateCanonCatalogForSearch(sampleCatalog);

    const dharaniOnly = getSearchSuggestions(FIRST_SCREEN_CORPUS, '金刚经', 10, 'dharani');
    expect(dharaniOnly.every((h) => h.canonItem?.dharani !== 0)).toBe(true);

    const sutraOnly = getSearchSuggestions(FIRST_SCREEN_CORPUS, '地天', 10, 'sutra');
    expect(sutraOnly.map((h) => h.taishoNo)).toEqual(['T21n1286']);

    const filteredDharani = filterDharanis(FIRST_SCREEN_CORPUS, {
      query: '',
      categoryId: 'all',
      onlyBookmarked: false,
      bookmarkedIds: new Set(),
      sourceFilter: 'all',
      searchScope: 'dharani',
    });
    expect(filteredDharani.every((e) => e.verses.length > 0)).toBe(true);
  });
});
