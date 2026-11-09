/**
 * Sanskrit Phonetics & Siddhaṃ 34×14 Matrix Academy (`src/components/SanskritPhoneticsAcademy.tsx`)
 * Complete interactive classroom featuring:
 * 1. 16 Standalone Svaras (摩多韵母: 14 Vowels a..au + aṃ 空点 + aḥ 涅槃点)
 * 2. Complete 34×14 Siddhaṃ Consonant-Vowel Matrix (476 CV cells + 34 bare Virāma cells = 510 consonant cells)
 * 3. 28 Sacred Bīja Seed Syllables & Special Conjuncts (`SYLLABLE_OVERRIDES`)
 * Every cell carries `data-slp1="..."` and triggers 48,000 Hz neural audio from Plan 1 (`Ninada VITS`)!
 */

import React, { useState } from 'react';
import {
  CANONICAL_14_VOWELS,
  CANONICAL_16_SVARAS,
  CANONICAL_34_CONSONANT_KEYS,
  CONS_MATRIX,
  SYLLABLE_OVERRIDES,
  slp1ToDevanagari,
  slp1ToIast,
  slp1ToSiddham,
} from '../core/transliterator';
import sanskritAudioEngine from '../services/audio/sanskritAudioEngine';

export const SanskritPhoneticsAcademy: React.FC = () => {
  const [activeKey, setActiveKey] = useState<string>('ka');
  const [lastPlayInfo, setLastPlayInfo] = useState<string>(
    '点击下方任意悉昙摩多、34×14 体文矩阵单元格或种子字，即刻体验方案 1 (48kHz VITS 神经引擎) 真人级发音'
  );
  const [selectedVargaFilter, setSelectedVargaFilter] = useState<string>('ALL');

  const handlePlayCell = async (slp1Key: string, labelDesc: string) => {
    setActiveKey(slp1Key);
    const res = await sanskritAudioEngine.playSyllable(slp1Key);
    setLastPlayInfo(
      `已播放 [${slp1ToDevanagari(slp1Key)} / ${slp1ToIast(slp1Key)} / SLP1:${slp1Key}] · 引擎: ${res.source} (${res.sampleRate}Hz, ${(res.durationSec * 1000).toFixed(0)}ms) · ${labelDesc}`
    );
  };

  const vargaGroups = [
    'ALL',
    '喉音 (Ka-varga)',
    '颚音 (Ca-varga)',
    '卷舌音 (Ṭa-varga)',
    '齿音 (Ta-varga)',
    '唇音 (Pa-varga)',
    '半元音 (Antaḥstha)',
    '擦音 (Ūṣman)',
    '气音 (Ūṣman)',
    '吠陀音 (Vedic)',
  ];

  const visibleConsonants = CANONICAL_34_CONSONANT_KEYS.filter((cKey) => {
    if (selectedVargaFilter === 'ALL') return true;
    return CONS_MATRIX[cKey].varga === selectedVargaFilter;
  });

  return (
    <div className="space-y-6">
      {/* Academy Banner & Live Acoustic Inspector */}
      <div className="rounded-2xl border border-amber-700/40 bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/30 p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="rounded-full border border-emerald-500/40 bg-emerald-950/70 px-3 py-0.5 text-xs font-semibold text-emerald-300">
              方案 1：IIT Madras 48,000 Hz 悉昙五十音 & 34×14 音素全矩阵原生梵文神经网络引擎
            </span>
            <h2 className="mt-2 font-serif-cn text-2xl font-bold text-amber-100">
              悉昙声韵学院 · 16 摩多韵母 × 34 体文声母 × 14 韵母全矩阵 (510 格) + 28 神圣种子字
            </h2>
            <p className="mt-1 text-xs text-stone-300">
              彻底告别浏览器 `hi-IN` 吞音与 `136.1Hz` 锯齿波电子蜂鸣器！本院全部单元格统一绑定方案 1 (IIT Madras 古典梵文 VITS 48kHz 神经语音合成引擎 + 内存 AudioBuffer 缓存)。
            </p>
          </div>
          <div className="rounded-xl border border-amber-500/40 bg-stone-950/90 px-4 py-3 text-xs text-amber-200 shadow-inner">
            🔊 {lastPlayInfo}
          </div>
        </div>
      </div>

      {/* Section 1: 16 Standalone Svaras (悉昙十六摩多韵母) */}
      <section className="rounded-2xl border border-stone-800 bg-stone-900/85 p-5 shadow-xl">
        <h3 className="mb-3 font-serif-cn text-base font-bold text-amber-200">
          一、悉昙十六摩多独立元音表 (16 Svaras · 含空点 Anusvāra `aṃ` 与涅槃点 Visarga `aḥ`)
        </h3>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:grid-cols-8">
          {CANONICAL_16_SVARAS.map((v) => {
            const isSelected = activeKey === v.slp1;
            return (
              <button
                key={v.slp1}
                type="button"
                data-slp1={v.slp1}
                onClick={() => handlePlayCell(v.slp1, v.note)}
                className={`flex flex-col items-center rounded-xl border p-3 text-center transition ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/20 shadow-md'
                    : 'border-stone-800 bg-stone-950/85 hover:border-amber-500/50 hover:bg-stone-900'
                }`}
              >
                <span
                  className={`text-[10px] font-bold ${
                    v.isLong ? 'text-amber-400' : 'text-sky-400'
                  }`}
                >
                  {v.isLong ? '— Guru(2拍)' : '⏑ Laghu(1拍)'}
                </span>
                <span className="my-1 font-siddham text-2xl text-amber-200">{v.siddhamIndep}</span>
                <span className="font-deva text-lg font-bold text-stone-100">{v.devaIndep}</span>
                <span className="font-mono text-xs font-semibold text-emerald-300">
                  {v.iast} [{v.ipa}]
                </span>
                <span className="mt-1 text-xs text-cyan-200">{v.modern}</span>
                <span className="text-[10px] text-stone-400">唐音: {v.trad}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Section 2: 28 Sacred Bīja Seed Syllables & Special Conjuncts (SYLLABLE_OVERRIDES) */}
      <section className="rounded-2xl border border-stone-800 bg-stone-900/85 p-5 shadow-xl">
        <h3 className="mb-3 font-serif-cn text-base font-bold text-amber-200">
          二、二十八大陀罗尼神圣种子字与特殊二合音 (`SYLLABLE_OVERRIDES` · 含 `jñā` `[dʑɲɑː]` 与 `kṣa` `[kʂɐ]`)
        </h3>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:grid-cols-7">
          {Object.values(SYLLABLE_OVERRIDES).map((ov) => {
            const isSelected = activeKey === ov.slp1;
            return (
              <button
                key={ov.slp1}
                type="button"
                data-slp1={ov.slp1}
                onClick={() => handlePlayCell(ov.slp1, ov.note)}
                className={`flex flex-col items-center rounded-xl border p-2.5 text-center transition ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/20'
                    : 'border-stone-800 bg-stone-950/85 hover:border-amber-500/50'
                }`}
              >
                <span className="text-[10px] font-mono text-amber-400">
                  {ov.meter} · SLP1:{ov.slp1}
                </span>
                <span className="my-0.5 font-siddham text-xl text-amber-200">{ov.siddham}</span>
                <span className="font-deva text-base font-bold text-stone-100">{ov.deva}</span>
                <span className="font-mono text-xs text-emerald-300">
                  {ov.iast} [{ov.ipa}]
                </span>
                <span className="mt-0.5 text-xs text-cyan-200">{ov.m}</span>
                <span className="text-[10px] text-amber-300/80">古译: {ov.t}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Section 3: Full 34 × 14 Siddhaṃ Consonant-Vowel Matrix + Bare Virāma Column */}
      <section className="rounded-2xl border border-stone-800 bg-stone-900/85 p-5 shadow-xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-serif-cn text-base font-bold text-amber-200">
              三、34 体文声母 × 14 摩多韵母全展开矩阵 (476 CV 音节 + 34 纯辅音 Virāma `C्` = 510 格全覆盖)
            </h3>
            <p className="text-xs text-stone-400">
              每一格均支持 48kHz 0延迟点击试听，清晰对比「清不送气 / 清送气 / 浊不送气 / 浊送气 / 鼻音」五类发音部位与长短元音对比。
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {vargaGroups.map((vg) => (
              <button
                key={vg}
                type="button"
                onClick={() => setSelectedVargaFilter(vg)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  selectedVargaFilter === vg
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                {vg === 'ALL' ? '全部 34 声母' : vg}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-stone-800">
          <table className="w-full border-collapse text-center text-xs">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-950 text-stone-300">
                <th className="sticky left-0 z-10 bg-stone-950 px-3 py-2.5 text-left">
                  声母 / 部位
                </th>
                <th className="px-2 py-2.5 text-amber-300">
                  纯辅音 `C्`
                  <div className="text-[10px] font-normal text-stone-400">Virāma 爆破</div>
                </th>
                {CANONICAL_14_VOWELS.map((v) => (
                  <th key={v.slp1} className="px-2 py-2.5">
                    <div className="font-mono text-emerald-300">+{v.iast}</div>
                    <div className="font-deva text-[11px] text-amber-200">
                      {v.devaMatra || 'अ'}
                    </div>
                    <div className="text-[10px] text-stone-400">
                      {v.isLong ? '— 2拍' : '⏑ 1拍'}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/70">
              {visibleConsonants.map((cKey) => {
                const row = CONS_MATRIX[cKey];
                return (
                  <tr key={cKey} className="hover:bg-stone-800/30">
                    {/* Row Header */}
                    <td className="sticky left-0 z-10 border-r border-stone-800 bg-stone-950/95 px-3 py-2 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-siddham text-lg text-amber-300">{row.siddham}</span>
                        <span className="font-deva text-sm font-bold text-stone-100">
                          {row.deva}
                        </span>
                        <span className="font-mono text-xs font-bold text-emerald-300">
                          {row.iast} [{row.ipa}]
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {row.varga} · {row.phonation}
                      </div>
                    </td>

                    {/* Bare Virāma Cell */}
                    <td className="p-1">
                      <button
                        type="button"
                        data-slp1={cKey}
                        onClick={() =>
                          handlePlayCell(cKey, `${row.note} · 纯辅音去元音爆破 (${row.deva}्)`)
                        }
                        className={`flex w-full flex-col items-center rounded-lg border px-2 py-1.5 transition ${
                          activeKey === cKey
                            ? 'border-amber-400 bg-amber-500/25'
                            : 'border-stone-800 bg-stone-950/80 hover:border-amber-500/50'
                        }`}
                      >
                        <span className="font-deva text-xs font-bold text-amber-200">
                          {row.deva}्
                        </span>
                        <span className="font-mono text-[10px] text-stone-300">{row.iast}</span>
                        <span className="text-[10px] text-cyan-300">({row.bare[0]})</span>
                      </button>
                    </td>

                    {/* 14 CV Cells */}
                    {CANONICAL_14_VOWELS.map((v) => {
                      const cvSlp1 = `${cKey}${v.slp1}`;
                      const cvDeva = slp1ToDevanagari(cvSlp1);
                      const cvSiddham = slp1ToSiddham(cvSlp1);
                      const cvIast = slp1ToIast(cvSlp1);
                      const mText =
                        row.m[v.vowelGroupIndex] + (v.inherentLongMark ? '～' : '');
                      const tText = row.t[v.vowelGroupIndex];
                      const isActive = activeKey === cvSlp1;

                      return (
                        <td key={cvSlp1} className="p-1">
                          <button
                            type="button"
                            data-slp1={cvSlp1}
                            onClick={() =>
                              handlePlayCell(
                                cvSlp1,
                                `${row.varga} ${row.phonation} · ${cvDeva} (${cvIast}) · 现代:${mText} / 唐音:${tText}`
                              )
                            }
                            className={`flex w-full min-w-[58px] flex-col items-center rounded-lg border px-1.5 py-1.5 transition ${
                              isActive
                                ? 'border-amber-400 bg-amber-500/25 scale-105'
                                : 'border-stone-800/80 bg-stone-950/70 hover:border-amber-500/50 hover:bg-stone-900'
                            }`}
                          >
                            <span className="font-siddham text-sm text-amber-200/90">
                              {cvSiddham}
                            </span>
                            <span className="font-deva text-xs font-semibold text-stone-100">
                              {cvDeva}
                            </span>
                            <span className="font-mono text-[10px] text-emerald-300">
                              {cvIast}
                            </span>
                            <span className="text-[10px] text-cyan-200">{mText}</span>
                            <span className="text-[9px] text-stone-400">{tText}</span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default SanskritPhoneticsAcademy;
