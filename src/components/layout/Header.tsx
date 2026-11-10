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
import { CORPUS_AUTHORITATIVE_STATS } from '../../data/corpusStats';
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(
    () => getSearchSuggestions(allEntries, searchQuery, 20),
    [allEntries, searchQuery]
  );

  useEffect(() => {
    setHighlightIndex(0);
  }, [searchQuery]);

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
                <span className="brand-badge-auth">12大国际梵典库 + CBETA 14,485段真言 + 48kHz VITS</span>
              </div>
              <div className="brand-subtitle">
                Corpus of World Sanskrit Dhāraṇīs · 12 Global Databases (DB1–DB12), Siddhaṃ, Devanāgarī, IAST &amp; 48kHz Neural VITS
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
              placeholder="按 ⌘K 或 / 速查：搜咒名/俗称(大悲/楞严/绿度母/嗡嘛呢呗美吽)、12大库(房山/CUDL)、梵文或空格组合词..."
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
                      ? `全库检索「${searchQuery}」：已连入 12 大国际数据库 (DB1–DB12) 与 1,419 部梵本，匹配 ${suggestions.length} 条`
                      : '已接入全球 12 大梵典数据库 (DB1 房山石经 · DB3 DSBC · DB4 84000 · DB7 剑桥CUDL · DB8 奥斯陆 · DB12 牛津OCHS)'}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CornerDownLeft size={12} />
                    <span>点击直达</span>
                  </span>
                </div>

                {/* Quick 12-DB & Popular Mantra Search Filter Chips inside Dropdown */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.35rem',
                    padding: '0.45rem 0.75rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: 'var(--bg-elevated)',
                  }}
                >
                  {[
                    { label: '🔥 大悲咒', q: '大悲咒' },
                    { label: '🔥 楞严咒', q: '楞严咒' },
                    { label: '🔥 尊胜陀罗尼', q: '尊胜' },
                    { label: '🔥 心经咒', q: '心经' },
                    { label: '✨ 六字大明咒', q: '嗡嘛呢呗美吽' },
                    { label: '✨ 绿度母', q: '绿度母' },
                    { label: '✨ 药师咒', q: '药师' },
                    { label: '✨ 准提咒', q: '准提' },
                    { label: '✨ 秽迹金刚', q: '秽迹' },
                    { label: '🌐 DB1 房山石经', q: '房山' },
                    { label: '🌐 DB2 T54悉昙字书', q: 'T54' },
                    { label: '🌐 DB3 尼泊尔DSBC', q: 'DSBC' },
                    { label: '🌐 DB4 84000藏密', q: 'TOH' },
                    { label: '🌐 DB7 剑桥CUDL贝叶经', q: 'CUDL' },
                    { label: '🌐 DB8 奥斯陆心经', q: '奥斯陆' },
                    { label: '🌐 DB9 德格rKTs', q: 'rKTs' },
                    { label: '🌐 DB11 西域丝路', q: '丝路' },
                    { label: '🌐 DB12 牛津OCHS种子字', q: 'OCHS' },
                  ].map((chip) => (
                    <button
                      key={chip.q}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onSearchChange(chip.q);
                        setDropdownOpen(true);
                      }}
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.18rem 0.5rem',
                        borderRadius: '999px',
                        border: '1px solid rgba(139, 92, 246, 0.35)',
                        background:
                          searchQuery === chip.q
                            ? 'rgba(139, 92, 246, 0.22)'
                            : 'rgba(139, 92, 246, 0.08)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {chip.label}
                    </button>
                  ))}
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
                    未找到包含「{searchQuery}」的经咒，请尝试搜索 12 大数据库关键词（如「房山」「TOH」「CUDL」「OCHS」「rKTs」「尊胜」「孔雀」「oṃ」）。
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
              <BookOpen size={14} />
              <span>陀罗尼总持典 ({allEntries.length})</span>
            </button>
            <button
              id="nav-tab-hub"
              type="button"
              className={`nav-tab-btn ${activeTab === 'hub' ? 'active' : ''}`}
              onClick={() => onTabChange('hub')}
            >
              <Globe size={14} />
              <span>全球12大数据库 (DB1–12)</span>
            </button>
            <button
              id="nav-tab-interlinear"
              type="button"
              className={`nav-tab-btn ${activeTab === 'interlinear' ? 'active' : ''}`}
              onClick={() => onTabChange('interlinear')}
            >
              <ScrollText size={14} />
              <span>房山石经与T54对音 (741部)</span>
            </button>
            <button
              id="nav-tab-concordance"
              type="button"
              className={`nav-tab-btn ${activeTab === 'concordance' ? 'active' : ''}`}
              onClick={() => onTabChange('concordance')}
            >
              <Globe size={14} />
              <span>多本同源对勘 (16本心经)</span>
            </button>
            <button
              id="nav-tab-cudl"
              type="button"
              className={`nav-tab-btn ${activeTab === 'cudl' ? 'active' : ''}`}
              onClick={() => onTabChange('cudl')}
            >
              <BookOpen size={14} />
              <span>剑桥CUDL贝叶经 (69部)</span>
            </button>
            <button
              id="nav-tab-phonetics-academy"
              type="button"
              className={`nav-tab-btn ${activeTab === 'phonetics-academy' ? 'active' : ''}`}
              onClick={() => onTabChange('phonetics-academy')}
            >
              <GraduationCap size={14} />
              <span>悉昙十八章与OCHS种子字</span>
            </button>
            <button
              id="nav-tab-taisho-explorer"
              type="button"
              className={`nav-tab-btn ${activeTab === 'taisho-explorer' ? 'active' : ''}`}
              onClick={() => onTabChange('taisho-explorer')}
            >
              <Library size={14} />
              <span>大正藏密教部 (614经)</span>
            </button>
            <button
              id="nav-tab-custom-compiler"
              type="button"
              className={`nav-tab-btn ${activeTab === 'custom-compiler' ? 'active' : ''}`}
              onClick={() => onTabChange('custom-compiler')}
            >
              <Code2 size={14} />
              <span>四行谱发音引擎v3.0与编译器</span>
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
              语音方案：<strong>48,000 Hz 神经VITS (sa.onnx 男/女声)</strong> + <strong>612音节Sprite</strong> + <strong>136.1Hz Om共振场</strong>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>六体全咒汇总 · 梵音拼读附(IAST)开关 · 种子字破译 · 48kHz .WAV 导出</span>
            <a
              href="/sanskrit_phonetic_engine.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--accent-vermilion)',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              独立版发音引擎 v3.0 ↗
            </a>
          </div>
        </div>
      </div>
    </>
  );
};
