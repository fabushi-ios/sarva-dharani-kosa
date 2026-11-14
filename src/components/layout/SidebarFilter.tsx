import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Bookmark,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  ListOrdered,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  RotateCcw,
  Search,
  Square,
  X,
} from 'lucide-react';
import type { DharaniCategoryId, DharaniEntry } from '../../types/kosaTypes';
import type { CanonCatalogItem } from '../../core/canon/canonLibraryTypes';
import {
  CBETA_BULEI_LIST,
  CBETA_BULEI_MAP,
  resolveCanonItemBulei,
  resolveEntryBulei,
  type CbetaBuleiId,
} from '../../core/canon/cbetaBulei';
import {
  classifyDharaniEntryKind,
  type SearchScope,
} from '../../core/search/searchEngine';
import type { PlaybackState } from '../../services/audio/sanskritAudioEngine';

export type SourceFilterType = 'all' | 'global-12db' | 'cbeta-siddham' | 'gretil-sanskrit';
export type SidebarViewMode = 'catalog' | 'outline';

const TWELVE_DB_OPTIONS: Array<{ id: string; label: string; shortLabel: string }> = [
  { id: 'all', label: '全部館藏數據庫 (CBETA + DB1–DB12)', shortLabel: '全部館藏' },
  { id: 'db1_fangshan', label: 'DB1 · 房山石經《釋教最上乘陀羅尼集》', shortLabel: 'DB1 房山石經' },
  { id: 'db2_taisho_ext', label: 'DB2 · 大正藏悉曇字書與續藏真言', shortLabel: 'DB2 大正悉曇' },
  { id: 'db3_dsbc_gretil', label: 'DB3 · 尼泊爾 DSBC 梵文陀羅尼集', shortLabel: 'DB3 尼泊爾DSBC' },
  { id: 'db4_84000', label: 'DB4 · 84000 甘珠爾秘密部梵藏真言', shortLabel: 'DB4 84000藏密' },
  { id: 'db5_buddhanexus', label: 'DB5 · BuddhaNexus 四語平行文獻庫', shortLabel: 'DB5 BuddhaNexus' },
  { id: 'db6_sarit', label: 'DB6 · SARIT 梵文密續原典庫', shortLabel: 'DB6 SARIT密續' },
  { id: 'db7_cudl_hidas', label: 'DB7 · 劍橋 CUDL 梵文貝葉經寫本', shortLabel: 'DB7 劍橋CUDL' },
  { id: 'db8_polyglotta', label: 'DB8 · 奧斯陸 16 本多語平行對勘', shortLabel: 'DB8 奧斯陸對勘' },
  { id: 'db9_rkts', label: 'DB9 · 維也納 rKTs 德格版陀羅尼集', shortLabel: 'DB9 維也納rKTs' },
  { id: 'db10_all_nibs', label: 'DB10 · ALL-NIBS 尼瓦爾梵本寫本庫', shortLabel: 'DB10 ALL-NIBS' },
  { id: 'db11_idp_dunhuang', label: 'DB11 · IDP/CEToM 敦煌西域絲路梵本', shortLabel: 'DB11 西域絲路' },
  { id: 'db12_muktabodha_ochs', label: 'DB12 · 牛津 OCHS 種子字辭典與密續', shortLabel: 'DB12 牛津OCHS' },
];

export interface SidebarFilterProps {
  entries: DharaniEntry[];
  preCategoryEntries?: DharaniEntry[];
  totalCorpusCount: number;
  selectedId: string;
  activeEntry?: DharaniEntry;
  onSelectEntry: (id: string) => void;
  canonScriptureHits?: CanonCatalogItem[];
  onSelectCanonScripture?: (item: CanonCatalogItem) => void;
  onOpenFullCanonLibrary?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  searchScope?: SearchScope;
  onSearchScopeChange?: (scope: SearchScope) => void;
  selectedBulei?: CbetaBuleiId | 'all';
  onSelectBulei?: (bulei: CbetaBuleiId | 'all') => void;
  selectedCategory: DharaniCategoryId | 'all';
  onSelectCategory: (cat: DharaniCategoryId | 'all') => void;
  sourceFilter: SourceFilterType;
  onSourceFilterChange: (f: SourceFilterType) => void;
  selectedDbSubFilter?: string;
  onSelectDbSubFilter?: (dbId: string) => void;
  onlyBookmarked: boolean;
  onToggleOnlyBookmarked: () => void;
  bookmarkedIds: Set<string>;
  onToggleBookmark?: (id: string) => void;
  playbackState?: PlaybackState;
  onPlayAllVerses?: () => void;
  onStopPlayback?: () => void;
  onPlaySingleVerse?: (verseArrayIdx: number) => void;
  onJumpToSection?: (
    target: 'hero' | 'original' | 'summary' | 'interlinear' | 'concordance'
  ) => void;
  onJumpToVerse?: (verseArrayIdx: number) => void;
  sidebarMode?: SidebarViewMode;
  onSidebarModeChange?: (mode: SidebarViewMode) => void;
  sidebarCollapsed?: boolean;
  onToggleSidebarCollapsed?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

function formatCompactCatalogTag(entry: DharaniEntry): string {
  const primaryNo = (entry.taishoNo || '').split('/')[0]?.trim();
  return primaryNo || entry.provenance.databaseBadgeZh || entry.provenance.sourceType;
}

export const SidebarFilter: React.FC<SidebarFilterProps> = ({
  entries,
  preCategoryEntries,
  totalCorpusCount,
  selectedId,
  activeEntry,
  onSelectEntry,
  canonScriptureHits = [],
  onSelectCanonScripture,
  searchQuery = '',
  onSearchChange,
  searchScope = 'all',
  onSearchScopeChange,
  selectedBulei: controlledBulei,
  onSelectBulei,
  onSelectCategory,
  sourceFilter,
  onSourceFilterChange,
  selectedDbSubFilter: controlledDbSubFilter,
  onSelectDbSubFilter,
  onlyBookmarked,
  onToggleOnlyBookmarked,
  bookmarkedIds,
  onToggleBookmark,
  playbackState,
  onPlayAllVerses,
  onStopPlayback,
  onJumpToSection,
  onJumpToVerse,
  sidebarMode: controlledMode,
  onSidebarModeChange,
  sidebarCollapsed = false,
  onToggleSidebarCollapsed,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const [visibleCount, setVisibleCount] = useState<number>(80);
  const [verseFilterQuery, setVerseFilterQuery] = useState<string>('');
  const [internalBulei, setInternalBulei] = useState<CbetaBuleiId | 'all'>('all');
  const [internalDbSubFilter, setInternalDbSubFilter] = useState<string>('all');
  const [internalMode, setInternalMode] = useState<SidebarViewMode>('catalog');
  const [buleiExpanded, setBuleiExpanded] = useState<boolean>(false);

  const catalogListRef = useRef<HTMLDivElement>(null);

  const sidebarMode = controlledMode ?? internalMode;
  const setSidebarMode = useCallback(
    (next: SidebarViewMode) => {
      if (onSidebarModeChange) onSidebarModeChange(next);
      else setInternalMode(next);
    },
    [onSidebarModeChange]
  );

  const selectedBulei = controlledBulei ?? internalBulei;
  const setSelectedBulei = (next: CbetaBuleiId | 'all') => {
    if (onSelectBulei) onSelectBulei(next);
    else setInternalBulei(next);
  };

  const selectedDbSubFilter = controlledDbSubFilter ?? internalDbSubFilter;
  const setSelectedDbSubFilter = (dbId: string) => {
    if (onSelectDbSubFilter) onSelectDbSubFilter(dbId);
    else setInternalDbSubFilter(dbId);
  };

  useEffect(() => {
    setVerseFilterQuery('');
  }, [selectedId]);

  const dbFilteredEntries = useMemo(() => {
    let base = entries;
    if (selectedDbSubFilter !== 'all') {
      base = base.filter((e) => e.provenance.databaseId === selectedDbSubFilter);
    }
    if (selectedBulei !== 'all') {
      base = base.filter((e) => resolveEntryBulei(e) === selectedBulei);
    }
    return base;
  }, [entries, selectedDbSubFilter, selectedBulei]);

  const buleiFilteredCanonHits = useMemo(() => {
    if (selectedBulei === 'all') return canonScriptureHits;
    return canonScriptureHits.filter((c) => resolveCanonItemBulei(c) === selectedBulei);
  }, [canonScriptureHits, selectedBulei]);

  // Compute live CBETA 部類 counts from preCategoryEntries + canonScriptureHits
  const buleiCounts = useMemo(() => {
    const pool = preCategoryEntries ?? entries;
    const map = new Map<CbetaBuleiId, number>();
    for (const b of CBETA_BULEI_LIST) map.set(b.id, 0);
    for (const e of pool) {
      const bid = resolveEntryBulei(e);
      map.set(bid, (map.get(bid) || 0) + 1);
    }
    for (const c of canonScriptureHits) {
      const bid = resolveCanonItemBulei(c);
      map.set(bid, (map.get(bid) || 0) + 1);
    }
    return map;
  }, [preCategoryEntries, entries, canonScriptureHits]);

  const visibleBuleiItems = useMemo(() => {
    const withCounts = CBETA_BULEI_LIST.map((b) => ({
      meta: b,
      count: buleiCounts.get(b.id) || 0,
    }));
    if (buleiExpanded) return withCounts;
    return withCounts.slice(0, 8);
  }, [buleiCounts, buleiExpanded]);

  const selectedIdxInFiltered = useMemo(
    () => dbFilteredEntries.findIndex((e) => e.id === selectedId),
    [dbFilteredEntries, selectedId]
  );

  const effectiveVisibleCount = useMemo(() => {
    if (selectedIdxInFiltered >= visibleCount) {
      return Math.min(dbFilteredEntries.length, selectedIdxInFiltered + 30);
    }
    return visibleCount;
  }, [visibleCount, selectedIdxInFiltered, dbFilteredEntries.length]);

  const displayedEntries = useMemo(
    () => dbFilteredEntries.slice(0, effectiveVisibleCount),
    [dbFilteredEntries, effectiveVisibleCount]
  );

  const hasAnyActiveFilter =
    Boolean(searchQuery.trim()) ||
    selectedBulei !== 'all' ||
    searchScope !== 'all' ||
    onlyBookmarked ||
    sourceFilter !== 'all' ||
    selectedDbSubFilter !== 'all';

  const handleResetAllFilters = () => {
    onSearchChange?.('');
    onSearchScopeChange?.('all');
    setSelectedBulei('all');
    onSelectCategory('all');
    onSourceFilterChange('all');
    setSelectedDbSubFilter('all');
    if (onlyBookmarked) onToggleOnlyBookmarked();
  };

  const resolvedCurrentEntry = useMemo(
    () => activeEntry || dbFilteredEntries.find((e) => e.id === selectedId) || dbFilteredEntries[0],
    [activeEntry, dbFilteredEntries, selectedId]
  );

  const currentVerseCount = resolvedCurrentEntry?.verses.length ?? 0;

  return (
    <>
      <div
        className={`mobile-drawer-backdrop ${mobileOpen ? 'is-open' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      {sidebarCollapsed && (
        <aside className="sidebar-collapsed-rail" aria-label="已收起的目錄欄">
          <button
            id="btn-expand-sidebar-rail"
            type="button"
            className="sidebar-rail-btn is-primary"
            onClick={onToggleSidebarCollapsed}
            title="展開目錄欄"
          >
            <PanelLeftOpen size={16} />
          </button>
        </aside>
      )}

      <aside
        className={`sidebar-panel is-cbeta-sidebar ${mobileOpen ? 'is-mobile-open' : ''}`}
        style={sidebarCollapsed && !mobileOpen ? { display: 'none' } : undefined}
        aria-label="CBETA 部類與經典目錄"
      >
        <div className="sidebar-mode-header">
          <div className="sidebar-mode-tabs" role="tablist">
            <button
              id="sidebar-tab-catalog"
              type="button"
              role="tab"
              aria-selected={sidebarMode === 'catalog'}
              className={`sidebar-mode-tab ${sidebarMode === 'catalog' ? 'active' : ''}`}
              onClick={() => setSidebarMode('catalog')}
            >
              <BookOpen size={13} />
              <span>部類目錄</span>
              <span className="sidebar-mode-badge">
                {dbFilteredEntries.length + buleiFilteredCanonHits.length}
              </span>
            </button>

            <button
              id="sidebar-tab-outline"
              type="button"
              role="tab"
              aria-selected={sidebarMode === 'outline'}
              className={`sidebar-mode-tab ${sidebarMode === 'outline' ? 'active' : ''}`}
              onClick={() => setSidebarMode('outline')}
            >
              <ListOrdered size={13} />
              <span>本篇導覽</span>
            </button>
          </div>

          {onToggleSidebarCollapsed && (
            <button
              id="btn-collapse-sidebar"
              type="button"
              className="sidebar-icon-collapse-btn sidebar-desktop-collapse-only"
              onClick={onToggleSidebarCollapsed}
              title="收起左側欄"
            >
              <PanelLeftClose size={15} />
            </button>
          )}

          {onCloseMobile && (
            <button
              id="btn-close-mobile-sidebar"
              type="button"
              className="sidebar-icon-collapse-btn sidebar-mobile-close-only"
              style={{ display: 'none' }}
              onClick={onCloseMobile}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {sidebarMode === 'catalog' ? (
          <>
            <div className="sidebar-top-controls">
              {/* Compact Type Scope Filter: 全部 | 梵文咒 | 梵音咒 | 經文 */}
              <div className="sidebar-scope-segmented" role="group" aria-label="文獻類型">
                {(
                  [
                    { id: 'all', label: '全部' },
                    { id: 'dharani-sanskrit', label: '陀羅尼·梵文' },
                    { id: 'dharani-phonetic', label: '陀羅尼·梵音' },
                    { id: 'sutra-text', label: '經文' },
                  ] as Array<{ id: SearchScope; label: string }>
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`sidebar-scope-btn ${searchScope === item.id ? 'active' : ''}`}
                    onClick={() => {
                      setVisibleCount(80);
                      onSearchScopeChange?.(item.id);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Official CBETA 部類 List */}
              <div className="sidebar-cbeta-bulei-box" role="group" aria-label="CBETA 部類分類">
                <div className="sidebar-bulei-box-head">
                  <span>CBETA 部類</span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                    <button
                      id="filter-bookmarks-toggle"
                      type="button"
                      className={`orig-link-btn ${onlyBookmarked ? 'is-active' : ''}`}
                      onClick={onToggleOnlyBookmarked}
                    >
                      <Bookmark size={11} style={{ verticalAlign: '-1px', marginRight: '2px' }} />
                      收藏{bookmarkedIds.size > 0 ? `(${bookmarkedIds.size})` : ''}
                    </button>
                    {hasAnyActiveFilter && (
                      <button
                        id="sidebar-reset-filters-btn"
                        type="button"
                        className="orig-link-btn"
                        onClick={handleResetAllFilters}
                      >
                        重置
                      </button>
                    )}
                  </div>
                </div>

                <div className="sidebar-bulei-list">
                  <button
                    id="bulei-item-all"
                    type="button"
                    className={`sidebar-bulei-item ${selectedBulei === 'all' ? 'active' : ''}`}
                    onClick={() => {
                      setVisibleCount(80);
                      setSelectedBulei('all');
                    }}
                  >
                    <span>全部部類</span>
                    <span className="bulei-item-count">
                      ({(preCategoryEntries ?? entries).length + canonScriptureHits.length})
                    </span>
                  </button>

                  {visibleBuleiItems.map(({ meta, count }) => (
                    <button
                      key={meta.id}
                      id={`bulei-item-${meta.id}`}
                      type="button"
                      className={`sidebar-bulei-item ${selectedBulei === meta.id ? 'active' : ''} ${
                        count === 0 ? 'is-zero' : ''
                      }`}
                      onClick={() => {
                        setVisibleCount(80);
                        setSelectedBulei(selectedBulei === meta.id ? 'all' : meta.id);
                      }}
                      title={meta.taishoRangeNote}
                    >
                      <span>{meta.labelTrad}</span>
                      <span className="bulei-item-count">({count})</span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="sidebar-bulei-expand-btn"
                  onClick={() => setBuleiExpanded((v) => !v)}
                >
                  <span>{buleiExpanded ? '收起部分部類 ▴' : `展開全部 ${CBETA_BULEI_LIST.length} 個部類 ▾`}</span>
                </button>
              </div>

              {/* Clean Collapsed Database Subfilter (preserves SSR db1_fangshan..db12_muktabodha_ochs) */}
              <details className="sidebar-db-details">
                <summary>館藏數據庫細分篩選 (DB1–DB12)</summary>
                <div style={{ paddingTop: '0.4rem' }}>
                  <select
                    id="sidebar-12db-select"
                    className="sidebar-db-select"
                    value={selectedDbSubFilter}
                    onChange={(e) => {
                      const nextDb = e.target.value;
                      setVisibleCount(80);
                      if (nextDb !== 'all' && sourceFilter !== 'global-12db') {
                        onSourceFilterChange('global-12db');
                      } else if (nextDb === 'all' && sourceFilter === 'global-12db') {
                        onSourceFilterChange('all');
                      }
                      setSelectedDbSubFilter(nextDb);
                    }}
                  >
                    {TWELVE_DB_OPTIONS.map((db) => (
                      <option key={db.id} value={db.id}>
                        {db.label}
                      </option>
                    ))}
                  </select>
                </div>
              </details>
            </div>

            <div ref={catalogListRef} className="dharani-catalog-list">
              {/* Canon Scripture Matches */}
              {buleiFilteredCanonHits.length > 0 && onSelectCanonScripture && (
                <>
                  <div className="sidebar-canon-section-header">
                    <span>藏經原典經文（{buleiFilteredCanonHits.length} 部）</span>
                  </div>
                  {buleiFilteredCanonHits.slice(0, 25).map((c) => {
                    const synthId = `canon-scripture-${c.id}`;
                    const isSelected = selectedId === synthId;
                    const buleiLabel = CBETA_BULEI_MAP[resolveCanonItemBulei(c)].shortZh;
                    return (
                      <div
                        key={synthId}
                        data-entry-id={synthId}
                        className={`catalog-entry-row ${isSelected ? 'selected' : ''}`}
                      >
                        <button
                          type="button"
                          className="catalog-entry-select-btn"
                          onClick={() => {
                            onSelectCanonScripture(c);
                            onCloseMobile?.();
                          }}
                        >
                          <div className="catalog-row-title-line">
                            <span className="catalog-row-title-zh">《{c.title}》</span>
                          </div>
                          <div className="catalog-row-meta-line">
                            <span className="badge-pure-sutra">
                              {c.dharani > 0 ? `經文+咒${c.dharani}` : '經文'}
                            </span>
                            <span className="catalog-taisho-tag">{c.id}</span>
                            <span className="catalog-deity-snippet">{buleiLabel}</span>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </>
              )}

              {dbFilteredEntries.length === 0 && buleiFilteredCanonHits.length === 0 ? (
                <div className="sidebar-empty-hint">
                  <div>當前部類或篩選下暫無條目。</div>
                  {hasAnyActiveFilter && (
                    <button
                      type="button"
                      className="btn-scholarly"
                      onClick={handleResetAllFilters}
                    >
                      <RotateCcw size={13} />
                      <span>查看全部 ({totalCorpusCount})</span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {displayedEntries.map((entry) => {
                    const isSelected = entry.id === selectedId;
                    const isBookmarked = bookmarkedIds.has(entry.id);
                    const kind = classifyDharaniEntryKind(entry);
                    const buleiLabel = CBETA_BULEI_MAP[resolveEntryBulei(entry)].shortZh;
                    const compactTag = formatCompactCatalogTag(entry);

                    return (
                      <div
                        key={entry.id}
                        data-entry-id={entry.id}
                        className={`catalog-entry-row ${isSelected ? 'selected' : ''}`}
                      >
                        <button
                          id={`catalog-item-${entry.id}`}
                          type="button"
                          className="catalog-entry-select-btn"
                          onClick={() => {
                            onSelectEntry(entry.id);
                            onCloseMobile?.();
                          }}
                        >
                          <div className="catalog-row-title-line">
                            <span className="catalog-row-title-zh">{entry.titleZh}</span>
                          </div>

                          <div className="catalog-row-meta-line">
                            {kind === 'dharani-sanskrit' ? (
                              <span className="catalog-kind-tag is-skt">梵文</span>
                            ) : kind === 'dharani-phonetic' ? (
                              <span className="catalog-kind-tag is-pho">梵音</span>
                            ) : (
                              <span className="badge-pure-sutra">經文</span>
                            )}
                            <span className="catalog-deity-snippet">{buleiLabel}</span>
                            <span className="catalog-taisho-tag">{compactTag}</span>
                          </div>
                        </button>

                        {onToggleBookmark && (
                          <div className="catalog-entry-actions">
                            <button
                              type="button"
                              className={`catalog-fav-btn ${isBookmarked ? 'is-bookmarked' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleBookmark(entry.id);
                              }}
                              aria-label="收藏"
                            >
                              <Bookmark size={13} fill={isBookmarked ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {dbFilteredEntries.length > effectiveVisibleCount && (
                    <div style={{ padding: '0.6rem', display: 'flex', gap: '0.4rem' }}>
                      <button
                        id="btn-load-more-catalog"
                        type="button"
                        className="btn-scholarly"
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => setVisibleCount((prev) => prev + 150)}
                      >
                        <ChevronDown size={13} />
                        <span>載入更多（剩 {dbFilteredEntries.length - effectiveVisibleCount}）</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="sidebar-footer-bar">
              <button
                id="sidebar-prev-entry-btn"
                type="button"
                className="sidebar-step-btn"
                disabled={selectedIdxInFiltered <= 0}
                onClick={() => {
                  if (selectedIdxInFiltered > 0) {
                    onSelectEntry(dbFilteredEntries[selectedIdxInFiltered - 1].id);
                  }
                }}
              >
                <ChevronLeft size={13} />
                <span>上一部</span>
              </button>

              <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                {selectedIdxInFiltered >= 0
                  ? `${selectedIdxInFiltered + 1} / ${dbFilteredEntries.length}`
                  : `${dbFilteredEntries.length} 部`}
              </span>

              <button
                id="sidebar-next-entry-btn"
                type="button"
                className="sidebar-step-btn"
                disabled={
                  selectedIdxInFiltered < 0 ||
                  selectedIdxInFiltered >= dbFilteredEntries.length - 1
                }
                onClick={() => {
                  if (
                    selectedIdxInFiltered >= 0 &&
                    selectedIdxInFiltered < dbFilteredEntries.length - 1
                  ) {
                    onSelectEntry(dbFilteredEntries[selectedIdxInFiltered + 1].id);
                  }
                }}
              >
                <span>下一部</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </>
        ) : (
          <div className="dharani-catalog-list" style={{ padding: '0.75rem' }}>
            {resolvedCurrentEntry && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                  {resolvedCurrentEntry.titleZh}
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-scholarly"
                    onClick={() => onJumpToSection?.('hero')}
                  >
                    <Crosshair size={13} />
                    <span>跳至頂部</span>
                  </button>
                  <button
                    type="button"
                    className="btn-scholarly"
                    onClick={() => onJumpToSection?.('original')}
                  >
                    <BookOpen size={13} />
                    <span>切換原典經文</span>
                  </button>
                  {currentVerseCount > 0 && playbackState?.isPlaying && onStopPlayback && (
                    <button type="button" className="btn-scholarly primary" onClick={onStopPlayback}>
                      <Square size={13} />
                      <span>停止</span>
                    </button>
                  )}
                  {currentVerseCount > 0 &&
                    !playbackState?.isPlaying &&
                    classifyDharaniEntryKind(resolvedCurrentEntry) === 'dharani-sanskrit' &&
                    onPlayAllVerses && (
                      <button type="button" className="btn-scholarly primary" onClick={onPlayAllVerses}>
                        <Play size={13} />
                        <span>跟誦</span>
                      </button>
                    )}
                </div>

                {currentVerseCount > 1 && (
                  <>
                    <div className="sidebar-search-input-wrap" style={{ marginTop: '0.25rem' }}>
                      <Search size={13} className="sidebar-search-icon" />
                      <input
                        type="search"
                        className="sidebar-search-input"
                        placeholder="篩選句號或咒文..."
                        value={verseFilterQuery}
                        onChange={(e) => setVerseFilterQuery(e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {resolvedCurrentEntry.verses
                        .filter((v) => {
                          const q = verseFilterQuery.trim().toLowerCase();
                          if (!q) return true;
                          return `${v.index} ${v.classicalTranslitZh} ${v.iast}`
                            .toLowerCase()
                            .includes(q);
                        })
                        .slice(0, 120)
                        .map((v, arrIdx) => (
                          <button
                            key={v.id}
                            type="button"
                            className="catalog-entry-select-btn"
                            style={{
                              padding: '0.42rem 0.55rem',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '6px',
                            }}
                            onClick={() => {
                              onJumpToVerse?.(arrIdx);
                              onCloseMobile?.();
                            }}
                          >
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-vermilion)' }}>
                              第 {String(v.index).padStart(2, '0')} 句
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {v.classicalTranslitZh || v.iast}
                            </div>
                          </button>
                        ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
};
