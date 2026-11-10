import React, { useState, useEffect } from 'react';
import {
  Play,
  Square,
  Bookmark,
  ShieldCheck,
  Sparkles,
  Download,
  FileAudio,
} from 'lucide-react';
import type { DharaniEntry, ScriptVisibilityConfig } from '../../types/kosaTypes';
import {
  sanskritAudioEngine,
  type PlaybackState,
} from '../../services/audio/sanskritAudioEngine';
import { ScriptControlBar } from './ScriptControlBar';
import { FullDharaniSummaryCard } from './FullDharaniSummaryCard';
import { VerseBlock } from './VerseBlock';
import { CbetaSiddhamInterlinearView } from './CbetaSiddhamInterlinearView';
import { AuthoritativeSourceModal } from './AuthoritativeSourceModal';

interface DharaniReaderProps {
  entry: DharaniEntry;
  scriptConfig: ScriptVisibilityConfig;
  onScriptConfigChange: (cfg: ScriptVisibilityConfig) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  playbackState: PlaybackState;
  onPlayAllVerses: () => void;
  onStopPlayback: () => void;
  onPlaySingleVerse: (verseArrayIdx: number) => void;
  onPlaySingleSyllable: (iastSyl: string) => void;
}

export const DharaniReader: React.FC<DharaniReaderProps> = ({
  entry,
  scriptConfig,
  onScriptConfigChange,
  isBookmarked,
  onToggleBookmark,
  playbackState,
  onPlayAllVerses,
  onStopPlayback,
  onPlaySingleVerse,
  onPlaySingleSyllable,
}) => {
  const [readerSubMode, setReaderSubMode] = useState<'verses' | 'cbeta-interlinear'>('verses');
  const [showProvenanceModal, setShowProvenanceModal] = useState(false);
  const [generatedWav, setGeneratedWav] = useState<{
    url: string;
    durationSec: number;
    fileName: string;
  } | null>(null);

  const interlinearTokens = entry.provenance.cbetaInterlinearTokens || [];
  const hasSiddhamInterlinear = interlinearTokens.length > 0;

  useEffect(() => {
    setReaderSubMode('verses');
    setGeneratedWav((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
  }, [entry.id]);

  const handleGenerateWavAudio = () => {
    const res = sanskritAudioEngine.renderVersesToWavBlob(
      entry.verses,
      playbackState.rate
    );
    setGeneratedWav((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return {
        url: res.url,
        durationSec: res.durationSec,
        fileName: `${entry.id}-sanskrit-chant.wav`,
      };
    });
  };

  return (
    <main className="reader-main" aria-label="梵文陀罗尼多体对照阅读区">
      <section className="dharani-hero-card">
        <div className="hero-top-bar">
          <div className="hero-badges-row">
            <span className="taisho-pill">{entry.taishoNo}</span>
            <span className="deity-pill">本尊：{entry.deityZh}</span>
            <span
              className="deity-pill"
              style={{
                background: 'var(--accent-lapis-soft)',
                color: 'var(--accent-lapis)',
                borderColor: 'var(--accent-lapis-border)',
              }}
            >
              数据源：{entry.provenance.sourceType}
            </span>
          </div>

          <div className="hero-actions-group">
            {playbackState.isPlaying ? (
              <button
                id="hero-stop-chant-btn"
                type="button"
                className="btn-scholarly primary"
                onClick={onStopPlayback}
              >
                <Square size={14} />
                <span>停止讽诵</span>
              </button>
            ) : (
              <button
                id="hero-play-all-btn"
                type="button"
                className="btn-scholarly primary"
                onClick={onPlayAllVerses}
              >
                <Play size={14} />
                <span>全咒同步跟诵 ({entry.verses.length}句)</span>
              </button>
            )}

            <button
              id="hero-export-wav-btn"
              type="button"
              className="btn-scholarly gold"
              onClick={handleGenerateWavAudio}
              title="将整部陀罗尼合成为 44.1kHz 高音质 .WAV 音频文件，支持原生播放器拖动或下载发送至手机"
            >
              <FileAudio size={14} />
              <span>生成/导出本咒 .WAV 音频文件</span>
            </button>

            {hasSiddhamInterlinear && (
              <button
                id="hero-switch-interlinear-btn"
                type="button"
                className="btn-scholarly"
                onClick={() =>
                  setReaderSubMode((m) => (m === 'verses' ? 'cbeta-interlinear' : 'verses'))
                }
              >
                <Sparkles size={14} />
                <span>
                  {readerSubMode === 'verses'
                    ? `唐代悉昙逐字对音 (${interlinearTokens.length}字)`
                    : '返回多体全句解析'}
                </span>
              </button>
            )}

            <button
              id="hero-open-provenance-btn"
              type="button"
              className="btn-scholarly"
              onClick={() => setShowProvenanceModal(true)}
            >
              <ShieldCheck size={14} />
              <span>权威原典核验</span>
            </button>

            <button
              id="hero-bookmark-btn"
              type="button"
              className={`btn-scholarly ${isBookmarked ? 'gold' : ''}`}
              onClick={onToggleBookmark}
            >
              <Bookmark size={14} />
              <span>{isBookmarked ? '已入藏' : '收藏经咒'}</span>
            </button>
          </div>
        </div>

        <div>
          <h1 className="hero-title-zh">{entry.titleZh}</h1>
          <div className="hero-title-skt">{entry.titleSanskritIast}</div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            {entry.titleEnglish} · 译者与校勘：{entry.translatorZh}
          </div>
        </div>

        {/* Native WAV Audio Player & Download Card when generated */}
        {generatedWav && (
          <div
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--accent-gold-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--accent-vermilion)' }}>
                已生成本咒 44.1kHz 连续人声共振峰 + 寺院引磬 .WAV 音频（总时长 {generatedWav.durationSec.toFixed(1)} 秒）
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                可直接用下方原生音频条任意拖动进度播放，或点击右侧按钮下载 <code>.wav</code> 文件发送至手机/微信/本地音乐软件收听。
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <audio
                controls
                src={generatedWav.url}
                style={{ height: '36px' }}
              />
              <a
                href={generatedWav.url}
                download={generatedWav.fileName}
                className="btn-scholarly primary"
              >
                <Download size={14} />
                <span>下载 .WAV 音频文件 ({generatedWav.fileName})</span>
              </a>
            </div>
          </div>
        )}

        <div className="hero-meta-grid">
          <div className="meta-box">
            <div className="meta-box-label">经典出处与功德摄要</div>
            <div>{entry.meritsAndSummaryZh}</div>
          </div>
          <div className="meta-box">
            <div className="meta-box-label">梵音声明学持诵要诀（Śikṣā &amp; Phonetics）</div>
            <div>{entry.recitationTipsZh}</div>
          </div>
        </div>
      </section>

      <ScriptControlBar
        config={scriptConfig}
        onChange={onScriptConfigChange}
        hasSiddhamInterlinear={hasSiddhamInterlinear}
        interlinearCount={interlinearTokens.length}
        readerSubMode={readerSubMode}
        onReaderSubModeChange={setReaderSubMode}
      />

      {readerSubMode === 'cbeta-interlinear' && hasSiddhamInterlinear ? (
        <CbetaSiddhamInterlinearView
          cbetaId={entry.provenance.cbetaId}
          titleZh={entry.titleZh}
          tokens={interlinearTokens}
          onPlaySyllable={onPlaySingleSyllable}
        />
      ) : (
        <div className="verses-stack">
          <FullDharaniSummaryCard
            entry={entry}
            config={scriptConfig}
            onToggleBracketIast={() =>
              onScriptConfigChange({
                ...scriptConfig,
                showPhoneticIastBracket: !scriptConfig.showPhoneticIastBracket,
              })
            }
          />

          {entry.verses.map((verse, idx) => (
            <VerseBlock
              key={verse.id}
              verse={verse}
              config={scriptConfig}
              isVersePlaying={
                playbackState.isPlaying && playbackState.currentVerseIndex === verse.index
              }
              activeSyllableIndex={playbackState.currentSyllableIndex}
              verseProgress={
                playbackState.isPlaying && playbackState.currentVerseIndex === verse.index
                  ? playbackState.verseProgress
                  : 0
              }
              autoScroll={playbackState.autoScroll}
              onPlayVerse={() => onPlaySingleVerse(idx)}
              onPlaySyllable={onPlaySingleSyllable}
            />
          ))}
        </div>
      )}

      {showProvenanceModal && (
        <AuthoritativeSourceModal
          entry={entry}
          onClose={() => setShowProvenanceModal(false)}
        />
      )}
    </main>
  );
};
