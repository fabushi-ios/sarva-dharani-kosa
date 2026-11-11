import { describe, it, expect } from 'vitest';
import { analyzeSanskritProsody } from '../../src/core/sanskrit/prosody';
import { iastToIpa } from '../../src/core/sanskrit/transliterator';
import {
  enrichSyllablesWithPhonetics,
  generateVerseChinesePhonetics,
  mapSyllableToChinesePhonetics,
} from '../../src/core/sanskrit/phoneticMapper';
import { BUILTIN_DHARANI_CORPUS } from '../../src/data/index';

function reconstructModernFromEnriched(iast: string): string {
  const enriched = enrichSyllablesWithPhonetics(analyzeSanskritProsody(iast));
  const wordsMap = new Map<number, typeof enriched>();
  const order: number[] = [];
  for (const s of enriched) {
    const w = s.wordIndex ?? 0;
    if (!wordsMap.has(w)) {
      wordsMap.set(w, []);
      order.push(w);
    }
    wordsMap.get(w)!.push(s);
  }
  const tokens: string[] = [];
  let pendingDanda = false;
  for (const w of order) {
    const syls = wordsMap.get(w)!;
    if ((syls[0].dandaBefore || pendingDanda) && tokens.length > 0) {
      tokens.push('|');
    }
    pendingDanda = false;
    let wordStr = '';
    for (let i = 0; i < syls.length; i++) {
      if (i > 0 && syls[i].compoundHyphenBefore) {
        wordStr += '-';
      }
      wordStr += syls[i].modernZh;
    }
    if (wordStr) tokens.push(wordStr);
    if (syls[syls.length - 1].dandaAfter) {
      pendingDanda = true;
    }
  }
  return tokens.join(' ');
}

describe('Śikṣā Sanskrit Phonological Engine (src/core/sanskrit/*)', () => {
  it('resolves cintamani-1 (如意宝轮王陀罗尼) with 100% verse-to-syllable consistency and BMP-safe glyphs', () => {
    const iast =
      'namo buddhāya | namo dharmāya | namaḥ saṃghāya | namo āryāvalokiteśvarāya bodhisattvāya mahāsattvāya mahākāruṇikāya |';

    const verseOut = generateVerseChinesePhonetics(iast, false);
    expect(verseOut.modernPhoneticZh).toBe(
      '拿摩 布达呀 | 拿摩 达尔玛呀 | 拿玛赫 桑嘎呀 | 拿摩 阿哩呀-瓦洛给帝-湿瓦啦呀 博地-萨特瓦呀 玛哈-萨特瓦呀 玛哈-嘎鲁尼嘎呀'
    );

    const enriched = enrichSyllablesWithPhonetics(analyzeSanskritProsody(iast));
    expect(reconstructModernFromEnriched(iast)).toBe(verseOut.modernPhoneticZh);

    const byIndex = Object.fromEntries(
      enriched.map((s) => [`${s.index}:${s.iast}`, { modern: s.modernZh, tang: s.classicalZh }])
    );

    // Key regression checks from user screenshot (image.png, 1-indexed syllables):
    expect(byIndex['3:bud'].modern).toBe('布'); // Abhinidhāna: geminate stop absorbed (not 布德)
    expect(byIndex['4:dhā'].modern).toBe('达'); // Voiced aspirate single-syllable (not 达哈—)
    expect(byIndex['9:mā'].modern).toBe('玛'); // No em-dash '—' masquerading as '一'
    expect(byIndex['9:mā'].tang).toBe('摩(引)'); // BMP-safe Tang dīrgha notation (not Extension-B tofu U+246A5 𤚥)
    expect(byIndex['12:maḥ'].modern).toBe('玛赫'); // Visarga -aḥ -> 赫 (not 玛哈)
    expect(byIndex['13:saṃ'].modern).toBe('桑'); // Velar assimilation before gh (not 萨姆)
    expect(byIndex['14:ghā'].modern).toBe('嘎'); // Complete CV matrix cell (not 嘎哈啊)
    expect(byIndex['18:ār'].modern).toBe('阿哩'); // Pre-palatal Repha svarabhakti before y
    expect(byIndex['23:te'].modern).toBe('帝'); // Rising-sonority onset keeps śva intact (not teś -> 帝斯)
    expect(byIndex['24:śva'].modern).toBe('湿瓦');
    expect(byIndex['29:sat'].modern).toBe('萨'); // Homorganic t before tv absorbed (not 萨特 + 特瓦—)
    expect(byIndex['30:tvā'].modern).toBe('特瓦');
  });

  it('syllabifies rising-sonority 2- and 3-consonant Akṣara onsets accurately', () => {
    const avalokitesvara = analyzeSanskritProsody('āryāvalokiteśvarāya').map((s) => s.iast);
    expect(avalokitesvara).toEqual(['ār', 'yā', 'va', 'lo', 'ki', 'te', 'śva', 'rā', 'ya']);

    const tryadhva = analyzeSanskritProsody('tryadhva').map((s) => s.iast);
    expect(tryadhva).toEqual(['trya', 'dhva']);
    expect(generateVerseChinesePhonetics('tryadhva', false).modernPhoneticZh).toBe('特哩呀德瓦');

    const agrya = analyzeSanskritProsody('agrya').map((s) => s.iast);
    expect(agrya).toEqual(['a', 'grya']);
    expect(generateVerseChinesePhonetics('agrya', false).modernPhoneticZh).toBe('阿格哩呀');
  });

  it('implements Abhinidhāna & Varṇakrama geminate absorption (stops and manuscript sonorants)', () => {
    expect(generateVerseChinesePhonetics('buddhāya siddhe uttara', false).modernPhoneticZh).toBe(
      '布达呀 悉叠 乌达啦'
    );
    expect(generateVerseChinesePhonetics('sarvva āryya dharmma', false).modernPhoneticZh).toBe(
      '萨尔瓦 阿哩呀 达尔玛'
    );
  });

  it('implements Pāṇinian Parasavarṇa Anusvāra assimilation in both Chinese phonetics and IPA', () => {
    expect(
      generateVerseChinesePhonetics('saṃghāya saṃcodite saṃbuddha alaṃkāra', false).modernPhoneticZh
    ).toBe('桑嘎呀 散卓地帝 桑布达 阿朗嘎啦');

    // Word-final -ṃ stays stable across whitespace boundaries (e.g. repeated bīja)
    expect(generateVerseChinesePhonetics('khūṃ khūṃ jvala', false).modernPhoneticZh).toBe(
      '空 空 吉瓦啦'
    );
    // Standalone bīja laṃ -> 兰 (classical 蓝), while word-internal laṃ before k -> 朗
    expect(generateVerseChinesePhonetics('oṃ laṃ svāhā', false).modernPhoneticZh).toBe(
      '嗡 兰 斯瓦哈'
    );
    expect(mapSyllableToChinesePhonetics('laṃ').classicalZh).toBe('蓝');

    // Context-sensitive IPA assimilation (Pāṇini 8.4.58)
    expect(iastToIpa('saṃgha')).toContain('ŋ');
    expect(iastToIpa('saṃca')).toContain('ɲ');
    expect(iastToIpa('saṃṭa')).toContain('ɳ');
    expect(iastToIpa('saṃta')).toContain('n̪');
    expect(iastToIpa('saṃba')).toContain('m');
  });

  it('fuses nasal codas into single-character Mandarin nasal rhymes and colors Visarga by vowel', () => {
    expect(
      generateVerseChinesePhonetics('cintāmaṇi samanta śāntika nīlakaṇṭha', false).modernPhoneticZh
    ).toBe('津达玛尼 萨曼达 善帝嘎 尼啦干他');

    expect(generateVerseChinesePhonetics('namaḥ śāntiḥ āyuḥ', false).modernPhoneticZh).toBe(
      '拿玛赫 善帝希 阿尤忽'
    );
  });

  it('handles external yaṇ-sandhi (-Cy/-Cv), attached avagraha, and vowelless clitics cleanly', () => {
    expect(generateVerseChinesePhonetics('ity evaṃ', false).modernPhoneticZh).toBe('伊帝 诶旺');
    expect(generateVerseChinesePhonetics('koṭy-uṣṇīṣaṃ', false).modernPhoneticZh).toBe(
      '果蒂-乌什尼伤'
    );
    expect(generateVerseChinesePhonetics('śastrāgny-udaka', false).modernPhoneticZh).toBe(
      '沙斯特啦格尼-乌达嘎'
    );
    expect(generateVerseChinesePhonetics('ehy ehi', false).modernPhoneticZh).toBe('诶嘿 诶嘿');
    expect(generateVerseChinesePhonetics("śiro'rtiṃ", false).modernPhoneticZh).toBe('希洛尔丁');
    expect(generateVerseChinesePhonetics("so 'py uvāca", false).modernPhoneticZh).toBe(
      '索 比 乌瓦佳'
    );
  });

  it('guarantees 100% BMP-safe characters, zero Latin/Katakana/em-dash leaks, and exact sync across all curated verses', () => {
    let checkedExplicitVerses = 0;

    for (const entry of BUILTIN_DHARANI_CORPUS) {
      for (const verse of entry.verses) {
        const desc = Object.getOwnPropertyDescriptor(verse, 'modernPhoneticZh');
        const isExplicit = Boolean(desc && 'value' in desc && desc.value);
        if (!isExplicit) continue;

        checkedExplicitVerses++;
        const computed = generateVerseChinesePhonetics(verse.iast, false);
        expect(verse.modernPhoneticZh).toBe(computed.modernPhoneticZh);
        expect(reconstructModernFromEnriched(verse.iast)).toBe(computed.modernPhoneticZh);

        // Zero ASCII letters, Katakana, ellipses, or em-dashes in modernPhoneticZh
        expect(verse.modernPhoneticZh).not.toMatch(/[a-zA-Z\u30a0-\u30ff—]|\.\.\./);

        // Every per-syllable card must be non-empty and 100% BMP-safe (no Extension-B tofu or Siddhaṃ leak)
        const enriched = enrichSyllablesWithPhonetics(analyzeSanskritProsody(verse.iast));
        for (const syl of enriched) {
          expect(syl.modernZh.length).toBeGreaterThan(0);
          expect(syl.classicalZh.length).toBeGreaterThan(0);
          expect(syl.modernZh).not.toMatch(/[a-zA-Z\u30a0-\u30ff—]/);
          for (const ch of syl.modernZh + syl.classicalZh) {
            expect(ch.codePointAt(0)!).toBeLessThanOrEqual(0xffff);
          }
        }
      }
    }

    expect(checkedExplicitVerses).toBeGreaterThanOrEqual(200);
    // Long mā uses BMP-safe Tang dīrgha notation '摩(引)', short ma uses '摩'
    expect(mapSyllableToChinesePhonetics('mā').classicalZh).toBe('摩(引)');
    expect(mapSyllableToChinesePhonetics('ma').classicalZh).toBe('摩');
  });
});
