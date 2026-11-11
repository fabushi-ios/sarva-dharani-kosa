import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import type { DharaniEntry, DharaniVerse } from '../../src/types/kosaTypes';
import {
  formatModernPhoneticWithIastOption,
  generateVerseChinesePhonetics,
} from '../../src/core/sanskrit/phoneticMapper';
import {
  resolveEffectiveVerseFields,
  resolveEffectiveWordGlosses,
  resolveVerseFieldOrigin,
  summarizeEntryFieldProvenance,
} from '../../src/core/provenance/fieldProvenance';
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

  it('distinguishes curated DB originals from derived layers across BUILTIN_DHARANI_CORPUS and 12 Global Databases', () => {
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

    // 2. Curated Ten Small Dhāraṇīs: IAST, classicalTranslitZh, modernPhoneticZh, meaningZh are db-original
    const cintamani = BUILTIN_DHARANI_CORPUS.find((e) => e.id === 'ten-small-01-cintamanicakra');
    expect(cintamani).toBeDefined();
    const cinSummary = summarizeEntryFieldProvenance(cintamani!);
    expect(cinSummary.byField.iast).toBe('db-original');
    expect(cinSummary.byField.classicalTranslitZh).toBe('db-original');
    expect(cinSummary.byField.modernPhoneticZh).toBe('db-original');
    expect(cinSummary.byField.siddham).toBe('derived-reference');
    expect(cinSummary.byField.ipa).toBe('derived-reference');

    // 3. World Mantras Encyclopedia: verses with explicit modernPhoneticZh vs unannotated verses
    const surangamaHeart = BUILTIN_DHARANI_CORPUS.find(
      (e) => e.id === 'surangama-five-heart-mantra'
    );
    expect(surangamaHeart).toBeDefined();
    expect(resolveVerseFieldOrigin(surangamaHeart!.verses[0], 'modernPhoneticZh')).toBe(
      'db-original'
    );

    // 4. DB1 Fangshan Stone Sutras: Chinese transliteration is db-original, modern phonetic is derived-reference
    const db1Entries = BUILTIN_DHARANI_CORPUS.filter(
      (e) => e.provenance.databaseId === 'db1_fangshan'
    );
    expect(db1Entries.length).toBeGreaterThan(0);
    expect(resolveVerseFieldOrigin(db1Entries[0].verses[0], 'classicalTranslitZh')).toBe(
      'db-original'
    );
    expect(resolveVerseFieldOrigin(db1Entries[0].verses[0], 'modernPhoneticZh')).toBe(
      'derived-reference'
    );

    // 5. DB9 RKTS Tibetan Kanjur witnesses: diplomaticOriginal preserved + EWTS->IAST marked derived-reference
    const db9Entries = BUILTIN_DHARANI_CORPUS.filter(
      (e) => e.provenance.databaseId === 'db9_rkts'
    );
    expect(db9Entries.length).toBeGreaterThan(0);
    expect(db9Entries[0].verses[0].diplomaticOriginal).toBeTruthy();
    expect(resolveVerseFieldOrigin(db9Entries[0].verses[0], 'iast')).toBe('derived-reference');
  });

  it('preserves fieldSources cleanly across compiled cloud shards and FIRST_SCREEN_CORPUS', () => {
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
    // Derived modernPhoneticZh should NOT be baked as an explicit DB property in shard JSON
    expect(Object.prototype.hasOwnProperty.call(rawMp.verses[0], 'modernPhoneticZh')).toBe(false);

    const hydratedMp = hydratedCurated.find(
      (e) => e.id === 'mahapratisara-mahavidyarajni-complete'
    )!;
    const effMp = resolveEffectiveVerseFields(hydratedMp.verses[0], false);
    expect(effMp.modernPhoneticOrigin).toBe('derived-reference');
    expect(effMp.modernPhoneticZh.length).toBeGreaterThan(0);

    // Meanwhile curated DB modernPhoneticZh IS preserved in shard JSON and marked db-original
    const rawCintamani = rawCurated.find((e) => e.id === 'ten-small-01-cintamanicakra')!;
    expect(rawCintamani.verses[0].modernPhoneticZh).toBeTruthy();
    const hydratedCin = hydratedCurated.find((e) => e.id === 'ten-small-01-cintamanicakra')!;
    const effCin = resolveEffectiveVerseFields(hydratedCin.verses[0], false);
    expect(effCin.modernPhoneticOrigin).toBe('db-original');
    expect(effCin.modernPhoneticZh).toBe(rawCintamani.verses[0].modernPhoneticZh);
  });
});
