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
  isClassicalChineseOnlyEntry,
  isClassicalChineseOnlyVerse,
} from './core/provenance/fieldProvenance';
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
  scrollToReaderElement,
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

  const sidebarCanonHits = useMemo<CanonCatalogItem[]>(() => {
    const q = searchQuery.trim();
    if (canonCatalog.length === 0 || sourceFilter === 'global-12db') return [];
    if (q.length < 1) {
      return searchScope === 'sutra' ? canonCatalog.slice(0, 60) : [];
    }
    const hits = filterCatalog(canonCatalog, q, {
      dharaniMode: searchScope === 'dharani' ? 'with-dharani' : 'all',
    });
    if (searchScope === 'sutra') {
      return hits.slice(0, 50);
    }
    // In 'all' and 'dharani' modes, skip canon items already covered by curated/12db entries
    const coveredIds = new Set<string>();
    for (const e of cloudCorpusEntries) {
      if (e.provenance.cbetaId) coveredIds.add(e.provenance.cbetaId);
      const m = e.taishoNo.match(/^([A-Z]{1,2}\d{2,3}n[0-9A-Za-z]+)/);
      if (m) coveredIds.add(m[1]);
    }
    return hits.filter((c) => !coveredIds.has(c.id)).slice(0, 40);
  }, [canonCatalog, cloudCorpusEntries, searchQuery, searchScope, sourceFilter]);

  const sidebarCanonIdSet = useMemo(
    () => new Set(sidebarCanonHits.map((c) => `canon-scripture-${c.id}`)),
    [sidebarCanonHits]
  );

  const preCategoryFilteredEntries = useMemo(() => {
    if (searchScope === 'sutra') {
      return [];
    }
    const pool = allEntries.filter((e) => !sidebarCanonIdSet.has(e.id));
    const base = filterDharanis(pool, {
      query: searchQuery,
      categoryId: 'all',
      onlyBookmarked,
      bookmarkedIds,
      sourceFilter,
      searchScope,
    });
    if (selectedDbSubFilter !== 'all') {
      return base.filter((e) => e.provenance.databaseId === selectedDbSubFilter);
    }
    return base;
  }, [
    allEntries,
    sidebarCanonIdSet,
    searchQuery,
    searchScope,
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
    if (activeEntry?.verses && activeEntry.verses.length > 0 && !isClassicalChineseOnlyEntry(activeEntry)) {
      const playable = activeEntry.verses.filter(
        (v) => !isClassicalChineseOnlyVerse(v) && Boolean(v.iast && v.iast.trim())
      );
      if (playable.length > 0) {
        sanskritAudioEngine.prewarmVerses(playable, 3);
      }
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

      const initialSynthesized = buildReaderEntryFromCanonItem(canonItem, null, cloudCorpusEntries);
      setDynamicCanonEntries((prev) => {
        const next = new Map(prev);
        next.set(initialSynthesized.id, initialSynthesized);
        return next;
      });
      setSelectedCategory('all');
      setSourceFilter('all');
      setSelectedDbSubFilter('all');
      setOnlyBookmarked(false);
      setSelectedEntryId(initialSynthesized.id);
      setActiveTab('canon-reader');
      setReaderNavRequest({ target: 'hero', nonce: nextNavNonce() });

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
    setSelectedCategory('all');
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

    if (pendingDeepLink.listen && matched.verses.length > 0) {
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
    if (
      pendingDeepLink &&
      activeEntry &&
      activeEntry.id === pendingDeepLink.entryId
    ) {
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
    setQrListenBanner(null);
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

  const handleOpenEntryFromAi = useCallback((entry: DharaniEntry) => {
    sanskritAudioEngine.stop();
    setSelectedCategory('all');
    setSourceFilter('all');
    setSelectedDbSubFilter('all');
    setOnlyBookmarked(false);
    setSelectedEntryId(entry.id);
    setActiveTab('canon-reader');
    setReaderNavRequest({ target: 'hero', nonce: nextNavNonce() });
  }, []);

  const handleAskBuddhistAiFromReader = useCallback((entry: DharaniEntry) => {
    sanskritAudioEngine.stop();
    const prompt =
      entry.verses.length > 0
        ? `请结合本库《${entry.titleZh}》（${entry.taishoNo}）的原典全文与陀罗尼咒句，解析本篇经典的缘起出处、核心法义与关键梵文词根语法。`
        : `请检索并结合本库《${entry.titleZh}》（${entry.taishoNo}）的原典全文，为您梳理本经的核心宗趣、重要品段经句与历代译注特点。`;
    setSelectedEntryId(entry.id);
    setAiInitialPrompt(prompt);
    setActiveTab('buddhist-ai');
    scrollReaderToTop('smooth');
  }, []);

  const handleSelectSuggestion = (item: SearchSuggestionItem) => {
    setMobileCatalogOpen(false);
    setQrListenBanner(null);

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

  const showBottomAudioBar = Boolean(
    effectiveAudioEntry &&
      (playbackState.isPlaying ||
        (activeTab !== 'buddhist-ai' &&
          effectiveAudioEntry.verses.length > 0 &&
          !isClassicalChineseOnlyEntry(effectiveAudioEntry)))
  );

  return (
    <div className="app-shell">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchScope={searchScope}
        onSearchScopeChange={setSearchScope}
        allEntries={allEntries}
        onSelectSuggestion={handleSelectSuggestion}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onSelectCanonScripture={handleOpenCanonScriptureInReader}
        onAskAiWithQuery={(q) => {
          sanskritAudioEngine.stop();
          setAiInitialPrompt(q);
          setActiveTab('buddhist-ai');
          scrollReaderToTop('smooth');
        }}
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
          {pendingDeepLink && !corpusHydrated && (
            <div className="qr-listen-landing-banner" role="status">
              <div className="qr-listen-banner-main">
                <Loader2 size={18} className="spin-icon" color="var(--accent-vermilion)" />
                <span>正在为您定位扫码陀罗尼并加载 48,000 Hz 神经梵音数据...</span>
              </div>
            </div>
          )}

          {qrListenBanner &&
            activeEntry &&
            activeEntry.verses.length > 0 &&
            qrListenBanner.entryId === activeEntry.id && (
              <div className="qr-listen-landing-banner" role="region" aria-label="二维码扫码音频直达">
                <div className="qr-listen-banner-main">
                  <span className="qr-listen-badge">
                    <Volume2 size={14} />
                    <span>扫码聆听直达</span>
                  </span>
                  <div className="qr-listen-text">
                    <strong>《{activeEntry.titleZh}》</strong>
                    <span>
                      {qrListenBanner.singleVerse
                        ? `第 ${String(qrListenBanner.startVerseIndex + 1).padStart(2, '0')} 句精读`
                        : qrListenBanner.startVerseIndex > 0
                        ? `自第 ${String(qrListenBanner.startVerseIndex + 1).padStart(2, '0')} 句起跟诵`
                        : `全咒共 ${activeEntry.verses.length} 句 · 48kHz 梵音持诵`}
                    </span>
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
                      <span>
                        {playbackState.isLoadingAudio ? '正在加载梵音 · 停止' : '正在播放 · 点击停止'}
                      </span>
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
                      <span>立即聆听梵音</span>
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
                    <span>生成分享图</span>
                  </button>

                  <button
                    type="button"
                    className="qr-listen-close-btn"
                    onClick={() => setQrListenBanner(null)}
                    aria-label="关闭扫码提示条"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            )}

          {activeTab === 'buddhist-ai' && (
            <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>正在加载 MITRA-Qwen3.5 佛经微调大模型与全藏检索工作台...</div>}>
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
                    <span>选经典 · {filteredEntries.length + sidebarCanonHits.length}部</span>
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
                    <span>
                      {activeEntry.verses.length > 0
                        ? `本篇导览 · ${activeEntry.verses.length}句`
                        : '本篇原文导览'}
                    </span>
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
                onRequestShare={(entryToShare, verseIdx) =>
                  handleOpenShareModal(entryToShare, verseIdx ?? null)
                }
                onAskBuddhistAi={handleAskBuddhistAiFromReader}
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
