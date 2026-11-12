import type { DharaniEntry } from '../types/kosaTypes';

const TAISHO_ID_RE = /T\d{2}n\d{4}[A-Za-z]?/g;

/**
 * An entry may stand in for a Taishō scripture's own page only when that scripture is
 * the entry's SOLE Taishō reference. Entries citing several scriptures are concordance
 * entries (same dhāraṇī across translations); showing one of them as "the" content of
 * a single scripture would misrepresent that scripture, so the scripture's own
 * CBETA-parsed blocks must be shown instead.
 */
export function isSoleScriptureEntry(e: Pick<DharaniEntry, 'taishoNo' | 'provenance'>, scriptureId: string): boolean {
  const ids = new Set<string>(e.taishoNo.match(TAISHO_ID_RE) || []);
  if (e.provenance.cbetaId && /^T\d{2}n\d{4}[A-Za-z]?$/.test(e.provenance.cbetaId)) ids.add(e.provenance.cbetaId);
  return ids.size === 1 && ids.has(scriptureId);
}
