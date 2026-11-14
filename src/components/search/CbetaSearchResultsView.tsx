/**
 * src/components/search/CbetaSearchResultsView.tsx
 *
 * CBETA Online-Inspired Full-Text & Dhāraṇī Search Results Workspace:
 * - Horizontal underline tabs with live counts:
 *     `AI 模式` | `陀羅尼·梵文` | `陀羅尼·梵音` | `經文` | `經名` | `校注與夾注`
 * - Light-blue `近義詞建議` bar with clickable related Sanskrit/Chinese terms
 * - Left `部類` checkbox sidebar with live result counts `(N)`
 * - Right clean result list with green scholarly titles, `部類` tags, yellow `<mark>` highlights,
 *   and 1-click jump into the single-window parallel-tab Reader!
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink, Loader2, Sparkles, X } from 'lucide-react';
import type { DharaniEntry } from '../../types/kosaTypes';
import type { CanonCatalogItem } from '../../core/canon/canonLibraryTypes';
import {
  CBETA_BULEI_LIST,
  CBETA_BULEI_MAP,
  getRelatedQuerySuggestions,
  resolveCanonItemBulei,
  type CbetaBuleiId,
} from '../../core/canon/cbetaBulei';
import {
  normalizeLiteralSearchText,
  searchDharaniNotes,
  searchEntriesByTab,
  type SearchScope,
} from '../../core/search/searchEngine';
import {
  filterCatalog,
  searchCanonFullText,
  type CanonFullTextHit,
} from '../../services/canon/canonLibraryService';

export type CbetaResultTab =
  | 'ai'
  | 'dharani-sanskrit'
  | 'dharani-phonetic'
  | 'sutra-text'
  | 'sutra-title'
  | 'notes';

export interface CbetaSearchResultsViewProps {
  query: string;
  initialScope: SearchScope;
  allEntries: DharaniEntry[];
  canonCatalog: CanonCatalogItem[];
  onQueryChange: (nextQuery: string) => void;
  onCloseSearchView: () => void;
  onOpenEntry: (
    entry: DharaniEntry,
    opts?: { openOriginalTab?: boolean; verseArrayIndex?: number }
  ) => void;
  onOpenCanonItem: (item: CanonCatalogItem) => void;
  onAskAi: (query: string) => void;
}

interface UnifiedResultRow {
  key: string;
  codeId: string;
  titleText: string;
  hitBadgeText: string;
  buleiId: CbetaBuleiId;
  bylineText: string;
  kindBadge: string;
  snippets: string[];
  onOpen: () => void;
}

function mapScopeToInitialTab(scope: SearchScope): CbetaResultTab {
  switch (scope) {
    case 'dharani-sanskrit':
      return 'dharani-sanskrit';
    case 'dharani-phonetic':
      return 'dharani-phonetic';
    case 'sutra':
    case 'sutra-text':
      return 'sutra-text';
    case 'sutra-title':
      return 'sutra-title';
    case 'notes':
      return 'notes';
    default:
      return 'dharani-phonetic';
  }
}

function highlightQueryMatches(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q || !text) return text;

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const directRe = new RegExp(`(${escaped})`, 'gi');
  if (directRe.test(text)) {
    const parts = text.split(directRe);
    return parts.map((part, idx) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <mark key={idx} className="cbeta-hit-mark">
          {part}
        </mark>
      ) : (
        <React.Fragment key={idx}>{part}</React.Fragment>
      )
    );
  }

  // Variant-aware character highlight (e.g. Simplified query `坚牢地天` highlighting Traditional `堅牢地天`)
  const qNormChars = Array.from(normalizeLiteralSearchText(q)).filter((c) => c.trim().length > 0);
  if (qNormChars.length === 0) return text;
  const qSet = new Set(qNormChars);
  const chars = Array.from(text);
  const out: React.ReactNode[] = [];
  let buf = '';
  let inMark = false;

  chars.forEach((ch, idx) => {
    const folded = normalizeLiteralSearchText(ch);
    const hit = folded.length > 0 && qSet.has(folded);
    if (hit !== inMark) {
      if (buf) {
        out.push(
          inMark ? (
            <mark key={`m-${idx}`} className="cbeta-hit-mark">
              {buf}
            </mark>
          ) : (
            <React.Fragment key={`t-${idx}`}>{buf}</React.Fragment>
          )
        );
        buf = '';
      }
      inMark = hit;
    }
    buf += ch;
  });

  if (buf) {
    out.push(
      inMark ? (
        <mark key="m-end" className="cbeta-hit-mark">
          {buf}
        </mark>
      ) : (
        <React.Fragment key="t-end">{buf}</React.Fragment>
      )
    );
  }
  return out;
}

export const CbetaSearchResultsView: React.FC<CbetaSearchResultsViewProps> = ({
  query,
  initialScope,
  allEntries,
  canonCatalog,
  onQueryChange,
  onCloseSearchView,
  onOpenEntry,
  onOpenCanonItem,
  onAskAi,
}) => {
  const [activeResultTab, setActiveResultTab] = useState<CbetaResultTab>(() =>
    mapScopeToInitialTab(initialScope)
  );
  const [selectedBuleiSet, setSelectedBuleiSet] = useState<Set<CbetaBuleiId>>(() => new Set());
  const [sortOrder, setSortOrder] = useState<'relevance' | 'id' | 'bulei'>('relevance');
  const [showSynonyms, setShowSynonyms] = useState<boolean>(true);
  const [sutraBodyHits, setSutraBodyHits] = useState<CanonFullTextHit[]>([]);
  const [loadingBodyHits, setLoadingBodyHits] = useState<boolean>(false);

  // Sync tab when scope changes externally
  useEffect(() => {
    if (initialScope !== 'all' && initialScope !== 'dharani') {
      setActiveResultTab(mapScopeToInitialTab(initialScope));
    }
  }, [initialScope]);

  // Reset bulei checkboxes when query changes
  useEffect(() => {
    setSelectedBuleiSet(new Set());
    setShowSynonyms(true);
  }, [query]);

  // Fetch full-text Canon body hits asynchronously
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || canonCatalog.length === 0) {
      setSutraBodyHits([]);
      return;
    }
    let alive = true;
    setLoadingBodyHits(true);
    searchCanonFullText(q, canonCatalog, 160)
      .then((res) => {
        if (alive) setSutraBodyHits(res);
      })
      .catch(() => {
        if (alive) setSutraBodyHits([]);
      })
      .finally(() => {
        if (alive) setLoadingBodyHits(false);
      });
    return () => {
      alive = false;
    };
  }, [query, canonCatalog]);

  // Compute all 5 category datasets (unfiltered by Bulei first so tab badges & Bulei counts are accurate!)
  const sanskritHitsAll = useMemo(
    () => searchEntriesByTab(allEntries, query, 'dharani-sanskrit', undefined, 250),
    [allEntries, query]
  );

  const phoneticHitsAll = useMemo(
    () => searchEntriesByTab(allEntries, query, 'dharani-phonetic', undefined, 250),
    [allEntries, query]
  );

  const canonTitleHitsAll = useMemo(
    () => (query.trim() ? filterCatalog(canonCatalog, query, {}) : []),
    [canonCatalog, query]
  );

  const entryTitleHitsAll = useMemo(
    () => searchEntriesByTab(allEntries, query, 'sutra-title', undefined, 150),
    [allEntries, query]
  );

  const noteHitsAll = useMemo(
    () => searchDharaniNotes(allEntries, query, undefined, 150),
    [allEntries, query]
  );

  // Auto-pick best non-empty tab when entering with `'all'` or `'dharani'` scope
  useEffect(() => {
    if (initialScope === 'all') {
      if (sutraBodyHits.length > 0) setActiveResultTab('sutra-text');
      else if (sanskritHitsAll.length > 0) setActiveResultTab('dharani-sanskrit');
      else if (phoneticHitsAll.length > 0) setActiveResultTab('dharani-phonetic');
      else if (canonTitleHitsAll.length + entryTitleHitsAll.length > 0)
        setActiveResultTab('sutra-title');
    } else if (initialScope === 'dharani') {
      if (sanskritHitsAll.length > 0) setActiveResultTab('dharani-sanskrit');
      else setActiveResultTab('dharani-phonetic');
    }
  }, [
    query,
    initialScope,
    sutraBodyHits.length,
    sanskritHitsAll.length,
    phoneticHitsAll.length,
    canonTitleHitsAll.length,
    entryTitleHitsAll.length,
  ]);

  const synonyms = useMemo(() => getRelatedQuerySuggestions(query), [query]);

  // Build UnifiedResultRow[] for the active tab (before Bulei checkbox filter)
  const rawRowsForTab = useMemo<UnifiedResultRow[]>(() => {
    if (activeResultTab === 'dharani-sanskrit') {
      return sanskritHitsAll.map((h) => ({
        key: `skt-${h.entry.id}`,
        codeId: (h.entry.taishoNo || h.entry.id).split(' ')[0],
        titleText: h.entry.titleZh,
        hitBadgeText: `共 ${h.hitCount} 筆`,
        buleiId: h.buleiId,
        bylineText: `${h.entry.translatorZh}${h.entry.provenance.databaseBadgeZh ? ` · ${h.entry.provenance.databaseBadgeZh}` : ''}`,
        kindBadge: '陀羅尼·梵文',
        snippets: h.matchedSnippets,
        onOpen: () =>
          onOpenEntry(h.entry, {
            openOriginalTab: false,
            verseArrayIndex: h.matchedVerseIndex,
          }),
      }));
    }

    if (activeResultTab === 'dharani-phonetic') {
      return phoneticHitsAll.map((h) => ({
        key: `pho-${h.entry.id}`,
        codeId: (h.entry.taishoNo || h.entry.id).split(' ')[0],
        titleText: h.entry.titleZh,
        hitBadgeText: `共 ${h.hitCount} 筆`,
        buleiId: h.buleiId,
        bylineText: `${h.entry.translatorZh}${h.entry.provenance.databaseBadgeZh ? ` · ${h.entry.provenance.databaseBadgeZh}` : ''}`,
        kindBadge: '陀羅尼·梵音',
        snippets: h.matchedSnippets,
        onOpen: () =>
          onOpenEntry(h.entry, {
            openOriginalTab: false,
            verseArrayIndex: h.matchedVerseIndex,
          }),
      }));
    }

    if (activeResultTab === 'sutra-text') {
      const seenIds = new Set<string>();
      const rows: UnifiedResultRow[] = [];

      for (const bh of sutraBodyHits) {
        seenIds.add(bh.item.id);
        rows.push({
          key: `body-${bh.item.id}`,
          codeId: bh.item.id,
          titleText: bh.item.title,
          hitBadgeText: `共 ${bh.hitCount ?? 1} 筆`,
          buleiId: bh.buleiId,
          bylineText: `${bh.item.byline || '藏經原典'}（全文 ${(bh.item.chars || 0).toLocaleString()} 字）`,
          kindBadge: bh.item.dharani > 0 ? `經文（含咒 ${bh.item.dharani} 段）` : '經文',
          snippets: [bh.snippet],
          onOpen: () => onOpenCanonItem(bh.item),
        });
      }

      // Supplement with Canon title matches not yet in body hits
      for (const c of canonTitleHitsAll.slice(0, 40)) {
        if (seenIds.has(c.id)) continue;
        seenIds.add(c.id);
        rows.push({
          key: `cat-${c.id}`,
          codeId: c.id,
          titleText: c.title,
          hitBadgeText: '共 1 筆',
          buleiId: resolveCanonItemBulei(c),
          bylineText: `${c.byline || '藏經原典'}（全文 ${(c.chars || 0).toLocaleString()} 字）`,
          kindBadge: c.dharani > 0 ? `經文（含咒 ${c.dharani} 段）` : '經文',
          snippets: [`《${c.title}》（${c.id}）— 點擊直接閱讀整卷原典經文`],
          onOpen: () => onOpenCanonItem(c),
        });
      }
      return rows;
    }

    if (activeResultTab === 'sutra-title') {
      const rows: UnifiedResultRow[] = canonTitleHitsAll.map((c) => ({
        key: `title-canon-${c.id}`,
        codeId: c.id,
        titleText: `《${c.title}》`,
        hitBadgeText: '經名命中',
        buleiId: resolveCanonItemBulei(c),
        bylineText: `${c.byline || '藏經原典'} · 全文 ${(c.chars || 0).toLocaleString()} 字`,
        kindBadge: c.dharani > 0 ? '經名（含咒）' : '經名（純經文）',
        snippets: [`經號 ${c.id} · ${c.byline || '歷代譯經'}`],
        onOpen: () => onOpenCanonItem(c),
      }));

      for (const eh of entryTitleHitsAll) {
        rows.push({
          key: `title-entry-${eh.entry.id}`,
          codeId: (eh.entry.taishoNo || eh.entry.id).split(' ')[0],
          titleText: eh.entry.titleZh,
          hitBadgeText: '咒名命中',
          buleiId: eh.buleiId,
          bylineText: eh.entry.translatorZh,
          kindBadge: eh.kind === 'dharani-sanskrit' ? '陀羅尼·梵文' : '陀羅尼·梵音',
          snippets: eh.matchedSnippets.slice(0, 1),
          onOpen: () => onOpenEntry(eh.entry, { openOriginalTab: false }),
        });
      }
      return rows;
    }

    if (activeResultTab === 'notes') {
      return noteHitsAll.map((nh) => ({
        key: `note-${nh.entry.id}`,
        codeId: (nh.entry.taishoNo || nh.entry.id).split(' ')[0],
        titleText: nh.entry.titleZh,
        hitBadgeText: nh.noteSourceLabel,
        buleiId: nh.buleiId,
        bylineText: nh.entry.translatorZh,
        kindBadge: '校注與夾注',
        snippets: [nh.snippet],
        onOpen: () => onOpenEntry(nh.entry, { openOriginalTab: false }),
      }));
    }

    return [];
  }, [
    activeResultTab,
    sanskritHitsAll,
    phoneticHitsAll,
    sutraBodyHits,
    canonTitleHitsAll,
    entryTitleHitsAll,
    noteHitsAll,
    onOpenEntry,
    onOpenCanonItem,
  ]);

  // Facet counts per CBETA 部類 for the active tab
  const buleiFacetList = useMemo(() => {
    const counts = new Map<CbetaBuleiId, number>();
    for (const r of rawRowsForTab) {
      counts.set(r.buleiId, (counts.get(r.buleiId) || 0) + 1);
    }
    return CBETA_BULEI_LIST.map((meta) => ({
      meta,
      count: counts.get(meta.id) || 0,
    }))
      .filter((x) => x.count > 0 || selectedBuleiSet.has(x.meta.id))
      .sort((a, b) => b.count - a.count);
  }, [rawRowsForTab, selectedBuleiSet]);

  const filteredAndSortedRows = useMemo(() => {
    const base =
      selectedBuleiSet.size > 0
        ? rawRowsForTab.filter((r) => selectedBuleiSet.has(r.buleiId))
        : rawRowsForTab;

    if (sortOrder === 'id') {
      return [...base].sort((a, b) => a.codeId.localeCompare(b.codeId));
    }
    if (sortOrder === 'bulei') {
      return [...base].sort((a, b) => a.buleiId.localeCompare(b.buleiId));
    }
    return base;
  }, [rawRowsForTab, selectedBuleiSet, sortOrder]);

  const toggleBuleiCheckbox = (id: CbetaBuleiId) => {
    setSelectedBuleiSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sutraTabCount = Math.max(sutraBodyHits.length, canonTitleHitsAll.length);
  const titleTabCount = canonTitleHitsAll.length + entryTitleHitsAll.length;

  return (
    <div className="cbeta-search-page" aria-label="全文與陀羅尼分類檢索結果">
      {/* Top Category Underline Bar (Modeled on CBETA Online) */}
      <div className="cbeta-search-tabs-row">
        <div className="cbeta-search-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeResultTab === 'ai'}
            className={`cbeta-search-tab ${activeResultTab === 'ai' ? 'active' : ''}`}
            onClick={() => onAskAi(query)}
          >
            <Sparkles size={14} />
            <span>AI 模式</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeResultTab === 'dharani-sanskrit'}
            className={`cbeta-search-tab ${activeResultTab === 'dharani-sanskrit' ? 'active' : ''}`}
            onClick={() => setActiveResultTab('dharani-sanskrit')}
          >
            <span>陀羅尼·梵文</span>
            <span className="cbeta-tab-count">{sanskritHitsAll.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeResultTab === 'dharani-phonetic'}
            className={`cbeta-search-tab ${activeResultTab === 'dharani-phonetic' ? 'active' : ''}`}
            onClick={() => setActiveResultTab('dharani-phonetic')}
          >
            <span>陀羅尼·梵音</span>
            <span className="cbeta-tab-count">{phoneticHitsAll.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeResultTab === 'sutra-text'}
            className={`cbeta-search-tab ${activeResultTab === 'sutra-text' ? 'active' : ''}`}
            onClick={() => setActiveResultTab('sutra-text')}
          >
            <span>經文</span>
            <span className="cbeta-tab-count">{sutraTabCount}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeResultTab === 'sutra-title'}
            className={`cbeta-search-tab ${activeResultTab === 'sutra-title' ? 'active' : ''}`}
            onClick={() => setActiveResultTab('sutra-title')}
          >
            <span>經名</span>
            <span className="cbeta-tab-count">{titleTabCount}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeResultTab === 'notes'}
            className={`cbeta-search-tab ${activeResultTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveResultTab('notes')}
          >
            <span>校注與夾注</span>
            <span className="cbeta-tab-count">{noteHitsAll.length}</span>
          </button>
        </div>

        <button
          type="button"
          className="btn-scholarly"
          onClick={onCloseSearchView}
        >
          <ArrowLeft size={14} />
          <span>返回閱讀器</span>
        </button>
      </div>

      {/* Light-Blue Synonym Suggestion Bar (`近義詞建議`) */}
      {showSynonyms && synonyms.length > 0 && (
        <div className="cbeta-synonym-bar">
          <div className="cbeta-synonym-list">
            <span className="cbeta-synonym-label">近義詞建議：</span>
            {synonyms.map((term, i) => (
              <React.Fragment key={term}>
                <button
                  type="button"
                  className="cbeta-synonym-link"
                  onClick={() => onQueryChange(term)}
                >
                  {term}
                </button>
                {i < synonyms.length - 1 && <span className="cbeta-synonym-dot">·</span>}
              </React.Fragment>
            ))}
          </div>
          <button
            type="button"
            className="cbeta-synonym-close"
            onClick={() => setShowSynonyms(false)}
            aria-label="關閉近義詞建議"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Two-Column CBETA Layout: Left `部類` Facets + Right Results */}
      <div className="cbeta-search-grid">
        <aside className="cbeta-bulei-facet-card" aria-label="CBETA 部類篩選">
          <div className="cbeta-bulei-facet-header">
            <span>部類</span>
            {selectedBuleiSet.size > 0 && (
              <button
                type="button"
                className="orig-link-btn"
                onClick={() => setSelectedBuleiSet(new Set())}
              >
                清除
              </button>
            )}
          </div>

          <div className="cbeta-bulei-facet-list">
            {buleiFacetList.length === 0 ? (
              <div style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                無匹配部類
              </div>
            ) : (
              buleiFacetList.map(({ meta, count }) => (
                <label key={meta.id} className="cbeta-bulei-checkbox-row">
                  <input
                    type="checkbox"
                    checked={selectedBuleiSet.has(meta.id)}
                    onChange={() => toggleBuleiCheckbox(meta.id)}
                  />
                  <span className="cbeta-bulei-name">{meta.labelTrad}</span>
                  <span className="cbeta-bulei-count">({count})</span>
                </label>
              ))
            )}
          </div>
        </aside>

        <section className="cbeta-results-main">
          <div className="cbeta-results-toolbar">
            <div className="cbeta-results-summary">
              <span className="cbeta-blue-square" aria-hidden="true" />
              <strong>全文搜尋結果</strong>
              <span>
                共 <strong>{filteredAndSortedRows.length}</strong> 筆
                {activeResultTab === 'dharani-sanskrit'
                  ? '（僅含原庫具完整梵文/悉曇底本之陀羅尼）'
                  : activeResultTab === 'dharani-phonetic'
                  ? '（原典古漢語音譯陀羅尼 · 零反向拼湊）'
                  : ''}
              </span>
              {loadingBodyHits && activeResultTab === 'sutra-text' && (
                <Loader2 size={14} className="spin-icon" />
              )}
            </div>

            <select
              className="cbeta-sort-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'relevance' | 'id' | 'bulei')}
              aria-label="搜尋結果排序"
            >
              <option value="relevance">預設排序</option>
              <option value="id">經號排序</option>
              <option value="bulei">部類排序</option>
            </select>
          </div>

          {filteredAndSortedRows.length === 0 ? (
            <div className="cbeta-empty-box">
              <div>
                此分類下未找到包含「<strong>{query}</strong>」的結果。
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {sanskritHitsAll.length > 0 && activeResultTab !== 'dharani-sanskrit' && (
                  <button
                    type="button"
                    className="btn-scholarly"
                    onClick={() => setActiveResultTab('dharani-sanskrit')}
                  >
                    查看「陀羅尼·梵文」({sanskritHitsAll.length})
                  </button>
                )}
                {phoneticHitsAll.length > 0 && activeResultTab !== 'dharani-phonetic' && (
                  <button
                    type="button"
                    className="btn-scholarly"
                    onClick={() => setActiveResultTab('dharani-phonetic')}
                  >
                    查看「陀羅尼·梵音」({phoneticHitsAll.length})
                  </button>
                )}
                {sutraTabCount > 0 && activeResultTab !== 'sutra-text' && (
                  <button
                    type="button"
                    className="btn-scholarly"
                    onClick={() => setActiveResultTab('sutra-text')}
                  >
                    查看「經文」({sutraTabCount})
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="cbeta-results-list">
              {filteredAndSortedRows.map((row) => {
                const buleiLabel = CBETA_BULEI_MAP[row.buleiId]?.labelTrad || row.buleiId;
                return (
                  <article key={row.key} className="cbeta-result-item">
                    <div className="cbeta-result-title-line">
                      <button
                        type="button"
                        className="cbeta-result-title-btn"
                        onClick={row.onOpen}
                      >
                        <span className="cbeta-result-code">{row.codeId}</span>{' '}
                        <span>{highlightQueryMatches(row.titleText, query)}</span>
                      </button>
                      <span className="cbeta-result-hit-count">{row.hitBadgeText}</span>
                    </div>

                    <div className="cbeta-result-meta-line">
                      <button
                        type="button"
                        className="cbeta-result-bulei-link"
                        onClick={() => toggleBuleiCheckbox(row.buleiId)}
                      >
                        {buleiLabel}
                      </button>
                      <span className="cbeta-result-byline">{row.bylineText}</span>
                      <span className="cbeta-result-kind-tag">{row.kindBadge}</span>
                    </div>

                    <div className="cbeta-result-snippets">
                      {row.snippets.map((snip, sIdx) => (
                        <div key={sIdx} className="cbeta-result-snippet-row">
                          <span className="cbeta-snippet-num">{sIdx + 1}</span>
                          <div className="cbeta-snippet-text">
                            {highlightQueryMatches(snip, query)}
                          </div>
                          <button
                            type="button"
                            className="cbeta-open-icon-btn"
                            onClick={row.onOpen}
                            title="在平行標籤閱讀器中打開"
                          >
                            <ExternalLink size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
