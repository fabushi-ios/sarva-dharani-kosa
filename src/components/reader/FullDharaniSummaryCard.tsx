import React, { useMemo, useState } from 'react';
import { Copy, Check, Layers, Sparkles } from 'lucide-react';
import type { DharaniEntry, ScriptVisibilityConfig } from '../../types/kosaTypes';
import {
  iastToDevanagari,
  iastToIpa,
  iastToSiddham,
} from '../../core/sanskrit/transliterator';
import {
  formatModernPhoneticWithIastOption,
  generateVerseChinesePhonetics,
} from '../../core/sanskrit/phoneticMapper';

interface FullDharaniSummaryCardProps {
  entry: DharaniEntry;
  config: ScriptVisibilityConfig;
  activeVerseIndex?: number | null;
  onPlayVerse?: (verseArrayIdx: number) => void;
  onToggleBracketIast: () => void;
}

export const FullDharaniSummaryCard: React.FC<FullDharaniSummaryCardProps> = ({
  entry,
  config,
  activeVerseIndex = null,
  onPlayVerse,
  onToggleBracketIast,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const combined = useMemo(() => {
    if (!config.showFullCombinedSummary) {
      return {
        siddhamList: [] as string[],
        modernPhoneticList: [] as string[],
        devanagariList: [] as string[],
        iastList: [] as string[],
        classicalZhList: [] as string[],
        ipaList: [] as string[],
        siddhamFull: '',
        modernPhoneticFull: '',
        devanagariFull: '',
        iastFull: '',
        classicalZhFull: '',
        ipaFull: '',
      };
    }

    const siddhamList: string[] = [];
    const modernPhoneticList: string[] = [];
    const devanagariList: string[] = [];
    const iastList: string[] = [];
    const classicalZhList: string[] = [];
    const ipaList: string[] = [];

    const needPhonetics = config.showModernPhoneticZh || config.showClassicalZh;

    for (const v of entry.verses) {
      const autoPhon = needPhonetics
        ? generateVerseChinesePhonetics(v.iast, config.showPhoneticIastBracket)
        : null;

      if (config.showSiddham) {
        siddhamList.push(iastToSiddham(v.iast));
      }
      if (config.showModernPhoneticZh && autoPhon) {
        const formattedModern =
          autoPhon.modernPhoneticZh ||
          formatModernPhoneticWithIastOption(
            v.modernPhoneticZh || '',
            v.iast,
            config.showPhoneticIastBracket
          );
        modernPhoneticList.push(formattedModern);
      }
      if (config.showDevanagari) {
        devanagariList.push(iastToDevanagari(v.iast));
      }
      if (config.showIast) {
        iastList.push(v.iast);
      }
      if (config.showClassicalZh && autoPhon) {
        const effectiveClassical =
          v.classicalTranslitZh && !v.classicalTranslitZh.startsWith('【GRETIL')
            ? v.classicalTranslitZh
            : autoPhon.classicalTranslitZh;
        classicalZhList.push(effectiveClassical);
      }
      if (config.showIpa) {
        ipaList.push(iastToIpa(v.iast));
      }
    }

    return {
      siddhamList,
      modernPhoneticList,
      devanagariList,
      iastList,
      classicalZhList,
      ipaList,
      siddhamFull: siddhamList.join('  '),
      modernPhoneticFull: modernPhoneticList.join(' ｜ '),
      devanagariFull: devanagariList.join(' । '),
      iastFull: iastList.join(' | '),
      classicalZhFull: classicalZhList.join(' ｜ '),
      ipaFull: ipaList.length > 0 ? `/${ipaList.join(' | ')}/` : '',
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
    config.showPhoneticIastBracket,
  ]);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleCopyAllSix = () => {
    const siddhamFull =
      combined.siddhamFull || entry.verses.map((v) => iastToSiddham(v.iast)).join('  ');
    const devanagariFull =
      combined.devanagariFull || entry.verses.map((v) => iastToDevanagari(v.iast)).join(' । ');
    const iastFull = combined.iastFull || entry.verses.map((v) => v.iast).join(' | ');
    const ipaFull =
      combined.ipaFull || `/${entry.verses.map((v) => iastToIpa(v.iast)).join(' | ')}/`;
    const modernFull =
      combined.modernPhoneticFull ||
      entry.verses
        .map((v) => generateVerseChinesePhonetics(v.iast, config.showPhoneticIastBracket).modernPhoneticZh)
        .join(' ｜ ');
    const classicalFull =
      combined.classicalZhFull ||
      entry.verses
        .map((v) => {
          const auto = generateVerseChinesePhonetics(v.iast, false);
          return v.classicalTranslitZh && !v.classicalTranslitZh.startsWith('【GRETIL')
            ? v.classicalTranslitZh
            : auto.classicalTranslitZh;
        })
        .join(' ｜ ');

    const allText = [
      `《${entry.titleZh}》(${entry.taishoNo}) 全咒六体汇总（共 ${entry.verses.length} 句）`,
      `【悉昙梵字】\n${siddhamFull}`,
      `【梵音拼读参考】\n${modernFull}`,
      `【天城梵文】\n${devanagariFull}`,
      `【梵文 IAST】\n${iastFull}`,
      `【古汉语音译】\n${classicalFull}`,
      `【国际音标 IPA】\n${ipaFull}`,
    ].join('\n\n');
    handleCopy('all-six', allText);
  };

  if (!config.showFullCombinedSummary) {
    return null;
  }

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
            title="开启或关闭梵音拼读参考中的括号 (IAST) 对照"
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
            title="一键复制本咒全部六种文字汇总全文"
          >
            {copiedKey === 'all-six' ? <Check size={13} /> : <Copy size={13} />}
            <span>{copiedKey === 'all-six' ? '已复制六体全文' : '一键复制六体全文'}</span>
          </button>
        </div>
      </div>

      {/* 1. 汇总：悉昙梵字 */}
      {config.showSiddham && (
        <div className="script-row" style={{ alignItems: 'flex-start' }}>
          <span className="script-label">
            汇总·悉昙梵字
            <button
              type="button"
              onClick={() => handleCopy('siddham', combined.siddhamFull)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                marginLeft: '4px',
                fontSize: '0.66rem',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
              title="复制全咒悉昙梵字"
            >
              {copiedKey === 'siddham' ? <Check size={11} /> : <Copy size={11} />}
            </button>
          </span>
          <div className="script-content-siddham" style={{ lineHeight: 1.85 }}>
            {activeVerseIndex !== null
              ? renderSegmentedRow(combined.siddhamList, '  ')
              : combined.siddhamFull}
          </div>
        </div>
      )}

      {/* 2. 汇总：梵音拼读参考 */}
      {config.showModernPhoneticZh && (
        <div className="script-row" style={{ alignItems: 'flex-start' }}>
          <span className="script-label" style={{ color: 'var(--accent-jade)' }}>
            汇总·梵音拼读
            <button
              type="button"
              onClick={() => handleCopy('modern', combined.modernPhoneticFull)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                marginLeft: '4px',
                fontSize: '0.66rem',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
              title="复制全咒梵音拼读"
            >
              {copiedKey === 'modern' ? <Check size={11} /> : <Copy size={11} />}
            </button>
          </span>
          <div className="script-content-phonetic-zh" style={{ lineHeight: 1.75 }}>
            {activeVerseIndex !== null
              ? renderSegmentedRow(combined.modernPhoneticList, ' ｜ ')
              : combined.modernPhoneticFull}
          </div>
        </div>
      )}

      {/* 3. 汇总：天城梵文 */}
      {config.showDevanagari && (
        <div className="script-row" style={{ alignItems: 'flex-start' }}>
          <span className="script-label">
            汇总·天城梵文
            <button
              type="button"
              onClick={() => handleCopy('devanagari', combined.devanagariFull)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                marginLeft: '4px',
                fontSize: '0.66rem',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
              title="复制全咒天城梵文"
            >
              {copiedKey === 'devanagari' ? <Check size={11} /> : <Copy size={11} />}
            </button>
          </span>
          <div className="script-content-devanagari" style={{ lineHeight: 1.75 }}>
            {activeVerseIndex !== null
              ? renderSegmentedRow(combined.devanagariList, ' । ')
              : combined.devanagariFull}
          </div>
        </div>
      )}

      {/* 4. 汇总：梵文 IAST */}
      {config.showIast && (
        <div className="script-row" style={{ alignItems: 'flex-start' }}>
          <span className="script-label">
            汇总·梵文 IAST
            <button
              type="button"
              onClick={() => handleCopy('iast', combined.iastFull)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                marginLeft: '4px',
                fontSize: '0.66rem',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
              title="复制全咒梵文 IAST"
            >
              {copiedKey === 'iast' ? <Check size={11} /> : <Copy size={11} />}
            </button>
          </span>
          <div className="script-content-iast" style={{ lineHeight: 1.65 }}>
            {activeVerseIndex !== null
              ? renderSegmentedRow(combined.iastList, ' | ')
              : combined.iastFull}
          </div>
        </div>
      )}

      {/* 5. 汇总：古汉语音译 */}
      {config.showClassicalZh && (
        <div className="script-row" style={{ alignItems: 'flex-start' }}>
          <span className="script-label" style={{ color: 'var(--accent-vermilion)' }}>
            汇总·古汉语音译
            <button
              type="button"
              onClick={() => handleCopy('classical', combined.classicalZhFull)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                marginLeft: '4px',
                fontSize: '0.66rem',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
              title="复制全咒古汉语音译"
            >
              {copiedKey === 'classical' ? <Check size={11} /> : <Copy size={11} />}
            </button>
          </span>
          <div className="script-content-classical-zh" style={{ lineHeight: 1.75 }}>
            {activeVerseIndex !== null
              ? renderSegmentedRow(combined.classicalZhList, ' ｜ ')
              : combined.classicalZhFull}
          </div>
        </div>
      )}

      {/* 6. 汇总：国际音标 */}
      {config.showIpa && (
        <div className="script-row" style={{ alignItems: 'flex-start' }}>
          <span className="script-label">
            汇总·国际音标
            <button
              type="button"
              onClick={() => handleCopy('ipa', combined.ipaFull)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                marginLeft: '4px',
                fontSize: '0.66rem',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
              title="复制全咒国际音标"
            >
              {copiedKey === 'ipa' ? <Check size={11} /> : <Copy size={11} />}
            </button>
          </span>
          <div className="script-content-ipa" style={{ lineHeight: 1.65 }}>
            {combined.ipaFull}
          </div>
        </div>
      )}
    </section>
  );
};
