import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Code2,
  Play,
  Square,
  Volume2,
  Download,
  FileAudio,
  Trash2,
  Sparkles,
  Copy,
  Check,
  BookmarkPlus,
  FolderOpen,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import type { DharaniEntry, DharaniVerse } from '../../types/kosaTypes';
import { inputToSlp1, slp1ToIast, type InputMode } from '../../core/transliterator';
import {
  iastToDevanagari,
  iastToIpa,
  iastToSiddham,
} from '../../core/sanskrit/transliterator';
import { analyzeSanskritProsody } from '../../core/sanskrit/prosody';
import {
  buildWordGlossesFromIast,
  enrichSyllablesWithPhonetics,
  formatModernPhoneticWithIastOption,
  generateVerseChinesePhonetics,
} from '../../core/sanskrit/phoneticMapper';
import { translateSanskritVerse } from '../../core/sanskrit/sanskritLexicon';
import {
  sanskritAudioEngine,
  type AudioEngineMode,
  type PlaybackState,
} from '../../services/audio/sanskritAudioEngine';
import { useDharaniAudioExport } from '../../services/audio/dharaniAudioExportStore';
import { ProvenanceBadge } from '../common/ProvenanceBadge';

export interface CustomDharaniCompilerProps {
  customEntries: DharaniEntry[];
  onAddCustomEntry: (entry: DharaniEntry) => void;
  onDeleteCustomEntry: (id: string) => void;
  onClearAllCustomEntries?: () => void;
  playbackState: PlaybackState;
  onPlayVerses: (verses: DharaniVerse[], startIdx?: number, singleVerseOnly?: boolean) => void;
  onStopPlayback: () => void;
  onPlaySyllable: (iast: string) => void;
  onLiveEntryChange?: (entry: DharaniEntry) => void;
}

const IAST_QUICK_CHARS = [
  'ā',
  'ī',
  'ū',
  'ṛ',
  'ṝ',
  'ḷ',
  'ṃ',
  'ḥ',
  'ś',
  'ṣ',
  'ṇ',
  'ṭ',
  'ḍ',
  'ṅ',
  'ñ',
  '|',
  '||',
] as const;

const PRESET_TEMPLATES: Array<{
  label: string;
  titleZh: string;
  deityZh: string;
  inputMode?: InputMode;
  iast: string;
  translitZh: string;
  meaningZh: string;
}> = [
  {
    label: '绿度母增福慧随心咒',
    titleZh: '圣救度佛母增福慧随心真言',
    deityZh: '圣救度佛母 (Ārya-Tārā)',
    iast: 'oṃ tāre tuttāre ture mama āyuḥpuṇyajñānapuṣṭiṃ kuru svāhā ||',
    translitZh: '唵 多隶 咄多隶 都隶 摩摩 阿瑜布尼耶枳娘曩补瑟徴 俱噜 娑嚩诃 ||',
    meaningZh: '嗡！度母、救苦度母、疾速母！祈请令我之寿命、福德与智慧皆得增长广大，圆满成就！',
  },
  {
    label: '心经根本真言',
    titleZh: '般若波罗蜜多心经根本真言',
    deityZh: '般若佛母 (Prajñāpāramitā)',
    iast: 'tadyathā |\noṃ gate gate pāragate pārasaṃgate bodhi svāhā ||',
    translitZh: '怛侄他 |\n唵 揭谛 揭谛 波罗揭谛 波罗僧揭谛 菩提 萨婆诃 ||',
    meaningZh: '即说咒曰：去吧、去吧，度向彼岸吧，大众一同度达彼岸，速证无上菩提觉道，圆满成就！',
  },
  {
    label: '药师灌顶真言（多句全咒）',
    titleZh: '药师琉璃光如来灌顶真言',
    deityZh: '药师琉璃光如来 (Bhaiṣajyaguru)',
    iast: [
      'namo bhagavate bhaiṣajyaguru vaidūryaprabharājāya |',
      'tathāgatāya arhate samyaksaṃbuddhāya |',
      'tadyathā |',
      'oṃ bhaiṣajye bhaiṣajye mahābhaiṣajye bhaiṣajyasamudgate svāhā ||',
    ].join('\n'),
    translitZh: [
      '南谟 薄伽伐帝 鞞杀社窭噜 薛琉璃钵喇婆喝啰阇也 |',
      '怛他揭多耶 阿啰喝帝 三藐三勃陀耶 |',
      '怛侄他 |',
      '唵 鞞杀逝 鞞杀逝 摩诃鞞杀社 三没揭帝 莎诃 ||',
    ].join('\n'),
    meaningZh: '皈命世尊药师琉璃光王如来、应供、正遍知！即说咒曰：嗡！妙药、妙药、无上大法药，普令众生升进解脱，吉祥成就！',
  },
  {
    label: '毗卢遮那佛大灌顶光真言',
    titleZh: '不空羂索毗卢遮那佛大灌顶光真言',
    deityZh: '大日如来 (Vairocana)',
    iast: 'oṃ amogha vairocana mahāmudrā maṇi padma jvāla pravartaya hūṃ ||',
    translitZh: '唵 阿谟伽 尾嚧左曩 摩诃母捺啰 摩抳 钵纳摩 入嚩攞 钵啰靺多野 吽 ||',
    meaningZh: '嗡！不空遍照如来大印，摩尼宝与莲华光明炽盛流转，吽！',
  },
  {
    label: '天城文《伽耶特黎咒》',
    titleZh: '吠陀圣母伽耶特黎光明真言',
    deityZh: '太阳圣尊萨维特里 (Savitṛ)',
    inputMode: 'smart',
    iast: [
      'ॐ भूर्भुवः स्वः ।',
      'तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि ।',
      'धियो यो नः प्रचोदयात् ॥',
    ].join('\n'),
    translitZh: '',
    meaningZh: '嗡！遍满地、空、天三界！我等虔诚禅思太阳神尊至高无上之净妙神圣光芒，祈愿彼光明启迪我等之觉慧！',
  },
  {
    label: '文殊八字大威德真言',
    titleZh: '一切佛心大无畏八字真言（文殊八字咒）',
    deityZh: '八字文殊菩萨',
    iast: 'oṃ āḥ vī ra hūṃ kha ca raḥ ||',
    translitZh: '唵 阿 味 啰 吽 佉 左 洛 ||',
    meaningZh: '嗡！阿、味、啰、吽、佉、左、洛（一切如来大威德总持心印）！',
  },
];

function hashCompilerContent(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/**
 * Normalizes any Sanskrit user input line (Devanāgarī, Siddhaṃ, standard IAST, rough English, or SLP1)
 * into clean canonical IAST while preserving single/double daṇḍa punctuation.
 */
export function normalizeCompilerLineToIast(rawLine: string, mode: InputMode = 'smart'): string {
  const trimmed = rawLine.trim();
  if (!trimmed) return '';
  const slp1 = inputToSlp1(trimmed, mode);
  return slp1ToIast(slp1)
    .replace(/ँ/g, 'ṃ')
    .replace(/\s*\|\|\s*/g, ' || ')
    .replace(/(?<!\|)\|(?!\|)/g, ' | ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Splits single-line or multi-line Sanskrit Dhāraṇī text into clean verse clauses for
 * synchronized sentence-by-sentence & whole-dharani recitation.
 */
export function splitCompilerInputIntoClauses(rawText: string, mode: InputMode = 'smart'): string[] {
  const rawLines = rawText.split(/\r?\n/);
  const clauses: string[] = [];

  for (const rawLine of rawLines) {
    const normalized = normalizeCompilerLineToIast(rawLine, mode);
    if (!normalized) continue;

    // Split along internal double-dandas (`||`) when followed by further text on the same line
    const doubleDandaParts = normalized
      .split(/\|\|\s*/)
      .map((s) => s.trim())
      .filter(Boolean);

    doubleDandaParts.forEach((part, idx) => {
      const hadTrailingDouble =
        idx < doubleDandaParts.length - 1 || normalized.endsWith('||');
      const sentence = hadTrailingDouble ? `${part} ||` : part;

      // If a single pasted line is very long (> 96 chars) and contains single dandas `|`, split cleanly along `|`
      if (sentence.length > 96 && /\s\|\s/.test(sentence)) {
        const subParts = sentence
          .split(/(?<!\|)\|(?!\|)/)
          .map((s) => s.trim())
          .filter(Boolean);
        subParts.forEach((sp, sIdx) => {
          if (sIdx < subParts.length - 1) {
            clauses.push(`${sp} |`);
          } else {
            clauses.push(sp);
          }
        });
      } else {
        clauses.push(sentence);
      }
    });
  }

  return clauses;
}

export function buildCompiledDharaniEntry(params: {
  titleZh: string;
  deityZh: string;
  rawInput: string;
  inputMode: InputMode;
  modernPhoneticInput: string;
  translitZhInput: string;
  meaningZhInput: string;
  entryIdOverride?: string;
}): DharaniEntry {
  const clauses = splitCompilerInputIntoClauses(params.rawInput, params.inputMode);
  const modernLines = params.modernPhoneticInput
    .split(/\r?\n/)
    .map((s) => s.trim());
  const classicalLines = params.translitZhInput
    .split(/\r?\n/)
    .map((s) => s.trim());
  const meaningLines = params.meaningZhInput
    .split(/\r?\n/)
    .map((s) => s.trim());

  const hasGlobalMeaning = params.meaningZhInput.trim().length > 0;
  const contentSignature = `${clauses.join('\n')}|${params.modernPhoneticInput.trim()}|${params.translitZhInput.trim()}`;
  const computedId = params.entryIdOverride || `compiler-live-${hashCompilerContent(contentSignature)}`;

  const verses: DharaniVerse[] = clauses.map((clauseIast, idx) => {
    const autoPhonetics = generateVerseChinesePhonetics(clauseIast, false);
    const autoMeaning = translateSanskritVerse(clauseIast);

    const customModern =
      clauses.length === 1
        ? params.modernPhoneticInput.trim()
        : modernLines[idx] || '';
    const customClassical =
      clauses.length === 1
        ? params.translitZhInput.trim()
        : classicalLines[idx] || '';
    const customMeaning =
      clauses.length === 1
        ? params.meaningZhInput.trim()
        : meaningLines[idx] || '';

    return {
      id: `${computedId}-v${idx + 1}`,
      index: idx + 1,
      iast: clauseIast,
      classicalTranslitZh: customClassical || autoPhonetics.classicalTranslitZh,
      modernPhoneticZh: customModern || autoPhonetics.modernPhoneticZh,
      meaningZh: customMeaning || autoMeaning.meaningZh,
      meaningEn: autoMeaning.meaningEn || 'Compiled Sanskrit mantra clause.',
      words: buildWordGlossesFromIast(clauseIast),
      fieldSources: {
        siddham: 'derived-reference',
        devanagari: 'derived-reference',
        iast: 'derived-reference',
        modernPhoneticZh: customModern ? 'db-original' : 'derived-reference',
        classicalTranslitZh: customClassical ? 'db-original' : 'derived-reference',
        ipa: 'derived-reference',
        prosody: 'derived-reference',
        meaningZh: customMeaning ? 'db-original' : 'derived-reference',
        meaningEn: 'derived-reference',
        words: 'derived-reference',
      },
    };
  });

  const firstClauseMeaning =
    clauses.length > 0 ? translateSanskritVerse(clauses[0]).meaningZh : '';

  return {
    id: computedId,
    titleZh: params.titleZh.trim() || '实时编译梵文陀罗尼',
    titleSanskritIast: clauses[0]?.slice(0, 72) || 'Saṃskṛta-Dhāraṇī',
    titleEnglish: 'Personal Sanskrit Dhāraṇī Workbench Draft',
    categoryId: 'custom',
    taishoNo: 'LOCAL-DRAFT',
    translatorZh: '个人研习本地草稿（非系统馆藏）',
    sutraSourceZh: '仅保存在当前浏览器本地草稿夹，不混入权威藏经总库',
    deityZh: params.deityZh.trim() || '本尊总持',
    meritsAndSummaryZh: hasGlobalMeaning ? params.meaningZhInput.trim() : firstClauseMeaning,
    recitationTipsZh: '支持整句与全咒连诵，并与页面底部全局播放栏实时同步。',
    provenance: {
      sourceType: 'LOCAL-USER-DRAFT',
      editionCitation: 'Local Browser Draft via Sarva-Dhāraṇī-Kośa Phonetic Workbench',
      manuscriptNotesZh: '用户本地浏览器草稿记录，仅供个人拼读试听与学习备忘，不进入公共馆藏词库。',
    },
    verses,
  };
}

interface CompiledVerseRenderModel {
  verse: DharaniVerse;
  siddhamFull: string;
  devanagariFull: string;
  ipaOut: string;
  displayModernPhoneticZh: string;
  hasCustomModern: boolean;
  hasCustomClassical: boolean;
  enrichedSyllables: ReturnType<typeof enrichSyllablesWithPhonetics>;
  subwordGroups: Array<{
    key: number;
    iast: string;
    siddham: string;
    devanagari: string;
    firstSylIndex: number;
    lastSylIndex: number;
    dandaBefore?: '|' | '||';
    dandaAfter?: '|' | '||';
  }>;
}

export const CustomDharaniCompiler: React.FC<CustomDharaniCompilerProps> = ({
  customEntries,
  onAddCustomEntry,
  onDeleteCustomEntry,
  onClearAllCustomEntries,
  playbackState,
  onPlayVerses,
  onStopPlayback,
  onPlaySyllable,
  onLiveEntryChange,
}) => {
  const [titleZh, setTitleZh] = useState('圣救度佛母增福慧随心真言');
  const [deityZh, setDeityZh] = useState('圣救度佛母 (Ārya-Tārā)');
  const [inputMode, setInputMode] = useState<InputMode>('smart');
  const [rawInput, setRawInput] = useState(
    'oṃ tāre tuttāre ture mama āyuḥpuṇyajñānapuṣṭiṃ kuru svāhā ||'
  );
  const [modernPhoneticInput, setModernPhoneticInput] = useState('');
  const [translitZh, setTranslitZh] = useState(
    '唵 多隶 咄多隶 都隶 摩摩 阿瑜布尼耶枳娘曩补瑟徴 俱噜 娑嚩诃 ||'
  );
  const [meaningZh, setMeaningZh] = useState(
    '嗡！度母、救苦度母、疾速母！祈请令我之寿命、福德与智慧皆得增长广大，圆满成就！'
  );
  const [showBracketIast, setShowBracketIast] = useState(false);
  const [copiedSheet, setCopiedSheet] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const topPanelRef = useRef<HTMLDivElement | null>(null);

  const compiledEntry = useMemo(
    () =>
      buildCompiledDharaniEntry({
        titleZh,
        deityZh,
        rawInput,
        inputMode,
        modernPhoneticInput,
        translitZhInput: translitZh,
        meaningZhInput: meaningZh,
      }),
    [titleZh, deityZh, rawInput, inputMode, modernPhoneticInput, translitZh, meaningZh]
  );

  const compiledVerses = compiledEntry.verses;

  // Keep parent App & bottom AudioPlayerBar synchronized with the editor's live compiled Dharani
  useEffect(() => {
    onLiveEntryChange?.(compiledEntry);
  }, [compiledEntry, onLiveEntryChange]);

  const verseModels = useMemo<CompiledVerseRenderModel[]>(() => {
    const modernLines = modernPhoneticInput.split(/\r?\n/).map((s) => s.trim());
    const classicalLines = translitZh.split(/\r?\n/).map((s) => s.trim());

    return compiledVerses.map((verse, idx) => {
      const prosody = analyzeSanskritProsody(verse.iast);
      const enrichedSyllables = enrichSyllablesWithPhonetics(prosody);
      const customModern =
        compiledVerses.length === 1
          ? modernPhoneticInput.trim()
          : modernLines[idx] || '';
      const customClassical =
        compiledVerses.length === 1 ? translitZh.trim() : classicalLines[idx] || '';

      const displayModernPhoneticZh = customModern
        ? formatModernPhoneticWithIastOption(customModern, verse.iast, showBracketIast)
        : generateVerseChinesePhonetics(verse.iast, showBracketIast).modernPhoneticZh;

      const subwordGroups: CompiledVerseRenderModel['subwordGroups'] = [];
      for (const syl of enrichedSyllables) {
        const swKey = syl.subwordIndex ?? syl.wordIndex ?? syl.index;
        const last = subwordGroups[subwordGroups.length - 1];
        if (last && last.key === swKey) {
          last.iast += syl.iast;
          last.lastSylIndex = syl.index;
          if (syl.dandaAfter) last.dandaAfter = syl.dandaAfter;
        } else {
          subwordGroups.push({
            key: swKey,
            iast: syl.iast,
            siddham: '',
            devanagari: '',
            firstSylIndex: syl.index,
            lastSylIndex: syl.index,
            dandaBefore: syl.dandaBefore,
            dandaAfter: syl.dandaAfter,
          });
        }
      }
      for (const g of subwordGroups) {
        g.siddham = iastToSiddham(g.iast);
        g.devanagari = iastToDevanagari(g.iast);
      }

      return {
        verse,
        siddhamFull: iastToSiddham(verse.iast),
        devanagariFull: iastToDevanagari(verse.iast),
        ipaOut: iastToIpa(verse.iast),
        displayModernPhoneticZh,
        hasCustomModern: customModern.length > 0,
        hasCustomClassical: customClassical.length > 0,
        enrichedSyllables,
        subwordGroups,
      };
    });
  }, [compiledVerses, modernPhoneticInput, translitZh, showBracketIast]);

  const totalSyllableCount = useMemo(
    () => verseModels.reduce((acc, m) => acc + m.enrichedSyllables.length, 0),
    [verseModels]
  );

  // Smooth auto-scroll to currently chanted verse card during multi-sentence playback
  useEffect(() => {
    if (
      !playbackState.isPlaying ||
      !playbackState.autoScroll ||
      playbackState.currentVerseIndex === null ||
      compiledVerses.length <= 1
    ) {
      return;
    }
    if (typeof document === 'undefined') return;
    const el = document.getElementById(`compiler-verse-card-${playbackState.currentVerseIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [playbackState.isPlaying, playbackState.autoScroll, playbackState.currentVerseIndex, compiledVerses.length]);

  const {
    isExporting,
    exportingFormat,
    progress: exportProgress,
    exportedMp3,
    exportedWav,
    expectedMp3FileName,
    expectedWavFileName,
    triggerDownload,
  } = useDharaniAudioExport({
    entryId: compiledEntry.id,
    dharaniTitle: compiledEntry.titleZh,
    verses: compiledVerses,
    rate: playbackState.rate,
    voice: playbackState.voice,
    mode: playbackState.mode,
  });

  const handleInsertChar = (ch: string) => {
    const el = textareaRef.current;
    if (!el) {
      setRawInput((prev) => `${prev}${ch}`);
      return;
    }
    const start = el.selectionStart ?? rawInput.length;
    const end = el.selectionEnd ?? rawInput.length;
    const insertText = ch === '|' || ch === '||' ? ` ${ch} ` : ch;
    const nextVal = `${rawInput.slice(0, start)}${insertText}${rawInput.slice(end)}`;
    if (playbackState.isPlaying) {
      onStopPlayback();
    }
    setRawInput(nextVal);
    setTimeout(() => {
      el.focus();
      const nextPos = start + insertText.length;
      el.setSelectionRange(nextPos, nextPos);
    }, 0);
  };

  const handleSaveLocalDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (compiledVerses.length === 0) return;

    const draftEntry = buildCompiledDharaniEntry({
      titleZh,
      deityZh,
      rawInput,
      inputMode,
      modernPhoneticInput,
      translitZhInput: translitZh,
      meaningZhInput: meaningZh,
      entryIdOverride: `local-draft-${Date.now()}`,
    });

    onAddCustomEntry(draftEntry);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2600);
  };

  const handleLoadDraftIntoEditor = (draft: DharaniEntry, autoPlay = false) => {
    onStopPlayback();
    setTitleZh(draft.titleZh);
    setDeityZh(draft.deityZh || '本尊总持');
    setInputMode('smart');
    setRawInput(draft.verses.map((v) => v.iast).join('\n'));
    setModernPhoneticInput(
      draft.verses.every((v) => v.fieldSources?.modernPhoneticZh === 'db-original')
        ? draft.verses.map((v) => v.modernPhoneticZh).join('\n')
        : ''
    );
    setTranslitZh(
      draft.verses.every((v) => v.fieldSources?.classicalTranslitZh === 'db-original')
        ? draft.verses.map((v) => v.classicalTranslitZh).join('\n')
        : ''
    );
    setMeaningZh(draft.meritsAndSummaryZh || '');

    if (typeof window !== 'undefined' && topPanelRef.current) {
      topPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (autoPlay && draft.verses.length > 0) {
      setTimeout(() => {
        onPlayVerses(draft.verses, 0, false);
      }, 60);
    }
  };

  const handleCopyFormattedSheet = () => {
    if (verseModels.length === 0) return;
    const lines: string[] = [
      `【${compiledEntry.titleZh}】`,
      deityZh.trim() ? `本尊/备注：${deityZh.trim()}` : '',
      '',
    ].filter(Boolean);

    verseModels.forEach((m, idx) => {
      if (verseModels.length > 1) {
        lines.push(`—— 第 ${idx + 1} 句 ——`);
      }
      lines.push(`悉昙梵字：${m.siddhamFull}`);
      lines.push(`天城梵文：${m.devanagariFull}`);
      lines.push(`梵文IAST：${m.verse.iast}`);
      lines.push(`梵音拼读：${m.displayModernPhoneticZh}`);
      lines.push(`古汉音译：${m.verse.classicalTranslitZh}`);
      lines.push(`国际音标：/${m.ipaOut}/`);
      if (m.verse.meaningZh) {
        lines.push(`汉文释义：${m.verse.meaningZh}`);
      }
      lines.push('');
    });

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(lines.join('\n')).then(() => {
        setCopiedSheet(true);
        setTimeout(() => setCopiedSheet(false), 2200);
      });
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(customEntries, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sarva-dharani-local-drafts.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={topPanelRef} className="section-panel">
      {/* Unified Workbench Header */}
      <div
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.85rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.22rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Code2 size={20} color="var(--accent-vermilion)" style={{ flexShrink: 0 }} />
            <span>梵音六体编译与全咒发声工作台</span>
          </h2>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginTop: '0.24rem' }}>
            直接输入天城文 (ॐ)、标准 IAST、悉昙文或粗略英文拼写（支持多行整篇陀罗尼）；实时生成六体注音、摩多轻重律切分，并与页面底部播放栏同步整句/全咒神经梵音跟诵。
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <span className="engine-status-pill">
            {compiledVerses.length} 句 · {totalSyllableCount} 音节 · 48kHz VITS 已连接底部栏
          </span>
        </div>
      </div>

      {/* Classic Single & Multi-Verse Dharani Quick Samples */}
      <div style={{ display: 'flex', gap: '0.42rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          一键载入范例（含多句全咒与天城文）：
        </span>
        {PRESET_TEMPLATES.map((tpl) => (
          <button
            key={tpl.label}
            type="button"
            className="btn-scholarly"
            onClick={() => {
              onStopPlayback();
              setTitleZh(tpl.titleZh);
              setDeityZh(tpl.deityZh);
              setInputMode(tpl.inputMode || 'smart');
              setRawInput(tpl.iast);
              setModernPhoneticInput('');
              setTranslitZh(tpl.translitZh);
              setMeaningZh(tpl.meaningZh);
            }}
          >
            {tpl.label}
          </button>
        ))}
      </div>

      {/* Main Two-Column Compiler & Full-Dharani Audio Preview Grid */}
      <form
        onSubmit={handleSaveLocalDraft}
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(min(100%, 330px), 420px) minmax(0, 1fr)',
          gap: '1.25rem',
          alignItems: 'start',
        }}
        className="two-col-grid"
      >
        {/* Left Column: Sanskrit Input, Quick Diacritics, Optional Notes & Local Draft Save */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', minWidth: 0 }}>
          <div>
            <label htmlFor="compiler-title-input" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
              陀罗尼名称（同步显示于底部播放栏与音频文件名）：
            </label>
            <input
              id="compiler-title-input"
              type="text"
              className="text-input"
              style={{ marginTop: '0.25rem' }}
              value={titleZh}
              onChange={(e) => setTitleZh(e.target.value)}
            />
          </div>

          {/* Smart Input Parsing Mode Selector */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.4rem',
                flexWrap: 'wrap',
                marginBottom: '0.3rem',
              }}
            >
              <label htmlFor="compiler-iast-input" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                梵文原文（可换行输入多句或整篇陀罗尼）：
              </label>
              <div className="preset-pills-group" role="group" aria-label="梵文输入解析模式">
                <button
                  type="button"
                  className={`script-toggle-chip ${inputMode === 'smart' ? 'active' : ''}`}
                  onClick={() => setInputMode('smart')}
                  title="自动识别天城文、标准 IAST、悉昙文及 om mani padme hum 等英文容错拼写"
                >
                  智能容错
                </button>
                <button
                  type="button"
                  className={`script-toggle-chip ${inputMode === 'strict' ? 'active' : ''}`}
                  onClick={() => setInputMode('strict')}
                  title="严格按标准 IAST 或天城文转写解析"
                >
                  严格 IAST/天城
                </button>
                <button
                  type="button"
                  className={`script-toggle-chip ${inputMode === 'slp1' ? 'active' : ''}`}
                  onClick={() => setInputMode('slp1')}
                  title="按学术单字符音素编码 SLP1 解析（如 oM maRi padme hUM）"
                >
                  SLP1 码
                </button>
              </div>
            </div>

            {/* Quick IAST Diacritic Insertion Bar */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.25rem',
                marginBottom: '0.35rem',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>快捷字符：</span>
              {IAST_QUICK_CHARS.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => handleInsertChar(ch)}
                  style={{
                    padding: '0.12rem 0.42rem',
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-iast)',
                    borderRadius: '4px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
                  title={`插入字符 ${ch}`}
                >
                  {ch}
                </button>
              ))}
              {rawInput.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onStopPlayback();
                    setRawInput('');
                  }}
                  style={{
                    padding: '0.12rem 0.45rem',
                    fontSize: '0.72rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    marginLeft: 'auto',
                  }}
                  title="清空梵文输入区"
                >
                  <RotateCcw size={11} />
                  <span>清空</span>
                </button>
              )}
            </div>

            <textarea
              ref={textareaRef}
              id="compiler-iast-input"
              rows={5}
              className="text-input iast-text"
              style={{ fontSize: '0.96rem', lineHeight: 1.55 }}
              placeholder="在此输入单句或整篇陀罗尼（支持换行分句或 || 分句），例如：&#10;oṃ maṇi padme hūṃ ||&#10;ॐ मणि पद्मे हूँ&#10;om gate gate paragate parasamgate bodhi svaha"
              value={rawInput}
              onChange={(e) => {
                if (playbackState.isPlaying) {
                  onStopPlayback();
                }
                setRawInput(e.target.value);
              }}
            />
          </div>

          {/* Collapsible Optional Custom Overrides */}
          <details
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.6rem 0.78rem',
            }}
          >
            <summary
              style={{
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                userSelect: 'none',
              }}
            >
              选填附注：自定义拼读 / 古音译 / 释义备注（留空自动推导）
            </summary>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                marginTop: '0.65rem',
              }}
            >
              <div>
                <label htmlFor="compiler-deity-input" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  本尊或出处备注：
                </label>
                <input
                  id="compiler-deity-input"
                  type="text"
                  className="text-input"
                  style={{ marginTop: '0.2rem' }}
                  value={deityZh}
                  onChange={(e) => setDeityZh(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="compiler-modern-phonetic-input" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  自定义梵音拼读（多句请按行对应，留空自动推导）：
                </label>
                <textarea
                  id="compiler-modern-phonetic-input"
                  rows={2}
                  placeholder={verseModels[0]?.verse.modernPhoneticZh || '自动拼读推导'}
                  className="text-input"
                  style={{ marginTop: '0.2rem', lineHeight: 1.45 }}
                  value={modernPhoneticInput}
                  onChange={(e) => setModernPhoneticInput(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="compiler-translit-input" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  自定义唐宋古汉语音译（多句请按行对应，留空自动对音）：
                </label>
                <textarea
                  id="compiler-translit-input"
                  rows={2}
                  placeholder={verseModels[0]?.verse.classicalTranslitZh || '自动悉昙唐音对音'}
                  className="text-input"
                  style={{ marginTop: '0.2rem', lineHeight: 1.45 }}
                  value={translitZh}
                  onChange={(e) => setTranslitZh(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="compiler-meaning-input" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  汉文意译与学习笔记（留空由梵汉辞典自动拟译）：
                </label>
                <textarea
                  id="compiler-meaning-input"
                  rows={2}
                  className="text-input"
                  style={{ marginTop: '0.2rem', lineHeight: 1.45 }}
                  value={meaningZh}
                  onChange={(e) => setMeaningZh(e.target.value)}
                />
              </div>
            </div>
          </details>

          {/* Local Draft & Copy Actions (Strictly Local Browser Drafts — Never Mixed into System Canon) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.42rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                id="compiler-save-btn"
                type="submit"
                disabled={compiledVerses.length === 0}
                className="btn-scholarly gold"
                style={{ flex: 1, justifyContent: 'center', padding: '0.55rem 0.75rem' }}
              >
                {savedNotice ? <Check size={15} /> : <BookmarkPlus size={15} />}
                <span>{savedNotice ? '已暂存至本地草稿夹' : '暂存到我的本地草稿夹'}</span>
              </button>

              <button
                id="compiler-copy-sheet-btn"
                type="button"
                disabled={compiledVerses.length === 0}
                className="btn-scholarly"
                style={{ padding: '0.55rem 0.75rem' }}
                onClick={handleCopyFormattedSheet}
              >
                {copiedSheet ? <Check size={15} /> : <Copy size={15} />}
                <span>{copiedSheet ? '已复制对照谱' : '复制六体谱'}</span>
              </button>
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              说明：暂存的草稿仅保存在您当前浏览器的本地存储中，供下方「我的本地草稿夹」随时回填与试听，不会上传或混入系统权威藏经目录。
            </div>
          </div>
        </div>

        {/* Right Column: Integrated Full-Dharani Pronunciation Toolbar + Multi-Verse 6-Script Live Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', minWidth: 0 }}>
          {/* Integrated Full-Sentence / Full-Dharani Pronunciation & Audio Export Bar */}
          <div className="hero-audio-strip" style={{ padding: '0.72rem 0.9rem' }}>
            <div className="hero-audio-group">
              {playbackState.isPlaying ? (
                <button
                  id="compiler-stop-chant-btn"
                  type="button"
                  className="btn-scholarly primary"
                  onClick={onStopPlayback}
                >
                  <Square size={14} />
                  <span>{playbackState.isLoadingAudio ? '准备梵音中 · 停止' : '停止讽诵'}</span>
                </button>
              ) : (
                <button
                  id="compiler-play-all-btn"
                  type="button"
                  className="btn-scholarly primary"
                  disabled={compiledVerses.length === 0}
                  onMouseEnter={() => {
                    if (compiledVerses.length > 0) {
                      sanskritAudioEngine.prewarmVerses(compiledVerses, 3);
                    }
                  }}
                  onClick={() => onPlayVerses(compiledVerses, 0, false)}
                >
                  <Play size={14} />
                  <span>
                    {compiledVerses.length > 1
                      ? `朗读全咒 (${compiledVerses.length}句连诵)`
                      : '朗读整句梵音'}
                  </span>
                </button>
              )}

              <button
                type="button"
                className="script-toggle-chip"
                onClick={() =>
                  sanskritAudioEngine.setVoice(
                    playbackState.voice === 'male' ? 'female' : 'male'
                  )
                }
                title="切换古典梵语男声 / 女声（与底部播放栏同步）"
              >
                <span>{playbackState.voice === 'female' ? '👩 女声' : '🧔 男声'}</span>
              </button>

              <select
                aria-label="编辑器发音语速"
                className="audio-select"
                value={playbackState.rate}
                onChange={(e) => sanskritAudioEngine.setRate(parseFloat(e.target.value))}
              >
                <option value={0.65}>0.65x 慢速拆解</option>
                <option value={0.85}>0.85x 庄严从容</option>
                <option value={1}>1.0x 标准原速</option>
                <option value={1.25}>1.25x 熟诵连持</option>
                <option value={1.5}>1.5x 金刚疾诵</option>
              </select>

              <select
                aria-label="编辑器发音音源模式"
                className="audio-select"
                value={playbackState.mode}
                onChange={(e) => sanskritAudioEngine.setMode(e.target.value as AudioEngineMode)}
              >
                <option value="neural-vits-48k">48kHz 神经VITS (sa.onnx)</option>
                <option value="neural-resonance-hall">48kHz 神经共振 · 殿堂共鸣 (136.1Hz)</option>
                <option value="neural-vedic-chant">48kHz 神经共振 · 定调梵呗 (136.1Hz)</option>
                <option value="studio-vocal-chant">136.1Hz 纯共振峰电子合成</option>
                <option value="mandarin-phonetic-guide">普通话谐音慢速领诵</option>
                <option value="indic-devanagari-tts">天城文系统语音</option>
              </select>
            </div>

            <div className="hero-audio-group">
              <button
                id="compiler-export-mp3-btn"
                type="button"
                className="btn-scholarly gold"
                disabled={isExporting || compiledVerses.length === 0}
                onClick={() => triggerDownload('mp3')}
                title={`导出当前编译陀罗尼为 MP3 音频：${expectedMp3FileName}`}
              >
                {isExporting && exportingFormat === 'mp3' ? (
                  <>
                    <Loader2 size={13} className="spin-icon" />
                    <span>导出 {exportProgress?.percent ?? 5}%</span>
                  </>
                ) : (
                  <>
                    <Download size={13} />
                    <span>{exportedMp3 ? '保存 MP3' : '下载 MP3'}</span>
                  </>
                )}
              </button>

              <button
                id="compiler-export-wav-btn"
                type="button"
                className="btn-scholarly"
                disabled={isExporting || compiledVerses.length === 0}
                onClick={() => triggerDownload('wav')}
                title={`导出无损 48kHz WAV 音频：${expectedWavFileName}`}
              >
                {isExporting && exportingFormat === 'wav' ? (
                  <>
                    <Loader2 size={13} className="spin-icon" />
                    <span>WAV {exportProgress?.percent ?? 5}%</span>
                  </>
                ) : (
                  <>
                    <FileAudio size={13} />
                    <span>WAV</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className={`btn-scholarly ${showBracketIast ? 'gold' : ''}`}
                onClick={() => setShowBracketIast((b) => !b)}
              >
                <Sparkles size={13} />
                <span>拼读括号(IAST)：{showBracketIast ? '开' : '关'}</span>
              </button>
            </div>
          </div>

          {/* Live Multi-Verse 6-Script & Synchronized Karaoke Cards */}
          {verseModels.length === 0 ? (
            <div
              className="verse-card"
              style={{
                textAlign: 'center',
                padding: '2.2rem 1.2rem',
                color: 'var(--text-muted)',
                fontSize: '0.88rem',
              }}
            >
              请在左侧输入梵文文本（支持天城文、IAST 或英文拼写），或点击上方范例按钮一键体验整咒编译与发音。
            </div>
          ) : (
            verseModels.map((m, vIdx) => {
              const isVersePlaying =
                playbackState.isPlaying && playbackState.currentVerseIndex === vIdx;
              const activeSylIdx = isVersePlaying ? playbackState.currentSyllableIndex : null;

              return (
                <div
                  key={m.verse.id}
                  id={`compiler-verse-card-${vIdx}`}
                  className={`verse-card ${isVersePlaying ? 'playing' : ''}`}
                >
                  <div className="verse-card-header">
                    <span className="verse-index-badge">
                      {verseModels.length > 1
                        ? `第 ${vIdx + 1} / ${verseModels.length} 句 · 实时六体编译`
                        : '实时六体编译与同步发音预览'}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      {isVersePlaying ? (
                        <button
                          id={`compiler-stop-verse-${vIdx}`}
                          type="button"
                          className="btn-scholarly primary"
                          onClick={onStopPlayback}
                        >
                          <Square size={13} />
                          <span>停止本句</span>
                        </button>
                      ) : (
                        <button
                          id={`compiler-play-verse-${vIdx}`}
                          type="button"
                          className="btn-scholarly"
                          onClick={() => onPlayVerses(compiledVerses, vIdx, true)}
                          title="单独试听本句梵音（若底部开启单句循环则循环持诵本句）"
                        >
                          <Volume2 size={14} color="var(--accent-vermilion)" />
                          <span>{verseModels.length > 1 ? '本句跟诵' : '整句试听'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Active Syllable Spotlight Banner when Playing */}
                  {isVersePlaying && playbackState.currentSyllableInfo && (
                    <div className="live-reading-spotlight">
                      <span className="spotlight-badge-now">正在讽诵</span>
                      <div className="spotlight-syllable-focus">
                        <span className="spotlight-token-chip siddham-glyph" style={{ color: 'var(--accent-vermilion)', fontSize: '1.1rem' }}>
                          {playbackState.currentSyllableInfo.siddham}
                        </span>
                        <span className="spotlight-token-chip devanagari-glyph">
                          {playbackState.currentSyllableInfo.devanagari}
                        </span>
                        <span className="spotlight-token-chip" style={{ fontWeight: 700 }}>
                          {playbackState.currentSyllableInfo.iast}
                        </span>
                        <span className="spotlight-token-chip" style={{ color: 'var(--accent-jade)', fontWeight: 700 }}>
                          {playbackState.currentSyllableModernZh}
                        </span>
                        <span className="spotlight-token-chip" style={{ color: 'var(--accent-vermilion)' }}>
                          古：{playbackState.currentSyllableClassicalZh}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 1. Siddhaṃ Script (Subword-grouped so conjunct ligatures stay intact + live karaoke highlight) */}
                  <div className="script-row is-reference-row">
                    <span className="script-label">
                      <span>悉昙梵字</span>
                      <ProvenanceBadge
                        state="derived-reference"
                        field="siddham"
                        compact
                        customLabel="◇ 实时转写"
                      />
                    </span>
                    <div className="script-content-siddham inline-syl-strip">
                      {m.subwordGroups.map((g) => {
                        const isActive =
                          activeSylIdx !== null &&
                          activeSylIdx >= g.firstSylIndex &&
                          activeSylIdx <= g.lastSylIndex;
                        const isPast =
                          activeSylIdx !== null && activeSylIdx > g.lastSylIndex;
                        return (
                          <React.Fragment key={`sid-sw-${g.key}`}>
                            {g.dandaBefore && <span style={{ opacity: 0.6 }}>{g.dandaBefore === '||' ? '𑗃' : '𑗂'}</span>}
                            <span
                              className={`inline-syl-token ${isActive ? 'active-spoken' : isPast ? 'past-spoken' : ''}`}
                              onClick={() => onPlaySyllable(g.iast)}
                              title={`点击试听词块：${g.iast}`}
                            >
                              {g.siddham}
                            </span>
                            {g.dandaAfter && <span style={{ opacity: 0.6 }}>{g.dandaAfter === '||' ? '𑗃' : '𑗂'}</span>}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Modern Chinese Phonetic Guide */}
                  <div className={`script-row ${m.hasCustomModern ? 'is-original-row' : 'is-reference-row'}`}>
                    <span className="script-label" style={{ color: 'var(--accent-jade)' }}>
                      <span>梵音拼读</span>
                      <ProvenanceBadge
                        state={m.hasCustomModern ? 'db-original' : 'derived-reference'}
                        field="modernPhoneticZh"
                        compact
                        customLabel={m.hasCustomModern ? '● 手动指定' : '◇ 自动拼读'}
                      />
                    </span>
                    {!m.hasCustomModern && !showBracketIast ? (
                      <div className="script-content-phonetic-zh inline-syl-strip">
                        {m.enrichedSyllables.map((syl) => {
                          const isActive = activeSylIdx === syl.index;
                          const isPast = activeSylIdx !== null && activeSylIdx > syl.index;
                          return (
                            <React.Fragment key={`mod-syl-${syl.index}`}>
                              {syl.dandaBefore && <span style={{ opacity: 0.55 }}>{syl.dandaBefore}</span>}
                              <span
                                className={`inline-syl-token ${isActive ? 'active-spoken' : isPast ? 'past-spoken' : ''}`}
                                onClick={() => onPlaySyllable(syl.iast)}
                                title={`${syl.iast} → ${syl.modernZh}`}
                              >
                                {syl.modernZh}
                              </span>
                              {syl.dandaAfter && <span style={{ opacity: 0.55 }}>{syl.dandaAfter}</span>}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="script-content-phonetic-zh">{m.displayModernPhoneticZh}</div>
                    )}
                  </div>

                  {/* 3. Devanāgarī Script */}
                  <div className="script-row is-reference-row">
                    <span className="script-label">
                      <span>天城梵文</span>
                      <ProvenanceBadge
                        state="derived-reference"
                        field="devanagari"
                        compact
                        customLabel="◇ 实时转写"
                      />
                    </span>
                    <div className="script-content-devanagari inline-syl-strip">
                      {m.subwordGroups.map((g) => {
                        const isActive =
                          activeSylIdx !== null &&
                          activeSylIdx >= g.firstSylIndex &&
                          activeSylIdx <= g.lastSylIndex;
                        const isPast =
                          activeSylIdx !== null && activeSylIdx > g.lastSylIndex;
                        return (
                          <React.Fragment key={`deva-sw-${g.key}`}>
                            {g.dandaBefore && <span style={{ opacity: 0.6 }}>{g.dandaBefore === '||' ? '॥' : '।'}</span>}
                            <span
                              className={`inline-syl-token ${isActive ? 'active-spoken' : isPast ? 'past-spoken' : ''}`}
                              onClick={() => onPlaySyllable(g.iast)}
                              title={`点击试听：${g.iast}`}
                            >
                              {g.devanagari}
                            </span>
                            {g.dandaAfter && <span style={{ opacity: 0.6 }}>{g.dandaAfter === '||' ? '॥' : '।'}</span>}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Canonical Sanskrit IAST */}
                  <div className="script-row is-original-row">
                    <span className="script-label">
                      <span>梵文 IAST</span>
                      <ProvenanceBadge
                        state="db-original"
                        field="iast"
                        compact
                        customLabel="● 标准转写"
                      />
                    </span>
                    <div className="script-content-iast inline-syl-strip">
                      {m.enrichedSyllables.map((syl) => {
                        const isActive = activeSylIdx === syl.index;
                        const isPast = activeSylIdx !== null && activeSylIdx > syl.index;
                        return (
                          <React.Fragment key={`iast-syl-${syl.index}`}>
                            {syl.dandaBefore && <span style={{ opacity: 0.55 }}>{syl.dandaBefore}</span>}
                            <span
                              className={`inline-syl-token ${isActive ? 'active-spoken' : isPast ? 'past-spoken' : ''}`}
                              onClick={() => onPlaySyllable(syl.iast)}
                              title={`点击单音节试听：${syl.iast}`}
                            >
                              {syl.iast}
                            </span>
                            {syl.dandaAfter && <span style={{ opacity: 0.55 }}>{syl.dandaAfter}</span>}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5. Classical Tang-Song Chinese Transliteration */}
                  <div className={`script-row ${m.hasCustomClassical ? 'is-original-row' : 'is-reference-row'}`}>
                    <span className="script-label" style={{ color: 'var(--accent-vermilion)' }}>
                      <span>古汉语音译</span>
                      <ProvenanceBadge
                        state={m.hasCustomClassical ? 'db-original' : 'derived-reference'}
                        field="classicalTranslitZh"
                        compact
                        customLabel={m.hasCustomClassical ? '● 手动指定' : '◇ 唐音对音'}
                      />
                    </span>
                    <div className="script-content-classical-zh">{m.verse.classicalTranslitZh}</div>
                  </div>

                  {/* 6. International Phonetic Alphabet (IPA) */}
                  <div className="script-row is-reference-row">
                    <span className="script-label">
                      <span>国际音标</span>
                      <ProvenanceBadge
                        state="derived-reference"
                        field="ipa"
                        compact
                        customLabel="◇ 音标参考"
                      />
                    </span>
                    <div className="script-content-ipa">/{m.ipaOut}/</div>
                  </div>

                  {/* 7. Chinese Meaning Gloss */}
                  {m.verse.meaningZh && (
                    <div className="script-row is-reference-row">
                      <span className="script-label">
                        <span>汉文释义</span>
                        <ProvenanceBadge
                          state={m.verse.fieldSources?.meaningZh === 'db-original' ? 'db-original' : 'derived-reference'}
                          field="meaningZh"
                          compact
                          customLabel={
                            m.verse.fieldSources?.meaningZh === 'db-original' ? '● 个人备注' : '◇ 辞典拟译'
                          }
                        />
                      </span>
                      <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                        {m.verse.meaningZh}
                      </div>
                    </div>
                  )}

                  {/* 8. Prosody Guru/Laghu Syllable Pills with Live Playback Sync */}
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                      摩多轻重音律切分（点击单音节即点即听；整咒朗读时同步追字）：
                    </div>
                    <div className="prosody-syllables-strip">
                      {m.enrichedSyllables.map((syl) => {
                        const isActive = activeSylIdx === syl.index;
                        const isPast = activeSylIdx !== null && activeSylIdx > syl.index;
                        return (
                          <button
                            key={`comp-syl-${vIdx}-${syl.index}`}
                            type="button"
                            className={`syllable-pill ${syl.weight} ${isActive ? 'active-spoken' : isPast ? 'past-spoken' : ''}`}
                            onClick={() => onPlaySyllable(syl.iast)}
                          >
                            <span className="syl-meter">{syl.weight === 'guru' ? '—' : '⌣'}</span>
                            <span className="syl-iast">{syl.iast}</span>
                            <span className="syl-modern-zh">{syl.modernZh}</span>
                            <span className="syl-tang-zh">{syl.classicalZh}</span>
                            <span className="syl-ipa">[{syl.ipa}]</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </form>

      {/* Strictly Isolated Local Browser Drafts Drawer */}
      {customEntries.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '0.65rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FolderOpen size={16} color="var(--accent-gold)" />
                <span>我的本地草稿夹 ({customEntries.length})</span>
              </h3>
              <span className="deity-pill">仅存当前浏览器 · 不入系统权威经库</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn-scholarly" onClick={handleExportJson}>
                <Download size={14} />
                <span>备份本地草稿 JSON</span>
              </button>
              {onClearAllCustomEntries && (
                confirmClearAll ? (
                  <button
                    type="button"
                    className="btn-scholarly primary"
                    onClick={() => {
                      onClearAllCustomEntries();
                      setConfirmClearAll(false);
                    }}
                  >
                    <Trash2 size={14} />
                    <span>确认清空全部？</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-scholarly"
                    onClick={() => setConfirmClearAll(true)}
                  >
                    <Trash2 size={14} />
                    <span>清空草稿夹</span>
                  </button>
                )
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
            {customEntries.map((ce) => (
              <div
                key={ce.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.44rem 0.75rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                }}
              >
                <button
                  type="button"
                  style={{ fontWeight: 600, fontSize: '0.84rem', textAlign: 'left' }}
                  onClick={() => handleLoadDraftIntoEditor(ce, false)}
                  title="点击将此草稿回填至上方编辑器继续修改"
                >
                  {ce.titleZh}
                  <span
                    style={{
                      marginLeft: '0.35rem',
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      fontWeight: 400,
                    }}
                  >
                    ({ce.verses.length}句)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLoadDraftIntoEditor(ce, true)}
                  title="载入并朗读整段草稿梵音"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.22rem',
                    fontSize: '0.74rem',
                    color: 'var(--accent-vermilion)',
                    fontWeight: 600,
                  }}
                >
                  <Play size={13} />
                  <span>朗读</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteCustomEntry(ce.id)}
                  title="删除此条本地草稿"
                >
                  <Trash2 size={14} color="var(--text-muted)" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
