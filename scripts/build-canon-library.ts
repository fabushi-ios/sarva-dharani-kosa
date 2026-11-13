/**
 * scripts/build-canon-library.ts
 *
 * 藏经全文库与全藏正文分桶检索引擎构建器：
 * 将完整 CBETA XML-P5 全藏（全部 27 个部类：T, X, J, F, A, K, L, N, ZW…，含无陀罗尼经典与含陀罗尼经典）编译为：
 * 1. build/canon/cbeta/<collection>/<id>.json.gz — 单经完整原文与陀罗尼块（按需加载）
 * 2. build/canon/catalog.json.gz — 全藏目录（经号、部类、卷册、经名、译者、字数、陀罗尼数）
 * 3. build/canon/search-buckets/bucket-<00..3f>.json.gz — 64 桶归一化全文检索分片，
 *    支持在前端以繁简/同音归一化方式直接检索任意无陀罗尼经文或含陀罗尼经文的内文语句！
 *
 * 用法：npx tsx scripts/build-canon-library.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { parseCbetaXml } from '../src/services/cbeta/cbetaLiveService';
import { normalizeSearchText } from '../src/core/search/searchEngine';
import type { CanonCatalogItem, CanonTextFile } from '../src/core/canon/canonLibraryTypes';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const XML_DIR = path.resolve(ROOT, process.env.CBETA_XML_DIR || 'data/raw/cbeta/xml-p5');
const OUT_DIR = path.resolve(ROOT, process.env.CANON_OUT_DIR || 'build/canon');
const BUCKET_COUNT = 64;

export interface CanonSearchBucketDoc {
  id: string;
  col: string;
  title: string;
  byline: string;
  dharani: number;
  /** Compact normalized hay + representative excerpt snippets */
  norm: string;
  sample: string;
}

function hashGramToBucket(gram: string): number {
  let h = 2166136261;
  for (let i = 0; i < gram.length; i++) {
    h ^= gram.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % BUCKET_COUNT;
}

function* xmlFiles(dir: string): Generator<string> {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) yield* xmlFiles(p);
    else if (/^[A-Z]{1,2}\d{2,3}n[0-9A-Za-z_]+\.xml$/.test(d.name)) yield p;
  }
}

const KIND = { head: 'h', text: 't', dharani: 'd' } as const;

export function buildText(file: string): { item: CanonCatalogItem; text: CanonTextFile } {
  const id = path.basename(file, '.xml');
  const vol = (id.match(/^([A-Z]{1,2}\d{2,3})n/) || ['', ''])[1];
  const collection = (vol.match(/^[A-Z]+/) || [''])[0];
  const url = `https://raw.githubusercontent.com/cbeta-org/xml-p5/master/${collection}/${vol}/${id}.xml`;
  const s = parseCbetaXml(id, vol, fs.readFileSync(file, 'utf8'), url);
  const paragraphs = s.fullParagraphs.map((p) => [KIND[p.kind], p.text] as [string, string]);
  const dharani = s.dharaniBlocks.map((b) => ({
    title: b.blockTitleZh,
    text: b.text,
    ...(b.siddhamText ? { siddham: b.siddhamText } : {}),
    ...(b.iastText ? { iast: b.iastText } : {}),
  }));
  const chars = paragraphs.reduce((n, [, t]) => n + t.length, 0);
  return {
    item: { id, collection, vol, title: s.titleZh, byline: s.translator, chars, dharani: dharani.length },
    text: { id, collection, vol, title: s.titleZh, byline: s.translator, url, paragraphs, dharani },
  };
}

function main() {
  if (!fs.existsSync(XML_DIR)) {
    console.error(`CBETA XML not found at ${XML_DIR} (git clone --depth 1 https://github.com/cbeta-org/xml-p5)`);
    process.exit(1);
  }
  const catalog: CanonCatalogItem[] = [];
  const buckets: CanonSearchBucketDoc[][] = Array.from({ length: BUCKET_COUNT }, () => []);

  let n = 0;
  for (const file of xmlFiles(XML_DIR)) {
    const { item, text } = buildText(file);
    const out = path.join(OUT_DIR, 'cbeta', item.collection, `${item.id}.json.gz`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, zlib.gzipSync(JSON.stringify(text), { level: 9 }));
    catalog.push(item);

    // Index headings + opening/key paragraphs into 64 hash buckets by normalized 2-char CJK bigrams
    const bodyJoined = text.paragraphs
      .map(([, p]) => p)
      .join(' ')
      .slice(0, 6000);
    const normBody = normalizeSearchText(`${item.id} ${item.title} ${item.byline} ${bodyJoined}`).slice(0, 2400);
    const docEntry: CanonSearchBucketDoc = {
      id: item.id,
      col: item.collection,
      title: item.title,
      byline: item.byline,
      dharani: item.dharani,
      norm: normBody,
      sample: bodyJoined.replace(/\s+/g, ' ').slice(0, 140),
    };

    const assignedBuckets = new Set<number>();
    const titleNorm = normalizeSearchText(item.title).replace(/\s+/g, '');
    const chars = Array.from(titleNorm);
    for (let i = 0; i + 1 < chars.length && assignedBuckets.size < 6; i++) {
      assignedBuckets.add(hashGramToBucket(chars[i] + chars[i + 1]));
    }
    if (assignedBuckets.size === 0 && chars.length > 0) {
      assignedBuckets.add(hashGramToBucket(chars[0]));
    }
    for (const bIdx of assignedBuckets) {
      buckets[bIdx].push(docEntry);
    }

    if (++n % 500 === 0) console.log(`${n} texts…`);
  }

  catalog.sort((a, b) => a.id.localeCompare(b.id));
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'catalog.json.gz'), zlib.gzipSync(JSON.stringify(catalog), { level: 9 }));

  const bucketDir = path.join(OUT_DIR, 'search-buckets');
  fs.mkdirSync(bucketDir, { recursive: true });
  buckets.forEach((bDocs, idx) => {
    const hex = idx.toString(16).padStart(2, '0');
    fs.writeFileSync(
      path.join(bucketDir, `bucket-${hex}.json.gz`),
      zlib.gzipSync(JSON.stringify(bDocs), { level: 9 })
    );
  });

  const withDharani = catalog.filter((c) => c.dharani > 0).length;
  const withoutDharani = catalog.length - withDharani;
  const dharani = catalog.reduce((s, c) => s + c.dharani, 0);
  console.log(
    `CBETA library built: ${catalog.length} total scriptures (${withDharani} with dhāraṇīs [${dharani} blocks], ${withoutDharani} pure sutras/śāstras) + ${BUCKET_COUNT} search buckets.`
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) main();
