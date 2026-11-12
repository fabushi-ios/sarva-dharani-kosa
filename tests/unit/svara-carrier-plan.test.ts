import { describe, expect, it } from 'vitest';

import {
  buildSingleSyllableProsodicPlan,
  normalizeSikshaDevanagari,
  shapeVitsWaveform24kWithDurations,
  SVARA_CARRIER_TABLE,
} from '../../src/services/audio/browserOnnxTtsEngine';

const SVARAS = ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ऋ', 'ॠ', 'ऌ', 'ॡ', 'ए', 'ओ', 'अः', 'अँ'];

describe('Isolated Svara carrier (lone-vowel onset artefact fix)', () => {
  it('routes every standalone Svara through a repeated-vowel carrier for both voices', () => {
    for (const voice of ['male', 'female'] as const) {
      for (const deva of SVARAS) {
        const { clauses } = normalizeSikshaDevanagari(deva, true);
        const cl = clauses[0];
        const plan = buildSingleSyllableProsodicPlan(
          cl.vitsText,
          Boolean(cl.isBareVirama),
          Boolean(cl.hadLongVocalic),
          voice
        );
        expect(plan.carrierRepeats, `${voice} ${deva} -> ${cl.vitsText}`).toBeGreaterThan(1);
        expect(plan.carrierHead).toBeGreaterThanOrEqual(1);
        expect(plan.inferenceText).toBe(`${cl.vitsText.repeat(plan.carrierRepeats!)} ।`);
        expect(plan.baseLengthScale).toBeGreaterThan(1);
      }
    }
  });

  it('keeps table entries consistent (head < repeats)', () => {
    for (const voice of ['male', 'female'] as const) {
      for (const [, [reps, head]] of Object.entries(SVARA_CARRIER_TABLE[voice])) {
        expect(head).toBeGreaterThanOrEqual(1);
        expect(reps).toBeGreaterThan(head);
      }
    }
  });

  it('drops leading repetitions and keeps only the steady middle repetition', () => {
    // 'उउउउ ।' => chars [उ,उ,उ,उ,' ','।'], 13 tokens; durations 2 frames each.
    const chars = ['उ', 'उ', 'उ', 'उ', ' ', '।'];
    const durs = new Array(chars.length * 2 + 1).fill(2);
    const wav = new Float32Array(durs.reduce((a, b) => a + b, 0) * 256).fill(0.1);
    const out = shapeVitsWaveform24kWithDurations(wav, chars, durs, 1.0, false, 3, 2);
    // keep char index 2 (token 5) + trailing blank (token 6) => 4 frames
    expect(out.wav24k.length).toBe(4 * 256);
    expect(out.durs.length).toBe(3);
    expect(out.durs[0]).toBe(0);
  });
});
