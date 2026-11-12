import React, { useState, useEffect, useMemo, useRef, Suspense, lazy } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Bookmark, ListOrdered } from 'lucide-react';
import type {
  ActiveWorkspaceTab,
  DharaniCategoryId,
  DharaniEntry,
  ScriptVisibilityConfig,
} from './types/kosaTypes';
import { FIRST_SCREEN_CORPUS } from './data/firstScreenCorpus';
import {
  getCloudCorpusSnapshot,
  loadFullCloudCorpus,
  subscribeCloudCorpus,
} from './services/corpus/cloudCorpusService';
import {
  filterDharanis,
  type SearchSuggestionItem,
} from './core/search/searchEngine';
import {
  sanskritAudioEngine,
  type AudioEngineMode,
  type PlaybackState,
} from './services/audio/sanskritAudioEngine';
import {
  loadBookmarks,
  saveBookmarks,
  loadCustomDharanis,
  saveCustomDharanis,
  loadScriptConfig,
  saveScriptConfig,
  loadTheme,
  saveTheme,
} from './services/storage/storageService';
import { Header } from './components/layout/Header';
import { SidebarFilter, type SidebarViewMode } from './components/layout/SidebarFilter';
import { DharaniReader, type ReaderNavigationRequest } from './components/reader/DharaniReader';
import { AudioPlayerBar } from './components/audio/AudioPlayerBar';
import {
  APP_SCROLL_CONTAINER_ID,
  getActiveScrollContainer,
  scrollReaderToTop,
  scrollToReaderElement,
} from './core/dom/scrollUtils';

const TaishoCanonExplorer = lazy(() =>
  import('./components/catalog/TaishoCanonExplorer').then((m) => ({
    default: m.TaishoCanonExplorer,
  }))
);
const CanonLibrary = lazy(() => import('./components/catalog/CanonLibrary'));
const SanskritPhoneticsAcademy = lazy(() =>
  import('./components/guide/SanskritPhoneticsAcademy').then((m) => ({
    default: m.SanskritPhoneticsAcademy,
  }))
);
const CustomDharaniCompiler = lazy(() =>
  import('./components/extensibility/CustomDharaniCompiler').then((m) => ({
    default: m.CustomDharaniCompiler,
  }))
);

const FangshanTaishoInterlinearStudio = lazy(() =>
  import('./components/FangshanTaishoInterlinearStudio').then((m) => ({
    default: m.FangshanTaishoInterlinearStudio,
  }))
);
const DatabaseHubExplorer = lazy(() =>
  import('./components/DatabaseHubExplorer').then((m) => ({
    default: m.DatabaseHubExplorer,
  }))
);
const ConcordanceParallelStudio = lazy(() =>
  import('./components/ConcordanceParallelStudio').then((m) => ({
    default: m.ConcordanceParallelStudio,
  }))
);
const CudlPalmLeafViewer = lazy(() =>
  import('./components/CudlPalmLeafViewer').then((m) => ({
    default: m.CudlPalmLeafViewer,
  }))
);
const SiddhamBijaAcademy = lazy(() =>
  import('./components/SiddhamBijaAcademy').then((m) => ({
    default: m.SiddhamBijaAcademy,
  }))
);

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadTheme());
  const [activeTab, setActiveTab] = useState<ActiveWorkspaceTab>('canon-reader');
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<SidebarViewMode>('catalog');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [readerNavRequest, setReaderNavRequest] = useState<ReaderNavigationRequest | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DharaniCategoryId | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<
    'all' | 'global-12db' | 'cbeta-siddham' | 'gretil-sanskrit'
  >('all');
  const [selectedDbSubFilter, setSelectedDbSubFilter] = useState<string>('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);

  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => loadBookmarks());
  const [customEntries, setCustomEntries] = useState<DharaniEntry[]>(() => loadCustomDharanis());
  const [scriptConfig, setScriptConfig] = useState<ScriptVisibilityConfig>(() => loadScriptConfig());
  const [selectedTaishoScriptureId, setSelectedTaishoScriptureId] = useState<string | null>(null);
  const [cloudCorpusEntries, setCloudCorpusEntries] = useState<DharaniEntry[]>(
    () => getCloudCorpusSnapshot().entries
  );

  useEffect(() => {
    const unsub = subscribeCloudCorpus((entries) => {
      setCloudCorpusEntries(entries);
    });
    void loadFullCloudCorpus();
    return unsub;
  }, []);

  // Lock background body scroll when mobile catalog drawer is open & close on Escape
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (mobileCatalogOpen) {
      document.body.style.overflow = 'hidden';
      const onKey = (ev: KeyboardEvent) => {
        if (ev.key === 'Escape') setMobileCatalogOpen(false);
      };
      window.addEventListener('keydown', onKey);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', onKey);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileCatalogOpen]);

  // Authoritative canon strictly excludes local browser editor drafts
  const allEntries = useMemo(() => {
    const seen = new Set<string>();
    const combined: DharaniEntry[] = [];
    for (const item of cloudCorpusEntries) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        combined.push(item);
      }
    }
    return combined;
  }, [cloudCorpusEntries]);

  const preCategoryFilteredEntries = useMemo(() => {
    const base = filterDharanis(allEntries, {
      query: searchQuery,
      categoryId: 'all',
      onlyBookmarked,
      bookmarkedIds,
      sourceFilter,
    });
    if (selectedDbSubFilter !== 'all') {
      return base.filter((e) => e.provenance.databaseId === selectedDbSubFilter);
    }
    return base;
  }, [
    allEntries,
    searchQuery,
    onlyBookmarked,
    bookmarkedIds,
    sourceFilter,
    selectedDbSubFilter,
  ]);

  const filteredEntries = useMemo(() => {
    if (selectedCategory === 'all') return preCategoryFilteredEntries;
    return preCategoryFilteredEntries.filter((e) => e.categoryId === selectedCategory);
  }, [preCategoryFilteredEntries, selectedCategory]);

  const [selectedEntryId, setSelectedEntryId] = useState<string>(
    FIRST_SCREEN_CORPUS[0]?.id || ''
  );

  const [canonTextId, setCanonTextId] = useState<string | null>(null);
  const [canonQuery, setCanonQuery] = useState('');
  const [canonNonce, setCanonNonce] = useState(0);
  const [taishoActiveEntry, setTaishoActiveEntry] = useState<DharaniEntry | null>(null);
  const [compilerLiveEntry, setCompilerLiveEntry] = useState<DharaniEntry | null>(null);

  const activeEntry = useMemo(() => {
    const foundInFiltered = filteredEntries.find((e) => e.id === selectedEntryId);
    if (foundInFiltered) return foundInFiltered;
    if (filteredEntries.length > 0) return filteredEntries[0];
    const foundInAll = allEntries.find((e) => e.id === selectedEntryId);
    return foundInAll || allEntries[0];
  }, [allEntries, filteredEntries, selectedEntryId]);

  const effectiveAudioEntry =
    activeTab === 'custom-compiler' && compilerLiveEntry
      ? compilerLiveEntry
      : activeTab === 'taisho-explorer' && taishoActiveEntry
        ? taishoActiveEntry
        : activeEntry;

  const currentEntryIdx = useMemo(() => {
    if (!activeEntry) return -1;
    return filteredEntries.findIndex((e) => e.id === activeEntry.id);
  }, [filteredEntries, activeEntry]);

  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentVerseIndex: null,
    currentSyllableIndex: null,
    currentSyllableInfo: null,
    currentSyllableClassicalZh: '',
    currentSyllableModernZh: '',
    syllableProgress: 0,
    verseProgress: 0,
    rate: 1.0,
    loopVerse: false,
    autoScroll: true,
    mode: 'neural-vits-48k',
    voice: 'male',
    omDroneActive: false,
    backendOnline: true,
    spriteCount: 612,
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    return sanskritAudioEngine.subscribe(setPlaybackState);
  }, []);

  useEffect(() => {
    if (activeEntry?.verses && activeEntry.verses.length > 0) {
      sanskritAudioEngine.prewarmVerses(activeEntry.verses, 3);
    }
  }, [activeEntry]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleScriptConfigChange = (updated: ScriptVisibilityConfig) => {
    setScriptConfig(updated);
    saveScriptConfig(updated);
  };

  const handleToggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      saveBookmarks(next);
      return next;
    });
  };

  const handleAddCustomEntry = (entry: DharaniEntry) => {
    setCustomEntries((prev) => {
      const next = [entry, ...prev];
      saveCustomDharanis(next);
      return next;
    });
  };

  const handleDeleteCustomEntry = (id: string) => {
    setCustomEntries((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveCustomDharanis(next);
      return next;
    });
  };

  const handleClearAllCustomEntries = () => {
    setCustomEntries([]);
    saveCustomDharanis([]);
  };

  const handleSelectAdapterDbId = (dbId: string) => {
    sanskritAudioEngine.stop();
    setSelectedCategory('all');
    setOnlyBookmarked(false);
    setSourceFilter('global-12db');
    setSelectedDbSubFilter(dbId);
    const firstMatch = allEntries.find((e) =>
      dbId === 'all' ? Boolean(e.provenance.databaseId) : e.provenance.databaseId === dbId
    );
    if (firstMatch) {
      setSelectedEntryId(firstMatch.id);
    }
  };

  const navNonceRef = useRef<number>(0);
  const nextNavNonce = () => {
    navNonceRef.current += 1;
    return navNonceRef.current;
  };

  // Prevent iOS Safari / mobile WebViews from shifting the root layout viewport when
  // dismissing virtual keyboards or native <select> pickers inside the docked AudioPlayerBar.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const resetRootViewportIfLocked = () => {
      if (!getActiveScrollContainer()) return;
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    };
    const onFocusOut = () => {
      window.setTimeout(resetRootViewportIfLocked, 32);
    };
    document.addEventListener('focusout', onFocusOut);
    window.addEventListener('scroll', resetRootViewportIfLocked, { passive: true });
    const vv = window.visualViewport;
    vv?.addEventListener('resize', resetRootViewportIfLocked);
    return () => {
      document.removeEventListener('focusout', onFocusOut);
      window.removeEventListener('scroll', resetRootViewportIfLocked);
      vv?.removeEventListener('resize', resetRootViewportIfLocked);
    };
  }, []);

  const handleTabChange = (tab: ActiveWorkspaceTab) => {
    sanskritAudioEngine.stop();
    setMobileCatalogOpen(false);
    setActiveTab(tab);
    scrollReaderToTop('auto');

    if (tab === 'hub') {
      setSourceFilter('global-12db');
      const firstMatch = allEntries.find((e) =>
        selectedDbSubFilter === 'all'
          ? Boolean(e.provenance.databaseId)
          : e.provenance.databaseId === selectedDbSubFilter
      );
      if (firstMatch) setSelectedEntryId(firstMatch.id);
    } else if (tab === 'interlinear') {
      handleSelectAdapterDbId('db1_fangshan');
    } else if (tab === 'concordance') {
      handleSelectAdapterDbId('db8_polyglotta');
    } else if (tab === 'cudl') {
      handleSelectAdapterDbId('db7_cudl_hidas');
    } else if (tab === 'canon-reader') {
      setSourceFilter('all');
      setSelectedDbSubFilter('all');
    }
  };

  const handleSelectEntry = (id: string, matchedVerseId?: string) => {
    sanskritAudioEngine.stop();
    setSelectedEntryId(id);
    setMobileCatalogOpen(false);
    if (
      activeTab !== 'canon-reader' &&
      activeTab !== 'hub' &&
      activeTab !== 'interlinear' &&
      activeTab !== 'concordance' &&
      activeTab !== 'cudl'
    ) {
      setActiveTab('canon-reader');
    }

    if (matchedVerseId) {
      setTimeout(() => {
        scrollToReaderElement(`verse-card-${matchedVerseId}`, {
          behavior: 'smooth',
          topGap: 14,
          highlight: true,
        });
      }, 60);
    } else {
      setReaderNavRequest({ target: 'hero', nonce: nextNavNonce() });
    }
  };

  const handleSelectSuggestion = (item: SearchSuggestionItem) => {
    setMobileCatalogOpen(false);
    if (item.kind === 'taisho-scripture' && item.taishoScriptureId) {
      sanskritAudioEngine.stop();
      setSelectedTaishoScriptureId(item.taishoScriptureId);
      setActiveTab('taisho-explorer');
      scrollReaderToTop('smooth');
      return;
    }
    if (item.entry) {
      sanskritAudioEngine.stop();
      setSelectedCategory('all');
      setSourceFilter('all');
      setSelectedDbSubFilter('all');
      setOnlyBookmarked(false);
      setSelectedEntryId(item.entry.id);
      setActiveTab('canon-reader');
      setReaderNavRequest({ target: 'hero', nonce: nextNavNonce() });
      return;
    }
    if (item.kind === 'global-12db-hit' && item.targetTab) {
      handleTabChange(item.targetTab);
    }
  };

  const isUnifiedReaderTab =
    activeTab === 'canon-reader' ||
    activeTab === 'hub' ||
    activeTab === 'interlinear' ||
    activeTab === 'concordance' ||
    activeTab === 'cudl';

  // When live search filtering switches the displayed scripture while scrolled deep in verses,
  // automatically return to the new scripture's title card.
  const prevActiveEntryIdRef = useRef<string | undefined>(activeEntry?.id);
  useEffect(() => {
    const prevId = prevActiveEntryIdRef.current;
    prevActiveEntryIdRef.current = activeEntry?.id;
    if (!isUnifiedReaderTab || !activeEntry?.id || !prevId || prevId === activeEntry.id) {
      return;
    }
    if (typeof window === 'undefined') return;
    const container = getActiveScrollContainer();
    const currentScrollTop = container ? container.scrollTop : window.scrollY;
    if (currentScrollTop > 180) {
      setReaderNavRequest({ target: 'hero', nonce: nextNavNonce() });
    }
  }, [activeEntry?.id, isUnifiedReaderTab]);

  return (
    <div className="app-shell">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        allEntries={allEntries}
        onSelectSuggestion={handleSelectSuggestion}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenCanonText={(id) => {
          sanskritAudioEngine.stop();
          setCanonTextId(id);
          setCanonQuery(id ? '' : searchQuery);
          setCanonNonce((n) => n + 1);
          setActiveTab('canon-library');
          scrollReaderToTop('smooth');
        }}
      />

      <div id={APP_SCROLL_CONTAINER_ID} className="app-scroll-main">
        <div className="workspace-container">
          {activeTab === 'hub' && (
            <Suspense fallback={<div style={{ padding: '1rem', textAlign: 'center' }}>正在加载全球 12 大梵典数据库导航...</div>}>
              <div style={{ marginBottom: '1rem' }}>
                <DatabaseHubExplorer
                  activeAdapterDbId={selectedDbSubFilter}
                  onSelectAdapterDbId={handleSelectAdapterDbId}
                />
              </div>
            </Suspense>
          )}

          {isUnifiedReaderTab && activeEntry && (
            <div
              className={`canon-reader-grid ${
                sidebarCollapsed ? 'is-sidebar-collapsed' : ''
              }`}
            >
              {/* Mobile Quick Catalog / Verse Outline Drawer Trigger & Prev/Next Stepper */}
              <div className="mobile-catalog-bar">
                <div className="mobile-catalog-trigger-group">
                  <button
                    id="mobile-catalog-trigger-btn"
                    type="button"
                    className="mobile-catalog-trigger-btn"
                    onClick={() => {
                      setSidebarMode('catalog');
                      setMobileCatalogOpen(true);
                    }}
                  >
                    <BookOpen size={14} />
                    <span>选经咒 · {filteredEntries.length}部</span>
                  </button>

                  <button
                    id="mobile-outline-trigger-btn"
                    type="button"
                    className="mobile-outline-trigger-btn"
                    onClick={() => {
                      setSidebarMode('outline');
                      setMobileCatalogOpen(true);
                    }}
                  >
                    <ListOrdered size={14} />
                    <span>本篇句目 · {activeEntry.verses.length}句</span>
                  </button>
                </div>

                <div className="mobile-catalog-nav-group">
                  <button
                    type="button"
                    className={`mobile-step-btn ${onlyBookmarked ? 'active' : ''}`}
                    style={
                      onlyBookmarked
                        ? {
                            borderColor: 'var(--accent-gold-border)',
                            background: 'var(--accent-gold-soft)',
                            color: 'var(--accent-gold)',
                          }
                        : undefined
                    }
                    onClick={() => setOnlyBookmarked((b) => !b)}
                    title="筛选已收藏经咒"
                  >
                    <Bookmark size={13} />
                    <span>{bookmarkedIds.size}</span>
                  </button>

                  <button
                    type="button"
                    className="mobile-step-btn"
                    disabled={currentEntryIdx <= 0}
                    onClick={() => {
                      if (currentEntryIdx > 0) {
                        handleSelectEntry(filteredEntries[currentEntryIdx - 1].id);
                      }
                    }}
                    title="切换至上一部经咒"
                  >
                    <ChevronLeft size={14} />
                    <span className="mobile-step-label">上一部</span>
                  </button>

                  <button
                    type="button"
                    className="mobile-step-btn"
                    disabled={
                      currentEntryIdx < 0 || currentEntryIdx >= filteredEntries.length - 1
                    }
                    onClick={() => {
                      if (
                        currentEntryIdx >= 0 &&
                        currentEntryIdx < filteredEntries.length - 1
                      ) {
                        handleSelectEntry(filteredEntries[currentEntryIdx + 1].id);
                      }
                    }}
                    title="切换至下一部经咒"
                  >
                    <span className="mobile-step-label">下一部</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              <SidebarFilter
                entries={filteredEntries}
                preCategoryEntries={preCategoryFilteredEntries}
                totalCorpusCount={allEntries.length}
                selectedId={activeEntry.id}
                activeEntry={activeEntry}
                onSelectEntry={(id) => handleSelectEntry(id)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                sourceFilter={sourceFilter}
                onSourceFilterChange={(sf) => {
                  setSourceFilter(sf);
                  if (sf !== 'global-12db') {
                    setSelectedDbSubFilter('all');
                  }
                }}
                selectedDbSubFilter={selectedDbSubFilter}
                onSelectDbSubFilter={(dbId) => {
                  setSelectedDbSubFilter(dbId);
                  if (dbId !== 'all') {
                    setSourceFilter('global-12db');
                  }
                }}
                onlyBookmarked={onlyBookmarked}
                onToggleOnlyBookmarked={() => setOnlyBookmarked((b) => !b)}
                bookmarkedIds={bookmarkedIds}
                onToggleBookmark={handleToggleBookmark}
                playbackState={playbackState}
                onPlayAllVerses={() => sanskritAudioEngine.playVerses(activeEntry.verses, 0, false)}
                onStopPlayback={() => sanskritAudioEngine.stop()}
                onPlaySingleVerse={(verseIdx) =>
                  sanskritAudioEngine.playVerses(activeEntry.verses, verseIdx, true)
                }
                onJumpToSection={(target) =>
                  setReaderNavRequest({ target, nonce: nextNavNonce() })
                }
                onJumpToVerse={(verseArrayIndex) =>
                  setReaderNavRequest({
                    target: 'verse',
                    verseArrayIndex,
                    nonce: nextNavNonce(),
                  })
                }
                sidebarMode={sidebarMode}
                onSidebarModeChange={setSidebarMode}
                sidebarCollapsed={sidebarCollapsed}
                onToggleSidebarCollapsed={() => setSidebarCollapsed((c) => !c)}
                mobileOpen={mobileCatalogOpen}
                onCloseMobile={() => setMobileCatalogOpen(false)}
              />

              <DharaniReader
                entry={activeEntry}
                scriptConfig={scriptConfig}
                onScriptConfigChange={handleScriptConfigChange}
                isBookmarked={bookmarkedIds.has(activeEntry.id)}
                onToggleBookmark={() => handleToggleBookmark(activeEntry.id)}
                playbackState={playbackState}
                onPlayAllVerses={() => sanskritAudioEngine.playVerses(activeEntry.verses, 0, false)}
                onStopPlayback={() => sanskritAudioEngine.stop()}
                onPlaySingleVerse={(verseIdx) =>
                  sanskritAudioEngine.playVerses(activeEntry.verses, verseIdx, true)
                }
                onPlaySingleSyllable={(iastSyl) => sanskritAudioEngine.playSingleSyllable(iastSyl)}
                onNavigateTab={handleTabChange}
                navigationRequest={readerNavRequest}
              />
            </div>
          )}

          {activeTab === 'interlinear' && (
            <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>正在加载房山石经与 T54 对音语料库...</div>}>
              <details style={{ marginTop: '1.25rem' }}>
                <summary
                  className="btn-scholarly"
                  style={{ cursor: 'pointer', display: 'inline-flex', marginBottom: '0.75rem' }}
                >
                  展开 / 收起：房山石经与 T54《悉昙字记》声母摩多对勘附表
                </summary>
                <FangshanTaishoInterlinearStudio />
              </details>
            </Suspense>
          )}

          {activeTab === 'concordance' && (
            <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>正在加载奥斯陆 16 本心经与多本同源对勘台...</div>}>
              <details style={{ marginTop: '1.25rem' }}>
                <summary
                  className="btn-scholarly"
                  style={{ cursor: 'pointer', display: 'inline-flex', marginBottom: '0.75rem' }}
                >
                  展开 / 收起：多译本平行分栏对勘总表
                </summary>
                <ConcordanceParallelStudio />
              </details>
            </Suspense>
          )}

          {activeTab === 'cudl' && (
            <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>正在加载剑桥大学 CUDL 梵文贝叶经写本馆...</div>}>
              <details style={{ marginTop: '1.25rem' }}>
                <summary
                  className="btn-scholarly"
                  style={{ cursor: 'pointer', display: 'inline-flex', marginBottom: '0.75rem' }}
                >
                  展开 / 收起：剑桥大学图书馆 CUDL 高清贝叶经 IIIF 图版检视器
                </summary>
                <CudlPalmLeafViewer />
              </details>
            </Suspense>
          )}

          {activeTab === 'taisho-explorer' && (
            <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>正在加载大正藏密教部 614 经与 14,485 段真言总览...</div>}>
              <TaishoCanonExplorer
                initialScriptureId={selectedTaishoScriptureId}
                allEntries={allEntries}
                scriptConfig={scriptConfig}
                onScriptConfigChange={handleScriptConfigChange}
                bookmarkedIds={bookmarkedIds}
                onToggleBookmark={handleToggleBookmark}
                playbackState={playbackState}
                onNavigateTab={handleTabChange}
                onActiveEntryChange={setTaishoActiveEntry}
              />
            </Suspense>
          )}

          {activeTab === 'canon-library' && (
            <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>正在加载藏经全文库...</div>}>
              <CanonLibrary
                key={canonNonce}
                initialTextId={canonTextId}
                initialQuery={canonQuery}
                allEntries={allEntries}
                onOpenEntry={(e) => {
                  setActiveTab('canon-reader');
                  handleSelectEntry(e.id);
                }}
              />
            </Suspense>
          )}

          {activeTab === 'phonetics-academy' && (
            <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>正在加载悉昙十八章与牛津 OCHS 种子字辞典...</div>}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                <SiddhamBijaAcademy
                  onPlaySyllable={(iastSyl) => sanskritAudioEngine.playSingleSyllable(iastSyl)}
                />
                <SanskritPhoneticsAcademy
                  onPlaySyllable={(iastSyl) => sanskritAudioEngine.playSingleSyllable(iastSyl)}
                />
              </div>
            </Suspense>
          )}

          {activeTab === 'custom-compiler' && (
            <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>正在加载梵音六体编译与全咒发声工作台...</div>}>
              <CustomDharaniCompiler
                customEntries={customEntries}
                onAddCustomEntry={handleAddCustomEntry}
                onDeleteCustomEntry={handleDeleteCustomEntry}
                onClearAllCustomEntries={handleClearAllCustomEntries}
                playbackState={playbackState}
                onPlayVerses={(verses, startIdx = 0, singleOnly = false) =>
                  sanskritAudioEngine.playVerses(verses, startIdx, singleOnly)
                }
                onStopPlayback={() => sanskritAudioEngine.stop()}
                onPlaySyllable={(iastSyl) => sanskritAudioEngine.playSingleSyllable(iastSyl)}
                onLiveEntryChange={setCompilerLiveEntry}
              />
            </Suspense>
          )}
        </div>
      </div>

      {effectiveAudioEntry && (
        <AudioPlayerBar
          entryId={effectiveAudioEntry.id}
          dharaniTitleZh={effectiveAudioEntry.titleZh}
          verses={effectiveAudioEntry.verses}
          playbackState={playbackState}
          onPlayAll={() => sanskritAudioEngine.playVerses(effectiveAudioEntry.verses, 0, false)}
          onStop={() => sanskritAudioEngine.stop()}
          onToggleLoop={() => sanskritAudioEngine.setLoopVerse(!playbackState.loopVerse)}
          onToggleAutoScroll={() =>
            sanskritAudioEngine.setAutoScroll(!playbackState.autoScroll)
          }
          onChangeRate={(r) => sanskritAudioEngine.setRate(r)}
          onChangeMode={(m: AudioEngineMode) => sanskritAudioEngine.setMode(m)}
        />
      )}
    </div>
  );
};

export default App;
