import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as T1 from '../../src/data/generated/tier1Databases';
import * as T23 from '../../src/data/generated/tier23Databases';

/**
 * Root-cause guard: the bundled TS corpora must be a LOSSLESS projection of the raw JSON
 * databases. Any generator that silently truncates an array (`.slice(0, N)`) of mantras,
 * verses, paragraphs, records… makes this test fail, whichever script wrote the bundle.
 */
const PAIRS: Array<[string, unknown]> = [
  ['public/data/tier1/db1_fangshan.json', T1.DB1_FANGSHAN_CORPUS],
  ['public/data/tier1/db2_taisho_ext.json', T1.DB2_TAISHO_EXT_CORPUS],
  ['public/data/tier1/db3_dsbc_gretil.json', T1.DB3_DSBC_GRETIL_CORPUS],
  ['public/data/tier1/db4_84000.json', T1.DB4_84000_CORPUS],
  ['public/data/tier1/db5_buddhanexus.json', T1.DB5_BUDDHANEXUS_CORPUS],
  ['public/data/tier1/db6_sarit.json', T1.DB6_SARIT_CORPUS],
  ['public/data/tier23/db7_cudl_hidas.json', T23.DB7_CUDL_HIDAS_CORPUS],
  ['public/data/tier23/db8_polyglotta.json', T23.DB8_POLYGLOTTA_CORPUS],
  ['public/data/tier23/db9_rkts.json', T23.DB9_RKTS_CORPUS],
  ['public/data/tier23/db10_all_nibs.json', T23.DB10_ALL_NIBS_CORPUS],
  ['public/data/tier23/db11_idp_dunhuang.json', T23.DB11_IDP_DUNHUANG_CORPUS],
  ['public/data/tier23/db12_muktabodha_ochs.json', T23.DB12_MUKTABODHA_OCHS_CORPUS],
];

// Content arrays that must never be shortened in the bundle.
const CONTENT_KEYS = new Set([
  'records', 'mantras', 'extractedMantras', 'extractedMantrasIast', 'paragraphsIast',
  'verses', 'clauses', 'dharanis', 'manuscripts', 'witnesses', 'segments',
]);

function idOf(x: unknown): string | undefined {
  if (!x || typeof x !== 'object') return undefined;
  const o = x as Record<string, unknown>;
  for (const k of ['id', 'utId', 'recordId', 'fileName', 'filename', 'gretilFile', 'shelfmark']) {
    if (typeof o[k] === 'string') return o[k] as string;
  }
  return undefined;
}

function collect(json: unknown, ts: unknown, path: string, out: string[]): void {
  if (Array.isArray(json) && Array.isArray(ts)) {
    const key = path.split('.').pop()!.replace(/\[.*$/, '');
    if (CONTENT_KEYS.has(key) && ts.length > 0 && ts.length < json.length) {
      out.push(`${path}: ${ts.length} < ${json.length}`);
    }
    const byId = new Map(json.map((j) => [idOf(j), j]));
    ts.forEach((t, i) => {
      const id = idOf(t);
      const j = id !== undefined && byId.has(id) ? byId.get(id) : json[i];
      collect(j, t, `${path}[${id ?? i}]`, out);
    });
    return;
  }
  if (json && ts && typeof json === 'object' && typeof ts === 'object') {
    for (const k of Object.keys(ts as object)) {
      collect((json as Record<string, unknown>)[k], (ts as Record<string, unknown>)[k], `${path}.${k}`, out);
    }
  }
}

describe('TS corpus bundle is a lossless projection of the raw JSON databases', () => {
  for (const [file, ts] of PAIRS) {
    it(`${file} has no truncated content arrays`, () => {
      expect(ts, `missing export for ${file}`).toBeTruthy();
      const json = JSON.parse(fs.readFileSync(file, 'utf8'));
      const out: string[] = [];
      collect(json, ts, file, out);
      expect(out.slice(0, 20), `${out.length} truncated arrays`).toEqual([]);
    });
  }
});
