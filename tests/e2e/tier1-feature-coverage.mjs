import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT_DIR,
  CANONICAL_DB_IDS,
  fileExists,
  readProjectFile,
  readProjectFileOptional,
  findFilesRecursive,
  runKosaCliJson,
  stringifyDeep,
  assertContainsAll,
  assertContainsAny,
  unwrapList,
  findDbEntry,
  getDbCorpusCombined,
  inspectDbRecordResilient,
  runPhoneticsNormalized,
} from './helpers/harness.mjs';

export const TIER1_TESTS = [
  // =========================================================================
  // Feature F1: Baseline CBETA Gaiji (2,240), T18–T21 (614), 16 Tang <cb:tt> (916), 25 GRETIL & Siddhaṃ Font
  // =========================================================================
  {
    id: 'T1-F1-01',
    tier: 1,
    feature: 'F1',
    title: 'CBETA Gaiji 2,240 #SD-*/#RJ-* Mapping Integrity',
    async run() {
      const cbetaSrc = readProjectFile('src/data/generated/cbetaAuthRecords.ts');
      const stats = runKosaCliJson(['stats']);
      const combined = `${cbetaSrc}\n${stringifyDeep(stats)}`;
      assert.ok(cbetaSrc.includes('CBETA_GAIJI_MAP'), 'cbetaAuthRecords.ts must export CBETA_GAIJI_MAP');
      const sdMatches = cbetaSrc.match(/#?SD-[A-F0-9]{4}/gi) || [];
      assert.ok(
        sdMatches.length >= 2200 || /2240/.test(combined),
        `Expected >= 2,240 #SD-*/#RJ-* Gaiji mappings (found ${sdMatches.length} inline codes)`
      );
      assertContainsAny(combined, ['SD-A5ED', 'SD-A440', 'SD-A5E5'], 'CBETA_GAIJI_MAP spot-check IDs');
    },
  },
  {
    id: 'T1-F1-02',
    tier: 1,
    feature: 'F1',
    title: 'Taishō Mikkyō T18–T21 Full Catalog Index (614 Works)',
    async run() {
      const mikkyoSrc = readProjectFile('src/data/generated/taishoMikkyoIndex.ts');
      const stats = runKosaCliJson(['stats']);
      assert.ok(mikkyoSrc.includes('TAISHO_MIKKYO_INDEX'), 'taishoMikkyoIndex.ts must export TAISHO_MIKKYO_INDEX');
      const tMatches = mikkyoSrc.match(/T(?:18|19|20|21)n\d{4}|"T?\d{4}[A-Z]?"/g) || [];
      assert.ok(tMatches.length >= 573, `Expected >= 573 Taishō Mikkyō entries in TAISHO_MIKKYO_INDEX, found ${tMatches.length}`);
      assertContainsAny(mikkyoSrc, ['0974B', 'T19n0974B', '佛頂尊勝'], 'Taishō Uṣṇīṣavijayā T19n0974B');
      assertContainsAny(mikkyoSrc, ['1060', 'T20n1060', '千手千眼', '大悲心'], 'Taishō Nīlakaṇṭha T20n1060');
      assert.ok(stringifyDeep(stats).length > 20, 'CLI stats must return non-empty telemetry');
    },
  },
  {
    id: 'T1-F1-03',
    tier: 1,
    feature: 'F1',
    title: '16 Core Tang <cb:tt> Siddhaṃ-Chinese Interlinear Alignments (916 Pairs)',
    async run() {
      const cbetaSrc = readProjectFile('src/data/generated/cbetaAuthRecords.ts');
      const stats = runKosaCliJson(['stats']);
      assert.ok(cbetaSrc.includes('CBETA_AUTH_RECORDS'), 'cbetaAuthRecords.ts must export CBETA_AUTH_RECORDS');
      assertContainsAny(cbetaSrc, ['T19n0974', 'T20n1060', 'T20n1064', 'T19n1022A', 'Uṣṇīṣavijayā', 'Nīlakaṇṭha'], '16 core Tang <cb:tt> works');
      assert.ok(cbetaSrc.length > 10000, 'CBETA_AUTH_RECORDS must contain full interlinear alignments');
      assert.ok(stringifyDeep(stats).length > 20, 'stats JSON must report baseline CBETA metrics');
    },
  },
  {
    id: 'T1-F1-04',
    tier: 1,
    feature: 'F1',
    title: '25 Baseline GRETIL Buddhist Sanskrit Editions',
    async run() {
      const gretilSrc = readProjectFile('src/data/generated/gretilAuthRecords.ts');
      const searchRes = runKosaCliJson(['search', 'Prajñāpāramitāhṛdaya']);
      assert.ok(gretilSrc.includes('GRETIL_AUTH_RECORDS'), 'gretilAuthRecords.ts must export GRETIL_AUTH_RECORDS');
      assertContainsAll(
        gretilSrc,
        ['prajnhsu', 'amoghapu', 'mahpratu', 'sarvttsu'],
        'GRETIL_AUTH_RECORDS core texts'
      );
      const combined = `${gretilSrc}\n${stringifyDeep(searchRes)}`;
      assertContainsAll(combined, ['gate gate', 'pāragate', 'svāhā'], 'Heart Sūtra mantra in GRETIL baseline');
    },
  },
  {
    id: 'T1-F1-05',
    tier: 1,
    feature: 'F1',
    title: 'Bundled NotoSansSiddham-Regular.woff2 Font Verification',
    async run() {
      const fontPath = path.join(ROOT_DIR, 'public/fonts/NotoSansSiddham-Regular.woff2');
      assert.ok(fs.existsSync(fontPath), 'public/fonts/NotoSansSiddham-Regular.woff2 must exist');
      const buf = fs.readFileSync(fontPath);
      assert.ok(buf.length >= 40000, `Expected woff2 font >= 40,000 bytes, got ${buf.length}`);
      const magic = buf.subarray(0, 4).toString('ascii');
      assert.equal(magic, 'wOF2', 'Font file must begin with wOF2 magic header');
      const cssAndHtml = `${readProjectFileOptional('src/index.css')}\n${readProjectFileOptional('index.html')}`;
      assertContainsAny(cssAndHtml, ['NotoSansSiddham', 'Noto Sans Siddham'], 'CSS/HTML Siddhaṃ @font-face declaration');
    },
  },

  // =========================================================================
  // Feature F2: Multi-Script Transliteration, 34×14 Phonetic Matrix, Prosody & 136.1 Hz Audio Engine
  // =========================================================================
  {
    id: 'T1-F2-01',
    tier: 1,
    feature: 'F2',
    title: 'Multi-Script Transliteration (IAST ↔ Devanāgarī ↔ SLP1 ↔ Siddhaṃ ↔ EWTS)',
    async run() {
      const p = runPhoneticsNormalized('oṃ maṇi padme hūṃ');
      assertContainsAll(p.normalizedIast || p.rawText, ['oṃ', 'maṇi', 'padme', 'hūṃ'], 'IAST output');
      assertContainsAll(p.slp1 || p.rawText, ['oM', 'maRi', 'padme', 'hUM'], 'SLP1 output');
      assertContainsAny(p.devanagari || p.rawText, ['ॐ', 'मणि', 'पद्मे', 'हूं'], 'Devanāgarī output');
      assert.ok(
        /[\u{11580}-\u{115FF}]/u.test(p.siddhamUnicode || p.rawText),
        'Expected Unicode Siddhaṃ characters in U+11580..U+115FF range'
      );
    },
  },
  {
    id: 'T1-F2-02',
    tier: 1,
    feature: 'F2',
    title: '34×14 Dual-Track Phonetic Matrix & Sacred Seed-Syllable Overrides',
    async run() {
      const matrixSrc = readProjectFile('src/data/siddhamMatrix.ts');
      assert.ok(matrixSrc.length > 2000, 'siddhamMatrix.ts must define the 34×14 phonetic matrix');
      const p = runPhoneticsNormalized('oṃ tāre tuttāre ture svāhā phaṭ');
      assertContainsAny(p.rawText, ['嗡', '唵'], 'Sacred oṃ dual-track phonetics (嗡 / 唵)');
      assertContainsAny(p.rawText, ['帕特', '发吒', '發吒'], 'Sacred phaṭ dual-track phonetics (帕特 / 发吒)');
      assertContainsAny(p.rawText, ['萨婆诃', '薩婆訶', '斯瓦哈'], 'svāhā phonetics');
    },
  },
  {
    id: 'T1-F2-03',
    tier: 1,
    feature: 'F2',
    title: '3-Pass Akṣara Syllabifier & Chandas Guru (—) / Laghu (⏑) Prosody',
    async run() {
      const p = runPhoneticsNormalized('gate gate pāragate pārasaṃgate bodhi svāhā');
      assert.ok(p.flatSyllables.length >= 14, `Expected >= 14 syllables for Heart Sūtra mantra, got ${p.flatSyllables.length}`);
      const gateWord = p.words.find((w) => w.wordIast.toLowerCase().includes('gate') && w.syllables.length === 2);
      if (gateWord) {
        assert.equal(gateWord.syllables[0].weightNormalized, 'Laghu', 'ga in gate must be Laghu (⏑)');
        assert.equal(gateWord.syllables[1].weightNormalized, 'Guru', 'te in gate must be Guru (—)');
      } else {
        assertContainsAny(p.rawText, ['Laghu', '⏑'], 'Laghu meter marker');
        assertContainsAny(p.rawText, ['Guru', '—'], 'Guru meter marker');
      }
    },
  },
  {
    id: 'T1-F2-04',
    tier: 1,
    feature: 'F2',
    title: 'Anusvāra (ṃ) Place-of-Articulation Nasal Assimilation & Visarga (ḥ) Echo Vowel',
    async run() {
      const p = runPhoneticsNormalized('pārasaṃgate śāntiḥ hrīḥ bhūḥ');
      assertContainsAny(p.rawText, ['ŋ', '昂', '僧', '喉音', 'velar'], 'Anusvāra velar assimilation before g in pārasaṃgate');
      assertContainsAny(p.rawText, ['希', '醯', 'hi'], 'Visarga echo vowel [hi] after i/ī in śāntiḥ / hrīḥ');
      assertContainsAny(p.rawText, ['呼', '虎', 'hu'], 'Visarga echo vowel [hu] after u/ū in bhūḥ');
    },
  },
  {
    id: 'T1-F2-05',
    tier: 1,
    feature: 'F2',
    title: '136.1 Hz "Om" Web Audio Formant Synthesizer & 14-Vowel Formant Table',
    async run() {
      const audioSrc = readProjectFile('src/services/sanskritAudioEngine.ts');
      assertContainsAll(audioSrc, ['136.1', '272.2', 'VOWEL_FORMANTS', 'bandpass'], '136.1 Hz formant synthesizer parameters');
      assertContainsAll(audioSrc, ['720', '1240', '300', '2280'], 'Exact F1/F2 formant frequencies for vowels a/i');
    },
  },

  // =========================================================================
  // Feature F3: DB #1 (db1_fangshan): CBETA Fangshan Stone Canon (F28n1071 & F24/F27)
  // =========================================================================
  {
    id: 'T1-F3-01',
    tier: 1,
    feature: 'F3',
    title: 'DB #1 Metadata & F28n1071 30-Roll Scale Verification',
    async run() {
      const dbs = runKosaCliJson(['dbs']);
      const db1 = findDbEntry(dbs, 'db1_fangshan', 1);
      assert.ok(db1, 'dbs --json must include db1_fangshan');
      const { combinedText } = getDbCorpusCombined('db1_fangshan');
      assertContainsAll(combinedText, ['db1_fangshan', 'F28n1071', '釋教最上乘秘密藏陀羅尼集'], 'DB #1 Fangshan F28n1071 metadata');
      assertContainsAny(combinedText, ['730', '8291', '8297', '行琳'], 'Fangshan F28n1071 scale metrics');
    },
  },
  {
    id: 'T1-F3-02',
    tier: 1,
    feature: 'F3',
    title: 'Fangshan F28n1071 Four Categories of Inline Phonetic Notes (二合, 三合, 引, 彈舌)',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db1_fangshan', 'F28n1071');
      assertContainsAll(combinedText, ['二合', '三合', '引'], 'Fangshan inline phonetic tags 二合, 三合, 引');
      assertContainsAny(combinedText, ['彈舌', '轉舌', '弹舌'], 'Fangshan 彈舌/轉舌 phonetic tag');
      assertContainsAny(combinedText, ['49095', '12529', '15964', '248'], 'Fangshan inline note counts');
    },
  },
  {
    id: 'T1-F3-03',
    tier: 1,
    feature: 'F3',
    title: 'Lookup Specific Dhāraṇī in F28n1071 (金色寶光妙行成就如來陁羅尼 pF28p0038a0301)',
    async run() {
      const searchRes = runKosaCliJson(['search', '金色寶光妙行成就如來', '--db', 'db1_fangshan']);
      const { combinedText } = getDbCorpusCombined('db1_fangshan');
      const allText = `${stringifyDeep(searchRes)}\n${combinedText}`;
      assertContainsAny(allText, ['金色寶光妙行成就如來', 'pF28p0038a0301', '蘇悉第', '悉第'], 'Fangshan 金色寶光妙行成就如來陁羅尼');
    },
  },
  {
    id: 'T1-F3-04',
    tier: 1,
    feature: 'F3',
    title: 'Complete Coverage of the 9 Standalone Tantric Dhāraṇī Works in F24 & F27 + F28n1072',
    async run() {
      const { combinedText } = getDbCorpusCombined('db1_fangshan');
      assertContainsAll(
        combinedText,
        ['F24n0761', 'F27n1048', 'F27n1050', 'F27n1056', 'F27n1060', 'F27n1061', 'F27n1062', 'F27n1063', 'F27n1064', 'F28n1072'],
        'All 9 Fangshan F24/F27 dhāraṇī works + F28n1072'
      );
      assertContainsAny(combinedText, ['慈賢', '不空'], 'Translator attributions (Amoghavajra 不空 & Cixian 慈賢)');
    },
  },
  {
    id: 'T1-F3-05',
    tier: 1,
    feature: 'F3',
    title: 'Resolution of #SD-* Siddhaṃ Glyphs Inside F28n1071 <cb:tt> Blocks',
    async run() {
      const { combinedText } = getDbCorpusCombined('db1_fangshan');
      assertContainsAny(combinedText, ['SD-A5ED', 'SD-A5E5', '#SD-'], 'Fangshan #SD-* Siddhaṃ glyph references');
      assertContainsAny(combinedText, ['謨', '唵', 'cb:tt', 'siddham'], 'Fangshan <cb:tt> paired Chinese/Siddhaṃ data');
    },
  },

  // =========================================================================
  // Feature F4: DB #2 (db2_taisho_ext): CBETA Taishō T54 Lexicons, T84 Siddhaṃ & 18 Chapters, T08–T21 Ancient Dhāraṇīs
  // =========================================================================
  {
    id: 'T1-F4-01',
    tier: 1,
    feature: 'F4',
    title: 'DB #2 Part A: T54n2132–2136 Sanskrit-Chinese Lexicons & T54n2128–2131 Glossaries',
    async run() {
      const { combinedText } = getDbCorpusCombined('db2_taisho_ext');
      assertContainsAll(
        combinedText,
        ['T54n2132', 'T54n2133A', 'T54n2133B', 'T54n2134', 'T54n2135', 'T54n2136'],
        'T54n2132–2136 Siddhaṃ-Chinese lexicons'
      );
      assertContainsAll(
        combinedText,
        ['T54n2128', 'T54n2129', 'T54n2130', 'T54n2131'],
        'T54n2128–2131 phonological/etymological lexicons'
      );
      assertContainsAll(combinedText, ['悉曇字記', '梵語千字文', '梵語雜名', '一切經音義'], 'T54 Chinese lexicon titles');
    },
  },
  {
    id: 'T1-F4-02',
    tier: 1,
    feature: 'F4',
    title: 'DB #2 Part B: All 11 Japanese Siddhaṃ Treatises (T84n2701–2711 / KR6t0412–0422)',
    async run() {
      const searchRes = runKosaCliJson(['search', '梵字悉曇字母并釋義', '--db', 'db2_taisho_ext']);
      const { combinedText } = getDbCorpusCombined('db2_taisho_ext');
      const allText = `${stringifyDeep(searchRes)}\n${combinedText}`;
      assertContainsAll(
        allText,
        ['T84n2701', 'T84n2702', 'T84n2703', 'T84n2704', 'T84n2705', 'T84n2706', 'T84n2707', 'T84n2708', 'T84n2709', 'T84n2710', 'T84n2711'],
        'All 11 Japanese Siddhaṃ works T84n2701–2711'
      );
      assertContainsAll(allText, ['空海', '安然', '悉曇藏'], 'Kūkai and Annen Siddhaṃ treatises');
    },
  },
  {
    id: 'T1-F4-03',
    tier: 1,
    feature: 'F4',
    title: 'DB #2 Part B: scottgfhong310/siddham-registry 18 Siddhaṃ Chapters (悉曇十八章)',
    async run() {
      const { combinedText } = getDbCorpusCombined('db2_taisho_ext');
      assertContainsAny(combinedText, ['十八章', '18', 'siddham-chapters', 'siddham-registry', 'Parivarta'], '18 Siddhaṃ Chapters registry');
      assertContainsAny(combinedText, ['6442', '6874', '9066', 'siddham-syllables', 'siddham-glyphs', '智廣'], 'siddham-registry cell/syllable/glyph data');
    },
  },
  {
    id: 'T1-F4-04',
    tier: 1,
    feature: 'F4',
    title: 'DB #2 Part C: Six Dynasties & Tang Ancient Dhāraṇīs (T21n1336, T13n0397, T16n0665, T09n0262)',
    async run() {
      const searchRes = runKosaCliJson(['search', '陀羅尼雜集', '--db', 'db2_taisho_ext']);
      const { combinedText } = getDbCorpusCombined('db2_taisho_ext');
      const allText = `${stringifyDeep(searchRes)}\n${combinedText}`;
      assertContainsAll(
        allText,
        ['T21n1336', 'T13n0397', 'T11n0310', 'T16n0665', 'T16n0664', 'T13n0402', 'T09n0262'],
        'Ancient Dhāraṇī scriptures in DB #2'
      );
      assertContainsAll(allText, ['陀羅尼雜集', '大方等大集經', '金光明最勝王經', '妙法蓮華經'], 'Ancient Dhāraṇī Chinese titles');
    },
  },
  {
    id: 'T1-F4-05',
    tier: 1,
    feature: 'F4',
    title: 'DB #2 Part C: T10n0293 42 Siddhaṃ Arapacana Gates & T08n0250–0257 Seven Heart Sūtra Editions',
    async run() {
      const { combinedText } = getDbCorpusCombined('db2_taisho_ext');
      assertContainsAll(
        combinedText,
        ['T10n0293', 'T08n0250', 'T08n0251', 'T08n0252', 'T08n0253', 'T08n0254', 'T08n0255', 'T08n0257'],
        'T10n0293 Arapacana + 7 Heart Sūtra editions in T08'
      );
    },
  },

  // =========================================================================
  // Feature F5: DB #3 (db3_dsbc_gretil): Nepal DSBC (Dhāraṇī Saṃgraha, list/4, 486 Catalog) & GRETIL 261 Texts
  // =========================================================================
  {
    id: 'T1-F5-01',
    tier: 1,
    feature: 'F5',
    title: 'Nepalese Dhāraṇī Saṃgraha Dual-Script Ingestion (820/2949 IAST & 824/2953 Devanāgarī)',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db3_dsbc_gretil', '2949');
      assertContainsAny(combinedText, ['820/2949', '2949', 'Dhāraṇī Saṃgraha', 'Dhāraṇīsaṃgraha'], 'DSBC 820/2949 IAST Dhāraṇī Saṃgraha');
      assertContainsAny(combinedText, ['824/2953', '2953', 'धारणी', 'नमो'], 'DSBC 824/2953 Devanāgarī Dhāraṇī Saṃgraha');
    },
  },
  {
    id: 'T1-F5-02',
    tier: 1,
    feature: 'F5',
    title: 'DSBC Standalone Dhāraṇī Books (list/4, 15 Books + 862/2990 Grahamātṛkā)',
    async run() {
      const searchRes = runKosaCliJson(['search', 'Grahamātṛkā', '--db', 'db3_dsbc_gretil']);
      const { combinedText } = getDbCorpusCombined('db3_dsbc_gretil');
      const allText = `${stringifyDeep(searchRes)}\n${combinedText}`;
      assertContainsAll(
        allText,
        ['Amoghapāśa', 'Mahāpratisarā', 'Vajravidāraṇā', 'Vasudhārā', 'Grahamātṛkā'],
        'DSBC list/4 standalone Dhāraṇī works'
      );
    },
  },
  {
    id: 'T1-F5-03',
    tier: 1,
    feature: 'F5',
    title: 'DSBC Master Canon Catalog (486 Romanized & 475 Devanāgarī Books)',
    async run() {
      const { combinedText } = getDbCorpusCombined('db3_dsbc_gretil');
      assertContainsAny(combinedText, ['486', '475', 'dsbcproject.org', 'browse-by-list'], 'DSBC Master Canon catalog metrics');
    },
  },
  {
    id: 'T1-F5-04',
    tier: 1,
    feature: 'F5',
    title: 'GRETIL bst-108u.htm Complete 108 Buddhist Stotras (Bauddha Stotra Saṃgrahaḥ)',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db3_dsbc_gretil', 'bst-108u');
      assertContainsAny(combinedText, ['bst-108u', 'Bauddha Stotra', '108', 'busto1_u'], 'GRETIL 108 Buddhist Stotras');
    },
  },
  {
    id: 'T1-F5-05',
    tier: 1,
    feature: 'F5',
    title: 'Full GRETIL Buddhist Sanskrit Mirror Expansion (261 .htm Works & Additional Dhāraṇīs)',
    async run() {
      const { combinedText } = getDbCorpusCombined('db3_dsbc_gretil');
      assertContainsAny(combinedText, ['261', 'GRETIL-mirror', 'abhisdhu', 'mprsvdhu', 'sjdh_u', 'tarasdhu'], 'Expanded 261 GRETIL Buddhist Sanskrit files');
    },
  },

  // =========================================================================
  // Feature F6: DB #4 (db4_84000): 84000 Open TEI (Toh 502–808 & Toh 846–1095), TM Alignments, RDF & Trilingual Glossary
  // =========================================================================
  {
    id: 'T1-F6-01',
    tier: 1,
    feature: 'F6',
    title: '84000 Open TEI Coverage of Kriyātantra (Toh 502–808) & Gzungs \'dus (Toh 846–1095)',
    async run() {
      const dbs = runKosaCliJson(['dbs']);
      const db4 = findDbEntry(dbs, 'db4_84000', 4);
      assert.ok(db4, 'dbs --json must include db4_84000');
      const { combinedText } = getDbCorpusCombined('db4_84000');
      assertContainsAll(combinedText, ['db4_84000', 'toh507', 'toh846', 'toh862'], '84000 Kriyātantra and Gzungs \'dus Tohoku IDs');
    },
  },
  {
    id: 'T1-F6-02',
    tier: 1,
    feature: 'F6',
    title: 'Sanitized <mantra xml:lang="Sa-Ltn"> & Extracted English Mantra Translation (Toh 507,883 / Toh 862)',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db4_84000', 'toh507');
      assertContainsAny(
        combinedText,
        ['tryadhvikānāṃ', 'sarvatathāgatānām', 'bhaiṣajye', 'svāhā', 'Guhyadhātu'],
        'Sanitized 84000 IAST mantra text'
      );
    },
  },
  {
    id: 'T1-F6-03',
    tier: 1,
    feature: 'F6',
    title: '84000 Trilingual Glossary Extraction (<list type="glossary">)',
    async run() {
      const searchRes = runKosaCliJson(['search', 'adhiṣṭhāna', '--db', 'db4_84000']);
      const { combinedText } = getDbCorpusCombined('db4_84000');
      const allText = `${stringifyDeep(searchRes)}\n${combinedText}`;
      assertContainsAny(allText, ['adhiṣṭhāna', 'byin gyis brlabs', 'blessing', 'dhāraṇī', 'gzungs'], '84000 trilingual glossary entries');
    },
  },
  {
    id: 'T1-F6-04',
    tier: 1,
    feature: 'F6',
    title: '84000 Translation Memory (data-tm-alignments) Parallel Tibetan-English Sentences',
    async run() {
      const { combinedText } = getDbCorpusCombined('db4_84000');
      assertContainsAny(combinedText, ['data-tm-alignments', 'TMtoh', 'aligned', 'བཅོམ་ལྡན་འདས', 'Homage to'], '84000 TM parallel Tibetan-English alignments');
    },
  },
  {
    id: 'T1-F6-05',
    tier: 1,
    feature: 'F6',
    title: '84000 Linked Open Data RDF (data-rdf) BDRC Work/Instance Cross-References',
    async run() {
      const { combinedText } = getDbCorpusCombined('db4_84000');
      assertContainsAny(combinedText, ['W22084', 'MW22084', 'WA0RK', '84000.co/translation/toh', 'data-rdf'], '84000 RDF BDRC identifiers and canonical URLs');
    },
  },

  // =========================================================================
  // Feature F7: DB #5 (db5_buddhanexus): BuddhaNexus Segmented Sanskrit & Live DharmaMitra API
  // =========================================================================
  {
    id: 'T1-F7-01',
    tier: 1,
    feature: 'F7',
    title: 'db5_buddhanexus Metadata Summary & Corpus Export Integrity',
    async run() {
      const dbs = runKosaCliJson(['dbs']);
      const db5 = findDbEntry(dbs, 'db5_buddhanexus', 5);
      assert.ok(db5, 'dbs --json must include db5_buddhanexus');
      const { combinedText } = getDbCorpusCombined('db5_buddhanexus');
      assertContainsAll(combinedText, ['db5_buddhanexus', 'segmented-sanskrit', 'dharmamitra.org'], 'DB #5 BuddhaNexus & DharmaMitra URLs');
    },
  },
  {
    id: 'T1-F7-02',
    tier: 1,
    feature: 'F7',
    title: 'K12n2949u (Dhāraṇīsaṃgraha) 7,700-Segment & 113+ Colophon Inspection',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db5_buddhanexus', 'K12n2949u');
      assertContainsAll(combinedText, ['K12n2949u', '7700'], 'BuddhaNexus K12n2949u 7,700 segments');
      assertContainsAny(combinedText, ['113', 'samāptā', 'samāpta', 'Dhāraṇīsaṃgraha'], 'K12n2949u colophon markers');
    },
  },
  {
    id: 'T1-F7-03',
    tier: 1,
    feature: 'F7',
    title: 'Coverage of All 3 segmented-sanskrit Categories (K12* 42, T01* 105, T02* 65)',
    async run() {
      const { combinedText } = getDbCorpusCombined('db5_buddhanexus');
      assertContainsAll(
        combinedText,
        ['K12Xbsu017_u', 'K12bsu004_u', 'K12mahpratu', 'T01n802u', 'T02dipguhsu', 'T02psarkdhu'],
        'K12*, T01*, and T02* segmented Sanskrit files'
      );
    },
  },
  {
    id: 'T1-F7-04',
    tier: 1,
    feature: 'F7',
    title: 'DharmaMitra menudata/?language=sa 3,548-Text Catalog & SA_T02_Candrakīrti_* Integration',
    async run() {
      const { combinedText } = getDbCorpusCombined('db5_buddhanexus');
      assertContainsAny(combinedText, ['3548', 'menudata', 'Candrakīrti', 'Pradīpoddyotana', 'SA_K12_Āgama_Surūpādhāraṇī'], 'DharmaMitra 3,548 catalog & Candrakīrti');
    },
  },
  {
    id: 'T1-F7-05',
    tier: 1,
    feature: 'F7',
    title: 'CLI Search on db5_buddhanexus for Hayagrīvavidyā (K12Xbsu017_u) & Opening Homage',
    async run() {
      const searchRes = runKosaCliJson(['search', 'Hayagrīvavidyā', '--db', 'db5_buddhanexus']);
      const { combinedText } = getDbCorpusCombined('db5_buddhanexus');
      const allText = `${stringifyDeep(searchRes)}\n${combinedText}`;
      assertContainsAll(allText, ['K12Xbsu017_u', 'Hayagrīvavidyā', 'namo ratnatrayāya'], 'Hayagrīvavidyā K12Xbsu017_u opening homage');
    },
  },

  // =========================================================================
  // Feature F8: DB #6 (db6_sarit): SARIT Indology TEI-P5 Corpus (Caryāmelāpakapradīpa & Buddhist Works)
  // =========================================================================
  {
    id: 'T1-F8-01',
    tier: 1,
    feature: 'F8',
    title: 'db6_sarit Metadata Summary & 22 Buddhist/Tantric TEI Works Inventory',
    async run() {
      const dbs = runKosaCliJson(['dbs']);
      const db6 = findDbEntry(dbs, 'db6_sarit', 6);
      assert.ok(db6, 'dbs --json must include db6_sarit');
      const { combinedText } = getDbCorpusCombined('db6_sarit');
      assertContainsAll(combinedText, ['db6_sarit', 'SARIT-corpus', 'caryamelapakapradipa'], 'DB #6 SARIT corpus metadata');
    },
  },
  {
    id: 'T1-F8-02',
    tier: 1,
    feature: 'F8',
    title: 'Inspect caryamelapakapradipa (Caryāmelāpakapradīpa Chapter 3 Vāgviveka / Mantratattva)',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db6_sarit', 'caryamelapakapradipa');
      assertContainsAll(combinedText, ['Caryāmelāpakapradīpa', 'CMP03'], 'Caryāmelāpakapradīpa Chapter 3 CMP03 paragraphs');
      assertContainsAny(combinedText, ['Wedemeyer', 'Āryadeva', 'Vāgviveka', 'Mantratattva', 'vajrajāpa'], 'Caryāmelāpakapradīpa mantra theory details');
    },
  },
  {
    id: 'T1-F8-03',
    tier: 1,
    feature: 'F8',
    title: 'Search db6_sarit for Guhyasamāja Vajrajāpa & Mantratattva Passages',
    async run() {
      const searchRes = runKosaCliJson(['search', 'vajrajāpa', '--db', 'db6_sarit']);
      const { combinedText } = getDbCorpusCombined('db6_sarit');
      const allText = `${stringifyDeep(searchRes)}\n${combinedText}`;
      assertContainsAny(allText, ['vajrajāpa', 'oṃ āḥ hūṃ', 'mantratattva', 'CMP03'], 'SARIT Guhyasamāja vajrajāpa passage');
    },
  },
  {
    id: 'T1-F8-04',
    tier: 1,
    feature: 'F8',
    title: 'Preservation of SARIT Editorial Critical Apparatus (<note resp="editor" place="bottom">)',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db6_sarit', 'caryamelapakapradipa');
      assertContainsAny(combinedText, ['criticalNotes', 'apparatus', 'Wedemeyer', 'NAK', '4837', 'Toh 1803', 'variant'], 'SARIT editorial critical apparatus notes');
    },
  },
  {
    id: 'T1-F8-05',
    tier: 1,
    feature: 'F8',
    title: 'Verification of the 21 Additional Buddhist & Tantric/Yoga Works in DB6_SARIT_CORPUS',
    async run() {
      const { combinedText } = getDbCorpusCombined('db6_sarit');
      assertContainsAll(
        combinedText,
        ['buddhacarita', 'tattvasangrahapanjika', 'pramanavarttikavrtti', 'rasarnava', 'yogapradipa'],
        'Additional SARIT Buddhist & Tantric TEI works'
      );
    },
  },

  // =========================================================================
  // Feature F9: DB #7 (db7_cudl_hidas): Cambridge CUDL Dhāraṇīsaṃgraha Palm-Leaf MSS & Gergely Hidas Editions
  // =========================================================================
  {
    id: 'T1-F9-01',
    tier: 1,
    feature: 'F9',
    title: 'db7_cudl_hidas Metadata Summary, 69 CUDL Manuscripts & 9 Hidas Editions',
    async run() {
      const dbs = runKosaCliJson(['dbs']);
      const db7 = findDbEntry(dbs, 'db7_cudl_hidas', 7);
      assert.ok(db7, 'dbs --json must include db7_cudl_hidas');
      const { combinedText } = getDbCorpusCombined('db7_cudl_hidas');
      assertContainsAll(combinedText, ['db7_cudl_hidas', 'cudl.lib.cam.ac.uk', 'MS-ADD-01326'], 'DB #7 CUDL & Hidas metadata');
    },
  },
  {
    id: 'T1-F9-02',
    tier: 1,
    feature: 'F9',
    title: 'Inspect MS-ADD-01326 (Dhāraṇīsaṅgraha, 1719 CE, 458 Pages, IIIF & Diplomatic Rubrics)',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db7_cudl_hidas', 'MS-ADD-01326');
      assertContainsAll(combinedText, ['MS-ADD-01326', '458', 'iiif'], 'MS-ADD-01326 458 pages and IIIF URL');
      assertContainsAny(combinedText, ['sarvvabuddhabodhisatvebhyaḥ', 'parisamāptaḥ', '1719', '839'], 'MS-ADD-01326 diplomatic rubrics & date');
    },
  },
  {
    id: 'T1-F9-03',
    tier: 1,
    feature: 'F9',
    title: 'Inspect MS-ADD-01680-00008-00001..3 (12th–13th c. Palm-Leaf Dhāraṇīsaṃgraha with 30+ Section Rubrics)',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db7_cudl_hidas', 'MS-ADD-01680-00008-00003');
      assertContainsAll(
        combinedText,
        ['MS-ADD-01680-00008-00001', 'MS-ADD-01680-00008-00002', 'MS-ADD-01680-00008-00003'],
        'All 3 sub-items of MS Add. 1680.8'
      );
      assertContainsAny(
        combinedText,
        ['Āryoṣṇīṣavijayā', 'Āryagrahamātṛkā', 'Āryamārīcī', 'Āryacundā', 'Āryadhātukaraṇḍā'],
        'Transcribed section rubrics in MS Add. 1680.8'
      );
    },
  },
  {
    id: 'T1-F9-04',
    tier: 1,
    feature: 'F9',
    title: 'Verify All 9 Gergely Hidas Open-Access Critical/Diplomatic Editions in DB7_CUDL_HIDAS_CORPUS',
    async run() {
      const { combinedText } = getDbCorpusCombined('db7_cudl_hidas');
      assertContainsAll(
        combinedText,
        [
          'SA_K12_Āgama_Māṇibhadradhāraṇī_Hidas',
          'SA_K12_Āgama_Mahādhāraṇī',
          'SA_K12_Āgama_Sarvakarmāvaraṇaviśodhanīdhāraṇī',
          'SA_K12_Āgama_Mahāśrīnāmadvādaśaka_Hidas',
          'SA_K12_Āgama_Sahasrāvartādhāraṇī',
          'SA_K12_Āgama_Surūpādhāraṇī',
          'SA_K12_Āgama_Mahādaṇḍadhāraṇīśītavatī_Hidas',
          'SA_K12_Āgama_Vajratuṇḍanāgasamaya_Hidas',
          'SA_T01_Vajraḍākadaṇḍakastotra_CUL',
        ],
        'All 9 Gergely Hidas critical/diplomatic editions'
      );
    },
  },
  {
    id: 'T1-F9-05',
    tier: 1,
    feature: 'F9',
    title: 'Verify Saptavāra, Pañcarakṣā, and PR-FG-00870 (770 CE Hyakumantō darani) in db7_cudl_hidas',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db7_cudl_hidas', 'PR-FG-00870');
      assertContainsAll(combinedText, ['PR-FG-00870', 'Saptavāra', 'Pañcarakṣā'], 'CUDL PR-FG-00870, Saptavāra, and Pañcarakṣā');
    },
  },

  // =========================================================================
  // Feature F10: DB #8 (db8_polyglotta): University of Oslo Bibliotheca Polyglotta (polyglotta.uio.no)
  // =========================================================================
  {
    id: 'T1-F10-01',
    tier: 1,
    feature: 'F10',
    title: 'db8_polyglotta Metadata Summary & Quadrilingual Corpus Structure',
    async run() {
      const dbs = runKosaCliJson(['dbs']);
      const db8 = findDbEntry(dbs, 'db8_polyglotta', 8);
      assert.ok(db8, 'dbs --json must include db8_polyglotta');
      const { combinedText } = getDbCorpusCombined('db8_polyglotta');
      assertContainsAll(combinedText, ['db8_polyglotta', 'polyglotta.uio.no'], 'DB #8 Oslo Bibliotheca Polyglotta URL');
    },
  },
  {
    id: 'T1-F10-02',
    tier: 1,
    feature: 'F10',
    title: 'Inspect vid=1175 (Prajñāpāramitāhṛdaya 16-Witness Sentence-by-Sentence Alignment)',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db8_polyglotta', '1175');
      assertContainsAll(
        combinedText,
        ['1175', 'Prajñāpāramitāhṛdaya', 'gate gate pāragate pārasaṃgate bodhi svāhā'],
        'Polyglotta vid=1175 16-witness Heart Sūtra alignment'
      );
      assertContainsAny(combinedText, ['揭諦揭諦', 'ga te ga te', 'Vaidya', 'Conze', 'T.251'], 'Quadrilingual witness columns in vid=1175');
    },
  },
  {
    id: 'T1-F10-03',
    tier: 1,
    feature: 'F10',
    title: 'Inspect Parallel Dhāraṇī & Stotra Volumes (vid=1134, 727, 207, 1020, 1264, 483&cid=456868)',
    async run() {
      const { combinedText } = getDbCorpusCombined('db8_polyglotta');
      assertContainsAll(
        combinedText,
        ['1134', '727', '207', '1020', '1264', '483'],
        'Polyglotta parallel dhāraṇī and stotra volume IDs'
      );
      assertContainsAny(combinedText, ['Tārānamaskāraikaviṃśati', 'Nirvikalpapraveśa', 'Drāmiḍāvidyārājā', 'Bhaiṣajyaguru', 'Caṇḍamahāroṣaṇa'], 'Polyglotta volume titles');
    },
  },
  {
    id: 'T1-F10-04',
    tier: 1,
    feature: 'F10',
    title: 'Inspect Mahāvyutpatti §25 (cid=335411, 13 Dhāraṇīs) & §198 (cid=338889, 103 Esoteric Terms + sGra sbyor)',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db8_polyglotta', '263');
      assertContainsAll(
        combinedText,
        ['335411', '338889', 'bodhisattvadhāraṇyaḥ', 'mantranayāvanirgatāni'],
        'Mahāvyutpatti §25 and §198 sections'
      );
      assertContainsAny(combinedText, ['vidyārājñī', 'ucchuṣma', 'amṛtakuṇḍalī', 'hayagrīva', 'sGra sbyor'], 'Mahāvyutpatti §198 esoteric terms');
    },
  },
  {
    id: 'T1-F10-05',
    tier: 1,
    feature: 'F10',
    title: 'Verify Kanjur Esoteric Prajñāpāramitā Volumes (vid=691, 689, 688, 697, 686, 685, 683)',
    async run() {
      const { combinedText } = getDbCorpusCombined('db8_polyglotta');
      assertContainsAll(
        combinedText,
        ['691', '689', '688', '697', '686', '685', '683'],
        'All 7 Kanjur esoteric Prajñāpāramitā volumes on Polyglotta'
      );
    },
  },

  // =========================================================================
  // Feature F11: DB #9 (db9_rkts): University of Vienna rKTs (Kanjur/Tanjur Concordance & Derge Zungdu)
  // =========================================================================
  {
    id: 'T1-F11-01',
    tier: 1,
    feature: 'F11',
    title: 'db9_rkts Metadata Summary, standard.xml (16,179 Works / 4,997 <skt>) & collections.json (68 Collections)',
    async run() {
      const dbs = runKosaCliJson(['dbs']);
      const db9 = findDbEntry(dbs, 'db9_rkts', 9);
      assert.ok(db9, 'dbs --json must include db9_rkts');
      const { combinedText } = getDbCorpusCombined('db9_rkts');
      assertContainsAll(combinedText, ['db9_rkts', 'rkts.org', '16179', '4997', '68'], 'rKTs standard.xml & collections.json metrics');
    },
  },
  {
    id: 'T1-F11-02',
    tier: 1,
    feature: 'F11',
    title: 'Verify Derge D/D.xml 265 Zungdu (<sec>gzungs</sec>) Items (D846–D1095) & 3,115 Tantra (<sec>rgyud</sec>) Items',
    async run() {
      const { combinedText } = getDbCorpusCombined('db9_rkts');
      assertContainsAll(combinedText, ['D846', 'D1095', 'gzungs'], 'Derge Zungdu D846–D1095 items');
      assertContainsAny(combinedText, ['265', '3115', '0985', '0986'], 'D.xml section counts and BDRC volume refs');
    },
  },
  {
    id: 'T1-F11-03',
    tier: 1,
    feature: 'F11',
    title: 'Verify Full-Text Diplomatic Zungdu Volumes 1D/100.txt & 1D/101.txt (143 rgya gar skad du/ Titles & 90+ EWTS Mantras)',
    async run() {
      const { combinedText } = getDbCorpusCombined('db9_rkts');
      assertContainsAny(combinedText, ['100.txt', '101.txt', 'rgya gar skad du', 'badzra', 'swA hA', 'svāhā'], '1D/100.txt & 101.txt diplomatic EWTS titles and mantras');
    },
  },
  {
    id: 'T1-F11-04',
    tier: 1,
    feature: 'F11',
    title: 'Verify Cross-Witness Catalog XML (K/K846.xml etc.) & tokushige-koyasan/tibetan-corpus (3,452 Derge Tantra Texts)',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db9_rkts', 'K846');
      assertContainsAny(combinedText, ['K846', 'D846', '3452', 'tibetan-corpus'], 'rKTs cross-witness K846 & tokushige-koyasan 3,452 catalog');
    },
  },
  {
    id: 'T1-F11-05',
    tier: 1,
    feature: 'F11',
    title: 'Search db9_rkts for Mahāvajrameruśikharakūṭāgāradhāraṇī (1D/101.txt 1b1) & Ucchuṣma Mantra',
    async run() {
      const searchRes = runKosaCliJson(['search', 'badzra', '--db', 'db9_rkts']);
      const { combinedText } = getDbCorpusCombined('db9_rkts');
      const allText = `${stringifyDeep(searchRes)}\n${combinedText}`;
      assertContainsAny(
        allText,
        ['badzra me ru', 'mahāvajrameru', 'kūṭāgāra', 'ts+tshuSh+ma', 'ucchuṣma'],
        'rKTs 1D/101.txt EWTS and IAST mantras'
      );
    },
  },

  // =========================================================================
  // Feature F12: DB #10 (db10_all_nibs): ALL-NIBS Dharani Preservation Project
  // =========================================================================
  {
    id: 'T1-F12-01',
    tier: 1,
    feature: 'F12',
    title: 'db10_all_nibs Metadata Summary & 106 Sanskrit Manuscript Editions (10 NIBS + 96 Varanasi)',
    async run() {
      const dbs = runKosaCliJson(['dbs']);
      const db10 = findDbEntry(dbs, 'db10_all_nibs', 10);
      assert.ok(db10, 'dbs --json must include db10_all_nibs');
      const { combinedText } = getDbCorpusCombined('db10_all_nibs');
      assertContainsAll(combinedText, ['db10_all_nibs', 'asianlegacylibrary.org', '106', 'NIBS', 'Varanasi'], 'DB #10 ALL-NIBS 106 Sanskrit MSS metadata');
    },
  },
  {
    id: 'T1-F12-02',
    tier: 1,
    feature: 'F12',
    title: 'Inspect SA00019.001 (Asha Archives MS 2145 Suvarṇaprabhāsottama, KSK-00556, Diplomatic Full Text)',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db10_all_nibs', 'SA00019.001');
      assertContainsAll(combinedText, ['SA00019.001', 'KSK-00556'], 'ALL-NIBS SA00019.001 KSK-00556');
      assertContainsAny(combinedText, ['śruti smṛti gati vijaye svāhā', 'Suvarṇa', 'sarvva'], 'SA00019.001 diplomatic mantra transcription');
    },
  },
  {
    id: 'T1-F12-03',
    tier: 1,
    feature: 'F12',
    title: 'Inspect Key Tantric & Sādhana Manuscripts (SA00016.001, SA00024.001, SA00025.001, SA00028.001, SA00005.001, SA00007.001)',
    async run() {
      const { combinedText } = getDbCorpusCombined('db10_all_nibs');
      assertContainsAll(
        combinedText,
        ['SA00016.001', 'SA00024.001', 'SA00025.001', 'SA00028.001', 'SA00005.001', 'SA00007.001'],
        'Key ALL-NIBS Tantric and Sādhana manuscript IDs'
      );
    },
  },
  {
    id: 'T1-F12-04',
    tier: 1,
    feature: 'F12',
    title: 'Verify 33+ Newar Sanskrit Dhāraṇī Witnesses from NIBS Dhāraṇī Saṃgraha (820/2949) & Grahamātṛkā (862/2990)',
    async run() {
      const { combinedText } = getDbCorpusCombined('db10_all_nibs');
      assertContainsAny(
        combinedText,
        ['Nīlakaṇṭha', 'Cundā', 'Vasudhārā', 'Vajravidāriṇī', 'Kurukullā', 'Grahamātṛkā', 'Miroj Shakya'],
        'NIBS Kathmandu Newar Sanskrit dhāraṇī witnesses'
      );
    },
  },
  {
    id: 'T1-F12-05',
    tier: 1,
    feature: 'F12',
    title: 'Search db10_all_nibs for Suvarṇaprabhāsottama Opening Mantra & Newar Nīlakaṇṭha Witness',
    async run() {
      const searchRes = runKosaCliJson(['search', 'śruti smṛti', '--db', 'db10_all_nibs']);
      const { combinedText } = getDbCorpusCombined('db10_all_nibs');
      const allText = `${stringifyDeep(searchRes)}\n${combinedText}`;
      assertContainsAll(allText, ['SA00019.001', 'śruti smṛti'], 'Search hit for SA00019.001 opening mantra');
    },
  },

  // =========================================================================
  // Feature F13: DB #11 (db11_idp_dunhuang): IDP Berlin, BnF Pelliot Sanskrit / CEToM & CBETA Dunhuang (T85 & ZW)
  // =========================================================================
  {
    id: 'T1-F13-01',
    tier: 1,
    feature: 'F13',
    title: 'DB #11 Metadata Summary & Corpus Presence',
    async run() {
      const dbs = runKosaCliJson(['dbs']);
      const db11 = findDbEntry(dbs, 'db11_idp_dunhuang', 11);
      assert.ok(db11, 'dbs --json must include db11_idp_dunhuang');
      const { combinedText } = getDbCorpusCombined('db11_idp_dunhuang');
      assertContainsAll(combinedText, ['db11_idp_dunhuang', 'idp.bbaw.de', 'cetom.univie.ac.at'], 'DB #11 IDP & CEToM provenance');
    },
  },
  {
    id: 'T1-F13-02',
    tier: 1,
    feature: 'F13',
    title: 'IDP Berlin Silk Road XML Dumps (Dalton_vanSchaik_2005 & Kudo_2006b IOL San 397)',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db11_idp_dunhuang', 'IOL San 397');
      assertContainsAll(combinedText, ['Dalton_vanSchaik_2005', 'IOL San 397'], 'IDP Dalton_vanSchaik_2005 and Kudo_2006b IOL San 397');
      assertContainsAny(combinedText, ['Kudo_2006b', 'Ch.00262', 'amāñi vihi phali', 'sarvarājav'], 'IOL San 397 Dunhuang vidyārājñī charm transcription');
    },
  },
  {
    id: 'T1-F13-03',
    tier: 1,
    feature: 'F13',
    title: 'Khotanese & Hoernle Brāhmī Dhāraṇī Fragments (Wille_2009a, BLSF_II_04, SHT)',
    async run() {
      const { combinedText } = getDbCorpusCombined('db11_idp_dunhuang');
      assertContainsAny(combinedText, ['Wille_2009a', 'BLSF_II_04', 'Or.15001', 'Or.15009', 'kuṃdhari', 'SHT'], 'Khotanese and Hoernle Brāhmī fragments');
    },
  },
  {
    id: 'T1-F13-04',
    tier: 1,
    feature: 'F13',
    title: 'University of Vienna CEToM Pelliot Sanskrit (PS) & Kizil THT 3187 Nīlakaṇṭha Dhāraṇī',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db11_idp_dunhuang', 'THT 3187');
      assertContainsAll(combinedText, ['THT 3187', 'kāruṇikāya'], 'CEToM Kizil THT 3187 Nīlakaṇṭha Brāhmī manuscript');
      assertContainsAny(combinedText, ['Pelliot', 'psbl', 'psuv67', 'cara vicara', 'SHT 1815'], 'CEToM Pelliot Sanskrit & THT 3187 details');
    },
  },
  {
    id: 'T1-F13-05',
    tier: 1,
    feature: 'F13',
    title: 'CBETA Dunhuang T85 & Zangwai Fojiao Wenxian (ZW) Esoteric Ritual Texts',
    async run() {
      const { combinedText } = inspectDbRecordResilient('db11_idp_dunhuang', 'T85n2880');
      assertContainsAll(combinedText, ['T85n2880', 'T85n2898'], 'CBETA Dunhuang T85 texts');
      assertContainsAny(combinedText, ['ZW01n0011', 'ZW03n0023', 'ZW06n0051', 'ZW06n0055', 'ZW11n0091', 'ZW11n0092'], 'CBETA Dunhuang ZW esoteric texts');
    },
  },

  // =========================================================================
  // Feature F14: DB #12 (db12_muktabodha_ochs): Muktabodha 499 Tantric Texts, ERC DHARMA & Oxford OCHS Bīja Lexicons
  // =========================================================================
  {
    id: 'T1-F14-01',
    tier: 1,
    feature: 'F14',
    title: 'DB #12 Metadata Summary & Corpus Presence',
    async run() {
      const dbs = runKosaCliJson(['dbs']);
      const db12 = findDbEntry(dbs, 'db12_muktabodha_ochs', 12);
      assert.ok(db12, 'dbs --json must include db12_muktabodha_ochs');
      const { combinedText } = getDbCorpusCombined('db12_muktabodha_ochs');
      assertContainsAll(combinedText, ['db12_muktabodha_ochs', 'muktabodha', 'ochs'], 'DB #12 Muktabodha & OCHS metadata');
    },
  },
  {
    id: 'T1-F14-02',
    tier: 1,
    feature: 'F14',
    title: 'Muktabodha Tantric Mantra & Bīja Lexicons (M00247, M00292, M00635, M00229, M00626, M00018)',
    async run() {
      const { combinedText } = getDbCorpusCombined('db12_muktabodha_ochs');
      assertContainsAll(
        combinedText,
        ['M00247', 'M00292', 'M00635', 'M00229', 'M00626', 'M00018'],
        'Muktabodha Tantric lexicon IDs'
      );
      assertContainsAll(
        combinedText,
        ['Uddhārakośa', 'Mantrakoṣa', 'Advayavajrasaṃgraha'],
        'Muktabodha Tantric lexicon titles'
      );
    },
  },
  {
    id: 'T1-F14-03',
    tier: 1,
    feature: 'F14',
    title: 'ERC DHARMA Critical Editions (Sarvatathāgatatattvasaṅgraha & Sarvavajrodayā)',
    async run() {
      const { combinedText } = getDbCorpusCombined('db12_muktabodha_ochs');
      assertContainsAny(combinedText, ['stts_crited', 'Sarvatathāgatatattvasaṅgraha', 'Sarvatathāgatatattvasaṃgraha'], 'ERC DHARMA STTS critical edition');
      assertContainsAny(combinedText, ['svu_crited', 'Sarvavajrodayā'], 'ERC DHARMA Sarvavajrodayā critical edition');
    },
  },
  {
    id: 'T1-F14-04',
    tier: 1,
    feature: 'F14',
    title: 'Oxford OCHS Bījanighaṇṭu (#30) & Ekākṣarakośa (#46) Verse Lexicons',
    async run() {
      const { combinedText } = getDbCorpusCombined('db12_muktabodha_ochs');
      assertContainsAll(
        combinedText,
        ['bijanighantu', 'ekaksarakosa'],
        'Oxford OCHS Bījanighaṇṭu (#30) and Ekākṣarakośa (#46)'
      );
      assertContainsAny(combinedText, ['krodhabīja', 'vāgbhava', 'pitṛbhūvāsinī', 'mantrakosa', 'matrkarnanighantu'], 'OCHS verse lexicon excerpts');
    },
  },
  {
    id: 'T1-F14-05',
    tier: 1,
    feature: 'F14',
    title: 'Muktabodha 499-Work Catalog Metadata & Searchability',
    async run() {
      const searchRes = runKosaCliJson(['search', 'M00247', '--db', 'db12_muktabodha_ochs']);
      const { combinedText } = getDbCorpusCombined('db12_muktabodha_ochs');
      const allText = `${stringifyDeep(searchRes)}\n${combinedText}`;
      assertContainsAll(allText, ['M00247', 'Uddhārakośa', '499'], 'Muktabodha M00247 & 499-work catalog');
    },
  },

  // =========================================================================
  // Feature F15: Unified 12-Database Cross-Canonical Concordance, Quadrilingual Glossary & Bīja Decipherment Engine
  // =========================================================================
  {
    id: 'T1-F15-01',
    tier: 1,
    feature: 'F15',
    title: 'Cross-Canonical Concordance Resolution by Taishō / Tohoku / Sanskrit Title',
    async run() {
      const concHeart = runKosaCliJson(['concordance', 'Prajñāpāramitāhṛdaya']);
      const concRelics = runKosaCliJson(['concordance', 'Toh 507']);
      const heartStr = stringifyDeep(concHeart);
      const relicsStr = stringifyDeep(concRelics);
      assertContainsAny(heartStr, ['T0251', 'T08n0251', '1175', 'F27n1056', 'prajnhsu'], 'Heart Sūtra cross-canonical links');
      assertContainsAny(relicsStr, ['507', '883', '1022A', 'T19n1022A', 'Guhyadhātu', 'dhātukaraṇḍa'], 'Toh 507 / 883 Secret Relics concordance');
    },
  },
  {
    id: 'T1-F15-02',
    tier: 1,
    feature: 'F15',
    title: 'Unified Quadrilingual Glossary Integration (84000 + Mahāvyutpatti §25/§198 + T54)',
    async run() {
      const searchRes = runKosaCliJson(['search', 'dhāraṇī']);
      const regSrc = readProjectFile('src/data/unifiedCorpusRegistry.ts');
      const combined = `${stringifyDeep(searchRes)}\n${regSrc}`;
      assertContainsAny(combined, ['gzungs', '總持', '陀羅尼', 'dhāraṇī'], 'Unified quadrilingual glossary entries for dhāraṇī');
    },
  },
  {
    id: 'T1-F15-03',
    tier: 1,
    feature: 'F15',
    title: 'Tantric Bīja Seed-Syllable Decipherment Engine (oṃ, hūṃ, hrīḥ, krīṃ, aiṃ, phaṭ, svāhā)',
    async run() {
      const bijaHum = runKosaCliJson(['bija', 'hūṃ']);
      const bijaKrim = runKosaCliJson(['bija', 'krīṃ']);
      const bijaAim = runKosaCliJson(['bija', 'aiṃ']);
      const humStr = stringifyDeep(bijaHum);
      const krimStr = stringifyDeep(bijaKrim);
      const aimStr = stringifyDeep(bijaAim);
      assertContainsAny(humStr, ['hūṃ', 'हूं', '吽', 'krodha', 'vyomāsya', 'Vajra'], 'Bīja decipherment for hūṃ');
      assertContainsAny(krimStr, ['krīṃ', 'क्रीं', 'Kālī', 'pitṛbhūvāsinī', 'bīja'], 'Bīja decipherment for krīṃ');
      assertContainsAny(aimStr, ['aiṃ', 'ऐं', 'vāgbhava', 'Sarasvatī', 'Mañjuśrī'], 'Bīja decipherment for aiṃ');
    },
  },
  {
    id: 'T1-F15-04',
    tier: 1,
    feature: 'F15',
    title: 'Unified Multi-Script Search Across All 12 Databases (searchEngine.ts)',
    async run() {
      const resAvalokita = runKosaCliJson(['search', 'Avalokiteśvara']);
      const resUsnisa = runKosaCliJson(['search', 'Uṣṇīṣavijayā']);
      const combined = `${stringifyDeep(resAvalokita)}\n${stringifyDeep(resUsnisa)}`;
      const matchedDbs = CANONICAL_DB_IDS.filter((id) => combined.includes(id));
      assert.ok(matchedDbs.length >= 3, `Expected search across all 12 DBs to span >= 3 DBs, matched: ${matchedDbs.join(', ')}`);
    },
  },
  {
    id: 'T1-F15-05',
    tier: 1,
    feature: 'F15',
    title: 'Unified 12-Database Registry Integrity (UNIFIED_12_DATABASES)',
    async run() {
      const dbsPayload = runKosaCliJson(['dbs']);
      for (let i = 0; i < CANONICAL_DB_IDS.length; i++) {
        const dbId = CANONICAL_DB_IDS[i];
        const entry = findDbEntry(dbsPayload, dbId, i + 1);
        assert.ok(entry, `Expected dbs --json to contain entry for ${dbId} (#${i + 1})`);
        const total = entry.totalRecordsCount ?? entry.recordCount ?? entry.count ?? 1;
        assert.ok(total > 0, `Expected ${dbId} totalRecordsCount > 0, got ${total}`);
      }
    },
  },

  // =========================================================================
  // Feature F16: Interactive React Web Application & Deterministic CLI (scripts/kosa-cli.mjs)
  // =========================================================================
  {
    id: 'T1-F16-01',
    tier: 1,
    feature: 'F16',
    title: 'CLI stats --json & verify-all --json Complete System Telemetry',
    async run() {
      const stats = runKosaCliJson(['stats']);
      const verifyAll = runKosaCliJson(['verify-all']);
      const statsStr = stringifyDeep(stats);
      const verifyStr = stringifyDeep(verifyAll);
      for (const dbId of CANONICAL_DB_IDS) {
        assert.ok(
          statsStr.includes(dbId) || verifyStr.includes(dbId),
          `Expected stats/verify-all telemetry to include ${dbId}`
        );
      }
    },
  },
  {
    id: 'T1-F16-02',
    tier: 1,
    feature: 'F16',
    title: 'CLI All 8 Subcommands Deterministic Execution (stats, dbs, inspect, search, concordance, phonetics, bija, verify-all)',
    async run() {
      const subcommands = [
        ['stats'],
        ['dbs'],
        ['inspect', 'db1_fangshan'],
        ['search', 'svāhā'],
        ['concordance', 'Prajñāpāramitāhṛdaya'],
        ['phonetics', 'oṃ āḥ hūṃ'],
        ['bija', 'oṃ'],
        ['verify-all'],
      ];
      for (const cmd of subcommands) {
        const res = runKosaCliJson(cmd);
        assert.ok(res && typeof res === 'object', `Subcommand "${cmd.join(' ')}" must return a valid JSON object/array`);
      }
    },
  },
  {
    id: 'T1-F16-03',
    tier: 1,
    feature: 'F16',
    title: 'Production Build (npm run build) & Bundled Assets Verification',
    async run() {
      assert.ok(fileExists('package.json'), 'package.json must exist');
      assert.ok(fileExists('public/fonts/NotoSansSiddham-Regular.woff2'), 'Siddhaṃ WOFF2 font must exist');
      if (fileExists('dist/index.html')) {
        const distHtml = readProjectFile('dist/index.html');
        assert.ok(distHtml.includes('<div id="root"'), 'dist/index.html must contain React #root mount node');
        const distAssets = findFilesRecursive('dist', (r) => r.endsWith('.js') || r.endsWith('.css'));
        assert.ok(distAssets.length >= 2, 'dist/ must contain compiled JS and CSS bundles');
      } else {
        const indexHtml = readProjectFile('index.html');
        assert.ok(indexHtml.includes('root'), 'index.html must contain root element');
      }
    },
  },
  {
    id: 'T1-F16-04',
    tier: 1,
    feature: 'F16',
    title: 'Interactive React Web UI Architecture & 7 Core Workbenches (src/App.tsx & src/components/**)',
    async run() {
      const appSrc = readProjectFile('src/App.tsx');
      const compFiles = findFilesRecursive('src/components', (r) => r.endsWith('.tsx') || r.endsWith('.ts'));
      const allUiSrc = [appSrc, ...compFiles.map((f) => readProjectFileOptional(f))].join('\n');
      assert.ok(allUiSrc.length > 2000, 'React UI source must be substantively implemented');
      assertContainsAny(allUiSrc, ['db1_fangshan', 'UNIFIED_12_DATABASES', 'Database'], 'Workbench 1: 12-Database Hub Explorer');
      assertContainsAny(allUiSrc, ['136.1', 'sanskritAudioEngine', 'phonetics', 'Guru', 'Laghu'], 'Workbench 2: Multi-Script Reader & Audio');
      assertContainsAny(allUiSrc, ['二合', '三合', 'F28n1071', 'Interlinear', 'cb:tt'], 'Workbench 3: Fangshan & T54 Interlinear Viewer');
      assertContainsAny(allUiSrc, ['Polyglotta', '1175', 'Parallel', 'Witness', 'concordance'], 'Workbench 4: Multi-Witness Parallel Alignment Studio');
      assertContainsAny(allUiSrc, ['IIIF', 'MS-ADD-01326', 'CUDL', 'cudl'], 'Workbench 5: CUDL IIIF Palm-Leaf Viewer');
      assertContainsAny(allUiSrc, ['Bīja', 'bija', '十八章', '18', 'Siddhaṃ', 'Siddham'], 'Workbench 6: Siddhaṃ 18-Chapter & Bīja Decipherer');
    },
  },
  {
    id: 'T1-F16-05',
    tier: 1,
    feature: 'F16',
    title: 'Web UI Data Wiring to Unified 12-Database Registry & Audio/Phonetic Engines',
    async run() {
      const appSrc = readProjectFile('src/App.tsx');
      const compFiles = findFilesRecursive('src/components', (r) => r.endsWith('.tsx') || r.endsWith('.ts'));
      const allUiSrc = [appSrc, ...compFiles.map((f) => readProjectFileOptional(f))].join('\n');
      assertContainsAny(
        allUiSrc,
        ['unifiedCorpusRegistry', 'concordanceEngine', 'bijaLexiconEngine', 'searchEngine', 'transliterator', 'prosody'],
        'React UI must import core engines and unified corpus registry'
      );
    },
  },
];
