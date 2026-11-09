/**
 * 梵音共振峰吟诵合成与双引擎语音服务 (src/services/sanskritAudioEngine.ts)
 *
 * 1. Web Audio API 136.1Hz ("Om" 禅诵基频) + F1/F2 双共振峰带通滤波器 + 送气/擦音气流包络合成器（100% 离线零依赖发声兜底）
 * 2. Web Speech API (sa-IN / hi-IN) 原生梵语/印地语 TTS 引擎
 * 3. 支持单音节点击发声、单句吟诵、全咒连续同步高亮跟读与语速调节
 */

import { analyzeSanskritSentence } from '../core/prosody';
import { VOWEL_FORMANTS } from '../core/prosody';
import { slp1ToDevanagari } from '../core/transliterator';

export type AudioEngineMode = 'auto' | 'synth' | 'tts';

class SanskritAudioEngine {
  private audioCtx: AudioContext | null = null;
  private isPlaying = false;
  private stopTimers: number[] = [];

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new Ctx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public synthesizeSyllableSlp(
    slpSyl: string,
    startTimeOffset = 0,
    rate = 0.85
  ): number {
    const ctx = this.getContext();
    const speedScale = 0.85 / Math.max(0.4, rate);

    let vowel = 'a';
    for (const ch of slpSyl) {
      if (VOWEL_FORMANTS[ch]) {
        vowel = ch;
        break;
      }
    }

    const [f1, f2, baseDur] = VOWEL_FORMANTS[vowel] || [720, 1240, 0.24];
    const hasNasal = slpSyl.includes('M') || slpSyl.includes('~') || /[NYRnm]$/.test(slpSyl);
    const hasAspirate = /[KGCJWQTDPBhH]/.test(slpSyl);
    const duration = (baseDur + (hasNasal ? 0.12 : 0)) * speedScale;
    const start = ctx.currentTime + startTimeOffset;
    const end = start + duration;

    // 136.1Hz 梵音禅诵基频 + 二次谐波
    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    osc.type = 'sawtooth';
    subOsc.type = 'triangle';
    osc.frequency.setValueAtTime(136.1, start);
    osc.frequency.exponentialRampToValueAtTime(132.0, end);
    subOsc.frequency.setValueAtTime(272.2, start);

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

    if (hasAspirate || /[Szs]/.test(slpSyl)) {
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

    return duration;
  }

  public playSingleSyllableIast(
    iastOrSlp: string,
    mode: AudioEngineMode = 'auto',
    rate = 0.85,
    isRawSlp = false
  ): void {
    const analyzed = analyzeSanskritSentence(iastOrSlp, isRawSlp ? 'slp1' : 'smart');
    const firstSyl = analyzed.syllables[0];
    const rawSlp = firstSyl ? firstSyl.rawSlp : 'oM';
    const devaSyl = slp1ToDevanagari(rawSlp);

    if (mode !== 'synth' && 'speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      const targetVoice =
        voices.find(v => v.lang.startsWith('sa')) ||
        voices.find(v => v.lang.startsWith('hi')) ||
        voices.find(v => v.lang.includes('IN'));

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
        if (targetVoice) return;
      }
    }

    this.synthesizeSyllableSlp(rawSlp, 0, rate);
  }

  public speakVerseIast(
    iastText: string,
    options: {
      mode?: AudioEngineMode;
      rate?: number;
      onSyllableIndex?: (idx: number) => void;
      onEnd?: () => void;
    } = {}
  ): void {
    this.stop();
    const { mode = 'auto', rate = 0.82, onSyllableIndex, onEnd } = options;
    const analyzed = analyzeSanskritSentence(iastText, 'smart');
    if (analyzed.syllables.length === 0) {
      onEnd?.();
      return;
    }

    this.isPlaying = true;
    const voices = 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : [];
    const targetVoice =
      voices.find(v => v.lang.startsWith('sa')) ||
      voices.find(v => v.lang.startsWith('hi')) ||
      voices.find(v => v.lang.includes('IN'));

    if (mode === 'synth' || (mode === 'auto' && !targetVoice)) {
      let offset = 0;
      analyzed.syllables.forEach((syl, idx) => {
        const dur = this.synthesizeSyllableSlp(syl.rawSlp, offset, rate);
        const timer = window.setTimeout(() => {
          if (!this.isPlaying) return;
          onSyllableIndex?.(idx);
        }, offset * 1000);
        this.stopTimers.push(timer);
        offset += dur + 0.045;
      });
      const endTimer = window.setTimeout(() => {
        this.stop();
        onEnd?.();
      }, offset * 1000 + 100);
      this.stopTimers.push(endTimer);
      return;
    }

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(analyzed.devanagari);
    if (targetVoice) {
      utter.voice = targetVoice;
      utter.lang = targetVoice.lang;
    } else {
      utter.lang = 'hi-IN';
    }
    utter.rate = rate;

    const stepMs = Math.max(210, Math.round(300 / rate));
    let curIdx = 0;
    const interval = window.setInterval(() => {
      if (!this.isPlaying || curIdx >= analyzed.syllables.length) {
        clearInterval(interval);
        return;
      }
      onSyllableIndex?.(curIdx);
      curIdx++;
    }, stepMs);
    this.stopTimers.push(interval);

    utter.onend = () => {
      clearInterval(interval);
      this.stop();
      onEnd?.();
    };
    utter.onerror = () => {
      clearInterval(interval);
      this.stop();
      onEnd?.();
    };

    window.speechSynthesis.speak(utter);
  }

  public stop(): void {
    this.isPlaying = false;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    for (const t of this.stopTimers) {
      clearTimeout(t);
      clearInterval(t);
    }
    this.stopTimers = [];
  }
}

export const sanskritAudioEngine = new SanskritAudioEngine();
