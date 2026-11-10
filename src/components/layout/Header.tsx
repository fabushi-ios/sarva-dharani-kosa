import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  BookOpen,
  Library,
  GraduationCap,
  Code2,
  ScrollText,
  Globe,
  Sun,
  Moon,
  ShieldCheck,
  CornerDownLeft,
} from 'lucide-react';
import type { ActiveWorkspaceTab, DharaniEntry } from '../../types/kosaTypes';
import { CORPUS_AUTHORITATIVE_STATS } from '../../data';
import { UNIFIED_12_DATABASES } from '../../data/unifiedCorpusRegistry';
import {
  getSearchSuggestions,
  type SearchSuggestionItem,
} from '../../core/search/searchEngine';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  allEntries: DharaniEntry[];
  onSelectSuggestion: (item: SearchSuggestionItem) => void;
  activeTab: ActiveWorkspaceTab;
  onTabChange: (tab: ActiveWorkspaceTab) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  allEntries,
  onSelectSuggestion,
  activeTab,
  onTabChange,
  theme,
  onToggleTheme,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(
    () => getSearchSuggestions(allEntries, searchQuery, 16),
    [allEntries, searchQuery]
  );

  useEffect(() => {
    setHighlightIndex(0);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (ev: MouseEvent) => {
      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(ev.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setDropdownOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) =>
        suggestions.length > 0 ? (prev + 1) % suggestions.length : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) =>
        suggestions.length > 0
          ? (prev - 1 + suggestions.length) % suggestions.length
          : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = suggestions[highlightIndex];
      if (target) {
        onSelectSuggestion(target);
        setDropdownOpen(false);
      }
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  };

  return (
    <>
      <header className="app-header">
        <div className="header-inner">
          <div className="brand-group">
            <div className="brand-seal siddham-glyph" title="Siddhaṃ Bīja Oṃ">
              𑖌𑖼
            </div>
            <div className="brand-titles">
              <div className="brand-title-zh">
                <span>梵音宝典 · Sarva-Dhāraṇī-Kośa</span>
                <span className="brand-badge-auth">CBETA 14,485段真言 + GRETIL 权威双源</span>
              </div>
              <div className="brand-subtitle">
                Corpus of World Sanskrit Dhāraṇīs · Siddhaṃ, Devanāgarī, IAST, Śikṣā Prosody &amp; Tang Transliteration
              </div>
            </div>
          </div>

          <div className="header-search-wrap" ref={searchWrapRef}>
            <Search size={16} className="header-search-icon" />
            <input
              id="global-dharani-search-input"
              type="search"
              autoComplete="off"
              className="header-search-input"
              placeholder="搜全库咒名(秽迹/雨宝/叶衣/大黑天/法华)、藏经号(T19n0974B)、梵文或古音译..."
              value={searchQuery}
              onFocus={() => setDropdownOpen(true)}
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setDropdownOpen(true);
              }}
            />
            {searchQuery && (
              <button
                id="clear-global-search-btn"
                type="button"
                className="header-search-clear"
                onClick={() => {
                  onSearchChange('');
                  setDropdownOpen(true);
                }}
                title="清空搜索"
              >
                <X size={15} />
              </button>
            )}

            {/* Instant Search Selectable Dropdown Results */}
            {dropdownOpen && (
              <div
                id="global-search-dropdown-results"
                className="header-search-dropdown"
                role="listbox"
                aria-label="搜索候选陀罗尼列表"
              >
                <div className="search-dropdown-header">
                  <span>
                    {searchQuery.trim()
                      ? `全库检索「${searchQuery}」：匹配到 ${suggestions.length} 条结果（涵盖四体精校库与大正藏 614 部密教原典）`
                      : '核心陀罗尼快速直达（可搜：大悲/尊胜/秽迹/雨宝/大轮/叶衣/爱染/法华/施食/文殊/度母/财神...）'}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CornerDownLeft size={12} />
                    <span>点击直达</span>
                  </span>
                </div>

                {suggestions.length === 0 ? (
                  <div
                    style={{
                      padding: '1.2rem',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.84rem',
                    }}
                  >
                    未找到包含「{searchQuery}」的经咒，请尝试搜索咒名关键词（如「尊胜」「孔雀」「欢喜天」「焰口」「oṃ」「svāhā」）。
                  </div>
                ) : (
                  suggestions.map((item, idx) => (
                    <button
                      key={`${item.kind}-${item.taishoNo}-${idx}`}
                      id={`search-suggestion-item-${idx}`}
                      type="button"
                      role="option"
                      aria-selected={idx === highlightIndex}
                      className={`search-suggestion-item ${
                        idx === highlightIndex ? 'highlighted' : ''
                      }`}
                      onMouseEnter={() => setHighlightIndex(idx)}
                      onClick={() => {
                        onSelectSuggestion(item);
                        setDropdownOpen(false);
                      }}
                    >
                      <div className="search-suggestion-top">
                        <span className="search-suggestion-title">{item.titleZh}</span>
                        <span className="search-suggestion-match-tag">
                          {item.matchTypeLabel}
                        </span>
                      </div>
                      <div className="search-suggestion-primary">{item.snippetPrimary}</div>
                      <div className="search-suggestion-secondary">
                        {item.snippetSecondary}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <nav className="header-nav-tabs" aria-label="主工作区导航">
            <button
              id="nav-tab-canon-reader"
              type="button"
              className={`nav-tab-btn ${activeTab === 'canon-reader' ? 'active' : ''}`}
              onClick={() => onTabChange('canon-reader')}
            >
              <BookOpen size={15} />
              <span>陀罗尼多体总持典 ({allEntries.length})</span>
            </button>
            <button
              id="nav-tab-taisho-explorer"
              type="button"
              className={`nav-tab-btn ${activeTab === 'taisho-explorer' ? 'active' : ''}`}
              onClick={() => onTabChange('taisho-explorer')}
            >
              <Library size={15} />
              <span>大正藏密教部 (614经·14,485咒)</span>
            </button>
            <button
              id="nav-tab-phonetics-academy"
              type="button"
              className={`nav-tab-btn ${activeTab === 'phonetics-academy' ? 'active' : ''}`}
              onClick={() => onTabChange('phonetics-academy')}
            >
              <GraduationCap size={15} />
              <span>悉昙五十字母与声明学</span>
            </button>
            <button
              id="nav-tab-custom-compiler"
              type="button"
              className={`nav-tab-btn ${activeTab === 'custom-compiler' ? 'active' : ''}`}
              onClick={() => onTabChange('custom-compiler')}
            >
              <Code2 size={15} />
              <span>梵咒实时编译器</span>
            </button>
            <button
              id="nav-tab-interlinear"
              type="button"
              className={`nav-tab-btn ${activeTab === 'interlinear' ? 'active' : ''}`}
              onClick={() => onTabChange('interlinear')}
            >
              <ScrollText size={15} />
              <span>房山石经与T54对音</span>
            </button>
            <button
              id="nav-tab-hub"
              type="button"
              className={`nav-tab-btn ${activeTab === 'hub' ? 'active' : ''}`}
              onClick={() => onTabChange('hub')}
            >
              <Globe size={15} />
              <span>全球12大数据库 ({UNIFIED_12_DATABASES.length})</span>
            </button>
          </nav>

          <button
            id="theme-toggle-button"
            type="button"
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            title={theme === 'light' ? '切换至紫金写经深色模式' : '切换至宣纸朱砂浅色模式'}
          >
            {theme === 'light' ? (
              <>
                <Moon size={15} />
                <span>紫金写经</span>
              </>
            ) : (
              <>
                <Sun size={15} />
                <span>宣纸朱砂</span>
              </>
            )}
          </button>
        </div>
      </header>

      <div className="provenance-ribbon">
        <div className="provenance-ribbon-inner">
          <div className="provenance-stats-list">
            <span className="prov-stat-item">
              <ShieldCheck size={14} color="var(--accent-vermilion)" />
              <span>权威馆藏规模：</span>
            </span>
            <span className="prov-stat-item">
              四体精校经咒专集 <strong>{allEntries.length}</strong> 部（含逾百首核心真言）
            </span>
            <span className="prov-stat-item">
              大正藏密教部全集 <strong>{CORPUS_AUTHORITATIVE_STATS.taishoMikkyoIndexedScripturesCount}</strong> 部经轨 ·{' '}
              <strong>{CORPUS_AUTHORITATIVE_STATS.taishoMikkyoTotalDharaniBlocks.toLocaleString()}</strong> 段真言
            </span>
            <span className="prov-stat-item">
              CBETA 悉昙字库 <strong>{CORPUS_AUTHORITATIVE_STATS.cbetaSiddhamGaijiTotalMapped}</strong> 字元
            </span>
            <span className="prov-stat-item">
              GRETIL 梵文贝叶本 <strong>{CORPUS_AUTHORITATIVE_STATS.gretilDownloadedManuscriptsCount}</strong> 部
            </span>
            <span className="prov-stat-item" title={UNIFIED_12_DATABASES.map((d) => d.id).join(' · ')}>
              12大国际梵典库 (<strong>{UNIFIED_12_DATABASES[0]?.id}</strong> … <strong>{UNIFIED_12_DATABASES[UNIFIED_12_DATABASES.length - 1]?.id}</strong>)
            </span>
          </div>
          <div>
            <span>每句配备「梵音拼读参考 + 唐宋古汉语音译」平行对照 · 全咒六体合一汇总 · 一键导出 .WAV</span>
          </div>
        </div>
      </div>
    </>
  );
};
