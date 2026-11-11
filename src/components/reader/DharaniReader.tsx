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
  ExternalLink,
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
import type { EnrichedBijaLexiconEntry } from '../../core/bijaLexiconEngine';
import type { CanonicalConcordanceCluster } from '../../types/corpus';
import { ScriptControlBar } from './ScriptControlBar';
import { FullDharaniSummaryCard } from './FullDharaniSummaryCard';
import { VerseBlock } from './VerseBlock';
import { CbetaSiddhamInterlinearView } from './CbetaSiddhamInterlinearView';
import { AuthoritativeSourceModal } from './AuthoritativeSourceModal';
import {
  summarizeEntryFieldProvenance,
  TRACKABLE_FIELD_LABELS_ZH,
} from '../../core/provenance/fieldProvenance';

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
    bhrūṃ: 'bhrūṃ',
    bijaIast: 'bhrūṃ',
    bijaSiddham: '𑖥𑖿𑖨𑖳𑖼',
    bijaDevanagari: 'भ्रूं',
    tangChinese: '普隆 / 勃笼 (bhrūṃ)',
    phonemicBreakdown: ['bh (bhava 破有)', 'r (raja 清净)', 'ū (ūrdhva 无上)', 'ṃ (bindu 大空)'],
    buddhistMeaning: '一字金轮佛顶与佛顶尊胜陀罗尼根本种子字，统摄一切如来顶髻无上功德。',
  } as unknown as Pick<
    EnrichedBijaLexiconEntry,
    'bijaIast' | 'bijaSiddham' | 'bijaDevanagari' | 'tangChinese' | 'phonemicBreakdown' | 'buddhistMeaning'
  >,
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
}) => {
  const [readerSubMode, setReaderSubMode] = useState<'verses' | 'cbeta-interlinear'>('verses');
  const [showProvenanceModal, setShowProvenanceModal] = useState(false);
  const [visibleVerseLimit, setVisibleVerseLimit] = useState<number>(80);
  const [generatedWav, setGeneratedWav] = useState<{
    url: string;
    durationSec: number;
    fileName: string;
    model?: string;
  } | null>(null);
  const [isGeneratingWav, setIsGeneratingWav] = useState(false);
  const interlinearTokens = entry.provenance.cbetaInterlinearTokens || [];
  const hasSiddhamInterlinear = interlinearTokens.length > 0;

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
    setGeneratedWav((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
  }, [entry.id]);

  const effectiveVerseLimit =
    playbackState.isPlaying &&
    playbackState.currentVerseIndex !== null &&
    playbackState.currentVerseIndex > visibleVerseLimit - 5
      ? Math.min(entry.verses.length, playbackState.currentVerseIndex + 40)
      : visibleVerseLimit;


  const handleGenerateWavAudio = async () => {
    if (isGeneratingWav) return;
    setIsGeneratingWav(true);
    try {
      const res = await sanskritAudioEngine.renderVersesToNeuralWavBlob(
        entry.verses,
        playbackState.rate
      );
      setGeneratedWav((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return {
          url: res.url,
          durationSec: res.durationSec,
          fileName: `${entry.id}-sanskrit-48k-vits.wav`,
          model: res.model,
        };
      });
    } finally {
      setIsGeneratingWav(false);
    }
  };

  return (
    <main className="reader-main" aria-label="梵文陀罗尼多体对照阅读区">
      <section className="dharani-hero-card">
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
              id="hero-export-wav-btn"
              type="button"
              className="btn-scholarly gold"
              onClick={handleGenerateWavAudio}
              title="将整部陀罗尼合成为 48,000 Hz 高音质 .WAV 音频文件，支持原生播放器拖动或下载发送至手机"
            >
              <FileAudio size={14} />
              <span>生成/导出 48kHz .WAV 音频</span>
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

        {/* 48,000 Hz 语音发音方案控制栏 (Plan 1 Neural VITS + Plan 2 612-Sprite + 136.1Hz Formant + 男/女声 + Om共振场) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.6rem',
            padding: '0.6rem 0.85rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Volume2 size={14} />
              <span>发音引擎方案：</span>
            </span>

            {(
              [
                { id: 'neural-vits-48k', label: '48kHz 神经VITS (sa.onnx)' },
                { id: 'studio-vocal-chant', label: '136.1Hz 共振峰唱诵' },
                { id: 'mandarin-phonetic-guide', label: '普通话谐音领读' },
                { id: 'indic-devanagari-tts', label: '天城文原生TTS' },
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
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <button
              id="hero-voice-male-btn"
              type="button"
              className={`script-toggle-chip ${playbackState.voice === 'male' ? 'active' : ''}`}
              onClick={() => sanskritAudioEngine.setVoice('male')}
              title="切换至 IIT Madras Rasa 古典梵语男声模型 (sa_studio_male / 136.1Hz)"
            >
              🧔 男声 (sa_male)
            </button>
            <button
              id="hero-voice-female-btn"
              type="button"
              className={`script-toggle-chip ${playbackState.voice === 'female' ? 'active' : ''}`}
              onClick={() => sanskritAudioEngine.setVoice('female')}
              title="切换至 IIT Madras Rasa 古典梵语女声模型 (sa_studio_female / 224Hz)"
            >
              👩 女声 (sa_female)
            </button>

            <button
              id="hero-om-drone-btn"
              type="button"
              className={`script-toggle-chip ${playbackState.omDroneActive ? 'active' : ''}`}
              onClick={() => sanskritAudioEngine.toggleOmDrone()}
              title="开启或关闭 136.1Hz Sadja (Om) + 204.15Hz Pa 持续共振背景音场"
            >
              {playbackState.omDroneActive ? '🔔 136.1Hz Om 共振中' : '🔕 开启 136.1Hz Om 共振场'}
            </button>

            <span
              style={{
                fontSize: '0.72rem',
                padding: '0.2rem 0.55rem',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.14)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#059669',
                fontWeight: 700,
              }}
              title="当前诵读模式实时激活的后端/前端发音模型"
            >
              ● 已连接：{playbackState.activeModel || 'gnumanth/ninada:onnx/sa.onnx'} (48,000 Hz)
            </span>

            <a
              href="/sanskrit_phonetic_engine.html"
              target="_blank"
              rel="noopener noreferrer"
              className="script-toggle-chip"
              style={{ textDecoration: 'none', color: 'var(--accent-vermilion)', fontWeight: 700 }}
              title="打开独立版 48kHz 梵语四行谱发音引擎与 34×14 悉昙摩多矩阵工作台 v3.0"
            >
              <span>独立版发音引擎 v3.0</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>

        {/* Title & Bīja Seed Syllable Card */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'stretch',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1 1 420px' }}>
            <h1 className="hero-title-zh">{entry.titleZh}</h1>
            <div className="hero-title-skt">{entry.titleSanskritIast}</div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              {entry.titleEnglish} · 译者与校勘：{entry.translatorZh}
            </div>
          </div>

          {bijaLexiconEntry && (
            <button
              type="button"
              onClick={() => onPlaySingleSyllable(bijaLexiconEntry.bijaIast)}
              style={{
                flex: '0 1 360px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.65rem 0.9rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--accent-gold-border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              title="点击试听 48,000 Hz 本尊种子字发音（含空海 T84n2701 与牛津 OCHS Bījanighaṇṭu 种子字密意）"
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '58px',
                  padding: '0.35rem 0.5rem',
                  background: 'var(--accent-gold-soft)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--accent-gold-border)',
                }}
              >
                <span className="siddham-glyph" style={{ fontSize: '1.65rem', color: 'var(--accent-vermilion)', lineHeight: 1.1 }}>
                  {bijaLexiconEntry.bijaSiddham}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                  {bijaLexiconEntry.bijaDevanagari} · {bijaLexiconEntry.bijaIast}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.18rem', fontSize: '0.75rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  本尊根本种子字 (Bīja)：唐音「{bijaLexiconEntry.tangChinese}」🔊
                </div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                  <strong>OCHS 隐语构件：</strong>
                  {bijaLexiconEntry.phonemicBreakdown.slice(0, 3).join(' + ')}
                </div>
                <div style={{ color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {bijaLexiconEntry.buddhistMeaning}
                </div>
              </div>
            </button>
          )}
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
                已生成本咒 48,000 Hz 神经人声 ({generatedWav.model || 'gnumanth/ninada:onnx/sa.onnx'}) .WAV 音频（总时长 {generatedWav.durationSec.toFixed(1)} 秒）
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

      {readerSubMode === 'verses' && (
        <section
          id="entry-provenance-legend-banner"
          className="provenance-legend-banner"
          aria-label="库藏原文与处理参考区分说明"
        >
          <div className="provenance-legend-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.82rem' }}>
                库藏原文 vs. 处理参考标识：
              </strong>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>
                原数据库已有内容完整保留（实线框 +{' '}
                <span className="prov-origin-badge is-original is-compact">● 库藏原文</span>
                ）；仅在原数据库缺失时才作推导补全（虚线框 +{' '}
                <span className="prov-origin-badge is-reference is-compact">◇ 处理参考</span>）。
              </span>
            </div>

            <button
              id="banner-toggle-hide-reference-btn"
              type="button"
              className={`btn-scholarly ${scriptConfig.hideDerivedReference ? 'primary' : ''}`}
              style={{ padding: '0.22rem 0.6rem', fontSize: '0.74rem' }}
              onClick={() =>
                onScriptConfigChange({
                  ...scriptConfig,
                  hideDerivedReference: !scriptConfig.hideDerivedReference,
                })
              }
            >
              <span>
                {scriptConfig.hideDerivedReference
                  ? '显示全部（恢复处理参考层）'
                  : '仅看库藏原文（隐藏参考层）'}
              </span>
            </button>
          </div>

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
                  {TRACKABLE_FIELD_LABELS_ZH[f]} (部分原载)
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
        </section>
      )}

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
                  <span>一键展开全部 {entry.verses.length} 句逐音节精解</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 跨 12 大权威数据库同源见证与平行对勘面板 */}
      {matchedConcordanceCluster && (
        <section
          className="dharani-hero-card"
          style={{ marginTop: '0.5rem' }}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={16} color="var(--accent-vermilion)" />
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                跨12大数据库同源对勘与平行见证：{matchedConcordanceCluster.canonicalTitleZh}（{matchedConcordanceCluster.canonicalTitleSanskrit}）
              </span>
            </div>

            {onNavigateTab && (
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-scholarly"
                  onClick={() => onNavigateTab('hub')}
                >
                  <span>浏览全球12大数据库 (DB1–12)</span>
                </button>
                <button
                  type="button"
                  className="btn-scholarly"
                  onClick={() => onNavigateTab('concordance')}
                >
                  <span>打开16本同源对勘台</span>
                </button>
                <button
                  type="button"
                  className="btn-scholarly"
                  onClick={() => onNavigateTab('interlinear')}
                >
                  <span>房山石经 F28n1071 对音 (741部)</span>
                </button>
                <button
                  type="button"
                  className="btn-scholarly"
                  onClick={() => onNavigateTab('cudl')}
                >
                  <span>剑桥 CUDL 贝叶经馆 (69部)</span>
                </button>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '0.65rem',
            }}
          >
            {matchedConcordanceCluster.witnessSummary.slice(0, 6).map((w, idx) => (
              <div
                key={`${w.dbId}-${idx}`}
                className="meta-box"
                style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--accent-vermilion)',
                      background: 'var(--accent-vermilion-soft)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                    }}
                  >
                    {w.dbId.toUpperCase()} · {w.script}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
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
        />
      )}
    </main>
  );
};

