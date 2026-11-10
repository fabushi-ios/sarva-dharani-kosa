import React, { useState, useMemo, useEffect } from 'react';
import type { DatabaseId } from './types/corpus';
import type {
  AudioEngineMode,
  AudioHealthStatus,
  NeuralVoice,
  SyllableAnalysis,
  SyllableTimingItem,
} from './types/dharani';
import {
  BASELINE_CORPUS_SUMMARY,
  BASELINE_CURATED_DHARANIS,
  CANONICAL_DATABASE_IDS,
  UNIFIED_12_DATABASES,
  getUnifiedSystemStats,
} from './data/unifiedCorpusRegistry';
import { CONS_MATRIX, INHERENT_LONG_VOWELS, SYLLABLE_OVERRIDES, VOWEL_INDEX, VOWEL_MAP } from './data/siddhamMatrix';
import {
  ewtsToIast,
  slp1ToDevanagari,
  slp1ToIast,
  slp1ToIpa,
  slp1ToSiddhamUnicode,
  type InputMode,
} from './core/transliterator';
import { analyzeSanskritLine } from './core/prosody';
import {
  playSingleSyllable,
  sanskritAudioEngine,
  speakSanskrit,
  stopSpeaking,
} from './services/sanskritAudioEngine';

import { DatabaseHubExplorer } from './components/DatabaseHubExplorer';
import { MultiScriptDharaniReader } from './components/MultiScriptDharaniReader';
import { FangshanTaishoInterlinearStudio } from './components/FangshanTaishoInterlinearStudio';
import { ConcordanceParallelStudio } from './components/ConcordanceParallelStudio';
import { CudlPalmLeafViewer } from './components/CudlPalmLeafViewer';
import { SiddhamBijaAcademy } from './components/SiddhamBijaAcademy';

export type WorkbenchTabId =
  | 'none'
  | 'reader'
  | 'interlinear'
  | 'hub'
  | 'concordance'
  | 'cudl'
  | 'academy';

export const APP_CANONICAL_DATABASE_IDS: DatabaseId[] = [
  'db1_fangshan',
  'db2_taisho_ext',
  'db3_dsbc_gretil',
  'db4_84000',
  'db5_buddhanexus',
  'db6_sarit',
  'db7_cudl_hidas',
  'db8_polyglotta',
  'db9_rkts',
  'db10_all_nibs',
  'db11_idp_dunhuang',
  'db12_muktabodha_ochs',
];

const CLASSIC_SAMPLES: Array<{ label: string; text: string; mode: InputMode }> = [
  {
    label: '1. 心经咒语 (IAST)',
    text: 'tadyathā oṃ gate gate pāragate pārasaṃgate bodhi svāhā',
    mode: 'smart',
  },
  {
    label: '2. 六字大明咒 & 礼敬',
    text: 'namo ratnatrayāya oṃ maṇi padme hūṃ hrīḥ',
    mode: 'smart',
  },
  {
    label: '3. 天城文《伽耶特黎咒》',
    text: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्',
    mode: 'smart',
  },
  {
    label: '4. 极限五重辅音测试',
    text: 'kārtsnyena śrībhagavān uvāca oṃ bhrūṃ svāhā',
    mode: 'smart',
  },
  {
    label: '5. 绿度母心咒',
    text: 'oṃ tāre tuttāre ture svāhā',
    mode: 'smart',
  },
  {
    label: '6. 文殊心咒',
    text: 'oṃ arapacana dhīḥ',
    mode: 'smart',
  },
  {
    label: '7. 药师灌顶真言',
    text: 'namo bhagavate bhaiṣajyaguru vaiḍūryaprabharājāya tathāgatāya tadyathā oṃ bhaiṣajye bhaiṣajye mahābhaiṣajye rājasamudgate svāhā',
    mode: 'smart',
  },
  {
    label: '8. 粗略英文拼写容错测试',
    text: 'om mani padme hum namah shivaya prajna paramita svaha',
    mode: 'smart',
  },
];

const IAST_QUICK_CHARS = [
  'ā', 'ī', 'ū', 'ṛ', 'ṝ', 'ḷ', 'ḹ', 'ṃ', 'ḥ', 'ṅ', 'ñ', 'ṭ', 'ḍ', 'ṇ', 'ś', 'ṣ', 'ॐ', '।', '॥', "'",
];

const MATRIX_VOWELS = ['a', 'A', 'i', 'I', 'u', 'U', 'f', 'F', 'x', 'X', 'e', 'E', 'o', 'O'];

export function App() {
  const [inputText, setInputText] = useState<string>(CLASSIC_SAMPLES[0].text);
  const [inputMode, setInputMode] = useState<InputMode | 'ewts'>('smart');
  const [assimilate, setAssimilate] = useState<boolean>(true);
  const [longMarkStyle, setLongMarkStyle] = useState<'～' | 'ː' | ''>('～');
  const [sylSep, setSylSep] = useState<'' | '·' | '-'>('');
  const [showMeter, setShowMeter] = useState<boolean>(true);
  const [breakdownView, setBreakdownView] = useState<'syllables' | 'words'>('syllables');
  const [selectedSyllable, setSelectedSyllable] = useState<SyllableAnalysis | null>(null);
  const [showMatrixModal, setShowMatrixModal] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [activeTab, setActiveTab] = useState<WorkbenchTabId>('none');

  const [isPlaying, setIsPlaying] = useState<boolean>(sanskritAudioEngine.isPlaying());
  const [activeSyllableIndex, setActiveSyllableIndex] = useState<number>(
    sanskritAudioEngine.getActiveSyllableIndex()
  );
  const [syllableTimings, setSyllableTimings] = useState<SyllableTimingItem[]>(
    sanskritAudioEngine.getActiveTimings()
  );
  const [audioRate, setAudioRate] = useState<number>(1.0);
  const [audioMode, setAudioMode] = useState<AudioEngineMode>('neural-auto');
  const [audioVoice, setAudioVoice] = useState<NeuralVoice>('male');
  const [healthStatus, setHealthStatus] = useState<AudioHealthStatus>(
    sanskritAudioEngine.getHealthStatus()
  );
  const [lastWavDataUrl, setLastWavDataUrl] = useState<string | null>(
    sanskritAudioEngine.getLastDownloadWavUrl()
  );

  useEffect(() => {
    const unsubscribe = sanskritAudioEngine.subscribe(() => {
      setIsPlaying(sanskritAudioEngine.isPlaying());
      setActiveSyllableIndex(sanskritAudioEngine.getActiveSyllableIndex());
      setSyllableTimings([...sanskritAudioEngine.getActiveTimings()]);
      setHealthStatus(sanskritAudioEngine.getHealthStatus());
      setLastWavDataUrl(sanskritAudioEngine.getLastDownloadWavUrl());
    });
    void sanskritAudioEngine.init();
    return unsubscribe;
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (typeof window !== 'undefined') {
      window.setTimeout(() => setToastMsg(''), 2200);
    }
  };

  const effectiveInput = useMemo(() => {
    if (inputMode === 'ewts') {
      return ewtsToIast(inputText);
    }
    return inputText;
  }, [inputText, inputMode]);

  const lineAnalysis = useMemo(
    () =>
      analyzeSanskritLine(effectiveInput, {
        mode: inputMode === 'ewts' ? 'smart' : inputMode,
        assimilate,
      }),
    [effectiveInput, inputMode, assimilate]
  );

  const allSyllables = useMemo(
    () => lineAnalysis.words.flatMap((w) => w.syllables),
    [lineAnalysis]
  );

  const guruCount = useMemo(
    () => allSyllables.filter((s) => s.weight === 'Guru').length,
    [allSyllables]
  );
  const laghuCount = useMemo(
    () => allSyllables.filter((s) => s.weight === 'Laghu').length,
    [allSyllables]
  );

  const formatModernSyllable = (syl: SyllableAnalysis) => {
    if (longMarkStyle === '～') return syl.modernPhonetic;
    if (longMarkStyle === 'ː') return syl.modernPhonetic.replace(/～/g, 'ː');
    return syl.modernPhonetic.replace(/～/g, '');
  };

  const modernFullText = useMemo(
    () =>
      lineAnalysis.words
        .map((w) => w.syllables.map((s) => formatModernSyllable(s)).join(sylSep))
        .join(' '),
    [lineAnalysis, longMarkStyle, sylSep]
  );

  const tradFullText = useMemo(
    () =>
      lineAnalysis.words
        .map((w) =>
          sylSep
            ? w.syllables.map((s) => s.tangReconstruction).join(sylSep)
            : w.wordTangReconstruction || w.syllables.map((s) => s.tangReconstruction).join('')
        )
        .join(' '),
    [lineAnalysis, sylSep]
  );

  const systemStats = useMemo(() => getUnifiedSystemStats(), []);

  const handleSpeakMain = () => {
    if (isPlaying) {
      stopSpeaking();
      return;
    }
    if (audioMode === 'synth') {
      speakSanskrit(effectiveInput, { mode: 'synth', rate: audioRate });
    } else {
      void sanskritAudioEngine.speakText(effectiveInput, {
        mode: audioMode,
        voice: audioVoice,
        rate: audioRate,
      });
    }
  };

  const handleInspectAndPlaySyllable = (syl: SyllableAnalysis) => {
    setSelectedSyllable(syl);
    if (audioMode === 'synth') {
      playSingleSyllable(syl.slp1, { mode: 'synth', rate: audioRate });
    } else {
      void sanskritAudioEngine.playSyllable(syl.slp1, {
        mode: audioMode,
        voice: audioVoice,
        rate: audioRate,
      });
    }
  };

  const handleCopyText = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(text).then(() => {
        showToast(`已复制${label}到剪贴板`);
      });
    }
  };

  const handleCopyFormattedSheet = () => {
    const sheet = [
      `【悉昙梵字】${lineAnalysis.siddhamUnicode}`,
      `【天城文】${lineAnalysis.devanagari}`,
      `【IAST转写】${lineAnalysis.normalizedIast}`,
      `【现代梵音跟读】${modernFullText}`,
      `【传统悉昙古译】${tradFullText}`,
    ].join('\n');
    handleCopyText(sheet, '五体四行对照谱');
  };

  let runningSylIdx = -1;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* 1. 顶部标题与工具栏 (100% 还原《梵文发声与音译引擎上线》设计) */}
        <header className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-2xl" aria-hidden="true">
                🕉️
              </span>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--foreground)]">
                梵文 100% 全覆盖音译与发声引擎 · Sarva-Dhāraṇī-Kośa
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
                v3.0 方案 1 · IIT Madras 原生古典梵文神经网络版 (48kHz VITS)
              </span>
            </div>
            <p className="text-xs md:text-sm text-[var(--muted-foreground)]">
              支持天城文 (Devanāgarī)、标准 IAST 转写、悉昙梵字 (Siddhaṃ)、藏文 EWTS 与粗略英文拼写容错 · 统一采用 IIT Madras 原生古典梵文 VITS 神经网络 (48kHz) 与 136.1 Hz 泛音合成双引擎
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMatrixModal(true)}
              className="text-xs font-medium px-3 py-2 rounded-xl bg-[var(--secondary)] hover:opacity-90 text-[var(--secondary-foreground)] border border-[var(--border)] flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>📜</span> 34×14 悉昙音素全表 (48kHz 点读)
            </button>
            <button
              type="button"
              onClick={handleCopyFormattedSheet}
              className="text-xs font-medium px-3 py-2 rounded-xl bg-[var(--secondary)] hover:opacity-90 text-[var(--secondary-foreground)] border border-[var(--border)] flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>📋</span> 复制四行对照谱
            </button>
            <button
              type="button"
              onClick={() => setActiveTab((prev) => (prev === 'none' ? 'reader' : 'none'))}
              className={`text-xs font-semibold px-3 py-2 rounded-xl border flex items-center gap-1.5 transition cursor-pointer ${
                activeTab !== 'none'
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                  : 'bg-[var(--secondary)] text-[var(--secondary-foreground)] border-[var(--border)]'
              }`}
            >
              <span>📚</span>{' '}
              {activeTab === 'none'
                ? `展开 12 大权威数据库与经咒文库 (${systemStats.totalDatabaseRecords.toLocaleString()} 条)`
                : '收起底部数据库工作台'}
            </button>
          </div>
        </header>

        {/* 2. 经典示例与《梵音宝典》精校经咒快速载入栏 */}
        <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 shadow-sm space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                经典陀罗尼与吠陀范例
              </span>
              <select
                aria-label="从精校陀罗尼文库载入"
                className="text-xs bg-[var(--secondary)] text-[var(--foreground)] font-medium px-2.5 py-1 rounded-lg border border-[var(--border)] outline-none cursor-pointer"
                defaultValue=""
                onChange={(e) => {
                  const found = BASELINE_CURATED_DHARANIS.find((d) => d.id === e.target.value);
                  if (found) {
                    setInputMode('smart');
                    setInputText(found.verses.map((v) => v.iast).join(' '));
                  }
                }}
              >
                <option value="">📖 或从《梵音宝典》23 首精校大咒/十小咒直接载入...</option>
                {BASELINE_CURATED_DHARANIS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.shortTitleZh} ({item.taishoId} · {item.titleSanskrit})
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-[var(--muted-foreground)] font-mono">
              词数: {lineAnalysis.words.length} · 音节数: {allSyllables.length} · 重音(Guru —):{' '}
              {guruCount} / 轻音(Laghu ⏑): {laghuCount}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {CLASSIC_SAMPLES.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => {
                  setInputMode(sample.mode);
                  setInputText(sample.text);
                }}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[var(--secondary)] hover:opacity-85 text-[var(--secondary-foreground)] border border-[var(--border)] transition cursor-pointer"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </section>

        {/* 3. 核心输入与发声控制区 */}
        <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="sanskritInput" className="text-sm font-semibold text-[var(--foreground)]">
                输入梵文文本：
              </label>
              <div className="inline-flex rounded-xl p-0.5 bg-[var(--secondary)] border border-[var(--border)] text-xs">
                {(
                  [
                    { id: 'smart', label: '智能混合 (天城/IAST/英文容错)' },
                    { id: 'strict', label: '严格 IAST/天城文' },
                    { id: 'slp1', label: 'SLP1 源码' },
                    { id: 'ewts', label: '藏文 EWTS 转梵' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setInputMode(m.id)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                      inputMode === m.id
                        ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                        : 'text-[var(--muted-foreground)]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 发声控制栏 */}
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] bg-[var(--secondary)] px-2.5 py-1.5 rounded-xl border border-[var(--border)]">
                <span>语速</span>
                <select
                  value={audioRate}
                  onChange={(e) => {
                    const r = parseFloat(e.target.value);
                    setAudioRate(r);
                    sanskritAudioEngine.setRate(r);
                  }}
                  className="bg-transparent text-[var(--foreground)] font-semibold outline-none cursor-pointer"
                >
                  <option value={0.65}>0.65x 慢速拆解</option>
                  <option value={0.85}>0.85x 标准持诵</option>
                  <option value={1.0}>1.0x 原速流利</option>
                  <option value={1.2}>1.2x 快速持诵</option>
                </select>
              </label>

              <label className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] bg-[var(--secondary)] px-2.5 py-1.5 rounded-xl border border-[var(--border)]">
                <span>声线</span>
                <select
                  value={audioVoice}
                  onChange={(e) => {
                    const v = e.target.value as NeuralVoice;
                    setAudioVoice(v);
                    sanskritAudioEngine.setVoice(v);
                  }}
                  className="bg-transparent text-[var(--foreground)] font-semibold outline-none cursor-pointer"
                >
                  <option value="male">🧘‍♂️ 梵音男声 (IIT Madras Studio 24k→48kHz)</option>
                  <option value="female">🧘‍♀️ 梵音女声 (IIT Madras Studio 24k→48kHz)</option>
                  <option value="mobile">⚡ 极速轻量声学模型 (iSTFTNet 48kHz)</option>
                </select>
              </label>

              <label className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] bg-[var(--secondary)] px-2.5 py-1.5 rounded-xl border border-[var(--border)]">
                <span>音源</span>
                <select
                  value={audioMode}
                  onChange={(e) => {
                    const mode = e.target.value as AudioEngineMode;
                    setAudioMode(mode);
                    sanskritAudioEngine.setMode(mode);
                  }}
                  className="bg-transparent text-[var(--foreground)] font-semibold outline-none cursor-pointer"
                >
                  <option value="neural-auto">🧠 方案 1：原生古典梵文神经网络 (48kHz VITS)</option>
                  <option value="synth">🔔 136.1 Hz 宇宙音 Om 共振峰合成器</option>
                  <option value="legacy-tts">🌐 浏览器系统语音 (Web Speech API)</option>
                </select>
              </label>

              <button
                type="button"
                onClick={handleSpeakMain}
                className="flex items-center gap-2 bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)] text-xs md:text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition cursor-pointer"
              >
                <span>{isPlaying ? '⏹' : '🔊'}</span>
                <span>{isPlaying ? '停止朗读' : '朗读梵音'}</span>
              </button>

              <button
                type="button"
                onClick={() => setInputText('')}
                className="text-xs px-2.5 py-2 rounded-xl border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition cursor-pointer"
              >
                清空
              </button>
            </div>
          </div>

          {/* IAST 特殊字符快捷输入条 */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[var(--muted-foreground)] mr-1">快捷字符：</span>
            <div className="flex flex-wrap gap-1">
              {IAST_QUICK_CHARS.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setInputText((prev) => prev + ch)}
                  className="px-2 py-0.5 rounded-md bg-[var(--secondary)] hover:bg-slate-200 text-[var(--foreground)] font-mono border border-[var(--border)] transition cursor-pointer"
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          <textarea
            id="sanskritInput"
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full p-4 rounded-xl bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-base md:text-lg font-medium transition deva-font"
            placeholder="在此输入梵文，例如：gate gate pāragate pārasaṃgate bodhi svāhā 、 ॐ मणि पद्मे हूँ 或 om mani padme hum"
          />

          {/* 四种标准转写实时互转展示栏 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-[var(--secondary)] p-3.5 rounded-xl border border-[var(--border)]">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--muted-foreground)]">
                  标准化 IAST (国际梵文转写)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(lineAnalysis.normalizedIast, 'IAST 转写')}
                  className="text-xs underline text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                >
                  复制
                </button>
              </div>
              <div className="font-mono text-sm text-[var(--foreground)] break-words">
                {lineAnalysis.normalizedIast}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--muted-foreground)]">
                  天城文 (Devanāgarī)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(lineAnalysis.devanagari, '天城文')}
                  className="text-xs underline text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                >
                  复制
                </button>
              </div>
              <div className="deva-font text-base text-[var(--foreground)] break-words">
                {lineAnalysis.devanagari}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--muted-foreground)]">
                  悉昙梵字 (Siddhaṃ Unicode)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(lineAnalysis.siddhamUnicode, '悉昙梵字')}
                  className="text-xs underline text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                >
                  复制
                </button>
              </div>
              <div className="siddham-script text-[var(--foreground)] break-words">
                {lineAnalysis.siddhamUnicode}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--muted-foreground)]">
                  音素码 (SLP1) & IPA
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(lineAnalysis.slp1, 'SLP1 编码')}
                  className="text-xs underline text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                >
                  复制
                </button>
              </div>
              <div className="font-mono text-xs text-[var(--foreground)] break-words">
                {lineAnalysis.slp1} · [{slp1ToIpa(lineAnalysis.slp1)}]
              </div>
            </div>
          </div>

          {/* 音译精细选项栏 */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[var(--border)] text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-[var(--foreground)]">
                <input
                  type="checkbox"
                  checked={assimilate}
                  onChange={(e) => setAssimilate(e.target.checked)}
                  className="rounded"
                />
                <span>启用随韵 (ṃ) 鼻音同化与止韵 (ḥ) 元音回响</span>
              </label>

              <label className="inline-flex items-center gap-1.5 select-none text-[var(--foreground)]">
                <span>长元音延音符：</span>
                <select
                  value={longMarkStyle}
                  onChange={(e) => setLongMarkStyle(e.target.value as '～' | 'ː' | '')}
                  className="bg-[var(--secondary)] text-[var(--foreground)] font-semibold px-2 py-0.5 rounded-lg border border-[var(--border)] outline-none cursor-pointer"
                >
                  <option value="～">～ 波浪延音 (巴～)</option>
                  <option value="ː">ː 国际音标 (巴ː)</option>
                  <option value="">不标长音 (巴)</option>
                </select>
              </label>

              <label className="inline-flex items-center gap-1.5 select-none text-[var(--foreground)]">
                <span>词内分隔：</span>
                <select
                  value={sylSep}
                  onChange={(e) => setSylSep(e.target.value as '' | '·' | '-')}
                  className="bg-[var(--secondary)] text-[var(--foreground)] font-semibold px-2 py-0.5 rounded-lg border border-[var(--border)] outline-none cursor-pointer"
                >
                  <option value="">无分隔 (巴～啦噶得)</option>
                  <option value="·">· 中点 (巴～·啦·噶·得)</option>
                  <option value="-">- 连字符 (巴～-啦-噶-得)</option>
                </select>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-[var(--foreground)]">
                <input
                  type="checkbox"
                  checked={showMeter}
                  onChange={(e) => setShowMeter(e.target.checked)}
                  className="rounded"
                />
                <span>显示轻重音节格律 (⏑ / —)</span>
              </label>
            </div>

            <div className="text-xs text-[var(--muted-foreground)] flex items-center gap-2">
              <span>
                {healthStatus.backendOnline
                  ? `🟢 方案 1 (${healthStatus.engine} · 48,000 Hz 原生梵文神经网络) 就绪`
                  : '🟢 136.1 Hz Web Audio 泛音共振峰合成引擎就绪'}
              </span>
              {lastWavDataUrl && (
                <a
                  href={lastWavDataUrl}
                  download={`sanskrit_48khz_${audioVoice}.wav`}
                  className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 font-semibold border border-emerald-500/30"
                >
                  ⬇ 下载 48kHz WAV
                </a>
              )}
            </div>
          </div>
        </section>

        {/* 4. 双轨输出结果区 (左右并排双卡片) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. 现代标准梵音跟读 */}
          <div className="bg-[var(--card)] p-5 rounded-2xl shadow-sm border border-[var(--border)] flex flex-col justify-between space-y-3">
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <h2 className="text-base font-bold text-[var(--foreground)]">
                    1. 现代标准梵音跟读（声学听感谐音）
                  </h2>
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  严格区分清不送气 (ka=嘎, ta=搭, pa=巴) 与送气音，还原闭音节收音与随韵同化，适合零基础直接张嘴跟读
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopyText(modernFullText, '现代标准跟读')}
                className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-lg bg-[var(--secondary)] hover:opacity-85 text-[var(--secondary-foreground)] border border-[var(--border)] cursor-pointer"
              >
                复制
              </button>
            </div>
            <div className="text-lg md:text-xl font-bold text-[var(--foreground)] leading-relaxed bg-[var(--secondary)] p-4 rounded-xl min-h-[84px] break-words">
              {modernFullText || '—'}
            </div>
          </div>

          {/* 2. 传统佛典/唐音音译 */}
          <div className="bg-[var(--card)] p-5 rounded-2xl shadow-sm border border-[var(--border)] flex flex-col justify-between space-y-3">
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  <h2 className="text-base font-bold text-[var(--foreground)]">
                    2. 传统佛典/学术古音译（玄奘/不空悉昙体）
                  </h2>
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  遵循《悉昙字记》与《大正藏》陀罗尼用字规范，34×14 矩阵全覆盖无缺字，庄重典雅
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopyText(tradFullText, '传统佛典音译')}
                className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-lg bg-[var(--secondary)] hover:opacity-85 text-[var(--secondary-foreground)] border border-[var(--border)] cursor-pointer"
              >
                复制
              </button>
            </div>
            <div className="text-lg md:text-xl font-bold text-[var(--foreground)] leading-relaxed bg-[var(--secondary)] p-4 rounded-xl min-h-[84px] break-words">
              {tradFullText || '—'}
            </div>
          </div>
        </section>

        {/* 5. 逐词四行对照谱 + 逐音节声学拆解透视 */}
        <section className="bg-[var(--card)] p-5 rounded-2xl shadow-sm border border-[var(--border)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
            <div>
              <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                <span>🔬</span> 逐音节声学拆解与诗律透视（点击卡片可 0 延迟播放 48kHz 真人级神经梵音）
              </h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                自动剖析「前置复辅音 + 核心辅音 + 元音韵母 + 尾音/收音修饰」及梵文 Chandas 轻重音节格律 (⏑ 轻音 1 拍 / — 重音 2 拍)
              </p>
            </div>

            <div className="inline-flex rounded-xl p-0.5 bg-[var(--secondary)] border border-[var(--border)] text-xs self-start">
              <button
                type="button"
                onClick={() => setBreakdownView('syllables')}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  breakdownView === 'syllables'
                    ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted-foreground)]'
                }`}
              >
                音节拆解矩阵 ({allSyllables.length})
              </button>
              <button
                type="button"
                onClick={() => setBreakdownView('words')}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  breakdownView === 'words'
                    ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted-foreground)]'
                }`}
              >
                整词四行对照谱 ({lineAnalysis.words.length})
              </button>
            </div>
          </div>

          {/* 选中的单音节声学详情面板 */}
          {selectedSyllable && (
            <div className="bg-[var(--secondary)] border border-[var(--border)] rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="siddham-script text-xl">{selectedSyllable.siddhamUnicode}</span>
                  <span className="text-lg font-bold deva-font text-[var(--foreground)]">
                    {selectedSyllable.devanagari}
                  </span>
                  <span className="text-sm font-mono font-semibold px-2 py-0.5 rounded bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)]">
                    {selectedSyllable.rawIast} (SLP1: {selectedSyllable.slp1})
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--card)] text-[var(--muted-foreground)] border border-[var(--border)]">
                    {selectedSyllable.weight} ({selectedSyllable.meterSymbol}) · [{selectedSyllable.ipa}]
                  </span>
                  <span className="text-sm font-bold text-emerald-600">
                    今：{formatModernSyllable(selectedSyllable)}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[var(--card)] text-amber-700 border border-[var(--border)] font-semibold">
                    古：{selectedSyllable.tangReconstruction}
                  </span>
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {selectedSyllable.varga ? `发音部位：${selectedSyllable.varga} · ` : ''}
                  {selectedSyllable.acousticNote || '标准古典梵文音节'}
                  {selectedSyllable.sandhiNotes.length > 0
                    ? ` · 连音同化：${selectedSyllable.sandhiNotes.join('；')}`
                    : ''}
                  {selectedSyllable.bijaMeaning ? ` · 种子字义：${selectedSyllable.bijaMeaning}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleInspectAndPlaySyllable(selectedSyllable)}
                className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] cursor-pointer"
              >
                🔊 再次试听该音节 (48kHz)
              </button>
            </div>
          )}

          {breakdownView === 'syllables' ? (
            <div className="flex flex-wrap gap-2.5">
              {lineAnalysis.words.map((word, wIdx) => (
                <React.Fragment key={`w-${wIdx}`}>
                  {word.syllables.map((syl, sIdx) => {
                    runningSylIdx++;
                    const currentIdx = runningSylIdx;
                    const isSpeakingThis = isPlaying && activeSyllableIndex === currentIdx;
                    return (
                      <button
                        key={`${wIdx}-${sIdx}-${syl.slp1}`}
                        type="button"
                        onClick={() => handleInspectAndPlaySyllable(syl)}
                        className={`syllable-card min-w-[88px] ${
                          isSpeakingThis ? 'speaking-active' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5 text-xs text-[var(--muted-foreground)] border-b border-[var(--border)] pb-1 mb-1">
                          <span className="font-mono font-semibold text-[var(--foreground)]">
                            {syl.rawIast}
                          </span>
                          {showMeter && (
                            <span
                              className={`font-mono px-1 rounded text-[11px] ${
                                syl.weight === 'Guru'
                                  ? 'bg-amber-500/15 text-amber-700 font-bold'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {syl.meterSymbol || (syl.weight === 'Guru' ? '—' : '⏑')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-center gap-1.5 my-0.5">
                          <span className="siddham-script text-lg">{syl.siddhamUnicode}</span>
                          <span className="deva-font text-sm text-[var(--muted-foreground)]">
                            {syl.devanagari}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-emerald-600">
                          {formatModernSyllable(syl)}
                        </div>
                        <div className="text-xs text-amber-700 font-medium">
                          古：{syl.tangReconstruction}
                        </div>
                      </button>
                    );
                  })}
                  {wIdx < lineAnalysis.words.length - 1 && (
                    <div className="w-1.5 self-stretch border-r border-dashed border-[var(--border)] my-2" />
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lineAnalysis.words.map((word, wIdx) => (
                <div
                  key={`word-card-${wIdx}`}
                  onClick={() =>
                    void sanskritAudioEngine.speakText(word.wordIast, {
                      mode: audioMode,
                      voice: audioVoice,
                      rate: audioRate,
                    })
                  }
                  className="p-3.5 rounded-xl bg-[var(--secondary)] border border-[var(--border)] hover:border-slate-400 transition cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="siddham-script text-xl">{word.wordSiddham}</span>
                    <span className="deva-font text-base font-bold text-[var(--foreground)]">
                      {word.wordDevanagari}
                    </span>
                  </div>
                  <div className="font-mono text-xs font-semibold text-[var(--muted-foreground)]">
                    IAST: {word.wordIast}
                  </div>
                  <div className="text-sm font-bold text-emerald-600">
                    现代跟读：{word.syllables.map((s) => formatModernSyllable(s)).join(sylSep)}
                  </div>
                  <div className="text-xs font-semibold text-amber-700">
                    传统唐音：{word.wordTangReconstruction || word.syllables.map((s) => s.tangReconstruction).join('')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 6. 梵音宝典 12 大权威数据库与深度校勘工作台（干净收纳在底部，点击标签切换） */}
        <section className="bg-[var(--card)] p-5 rounded-2xl shadow-sm border border-[var(--border)] space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                <span>🏛️</span> 梵音宝典 · 全球 12 大梵文陀罗尼数据库与深度校勘工作台
              </h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                已整合 CBETA 悉昙外字 ({BASELINE_CORPUS_SUMMARY.cbetaGaijiCount.toLocaleString()}) · 唐代梵汉对音 ({BASELINE_CORPUS_SUMMARY.cbetaTotalTtAlignments} 组) · 大正藏密教部 ({BASELINE_CORPUS_SUMMARY.taishoMikkyoCount} 部) · 全库总记录 ({systemStats.totalDatabaseRecords.toLocaleString()} 条)
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'none', label: '收起工作台' },
                  { id: 'reader', label: '📖 精校陀罗尼文库 (23首十层对勘)' },
                  { id: 'interlinear', label: '🗿 房山石经 (F28n1071) 与大正藏对音' },
                  { id: 'hub', label: '🌏 12 大数据库检索中心' },
                  { id: 'concordance', label: '🔗 跨藏经同源对勘与四语词典' },
                  { id: 'cudl', label: '🌴 剑桥贝叶经 (CUDL) 与 Hidas 校勘' },
                  { id: 'academy', label: '🔱 悉昙十八章与密续种子字 (Bīja)' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                      : 'bg-[var(--secondary)] text-[var(--secondary-foreground)] border-[var(--border)] hover:opacity-90'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab !== 'none' && (
            <div className="pt-3 border-t border-[var(--border)]">
              {activeTab === 'reader' && <MultiScriptDharaniReader />}
              {activeTab === 'interlinear' && <FangshanTaishoInterlinearStudio />}
              {activeTab === 'hub' && <DatabaseHubExplorer />}
              {activeTab === 'concordance' && <ConcordanceParallelStudio />}
              {activeTab === 'cudl' && <CudlPalmLeafViewer />}
              {activeTab === 'academy' && <SiddhamBijaAcademy />}
            </div>
          )}
        </section>

        {/* 页脚简要统计 */}
        <footer className="text-xs text-[var(--muted-foreground)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1 pb-4">
          <div>
            已接入权威数据库 ({UNIFIED_12_DATABASES.length}): {CANONICAL_DATABASE_IDS.join(' · ')}
          </div>
          <div>
            四语词条: {systemStats.quadrilingualGlossaryCount} · 精校陀罗尼: {BASELINE_CORPUS_SUMMARY.curatedDharanisCount} 首 · 48,000 Hz VITS & 136.1 Hz 双发声引擎就绪
          </div>
        </footer>
      </div>

      {/* 7. 34×14 悉昙/天城文音素全表弹窗 (100% 还原《梵文发声与音译引擎上线》弹窗设计) */}
      {showMatrixModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowMatrixModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="34×14 悉昙音素全表"
        >
          <div
            className="modal-panel space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-base md:text-lg font-bold text-[var(--foreground)]">
                  📜 梵文悉昙五十音 · 14 摩多元音 + 28 种子字 + 34 辅音 × 14 元音全表（48kHz 神经采样点读）
                </h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  涵盖五组发音部位（喉、颚、卷舌、齿、唇）、半元音、擦音、吠陀卷舌边音及纯辅音去元音符（Virāma），点击任意单元格即可播放 48,000 Hz 梵音
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMatrixModal(false)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] cursor-pointer"
              >
                ✕ 关闭
              </button>
            </div>

            {/* 一、14 摩多独立元音 */}
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-[var(--foreground)]">
                一、14 摩多独立元音 (Svara · 点击试听)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {Object.entries(VOWEL_MAP).map(([vKey, [m, t]]) => (
                  <button
                    key={vKey}
                    type="button"
                    onClick={() => void sanskritAudioEngine.playSyllable(vKey)}
                    className="p-2 rounded-xl bg-[var(--secondary)] hover:bg-slate-200 border border-[var(--border)] text-center transition cursor-pointer"
                  >
                    <div className="siddham-script text-lg">{slp1ToSiddhamUnicode(vKey)}</div>
                    <div className="deva-font text-sm font-bold">
                      {slp1ToDevanagari(vKey)}{' '}
                      <span className="font-mono text-xs opacity-80">{slp1ToIast(vKey)}</span>
                    </div>
                    <div className="text-xs font-bold text-emerald-600 mt-0.5">{m}</div>
                    <div className="text-xs text-amber-700">古：{t}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 二、神圣种子字与高频二合音 */}
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-[var(--foreground)]">
                二、神圣种子字与高频二合音 (Bīja & Conjuncts · 点击试听)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {Object.entries(SYLLABLE_OVERRIDES).map(([ovKey, ov]) => (
                  <button
                    key={ovKey}
                    type="button"
                    onClick={() => void sanskritAudioEngine.playSyllable(ovKey)}
                    className="p-2 rounded-xl bg-[var(--secondary)] hover:bg-slate-200 border border-[var(--border)] text-center transition cursor-pointer"
                  >
                    <div className="siddham-script text-lg">{slp1ToSiddhamUnicode(ovKey)}</div>
                    <div className="deva-font text-xs font-bold">
                      {slp1ToDevanagari(ovKey)}{' '}
                      <span className="font-mono text-xs opacity-80">{slp1ToIast(ovKey)}</span>
                    </div>
                    <div className="text-xs font-bold text-emerald-600 mt-0.5">{ov.m}</div>
                    <div className="text-xs text-amber-700">古：{ov.t}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 三、34 辅音 × 14 元音全矩阵 */}
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-[var(--foreground)]">
                三、34 辅音 × 14 元音全矩阵 (34×14 = 476 CV · 点击任意单元格 48kHz 试听)
              </h4>
              <div className="matrix-table-wrapper">
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th className="text-left min-w-[130px]">纯辅音 (Virāma)</th>
                      {MATRIX_VOWELS.map((vk) => (
                        <th key={vk} className="font-mono">
                          +{slp1ToIast(vk)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(CONS_MATRIX).map(([cKey, info]) => (
                      <tr key={cKey}>
                        <td
                          onClick={() => void sanskritAudioEngine.playSyllable(cKey)}
                          className="text-left font-semibold bg-[var(--secondary)]"
                        >
                          <div className="deva-font text-sm">
                            {slp1ToDevanagari(cKey)}{' '}
                            <span className="font-mono text-xs">({slp1ToIast(cKey)})</span>
                          </div>
                          <div className="text-xs text-emerald-600">
                            收音:{info.bare[0]} / 古:{info.bare[1]}
                          </div>
                          <div className="text-[11px] text-[var(--muted-foreground)]">
                            {info.varga}
                          </div>
                        </td>
                        {MATRIX_VOWELS.map((vk) => {
                          const sylSlp = cKey + vk;
                          const vIdx = VOWEL_INDEX[vk] ?? 0;
                          const mLabel =
                            info.m[vIdx] + (INHERENT_LONG_VOWELS.has(vk) ? '～' : '');
                          const tLabel = info.t[vIdx];
                          return (
                            <td
                              key={sylSlp}
                              onClick={() => void sanskritAudioEngine.playSyllable(sylSlp)}
                            >
                              <div className="deva-font text-xs font-semibold">
                                {slp1ToDevanagari(sylSlp)}{' '}
                                <span className="font-mono opacity-70">{slp1ToIast(sylSlp)}</span>
                              </div>
                              <div className="text-xs font-bold text-emerald-600">{mLabel}</div>
                              <div className="text-xs text-amber-700">古:{tLabel}</div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 复制成功轻提示 */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg">
          ✓ {toastMsg}
        </div>
      )}
    </div>
  );
}

export default App;
