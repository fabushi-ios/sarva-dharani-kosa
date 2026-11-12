/**
 * Viewport & Reader Scroll Utilities
 *
 * Unifies programmatic scrolling across:
 *   1. Mobile / touch devices (`#app-scroll-container` with `overflow-y: auto` inside a
 *      locked `100dvh` flex shell so the bottom AudioPlayerBar can never be dragged or
 *      displaced by browser toolbar transitions or rubber-band overscroll).
 *   2. Desktop viewports (`window` scrolling with sticky `.app-header`).
 */

export const APP_SCROLL_CONTAINER_ID = 'app-scroll-container';

export function getActiveScrollContainer(): HTMLElement | null {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return null;
  }
  const el = document.getElementById(APP_SCROLL_CONTAINER_ID);
  if (!el) return null;
  const overflowY = window.getComputedStyle(el).overflowY;
  if (overflowY === 'auto' || overflowY === 'scroll') {
    return el;
  }
  return null;
}

export interface ReadingViewportBounds {
  top: number;
  bottom: number;
  height: number;
  centerY: number;
  container: HTMLElement | null;
}

export function getReadingViewportBounds(): ReadingViewportBounds {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { top: 0, bottom: 800, height: 800, centerY: 360, container: null };
  }

  const container = getActiveScrollContainer();
  if (container) {
    const rect = container.getBoundingClientRect();
    const height = Math.max(160, rect.height);
    return {
      top: rect.top,
      bottom: rect.bottom,
      height,
      centerY: Math.round(rect.top + height * 0.44),
      container,
    };
  }

  const headerEl = document.querySelector<HTMLElement>('.app-header');
  const footerEl = document.querySelector<HTMLElement>('.audio-player-bar');
  const top = headerEl ? Math.max(0, headerEl.getBoundingClientRect().bottom) : 96;
  const bottom = footerEl
    ? Math.min(window.innerHeight, footerEl.getBoundingClientRect().top)
    : window.innerHeight - 84;
  const height = Math.max(160, bottom - top);

  return {
    top,
    bottom,
    height,
    centerY: Math.round(top + height * 0.44),
    container: null,
  };
}

export interface ScrollToReaderOptions {
  behavior?: ScrollBehavior;
  topGap?: number;
  highlight?: boolean;
  block?: 'start' | 'nearest';
}

export function scrollToReaderElement(
  elOrId: HTMLElement | string | null | undefined,
  options: ScrollToReaderOptions = {}
): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined' || !elOrId) {
    return false;
  }

  const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
  if (!el) return false;

  const {
    behavior = 'smooth',
    topGap = 12,
    highlight = false,
    block = 'start',
  } = options;

  const bounds = getReadingViewportBounds();
  const elRect = el.getBoundingClientRect();

  if (block === 'nearest') {
    const topThreshold = bounds.top + topGap;
    const bottomThreshold = bounds.bottom - topGap;
    if (elRect.top >= topThreshold && elRect.bottom <= bottomThreshold) {
      return true;
    }
  }

  if (bounds.container) {
    const targetScrollTop = Math.max(
      0,
      bounds.container.scrollTop + (elRect.top - bounds.top) - topGap
    );
    bounds.container.scrollTo({
      top: targetScrollTop,
      left: 0,
      behavior,
    });
  } else {
    const targetWindowTop = Math.max(
      0,
      window.scrollY + elRect.top - bounds.top - topGap
    );
    window.scrollTo({
      top: targetWindowTop,
      left: 0,
      behavior,
    });
  }

  if (highlight) {
    el.classList.remove('is-jump-highlighted');
    void el.offsetWidth;
    el.classList.add('is-jump-highlighted');
    window.setTimeout(() => {
      el.classList.remove('is-jump-highlighted');
    }, 1700);
  }

  return true;
}

export function scrollActiveViewportByDeltaY(
  deltaY: number,
  behavior: ScrollBehavior = 'smooth'
): void {
  if (typeof window === 'undefined') return;
  const container = getActiveScrollContainer();
  if (container) {
    container.scrollTo({
      top: Math.max(0, container.scrollTop + deltaY),
      left: 0,
      behavior,
    });
  } else {
    window.scrollTo({
      top: Math.max(0, window.scrollY + deltaY),
      left: 0,
      behavior,
    });
  }
}

export function scrollReaderToTop(behavior: ScrollBehavior = 'auto'): void {
  if (typeof window === 'undefined') return;
  const container = getActiveScrollContainer();
  if (container) {
    container.scrollTo({ top: 0, left: 0, behavior });
  } else {
    window.scrollTo({ top: 0, left: 0, behavior });
  }
}
