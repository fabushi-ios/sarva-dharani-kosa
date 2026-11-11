import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SidebarFilter } from '../../src/components/layout/SidebarFilter';
import { FIRST_SCREEN_CORPUS } from '../../src/data/firstScreenCorpus';

describe('Redesigned Dual-Mode Left Sidebar Navigation (SidebarFilter)', () => {
  const sampleEntries = FIRST_SCREEN_CORPUS.slice(0, 8);
  const activeEntry = sampleEntries[0];

  it('renders clear dual-mode tabs (经咒选单 & 本篇句目), concise category pills with live counts, and active reading indicator in Catalog Mode', () => {
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

    expect(html).toContain('经咒选单');
    expect(html).toContain('本篇句目');
    expect(html).toContain(`${activeEntry.verses.length}句`);
    expect(html).toContain('全部经咒');
    expect(html).toContain('四大长咒');
    expect(html).toContain('十小咒');
    expect(html).toContain('当前');
    expect(html).toContain(activeEntry.titleZh);
    expect(html).toContain('db1_fangshan');
    expect(html).toContain('db12_muktabodha_ochs');
  });

  it('displays explicit active filter banner and reset button when searchQuery (e.g. 大威德) is active', () => {
    const html = renderToStaticMarkup(
      React.createElement(SidebarFilter, {
        entries: sampleEntries.slice(0, 2),
        preCategoryEntries: sampleEntries.slice(0, 4),
        totalCorpusCount: 2480,
        selectedId: activeEntry.id,
        activeEntry,
        onSelectEntry: () => {},
        searchQuery: '大威德',
        onSearchChange: () => {},
        selectedCategory: 'buddhas-bodhisattvas',
        onSelectCategory: () => {},
        sourceFilter: 'all',
        onSourceFilterChange: () => {},
        onlyBookmarked: false,
        onToggleOnlyBookmarked: () => {},
        bookmarkedIds: new Set(),
        sidebarMode: 'catalog',
      })
    );

    expect(html).toContain('「大威德」');
    expect(html).toContain('诸佛菩萨');
    expect(html).toContain('重置全部');
  });

  it('renders Current Scripture Verse Outline, section quick-anchors, and per-verse jump/play controls in Outline Mode', () => {
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

    expect(html).toContain('当前研读经咒');
    expect(html).toContain(multiVerseEntry.titleZh);
    expect(html).toContain('经题提要');
    expect(html).toContain('全咒汇总');
    expect(html).toContain('同源见证');
    expect(html).toContain('outline-verse-jump-1');
    expect(html).toContain('outline-verse-play-1');
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
