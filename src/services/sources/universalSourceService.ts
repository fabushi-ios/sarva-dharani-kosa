/**
 * src/services/sources/universalSourceService.ts
 *
 * Universal All-Database Original Full-Text Loader & Parser:
 * Resolves and formats complete, un-truncated original texts across:
 * - CBETA Full Canon (`.json.gz` via `/hf-cdn/canon` + live TEI-P5 XML fallback)
 * - DB1 Fangshan Stone Canon (`F28n1071` + `/data/tier1/db1_fangshan.json`)
 * - DB2 Taishō Siddhaṃ T84 YAML (`bkkbooks`) & T54 / Ancient Dhāraṇīs (`/data/tier1/db2_taisho_ext.json`)
 * - DB3 Nepal DSBC (`820/2949` & `824/2953` IAST + Devanāgarī + `/source-proxy/` HTML) & Göttingen GRETIL
 * - DB4 84000 Kangyur Open TEI XML (cleanly extracting English translation, Tibetan/Sanskrit titles, mantras & notes)
 * - DB5 BuddhaNexus Segmented Sanskrit JSON (`[segnr] original`)
 * - DB6 SARIT Indology TEI-P5 XML (stripping `<rdg>` critical apparatus noise while preserving verses & loci)
 * - DB7 Cambridge CUDL Manuscripts (IIIF folio image previews + transcriptions) & Gergely Hidas Critical Editions
 * - DB8 Oslo Bibliotheca Polyglotta 4-Language Parallel Matrices (Sanskrit / Tibetan / Chinese / English)
 * - DB9 Vienna rKTs Derge Zungdu E-Texts (via `/source-proxy/` HTTP->HTTPS upgrade + Tibetan Unicode/EWTS)
 * - DB10 ALL-NIBS Newar & Kathmandu Asha Archives Diplomatic Folio Transcriptions
 * - DB11 IDP Silk Road XML, Vienna CEToM Brāhmī Line-by-Line Transcriptions & Dunhuang T85/ZW
 * - DB12 ERC DHARMA Critical Editions (STTS), Muktabodha Tantric Texts & Oxford OCHS Bījanighaṇṭu Full Verses
 */
import type { DharaniEntry } from '../../types/kosaTypes';
import { toProxiedSourceUrl, type EntrySourceRef } from '../../core/sources/entrySources';
import { htmlToText } from '../../core/sources/htmlText';
import {
  fetchAndParseCbetaXmlLive,
  type CbetaFullParagraph,
} from '../cbeta/cbetaLiveService';
import { loadCanonText } from '../canon/canonLibraryService';

export interface FolioPreviewItem {
  label: string;
  imageUrl: string;
  viewerUrl?: string;
}

export interface UniversalLoadedSource {
  title: string;
  byline?: string;
  sourceBadgeZh?: string;
  lang: 'zh-Hant' | 'sa-Latn' | 'bo' | 'multi';
  paragraphs: CbetaFullParagraph[];
  folios?: FolioPreviewItem[];
}

const sourceMemCache = new Map<string, Promise<UniversalLoadedSource>>();
const jsonShardMemCache = new Map<string, Promise<unknown>>();

async function fetchJsonOnce<T>(url: string): Promise<T | null> {
  let p = jsonShardMemCache.get(url);
  if (!p) {
    p = fetch(url)
      .then(async (r) => {
        if (!r.ok) return null;
        const ct = (r.headers.get('content-type') || '').toLowerCase();
        if (ct.includes('text/html')) return null;
        return (await r.json()) as unknown;
      })
      .catch(() => null);
    jsonShardMemCache.set(url, p);
  }
  return (await p) as T | null;
}

async function fetchTextWithProxyFallback(rawUrl: string): Promise<string> {
  const isHttpOnly = /^http:\/\//i.test(rawUrl);
  const isCorsFriendlyDirect =
    !isHttpOnly &&
    (rawUrl.startsWith('/') || rawUrl.includes('raw.githubusercontent.com'));

  const candidates = isCorsFriendlyDirect
    ? [rawUrl, toProxiedSourceUrl(rawUrl)]
    : [toProxiedSourceUrl(rawUrl), ...(isHttpOnly ? [] : [rawUrl])];

  let lastErr: unknown;
  for (const candidate of candidates) {
    try {
      const resp = await fetch(candidate);
      if (!resp.ok) {
        lastErr = new Error(`HTTP ${resp.status}`);
        continue;
      }
      const text = await resp.text();
      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('无法连接上游原典库');
}

function buildWitnessFallbackParagraphs(entry: DharaniEntry): CbetaFullParagraph[] {
  const paras: CbetaFullParagraph[] = [];
  paras.push({
    kind: 'head',
    text: `${entry.titleZh} · ${entry.taishoNo}`,
  });
  if (entry.sutraSourceZh || entry.translatorZh) {
    paras.push({
      kind: 'text',
      text: `【文献出处】${entry.sutraSourceZh}（${entry.translatorZh}）`,
    });
  }
  if (entry.meritsAndSummaryZh) {
    paras.push({
      kind: 'text',
      text: `【馆藏题记与提要】${entry.meritsAndSummaryZh}`,
    });
  }
  if (entry.provenance.manuscriptNotesZh) {
    paras.push({
      kind: 'text',
      text: `【写本与版本校记】${entry.provenance.manuscriptNotesZh}`,
    });
  }
  if (entry.provenance.rawSnippet && entry.provenance.rawSnippet.trim()) {
    paras.push({
      kind: 'head',
      text: '库藏原典录文（Original Witness Text）',
    });
    for (const line of entry.provenance.rawSnippet.split('\n').map((s) => s.trim()).filter(Boolean)) {
      paras.push({ kind: 'dharani', text: line });
    }
  }
  if (entry.verses.length > 0) {
    paras.push({
      kind: 'head',
      text: `本篇逐句库藏原文汇录（共 ${entry.verses.length} 句）`,
    });
    for (const v of entry.verses) {
      const segments: string[] = [];
      if (v.diplomaticOriginal) segments.push(`【写本原貌】${v.diplomaticOriginal}`);
      if (v.siddhamOriginal) segments.push(`【悉昙原刻】${v.siddhamOriginal}`);
      if (v.devanagariOriginal) segments.push(`【天城原文】${v.devanagariOriginal}`);
      if (v.fieldSources?.classicalTranslitZh === 'db-original' && v.classicalTranslitZh) {
        segments.push(`【汉译原载】${v.classicalTranslitZh}`);
      }
      if (v.fieldSources?.iast === 'db-original' || segments.length === 0) {
        segments.push(`【梵文转写】${v.iast}`);
      }
      if (v.tangNoteZh) segments.push(`（注：${v.tangNoteZh}）`);
      paras.push({
        kind: 'dharani',
        text: `[${String(v.index).padStart(2, '0')}] ${segments.join(' ｜ ')}`,
      });
    }
  }
  return paras;
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(parseInt(d, 10)));
}

function parseTei84000XmlToParagraphs(xml: string, fallbackTitle: string): UniversalLoadedSource {
  const cleaned = xml
    .replace(/<teiHeader[\s\S]*?<\/teiHeader>/gi, '')
    .replace(/<note[^>]*>[\s\S]*?<\/note>/gi, '');

  const titleMatch = xml.match(/<title[^>]*xml:lang="en"[^>]*>([\s\S]*?)<\/title>/i);
  const boTitleMatch = xml.match(/<title[^>]*xml:lang="bo(?:-Ltn)?"[^>]*>([\s\S]*?)<\/title>/i);
  const title = decodeXmlEntities((titleMatch?.[1] || fallbackTitle).replace(/<[^>]+>/g, '').trim());
  const byline = boTitleMatch
    ? `84000 Open TEI · ${decodeXmlEntities(boTitleMatch[1].replace(/<[^>]+>/g, '').trim())}`
    : '84000: Translating the Words of the Buddha';

  const paragraphs: CbetaFullParagraph[] = [];
  const blockRe = /<(head|p|lg)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(cleaned)) !== null) {
    const tag = m[1].toLowerCase();
    const attrs = m[2] || '';
    const inner = m[3] || '';
    const isMantra = /mantra|dharani/i.test(attrs) || /<foreign[^>]*mantra/i.test(inner);
    const text = decodeXmlEntities(
      inner
        .replace(/<l\b[^>]*>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    );
    if (!text) continue;
    paragraphs.push({
      kind: tag === 'head' ? 'head' : isMantra ? 'dharani' : 'text',
      text,
    });
  }

  return {
    title,
    byline,
    sourceBadgeZh: 'DB4 · 84000 甘珠尔 TEI 全文',
    lang: 'multi',
    paragraphs:
      paragraphs.length > 0
        ? paragraphs
        : htmlToText(xml)
            .split('\n')
            .map((t) => t.trim())
            .filter(Boolean)
            .map((text) => ({ kind: 'text' as const, text })),
  };
}

function parseSaritTeiXmlToParagraphs(xml: string, fallbackTitle: string): UniversalLoadedSource {
  const titleMatch = xml.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = decodeXmlEntities((titleMatch?.[1] || fallbackTitle).replace(/<[^>]+>/g, '').trim());
  const body = xml
    .replace(/<teiHeader[\s\S]*?<\/teiHeader>/gi, '')
    .replace(/<rdg\b[^>]*>[\s\S]*?<\/rdg>/gi, '')
    .replace(/<note\b[^>]*>[\s\S]*?<\/note>/gi, '')
    .replace(/<pb\b[^>]*n="([^"]+)"[^>]*\/?>/gi, ' [fol. $1] ')
    .replace(/<milestone\b[^>]*n="([^"]+)"[^>]*\/?>/gi, ' [§$1] ');

  const paragraphs: CbetaFullParagraph[] = [];
  const blockRe = /<(head|p|lg)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(body)) !== null) {
    const tag = m[1].toLowerCase();
    const text = decodeXmlEntities(
      m[2]
        .replace(/<l\b[^>]*>/gi, ' ')
        .replace(/<\/l>/gi, ' | ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    );
    if (!text) continue;
    const isMantra = /\b(?:oṃ|svāhā|phaṭ|hūṃ|tadyathā|namo)\b/i.test(text);
    paragraphs.push({
      kind: tag === 'head' ? 'head' : isMantra ? 'dharani' : 'text',
      text,
    });
  }

  return {
    title,
    byline: 'SARIT Indology TEI-P5 Critical Edition',
    sourceBadgeZh: 'DB6 · SARIT 梵本全文',
    lang: 'sa-Latn',
    paragraphs:
      paragraphs.length > 0
        ? paragraphs
        : htmlToText(body)
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
            .map((text) => ({ kind: 'text' as const, text })),
  };
}

async function loadCbetaOrCanonSource(
  ref: EntrySourceRef,
  entry: DharaniEntry
): Promise<UniversalLoadedSource> {
  const col = (ref.id.match(/^[A-Z]+/) || ['T'])[0];
  try {
    const canonFile = await loadCanonText({ id: ref.id, collection: col });
    const KIND_MAP: Record<string, CbetaFullParagraph['kind']> = {
      h: 'head',
      t: 'text',
      d: 'dharani',
    };
    return {
      title: `${canonFile.title} (${canonFile.id})`,
      byline: canonFile.byline,
      sourceBadgeZh: ref.sourceBadgeZh || `CBETA 藏经全文 (${canonFile.id})`,
      lang: 'zh-Hant',
      paragraphs: canonFile.paragraphs.map(([k, t]) => ({
        kind: KIND_MAP[k] || 'text',
        text: t,
      })),
    };
  } catch {
    const vol = (ref.id.match(/^([A-Z]{1,2}\d{2,3})n/) || ['', ''])[1];
    try {
      const xmlText = await fetchTextWithProxyFallback(ref.url);
      const { parseCbetaXml } = await import('../cbeta/cbetaLiveService');
      const parsed = parseCbetaXml(ref.id, vol, xmlText, ref.url);
      return {
        title: `${parsed.titleZh} (${parsed.id})`,
        byline: parsed.translator,
        sourceBadgeZh: ref.sourceBadgeZh || `CBETA XML-P5 (${parsed.id})`,
        lang: 'zh-Hant',
        paragraphs: parsed.fullParagraphs,
      };
    } catch {
      const live = await fetchAndParseCbetaXmlLive(ref.id, vol, ref.url);
      if (live.fullParagraphs.length > 0) {
        return {
          title: `${live.titleZh} (${live.id})`,
          byline: live.translator,
          sourceBadgeZh: ref.sourceBadgeZh || `CBETA (${live.id})`,
          lang: 'zh-Hant',
          paragraphs: live.fullParagraphs,
        };
      }
      return {
        title: entry.titleZh,
        byline: entry.translatorZh,
        sourceBadgeZh: ref.sourceBadgeZh,
        lang: 'zh-Hant',
        paragraphs: buildWitnessFallbackParagraphs(entry),
      };
    }
  }
}

async function loadSpecificSource(
  ref: EntrySourceRef,
  entry: DharaniEntry
): Promise<UniversalLoadedSource> {
  if (ref.kind === 'cbeta' || ref.kind === 'canon-gz') {
    return loadCbetaOrCanonSource(ref, entry);
  }

  if (ref.kind === 'witness-inline') {
    return {
      title: entry.titleZh,
      byline: entry.translatorZh,
      sourceBadgeZh: ref.sourceBadgeZh || '库藏原文录文',
      lang: 'multi',
      paragraphs: buildWitnessFallbackParagraphs(entry),
    };
  }

  if (ref.kind === 'dsbc') {
    // Combine local full un-truncated DSBC JSON with live DSBC HTML page when reachable
    const paragraphs: CbetaFullParagraph[] = [];
    const db3 = await fetchJsonOnce<{
      dharaniSamgrahaSections?: Array<{
        sectionNumber: number;
        titleIast: string;
        titleDevanagari?: string;
        paragraphsIast: string[];
        paragraphsDevanagari?: string[];
        colophonIast?: string;
      }>;
      dsbcBooks?: Array<{
        bookId: string | number;
        titleIast: string;
        fullTextExcerptIast?: string;
        extractedMantras?: string[];
      }>;
    }>('/data/tier1/db3_dsbc_gretil.json');

    const secMatch = entry.id.match(/^db3-dsbc-sec-(\d+)/);
    const bookMatch = entry.id.match(/^db3-dsbc-book-(.+)$/);
    if (secMatch && db3?.dharaniSamgrahaSections) {
      const sec = db3.dharaniSamgrahaSections.find((s) => s.sectionNumber === Number(secMatch[1]));
      if (sec) {
        paragraphs.push({
          kind: 'head',
          text: `Dhāraṇī Saṃgraha §${sec.sectionNumber}: ${sec.titleIast}${sec.titleDevanagari ? ` (${sec.titleDevanagari})` : ''}`,
        });
        sec.paragraphsIast.forEach((p) => paragraphs.push({ kind: 'dharani', text: p }));
        if (sec.paragraphsDevanagari && sec.paragraphsDevanagari.length > 0) {
          paragraphs.push({ kind: 'head', text: '天城文平行原典（Devanāgarī Witness 824/2953）' });
          sec.paragraphsDevanagari.forEach((p) => paragraphs.push({ kind: 'text', text: p }));
        }
        if (sec.colophonIast) {
          paragraphs.push({ kind: 'text', text: `Colophon: ${sec.colophonIast}` });
        }
      }
    } else if (bookMatch && db3?.dsbcBooks) {
      const bk = db3.dsbcBooks.find((b) => String(b.bookId) === bookMatch[1]);
      if (bk) {
        paragraphs.push({ kind: 'head', text: `${bk.titleIast} (DSBC Book #${bk.bookId})` });
        if (bk.fullTextExcerptIast) {
          bk.fullTextExcerptIast
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
            .forEach((l) => paragraphs.push({ kind: 'text', text: l }));
        }
        (bk.extractedMantras || []).forEach((m) => paragraphs.push({ kind: 'dharani', text: m }));
      }
    }

    try {
      const liveHtml = await fetchTextWithProxyFallback(ref.url);
      const cleanedLines = htmlToText(liveHtml)
        .split('\n')
        .map((t) => t.trim())
        .filter((t) => t.length > 2 && !/^(?:Home|About|Canon|Search|Copyright)/i.test(t));
      if (cleanedLines.length > paragraphs.length) {
        paragraphs.push({ kind: 'head', text: 'DSBC 在线原典整页全文' });
        cleanedLines.forEach((line) =>
          paragraphs.push({
            kind: /\b(?:oṃ|svāhā|namaḥ|namo|tadyathā)\b/i.test(line) ? 'dharani' : 'text',
            text: line,
          })
        );
      }
    } catch {
      // Keep local full tier1 JSON paragraphs
    }

    return {
      title: entry.titleSanskritIast || entry.titleZh,
      byline: entry.translatorZh,
      sourceBadgeZh: 'DB3 · 尼泊尔 DSBC 梵文原典',
      lang: 'sa-Latn',
      paragraphs: paragraphs.length > 0 ? paragraphs : buildWitnessFallbackParagraphs(entry),
    };
  }

  if (ref.kind === 'tei-84000') {
    try {
      const xml = await fetchTextWithProxyFallback(ref.url);
      return parseTei84000XmlToParagraphs(xml, entry.titleEnglish || entry.titleZh);
    } catch {
      return {
        title: entry.titleZh,
        byline: entry.translatorZh,
        sourceBadgeZh: 'DB4 · 84000 藏密原典',
        lang: 'multi',
        paragraphs: buildWitnessFallbackParagraphs(entry),
      };
    }
  }

  if (ref.kind === 'buddhanexus-json') {
    try {
      const rawJsonText = await fetchTextWithProxyFallback(ref.url);
      const parsed = JSON.parse(rawJsonText) as Array<{
        segnr?: string;
        original?: string;
        text?: string;
      }>;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const paragraphs: CbetaFullParagraph[] = [
          {
            kind: 'head',
            text: `${entry.titleSanskritIast} — 全卷共 ${parsed.length} 句段分词梵本原文`,
          },
          ...parsed
            .map((seg) => {
              const txt = (seg.original || seg.text || '').trim();
              if (!txt) return null;
              const isMantra = /\b(?:oṃ|svāhā|phaṭ|hūṃ|tadyathā)\b/i.test(txt);
              return {
                kind: (isMantra ? 'dharani' : 'text') as CbetaFullParagraph['kind'],
                text: seg.segnr ? `[${seg.segnr}] ${txt}` : txt,
              };
            })
            .filter((x): x is CbetaFullParagraph => x !== null),
        ];
        return {
          title: entry.titleSanskritIast || entry.titleZh,
          byline: 'BuddhaNexus Segmented Sanskrit Full Text',
          sourceBadgeZh: 'DB5 · BuddhaNexus 梵本全文',
          lang: 'sa-Latn',
          paragraphs,
        };
      }
    } catch {
      // fall through
    }
    return {
      title: entry.titleZh,
      byline: entry.translatorZh,
      sourceBadgeZh: 'DB5 · BuddhaNexus 梵本',
      lang: 'sa-Latn',
      paragraphs: buildWitnessFallbackParagraphs(entry),
    };
  }

  if (ref.kind === 'tei-sarit') {
    try {
      const xml = await fetchTextWithProxyFallback(ref.url);
      return parseSaritTeiXmlToParagraphs(xml, entry.titleSanskritIast || entry.titleZh);
    } catch {
      return {
        title: entry.titleZh,
        byline: entry.translatorZh,
        sourceBadgeZh: 'DB6 · SARIT 密续原典',
        lang: 'sa-Latn',
        paragraphs: buildWitnessFallbackParagraphs(entry),
      };
    }
  }

  if (ref.kind === 'hidas-edition' || ref.kind === 'cudl-json') {
    const db7 = await fetchJsonOnce<{
      hidasCriticalEditions?: Array<{
        id: string;
        titleSanskrit: string;
        editorCitation: string;
        manuscriptWitnesses: string[];
        tibetanParallelRef: string;
        extractedMantraIast?: string;
        segments: Array<{ sectionLabel?: string; textIast: string; apparatus?: string }>;
      }>;
      manuscripts?: Array<{
        cudlId: string;
        shelfLocator: string;
        title: string;
        dateDisplay: string;
        script: string;
        material: string;
        numberOfPages: number;
        viewerUrl: string;
        iiifManifestUrl?: string;
        sampleFolioImageUrls?: string[];
        sectionTitlesIast: string[];
        transcribedRubricsAndExcerpts: string[];
      }>;
    }>('/data/tier23/db7_cudl_hidas.json');

    if (ref.kind === 'hidas-edition' && db7?.hidasCriticalEditions) {
      const rawId = entry.id.replace(/^db7-hidas-/, '');
      const ed = db7.hidasCriticalEditions.find((x) => x.id === rawId);
      if (ed) {
        const paragraphs: CbetaFullParagraph[] = [
          {
            kind: 'head',
            text: `${ed.titleSanskrit} — Gergely Hidas 博士梵文贝叶经校勘全文`,
          },
          {
            kind: 'text',
            text: `【校勘底本】${ed.manuscriptWitnesses.join(' · ')} ｜ 【藏译对勘】${ed.tibetanParallelRef} ｜ 【校勘者】${ed.editorCitation}`,
          },
          ...ed.segments.map((seg, idx) => ({
            kind: (/\b(?:oṃ|svāhā|phaṭ|hūṃ|tadyathā)\b/i.test(seg.textIast)
              ? 'dharani'
              : 'text') as CbetaFullParagraph['kind'],
            text: `${seg.sectionLabel ? `[${seg.sectionLabel}] ` : `[§${idx + 1}] `}${seg.textIast}${seg.apparatus ? ` （校勘记：${seg.apparatus}）` : ''}`,
          })),
        ];
        return {
          title: ed.titleSanskrit,
          byline: ed.editorCitation,
          sourceBadgeZh: 'DB7 · 剑桥 Hidas 校勘全文',
          lang: 'sa-Latn',
          paragraphs,
        };
      }
    }

    if (db7?.manuscripts) {
      const cudlId = entry.id.replace(/^db7-cudl-ms-/, '');
      const ms = db7.manuscripts.find((x) => x.cudlId === cudlId);
      if (ms) {
        const folios: FolioPreviewItem[] = (ms.sampleFolioImageUrls || []).map((imgUrl, idx) => ({
          label: `${ms.shelfLocator} · 叶 ${idx + 1}`,
          imageUrl: imgUrl,
          viewerUrl: ms.viewerUrl,
        }));
        const paragraphs: CbetaFullParagraph[] = [
          {
            kind: 'head',
            text: `${ms.shelfLocator} 《${ms.title}》 (${ms.dateDisplay})`,
          },
          {
            kind: 'text',
            text: `【书体与材质】${ms.script} · ${ms.material} · 共 ${ms.numberOfPages} 页`,
          },
        ];
        if (ms.sectionTitlesIast.length > 0) {
          paragraphs.push({
            kind: 'head',
            text: `写本收录子品目总览（共 ${ms.sectionTitlesIast.length} 品）`,
          });
          paragraphs.push({
            kind: 'text',
            text: ms.sectionTitlesIast.map((t, i) => `${i + 1}. ${t}`).join(' ｜ '),
          });
        }
        if (ms.transcribedRubricsAndExcerpts.length > 0) {
          paragraphs.push({
            kind: 'head',
            text: '剑桥馆藏贝叶经外交转写与题跋原貌（Diplomatic Transcription）',
          });
          ms.transcribedRubricsAndExcerpts.forEach((line) =>
            paragraphs.push({ kind: 'dharani', text: line })
          );
        }
        return {
          title: `${ms.shelfLocator} · ${ms.title}`,
          byline: `Cambridge University Digital Library (${ms.dateDisplay})`,
          sourceBadgeZh: 'DB7 · 剑桥 CUDL 贝叶经原卷',
          lang: 'sa-Latn',
          paragraphs,
          folios: folios.length > 0 ? folios : undefined,
        };
      }
    }
  }

  if (ref.kind === 'polyglotta-parallel') {
    const db8 = await fetchJsonOnce<{
      volumes?: Array<{
        vid: number;
        titleSanskrit: string;
        titleZh: string;
        witnesses: string[];
        alignedRows: Array<{
          rowIndex: number;
          sectionRef?: string;
          cells: Array<{ lang: string; witnessLabel: string; text: string }>;
        }>;
      }>;
    }>('/data/tier23/db8_polyglotta.json');
    const vidMatch = entry.id.match(/vid-(\d+)/);
    const vol = db8?.volumes?.find((v) => v.vid === Number(vidMatch?.[1]));
    if (vol) {
      const paragraphs: CbetaFullParagraph[] = [
        {
          kind: 'head',
          text: `${vol.titleZh} (${vol.titleSanskrit}) — 共 ${vol.witnesses.length} 种梵藏汉英证本逐段平行原文`,
        },
        {
          kind: 'text',
          text: `【参校证本】${vol.witnesses.join(' 、 ')}`,
        },
      ];
      for (const row of vol.alignedRows) {
        paragraphs.push({
          kind: 'head',
          text: `对勘段 ${row.sectionRef || `#${row.rowIndex}`}`,
        });
        for (const cell of row.cells) {
          if (!cell.text || !cell.text.trim()) continue;
          const isMantra = /\b(?:oṃ|gate|svāhā|tadyathā|prajñe)\b|揭諦|般若波羅蜜多咒/i.test(
            cell.text
          );
          paragraphs.push({
            kind: isMantra ? 'dharani' : 'text',
            text: `【${cell.lang} · ${cell.witnessLabel}】${cell.text}`,
          });
        }
      }
      return {
        title: `${vol.titleZh} (Polyglotta vid=${vol.vid})`,
        byline: 'University of Oslo Bibliotheca Polyglotta',
        sourceBadgeZh: 'DB8 · 奥斯陆四语平行全文',
        lang: 'multi',
        paragraphs,
      };
    }
  }

  if (ref.kind === 'rkts-etext') {
    const paragraphs: CbetaFullParagraph[] = buildWitnessFallbackParagraphs(entry);
    try {
      const txt = await fetchTextWithProxyFallback(ref.url);
      const lines = txt
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length > 0) {
        return {
          title: entry.titleSanskritIast || entry.titleZh,
          byline: entry.translatorZh,
          sourceBadgeZh: 'DB9 · 维也纳 rKTs 德格版电子全文',
          lang: 'bo',
          paragraphs: [
            ...paragraphs.slice(0, 3),
            { kind: 'head', text: `rKTs 德格版《陀罗尼集》原卷电子全文（共 ${lines.length} 行）` },
            ...lines.map((line) => ({
              kind: (/\b(?:oM|svA|hUM|phaT|namo)\b/i.test(line)
                ? 'dharani'
                : 'text') as CbetaFullParagraph['kind'],
              text: line,
            })),
          ],
        };
      }
    } catch {
      // Fallback to local Tibetan Unicode + EWTS witness
    }
    return {
      title: entry.titleZh,
      byline: entry.translatorZh,
      sourceBadgeZh: 'DB9 · 维也纳 rKTs 藏文原典',
      lang: 'bo',
      paragraphs,
    };
  }

  if (ref.kind === 'all-nibs') {
    const db10 = await fetchJsonOnce<{
      manuscripts?: Array<{
        resourceId: string;
        titleIast: string;
        manuscriptArchiveRef?: string;
        diplomaticFolioExcerpt: string;
        normalizedIastExcerpt?: string;
        extractedMantras?: string[];
      }>;
      newarDharaniWitnesses?: Array<{
        id: string;
        titleNormalizedIast: string;
        titleDiplomaticNewar: string;
        diplomaticMantraNewar: string;
        normalizedMantraIast: string;
        orthographicNotes: string[];
      }>;
    }>('/data/tier23/db10_all_nibs.json');

    const paragraphs: CbetaFullParagraph[] = [];
    if (entry.id.startsWith('db10-nibs-newar-') && db10?.newarDharaniWitnesses) {
      const nwId = entry.id.replace(/^db10-nibs-newar-/, '');
      const nw = db10.newarDharaniWitnesses.find((x) => x.id === nwId);
      if (nw) {
        paragraphs.push({
          kind: 'head',
          text: `${nw.titleNormalizedIast} (${nw.titleDiplomaticNewar})`,
        });
        paragraphs.push({
          kind: 'dharani',
          text: `【尼瓦尔写本外交原貌 Diplomatic Newar】${nw.diplomaticMantraNewar}`,
        });
        paragraphs.push({
          kind: 'dharani',
          text: `【古典梵文校勘本 Normalized Sanskrit】${nw.normalizedMantraIast}`,
        });
        nw.orthographicNotes.forEach((n) =>
          paragraphs.push({ kind: 'text', text: `• 正字法对勘：${n}` })
        );
      }
    } else if (db10?.manuscripts) {
      const msId = entry.id.replace(/^db10-nibs-ms-/, '').replace(/-m\d+$/, '');
      const ms = db10.manuscripts.find((x) => x.resourceId === msId);
      if (ms) {
        paragraphs.push({
          kind: 'head',
          text: `ALL-NIBS ${ms.resourceId} · ${ms.titleIast} (${ms.manuscriptArchiveRef || 'Kathmandu Asha Archives'})`,
        });
        if (ms.diplomaticFolioExcerpt) {
          paragraphs.push({ kind: 'head', text: '写本叶码外交转写原文（Diplomatic Folio Text）' });
          ms.diplomaticFolioExcerpt
            .split(/(?=@\d+[ab]\b)/i)
            .map((s) => s.trim())
            .filter(Boolean)
            .forEach((p) => paragraphs.push({ kind: 'text', text: p }));
        }
        if (ms.normalizedIastExcerpt) {
          paragraphs.push({ kind: 'head', text: '标准梵文校勘全文（Normalized IAST）' });
          paragraphs.push({ kind: 'text', text: ms.normalizedIastExcerpt });
        }
        (ms.extractedMantras || []).forEach((m, i) =>
          paragraphs.push({ kind: 'dharani', text: `[真言 ${i + 1}] ${m}` })
        );
      }
    }
    return {
      title: entry.titleSanskritIast || entry.titleZh,
      byline: entry.translatorZh,
      sourceBadgeZh: 'DB10 · ALL-NIBS 梵文写本原文',
      lang: 'sa-Latn',
      paragraphs: paragraphs.length > 0 ? paragraphs : buildWitnessFallbackParagraphs(entry),
    };
  }

  if (ref.kind === 'cetom-witness' || ref.kind === 'idp-xml') {
    const db11 = await fetchJsonOnce<{
      cetomRecords?: Array<{
        cetomId: string;
        shelfmark: string;
        repository: string;
        findspot: string;
        script: string;
        diplomaticLines: Array<{ lineNum: string; transliteration: string }>;
        normalizedIastLines?: string[];
      }>;
      idpRecords?: Array<{
        id: string;
        pressmark: string;
        title: string;
        collectionSite: string;
        scriptAndLanguage: string;
        description: string;
        diplomaticTransliteration?: string;
        normalizedMantraIast?: string;
      }>;
    }>('/data/tier23/db11_idp_dunhuang.json');

    if (ref.kind === 'cetom-witness' && db11?.cetomRecords) {
      const cetId = entry.id.replace(/^db11-cetom-/, '');
      const cet = db11.cetomRecords.find((x) => x.cetomId === cetId);
      if (cet) {
        const paragraphs: CbetaFullParagraph[] = [
          {
            kind: 'head',
            text: `${cet.shelfmark}（${cet.findspot}出土 · ${cet.script}）逐行外交转写全文`,
          },
          {
            kind: 'text',
            text: `【馆藏机构】${cet.repository} ｜ 【出土地】${cet.findspot}`,
          },
          ...cet.diplomaticLines.map((l) => ({
            kind: 'dharani' as const,
            text: `[叶行 ${l.lineNum}] ${l.transliteration}`,
          })),
        ];
        if (cet.normalizedIastLines && cet.normalizedIastLines.length > 0) {
          paragraphs.push({ kind: 'head', text: '古典梵语对勘还原全文（Parallel Sanskrit Restoration）' });
          cet.normalizedIastLines.forEach((l, i) =>
            paragraphs.push({ kind: 'text', text: `[${i + 1}] ${l}` })
          );
        }
        return {
          title: `CEToM ${cet.shelfmark}`,
          byline: cet.repository,
          sourceBadgeZh: 'DB11 · CEToM 西域婆罗谜残卷',
          lang: 'sa-Latn',
          paragraphs,
        };
      }
    }
    return {
      title: entry.titleZh,
      byline: entry.translatorZh,
      sourceBadgeZh: 'DB11 · 西域丝路写卷原文',
      lang: 'sa-Latn',
      paragraphs: buildWitnessFallbackParagraphs(entry),
    };
  }

  if (ref.kind === 'ochs-lexicon') {
    const db12 = await fetchJsonOnce<{
      ochsLexiconManuscripts?: Array<{
        slug: string;
        ochsNumber: number;
        titleSanskrit: string;
        verses: Array<{
          verseNumber: number;
          chapterOrSection?: string;
          sanskritIast: string;
          targetBijaSyllables: string[];
        }>;
      }>;
    }>('/data/tier23/db12_muktabodha_ochs.json');
    const slug = entry.id.replace(/^db12-ochs-/, '');
    const ochs = db12?.ochsLexiconManuscripts?.find((x) => x.slug === slug);
    if (ochs) {
      return {
        title: `${ochs.titleSanskrit} (Oxford OCHS #${ochs.ochsNumber})`,
        byline: 'Oxford Centre for Hindu Studies (OCHS) Tantric Manuscript Library',
        sourceBadgeZh: `DB12 · 牛津 OCHS #${ochs.ochsNumber} 全本`,
        lang: 'sa-Latn',
        paragraphs: [
          {
            kind: 'head',
            text: `《${ochs.titleSanskrit}》全本无截断梵文原颂（共 ${ochs.verses.length} 颂）`,
          },
          ...ochs.verses.map((v) => ({
            kind: 'dharani' as const,
            text: `[颂 ${v.verseNumber}${v.chapterOrSection ? ` · ${v.chapterOrSection}` : ''}] ${v.sanskritIast}${v.targetBijaSyllables.length > 0 ? `  （所释种子字：${v.targetBijaSyllables.join(', ')}）` : ''}`,
          })),
        ],
      };
    }
  }

  if (ref.kind === 'dharma-muktabodha' || ref.kind === 'bkkbooks-yaml') {
    try {
      const rawTxt = await fetchTextWithProxyFallback(ref.url);
      const lines = rawTxt
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      return {
        title: entry.titleSanskritIast || entry.titleZh,
        byline: entry.translatorZh,
        sourceBadgeZh: ref.sourceBadgeZh || '原典全文',
        lang: ref.kind === 'bkkbooks-yaml' ? 'zh-Hant' : 'sa-Latn',
        paragraphs: lines.map((line) => ({
          kind:
            /^#|^title:|^chapter/i.test(line)
              ? ('head' as const)
              : /\b(?:oṃ|svāhā|phaṭ|hūṃ|namo)\b/i.test(line)
              ? ('dharani' as const)
              : ('text' as const),
          text: line,
        })),
      };
    } catch {
      return {
        title: entry.titleZh,
        byline: entry.translatorZh,
        sourceBadgeZh: ref.sourceBadgeZh,
        lang: 'sa-Latn',
        paragraphs: buildWitnessFallbackParagraphs(entry),
      };
    }
  }

  // Standard GRETIL HTML/TXT witness
  try {
    const html = await fetchTextWithProxyFallback(ref.url);
    const title = htmlToText(
      (html.match(/<title>([\s\S]*?)<\/title>/i) || ['', ref.id])[1] || ref.id
    );
    const paragraphs: CbetaFullParagraph[] = htmlToText(html)
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => ({
        kind: /\b(?:oṃ|svāhā|phaṭ|tadyathā)\b/i.test(t)
          ? ('dharani' as const)
          : ('text' as const),
        text: t,
      }));
    return {
      title,
      byline: 'Göttingen Register of Electronic Texts in Indian Languages (GRETIL)',
      sourceBadgeZh: ref.sourceBadgeZh || 'GRETIL 梵文原典',
      lang: 'sa-Latn',
      paragraphs: paragraphs.length > 0 ? paragraphs : buildWitnessFallbackParagraphs(entry),
    };
  } catch {
    return {
      title: entry.titleSanskritIast || entry.titleZh,
      byline: entry.translatorZh,
      sourceBadgeZh: ref.sourceBadgeZh || '库藏原文录文',
      lang: 'sa-Latn',
      paragraphs: buildWitnessFallbackParagraphs(entry),
    };
  }
}

export function loadUniversalOriginalSource(
  ref: EntrySourceRef,
  entry: DharaniEntry
): Promise<UniversalLoadedSource> {
  const cacheKey = `${ref.kind}|${ref.id}|${ref.url}|${entry.id}`;
  let p = sourceMemCache.get(cacheKey);
  if (!p) {
    p = loadSpecificSource(ref, entry);
    p.catch(() => sourceMemCache.delete(cacheKey));
    sourceMemCache.set(cacheKey, p);
  }
  return p;
}
