/**
 * Real-Time Custom Sanskrit Dhāraṇī Compiler (`src/components/CustomDharaniCompiler.tsx`)
 * Allows scholars & practitioners to enter arbitrary Sanskrit text in Devanāgarī, IAST,
 * SLP1, or rough English phonetic spelling, compiles it into all 10 layers (Siddhaṃ,
 * Devanāgarī, IAST, SLP1, IPA, Modern Chinese, Tang Siddhaṃ, Chandas Guru/Laghu meter),
 * synthesizes 48kHz neural audio via Plan 1 (`POST /api/tts`) & Plan 3 (`playSyllable`),
 * and saves custom entries into the local corpus.
 */

import React, { useMemo, useState } from 'react';
import { analyzeSanskritText } from '../core/prosody';
import sanskritAudioEngine from '../services/audio/sanskritAudioEngine';
import { DharaniEntry } from '../types/dharani';

interface CustomDharaniCompilerProps {
  onSaveCustomEntry: (entry: DharaniEntry) => void;
}

const PRESET_EXAMPLES = [
  {
    label: '文殊八字大威德真言',
    title: '文殊八字大威德陀罗尼',
    text: 'oṃ āḥ vī ra hūṃ kha ca raḥ',
    meaning: '唵！阿！勇猛无比大智文殊师利菩萨，于虚空法界自在游行，圆满护佑！',
  },
  {
    label: '五辅音丛极限测试 (kārtsnyena)',
    title: '五辅音丛声明学测试句',
    text: 'kārtsnyena śrī-bhagavān uvāca',
    meaning: '吉祥世尊薄伽梵完完全全（kārtsnyena）如是宣说。',
  },
  {
    label: '英文容错智能修正测试',
    title: '英文模糊拼写自动转正测试',
    text: 'om mani padme hum | om shanti shanti shantih',
    meaning: '六字大明咒与三寂静祈愿文。',
  },
];

export const CustomDharaniCompiler: React.FC<CustomDharaniCompilerProps> = ({
  onSaveCustomEntry,
}) => {
  const [titleZh, setTitleZh] = useState('自定义梵文真言编译测试');
  const [inputText, setInputText] = useState(
    'oṃ āḥ vī ra hūṃ kha ca raḥ | gate gate pāragate pārasaṃgate bodhi svāhā'
  );
  const [meaningZh, setMeaningZh] = useState(
    '输入任意天城文、IAST 国际转写、SLP1 或英文谐音拼写，实时生成十维悉昙声韵图谱与 48kHz 神经语音。'
  );
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [savedBanner, setSavedBanner] = useState(false);

  const compiled = useMemo(() => analyzeSanskritText(inputText), [inputText]);

  const handleSpeakCompiled = async () => {
    await sanskritAudioEngine.speakText(compiled.deva || inputText, {
      title: titleZh,
      onSyllableHighlight: (idx) => setActiveIndex(idx),
      onPlaybackEnd: () => setActiveIndex(-1),
    });
  };

  const handleSaveToCorpus = () => {
    const newEntry: DharaniEntry = {
      id: `custom-${Date.now()}`,
      titleZh: titleZh.trim() || '未命名自定义陀罗尼',
      titleSanskrit: compiled.iast.slice(0, 48),
      titleDevanagari: compiled.deva.slice(0, 48),
      titleSiddham: compiled.siddham.slice(0, 24),
      category: 'custom',
      deityOrSubject: '用户自定义编译梵文真言',
      summaryZh: '由梵音宝典实时四体编译器生成并保存之自定义梵文陀罗尼条目。',
      benefitsZh: meaningZh,
      sourceMetadata: {
        taishoId: 'Custom-Compiler',
        cbetaXmlId: 'Custom',
        cbetaRawUrl: 'https://github.com/cbeta-org/xml-p5',
        translator: 'Sarva-Dhāraṇī-Kośa 实时编译器',
        dynasty: '现代校勘',
        sanskritEditionCitation: 'Compiled via Pāṇini/Śikṣā Prosodic Syllabifier v3.0',
        tangPhoneticNotes: ['自动标注 Guru (—) / Laghu (⏑) 诗律与随韵同化'],
        rawXmlExcerpt: `<p cb:type="dharani">${compiled.tradFull}</p>`,
      },
      verses: [
        {
          id: `custom-v-${Date.now()}`,
          verseNumber: 1,
          sectionTitle: titleZh,
          iast: compiled.iast,
          devanagari: compiled.deva,
          siddham: compiled.siddham,
          slp1: compiled.slp1,
          ipa: compiled.ipa,
          tangTranslit: compiled.tradFull,
          modernTranslit: compiled.modernFull,
          meaningZh,
        },
      ],
    };
    onSaveCustomEntry(newEntry);
    setSavedBanner(true);
    window.setTimeout(() => setSavedBanner(false), 3000);
  };

  let phoneticIdx = -1;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-700/40 bg-stone-900/90 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-4">
          <div>
            <h2 className="font-serif-cn text-xl font-bold text-amber-200">
              🛠️ 梵咒实时多体编译器 (Custom Dhāraṇī Compiler & 48kHz Neural Synthesizer)
            </h2>
            <p className="text-xs text-stone-400">
              支持自动识别天城文、IAST、SLP1 及无音标英文谐音，实时切分音节、计算 Guru/Laghu 轻重律并调用 48kHz 原生梵文模型发声。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESET_EXAMPLES.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setTitleZh(ex.title);
                  setInputText(ex.text);
                  setMeaningZh(ex.meaning);
                }}
                className="rounded-lg border border-stone-700 bg-stone-800 px-3 py-1.5 text-xs text-amber-200 hover:border-amber-500/50"
              >
                载入示例：{ex.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-stone-300">真言标题</label>
            <input
              type="text"
              value={titleZh}
              onChange={(e) => setTitleZh(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-xs text-stone-100"
            />

            <label className="mt-3 block text-xs font-medium text-stone-300">
              输入梵文咒语 (支持 IAST / 天城体 / SLP1 / 英文谐音混输)
            </label>
            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-700 bg-stone-950 p-3 font-mono text-sm text-amber-100 focus:border-amber-500 focus:outline-none"
            />

            <label className="mt-3 block text-xs font-medium text-stone-300">汉文意译或备注</label>
            <input
              type="text"
              value={meaningZh}
              onChange={(e) => setMeaningZh(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-xs text-stone-100"
            />

            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleSpeakCompiled}
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-stone-950 hover:bg-amber-400"
              >
                🔊 方案 1 (48kHz Neural TTS) 朗读编译结果
              </button>
              <button
                type="button"
                onClick={handleSaveToCorpus}
                className="rounded-xl border border-emerald-500/50 bg-emerald-950/60 px-4 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-900/60"
              >
                💾 保存至陀罗尼宝典库
              </button>
              {savedBanner && (
                <span className="self-center text-xs font-semibold text-emerald-400">
                  ✓ 已保存至「自定义编译真言」分类！
                </span>
              )}
            </div>
          </div>

          {/* Real-time Multi-Script Compiled Output */}
          <div className="space-y-2.5 rounded-xl border border-stone-800 bg-stone-950 p-4 text-xs">
            <div>
              <span className="text-amber-400">【悉昙梵字 Siddhaṃ】</span>
              <div className="mt-0.5 font-siddham text-2xl text-amber-200">
                {compiled.siddham || '—'}
              </div>
            </div>
            <div>
              <span className="text-orange-300">【天城体 Devanāgarī】</span>
              <div className="mt-0.5 font-deva text-lg text-orange-100">
                {compiled.deva || '—'}
              </div>
            </div>
            <div>
              <span className="text-emerald-300">【标准 IAST 转写】</span>
              <div className="mt-0.5 font-mono text-sm text-emerald-200">
                {compiled.iast || '—'}
              </div>
            </div>
            <div>
              <span className="text-sky-300">【SLP1 音素编码 & IPA】</span>
              <div className="mt-0.5 font-mono text-sky-200">
                {compiled.slp1} · [{compiled.ipa}]
              </div>
            </div>
            <div>
              <span className="text-cyan-300">【现代声学助读】</span>
              <div className="mt-0.5 text-sm text-cyan-100">{compiled.modernFull}</div>
            </div>
            <div>
              <span className="text-amber-300">【唐宋悉昙古音】</span>
              <div className="mt-0.5 font-serif-cn text-base text-amber-100">
                {compiled.tradFull}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Syllable Breakdown */}
        <div className="mt-5 border-t border-stone-800 pt-4">
          <div className="mb-2 text-xs text-stone-400">
            实时切分音节卡片 (共 {compiled.syllables.filter((s) => !s.isSymbol).length} 个音节 · Guru 重音:{' '}
            {compiled.guruCount} / Laghu 轻音: {compiled.laghuCount} · 点击任意卡片触发 48kHz 神经采样点读)：
          </div>
          <div className="flex flex-wrap gap-2">
            {compiled.syllables.map((tk) => {
              if (tk.isSymbol) {
                return (
                  <span key={tk.index} className="self-center px-2 text-lg text-stone-500">
                    {tk.deva}
                  </span>
                );
              }
              phoneticIdx++;
              const curIdx = phoneticIdx;
              const isHighlighted = activeIndex === curIdx;
              return (
                <button
                  key={tk.index}
                  type="button"
                  data-slp1={tk.slp1}
                  onClick={() => sanskritAudioEngine.playSyllable(tk.slp1)}
                  className={`flex min-w-[68px] flex-col items-center rounded-xl border px-2.5 py-2 text-center transition ${
                    isHighlighted
                      ? 'border-amber-400 bg-amber-500/25 scale-105'
                      : 'border-stone-800 bg-stone-950 hover:border-amber-500/50'
                  }`}
                >
                  <span className="text-[10px] font-bold text-amber-400">{tk.meter}</span>
                  <span className="font-siddham text-lg text-amber-200">{tk.siddham}</span>
                  <span className="font-deva text-sm font-bold text-stone-100">{tk.deva}</span>
                  <span className="font-mono text-xs text-emerald-300">{tk.iast}</span>
                  <span className="text-[11px] text-cyan-200">{tk.modern}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomDharaniCompiler;
