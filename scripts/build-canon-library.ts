/**
 * scripts/build-canon-library.ts
 *
 * 藏经全文库: converts the complete CBETA XML-P5 canon (every collection: T, X, J, F, …) into
 *   build/canon/cbeta/<collection>/<id>.json.gz   one file per XML text, loaded on demand
 *   build/canon/catalog.json.gz                   id, title, byline, collection, dhāraṇī count
 * Text and dhāraṇīs come from the source XML through the same parser the reader uses
 * (parseCbetaXml): the dhāraṇīs are the passages CBETA itself marks `cb:type="dharani"`.
 *
 * Input: a checkout of https://github.com/cbeta-org/xml-p5 (env CBETA_XML_DIR,
 * default data/raw/cbeta/xml-p5). Uploaded by scripts/deploy-hf-and-cf.sh to the Hugging Face CDN
 * (canon/), not bundled into the site. Usage: npx tsx scripts/build-canon-library.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { parseCbetaXml } from '../src/services/cbeta/cbetaLiveService';
import type { CanonCatalogItem, CanonTextFile } from '../src/core/canon/canonLibraryTypes';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const XML_DIR = path.resolve(ROOT, process.env.CBETA_XML_DIR || 'data/raw/cbeta/xml-p5');
const OUT_DIR = path.resolve(ROOT, process.env.CANON_OUT_DIR || 'build/canon');

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
  let n = 0;
  for (const file of xmlFiles(XML_DIR)) {
    const { item, text } = buildText(file);
    const out = path.join(OUT_DIR, 'cbeta', item.collection, `${item.id}.json.gz`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, zlib.gzipSync(JSON.stringify(text), { level: 9 }));
    catalog.push(item);
    if (++n % 500 === 0) console.log(`${n} texts…`);
  }
  catalog.sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(path.join(OUT_DIR, 'catalog.json.gz'), zlib.gzipSync(JSON.stringify(catalog), { level: 9 }));
  const withDharani = catalog.filter((c) => c.dharani > 0).length;
  const dharani = catalog.reduce((s, c) => s + c.dharani, 0);
  console.log(`CBETA library: ${catalog.length} texts, ${withDharani} contain dhāraṇīs (${dharani} passages)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) main();
