/**
 * src/services/canon/canonLibraryService.ts
 *
 * Full-Canon Library & Search Service:
 * 1. Edge acceleration fallback chain: CacheStorage -> /hf-cdn/canon -> /canon -> CANON_CDN_BASE -> live CBETA XML
 * 2. Exact Traditional/Simplified/Variant lexical matching (`normalizeLiteralSearchText`) with relevance ranking
 * 3. Supports filtering all scriptures, scriptures WITH dhāraṇīs, or pure scriptures WITHOUT dhāraṇīs
 * 4. Verified full-text body search with centered paragraph snippets and zero homophone false positives
 * 5. Converts ANY Canon scripture into a first-class `DharaniEntry`:
 *    - `verses: []` when `dharani === 0` (pure sutra mode)
 *    - Classical-Chinese-only verses WITHOUT reverse-reconstructed Sanskrit when original lacks Sanskrit/Siddhaṃ
 *    - Full playable multi-script `DharaniVerse[]` when original possesses authentic Sanskrit/Siddhaṃ witness
 */
import type { CanonCatalogItem, CanonTextFile } from '../../core/canon/canonLibraryTypes';
import type { DharaniEntry, DharaniVerse } from '../../types/kosaTypes';
import { HF_CORPUS_CDN_BASE } from '../corpus/cloudCorpusService';
import { fetchAndParseCbetaXmlLive } from '../cbeta/cbetaLiveService';
import {
  normalizeLiteralSearchText,
  normalizeSearchText,
} from '../../core/search/searchEngine';
import {
  buildWordGlossesFromIast,
  generateVerseChinesePhonetics,
} from '../../core/sanskrit/phoneticMapper';
import { translateSanskritVerse } from '../../core/sanskrit/sanskritLexicon';
import { isClassicalChineseOnlyVerse } from '../../core/provenance/fieldProvenance';
import { isSoleScriptureEntry } from '../../core/taishoEntryMatch';

export const CANON_CDN_BASE = HF_CORPUS_CDN_BASE.replace(/\/corpus$/, '/canon');
const BASES = ['/hf-cdn/canon', '/canon', CANON_CDN_BASE];
const CANON_CACHE_NAME = 'sarva-canon-library-v2';

export interface CanonFullTextHit {
  item: CanonCatalogItem;
  snippet: string;
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

interface CachedCatalogNorm {
  litId: string;
  litShortNum: string;
  litTitle: string;
  litByline: string;
  litHay: string;
  normTitle: string;
}

const CATALOG_NORM_CACHE = new WeakMap<CanonCatalogItem, CachedCatalogNorm>();

function getCatalogNorm(c: CanonCatalogItem): CachedCatalogNorm {
  const hit = CATALOG_NORM_CACHE.get(c);
  if (hit) return hit;
  const litId = c.id.toLowerCase();
  const litShortNum = c.id.replace(/^[A-Z]+\d+n0*/i, '').toLowerCase();
  const litTitle = normalizeLiteralSearchText(c.title).replace(/\s+/g, '');
  const litByline = normalizeLiteralSearchText(c.byline || '').replace(/\s+/g, '');
  const litHay = `${litId} ${litShortNum} ${litTitle} ${litByline}`;
  const normTitle = normalizeSearchText(c.title).replace(/\s+/g, '');
  const val: CachedCatalogNorm = {
    litId,
    litShortNum,
    litTitle,
    litByline,
    litHay,
    normTitle,
  };
  CATALOG_NORM_CACHE.set(c, val);
  return val;
}

function collectionPriorityBonus(col: string): number {
  if (col === 'T') return 28;
  if (col === 'F') return 16;
  if (col === 'X') return 10;
  if (col === 'K' || col === 'N') return 6;
  return 0;
}

export interface FilterCatalogOptions {
  collection?: string;
  dharaniOnly?: boolean;
  dharaniMode?: 'all' | 'with-dharani' | 'without-dharani';
}

export function filterCatalog(
  items: CanonCatalogItem[],
  query: string,
  opts: FilterCatalogOptions = {}
): CanonCatalogItem[] {
  const mode = opts.dharaniMode ?? (opts.dharaniOnly ? 'with-dharani' : 'all');
  const trimmed = query.trim();

  const basePool = items.filter((c) => {
    if (opts.collection && c.collection !== opts.collection) return false;
    if (mode === 'with-dharani' && c.dharani <= 0) return false;
    if (mode === 'without-dharani' && c.dharani > 0) return false;
    return true;
  });

  if (!trimmed) return basePool;

  const litQ = normalizeLiteralSearchText(trimmed).replace(/[《》〈〉「」『』\s]+/g, '');
  const litTokens = normalizeLiteralSearchText(trimmed)
    .replace(/[《》〈〉「」『』]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  // Support common scripture abbreviations like 金刚经 -> 金刚...经, 法华经 -> 法华...经
  const abbrevMatch =
    Array.from(litQ).length >= 3
      ? litQ.match(/^(.{2,8}?)(经|仪轨|陀罗尼|真言|神咒|论|疏|品)$/)
      : null;

  const scored: Array<{ item: CanonCatalogItem; score: number }> = [];

  for (const c of basePool) {
    const idx = getCatalogNorm(c);
    let s = 0;

    if (idx.litId === litQ || (litQ.length >= 3 && idx.litShortNum === litQ)) {
      s = 520;
    } else if (idx.litTitle === litQ) {
      s = 460;
    } else if (idx.litTitle.startsWith(litQ)) {
      s = 360 - Math.min(40, idx.litTitle.length - litQ.length);
    } else if (idx.litTitle.includes(litQ)) {
      s = 280 - Math.min(40, idx.litTitle.length - litQ.length);
    } else if (litQ.length >= 3 && idx.litId.includes(litQ)) {
      s = 250;
    } else if (
      abbrevMatch &&
      idx.litTitle.includes(abbrevMatch[1]) &&
      idx.litTitle.includes(abbrevMatch[2])
    ) {
      s = 210 - Math.min(35, idx.litTitle.length);
    } else if (idx.litByline && idx.litByline.includes(litQ)) {
      s = 135;
    } else if (litTokens.length > 1 && litTokens.every((tk) => idx.litHay.includes(tk))) {
      s = 120;
    }

    if (s > 0) {
      s += collectionPriorityBonus(c.collection);
      scored.push({ item: c, score: s });
    }
  }

  if (scored.length > 0) {
    scored.sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id));
    return scored.map((x) => x.item);
  }

  // Fallback to phonetic title match ONLY when literal Traditional/Simplified match found 0 items
  // and query is at least 3 chars (prevents 2-char polyphonic collisions like 地天 -> 威德天).
  const normQ = normalizeSearchText(trimmed).replace(/\s+/g, '');
  if (Array.from(normQ).length >= 3) {
    const phonScored: Array<{ item: CanonCatalogItem; score: number }> = [];
    for (const c of basePool) {
      const idx = getCatalogNorm(c);
      if (idx.normTitle.includes(normQ)) {
        phonScored.push({
          item: c,
          score: 100 + collectionPriorityBonus(c.collection),
        });
      }
    }
    phonScored.sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id));
    return phonScored.map((x) => x.item);
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

function extractMatchSnippet(text: string, rawTrimmed: string, litQ: string): string | null {
  const rawIdx = text.indexOf(rawTrimmed);
  if (rawIdx >= 0) {
    const start = Math.max(0, rawIdx - 24);
    const slice = text.slice(start, start + 116).trim();
    return (start > 0 ? '…' : '') + slice + (start + 116 < text.length ? '…' : '');
  }
  const litText = normalizeLiteralSearchText(text);
  const litIdx = litText.indexOf(litQ);
  if (litIdx >= 0) {
    const approxStart = Math.max(0, Math.min(text.length - 40, litIdx - 20));
    const slice = text.slice(approxStart, approxStart + 116).trim();
    return (approxStart > 0 ? '…' : '') + slice + (approxStart + 116 < text.length ? '…' : '');
  }
  return null;
}

const bucketCache = new Map<string, Promise<CanonSearchBucketDoc[]>>();

export async function searchCanonFullText(
  query: string,
  catalog: CanonCatalogItem[],
  limit = 20
): Promise<CanonFullTextHit[]> {
  const trimmed = query.trim().replace(/^[《「『]+|[》」』]+$/g, '');
  if (Array.from(trimmed).length < 2) return [];

  const litQ = normalizeLiteralSearchText(trimmed).replace(/\s+/g, '');
  const normQ = normalizeSearchText(trimmed).replace(/\s+/g, '');
  if (!litQ || !normQ) return [];

  const catalogById = new Map(catalog.map((c) => [c.id, c]));
  const hits: CanonFullTextHit[] = [];
  const seen = new Set<string>();

  for (const [id, textFile] of loadedTextsSync.entries()) {
    const catItem = catalogById.get(id);
    if (!catItem) continue;
    for (const [, pText] of textFile.paragraphs) {
      const snip = extractMatchSnippet(pText, trimmed, litQ);
      if (snip) {
        seen.add(id);
        hits.push({ item: catItem, snippet: snip });
        break;
      }
    }
    if (hits.length >= limit) return hits;
  }

  // Only scan hash-bucket shards when query has >= 3 characters to prevent noisy 2-char collisions
  if (Array.from(litQ).length < 3) {
    return hits;
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
      const candidates = docs
        .filter((d) => !seen.has(d.id) && d.norm.includes(normQ))
        .sort(
          (a, b) =>
            collectionPriorityBonus(b.col) - collectionPriorityBonus(a.col) ||
            a.id.localeCompare(b.id)
        );

      const needDeepVerify: Array<{ doc: CanonSearchBucketDoc; catItem: CanonCatalogItem }> = [];

      for (const d of candidates) {
        if (hits.length >= limit) break;
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

        const sampleSnip = extractMatchSnippet(d.sample, trimmed, litQ);
        if (sampleSnip) {
          seen.add(d.id);
          hits.push({ item: catItem, snippet: sampleSnip });
        } else if (needDeepVerify.length < Math.min(8, (limit - hits.length) * 2)) {
          needDeepVerify.push({ doc: d, catItem });
        }
      }

      if (hits.length < limit && needDeepVerify.length > 0) {
        const verified = await Promise.all(
          needDeepVerify.map(async ({ catItem }) => {
            try {
              const tf = await loadCanonText(catItem);
              for (const [, pText] of tf.paragraphs) {
                const snip = extractMatchSnippet(pText, trimmed, litQ);
                if (snip) return { item: catItem, snippet: snip };
              }
            } catch {
              // ignore fetch failure
            }
            return null;
          })
        );
        for (const v of verified) {
          if (v && !seen.has(v.item.id)) {
            seen.add(v.item.id);
            hits.push(v);
            if (hits.length >= limit) break;
          }
        }
      }
    } catch {
      // Optional bucket shard
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
      !e.id.startsWith('canon-scripture-') &&
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
          ? blk.iast!
              .split(/\s*\|\|?\s*/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

        clauses.forEach((clauseZh, cIdx) => {
          const clauseHasDbIast =
            hasOrigIast && (rawIastClauses.length === clauses.length || clauses.length === 1);
          const clauseHasDbSiddham = hasOrigSiddham && clauses.length === 1;
          // Strictly NO reverse-reconstruction from classical Chinese when original lacks Sanskrit/Siddhaṃ!
          const matchedIast = clauseHasDbIast
            ? rawIastClauses.length === clauses.length
              ? rawIastClauses[cIdx]
              : blk.iast!.trim()
            : '';
          const phon = matchedIast ? generateVerseChinesePhonetics(matchedIast) : null;
          const sem = matchedIast ? translateSanskritVerse(matchedIast) : null;
          const vNo = globalIdx++;

          verses.push({
            id: `canon-${item.id}-b${bIdx + 1}-v${cIdx + 1}`,
            index: vNo,
            iast: matchedIast,
            ...(clauseHasDbSiddham ? { siddhamOriginal: blk.siddham!.trim() } : {}),
            classicalTranslitZh: clauseZh || phon?.classicalTranslitZh || '',
            modernPhoneticZh: phon?.modernPhoneticZh || '',
            meaningZh: sem?.meaningZh || '',
            meaningEn: sem?.meaningEn || '',
            tangNoteZh: blk.title
              ? `${blk.title}（第 ${cIdx + 1}/${clauses.length} 句）`
              : `本经第 ${bIdx + 1} 段陀罗尼 · 第 ${cIdx + 1}/${clauses.length} 句`,
            words: matchedIast ? buildWordGlossesFromIast(matchedIast) : [],
            fieldSources: {
              siddham: clauseHasDbSiddham ? 'db-original' : 'derived-reference',
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
  const isZhOnly =
    hasDharani &&
    (verses.length === 0 || verses.every((v) => isClassicalChineseOnlyVerse(v)));

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
    bijaIast: hasDharani && !isZhOnly ? 'oṃ' : undefined,
    meritsAndSummaryZh: !hasDharani
      ? `收录自《${colNameZh}》（经号 ${item.id}，${item.byline || '古译'}，全经共 ${item.chars.toLocaleString()} 字）。本经为不含陀罗尼咒语之纯经论原典，已自动隐去陀罗尼专属栏目并直接展示完整经文原文。`
      : isZhOnly
      ? `收录自《${colNameZh}》（经号 ${item.id}，${item.byline || '古译'}，全经共 ${item.chars.toLocaleString()} 字）。本经包含 ${canonText?.dharani.length || item.dharani} 段原典古汉音译陀罗尼（原藏未附梵文或悉昙底本，系统不作梵文反推，忠实呈现整卷经文原文与古汉音译）。`
      : `收录自《${colNameZh}》（经号 ${item.id}，${item.byline || '古译'}，全经共 ${item.chars.toLocaleString()} 字）。本经包含 ${canonText?.dharani.length || item.dharani} 段原典陀罗尼，页面已同时为您呈现整卷经典原文全文与陀罗尼多体对照解析。`,
    recitationTipsZh: !hasDharani
      ? ''
      : isZhOnly
      ? '本经于藏经原典中仅载古汉语音译咒文，未附梵文原字；为杜绝逆推讹误，仅展示原典古汉音译与经文全文。'
      : '可在上方「阅读视图」中自由切换「原文 + 陀罗尼同看」、「仅看库藏原文」或「专注陀罗尼精解」。',
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
