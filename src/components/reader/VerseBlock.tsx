import React, { useMemo, useEffect, useRef } from 'react';
import { Volume2, Sparkles } from 'lucide-react';
import type { DharaniVerse, ScriptVisibilityConfig } from '../../types/kosaTypes';
import {
  iastToDevanagari,
  iastToIpa,
  iastToSiddham,
} from '../../core/sanskrit/transliterator';
import { analyzeSanskritProsody } from '../../core/sanskrit/prosody';
import {
  formatModernPhoneticWithIastOption,
  generateVerseChinesePhonetics,
  mapSyllableToChinesePhonetics,
} from '../../core/sanskrit/phoneticMapper';

interface VerseBlockProps {
  verse: DharaniVerse;
  config: ScriptVisibilityConfig;
  isVersePlaying: boolean;
  activeSyllableIndex: number | null;
  verseProgress: number;
  autoScroll: boolean;
  onPlayVerse: () => void;
  onPlaySyllable: (iastSyl: string) => void;
}

export const VerseBlock: React.FC<VerseBlockProps> = ({
  verse,
  config,
  isVersePlaying,
  activeSyllableIndex,
  verseProgress,
  autoScroll,
  onPlayVerse,
  onPlaySyllable,
}) => {
  const siddhamText = useMemo(() => iastToSiddham(verse.iast), [verse.iast]);
  const devanagariText = useMemo(() => iastToDevanagari(verse.iast), [verse.iast]);
  const ipaText = useMemo(() => iastToIpa(verse.iast), [verse.iast]);
  const syllables = useMemo(() => analyzeSanskritProsody(verse.iast), [verse.iast]);

  // Ensure every single verse has a rich Classical Chinese Transliteration & Modern Phonetic Guide
  const autoPhonetics = useMemo(
    () => generateVerseChinesePhonetics(verse.iast, config.showPhoneticIastBracket),
    [verse.iast, config.showPhoneticIastBracket]
  );

  const effectiveClassicalZh =
    verse.classicalTranslitZh && !verse.classicalTranslitZh.startsWith('【GRETIL')
      ? verse.classicalTranslitZh
      : autoPhonetics.classicalTranslitZh;

  const rawModernPhoneticZh =
    verse.modernPhoneticZh && !verse.modernPhoneticZh.startsWith('基于上方')
      ? verse.modernPhoneticZh
      : autoPhonetics.modernPhoneticZh;

  const effectiveModernPhoneticZh = useMemo(
    () =>
      formatModernPhoneticWithIastOption(
        rawModernPhoneticZh,
        verse.iast,
        config.showPhoneticIastBracket
      ),
    [rawModernPhoneticZh, verse.iast, config.showPhoneticIastBracket]
  );

  // Enrich each syllable with its individual 古汉语 & 梵音拼读
  const enrichedSyllables = useMemo(
    () =>
      syllables.map((syl) => {
        const mapped = mapSyllableToChinesePhonetics(syl.iast);
        return {
          ...syl,
          classicalZh: mapped.classicalZh,
          modernZh: mapped.modernZh,
        };
      }),
    [syllables]
  );

  const activePillRef = useRef<HTMLButtonElement | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);

  // Smoothly scroll active verse & active syllable pill into view during chanting
  useEffect(() => {
    if (isVersePlaying && autoScroll && activePillRef.current) {
      activePillRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [isVersePlaying, activeSyllableIndex, autoScroll]);

  return (
    <article
      ref={cardRef}
      id={`verse-card-${verse.id}`}
      className={`verse-card ${isVersePlaying ? 'playing' : ''}`}
    >
      <div className="verse-card-header">
        <div className="verse-index-badge">
          <span>第 {String(verse.index).padStart(2, '0')} 句</span>
          {verse.tangNoteZh && (
            <span className="tang-note-tag" title="唐代原典夹注 / 写本出注">
              <Sparkles size={11} style={{ marginRight: '3px', verticalAlign: '-1px' }} />
              {verse.tangNoteZh}
            </span>
          )}
        </div>
        <button
          id={`play-verse-btn-${verse.id}`}
          type="button"
          className={`btn-scholarly ${isVersePlaying ? 'primary' : ''}`}
          onClick={onPlayVerse}
          title="连续合成梵音讽诵本句（硬件时钟60fps同步跟读）"
        >
          <Volume2 size={14} />
          <span>{isVersePlaying ? '正在同步讽诵本句...' : '梵音讽诵本句'}</span>
        </button>
      </div>

      {/* Live Verse Progress Bar when chanting */}
      {isVersePlaying && (
        <div
          style={{
            height: '4px',
            width: '100%',
            background: 'var(--bg-subtle)',
            borderRadius: '999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.round(verseProgress * 100)}%`,
              background: 'var(--accent-vermilion)',
              transition: 'width 0.08s linear',
            }}
          />
        </div>
      )}

      {/* Parallel Multi-Script & Chinese Phonetic / Classical Transliteration Alignment */}
      {config.showSiddham && (
        <div className="script-row">
          <span className="script-label">悉昙梵字</span>
          <div className="script-content-siddham">{siddhamText}</div>
        </div>
      )}

      {config.showDevanagari && (
        <div className="script-row">
          <span className="script-label">天城梵文</span>
          <div className="script-content-devanagari">{devanagariText}</div>
        </div>
      )}

      {config.showIast && (
        <div className="script-row">
          <span className="script-label">梵文 IAST</span>
          <div className="script-content-iast">{verse.iast}</div>
        </div>
      )}

      {/* 直接在梵文下方平行对齐展示「梵音拼读参考」与「古汉语音译」，一目了然对照 */}
      {config.showModernPhoneticZh && (
        <div className="script-row">
          <span className="script-label" style={{ color: 'var(--accent-jade)' }}>
            梵音拼读参考
          </span>
          <div className="script-content-phonetic-zh">{effectiveModernPhoneticZh}</div>
        </div>
      )}

      {config.showClassicalZh && (
        <div className="script-row">
          <span className="script-label" style={{ color: 'var(--accent-vermilion)' }}>
            古汉语音译
          </span>
          <div className="script-content-classical-zh">{effectiveClassicalZh}</div>
        </div>
      )}

      {config.showIpa && (
        <div className="script-row">
          <span className="script-label">国际音标</span>
          <div className="script-content-ipa">/{ipaText}/</div>
        </div>
      )}

      {/* 逐音节五层对齐卡：摩多轻重 + 梵文 IAST + 梵音拼读 + 古汉语 + IPA */}
      {config.showProsodyMeter && enrichedSyllables.length > 0 && (
        <div>
          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginBottom: '0.35rem',
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <span>
              <strong>逐音节三体对照跟读卡</strong>（每格自上而下：轻重拍 · <strong>梵文</strong> ·{' '}
              <strong style={{ color: 'var(--accent-jade)' }}>梵音拼读</strong> ·{' '}
              <strong style={{ color: 'var(--accent-vermilion)' }}>古汉语</strong> · IPA，点击单字发声）
            </span>
            <span>
              <strong style={{ color: 'var(--accent-vermilion)' }}>— Guru 重音 (2拍)</strong> ·{' '}
              <strong style={{ color: 'var(--accent-jade)' }}>⌣ Laghu 轻音 (1拍)</strong>
            </span>
          </div>
          <div className="prosody-syllables-strip">
            {enrichedSyllables.map((syl) => {
              const isSpoken = isVersePlaying && activeSyllableIndex === syl.index;
              return (
                <button
                  key={`${verse.id}-syl-${syl.index}`}
                  ref={isSpoken ? activePillRef : null}
                  type="button"
                  className={`syllable-pill ${syl.weight} ${isSpoken ? 'active-spoken' : ''}`}
                  onClick={() => onPlaySyllable(syl.iast)}
                  title={`梵音: ${syl.iast} [${syl.ipa}] | 梵音拼读: ${syl.modernZh} | 古汉语: ${syl.classicalZh} | ${
                    syl.weight === 'guru' ? 'Guru 重音 (2摩多)' : 'Laghu 轻音 (1摩多)'
                  }`}
                >
                  <span className="syl-meter">{syl.weight === 'guru' ? '—' : '⌣'}</span>
                  <span className="syl-iast">{syl.iast}</span>
                  <span className="syl-modern-zh" title="现代梵音拼读">
                    {syl.modernZh}
                  </span>
                  <span className="syl-tang-zh" title="唐宋古汉语音译">
                    {syl.classicalZh}
                  </span>
                  <span className="syl-ipa">[{syl.ipa}]</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {(config.showMeaningZh || config.showMeaningEn) && (
        <div className="translit-meaning-grid">
          {config.showMeaningZh && (
            <div className="translit-box meaning-zh">
              <div className="box-mini-label">本句汉文精准意译</div>
              <div className="box-text-zh">{verse.meaningZh}</div>
            </div>
          )}

          {config.showMeaningEn && (
            <div className="translit-box meaning-en">
              <div className="box-mini-label">Scholarly English Translation</div>
              <div className="box-text-en">{verse.meaningEn}</div>
            </div>
          )}
        </div>
      )}

      {config.showWordGloss && verse.words.length > 0 && (
        <div>
          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              marginBottom: '0.3rem',
              fontWeight: 600,
            }}
          >
            逐词词根、古汉语音译与语法格位解析（Pada-ccheda &amp; Vyākaraṇa）：
          </div>
          <div className="word-gloss-grid">
            {verse.words.map((w, idx) => (
              <div
                key={`${verse.id}-w-${idx}`}
                className="word-gloss-card"
                onClick={() => onPlaySyllable(w.iast)}
                style={{ cursor: 'pointer' }}
                title="点击听取该梵文词发音"
              >
                <div className="wg-top">
                  <span className="wg-iast">{w.iast}</span>
                  {w.grammar && <span className="wg-grammar">{w.grammar}</span>}
                </div>
                {w.stem && (
                  <div
                    style={{
                      fontSize: '0.68rem',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-iast)',
                    }}
                  >
                    词干/词根：{w.stem}
                  </div>
                )}
                <div className="wg-translit">古汉语：{w.transliterationZh}</div>
                <div className="wg-meaning">释义：{w.meaningZh}</div>
                {w.meaningEn && (
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-iast)',
                    }}
                  >
                    {w.meaningEn}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
};
