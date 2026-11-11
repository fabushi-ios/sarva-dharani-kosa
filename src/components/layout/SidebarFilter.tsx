import React, { useState, useMemo } from 'react';
import { Bookmark, ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react';
import type { DharaniCategoryId, DharaniEntry } from '../../types/kosaTypes';
import { DHARANI_CATEGORIES } from '../../data/categories';

export type SourceFilterType = 'all' | 'global-12db' | 'cbeta-siddham' | 'gretil-sanskrit';

const TWELVE_DB_CHIPS: Array<{ id: string; label: string }> = [
  { id: 'all', label: '全部12库' },
  { id: 'db1_fangshan', label: 'DB1 房山石经' },
  { id: 'db2_taisho_ext', label: 'DB2 大正悉昙/字书' },
  { id: 'db3_dsbc_gretil', label: 'DB3 尼泊尔DSBC' },
  { id: 'db4_84000', label: 'DB4 84000藏密' },
  { id: 'db5_buddhanexus', label: 'DB5 BuddhaNexus' },
  { id: 'db6_sarit', label: 'DB6 SARIT密续' },
  { id: 'db7_cudl_hidas', label: 'DB7 剑桥CUDL' },
  { id: 'db8_polyglotta', label: 'DB8 奥斯陆对勘' },
  { id: 'db9_rkts', label: 'DB9 维也纳rKTs' },
  { id: 'db10_all_nibs', label: 'DB10 ALL-NIBS' },
  { id: 'db11_idp_dunhuang', label: 'DB11 西域丝路' },
  { id: 'db12_muktabodha_ochs', label: 'DB12 牛津OCHS' },
];

interface SidebarFilterProps {
  entries: DharaniEntry[];
  totalCorpusCount: number;
  selectedId: string;
  onSelectEntry: (id: string) => void;
  selectedCategory: DharaniCategoryId | 'all';
  onSelectCategory: (cat: DharaniCategoryId | 'all') => void;
  sourceFilter: SourceFilterType;
  onSourceFilterChange: (f: SourceFilterType) => void;
  selectedDbSubFilter?: string;
  onSelectDbSubFilter?: (dbId: string) => void;
  onlyBookmarked: boolean;
  onToggleOnlyBookmarked: () => void;
  bookmarkedIds: Set<string>;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
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
  selectedDbSubFilter: controlledDbSubFilter,
  onSelectDbSubFilter,
  onlyBookmarked,
  onToggleOnlyBookmarked,
  bookmarkedIds,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const [visibleCount, setVisibleCount] = useState<number>(80);
  const [internalDbSubFilter, setInternalDbSubFilter] = useState<string>('all');
  const [filtersCollapsed, setFiltersCollapsed] = useState<boolean>(false);

  const selectedDbSubFilter = controlledDbSubFilter ?? internalDbSubFilter;
  const setSelectedDbSubFilter = (dbId: string) => {
    if (onSelectDbSubFilter) {
      onSelectDbSubFilter(dbId);
    } else {
      setInternalDbSubFilter(dbId);
    }
  };

  const dbFilteredEntries = useMemo(() => {
    if (selectedDbSubFilter === 'all') return entries;
    return entries.filter((e) => e.provenance.databaseId === selectedDbSubFilter);
  }, [entries, selectedDbSubFilter]);

  const displayedEntries = useMemo(() => {
    const sliced = dbFilteredEntries.slice(0, visibleCount);
    if (selectedId && !sliced.some((e) => e.id === selectedId)) {
      const selectedItem = dbFilteredEntries.find((e) => e.id === selectedId);
      if (selectedItem) {
        return [selectedItem, ...sliced];
      }
    }
    return sliced;
  }, [dbFilteredEntries, visibleCount, selectedId]);

  const activeDbLabel = useMemo(() => {
    const found = TWELVE_DB_CHIPS.find((c) => c.id === selectedDbSubFilter);
    return found && found.id !== 'all' ? found.label : null;
  }, [selectedDbSubFilter]);

  return (
    <>
      <div
        className={`mobile-drawer-backdrop ${mobileOpen ? 'is-open' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />
      <aside
        className={`sidebar-panel ${mobileOpen ? 'is-mobile-open' : ''}`}
        aria-label="梵文陀罗尼分类目录"
      >
        <div className="sidebar-mobile-drawer-header">
          <span className="sidebar-mobile-drawer-title">
            <span>经咒目录检索 ({dbFilteredEntries.length} 部)</span>
          </span>
          <button
            type="button"
            className="sidebar-mobile-close-btn"
            onClick={onCloseMobile}
          >
            <X size={14} />
            <span>收起目录</span>
          </button>
        </div>

        <div className="sidebar-top-controls">
          <div className="sidebar-header-bar">
            <span className="sidebar-title-count">
              总持目录 ({dbFilteredEntries.length} / {totalCorpusCount})
            </span>

            <div className="sidebar-header-actions">
              <button
                id="filter-bookmarks-toggle"
                type="button"
                className={`source-chip-btn ${onlyBookmarked ? 'active' : ''}`}
                style={{
                  flex: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.22rem',
                  padding: '0.24rem 0.48rem',
                }}
                onClick={onToggleOnlyBookmarked}
              >
                <Bookmark size={12} />
                <span>已藏 ({bookmarkedIds.size})</span>
              </button>

              <button
                type="button"
                className="sidebar-collapse-btn"
                onClick={() => setFiltersCollapsed((c) => !c)}
                title={filtersCollapsed ? '展开部类与数据源筛选' : '收起筛选区以扩大经咒列表视野'}
              >
                <SlidersHorizontal size={11} />
                <span>{filtersCollapsed ? '展开筛选' : '收起筛选'}</span>
                {filtersCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              </button>
            </div>
          </div>

          <div
            style={{
              display: filtersCollapsed ? 'none' : 'flex',
              flexDirection: 'column',
              gap: '0.55rem',
            }}
          >
            <div className="category-pills-grid">
              <button
                id="cat-pill-all"
                type="button"
                className={`category-pill-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => {
                  setVisibleCount(80);
                  setSelectedDbSubFilter('all');
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
                    if (cat.id !== 'global-12db-canon') {
                      setSelectedDbSubFilter('all');
                    }
                    onSelectCategory(cat.id);
                  }}
                  title={cat.descriptionZh}
                >
                  <span style={{ lineHeight: 1.25, wordBreak: 'break-word', minWidth: 0 }}>
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
                onClick={() => {
                  setSelectedDbSubFilter('all');
                  onSourceFilterChange('all');
                }}
              >
                全部原典
              </button>
              <button
                id="source-filter-12db"
                type="button"
                className={`source-chip-btn ${sourceFilter === 'global-12db' ? 'active' : ''}`}
                onClick={() => onSourceFilterChange('global-12db')}
              >
                全球12库
              </button>
              <button
                id="source-filter-cbeta"
                type="button"
                className={`source-chip-btn ${sourceFilter === 'cbeta-siddham' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedDbSubFilter('all');
                  onSourceFilterChange('cbeta-siddham');
                }}
              >
                CBETA对音
              </button>
              <button
                id="source-filter-gretil"
                type="button"
                className={`source-chip-btn ${sourceFilter === 'gretil-sanskrit' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedDbSubFilter('all');
                  onSourceFilterChange('gretil-sanskrit');
                }}
              >
                GRETIL梵本
              </button>
            </div>

            <details
              className="db-subfilter-details"
              open={sourceFilter === 'global-12db' || selectedDbSubFilter !== 'all'}
            >
              <summary className="db-subfilter-summary">
                <span>
                  按 12 大国际梵典库细分
                  {activeDbLabel ? ` · 当前：${activeDbLabel}` : ' (DB1–DB12)'}
                </span>
                <ChevronDown size={13} />
              </summary>
              <div
                className="db-subfilter-chips-wrap"
                role="group"
                aria-label="全球12大权威数据库子筛选"
              >
                {TWELVE_DB_CHIPS.map((chip) => (
                  <button
                    key={chip.id}
                    id={`db-subfilter-${chip.id}`}
                    data-db-id={chip.id}
                    type="button"
                    className={`source-chip-btn ${selectedDbSubFilter === chip.id ? 'active' : ''}`}
                    style={{ fontSize: '0.68rem', padding: '0.18rem 0.44rem', flex: 'none' }}
                    onClick={() => {
                      setVisibleCount(80);
                      setSelectedDbSubFilter(chip.id);
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </details>
          </div>
        </div>

        <div className="dharani-catalog-list">
          {dbFilteredEntries.length === 0 ? (
            <div style={{ padding: '1.75rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              <div>当前筛选条件下未找到匹配条目。</div>
              {(selectedCategory !== 'all' || sourceFilter !== 'all' || selectedDbSubFilter !== 'all' || onlyBookmarked) && (
                <button
                  type="button"
                  className="source-chip-btn active"
                  style={{ marginTop: '0.65rem', padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                  onClick={() => {
                    setSelectedDbSubFilter('all');
                    onSelectCategory('all');
                    onSourceFilterChange('all');
                    if (onlyBookmarked) onToggleOnlyBookmarked();
                  }}
                >
                  解除筛选限制，浏览全部 {totalCorpusCount} 部原典
                </button>
              )}
            </div>
          ) : (
            <>
              {displayedEntries.map((entry) => {
                const hasSiddhamTokens =
                  entry.provenance.cbetaInterlinearTokens &&
                  entry.provenance.cbetaInterlinearTokens.length > 0;
                const hasGretil = Boolean(entry.provenance.gretilFile);
                const dbBadge = entry.provenance.databaseBadgeZh;
                const isSelected = entry.id === selectedId;

                return (
                  <button
                    key={entry.id}
                    id={`catalog-item-${entry.id}`}
                    type="button"
                    className={`catalog-entry-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onSelectEntry(entry.id);
                      onCloseMobile?.();
                    }}
                  >
                    <div className="catalog-item-top">
                      <span className="catalog-taisho-tag">{entry.taishoNo}</span>
                      <div className="catalog-source-badges">
                        {dbBadge && (
                          <span
                            className="badge-db-origin"
                            title={`全球12大权威数据库来源：${dbBadge}`}
                          >
                            {dbBadge}
                          </span>
                        )}
                        {hasSiddhamTokens && (
                          <span className="badge-siddham-tt" title="含 CBETA 官方 #SD-* 悉昙梵字逐字对音数据">
                            悉昙对音 {entry.provenance.cbetaInterlinearTokens?.length}字
                          </span>
                        )}
                        {hasGretil && !dbBadge && (
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

              {dbFilteredEntries.length > visibleCount && (
                <div style={{ padding: '0.75rem', display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <button
                    id="btn-load-more-catalog"
                    type="button"
                    className="btn-secondary-gold"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.76rem' }}
                    onClick={() => setVisibleCount((prev) => prev + 150)}
                  >
                    <ChevronDown size={14} />
                    <span>加载更多 (+150 · 剩 {dbFilteredEntries.length - visibleCount})</span>
                  </button>
                  <button
                    id="btn-load-all-catalog"
                    type="button"
                    className="btn-secondary-gold"
                    style={{ fontSize: '0.76rem' }}
                    onClick={() => setVisibleCount(dbFilteredEntries.length)}
                  >
                    全部 ({dbFilteredEntries.length})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
};
