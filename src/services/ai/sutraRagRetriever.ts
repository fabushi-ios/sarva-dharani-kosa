/**
 * src/services/ai/sutraRagRetriever.ts
 *
 * Deep Website-to-LLM Corpus RAG Retriever for Sarva-Dhāraṇī-Kośa:
 * Bridges user questions directly to ALL live data in the website:
 *   1. Currently active scripture in the reader (`activeEntry` + live original full-text paragraphs)
 *   2. All 2,482+ Curated, GRETIL & Global 12-Database entries (`DB1`–`DB12`)
 *   3. Full CBETA 27-Collection Canon (`canonCatalog` + 64-bucket full-text search + `loadCanonText` paragraph extraction)
 *   4. Clickable reader jump targets (`entry` or `canonItem`) so every citation opens directly in the website!
 */
import type { DharaniEntry } from '../../types/kosaTypes';
import type { CanonCatalogItem } from '../../core/canon/canonLibraryTypes';
import {
  filterDharanis,
  getSearchSuggestions,
  normalizeSearchText,
} from '../../core/search/searchEngine';
import {
  filterCatalog,
  loadCanonText,
  searchCanonFullText,
} from '../canon/canonLibraryService';
import { collectEntrySources } from '../../core/sources/entrySources';
import { loadUniversalOriginalSource } from '../sources/universalSourceService';

export interface RagRetrievedPassage {
  id: string;
  sourceKind: 'active-reader' | 'kosa-entry' | 'canon-scripture';
  entryId?: string;
  canonId?: string;
  title: string;
  badge: string;
  translator: string;
  snippet: string;
  url?: string;
  entry?: DharaniEntry;
  canonItem?: CanonCatalogItem;
}

export interface ActiveScripturePayload {
  entryId: string;
  titleZh: string;
  taishoNo: string;
  translatorZh: string;
  hasDharani: boolean;
  summarySnippet: string;
  originalExcerpt: string;
}

const STOP_PHRASES_RE =
  /(请问|请解释|解释一下|帮我查一下|帮我查|查找|检索|网站里|本库中|这本经|这部经|这段|是什么|有哪些|怎么理解|如何理解|的意思|原文是什么|出自哪里|哪一部经|讲了什么|核心思想)/g;

/**
 * Extracts clean search sub-queries from a natural-language conversational prompt
 * (e.g. "请问《金刚经》里应无所住而生其心的原文和意思是什么？" -> ["金刚经", "应无所住而生其心", ...])
 */
export function extractRagSubQueries(userQuestion: string): string[] {
  const raw = (userQuestion || '').trim();
  if (!raw) return [];

  const candidates: string[] = [];

  // 1. Explicit book titles in 《...》 or 「...」 or "..."
  const quotedRe = /[《「『“"]([^》」』”"]{2,28})[》」』”"]/g;
  let m: RegExpExecArray | null;
  while ((m = quotedRe.exec(raw)) !== null) {
    candidates.push(m[1].trim());
  }

  // 2. Canonical IDs (T08n0235, F28n1071, Toh 597, DB1..DB12, MS-ADD-1346)
  const idRe = /\b(?:[TXJFABCDGKLMNPSUZW]{1,2}\d{2,3}n\d{4}[a-z]?|Toh[- ]?\d+|DB\d{1,2}|MS[- ]?ADD[- ]?\d+)\b/gi;
  while ((m = idRe.exec(raw)) !== null) {
    candidates.push(m[0].trim());
  }

  // 3. Sanskrit / IAST spans
  const iastRe = /[A-Za-zāīūṛṝḷḹṅñṭḍṇśṣṃḥĀĪŪṚṄÑṬḌṆŚṢṂḤ'-]{3,}(?:\s+[A-Za-zāīūṛṝḷḹṅñṭḍṇśṣṃḥĀĪŪṚṄÑṬḌṆŚṢṂḤ'-]{2,})*/g;
  while ((m = iastRe.exec(raw)) !== null) {
    const span = m[0].trim();
    if (!/^(?:what|how|why|the|and|for|from|with|mitra|api)$/i.test(span)) {
      candidates.push(span);
    }
  }

  // 4. Cleaned Chinese core phrases
  const stripped = raw
    .replace(STOP_PHRASES_RE, ' ')
    .replace(/[？?！!。，,、：:；;（）()《》「」『』“”"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (stripped) {
    for (const part of stripped.split(' ')) {
      const p = part.trim();
      if (p.length >= 2 && p.length <= 24) {
        candidates.push(p);
      } else if (p.length > 24) {
        candidates.push(p.slice(0, 16));
      }
    }
  }

  // Deduplicate while preserving priority
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of [...candidates, raw.slice(0, 28)]) {
    const key = normalizeSearchText(c);
    if (!key || key.length < 2 || seen.has(key)) continue;
    seen.add(key);
    out.push(c);
    if (out.length >= 6) break;
  }
  return out;
}

function formatEntryRagSnippet(entry: DharaniEntry, normTokens: string[]): string {
  const parts: string[] = [];
  if (entry.sutraSourceZh || entry.translatorZh) {
    parts.push(`出处：${entry.sutraSourceZh}（${entry.translatorZh}）`);
  }
  if (entry.meritsAndSummaryZh) {
    parts.push(`提要：${entry.meritsAndSummaryZh.slice(0, 220)}`);
  }
  if (entry.provenance.rawSnippet) {
    parts.push(`库藏录文：${entry.provenance.rawSnippet.slice(0, 240)}`);
  }

  if (entry.verses.length > 0) {
    const matchedVerses = entry.verses.filter((v) => {
      const vNorm = normalizeSearchText(
        `${v.iast} ${v.classicalTranslitZh} ${v.modernPhoneticZh} ${v.meaningZh}`
      );
      return normTokens.some((tk) => tk.length >= 2 && vNorm.includes(tk));
    });
    const chosen = (matchedVerses.length > 0 ? matchedVerses : entry.verses).slice(0, 4);
    const vStr = chosen
      .map(
        (v) =>
          `[第${v.index}句] 梵音(IAST): ${v.iast}${
            v.siddhamOriginal ? ` | 悉昙: ${v.siddhamOriginal}` : ''
          } | 古汉音译: ${v.classicalTranslitZh} | 释义: ${v.meaningZh}`
      )
      .join(' ； ');
    parts.push(vStr);
  }
  return parts.join('\n').slice(0, 820);
}

async function extractMatchingParagraphsFromSource(
  entry: DharaniEntry,
  normTokens: string[],
  maxChars = 760
): Promise<string> {
  const refs = collectEntrySources(entry);
  if (refs.length === 0) return '';
  try {
    const loaded = await Promise.race([
      loadUniversalOriginalSource(refs[0], entry),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3200)),
    ]);
    if (!loaded || loaded.paragraphs.length === 0) return '';

    const scoredParas: Array<{ hits: number; idx: number; text: string }> = [];
    loaded.paragraphs.forEach((p, idx) => {
      const normP = normalizeSearchText(p.text);
      let hits = 0;
      for (const tk of normTokens) {
        if (tk.length >= 2 && normP.includes(tk)) hits += tk.length;
      }
      if (hits > 0) {
        scoredParas.push({ hits, idx, text: p.text });
      }
    });

    scoredParas.sort((a, b) => b.hits - a.hits);
    const picked =
      scoredParas.length > 0
        ? scoredParas.slice(0, 4).map((x) => x.text)
        : loaded.paragraphs.slice(0, 4).map((x) => x.text);
    return picked.join(' ｜ ').slice(0, maxChars);
  } catch {
    return '';
  }
}

export interface RetrieveWebsiteCorpusOptions {
  query: string;
  allEntries: DharaniEntry[];
  canonCatalog: CanonCatalogItem[];
  activeEntry?: DharaniEntry | null;
  includeActiveScripture?: boolean;
  maxPassages?: number;
}

export async function retrieveWebsiteCorpusForQa(
  opts: RetrieveWebsiteCorpusOptions
): Promise<{
  subQueries: string[];
  activeScripture: ActiveScripturePayload | null;
  passages: RagRetrievedPassage[];
}> {
  const {
    query,
    allEntries,
    canonCatalog,
    activeEntry = null,
    includeActiveScripture = false,
    maxPassages = 6,
  } = opts;

  const subQueries = extractRagSubQueries(query);
  const normTokens = subQueries
    .map((q) => normalizeSearchText(q))
    .filter((t) => t.length >= 2);

  const passages: RagRetrievedPassage[] = [];
  const seenKeys = new Set<string>();

  // 1. Optional Active Reader Scripture Context (with live original full-text excerpt!)
  let activeScripture: ActiveScripturePayload | null = null;
  if (includeActiveScripture && activeEntry) {
    const origExcerpt = await extractMatchingParagraphsFromSource(activeEntry, normTokens, 900);
    const fallbackExcerpt = formatEntryRagSnippet(activeEntry, normTokens);
    activeScripture = {
      entryId: activeEntry.id,
      titleZh: activeEntry.titleZh,
      taishoNo: activeEntry.taishoNo,
      translatorZh: activeEntry.translatorZh,
      hasDharani: activeEntry.verses.length > 0,
      summarySnippet: activeEntry.meritsAndSummaryZh,
      originalExcerpt: origExcerpt || fallbackExcerpt,
    };

    const actKey = `entry:${activeEntry.id}`;
    seenKeys.add(actKey);
    passages.push({
      id: actKey,
      sourceKind: 'active-reader',
      entryId: activeEntry.id,
      canonId: activeEntry.provenance.cbetaId || activeEntry.taishoNo,
      title: activeEntry.titleZh,
      badge: `当前阅读 · ${activeEntry.provenance.databaseBadgeZh || activeEntry.taishoNo}`,
      translator: activeEntry.translatorZh,
      snippet: origExcerpt ? `${origExcerpt}\n${fallbackExcerpt}`.slice(0, 820) : fallbackExcerpt,
      url: activeEntry.provenance.cbetaOnlineUrl || activeEntry.provenance.gretilRawUrl,
      entry: activeEntry,
    });
  }

  // 2. Search across Curated + GRETIL + Global 12-Database entries (`allEntries`)
  const matchedEntries: DharaniEntry[] = [];
  for (const sq of subQueries) {
    const suggestions = getSearchSuggestions(allEntries, sq, 8);
    for (const sug of suggestions) {
      if (sug.entry && !matchedEntries.some((e) => e.id === sug.entry!.id)) {
        matchedEntries.push(sug.entry);
      }
    }
    if (matchedEntries.length < 5) {
      const direct = filterDharanis(allEntries, {
        query: sq,
        categoryId: 'all',
        onlyBookmarked: false,
        bookmarkedIds: new Set(),
        sourceFilter: 'all',
      }).slice(0, 4);
      for (const d of direct) {
        if (!matchedEntries.some((e) => e.id === d.id)) {
          matchedEntries.push(d);
        }
      }
    }
    if (matchedEntries.length >= 6) break;
  }

  // Enrich top 2 matched entries with live original full-text excerpts
  const topEntries = matchedEntries.slice(0, 4);
  const entryExcerpts = await Promise.all(
    topEntries.map((entry, idx) =>
      idx < 2 ? extractMatchingParagraphsFromSource(entry, normTokens, 520) : Promise.resolve('')
    )
  );

  topEntries.forEach((entry, idx) => {
    if (passages.length >= maxPassages) return;
    const key = `entry:${entry.id}`;
    if (seenKeys.has(key)) return;
    seenKeys.add(key);

    const baseSnippet = formatEntryRagSnippet(entry, normTokens);
    const fullTextHit = entryExcerpts[idx];
    passages.push({
      id: key,
      sourceKind: 'kosa-entry',
      entryId: entry.id,
      canonId: entry.provenance.cbetaId || entry.taishoNo,
      title: entry.titleZh,
      badge: entry.provenance.databaseBadgeZh || entry.taishoNo,
      translator: entry.translatorZh,
      snippet: fullTextHit ? `【原典正文】${fullTextHit}\n${baseSnippet}`.slice(0, 820) : baseSnippet,
      url: entry.provenance.cbetaOnlineUrl || entry.provenance.gretilRawUrl,
      entry,
    });
  });

  // 3. Search Full CBETA 27-Collection Canon (Catalog + 64-Bucket Body Search + `loadCanonText`)
  if (canonCatalog.length > 0 && passages.length < maxPassages) {
    const candidateCanonItems: Array<{ item: CanonCatalogItem; bucketSnippet?: string }> = [];

    for (const sq of subQueries) {
      const catHits = filterCatalog(canonCatalog, sq).slice(0, 3);
      for (const ch of catHits) {
        if (!candidateCanonItems.some((x) => x.item.id === ch.id)) {
          candidateCanonItems.push({ item: ch });
        }
      }
      if (sq.length >= 2 && candidateCanonItems.length < 4) {
        const bodyHits = await searchCanonFullText(sq, canonCatalog, 3).catch(() => []);
        for (const bh of bodyHits) {
          if (!candidateCanonItems.some((x) => x.item.id === bh.item.id)) {
            candidateCanonItems.push({ item: bh.item, bucketSnippet: bh.snippet });
          }
        }
      }
      if (candidateCanonItems.length >= 4) break;
    }

    const topCanon = candidateCanonItems.slice(0, 3);
    const loadedCanonSnippets = await Promise.all(
      topCanon.map(async ({ item, bucketSnippet }) => {
        try {
          const textFile = await Promise.race([
            loadCanonText(item),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 3200)),
          ]);
          if (!textFile) return bucketSnippet || '';
          const hitParas: Array<{ score: number; text: string }> = [];
          for (const [, pText] of textFile.paragraphs) {
            const pNorm = normalizeSearchText(pText);
            let s = 0;
            for (const tk of normTokens) {
              if (tk.length >= 2 && pNorm.includes(tk)) s += tk.length;
            }
            if (s > 0) hitParas.push({ score: s, text: pText });
          }
          hitParas.sort((a, b) => b.score - a.score);
          if (hitParas.length > 0) {
            return hitParas
              .slice(0, 3)
              .map((h) => h.text)
              .join(' ｜ ')
              .slice(0, 720);
          }
          return textFile.paragraphs
            .slice(0, 3)
            .map(([, t]) => t)
            .join(' ｜ ')
            .slice(0, 560);
        } catch {
          return bucketSnippet || '';
        }
      })
    );

    topCanon.forEach(({ item }, idx) => {
      if (passages.length >= maxPassages) return;
      const key = `canon:${item.id}`;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);

      const snippet =
        loadedCanonSnippets[idx] ||
        `《${item.title}》（${item.byline || '藏经原典'}，经号 ${item.id}），全经共 ${item.chars.toLocaleString()} 字。`;
      passages.push({
        id: key,
        sourceKind: 'canon-scripture',
        entryId: `canon-scripture-${item.id}`,
        canonId: item.id,
        title: `《${item.title}》`,
        badge: `CBETA ${item.id} · ${item.dharani > 0 ? `含陀罗尼 ${item.dharani} 段` : '纯经文原典'}`,
        translator: item.byline || 'CBETA 藏经原典',
        snippet,
        url: `https://cbetaonline.dila.edu.tw/zh/${item.id}`,
        canonItem: item,
      });
    });
  }

  return {
    subQueries,
    activeScripture,
    passages,
  };
}
