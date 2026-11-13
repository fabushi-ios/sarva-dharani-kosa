/**
 * src/components/catalog/CanonLibrary.tsx
 *
 * 全部藏经全文库：
 * - 支持检索与阅读全部 27 个 CBETA 藏经部类中的所有经典（包含无陀罗尼纯经文与含陀罗尼经典）
 * - 支持繁简异体/同音归一化检索与经文内文语句检索（searchCanonFullText）
 * - 支持在弹窗内直读全文，或一键切入主阅读器（含陀罗尼经典自动呈现「原文+陀罗尼」，无陀罗尼经典呈现纯净原文）
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Library, Search, Loader2, ExternalLink, X, AlertTriangle, BookOpen } from 'lucide-react';
import type { DharaniEntry } from '../../types/kosaTypes';
import type { CanonCatalogItem, CanonTextFile } from '../../core/canon/canonLibraryTypes';
import {
  CBETA_COLLECTION_ZH,
  filterCatalog,
  loadCanonCatalog,
  loadCanonText,
  searchCanonFullText,
  type CanonFullTextHit,
} from '../../services/canon/canonLibraryService';

interface CanonLibraryProps {
  allEntries: DharaniEntry[];
  onOpenEntry?: (entry: DharaniEntry) => void;
  /** Opens any CanonCatalogItem (with or without dhāraṇīs) directly inside the main adaptive reader */
  onOpenCanonInReader?: (item: CanonCatalogItem) => void;
  initialTextId?: string | null;
  initialQuery?: string;
}

const PAGE = 200;

function entriesFromText(all: DharaniEntry[], id: string): DharaniEntry[] {
  return all.filter((e) => e.provenance?.cbetaId === id || e.taishoNo.startsWith(id));
}

export const CanonLibrary: React.FC<CanonLibraryProps> = ({
  allEntries,
  onOpenEntry,
  onOpenCanonInReader,
  initialTextId,
  initialQuery,
}) => {
  const [catalog, setCatalog] = useState<CanonCatalogItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(initialQuery ?? '');
  const [collection, setCollection] = useState('');
  const [dharaniMode, setDharaniMode] = useState<'all' | 'with-dharani' | 'without-dharani'>('all');
  const [limit, setLimit] = useState(PAGE);
  const [open, setOpen] = useState<CanonCatalogItem | null>(null);
  const [bodyHits, setBodyHits] = useState<CanonFullTextHit[]>([]);

  useEffect(() => {
    loadCanonCatalog()
      .then((c) => {
        setCatalog(c);
        if (initialTextId) setOpen(c.find((x) => x.id === initialTextId) ?? null);
      })
      .catch((e) => setError(String(e?.message || e)));
  }, [initialTextId]);

  const collections = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of catalog ?? []) m.set(c.collection, (m.get(c.collection) ?? 0) + 1);
    return [...m.entries()];
  }, [catalog]);

  const results = useMemo(
    () => (catalog ? filterCatalog(catalog, query, { collection, dharaniMode }) : []),
    [catalog, query, collection, dharaniMode]
  );

  useEffect(() => setLimit(PAGE), [query, collection, dharaniMode]);

  useEffect(() => {
    if (!catalog || query.trim().length < 2) {
      setBodyHits([]);
      return;
    }
    let alive = true;
    searchCanonFullText(query, catalog, 12)
      .then((hits) => {
        if (!alive) return;
        const filtered = hits.filter((h) => {
          if (collection && h.item.collection !== collection) return false;
          if (dharaniMode === 'with-dharani' && h.item.dharani <= 0) return false;
          if (dharaniMode === 'without-dharani' && h.item.dharani > 0) return false;
          return !results.slice(0, 30).some((r) => r.id === h.item.id);
        });
        setBodyHits(filtered);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [catalog, query, collection, dharaniMode, results]);

  const totals = useMemo(() => {
    const total = catalog?.length ?? 0;
    const withDh = catalog?.filter((c) => c.dharani > 0).length ?? 0;
    return {
      texts: total,
      withDharani: withDh,
      withoutDharani: total - withDh,
      dharani: catalog?.reduce((s, c) => s + c.dharani, 0) ?? 0,
    };
  }, [catalog]);

  return (
    <div className="canon-library">
      <div className="canon-library-head">
        <h2>
          <Library size={20} /> 全部藏经全文检索与阅藏库
        </h2>
        <p className="canon-library-sub">
          收录 CBETA 全部藏经 <strong>{totals.texts.toLocaleString()}</strong> 部完整原文（支持繁简异体搜索）：其中{' '}
          <strong>{totals.withoutDharani.toLocaleString()}</strong> 部为无陀罗尼纯经论原文，
          <strong>{totals.withDharani.toLocaleString()}</strong> 部含陀罗尼（共{' '}
          {totals.dharani.toLocaleString()} 段，支持原文与陀罗尼同看）。
        </p>

        <div className="canon-library-controls" style={{ flexWrap: 'wrap', gap: '0.55rem' }}>
          <label className="canon-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜任意经名（如金刚经、阿弥陀经、法华经）、经号（T0235）、译者或经文词句…"
            />
          </label>

          <select value={collection} onChange={(e) => setCollection(e.target.value)}>
            <option value="">全部 27 部类藏经</option>
            {collections.map(([c, n]) => (
              <option key={c} value={c}>
                {c} {CBETA_COLLECTION_ZH[c] ?? ''}（{n}）
              </option>
            ))}
          </select>

          <div style={{ display: 'inline-flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {(
              [
                { id: 'all', label: '全部经典' },
                { id: 'with-dharani', label: '含陀罗尼经典 (原文+陀罗尼)' },
                { id: 'without-dharani', label: '无陀罗尼纯经文' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`source-chip-btn ${dharaniMode === opt.id ? 'active' : ''}`}
                onClick={() => setDharaniMode(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="canon-error">
          <AlertTriangle size={16} /> 无法加载藏经目录：{error}
        </div>
      )}
      {!catalog && !error && (
        <div className="canon-loading">
          <Loader2 className="spin" size={16} /> 正在加载全部藏经目录…
        </div>
      )}

      {catalog && (
        <>
          <div className="canon-count">
            匹配目录共 <strong>{results.length.toLocaleString()}</strong> 部
            {bodyHits.length > 0 ? ` · 另检出经文内文命中 ${bodyHits.length} 部` : ''}
          </div>

          {bodyHits.length > 0 && (
            <div style={{ marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-vermilion)', marginBottom: '0.35rem' }}>
                经文内文语句命中：
              </div>
              <ul className="canon-list">
                {bodyHits.map((bh) => (
                  <li key={`body-${bh.item.id}`} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <button className="canon-item" style={{ flex: 1 }} onClick={() => setOpen(bh.item)}>
                      <span className="canon-item-id">{bh.item.id}</span>
                      <span className="canon-item-title">
                        {bh.item.title}
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                          内文摘录：{bh.snippet}
                        </span>
                      </span>
                      <span className="canon-item-byline">{bh.item.byline}</span>
                      {bh.item.dharani > 0 ? (
                        <span className="canon-item-badge">原文+陀罗尼 {bh.item.dharani}</span>
                      ) : (
                        <span className="badge-pure-sutra">纯经文原文</span>
                      )}
                    </button>
                    {onOpenCanonInReader && (
                      <button
                        type="button"
                        className="btn-scholarly"
                        style={{ flexShrink: 0, fontSize: '0.75rem', padding: '0.32rem 0.6rem' }}
                        onClick={() => onOpenCanonInReader(bh.item)}
                      >
                        <BookOpen size={13} />
                        <span>阅读器打开</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ul className="canon-list">
            {results.slice(0, limit).map((c) => (
              <li key={c.id} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <button className="canon-item" style={{ flex: 1 }} onClick={() => setOpen(c)}>
                  <span className="canon-item-id">{c.id}</span>
                  <span className="canon-item-title">{c.title}</span>
                  <span className="canon-item-byline">{c.byline}</span>
                  {c.dharani > 0 ? (
                    <span className="canon-item-badge">原文+陀罗尼 {c.dharani}</span>
                  ) : (
                    <span className="badge-pure-sutra">纯经文原文</span>
                  )}
                </button>
                {onOpenCanonInReader && (
                  <button
                    type="button"
                    className="btn-scholarly"
                    style={{ flexShrink: 0, fontSize: '0.75rem', padding: '0.32rem 0.6rem' }}
                    onClick={() => onOpenCanonInReader(c)}
                    title={
                      c.dharani > 0
                        ? '在主阅读器中同时查看本经完整原文与陀罗尼发音解析'
                        : '在主阅读器中以纯净原文模式阅读本经（无陀罗尼栏目）'
                    }
                  >
                    <BookOpen size={13} />
                    <span>主阅读器查看</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
          {results.length > limit && (
            <button className="canon-more" onClick={() => setLimit((l) => l + PAGE)}>
              显示更多（还有 {(results.length - limit).toLocaleString()} 部）
            </button>
          )}
        </>
      )}

      {open && (
        <CanonTextView
          item={open}
          entries={entriesFromText(allEntries, open.id)}
          onOpenEntry={onOpenEntry}
          onOpenCanonInReader={onOpenCanonInReader}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
};

const CanonTextView: React.FC<{
  item: CanonCatalogItem;
  entries: DharaniEntry[];
  onOpenEntry?: (entry: DharaniEntry) => void;
  onOpenCanonInReader?: (item: CanonCatalogItem) => void;
  onClose: () => void;
}> = ({ item, entries, onOpenEntry, onOpenCanonInReader, onClose }) => {
  const [text, setText] = useState<CanonTextFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inModalQuery, setInModalQuery] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setText(null);
    setError(null);
    loadCanonText(item)
      .then(setText)
      .catch((e) => setError(String(e?.message || e)));
  }, [item]);

  const jumpToDharani = (k: number) =>
    bodyRef.current
      ?.querySelector(`[data-dharani="${k}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  let dIndex = 0;
  const q = inModalQuery.trim().toLowerCase();

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-label={`${item.title} 原文全文`}
      onClick={onClose}
    >
      <div className="modal-content canon-text-modal" onClick={(e) => e.stopPropagation()}>
        <div className="canon-text-head">
          <div>
            <h3>
              {item.title} <small>({item.id})</small>
            </h3>
            <div className="canon-text-byline">
              {item.byline} · {CBETA_COLLECTION_ZH[item.collection] ?? item.collection} ·{' '}
              {item.dharani > 0 ? `含陀罗尼 ${item.dharani} 段` : '无陀罗尼纯经文'}
            </div>
          </div>
          <div className="canon-text-actions" style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {onOpenCanonInReader && (
              <button
                type="button"
                className="btn-scholarly primary"
                onClick={() => {
                  onOpenCanonInReader(item);
                  onClose();
                }}
              >
                <BookOpen size={14} />
                <span>
                  {item.dharani > 0 ? '在主阅读器查看原文+陀罗尼' : '在主阅读器展开全文'}
                </span>
              </button>
            )}
            <a
              href={`https://cbetaonline.dila.edu.tw/zh/${item.id}`}
              target="_blank"
              rel="noreferrer"
            >
              CBETA Online <ExternalLink size={14} />
            </a>
            <button onClick={onClose} aria-label="关闭">
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <input
            type="search"
            value={inModalQuery}
            onChange={(e) => setInModalQuery(e.target.value)}
            placeholder="在本经全文中搜索词句…"
            style={{
              width: '100%',
              padding: '0.38rem 0.65rem',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              fontSize: '0.84rem',
            }}
          />
        </div>

        {(entries.length > 0 || (text && text.dharani.length > 0)) && (
          <div className="canon-dharani-index">
            {entries.length > 0 && (
              <div className="canon-entries">
                本经陀罗尼多体精校：
                {entries.map((e) => (
                  <button key={e.id} onClick={() => onOpenEntry?.(e)}>
                    {e.titleZh}
                  </button>
                ))}
              </div>
            )}
            {text && text.dharani.length > 0 && (
              <div className="canon-dharani-jumps">
                定位原文咒段：
                {text.dharani.map((d, k) => (
                  <button key={k} onClick={() => jumpToDharani(k)}>
                    {d.title || `第 ${k + 1} 段`}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="canon-text-body" ref={bodyRef}>
          {error && (
            <div className="canon-error">
              <AlertTriangle size={16} /> 无法加载原文：{error}
            </div>
          )}
          {!text && !error && (
            <div className="canon-loading">
              <Loader2 className="spin" size={16} /> 正在加载原文…
            </div>
          )}
          {text?.paragraphs.map(([kind, t], i) => {
            if (q && !t.toLowerCase().includes(q)) return null;
            if (kind === 'h') return <h4 key={i}>{t}</h4>;
            if (kind === 'd') {
              return (
                <p key={i} className="canon-dharani" data-dharani={dIndex++}>
                  {t}
                </p>
              );
            }
            return <p key={i}>{t}</p>;
          })}
        </div>
      </div>
    </div>
  );
};

export default CanonLibrary;
