import React, { useState, useEffect } from 'react';
import {
  AudioEngineMode,
  AudioHealthStatus,
  NeuralVoice,
  SyllableTimingItem,
} from '../types/dharani';
import { sanskritAudioEngine, playSingleSyllable } from '../services/sanskritAudioEngine';
import { buildDharaniAudioFileName } from '../services/audio/audioExportEncoder';

export interface AudioPlayerBarProps {
  dharaniTitle?: string;
  isPlaying?: boolean;
  isLoadingAudio?: boolean;
  activeSyllableIndex?: number;
  activeSyllable?: SyllableTimingItem | null;
  syllableTimings?: SyllableTimingItem[];
  rate?: number;
  audioMode?: AudioEngineMode;
  voice?: NeuralVoice;
  healthStatus?: AudioHealthStatus;
  lastWavDataUrl?: string | null;
  onRateChange?: (rate: number) => void;
  onModeChange?: (mode: AudioEngineMode) => void;
  onVoiceChange?: (voice: NeuralVoice) => void;
  onStop?: () => void;
  onPlayDefault?: () => void;
  onPlaySingleSyllable?: (slp1: string) => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = (props) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    void sanskritAudioEngine.init();
    return sanskritAudioEngine.subscribe(() => {
      setTick((t) => t + 1);
    });
  }, []);

  const isPlaying = props.isPlaying ?? sanskritAudioEngine.isPlaying();
  const isLoadingAudio = props.isLoadingAudio ?? false;
  const activeSyllableIndex =
    props.activeSyllableIndex ?? sanskritAudioEngine.getActiveSyllableIndex();
  const syllableTimings =
    props.syllableTimings ?? sanskritAudioEngine.getActiveTimings();
  const activeSyllable =
    props.activeSyllable ??
    (activeSyllableIndex >= 0 ? syllableTimings[activeSyllableIndex] ?? null : null);
  const rate = props.rate ?? sanskritAudioEngine.getRate();
  const audioMode = props.audioMode ?? sanskritAudioEngine.getMode();
  const voice = props.voice ?? sanskritAudioEngine.getVoice();
  const healthStatus = props.healthStatus ?? sanskritAudioEngine.getHealthStatus();
  const lastWavDataUrl = props.lastWavDataUrl ?? sanskritAudioEngine.getLastDownloadWavUrl();

  const handleRateChange = (r: number) => {
    sanskritAudioEngine.setRate(r);
    props.onRateChange?.(r);
  };
  const handleModeChange = (m: AudioEngineMode) => {
    sanskritAudioEngine.setMode(m);
    props.onModeChange?.(m);
  };
  const handleVoiceChange = (v: NeuralVoice) => {
    sanskritAudioEngine.setVoice(v);
    props.onVoiceChange?.(v);
  };
  const handleStop = () => {
    sanskritAudioEngine.stop();
    props.onStop?.();
  };
  const handlePlayDefault = () => {
    if (props.onPlayDefault) {
      props.onPlayDefault();
    } else {
      void sanskritAudioEngine.speakText(
        'oṃ gate gate pāragate pārasaṃgate bodhi svāhā',
        { title: '般若波罗蜜多心经根本真言' }
      );
    }
  };
  const handlePlaySingleSyl = (slp1: string) => {
    if (props.onPlaySingleSyllable) {
      props.onPlaySingleSyllable(slp1);
    } else {
      void playSingleSyllable(slp1);
    }
  };

  const isNeuralOnline = Boolean(healthStatus?.backendOnline);

  return (
    <div className="audio-player-bar" role="region" aria-label="梵音發聲控制台">
      <div className="audio-player-inner">
        <div className="audio-status-group">
          <button
            type="button"
            onClick={isPlaying ? handleStop : handlePlayDefault}
            disabled={isLoadingAudio}
            className="btn-action primary"
          >
            {isLoadingAudio
              ? '⏳ 48kHz 神經推理中...'
              : isPlaying
                ? '⏹ 停止吟誦 (Stop)'
                : '▶ 試聽心經真言 (48kHz VITS / 136.1Hz)'}
          </button>

          <span className={`audio-status-dot ${isPlaying ? 'playing' : ''}`} />
          <span className="audio-status-label">
            {isPlaying && activeSyllableIndex >= 0 && activeSyllable ? (
              <>
                正在吟誦第 <strong>#{activeSyllableIndex + 1}</strong> 音節：
                <strong>{activeSyllable.deva}</strong> ({activeSyllable.iast} · SLP1:{' '}
                {activeSyllable.slp1}) · 詩律 <em>{activeSyllable.meter}</em> (
                {activeSyllable.durationMs}ms)
              </>
            ) : isNeuralOnline ? (
              `48,000 Hz 原生古典梵語神經模型就緒 (${healthStatus?.engine || 'ninada-vits-sanskrit-48khz'})`
            ) : (
              '48kHz 古典梵語 VITS 神經引擎 + 136.1 Hz 泛音共振峰雙擎就緒'
            )}
          </span>
        </div>

        {syllableTimings.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }} title="點擊任意音節單獨試聽 48kHz 發音">
            {syllableTimings.slice(0, 18).map((item) => {
              const isActive = isPlaying && item.index === activeSyllableIndex;
              return (
                <button
                  key={`${item.index}-${item.slp1}`}
                  type="button"
                  onClick={() => handlePlaySingleSyl(item.slp1)}
                  style={{
                    background: isActive ? 'var(--accent-cinnabar)' : 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    border: '1px solid rgba(212,168,83,0.4)',
                    borderRadius: '4px',
                    padding: '0.15rem 0.45rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  <strong>{item.deva}</strong> <span style={{ opacity: 0.8 }}>{item.iast}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="audio-controls-group">
          <div className="audio-mode-selector">
            {(
              [
                { id: 'neural-auto', label: '智能雙擎 (48kHz)' },
                { id: 'neural-tts', label: '48kHz 神經VITS' },
                { id: 'synth', label: '136.1Hz 共振峰' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                className={`audio-mode-btn ${audioMode === m.id ? 'active' : ''}`}
                onClick={() => handleModeChange(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="audio-voice-selector">
            {(
              [
                { id: 'male', label: '🧔 男聲' },
                { id: 'female', label: '👩 女聲' },
                { id: 'mobile', label: '📱 輕量' },
              ] as const
            ).map((v) => (
              <button
                key={v.id}
                type="button"
                className={`audio-voice-btn ${voice === v.id ? 'active' : ''}`}
                onClick={() => handleVoiceChange(v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>

          <label className="audio-slider-label">
            <span>語速 {rate.toFixed(2)}x</span>
            <input
              type="range"
              min="0.65"
              max="1.2"
              step="0.05"
              value={rate}
              onChange={(e) => handleRateChange(parseFloat(e.target.value))}
            />
          </label>

          {lastWavDataUrl && (
            <a
              href={lastWavDataUrl}
              download={buildDharaniAudioFileName(
                props.dharaniTitle ||
                  sanskritAudioEngine.getLastSpokenTitle() ||
                  '般若波罗蜜多心经根本真言',
                'wav'
              )}
              className="audio-drone-btn"
              style={{ textDecoration: 'none' }}
            >
              ⬇ 48kHz WAV
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
