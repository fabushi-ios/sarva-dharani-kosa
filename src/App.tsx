import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { SidebarFilter } from './components/layout/SidebarFilter';
import { DharaniReader } from './components/reader/DharaniReader';
import { TaishoCanonExplorer } from './components/catalog/TaishoCanonExplorer';
import { SanskritPhoneticsAcademy } from './components/guide/SanskritPhoneticsAcademy';
import { CustomDharaniCompiler } from './components/extensibility/CustomDharaniCompiler';
import { ALL_DHARANIS } from './data/corpus';
import { filterDharanis } from './core/searchEngine';
import {
  ActiveTabView,
  DharaniCategoryId,
  DharaniEntry,
  DisplayLayerSettings
} from './types/dharani';
import {
  loadCustomDharanis,
  saveCustomDharanis,
  loadFavorites,
  saveFavorites,
  loadDisplayLayers,
  saveDisplayLayers
} from './services/storageService';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTabView>('reader');
  const [customDharanis, setCustomDharanis] = useState<DharaniEntry[]>(() => loadCustomDharanis());
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites());
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [layers, setLayers] = useState<DisplayLayerSettings>(() => loadDisplayLayers());
  const [selectedCategory, setSelectedCategory] = useState<DharaniCategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allEntries = useMemo(
    () => [...customDharanis, ...ALL_DHARANIS],
    [customDharanis]
  );

  const filteredEntries = useMemo(
    () => filterDharanis(allEntries, selectedCategory, searchQuery),
    [allEntries, selectedCategory, searchQuery]
  );

  const [selectedDharaniId, setSelectedDharaniId] = useState<string>(
    () => allEntries[0]?.id || 'usnisa-vijaya'
  );

  const selectedEntry = useMemo(
    () => allEntries.find(e => e.id === selectedDharaniId) || allEntries[0],
    [allEntries, selectedDharaniId]
  );

  useEffect(() => {
    if (!allEntries.some(e => e.id === selectedDharaniId) && allEntries.length > 0) {
      setSelectedDharaniId(allEntries[0].id);
    }
  }, [allEntries, selectedDharaniId]);

  const handleToggleLayer = (key: keyof DisplayLayerSettings) => {
    setLayers(prev => {
      const next = { ...prev, [key]: !prev[key] };
      saveDisplayLayers(next);
      return next;
    });
  };

  const handleToggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      saveFavorites(next);
      return next;
    });
  };

  const handleSaveCustom = (entry: DharaniEntry) => {
    const updated = [entry, ...customDharanis];
    setCustomDharanis(updated);
    saveCustomDharanis(updated);
    setSelectedDharaniId(entry.id);
  };

  const handleRemoveCustom = (id: string) => {
    const updated = customDharanis.filter(x => x.id !== id);
    setCustomDharanis(updated);
    saveCustomDharanis(updated);
  };

  return (
    <div className="sdk-app">
      <Header activeTab={activeTab} onSelectTab={setActiveTab} />

      <main className="sdk-main-container">
        {activeTab === 'reader' && selectedEntry && (
          <div className="sdk-workspace-layout">
            <SidebarFilter
              entries={allEntries}
              filteredEntries={filteredEntries}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedDharaniId={selectedEntry.id}
              onSelectDharani={id => setSelectedDharaniId(id)}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onlyFavorites={onlyFavorites}
              onToggleOnlyFavorites={() => setOnlyFavorites(v => !v)}
            />
            <DharaniReader
              entry={selectedEntry}
              layers={layers}
              onToggleLayer={handleToggleLayer}
              isFavorite={favorites.includes(selectedEntry.id)}
              onToggleFavorite={() => handleToggleFavorite(selectedEntry.id)}
            />
          </div>
        )}

        {activeTab === 'taisho-explorer' && <TaishoCanonExplorer />}

        {activeTab === 'phonetics-academy' && <SanskritPhoneticsAcademy />}

        {activeTab === 'custom-compiler' && (
          <CustomDharaniCompiler
            customDharanis={customDharanis}
            onSaveCustomDharani={handleSaveCustom}
            onRemoveCustomDharani={handleRemoveCustom}
            onSelectDharani={id => {
              setSelectedDharaniId(id);
              setActiveTab('reader');
            }}
          />
        )}
      </main>
    </div>
  );
};
