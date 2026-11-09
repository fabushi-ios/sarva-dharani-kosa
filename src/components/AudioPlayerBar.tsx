/**
 * Persistent Bottom 48,000 Hz Neural Audio Player Bar (`src/components/AudioPlayerBar.tsx`)
 * Exposes Play/Stop controls, AudioEngineMode selector, NeuralVoice selector (`male`, `female`, `mobile`),
 * speech rate selector (`0.6x–1.2x`), live syllable timeline, and 48kHz WAV download link.
 */

import React from 'react';
import sanskritAudioEngine from '../services/audio/sanskritAudioEngine';
import {
  AudioEngineMode,
  AudioHealthStatus,
  NeuralVoice,
  SyllableTimingItem,
} from '../types/dharani';

interface AudioPlayerBarProps {
  isPlaying: boolean;
  activeSyllableIndex: number;
  activeTimings: SyllableTimingItem[];
  lastSpokenTitle: string;
  lastDownloadWavUrl: string | null;
  audioMode: AudioEngineMode;
  onChangeAudioMode: (mode: AudioEngineMode) => void;
  voice: NeuralVoice;
  onChangeVoice: (voice: NeuralVoice) => void;
  rate: number;
  onChangeRate: (rate: number) => void;
  healthStatus: AudioHealthStatus;
  onReciteCurrentDharani: () => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  isPlaying,
  activeSyllableIndex,
  activeTimings,
  lastSpokenTitle,
  lastDownloadWavUrl,
  audioMode,
  onChangeAudioMode,
  voice,
  onChangeVoice,
  rate,
  onChangeRate,
  healthStatus,
  onReciteCurrentDharani,
}) => {
  const currentTiming =
    activeSyllableIndex >= 0 && activeSyllableIndex < activeTimings.length
      ? activeTimings[activeSyllableIndex]
      : null;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-amber-900/50 bg-stone-950/95 px-4 py-2.5 backdrop-blur-md shadow-2xl">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
        {/* Left: Play/Stop & Active Recitation Status */}
        <div className="flex items-center gap-3">
          {isPlaying ? (
            <button
              type="button"
              onClick={() => sanskritAudioEngine.stop()}
              className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-red-500"
            >
              ⏹ 停止朗读
            </button>
          ) : (
            <button
              type="button"
              onClick={onReciteCurrentDharani}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-stone-950 shadow hover:bg-amber-400"
            >
              ▶ 恭诵当前陀罗尼 (48kHz)
            </button>
          )}

          <div className="text-xs">
            <div className="font-medium text-stone-200">
              {isPlaying
                ? `正在吟诵：${lastSpokenTitle}`
                : lastSpokenTitle
                ? `上次吟诵：${lastSpokenTitle}`
                : '就绪 · 48,000 Hz 古典梵文声学引擎'}
            </div>
            <div className="text-[11px] text-stone-400">
              {currentTiming ? (
                <span className="text-amber-300">
                  当前音节 #{currentTiming.index + 1}: <strong>{currentTiming.deva}</strong> (
                  {currentTiming.iast}) · {currentTiming.meter} ({currentTiming.durationMs}ms)
                </span>
              ) : (
                <span>
                  采样率: {healthStatus.sampleRate} Hz · 引擎: {healthStatus.engine} (方案 1 原生梵文 VITS)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Live Syllable Timeline Strip */}
        {activeTimings.length > 0 && (
          <div className="hidden max-w-xl flex-1 items-center gap-1 overflow-x-auto py-1 xl:flex">
            {activeTimings.slice(0, 18).map((t) => {
              const active = t.index === activeSyllableIndex;
              return (
                <button
                  key={t.index}
                  type="button"
                  onClick={() => sanskritAudioEngine.playSyllable(t.slp1)}
                  className={`rounded px-2 py-0.5 text-[11px] font-mono transition ${
                    active
                      ? 'bg-amber-400 text-stone-950 font-bold scale-105'
                      : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {t.deva}({t.iast})
                </button>
              );
            })}
          </div>
        )}

        {/* Right: Mode, Voice, Rate & 48kHz WAV Download */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            id="kosaBottomAudioModeSelect"
            aria-label="底部音频模式选择"
            value={audioMode}
            onChange={(e) => onChangeAudioMode(e.target.value as AudioEngineMode)}
            className="rounded-lg border border-stone-700 bg-stone-900 px-2.5 py-1.5 text-xs text-amber-200"
          >
            <option value="neural-tts">方案 1：48kHz 梵文神经模型 (/api/tts)</option>
            <option value="legacy-tts">系统语音兜底 (Legacy)</option>
          </select>

          <select
            id="kosaBottomVoiceSelect"
            aria-label="底部声线选择"
            value={voice}
            onChange={(e) => onChangeVoice(e.target.value as NeuralVoice)}
            className="rounded-lg border border-stone-700 bg-stone-900 px-2.5 py-1.5 text-xs text-stone-200"
          >
            <option value="male">男声 Studio (sa.onnx)</option>
            <option value="female">女声 Studio (sa_female.onnx)</option>
            <option value="mobile">轻量高速 (onnx_mobile)</option>
          </select>

          <select
            id="kosaBottomRateSelect"
            aria-label="语速调节"
            value={String(rate)}
            onChange={(e) => onChangeRate(Number(e.target.value))}
            className="rounded-lg border border-stone-700 bg-stone-900 px-2.5 py-1.5 text-xs text-stone-200"
          >
            <option value="0.6">0.6x 慢速教学</option>
            <option value="0.8">0.8x 庄严念诵</option>
            <option value="1">1.0x 标准原速</option>
            <option value="1.2">1.2x 快速持诵</option>
          </select>

          {lastDownloadWavUrl && (
            <a
              href={lastDownloadWavUrl}
              download="sanskrit_dharani_48khz.wav"
              className="rounded-lg border border-emerald-500/40 bg-emerald-950/70 px-2.5 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-900/70"
            >
              ⬇ 下载 48kHz WAV
            </a>
          )}
        </div>
      </div>
    </footer>
  );
};

export default AudioPlayerBar;
