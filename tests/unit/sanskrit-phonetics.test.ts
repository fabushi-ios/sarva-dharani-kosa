import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { analyzeSanskritProsody } from '../../src/core/sanskrit/prosody';
import { iastToDevanagari, iastToIpa } from '../../src/core/sanskrit/transliterator';
import {
  coalesceSubscriptRuns,
  enrichSyllablesWithPhonetics,
  generateVerseChinesePhonetics,
  mapSyllableToChinesePhonetics,
  parsePhoneticRichSegments,
  stripPhoneticSubscriptMarkers,
} from '../../src/core/sanskrit/phoneticMapper';
import { PhoneticText } from '../../src/components/common/PhoneticText';
import { filterDharanis, normalizeSearchText } from '../../src/core/search/searchEngine';
import {
  VITS_INHERENT_A_MARKER,
  cancelLowPriorityBrowserOnnxTasks,
  conditionDevanagariWordForVits,
  normalizeSikshaDevanagari,
  shapeVitsWaveform24kWithDurations,
  upsample24kTo48kAndMaster,
} from '../../src/services/audio/browserOnnxTtsEngine';
import { trimSilenceAndShiftTimings } from '../../src/services/audio/sanskritAudioEngine';
import {
  DB1_FANGSHAN_CORPUS,
  DB2_TAISHO_EXT_CORPUS,
} from '../../src/data/generated/tier1Databases';
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
    if (wordStr) tokens.push(coalesceSubscriptRuns(wordStr));
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
      '拿摩 布达呀 | 拿摩 达₍尔₎玛呀 | 拿玛₍赫₎ 桑嘎呀 | 拿摩 阿₍哩₎呀-瓦洛给帝-₍湿₎瓦啦呀 博地-萨₍特₎瓦呀 玛哈-萨₍特₎瓦呀 玛哈-嘎鲁尼嘎呀'
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
    expect(byIndex['12:maḥ'].modern).toBe('玛₍赫₎'); // Visarga -aḥ -> subscript ₍赫₎ (not full syllable 玛哈)
    expect(byIndex['13:saṃ'].modern).toBe('桑'); // Velar assimilation before gh (not 萨姆)
    expect(byIndex['14:ghā'].modern).toBe('嘎'); // Complete CV matrix cell (not 嘎哈啊)
    expect(byIndex['18:ār'].modern).toBe('阿₍哩₎'); // Pre-palatal Repha svarabhakti before y in subscript
    expect(byIndex['23:te'].modern).toBe('帝'); // Rising-sonority onset keeps śva intact (not teś -> 帝斯)
    expect(byIndex['24:śva'].modern).toBe('₍湿₎瓦');
    expect(byIndex['29:sat'].modern).toBe('萨'); // Homorganic t before tv absorbed (not 萨特 + 特瓦—)
    expect(byIndex['30:tvā'].modern).toBe('₍特₎瓦');
  });

  it('syllabifies rising-sonority 2- and 3-consonant Akṣara onsets accurately', () => {
    const avalokitesvara = analyzeSanskritProsody('āryāvalokiteśvarāya').map((s) => s.iast);
    expect(avalokitesvara).toEqual(['ār', 'yā', 'va', 'lo', 'ki', 'te', 'śva', 'rā', 'ya']);

    const tryadhva = analyzeSanskritProsody('tryadhva').map((s) => s.iast);
    expect(tryadhva).toEqual(['trya', 'dhva']);
    expect(generateVerseChinesePhonetics('tryadhva', false).modernPhoneticZh).toBe('₍特哩₎呀₍德₎瓦');

    const agrya = analyzeSanskritProsody('agrya').map((s) => s.iast);
    expect(agrya).toEqual(['a', 'grya']);
    expect(generateVerseChinesePhonetics('agrya', false).modernPhoneticZh).toBe('阿₍格哩₎呀');
  });

  it('implements Abhinidhāna & Varṇakrama geminate absorption (stops and manuscript sonorants)', () => {
    expect(generateVerseChinesePhonetics('buddhāya siddhe uttara', false).modernPhoneticZh).toBe(
      '布达呀 悉叠 乌达啦'
    );
    expect(generateVerseChinesePhonetics('sarvva āryya dharmma', false).modernPhoneticZh).toBe(
      '萨₍尔₎瓦 阿₍哩₎呀 达₍尔₎玛'
    );
  });

  it('implements Pāṇinian Parasavarṇa Anusvāra assimilation in both Chinese phonetics and IPA', () => {
    expect(
      generateVerseChinesePhonetics('saṃghāya saṃcodite saṃbuddha alaṃkāra', false).modernPhoneticZh
    ).toBe('桑嘎呀 散卓地帝 桑布达 阿朗嘎啦');

    // Word-final -ṃ stays stable across whitespace boundaries (e.g. repeated bīja)
    expect(generateVerseChinesePhonetics('khūṃ khūṃ jvala', false).modernPhoneticZh).toBe(
      '空 空 ₍吉₎瓦啦'
    );
    // Standalone bīja laṃ -> 兰 (classical 蓝), while word-internal laṃ before k -> 朗
    expect(generateVerseChinesePhonetics('oṃ laṃ svāhā', false).modernPhoneticZh).toBe(
      '嗡 兰 ₍斯₎瓦哈'
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
      '拿玛₍赫₎ 善帝₍希₎ 阿尤₍忽₎'
    );
  });

  it('handles external yaṇ-sandhi (-Cy/-Cv), attached avagraha, and vowelless clitics cleanly', () => {
    expect(generateVerseChinesePhonetics('ity evaṃ', false).modernPhoneticZh).toBe('伊₍帝₎ 诶旺');
    expect(generateVerseChinesePhonetics('koṭy-uṣṇīṣaṃ', false).modernPhoneticZh).toBe(
      '果₍蒂₎-乌₍师₎尼伤'
    );
    expect(generateVerseChinesePhonetics('śastrāgny-udaka', false).modernPhoneticZh).toBe(
      '沙₍斯特₎啦₍格尼₎-乌达嘎'
    );
    expect(generateVerseChinesePhonetics('ehy ehi', false).modernPhoneticZh).toBe('诶₍嘿₎ 诶嘿');
    expect(generateVerseChinesePhonetics("śiro'rtiṃ", false).modernPhoneticZh).toBe('希洛₍尔₎丁');
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

  it('conditions inherent-a words (cipa, hunupa, dharma, sarva-buddha) with \\u200a and zero Avagraha/vowel stutter', () => {
    expect(VITS_INHERENT_A_MARKER).toBe('\u200a');

    // User-reported exact bug cases: cipa ('चिप') and hunupa ('हुनुप')
    expect(conditionDevanagariWordForVits(iastToDevanagari('cipa'))).toBe(`चिप${VITS_INHERENT_A_MARKER}`);
    expect(conditionDevanagariWordForVits(iastToDevanagari('hunupa'))).toBe(`हुनुप${VITS_INHERENT_A_MARKER}`);
    expect(conditionDevanagariWordForVits(iastToDevanagari('jñapa'))).toBe(`ज्ञप${VITS_INHERENT_A_MARKER}`);
    expect(conditionDevanagariWordForVits(iastToDevanagari('dharma'))).toBe(`धर्म${VITS_INHERENT_A_MARKER}`);

    // Overt vowel signs, Virāma, Anusvāra, and Visarga must NEVER receive \u200a or 'ऽ'
    expect(conditionDevanagariWordForVits(iastToDevanagari('cipaṭu'))).toBe('चिपटु');
    expect(conditionDevanagariWordForVits(iastToDevanagari('hunupaṭu'))).toBe('हुनुपटु');
    expect(conditionDevanagariWordForVits('फट्')).toBe('फट्');
    expect(conditionDevanagariWordForVits('ओम्')).toBe('ओम्');
    expect(conditionDevanagariWordForVits('स्वाहा')).toBe('स्वाहा');
    expect(conditionDevanagariWordForVits('नमः')).toBe('नमः');

    // Compound hyphens and elided Avagraha normalize cleanly without dropping internal inherent 'a'
    const compoundNorm = normalizeSikshaDevanagari(iastToDevanagari('sarva-buddha सोऽहम् ॐ'), false);
    expect(compoundNorm.clauses[0].vitsText).toBe(
      `सर्व${VITS_INHERENT_A_MARKER} बुद्ध${VITS_INHERENT_A_MARKER} सो हम् ओम्`
    );
    expect(compoundNorm.clauses[0].vitsText).not.toContain('ऽ');

    // Bare Virāma matrix cell ('क्') sets isBareVirama = true and appends \u200a for burst windowing
    const bareViramaNorm = normalizeSikshaDevanagari('क्', true);
    expect(bareViramaNorm.clauses[0]).toEqual({
      vitsText: `क${VITS_INHERENT_A_MARKER}`,
      pauseMs: 0,
      isBareVirama: true,
    });

    // All 33 inherent-'a' consonants condition cleanly with \u200a and zero vowel duplication
    const all33 = [
      'ka', 'kha', 'ga', 'gha', 'ṅa',
      'ca', 'cha', 'ja', 'jha', 'ña',
      'ṭa', 'ṭha', 'ḍa', 'ḍha', 'ṇa',
      'ta', 'tha', 'da', 'dha', 'na',
      'pa', 'pha', 'ba', 'bha', 'ma',
      'ya', 'ra', 'la', 'va',
      'śa', 'ṣa', 'sa', 'ha',
    ];
    for (const syl of all33) {
      const singleNorm = normalizeSikshaDevanagari(iastToDevanagari(syl), true);
      expect(singleNorm.clauses[0].vitsText.endsWith(VITS_INHERENT_A_MARKER)).toBe(true);
      expect(singleNorm.clauses[0].vitsText).not.toContain('ऽ');
      expect(singleNorm.clauses[0].vitsText).not.toContain('अ');
    }
  });

  it('suppresses post-stop Virāma epenthesis (phaṭ), preserves nasal codas (oṃ), caps Laghu \\u200a, and preserves onset bursts', () => {
    const hop = 256;

    // 1. Oral stop Virāma ('फट्'): silent stop closure blank (< 0.032 RMS) + spurious voiced epenthesis (> 0.015 RMS)
    const phatChars = ['फ', 'ट', '्']; // 7 interleaved tokens
    const phatDurs = [2, 6, 1, 5, 3, 8, 2]; // total 27 frames
    const phatRaw = new Float32Array(27 * hop);
    // Voiced 'pha' + 'ṭ' closure burst in frames 0..14
    for (let i = 0; i < 14 * hop; i++) phatRaw[i] = 0.25 * Math.sin((2 * Math.PI * i) / 48);
    // Silent closure blank in frames 14..17 (durs[4] = 3, RMS = 0)
    // Spurious voiced vowel on '्' in frames 17..25 (durs[5] = 8)
    for (let i = 17 * hop; i < 25 * hop; i++) phatRaw[i] = 0.18 * Math.sin((2 * Math.PI * i) / 48);

    const shapedPhat = shapeVitsWaveform24kWithDurations(phatRaw, phatChars, phatDurs, 1.0, false);
    expect(shapedPhat.durs[5]).toBe(0); // Spurious virāma vowel completely suppressed!
    expect(shapedPhat.wav24k.length).toBe((17 + 4) * hop);

    // 2. Nasal Virāma ('ओम्'): continuous voiced nasal blank (~0.12 RMS) is preserved intact!
    const omChars = ['ओ', 'म', '्'];
    const omDurs = [2, 10, 1, 6, 3, 7, 2]; // total 31 frames
    const omRaw = new Float32Array(31 * hop);
    for (let i = 0; i < 29 * hop; i++) omRaw[i] = 0.18 * Math.sin((2 * Math.PI * i) / 64);
    const shapedOm = shapeVitsWaveform24kWithDurations(omRaw, omChars, omDurs, 1.0, false);
    expect(shapedOm.durs[5]).toBe(7); // Nasal coda resonance preserved!

    // 3. Utterance-final \u200a Laghu cap ('चिप\u200a'):
    // When preceding blank (durs[6]=2) already carries voiced vowel onset (>= 0.055 RMS), caps durs[7] to 13 - 2 = 11 frames;
    // when preceding blank is silent (< 0.055 RMS), caps durs[7] to 12 frames.
    const cipaChars = ['च', 'ि', 'प', VITS_INHERENT_A_MARKER]; // 9 interleaved tokens
    const cipaDurs = [2, 5, 1, 6, 2, 5, 2, 22, 3];
    const cipaRaw = new Float32Array(48 * hop);
    for (let i = 0; i < 45 * hop; i++) cipaRaw[i] = 0.22 * Math.sin((2 * Math.PI * (i + 7)) / 32);
    const shapedCipa = shapeVitsWaveform24kWithDurations(cipaRaw, cipaChars, cipaDurs, 1.0, false);
    expect(shapedCipa.durs[7]).toBe(11);

    const cipaSilentBlankRaw = new Float32Array(cipaRaw);
    cipaSilentBlankRaw.fill(0, 21 * hop, 23 * hop); // zero out frames 21..23 (durs[6])
    const shapedCipaSilentBlank = shapeVitsWaveform24kWithDurations(
      cipaSilentBlankRaw,
      cipaChars,
      cipaDurs,
      1.0,
      false
    );
    expect(shapedCipaSilentBlank.durs[7]).toBe(12);

    // 4. 48kHz upsampling prepends 10ms zero pad (480 samples @ 48kHz) and normalizes peak to ~0.8913 (-1 dBFS)
    const mastered48k = upsample24kTo48kAndMaster(shapedCipa.wav24k);
    expect(mastered48k.length).toBe((shapedCipa.wav24k.length + 240) * 2);
    let peak = 0;
    for (let i = 0; i < mastered48k.length; i++) {
      const a = Math.abs(mastered48k[i]);
      if (a > peak) peak = a;
    }
    expect(peak).toBeGreaterThan(0.88);
    expect(peak).toBeLessThanOrEqual(0.90);
  });

  it('reconstructs T21n1336_001 (cipaṭu, hunupaṭu, svāhā) and DB1/DB2 with zero divāaḥ or aa vowel stutters', () => {
    const t1336_001 = DB2_TAISHO_EXT_CORPUS.ancientDharanis.find((d) => d.id === 'T21n1336_001');
    expect(t1336_001).toBeDefined();
    expect(t1336_001!.reconstructedIast).toContain('cipaṭu cipaṭu hunupaṭu hunupaṭu');
    expect(t1336_001!.reconstructedIast).toContain('svāhā');
    expect(t1336_001!.reconstructedIast).not.toContain('divāaḥ');

    const p27 = DB1_FANGSHAN_CORPUS.records.find((r) => r.xmlId === 'pF28p0027b0701');
    expect(p27).toBeDefined();
    expect(p27!.reconstructedIast).toContain('namo bhagavato vajrapāṇaye');
    expect(p27!.reconstructedIast).toContain('kili kili');
    expect(p27!.reconstructedIast).toContain('dhara dhara');
    expect(p27!.reconstructedIast).toContain('vajreṇa');

    for (const entry of BUILTIN_DHARANI_CORPUS) {
      const dbId = entry.provenance.databaseId;
      if (dbId !== 'db1_fangshan' && dbId !== 'db2_taisho_ext') continue;
      const fullIast = entry.verses.map((v) => v.iast).join(' | ');
      expect(fullIast).not.toMatch(/\baa+\b|divāaḥ|sūrya\s+(?:aṇa|ra)|(?:^|\s)ṭpa/);
      expect(fullIast).not.toMatch(
        /hṛṛ|kṣkṣ|(?:sama|te|he|ke)śvav|śvam|mahāpa\s+dmo|ṛnaiya|\bnamo\s+sutute\b|manṇa/
      );
    }
  });

  it('maps all underdotted IAST phonemes (ṛ/ṝ, ḷ/ḹ, ṣ, ṇ, ṭ/ṭh/ḍ/ḍh, ḥ, ṃ) accurately with zero polyphonic 什', () => {
    // 1. Vocalic rhotic ṛ/ṝ -> 日 (vs lateral ḷ/ḹ -> 里, ri/rī -> 里, -ry- -> 哩)
    expect(generateVerseChinesePhonetics('hṛdaya amṛta ṛṣi', false).modernPhoneticZh).toBe(
      '₍赫₎日达呀 阿₍姆₎日达 日师'
    );
    expect(generateVerseChinesePhonetics('kḷpta śrī śrīṃ ārya', false).modernPhoneticZh).toBe(
      '₍克₎里₍普₎达 ₍希₎里 ₍希₎林 阿₍哩₎呀'
    );

    // 2. Retroflex sibilant ṣ -> 沙/师/舒/师日/奢 (never polyphonic 什) & palatal ś -> 希/湿
    expect(
      generateVerseChinesePhonetics('mahā padmoṣṇīṣa hṛdaya', true).modernPhoneticZh
    ).toBe('玛哈(mahā) · 巴₍德₎摩₍师₎尼沙(padmoṣṇīṣa) · ₍赫₎日达呀(hṛdaya)');
    expect(
      generateVerseChinesePhonetics('uṣṇīṣa rakṣaṇa maṇite', false).modernPhoneticZh
    ).toBe('乌₍师₎尼沙 啦₍克₎沙拿 玛尼帝');
    expect(
      generateVerseChinesePhonetics('mahā raśmi sandite', false).modernPhoneticZh
    ).toBe('玛哈 啦₍希₎米 散地帝');
    expect(
      generateVerseChinesePhonetics('śikhare vikasita padma vare', false).modernPhoneticZh
    ).toBe('希卡雷 维嘎悉达 巴₍德₎玛 瓦雷');

    // 3. Unaspirated ṭu/tu -> 度 vs aspirated ṭhu/thu -> 图 vs voiced ḍu/du -> 杜
    expect(
      generateVerseChinesePhonetics('turu turu dhuru dhuru namo stute', false).modernPhoneticZh
    ).toBe('度鲁 度鲁 杜鲁 杜鲁 拿摩 ₍斯₎度帝');
    expect(mapSyllableToChinesePhonetics('ṭu').modernZh).toBe('度');
    expect(mapSyllableToChinesePhonetics('ṭhu').modernZh).toBe('图');
    expect(mapSyllableToChinesePhonetics('ḍu').modernZh).toBe('杜');

    // 4. Zero polyphonic '什' across all generated modern Chinese phonetics
    const p141 = DB1_FANGSHAN_CORPUS.records.find((r) => r.xmlId === 'pF28p0141a2301');
    expect(p141).toBeDefined();
    const p141Clauses = p141!.reconstructedIast
      .replace(/\s*\|\|\s*$/, '')
      .split(/\s*\|\s*/);
    expect(p141Clauses).toEqual([
      'nama stryadhvikānāṃ',
      'sarvatathāgatānāṃ',
      'oṃ',
      'amogha maṇi',
      'jvala jvala',
      'mahā padmoṣṇīṣa hṛdaya',
      'śikhare',
      'maṇi maṇi',
      'mahā maṇi',
      'uṣṇīṣa rakṣaṇa maṇite',
      'turu turu',
      'mahā raśmi sandite',
      'vikasita padma vare',
      'dhuru dhuru',
      'samaya siddhi',
      'tara tara',
      'tāraya kumāra',
      'rakṣaṇa maṇḍala',
      'padme samaśvāsaya',
      'samanta vyavalokita padme',
      'sarvoṣṇīṣādhiṣṭhānādhiṣṭhita',
      'tathāgata rakṣaṇa guhya',
      'sarvatathāgatoṣṇīṣa',
      'padma vyavalokita',
      'namo stute',
      'svāhā',
    ]);
    for (const cl of p141Clauses) {
      const phon = generateVerseChinesePhonetics(cl, false).modernPhoneticZh;
      expect(phon).not.toContain('什');
    }
  });

  it('enforces standard Śikṣā small-subscript notation (小字下标), 1-to-1 Akṣara isomorphism, vowel-colored Visarga, and subscript-transparent search', () => {
    // 1. User screenshot regression: Manjusri 8-Syllable Supreme Mantra (文殊八字最胜大威德心陀罗尼)
    const m8Entry = BUILTIN_DHARANI_CORPUS.find(
      (e) => e.id === 'manjusri-astaksara-mantra'
    );
    expect(m8Entry).toBeDefined();
    const m8Iast = m8Entry!.verses[0].iast;
    expect(m8Iast).toBe('namaḥ sarvabuddhānām | oṃ āḥ vī ra hūṃ kha ca raḥ ||');

    const m8WithBrackets = generateVerseChinesePhonetics(m8Iast, true).modernPhoneticZh;
    expect(m8WithBrackets).toBe(
      '拿玛₍赫₎(namaḥ) · 萨₍尔₎瓦-布达南(sarvabuddhānām) | 嗡(oṃ) · 阿₍赫₎(āḥ) · 维(vī) · 啦(ra) · 吽(hūṃ) · 卡(kha) · 佳(ca) · 啦₍赫₎(raḥ)'
    );

    // SSR markup renders <sub class="phon-sub">赫</sub> with zero raw ₍ / ₎ leaked into visible DOM
    const m8Html = renderToStaticMarkup(React.createElement(PhoneticText, { text: m8WithBrackets }));
    expect(m8Html).toContain('拿玛<sub class="phon-sub">赫</sub><span class="phon-iast-paren">(namaḥ)</span>');
    expect(m8Html).toContain('萨<sub class="phon-sub">尔</sub>瓦-布达南<span class="phon-iast-paren">(sarvabuddhānām)</span>');
    expect(m8Html).toContain('阿<sub class="phon-sub">赫</sub><span class="phon-iast-paren">(āḥ)</span>');
    expect(m8Html).toContain('啦<sub class="phon-sub">赫</sub><span class="phon-iast-paren">(raḥ)</span>');
    expect(m8Html).not.toMatch(/[₍₎]/);

    // Truncated snippet safety in parsePhoneticRichSegments
    expect(parsePhoneticRichSegments('拿玛₍赫')).toEqual([
      { kind: 'normal', text: '拿玛' },
      { kind: 'sub', text: '赫' },
    ]);
    expect(stripPhoneticSubscriptMarkers('拿玛₍赫₎ 萨₍尔₎瓦')).toBe('拿玛赫 萨尔瓦');

    // 2. Strict 1-to-1 Akṣara-to-Full-Character Isomorphism across all curated entries
    let checkedSyllables = 0;
    for (const entry of BUILTIN_DHARANI_CORPUS) {
      if (entry.provenance.sourceType === 'GLOBAL-12DB' || entry.categoryId === 'gretil-canonical') {
        continue;
      }
      for (const verse of entry.verses) {
        const enriched = enrichSyllablesWithPhonetics(analyzeSanskritProsody(verse.iast));
        for (const syl of enriched) {
          checkedSyllables++;
          const fullCharsOnly = syl.modernZh.replace(/₍[^₎]*₎/g, '');
          expect(
            [...fullCharsOnly].length,
            `Expected exact 1 full-sized char for Akṣara "${syl.iast}" in ${entry.id}, got "${syl.modernZh}"`
          ).toBe(1);
        }
      }
    }
    expect(checkedSyllables).toBeGreaterThan(3000);

    // 3. Full Śikṣā vowel-colored Visarga (a/ā/o -> ₍赫₎, i/ī/ai -> ₍希₎, e -> ₍嘿₎, u/ū/au -> ₍忽₎)
    expect(
      generateVerseChinesePhonetics('namaḥ śāntiḥ devaiḥ hareḥ āyuḥ gauḥ hoḥ', false)
        .modernPhoneticZh
    ).toBe('拿玛₍赫₎ 善帝₍希₎ 叠歪₍希₎ 哈雷₍嘿₎ 阿尤₍忽₎ 高₍忽₎ 霍₍赫₎');

    // 4. Unaspirated vs aspirated stops, kho vs khau, monophonic chan, and sibilant śuṃ/ṣuṃ
    expect(mapSyllableToChinesePhonetics('pe').modernZh).toBe('贝');
    expect(mapSyllableToChinesePhonetics('phe').modernZh).toBe('佩');
    expect(mapSyllableToChinesePhonetics('peṃ').modernZh).toBe('崩');
    expect(mapSyllableToChinesePhonetics('pheṃ').modernZh).toBe('烹');
    expect(mapSyllableToChinesePhonetics('kun').modernZh).toBe('滚');
    expect(mapSyllableToChinesePhonetics('khun').modernZh).toBe('坤');
    expect(mapSyllableToChinesePhonetics('cṛ').modernZh).toBe('₍吉₎日');
    expect(mapSyllableToChinesePhonetics('chṛ').modernZh).toBe('₍奇₎日');
    expect(mapSyllableToChinesePhonetics('ko').modernZh).toBe('果');
    expect(mapSyllableToChinesePhonetics('kho').modernZh).toBe('阔');
    expect(mapSyllableToChinesePhonetics('khau').modernZh).toBe('考');
    expect(mapSyllableToChinesePhonetics('chan').modernZh).toBe('产');
    expect(mapSyllableToChinesePhonetics('śuṃ').modernZh).toBe('顺');
    expect(mapSyllableToChinesePhonetics('ṣuṃ').modernZh).toBe('顺');

    // 5. Subscript-transparent search normalization (no NFKC '(' / ')' decomposition)
    expect(normalizeSearchText('拿玛₍赫₎ 萨₍尔₎瓦')).toBe(normalizeSearchText('拿玛赫萨尔瓦'));
    const hits = filterDharanis([m8Entry!], {
      query: '拿玛赫 阿赫',
      categoryId: 'all',
      onlyBookmarked: false,
      bookmarkedIds: new Set(),
      sourceFilter: 'all',
    });
    expect(hits.map((h) => h.id)).toContain('manjusri-astaksara-mantra');
  });

  it('trims leading/trailing dead air with zero-click cosine fades, shifts syllable timings, and enforces crisp Daṇḍa pauses', () => {
    const sr = 48000;
    // Construct 500ms buffer: 100ms dead silence + 200ms voiced tone + 200ms dead silence
    const totalSamples = Math.round(0.5 * sr); // 24000
    const leadSilent = Math.round(0.1 * sr);   // 4800
    const voicedLen = Math.round(0.2 * sr);    // 9600
    const rawPcm = new Float32Array(totalSamples);
    for (let i = 0; i < voicedLen; i++) {
      rawPcm[leadSilent + i] = 0.35 * Math.sin((2 * Math.PI * 220 * i) / sr);
    }

    const syls = enrichSyllablesWithPhonetics(analyzeSanskritProsody('oṃ svāhā'));
    const rawTimings = [
      {
        syl: syls[0],
        classicalZh: '唵',
        modernZh: '嗡',
        startSec: 0.1,
        endSec: 0.2,
      },
      {
        syl: syls[1],
        classicalZh: '娑婆',
        modernZh: '₍斯₎瓦',
        startSec: 0.2,
        endSec: 0.3,
      },
    ];

    const trimmed = trimSilenceAndShiftTimings(rawPcm, sr, rawTimings);
    // Expected: ~6ms pre-margin + 200ms voiced + ~14ms post-margin = ~220ms (down from 500ms!)
    expect(trimmed.durationSec).toBeGreaterThan(0.215);
    expect(trimmed.durationSec).toBeLessThan(0.225);
    expect(trimmed.pcm[0]).toBe(0); // Raised-cosine fade-in starts cleanly at 0
    expect(Math.abs(trimmed.pcm[trimmed.pcm.length - 1])).toBeLessThan(1e-6); // Fade-out ends at 0

    // Timings shifted back by ~94ms (100ms lead silence minus 6ms onset cushion)
    expect(trimmed.timings[0].startSec).toBeGreaterThan(0.004);
    expect(trimmed.timings[0].startSec).toBeLessThan(0.008);
    expect(trimmed.timings[1].endSec).toBeLessThanOrEqual(trimmed.durationSec);

    // Tightened Daṇḍa pauses (95ms single '|', 165ms double '||') and 0ms mid-chunk breath split
    const multiClause = normalizeSikshaDevanagari(
      'oṃ maṇi padme hūṃ | gate gate pāragate pārasaṃgate bodhi svāhā ||',
      false
    );
    expect(multiClause.clauses[0].pauseMs).toBe(95);
    // Second clause has 6 words -> split into 5-word chunk (0ms pause) + 1-word chunk (165ms pause)
    expect(multiClause.clauses[1].pauseMs).toBe(0);
    expect(multiClause.clauses[2].pauseMs).toBe(165);

    // Safe no-op invocation when queue is empty
    expect(() => cancelLowPriorityBrowserOnnxTasks()).not.toThrow();
  });
});

describe('Global 3,087-Entry Cross-Database Hygiene & Root-Cause Invariants (DB1–DB12 + GRETIL + Curated)', () => {
  it('enforces zero generic fallbacks, zero PUA/surrogates/gaiji, pure IAST characters, and zero English/Tibetan/apparatus leaks across all 3,087 entries', () => {
    expect(BUILTIN_DHARANI_CORPUS.length).toBe(3618);

    const loneSurrogateRe = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
    const puaRe = /[\uE000-\uF8FF]|[\u{F0000}-\u{10FFFF}]/u;
    const validIastVerseRe =
      /^[-a-zA-ZāīūṛṝḷḹēōṃḥṅñṭḍṇśṣĀĪŪṚṜḶḸĒŌṂḤṄÑṬḌṆŚṢ'\u0310\s|—–.,:;!?()]+$/;
    const unicodeEnglishLeakRe =
      /(?<![a-zA-ZāīūṛṝḷḹēōṃṁḥṅñṭḍṇśṣĀĪŪṚṜḶḸĒŌṂḤṄÑṬḌṆŚṢ])(?:the|and|with|from|this|that|section|chapter|folio|edition|page|translated|sanskrit|tibetan|manuscript|homage|protect|grant|pacify|illness|untimely|death|defeating|buddhas|sentient|beings|accomplish|blessed|awakened|please|remember|rigveda|similar|rhetorical|structure|dieser|zitiert)(?![a-zA-ZāīūṛṝḷḹēōṃṁḥṅñṭḍṇśṣĀĪŪṚṜḶḸĒŌṂḤṄÑṬḌṆŚṢ])/i;
    const encodingOrSiglumLeakRe =
      /(?:(?<=\s|^)\.[tdnrsmlh]|~n|\^n|"s|`s|-i\b|\+[a-z]|(?<![a-zA-Z])[A-Z]{2,}(?![a-z])|r-i)/;
    const db12ForbiddenStartRe =
      /^(?:[ṅñṇḷṃḥ]|dm|db|dbh|dg|ṣṇ|ṣṭ|ṣk|ṣp|ṇḍ|ṇṭ|nd|nt|ṅk|ṅg|ñc|ñj|mp|mb|r[kgcjṭḍtdnpbmyvlśṣsh]|kt|pt|bd|ghn|hm|hn|ry|ly)/;
    const validSpecialOnsets = new Set([
      'hy', 'ṅa', 'ña', 'ṇa', 'ṅe', 'ḷṃ', 'ḹṃ', 'ḷkāro', 'ḷkāra',
      'ṣṭa', 'rtha', 'ṣṭrīḥ', 'ṣṭrī', 'ṣṭri', 'ṣṭoṃ', 'ṣṭau', 'ṣṭrūṃ', 'ṣṭroṃ', 'ṣṭro',
      'rhabhyaḥ',
    ]);

    for (const entry of BUILTIN_DHARANI_CORPUS) {
      const dbKey = entry.provenance.databaseId || entry.categoryId;
      const allIast = entry.verses.map((v) => v.iast).join(' | ');
      const allZh = entry.verses.map((v) => v.classicalTranslitZh || '').join(' | ');
      const meta = `${entry.titleZh} ${entry.titleSanskritIast} ${entry.meritsAndSummaryZh} ${allZh} ${entry.provenance.rawSnippet || ''}`;

      expect(loneSurrogateRe.test(meta + allIast), `lone surrogate in ${entry.id}`).toBe(false);
      expect(puaRe.test(`${entry.titleZh} ${entry.titleSanskritIast} ${allZh} ${allIast}`), `PUA in ${entry.id}`).toBe(false);
      expect(allZh, `unresolved gaiji in ${entry.id}`).not.toMatch(/#(?:CB|SD|RJ)-?[0-9A-Za-z]+|\[(?:CB|SD|RJ)[0-9A-Za-z-]+\]/);
      expect(allIast, `generic fallback in ${entry.id}`).not.toMatch(
        /sarva-tathāgata-hṛdaya-dhāraṇī svāhā|munimuni mahāmuni śākyamuni|oṃ namo bhagavate svāhā/i
      );
      expect(validIastVerseRe.test(allIast), `non-IAST char/digit in ${entry.id}: ${allIast.slice(0, 80)}`).toBe(true);
      expect(encodingOrSiglumLeakRe.test(allIast), `encoding/siglum leak in ${entry.id}: ${allIast.slice(0, 80)}`).toBe(false);

      for (const v of entry.verses) {
        expect(unicodeEnglishLeakRe.test(v.iast), `English/German leak in ${entry.id}: ${v.iast.slice(0, 80)}`).toBe(false);
        if (dbKey === 'db1_fangshan' || dbKey === 'db2_taisho_ext') {
          for (const w of v.iast.toLowerCase().split(/[\s|—–.,:;!?()-]+/).filter(Boolean)) {
            if (w.startsWith("'")) continue;
            const cleanW = w.replace(/'$/g, '');
            if (validSpecialOnsets.has(cleanW) || /^ṣṭrī/.test(cleanW) || /^ḷkār/.test(cleanW)) continue;
            if (cleanW.length >= 2) {
              expect(db12ForbiddenStartRe.test(cleanW), `broken cluster "${cleanW}" in ${entry.id}`).toBe(false);
            }
          }
        }
      }

      if (
        (dbKey === 'db1_fangshan' || dbKey === 'db2_taisho_ext') &&
        entry.id !== 'db2-taisho-T10n0293_arapacana_42'
      ) {
        const rawNoPipes = (entry.provenance.rawSnippet || '').replace(/\s*｜\s*/g, '');
        expect(rawNoPipes, `mid-clause <lb/> CJK space in ${entry.id}`).not.toMatch(
          /[\u4e00-\u9fff]\s+[\u4e00-\u9fff]/
        );
      }
    }
  });

  it('verifies canonical root-cause repairs across representative DB3–DB12 records', () => {
    const byId = new Map(BUILTIN_DHARANI_CORPUS.map((e) => [e.id, e]));

    // DB3: §100 closing dhāraṇī restored
    const db3Sec100 = byId.get('db3-dsbc-sec-100');
    expect(db3Sec100?.verses.map((v) => v.iast).join(' ')).toContain('ye dharmā hetuprabhavā');
    expect(db3Sec100?.verses.map((v) => v.iast).join(' ')).toContain('vajrasattva samayam anupālaya');

    // DB7: 770 CE Hyakumantō darani (Raśmivimalaviśuddhaprabhā)
    const db7Pr = byId.get('db7-cudl-ms-PR-FG-00870');
    expect(db7Pr?.verses.map((v) => v.iast).join(' ')).toContain('vipulagarbhe vipulavimale');

    // DB8: vid=207 Drāmiḍāvidyārājā Sanskrit mantras
    const db8Vid207 = byId.get('db8-polyglotta-vid-207');
    expect(db8Vid207?.verses.map((v) => v.iast).join(' ')).toContain('nimini nimini nimini');

    // DB9: Derge Gzungs 'dus EWTS-to-IAST shad-clause extraction (zero Tibetan prose leak)
    const db9_023 = byId.get('db9-rkts-1D_100_023');
    const db9_023Iast = db9_023?.verses.map((v) => v.iast).join(' ') || '';
    expect(db9_023Iast).toContain('oṃ namo bhagavate');
    expect(db9_023Iast).toContain('avalokite');
    expect(db9_023Iast).toContain('oṃ mohi mohi');
    expect(db9_023Iast).not.toMatch(/rcagsaṅ|dgesloṅ|rdorje/);

    // DB10: Saṃpuṭatantra SA00016.001
    const db10Samputa = byId.get('db10-nibs-ms-SA00016.001');
    expect(db10Samputa?.verses.map((v) => v.iast).join(' ')).toContain('śrīhevajrāya');

    // DB11: CEToM THT 3187 Kizil Nīlakaṇṭha
    const db11Tht = byId.get('db11-cetom-tht3187');
    expect(db11Tht?.verses.map((v) => v.iast).join(' ')).toContain('vimalāmalamūrte svāhā');

    // DB12: OCHS Mantrakoṣa & Mātṛkārṇanighaṇṭu clean of '1a)' and 'ai0'
    const db12Mantrakosa = byId.get('db12-ochs-ochs_000_000_259_mantrakosa');
    expect(db12Mantrakosa?.verses[0].iast).toContain('śrīgaṇeśāya namaḥ');
    expect(db12Mantrakosa?.verses[0].iast).not.toContain('1a)');
  });
});

