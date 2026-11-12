/**
 * scripts/build-full-taisho-and-gretil-index.mjs
 *
 * Batch-fetches and parses:
 * 1. ALL 614 Taishō Tripiṭaka Esoteric Canon (T18–T21, No. 848–1420) XML files from cbeta-org/xml-p5,
 *    extracting the official Chinese title (with Traditional->Simplified mapping for search),
 *    translator, total dharani count, and primary <p cb:type="dharani"> mantra texts.
 * 2. Expanded GRETIL Buddhist Sanskrit Dhāraṇī & Mahāyāna Sūtra files from INDOLOGY/GRETIL-mirror.
 */

import fs from 'node:fs';
import path from 'node:path';
import { toSimplifiedZh } from '../src/core/search/tradSimp.ts';

// Comprehensive Traditional-to-Simplified dictionary for Buddhist & Esoteric terms
// Shared Traditional→Simplified table (same one the runtime search uses); replaces the old
// ~190-char local map that mis-folded characters (e.g. 閦→閼) and left titles unconverted.
const toSimplified = (str) => toSimplifiedZh(str);

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

async function main() {
  const rawIdxFile = fs.readFileSync('src/data/kosa-generated/taishoMikkyoIndex.ts', 'utf8');
  const jsonStart = rawIdxFile.indexOf('[\n');
  const baseList = JSON.parse(rawIdxFile.slice(jsonStart).replace(/;\s*$/, ''));
  console.log(`Fetching metadata & dharanis for all ${baseList.length} Taisho T18-T21 XMLs...`);

  const t0 = Date.now();
  const enrichedList = await runPool(baseList, 35, async (item, i) => {
    try {
      const res = await fetch(item.rawXmlUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();

      const titleMatch =
        xml.match(/<title level="m" xml:lang="zh-Hant">([^<]+)<\/title>/) ||
        xml.match(/<cb:jhead>([^<]+)<\/cb:jhead>/);
      const rawTitle = titleMatch ? titleMatch[1].replace(/^\d+\s*/, '').trim() : item.id;
      const titleSimp = toSimplified(rawTitle);

      const authorMatch =
        xml.match(/<author>([^<]+)<\/author>/) ||
        xml.match(/<byline[^>]*>([^<]+)<\/byline>/);
      const translator = authorMatch
        ? toSimplified(authorMatch[1].trim())
        : '唐宋三藏法师译';

      // Extract <p cb:type="dharani"> blocks
      const pRegex = /<p[^>]*cb:type="dharani"[^>]*>([\s\S]*?)<\/p>/g;
      let pm;
      const sampleDharanis = [];
      const blockTitles = [];
      const fullTextParts = [];
      let dharaniCount = 0;
      while ((pm = pRegex.exec(xml)) !== null) {
        dharaniCount++;
        // Heading of this block = tail of the plain text immediately preceding it (e.g. 「地天真言曰」).
        const before = xml
          .slice(Math.max(0, pm.index - 1500), pm.index)
          .replace(/<note[\s\S]*?<\/note>/g, '')
          .replace(/<[^>]+>/g, '')
          .replace(/[\uE000-\uF8FF]|[\u{F0000}-\u{10FFFF}]/gu, '')
          .replace(/\s+/g, '');
        const heading = Array.from(before).slice(-40).join('').trim();
        if (heading) blockTitles.push(toSimplified(heading));
        fullTextParts.push(
          toSimplified(
            pm[1]
              .replace(/<cb:t[^>]*xml:lang="sa-Sidd"[^>]*>[\s\S]*?<\/cb:t>/g, '')
              // inline clause numbers / 二合 / 引 notes would break up the mantra for search
              .replace(/<note[^>]*>[\s\S]*?<\/note>/g, '')
              .replace(/<[^>]+>/g, '')
              .replace(/[\uE000-\uF8FF]|[\u{F0000}-\u{10FFFF}]/gu, '')
              .replace(/\s+/g, '')
          )
        );
        if (sampleDharanis.length < 3) {
          const cleanP = Array.from(
            pm[1]
              .replace(/<cb:t[^>]*xml:lang="sa-Sidd"[^>]*>[\s\S]*?<\/cb:t>/g, '')
              .replace(/<cb:sg>([^<]+)<\/cb:sg>/g, '($1)')
              .replace(/<note place="inline">([^<]*)<\/note>/g, '[$1]')
              .replace(/<[^>]+>/g, '')
              .replace(/[\uE000-\uF8FF]|[\u{F0000}-\u{10FFFF}]/gu, '')
              .replace(/\s+/g, ' ')
              .trim()
          );
          if (cleanP.length > 4) {
            sampleDharanis.push(toSimplified(cleanP.slice(0, 220).join('')));
          }
        }
      }

      if ((i + 1) % 100 === 0) {
        console.log(`  Processed ${i + 1} / ${baseList.length} XML scriptures...`);
      }

      return {
        ...item,
        titleTrad: rawTitle,
        titleZh: titleSimp,
        translator,
        dharaniBlockCount: dharaniCount,
        sampleDharanis,
        blockTitles,
        _fullText: fullTextParts.join(' '),
      };
    } catch (e) {
      return {
        ...item,
        titleTrad: item.id,
        titleZh: item.id,
        translator: '大藏经密教部',
        dharaniBlockCount: 0,
        sampleDharanis: [],
        blockTitles: [],
        _fullText: '',
        _fetchFailed: true,
      };
    }
  });

  console.log(
    `Completed all ${enrichedList.length} Taisho T18-T21 XMLs in ${((Date.now() - t0) / 1000).toFixed(1)}s!`
  );

  const failed = enrichedList.filter((r) => r._fetchFailed).map((r) => r.id);
  if (failed.length > 0) {
    // Never silently publish an index with missing scriptures.
    throw new Error(`Failed to fetch ${failed.length} scriptures: ${failed.slice(0, 20).join(', ')}`);
  }
  // Full dharani text goes to an un-bundled side file; the cloud search shard indexes all of it.
  fs.mkdirSync('data/raw/taisho', { recursive: true });
  fs.writeFileSync(
    'data/raw/taisho/dharani-fulltext.json',
    JSON.stringify(Object.fromEntries(enrichedList.map((r) => [r.id, r._fullText])))
  );
  for (const r of enrichedList) delete r._fullText;

  const totalDharaniBlocks = enrichedList.reduce((acc, r) => acc + (r.dharaniBlockCount || 0), 0);
  console.log(`Total <p cb:type="dharani"> blocks across T18-T21: ${totalDharaniBlocks}`);

  const outContent = `// AUTO-GENERATED BY scripts/build-full-taisho-and-gretil-index.mjs
// Source: CBETA Official TEI P5 XML Repository (github.com/cbeta-org/xml-p5/tree/master/T/T18..T21)
// Total Scriptures Indexed: ${enrichedList.length} | Total Authentic Dharani Blocks: ${totalDharaniBlocks}

export interface TaishoMikkyoFileEntry {
  id: string;
  vol: string;
  fileName: string;
  sizeBytes: number;
  rawXmlUrl: string;
  cbetaOnlineUrl: string;
  titleTrad: string;
  titleZh: string;
  translator: string;
  dharaniBlockCount: number;
  sampleDharanis: string[];
  /** Heading of every dharani block (uncapped), used for search & block labels. */
  blockTitles?: string[];
}

export const TOTAL_TAISHO_MIKKYO_DHARANI_BLOCKS = ${totalDharaniBlocks};

export const TAISHO_MIKKYO_FILE_INDEX: TaishoMikkyoFileEntry[] = ${JSON.stringify(
    enrichedList,
    null,
    2
  )};
`;

  // The app imports src/data/kosa-generated/ (src/data/generated/ is a different legacy module).
  for (const out of ['src/data/kosa-generated/taishoMikkyoIndex.ts']) {
    fs.writeFileSync(out, outContent, 'utf8');
    console.log(`Updated ${out}`);
  }
}

main();
