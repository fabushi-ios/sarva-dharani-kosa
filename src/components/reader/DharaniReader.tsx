import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Square,
  Bookmark,
  ShieldCheck,
  Sparkles,
  Download,
  FileAudio,
  Volume2,
  Database,
  ChevronDown,
  Loader2,
  BookOpen,
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
import type { EnrichedBijaLexiconEntry } from '../../core/bijaLexiconEngine';
import type { CanonicalConcordanceCluster } from '../../types/corpus';
import { ScriptControlBar } from './ScriptControlBar';
import { FullDharaniSummaryCard } from './FullDharaniSummaryCard';
import { VerseBlock } from './VerseBlock';
import { CbetaSiddhamInterlinearView } from './CbetaSiddhamInterlinearView';
import { AuthoritativeSourceModal } from './AuthoritativeSourceModal';
import { OriginalFullTextModal } from './OriginalFullTextModal';
import { collectEntrySources } from '../../core/sources/entrySources';
import {
  summarizeEntryFieldProvenance,
  TRACKABLE_FIELD_LABELS_ZH,
} from '../../core/provenance/fieldProvenance';
import { scrollToReaderElement } from '../../core/dom/scrollUtils';

export interface ReaderNavigationRequest {
  target: 'hero' | 'summary' | 'interlinear' | 'concordance' | 'verse';
  verseArrayIndex?: number;
  nonce: number;
}

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
}

const FAST_BIJA_DEFAULTS: Record<
  string,
  Pick<
    EnrichedBijaLexiconEntry,
    | 'bijaIast'
    | 'bijaSiddham'
    | 'bijaDevanagari'
    | 'tangChinese'
    | 'phonemicBreakdown'
    | 'buddhistMeaning'
  >
> = {
  'hrīḥ': {
    bijaIast: 'hrīḥ',
    bijaSiddham: '𑖮𑖿𑖨𑖱𑖾',
    bijaDevanagari: 'ह्रीः',
    tangChinese: '纥哩 / 哩 (hrīḥ)',
    phonemicBreakdown: ['h (hetu 因)', 'r (rajas 离尘)', 'ī (īśvara 自在)', 'ḥ (nirvāṇa 寂静)'],
    buddhistMeaning: '圣观自在菩萨与阿弥陀如来根本种子字（莲华部心），具足四字法门：因业离尘、自在解脱。',
  },
  'bhrūṃ': {
    bijaIast: 'bhrūṃ',
    bijaSiddham: '𑖥𑖿𑖨𑖳𑖼',
    bijaDevanagari: 'भ्रूं',
    tangChinese: '普隆 / 勃笼 (bhrūṃ)',
    phonemicBreakdown: ['bh (bhava 破有)', 'r (raja 清净)', 'ū (ūrdhva 无上)', 'ṃ (bindu 大空)'],
    buddhistMeaning: '一字金轮佛顶与佛顶尊胜陀罗尼根本种子字，统摄一切如来顶髻无上功德。',
  },
  'dhīḥ': {
    bijaIast: 'dhīḥ',
    bijaSiddham: '𑖠𑖱𑖾',
    bijaDevanagari: 'धीः',
    tangChinese: '地哩 (dhīḥ)',
    phonemicBreakdown: ['dh (dharmadhātu 法界)', 'ī (samādhi 三昧)', 'ḥ (nirvāṇa 般若寂灭)'],
    buddhistMeaning: '文殊师利菩萨与般若波罗蜜多根本种子字，表实相般若与法界根本智。',
  },
  'hūṃ': {
    bijaIast: 'hūṃ',
    bijaSiddham: '𑖮𑖳𑖼',
    bijaDevanagari: 'हूं',
    tangChinese: '吽 / 𤙖 (hūṃ)',
    phonemicBreakdown: ['h (hetu 菩提因)', 'ū (ūha 摧破障难)', 'ṃ (mahāśūnyatā 大空智)'],
    buddhistMeaning: '阿閦如来、金刚萨埵及诸大明王护法根本种子字（金刚部心），坚固不坏、摧破一切魔障。',
  },
  'śrīṃ': {
    bijaIast: 'śrīṃ',
    bijaSiddham: '𑖫𑖿𑖨𑖱𑖼',
    bijaDevanagari: 'श्रीं',
    tangChinese: '室哩 / 室𠼝 (śrīṃ)',
    phonemicBreakdown: ['ś (śānti 寂静吉祥)', 'r (ratna 福德宝)', 'īṃ (samṛddhi 圆满增益)'],
    buddhistMeaning: '大吉祥天女与持世菩萨根本种子字，表福慧庄严、世出世间资粮丰足。',
  },
  'oṃ': {
    bijaIast: 'oṃ',
    bijaSiddham: '𑖌𑖼',
    bijaDevanagari: 'ओं',
    tangChinese: '唵 / 嗡 (oṃ = a + u + ṃ)',
    phonemicBreakdown: ['a (dharmakāya 法身)', 'u (saṃbhogakāya 报身)', 'ṃ (nirmāṇakāya 化身)'],
    buddhistMeaning: '一切陀罗尼之总持母音，统摄佛宝法宝僧宝、法报化三身与身语意三密相应。',
  },
};

const FAST_DEFAULT_CONCORDANCE: Pick<
  CanonicalConcordanceCluster,
  'canonicalTitleZh' | 'canonicalTitleSanskrit' | 'witnessSummary'
> = {
  canonicalTitleSanskrit: 'Sarva-Tathāgata-Dhāraṇī-Piṭaka',
  canonicalTitleZh: '梵汉藏英十二大国际权威梵典库平行同源对勘',
  witnessSummary: [
    {
      dbId: 'db1_fangshan',
      recordId: 'F28n1071',
      script: 'Siddham',
      label: '房山石经《释教最上乘秘密藏陀罗尼集》辽金刻石对音本',
      sampleMantraOrIncipit: 'namo ratnatrayāya nama āryāvalokiteśvarāya bodhisattvāya',
      url: 'https://cbetaonline.dila.edu.tw/zh/F28n1071',
    },
    {
      dbId: 'db3_dsbc_gretil',
      recordId: 'GRETIL-DSBC',
      script: 'IAST',
      label: '哥廷根大学 GRETIL & 尼泊尔 DSBC 梵文贝叶经校勘本',
      sampleMantraOrIncipit: 'oṃ bhrūṃ svāhā | oṃ amṛta-āyur-dade svāhā',
      url: 'https://gretil.sub.uni-goettingen.de/',
    },
    {
      dbId: 'db4_84000',
      recordId: 'Toh-597',
      script: 'Tibetan-EWTS',
      label: '84000 藏文《甘珠尔·秘密部》梵藏对音校勘本',
      sampleMantraOrIncipit: 'oM ma Ni pa d+me hUM | gate gate pāragate pārasaṃgate bodhi svāhā',
      url: 'https://read.84000.co/',
    },
    {
      dbId: 'db7_cudl_hidas',
      recordId: 'MS-ADD-1346',
      script: 'Devanagari',
      label: '剑桥大学图书馆 CUDL 帕拉王朝尼泊尔梵文贝叶经写本',
      sampleMantraOrIncipit: 'oṃ namo bhagavate sarvatrailokyaprativiśiṣṭāya buddhāya te namaḥ',
      url: 'https://cudl.lib.cam.ac.uk/view/MS-ADD-01346/1',
    },
  ],
};

function inferEntryBijaIast(entry: DharaniEntry): string {
  if (entry.bijaIast) return entry.bijaIast;
  const title = `${entry.titleZh} ${entry.titleSanskritIast} ${entry.deityZh}`.toLowerCase();
  if (title.includes('尊胜') || title.includes('uṣṇīṣa') || title.includes('佛顶')) return 'bhrūṃ';
  if (title.includes('观音') || title.includes('大悲') || title.includes('avalokite') || title.includes('弥陀') || title.includes('amitā')) return 'hrīḥ';
  if (title.includes('文殊') || title.includes('般若') || title.includes('心经') || title.includes('prajñā') || title.includes('mañju')) return 'dhīḥ';
  if (title.includes('金刚') || title.includes('不动') || title.includes('明王') || title.includes('vajra') || title.includes('百字')) return 'hūṃ';
  if (title.includes('吉祥') || title.includes('财源') || title.includes('lakṣmī') || title.includes('vasudhārā')) return 'śrīṃ';
  if (title.includes('准提') || title.includes('cundā')) return 'oṃ';
  if (entry.categoryId === 'buddhas-bodhisattvas') return 'hrīḥ';
  if (entry.categoryId === 'vidyarajas-protectors') return 'hūṃ';
  if (entry.categoryId === 'prajna-sutra-hrdaya') return 'dhīḥ';
  if (entry.categoryId === 'global-12db-canon') return 'bhrūṃ';
  return 'oṃ';
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
  onNavigateTab,
  navigationRequest = null,
}) => {
  const [readerSubMode, setReaderSubMode] = useState<'verses' | 'cbeta-interlinear'>('verses');
  const [showProvenanceModal, setShowProvenanceModal] = useState(false);
  const [showFullTextModal, setShowFullTextModal] = useState(false);
  const hasReadableSource = useMemo(() => collectEntrySources(entry).length > 0, [entry]);
  const [visibleVerseLimit, setVisibleVerseLimit] = useState<number>(80);
  const [metaExpanded, setMetaExpanded] = useState<boolean>(true);
  const interlinearTokens = entry.provenance.cbetaInterlinearTokens || [];
  const hasSiddhamInterlinear = interlinearTokens.length > 0;

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

  // On small mobile screens, collapse long scholarly notes by default so users reach verses immediately
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setMetaExpanded(false);
    }
  }, []);

  const entryProvSummary = useMemo(() => summarizeEntryFieldProvenance(entry), [entry]);
  const hasDiplomaticWitness = useMemo(
    () => entry.verses.some((v) => Boolean(v.diplomaticOriginal && v.diplomaticOriginal.trim())),
    [entry.verses]
  );

  const targetBijaIast = useMemo(() => inferEntryBijaIast(entry), [entry]);

  const bijaLexiconEntry =
    FAST_BIJA_DEFAULTS[targetBijaIast] || FAST_BIJA_DEFAULTS['oṃ'];
  const matchedConcordanceCluster = useMemo(
    () => ({
      ...FAST_DEFAULT_CONCORDANCE,
      canonicalTitleZh: entry.titleZh,
      canonicalTitleSanskrit: entry.titleSanskritIast,
    }),
    [entry.titleZh, entry.titleSanskritIast]
  );

  useEffect(() => {
    setReaderSubMode('verses');
    setVisibleVerseLimit(80);
  }, [entry.id]);

  // Execute section, title hero, or verse jump requested from search or sidebar outline
  useEffect(() => {
    if (!navigationRequest || typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    if (navigationRequest.target === 'interlinear' && hasSiddhamInterlinear) {
      setReaderSubMode('cbeta-interlinear');
      const timer = window.setTimeout(
        () => scrollToReaderElement('reader-interlinear-section', { topGap: 12 }),
        40
      );
      return () => window.clearTimeout(timer);
    }

    if (navigationRequest.target === 'summary') {
      setReaderSubMode('verses');
      if (!scriptConfig.showFullCombinedSummary) {
        onScriptConfigChange({ ...scriptConfig, showFullCombinedSummary: true });
      }
      const timer = window.setTimeout(
        () =>
          scrollToReaderElement('full-dharani-combined-summary', {
            topGap: 12,
            highlight: true,
          }),
        45
      );
      return () => window.clearTimeout(timer);
    }

    if (navigationRequest.target === 'hero') {
      const timer = window.setTimeout(
        () =>
          scrollToReaderElement('reader-hero-section', {
            behavior: 'auto',
            topGap: 10,
          }),
        16
      );
      return () => window.clearTimeout(timer);
    }

    if (navigationRequest.target === 'concordance') {
      const timer = window.setTimeout(
        () => scrollToReaderElement('reader-concordance-section', { topGap: 12 }),
        24
      );
      return () => window.clearTimeout(timer);
    }

    if (
      navigationRequest.target === 'verse' &&
      typeof navigationRequest.verseArrayIndex === 'number'
    ) {
      const idx = navigationRequest.verseArrayIndex;
      const targetVerse = entry.verses[idx];
      if (!targetVerse) return;
      setReaderSubMode('verses');
      if (idx + 1 > visibleVerseLimit) {
        setVisibleVerseLimit(Math.min(entry.verses.length, idx + 32));
      }
      const timer = window.setTimeout(
        () =>
          scrollToReaderElement(`verse-card-${targetVerse.id}`, {
            topGap: 14,
            highlight: true,
          }),
        55
      );
      return () => window.clearTimeout(timer);
    }
  }, [navigationRequest]);

  const effectiveVerseLimit =
    playbackState.isPlaying &&
    playbackState.currentVerseIndex !== null &&
    playbackState.currentVerseIndex > visibleVerseLimit - 5
      ? Math.min(entry.verses.length, playbackState.currentVerseIndex + 40)
      : visibleVerseLimit;

  return (
    <main className="reader-main" aria-label="梵文陀罗尼多体对照阅读区">
      <section id="reader-hero-section" className="dharani-hero-card">
        <div className="hero-top-bar">
          <div className="hero-badges-row">
            <span className="taisho-pill">{entry.taishoNo}</span>
            <span className="deity-pill">本尊：{entry.deityZh}</span>
            {entry.provenance.databaseBadgeZh && (
              <span
                className="deity-pill"
                style={{
                  background: 'var(--accent-vermilion-soft)',
                  color: 'var(--accent-vermilion)',
                  borderColor: 'var(--accent-vermilion-border)',
                  fontWeight: 700,
                }}
              >
                {entry.provenance.databaseBadgeZh}
              </span>
            )}
            <span
              className="deity-pill"
              style={{
                background: 'var(--accent-lapis-soft)',
                color: 'var(--accent-lapis)',
                borderColor: 'var(--accent-lapis-border)',
              }}
            >
              {entry.provenance.sourceType}
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
                <span>{playbackState.isLoadingAudio ? '准备梵音中 · 停止' : '停止讽诵'}</span>
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
                <span>全咒同步跟诵 ({entry.verses.length}句)</span>
              </button>
            )}

            <button
              id="hero-export-mp3-btn"
              type="button"
              className="btn-scholarly gold"
              disabled={isExporting || entry.verses.length === 0}
              onClick={() => triggerDownload('mp3')}
              title={`将当前陀罗尼导出为 48,000 Hz 192kbps MP3 音频：${expectedMp3FileName}`}
            >
              {isExporting && exportingFormat === 'mp3' ? (
                <>
                  <Loader2 size={14} className="spin-icon" />
                  <span>
                    {exportProgress?.phase === 'encoding' ? '编码 MP3' : '合成语音'}{' '}
                    {exportProgress?.percent ?? 5}%
                  </span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>{exportedMp3 ? '下载 MP3 (已就绪)' : '下载 MP3 音频'}</span>
                </>
              )}
            </button>

            <button
              id="hero-export-wav-btn"
              type="button"
              className="btn-scholarly"
              disabled={isExporting || entry.verses.length === 0}
              onClick={() => triggerDownload('wav')}
              title={`将当前陀罗尼导出为无损 48,000 Hz 16-bit WAV 音频：${expectedWavFileName}`}
            >
              {isExporting && exportingFormat === 'wav' ? (
                <>
                  <Loader2 size={14} className="spin-icon" />
                  <span>合成 WAV {exportProgress?.percent ?? 5}%</span>
                </>
              ) : (
                <>
                  <FileAudio size={14} />
                  <span>{exportedWav ? '下载 WAV (已就绪)' : '导出 WAV'}</span>
                </>
              )}
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
                    ? `悉昙对音 (${interlinearTokens.length}字)`
                    : '返回全句解析'}
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
              <span>原典核验</span>
            </button>

            {hasReadableSource && (
              <button
                id="hero-open-fulltext-btn"
                type="button"
                className="btn-scholarly"
                onClick={() => setShowFullTextModal(true)}
              >
                <BookOpen size={14} />
                <span>原文全文</span>
              </button>
            )}

            <button
              id="hero-bookmark-btn"
              type="button"
              className={`btn-scholarly ${isBookmarked ? 'gold' : ''}`}
              onClick={onToggleBookmark}
            >
              <Bookmark size={14} />
              <span>{isBookmarked ? '已入藏' : '收藏'}</span>
            </button>
          </div>
        </div>

        {/* Title & Bīja Seed Syllable Seal Row */}
        <div className="hero-identity-row">
          <div className="hero-title-block">
            <h1 id="reader-entry-title" className="hero-title-zh">
              {entry.titleZh}
            </h1>
            <div className="hero-title-skt">{entry.titleSanskritIast}</div>
            <div className="hero-translator-line">
              {entry.titleEnglish} · 译者与校勘：{entry.translatorZh}
            </div>
          </div>

          {bijaLexiconEntry && (
            <button
              type="button"
              className="bija-seal-card"
              onClick={() => onPlaySingleSyllable(bijaLexiconEntry.bijaIast)}
              title="点击试听 48,000 Hz 本尊种子字发音（含空海 T84n2701 与牛津 OCHS Bījanighaṇṭu 种子字密意）"
            >
              <div className="bija-seal-emblem">
                <span
                  className="siddham-glyph"
                  style={{ fontSize: '1.6rem', color: 'var(--accent-vermilion)', lineHeight: 1.1 }}
                >
                  {bijaLexiconEntry.bijaSiddham}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-gold)', whiteSpace: 'nowrap' }}>
                  <span className="devanagari-glyph">{bijaLexiconEntry.bijaDevanagari}</span> · <span className="iast-text">{bijaLexiconEntry.bijaIast}</span>
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.16rem', fontSize: '0.74rem', minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  本尊种子字：唐音「{bijaLexiconEntry.tangChinese}」🔊
                </div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                  <strong>OCHS 构件：</strong>
                  {bijaLexiconEntry.phonemicBreakdown.slice(0, 3).join(' + ')}
                </div>
                <div style={{ color: 'var(--text-muted)', lineHeight: 1.38 }}>
                  {bijaLexiconEntry.buddhistMeaning}
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Compact Segmented Audio Engine & Voice Strip */}
        <div className="hero-audio-strip">
          <div className="hero-audio-group">
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.24rem',
                flexShrink: 0,
              }}
            >
              <Volume2 size={14} />
              <span>发音方案：</span>
            </span>

            {(
              [
                {
                  id: 'neural-vits-48k',
                  label: '48kHz 神经VITS',
                  tip: '原生 48,000 Hz 古典梵语神经网络纯净干声',
                },
                {
                  id: 'neural-resonance-hall',
                  label: '神经·殿堂共鸣',
                  tip: '保留神经模型自然语调 + 136.1Hz 共鸣弦泛音激励 + 胸腔暖音 + 石窟殿堂混响',
                },
                {
                  id: 'neural-vedic-chant',
                  label: '神经·定调梵呗',
                  tip: '清浊分离保共振峰 TD-PSOLA 锁定 136.1Hz 轻重律吟唱音阶 + 全套殿堂共鸣声场',
                },
                {
                  id: 'studio-vocal-chant',
                  label: '纯共振峰合成',
                  tip: '136.1Hz 离线数学公式声道共振峰电子合成',
                },
                {
                  id: 'mandarin-phonetic-guide',
                  label: '普通话谐音领读',
                  tip: '现代梵音汉字拼读慢速教学领诵',
                },
                {
                  id: 'indic-devanagari-tts',
                  label: '天城文TTS',
                  tip: '浏览器系统天城文语音合成',
                },
              ] as Array<{ id: AudioEngineMode; label: string; tip: string }>
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                className={`script-toggle-chip ${playbackState.mode === m.id ? 'active' : ''}`}
                onClick={() => sanskritAudioEngine.setMode(m.id)}
                title={m.tip}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="hero-audio-group">
            <button
              id="hero-voice-male-btn"
              type="button"
              className={`script-toggle-chip ${playbackState.voice === 'male' ? 'active' : ''}`}
              onClick={() => sanskritAudioEngine.setVoice('male')}
              title="切换至 IIT Madras Rasa 古典梵语男声模型 (sa_studio_male / 136.1Hz)"
            >
              男声
            </button>
            <button
              id="hero-voice-female-btn"
              type="button"
              className={`script-toggle-chip ${playbackState.voice === 'female' ? 'active' : ''}`}
              onClick={() => sanskritAudioEngine.setVoice('female')}
              title="切换至 IIT Madras Rasa 古典梵语女声模型 (sa_studio_female / 224Hz)"
            >
              女声
            </button>

            <button
              id="hero-om-drone-btn"
              type="button"
              className={`script-toggle-chip ${playbackState.omDroneActive ? 'active' : ''}`}
              onClick={() => sanskritAudioEngine.toggleOmDrone()}
              title="开启或关闭 136.1Hz Sadja (Om) + 204.15Hz Pa 持续共振背景音场"
            >
              {playbackState.omDroneActive ? '🔔 Om共振中' : '🔕 Om共振场'}
            </button>

            <span
              className="engine-status-pill"
              title={`当前激活语音模型：${playbackState.activeModel || 'gnumanth/ninada:onnx/sa.onnx'} (48,000 Hz)`}
            >
              ● 48kHz VITS就绪
            </span>
          </div>
        </div>

        {/* Live Synthesis & Encoding Progress Banner */}
        {isExporting && (
          <div
            role="status"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--accent-gold-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.68rem 0.95rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.42rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--accent-vermilion)',
              }}
            >
              <span>
                ⏳{' '}
                {exportProgress?.phase === 'encoding'
                  ? `正在编码高音质 ${exportingFormat?.toUpperCase()} 文件：${
                      exportingFormat === 'wav' ? expectedWavFileName : expectedMp3FileName
                    }`
                  : `正在逐句合成 48,000 Hz 梵音音频 (${exportProgress?.completedChunks ?? 0}/${
                      exportProgress?.totalChunks ?? entry.verses.length
                    })，合成完毕后将自动弹出下载...`}
              </span>
              <span>{exportProgress?.percent ?? 5}%</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '999px',
                background: 'var(--border-subtle)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.max(5, exportProgress?.percent ?? 5)}%`,
                  height: '100%',
                  background: 'var(--accent-vermilion)',
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
          </div>
        )}

        {/* Export Error Recovery Banner */}
        {exportError && !isExporting && (
          <div
            role="alert"
            style={{
              background: 'var(--accent-vermilion-soft)',
              border: '1px solid var(--accent-vermilion-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.65rem 0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.65rem',
              fontSize: '0.8rem',
              color: 'var(--accent-vermilion)',
              fontWeight: 600,
            }}
          >
            <span>⚠️ {exportError}</span>
            <button
              type="button"
              className="btn-scholarly primary"
              onClick={() => triggerDownload('mp3')}
            >
              <Download size={13} />
              <span>重新下载 MP3</span>
            </button>
          </div>
        )}

        {/* Native MP3 / WAV Audio Player & Download Card when generated */}
        {latestExported && !isExporting && (
          <div
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--accent-gold-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
              <div style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--accent-vermilion)' }}>
                音频已生成并触发下载：{latestExported.fileName}（时长{' '}
                {latestExported.durationSec.toFixed(1)} 秒）
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                若浏览器拦截了自动下载，可点击右侧按钮直接保存至本地或手机离线收听。
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap', maxWidth: '100%' }}>
              <audio
                controls
                src={latestExported.url}
                style={{ height: '36px', maxWidth: '100%' }}
              />
              <a
                href={latestExported.url}
                download={latestExported.fileName}
                className="btn-scholarly primary"
              >
                <Download size={14} />
                <span>保存 .{latestExported.format.toUpperCase()} 文件</span>
              </a>
              {latestExported.format === 'mp3' && !exportedWav && (
                <button
                  type="button"
                  className="btn-scholarly"
                  onClick={() => triggerDownload('wav')}
                >
                  <FileAudio size={14} />
                  <span>另存 WAV</span>
                </button>
              )}
              {latestExported.format === 'wav' && !exportedMp3 && (
                <button
                  type="button"
                  className="btn-scholarly"
                  onClick={() => triggerDownload('mp3')}
                >
                  <Download size={14} />
                  <span>另存 MP3</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scholarly Source & Recitation Notes (Collapsible on Mobile) */}
        <details
          className="hero-meta-details"
          open={metaExpanded}
          onToggle={(e) => setMetaExpanded((e.currentTarget as HTMLDetailsElement).open)}
        >
          <summary className="hero-meta-summary">
            <span>经典出处、功德摄要与声明学持诵要诀</span>
            <ChevronDown size={15} />
          </summary>
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
        </details>
      </section>

      <ScriptControlBar
        config={scriptConfig}
        onChange={onScriptConfigChange}
        hasSiddhamInterlinear={hasSiddhamInterlinear}
        interlinearCount={interlinearTokens.length}
        readerSubMode={readerSubMode}
        onReaderSubModeChange={setReaderSubMode}
      />

      {readerSubMode === 'verses' && (
        <section
          id="entry-provenance-legend-banner"
          className="provenance-legend-banner"
          aria-label="库藏原文与处理参考区分说明"
        >
          <div className="provenance-legend-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.78rem' }}>
                文献溯源标识：
              </strong>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                全段原载标{' '}
                <span className="prov-origin-badge is-original is-compact">● 库藏原文</span>；
                部分原载标{' '}
                <span className="prov-origin-badge is-mixed is-compact">
                  <span className="prov-part-orig">● 原载</span>
                  <span className="prov-part-sep">+</span>
                  <span className="prov-part-ref">◇ 参考</span>
                </span>
                （正文内 <span className="prov-seg-orig">原载内容</span> 与{' '}
                <span className="prov-seg-ref">参考内容</span> 同色对应）；全段补全标{' '}
                <span className="prov-origin-badge is-reference is-compact">◇ 处理参考</span>。
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                id="banner-toggle-hide-reference-btn"
                type="button"
                className={`btn-scholarly ${scriptConfig.hideDerivedReference ? 'primary' : ''}`}
                style={{ padding: '0.22rem 0.58rem', fontSize: '0.73rem' }}
                onClick={() =>
                  onScriptConfigChange({
                    ...scriptConfig,
                    hideDerivedReference: !scriptConfig.hideDerivedReference,
                  })
                }
              >
                <span>
                  {scriptConfig.hideDerivedReference
                    ? '恢复显示处理参考层'
                    : '仅看库藏原文'}
                </span>
              </button>
            </div>
          </div>

          <details className="provenance-fields-details">
            <summary>
              <span>
                查看本条各字段来源明细（原文{' '}
                {entryProvSummary.originalFields.length +
                  entryProvSummary.mixedFields.length +
                  (hasDiplomaticWitness ? 1 : 0)}{' '}
                项 · 推导参考 {entryProvSummary.derivedFields.length} 项）
              </span>
              <ChevronDown size={13} />
            </summary>
            <div className="provenance-legend-groups">
              <div>
                <strong style={{ color: 'var(--accent-vermilion)', marginRight: '0.35rem' }}>
                  ● 本条库藏原文：
                </strong>
                {hasDiplomaticWitness && (
                  <span className="provenance-field-pill is-original">写本原貌</span>
                )}
                {entryProvSummary.originalFields.map((f) => (
                  <span key={`orig-${f}`} className="provenance-field-pill is-original">
                    {TRACKABLE_FIELD_LABELS_ZH[f]}
                  </span>
                ))}
                {entryProvSummary.mixedFields.map((f) => (
                  <span key={`mix-${f}`} className="provenance-field-pill is-mixed">
                    <span>{TRACKABLE_FIELD_LABELS_ZH[f]}</span>
                    <span style={{ fontSize: '0.68rem' }}>
                      (<span className="prov-part-orig">●原载</span>
                      <span className="prov-part-sep">+</span>
                      <span className="prov-part-ref">◇参考</span>)
                    </span>
                  </span>
                ))}
                {!hasDiplomaticWitness &&
                  entryProvSummary.originalFields.length === 0 &&
                  entryProvSummary.mixedFields.length === 0 && (
                    <span style={{ color: 'var(--text-muted)' }}>（本条为目录提要记录）</span>
                  )}
              </div>

              {entryProvSummary.derivedFields.length > 0 && (
                <div>
                  <strong style={{ color: 'var(--accent-gold)', marginRight: '0.35rem' }}>
                    ◇ 处理推导参考（仅供参考）：
                  </strong>
                  {entryProvSummary.derivedFields.map((f) => (
                    <span key={`ref-${f}`} className="provenance-field-pill is-reference">
                      {TRACKABLE_FIELD_LABELS_ZH[f]}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </details>
        </section>
      )}

      {readerSubMode === 'cbeta-interlinear' && hasSiddhamInterlinear ? (
        <div id="reader-interlinear-section">
          <CbetaSiddhamInterlinearView
            cbetaId={entry.provenance.cbetaId}
            titleZh={entry.titleZh}
            tokens={interlinearTokens}
            onPlaySyllable={onPlaySingleSyllable}
          />
        </div>
      ) : (
        <div className="verses-stack">
          <FullDharaniSummaryCard
            entry={entry}
            config={scriptConfig}
            activeVerseIndex={playbackState.isPlaying ? playbackState.currentVerseIndex : null}
            onPlayVerse={onPlaySingleVerse}
            onToggleBracketIast={() =>
              onScriptConfigChange({
                ...scriptConfig,
                showPhoneticIastBracket: !scriptConfig.showPhoneticIastBracket,
              })
            }
          />

          {entry.verses.slice(0, effectiveVerseLimit).map((verse, idx) => (
            <VerseBlock
              key={verse.id}
              verse={verse}
              config={scriptConfig}
              isVersePlaying={
                playbackState.isPlaying && playbackState.currentVerseIndex === verse.index
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
            />
          ))}

          {entry.verses.length > effectiveVerseLimit && (
            <div
              className="verse-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                padding: '0.85rem 1.1rem',
                border: '1px dashed var(--accent-gold-border)',
                background: 'var(--bg-elevated)',
              }}
            >
              <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                上方「全咒六体汇总总览」已完整呈现全部 <strong>{entry.verses.length}</strong> 句全文；下方逐音节精解卡片当前已展开第{' '}
                <strong>1–{effectiveVerseLimit}</strong> 句（剩余{' '}
                <strong>{entry.verses.length - effectiveVerseLimit}</strong> 句）。
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  id="btn-expand-more-verses"
                  type="button"
                  className="btn-scholarly gold"
                  onClick={() =>
                    setVisibleVerseLimit((prev) => Math.min(entry.verses.length, prev + 120))
                  }
                >
                  <span>继续展开后续 120 句</span>
                </button>
                <button
                  id="btn-expand-all-verses"
                  type="button"
                  className="btn-scholarly primary"
                  onClick={() => setVisibleVerseLimit(entry.verses.length)}
                >
                  <span>展开全部 {entry.verses.length} 句精解</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 跨 12 大权威数据库同源见证与平行对勘面板 */}
      {matchedConcordanceCluster && (
        <section
          id="reader-concordance-section"
          className="dharani-hero-card"
          style={{ marginTop: '0.35rem' }}
          aria-label="全球12大梵文陀罗尼数据库同源见证"
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.6rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
              <Database size={16} color="var(--accent-vermilion)" style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                跨 12 大数据库同源见证：{matchedConcordanceCluster.canonicalTitleZh}
              </span>
            </div>

            {onNavigateTab && (
              <div style={{ display: 'flex', gap: '0.42rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-scholarly"
                  onClick={() => onNavigateTab('hub')}
                >
                  <span>12大数据库 (DB1–12)</span>
                </button>
                <button
                  type="button"
                  className="btn-scholarly"
                  onClick={() => onNavigateTab('concordance')}
                >
                  <span>16本同源对勘台</span>
                </button>
                <button
                  type="button"
                  className="btn-scholarly"
                  onClick={() => onNavigateTab('interlinear')}
                >
                  <span>房山石经对音 (741部)</span>
                </button>
                <button
                  type="button"
                  className="btn-scholarly"
                  onClick={() => onNavigateTab('cudl')}
                >
                  <span>剑桥 CUDL 贝叶经馆</span>
                </button>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 245px), 1fr))',
              gap: '0.65rem',
            }}
          >
            {matchedConcordanceCluster.witnessSummary.slice(0, 6).map((w, idx) => (
              <div
                key={`${w.dbId}-${idx}`}
                className="meta-box"
                style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'var(--accent-vermilion)',
                      background: 'var(--accent-vermilion-soft)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                    }}
                  >
                    {w.dbId.toUpperCase()} · {w.script}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {w.recordId}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                  {w.label}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-iast)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {w.sampleMantraOrIncipit}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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
    </main>
  );
};
