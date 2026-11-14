import type { CanonCatalogItem, CanonTextFile } from '../../core/canon/canonLibraryTypes';
import {
  resolveCanonItemBulei,
  type CbetaBuleiId,
} from '../../core/canon/cbetaBulei';
import type { DharaniEntry, DharaniVerse } from '../../types/kosaTypes';
import { HF_CORPUS_CDN_BASE } from '../corpus/cloudCorpusService';
import { fetchAndParseCbetaXmlLive } from '../cbeta/cbetaLiveService';
import {
  normalizeLiteralSearchText,
  normalizeSearchText,
  relaxedCjkQueries,
} from '../../core/search/searchEngine';
import {
  buildWordGlossesFromIast,
  generateVerseChinesePhonetics,
} from '../../core/sanskrit/phoneticMapper';
import { translateSanskritVerse } from '../../core/sanskrit/sanskritLexicon';
import { isSoleScriptureEntry } from '../../core/taishoEntryMatch';

export const CANON_CDN_BASE = HF_CORPUS_CDN_BASE.replace(/\/corpus$/, '/canon');
const BASES = ['/hf-cdn/canon', '/canon', CANON_CDN_BASE];
const CANON_CACHE_NAME = 'sarva-canon-library-v2';

export interface CanonFullTextHit {
  item: CanonCatalogItem;
  buleiId: CbetaBuleiId;
  snippet: string;
  hitCount?: number;
}

interface CanonSearchBucketDoc {
  id: string;
  col: string;
  title: string;
  byline: string;
  dharani: number;
  norm: string;
  sample: string;
}

async function gunzipJson<T>(resp: Response): Promise<T> {
  const ct = (resp.headers.get('content-type') || '').toLowerCase();
  if (ct.includes('text/html')) {
    throw new Error('Received SPA HTML fallback instead of canon JSON/gzip');
  }
  const buf = new Uint8Array(await resp.arrayBuffer());
  if (buf.length < 2) throw new Error('Empty canon payload');
  if (!(buf[0] === 0x1f && buf[1] === 0x8b)) {
    const rawStr = new TextDecoder().decode(buf);
    if (rawStr.trimStart().startsWith('<!DOCTYPE') || rawStr.trimStart().startsWith('<html')) {
      throw new Error('HTML fallback');
    }
    return JSON.parse(rawStr) as T;
  }
  const ds = new DecompressionStream('gzip');
  const stream = new Blob([buf]).stream().pipeThrough(ds);
  return JSON.parse(await new Response(stream).text()) as T;
}

async function fetchGz<T>(rel: string): Promise<T> {
  const cacheReqPath = `/_canon_cache_v2/${rel}`;
  if (typeof caches !== 'undefined' && typeof window !== 'undefined') {
    try {
      const cache = await caches.open(CANON_CACHE_NAME);
      const hit = await cache.match(cacheReqPath);
      if (hit) {
        return (await hit.json()) as T;
      }
    } catch {
      // ignore CacheStorage error
    }
  }

  let lastErr: unknown;
  for (const base of BASES) {
    try {
      const r = await fetch(`${base}/${rel}`);
      if (!r.ok) {
        lastErr = new Error(`${r.status} ${base}/${rel}`);
        continue;
      }
      const parsed = await gunzipJson<T>(r);
      if (typeof caches !== 'undefined' && typeof window !== 'undefined') {
        try {
          const cache = await caches.open(CANON_CACHE_NAME);
          await cache.put(
            cacheReqPath,
            new Response(JSON.stringify(parsed), {
              headers: { 'Content-Type': 'application/json; charset=utf-8' },
            })
          );
        } catch {
          // ignore quota error
        }
      }
      return parsed;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

let catalogPromise: Promise<CanonCatalogItem[]> | null = null;
let resolvedCatalogSnapshot: CanonCatalogItem[] | null = null;

export function getLoadedCanonCatalogSnapshot(): CanonCatalogItem[] | null {
  return resolvedCatalogSnapshot;
}

export function loadCanonCatalog(): Promise<CanonCatalogItem[]> {
  catalogPromise ??= fetchGz<CanonCatalogItem[]>('catalog.json.gz')
    .then((cat) => {
      resolvedCatalogSnapshot = cat;
      return cat;
    })
    .catch((e) => {
      catalogPromise = null;
      throw e;
    });
  return catalogPromise;
}

const textCache = new Map<string, Promise<CanonTextFile>>();
const loadedTextsSync = new Map<string, CanonTextFile>();

export function loadCanonText(
  item: Pick<CanonCatalogItem, 'id' | 'collection'>
): Promise<CanonTextFile> {
  let p = textCache.get(item.id);
  if (!p) {
    const col = item.collection || (item.id.match(/^[A-Z]+/) || ['T'])[0];
    p = fetchGz<CanonTextFile>(`cbeta/${col}/${item.id}.json.gz`)
      .catch(async () => {
        const vol = (item.id.match(/^([A-Z]{1,2}\d{2,3})n/) || ['', ''])[1];
        const rawUrl = `https://raw.githubusercontent.com/cbeta-org/xml-p5/master/${col}/${vol}/${item.id}.xml`;
        const live = await fetchAndParseCbetaXmlLive(item.id, vol, rawUrl);
        const KIND = { head: 'h', text: 't', dharani: 'd' } as const;
        return {
          id: item.id,
          collection: col,
          vol,
          title: live.titleZh,
          byline: live.translator,
          url: rawUrl,
          paragraphs: live.fullParagraphs.map((fp) => [KIND[fp.kind], fp.text] as [string, string]),
          dharani: live.dharaniBlocks.map((b) => ({
            title: b.blockTitleZh,
            text: b.text,
            ...(b.siddhamText ? { siddham: b.siddhamText } : {}),
            ...(b.iastText ? { iast: b.iastText } : {}),
          })),
        } satisfies CanonTextFile;
      })
      .then((t) => {
        loadedTextsSync.set(item.id, t);
        return t;
      });
    p.catch(() => textCache.delete(item.id));
    textCache.set(item.id, p);
  }
  return p;
}

export const CBETA_COLLECTION_ZH: Record<string, string> = {
  T: '大正新脩大藏經',
  X: '卍新纂續藏經',
  J: '嘉興大藏經',
  F: '房山石經',
  A: '趙城金藏',
  B: '大藏經補編',
  C: '中華大藏經',
  D: '國家圖書館善本佛典',
  G: '佛教大藏經',
  GA: '中國佛寺史志彙刊',
  GB: '中國佛寺志叢刊',
  I: '北朝佛教石刻拓片百品',
  K: '高麗大藏經',
  L: '乾隆大藏經',
  LC: '呂澂佛學著作集',
  M: '卍正藏經',
  N: '漢譯南傳大藏經',
  P: '永樂北藏',
  S: '宋藏遺珍',
  U: '洪武南藏',
  TX: '太虛大師全書',
  Y: '印順法師佛學著作集',
  ZS: '正史佛教資料類編',
  ZW: '藏外佛教文獻',
  CC: '中國禪宗典籍',
  YP: '演培法師全集',
};

const CATALOG_NORM_CACHE = new WeakMap<
  CanonCatalogItem,
  { litHay: string; normHay: string; rawCompact: string }
>();

function getCatalogNorm(
  c: CanonCatalogItem
): { litHay: string; normHay: string; rawCompact: string } {
  const hit = CATALOG_NORM_CACHE.get(c);
  if (hit) return hit;
  const shortNum = c.id.replace(/^[A-Z]+\d+n0*/i, '');
  const rawCompact = `${c.id}${shortNum}${c.title}${c.byline}`.replace(/\s+/g, '').toLowerCase();
  const litHay = normalizeLiteralSearchText(`${c.id} ${shortNum} ${c.title} ${c.byline}`);
  const normHay = normalizeSearchText(`${c.id} ${shortNum} ${c.title} ${c.byline}`);
  const val = { litHay, normHay, rawCompact };
  CATALOG_NORM_CACHE.set(c, val);
  return val;
}

export interface FilterCatalogOptions {
  collection?: string;
  dharaniOnly?: boolean;
  dharaniMode?: 'all' | 'with-dharani' | 'without-dharani';
  buleiId?: CbetaBuleiId | 'all';
  buleiSet?: Set<CbetaBuleiId>;
}

export function filterCatalog(
  items: CanonCatalogItem[],
  query: string,
  opts: FilterCatalogOptions = {}
): CanonCatalogItem[] {
  const mode = opts.dharaniMode ?? (opts.dharaniOnly ? 'with-dharani' : 'all');
  const trimmed = query.trim();
  const rawCompactQ = trimmed.replace(/\s+/g, '').toLowerCase();
  const litQ = trimmed ? normalizeLiteralSearchText(trimmed).replace(/\s+/g, ' ').trim() : '';
  const normQ = trimmed ? normalizeSearchText(trimmed).replace(/\s+/g, ' ').trim() : '';

  const basePool = items.filter((c) => {
    if (opts.collection && c.collection !== opts.collection) return false;
    if (mode === 'with-dharani' && c.dharani <= 0) return false;
    if (mode === 'without-dharani' && c.dharani > 0) return false;
    if (opts.buleiId && opts.buleiId !== 'all') {
      if (resolveCanonItemBulei(c) !== opts.buleiId) return false;
    }
    if (opts.buleiSet && opts.buleiSet.size > 0) {
      if (!opts.buleiSet.has(resolveCanonItemBulei(c))) return false;
    }
    return true;
  });

  if (!trimmed) return basePool;

  if (litQ) {
    const litTokens = litQ.split(/\s+/).filter(Boolean);
    const litMatched = basePool.filter((c) => {
      const idx = getCatalogNorm(c);
      if (idx.rawCompact.includes(rawCompactQ)) return true;
      if (idx.litHay.includes(litQ)) return true;
      return litTokens.length > 1 && litTokens.every((tk) => idx.litHay.includes(tk));
    });
    if (litMatched.length > 0) return litMatched;
  }

  for (const activeNormQ of [normQ, ...relaxedCjkQueries(normQ)]) {
    if (!activeNormQ) continue;
    const tokens = activeNormQ.split(/\s+/).filter(Boolean);
    const matched = basePool.filter((c) => {
      const idx = getCatalogNorm(c);
      if (idx.normHay.includes(activeNormQ)) return true;
      return tokens.length > 1 && tokens.every((tk) => idx.normHay.includes(tk));
    });
    if (matched.length > 0) return matched;
  }

  return [];
}

function hashGramToBucket(gram: string): number {
  let h = 2166136261;
  for (let i = 0; i < gram.length; i++) {
    h ^= gram.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 64;
}

const bucketCache = new Map<string, Promise<CanonSearchBucketDoc[]>>();

export async function searchCanonFullText(
  query: string,
  catalog: CanonCatalogItem[],
  limit = 60,
  buleiSet?: Set<CbetaBuleiId>
): Promise<CanonFullTextHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const litQ = normalizeLiteralSearchText(trimmed).replace(/\s+/g, '');
  const normQ = normalizeSearchText(trimmed).replace(/\s+/g, '');
  if (!normQ) return [];

  const catalogById = new Map(catalog.map((c) => [c.id, c]));
  const hits: CanonFullTextHit[] = [];
  const seen = new Set<string>();

  for (const [id, textFile] of loadedTextsSync.entries()) {
    const catItem = catalogById.get(id);
    if (!catItem) continue;
    const buleiId = resolveCanonItemBulei(catItem);
    if (buleiSet && buleiSet.size > 0 && !buleiSet.has(buleiId)) continue;

    let hitCount = 0;
    let firstSnippet = '';
    for (const [, pText] of textFile.paragraphs) {
      if (pText.includes(trimmed) || (litQ && normalizeLiteralSearchText(pText).includes(litQ))) {
        hitCount += 1;
        if (!firstSnippet) {
          const idx = pText.indexOf(trimmed);
          const start = idx >= 0 ? Math.max(0, idx - 34) : 0;
          firstSnippet = pText.slice(start, start + 140);
        }
      }
    }
    if (hitCount > 0) {
      seen.add(id);
      hits.push({ item: catItem, buleiId, snippet: firstSnippet, hitCount });
    }
    if (hits.length >= limit) return hits;
  }

  const chars = Array.from(normQ);
  const gram = chars.length >= 2 ? chars[0] + chars[1] : chars[0];
  if (gram) {
    const hex = hashGramToBucket(gram).toString(16).padStart(2, '0');
    try {
      let bp = bucketCache.get(hex);
      if (!bp) {
        bp = fetchGz<CanonSearchBucketDoc[]>(`search-buckets/bucket-${hex}.json.gz`);
        bp.catch(() => bucketCache.delete(hex));
        bucketCache.set(hex, bp);
      }
      const docs = await bp;
      const literalBucketDocs: CanonFullTextHit[] = [];
      const fallbackBucketDocs: CanonFullTextHit[] = [];

      for (const d of docs) {
        if (seen.has(d.id)) continue;
        if (!d.norm.includes(normQ)) continue;
        const catItem =
          catalogById.get(d.id) || {
            id: d.id,
            collection: d.col,
            vol: (d.id.match(/^([A-Z]{1,2}\d{2,3})n/) || ['', ''])[1],
            title: d.title,
            byline: d.byline,
            chars: d.sample.length,
            dharani: d.dharani,
          };
        const buleiId = resolveCanonItemBulei(catItem);
        if (buleiSet && buleiSet.size > 0 && !buleiSet.has(buleiId)) continue;

        const isLiteralHit =
          d.sample.includes(trimmed) ||
          d.title.includes(trimmed) ||
          (litQ.length > 0 && normalizeLiteralSearchText(`${d.title} ${d.sample}`).includes(litQ));

        const entryHit: CanonFullTextHit = {
          item: catItem,
          buleiId,
          snippet: d.sample,
          hitCount: 1,
        };
        if (isLiteralHit) literalBucketDocs.push(entryHit);
        else fallbackBucketDocs.push(entryHit);
      }

      const chosen = literalBucketDocs.length > 0 ? literalBucketDocs : fallbackBucketDocs.slice(0, Math.min(8, limit));
      for (const h of chosen) {
        if (hits.length >= limit) break;
        seen.add(h.item.id);
        hits.push(h);
      }
    } catch {
      // optional bucket shard
    }
  }

  return hits;
}

function splitCanonDharaniClauses(rawText: string): string[] {
  const cleaned = rawText.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  const parts = cleaned
    .split(/[。！？；;｜|]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);
  if (parts.length > 0) return parts;
  return [cleaned];
}

export function buildReaderEntryFromCanonItem(
  item: CanonCatalogItem,
  canonText?: CanonTextFile | null,
  existingEntries: DharaniEntry[] = []
): DharaniEntry {
  const colNameZh = CBETA_COLLECTION_ZH[item.collection] || item.collection;
  const vol = item.vol || (item.id.match(/^([A-Z]{1,2}\d{2,3})n/) || ['', item.collection])[1];
  const xmlUrl = `https://raw.githubusercontent.com/cbeta-org/xml-p5/master/${item.collection}/${vol}/${item.id}.xml`;
  const onlineUrl = `https://cbetaonline.dila.edu.tw/zh/${item.id}`;

  const matchedSoleEntries = existingEntries.filter(
    (e) =>
      (e.provenance.cbetaId === item.id || e.taishoNo.startsWith(item.id)) &&
      isSoleScriptureEntry(e, item.id)
  );

  let verses: DharaniVerse[] = [];
  const interlinearTokens = matchedSoleEntries[0]?.provenance.cbetaInterlinearTokens;

  if (item.dharani > 0 || (canonText && canonText.dharani.length > 0)) {
    if (matchedSoleEntries.length === 1 && matchedSoleEntries[0].verses.length > 0) {
      verses = matchedSoleEntries[0].verses;
    } else if (canonText && canonText.dharani.length > 0) {
      let globalIdx = 1;
      for (let bIdx = 0; bIdx < canonText.dharani.length; bIdx++) {
        const blk = canonText.dharani[bIdx];
        const clauses = splitCanonDharaniClauses(blk.text);
        const hasOrigIast = Boolean(blk.iast && blk.iast.trim());
        const hasOrigSiddham = Boolean(
          blk.siddham && /[\u{11580}-\u{115FF}]/u.test(blk.siddham)
        );
        const rawIastClauses = hasOrigIast
          ? blk.iast!.split(/\s*\|\|?\s*/).map((s) => s.trim()).filter(Boolean)
          : [];

        clauses.forEach((clauseZh, cIdx) => {
          const clauseHasDbIast =
            hasOrigIast && (rawIastClauses.length === clauses.length || clauses.length === 1);
          const matchedIast = clauseHasDbIast
            ? rawIastClauses.length === clauses.length
              ? rawIastClauses[cIdx]
              : blk.iast!.trim()
            : '';

          const phon = clauseHasDbIast ? generateVerseChinesePhonetics(matchedIast) : null;
          const sem = clauseHasDbIast ? translateSanskritVerse(matchedIast) : null;
          const vNo = globalIdx++;

          verses.push({
            id: `canon-${item.id}-b${bIdx + 1}-v${cIdx + 1}`,
            index: vNo,
            iast: matchedIast,
            ...(hasOrigSiddham && clauses.length === 1 ? { siddhamOriginal: blk.siddham!.trim() } : {}),
            classicalTranslitZh: clauseZh || phon?.classicalTranslitZh || '',
            modernPhoneticZh: phon ? phon.modernPhoneticZh : '',
            meaningZh: sem ? sem.meaningZh : '',
            meaningEn: sem ? sem.meaningEn : '',
            tangNoteZh: blk.title
              ? `${blk.title}（第 ${cIdx + 1}/${clauses.length} 句）`
              : `本经第 ${bIdx + 1} 段陀罗尼 · 第 ${cIdx + 1}/${clauses.length} 句`,
            words: clauseHasDbIast ? buildWordGlossesFromIast(matchedIast) : [],
            fieldSources: {
              siddham: hasOrigSiddham && clauses.length === 1 ? 'db-original' : 'derived-reference',
              devanagari: 'derived-reference',
              iast: clauseHasDbIast ? 'db-original' : 'derived-reference',
              modernPhoneticZh: 'derived-reference',
              classicalTranslitZh: 'db-original',
              ipa: 'derived-reference',
              prosody: 'derived-reference',
              meaningZh: 'derived-reference',
              meaningEn: 'derived-reference',
              words: 'derived-reference',
            },
          });
        });
      }
    } else if (matchedSoleEntries.length > 1) {
      verses = matchedSoleEntries[0].verses;
    }
  }

  const hasDharani = verses.length > 0 || item.dharani > 0;

  return {
    id: `canon-scripture-${item.id}`,
    titleZh: `《${item.title}》`,
    titleSanskritIast: `${item.id} · ${colNameZh} (${vol})`,
    titleEnglish: `CBETA Canon ${item.id} (${colNameZh})`,
    categoryId: 'prajna-sutra-hrdaya',
    taishoNo: `${item.id} (${vol})`,
    translatorZh: item.byline || colNameZh,
    sutraSourceZh: `《${colNameZh}》${vol} 册《${item.title}》(${item.id})`,
    deityZh: hasDharani ? '诸佛菩萨三宝总持' : `${colNameZh}经论原典`,
    bijaIast: hasDharani ? 'oṃ' : undefined,
    meritsAndSummaryZh: hasDharani
      ? `收录自《${colNameZh}》（经号 ${item.id}，${item.byline || '古译'}，全经共 ${item.chars.toLocaleString()} 字）。本经包含 ${canonText?.dharani.length || item.dharani} 段原典陀罗尼，可在同一窗口平行标签中切换查看「陀罗尼」与「原典经文」。`
      : `收录自《${colNameZh}》（经号 ${item.id}，${item.byline || '古译'}，全经共 ${item.chars.toLocaleString()} 字）。本经为纯经论原典，直接为您呈现完整原典经文。`,
    recitationTipsZh: '',
    provenance: {
      sourceType: 'CBETA-XML-P5',
      databaseBadgeZh: `${colNameZh} · ${item.id}`,
      cbetaId: item.id,
      cbetaRawXmlUrl: xmlUrl,
      cbetaOnlineUrl: onlineUrl,
      editionCitation: `CBETA ${colNameZh} Vol. ${vol}, No. ${item.id}: ${item.title} (${item.byline || ''})`,
      manuscriptNotesZh: `CBETA XML-P5 藏经全文库原典直读（全文 ${item.chars.toLocaleString()} 字${hasDharani ? `，含陀罗尼 ${item.dharani} 段` : '，无陀罗尼纯经文'}）。`,
      cbetaInterlinearTokens: interlinearTokens,
    },
    verses,
  };
}
