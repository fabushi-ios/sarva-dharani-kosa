/**
 * src/core/sources/entrySources.ts
 *
 * Universal original-source resolver for EVERY entry across all 12 International Databases (DB1–DB12),
 * CBETA Full Canon (including pure sutras without dhāraṇīs), GRETIL/DSBC Sanskrit witnesses,
 * and curated entries. Guarantees every database entry exposes directly viewable original content.
 */
import type { DharaniEntry } from '../../types/kosaTypes';
import { CITATION_CHECK } from '../../data/kosa-generated/citationCheck';
import {
  cbetaOnlineUrl,
  cbetaXmlUrl,
  citedCanonIds,
  gretilMirrorUrl,
  type CitationCheckRecord,
} from './citationCheck';
import { COVERAGE_VARIANT } from './textAlignment';

export type EntrySourceKind =
  | 'cbeta'
  | 'canon-gz'
  | 'gretil'
  | 'dsbc'
  | 'tei-84000'
  | 'buddhanexus-json'
  | 'tei-sarit'
  | 'cudl-json'
  | 'hidas-edition'
  | 'polyglotta-parallel'
  | 'rkts-etext'
  | 'all-nibs'
  | 'idp-xml'
  | 'cetom-witness'
  | 'dharma-muktabodha'
  | 'ochs-lexicon'
  | 'bkkbooks-yaml'
  | 'witness-inline';

export interface EntrySourceRef {
  kind: EntrySourceKind;
  /** Canonical ID, manuscript pressmark, or file name */
  id: string;
  label: string;
  /** Badge naming the exact database/repository (never mislabeling non-GRETIL URLs) */
  sourceBadgeZh?: string;
  url: string;
  onlineUrl?: string;
  role: 'cited' | 'located' | 'database-original';
  exists: boolean;
  coverage?: number;
  /** Primary language hint for typography ('zh-Hant' | 'sa-Latn' | 'bo' | 'multi') */
  langHint?: 'zh-Hant' | 'sa-Latn' | 'bo' | 'multi';
}

export function toProxiedSourceUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  if (rawUrl.startsWith('/') || rawUrl.startsWith('data:')) return rawUrl;
  return `/source-proxy/?url=${encodeURIComponent(rawUrl)}`;
}

export function citationCheckFor(entry: DharaniEntry): CitationCheckRecord | undefined {
  return CITATION_CHECK[entry.id];
}

function classifyExternalRawUrl(
  rawUrl: string,
  entry: DharaniEntry
): Pick<EntrySourceRef, 'kind' | 'label' | 'sourceBadgeZh' | 'url' | 'onlineUrl' | 'langHint'> {
  const dbId = entry.provenance.databaseId || '';
  const lower = rawUrl.toLowerCase();

  if (lower.includes('dsbcproject.org') || dbId === 'db3_dsbc_gretil') {
    return {
      kind: 'dsbc',
      label: `尼泊尔 DSBC 梵文原典 (${entry.taishoNo || 'DSBC'})`,
      sourceBadgeZh: 'DB3 · 尼泊尔 DSBC 原典',
      url: rawUrl,
      onlineUrl: rawUrl,
      langHint: 'sa-Latn',
    };
  }
  if (lower.includes('84000/data-tei') || dbId === 'db4_84000') {
    return {
      kind: 'tei-84000',
      label: `84000 甘珠尔开放 TEI 原典 (${entry.taishoNo || 'Toh'})`,
      sourceBadgeZh: 'DB4 · 84000 TEI 原典',
      url: rawUrl,
      onlineUrl: entry.provenance.cbetaOnlineUrl || 'https://read.84000.co/',
      langHint: 'multi',
    };
  }
  if (lower.includes('buddhanexus') || lower.includes('dharmamitra') || dbId === 'db5_buddhanexus') {
    return {
      kind: 'buddhanexus-json',
      label: `BuddhaNexus 分词梵本全文 (${entry.provenance.gretilFile || entry.taishoNo})`,
      sourceBadgeZh: 'DB5 · BuddhaNexus 梵本',
      url: rawUrl,
      onlineUrl: 'https://buddhanexus.net/',
      langHint: 'sa-Latn',
    };
  }
  if (lower.includes('sarit-corpus') || lower.includes('/sarit/') || dbId === 'db6_sarit') {
    return {
      kind: 'tei-sarit',
      label: `SARIT 印度学 TEI-P5 校勘全文 (${entry.provenance.gretilFile || entry.titleSanskritIast})`,
      sourceBadgeZh: 'DB6 · SARIT 密续原典',
      url: rawUrl,
      onlineUrl: rawUrl,
      langHint: 'sa-Latn',
    };
  }
  if (lower.includes('cudl.lib.cam.ac.uk') || dbId === 'db7_cudl_hidas') {
    return {
      kind: 'cudl-json',
      label: `剑桥大学 CUDL 贝叶经馆藏原典 (${entry.taishoNo})`,
      sourceBadgeZh: 'DB7 · 剑桥 CUDL 贝叶经',
      url: rawUrl,
      onlineUrl: entry.provenance.cbetaOnlineUrl || rawUrl,
      langHint: 'sa-Latn',
    };
  }
  if (lower.includes('rkts.org') || dbId === 'db9_rkts') {
    return {
      kind: 'rkts-etext',
      label: `维也纳 rKTs 德格版甘珠尔电子原典 (${entry.taishoNo})`,
      sourceBadgeZh: 'DB9 · 维也纳 rKTs 原典',
      url: rawUrl,
      onlineUrl: rawUrl.replace(/^http:/i, 'https:'),
      langHint: 'bo',
    };
  }
  if (lower.includes('asianlegacylibrary.org') || dbId === 'db10_all_nibs') {
    return {
      kind: 'all-nibs',
      label: `ALL-NIBS 尼泊尔梵文写本原典 (${entry.taishoNo})`,
      sourceBadgeZh: 'DB10 · ALL-NIBS 写本库',
      url: rawUrl,
      onlineUrl: 'https://library.asianlegacylibrary.org/',
      langHint: 'sa-Latn',
    };
  }
  if (lower.includes('idp.bbaw.de') || entry.id.startsWith('db11-idp-')) {
    return {
      kind: 'idp-xml',
      label: `IDP 丝绸之路西域写卷原典 (${entry.taishoNo})`,
      sourceBadgeZh: 'DB11 · IDP 西域写卷',
      url: rawUrl,
      onlineUrl: entry.provenance.cbetaOnlineUrl,
      langHint: 'sa-Latn',
    };
  }
  if (lower.includes('tokushige-koyasan') || dbId === 'db12_muktabodha_ochs') {
    return {
      kind: 'dharma-muktabodha',
      label: `${entry.provenance.databaseBadgeZh || 'DB12 · 密续校勘本'} 原文全文`,
      sourceBadgeZh: entry.provenance.databaseBadgeZh || 'DB12 · DHARMA/Muktabodha',
      url: rawUrl,
      onlineUrl: rawUrl,
      langHint: 'sa-Latn',
    };
  }

  const fileLabel = entry.provenance.gretilFile || rawUrl.split('/').pop() || rawUrl;
  return {
    kind: 'gretil',
    label: `GRETIL 梵文原典 ${fileLabel}`.trim(),
    sourceBadgeZh: 'GRETIL 梵文贝叶经库',
    url: gretilMirrorUrl(rawUrl),
    onlineUrl: gretilPageUrl(rawUrl),
    langHint: 'sa-Latn',
  };
}

export function collectEntrySources(entry: DharaniEntry): EntrySourceRef[] {
  const check = citationCheckFor(entry);
  const out: EntrySourceRef[] = [];
  const add = (r: EntrySourceRef) => {
    if (!out.some((o) => o.kind === r.kind && o.id === r.id)) out.push(r);
  };
  const coverageOf = (id: string) => check?.cited.find((c) => c.id === id);

  // 1. Auto-located CBETA canonical witness (when higher match found outside explicit citation)
  if (check?.best && !check.best.cited && check.best.coverage >= COVERAGE_VARIANT) {
    add({
      kind: 'cbeta',
      id: check.best.id,
      label: `${check.best.title} (${check.best.id})`,
      sourceBadgeZh: 'CBETA 代码定位原典',
      url: cbetaXmlUrl(check.best.id),
      onlineUrl: cbetaOnlineUrl(check.best.id),
      role: 'located',
      exists: true,
      coverage: check.best.coverage,
      langHint: 'zh-Hant',
    });
  }

  // 2. Cited CBETA Canon IDs (handles T, X, J, F, ZW, etc.; separates bkkbooks YAML if cited on T84)
  const cited = citedCanonIds(entry);
  if (check?.best?.cited) {
    cited.sort((a, b) => (a === check.best!.id ? -1 : b === check.best!.id ? 1 : 0));
  }
  for (const id of cited) {
    const c = coverageOf(id);
    const customRaw =
      id === entry.provenance.cbetaId ? entry.provenance.cbetaRawXmlUrl : undefined;
    const isYamlUrl = Boolean(customRaw && /\.ya?ml$/i.test(customRaw));

    // Always add the standard CBETA XML/Canon full text first
    add({
      kind: 'cbeta',
      id,
      label:
        id === entry.provenance.cbetaId && entry.sutraSourceZh
          ? `${entry.sutraSourceZh}`
          : `CBETA 藏经原文 ${id}`,
      sourceBadgeZh: id.startsWith('F') ? 'DB1 · 房山石经原文' : `CBETA 藏经 (${id})`,
      url: !isYamlUrl && customRaw ? customRaw : cbetaXmlUrl(id),
      onlineUrl: cbetaOnlineUrl(id),
      role: 'cited',
      exists: c ? c.inCbeta : true,
      coverage: c?.coverage,
      langHint: 'zh-Hant',
    });

    if (isYamlUrl && customRaw) {
      add({
        kind: 'bkkbooks-yaml',
        id: `${id}-yaml`,
        label: `东密/台密悉昙章疏校本 (${id})`,
        sourceBadgeZh: 'DB2 · 悉昙部校本',
        url: customRaw,
        onlineUrl: cbetaOnlineUrl(id),
        role: 'database-original',
        exists: true,
        langHint: 'zh-Hant',
      });
    }
  }

  // 3. External / Database-specific URL in provenance.gretilRawUrl (properly classified per DB!)
  const g = entry.provenance.gretilRawUrl;
  if (g) {
    const classified = classifyExternalRawUrl(g, entry);
    add({
      kind: classified.kind,
      id: entry.provenance.gretilFile || g.split('/').pop() || entry.id,
      label: classified.label,
      sourceBadgeZh: classified.sourceBadgeZh,
      url: classified.url,
      onlineUrl: classified.onlineUrl,
      role: 'cited',
      exists: true,
      coverage:
        classified.kind === 'gretil' && check?.sanskrit?.best?.cited
          ? check.sanskrit.best.coverage
          : undefined,
      langHint: classified.langHint,
    });
  }

  // 4. Auto-located GRETIL Sanskrit witness
  const sb = check?.sanskrit?.best;
  if (sb && !sb.cited && sb.url && sb.coverage >= COVERAGE_VARIANT) {
    add({
      kind: 'gretil',
      id: sb.id,
      label: `GRETIL 梵文原典 ${sb.id}`,
      sourceBadgeZh: 'GRETIL 代码定位梵本',
      url: sb.url,
      onlineUrl: gretilPageUrl(sb.url),
      role: 'located',
      exists: true,
      coverage: sb.coverage,
      langHint: 'sa-Latn',
    });
  }

  // 5. Database-native full-record original views for databases without external raw URLs
  //    (DB7 Hidas Critical Editions, DB8 Oslo Polyglotta 4-lang parallel, DB11 CEToM Brāhmī, DB12 Oxford OCHS, etc.)
  const dbId = entry.provenance.databaseId;
  if (dbId === 'db7_cudl_hidas' && entry.id.startsWith('db7-hidas-')) {
    add({
      kind: 'hidas-edition',
      id: entry.id,
      label: `剑桥 Hidas 贝叶经校勘全文 (${entry.titleSanskritIast})`,
      sourceBadgeZh: 'DB7 · 剑桥 Hidas 校勘本',
      url: '/data/tier23/db7_cudl_hidas.json',
      onlineUrl: entry.provenance.cbetaOnlineUrl || 'https://cudl.lib.cam.ac.uk/',
      role: 'database-original',
      exists: true,
      langHint: 'sa-Latn',
    });
  } else if (dbId === 'db8_polyglotta' || entry.id.startsWith('db8-polyglotta-')) {
    add({
      kind: 'polyglotta-parallel',
      id: entry.id,
      label: `奥斯陆 Bibliotheca Polyglotta 四语平行原典全文`,
      sourceBadgeZh: 'DB8 · 奥斯陆多语对勘原文',
      url: '/data/tier23/db8_polyglotta.json',
      onlineUrl: entry.provenance.cbetaOnlineUrl || 'https://www2.hf.uio.no/polyglotta/',
      role: 'database-original',
      exists: true,
      langHint: 'multi',
    });
  } else if (dbId === 'db11_idp_dunhuang' && entry.id.startsWith('db11-cetom-')) {
    add({
      kind: 'cetom-witness',
      id: entry.id,
      label: `维也纳 CEToM 西域婆罗谜残卷逐行外交释读全文`,
      sourceBadgeZh: 'DB11 · CEToM 西域残卷原文',
      url: '/data/tier23/db11_idp_dunhuang.json',
      onlineUrl: entry.provenance.cbetaOnlineUrl || 'https://cetom.univie.ac.at/',
      role: 'database-original',
      exists: true,
      langHint: 'sa-Latn',
    });
  } else if (dbId === 'db12_muktabodha_ochs' && entry.id.startsWith('db12-ochs-')) {
    add({
      kind: 'ochs-lexicon',
      id: entry.id,
      label: `牛津大学 OCHS 种子字隐语辞书全本颂文`,
      sourceBadgeZh: 'DB12 · 牛津 OCHS 梵本全文',
      url: '/data/tier23/db12_muktabodha_ochs.json',
      onlineUrl: entry.provenance.cbetaOnlineUrl || 'https://ochs-database.netlify.app/',
      role: 'database-original',
      exists: true,
      langHint: 'sa-Latn',
    });
  }

  // 6. Guaranteed universal fallback so 100% of entries in EVERY database have readable original text
  if (out.length === 0 || out.every((s) => !s.exists)) {
    add({
      kind: 'witness-inline',
      id: `${entry.id}-witness`,
      label: `${entry.provenance.databaseBadgeZh || entry.taishoNo || '本库'} 库藏原典录文`,
      sourceBadgeZh: entry.provenance.databaseBadgeZh || '库藏原文录文',
      url: `inline://${entry.id}`,
      onlineUrl: entry.provenance.cbetaOnlineUrl,
      role: 'database-original',
      exists: true,
      langHint: 'multi',
    });
  }

  return out;
}

function gretilPageUrl(u: string): string {
  return u.replace(
    /^https:\/\/raw\.githubusercontent\.com\/INDOLOGY\/GRETIL-mirror\/[^/]+\/gretil\.sub\.uni-goettingen\.de\//,
    'https://gretil.sub.uni-goettingen.de/'
  );
}
