import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import type {
  ActiveWorkspaceTab,
  DharaniCategoryId,
  DharaniEntry,
  ScriptVisibilityConfig,
} from './types/kosaTypes';
import { BUILTIN_DHARANI_CORPUS } from './data';
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
import { SidebarFilter } from './components/layout/SidebarFilter';
import { DharaniReader } from './components/reader/DharaniReader';
import { AudioPlayerBar } from './components/audio/AudioPlayerBar';

const TaishoCanonExplorer = lazy(() =>
  import('./components/catalog/TaishoCanonExplorer').then((m) => ({
    default: m.TaishoCanonExplorer,
  }))
);
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

  const allEntries = useMemo(
    () => [...customEntries, ...BUILTIN_DHARANI_CORPUS],
    [customEntries]
  );

  const filteredEntries = useMemo(() => {
    const base = filterDharanis(allEntries, {
      query: searchQuery,
      categoryId: selectedCategory,
      onlyBookmarked,
      bookmarkedIds,
      sourceFilter,
    });
    if (sourceFilter === 'global-12db' && selectedDbSubFilter !== 'all') {
      return base.filter((e) => e.provenance.databaseId === selectedDbSubFilter);
    }
    return base;
  }, [
    allEntries,
    searchQuery,
    selectedCategory,
    onlyBookmarked,
    bookmarkedIds,
    sourceFilter,
    selectedDbSubFilter,
  ]);

  const [selectedEntryId, setSelectedEntryId] = useState<string>(
    BUILTIN_DHARANI_CORPUS[0]?.id || ''
  );

  const activeEntry = useMemo(() => {
    const foundInFiltered = filteredEntries.find((e) => e.id === selectedEntryId);
    if (foundInFiltered) return foundInFiltered;
    if (filteredEntries.length > 0) return filteredEntries[0];
    const foundInAll = allEntries.find((e) => e.id === selectedEntryId);
    return foundInAll || allEntries[0];
  }, [allEntries, filteredEntries, selectedEntryId]);

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

  const handleTabChange = (tab: ActiveWorkspaceTab) => {
    sanskritAudioEngine.stop();
    setActiveTab(tab);

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
        const el = document.getElementById(`verse-card-${matchedVerseId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 120);
    }
  };

  const handleSelectSuggestion = (item: SearchSuggestionItem) => {
    if (item.kind === 'taisho-scripture' && item.taishoScriptureId) {
      sanskritAudioEngine.stop();
      setSelectedTaishoScriptureId(item.taishoScriptureId);
      setActiveTab('taisho-explorer');
      return;
    }
    if (item.entry) {
      setSelectedCategory('all');
      setSourceFilter('all');
      setSelectedDbSubFilter('all');
      setOnlyBookmarked(false);
      setSelectedEntryId(item.entry.id);
      setActiveTab('canon-reader');
      if (item.matchedVerseId) {
        setTimeout(() => {
          const el = document.getElementById(`verse-card-${item.matchedVerseId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 120);
      }
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
      />

      <div className="workspace-container">
        {activeTab === 'hub' && (
          <Suspense fallback={<div style={{ padding: '1rem', textAlign: 'center' }}>正在加载全球 12 大梵典数据库导航...</div>}>
            <div style={{ marginBottom: '1.25rem' }}>
              <DatabaseHubExplorer
                activeAdapterDbId={selectedDbSubFilter}
                onSelectAdapterDbId={handleSelectAdapterDbId}
              />
            </div>
          </Suspense>
        )}

        {isUnifiedReaderTab && activeEntry && (
          <div className="canon-reader-grid">
            <SidebarFilter
              entries={filteredEntries}
              totalCorpusCount={allEntries.length}
              selectedId={activeEntry.id}
              onSelectEntry={(id) => handleSelectEntry(id)}
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
              onSelectDbSubFilter={handleSelectAdapterDbId}
              onlyBookmarked={onlyBookmarked}
              onToggleOnlyBookmarked={() => setOnlyBookmarked((b) => !b)}
              bookmarkedIds={bookmarkedIds}
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
            />
          </div>
        )}

        {activeTab === 'interlinear' && (
          <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>正在加载房山石经与 T54 对音语料库...</div>}>
            <details style={{ marginTop: '1.5rem' }}>
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
            <details style={{ marginTop: '1.5rem' }}>
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
            <details style={{ marginTop: '1.5rem' }}>
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
            />
          </Suspense>
        )}

        {activeTab === 'phonetics-academy' && (
          <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>正在加载悉昙十八章与牛津 OCHS 种子字辞典...</div>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <SiddhamBijaAcademy />
              <SanskritPhoneticsAcademy
                onPlaySyllable={(iastSyl) => sanskritAudioEngine.playSingleSyllable(iastSyl)}
              />
            </div>
          </Suspense>
        )}

        {activeTab === 'custom-compiler' && (
          <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>正在加载四行谱发音引擎与梵文编译器...</div>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <section className="dharani-hero-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h2 className="hero-title-zh" style={{ fontSize: '1.25rem' }}>
                      梵语悉昙四行谱发音引擎与 34×14 摩多矩阵工作台 v3.0 (48,000 Hz Neural VITS)
                    </h2>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      集成 IIT Madras Rasa 古典梵语男/女声 ONNX VITS (48kHz) + 612音节 Siddhaṃ Audio Sprite + 136.1Hz 共振峰合成器 + 四行对位总谱与 34×14 摩多矩阵点读。
                    </p>
                  </div>
                  <a
                    href="/sanskrit_phonetic_engine.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-scholarly primary"
                    style={{ textDecoration: 'none' }}
                  >
                    <span>新窗口全屏打开独立版发音引擎 v3.0 ↗</span>
                  </a>
                </div>
                <iframe
                  src="/sanskrit_phonetic_engine.html"
                  title="梵语悉昙四行谱发音引擎 v3.0"
                  style={{
                    width: '100%',
                    height: '760px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    background: '#0f1420',
                  }}
                />
              </section>

              <CustomDharaniCompiler
                customEntries={customEntries}
                onAddCustomEntry={handleAddCustomEntry}
                onDeleteCustomEntry={handleDeleteCustomEntry}
                onSelectEntryInReader={(id) => handleSelectEntry(id)}
                onPlaySyllable={(iastSyl) => sanskritAudioEngine.playSingleSyllable(iastSyl)}
              />
            </div>
          </Suspense>
        )}
      </div>

      {activeEntry && (
        <AudioPlayerBar
          dharaniTitleZh={activeEntry.titleZh}
          playbackState={playbackState}
          onPlayAll={() => sanskritAudioEngine.playVerses(activeEntry.verses, 0, false)}
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
