/**
 * src/core/concordanceEngine.ts
 * Milestone 4 (Feature F15): Pan-Buddhist 12-Database Cross-Canonical Concordance Resolver
 * & Unified Quadrilingual Glossary Engine
 */

import type {
  CanonicalConcordanceCluster,
  TrilingualGlossaryEntry,
} from '../types/corpus';
import {
  BASELINE_CURATED_DHARANIS,
  DB4_84000_CORPUS,
  DB7_CUDL_HIDAS_CORPUS,
  DB8_POLYGLOTTA_CORPUS,
  DB9_RKTS_CORPUS,
  UNIFIED_QUADRILINGUAL_GLOSSARY,
} from '../data/unifiedCorpusRegistry';
import { normalizeDiacritics } from '../services/tier1CorpusService';

export { UNIFIED_QUADRILINGUAL_GLOSSARY };

export const CONCORDANCE_CLUSTERS: CanonicalConcordanceCluster[] = [
  {
    clusterId: 'cluster_01_prajnaparamitahrdaya',
    canonicalTitleSanskrit: 'Prajñāpāramitāhṛdaya (Bhagavatīprajñāpāramitāhṛdaya)',
    canonicalTitleZh: '般若波羅蜜多心經 (梵本心經・唐梵翻對字音般若波羅蜜多心經)',
    canonicalTitleTibetan: 'bcom ldan \'das ma shes rab kyi pha rol tu phyin pa\'i snying po (ཤེས་རབ་སྙིང་པོ།)',
    canonicalTitleEn: 'The Heart of the Perfection of Wisdom Sūtra (16-Witness Pan-Asian Concordance)',
    crossRefs: {
      taishoIds: ['T0250', 'T0251', 'T0252', 'T0253', 'T0254', 'T0255', 'T0257', 'T08n0250', 'T08n0251', 'T08n0252', 'T08n0253', 'T08n0254', 'T08n0255', 'T08n0257', 'T19n0901'],
      fangshanIds: ['F27n1056', 'F28n1071'],
      tohokuIds: ['Toh 21', 'Toh 531', 'toh21', 'toh531'],
      rktsIds: ['K21', 'D21', 'D531', 'K531'],
      dsbcIds: ['820/2949'],
      gretilIds: ['prajnhsu.htm', 'prajnhsu'],
      buddhaNexusIds: ['K12prajnhsu', 'SA_K12_prajnhsu'],
      cudlMsIds: ['MS-ADD-01326', 'MS-ADD-01680-00008-00001'],
      polyglottaVids: ['vid=1175', '1175'],
      idpOrCetomIds: ['S.2499', 'T08n0256'],
    },
    databasesPresent: [
      'db1_fangshan',
      'db2_taisho_ext',
      'db3_dsbc_gretil',
      'db4_84000',
      'db5_buddhanexus',
      'db7_cudl_hidas',
      'db8_polyglotta',
      'db9_rkts',
      'db11_idp_dunhuang',
    ],
    witnessSummary: [
      {
        dbId: 'db8_polyglotta',
        recordId: 'vid=1175',
        label: 'Oslo Bibliotheca Polyglotta vid=1175 (16-Witness Sentence Alignment: Vaidya, Conze, T.250, T.251, T.257, Kangyur)',
        script: 'IAST',
        sampleMantraOrIncipit: 'tadyathā oṃ gate gate pāragate pārasaṃgate bodhi svāhā',
        url: 'https://polyglotta.uio.no/index.php?page=fulltext&view=fulltext&vid=1175',
      },
      {
        dbId: 'db1_fangshan',
        recordId: 'F27n1056',
        label: 'Fangshan Stone Canon F27n1056 《唐梵翻對字音般若波羅蜜多心經》 & F28n1071',
        script: 'Siddham',
        sampleMantraOrIncipit: '揭諦揭諦 波羅揭諦 波羅僧揭諦 菩提薩婆訶 (F27n1056 / F28n1071)',
        url: 'https://github.com/cbeta-org/xml-p5/blob/master/F/F27/F27n1056.xml',
      },
      {
        dbId: 'db2_taisho_ext',
        recordId: 'T08n0251',
        label: 'Taishō T08n0250–T08n0257 (T0251 Xuanzang, T0250 Kumārajīva, T0257梵本般若波羅蜜多心經)',
        script: 'Chinese',
        sampleMantraOrIncipit: '羯諦羯諦 波羅羯諦 波羅僧羯諦 菩提僧莎訶 (T08n0250 / T08n0251)',
        url: 'https://github.com/cbeta-org/xml-p5/blob/master/T/T08/T08n0251.xml',
      },
      {
        dbId: 'db3_dsbc_gretil',
        recordId: 'prajnhsu.htm',
        label: 'GRETIL prajnhsu.htm (Conze / Vaidya Sanskrit Edition)',
        script: 'IAST',
        sampleMantraOrIncipit: 'gate gate pāragate pārasaṃgate bodhi svāhā || iti prajñāpāramitāhṛdayaṃ samāptam ||',
        url: 'https://gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/prajnhsu.htm',
      },
      {
        dbId: 'db4_84000',
        recordId: 'Toh 531',
        label: '84000 Open TEI Toh 21 & Toh 531 (D531 Kriyātantra / Sher phyin)',
        script: 'Tibetan-EWTS',
        sampleMantraOrIncipit: 'tadya thā / oṃ ga te ga te pā ra ga te pā ra saṃ ga te bo dhi svā hā',
        url: 'https://read.84000.co/translation/toh531.html',
      },
      {
        dbId: 'db7_cudl_hidas',
        recordId: 'MS-ADD-01326',
        label: 'Cambridge University Digital Library MS-ADD-01326 (1719 CE Nepalese Dhāraṇīsaṃgraha, 458 pages)',
        script: 'IAST',
        sampleMantraOrIncipit: 'oṃ namo bhagavatyai āryaprajñāpāramitāyai ... gate gate pāragate pārasaṃgate bodhi svāhā',
        url: 'https://cudl.lib.cam.ac.uk/view/MS-ADD-01326/1',
      },
    ],
  },
  {
    clusterId: 'cluster_02_guhyadhatukaranda_toh507_883',
    canonicalTitleSanskrit: 'Sarvatathāgatādhiṣṭhānahṛdayaguhyadhātukaraṇḍamudrādhāraṇī (Āryadhātukaraṇḍā)',
    canonicalTitleZh: '一切如來心祕密全身舍利寶篋印陀羅尼經 (T19n1022A / T19n1022B)',
    canonicalTitleTibetan: '\'phags pa de bzhin gshegs pa thams cad kyi byin gyis brlabs kyi snying po gsang ba ring bsrel gyi za ma tog ces bya ba\'i gzungs',
    canonicalTitleEn: 'The Secret Relics Casket Seal Dhāraṇī of the Heart-Blessing (adhiṣṭhāna) of All Tathāgatas',
    crossRefs: {
      taishoIds: ['T19n1022A', 'T19n1022B', '1022A', '1022B'],
      fangshanIds: ['F28n1071'],
      tohokuIds: ['Toh 507', 'Toh 883', 'toh507', 'toh883', '507', '883'],
      rktsIds: ['K507', 'D507', 'D883', 'K883'],
      dsbcIds: ['820/2949'],
      cudlMsIds: ['MS-ADD-01680-00008-00003', 'MS-ADD-01326'],
      bdrcWorkId: 'WA0RK0507',
    },
    databasesPresent: [
      'db1_fangshan',
      'db2_taisho_ext',
      'db3_dsbc_gretil',
      'db4_84000',
      'db7_cudl_hidas',
      'db9_rkts',
    ],
    witnessSummary: [
      {
        dbId: 'db4_84000',
        recordId: 'toh507,883',
        label: '84000 Open TEI UT22084-088-007 (Toh 507 Kriyātantra & Toh 883 Gzungs \'dus)',
        script: 'IAST',
        sampleMantraOrIncipit: 'namas tryadhvikānāṃ sarvatathāgatānām oṃ bhuvibhavanavare vacanavacaṭai caṭai suru suru dhara dhara sarvatathāgatadhātudhare padmaṃ bhavati jayavare mudre smara tathāgatadharmacakrapravartana vajrabodhimaṇḍālaṅkāra alaṅkṛte sarvatathāgatādhiṣṭhite bodhaya bodhaya bodhi bodhi budhya budhya saṃbodhani saṃbodhaya cala cala calantu sarvāvaraṇāni sarvapāpavigate huru huru sarvaśokavigate sarvatathāgatahṛdayavajriṇi saṃbhāra saṃbhāra sarvatathāgataguhyadhāraṇīmudre buddhe subuddhe sarvatathāgatādhiṣṭhitadhātugarbhe svāhā',
        url: 'https://read.84000.co/translation/toh507.html',
      },
      {
        dbId: 'db2_taisho_ext',
        recordId: 'T19n1022A',
        label: 'CBETA Taishō T19n1022A (Amoghavajra 不空譯 寶篋印陀羅尼, 40 <cb:tt> pairs)',
        script: 'Siddham',
        sampleMantraOrIncipit: '나谟 悉底哩野地尾迦南 薩婆怛他孽多南 唵 部尾婆嚩娜嚩㘑 ... (T19n1022A)',
        url: 'https://github.com/cbeta-org/xml-p5/blob/master/T/T19/T19n1022A.xml',
      },
      {
        dbId: 'db7_cudl_hidas',
        recordId: 'MS-ADD-01680-00008-00003',
        label: 'Cambridge CUDL MS-ADD-01680-00008-00003 Folio [23v5] Āryadhātukaraṇḍā (12th–13th c. Palm-Leaf)',
        script: 'IAST',
        sampleMantraOrIncipit: '[23v5] Āryadhātukaraṇḍā — namas tryadhvikānāṃ sarvatathāgatānām ...',
        url: 'https://cudl.lib.cam.ac.uk/view/MS-ADD-01680-00008-00003/1',
      },
      {
        dbId: 'db1_fangshan',
        recordId: 'F28n1071',
        label: 'Fangshan Stone Canon F28n1071 《釋教最上乘秘密藏陀羅尼集》 Guhyadhātu Section',
        script: 'Siddham',
        sampleMantraOrIncipit: '一切如來全身舍利寶篋印陁羅尼 (F28n1071)',
        url: 'https://github.com/cbeta-org/xml-p5/blob/master/F/F28/F28n1071.xml',
      },
      {
        dbId: 'db9_rkts',
        recordId: 'D883',
        label: 'Vienna rKTs D507 / D883 (K507) Derge Zungdu e-text 1D/100.txt',
        script: 'Tibetan-EWTS',
        sampleMantraOrIncipit: 'na mas trya dhvi kā nāM sarba ta thā ga tā nāM',
        url: 'http://www.rkts.org/rkts1/data/collections/D/D.xml',
      },
    ],
  },
  {
    clusterId: 'cluster_03_usnisavijaya',
    canonicalTitleSanskrit: 'Sarvadurgatipariśodhana-uṣṇīṣavijaya-dhāraṇī (Āryoṣṇīṣavijayā)',
    canonicalTitleZh: '佛頂尊勝陀羅尼 (一切如來烏瑟膩沙最勝總持經)',
    canonicalTitleTibetan: '\'phags pa ngan \'gro thams cad yongs su sbyong ba gtsug tor rnam par rgyal ba zhes bya ba\'i gzungs',
    canonicalTitleEn: 'The Glorious Buddha-Crown Victory (Uṣṇīṣavijayā) Purification of All Evil Destinies Dhāraṇī',
    crossRefs: {
      taishoIds: ['T19n0967', 'T19n0974B', 'T19n0978', '0967', '0974B'],
      fangshanIds: ['F27n1062', 'F28n1071'],
      tohokuIds: ['Toh 594', 'Toh 597', 'Toh 984'],
      rktsIds: ['K597', 'D597', 'D984'],
      dsbcIds: ['820/2949', '824/2953'],
      gretilIds: ['usnvijdhu.htm'],
      buddhaNexusIds: ['K12n2949u', 'SA_K12_n2949u'],
      cudlMsIds: ['MS-ADD-01680-00008-00001', 'MS-ADD-01326', 'MS-ADD-01447', 'PR-FG-00870'],
      allNibsIds: ['nibs_newar_usnisavijaya'],
    },
    databasesPresent: [
      'db1_fangshan',
      'db2_taisho_ext',
      'db3_dsbc_gretil',
      'db4_84000',
      'db5_buddhanexus',
      'db7_cudl_hidas',
      'db9_rkts',
      'db10_all_nibs',
    ],
    witnessSummary: [
      {
        dbId: 'db7_cudl_hidas',
        recordId: 'MS-ADD-01680-00008-00001',
        label: 'Cambridge CUDL MS-ADD-01680-00008-00001 [15r2] Āryoṣṇīṣavijayā, MS-ADD-01326 & MS-ADD-01447',
        script: 'IAST',
        sampleMantraOrIncipit: '[15r2] Āryoṣṇīṣavijayā — oṃ namo bhagavate sarvatrailokyaprativiśiṣṭāya buddhāya te namaḥ tadyathā oṃ bhrūṃ bhrūṃ bhrūṃ śodhaya śodhaya viśodhaya viśodhaya asamasamantāvabhāsaspharaṇagati gaganasvabhāvaviśuddhe abhiṣiñcantu māṃ sarvatathāgatāḥ sugatavaravacanāmṛtābhiṣekair mahāmudrāmantrapadaiḥ svāhā',
        url: 'https://cudl.lib.cam.ac.uk/view/MS-ADD-01680-00008-00001/1',
      },
      {
        dbId: 'db1_fangshan',
        recordId: 'F27n1062',
        label: 'Fangshan Stone Canon F27n1062 《佛頂尊勝陀羅尼》 & F28n1071',
        script: 'Siddham',
        sampleMantraOrIncipit: '佛頂尊勝陀羅尼 (F27n1062 / F28n1071 / T19n0967 / T19n0974B)',
        url: 'https://github.com/cbeta-org/xml-p5/blob/master/F/F27/F27n1062.xml',
      },
      {
        dbId: 'db3_dsbc_gretil',
        recordId: '820/2949',
        label: 'Nepal DSBC Dhāraṇī Saṃgraha 820/2949 & 824/2953 Uṣṇīṣavijayā Section',
        script: 'Devanagari',
        sampleMantraOrIncipit: 'oṃ bhrūṃ svāhā | oṃ amṛta āyurdade svāhā | uṣṇīṣavijayā dhāraṇī',
        url: 'https://www.dsbcproject.org/canon-text/content/820/2949',
      },
      {
        dbId: 'db4_84000',
        recordId: 'Toh 597',
        label: '84000 Open TEI Toh 594 / Toh 597 / Toh 984',
        script: 'IAST',
        sampleMantraOrIncipit: 'oṃ bhrūṃ svāhā / oṃ amṛtāyurdade svāhā',
        url: 'https://read.84000.co/translation/toh597.html',
      },
    ],
  },
  {
    clusterId: 'cluster_04_vasudhara',
    canonicalTitleSanskrit: 'Ārya-vasudhārā-nāma-dhāraṇī (Vasudhārādhāraṇī)',
    canonicalTitleZh: '佛說持世陀羅尼經 / 聖持世陀羅尼 (雨寶陀羅尼)',
    canonicalTitleTibetan: '\'phags pa nor gyi rgyun ces bya ba\'i gzungs',
    canonicalTitleEn: 'The Noble Stream of Wealth (Vasudhārā) Dhāraṇī',
    crossRefs: {
      taishoIds: ['T20n1162', 'T20n1163'],
      fangshanIds: ['F28n1071'],
      tohokuIds: ['Toh 662', 'Toh 959'],
      rktsIds: ['K662', 'D662', 'D959'],
      dsbcIds: ['21/223', '820/2949'],
      gretilIds: ['vadhdhdu.htm'],
      buddhaNexusIds: ['K12vadhdhdu', 'K12n2949u'],
      cudlMsIds: ['MS-ADD-01680-00008-00002', 'MS-ADD-01326', 'MS-ADD-01447', 'MS-ADD-01355'],
      allNibsIds: ['nibs_newar_vasudhara'],
    },
    databasesPresent: [
      'db1_fangshan',
      'db3_dsbc_gretil',
      'db4_84000',
      'db5_buddhanexus',
      'db7_cudl_hidas',
      'db9_rkts',
      'db10_all_nibs',
    ],
    witnessSummary: [
      {
        dbId: 'db7_cudl_hidas',
        recordId: 'MS-ADD-01680-00008-00002',
        label: 'Cambridge CUDL MS-ADD-01680-00008-00002, MS-ADD-01326, MS-ADD-01447 & MS-ADD-01355 (Vasudhārā Palm-Leaf MSS)',
        script: 'IAST',
        sampleMantraOrIncipit: 'namo ratnatrayāya | oṃ vasudhāre svāhā | oṃ śrīvasumukhī svāhā (MS-ADD-01680 / MS-ADD-01326 / MS-ADD-01447 / MS-ADD-01355)',
        url: 'https://cudl.lib.cam.ac.uk/view/MS-ADD-01680-00008-00002/1',
      },
      {
        dbId: 'db3_dsbc_gretil',
        recordId: '21/223',
        label: 'Nepal DSBC 21/223 Vasudhārādhāraṇī, 820/2949 & GRETIL vadhdhdu.htm',
        script: 'IAST',
        sampleMantraOrIncipit: 'oṃ śrīṃ vasudhārāratnanidhānakṣetre svāhā',
        url: 'https://www.dsbcproject.org/canon-text/content/21/223',
      },
      {
        dbId: 'db4_84000',
        recordId: 'Toh 662',
        label: '84000 Open TEI Toh 662 & Toh 959 (Āryavasudhārānāmadhāraṇī)',
        script: 'IAST',
        sampleMantraOrIncipit: 'tadyathā oṃ surūpe bhadre bhadravati maṅgale acale capale ughātani udbhedini sasyavati ಧnyavati dhanavati śrīmati prabhāvati amale vimale rucire surucire',
        url: 'https://read.84000.co/translation/toh662.html',
      },
    ],
  },
  {
    clusterId: 'cluster_05_tara_21_praises',
    canonicalTitleSanskrit: 'Tārānamaskāraikaviṃśatistotra (Namaskāraikaviṃśatistotra)',
    canonicalTitleZh: '聖救度佛母二十一種禮讚經 (佛說大方廣曼殊室利經觀自在多羅菩薩儀軌經)',
    canonicalTitleTibetan: 'sgrol ma la phyag \'tshal nyi shu rtsa gcig gi bstod pa',
    canonicalTitleEn: 'Twenty-One Homages and Praises to Noble Tārā (Tārānamaskāraikaviṃśatistotra)',
    crossRefs: {
      taishoIds: ['T20n1108A', 'T20n1108B', '1108'],
      fangshanIds: ['F27n1060', 'F28n1071'],
      tohokuIds: ['Toh 438'],
      rktsIds: ['K438', 'D438'],
      gretilIds: ['bst-108u.htm', 'bst-108u'],
      buddhaNexusIds: ['T01n809u', 'K12namekvsu', 'T01tarasdhu'],
      cudlMsIds: ['MS-ADD-01326'],
      polyglottaVids: ['vid=1134', '1134'],
    },
    databasesPresent: [
      'db1_fangshan',
      'db2_taisho_ext',
      'db3_dsbc_gretil',
      'db4_84000',
      'db5_buddhanexus',
      'db7_cudl_hidas',
      'db8_polyglotta',
      'db9_rkts',
    ],
    witnessSummary: [
      {
        dbId: 'db8_polyglotta',
        recordId: 'vid=1134',
        label: 'Oslo Bibliotheca Polyglotta vid=1134 (Tārānamaskāraikaviṃśatistotra Quadrilingual Parallel Alignment)',
        script: 'IAST',
        sampleMantraOrIncipit: 'namaḥ tāre ture vīre kṣaṇadyutinibhekṣaṇe | trailokyanāthavaktrābjapraphullakamalodbhave || oṃ tāre tuttāre ture svāhā',
        url: 'https://polyglotta.uio.no/index.php?page=fulltext&view=fulltext&vid=1134',
      },
      {
        dbId: 'db5_buddhanexus',
        recordId: 'T01n809u',
        label: 'BuddhaNexus T01n809u, K12namekvsu & T01tarasdhu (Tārā 21 Homages Sanskrit Segments)',
        script: 'IAST',
        sampleMantraOrIncipit: 'namaḥ śrītārāyai | namaḥ tāre ture vīre ... (T01n809u / K12namekvsu)',
        url: 'https://dharmamitra.org/api-db/text-view/text-parallels/',
      },
      {
        dbId: 'db3_dsbc_gretil',
        recordId: 'bst-108u',
        label: 'GRETIL bst-108u.htm (108 Buddhist Stotras Collection)',
        script: 'IAST',
        sampleMantraOrIncipit: 'āryatārābhaṭṭārikāyā namaskāraikaviṃśatistotram (bst-108u)',
        url: 'https://gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/bst-108u.htm',
      },
    ],
  },
  {
    clusterId: 'cluster_06_bhaisajyaguru',
    canonicalTitleSanskrit: 'Bhaiṣajyaguruvaiḍūryaprabharājasūtra (Bhaiṣajyagurudhāraṇī)',
    canonicalTitleZh: '藥師琉璃光如來本願功德經 / 藥師灌頂真言',
    canonicalTitleTibetan: '\'phags pa sman gyi bla bai DUr+ya\'i \'od kyi rgyal po\'i mdo',
    canonicalTitleEn: 'The Medicine Buddha (Bhaiṣajyaguru Lapis Lazuli Radiance King) Sūtra and Dhāraṇī',
    crossRefs: {
      taishoIds: ['T14n0450', 'T19n0924A'],
      fangshanIds: ['F28n1071'],
      tohokuIds: ['Toh 504', 'Toh 862', 'toh504', 'toh862'],
      rktsIds: ['K504', 'D504', 'D862'],
      gretilIds: ['bsu001_u.htm'],
      cudlMsIds: ['MS-ADD-01326'],
      polyglottaVids: ['vid=1020', '1020'],
    },
    databasesPresent: [
      'db1_fangshan',
      'db3_dsbc_gretil',
      'db4_84000',
      'db7_cudl_hidas',
      'db8_polyglotta',
      'db9_rkts',
    ],
    witnessSummary: [
      {
        dbId: 'db8_polyglotta',
        recordId: 'vid=1020',
        label: 'Oslo Bibliotheca Polyglotta vid=1020 (Bhaiṣajyagurusūtra Gilgit Sanskrit, Tibetan, Chinese Parallel Alignment)',
        script: 'IAST',
        sampleMantraOrIncipit: 'namo bhagavate bhaiṣajyaguru-vaiḍūryaprabharājāya tathāgatāyārhate samyaksaṃbuddhāya tadyathā oṃ bhaiṣajye bhaiṣajye mahābhaiṣajye bhaiṣajyasamudgate svāhā',
        url: 'https://polyglotta.uio.no/index.php?page=fulltext&view=fulltext&vid=1020',
      },
      {
        dbId: 'db4_84000',
        recordId: 'toh862',
        label: '84000 Open TEI Toh 504 & Toh 862 (Bhaiṣajyaguru Mantra)',
        script: 'IAST',
        sampleMantraOrIncipit: 'tadyathā oṃ bhaiṣajye bhaiṣajye mahābhaiṣajye rājasamudgate svāhā (toh504 / toh862)',
        url: 'https://read.84000.co/translation/toh504.html',
      },
      {
        dbId: 'db1_fangshan',
        recordId: 'F28n1071',
        label: 'Fangshan Stone Canon F28n1071 & Taishō T14n0450',
        script: 'Siddham',
        sampleMantraOrIncipit: '藥師琉璃光如來灌頂真言 (F28n1071 / T14n0450)',
        url: 'https://github.com/cbeta-org/xml-p5/blob/master/F/F28/F28n1071.xml',
      },
    ],
  },
  {
    clusterId: 'cluster_07_nilakantha',
    canonicalTitleSanskrit: 'Nīlakaṇṭha-dhāraṇī (Sahasrabhujasahasranetra-āryāvalokiteśvara-nīlakaṇṭha-hṛdaya)',
    canonicalTitleZh: '千手千眼觀世音菩薩廣大圓滿無礙大悲心陀羅尼 (大悲咒)',
    canonicalTitleTibetan: '\'phags pa spyan ras gzigs dbang phyug mgrin pa sngon po can',
    canonicalTitleEn: 'The Great Compassion (Nīlakaṇṭha Lokeśvara) Dhāraṇī Across Silk Road, Stone & Nepalese Witnesses',
    crossRefs: {
      taishoIds: ['T20n1060', 'T20n1064', 'T20n1057B'],
      fangshanIds: ['F24n0761', 'F27n1050', 'F27n1064', 'F28n1071'],
      tohokuIds: ['Toh 686', 'Toh 701', 'Toh 723', 'Toh 926'],
      rktsIds: ['K701', 'D701', 'D926'],
      dsbcIds: ['820/2949'],
      cudlMsIds: ['MS-ADD-01326'],
      allNibsIds: ['nibs_newar_nilakantha'],
      idpOrCetomIds: ['THT 3187', 'tht3187', 'T85n2880'],
    },
    databasesPresent: [
      'db1_fangshan',
      'db2_taisho_ext',
      'db3_dsbc_gretil',
      'db4_84000',
      'db7_cudl_hidas',
      'db9_rkts',
      'db10_all_nibs',
      'db11_idp_dunhuang',
    ],
    witnessSummary: [
      {
        dbId: 'db11_idp_dunhuang',
        recordId: 'THT 3187',
        label: 'CEToM Kizil Brāhmī Manuscript THT 3187 (7th–8th c. Nīlakaṇṭha Dhāraṇī) & CBETA Dunhuang T85n2880',
        script: 'Brahmi',
        sampleMantraOrIncipit: 'namo ratnatrayāya nama āryāvalokiteśvarāya bodhisattvāya mahāsattvāya mahākāruṇikāya ... cara vicara sarvabhūtābhayaṃkara (THT 3187 / T85n2880)',
        url: 'https://cetom.univie.ac.at/?m-tht3187',
      },
      {
        dbId: 'db1_fangshan',
        recordId: 'F24n0761',
        label: 'Fangshan Stone Canon F24n0761, F27n1050, F27n1064 & F28n1071',
        script: 'Siddham',
        sampleMantraOrIncipit: '千手千眼觀世音菩薩廣大圓滿無礙大悲心陀羅尼 (F24n0761 / F27n1050 / F27n1064 / F28n1071 / T20n1060 / T20n1064)',
        url: 'https://github.com/cbeta-org/xml-p5/blob/master/F/F24/F24n0761.xml',
      },
      {
        dbId: 'db10_all_nibs',
        recordId: 'nibs_newar_nilakantha',
        label: 'ALL-NIBS Kathmandu Newar Witness & DSBC 820/2949 Nīlakaṇṭha Section',
        script: 'IAST',
        sampleMantraOrIncipit: 'oṃ sarvarabhayaśodhanāya svāhā | nīlakaṇṭhāya svāhā (Toh 686 / Toh 723)',
        url: 'https://www.dsbcproject.org/canon-text/content/820/2949',
      },
    ],
  },
  {
    clusterId: 'cluster_08_sitatapatra',
    canonicalTitleSanskrit: 'Sarvatathāgatoṣṇīṣasitātapatrā-aparājitā-mahāpratyaṅgirā-dhāraṇī (Sitātapatrā)',
    canonicalTitleZh: '大佛頂如來放光悉怛多鉢怛囉大白傘蓋陀羅尼 (楞嚴咒)',
    canonicalTitleTibetan: '\'phags pa de bzhin gshegs pa\'i gtsug tor nas byung ba\'i gdugs dkar po can gzhan gyis mi thub pa',
    canonicalTitleEn: 'The Invincible White Parasol (Sitātapatrā) Crown-Dhāraṇī of All Tathāgatas',
    crossRefs: {
      taishoIds: ['T19n0944A', 'T19n0945', 'T19n0976'],
      fangshanIds: ['F27n1048', 'F27n1063', 'F28n1071'],
      tohokuIds: ['Toh 590', 'Toh 591', 'Toh 593'],
      rktsIds: ['K591', 'D591'],
      dsbcIds: ['820/2949'],
      gretilIds: ['bsu004_u.htm'],
      buddhaNexusIds: ['K12bsu004_u', 'SA_K12_bsu004_u'],
      cudlMsIds: ['MS-ADD-01326', 'MS-ADD-01680-00008-00003'],
    },
    databasesPresent: [
      'db1_fangshan',
      'db2_taisho_ext',
      'db3_dsbc_gretil',
      'db4_84000',
      'db5_buddhanexus',
      'db7_cudl_hidas',
      'db9_rkts',
    ],
    witnessSummary: [
      {
        dbId: 'db5_buddhanexus',
        recordId: 'K12bsu004_u',
        label: 'BuddhaNexus K12bsu004_u & GRETIL bsu004_u.htm (Sarvatathāgatoṣṇīṣasitātapatrā)',
        script: 'IAST',
        sampleMantraOrIncipit: 'oṃ anale anale viśade viśade vīra vajradhare bandha bandhani vajrapāṇi phaṭ hūṃ trūṃ phaṭ svāhā',
        url: 'https://gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/bsu004_u.htm',
      },
      {
        dbId: 'db1_fangshan',
        recordId: 'F27n1048',
        label: 'Fangshan Stone Canon F27n1048, F27n1063 & F28n1071 (Amoghavajra & Dānapāla Sitātapatrā)',
        script: 'Siddham',
        sampleMantraOrIncipit: '大佛頂如來廣聚悉怛多般怛羅大白傘蓋陀羅尼 (F27n1048 / F27n1063 / T19n0944A / T19n0945)',
        url: 'https://github.com/cbeta-org/xml-p5/blob/master/F/F27/F27n1048.xml',
      },
    ],
  },
  {
    clusterId: 'cluster_09_cunda',
    canonicalTitleSanskrit: 'Āryacundā-dhāraṇī (Saptakoṭibuddhamātṛ-cundī-dhāraṇī)',
    canonicalTitleZh: '佛說七俱胝佛母准提大明陀羅尼經 (准提咒)',
    canonicalTitleTibetan: '\'phags pa skul byed ma zhes bya ba\'i gzungs',
    canonicalTitleEn: 'The Dhāraṇī of Noble Cundā, Mother of Seven Koṭis of Buddhas',
    crossRefs: {
      taishoIds: ['T20n1075', 'T20n1076', 'T20n1077'],
      fangshanIds: ['F27n1050', 'F27n1060', 'F28n1071'],
      tohokuIds: ['Toh 613', 'Toh 989'],
      rktsIds: ['D613', 'D989'],
      dsbcIds: ['820/2949'],
      cudlMsIds: ['MS-ADD-01680-00008-00001', 'MS-ADD-01680-00008-00003', 'MS-ADD-01326'],
      allNibsIds: ['nibs_newar_cunda'],
    },
    databasesPresent: [
      'db1_fangshan',
      'db3_dsbc_gretil',
      'db4_84000',
      'db7_cudl_hidas',
      'db9_rkts',
      'db10_all_nibs',
    ],
    witnessSummary: [
      {
        dbId: 'db7_cudl_hidas',
        recordId: 'MS-ADD-01680-00008-00001',
        label: 'Cambridge CUDL MS-ADD-01680-00008-00001 [15v2] Āryacundā & MS-ADD-01326',
        script: 'IAST',
        sampleMantraOrIncipit: '[15v2] Āryacundā — namaḥ saptānāṃ samyaksaṃbuddhakoṭīnāṃ tadyathā oṃ cale cule cunde svāhā',
        url: 'https://cudl.lib.cam.ac.uk/view/MS-ADD-01680-00008-00001/1',
      },
      {
        dbId: 'db10_all_nibs',
        recordId: 'nibs_newar_cunda',
        label: 'ALL-NIBS Newar Cundā Dhāraṇī Witness & Fangshan F27n1050 / F27n1060 / F28n1071',
        script: 'IAST',
        sampleMantraOrIncipit: 'namaḥ saptānāṃ samyaksaṃbuddhakoṭīnāṃ tadyathā oṃ cale cule cunde svāhā',
        url: 'https://www.dsbcproject.org/canon-text/content/820/2949',
      },
    ],
  },
  {
    clusterId: 'cluster_10_marici',
    canonicalTitleSanskrit: 'Āryamārīcī-nāma-dhāraṇī (Mārīcīdhāraṇī)',
    canonicalTitleZh: '佛說摩利支天菩薩陀羅尼經 (大摩里支菩薩經)',
    canonicalTitleTibetan: '\'phags pa \'od zer can zhes bya ba\'i gzungs',
    canonicalTitleEn: 'The Noble Mārīcī (Goddess of Dawn Radiance) Dhāraṇī',
    crossRefs: {
      taishoIds: ['T21n1257', 'T21n1255B'],
      fangshanIds: ['F28n1071'],
      tohokuIds: ['Toh 564', 'Toh 965'],
      rktsIds: ['D564', 'D965'],
      dsbcIds: ['820/2949'],
      gretilIds: ['maricdhu.htm'],
      cudlMsIds: ['MS-ADD-01680-00008-00003', 'MS-ADD-01326'],
    },
    databasesPresent: [
      'db1_fangshan',
      'db2_taisho_ext',
      'db3_dsbc_gretil',
      'db4_84000',
      'db7_cudl_hidas',
      'db9_rkts',
    ],
    witnessSummary: [
      {
        dbId: 'db7_cudl_hidas',
        recordId: 'MS-ADD-01680-00008-00003',
        label: 'Cambridge CUDL MS-ADD-01680-00008-00003 Āryamārīcī & GRETIL maricdhu.htm',
        script: 'IAST',
        sampleMantraOrIncipit: 'tadyathā oṃ padākramāsi arkamāsi markamāsi uramāsi vanamāsi gulmamāsi cīvaramāsi mahācīvaramāsi antardhānamāsi svāhā | oṃ mārīcyai māṃ svāhā',
        url: 'https://cudl.lib.cam.ac.uk/view/MS-ADD-01680-00008-00003/1',
      },
    ],
  },
  {
    clusterId: 'cluster_11_grahamatrka',
    canonicalTitleSanskrit: 'Āryagrahamātṛkā-nāma-dhāraṇī (Grahamātṛkādhāraṇī)',
    canonicalTitleZh: '聖曜母陀羅尼經 (佛說聖曜母陀羅尼)',
    canonicalTitleTibetan: '\'phags pa gza\' rnams kyi yum zhes bya ba\'i gzungs',
    canonicalTitleEn: 'The Noble Mother of the Nine Planetary Deities (Grahamātṛkā) Dhāraṇī',
    crossRefs: {
      taishoIds: ['T21n1303'],
      fangshanIds: ['F28n1071'],
      tohokuIds: ['Toh 660', 'Toh 661', 'Toh 997'],
      rktsIds: ['D660', 'D661', 'D997'],
      dsbcIds: ['862/2990', '820/2949'],
      gretilIds: ['grahmdhu.htm'],
      buddhaNexusIds: ['K12grahmdhu'],
      cudlMsIds: ['MS-ADD-01680-00008-00003', 'MS-ADD-01326'],
      allNibsIds: ['nibs_newar_grahamatrka'],
    },
    databasesPresent: [
      'db1_fangshan',
      'db3_dsbc_gretil',
      'db4_84000',
      'db5_buddhanexus',
      'db7_cudl_hidas',
      'db9_rkts',
      'db10_all_nibs',
    ],
    witnessSummary: [
      {
        dbId: 'db3_dsbc_gretil',
        recordId: '862/2990',
        label: 'Nepal DSBC 862/2990 Grahamātṛkādhāraṇī, BuddhaNexus K12grahmdhu & CUDL MS-ADD-01680-00008-00003 [1r4]',
        script: 'IAST',
        sampleMantraOrIncipit: '[1r4] Āryagrahamātṛkā — oṃ namo bhagavatyai āryagrahamātṛkāyai | oṃ mejolkāya svāhā | oṃ śītāṃśave svāhā | oṃ raktāṅgāya svāhā',
        url: 'https://www.dsbcproject.org/canon-text/content/862/2990',
      },
    ],
  },
  {
    clusterId: 'cluster_12_pancaraksha_mahapratisara',
    canonicalTitleSanskrit: 'Pañcarakṣā (Mahāpratisarā, Mahāmāyūrī, Mahāsāhasrapramardanī, Mahāśītavatī, Mahāmantrānusāriṇī)',
    canonicalTitleZh: '五護陀羅尼經 (普遍光明清淨熾盛如意寶印心無能勝大明王大隨求陀羅尼經・孔雀明王經)',
    canonicalTitleTibetan: 'bsrung ba lnga (so sor \'brang ma chen mo / rma bya chen mo / bsil ba\'i tshal chen mo)',
    canonicalTitleEn: 'The Five Great Protective Goddesses (Pañcarakṣā: Mahāpratisarā, Mahāmāyūrī & Mahādaṇḍadhāraṇī-Śītavatī)',
    crossRefs: {
      taishoIds: ['T20n1153', 'T19n0982'],
      fangshanIds: ['F27n1050', 'F28n1071'],
      tohokuIds: ['Toh 558', 'Toh 559', 'Toh 560', 'Toh 561', 'Toh 562'],
      rktsIds: ['D558', 'D559', 'D560', 'D561', 'D562'],
      gretilIds: ['mahpratu.htm', 'psarkdhu.htm', 'mmayuvru.htm'],
      buddhaNexusIds: ['K12mahpratu', 'T02psarkdhu', 'SA_K12_Āgama_Mahādaṇḍadhāraṇīśītavatī_Hidas'],
      cudlMsIds: ['MS-ADD-01325', 'MS-ADD-01326', 'MS-ADD-01680-00008-00002', 'PR-FG-00870'],
    },
    databasesPresent: [
      'db1_fangshan',
      'db3_dsbc_gretil',
      'db4_84000',
      'db5_buddhanexus',
      'db7_cudl_hidas',
      'db9_rkts',
    ],
    witnessSummary: [
      {
        dbId: 'db7_cudl_hidas',
        recordId: 'SA_K12_Āgama_Mahādaṇḍadhāraṇīśītavatī_Hidas',
        label: 'Gergely Hidas Critical Edition of Mahādaṇḍadhāraṇī-Śītavatī & CUDL MS-ADD-01325 / MS-ADD-01326 Pañcarakṣā',
        script: 'IAST',
        sampleMantraOrIncipit: 'oṃ maṇidhari vajriṇi mahāpratisare rakṣa rakṣa māṃ sarvasattvāṃś ca hūṃ hūṃ phaṭ phaṭ svāhā',
        url: 'https://cudl.lib.cam.ac.uk/view/MS-ADD-01325/1',
      },
      {
        dbId: 'db5_buddhanexus',
        recordId: 'K12mahpratu',
        label: 'BuddhaNexus K12mahpratu & T02psarkdhu (GRETIL mahpratu.htm & psarkdhu.htm)',
        script: 'IAST',
        sampleMantraOrIncipit: 'namo buddhāya namo dharmāya namaḥ saṅghāya ... mahāpratisarāvidyārājñī',
        url: 'https://gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/mahpratu.htm',
      },
    ],
  },
  {
    clusterId: 'cluster_13_jnanolka_d848',
    canonicalTitleSanskrit: 'Āryajñānolkanāmadhāraṇīsarvagatipariśodhanī (Jñānolkadhāraṇī)',
    canonicalTitleZh: '智炬陀羅尼經 (佛說智炬陀羅尼經)',
    canonicalTitleTibetan: '\'phags pa ye shes ta la la zhes bya ba\'i gzungs \'gro ba thams cad yongs su sbyong ba',
    canonicalTitleEn: 'The Torch of Wisdom (Jñānolka) Purification of All Rebirths Dhāraṇī',
    crossRefs: {
      taishoIds: ['T21n1397', 'T21n1398'],
      fangshanIds: ['F28n1071'],
      tohokuIds: ['Toh 521', 'Toh 848', 'toh848'],
      rktsIds: ['K521', 'D848', 'D846', 'K846', '521'],
    },
    databasesPresent: ['db1_fangshan', 'db4_84000', 'db9_rkts'],
    witnessSummary: [
      {
        dbId: 'db9_rkts',
        recordId: 'D848',
        label: 'Vienna rKTs D848 ↔ K521 (Derge Zungdu 1D/100.txt ye shes ta la la)',
        script: 'Tibetan-EWTS',
        sampleMantraOrIncipit: 'rgya gar skad du / A rya dz+nyA no lka nA ma d+hA ra NI sarba ga ti pa ri sho d+ha nI / bod skad du / \'phags pa ye shes ta la la zhes bya ba\'i gzungs',
        url: 'http://www.rkts.org/rkts1/data/collections/D/D.xml',
      },
    ],
  },
  {
    clusterId: 'cluster_14_lotus_dharani_parivarta',
    canonicalTitleSanskrit: 'Saddharmapuṇḍarīkasūtra Ch. 21 Dhāraṇīparivarta',
    canonicalTitleZh: '妙法蓮華經卷第七陀羅尼品第二十六 (T09n0262)',
    canonicalTitleTibetan: 'dam pa\'i chos pad ma dkar po\'i mdo gzungs kyi le\'u',
    canonicalTitleEn: 'Lotus Sūtra Chapter 21 (26 in Chinese): Dhāraṇī Chapter (Bhaiṣajyarāja, Pradānaśūra, Vaiśravaṇa & Hārītī)',
    crossRefs: {
      taishoIds: ['T09n0262', '0262'],
      tohokuIds: ['Toh 113'],
      rktsIds: ['K113', 'D113'],
      polyglottaVids: ['vid=483&cid=456868', '483'],
    },
    databasesPresent: ['db2_taisho_ext', 'db8_polyglotta', 'db9_rkts'],
    witnessSummary: [
      {
        dbId: 'db8_polyglotta',
        recordId: '483&cid=456868',
        label: 'Oslo Bibliotheca Polyglotta vid=483&cid=456868 (Kern-Nanjio Sanskrit, Kumārajīva T09n0262, Tibetan Parallel)',
        script: 'IAST',
        sampleMantraOrIncipit: 'tadyathā anye manye mane mamane citte carite śame śamitāvi śānte mukte muktatame same aviṣame samasame jaye kṣaye akṣīṇe śānte samite dhāraṇī ālokabhāṣe pratyavekṣaṇi nidhiru abhyantaraviśuddhe utkule mutkule araḍe paraḍe sukāṅkṣi asamasame बुद्धvilokite dharmaparīkṣite saṃghanirghoṣaṇi nirghoṣaṇi bhayābhayaviśodhani mantre mantrākṣayate rute rutakauśalye akṣaye akṣayavanatāye vakkule valoḍa amanyanatāye svāhā',
        url: 'https://polyglotta.uio.no/index.php?page=fulltext&view=fulltext&vid=483&cid=456868',
      },
      {
        dbId: 'db2_taisho_ext',
        recordId: 'T09n0262',
        label: 'CBETA Taishō T09n0262 妙法蓮華經陀羅尼品 (92 inline phonetic/fanqie notes)',
        script: 'Chinese',
        sampleMantraOrIncipit: '安爾 曼爾 摩禰 摩摩禰 旨隸 遮梨第 賒咩 賒履多瑋 (T09n0262)',
        url: 'https://github.com/cbeta-org/xml-p5/blob/master/T/T09/T09n0262.xml',
      },
    ],
  },
  {
    clusterId: 'cluster_15_suvarnaprabhasottama',
    canonicalTitleSanskrit: 'Suvarṇaprabhāsottamasūtrendrarāja (Suvarṇaprabhāsasūtra)',
    canonicalTitleZh: '合部金光明經 / 金光明最勝王經 (T16n0664 / T16n0665)',
    canonicalTitleTibetan: '\'phags pa gser \'od dam pa mdo sde\'i dbang po\'i rgyal po',
    canonicalTitleEn: 'The Sūtra of Golden Light (Suvarṇaprabhāsottama) & Opening Retention Mantra',
    crossRefs: {
      taishoIds: ['T16n0664', 'T16n0665', 'T16n0663'],
      tohokuIds: ['Toh 555', 'Toh 556', 'Toh 557'],
      rktsIds: ['D555', 'D556', 'D557'],
      allNibsIds: ['SA00019.001', 'KSK-00556'],
    },
    databasesPresent: ['db2_taisho_ext', 'db4_84000', 'db9_rkts', 'db10_all_nibs'],
    witnessSummary: [
      {
        dbId: 'db10_all_nibs',
        recordId: 'SA00019.001',
        label: 'ALL-NIBS SA00019.001 (Asha Archives MS 2145, KSK-00556 Suvarṇaprabhāsottama Diplomatic Transcription)',
        script: 'IAST',
        sampleMantraOrIncipit: '@1a oṃ̐ namo bhagavatyai āryasarasvatyai || tadyathā || śruti smṛti gati vijaye svāhā ||',
        url: 'https://publicapi.asianlegacylibrary.org/editions/SA00019.001',
      },
      {
        dbId: 'db2_taisho_ext',
        recordId: 'T16n0665',
        label: 'CBETA Taishō T16n0665 合部金光明經 (132 inline fanqie/phonetic notes)',
        script: 'Chinese',
        sampleMantraOrIncipit: '怛姪他 戍嚕帝 司蜜栗帝 毘闍耶 娑婆訶 (T16n0665)',
        url: 'https://github.com/cbeta-org/xml-p5/blob/master/T/T16/T16n0665.xml',
      },
    ],
  },
  {
    clusterId: 'cluster_16_guhyasamaja_caryamelapakapradipa',
    canonicalTitleSanskrit: 'Guhyasamājatantra & Āryadeva\'s Caryāmelāpakapradīpa (Ch. 3 Mantratattva / Pradīpoddyotana)',
    canonicalTitleZh: '一切如來金剛三業最上祕密大教王經 (密集續・行集燈論)',
    canonicalTitleTibetan: 'gsang ba \'dus pa & spyod pa bsdus pa\'i sgron ma (Toh 442 / Toh 1785 / Toh 1803)',
    canonicalTitleEn: 'Guhyasamāja Tantra, Candrakīrti\'s Pradīpoddyotana & Āryadeva\'s Caryāmelāpakapradīpa Ch. 3 (Vajrajāpa)',
    crossRefs: {
      taishoIds: ['T18n0885'],
      tohokuIds: ['Toh 442', 'Toh 1785', 'Toh 1803'],
      rktsIds: ['D442', 'TSK-01785', 'TSK-01803'],
      buddhaNexusIds: ['T02dipguhsu', 'SA_T02_Candrakīrti_Pradīpoddyotana_on_Guhyasamājatantra_Ch_1-5_13-17'],
      saritIds: ['caryamelapakapradipa', 'caryamelapakapradipa.xml', 'CMP03'],
      allNibsIds: ['SA00025.001', 'SA00016.001'],
    },
    databasesPresent: ['db5_buddhanexus', 'db6_sarit', 'db9_rkts', 'db10_all_nibs'],
    witnessSummary: [
      {
        dbId: 'db6_sarit',
        recordId: 'caryamelapakapradipa',
        label: 'SARIT caryamelapakapradipa.xml (Wedemeyer Critical Edition of Āryadeva\'s Caryāmelāpakapradīpa Ch. 3 Vāgviveka / Mantratattva)',
        script: 'IAST',
        sampleMantraOrIncipit: '[CMP03.001] athāto रहस्यं वक्ष्ये सर्वमन्त्रार्थसङ्ग्रहम् । प्राणायामं वज्रजापं ... oṃ āḥ hūṃ',
        url: 'https://github.com/sarit/sarit-pm/blob/master/caryamelapakapradipa.xml',
      },
      {
        dbId: 'db10_all_nibs',
        recordId: 'SA00025.001',
        label: 'ALL-NIBS SA00025.001 (Varanasi MS of Candrakīrti\'s Pradīpoddyotana, TSK-01785) & BuddhaNexus T02dipguhsu',
        script: 'IAST',
        sampleMantraOrIncipit: 'oṃ āḥ vajradhṛk hūṃ | oṃ āḥ jinajik hūṃ | oṃ āḥ ratnadhṛk hūṃ | oṃ āḥ ārolik hūṃ | oṃ āḥ prajñādhṛk hūṃ',
        url: 'https://publicapi.asianlegacylibrary.org/editions/SA00025.001',
      },
    ],
  },
  {
    clusterId: 'cluster_17_stts_sarvatathagatatattvasamgraha',
    canonicalTitleSanskrit: 'Sarvatathāgatatattvasaṅgraha (STTS) & Sarvavajrodayā',
    canonicalTitleZh: '金剛頂一切如來真實攝大乘現證大教王經 (T18n0865 / T18n0866)',
    canonicalTitleTibetan: 'de bzhin gshegs pa thams cad kyi de kho na nyid bsdus pa (Toh 479 / D479)',
    canonicalTitleEn: 'Compendium of Principles of All Tathāgatas (Sarvatathāgatatattvasaṅgraha) & Ānandagarbha\'s Sarvavajrodayā',
    crossRefs: {
      taishoIds: ['T18n0865', 'T0865', 'T18n0866'],
      tohokuIds: ['Toh 479', 'toh479'],
      rktsIds: ['D479', 'K479'],
      gretilIds: ['sarvttsu.htm'],
      buddhaNexusIds: ['K12sarvttsu'],
      muktabodhaOrOchsIds: ['stts_crited', 'svu_crited'],
    },
    databasesPresent: ['db2_taisho_ext', 'db3_dsbc_gretil', 'db5_buddhanexus', 'db9_rkts', 'db12_muktabodha_ochs'],
    witnessSummary: [
      {
        dbId: 'db12_muktabodha_ochs',
        recordId: 'stts_crited',
        label: 'ERC DHARMA Critical Editions stts_crited.txt (Horiuchi STTS) & svu_crited.txt (Sarvavajrodayā)',
        script: 'IAST',
        sampleMantraOrIncipit: 'oṃ cittaprativedhaṃ karomi | oṃ bodhicittam utpādayāmi | oṃ tiṣṭha vajra | oṃ vajrātmako \'ham | oṃ yathā sarvatathāgatās tathāham',
        url: 'https://github.com/erc-dharma/stts_crited',
      },
      {
        dbId: 'db5_buddhanexus',
        recordId: 'K12sarvttsu',
        label: 'BuddhaNexus K12sarvttsu & GRETIL sarvttsu.htm (Horiuchi / Yamada STTS Sanskrit Text)',
        script: 'IAST',
        sampleMantraOrIncipit: 'sarvatathāgatatattvasaṅgrahaṃ nāma mahāyānasūtram (T18n0865 / D479)',
        url: 'https://gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/sarvttsu.htm',
      },
    ],
  },
];

export const CANONICAL_CONCORDANCE_CLUSTERS = CONCORDANCE_CLUSTERS;

function normalizeIdToken(s: string): string {
  return normalizeDiacritics(s)
    .replace(/^vid=/i, '')
    .replace(/^toh\s*/i, 'toh')
    .replace(/^rkts\s*/i, '')
    .trim();
}

function clusterMatchesQuery(cluster: CanonicalConcordanceCluster, rawQuery: string, normQuery: string): boolean {
  const idTok = normalizeIdToken(rawQuery);
  const allRefs = [
    cluster.clusterId,
    cluster.canonicalTitleSanskrit,
    cluster.canonicalTitleZh,
    cluster.canonicalTitleTibetan,
    cluster.canonicalTitleEn,
    ...(cluster.crossRefs.taishoIds || []),
    ...(cluster.crossRefs.fangshanIds || []),
    ...(cluster.crossRefs.tohokuIds || []),
    ...(cluster.crossRefs.rktsIds || []),
    ...(cluster.crossRefs.dsbcIds || []),
    ...(cluster.crossRefs.gretilIds || []),
    ...(cluster.crossRefs.buddhaNexusIds || []),
    ...(cluster.crossRefs.saritIds || []),
    ...(cluster.crossRefs.cudlMsIds || []),
    ...(cluster.crossRefs.polyglottaVids || []),
    ...(cluster.crossRefs.allNibsIds || []),
    ...(cluster.crossRefs.idpOrCetomIds || []),
    ...(cluster.crossRefs.muktabodhaOrOchsIds || []),
    cluster.crossRefs.bdrcWorkId || '',
    ...cluster.witnessSummary.flatMap((w) => [w.recordId, w.label, w.sampleMantraOrIncipit]),
  ].filter(Boolean);

  for (const ref of allRefs) {
    const rNorm = normalizeDiacritics(ref);
    const rId = normalizeIdToken(ref);
    if (
      ref.toLowerCase().includes(rawQuery.toLowerCase()) ||
      rNorm.includes(normQuery) ||
      (idTok.length >= 2 && rId === idTok)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Resolves any canonical ID (Taishō T, Fangshan F, Tohoku Toh, rKTs D or K,
 * CUDL MS-ADD, Polyglotta vid, DSBC, GRETIL, ALL-NIBS, Muktabodha) or work title
 * across all 12 databases + baseline.
 */
export function resolveCanonicalConcordance(idOrTitle: string) {
  const rawQuery = String(idOrTitle ?? '').trim();
  if (!rawQuery) {
    return {
      query: rawQuery,
      status: 'not_found' as const,
      matchedClusters: [],
      primaryCluster: null,
      cluster: null,
      parallels: [],
      witnesses: [],
      results: [],
      message: 'Empty concordance query',
    };
  }

  const normQuery = normalizeDiacritics(rawQuery);
  const matchedClusters = CONCORDANCE_CLUSTERS.filter((c) => clusterMatchesQuery(c, rawQuery, normQuery));

  // If no static cluster matched, dynamically inspect baseline curated dhāraṇīs, rKTs, 84000, Polyglotta, and CUDL
  if (matchedClusters.length === 0) {
    const dynamicCluster = buildDynamicConcordanceCluster(rawQuery, normQuery);
    if (dynamicCluster) {
      matchedClusters.push(dynamicCluster);
    }
  }

  if (matchedClusters.length === 0) {
    return {
      query: rawQuery,
      status: 'not_found' as const,
      matchedClusters: [],
      primaryCluster: null,
      cluster: null,
      parallels: [],
      witnesses: [],
      results: [],
      message: `No concordance cluster found for "${rawQuery}"`,
    };
  }

  const witnesses = matchedClusters.flatMap((c) => c.witnessSummary);

  return {
    query: rawQuery,
    status: 'ok' as const,
    matchedClusters,
    primaryCluster: matchedClusters[0],
    cluster: matchedClusters[0],
    parallels: witnesses,
    witnesses,
    results: matchedClusters,
  };
}

function buildDynamicConcordanceCluster(rawQuery: string, normQuery: string): CanonicalConcordanceCluster | null {
  // Check baseline curated dhāraṇīs
  const dharani = BASELINE_CURATED_DHARANIS.find(
    (d) =>
      normalizeDiacritics(d.id).includes(normQuery) ||
      normalizeDiacritics(d.titleSanskrit).includes(normQuery) ||
      d.titleZh.includes(rawQuery) ||
      normalizeDiacritics(d.taishoId).includes(normQuery)
  );
  if (dharani) {
    return {
      clusterId: `dynamic_dharani_${dharani.id}`,
      canonicalTitleSanskrit: dharani.titleSanskrit,
      canonicalTitleZh: dharani.titleZh,
      canonicalTitleTibetan: '',
      canonicalTitleEn: dharani.titleEn,
      crossRefs: dharani.authoritativeSource.crossRefs || { taishoIds: [dharani.taishoId] },
      databasesPresent: ['db1_fangshan', 'db2_taisho_ext', 'db3_dsbc_gretil', 'db4_84000'],
      witnessSummary: [
        {
          dbId: 'db2_taisho_ext',
          recordId: dharani.taishoId,
          label: `${dharani.titleZh} (${dharani.taishoId} · ${dharani.translator})`,
          script: 'Siddham',
          sampleMantraOrIncipit: dharani.verses[0]?.iast || dharani.titleSanskrit,
          url: dharani.authoritativeSource.cbetaRawUrl || 'https://cbetaonline.dila.edu.tw',
        },
      ],
    };
  }

  // Check rKTs Derge Zungdu catalog (D846–D1095)
  const rktsHit = DB9_RKTS_CORPUS.dergeZungduCatalog.find(
    (z) =>
      z.dergeRef.toLowerCase() === rawQuery.toLowerCase() ||
      z.rktsId.toLowerCase() === rawQuery.toLowerCase() ||
      normalizeDiacritics(z.sanskritTitleStandard || '').includes(normQuery) ||
      normalizeDiacritics(z.tibetanTitleWylie).includes(normQuery)
  );
  if (rktsHit) {
    return {
      clusterId: `dynamic_rkts_${rktsHit.dergeRef}`,
      canonicalTitleSanskrit: rktsHit.sanskritTitleStandard || rktsHit.tibetanTitleWylie,
      canonicalTitleZh: `德格版陀羅尼集 (${rktsHit.dergeRef} ↔ ${rktsHit.rktsId})`,
      canonicalTitleTibetan: rktsHit.tibetanTitleWylie,
      canonicalTitleEn: `Derge Zungdu ${rktsHit.dergeRef} (${rktsHit.rktsId})`,
      crossRefs: {
        tohokuIds: [`Toh ${rktsHit.dergeRef.replace(/^D/i, '')}`],
        rktsIds: [rktsHit.dergeRef, rktsHit.rktsId],
      },
      databasesPresent: ['db4_84000', 'db9_rkts'],
      witnessSummary: [
        {
          dbId: 'db9_rkts',
          recordId: rktsHit.dergeRef,
          label: `Vienna rKTs ${rktsHit.dergeRef} (${rktsHit.rktsId}) Vol. ${rktsHit.bdrcVolume}, ${rktsHit.folioLocation}`,
          script: 'Tibetan-EWTS',
          sampleMantraOrIncipit: rktsHit.tibetanTitleWylie,
          url: 'http://www.rkts.org/rkts1/data/collections/D/D.xml',
        },
      ],
    };
  }

  // Check 84000 corpus
  const tohHit = DB4_84000_CORPUS.records.find(
    (r) =>
      r.tohokuIds.some((t) => t.toLowerCase() === rawQuery.toLowerCase().replace(/\s+/g, '')) ||
      normalizeDiacritics(r.titles.saLtn).includes(normQuery) ||
      normalizeDiacritics(r.titles.en).includes(normQuery)
  );
  if (tohHit) {
    return {
      clusterId: `dynamic_84000_${tohHit.utId}`,
      canonicalTitleSanskrit: tohHit.titles.saLtn,
      canonicalTitleZh: tohHit.titles.en,
      canonicalTitleTibetan: tohHit.titles.boUnicode || tohHit.titles.boLtn,
      canonicalTitleEn: tohHit.titles.en,
      crossRefs: {
        tohokuIds: tohHit.tohokuIds,
        bdrcWorkId: tohHit.bdrcWorkId,
      },
      databasesPresent: ['db4_84000', 'db9_rkts'],
      witnessSummary: [
        {
          dbId: 'db4_84000',
          recordId: tohHit.utId,
          label: `84000 ${tohHit.tohokuIds.join(', ')}: ${tohHit.titles.en}`,
          script: 'IAST',
          sampleMantraOrIncipit: tohHit.mantras[0]?.sanskritIast || tohHit.titles.saLtn,
          url: tohHit.sourceUrl,
        },
      ],
    };
  }

  // Check CUDL manuscripts
  const cudlHit = DB7_CUDL_HIDAS_CORPUS.manuscripts.find(
    (m) =>
      m.cudlId.toLowerCase() === rawQuery.toLowerCase() ||
      normalizeDiacritics(m.title).includes(normQuery)
  );
  if (cudlHit) {
    return {
      clusterId: `dynamic_cudl_${cudlHit.cudlId}`,
      canonicalTitleSanskrit: cudlHit.title,
      canonicalTitleZh: `劍橋大學貝葉經 ${cudlHit.shelfLocator}`,
      canonicalTitleTibetan: '',
      canonicalTitleEn: `${cudlHit.shelfLocator} — ${cudlHit.title}`,
      crossRefs: { cudlMsIds: [cudlHit.cudlId] },
      databasesPresent: ['db7_cudl_hidas'],
      witnessSummary: [
        {
          dbId: 'db7_cudl_hidas',
          recordId: cudlHit.cudlId,
          label: `${cudlHit.shelfLocator} (${cudlHit.dateDisplay})`,
          script: 'IAST',
          sampleMantraOrIncipit: cudlHit.transcribedRubricsAndExcerpts[0] || cudlHit.abstractShort,
          url: cudlHit.viewerUrl,
        },
      ],
    };
  }

  // Check Polyglotta volumes
  const polyHit = DB8_POLYGLOTTA_CORPUS.volumes.find(
    (v) =>
      `vid=${v.vid}` === rawQuery.toLowerCase() ||
      String(v.vid) === rawQuery ||
      normalizeDiacritics(v.titleSanskrit).includes(normQuery)
  );
  if (polyHit) {
    return {
      clusterId: `dynamic_polyglotta_${polyHit.vid}`,
      canonicalTitleSanskrit: polyHit.titleSanskrit,
      canonicalTitleZh: polyHit.titleZh,
      canonicalTitleTibetan: '',
      canonicalTitleEn: polyHit.titleEn,
      crossRefs: { polyglottaVids: [`vid=${polyHit.vid}`] },
      databasesPresent: ['db8_polyglotta'],
      witnessSummary: [
        {
          dbId: 'db8_polyglotta',
          recordId: `vid=${polyHit.vid}`,
          label: `Oslo Bibliotheca Polyglotta vid=${polyHit.vid}: ${polyHit.titleSanskrit}`,
          script: 'IAST',
          sampleMantraOrIncipit: polyHit.alignedRows[0]?.cells[0]?.text || polyHit.titleSanskrit,
          url: polyHit.sourceUrl,
        },
      ],
    };
  }

  return null;
}

/**
 * Searches or returns the unified quadrilingual glossary (84000 + Mahāvyutpatti §25/§198 + T54 Lexicons).
 */
export function getUnifiedMultilingualGlossary(query?: string): TrilingualGlossaryEntry[] {
  const raw = String(query ?? '').trim();
  if (!raw) return UNIFIED_QUADRILINGUAL_GLOSSARY;
  const norm = normalizeDiacritics(raw);

  return UNIFIED_QUADRILINGUAL_GLOSSARY.filter((entry) => {
    const combined = [
      entry.sanskritIast,
      entry.tibetanWylie,
      entry.tibetanUnicode,
      entry.chinese,
      entry.siddhamUnicode,
      entry.english,
      entry.definition,
      entry.sourceRef,
    ]
      .filter(Boolean)
      .join(' ');
    return (
      combined.toLowerCase().includes(raw.toLowerCase()) ||
      normalizeDiacritics(combined).includes(norm)
    );
  });
}
