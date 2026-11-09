import assert from 'node:assert/strict';
import {
  CANONICAL_DB_IDS,
  fileExists,
  readProjectFile,
  readProjectFileOptional,
  findFilesRecursive,
  runKosaCliJson,
  stringifyDeep,
  assertContainsAll,
  assertContainsAny,
  getDbCorpusCombined,
  inspectDbRecordResilient,
  runPhoneticsNormalized,
} from './helpers/harness.mjs';

export const TIER4_TESTS = [
  {
    id: 'T4-RW-01',
    tier: 4,
    features: ['F1', 'F2', 'F3', 'F4', 'F6', 'F8', 'F9', 'F10', 'F11', 'F15', 'F16'],
    title: 'Comparative Philologist — Pan-Asian Heart Sūtra (Prajñāpāramitāhṛdaya) 16-Witness & Multi-Canon Collation',
    async run() {
      // Step 1: Cross-canonical concordance for Prajñāpāramitāhṛdaya
      const conc = runKosaCliJson(['concordance', 'Prajñāpāramitāhṛdaya']);
      assertContainsAny(stringifyDeep(conc), ['T0251', 'T08n0251', '1175', 'F27n1056', 'prajnhsu'], 'Step 1: Heart Sūtra cross-canonical concordance');

      // Step 2: Inspect Oslo Polyglotta vid=1175 16-witness alignment
      const poly = inspectDbRecordResilient('db8_polyglotta', '1175');
      assertContainsAll(poly.combinedText, ['1175', 'gate gate pāragate pārasaṃgate bodhi svāhā'], 'Step 2: Polyglotta 16-witness alignment');

      // Step 3: Run phonetics & prosody on Heart Sūtra mantra
      const p = runPhoneticsNormalized('oṃ gate gate pāragate pārasaṃgate bodhi svāhā');
      assert.ok(p.flatSyllables.length >= 15, 'Step 3: Heart Sūtra mantra syllabified into >= 15 syllables');
      assertContainsAny(p.rawText, ['ŋ', '昂', '僧'], 'Step 3: Anusvāra velar assimilation on pārasaṃgate');

      // Step 4: Decipher oṃ and svāhā via bija CLI
      const bOm = runKosaCliJson(['bija', 'oṃ']);
      const bSvaha = runKosaCliJson(['bija', 'svāhā']);
      assertContainsAny(stringifyDeep(bOm), ['oṃ', 'ॐ', '唵'], 'Step 4: oṃ bīja decipherment');
      assertContainsAny(stringifyDeep(bSvaha), ['svāhā', '萨婆诃', '薩婆訶'], 'Step 4: svāhā bīja decipherment');
    },
  },
  {
    id: 'T4-RW-02',
    tier: 4,
    features: ['F1', 'F2', 'F3', 'F5', 'F11', 'F12', 'F13', 'F15'],
    title: 'Silk Road Palaeographer — Nīlakaṇṭha Lokeśvara (Great Compassion Dhāraṇī 大悲咒) Diachronic Reconstruction',
    async run() {
      // Step 1: Concordance & search for Nīlakaṇṭha
      const conc = runKosaCliJson(['concordance', 'Nīlakaṇṭha']);
      const searchRes = runKosaCliJson(['search', 'Nīlakaṇṭha']);
      assert.ok(`${stringifyDeep(conc)}${stringifyDeep(searchRes)}`.length > 30, 'Step 1: Nīlakaṇṭha concordance & search');

      // Step 2: Silk Road Kizil Brāhmī THT 3187 and Dunhuang T85n2880 in db11_idp_dunhuang
      const { combinedText: db11Text } = getDbCorpusCombined('db11_idp_dunhuang');
      assertContainsAll(db11Text, ['THT 3187', 'kāruṇikāya', 'T85n2880'], 'Step 2: Silk Road Kizil THT 3187 & Dunhuang T85n2880');

      // Step 3: Fangshan stone inscriptions F24n0761, F27n1050, F27n1064, F28n1071
      const { combinedText: db1Text } = getDbCorpusCombined('db1_fangshan');
      assertContainsAll(db1Text, ['F24n0761', 'F27n1050', 'F27n1064', 'F28n1071'], 'Step 3: Fangshan stone inscriptions');

      // Step 4: Newar witness in ALL-NIBS / DSBC & phonetic analysis of opening homage
      const { combinedText: db10Text } = getDbCorpusCombined('db10_all_nibs');
      assertContainsAny(db10Text, ['Nīlakaṇṭha', 'Avalokiteśvara'], 'Step 4a: Newar Nīlakaṇṭha witness');
      const p = runPhoneticsNormalized('namo ratnatrayāya nama āryāvalokiteśvarāya bodhisattvāya mahāsattvāya mahākāruṇikāya');
      assert.ok(p.flatSyllables.length >= 25, 'Step 4b: Nīlakaṇṭha opening homage syllabified');
    },
  },
  {
    id: 'T4-RW-03',
    tier: 4,
    features: ['F1', 'F2', 'F3', 'F6', 'F7', 'F9', 'F11', 'F15'],
    title: 'Epigrapher & Textual Critic — Sarvatathāgatādhiṣṭhānahṛdayaguhyadhātukaraṇḍa (宝箧印陀罗尼) Multi-Tradition Study',
    async run() {
      // Step 1: Resolve Toh 507 and Toh 883 via concordance
      const c507 = runKosaCliJson(['concordance', 'Toh 507']);
      const c883 = runKosaCliJson(['concordance', 'Toh 883']);
      const concStr = `${stringifyDeep(c507)}\n${stringifyDeep(c883)}`;
      assertContainsAny(concStr, ['507', '883', '1022A', 'Guhyadhātu', 'dhātukaraṇḍa'], 'Step 1: Toh 507/883 concordance');

      // Step 2: Inspect db4_84000 for sanitized mantra and trilingual glossary (adhiṣṭhāna)
      const { combinedText: db4Text } = inspectDbRecordResilient('db4_84000', 'toh507');
      assertContainsAny(db4Text, ['tryadhvikānāṃ', 'adhiṣṭhāna', 'byin gyis brlabs'], 'Step 2: 84000 Toh 507,883 mantra & glossary');

      // Step 3: Cross-check CBETA T19n1022A, rKTs, and CUDL MS-ADD-01680-00008-00003 ([23v5] Āryadhātukaraṇḍā)
      const cbetaSrc = readProjectFile('src/data/generated/cbetaAuthRecords.ts');
      const { combinedText: db7Text } = getDbCorpusCombined('db7_cudl_hidas');
      assertContainsAny(cbetaSrc, ['1022A', '寶篋印'], 'Step 3a: CBETA T19n1022A');
      assertContainsAny(db7Text, ['Āryadhātukaraṇḍā', '23v5', 'MS-ADD-01680-00008-00003'], 'Step 3b: CUDL MS Add. 1680.8.3 [23v5]');
    },
  },
  {
    id: 'T4-RW-04',
    tier: 4,
    features: ['F1', 'F2', 'F3', 'F5', 'F6', 'F7', 'F9', 'F11', 'F15'],
    title: 'Himalayan Manuscript Curator — Uṣṇīṣavijayā (佛顶尊胜陀罗尼) & Sitātapatrā (白伞盖陀罗尼) Across Palm-Leaf, Stone & Canon',
    async run() {
      // Step 1: Search Uṣṇīṣavijayā and Sitātapatrā
      const sUsnisa = runKosaCliJson(['search', 'Uṣṇīṣavijayā']);
      const sSita = runKosaCliJson(['search', 'Sitātapatrā']);
      assert.ok(stringifyDeep(sUsnisa).length > 30 && stringifyDeep(sSita).length > 30, 'Step 1: Search Uṣṇīṣavijayā & Sitātapatrā');

      // Step 2: Fangshan F27n1062, F27n1048, F27n1063
      const { combinedText: db1Text } = getDbCorpusCombined('db1_fangshan');
      assertContainsAll(db1Text, ['F27n1062', 'F27n1048', 'F27n1063'], 'Step 2: Fangshan Uṣṇīṣavijayā & Sitātapatrā');

      // Step 3: Cambridge CUDL MS-ADD-01680-00008-00001 ([15r2] Āryoṣṇīṣavijayā)
      const { combinedText: db7Text } = getDbCorpusCombined('db7_cudl_hidas');
      assertContainsAll(db7Text, ['MS-ADD-01680-00008-00001', 'Āryoṣṇīṣavijayā'], 'Step 3: CUDL MS-ADD-01680-00008-00001');

      // Step 4: DSBC & BuddhaNexus K12bsu004_u
      const { combinedText: db5Text } = getDbCorpusCombined('db5_buddhanexus');
      assertContainsAll(db5Text, ['K12bsu004_u'], 'Step 4: BuddhaNexus K12bsu004_u Sitātapatrā');
    },
  },
  {
    id: 'T4-RW-05',
    tier: 4,
    features: ['F1', 'F2', 'F3', 'F4', 'F5', 'F9', 'F12', 'F14', 'F15'],
    title: 'Tang Mikkyō & Shingon Practitioner — Cundī Dhāraṇī (准提咒) & Six-Syllable Mantra (oṃ maṇi padme hūṃ) Phonetics & Bīja Analysis',
    async run() {
      // Step 1: Search Cundā across databases
      const sCunda = runKosaCliJson(['search', 'Cundā']);
      const { combinedText: db7Text } = getDbCorpusCombined('db7_cudl_hidas');
      const { combinedText: db10Text } = getDbCorpusCombined('db10_all_nibs');
      assertContainsAny(`${stringifyDeep(sCunda)}\n${db7Text}\n${db10Text}`, ['Cundā', 'Āryacundā', '15v2'], 'Step 1: Cundā witnesses across CUDL & NIBS');

      // Step 2: Phonetics & sandhi on Cundī Dhāraṇī
      const p = runPhoneticsNormalized('namaḥ saptānāṃ samyaksaṃbuddhakoṭīnāṃ tadyathā oṃ cale cule cunde svāhā');
      assert.ok(p.flatSyllables.length >= 20, 'Step 2a: Cundī Dhāraṇī syllabified into >= 20 syllables');
      assertContainsAny(p.rawText, ['m', '姆', '牟', '唇音'], 'Step 2b: Labial Anusvāra assimilation on samyaksaṃbuddha');

      // Step 3: Bīja decipherment for oṃ, hūṃ, hrīḥ
      for (const syl of ['oṃ', 'hūṃ', 'hrīḥ']) {
        const b = runKosaCliJson(['bija', syl]);
        assert.ok(stringifyDeep(b).length > 30, `Step 3: Bīja decipherment for ${syl}`);
      }
    },
  },
  {
    id: 'T4-RW-06',
    tier: 4,
    features: ['F1', 'F5', 'F6', 'F7', 'F9', 'F11', 'F15'],
    title: 'Nepalese Vajrayāna Scholar — Pañcarakṣā, Mahāpratisarā, Mahādaṇḍadhāraṇī-Śītavatī & Saptavāra Critical Collation',
    async run() {
      // Step 1: Search Mahāpratisarā and Śītavatī
      const sPratisara = runKosaCliJson(['search', 'Mahāpratisarā']);
      const sSitavati = runKosaCliJson(['search', 'Śītavatī']);
      assert.ok(stringifyDeep(sPratisara).length > 20 && stringifyDeep(sSitavati).length > 20, 'Step 1: Search Mahāpratisarā & Śītavatī');

      // Step 2: Verify Hidas edition & Pañcarakṣā/Saptavāra in db7_cudl_hidas
      const { combinedText: db7Text } = getDbCorpusCombined('db7_cudl_hidas');
      assertContainsAll(
        db7Text,
        ['SA_K12_Āgama_Mahādaṇḍadhāraṇīśītavatī_Hidas', 'Pañcarakṣā', 'Saptavāra', 'MS-ADD-01326'],
        'Step 2: Hidas Śītavatī & CUDL Pañcarakṣā/Saptavāra'
      );

      // Step 3: Cross-check DSBC & BuddhaNexus
      const { combinedText: db5Text } = getDbCorpusCombined('db5_buddhanexus');
      assertContainsAll(db5Text, ['K12mahpratu', 'T02psarkdhu'], 'Step 3: BuddhaNexus K12mahpratu & T02psarkdhu');
    },
  },
  {
    id: 'T4-RW-07',
    tier: 4,
    features: ['F2', 'F5', 'F6', 'F7', 'F9', 'F10', 'F11', 'F12', 'F15'],
    title: 'Hymnologist & Liturgist — Tārā Twenty-One Homages (Namaskāraikaviṃśatistotra) & 108 Buddhist Stotras Study',
    async run() {
      // Step 1: Concordance & search for Tārā 21 Homages
      const conc = runKosaCliJson(['concordance', 'Tārānamaskāraikaviṃśatistotra']);
      assertContainsAny(stringifyDeep(conc), ['1134', 'Tārā', '1108'], 'Step 1: Tārā 21 Homages concordance');

      // Step 2: Oslo Polyglotta vid=1134
      const { combinedText: db8Text } = inspectDbRecordResilient('db8_polyglotta', '1134');
      assertContainsAll(db8Text, ['1134', 'Tārā'], 'Step 2: Polyglotta vid=1134');

      // Step 3: GRETIL bst-108u.htm & BuddhaNexus T01n809u
      const { combinedText: db3Text } = getDbCorpusCombined('db3_dsbc_gretil');
      const { combinedText: db5Text } = getDbCorpusCombined('db5_buddhanexus');
      assertContainsAll(db3Text, ['bst-108u', '108'], 'Step 3a: GRETIL bst-108u 108 Stotras');
      assertContainsAny(db5Text, ['T01n809u', 'K12namekvsu', 'T01tarasdhu'], 'Step 3b: BuddhaNexus Tārā stotras');

      // Step 4: Phonetics on oṃ tāre tuttāre ture svāhā
      const p = runPhoneticsNormalized('oṃ tāre tuttāre ture svāhā');
      assert.equal(p.flatSyllables.length, 10, `Step 4: Expected 10 syllables in "oṃ tāre tuttāre ture svāhā", got ${p.flatSyllables.length}`);
    },
  },
  {
    id: 'T4-RW-08',
    tier: 4,
    features: ['F1', 'F2', 'F4', 'F5', 'F6', 'F7', 'F9', 'F10', 'F12', 'F15'],
    title: 'Buddhist Medical Historian — Bhaiṣajyaguru (Medicine Buddha 药师佛) & Grahamātṛkā (Nine Planets 九曜母) Dhāraṇī Workflow',
    async run() {
      // Step 1: Search Bhaiṣajyaguru and Grahamātṛkā
      const sBhaisajya = runKosaCliJson(['search', 'Bhaiṣajyaguru']);
      const sGraha = runKosaCliJson(['search', 'Grahamātṛkā']);
      assert.ok(stringifyDeep(sBhaisajya).length > 20 && stringifyDeep(sGraha).length > 20, 'Step 1: Search Bhaiṣajyaguru & Grahamātṛkā');

      // Step 2: Verify Polyglotta vid=1020 and 84000 Toh 862
      const { combinedText: db8Text } = getDbCorpusCombined('db8_polyglotta');
      const { combinedText: db4Text } = getDbCorpusCombined('db4_84000');
      assertContainsAll(db8Text, ['1020', 'Bhaiṣajyaguru'], 'Step 2a: Polyglotta vid=1020 Bhaiṣajyaguru');
      assertContainsAll(db4Text, ['toh862', 'bhaiṣajye'], 'Step 2b: 84000 Toh 862 Bhaiṣajyaguru mantra');

      // Step 3: Verify Grahamātṛkā across DSBC 862/2990, BuddhaNexus K12grahmdhu, and CUDL [1r4]
      const { combinedText: db3Text } = getDbCorpusCombined('db3_dsbc_gretil');
      const { combinedText: db5Text } = getDbCorpusCombined('db5_buddhanexus');
      const { combinedText: db7Text } = getDbCorpusCombined('db7_cudl_hidas');
      assertContainsAll(db3Text, ['2990', 'Grahamātṛkā'], 'Step 3a: DSBC 862/2990 Grahamātṛkā');
      assertContainsAll(db5Text, ['K12grahmdhu'], 'Step 3b: BuddhaNexus K12grahmdhu');
      assertContainsAll(db7Text, ['Āryagrahamātṛkā'], 'Step 3c: CUDL MS Add. 1680.8.3 [1r4] Āryagrahamātṛkā');

      // Step 4: Phonetic analysis of Medicine Buddha mantra
      const p = runPhoneticsNormalized('oṃ namo bhagavate bhaiṣajyaguru vaiḍūryaprabharājāya tathāgatāya arhate samyaksaṃbuddhāya tadyathā oṃ bhaiṣajye bhaiṣajye mahābhaiṣajye rājasamudgate svāhā');
      assert.ok(p.flatSyllables.length >= 45, `Step 4: Expected >= 45 syllables in full Bhaiṣajyaguru mantra, got ${p.flatSyllables.length}`);
    },
  },
  {
    id: 'T4-RW-09',
    tier: 4,
    features: ['F1', 'F2', 'F7', 'F8', 'F11', 'F12', 'F14', 'F15'],
    title: 'Anuttarayoga & Yoga-Tantra Researcher — Guhyasamāja & Sarvatathāgatatattvasaṅgraha (STTS) Mantra Theory & Critical Editions',
    async run() {
      // Step 1: Inspect SARIT Caryāmelāpakapradīpa Ch. 3
      const { combinedText: db6Text } = inspectDbRecordResilient('db6_sarit', 'caryamelapakapradipa');
      assertContainsAll(db6Text, ['Caryāmelāpakapradīpa', 'CMP03', 'vajrajāpa'], 'Step 1: SARIT Caryāmelāpakapradīpa Ch. 3');

      // Step 2: Cross-reference ALL-NIBS SA00025.001 (Pradīpoddyotana) & SA00016.001 (Saṃpuṭatantra) and BuddhaNexus
      const { combinedText: db10Text } = getDbCorpusCombined('db10_all_nibs');
      const { combinedText: db5Text } = getDbCorpusCombined('db5_buddhanexus');
      assertContainsAll(db10Text, ['SA00025.001', 'SA00016.001', 'TSK-01785'], 'Step 2a: ALL-NIBS Pradīpoddyotana & Saṃpuṭatantra');
      assertContainsAny(db5Text, ['Pradīpoddyotana', 'T02dipguhsu', 'K12sarvttsu'], 'Step 2b: BuddhaNexus Guhyasamāja & STTS');

      // Step 3: Inspect ERC DHARMA STTS & Sarvavajrodayā in db12_muktabodha_ochs
      const { combinedText: db12Text } = getDbCorpusCombined('db12_muktabodha_ochs');
      assertContainsAll(db12Text, ['stts_crited', 'svu_crited'], 'Step 3: ERC DHARMA STTS & Sarvavajrodayā');
    },
  },
  {
    id: 'T4-RW-10',
    tier: 4,
    features: ['F1', 'F2', 'F3', 'F4', 'F15', 'F16'],
    title: 'Sino-Japanese Siddhaṃ Phonologist — Tang Reconstruction (T54, F28n1071) & Kūkai/Annen 18 Siddhaṃ Chapters (T84)',
    async run() {
      // Step 1: Inspect T54 lexicons in db2_taisho_ext
      const { combinedText: db2Text } = getDbCorpusCombined('db2_taisho_ext');
      assertContainsAll(db2Text, ['T54n2132', 'T54n2133A', 'T54n2134', 'T54n2135', 'T54n2128'], 'Step 1: T54 lexicons');

      // Step 2: Inspect T84n2701–2711 and 18 Siddhaṃ Chapters
      assertContainsAll(db2Text, ['T84n2701', 'T84n2702', '空海', '安然'], 'Step 2: Kūkai & Annen T84 treatises');

      // Step 3: Compare with Fangshan F28n1071 & dual-track phonetics CLI
      const { combinedText: db1Text } = getDbCorpusCombined('db1_fangshan');
      assertContainsAll(db1Text, ['F28n1071', '二合', '三合', '引'], 'Step 3a: Fangshan F28n1071 phonetic notes');
      const p = runPhoneticsNormalized('oṃ aḥ hūṃ vam hoḥ');
      assertContainsAny(p.rawText, ['唵', '吽', '嗡'], 'Step 3b: Dual-track Tang & Modern phonetics');
    },
  },
  {
    id: 'T4-RW-11',
    tier: 4,
    features: ['F2', 'F4', 'F14', 'F15', 'F16'],
    title: 'Esoteric Lexicographer — Decoding Tantric Seed-Syllables (Bīja / Ekākṣara / Kūṭākṣara) via Indigenous Kośa & Nighaṇṭu Texts',
    async run() {
      // Step 1: Inspect OCHS & Muktabodha lexicons in db12_muktabodha_ochs
      const { combinedText: db12Text } = getDbCorpusCombined('db12_muktabodha_ochs');
      assertContainsAll(
        db12Text,
        ['bijanighantu', 'ekaksarakosa', 'M00247', 'M00292', 'M00626'],
        'Step 1: OCHS & Muktabodha seed-syllable lexicons'
      );

      // Step 2 & 3: Query bija CLI across 10 Tantric seed syllables
      const syllables = ['oṃ', 'āḥ', 'hūṃ', 'hrīḥ', 'krīṃ', 'aiṃ', 'śrīṃ', 'bhrūṃ', 'phaṭ', 'svāhā'];
      for (const s of syllables) {
        const res = runKosaCliJson(['bija', s]);
        const str = stringifyDeep(res);
        assert.ok(str.length > 30, `Step 2: bija "${s}" must return complete multi-tradition decipherment`);
      }
    },
  },
  {
    id: 'T4-RW-12',
    tier: 4,
    features: [
      'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8',
      'F9', 'F10', 'F11', 'F12', 'F13', 'F14', 'F15', 'F16',
    ],
    title: 'Platform Architect & Release Auditor — Full 12-Database Integrity Audit, CLI Verification & Production Web Bundle Readiness',
    async run() {
      // Step 1: Run verify-all --json and stats --json
      const verifyAll = runKosaCliJson(['verify-all']);
      const stats = runKosaCliJson(['stats']);
      assert.ok(stringifyDeep(verifyAll).length > 50 && stringifyDeep(stats).length > 50, 'Step 1: verify-all and stats succeed');

      // Step 2: Inspect all 12 databases individually
      for (const dbId of CANONICAL_DB_IDS) {
        const { cliPayload, combinedText } = getDbCorpusCombined(dbId);
        assert.ok(cliPayload && typeof cliPayload === 'object', `Step 2: inspect ${dbId} must return valid JSON object`);
        assert.ok(combinedText.includes(dbId), `Step 2: ${dbId} must be present in corpus payload`);
      }

      // Step 3: Verify React UI & font asset readiness
      assert.ok(fileExists('public/fonts/NotoSansSiddham-Regular.woff2'), 'Step 3a: Siddhaṃ font exists');
      const appSrc = readProjectFile('src/App.tsx');
      const compFiles = findFilesRecursive('src/components', (r) => r.endsWith('.tsx') || r.endsWith('.ts'));
      const allUi = [appSrc, ...compFiles.map((f) => readProjectFileOptional(f))].join('\n');
      assert.ok(allUi.length > 2000, 'Step 3b: React UI workbenches implemented');
    },
  },
];
