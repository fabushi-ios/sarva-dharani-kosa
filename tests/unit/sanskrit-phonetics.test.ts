import { describe, it, expect } from 'vitest';
import { analyzeSanskritProsody } from '../../src/core/sanskrit/prosody';
import { iastToDevanagari, iastToIpa } from '../../src/core/sanskrit/transliterator';
import {
  enrichSyllablesWithPhonetics,
  generateVerseChinesePhonetics,
  mapSyllableToChinesePhonetics,
} from '../../src/core/sanskrit/phoneticMapper';
import {
  VITS_INHERENT_A_MARKER,
  conditionDevanagariWordForVits,
  normalizeSikshaDevanagari,
  shapeVitsWaveform24kWithDurations,
  upsample24kTo48kAndMaster,
} from '../../src/services/audio/browserOnnxTtsEngine';
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
      expect(fullIast).not.toMatch(/\baa+\b|divāaḥ|sūrya\s+(?:aṇa|ra)|\bṭpa/);
    }
  });
});

