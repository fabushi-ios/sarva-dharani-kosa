/**
 * scripts/fetch-cited-sources.ts (run: npx tsx scripts/fetch-cited-sources.ts)
 *
 * For every CBETA canon number cited by a hand-authored entry (T, X, F, … — parsed by one
 * generic ID rule), downloads the CBETA TEI-P5 XML and stores its plain body text (inline notes,
 * collation readings and Siddhaṃ glyph runs removed). IDs that CBETA does not have are recorded
 * as `missing`, so a wrong citation can never pass silently.
 *
 * Every Sanskrit witness cited by a hand-authored entry (provenance.gretilRawUrl) is downloaded too, as plain text, so the
 * entries' Sanskrit (IAST) can be verified against the Sanskrit witness by the same code check.
 *
 * Output: data/raw/cbeta/cited-bodies.json.gz
 *   { texts: {id: bodyText}, titles: {id: title}, missing: [id], gretil: {file: plainText} }
 * Consumed by scripts/build-citation-check.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { curatedEntries } from './build-citation-check';
import { cbetaXmlUrl, citedCanonIds } from '../src/core/sources/citationCheck';
import { htmlToText } from '../src/core/sources/htmlText';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'data/raw/cbeta/cited-bodies.json.gz');

const ids = new Set<string>();
const gretilUrls = new Set<string>();
for (const e of curatedEntries()) {
  for (const id of citedCanonIds(e)) ids.add(id);
  if (e.provenance.gretilRawUrl) gretilUrls.add(e.provenance.gretilRawUrl);
}

const clean = (x: string) =>
  x
    .replace(/<cb:t[^>]*xml:lang="sa-Sidd"[^>]*>[\s\S]*?<\/cb:t>/g, '')
    .replace(/<rdg[\s\S]*?<\/rdg>/g, '')
    .replace(/<note[\s\S]*?<\/note>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[\uE000-\uF8FF]|[\u{F0000}-\u{10FFFF}]/gu, '')
    .replace(/\s+/g, '');

const texts: Record<string, string> = {};
const titles: Record<string, string> = {};
const missing: string[] = [];
const failed: string[] = [];
await Promise.all(
  [...ids].map(async (id) => {
    for (let i = 0; i < 4; i++) {
      const r = await fetch(cbetaXmlUrl(id)).catch(() => null);
      if (r && r.ok) {
        const xml = await r.text();
        const body = (xml.match(/<body>([\s\S]*)<\/body>/) || ['', ''])[1];
        texts[id] = clean(body);
        titles[id] = (xml.match(/<title level="m" xml:lang="zh-Hant">([^<]+)<\/title>/) || ['', id])[1].trim();
        return;
      }
      if (r && r.status === 404) {
        missing.push(id);
        return;
      }
    }
    failed.push(id);
  })
);
const gretil: Record<string, string> = {};
await Promise.all(
  [...gretilUrls].map(async (url) => {
    const file = url.split('/').pop() || url;
    for (let i = 0; i < 4; i++) {
      const r = await fetch(url).catch(() => null);
      if (r && r.ok) {
        gretil[file] = htmlToText(await r.text());
        return;
      }
      if (r && r.status === 404) {
        missing.push(file);
        return;
      }
    }
    failed.push(url);
  })
);
if (failed.length) {
  console.error(`network failures (not written): ${failed.join(', ')}`);
  process.exit(1);
}
const sortObj = (o: Record<string, string>) => Object.fromEntries(Object.entries(o).sort());
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(
  OUT,
  zlib.gzipSync(JSON.stringify({ texts: sortObj(texts), titles: sortObj(titles), missing: missing.sort(), gretil: sortObj(gretil) }), { level: 9 })
);
console.log(`GRETIL files: ${gretilUrls.size}, fetched: ${Object.keys(gretil).length}`);
console.log(`cited: ${ids.size}, fetched: ${Object.keys(texts).length}, not in CBETA: ${missing.sort().join(', ') || 'none'}`);
