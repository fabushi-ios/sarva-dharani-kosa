import type { DharaniEntry, DharaniVerse } from '../types/kosaTypes';
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

import { buildWordGlossesFromIast } from '../core/sanskrit/phoneticMapper';

export { DHARANI_CATEGORIES };

function attachLazyWordsIfNeeded(v: DharaniVerse): DharaniVerse {
  const wordsDesc = Object.getOwnPropertyDescriptor(v, 'words');
  const classicalDesc = Object.getOwnPropertyDescriptor(v, 'classicalTranslitZh');
  const modernDesc = Object.getOwnPropertyDescriptor(v, 'modernPhoneticZh');

  const hasGetterWords = Boolean(wordsDesc && typeof wordsDesc.get === 'function');
  const explicitWords =
    !hasGetterWords && Array.isArray(v.words) && v.words.length > 0 ? v.words : null;
  const allAutoWords =
    explicitWords !== null && explicitWords.every((w) => w.origin === 'derived-reference');

  const computedFieldSources: DharaniVerse['fieldSources'] = {
    iast: v.fieldSources?.iast ?? 'db-original',
    siddham: v.fieldSources?.siddham ?? (v.siddhamOriginal ? 'db-original' : 'derived-reference'),
    devanagari:
      v.fieldSources?.devanagari ?? (v.devanagariOriginal ? 'db-original' : 'derived-reference'),
    classicalTranslitZh:
      v.fieldSources?.classicalTranslitZh ??
      (classicalDesc && 'value' in classicalDesc && classicalDesc.value
        ? 'db-original'
        : 'derived-reference'),
    modernPhoneticZh:
      v.fieldSources?.modernPhoneticZh ??
      (modernDesc && 'value' in modernDesc && modernDesc.value
        ? 'db-original'
        : 'derived-reference'),
    ipa: v.fieldSources?.ipa ?? 'derived-reference',
    prosody: v.fieldSources?.prosody ?? 'derived-reference',
    meaningZh: v.fieldSources?.meaningZh ?? 'db-original',
    meaningEn: v.fieldSources?.meaningEn ?? 'db-original',
    words:
      v.fieldSources?.words ??
      (explicitWords && !allAutoWords ? 'db-original' : 'derived-reference'),
  };

  if (hasGetterWords) {
    v.fieldSources = computedFieldSources;
    return v;
  }

  if (explicitWords) {
    return {
      ...v,
      fieldSources: computedFieldSources,
      words: explicitWords.map((w) => ({
        ...w,
        origin: w.origin ?? 'db-original',
      })),
    };
  }

  let cachedWords: DharaniVerse['words'] | null = null;
  const clone = { ...v, fieldSources: computedFieldSources };
  Object.defineProperty(clone, 'words', {
    enumerable: true,
    configurable: true,
    get() {
      if (!cachedWords) {
        cachedWords = buildWordGlossesFromIast(v.iast);
      }
      return cachedWords;
    },
  });
  return clone;
}

const RAW_BUILTIN_DHARANI_CORPUS: DharaniEntry[] = [
  ...MAJOR_DHARANIS,
  ...TEN_SMALL_DHARANIS,
  ...BUDDHAS_AND_PROTECTORS_DHARANIS,
  ...EXPANDED_FAMOUS_DHARANIS,
  ...WORLD_ENCYCLOPEDIA_DHARANIS,
  ...TWELVE_DATABASES_ADAPTED_DHARANIS,
  ...GRETIL_CANONICAL_DHARANIS,
];

export const BUILTIN_DHARANI_CORPUS: DharaniEntry[] = RAW_BUILTIN_DHARANI_CORPUS.map(
  (entry) => ({
    ...entry,
    verses: entry.verses.map(attachLazyWordsIfNeeded),
  })
);

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
