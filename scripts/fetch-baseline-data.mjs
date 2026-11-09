#!/usr/bin/env node
/**
 * scripts/fetch-baseline-data.mjs
 * Genuine Authoritative Baseline Ingestion Pipeline for 梵音寶典 · Sarva-Dhāraṇī-Kośa (M1)
 *
 * Downloads, parses, normalizes, and compiles:
 * 1. public/fonts/NotoSansSiddham-Regular.woff2 (47,208 B, wOF2 header)
 * 2. cbeta-org/cbeta_gaiji/cbeta_sanskrit.json -> CBETA_GAIJI_MAP (2,240 SD-* and RJ-* entries)
 * 3. 19 Core CBETA TEI-P5 XML Scriptures -> CBETA_AUTH_RECORDS (916 <body> <cb:tt> alignments, 0 PUA leakage)
 * 4. DILA-edu/cbeta-metadata/work-info/T.json -> TAISHO_MIKKYO_INDEX (614 scriptures in T18–T21)
 * 5. 27 GRETIL Buddhist Sanskrit .htm files (25 canonical works + 2 alt editions) -> GRETIL_AUTH_RECORDS
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const PUBLIC_FONT_DIR = path.join(ROOT_DIR, 'public', 'fonts');
const PUBLIC_CBETA_DIR = path.join(ROOT_DIR, 'public', 'data', 'baseline', 'cbeta');
const PUBLIC_GRETIL_DIR = path.join(ROOT_DIR, 'public', 'data', 'baseline', 'gretil');
const PUBLIC_BASELINE_DIR = path.join(ROOT_DIR, 'public', 'data', 'baseline');
const GENERATED_DIR = path.join(ROOT_DIR, 'src', 'data', 'generated');

/* ============================================================================
 * Minimal IAST -> SLP1 -> Devanāgarī converter for Gaiji & TT alignment fields
 * ========================================================================== */
const IAST_TO_SLP1_RULES = [
  ['ai', 'E'], ['au', 'O'],
  ['kh', 'K'], ['gh', 'G'], ['ch', 'C'], ['jh', 'J'],
  ['ṭh', 'W'], ['ḍh', 'Q'], ['th', 'T'], ['dh', 'D'], ['ph', 'P'], ['bh', 'B'],
  ['ṝ', 'F'], ['ḹ', 'X'], ['ā', 'A'], ['ī', 'I'], ['ū', 'U'], ['ṛ', 'f'], ['ḷ', 'x'],
  ['ē', 'e'], ['ō', 'o'],
  ['ṅ', 'N'], ['ñ', 'Y'], ['ṭ', 'w'], ['ḍ', 'q'], ['ṇ', 'R'], ['ś', 'S'], ['ṣ', 'z'],
  ['ṃ', 'M'], ['ṁ', 'M'], ['ḥ', 'H'], ['ँ', '~']
];

const SLP1_VOWEL_TO_DEVA = {
  'a': 'अ', 'A': 'आ', 'i': 'इ', 'I': 'ई', 'u': 'उ', 'U': 'ऊ',
  'f': 'ऋ', 'F': 'ॠ', 'x': 'ऌ', 'X': 'ॡ', 'e': 'ए', 'E': 'ऐ', 'o': 'ओ', 'O': 'औ'
};
const SLP1_MATRA_TO_DEVA = {
  'a': '', 'A': 'ा', 'i': 'ि', 'I': 'ी', 'u': 'ु', 'U': 'ू',
  'f': 'ृ', 'F': 'ॄ', 'x': 'ॢ', 'X': 'ॣ', 'e': 'े', 'E': 'ै', 'o': 'ो', 'O': 'ौ'
};
const SLP1_CONS_TO_DEVA = {
  'k': 'क', 'K': 'ख', 'g': 'ग', 'G': 'घ', 'N': 'ङ',
  'c': 'च', 'C': 'छ', 'j': 'ज', 'J': 'झ', 'Y': 'ञ',
  'w': 'ट', 'W': 'ठ', 'q': 'ड', 'Q': 'ढ', 'R': 'ण',
  't': 'त', 'T': 'थ', 'd': 'द', 'D': 'ध', 'n': 'न',
  'p': 'प', 'P': 'फ', 'b': 'ब', 'B': 'भ', 'm': 'म',
  'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व',
  'S': 'श', 'z': 'ष', 's': 'स', 'h': 'ह', 'L': 'ळ'
};

function iastToDevanagari(iast) {
  if (!iast) return '';
  let slp = iast.normalize('NFC').toLowerCase();
  for (const [k, v] of IAST_TO_SLP1_RULES) {
    slp = slp.split(k).join(v);
  }
  let out = '';
  for (let i = 0; i < slp.length; i++) {
    if (
      slp.slice(i, i + 2) === 'oM' &&
      (i === 0 || !SLP1_CONS_TO_DEVA[slp[i - 1]]) &&
      !SLP1_VOWEL_TO_DEVA[slp[i + 2]]
    ) {
      out += 'ॐ';
      i++;
      continue;
    }
    const ch = slp[i];
    const next = slp[i + 1];
    if (SLP1_CONS_TO_DEVA[ch]) {
      out += SLP1_CONS_TO_DEVA[ch];
      if (SLP1_MATRA_TO_DEVA[next] !== undefined) {
        out += SLP1_MATRA_TO_DEVA[next];
        i++;
      } else {
        out += '्';
      }
    } else if (SLP1_VOWEL_TO_DEVA[ch]) {
      out += SLP1_VOWEL_TO_DEVA[ch];
    } else if (ch === 'M') out += 'ं';
    else if (ch === 'H') out += 'ः';
    else if (ch === '~') out += 'ँ';
    else if (ch === "'") out += 'ऽ';
    else if (ch === '|' && next === '|') {
      out += '॥';
      i++;
    } else if (ch === '|') out += '।';
    else out += ch;
  }
  return out;
}

/* ============================================================================
 * HTTP Fetch Helper with Retries
 * ========================================================================== */
async function fetchWithRetry(url, asBuffer = false, retries = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Sarva-Dharani-Kosa/1.0 (Academic Sanskrit Corpus Builder)'
        }
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      if (asBuffer) {
        const ab = await res.arrayBuffer();
        return Buffer.from(ab);
      }
      return await res.text();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 600 * attempt));
      }
    }
  }
  throw lastErr;
}

function stripPuaCharacters(str) {
  if (!str) return '';
  return str.replace(/[\uE000-\uF8FF]|[\u{F0000}-\u{10FFFF}]/gu, '');
}

/* ============================================================================
 * 19 Core CBETA TEI-P5 XML Files Specification
 * ========================================================================== */
const CORE_CBETA_XML_LIST = [
  { xmlId: 'T19n0974B', vol: 'T19', fallbackTitle: '佛頂尊勝陀羅尼念誦儀軌法', fallbackTranslator: '唐 不空譯' },
  { xmlId: 'T19n0974E', vol: 'T19', fallbackTitle: '佛頂尊勝陀羅尼真言', fallbackTranslator: '唐 不空譯' },
  { xmlId: 'T20n1060', vol: 'T20', fallbackTitle: '千手千眼觀世音菩薩廣大圓滿無礙大悲心陀羅尼經', fallbackTranslator: '唐 伽梵達摩譯' },
  { xmlId: 'T20n1064', vol: 'T20', fallbackTitle: '千手千眼觀世音菩薩大悲心陀羅尼', fallbackTranslator: '唐 不空譯' },
  { xmlId: 'T20n1113B', vol: 'T20', fallbackTitle: '觀自在菩薩廣大圓滿無礙大悲心陀羅尼（青頸大悲心陀羅尼）', fallbackTranslator: '唐 不空譯' },
  { xmlId: 'T19n1022A', vol: 'T19', fallbackTitle: '一切如來心祕密全身舍利寶篋印陀羅尼經', fallbackTranslator: '唐 不空譯' },
  { xmlId: 'T19n0945', vol: 'T19', fallbackTitle: '大佛頂如來密因修證了義諸菩薩萬行首楞嚴經', fallbackTranslator: '唐 般剌蜜帝譯' },
  { xmlId: 'T19n1002', vol: 'T19', fallbackTitle: '不空羂索毘盧遮那佛大灌頂光真言', fallbackTranslator: '唐 不空譯' },
  { xmlId: 'T20n1075', vol: 'T20', fallbackTitle: '佛說七俱胝佛母准提大明陀羅尼經', fallbackTranslator: '唐 金剛智譯' },
  { xmlId: 'T20n1080', vol: 'T20', fallbackTitle: '如意輪陀羅尼經', fallbackTranslator: '唐 菩提流志譯' },
  { xmlId: 'T19n0963', vol: 'T19', fallbackTitle: '佛說熾盛光大威德消災吉祥陀羅尼經', fallbackTranslator: '唐 不空譯' },
  { xmlId: 'T19n0936', vol: 'T19', fallbackTitle: '大乘聖無量壽決定光明王如來陀羅尼經', fallbackTranslator: '唐 法成譯' },
  { xmlId: 'T14n0450', vol: 'T14', fallbackTitle: '藥師琉璃光如來本願功德經', fallbackTranslator: '唐 玄奘譯' },
  { xmlId: 'T12n0368', vol: 'T12', fallbackTitle: '拔一切業障根本得生淨土神呪', fallbackTranslator: '劉宋 求那跋陀羅譯' },
  { xmlId: 'T16n0665', vol: 'T16', fallbackTitle: '金光明最勝王經', fallbackTranslator: '唐 義淨譯' },
  { xmlId: 'T08n0251', vol: 'T08', fallbackTitle: '般若波羅蜜多心經', fallbackTranslator: '唐 玄奘譯' },
  { xmlId: 'T19n0982', vol: 'T19', fallbackTitle: '佛母大孔雀明王經', fallbackTranslator: '唐 不空譯' },
  { xmlId: 'T20n1153', vol: 'T20', fallbackTitle: '普遍光明清淨熾盛如意寶印心無能勝大明王大隨求陀羅尼經', fallbackTranslator: '唐 不空譯' },
  { xmlId: 'T21n1257', vol: 'T21', fallbackTitle: '佛說大摩里支菩薩經', fallbackTranslator: '宋 天息災譯' }
];

/* ============================================================================
 * 25 Canonical GRETIL Works (27 .htm files) Specification
 * ========================================================================== */
const GRETIL_WORKS_SPEC = [
  { id: 'gretil-prajnhsu', fileName: 'prajnhsu.htm', titleSanskrit: 'Prajñāpāramitāhṛdayasūtra', titleChinese: '《般若波羅蜜多心經》梵本', category: 'Dharani', editor: 'Edward Conze / P.L. Vaidya' },
  { id: 'gretil-bsu003', fileName: 'bsu003_u.htm', titleSanskrit: 'Aparimitāyuḥsūtra', titleChinese: '《聖無量壽決定光明王陀羅尼經》梵本', category: 'Dharani', editor: 'DSBC Sutra Section No. 3' },
  { id: 'gretil-bsu004', fileName: 'bsu004_u.htm', titleSanskrit: 'Āryatathāgatoṣṇīṣasitātapatrāparājitāmahāpratyaṅgirādhāraṇī', titleChinese: '《大白傘蓋佛母陀羅尼》梵本', category: 'Dharani', editor: 'Ngawang Samten & Janardan Pandey' },
  { id: 'gretil-bsu007', fileName: 'bsu007_u.htm', titleSanskrit: 'Śrīmahādevīvyākaraṇam', titleChinese: '《大吉祥天女十二名號經》梵本', category: 'Dharani', editor: 'Nalinaksha Dutt (Gilgit Manuscripts Vol. I)' },
  { id: 'gretil-bsu012', fileName: 'bsu012_u.htm', titleSanskrit: 'Bhaiṣajyaguruvaidūryaprabharājasūtra', titleChinese: '《藥師琉璃光如來本願功德經》梵本', category: 'Mahayana-Sutra', editor: 'P.L. Vaidya (BST 17)' },
  { id: 'gretil-bsu017', fileName: 'bsu017_u.htm', titleSanskrit: 'Hayagrīvavidyā', titleChinese: '《馬頭明王陀羅尼》吉爾吉特梵本', category: 'Dharani', editor: 'Nalinaksha Dutt (Gilgit Manuscripts Vol. I)' },
  { id: 'gretil-bsu019', fileName: 'bsu019_u.htm', titleSanskrit: 'Kāraṇḍavyūhasūtra', titleChinese: '《大乘莊嚴寶王經（六字大明咒）》梵本', category: 'Mahayana-Sutra', editor: 'P.L. Vaidya (BST 17)' },
  { id: 'gretil-bsu035', fileName: 'bsu035_u.htm', titleSanskrit: 'Suvarṇaprabhāsasūtra', titleChinese: '《金光明最勝王經》梵本', category: 'Mahayana-Sutra', editor: 'S. Bagchi (BST 8)' },
  { id: 'gretil-ekmuhr', fileName: 'ekmuhr_u.htm', titleSanskrit: 'Ekādaśamukhahṛdayam', titleChinese: '《十一面觀世音神咒經》吉爾吉特梵本', category: 'Dharani', editor: 'Nalinaksha Dutt / Somadeva Vasudeva' },
  { id: 'gretil-amoghapu', fileName: 'amoghapu.htm', titleSanskrit: 'Amoghapāśahṛdayasūtra', titleChinese: '《不空羂索心咒王經》梵本', category: 'Dharani', editor: 'Dhīḥ 38 (2004)' },
  { id: 'gretil-mahpratu', fileName: 'mahpratu.htm', alternateFileName: 'psarkdhu.htm', titleSanskrit: 'Mahāpratisarā-Mahāvidyārājñī', titleChinese: '《大隨求陀羅尼（五護陀羅尼）》梵本', category: 'Dharani', editor: 'Gergely Hidas (2012) & Dhīḥ 28' },
  { id: 'gretil-mmayuvru', fileName: 'mmayuvru.htm', titleSanskrit: 'Mahāmāyūrīvidyārājñī', titleChinese: '《佛母大孔雀明王陀羅尼》梵本', category: 'Dharani', editor: 'Shūyo Takubo (1972)' },
  { id: 'gretil-msitvatu', fileName: 'msitvatu.htm', titleSanskrit: 'Mahāśītavatī-vidyārājñī', titleChinese: '《大寒林陀羅尼》梵本', category: 'Dharani', editor: 'Yutaka Iwamoto (1937)' },
  { id: 'gretil-mahama', fileName: 'mahama_u.htm', titleSanskrit: 'Mahāmantrānusāriṇī', titleChinese: '《大護明大陀羅尼》梵本', category: 'Dharani', editor: 'Peter Skilling' },
  { id: 'gretil-maricdhu', fileName: 'maricdhu.htm', titleSanskrit: 'Mārīcīnāmadhāraṇī', titleChinese: '《摩利支天陀羅尼》梵本', category: 'Dharani', editor: 'Dhīḥ 42 (2006)' },
  { id: 'gretil-manivdhu', fileName: 'manivdhu.htm', titleSanskrit: 'Mahāmaṇivipulavimāna-dhāraṇī', titleChinese: '《廣大寶樓閣善住秘密陀羅尼》梵本', category: 'Dharani', editor: 'Hisashi Matsumura (Gilgit)' },
  { id: 'gretil-vajvidhu', fileName: 'vajvidhu.htm', alternateFileName: 'vjviddhu.htm', titleSanskrit: 'Vajravidāraṇā-dhāraṇī', titleChinese: '《金剛摧碎陀羅尼》梵本', category: 'Dharani', editor: 'Yutaka Iwamoto (1937) & Dhīḥ 40' },
  { id: 'gretil-vadhdhdu', fileName: 'vadhdhdu.htm', titleSanskrit: 'Vasudhārādhāraṇī', titleChinese: '《持世陀羅尼（財源天母咒）》梵本', category: 'Dharani', editor: 'Dhīḥ 44 (2007)' },
  { id: 'gretil-dhvajkeu', fileName: 'dhvajkeu.htm', titleSanskrit: 'Dhvajāgrakeyūrā-dhāraṇī', titleChinese: '《寶幢頂瓔珞陀羅尼》梵本', category: 'Dharani', editor: 'GRETIL Edition' },
  { id: 'gretil-ganphrdu', fileName: 'ganphrdu.htm', titleSanskrit: 'Gaṇapatihṛdaya-dhāraṇī', titleChinese: '《大聖歡喜天心陀羅尼》梵本', category: 'Dharani', editor: 'Yutaka Iwamoto (1937)' },
  { id: 'gretil-grahmdhu', fileName: 'grahmdhu.htm', titleSanskrit: 'Grahamātṛkānāmadhāraṇī', titleChinese: '《聖曜母陀羅尼》梵本', category: 'Dharani', editor: 'Dhīḥ 39 (2005)' },
  { id: 'gretil-mekhdh', fileName: 'mekhdh_u.htm', titleSanskrit: 'Mekhalā-dhāraṇī', titleChinese: '《寶帶陀羅尼》梵本', category: 'Dharani', editor: 'Ch. Tripathi (Gilgit Blätter)' },
  { id: 'gretil-tarb108u', fileName: 'tarb108u.htm', titleSanskrit: 'Tārābhaṭṭārikānāmāṣṭottaraśatakastotra', titleChinese: '《聖度母百八名陀羅尼讚》梵本', category: 'Stotra', editor: 'Godefroy de Blonay (1895)' },
  { id: 'gretil-manjn1pu', fileName: 'manjn1pu.htm', titleSanskrit: 'Mañjuśrīnāmasaṃgīti', titleChinese: '《文殊真實名經》梵本', category: 'Tantra', editor: 'Ronald M. Davidson (1981)' },
  { id: 'gretil-sarvttsu', fileName: 'sarvttsu.htm', titleSanskrit: 'Sarvatathāgatatattvasaṃgraha', titleChinese: '《金剛頂一切如來真實攝大乘現證大教王經》梵本', category: 'Tantra', editor: 'Lokesh Chandra (1987)' }
];

/* ============================================================================
 * Parse CBETA XML File
 * ========================================================================== */
function buildCharDeclMap(xml) {
  const map = new Map();
  const charRegex = /<char\s+xml:id="(CB[0-9A-Za-z]+)"[^>]*>([\s\S]*?)<\/char>/g;
  let m;
  while ((m = charRegex.exec(xml)) !== null) {
    const id = m[1];
    const body = m[2];
    const uniMatch = body.match(/<mapping\s+type="unicode">U\+([0-9A-Fa-f]+)<\/mapping>/);
    const normUniMatch = body.match(/<mapping\s+type="normal_unicode">U\+([0-9A-Fa-f]+)<\/mapping>/);
    const normFormMatch = body.match(/<localName>normalized form<\/localName>\s*<value>([^<]+)<\/value>/);
    const compMatch = body.match(/<localName>composition<\/localName>\s*<value>([^<]+)<\/value>/);

    let resolved = '';
    if (uniMatch) {
      resolved = String.fromCodePoint(parseInt(uniMatch[1], 16));
    } else if (normUniMatch) {
      resolved = String.fromCodePoint(parseInt(normUniMatch[1], 16));
    } else if (normFormMatch) {
      resolved = normFormMatch[1].trim();
    } else if (compMatch) {
      resolved = compMatch[1].trim();
    }
    if (resolved) {
      map.set(id, stripPuaCharacters(resolved));
    }
  }
  return map;
}

function resolveGElements(fragment, charDeclMap, gaijiMap) {
  if (!fragment) return '';
  const withResolvedG = fragment.replace(
    /<g\s+ref="#([A-Za-z0-9-]+)"[^>]*>([\s\S]*?)<\/g>|<g\s+ref="#([A-Za-z0-9-]+)"\s*\/>/g,
    (_, ref1, inner, ref2) => {
      const refId = ref1 || ref2;
      if (refId.startsWith('SD-') || refId.startsWith('RJ-')) {
        const gEntry = gaijiMap[refId];
        return gEntry ? (gEntry.siddhamUnicode || gEntry.romanized || refId) : refId;
      }
      if (charDeclMap.has(refId)) {
        return charDeclMap.get(refId);
      }
      const cleanInner = stripPuaCharacters(inner || '').trim();
      return cleanInner || `[${refId}]`;
    }
  );
  return stripPuaCharacters(withResolvedG);
}

function stripTagsClean(xmlFragment, charDeclMap, gaijiMap) {
  const resolved = resolveGElements(xmlFragment, charDeclMap, gaijiMap);
  return stripPuaCharacters(
    resolved
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function parseCbetaXml(xml, spec, gaijiMap) {
  const { xmlId, vol, fallbackTitle, fallbackTranslator } = spec;
  const charDeclMap = buildCharDeclMap(xml);

  const titleMatch = xml.match(/<title[^>]*level="m"[^>]*>([\s\S]*?)<\/title>/);
  let title = titleMatch ? stripTagsClean(titleMatch[1], charDeclMap, gaijiMap) : fallbackTitle;
  title = title.replace(/^No\.\s*\d+[A-Za-z]?\s*/, '').trim() || fallbackTitle;

  const authorMatch = xml.match(/<author>([\s\S]*?)<\/author>/);
  const translator = authorMatch
    ? stripTagsClean(authorMatch[1], charDeclMap, gaijiMap)
    : fallbackTranslator;

  const juanMatch = xml.match(/<extent>(\d+)卷<\/extent>/);
  const juan = juanMatch ? parseInt(juanMatch[1], 10) : 1;

  const bodyMatch = xml.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  const bodyXml = bodyMatch ? bodyMatch[1] : xml;

  const backMatch = xml.match(/<back[^>]*>([\s\S]*?)<\/back>/);
  const backXml = backMatch ? backMatch[1] : '';

  // Count all #SD-* / #RJ-* refs in <body>
  const bodySdRefs = bodyXml.match(/#(?:SD|RJ)-[0-9A-Fa-f]+/g) || [];
  const siddhamGlyphsCount = bodySdRefs.length;

  // Extract all <note place="inline"> in <body>
  const allBodyInlineNotes = [];
  const inlineNoteRegex = /<note[^>]*place="inline"[^>]*>([\s\S]*?)<\/note>/g;
  let nm;
  while ((nm = inlineNoteRegex.exec(bodyXml)) !== null) {
    const noteText = stripTagsClean(nm[1], charDeclMap, gaijiMap);
    if (noteText) allBodyInlineNotes.push(noteText);
  }

  // Extract all <cb:tt> inside <body> (Tang Siddhaṃ-Chinese interlinear alignments)
  const ttAlignments = [];
  const ttRegex = /<cb:tt\b[^>]*>([\s\S]*?)<\/cb:tt>/g;
  let tm;
  let ttIdx = 0;
  while ((tm = ttRegex.exec(bodyXml)) !== null) {
    ttIdx++;
    const ttInner = tm[1];
    const siddMatch = ttInner.match(/<cb:t[^>]*xml:lang="sa-Sidd"[^>]*>([\s\S]*?)<\/cb:t>/);
    const zhMatch = ttInner.match(/<cb:t[^>]*xml:lang="zh-Hant"[^>]*>([\s\S]*?)<\/cb:t>/);

    const sdCodes = [];
    if (siddMatch) {
      const gRefRegex = /ref="#((?:SD|RJ)-[0-9A-Fa-f]+)"/g;
      let gm;
      while ((gm = gRefRegex.exec(siddMatch[1])) !== null) {
        sdCodes.push(gm[1]);
      }
    }

    const siddhamUnicode = sdCodes
      .map((code) => gaijiMap[code]?.siddhamUnicode || '')
      .join('');
    const iast = sdCodes
      .map((code) => gaijiMap[code]?.romanized || '')
      .filter(Boolean)
      .join('');
    const devanagari = iastToDevanagari(iast);

    let chineseZi = '';
    const tangYinNotes = [];
    const inlineGlossNotes = [];

    if (zhMatch) {
      let zhInner = zhMatch[1];
      // Extract <cb:sg> inside <cb:yin>
      const sgRegex = /<cb:sg[^>]*>([\s\S]*?)<\/cb:sg>/g;
      let sgm;
      while ((sgm = sgRegex.exec(zhInner)) !== null) {
        const sgClean = stripTagsClean(sgm[1], charDeclMap, gaijiMap);
        if (sgClean) tangYinNotes.push(sgClean);
      }
      // Extract <note place="inline">
      const nRegex = /<note[^>]*place="inline"[^>]*>([\s\S]*?)<\/note>/g;
      let inlm;
      while ((inlm = nRegex.exec(zhInner)) !== null) {
        const nClean = stripTagsClean(inlm[1], charDeclMap, gaijiMap);
        if (nClean) inlineGlossNotes.push(nClean);
      }
      // Remove <cb:sg> and <note> before extracting chineseZi
      const ziFragment = zhInner
        .replace(/<cb:sg[^>]*>[\s\S]*?<\/cb:sg>/g, '')
        .replace(/<note[^>]*>[\s\S]*?<\/note>/g, '');
      chineseZi = stripTagsClean(ziFragment, charDeclMap, gaijiMap).replace(/\s+/g, '');
    }

    ttAlignments.push({
      index: ttIdx,
      siddhamRef: sdCodes.map((c) => `#${c}`).join(' '),
      sdCodes,
      siddhamUnicode,
      iast,
      devanagari,
      chineseText: chineseZi,
      chineseZi,
      yinNotes: tangYinNotes,
      tangYinNotes,
      ...(inlineGlossNotes.length > 0 ? { inlineCommentary: inlineGlossNotes.join('；') } : {}),
      inlineGlossNotes
    });
  }

  // Extract <cb:tt type="app"> from <back> into apparatusSanskritNotes
  const apparatusSanskritNotes = [];
  if (backXml) {
    const appTtRegex = /<cb:tt\b[^>]*>([\s\S]*?)<\/cb:tt>/g;
    let am;
    while ((am = appTtRegex.exec(backXml)) !== null) {
      const appInner = am[1];
      const zhM = appInner.match(/<cb:t[^>]*xml:lang="zh-Hant"[^>]*>([\s\S]*?)<\/cb:t>/);
      const saM = appInner.match(/<cb:t[^>]*xml:lang="sa-Latn"[^>]*>([\s\S]*?)<\/cb:t>/);
      if (zhM && saM) {
        apparatusSanskritNotes.push({
          zh: stripTagsClean(zhM[1], charDeclMap, gaijiMap),
          sa: stripTagsClean(saM[1], charDeclMap, gaijiMap)
        });
      }
    }
  }

  // Extract <p cb:type="dharani"> or <p xml:lang="sa-Sidd"> in <body>
  const dharaniBlocks = [];
  let firstRawXmlExcerpt = '';
  const pRegex = /<p\b([^>]*)>([\s\S]*?)<\/p>/g;
  let pm;
  while ((pm = pRegex.exec(bodyXml)) !== null) {
    const attrs = pm[1];
    const pInner = pm[2];
    const isDharani = /cb:type="dharani"/.test(attrs);
    const isSiddhamLang = /xml:lang="sa-Sidd"/.test(attrs);
    if (!isDharani && !isSiddhamLang) continue;

    if (!firstRawXmlExcerpt) {
      firstRawXmlExcerpt = stripPuaCharacters(`<p${attrs}>${pInner.slice(0, 480)}</p>`);
    }

    const pXmlIdMatch = attrs.match(/xml:id="([^"]+)"/);
    const blockXmlId = pXmlIdMatch ? pXmlIdMatch[1] : `${xmlId}_p${dharaniBlocks.length + 1}`;
    const lang = isSiddhamLang ? 'sa-Sidd' : 'zh-Hant';

    const blockInlineNotes = [];
    const bnRegex = /<(?:note[^>]*place="inline"|cb:sg)[^>]*>([\s\S]*?)<\/(?:note|cb:sg)>/g;
    let bnm;
    while ((bnm = bnRegex.exec(pInner)) !== null) {
      const nt = stripTagsClean(bnm[1], charDeclMap, gaijiMap);
      if (nt) blockInlineNotes.push(nt);
    }

    const siddhamCodes = [];
    const sdReg = /ref="#((?:SD|RJ)-[0-9A-Fa-f]+)"/g;
    let sdm;
    while ((sdm = sdReg.exec(pInner)) !== null) {
      siddhamCodes.push(sdm[1]);
    }

    const siddhamUnicodeText = siddhamCodes
      .map((c) => gaijiMap[c]?.siddhamUnicode || '')
      .join('');
    const iastReconstruction = siddhamCodes
      .map((c) => gaijiMap[c]?.romanized || '')
      .filter(Boolean)
      .join(' ');

    const pWithoutNotesAndSidd = pInner
      .replace(/<cb:t[^>]*xml:lang="sa-Sidd"[^>]*>[\s\S]*?<\/cb:t>/g, '')
      .replace(/<cb:sg[^>]*>[\s\S]*?<\/cb:sg>/g, '')
      .replace(/<note[^>]*>[\s\S]*?<\/note>/g, '');
    const chineseText = stripTagsClean(pWithoutNotesAndSidd, charDeclMap, gaijiMap);

    dharaniBlocks.push({
      xmlId: blockXmlId,
      lang,
      chineseText: chineseText || siddhamUnicodeText,
      inlineNotes: blockInlineNotes,
      siddhamCodes,
      siddhamUnicodeText,
      iastReconstruction
    });
  }

  // Fallback for T14n0450 (where Bhaiṣajyaguru mantra is in <rdg> inside <back>)
  if (dharaniBlocks.length === 0 && backXml) {
    const rdgMatch = backXml.match(/<rdg[^>]*>([^<]*南無薄伽伐帝[\s\S]*?莎訶[^<]*)<\/rdg>/);
    if (rdgMatch) {
      const mantraZh = stripTagsClean(rdgMatch[1], charDeclMap, gaijiMap);
      firstRawXmlExcerpt = stripPuaCharacters(rdgMatch[0]);
      dharaniBlocks.push({
        xmlId: `${xmlId}_rdg_wit3`,
        lang: 'zh-Hant',
        chineseText: mantraZh,
        inlineNotes: ['明本（wit3）附藥師灌頂真言'],
        siddhamCodes: [],
        siddhamUnicodeText: '',
        iastReconstruction:
          'namo bhagavate bhaiṣajyaguru-vaiḍūrya-prabha-rājāya tathāgatāyārhate samyaksaṃbuddhāya tadyathā oṃ bhaiṣajye bhaiṣajye mahābhaiṣajye bhaiṣajya-samudgate svāhā'
      });
    }
  }

  const rawXmlUrl = `https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/${vol}/${xmlId}.xml`;
  const taishoNo = `T${xmlId.slice(4)}`;

  return {
    xmlId,
    taishoId: taishoNo,
    taishoNo,
    vol,
    title,
    juan,
    translator,
    sourceUrl: rawXmlUrl,
    rawXmlUrl,
    localCachePath: `public/data/baseline/cbeta/${xmlId}.xml`,
    dharaniBlocksCount: dharaniBlocks.length,
    ttAlignmentsCount: ttAlignments.length,
    siddhamGlyphsCount,
    inlineNotesCount: allBodyInlineNotes.length,
    dharaniBlocks,
    dharaniTextBlocks: dharaniBlocks.map((b) => b.chineseText),
    ttAlignments,
    inlineNotes: allBodyInlineNotes.slice(0, 120),
    apparatusSanskritNotes: apparatusSanskritNotes.slice(0, 120),
    rawXmlExcerpt: firstRawXmlExcerpt.slice(0, 600)
  };
}

/* ============================================================================
 * Parse GRETIL .htm File
 * ========================================================================== */
function decodeHtmlEntities(str) {
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
}

function parseGretilHtml(html) {
  const parts = html.split(/<hr\b[^>]*>/i);
  const headerPart = parts[0] || '';
  const bodyPartRaw = (parts.length >= 3 ? parts.slice(2).join('\n') : html).replace(
    /<\/body>[\s\S]*$/i,
    ''
  );

  // Extract bibliographic citation from headerPart
  const headerClean = decodeHtmlEntities(
    headerPart
      .replace(/<head[\s\S]*?<\/head>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  );
  const headerLines = headerClean
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const editionCitation = headerLines.slice(0, 6).join(' | ');

  // Extract \var{...} and \com{...} before stripping them from the Sanskrit body
  const apparatusVariants = [];
  let bodyProcessed = bodyPartRaw;
  const varRegex = /\\(?:var|com)\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  let vm;
  while ((vm = varRegex.exec(bodyPartRaw)) !== null) {
    apparatusVariants.push(vm[1].trim());
  }
  bodyProcessed = bodyProcessed.replace(varRegex, '');

  // Replace <br> and </p> with newlines
  bodyProcessed = bodyProcessed
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n');

  // Strip ONLY known HTML tags so Leiden editorial <ta>, <va>, <thāgataiḥ> are preserved!
  bodyProcessed = bodyProcessed.replace(
    /<\/?(?:br|p|b|i|u|span|div|a|font|hr|table|tr|td|th|ul|li|ol|sup|sub|small|big|center|blockquote|pre|code|html|head|body|title|meta|style|h[1-6])(?:\s+[^>]*)?>/gi,
    ''
  );

  // Unwrap Leiden editorial angle brackets <ta> -> ta
  bodyProcessed = decodeHtmlEntities(bodyProcessed).replace(/<([^>]+)>/g, '$1');

  const fullTextLines = bodyProcessed
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length > 0 && !/^(&copy;|Copyright|GRETIL)/i.test(l));

  const mantraRegex = /\b(?:oṃ|om|namo|namaḥ|namas|tadyathā|svāhā|hūṃ|huṃ|hrīḥ|phaṭ)\b/i;
  const mantraExcerpts = fullTextLines.filter((l) => mantraRegex.test(l));

  return {
    editionCitation,
    totalLines: fullTextLines.length,
    mantraExcerpts: mantraExcerpts.length > 0 ? mantraExcerpts.slice(0, 40) : fullTextLines.slice(0, 15),
    fullTextLines: fullTextLines.slice(0, 120),
    apparatusVariants: apparatusVariants.slice(0, 50)
  };
}

/* ============================================================================
 * Main Pipeline Execution
 * ========================================================================== */
async function main() {
  console.log('=== [M1] Starting Sarva-Dhāraṇī-Kośa Authoritative Baseline Pipeline ===');

  await fs.mkdir(PUBLIC_FONT_DIR, { recursive: true });
  await fs.mkdir(PUBLIC_CBETA_DIR, { recursive: true });
  await fs.mkdir(PUBLIC_GRETIL_DIR, { recursive: true });
  await fs.mkdir(GENERATED_DIR, { recursive: true });

  // 1. Download NotoSansSiddham-Regular.woff2
  const fontUrl =
    'https://raw.githubusercontent.com/scottgfhong310/siddham-registry/main/public/apps/siddham-registry/fonts/NotoSansSiddham-Regular.woff2';
  const fontPath = path.join(PUBLIC_FONT_DIR, 'NotoSansSiddham-Regular.woff2');
  console.log('[1/5] Fetching NotoSansSiddham-Regular.woff2...');
  const fontBuf = await fetchWithRetry(fontUrl, true);
  if (fontBuf.slice(0, 4).toString('ascii') !== 'wOF2') {
    throw new Error('Invalid WOFF2 magic header on NotoSansSiddham-Regular.woff2');
  }
  await fs.writeFile(fontPath, fontBuf);
  console.log(`      Saved ${fontPath} (${fontBuf.length} bytes, header=wOF2)`);

  // 2. Download cbeta_sanskrit.json -> CBETA_GAIJI_MAP (2,240 entries)
  const gaijiUrl =
    'https://raw.githubusercontent.com/cbeta-org/cbeta_gaiji/master/cbeta_sanskrit.json';
  console.log('[2/5] Fetching cbeta_sanskrit.json (2,240 Siddhaṃ/Ranjana Gaiji mappings)...');
  const gaijiRawText = await fetchWithRetry(gaijiUrl);
  await fs.writeFile(path.join(PUBLIC_CBETA_DIR, 'cbeta_sanskrit.json'), gaijiRawText, 'utf8');
  const gaijiRaw = JSON.parse(gaijiRawText);

  const cbetaGaijiMap = {};
  for (const [id, val] of Object.entries(gaijiRaw)) {
    const siddhamUnicode = stripPuaCharacters(
      val.uni_char || val.uni_composed_char || val.symbol || ''
    );
    const romanized = (val.romanized || '').trim();
    const devanagari = romanized ? iastToDevanagari(romanized) : '';
    const script = id.startsWith('RJ-') ? 'Ranjana' : 'Siddham';
    cbetaGaijiMap[id] = {
      id,
      unicodeChar: siddhamUnicode,
      siddhamUnicode,
      ...(val.unicode ? { unicodeHex: val.unicode } : {}),
      iast: romanized,
      romanized,
      devanagari,
      scriptType: script,
      script,
      cbetaChar: stripPuaCharacters(val.char || ''),
      pua: val.pua || '',
      ...(val.symbol ? { symbol: val.symbol } : {})
    };
  }
  console.log(`      Normalized ${Object.keys(cbetaGaijiMap).length} CBETA Gaiji entries.`);

  // 3. Download & Parse 19 Core CBETA TEI-P5 XML Files
  console.log('[3/5] Fetching and parsing 19 Core CBETA TEI-P5 XML files...');
  const cbetaAuthRecords = [];
  const batchSize = 5;
  for (let i = 0; i < CORE_CBETA_XML_LIST.length; i += batchSize) {
    const batch = CORE_CBETA_XML_LIST.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (spec) => {
        const url = `https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/${spec.vol}/${spec.xmlId}.xml`;
        const xmlText = await fetchWithRetry(url);
        await fs.writeFile(path.join(PUBLIC_CBETA_DIR, `${spec.xmlId}.xml`), xmlText, 'utf8');
        return parseCbetaXml(xmlText, spec, cbetaGaijiMap);
      })
    );
    cbetaAuthRecords.push(...batchResults);
  }
  const totalTtAlignments = cbetaAuthRecords.reduce((sum, r) => sum + r.ttAlignmentsCount, 0);
  console.log(
    `      Parsed ${cbetaAuthRecords.length} CBETA scriptures with ${totalTtAlignments} <body> <cb:tt> alignments.`
  );

  // Write src/data/generated/cbetaAuthRecords.ts
  const cbetaTsContent = `/**
 * AUTO-GENERATED BY scripts/fetch-baseline-data.mjs — DO NOT EDIT MANUALLY
 * Source: cbeta-org/cbeta_gaiji & cbeta-org/xml-p5 (19 Core Scriptures, ${totalTtAlignments} <cb:tt> Alignments)
 */
import type { CbetaGaijiEntry, CbetaAuthRecord } from '../../types/dharani';

export const CBETA_TOTAL_TT_ALIGNMENTS = ${totalTtAlignments};

export const CBETA_GAIJI_MAP: Record<string, CbetaGaijiEntry> = ${JSON.stringify(cbetaGaijiMap, null, 2)};

export const CBETA_AUTH_RECORDS: CbetaAuthRecord[] = ${JSON.stringify(cbetaAuthRecords, null, 2)};
`;
  await fs.writeFile(path.join(GENERATED_DIR, 'cbetaAuthRecords.ts'), cbetaTsContent, 'utf8');
  await fs.writeFile(
    path.join(PUBLIC_BASELINE_DIR, 'cbeta_auth_records.json'),
    JSON.stringify({ totalTtAlignments, records: cbetaAuthRecords }, null, 2),
    'utf8'
  );

  // 4. Download DILA-edu/cbeta-metadata/master/work-info/T.json -> TAISHO_MIKKYO_INDEX (614 works)
  console.log('[4/5] Fetching DILA-edu/cbeta-metadata/master/work-info/T.json (T18–T21 Catalog)...');
  const workInfoUrl =
    'https://raw.githubusercontent.com/DILA-edu/cbeta-metadata/master/work-info/T.json';
  const workInfoRaw = await fetchWithRetry(workInfoUrl);
  await fs.writeFile(path.join(PUBLIC_CBETA_DIR, 'work-info-T.json'), workInfoRaw, 'utf8');
  const workInfoT = JSON.parse(workInfoRaw);

  const prebundledXmlIds = new Set(CORE_CBETA_XML_LIST.map((x) => x.xmlId));
  const ttXmlIds = new Set(
    cbetaAuthRecords.filter((r) => r.ttAlignmentsCount > 0).map((r) => r.xmlId)
  );

  const taishoMikkyoIndex = [];
  for (const [taishoNo, info] of Object.entries(workInfoT)) {
    if (!['T18', 'T19', 'T20', 'T21'].includes(info.vol)) continue;
    const xmlId = `${info.vol}n${taishoNo.slice(1)}`;
    const numPart = parseInt(taishoNo.slice(1, 5), 10);
    let categoryLabel = '明王・護法諸天・陀羅尼集部';
    if (numPart <= 901) {
      categoryLabel = '大日經・金剛頂經・蘇悉地根本部';
    } else if (numPart <= 1029) {
      categoryLabel = '佛頂・諸佛・一切如來儀軌部';
    } else if (numPart <= 1198) {
      categoryLabel = '觀自在・文殊・諸大菩薩部';
    }
    const byline = stripPuaCharacters(info.byline || '');
    const juansNum = Number(info.juans) || 1;
    const timeFromNum = Number(info.time_from);
    const timeToNum = Number(info.time_to);
    taishoMikkyoIndex.push({
      xmlId,
      taishoNo,
      vol: info.vol,
      volume: info.vol,
      title: stripPuaCharacters(info.title || ''),
      juans: juansNum,
      rolls: juansNum,
      byline,
      translator: byline,
      dynasty: info.dynasty || '',
      ...(Number.isFinite(timeFromNum) && timeFromNum > 0 ? { timeFrom: timeFromNum } : {}),
      ...(Number.isFinite(timeToNum) && timeToNum > 0 ? { timeTo: timeToNum } : {}),
      contributors: Array.isArray(info.contributors)
        ? info.contributors.map((c) => ({ name: c.name || '', id: c.id || '' }))
        : [],
      categoryLabel,
      rawXmlUrl: `https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/${info.vol}/${xmlId}.xml`,
      hasSiddhamTt: ttXmlIds.has(xmlId),
      isPrebundledInBaseline: prebundledXmlIds.has(xmlId)
    });
  }
  console.log(`      Compiled ${taishoMikkyoIndex.length} scriptures in TAISHO_MIKKYO_INDEX (T18–T21).`);

  const taishoTsContent = `/**
 * AUTO-GENERATED BY scripts/fetch-baseline-data.mjs — DO NOT EDIT MANUALLY
 * Source: DILA-edu/cbeta-metadata/master/work-info/T.json (${taishoMikkyoIndex.length} Esoteric Scriptures in T18–T21)
 */
import type { TaishoMikkyoEntry } from '../../types/dharani';

export const TAISHO_MIKKYO_INDEX: TaishoMikkyoEntry[] = ${JSON.stringify(taishoMikkyoIndex, null, 2)};
`;
  await fs.writeFile(path.join(GENERATED_DIR, 'taishoMikkyoIndex.ts'), taishoTsContent, 'utf8');
  await fs.writeFile(
    path.join(PUBLIC_BASELINE_DIR, 'taisho_mikkyo_index.json'),
    JSON.stringify(taishoMikkyoIndex, null, 2),
    'utf8'
  );

  // 5. Download & Parse 27 GRETIL Buddhist Sanskrit .htm Files (25 Works + 2 Alt Editions)
  console.log('[5/5] Fetching and parsing 27 GRETIL Buddhist Sanskrit .htm editions...');
  const gretilBaseUrl =
    'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh';
  const gretilAuthRecords = [];

  for (let i = 0; i < GRETIL_WORKS_SPEC.length; i += batchSize) {
    const batch = GRETIL_WORKS_SPEC.slice(i, i + batchSize);
    const batchParsed = await Promise.all(
      batch.map(async (spec) => {
        const rawUrl = `${gretilBaseUrl}/${spec.fileName}`;
        const html = await fetchWithRetry(rawUrl);
        await fs.writeFile(path.join(PUBLIC_GRETIL_DIR, spec.fileName), html, 'utf8');
        const parsed = parseGretilHtml(html);

        let alternateEditionText;
        if (spec.alternateFileName) {
          const altUrl = `${gretilBaseUrl}/${spec.alternateFileName}`;
          const altHtml = await fetchWithRetry(altUrl);
          await fs.writeFile(path.join(PUBLIC_GRETIL_DIR, spec.alternateFileName), altHtml, 'utf8');
          const altParsed = parseGretilHtml(altHtml);
          alternateEditionText = altParsed.fullTextLines.slice(0, 60);
        }

        return {
          id: spec.id,
          filename: spec.fileName,
          fileName: spec.fileName,
          ...(spec.alternateFileName ? { alternateFileName: spec.alternateFileName } : {}),
          titleSanskrit: spec.titleSanskrit,
          titleZh: spec.titleChinese,
          titleChinese: spec.titleChinese,
          category: spec.category,
          editionCitation: parsed.editionCitation || spec.editor,
          editor: spec.editor,
          sourceUrl: rawUrl,
          rawUrl,
          localCachePath: `public/data/baseline/gretil/${spec.fileName}`,
          extractedMantras: parsed.mantraExcerpts,
          mantraExcerpts: parsed.mantraExcerpts,
          fullTextExcerpt: parsed.fullTextLines.slice(0, 25).join('\n'),
          fullTextLines: parsed.fullTextLines,
          apparatusVariants: parsed.apparatusVariants,
          ...(alternateEditionText ? { alternateEditionText } : {}),
          totalLines: parsed.totalLines
        };
      })
    );
    gretilAuthRecords.push(...batchParsed);
  }
  console.log(`      Parsed ${gretilAuthRecords.length} canonical GRETIL works (27 .htm files).`);

  const gretilTsContent = `/**
 * AUTO-GENERATED BY scripts/fetch-baseline-data.mjs — DO NOT EDIT MANUALLY
 * Source: INDOLOGY/GRETIL-mirror (${gretilAuthRecords.length} Canonical Works / 27 .htm files)
 */
import type { GretilAuthRecord } from '../../types/dharani';

export const GRETIL_AUTH_RECORDS: GretilAuthRecord[] = ${JSON.stringify(gretilAuthRecords, null, 2)};

export const GRETIL_BY_FILENAME: Record<string, GretilAuthRecord> = Object.fromEntries(
  GRETIL_AUTH_RECORDS.flatMap((rec) => {
    const entries: Array<[string, GretilAuthRecord]> = [
      [rec.fileName, rec],
      [rec.id, rec],
      [rec.fileName.replace(/\\.htm$/i, ''), rec]
    ];
    if (rec.alternateFileName) {
      entries.push([rec.alternateFileName, rec]);
      entries.push([rec.alternateFileName.replace(/\\.htm$/i, ''), rec]);
    }
    return entries;
  })
);
`;
  await fs.writeFile(path.join(GENERATED_DIR, 'gretilAuthRecords.ts'), gretilTsContent, 'utf8');
  await fs.writeFile(
    path.join(PUBLIC_BASELINE_DIR, 'gretil_auth_records.json'),
    JSON.stringify(gretilAuthRecords, null, 2),
    'utf8'
  );

  console.log('=== [M1] Baseline Data Pipeline Completed Successfully! ===');
}

main().catch((err) => {
  console.error('Baseline data pipeline failed:', err);
  process.exit(1);
});
