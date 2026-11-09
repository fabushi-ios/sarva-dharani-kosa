/**
 * 左侧分类检索与目录导航栏 (src/components/layout/SidebarFilter.tsx)
 */

import React from 'react';
import { Search, Star, BookMarked } from 'lucide-react';
import { DharaniCategoryId, DharaniEntry } from '../../types/dharani';
import { DHARANI_CATEGORIES } from '../../data/corpus';

interface SidebarFilterProps {
  entries: DharaniEntry[];
  filteredEntries: DharaniEntry[];
  selectedCategory: DharaniCategoryId;
  onSelectCategory: (cat: DharaniCategoryId) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedDharaniId: string;
  onSelectDharani: (id: string) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onlyFavorites: boolean;
  onToggleOnlyFavorites: () => void;
}

export const SidebarFilter: React.FC<SidebarFilterProps> = ({
  entries,
  filteredEntries,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  selectedDharaniId,
  onSelectDharani,
  favorites,
  onToggleFavorite,
  onlyFavorites,
  onToggleOnlyFavorites
}) => {
  const displayedList = onlyFavorites
    ? filteredEntries.filter(e => favorites.includes(e.id))
    : filteredEntries;

  return (
    <aside className="sdk-sidebar">
      <div className="sdk-search-box">
        <div className="sdk-search-input-wrap">
          <Search size={15} className="sdk-search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="检索经名/经号/IAST/梵音 (如 T19n0974B, gate, 大悲)..."
            className="sdk-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="sdk-search-clear"
            >
              ✕
            </button>
          )}
        </div>
        <div className="sdk-filter-StatusBar">
          <span>
            共收录 <strong>{entries.length}</strong> 部梵本陀罗尼 · 当前匹配{' '}
            <strong>{displayedList.length}</strong> 部
          </span>
          <button
            type="button"
            onClick={onToggleOnlyFavorites}
            className={`sdk-fav-filter-btn ${onlyFavorites ? 'active' : ''}`}
          >
            <Star size={12} fill={onlyFavorites ? 'currentColor' : 'none'} />
            收藏 ({favorites.length})
          </button>
        </div>
      </div>

      <div className="sdk-category-list">
        {DHARANI_CATEGORIES.map(cat => {
          const count =
            cat.id === 'all'
              ? entries.length
              : entries.filter(e => e.category === cat.id).length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`sdk-cat-chip ${selectedCategory === cat.id ? 'active' : ''}`}
              title={cat.description}
            >
              <span>{cat.labelZh}</span>
              <span className="sdk-cat-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="sdk-entry-list">
        {displayedList.map(entry => {
          const isSelected = entry.id === selectedDharaniId;
          const isFav = favorites.includes(entry.id);
          return (
            <div
              key={entry.id}
              onClick={() => onSelectDharani(entry.id)}
              className={`sdk-entry-card ${isSelected ? 'selected' : ''}`}
            >
              <div className="sdk-entry-card-header">
                <div className="sdk-entry-seed">
                  <span className="siddham-text">{entry.seedSyllableSiddham}</span>
                </div>
                <div className="sdk-entry-titles">
                  <div className="sdk-entry-title-zh">{entry.titleZh}</div>
                  <div className="sdk-entry-title-sa">{entry.titleSaIast}</div>
                </div>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onToggleFavorite(entry.id);
                  }}
                  className={`sdk-fav-star ${isFav ? 'fav-active' : ''}`}
                  title={isFav ? '取消收藏' : '加入收藏'}
                >
                  <Star size={14} fill={isFav ? 'currentColor' : 'none'} />
                </button>
              </div>
              <div className="sdk-entry-meta-row">
                <span className="sdk-meta-tag">
                  <BookMarked size={11} />
                  {entry.sourceMeta.cbetaXmlId}
                </span>
                {entry.sourceMeta.gretilId && (
                  <span className="sdk-meta-tag sdk-meta-gretil">
                    GRETIL: {entry.sourceMeta.gretilId}
                  </span>
                )}
                <span className="sdk-meta-verses">{entry.verses.length} 分段</span>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
