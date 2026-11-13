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
  SlidersHorizontal,
  Square,
  Volume2,
  X,
} from 'lucide-react';
import type { DharaniCategoryId, DharaniEntry } from '../../types/kosaTypes';
import type { SearchScope } from '../../core/search/searchEngine';
import type { CanonCatalogItem } from '../../core/canon/canonLibraryTypes';
import type { PlaybackState } from '../../services/audio/sanskritAudioEngine';
import { DHARANI_CATEGORIES } from '../../data/categories';

export type SourceFilterType = 'all' | 'global-12db' | 'cbeta-siddham' | 'gretil-sanskrit';
export type SidebarViewMode = 'catalog' | 'outline';

const SHORT_CATEGORY_LABELS: Record<DharaniCategoryId | 'all', string> = {
  all: '全部经典',
  'supreme-mantras': '四大长咒',
  'ten-small-mantras': '十小咒',
  'buddhas-bodhisattvas': '诸佛菩萨',
  'vidyarajas-protectors': '明王护法',
  'prajna-sutra-hrdaya': '般若经典',
  'vedic-tantra-siddhanta': '吠陀诸宗',
  'global-12db-canon': '12大梵库',
  'gretil-canonical': 'GRETIL库',
  custom: '自建经咒',
};

const TWELVE_DB_OPTIONS: Array<{ id: string; label: string; shortLabel: string }> = [
  { id: 'all', label: '全部 12 大国际梵典库 (DB1–DB12)', shortLabel: '全部12库' },
  { id: 'db1_fangshan', label: 'DB1 · 房山石经《释教最上乘陀罗尼集》', shortLabel: 'DB1 房山石经' },
  { id: 'db2_taisho_ext', label: 'DB2 · 大正藏悉昙字书与续藏真言', shortLabel: 'DB2 大正悉昙' },
  { id: 'db3_dsbc_gretil', label: 'DB3 · 尼泊尔 DSBC 梵文陀罗尼集', shortLabel: 'DB3 尼泊尔DSBC' },
  { id: 'db4_84000', label: 'DB4 · 84000 甘珠尔秘密部梵藏真言', shortLabel: 'DB4 84000藏密' },
  { id: 'db5_buddhanexus', label: 'DB5 · BuddhaNexus 四语平行文献库', shortLabel: 'DB5 BuddhaNexus' },
  { id: 'db6_sarit', label: 'DB6 · SARIT 梵文密续原典库', shortLabel: 'DB6 SARIT密续' },
  { id: 'db7_cudl_hidas', label: 'DB7 · 剑桥 CUDL 梵文贝叶经写本', shortLabel: 'DB7 剑桥CUDL' },
  { id: 'db8_polyglotta', label: 'DB8 · 奥斯陆 16 本多语平行对勘', shortLabel: 'DB8 奥斯陆对勘' },
  { id: 'db9_rkts', label: 'DB9 · 维也纳 rKTs 德格版陀罗尼集', shortLabel: 'DB9 维也纳rKTs' },
  { id: 'db10_all_nibs', label: 'DB10 · ALL-NIBS 尼瓦尔梵本写本库', shortLabel: 'DB10 ALL-NIBS' },
  { id: 'db11_idp_dunhuang', label: 'DB11 · IDP/CEToM 敦煌西域丝路梵本', shortLabel: 'DB11 西域丝路' },
  { id: 'db12_muktabodha_ochs', label: 'DB12 · 牛津 OCHS 种子字辞典与密续', shortLabel: 'DB12 牛津OCHS' },
];

export interface SidebarFilterProps {
  entries: DharaniEntry[];
  preCategoryEntries?: DharaniEntry[];
  totalCorpusCount: number;
  selectedId: string;
  activeEntry?: DharaniEntry;
  onSelectEntry: (id: string) => void;
  /** Matching CBETA Canon scriptures (both with & without dhāraṇīs) when searching */
  canonScriptureHits?: CanonCatalogItem[];
  onSelectCanonScripture?: (item: CanonCatalogItem) => void;
  onOpenFullCanonLibrary?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  searchScope?: SearchScope;
  onSearchScopeChange?: (scope: SearchScope) => void;
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
  if (entry.provenance.databaseBadgeZh) {
    return entry.provenance.databaseBadgeZh.replace(/\s*·\s*/g, ' ').slice(0, 12);
  }
  const primaryNo = (entry.taishoNo || '').split('/')[0]?.trim();
  return primaryNo || entry.provenance.sourceType;
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
  onOpenFullCanonLibrary,
  searchQuery = '',
  onSearchChange,
  searchScope = 'all',
  onSearchScopeChange,
  selectedCategory,
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
  onPlaySingleVerse,
  onJumpToSection,
  onJumpToVerse,
  sidebarMode: controlledMode,
  onSidebarModeChange,
  sidebarCollapsed = false,
  onToggleSidebarCollapsed,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const [visibleCount, setVisibleCount] = useState<number>(90);
  const [outlineVisibleCount, setOutlineVisibleCount] = useState<number>(120);
  const [verseFilterQuery, setVerseFilterQuery] = useState<string>('');
  const [internalDbSubFilter, setInternalDbSubFilter] = useState<string>('all');
  const [internalMode, setInternalMode] = useState<SidebarViewMode>('catalog');
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState<boolean>(false);

  const catalogListRef = useRef<HTMLDivElement>(null);
  const outlineListRef = useRef<HTMLDivElement>(null);

  const sidebarMode = controlledMode ?? internalMode;
  const setSidebarMode = useCallback(
    (next: SidebarViewMode) => {
      if (onSidebarModeChange) {
        onSidebarModeChange(next);
      } else {
        setInternalMode(next);
      }
    },
    [onSidebarModeChange]
  );

  const selectedDbSubFilter = controlledDbSubFilter ?? internalDbSubFilter;
  const setSelectedDbSubFilter = (dbId: string) => {
    if (onSelectDbSubFilter) {
      onSelectDbSubFilter(dbId);
    } else {
      setInternalDbSubFilter(dbId);
    }
  };

  useEffect(() => {
    setVerseFilterQuery('');
    setOutlineVisibleCount(120);
  }, [selectedId]);

  const dbFilteredEntries = useMemo(() => {
    if (selectedDbSubFilter === 'all') return entries;
    return entries.filter((e) => e.provenance.databaseId === selectedDbSubFilter);
  }, [entries, selectedDbSubFilter]);

  const categoryCounts = useMemo(() => {
    const pool = preCategoryEntries ?? dbFilteredEntries;
    const counts: Record<string, number> = { all: pool.length };
    for (const cat of DHARANI_CATEGORIES) {
      counts[cat.id] = 0;
    }
    for (const item of pool) {
      counts[item.categoryId] = (counts[item.categoryId] || 0) + 1;
    }
    return counts;
  }, [preCategoryEntries, dbFilteredEntries]);

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

  const scrollActiveCatalogItemIntoView = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const container = catalogListRef.current;
      if (!container || !selectedId) return;
      const row = Array.from(
        container.querySelectorAll<HTMLElement>('[data-entry-id]')
      ).find((el) => el.getAttribute('data-entry-id') === selectedId);
      if (!row) return;
      const containerRect = container.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      const isFullyVisible =
        rowRect.top >= containerRect.top + 4 && rowRect.bottom <= containerRect.bottom - 4;
      if (!isFullyVisible) {
        const rowTopInContainer = rowRect.top - containerRect.top + container.scrollTop;
        const offsetTop =
          rowTopInContainer - container.clientHeight / 2 + rowRect.height / 2;
        container.scrollTo({ top: Math.max(0, offsetTop), behavior });
      }
    },
    [selectedId]
  );

  useEffect(() => {
    if (sidebarMode !== 'catalog' || sidebarCollapsed) return;
    const timer = window.setTimeout(() => {
      scrollActiveCatalogItemIntoView('smooth');
    }, 45);
    return () => window.clearTimeout(timer);
  }, [selectedId, sidebarMode, sidebarCollapsed, mobileOpen, scrollActiveCatalogItemIntoView]);

  useEffect(() => {
    if (
      sidebarMode !== 'outline' ||
      sidebarCollapsed ||
      !playbackState?.isPlaying ||
      playbackState.currentVerseIndex === null
    ) {
      return;
    }
    if (playbackState.currentVerseIndex > outlineVisibleCount - 4) {
      setOutlineVisibleCount((prev) => prev + 60);
    }
    const container = outlineListRef.current;
    if (!container) return;
    const row = container.querySelector<HTMLElement>(
      `[data-verse-num="${playbackState.currentVerseIndex}"]`
    );
    if (!row) return;
    const cRect = container.getBoundingClientRect();
    const rRect = row.getBoundingClientRect();
    if (rRect.top < cRect.top + 16 || rRect.bottom > cRect.bottom - 16) {
      const rowTopInContainer = rRect.top - cRect.top + container.scrollTop;
      const targetTop = rowTopInContainer - container.clientHeight / 2 + rRect.height / 2;
      container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    }
  }, [
    sidebarMode,
    sidebarCollapsed,
    playbackState?.isPlaying,
    playbackState?.currentVerseIndex,
    outlineVisibleCount,
  ]);

  const hasSourceOrDbFilter = sourceFilter !== 'all' || selectedDbSubFilter !== 'all';
  const isSourcePanelExpanded = sourceDrawerOpen || hasSourceOrDbFilter;

  const hasAnyActiveFilter =
    Boolean(searchQuery.trim()) ||
    searchScope !== 'all' ||
    selectedCategory !== 'all' ||
    onlyBookmarked ||
    hasSourceOrDbFilter;

  const handleResetAllFilters = () => {
    onSearchChange?.('');
    onSearchScopeChange?.('all');
    onSelectCategory('all');
    onSourceFilterChange('all');
    setSelectedDbSubFilter('all');
    if (onlyBookmarked) {
      onToggleOnlyBookmarked();
    }
    setSourceDrawerOpen(false);
  };

  const resolvedCurrentEntry = useMemo(
    () => activeEntry || dbFilteredEntries.find((e) => e.id === selectedId) || dbFilteredEntries[0],
    [activeEntry, dbFilteredEntries, selectedId]
  );

  const filteredOutlineVerses = useMemo(() => {
    if (!resolvedCurrentEntry) return [];
    const q = verseFilterQuery.trim().toLowerCase();
    const allIndexed = resolvedCurrentEntry.verses.map((verse, arrayIdx) => ({
      verse,
      arrayIdx,
    }));
    if (!q) return allIndexed;
    const numericMatch = q.replace(/^[第#v\s]+|[句\s]+$/g, '');
    return allIndexed.filter(({ verse }) => {
      if (numericMatch && /^\d+$/.test(numericMatch) && verse.index === Number(numericMatch)) {
        return true;
      }
      const hay = `${verse.index} ${verse.classicalTranslitZh || ''} ${verse.modernPhoneticZh || ''} ${verse.iast} ${verse.meaningZh || ''} ${verse.tangNoteZh || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [resolvedCurrentEntry, verseFilterQuery]);

  const activeDbShortLabel = useMemo(() => {
    const found = TWELVE_DB_OPTIONS.find((d) => d.id === selectedDbSubFilter);
    return found && found.id !== 'all' ? found.shortLabel : null;
  }, [selectedDbSubFilter]);

  const activeFilterSummaryLabel = useMemo(() => {
    const parts: string[] = [];
    if (searchScope === 'dharani') parts.push('搜陀罗尼');
    else if (searchScope === 'sutra') parts.push('搜经文');
    if (searchQuery.trim()) parts.push(`「${searchQuery.trim()}」`);
    if (selectedCategory !== 'all') parts.push(SHORT_CATEGORY_LABELS[selectedCategory]);
    if (onlyBookmarked) parts.push('仅看收藏');
    if (activeDbShortLabel) {
      parts.push(activeDbShortLabel);
    } else if (sourceFilter === 'global-12db') {
      parts.push('12大国际库');
    } else if (sourceFilter === 'cbeta-siddham') {
      parts.push('CBETA对音');
    } else if (sourceFilter === 'gretil-sanskrit') {
      parts.push('GRETIL梵本');
    }
    return parts.join(' · ');
  }, [searchScope, searchQuery, selectedCategory, onlyBookmarked, activeDbShortLabel, sourceFilter]);

  const currentVerseCount = resolvedCurrentEntry?.verses.length ?? 0;
  const hasInterlinear = Boolean(
    resolvedCurrentEntry?.provenance.cbetaInterlinearTokens &&
      resolvedCurrentEntry.provenance.cbetaInterlinearTokens.length > 0
  );

  return (
    <>
      <div
        className={`mobile-drawer-backdrop ${mobileOpen ? 'is-open' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      {sidebarCollapsed && (
        <aside
          className="sidebar-collapsed-rail"
          aria-label="已收起的经典与陀罗尼快捷导航栏"
        >
          <button
            id="btn-expand-sidebar-rail"
            type="button"
            className="sidebar-rail-btn is-primary"
            onClick={onToggleSidebarCollapsed}
            title="展开左侧经典与陀罗尼目录栏"
          >
            <PanelLeftOpen size={16} />
          </button>

          <div className="sidebar-rail-divider" />

          <button
            type="button"
            className={`sidebar-rail-btn ${sidebarMode === 'catalog' ? 'is-active' : ''}`}
            onClick={() => {
              setSidebarMode('catalog');
              onToggleSidebarCollapsed?.();
            }}
            title={`展开经典选单（当前 ${dbFilteredEntries.length} 部）`}
          >
            <BookOpen size={16} />
          </button>

          <button
            type="button"
            className={`sidebar-rail-btn ${sidebarMode === 'outline' ? 'is-active' : ''}`}
            onClick={() => {
              setSidebarMode('outline');
              onToggleSidebarCollapsed?.();
            }}
            title="展开本篇导览"
          >
            <ListOrdered size={16} />
            {currentVerseCount > 1 && (
              <span className="sidebar-rail-badge">
                {currentVerseCount > 99 ? '99+' : currentVerseCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`sidebar-rail-btn ${onlyBookmarked ? 'is-active' : ''}`}
            onClick={() => {
              if (!onlyBookmarked) onToggleOnlyBookmarked();
              setSidebarMode('catalog');
              onToggleSidebarCollapsed?.();
            }}
            title={`查看已收藏经典（${bookmarkedIds.size} 部）`}
          >
            <Bookmark size={15} />
            {bookmarkedIds.size > 0 && (
              <span className="sidebar-rail-badge">{bookmarkedIds.size}</span>
            )}
          </button>

          <div className="sidebar-rail-divider" />

          <button
            type="button"
            className="sidebar-rail-btn"
            disabled={selectedIdxInFiltered <= 0}
            onClick={() => {
              if (selectedIdxInFiltered > 0) {
                onSelectEntry(dbFilteredEntries[selectedIdxInFiltered - 1].id);
              }
            }}
            title="切换至上一部"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            className="sidebar-rail-btn"
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
            title="切换至下一部"
          >
            <ChevronRight size={16} />
          </button>
        </aside>
      )}

      <aside
        className={`sidebar-panel ${mobileOpen ? 'is-mobile-open' : ''}`}
        style={sidebarCollapsed && !mobileOpen ? { display: 'none' } : undefined}
        aria-label="经典选单与本篇导览"
      >
        <div className="sidebar-mode-header">
          <div className="sidebar-mode-tabs" role="tablist" aria-label="左侧栏功能切换">
            <button
              id="sidebar-tab-catalog"
              type="button"
              role="tab"
              aria-selected={sidebarMode === 'catalog'}
              className={`sidebar-mode-tab ${sidebarMode === 'catalog' ? 'active' : ''}`}
              onClick={() => setSidebarMode('catalog')}
            >
              <BookOpen size={13} />
              <span>经典选单</span>
              <span className="sidebar-mode-badge">
                {dbFilteredEntries.length + canonScriptureHits.length}
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
              {playbackState?.isPlaying ? (
                <span className="sidebar-live-dot" title="正在同步讽诵中" />
              ) : (
                <ListOrdered size={13} />
              )}
              <span>本篇导览</span>
              <span className="sidebar-mode-badge">
                {currentVerseCount > 0 ? `${currentVerseCount}句` : '原文'}
              </span>
            </button>
          </div>

          {onToggleSidebarCollapsed && (
            <button
              id="btn-collapse-sidebar"
              type="button"
              className="sidebar-icon-collapse-btn sidebar-desktop-collapse-only"
              onClick={onToggleSidebarCollapsed}
              title="收起左侧栏，切换为宽屏沉浸阅藏模式"
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
              title="关闭目录抽屉"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {sidebarMode === 'catalog' ? (
          <>
            <div className="sidebar-top-controls">
              <div className="sidebar-search-row">
                <div className="sidebar-search-input-wrap">
                  <Search size={13} className="sidebar-search-icon" />
                  <input
                    id="sidebar-catalog-search-input"
                    type="search"
                    autoComplete="off"
                    className="sidebar-search-input"
                    placeholder={searchScope === 'dharani' ? '搜陀罗尼名称/本尊/经号...' : searchScope === 'sutra' ? '搜佛经经名/经号/译者...' : '搜陀罗尼或佛经经名/经号...'}
                    value={searchQuery}
                    onChange={(e) => {
                      setVisibleCount(90);
                      onSearchChange?.(e.target.value);
                    }}
                  />
                  {searchQuery && (
                    <button
                      id="sidebar-clear-search-btn"
                      type="button"
                      className="sidebar-search-clear"
                      onClick={() => onSearchChange?.('')}
                      title="清除搜索词"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <button
                  id="filter-bookmarks-toggle"
                  type="button"
                  className={`sidebar-quick-toggle ${onlyBookmarked ? 'is-gold-active' : ''}`}
                  onClick={onToggleOnlyBookmarked}
                  title="仅显示我收藏的经典"
                >
                  <Bookmark size={12} fill={onlyBookmarked ? 'currentColor' : 'none'} />
                  <span>{bookmarkedIds.size > 0 ? bookmarkedIds.size : '收藏'}</span>
                </button>

                <button
                  id="sidebar-source-drawer-toggle"
                  type="button"
                  className={`sidebar-quick-toggle ${hasSourceOrDbFilter ? 'is-lapis-active' : ''}`}
                  onClick={() => setSourceDrawerOpen((v) => !v)}
                  title="按权威文献库或 12 大国际梵典库 (DB1–DB12) 细分筛选"
                >
                  <SlidersHorizontal size={12} />
                  <span>文献源</span>
                  <ChevronDown
                    size={11}
                    style={{
                      transform: isSourcePanelExpanded ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.16s ease',
                    }}
                  />
                </button>
              </div>

              {onSearchScopeChange && (
                <div className="sidebar-scope-switch" role="tablist" aria-label="侧栏检索范围切换">
                  {(
                    [
                      { id: 'all', label: '全部' },
                      { id: 'dharani', label: '搜陀罗尼' },
                      { id: 'sutra', label: '搜经文' },
                    ] as Array<{ id: SearchScope; label: string }>
                  ).map((sc) => (
                    <button
                      key={sc.id}
                      id={`sidebar-scope-${sc.id}`}
                      type="button"
                      role="tab"
                      aria-selected={searchScope === sc.id}
                      className={`sidebar-scope-btn ${searchScope === sc.id ? 'active' : ''}`}
                      onClick={() => {
                        setVisibleCount(90);
                        onSearchScopeChange(sc.id);
                      }}
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              )}

              {searchScope !== 'sutra' && (
              <div className="sidebar-cat-grid" role="group" aria-label="经咒法门分类">
                <button
                  id="cat-pill-all"
                  type="button"
                  className={`sidebar-cat-pill ${selectedCategory === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setVisibleCount(90);
                    onSelectCategory('all');
                  }}
                >
                  <span className="sidebar-cat-label">{SHORT_CATEGORY_LABELS.all}</span>
                  <span className="sidebar-cat-count">
                    {hasAnyActiveFilter ? categoryCounts.all : totalCorpusCount}
                  </span>
                </button>

                {DHARANI_CATEGORIES.map((cat) => {
                  const count = categoryCounts[cat.id] ?? 0;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      id={`cat-pill-${cat.id}`}
                      type="button"
                      className={`sidebar-cat-pill ${isSelected ? 'active' : ''} ${
                        count === 0 ? 'is-zero' : ''
                      }`}
                      onClick={() => {
                        setVisibleCount(90);
                        if (cat.id !== 'global-12db-canon' && selectedDbSubFilter !== 'all') {
                          setSelectedDbSubFilter('all');
                        }
                        onSelectCategory(isSelected ? 'all' : cat.id);
                      }}
                      title={`${cat.nameZh}：${cat.descriptionZh}`}
                    >
                      <span className="sidebar-cat-label">{SHORT_CATEGORY_LABELS[cat.id]}</span>
                      <span className="sidebar-cat-count">{count}</span>
                    </button>
                  );
                })}
                {((categoryCounts.custom ?? 0) > 0 || selectedCategory === 'custom') && (
                  <button
                    id="cat-pill-custom"
                    type="button"
                    className={`sidebar-cat-pill ${
                      selectedCategory === 'custom' ? 'active' : ''
                    }`}
                    onClick={() => {
                      setVisibleCount(90);
                      onSelectCategory(selectedCategory === 'custom' ? 'all' : 'custom');
                    }}
                  >
                    <span className="sidebar-cat-label">{SHORT_CATEGORY_LABELS.custom}</span>
                    <span className="sidebar-cat-count">{categoryCounts.custom ?? 0}</span>
                  </button>
                )}
              </div>

              )}

              <div
                className={`sidebar-source-drawer ${
                  isSourcePanelExpanded ? '' : 'is-collapsed'
                }`}
                aria-label="文献来源与12大国际梵典库筛选"
              >
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
                    12大国际库
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

                <div className="sidebar-db-select-row">
                  <label htmlFor="sidebar-12db-select" className="sidebar-db-select-label">
                    国际分库：
                  </label>
                  <select
                    id="sidebar-12db-select"
                    className="sidebar-db-select"
                    value={selectedDbSubFilter}
                    onChange={(e) => {
                      const nextDb = e.target.value;
                      setVisibleCount(90);
                      if (nextDb !== 'all' && sourceFilter !== 'global-12db') {
                        onSourceFilterChange('global-12db');
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
              </div>

              {hasAnyActiveFilter && (
                <div className="sidebar-active-filter-bar">
                  <span className="sidebar-active-filter-text" title={activeFilterSummaryLabel}>
                    筛选：{activeFilterSummaryLabel} · 共{' '}
                    <strong>{dbFilteredEntries.length + canonScriptureHits.length}</strong> 部
                  </span>
                  <button
                    id="sidebar-reset-filters-btn"
                    type="button"
                    className="sidebar-filter-reset-btn"
                    onClick={handleResetAllFilters}
                  >
                    重置全部
                  </button>
                </div>
              )}
            </div>

            <div ref={catalogListRef} className="dharani-catalog-list">
              {/* Full-Canon Scripture Matches (including pure non-Dharani scriptures!) */}
              {canonScriptureHits.length > 0 && onSelectCanonScripture && (
                <>
                  <div className="sidebar-canon-section-header">
                    <span>CBETA 全藏经典原文匹配（{canonScriptureHits.length} 部）</span>
                    {onOpenFullCanonLibrary && (
                      <button
                        type="button"
                        onClick={onOpenFullCanonLibrary}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--accent-lapis)',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        全藏库 →
                      </button>
                    )}
                  </div>
                  {canonScriptureHits.slice(0, 30).map((c) => {
                    const synthId = `canon-scripture-${c.id}`;
                    const isSelected = selectedId === synthId;
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
                            {isSelected && (
                              <span className="catalog-reading-pill">
                                <span>当前</span>
                              </span>
                            )}
                            <span className="catalog-row-title-zh">《{c.title}》</span>
                          </div>
                          <div className="catalog-row-meta-line">
                            {c.dharani > 0 ? (
                              <span className="catalog-verse-count-pill">
                                原文+咒{c.dharani}段
                              </span>
                            ) : (
                              <span className="badge-pure-sutra">纯经文原文</span>
                            )}
                            <span className="catalog-taisho-tag">{c.id}</span>
                            {c.byline && (
                              <span className="catalog-deity-snippet">{c.byline}</span>
                            )}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </>
              )}

              {dbFilteredEntries.length === 0 && canonScriptureHits.length === 0 ? (
                <div
                  style={{
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.65rem',
                  }}
                >
                  <div>当前筛选条件下暂无匹配的经典或陀罗尼。</div>
                  {hasAnyActiveFilter && (
                    <button
                      type="button"
                      className="btn-scholarly primary"
                      style={{ fontSize: '0.76rem', padding: '0.35rem 0.78rem' }}
                      onClick={handleResetAllFilters}
                    >
                      <RotateCcw size={13} />
                      <span>清除筛选，查看全部 {totalCorpusCount} 部</span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {canonScriptureHits.length > 0 && dbFilteredEntries.length > 0 && (
                    <div className="sidebar-canon-section-header">
                      <span>多体精校与 12 大数据库条目（{dbFilteredEntries.length} 部）</span>
                    </div>
                  )}
                  {displayedEntries.map((entry) => {
                    const isSelected = entry.id === selectedId;
                    const isBookmarked = bookmarkedIds.has(entry.id);
                    const hasSiddhamTokens =
                      entry.provenance.cbetaInterlinearTokens &&
                      entry.provenance.cbetaInterlinearTokens.length > 0;
                    const isChantingThis = Boolean(isSelected && playbackState?.isPlaying);
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
                          title={`${entry.titleZh}\n${entry.titleSanskritIast}\n出处：${entry.taishoNo}`}
                        >
                          <div className="catalog-row-title-line">
                            {isSelected && (
                              <span className="catalog-reading-pill">
                                {isChantingThis ? (
                                  <>
                                    <Volume2 size={10} />
                                    <span>讽诵中</span>
                                  </>
                                ) : (
                                  <span>当前</span>
                                )}
                              </span>
                            )}
                            <span className="catalog-row-title-zh">{entry.titleZh}</span>
                          </div>

                          <div className="catalog-row-meta-line">
                            {entry.verses.length > 0 ? (
                              <span className="catalog-verse-count-pill">
                                原文+{entry.verses.length}句
                              </span>
                            ) : (
                              <span className="badge-pure-sutra">纯经文原文</span>
                            )}
                            {entry.deityZh && (
                              <span className="catalog-deity-snippet">{entry.deityZh}</span>
                            )}
                            <span className="catalog-taisho-tag">{compactTag}</span>
                            {hasSiddhamTokens && (
                              <span className="badge-siddham-tt">悉昙对音</span>
                            )}
                          </div>
                        </button>

                        <div className="catalog-entry-actions">
                          {onToggleBookmark && (
                            <button
                              type="button"
                              className={`catalog-fav-btn ${isBookmarked ? 'is-bookmarked' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleBookmark(entry.id);
                              }}
                              title={isBookmarked ? '取消收藏' : '收藏'}
                              aria-label={isBookmarked ? '取消收藏' : '收藏'}
                            >
                              <Bookmark
                                size={13}
                                fill={isBookmarked ? 'currentColor' : 'none'}
                              />
                            </button>
                          )}

                          {isSelected && entry.verses.length > 1 && (
                            <button
                              type="button"
                              className="catalog-outline-shortcut-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSidebarMode('outline');
                              }}
                              title="打开本篇逐句导览"
                            >
                              <span>句目</span>
                              <ChevronRight size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {dbFilteredEntries.length > effectiveVisibleCount && (
                    <div
                      style={{
                        padding: '0.68rem',
                        display: 'flex',
                        gap: '0.42rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <button
                        id="btn-load-more-catalog"
                        type="button"
                        className="btn-secondary-gold"
                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.74rem' }}
                        onClick={() => setVisibleCount((prev) => prev + 150)}
                      >
                        <ChevronDown size={13} />
                        <span>
                          继续加载 (+150 · 剩 {dbFilteredEntries.length - effectiveVisibleCount})
                        </span>
                      </button>
                      <button
                        id="btn-load-all-catalog"
                        type="button"
                        className="btn-secondary-gold"
                        style={{ fontSize: '0.74rem' }}
                        onClick={() => setVisibleCount(dbFilteredEntries.length)}
                      >
                        全部 ({dbFilteredEntries.length})
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

              <button
                id="sidebar-locate-active-btn"
                type="button"
                className="sidebar-locate-btn"
                onClick={() => {
                  if (selectedIdxInFiltered >= 0) {
                    scrollActiveCatalogItemIntoView('smooth');
                  } else if (hasAnyActiveFilter) {
                    handleResetAllFilters();
                  }
                }}
              >
                <Crosshair size={12} />
                <span>
                  {selectedIdxInFiltered >= 0
                    ? `第 ${selectedIdxInFiltered + 1} / ${dbFilteredEntries.length} 部`
                    : '定位当前经典'}
                </span>
              </button>

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
          <>
            {resolvedCurrentEntry ? (
              <>
                <div className="sidebar-outline-header-card">
                  <div className="outline-scripture-kicker">
                    <span>
                      {currentVerseCount > 0
                        ? `当前研读 · 原文 + ${currentVerseCount} 句陀罗尼`
                        : '当前研读 · 纯经文原典'}
                    </span>
                    <span className="catalog-taisho-tag">
                      {formatCompactCatalogTag(resolvedCurrentEntry)}
                    </span>
                  </div>

                  <div
                    className="outline-scripture-title"
                    title={resolvedCurrentEntry.titleZh}
                  >
                    {resolvedCurrentEntry.titleZh}
                  </div>

                  <div className="outline-quick-actions">
                    {currentVerseCount > 0 &&
                      (playbackState?.isPlaying ? (
                        <button
                          id="outline-stop-chant-btn"
                          type="button"
                          className="outline-play-all-btn"
                          onClick={onStopPlayback}
                        >
                          <Square size={12} />
                          <span>
                            停止跟诵
                            {playbackState.currentVerseIndex !== null
                              ? ` (第 ${playbackState.currentVerseIndex} 句)`
                              : ''}
                          </span>
                        </button>
                      ) : (
                        <button
                          id="outline-play-all-btn"
                          type="button"
                          className="outline-play-all-btn"
                          onClick={onPlayAllVerses}
                        >
                          <Play size={12} />
                          <span>全咒同步连诵 ({currentVerseCount}句)</span>
                        </button>
                      ))}

                    {onToggleBookmark && (
                      <button
                        type="button"
                        className={`sidebar-quick-toggle ${
                          bookmarkedIds.has(resolvedCurrentEntry.id) ? 'is-gold-active' : ''
                        }`}
                        onClick={() => onToggleBookmark(resolvedCurrentEntry.id)}
                      >
                        <Bookmark
                          size={12}
                          fill={
                            bookmarkedIds.has(resolvedCurrentEntry.id)
                              ? 'currentColor'
                              : 'none'
                          }
                        />
                        <span>
                          {bookmarkedIds.has(resolvedCurrentEntry.id) ? '已藏' : '收藏'}
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="outline-anchors-strip" role="group" aria-label="右侧正文区块快速跳转">
                    <button
                      type="button"
                      className="outline-anchor-chip"
                      onClick={() => {
                        onJumpToSection?.('hero');
                        onCloseMobile?.();
                      }}
                    >
                      经题提要
                    </button>
                    <button
                      type="button"
                      className="outline-anchor-chip"
                      onClick={() => {
                        onJumpToSection?.('original');
                        onCloseMobile?.();
                      }}
                    >
                      原文全文
                    </button>
                    {currentVerseCount > 0 && (
                      <button
                        type="button"
                        className="outline-anchor-chip"
                        onClick={() => {
                          onJumpToSection?.('summary');
                          onCloseMobile?.();
                        }}
                      >
                        全咒汇总
                      </button>
                    )}
                    {hasInterlinear && (
                      <button
                        type="button"
                        className="outline-anchor-chip"
                        onClick={() => {
                          onJumpToSection?.('interlinear');
                          onCloseMobile?.();
                        }}
                      >
                        悉昙对音
                      </button>
                    )}
                    {currentVerseCount > 0 && (
                      <button
                        type="button"
                        className="outline-anchor-chip"
                        onClick={() => {
                          onJumpToSection?.('concordance');
                          onCloseMobile?.();
                        }}
                      >
                        同源见证
                      </button>
                    )}
                  </div>

                  {currentVerseCount >= 4 && (
                    <div className="sidebar-search-input-wrap">
                      <Search size={13} className="sidebar-search-icon" />
                      <input
                        id="sidebar-verse-filter-input"
                        type="search"
                        autoComplete="off"
                        className="sidebar-search-input"
                        placeholder="搜本篇句号(如 8)、汉字音译或梵文..."
                        value={verseFilterQuery}
                        onChange={(e) => {
                          setOutlineVisibleCount(120);
                          setVerseFilterQuery(e.target.value);
                        }}
                      />
                      {verseFilterQuery && (
                        <button
                          type="button"
                          className="sidebar-search-clear"
                          onClick={() => setVerseFilterQuery('')}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div ref={outlineListRef} className="outline-verse-list">
                  {currentVerseCount === 0 ? (
                    <div
                      style={{
                        padding: '1.5rem 1rem',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        lineHeight: 1.65,
                      }}
                    >
                      本篇为不含陀罗尼之纯经文原典，右侧已为您完整展开整卷经文原文，可使用原文区的「品目导览」或「文内搜索」快速定位段落。
                    </div>
                  ) : filteredOutlineVerses.length === 0 ? (
                    <div
                      style={{
                        padding: '1.75rem 1rem',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                      }}
                    >
                      本篇中未找到匹配「{verseFilterQuery}」的咒句。
                    </div>
                  ) : (
                    <>
                      {filteredOutlineVerses
                        .slice(0, outlineVisibleCount)
                        .map(({ verse, arrayIdx }) => {
                          const isPlayingThis = Boolean(
                            playbackState?.isPlaying &&
                              playbackState.currentVerseIndex === verse.index
                          );
                          const zhPreview =
                            verse.classicalTranslitZh ||
                            verse.modernPhoneticZh ||
                            verse.meaningZh ||
                            `第 ${verse.index} 句`;

                          return (
                            <div
                              key={verse.id}
                              data-verse-num={verse.index}
                              className={`outline-verse-row ${
                                isPlayingThis ? 'is-playing' : ''
                              }`}
                            >
                              <button
                                id={`outline-verse-jump-${verse.index}`}
                                type="button"
                                className="outline-verse-jump-btn"
                                onClick={() => {
                                  onJumpToVerse?.(arrayIdx);
                                  onCloseMobile?.();
                                }}
                              >
                                <span className="outline-verse-num">
                                  {isPlayingThis ? (
                                    <Volume2 size={12} />
                                  ) : (
                                    String(verse.index).padStart(2, '0')
                                  )}
                                </span>
                                <span className="outline-verse-snippets">
                                  <span className="outline-verse-zh">{zhPreview}</span>
                                  <span className="outline-verse-iast">{verse.iast}</span>
                                </span>
                              </button>

                              {onPlaySingleVerse && (
                                <button
                                  id={`outline-verse-play-${verse.index}`}
                                  type="button"
                                  className="outline-verse-play-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isPlayingThis) {
                                      onStopPlayback?.();
                                    } else {
                                      onJumpToVerse?.(arrayIdx);
                                      onPlaySingleVerse(arrayIdx);
                                    }
                                  }}
                                >
                                  {isPlayingThis ? (
                                    <Square size={11} />
                                  ) : (
                                    <Play size={11} style={{ marginLeft: '1px' }} />
                                  )}
                                </button>
                              )}
                            </div>
                          );
                        })}

                      {filteredOutlineVerses.length > outlineVisibleCount && (
                        <div style={{ padding: '0.68rem', display: 'flex', gap: '0.42rem' }}>
                          <button
                            type="button"
                            className="btn-secondary-gold"
                            style={{ flex: 1, justifyContent: 'center', fontSize: '0.74rem' }}
                            onClick={() => setOutlineVisibleCount((prev) => prev + 120)}
                          >
                            <ChevronDown size={13} />
                            <span>
                              展开更多咒句 (剩 {filteredOutlineVerses.length - outlineVisibleCount} 句)
                            </span>
                          </button>
                          <button
                            type="button"
                            className="btn-secondary-gold"
                            style={{ fontSize: '0.74rem' }}
                            onClick={() => setOutlineVisibleCount(filteredOutlineVerses.length)}
                          >
                            全部 ({filteredOutlineVerses.length})
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="sidebar-footer-bar">
                  <button
                    type="button"
                    className="sidebar-step-btn"
                    onClick={() => setSidebarMode('catalog')}
                  >
                    <ChevronLeft size={13} />
                    <span>换其他经典</span>
                  </button>
                  <span style={{ fontSize: '0.69rem', color: 'var(--text-muted)' }}>
                    {currentVerseCount > 0 ? '点选行跳句 · 点 ▶ 讽诵' : '全卷原文直读模式'}
                  </span>
                </div>
              </>
            ) : null}
          </>
        )}
      </aside>
    </>
  );
};
