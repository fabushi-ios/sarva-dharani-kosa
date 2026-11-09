/**
 * Root Application Shell for 梵音宝典 · Sarva-Dhāraṇī-Kośa (`src/App.tsx`)
 * Integrates:
 * 1. `reader`: 10-Layer Synchronized Dhāraṇī Reader (`DharaniReader` + `SidebarFilter` + `AuthoritativeSourceModal`)
 * 2. `academy`: 16 Svaras + 34×14 Siddhaṃ Phonetics Matrix + 28 Bīja Seed Syllables (`SanskritPhoneticsAcademy`)
 * 3. `engine-v3`: Embedded & Standalone `sanskrit_phonetic_engine.html` v3.0 Neural + 48kHz Sprite Engine
 * 4. `cbeta-taisho`: CBETA `#SD-*` Siddhaṃ-Chinese `<cb:tt>` Interlinear & Taishō `T18–T21` Explorer (`TaishoCanonExplorer`)
 * 5. `compiler`: Real-time Custom Dhāraṇī Compiler (`CustomDharaniCompiler`)
 * Plus the persistent bottom 48kHz neural `AudioPlayerBar`.
 */

import React, { useEffect, useMemo, useState } from 'react';
import AudioPlayerBar from './components/AudioPlayerBar';
import AuthoritativeSourceModal from './components/AuthoritativeSourceModal';
import CustomDharaniCompiler from './components/CustomDharaniCompiler';
import DharaniReader from './components/DharaniReader';
import Header from './components/Header';
import SanskritPhoneticsAcademy from './components/SanskritPhoneticsAcademy';
import SidebarFilter from './components/SidebarFilter';
import TaishoCanonExplorer from './components/TaishoCanonExplorer';
import { filterDharaniCorpus } from './core/searchEngine';
import { ALL_CANONICAL_DHARANIS } from './data/corpus/gretil-canon-adapter';
import sanskritAudioEngine from './services/audio/sanskritAudioEngine';
import {
  loadBookmarkedIds,
  loadCustomDharanis,
  loadDisplayLayerConfig,
  saveBookmarkedIds,
  saveCustomDharanis,
  saveDisplayLayerConfig,
} from './services/storageService';
import {
  ActiveAppView,
  AudioEngineMode,
  AudioHealthStatus,
  DharaniCategory,
  DharaniEntry,
  DisplayLayerConfig,
  NeuralVoice,
  SyllableTimingItem,
} from './types/dharani';

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveAppView>('reader');
  const [customEntries, setCustomEntries] = useState<DharaniEntry[]>(() => loadCustomDharanis());
  const allEntries = useMemo(
    () => [...ALL_CANONICAL_DHARANIS, ...customEntries],
    [customEntries]
  );

  const [selectedEntryId, setSelectedEntryId] = useState<string>(ALL_CANONICAL_DHARANIS[0].id);
  const [selectedCategory, setSelectedCategory] = useState<DharaniCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyBookmarks, setOnlyBookmarks] = useState<boolean>(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(
    () => new Set(loadBookmarkedIds())
  );
  const [layers, setLayers] = useState<DisplayLayerConfig>(() => loadDisplayLayerConfig());
  const [showSourceModal, setShowSourceModal] = useState<boolean>(false);

  // Audio Engine reactive state
  const [audioMode, setAudioMode] = useState<AudioEngineMode>(() => sanskritAudioEngine.getMode());
  const [voice, setVoice] = useState<NeuralVoice>(() => sanskritAudioEngine.getVoice());
  const [rate, setRate] = useState<number>(() => sanskritAudioEngine.getRate());
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeSylIndex, setActiveSylIndex] = useState<number>(-1);
  const [activeTimings, setActiveTimings] = useState<SyllableTimingItem[]>([]);
  const [lastSpokenTitle, setLastSpokenTitle] = useState<string>('');
  const [lastDownloadWavUrl, setLastDownloadWavUrl] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<AudioHealthStatus>(() =>
    sanskritAudioEngine.getHealthStatus()
  );

  useEffect(() => {
    const unsubscribe = sanskritAudioEngine.subscribe(() => {
      setAudioMode(sanskritAudioEngine.getMode());
      setVoice(sanskritAudioEngine.getVoice());
      setRate(sanskritAudioEngine.getRate());
      setIsPlaying(sanskritAudioEngine.isPlaying());
      setActiveSylIndex(sanskritAudioEngine.getActiveSyllableIndex());
      setActiveTimings(sanskritAudioEngine.getActiveTimings());
      setLastSpokenTitle(sanskritAudioEngine.getLastSpokenTitle());
      setLastDownloadWavUrl(sanskritAudioEngine.getLastDownloadWavUrl());
      setHealthStatus(sanskritAudioEngine.getHealthStatus());
    });

    sanskritAudioEngine.init().catch(() => {});
    return unsubscribe;
  }, []);

  const filteredEntries = useMemo(
    () =>
      filterDharaniCorpus(
        allEntries,
        selectedCategory,
        searchQuery,
        bookmarkedIds,
        onlyBookmarks
      ),
    [allEntries, selectedCategory, searchQuery, bookmarkedIds, onlyBookmarks]
  );

  const selectedEntry = useMemo(
    () =>
      allEntries.find((e) => e.id === selectedEntryId) ||
      filteredEntries[0] ||
      ALL_CANONICAL_DHARANIS[0],
    [allEntries, selectedEntryId, filteredEntries]
  );

  const handleToggleLayer = (key: keyof DisplayLayerConfig) => {
    setLayers((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveDisplayLayerConfig(next);
      return next;
    });
  };

  const handleToggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveBookmarkedIds(Array.from(next));
      return next;
    });
  };

  const handleSaveCustomEntry = (entry: DharaniEntry) => {
    setCustomEntries((prev) => {
      const next = [entry, ...prev];
      saveCustomDharanis(next);
      return next;
    });
    setSelectedEntryId(entry.id);
  };

  const handleReciteCurrent = () => {
    const fullText = selectedEntry.verses.map((v) => v.devanagari || v.iast).join(' । ');
    sanskritAudioEngine.speakText(fullText, {
      title: selectedEntry.titleZh,
    });
  };

  return (
    <div className="min-h-screen bg-stone-950 pb-24 text-stone-100">
      <Header
        activeView={activeView}
        onSelectView={setActiveView}
        audioMode={audioMode}
        onChangeAudioMode={(m) => sanskritAudioEngine.setMode(m)}
        voice={voice}
        onChangeVoice={(v) => sanskritAudioEngine.setVoice(v)}
        healthStatus={healthStatus}
      />

      <main className="mx-auto max-w-[1600px] px-4 py-6">
        {activeView === 'reader' && (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <SidebarFilter
              entries={filteredEntries}
              selectedEntryId={selectedEntry.id}
              onSelectEntry={(entry) => setSelectedEntryId(entry.id)}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchQuery={searchQuery}
              onChangeSearchQuery={setSearchQuery}
              onlyBookmarks={onlyBookmarks}
              onToggleOnlyBookmarks={() => setOnlyBookmarks((b) => !b)}
              bookmarkedIds={bookmarkedIds}
              layers={layers}
              onToggleLayer={handleToggleLayer}
            />

            <DharaniReader
              entry={selectedEntry}
              layers={layers}
              isBookmarked={bookmarkedIds.has(selectedEntry.id)}
              onToggleBookmark={handleToggleBookmark}
              onOpenSourceModal={() => setShowSourceModal(true)}
            />
          </div>
        )}

        {activeView === 'academy' && <SanskritPhoneticsAcademy />}

        {activeView === 'engine-v3' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-700/40 bg-stone-900/90 p-4">
              <div>
                <h2 className="font-serif-cn text-lg font-bold text-amber-200">
                  ⚡ 梵音 100% 全覆盖音译与发声引擎 v3.0 (Sanskrit Phonetic Engine v3.0 · 方案 1 48kHz Neural VITS)
                </h2>
                <p className="text-xs text-stone-400">
                  内嵌完整单文件版 `sanskrit_phonetic_engine.html` v3.0，支持四行对照谱导出、34×14 全矩阵弹窗及 48kHz 神经语音合成。
                </p>
              </div>
              <a
                href="/sanskrit_phonetic_engine.html"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-stone-950 hover:bg-amber-400"
              >
                ↗ 在独立窗口打开 sanskrit_phonetic_engine.html v3.0
              </a>
            </div>

            <div className="overflow-hidden rounded-2xl border border-stone-800 bg-stone-900 shadow-2xl">
              <iframe
                title="Sanskrit Phonetic Engine v3.0"
                src="/sanskrit_phonetic_engine.html"
                className="h-[82vh] w-full border-0"
              />
            </div>
          </div>
        )}

        {activeView === 'cbeta-taisho' && <TaishoCanonExplorer />}

        {activeView === 'compiler' && (
          <CustomDharaniCompiler onSaveCustomEntry={handleSaveCustomEntry} />
        )}
      </main>

      <AuthoritativeSourceModal
        entry={showSourceModal ? selectedEntry : null}
        onClose={() => setShowSourceModal(false)}
      />

      <AudioPlayerBar
        isPlaying={isPlaying}
        activeSyllableIndex={activeSylIndex}
        activeTimings={activeTimings}
        lastSpokenTitle={lastSpokenTitle}
        lastDownloadWavUrl={lastDownloadWavUrl}
        audioMode={audioMode}
        onChangeAudioMode={(m) => sanskritAudioEngine.setMode(m)}
        voice={voice}
        onChangeVoice={(v) => sanskritAudioEngine.setVoice(v)}
        rate={rate}
        onChangeRate={(r) => sanskritAudioEngine.setRate(r)}
        healthStatus={healthStatus}
        onReciteCurrentDharani={handleReciteCurrent}
      />
    </div>
  );
};

export default App;
