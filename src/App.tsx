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
import { TaishoCanonExplorer } from './components/catalog/TaishoCanonExplorer';
import { SanskritPhoneticsAcademy } from './components/guide/SanskritPhoneticsAcademy';
import { CustomDharaniCompiler } from './components/extensibility/CustomDharaniCompiler';

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

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadTheme());
  const [activeTab, setActiveTab] = useState<ActiveWorkspaceTab>('canon-reader');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DharaniCategoryId | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'cbeta-siddham' | 'gretil-sanskrit'>('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);

  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => loadBookmarks());
  const [customEntries, setCustomEntries] = useState<DharaniEntry[]>(() => loadCustomDharanis());
  const [scriptConfig, setScriptConfig] = useState<ScriptVisibilityConfig>(() => loadScriptConfig());
  const [selectedTaishoScriptureId, setSelectedTaishoScriptureId] = useState<string | null>(null);

  const allEntries = useMemo(
    () => [...customEntries, ...BUILTIN_DHARANI_CORPUS],
    [customEntries]
  );

  const filteredEntries = useMemo(
    () =>
      filterDharanis(allEntries, {
        query: searchQuery,
        categoryId: selectedCategory,
        onlyBookmarked,
        bookmarkedIds,
        sourceFilter,
      }),
    [allEntries, searchQuery, selectedCategory, onlyBookmarked, bookmarkedIds, sourceFilter]
  );

  const [selectedEntryId, setSelectedEntryId] = useState<string>(
    BUILTIN_DHARANI_CORPUS[0]?.id || ''
  );

  const activeEntry = useMemo(() => {
    const foundInAll = allEntries.find((e) => e.id === selectedEntryId);
    if (foundInAll) return foundInAll;
    return filteredEntries[0] || allEntries[0];
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
    mode: 'studio-vocal-chant',
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

  const handleSelectEntry = (id: string, matchedVerseId?: string) => {
    sanskritAudioEngine.stop();
    setSelectedCategory('all');
    setSourceFilter('all');
    setOnlyBookmarked(false);
    setSelectedEntryId(id);
    setActiveTab('canon-reader');

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
      handleSelectEntry(item.entry.id, item.matchedVerseId);
    }
  };

  return (
    <div className="app-shell">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        allEntries={allEntries}
        onSelectSuggestion={handleSelectSuggestion}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <div className="workspace-container">
        {activeTab === 'canon-reader' && activeEntry && (
          <div className="canon-reader-grid">
            <SidebarFilter
              entries={filteredEntries}
              totalCorpusCount={allEntries.length}
              selectedId={activeEntry.id}
              onSelectEntry={(id) => handleSelectEntry(id)}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              sourceFilter={sourceFilter}
              onSourceFilterChange={setSourceFilter}
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
            />
          </div>
        )}

        {activeTab === 'taisho-explorer' && (
          <TaishoCanonExplorer initialScriptureId={selectedTaishoScriptureId} />
        )}

        {activeTab === 'phonetics-academy' && (
          <SanskritPhoneticsAcademy
            onPlaySyllable={(iastSyl) => sanskritAudioEngine.playSingleSyllable(iastSyl)}
          />
        )}

        {activeTab === 'custom-compiler' && (
          <CustomDharaniCompiler
            customEntries={customEntries}
            onAddCustomEntry={handleAddCustomEntry}
            onDeleteCustomEntry={handleDeleteCustomEntry}
            onSelectEntryInReader={(id) => handleSelectEntry(id)}
            onPlaySyllable={(iastSyl) => sanskritAudioEngine.playSingleSyllable(iastSyl)}
          />
        )}

        {activeTab === 'interlinear' && (
          <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>正在加载房山石经与 T54 对音语料库...</div>}>
            <FangshanTaishoInterlinearStudio />
          </Suspense>
        )}

        {activeTab === 'hub' && (
          <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>正在加载全球 12 大梵典数据库模块...</div>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <DatabaseHubExplorer />
              <ConcordanceParallelStudio />
              <CudlPalmLeafViewer />
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
