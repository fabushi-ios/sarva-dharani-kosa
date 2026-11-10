import type { DharaniEntry } from '../types/kosaTypes';
import { DHARANI_CATEGORIES } from './categories';
import { MAJOR_DHARANIS } from './kosa-corpus/major-dharanis';
import { TEN_SMALL_DHARANIS } from './kosa-corpus/ten-small-dharanis';
import { BUDDHAS_AND_PROTECTORS_DHARANIS } from './kosa-corpus/buddhas-bodhisattvas';
import { EXPANDED_FAMOUS_DHARANIS } from './kosa-corpus/expanded-famous-dharanis';
import { WORLD_ENCYCLOPEDIA_DHARANIS } from './kosa-corpus/world-mantras-encyclopedia';
import { TWELVE_DATABASES_ADAPTED_DHARANIS } from './kosa-corpus/twelve-databases-adapter';
import { GRETIL_CANONICAL_DHARANIS } from './kosa-corpus/gretil-canon-adapter';
import { AUTHORITATIVE_CBETA_RECORDS } from './kosa-generated/cbetaAuthRecords';
import { ALL_GRETIL_MANTRA_RECORDS } from './kosa-generated/gretilAllMantras';
import {
  TAISHO_MIKKYO_FILE_INDEX,
  TOTAL_TAISHO_MIKKYO_DHARANI_BLOCKS,
} from './kosa-generated/taishoMikkyoIndex';

export { DHARANI_CATEGORIES };

export const BUILTIN_DHARANI_CORPUS: DharaniEntry[] = [
  ...MAJOR_DHARANIS,
  ...TEN_SMALL_DHARANIS,
  ...BUDDHAS_AND_PROTECTORS_DHARANIS,
  ...EXPANDED_FAMOUS_DHARANIS,
  ...WORLD_ENCYCLOPEDIA_DHARANIS,
  ...TWELVE_DATABASES_ADAPTED_DHARANIS,
  ...GRETIL_CANONICAL_DHARANIS,
];

export const CORPUS_AUTHORITATIVE_STATS = {
  totalCuratedAndCanonicalEntries: BUILTIN_DHARANI_CORPUS.length,
  cbetaDownloadedXmlCount: AUTHORITATIVE_CBETA_RECORDS.length,
  cbetaSiddhamInterlinearTokensCount: AUTHORITATIVE_CBETA_RECORDS.reduce(
    (sum, r) => sum + r.interlinearTokens.length,
    0
  ),
  gretilDownloadedManuscriptsCount: ALL_GRETIL_MANTRA_RECORDS.length,
  taishoMikkyoIndexedScripturesCount: TAISHO_MIKKYO_FILE_INDEX.length,
  taishoMikkyoTotalDharaniBlocks: TOTAL_TAISHO_MIKKYO_DHARANI_BLOCKS,
  cbetaSiddhamGaijiTotalMapped: 2240,
};
