/**
 * Interactive 10-Layer Synchronized Verse & Syllable Block (`src/components/VerseBlock.tsx`)
 * Renders a single verse segment with all enabled display layers, clickable 48kHz neural
 * syllable cards, Guru/Laghu meter badges, and word-by-word Sanskrit grammatical glosses.
 */

import React, { useMemo, useState } from 'react';
import { analyzeSanskritText } from '../core/prosody';
import sanskritAudioEngine from '../services/audio/sanskritAudioEngine';
import { DisplayLayerConfig, SyllableToken, VerseSegment } from '../types/dharani';

interface VerseBlockProps {
  verse: VerseSegment;
  layers: DisplayLayerConfig;
  dharaniTitle: string;
}

export const VerseBlock: React.FC<VerseBlockProps> = ({
  verse,
  layers,
  dharaniTitle,
}) => {
  const [activeSylIndex, setActiveSylIndex] = useState<number>(-1);
  const [selectedSyllable, setSelectedSyllable] = useState<SyllableToken | null>(null);
  const [isRecitingVerse, setIsRecitingVerse] = useState(false);

  const analysis = useMemo(() => analyzeSanskritText(verse.iast), [verse.iast]);

  const handlePlayVerse = async () => {
    if (isRecitingVerse) {
      sanskritAudioEngine.stop();
      setIsRecitingVerse(false);
      setActiveSylIndex(-1);
      return;
    }
    setIsRecitingVerse(true);
    await sanskritAudioEngine.speakText(verse.devanagari || verse.iast, {
      title: `${dharaniTitle} · 第 ${verse.verseNumber} 段`,
      onSyllableHighlight: (idx) => {
        setActiveSylIndex(idx);
      },
      onPlaybackEnd: () => {
        setIsRecitingVerse(false);
        setActiveSylIndex(-1);
      },
    });
  };

  const handleClickSyllable = async (token: SyllableToken, phoneticIdx: number) => {
    if (token.isSymbol) return;
    setSelectedSyllable(token);
    setActiveSylIndex(phoneticIdx);
    await sanskritAudioEngine.playSyllable(token.slp1);
    window.setTimeout(() => {
      setActiveSylIndex((prev) => (prev === phoneticIdx ? -1 : prev));
    }, 380);
  };

  let phoneticCounter = -1;

  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-900/85 p-5 shadow-xl">
      {/* Verse Header & Neural Recitation Trigger */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-300 border border-amber-500/40">
            {verse.verseNumber}
          </span>
          <h3 className="font-serif-cn text-sm font-bold text-amber-200">
            {verse.sectionTitle || `第 ${verse.verseNumber} 颂`}
          </h3>
          {layers.chandasMeter && (
            <span className="rounded-md bg-stone-800 px-2 py-0.5 text-[11px] text-stone-300">
              重音 Guru (—): <strong className="text-amber-300">{analysis.guruCount}</strong> · 轻音 Laghu (⏑):{' '}
              <strong className="text-sky-300">{analysis.laghuCount}</strong>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handlePlayVerse}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
            isRecitingVerse
              ? 'bg-red-600 text-white shadow-lg'
              : 'bg-amber-500 text-stone-950 hover:bg-amber-400'
          }`}
        >
          <span>{isRecitingVerse ? '⏹ 停止本段吟诵' : '🔊 48kHz 原生梵文神经网络吟诵本段'}</span>
        </button>
      </div>

      {/* Multi-Script Full Lines (Layers 1–7) */}
      <div className="space-y-2.5 rounded-xl border border-stone-800/80 bg-stone-950/70 p-4">
        {layers.siddham && (
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
            <span className="w-28 shrink-0 text-[11px] font-medium text-amber-400/90">
              【悉昙梵字】
            </span>
            <p className="font-siddham text-2xl leading-relaxed tracking-wider text-amber-200">
              {verse.siddham || analysis.siddham}
            </p>
          </div>
        )}

        {layers.devanagari && (
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
            <span className="w-28 shrink-0 text-[11px] font-medium text-orange-300/90">
              【天城体梵文】
            </span>
            <p className="font-deva text-xl leading-relaxed text-orange-100">
              {verse.devanagari || analysis.deva}
            </p>
          </div>
        )}

        {layers.iast && (
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
            <span className="w-28 shrink-0 text-[11px] font-medium text-emerald-300/90">
              【IAST 国际转写】
            </span>
            <p className="font-mono text-sm font-medium leading-relaxed text-emerald-200">
              {verse.iast}
            </p>
          </div>
        )}

        {layers.slp1 && (
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
            <span className="w-28 shrink-0 text-[11px] font-medium text-sky-300/90">
              【SLP1 音素编码】
            </span>
            <p className="font-mono text-xs leading-relaxed text-sky-200">
              {verse.slp1 || analysis.slp1}
            </p>
          </div>
        )}

        {layers.ipa && (
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
            <span className="w-28 shrink-0 text-[11px] font-medium text-purple-300/90">
              【IPA 国际音标】
            </span>
            <p className="font-mono text-xs leading-relaxed text-purple-200">
              [{verse.ipa || analysis.ipa}]
            </p>
          </div>
        )}

        {layers.modernChinese && (
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
            <span className="w-28 shrink-0 text-[11px] font-medium text-cyan-300/90">
              【现代声学助读】
            </span>
            <p className="text-sm leading-relaxed text-cyan-100">
              {verse.modernTranslit || analysis.modernFull}
            </p>
          </div>
        )}

        {layers.tangSiddham && (
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
            <span className="w-28 shrink-0 text-[11px] font-medium text-amber-300">
              【唐宋古音译】
            </span>
            <p className="font-serif-cn text-base leading-relaxed text-amber-100">
              {verse.tangTranslit}
            </p>
          </div>
        )}
      </div>

      {/* Interactive 48kHz Neural VITS Syllable Breakdown Cards */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs text-stone-400">
          <span>
            👇 点击任意音节卡片即刻触发 <strong className="text-emerald-300">方案 1 (IIT Madras 48kHz 梵文神经网络引擎)</strong> 真人级发音：
          </span>
          {selectedSyllable && (
            <span className="text-amber-300">
              当前选中：{selectedSyllable.deva} ({selectedSyllable.iast}) · {selectedSyllable.vargaNote}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {analysis.syllables.map((token) => {
            if (token.isSymbol) {
              return (
                <div
                  key={token.index}
                  className="flex items-center justify-center px-2 text-lg font-bold text-stone-500"
                >
                  {token.deva}
                </div>
              );
            }
            phoneticCounter++;
            const currentPhoneticIdx = phoneticCounter;
            const isHighlighted = activeSylIndex === currentPhoneticIdx;
            return (
              <button
                key={token.index}
                type="button"
                data-slp1={token.slp1}
                onClick={() => handleClickSyllable(token, currentPhoneticIdx)}
                className={`group flex min-w-[72px] flex-col items-center rounded-xl border px-2.5 py-2 text-center transition-all ${
                  isHighlighted
                    ? 'syllable-active-glow border-amber-400 bg-amber-500/25 scale-105'
                    : 'border-stone-800 bg-stone-950/90 hover:border-amber-500/50 hover:bg-stone-900'
                }`}
              >
                {layers.chandasMeter && (
                  <span
                    className={`mb-0.5 text-[10px] font-bold ${
                      token.meter === '—' ? 'text-amber-400' : 'text-sky-400'
                    }`}
                  >
                    {token.meter === '—' ? '— Guru(2拍)' : '⏑ Laghu(1拍)'}
                  </span>
                )}
                {layers.siddham && (
                  <span className="font-siddham text-lg text-amber-200">{token.siddham}</span>
                )}
                {layers.devanagari && (
                  <span className="font-deva text-base font-semibold text-stone-100">
                    {token.deva}
                  </span>
                )}
                <span className="font-mono text-xs font-semibold text-emerald-300">
                  {token.iast}
                </span>
                {layers.modernChinese && (
                  <span className="mt-0.5 text-[11px] text-cyan-200">{token.modern}</span>
                )}
                {layers.tangSiddham && (
                  <span className="text-[10px] text-stone-400">{token.trad}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Layer 9: Word-by-Word Grammatical & Lexicon Gloss */}
      {layers.wordGloss && verse.words && verse.words.length > 0 && (
        <div className="mt-4 rounded-xl border border-stone-800 bg-stone-950/60 p-3.5">
          <h4 className="mb-2 text-xs font-semibold text-amber-300">
            【逐词梵文声明学词根与八格语法解析】
          </h4>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {verse.words.map((w, i) => (
              <div
                key={i}
                className="rounded-lg border border-stone-800/80 bg-stone-900/70 p-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-emerald-300">{w.iast}</span>
                  <span className="font-deva text-sm text-amber-200">{w.deva}</span>
                </div>
                <div className="mt-1 text-[11px] text-stone-400">{w.grammar}</div>
                <div className="mt-1 font-medium text-stone-200">{w.meaningZh}</div>
                {w.tangTranslit && (
                  <div className="mt-0.5 text-[10px] text-amber-400/80">
                    古音译：{w.tangTranslit}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Layer 10: Chinese & English Meaning + Tang Phonetic Notes */}
      {layers.chineseMeaning && (
        <div className="mt-4 rounded-xl border border-amber-900/30 bg-amber-950/15 p-3.5">
          <div className="text-xs font-semibold text-amber-300">【经文意译与义理】</div>
          <p className="mt-1 text-sm leading-relaxed text-stone-200">{verse.meaningZh}</p>
          {verse.meaningEn && (
            <p className="mt-1 text-xs italic text-stone-400">{verse.meaningEn}</p>
          )}
          {verse.tangNotes && verse.tangNotes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {verse.tangNotes.map((note, idx) => (
                <span
                  key={idx}
                  className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-200"
                >
                  📌 {note}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default VerseBlock;
