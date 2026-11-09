/**
 * src/services/tier23CorpusService.ts
 * Query, Inspection, Search, Newar Orthographic Normalization & Bīja Decipherment Service
 * for Category II & III Databases (DBs #7–#12, Features F9–F14)
 */

import type {
  BijaLexiconEntry,
  DatabaseId,
  DatabaseMetadataSummary,
  Db7CudlHidasCorpus,
  Db8PolyglottaCorpus,
  Db9RktsCorpus,
  Db10AllNibsCorpus,
  Db11IdpDunhuangCorpus,
  Db12MuktabodhaOchsCorpus,
  TrilingualGlossaryEntry,
  UnifiedSearchHit,
} from '../types/corpus';

import {
  DB7_CUDL_HIDAS_CORPUS,
  DB8_POLYGLOTTA_CORPUS,
  DB9_RKTS_CORPUS,
  DB10_ALL_NIBS_CORPUS,
  DB11_IDP_DUNHUANG_CORPUS,
  DB12_MUKTABODHA_OCHS_CORPUS,
  TIER23_DATABASE_SUMMARIES,
} from '../data/generated/tier23Databases';

import { devanagariToSlp1, slp1ToIast } from '../core/transliterator';

export const ALL_PUBLIC_API_ENDPOINT = 'https://publicapi.asianlegacylibrary.org';
export const ALL_PUBLIC_API_BEARER_TOKEN = 'byang-chub-kyi-sems';

export type Tier23DatabaseId =
  | 'db7_cudl_hidas'
  | 'db8_polyglotta'
  | 'db9_rkts'
  | 'db10_all_nibs'
  | 'db11_idp_dunhuang'
  | 'db12_muktabodha_ochs';

export type Tier23CorpusUnion =
  | Db7CudlHidasCorpus
  | Db8PolyglottaCorpus
  | Db9RktsCorpus
  | Db10AllNibsCorpus
  | Db11IdpDunhuangCorpus
  | Db12MuktabodhaOchsCorpus;

/* ============================================================================
 * 1. Normalization Helpers (Diacritic-Insensitive & Newar-to-Standard Sanskrit)
 * ========================================================================== */

export function foldDiacritics(input: string): string {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeNewarToStandardSanskrit(diplomaticText: string): {
  normalizedIast: string;
  notes: string[];
} {
  const notes: string[] = [];
  let s = String(diplomaticText || '')
    .normalize('NFC')
    .replace(/\uF141/g, 'ṃ');

  if (/sbāh[aā]/i.test(s)) {
    notes.push('sbāhā → svāhā (Newar bilabial-dental cluster)');
    s = s.replace(/sbāh([aā])/gi, 'svāh$1');
  }

  if (
    /\bbajr|ombajr|\bsarb|\bbidy|\bdeba|\bbhagab|\bsatb|\bpūrb|\bbarṇ|\bnibār|\bkṛtb|\brāhub|\bketab|\bśītā[ṁṃ]śab/i.test(
      s
    )
  ) {
    notes.push('b → v (bajra → vajra, sarba → sarva, bhagabān → bhagavān)');
    s = s
      .replace(/\bbajr/gi, 'vajr')
      .replace(/ombajr/gi, 'oṃ vajr')
      .replace(/sarba/gi, 'sarva')
      .replace(/sarbe/gi, 'sarve')
      .replace(/sarbā/gi, 'sarvā')
      .replace(/bidy/gi, 'vidy')
      .replace(/deba/gi, 'deva')
      .replace(/bhagab/gi, 'bhagav')
      .replace(/satb/gi, 'sattv')
      .replace(/barṇ/gi, 'varṇ')
      .replace(/nibār/gi, 'nivār')
      .replace(/kṛtbā/gi, 'kṛtvā')
      .replace(/rāhub/gi, 'rāhuv')
      .replace(/ketab/gi, 'ketav')
      .replace(/śītā[ṁṃ]śabe/gi, 'śītāṃśave');
  }

  if (
    /r([vmyṇtddhn])\1/i.test(s) ||
    /sarvv|dharmm|āryy|karmm|sūryy|vīryy|pūrvv|parvv|suvarṇṇ|parṇṇ|karṇṇ|vartt/i.test(s)
  ) {
    notes.push('post-r gemination simplified (sarvva → sarva, dharmma → dharma, āryya → ārya)');
    s = s
      .replace(/sarvv/gi, 'sarv')
      .replace(/dharmm/gi, 'dharm')
      .replace(/āryy/gi, 'āry')
      .replace(/karmm/gi, 'karm')
      .replace(/sūryy/gi, 'sūry')
      .replace(/vīryy/gi, 'vīry')
      .replace(/pūrvv/gi, 'pūrv')
      .replace(/parvv/gi, 'parv')
      .replace(/suvarṇṇ/gi, 'suvarṇ')
      .replace(/parṇṇ/gi, 'parṇ')
      .replace(/karṇṇ/gi, 'karṇ')
      .replace(/vartt/gi, 'vart');
  }

  if (/ṁ/.test(s)) {
    notes.push('ṁ → ṃ (ISO 15919 anusvāra → standard IAST ṃ)');
    s = s.replace(/ṁ/g, 'ṃ');
  }

  if (/\bvaja(?=[tpdsghkcnmrlvśṣb]|$)/i.test(s)) {
    notes.push('vaja → vajra (Newar r-cluster reduction restored)');
    s = s.replace(/\bvaja/gi, 'vajra');
  }

  return { normalizedIast: s, notes };
}

/* ============================================================================
 * 2. Summary & Full Database Getters
 * ========================================================================== */

export function resolveTier23DatabaseId(dbId: Tier23DatabaseId | DatabaseId | number | string): Tier23DatabaseId | null {
  const raw = String(dbId || '')
    .trim()
    .toLowerCase();
  if (raw === '7' || raw === 'db7' || raw === 'db7_cudl_hidas' || raw.includes('cudl') || raw.includes('hidas')) {
    return 'db7_cudl_hidas';
  }
  if (raw === '8' || raw === 'db8' || raw === 'db8_polyglotta' || raw.includes('polyglotta')) {
    return 'db8_polyglotta';
  }
  if (raw === '9' || raw === 'db9' || raw === 'db9_rkts' || raw.includes('rkts')) {
    return 'db9_rkts';
  }
  if (raw === '10' || raw === 'db10' || raw === 'db10_all_nibs' || raw.includes('all_nibs') || raw.includes('nibs')) {
    return 'db10_all_nibs';
  }
  if (raw === '11' || raw === 'db11' || raw === 'db11_idp_dunhuang' || raw.includes('idp') || raw.includes('cetom')) {
    return 'db11_idp_dunhuang';
  }
  if (raw === '12' || raw === 'db12' || raw === 'db12_muktabodha_ochs' || raw.includes('muktabodha') || raw.includes('ochs')) {
    return 'db12_muktabodha_ochs';
  }
  return null;
}

export function getTier23DatabaseSummaries(): DatabaseMetadataSummary[] {
  return TIER23_DATABASE_SUMMARIES;
}

export function getTier23DatabaseById(dbId: Tier23DatabaseId | DatabaseId | number | string): Tier23CorpusUnion | null {
  const resolved = resolveTier23DatabaseId(dbId);
  switch (resolved) {
    case 'db7_cudl_hidas':
      return DB7_CUDL_HIDAS_CORPUS;
    case 'db8_polyglotta':
      return DB8_POLYGLOTTA_CORPUS;
    case 'db9_rkts':
      return DB9_RKTS_CORPUS;
    case 'db10_all_nibs':
      return DB10_ALL_NIBS_CORPUS;
    case 'db11_idp_dunhuang':
      return DB11_IDP_DUNHUANG_CORPUS;
    case 'db12_muktabodha_ochs':
      return DB12_MUKTABODHA_OCHS_CORPUS;
    default:
      return null;
  }
}

export const getTier23CorpusById = getTier23DatabaseById;

/* ============================================================================
 * 3. Resilient Record Inspection (`inspectTier23Record`)
 * ========================================================================== */

export function inspectTier23Record(dbId: Tier23DatabaseId | DatabaseId | number | string, recordId?: string): unknown {
  const resolvedDb = resolveTier23DatabaseId(dbId);
  const corpus = getTier23DatabaseById(dbId);
  if (!corpus || !resolvedDb) return null;

  const qRaw = String(recordId || '').trim();
  if (!qRaw) {
    return corpus;
  }
  const qLower = qRaw.toLowerCase();
  const qFold = foldDiacritics(qRaw);

  // DB #7: Cambridge CUDL & Gergely Hidas
  if (resolvedDb === 'db7_cudl_hidas') {
    const c7 = corpus as Db7CudlHidasCorpus;

    // Handle MS-ADD-01680-00008 parent bundle or any of its 3 sub-items (-00001, -00002, -00003)
    if (qLower.includes('1680-00008') || qLower.includes('1680.8')) {
      const bundleSubItems = c7.manuscripts.filter((m) => m.cudlId.startsWith('MS-ADD-01680-00008'));
      const primary =
        bundleSubItems.find((m) => m.cudlId.toLowerCase() === qLower) || bundleSubItems[bundleSubItems.length - 1];
      return {
        databaseId: 'db7_cudl_hidas',
        bundleParentId: 'MS-ADD-01680-00008',
        primaryRecord: primary,
        bundleSubItems,
        hidasCriticalEditions: c7.hidasCriticalEditions,
      };
    }

    // Handle PR-FG-00870 (770 CE Hyakumantō darani) with Saptavāra and Pañcarakṣā parallels
    if (qLower.includes('pr-fg-00870') || qLower.includes('hyakumanto')) {
      const prRecord = c7.manuscripts.find((m) => m.cudlId === 'PR-FG-00870');
      const relatedManuscripts = c7.manuscripts.filter((m) =>
        ['MS-ADD-01315', 'MS-ADD-01325', 'MS-ADD-01326'].includes(m.cudlId)
      );
      return {
        databaseId: 'db7_cudl_hidas',
        record: prRecord,
        relatedManuscripts,
      };
    }

    const msMatch = c7.manuscripts.find(
      (m) =>
        m.cudlId.toLowerCase() === qLower ||
        m.shelfLocator.toLowerCase() === qLower ||
        foldDiacritics(m.title).includes(qFold)
    );
    if (msMatch) {
      return {
        databaseId: 'db7_cudl_hidas',
        record: msMatch,
        relatedHidasEditions: c7.hidasCriticalEditions.filter((h) =>
          h.crossRefs?.cudlMsIds?.includes(msMatch.cudlId)
        ),
      };
    }

    const hidasMatch = c7.hidasCriticalEditions.find(
      (h) =>
        h.id.toLowerCase() === qLower ||
        foldDiacritics(h.id) === qFold ||
        foldDiacritics(h.titleSanskrit).includes(qFold)
    );
    if (hidasMatch) {
      return {
        databaseId: 'db7_cudl_hidas',
        record: hidasMatch,
        manuscriptWitnessesRecords: c7.manuscripts.filter((m) =>
          hidasMatch.crossRefs?.cudlMsIds?.includes(m.cudlId)
        ),
      };
    }

    return c7;
  }

  // DB #8: Oslo Bibliotheca Polyglotta
  if (resolvedDb === 'db8_polyglotta') {
    const c8 = corpus as Db8PolyglottaCorpus;
    const vidCidMatch = qLower.match(/^(?:vid=)?(\d+)(?:&cid=(\d+))?$/);
    if (vidCidMatch) {
      const targetVid = parseInt(vidCidMatch[1], 10);
      const targetCid = vidCidMatch[2] ? parseInt(vidCidMatch[2], 10) : undefined;

      if (targetCid !== undefined) {
        const vol = c8.volumes.find((v) => v.vid === targetVid && v.cid === targetCid);
        if (vol) {
          return {
            databaseId: 'db8_polyglotta',
            volume: vol,
            ...(targetVid === 263
              ? {
                  mahavyutpattiEsotericGlossary: c8.mahavyutpattiEsotericGlossary.filter((g) =>
                    g.sourceRef.includes(String(targetCid))
                  ),
                }
              : {}),
          };
        }
      }

      // If vid=263 without cid, return both §25 (335411) and §198 (338889) + glossary
      const matchingVols = c8.volumes.filter((v) => v.vid === targetVid);
      if (matchingVols.length > 0) {
        return {
          databaseId: 'db8_polyglotta',
          volume: matchingVols[0],
          volumes: matchingVols,
          ...(targetVid === 263 ? { mahavyutpattiEsotericGlossary: c8.mahavyutpattiEsotericGlossary } : {}),
        };
      }
    }

    const titleVol = c8.volumes.find(
      (v) =>
        foldDiacritics(v.titleSanskrit).includes(qFold) ||
        v.titleZh.includes(qRaw) ||
        foldDiacritics(v.titleEn).includes(qFold)
    );
    if (titleVol) {
      return { databaseId: 'db8_polyglotta', volume: titleVol };
    }

    return c8;
  }

  // DB #9: University of Vienna rKTs
  if (resolvedDb === 'db9_rkts') {
    const c9 = corpus as Db9RktsCorpus;
    const normNum = qUpperNum(qRaw);

    const zungduMatches = c9.dergeZungduCatalog.filter(
      (z) =>
        z.dergeRef.toLowerCase() === qLower ||
        z.rktsId.toLowerCase() === qLower ||
        z.dergeRef === `D${normNum}` ||
        z.rktsId === `K${normNum}` ||
        foldDiacritics(z.tibetanTitleWylie).includes(qFold) ||
        foldDiacritics(z.sanskritTitleStandard || '').includes(qFold)
    );

    const linkedRktsIds = new Set(zungduMatches.map((z) => z.rktsId));
    if (/^[ktgbe]?\d+$/i.test(qRaw)) {
      linkedRktsIds.add(qRaw.toUpperCase().startsWith('K') ? qRaw.toUpperCase() : `K${normNum}`);
    }

    const stdMatches = c9.standardConcordanceSample.filter(
      (s) =>
        s.rktsId.toLowerCase() === qLower ||
        linkedRktsIds.has(s.rktsId) ||
        foldDiacritics(s.sanskritIast).includes(qFold) ||
        foldDiacritics(s.tibetanWylie).includes(qFold)
    );

    const etextMatches = c9.zungduEtextEntries.filter(
      (e) =>
        e.dergeRef?.toLowerCase() === qLower ||
        e.volumeFile.toLowerCase().includes(qLower) ||
        e.folioLine.toLowerCase().includes(qLower) ||
        foldDiacritics(e.sanskritTitleIast).includes(qFold) ||
        e.rgyaGarSkadDuEwts.toLowerCase().includes(qLower)
    );

    return {
      databaseId: 'db9_rkts',
      summary: c9.summary,
      concordanceStats: c9.concordanceStats,
      standardConcordanceMatches: stdMatches.length > 0 ? stdMatches : c9.standardConcordanceSample.slice(0, 10),
      dergeZungduMatches: zungduMatches.length > 0 ? zungduMatches : c9.dergeZungduCatalog.slice(0, 10),
      zungduEtextMatches: etextMatches.length > 0 ? etextMatches : c9.zungduEtextEntries.slice(0, 10),
      tibetanCorpusCatalogSample: c9.tibetanCorpusCatalogSample.slice(0, 15),
    };
  }

  // DB #10: ALL-NIBS Dharani Preservation Project
  if (resolvedDb === 'db10_all_nibs') {
    const c10 = corpus as Db10AllNibsCorpus;
    const msMatch = c10.manuscripts.find(
      (m) =>
        m.resourceId.toLowerCase() === qLower ||
        m.catalogCode?.toLowerCase() === qLower ||
        foldDiacritics(m.titleIast).includes(qFold)
    );
    const newarMatches = c10.newarDharaniWitnesses.filter(
      (w) =>
        w.id.toLowerCase() === qLower ||
        foldDiacritics(w.titleNormalizedIast).includes(qFold) ||
        foldDiacritics(w.titleDiplomaticNewar).includes(qFold)
    );

    if (msMatch || newarMatches.length > 0) {
      return {
        databaseId: 'db10_all_nibs',
        apiStats: c10.apiStats,
        manuscript: msMatch,
        newarDharaniWitnesses: newarMatches.length > 0 ? newarMatches : c10.newarDharaniWitnesses.slice(0, 8),
      };
    }
    return c10;
  }

  // DB #11: IDP Berlin, Vienna CEToM & CBETA Dunhuang
  if (resolvedDb === 'db11_idp_dunhuang') {
    const c11 = corpus as Db11IdpDunhuangCorpus;
    const idpMatches = c11.idpRecords.filter(
      (r) =>
        r.id.toLowerCase() === qLower ||
        r.pressmark.toLowerCase().includes(qLower) ||
        r.catalogShortref.toLowerCase().includes(qLower) ||
        foldDiacritics(r.title).includes(qFold)
    );
    const cetomMatches = c11.cetomRecords.filter(
      (r) =>
        r.cetomId.toLowerCase() === qLower ||
        r.shelfmark.toLowerCase().includes(qLower) ||
        foldDiacritics(r.genreAndSubject).includes(qFold)
    );
    const cbetaMatches = c11.cbetaDunhuangRecords.filter(
      (r) => r.xmlId.toLowerCase() === qLower || r.title.includes(qRaw)
    );

    return {
      databaseId: 'db11_idp_dunhuang',
      corpusStats: c11.corpusStats,
      matchedIdpRecords: idpMatches,
      matchedCetomRecords: cetomMatches,
      matchedCbetaDunhuangRecords: cbetaMatches,
      idpRecords: idpMatches.length > 0 ? idpMatches : c11.idpRecords.slice(0, 8),
      cetomRecords: c11.cetomRecords,
      cbetaDunhuangRecords: c11.cbetaDunhuangRecords,
    };
  }

  // DB #12: Muktabodha, ERC DHARMA & Oxford OCHS
  if (resolvedDb === 'db12_muktabodha_ochs') {
    const c12 = corpus as Db12MuktabodhaOchsCorpus;
    const mbMatch = c12.muktabodhaTexts.find(
      (m) =>
        m.catalogNo.toLowerCase() === qLower ||
        foldDiacritics(m.uniformTitle).includes(qFold) ||
        foldDiacritics(m.mainTitle).includes(qFold)
    );
    const dharmaMatch = c12.dharmaEditions.find(
      (d) => d.id.toLowerCase() === qLower || foldDiacritics(d.titleSanskrit).includes(qFold)
    );
    const ochsMatch = c12.ochsLexiconManuscripts.find(
      (o) =>
        o.slug.toLowerCase().includes(qLower) ||
        String(o.ochsNumber) === qLower ||
        foldDiacritics(o.titleSanskrit).includes(qFold)
    );

    return {
      databaseId: 'db12_muktabodha_ochs',
      corpusStats: c12.corpusStats,
      matchedMuktabodha: mbMatch,
      matchedDharmaEdition: dharmaMatch,
      matchedOchsLexicon: ochsMatch,
      muktabodhaTexts: c12.muktabodhaTexts,
      dharmaEditions: c12.dharmaEditions,
      ochsLexiconManuscripts: c12.ochsLexiconManuscripts,
      bijaLexicon: c12.bijaLexicon,
    };
  }

  return corpus;
}

function qUpperNum(q: string): string {
  const m = q.match(/(\d+)/);
  return m ? m[1] : q;
}

/* ============================================================================
 * 4. Multi-Script & Diacritic-Insensitive Search (`searchTier23Databases`)
 * ========================================================================== */

function matchesQuery(haystack: string | undefined, qRaw: string, qFold: string): boolean {
  if (!haystack) return false;
  if (haystack.toLowerCase().includes(qRaw.toLowerCase())) return true;
  return foldDiacritics(haystack).includes(qFold);
}

export function searchTier23Databases(
  query: string,
  options?: { dbId?: Tier23DatabaseId | DatabaseId | number | string; limit?: number }
): UnifiedSearchHit[] {
  const qRaw = String(query || '').trim();
  if (!qRaw) return [];
  const qFold = foldDiacritics(qRaw);
  const targetDb = options?.dbId ? resolveTier23DatabaseId(options.dbId) : null;
  const limit = options?.limit ?? 50;
  const hits: UnifiedSearchHit[] = [];

  // Search DB #7: CUDL & Hidas
  if (!targetDb || targetDb === 'db7_cudl_hidas') {
    for (const ms of DB7_CUDL_HIDAS_CORPUS.manuscripts) {
      const combined = [
        ms.cudlId,
        ms.shelfLocator,
        ms.title,
        ms.dateDisplay,
        ms.abstractShort,
        ...ms.transcribedRubricsAndExcerpts,
        ...ms.sectionTitlesIast,
      ].join(' ');
      if (matchesQuery(combined, qRaw, qFold)) {
        hits.push({
          id: `db7_${ms.cudlId}`,
          sourceDb: 'db7_cudl_hidas',
          databaseNumber: 7,
          title: `${ms.shelfLocator} — ${ms.title}`,
          subtitle: ms.dateDisplay,
          matchedField: 'manuscript',
          snippet: [ms.abstractShort, ...ms.transcribedRubricsAndExcerpts].join(' | ').slice(0, 260),
          sanskritIast: ms.sectionTitlesIast.join(', '),
          canonicalRefs: [ms.cudlId, ...(ms.crossRefs?.cudlMsIds || [])],
          sourceUrl: ms.viewerUrl,
        });
      }
    }
    for (const h of DB7_CUDL_HIDAS_CORPUS.hidasCriticalEditions) {
      const combined = [h.id, h.titleSanskrit, h.editorCitation, h.tibetanParallelRef, h.extractedMantraIast].join(' ');
      if (matchesQuery(combined, qRaw, qFold)) {
        hits.push({
          id: `db7_${h.id}`,
          sourceDb: 'db7_cudl_hidas',
          databaseNumber: 7,
          title: `${h.titleSanskrit} (${h.id})`,
          subtitle: h.editorCitation,
          matchedField: 'hidasCriticalEdition',
          snippet: h.extractedMantraIast.slice(0, 260),
          sanskritIast: h.extractedMantraIast,
          canonicalRefs: [h.id, h.tibetanParallelRef, ...h.manuscriptWitnesses],
          sourceUrl: 'https://dharmamitra.org/api-db/text-view/text-parallels/',
        });
      }
    }
  }

  // Search DB #8: Oslo Bibliotheca Polyglotta
  if (!targetDb || targetDb === 'db8_polyglotta') {
    for (const vol of DB8_POLYGLOTTA_CORPUS.volumes) {
      const volHeader = `vid=${vol.vid}${vol.cid ? `&cid=${vol.cid}` : ''} ${vol.titleSanskrit} ${vol.titleZh} ${vol.titleEn} ${vol.witnesses.join(' ')}`;
      const matchedRow = vol.alignedRows.find((r) =>
        r.cells.some((c) => matchesQuery(c.text, qRaw, qFold) || matchesQuery(c.witnessLabel, qRaw, qFold))
      );
      if (matchesQuery(volHeader, qRaw, qFold) || matchedRow) {
        const rowCells = matchedRow || vol.alignedRows[0];
        const saCell = rowCells?.cells.find((c) => c.lang === 'Sanskrit');
        const zhCell = rowCells?.cells.find((c) => c.lang === 'Chinese');
        const boCell = rowCells?.cells.find((c) => c.lang === 'Tibetan');
        hits.push({
          id: `db8_vid_${vol.vid}${vol.cid ? `_${vol.cid}` : ''}`,
          sourceDb: 'db8_polyglotta',
          databaseNumber: 8,
          title: `${vol.titleSanskrit} (vid=${vol.vid}${vol.cid ? `&cid=${vol.cid}` : ''})`,
          subtitle: vol.titleZh,
          matchedField: matchedRow ? 'alignedRow' : 'volume',
          snippet: rowCells ? rowCells.cells.map((c) => `[${c.witnessLabel}] ${c.text}`).join(' | ').slice(0, 280) : vol.titleEn,
          sanskritIast: saCell?.text,
          chineseText: zhCell?.text,
          tibetanText: boCell?.text,
          canonicalRefs: [`vid=${vol.vid}`, ...(vol.cid ? [`cid=${vol.cid}`] : []), ...(vol.crossRefs?.taishoIds || [])],
          sourceUrl: vol.sourceUrl,
        });
      }
    }
    for (const g of DB8_POLYGLOTTA_CORPUS.mahavyutpattiEsotericGlossary) {
      const combined = [g.sanskritIast, g.tibetanWylie, g.chinese, g.english, g.definition, g.sourceRef].join(' ');
      if (matchesQuery(combined, qRaw, qFold)) {
        hits.push({
          id: `db8_${g.id}`,
          sourceDb: 'db8_polyglotta',
          databaseNumber: 8,
          title: `Mahāvyutpatti: ${g.sanskritIast}`,
          subtitle: g.sourceRef,
          matchedField: 'mahavyutpattiGlossary',
          snippet: `SA: ${g.sanskritIast} | BO: ${g.tibetanWylie || ''} | ZH: ${g.chinese || ''} | EN: ${g.english}`,
          sanskritIast: g.sanskritIast,
          chineseText: g.chinese,
          tibetanText: g.tibetanWylie,
          canonicalRefs: [g.sourceRef],
          sourceUrl: 'https://polyglotta.uio.no/index.php?page=fulltext&view=fulltext&vid=263&cid=338889',
        });
      }
    }
  }

  // Search DB #9: Vienna rKTs & Derge Zungdu
  if (!targetDb || targetDb === 'db9_rkts') {
    for (const e of DB9_RKTS_CORPUS.zungduEtextEntries) {
      const combined = [
        e.id,
        e.dergeRef,
        e.folioLine,
        e.rgyaGarSkadDuEwts,
        e.sanskritTitleIast,
        e.bodSkadDuEwts,
        e.extractedMantraEwts,
        e.extractedMantraIast,
      ].join(' ');
      if (matchesQuery(combined, qRaw, qFold)) {
        hits.push({
          id: `db9_${e.id}`,
          sourceDb: 'db9_rkts',
          databaseNumber: 9,
          title: `${e.dergeRef || e.volumeFile} (${e.folioLine}) — ${e.sanskritTitleIast}`,
          subtitle: `EWTS: ${e.rgyaGarSkadDuEwts}`,
          matchedField: 'zungduEtext',
          snippet: `EWTS: ${e.extractedMantraEwts} | IAST: ${e.extractedMantraIast}`.slice(0, 280),
          sanskritIast: e.extractedMantraIast,
          tibetanText: e.extractedMantraTibetan,
          canonicalRefs: [e.dergeRef || e.volumeFile, e.folioLine],
          sourceUrl: e.sourceUrl,
        });
      }
    }
    for (const z of DB9_RKTS_CORPUS.dergeZungduCatalog) {
      const combined = [z.dergeRef, z.rktsId, z.tibetanTitleWylie, z.sanskritTitleStandard].join(' ');
      if (matchesQuery(combined, qRaw, qFold)) {
        hits.push({
          id: `db9_cat_${z.dergeRef}`,
          sourceDb: 'db9_rkts',
          databaseNumber: 9,
          title: `${z.dergeRef} (${z.rktsId}) — ${z.sanskritTitleStandard || z.tibetanTitleWylie}`,
          subtitle: `Derge Zungdu (${z.section}) Vol. ${z.bdrcVolume}, ${z.folioLocation}`,
          matchedField: 'dergeZungduCatalog',
          snippet: `${z.dergeRef} ↔ ${z.rktsId}: ${z.tibetanTitleWylie} (${z.sanskritTitleStandard || ''})`,
          sanskritIast: z.sanskritTitleStandard,
          tibetanText: z.tibetanTitleWylie,
          canonicalRefs: [z.dergeRef, z.rktsId],
          sourceUrl: 'http://www.rkts.org/rkts1/data/collections/D/D.xml',
        });
      }
    }
  }

  // Search DB #10: ALL-NIBS
  if (!targetDb || targetDb === 'db10_all_nibs') {
    for (const ms of DB10_ALL_NIBS_CORPUS.manuscripts) {
      const combined = [
        ms.resourceId,
        ms.catalogCode,
        ms.titleIast,
        ms.sourceInstitution,
        ms.diplomaticFolioExcerpt,
        ms.normalizedIastExcerpt,
        ...ms.extractedMantras,
      ].join(' ');
      if (matchesQuery(combined, qRaw, qFold)) {
        hits.push({
          id: `db10_${ms.resourceId}`,
          sourceDb: 'db10_all_nibs',
          databaseNumber: 10,
          title: `${ms.resourceId}${ms.catalogCode ? ` (${ms.catalogCode})` : ''} — ${ms.titleIast}`,
          subtitle: ms.sourceInstitution,
          matchedField: 'manuscript',
          snippet: ms.diplomaticFolioExcerpt.slice(0, 280),
          sanskritIast: ms.normalizedIastExcerpt.slice(0, 240),
          canonicalRefs: [ms.resourceId, ...(ms.catalogCode ? [ms.catalogCode] : [])],
          sourceUrl: ms.apiUrl,
        });
      }
    }
    for (const nw of DB10_ALL_NIBS_CORPUS.newarDharaniWitnesses) {
      const combined = [
        nw.id,
        nw.titleDiplomaticNewar,
        nw.titleNormalizedIast,
        nw.diplomaticMantraNewar,
        nw.normalizedMantraIast,
      ].join(' ');
      if (matchesQuery(combined, qRaw, qFold)) {
        hits.push({
          id: `db10_${nw.id}`,
          sourceDb: 'db10_all_nibs',
          databaseNumber: 10,
          title: `${nw.titleNormalizedIast} (Newar Witness)`,
          subtitle: nw.titleDiplomaticNewar,
          matchedField: 'newarDharaniWitness',
          snippet: `Diplomatic: ${nw.diplomaticMantraNewar} | Normalized: ${nw.normalizedMantraIast}`.slice(0, 280),
          sanskritIast: nw.normalizedMantraIast,
          canonicalRefs: [nw.id, ...(nw.crossRefs?.dsbcIds || [])],
          sourceUrl: nw.sourceUrl,
        });
      }
    }
  }

  // Search DB #11: IDP Berlin, CEToM & CBETA Dunhuang
  if (!targetDb || targetDb === 'db11_idp_dunhuang') {
    for (const r of DB11_IDP_DUNHUANG_CORPUS.idpRecords) {
      const combined = [
        r.id,
        r.pressmark,
        r.catalogShortref,
        r.title,
        r.description,
        r.diplomaticTransliteration,
        r.normalizedMantraIast,
      ].join(' ');
      if (matchesQuery(combined, qRaw, qFold)) {
        hits.push({
          id: `db11_idp_${r.id}`,
          sourceDb: 'db11_idp_dunhuang',
          databaseNumber: 11,
          title: `${r.pressmark} (${r.catalogShortref}) — ${r.title}`,
          subtitle: `${r.collectionSite} · ${r.scriptAndLanguage}`,
          matchedField: 'idpRecord',
          snippet: `${r.diplomaticTransliteration || ''} ${r.description}`.trim().slice(0, 280),
          sanskritIast: r.normalizedMantraIast || r.diplomaticTransliteration,
          canonicalRefs: [r.pressmark, r.catalogShortref],
          sourceUrl: r.sourceXmlUrl,
        });
      }
    }
    for (const c of DB11_IDP_DUNHUANG_CORPUS.cetomRecords) {
      const linesText = c.diplomaticLines.map((l) => `${l.lineNum}: ${l.transliteration}`).join(' ');
      const combined = [c.cetomId, c.shelfmark, c.findspot, c.genreAndSubject, c.script, linesText].join(' ');
      if (matchesQuery(combined, qRaw, qFold)) {
        hits.push({
          id: `db11_cetom_${c.cetomId}`,
          sourceDb: 'db11_idp_dunhuang',
          databaseNumber: 11,
          title: `${c.shelfmark} (${c.cetomId})`,
          subtitle: `${c.findspot} · ${c.genreAndSubject}`,
          matchedField: 'cetomRecord',
          snippet: linesText.slice(0, 280),
          sanskritIast: linesText.slice(0, 240),
          canonicalRefs: [c.cetomId, c.shelfmark],
          sourceUrl: c.sourceUrl,
        });
      }
    }
    for (const cb of DB11_IDP_DUNHUANG_CORPUS.cbetaDunhuangRecords) {
      const combined = [cb.xmlId, cb.title, ...cb.manuscriptWitnesses, ...cb.dharaniExcerptsZh].join(' ');
      if (matchesQuery(combined, qRaw, qFold)) {
        hits.push({
          id: `db11_cbeta_${cb.xmlId}`,
          sourceDb: 'db11_idp_dunhuang',
          databaseNumber: 11,
          title: `${cb.xmlId} 《${cb.title}》`,
          subtitle: `${cb.collection} (${cb.manuscriptWitnesses.join(', ')})`,
          matchedField: 'cbetaDunhuangRecord',
          snippet: cb.dharaniExcerptsZh.join(' | ').slice(0, 280),
          chineseText: cb.dharaniExcerptsZh[0],
          canonicalRefs: [cb.xmlId, ...cb.manuscriptWitnesses],
          sourceUrl: cb.sourceUrl,
        });
      }
    }
  }

  // Search DB #12: Muktabodha, ERC DHARMA & Oxford OCHS
  if (!targetDb || targetDb === 'db12_muktabodha_ochs') {
    for (const m of DB12_MUKTABODHA_OCHS_CORPUS.muktabodhaTexts) {
      const combined = [
        m.catalogNo,
        m.uniformTitle,
        m.mainTitle,
        m.author,
        m.textExcerptIast,
        ...(m.extractedSeedDefinitions || []),
      ].join(' ');
      if (matchesQuery(combined, qRaw, qFold)) {
        hits.push({
          id: `db12_mb_${m.catalogNo}`,
          sourceDb: 'db12_muktabodha_ochs',
          databaseNumber: 12,
          title: `${m.catalogNo} — ${m.uniformTitle} (${m.mainTitle})`,
          subtitle: `Muktabodha (499 Tantric Works) · ${m.author || m.tradition}`,
          matchedField: 'muktabodhaText',
          snippet: `${m.uniformTitle} (${m.catalogNo}, 499 catalog works): ${m.textExcerptIast}`.slice(0, 280),
          sanskritIast: m.textExcerptIast.slice(0, 240),
          canonicalRefs: [m.catalogNo, m.uniformTitle],
          sourceUrl: m.rawTextUrl,
        });
      }
    }
    for (const d of DB12_MUKTABODHA_OCHS_CORPUS.dharmaEditions) {
      const combined = [d.id, d.titleSanskrit, d.editors, ...d.extractedMantrasIast, d.textExcerptIast].join(' ');
      if (matchesQuery(combined, qRaw, qFold)) {
        hits.push({
          id: `db12_dharma_${d.id}`,
          sourceDb: 'db12_muktabodha_ochs',
          databaseNumber: 12,
          title: `${d.titleSanskrit} (${d.id})`,
          subtitle: d.editors,
          matchedField: 'dharmaEdition',
          snippet: d.extractedMantrasIast.join(' | ').slice(0, 280),
          sanskritIast: d.extractedMantrasIast[0],
          canonicalRefs: [d.id, ...(d.crossRefs.taishoIds || []), ...(d.crossRefs.rktsIds || [])],
          sourceUrl: d.rawTextUrl,
        });
      }
    }
    for (const o of DB12_MUKTABODHA_OCHS_CORPUS.ochsLexiconManuscripts) {
      const matchingVerse = o.verses.find((v) => matchesQuery(v.sanskritIast, qRaw, qFold));
      if (matchesQuery(`${o.slug} ${o.titleSanskrit} ${o.ochsNumber}`, qRaw, qFold) || matchingVerse) {
        const v = matchingVerse || o.verses[0];
        hits.push({
          id: `db12_ochs_${o.slug}`,
          sourceDb: 'db12_muktabodha_ochs',
          databaseNumber: 12,
          title: `${o.titleSanskrit} (${o.slug})`,
          subtitle: `Oxford OCHS #${o.ochsNumber} (${o.totalVerses} verses)`,
          matchedField: 'ochsLexicon',
          snippet: v ? `Verse ${v.verseNumber}: ${v.sanskritIast}` : o.titleSanskrit,
          sanskritIast: v?.sanskritIast,
          canonicalRefs: [o.slug, `OCHS #${o.ochsNumber}`],
          sourceUrl: o.sourceUrl,
        });
      }
    }
    for (const b of DB12_MUKTABODHA_OCHS_CORPUS.bijaLexicon) {
      const combined = [
        b.bijaIast,
        b.bijaDevanagari,
        b.bijaSiddham,
        b.tangChinese,
        ...b.uddharaCodeNames,
        b.buddhistMeaning,
        b.tantricNighantuMeaning,
      ].join(' ');
      if (matchesQuery(combined, qRaw, qFold)) {
        hits.push({
          id: `db12_bija_${b.bijaSlp1}`,
          sourceDb: 'db12_muktabodha_ochs',
          databaseNumber: 12,
          title: `Bīja ${b.bijaIast} (${b.bijaDevanagari} / ${b.bijaSiddham} / ${b.tangChinese})`,
          subtitle: `Code-names: ${b.uddharaCodeNames.join(', ')}`,
          matchedField: 'bijaLexicon',
          snippet: `${b.buddhistMeaning} | ${b.tantricNighantuMeaning}`.slice(0, 280),
          sanskritIast: b.bijaIast,
          siddhamUnicode: b.bijaSiddham,
          chineseText: b.tangChinese,
          canonicalRefs: b.uddharaCodeNames,
          sourceUrl: 'https://ochs-database.netlify.app/manuscripts/ochs_000_000_030_bijanighantu/',
        });
      }
    }
  }

  return hits.slice(0, limit);
}

export function searchTier23Corpora(query: string, dbId?: Tier23DatabaseId | DatabaseId | number | string): UnifiedSearchHit[] {
  return searchTier23Databases(query, { dbId });
}

/* ============================================================================
 * 5. Bīja / Seed-Syllable Decipherment Lookup (`lookupTier23Bija`)
 * ========================================================================== */

const BIJA_ALIAS_MAP: Record<string, string> = {
  om: 'oṃ',
  aum: 'oṃ',
  'oṃ': 'oṃ',
  'ॐ': 'oṃ',
  'ओं': 'oṃ',
  ah: 'āḥ',
  aah: 'āḥ',
  'āḥ': 'āḥ',
  'आः': 'āḥ',
  hum: 'hūṃ',
  huum: 'hūṃ',
  'hūṃ': 'hūṃ',
  'हूं': 'hūṃ',
  hrih: 'hrīḥ',
  hreeh: 'hrīḥ',
  'hrīḥ': 'hrīḥ',
  'ह्रीः': 'hrīḥ',
  hrim: 'hrīṃ',
  hreem: 'hrīṃ',
  'hrīṃ': 'hrīṃ',
  'ह्रीं': 'hrīṃ',
  krim: 'krīṃ',
  kreem: 'krīṃ',
  'krīṃ': 'krīṃ',
  'क्रीं': 'krīṃ',
  aim: 'aiṃ',
  'aiṃ': 'aiṃ',
  'ऐं': 'aiṃ',
  klim: 'klīṃ',
  kleem: 'klīṃ',
  'klīṃ': 'klīṃ',
  'क्लीं': 'klīṃ',
  shrim: 'śrīṃ',
  srim: 'śrīṃ',
  shreem: 'śrīṃ',
  'śrīṃ': 'śrīṃ',
  'श्रीं': 'śrīṃ',
  strim: 'strīṃ',
  streem: 'strīṃ',
  'strīṃ': 'strīṃ',
  'स्त्रीं': 'strīṃ',
  bhrum: 'bhrūṃ',
  bhroom: 'bhrūṃ',
  'bhrūṃ': 'bhrūṃ',
  'भ्रूं': 'bhrūṃ',
  tram: 'trāṃ',
  traam: 'trāṃ',
  'trāṃ': 'trāṃ',
  'त्रां': 'trāṃ',
  phat: 'phaṭ',
  'phaṭ': 'phaṭ',
  'फट्': 'phaṭ',
  svaha: 'svāhā',
  swaha: 'svāhā',
  'svāhā': 'svāhā',
  'स्वाहा': 'svāhā',
};

function resolveSingleBijaToken(token: string): BijaLexiconEntry | undefined {
  const clean = token.trim();
  if (!clean) return undefined;
  const lower = clean.toLowerCase();
  const folded = foldDiacritics(clean);

  // Check Devanāgarī conversion if needed
  let devaIast = '';
  if (/[\u0900-\u097F]/.test(clean)) {
    devaIast = slp1ToIast(devanagariToSlp1(clean));
  }

  const targetIast = BIJA_ALIAS_MAP[lower] || BIJA_ALIAS_MAP[folded] || BIJA_ALIAS_MAP[devaIast] || lower;

  return DB12_MUKTABODHA_OCHS_CORPUS.bijaLexicon.find(
    (entry) =>
      entry.bijaIast.toLowerCase() === targetIast ||
      foldDiacritics(entry.bijaIast) === foldDiacritics(targetIast) ||
      entry.bijaDevanagari === clean ||
      entry.bijaSiddham === clean ||
      entry.tangChinese.includes(clean) ||
      entry.uddharaCodeNames.some((c) => foldDiacritics(c) === folded)
  );
}

export function lookupTier23Bija(query: string): {
  query: string;
  entries: BijaLexiconEntry[];
  matchedOchsVerses: Array<{ slug: string; verseNumber: number; sanskritIast: string }>;
} {
  const raw = String(query || '').trim();
  const tokens = raw.split(/[\s,|/]+/).filter(Boolean);
  const entries: BijaLexiconEntry[] = [];
  const seen = new Set<string>();

  for (const tok of tokens) {
    const matched = resolveSingleBijaToken(tok);
    if (matched && !seen.has(matched.bijaIast)) {
      seen.add(matched.bijaIast);
      entries.push(matched);
    }
  }

  if (entries.length === 0 && raw) {
    const fallback = resolveSingleBijaToken(raw);
    if (fallback) entries.push(fallback);
  }

  const matchedOchsVerses: Array<{ slug: string; verseNumber: number; sanskritIast: string }> = [];
  for (const ochs of DB12_MUKTABODHA_OCHS_CORPUS.ochsLexiconManuscripts) {
    for (const v of ochs.verses) {
      if (
        entries.some((e) => v.targetBijaSyllables.includes(e.bijaIast)) ||
        entries.some((e) => e.uddharaCodeNames.some((code) => foldDiacritics(v.sanskritIast).includes(foldDiacritics(code))))
      ) {
        matchedOchsVerses.push({
          slug: ochs.slug,
          verseNumber: v.verseNumber,
          sanskritIast: v.sanskritIast,
        });
      }
    }
  }

  return {
    query: raw,
    entries,
    matchedOchsVerses: matchedOchsVerses.slice(0, 15),
  };
}

/* ============================================================================
 * 6. Quadrilingual Glossary Getter (Oslo Polyglotta Mahāvyutpatti §25 & §198)
 * ========================================================================== */

export function getTier23PolyglottaGlossary(): TrilingualGlossaryEntry[] {
  return DB8_POLYGLOTTA_CORPUS.mahavyutpattiEsotericGlossary;
}
