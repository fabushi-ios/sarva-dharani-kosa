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
  Sparkles,
} from 'lucide-react';
import type { ActiveWorkspaceTab, DharaniEntry } from '../../types/kosaTypes';
import { CORPUS_AUTHORITATIVE_STATS } from '../../data/corpusStats';
import {
  getSearchSuggestions,
  type SearchSuggestionItem,
} from '../../core/search/searchEngine';
import { PhoneticText } from '../common/PhoneticText';
import {
  filterCatalog,
  loadCanonCatalog,
  searchCanonFullText,
  type CanonFullTextHit,
} from '../../services/canon/canonLibraryService';
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
  /** Opens 藏经全文库 tab (null = library search for current query). */
  onOpenCanonText?: (id: string | null) => void;
  /** Opens any Canon scripture (with or without dhāraṇīs) directly inside the unified reader! */
  onSelectCanonScripture?: (item: CanonCatalogItem) => void;
  /** Sends a question directly into the fine-tuned Buddhist Sutra AI Q&A Studio! */
  onAskAiWithQuery?: (query: string) => void;
}

const QUICK_SEARCH_CHIPS: Array<{
  label: string;
  q: string;
  variant: 'hot' | 'mantra' | 'db';
}> = [
  { label: '金刚经(无咒经文)', q: '金刚般若波罗蜜经', variant: 'hot' },
  { label: '阿弥陀经(无咒经文)', q: '佛说阿弥陀经', variant: 'hot' },
  { label: '妙法莲华经', q: '妙法莲华经', variant: 'hot' },
  { label: '大悲咒', q: '大悲咒', variant: 'hot' },
  { label: '楞严咒', q: '楞严咒', variant: 'hot' },
  { label: '尊胜陀罗尼', q: '尊胜', variant: 'hot' },
  { label: '心经', q: '心经', variant: 'hot' },
  { label: '六字大明咒', q: '嗡嘛呢呗美吽', variant: 'mantra' },
  { label: '绿度母', q: '绿度母', variant: 'mantra' },
  { label: '药师经', q: '药师琉璃光如来', variant: 'mantra' },
  { label: '准提咒', q: '准提', variant: 'mantra' },
  { label: 'DB1 房山石经', q: '房山', variant: 'db' },
  { label: 'DB3 尼泊尔DSBC', q: 'DSBC', variant: 'db' },
  { label: 'DB4 84000藏密', q: 'TOH', variant: 'db' },
  { label: 'DB7 剑桥CUDL', q: 'CUDL', variant: 'db' },
  { label: 'DB8 奥斯陆对勘', q: '奥斯陆', variant: 'db' },
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
  onSelectCanonScripture,
  onAskAiWithQuery,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [canonHits, setCanonHits] = useState<{
    q: string;
    total: number;
    items: CanonCatalogItem[];
    bodyHits: CanonFullTextHit[];
  }>({ q: '', total: 0, items: [], bodyHits: [] });

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) return;
    let alive = true;
    loadCanonCatalog()
      .then(async (cat) => {
        if (!alive) return;
        const hits = filterCatalog(cat, q);
        const bodyHits = await searchCanonFullText(q, cat, 4);
        if (!alive) return;
        setCanonHits({
          q,
          total: hits.length,
          items: hits.slice(0, 6),
          bodyHits: bodyHits.filter((bh) => !hits.slice(0, 6).some((h) => h.id === bh.item.id)),
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [searchQuery]);

  const canonShown =
    canonHits.q === searchQuery.trim()
      ? canonHits
      : { q: '', total: 0, items: [], bodyHits: [] };

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

  const handleOpenCanonItem = (c: CanonCatalogItem) => {
    if (onSelectCanonScripture) {
      onSelectCanonScripture(c);
    } else {
      onOpenCanonText?.(c.id);
    }
    setDropdownOpen(false);
    searchInputRef.current?.blur();
  };

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
      } else if (canonShown.items[0]) {
        handleOpenCanonItem(canonShown.items[0]);
      }
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  };

  return (
    <>
      <header className="app-header">
        <div className="header-top-row">
          <div className="brand-group">
            <div className="brand-seal siddham-glyph" title="Siddhaṃ Bīja Oṃ">
              {'\u{1158C}\u{115BC}'}
            </div>
            <div className="brand-titles">
              <div className="brand-title-zh">
                <span>梵音宝典</span>
                <span className="brand-title-en-inline">· Sarva-Dhāraṇī-Kośa</span>
                <span className="brand-badge-auth">全藏原文 · 12大梵典库 · MITRA佛经AI</span>
              </div>
              <div className="brand-subtitle">
                全藏经典原文直看 · 12大国际梵典库 (DB1–DB12) · 微调佛经大模型 AI 对勘 · 48kHz 神经梵音
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
              placeholder="搜全部经典原文(金刚经/阿弥陀经/法华经)、陀罗尼、12大库或向佛经AI提问..."
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

            {dropdownOpen && (
              <div
                id="global-search-dropdown-results"
                className="header-search-dropdown"
                role="listbox"
                aria-label="全藏经典与陀罗尼搜索结果列表"
              >
                <div className="search-dropdown-header">
                  <span>
                    {searchQuery.trim()
                      ? `检索「${searchQuery}」：匹配经典与陀罗尼 ${suggestions.length + canonShown.total} 条`
                      : `全站直达：CBETA 全藏经典原文 + 12大国际梵典库 (${allEntries.length} 部)`}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <CornerDownLeft size={12} />
                    <span>点选直看原文</span>
                  </span>
                </div>

                {searchQuery.trim() && onAskAiWithQuery && (
                  <div style={{ padding: '0.45rem 0.85rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <button
                      type="button"
                      className="btn-scholarly primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onAskAiWithQuery(searchQuery.trim());
                        setDropdownOpen(false);
                        searchInputRef.current?.blur();
                      }}
                    >
                      <Sparkles size={14} />
                      <span>向 MITRA 佛经大模型提问并检索本库原典：「{searchQuery.trim().slice(0, 28)}」</span>
                    </button>
                  </div>
                )}

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

                {(canonShown.total > 0 || canonShown.bodyHits.length > 0) && (
                  <div className="search-canon-hits">
                    <div className="search-canon-hits-label">
                      全藏经典原文直看（匹配 {canonShown.total} 部 · 含无陀罗尼经文与含陀罗尼经典）
                    </div>
                    {canonShown.items.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="search-suggestion-item"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleOpenCanonItem(c)}
                      >
                        <div className="search-suggestion-top">
                          <span className="search-suggestion-title">《{c.title}》</span>
                          <span className="search-suggestion-match-tag">
                            {c.id}
                            {c.dharani > 0
                              ? ` · 原文 + 陀罗尼 ${c.dharani} 段`
                              : ' · 纯经文原文（无陀罗尼）'}
                          </span>
                        </div>
                        <div className="search-suggestion-secondary">
                          {c.byline || '藏经原典'} · 全文 {(c.chars || 0).toLocaleString()} 字
                        </div>
                      </button>
                    ))}
                    {canonShown.bodyHits.map((bh) => (
                      <button
                        key={`body-${bh.item.id}`}
                        type="button"
                        className="search-suggestion-item"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleOpenCanonItem(bh.item)}
                      >
                        <div className="search-suggestion-top">
                          <span className="search-suggestion-title">《{bh.item.title}》</span>
                          <span className="search-suggestion-match-tag">
                            {bh.item.id} · 经文内文命中
                          </span>
                        </div>
                        <div className="search-suggestion-secondary">原文摘录：{bh.snippet}</div>
                      </button>
                    ))}
                    {onOpenCanonText && canonShown.total > canonShown.items.length && (
                      <button
                        type="button"
                        className="search-canon-more"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          onOpenCanonText(null);
                          setDropdownOpen(false);
                        }}
                      >
                        在藏经全文库中浏览全部 {canonShown.total.toLocaleString()} 部匹配经典 →
                      </button>
                    )}
                  </div>
                )}

                {suggestions.length === 0 && canonShown.total === 0 ? (
                  <div
                    style={{
                      padding: '1.25rem 1rem',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.84rem',
                    }}
                  >
                    未找到包含「{searchQuery}」的经典或陀罗尼，可点击上方按钮直接向 MITRA 佛经大模型提问检索。
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
              id="header-buddhist-ai-shortcut"
              type="button"
              className={`header-util-btn ${activeTab === 'buddhist-ai' ? 'active' : ''}`}
              onClick={() => onTabChange('buddhist-ai')}
              title="打开 MITRA-Qwen3.5 微调佛经大模型 AI 问答工作台"
            >
              <Sparkles size={14} color="var(--accent-vermilion)" />
              <span className="header-util-label-desktop">佛经AI</span>
            </button>

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
                <span>原典与陀罗尼阅读</span>
                <span className="nav-tab-count">{allEntries.length}</span>
              </button>
              <button
                id="nav-tab-buddhist-ai"
                type="button"
                className={`nav-tab-btn ${activeTab === 'buddhist-ai' ? 'active' : ''}`}
                onClick={() => onTabChange('buddhist-ai')}
              >
                <Sparkles size={14} />
                <span>佛经AI问答</span>
                <span className="nav-tab-count">MITRA</span>
              </button>
              <button
                id="nav-tab-canon-library"
                type="button"
                className={`nav-tab-btn ${activeTab === 'canon-library' ? 'active' : ''}`}
                onClick={() => onTabChange('canon-library')}
              >
                <Library size={14} />
                <span>全部藏经全文库</span>
                <span className="nav-tab-count">全藏检索</span>
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
                id="nav-tab-phonetics-academy"
                type="button"
                className={`nav-tab-btn ${activeTab === 'phonetics-academy' ? 'active' : ''}`}
                onClick={() => onTabChange('phonetics-academy')}
              >
                <GraduationCap size={14} />
                <span>悉昙十八章与种子字</span>
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
              全数据库支持 <strong>库藏原文全文直看</strong> · 多体精校与12库专集 <strong>{allEntries.length}</strong> 部
            </span>
            <span className="prov-stat-item">
              微调佛经大模型 <strong>MITRA-Qwen3.5-IT (9B)</strong> 全藏经 RAG 对勘
            </span>
            <span className="prov-stat-item">
              大正藏密教部 <strong>{CORPUS_AUTHORITATIVE_STATS.taishoMikkyoIndexedScripturesCount}</strong> 经 ·{' '}
              <strong>{CORPUS_AUTHORITATIVE_STATS.taishoMikkyoTotalDharaniBlocks.toLocaleString()}</strong> 段真言
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
