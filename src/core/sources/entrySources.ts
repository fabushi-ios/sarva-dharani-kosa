/**
 * src/core/sources/entrySources.ts
 *
 * Every original source an entry can be read in full: the canon numbers it cites (parsed by one
 * generic ID rule from all provenance fields), the real source auto-located by the build-time
 * citation check, and its GRETIL file. Works identically for curated, database and Taishō-explorer
 * entries — nothing is keyed by entry id except the generated check itself.
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

export interface EntrySourceRef {
  kind: 'cbeta' | 'gretil';
  /** CBETA id (T21n1286) or GRETIL file name. */
  id: string;
  label: string;
  url: string;
  onlineUrl?: string;
  /** cited = named by the entry; located = found by the code check; */
  role: 'cited' | 'located';
  /** false when CBETA has no such number (wrong citation). */
  exists: boolean;
  coverage?: number;
}

export function citationCheckFor(entry: DharaniEntry): CitationCheckRecord | undefined {
  return CITATION_CHECK[entry.id];
}

export function collectEntrySources(entry: DharaniEntry): EntrySourceRef[] {
  const check = citationCheckFor(entry);
  const out: EntrySourceRef[] = [];
  const add = (r: EntrySourceRef) => {
    if (!out.some((o) => o.kind === r.kind && o.id === r.id)) out.push(r);
  };
  const coverageOf = (id: string) => check?.cited.find((c) => c.id === id);

  // Only a real match (≥ variant threshold) is offered as a located source.
  if (check?.best && !check.best.cited && check.best.coverage >= COVERAGE_VARIANT) {
    add({
      kind: 'cbeta',
      id: check.best.id,
      label: check.best.title,
      url: cbetaXmlUrl(check.best.id),
      onlineUrl: cbetaOnlineUrl(check.best.id),
      role: 'located',
      exists: true,
      coverage: check.best.coverage,
    });
  }
  const cited = citedCanonIds(entry);
  // Best-matching cited text first.
  if (check?.best?.cited) cited.sort((a, b) => (a === check.best!.id ? -1 : b === check.best!.id ? 1 : 0));
  for (const id of cited) {
    const c = coverageOf(id);
    add({
      kind: 'cbeta',
      id,
      label: id === entry.provenance.cbetaId && entry.sutraSourceZh ? entry.sutraSourceZh : id,
      url: id === entry.provenance.cbetaId && entry.provenance.cbetaRawXmlUrl ? entry.provenance.cbetaRawXmlUrl : cbetaXmlUrl(id),
      onlineUrl: cbetaOnlineUrl(id),
      role: 'cited',
      exists: c ? c.inCbeta : true,
      coverage: c?.coverage,
    });
  }
  const g = entry.provenance.gretilRawUrl;
  if (g) {
    add({
      kind: 'gretil',
      id: entry.provenance.gretilFile || g.split('/').pop() || g,
      label: `GRETIL 梵文原典 ${entry.provenance.gretilFile || g.split('/').pop() || ''}`.trim(),
      url: gretilMirrorUrl(g),
      onlineUrl: gretilPageUrl(g),
      role: 'cited',
      exists: true,
      coverage: check?.sanskrit?.best?.cited ? check.sanskrit.best.coverage : undefined,
    });
  }
  const sb = check?.sanskrit?.best;
  if (sb && !sb.cited && sb.url && sb.coverage >= COVERAGE_VARIANT) {
    add({
      kind: 'gretil',
      id: sb.id,
      label: `GRETIL 梵文原典 ${sb.id}`,
      url: sb.url,
      onlineUrl: gretilPageUrl(sb.url),
      role: 'located',
      exists: true,
      coverage: sb.coverage,
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
