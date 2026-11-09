/**
 * src/services/sanskritAudioEngine.ts
 * Dual-Engine Sanskrit Acoustic Synthesizer (136.1 Hz Om Web Audio API Formant Synthesizer + Web Speech TTS)
 * Ported from sanskrit_phonetic_engine.html (Module 4, lines 1028–1272).
 * 100% safe in both Browser and headless Node.js / Vitest environments.
 */

import { inputToSlp1, slp1ToDevanagari } from '../core/transliterator';
import { syllabifySlp1Word } from '../core/prosody';

export const VOWEL_FORMANTS: Record<string, [number, number, number]> = {
  'a': [720, 1240, 0.22], 'A': [750, 1280, 0.40],
  'i': [300, 2280, 0.22], 'I': [280, 2350, 0.40],
  'u': [320, 820,  0.22], 'U': [300, 780,  0.40],
  'f': [460, 1520, 0.26], 'F': [460, 1550, 0.42],
  'x': [440, 1620, 0.26], 'X': [440, 1650, 0.42],
  'e': [450, 1980, 0.36], 'E': [620, 1850, 0.42],
  'o': [460, 920,  0.36], 'O': [640, 1020, 0.42]
};

export interface SyllableAcousticProfile {
  slpSyl: string;
  vowel: string;
  f1: number;
  f2: number;
  fundamentalHz: number;
  subHarmonicHz: number;
  durationSec: number;
  hasNasal: boolean;
  hasAspirateOrSibilant: boolean;
}

export interface SpeakOptions {
  mode?: 'auto' | 'synth' | 'tts';
  rate?: number;
  onSyllableIndex?: (idx: number) => void;
  onEnd?: () => void;
}

let audioCtx: AudioContext | null = null;
let currentStopTimer: ReturnType<typeof setTimeout> | null = null;
let currentIntervalId: ReturnType<typeof setInterval> | null = null;

function getBrowserAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Pure deterministic calculation of the acoustic formant profile for a single SLP1 syllable.
 * Used by both `synthesizeSyllableAudio` and headless unit tests.
 */
export function computeSyllableAcousticProfile(
  slpSyl: string,
  rate = 0.85
): SyllableAcousticProfile {
  const speedScale = 0.85 / Math.max(0.4, rate);
  let vowel = 'a';
  for (const ch of slpSyl) {
    if (VOWEL_FORMANTS[ch]) {
      vowel = ch;
      break;
    }
  }
  const [f1, f2, baseDur] = VOWEL_FORMANTS[vowel] || [700, 1200, 0.25];
  const hasNasal = slpSyl.includes('M') || slpSyl.includes('~') || /[NYRnm]$/.test(slpSyl);
  const hasAspirateOrSibilant = /[KGCJWQTDPBhHSzs]/.test(slpSyl);
  const durationSec = Number(((baseDur + (hasNasal ? 0.12 : 0)) * speedScale).toFixed(4));

  return {
    slpSyl,
    vowel,
    f1,
    f2,
    fundamentalHz: 136.1,
    subHarmonicHz: 272.2,
    durationSec,
    hasNasal,
    hasAspirateOrSibilant
  };
}

/**
 * Synthesizes a single Sanskrit syllable using the 136.1 Hz "Om" Web Audio API formant synthesizer.
 * In headless Node/Vitest environments where `window.AudioContext` is absent, returns `durationSec` cleanly.
 */
export function synthesizeSyllableAudio(
  slpSyl: string,
  startTimeOffset = 0,
  rate = 0.85
): number {
  const profile = computeSyllableAcousticProfile(slpSyl, rate);
  const ctx = getBrowserAudioContext();
  if (!ctx) {
    return profile.durationSec;
  }

  const { f1, f2, fundamentalHz, subHarmonicHz, durationSec, hasAspirateOrSibilant } = profile;
  const start = ctx.currentTime + startTimeOffset;
  const end = start + durationSec;

  const osc = ctx.createOscillator();
  const subOsc = ctx.createOscillator();
  osc.type = 'sawtooth';
  subOsc.type = 'triangle';
  osc.frequency.setValueAtTime(fundamentalHz, start);
  osc.frequency.exponentialRampToValueAtTime(132.0, end);
  subOsc.frequency.setValueAtTime(subHarmonicHz, start);

  const filter1 = ctx.createBiquadFilter();
  filter1.type = 'bandpass';
  filter1.frequency.setValueAtTime(f1, start);
  filter1.Q.setValueAtTime(5.5, start);

  const filter2 = ctx.createBiquadFilter();
  filter2.type = 'bandpass';
  filter2.frequency.setValueAtTime(f2, start);
  filter2.Q.setValueAtTime(7.0, start);

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.001, start);
  masterGain.gain.linearRampToValueAtTime(0.28, start + 0.035);
  masterGain.gain.setValueAtTime(0.24, Math.max(start + 0.04, end - 0.06));
  masterGain.gain.exponentialRampToValueAtTime(0.001, end);

  osc.connect(filter1);
  osc.connect(filter2);
  subOsc.connect(filter1);
  filter1.connect(masterGain);
  filter2.connect(masterGain);
  masterGain.connect(ctx.destination);

  if (hasAspirateOrSibilant) {
    const bufferSize = Math.floor(ctx.sampleRate * 0.09);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.25;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 2600;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, start);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, start + 0.08);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(start);
  }

  osc.start(start);
  subOsc.start(start);
  osc.stop(end);
  subOsc.stop(end);

  return durationSec;
}

/**
 * Play a single Sanskrit syllable using either Web Speech TTS (if available and requested) or Web Audio Formant Synth.
 */
export function playSingleSyllable(
  rawSlpOrIast: string,
  options: { mode?: 'auto' | 'synth' | 'tts'; rate?: number } = {}
): number {
  const { mode = 'auto', rate = 0.85 } = options;
  const slpSyl = inputToSlp1(rawSlpOrIast, 'smart');
  const devaSyl = slp1ToDevanagari(slpSyl);

  if (
    mode !== 'synth' &&
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined'
  ) {
    const voices = window.speechSynthesis.getVoices();
    const targetVoice =
      voices.find((v) => v.lang.startsWith('sa')) ||
      voices.find((v) => v.lang.startsWith('hi')) ||
      voices.find((v) => v.lang.includes('IN'));
    if (targetVoice || mode === 'tts') {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(devaSyl);
      if (targetVoice) {
        utter.voice = targetVoice;
        utter.lang = targetVoice.lang;
      } else {
        utter.lang = 'hi-IN';
      }
      utter.rate = rate;
      window.speechSynthesis.speak(utter);
      if (targetVoice) {
        return computeSyllableAcousticProfile(slpSyl, rate).durationSec;
      }
    }
  }

  return synthesizeSyllableAudio(slpSyl, 0, rate);
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  if (currentStopTimer) {
    clearTimeout(currentStopTimer);
    currentStopTimer = null;
  }
  if (currentIntervalId) {
    clearInterval(currentIntervalId);
    currentIntervalId = null;
  }
}

/**
 * Speak a full Sanskrit line or mantra with sequential syllable highlighting and automatic Web Audio fallback.
 */
export function speakSanskrit(
  textOrSlp1: string,
  options: SpeakOptions = {}
): { stop: () => void; totalDurationSec: number; modeUsed: 'tts' | 'synth' } {
  stopSpeaking();
  const { mode = 'auto', rate = 0.85, onSyllableIndex, onEnd } = options;
  const slpFull = inputToSlp1(textOrSlp1.trim(), 'smart');
  const devaText = slp1ToDevanagari(slpFull);

  const rawWords = slpFull.replace(/-/g, ' ').split(/\s+/).filter(Boolean);
  const allSyllables: string[] = [];
  for (const w of rawWords) {
    const tokens = syllabifySlp1Word(w);
    for (const tk of tokens) {
      if (!tk.symbol) {
        allSyllables.push((tk.onset || '') + (tk.vowel || '') + (tk.mod || '') + (tk.coda || ''));
      }
    }
  }

  const hasBrowserSpeech =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined';
  const voices = hasBrowserSpeech ? window.speechSynthesis.getVoices() : [];
  const targetVoice =
    voices.find((v) => v.lang.startsWith('sa')) ||
    voices.find((v) => v.lang.startsWith('hi')) ||
    voices.find((v) => v.lang.includes('IN'));

  if (mode === 'synth' || !hasBrowserSpeech || (mode === 'auto' && !targetVoice)) {
    let offset = 0;
    allSyllables.forEach((rawSyl, idx) => {
      const dur = synthesizeSyllableAudio(rawSyl, offset, rate);
      if (onSyllableIndex && typeof window !== 'undefined') {
        const startMs = offset * 1000;
        setTimeout(() => {
          onSyllableIndex(idx);
        }, startMs);
      }
      offset += dur + 0.05;
    });

    if (typeof window !== 'undefined' && onEnd) {
      currentStopTimer = setTimeout(() => {
        onEnd();
      }, offset * 1000 + 120);
    }

    return {
      stop: stopSpeaking,
      totalDurationSec: Number(offset.toFixed(4)),
      modeUsed: 'synth'
    };
  }

  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(devaText);
  if (targetVoice) {
    utter.voice = targetVoice;
    utter.lang = targetVoice.lang;
  } else {
    utter.lang = 'hi-IN';
  }
  utter.rate = rate;

  const stepMs = Math.max(220, Math.round(320 / rate));
  let curIdx = 0;
  currentIntervalId = setInterval(() => {
    if (curIdx >= allSyllables.length) {
      if (currentIntervalId) clearInterval(currentIntervalId);
      return;
    }
    if (onSyllableIndex) onSyllableIndex(curIdx);
    curIdx++;
  }, stepMs);

  utter.onend = () => {
    stopSpeaking();
    if (onEnd) onEnd();
  };
  utter.onerror = () => {
    stopSpeaking();
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utter);

  return {
    stop: stopSpeaking,
    totalDurationSec: Number(((allSyllables.length * stepMs) / 1000).toFixed(4)),
    modeUsed: 'tts'
  };
}
