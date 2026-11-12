/**
 * src/components/catalog/CanonLibrary.tsx
 *
 * 藏经全文库: every CBETA text of every collection, searchable by title / number / translator,
 * opened in full. Passages the source marks as dhāraṇī are highlighted and listed; when the corpus
 * has entries drawn from that text, they open in the reader (pronunciation, Siddhaṃ, meanings).
 * Texts without dhāraṇīs are simply shown as their original text.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Library, Search, Loader2, ExternalLink, X, AlertTriangle } from 'lucide-react';
import type { DharaniEntry } from '../../types/kosaTypes';
import type { CanonCatalogItem, CanonTextFile } from '../../core/canon/canonLibraryTypes';
import {
  CBETA_COLLECTION_ZH,
  filterCatalog,
  loadCanonCatalog,
  loadCanonText,
} from '../../services/canon/canonLibraryService';

interface CanonLibraryProps {
  allEntries: DharaniEntry[];
  onOpenEntry?: (entry: DharaniEntry) => void;
  initialTextId?: string | null;
  initialQuery?: string;
}

const PAGE = 200;

/** Corpus entries whose source is this CBETA text. */
function entriesFromText(all: DharaniEntry[], id: string): DharaniEntry[] {
  return all.filter((e) => e.provenance?.cbetaId === id || e.taishoNo === id);
}

export const CanonLibrary: React.FC<CanonLibraryProps> = ({ allEntries, onOpenEntry, initialTextId, initialQuery }) => {
  const [catalog, setCatalog] = useState<CanonCatalogItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(initialQuery ?? '');
  const [collection, setCollection] = useState('');
  const [dharaniOnly, setDharaniOnly] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const [open, setOpen] = useState<CanonCatalogItem | null>(null);

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
    () => (catalog ? filterCatalog(catalog, query, { collection, dharaniOnly }) : []),
    [catalog, query, collection, dharaniOnly]
  );
  useEffect(() => setLimit(PAGE), [query, collection, dharaniOnly]);

  const totals = useMemo(
    () => ({
      texts: catalog?.length ?? 0,
      withDharani: catalog?.filter((c) => c.dharani > 0).length ?? 0,
      dharani: catalog?.reduce((s, c) => s + c.dharani, 0) ?? 0,
    }),
    [catalog]
  );

  return (
    <div className="canon-library">
      <div className="canon-library-head">
        <h2>
          <Library size={20} /> 藏经全文库
        </h2>
        <p className="canon-library-sub">
          CBETA 全部藏经 {totals.texts.toLocaleString()} 部原文；其中 {totals.withDharani.toLocaleString()} 部含陀罗尼（
          {totals.dharani.toLocaleString()} 段，按 CBETA 原文的陀罗尼标记自动提取）。
        </p>
        <div className="canon-library-controls">
          <label className="canon-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="经名、经号（如 T0251、T21n1286）或译者"
            />
          </label>
          <select value={collection} onChange={(e) => setCollection(e.target.value)}>
            <option value="">全部藏经</option>
            {collections.map(([c, n]) => (
              <option key={c} value={c}>
                {c} {CBETA_COLLECTION_ZH[c] ?? ''}（{n}）
              </option>
            ))}
          </select>
          <label className="canon-toggle">
            <input type="checkbox" checked={dharaniOnly} onChange={(e) => setDharaniOnly(e.target.checked)} />
            仅含陀罗尼
          </label>
        </div>
      </div>

      {error && (
        <div className="canon-error">
          <AlertTriangle size={16} /> 无法加载藏经目录：{error}
        </div>
      )}
      {!catalog && !error && (
        <div className="canon-loading">
          <Loader2 className="spin" size={16} /> 正在加载藏经目录…
        </div>
      )}

      {catalog && (
        <>
          <div className="canon-count">共 {results.length.toLocaleString()} 部</div>
          <ul className="canon-list">
            {results.slice(0, limit).map((c) => (
              <li key={c.id}>
                <button className="canon-item" onClick={() => setOpen(c)}>
                  <span className="canon-item-id">{c.id}</span>
                  <span className="canon-item-title">{c.title}</span>
                  <span className="canon-item-byline">{c.byline}</span>
                  {c.dharani > 0 && <span className="canon-item-badge">陀罗尼 {c.dharani}</span>}
                </button>
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
  onClose: () => void;
}> = ({ item, entries, onOpenEntry, onClose }) => {
  const [text, setText] = useState<CanonTextFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setText(null);
    setError(null);
    loadCanonText(item)
      .then(setText)
      .catch((e) => setError(String(e?.message || e)));
  }, [item]);

  const jumpToDharani = (k: number) =>
    bodyRef.current?.querySelector(`[data-dharani="${k}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  let dIndex = 0;
  return (
    <div className="modal-overlay" role="dialog" aria-label={`${item.title} 原文全文`} onClick={onClose}>
      <div className="modal-content canon-text-modal" onClick={(e) => e.stopPropagation()}>
        <div className="canon-text-head">
          <div>
            <h3>
              {item.title} <small>({item.id})</small>
            </h3>
            <div className="canon-text-byline">
              {item.byline} · {CBETA_COLLECTION_ZH[item.collection] ?? item.collection}
            </div>
          </div>
          <div className="canon-text-actions">
            <a href={`https://cbetaonline.dila.edu.tw/zh/${item.id}`} target="_blank" rel="noreferrer">
              CBETA Online <ExternalLink size={14} />
            </a>
            <button onClick={onClose} aria-label="关闭">
              <X size={18} />
            </button>
          </div>
        </div>

        {(entries.length > 0 || (text && text.dharani.length > 0)) && (
          <div className="canon-dharani-index">
            {entries.length > 0 && (
              <div className="canon-entries">
                发音解析：
                {entries.map((e) => (
                  <button key={e.id} onClick={() => onOpenEntry?.(e)}>
                    {e.titleZh}
                  </button>
                ))}
              </div>
            )}
            {text && text.dharani.length > 0 && (
              <div className="canon-dharani-jumps">
                本经陀罗尼：
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
          {text?.paragraphs.map(([kind, t], i) =>
            kind === 'h' ? (
              <h4 key={i}>{t}</h4>
            ) : kind === 'd' ? (
              <p key={i} className="canon-dharani" data-dharani={dIndex++}>
                {t}
              </p>
            ) : (
              <p key={i}>{t}</p>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default CanonLibrary;
