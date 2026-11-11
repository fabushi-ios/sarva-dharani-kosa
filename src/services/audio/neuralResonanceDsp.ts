/**
 * src/services/audio/neuralResonanceDsp.ts
 *
 * 48,000 Hz Post-Neural Acoustic Resonance & Vedic Svara Chanting DSP Engine
 * Operates directly on the authentic Classical Sanskrit Neural VITS (`sa.onnx` / `sa_female.onnx`)
 * PCM waveform so 100% of Sanskrit consonant bursts, retroflexes, aspirates, visargas, and sandhi
 * coarticulations are preserved while adding two selectable resonance modes:
 *
 * 1. `'hall'` (`neural-resonance-hall` — 殿堂共鸣版: Layers 1 + 3):
 *    - Preserves the neural model's natural expressive speaking prosody (0% pitch alteration)
 *    - Layer 1a: 5-string constant-peak-gain `136.1 Hz` (Ṣaḍja) sympathetic resonator bank
 *      (`136.1 Hz` Sa, `204.15 Hz` Pa, `272.2 Hz` Sa', `340.25 Hz` Ga, `408.3 Hz` Pa') excited
 *      organically by the voice + subtle Tanpura silk & optional `544.4 Hz` singing bowl chime
 *    - Layer 1b: 4×4 Hadamard Feedback Delay Network (FDN) stereo stone-sanctum reverb with `18 ms`
 *      Haas pre-delay (keeping consonants front-and-center) & warm high-frequency damping
 *    - Layer 3: Envelope-gated sub-harmonic chest warmth (`68.05 Hz` + `136.1 Hz`) blooming on
 *      voiced vowels and nasal codas (`ṃ / nām / hūṃ`)
 *
 * 2. `'vedic-chant'` (`neural-vedic-chant` — 定调梵呗版: Layers 1 + 2 + 3):
 *    - Layer 2: Strict Voiced/Unvoiced YIN pitch-track separation + epoch-synchronized,
 *      formant-preserving TD-PSOLA pitch locking. Plosives, aspirates, and sibilants bypass 100%
 *      bit-for-bit untouched, while voiced vowel nuclei gently lock onto the `136.1 Hz` Vedic Svara
 *      chanting scale (Laghu steady on tonic `Sa = 136.1 Hz`, Guru rising in solemn *Svarita*
 *      inflection `~148.1 Hz -> 136.1 Hz`, verse-final *Nyāsa* cadence on pure `136.1 Hz`;
 *      female voice locks harmonically onto `Pa = 204.15 Hz` or `Sa' = 272.2 Hz`).
 *    - Layers 1 + 3: Full sympathetic string resonance (now ringing in exact harmonic unison with
 *      the pitch-locked vowels), sub-harmonic chest warmth, and stereo sanctum FDN reverb.
 */

export type NeuralResonanceVariant = 'hall' | 'vedic-chant';

export interface ResonanceSyllableSpan {
  syl: {
    weight: 'guru' | 'laghu';
    iast: string;
    vowel: string;
  };
  startSec: number;
  endSec: number;
}

export interface NeuralResonanceOptions {
  sampleRate?: number;
  voice: 'male' | 'female';
  variant: NeuralResonanceVariant;
  timings?: ResonanceSyllableSpan[];
  includeOpeningBell?: boolean;
  tailSec?: number;
}

export interface NeuralResonanceOutput {
  left: Float32Array;
  right: Float32Array;
  durationSec: number;
  tonicHz: number;
}

export interface PitchTrack48k {
  hopSamples: number;
  voiced: Uint8Array;
  f0Hz: Float32Array;
  medianVoicedHz: number;
}

export const COSMIC_SA_HZ = 136.1;

interface BiquadBandpassState {
  b0: number;
  b2: number;
  a1: number;
  a2: number;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  gain: number;
  panL: number;
  panR: number;
}

function createConstantPeakBandpass(
  freqHz: number,
  q: number,
  sampleRate: number,
  gain: number,
  pan: number // -1 (left) .. +1 (right)
): BiquadBandpassState {
  const w0 = (2 * Math.PI * freqHz) / sampleRate;
  const sinW0 = Math.sin(w0);
  const cosW0 = Math.cos(w0);
  const alpha = sinW0 / (2 * Math.max(0.5, q));
  const invA0 = 1 / (1 + alpha);

  // Equal-power stereo panning
  const angle = ((Math.max(-1, Math.min(1, pan)) + 1) * Math.PI) / 4;
  return {
    b0: alpha * invA0,
    b2: -alpha * invA0,
    a1: (-2 * cosW0) * invA0,
    a2: (1 - alpha) * invA0,
    x1: 0,
    x2: 0,
    y1: 0,
    y2: 0,
    gain,
    panL: Math.cos(angle),
    panR: Math.sin(angle),
  };
}

/**
 * Estimates frame-level voicing and fundamental frequency `f0` on 48,000 Hz speech
 * using 3x anti-aliased decimation (16,000 Hz) + YIN cumulative mean normalized difference,
 * with strict ZCR and high-frequency frication guards so Sanskrit consonants (`k/t/p/bh/ś/ṣ/s/ḥ`)
 * are never misclassified as voiced vowel nuclei.
 */
export function estimatePitchTrack48k(
  dry: Float32Array,
  sampleRate = 48000,
  voice: 'male' | 'female' = 'male'
): PitchTrack48k {
  const hopSamples = Math.max(60, Math.round(0.005 * sampleRate)); // 5ms (240 samples @ 48kHz)
  const n = dry.length;
  const numFrames = Math.max(1, Math.ceil(n / hopSamples));
  const voiced = new Uint8Array(numFrames);
  const f0Hz = new Float32Array(numFrames);

  if (n < Math.round(0.025 * sampleRate)) {
    return {
      hopSamples,
      voiced,
      f0Hz,
      medianVoicedHz: voice === 'female' ? 204.15 : COSMIC_SA_HZ,
    };
  }

  // 3x boxcar-smoothed decimation to ~16kHz for fast, clean YIN pitch analysis
  const dec = 3;
  const srDec = sampleRate / dec;
  const nDec = Math.floor(n / dec);
  const xDec = new Float32Array(nDec);
  const invThree = 1 / 3;
  for (let i = 0, j = 0; i < nDec; i++, j += 3) {
    xDec[i] = (dry[j] + dry[j + 1] + dry[j + 2]) * invThree;
  }

  const minF0 = voice === 'female' ? 145 : 82;
  const maxF0 = voice === 'female' ? 380 : 240;
  const tauMin = Math.max(8, Math.floor(srDec / maxF0));
  const tauMax = Math.min(Math.floor(nDec / 2) - 2, Math.ceil(srDec / minF0));

  if (tauMax <= tauMin + 2) {
    return {
      hopSamples,
      voiced,
      f0Hz,
      medianVoicedHz: voice === 'female' ? 204.15 : COSMIC_SA_HZ,
    };
  }

  const winDec = Math.min(Math.round(0.02 * srDec), Math.max(32, nDec - tauMax - 2));
  const halfWin48 = Math.round(0.01 * sampleRate);
  const diff = new Float64Array(tauMax + 1);
  const cmndf = new Float64Array(tauMax + 1);

  for (let f = 0; f < numFrames; f++) {
    const center48 = Math.min(n - 1, f * hopSamples + Math.floor(hopSamples / 2));
    const wStart = Math.max(0, center48 - halfWin48);
    const wEnd = Math.min(n, center48 + halfWin48);
    const wLen = wEnd - wStart;
    if (wLen < 64) continue;

    let energy = 0;
    let hfDiffEnergy = 0;
    let zc = 0;
    let prev = dry[wStart];
    for (let i = wStart; i < wEnd; i++) {
      const s = dry[i];
      energy += s * s;
      const ds = s - prev;
      hfDiffEnergy += ds * ds;
      if ((s >= 0 && prev < 0) || (s < 0 && prev >= 0)) {
        zc++;
      }
      prev = s;
    }

    const rms = Math.sqrt(energy / wLen);
    const zcrPerSec = (zc * sampleRate) / wLen;
    const hfRatio = hfDiffEnergy / Math.max(1e-12, energy);

    // Reject silence, sibilants (ś/ṣ/s), visarga (ḥ), and unvoiced aspirate bursts
    if (rms < 0.012 || zcrPerSec > 2800 || hfRatio > 0.36) {
      continue;
    }

    const centerDec = Math.floor(center48 / dec);
    const sDec = Math.max(0, Math.min(nDec - winDec - tauMax - 1, centerDec - Math.floor(winDec / 2)));

    cmndf[0] = 1.0;
    let runningSum = 0;
    for (let tau = 1; tau <= tauMax; tau++) {
      let sumSq = 0;
      for (let j = 0; j < winDec; j++) {
        const d = xDec[sDec + j] - xDec[sDec + j + tau];
        sumSq += d * d;
      }
      diff[tau] = sumSq;
      runningSum += sumSq;
      cmndf[tau] = runningSum > 1e-12 ? (sumSq * tau) / runningSum : 1.0;
    }

    let bestTau = -1;
    for (let tau = tauMin; tau < tauMax; tau++) {
      if (cmndf[tau] < 0.18 && cmndf[tau] <= cmndf[tau + 1]) {
        bestTau = tau;
        break;
      }
    }

    if (bestTau < 0) {
      let minVal = 1.0;
      let minIdx = -1;
      for (let tau = tauMin; tau <= tauMax; tau++) {
        if (cmndf[tau] < minVal) {
          minVal = cmndf[tau];
          minIdx = tau;
        }
      }
      if (minIdx >= tauMin && minVal < 0.23) {
        bestTau = minIdx;
      }
    }

    if (bestTau >= tauMin) {
      let refinedTau = bestTau;
      if (bestTau > 1 && bestTau < tauMax) {
        const ym1 = cmndf[bestTau - 1];
        const y0 = cmndf[bestTau];
        const yp1 = cmndf[bestTau + 1];
        const denom = 2 * (2 * y0 - ym1 - yp1);
        if (Math.abs(denom) > 1e-9) {
          const delta = Math.max(-0.5, Math.min(0.5, (ym1 - yp1) / denom));
          refinedTau = bestTau + delta;
        }
      }
      const estHz = srDec / refinedTau;
      if (estHz >= minF0 && estHz <= maxF0) {
        voiced[f] = 1;
        f0Hz[f] = estHz;
      }
    }
  }

  // Bridge single-frame dropouts inside stable vowels
  for (let f = 1; f < numFrames - 1; f++) {
    if (!voiced[f] && voiced[f - 1] && voiced[f + 1]) {
      const a = f0Hz[f - 1];
      const b = f0Hz[f + 1];
      if (Math.abs(a - b) / Math.max(1, a) < 0.12) {
        voiced[f] = 1;
        f0Hz[f] = 0.5 * (a + b);
      }
    }
  }

  // Suppress ultra-short blips (< 4 frames = 20ms) and erode 1 frame (5ms) at edges
  // so plosive burst-to-vowel formant transitions remain 100% untouched
  let idx = 0;
  while (idx < numFrames) {
    if (!voiced[idx]) {
      idx++;
      continue;
    }
    let end = idx;
    while (end + 1 < numFrames && voiced[end + 1]) {
      end++;
    }
    const len = end - idx + 1;
    if (len < 4) {
      for (let k = idx; k <= end; k++) {
        voiced[k] = 0;
        f0Hz[k] = 0;
      }
    } else if (len >= 6) {
      voiced[idx] = 0;
      f0Hz[idx] = 0;
      voiced[end] = 0;
      f0Hz[end] = 0;
    }
    idx = end + 1;
  }

  // 3-point median + gentle [1,2,1]/4 smoothing within voiced islands
  const smoothed = new Float32Array(f0Hz);
  for (let f = 1; f < numFrames - 1; f++) {
    if (voiced[f] && voiced[f - 1] && voiced[f + 1]) {
      const a = f0Hz[f - 1];
      const b = f0Hz[f];
      const c = f0Hz[f + 1];
      const med = a > b ? (b > c ? b : a > c ? c : a) : a > c ? a : b > c ? c : b;
      smoothed[f] = med;
    }
  }
  for (let f = 1; f < numFrames - 1; f++) {
    if (voiced[f] && voiced[f - 1] && voiced[f + 1]) {
      f0Hz[f] = 0.25 * smoothed[f - 1] + 0.5 * smoothed[f] + 0.25 * smoothed[f + 1];
    } else {
      f0Hz[f] = smoothed[f];
    }
  }

  const voicedVals: number[] = [];
  for (let f = 0; f < numFrames; f++) {
    if (voiced[f] && f0Hz[f] > 0) {
      voicedVals.push(f0Hz[f]);
    }
  }
  voicedVals.sort((a, b) => a - b);
  const defaultMedian = voice === 'female' ? 204.15 : COSMIC_SA_HZ;
  const medianVoicedHz =
    voicedVals.length > 0 ? voicedVals[Math.floor(voicedVals.length / 2)] : defaultMedian;

  return {
    hopSamples,
    voiced,
    f0Hz,
    medianVoicedHz,
  };
}

function resolveVedicTonicHz(voice: 'male' | 'female', medianVoicedHz: number): number {
  if (voice === 'male') {
    return COSMIC_SA_HZ; // 136.10 Hz (Ṣaḍja)
  }
  // Female voice: lock to pure 3:2 Pañcama (204.15 Hz) or 2:1 Octave Sa' (272.20 Hz)
  // whichever is closest to the speaker's natural register to preserve natural vocal timbre
  return medianVoicedHz >= 240 ? COSMIC_SA_HZ * 2.0 : COSMIC_SA_HZ * 1.5;
}

function computeSvaraContourHz(
  sec: number,
  tonicHz: number,
  timings?: ResonanceSyllableSpan[]
): number {
  if (!timings || timings.length === 0) {
    return tonicHz;
  }

  // Binary search or linear scan over verse syllables (typically 4..32 syllables)
  let sylIdx = -1;
  for (let i = 0; i < timings.length; i++) {
    const t = timings[i];
    if (sec >= t.startSec && sec <= t.endSec) {
      sylIdx = i;
      break;
    }
    if (sec > t.endSec) {
      sylIdx = i;
    }
  }

  if (sylIdx < 0) {
    return tonicHz;
  }

  const cur = timings[sylIdx];
  const dur = Math.max(0.04, cur.endSec - cur.startSec);
  const norm = Math.max(0, Math.min(1, (sec - cur.startSec) / dur));
  const isFinalSyl = sylIdx === timings.length - 1;
  const nextIsGuru = sylIdx + 1 < timings.length && timings[sylIdx + 1].syl.weight === 'guru';

  let baseHz = tonicHz;
  if (isFinalSyl) {
    // Verse-final Nyāsa cadence: settle serenely onto pure tonic Sa
    const settle = 0.5 * (1 + Math.cos(Math.PI * norm));
    baseHz = tonicHz * (1 + 0.018 * settle);
  } else if (cur.syl.weight === 'guru') {
    // Vedic Udātta / Svarita inflection on heavy 2-mātrā syllable (~ +1.35 semitones -> tonic)
    let arch: number;
    if (norm < 0.28) {
      arch = 0.5 * (1 - Math.cos((Math.PI * norm) / 0.28));
    } else {
      arch = 0.5 * (1 + Math.cos((Math.PI * (norm - 0.28)) / 0.72));
    }
    baseHz = tonicHz * (1 + 0.082 * arch);
  } else if (nextIsGuru && norm > 0.65) {
    // Subtle Anudātta preparatory dip before a heavy Guru syllable
    const dip = 0.5 * (1 - Math.cos((Math.PI * (norm - 0.65)) / 0.35));
    baseHz = tonicHz * (1 - 0.012 * dip);
  }

  // Subtle organic human breath vibrato after 75ms of sustained vowel
  const elapsedInSyl = Math.max(0, sec - cur.startSec);
  const vibRamp = elapsedInSyl > 0.075 ? Math.min(1, (elapsedInSyl - 0.075) / 0.12) : 0;
  const vibrato = 1 + 0.0032 * vibRamp * Math.sin(2 * Math.PI * 4.8 * sec);

  return baseHz * vibrato;
}

/**
 * Applies Voiced/Unvoiced-separated, epoch-synchronized TD-PSOLA so voiced vowel nuclei
 * lock onto the `136.1 Hz` Vedic Svara chanting contour while preserving 100% of consonant
 * transients and original vocal tract formants (F1/F2/F3/F4).
 */
export function applyVoicedTdPsola48k(
  dry: Float32Array,
  sampleRate = 48000,
  voice: 'male' | 'female' = 'male',
  timings?: ResonanceSyllableSpan[],
  pitchTrackOverride?: PitchTrack48k
): { pcm: Float32Array; tonicHz: number } {
  const n = dry.length;
  const out = new Float32Array(dry);
  const track = pitchTrackOverride ?? estimatePitchTrack48k(dry, sampleRate, voice);
  const tonicHz = resolveVedicTonicHz(voice, track.medianVoicedHz);
  const { hopSamples, voiced, f0Hz } = track;
  const numFrames = voiced.length;

  const sampleF0At = (sampleIdx: number): number => {
    const exactF = Math.max(0, Math.min(numFrames - 1, sampleIdx / hopSamples));
    const f0 = Math.floor(exactF);
    const f1 = Math.min(numFrames - 1, f0 + 1);
    const frac = exactF - f0;
    const hz0 = f0Hz[f0] > 0 ? f0Hz[f0] : tonicHz;
    const hz1 = f0Hz[f1] > 0 ? f0Hz[f1] : hz0;
    return hz0 + (hz1 - hz0) * frac;
  };

  let fIdx = 0;
  while (fIdx < numFrames) {
    if (!voiced[fIdx]) {
      fIdx++;
      continue;
    }
    let fEnd = fIdx;
    while (fEnd + 1 < numFrames && voiced[fEnd + 1]) {
      fEnd++;
    }

    const iStart = Math.max(0, fIdx * hopSamples);
    const iEnd = Math.min(n - 1, (fEnd + 1) * hopSamples - 1);

    if (iEnd - iStart >= Math.round(0.025 * sampleRate)) {
      // Determine dominant glottal impulse polarity across this voiced vowel island
      let maxPos = 0;
      let maxNeg = 0;
      for (let i = iStart; i <= iEnd; i++) {
        const v = dry[i];
        if (v > maxPos) maxPos = v;
        if (-v > maxNeg) maxNeg = -v;
      }
      const polarity = maxNeg > maxPos * 1.15 ? -1 : 1;

      // Extract pitch-synchronous glottal epoch marks
      const marks: number[] = [];
      const pInit = Math.max(80, Math.min(640, Math.round(sampleRate / sampleF0At(iStart))));
      const firstSearchEnd = Math.min(iEnd, iStart + pInit);
      let m0 = iStart;
      let bestPeak = -Infinity;
      for (let i = iStart; i <= firstSearchEnd; i++) {
        const val = polarity * dry[i];
        if (val > bestPeak) {
          bestPeak = val;
          m0 = i;
        }
      }
      marks.push(m0);

      let curMark = m0;
      let maxPeriod = pInit;
      while (curMark < iEnd) {
        const localPeriod = Math.max(
          80,
          Math.min(640, Math.round(sampleRate / sampleF0At(curMark)))
        );
        if (localPeriod > maxPeriod) maxPeriod = localPeriod;
        const searchL = curMark + Math.max(50, Math.round(0.72 * localPeriod));
        const searchR = Math.min(iEnd, curMark + Math.round(1.28 * localPeriod));
        if (searchL >= iEnd || searchR <= searchL) break;

        const expected = curMark + localPeriod;
        let nextMark = expected;
        let bestScore = -Infinity;
        for (let i = searchL; i <= searchR; i++) {
          const distPenalty = 1 - 0.18 * (Math.abs(i - expected) / localPeriod);
          const score = polarity * dry[i] * distPenalty;
          if (score > bestScore) {
            bestScore = score;
            nextMark = i;
          }
        }
        marks.push(nextMark);
        curMark = nextMark;
      }

      if (marks.length >= 3) {
        const firstM = marks[0];
        const lastM = marks[marks.length - 1];
        const islandLeft = Math.max(0, firstM - maxPeriod - 4);
        const islandRight = Math.min(n - 1, lastM + maxPeriod + 4);
        const spanLen = islandRight - islandLeft + 1;

        const psolaSum = new Float32Array(spanLen);
        const psolaWeight = new Float32Array(spanLen);

        let anaIdx = 0;
        let synPos = firstM;

        while (synPos <= lastM) {
          while (
            anaIdx + 1 < marks.length &&
            Math.abs(marks[anaIdx + 1] - synPos) <= Math.abs(marks[anaIdx] - synPos)
          ) {
            anaIdx++;
          }

          const mk = marks[anaIdx];
          const anaPeriod =
            anaIdx > 0 && anaIdx + 1 < marks.length
              ? Math.round(0.5 * (marks[anaIdx + 1] - marks[anaIdx - 1]))
              : anaIdx > 0
                ? marks[anaIdx] - marks[anaIdx - 1]
                : marks[1] - marks[0];
          const safeAnaP = Math.max(80, Math.min(640, anaPeriod));

          const srcHz = sampleRate / safeAnaP;
          const svaraHz = computeSvaraContourHz(synPos / sampleRate, tonicHz, timings);
          // 90% musical lock in log-pitch space with gentle clamp [0.74x .. 1.34x]
          // so extreme micro-intonation never causes unnatural timbre stretching
          const blendedHz = Math.exp(0.1 * Math.log(srcHz) + 0.9 * Math.log(svaraHz));
          const clampedHz = Math.max(srcHz * 0.74, Math.min(srcHz * 1.34, blendedHz));
          const synPeriod = sampleRate / clampedHz;

          const halfW = safeAnaP;
          const centerSyn = Math.round(synPos);
          const dMin = Math.max(-halfW, islandLeft - centerSyn, -mk);
          const dMax = Math.min(halfW, islandRight - centerSyn, n - 1 - mk);

          for (let d = dMin; d <= dMax; d++) {
            const w = 0.5 * (1 + Math.cos((Math.PI * d) / halfW));
            const dstIdx = centerSyn + d - islandLeft;
            psolaSum[dstIdx] += dry[mk + d] * w;
            psolaWeight[dstIdx] += w;
          }

          synPos += synPeriod;
        }

        const activeSpan = lastM - firstM;
        const fadeLen = Math.min(Math.round(0.008 * sampleRate), Math.floor(activeSpan / 4));

        for (let i = firstM; i <= lastM; i++) {
          const bufIdx = i - islandLeft;
          const denom = Math.max(1.0, psolaWeight[bufIdx]);
          const shiftedSample = psolaSum[bufIdx] / denom;

          let alpha = 1.0;
          if (fadeLen > 1) {
            if (i - firstM < fadeLen) {
              alpha = 0.5 * (1 - Math.cos((Math.PI * (i - firstM)) / fadeLen));
            } else if (lastM - i < fadeLen) {
              alpha = 0.5 * (1 - Math.cos((Math.PI * (lastM - i)) / fadeLen));
            }
          }
          out[i] = (1 - alpha) * dry[i] + alpha * shiftedSample;
        }
      }
    }

    fIdx = fEnd + 1;
  }

  return { pcm: out, tonicHz };
}

/**
 * Renders 48,000 Hz stereo PCM combining authentic Sanskrit Neural VITS speech with either:
 * - `'hall'` (`neural-resonance-hall`): Sympathetic `136.1 Hz` string resonators + envelope-gated
 *   sub-harmonic chest warmth + bronze bowl shimmer + 4×4 Hadamard FDN sanctum stereo reverb.
 * - `'vedic-chant'` (`neural-vedic-chant`): All of `'hall'` PLUS Voiced/Unvoiced TD-PSOLA Svara
 *   pitch locking onto the `136.1 Hz` harmonic scale.
 */
export function renderNeuralResonanceStereoPcm(
  dryMonoPcm: Float32Array,
  options: NeuralResonanceOptions
): NeuralResonanceOutput {
  const sampleRate = options.sampleRate || 48000;
  const { voice, variant, timings, includeOpeningBell = true } = options;
  const tailSec = Math.max(0, options.tailSec ?? 0.22);

  // Step 1: Optional Layer 2 (Voiced/Unvoiced TD-PSOLA Svara Pitch Lock for 'vedic-chant')
  const pitchTrack = estimatePitchTrack48k(dryMonoPcm, sampleRate, voice);
  let vocalBase: Float32Array;
  let tonicHz: number;

  if (variant === 'vedic-chant') {
    const locked = applyVoicedTdPsola48k(
      dryMonoPcm,
      sampleRate,
      voice,
      timings,
      pitchTrack
    );
    vocalBase = locked.pcm;
    tonicHz = locked.tonicHz;
  } else {
    vocalBase = dryMonoPcm;
    tonicHz = resolveVedicTonicHz(voice, pitchTrack.medianVoicedHz);
  }

  const dryLen = vocalBase.length;
  const tailSamples = Math.round(tailSec * sampleRate);
  const totalSamples = Math.max(480, dryLen + tailSamples);

  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  // Build per-syllable nasal/guru warmth lookup via linear cursor
  const sylSpans = timings || [];
  let sylCursor = 0;

  // Step 2: Configure Layer 1a — 5-String Constant-Peak Sympathetic Resonator Bank (136.1 Hz Series)
  const isVedic = variant === 'vedic-chant';
  const symGainScale = isVedic ? 0.095 : 0.075;
  const resonators: BiquadBandpassState[] = [
    createConstantPeakBandpass(COSMIC_SA_HZ, 26, sampleRate, symGainScale * 1.0, -0.18),          // 136.10 Hz Sa
    createConstantPeakBandpass(COSMIC_SA_HZ * 1.5, 28, sampleRate, symGainScale * 0.78, 0.24),    // 204.15 Hz Pa
    createConstantPeakBandpass(COSMIC_SA_HZ * 2.0, 30, sampleRate, symGainScale * 0.68, -0.32),   // 272.20 Hz Sa'
    createConstantPeakBandpass(COSMIC_SA_HZ * 2.5, 32, sampleRate, symGainScale * 0.36, 0.38),    // 340.25 Hz Ga' (Jivari)
    createConstantPeakBandpass(COSMIC_SA_HZ * 3.0, 34, sampleRate, symGainScale * 0.42, -0.12),   // 408.30 Hz Pa'
  ];

  // Step 3: Configure Layer 1b — Stereo Stone-Sanctum 4×4 Hadamard FDN Reverb with 18ms Haas Pre-Delay
  const preDelaySamples = Math.max(1, Math.round(0.018 * sampleRate));
  const preDelayBuf = new Float32Array(preDelaySamples);
  let preIdx = 0;

  // Mutually coprime FDN delay lines (~31ms, ~39ms, ~48ms, ~59ms @ 48kHz)
  const scaleSr = sampleRate / 48000;
  const fdnLengths = [
    Math.max(64, Math.round(1493 * scaleSr)),
    Math.max(64, Math.round(1877 * scaleSr)),
    Math.max(64, Math.round(2311 * scaleSr)),
    Math.max(64, Math.round(2837 * scaleSr)),
  ];
  const d0 = new Float32Array(fdnLengths[0]);
  const d1 = new Float32Array(fdnLengths[1]);
  const d2 = new Float32Array(fdnLengths[2]);
  const d3 = new Float32Array(fdnLengths[3]);
  let p0 = 0;
  let p1 = 0;
  let p2 = 0;
  let p3 = 0;
  let lp0 = 0;
  let lp1 = 0;
  let lp2 = 0;
  let lp3 = 0;

  const fdnFeedback = isVedic ? 0.81 : 0.78;
  const fdnDamp = 0.36; // Warm carved-stone HF absorption (> 3.2 kHz)
  let revHpPrevX = 0;
  let revHpPrevY = 0;
  const revHpR = Math.exp((-2 * Math.PI * 115) / sampleRate);

  // Step 4: Configure Layer 3 — Voiced-Gated Sub-Harmonic Chest Warmth Follower
  let lowVocalLp = 0;
  const lowLpAlpha = 1 - Math.exp((-2 * Math.PI * 320) / sampleRate);
  let vocalEnv = 0;
  const envAttack = 1 - Math.exp(-1 / (0.014 * sampleRate));
  const envRelease = 1 - Math.exp(-1 / (0.048 * sampleRate));
  const subChestGainBase = isVedic ? 0.095 : 0.075;
  const droneSilkGain = isVedic ? 0.024 : 0.018;
  const dryGain = isVedic ? 0.87 : 0.89;
  const wetGain = isVedic ? 0.23 : 0.20;

  const subFreq1 = voice === 'female' ? COSMIC_SA_HZ : COSMIC_SA_HZ * 0.5; // 136.1 Hz or 68.05 Hz
  const subFreq2 = voice === 'female' ? COSMIC_SA_HZ * 1.5 : COSMIC_SA_HZ; // 204.15 Hz or 136.1 Hz

  const totalDurSec = totalSamples / sampleRate;
  const fadeInSec = 0.025;
  const fadeOutSec = Math.min(0.18, Math.max(0.035, tailSec > 0 ? tailSec * 0.75 : 0.035));
  const hopSamples = pitchTrack.hopSamples;

  for (let n = 0; n < totalSamples; n++) {
    const t = n / sampleRate;
    const x = n < dryLen ? vocalBase[n] : 0;

    // Advance active syllable pointer for Guru/Nasal warmth weighting
    while (sylCursor + 1 < sylSpans.length && t > sylSpans[sylCursor].endSec) {
      sylCursor++;
    }
    let resonanceBoost = 1.0;
    if (sylSpans.length > 0) {
      const sp = sylSpans[sylCursor];
      if (t >= sp.startSec && t <= sp.endSec) {
        const hasNasal = /[ṃṁmnṇñṅ]/.test(sp.syl.iast);
        if (hasNasal) {
          resonanceBoost = 1.32;
        } else if (sp.syl.weight === 'guru') {
          resonanceBoost = 1.16;
        }
      }
    }

    // Check smooth voicing gate so sub-harmonics never trigger on unvoiced consonants
    const frameIdx = Math.min(pitchTrack.voiced.length - 1, Math.floor(n / hopSamples));
    const isVoicedSample = n < dryLen && pitchTrack.voiced[frameIdx] === 1 ? 1.0 : 0.0;

    lowVocalLp += lowLpAlpha * (x - lowVocalLp);
    const targetEnv = Math.abs(lowVocalLp) * isVoicedSample;
    vocalEnv += (targetEnv > vocalEnv ? envAttack : envRelease) * (targetEnv - vocalEnv);

    // Layer 3: Sub-Harmonic Chest Resonance (phase-continuous 68.05 Hz / 136.1 Hz warmth)
    const chestWarmth =
      vocalEnv *
      subChestGainBase *
      resonanceBoost *
      (0.62 * Math.sin(2 * Math.PI * subFreq1 * t) +
        0.38 * Math.sin(2 * Math.PI * subFreq2 * t));

    // Layer 1a: Sympathetic String Resonator Bank excited directly by the voice
    let symL = 0;
    let symR = 0;
    const symInput = x + chestWarmth * 0.35;
    for (let rIdx = 0; rIdx < resonators.length; rIdx++) {
      const r = resonators[rIdx];
      const y = r.b0 * symInput + r.b2 * r.x2 - r.a1 * r.y1 - r.a2 * r.y2;
      r.x2 = r.x1;
      r.x1 = symInput;
      r.y2 = r.y1;
      r.y1 = y;
      const scaled = y * r.gain * resonanceBoost;
      symL += scaled * r.panL;
      symR += scaled * r.panR;
    }

    // Subtle breathing Tanpura silk + optional gentle opening bronze bowl harmonic (544.4 Hz = 4 * Sa)
    const bedFadeIn = Math.min(1, t / fadeInSec);
    const bedFadeOut = Math.min(1, Math.max(0, (totalDurSec - t) / fadeOutSec));
    const bedEnv = bedFadeIn * bedFadeOut;

    const slowBreath = 0.88 + 0.12 * Math.sin(2 * Math.PI * 0.22 * t);
    const tanpuraSilk =
      bedEnv *
      droneSilkGain *
      slowBreath *
      (0.56 * Math.sin(2 * Math.PI * COSMIC_SA_HZ * t) +
        0.28 * Math.sin(2 * Math.PI * (COSMIC_SA_HZ * 1.5) * t + 0.4) +
        0.16 * Math.sin(2 * Math.PI * (COSMIC_SA_HZ * 2.0) * t + 1.1));

    let bellSample = 0;
    if (includeOpeningBell && t < 1.35) {
      const bellAttack = Math.min(1, t / 0.008);
      const bellDecay = Math.exp(-t * 4.2);
      bellSample =
        bellAttack *
        bellDecay *
        0.036 *
        (Math.sin(2 * Math.PI * (COSMIC_SA_HZ * 4) * t) +
          0.35 * Math.sin(2 * Math.PI * (COSMIC_SA_HZ * 8) * t) +
          0.15 * Math.sin(2 * Math.PI * (COSMIC_SA_HZ * 12) * t));
    }

    // Layer 1b: 115 Hz High-Pass -> 18ms Haas Pre-Delay -> 4×4 Hadamard Stereo Sanctum FDN
    const revInRaw = x * 0.85 + (symL + symR) * 0.55 + bellSample * 0.6;
    const revHp = revInRaw - revHpPrevX + revHpR * revHpPrevY;
    revHpPrevX = revInRaw;
    revHpPrevY = revHp;

    const preDelayed = preDelayBuf[preIdx];
    preDelayBuf[preIdx] = revHp;
    preIdx++;
    if (preIdx >= preDelaySamples) preIdx = 0;

    const o0 = d0[p0];
    const o1 = d1[p1];
    const o2 = d2[p2];
    const o3 = d3[p3];

    // 1-pole warm stone damping inside feedback loop
    lp0 = o0 * (1 - fdnDamp) + lp0 * fdnDamp;
    lp1 = o1 * (1 - fdnDamp) + lp1 * fdnDamp;
    lp2 = o2 * (1 - fdnDamp) + lp2 * fdnDamp;
    lp3 = o3 * (1 - fdnDamp) + lp3 * fdnDamp;

    // Orthogonal 4×4 Hadamard mixing matrix (0.5 * H_4)
    const s01 = lp0 + lp1;
    const d01 = lp0 - lp1;
    const s23 = lp2 + lp3;
    const d23 = lp2 - lp3;

    const h0 = 0.5 * (s01 + s23) * fdnFeedback + preDelayed;
    const h1 = 0.5 * (d01 + d23) * fdnFeedback + preDelayed * 0.85;
    const h2 = 0.5 * (s01 - s23) * fdnFeedback - preDelayed * 0.75;
    const h3 = 0.5 * (d01 - d23) * fdnFeedback + preDelayed * 0.65;

    d0[p0] = h0;
    d1[p1] = h1;
    d2[p2] = h2;
    d3[p3] = h3;

    p0++;
    if (p0 >= fdnLengths[0]) p0 = 0;
    p1++;
    if (p1 >= fdnLengths[1]) p1 = 0;
    p2++;
    if (p2 >= fdnLengths[2]) p2 = 0;
    p3++;
    if (p3 >= fdnLengths[3]) p3 = 0;

    const wetL = (o0 + o2 * 0.82 - o1 * 0.35) * wetGain * bedFadeOut;
    const wetR = (o1 + o3 * 0.82 + o2 * 0.35) * wetGain * bedFadeOut;

    const mixL =
      x * dryGain +
      chestWarmth +
      symL +
      tanpuraSilk * 1.04 +
      bellSample * 1.05 +
      wetL;
    const mixR =
      x * dryGain +
      chestWarmth +
      symR +
      tanpuraSilk * 0.96 +
      bellSample * 0.92 +
      wetR;

    // Transparent soft-knee mastering ceiling (-0.72 dBFS = 0.92) preventing any clipping
    left[n] = softLimitSample(mixL);
    right[n] = softLimitSample(mixR);
  }

  return {
    left,
    right,
    durationSec: totalSamples / sampleRate,
    tonicHz,
  };
}

function softLimitSample(v: number): number {
  const absV = Math.abs(v);
  if (absV <= 0.80) {
    return v;
  }
  const sign = v < 0 ? -1 : 1;
  const excess = (absV - 0.80) / 0.12;
  const compressed = 0.80 + 0.12 * Math.tanh(excess);
  return sign * Math.min(0.92, compressed);
}
