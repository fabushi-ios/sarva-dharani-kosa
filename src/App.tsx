import React, { useState, useMemo, useEffect } from 'react';
import { BASELINE_CURATED_DHARANIS } from './data/corpus';
import { GRETIL_CANON_DHARANIS } from './data/corpus/gretil-canon-adapter';
import { UNIFIED_12_DATABASES } from './data/unifiedCorpusRegistry';
import type { DharaniItem } from './types/dharani';
import {
  loadFavorites,
  saveFavorites,
  loadDisplayLayers,
  saveDisplayLayers,
  loadCustomDharanis,
  saveCustomDharanis,
  type DisplayLayerSettings
} from './services/storageService';
import { Header, type ActiveViewTab } from './components/layout/Header';
import { SidebarFilter, type FilterCategory } from './components/layout/SidebarFilter';
import { DharaniReader } from './components/reader/DharaniReader';
import { TaishoCanonExplorer } from './components/catalog/TaishoCanonExplorer';
import { SanskritPhoneticsAcademy } from './components/guide/SanskritPhoneticsAcademy';
import { CustomDharaniCompiler } from './components/extensibility/CustomDharaniCompiler';
import { FangshanTaishoInterlinearStudio } from './components/FangshanTaishoInterlinearStudio';
import { DatabaseHubExplorer } from './components/DatabaseHubExplorer';
import { ConcordanceParallelStudio } from './components/ConcordanceParallelStudio';
import { CudlPalmLeafViewer } from './components/CudlPalmLeafViewer';
import { AudioPlayerBar } from './components/AudioPlayerBar';

function matchesEntrySearch(entry: DharaniItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (
    entry.titleZh.toLowerCase().includes(q) ||
    entry.shortTitleZh.toLowerCase().includes(q) ||
    entry.titleSanskrit.toLowerCase().includes(q) ||
    entry.titleDevanagari.toLowerCase().includes(q) ||
    entry.titleSiddham.toLowerCase().includes(q) ||
    entry.titleEn.toLowerCase().includes(q) ||
    entry.deity.toLowerCase().includes(q) ||
    entry.taishoId.toLowerCase().includes(q) ||
    entry.translator.toLowerCase().includes(q) ||
    entry.summaryZh.toLowerCase().includes(q) ||
    entry.ritualBenefits.toLowerCase().includes(q) ||
    entry.authoritativeSource.cbetaXmlId.toLowerCase().includes(q)
  ) {
    return true;
  }
  return entry.verses.some(
    (v) =>
      v.iast.toLowerCase().includes(q) ||
      v.devanagari.toLowerCase().includes(q) ||
      v.tangChinese.toLowerCase().includes(q) ||
      v.meaningZh.toLowerCase().includes(q)
  );
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveViewTab>('reader');
  const [customEntries, setCustomEntries] = useState<DharaniItem[]>(() => loadCustomDharanis());
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites());
  const [layers, setLayers] = useState<DisplayLayerSettings>(() => loadDisplayLayers());

  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string>('usnisavijaya-dharani');

  // 合并权威典藏 (28部核心陀罗尼 + 25部哥廷根 GRETIL 梵本) 与用户自定义编译的陀罗尼
  const allEntries = useMemo(
    () => [...BASELINE_CURATED_DHARANIS, ...GRETIL_CANON_DHARANIS, ...customEntries],
    [customEntries]
  );

  // 计算各分类条目数
  const countsByCategory = useMemo<Record<FilterCategory, number>>(() => {
    const counts: Record<FilterCategory, number> = {
      all: allEntries.length,
      'major-dharanis': 0,
      'ten-small-dharanis': 0,
      'buddhas-bodhisattvas': 0,
      'gretil-editions': 0,
      custom: 0
    };
    for (const e of allEntries) {
      if (counts[e.category] !== undefined) {
        counts[e.category] += 1;
      }
      if (favorites.includes(e.id) && e.category !== 'custom') {
        counts.custom += 1;
      }
    }
    return counts;
  }, [allEntries, favorites]);

  // 过滤与多维检索
  const filteredEntries = useMemo(() => {
    return allEntries.filter((entry) => {
      if (selectedCategory === 'custom') {
        const isFavOrCustom = entry.category === 'custom' || favorites.includes(entry.id);
        if (!isFavOrCustom) return false;
      } else if (selectedCategory !== 'all' && entry.category !== selectedCategory) {
        return false;
      }
      return matchesEntrySearch(entry, searchQuery);
    });
  }, [allEntries, selectedCategory, searchQuery, favorites]);

  const currentEntry = useMemo(() => {
    return (
      allEntries.find((e) => e.id === selectedId) ||
      filteredEntries[0] ||
      allEntries[0]
    );
  }, [allEntries, filteredEntries, selectedId]);

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  useEffect(() => {
    saveDisplayLayers(layers);
  }, [layers]);

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSaveCustomDharani = (newEntry: DharaniItem) => {
    const updated = [newEntry, ...customEntries];
    setCustomEntries(updated);
    saveCustomDharanis(updated);
  };

  const handleSelectCompiledEntry = (id: string) => {
    setSelectedId(id);
    setActiveTab('reader');
  };

  return (
    <div className="sdk-app">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        totalCount={allEntries.length}
        favoritesCount={favorites.length}
        customCount={customEntries.length}
      />

      <main className="sdk-main-container">
        {activeTab === 'reader' && (
          <div className="sdk-workspace-layout">
            <SidebarFilter
              entries={filteredEntries}
              selectedId={currentEntry.id}
              onSelectEntry={setSelectedId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              countsByCategory={countsByCategory}
            />
            <DharaniReader
              entry={currentEntry}
              layers={layers}
              onUpdateLayers={setLayers}
            />
          </div>
        )}

        {activeTab === 'taisho-explorer' && <TaishoCanonExplorer />}

        {activeTab === 'phonetics-academy' && <SanskritPhoneticsAcademy />}

        {activeTab === 'custom-compiler' && (
          <CustomDharaniCompiler
            customEntries={customEntries}
            onSaveCustomDharani={handleSaveCustomDharani}
            onSelectCompiledEntry={handleSelectCompiledEntry}
          />
        )}

        {activeTab === 'interlinear' && <FangshanTaishoInterlinearStudio />}

        {activeTab === 'hub' && (
          <div>
            <DatabaseHubExplorer />
            <div style={{ marginTop: '1.5rem' }}>
              <ConcordanceParallelStudio />
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <CudlPalmLeafViewer />
            </div>
          </div>
        )}
      </main>

      <AudioPlayerBar />

      <footer className="sdk-footer">
        <div className="sdk-footer-inner">
          <div>
            <strong>梵音宝典 · Sarva-Dhāraṇī-Kośa</strong> — 汉传与梵传密教陀罗尼多体文字对勘、悉昙声明学与 48kHz 原生梵文神经网络 VITS 声学合成系统
          </div>
          <div className="sdk-footer-links">
            <span>权威数据源：CBETA XML-P5 (T18–T21 密教部 614部)</span>
            <span>·</span>
            <span>Göttingen GRETIL 梵文佛典库 (25部写本)</span>
            <span>·</span>
            <span>cbeta_sanskrit.json (2,240 悉昙字码映射)</span>
            <span>·</span>
            <span>136.1Hz 宇宙音 Om 声学共振引擎</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            全球12大权威数据库索引：{UNIFIED_12_DATABASES.map((db) => db.id).join(' · ')}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
