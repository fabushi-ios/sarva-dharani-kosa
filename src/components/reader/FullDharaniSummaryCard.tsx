import React, { useMemo, useState } from 'react';
import { Copy, Check, Layers, Sparkles } from 'lucide-react';
import type { DharaniEntry, ScriptVisibilityConfig } from '../../types/kosaTypes';
import {
  isClassicalChineseOnlyEntry,
  resolveEffectiveVerseFields,
  resolveVerseMixedSegments,
  summarizeEntryFieldProvenance,
  type EntryFieldOriginState,
  type MixedSegmentableField,
} from '../../core/provenance/fieldProvenance';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { PhoneticText } from '../common/PhoneticText';

interface FullDharaniSummaryCardProps {
  entry: DharaniEntry;
  config: ScriptVisibilityConfig;
  activeVerseIndex?: number | null;
  onPlayVerse?: (verseArrayIdx: number) => void;
  onToggleBracketIast: () => void;
}

function originCopyTag(state: EntryFieldOriginState): string {
  if (state === 'db-original') return '库藏原文';
  if (state === 'mixed') return '原载+补全参考';
  return '处理参考';
}

function rowOriginClass(state: EntryFieldOriginState): string {
  if (state === 'db-original') return 'is-original-row';
  if (state === 'mixed') return 'is-mixed-row';
  return 'is-reference-row';
}

export const FullDharaniSummaryCard: React.FC<FullDharaniSummaryCardProps> = ({
  entry,
  config,
  activeVerseIndex = null,
  onPlayVerse,
  onToggleBracketIast,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const chineseOnlyEntry = useMemo(() => isClassicalChineseOnlyEntry(entry), [entry]);
  const provSummary = useMemo(() => summarizeEntryFieldProvenance(entry), [entry]);

  const combined = useMemo(() => {
    if (!config.showFullCombinedSummary) {
      return {
        siddhamList: [] as string[],
        modernPhoneticList: [] as string[],
        devanagariList: [] as string[],
        iastList: [] as string[],
        classicalZhList: [] as string[],
        ipaList: [] as string[],
        meaningZhList: [] as string[],
        meaningEnList: [] as string[],
        siddhamFull: '',
        modernPhoneticFull: '',
        devanagariFull: '',
        iastFull: '',
        classicalZhFull: '',
        ipaFull: '',
        meaningZhFull: '',
        meaningEnFull: '',
      };
    }

    if (chineseOnlyEntry) {
      const classicalZhList = entry.verses
        .map((v) => v.classicalTranslitZh?.trim() || '')
        .filter(Boolean);
      return {
        siddhamList: [] as string[],
        modernPhoneticList: [] as string[],
        devanagariList: [] as string[],
        iastList: [] as string[],
        classicalZhList,
        ipaList: [] as string[],
        meaningZhList: [] as string[],
        meaningEnList: [] as string[],
        siddhamFull: '',
        modernPhoneticFull: '',
        devanagariFull: '',
        iastFull: '',
        classicalZhFull: classicalZhList.join(' ｜ '),
        ipaFull: '',
        meaningZhFull: '',
        meaningEnFull: '',
      };
    }

    const siddhamList: string[] = [];
    const modernPhoneticList: string[] = [];
    const devanagariList: string[] = [];
    const iastList: string[] = [];
    const classicalZhList: string[] = [];
    const ipaList: string[] = [];
    const meaningZhList: string[] = [];
    const meaningEnList: string[] = [];

    for (const v of entry.verses) {
      const eff = resolveEffectiveVerseFields(v, config.showPhoneticIastBracket);
      if (config.showSiddham) siddhamList.push(eff.siddhamText);
      if (config.showModernPhoneticZh) modernPhoneticList.push(eff.modernPhoneticZh);
      if (config.showDevanagari) devanagariList.push(eff.devanagariText);
      if (config.showIast) iastList.push(eff.iastText);
      if (config.showClassicalZh) classicalZhList.push(eff.classicalTranslitZh);
      if (config.showIpa) ipaList.push(eff.ipaText);
      if (config.showMeaningZh) meaningZhList.push(eff.meaningZh);
      if (config.showMeaningEn) meaningEnList.push(eff.meaningEn);
    }

    return {
      siddhamList,
      modernPhoneticList,
      devanagariList,
      iastList,
      classicalZhList,
      ipaList,
      meaningZhList,
      meaningEnList,
      siddhamFull: siddhamList.join('  '),
      modernPhoneticFull: modernPhoneticList.join(' ｜ '),
      devanagariFull: devanagariList.join(' । '),
      iastFull: iastList.join(' | '),
      classicalZhFull: classicalZhList.join(' ｜ '),
      ipaFull: ipaList.length > 0 ? `/${ipaList.join(' | ')}/` : '',
      meaningZhFull: meaningZhList.filter(Boolean).join(' ｜ '),
      meaningEnFull: meaningEnList.filter(Boolean).join(' | '),
    };
  }, [
    entry.verses,
    chineseOnlyEntry,
    config.showFullCombinedSummary,
    config.showSiddham,
    config.showModernPhoneticZh,
    config.showDevanagari,
    config.showIast,
    config.showClassicalZh,
    config.showIpa,
    config.showMeaningZh,
    config.showMeaningEn,
    config.showPhoneticIastBracket,
  ]);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  if (!config.showFullCombinedSummary) {
    return null;
  }

  if (chineseOnlyEntry) {
    const stoneTokens = entry.provenance.cbetaInterlinearTokens || [];
    return (
      <section
        id="full-dharani-combined-summary"
        className="verse-card is-chinese-phonetic-summary"
        aria-label="原典古汉语音译全文"
      >
        <div className="verse-card-header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          <div className="verse-index-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Layers size={15} color="var(--accent-vermilion)" />
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              原典古汉语音译全文（共 {entry.verses.length} 句 · 陀罗尼·梵音）
            </span>
          </div>

          <button
            id="copy-all-six-summary-btn"
            type="button"
            className="btn-scholarly"
            onClick={() => handleCopy('classical-only', combined.classicalZhFull)}
          >
            {copiedKey === 'classical-only' ? <Check size={13} /> : <Copy size={13} />}
            <span>{copiedKey === 'classical-only' ? '已复制音译全文' : '复制古汉音译'}</span>
          </button>
        </div>

        <div className="script-row is-original-row" style={{ alignItems: 'flex-start' }}>
          <span className="script-label" style={{ color: 'var(--accent-vermilion)' }}>
            <span>原典古汉音</span>
            <ProvenanceBadge state="db-original" field="classicalTranslitZh" compact />
          </span>
          <div
            className="script-content-classical-zh"
            style={{ lineHeight: 1.9, fontSize: '1.14rem', fontWeight: 500 }}
          >
            {combined.classicalZhFull}
          </div>
        </div>

        {stoneTokens.length > 0 && (
          <div className="script-row is-original-row" style={{ alignItems: 'flex-start' }}>
            <span className="script-label">
              <span>原刻悉昙夹注</span>
              <span className="prov-origin-badge is-original is-compact">
                ● 原典实载 {stoneTokens.length} 字
              </span>
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {stoneTokens.map((tok, i) => (
                  <span key={i} className="authentic-stone-token-pill">
                    {tok.siddham && (
                      <span className="siddham-glyph" style={{ fontSize: '1.15rem', color: 'var(--accent-vermilion)' }}>
                        {tok.siddham}
                      </span>
                    )}
                    {tok.iast && (
                      <span className="iast-text" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        ({tok.iast})
                      </span>
                    )}
                    <strong style={{ fontSize: '0.88rem' }}>＝ {tok.zh}</strong>
                  </span>
                ))}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                注：原典数据库于此处仅对个别生僻字附刻悉昙单字注音，未收录全咒完整梵文底本，故严格保留原典古文原貌，不作整句梵文反推。
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  const handleCopyAllSix = () => {
    const resolvedAll = entry.verses.map((v) =>
      resolveEffectiveVerseFields(v, config.showPhoneticIastBracket)
    );
    const siddhamFull = combined.siddhamFull || resolvedAll.map((r) => r.siddhamText).join('  ');
    const devanagariFull =
      combined.devanagariFull || resolvedAll.map((r) => r.devanagariText).join(' । ');
    const iastFull = combined.iastFull || resolvedAll.map((r) => r.iastText).join(' | ');
    const ipaFull = combined.ipaFull || `/${resolvedAll.map((r) => r.ipaText).join(' | ')}/`;
    const modernFull =
      combined.modernPhoneticFull || resolvedAll.map((r) => r.modernPhoneticZh).join(' ｜ ');
    const classicalFull =
      combined.classicalZhFull || resolvedAll.map((r) => r.classicalTranslitZh).join(' ｜ ');
    const meaningZhFull =
      combined.meaningZhFull || resolvedAll.map((r) => r.meaningZh).filter(Boolean).join(' ｜ ');
    const meaningEnFull =
      combined.meaningEnFull || resolvedAll.map((r) => r.meaningEn).filter(Boolean).join(' | ');

    const allText = [
      `《${entry.titleZh}》(${entry.taishoNo}) 全咒汇总（共 ${entry.verses.length} 句）`,
      `【悉昙梵字 · ${originCopyTag(provSummary.byField.siddham)}】\n${siddhamFull}`,
      `【梵音拼读 · ${originCopyTag(provSummary.byField.modernPhoneticZh)}】\n${modernFull}`,
      `【天城梵文 · ${originCopyTag(provSummary.byField.devanagari)}】\n${devanagariFull}`,
      `【梵文 IAST · ${originCopyTag(provSummary.byField.iast)}】\n${iastFull}`,
      `【古汉语音译 · ${originCopyTag(provSummary.byField.classicalTranslitZh)}】\n${classicalFull}`,
      `【国际音标 IPA · ${originCopyTag(provSummary.byField.ipa)}】\n${ipaFull}`,
      ...(meaningZhFull ? [`【汉文义译】\n${meaningZhFull}`] : []),
      ...(meaningEnFull ? [`【English】\n${meaningEnFull}`] : []),
    ].join('\n\n');
    handleCopy('all-six', allText);
  };

  const canShowSummaryRow = (toggleOn: boolean, state: EntryFieldOriginState): boolean => {
    if (!toggleOn) return false;
    if (config.hideDerivedReference && state === 'derived-reference') return false;
    return true;
  };

  const renderSegmentedRow = (items: string[], separator: string, isPhoneticZh = false) =>
    items.map((text, idx) => {
      const v = entry.verses[idx];
      const isPlayingThis = activeVerseIndex !== null && v && v.index === activeVerseIndex;
      return (
        <React.Fragment key={v?.id || idx}>
          <span
            className={isPlayingThis ? 'inline-syl-token active-spoken' : ''}
            style={
              isPlayingThis
                ? { padding: '0.1rem 0.42rem', borderRadius: '5px', display: 'inline' }
                : onPlayVerse
                ? { cursor: 'pointer' }
                : undefined
            }
            onClick={() => onPlayVerse?.(idx)}
          >
            {isPhoneticZh ? <PhoneticText text={text} /> : text}
          </span>
          {idx < items.length - 1 ? <span>{separator}</span> : null}
        </React.Fragment>
      );
    });

  const renderMixedSummaryRow = (field: MixedSegmentableField, separator: string) => {
    const isPhoneticZh = field === 'modernPhoneticZh';
    const nonEmptyEntries = entry.verses
      .map((v, idx) => ({
        verse: v,
        idx,
        segments: resolveVerseMixedSegments(v, field, config.showPhoneticIastBracket),
      }))
      .filter((item) => item.segments.length > 0);

    return nonEmptyEntries.map(({ verse: v, idx, segments }, listPos) => {
      const isPlayingThis = activeVerseIndex !== null && v.index === activeVerseIndex;
      return (
        <React.Fragment key={`${v.id}-${field}`}>
          <span
            className={isPlayingThis ? 'inline-syl-token active-spoken' : ''}
            onClick={() => onPlayVerse?.(idx)}
          >
            {segments.map((seg, sIdx) => (
              <span
                key={`${v.id}-${field}-seg-${sIdx}`}
                className={seg.origin === 'db-original' ? 'prov-seg-orig' : 'prov-seg-ref'}
              >
                {isPhoneticZh ? <PhoneticText text={seg.text} /> : seg.text}
              </span>
            ))}
          </span>
          {listPos < nonEmptyEntries.length - 1 ? (
            <span style={{ color: 'var(--text-muted)' }}>{separator}</span>
          ) : null}
        </React.Fragment>
      );
    });
  };

  const renderSummaryFieldContent = (
    field: MixedSegmentableField,
    state: EntryFieldOriginState,
    plainList: string[],
    plainFull: string,
    separator: string
  ) => {
    const isPhoneticZh = field === 'modernPhoneticZh';
    if (state === 'mixed') return renderMixedSummaryRow(field, separator);
    if (activeVerseIndex !== null) return renderSegmentedRow(plainList, separator, isPhoneticZh);
    return isPhoneticZh ? <PhoneticText text={plainFull} /> : plainFull;
  };

  return (
    <section
      id="full-dharani-combined-summary"
      className="verse-card"
      style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}
      aria-label="全咒多体汇总"
    >
      <div className="verse-card-header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <div className="verse-index-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Layers size={15} color="var(--accent-vermilion)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            全咒汇总（共 {entry.verses.length} 句 · 陀罗尼·梵文）
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <button
            id="summary-toggle-bracket-iast-btn"
            type="button"
            className={`btn-scholarly ${config.showPhoneticIastBracket ? 'gold' : ''}`}
            onClick={onToggleBracketIast}
          >
            <Sparkles size={13} />
            <span>拼读附括号(IAST)：{config.showPhoneticIastBracket ? '开' : '关'}</span>
          </button>

          <button
            id="copy-all-six-summary-btn"
            type="button"
            className="btn-scholarly"
            onClick={handleCopyAllSix}
          >
            {copiedKey === 'all-six' ? <Check size={13} /> : <Copy size={13} />}
            <span>{copiedKey === 'all-six' ? '已复制全文' : '复制全咒'}</span>
          </button>
        </div>
      </div>

      {canShowSummaryRow(config.showSiddham, provSummary.byField.siddham) && (
        <div className={`script-row ${rowOriginClass(provSummary.byField.siddham)}`} style={{ alignItems: 'flex-start' }}>
          <span className="script-label">
            <span>悉昙梵字</span>
            <ProvenanceBadge state={provSummary.byField.siddham} field="siddham" compact />
          </span>
          <div className="script-content-siddham" style={{ lineHeight: 1.85 }}>
            {renderSummaryFieldContent('siddham', provSummary.byField.siddham, combined.siddhamList, combined.siddhamFull, '  ')}
          </div>
        </div>
      )}

      {canShowSummaryRow(config.showModernPhoneticZh, provSummary.byField.modernPhoneticZh) && (
        <div className={`script-row ${rowOriginClass(provSummary.byField.modernPhoneticZh)}`} style={{ alignItems: 'flex-start' }}>
          <span className="script-label" style={{ color: 'var(--accent-jade)' }}>
            <span>梵音拼读</span>
            <ProvenanceBadge state={provSummary.byField.modernPhoneticZh} field="modernPhoneticZh" compact />
          </span>
          <div className="script-content-phonetic-zh" style={{ lineHeight: 1.75 }}>
            {renderSummaryFieldContent('modernPhoneticZh', provSummary.byField.modernPhoneticZh, combined.modernPhoneticList, combined.modernPhoneticFull, ' ｜ ')}
          </div>
        </div>
      )}

      {canShowSummaryRow(config.showDevanagari, provSummary.byField.devanagari) && (
        <div className={`script-row ${rowOriginClass(provSummary.byField.devanagari)}`} style={{ alignItems: 'flex-start' }}>
          <span className="script-label">
            <span>天城梵文</span>
            <ProvenanceBadge state={provSummary.byField.devanagari} field="devanagari" compact />
          </span>
          <div className="script-content-devanagari" style={{ lineHeight: 1.75 }}>
            {renderSummaryFieldContent('devanagari', provSummary.byField.devanagari, combined.devanagariList, combined.devanagariFull, ' । ')}
          </div>
        </div>
      )}

      {canShowSummaryRow(config.showIast, provSummary.byField.iast) && (
        <div className={`script-row ${rowOriginClass(provSummary.byField.iast)}`} style={{ alignItems: 'flex-start' }}>
          <span className="script-label">
            <span>梵文 IAST</span>
            <ProvenanceBadge state={provSummary.byField.iast} field="iast" compact />
          </span>
          <div className="script-content-iast" style={{ lineHeight: 1.65 }}>
            {renderSummaryFieldContent('iast', provSummary.byField.iast, combined.iastList, combined.iastFull, ' | ')}
          </div>
        </div>
      )}

      {canShowSummaryRow(config.showClassicalZh, provSummary.byField.classicalTranslitZh) && (
        <div className={`script-row ${rowOriginClass(provSummary.byField.classicalTranslitZh)}`} style={{ alignItems: 'flex-start' }}>
          <span className="script-label" style={{ color: 'var(--accent-vermilion)' }}>
            <span>古汉语音译</span>
            <ProvenanceBadge state={provSummary.byField.classicalTranslitZh} field="classicalTranslitZh" compact />
          </span>
          <div className="script-content-classical-zh" style={{ lineHeight: 1.75 }}>
            {renderSummaryFieldContent('classicalTranslitZh', provSummary.byField.classicalTranslitZh, combined.classicalZhList, combined.classicalZhFull, ' ｜ ')}
          </div>
        </div>
      )}

      {canShowSummaryRow(config.showIpa, provSummary.byField.ipa) && (
        <div className={`script-row ${rowOriginClass(provSummary.byField.ipa)}`} style={{ alignItems: 'flex-start' }}>
          <span className="script-label">
            <span>国际音标</span>
            <ProvenanceBadge state={provSummary.byField.ipa} field="ipa" compact />
          </span>
          <div className="script-content-ipa" style={{ lineHeight: 1.65 }}>
            {combined.ipaFull}
          </div>
        </div>
      )}

      {canShowSummaryRow(config.showMeaningZh, provSummary.byField.meaningZh) && combined.meaningZhFull && (
        <div className={`script-row ${rowOriginClass(provSummary.byField.meaningZh)}`} style={{ alignItems: 'flex-start' }}>
          <span className="script-label" style={{ color: 'var(--accent-gold)' }}>
            <span>汉文释义</span>
            <ProvenanceBadge state={provSummary.byField.meaningZh} field="meaningZh" compact />
          </span>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.7 }}>
            {combined.meaningZhFull}
          </div>
        </div>
      )}

      {canShowSummaryRow(config.showMeaningEn, provSummary.byField.meaningEn) && combined.meaningEnFull && (
        <div className={`script-row ${rowOriginClass(provSummary.byField.meaningEn)}`} style={{ alignItems: 'flex-start' }}>
          <span className="script-label">
            <span>英文释义</span>
            <ProvenanceBadge state={provSummary.byField.meaningEn} field="meaningEn" compact />
          </span>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            {combined.meaningEnFull}
          </div>
        </div>
      )}
    </section>
  );
};
