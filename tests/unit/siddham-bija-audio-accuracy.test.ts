import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { SiddhamBijaAcademy } from '../../src/components/SiddhamBijaAcademy';
import { mapSyllableToChinesePhonetics } from '../../src/core/sanskrit/phoneticMapper';
import { analyzeSanskritProsody } from '../../src/core/sanskrit/prosody';
import {
  iastToDevanagari,
  iastToIpa,
  siddhamToIast,
} from '../../src/core/sanskrit/transliterator';
import {
  iastToSlp1,
  resolveSlp1OrIastToSlp1,
  slp1ToDevanagari,
  slp1ToIast,
} from '../../src/core/transliterator';
import {
  buildSingleSyllableProsodicPlan,
  normalizeSikshaDevanagari,
  shapeVitsWaveform24kWithDurations,
  upsample24kTo48kAndMaster,
  VITS_INHERENT_A_MARKER,
} from '../../src/services/audio/browserOnnxTtsEngine';

describe('Siddhaṃ 18 Chapters & Bīja Syllable Pronunciation Accuracy', () => {
  it('deterministically resolves SLP1, IAST, Devanāgarī, Siddhaṃ, and rough Roman without SLP1/IAST collisions', () => {
    const cases: Array<[string, string, string]> = [
      // SLP1 vs IAST case-sensitive collision pairs
      ['CO', 'CO', 'छौ'],
      ['chau', 'CO', 'छौ'],
      ['cO', 'cO', 'चौ'],
      ['cau', 'cO', 'चौ'],
      ['kf', 'kf', 'कृ'],
      ['kṛ', 'kf', 'कृ'],
      ['Paw', 'Paw', 'फट्'],
      ['phaṭ', 'Paw', 'फट्'],
      ['phat', 'Paw', 'फट्'],
      ['BrUM', 'BrUM', 'भ्रूं'],
      ['bhrūṃ', 'BrUM', 'भ्रूं'],
      ['DIH', 'DIH', 'धीः'],
      ['dhīḥ', 'DIH', 'धीः'],
      ['wa', 'wa', 'ट'],
      ['ṭa', 'wa', 'ट'],
      ['Wo', 'Wo', 'ठो'],
      ['ṭho', 'Wo', 'ठो'],
      ['qa', 'qa', 'ड'],
      ['ḍa', 'qa', 'ड'],
      ['za', 'za', 'ष'],
      ['ṣa', 'za', 'ष'],
      // Vedic retroflex lateral vs vocalic l
      ['La', 'La', 'ळ'],
      ['ḷa', 'La', 'ळ'],
      ['LO', 'LO', 'ळौ'],
      ['ḷau', 'LO', 'ळौ'],
      ['x', 'x', 'ऌ'],
      ['X', 'X', 'ॡ'],
      ['kḷpta', 'kxpta', 'कॢप्त'],
      // Candrabindu Svara
      ['a~', 'a~', 'अँ'],
      ['am\u0310', 'a~', 'अँ'],
      // Siddhaṃ Chapters 8–15 medial clusters
      ['rka', 'rka', 'र्क'],
      ['Nka', 'Nka', 'ङ्क'],
      ['ṅka', 'Nka', 'ङ्क'],
      ['Yca', 'Yca', 'ञ्च'],
      ['ñca', 'Yca', 'ञ्च'],
      ['Rwa', 'Rwa', 'ण्ट'],
      ['ṇṭa', 'Rwa', 'ण्ट'],
      // Devanāgarī, Siddhaṃ, and rough ASCII inputs
      ['छौ', 'CO', 'छौ'],
      ['चौ', 'cO', 'चौ'],
      ['क्', 'k', 'क्'],
      ['𑖌𑖼', 'o~', 'ओँ'],
      ['𑖌𑖽', 'oM', 'ॐ'],
      ['𑖮𑖿𑖨𑖱𑖾', 'hrIH', 'ह्रीः'],
      ['om', 'oM', 'ॐ'],
      ['hum', 'hUM', 'हूं'],
      ['swaha', 'svAhA', 'स्वाहा'],
    ];

    for (const [raw, expectedSlp1, expectedDeva] of cases) {
      const resolved = resolveSlp1OrIastToSlp1(raw);
      expect(resolved, `input=${raw}`).toBe(expectedSlp1);
      expect(slp1ToDevanagari(resolved), `deva for ${raw}`).toBe(expectedDeva);
    }
  });

  it('distinguishes Vedic retroflex lateral ḷ before vowels (ळ / ɭ) from vocalic ḷ (ऌ / कॢप्त)', () => {
    expect(iastToSlp1('ḷa ḷā ḷi ḷū ḷṛ ḷe ḷau')).toBe('La LA Li LU Lf Le LO');
    expect(slp1ToDevanagari(iastToSlp1('ḷa ḷā ḷi ḷū ḷṛ ḷe ḷau'))).toBe('ळ ळा ळि ळू ळृ ळे ळौ');
    expect(iastToDevanagari('ḷa ḷā ḷi ḷū ḷṛ ḷe ḷau')).toBe('ळ ळा ळि ळू ळृ ळे ळौ');
    expect(iastToDevanagari('agnim īḷe purohitam')).toBe('अग्निम् ईळे पुरोहितम्');
    expect(slp1ToIast('La')).toBe('ḷa');

    // True vocalic ḷ before consonants or word-finally remains vocalic ऌ / ॢ
    expect(slp1ToDevanagari(iastToSlp1('kḷpta'))).toBe('कॢप्त');
    expect(iastToDevanagari('kḷpta')).toBe('कॢप्त');
    expect(siddhamToIast('𑖎𑖿𑖩𑖴𑖢𑖿𑖝')).toBe('kḷpta');
    expect(iastToIpa('īḷe')).toContain('ɭ');

    const prosody = analyzeSanskritProsody('ḷa ḷau');
    expect(prosody.length).toBe(2);
    expect(prosody[0].onset).toEqual(['ḻ']);
    expect(prosody[0].weight).toBe('laghu');
    expect(prosody[1].weight).toBe('guru');

    const mapped = mapSyllableToChinesePhonetics('ḷa');
    expect(mapped.modernZh.length).toBeGreaterThan(0);
    expect(mapped.modernZh).not.toMatch(/[a-zA-Z]/);
  });

  it('supplies Śikṣā prosthetic onset अ for Siddhaṃ Ch. 8–15 medial clusters while preserving true initial clusters', () => {
    expect(normalizeSikshaDevanagari('र्क', true).clauses[0].vitsText).toBe(`अर्क${VITS_INHERENT_A_MARKER}`);
    expect(normalizeSikshaDevanagari('र्का', true).clauses[0].vitsText).toBe('अर्का');
    expect(normalizeSikshaDevanagari('ङ्क', true).clauses[0].vitsText).toBe(`अङ्क${VITS_INHERENT_A_MARKER}`);
    expect(normalizeSikshaDevanagari('ञ्च', true).clauses[0].vitsText).toBe(`अञ्च${VITS_INHERENT_A_MARKER}`);
    expect(normalizeSikshaDevanagari('ण्टु', true).clauses[0].vitsText).toBe('अण्टु');

    // True word-initial Sanskrit clusters must NOT receive prosthetic अ
    expect(normalizeSikshaDevanagari('प्र', true).clauses[0].vitsText).toBe(`प्र${VITS_INHERENT_A_MARKER}`);
    expect(normalizeSikshaDevanagari('क्ष', true).clauses[0].vitsText).toBe(`क्ष${VITS_INHERENT_A_MARKER}`);
    expect(normalizeSikshaDevanagari('ज्ञ', true).clauses[0].vitsText).toBe(`ज्ञ${VITS_INHERENT_A_MARKER}`);
  });

  it('builds prosodic Daṇḍa single-syllable plans, preserves diphthong offglides via coreCharCount slicing, and caps floor noise', () => {
    const chauNorm = normalizeSikshaDevanagari('छौ', true).clauses[0];
    const chauPlan = buildSingleSyllableProsodicPlan(
      chauNorm.vitsText,
      Boolean(chauNorm.isBareVirama),
      Boolean(chauNorm.hadLongVocalic)
    );
    expect(chauPlan.inferenceText).toBe('छौ ।');
    expect(chauPlan.useProsodicSlice).toBe(true);
    expect(chauPlan.baseLengthScale).toBeCloseTo(1.15, 3);

    const kaNorm = normalizeSikshaDevanagari('क', true).clauses[0];
    const kaPlan = buildSingleSyllableProsodicPlan(
      kaNorm.vitsText,
      Boolean(kaNorm.isBareVirama),
      Boolean(kaNorm.hadLongVocalic)
    );
    expect(kaPlan.inferenceText).toBe(`क${VITS_INHERENT_A_MARKER} ।`);
    expect(kaPlan.useProsodicSlice).toBe(true);
    expect(kaPlan.baseLengthScale).toBeCloseTo(0.95, 3);

    const viramaNorm = normalizeSikshaDevanagari('क्', true).clauses[0];
    const viramaPlan = buildSingleSyllableProsodicPlan(
      viramaNorm.vitsText,
      Boolean(viramaNorm.isBareVirama),
      Boolean(viramaNorm.hadLongVocalic)
    );
    expect(viramaPlan.inferenceText).toBe(`क${VITS_INHERENT_A_MARKER}`);
    expect(viramaPlan.useProsodicSlice).toBe(false);

    // Verify coreCharCount slicing preserves diphthong offglide frames in durs[4] while cutting ' ' and '।'
    const hop = 256;
    const chars = ['छ', 'ौ', ' ', '।']; // 9 interleaved tokens: _ छ _ ौ _ ' ' _ । _
    const durs = [2, 5, 1, 7, 14, 4, 8, 6, 10]; // total = 57 frames; core (chars 0..1) + 14-frame offglide = 29 frames
    const raw = new Float32Array(57 * hop);
    raw.fill(0.25, 0, 29 * hop);
    raw.fill(0.9, 33 * hop, 57 * hop); // loud simulated Daṇḍa tail that MUST be sliced off

    const shaped = shapeVitsWaveform24kWithDurations(raw, chars, durs, 1.0, false, 2);
    expect(shaped.wav24k.length).toBe(29 * hop);
    let maxVal = 0;
    for (let i = 0; i < shaped.wav24k.length; i++) {
      const a = Math.abs(shaped.wav24k[i]);
      if (a > maxVal) maxVal = a;
    }
    expect(maxVal).toBeLessThanOrEqual(0.26);

    // Verify sub-threshold noise (< 0.05 peak) is capped by 14x guard instead of 400x normalization blast
    const tinyNoise = new Float32Array(2400);
    for (let i = 0; i < tinyNoise.length; i++) {
      tinyNoise[i] = (i % 2 === 0 ? 1 : -1) * 0.002;
    }
    const masteredNoise = upsample24kTo48kAndMaster(tinyNoise, 5, 10);
    let noisePeak = 0;
    for (let i = 0; i < masteredNoise.length; i++) {
      const a = Math.abs(masteredNoise[i]);
      if (a > noisePeak) noisePeak = a;
    }
    expect(noisePeak).toBeLessThan(0.05);
  });

  it('renders SiddhamBijaAcademy 18-chapter selector with clean option labels (zero raw HTML tags in <option>)', () => {
    const html = renderToStaticMarkup(React.createElement(SiddhamBijaAcademy));
    const optionMatches = html.match(/<option[^>]*>[\s\S]*?<\/option>/g) ?? [];
    expect(optionMatches.length).toBe(18);
    for (const opt of optionMatches) {
      expect(opt).not.toContain('&lt;sub&gt;');
      expect(opt).not.toContain('<sub>');
    }
  });
});
