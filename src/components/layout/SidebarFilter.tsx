import React from 'react';
import type { DharaniCategory, DharaniItem } from '../../types/dharani';
import { CURATED_SEED_SYLLABLES } from '../../data/corpus';

export type FilterCategory = 'all' | DharaniCategory;

interface SidebarFilterProps {
  entries: DharaniItem[];
  selectedId: string;
  onSelectEntry: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: FilterCategory;
  onCategoryChange: (cat: FilterCategory) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  countsByCategory: Record<FilterCategory, number>;
}

const CATEGORY_LABELS: { id: FilterCategory; label: string }[] = [
  { id: 'all', label: '全部典藏' },
  { id: 'major-dharanis', label: '四大咒与根本长咒' },
  { id: 'ten-small-dharanis', label: '十小咒全集' },
  { id: 'buddhas-bodhisattvas', label: '诸佛菩萨与五护陀罗尼' },
  { id: 'gretil-editions', label: 'GRETIL 梵文校勘本' },
  { id: 'custom', label: '自定义与收藏' }
];

function getSeedForEntry(entry: DharaniItem) {
  const deityStr = (entry.deity + ' ' + entry.titleZh).toLowerCase();
  for (const seed of CURATED_SEED_SYLLABLES) {
    if (deityStr.includes('觀音') || deityStr.includes('観音') || deityStr.includes('avalokite')) {
      return CURATED_SEED_SYLLABLES.find((s) => s.id === 'bija-hrih') || seed;
    }
    if (deityStr.includes('文殊') || deityStr.includes('mañjuśrī')) {
      return CURATED_SEED_SYLLABLES.find((s) => s.id === 'bija-dhih') || seed;
    }
    if (deityStr.includes('尊勝') || deityStr.includes('佛頂') || deityStr.includes('uṣṇīṣa')) {
      return CURATED_SEED_SYLLABLES.find((s) => s.id === 'bija-bhrum') || seed;
    }
    if (deityStr.includes('金剛') || deityStr.includes('明王') || deityStr.includes('vajra')) {
      return CURATED_SEED_SYLLABLES.find((s) => s.id === 'bija-hum') || seed;
    }
  }
  return CURATED_SEED_SYLLABLES[0];
}

export const SidebarFilter: React.FC<SidebarFilterProps> = ({
  entries,
  selectedId,
  onSelectEntry,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  favorites,
  onToggleFavorite,
  countsByCategory
}) => {
  return (
    <aside className="sdk-sidebar">
      {/* 搜索框：支持八维检索 */}
      <div className="sdk-search-box">
        <div className="sdk-search-input-wrap">
          <span className="sdk-search-icon">🔍</span>
          <input
            type="text"
            className="sdk-search-input"
            placeholder="检索经题、大正藏号(T0974B)、天城体、IAST、古音译或功德..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="sdk-search-clear"
              onClick={() => onSearchChange('')}
              title="清空搜索"
            >
              ✕
            </button>
          )}
        </div>
        <div className="sdk-search-hint">
          支持：中文经名 · 悉昙 · 天城文 · IAST · 唐代音译 · 梵文字根 · 大正藏编号
        </div>
      </div>

      {/* 分类标签页 */}
      <div className="sdk-cat-tabs">
        {CATEGORY_LABELS.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`sdk-cat-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => onCategoryChange(cat.id)}
          >
            <span>{cat.label}</span>
            <span className="sdk-cat-count">{countsByCategory[cat.id] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* 经典列表 */}
      <div className="sdk-entry-list">
        {entries.length === 0 ? (
          <div className="sdk-empty-list">
            <p>未找到匹配的陀罗尼真言条目。</p>
            <p className="sdk-empty-sub">
              您可切换至「梵音100%全覆盖编译器」输入任意梵文咒语自动生成四体对照与发音。
            </p>
          </div>
        ) : (
          entries.map((entry) => {
            const isSelected = entry.id === selectedId;
            const isFav = favorites.includes(entry.id);
            const seed = getSeedForEntry(entry);
            return (
              <div
                key={entry.id}
                className={`sdk-entry-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectEntry(entry.id)}
              >
                <div className="sdk-entry-card-top">
                  <span className="sdk-seed-badge" title={`种子字 ${seed?.iast || 'oṃ'}`}>
                    {seed?.siddham || '𑖼'}
                  </span>
                  <div className="sdk-entry-titles">
                    <h3 className="sdk-entry-zh">{entry.titleZh}</h3>
                    <p className="sdk-entry-sa">{entry.titleSanskrit}</p>
                  </div>
                  <button
                    type="button"
                    className={`sdk-fav-btn ${isFav ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(entry.id);
                    }}
                    title={isFav ? '取消收藏' : '加入常用功课收藏'}
                  >
                    {isFav ? '★' : '☆'}
                  </button>
                </div>

                <div className="sdk-entry-meta">
                  <span className="sdk-taisho-tag">
                    {entry.authoritativeSource.cbetaXmlId || entry.taishoId}
                  </span>
                  <span className="sdk-deity-tag">{entry.deity.split('(')[0].trim()}</span>
                  {entry.authoritativeSource.gretilId && (
                    <span className="sdk-provenance-mini-tag" title="GRETIL 梵文底本对勘">
                      GRETIL
                    </span>
                  )}
                  {entry.cbetaInterlinearXmlId && (
                    <span className="sdk-provenance-mini-tag" title="含 CBETA <cb:tt> 悉昙梵汉逐字对音">
                      悉昙对音
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
