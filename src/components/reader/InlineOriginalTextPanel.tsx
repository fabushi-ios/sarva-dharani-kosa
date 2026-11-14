import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ExternalLink,
  Loader2,
  Crosshair,
  AlertTriangle,
  Search,
  X,
  Copy,
  Check,
  Maximize2,
} from 'lucide-react';
import type { DharaniEntry } from '../../types/kosaTypes';
import type { CbetaFullParagraph } from '../../services/cbeta/cbetaLiveService';
import {
  collectEntrySources,
  type EntrySourceRef,
} from '../../core/sources/entrySources';
import {
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
import { normalizeLiteralSearchText } from '../../core/search/searchEngine';
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

interface LocatedSectionInfo {
  match: SpanMatch | null;
  ranges: Map<number, [number, number]>;
  firstPara: number;
  sectionStart: number;
  sectionEnd: number;
  matchedTitle?: string;
}

function extractCoreEntryTitle(titleZh: string): string {
  return titleZh
    .replace(/^【[^】]+】\s*/g, '')
    .replace(/^[A-Z]{1,2}\d{2,3}n[0-9A-Za-z]+\s*/g, '')
    .replace(/^《[^》]+》\s*[·・]?\s*/g, '')
    .replace(/[《》「」『』]/g, '')
    .replace(/\s*[(（][^）)]*[)）]\s*$/g, '')
    .trim();
}

function extractCompactHanMantraKey(entry: DharaniEntry): string {
  const raw =
    entry.provenance.rawSnippet ||
    entry.verses.map((v) => v.classicalTranslitZh || '').join('');
  return normalizeLiteralSearchText(stripShortHanAnnotations(raw)).replace(/[^a-z\p{Script=Han}]/gu, '');
}

function locateEntrySectionInParagraphs(
  entry: DharaniEntry,
  ref: EntrySourceRef,
  paragraphs: CbetaFullParagraph[]
): LocatedSectionInfo {
  if (paragraphs.length === 0) {
    return { match: null, ranges: new Map(), firstPara: -1, sectionStart: 0, sectionEnd: 0 };
  }

  const isHanSource =
    ref.kind === 'cbeta' || ref.kind === 'canon-gz' || ref.kind === 'bkkbooks-yaml';

  if (entry.verses.length > 0 && isHanSource) {
    const coreTitle = extractCoreEntryTitle(entry.titleZh);
    const normCoreTitle = normalizeLiteralSearchText(coreTitle).replace(/\s+/g, '');
    const mantraKey = extractCompactHanMantraKey(entry);
    const mantraPrefix = Array.from(mantraKey).slice(0, 8).join('');

    if (normCoreTitle.length >= 2) {
      let bestHeadIdx = -1;
      let bestDharaniIdx = -1;
      let bestScore = -1;

      for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        const normP = normalizeLiteralSearchText(p.text).replace(/\s+/g, '');
        if (!normP) continue;
        const isHeadOrShort = p.kind === 'head' || p.text.trim().length <= 42;
        if (!isHeadOrShort || !normP.includes(normCoreTitle)) continue;

        let score = p.kind === 'head' ? 50 : 20;
        if (normP === normCoreTitle) score += 60;
        else if (normP.endsWith(normCoreTitle)) score += 35;

        let matchedDharaniPara = -1;
        const lookaheadEnd = Math.min(paragraphs.length, i + 12);
        for (let j = i; j < lookaheadEnd; j++) {
          if (j > i && paragraphs[j].kind === 'head') break;
          const candKey = normalizeLiteralSearchText(
            stripShortHanAnnotations(paragraphs[j].text)
          ).replace(/[^a-z\p{Script=Han}]/gu, '');
          if (mantraPrefix.length >= 4 && candKey.includes(mantraPrefix)) {
            score += 120;
            matchedDharaniPara = j;
            break;
          }
          if (paragraphs[j].kind === 'dharani' && matchedDharaniPara < 0) {
            matchedDharaniPara = j;
            score += 25;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestHeadIdx = i;
          bestDharaniIdx = matchedDharaniPara >= 0 ? matchedDharaniPara : i;
        }
      }

      if (bestHeadIdx >= 0 && bestScore >= 65) {
        let secEnd = bestDharaniIdx + 1;
        while (secEnd < paragraphs.length && secEnd < bestHeadIdx + 16) {
          if (paragraphs[secEnd].kind === 'head') break;
          secEnd++;
        }
        const ranges = new Map<number, [number, number]>();
        const targetP = paragraphs[bestDharaniIdx];
        if (targetP) ranges.set(bestDharaniIdx, [0, targetP.text.length]);
        return {
          match: { start: 0, end: targetP?.text.length || 1, coverage: 1 },
          ranges,
          firstPara: bestDharaniIdx,
          sectionStart: Math.max(0, bestHeadIdx),
          sectionEnd: Math.min(paragraphs.length, Math.max(secEnd, bestDharaniIdx + 2)),
          matchedTitle: paragraphs[bestHeadIdx].text.trim(),
        };
      }
    }
  }

  if (entry.verses.length === 0) {
    return { match: null, ranges: new Map(), firstPara: -1, sectionStart: 0, sectionEnd: paragraphs.length };
  }

  const joined = paragraphs.map((p) => p.text).join('\n');
  const match = isHanSource
    ? locateSpan(entryHanQuery(entry.verses), hanUnits(stripShortHanAnnotations(joined)), HAN_GRAM)
    : locateSpan(entryLatinQuery(entry.verses), latinUnits(joined), LATIN_GRAM);

  const ranges = new Map<number, [number, number]>();
  let firstPara = -1;
  let lastPara = -1;
  if (match && match.end > match.start) {
    let offset = 0;
    paragraphs.forEach((p, i) => {
      const s = Math.max(match.start, offset);
      const e = Math.min(match.end, offset + p.text.length);
      if (s < e) {
        ranges.set(i, [s - offset, e - offset]);
        if (firstPara < 0) firstPara = i;
        lastPara = i;
      }
      offset += p.text.length + 1;
    });
  }

  if (firstPara >= 0) {
    let secStart = Math.max(0, firstPara - 3);
    for (let k = firstPara; k >= Math.max(0, firstPara - 10); k--) {
      if (paragraphs[k].kind === 'head') {
        secStart = k;
        break;
      }
    }
    let secEnd = Math.min(paragraphs.length, Math.max(lastPara, firstPara) + 5);
    for (let k = Math.max(lastPara, firstPara) + 1; k < Math.min(paragraphs.length, firstPara + 20); k++) {
      if (paragraphs[k].kind === 'head') {
        secEnd = k;
        break;
      }
    }
    return {
      match,
      ranges,
      firstPara,
      sectionStart: secStart,
      sectionEnd: secEnd,
      matchedTitle: paragraphs[secStart]?.kind === 'head' ? paragraphs[secStart].text.trim() : undefined,
    };
  }

  return { match: null, ranges: new Map(), firstPara: -1, sectionStart: 0, sectionEnd: paragraphs.length };
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
}) => {
  const sources = useMemo(() => collectEntrySources(entry), [entry]);
  const firstReadable = useMemo(() => {
    const idx = sources.findIndex((s) => s.exists);
    return idx >= 0 ? idx : 0;
  }, [sources]);

  const [selected, setSelected] = useState<number>(firstReadable);
  const [loaded, setLoaded] = useState<UniversalLoadedSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [scopeMode, setScopeMode] = useState<'section' | 'full'>('section');
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
    setScopeMode('section');
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
        if (!cancelled) setLoaded(res);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ref, entry]);

  const located = useMemo(
    () => (loaded && ref ? locateEntrySectionInParagraphs(entry, ref, loaded.paragraphs) : null),
    [loaded, ref, entry]
  );

  const canUseSectionSlice = Boolean(
    loaded &&
      hasDharani &&
      located &&
      located.firstPara >= 0 &&
      loaded.paragraphs.length > 30 &&
      located.sectionEnd - located.sectionStart < loaded.paragraphs.length
  );

  const effectiveScope = canUseSectionSlice && !inTextQuery.trim() ? scopeMode : 'full';

  useEffect(() => {
    if (effectiveScope === 'full' && located && located.firstPara >= paraLimit) {
      setParaLimit(located.firstPara + 80);
    }
  }, [effectiveScope, located, paraLimit]);

  const scrollToMatch = () => {
    if (effectiveScope === 'full' && located && located.firstPara >= paraLimit) {
      setParaLimit(located.firstPara + 80);
    }
    window.setTimeout(() => {
      markRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 35);
  };

  const filteredIndexedParagraphs = useMemo(() => {
    if (!loaded) return [];
    const q = inTextQuery.trim().toLowerCase();
    const out: Array<{ p: CbetaFullParagraph; idx: number }> = [];

    const startIdx = effectiveScope === 'section' && located ? located.sectionStart : 0;
    const endIdx = effectiveScope === 'section' && located ? located.sectionEnd : loaded.paragraphs.length;

    for (let idx = startIdx; idx < endIdx; idx++) {
      const p = loaded.paragraphs[idx];
      if (!p) continue;
      if (q && !p.text.toLowerCase().includes(q)) continue;
      out.push({ p, idx });
    }
    return out;
  }, [loaded, located, effectiveScope, inTextQuery]);

  const handleCopyDisplayedText = () => {
    if (!loaded) return;
    const targetList = filteredIndexedParagraphs.map(({ p }) => p.text).join('\n\n');
    navigator.clipboard?.writeText(targetList);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section
      id={mode === 'inline' ? 'reader-original-fulltext-section' : undefined}
      className={mode === 'inline' ? 'inline-original-card is-clean-tab-panel' : ''}
      aria-label="原典经文阅读区"
    >
      {sources.filter((s) => s.exists).length > 1 && (
        <div className="fulltext-source-tabs" role="tablist" aria-label="多源原典切换">
          {sources.map((s, i) =>
            s.exists ? (
              <button
                key={`${s.kind}-${s.id}-${i}`}
                type="button"
                role="tab"
                aria-selected={i === selected}
                className={`btn-scholarly ${i === selected ? 'primary' : ''}`}
                onClick={() => setSelected(i)}
                title={s.label}
              >
                <span>{s.sourceBadgeZh || s.label}</span>
              </button>
            ) : null
          )}
        </div>
      )}

      {ref && !ref.exists && (
        <div className="meta-box">
          <AlertTriangle size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
          所标经号 <strong>{ref.id}</strong> 未检出对应原典文件。
        </div>
      )}

      {ref && ref.exists && (
        <div className="inline-original-toolbar">
          <div className="inline-original-toolbar-left">
            {canUseSectionSlice && (
              <div className="orig-scope-segmented" role="group" aria-label="原文范围切换">
                <button
                  type="button"
                  className={`orig-scope-pill ${effectiveScope === 'section' ? 'active' : ''}`}
                  onClick={() => setScopeMode('section')}
                >
                  本篇对应段落
                </button>
                <button
                  type="button"
                  className={`orig-scope-pill ${effectiveScope === 'full' ? 'active' : ''}`}
                  onClick={() => {
                    setScopeMode('full');
                    scrollToMatch();
                  }}
                >
                  整卷全文 ({loaded?.paragraphs.length.toLocaleString()}段)
                </button>
              </div>
            )}

            <div className="inline-original-search-input-wrap">
              <Search
                size={13}
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
                placeholder="检索本卷原文..."
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
                  title="清空检索"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="inline-original-controls">
            {effectiveScope === 'full' && hasDharani && located && located.firstPara >= 0 && (
              <button
                type="button"
                className="btn-scholarly"
                style={{ padding: '0.24rem 0.55rem', fontSize: '0.75rem' }}
                onClick={scrollToMatch}
              >
                <Crosshair size={13} />
                <span>定位本咒</span>
              </button>
            )}

            <div className="orig-font-segmented" role="group" aria-label="字号">
              {(
                [
                  { id: 'sm', label: '小' },
                  { id: 'md', label: '中' },
                  { id: 'lg', label: '大' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={fontScale === f.id ? 'active' : ''}
                  onClick={() => setFontScale(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {loaded && (
              <button
                type="button"
                className="btn-scholarly"
                style={{ padding: '0.24rem 0.55rem', fontSize: '0.75rem' }}
                onClick={handleCopyDisplayedText}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? '已复制' : '复制'}</span>
              </button>
            )}

            {mode === 'inline' && onOpenModal && (
              <button
                type="button"
                className="btn-scholarly"
                style={{ padding: '0.24rem 0.55rem', fontSize: '0.75rem' }}
                onClick={onOpenModal}
                title="全屏阅读"
              >
                <Maximize2 size={13} />
                <span>全屏</span>
              </button>
            )}

            {ref.onlineUrl && (
              <a
                href={ref.onlineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-scholarly"
                style={{ padding: '0.24rem 0.55rem', fontSize: '0.75rem' }}
              >
                <ExternalLink size={13} />
                <span>源库页</span>
              </a>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="meta-box" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Loader2 size={16} className="spin-icon" />
          <span>正在加载原典经文…</span>
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
              <span>{f.label} · 查看高清叶面</span>
            </a>
          ))}
        </div>
      )}

      {loaded && (
        <div
          ref={bodyContainerRef}
          className={`inline-original-body is-font-${fontScale}`}
          lang={loaded.lang === 'sa-Latn' ? 'sa-Latn' : 'zh-Hant'}
        >
          {effectiveScope === 'section' && located && (
            <div className="orig-section-context-note">
              <span>
                当前显示原典对应品段（第 {located.sectionStart + 1}–{located.sectionEnd} 段 / 全书共{' '}
                {loaded.paragraphs.length.toLocaleString()} 段）
              </span>
              <button
                type="button"
                className="orig-link-btn"
                onClick={() => setScopeMode('full')}
              >
                展开整卷全文 →
              </button>
            </div>
          )}

          {filteredIndexedParagraphs.length === 0 ? (
            <div className="meta-box">未在原文中找到匹配「{inTextQuery}」的段落。</div>
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
            <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem' }}>
              <button
                type="button"
                className="btn-scholarly"
                onClick={() => setParaLimit((n) => n + 240)}
              >
                继续展开 240 段（剩余 {filteredIndexedParagraphs.length - paraLimit} 段）
              </button>
              <button
                type="button"
                className="btn-scholarly"
                onClick={() => setParaLimit(filteredIndexedParagraphs.length)}
              >
                展开全部 ({filteredIndexedParagraphs.length} 段)
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
