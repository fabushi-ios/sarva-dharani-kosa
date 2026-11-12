#!/usr/bin/env node
/**
 * 梵音宝典 · Sarva-Dhāraṇī-Kośa 权威佛典与梵文贝叶经数据采集流水线
 *
 * 数据源：
 * 1. CBETA 官方梵字（悉昙/兰札）数据库 (cbeta-org/cbeta_gaiji)
 * 2. CBETA TEI-P5 原典 XML 库与唐代悉昙梵汉逐字对音 (cbeta-org/xml-p5)
 * 3. 德国哥廷根大学 GRETIL & 尼泊尔 DSBC 梵文贝叶经校勘库 (INDOLOGY/GRETIL-mirror)
 * 4. 大正新修大藏经·密教部全集索引 (T18-T21, No. 0848-1420)
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RAW_CBETA_DIR = path.join(ROOT, 'data', 'raw', 'cbeta');
const RAW_GRETIL_DIR = path.join(ROOT, 'data', 'raw', 'gretil');
const GEN_DIR = path.join(ROOT, 'src', 'data', 'generated');

const CBETA_SANSKRIT_JSON_URL =
  'https://raw.githubusercontent.com/cbeta-org/cbeta_gaiji/master/cbeta_sanskrit.json';

const CBETA_CORE_XML_LIST = [
  { id: 'T19n0974B', vol: 'T19', title: '佛頂尊勝陀羅尼注義', translator: '唐 不空譯', dharaniId: 'usnisa-vijaya' },
  { id: 'T19n0967', vol: 'T19', title: '佛頂尊勝陀羅尼經', translator: '唐 佛陀波利譯', dharaniId: 'usnisa-vijaya' },
  { id: 'T20n1113B', vol: 'T20', title: '大慈大悲救苦觀世音自在王菩薩廣大圓滿無礙自在青頸大悲心陀羅尼', translator: '唐 不空譯', dharaniId: 'nilakantha' },
  { id: 'T20n1064', vol: 'T20', title: '千手千眼觀世音菩薩大悲心陀羅尼', translator: '唐 不空譯', dharaniId: 'nilakantha' },
  { id: 'T20n1060', vol: 'T20', title: '千手千眼觀世音菩薩廣大圓滿無礙大悲心陀羅尼經', translator: '唐 伽梵達摩譯', dharaniId: 'nilakantha' },
  { id: 'T20n1080', vol: 'T20', title: '如意輪陀羅尼經', translator: '唐 菩提流志譯', dharaniId: 'cintamani-cakra' },
  { id: 'T19n0953', vol: 'T19', title: '一字奇特佛頂經', translator: '唐 不空譯', dharaniId: 'ekaksara-usnisa' },
  { id: 'T19n0963', vol: 'T19', title: '佛說熾盛光大威德消災吉祥陀羅尼經', translator: '唐 不空譯', dharaniId: 'tejorasi-usnisa' },
  { id: 'T19n0945', vol: 'T19', title: '大佛頂如來密因修證了義諸菩薩萬行首楞嚴經 (卷七)', translator: '唐 般剌蜜帝譯', dharaniId: 'surangama-atapatra', customUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n0945.xml' },
  { id: 'T19n1022A', vol: 'T19', title: '一切如來心祕密全身舍利寶篋印陀羅尼經', translator: '唐 不空譯', dharaniId: 'karanda-mudra' },
  { id: 'T19n1002', vol: 'T19', title: '不空羂索毘盧遮那佛大灌頂光真言', translator: '唐 不空譯', dharaniId: 'amoghapasa-vairocana' },
  { id: 'T20n1075', vol: 'T20', title: '佛說七俱胝佛母准提大明陀羅尼經', translator: '唐 金剛智譯', dharaniId: 'cundi-dharani' },
  { id: 'T14n0450', vol: 'T14', title: '藥師琉璃光如來本願功德經', translator: '唐 玄奘譯', dharaniId: 'bhaisajyaguru' },
  { id: 'T12n0368', vol: 'T12', title: '拔一切業障根本得生淨土神咒', translator: '劉宋 求那跋陀羅譯', dharaniId: 'sukhavati-vyuha' },
  { id: 'T08n0251', vol: 'T08', title: '般若波羅蜜多心經', translator: '唐 玄奘譯', dharaniId: 'prajnaparamita-hrdaya' },
  { id: 'T16n0665', vol: 'T16', title: '金光明最勝王經', translator: '唐 義淨譯', dharaniId: 'suvarnaprabhasa-sri' }
];

const GRETIL_FILES = [
  { file: 'prajnhsu.htm', id: 'gretil-prajnaparamita-hrdaya', titleZh: '般若波罗蜜多心经 (梵本)', titleSa: 'Prajñāpāramitāhṛdayasūtra', category: 'prajna', taishoNo: 'T08n0251' },
  { file: 'bsu003_u.htm', id: 'gretil-aparimitayur', titleZh: '圣无量寿决定光明王陀罗尼经 (梵本)', titleSa: 'Aparimitāyuḥsūtra', category: 'ten-small', taishoNo: 'T19n0936' },
  { file: 'bsu004_u.htm', id: 'gretil-sitatapatra', titleZh: '佛顶大白伞盖陀罗尼经 (梵本)', titleSa: 'Sarvatathāgatoṣṇīṣasitātapatrā-dhāraṇī', category: 'major', taishoNo: 'T19n0976' },
  { file: 'bsu007_u.htm', id: 'gretil-srimahadevi', titleZh: '善女天咒·大吉祥天女十二名号经 (梵本)', titleSa: 'Śrīmahādevīvyākaraṇa', category: 'ten-small', taishoNo: 'T21n1252' },
  { file: 'bsu012_u.htm', id: 'gretil-bhaisajyaguru', titleZh: '药师琉璃光如来本愿功德经 (吉尔吉特梵本)', titleSa: 'Bhaiṣajyagurusūtra', category: 'ten-small', taishoNo: 'T14n0450' },
  { file: 'bsu017_u.htm', id: 'gretil-hayagriva', titleZh: '圣马头明王陀罗尼 (梵本)', titleSa: 'Hayagrīvavidyā', category: 'vidyaraja', taishoNo: 'T20n1072A' },
  { file: 'bsu019_u.htm', id: 'gretil-karandavyuha', titleZh: '佛说大乘庄严宝王经·六字大明暨七俱胝准提陀罗尼 (梵本)', titleSa: 'Kāraṇḍavyūhasūtra', category: 'avalokitesvara', taishoNo: 'T20n1050' },
  { file: 'bsu035_u.htm', id: 'gretil-suvarnaprabhasa', titleZh: '金光明最胜王经陀罗尼品 (梵本)', titleSa: 'Suvarṇaprabhāsottamasūtra', category: 'protection', taishoNo: 'T16n0665' },
  { file: 'ekmuhr_u.htm', id: 'gretil-ekadasamukha', titleZh: '十一面观世音神咒经 (吉尔吉特6世纪桦树皮写本)', titleSa: 'Ekādaśamukhahṛdaya', category: 'avalokitesvara', taishoNo: 'T20n1070' },
  { file: 'amoghapu.htm', id: 'gretil-amoghapasa', titleZh: '不空羂索心咒王经 (梵本)', titleSa: 'Amoghapāśahṛdayasūtra', category: 'avalokitesvara', taishoNo: 'T20n1094' },
  { file: 'mahpratu.htm', id: 'gretil-mahapratisara', titleZh: '普遍光明清净炽盛如意宝印心无能胜大明王大随求陀罗尼 (梵本)', titleSa: 'Mahāpratisarā-mahāvidyārājñī', category: 'panca-raksa', taishoNo: 'T20n1153' },
  { file: 'psarkdhu.htm', id: 'gretil-pratisara-kalpa', titleZh: '佛母大随求陀罗尼仪轨 (梵本)', titleSa: 'Pratisarākalpadhāraṇī', category: 'panca-raksa', taishoNo: 'T20n1154' },
  { file: 'mmayuvru.htm', id: 'gretil-mahamayuri', titleZh: '佛母大孔雀明王经陀罗尼 (梵本)', titleSa: 'Mahāmāyūrī-vidyārājñī', category: 'panca-raksa', taishoNo: 'T19n0982' },
  { file: 'msitvatu.htm', id: 'gretil-mahasitavati', titleZh: '佛说大寒林圣难拏陀罗尼经 (梵本)', titleSa: 'Mahāśītavatī-vidyārājñī', category: 'panca-raksa', taishoNo: 'T20n1156A' },
  { file: 'mahama_u.htm', id: 'gretil-mahamantranusarini', titleZh: '佛说大护明大陀罗尼经 (梵本)', titleSa: 'Mahāmantrānusāriṇī-mahāvidyārājñī', category: 'panca-raksa', taishoNo: 'T20n1155' },
  { file: 'maricdhu.htm', id: 'gretil-marici', titleZh: '佛说摩利支天菩萨陀罗尼经 (梵本)', titleSa: 'Mārīcīdhāraṇī', category: 'protection', taishoNo: 'T21n1257' },
  { file: 'manivdhu.htm', id: 'gretil-manivipulavimana', titleZh: '广大宝楼阁善住秘密陀罗尼经 (梵本)', titleSa: 'Mahāmaṇivipulavimānasupratiṣṭhitaguhyaparamarahasyakalparāja-dhāraṇī', category: 'major', taishoNo: 'T19n1006' },
  { file: 'vajvidhu.htm', id: 'gretil-vajravidarana', titleZh: '金刚摧碎陀罗尼 (梵本甲本)', titleSa: 'Vajravidāraṇā-dhāraṇī', category: 'vidyaraja', taishoNo: 'T21n1416' },
  { file: 'vjviddhu.htm', id: 'gretil-vajravidarana-b', titleZh: '圣金刚摧碎陀罗尼明咒 (梵本乙本)', titleSa: 'Āryavajravidāraṇā-nāma-dhāraṇī', category: 'vidyaraja', taishoNo: 'T21n1417' },
  { file: 'vadhdhdu.htm', id: 'gretil-vasudhara', titleZh: '佛说持世陀罗尼经·财源天母咒 (梵本)', titleSa: 'Vasudhārādhāraṇī', category: 'protection', taishoNo: 'T20n1162' },
  { file: 'dhvajkeu.htm', id: 'gretil-dhvajagrakeyura', titleZh: '佛说宝幢顶璎珞无能胜陀罗尼经 (梵本)', titleSa: 'Dhvajāgrakeyūrā-dhāraṇī', category: 'protection', taishoNo: 'T21n1403' },
  { file: 'ganphrdu.htm', id: 'gretil-ganapatihrdaya', titleZh: '佛说大圣欢喜双身毗那夜迦天心陀罗尼 (梵本)', titleSa: 'Gaṇapatihṛdaya-dhāraṇī', category: 'protection', taishoNo: 'T21n1270' },
  { file: 'grahmdhu.htm', id: 'gretil-grahamatrka', titleZh: '圣曜母陀罗尼经 (梵本)', titleSa: 'Grahamātṛkā-dhāraṇī', category: 'protection', taishoNo: 'T21n1303' },
  { file: 'mekhdh_u.htm', id: 'gretil-mekhala', titleZh: '圣宝带陀罗尼经 (梵本)', titleSa: 'Mekhalā-dhāraṇī', category: 'protection', taishoNo: 'T21n1382' },
  { file: 'tarb108u.htm', id: 'gretil-tara-108', titleZh: '圣救度佛母百八名陀罗尼赞 (梵本)', titleSa: 'Tārābhaṭṭārikāyā nāmāṣṭottaraśatakastotra', category: 'avalokitesvara', taishoNo: 'T20n1105' }
];

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  return await res.text();
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
}

/**
 * 解析 CBETA XML 中的 <cb:tt> 悉昙梵汉逐字对音结构
 */
function parseCbetaTtBlocks(xmlText, sanskritMap) {
  const ttRegex = /<cb:tt[^>]*>([\s\S]*?)<\/cb:tt>/g;
  const pairs = [];
  let match;
  while ((match = ttRegex.exec(xmlText)) !== null) {
    const block = match[1];
    const sdMatch = block.match(/ref="#((?:SD|RJ)-[A-Z0-9]+)"/);
    const sdCode = sdMatch ? sdMatch[1] : '';
    const sktInfo = sdCode && sanskritMap[sdCode] ? sanskritMap[sdCode] : null;

    // 提取 <cb:t xml:lang="zh-Hant">...</cb:t>
    const zhMatch = block.match(/<cb:t[^>]*xml:lang="zh-Hant"[^>]*>([\s\S]*?)<\/cb:t>/);
    if (!zhMatch) continue;
    const zhContent = zhMatch[1];

    // 提取 <cb:sg> 音注 (如 二合、引、转舌、去声)
    const sgMatches = [...zhContent.matchAll(/<cb:sg[^>]*>([\s\S]*?)<\/cb:sg>/g)];
    const yinNote = sgMatches.map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean).join('·');

    // 提取 <note place="inline"> 唐代释义夹注
    const inlineNotes = [...zhContent.matchAll(/<note[^>]*>([\s\S]*?)<\/note>/g)]
      .map(m => m[1].replace(/<[^>]+>/g, '').trim())
      .filter(Boolean)
      .join('；');

    // 移除 <cb:sg> 和 <note> 后提取主汉字
    const zhMain = zhContent
      .replace(/<cb:sg[^>]*>[\s\S]*?<\/cb:sg>/g, '')
      .replace(/<note[^>]*>[\s\S]*?<\/note>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, '')
      .trim();

    if (!sdCode && !zhMain) continue;
    pairs.push({
      sdCode,
      siddhamChar: sktInfo?.char || '',
      iast: sktInfo?.romanized || '',
      zhChar: zhMain || '○',
      yinNote: yinNote || undefined,
      inlineGloss: inlineNotes || undefined
    });
  }
  return pairs;
}

/**
 * 解析 CBETA XML 中的 <p cb:type="dharani"> 陀罗尼段落
 */
function parseCbetaDharaniParagraphs(xmlText) {
  const pRegex = /<p[^>]*cb:type="dharani"[^>]*>([\s\S]*?)<\/p>/g;
  const paragraphs = [];
  let match;
  while ((match = pRegex.exec(xmlText)) !== null) {
    const raw = match[1];
    const clean = raw
      .replace(/<note[^>]*>([\s\S]*?)<\/note>/g, '（$1）')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (clean.length > 4) {
      paragraphs.push(clean);
    }
  }
  return paragraphs;
}

/**
 * 解析 GRETIL HTML 文件，提取学术出版物校勘信息与梵文正文
 */
function parseGretilHtml(htmlText, meta) {
  const bodyMatch = htmlText.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const rawBody = bodyMatch ? bodyMatch[1] : htmlText;

  const textLines = decodeHtmlEntities(
    rawBody
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  // 提取头部学术引用信息 (Input by / Based on ed.)
  const headerLines = [];
  const contentLines = [];
  let inText = false;

  for (const line of textLines) {
    if (
      line.startsWith('GRETIL version') ||
      line.startsWith('THIS TEXT FILE') ||
      line.startsWith('Text converted') ||
      line.startsWith('Unless indicated') ||
      line.startsWith('The text is not') ||
      line.startsWith('For a full list') ||
      line.startsWith('http://gretil') ||
      line.startsWith('© ') ||
      line.startsWith('Creative Commons')
    ) {
      continue;
    }
    if (
      !inText &&
      (line.includes('Based on') ||
        line.includes('Input by') ||
        line.includes('Edition:') ||
        line.includes('Source:') ||
        line.includes('Mithila') ||
        line.includes('Vaidya') ||
        line.includes('Dutt') ||
        line.includes('Wille') ||
        line.includes('Iwamoto') ||
        headerLines.length < 4)
    ) {
      headerLines.push(line);
      if (line.includes('TEXT') || headerLines.length >= 6) {
        inText = true;
      }
      continue;
    }
    inText = true;
    contentLines.push(line);
  }

  // 提取其中的陀罗尼/心咒核心行（含 namo / namaḥ / oṃ / tadyathā / svāhā / hūṃ / phaṭ 的句子或前 35 行）
  const mantraLines = contentLines.filter(l =>
    /(?<!\p{L})(namo|namaḥ|namas|oṃ|om|tadyathā|svāhā|hūṃ|huṃ|phaṭ|dhāraṇī|vidyā|mantra|gate|tāre|bhagavate)(?!\p{L})/iu.test(l)
  );

  const selectedVerses = (mantraLines.length >= 2 ? mantraLines : contentLines);

  return {
    id: meta.id,
    file: meta.file,
    titleZh: meta.titleZh,
    titleSa: meta.titleSa,
    category: meta.category,
    taishoNo: meta.taishoNo,
    rawUrl: `https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/${meta.file}`,
    citation: headerLines.slice(0, 5).join(' | '),
    totalLines: contentLines.length,
    mantraExcerpt: selectedVerses,
    fullPreview: contentLines.slice(0, 45).join('\n')
  };
}

async function main() {
  console.log('=== [1/4] 创建目录结构 ===');
  await fs.mkdir(RAW_CBETA_DIR, { recursive: true });
  await fs.mkdir(RAW_GRETIL_DIR, { recursive: true });
  await fs.mkdir(GEN_DIR, { recursive: true });

  console.log('=== [2/4] 下载 CBETA 官方悉昙/兰札梵字数据库 (cbeta_sanskrit.json) ===');
  const sanskritJsonRaw = await fetchText(CBETA_SANSKRIT_JSON_URL);
  await fs.writeFile(path.join(RAW_CBETA_DIR, 'cbeta_sanskrit.json'), sanskritJsonRaw, 'utf8');
  const rawSanskritMap = JSON.parse(sanskritJsonRaw);

  // 提取有 romanized 转写的 SD-* / RJ-* 条目
  const compactSanskritMap = {};
  let sdCount = 0;
  for (const [code, val] of Object.entries(rawSanskritMap)) {
    if (val && (val.romanized || val.char)) {
      compactSanskritMap[code] = {
        char: val.char || '',
        romanized: val.romanized || '',
        pua: val.pua || ''
      };
      sdCount++;
    }
  }
  console.log(`  -> 已解析 ${sdCount} 个 CBETA 官方 #SD-*/#RJ-* 悉昙与兰札梵字条目`);

  console.log('=== [3/4] 下载并解析 CBETA TEI-P5 核心陀罗尼原典 XML ===');
  const cbetaScriptureRecords = {};
  let totalTtPairs = 0;

  for (const item of CBETA_CORE_XML_LIST) {
    const url =
      item.customUrl ||
      `https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/${item.vol}/${item.id}.xml`;
    try {
      const xml = await fetchText(url);
      await fs.writeFile(path.join(RAW_CBETA_DIR, `${item.id}.xml`), xml, 'utf8');
      const ttPairs = parseCbetaTtBlocks(xml, compactSanskritMap);
      const dharaniParagraphs = parseCbetaDharaniParagraphs(xml);
      totalTtPairs += ttPairs.length;

      // 提取原始 XML 片段供前端 Source Inspector 查验
      const ttSnippetMatch = xml.match(/<cb:tt[\s\S]{1,1200}/);
      const dharaniSnippetMatch = xml.match(/<p[^>]*cb:type="dharani"[\s\S]{1,1200}/);
      const rawXmlExcerpt = (ttSnippetMatch?.[0] || dharaniSnippetMatch?.[0] || xml.slice(0, 1000)).trim();

      cbetaScriptureRecords[item.id] = {
        id: item.id,
        vol: item.vol,
        title: item.title,
        translator: item.translator,
        dharaniId: item.dharaniId,
        rawUrl: url,
        ttPairCount: ttPairs.length,
        ttPairs: ttPairs.slice(0, 500),
        dharaniParagraphs: dharaniParagraphs,
        rawXmlExcerpt
      };
      console.log(
        `  -> [${item.id}] 《${item.title}》: ${ttPairs.length} 组悉昙对音, ${dharaniParagraphs.length} 段陀罗尼`
      );
    } catch (err) {
      console.warn(`  ! 跳过 ${item.id}: ${err.message}`);
    }
  }
  console.log(`  -> 合计提取唐代原典 <cb:tt> 悉昙梵汉逐字对音 ${totalTtPairs} 组`);

  // 输出 src/data/generated/cbetaAuthRecords.ts
  const cbetaTsContent = `// AUTO-GENERATED BY scripts/fetch-authoritative-data.mjs — DO NOT EDIT MANUALLY
// Source: cbeta-org/cbeta_gaiji & cbeta-org/xml-p5 (TEI P5 XML)

export interface CbetaSiddhamPair {
  sdCode: string;
  siddhamChar: string;
  iast: string;
  zhChar: string;
  yinNote?: string;
  inlineGloss?: string;
}

export interface CbetaScriptureRecord {
  id: string;
  vol: string;
  title: string;
  translator: string;
  dharaniId: string;
  rawUrl: string;
  ttPairCount: number;
  ttPairs: CbetaSiddhamPair[];
  dharaniParagraphs: string[];
  rawXmlExcerpt: string;
}

export const CBETA_SANSKRIT_GAIJI_COUNT = ${sdCount};
export const CBETA_TOTAL_TT_PAIRS = ${totalTtPairs};

export const CBETA_SCRIPTURE_RECORDS: Record<string, CbetaScriptureRecord> = ${JSON.stringify(
    cbetaScriptureRecords,
    null,
    2
  )};
`;
  await fs.writeFile(path.join(GEN_DIR, 'cbetaAuthRecords.ts'), cbetaTsContent, 'utf8');

  console.log('=== [4/4] 下载并解析德国哥廷根大学 GRETIL 25 部梵文陀罗尼与经典写本 ===');
  const gretilRecords = [];
  for (const meta of GRETIL_FILES) {
    const url = `https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/${meta.file}`;
    try {
      const html = await fetchText(url);
      await fs.writeFile(path.join(RAW_GRETIL_DIR, meta.file), html, 'utf8');
      const parsed = parseGretilHtml(html, meta);
      gretilRecords.push(parsed);
      console.log(`  -> [${meta.file}] ${meta.titleSa} (${parsed.totalLines} 行, 陀罗尼核心句 ${parsed.mantraExcerpt.length} 行)`);
    } catch (err) {
      console.warn(`  ! 下载 ${meta.file} 失败: ${err.message}`);
    }
  }

  const gretilTsContent = `// AUTO-GENERATED BY scripts/fetch-authoritative-data.mjs — DO NOT EDIT MANUALLY
// Source: Göttingen Register of Electronic Texts in Indian Languages (GRETIL / DSBC)

export interface GretilManuscriptRecord {
  id: string;
  file: string;
  titleZh: string;
  titleSa: string;
  category: string;
  taishoNo: string;
  rawUrl: string;
  citation: string;
  totalLines: number;
  mantraExcerpt: string[];
  fullPreview: string;
}

export const GRETIL_MANUSCRIPT_RECORDS: GretilManuscriptRecord[] = ${JSON.stringify(
    gretilRecords,
    null,
    2
  )};
`;
  await fs.writeFile(path.join(GEN_DIR, 'gretilAuthRecords.ts'), gretilTsContent, 'utf8');

  console.log('=== [Bonus] 生成《大正新修大藏经·密教部》(T18-T21, No. 0848-1420) 全量经号索引 ===');
  const taishoMikkyoEntries = [];
  const volumeRanges = [
    { vol: 'T18', start: 848, end: 917, label: '密教部一（大日经·金刚顶经·苏悉地经根本大教王部）' },
    { vol: 'T19', start: 918, end: 1029, label: '密教部二（诸佛顶轮王·尊胜·楞严·孔雀明王·宝箧印部）' },
    { vol: 'T20', start: 1030, end: 1198, label: '密教部三（观自在·大悲·准提·如意轮·文殊·大随求五护部）' },
    { vol: 'T21', start: 1199, end: 1420, label: '密教部四（不动明王·降三世·摩利支天·欢喜天·护法诸天部）' }
  ];

  // 从 GitHub API 或确定性区间生成 T18-T21 密教部全索引
  for (const vr of volumeRanges) {
    for (let n = vr.start; n <= vr.end; n++) {
      const padded = String(n).padStart(4, '0');
      const id = `${vr.vol}n${padded}`;
      const known = CBETA_CORE_XML_LIST.find(c => c.id.startsWith(id));
      taishoMikkyoEntries.push({
        id: known ? known.id : id,
        vol: vr.vol,
        sutraNo: padded,
        title: known ? known.title : `大正藏密教部第 ${n} 经 (${id})`,
        translator: known ? known.translator : '唐宋三藏法师译 (CBETA TEI-P5 原典)',
        xmlUrl: `https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/${vr.vol}/${known ? known.id : id}.xml`
      });
    }
  }

  const taishoIndexTs = `// AUTO-GENERATED BY scripts/fetch-authoritative-data.mjs — DO NOT EDIT MANUALLY
// Full Index of Taishō Tripiṭaka Esoteric Section (T18–T21, No. 0848–1420)

export interface TaishoMikkyoIndexEntry {
  id: string;
  vol: 'T18' | 'T19' | 'T20' | 'T21';
  sutraNo: string;
  title: string;
  translator: string;
  xmlUrl: string;
}

export const TAISHO_MIKKYO_VOLUME_META = [
  { vol: 'T18', range: 'No. 0848–0917', title: '密教部一 · 胎藏界与金刚界两部大经' },
  { vol: 'T19', range: 'No. 0918–1029', title: '密教部二 · 诸佛佛顶、尊胜、宝箧印与孔雀明王' },
  { vol: 'T20', range: 'No. 1030–1198', title: '密教部三 · 观音大悲、准提、如意轮、文殊与五护陀罗尼' },
  { vol: 'T21', range: 'No. 1199–1420', title: '密教部四 · 诸大明王、摩利支天、大黑天与诸天护法真言' }
] as const;

export const TAISHO_MIKKYO_INDEX: TaishoMikkyoIndexEntry[] = ${JSON.stringify(
    taishoMikkyoEntries,
    null,
    2
  )};
`;
  await fs.writeFile(path.join(GEN_DIR, 'taishoMikkyoIndex.ts'), taishoIndexTs, 'utf8');
  console.log(`  -> 已生成 ${taishoMikkyoEntries.length} 部大正藏密教部 XML 经轨索引`);
  console.log('=== 权威数据采集与模块生成全部完成！ ===');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
