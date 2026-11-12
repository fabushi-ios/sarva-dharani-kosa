import { describe, it, expect } from 'vitest';
import { isSoleScriptureEntry } from '../../src/core/taishoEntryMatch';

const mk = (taishoNo: string, cbetaId?: string) => ({ taishoNo, provenance: { cbetaId } }) as never;

describe('Taishō page never shows a multi-scripture entry as one scripture', () => {
  it('accepts a sole-scripture entry', () => {
    expect(isSoleScriptureEntry(mk('T21n1286 / F28n1071', 'T21n1286'), 'T21n1286')).toBe(true);
  });
  it('rejects omnibus / concordance entries', () => {
    const omni = mk('T21n1245 / T21n1270 / T21n1287 / T21n1286 / T16n0665');
    expect(isSoleScriptureEntry(omni, 'T21n1286')).toBe(false);
  });
  it('rejects entries for other scriptures', () => {
    expect(isSoleScriptureEntry(mk('T21n1287'), 'T21n1286')).toBe(false);
  });
});
