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
  buildWordGlossesFromIast,
  enrichSyllablesWithPhonetics,
  formatModernPhoneticWithIastOption,
  generateVerseChinesePhonetics,
} from '../../core/sanskrit/phoneticMapper';
import {
  normalizeSanskritToken,
  resolveEffectiveVerseMeaning,
} from '../../core/sanskrit/sanskritLexicon';

interface VerseBlockProps {
  verse: DharaniVerse;
  config: ScriptVisibilityConfig;
  isVersePlaying: boolean;
  isLoadingAudio?: boolean;
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
  isLoadingAudio = false,
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

  // Unified phonological single-source-of-truth for both verse-level and syllable-level phonetics
  const autoPhonetics = useMemo(
    () => generateVerseChinesePhonetics(verse.iast, config.showPhoneticIastBracket),
    [verse.iast, config.showPhoneticIastBracket]
  );

  const effectiveClassicalZh =
    verse.classicalTranslitZh && !verse.classicalTranslitZh.startsWith('【GRETIL')
      ? verse.classicalTranslitZh
      : autoPhonetics.classicalTranslitZh;

  const effectiveModernPhoneticZh = useMemo(
    () =>
      autoPhonetics.modernPhoneticZh ||
      formatModernPhoneticWithIastOption(
        verse.modernPhoneticZh || '',
        verse.iast,
        config.showPhoneticIastBracket
      ),
    [autoPhonetics.modernPhoneticZh, verse.modernPhoneticZh, verse.iast, config.showPhoneticIastBracket]
  );

  // Guarantee authentic semantic verse translation (preserving curated translations while translating provenance-only verses)
  const effectiveMeaning = useMemo(
    () => resolveEffectiveVerseMeaning(verse),
    [verse]
  );

  // Guarantee 100% word-by-word coverage for EVERY Sanskrit word in `verse.iast`,
  // seamlessly merging any curated per-word glosses onto the full untruncated token sequence.
  const effectiveWords = useMemo(() => {
    if (!config.showWordGloss) return [];
    const fullAutoWords = buildWordGlossesFromIast(verse.iast);
    if (!verse.words || verse.words.length === 0) {
      return fullAutoWords;
    }
    if (verse.words.length >= fullAutoWords.length) {
      return verse.words;
    }
    const curatedByNorm = new Map<string, (typeof verse.words)[number]>();
    for (const cw of verse.words) {
      for (const sub of cw.iast.split(/\s+/)) {
        const nk = normalizeSanskritToken(sub);
        if (nk && !curatedByNorm.has(nk)) {
          curatedByNorm.set(nk, cw);
        }
      }
    }
    return fullAutoWords.map((aw) => {
      const nk = normalizeSanskritToken(aw.iast);
      const curated = nk ? curatedByNorm.get(nk) : undefined;
      if (curated && !curated.meaningZh.includes('契入本尊三昧总持')) {
        return {
          ...aw,
          stem: curated.stem || aw.stem,
          grammar: curated.grammar || aw.grammar,
          transliterationZh: curated.transliterationZh || aw.transliterationZh,
          meaningZh: curated.meaningZh,
          meaningEn: curated.meaningEn || aw.meaningEn,
        };
      }
      return aw;
    });
  }, [config.showWordGloss, verse.iast, verse.words]);

  // Enrich each syllable with full inter-syllable Sandhi, Abhinidhāna, Parasavarṇa & Samāsa context
  const enrichedSyllables = useMemo(
    () => enrichSyllablesWithPhonetics(syllables),
    [syllables]
  );

  const effectiveActiveSylIndex = isVersePlaying
    ? (activeSyllableIndex ?? enrichedSyllables[0]?.index ?? 1)
    : null;

  const activeSyl = useMemo(
    () =>
      effectiveActiveSylIndex !== null
        ? enrichedSyllables.find((s) => s.index === effectiveActiveSylIndex) ||
          enrichedSyllables[0] ||
          null
        : null,
    [enrichedSyllables, effectiveActiveSylIndex]
  );

  const activePillRef = useRef<HTMLButtonElement | null>(null);
  const activeInlineIastRef = useRef<HTMLSpanElement | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const lastScrollTimeRef = useRef<number>(0);
  const wasPlayingRef = useRef<boolean>(false);

  // Strictly vertical (left: 0) smooth centering controller:
  // Keeps the active verse and active reading line in the vertical center of the screen
  // with ZERO horizontal swaying (left: 0) and ZERO high-frequency jitter.
  useEffect(() => {
    if (!isVersePlaying) {
      wasPlayingRef.current = false;
      return;
    }
    if (!autoScroll || typeof window === 'undefined') {
      return;
    }

    const justStartedVerse = !wasPlayingRef.current;
    wasPlayingRef.current = true;

    const now = performance.now();
    // Optical vertical center of reading viewport (between 68px sticky header and 88px sticky player bar)
    const viewportCenterY = Math.round((window.innerHeight - 88 + 68) * 0.45);

    if (justStartedVerse && cardRef.current) {
      const cardRect = cardRef.current.getBoundingClientRect();
      const focusOffsetInCard = Math.min(180, cardRect.height * 0.35);
      const currentFocusY = cardRect.top + focusOffsetInCard;
      const deltaY = currentFocusY - viewportCenterY;
      if (Math.abs(deltaY) > 20) {
        lastScrollTimeRef.current = now;
        window.scrollTo({
          top: Math.max(0, window.scrollY + deltaY),
          left: 0,
          behavior: 'smooth',
        });
      }
      return;
    }

    const targetEl = activeInlineIastRef.current || activePillRef.current || cardRef.current;
    if (!targetEl) return;

    const rect = targetEl.getBoundingClientRect();
    const elCenterY = rect.top + rect.height / 2;
    const deltaY = elCenterY - viewportCenterY;

    if (Math.abs(deltaY) > 58 && now - lastScrollTimeRef.current > 360) {
      lastScrollTimeRef.current = now;
      window.scrollTo({
        top: Math.max(0, window.scrollY + deltaY),
        left: 0,
        behavior: 'smooth',
      });
    }
  }, [isVersePlaying, effectiveActiveSylIndex, autoScroll]);

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
          <span>
            {isVersePlaying
              ? isLoadingAudio
                ? '正在合成 48kHz 神经梵音...'
                : '正在同步讽诵本句...'
              : '梵音讽诵本句'}
          </span>
        </button>
      </div>

      {/* Live Verse Progress Bar & Real-Time Syllable Spotlight Banner when chanting */}
      {isVersePlaying && (
        <>
          <div
            style={{
              height: '5px',
              width: '100%',
              background: 'var(--bg-subtle)',
              borderRadius: '999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.max(4, Math.round(verseProgress * 100))}%`,
                background: 'linear-gradient(90deg, #b91c1c 0%, #d97706 100%)',
                transition: 'width 0.06s linear',
              }}
            />
          </div>

          {activeSyl && (
            <div className="live-reading-spotlight" role="status" aria-live="polite">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                <span className="spotlight-badge-now">
                  ● {isLoadingAudio ? '准备发音' : `正在跟读 (${activeSyl.index}/${enrichedSyllables.length})`}
                </span>
                <div className="spotlight-syllable-focus">
                  <span className="spotlight-token-chip">
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>梵音</span>
                    <strong style={{ fontFamily: 'var(--font-iast)', fontSize: '1.12rem', color: 'var(--accent-vermilion)' }}>
                      {activeSyl.iast}
                    </strong>
                  </span>
                  <span className="spotlight-token-chip">
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>拼读</span>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--accent-jade)' }}>
                      {activeSyl.modernZh}
                    </strong>
                  </span>
                  <span className="spotlight-token-chip">
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>古音</span>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--accent-vermilion)' }}>
                      {activeSyl.classicalZh}
                    </strong>
                  </span>
                  <span className="spotlight-token-chip">
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>天城</span>
                    <strong style={{ fontFamily: 'var(--font-devanagari)', fontSize: '1.08rem' }}>
                      {activeSyl.devanagari}
                    </strong>
                  </span>
                  <span className="spotlight-token-chip">
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>悉昙</span>
                    <strong style={{ fontFamily: 'var(--font-siddham)', fontSize: '1.18rem', color: 'var(--accent-vermilion)' }}>
                      {activeSyl.siddham}
                    </strong>
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                {activeSyl.weight === 'guru' ? '— Guru 重音 (2拍)' : '⌣ Laghu 轻音 (1拍)'}
              </span>
            </div>
          )}
        </>
      )}

      {/* Parallel Multi-Script & Chinese Phonetic / Classical Transliteration Alignment */}
      {config.showSiddham && (
        <div className="script-row">
          <span className="script-label">悉昙梵字</span>
          {isVersePlaying && enrichedSyllables.length > 0 ? (
            <div className="script-content-siddham inline-syl-strip">
              {enrichedSyllables.map((syl) => {
                const isSpoken = effectiveActiveSylIndex === syl.index;
                const isPast =
                  effectiveActiveSylIndex !== null && syl.index < effectiveActiveSylIndex;
                return (
                  <span
                    key={`${verse.id}-sid-${syl.index}`}
                    className={`inline-syl-token ${isSpoken ? 'active-spoken' : isPast ? 'past-spoken' : ''}`}
                    onClick={() => onPlaySyllable(syl.iast)}
                    title={`点击发音: ${syl.iast} (${syl.modernZh})`}
                  >
                    {syl.siddham || iastToSiddham(syl.iast)}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="script-content-siddham">{siddhamText}</div>
          )}
        </div>
      )}

      {config.showDevanagari && (
        <div className="script-row">
          <span className="script-label">天城梵文</span>
          {isVersePlaying && enrichedSyllables.length > 0 ? (
            <div className="script-content-devanagari inline-syl-strip">
              {enrichedSyllables.map((syl) => {
                const isSpoken = effectiveActiveSylIndex === syl.index;
                const isPast =
                  effectiveActiveSylIndex !== null && syl.index < effectiveActiveSylIndex;
                return (
                  <span
                    key={`${verse.id}-deva-${syl.index}`}
                    className={`inline-syl-token ${isSpoken ? 'active-spoken' : isPast ? 'past-spoken' : ''}`}
                    onClick={() => onPlaySyllable(syl.iast)}
                    title={`点击发音: ${syl.iast} (${syl.modernZh})`}
                  >
                    {syl.devanagari}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="script-content-devanagari">{devanagariText}</div>
          )}
        </div>
      )}

      {config.showIast && (
        <div className="script-row">
          <span className="script-label">梵文 IAST</span>
          {isVersePlaying && enrichedSyllables.length > 0 ? (
            <div className="script-content-iast inline-syl-strip">
              {enrichedSyllables.map((syl) => {
                const isSpoken = effectiveActiveSylIndex === syl.index;
                const isPast =
                  effectiveActiveSylIndex !== null && syl.index < effectiveActiveSylIndex;
                return (
                  <span
                    key={`${verse.id}-iast-${syl.index}`}
                    ref={isSpoken ? activeInlineIastRef : null}
                    className={`inline-syl-token ${isSpoken ? 'active-spoken' : isPast ? 'past-spoken' : ''}`}
                    onClick={() => onPlaySyllable(syl.iast)}
                    title={`点击发音: ${syl.iast} (${syl.modernZh})`}
                  >
                    {syl.iast}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="script-content-iast">{verse.iast}</div>
          )}
        </div>
      )}

      {/* 直接在梵文下方平行对齐展示「梵音拼读参考」与「古汉语音译」，跟读时逐音节同步高亮 */}
      {config.showModernPhoneticZh && (
        <div className="script-row">
          <span className="script-label" style={{ color: 'var(--accent-jade)' }}>
            梵音拼读参考
          </span>
          {isVersePlaying && enrichedSyllables.length > 0 ? (
            <div className="script-content-phonetic-zh inline-syl-strip">
              {enrichedSyllables.map((syl, sIdx) => {
                const isSpoken = effectiveActiveSylIndex === syl.index;
                const isPast =
                  effectiveActiveSylIndex !== null && syl.index < effectiveActiveSylIndex;
                const isLastSyl = sIdx === enrichedSyllables.length - 1;
                return (
                  <React.Fragment key={`${verse.id}-mod-${syl.index}`}>
                    {syl.dandaBefore && (
                      <span style={{ opacity: 0.55, padding: '0 0.15rem' }}>{syl.dandaBefore}</span>
                    )}
                    {!syl.isWordStart && syl.compoundHyphenBefore && (
                      <span style={{ opacity: 0.55, margin: '0 -0.2rem' }}>-</span>
                    )}
                    <span
                      className={`inline-syl-token ${isSpoken ? 'active-spoken' : isPast ? 'past-spoken' : ''}`}
                      style={
                        !syl.isWordStart && !syl.compoundHyphenBefore
                          ? { marginLeft: '-0.22rem' }
                          : sIdx > 0 && syl.isWordStart
                          ? { marginLeft: '0.18rem' }
                          : undefined
                      }
                      onClick={() => onPlaySyllable(syl.iast)}
                      title={`梵音: ${syl.iast} · 现代拼读: ${syl.modernZh}${syl.wordIast ? ` · 所属词: ${syl.wordIast}` : ''}`}
                    >
                      {config.showPhoneticIastBracket
                        ? `${syl.modernZh}(${syl.iast})`
                        : syl.modernZh}
                    </span>
                    {syl.dandaAfter && !isLastSyl && (
                      <span style={{ opacity: 0.55, padding: '0 0.15rem' }}>{syl.dandaAfter}</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          ) : (
            <div className="script-content-phonetic-zh">{effectiveModernPhoneticZh}</div>
          )}
        </div>
      )}

      {config.showClassicalZh && (
        <div className="script-row">
          <span className="script-label" style={{ color: 'var(--accent-vermilion)' }}>
            古汉语音译
          </span>
          {isVersePlaying && enrichedSyllables.length > 0 ? (
            <div className="script-content-classical-zh inline-syl-strip">
              {enrichedSyllables.map((syl) => {
                const isSpoken = effectiveActiveSylIndex === syl.index;
                const isPast =
                  effectiveActiveSylIndex !== null && syl.index < effectiveActiveSylIndex;
                return (
                  <span
                    key={`${verse.id}-cls-${syl.index}`}
                    className={`inline-syl-token ${isSpoken ? 'active-spoken' : isPast ? 'past-spoken' : ''}`}
                    onClick={() => onPlaySyllable(syl.iast)}
                    title={`梵音: ${syl.iast} · 古汉语: ${syl.classicalZh}`}
                  >
                    {syl.classicalZh}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="script-content-classical-zh">{effectiveClassicalZh}</div>
          )}
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
              const isSpoken = isVersePlaying && effectiveActiveSylIndex === syl.index;
              const isPast =
                isVersePlaying &&
                effectiveActiveSylIndex !== null &&
                syl.index < effectiveActiveSylIndex;
              return (
                <button
                  key={`${verse.id}-syl-${syl.index}`}
                  ref={isSpoken ? activePillRef : null}
                  type="button"
                  className={`syllable-pill ${syl.weight} ${isSpoken ? 'active-spoken' : isPast ? 'past-spoken' : ''}`}
                  style={
                    syl.index > 1 && syl.isWordStart
                      ? { marginLeft: '0.32rem' }
                      : undefined
                  }
                  onClick={() => onPlaySyllable(syl.iast)}
                  title={`梵音: ${syl.iast} [${syl.ipa}]${syl.wordIast ? ` (所属词: ${syl.wordIast})` : ''} | 梵音拼读: ${syl.modernZh} | 古汉语: ${syl.classicalZh} | ${
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
              <div className="box-text-zh">{effectiveMeaning.meaningZh}</div>
            </div>
          )}

          {config.showMeaningEn && (
            <div className="translit-box meaning-en">
              <div className="box-mini-label">Scholarly English Translation</div>
              <div className="box-text-en">{effectiveMeaning.meaningEn}</div>
            </div>
          )}
        </div>
      )}

      {config.showWordGloss && effectiveWords.length > 0 && (
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
            {effectiveWords.map((w, idx) => (
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
