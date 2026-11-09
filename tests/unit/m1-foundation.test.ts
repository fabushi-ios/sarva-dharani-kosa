import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import {
  devanagariToSlp1,
  iastToSlp1,
  inputToSlp1,
  slp1ToIast,
  slp1ToDevanagari,
  slp1ToSiddhamUnicode,
  iastToSiddhamUnicode,
  siddhamUnicodeToSlp1,
  ewtsToIast,
  slp1ToIpa,
  iastToIpa
} from '../../src/core/transliterator';

import {
  VOWEL_MAP,
  VOWEL_IPA_MAP,
  CONS_MATRIX,
  SYLLABLE_OVERRIDES,
  TRAD_WORD_REPLACEMENTS
} from '../../src/data/siddhamMatrix';

import {
  VALID_ONSET_PAIRS,
  syllabifySlp1Word,
  resolveModifiers,
  parseAndTransliterateWord,
  analyzeSanskritLine
} from '../../src/core/prosody';

import {
  VOWEL_FORMANTS,
  computeSyllableAcousticProfile,
  synthesizeSyllableAudio,
  playSingleSyllable,
  speakSanskrit
} from '../../src/services/sanskritAudioEngine';

import {
  MAJOR_DHARANIS,
  TEN_SMALL_DHARANIS,
  BUDDHAS_BODHISATTVAS_DHARANIS,
  CURATED_SEED_SYLLABLES,
  BASELINE_CURATED_DHARANIS,
  getDharaniById,
  getDharanisByCategory,
  getSeedSyllableByIastOrSlp1
} from '../../src/data/corpus';

import {
  CBETA_GAIJI_MAP,
  CBETA_AUTH_RECORDS,
  CBETA_TOTAL_TT_ALIGNMENTS
} from '../../src/data/generated/cbetaAuthRecords';

import {
  GRETIL_AUTH_RECORDS,
  GRETIL_BY_FILENAME
} from '../../src/data/generated/gretilAuthRecords';

import { TAISHO_MIKKYO_INDEX } from '../../src/data/generated/taishoMikkyoIndex';

describe('M1 Foundation: Multi-Script Transliteration Engine (src/core/transliterator.ts)', () => {
  it('converts Devanāgarī to SLP1 and back accurately including sacred ॐ and conjuncts', () => {
    const deva = 'ॐ मणिपद्मे हूं । नमो भगवते ॥';
    const slp = devanagariToSlp1(deva);
    expect(slp).toBe('oM maRipadme hUM | namo Bagavate ||');
    expect(slp1ToIast(slp)).toBe('oṃ maṇipadme hūṃ | namo bhagavate ||');
    expect(slp1ToDevanagari(slp)).toBe('ॐ मणिपद्मे हूं । नमो भगवते ॥');
  });

  it('converts IAST and rough English (smart mode) to SLP1 without corrupting Devanāgarī segments', () => {
    expect(iastToSlp1('tadyathā oṃ gate gate pāragate pārasaṃgate bodhi svāhā', 'strict')).toBe(
      'tadyaTA oM gate gate pAragate pArasaMgate boDi svAhA'
    );
    expect(inputToSlp1('om mani padme hum svaha', 'smart')).toBe('oM maRi padme hUM svAhA');
    expect(inputToSlp1('ॐ gate pāragate', 'smart')).toBe('oM gate pAragate');
  });

  it('converts bidirectionally between SLP1/IAST and Unicode Siddhaṃ (U+11580..U+115FF)', () => {
    const iast = 'oṃ maṇi padme hūṃ hrīḥ bhrūṃ';
    const siddham = iastToSiddhamUnicode(iast);
    expect(siddham).toContain('\u{1158C}\u{115BD}'); // 𑖌𑖽 (oṃ)
    expect(siddham).toContain('\u{115A2}\u{1159F}\u{115BF}\u{115A6}\u{115B8}'); // 𑖢𑖟𑖿𑖦𑖸 (padme)
    const roundTripSlp = siddhamUnicodeToSlp1(siddham);
    expect(slp1ToIast(roundTripSlp)).toBe(iast);

    // Verify post-consonantal vocalic l (x) round-trip
    const vocalicL = slp1ToSiddhamUnicode('kxp');
    expect(siddhamUnicodeToSlp1(vocalicL)).toBe('kxp');
  });

  it('converts Tibetan EWTS/rKTs Sanskrit mantras and titles to standard IAST', () => {
    const rktsMantra = 'oM b+ho d+ha ra u ts+tshuSh+ma kro d+ha hU~M phaT swA hA/';
    expect(ewtsToIast(rktsMantra)).toBe('oṃ bhodhara ucchuṣma krodha hūṃ phaṭ svāhā');

    const rktsTitle =
      '1b1(gzungs): @# /rgya gar skad du/ Ar+ya ma hA badzra me ru shi khar kU Ta gA ra d+hA ra NI/';
    expect(ewtsToIast(rktsTitle)).toBe('ārya mahā vajra meru śikhar kūṭagāra dhāraṇī');
  });

  it('generates accurate IPA with context-sensitive Anusvāra assimilation', () => {
    expect(slp1ToIpa('saMgate')).toContain('ŋɡ');
    expect(slp1ToIpa('paYca')).toContain('ɲtɕ');
    expect(iastToIpa('oṃ')).toBe('oːm');
  });
});

describe('M1 Foundation: 34×14 Dual-Track Phonetic Matrix (src/data/siddhamMatrix.ts)', () => {
  it('defines all 14 vowels and all 34 consonants × 8 vowel groups with zero empty cells', () => {
    expect(Object.keys(VOWEL_MAP)).toHaveLength(14);
    expect(Object.keys(VOWEL_IPA_MAP)).toHaveLength(14);
    const consKeys = Object.keys(CONS_MATRIX);
    expect(consKeys).toHaveLength(34);

    for (const key of consKeys) {
      const entry = CONS_MATRIX[key];
      expect(entry.m).toHaveLength(8);
      expect(entry.t).toHaveLength(8);
      expect(entry.m.every((s) => s.length > 0)).toBe(true);
      expect(entry.t.every((s) => s.length > 0)).toBe(true);
    }

    expect(SYLLABLE_OVERRIDES['oM'].t).toBe('唵');
    expect(SYLLABLE_OVERRIDES['BrUM'].t).toBe('勃');
    expect(TRAD_WORD_REPLACEMENTS['pArasaMgate']).toBe('波罗僧揭谛');
  });
});

describe('M1 Foundation: 3-Pass Akṣara Syllabifier, Sandhi & Chandas Prosody (src/core/prosody.ts)', () => {
  it('splits medial consonant clusters into coda + onset according to Sanskrit Chandas rules', () => {
    expect(VALID_ONSET_PAIRS.has('pr')).toBe(true);
    expect(VALID_ONSET_PAIRS.has('jY')).toBe(true);

    // budDa -> bud + Da
    const buddhaTokens = syllabifySlp1Word('budDa');
    expect(buddhaTokens).toHaveLength(2);
    expect(buddhaTokens[0]).toMatchObject({ onset: 'b', vowel: 'u', coda: 'd' });
    expect(buddhaTokens[1]).toMatchObject({ onset: 'D', vowel: 'a', coda: '' });

    // prajYApAramitA -> pra + jYA + pA + ra + mi + tA
    const prajnaTokens = syllabifySlp1Word('prajYApAramitA');
    expect(prajnaTokens.map((t) => `${t.onset}${t.vowel}${t.coda}`)).toEqual([
      'pra',
      'jYA',
      'pA',
      'ra',
      'mi',
      'tA'
    ]);
  });

  it('resolves Anusvāra place-of-articulation assimilation and Visarga vowel-echo', () => {
    const velar = resolveModifiers('M', 'a', 'g', true);
    expect(velar.mMod).toBe('昂');
    expect(velar.tMod).toBe('僧');
    expect(velar.sandhiNotes[0]).toContain('[ŋ]');

    const palatal = resolveModifiers('M', 'a', 'c', true);
    expect(palatal.mMod).toBe('恩');
    expect(palatal.sandhiNotes[0]).toContain('[ɲ]');

    const dental = resolveModifiers('M', 'a', 't', true);
    expect(dental.mMod).toBe('恩');
    expect(dental.sandhiNotes[0]).toContain('[n]');

    const visargaI = resolveModifiers('H', 'I', '', true);
    expect(visargaI.mMod).toBe('希');
    expect(visargaI.tMod).toBe('醯');
  });

  it('analyzes full Sanskrit mantra lines with Guru/Laghu prosody and Tang reconstructions', () => {
    const line = analyzeSanskritLine('gate gate pāragate pārasaṃgate bodhi svāhā');
    expect(line.words).toHaveLength(6);

    // 'gate' -> ga (Laghu ⏑) + te (Guru —)
    const gateWord = line.words[0];
    expect(gateWord.wordTangReconstruction).toBe('揭谛');
    expect(gateWord.syllables[0].weight).toBe('Laghu');
    expect(gateWord.syllables[1].weight).toBe('Guru');

    // 'pārasaṃgate' -> pā (Guru) + ra (Laghu) + saṃ (Guru, assimilated to [ŋ]) + ga (Laghu) + te (Guru)
    const parasamgateWord = line.words[3];
    expect(parasamgateWord.wordTangReconstruction).toBe('波罗僧揭谛');
    expect(parasamgateWord.syllables.map((s) => s.weight)).toEqual([
      'Guru',
      'Laghu',
      'Guru',
      'Laghu',
      'Guru'
    ]);
    expect(parasamgateWord.syllables[2].modernPhonetic).toBe('萨昂');
  });
});

describe('M1 Foundation: Web Audio 136.1 Hz Formant Engine (src/services/sanskritAudioEngine.ts)', () => {
  it('computes deterministic acoustic profiles and runs headless synthesis safely', () => {
    expect(Object.keys(VOWEL_FORMANTS)).toHaveLength(14);
    const omProfile = computeSyllableAcousticProfile('oM', 0.85);
    expect(omProfile.fundamentalHz).toBe(136.1);
    expect(omProfile.subHarmonicHz).toBe(272.2);
    expect(omProfile.f1).toBe(460);
    expect(omProfile.f2).toBe(920);
    expect(omProfile.hasNasal).toBe(true);
    expect(omProfile.durationSec).toBeCloseTo(0.48, 2);

    const dur = synthesizeSyllableAudio('hrIH', 0, 0.85);
    expect(dur).toBeGreaterThan(0.3);

    const singleDur = playSingleSyllable('hūṃ', { mode: 'synth', rate: 0.85 });
    expect(singleDur).toBeGreaterThan(0.4);

    const spoken = speakSanskrit('oṃ maṇi padme hūṃ', { mode: 'synth' });
    expect(spoken.modeUsed).toBe('synth');
    expect(spoken.totalDurationSec).toBeGreaterThan(1.0);
    spoken.stop();
  });
});

describe('M1 Foundation: Baseline Authoritative Datasets & Webfont (F1)', () => {
  it('bundles a valid NotoSansSiddham-Regular.woff2 binary font with wOF2 magic header', () => {
    const fontPath = path.resolve(process.cwd(), 'public/fonts/NotoSansSiddham-Regular.woff2');
    expect(fs.existsSync(fontPath)).toBe(true);
    const buf = fs.readFileSync(fontPath);
    expect(buf.length).toBe(47208);
    expect(buf.slice(0, 4).toString('ascii')).toBe('wOF2');
  });

  it('loads all 2,240 CBETA Gaiji mappings (2,074 SD-* and 166 RJ-*)', () => {
    const keys = Object.keys(CBETA_GAIJI_MAP);
    expect(keys).toHaveLength(2240);
    const sdKeys = keys.filter((k) => k.startsWith('SD-'));
    const rjKeys = keys.filter((k) => k.startsWith('RJ-'));
    expect(sdKeys).toHaveLength(2074);
    expect(rjKeys).toHaveLength(166);

    const ka = CBETA_GAIJI_MAP['SD-A440'];
    expect(ka.siddhamUnicode).toBe('𑖎');
    expect(ka.unicodeChar).toBe('𑖎');
    expect(ka.iast).toBe('ka');
    expect(ka.romanized).toBe('ka');
    expect(ka.devanagari).toBe('क');

    const kaa = CBETA_GAIJI_MAP['SD-A441'];
    expect(kaa.siddhamUnicode).toBe('𑖎𑖯');
    expect(kaa.iast).toBe('kā');
  });

  it('extracts all 19 core CBETA scriptures and 916 <body> <cb:tt> alignments with zero PUA leakage', () => {
    expect(CBETA_AUTH_RECORDS).toHaveLength(19);
    expect(CBETA_TOTAL_TT_ALIGNMENTS).toBe(916);

    const ttSum = CBETA_AUTH_RECORDS.reduce((acc, r) => acc + r.ttAlignments.length, 0);
    expect(ttSum).toBe(916);

    const puaRegex = /[\uE000-\uF8FF]|[\u{F0000}-\u{10FFFF}]/u;
    for (const rec of CBETA_AUTH_RECORDS) {
      expect(rec.dharaniBlocks.length).toBeGreaterThanOrEqual(1);
      expect(puaRegex.test(rec.title)).toBe(false);
      for (const blk of rec.dharaniBlocks) {
        expect(puaRegex.test(blk.chineseText)).toBe(false);
      }
      for (const tt of rec.ttAlignments) {
        expect(puaRegex.test(tt.chineseZi)).toBe(false);
      }
    }

    const t14n0450 = CBETA_AUTH_RECORDS.find((r) => r.xmlId === 'T14n0450');
    expect(t14n0450).toBeDefined();
    expect(t14n0450!.dharaniBlocks[0].chineseText).toContain('鞞殺逝');
  });

  it('indexes all 614 Taishō Mikkyō scriptures across T18–T21 with exact case-sensitive xmlIds', () => {
    expect(TAISHO_MIKKYO_INDEX).toHaveLength(614);
    const byVol = { T18: 0, T19: 0, T20: 0, T21: 0 };
    for (const item of TAISHO_MIKKYO_INDEX) {
      byVol[item.vol]++;
    }
    expect(byVol).toEqual({ T18: 76, T19: 126, T20: 184, T21: 228 });

    expect(TAISHO_MIKKYO_INDEX.some((x) => x.xmlId === 'T18n0852a')).toBe(true);
    expect(TAISHO_MIKKYO_INDEX.some((x) => x.xmlId === 'T19n0974B')).toBe(true);
  });

  it('loads all 25 canonical GRETIL works (27 .htm files) and preserves Leiden editorial restorations', () => {
    expect(GRETIL_AUTH_RECORDS).toHaveLength(25);
    expect(GRETIL_BY_FILENAME['prajnhsu.htm']).toBeDefined();
    expect(GRETIL_BY_FILENAME['psarkdhu.htm']).toBeDefined();
    expect(GRETIL_BY_FILENAME['vjviddhu.htm']).toBeDefined();

    const ekmuhr = GRETIL_BY_FILENAME['ekmuhr_u.htm'];
    expect(ekmuhr).toBeDefined();
    const joinedText = ekmuhr.fullTextLines.join(' ');
    expect(joinedText).toContain('sarvatathāgataiḥ');
    expect(ekmuhr.apparatusVariants.length).toBeGreaterThan(0);
  });

  it('provides 28 curated multi-script dhāraṇīs and 12 esoteric seed syllables', () => {
    expect(MAJOR_DHARANIS).toHaveLength(6);
    expect(TEN_SMALL_DHARANIS).toHaveLength(10);
    expect(BUDDHAS_BODHISATTVAS_DHARANIS).toHaveLength(12);
    expect(BASELINE_CURATED_DHARANIS).toHaveLength(28);
    expect(CURATED_SEED_SYLLABLES).toHaveLength(12);

    for (const item of BASELINE_CURATED_DHARANIS) {
      expect(item.verses.length).toBeGreaterThanOrEqual(1);
      for (const v of item.verses) {
        expect(v.iast.length).toBeGreaterThan(5);
        expect(v.devanagari.length).toBeGreaterThan(3);
        expect(v.siddham.length).toBeGreaterThan(3);
        expect(v.tangChinese.length).toBeGreaterThan(3);
        expect(v.words.length).toBeGreaterThanOrEqual(1);
      }
    }

    expect(getDharaniById('usnisavijaya-dharani')?.taishoId).toBe('T19n0974B');
    expect(getDharanisByCategory('ten-small-dharanis')).toHaveLength(10);
    expect(getSeedSyllableByIastOrSlp1('bhrūṃ')?.tangChinese).toBe('勃籠');
  });
});
