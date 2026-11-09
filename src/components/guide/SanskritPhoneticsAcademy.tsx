import React, { useState } from 'react';
import {
  SIDDHAM_FIFTY_LETTERS,
  CONS_MATRIX,
  slp1ToIast,
  slp1ToDevanagari,
  slp1ToSiddham,
  slp1ToIpa
} from '../../core/transliterator';
import { sanskritAudioEngine } from '../../services/sanskritAudioEngine';

const MATRIX_VOWELS = [
  { slp: 'a', iast: 'a', label: 'a 短' },
  { slp: 'A', iast: 'ā', label: 'ā 长' },
  { slp: 'i', iast: 'i', label: 'i 短' },
  { slp: 'I', iast: 'ī', label: 'ī 长' },
  { slp: 'u', iast: 'u', label: 'u 短' },
  { slp: 'U', iast: 'ū', label: 'ū 长' },
  { slp: 'f', iast: 'ṛ', label: 'ṛ 卷舌' },
  { slp: 'F', iast: 'ṝ', label: 'ṝ 长' },
  { slp: 'x', iast: 'ḷ', label: 'ḷ 边音' },
  { slp: 'X', iast: 'ḹ', label: 'ḹ 长' },
  { slp: 'e', iast: 'e', label: 'e 合音' },
  { slp: 'E', iast: 'ai', label: 'ai 复' },
  { slp: 'o', iast: 'o', label: 'o 合音' },
  { slp: 'O', iast: 'au', label: 'au 复' }
] as const;

const VOWEL_COL_IDX: Record<string, number> = {
  a: 0, A: 0, i: 1, I: 1, u: 2, U: 2, f: 3, F: 3, x: 3, X: 3, e: 4, E: 5, o: 6, O: 7
};

export const SanskritPhoneticsAcademy: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fifty' | 'matrix' | 'rules'>('fifty');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const consKeys = Object.keys(CONS_MATRIX);
  const [selectedConsSlp, setSelectedConsSlp] = useState<string>(consKeys[0] || 'k');

  const groups = ['all', ...Array.from(new Set(SIDDHAM_FIFTY_LETTERS.map(l => l.group)))];
  const filteredLetters =
    groupFilter === 'all'
      ? SIDDHAM_FIFTY_LETTERS
      : SIDDHAM_FIFTY_LETTERS.filter(l => l.group === groupFilter);

  const activeCons = CONS_MATRIX[selectedConsSlp] || CONS_MATRIX['k'];

  return (
    <div className="sdk-academy">
      <div className="sdk-academy-hero">
        <div>
          <span className="sdk-badge sdk-badge-gold">
            悉昙五十字母 · 梵音 100% 全覆盖音译与发声引擎 v2.0
          </span>
          <h2 className="sdk-section-title">
            梵文悉昙五十字母与声明学正音学院 (Siddhaṃ &amp; Phonetics Academy)
          </h2>
          <p className="sdk-section-desc">
            融合唐代智广《悉昙字记》、空海《梵字悉昙字母并释义》与现代国际梵语学（IAST / IPA），内置
            <strong> 14 摩多（元音）+ 34 体文（辅音）= 476 音节全排列双轨矩阵</strong>。
            点击任意字格即可触发 136.1Hz 梵音共振峰合成器与原生梵语语音发声。
          </p>
        </div>
        <div className="sdk-academy-hero-actions">
          <a
            href="/sanskrit_phonetic_engine.html"
            target="_blank"
            rel="noopener noreferrer"
            className="sdk-btn sdk-btn-primary"
          >
            🚀 独立全屏打开《梵音 100% 全覆盖音译与发声引擎 v2.0》 ↗
          </a>
        </div>
      </div>

      <div className="sdk-academy-tabs">
        <button
          type="button"
          className={`sdk-tab-btn ${activeTab === 'fifty' ? 'active' : ''}`}
          onClick={() => setActiveTab('fifty')}
        >
          ① 悉昙五十字母字门与密义 ({SIDDHAM_FIFTY_LETTERS.length} 字母)
        </button>
        <button
          type="button"
          className={`sdk-tab-btn ${activeTab === 'matrix' ? 'active' : ''}`}
          onClick={() => setActiveTab('matrix')}
        >
          ② 34×14 摩多体文全拼读双轨矩阵 (476 音节)
        </button>
        <button
          type="button"
          className={`sdk-tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          ③ 梵文拼读黄金铁律与唐密古音考
        </button>
      </div>

      {activeTab === 'fifty' && (
        <div className="sdk-academy-panel">
          <div className="sdk-consonant-selector">
            {groups.map(g => (
              <button
                key={g}
                type="button"
                className={`sdk-chip ${groupFilter === g ? 'active' : ''}`}
                onClick={() => setGroupFilter(g)}
              >
                {g === 'all' ? '全部悉昙五十字母' : g}
              </button>
            ))}
          </div>

          <div className="sdk-phoneme-grid">
            {filteredLetters.map(letter => (
              <button
                key={letter.iast}
                type="button"
                className="sdk-phoneme-card"
                onClick={() =>
                  sanskritAudioEngine.playSingleSyllableIast(letter.iast, 'auto', 0.8)
                }
              >
                <div className="sdk-phoneme-group-tag">{letter.group}</div>
                <div className="sdk-phoneme-scripts">
                  <span className="sdk-phoneme-siddham siddham-text">{letter.siddham}</span>
                  <span className="sdk-phoneme-deva deva-text">{letter.devanagari}</span>
                </div>
                <div className="sdk-phoneme-iast">{letter.iast}</div>
                <div className="sdk-phoneme-ipa">/{letter.ipa}/ · {letter.placeZh}</div>
                <div className="sdk-phoneme-tracks">
                  <span className="sdk-track-badge sdk-track-easy">
                    直拼：{letter.modernPhonetic}
                  </span>
                  <span className="sdk-track-badge sdk-track-trad">
                    唐密：{letter.tangChar}
                  </span>
                </div>
                <p className="sdk-phoneme-tip">{letter.esotericMeaningZh}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'matrix' && (
        <div className="sdk-academy-panel">
          <h3>34 体文 × 14 摩多 全拼读双轨矩阵（共 476 音节）</h3>
          <p className="sdk-muted">
            选择下方任意体文（辅音），立即展开其与 14 个元音摩多的完整拼读卡片（悉昙体 + 天城体 + IAST + 现代直拼 + 唐密古音），点击即发声：
          </p>

          <div className="sdk-consonant-selector">
            {consKeys.map(slpKey => {
              const cIast = slp1ToIast(slpKey + 'a');
              const cDeva = slp1ToDevanagari(slpKey + 'a');
              const cEntry = CONS_MATRIX[slpKey];
              return (
                <button
                  key={slpKey}
                  type="button"
                  className={`sdk-chip ${selectedConsSlp === slpKey ? 'active' : ''}`}
                  onClick={() => setSelectedConsSlp(slpKey)}
                >
                  {cDeva} {cIast} ({cEntry.t[0]})
                </button>
              );
            })}
          </div>

          <div className="sdk-matrix-banner">
            <strong>当前体文：</strong> {slp1ToDevanagari(selectedConsSlp + 'a')} (
            {slp1ToIast(selectedConsSlp + 'a')}) — {activeCons.varga} · {activeCons.note} ·
            纯收音：直拼「{activeCons.bare[0]}」/ 古音「{activeCons.bare[1]}」
          </div>

          <div className="sdk-phoneme-grid">
            {MATRIX_VOWELS.map(v => {
              const sylSlp = selectedConsSlp + v.slp;
              const sylIast = slp1ToIast(sylSlp);
              const sylDeva = slp1ToDevanagari(sylSlp);
              const sylSiddham = slp1ToSiddham(sylSlp);
              const sylIpa = slp1ToIpa(sylSlp);
              const colIdx = VOWEL_COL_IDX[v.slp] ?? 0;
              const isLong = ['A', 'I', 'U', 'F', 'X'].includes(v.slp);
              const easy = activeCons.m[colIdx] + (isLong ? '～' : '');
              const trad = activeCons.t[colIdx] + (isLong ? '(引)' : '');

              return (
                <button
                  key={sylSlp}
                  type="button"
                  className="sdk-phoneme-card"
                  onClick={() =>
                    sanskritAudioEngine.playSingleSyllableIast(sylSlp, 'auto', 0.8, true)
                  }
                >
                  <div className="sdk-phoneme-scripts">
                    <span className="sdk-phoneme-siddham siddham-text">{sylSiddham}</span>
                    <span className="sdk-phoneme-deva deva-text">{sylDeva}</span>
                  </div>
                  <div className="sdk-phoneme-iast">{sylIast}</div>
                  <div className="sdk-phoneme-ipa">
                    {sylIpa} · {v.label}
                  </div>
                  <div className="sdk-phoneme-tracks">
                    <span className="sdk-track-badge sdk-track-easy">直拼：{easy}</span>
                    <span className="sdk-track-badge sdk-track-trad">古音：{trad}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="sdk-academy-panel sdk-rules-grid">
          <div className="sdk-rule-card">
            <h4>规则一：自带默认元音 a 与去元音符号 Virāma (्)</h4>
            <p>
              每一个梵文辅音字母本身默认自带短元音 <code>a</code>（如 <code>क = ka</code>，而非单纯的 <code>k</code>）。
              当两个辅音相连形成复辅音（如 <code>svāhā</code> 中的 <code>sv</code>，或 <code>prajñā</code> 中的 <code>pr</code>），
              前一个辅音下方加去元音符号 <code>्</code>（Virāma），唐代音译标注为「二合」。
            </p>
          </div>
          <div className="sdk-rule-card">
            <h4>规则二：送气音（Mahāprāṇa）与不送气音（Alpaprāṇa）</h4>
            <p>
              梵文辅音严格区分不送气与送气：<code>k / kh</code>、<code>g / gh</code>、<code>c / ch</code>、
              <code>j / jh</code>、<code>t / th</code>、<code>d / dh</code>、<code>p / ph</code>、<code>b / bh</code>。
              注意：<code>ph</code> 读作送气双唇音「坡 [pʰ]」（绝非英语的 [f]）；<code>th</code> 读作「托 [tʰ]」（绝非英语咬舌音 [θ]）；
              浊送气音 <code>bh / dh / gh</code> 带胸腔共鸣气声（如 <code>bhagavate</code> 读作「婆伽伐帝」）。
            </p>
          </div>
          <div className="sdk-rule-card">
            <h4>规则三：古汉译音变（为何 svāhā 译作「娑婆诃」、vajra 译作「跋折罗」？）</h4>
            <p>
              唐宋以前汉语音韵无现代普通话的轻唇音 [f]，唐代「婆 (bʰuɑ)」、「伐 (bʰĭwɐt)」皆读双唇或重唇音，
              用来对译梵文唇齿近音 <code>v [ʋ]</code>。故 <code>svāhā</code> 唐译「娑婆诃 / 萨缚贺」，梵音本读为
              <code>[sʋɑːɦɑː]（斯哇哈）</code>；<code>ava-lokiteśvara</code> 唐译「阿缚卢枳低湿伐罗」，梵音读
              <code>[ɐʋɐloːkɪteːɕʋɐrɐ]</code>。
            </p>
          </div>
          <div className="sdk-rule-card">
            <h4>规则四：轻重音律（Guru 重音节 vs. Laghu 轻音节）</h4>
            <p>
              梵文陀罗尼持诵极具音乐韵律：凡含长元音（<code>ā, ī, ū, ṝ, e, ai, o, au</code>）、
              随韵（<code>ṃ</code>）、止韵（<code>ḥ</code>）或后接复辅音的音节皆为<strong>重音节（Guru —）</strong>，
              拍长约为<strong>轻音节（Laghu ⌣）</strong>的两倍（2 Mātrās）。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
