import React from 'react';
import {
  Play,
  Square,
  Repeat,
  Radio,
  Volume2,
  Navigation,
} from 'lucide-react';
import type {
  AudioEngineMode,
  PlaybackState,
} from '../../services/audio/sanskritAudioEngine';

interface AudioPlayerBarProps {
  dharaniTitleZh: string;
  playbackState: PlaybackState;
  onPlayAll: () => void;
  onStop: () => void;
  onToggleLoop: () => void;
  onToggleAutoScroll: () => void;
  onChangeRate: (rate: number) => void;
  onChangeMode: (mode: AudioEngineMode) => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  dharaniTitleZh,
  playbackState,
  onPlayAll,
  onStop,
  onToggleLoop,
  onToggleAutoScroll,
  onChangeRate,
  onChangeMode,
}) => {
  const syl = playbackState.currentSyllableInfo;

  return (
    <footer className="audio-player-bar" aria-label="梵音摩多轻重律吟诵控制台">
      <div className="audio-bar-inner">
        <div className="audio-controls-left">
          {playbackState.isPlaying ? (
            <button
              id="audio-bar-stop-btn"
              type="button"
              className="audio-play-btn"
              onClick={onStop}
            >
              <Square size={15} />
              <span>停止讽诵</span>
            </button>
          ) : (
            <button
              id="audio-bar-play-btn"
              type="button"
              className="audio-play-btn"
              onClick={onPlayAll}
            >
              <Play size={15} />
              <span>同步梵音跟诵</span>
            </button>
          )}

          <button
            id="audio-bar-loop-btn"
            type="button"
            className={`audio-icon-btn ${playbackState.loopVerse ? 'active' : ''}`}
            onClick={onToggleLoop}
            title="单句循环持诵模式"
          >
            <Repeat size={14} />
            <span>{playbackState.loopVerse ? '单句循环：开' : '单句循环'}</span>
          </button>

          <button
            id="audio-bar-autoscroll-btn"
            type="button"
            className={`audio-icon-btn ${playbackState.autoScroll ? 'active' : ''}`}
            onClick={onToggleAutoScroll}
            title="吟诵时自动平滑滚动定位到当前发音音节"
          >
            <Navigation size={14} />
            <span>{playbackState.autoScroll ? '自动追字：开' : '自动追字'}</span>
          </button>
        </div>

        <div className="audio-live-readout">
          <Radio
            size={16}
            color={playbackState.isPlaying ? 'var(--accent-vermilion)' : 'var(--text-muted)'}
          />
          {playbackState.isPlaying && syl ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span className="siddham-glyph" style={{ fontSize: '1.35rem', color: 'var(--accent-vermilion)' }}>
                {syl.siddham}
              </span>
              <span className="devanagari-glyph" style={{ fontSize: '1.1rem' }}>
                {syl.devanagari}
              </span>
              <span className="live-syl-badge">{syl.iast}</span>
              <span
                style={{
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  color: 'var(--accent-jade)',
                  background: 'var(--accent-jade-soft)',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '4px',
                }}
              >
                拼读：{playbackState.currentSyllableModernZh}
              </span>
              <span
                style={{
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  color: 'var(--accent-vermilion)',
                  background: 'var(--accent-vermilion-soft)',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '4px',
                }}
              >
                古音：{playbackState.currentSyllableClassicalZh}
              </span>
              <span className="ipa-text" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                [{syl.ipa}]
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '0.08rem 0.42rem',
                  borderRadius: '4px',
                  background: 'var(--accent-gold-soft)',
                  color: 'var(--accent-gold)',
                  fontWeight: 600,
                }}
              >
                {syl.weight === 'guru' ? '— 2拍重音' : '⌣ 1拍轻音'}
              </span>
            </div>
          ) : (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              当前待诵：<strong>{dharaniTitleZh}</strong>（预渲染 44.1kHz 连续人声声道 · 硬件时钟零延迟同步跟读）
            </div>
          )}
        </div>

        <div className="audio-settings-right">
          <label
            htmlFor="audio-engine-mode-select"
            style={{
              fontSize: '0.76rem',
              color: 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <Volume2 size={14} />
            <span>讽诵模式：</span>
          </label>
          <select
            id="audio-engine-mode-select"
            className="audio-select"
            value={playbackState.mode}
            onChange={(e) => onChangeMode(e.target.value as AudioEngineMode)}
          >
            <option value="studio-vocal-chant">
              预渲染连续梵音唱诵 + 寺院引磬 (44.1kHz 零延迟跟读)
            </option>
            <option value="mandarin-phonetic-guide">
              现代梵音拼读普通话领诵 (逐字慢速教念)
            </option>
            <option value="indic-devanagari-tts">
              印度天城文系统语音 (Web Speech sa-IN/hi-IN)
            </option>
          </select>

          <label
            htmlFor="audio-speed-select"
            style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}
          >
            速度：
          </label>
          <select
            id="audio-speed-select"
            className="audio-select"
            value={playbackState.rate}
            onChange={(e) => onChangeRate(parseFloat(e.target.value))}
          >
            <option value={0.65}>0.65x 初学慢速跟读</option>
            <option value={0.85}>0.85x 庄严从容讽诵</option>
            <option value={1}>1.0x 标准摩多轻重律</option>
            <option value={1.25}>1.25x 熟诵连持</option>
            <option value={1.5}>1.5x 金刚疾诵</option>
          </select>
        </div>
      </div>
    </footer>
  );
};
