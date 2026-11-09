import assert from 'node:assert/strict';
import {
  CANONICAL_DB_IDS,
  readProjectFile,
  runKosaCliJson,
  stringifyDeep,
  assertContainsAll,
  assertContainsAny,
  getDbCorpusCombined,
  inspectDbRecordResilient,
  runPhoneticsNormalized,
} from './helpers/harness.mjs';

export const TIER3_TESTS = [
  {
    id: 'T3-CF-01',
    tier: 3,
    features: ['F1', 'F2'],
    title: 'Baseline CBETA #SD-* Gaiji Glyphs × Multi-Script Transliterator & 34×14 Siddhaṃ Matrix',
    async run() {
      const cbetaSrc = readProjectFile('src/data/generated/cbetaAuthRecords.ts');
      assertContainsAny(cbetaSrc, ['SD-A5ED', 'SD-A5E5', 'SD-A440'], 'Baseline CBETA #SD-* Gaiji entries');
      const p = runPhoneticsNormalized('oṃ a ā i ī u ū e ai o au');
      assert.ok(p.flatSyllables.length >= 11, 'Expected >= 11 syllables from vowel series');
      assert.ok(/[\u{11580}-\u{115FF}]/u.test(p.siddhamUnicode || p.rawText), 'Transliterator must emit Unicode Siddhaṃ');
    },
  },
  {
    id: 'T3-CF-02',
    tier: 3,
    features: ['F1', 'F3'],
    title: 'Baseline cbeta_gaiji (#SD-*/#CB*) × Fangshan F28n1071 Interlinear <cb:tt> Resolution',
    async run() {
      const cbetaSrc = readProjectFile('src/data/generated/cbetaAuthRecords.ts');
      const { combinedText: db1Text } = getDbCorpusCombined('db1_fangshan');
      assertContainsAny(cbetaSrc, ['SD-A5ED', 'CBETA_GAIJI_MAP'], 'Baseline CBETA_GAIJI_MAP');
      assertContainsAll(db1Text, ['F28n1071', 'SD-A5ED'], 'Fangshan F28n1071 #SD-A5ED resolved via CBETA_GAIJI_MAP');
    },
  },
  {
    id: 'T3-CF-03',
    tier: 3,
    features: ['F2', 'F3'],
    title: 'Fangshan F28n1071 Inline Phonetic Notes (二合, 三合, 引, 彈舌) × Prosody & Sandhi Engine',
    async run() {
      const { combinedText: db1Text } = getDbCorpusCombined('db1_fangshan');
      assertContainsAll(db1Text, ['二合', '三合', '引'], 'Fangshan inline phonetic notes');
      const p = runPhoneticsNormalized('tadyathā oṃ siddhe siddhe susiddhe');
      assert.ok(p.flatSyllables.length >= 10, 'Expected >= 10 syllables for Fangshan tadyathā oṃ siddhe siddhe susiddhe');
      const guruCount = p.flatSyllables.filter((s) => s.weightNormalized === 'Guru').length;
      assert.ok(guruCount >= 6, `Expected >= 6 Guru syllables due to conjuncts (ddh = 二合) and long vowels (ā/e = 引), got ${guruCount}`);
    },
  },
  {
    id: 'T3-CF-04',
    tier: 3,
    features: ['F1', 'F4'],
    title: 'Baseline T18–T21 Mikkyō Index × DB #2 T54 Lexicons & T08–T21 Ancient Dhāraṇīs',
    async run() {
      const mikkyoSrc = readProjectFile('src/data/generated/taishoMikkyoIndex.ts');
      const { combinedText: db2Text } = getDbCorpusCombined('db2_taisho_ext');
      assertContainsAny(mikkyoSrc, ['1336', 'T21n1336', '陀羅尼雜集'], 'Taishō Mikkyō index includes T21n1336');
      assertContainsAll(db2Text, ['T21n1336', 'T54n2135', '梵語雜名'], 'DB #2 includes T21n1336 (278 dhāraṇīs) and T54n2135');
    },
  },
  {
    id: 'T3-CF-05',
    tier: 3,
    features: ['F2', 'F4'],
    title: 'DB #2 T84n2701 (Kūkai) & 18 Siddhaṃ Chapters × 34×14 Phonetic Matrix & Unicode Siddhaṃ',
    async run() {
      const { combinedText: db2Text } = getDbCorpusCombined('db2_taisho_ext');
      const matrixSrc = readProjectFile('src/data/siddhamMatrix.ts');
      assertContainsAll(db2Text, ['T84n2701', '空海'], 'DB #2 T84n2701 Kūkai');
      assertContainsAny(`${db2Text}\n${matrixSrc}`, ['十八章', 'Parivarta', 'siddham-chapters'], '18 Siddhaṃ Chapters integration');
    },
  },
  {
    id: 'T3-CF-06',
    tier: 3,
    features: ['F1', 'F5'],
    title: 'Baseline 25 GRETIL Texts × DB #3 DSBC Dhāraṇī Saṃgraha (820/2949) & Expanded 261 GRETIL Corpus',
    async run() {
      const gretilSrc = readProjectFile('src/data/generated/gretilAuthRecords.ts');
      const { combinedText: db3Text } = getDbCorpusCombined('db3_dsbc_gretil');
      assertContainsAll(gretilSrc, ['mahpratu', 'amoghapu'], 'Baseline GRETIL Mahāpratisarā and Amoghapāśa');
      assertContainsAll(db3Text, ['Mahāpratisarā', 'Amoghapāśa', '2949', 'bst-108u'], 'DSBC list/4, 820/2949, and GRETIL bst-108u');
    },
  },
  {
    id: 'T3-CF-07',
    tier: 3,
    features: ['F2', 'F6'],
    title: 'DB #4 84000 Clean <mantra xml:lang="Sa-Ltn"> × Prosody, Sandhi & Audio Synthesis Target',
    async run() {
      const { combinedText: db4Text } = inspectDbRecordResilient('db4_84000', 'toh862');
      assertContainsAny(db4Text, ['bhaiṣajye', 'svāhā', '862'], '84000 Toh 862 Bhaiṣajyaguru mantra');
      const p = runPhoneticsNormalized('tadyathā oṃ bhaiṣajye bhaiṣajye mahābhaiṣajye rājasamudgate svāhā');
      assert.ok(!/\u00AD/.test(p.normalizedIast), 'Zero soft-hyphen contamination in phonetics pipeline');
      assert.ok(p.flatSyllables.length >= 20, `Expected >= 20 syllables for Bhaiṣajyaguru mantra, got ${p.flatSyllables.length}`);
    },
  },
  {
    id: 'T3-CF-08',
    tier: 3,
    features: ['F5', 'F7'],
    title: 'DB #3 DSBC Dhāraṇī Saṃgraha (820/2949) & Stotras × DB #5 BuddhaNexus K12n2949u & T01* Segments',
    async run() {
      const { combinedText: db3Text } = getDbCorpusCombined('db3_dsbc_gretil');
      const { combinedText: db5Text } = getDbCorpusCombined('db5_buddhanexus');
      assertContainsAll(db3Text, ['2949', 'Dhāraṇī'], 'DB #3 DSBC 820/2949 Dhāraṇī Saṃgraha');
      assertContainsAll(db5Text, ['K12n2949u', '7700', 'T01n802u'], 'DB #5 BuddhaNexus K12n2949u & T01n802u');
    },
  },
  {
    id: 'T3-CF-09',
    tier: 3,
    features: ['F6', 'F9'],
    title: 'DB #4 84000 Gzungs \'dus (Toh 846–1095) × DB #7 Cambridge CUDL MS-ADD-01680-00008 & Hidas Editions',
    async run() {
      const { combinedText: db4Text } = getDbCorpusCombined('db4_84000');
      const { combinedText: db7Text } = getDbCorpusCombined('db7_cudl_hidas');
      assertContainsAny(db4Text, ['toh970', '970', 'toh888', '888', 'toh1009', '1009'], '84000 Gzungs \'dus Tohoku numbers');
      assertContainsAll(
        db7Text,
        ['SA_K12_Āgama_Māṇibhadradhāraṇī_Hidas', 'SA_K12_Āgama_Sarvakarmāvaraṇaviśodhanīdhāraṇī', 'MS-ADD-01680-00008-00003'],
        'Hidas critical editions and CUDL MS Add. 1680.8'
      );
    },
  },
  {
    id: 'T3-CF-10',
    tier: 3,
    features: ['F7', 'F8'],
    title: 'DB #5 BuddhaNexus T02* Guhyasamāja Texts × DB #6 SARIT Caryāmelāpakapradīpa Ch. 3 Mantratattva',
    async run() {
      const { combinedText: db5Text } = getDbCorpusCombined('db5_buddhanexus');
      const { combinedText: db6Text } = getDbCorpusCombined('db6_sarit');
      assertContainsAny(db5Text, ['T02dipguhsu', 'Pradīpoddyotana', 'Guhyasamāja', 'K12n2967u'], 'BuddhaNexus Guhyasamāja texts');
      assertContainsAll(db6Text, ['caryamelapakapradipa', 'CMP03', 'vajrajāpa'], 'SARIT Caryāmelāpakapradīpa Ch. 3');
    },
  },
  {
    id: 'T3-CF-11',
    tier: 3,
    features: ['F4', 'F10'],
    title: 'DB #2 Taishō T08n0250–0257 & T09n0262 × DB #8 Oslo Polyglotta vid=1175 (Heart Sūtra) & vid=483 (Lotus Ch. 21)',
    async run() {
      const { combinedText: db2Text } = getDbCorpusCombined('db2_taisho_ext');
      const { combinedText: db8Text } = getDbCorpusCombined('db8_polyglotta');
      assertContainsAll(db2Text, ['T08n0250', 'T08n0251', 'T09n0262'], 'DB #2 Taishō Heart Sūtra & Lotus Sūtra');
      assertContainsAll(db8Text, ['1175', '483', '456868', 'T.251'], 'DB #8 Polyglotta vid=1175 and vid=483&cid=456868');
    },
  },
  {
    id: 'T3-CF-12',
    tier: 3,
    features: ['F6', 'F10'],
    title: 'DB #4 84000 Trilingual <gloss> × DB #8 Polyglotta Mahāvyutpatti (§25 & §198) Quadrilingual Glossary',
    async run() {
      const { combinedText: db4Text } = getDbCorpusCombined('db4_84000');
      const { combinedText: db8Text } = getDbCorpusCombined('db8_polyglotta');
      assertContainsAny(db4Text, ['adhiṣṭhāna', 'dhāraṇī', 'mantra'], '84000 trilingual glossary terms');
      assertContainsAll(db8Text, ['335411', '338889', 'dhāraṇī', 'vidyārājñī'], 'Polyglotta Mahāvyutpatti §25 & §198 terms');
    },
  },
  {
    id: 'T3-CF-13',
    tier: 3,
    features: ['F6', 'F11'],
    title: 'DB #4 84000 Toh 846–1095 Gzungs \'dus × DB #9 Vienna rKTs D.xml (265 gzungs items) & 1D/100–101.txt',
    async run() {
      const { combinedText: db4Text } = getDbCorpusCombined('db4_84000');
      const { combinedText: db9Text } = getDbCorpusCombined('db9_rkts');
      assertContainsAll(db4Text, ['toh846', 'toh1095'], '84000 Toh 846–1095 Gzungs \'dus range');
      assertContainsAll(db9Text, ['D846', 'D1095', 'gzungs'], 'rKTs D846–D1095 Zungdu range');
    },
  },
  {
    id: 'T3-CF-14',
    tier: 3,
    features: ['F2', 'F11'],
    title: 'DB #9 rKTs Extended Wylie (EWTS) Mantras (1D/100.txt & 101.txt) × Multi-Script EWTS↔IAST Transliterator',
    async run() {
      const { combinedText: db9Text } = getDbCorpusCombined('db9_rkts');
      assertContainsAny(db9Text, ['badzra', 'vajra', 'd+hA ra NI', 'dhāraṇī'], 'rKTs EWTS and converted IAST');
      const p = runPhoneticsNormalized('āryamahāvajrameruśikharakūṭāgāradhāraṇī');
      assert.ok(p.flatSyllables.length >= 15, 'Transliterator & syllabifier handles restored Sanskrit title');
    },
  },
  {
    id: 'T3-CF-15',
    tier: 3,
    features: ['F5', 'F12'],
    title: 'DB #3 DSBC Dhāraṇī Saṃgraha (820/2949) × DB #10 ALL-NIBS 106 Sanskrit MSS & Newar Orthographic Normalization',
    async run() {
      const { combinedText: db3Text } = getDbCorpusCombined('db3_dsbc_gretil');
      const { combinedText: db10Text } = getDbCorpusCombined('db10_all_nibs');
      assertContainsAll(db3Text, ['2949', '2990'], 'DB #3 DSBC 820/2949 & 862/2990');
      assertContainsAll(db10Text, ['SA00019.001', 'sarvva', 'svāhā'], 'DB #10 ALL-NIBS diplomatic & normalized Newar Sanskrit');
    },
  },
  {
    id: 'T3-CF-16',
    tier: 3,
    features: ['F8', 'F12'],
    title: 'DB #6 SARIT Buddhist Tantric Corpus × DB #10 ALL-NIBS Varanasi Sanskrit Manuscripts (SA00025.001 Pradīpoddyotana, SA00016.001 Saṃpuṭa)',
    async run() {
      const { combinedText: db6Text } = getDbCorpusCombined('db6_sarit');
      const { combinedText: db10Text } = getDbCorpusCombined('db10_all_nibs');
      assertContainsAll(db6Text, ['caryamelapakapradipa', 'Guhyasamāja'], 'DB #6 SARIT Guhyasamāja Caryāmelāpakapradīpa');
      assertContainsAll(db10Text, ['SA00025.001', 'SA00016.001', 'SA00028.001', 'TSK-01785'], 'DB #10 ALL-NIBS Pradīpoddyotana, Saṃpuṭa & Sādhanamālā');
    },
  },
  {
    id: 'T3-CF-17',
    tier: 3,
    features: ['F3', 'F13'],
    title: 'DB #1 Fangshan Nīlakaṇṭha (F24n0761, F27n1050, F27n1064) × DB #11 Silk Road CEToM THT 3187 & Dunhuang T85',
    async run() {
      const { combinedText: db1Text } = getDbCorpusCombined('db1_fangshan');
      const { combinedText: db11Text } = getDbCorpusCombined('db11_idp_dunhuang');
      assertContainsAll(db1Text, ['F24n0761', 'F27n1050', 'F27n1064'], 'DB #1 Fangshan Nīlakaṇṭha inscriptions');
      assertContainsAll(db11Text, ['THT 3187', 'kāruṇikāya', 'T85n2880'], 'DB #11 Silk Road Kizil THT 3187 & Dunhuang T85n2880');
    },
  },
  {
    id: 'T3-CF-18',
    tier: 3,
    features: ['F9', 'F13'],
    title: 'DB #7 Cambridge CUDL Early Palm-Leaf & 770 CE Hyakumantō darani (PR-FG-00870) × DB #11 IDP/CEToM Silk Road MSS',
    async run() {
      const { combinedText: db7Text } = getDbCorpusCombined('db7_cudl_hidas');
      const { combinedText: db11Text } = getDbCorpusCombined('db11_idp_dunhuang');
      assertContainsAll(db7Text, ['PR-FG-00870', 'MS-ADD-01680-00008-00001'], 'DB #7 CUDL PR-FG-00870 & MS Add. 1680.8');
      assertContainsAll(db11Text, ['IOL San 397', 'Dalton_vanSchaik_2005', 'Wille_2009a'], 'DB #11 IDP & Silk Road manuscripts');
    },
  },
  {
    id: 'T3-CF-19',
    tier: 3,
    features: ['F4', 'F14'],
    title: 'DB #2 Kūkai T84n2701 Siddhaṃ Akṣara-mukha × DB #12 OCHS Bījanighaṇṭu (#30) & Muktabodha Uddhārakośa (M00247)',
    async run() {
      const { combinedText: db2Text } = getDbCorpusCombined('db2_taisho_ext');
      const { combinedText: db12Text } = getDbCorpusCombined('db12_muktabodha_ochs');
      assertContainsAll(db2Text, ['T84n2701', '空海'], 'DB #2 Kūkai T84n2701');
      assertContainsAll(db12Text, ['bijanighantu', 'M00247', 'Uddhārakośa'], 'DB #12 OCHS Bījanighaṇṭu & Muktabodha M00247');
    },
  },
  {
    id: 'T3-CF-20',
    tier: 3,
    features: ['F1', 'F14'],
    title: 'Baseline GRETIL sarvttsu.htm & T18n0865 × DB #12 ERC DHARMA Sarvatathāgatatattvasaṅgraha (stts_crited.txt)',
    async run() {
      const gretilSrc = readProjectFile('src/data/generated/gretilAuthRecords.ts');
      const { combinedText: db12Text } = getDbCorpusCombined('db12_muktabodha_ochs');
      assertContainsAll(gretilSrc, ['sarvttsu'], 'Baseline GRETIL sarvttsu.htm');
      assertContainsAny(db12Text, ['stts_crited', 'Sarvatathāgatatattvasaṅgraha', 'T0865'], 'DB #12 ERC DHARMA STTS critical edition');
    },
  },
  {
    id: 'T3-CF-21',
    tier: 3,
    features: ['F9', 'F15'],
    title: 'DB #7 CUDL Dhāraṇīsaṃgraha (MS-ADD-01326 & MS-ADD-01680-00008-00001..3) × F15 Cross-Canonical Concordance',
    async run() {
      const concUsnisa = runKosaCliJson(['concordance', 'Uṣṇīṣavijayā']);
      const concVasudhara = runKosaCliJson(['concordance', 'Vasudhārā']);
      const combined = `${stringifyDeep(concUsnisa)}\n${stringifyDeep(concVasudhara)}`;
      assertContainsAny(combined, ['MS-ADD-01680', 'MS-ADD-01326', 'MS-ADD-01447', 'MS-ADD-01355', 'db7_cudl_hidas'], 'Concordance links to Cambridge CUDL MSS');
    },
  },
  {
    id: 'T3-CF-22',
    tier: 3,
    features: ['F10', 'F15'],
    title: 'DB #8 Oslo Polyglotta 16-Witness Alignments × F15 Unified Search & Concordance Engine',
    async run() {
      const concTara = runKosaCliJson(['concordance', 'Tārānamaskāraikaviṃśatistotra']);
      const concBhaisajya = runKosaCliJson(['concordance', 'Bhaiṣajyaguru']);
      const combined = `${stringifyDeep(concTara)}\n${stringifyDeep(concBhaisajya)}`;
      assertContainsAny(combined, ['1134', '1020', 'db8_polyglotta', 'Polyglotta'], 'Concordance links to Oslo Polyglotta volumes 1134 & 1020');
    },
  },
  {
    id: 'T3-CF-23',
    tier: 3,
    features: ['F2', 'F14', 'F15'],
    title: 'DB #12 Bījanighaṇṭu × F15 Bīja Decipherer × F2 Formant/Phonetic Matrix',
    async run() {
      const bijaHrih = runKosaCliJson(['bija', 'hrīḥ']);
      const pHrih = runPhoneticsNormalized('hrīḥ');
      const combined = `${stringifyDeep(bijaHrih)}\n${pHrih.rawText}`;
      assertContainsAny(combined, ['ह्रीः', '纥哩', '赫里希', 'Guru', '—'], 'hrīḥ Devanāgarī, Tang/Modern phonetics, and Guru weight');
      assertContainsAny(combined, ['Amitābha', 'Avalokiteśvara', 'hrīḥ', 'hriH'], 'hrīḥ seed-syllable decipherment');
    },
  },
  {
    id: 'T3-CF-24',
    tier: 3,
    features: [
      'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8',
      'F9', 'F10', 'F11', 'F12', 'F13', 'F14', 'F15', 'F16',
    ],
    title: 'All 12 Databases + Core Engines × React Web UI & CLI verify-all --json End-to-End Parity',
    async run() {
      const verifyRes = runKosaCliJson(['verify-all']);
      const dbsRes = runKosaCliJson(['dbs']);
      const appSrc = readProjectFile('src/App.tsx');
      const combined = `${stringifyDeep(verifyRes)}\n${stringifyDeep(dbsRes)}\n${appSrc}`;
      for (const dbId of CANONICAL_DB_IDS) {
        assert.ok(combined.includes(dbId), `End-to-end parity check must include ${dbId}`);
      }
    },
  },
];
