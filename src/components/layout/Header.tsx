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
  Info,
} from 'lucide-react';
import type { ActiveWorkspaceTab, DharaniEntry } from '../../types/kosaTypes';
import { CORPUS_AUTHORITATIVE_STATS } from '../../data/corpusStats';
import {
  getSearchSuggestions,
  type SearchSuggestionItem,
} from '../../core/search/searchEngine';
import { PhoneticText } from '../common/PhoneticText';
import { filterCatalog, loadCanonCatalog } from '../../services/canon/canonLibraryService';
import type { CanonCatalogItem } from '../../core/canon/canonLibraryTypes';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  allEntries: DharaniEntry[];
  onSelectSuggestion: (item: SearchSuggestionItem) => void;
  activeTab: ActiveWorkspaceTab;
  onTabChange: (tab: ActiveWorkspaceTab) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  /** Opens a text of the 藏经全文库 (null = library search for the current query). */
  onOpenCanonText?: (id: string | null) => void;
}

const QUICK_SEARCH_CHIPS: Array<{
  label: string;
  q: string;
  variant: 'hot' | 'mantra' | 'db';
}> = [
  { label: '大悲咒', q: '大悲咒', variant: 'hot' },
  { label: '楞严咒', q: '楞严咒', variant: 'hot' },
  { label: '尊胜陀罗尼', q: '尊胜', variant: 'hot' },
  { label: '大随求陀罗尼', q: '大随求', variant: 'hot' },
  { label: '心经咒', q: '心经', variant: 'hot' },
  { label: '六字大明咒', q: '嗡嘛呢呗美吽', variant: 'mantra' },
  { label: '绿度母', q: '绿度母', variant: 'mantra' },
  { label: '药师咒', q: '药师', variant: 'mantra' },
  { label: '准提咒', q: '准提', variant: 'mantra' },
  { label: '孔雀明王', q: '孔雀明王', variant: 'mantra' },
  { label: '吠陀伽耶特黎', q: '伽耶特黎', variant: 'mantra' },
  { label: 'DB1 房山石经', q: '房山', variant: 'db' },
  { label: 'DB3 尼泊尔DSBC', q: 'DSBC', variant: 'db' },
  { label: 'DB4 84000藏密', q: 'TOH', variant: 'db' },
  { label: 'DB7 剑桥CUDL', q: 'CUDL', variant: 'db' },
  { label: 'DB8 奥斯陆心经', q: '奥斯陆', variant: 'db' },
  { label: 'DB12 牛津OCHS', q: 'OCHS', variant: 'db' },
];

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  allEntries,
  onSelectSuggestion,
  activeTab,
  onTabChange,
  theme,
  onToggleTheme,
  onOpenCanonText,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // Every CBETA text is searchable by title / number / translator (catalog loaded on first query).
  const [canonHits, setCanonHits] = useState<{ q: string; total: number; items: CanonCatalogItem[] }>({ q: '', total: 0, items: [] });
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2 || !onOpenCanonText) return;
    let alive = true;
    loadCanonCatalog()
      .then((cat) => {
        if (!alive) return;
        const hits = filterCatalog(cat, q);
        setCanonHits({ q, total: hits.length, items: hits.slice(0, 6) });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [searchQuery, onOpenCanonText]);
  const canonShown = canonHits.q === searchQuery.trim() ? canonHits : { q: '', total: 0, items: [] };
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [showCorpusRibbon, setShowCorpusRibbon] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navTabsRef = useRef<HTMLElement>(null);

  const suggestions = useMemo(
    () => getSearchSuggestions(allEntries, searchQuery, 20),
    [allEntries, searchQuery]
  );

  useEffect(() => {
    setHighlightIndex(0);
  }, [searchQuery]);

  // Keep active navigation tab smoothly centered inside horizontal scroll bar on mobile/tablet
  useEffect(() => {
    const navEl = navTabsRef.current;
    if (!navEl) return;
    const activeBtn = navEl.querySelector<HTMLElement>('.nav-tab-btn.active');
    if (activeBtn && navEl.scrollWidth > navEl.clientWidth) {
      const targetLeft =
        activeBtn.offsetLeft - navEl.clientWidth / 2 + activeBtn.offsetWidth / 2;
      navEl.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
    }
  }, [activeTab]);

  // Close dropdown when clicking outside & support global Ctrl+K / Cmd+K / '/' shortcut
  useEffect(() => {
    const handleClickOutside = (ev: MouseEvent) => {
      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(ev.target as Node)
      ) {
        setDropdownOpen(false);
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
        setDropdownOpen(true);
      } else if (!isTypingInInput && ev.key === '/') {
        ev.preventDefault();
        searchInputRef.current?.focus();
        setDropdownOpen(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleGlobalShortcut);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleGlobalShortcut);
    };
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
        searchInputRef.current?.blur();
      }
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  };

  return (
    <>
      <header className="app-header">
        {/* Tier 1: Brand Identity | Global Search | Utility Controls */}
        <div className="header-top-row">
          <div className="brand-group">
            <div className="brand-seal siddham-glyph" title="Siddhaṃ Bīja Oṃ">
              𑖌𑖼
            </div>
            <div className="brand-titles">
              <div className="brand-title-zh">
                <span>梵音宝典</span>
                <span className="brand-title-en-inline">· Sarva-Dhāraṇī-Kośa</span>
                <span className="brand-badge-auth">12大梵典库 · 48kHz VITS</span>
              </div>
              <div className="brand-subtitle">
                Sarva-Dhāraṇī-Kośa · 12大国际梵典库 (DB1–DB12) · 悉昙/天城/IAST多体精校与神经梵音
              </div>
            </div>
          </div>

          <div className="header-search-wrap" ref={searchWrapRef}>
            <Search size={16} className="header-search-icon" />
            <input
              ref={searchInputRef}
              id="global-dharani-search-input"
              type="search"
              autoComplete="off"
              className="header-search-input"
              placeholder="搜咒名/俗称(大悲/楞严/尊胜)、12大库(房山/CUDL/TOH)或梵文..."
              value={searchQuery}
              onFocus={() => setDropdownOpen(true)}
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setDropdownOpen(true);
              }}
            />
            {!searchQuery ? (
              <span className="header-search-kbd" aria-hidden="true">
                ⌘K
              </span>
            ) : (
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
                      ? `检索「${searchQuery}」：全库 ${allEntries.length} 部中匹配 ${suggestions.length} 条`
                      : `全库直达：12大国际梵典库与世界梵咒总集 (${allEntries.length} 部)`}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <CornerDownLeft size={12} />
                    <span>点选直达</span>
                  </span>
                </div>

                {/* Quick 12-DB & Popular Mantra Search Filter Chips */}
                <div className="search-quick-chips-bar">
                  {QUICK_SEARCH_CHIPS.map((chip) => {
                    const isActive = searchQuery === chip.q;
                    const variantClass =
                      chip.variant === 'hot'
                        ? 'is-hot'
                        : chip.variant === 'db'
                          ? 'is-db'
                          : '';
                    return (
                      <button
                        key={chip.q}
                        type="button"
                        className={`search-quick-chip ${variantClass} ${isActive ? 'is-active' : ''}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          onSearchChange(chip.q);
                          setDropdownOpen(true);
                        }}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>

                {onOpenCanonText && canonShown.total > 0 && (
                  <div className="search-canon-hits">
                    <div className="search-canon-hits-label">藏经原文（{canonShown.total} 部）</div>
                    {canonShown.items.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="search-suggestion-item"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          onOpenCanonText(c.id);
                          setDropdownOpen(false);
                          searchInputRef.current?.blur();
                        }}
                      >
                        <div className="search-suggestion-top">
                          <span className="search-suggestion-title">{c.title}</span>
                          <span className="search-suggestion-match-tag">{c.id}{c.dharani > 0 ? ` · 陀罗尼 ${c.dharani}` : ''}</span>
                        </div>
                        <div className="search-suggestion-secondary">{c.byline}</div>
                      </button>
                    ))}
                    {canonShown.total > canonShown.items.length && (
                      <button
                        type="button"
                        className="search-canon-more"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          onOpenCanonText(null);
                          setDropdownOpen(false);
                        }}
                      >
                        在藏经全文库中查看全部 {canonShown.total} 部 →
                      </button>
                    )}
                  </div>
                )}

                {suggestions.length === 0 ? (
                  <div
                    style={{
                      padding: '1.25rem 1rem',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.84rem',
                    }}
                  >
                    未找到包含「{searchQuery}」的经咒，可尝试「房山」「TOH」「CUDL」「OCHS」「尊胜」「大悲」「oṃ」。
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
                        searchInputRef.current?.blur();
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
                        <PhoneticText text={item.snippetSecondary} />
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="header-utility-actions">
            <button
              id="header-corpus-stats-toggle"
              type="button"
              className={`header-util-btn ${showCorpusRibbon ? 'active' : ''}`}
              onClick={() => setShowCorpusRibbon((v) => !v)}
              title="查看馆藏原典规模与语音引擎参数"
            >
              <Info size={14} />
              <span className="header-util-label-desktop">馆藏参数</span>
            </button>

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
                  <span className="header-util-label-desktop">紫金写经</span>
                </>
              ) : (
                <>
                  <Sun size={15} />
                  <span className="header-util-label-desktop">宣纸朱砂</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tier 2: Single-Row Scrollable Workspace Navigation Bar */}
        <div className="header-nav-bar">
          <div className="header-nav-inner">
            <nav ref={navTabsRef} className="header-nav-tabs" aria-label="主工作区导航">
              <button
                id="nav-tab-canon-reader"
                type="button"
                className={`nav-tab-btn ${activeTab === 'canon-reader' ? 'active' : ''}`}
                onClick={() => onTabChange('canon-reader')}
              >
                <BookOpen size={14} />
                <span>陀罗尼总持典</span>
                <span className="nav-tab-count">{allEntries.length}</span>
              </button>
              <button
                id="nav-tab-hub"
                type="button"
                className={`nav-tab-btn ${activeTab === 'hub' ? 'active' : ''}`}
                onClick={() => onTabChange('hub')}
              >
                <Globe size={14} />
                <span>全球12大数据库</span>
                <span className="nav-tab-count">DB1–12</span>
              </button>
              <button
                id="nav-tab-interlinear"
                type="button"
                className={`nav-tab-btn ${activeTab === 'interlinear' ? 'active' : ''}`}
                onClick={() => onTabChange('interlinear')}
              >
                <ScrollText size={14} />
                <span>房山石经与T54对音</span>
                <span className="nav-tab-count">741</span>
              </button>
              <button
                id="nav-tab-concordance"
                type="button"
                className={`nav-tab-btn ${activeTab === 'concordance' ? 'active' : ''}`}
                onClick={() => onTabChange('concordance')}
              >
                <Globe size={14} />
                <span>多本同源对勘</span>
                <span className="nav-tab-count">16本</span>
              </button>
              <button
                id="nav-tab-cudl"
                type="button"
                className={`nav-tab-btn ${activeTab === 'cudl' ? 'active' : ''}`}
                onClick={() => onTabChange('cudl')}
              >
                <BookOpen size={14} />
                <span>剑桥CUDL贝叶经</span>
                <span className="nav-tab-count">69</span>
              </button>
              <button
                id="nav-tab-phonetics-academy"
                type="button"
                className={`nav-tab-btn ${activeTab === 'phonetics-academy' ? 'active' : ''}`}
                onClick={() => onTabChange('phonetics-academy')}
              >
                <GraduationCap size={14} />
                <span>悉昙十八章与种子字</span>
              </button>
              <button
                id="nav-tab-taisho-explorer"
                type="button"
                className={`nav-tab-btn ${activeTab === 'taisho-explorer' ? 'active' : ''}`}
                onClick={() => onTabChange('taisho-explorer')}
              >
                <Library size={14} />
                <span>大正藏密教部</span>
                <span className="nav-tab-count">614经</span>
              </button>
              <button
                id="nav-tab-canon-library"
                type="button"
                className={`nav-tab-btn ${activeTab === 'canon-library' ? 'active' : ''}`}
                onClick={() => onTabChange('canon-library')}
              >
                <Library size={14} />
                <span>藏经全文库</span>
                <span className="nav-tab-count">CBETA 全藏</span>
              </button>
              <button
                id="nav-tab-custom-compiler"
                type="button"
                className={`nav-tab-btn ${activeTab === 'custom-compiler' ? 'active' : ''}`}
                onClick={() => onTabChange('custom-compiler')}
              >
                <Code2 size={14} />
                <span>梵音编译与发声台</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className={`provenance-ribbon ${showCorpusRibbon ? '' : 'is-hidden'}`}>
        <div className="provenance-ribbon-inner">
          <div className="provenance-stats-list">
            <span className="prov-stat-item">
              <ShieldCheck size={14} color="var(--accent-vermilion)" />
              <span>权威馆藏规模：</span>
            </span>
            <span className="prov-stat-item">
              多体精校与12库梵本专集 <strong>{allEntries.length}</strong> 部
            </span>
            <span className="prov-stat-item">
              全球12大权威数据库 (<strong>DB1 房山石经</strong> · <strong>DB3 DSBC</strong> · <strong>DB4 84000</strong> · <strong>DB7 剑桥CUDL</strong> · <strong>DB8 奥斯陆16本</strong> · <strong>DB12 牛津OCHS</strong>)
            </span>
            <span className="prov-stat-item">
              大正藏密教部 <strong>{CORPUS_AUTHORITATIVE_STATS.taishoMikkyoIndexedScripturesCount}</strong> 经 ·{' '}
              <strong>{CORPUS_AUTHORITATIVE_STATS.taishoMikkyoTotalDharaniBlocks.toLocaleString()}</strong> 段真言
            </span>
            <span className="prov-stat-item">
              语音方案：<strong>48,000 Hz 神经VITS (sa.onnx 男/女声)</strong> + <strong>612音节Sprite</strong> + <strong>136.1Hz Om共振场</strong> · <strong>48kHz MP3 / WAV 同名导出</strong>
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
