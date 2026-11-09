import React from 'react';
import {
  AudioEngineMode,
  AudioHealthStatus,
  NeuralVoice,
  SyllableTimingItem,
} from '../types/dharani';

interface AudioPlayerBarProps {
  isPlaying: boolean;
  isLoadingAudio?: boolean;
  activeSyllableIndex: number;
  activeSyllable?: SyllableTimingItem | null;
  syllableTimings?: SyllableTimingItem[];
  rate: number;
  audioMode: AudioEngineMode;
  voice: NeuralVoice;
  healthStatus?: AudioHealthStatus;
  lastWavDataUrl?: string | null;
  onRateChange: (rate: number) => void;
  onModeChange: (mode: AudioEngineMode) => void;
  onVoiceChange: (voice: NeuralVoice) => void;
  onStop: () => void;
  onPlayDefault: () => void;
  onPlaySingleSyllable?: (slp1: string) => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  isPlaying,
  isLoadingAudio = false,
  activeSyllableIndex,
  activeSyllable,
  syllableTimings = [],
  rate,
  audioMode,
  voice,
  healthStatus,
  lastWavDataUrl,
  onRateChange,
  onModeChange,
  onVoiceChange,
  onStop,
  onPlayDefault,
  onPlaySingleSyllable,
}) => {
  const isNeuralOnline = Boolean(healthStatus?.backendOnline);

  return (
    <div className="audio-player-bar" role="region" aria-label="梵音發聲控制台">
      <div className="audio-player-inner">
        <div className="audio-player-left">
          <button
            type="button"
            onClick={isPlaying ? onStop : onPlayDefault}
            disabled={isLoadingAudio}
            className="primary-btn"
          >
            {isLoadingAudio
              ? '⏳ 48kHz 神經推理中...'
              : isPlaying
                ? '⏹ 停止吟誦 (Stop)'
                : '▶ 試聽心經真言 (48kHz VITS / 136.1Hz)'}
          </button>

          <div className="audio-status-info">
            <div className="audio-status-line">
              <span
                className="status-dot"
                style={{ backgroundColor: isNeuralOnline ? '#34d399' : '#fbbf24' }}
              />
              <span>
                {isNeuralOnline
                  ? `48,000 Hz 原生古典梵語神經模型就緒 (${healthStatus?.engine || 'ninada-vits-sanskrit-48khz'})`
                  : '136.1 Hz 泛音共振峰合成器就緒 (Web Audio Formant Synth)'}
              </span>
            </div>
            <div className="audio-active-syl">
              {isPlaying && activeSyllableIndex >= 0 ? (
                <span>
                  正在吟誦第 <strong>#{activeSyllableIndex + 1}</strong> 音節
                  {activeSyllable ? (
                    <>
                      ：<strong>{activeSyllable.deva}</strong> ({activeSyllable.iast} · SLP1:{' '}
                      {activeSyllable.slp1}) · 詩律 <em>{activeSyllable.meter}</em> (
                      {activeSyllable.durationMs}ms)
                    </>
                  ) : null}
                </span>
              ) : (
                <span>
                  Śikṣā 古典梵語正音 (100% 保留短元音 a [ɐ] · 零印地語吞音 · 嚴格詩律時長)
                </span>
              )}
            </div>
          </div>
        </div>

        {syllableTimings.length > 0 && (
          <div className="audio-syllable-strip" title="點擊任意音節單獨試聽 48kHz 發音">
            {syllableTimings.map((item) => {
              const isCurrent = isPlaying && activeSyllableIndex === item.index;
              return (
                <button
                  key={`${item.index}-${item.slp1}`}
                  type="button"
                  onClick={() => onPlaySingleSyllable?.(item.slp1)}
                  className={`chip-btn ${isCurrent ? 'active' : ''}`}
                >
                  {item.iast}
                  <span style={{ marginLeft: '0.25rem', opacity: 0.75, fontSize: '0.7rem' }}>
                    {item.meter}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="audio-player-controls">
          <label className="audio-control-label">
            <span>發聲引擎:</span>
            <select
              value={audioMode}
              onChange={(e) => onModeChange(e.target.value as AudioEngineMode)}
              className="select-input compact-select"
            >
              <option value="neural-auto">48kHz 古典梵文神經模型 (自動降級)</option>
              <option value="neural-tts">僅 48kHz 神經模型 (/api/tts)</option>
              <option value="synth">136.1 Hz 泛音共振峰合成 (Formant Synth)</option>
              <option value="legacy-tts">瀏覽器語音 (Web Speech API)</option>
            </select>
          </label>

          <label className="audio-control-label">
            <span>音色:</span>
            <select
              value={voice}
              onChange={(e) => onVoiceChange(e.target.value as NeuralVoice)}
              className="select-input compact-select"
            >
              <option value="male">莊嚴男聲 (Studio Male)</option>
              <option value="female">清亮女聲 (Studio Female)</option>
              <option value="mobile">極速輕量 (Mobile)</option>
            </select>
          </label>

          <label className="audio-control-label">
            <span>語速:</span>
            <select
              value={rate}
              onChange={(e) => onRateChange(parseFloat(e.target.value))}
              className="select-input compact-select"
            >
              <option value={0.65}>0.65x 慢速教學</option>
              <option value={0.85}>0.85x 傳統課誦</option>
              <option value={1.0}>1.0x 標準原速</option>
              <option value={1.2}>1.2x 快速持誦</option>
            </select>
          </label>

          {lastWavDataUrl && (
            <a
              href={lastWavDataUrl}
              download={`sanskrit_48khz_${voice}.wav`}
              className="chip-btn"
              title="下載 48,000 Hz 無損 WAV 音訊檔"
            >
              ⬇ 下載 48kHz WAV
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
export default AudioPlayerBar;
