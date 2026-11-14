import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TWELVE_DATABASES_ADAPTED_DHARANIS } from '../../src/data/kosa-corpus/twelve-databases-adapter';
import {
  hasEntryCompleteOriginalSanskrit,
  isClassicalChineseOnlyEntry,
} from '../../src/core/provenance/fieldProvenance';
import {
  classifyDharaniEntryKind,
  normalizeLiteralSearchText,
  searchEntriesByTab,
} from '../../src/core/search/searchEngine';
import {
  getRelatedQuerySuggestions,
  resolveCanonIdBulei,
} from '../../src/core/canon/cbetaBulei';
import { FullDharaniSummaryCard } from '../../src/components/reader/FullDharaniSummaryCard';
import { VerseBlock } from '../../src/components/reader/VerseBlock';
import type { ScriptVisibilityConfig } from '../../src/types/kosaTypes';

const ALL_ON_CONFIG: ScriptVisibilityConfig = {
  showFullCombinedSummary: true,
  showDevanagari: true,
  showSiddham: true,
  showIast: true,
  showIpa: true,
  showProsodyMeter: true,
  showClassicalZh: true,
  showModernPhoneticZh: true,
  showPhoneticIastBracket: false,
  showMeaningZh: true,
  showMeaningEn: true,
  showWordGloss: true,
  hideDerivedReference: false,
};

describe('CBETA 部類、陀羅尼梵文/梵音嚴格區分與純古文零反推校驗', () => {
  it('accurately separates complete-Sanskrit Fangshan entries from partial-note Chinese-only entries (e.g. 地天陁羅尼)', () => {
    const prthiviEntry = TWELVE_DATABASES_ADAPTED_DHARANIS.find((e) =>
      e.id.includes('pF28p0248b1801')
    );
    expect(prthiviEntry).toBeDefined();
    expect(isClassicalChineseOnlyEntry(prthiviEntry!)).toBe(true);
    expect(hasEntryCompleteOriginalSanskrit(prthiviEntry!)).toBe(false);
    expect(classifyDharaniEntryKind(prthiviEntry!)).toBe('dharani-phonetic');

    const roll1Complete = TWELVE_DATABASES_ADAPTED_DHARANIS.find((e) =>
      e.id.includes('pF28p0003a0201')
    );
    expect(roll1Complete).toBeDefined();
    expect(hasEntryCompleteOriginalSanskrit(roll1Complete!)).toBe(true);
    expect(isClassicalChineseOnlyEntry(roll1Complete!)).toBe(false);
    expect(classifyDharaniEntryKind(roll1Complete!)).toBe('dharani-sanskrit');

    const summaryHtml = renderToStaticMarkup(
      React.createElement(FullDharaniSummaryCard, {
        entry: prthiviEntry!,
        config: ALL_ON_CONFIG,
        onToggleBracketIast: () => {},
      })
    );
    expect(summaryHtml).toContain('曩莫三滿多沒䭾南');
    expect(summaryHtml).toContain('體');
    expect(summaryHtml).not.toContain('pṛthavye');
    expect(summaryHtml).not.toContain('昔日他维耶');
    expect(summaryHtml).not.toContain('战斗佛藏');
    expect(summaryHtml).not.toContain('Fight + O oblation');

    const verseHtml = renderToStaticMarkup(
      React.createElement(VerseBlock, {
        verse: prthiviEntry!.verses[2],
        config: ALL_ON_CONFIG,
        isVersePlaying: false,
        activeSyllableIndex: null,
        verseProgress: 0,
        autoScroll: false,
        onPlayVerse: () => {},
        onPlaySyllable: () => {},
      })
    );
    expect(verseHtml).toContain('畢㗚體吠曳');
    expect(verseHtml).not.toContain('pṛthavye');
    expect(verseHtml).not.toContain('昔日他维耶');
    expect(verseHtml).not.toContain('战斗佛藏');
  });

  it('normalizes Traditional/Simplified variants without homophone false positives on 地天', () => {
    expect(normalizeLiteralSearchText('堅牢地天儀軌')).toContain(
      normalizeLiteralSearchText('坚牢地天')
    );
    expect(normalizeLiteralSearchText('供養十二大威德天報恩品')).not.toContain(
      normalizeLiteralSearchText('地天')
    );

    const phoHits = searchEntriesByTab(
      TWELVE_DATABASES_ADAPTED_DHARANIS,
      '地天',
      'dharani-phonetic'
    );
    expect(phoHits.some((h) => h.entry.titleZh.includes('地天'))).toBe(true);
  });

  it('maps CBETA canon IDs to official CBETA 部類 and provides synonym suggestions', () => {
    expect(resolveCanonIdBulei('T01n0005', '佛般泥洹經')).toBe('agama');
    expect(resolveCanonIdBulei('T08n0251', '般若波羅蜜多心經')).toBe('prajna');
    expect(resolveCanonIdBulei('T21n1286', '堅牢地天儀軌')).toBe('mikkyo');
    expect(resolveCanonIdBulei('F28n1071', '釋教最上乘秘密藏陁羅尼集')).toBe('mikkyo');
    expect(resolveCanonIdBulei('J27nB194', '昭覺丈雪醉禪師語錄')).toBe('chan');

    const syns = getRelatedQuerySuggestions('地天');
    expect(syns).toContain('堅牢地神');
    expect(syns).toContain('堅牢地天');
  });
});
