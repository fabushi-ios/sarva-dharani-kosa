/**
 * tests/unit/m2-tier1-databases.test.ts
 * Comprehensive Unit & Data-Integrity Test Suite for Milestone 2 (Category I Databases #1–#6, Features F3–F8)
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DB1_FANGSHAN_CORPUS,
  DB2_TAISHO_EXT_CORPUS,
  DB3_DSBC_GRETIL_CORPUS,
  DB4_84000_CORPUS,
  DB5_BUDDHANEXUS_CORPUS,
  DB6_SARIT_CORPUS,
  TIER1_DATABASES_BY_ID,
  TIER1_DATABASE_SUMMARIES,
} from '../../src/data/generated/tier1Databases';
import {
  getTier1CorpusById,
  getTier1DatabaseSummaries,
  inspectTier1Record,
  normalizeDiacritics,
  resolveBuddhaNexusDualId,
  searchTier1Databases,
} from '../../src/services/tier1CorpusService';

const PUBLIC_TIER1_DIR = path.resolve(process.cwd(), 'public', 'data', 'tier1');

describe('Milestone 2: Category I Direct Open-Source Structured Corpora (DBs #1–#6, Features F3–F8)', () => {
  describe('0. Global Tier 1 Summaries, JSON Artifacts & UTF-16 Surrogate Hygiene', () => {
    it('exports all 6 Tier 1 database summaries with priorityTier = 1 and numbers 1..6', () => {
      expect(TIER1_DATABASE_SUMMARIES).toHaveLength(6);
      expect(TIER1_DATABASE_SUMMARIES.map((s) => s.id)).toEqual([
        'db1_fangshan',
        'db2_taisho_ext',
        'db3_dsbc_gretil',
        'db4_84000',
        'db5_buddhanexus',
        'db6_sarit',
      ]);
      expect(TIER1_DATABASE_SUMMARIES.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6]);
      for (const s of TIER1_DATABASE_SUMMARIES) {
        expect(s.priorityTier).toBe(1);
        expect(s.totalRecordsCount).toBeGreaterThan(0);
        expect(s.mantraOrDharaniCount).toBeGreaterThan(0);
        expect(s.primarySourceUrls.length).toBeGreaterThan(0);
        expect(s.highlights.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('writes valid JSON artifacts for db1..db6 in public/data/tier1/ and has zero lone UTF-16 surrogates', () => {
      for (const dbId of Object.keys(TIER1_DATABASES_BY_ID)) {
        const jsonPath = path.join(PUBLIC_TIER1_DIR, `${dbId}.json`);
        expect(fs.existsSync(jsonPath)).toBe(true);
        const raw = fs.readFileSync(jsonPath, 'utf-8');
        expect(raw.length).toBeGreaterThan(1000);
        const parsed = JSON.parse(raw);
        expect(parsed.summary.id).toBe(dbId);
      }
      const tsRaw = fs.readFileSync(
        path.resolve(process.cwd(), 'src', 'data', 'generated', 'tier1Databases.ts'),
        'utf-8'
      );
      const loneSurrogateRe =
        /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
      expect(loneSurrogateRe.test(tsRaw)).toBe(false);
    });
  });

  describe('1. F3 (db1_fangshan): CBETA Fangshan Stone Canon Dhāraṇī Collection (F28n1071 + F24/F27 + F28n1072)', () => {
    it('verifies exact f28n1071Stats counts across all 30 rolls of F28n1071.xml', () => {
      expect(DB1_FANGSHAN_CORPUS.f28n1071Stats).toEqual({
        totalRolls: 30,
        totalDharaniBlocks: 730,
        totalTtBlocks: 8291,
        totalSdGlyphs: 8297,
        totalInlineNotes: 49095,
        erHeCount: 12529,
        sanHeCount: 248,
        yinCount: 15964,
        tanSheCount: 10,
      });
    });

    it('contains all 730 F28n1071 dhāraṇī records plus all 9 F24/F27 Tantric works and F28n1072 (741 total)', () => {
      expect(DB1_FANGSHAN_CORPUS.records).toHaveLength(741);
      const f1071Records = DB1_FANGSHAN_CORPUS.records.filter((r) => r.workId === 'F28n1071');
      expect(f1071Records).toHaveLength(730);

      const expectedWorks = [
        'F28n1071',
        'F24n0761',
        'F27n1048',
        'F27n1050',
        'F27n1056',
        'F27n1060',
        'F27n1061',
        'F27n1062',
        'F27n1063',
        'F27n1064',
        'F28n1072',
      ];
      for (const wid of expectedWorks) {
        expect(DB1_FANGSHAN_CORPUS.records.some((r) => r.workId === wid)).toBe(true);
      }
    });

    it('accurately tokenizes pF28p0038a0301 (金色寶光妙行成就如來陁羅尼) with #CB08859 -> 你, #CB00576 -> 𩕳, #SD-A5ED -> 𑖦𑖺/mo, and zero <lb/> leakage', () => {
      const p38 = DB1_FANGSHAN_CORPUS.records.find((r) => r.xmlId === 'pF28p0038a0301');
      expect(p38).toBeDefined();
      expect(p38!.dharaniTitle).toContain('金色寶光妙行成就如來');
      expect(p38!.plainChineseText).toContain('怛你也他');
      expect(p38!.plainChineseText).toContain('蘇悉第');
      expect(p38!.plainChineseText).toContain('謨左𩕳');

      const cb08859 = p38!.tokens.find((t) => t.cbGaijiRef === '#CB08859');
      expect(cb08859).toBeDefined();
      expect(cb08859!.textZh).toBe('你');

      const cb00576 = p38!.tokens.find((t) => t.cbGaijiRef === '#CB00576');
      expect(cb00576).toBeDefined();
      expect(cb00576!.textZh).toBe('𩕳');

      const sdA5ed = p38!.tokens.find((t) => t.siddhamRef === '#SD-A5ED');
      expect(sdA5ed).toBeDefined();
      expect(sdA5ed!.siddhamUnicode).toBe('𑖦𑖺');
      expect(sdA5ed!.iast).toBe('mo');
      expect(sdA5ed!.textZh).toBe('謨');

      // Zero <lb/> or <pb/> attribute leakage across all tokens
      const leakedTagTokens = DB1_FANGSHAN_CORPUS.records
        .flatMap((r) => r.tokens)
        .filter((t) => /^(?:lb|pb|ed=|n=)/.test(t.textZh));
      expect(leakedTagTokens).toHaveLength(0);
    });
  });

  describe('2. F4 (db2_taisho_ext): CBETA Taishō Siddhaṃ (T84), Lexicons (T54) & Ancient Dhāraṇīs (T08–T21)', () => {
    it('includes all 10 T54 lexicon works (T54n2128–T54n2136) with 3-way <cb:tt> in T54n2135', () => {
      const t54WorkIds = [
        'T54n2128',
        'T54n2129',
        'T54n2130',
        'T54n2131',
        'T54n2132',
        'T54n2133A',
        'T54n2133B',
        'T54n2134',
        'T54n2135',
        'T54n2136',
      ];
      for (const wid of t54WorkIds) {
        const entries = DB2_TAISHO_EXT_CORPUS.lexiconEntries.filter((e) => e.workId === wid);
        expect(entries.length).toBeGreaterThan(0);
      }

      const t2135 = DB2_TAISHO_EXT_CORPUS.lexiconEntries.filter((e) => e.workId === 'T54n2135');
      expect(t2135.some((e) => e.headwordZh && e.phoneticZh && e.siddhamUnicode && e.iast)).toBe(true);
    });

    it('includes all 11 T84 Siddhaṃ treatises (T84n2701–T84n2711 / KR6t0412–KR6t0422) and all 18 Siddhaṃ Chapters', () => {
      expect(DB2_TAISHO_EXT_CORPUS.siddhamTreatises).toHaveLength(11);
      expect(DB2_TAISHO_EXT_CORPUS.siddhamTreatises.map((t) => t.taishoId)).toEqual([
        'T84n2701',
        'T84n2702',
        'T84n2703',
        'T84n2704',
        'T84n2705',
        'T84n2706',
        'T84n2707',
        'T84n2708',
        'T84n2709',
        'T84n2710',
        'T84n2711',
      ]);
      expect(DB2_TAISHO_EXT_CORPUS.siddhamTreatises[0].bkkbooksRepoId).toBe('KR6t0412');
      expect(DB2_TAISHO_EXT_CORPUS.siddhamTreatises[0].excerptText).toContain('梵字悉曇字母并釋義');

      expect(DB2_TAISHO_EXT_CORPUS.siddhamRegistryStats).toEqual({
        totalChapters: 18,
        totalChapterCells: 6442,
        totalSyllables: 6874,
        totalGlyphs: 9066,
        totalScriptFaces: 43,
        totalCompositions: 26532,
      });
      expect(DB2_TAISHO_EXT_CORPUS.siddham18Chapters).toHaveLength(18);
      const totalCellsSum = DB2_TAISHO_EXT_CORPUS.siddham18Chapters.reduce((s, c) => s + c.totalCells, 0);
      expect(totalCellsSum).toBe(6442);
    });

    it('includes all 562 ancient dhāraṇī records across T21n1336 (278), T13n0397 (134), T16n0665, T09n0262, T10n0293 & T08n0250–0257', () => {
      expect(DB2_TAISHO_EXT_CORPUS.ancientDharanis).toHaveLength(562);
      const countByWork = (wid: string) =>
        DB2_TAISHO_EXT_CORPUS.ancientDharanis.filter((d) => d.workId === wid).length;
      expect(countByWork('T21n1336')).toBe(278);
      expect(countByWork('T13n0397')).toBe(134);
      expect(countByWork('T11n0310')).toBe(42);
      expect(countByWork('T16n0665')).toBe(38);
      expect(countByWork('T16n0664')).toBe(28);
      expect(countByWork('T13n0402')).toBe(25);
      expect(countByWork('T09n0262')).toBe(1);
      expect(countByWork('T10n0293')).toBe(1);

      const lotus = DB2_TAISHO_EXT_CORPUS.ancientDharanis.find((d) => d.workId === 'T09n0262');
      expect(lotus?.fanqieNotes?.length).toBe(14);
      expect(lotus?.ttAlignments?.length).toBeGreaterThan(0);

      const arapacana = DB2_TAISHO_EXT_CORPUS.ancientDharanis.find((d) => d.workId === 'T10n0293');
      expect(arapacana?.dharaniTitle).toContain('四十二字門');
      expect(arapacana?.dharaniTextZh).toContain('83');
    });
  });

  describe('3. F5 (db3_dsbc_gretil): Nepal DSBC & Full GRETIL Buddhist Expansion', () => {
    it('verifies dsbcCatalogStats (486 Romanized, 475 Devanāgarī, 15 list/4, 261 GRETIL files, 108 Stotras)', () => {
      expect(DB3_DSBC_GRETIL_CORPUS.dsbcCatalogStats).toEqual({
        romanizedBooksCount: 486,
        devanagariBooksCount: 475,
        dharaniListCount: 15,
        gretilTotalFilesCount: 261,
        stotra108Count: 108,
      });
    });

    it('contains 100 Dhāraṇī Saṃgraha sections (820/2949 IAST & 824/2953 Devanāgarī) with zero 406 error or PUA chars', () => {
      expect(DB3_DSBC_GRETIL_CORPUS.dharaniSamgrahaSections).toHaveLength(100);
      const sec1 = DB3_DSBC_GRETIL_CORPUS.dharaniSamgrahaSections[0];
      expect(sec1.titleIast.toLowerCase()).toContain('uṣṇīṣavijayā');
      expect(sec1.titleDevanagari).toContain('उष्णीषविजया');
      const fullJson = JSON.stringify(DB3_DSBC_GRETIL_CORPUS);
      expect(fullJson).not.toContain('406 Not Acceptable');
      expect(/[\uE000-\uF8FF]/.test(fullJson)).toBe(false);
    });

    it('contains all 15 DSBC list/4 dhāraṇī books (including 862/2990 Grahamātṛkā) and all 108 GRETIL stotras + 15 extra files', () => {
      expect(DB3_DSBC_GRETIL_CORPUS.dsbcBooks).toHaveLength(15);
      const graha = DB3_DSBC_GRETIL_CORPUS.dsbcBooks.find((b) => b.bookId === 862);
      expect(graha).toBeDefined();
      expect(graha!.titleIast).toContain('Grahamātṛkā');

      const stotras = DB3_DSBC_GRETIL_CORPUS.gretilExpandedRecords.filter((g) => g.filename === 'bst-108u.htm');
      expect(stotras).toHaveLength(108);
      expect(stotras[0].stotraNumber).toBe(1);
      expect(stotras[10].stotraNumber).toBe(11);
      expect(stotras[107].stotraNumber).toBe(108);
      expect(DB3_DSBC_GRETIL_CORPUS.gretilExpandedRecords.length).toBeGreaterThanOrEqual(123);
    });
  });

  describe('4. F6 (db4_84000): 84000 Open TEI, Multi-Tohoku IDs, Clean Mantras, TM Alignments & Trilingual Glossary', () => {
    it('supports multi-Tohoku IDs (toh507,883 and toh141,526,916) and Kangyur placeholder records', () => {
      const r507 = DB4_84000_CORPUS.records.find((r) => r.tohokuIds.includes('toh507'));
      expect(r507).toBeDefined();
      expect(r507!.tohokuIds).toContain('toh883');
      expect(r507!.titles.saLtn).toContain('Guhyadhātu');

      const r916 = DB4_84000_CORPUS.records.find((r) => r.tohokuIds.includes('toh916'));
      expect(r916).toBeDefined();
      expect(r916!.tohokuIds).toEqual(expect.arrayContaining(['toh141', 'toh526', 'toh916']));

      const placeholders = DB4_84000_CORPUS.records.filter((r) => r.isPlaceholder);
      expect(placeholders.length).toBeGreaterThanOrEqual(3);
    });

    it('guarantees zero <note>, <ref>, "In the Degé", "Translated from", or \\u00AD soft hyphens in mantra strings', () => {
      const rawJson = JSON.stringify(DB4_84000_CORPUS);
      expect(rawJson.includes('\u00AD')).toBe(false);

      for (const rec of DB4_84000_CORPUS.records) {
        for (const m of rec.mantras) {
          expect(m.sanskritIast).not.toMatch(/<note|<ref/i);
          expect(m.sanskritIast).not.toMatch(/In the Degé|Translated from/i);
        }
      }
    });

    it('contains trilingual glossary entries (adhiṣṭhāna / byin gyis brlabs / blessing) and TM alignments', () => {
      const adhi = DB4_84000_CORPUS.glossary.find((g) => g.sanskritIast.toLowerCase().includes('adhiṣṭhāna'));
      expect(adhi).toBeDefined();
      expect(adhi!.tibetanWylie).toContain('byin gyis brlabs');
      expect(adhi!.english.toLowerCase()).toContain('blessing');

      const r862 = DB4_84000_CORPUS.records.find((r) => r.tohokuIds.includes('toh862'));
      expect(r862?.tibetanAlignedLines?.length).toBeGreaterThan(0);
      expect(r862?.englishAlignedLines?.length).toBeGreaterThan(0);
    });
  });

  describe('5. F7 (db5_buddhanexus): BuddhaNexus Segmented Sanskrit & Live DharmaMitra API', () => {
    it('verifies K12n2949u (7,700 segments & >=113 samāpta colophons), catalogStats (3,548 texts), and sanitized titles', () => {
      expect(DB5_BUDDHANEXUS_CORPUS.catalogStats.dharmaMitraTotalSanskritTexts).toBe(3548);
      const k12n2949 = DB5_BUDDHANEXUS_CORPUS.records.find((r) => r.fileId === 'K12n2949u');
      expect(k12n2949).toBeDefined();
      expect(k12n2949!.dharmaMitraApiId).toBe('SA_K12_n2949u');
      expect(k12n2949!.totalSegments).toBe(7700);

      // Full JSON file has all 114 colophons
      const fullDb5 = JSON.parse(fs.readFileSync(path.join(PUBLIC_TIER1_DIR, 'db5_buddhanexus.json'), 'utf-8'));
      const fullK12 = fullDb5.records.find((r: { fileId: string }) => r.fileId === 'K12n2949u');
      expect(fullK12.colophonsExtracted.length).toBeGreaterThanOrEqual(113);

      // Check title hygiene on all records
      for (const r of DB5_BUDDHANEXUS_CORPUS.records) {
        expect(r.displayName).toBe(r.displayName.trim());
        expect(r.displayName.startsWith('Title: ')).toBe(false);
      }
    });

    it('resolves dual IDs (K12n2949u <-> SA_K12_n2949u, K12Xbsu017_u <-> SA_K12_bsu017_u) and includes Surūpā & Candrakīrti', () => {
      expect(resolveBuddhaNexusDualId('K12n2949u')).toEqual({
        staticFileId: 'K12n2949u',
        dharmaMitraApiId: 'SA_K12_n2949u',
      });
      expect(resolveBuddhaNexusDualId('SA_K12_bsu017_u')).toEqual({
        staticFileId: 'K12Xbsu017_u',
        dharmaMitraApiId: 'SA_K12_bsu017_u',
      });

      const surupa = DB5_BUDDHANEXUS_CORPUS.records.find((r) => r.fileId === 'SA_K12_Āgama_Surūpādhāraṇī');
      expect(surupa).toBeDefined();
      const candra = DB5_BUDDHANEXUS_CORPUS.records.find((r) =>
        r.fileId.includes('Candrakīrti_Pradīpoddyotana')
      );
      expect(candra).toBeDefined();
    });
  });

  describe('6. F8 (db6_sarit): SARIT Indology TEI-P5 Corpus (Caryāmelāpakapradīpa & 26 Buddhist/Tantric Works)', () => {
    it('extracts Chapter 3 (CMP03.001–CMP03.145+) with normalized compounds, critical apparatus sigla, and zero XML tag leakage', () => {
      const cmp = DB6_SARIT_CORPUS.records.find((r) => r.filename === 'caryamelapakapradipa.xml');
      expect(cmp).toBeDefined();
      expect(cmp!.featuredUnits.some((u) => u.unitId === 'CMP03.001')).toBe(true);
      expect(cmp!.featuredUnits.some((u) => u.unitId === 'CMP03.145')).toBe(true);

      const combinedText = JSON.stringify(cmp);
      expect(combinedText.toLowerCase()).toContain('vajrajāpa');
      expect(combinedText.toLowerCase()).toContain('mantratattva');
      expect(combinedText.toLowerCase()).toContain('vāgviveka');
      expect(combinedText.toLowerCase()).toContain('kāyavākcitta');
      expect(combinedText.toLowerCase()).toContain('oṃ āḥ hūṃ');
      expect(combinedText).toContain('4837');
      expect(combinedText).toContain('NAK');
      expect(combinedText).toContain('Toh 1803');

      const fullSaritStr = JSON.stringify(DB6_SARIT_CORPUS);
      expect(fullSaritStr).not.toMatch(/<locus|<pb\b|<del\b|<note\s+resp=/i);
    });

    it('includes all 26 secondary Buddhist & Tantric/Yoga TEI works in sa-Latn and sa-Deva encodings', () => {
      expect(DB6_SARIT_CORPUS.records.length).toBeGreaterThanOrEqual(27);
      const filenames = DB6_SARIT_CORPUS.records.map((r) => r.filename);
      expect(filenames).toEqual(
        expect.arrayContaining([
          'asvaghosa-buddhacarita.xml',
          'tattvasangrahapanjika.xml',
          'pramanavarttikavrtti.xml',
          'ratnasritika-dn.xml',
          'rasarnava.xml',
          'yogapradipa.xml',
        ])
      );
    });
  });

  describe('7. Tier 1 Corpus Service (tier1CorpusService.ts)', () => {
    it('supports getTier1DatabaseSummaries(), getTier1CorpusById(), inspectTier1Record(), and diacritic-insensitive searchTier1Databases()', () => {
      expect(getTier1DatabaseSummaries()).toHaveLength(6);
      expect(getTier1CorpusById(1)?.summary.id).toBe('db1_fangshan');
      expect(getTier1CorpusById('84000')?.summary.id).toBe('db4_84000');
      expect(getTier1CorpusById('unknown_db')).toBeNull();

      // Inspect DB #1 specific dhāraṇī
      const f1Inspect = inspectTier1Record('db1_fangshan', 'pF28p0038a0301');
      expect(f1Inspect?.matchedCount).toBe(1);

      // Inspect DB #2 T08n0256 alias handling
      const f2Inspect256 = inspectTier1Record('db2_taisho_ext', 'T08n0256');
      expect(f2Inspect256?.matchedCount).toBe(7);

      // Inspect DB #4 by multi-Tohoku ID
      const f4Inspect883 = inspectTier1Record('db4_84000', 'toh883');
      expect(f4Inspect883?.matchedCount).toBeGreaterThanOrEqual(1);

      // Inspect DB #5 by both static fileId and DharmaMitra API ID + graceful not_found
      const f5Static = inspectTier1Record('db5_buddhanexus', 'K12n2949u');
      const f5Api = inspectTier1Record('db5_buddhanexus', 'SA_K12_n2949u');
      expect(f5Static?.matchedCount).toBeGreaterThanOrEqual(1);
      expect(f5Api?.matchedCount).toBeGreaterThanOrEqual(1);
      const f5Missing = inspectTier1Record('db5_buddhanexus', 'NON_EXISTENT_ID_99999');
      expect(f5Missing?.status).toBe('not_found');
      expect(f5Missing?.matchedCount).toBe(0);

      // Diacritic-insensitive search across all 6 databases
      expect(normalizeDiacritics('Sitātapatrā Vajrajāpa Adhiṣṭhāna')).toBe('sitatapatra vajrajapa adhisthana');
      const sitaHits = searchTier1Databases('Sitatapatra');
      expect(sitaHits.length).toBeGreaterThan(0);
      const vajrajapaHits = searchTier1Databases('vajrajapa', { dbId: 'db6_sarit' });
      expect(vajrajapaHits.length).toBeGreaterThan(0);
      const adhisthanaHits = searchTier1Databases('adhisthana', { dbId: 'db4_84000' });
      expect(adhisthanaHits.length).toBeGreaterThan(0);
    });
  });
});
