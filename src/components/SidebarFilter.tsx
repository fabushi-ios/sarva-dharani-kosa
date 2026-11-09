/**
 * Sidebar Corpus Filter, Cross-Script Search & 10-Layer Display Toggle Panel
 * (`src/components/SidebarFilter.tsx`)
 */

import React from 'react';
import {
  DharaniCategory,
  DharaniEntry,
  DisplayLayerConfig,
} from '../types/dharani';

interface SidebarFilterProps {
  entries: DharaniEntry[];
  selectedEntryId: string;
  onSelectEntry: (entry: DharaniEntry) => void;
  selectedCategory: DharaniCategory;
  onSelectCategory: (cat: DharaniCategory) => void;
  searchQuery: string;
  onChangeSearchQuery: (q: string) => void;
  onlyBookmarks: boolean;
  onToggleOnlyBookmarks: () => void;
  bookmarkedIds: Set<string>;
  layers: DisplayLayerConfig;
  onToggleLayer: (key: keyof DisplayLayerConfig) => void;
}

const CATEGORIES: Array<{ id: DharaniCategory; label: string; badge: string }> = [
  { id: 'all', label: '全部陀罗尼总集', badge: 'All' },
  { id: 'four-great', label: '四大咒暨般若根本咒', badge: '四大咒' },
  { id: 'ten-small', label: '十小咒全集 (早课)', badge: '十小咒' },
  { id: 'buddhas-bodhisattvas', label: '诸佛菩萨·明王种子心咒', badge: '本尊部' },
  { id: 'gretil-manuscripts', label: 'GRETIL 梵文贝叶经定本', badge: '梵本库' },
  { id: 'custom', label: '自定义编译真言', badge: '自建' },
];

const LAYER_LABELS: Array<{ key: keyof DisplayLayerConfig; label: string; desc: string }> = [
  { key: 'siddham', label: '1. 悉昙梵字 (Siddhaṃ)', desc: 'U+11580 唐传悉昙真言体' },
  { key: 'devanagari', label: '2. 天城体梵文 (Devanāgarī)', desc: '古典梵文标准天城体' },
  { key: 'iast', label: '3. 国际梵文转写 (IAST)', desc: '学术标准罗马字母转写' },
  { key: 'slp1', label: '4. 声学无损编码 (SLP1)', desc: '单字符音素映射键' },
  { key: 'ipa', label: '5. 国际音标 (IPA)', desc: '严式国际音标发音标注' },
  { key: 'modernChinese', label: '6. 现代声学谐音助读', desc: '区分清浊送气与同化鼻音' },
  { key: 'tangSiddham', label: '7. 唐宋古音译与夹注', desc: '玄奘/不空三藏原典对音' },
  { key: 'chandasMeter', label: '8. 声明学轻重音律', desc: 'Guru (— 2拍) / Laghu (⏑ 1拍)' },
  { key: 'wordGloss', label: '9. 逐词语法与词根解析', desc: '梵文八格词形变化与词义' },
  { key: 'chineseMeaning', label: '10. 汉英经文意译', desc: '原典注疏与现代佛学意译' },
];

export const SidebarFilter: React.FC<SidebarFilterProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onChangeSearchQuery,
  onlyBookmarks,
  onToggleOnlyBookmarks,
  bookmarkedIds,
  layers,
  onToggleLayer,
}) => {
  return (
    <aside className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
      {/* Search & Category Filter Card */}
      <div className="rounded-xl border border-stone-800 bg-stone-900/80 p-3.5 shadow-lg">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            跨文种检索引擎
          </h2>
          <button
            type="button"
            onClick={onToggleOnlyBookmarks}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition ${
              onlyBookmarks
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            ★ 仅看收藏 ({bookmarkedIds.size})
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onChangeSearchQuery(e.target.value)}
          placeholder="搜索咒名 / IAST / 天城体 / 悉昙 / 大正藏经号..."
          className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:border-amber-500 focus:outline-none"
        />

        {/* Category Pills */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  active
                    ? 'bg-amber-500 text-stone-950 font-semibold'
                    : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scripture List */}
      <div className="max-h-[420px] overflow-y-auto rounded-xl border border-stone-800 bg-stone-900/80 p-2 shadow-lg">
        <div className="mb-1.5 px-2 py-1 text-[11px] font-medium text-stone-400">
          匹配经咒条目 ({entries.length} 部)
        </div>
        <div className="space-y-1">
          {entries.map((entry) => {
            const isSelected = entry.id === selectedEntryId;
            const isBookmarked = bookmarkedIds.has(entry.id);
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onSelectEntry(entry)}
                className={`w-full rounded-lg p-2.5 text-left transition ${
                  isSelected
                    ? 'border border-amber-500/50 bg-amber-500/15 text-amber-100'
                    : 'border border-transparent hover:bg-stone-800/70 text-stone-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-serif-cn text-xs font-semibold leading-snug">
                    {entry.titleZh}
                  </span>
                  {isBookmarked && <span className="text-xs text-amber-400">★</span>}
                </div>
                <div className="mt-1 truncate text-[11px] text-stone-400 font-mono">
                  {entry.titleSanskrit}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-stone-400">
                  <span className="rounded bg-stone-800 px-1.5 py-0.5 text-amber-300/90">
                    {entry.sourceMetadata.taishoId}
                  </span>
                  {entry.sourceMetadata.gretilId && (
                    <span className="rounded bg-emerald-950/80 px-1.5 py-0.5 text-emerald-300">
                      GRETIL {entry.sourceMetadata.gretilId}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 10-Layer Synchronized Display Controller */}
      <div className="rounded-xl border border-stone-800 bg-stone-900/80 p-3.5 shadow-lg">
        <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
          十维同步对照层开关 (10 Display Layers)
        </h3>
        <div className="space-y-1.5">
          {LAYER_LABELS.map((item) => (
            <label
              key={item.key}
              className="flex cursor-pointer items-center justify-between rounded-lg border border-stone-800/70 bg-stone-950/60 px-2.5 py-1.5 text-xs hover:border-stone-700"
            >
              <div>
                <div className="font-medium text-stone-200">{item.label}</div>
                <div className="text-[10px] text-stone-400">{item.desc}</div>
              </div>
              <input
                type="checkbox"
                checked={layers[item.key]}
                onChange={() => onToggleLayer(item.key)}
                className="h-4 w-4 rounded border-stone-600 accent-amber-500"
              />
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default SidebarFilter;
