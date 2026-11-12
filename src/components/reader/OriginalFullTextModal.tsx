/**
 * src/components/reader/OriginalFullTextModal.tsx
 *
 * 「原文全文」: shows the complete original text (CBETA TEI-P5 scripture body or GRETIL file)
 * of every source an entry cites or that the code check located, with the passage matching
 * this entry located by phonetic n-gram alignment, highlighted and scrolled into view.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, ExternalLink, BookOpen, Loader2, Crosshair, AlertTriangle } from 'lucide-react';
import type { DharaniEntry } from '../../types/kosaTypes';
import {
  fetchAndParseCbetaXmlLive,
  type CbetaFullParagraph,
} from '../../services/cbeta/cbetaLiveService';
import { collectEntrySources, citationCheckFor, type EntrySourceRef } from '../../core/sources/entrySources';
import { CITATION_STATUS_LABEL_ZH, SANSKRIT_STATUS_LABEL_ZH } from '../../core/sources/citationCheck';
import { htmlToText } from '../../core/sources/htmlText';
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

interface OriginalFullTextModalProps {
  entry: DharaniEntry;
  onClose: () => void;
}

interface LoadedSource {
  title: string;
  byline?: string;
  paragraphs: CbetaFullParagraph[];
}

const gretilCache = new Map<string, LoadedSource>();

async function loadGretil(ref: EntrySourceRef): Promise<LoadedSource> {
  const cached = gretilCache.get(ref.url);
  if (cached) return cached;
  const res = await fetch(ref.url);
  if (!res.ok) throw new Error(`无法拉取 GRETIL 原典 (${res.status})`);
  const html = await res.text();
  const title = htmlToText((html.match(/<title>([\s\S]*?)<\/title>/i) || ['', ref.id])[1] || ref.id);
  const paragraphs: CbetaFullParagraph[] = htmlToText(html)
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => ({ kind: 'text' as const, text: t }));
  const loaded = { title, paragraphs };
  gretilCache.set(ref.url, loaded);
  return loaded;
}

async function loadCbeta(ref: EntrySourceRef): Promise<LoadedSource> {
  const vol = (ref.id.match(/^([A-Z]{1,2}\d{2,3})n/) || [, ''])[1] || '';
  const s = await fetchAndParseCbetaXmlLive(ref.id, vol, ref.url);
  return { title: `${s.titleZh} (${s.id})`, byline: s.translator, paragraphs: s.fullParagraphs };
}

/** Locates this entry's passage in the paragraphs; returns paragraph-relative highlight ranges. */
function locateInParagraphs(
  entry: DharaniEntry,
  ref: EntrySourceRef,
  paragraphs: CbetaFullParagraph[]
): { match: SpanMatch | null; ranges: Map<number, [number, number]>; firstPara: number } {
  const joined = paragraphs.map((p) => p.text).join('\n');
  const match =
    ref.kind === 'gretil'
      ? locateSpan(entryLatinQuery(entry.verses), latinUnits(joined), LATIN_GRAM)
      : // Interlinear notes such as (一) (二合) (上聲) are blanked (offsets preserved) before aligning.
        locateSpan(entryHanQuery(entry.verses), hanUnits(stripShortHanAnnotations(joined)), HAN_GRAM);
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

export const OriginalFullTextModal: React.FC<OriginalFullTextModalProps> = ({ entry, onClose }) => {
  const sources = useMemo(() => collectEntrySources(entry), [entry]);
  const check = useMemo(() => citationCheckFor(entry), [entry]);
  const firstReadable = sources.findIndex((s) => s.exists);
  const [selected, setSelected] = useState<number>(Math.max(0, firstReadable));
  const [loaded, setLoaded] = useState<LoadedSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [onlyDharani, setOnlyDharani] = useState(false);
  const markRef = useRef<HTMLElement | null>(null);
  const ref = sources[selected];

  useEffect(() => {
    let cancelled = false;
    setLoaded(null);
    setError(null);
    if (!ref || !ref.exists) return;
    setLoading(true);
    (ref.kind === 'gretil' ? loadGretil(ref) : loadCbeta(ref))
      .then((l) => !cancelled && setLoaded(l))
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [ref]);

  const located = useMemo(
    () => (loaded && ref ? locateInParagraphs(entry, ref, loaded.paragraphs) : null),
    [loaded, ref, entry]
  );

  const scrollToMatch = () => markRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  useEffect(() => {
    if (located && located.firstPara >= 0) requestAnimationFrame(() => markRef.current?.scrollIntoView({ block: 'center' }));
  }, [located]);

  const hasDharaniMarkup = !!loaded?.paragraphs.some((p) => p.kind === 'dharani');
  const coveragePct = located?.match ? Math.round(located.match.coverage * 100) : 0;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card fulltext-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            <BookOpen size={20} color="var(--accent-vermilion)" />
            <h3 style={{ fontSize: '1.02rem', fontWeight: 700 }}>原文全文 · {entry.titleZh}</h3>
          </div>
          <button id="close-fulltext-modal-btn" type="button" className="btn-scholarly" onClick={onClose}>
            <X size={16} />
            <span>关闭</span>
          </button>
        </div>

        <div className="modal-body">
          {check && (
            <div className={`fulltext-check fulltext-check-${check.status}`}>
              <strong>代码核对：</strong>
              {CITATION_STATUS_LABEL_ZH[check.status]}
              {check.best && check.best.coverage >= COVERAGE_VARIANT && (
                <span>
                  {' '}
                  · 最吻合原典 {check.best.title}（{check.best.id}，吻合度 {Math.round(check.best.coverage * 100)}%）
                </span>
              )}
              {check.sanskrit && (
                <div>
                  <strong>梵文核对：</strong>
                  {SANSKRIT_STATUS_LABEL_ZH[check.sanskrit.status]}
                  {check.sanskrit.best && check.sanskrit.best.coverage >= COVERAGE_VARIANT && (
                    <span>
                      {' '}
                      · {check.sanskrit.best.id}（吻合度 {Math.round(check.sanskrit.best.coverage * 100)}%）
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {sources.length === 0 ? (
            <div className="meta-box">本条未标注可在线读取的原典（CBETA 经号或 GRETIL 文件）。</div>
          ) : (
            <div className="fulltext-source-tabs" role="tablist">
              {sources.map((s, i) => (
                <button
                  key={`${s.kind}-${s.id}`}
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
                    {s.kind === 'gretil' ? s.label : s.id}
                    {typeof s.coverage === 'number' ? ` · ${Math.round(s.coverage * 100)}%` : ''}
                  </span>
                </button>
              ))}
            </div>
          )}

          {ref && !ref.exists && (
            <div className="meta-box">
              所标经号 <strong>{ref.id}</strong> 在 CBETA 中不存在（引用有误）。
              {check?.best && !check.best.cited ? '请查看「代码定位」页签中的实际出处。' : ''}
            </div>
          )}

          {ref && ref.exists && (
            <div className="fulltext-toolbar">
              <div className="fulltext-title">
                {loaded ? loaded.title : ref.label}
                {loaded?.byline && <span className="fulltext-byline"> · {loaded.byline}</span>}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {located && located.firstPara >= 0 && (
                  <button type="button" className="btn-scholarly gold" onClick={scrollToMatch}>
                    <Crosshair size={13} />
                    <span>跳到本咒（本段吻合 {coveragePct}%）</span>
                  </button>
                )}
                {hasDharaniMarkup && (
                  <button type="button" className="btn-scholarly" onClick={() => setOnlyDharani((v) => !v)}>
                    <span>{onlyDharani ? '显示全文' : '只看咒文段落'}</span>
                  </button>
                )}
                {ref.onlineUrl && (
                  <a href={ref.onlineUrl} target="_blank" rel="noopener noreferrer" className="btn-scholarly">
                    <ExternalLink size={13} />
                    <span>{ref.kind === 'gretil' ? 'GRETIL' : 'CBETA Online'}</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {loading && (
            <div className="meta-box" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Loader2 size={16} className="spin-icon" />
              <span>正在从原典库拉取全文…</span>
            </div>
          )}
          {error && <div className="meta-box">拉取失败：{error}</div>}

          {loaded && located && (
            <div className="fulltext-body" lang={ref?.kind === 'gretil' ? 'sa-Latn' : 'zh-Hant'}>
              {located.firstPara < 0 && (
                <div className="fulltext-nomatch">本原典中未能定位到与本条咒文吻合的段落；以下为全文。</div>
              )}
              {loaded.paragraphs.map((p, i) => {
                const range = located.ranges.get(i);
                if (onlyDharani && p.kind !== 'dharani' && !range) return null;
                const cls = `fulltext-p fulltext-p-${p.kind}${range ? ' fulltext-p-located' : ''}`;
                if (!range) return <p key={i} className={cls}>{p.text}</p>;
                return (
                  <p key={i} className={cls}>
                    {p.text.slice(0, range[0])}
                    <mark ref={i === located.firstPara ? (el) => { markRef.current = el; } : undefined}>
                      {p.text.slice(range[0], range[1])}
                    </mark>
                    {p.text.slice(range[1])}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
