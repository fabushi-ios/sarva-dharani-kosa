import React, { useMemo, useState } from 'react';
import { Copy, Check, Layers, Sparkles } from 'lucide-react';
import type { DharaniEntry, ScriptVisibilityConfig } from '../../types/kosaTypes';
import {
  resolveEffectiveVerseFields,
  resolveVerseMixedSegments,
  summarizeEntryFieldProvenance,
  type EntryFieldOriginState,
  type MixedSegmentableField,
} from '../../core/provenance/fieldProvenance';
import { ProvenanceBadge } from '../common/ProvenanceBadge';

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
  return '处理参考（仅供参考）';
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
      if (config.showSiddham) {
        siddhamList.push(eff.siddhamText);
      }
      if (config.showModernPhoneticZh) {
        modernPhoneticList.push(eff.modernPhoneticZh);
      }
      if (config.showDevanagari) {
        devanagariList.push(eff.devanagariText);
      }
      if (config.showIast) {
        iastList.push(eff.iastText);
      }
      if (config.showClassicalZh) {
        classicalZhList.push(eff.classicalTranslitZh);
      }
      if (config.showIpa) {
        ipaList.push(eff.ipaText);
      }
      if (config.showMeaningZh) {
        meaningZhList.push(eff.meaningZh);
      }
      if (config.showMeaningEn) {
        meaningEnList.push(eff.meaningEn);
      }
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
      `《${entry.titleZh}》(${entry.taishoNo}) 全咒六体与汉英义译汇总（共 ${entry.verses.length} 句）`,
      `【悉昙梵字 · ${originCopyTag(provSummary.byField.siddham)}】\n${siddhamFull}`,
      `【梵音拼读 · ${originCopyTag(provSummary.byField.modernPhoneticZh)}】\n${modernFull}`,
      `【天城梵文 · ${originCopyTag(provSummary.byField.devanagari)}】\n${devanagariFull}`,
      `【梵文 IAST · ${originCopyTag(provSummary.byField.iast)}】\n${iastFull}`,
      `【古汉语音译 · ${originCopyTag(provSummary.byField.classicalTranslitZh)}】\n${classicalFull}`,
      `【国际音标 IPA · ${originCopyTag(provSummary.byField.ipa)}】\n${ipaFull}`,
      `【全咒汉文义译 · ${originCopyTag(provSummary.byField.meaningZh)}】\n${meaningZhFull}`,
      `【Scholarly English Translation · ${originCopyTag(provSummary.byField.meaningEn)}】\n${meaningEnFull}`,
    ].join('\n\n');
    handleCopy('all-six', allText);
  };

  if (!config.showFullCombinedSummary) {
    return null;
  }

  const canShowSummaryRow = (toggleOn: boolean, state: EntryFieldOriginState): boolean => {
    if (!toggleOn) return false;
    if (config.hideDerivedReference && state === 'derived-reference') return false;
    return true;
  };

  const renderSegmentedRow = (items: string[], separator: string) =>
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
            title={v ? `点击定位并讽诵第 ${v.index} 句` : undefined}
          >
            {text}
          </span>
          {idx < items.length - 1 ? <span>{separator}</span> : null}
        </React.Fragment>
      );
    });

  const renderMixedSummaryRow = (field: MixedSegmentableField, separator: string) => {
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
            style={
              isPlayingThis
                ? { padding: '0.1rem 0.42rem', borderRadius: '5px', display: 'inline' }
                : onPlayVerse
                ? { cursor: 'pointer' }
                : undefined
            }
            onClick={() => onPlayVerse?.(idx)}
            title={`第 ${v.index} 句（点击讽诵）：朱砂色为原典原载，青金色为系统参考`}
          >
            {isPlayingThis
              ? segments.map((s) => s.text).join('')
              : segments.map((seg, sIdx) => (
                  <span
                    key={`${v.id}-${field}-seg-${sIdx}`}
                    className={seg.origin === 'db-original' ? 'prov-seg-orig' : 'prov-seg-ref'}
                  >
                    {seg.text}
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
    separator: string,
    alwaysSegmentByVerse = false
  ) => {
    if (state === 'mixed') {
      return renderMixedSummaryRow(field, separator);
    }
    if (activeVerseIndex !== null || alwaysSegmentByVerse) {
      return renderSegmentedRow(plainList, separator);
    }
    return plainFull;
  };

  return (
    <section
      id="full-dharani-combined-summary"
      className="verse-card"
      style={{
        border: '1.5px solid var(--accent-gold-border)',
        background:
          'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
      }}
      aria-label="全咒多句合一六体汇总总览"
    >
      <div className="verse-card-header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <div className="verse-index-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Layers size={15} color="var(--accent-vermilion)" />
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            全咒六体汇总总览（共 {entry.verses.length} 句合并全文 · 连贯讽诵版）
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            id="summary-toggle-bracket-iast-btn"
            type="button"
            className={`btn-scholarly ${config.showPhoneticIastBracket ? 'gold' : ''}`}
            onClick={onToggleBracketIast}
            title="开启或关闭梵音拼读中的括号 (IAST) 对照"
          >
            <Sparkles size={13} />
            <span>
              梵音拼读括号(IAST)：{config.showPhoneticIastBracket ? '已开启' : '已关闭'}
            </span>
          </button>

          <button
            id="copy-all-six-summary-btn"
            type="button"
            className="btn-scholarly"
            onClick={handleCopyAllSix}
            title="一键复制本咒全部六种文字汇总全文（含原文/参考来源标注）"
          >
            {copiedKey === 'all-six' ? <Check size={13} /> : <Copy size={13} />}
            <span>{copiedKey === 'all-six' ? '已复制六体全文' : '一键复制六体全文'}</span>
          </button>
        </div>
      </div>

      {/* 1. 汇总：悉昙梵字 */}
      {canShowSummaryRow(config.showSiddham, provSummary.byField.siddham) && (
        <div
          className={`script-row ${rowOriginClass(provSummary.byField.siddham)}`}
          style={{ alignItems: 'flex-start' }}
        >
          <span className="script-label">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>汇总·悉昙梵字</span>
              <button
                type="button"
                onClick={() => handleCopy('siddham', combined.siddhamFull)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '0.66rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
                title="复制全咒悉昙梵字"
              >
                {copiedKey === 'siddham' ? <Check size={11} /> : <Copy size={11} />}
              </button>
            </span>
            <ProvenanceBadge
              state={provSummary.byField.siddham}
              field="siddham"
              compact
              customLabel={
                provSummary.byField.siddham === 'db-original'
                  ? '● 原典原载'
                  : provSummary.byField.siddham === 'mixed'
                  ? '◐ 原载+参考'
                  : '◇ 转写参考'
              }
            />
          </span>
          <div className="script-content-siddham" style={{ lineHeight: 1.85 }}>
            {renderSummaryFieldContent(
              'siddham',
              provSummary.byField.siddham,
              combined.siddhamList,
              combined.siddhamFull,
              '  '
            )}
          </div>
        </div>
      )}

      {/* 2. 汇总：梵音拼读（数据库原有拼读优先保留，缺失时方作处理参考） */}
      {canShowSummaryRow(config.showModernPhoneticZh, provSummary.byField.modernPhoneticZh) && (
        <div
          className={`script-row ${rowOriginClass(provSummary.byField.modernPhoneticZh)}`}
          style={{ alignItems: 'flex-start' }}
        >
          <span className="script-label" style={{ color: 'var(--accent-jade)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>
                {provSummary.byField.modernPhoneticZh === 'db-original'
                  ? '汇总·梵音拼读'
                  : '汇总·拼读参考'}
              </span>
              <button
                type="button"
                onClick={() => handleCopy('modern', combined.modernPhoneticFull)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '0.66rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
                title="复制全咒梵音拼读"
              >
                {copiedKey === 'modern' ? <Check size={11} /> : <Copy size={11} />}
              </button>
            </span>
            <ProvenanceBadge
              state={provSummary.byField.modernPhoneticZh}
              field="modernPhoneticZh"
              compact
            />
          </span>
          <div className="script-content-phonetic-zh" style={{ lineHeight: 1.75 }}>
            {renderSummaryFieldContent(
              'modernPhoneticZh',
              provSummary.byField.modernPhoneticZh,
              combined.modernPhoneticList,
              combined.modernPhoneticFull,
              ' ｜ '
            )}
          </div>
        </div>
      )}

      {/* 3. 汇总：天城梵文 */}
      {canShowSummaryRow(config.showDevanagari, provSummary.byField.devanagari) && (
        <div
          className={`script-row ${rowOriginClass(provSummary.byField.devanagari)}`}
          style={{ alignItems: 'flex-start' }}
        >
          <span className="script-label">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>汇总·天城梵文</span>
              <button
                type="button"
                onClick={() => handleCopy('devanagari', combined.devanagariFull)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '0.66rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
                title="复制全咒天城梵文"
              >
                {copiedKey === 'devanagari' ? <Check size={11} /> : <Copy size={11} />}
              </button>
            </span>
            <ProvenanceBadge
              state={provSummary.byField.devanagari}
              field="devanagari"
              compact
              customLabel={
                provSummary.byField.devanagari === 'db-original'
                  ? '● 原典原载'
                  : provSummary.byField.devanagari === 'mixed'
                  ? '◐ 原载+参考'
                  : '◇ 转写参考'
              }
            />
          </span>
          <div className="script-content-devanagari" style={{ lineHeight: 1.75 }}>
            {renderSummaryFieldContent(
              'devanagari',
              provSummary.byField.devanagari,
              combined.devanagariList,
              combined.devanagariFull,
              ' । '
            )}
          </div>
        </div>
      )}

      {/* 4. 汇总：梵文 IAST */}
      {canShowSummaryRow(config.showIast, provSummary.byField.iast) && (
        <div
          className={`script-row ${rowOriginClass(provSummary.byField.iast)}`}
          style={{ alignItems: 'flex-start' }}
        >
          <span className="script-label">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>汇总·梵文 IAST</span>
              <button
                type="button"
                onClick={() => handleCopy('iast', combined.iastFull)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '0.66rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
                title="复制全咒梵文 IAST"
              >
                {copiedKey === 'iast' ? <Check size={11} /> : <Copy size={11} />}
              </button>
            </span>
            <ProvenanceBadge
              state={provSummary.byField.iast}
              field="iast"
              compact
              customLabel={
                provSummary.byField.iast === 'db-original'
                  ? '● 原典原载'
                  : provSummary.byField.iast === 'mixed'
                  ? '◐ 原载+参考'
                  : '◇ 重构参考'
              }
            />
          </span>
          <div className="script-content-iast" style={{ lineHeight: 1.65 }}>
            {renderSummaryFieldContent(
              'iast',
              provSummary.byField.iast,
              combined.iastList,
              combined.iastFull,
              ' | '
            )}
          </div>
        </div>
      )}

      {/* 5. 汇总：古汉语音译 */}
      {canShowSummaryRow(config.showClassicalZh, provSummary.byField.classicalTranslitZh) && (
        <div
          className={`script-row ${rowOriginClass(provSummary.byField.classicalTranslitZh)}`}
          style={{ alignItems: 'flex-start' }}
        >
          <span className="script-label" style={{ color: 'var(--accent-vermilion)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>汇总·古汉语音译</span>
              <button
                type="button"
                onClick={() => handleCopy('classical', combined.classicalZhFull)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '0.66rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
                title="复制全咒古汉语音译"
              >
                {copiedKey === 'classical' ? <Check size={11} /> : <Copy size={11} />}
              </button>
            </span>
            <ProvenanceBadge
              state={provSummary.byField.classicalTranslitZh}
              field="classicalTranslitZh"
              compact
            />
          </span>
          <div className="script-content-classical-zh" style={{ lineHeight: 1.75 }}>
            {renderSummaryFieldContent(
              'classicalTranslitZh',
              provSummary.byField.classicalTranslitZh,
              combined.classicalZhList,
              combined.classicalZhFull,
              ' ｜ '
            )}
          </div>
        </div>
      )}

      {/* 6. 汇总：国际音标 */}
      {canShowSummaryRow(config.showIpa, provSummary.byField.ipa) && (
        <div
          className={`script-row ${rowOriginClass(provSummary.byField.ipa)}`}
          style={{ alignItems: 'flex-start' }}
        >
          <span className="script-label">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>汇总·国际音标</span>
              <button
                type="button"
                onClick={() => handleCopy('ipa', combined.ipaFull)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '0.66rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
                title="复制全咒国际音标"
              >
                {copiedKey === 'ipa' ? <Check size={11} /> : <Copy size={11} />}
              </button>
            </span>
            <ProvenanceBadge state={provSummary.byField.ipa} field="ipa" compact />
          </span>
          <div className="script-content-ipa" style={{ lineHeight: 1.65 }}>
            {combined.ipaFull}
          </div>
        </div>
      )}

      {/* 7. 汇总：全咒汉文义译 */}
      {canShowSummaryRow(config.showMeaningZh, provSummary.byField.meaningZh) &&
        combined.meaningZhFull && (
          <div
            className={`script-row ${rowOriginClass(provSummary.byField.meaningZh)}`}
            style={{ alignItems: 'flex-start' }}
          >
            <span className="script-label" style={{ color: 'var(--accent-gold)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>汇总·汉文义译</span>
                <button
                  type="button"
                  onClick={() => handleCopy('meaning-zh', combined.meaningZhFull)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: '0.66rem',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                  title="复制全咒汉文义译全文"
                >
                  {copiedKey === 'meaning-zh' ? <Check size={11} /> : <Copy size={11} />}
                </button>
              </span>
              <ProvenanceBadge
                state={provSummary.byField.meaningZh}
                field="meaningZh"
                compact
                customLabel={
                  provSummary.byField.meaningZh === 'db-original'
                    ? '● 原典原载'
                    : provSummary.byField.meaningZh === 'mixed'
                    ? '◐ 原载+参考'
                    : '◇ 拟译参考'
                }
              />
            </span>
            <div className="box-text-zh" style={{ lineHeight: 1.78 }}>
              {renderSummaryFieldContent(
                'meaningZh',
                provSummary.byField.meaningZh,
                combined.meaningZhList,
                combined.meaningZhFull,
                ' ｜ ',
                true
              )}
            </div>
          </div>
        )}

      {/* 8. 汇总：全咒英文义译 */}
      {canShowSummaryRow(config.showMeaningEn, provSummary.byField.meaningEn) &&
        combined.meaningEnFull && (
          <div
            className={`script-row ${rowOriginClass(provSummary.byField.meaningEn)}`}
            style={{ alignItems: 'flex-start' }}
          >
            <span className="script-label">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>汇总·英文义译</span>
                <button
                  type="button"
                  onClick={() => handleCopy('meaning-en', combined.meaningEnFull)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: '0.66rem',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                  title="Copy full Sanskrit-to-English translation"
                >
                  {copiedKey === 'meaning-en' ? <Check size={11} /> : <Copy size={11} />}
                </button>
              </span>
              <ProvenanceBadge
                state={provSummary.byField.meaningEn}
                field="meaningEn"
                compact
                customLabel={
                  provSummary.byField.meaningEn === 'db-original'
                    ? '● 原典原载'
                    : provSummary.byField.meaningEn === 'mixed'
                    ? '◐ 原载+参考'
                    : '◇ 拟译参考'
                }
              />
            </span>
            <div className="box-text-en" style={{ lineHeight: 1.68 }}>
              {renderSummaryFieldContent(
                'meaningEn',
                provSummary.byField.meaningEn,
                combined.meaningEnList,
                combined.meaningEnFull,
                ' | ',
                true
              )}
            </div>
          </div>
        )}
    </section>
  );
};

