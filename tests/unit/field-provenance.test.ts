import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import type { DharaniEntry, DharaniVerse, ScriptVisibilityConfig } from '../../src/types/kosaTypes';
import {
  formatModernPhoneticWithIastOption,
  generateVerseChinesePhonetics,
} from '../../src/core/sanskrit/phoneticMapper';
import {
  matchIastOriginalAksharaFlags,
  resolveEffectiveVerseFields,
  resolveEffectiveWordGlosses,
  resolveVerseFieldOrigin,
  resolveVerseMixedSegments,
  summarizeEntryFieldProvenance,
} from '../../src/core/provenance/fieldProvenance';
import { ProvenanceBadge } from '../../src/components/common/ProvenanceBadge';
import { VerseBlock } from '../../src/components/reader/VerseBlock';
import { FullDharaniSummaryCard } from '../../src/components/reader/FullDharaniSummaryCard';
import { BUILTIN_DHARANI_CORPUS } from '../../src/data/index';
import {
  FIRST_SCREEN_CORPUS,
  attachLazyWordsToEntries,
} from '../../src/data/firstScreenCorpus';

describe('Database Original Preservation & Derived-Reference Provenance (fieldProvenance)', () => {
  it('strictly preserves database modernPhoneticZh when present and never overwrites it with algorithmic output', () => {
    const iast = 'oṃ maṇi padme hūṃ';
    const customDbPhonetic = '唵 嘛呢 叭咪 吽（传承专有注音）';
    const algorithmicPhonetic = generateVerseChinesePhonetics(iast, false).modernPhoneticZh;
    expect(customDbPhonetic).not.toBe(algorithmicPhonetic);

    const dbVerse: DharaniVerse = {
      id: 'test-db-orig-1',
      index: 1,
      iast,
      classicalTranslitZh: '唵 摩抳 钵讷铭 吽',
      modernPhoneticZh: customDbPhonetic,
      meaningZh: '嗡！莲华摩尼宝珠，吽！',
      meaningEn: 'Oṃ! O Jewel in the Lotus, Hūṃ!',
      fieldSources: {
        iast: 'db-original',
        classicalTranslitZh: 'db-original',
        modernPhoneticZh: 'db-original',
        meaningZh: 'db-original',
        meaningEn: 'db-original',
        siddham: 'derived-reference',
        devanagari: 'derived-reference',
        ipa: 'derived-reference',
        prosody: 'derived-reference',
        words: 'derived-reference',
      },
    };

    const resolvedPlain = resolveEffectiveVerseFields(dbVerse, false);
    expect(resolvedPlain.modernPhoneticOrigin).toBe('db-original');
    expect(resolvedPlain.modernPhoneticZh).toBe(customDbPhonetic);
    expect(resolvedPlain.classicalTranslitOrigin).toBe('db-original');
    expect(resolvedPlain.classicalTranslitZh).toBe('唵 摩抳 钵讷铭 吽');

    // Enabling (IAST) brackets must keep the original DB Chinese tokens intact rather than regenerating
    const dbVerseTokenAligned: DharaniVerse = {
      ...dbVerse,
      modernPhoneticZh: '嗡 嘛尼 呗美 吽',
    };
    const resolvedWithBrackets = resolveEffectiveVerseFields(dbVerseTokenAligned, true);
    expect(resolvedWithBrackets.modernPhoneticOrigin).toBe('db-original');
    expect(resolvedWithBrackets.modernPhoneticZh).toBe(
      '嗡(oṃ) · 嘛尼(maṇi) · 呗美(padme) · 吽(hūṃ)'
    );
    expect(
      formatModernPhoneticWithIastOption(
        '嗡(oṃ) · 嘛尼(maṇi) · 呗美(padme) · 吽(hūṃ)',
        iast,
        false
      )
    ).toBe('嗡 嘛尼 呗美 吽');
  });

  it('falls back to algorithmic processing ONLY when database lacks the field and marks it as derived-reference', () => {
    const iast = 'gate gate pāragate pārasaṃgate bodhi svāhā';
    const gretilStyleVerse: DharaniVerse = {
      id: 'test-derived-1',
      index: 1,
      iast,
      classicalTranslitZh: '',
      modernPhoneticZh: '',
      meaningZh: '出自哥廷根 GRETIL 原典《般若心经》第 1 句，请参校上列梵文。',
      meaningEn: 'Canonical Sanskrit verse 1 from GRETIL edition.',
      siddhamOriginal: '𑖐𑖝𑖸 𑖐𑖝𑖸',
      fieldSources: {
        iast: 'db-original',
        siddham: 'db-original',
        devanagari: 'derived-reference',
        modernPhoneticZh: 'derived-reference',
        classicalTranslitZh: 'derived-reference',
        ipa: 'derived-reference',
        prosody: 'derived-reference',
        meaningZh: 'derived-reference',
        meaningEn: 'derived-reference',
        words: 'derived-reference',
      },
    };

    const resolved = resolveEffectiveVerseFields(gretilStyleVerse, false);
    const expectedPhon = generateVerseChinesePhonetics(iast, false);

    expect(resolved.iastOrigin).toBe('db-original');
    expect(resolved.siddhamOrigin).toBe('db-original');
    expect(resolved.siddhamText).toBe('𑖐𑖝𑖸 𑖐𑖝𑖸');

    expect(resolved.modernPhoneticOrigin).toBe('derived-reference');
    expect(resolved.modernPhoneticZh).toBe(expectedPhon.modernPhoneticZh);

    expect(resolved.classicalTranslitOrigin).toBe('derived-reference');
    expect(resolved.classicalTranslitZh).toBe(expectedPhon.classicalTranslitZh);

    expect(resolved.devanagariOrigin).toBe('derived-reference');
    expect(resolved.ipaOrigin).toBe('derived-reference');

    // Placeholder provenance note is replaced with lexicon reference translation & marked derived-reference
    expect(resolved.meaningZhOrigin).toBe('derived-reference');
    expect(resolved.meaningZh).not.toContain('请参校上列梵文');
    expect(resolved.meaningZh.length).toBeGreaterThan(0);

    const glossRes = resolveEffectiveWordGlosses(gretilStyleVerse);
    expect(glossRes.sectionState).toBe('derived-reference');
    expect(glossRes.words.length).toBeGreaterThan(0);
    expect(glossRes.words.every((w) => w.origin === 'derived-reference')).toBe(true);
  });

  it('distinguishes curated DB originals, mixed witnesses, and derived layers across BUILTIN_DHARANI_CORPUS and all 12 Global Databases', () => {
    // 1. Mahāpratisarā full 445 verses: IAST is GRETIL original, phonetics & translations are derived-reference
    const mahapratisara = BUILTIN_DHARANI_CORPUS.find(
      (e) => e.id === 'mahapratisara-mahavidyarajni-complete'
    );
    expect(mahapratisara).toBeDefined();
    const mpSummary = summarizeEntryFieldProvenance(mahapratisara!);
    expect(mpSummary.byField.iast).toBe('db-original');
    expect(mpSummary.byField.modernPhoneticZh).toBe('derived-reference');
    expect(mpSummary.byField.classicalTranslitZh).toBe('derived-reference');
    expect(mpSummary.byField.meaningZh).toBe('derived-reference');

    // 2. Curated CBETA #SD-* Siddhaṃ entries:
    //    - ten-small-01-cintamanicakra (T20n1080, 89 #SD-* glyphs): siddham, iast, classicalTranslitZh are db-original;
    //      modernPhoneticZh is honestly marked derived-reference while preserving hand-crafted pronunciation verbatim.
    const cintamani = BUILTIN_DHARANI_CORPUS.find((e) => e.id === 'ten-small-01-cintamanicakra');
    expect(cintamani).toBeDefined();
    const cinSummary = summarizeEntryFieldProvenance(cintamani!);
    expect(cinSummary.byField.iast).toBe('db-original');
    expect(cinSummary.byField.siddham).toBe('db-original');
    expect(cinSummary.byField.classicalTranslitZh).toBe('db-original');
    expect(cinSummary.byField.modernPhoneticZh).toBe('derived-reference');
    expect(cinSummary.byField.ipa).toBe('derived-reference');
    expect(cintamani!.verses[0].siddhamOriginal).toBeTruthy();

    //    - Nīlakaṇṭha (T20n1113B, 334 #SD-*) & Uṣṇīṣavijaya (T19n0974B, 470 #SD-*): all verses siddham db-original
    const nilakantha = BUILTIN_DHARANI_CORPUS.find(
      (e) => e.id === 'nilakantha-mahakaruna-dharani'
    )!;
    expect(summarizeEntryFieldProvenance(nilakantha).byField.siddham).toBe('db-original');
    const usnisa = BUILTIN_DHARANI_CORPUS.find((e) => e.id === 'usnisavijaya-dharani')!;
    expect(summarizeEntryFieldProvenance(usnisa).byField.siddham).toBe('db-original');

    //    - Komyo Shingon (T19n1002 + T20n1092): root mantra komyo-2 has 23 #SD-* glyphs (db-original),
    //      while komyo-1 & komyo-3 from T20n1092 are derived-reference -> entry summary is 'mixed'
    const komyo = BUILTIN_DHARANI_CORPUS.find(
      (e) => e.id === 'amoghapasa-vairocana-mahamudra'
    )!;
    expect(resolveVerseFieldOrigin(komyo.verses[0], 'siddham')).toBe('derived-reference');
    expect(resolveVerseFieldOrigin(komyo.verses[1], 'siddham')).toBe('db-original');
    expect(summarizeEntryFieldProvenance(komyo).byField.siddham).toBe('mixed');

    // 3. World Mantras Encyclopedia:
    //    - Chinese Tripitaka mantra (T19n0945): classicalTranslitZh is db-original, modernPhoneticZh is derived-reference
    const surangamaHeart = BUILTIN_DHARANI_CORPUS.find(
      (e) => e.id === 'surangama-five-heart-mantra'
    )!;
    expect(resolveVerseFieldOrigin(surangamaHeart.verses[0], 'classicalTranslitZh')).toBe(
      'db-original'
    );
    expect(resolveVerseFieldOrigin(surangamaHeart.verses[0], 'modernPhoneticZh')).toBe(
      'derived-reference'
    );

    //    - Non-Tripitaka Jaina/Vedic mantra: classicalTranslitZh is honestly marked derived-reference
    //      while preserving its scholarly Chinese phonetic transcription verbatim
    const jainaEntry = BUILTIN_DHARANI_CORPUS.find(
      (e) => e.id === 'jaina-namokara-patanjali-yoga-mantras'
    )!;
    expect(resolveVerseFieldOrigin(jainaEntry.verses[0], 'classicalTranslitZh')).toBe(
      'derived-reference'
    );
    const effJaina = resolveEffectiveVerseFields(jainaEntry.verses[0], false);
    expect(effJaina.classicalTranslitOrigin).toBe('derived-reference');
    expect(effJaina.classicalTranslitZh).toContain('曩莫 阿啰诃毗也');

    // 4. DB1 Fangshan Stone Sutras (tri-state <cb:tt> #SD-* Siddhaṃ provenance):
    //    (a) User-reported partial <cb:tt> entry F28n1071_pF28p0141a2301:
    //        8 of 26 verses carry stone-carved #SD-* Siddhaṃ tokens ('mixed'), 18 are Chinese-only ('derived-reference')
    const fangshan141 = BUILTIN_DHARANI_CORPUS.find(
      (e) => e.id === 'db1-fangshan-F28n1071_pF28p0141a2301'
    )!;
    expect(fangshan141).toBeDefined();
    expect(fangshan141.provenance.cbetaInterlinearTokens?.length).toBe(8);
    const f141Summary = summarizeEntryFieldProvenance(fangshan141);
    expect(f141Summary.byField.classicalTranslitZh).toBe('db-original');
    expect(f141Summary.byField.siddham).toBe('mixed');
    expect(f141Summary.byField.iast).toBe('mixed');
    expect(f141Summary.byField.devanagari).toBe('derived-reference');
    expect(f141Summary.byField.modernPhoneticZh).toBe('derived-reference');
    expect(
      fangshan141.verses.filter((v) => resolveVerseFieldOrigin(v, 'siddham') === 'mixed').length
    ).toBe(8);
    expect(
      fangshan141.verses.filter(
        (v) => resolveVerseFieldOrigin(v, 'siddham') === 'derived-reference'
      ).length
    ).toBe(18);

    //    (b) 100% <cb:tt> Fangshan entry F28n1071_pF28p0003a0201: siddham & iast are pure db-original
    const fangshan003 = BUILTIN_DHARANI_CORPUS.find(
      (e) => e.id === 'db1-fangshan-F28n1071_pF28p0003a0201'
    )!;
    expect(fangshan003).toBeDefined();
    const f003Summary = summarizeEntryFieldProvenance(fangshan003);
    expect(f003Summary.byField.siddham).toBe('db-original');
    expect(f003Summary.byField.iast).toBe('db-original');
    expect(f003Summary.byField.classicalTranslitZh).toBe('db-original');

    //    (c) Chinese-only Fangshan entry (no <cb:tt> in CBETA F-canon): siddham & iast are derived-reference
    const fangshanChineseOnly = BUILTIN_DHARANI_CORPUS.find(
      (e) =>
        e.provenance.databaseId === 'db1_fangshan' &&
        (!e.provenance.cbetaInterlinearTokens || e.provenance.cbetaInterlinearTokens.length === 0)
    )!;
    expect(fangshanChineseOnly).toBeDefined();
    expect(summarizeEntryFieldProvenance(fangshanChineseOnly).byField.siddham).toBe(
      'derived-reference'
    );
    expect(summarizeEntryFieldProvenance(fangshanChineseOnly).byField.iast).toBe(
      'derived-reference'
    );
    expect(summarizeEntryFieldProvenance(fangshanChineseOnly).byField.classicalTranslitZh).toBe(
      'db-original'
    );

    // 5. DB2 CBETA Taishō: Chinese-only dhāraṇīs mark IAST as derived-reference; Arapacana & T84 mark Siddhaṃ+IAST as db-original
    const db2Lotus = BUILTIN_DHARANI_CORPUS.find((e) => e.id === 'db2-taisho-T09n0262_001')!;
    expect(db2Lotus).toBeDefined();
    expect(summarizeEntryFieldProvenance(db2Lotus).byField.classicalTranslitZh).toBe('db-original');
    expect(summarizeEntryFieldProvenance(db2Lotus).byField.iast).toBe('derived-reference');
    const db2Arapacana = BUILTIN_DHARANI_CORPUS.find(
      (e) => e.id === 'db2-taisho-T10n0293_arapacana_42'
    )!;
    expect(db2Arapacana).toBeDefined();
    expect(summarizeEntryFieldProvenance(db2Arapacana).byField.siddham).toBe('db-original');
    expect(summarizeEntryFieldProvenance(db2Arapacana).byField.iast).toBe('db-original');

    // 6. DB3 DSBC: 15 numeral-only sections (like sec-1 "(१)") stay derived-reference,
    //    while all 85 dual-edition sections with real Devanāgarī paragraphs mark devanagari as db-original!
    const db3NumeralOnly = BUILTIN_DHARANI_CORPUS.find((e) => e.id === 'db3-dsbc-sec-1')!;
    expect(db3NumeralOnly).toBeDefined();
    expect(summarizeEntryFieldProvenance(db3NumeralOnly).byField.devanagari).toBe(
      'derived-reference'
    );
    const db3DualSections = BUILTIN_DHARANI_CORPUS.filter(
      (e) =>
        e.id.startsWith('db3-dsbc-sec-') &&
        summarizeEntryFieldProvenance(e).byField.devanagari === 'db-original'
    );
    expect(db3DualSections.length).toBe(85);
    expect(summarizeEntryFieldProvenance(db3DualSections[0]).byField.iast).toBe('db-original');
    expect(db3DualSections[0].verses[0].devanagariOriginal).toMatch(/\p{Script=Devanagari}/u);

    // 7. DB8 TLB: Heart Sutra (vid=1175) has Sanskrit witness (db-original), while reconstructed vid=207 & Tibetan-only Kanjur vid=691 mark IAST as derived-reference
    const db8Heart = BUILTIN_DHARANI_CORPUS.find((e) => e.id === 'db8-polyglotta-vid-1175')!;
    expect(db8Heart).toBeDefined();
    expect(summarizeEntryFieldProvenance(db8Heart).byField.iast).toBe('db-original');
    const db8Reconstructed = BUILTIN_DHARANI_CORPUS.find(
      (e) => e.id === 'db8-polyglotta-vid-207'
    )!;
    expect(db8Reconstructed).toBeDefined();
    expect(summarizeEntryFieldProvenance(db8Reconstructed).byField.iast).toBe('derived-reference');
    const db8KanjurOnly = BUILTIN_DHARANI_CORPUS.find(
      (e) => e.id === 'db8-polyglotta-vid-691'
    )!;
    expect(db8KanjurOnly).toBeDefined();
    expect(summarizeEntryFieldProvenance(db8KanjurOnly).byField.iast).toBe('derived-reference');
    expect(db8KanjurOnly.verses[0].diplomaticOriginal).toBeTruthy();

    // 8. DB9 RKTS, DB10 NIBS & DB11 CEToM preserve original diplomatic witnesses
    const db9Entries = BUILTIN_DHARANI_CORPUS.filter(
      (e) => e.provenance.databaseId === 'db9_rkts'
    );
    expect(db9Entries.length).toBeGreaterThan(0);
    expect(db9Entries[0].verses[0].diplomaticOriginal).toBeTruthy();
    expect(resolveVerseFieldOrigin(db9Entries[0].verses[0], 'iast')).toBe('derived-reference');

    const db10Entries = BUILTIN_DHARANI_CORPUS.filter(
      (e) => e.provenance.databaseId === 'db10_all_nibs'
    );
    expect(db10Entries.length).toBeGreaterThan(0);
    expect(db10Entries.some((e) => Boolean(e.verses[0].diplomaticOriginal))).toBe(true);

    const db11CetomEntries = BUILTIN_DHARANI_CORPUS.filter(
      (e) =>
        e.provenance.databaseId === 'db11_idp_dunhuang' && e.id.startsWith('db11-cetom-')
    );
    expect(db11CetomEntries.length).toBe(13);
    expect(
      db11CetomEntries.filter((e) => Boolean(e.verses[0].diplomaticOriginal)).length
    ).toBe(11);
    expect(
      db11CetomEntries
        .filter((e) => !e.verses[0].diplomaticOriginal)
        .every((e) => summarizeEntryFieldProvenance(e).byField.iast === 'derived-reference')
    ).toBe(true);
    expect(
      db11CetomEntries.some((e) =>
        e.verses.some((v) => resolveVerseFieldOrigin(v, 'iast') === 'mixed')
      )
    ).toBe(true);
  });

  it('renders dual-color mixed ProvenanceBadge and 1:1 matching content segments across all mixed verses and summaries', () => {
    // 1. ProvenanceBadge splits mixed label into .prov-part-orig + .prov-part-sep + .prov-part-ref
    const badgeDefaultHtml = renderToStaticMarkup(
      React.createElement(ProvenanceBadge, { state: 'mixed', compact: true })
    );
    expect(badgeDefaultHtml).toContain('prov-origin-badge is-mixed');
    expect(badgeDefaultHtml).toContain('<span class="prov-part-orig">● 原载</span>');
    expect(badgeDefaultHtml).toContain('<span class="prov-part-sep">+</span>');
    expect(badgeDefaultHtml).toContain('<span class="prov-part-ref">◇ 参考</span>');

    const badgeCustomHtml = renderToStaticMarkup(
      React.createElement(ProvenanceBadge, {
        state: 'mixed',
        compact: true,
        customLabel: '◐ 原載(8組<cb:tt>)+重構參考',
      })
    );
    expect(badgeCustomHtml).toContain('prov-part-orig');
    expect(badgeCustomHtml).toContain('● 原載(8組&lt;cb:tt&gt;)');
    expect(badgeCustomHtml).toContain('<span class="prov-part-ref">◇ 重構參考</span>');

    // 2. DB1 Fangshan mixed verse segment resolution (F28n1071_pF28p0141a2301)
    const fangshan141 = BUILTIN_DHARANI_CORPUS.find(
      (e) => e.id === 'db1-fangshan-F28n1071_pF28p0141a2301'
    )!;
    // Verse 1: "nama stryadhvikānāṃ" with <cb:tt> ma=莫
    const v1IastSegs = resolveVerseMixedSegments(fangshan141.verses[0], 'iast');
    expect(v1IastSegs).toEqual([
      { text: 'na', origin: 'derived-reference' },
      { text: 'ma', origin: 'db-original' },
      { text: ' stryadhvikānāṃ', origin: 'derived-reference' },
    ]);
    const v1SidSegs = resolveVerseMixedSegments(fangshan141.verses[0], 'siddham');
    expect(v1SidSegs).toEqual([
      { text: '𑖡', origin: 'derived-reference' },
      { text: '𑖦', origin: 'db-original' },
      { text: ' 𑖭𑖿𑖝𑖿𑖨𑖿𑖧𑖠𑖿𑖪𑖰𑖎𑖯𑖡𑖯𑖽', origin: 'derived-reference' },
    ]);

    // Verse 12: "mahā raśmi sandite" with <cb:tt> ndi=你 (conjunct akṣara kept intact!)
    const v12SidSegs = resolveVerseMixedSegments(fangshan141.verses[11], 'siddham');
    expect(v12SidSegs).toEqual([
      { text: '𑖦𑖮𑖯 𑖨𑖫𑖿𑖦𑖰 𑖭', origin: 'derived-reference' },
      { text: '𑖡𑖿𑖟𑖰', origin: 'db-original' },
      { text: '𑖝𑖸', origin: 'derived-reference' },
    ]);

    // 3. DB11 CEToM Silk Road Brāhmī fragment (psuv67) mixed segment resolution
    const psuv67 = BUILTIN_DHARANI_CORPUS.find((e) => e.id === 'db11-cetom-psuv67')!;
    const psuvSegs = resolveVerseMixedSegments(psuv67.verses[0], 'iast');
    expect(psuvSegs.some((s) => s.origin === 'db-original' && s.text.includes('udakena'))).toBe(
      true
    );
    expect(
      psuvSegs.some((s) => s.origin === 'derived-reference' && s.text.includes('nayanti'))
    ).toBe(true);

    // 4. Full-corpus Golden Invariant across all 2,482 entries:
    //    Every mixed verse in the entire corpus MUST resolve to BOTH db-original AND derived-reference
    //    segments with 100% lossless text concatenation!
    let checkedMixedCount = 0;
    for (const entry of BUILTIN_DHARANI_CORPUS) {
      for (const verse of entry.verses) {
        const eff = resolveEffectiveVerseFields(verse, false);
        if (eff.iastOrigin === 'mixed') {
          checkedMixedCount++;
          const segs = resolveVerseMixedSegments(verse, 'iast', false);
          expect(segs.some((s) => s.origin === 'db-original')).toBe(true);
          expect(segs.some((s) => s.origin === 'derived-reference')).toBe(true);
          expect(segs.map((s) => s.text).join('')).toBe(eff.iastText);
        }
        if (eff.siddhamOrigin === 'mixed') {
          const segs = resolveVerseMixedSegments(verse, 'siddham', false);
          expect(segs.some((s) => s.origin === 'db-original')).toBe(true);
          expect(segs.some((s) => s.origin === 'derived-reference')).toBe(true);
          expect(segs.map((s) => s.text).join('')).toBe(eff.siddhamText);
        }
      }
    }
    expect(checkedMixedCount).toBeGreaterThan(4000);

    // 5. SSR DOM check on VerseBlock & FullDharaniSummaryCard
    const defaultConfig: ScriptVisibilityConfig = {
      showFullCombinedSummary: true,
      showDevanagari: true,
      showSiddham: true,
      showIast: true,
      showIpa: true,
      showProsodyMeter: false,
      showClassicalZh: true,
      showModernPhoneticZh: true,
      showPhoneticIastBracket: false,
      showMeaningZh: true,
      showMeaningEn: true,
      showWordGloss: false,
    };

    const verseHtml = renderToStaticMarkup(
      React.createElement(VerseBlock, {
        verse: fangshan141.verses[0],
        config: defaultConfig,
        isVersePlaying: false,
        activeSyllableIndex: null,
        verseProgress: 0,
        autoScroll: false,
        onPlayVerse: () => {},
        onPlaySyllable: () => {},
      })
    );
    expect(verseHtml).toContain('<span class="prov-seg-orig"');
    expect(verseHtml).toContain('>𑖦</span>');
    expect(verseHtml).toContain('>ma</span>');
    expect(verseHtml).toContain('prov-seg-ref');

    const summaryHtml = renderToStaticMarkup(
      React.createElement(FullDharaniSummaryCard, {
        entry: fangshan141,
        config: defaultConfig,
        onToggleBracketIast: () => {},
      })
    );
    expect(summaryHtml).toContain('prov-part-orig');
    expect(summaryHtml).toContain('prov-part-ref');
    expect(summaryHtml).toContain('prov-seg-orig');
    expect(summaryHtml).toContain('prov-seg-ref');
  });

  it('preserves fieldSources and hand-crafted strings cleanly across compiled cloud shards and FIRST_SCREEN_CORPUS', () => {
    expect(FIRST_SCREEN_CORPUS.length).toBeGreaterThanOrEqual(20);
    for (const entry of FIRST_SCREEN_CORPUS) {
      for (const v of entry.verses) {
        expect(v.fieldSources).toBeDefined();
      }
    }

    const shardDir = path.join(process.cwd(), 'public', 'corpus');
    const rawCurated = JSON.parse(
      fs.readFileSync(path.join(shardDir, 'shard-curated.json'), 'utf8')
    ) as DharaniEntry[];
    const hydratedCurated = attachLazyWordsToEntries(rawCurated);

    const rawMp = rawCurated.find((e) => e.id === 'mahapratisara-mahavidyarajni-complete')!;
    expect(rawMp).toBeDefined();
    // Algorithmic modernPhoneticZh should NOT be baked as an explicit redundant property in shard JSON
    expect(Object.prototype.hasOwnProperty.call(rawMp.verses[0], 'modernPhoneticZh')).toBe(false);

    const hydratedMp = hydratedCurated.find(
      (e) => e.id === 'mahapratisara-mahavidyarajni-complete'
    )!;
    const effMp = resolveEffectiveVerseFields(hydratedMp.verses[0], false);
    expect(effMp.modernPhoneticOrigin).toBe('derived-reference');
    expect(effMp.modernPhoneticZh.length).toBeGreaterThan(0);

    // Hand-crafted non-Tripitaka classicalTranslitZh IS preserved verbatim in shard JSON while marked derived-reference!
    const rawJaina = rawCurated.find((e) => e.id === 'jaina-namokara-patanjali-yoga-mantras')!;
    expect(rawJaina.verses[0].classicalTranslitZh).toContain('曩莫 阿啰诃毗也');
    const hydratedJaina = hydratedCurated.find(
      (e) => e.id === 'jaina-namokara-patanjali-yoga-mantras'
    )!;
    const effJaina = resolveEffectiveVerseFields(hydratedJaina.verses[0], false);
    expect(effJaina.classicalTranslitOrigin).toBe('derived-reference');
    expect(effJaina.classicalTranslitZh).toBe(rawJaina.verses[0].classicalTranslitZh);

    // CBETA T20n1080 #SD-* Siddhaṃ original text IS preserved in shard JSON and marked db-original,
    // while modernPhoneticZh resolves cleanly as derived-reference!
    const rawCintamani = rawCurated.find((e) => e.id === 'ten-small-01-cintamanicakra')!;
    expect(rawCintamani.verses[0].siddhamOriginal).toBeTruthy();
    const hydratedCin = hydratedCurated.find((e) => e.id === 'ten-small-01-cintamanicakra')!;
    const effCin = resolveEffectiveVerseFields(hydratedCin.verses[0], false);
    expect(effCin.siddhamOrigin).toBe('db-original');
    expect(effCin.modernPhoneticOrigin).toBe('derived-reference');
    expect(effCin.modernPhoneticZh).toContain('拿摩 布达呀');

    // Verify shard-12db.json preserves originalIastTokens on mixed Fangshan verses
    const raw12Db = JSON.parse(
      fs.readFileSync(path.join(shardDir, 'shard-12db.json'), 'utf8')
    ) as DharaniEntry[];
    const hydrated12Db = attachLazyWordsToEntries(raw12Db);
    const hydratedF141 = hydrated12Db.find(
      (e) => e.id === 'db1-fangshan-F28n1071_pF28p0141a2301'
    )!;
    expect(hydratedF141.verses[0].originalIastTokens).toEqual(['ma']);
    expect(resolveVerseMixedSegments(hydratedF141.verses[0], 'siddham')[1]).toEqual({
      text: '𑖦',
      origin: 'db-original',
    });
  });

  it('enforces corpus-wide philological & provenance Golden Invariants across all 3,087 entries', () => {
    expect(BUILTIN_DHARANI_CORPUS.length).toBe(3618);

    let db1MixedTtTotal = 0;
    let db1MixedTtMatched = 0;
    const commentaryLeakRe = /[（(][^）)]*(?:切|反|去声|上声|平声|入声)[）)]/;
    const bmpCompatRe = /[\uF900-\uFAFF]/;

    for (const entry of BUILTIN_DHARANI_CORPUS) {
      const dbKey = entry.provenance.databaseId || entry.categoryId;
      expect(bmpCompatRe.test(entry.titleZh), `BMP compat char in titleZh of ${entry.id}`).toBe(
        false
      );

      for (const verse of entry.verses) {
        const eff = resolveEffectiveVerseFields(verse, false);

        // 1. 100% stone <cb:tt> token alignment across all DB1 Fangshan mixed verses
        if (dbKey === 'db1_fangshan' && verse.originalIastTokens?.length) {
          db1MixedTtTotal += verse.originalIastTokens.length;
          const res = matchIastOriginalAksharaFlags(verse.iast, verse.originalIastTokens);
          db1MixedTtMatched += res.matchedTokenIndices.length;
        }

        // 2. Zero parenthetical fanqie/tone commentary leaks in classicalTranslitZh
        expect(
          commentaryLeakRe.test(eff.classicalTranslitZh),
          `commentary leak in classicalTranslitZh of ${entry.id}#${verse.index}: ${eff.classicalTranslitZh}`
        ).toBe(false);

        // 3. Zero modern/erroneous Tang transliteration artifacts in derived classicalTranslitZh
        if (eff.classicalTranslitOrigin === 'derived-reference') {
          expect(eff.classicalTranslitZh).not.toMatch(/拿喃|毗耶入/);
        }

        // 4. Zero Tibetan EWTS transliteration artifacts in DB9 (RKTS) Sanskrit IAST
        if (dbKey === 'db9_rkts') {
          expect(verse.iast).not.toMatch(/\bye\s+ṅharmā\b|\bsarba|\bbidyā|\bbadzra/i);
        }

        // 5. Zero BMP compatibility ideographs and zero folio-break yaḥkṣa artifacts across all 2,482 entries
        expect(
          bmpCompatRe.test(eff.classicalTranslitZh),
          `BMP compat char in ${entry.id}#${verse.index}`
        ).toBe(false);
        expect(verse.iast, `yaḥkṣa artifact in ${entry.id}#${verse.index}`).not.toMatch(
          /yaḥkṣa/i
        );
      }
    }

    expect(db1MixedTtTotal).toBeGreaterThan(7500);
    expect(db1MixedTtMatched).toBe(db1MixedTtTotal);
  });
});
