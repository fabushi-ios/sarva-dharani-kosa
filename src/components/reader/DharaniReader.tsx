import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Square,
  Bookmark,
  ShieldCheck,
  Sparkles,
  Download,
  FileAudio,
  SlidersHorizontal,
  Loader2,
  BookOpen,
  Share2,
  ScrollText,
  Info,
} from 'lucide-react';
import type {
  ActiveWorkspaceTab,
  DharaniEntry,
  ScriptVisibilityConfig,
} from '../../types/kosaTypes';
import {
  sanskritAudioEngine,
  type AudioEngineMode,
  type PlaybackState,
} from '../../services/audio/sanskritAudioEngine';
import { useDharaniAudioExport } from '../../services/audio/dharaniAudioExportStore';
import { FullDharaniSummaryCard } from './FullDharaniSummaryCard';
import { VerseBlock } from './VerseBlock';
import { CbetaSiddhamInterlinearView } from './CbetaSiddhamInterlinearView';
import { AuthoritativeSourceModal } from './AuthoritativeSourceModal';
import { OriginalFullTextModal } from './OriginalFullTextModal';
import { InlineOriginalTextPanel } from './InlineOriginalTextPanel';
import { DharaniShareModal } from '../share/DharaniShareModal';
import { collectEntrySources } from '../../core/sources/entrySources';
import {
  CBETA_BULEI_MAP,
  resolveEntryBulei,
} from '../../core/canon/cbetaBulei';
import {
  hasEntryCompleteOriginalSanskrit,
  isClassicalChineseOnlyEntry,
} from '../../core/provenance/fieldProvenance';
import { scrollToReaderElement } from '../../core/dom/scrollUtils';

export interface ReaderNavigationRequest {
  target: 'hero' | 'original' | 'summary' | 'interlinear' | 'concordance' | 'verse';
  verseArrayIndex?: number;
  nonce: number;
}

export type ReaderParallelTab = 'dharani' | 'original' | 'interlinear' | 'notes';

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
  onNavigateTab?: (tab: ActiveWorkspaceTab) => void;
  navigationRequest?: ReaderNavigationRequest | null;
  onRequestShare?: (entry: DharaniEntry, initialVerseIndex?: number | null) => void;
  onAskBuddhistAi?: (entry: DharaniEntry) => void;
}

const SCRIPT_LAYER_CHECKS: Array<{ key: keyof ScriptVisibilityConfig; label: string }> = [
  { key: 'showFullCombinedSummary', label: '全咒合并总览' },
  { key: 'showSiddham', label: '悉昙梵字' },
  { key: 'showModernPhoneticZh', label: '梵音拼读' },
  { key: 'showDevanagari', label: '天城梵文' },
  { key: 'showIast', label: '梵文 IAST' },
  { key: 'showClassicalZh', label: '古汉语音译' },
  { key: 'showProsodyMeter', label: '逐音节轻重律跟读卡' },
  { key: 'showMeaningZh', label: '汉文释义' },
  { key: 'showMeaningEn', label: '英文释义' },
  { key: 'showWordGloss', label: '逐词词根解析' },
  { key: 'showIpa', label: '国际音标 IPA' },
  { key: 'hideDerivedReference', label: '仅显示数据库原有内容' },
];

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
  navigationRequest = null,
  onRequestShare,
  onAskBuddhistAi,
}) => {
  const hasDharani = entry.verses.length > 0;
  const hasCompleteSanskrit = useMemo(() => hasEntryCompleteOriginalSanskrit(entry), [entry]);
  const isChineseOnly = useMemo(() => isClassicalChineseOnlyEntry(entry), [entry]);
  const buleiMeta = useMemo(() => CBETA_BULEI_MAP[resolveEntryBulei(entry)], [entry]);

  const defaultParallelTab: ReaderParallelTab = hasDharani ? 'dharani' : 'original';
  const [activeParallelTab, setActiveParallelTab] = useState<ReaderParallelTab>(defaultParallelTab);
  const [showProvenanceModal, setShowProvenanceModal] = useState(false);
  const [showFullTextModal, setShowFullTextModal] = useState(false);
  const [localShareTargetVerse, setLocalShareTargetVerse] = useState<{
    open: boolean;
    verseIdx: number | null;
  }>({ open: false, verseIdx: null });

  const hasReadableSource = useMemo(() => collectEntrySources(entry).length > 0, [entry]);
  const [visibleVerseLimit, setVisibleVerseLimit] = useState<number>(80);
  const interlinearTokens = entry.provenance.cbetaInterlinearTokens || [];
  const hasCompleteInterlinearTab = hasCompleteSanskrit && interlinearTokens.length > 0;

  const triggerShare = (verseIdx: number | null = null) => {
    if (!hasDharani) return;
    if (onRequestShare) {
      onRequestShare(entry, verseIdx);
    } else {
      setLocalShareTargetVerse({ open: true, verseIdx });
    }
  };

  const {
    isExporting,
    exportingFormat,
    progress: exportProgress,
    exportedMp3,
    exportedWav,
    latestExported,
    exportError,
    expectedMp3FileName,
    expectedWavFileName,
    triggerDownload,
  } = useDharaniAudioExport({
    entryId: entry.id,
    dharaniTitle: entry.titleZh,
    verses: entry.verses,
    rate: playbackState.rate,
    voice: playbackState.voice,
    mode: playbackState.mode,
  });

  useEffect(() => {
    setActiveParallelTab(entry.verses.length > 0 ? 'dharani' : 'original');
    setVisibleVerseLimit(80);
  }, [entry.id, entry.verses.length]);

  useEffect(() => {
    if (!navigationRequest || typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    if (navigationRequest.target === 'original') {
      setActiveParallelTab('original');
      const timer = window.setTimeout(
        () => scrollToReaderElement('reader-hero-section', { topGap: 10 }),
        30
      );
      return () => window.clearTimeout(timer);
    }

    if (navigationRequest.target === 'interlinear' && hasCompleteInterlinearTab) {
      setActiveParallelTab('interlinear');
      return;
    }

    if (navigationRequest.target === 'summary' && hasDharani) {
      setActiveParallelTab('dharani');
      if (!scriptConfig.showFullCombinedSummary) {
        onScriptConfigChange({ ...scriptConfig, showFullCombinedSummary: true });
      }
      const timer = window.setTimeout(
        () => scrollToReaderElement('full-dharani-combined-summary', { topGap: 12, highlight: true }),
        45
      );
      return () => window.clearTimeout(timer);
    }

    if (navigationRequest.target === 'hero') {
      const timer = window.setTimeout(
        () => scrollToReaderElement('reader-hero-section', { behavior: 'auto', topGap: 10 }),
        16
      );
      return () => window.clearTimeout(timer);
    }

    if (
      navigationRequest.target === 'verse' &&
      typeof navigationRequest.verseArrayIndex === 'number' &&
      hasDharani
    ) {
      setActiveParallelTab('dharani');
      const idx = navigationRequest.verseArrayIndex;
      const targetVerse = entry.verses[idx];
      if (!targetVerse) return;
      if (idx + 1 > visibleVerseLimit) {
        setVisibleVerseLimit(Math.min(entry.verses.length, idx + 32));
      }
      const timer = window.setTimeout(
        () => scrollToReaderElement(`verse-card-${targetVerse.id}`, { topGap: 14, highlight: true }),
        55
      );
      return () => window.clearTimeout(timer);
    }
  }, [navigationRequest, hasDharani, hasCompleteInterlinearTab, entry.verses, visibleVerseLimit, scriptConfig, onScriptConfigChange]);

  const effectiveVerseLimit =
    playbackState.isPlaying &&
    playbackState.currentVerseIndex !== null &&
    playbackState.currentVerseIndex > visibleVerseLimit - 5
      ? Math.min(entry.verses.length, playbackState.currentVerseIndex + 40)
      : visibleVerseLimit;

  return (
    <main className="reader-main" aria-label="经咒与原典平行阅读窗口">
      <section id="reader-hero-section" className="reader-unified-window">
        <header className="reader-clean-header">
          <div className="reader-clean-title-col">
            <div className="reader-clean-meta-pills">
              <span className="taisho-pill">{entry.taishoNo}</span>
              <span className="cbeta-bulei-badge">{buleiMeta.labelTrad}</span>
              {!hasDharani ? (
                <span className="entry-kind-pill is-sutra">經文原典</span>
              ) : hasCompleteSanskrit ? (
                <span className="entry-kind-pill is-sanskrit">陀羅尼·梵文</span>
              ) : (
                <span className="entry-kind-pill is-phonetic">陀羅尼·梵音（古漢音譯）</span>
              )}
              {entry.provenance.databaseBadgeZh && (
                <span className="entry-db-subtle">{entry.provenance.databaseBadgeZh}</span>
              )}
            </div>

            <h1 id="reader-entry-title" className="reader-clean-title">
              {entry.titleZh}
            </h1>

            <div className="reader-clean-byline">
              {entry.translatorZh}
              {!isChineseOnly && entry.titleSanskritIast ? ` · ${entry.titleSanskritIast}` : ''}
            </div>
          </div>

          <div className="reader-clean-actions">
            {hasCompleteSanskrit && (
              playbackState.isPlaying ? (
                <button
                  id="hero-stop-chant-btn"
                  type="button"
                  className="btn-scholarly primary"
                  onClick={onStopPlayback}
                >
                  <Square size={14} />
                  <span>{playbackState.isLoadingAudio ? '准备中 · 停止' : '停止跟诵'}</span>
                </button>
              ) : (
                <button
                  id="hero-play-all-btn"
                  type="button"
                  className="btn-scholarly primary"
                  onMouseEnter={() => sanskritAudioEngine.prewarmVerses(entry.verses, 3)}
                  onFocus={() => sanskritAudioEngine.prewarmVerses(entry.verses, 3)}
                  onClick={onPlayAllVerses}
                >
                  <Play size={14} />
                  <span>梵音跟诵</span>
                </button>
              )
            )}

            <button
              id="hero-bookmark-btn"
              type="button"
              className={`btn-scholarly ${isBookmarked ? 'gold' : ''}`}
              onClick={onToggleBookmark}
            >
              <Bookmark size={14} />
              <span>{isBookmarked ? '已收藏' : '收藏'}</span>
            </button>

            <details className="reader-more-menu">
              <summary className="btn-scholarly">
                <SlidersHorizontal size={14} />
                <span>显示与工具</span>
              </summary>
              <div className="reader-more-popover">
                {hasCompleteSanskrit && (
                  <div className="reader-more-section">
                    <div className="reader-more-section-title">显示文字层级</div>
                    <div className="reader-more-checks-grid">
                      {SCRIPT_LAYER_CHECKS.map((item) => {
                        const checked = Boolean(scriptConfig[item.key]);
                        return (
                          <label key={item.key} className="reader-more-check-item">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                onScriptConfigChange({
                                  ...scriptConfig,
                                  [item.key]: !checked,
                                })
                              }
                            />
                            <span>{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {hasCompleteSanskrit && (
                  <div className="reader-more-section">
                    <div className="reader-more-section-title">梵音语音与音频导出</div>
                    <div className="reader-more-chips">
                      {(
                        [
                          { id: 'neural-vits-48k', label: '48kHz 神经VITS' },
                          { id: 'neural-resonance-hall', label: '神经·殿堂共鸣' },
                          { id: 'neural-vedic-chant', label: '神经·定调梵呗' },
                          { id: 'studio-vocal-chant', label: '纯共振峰合成' },
                          { id: 'mandarin-phonetic-guide', label: '普通话谐音领读' },
                        ] as Array<{ id: AudioEngineMode; label: string }>
                      ).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className={`script-toggle-chip ${playbackState.mode === m.id ? 'active' : ''}`}
                          onClick={() => sanskritAudioEngine.setMode(m.id)}
                        >
                          {m.label}
                        </button>
                      ))}
                      <button
                        id="hero-voice-male-btn"
                        type="button"
                        className={`script-toggle-chip ${playbackState.voice === 'male' ? 'active' : ''}`}
                        onClick={() => sanskritAudioEngine.setVoice('male')}
                      >
                        男声
                      </button>
                      <button
                        id="hero-voice-female-btn"
                        type="button"
                        className={`script-toggle-chip ${playbackState.voice === 'female' ? 'active' : ''}`}
                        onClick={() => sanskritAudioEngine.setVoice('female')}
                      >
                        女声
                      </button>
                      <button
                        id="hero-om-drone-btn"
                        type="button"
                        className={`script-toggle-chip ${playbackState.omDroneActive ? 'active' : ''}`}
                        onClick={() => sanskritAudioEngine.toggleOmDrone()}
                      >
                        {playbackState.omDroneActive ? 'Om共振中' : 'Om共振场'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.45rem' }}>
                      <button
                        id="hero-export-mp3-btn"
                        type="button"
                        className="btn-scholarly"
                        disabled={isExporting}
                        onClick={() => triggerDownload('mp3')}
                        title={expectedMp3FileName}
                      >
                        <Download size={13} />
                        <span>{exportedMp3 ? '保存 MP3' : '下载 MP3 音频'}</span>
                      </button>
                      <button
                        id="hero-export-wav-btn"
                        type="button"
                        className="btn-scholarly"
                        disabled={isExporting}
                        onClick={() => triggerDownload('wav')}
                        title={expectedWavFileName}
                      >
                        <FileAudio size={13} />
                        <span>{exportedWav ? '保存 WAV' : '导出 WAV'}</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="reader-more-section">
                  <div className="reader-more-section-title">文献操作</div>
                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                    {hasDharani && (
                      <button
                        id="hero-share-poster-btn"
                        type="button"
                        className="btn-scholarly"
                        onClick={() => triggerShare(null)}
                      >
                        <Share2 size={13} />
                        <span>生成分享卡片</span>
                      </button>
                    )}
                    {onAskBuddhistAi && (
                      <button
                        id="hero-ask-buddhist-ai-btn"
                        type="button"
                        className="btn-scholarly"
                        onClick={() => onAskBuddhistAi(entry)}
                      >
                        <Sparkles size={13} />
                        <span>问佛经 AI</span>
                      </button>
                    )}
                    <button
                      id="hero-open-provenance-btn"
                      type="button"
                      className="btn-scholarly"
                      onClick={() => setShowProvenanceModal(true)}
                    >
                      <ShieldCheck size={13} />
                      <span>版本校勘出处</span>
                    </button>
                    {hasReadableSource && (
                      <button
                        id="hero-open-fulltext-btn"
                        type="button"
                        className="btn-scholarly"
                        onClick={() => setShowFullTextModal(true)}
                      >
                        <BookOpen size={13} />
                        <span>独立全屏阅读</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </details>
          </div>
        </header>

        {hasCompleteSanskrit && isExporting && (
          <div className="reader-export-progress" role="status">
            <Loader2 size={14} className="spin-icon" />
            <span>正在合成导出 {exportingFormat?.toUpperCase()} ({exportProgress?.percent ?? 5}%)…</span>
          </div>
        )}
        {hasCompleteSanskrit && exportError && !isExporting && (
          <div className="reader-export-progress is-error" role="alert">
            <span>导出提示：{exportError}</span>
          </div>
        )}
        {hasCompleteSanskrit && latestExported && !isExporting && (
          <div className="reader-export-progress">
            <span>音频已生成：{latestExported.fileName}</span>
            <a href={latestExported.url} download={latestExported.fileName} className="btn-scholarly primary">
              保存 .{latestExported.format.toUpperCase()}
            </a>
          </div>
        )}

        <nav className="reader-parallel-tabs" role="tablist" aria-label="平行内容切换">
          {hasDharani && (
            <button
              id="parallel-tab-dharani"
              type="button"
              role="tab"
              aria-selected={activeParallelTab === 'dharani'}
              className={`reader-parallel-tab ${activeParallelTab === 'dharani' ? 'active' : ''}`}
              onClick={() => setActiveParallelTab('dharani')}
            >
              <ScrollText size={15} />
              <span>{hasCompleteSanskrit ? '陀羅尼·梵文' : '陀羅尼·梵音'}</span>
              <span className="parallel-tab-badge">{entry.verses.length}句</span>
            </button>
          )}

          {hasReadableSource && (
            <button
              id="parallel-tab-original"
              type="button"
              role="tab"
              aria-selected={activeParallelTab === 'original'}
              className={`reader-parallel-tab ${activeParallelTab === 'original' ? 'active' : ''}`}
              onClick={() => setActiveParallelTab('original')}
            >
              <BookOpen size={15} />
              <span>原典經文</span>
            </button>
          )}

          {hasCompleteInterlinearTab && (
            <button
              id="parallel-tab-interlinear"
              type="button"
              role="tab"
              aria-selected={activeParallelTab === 'interlinear'}
              className={`reader-parallel-tab ${activeParallelTab === 'interlinear' ? 'active' : ''}`}
              onClick={() => setActiveParallelTab('interlinear')}
            >
              <Sparkles size={15} />
              <span>悉曇逐字對音</span>
              <span className="parallel-tab-badge">{interlinearTokens.length}</span>
            </button>
          )}

          <button
            id="parallel-tab-notes"
            type="button"
            role="tab"
            aria-selected={activeParallelTab === 'notes'}
            className={`reader-parallel-tab ${activeParallelTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveParallelTab('notes')}
          >
            <Info size={15} />
            <span>題解與出處</span>
          </button>
        </nav>

        <div className="reader-parallel-body">
          {activeParallelTab === 'original' && hasReadableSource && (
            <InlineOriginalTextPanel
              entry={entry}
              mode="inline"
              onOpenModal={() => setShowFullTextModal(true)}
            />
          )}

          {activeParallelTab === 'interlinear' && hasCompleteInterlinearTab && (
            <div id="reader-interlinear-section">
              <CbetaSiddhamInterlinearView
                cbetaId={entry.provenance.cbetaId}
                titleZh={entry.titleZh}
                tokens={interlinearTokens}
                onPlaySyllable={onPlaySingleSyllable}
              />
            </div>
          )}

          {activeParallelTab === 'notes' && (
            <div className="reader-notes-tab-panel">
              <div className="meta-box">
                <div className="meta-box-label">經典出處與提要</div>
                <div>{entry.meritsAndSummaryZh}</div>
              </div>
              {entry.recitationTipsZh && hasCompleteSanskrit && (
                <div className="meta-box">
                  <div className="meta-box-label">聲明學持誦要訣</div>
                  <div>{entry.recitationTipsZh}</div>
                </div>
              )}
              <div className="meta-box">
                <div className="meta-box-label">館藏底本與版本校勘信息</div>
                <div>
                  <div><strong>底本引證：</strong>{entry.provenance.editionCitation}</div>
                  {entry.provenance.manuscriptNotesZh && (
                    <div style={{ marginTop: '0.35rem' }}>
                      <strong>校勘說明：</strong>{entry.provenance.manuscriptNotesZh}
                    </div>
                  )}
                  {entry.provenance.cbetaOnlineUrl && (
                    <div style={{ marginTop: '0.45rem' }}>
                      <a
                        href={entry.provenance.cbetaOnlineUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="orig-link-btn"
                      >
                        前往 CBETA Online 原典頁核驗 →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeParallelTab === 'dharani' && hasDharani && (
            <div id="reader-dharani-section-anchor" className="verses-stack">
              <FullDharaniSummaryCard
                entry={entry}
                config={scriptConfig}
                activeVerseIndex={playbackState.isPlaying ? playbackState.currentVerseIndex : null}
                onPlayVerse={hasCompleteSanskrit ? onPlaySingleVerse : undefined}
                onToggleBracketIast={() =>
                  onScriptConfigChange({
                    ...scriptConfig,
                    showPhoneticIastBracket: !scriptConfig.showPhoneticIastBracket,
                  })
                }
              />

              {(entry.verses.length > 1 || hasCompleteSanskrit) &&
                entry.verses.slice(0, effectiveVerseLimit).map((verse, idx) => (
                  <VerseBlock
                    key={verse.id}
                    verse={verse}
                    config={scriptConfig}
                    isVersePlaying={
                      hasCompleteSanskrit &&
                      playbackState.isPlaying &&
                      playbackState.currentVerseIndex === verse.index
                    }
                    isLoadingAudio={Boolean(playbackState.isLoadingAudio)}
                    activeSyllableIndex={playbackState.currentSyllableIndex}
                    verseProgress={
                      playbackState.isPlaying && playbackState.currentVerseIndex === verse.index
                        ? playbackState.verseProgress
                        : 0
                    }
                    autoScroll={playbackState.autoScroll}
                    onPlayVerse={() => onPlaySingleVerse(idx)}
                    onPlaySyllable={onPlaySingleSyllable}
                    onShareVerse={() => triggerShare(idx)}
                  />
                ))}

              {entry.verses.length > effectiveVerseLimit && (
                <div className="verse-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    已展开前 {effectiveVerseLimit} / {entry.verses.length} 句
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      id="btn-expand-more-verses"
                      type="button"
                      className="btn-scholarly"
                      onClick={() => setVisibleVerseLimit((prev) => Math.min(entry.verses.length, prev + 120))}
                    >
                      继续展开 120 句
                    </button>
                    <button
                      id="btn-expand-all-verses"
                      type="button"
                      className="btn-scholarly primary"
                      onClick={() => setVisibleVerseLimit(entry.verses.length)}
                    >
                      展开全部 ({entry.verses.length} 句)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {showProvenanceModal && (
        <AuthoritativeSourceModal
          entry={entry}
          onClose={() => setShowProvenanceModal(false)}
          onOpenFullText={
            hasReadableSource
              ? () => {
                  setShowProvenanceModal(false);
                  setShowFullTextModal(true);
                }
              : undefined
          }
        />
      )}

      {showFullTextModal && (
        <OriginalFullTextModal entry={entry} onClose={() => setShowFullTextModal(false)} />
      )}

      {hasDharani && !onRequestShare && localShareTargetVerse.open && (
        <DharaniShareModal
          entry={entry}
          scriptConfig={scriptConfig}
          playbackState={playbackState}
          initialVerseIndex={localShareTargetVerse.verseIdx}
          theme={
            typeof document !== 'undefined' &&
            document.documentElement.getAttribute('data-theme') === 'dark'
              ? 'dark'
              : 'light'
          }
          onClose={() => setLocalShareTargetVerse({ open: false, verseIdx: null })}
        />
      )}
    </main>
  );
};
