import React, { useMemo, useEffect, useRef } from 'react';
import { Volume2, Sparkles, Share2 } from 'lucide-react';
import type { DharaniVerse, ScriptVisibilityConfig } from '../../types/kosaTypes';
import { iastToDevanagari, iastToSiddham } from '../../core/sanskrit/transliterator';
import { analyzeSanskritProsody } from '../../core/sanskrit/prosody';
import {
  enrichSyllablesWithPhonetics,
  generateVerseChinesePhonetics,
} from '../../core/sanskrit/phoneticMapper';
import {
  isClassicalChineseOnlyVerse,
  resolveEffectiveVerseFields,
  resolveEffectiveWordGlosses,
  resolveVerseMixedSegments,
  resolveVersePlaybackTokenOrigins,
  type EntryFieldOriginState,
  type ProvenanceTextSegment,
} from '../../core/provenance/fieldProvenance';
import { sanskritAudioEngine } from '../../services/audio/sanskritAudioEngine';
import {
  getReadingViewportBounds,
  scrollActiveViewportByDeltaY,
} from '../../core/dom/scrollUtils';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { PhoneticText } from '../common/PhoneticText';

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
  onShareVerse?: () => void;
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
  onShareVerse,
}) => {
  const isChineseOnly = useMemo(() => isClassicalChineseOnlyVerse(verse), [verse]);

  const effective = useMemo(
    () => (isChineseOnly ? null : resolveEffectiveVerseFields(verse, config.showPhoneticIastBracket)),
    [verse, isChineseOnly, config.showPhoneticIastBracket]
  );

  const syllables = useMemo(
    () => (isChineseOnly ? [] : analyzeSanskritProsody(verse.iast)),
    [verse.iast, isChineseOnly]
  );

  const canUseInlineModernSyllables = useMemo(() => {
    if (isChineseOnly) return false;
    const concrete = (verse.modernPhoneticZh || '').trim();
    if (!concrete) return true;
    const autoPlain = generateVerseChinesePhonetics(verse.iast, false).modernPhoneticZh;
    return concrete === autoPlain;
  }, [verse.iast, verse.modernPhoneticZh, isChineseOnly]);

  const rowClassForOrigin = (origin: EntryFieldOriginState): string =>
    origin === 'db-original' ? 'is-original-row' : origin === 'mixed' ? 'is-mixed-row' : 'is-reference-row';

  const wordsResult = useMemo(() => {
    if (isChineseOnly || !config.showWordGloss) {
      return { words: [], sectionState: 'derived-reference' as EntryFieldOriginState };
    }
    const res = resolveEffectiveWordGlosses(verse);
    if (config.hideDerivedReference) {
      return {
        words: res.words.filter((w) => w.origin === 'db-original'),
        sectionState: 'db-original' as EntryFieldOriginState,
      };
    }
    return res;
  }, [isChineseOnly, config.showWordGloss, config.hideDerivedReference, verse]);

  const shouldShowLayer = (enabled: boolean, origin: EntryFieldOriginState): boolean =>
    enabled && (!config.hideDerivedReference || origin !== 'derived-reference');

  const enrichedSyllables = useMemo(
    () => (isChineseOnly ? [] : enrichSyllablesWithPhonetics(syllables)),
    [syllables, isChineseOnly]
  );

  const enrichedSubwords = useMemo(() => {
    if (isChineseOnly) return [];
    const groups: Array<{
      key: number;
      iast: string;
      modernZh: string;
      siddham: string;
      devanagari: string;
      firstSylIndex: number;
      lastSylIndex: number;
      dandaBefore?: '|' | '||';
      dandaAfter?: '|' | '||';
    }> = [];
    for (const syl of enrichedSyllables) {
      const swKey = syl.subwordIndex ?? syl.wordIndex ?? syl.index;
      const last = groups[groups.length - 1];
      if (last && last.key === swKey) {
        last.iast += syl.iast;
        last.modernZh += syl.modernZh;
        last.lastSylIndex = syl.index;
        if (syl.dandaAfter) last.dandaAfter = syl.dandaAfter;
      } else {
        groups.push({
          key: swKey,
          iast: syl.iast,
          modernZh: syl.modernZh,
          siddham: '',
          devanagari: '',
          firstSylIndex: syl.index,
          lastSylIndex: syl.index,
          dandaBefore: syl.dandaBefore,
          dandaAfter: syl.dandaAfter,
        });
      }
    }
    for (const g of groups) {
      g.siddham = iastToSiddham(g.iast);
      g.devanagari = iastToDevanagari(g.iast);
    }
    return groups;
  }, [enrichedSyllables, isChineseOnly]);

  const mixedSiddhamSegments = useMemo(
    () =>
      !isChineseOnly && effective?.siddhamOrigin === 'mixed'
        ? resolveVerseMixedSegments(verse, 'siddham', config.showPhoneticIastBracket)
        : null,
    [isChineseOnly, verse, effective?.siddhamOrigin, config.showPhoneticIastBracket]
  );

  const mixedDevanagariSegments = useMemo(
    () =>
      !isChineseOnly && effective?.devanagariOrigin === 'mixed'
        ? resolveVerseMixedSegments(verse, 'devanagari', config.showPhoneticIastBracket)
        : null,
    [isChineseOnly, verse, effective?.devanagariOrigin, config.showPhoneticIastBracket]
  );

  const mixedIastSegments = useMemo(
    () =>
      !isChineseOnly && effective?.iastOrigin === 'mixed'
        ? resolveVerseMixedSegments(verse, 'iast', config.showPhoneticIastBracket)
        : null,
    [isChineseOnly, verse, effective?.iastOrigin, config.showPhoneticIastBracket]
  );

  const hasAnyMixedPlaybackLayer = Boolean(
    effective &&
      (effective.siddhamOrigin === 'mixed' ||
        effective.devanagariOrigin === 'mixed' ||
        effective.iastOrigin === 'mixed')
  );

  const playbackTokenOrigins = useMemo(
    () =>
      !isChineseOnly && isVersePlaying && hasAnyMixedPlaybackLayer
        ? resolveVersePlaybackTokenOrigins(
            verse,
            enrichedSubwords.map((sw) => sw.iast),
            enrichedSyllables.map((s) => s.iast)
          )
        : null,
    [isChineseOnly, isVersePlaying, hasAnyMixedPlaybackLayer, verse, enrichedSubwords, enrichedSyllables]
  );

  const renderMixedSegments = (segments: ProvenanceTextSegment[], keyPrefix: string) =>
    segments.map((seg, idx) => (
      <span
        key={`${keyPrefix}-${idx}`}
        className={seg.origin === 'db-original' ? 'prov-seg-orig' : 'prov-seg-ref'}
      >
        {seg.text}
      </span>
    ));

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

  useEffect(() => {
    if (!isVersePlaying) {
      wasPlayingRef.current = false;
      return;
    }
    if (!autoScroll || typeof window === 'undefined') return;

    const justStartedVerse = !wasPlayingRef.current;
    wasPlayingRef.current = true;

    const now = performance.now();
    const { centerY: viewportCenterY } = getReadingViewportBounds();

    if (justStartedVerse && cardRef.current) {
      const cardRect = cardRef.current.getBoundingClientRect();
      const focusOffsetInCard = Math.min(180, cardRect.height * 0.35);
      const currentFocusY = cardRect.top + focusOffsetInCard;
      const deltaY = currentFocusY - viewportCenterY;
      if (Math.abs(deltaY) > 20) {
        lastScrollTimeRef.current = now;
        scrollActiveViewportByDeltaY(deltaY, 'smooth');
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
      scrollActiveViewportByDeltaY(deltaY, 'smooth');
    }
  }, [isVersePlaying, effectiveActiveSylIndex, autoScroll]);

  if (isChineseOnly) {
    return (
      <article
        ref={cardRef}
        id={`verse-card-${verse.id}`}
        className="verse-card is-chinese-phonetic-verse"
      >
        <div className="verse-card-header">
          <div className="verse-index-badge">
            <span>第 {String(verse.index).padStart(2, '0')} 句</span>
            {verse.tangNoteZh && (
              <span className="tang-note-tag" title="原典夹注">
                <Sparkles size={11} style={{ marginRight: '3px', verticalAlign: '-1px' }} />
                {verse.tangNoteZh}
              </span>
            )}
          </div>
          {onShareVerse && (
            <button
              id={`share-verse-btn-${verse.id}`}
              type="button"
              className="btn-scholarly"
              onClick={onShareVerse}
            >
              <Share2 size={13} />
              <span>分享</span>
            </button>
          )}
        </div>

        <div className="script-row is-original-row">
          <span className="script-label" style={{ color: 'var(--accent-vermilion)' }}>
            <span>原典古汉音</span>
            <ProvenanceBadge state="db-original" field="classicalTranslitZh" compact />
          </span>
          <div className="script-content-classical-zh" style={{ fontSize: '1.08rem', lineHeight: 1.8 }}>
            {verse.classicalTranslitZh}
          </div>
        </div>
      </article>
    );
  }

  if (!effective) return null;

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {onShareVerse && (
            <button
              id={`share-verse-btn-${verse.id}`}
              type="button"
              className="btn-scholarly"
              onClick={onShareVerse}
            >
              <Share2 size={13} />
              <span>分享</span>
            </button>
          )}
          <button
            id={`play-verse-btn-${verse.id}`}
            type="button"
            className={`btn-scholarly ${isVersePlaying ? 'primary' : ''}`}
            onMouseEnter={() => sanskritAudioEngine.prewarmSingleVerse(verse)}
            onFocus={() => sanskritAudioEngine.prewarmSingleVerse(verse)}
            onClick={onPlayVerse}
          >
            <Volume2 size={14} />
            <span>{isVersePlaying ? (isLoadingAudio ? '合成中...' : '跟诵中...') : '本句跟诵'}</span>
          </button>
        </div>
      </div>

      {isVersePlaying && (
        <>
          <div style={{ height: '4px', width: '100%', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
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
                    <strong style={{ fontFamily: 'var(--font-iast)', fontSize: '1.1rem', color: 'var(--accent-vermilion)' }}>
                      {activeSyl.iast}
                    </strong>
                  </span>
                  <span className="spotlight-token-chip">
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>拼读</span>
                    <strong style={{ fontSize: '1.02rem', color: 'var(--accent-jade)' }}>
                      <PhoneticText text={activeSyl.modernZh} />
                    </strong>
                  </span>
                  <span className="spotlight-token-chip">
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>悉昙</span>
                    <strong style={{ fontFamily: 'var(--font-siddham)', fontSize: '1.15rem', color: 'var(--accent-vermilion)' }}>
                      {activeSyl.siddham}
                    </strong>
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                {activeSyl.weight === 'guru' ? '— Guru 重音' : '⌣ Laghu 轻音'}
              </span>
            </div>
          )}
        </>
      )}

      {verse.diplomaticOriginal && (
        <div className="script-row is-original-row">
          <span className="script-label" style={{ color: 'var(--accent-lapis)' }}>
            <span>写本原貌</span>
            <ProvenanceBadge state="db-original" compact />
          </span>
          <div
            className="script-content-iast"
            style={{
              padding: '0.28rem 0.62rem',
              background: 'var(--accent-lapis-soft)',
              borderRadius: 'var(--radius-xs)',
              borderLeft: '3px solid var(--accent-lapis)',
            }}
          >
            {verse.diplomaticOriginal}
          </div>
        </div>
      )}

      {shouldShowLayer(config.showSiddham, effective.siddhamOrigin) && (
        <div className={`script-row ${rowClassForOrigin(effective.siddhamOrigin)}`}>
          <span className="script-label">
            <span>悉昙梵字</span>
            <ProvenanceBadge state={effective.siddhamOrigin} field="siddham" compact />
          </span>
          {isVersePlaying &&
          enrichedSubwords.length > 0 &&
          (effective.siddhamOrigin === 'derived-reference' || effective.siddhamOrigin === 'mixed') ? (
            <div className="script-content-siddham inline-syl-strip">
              {enrichedSubwords.map((sw, swIdx) => {
                const isSpoken =
                  effectiveActiveSylIndex !== null &&
                  effectiveActiveSylIndex >= sw.firstSylIndex &&
                  effectiveActiveSylIndex <= sw.lastSylIndex;
                const isPast =
                  effectiveActiveSylIndex !== null && sw.lastSylIndex < effectiveActiveSylIndex;
                const isLastSw = swIdx === enrichedSubwords.length - 1;
                const mixedTokClass =
                  effective.siddhamOrigin === 'mixed' && playbackTokenOrigins
                    ? playbackTokenOrigins.subwordOrigins[swIdx] === 'db-original'
                      ? 'prov-token-orig'
                      : 'prov-token-ref'
                    : '';
                return (
                  <React.Fragment key={`${verse.id}-sid-sw-${sw.key}`}>
                    {sw.dandaBefore && (
                      <span style={{ opacity: 0.65, padding: '0 0.18rem' }}>
                        {sw.dandaBefore === '||' ? '\u{115C3}' : '\u{115C2}'}
                      </span>
                    )}
                    <span
                      className={`inline-syl-token ${mixedTokClass} ${isSpoken ? 'active-spoken' : isPast ? 'past-spoken' : ''}`}
                      onClick={() => onPlaySyllable(sw.iast)}
                    >
                      {sw.siddham}
                    </span>
                    {sw.dandaAfter && !isLastSw && (
                      <span style={{ opacity: 0.65, padding: '0 0.18rem' }}>
                        {sw.dandaAfter === '||' ? '\u{115C3}' : '\u{115C2}'}
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          ) : (
            <div className="script-content-siddham">
              {mixedSiddhamSegments ? renderMixedSegments(mixedSiddhamSegments, `${verse.id}-sid-mix`) : effective.siddhamText}
            </div>
          )}
        </div>
      )}

      {shouldShowLayer(config.showDevanagari, effective.devanagariOrigin) && (
        <div className={`script-row ${rowClassForOrigin(effective.devanagariOrigin)}`}>
          <span className="script-label">
            <span>天城梵文</span>
            <ProvenanceBadge state={effective.devanagariOrigin} field="devanagari" compact />
          </span>
          <div className="script-content-devanagari">
            {mixedDevanagariSegments ? renderMixedSegments(mixedDevanagariSegments, `${verse.id}-deva-mix`) : effective.devanagariText}
          </div>
        </div>
      )}

      {shouldShowLayer(config.showIast, effective.iastOrigin) && (
        <div className={`script-row ${rowClassForOrigin(effective.iastOrigin)}`}>
          <span className="script-label">
            <span>梵文 IAST</span>
            <ProvenanceBadge state={effective.iastOrigin} field="iast" compact />
          </span>
          {isVersePlaying && enrichedSyllables.length > 0 ? (
            <div className="script-content-iast inline-syl-strip">
              {enrichedSyllables.map((syl, sIdx) => {
                const isSpoken = effectiveActiveSylIndex === syl.index;
                const isPast = effectiveActiveSylIndex !== null && syl.index < effectiveActiveSylIndex;
                const mixedTokClass =
                  effective.iastOrigin === 'mixed' && playbackTokenOrigins
                    ? playbackTokenOrigins.syllableOrigins[sIdx] === 'db-original'
                      ? 'prov-token-orig'
                      : 'prov-token-ref'
                    : '';
                return (
                  <span
                    key={`${verse.id}-iast-${syl.index}`}
                    ref={isSpoken ? activeInlineIastRef : null}
                    className={`inline-syl-token ${mixedTokClass} ${isSpoken ? 'active-spoken' : isPast ? 'past-spoken' : ''}`}
                    onClick={() => onPlaySyllable(syl.iast)}
                  >
                    {syl.iast}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="script-content-iast">
              {mixedIastSegments ? renderMixedSegments(mixedIastSegments, `${verse.id}-iast-mix`) : effective.iastText}
            </div>
          )}
        </div>
      )}

      {shouldShowLayer(config.showModernPhoneticZh, effective.modernPhoneticOrigin) && (
        <div className={`script-row ${rowClassForOrigin(effective.modernPhoneticOrigin)}`}>
          <span className="script-label" style={{ color: 'var(--accent-jade)' }}>
            <span>梵音拼读</span>
            <ProvenanceBadge state={effective.modernPhoneticOrigin} field="modernPhoneticZh" compact />
          </span>
          {isVersePlaying && enrichedSyllables.length > 0 && canUseInlineModernSyllables ? (
            <div className="script-content-phonetic-zh inline-syl-strip">
              {enrichedSyllables.map((syl, sIdx) => {
                const isSpoken = effectiveActiveSylIndex === syl.index;
                const isPast = effectiveActiveSylIndex !== null && syl.index < effectiveActiveSylIndex;
                const isLastSyl = sIdx === enrichedSyllables.length - 1;
                return (
                  <React.Fragment key={`${verse.id}-mod-${syl.index}`}>
                    <span
                      className={`inline-syl-token ${isSpoken ? 'active-spoken' : isPast ? 'past-spoken' : ''}`}
                      onClick={() => onPlaySyllable(syl.iast)}
                    >
                      <PhoneticText
                        text={config.showPhoneticIastBracket ? `${syl.modernZh}(${syl.iast})` : syl.modernZh}
                      />
                    </span>
                    {syl.dandaAfter && !isLastSyl && (
                      <span style={{ opacity: 0.55, padding: '0 0.15rem' }}>{syl.dandaAfter}</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          ) : (
            <div className="script-content-phonetic-zh">
              <PhoneticText text={effective.modernPhoneticZh} />
            </div>
          )}
        </div>
      )}

      {shouldShowLayer(config.showClassicalZh, effective.classicalTranslitOrigin) && (
        <div className={`script-row ${rowClassForOrigin(effective.classicalTranslitOrigin)}`}>
          <span className="script-label" style={{ color: 'var(--accent-vermilion)' }}>
            <span>古汉语音译</span>
            <ProvenanceBadge state={effective.classicalTranslitOrigin} field="classicalTranslitZh" compact />
          </span>
          <div className="script-content-classical-zh">{effective.classicalTranslitZh}</div>
        </div>
      )}

      {shouldShowLayer(config.showIpa, effective.ipaOrigin) && (
        <div className="script-row is-reference-row">
          <span className="script-label">
            <span>国际音标</span>
            <ProvenanceBadge state={effective.ipaOrigin} field="ipa" compact />
          </span>
          <div className="script-content-ipa">/{effective.ipaText}/</div>
        </div>
      )}

      {shouldShowLayer(config.showProsodyMeter, effective.prosodyOrigin) && enrichedSyllables.length > 0 && (
        <div className="prosody-syllables-strip">
          {enrichedSyllables.map((syl) => {
            const isSpoken = isVersePlaying && effectiveActiveSylIndex === syl.index;
            const isPast = isVersePlaying && effectiveActiveSylIndex !== null && syl.index < effectiveActiveSylIndex;
            return (
              <button
                key={`${verse.id}-syl-${syl.index}`}
                ref={isSpoken ? activePillRef : null}
                type="button"
                className={`syllable-pill ${syl.weight} ${isSpoken ? 'active-spoken' : isPast ? 'past-spoken' : ''}`}
                onClick={() => onPlaySyllable(syl.iast)}
              >
                <span className="syl-meter">{syl.weight === 'guru' ? '—' : '⌣'}</span>
                <span className="syl-iast">{syl.iast}</span>
                <span className="syl-modern-zh"><PhoneticText text={syl.modernZh} /></span>
                <span className="syl-tang-zh">{syl.classicalZh}</span>
                <span className="syl-ipa">[{syl.ipa}]</span>
              </button>
            );
          })}
        </div>
      )}

      {(shouldShowLayer(config.showMeaningZh, effective.meaningZhOrigin) ||
        shouldShowLayer(config.showMeaningEn, effective.meaningEnOrigin)) && (
        <div className="translit-meaning-grid">
          {shouldShowLayer(config.showMeaningZh, effective.meaningZhOrigin) && (
            <div className={`translit-box meaning-zh ${effective.meaningZhOrigin === 'db-original' ? 'is-original-box' : 'is-reference-box'}`}>
              <div className="box-mini-label">
                <span>汉文释义</span>
                <ProvenanceBadge state={effective.meaningZhOrigin} field="meaningZh" compact />
              </div>
              <div className="box-text-zh">{effective.meaningZh}</div>
            </div>
          )}

          {shouldShowLayer(config.showMeaningEn, effective.meaningEnOrigin) && (
            <div className={`translit-box meaning-en ${effective.meaningEnOrigin === 'db-original' ? 'is-original-box' : 'is-reference-box'}`}>
              <div className="box-mini-label">
                <span>English</span>
                <ProvenanceBadge state={effective.meaningEnOrigin} field="meaningEn" compact />
              </div>
              <div className="box-text-en">{effective.meaningEn}</div>
            </div>
          )}
        </div>
      )}

      {config.showWordGloss && wordsResult.words.length > 0 && (
        <div className="word-gloss-grid">
          {wordsResult.words.map((w, idx) => (
            <div
              key={`${verse.id}-w-${idx}`}
              className={`word-gloss-card ${w.origin === 'db-original' ? 'is-original-card' : 'is-reference-card'}`}
              onClick={() => onPlaySyllable(w.iast)}
              style={{ cursor: 'pointer' }}
            >
              <div className="wg-top">
                <span className="wg-iast">{w.iast}</span>
                {w.grammar && <span className="wg-grammar">{w.grammar}</span>}
              </div>
              <div className="wg-translit">古音：<PhoneticText text={w.transliterationZh} /></div>
              <div className="wg-meaning">{w.meaningZh}</div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
};
