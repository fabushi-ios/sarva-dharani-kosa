import React, { useState } from 'react';
import {
  Play,
  Square,
  Repeat,
  Radio,
  Volume2,
  Navigation,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  sanskritAudioEngine,
  type AudioEngineMode,
  type PlaybackState,
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
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const syl = playbackState.currentSyllableInfo;
  const progressPct = playbackState.isPlaying
    ? Math.min(100, Math.max(4, Math.round(playbackState.verseProgress * 100)))
    : 0;

  return (
    <footer className="audio-player-bar" aria-label="梵音摩多轻重律吟诵控制台">
      <div className="audio-bar-progress-track" aria-hidden="true">
        <div
          className="audio-bar-progress-fill"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="audio-bar-inner">
        <div className="audio-primary-row">
          <div className="audio-controls-left">
            {playbackState.isPlaying ? (
              <button
                id="audio-bar-stop-btn"
                type="button"
                className="audio-play-btn"
                onClick={onStop}
              >
                <Square size={14} />
                <span>{playbackState.isLoadingAudio ? '准备中 · 停止' : '停止讽诵'}</span>
              </button>
            ) : (
              <button
                id="audio-bar-play-btn"
                type="button"
                className="audio-play-btn"
                onClick={onPlayAll}
              >
                <Play size={14} />
                <span>同步跟诵</span>
              </button>
            )}
          </div>

          <div className="audio-live-readout">
            <Radio
              size={15}
              style={{ flexShrink: 0 }}
              color={playbackState.isPlaying ? 'var(--accent-vermilion)' : 'var(--text-muted)'}
            />
            {playbackState.isLoadingAudio ? (
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--accent-vermilion)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                ⚡ 正在通过 Hugging Face 48kHz 梵音神经 API 获取发音（后台同步缓存本地模型）...
              </div>
            ) : playbackState.isPlaying && syl ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flexWrap: 'nowrap',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  minWidth: 0,
                }}
              >
                <span
                  className="siddham-glyph"
                  style={{ fontSize: '1.25rem', color: 'var(--accent-vermilion)', flexShrink: 0 }}
                >
                  {syl.siddham}
                </span>
                <span className="devanagari-glyph" style={{ fontSize: '1rem', flexShrink: 0 }}>
                  {syl.devanagari}
                </span>
                <span className="live-syl-badge" style={{ flexShrink: 0 }}>
                  {syl.iast}
                </span>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--accent-jade)',
                    background: 'var(--accent-jade-soft)',
                    padding: '0.08rem 0.42rem',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {playbackState.currentSyllableModernZh}
                </span>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--accent-vermilion)',
                    background: 'var(--accent-vermilion-soft)',
                    padding: '0.08rem 0.42rem',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  古：{playbackState.currentSyllableClassicalZh}
                </span>
                <span
                  className="ipa-text"
                  style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0 }}
                >
                  [{syl.ipa}]
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '0.06rem 0.38rem',
                    borderRadius: '4px',
                    background: 'var(--accent-gold-soft)',
                    color: 'var(--accent-gold)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {syl.weight === 'guru' ? '— 重2拍' : '⌣ 轻1拍'}
                </span>
              </div>
            ) : (
              <div className="audio-idle-title" title={`${dharaniTitleZh}（首次访问 HF 云端神经 API 即点即发声 + 后台自动缓存 48,000 Hz ONNX 神经模型）`}>
                待诵：<strong>{dharaniTitleZh}</strong> · HF 48kHz 神经API + 本地ONNX缓存
              </div>
            )}
          </div>

          <button
            type="button"
            className={`audio-mobile-expand-btn ${mobileSettingsOpen ? 'active' : ''}`}
            onClick={() => setMobileSettingsOpen((v) => !v)}
            aria-expanded={mobileSettingsOpen}
            title="展开或收起讽诵控制选项"
          >
            <SlidersHorizontal size={13} />
            <span>设置</span>
            {mobileSettingsOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
        </div>

        <div className={`audio-secondary-drawer ${mobileSettingsOpen ? 'is-open' : ''}`}>
          <div className="audio-mobile-toggles-row">
            <button
              id="audio-bar-loop-btn"
              type="button"
              className={`audio-icon-btn ${playbackState.loopVerse ? 'active' : ''}`}
              onClick={onToggleLoop}
              title="单句循环持诵模式"
            >
              <Repeat size={13} />
              <span>{playbackState.loopVerse ? '循环:开' : '单句循环'}</span>
            </button>

            <button
              id="audio-bar-autoscroll-btn"
              type="button"
              className={`audio-icon-btn ${playbackState.autoScroll ? 'active' : ''}`}
              onClick={onToggleAutoScroll}
              title="吟诵时自动平滑滚动定位到当前发音音节"
            >
              <Navigation size={13} />
              <span>{playbackState.autoScroll ? '追字:开' : '自动追字'}</span>
            </button>

            <button
              id="audio-bar-voice-btn"
              type="button"
              className="audio-icon-btn"
              onClick={() =>
                sanskritAudioEngine.setVoice(
                  playbackState.voice === 'male' ? 'female' : 'male'
                )
              }
              title="切换 48kHz 古典梵语男声 / 女声"
            >
              <span>{playbackState.voice === 'female' ? '👩 女声' : '🧔 男声'}</span>
            </button>

            <button
              id="audio-bar-drone-btn"
              type="button"
              className={`audio-icon-btn ${playbackState.omDroneActive ? 'active' : ''}`}
              onClick={() => sanskritAudioEngine.toggleOmDrone()}
              title="开启或关闭 136.1Hz Sadja (Om) 持续共振背景场"
            >
              <span>{playbackState.omDroneActive ? '🔔 Om开' : '🔕 Om共振'}</span>
            </button>
          </div>

          <div className="audio-settings-right">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
              <label htmlFor="audio-engine-mode-select" className="audio-field-label">
                <Volume2 size={13} />
                <span>模式：</span>
              </label>
              <select
                id="audio-engine-mode-select"
                className="audio-select"
                value={playbackState.mode}
                onChange={(e) => onChangeMode(e.target.value as AudioEngineMode)}
              >
                <option value="neural-vits-48k">
                  48kHz 神经VITS (sa.onnx)
                </option>
                <option value="studio-vocal-chant">
                  136.1Hz 共振峰梵音唱诵
                </option>
                <option value="mandarin-phonetic-guide">
                  普通话谐音慢速领诵
                </option>
                <option value="indic-devanagari-tts">
                  印度天城文系统语音
                </option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
              <label htmlFor="audio-speed-select" className="audio-field-label">
                <span>速度：</span>
              </label>
              <select
                id="audio-speed-select"
                className="audio-select"
                value={playbackState.rate}
                onChange={(e) => onChangeRate(parseFloat(e.target.value))}
              >
                <option value={0.65}>0.65x 初学慢速</option>
                <option value={0.85}>0.85x 庄严从容</option>
                <option value={1}>1.0x 标准轻重律</option>
                <option value={1.25}>1.25x 熟诵连持</option>
                <option value={1.5}>1.5x 金刚疾诵</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
