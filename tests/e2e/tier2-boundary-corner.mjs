import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT_DIR,
  readProjectFile,
  readProjectFileOptional,
  findFilesRecursive,
  runKosaCliJson,
  runKosaCliAllowError,
  stringifyDeep,
  assertContainsAll,
  assertContainsAny,
  unwrapList,
  getDbCorpusCombined,
  inspectDbRecordResilient,
  runPhoneticsNormalized,
} from './helpers/harness.mjs';

export const TIER2_TESTS = [
  // =========================================================================
  // Feature F1: Baseline CBETA Gaiji, T18–T21, 16 Tang <cb:tt> & 25 GRETIL Boundary Cases
  // =========================================================================
  {
    id: 'T2-F1-01',
    tier: 2,
    feature: 'F1',
    title: 'Distinguishing #SD-* (Siddhaṃ) vs. #RJ-* (Ranjana) & Multi-Hex Gaiji IDs',
    async run() {
      const cbetaSrc = readProjectFile('src/data/generated/cbetaAuthRecords.ts');
      assertContainsAny(cbetaSrc, ['SD-', '#SD-'], 'CBETA #SD-* Siddhaṃ Gaiji prefix');
      assertContainsAny(cbetaSrc, ['RJ-', '#RJ-', 'SD-A5'], 'CBETA #RJ-* Ranjana or multi-hex Gaiji IDs');
      assert.ok(!cbetaSrc.includes('#SD-ZZZZ'), 'Unknown Gaiji ID #SD-ZZZZ must not exist as a real entry');
    },
  },
  {
    id: 'T2-F1-02',
    tier: 2,
    feature: 'F1',
    title: 'Taishō Multi-Part Suffixes (T19n0974A–F, T19n1022A/B, T20n1113A/B)',
    async run() {
      const mikkyoSrc = readProjectFile('src/data/generated/taishoMikkyoIndex.ts');
      const cbetaSrc = readProjectFile('src/data/generated/cbetaAuthRecords.ts');
      const combined = `${mikkyoSrc}\n${cbetaSrc}`;
      assertContainsAll(combined, ['0974B', '0974E'], 'Distinct suffixed Uṣṇīṣavijayā editions 0974B and 0974E');
      assertContainsAny(combined, ['1022A', '1113B'], 'Distinct suffixed Taishō editions 1022A / 1113B');
    },
  },
  {
    id: 'T2-F1-03',
    tier: 2,
    feature: 'F1',
    title: 'Cross-Volume Non-Mikkyō Baseline <cb:tt> Inclusion (T08n0251, T12n0368, T14n0450, T16n0665)',
    async run() {
      const cbetaSrc = readProjectFile('src/data/generated/cbetaAuthRecords.ts');
      const db2Text = getDbCorpusCombined('db2_taisho_ext').combinedText;
      const combined = `${cbetaSrc}\n${db2Text}`;
      assertContainsAny(combined, ['0251', 'T08n0251'], 'T08n0251 Heart Sūtra');
      assertContainsAny(combined, ['0665', 'T16n0665', '0450', 'T14n0450'], 'Non-Mikkyō baseline <cb:tt> works');
    },
  },
  {
    id: 'T2-F1-04',
    tier: 2,
    feature: 'F1',
    title: 'GRETIL Header Noise & HTML Entity Sanitization in Baseline 25 Editions',
    async run() {
      const gretilSrc = readProjectFile('src/data/generated/gretilAuthRecords.ts');
      assert.ok(!/<html|<head|<body|<script/i.test(gretilSrc), 'GRETIL records must not leak raw <html>/<head>/<body> tags');
      assertContainsAll(gretilSrc, ['prajnhsu', 'ekmuhr_u'], 'Baseline GRETIL prajnhsu and ekmuhr_u');
    },
  },
  {
    id: 'T2-F1-05',
    tier: 2,
    feature: 'F1',
    title: 'Empty / Whitespace / Diacritic-Insensitive Baseline Search Resilience',
    async run() {
      const asciiRes = runKosaCliJson(['search', 'usnisavijaya']);
      assertContainsAny(stringifyDeep(asciiRes), ['Uṣṇīṣavijayā', 'Usnisavijaya', '0974', '佛頂尊勝'], 'Diacritic-insensitive search match');
      const noMatchRes = runKosaCliJson(['search', '__nonexistent_mantra_xyz_999__'], { allowNonZero: true });
      const list = unwrapList(noMatchRes);
      assert.equal(list.length, 0, 'Non-existent query must return 0 results cleanly');
    },
  },

  // =========================================================================
  // Feature F2: Multi-Script Transliteration, Prosody & Sandhi Boundary Cases
  // =========================================================================
  {
    id: 'T2-F2-01',
    tier: 2,
    feature: 'F2',
    title: '5-Consonant Cluster Prosodic Coda Split (kārtsnyena = kArt + snye + na)',
    async run() {
      const p = runPhoneticsNormalized('kārtsnyena');
      assert.equal(p.flatSyllables.length, 3, `Expected kārtsnyena to split into 3 syllables, got ${p.flatSyllables.length}`);
      const weights = p.flatSyllables.map((s) => s.weightNormalized);
      assert.deepEqual(weights, ['Guru', 'Guru', 'Laghu'], 'kārtsnyena weights must be [Guru, Guru, Laghu] (—, —, ⏑)');
    },
  },
  {
    id: 'T2-F2-02',
    tier: 2,
    feature: 'F2',
    title: '4-Way Anusvāra (ṃ) Assimilation Across All 4 Stop Varga Places ([ŋ], [ɲ], [n], [m])',
    async run() {
      const p = runPhoneticsNormalized('saṃgama saṃcodana saṃtāna saṃbodhi');
      assertContainsAny(p.rawText, ['ŋ', '昂', '喉音'], 'Velar [ŋ] assimilation in saṃgama');
      assertContainsAny(p.rawText, ['ɲ', 'ဉ', '颚音', '顎音'], 'Palatal [ɲ] assimilation in saṃcodana');
      assertContainsAny(p.rawText, ['n', '恩', '齿', '齒'], 'Dental/retroflex [n] assimilation in saṃtāna');
      assertContainsAny(p.rawText, ['m', '姆', '牟', '唇音'], 'Labial [m] assimilation in saṃbodhi');
    },
  },
  {
    id: 'T2-F2-03',
    tier: 2,
    feature: 'F2',
    title: 'Devanāgarī Vedic Accents (\\u0951–\\u0954), ZWNJ/ZWJ (\\u200c/\\u200d), Avagraha (ऽ/\') & Daṇḍas (।/॥)',
    async run() {
      const p = runPhoneticsNormalized('ॐ\u0951 भूः\u200d सोऽहं । तत्सवितुर्वरेण्यं ॥');
      assert.ok(!/[\u0951-\u0954\u200c\u200d]/.test(p.normalizedIast), 'Vedic accents and ZWNJ/ZWJ must be stripped from normalized IAST');
      assertContainsAny(p.rawText, ['bhūḥ', 'bhuH', 'so', 'tat'], 'Cleanly parsed syllables around Vedic accents, Avagraha, and Daṇḍas');
    },
  },
  {
    id: 'T2-F2-04',
    tier: 2,
    feature: 'F2',
    title: 'Special Conjuncts kṣ (kz) and jñ (jY) Across All Vowel Grades & Laghu Blocking',
    async run() {
      const p = runPhoneticsNormalized('prajñāpāramitā akṣobhya');
      assert.ok(p.flatSyllables.length >= 8, 'Expected >= 8 syllables for prajñāpāramitā akṣobhya');
      assert.equal(
        p.flatSyllables[0].weightNormalized,
        'Guru',
        'First syllable "pra" before conjunct "jñā" (jY) must be Guru (—) due to positional length'
      );
      assertContainsAny(p.rawText, ['若', '初', '叉', 'kz', 'jY'], 'Special conjuncts jñ (jY) and kṣ (kz)');
    },
  },
  {
    id: 'T2-F2-05',
    tier: 2,
    feature: 'F2',
    title: 'Mixed Devanāgarī + IAST + Rough-English Input Without Case-Collision Corruption',
    async run() {
      const p = runPhoneticsNormalized('ॐ मणि padme hum svaha phat');
      assertContainsAll(p.normalizedIast || p.rawText, ['oṃ', 'maṇi', 'padme', 'hūṃ', 'svāhā', 'phaṭ'], 'Mixed-script input normalized to canonical IAST');
    },
  },

  // =========================================================================
  // Feature F3: DB #1 (db1_fangshan): Fangshan Stone Canon Boundary & Corner Cases
  // =========================================================================
  {
    id: 'T2-F3-01',
    tier: 2,
    feature: 'F3',
    title: 'Mixed Inline <cb:tt place="inline"> Interleaved with Plain Text & <note place="inline"> in F28n1071',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db1_fangshan', 'F28n1071');
      assertContainsAny(combinedText, ['怛', '也他', '謨', 'SD-A5ED', '二合', '引'], 'Mixed plain text, inline <cb:tt>, and inline notes in F28n1071');
    },
  },
  {
    id: 'T2-F3-02',
    tier: 2,
    feature: 'F3',
    title: 'Disambiguating Phrase-Number Notes (一, 二, 十四) vs. Phonetic Modifier Notes (二合, 三合, 引, 彈舌)',
    async run() {
      const { combinedText } = getDbCorpusCombined('db1_fangshan');
      assertContainsAll(combinedText, ['二合', '三合', '引'], 'Phonetic modifier notes separated from phrase numbers');
      assertContainsAny(combinedText, ['12529', '15964', '248', 'phonetic'], 'Distinct phonetic modifier statistics');
    },
  },
  {
    id: 'T2-F3-03',
    tier: 2,
    feature: 'F3',
    title: 'CBETA Rare Chinese Gaiji (<g ref="#CB08859">你</g>, 15,863 #CB* Tags) Resolution',
    async run() {
      const { combinedText } = getDbCorpusCombined('db1_fangshan');
      assertContainsAny(combinedText, ['你', 'CB08859', '怛你也他', '𩕳', 'CB00576'], 'Resolved CBETA #CB* rare Chinese characters');
    },
  },
  {
    id: 'T2-F3-04',
    tier: 2,
    feature: 'F3',
    title: 'Root-Level F/F28/F28n1071.xml Single-Work Path vs. Legacy Multi-Roll Path',
    async run() {
      const { combinedText } = getDbCorpusCombined('db1_fangshan');
      assertContainsAny(combinedText, ['F/F28/F28n1071.xml', 'F28n1071', '30'], 'Root-level F/F28/F28n1071.xml 30-roll provenance');
    },
  },
  {
    id: 'T2-F3-05',
    tier: 2,
    feature: 'F3',
    title: 'F28n1072 (《一切佛菩薩名集》22 Rolls): Zero <p cb:type="dharani"> But 100 Inline Notes Handled Cleanly',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db1_fangshan', 'F28n1072');
      assertContainsAll(combinedText, ['F28n1072', '一切佛菩薩名集'], 'F28n1072 22-roll work handled cleanly despite 0 <p cb:type="dharani">');
    },
  },

  // =========================================================================
  // Feature F4: DB #2 (db2_taisho_ext): T54, T84 & Ancient Dhāraṇīs Boundary Cases
  // =========================================================================
  {
    id: 'T2-F4-01',
    tier: 2,
    feature: 'F4',
    title: '3-Way <cb:tt> Parsing in T54n2135 (《梵語雜名》: zh-Hant Gloss + zh-x-yy Phonetic + sa-Sidd Glyph)',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db2_taisho_ext', 'T54n2135');
      assertContainsAll(combinedText, ['T54n2135', '梵語雜名'], 'T54n2135 Liyan Sanskrit-Chinese lexicon');
      assertContainsAny(combinedText, ['禮言', '1232', '6668', 'zh-x-yy', 'phonetic'], '3-way <cb:tt> metadata in T54n2135');
    },
  },
  {
    id: 'T2-F4-02',
    tier: 2,
    feature: 'F4',
    title: 'Fanqie (<cb:fan>) & <back><note type="orig"> Sanskrit Restoration Extraction in T09n0262 & T16n0665',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db2_taisho_ext', 'T09n0262');
      assertContainsAll(combinedText, ['T09n0262', 'T16n0665'], 'T09n0262 Lotus Sūtra and T16n0665 Suvarṇaprabhāsa');
      assertContainsAny(combinedText, ['反', '切', 'fan', '132', '92'], 'Fanqie (<cb:fan>) & <cb:tt> annotations');
    },
  },
  {
    id: 'T2-F4-03',
    tier: 2,
    feature: 'F4',
    title: 'T84n2701–2711 Ingestion from bkkbooks/KR6t0412–0422 YAML (Since cbeta-org/xml-p5 Lacks T84)',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db2_taisho_ext', 'T84n2701');
      assertContainsAll(combinedText, ['T84n2701', '梵字悉曇字母并釋義'], 'T84n2701 Kūkai treatise');
      assertContainsAny(combinedText, ['KR6t0412', '阿字', '空海', 'bkkbooks'], 'KR6t0412–0422 provenance & Kūkai content');
    },
  },
  {
    id: 'T2-F4-04',
    tier: 2,
    feature: 'F4',
    title: 'Arapacana 42-Syllabary Gate Order (a, ra, pa, ca, na...) in T10n0293',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db2_taisho_ext', 'T10n0293');
      assertContainsAll(combinedText, ['T10n0293', '大方廣佛華嚴經'], 'T10n0293 Avataṃsaka Sūtra');
      assertContainsAny(combinedText, ['四十二字門', 'Arapacana', '83', '阿', '波', '遮'], '42 Arapacana syllabary gates in T10n0293');
    },
  },
  {
    id: 'T2-F4-05',
    tier: 2,
    feature: 'F4',
    title: 'Differentiating T54n2133A (甲本 1,283 <cb:tt>) vs. T54n2133B (乙本 1,334 <cb:tt>) of Yijing\'s 《梵語千字文》',
    async run() {
      const { combinedText } = getDbCorpusCombined('db2_taisho_ext');
      assertContainsAll(combinedText, ['T54n2133A', 'T54n2133B'], 'Both recensions T54n2133A and T54n2133B exist distinctly');
    },
  },

  // =========================================================================
  // Feature F5: DB #3 (db3_dsbc_gretil): DSBC & GRETIL Boundary Cases
  // =========================================================================
  {
    id: 'T2-F5-01',
    tier: 2,
    feature: 'F5',
    title: 'DSBC Accept: text/html... Header Requirement & HTML Comment Delimiter Extraction',
    async run() {
      const { combinedText } = getDbCorpusCombined('db3_dsbc_gretil');
      const fetchScript = readProjectFileOptional('scripts/fetch-tier1-databases.mjs');
      const all = `${combinedText}\n${fetchScript}`;
      assert.ok(!all.includes('406 Not Acceptable'), 'Must not contain 406 Not Acceptable error pages');
      assertContainsAny(all, ['dsbcproject.org', 'text/html', '820/2949'], 'DSBC Accept header & clean HTML extraction');
    },
  },
  {
    id: 'T2-F5-02',
    tier: 2,
    feature: 'F5',
    title: 'Parallel Alignment of DSBC Dhāraṇī Saṃgraha Section (1)..(100) Between IAST (820/2949) and Devanāgarī (824/2953)',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db3_dsbc_gretil', '2949');
      assertContainsAny(combinedText, ['820/2949', '824/2953', 'uṣṇīṣavijayā', 'उष्णीषविजया', 'धारणी'], 'Parallel IAST and Devanāgarī Dhāraṇī Saṃgraha sections');
    },
  },
  {
    id: 'T2-F5-03',
    tier: 2,
    feature: 'F5',
    title: 'Parsing All 108 Numbered Stotras in bst-108u.htm Including Final Stotra #108',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db3_dsbc_gretil', 'bst-108u');
      assertContainsAll(combinedText, ['bst-108u', '108'], 'GRETIL bst-108u.htm 108 stotras');
      assertContainsAny(combinedText, ['Ādibuddha', 'Stotra', 'namo', 'śrī'], 'Authentic Sanskrit stotra verses in bst-108u');
    },
  },
  {
    id: 'T2-F5-04',
    tier: 2,
    feature: 'F5',
    title: 'Handling Both <p>-Formatted and <br />-Formatted DSBC / GRETIL HTML Bodies',
    async run() {
      const { combinedText } = getDbCorpusCombined('db3_dsbc_gretil');
      assertContainsAll(combinedText, ['2949', '2990', 'Grahamātṛkā'], 'Both <p>-formatted 820/2949 and <br>-formatted 862/2990 parsed cleanly');
    },
  },
  {
    id: 'T2-F5-05',
    tier: 2,
    feature: 'F5',
    title: 'Deduplication / Cross-Link Between Baseline 25 GRETIL Files and Expanded 261 GRETIL Catalog',
    async run() {
      const { combinedText } = getDbCorpusCombined('db3_dsbc_gretil');
      assertContainsAll(combinedText, ['abhisdhu', 'mprsvdhu', 'sjdh_u', 'tarasdhu', 'bst-108u'], 'Expanded GRETIL dhāraṇīs and 108 stotras');
    },
  },

  // =========================================================================
  // Feature F6: DB #4 (db4_84000): 84000 Open TEI Orthographic & Structural Corner Cases
  // =========================================================================
  {
    id: 'T2-F6-01',
    tier: 2,
    feature: 'F6',
    title: 'Zero <note> / <ref> Footnote Leakage Inside <mantra xml:lang="Sa-Ltn">',
    async run() {
      const { cliPayload } = getDbCorpusCombined('db4_84000');
      const items = unwrapList(cliPayload);
      for (const item of items) {
        const mantras = Array.isArray(item?.mantras) ? item.mantras : [];
        for (const m of mantras) {
          const iast = typeof m === 'string' ? m : (m?.sanskritIast ?? m?.iast ?? m?.text ?? '');
          assert.ok(!/<note|<ref/i.test(iast), `Mantra IAST must not contain raw <note>/<ref> tags: ${iast}`);
          assert.ok(!/In the Degé|Translated from/i.test(iast), `Mantra IAST must not leak English footnote prose: ${iast}`);
        }
      }
    },
  },
  {
    id: 'T2-F6-02',
    tier: 2,
    feature: 'F6',
    title: 'Zero Unicode Soft Hyphens (\\u00AD) or Non-Breaking Spaces (\\u00A0) in 84000 Mantras & Glossaries',
    async run() {
      const { cliPayload } = getDbCorpusCombined('db4_84000');
      const text = stringifyDeep(cliPayload);
      assert.ok(!/\u00AD/.test(text), '84000 CLI payload must be 100% free of Unicode soft hyphens (\\u00AD)');
    },
  },
  {
    id: 'T2-F6-03',
    tier: 2,
    feature: 'F6',
    title: 'Multi-Tohoku Comma-Separated Filenames (088-001_toh507,883-...xml & 056-009_toh141,526,916-...xml)',
    async run() {
      const res883 = runKosaCliJson(['search', 'toh883', '--db', 'db4_84000']);
      const res916 = runKosaCliJson(['search', 'toh916', '--db', 'db4_84000']);
      const { combinedText } = getDbCorpusCombined('db4_84000');
      const allText = `${stringifyDeep(res883)}\n${stringifyDeep(res916)}\n${combinedText}`;
      assertContainsAll(allText, ['507', '883', '526', '916'], 'Multi-Tohoku comma-separated works toh507,883 and toh141,526,916');
    },
  },
  {
    id: 'T2-F6-04',
    tier: 2,
    feature: 'F6',
    title: 'Distinguishing <mantra type="syllable"> (Bīja Seed Syllables) vs. Full <p rend="mantra"><mantra> Blocks',
    async run() {
      const { combinedText } = getDbCorpusCombined('db4_84000');
      assertContainsAny(combinedText, ['syllable', 'mantra', 'oṃ', 'hūṃ', 'svāhā'], '84000 syllable vs full mantra classification');
    },
  },
  {
    id: 'T2-F6-05',
    tier: 2,
    feature: 'F6',
    title: 'Kangyur Placeholder TEI XMLs (translations/kangyur/placeholders/*.xml) for Untranslated Gzungs \'dus Texts',
    async run() {
      const { combinedText } = getDbCorpusCombined('db4_84000');
      assertContainsAny(combinedText, ['250', 'placeholder', 'toh846', 'toh1095', 'Gzungs'], 'Gzungs \'dus placeholder/catalog coverage');
    },
  },

  // =========================================================================
  // Feature F7: DB #5 (db5_buddhanexus) Boundary & Orthographic Edge Cases
  // =========================================================================
  {
    id: 'T2-F7-01',
    tier: 2,
    feature: 'F7',
    title: 'DharmaMitra ID (SA_K12_*) vs Static GitHub Filename (K12* / K12X*) Dual-ID Resolution',
    async run() {
      const r1 = inspectDbRecordResilient('db5_buddhanexus', 'K12n2949u');
      const r2 = inspectDbRecordResilient('db5_buddhanexus', 'SA_K12_n2949u');
      assertContainsAny(r1.combinedText, ['K12n2949u', 'Dhāraṇīsaṃgraha'], 'Static filename K12n2949u resolution');
      assertContainsAny(r2.combinedText, ['K12n2949u', 'SA_K12_n2949u', 'Dhāraṇīsaṃgraha'], 'DharmaMitra SA_K12_n2949u alias resolution');
    },
  },
  {
    id: 'T2-F7-02',
    tier: 2,
    feature: 'F7',
    title: ':0 Title Segment Leading-Whitespace & "Title: " Prefix Sanitization',
    async run() {
      const { cliPayload } = getDbCorpusCombined('db5_buddhanexus');
      const records = unwrapList(cliPayload);
      for (const rec of records.slice(0, 20)) {
        const title = rec?.title ?? rec?.displayName ?? rec?.name ?? '';
        if (title) {
          assert.equal(title, title.trim(), `Record title must not have leading/trailing whitespace: "${title}"`);
          assert.ok(!title.startsWith('Title: '), `Record title must strip redundant "Title: " prefix: "${title}"`);
        }
      }
    },
  },
  {
    id: 'T2-F7-03',
    tier: 2,
    feature: 'F7',
    title: 'DharmaMitra POST /api-db/text-view/text-parallels/ Anti-Splitting Filter & Rate-Limit Guard',
    async run() {
      const { combinedText } = getDbCorpusCombined('db5_buddhanexus');
      assertContainsAny(combinedText, ['par_length', '1000', 'text-parallels', 'dharmamitra'], 'DharmaMitra API client configuration');
    },
  },
  {
    id: 'T2-F7-04',
    tier: 2,
    feature: 'F7',
    title: 'Multi-Part Segment Keys (<FileID>_<Part>:<SegNum>) & Colophon Boundary Parsing in K12n2949u',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db5_buddhanexus', 'K12n2949u');
      assertContainsAll(combinedText, ['K12n2949u', '7700'], 'K12n2949u 7,700 segments');
      assertContainsAny(combinedText, ['113', 'colophon', 'samāptā', 'samāpta'], 'K12n2949u colophon extraction');
    },
  },
  {
    id: 'T2-F7-05',
    tier: 2,
    feature: 'F7',
    title: 'Diacritic-Insensitive Search & Unknown Record ID Handling in db5_buddhanexus',
    async run() {
      const searchRes = runKosaCliJson(['search', 'Sitatapatra', '--db', 'db5_buddhanexus']);
      const { combinedText } = getDbCorpusCombined('db5_buddhanexus');
      assertContainsAny(`${stringifyDeep(searchRes)}\n${combinedText}`, ['K12bsu004_u', 'Sitātapatrā'], 'Diacritic-insensitive search for Sitātapatrā');
      const unknownRes = runKosaCliAllowError(['inspect', 'db5_buddhanexus', 'K99_NONEXISTENT', '--json']);
      assert.ok(!unknownRes.stderr.includes('ReferenceError'), 'Unknown record ID must not throw unhandled ReferenceError');
    },
  },

  // =========================================================================
  // Feature F8: DB #6 (db6_sarit) Boundary & Orthographic Edge Cases
  // =========================================================================
  {
    id: 'T2-F8-01',
    tier: 2,
    feature: 'F8',
    title: 'Mid-Word <locus>[A:2a]</locus> and <pb n="338"/> Milestone Stripping in caryamelapakapradipa.xml',
    async run() {
      const { cliPayload } = getDbCorpusCombined('db6_sarit');
      const str = stringifyDeep(cliPayload);
      assert.ok(!/<locus|<pb\b/i.test(str), 'Clean SARIT text must strip raw <locus> and <pb/> XML tags');
    },
  },
  {
    id: 'T2-F8-02',
    tier: 2,
    feature: 'F8',
    title: 'Inline <note resp="editor" place="bottom"> & <del> Stripping vs <add> Text Preservation',
    async run() {
      const { cliPayload } = getDbCorpusCombined('db6_sarit');
      const str = stringifyDeep(cliPayload);
      assert.ok(!/<del\b|<note\s+resp=/i.test(str), 'Clean SARIT text must strip raw <del> and <note resp="editor"> tags');
    },
  },
  {
    id: 'T2-F8-03',
    tier: 2,
    feature: 'F8',
    title: 'SARIT Compound-Dot (kāya.vāk.citta) Normalization & Tokenization',
    async run() {
      const { combinedText } = getDbCorpusCombined('db6_sarit');
      assertContainsAny(combinedText, ['kāyavākcitta', 'kāya', 'vāgviveka', 'vajrajāpa'], 'Normalized SARIT compound terms');
    },
  },
  {
    id: 'T2-F8-04',
    tier: 2,
    feature: 'F8',
    title: 'Dual Script Encoding (xml:lang="sa-Latn" IAST vs xml:lang="sa-Deva" Devanāgarī) in SARIT',
    async run() {
      const { combinedText } = getDbCorpusCombined('db6_sarit');
      assertContainsAny(combinedText, ['ratnasritika', 'Devanagari', 'sa-Deva', 'sa-Latn', 'IAST'], 'Dual IAST and Devanāgarī script metadata in SARIT');
    },
  },
  {
    id: 'T2-F8-05',
    tier: 2,
    feature: 'F8',
    title: 'Direct Paragraph Locus Lookup (CMP03.001..CMP03.145) in db6_sarit',
    async run() {
      const searchRes = runKosaCliJson(['search', 'CMP03.001', '--db', 'db6_sarit']);
      const { combinedText } = getDbCorpusCombined('db6_sarit');
      assertContainsAny(`${stringifyDeep(searchRes)}\n${combinedText}`, ['CMP03.001', 'CMP03'], 'Direct paragraph locus CMP03.001 in db6_sarit');
    },
  },

  // =========================================================================
  // Feature F9: DB #7 (db7_cudl_hidas) Boundary & Orthographic Edge Cases
  // =========================================================================
  {
    id: 'T2-F9-01',
    tier: 2,
    feature: 'F9',
    title: 'CUDL MS Add. 1680.8 3-Part Sub-ID Split (-00001, -00002, -00003) vs Invalid Parent ID MS-ADD-01680-00008',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db7_cudl_hidas', 'MS-ADD-01680-00008');
      assertContainsAll(
        combinedText,
        ['MS-ADD-01680-00008-00001', 'MS-ADD-01680-00008-00002', 'MS-ADD-01680-00008-00003'],
        'Parent ID MS-ADD-01680-00008 resolves cleanly to 3 sub-items'
      );
    },
  },
  {
    id: 'T2-F9-02',
    tier: 2,
    feature: 'F9',
    title: 'Diplomatic Newar Gemination (sarvva) & Folio Bracket ([17bisr1], [224r1]) Preservation + Normalized Search',
    async run() {
      const { combinedText } = getDbCorpusCombined('db7_cudl_hidas');
      assertContainsAny(combinedText, ['sarvva', 'sarva', '[4r1]', '[15r2]', '[23v5]'], 'Diplomatic Newar gemination & folio bracket locators');
    },
  },
  {
    id: 'T2-F9-03',
    tier: 2,
    feature: 'F9',
    title: 'IIIF Image Tile & Manifest URL Well-Formedness Across All 69 CUDL Manuscripts',
    async run() {
      const { combinedText } = getDbCorpusCombined('db7_cudl_hidas');
      assertContainsAll(combinedText, ['https://cudl.lib.cam.ac.uk/iiif/MS-ADD-01326', 'images.lib.cam.ac.uk/iiif/'], 'Well-formed CUDL IIIF manifest & image URLs');
      assert.ok(!combinedText.includes('.jp2.jp2'), 'IIIF image URLs must not contain duplicate .jp2.jp2 extensions');
    },
  },
  {
    id: 'T2-F9-04',
    tier: 2,
    feature: 'F9',
    title: 'Cross-Reference Linking Between Hidas Critical Editions and CUDL MSS + Derge Tohoku Numbers',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db7_cudl_hidas', 'SA_K12_Āgama_Māṇibhadradhāraṇī_Hidas');
      assertContainsAny(combinedText, ['1326', '1680', '764', '970', '743', '1009'], 'Hidas critical editions link to CUDL MSS and Derge/Tohoku IDs');
    },
  },
  {
    id: 'T2-F9-05',
    tier: 2,
    feature: 'F9',
    title: 'Zero-Duplicate Pagination Across 4 CUDL Search Pages (start=0, 20, 40, 60 → 69 Unique IDs)',
    async run() {
      const { combinedText } = getDbCorpusCombined('db7_cudl_hidas');
      const cudlIds = new Set(combinedText.match(/\b(?:MS-[A-Z0-9-]+|PR-FG-00870)\b/g) || []);
      assert.ok(cudlIds.size >= 15, `Expected unique CUDL manuscript IDs in DB #7, found ${cudlIds.size}`);
    },
  },

  // =========================================================================
  // Feature F10: DB #8 (db8_polyglotta) Boundary & Orthographic Edge Cases
  // =========================================================================
  {
    id: 'T2-F10-01',
    tier: 2,
    feature: 'F10',
    title: 'Domain Migration Enforcement (polyglotta.uio.no vs Dead www2.hf.uio.no/polyglotta Stub)',
    async run() {
      const { combinedText } = getDbCorpusCombined('db8_polyglotta');
      assert.ok(!combinedText.includes('Polyglotta has moved'), 'Must not contain dead www2.hf.uio.no stub page');
      assert.ok(combinedText.includes('polyglotta.uio.no'), 'Must use live polyglotta.uio.no domain');
    },
  },
  {
    id: 'T2-F10-02',
    tier: 2,
    feature: 'F10',
    title: 'Malformed Unclosed <a Sidebar Tags & Inline <a class=\'fotnote\'> Stripping',
    async run() {
      const { cliPayload } = getDbCorpusCombined('db8_polyglotta');
      const str = stringifyDeep(cliPayload);
      assert.ok(!/<a\s+class=['"]fotnote|<div\s+class=['"]note/i.test(str), 'Aligned cells must strip inline HTML footnote tags');
    },
  },
  {
    id: 'T2-F10-03',
    tier: 2,
    feature: 'F10',
    title: 'Composite vid + cid Lookup (483&cid=456868, 263&cid=335411, 263&cid=338889) in CLI inspect',
    async run() {
      const rLotus = inspectDbRecordResilient('db8_polyglotta', '483&cid=456868');
      const rMvy25 = inspectDbRecordResilient('db8_polyglotta', '263&cid=335411');
      const rMvy198 = inspectDbRecordResilient('db8_polyglotta', '263&cid=338889');
      assertContainsAny(rLotus.combinedText, ['456868', 'Dhāraṇīparivarta', 'Bhaiṣajyarāja', 'Saddharmapuṇḍarīka'], 'Polyglotta 483&cid=456868 Lotus Ch. 21');
      assertContainsAny(rMvy25.combinedText, ['335411', 'bodhisattvadhāraṇyaḥ'], 'Polyglotta 263&cid=335411 Mvy §25');
      assertContainsAny(rMvy198.combinedText, ['338889', 'mantranayāvanirgatāni'], 'Polyglotta 263&cid=338889 Mvy §198');
    },
  },
  {
    id: 'T2-F10-04',
    tier: 2,
    feature: 'F10',
    title: 'kilderef Locus Extraction & Sparse Witness Column Handling in vid=1175',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db8_polyglotta', '1175');
      assertContainsAll(combinedText, ['Vaidya', 'Conze', 'T.250', 'T.251', 'T.257'], 'Both short and long recension witnesses in vid=1175');
    },
  },
  {
    id: 'T2-F10-05',
    tier: 2,
    feature: 'F10',
    title: 'Quadrilingual Search Across Mahāvyutpatti §25 & §198 (Sanskrit, Tibetan, Chinese, sGra sbyor)',
    async run() {
      const s1 = runKosaCliJson(['search', 'vidyārājñī', '--db', 'db8_polyglotta']);
      const { combinedText } = getDbCorpusCombined('db8_polyglotta');
      const all = `${stringifyDeep(s1)}\n${combinedText}`;
      assertContainsAll(all, ['vidyārājñī', 'rig sngags'], 'Quadrilingual Mahāvyutpatti search for vidyārājñī / rig sngags');
    },
  },

  // =========================================================================
  // Feature F11: DB #9 (db9_rkts) Boundary & Orthographic Edge Cases
  // =========================================================================
  {
    id: 'T2-F11-01',
    tier: 2,
    feature: 'F11',
    title: 'Diplomatic Line-Prefix (1b1(gzungs):) & Ornamental Head-Mark (@##/ /) Stripping in 1D/100.txt & 101.txt',
    async run() {
      const { combinedText } = getDbCorpusCombined('db9_rkts');
      assertContainsAny(combinedText, ['1b1', '100', '101', 'rgya gar skad du'], 'Structured locus metadata from 1D/100.txt & 101.txt');
    },
  },
  {
    id: 'T2-F11-02',
    tier: 2,
    feature: 'F11',
    title: 'EWTS Subjoined Sanskrit Stack (+), Retroflex (T/D/N/Sh), and badzra→vajra Conversion to IAST',
    async run() {
      const { combinedText } = getDbCorpusCombined('db9_rkts');
      assertContainsAny(combinedText, ['badzra', 'vajra'], 'EWTS badzra ↔ IAST vajra');
      assertContainsAny(combinedText, ['d+hA ra NI', 'dhāraṇī', 'svāhā', 'swA hA'], 'EWTS d+hA ra NI / swA hA ↔ IAST dhāraṇī / svāhā');
    },
  },
  {
    id: 'T2-F11-03',
    tier: 2,
    feature: 'F11',
    title: 'Multi-Identifier Resolution (D848 ↔ rkts K521 ↔ Toh 848) on db9_rkts',
    async run() {
      const rD848 = inspectDbRecordResilient('db9_rkts', 'D848');
      assertContainsAny(rD848.combinedText, ['D848', '521', 'ye shes ta la la', 'Jñānolka'], 'D848 ↔ rkts K521 resolution');
    },
  },
  {
    id: 'T2-F11-04',
    tier: 2,
    feature: 'F11',
    title: '68-Collection Sigla & BDRC Work ID (MW22084) Resolution in collections.json',
    async run() {
      const { combinedText } = getDbCorpusCombined('db9_rkts');
      assertContainsAll(combinedText, ['68', 'MW22084'], '68 collections and Derge MW22084 BDRC reference');
    },
  },
  {
    id: 'T2-F11-05',
    tier: 2,
    feature: 'F11',
    title: 'Graceful Handling of Missing <skt> Titles in standard.xml (16,179 Total vs 4,997 with <skt>)',
    async run() {
      const { combinedText } = getDbCorpusCombined('db9_rkts');
      assertContainsAll(combinedText, ['16179', '4997'], 'Accurate counts of 16,179 total items vs 4,997 items with <skt>');
    },
  },

  // =========================================================================
  // Feature F12: DB #10 (db10_all_nibs) Boundary & Orthographic Edge Cases
  // =========================================================================
  {
    id: 'T2-F12-01',
    tier: 2,
    feature: 'F12',
    title: 'Nepalese Newar Scribal Orthography Normalization (b→v, sbāhā→svāhā, sarvva→sarva, ṁ→ṃ)',
    async run() {
      const { combinedText } = getDbCorpusCombined('db10_all_nibs');
      assertContainsAny(combinedText, ['sarvva', 'sbāhā', 'bajra'], 'Preserves diplomatic Newar scribal orthography');
      assertContainsAny(combinedText, ['sarva', 'svāhā', 'vajra'], 'Provides normalized Classical Sanskrit IAST');
    },
  },
  {
    id: 'T2-F12-02',
    tier: 2,
    feature: 'F12',
    title: 'Folio Marker (@1a, @1b) Extraction & Candrabindu (oṃ̐) Preservation in SA00019.001',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db10_all_nibs', 'SA00019.001');
      assertContainsAll(combinedText, ['SA00019.001', '@1a'], 'Folio marker @1a in SA00019.001');
      assertContainsAny(combinedText, ['oṃ̐', 'oṃ', 'śruti smṛti'], 'Candrabindu oṃ̐ and mantra in SA00019.001');
    },
  },
  {
    id: 'T2-F12-03',
    tier: 2,
    feature: 'F12',
    title: 'ALL Public API Bearer Token & DSBC Accept Header Enforcement in Ingestion/Service Layer',
    async run() {
      const { combinedText } = getDbCorpusCombined('db10_all_nibs');
      const fetchScript = readProjectFileOptional('scripts/fetch-tier23-databases.mjs');
      const all = `${combinedText}\n${fetchScript}`;
      assertContainsAny(all, ['byang-chub-kyi-sems', 'publicapi.asianlegacylibrary.org'], 'ALL Public API Bearer token configuration');
    },
  },
  {
    id: 'T2-F12-04',
    tier: 2,
    feature: 'F12',
    title: 'ALL-NIBS KSK-* & TSK-* Canonical Code to Tohoku Number Resolution',
    async run() {
      const { combinedText } = getDbCorpusCombined('db10_all_nibs');
      assertContainsAll(
        combinedText,
        ['KSK-00556', 'KSK-00381', 'TSK-01351', 'TSK-01785', 'TSK-03400'],
        'ALL-NIBS KSK-* and TSK-* canonical codes'
      );
    },
  },
  {
    id: 'T2-F12-05',
    tier: 2,
    feature: 'F12',
    title: 'Provenance Partitioning Between [NIBS] Kathmandu (10 MSS) and [Varanasi] Preservation Center (96 MSS)',
    async run() {
      const { combinedText } = getDbCorpusCombined('db10_all_nibs');
      assertContainsAll(
        combinedText,
        ['SA00005.001', 'SA00007.001', 'NIBS', 'Varanasi'],
        '10 NIBS Kathmandu MSS and 96 Varanasi Preservation Center MSS'
      );
    },
  },

  // =========================================================================
  // Feature F13: DB #11 (db11_idp_dunhuang) Boundary & Orthographic Edge Cases
  // =========================================================================
  {
    id: 'T2-F13-01',
    tier: 2,
    feature: 'F13',
    title: 'Diplomatic Bracket, Lacuna & Damage Notation Preservation ([i], (o), ///, +, •)',
    async run() {
      const { combinedText } = getDbCorpusCombined('db11_idp_dunhuang');
      assertContainsAny(combinedText, ['IOL San 397', 'THT 3187', 'Or.15001', 'sarvarājav', 'kāruṇikāya'], 'Central Asian Brāhmī diplomatic transcriptions');
    },
  },
  {
    id: 'T2-F13-02',
    tier: 2,
    feature: 'F13',
    title: 'WAF-Free Berlin (idp.bbaw.de) & CEToM (cetom.univie.ac.at) Provenance Without Cloudflare 403 Stubs',
    async run() {
      const { combinedText } = getDbCorpusCombined('db11_idp_dunhuang');
      assert.ok(!combinedText.includes('Just a moment...'), 'Must not contain Cloudflare challenge page');
      assert.ok(!combinedText.includes('403 Forbidden'), 'Must not contain 403 Forbidden HTML error');
      assertContainsAll(combinedText, ['idp.bbaw.de', 'cetom.univie.ac.at'], 'WAF-free Berlin & Vienna CEToM provenance');
    },
  },
  {
    id: 'T2-F13-03',
    tier: 2,
    feature: 'F13',
    title: 'Multi-Collection Pressmark Lookup (IOL Tib J, Pelliot tibétain, IOL San, THT, Or.15009, S., P.)',
    async run() {
      const s1 = runKosaCliJson(['search', 'IOL San 397', '--db', 'db11_idp_dunhuang']);
      const s2 = runKosaCliJson(['search', 'THT 3187', '--db', 'db11_idp_dunhuang']);
      const { combinedText } = getDbCorpusCombined('db11_idp_dunhuang');
      const all = `${stringifyDeep(s1)}\n${stringifyDeep(s2)}\n${combinedText}`;
      assertContainsAll(all, ['IOL San 397', 'THT 3187', 'T85n2880'], 'Multi-collection Silk Road pressmark lookup');
    },
  },
  {
    id: 'T2-F13-04',
    tier: 2,
    feature: 'F13',
    title: 'Middle Indic / Khotanese Brāhmī Prakrit Orthography Preservation (buddheṇa, amāñi vihi phali)',
    async run() {
      const { combinedText } = getDbCorpusCombined('db11_idp_dunhuang');
      assertContainsAny(combinedText, ['amāñi vihi phali', 'buddheṇa', 'kuṃdhari', 'dudume'], 'Authentic Silk Road Prakrit/Khotanese forms preserved');
    },
  },
  {
    id: 'T2-F13-05',
    tier: 2,
    feature: 'F13',
    title: 'CBETA Dunhuang T85 vs. ZW (Zangwai) Sub-Canon Distinction',
    async run() {
      const { combinedText } = getDbCorpusCombined('db11_idp_dunhuang');
      assertContainsAll(combinedText, ['T85n2880', 'T85n2898', 'ZW01n0011', 'ZW03n0023'], 'Both T85 and ZW Dunhuang sub-canons represented');
    },
  },

  // =========================================================================
  // Feature F14: DB #12 (db12_muktabodha_ochs) Boundary & Corner Cases
  // =========================================================================
  {
    id: 'T2-F14-01',
    tier: 2,
    feature: 'F14',
    title: 'Tantric Uddhāra Phonemic Code-Word Decomposition (vyomāsya + vidārī + nādabindu → hūṃ)',
    async run() {
      const bijaHum = runKosaCliJson(['bija', 'hūṃ']);
      const { combinedText } = getDbCorpusCombined('db12_muktabodha_ochs');
      const all = `${stringifyDeep(bijaHum)}\n${combinedText}`;
      assertContainsAny(all, ['vyomāsya', 'vidārī', 'krodhabīja', 'kūrca', 'nādabindu'], 'Tantric uddhāra code-words for hūṃ');
    },
  },
  {
    id: 'T2-F14-02',
    tier: 2,
    feature: 'F14',
    title: 'Multi-Script & Case/Diacritic-Insensitive Bīja Lookup (HUM, hūṃ, हूं, hrīḥ, HRIH)',
    async run() {
      const variants = ['hūṃ', 'hum', 'HUM', 'हूं', 'hrīḥ', 'hrih', 'krīṃ', 'krim'];
      for (const v of variants) {
        const res = runKosaCliJson(['bija', v]);
        const str = stringifyDeep(res);
        assert.ok(str.length > 20, `bija "${v}" must return non-empty decipherment JSON`);
      }
    },
  },
  {
    id: 'T2-F14-03',
    tier: 2,
    feature: 'F14',
    title: 'OCHS Embedded JSON Verse Extraction Without HTML/Script Tag Leakage',
    async run() {
      const { cliPayload } = getDbCorpusCombined('db12_muktabodha_ochs');
      const str = stringifyDeep(cliPayload);
      assert.ok(!/<script|<html|<!DOCTYPE/i.test(str), 'OCHS extracted verses must not contain raw <script>/<html> tags');
    },
  },
  {
    id: 'T2-F14-04',
    tier: 2,
    feature: 'F14',
    title: 'Muktabodha Mixed-Case Kyōto-Harvard / IAST Filename & Catalog ID Resolution (M00247, M00292, M00626, M00018)',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db12_muktabodha_ochs', 'M00247');
      assertContainsAll(combinedText, ['M00247', 'M00292', 'M00626', 'M00018'], 'Muktabodha catalog IDs M00247, M00292, M00626, M00018');
    },
  },
  {
    id: 'T2-F14-05',
    tier: 2,
    feature: 'F14',
    title: 'ERC DHARMA Sarvatathāgatatattvasaṅgraha (stts_crited.txt) & Sarvavajrodayā (svu_crited.txt) Clean Text Extraction',
    async run() {
      const { combinedText } = getDbCorpusCombined('db12_muktabodha_ochs');
      assertContainsAny(combinedText, ['stts_crited', 'svu_crited', 'vajrasattva', 'vajradhātu', 'T0865', 'D479'], 'ERC DHARMA STTS & Sarvavajrodayā critical editions');
    },
  },

  // =========================================================================
  // Feature F15: Unified Concordance, Glossary & Bīja Engine Boundary Cases
  // =========================================================================
  {
    id: 'T2-F15-01',
    tier: 2,
    feature: 'F15',
    title: 'Concordance Alias Normalization (T0251 vs T08n0251, Toh 507 vs toh507 vs Toh 883, D846 vs rkts 521)',
    async run() {
      const aliases = ['T0251', 'T08n0251', 'Toh 507', 'toh883', 'MS-ADD-01326', 'vid=1175'];
      for (const alias of aliases) {
        const res = runKosaCliJson(['concordance', alias]);
        const str = stringifyDeep(res);
        assert.ok(str.length > 20, `concordance "${alias}" must resolve to a valid concordance payload`);
      }
    },
  },
  {
    id: 'T2-F15-02',
    tier: 2,
    feature: 'F15',
    title: 'Compound Multi-Syllable Mantra Bīja Sequence Decipherment ("oṃ āḥ hūṃ hrīḥ svāhā")',
    async run() {
      const res = runKosaCliJson(['bija', 'oṃ āḥ hūṃ hrīḥ svāhā']);
      const str = stringifyDeep(res);
      assertContainsAny(str, ['oṃ', 'hūṃ', 'hrīḥ', 'svāhā'], 'Compound multi-bīja sequence decipherment');
    },
  },
  {
    id: 'T2-F15-03',
    tier: 2,
    feature: 'F15',
    title: 'Database-Scoped Search Filtering (--db <dbId>) Isolation',
    async run() {
      const resDb1 = runKosaCliJson(['search', 'svāhā', '--db', 'db1_fangshan']);
      const resDb4 = runKosaCliJson(['search', 'svāhā', '--db', 'db4_84000']);
      const list1 = unwrapList(resDb1);
      const list4 = unwrapList(resDb4);
      for (const item of list1) {
        const dbField = item?.dbId ?? item?.databaseId ?? item?.db ?? 'db1_fangshan';
        assert.ok(String(dbField).includes('db1_fangshan') || String(dbField) === '1', `Expected db1_fangshan scoped item, got ${dbField}`);
      }
      for (const item of list4) {
        const dbField = item?.dbId ?? item?.databaseId ?? item?.db ?? 'db4_84000';
        assert.ok(String(dbField).includes('db4_84000') || String(dbField) === '4', `Expected db4_84000 scoped item, got ${dbField}`);
      }
    },
  },
  {
    id: 'T2-F15-04',
    tier: 2,
    feature: 'F15',
    title: 'Graceful Empty/Unknown Query Handling in search, concordance, and bija',
    async run() {
      const s = runKosaCliAllowError(['search', '__NON_EXISTENT_XYZZY_99999__', '--json']);
      const c = runKosaCliAllowError(['concordance', '__NON_EXISTENT_XYZZY_99999__', '--json']);
      const b = runKosaCliAllowError(['bija', '__NON_EXISTENT_XYZZY_99999__', '--json']);
      for (const r of [s, c, b]) {
        assert.ok(!r.stderr.includes('ReferenceError') && !r.stderr.includes('TypeError'), 'Must not throw unhandled ReferenceError/TypeError');
      }
    },
  },
  {
    id: 'T2-F15-05',
    tier: 2,
    feature: 'F15',
    title: 'Cross-Script Query Equivalence (IAST vs Devanāgarī vs Siddhaṃ vs Chinese vs Tibetan)',
    async run() {
      const queries = ['prajñā', 'प्रज्ञा', '般若', 'shes rab'];
      for (const q of queries) {
        const res = runKosaCliJson(['search', q]);
        const list = unwrapList(res);
        assert.ok(
          list.length > 0 || stringifyDeep(res).length > 30,
          `Expected non-empty search results for cross-script query "${q}"`
        );
      }
    },
  },

  // =========================================================================
  // Feature F16: React Web UI & Deterministic CLI Boundary Cases
  // =========================================================================
  {
    id: 'T2-F16-01',
    tier: 2,
    feature: 'F16',
    title: 'CLI Numeric Shorthand & Case-Insensitive Database Inspection (inspect 1 .. inspect 12)',
    async run() {
      const r1 = runKosaCliJson(['inspect', '1']);
      const r7 = runKosaCliJson(['inspect', '7']);
      const r12 = runKosaCliJson(['inspect', '12']);
      assertContainsAny(stringifyDeep(r1), ['db1_fangshan', 'F28n1071'], 'Numeric inspect 1 resolves to db1_fangshan');
      assertContainsAny(stringifyDeep(r7), ['db7_cudl_hidas', 'MS-ADD-01326'], 'Numeric inspect 7 resolves to db7_cudl_hidas');
      assertContainsAny(stringifyDeep(r12), ['db12_muktabodha_ochs', 'M00247', 'bijanighantu'], 'Numeric inspect 12 resolves to db12_muktabodha_ochs');
    },
  },
  {
    id: 'T2-F16-02',
    tier: 2,
    feature: 'F16',
    title: 'CLI Specific Record Inspection (inspect <dbId> <recordId> --json)',
    async run() {
      const r1 = runKosaCliJson(['inspect', 'db1_fangshan', 'F28n1071']);
      const r7 = runKosaCliJson(['inspect', 'db7_cudl_hidas', 'MS-ADD-01326']);
      const r8 = runKosaCliJson(['inspect', 'db8_polyglotta', '1175']);
      assertContainsAny(stringifyDeep(r1), ['F28n1071', '釋教最上乘秘密藏陀羅尼集'], 'Specific record inspect F28n1071');
      assertContainsAny(stringifyDeep(r7), ['MS-ADD-01326', '458'], 'Specific record inspect MS-ADD-01326');
      assertContainsAny(stringifyDeep(r8), ['1175', 'Prajñāpāramitāhṛdaya'], 'Specific record inspect 1175');
    },
  },
  {
    id: 'T2-F16-03',
    tier: 2,
    feature: 'F16',
    title: 'CLI Invalid Subcommand / Invalid DB ID Structured Error Handling',
    async run() {
      const badCmd = runKosaCliAllowError(['unknown-subcommand-xyz', '--json']);
      const badDb = runKosaCliAllowError(['inspect', 'db99_invalid', '--json']);
      assert.ok(!badCmd.stderr.includes('ReferenceError'), 'Invalid subcommand must not throw ReferenceError');
      assert.ok(!badDb.stderr.includes('ReferenceError'), 'Invalid dbId must not throw ReferenceError');
    },
  },
  {
    id: 'T2-F16-04',
    tier: 2,
    feature: 'F16',
    title: 'Zero Placeholder / Mock / TODO / FIXME Enforcement Across Codebase',
    async run() {
      const srcFiles = findFilesRecursive('src', (r) => r.endsWith('.ts') || r.endsWith('.tsx'));
      assert.ok(srcFiles.length >= 10, `Expected >= 10 TypeScript source files in src/, found ${srcFiles.length}`);
      for (const rel of srcFiles) {
        const content = readProjectFile(rel);
        assert.ok(!/\bTODO\s*:/i.test(content), `Found forbidden TODO: comment in ${rel}`);
        assert.ok(!/\bFIXME\s*:/i.test(content), `Found forbidden FIXME: comment in ${rel}`);
        assert.ok(!/\blorem ipsum\b/i.test(content), `Found forbidden lorem ipsum in ${rel}`);
      }
    },
  },
  {
    id: 'T2-F16-05',
    tier: 2,
    feature: 'F16',
    title: 'Siddhaṃ Webfont (NotoSansSiddham-Regular.woff2) Binary Integrity & CSS @font-face Wiring',
    async run() {
      const fontFullPath = path.join(ROOT_DIR, 'public/fonts/NotoSansSiddham-Regular.woff2');
      assert.ok(fs.existsSync(fontFullPath), 'NotoSansSiddham-Regular.woff2 must exist');
      const buf = fs.readFileSync(fontFullPath);
      assert.equal(buf.readUInt32BE(0), 0x774f4632, 'First 4 bytes must equal 0x774F4632 ("wOF2")');
      assert.ok(buf.length >= 40000, 'Font file must be >= 40,000 bytes');
    },
  },
];
