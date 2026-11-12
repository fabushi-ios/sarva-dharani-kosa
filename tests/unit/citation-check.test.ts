import { describe, it, expect, vi, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { CITATION_CHECK } from '../../src/data/kosa-generated/citationCheck';
import { citedCanonIds, parseCanonIds, cbetaXmlUrl } from '../../src/core/sources/citationCheck';
import { collectEntrySources } from '../../src/core/sources/entrySources';
import { entryHanQuery, hanUnits, locateSpan, stripShortHanAnnotations, HAN_GRAM } from '../../src/core/sources/textAlignment';
import { fetchAndParseCbetaXmlLive } from '../../src/services/cbeta/cbetaLiveService';
import {
  assembleCorpus,
  buildAll,
  curatedEntries,
  joinParagraphs,
  readCanonSources,
  unpackParagraphs,
} from '../../scripts/build-citation-check';
import { gretilVerseIast, isTransliteratedSiddham } from '../../src/core/sources/applyCuratedCanon';
import { CURATED_CANON } from '../../src/data/kosa-generated/curatedCanon';
import { applyCuratedCanon, splitInterlinearNotes } from '../../src/core/sources/applyCuratedCanon';

const ROOT = path.resolve(__dirname, '../..');

describe('code-rule citation check of hand-authored entries', () => {
  const entries = curatedEntries();

  it('generated citationCheck.ts and curatedCanon.ts are current (re-derived from the source texts)', () => {
    const { check, canon } = buildAll();
    expect(CITATION_CHECK).toEqual(JSON.parse(JSON.stringify(check)));
    expect(CURATED_CANON).toEqual(JSON.parse(JSON.stringify(canon)));
  }, 300_000);

  it('served Chinese / Sanskrit of hand-authored entries is the source text itself, contiguous and complete', () => {
    const src = readCanonSources();
    const corpus = assembleCorpus(src);
    const squash = (s: string) => s.replace(/\s+/g, '');
    let han = 0;
    for (const e of entries) {
      const c = CURATED_CANON[e.id];
      expect(c, e.id).toBeTruthy();
      const served = applyCuratedCanon(e);
      if (c.han) {
        han++;
        expect(c.han.verses).toHaveLength(e.verses.length);
        const source = squash(joinParagraphs(unpackParagraphs(src.paragraphs[c.han.sourceId])));
        // The verses, concatenated, are one contiguous passage of the source (nothing lost or added).
        expect(source.includes(squash(c.han.verses.join(''))), e.id).toBe(true);
        const hanText = (k: number) => splitInterlinearNotes(c.han!.verses[k]).text;
        expect(served.verses.map((v) => v.classicalTranslitZh)).toEqual(
          c.han.verses.map((_, k) => (hanText(k).trim() ? hanText(k) : e.verses[k].classicalTranslitZh))
        );
        // Syllables + notes together reproduce the source passage exactly.
        served.verses.forEach((v, k) => {
          if (!hanText(k).trim()) return;
          const han = (s: string) => (s.match(/\p{Script=Han}/gu) || []).join('');
          expect(han(v.classicalTranslitZh) + han(v.tangNoteZh && v.tangNoteZh !== e.verses[k].tangNoteZh ? v.tangNoteZh : '')).toBe(
            han(splitInterlinearNotes(c.han!.verses[k]).text) + han(splitInterlinearNotes(c.han!.verses[k]).notes.join(''))
          );
        });
        served.verses.forEach((v, k) =>
          expect(v.fieldSources?.classicalTranslitZh).toBe(hanText(k).trim() ? 'db-original' : 'derived-reference')
        );
        expect(served.taishoNo).toBe(c.han.sourceId);
        expect(CITATION_CHECK[e.id].cited.find((x) => x.id === c.han!.sourceId)?.inCbeta ?? true).toBe(true);
      } else {
        expect(served.verses.every((v) => v.fieldSources?.classicalTranslitZh === 'derived-reference'), e.id).toBe(true);
      }
      if (c.sanskrit) {
        expect(c.sanskrit.verses).toHaveLength(e.verses.length);
        const source = squash(corpus.sanskrit![c.sanskrit.file]);
        expect(source.includes(squash(c.sanskrit.verses.join(''))), e.id).toBe(true);
        served.verses.forEach((v, k) => {
          const src = gretilVerseIast(c.sanskrit!.verses[k]);
          if (src) {
            expect(v.iast, e.id).toBe(src);
            expect(v.fieldSources?.iast).toBe('db-original');
          } else {
            // the source passage has no wording for this verse: hand text kept, labelled non-DB
            expect(v.iast, e.id).toBe(e.verses[k].iast);
            expect(v.fieldSources?.iast).toBe(isTransliteratedSiddham(e.verses[k]) ? 'db-original' : 'derived-reference');
          }
        });
      } else {
        served.verses.forEach((v, k) =>
          expect(v.fieldSources?.iast, e.id).toBe(isTransliteratedSiddham(e.verses[k]) ? 'db-original' : 'derived-reference')
        );
      }
    }
    expect(han).toBeGreaterThan(0);
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
