import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { FIRST_SCREEN_CORPUS } from '../../src/data/firstScreenCorpus';
import { getSearchSuggestions } from '../../src/core/search/searchEngine';
import {
  APP_SCROLL_CONTAINER_ID,
  getActiveScrollContainer,
  getReadingViewportBounds,
  scrollActiveViewportByDeltaY,
  scrollReaderToTop,
  scrollToReaderElement,
} from '../../src/core/dom/scrollUtils';
import { App } from '../../src/App';

const ROOT_DIR = path.resolve(__dirname, '../..');

describe('Search Jump-to-Title & Mobile Docked Persistent Audio Bar Regressions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('1. Search Suggestions & Jump-to-Title Target', () => {
    it('does not force matchedVerseId to verse #1 on default/empty search suggestions while keeping preview snippets', () => {
      const defaults = getSearchSuggestions(FIRST_SCREEN_CORPUS, '', 8);
      expect(defaults.length).toBeGreaterThan(0);
      for (const item of defaults) {
        if (item.kind === 'canon-entry') {
          expect(item.matchedVerseId).toBeUndefined();
          expect(item.matchedVerseIndex).toBeUndefined();
          expect(item.snippetPrimary.length).toBeGreaterThan(0);
        }
      }
    });

    it('keeps matchedVerseId undefined for title, colloquial alias, Taishō ID, and deity searches', () => {
      const titleQueries = ['大悲咒', '尊胜', '心经', 'T20n1060', '观自在'];
      for (const query of titleQueries) {
        const items = getSearchSuggestions(FIRST_SCREEN_CORPUS, query, 8);
        const canonItems = items.filter((it) => it.kind === 'canon-entry');
        expect(canonItems.length).toBeGreaterThan(0);
        expect(canonItems[0].matchedVerseId).toBeUndefined();
      }
    });

    it('routes all canon search suggestion selections in App.tsx to #reader-hero-section (title) rather than verse-card scrollIntoView', () => {
      const appSource = fs.readFileSync(path.join(ROOT_DIR, 'src/App.tsx'), 'utf8');
      expect(appSource).not.toContain('scrollIntoView');

      const suggestionFnMatch = appSource.match(
        /const handleSelectSuggestion = \([\s\S]*?\n  \};/
      );
      expect(suggestionFnMatch).not.toBeNull();
      const suggestionBody = suggestionFnMatch![0];
      expect(suggestionBody).toContain("target: 'hero'");
      expect(suggestionBody).not.toContain('verse-card-');
    });
  });

  describe('2. Container-Aware Reader Scroll Utilities (scrollUtils.ts)', () => {
    it('scrolls #app-scroll-container on mobile/touch viewports without displacing window scroll', () => {
      const containerScrollTo = vi.fn();
      const windowScrollTo = vi.fn();

      const mockContainer = {
        id: APP_SCROLL_CONTAINER_ID,
        scrollTop: 420,
        getBoundingClientRect: () => ({
          top: 96,
          bottom: 720,
          height: 624,
          left: 0,
          right: 390,
          width: 390,
        }),
        scrollTo: containerScrollTo,
      } as unknown as HTMLElement;

      const mockHero = {
        id: 'reader-hero-section',
        offsetWidth: 360,
        classList: {
          remove: vi.fn(),
          add: vi.fn(),
        },
        getBoundingClientRect: () => ({
          top: -250,
          bottom: -30,
          height: 220,
          left: 12,
          right: 378,
          width: 366,
        }),
      } as unknown as HTMLElement;

      vi.stubGlobal('document', {
        getElementById: (id: string) => {
          if (id === APP_SCROLL_CONTAINER_ID) return mockContainer;
          if (id === 'reader-hero-section') return mockHero;
          return null;
        },
        querySelector: () => null,
      });

      vi.stubGlobal('window', {
        innerHeight: 800,
        scrollY: 0,
        scrollTo: windowScrollTo,
        setTimeout: globalThis.setTimeout.bind(globalThis),
        getComputedStyle: (el: unknown) => ({
          overflowY: el === mockContainer ? 'auto' : 'visible',
        }),
      });

      expect(getActiveScrollContainer()).toBe(mockContainer);
      const bounds = getReadingViewportBounds();
      expect(bounds.container).toBe(mockContainer);
      expect(bounds.top).toBe(96);
      expect(bounds.bottom).toBe(720);

      const didScroll = scrollToReaderElement('reader-hero-section', { topGap: 10 });
      expect(didScroll).toBe(true);
      // 420 + (-250 - 96) - 10 = 64
      expect(containerScrollTo).toHaveBeenCalledWith({
        top: 64,
        left: 0,
        behavior: 'smooth',
      });
      expect(windowScrollTo).not.toHaveBeenCalled();

      scrollActiveViewportByDeltaY(80, 'smooth');
      expect(containerScrollTo).toHaveBeenLastCalledWith({
        top: 500,
        left: 0,
        behavior: 'smooth',
      });

      scrollReaderToTop('auto');
      expect(containerScrollTo).toHaveBeenLastCalledWith({
        top: 0,
        left: 0,
        behavior: 'auto',
      });
      expect(windowScrollTo).not.toHaveBeenCalled();
    });

    it('falls back to window.scrollTo on desktop viewports where #app-scroll-container is not a scroll container', () => {
      const windowScrollTo = vi.fn();

      const mockContainer = {
        id: APP_SCROLL_CONTAINER_ID,
        scrollTop: 0,
        scrollTo: vi.fn(),
      } as unknown as HTMLElement;

      const mockHero = {
        id: 'reader-hero-section',
        offsetWidth: 900,
        classList: {
          remove: vi.fn(),
          add: vi.fn(),
        },
        getBoundingClientRect: () => ({
          top: -600,
          bottom: -360,
          height: 240,
          left: 340,
          right: 1240,
          width: 900,
        }),
      } as unknown as HTMLElement;

      vi.stubGlobal('document', {
        getElementById: (id: string) => {
          if (id === APP_SCROLL_CONTAINER_ID) return mockContainer;
          if (id === 'reader-hero-section') return mockHero;
          return null;
        },
        querySelector: (sel: string) => {
          if (sel === '.app-header') {
            return { getBoundingClientRect: () => ({ bottom: 102 }) };
          }
          if (sel === '.audio-player-bar') {
            return { getBoundingClientRect: () => ({ top: 820 }) };
          }
          return null;
        },
      });

      vi.stubGlobal('window', {
        innerHeight: 900,
        scrollY: 740,
        scrollTo: windowScrollTo,
        setTimeout: globalThis.setTimeout.bind(globalThis),
        getComputedStyle: () => ({ overflowY: 'visible' }),
      });

      expect(getActiveScrollContainer()).toBeNull();
      const didScroll = scrollToReaderElement('reader-hero-section', { topGap: 10 });
      expect(didScroll).toBe(true);
      // 740 + (-600) - 102 - 10 = 28
      expect(windowScrollTo).toHaveBeenCalledWith({
        top: 28,
        left: 0,
        behavior: 'smooth',
      });
    });
  });

  describe('3. Mobile Docked Persistent Audio Bar DOM & CSS Invariants', () => {
    it('renders #app-scroll-container wrapping workspace content while keeping AudioPlayerBar docked outside it', () => {
      const html = renderToStaticMarkup(React.createElement(App));

      const headerIdx = html.indexOf('class="app-header"');
      const scrollMainIdx = html.indexOf('id="app-scroll-container" class="app-scroll-main"');
      const heroIdx = html.indexOf('id="reader-hero-section"');
      const titleIdx = html.indexOf('id="reader-entry-title"');
      const audioBarIdx = html.indexOf('class="audio-player-bar"');

      expect(headerIdx).toBeGreaterThan(-1);
      expect(scrollMainIdx).toBeGreaterThan(headerIdx);
      expect(heroIdx).toBeGreaterThan(scrollMainIdx);
      expect(titleIdx).toBeGreaterThan(heroIdx);
      expect(audioBarIdx).toBeGreaterThan(titleIdx);

      // Verify <footer class="audio-player-bar"> is a sibling AFTER #app-scroll-container, not nested inside it
      const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
      expect(indexHtml).toContain('id="app-scroll-container" class="app-scroll-main"');
      expect(indexHtml).toContain('id="reader-hero-section"');
      expect(indexHtml).toContain('id="reader-entry-title"');
    });

    it('enforces locked 100dvh mobile flex layout, docked audio bar, contained drawer, and 16px mobile inputs in CSS', () => {
      const baseCss = fs.readFileSync(path.join(ROOT_DIR, 'src/styles/base.css'), 'utf8');
      const layoutCss = fs.readFileSync(path.join(ROOT_DIR, 'src/styles/layout.css'), 'utf8');
      const componentsCss = fs.readFileSync(path.join(ROOT_DIR, 'src/styles/components.css'), 'utf8');
      const readerCss = fs.readFileSync(path.join(ROOT_DIR, 'src/styles/reader.css'), 'utf8');

      expect(baseCss).toContain('@media (max-width: 960px), (hover: none) and (pointer: coarse)');
      expect(baseCss).toContain('overscroll-behavior: none;');

      expect(layoutCss).toContain('.app-scroll-main');
      expect(layoutCss).toContain('overflow-y: auto;');
      expect(layoutCss).toContain('overscroll-behavior-y: contain;');

      // Ensure .app-scroll-main does NOT establish a stacking context or transform containing block
      const appScrollRule = layoutCss.match(/\.app-scroll-main\s*\{[^}]*\}/g) || [];
      expect(appScrollRule.length).toBeGreaterThanOrEqual(2);
      for (const block of appScrollRule) {
        expect(block).not.toContain('z-index');
        expect(block).not.toContain('transform');
      }

      // AudioPlayerBar must be docked as a static flex child (position: relative; flex-shrink: 0) on mobile/touch
      expect(componentsCss).toContain('@media (max-width: 960px), (hover: none) and (pointer: coarse)');
      expect(componentsCss).toContain('position: relative;');
      expect(componentsCss).toContain('flex-shrink: 0;');
      expect(componentsCss).toContain('.audio-secondary-drawer.is-open');
      expect(componentsCss).toContain('font-size: 16px !important;');

      // Mobile hero places #reader-entry-title (.hero-identity-row) immediately after badges and before action buttons
      expect(readerCss).toContain('#reader-hero-section .hero-top-bar');
      expect(readerCss).toContain('#reader-hero-section .hero-identity-row');
    });
  });
});
