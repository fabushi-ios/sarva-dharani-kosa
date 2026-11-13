/**
 * src/components/reader/InlineOriginalTextPanel.tsx
 *
 * Directly renders the complete original text across ALL 12 International Databases (DB1–DB12),
 * CBETA Full Canon (both pure sutras without dhāraṇīs and sutras with dhāraṇīs), and GRETIL/DSBC:
 * - Supports both inline page display (`mode="inline"`) and full-screen modal display (`mode="modal"`)
 * - In-text keyword search (Simplified/Traditional/homophone-aware & exact highlighting)
 * - Heading / chapter quick-jump pills
 * - Automatic mantra span location & jump-to-verse bridge when `entry.verses.length > 0`
 * - Clean, distraction-free full-text sutra layout when `entry.verses.length === 0`
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  ExternalLink,
  Loader2,
  Crosshair,
  AlertTriangle,
  Search,
  X,
  Copy,
  Check,
  Maximize2,
  ChevronDown,
} from 'lucide-react';
import type { DharaniEntry } from '../../types/kosaTypes';
import type { CbetaFullParagraph } from '../../services/cbeta/cbetaLiveService';
import {
  collectEntrySources,
  citationCheckFor,
  type EntrySourceRef,
} from '../../core/sources/entrySources';
import {
  CITATION_STATUS_LABEL_ZH,
  SANSKRIT_STATUS_LABEL_ZH,
} from '../../core/sources/citationCheck';
import {
  COVERAGE_VARIANT,
  HAN_GRAM,
  LATIN_GRAM,
  entryHanQuery,
  entryLatinQuery,
  hanUnits,
  latinUnits,
  locateSpan,
  stripShortHanAnnotations,
  type SpanMatch,
} from '../../core/sources/textAlignment';
import {
  loadUniversalOriginalSource,
  type UniversalLoadedSource,
} from '../../services/sources/universalSourceService';

export interface InlineOriginalTextPanelProps {
  entry: DharaniEntry;
  mode?: 'inline' | 'modal';
  onOpenModal?: () => void;
  onJumpToDharaniSection?: () => void;
}

const INITIAL_PARA_LIMIT = 240;

function locateInParagraphs(
  entry: DharaniEntry,
  ref: EntrySourceRef,
  paragraphs: CbetaFullParagraph[]
): { match: SpanMatch | null; ranges: Map<number, [number, number]>; firstPara: number } {
  if (entry.verses.length === 0 || paragraphs.length === 0) {
    return { match: null, ranges: new Map(), firstPara: -1 };
  }
  const joined = paragraphs.map((p) => p.text).join('\n');
  const isHanSource = ref.kind === 'cbeta' || ref.kind === 'canon-gz' || ref.kind === 'bkkbooks-yaml';
  const match = isHanSource
    ? locateSpan(entryHanQuery(entry.verses), hanUnits(stripShortHanAnnotations(joined)), HAN_GRAM)
    : locateSpan(entryLatinQuery(entry.verses), latinUnits(joined), LATIN_GRAM);

  const ranges = new Map<number, [number, number]>();
  let firstPara = -1;
  if (match && match.end > match.start) {
    let offset = 0;
    paragraphs.forEach((p, i) => {
      const s = Math.max(match.start, offset);
      const e = Math.min(match.end, offset + p.text.length);
      if (s < e) {
        ranges.set(i, [s - offset, e - offset]);
        if (firstPara < 0) firstPara = i;
      }
      offset += p.text.length + 1;
    });
  }
  return { match, ranges, firstPara };
}

function renderTextWithQueryHighlight(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  if (parts.length <= 1) return text;
  return parts.map((part, idx) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark key={idx} className="orig-query-mark">
        {part}
      </mark>
    ) : (
      <React.Fragment key={idx}>{part}</React.Fragment>
    )
  );
}

export const InlineOriginalTextPanel: React.FC<InlineOriginalTextPanelProps> = ({
  entry,
  mode = 'inline',
  onOpenModal,
  onJumpToDharaniSection,
}) => {
  const sources = useMemo(() => collectEntrySources(entry), [entry]);
  const check = useMemo(() => citationCheckFor(entry), [entry]);
  const firstReadable = useMemo(() => {
    const idx = sources.findIndex((s) => s.exists);
    return idx >= 0 ? idx : 0;
  }, [sources]);

  const [selected, setSelected] = useState<number>(firstReadable);
  const [loaded, setLoaded] = useState<UniversalLoadedSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [onlyDharani, setOnlyDharani] = useState<boolean>(false);
  const [inTextQuery, setInTextQuery] = useState<string>('');
  const [fontScale, setFontScale] = useState<'sm' | 'md' | 'lg'>('md');
  const [paraLimit, setParaLimit] = useState<number>(
    entry.verses.length === 0 ? 360 : INITIAL_PARA_LIMIT
  );
  const [copied, setCopied] = useState<boolean>(false);

  const bodyContainerRef = useRef<HTMLDivElement | null>(null);
  const markRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setSelected(firstReadable);
    setOnlyDharani(false);
    setInTextQuery('');
    setParaLimit(entry.verses.length === 0 ? 360 : INITIAL_PARA_LIMIT);
  }, [entry.id, firstReadable, entry.verses.length]);

  const ref = sources[selected] || sources[0];
  const hasDharani = entry.verses.length > 0;

  useEffect(() => {
    let cancelled = false;
    setLoaded(null);
    setError(null);
    if (!ref || !ref.exists) return;
    setLoading(true);
    loadUniversalOriginalSource(ref, entry)
      .then((res) => {
        if (!cancelled) {
          setLoaded(res);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ref, entry]);

  const located = useMemo(
    () => (loaded && ref ? locateInParagraphs(entry, ref, loaded.paragraphs) : null),
    [loaded, ref, entry]
  );

  // Ensure located paragraph is within visible paraLimit when present
  useEffect(() => {
    if (located && located.firstPara >= paraLimit) {
      setParaLimit(located.firstPara + 80);
    }
  }, [located, paraLimit]);

  useEffect(() => {
    if (mode === 'modal' && located && located.firstPara >= 0) {
      requestAnimationFrame(() =>
        markRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      );
    }
  }, [mode, located]);

  const scrollToMatch = () => {
    if (located && located.firstPara >= paraLimit) {
      setParaLimit(located.firstPara + 80);
    }
    window.setTimeout(() => {
      markRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 30);
  };

  const headings = useMemo(() => {
    if (!loaded) return [];
    const out: Array<{ paraIdx: number; label: string }> = [];
    loaded.paragraphs.forEach((p, idx) => {
      if (p.kind === 'head' && p.text.trim().length > 0) {
        out.push({ paraIdx: idx, label: p.text.trim().slice(0, 28) });
      }
    });
    return out;
  }, [loaded]);

  const jumpToParagraphIndex = (paraIdx: number) => {
    if (paraIdx >= paraLimit) {
      setParaLimit(paraIdx + 120);
    }
    window.setTimeout(() => {
      const targetEl = bodyContainerRef.current?.querySelector<HTMLElement>(
        `[data-orig-para="${paraIdx}"]`
      );
      targetEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 35);
  };

  const filteredIndexedParagraphs = useMemo(() => {
    if (!loaded) return [];
    const q = inTextQuery.trim().toLowerCase();
    const out: Array<{ p: CbetaFullParagraph; idx: number }> = [];
    loaded.paragraphs.forEach((p, idx) => {
      const range = located?.ranges.get(idx);
      if (onlyDharani && p.kind !== 'dharani' && !range) return;
      if (q && !p.text.toLowerCase().includes(q)) return;
      out.push({ p, idx });
    });
    return out;
  }, [loaded, located, onlyDharani, inTextQuery]);

  const hasDharaniMarkup = Boolean(loaded?.paragraphs.some((p) => p.kind === 'dharani'));
  const coveragePct = located?.match ? Math.round(located.match.coverage * 100) : 0;

  const handleCopyFullText = () => {
    if (!loaded) return;
    const allTxt = loaded.paragraphs.map((p) => p.text).join('\n\n');
    navigator.clipboard?.writeText(allTxt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section
      id={mode === 'inline' ? 'reader-original-fulltext-section' : undefined}
      className={mode === 'inline' ? 'inline-original-card' : ''}
      aria-label="数据库库藏原文全文直读区"
    >
      {mode === 'inline' && (
        <div className="inline-original-header">
          <div className="inline-original-title-row">
            <BookOpen size={18} color="var(--accent-vermilion)" />
            <h2>
              {hasDharani ? '库藏原文内容直看（整卷原典全文）' : '经典原文全文'}
            </h2>
            {(loaded?.sourceBadgeZh || ref?.sourceBadgeZh) && (
              <span className="inline-original-db-pill">
                {loaded?.sourceBadgeZh || ref?.sourceBadgeZh}
              </span>
            )}
            {loaded && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                共 {loaded.paragraphs.length.toLocaleString()} 段
              </span>
            )}
          </div>

          <div className="inline-original-controls">
            <div
              style={{
                display: 'inline-flex',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                overflow: 'hidden',
              }}
              role="group"
              aria-label="原文字号调节"
            >
              {(
                [
                  { id: 'sm', label: '小字' },
                  { id: 'md', label: '标准' },
                  { id: 'lg', label: '大字' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFontScale(f.id)}
                  style={{
                    padding: '0.22rem 0.5rem',
                    fontSize: '0.73rem',
                    border: 'none',
                    cursor: 'pointer',
                    background:
                      fontScale === f.id ? 'var(--accent-vermilion)' : 'var(--bg-elevated)',
                    color: fontScale === f.id ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 600,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {loaded && (
              <button
                type="button"
                className="btn-scholarly"
                style={{ padding: '0.24rem 0.58rem', fontSize: '0.75rem' }}
                onClick={handleCopyFullText}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? '已复制全文' : '复制原文'}</span>
              </button>
            )}

            {onOpenModal && (
              <button
                type="button"
                className="btn-scholarly"
                style={{ padding: '0.24rem 0.58rem', fontSize: '0.75rem' }}
                onClick={onOpenModal}
                title="在独立全屏弹窗中打开原文阅读"
              >
                <Maximize2 size={13} />
                <span>弹窗全屏阅读</span>
              </button>
            )}
          </div>
        </div>
      )}

      {check && hasDharani && (
        <div className={`fulltext-check fulltext-check-${check.status}`}>
          <strong>代码核对：</strong>
          {CITATION_STATUS_LABEL_ZH[check.status]}
          {check.best && check.best.coverage >= COVERAGE_VARIANT && (
            <span>
              {' '}
              · 最吻合原典 {check.best.title}（{check.best.id}，吻合度{' '}
              {Math.round(check.best.coverage * 100)}%）
            </span>
          )}
          {check.sanskrit && (
            <div>
              <strong>梵文核对：</strong>
              {SANSKRIT_STATUS_LABEL_ZH[check.sanskrit.status]}
              {check.sanskrit.best && check.sanskrit.best.coverage >= COVERAGE_VARIANT && (
                <span>
                  {' '}
                  · {check.sanskrit.best.id}（吻合度{' '}
                  {Math.round(check.sanskrit.best.coverage * 100)}%）
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {sources.length > 1 && (
        <div className="fulltext-source-tabs" role="tablist" aria-label="多源原典切换">
          {sources.map((s, i) => (
            <button
              key={`${s.kind}-${s.id}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === selected}
              className={`btn-scholarly ${i === selected ? 'primary' : ''}`}
              onClick={() => setSelected(i)}
              title={s.label}
            >
              {!s.exists && <AlertTriangle size={13} />}
              <span>
                {s.role === 'located' ? '代码定位 · ' : ''}
                {s.sourceBadgeZh || s.label}
                {typeof s.coverage === 'number' && s.coverage > 0
                  ? ` · ${Math.round(s.coverage * 100)}%`
                  : ''}
              </span>
            </button>
          ))}
        </div>
      )}

      {ref && !ref.exists && (
        <div className="meta-box">
          所标经号 <strong>{ref.id}</strong> 在 CBETA 中不存在。
          {check?.best && !check.best.cited ? '请切换至「代码定位」页签查看实际原典出处。' : ''}
        </div>
      )}

      {ref && ref.exists && (
        <div className="inline-original-search-bar">
          <div className="inline-original-search-input-wrap">
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '0.55rem',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="search"
              className="inline-original-search-input"
              placeholder="在本篇原文全文中检索词句..."
              value={inTextQuery}
              onChange={(e) => setInTextQuery(e.target.value)}
            />
            {inTextQuery && (
              <button
                type="button"
                onClick={() => setInTextQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.4rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'inline-flex',
                }}
                title="清空文内搜索"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {inTextQuery.trim() && loaded && (
            <span style={{ fontSize: '0.76rem', color: 'var(--accent-vermilion)', fontWeight: 700 }}>
              命中 {filteredIndexedParagraphs.length} 段
            </span>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.38rem', alignItems: 'center' }}>
            {hasDharani && located && located.firstPara >= 0 && (
              <button
                type="button"
                className="btn-scholarly gold"
                style={{ padding: '0.24rem 0.58rem', fontSize: '0.75rem' }}
                onClick={scrollToMatch}
              >
                <Crosshair size={13} />
                <span>定位原文咒段（吻合 {coveragePct}%）</span>
              </button>
            )}

            {hasDharani && hasDharaniMarkup && (
              <button
                type="button"
                className="btn-scholarly"
                style={{ padding: '0.24rem 0.58rem', fontSize: '0.75rem' }}
                onClick={() => setOnlyDharani((v) => !v)}
              >
                <span>{onlyDharani ? '显示整卷全文' : '仅看原文咒段'}</span>
              </button>
            )}

            {hasDharani && onJumpToDharaniSection && (
              <button
                type="button"
                className="btn-scholarly"
                style={{ padding: '0.24rem 0.58rem', fontSize: '0.75rem' }}
                onClick={onJumpToDharaniSection}
              >
                <span>跳至下方陀罗尼发音解析 ↓</span>
              </button>
            )}

            {ref.onlineUrl && (
              <a
                href={ref.onlineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-scholarly"
                style={{ padding: '0.24rem 0.58rem', fontSize: '0.75rem' }}
              >
                <ExternalLink size={13} />
                <span>源库官网核验</span>
              </a>
            )}
          </div>
        </div>
      )}

      {headings.length > 1 && !inTextQuery.trim() && (
        <div className="inline-original-headings-strip" aria-label="本经品目快速定位">
          <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            品目导览：
          </span>
          {headings.slice(0, 24).map((h) => (
            <button
              key={h.paraIdx}
              type="button"
              className="inline-heading-chip"
              onClick={() => jumpToParagraphIndex(h.paraIdx)}
            >
              {h.label}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="meta-box" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Loader2 size={16} className="spin-icon" />
          <span>正在加载数据库原文全文…</span>
        </div>
      )}

      {error && <div className="meta-box">原文加载提示：{error}</div>}

      {loaded?.folios && loaded.folios.length > 0 && (
        <div className="inline-folio-strip" aria-label="馆藏贝叶经高清图版预览">
          {loaded.folios.map((f, idx) => (
            <a
              key={idx}
              href={f.viewerUrl || f.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-folio-thumb"
            >
              <img src={f.imageUrl} alt={f.label} loading="lazy" />
              <span>{f.label} · 点击查看 IIIF 高清叶面</span>
            </a>
          ))}
        </div>
      )}

      {loaded && (
        <div
          ref={bodyContainerRef}
          className={`inline-original-body is-font-${fontScale} ${
            mode === 'inline' && hasDharani ? 'is-scrollable-inline' : ''
          }`}
          lang={loaded.lang === 'sa-Latn' ? 'sa-Latn' : 'zh-Hant'}
        >
          {filteredIndexedParagraphs.length === 0 ? (
            <div className="meta-box">
              未在原文中找到匹配「{inTextQuery}」的段落。
            </div>
          ) : (
            filteredIndexedParagraphs.slice(0, paraLimit).map(({ p, idx }) => {
              const range = located?.ranges.get(idx);
              if (p.kind === 'head') {
                return (
                  <h3 key={idx} data-orig-para={idx} className="inline-orig-h">
                    {renderTextWithQueryHighlight(p.text, inTextQuery)}
                  </h3>
                );
              }
              const cls = [
                'inline-orig-p',
                p.kind === 'dharani' ? 'inline-orig-dharani' : '',
                range ? 'inline-orig-located' : '',
                loaded.lang === 'sa-Latn' ? 'is-latin-para' : '',
              ]
                .filter(Boolean)
                .join(' ');

              if (!range || inTextQuery.trim()) {
                return (
                  <p key={idx} data-orig-para={idx} className={cls}>
                    {renderTextWithQueryHighlight(p.text, inTextQuery)}
                  </p>
                );
              }

              return (
                <p key={idx} data-orig-para={idx} className={cls}>
                  {p.text.slice(0, range[0])}
                  <mark
                    className="orig-mantra-mark"
                    ref={
                      idx === located?.firstPara
                        ? (el) => {
                            markRef.current = el;
                          }
                        : undefined
                    }
                  >
                    {p.text.slice(range[0], range[1])}
                  </mark>
                  {p.text.slice(range[1])}
                </p>
              );
            })
          )}

          {filteredIndexedParagraphs.length > paraLimit && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.6rem',
                padding: '0.75rem 0.95rem',
                border: '1px dashed var(--accent-gold-border)',
                borderRadius: '8px',
                background: 'var(--bg-elevated)',
              }}
            >
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                已展示前 <strong>{paraLimit}</strong> 段原文（全卷共{' '}
                <strong>{filteredIndexedParagraphs.length}</strong> 段）
              </span>
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-scholarly gold"
                  onClick={() => setParaLimit((prev) => prev + 300)}
                >
                  <ChevronDown size={14} />
                  <span>继续展开 300 段</span>
                </button>
                <button
                  type="button"
                  className="btn-scholarly primary"
                  onClick={() => setParaLimit(filteredIndexedParagraphs.length)}
                >
                  <span>展开整卷全部 {filteredIndexedParagraphs.length} 段原文</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
