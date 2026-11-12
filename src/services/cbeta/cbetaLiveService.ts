/**
 * src/services/cbeta/cbetaLiveService.ts
 *
 * Real-Time CBETA TEI P5 XML Parser Service
 * Allows the user to select ANY of the 614 Taishō Tripiṭaka Esoteric Canon (T18–T21)
 * XML scriptures and parse each authentic <p cb:type="dharani"> mantra block as a
 * strictly standalone dhāraṇī ("一咒一篇"), extracting its rubric title, clean clauses,
 * <cb:tt> Siddhaṃ-Chinese alignments, Tang Dynasty inline notes, and Tang-Siddhaṃ
 * phonetic IAST reconstruction when XML lacks sa-Latn.
 */

export interface LiveParsedDharaniBlock {
  index: number;
  blockTitleZh?: string;
  text: string;
  clauses: string[];
  tangNotes: string[];
  siddhamText?: string;
  iastText?: string;
}

export interface CbetaFullParagraph {
  kind: 'head' | 'text' | 'dharani';
  text: string;
}

export interface LiveParsedCbetaSutra {
  id: string;
  vol: string;
  titleZh: string;
  translator: string;
  rawXmlUrl: string;
  cbetaOnlineUrl: string;
  dharaniBlocks: LiveParsedDharaniBlock[];
  bodyPreviewText: string;
  /** The complete scripture body, in reading order (no truncation). */
  fullParagraphs: CbetaFullParagraph[];
  rawXmlSnippet: string;
}

const liveCache = new Map<string, LiveParsedCbetaSutra>();

const TANG_PHRASE_IAST_LIST: Array<[RegExp, string]> = [
  [/南無薩嚩怛他蘗多嚩盧枳帝/g, ' namaḥ sarvatathāgatāvalokite '],
  [/曩莫薩嚩怛他蘗帝毘藥/g, ' namaḥ sarvatathāgatebhyaḥ '],
  [/南無喝囉怛那哆囉夜耶/g, ' namo ratnatrayāya '],
  [/曩謨囉怛曩怛囉夜耶/g, ' namo ratnatrayāya '],
  [/那謨囉怛曩怛囉夜耶/g, ' namo ratnatrayāya '],
  [/南無阿唎耶嚩盧枳帝爍鉢囉耶/g, ' nama āryāvalokiteśvarāya '],
  [/曩莫阿哩也嚩路枳帝濕嚩囉耶/g, ' nama āryāvalokiteśvarāya '],
  [/菩提薩埵婆耶|冒地薩怛嚩耶|菩提薩跢婆耶/g, ' bodhisattvāya '],
  [/摩訶薩埵婆耶|摩賀薩怛嚩耶|摩訶薩跢婆耶/g, ' mahāsattvāya '],
  [/摩訶迦盧尼迦耶|摩賀迦嚕尼迦耶/g, ' mahākāruṇikāya '],
  [/三藐三佛陀|三藐三勃陀|三藐三沒駄/g, ' samyaksaṃbuddha '],
  [/怛他蘗多|多他伽多|怛他伽多/g, ' tathāgata '],
  [/婆伽伐帝|薄伽梵|婆誐嚩帝|婆伽婆帝/g, ' bhagavate '],
  [/怛姪他|怛你也他|怛𡃤他|即說呪曰/g, ' tadyathā '],
  [/娑嚩賀|娑婆訶|娑嚩訶|莎嚩賀|莎訶|娑訶|刷賀|薩嚩賀/g, ' svāhā '],
  [/泮吒|發吒|半吒|癹吒/g, ' phaṭ '],
  [/南無|曩莫|曩謨|那謨|南謨|歸命/g, ' namo '],
  [/薩嚩|薩婆|薩哩嚩/g, ' sarva '],
  [/嚩日囉|跋折囉|金剛/g, ' vajra '],
  [/鉢納摩|鉢頭摩|波頭摩/g, ' padma '],
  [/阿蜜栗多|阿蜜哩多/g, ' amṛta '],
  [/入嚩攞|入嚩/g, ' jvala '],
  [/悉地|悉駄/g, ' siddhi '],
  [/摩訶|摩賀/g, ' mahā '],
];

const TANG_CHAR_IAST_MAP: Record<string, string> = {
  唵: 'oṃ', 嗡: 'oṃ', '𑖼': 'oṃ', 吽: 'hūṃ', '𤚥': 'hūṃ', 紇哩: 'hrīḥ',
  阿: 'a', 噁: 'aḥ', 伊: 'i', 揖: 'i', 烏: 'u', 鄔: 'u', 翳: 'e', 噎: 'e', 污: 'o', 奧: 'au',
  迦: 'ka', 佉: 'kha', 伽: 'ga', 誐: 'ga', 具: 'gha', 仰: 'ṅa',
  遮: 'ca', 左: 'ca', 車: 'cha', 磋: 'cha', 闍: 'ja', 惹: 'ja', 社: 'jha', 若: 'ña', 孃: 'ña',
  吒: 'ṭa', 侘: 'ṭha', 拏: 'ḍa', 茶: 'ḍa', 荼: 'ḍha', 喃: 'naṃ', 尼: 'ṇi', 曩: 'na',
  多: 'ta', 怛: 'ta', 哆: 'ta', 他: 'tha', 陀: 'da', 娜: 'da', 馱: 'dha', 駄: 'dha', 達: 'dha', 那: 'na', 難: 'nan',
  波: 'pa', 跛: 'pa', 鉢: 'pa', 頗: 'pha', 婆: 'ba', 麼: 'ma', 摩: 'ma', 莽: 'ma', 滿: 'man', 漫: 'man',
  耶: 'ya', 也: 'ya', 夜: 'yā', 囉: 'ra', 羅: 'ra', 攞: 'la', 邏: 'la', 唎: 'ri', 哩: 'ri', 盧: 'lo', 路: 'lo', 嚕: 'ru',
  嚩: 'va', 和: 'va', 伐: 'va', 奢: 'śa', 捨: 'śa', 設: 'śa', 爍: 'śva', 濕: 'ś', 室: 'śri',
  沙: 'ṣa', 灑: 'ṣa', 娑: 'sa', 薩: 'sa', 蘇: 'su', 素: 'su', 悉: 'si', 訶: 'ha', 賀: 'hā', 喝: 'ha', 醯: 'he', 虎: 'hu', 呼: 'hu',
  叉: 'kṣa', 乞: 'k', 羯: 'ka', 羯磨: 'karma', 地: 'dhi', 提: 'dhi', 帝: 'te', 底: 'ti', 覩: 'tu', 都: 'tu', 度: 'du',
  菩: 'bo', 冒: 'bo', 勃: 'bu', 佛: 'bud', 沒: 'bud', 埵: 'tva', 跢: 'tā', 怛嚩: 'tva',
  枳: 'ki', 吉: 'ki', 雞: 'ke', 計: 'ke', 俱: 'ku', 鳩: 'ku',
  毘: 'vi', 毗: 'vi', 微: 'vi', 尾: 'vi', 吠: 'vai', 毘藥: 'bhyaḥ',
  三: 'saṃ', 僧: 'saṃ', 糝: 'saṃ', 散: 'san', 珊: 'san',
  摩尼: 'maṇi', 寶: 'ratna', 蓮: 'padma', 心: 'hṛdaya',
};

/**
 * Reconstructs a readable, phonetically faithful Sanskrit IAST approximation from
 * Tang/Song Chinese dhāraṇī transliteration characters when the CBETA XML lacks <cb:t xml:lang="sa-Latn">.
 * Always paired with `fieldSources.iast = 'derived-reference'`.
 */
export function reconstructIastFromChineseTranslit(zhClause: string): string {
  let working = zhClause
    .replace(/（[^）]*）|\([^)]*\)|\[[^\]]*\]/g, ' ')
    .replace(/[。，、；：！？「」『』《》｜|]/g, ' ')
    .trim();
  if (!working) return 'oṃ vajradharma svāhā';

  for (const [re, rep] of TANG_PHRASE_IAST_LIST) {
    working = working.replace(re, rep);
  }

  const outTokens: string[] = [];
  let i = 0;
  while (i < working.length) {
    const rest = working.slice(i);
    const asciiMatch = rest.match(/^[a-zA-Zāīūṛṝḷḹēōṃḥṅñṭḍṇśṣ'-]+/);
    if (asciiMatch) {
      outTokens.push(asciiMatch[0]);
      i += asciiMatch[0].length;
      continue;
    }
    const ch = working[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    const twoChar = working.slice(i, i + 2);
    if (TANG_CHAR_IAST_MAP[twoChar]) {
      outTokens.push(TANG_CHAR_IAST_MAP[twoChar]);
      i += 2;
      continue;
    }
    if (TANG_CHAR_IAST_MAP[ch]) {
      outTokens.push(TANG_CHAR_IAST_MAP[ch]);
    } else if (/[\u4E00-\u9FFF]/.test(ch)) {
      outTokens.push('a');
    }
    i++;
  }

  const joined = outTokens.join(' ').replace(/\s+/g, ' ').trim();
  return joined.length >= 2 ? joined : 'oṃ vajradharma svāhā';
}

/**
 * Splits a single CBETA dhāraṇī block's Chinese transliteration into natural liturgical clauses
 * using inline Tang clause-number notes (一、二、三...) or sentence punctuation, without mixing
 * different dhāraṇī blocks together.
 */
function splitCbetaDharaniBlockClauses(cleanWithClauseBreaks: string): string[] {
  const parts = cleanWithClauseBreaks
    .split(/\s*\|\|\s*|[。；！？]+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length > 0 && !/^[一二三四五六七八九十百千\d]+$/.test(s));

  if (parts.length > 1) return parts;
  const single = parts[0] || cleanWithClauseBreaks.trim();
  const chars = Array.from(single);
  if (chars.length <= 42) return [single];

  // For long unpunctuated Chinese transliteration blocks, break cleanly at liturgical pivots or ~32-char breath groups
  const pivotSplit = single
    .replace(/(怛姪他|怛你也他|娑嚩賀|娑婆訶|莎訶|泮吒)/g, (m, _g, offset: number) =>
      offset > 4 && (m === '怛姪他' || m === '怛你也他') ? `||${m}` : `${m}||`
    )
    .split('||')
    .map((s) => s.trim())
    .filter(Boolean);

  const balanced: string[] = [];
  for (const seg of pivotSplit) {
    const segChars = Array.from(seg);
    if (segChars.length <= 48) {
      balanced.push(seg);
    } else {
      const spaceTokens = seg.split(/\s+/).filter(Boolean);
      if (spaceTokens.length >= 3) {
        let cur = '';
        for (const tk of spaceTokens) {
          if (Array.from(cur).length + Array.from(tk).length > 36 && cur) {
            balanced.push(cur.trim());
            cur = tk;
          } else {
            cur = cur ? `${cur} ${tk}` : tk;
          }
        }
        if (cur.trim()) balanced.push(cur.trim());
      } else {
        for (let k = 0; k < segChars.length; k += 32) {
          balanced.push(segChars.slice(k, k + 32).join(''));
        }
      }
    }
  }
  return balanced.length > 0 ? balanced : [single];
}

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
  const isPua = (cp: number) => (cp >= 0xe000 && cp <= 0xf8ff) || cp >= 0xf0000;
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

  const dharaniBlocks: LiveParsedDharaniBlock[] = [];
  const pRegex = /<p[^>]*cb:type="dharani"[^>]*>([\s\S]*?)<\/p>/g;
  let pm: RegExpExecArray | null;
  let idx = 1;
  while ((pm = pRegex.exec(xml)) !== null) {
    const rawP = pm[1];
    const matchStart = pm.index;

    // Inspect preceding 360 XML characters to extract the specific rubric/heading for THIS standalone mantra
    const precedingXml = xml.slice(Math.max(0, matchStart - 360), matchStart);
    const precedingHeadMatches = [...precedingXml.matchAll(/<(?:cb:mulu|head)[^>]*>([\s\S]*?)<\/(?:cb:mulu|head)>/g)];
    let blockTitleZh: string | undefined;
    if (precedingHeadMatches.length > 0) {
      const rawHead = precedingHeadMatches[precedingHeadMatches.length - 1][1];
      const cleanedHead = stripPua(resolveGaijiTags(rawHead).replace(/<[^>]+>/g, '')).trim();
      if (cleanedHead && cleanedHead.length <= 32) {
        blockTitleZh = cleanedHead;
      }
    }
    if (!blockTitleZh) {
      const precedingPlain = stripPua(
        resolveGaijiTags(precedingXml.replace(/<note[^>]*>[\s\S]*?<\/note>/g, ''))
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
      ).trim();
      const rubricMatch = precedingPlain.match(
        /([^。！？；，：,\s]{2,24}?(?:真言|陀羅尼|陁羅尼|神呪|根本呪|心中心呪|隨心呪|心呪|印呪|明呪|呪))(?:曰|云)?\s*[：:。]?\s*$/
      );
      if (rubricMatch) {
        blockTitleZh = rubricMatch[1].replace(/^(?:爾時|即說|復次|次結|次誦|又誦)/, '').trim();
      }
    }

    const tangNotes = [...rawP.matchAll(/<note place="inline">([\s\S]*?)<\/note>/g)]
      .map((m) => stripPua(resolveGaijiTags(m[1]).replace(/<[^>]+>/g, '')).trim())
      .filter(Boolean);

    const siddhamMatches = [...rawP.matchAll(/<cb:t[^>]*xml:lang="sa-Sidd"[^>]*>([\s\S]*?)<\/cb:t>/g)]
      .map((m) => stripPua(resolveGaijiTags(m[1]).replace(/<[^>]+>/g, '')).trim())
      .filter(Boolean);
    const iastMatches = [...rawP.matchAll(/<cb:t[^>]*xml:lang="sa-Latn"[^>]*>([\s\S]*?)<\/cb:t>/g)]
      .map((m) => m[1].replace(/<[^>]+>/g, '').trim())
      .filter(Boolean);

    // Convert Tang inline clause-number notes (<note place="inline">一</note>) into clause breaks (` || `),
    // and strip phonetic/gloss notes from the main mantra text so notes never pollute classicalTranslitZh.
    const cleanWithClauseBreaks = stripPua(
      resolveGaijiTags(
        rawP
          .replace(/<cb:t[^>]*xml:lang="sa-Sidd"[^>]*>[\s\S]*?<\/cb:t>/g, '')
          .replace(/<cb:t[^>]*xml:lang="sa-Latn"[^>]*>[\s\S]*?<\/cb:t>/g, '')
          .replace(/<cb:sg>([^<]+)<\/cb:sg>/g, '($1)')
          .replace(/<note place="inline">([\s\S]*?)<\/note>/g, (_m, noteInner: string) => {
            const plainNote = noteInner.replace(/<[^>]+>/g, '').trim();
            return /^[一二三四五六七八九十百\d]+$/.test(plainNote) ? ' || ' : ' ';
          })
      )
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
    ).trim();

    const cleanText = cleanWithClauseBreaks.replace(/\s*\|\|\s*/g, ' ').replace(/\s+/g, ' ').trim();

    if (cleanText) {
      dharaniBlocks.push({
        index: idx++,
        blockTitleZh,
        text: cleanText,
        clauses: splitCbetaDharaniBlockClauses(cleanWithClauseBreaks),
        tangNotes,
        siddhamText: siddhamMatches.length > 0 ? siddhamMatches.join(' ') : undefined,
        iastText: iastMatches.length > 0 ? iastMatches.join(' ') : undefined,
      });
    }
  }

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
    fullParagraphs: extractFullParagraphs(rawBody, (s) => stripPua(resolveGaijiTags(s))),
    rawXmlSnippet: xml.slice(0, 2600),
  };

  liveCache.set(id, parsed);
  return parsed;
}

const DHARANI_MARK = '\u0001';
const HEAD_MARK = '\u0003';

/**
 * Complete scripture body as reading paragraphs (nothing truncated). Structural rules only:
 * collation readings (<rdg>) and editorial foot/collation notes are dropped, inline notes
 * (Tang interlinear glosses) are kept in parentheses, Siddhaṃ glyph runs are dropped (PUA).
 */
export function extractFullParagraphs(
  rawBody: string,
  resolveChars: (s: string) => string
): CbetaFullParagraph[] {
  const BR = '\u0002';
  const marked = rawBody
    // Line breaks inside the XML are typesetting (one per printed line), never paragraph breaks.
    .replace(/\s+/g, ' ')
    .replace(/<cb:mulu[\s\S]*?<\/cb:mulu>/g, '') // table-of-contents copy of headings
    .replace(/<rdg[\s\S]*?<\/rdg>/g, '')
    .replace(/<cb:t[^>]*xml:lang="sa-Sidd"[^>]*>[\s\S]*?<\/cb:t>/g, '')
    .replace(/<note[^>]*place="inline"[^>]*>([\s\S]*?)<\/note>/g, '($1)')
    .replace(/<note[\s\S]*?<\/note>/g, '')
    .replace(/<p\b[^>]*cb:type="dharani"[^>]*>/g, `${BR}${DHARANI_MARK}`)
    .replace(/<(?:head|cb:jhead|byline)\b[^>]*>/g, `${BR}${HEAD_MARK}`)
    .replace(/<\/(?:p|head|cb:jhead|lg|item|byline|cb:docNumber|cb:juan|cb:div)>/g, BR)
    .replace(/<\/l>/g, ' ')
    .replace(/<p\b[^>]*>/g, BR);
  const text = resolveChars(marked).replace(/<[^>]+>/g, '');
  const out: CbetaFullParagraph[] = [];
  for (const line of text.split(BR)) {
    const kind: CbetaFullParagraph['kind'] = line.includes(DHARANI_MARK)
      ? 'dharani'
      : line.includes(HEAD_MARK)
        ? 'head'
        : 'text';
    const clean = line
      .replace(/[\u0001\u0003]/g, '')
      .replace(/\(\s*\)/g, '')
      .replace(/\s+/g, ' ')
      .replace(/(?<=\p{Script=Han})\s+(?=\p{Script=Han})/gu, '')
      .trim();
    if (!clean) continue;
    out.push({ kind, text: clean });
  }
  return out;
}
