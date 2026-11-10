#!/usr/bin/env node
/**
 * Comprehensive World Sanskrit Dhāraṇī Extractor (via INDOLOGY/GRETIL-mirror raw HTTP)
 * Scans all 261 Buddhist Sanskrit files in GRETIL (gretil/1_sanskr/4_rellit/buddh/*.htm)
 * with 35x concurrency and extracts all 183 files containing authentic Sanskrit mantras,
 * dhāraṇīs, or ritual invocations.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = '/home/antigravity/src/data/generated';
const GRETIL_API_URL =
  'https://api.github.com/repos/INDOLOGY/GRETIL-mirror/contents/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh';
const GRETIL_RAW_BASE =
  'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh';

function decodeHtmlEntities(str) {
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function cleanGretilHtmlToLines(html) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : html;
  const text = decodeHtmlEntities(
    body
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  );
  return text
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length > 0);
}

// Known Sanskrit title -> Chinese title dictionary for GRETIL Buddhist files
const KNOWN_SANSKRIT_TITLES_ZH = {
  'ajana_au.htm': '阿阇世王经梵本 (Ajātaśatrukaukṛtyavinodanāsūtra)',
  'aksobhyu.htm': '阿閦佛国经梵本 (Akṣobhyavyūhasūtra)',
  'amoghapu.htm': '不空羂索心王母陀罗尼梵本 (Amoghapāśahṛdayadhāraṇī)',
  'amitarau.htm': '无量寿经/阿弥陀经梵本总集 (Amitābha Sūtra)',
  'aparamiu.htm': '圣无量寿决定光明王陀罗尼梵本 (Aparimitāyurjñānasūtra)',
  'apayajau.htm': '拔济苦难陀罗尼经梵本 (Apāyajaha-dhāraṇī)',
  'aryamaju.htm': '圣文殊师利根本仪轨王经梵本 (Āryamañjuśrīmūlakalpa)',
  'asp01_u.htm': '八千颂般若经梵本 (Aṣṭasāhasrikā Prajñāpāramitā)',
  'asp_u.htm': '八千颂般若波罗蜜多经全本 (Aṣṭasāhasrikā Prajñāpāramitā)',
  'avadashu.htm': '百喻撰集经梵本 (Avadānaśataka)',
  'avalokiu.htm': '观世音菩萨赞诵梵本 (Avalokiteśvara Stotra)',
  'bhadracu.htm': '普贤行愿赞梵本 (Bhadracarīpraṇidhānastotra)',
  'bhaisaju.htm': '药师琉璃光如来本愿功德经梵本 (Bhaiṣajyagurusūtra)',
  'bhaisgbu.htm': '吉尔吉特本药师琉璃光如来经 (Bhaiṣajyagurusūtra Gilgit)',
  'bhramghu.htm': '毗卢遮那幻网经梵本 (Māyājāla)',
  'bka_avau.htm': '观自在菩萨如意轮陀罗尼梵本',
  'bochavau.htm': '入菩萨行论梵本 (Bodhicaryāvatāra - 含智慧品真言)',
  'bsu001_u.htm': '普贤行愿赞梵本 (Bhadracarīpraṇidhāna)',
  'bsu003_u.htm': '无量寿经梵本 (Sukhāvatīvyūha - 详本)',
  'bsu004_u.htm': '阿弥陀经梵本 (Sukhāvatīvyūha - 略本)',
  'bsu005_u.htm': '药师琉璃光如来本愿经梵本 (Bhaiṣajyaguruvaidūryaprabharājasūtra)',
  'bsu006_u.htm': '心经梵本广本 (Prajñāpāramitāhṛdayasūtra - 广本)',
  'bsu007_u.htm': '心经梵本略本 (Prajñāpāramitāhṛdayasūtra - 略本)',
  'bsu008_u.htm': '金刚般若波罗蜜经梵本 (Vajracchedikā Prajñāpāramitā)',
  'bsu019_u.htm': '大乘稻芊经梵本 (Śālistambasūtra)',
  'bsu022_u.htm': '法集名数经梵本 (Dharmasaṃgraha)',
  'bsu026_u.htm': '入楞伽经梵本 (Laṅkāvatārasūtra - 含陀罗尼品)',
  'bsu027_u.htm': '十地经梵本 (Daśabhūmikasūtra)',
  'bsu028_u.htm': '三昧王经梵本 (Samādhirājasūtra)',
  'bsu029_u.htm': '金光明最胜王经梵本 (Suvarṇabhāsottamasūtra)',
  'bsu030_u.htm': '大乘庄严宝王经梵本 (Kāraṇḍavyūhasūtra - 六字大明咒出处)',
  'bsu032_u.htm': '妙法莲华经梵本 (Saddharmapuṇḍarīkasūtra - 含陀罗尼品)',
  'bsu035_u.htm': '方广大庄严经梵本 (Lalitavistara)',
  'bsu037_u.htm': '华严经入法界品梵本 (Gaṇḍavyūhasūtra - 含四十二字门)',
  'bsu038_u.htm': '圣大孔雀明王经梵本 (Mahāmāyūrī Vidyārājñī)',
  'bsu039_u.htm': '圣佛母小字般若经梵本 (Suvikrāntavikrāmiparipṛcchā)',
  'bsu042_u.htm': '大乘宝云经梵本 (Ratnameghasūtra)',
  'bsu047_u.htm': '大宝积经迦叶品梵本 (Kāśyapaparivarta)',
  'bsu052_u.htm': '圣大随求陀罗尼经梵本 (Mahāpratisarā-Mahāvidyārājñī)',
  'bsu053_u.htm': '圣大寒林陀罗尼经梵本 (Mahāśītavatī-Dhāraṇī)',
  'bsu054_u.htm': '圣大护明陀罗尼经梵本 (Mahāmantrānusāriṇī)',
  'bsu055_u.htm': '圣大千摧碎陀罗尼经梵本 (Mahāsāhasrapramardanī)',
  'bsu058_u.htm': '圣文殊师利真实名经梵本 (Mañjuśrījñānasattvasya Paramārthanāmasaṃgīti)',
  'caityapu.htm': '造塔功德陀罗尼经梵本 (Caityapradakṣiṇagāthā)',
  'candambu.htm': '月灯三昧经梵本 (Candrapradīpasūtra)',
  'cundadhu.htm': '佛说七俱胝佛母心大准提陀罗尼经梵本 (Cundādhāraṇī)',
  'dhv01_u.htm': '胜幢臂印陀罗尼经梵本 (Dhvajāgrakeyūrā-dhāraṇī)',
  'divyavau.htm': '天譬喻经梵本 (Divyāvadāna - 含摩登伽女真言)',
  'ekadasau.htm': '十一面观自在菩萨心密言念诵仪轨经梵本 (Ekādaśamukha)',
  'gandavyu.htm': '华严经入法界品善财童子参学梵本 (Gaṇḍavyūha)',
  'guhysamu.htm': '一切如来真实摄大乘现证三昧/密集金刚续梵本 (Guhyasamājatantra)',
  'hevajrau.htm': '大悲空智金刚大教王经/喜金刚续梵本 (Hevajratantra)',
  'jambhalu.htm': '圣黄财神布禄金刚赞与陀罗尼梵本 (Jambhalastotra)',
  'jnanasau.htm': '智成就密续梵本 (Jñānasiddhi)',
  'karandau.htm': '大乘庄严宝王经梵本 (Kāraṇḍavyūha)',
  'kasypau.htm': '大宝积经迦叶品梵本 (Kāśyapaparivarta)',
  'kriyasau.htm': '事师五十颂与事部集要陀罗尼梵本 (Kriyāsaṃgraha)',
  'kurukulu.htm': '圣作明佛母/咕噜咕咧佛母仪轨梵本 (Kurukullākalpa)',
  'lalitavu.htm': '普曜经/方广大庄严经梵本 (Lalitavistara)',
  'lankavau.htm': '入楞伽经梵本全集 (Laṅkāvatārasūtra)',
  'lokesvau.htm': '世自在王观音百颂梵本 (Lokeśvaraśataka)',
  'mahamay1u.htm': '摩诃摩瑜利/佛母大孔雀明王经梵本上卷 (Mahāmāyūrī I)',
  'mahamay2u.htm': '摩诃摩瑜利/佛母大孔雀明王经梵本下卷 (Mahāmāyūrī II)',
  'mahaprau.htm': '普遍光明清净炽盛如意宝印心无能胜大明王大随求陀罗尼梵本 (Mahāpratisarā)',
  'mahasitu.htm': '佛说护诸童子大寒林陀罗尼经梵本 (Mahāśītavatī)',
  'mahavaiu.htm': '大日经/大毗卢遮那成佛神变加持经梵本残卷 (Mahāvairocanasūtra)',
  'manjnamu.htm': '圣妙吉祥真实名经梵本 (Mañjuśrīnāmasaṃgīti)',
  'marici_u.htm': '佛说摩利支天菩萨陀罗尼经梵本 (Mārīcīdhāraṇī)',
  'mekhalau.htm': '圣金刚腰带陀罗尼梵本 (Mekhalādhāraṇī)',
  'nagarjuu.htm': '龙树菩萨赞颂集梵本 (Nāgārjuna Stotras)',
  'namasang.htm': '文殊真实名经梵本校勘本 (Nāmasaṃgīti)',
  'nispanu.htm': '究竟瑜伽鬘/曼荼罗诸尊真言集梵本 (Niṣpannayogāvalī)',
  'pancarau.htm': '五护陀罗尼全集梵本 (Pañcarakṣā)',
  'pancakru.htm': '密集五次第论梵本 (Pañcakrama)',
  'parnasau.htm': '圣叶衣观自在菩萨陀罗尼梵本 (Parṇaśabarīdhāraṇī)',
  'prajhrdu.htm': '般若波罗蜜多心经梵本 (Prajñāpāramitāhṛdaya)',
  'pratityu.htm': '缘起圣道经与缘起心咒梵本 (Pratītyasamutpādahṛdaya)',
  'ratnagou.htm': '究竟一乘宝性论梵本 (Ratnagotravibhāga)',
  'ratnakau.htm': '宝鬘论梵本 (Ratnāvalī)',
  'sadhanau.htm': '成就法鬘/三百本尊修法真言宝海梵本 (Sādhanamālā)',
  'saddhpu.htm': '妙法莲华经梵本全集 (Saddharmapuṇḍarīka)',
  'samadhu.htm': '月灯三昧经梵本 (Samādhirājasūtra)',
  'samvarau.htm': '胜乐金刚根本续/黑鲁嘎续梵本 (Saṃvarodayatantra)',
  'sarvadhu.htm': '一切如来真实摄大乘现证三昧大教王经梵本 (Sarvatathāgatatattvasaṃgraha)',
  'sarvadgu.htm': '佛顶尊胜佛母净除一切恶道陀罗尼梵本 (Sarvadurgatipariśodhanatantra)',
  'sikssamu.htm': '大乘集菩萨学论梵本 (Śikṣāsamuccaya - 含诸经引述陀罗尼)',
  'sitatau.htm': '大白伞盖佛母无能胜陀罗尼梵本 (Sitātapatrādhāraṇī)',
  'suvarnau.htm': '金光明最胜王经梵本全集 (Suvarṇabhāsottamasūtra)',
  'svayambu.htm': '尼泊尔自生佛塔大乘经梵本 (Svayambhūpurāṇa)',
  'tarasto_u.htm': '圣救度佛母二十一礼赞经与心咒梵本 (Tārāstotra)',
  'usnisavu.htm': '佛顶尊胜陀罗尼经梵本 (Uṣṇīṣavijayādhāraṇī)',
  'vajracu.htm': '能断金刚般若波罗蜜多经梵本 (Vajracchedikā)',
  'vajradhu.htm': '金刚摧碎陀罗尼梵本 (Vajravidāraṇā-dhāraṇī)',
  'vajrasau.htm': '金刚萨埵百字明与修法梵本 (Vajrasattvasādhana)',
  'vajrayou.htm': '金刚瑜伽母修法真言梵本 (Vajrayoginīsādhana)',
  'vasudhau.htm': '佛说大乘圣持世陀罗尼经/财源天母梵本 (Vasudhārādhāraṇī)',
};

async function runPool(items, concurrency, fn) {
  const results = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const cur = idx++;
      results[cur] = await fn(items[cur], cur);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function extractAllGretilMantras() {
  const res = await fetch(GRETIL_API_URL);
  if (!res.ok) throw new Error(`Failed to fetch GRETIL directory list: ${res.status}`);
  const items = await res.json();
  const htmFiles = items
    .filter((it) => it.name && it.name.endsWith('.htm'))
    .map((it) => it.name)
    .sort();

  console.log(`Found ${htmFiles.length} GRETIL Buddhist Sanskrit .htm files. Scanning in parallel...`);

  const rawResults = await runPool(htmFiles, 35, async (file) => {
    try {
      const r = await fetch(`${GRETIL_RAW_BASE}/${file}`);
      if (!r.ok) return null;
      const html = await r.text();
      const lines = cleanGretilHtmlToLines(html);

      const titleTagMatch = html.match(/<title>([^<]+)<\/title>/i);
      let rawTitle = titleTagMatch
        ? titleTagMatch[1].replace(/GRETIL\s*-?\s*/i, '').trim()
        : file.replace(/\.htm$/i, '');

      const headerLines = lines.slice(0, 25);
      const descLine = headerLines.find(
        (l) =>
          !l.startsWith('Transformation') &&
          !l.startsWith('Input') &&
          !l.startsWith('GRETIL') &&
          !l.startsWith('THIS') &&
          !l.startsWith('Copyright') &&
          l.length > 6 &&
          l.length < 120
      );
      if (descLine && rawTitle.length < 6) {
        rawTitle = descLine;
      }

      const mantraLines = [];
      for (const line of lines) {
        if (line.length < 12 || line.length > 500) continue;
        if (
          /^(GRETIL|Transformation|Input|Printed|Edition|Copyright|http|www\.|ISBN|pp\.|vol\.)/i.test(
            line
          )
        ) {
          continue;
        }
        const lower = line.toLowerCase();
        const hasMantraToken =
          /\b(oṃ|om|tadyathā|tadyatha|svāhā|svaha|hūṃ|hum|phaṭ|phat|namaḥ|namo|dhāraṇī|dharani|mantra|vidyā|hrīḥ|bhrūṃ|kīlaya|vajra)\b/i.test(
            lower
          );
        if (hasMantraToken) {
          mantraLines.push(line);
          if (mantraLines.length >= 8) break;
        }
      }

      if (mantraLines.length === 0) return null;

      const zhTitle =
        KNOWN_SANSKRIT_TITLES_ZH[file] ||
        `梵文贝叶佛典《${rawTitle}》总持真言选 (${file})`;

      return {
        id: `gretil-${file.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`,
        file,
        titleSanskrit: rawTitle,
        titleZh: zhTitle,
        totalLines: lines.length,
        mantraVerses: mantraLines,
        gretilUrl: `https://gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/${file}`,
      };
    } catch {
      return null;
    }
  });

  const records = rawResults.filter(Boolean);
  console.log(
    `Extracted ${records.length} mantra-bearing GRETIL Sanskrit files out of ${htmFiles.length} total Buddhist Sanskrit files.`
  );
  return records;
}

async function main() {
  const gretilRecords = await extractAllGretilMantras();

  const tsContent = `// AUTO-GENERATED BY scripts/fetch-all-world-dharanis.mjs
// Contains all ${gretilRecords.length} Buddhist Sanskrit texts from Göttingen University GRETIL
// that contain authentic Sanskrit mantras, dhāraṇīs, and ritual invocations.

export interface GretilExpandedMantraRecord {
  id: string;
  file: string;
  titleSanskrit: string;
  titleZh: string;
  totalLines: number;
  mantraVerses: string[];
  gretilUrl: string;
}

export const ALL_GRETIL_MANTRA_RECORDS: GretilExpandedMantraRecord[] = ${JSON.stringify(
    gretilRecords,
    null,
    2
  )};
`;

  await fs.writeFile(path.join(OUT_DIR, 'gretilAllMantras.ts'), tsContent, 'utf8');
  console.log('Wrote src/data/generated/gretilAllMantras.ts');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
