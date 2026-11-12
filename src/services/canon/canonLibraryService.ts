/**
 * src/services/canon/canonLibraryService.ts
 *
 * Loads the 藏经全文库 (scripts/build-canon-library.ts): the catalog of every CBETA text and,
 * on demand, one text's complete body. Files are gzip JSON, served from the Hugging Face CDN
 * next to the corpus shards, with the site's own /canon/ as fallback.
 */
import type { CanonCatalogItem, CanonTextFile } from '../../core/canon/canonLibraryTypes';
import { HF_CORPUS_CDN_BASE } from '../corpus/cloudCorpusService';

export const CANON_CDN_BASE = HF_CORPUS_CDN_BASE.replace(/\/corpus$/, '/canon');
const BASES = [CANON_CDN_BASE, '/canon'];

async function gunzipJson<T>(resp: Response): Promise<T> {
  const buf = new Uint8Array(await resp.arrayBuffer());
  // Already decoded by the server (Content-Encoding) → plain JSON.
  if (!(buf[0] === 0x1f && buf[1] === 0x8b)) return JSON.parse(new TextDecoder().decode(buf)) as T;
  const ds = new DecompressionStream('gzip');
  const stream = new Blob([buf]).stream().pipeThrough(ds);
  return JSON.parse(await new Response(stream).text()) as T;
}

async function fetchGz<T>(rel: string): Promise<T> {
  let lastErr: unknown;
  for (const base of BASES) {
    try {
      const r = await fetch(`${base}/${rel}`);
      if (r.ok) return await gunzipJson<T>(r);
      lastErr = new Error(`${r.status} ${base}/${rel}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

let catalogPromise: Promise<CanonCatalogItem[]> | null = null;
export function loadCanonCatalog(): Promise<CanonCatalogItem[]> {
  catalogPromise ??= fetchGz<CanonCatalogItem[]>('catalog.json.gz').catch((e) => {
    catalogPromise = null;
    throw e;
  });
  return catalogPromise;
}

const textCache = new Map<string, Promise<CanonTextFile>>();
export function loadCanonText(item: Pick<CanonCatalogItem, 'id' | 'collection'>): Promise<CanonTextFile> {
  let p = textCache.get(item.id);
  if (!p) {
    p = fetchGz<CanonTextFile>(`cbeta/${item.collection}/${item.id}.json.gz`);
    p.catch(() => textCache.delete(item.id));
    textCache.set(item.id, p);
  }
  return p;
}

/** Collection names (CBETA canons.json abbreviations). */
export const CBETA_COLLECTION_ZH: Record<string, string> = {
  T: '大正新脩大藏經', X: '卍新纂續藏經', J: '嘉興大藏經', F: '房山石經', A: '趙城金藏', B: '大藏經補編',
  C: '中華大藏經', D: '國家圖書館善本佛典', G: '佛教大藏經', GA: '中國佛寺史志彙刊', GB: '中國佛寺志叢刊',
  I: '北朝佛教石刻拓片百品', K: '高麗大藏經', L: '乾隆大藏經', LC: '呂澂佛學著作集', M: '卍正藏經',
  N: '漢譯南傳大藏經', P: '永樂北藏', S: '宋藏遺珍', U: '洪武南藏', TX: '太虛大師全書', Y: '印順法師佛學著作集',
  ZS: '正史佛教資料類編', ZW: '藏外佛教文獻', CC: '中國禪宗典籍', YP: '演培法師全集',
};

/** Normalized search: case-insensitive, whitespace removed. */
export function filterCatalog(
  items: CanonCatalogItem[],
  query: string,
  opts: { collection?: string; dharaniOnly?: boolean } = {}
): CanonCatalogItem[] {
  const q = query.replace(/\s+/g, '').toLowerCase();
  return items.filter(
    (c) =>
      (!opts.collection || c.collection === opts.collection) &&
      (!opts.dharaniOnly || c.dharani > 0) &&
      (!q || `${c.id}${c.title}${c.byline}`.replace(/\s+/g, '').toLowerCase().includes(q))
  );
}
