import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  BookOpen,
  Library,
  GraduationCap,
  Code2,
  Globe,
  Sun,
  Moon,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import type { ActiveWorkspaceTab, DharaniEntry } from '../../types/kosaTypes';
import {
  getSearchSuggestions,
  type SearchScope,
  type SearchSuggestionItem,
} from '../../core/search/searchEngine';
import type { CanonCatalogItem } from '../../core/canon/canonLibraryTypes';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchScope?: SearchScope;
  onSearchScopeChange?: (scope: SearchScope) => void;
  onSubmitSearch?: (query: string, scope: SearchScope) => void;
  allEntries: DharaniEntry[];
  onSelectSuggestion: (item: SearchSuggestionItem) => void;
  activeTab: ActiveWorkspaceTab;
  onTabChange: (tab: ActiveWorkspaceTab) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenCanonText?: (id: string | null) => void;
  onSelectCanonScripture?: (item: CanonCatalogItem) => void;
  onAskAiWithQuery?: (query: string) => void;
}

const SCOPE_OPTIONS: Array<{ value: SearchScope; label: string }> = [
  { value: 'all', label: '一般搜尋' },
  { value: 'dharani-sanskrit', label: '陀羅尼·梵文' },
  { value: 'dharani-phonetic', label: '陀羅尼·梵音' },
  { value: 'sutra-text', label: '經文' },
  { value: 'sutra-title', label: '經名' },
  { value: 'notes', label: '校注與夾注' },
];

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  searchScope = 'all',
  onSearchScopeChange,
  onSubmitSearch,
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const toolsDetailsRef = useRef<HTMLDetailsElement>(null);

  const suggestions = useMemo(
    () =>
      searchQuery.trim()
        ? getSearchSuggestions(allEntries, searchQuery, 8, searchScope)
        : [],
    [allEntries, searchQuery, searchScope]
  );

  useEffect(() => {
    setHighlightIndex(0);
  }, [searchQuery, searchScope]);

  useEffect(() => {
    const handleClickOutside = (ev: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(ev.target as Node)) {
        setDropdownOpen(false);
      }
      if (toolsDetailsRef.current && !toolsDetailsRef.current.contains(ev.target as Node)) {
        toolsDetailsRef.current.open = false;
      }
    };

    const handleGlobalShortcut = (ev: KeyboardEvent) => {
      const target = ev.target as HTMLElement | null;
      const isTypingInInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') {
        ev.preventDefault();
        searchInputRef.current?.focus();
      } else if (!isTypingInInput && ev.key === '/') {
        ev.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleGlobalShortcut);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleGlobalShortcut);
    };
  }, []);

  const triggerFullSearch = () => {
    const trimmed = searchQuery.trim();
    setDropdownOpen(false);
    if (trimmed && onSubmitSearch) {
      onSubmitSearch(trimmed, searchScope);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault();
      setDropdownOpen(true);
      setHighlightIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp' && suggestions.length > 0) {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchQuery.trim() && onSubmitSearch) {
        triggerFullSearch();
        searchInputRef.current?.blur();
      } else if (suggestions[highlightIndex]) {
        onSelectSuggestion(suggestions[highlightIndex]);
        setDropdownOpen(false);
      }
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  };

  const selectTabAndCloseMenu = (tab: ActiveWorkspaceTab) => {
    onTabChange(tab);
    if (toolsDetailsRef.current) {
      toolsDetailsRef.current.open = false;
    }
  };

  return (
    <header className="app-header">
      <div className="header-top-row">
        {/* Clean Brand Identity */}
        <button
          type="button"
          className="brand-group brand-reset-btn"
          onClick={() => onTabChange('canon-reader')}
          title="返回主閱讀器"
        >
          <div className="brand-seal siddham-glyph" aria-hidden="true">
            {'\u{1158C}\u{115BC}'}
          </div>
          <div className="brand-titles">
            <div className="brand-title-zh">
              <span>梵音宝典</span>
              <span className="brand-title-en-inline">· Sarva-Dhāraṇī-Kośa</span>
            </div>
          </div>
        </button>

        {/* CBETA-Style Unified Search Bar: [一般搜尋 ▾] [ 輸入框 ] [搜尋] */}
        <div className="cbeta-header-search-box" ref={searchWrapRef}>
          <select
            id="global-search-scope-select"
            className="cbeta-scope-select"
            value={searchScope}
            aria-label="搜尋範圍"
            onChange={(e) => {
              const nextScope = e.target.value as SearchScope;
              onSearchScopeChange?.(nextScope);
              if (searchQuery.trim() && onSubmitSearch) {
                onSubmitSearch(searchQuery.trim(), nextScope);
              }
            }}
          >
            {SCOPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="cbeta-input-cell">
            <input
              ref={searchInputRef}
              id="global-dharani-search-input"
              type="search"
              autoComplete="off"
              className="cbeta-header-input"
              placeholder="輸入經名、陀羅尼咒語、梵文 IAST 或關鍵詞（如：地天、大悲咒、心經）…"
              value={searchQuery}
              onFocus={() => {
                if (searchQuery.trim()) setDropdownOpen(true);
              }}
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setDropdownOpen(Boolean(e.target.value.trim()));
              }}
            />
            {searchQuery && (
              <button
                id="clear-global-search-btn"
                type="button"
                className="cbeta-clear-btn"
                onClick={() => {
                  onSearchChange('');
                  setDropdownOpen(false);
                  searchInputRef.current?.focus();
                }}
                title="清空搜尋"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <button
            id="global-search-submit-btn"
            type="button"
            className="cbeta-submit-btn"
            onClick={triggerFullSearch}
          >
            <Search size={15} />
            <span>搜尋</span>
          </button>

          {/* Compact Instant-Preview Popover (No Rainbow Clutter!) */}
          {dropdownOpen && searchQuery.trim() && (
            <div
              id="global-search-dropdown-results"
              className="header-search-dropdown is-compact-preview"
              role="listbox"
              aria-label="即時搜尋預覽"
            >
              {onSubmitSearch && (
                <button
                  type="button"
                  className="cbeta-preview-all-bar"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={triggerFullSearch}
                >
                  <Search size={14} />
                  <span>
                    查看「<strong>{searchQuery.trim()}</strong>」完整分類搜尋結果（陀羅尼·梵文 / 梵音 / 經文 / 部類篩選）→
                  </span>
                </button>
              )}

              {suggestions.map((item, idx) => (
                <button
                  key={`${item.kind}-${item.taishoNo}-${idx}`}
                  id={`search-suggestion-item-${idx}`}
                  type="button"
                  role="option"
                  aria-selected={idx === highlightIndex}
                  className={`search-suggestion-item ${idx === highlightIndex ? 'highlighted' : ''}`}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onSelectSuggestion(item);
                    setDropdownOpen(false);
                    searchInputRef.current?.blur();
                  }}
                >
                  <div className="search-suggestion-top">
                    <span className="search-suggestion-title">{item.titleZh}</span>
                    <span className="search-suggestion-match-tag">{item.matchTypeLabel}</span>
                  </div>
                  <div className="search-suggestion-secondary">{item.snippetPrimary}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Calm Right Utility Controls */}
        <div className="header-utility-actions">
          <button
            id="header-buddhist-ai-shortcut"
            type="button"
            className={`header-util-btn ${activeTab === 'buddhist-ai' ? 'active' : ''}`}
            onClick={() => onTabChange('buddhist-ai')}
            title="打開佛經 AI 問答"
          >
            <Sparkles size={14} color="var(--accent-vermilion)" />
            <span className="header-util-label-desktop">AI 問答</span>
          </button>

          <details ref={toolsDetailsRef} className="header-tools-dropdown">
            <summary className="header-util-btn">
              <Library size={14} />
              <span className="header-util-label-desktop">專題庫</span>
              <ChevronDown size={13} />
            </summary>
            <div className="header-tools-popover">
              <button type="button" onClick={() => selectTabAndCloseMenu('canon-reader')}>
                <BookOpen size={14} />
                <span>經咒與原典閱讀器</span>
              </button>
              <button type="button" onClick={() => selectTabAndCloseMenu('canon-library')}>
                <Library size={14} />
                <span>CBETA 全部藏經目錄</span>
              </button>
              <button type="button" onClick={() => selectTabAndCloseMenu('hub')}>
                <Globe size={14} />
                <span>全球 12 大梵典數據庫 (DB1–12)</span>
              </button>
              <button type="button" onClick={() => selectTabAndCloseMenu('taisho-explorer')}>
                <Library size={14} />
                <span>大正藏密教部 (T18–T21)</span>
              </button>
              <button type="button" onClick={() => selectTabAndCloseMenu('phonetics-academy')}>
                <GraduationCap size={14} />
                <span>悉曇十八章與種子字辭典</span>
              </button>
              <button type="button" onClick={() => selectTabAndCloseMenu('custom-compiler')}>
                <Code2 size={14} />
                <span>梵音编译与发声台</span>
              </button>
            </div>
          </details>

          <button
            id="theme-toggle-button"
            type="button"
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            title={theme === 'light' ? '切換深色模式' : '切換淺色模式'}
          >
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          </button>
        </div>
      </div>
    </header>
  );
};
