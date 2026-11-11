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
    siddhamText?: string;
    iastText?: string;
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

  // Parse charDecl for rare phonetic characters (#CB*) including normal_unicode & normalized form
  const CB_FALLBACK_OVERRIDES: Record<string, string> = {
    CB00155: '冐', CB00560: '𡀔', CB00576: '𩕳', CB00754: '櫱', CB01060: '叱',
    CB01211: '𠸪', CB01418: '隸', CB01454: '吒', CB01655: '薩', CB01811: '𡀔',
    CB02048: '禇', CB02253: '𡅏', CB02303: '襪', CB02494: '𭌆', CB02641: '嚩',
    CB02735: '𡃤', CB02766: '𤧕', CB03229: '𤚥', CB03337: '嚇', CB03363: '𠰢',
    CB03412: '𠺁', CB03420: '䄡', CB03533: '𡄳', CB03602: '蓲', CB03611: '𪑛',
    CB03639: '馱', CB03723: '曵', CB03746: '櫱', CB03928: '曵', CB03930: '羯',
    CB03938: '陟', CB03942: '隸', CB03947: '隸', CB03952: '嚕', CB04178: '𠻴',
    CB04192: '𠼝', CB04319: '䫘', CB04602: '囉', CB04861: '泮', CB05085: '𡁠',
    CB05434: '𡂖', CB08859: '你',
  };
  const isPua = (cp: number) =>
    (cp >= 0xe000 && cp <= 0xf8ff) || cp >= 0xf0000;
  const stripPua = (s: string) =>
    Array.from(s)
      .filter((ch) => !isPua(ch.codePointAt(0) || 0))
      .join('');

  const cbCharMap: Record<string, string> = { ...CB_FALLBACK_OVERRIDES };
  const charRegex = /<char\s+xml:id="([^"]+)"[^>]*>([\s\S]*?)<\/char>/g;
  let cm: RegExpExecArray | null;
  while ((cm = charRegex.exec(xml)) !== null) {
    const cid = cm[1];
    const body = cm[2];
    if (cbCharMap[cid]) continue;
    const uniMatch =
      body.match(/<mapping\s+type="unicode">U\+([0-9A-Fa-f]+)<\/mapping>/) ||
      body.match(/<mapping\s+type="normal_unicode">U\+([0-9A-Fa-f]+)<\/mapping>/);
    if (uniMatch) {
      const cp = parseInt(uniMatch[1], 16);
      if (!isPua(cp)) {
        cbCharMap[cid] = String.fromCodePoint(cp);
        continue;
      }
    }
    const normForm = body.match(
      /<localName>normalized form<\/localName>\s*<value>([^<]+)<\/value>/
    );
    if (normForm) {
      const cleanedNorm = stripPua(normForm[1].trim());
      if (cleanedNorm) {
        cbCharMap[cid] = cleanedNorm;
        continue;
      }
    }
    const compMatch = body.match(
      /<localName>composition<\/localName>\s*<value>([^<]+)<\/value>/
    );
    if (compMatch && cid.startsWith('CB')) {
      cbCharMap[cid] = stripPua(compMatch[1].trim());
    }
  }

  const resolveGaijiTags = (fragment: string): string =>
    fragment
      .replace(/<g\s+ref="#([^"]+)"[^>]*\/>/g, (_, gid: string) => cbCharMap[gid] || '')
      .replace(/<g\s+ref="#([^"]+)"[^>]*>[\s\S]*?<\/g>/g, (_, gid: string) => cbCharMap[gid] || '');

  const dharaniBlocks: {
    index: number;
    text: string;
    tangNotes: string[];
    siddhamText?: string;
    iastText?: string;
  }[] = [];
  const pRegex = /<p[^>]*cb:type="dharani"[^>]*>([\s\S]*?)<\/p>/g;
  let pm: RegExpExecArray | null;
  let idx = 1;
  while ((pm = pRegex.exec(xml)) !== null) {
    const rawP = pm[1];
    const tangNotes = [...rawP.matchAll(/<note place="inline">([\s\S]*?)<\/note>/g)]
      .map((m) => stripPua(resolveGaijiTags(m[1]).replace(/<[^>]+>/g, '')).trim())
      .filter(Boolean);

    const siddhamMatches = [...rawP.matchAll(/<cb:t[^>]*xml:lang="sa-Sidd"[^>]*>([\s\S]*?)<\/cb:t>/g)]
      .map((m) => stripPua(resolveGaijiTags(m[1]).replace(/<[^>]+>/g, '')).trim())
      .filter(Boolean);
    const iastMatches = [...rawP.matchAll(/<cb:t[^>]*xml:lang="sa-Latn"[^>]*>([\s\S]*?)<\/cb:t>/g)]
      .map((m) => m[1].replace(/<[^>]+>/g, '').trim())
      .filter(Boolean);

    const cleanText = stripPua(
      resolveGaijiTags(
        rawP
          .replace(/<cb:t[^>]*xml:lang="sa-Sidd"[^>]*>[\s\S]*?<\/cb:t>/g, '')
          .replace(/<cb:t[^>]*xml:lang="sa-Latn"[^>]*>[\s\S]*?<\/cb:t>/g, '')
          .replace(/<cb:sg>([^<]+)<\/cb:sg>/g, '($1)')
          .replace(/<note place="inline">([\s\S]*?)<\/note>/g, ' [$1] ')
      )
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
    ).trim();

    if (cleanText) {
      dharaniBlocks.push({
        index: idx++,
        text: cleanText,
        tangNotes,
        siddhamText: siddhamMatches.length > 0 ? siddhamMatches.join(' ') : undefined,
        iastText: iastMatches.length > 0 ? iastMatches.join(' ') : undefined,
      });
    }
  }

  // Extract body preview if no explicit cb:type="dharani" tag was used in that sutra
  const bodyMatch = xml.match(/<body>([\s\S]*?)<\/body>/);
  const rawBody = bodyMatch ? bodyMatch[1] : xml;
  const bodyPreviewText = Array.from(
    stripPua(
      resolveGaijiTags(rawBody)
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
    ).trim()
  )
    .slice(0, 1200)
    .join('');

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
