import React, { useMemo, useEffect, useRef } from 'react';
import { Volume2, Sparkles } from 'lucide-react';
import type { DharaniVerse, ScriptVisibilityConfig } from '../../types/kosaTypes';
import { iastToDevanagari, iastToSiddham } from '../../core/sanskrit/transliterator';
import { analyzeSanskritProsody } from '../../core/sanskrit/prosody';
import {
  enrichSyllablesWithPhonetics,
  generateVerseChinesePhonetics,
} from '../../core/sanskrit/phoneticMapper';
import {
  resolveEffectiveVerseFields,
  resolveEffectiveWordGlosses,
  resolveVerseMixedSegments,
  resolveVersePlaybackTokenOrigins,
  type EntryFieldOriginState,
  type ProvenanceTextSegment,
} from '../../core/provenance/fieldProvenance';
import { sanskritAudioEngine } from '../../services/audio/sanskritAudioEngine';
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
  const effective = useMemo(
    () => resolveEffectiveVerseFields(verse, config.showPhoneticIastBracket),
    [verse, config.showPhoneticIastBracket]
  );

  const syllables = useMemo(() => analyzeSanskritProsody(verse.iast), [verse.iast]);

  // Check if verse's concrete modernPhoneticZh matches syllable engine output 1-to-1 (so syllable-by-syllable karaoke never alters hand-crafted text)
  const canUseInlineModernSyllables = useMemo(() => {
    const concrete = (verse.modernPhoneticZh || '').trim();
    if (!concrete) return true;
    const autoPlain = generateVerseChinesePhonetics(verse.iast, false).modernPhoneticZh;
    return concrete === autoPlain;
  }, [verse.iast, verse.modernPhoneticZh]);

  const rowClassForOrigin = (origin: EntryFieldOriginState): string =>
    origin === 'db-original'
      ? 'is-original-row'
      : origin === 'mixed'
      ? 'is-mixed-row'
      : 'is-reference-row';

  const wordsResult = useMemo(() => {
    if (!config.showWordGloss) {
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
  }, [config.showWordGloss, config.hideDerivedReference, verse]);

  const shouldShowLayer = (enabled: boolean, origin: EntryFieldOriginState): boolean =>
    enabled && (!config.hideDerivedReference || origin !== 'derived-reference');

  // Enrich each syllable with full inter-syllable Sandhi, Abhinidhāna, Parasavarṇa & Samāsa context
  const enrichedSyllables = useMemo(
    () => enrichSyllablesWithPhonetics(syllables),
    [syllables]
  );

  // Group syllables by orthographic subword for Brahmi scripts (Siddhaṃ & Devanāgarī) so OpenType GSUB
  // conjunct ligatures (e.g. padmo -> 𑖢𑖟𑖿𑖦𑖺, maṇḍala -> 𑖦𑖜𑖿𑖚𑖩, buddha -> 𑖤𑖲𑖟𑖿𑖠) stay 100% intact during playback
  const enrichedSubwords = useMemo(() => {
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
  }, [enrichedSyllables]);

  const mixedSiddhamSegments = useMemo(
    () =>
      effective.siddhamOrigin === 'mixed'
        ? resolveVerseMixedSegments(verse, 'siddham', config.showPhoneticIastBracket)
        : null,
    [verse, effective.siddhamOrigin, config.showPhoneticIastBracket]
  );

  const mixedDevanagariSegments = useMemo(
    () =>
      effective.devanagariOrigin === 'mixed'
        ? resolveVerseMixedSegments(verse, 'devanagari', config.showPhoneticIastBracket)
        : null,
    [verse, effective.devanagariOrigin, config.showPhoneticIastBracket]
  );

  const mixedIastSegments = useMemo(
    () =>
      effective.iastOrigin === 'mixed'
        ? resolveVerseMixedSegments(verse, 'iast', config.showPhoneticIastBracket)
        : null,
    [verse, effective.iastOrigin, config.showPhoneticIastBracket]
  );

  const hasAnyMixedPlaybackLayer =
    effective.siddhamOrigin === 'mixed' ||
    effective.devanagariOrigin === 'mixed' ||
    effective.iastOrigin === 'mixed';

  const playbackTokenOrigins = useMemo(
    () =>
      isVersePlaying && hasAnyMixedPlaybackLayer
        ? resolveVersePlaybackTokenOrigins(
            verse,
            enrichedSubwords.map((sw) => sw.iast),
            enrichedSyllables.map((s) => s.iast)
          )
        : null,
    [isVersePlaying, hasAnyMixedPlaybackLayer, verse, enrichedSubwords, enrichedSyllables]
  );

  const renderMixedSegments = (segments: ProvenanceTextSegment[], keyPrefix: string) =>
    segments.map((seg, idx) => (
      <span
        key={`${keyPrefix}-${idx}`}
        className={seg.origin === 'db-original' ? 'prov-seg-orig' : 'prov-seg-ref'}
        title={
          seg.origin === 'db-original'
            ? '● 原典原载内容（与左侧徽章「原载」同色）'
            : '◇ 系统补全/转写参考（与左侧徽章「参考」同色）'
        }
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
          onMouseEnter={() => sanskritAudioEngine.prewarmSingleVerse(verse)}
          onFocus={() => sanskritAudioEngine.prewarmSingleVerse(verse)}
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
                      <PhoneticText text={activeSyl.modernZh} />
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

      {/* 若数据库收录藏文/尼瓦尔/婆罗谜等外交原貌底本，直接原貌呈现并标明原典原载 */}
      {verse.diplomaticOriginal && (
        <div className="script-row is-original-row">
          <span className="script-label" style={{ color: 'var(--accent-lapis)' }}>
            <span>写本原貌</span>
            <ProvenanceBadge
              state="db-original"
              compact
              customTooltip="【库藏原文】此行为原数据库收录之藏文/尼瓦尔/西域写卷外交释读原文。"
            />
          </span>
          <div
            className="script-content-iast"
            style={{
              padding: '0.28rem 0.62rem',
              background: 'var(--accent-lapis-soft)',
              borderRadius: 'var(--radius-xs)',
              borderLeft: '3.5px solid var(--accent-lapis)',
            }}
          >
            {verse.diplomaticOriginal}
          </div>
        </div>
      )}

      {/* Parallel Multi-Script & Chinese Phonetic / Classical Transliteration Alignment */}
      {shouldShowLayer(config.showSiddham, effective.siddhamOrigin) && (
        <div className={`script-row ${rowClassForOrigin(effective.siddhamOrigin)}`}>
          <span className="script-label">
            <span>悉昙梵字</span>
            <ProvenanceBadge
              state={effective.siddhamOrigin}
              field="siddham"
              compact
              customLabel={
                effective.siddhamOrigin === 'db-original'
                  ? '● 原典原载'
                  : effective.siddhamOrigin === 'mixed'
                  ? '◐ 原载+参考'
                  : '◇ 转写参考'
              }
            />
          </span>
          {isVersePlaying &&
          enrichedSubwords.length > 0 &&
          (effective.siddhamOrigin === 'derived-reference' ||
            effective.siddhamOrigin === 'mixed') ? (
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
                        {sw.dandaBefore === '||' ? '𑗃' : '𑗂'}
                      </span>
                    )}
                    <span
                      className={`inline-syl-token ${mixedTokClass} ${isSpoken ? 'active-spoken' : isPast ? 'past-spoken' : ''}`}
                      onClick={() => onPlaySyllable(sw.iast)}
                      title={`点击发音: ${sw.iast} (${sw.modernZh})`}
                    >
                      {sw.siddham}
                    </span>
                    {sw.dandaAfter && !isLastSw && (
                      <span style={{ opacity: 0.65, padding: '0 0.18rem' }}>
                        {sw.dandaAfter === '||' ? '𑗃' : '𑗂'}
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          ) : (
            <div className="script-content-siddham">
              {mixedSiddhamSegments
                ? renderMixedSegments(mixedSiddhamSegments, `${verse.id}-sid-mix`)
                : effective.siddhamText}
            </div>
          )}
        </div>
      )}

      {shouldShowLayer(config.showDevanagari, effective.devanagariOrigin) && (
        <div className={`script-row ${rowClassForOrigin(effective.devanagariOrigin)}`}>
          <span className="script-label">
            <span>天城梵文</span>
            <ProvenanceBadge
              state={effective.devanagariOrigin}
              field="devanagari"
              compact
              customLabel={
                effective.devanagariOrigin === 'db-original'
                  ? '● 原典原载'
                  : effective.devanagariOrigin === 'mixed'
                  ? '◐ 原载+参考'
                  : '◇ 转写参考'
              }
            />
          </span>
          {isVersePlaying &&
          enrichedSubwords.length > 0 &&
          (effective.devanagariOrigin === 'derived-reference' ||
            effective.devanagariOrigin === 'mixed') ? (
            <div className="script-content-devanagari inline-syl-strip">
              {enrichedSubwords.map((sw, swIdx) => {
                const isSpoken =
                  effectiveActiveSylIndex !== null &&
                  effectiveActiveSylIndex >= sw.firstSylIndex &&
                  effectiveActiveSylIndex <= sw.lastSylIndex;
                const isPast =
                  effectiveActiveSylIndex !== null && sw.lastSylIndex < effectiveActiveSylIndex;
                const isLastSw = swIdx === enrichedSubwords.length - 1;
                const mixedTokClass =
                  effective.devanagariOrigin === 'mixed' && playbackTokenOrigins
                    ? playbackTokenOrigins.subwordOrigins[swIdx] === 'db-original'
                      ? 'prov-token-orig'
                      : 'prov-token-ref'
                    : '';
                return (
                  <React.Fragment key={`${verse.id}-deva-sw-${sw.key}`}>
                    {sw.dandaBefore && (
                      <span style={{ opacity: 0.65, padding: '0 0.18rem' }}>
                        {sw.dandaBefore === '||' ? '॥' : '।'}
                      </span>
                    )}
                    <span
                      className={`inline-syl-token ${mixedTokClass} ${isSpoken ? 'active-spoken' : isPast ? 'past-spoken' : ''}`}
                      onClick={() => onPlaySyllable(sw.iast)}
                      title={`点击发音: ${sw.iast} (${sw.modernZh})`}
                    >
                      {sw.devanagari}
                    </span>
                    {sw.dandaAfter && !isLastSw && (
                      <span style={{ opacity: 0.65, padding: '0 0.18rem' }}>
                        {sw.dandaAfter === '||' ? '॥' : '।'}
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          ) : (
            <div className="script-content-devanagari">
              {mixedDevanagariSegments
                ? renderMixedSegments(mixedDevanagariSegments, `${verse.id}-deva-mix`)
                : effective.devanagariText}
            </div>
          )}
        </div>
      )}

      {shouldShowLayer(config.showIast, effective.iastOrigin) && (
        <div className={`script-row ${rowClassForOrigin(effective.iastOrigin)}`}>
          <span className="script-label">
            <span>梵文 IAST</span>
            <ProvenanceBadge
              state={effective.iastOrigin}
              field="iast"
              compact
              customLabel={
                effective.iastOrigin === 'db-original'
                  ? '● 原典原载'
                  : effective.iastOrigin === 'mixed'
                  ? '◐ 原载+参考'
                  : '◇ 重构参考'
              }
            />
          </span>
          {isVersePlaying && enrichedSyllables.length > 0 ? (
            <div className="script-content-iast inline-syl-strip">
              {enrichedSyllables.map((syl, sIdx) => {
                const isSpoken = effectiveActiveSylIndex === syl.index;
                const isPast =
                  effectiveActiveSylIndex !== null && syl.index < effectiveActiveSylIndex;
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
                    title={`点击发音: ${syl.iast} (${syl.modernZh})`}
                  >
                    {syl.iast}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="script-content-iast">
              {mixedIastSegments
                ? renderMixedSegments(mixedIastSegments, `${verse.id}-iast-mix`)
                : effective.iastText}
            </div>
          )}
        </div>
      )}

      {/* 梵音拼读：现代汉语音近辅助拼读统一标为「处理参考」并完整保留既有拼读文本 */}
      {shouldShowLayer(config.showModernPhoneticZh, effective.modernPhoneticOrigin) && (
        <div className={`script-row ${rowClassForOrigin(effective.modernPhoneticOrigin)}`}>
          <span className="script-label" style={{ color: 'var(--accent-jade)' }}>
            <span>
              {effective.modernPhoneticOrigin === 'db-original' ? '梵音拼读' : '梵音拼读参考'}
            </span>
            <ProvenanceBadge
              state={effective.modernPhoneticOrigin}
              field="modernPhoneticZh"
              compact
            />
          </span>
          {isVersePlaying && enrichedSyllables.length > 0 && canUseInlineModernSyllables ? (
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
                      <PhoneticText
                        text={
                          config.showPhoneticIastBracket
                            ? `${syl.modernZh}(${syl.iast})`
                            : syl.modernZh
                        }
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
            <span>
              {effective.classicalTranslitOrigin === 'db-original'
                ? '古汉语音译'
                : '古音拟音参考'}
            </span>
            <ProvenanceBadge
              state={effective.classicalTranslitOrigin}
              field="classicalTranslitZh"
              compact
            />
          </span>
          {isVersePlaying &&
          enrichedSyllables.length > 0 &&
          effective.classicalTranslitOrigin === 'derived-reference' ? (
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
                    title={`梵音: ${syl.iast} · 古汉语参考: ${syl.classicalZh}`}
                  >
                    {syl.classicalZh}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="script-content-classical-zh">{effective.classicalTranslitZh}</div>
          )}
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

      {/* 逐音节五层对齐卡：摩多轻重 + 梵文 IAST + 梵音拼读 + 古汉语 + IPA */}
      {shouldShowLayer(config.showProsodyMeter, effective.prosodyOrigin) &&
        enrichedSyllables.length > 0 && (
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                marginBottom: '0.35rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <strong>逐音节三体对照跟读卡</strong>
                <ProvenanceBadge
                  state={effective.prosodyOrigin}
                  field="prosody"
                  compact
                  customLabel="◇ 声韵切分·参考"
                />
                <span>
                  （每格自上而下：轻重拍 · <strong>梵文</strong> ·{' '}
                  <strong style={{ color: 'var(--accent-jade)' }}>拼读参考</strong> ·{' '}
                  <strong style={{ color: 'var(--accent-vermilion)' }}>古音参考</strong> · IPA，点击单字发声）
                </span>
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
                    title={`梵音: ${syl.iast} [${syl.ipa}]${syl.wordIast ? ` (所属词: ${syl.wordIast})` : ''} | 拼读参考: ${syl.modernZh} | 古音参考: ${syl.classicalZh} | ${
                      syl.weight === 'guru' ? 'Guru 重音 (2摩多)' : 'Laghu 轻音 (1摩多)'
                    }`}
                  >
                    <span className="syl-meter">{syl.weight === 'guru' ? '—' : '⌣'}</span>
                    <span className="syl-iast">{syl.iast}</span>
                    <span className="syl-modern-zh" title="单音节拼读参考">
                      <PhoneticText text={syl.modernZh} />
                    </span>
                    <span className="syl-tang-zh" title="单音节古音参考">
                      {syl.classicalZh}
                    </span>
                    <span className="syl-ipa">[{syl.ipa}]</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      {(shouldShowLayer(config.showMeaningZh, effective.meaningZhOrigin) ||
        shouldShowLayer(config.showMeaningEn, effective.meaningEnOrigin)) && (
        <div className="translit-meaning-grid">
          {shouldShowLayer(config.showMeaningZh, effective.meaningZhOrigin) && (
            <div
              className={`translit-box meaning-zh ${
                effective.meaningZhOrigin === 'db-original'
                  ? 'is-original-box'
                  : effective.meaningZhOrigin === 'mixed'
                  ? 'is-mixed-box'
                  : 'is-reference-box'
              }`}
            >
              <div
                className="box-mini-label"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.4rem',
                  flexWrap: 'wrap',
                }}
              >
                <span>
                  {effective.meaningZhOrigin === 'db-original'
                    ? '本句汉文意译（数据库原载）'
                    : effective.meaningZhOrigin === 'mixed'
                    ? '本句汉文意译（原载+参考）'
                    : '本句汉文拟译参考（辞典推导）'}
                </span>
                <ProvenanceBadge
                  state={effective.meaningZhOrigin}
                  field="meaningZh"
                  compact
                  customLabel={
                    effective.meaningZhOrigin === 'db-original'
                      ? '● 原典原载'
                      : effective.meaningZhOrigin === 'mixed'
                      ? '◐ 原载+参考'
                      : '◇ 拟译参考'
                  }
                />
              </div>
              <div className="box-text-zh">{effective.meaningZh}</div>
            </div>
          )}

          {shouldShowLayer(config.showMeaningEn, effective.meaningEnOrigin) && (
            <div
              className={`translit-box meaning-en ${
                effective.meaningEnOrigin === 'db-original'
                  ? 'is-original-box'
                  : effective.meaningEnOrigin === 'mixed'
                  ? 'is-mixed-box'
                  : 'is-reference-box'
              }`}
            >
              <div
                className="box-mini-label"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.4rem',
                  flexWrap: 'wrap',
                }}
              >
                <span>
                  {effective.meaningEnOrigin === 'db-original'
                    ? 'English Translation (Source Edition)'
                    : effective.meaningEnOrigin === 'mixed'
                    ? 'English Translation (Source + Reference)'
                    : 'English Gloss Reference (Lexicon Derived)'}
                </span>
                <ProvenanceBadge
                  state={effective.meaningEnOrigin}
                  field="meaningEn"
                  compact
                  customLabel={
                    effective.meaningEnOrigin === 'db-original'
                      ? '● 原典原载'
                      : effective.meaningEnOrigin === 'mixed'
                      ? '◐ 原载+参考'
                      : '◇ 拟译参考'
                  }
                />
              </div>
              <div className="box-text-en">{effective.meaningEn}</div>
            </div>
          )}
        </div>
      )}

      {config.showWordGloss && wordsResult.words.length > 0 && (
        <div>
          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              marginBottom: '0.3rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              flexWrap: 'wrap',
            }}
          >
            <span>逐词词根、古汉语音译与语法格位解析（Pada-ccheda &amp; Vyākaraṇa）：</span>
            <ProvenanceBadge state={wordsResult.sectionState} field="words" compact />
          </div>
          <div
            className={`word-gloss-grid ${
              wordsResult.sectionState === 'mixed' ? 'is-mixed-words' : ''
            }`}
          >
            {wordsResult.words.map((w, idx) => {
              const wordOrigin = w.origin || 'db-original';
              return (
                <div
                  key={`${verse.id}-w-${idx}`}
                  className={`word-gloss-card ${
                    wordOrigin === 'db-original' ? 'is-original-card' : 'is-reference-card'
                  }`}
                  onClick={() => onPlaySyllable(w.iast)}
                  style={{ cursor: 'pointer' }}
                  title="点击听取该梵文词发音"
                >
                  <div className="wg-top">
                    <span className="wg-iast">{w.iast}</span>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {w.grammar && <span className="wg-grammar">{w.grammar}</span>}
                      <ProvenanceBadge
                        state={wordOrigin}
                        compact
                        customLabel={wordOrigin === 'db-original' ? '● 原载' : '◇ 参考'}
                        customTooltip={
                          wordOrigin === 'db-original'
                            ? '【库藏原文】此词释义为数据库原载解析。'
                            : '【处理参考】原数据库未单列此词，由系统分词检索梵汉辞典自动生成，仅供参考。'
                        }
                      />
                    </div>
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
                  <div className="wg-translit">
                    古汉语：<PhoneticText text={w.transliterationZh} />
                  </div>
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
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
};
