import React, { useState, useEffect, useMemo, useRef, Suspense, lazy, useCallback } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  ListOrdered,
  Volume2,
  Play,
  Square,
  Share2,
  X,
  Loader2,
} from 'lucide-react';
import type {
  ActiveWorkspaceTab,
  DharaniCategoryId,
  DharaniEntry,
  ScriptVisibilityConfig,
} from './types/kosaTypes';
import type { CanonCatalogItem } from './core/canon/canonLibraryTypes';
import type { CbetaBuleiId } from './core/canon/cbetaBulei';
import { hasEntryCompleteOriginalSanskrit } from './core/provenance/fieldProvenance';
import { FIRST_SCREEN_CORPUS } from './data/firstScreenCorpus';
import {
  getCloudCorpusSnapshot,
  loadFullCloudCorpus,
  subscribeCloudCorpus,
} from './services/corpus/cloudCorpusService';
import {
  buildReaderEntryFromCanonItem,
  filterCatalog,
  loadCanonCatalog,
  loadCanonText,
} from './services/canon/canonLibraryService';
import {
  filterDharanis,
  hydrateCanonCatalogForSearch,
  type SearchScope,
  type SearchSuggestionItem,
} from './core/search/searchEngine';
import {
  sanskritAudioEngine,
  type AudioEngineMode,
  type PlaybackState,
} from './services/audio/sanskritAudioEngine';
import { startBuddhistQaKeepAliveBeacon } from './services/ai/buddhistQaService';
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
import { CbetaSearchResultsView } from './components/search/CbetaSearchResultsView';
import { AudioPlayerBar } from './components/audio/AudioPlayerBar';
import { DharaniShareModal } from './components/share/DharaniShareModal';
import {
  parseShareDeepLinkFromSearch,
  synthesizeEntryFromCustomDeepLink,
  type ShareDeepLinkPayload,
} from './core/share/shareUrlCodec';
import {
  APP_SCROLL_CONTAINER_ID,
  getActiveScrollContainer,
  scrollReaderToTop,
} from './core/dom/scrollUtils';

const BuddhistAiQaStudio = lazy(() => import('./components/ai/BuddhistAiQaStudio'));
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
  const initialDeepLink = useMemo<ShareDeepLinkPayload | null>(() => {
    if (typeof window === 'undefined') return null;
    return parseShareDeepLinkFromSearch(window.location.search);
  }, []);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadTheme());
  const [activeTab, setActiveTab] = useState<ActiveWorkspaceTab>('canon-reader');
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string>('');
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<SidebarViewMode>('catalog');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [readerNavRequest, setReaderNavRequest] = useState<ReaderNavigationRequest | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('all');
  const [searchResultsViewOpen, setSearchResultsViewOpen] = useState<boolean>(false);
  const [selectedBulei, setSelectedBulei] = useState<CbetaBuleiId | 'all'>('all');
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
  const [corpusHydrated, setCorpusHydrated] = useState<boolean>(false);

  const [canonCatalog, setCanonCatalog] = useState<CanonCatalogItem[]>([]);
  const [dynamicCanonEntries, setDynamicCanonEntries] = useState<Map<string, DharaniEntry>>(
    () => new Map()
  );

  const [pendingDeepLink, setPendingDeepLink] = useState<ShareDeepLinkPayload | null>(
    initialDeepLink
  );
  const [qrListenBanner, setQrListenBanner] = useState<{
    entryId: string;
    startVerseIndex: number;
    singleVerse: boolean;
  } | null>(null);
  const [shareModalTarget, setShareModalTarget] = useState<{
    entry: DharaniEntry;
    initialVerseIndex: number | null;
  } | null>(null);

  const customSharedEntry = useMemo<DharaniEntry | null>(() => {
    if (!initialDeepLink?.customIast) return null;
    return synthesizeEntryFromCustomDeepLink(initialDeepLink);
  }, [initialDeepLink]);

  useEffect(() => {
    startBuddhistQaKeepAliveBeacon();
    const unsub = subscribeCloudCorpus((entries, status) => {
      setCloudCorpusEntries(entries);
      if (status.phase === 'ready') {
        setCorpusHydrated(true);
      }
    });
    void loadFullCloudCorpus().finally(() => {
      setCorpusHydrated(true);
    });
    loadCanonCatalog()
      .then((cat) => {
        setCanonCatalog(cat);
        hydrateCanonCatalogForSearch(cat);
      })
      .catch(() => {});
    return unsub;
  }, []);

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

  const allEntries = useMemo(() => {
    const seen = new Set<string>();
    const combined: DharaniEntry[] = [];
    if (customSharedEntry) {
      seen.add(customSharedEntry.id);
      combined.push(customSharedEntry);
    }
    for (const dynEntry of dynamicCanonEntries.values()) {
      seen.add(dynEntry.id);
      combined.push(dynEntry);
    }
    for (const item of cloudCorpusEntries) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        combined.push(item);
      }
    }
    return combined;
  }, [cloudCorpusEntries, customSharedEntry, dynamicCanonEntries]);

  const preCategoryFilteredEntries = useMemo(() => {
    const base = filterDharanis(allEntries, {
      query: searchQuery,
      categoryId: 'all',
      scope: searchScope,
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
    searchScope,
    onlyBookmarked,
    bookmarkedIds,
    sourceFilter,
    selectedDbSubFilter,
  ]);

  const filteredEntries = useMemo(() => {
    let base = preCategoryFilteredEntries;
    if (selectedCategory !== 'all') {
      base = base.filter((e) => e.categoryId === selectedCategory);
    }
    if (selectedBulei !== 'all') {
      base = filterDharanis(base, {
        query: '',
        categoryId: 'all',
        buleiId: selectedBulei,
        onlyBookmarked: false,
        bookmarkedIds,
        sourceFilter: 'all',
      });
    }
    return base;
  }, [preCategoryFilteredEntries, selectedCategory, selectedBulei, bookmarkedIds]);

  const sidebarCanonHits = useMemo<CanonCatalogItem[]>(() => {
    const q = searchQuery.trim();
    if (
      searchScope === 'dharani' ||
      searchScope === 'dharani-sanskrit' ||
      searchScope === 'dharani-phonetic'
    ) {
      return [];
    }
    if (canonCatalog.length === 0 || sourceFilter === 'global-12db') return [];
    if (!q && searchScope !== 'sutra-text' && selectedBulei === 'all') return [];
    return filterCatalog(canonCatalog, q, {
      buleiId: selectedBulei,
    }).slice(0, 40);
  }, [canonCatalog, searchQuery, searchScope, sourceFilter, selectedBulei]);

  const [selectedEntryId, setSelectedEntryId] = useState<string>(
    initialDeepLink?.entryId || FIRST_SCREEN_CORPUS[0]?.id || ''
  );

  const [canonTextId, setCanonTextId] = useState<string | null>(null);
  const [canonQuery, setCanonQuery] = useState('');
  const [canonNonce, setCanonNonce] = useState(0);
  const [taishoActiveEntry, setTaishoActiveEntry] = useState<DharaniEntry | null>(null);
  const [compilerLiveEntry, setCompilerLiveEntry] = useState<DharaniEntry | null>(null);

  const activeEntry = useMemo(() => {
    const foundDynamicCanon = dynamicCanonEntries.get(selectedEntryId);
    if (foundDynamicCanon) return foundDynamicCanon;
    const foundCustomLocal = customEntries.find((e) => e.id === selectedEntryId);
    if (foundCustomLocal) return foundCustomLocal;
    const foundInFiltered = filteredEntries.find((e) => e.id === selectedEntryId);
    if (foundInFiltered) return foundInFiltered;
    const foundInAll = allEntries.find((e) => e.id === selectedEntryId);
    if (foundInAll) return foundInAll;
    if (filteredEntries.length > 0) return filteredEntries[0];
    return allEntries[0];
  }, [allEntries, customEntries, dynamicCanonEntries, filteredEntries, selectedEntryId]);

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
    if (
      activeEntry?.verses &&
      activeEntry.verses.length > 0 &&
      hasEntryCompleteOriginalSanskrit(activeEntry)
    ) {
      sanskritAudioEngine.prewarmVerses(activeEntry.verses, 3);
    }
  }, [activeEntry]);

  const navNonceRef = useRef<number>(0);
  const nextNavNonce = () => {
    navNonceRef.current += 1;
    return navNonceRef.current;
  };

  const handleOpenCanonScriptureInReader = useCallback(
    (canonItem: CanonCatalogItem) => {
      sanskritAudioEngine.stop();
      setQrListenBanner(null);
      setMobileCatalogOpen(false);
      setSearchResultsViewOpen(false);

      const initialSynthesized = buildReaderEntryFromCanonItem(canonItem, null, cloudCorpusEntries);
      setDynamicCanonEntries((prev) => {
        const next = new Map(prev);
        next.set(initialSynthesized.id, initialSynthesized);
        return next;
      });
      setSelectedCategory('all');
      setSelectedBulei('all');
      setSourceFilter('all');
      setSelectedDbSubFilter('all');
      setOnlyBookmarked(false);
      setSelectedEntryId(initialSynthesized.id);
      setActiveTab('canon-reader');
      setReaderNavRequest({ target: 'original', nonce: nextNavNonce() });

      if (canonItem.dharani > 0 && initialSynthesized.verses.length === 0) {
        loadCanonText(canonItem)
          .then((canonText) => {
            const hydratedEntry = buildReaderEntryFromCanonItem(
              canonItem,
              canonText,
              cloudCorpusEntries
            );
            setDynamicCanonEntries((prev) => {
              const next = new Map(prev);
              next.set(hydratedEntry.id, hydratedEntry);
              return next;
            });
          })
          .catch(() => {});
      }
    },
    [cloudCorpusEntries]
  );

  useEffect(() => {
    if (!pendingDeepLink) return;

    const matched =
      allEntries.find((e) => e.id === pendingDeepLink.entryId) ||
      customEntries.find((e) => e.id === pendingDeepLink.entryId);

    if (!matched) {
      if (corpusHydrated) {
        const canonIdMatch = pendingDeepLink.entryId.match(/^canon-scripture-(.+)$/);
        if (canonIdMatch && canonCatalog.length > 0) {
          const foundCanon = canonCatalog.find((c) => c.id === canonIdMatch[1]);
          if (foundCanon) {
            handleOpenCanonScriptureInReader(foundCanon);
            setPendingDeepLink(null);
            return;
          }
        }
        setPendingDeepLink(null);
      }
      return;
    }

    setActiveTab('canon-reader');
    setSearchResultsViewOpen(false);
    setSelectedCategory('all');
    setSelectedBulei('all');
    setSourceFilter('all');
    setSelectedDbSubFilter('all');
    setOnlyBookmarked(false);
    setSelectedEntryId(matched.id);

    if (pendingDeepLink.voice) {
      sanskritAudioEngine.setVoice(pendingDeepLink.voice);
    }
    if (pendingDeepLink.mode) {
      sanskritAudioEngine.setMode(pendingDeepLink.mode);
    }

    const safeVerseIdx =
      pendingDeepLink.verseIndex !== null &&
      pendingDeepLink.verseIndex >= 0 &&
      pendingDeepLink.verseIndex < matched.verses.length
        ? pendingDeepLink.verseIndex
        : 0;

    if (pendingDeepLink.verseIndex !== null && safeVerseIdx > 0) {
      setReaderNavRequest({
        target: 'verse',
        verseArrayIndex: safeVerseIdx,
        nonce: nextNavNonce(),
      });
    } else {
      setReaderNavRequest({ target: 'hero', nonce: nextNavNonce() });
    }

    if (
      pendingDeepLink.listen &&
      matched.verses.length > 0 &&
      hasEntryCompleteOriginalSanskrit(matched)
    ) {
      setQrListenBanner({
        entryId: matched.id,
        startVerseIndex: safeVerseIdx,
        singleVerse: pendingDeepLink.singleVerse,
      });
      sanskritAudioEngine.prewarmVerses(matched.verses, Math.max(3, safeVerseIdx + 2));

      const triggerQrPlay = () => {
        void sanskritAudioEngine.playVerses(
          matched.verses,
          safeVerseIdx,
          pendingDeepLink.singleVerse
        );
      };

      const timer = window.setTimeout(triggerQrPlay, 120);
      return () => window.clearTimeout(timer);
    }

    setPendingDeepLink(null);
  }, [pendingDeepLink, allEntries, customEntries, corpusHydrated, canonCatalog, handleOpenCanonScriptureInReader]);

  useEffect(() => {
    if (pendingDeepLink && activeEntry && activeEntry.id === pendingDeepLink.entryId) {
      setPendingDeepLink(null);
    }
  }, [pendingDeepLink, activeEntry]);

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
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
    setSelectedBulei('all');
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
    setSearchResultsViewOpen(false);
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

  const handleSelectEntry = (id: string) => {
    sanskritAudioEngine.stop();
    setSelectedEntryId(id);
    setQrListenBanner(null);
    setMobileCatalogOpen(false);
    setSearchResultsViewOpen(false);
    if (
      activeTab !== 'canon-reader' &&
      activeTab !== 'hub' &&
      activeTab !== 'interlinear' &&
      activeTab !== 'concordance' &&
      activeTab !== 'cudl'
    ) {
      setActiveTab('canon-reader');
    }
    setReaderNavRequest({ target: 'hero', nonce: nextNavNonce() });
  };

  const handleOpenEntryFromAi = useCallback((entry: DharaniEntry) => {
    sanskritAudioEngine.stop();
    setSearchResultsViewOpen(false);
    setSelectedCategory('all');
    setSelectedBulei('all');
    setSourceFilter('all');
    setSelectedDbSubFilter('all');
    setOnlyBookmarked(false);
    setSelectedEntryId(entry.id);
    setActiveTab('canon-reader');
    setReaderNavRequest({ target: 'hero', nonce: nextNavNonce() });
  }, []);

  const handleAskBuddhistAiFromReader = useCallback((entry: DharaniEntry) => {
    sanskritAudioEngine.stop();
    setSearchResultsViewOpen(false);
    const prompt =
      entry.verses.length > 0
        ? `请结合本库《${entry.titleZh}》（${entry.taishoNo}）的原典全文与陀罗尼咒句，解析本篇经典的缘起出处与核心法义。`
        : `请检索并结合本库《${entry.titleZh}》（${entry.taishoNo}）的原典全文，梳理本经的核心宗趣与重要品段经句。`;
    setSelectedEntryId(entry.id);
    setAiInitialPrompt(prompt);
    setActiveTab('buddhist-ai');
    scrollReaderToTop('smooth');
  }, []);

  const handleSelectSuggestion = (item: SearchSuggestionItem) => {
    setMobileCatalogOpen(false);
    setQrListenBanner(null);
    setSearchResultsViewOpen(false);

    if (item.kind === 'canon-scripture' && item.canonItem) {
      handleOpenCanonScriptureInReader(item.canonItem);
      return;
    }

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
      setSelectedBulei('all');
      setSourceFilter('all');
      setSelectedDbSubFilter('all');
      setOnlyBookmarked(false);
      setSelectedEntryId(item.entry.id);
      setActiveTab('canon-reader');
      if (item.matchedVerseId) {
        const matchedIdx = item.entry.verses.findIndex((v) => v.id === item.matchedVerseId);
        if (matchedIdx >= 0) {
          setReaderNavRequest({
            target: 'verse',
            verseArrayIndex: matchedIdx,
            nonce: nextNavNonce(),
          });
          return;
        }
      }
      setReaderNavRequest({ target: 'hero', nonce: nextNavNonce() });
      return;
    }

    if (item.kind === 'global-12db-hit' && item.targetTab) {
      handleTabChange(item.targetTab);
    }
  };

  const handleSubmitFullSearch = (q: string, scope: SearchScope) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    sanskritAudioEngine.stop();
    setSearchQuery(trimmed);
    setSearchScope(scope);
    setActiveTab('canon-reader');
    setSearchResultsViewOpen(true);
    scrollReaderToTop('auto');
  };

  const isUnifiedReaderTab =
    activeTab === 'canon-reader' ||
    activeTab === 'hub' ||
    activeTab === 'interlinear' ||
    activeTab === 'concordance' ||
    activeTab === 'cudl';

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

  const handleOpenShareModal = (entry: DharaniEntry, initialVerseIndex: number | null = null) => {
    if (entry.verses.length === 0) return;
    setShareModalTarget({ entry, initialVerseIndex });
  };

  const hasPlayableSanskrit = Boolean(
    effectiveAudioEntry && hasEntryCompleteOriginalSanskrit(effectiveAudioEntry)
  );

  const showBottomAudioBar = Boolean(
    effectiveAudioEntry &&
      !searchResultsViewOpen &&
      (playbackState.isPlaying || (activeTab !== 'buddhist-ai' && hasPlayableSanskrit))
  );

  return (
    <div className="app-shell">
      <Header
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (!q.trim()) setSearchResultsViewOpen(false);
        }}
        searchScope={searchScope}
        onSearchScopeChange={setSearchScope}
        onSubmitSearch={handleSubmitFullSearch}
        allEntries={allEntries}
        onSelectSuggestion={handleSelectSuggestion}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onSelectCanonScripture={handleOpenCanonScriptureInReader}
        onAskAiWithQuery={(q) => {
          sanskritAudioEngine.stop();
          setSearchResultsViewOpen(false);
          setAiInitialPrompt(q);
          setActiveTab('buddhist-ai');
          scrollReaderToTop('smooth');
        }}
        onOpenCanonText={(id) => {
          sanskritAudioEngine.stop();
          setSearchResultsViewOpen(false);
          setCanonTextId(id);
          setCanonQuery(id ? '' : searchQuery);
          setCanonNonce((n) => n + 1);
          setActiveTab('canon-library');
          scrollReaderToTop('smooth');
        }}
      />

      <div id={APP_SCROLL_CONTAINER_ID} className="app-scroll-main">
        <div className="workspace-container">
          {pendingDeepLink && !corpusHydrated && (
            <div className="qr-listen-landing-banner" role="status">
              <div className="qr-listen-banner-main">
                <Loader2 size={18} className="spin-icon" color="var(--accent-vermilion)" />
                <span>正在加载经典与梵音数据...</span>
              </div>
            </div>
          )}

          {qrListenBanner &&
            activeEntry &&
            hasEntryCompleteOriginalSanskrit(activeEntry) &&
            qrListenBanner.entryId === activeEntry.id && (
              <div className="qr-listen-landing-banner" role="region" aria-label="二维码扫码音频直达">
                <div className="qr-listen-banner-main">
                  <span className="qr-listen-badge">
                    <Volume2 size={14} />
                    <span>扫码聆听直达</span>
                  </span>
                  <div className="qr-listen-text">
                    <strong>《{activeEntry.titleZh}》</strong>
                  </div>
                </div>

                <div className="qr-listen-actions">
                  {playbackState.isPlaying ? (
                    <button
                      type="button"
                      className="btn-scholarly primary"
                      onClick={() => sanskritAudioEngine.stop()}
                    >
                      <Square size={14} />
                      <span>停止</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-scholarly primary"
                      onClick={() =>
                        sanskritAudioEngine.playVerses(
                          activeEntry.verses,
                          qrListenBanner.startVerseIndex,
                          qrListenBanner.singleVerse
                        )
                      }
                    >
                      <Play size={14} />
                      <span>立即聆听</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn-scholarly gold"
                    onClick={() =>
                      handleOpenShareModal(
                        activeEntry,
                        qrListenBanner.singleVerse ? qrListenBanner.startVerseIndex : null
                      )
                    }
                  >
                    <Share2 size={14} />
                    <span>分享卡片</span>
                  </button>

                  <button
                    type="button"
                    className="qr-listen-close-btn"
                    onClick={() => setQrListenBanner(null)}
                    aria-label="关闭"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            )}

          {activeTab === 'buddhist-ai' && (
            <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>正在加载佛经 AI 问答工作台...</div>}>
              <BuddhistAiQaStudio
                allEntries={allEntries}
                canonCatalog={canonCatalog}
                activeEntry={activeEntry || null}
                initialPrompt={aiInitialPrompt}
                onConsumeInitialPrompt={() => setAiInitialPrompt('')}
                onOpenEntryInReader={handleOpenEntryFromAi}
                onOpenCanonScriptureInReader={handleOpenCanonScriptureInReader}
              />
            </Suspense>
          )}

          {activeTab === 'hub' && !searchResultsViewOpen && (
            <Suspense fallback={<div style={{ padding: '1rem', textAlign: 'center' }}>正在加载全球 12 大梵典数据库导航...</div>}>
              <div style={{ marginBottom: '1rem' }}>
                <DatabaseHubExplorer
                  activeAdapterDbId={selectedDbSubFilter}
                  onSelectAdapterDbId={handleSelectAdapterDbId}
                />
              </div>
            </Suspense>
          )}

          {/* Dedicated CBETA-Style Full Search Workspace */}
          {isUnifiedReaderTab && searchResultsViewOpen && searchQuery.trim() ? (
            <CbetaSearchResultsView
              query={searchQuery}
              initialScope={searchScope}
              allEntries={allEntries}
              canonCatalog={canonCatalog}
              onQueryChange={(nextQ) => setSearchQuery(nextQ)}
              onCloseSearchView={() => setSearchResultsViewOpen(false)}
              onOpenEntry={(entry, opts) => {
                sanskritAudioEngine.stop();
                setSearchResultsViewOpen(false);
                setSelectedCategory('all');
                setSelectedBulei('all');
                setSourceFilter('all');
                setSelectedDbSubFilter('all');
                setOnlyBookmarked(false);
                setSelectedEntryId(entry.id);
                if (opts?.openOriginalTab) {
                  setReaderNavRequest({ target: 'original', nonce: nextNavNonce() });
                } else if (typeof opts?.verseArrayIndex === 'number') {
                  setReaderNavRequest({
                    target: 'verse',
                    verseArrayIndex: opts.verseArrayIndex,
                    nonce: nextNavNonce(),
                  });
                } else {
                  setReaderNavRequest({ target: 'hero', nonce: nextNavNonce() });
                }
              }}
              onOpenCanonItem={(item) => handleOpenCanonScriptureInReader(item)}
              onAskAi={(q) => {
                sanskritAudioEngine.stop();
                setSearchResultsViewOpen(false);
                setAiInitialPrompt(q);
                setActiveTab('buddhist-ai');
                scrollReaderToTop('smooth');
              }}
            />
          ) : (
            isUnifiedReaderTab &&
            activeEntry && (
              <div
                className={`canon-reader-grid ${
                  sidebarCollapsed ? 'is-sidebar-collapsed' : ''
                }`}
              >
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
                      <span>部類目錄 · {filteredEntries.length + sidebarCanonHits.length}</span>
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
                      <span>本篇導覽</span>
                    </button>
                  </div>

                  <div className="mobile-catalog-nav-group">
                    <button
                      type="button"
                      className={`mobile-step-btn ${onlyBookmarked ? 'active' : ''}`}
                      onClick={() => setOnlyBookmarked((b) => !b)}
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
                    >
                      <ChevronLeft size={14} />
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
                    >
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
                  canonScriptureHits={sidebarCanonHits}
                  onSelectCanonScripture={handleOpenCanonScriptureInReader}
                  onOpenFullCanonLibrary={() => {
                    setCanonTextId(null);
                    setCanonQuery(searchQuery);
                    setCanonNonce((n) => n + 1);
                    setActiveTab('canon-library');
                  }}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  searchScope={searchScope}
                  onSearchScopeChange={setSearchScope}
                  selectedBulei={selectedBulei}
                  onSelectBulei={setSelectedBulei}
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
                  onPlayAllVerses={() =>
                    sanskritAudioEngine.playVerses(activeEntry.verses, 0, false)
                  }
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
                  onPlayAllVerses={() =>
                    sanskritAudioEngine.playVerses(activeEntry.verses, 0, false)
                  }
                  onStopPlayback={() => sanskritAudioEngine.stop()}
                  onPlaySingleVerse={(verseIdx) =>
                    sanskritAudioEngine.playVerses(activeEntry.verses, verseIdx, true)
                  }
                  onPlaySingleSyllable={(iastSyl) =>
                    sanskritAudioEngine.playSingleSyllable(iastSyl)
                  }
                  onNavigateTab={handleTabChange}
                  navigationRequest={readerNavRequest}
                  onRequestShare={(entryToShare, verseIdx) =>
                    handleOpenShareModal(entryToShare, verseIdx ?? null)
                  }
                  onAskBuddhistAi={handleAskBuddhistAiFromReader}
                />
              </div>
            )
          )}

          {activeTab === 'interlinear' && !searchResultsViewOpen && (
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

          {activeTab === 'concordance' && !searchResultsViewOpen && (
            <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>正在加载多本同源对勘台...</div>}>
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

          {activeTab === 'cudl' && !searchResultsViewOpen && (
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
            <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>正在加载大正藏密教部...</div>}>
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
            <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>正在加载全部藏经全文库...</div>}>
              <CanonLibrary
                key={canonNonce}
                initialTextId={canonTextId}
                initialQuery={canonQuery}
                allEntries={allEntries}
                onOpenEntry={(e) => {
                  setActiveTab('canon-reader');
                  handleSelectEntry(e.id);
                }}
                onOpenCanonInReader={(item) => {
                  handleOpenCanonScriptureInReader(item);
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
            <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>正在加载梵音编译器...</div>}>
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

      {showBottomAudioBar && effectiveAudioEntry && (
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
          onSharePoster={() => {
            const activeVerseArrIdx =
              playbackState.isPlaying && playbackState.currentVerseIndex !== null
                ? effectiveAudioEntry.verses.findIndex(
                    (v) => v.index === playbackState.currentVerseIndex
                  )
                : -1;
            handleOpenShareModal(
              effectiveAudioEntry,
              activeVerseArrIdx >= 0 ? activeVerseArrIdx : null
            );
          }}
        />
      )}

      {shareModalTarget && (
        <DharaniShareModal
          entry={shareModalTarget.entry}
          scriptConfig={scriptConfig}
          playbackState={playbackState}
          initialVerseIndex={shareModalTarget.initialVerseIndex}
          theme={theme}
          onClose={() => setShareModalTarget(null)}
        />
      )}
    </div>
  );
};

export default App;
