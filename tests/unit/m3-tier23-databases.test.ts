import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import {
  DB7_CUDL_HIDAS_CORPUS,
  DB8_POLYGLOTTA_CORPUS,
  DB9_RKTS_CORPUS,
  DB10_ALL_NIBS_CORPUS,
  DB11_IDP_DUNHUANG_CORPUS,
  DB12_MUKTABODHA_OCHS_CORPUS,
  TIER23_DATABASE_SUMMARIES,
  TIER23_DATABASES_BY_ID,
} from '../../src/data/generated/tier23Databases';

import {
  getTier23DatabaseSummaries,
  getTier23DatabaseById,
  getTier23CorpusById,
  inspectTier23Record,
  searchTier23Databases,
  searchTier23Corpora,
  lookupTier23Bija,
  getTier23PolyglottaGlossary,
  normalizeNewarToStandardSanskrit,
  ALL_PUBLIC_API_BEARER_TOKEN,
  ALL_PUBLIC_API_ENDPOINT,
} from '../../src/services/tier23CorpusService';

const ROOT_DIR = path.resolve(__dirname, '../..');
const PUBLIC_TIER23_DIR = path.join(ROOT_DIR, 'public', 'data', 'tier23');

function hasPuaCharacters(str: string): boolean {
  return /[\uE000-\uF8FF]|[\u{F0000}-\u{10FFFF}]/u.test(str);
}

describe('M3 Category II & III Databases: Global Integrity & JSON Artifacts', () => {
  it('exports all 6 database summaries (DBs #7–#12) and writes all 7 JSON files to public/data/tier23/', () => {
    const summaries = getTier23DatabaseSummaries();
    expect(summaries).toHaveLength(6);
    expect(summaries.map((s) => s.id)).toEqual([
      'db7_cudl_hidas',
      'db8_polyglotta',
      'db9_rkts',
      'db10_all_nibs',
      'db11_idp_dunhuang',
      'db12_muktabodha_ochs',
    ]);
    expect(summaries.map((s) => s.number)).toEqual([7, 8, 9, 10, 11, 12]);
    for (const s of summaries) {
      expect(s.totalRecordsCount).toBeGreaterThan(0);
      expect(s.mantraOrDharaniCount).toBeGreaterThan(0);
      expect(s.primarySourceUrls.length).toBeGreaterThan(0);
    }

    const expectedJsonFiles = [
      'db7_cudl_hidas.json',
      'db8_polyglotta.json',
      'db9_rkts.json',
      'db10_all_nibs.json',
      'db11_idp_dunhuang.json',
      'db12_muktabodha_ochs.json',
      'tier23_summaries.json',
    ];
    for (const filename of expectedJsonFiles) {
      const fullPath = path.join(PUBLIC_TIER23_DIR, filename);
      expect(fs.existsSync(fullPath)).toBe(true);
      const raw = fs.readFileSync(fullPath, 'utf8');
      expect(raw.length).toBeGreaterThan(100);
      expect(hasPuaCharacters(raw)).toBe(false);
      expect(() => JSON.parse(raw)).not.toThrow();
    }
  });

  it('resolves all 6 databases via getTier23DatabaseById and getTier23CorpusById by ID and number', () => {
    expect(getTier23DatabaseById('db7_cudl_hidas')?.summary.number).toBe(7);
    expect(getTier23CorpusById(7)?.summary.id).toBe('db7_cudl_hidas');
    expect(getTier23DatabaseById('db8_polyglotta')?.summary.number).toBe(8);
    expect(getTier23CorpusById(8)?.summary.id).toBe('db8_polyglotta');
    expect(getTier23DatabaseById('db9_rkts')?.summary.number).toBe(9);
    expect(getTier23CorpusById(9)?.summary.id).toBe('db9_rkts');
    expect(getTier23DatabaseById('db10_all_nibs')?.summary.number).toBe(10);
    expect(getTier23CorpusById(10)?.summary.id).toBe('db10_all_nibs');
    expect(getTier23DatabaseById('db11_idp_dunhuang')?.summary.number).toBe(11);
    expect(getTier23CorpusById(11)?.summary.id).toBe('db11_idp_dunhuang');
    expect(getTier23DatabaseById('db12_muktabodha_ochs')?.summary.number).toBe(12);
    expect(getTier23CorpusById(12)?.summary.id).toBe('db12_muktabodha_ochs');
    expect(getTier23DatabaseById('non_existent_db')).toBeNull();
    expect(Object.keys(TIER23_DATABASES_BY_ID)).toHaveLength(6);
  });
});

describe('Feature F9 — DB #7 (db7_cudl_hidas): Cambridge CUDL & Gergely Hidas Editions (T1-F9-01..05, T2-F9-01..05)', () => {
  it('T1-F9-01 & T2-F9-05: indexes 69 Cambridge Dhāraṇī manuscripts with zero duplicates', () => {
    expect(DB7_CUDL_HIDAS_CORPUS.totalDharaniManuscriptsFound).toBe(69);
    expect(DB7_CUDL_HIDAS_CORPUS.manuscripts.length).toBeGreaterThanOrEqual(69);
    const uniqueIds = new Set(DB7_CUDL_HIDAS_CORPUS.manuscripts.map((m) => m.cudlId));
    expect(uniqueIds.size).toBe(DB7_CUDL_HIDAS_CORPUS.manuscripts.length);
    const fullStr = JSON.stringify(DB7_CUDL_HIDAS_CORPUS);
    expect(fullStr).toContain('cudl.lib.cam.ac.uk');
    expect(fullStr).toContain('MS-ADD-01326');
  });

  it('T1-F9-02 & T2-F9-03: MS-ADD-01326 has 458 pages, 839 NS / 1719 CE date, diplomatic rubrics, and clean IIIF URLs without .jp2.jp2', () => {
    const ms1326 = DB7_CUDL_HIDAS_CORPUS.manuscripts.find((m) => m.cudlId === 'MS-ADD-01326');
    expect(ms1326).toBeDefined();
    expect(ms1326?.numberOfPages).toBe(458);
    expect(ms1326?.iiifManifestUrl).toBe('https://cudl.lib.cam.ac.uk/iiif/MS-ADD-01326');
    const rubricsStr = JSON.stringify( inspectTier23Record('db7_cudl_hidas', 'MS-ADD-01326') );
    expect(rubricsStr).toContain('458');
    expect(rubricsStr).toContain('sarvvabuddhabodhisatvebhyaḥ');
    expect(rubricsStr).toContain('parisamāptaḥ');
    expect(rubricsStr).toContain('1719');

    const fullDb7Str = JSON.stringify(DB7_CUDL_HIDAS_CORPUS);
    expect(fullDb7Str).toContain('images.lib.cam.ac.uk/iiif/');
    expect(fullDb7Str).not.toContain('.jp2.jp2');
  });

  it('T1-F9-03, T2-F9-01, T2-F9-02: MS-ADD-01680-00008-00001..3 bundle & parent MS-ADD-01680-00008 resolve all 3 sub-items and section rubrics', () => {
    const inspectSub3 = JSON.stringify(inspectTier23Record('db7_cudl_hidas', 'MS-ADD-01680-00008-00003'));
    expect(inspectSub3).toContain('MS-ADD-01680-00008-00001');
    expect(inspectSub3).toContain('MS-ADD-01680-00008-00002');
    expect(inspectSub3).toContain('MS-ADD-01680-00008-00003');
    expect(inspectSub3).toContain('Āryoṣṇīṣavijayā');
    expect(inspectSub3).toContain('Āryagrahamātṛkā');
    expect(inspectSub3).toContain('Āryamārīcī');
    expect(inspectSub3).toContain('Āryacundā');
    expect(inspectSub3).toContain('Āryadhātukaraṇḍā');
    expect(inspectSub3).toContain('[23v5]');
    expect(inspectSub3).toContain('[15r2]');

    const inspectParent = JSON.stringify(inspectTier23Record('db7_cudl_hidas', 'MS-ADD-01680-00008'));
    expect(inspectParent).toContain('MS-ADD-01680-00008-00001');
    expect(inspectParent).toContain('MS-ADD-01680-00008-00002');
    expect(inspectParent).toContain('MS-ADD-01680-00008-00003');
  });

  it('T1-F9-04 & T2-F9-04: includes all 9 Gergely Hidas open-access critical/diplomatic editions with CUDL & Derge/Tohoku cross-references', () => {
    const requiredHidasIds = [
      'SA_K12_Āgama_Māṇibhadradhāraṇī_Hidas',
      'SA_K12_Āgama_Mahādhāraṇī',
      'SA_K12_Āgama_Sarvakarmāvaraṇaviśodhanīdhāraṇī',
      'SA_K12_Āgama_Mahāśrīnāmadvādaśaka_Hidas',
      'SA_K12_Āgama_Sahasrāvartādhāraṇī',
      'SA_K12_Āgama_Surūpādhāraṇī',
      'SA_K12_Āgama_Mahādaṇḍadhāraṇīśītavatī_Hidas',
      'SA_K12_Āgama_Vajratuṇḍanāgasamaya_Hidas',
      'SA_T01_Vajraḍākadaṇḍakastotra_CUL',
    ];
    expect(DB7_CUDL_HIDAS_CORPUS.hidasCriticalEditions.map((h) => h.id)).toEqual(requiredHidasIds);
    for (const h of DB7_CUDL_HIDAS_CORPUS.hidasCriticalEditions) {
      expect(h.segments.length).toBeGreaterThan(0);
      expect(h.extractedMantraIast.length).toBeGreaterThan(10);
    }

    const inspectManibhadra = JSON.stringify(
      inspectTier23Record('db7_cudl_hidas', 'SA_K12_Āgama_Māṇibhadradhāraṇī_Hidas')
    );
    expect(inspectManibhadra).toContain('1326');
    expect(inspectManibhadra).toContain('764');
    expect(inspectManibhadra).toContain('970');
  });

  it('T1-F9-05: PR-FG-00870 (770 CE Hyakumantō darani) links with Saptavāra and Pañcarakṣā', () => {
    const inspectPr = JSON.stringify(inspectTier23Record('db7_cudl_hidas', 'PR-FG-00870'));
    expect(inspectPr).toContain('PR-FG-00870');
    expect(inspectPr).toContain('Saptavāra');
    expect(inspectPr).toContain('Pañcarakṣā');
  });
});

describe('Feature F10 — DB #8 (db8_polyglotta): Oslo Bibliotheca Polyglotta (T1-F10-01..05, T2-F10-01..05)', () => {
  it('T1-F10-01, T2-F10-01, T2-F10-02: uses live polyglotta.uio.no domain and strips inline <a class="fotnote"> and <div class="note"> tags', () => {
    const fullStr = JSON.stringify(DB8_POLYGLOTTA_CORPUS);
    expect(fullStr).toContain('polyglotta.uio.no');
    expect(fullStr).not.toContain('Polyglotta has moved');
    expect(/<a\s+class=['"]fotnote|<div\s+class=['"]note/i.test(fullStr)).toBe(false);
  });

  it('T1-F10-02 & T2-F10-04: vid=1175 Prajñāpāramitāhṛdaya 16-witness alignment contains Vaidya, Conze, T.250, T.251, T.257, gate gate, 揭諦揭諦, ga te ga te', () => {
    const inspect1175 = JSON.stringify(inspectTier23Record('db8_polyglotta', '1175'));
    expect(inspect1175).toContain('1175');
    expect(inspect1175).toContain('Prajñāpāramitāhṛdaya');
    expect(inspect1175).toContain('gate gate pāragate pārasaṃgate bodhi svāhā');
    expect(inspect1175).toContain('揭諦揭諦');
    expect(inspect1175).toContain('ga te ga te');
    expect(inspect1175).toContain('Vaidya');
    expect(inspect1175).toContain('Conze');
    expect(inspect1175).toContain('T.250');
    expect(inspect1175).toContain('T.251');
    expect(inspect1175).toContain('T.257');
  });

  it('T1-F10-03 & T1-F10-05: contains all parallel dhāraṇī/stotra volumes (1134, 727, 207, 1020, 1264, 483) and all 7 Kanjur Prajñāpāramitā volumes (691..683)', () => {
    const vids = DB8_POLYGLOTTA_CORPUS.volumes.map((v) => v.vid);
    for (const expectedVid of [1175, 1134, 727, 207, 1020, 1264, 483, 263, 691, 689, 688, 697, 686, 685, 683]) {
      expect(vids).toContain(expectedVid);
    }
  });

  it('T1-F10-04, T2-F10-03, T2-F10-05: supports composite vid&cid lookup (483&cid=456868, 263&cid=335411, 263&cid=338889) and quadrilingual Mahāvyutpatti search', () => {
    const rLotus = JSON.stringify(inspectTier23Record('db8_polyglotta', '483&cid=456868'));
    expect(rLotus).toContain('456868');
    expect(rLotus).toContain('Dhāraṇīparivarta');
    expect(rLotus).toContain('Bhaiṣajyarāja');
    expect(rLotus).toContain('Saddharmapuṇḍarīka');

    const rMvy25 = JSON.stringify(inspectTier23Record('db8_polyglotta', '263&cid=335411'));
    expect(rMvy25).toContain('335411');
    expect(rMvy25).toContain('bodhisattvadhāraṇyaḥ');

    const rMvy198 = JSON.stringify(inspectTier23Record('db8_polyglotta', '263&cid=338889'));
    expect(rMvy198).toContain('338889');
    expect(rMvy198).toContain('mantranayāvanirgatāni');

    const r263 = JSON.stringify(inspectTier23Record('db8_polyglotta', '263'));
    expect(r263).toContain('335411');
    expect(r263).toContain('338889');
    expect(r263).toContain('vidyārājñī');
    expect(r263).toContain('sGra sbyor');

    const glossary = getTier23PolyglottaGlossary();
    expect(glossary.length).toBeGreaterThanOrEqual(116);

    const searchVidya = JSON.stringify(searchTier23Databases('vidyārājñī', { dbId: 'db8_polyglotta' }));
    expect(searchVidya).toContain('vidyārājñī');
    expect(searchVidya).toContain('rig sngags');
  });
});

describe('Feature F11 — DB #9 (db9_rkts): Vienna rKTs & Derge Zungdu (T1-F11-01..05, T2-F11-01..05)', () => {
  it('T1-F11-01, T1-F11-02, T2-F11-04, T2-F11-05: verifies standard.xml (16,179 / 4,997), collections.json (68 / MW22084), and D.xml (265 gzungs D846–D1095 / 3,115 rgyud)', () => {
    expect(DB9_RKTS_CORPUS.concordanceStats).toEqual({
      totalStandardWorks: 16179,
      totalWorksWithSanskritTitle: 4997,
      totalCanonicalCollections: 68,
      dergeZungduItemsCount: 265,
      dergeRgyudItemsCount: 3115,
      tibetanCorpusTextsCount: 3452,
    });
    expect(DB9_RKTS_CORPUS.dergeZungduCatalog).toHaveLength(265);
    expect(DB9_RKTS_CORPUS.dergeZungduCatalog[0].dergeRef).toBe('D846');
    expect(DB9_RKTS_CORPUS.dergeZungduCatalog.some((z) => z.dergeRef === 'D1095')).toBe(true);
    expect(JSON.stringify(DB9_RKTS_CORPUS)).toContain('MW22084');
  });

  it('T1-F11-03, T1-F11-05, T2-F11-01, T2-F11-02: parses 1D/100.txt & 1D/101.txt (143+ entries) and converts EWTS titles & mantras to IAST', () => {
    expect(DB9_RKTS_CORPUS.zungduEtextEntries.length).toBeGreaterThanOrEqual(143);
    const searchBadzra = JSON.stringify(searchTier23Databases('badzra', { dbId: 'db9_rkts' }));
    expect(searchBadzra).toContain('badzra');
    expect(searchBadzra).toContain('vajra');

    const fullDb9Str = JSON.stringify(DB9_RKTS_CORPUS);
    expect(fullDb9Str).toContain('1b1');
    expect(fullDb9Str).toContain('badzra me ru');
    expect(fullDb9Str).toContain('Āryamahāvajrameruśikharakūṭāgāradhāraṇī');
    expect(fullDb9Str).toContain('ts+tshuSh+ma');
    expect(fullDb9Str).toContain('ucchuṣma');
  });

  it('T1-F11-04 & T2-F11-03: resolves K846 and D848 ↔ rkts K521 (ye shes ta la la / Jñānolka)', () => {
    const inspectK846 = JSON.stringify(inspectTier23Record('db9_rkts', 'K846'));
    expect(inspectK846).toContain('K846');
    expect(inspectK846).toContain('3452');
    expect(inspectK846).toContain('tibetan-corpus');

    const inspectD848 = JSON.stringify(inspectTier23Record('db9_rkts', 'D848'));
    expect(inspectD848).toContain('D848');
    expect(inspectD848).toContain('K521');
    expect(inspectD848).toContain('ye shes ta la la');
    expect(inspectD848).toContain('Jñānolka');
  });
});

describe('Feature F12 — DB #10 (db10_all_nibs): ALL-NIBS & Newar Witnesses (T1-F12-01..05, T2-F12-01..05)', () => {
  it('T1-F12-01, T2-F12-03, T2-F12-05: indexes 106 Sanskrit MSS (10 NIBS Kathmandu + 96 Varanasi) using Bearer token byang-chub-kyi-sems', () => {
    expect(ALL_PUBLIC_API_BEARER_TOKEN).toBe('byang-chub-kyi-sems');
    expect(ALL_PUBLIC_API_ENDPOINT).toContain('publicapi.asianlegacylibrary.org');
    expect(DB10_ALL_NIBS_CORPUS.apiStats.totalSanskritManuscripts).toBe(106);
    expect(DB10_ALL_NIBS_CORPUS.apiStats.nibsKathmanduCount).toBe(10);
    expect(DB10_ALL_NIBS_CORPUS.apiStats.varanasiPreservationCount).toBe(96);
    expect(DB10_ALL_NIBS_CORPUS.manuscripts).toHaveLength(106);
  });

  it('T1-F12-02, T1-F12-03, T1-F12-05, T2-F12-02, T2-F12-04: SA00019.001 (KSK-00556) preserves @1a, candrabindu oṃ̐, sarvva, and śruti smṛti mantra', () => {
    const inspect19 = JSON.stringify(inspectTier23Record('db10_all_nibs', 'SA00019.001'));
    expect(inspect19).toContain('SA00019.001');
    expect(inspect19).toContain('KSK-00556');
    expect(inspect19).toContain('@1a');
    expect(inspect19).toContain('oṃ̐');
    expect(inspect19).toContain('sarvva');
    expect(inspect19).toContain('śruti smṛti gati vijaye svāhā');

    const fullDb10Str = JSON.stringify(DB10_ALL_NIBS_CORPUS);
    for (const reqId of [
      'SA00005.001',
      'SA00007.001',
      'SA00016.001',
      'SA00019.001',
      'SA00024.001',
      'SA00025.001',
      'SA00028.001',
      'KSK-00556',
      'KSK-00381',
      'TSK-01351',
      'TSK-01785',
      'TSK-03400',
    ]) {
      expect(fullDb10Str).toContain(reqId);
    }

    const searchSruti = JSON.stringify(searchTier23Databases('śruti smṛti', { dbId: 'db10_all_nibs' }));
    expect(searchSruti).toContain('SA00019.001');
    expect(searchSruti).toContain('śruti smṛti');
  });

  it('T1-F12-04 & T2-F12-01: includes 33+ Newar dhāraṇī witnesses and normalizes Newar scribal orthography (bajra→vajra, sbāhā→svāhā, sarvva→sarva)', () => {
    expect(DB10_ALL_NIBS_CORPUS.newarDharaniWitnesses.length).toBeGreaterThanOrEqual(33);
    const fullDb10Str = JSON.stringify(DB10_ALL_NIBS_CORPUS);
    for (const name of ['Nīlakaṇṭha', 'Cundā', 'Vasudhārā', 'Vajravidāriṇī', 'Kurukullā', 'Grahamātṛkā', 'Miroj Shakya']) {
      expect(fullDb10Str).toContain(name);
    }

    const norm = normalizeNewarToStandardSanskrit(
      'oṁ namaḥ sarvvabuddhabodhisatvebhyaḥ || imāni bajrapāṇe omsbāhā ||'
    );
    expect(norm.normalizedIast).toContain('oṃ namaḥ sarvabuddhabodhisatvebhyaḥ');
    expect(norm.normalizedIast).toContain('vajrapāṇe');
    expect(norm.normalizedIast).toContain('svāhā');
    expect(norm.notes.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Feature F13 — DB #11 (db11_idp_dunhuang): IDP Berlin, CEToM & CBETA Dunhuang (T1-F13-01..05, T2-F13-01..05)', () => {
  it('T1-F13-01 & T2-F13-02: WAF-free IDP Berlin (idp.bbaw.de) and Vienna CEToM (cetom.univie.ac.at) provenance', () => {
    const fullStr = JSON.stringify(DB11_IDP_DUNHUANG_CORPUS);
    expect(fullStr).toContain('idp.bbaw.de');
    expect(fullStr).toContain('cetom.univie.ac.at');
    expect(fullStr).not.toContain('Just a moment...');
    expect(fullStr).not.toContain('403 Forbidden');
  });

  it('T1-F13-02, T1-F13-03, T2-F13-01, T2-F13-04: IOL San 397 (Kudo_2006b), Dalton_vanSchaik_2005, and Or.15001/18 (Wille_2009a)', () => {
    const inspectIol = JSON.stringify(inspectTier23Record('db11_idp_dunhuang', 'IOL San 397'));
    expect(inspectIol).toContain('IOL San 397');
    expect(inspectIol).toContain('Dalton_vanSchaik_2005');
    expect(inspectIol).toContain('Kudo_2006b');
    expect(inspectIol).toContain('Ch.00262');
    expect(inspectIol).toContain('amāñi vihi phali');
    expect(inspectIol).toContain('sarvarājav');

    const fullStr = JSON.stringify(DB11_IDP_DUNHUANG_CORPUS);
    expect(fullStr).toContain('Wille_2009a');
    expect(fullStr).toContain('Or.15001/18');
    expect(fullStr).toContain('kuṃdhari');
    expect(fullStr).toContain('dudume');
  });

  it('T1-F13-04: CEToM THT 3187 (SHT 1815 Kizil Nīlakaṇṭha Dhāraṇī) and 12 Pelliot Sanskrit MSS (psbl13..psuv67)', () => {
    expect(DB11_IDP_DUNHUANG_CORPUS.cetomRecords).toHaveLength(13);
    const inspectTht = JSON.stringify(inspectTier23Record('db11_idp_dunhuang', 'THT 3187'));
    expect(inspectTht).toContain('THT 3187');
    expect(inspectTht).toContain('SHT 1815');
    expect(inspectTht).toContain('kāruṇikāya');
    expect(inspectTht).toContain('cara vicara');
    expect(inspectTht).toContain('psuv67');
  });

  it('T1-F13-05 & T2-F13-05: CBETA Dunhuang T85 (T85n2880, T85n2898) and ZW (ZW01n0011..ZW11n0092)', () => {
    const inspectT85 = JSON.stringify(inspectTier23Record('db11_idp_dunhuang', 'T85n2880'));
    for (const id of [
      'T85n2880',
      'T85n2898',
      'ZW01n0011',
      'ZW03n0023',
      'ZW06n0051',
      'ZW06n0055',
      'ZW11n0091',
      'ZW11n0092',
    ]) {
      expect(inspectT85).toContain(id);
    }
  });
});

describe('Feature F14 — DB #12 (db12_muktabodha_ochs): Muktabodha, ERC DHARMA & Oxford OCHS (T1-F14-01..05, T2-F14-01..05)', () => {
  it('T1-F14-01, T1-F14-02, T1-F14-05, T2-F14-04: Muktabodha 499-work catalog and 10 full texts (M00247, M00292, M00635, M00229, M00626, M00018)', () => {
    expect(DB12_MUKTABODHA_OCHS_CORPUS.corpusStats.muktabodhaTotalTexts).toBe(499);
    const inspectM247 = JSON.stringify(inspectTier23Record('db12_muktabodha_ochs', 'M00247'));
    for (const req of ['M00247', 'M00292', 'M00635', 'M00229', 'M00626', 'M00018', 'Uddhārakośa', 'Mantrakoṣa', 'Advayavajrasaṃgraha', '499']) {
      expect(inspectM247).toContain(req);
    }
    const searchM247 = JSON.stringify(searchTier23Corpora('M00247', 'db12_muktabodha_ochs'));
    expect(searchM247).toContain('M00247');
    expect(searchM247).toContain('Uddhārakośa');
    expect(searchM247).toContain('499');
  });

  it('T1-F14-03 & T2-F14-05: ERC DHARMA critical editions of Sarvatathāgatatattvasaṅgraha (stts_crited) & Sarvavajrodayā (svu_crited)', () => {
    const fullStr = JSON.stringify(DB12_MUKTABODHA_OCHS_CORPUS);
    expect(fullStr).toContain('stts_crited');
    expect(fullStr).toContain('Sarvatathāgatatattvasaṅgraha');
    expect(fullStr).toContain('svu_crited');
    expect(fullStr).toContain('Sarvavajrodayā');
    expect(fullStr).toContain('T0865');
    expect(fullStr).toContain('D479');
  });

  it('T1-F14-04 & T2-F14-03: Oxford OCHS Bījanighaṇṭu (#30), Ekākṣarakośa (#46), Mantrakoṣa (#259), and Mātṛkārṇanighaṇṭu (#262) without HTML tag leakage', () => {
    const fullStr = JSON.stringify(DB12_MUKTABODHA_OCHS_CORPUS);
    expect(fullStr).toContain('ochs_000_000_030_bijanighantu');
    expect(fullStr).toContain('ochs_000_000_046_ekaksarakosa');
    expect(fullStr).toContain('ochs_000_000_259_mantrakosa');
    expect(fullStr).toContain('ochs_000_000_262_matrkarnanighantu');
    expect(fullStr).toContain('krodhabīja');
    expect(fullStr).toContain('pitṛbhūvāsinī');
    expect(fullStr).toContain('vāgbhava');
    expect(/<script|<html|<!DOCTYPE|<div\s+contenteditable/i.test(fullStr)).toBe(false);
  });

  it('T2-F14-01 & T2-F14-02: multi-script & case/diacritic-insensitive Bīja lookup and compound sequence decipherment', () => {
    const variants = ['hūṃ', 'hum', 'HUM', 'हूं', 'hrīḥ', 'hrih', 'krīṃ', 'krim', 'aiṃ', 'oṃ', 'āḥ', 'śrīṃ', 'bhrūṃ', 'phaṭ', 'svāhā'];
    for (const v of variants) {
      const res = lookupTier23Bija(v);
      expect(res.entries.length).toBeGreaterThanOrEqual(1);
    }

    const humRes = JSON.stringify(lookupTier23Bija('hūṃ'));
    expect(humRes).toContain('vyomāsya');
    expect(humRes).toContain('vidārī');
    expect(humRes).toContain('krodhabīja');
    expect(humRes).toContain('kūrca');
    expect(humRes).toContain('nādabindu');

    const seqRes = lookupTier23Bija('oṃ āḥ hūṃ hrīḥ svāhā');
    expect(seqRes.entries.map((e) => e.bijaIast)).toEqual(['oṃ', 'āḥ', 'hūṃ', 'hrīḥ', 'svāhā']);
  });
});
