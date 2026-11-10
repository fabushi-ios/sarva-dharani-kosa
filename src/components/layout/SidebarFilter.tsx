import React, { useState, useMemo } from 'react';
import { Bookmark, ChevronDown } from 'lucide-react';
import type { DharaniCategoryId, DharaniEntry } from '../../types/kosaTypes';
import { DHARANI_CATEGORIES } from '../../data/categories';

interface SidebarFilterProps {
  entries: DharaniEntry[];
  totalCorpusCount: number;
  selectedId: string;
  onSelectEntry: (id: string) => void;
  selectedCategory: DharaniCategoryId | 'all';
  onSelectCategory: (cat: DharaniCategoryId | 'all') => void;
  sourceFilter: 'all' | 'cbeta-siddham' | 'gretil-sanskrit';
  onSourceFilterChange: (f: 'all' | 'cbeta-siddham' | 'gretil-sanskrit') => void;
  onlyBookmarked: boolean;
  onToggleOnlyBookmarked: () => void;
  bookmarkedIds: Set<string>;
}

export const SidebarFilter: React.FC<SidebarFilterProps> = ({
  entries,
  totalCorpusCount,
  selectedId,
  onSelectEntry,
  selectedCategory,
  onSelectCategory,
  sourceFilter,
  onSourceFilterChange,
  onlyBookmarked,
  onToggleOnlyBookmarked,
  bookmarkedIds,
}) => {
  const [visibleCount, setVisibleCount] = useState<number>(80);

  const displayedEntries = useMemo(() => {
    const sliced = entries.slice(0, visibleCount);
    if (selectedId && !sliced.some((e) => e.id === selectedId)) {
      const selectedItem = entries.find((e) => e.id === selectedId);
      if (selectedItem) {
        return [selectedItem, ...sliced];
      }
    }
    return sliced;
  }, [entries, visibleCount, selectedId]);

  return (
    <aside className="sidebar-panel" aria-label="梵文陀罗尼分类目录">
      <div className="sidebar-top-controls">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            总持部类检索 ({entries.length} / {totalCorpusCount} 部)
          </span>
          <button
            id="filter-bookmarks-toggle"
            type="button"
            className={`source-chip-btn ${onlyBookmarked ? 'active' : ''}`}
            style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            onClick={onToggleOnlyBookmarked}
          >
            <Bookmark size={12} />
            <span>已藏 ({bookmarkedIds.size})</span>
          </button>
        </div>

        <div className="category-pills-grid">
          <button
            id="cat-pill-all"
            type="button"
            className={`category-pill-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => {
              setVisibleCount(80);
              onSelectCategory('all');
            }}
          >
            <span>全部法门总揽 ({totalCorpusCount})</span>
            <span className="category-pill-bija">𑖌𑖼</span>
          </button>
          {DHARANI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              id={`cat-pill-${cat.id}`}
              type="button"
              className={`category-pill-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => {
                setVisibleCount(80);
                onSelectCategory(cat.id);
              }}
              title={cat.descriptionZh}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cat.nameZh}
              </span>
              <span className="category-pill-bija">{cat.bijaSiddham}</span>
            </button>
          ))}
        </div>

        <div className="source-filter-row" role="group" aria-label="权威数据源筛选">
          <button
            id="source-filter-all"
            type="button"
            className={`source-chip-btn ${sourceFilter === 'all' ? 'active' : ''}`}
            onClick={() => onSourceFilterChange('all')}
          >
            全部原典 ({totalCorpusCount})
          </button>
          <button
            id="source-filter-cbeta"
            type="button"
            className={`source-chip-btn ${sourceFilter === 'cbeta-siddham' ? 'active' : ''}`}
            onClick={() => onSourceFilterChange('cbeta-siddham')}
          >
            CBETA 大藏经 (650+)
          </button>
          <button
            id="source-filter-gretil"
            type="button"
            className={`source-chip-btn ${sourceFilter === 'gretil-sanskrit' ? 'active' : ''}`}
            onClick={() => onSourceFilterChange('gretil-sanskrit')}
          >
            GRETIL 梵本 (200)
          </button>
        </div>
      </div>

      <div className="dharani-catalog-list">
        {entries.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            未找到匹配的梵文陀罗尼条目，请尝试切换部类或清空搜索词。
          </div>
        ) : (
          <>
            {displayedEntries.map((entry) => {
              const hasSiddhamTokens =
                entry.provenance.cbetaInterlinearTokens &&
                entry.provenance.cbetaInterlinearTokens.length > 0;
              const hasGretil = Boolean(entry.provenance.gretilFile);
              const isSelected = entry.id === selectedId;

              return (
                <button
                  key={entry.id}
                  id={`catalog-item-${entry.id}`}
                  type="button"
                  className={`catalog-entry-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectEntry(entry.id)}
                >
                  <div className="catalog-item-top">
                    <span className="catalog-taisho-tag">{entry.taishoNo}</span>
                    <div className="catalog-source-badges">
                      {hasSiddhamTokens && (
                        <span className="badge-siddham-tt" title="含 CBETA 官方 #SD-* 悉昙梵字逐字对音数据">
                          悉昙对音 {entry.provenance.cbetaInterlinearTokens?.length}字
                        </span>
                      )}
                      {hasGretil && (
                        <span className="badge-gretil-ms" title={`含 GRETIL 梵文原典 (${entry.provenance.gretilFile})`}>
                          GRETIL梵本
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="catalog-item-title-zh">{entry.titleZh}</div>
                  <div className="catalog-item-title-skt">{entry.titleSanskritIast}</div>
                </button>
              );
            })}

            {entries.length > visibleCount && (
              <div style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  id="btn-load-more-catalog"
                  type="button"
                  className="btn-secondary-gold"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem' }}
                  onClick={() => setVisibleCount((prev) => prev + 150)}
                >
                  <ChevronDown size={14} />
                  <span>继续加载 (+150 部 · 剩余 {entries.length - visibleCount} 部)</span>
                </button>
                <button
                  id="btn-load-all-catalog"
                  type="button"
                  className="btn-secondary-gold"
                  style={{ fontSize: '0.78rem' }}
                  onClick={() => setVisibleCount(entries.length)}
                >
                  展开全部 ({entries.length})
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
