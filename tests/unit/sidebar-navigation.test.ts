import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SidebarFilter } from '../../src/components/layout/SidebarFilter';
import { FIRST_SCREEN_CORPUS } from '../../src/data/firstScreenCorpus';

describe('CBETA 部類與文獻類型雙模式左側目錄欄 (SidebarFilter)', () => {
  const sampleEntries = FIRST_SCREEN_CORPUS.slice(0, 8);
  const activeEntry = sampleEntries[0];

  it('renders CBETA 部類目錄 & 本篇導覽 dual-mode tabs, 陀羅尼·梵文/梵音/經文 scope pills, CBETA 部類 list, and DB1–DB12 options in Catalog Mode', () => {
    const html = renderToStaticMarkup(
      React.createElement(SidebarFilter, {
        entries: sampleEntries,
        preCategoryEntries: sampleEntries,
        totalCorpusCount: 2480,
        selectedId: activeEntry.id,
        activeEntry,
        onSelectEntry: () => {},
        searchQuery: '',
        onSearchChange: () => {},
        selectedCategory: 'all',
        onSelectCategory: () => {},
        sourceFilter: 'all',
        onSourceFilterChange: () => {},
        onlyBookmarked: false,
        onToggleOnlyBookmarked: () => {},
        bookmarkedIds: new Set([activeEntry.id]),
        onToggleBookmark: () => {},
        sidebarMode: 'catalog',
      })
    );

    expect(html).toContain('部類目錄');
    expect(html).toContain('本篇導覽');
    expect(html).toContain('陀羅尼·梵文');
    expect(html).toContain('陀羅尼·梵音');
    expect(html).toContain('CBETA 部類');
    expect(html).toContain('阿含部類');
    expect(html).toContain('密教部類');
    expect(html).toContain(activeEntry.titleZh);
    expect(html).toContain('db1_fangshan');
    expect(html).toContain('db12_muktabodha_ochs');
  });

  it('displays reset action when searchQuery or CBETA 部類 filter is active', () => {
    const html = renderToStaticMarkup(
      React.createElement(SidebarFilter, {
        entries: sampleEntries.slice(0, 2),
        preCategoryEntries: sampleEntries.slice(0, 4),
        totalCorpusCount: 2480,
        selectedId: activeEntry.id,
        activeEntry,
        onSelectEntry: () => {},
        searchQuery: '地天',
        onSearchChange: () => {},
        selectedBulei: 'mikkyo',
        onSelectBulei: () => {},
        selectedCategory: 'all',
        onSelectCategory: () => {},
        sourceFilter: 'all',
        onSourceFilterChange: () => {},
        onlyBookmarked: false,
        onToggleOnlyBookmarked: () => {},
        bookmarkedIds: new Set(),
        sidebarMode: 'catalog',
      })
    );

    expect(html).toContain('sidebar-reset-filters-btn');
    expect(html).toContain('重置');
  });

  it('renders Current Entry Outline, parallel tab jump buttons, and per-verse jump items in Outline Mode', () => {
    const multiVerseEntry =
      FIRST_SCREEN_CORPUS.find((e) => e.verses.length >= 4) || activeEntry;

    const html = renderToStaticMarkup(
      React.createElement(SidebarFilter, {
        entries: sampleEntries,
        preCategoryEntries: sampleEntries,
        totalCorpusCount: 2480,
        selectedId: multiVerseEntry.id,
        activeEntry: multiVerseEntry,
        onSelectEntry: () => {},
        selectedCategory: 'all',
        onSelectCategory: () => {},
        sourceFilter: 'all',
        onSourceFilterChange: () => {},
        onlyBookmarked: false,
        onToggleOnlyBookmarked: () => {},
        bookmarkedIds: new Set(),
        onPlayAllVerses: () => {},
        onPlaySingleVerse: () => {},
        onJumpToSection: () => {},
        onJumpToVerse: () => {},
        sidebarMode: 'outline',
      })
    );

    expect(html).toContain(multiVerseEntry.titleZh);
    expect(html).toContain('跳至頂部');
    expect(html).toContain('切換原典經文');
    expect(html).toContain('第 01 句');
  });

  it('renders slim quick-navigation focus rail when sidebarCollapsed is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(SidebarFilter, {
        entries: sampleEntries,
        preCategoryEntries: sampleEntries,
        totalCorpusCount: 2480,
        selectedId: activeEntry.id,
        activeEntry,
        onSelectEntry: () => {},
        selectedCategory: 'all',
        onSelectCategory: () => {},
        sourceFilter: 'all',
        onSourceFilterChange: () => {},
        onlyBookmarked: false,
        onToggleOnlyBookmarked: () => {},
        bookmarkedIds: new Set([activeEntry.id]),
        sidebarCollapsed: true,
        onToggleSidebarCollapsed: () => {},
      })
    );

    expect(html).toContain('sidebar-collapsed-rail');
    expect(html).toContain('btn-expand-sidebar-rail');
  });
});
