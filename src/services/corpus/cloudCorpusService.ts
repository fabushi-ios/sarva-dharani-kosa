/**
 * src/services/corpus/cloudCorpusService.ts
 *
 * Plan 3 Cloud Corpus & Search Index Service (Modeled on browserOnnxTtsEngine.ts)
 *
 * Architecture:
 * 1. Zero-Wait First Screen (< 80ms):
 *    - Boots immediately with `FIRST_SCREEN_CORPUS` (29 flagship entries covering all categories & DB1–DB12).
 * 2. Cloud Shards on Hugging Face Hub CDN + Same-Origin `/corpus/` + `/api/search`:
 *    - Hosts compressed `.json.gz` & `.json` shards on Hugging Face Hub CDN
 *      (`https://huggingface.co/bhrum108/sarva-dharani-kosa-tts/resolve/main/corpus/...`)
 *      and `/corpus/...` so initial JS bundle drops from 7.05 MB to ~350 KB.
 * 3. Native Gzip Stream Decompression (`DecompressionStream('gzip')`) + Persistent `CacheStorage`:
 *    - Even on static hosts without HTTP Gzip headers (e.g. `*.static.hf.space`), transfers
 *      pre-compressed `.json.gz` shards (85% smaller) and caches decompressed JSON permanently
 *      in Browser CacheStorage (`sarva-dharani-corpus-v1`) for 0ms repeat loads.
 */

import type { DharaniEntry } from '../../types/kosaTypes';
import type { TaishoMikkyoFileEntry } from '../../data/kosa-generated/taishoMikkyoIndex';
import {
  FIRST_SCREEN_CORPUS,
  attachLazyWordsToEntries,
} from '../../data/firstScreenCorpus';
import { CORPUS_AUTHORITATIVE_STATS } from '../../data/corpusStats';
import {
  hydrateCloudSearchIndex,
  hydrateTaishoSearchIndex,
  type CloudSearchIndexPayload,
  type SearchSuggestionItem,
} from '../../core/search/searchEngine';
import { hydrateExtendedSanskritLexicon } from '../../core/sanskrit/sanskritLexicon';

export const HF_CORPUS_CDN_BASE =
  'https://huggingface.co/bhrum108/sarva-dharani-kosa-tts/resolve/main/corpus';

export const CORPUS_CACHE_BUCKET = 'sarva-dharani-corpus-v11';

export interface CloudCorpusStatus {
  phase: 'first-screen' | 'streaming-shards' | 'ready';
  loadedCount: number;
  totalCount: number;
  searchIndexReady: boolean;
  source: 'memory' | 'cache-storage' | 'cloud-cdn' | 'local-shard';
}

type CorpusListener = (entries: DharaniEntry[], status: CloudCorpusStatus) => void;

let currentEntries: DharaniEntry[] = FIRST_SCREEN_CORPUS;
let currentStatus: CloudCorpusStatus = {
  phase: 'first-screen',
  loadedCount: FIRST_SCREEN_CORPUS.length,
  totalCount: CORPUS_AUTHORITATIVE_STATS.totalCuratedAndCanonicalEntries,
  searchIndexReady: false,
  source: 'memory',
};

let hydrationPromise: Promise<DharaniEntry[]> | null = null;
const listeners = new Set<CorpusListener>();

function notifyListeners() {
  const snapshotStatus = { ...currentStatus };
  for (const listener of listeners) {
    listener(currentEntries, snapshotStatus);
  }
}

let didPurgeLegacyCache = false;

async function openCorpusCache(): Promise<Cache | null> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return null;
  }
  try {
    if (!didPurgeLegacyCache) {
      didPurgeLegacyCache = true;
      window.caches.delete('sarva-dharani-corpus-v1').catch(() => {});
      window.caches.delete('sarva-dharani-corpus-v2').catch(() => {});
      window.caches.delete('sarva-dharani-corpus-v3').catch(() => {});
      window.caches.delete('sarva-dharani-corpus-v4').catch(() => {});
      window.caches.delete('sarva-dharani-corpus-v5').catch(() => {});
      window.caches.delete('sarva-dharani-corpus-v6').catch(() => {});
      window.caches.delete('sarva-dharani-corpus-v7').catch(() => {});
      window.caches.delete('sarva-dharani-corpus-v8').catch(() => {});
      window.caches.delete('sarva-dharani-corpus-v9').catch(() => {});
      window.caches.delete('sarva-dharani-corpus-v10').catch(() => {});
    }
    return await window.caches.open(CORPUS_CACHE_BUCKET);
  } catch {
    return null;
  }
}

async function decompressGzipResponseToJson<T>(resp: Response): Promise<T> {
  if (typeof DecompressionStream !== 'undefined' && resp.body) {
    const ds = new DecompressionStream('gzip');
    const decompressedStream = resp.body.pipeThrough(ds);
    const decompressedResp = new Response(decompressedStream);
    return (await decompressedResp.json()) as T;
  }
  return (await resp.json()) as T;
}

/**
 * Fetches a corpus JSON shard with CacheStorage persistence and `.json.gz` stream decompression.
 * Tries same-origin `/corpus/{file}.gz` and Hugging Face Hub CDN (`HF_CORPUS_CDN_BASE/{file}.gz`).
 */
export async function fetchCachedJsonShard<T>(
  fileName: string
): Promise<{ data: T; fromCache: boolean; source: 'cache-storage' | 'cloud-cdn' | 'local-shard' }> {
  const cacheKeyUrl = `https://sarva-dharani-kosa.local/corpus/${fileName}`;
  const cache = await openCorpusCache();

  if (cache) {
    try {
      const cachedResp = await cache.match(cacheKeyUrl);
      if (cachedResp && cachedResp.ok) {
        const data = (await cachedResp.json()) as T;
        return { data, fromCache: true, source: 'cache-storage' };
      }
    } catch {
      // Ignore cache read error and proceed to network fetch
    }
  }

  const supportsGzipStream = typeof DecompressionStream !== 'undefined';
  const candidateSources: Array<{
    url: string;
    isGz: boolean;
    source: 'local-shard' | 'cloud-cdn';
  }> = [];

  if (supportsGzipStream) {
    candidateSources.push(
      { url: `/corpus/${fileName}.gz?v=11`, isGz: true, source: 'local-shard' },
      { url: `${HF_CORPUS_CDN_BASE}/${fileName}.gz?v=11`, isGz: true, source: 'cloud-cdn' }
    );
  }
  candidateSources.push(
    { url: `/corpus/${fileName}?v=11`, isGz: false, source: 'local-shard' },
    { url: `/api/corpus/${fileName}?v=11`, isGz: false, source: 'local-shard' },
    { url: `${HF_CORPUS_CDN_BASE}/${fileName}?v=11`, isGz: false, source: 'cloud-cdn' }
  );

  let lastErr: unknown = null;
  for (const candidate of candidateSources) {
    try {
      const resp = await fetch(candidate.url, { mode: 'cors' });
      if (!resp.ok) continue;

      const contentType = (resp.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('text/html')) {
        // SPA fallback returned index.html instead of shard
        continue;
      }

      let data: T;
      if (candidate.isGz) {
        // If server already applied Content-Encoding: gzip, browser auto-decompresses; otherwise pipe through DecompressionStream
        const contentEncoding = (resp.headers.get('content-encoding') || '').toLowerCase();
        if (contentEncoding.includes('gzip') || contentEncoding.includes('br')) {
          data = (await resp.json()) as T;
        } else {
          data = await decompressGzipResponseToJson<T>(resp);
        }
      } else {
        data = (await resp.json()) as T;
      }

      if (cache && data) {
        try {
          const jsonBlob = new Blob([JSON.stringify(data)], {
            type: 'application/json; charset=utf-8',
          });
          await cache.put(
            cacheKeyUrl,
            new Response(jsonBlob, {
              status: 200,
              headers: { 'Content-Type': 'application/json; charset=utf-8' },
            })
          );
        } catch {
          // Ignore quota errors
        }
      }

      return { data, fromCache: false, source: candidate.source };
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error(`Failed to fetch corpus shard: ${fileName}`);
}

/**
 * Queries the backend `/api/search` endpoint when available.
 */
export async function queryCloudSearchApi(
  query: string,
  limit = 20
): Promise<SearchSuggestionItem[] | null> {
  if (!query.trim()) return null;
  try {
    const params = new URLSearchParams({
      q: query.trim(),
      limit: String(limit),
    });
    const resp = await fetch(`/api/search?${params.toString()}`);
    if (!resp.ok) return null;
    const ct = (resp.headers.get('content-type') || '').toLowerCase();
    if (!ct.includes('application/json')) return null;
    const payload = (await resp.json()) as { results?: SearchSuggestionItem[] };
    return Array.isArray(payload.results) ? payload.results : null;
  } catch {
    return null;
  }
}

/**
 * Loads all 2,482 entries + pre-computed search index + 614 Taishō scriptures + 41,746-stem Sanskrit lexicon
 * asynchronously from CacheStorage or Hugging Face Cloud Corpus Shards.
 */
export function loadFullCloudCorpus(): Promise<DharaniEntry[]> {
  if (currentStatus.phase === 'ready' && currentEntries.length >= 2000) {
    return Promise.resolve(currentEntries);
  }
  if (hydrationPromise) {
    return hydrationPromise;
  }

  currentStatus = {
    ...currentStatus,
    phase: 'streaming-shards',
  };
  notifyListeners();

  hydrationPromise = (async () => {
    // Hydrate the extended 35,245-stem Sanskrit lexicon in parallel (non-blocking if CDN lags)
    fetchCachedJsonShard<Record<string, [string, string?, string?]>>('sanskrit-lexicon-v1.json')
      .then((lexRes) => {
        hydrateExtendedSanskritLexicon(lexRes.data);
        notifyListeners();
      })
      .catch(() => {});

    try {
      // Load search index + Taishō index + 3 entry shards concurrently
      const [curatedRes, gretilRes, db12Res, searchIdxRes, taishoRes] = await Promise.all([
        fetchCachedJsonShard<DharaniEntry[]>('shard-curated.json'),
        fetchCachedJsonShard<DharaniEntry[]>('shard-gretil.json'),
        fetchCachedJsonShard<DharaniEntry[]>('shard-12db.json'),
        fetchCachedJsonShard<CloudSearchIndexPayload>('search-index-v1.json'),
        fetchCachedJsonShard<Array<TaishoMikkyoFileEntry & { normHay?: string }>>(
          'shard-taisho-index.json'
        ),
      ]);

      hydrateCloudSearchIndex(searchIdxRes.data);
      hydrateTaishoSearchIndex(taishoRes.data);

      const fullCorpus = attachLazyWordsToEntries([
        ...curatedRes.data,
        ...db12Res.data,
        ...gretilRes.data,
      ]);

      currentEntries = fullCorpus;
      currentStatus = {
        phase: 'ready',
        loadedCount: fullCorpus.length,
        totalCount: fullCorpus.length,
        searchIndexReady: true,
        source: curatedRes.fromCache ? 'cache-storage' : curatedRes.source,
      };
      notifyListeners();
      return fullCorpus;
    } catch {
      // Fallback for offline/unit-test environments without static shard serving
      try {
        const mod = await import('../../data/index');
        if (Array.isArray(mod.BUILTIN_DHARANI_CORPUS) && mod.BUILTIN_DHARANI_CORPUS.length > 0) {
          currentEntries = mod.BUILTIN_DHARANI_CORPUS;
          currentStatus = {
            phase: 'ready',
            loadedCount: currentEntries.length,
            totalCount: currentEntries.length,
            searchIndexReady: true,
            source: 'memory',
          };
          notifyListeners();
        }
      } catch {
        // Keep FIRST_SCREEN_CORPUS
      }
      return currentEntries;
    }
  })();

  return hydrationPromise;
}

export function getCloudCorpusSnapshot(): {
  entries: DharaniEntry[];
  status: CloudCorpusStatus;
} {
  return {
    entries: currentEntries,
    status: { ...currentStatus },
  };
}

export function subscribeCloudCorpus(listener: CorpusListener): () => void {
  listeners.add(listener);
  listener(currentEntries, { ...currentStatus });
  return () => {
    listeners.delete(listener);
  };
}
