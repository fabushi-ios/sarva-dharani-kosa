/**
 * CBETA XML-P5 密教部 (T18–T21) 实时在线拉取与 TEI 解析服务 (src/services/cbeta/cbetaLiveService.ts)
 *
 * 支持用户在「大正藏密教部全景浏览器」中点击任意一部密教部经号 (T0848–T1420)，
 * 直接从 raw.githubusercontent.com/cbeta-org/xml-p5 实时拉取原典 XML，
 * 提取经题、译者、<p cb:type="dharani"> 陀罗尼咒文段落、<cb:tt> 悉昙梵汉逐字对音及唐代音注。
 */

import { CBETA_SCRIPTURE_RECORDS, CbetaSiddhamPair } from '../../data/generated/cbetaAuthRecords';

export interface LiveCbetaScriptureResult {
  id: string;
  vol: string;
  title: string;
  translator: string;
  xmlUrl: string;
  dharaniParagraphs: string[];
  ttPairs: CbetaSiddhamPair[];
  rawXmlPreview: string;
  fetchedFromCache: boolean;
}

const memoryCache = new Map<string, LiveCbetaScriptureResult>();

export async function fetchLiveCbetaScripture(
  id: string,
  vol: string,
  fallbackUrl?: string
): Promise<LiveCbetaScriptureResult> {
  if (memoryCache.has(id)) {
    return memoryCache.get(id)!;
  }

  // 若本地已预编译该经 (如 T19n0974B, T20n1113B, T20n1080 等)，优先返回完整高精结构化数据
  const prebuilt = CBETA_SCRIPTURE_RECORDS[id];
  if (prebuilt && (prebuilt.ttPairs.length > 0 || prebuilt.dharaniParagraphs.length > 0)) {
    const res: LiveCbetaScriptureResult = {
      id: prebuilt.id,
      vol: prebuilt.vol,
      title: prebuilt.title,
      translator: prebuilt.translator,
      xmlUrl: prebuilt.rawUrl,
      dharaniParagraphs: prebuilt.dharaniParagraphs,
      ttPairs: prebuilt.ttPairs,
      rawXmlPreview: prebuilt.rawXmlExcerpt,
      fetchedFromCache: true
    };
    memoryCache.set(id, res);
    return res;
  }

  const candidateUrls = [
    fallbackUrl || `https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/${vol}/${id}.xml`,
    `https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/${vol}/${id}A.xml`,
    `https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/${vol}/${id}a.xml`
  ];

  let xmlText = '';
  let finalUrl = candidateUrls[0];

  for (const url of candidateUrls) {
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        xmlText = await resp.text();
        finalUrl = url;
        break;
      }
    } catch {
      // Try next candidate
    }
  }

  if (!xmlText) {
    throw new Error(`无法从 CBETA GitHub 仓库拉取经号 ${id} 的 XML 原典（可能该经号含特殊分卷后缀 A/B）`);
  }

  const titleMatch =
    xmlText.match(/<title[^>]*level="m"[^>]*>([\s\S]*?)<\/title>/) ||
    xmlText.match(/<cb:jhead[^>]*>([\s\S]*?)<\/cb:jhead>/) ||
    xmlText.match(/<title[^>]*>([\s\S]*?)<\/title>/);
  const rawTitle = titleMatch
    ? titleMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    : id;

  const authorMatch =
    xmlText.match(/<author[^>]*>([\s\S]*?)<\/author>/) ||
    xmlText.match(/<byline[^>]*cb:type="Translator"[^>]*>([\s\S]*?)<\/byline>/) ||
    xmlText.match(/<byline[^>]*>([\s\S]*?)<\/byline>/);
  const translator = authorMatch
    ? authorMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    : '唐宋三藏法师译';

  // 提取 <p cb:type="dharani">
  const dharaniParagraphs: string[] = [];
  const pRegex = /<p[^>]*cb:type="dharani"[^>]*>([\s\S]*?)<\/p>/g;
  let m: RegExpExecArray | null;
  while ((m = pRegex.exec(xmlText)) !== null) {
    const cleaned = m[1]
      .replace(/<note[^>]*>([\s\S]*?)<\/note>/g, '（$1）')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned.length > 2) {
      dharaniParagraphs.push(cleaned);
    }
  }

  // 提取 <cb:tt> 对音
  const ttPairs: CbetaSiddhamPair[] = [];
  const ttRegex = /<cb:tt[^>]*>([\s\S]*?)<\/cb:tt>/g;
  while ((m = ttRegex.exec(xmlText)) !== null) {
    const block = m[1];
    const sdMatch = block.match(/ref="#((?:SD|RJ)-[A-Z0-9]+)"/);
    const sdCode = sdMatch ? sdMatch[1] : '';
    const zhMatch = block.match(/<cb:t[^>]*xml:lang="zh-Hant"[^>]*>([\s\S]*?)<\/cb:t>/);
    if (!zhMatch) continue;
    const zhContent = zhMatch[1];
    const sgMatches = [...zhContent.matchAll(/<cb:sg[^>]*>([\s\S]*?)<\/cb:sg>/g)];
    const yinNote = sgMatches.map(s => s[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean).join('·');
    const inlineNotes = [...zhContent.matchAll(/<note[^>]*>([\s\S]*?)<\/note>/g)]
      .map(s => s[1].replace(/<[^>]+>/g, '').trim())
      .filter(Boolean)
      .join('；');
    const zhChar = zhContent
      .replace(/<cb:sg[^>]*>[\s\S]*?<\/cb:sg>/g, '')
      .replace(/<note[^>]*>[\s\S]*?<\/note>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, '')
      .trim();
    if (sdCode || zhChar) {
      ttPairs.push({
        sdCode,
        siddhamChar: '',
        iast: '',
        zhChar: zhChar || '○',
        yinNote: yinNote || undefined,
        inlineGloss: inlineNotes || undefined
      });
    }
  }

  const dharaniSnippet =
    xmlText.match(/<p[^>]*cb:type="dharani"[\s\S]{1,1200}/)?.[0] ||
    xmlText.match(/<body[\s\S]{1,1200}/)?.[0] ||
    xmlText.slice(0, 1200);

  const result: LiveCbetaScriptureResult = {
    id,
    vol,
    title: rawTitle,
    translator,
    xmlUrl: finalUrl,
    dharaniParagraphs,
    ttPairs: ttPairs.slice(0, 300),
    rawXmlPreview: dharaniSnippet.trim(),
    fetchedFromCache: false
  };

  memoryCache.set(id, result);
  return result;
}
