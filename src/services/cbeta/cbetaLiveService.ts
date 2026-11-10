/**
 * src/services/cbeta/cbetaLiveService.ts
 *
 * Real-Time CBETA TEI P5 XML Parser Service
 * Allows the user to select ANY of the 614 Taishō Tripiṭaka Esoteric Canon (T18–T21)
 * XML scriptures and parse its authentic <p cb:type="dharani"> mantra blocks,
 * <cb:tt> Siddhaṃ-Chinese alignments, and Tang Dynasty inline notes on the fly.
 */

export interface LiveParsedCbetaSutra {
  id: string;
  vol: string;
  titleZh: string;
  translator: string;
  rawXmlUrl: string;
  cbetaOnlineUrl: string;
  dharaniBlocks: {
    index: number;
    text: string;
    tangNotes: string[];
  }[];
  bodyPreviewText: string;
  rawXmlSnippet: string;
}

const liveCache = new Map<string, LiveParsedCbetaSutra>();

export async function fetchAndParseCbetaXmlLive(
  id: string,
  vol: string,
  rawXmlUrl: string
): Promise<LiveParsedCbetaSutra> {
  const cached = liveCache.get(id);
  if (cached) return cached;

  const res = await fetch(rawXmlUrl);
  if (!res.ok) {
    throw new Error(`无法拉取 CBETA 原典 XML (${res.status}): ${id}`);
  }
  const xml = await res.text();

  const titleMatch = xml.match(/<title level="m" xml:lang="zh-Hant">([^<]+)<\/title>/);
  const authorMatch = xml.match(/<author>([^<]+)<\/author>|<byline[^>]*>([^<]+)<\/byline>/);
  const titleZh = titleMatch ? titleMatch[1].trim() : id;
  const translator = authorMatch ? (authorMatch[1] || authorMatch[2] || '').trim() : '失译 / 阙名';

  // Parse charDecl for rare phonetic characters (#CB*)
  const cbCharMap: Record<string, string> = {};
  const charRegex = /<char xml:id="(CB\d+)">[\s\S]*?<value>([^<]+)<\/value>([\s\S]*?)<\/char>/g;
  let cm: RegExpExecArray | null;
  while ((cm = charRegex.exec(xml)) !== null) {
    const cbId = cm[1];
    const comp = cm[2];
    const uniMatch = cm[3].match(/<mapping type="unicode">U\+([0-9A-Fa-f]+)<\/mapping>/);
    cbCharMap[cbId] = uniMatch ? String.fromCodePoint(parseInt(uniMatch[1], 16)) : comp;
  }

  const dharaniBlocks: { index: number; text: string; tangNotes: string[] }[] = [];
  const pRegex = /<p[^>]*cb:type="dharani"[^>]*>([\s\S]*?)<\/p>/g;
  let pm: RegExpExecArray | null;
  let idx = 1;
  while ((pm = pRegex.exec(xml)) !== null) {
    const rawP = pm[1];
    const tangNotes = [...rawP.matchAll(/<note place="inline">([\s\S]*?)<\/note>/g)]
      .map((m) => m[1].replace(/<[^>]+>/g, '').trim())
      .filter(Boolean);

    const cleanText = rawP
      .replace(/<cb:t xml:lang="sa-Sidd">[\s\S]*?<\/cb:t>/g, '')
      .replace(/<cb:sg>([^<]+)<\/cb:sg>/g, '($1)')
      .replace(/<note place="inline">([^<]*)<\/note>/g, ' [$1] ')
      .replace(/<g ref="#(CB\d+)"[^>]*>.*?<\/g>/g, (_, cid) => cbCharMap[cid] || '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanText) {
      dharaniBlocks.push({
        index: idx++,
        text: cleanText,
        tangNotes,
      });
    }
  }

  // Extract body preview if no explicit cb:type="dharani" tag was used in that sutra
  const bodyMatch = xml.match(/<body>([\s\S]*?)<\/body>/);
  const rawBody = bodyMatch ? bodyMatch[1] : xml;
  const bodyPreviewText = rawBody
    .replace(/<g ref="#(CB\d+)"[^>]*>.*?<\/g>/g, (_, cid) => cbCharMap[cid] || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1200);

  const parsed: LiveParsedCbetaSutra = {
    id,
    vol,
    titleZh,
    translator,
    rawXmlUrl,
    cbetaOnlineUrl: `https://cbetaonline.dila.edu.tw/zh/${id}`,
    dharaniBlocks,
    bodyPreviewText,
    rawXmlSnippet: xml.slice(0, 2600),
  };

  liveCache.set(id, parsed);
  return parsed;
}
