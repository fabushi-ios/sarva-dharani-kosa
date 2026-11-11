import React from 'react';
import {
  Play,
  Square,
  Repeat,
  Radio,
  Volume2,
  Navigation,
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
              <span>{playbackState.isLoadingAudio ? '准备梵音中 · 停止' : '停止讽诵'}</span>
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

          <button
            id="audio-bar-voice-btn"
            type="button"
            className="audio-icon-btn"
            onClick={() =>
              sanskritAudioEngine.setVoice(
                playbackState.voice === 'male' ? 'female' : 'male'
              )
            }
            title="切换 48kHz 古典梵语男声 (sa_studio_male) / 女声 (sa_studio_female)"
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
            <span>{playbackState.omDroneActive ? '🔔 136.1Hz Om' : '🔕 Om共振'}</span>
          </button>
        </div>

        <div className="audio-live-readout">
          <Radio
            size={16}
            color={playbackState.isPlaying ? 'var(--accent-vermilion)' : 'var(--text-muted)'}
          />
          {playbackState.isLoadingAudio ? (
            <div style={{ fontSize: '0.84rem', color: 'var(--accent-vermilion)', fontWeight: 600 }}>
              ⚡ 正在通过 Hugging Face 48,000 Hz 梵音神经 API 极速获取发音（后台同步缓存本地神经模型）...
            </div>
          ) : playbackState.isPlaying && syl ? (
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
              当前待诵：<strong>{dharaniTitleZh}</strong>（首次访问 HF 云端神经 API 即点即发声 + 后台自动缓存 48,000 Hz ONNX 神经模型）
            </div>
          )}
        </div>

        <div className="audio-settings-right">
          <label
            htmlFor="audio-engine-mode-select"
            style={{
              fontSize: '0.76rem',
              color: '#f4e8c1',
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
            <option value="neural-vits-48k">
              48,000 Hz 古典梵语神经VITS (sa.onnx / sa_female.onnx)
            </option>
            <option value="studio-vocal-chant">
              136.1Hz 连续共振峰梵音唱诵 + 寺院引磬 (零延迟跟读)
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
            style={{ fontSize: '0.76rem', color: '#f4e8c1' }}
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
