import React, { useMemo } from 'react';
import type { DharaniVerse, SyllableAnalysis } from '../../types/dharani';
import type { DisplayLayerSettings } from '../../services/storageService';
import { analyzeSanskritLine } from '../../core/prosody';

interface VerseBlockProps {
  verse: DharaniVerse;
  layers: DisplayLayerSettings;
  isActiveVerse: boolean;
  activeSyllableIdx: number;
  onPlayVerse: (verse: DharaniVerse, syllables: SyllableAnalysis[]) => void;
  onPlaySingleSyllable: (syllable: SyllableAnalysis) => void;
}

export const VerseBlock: React.FC<VerseBlockProps> = ({
  verse,
  layers,
  isActiveVerse,
  activeSyllableIdx,
  onPlayVerse,
  onPlaySingleSyllable
}) => {
  // 通过三遍式音节切分器与轻重格律引擎实时计算本节的音节矩阵
  const analyzed = useMemo(
    () => analyzeSanskritLine(verse.iast, { mode: 'strict', longMarkSymbol: '～' }),
    [verse.iast]
  );

  const allSyllables = useMemo(
    () => analyzed.words.flatMap((w) => w.syllables),
    [analyzed]
  );

  const meterPattern = useMemo(
    () => allSyllables.map((s) => s.meterSymbol || (s.weight === 'Guru' ? '—' : '⏑')).join(' '),
    [allSyllables]
  );

  return (
    <article className={`sdk-verse-card ${isActiveVerse ? 'sdk-verse-active' : ''}`}>
      {/* 顶部小节栏与单句播放按钮 */}
      <div className="sdk-verse-header">
        <div className="sdk-verse-title-group">
          <span className="sdk-verse-num">第 {verse.verseNumber} 节</span>
          {verse.sectionTitle && <span className="sdk-verse-tag">{verse.sectionTitle}</span>}
          {layers.showProsodyMeter && meterPattern && (
            <span className="sdk-meter-summary" title="梵文诗律轻重格 (— Guru重音2摩罗 / ⏑ Laghu轻音1摩罗)">
              音律: {meterPattern}
            </span>
          )}
        </div>

        <div className="sdk-verse-actions">
          {verse.tangPhoneticNotes && verse.tangPhoneticNotes.length > 0 && (
            <div className="sdk-tang-notes-badges">
              {verse.tangPhoneticNotes.map((n, idx) => (
                <span key={idx} className="sdk-tang-note-pill" title="CBETA 原典唐代梵音注记">
                  {n}
                </span>
              ))}
            </div>
          )}
          <button
            type="button"
            className={`sdk-verse-play-btn ${isActiveVerse ? 'playing' : ''}`}
            onClick={() => onPlayVerse(verse, allSyllables)}
            title="使用 48kHz 原生梵文神经 VITS / 136.1Hz 共振峰吟诵本句，并实时高亮音节"
          >
            {isActiveVerse ? '🔊 吟诵中...' : '▶ 梵音精读本节'}
          </button>
        </div>
      </div>

      {/* 多体文字核心展示区 */}
      <div className="sdk-verse-layers">
        {/* 1. 悉昙梵字 (Siddhaṃ Unicode) */}
        {layers.showSiddham && (
          <div className="sdk-layer-row sdk-layer-siddham">
            <span className="sdk-layer-label">悉昙梵字</span>
            <div className="sdk-siddham-line" lang="sa-Sidd">
              {verse.siddham || analyzed.siddhamUnicode}
            </div>
          </div>
        )}

        {/* 2. 天城体梵文 (Devanāgarī) */}
        {layers.showDevanagari && (
          <div className="sdk-layer-row sdk-layer-devanagari">
            <span className="sdk-layer-label">天城体梵文</span>
            <div className="sdk-devanagari-line" lang="sa-Deva">
              {verse.devanagari || analyzed.devanagari}
            </div>
          </div>
        )}

        {/* 3. IAST 国际梵文转写 */}
        {layers.showIast && (
          <div className="sdk-layer-row sdk-layer-iast">
            <span className="sdk-layer-label">IAST 转写</span>
            <div className="sdk-iast-line">{verse.iast}</div>
          </div>
        )}

        {/* 4. 逐音节交互式声学矩阵（点击任意音节单独发声 + 显示轻重律与发音部位） */}
        {layers.showProsodyMeter && allSyllables.length > 0 && (
          <div className="sdk-syllable-matrix-wrap">
            <div className="sdk-syllable-matrix-title">
              <span>🎵 逐音节声学切分与轻重律矩阵（点击任意音节试听 48kHz VITS / 136.1Hz 梵音）</span>
            </div>
            <div className="sdk-syllable-strip">
              {allSyllables.map((syl, sIdx) => {
                const isHighlighted = isActiveVerse && activeSyllableIdx === sIdx;
                const meterSym = syl.meterSymbol || (syl.weight === 'Guru' ? '—' : '⏑');
                return (
                  <button
                    key={`${verse.verseNumber}-syl-${sIdx}`}
                    type="button"
                    className={`sdk-syl-chip ${isHighlighted ? 'active' : ''} ${
                      syl.weight === 'Guru' ? 'guru' : 'laghu'
                    }`}
                    onClick={() => onPlaySingleSyllable(syl)}
                    title={`${syl.varga || '梵音'} · ${syl.acousticNote || ''} · 点击发声`}
                  >
                    <span className="syl-meter-tag">
                      {meterSym} {syl.weight === 'Guru' ? '重(2拍)' : '轻(1拍)'}
                    </span>
                    <span className="syl-siddham" lang="sa-Sidd">
                      {syl.siddhamUnicode}
                    </span>
                    <span className="syl-deva" lang="sa-Deva">
                      {syl.devanagari}
                    </span>
                    <span className="syl-iast">{syl.rawIast}</span>
                    <span className="syl-ipa">[{syl.ipa}]</span>
                    <span className="syl-tang">{syl.tangReconstruction}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. IPA 国际音标 */}
        {layers.showIpa && (
          <div className="sdk-layer-row sdk-layer-ipa">
            <span className="sdk-layer-label">IPA 国际音标</span>
            <div className="sdk-ipa-line">/{verse.ipa}/</div>
          </div>
        )}

        {/* 6. 唐宋古汉语音译（玄奘/不空体） */}
        {layers.showTangTranslit && (
          <div className="sdk-layer-row sdk-layer-tang">
            <span className="sdk-layer-label">唐宋古音译</span>
            <div className="sdk-tang-line">{verse.tangChinese}</div>
          </div>
        )}

        {/* 7. 现代梵音助读 */}
        {layers.showModernPhonetic && (
          <div className="sdk-layer-row sdk-layer-modern">
            <span className="sdk-layer-label">现代梵音助读</span>
            <div className="sdk-modern-phonetic-line">{verse.modernApprox}</div>
          </div>
        )}

        {/* 8. 汉语意译 */}
        {layers.showMeaningZh && (
          <div className="sdk-layer-row sdk-layer-zh">
            <span className="sdk-layer-label">汉语意译</span>
            <div className="sdk-meaning-zh-line">{verse.meaningZh}</div>
          </div>
        )}

        {/* 9. 英语意译 */}
        {layers.showMeaningEn && (
          <div className="sdk-layer-row sdk-layer-en">
            <span className="sdk-layer-label">English Gloss</span>
            <div className="sdk-meaning-en-line">{verse.meaningEn}</div>
          </div>
        )}

        {/* 10. 逐词词根与八格语法解析卡片 */}
        {layers.showWordGloss && verse.words && verse.words.length > 0 && (
          <div className="sdk-word-gloss-section">
            <div className="sdk-word-gloss-header">📖 逐词词根、八格语法与梵汉对勘解析</div>
            <div className="sdk-word-gloss-grid">
              {verse.words.map((w, wIdx) => (
                <div key={wIdx} className="sdk-word-card">
                  <div className="sdk-word-top">
                    {w.siddham && (
                      <span className="sdk-word-siddham" lang="sa-Sidd">
                        {w.siddham}
                      </span>
                    )}
                    <div className="sdk-word-scripts">
                      <span className="sdk-word-iast">{w.sanskrit}</span>
                      {w.devanagari && (
                        <span className="sdk-word-deva" lang="sa-Deva">
                          {w.devanagari}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="sdk-word-tang">
                    古音：{w.tangPhonetic}
                    {w.tangInlineNote && (
                      <span className="sdk-word-yinnote">（{w.tangInlineNote}）</span>
                    )}
                  </div>
                  {(w.rootOrStem || w.grammar) && (
                    <div className="sdk-word-grammar">
                      {w.rootOrStem ? `词根 ${w.rootOrStem} · ` : ''}
                      {w.grammar || ''}
                    </div>
                  )}
                  <div className="sdk-word-zh">{w.meaningZh}</div>
                  {w.meaningEn && <div className="sdk-word-en">{w.meaningEn}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
};
