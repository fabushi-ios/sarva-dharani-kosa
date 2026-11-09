/**
 * 陀罗尼单句十维对照与音节声学拆解卡片组件 (src/components/reader/VerseBlock.tsx)
 */

import React, { useMemo, useState } from 'react';
import { Volume2, Square, Copy, Check } from 'lucide-react';
import { DharaniVerse, DisplayLayerSettings } from '../../types/dharani';
import { analyzeSanskritSentence } from '../../core/prosody';
import { sanskritAudioEngine, AudioEngineMode } from '../../services/sanskritAudioEngine';

interface VerseBlockProps {
  verse: DharaniVerse;
  layers: DisplayLayerSettings;
  audioMode: AudioEngineMode;
  speechRate: number;
}

export const VerseBlock: React.FC<VerseBlockProps> = ({
  verse,
  layers,
  audioMode,
  speechRate
}) => {
  const [isPlayingVerse, setIsPlayingVerse] = useState(false);
  const [activeSyllableIdx, setActiveSyllableIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const analyzed = useMemo(
    () => analyzeSanskritSentence(verse.iast, 'smart'),
    [verse.iast]
  );

  const handleSpeakVerse = () => {
    if (isPlayingVerse) {
      sanskritAudioEngine.stop();
      setIsPlayingVerse(false);
      setActiveSyllableIdx(null);
      return;
    }
    setIsPlayingVerse(true);
    sanskritAudioEngine.speakVerseIast(verse.iast, {
      mode: audioMode,
      rate: speechRate,
      onSyllableIndex: idx => setActiveSyllableIdx(idx),
      onEnd: () => {
        setIsPlayingVerse(false);
        setActiveSyllableIdx(null);
      }
    });
  };

  const handleCopyVerse = () => {
    const lines = [
      `【第${verse.index}分】${verse.sectionTag || ''}`,
      `【悉昙体】${verse.siddham || analyzed.siddham}`,
      `【天城体】${verse.devanagari || analyzed.devanagari}`,
      `【IAST】${verse.iast}`,
      `【现代跟读】${verse.modernPhonetic || analyzed.modernFull}`,
      `【唐宋古译】${verse.tangTranslit}`,
      `【汉文意译】${verse.meaningZh}`
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <article className="sdk-verse-card">
      <div className="sdk-verse-header">
        <div className="sdk-verse-badge-row">
          <span className="sdk-verse-num">第 {verse.index} 节</span>
          {verse.sectionTag && <span className="sdk-verse-section-tag">{verse.sectionTag}</span>}
          {layers.showProsodyMeter && (
            <span className="sdk-verse-meter-summary">
              诗律：Guru 重音 (—) {analyzed.guruCount} · Laghu 轻音 (⌣) {analyzed.laghuCount}
            </span>
          )}
        </div>

        <div className="sdk-verse-actions">
          <button
            type="button"
            onClick={handleSpeakVerse}
            className={`sdk-btn-speak ${isPlayingVerse ? 'playing' : ''}`}
          >
            {isPlayingVerse ? <Square size={13} /> : <Volume2 size={14} />}
            <span>{isPlayingVerse ? '停止吟诵' : '吟诵本节'}</span>
          </button>
          <button
            type="button"
            onClick={handleCopyVerse}
            className="sdk-btn-copy"
            title="复制本节四体对照文本"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? '已复制' : '复制'}</span>
          </button>
        </div>
      </div>

      {/* 1. 悉昙梵字层 */}
      {layers.showSiddham && (
        <div className="sdk-layer-row sdk-layer-siddham">
          <span className="sdk-layer-label">悉昙梵字</span>
          <div className="sdk-layer-content siddham-text">
            {verse.siddham || analyzed.siddham}
          </div>
        </div>
      )}

      {/* 2. 天城体层 */}
      {layers.showDevanagari && (
        <div className="sdk-layer-row sdk-layer-deva">
          <span className="sdk-layer-label">天城梵文</span>
          <div className="sdk-layer-content deva-text">
            {verse.devanagari || analyzed.devanagari}
          </div>
        </div>
      )}

      {/* 3. IAST 国际梵文转写层 */}
      {layers.showIast && (
        <div className="sdk-layer-row sdk-layer-iast">
          <span className="sdk-layer-label">IAST 转写</span>
          <div className="sdk-layer-content iast-text">{verse.iast}</div>
        </div>
      )}

      {/* 4. IPA 国际音标层 */}
      {layers.showIpa && (
        <div className="sdk-layer-row sdk-layer-ipa">
          <span className="sdk-layer-label">IPA 音标</span>
          <div className="sdk-layer-content ipa-text">{verse.ipa || analyzed.ipa}</div>
        </div>
      )}

      {/* 5. 逐音节声学拆解与 Guru/Laghu 格律点读矩阵 */}
      {layers.showProsodyMeter && (
        <div className="sdk-syllable-matrix-wrap">
          <div className="sdk-syllable-matrix-label">
            Akṣara 逐音节轻重音律与双轨发声矩阵（点击任意音节独立发声）：
          </div>
          <div className="sdk-syllable-strip">
            {analyzed.syllables.map((syl, sIdx) => (
              <button
                key={`${syl.rawSlp}-${sIdx}`}
                type="button"
                onClick={() => {
                  setActiveSyllableIdx(sIdx);
                  sanskritAudioEngine.playSingleSyllableIast(
                    syl.rawSlp,
                    audioMode,
                    speechRate,
                    true
                  );
                }}
                className={`sdk-syl-chip ${activeSyllableIdx === sIdx ? 'active' : ''}`}
                title={`${syl.varga} | ${syl.note} | 共振峰 F1=${syl.f1}Hz, F2=${syl.f2}Hz`}
              >
                <div className="sdk-syl-top">
                  <span className="sdk-syl-iast">{syl.iast}</span>
                  <span
                    className={`sdk-syl-meter ${syl.meter === '—' ? 'guru' : 'laghu'}`}
                    title={syl.weightLabel}
                  >
                    {syl.meter}
                  </span>
                </div>
                <div className="sdk-syl-siddham siddham-text">{syl.siddham}</div>
                <div className="sdk-syl-deva deva-text">{syl.devanagari}</div>
                <div className="sdk-syl-modern">{syl.modernPhonetic}</div>
                <div className="sdk-syl-trad">古:{syl.tangTranslit}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 6. 现代声学听感跟读层 */}
      {layers.showModernPhonetic && (
        <div className="sdk-layer-row sdk-layer-modern">
          <span className="sdk-layer-label">现代跟读</span>
          <div className="sdk-layer-content modern-phonetic-text">
            {verse.modernPhonetic || analyzed.modernFull}
          </div>
        </div>
      )}

      {/* 7. 唐宋大藏经古音译与二合/引声调夹注层 */}
      {layers.showTangTranslit && (
        <div className="sdk-layer-row sdk-layer-tang">
          <span className="sdk-layer-label">唐宋音译</span>
          <div className="sdk-layer-content tang-text">
            <div>{verse.tangTranslit}</div>
            {verse.tangYinNotes && verse.tangYinNotes.length > 0 && (
              <div className="sdk-tang-yin-pills">
                {verse.tangYinNotes.map((note, nIdx) => (
                  <span key={nIdx} className="sdk-yin-pill">
                    唐代音注：{note}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. 汉文意译层 */}
      {layers.showMeaningZh && (
        <div className="sdk-layer-row sdk-layer-zh">
          <span className="sdk-layer-label">汉文意译</span>
          <div className="sdk-layer-content">{verse.meaningZh}</div>
        </div>
      )}

      {/* 9. 英文意译层 */}
      {layers.showMeaningEn && (
        <div className="sdk-layer-row sdk-layer-en">
          <span className="sdk-layer-label">English</span>
          <div className="sdk-layer-content">{verse.meaningEn}</div>
        </div>
      )}

      {/* 10. 逐词词根与八格语法解析层 */}
      {layers.showWordGloss && verse.words && verse.words.length > 0 && (
        <div className="sdk-word-gloss-section">
          <div className="sdk-word-gloss-title">逐词梵文词根、八格语法与密义解析：</div>
          <div className="sdk-word-gloss-grid">
            {verse.words.map((w, wIdx) => (
              <div
                key={`${w.iast}-${wIdx}`}
                onClick={() =>
                  sanskritAudioEngine.playSingleSyllableIast(w.iast, audioMode, speechRate)
                }
                className="sdk-word-card"
                title="点击试听该词梵音"
              >
                <div className="sdk-word-card-head">
                  <span className="sdk-word-iast">{w.iast}</span>
                  {w.yinNote && <span className="sdk-word-yin">{w.yinNote}</span>}
                </div>
                <div className="sdk-word-tang">古译：{w.tangTranslit}</div>
                <div className="sdk-word-grammar">{w.grammar}</div>
                <div className="sdk-word-zh">{w.meaningZh}</div>
                <div className="sdk-word-en">{w.meaningEn}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
};
