import { describe, it, expect, vi, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { CITATION_CHECK } from '../../src/data/kosa-generated/citationCheck';
import { computeCitationCheck, citedCanonIds, parseCanonIds, cbetaXmlUrl } from '../../src/core/sources/citationCheck';
import { collectEntrySources } from '../../src/core/sources/entrySources';
import { entryHanQuery, hanUnits, locateSpan, stripShortHanAnnotations, HAN_GRAM } from '../../src/core/sources/textAlignment';
import { fetchAndParseCbetaXmlLive } from '../../src/services/cbeta/cbetaLiveService';
import { curatedEntries, loadCanonCorpus } from '../../scripts/build-citation-check';

const ROOT = path.resolve(__dirname, '../..');

describe('code-rule citation check of hand-authored entries', () => {
  const entries = curatedEntries();

  it('generated citationCheck.ts is current (re-derived from the CBETA texts)', () => {
    const fresh = computeCitationCheck(entries, loadCanonCorpus());
    expect(CITATION_CHECK).toEqual(JSON.parse(JSON.stringify(fresh)));
  }, 120_000);

  it('covers every hand-authored entry, and every cited canon number is checked', () => {
    for (const e of entries) {
      const rec = CITATION_CHECK[e.id];
      expect(rec, e.id).toBeTruthy();
      expect(rec.cited.map((c) => c.id)).toEqual(citedCanonIds(e));
    }
  });

  it('a cited number that CBETA lacks is never shown as a readable source', () => {
    for (const e of entries) {
      const rec = CITATION_CHECK[e.id];
      const sources = collectEntrySources(e);
      for (const c of rec.cited) {
        const s = sources.find((x) => x.id === c.id)!;
        expect(s.exists, `${e.id} ${c.id}`).toBe(c.inCbeta);
      }
      if (rec.status === 'located-elsewhere') {
        expect(sources[0].role, e.id).toBe('located');
        expect(sources[0].id).toBe(rec.best!.id);
      }
    }
  });

  it('parses canon numbers of any CBETA collection', () => {
    expect(parseCanonIds('T21n1286 / F28n1071, T19n0974B (X01n0001)')).toEqual([
      'T21n1286',
      'F28n1071',
      'T19n0974B',
      'X01n0001',
    ]);
    expect(cbetaXmlUrl('F28n1071')).toBe('https://raw.githubusercontent.com/cbeta-org/xml-p5/master/F/F28/F28n1071.xml');
  });
});

describe('原文全文: complete scripture body + located passage', () => {
  const xml = fs.readFileSync(path.join(ROOT, 'data/raw/cbeta/T08n0251.xml'), 'utf8');
  vi.stubGlobal('fetch', async () => new Response(xml, { status: 200 }));
  afterAll(() => vi.unstubAllGlobals());

  it('keeps the whole body (no truncation) and marks the dhāraṇī paragraph', async () => {
    const s = await fetchAndParseCbetaXmlLive('T08n0251', 'T08', 'local');
    const shown = s.fullParagraphs.map((p) => p.text).join('');
    const body = (xml.match(/<body>([\s\S]*)<\/body>/) || [, ''])[1]!;
    const bodyHan = body
      .replace(/<cb:mulu[\s\S]*?<\/cb:mulu>/g, '') // table-of-contents copy of the heading
      .replace(/<rdg[\s\S]*?<\/rdg>/g, '')
      .replace(/<note[\s\S]*?<\/note>/g, '')
      .replace(/<[^>]+>/g, '')
      .match(/\p{Script=Han}/gu)!.length;
    expect(shown.match(/\p{Script=Han}/gu)!.length).toBeGreaterThanOrEqual(bodyHan);
    expect(s.fullParagraphs.filter((p) => p.kind === 'dharani')).toHaveLength(1);
    expect(s.fullParagraphs.find((p) => p.kind === 'dharani')!.text).toContain('揭帝');
  });

  it('locates the 心經 entry inside its original body', async () => {
    const s = await fetchAndParseCbetaXmlLive('T08n0251', 'T08', 'local');
    const entry = curatedEntries().find((e) => citedCanonIds(e).includes('T08n0251'))!;
    const joined = s.fullParagraphs.map((p) => p.text).join('\n');
    const m = locateSpan(entryHanQuery(entry.verses), hanUnits(stripShortHanAnnotations(joined)), HAN_GRAM)!;
    expect(m.coverage).toBeGreaterThan(0.8);
    expect(joined.slice(m.start, m.end)).toContain('揭帝');
  });
});
