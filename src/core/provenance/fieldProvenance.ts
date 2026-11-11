import type {
  DharaniEntry,
  DharaniVerse,
  FieldOrigin,
  VerseTrackableField,
  WordGloss,
} from '../../types/kosaTypes';
import {
  iastToDevanagari,
  iastToIpa,
  iastToSiddham,
} from '../sanskrit/transliterator';
import {
  buildWordGlossesFromIast,
  formatModernPhoneticWithIastOption,
  generateVerseChinesePhonetics,
} from '../sanskrit/phoneticMapper';
import {
  isProvenancePlaceholderMeaning,
  normalizeSanskritToken,
  resolveEffectiveVerseMeaning,
} from '../sanskrit/sanskritLexicon';

export type EntryFieldOriginState = 'db-original' | 'derived-reference' | 'mixed';

export const TRACKABLE_FIELD_LABELS_ZH: Record<VerseTrackableField, string> = {
  siddham: '悉昙梵字',
  devanagari: '天城梵文',
  iast: '梵文 IAST',
  modernPhoneticZh: '梵音拼读',
  classicalTranslitZh: '古汉语音译',
  ipa: '国际音标 IPA',
  prosody: '轻重音律跟读卡',
  meaningZh: '汉文意译',
  meaningEn: '英文意译',
  words: '逐词词根解析',
};

function hasOwnConcreteValue(obj: object, prop: string): boolean {
  const desc = Object.getOwnPropertyDescriptor(obj, prop);
  if (!desc || !('value' in desc)) return false;
  const val = desc.value;
  if (typeof val === 'string') return val.trim().length > 0;
  if (Array.isArray(val)) return val.length > 0;
  return Boolean(val);
}

/**
 * Determines whether a specific field on a `DharaniVerse` comes originally from the
 * underlying database (`'db-original'`) or was algorithmically processed/derived (`'derived-reference'`).
 */
export function resolveVerseFieldOrigin(
  verse: DharaniVerse,
  field: VerseTrackableField
): FieldOrigin {
  const explicit = verse.fieldSources?.[field];
  if (explicit) {
    // Guard against placeholder meaning strings even if mislabeled
    if (field === 'meaningZh' && isProvenancePlaceholderMeaning(verse.meaningZh)) {
      return 'derived-reference';
    }
    if (field === 'meaningEn' && isProvenancePlaceholderMeaning(verse.meaningEn)) {
      return 'derived-reference';
    }
    return explicit;
  }

  switch (field) {
    case 'siddham':
      return verse.siddhamOriginal && verse.siddhamOriginal.trim().length > 0
        ? 'db-original'
        : 'derived-reference';
    case 'devanagari':
      return verse.devanagariOriginal && verse.devanagariOriginal.trim().length > 0
        ? 'db-original'
        : 'derived-reference';
    case 'ipa':
    case 'prosody':
      return 'derived-reference';
    case 'iast':
      return verse.iast && verse.iast.trim().length > 0 ? 'db-original' : 'derived-reference';
    case 'modernPhoneticZh':
      // Modern Mandarin homophone guides are derived phonetic aids unless explicitly tagged 'db-original'
      return 'derived-reference';
    case 'classicalTranslitZh':
      return hasOwnConcreteValue(verse, 'classicalTranslitZh') &&
        !String(verse.classicalTranslitZh).startsWith('【GRETIL')
        ? 'db-original'
        : 'derived-reference';
    case 'meaningZh':
      return hasOwnConcreteValue(verse, 'meaningZh') &&
        !isProvenancePlaceholderMeaning(verse.meaningZh)
        ? 'db-original'
        : 'derived-reference';
    case 'meaningEn':
      return hasOwnConcreteValue(verse, 'meaningEn') &&
        !isProvenancePlaceholderMeaning(verse.meaningEn)
        ? 'db-original'
        : 'derived-reference';
    case 'words':
      return hasOwnConcreteValue(verse, 'words') ? 'db-original' : 'derived-reference';
  }
}

export interface EffectiveVerseFields {
  siddhamText: string;
  siddhamOrigin: FieldOrigin;
  devanagariText: string;
  devanagariOrigin: FieldOrigin;
  iastText: string;
  iastOrigin: FieldOrigin;
  modernPhoneticZh: string;
  modernPhoneticOrigin: FieldOrigin;
  classicalTranslitZh: string;
  classicalTranslitOrigin: FieldOrigin;
  ipaText: string;
  ipaOrigin: FieldOrigin;
  prosodyOrigin: FieldOrigin;
  meaningZh: string;
  meaningZhOrigin: FieldOrigin;
  meaningEn: string;
  meaningEnOrigin: FieldOrigin;
}

/**
 * Resolves all display strings and their exact provenance for a verse, enforcing:
 * 1. Concrete text present on the verse (`siddhamOriginal`, `devanagariOriginal`, `modernPhoneticZh`,
 *    `classicalTranslitZh`) is preserved verbatim without algorithmic overwrite.
 * 2. Provenance badges (`db-original` | `mixed` | `derived-reference`) strictly reflect philological
 *    source origin rather than whether a helper string was pre-filled.
 */
export function resolveEffectiveVerseFields(
  verse: DharaniVerse,
  showPhoneticIastBracket: boolean
): EffectiveVerseFields {
  const rawSiddhamOrigin = resolveVerseFieldOrigin(verse, 'siddham');
  const hasSiddhamOrig = Boolean(verse.siddhamOriginal?.trim());
  const siddhamText =
    (rawSiddhamOrigin === 'db-original' || rawSiddhamOrigin === 'mixed') && hasSiddhamOrig
      ? verse.siddhamOriginal!.trim()
      : iastToSiddham(verse.iast);
  const siddhamOrigin: FieldOrigin =
    rawSiddhamOrigin === 'db-original' && !hasSiddhamOrig ? 'derived-reference' : rawSiddhamOrigin;

  const rawDevanagariOrigin = resolveVerseFieldOrigin(verse, 'devanagari');
  const hasDevanagariOrig = Boolean(verse.devanagariOriginal?.trim());
  const devanagariText =
    (rawDevanagariOrigin === 'db-original' || rawDevanagariOrigin === 'mixed') && hasDevanagariOrig
      ? verse.devanagariOriginal!.trim()
      : iastToDevanagari(verse.iast);
  const devanagariOrigin: FieldOrigin =
    rawDevanagariOrigin === 'db-original' && !hasDevanagariOrig
      ? 'derived-reference'
      : rawDevanagariOrigin;

  const iastOrigin = resolveVerseFieldOrigin(verse, 'iast');
  const iastText = verse.iast;

  const rawModernOrigin = resolveVerseFieldOrigin(verse, 'modernPhoneticZh');
  const rawClassicalOrigin = resolveVerseFieldOrigin(verse, 'classicalTranslitZh');

  const hasConcreteModern =
    hasOwnConcreteValue(verse, 'modernPhoneticZh') && Boolean(verse.modernPhoneticZh?.trim());
  const hasConcreteClassical =
    hasOwnConcreteValue(verse, 'classicalTranslitZh') &&
    Boolean(verse.classicalTranslitZh?.trim()) &&
    !verse.classicalTranslitZh.startsWith('【GRETIL');

  // Compute algorithmic phonetics ONLY when concrete text is absent on the verse
  const needAutoModern = !hasConcreteModern;
  const needAutoClassical = !hasConcreteClassical;

  const autoPhonetics =
    needAutoModern || needAutoClassical
      ? generateVerseChinesePhonetics(verse.iast, showPhoneticIastBracket)
      : null;

  const modernPhoneticZh = hasConcreteModern
    ? formatModernPhoneticWithIastOption(
        verse.modernPhoneticZh,
        verse.iast,
        showPhoneticIastBracket
      )
    : autoPhonetics!.modernPhoneticZh;

  const classicalTranslitZh = hasConcreteClassical
    ? verse.classicalTranslitZh
    : autoPhonetics!.classicalTranslitZh;

  const modernPhoneticOrigin: FieldOrigin =
    rawModernOrigin === 'db-original' && !hasConcreteModern ? 'derived-reference' : rawModernOrigin;
  const classicalTranslitOrigin: FieldOrigin =
    rawClassicalOrigin === 'db-original' && !hasConcreteClassical
      ? 'derived-reference'
      : rawClassicalOrigin;

  const ipaOrigin = resolveVerseFieldOrigin(verse, 'ipa');
  const ipaText = iastToIpa(verse.iast);
  const prosodyOrigin = resolveVerseFieldOrigin(verse, 'prosody');

  const meaningZhOrigin = resolveVerseFieldOrigin(verse, 'meaningZh');
  const meaningEnOrigin = resolveVerseFieldOrigin(verse, 'meaningEn');
  const hasValidMeaningZh =
    Boolean(verse.meaningZh?.trim()) && !isProvenancePlaceholderMeaning(verse.meaningZh);
  const hasValidMeaningEn =
    Boolean(verse.meaningEn?.trim()) && !isProvenancePlaceholderMeaning(verse.meaningEn);

  const fallbackMeaning =
    (meaningZhOrigin !== 'db-original' && meaningZhOrigin !== 'mixed') ||
    !hasValidMeaningZh ||
    (meaningEnOrigin !== 'db-original' && meaningEnOrigin !== 'mixed') ||
    !hasValidMeaningEn
      ? resolveEffectiveVerseMeaning(verse)
      : null;

  const meaningZh =
    (meaningZhOrigin === 'db-original' || meaningZhOrigin === 'mixed') && hasValidMeaningZh
      ? verse.meaningZh
      : fallbackMeaning!.meaningZh;

  const meaningEn =
    (meaningEnOrigin === 'db-original' || meaningEnOrigin === 'mixed') && hasValidMeaningEn
      ? verse.meaningEn
      : fallbackMeaning!.meaningEn;

  return {
    siddhamText,
    siddhamOrigin,
    devanagariText,
    devanagariOrigin,
    iastText,
    iastOrigin,
    modernPhoneticZh,
    modernPhoneticOrigin,
    classicalTranslitZh,
    classicalTranslitOrigin,
    ipaText,
    ipaOrigin,
    prosodyOrigin,
    meaningZh,
    meaningZhOrigin,
    meaningEn,
    meaningEnOrigin,
  };
}

/**
 * Resolves per-word glosses for a verse while preserving every database-curated `WordGloss`
 * (`origin: 'db-original'`) and filling in missing tokens as `'derived-reference'`.
 */
export function resolveEffectiveWordGlosses(
  verse: DharaniVerse
): { words: WordGloss[]; sectionState: EntryFieldOriginState } {
  const wordsOrigin = resolveVerseFieldOrigin(verse, 'words');
  const fullAutoWords = buildWordGlossesFromIast(verse.iast);

  if (wordsOrigin === 'derived-reference' || !verse.words || verse.words.length === 0) {
    return {
      words: fullAutoWords.map((w) => ({ ...w, origin: 'derived-reference' })),
      sectionState: 'derived-reference',
    };
  }

  const taggedCurated: WordGloss[] = verse.words.map((cw) => ({
    ...cw,
    origin: cw.origin || 'db-original',
  }));

  if (taggedCurated.length >= fullAutoWords.length) {
    const hasDerived = taggedCurated.some((w) => w.origin === 'derived-reference');
    const hasOrig = taggedCurated.some((w) => w.origin === 'db-original');
    return {
      words: taggedCurated,
      sectionState: hasOrig && hasDerived ? 'mixed' : hasOrig ? 'db-original' : 'derived-reference',
    };
  }

  const curatedByNorm = new Map<string, WordGloss>();
  for (const cw of taggedCurated) {
    for (const sub of cw.iast.split(/\s+/)) {
      const nk = normalizeSanskritToken(sub);
      if (nk && !curatedByNorm.has(nk)) {
        curatedByNorm.set(nk, cw);
      }
    }
  }

  let origCount = 0;
  let derivedCount = 0;
  const merged: WordGloss[] = fullAutoWords.map((aw) => {
    const nk = normalizeSanskritToken(aw.iast);
    const curated = nk ? curatedByNorm.get(nk) : undefined;
    if (curated && !curated.meaningZh.includes('契入本尊三昧总持')) {
      const itemOrigin = curated.origin || 'db-original';
      if (itemOrigin === 'db-original') origCount++;
      else derivedCount++;
      return {
        ...aw,
        stem: curated.stem || aw.stem,
        grammar: curated.grammar || aw.grammar,
        transliterationZh: curated.transliterationZh || aw.transliterationZh,
        meaningZh: curated.meaningZh,
        meaningEn: curated.meaningEn || aw.meaningEn,
        origin: itemOrigin,
      };
    }
    derivedCount++;
    return { ...aw, origin: 'derived-reference' };
  });

  return {
    words: merged,
    sectionState:
      origCount > 0 && derivedCount > 0
        ? 'mixed'
        : origCount > 0
        ? 'db-original'
        : 'derived-reference',
  };
}

export interface EntryProvenanceSummary {
  byField: Record<VerseTrackableField, EntryFieldOriginState>;
  originalFields: VerseTrackableField[];
  mixedFields: VerseTrackableField[];
  derivedFields: VerseTrackableField[];
}

const ALL_TRACKABLE_FIELDS: VerseTrackableField[] = [
  'iast',
  'classicalTranslitZh',
  'modernPhoneticZh',
  'siddham',
  'devanagari',
  'meaningZh',
  'meaningEn',
  'words',
  'ipa',
  'prosody',
];

export function summarizeEntryFieldProvenance(entry: DharaniEntry): EntryProvenanceSummary {
  const byField = {} as Record<VerseTrackableField, EntryFieldOriginState>;
  const originalFields: VerseTrackableField[] = [];
  const mixedFields: VerseTrackableField[] = [];
  const derivedFields: VerseTrackableField[] = [];

  for (const field of ALL_TRACKABLE_FIELDS) {
    let orig = 0;
    let mixed = 0;
    let derived = 0;
    for (const v of entry.verses) {
      const o = resolveVerseFieldOrigin(v, field);
      if (o === 'db-original') orig++;
      else if (o === 'mixed') mixed++;
      else derived++;
    }
    const state: EntryFieldOriginState =
      orig > 0 && mixed === 0 && derived === 0
        ? 'db-original'
        : orig > 0 || mixed > 0
        ? 'mixed'
        : 'derived-reference';
    byField[field] = state;
    if (state === 'db-original') originalFields.push(field);
    else if (state === 'mixed') mixedFields.push(field);
    else derivedFields.push(field);
  }

  return {
    byField,
    originalFields,
    mixedFields,
    derivedFields,
  };
}

export interface ProvenanceTextSegment {
  text: string;
  origin: 'db-original' | 'derived-reference';
}

interface IastAksharaPiece {
  text: string;
  isAkshara: boolean;
  normExact: string;
  normSkel: string;
  vowelRelOffset: number; // index within normExact where the first vowel sits (-1 if consonant-only)
}

const IAST_WORD_SPLIT_RE = /(\s+|\|\||\|)|(-)|(['’.,;:!?()[\]/]+)/g;
const IAST_AKSHARA_RE =
  /(?:kh|gh|ch|jh|ṭh|ḍh|th|dh|ph|bh|[kgṅcjñṭḍṇtdnpbmyrlvśṣshḻ])*(?:ai|au|[aāiīuūṛṝḷḹeēoō])[ṃṁḥँ]?(?:(?:kh|gh|ch|jh|ṭh|ḍh|th|dh|ph|bh|[kgṅcjñṭḍṇtdnpbmyrlvśṣshḻ])+(?=$))?/gi;
const SIDDHAM_AKSHARA_RE =
  /[\u{11580}-\u{115AE}\u{115D8}-\u{115DB}]\u{115C0}?(?:\u{115BF}[\u{1158E}-\u{115AE}\u{115D8}-\u{115DB}]\u{115C0}?)*[\u{115AF}-\u{115BE}\u{115C0}\u{115DC}-\u{115DD}]*/gu;
const DEVANAGARI_AKSHARA_RE =
  /[\u0904-\u0939\u0958-\u0961]\u093C?(?:\u094D[\u0915-\u0939\u0958-\u095F]\u093C?)*[\u0900-\u0903\u093A-\u094F\u0951-\u0957\u0962-\u0963]*/gu;

function normalizeExactIast(s: string): string {
  return s
    .toLowerCase()
    .replace(/ṁ/g, 'ṃ')
    .replace(/ē/g, 'e')
    .replace(/ō/g, 'o')
    .replace(/[^a-zāīūṛṝḷḹeēoōṃḥṅñṭḍṇśṣḻ]/g, '');
}

function normalizeSkeletonIast(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ṁṃṅñṇ]/g, 'n')
    .replace(/[śṣ]/g, 's')
    .replace(/v/g, 'b')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
}

function findFirstVowelOffset(norm: string): number {
  const m = norm.match(/[aāiīuūṛṝḷḹeēoō]/);
  return m && typeof m.index === 'number' ? m.index : -1;
}

export function splitIastIntoAksharaPieces(iast: string): IastAksharaPiece[] {
  if (!iast) return [];
  const pieces: IastAksharaPiece[] = [];
  let cursor = 0;

  const pushWordChunk = (word: string) => {
    if (!word) return;
    let wLast = 0;
    for (const m of word.matchAll(IAST_AKSHARA_RE)) {
      const mIdx = m.index ?? 0;
      if (mIdx > wLast) {
        const stray = word.slice(wLast, mIdx);
        const ne = normalizeExactIast(stray);
        pieces.push({
          text: stray,
          isAkshara: ne.length > 0,
          normExact: ne,
          normSkel: normalizeSkeletonIast(stray),
          vowelRelOffset: findFirstVowelOffset(ne),
        });
      }
      if (m[0].length === 0) continue;
      const ne = normalizeExactIast(m[0]);
      pieces.push({
        text: m[0],
        isAkshara: ne.length > 0,
        normExact: ne,
        normSkel: normalizeSkeletonIast(m[0]),
        vowelRelOffset: findFirstVowelOffset(ne),
      });
      wLast = mIdx + m[0].length;
    }
    if (wLast < word.length) {
      const rem = word.slice(wLast);
      const ne = normalizeExactIast(rem);
      pieces.push({
        text: rem,
        isAkshara: ne.length > 0,
        normExact: ne,
        normSkel: normalizeSkeletonIast(rem),
        vowelRelOffset: findFirstVowelOffset(ne),
      });
    }
  };

  for (const dm of iast.matchAll(IAST_WORD_SPLIT_RE)) {
    const dIdx = dm.index ?? 0;
    if (dIdx > cursor) {
      pushWordChunk(iast.slice(cursor, dIdx));
    }
    pieces.push({
      text: dm[0],
      isAkshara: false,
      normExact: '',
      normSkel: '',
      vowelRelOffset: -1,
    });
    cursor = dIdx + dm[0].length;
  }
  if (cursor < iast.length) {
    pushWordChunk(iast.slice(cursor));
  }
  return pieces;
}

/**
 * Matches attested original IAST tokens/stems against the orthographic akṣaras of `iastText`.
 * - Single-akṣara tokens (e.g. Fangshan `<cb:tt>` `ma`, `ṇa`, `ndi`, `rvo`) match strictly on full
 *   akṣara boundaries so `ma` never falsely matches inside `dma` or `śma`.
 * - Multi-akṣara tokens/stems (e.g. `udakena`, `ruṇikāya`, `mahās`, `cārya`) match starting at an
 *   akṣara boundary and mark every akṣara whose vowel nucleus is covered.
 */
export function matchIastOriginalAksharaFlags(
  iastText: string,
  originalTokens: string[]
): {
  pieces: IastAksharaPiece[];
  aksharaIndices: number[];
  aksharaFlags: boolean[];
  matchedTokenIndices: number[];
} {
  const pieces = splitIastIntoAksharaPieces(iastText);
  const aksharaIndices: number[] = [];
  for (let i = 0; i < pieces.length; i++) {
    if (pieces[i].isAkshara) aksharaIndices.push(i);
  }
  const A = aksharaIndices.length;
  const aksharaFlags = new Array<boolean>(A).fill(false);
  const matchedTokenIndices: number[] = [];

  if (A === 0 || !originalTokens || originalTokens.length === 0) {
    return { pieces, aksharaIndices, aksharaFlags, matchedTokenIndices };
  }

  // Precompute character spans on concatenated exact & skeleton streams for multi-akṣara stem matching
  let exactStream = '';
  let skelStream = '';
  const exactSpans: Array<{ start: number; end: number; vowelPos: number }> = [];
  const skelSpans: Array<{ start: number; end: number; vowelPos: number }> = [];

  for (let a = 0; a < A; a++) {
    const p = pieces[aksharaIndices[a]];
    const eStart = exactStream.length;
    exactStream += p.normExact;
    exactSpans.push({
      start: eStart,
      end: exactStream.length,
      vowelPos: p.vowelRelOffset >= 0 ? eStart + p.vowelRelOffset : eStart,
    });

    const sStart = skelStream.length;
    skelStream += p.normSkel;
    const sv = findFirstVowelOffset(p.normSkel);
    skelSpans.push({
      start: sStart,
      end: skelStream.length,
      vowelPos: sv >= 0 ? sStart + sv : sStart,
    });
  }

  let seqCursor = 0;

  for (let tIdx = 0; tIdx < originalTokens.length; tIdx++) {
    const rawTok = originalTokens[tIdx]?.trim();
    if (!rawTok) continue;
    const tokAk = splitIastIntoAksharaPieces(rawTok).filter((p) => p.isAkshara);
    if (tokAk.length === 0) continue;

    let matchedAt = -1;
    let matchedEnd = -1;

    if (tokAk.length === 1) {
      const targetExact = tokAk[0].normExact;
      const targetSkel = tokAk[0].normSkel;
      // 1. Exact akṣara match from sequential cursor, then fallback from 0 (preferring unmatched)
      for (let pass = 0; pass < 2 && matchedAt < 0; pass++) {
        const startA = pass === 0 ? seqCursor : 0;
        const endA = pass === 0 ? A : seqCursor;
        for (let a = startA; a < endA; a++) {
          if (!aksharaFlags[a] && pieces[aksharaIndices[a]].normExact === targetExact) {
            matchedAt = a;
            matchedEnd = a + 1;
            break;
          }
        }
      }
      // 2. Phonetic skeleton match on full akṣara boundary (e.g. lā vs la, ksaṃ vs kṣaṃ)
      if (matchedAt < 0 && targetSkel.length > 0) {
        for (let pass = 0; pass < 2 && matchedAt < 0; pass++) {
          const startA = pass === 0 ? seqCursor : 0;
          const endA = pass === 0 ? A : seqCursor;
          for (let a = startA; a < endA; a++) {
            if (!aksharaFlags[a] && pieces[aksharaIndices[a]].normSkel === targetSkel) {
              matchedAt = a;
              matchedEnd = a + 1;
              break;
            }
          }
        }
      }
    } else {
      // Multi-akṣara token or diplomatic stem (e.g. ruṇikāya, mahās, udakena, viprasanno)
      const targetExact = tokAk.map((x) => x.normExact).join('');
      const targetSkel = tokAk.map((x) => x.normSkel).join('');

      const tryStreamMatch = (
        stream: string,
        spans: Array<{ start: number; end: number; vowelPos: number }>,
        needle: string,
        fromA: number,
        toA: number
      ): [number, number] | null => {
        if (!needle) return null;
        for (let a = fromA; a < toA; a++) {
          const sPos = spans[a].start;
          if (stream.startsWith(needle, sPos)) {
            const ePos = sPos + needle.length;
            let lastCovered = a - 1;
            for (let b = a; b < A; b++) {
              if (spans[b].vowelPos < ePos) {
                lastCovered = b;
              } else {
                break;
              }
            }
            if (lastCovered >= a) {
              return [a, lastCovered + 1];
            }
          }
        }
        return null;
      };

      const hit =
        tryStreamMatch(exactStream, exactSpans, targetExact, seqCursor, A) ||
        tryStreamMatch(exactStream, exactSpans, targetExact, 0, seqCursor) ||
        (targetSkel.length >= 3
          ? tryStreamMatch(skelStream, skelSpans, targetSkel, seqCursor, A) ||
            tryStreamMatch(skelStream, skelSpans, targetSkel, 0, seqCursor)
          : null);

      if (hit) {
        matchedAt = hit[0];
        matchedEnd = hit[1];
      }
    }

    if (matchedAt >= 0 && matchedEnd > matchedAt) {
      for (let a = matchedAt; a < matchedEnd; a++) {
        aksharaFlags[a] = true;
      }
      seqCursor = matchedEnd;
      matchedTokenIndices.push(tIdx);
    }
  }

  return { pieces, aksharaIndices, aksharaFlags, matchedTokenIndices };
}

/**
 * Extracts diplomatic Sanskrit words/stems preserved on a CEToM Brāhmī fragment line,
 * stripping line numbers (`[a1]`), lacuna markers (`///`, `..`, `–`), editorial restorations `(kā)`,
 * and non-verse parallel apparatus notes.
 */
export function extractDiplomaticSanskritCandidates(diplomaticText: string): string[] {
  if (!diplomaticText) return [];
  const mainPart = diplomaticText.split(/\[parallel_note\]/i)[0] || '';
  // Remove editorial conjectures in parentheses (...) and line labels [a1] / [transcription]
  const cleaned = mainPart
    .replace(/\[(?:[ab]\d+[a-z]*|transcription|\d+)\]/gi, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/\[|\]/g, '') // damaged but visible aksaras on the leaf like [ru] [ṇi] kā ya ARE preserved on manuscript
    .replace(/[¯•·*+|/–—―-]+/g, ' ')
    .replace(/\bblank\b/gi, ' ')
    .replace(/\bn\d+\b/gi, ' ');

  // Collapse single-aksara spaced diplomatic transliteration (e.g. "u da ke na" or "ru ṇi kā ya")
  // into both individual ≥4-char tokens and sliding 2..4-aksara phrases so spaced Brāhmī matches normalized words!
  const rawTokens = cleaned
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0 && /[a-zA-Zāīūṛṝḷḹēōṃṁḥṅñṭḍṇśṣ]/i.test(w));

  const candidates: string[] = [];
  for (let i = 0; i < rawTokens.length; i++) {
    if (normalizeExactIast(rawTokens[i]).length >= 4) {
      candidates.push(rawTokens[i]);
    }
    for (let win = 4; win >= 2; win--) {
      if (i + win <= rawTokens.length) {
        const joined = rawTokens.slice(i, i + win).join('');
        if (normalizeExactIast(joined).length >= 4) {
          candidates.push(joined);
        }
      }
    }
  }
  return candidates;
}

export function extractVerseOriginalIastTokens(verse: DharaniVerse): string[] {
  if (verse.originalIastTokens && verse.originalIastTokens.length > 0) {
    return verse.originalIastTokens;
  }
  if (verse.tangNoteZh) {
    const m = verse.tangNoteZh.match(/石经原刻悉昙对音：(.+?)(?:\s*｜\s*|$)/);
    if (m) {
      const parsed = [...m[1].matchAll(/\(([^=)]+)=/g)]
        .map((x) => x[1].trim())
        .filter(Boolean);
      if (parsed.length > 0) return parsed;
    }
  }
  if (verse.diplomaticOriginal) {
    return extractDiplomaticSanskritCandidates(verse.diplomaticOriginal);
  }
  return [];
}

function mergeAdjacentSegments(segments: ProvenanceTextSegment[]): ProvenanceTextSegment[] {
  const merged: ProvenanceTextSegment[] = [];
  for (const seg of segments) {
    if (!seg.text) continue;
    const prev = merged[merged.length - 1];
    if (prev && prev.origin === seg.origin) {
      prev.text += seg.text;
    } else {
      merged.push({ text: seg.text, origin: seg.origin });
    }
  }
  return merged;
}

function computePieceOrigins(
  pieces: IastAksharaPiece[],
  aksharaIndices: number[],
  aksharaFlags: boolean[]
): Array<'db-original' | 'derived-reference'> {
  const pieceOrigins = new Array<'db-original' | 'derived-reference'>(pieces.length).fill(
    'derived-reference'
  );
  for (let a = 0; a < aksharaIndices.length; a++) {
    pieceOrigins[aksharaIndices[a]] = aksharaFlags[a] ? 'db-original' : 'derived-reference';
  }
  // Separator pieces (spaces/hyphens) between two db-original akṣaras stay db-original so multi-word
  // original spans render as a single continuous vermilion highlight without visual fragmentation.
  for (let i = 0; i < pieces.length; i++) {
    if (pieces[i].isAkshara) continue;
    let prevAk: 'db-original' | 'derived-reference' | null = null;
    for (let l = i - 1; l >= 0; l--) {
      if (pieces[l].isAkshara) {
        prevAk = pieceOrigins[l];
        break;
      }
    }
    let nextAk: 'db-original' | 'derived-reference' | null = null;
    for (let r = i + 1; r < pieces.length; r++) {
      if (pieces[r].isAkshara) {
        nextAk = pieceOrigins[r];
        break;
      }
    }
    if (prevAk === 'db-original' && nextAk === 'db-original') {
      pieceOrigins[i] = 'db-original';
    }
  }
  return pieceOrigins;
}

function sliceScriptByAksharaFlags(
  scriptText: string,
  aksharaRegex: RegExp,
  aksharaFlags: boolean[]
): ProvenanceTextSegment[] | null {
  const matches = [...scriptText.matchAll(aksharaRegex)];
  if (matches.length !== aksharaFlags.length || matches.length === 0) {
    return null;
  }
  const rawSegs: ProvenanceTextSegment[] = [];
  let cursor = 0;
  for (let a = 0; a < matches.length; a++) {
    const m = matches[a];
    const start = m.index ?? 0;
    const end = start + m[0].length;
    if (start > cursor) {
      const betweenOrigin: 'db-original' | 'derived-reference' =
        a > 0 && aksharaFlags[a - 1] && aksharaFlags[a] ? 'db-original' : 'derived-reference';
      rawSegs.push({ text: scriptText.slice(cursor, start), origin: betweenOrigin });
    }
    rawSegs.push({
      text: m[0],
      origin: aksharaFlags[a] ? 'db-original' : 'derived-reference',
    });
    cursor = end;
  }
  if (cursor < scriptText.length) {
    rawSegs.push({
      text: scriptText.slice(cursor),
      origin: aksharaFlags[aksharaFlags.length - 1] ? 'db-original' : 'derived-reference',
    });
  }
  return mergeAdjacentSegments(rawSegs);
}

/**
 * Splits a standalone mixed IAST string (such as Fangshan Studio's full `reconstructedIast`)
 * into `'db-original'` vs `'derived-reference'` segments matching its `<cb:tt>` tokens.
 */
export function resolveMixedIastStringSegments(
  iastText: string,
  originalTokens: string[]
): ProvenanceTextSegment[] {
  if (!iastText) return [];
  const { pieces, aksharaIndices, aksharaFlags } = matchIastOriginalAksharaFlags(
    iastText,
    originalTokens
  );
  if (aksharaIndices.length === 0 || !aksharaFlags.some(Boolean)) {
    return [{ text: iastText, origin: 'derived-reference' }];
  }
  const pieceOrigins = computePieceOrigins(pieces, aksharaIndices, aksharaFlags);
  return mergeAdjacentSegments(
    pieces.map((p, idx) => ({ text: p.text, origin: pieceOrigins[idx] }))
  );
}

export type MixedSegmentableField =
  | 'siddham'
  | 'devanagari'
  | 'iast'
  | 'modernPhoneticZh'
  | 'classicalTranslitZh'
  | 'meaningZh'
  | 'meaningEn';

/**
 * Resolves exact `'db-original'` vs `'derived-reference'` text segments for any field of a verse.
 * - Pure `'db-original'` verses return a single `'db-original'` segment.
 * - Pure `'derived-reference'` verses return a single `'derived-reference'` segment.
 * - `'mixed'` verses split at exact orthographic akṣara boundaries so `原载` syllables and `参考`
 *   syllables render in distinct colors matching the dual-color `ProvenanceBadge`, with zero broken
 *   Siddhaṃ/Devanāgarī OpenType ligatures.
 */
export function resolveVerseMixedSegments(
  verse: DharaniVerse,
  field: MixedSegmentableField,
  showPhoneticIastBracket = false
): ProvenanceTextSegment[] {
  const eff = resolveEffectiveVerseFields(verse, showPhoneticIastBracket);

  const fieldMap: Record<MixedSegmentableField, { text: string; origin: FieldOrigin }> = {
    siddham: { text: eff.siddhamText, origin: eff.siddhamOrigin },
    devanagari: { text: eff.devanagariText, origin: eff.devanagariOrigin },
    iast: { text: eff.iastText, origin: eff.iastOrigin },
    modernPhoneticZh: { text: eff.modernPhoneticZh, origin: eff.modernPhoneticOrigin },
    classicalTranslitZh: { text: eff.classicalTranslitZh, origin: eff.classicalTranslitOrigin },
    meaningZh: { text: eff.meaningZh, origin: eff.meaningZhOrigin },
    meaningEn: { text: eff.meaningEn, origin: eff.meaningEnOrigin },
  };

  const { text, origin } = fieldMap[field];
  if (!text) return [];
  if (origin === 'db-original') {
    return [{ text, origin: 'db-original' }];
  }
  if (origin === 'derived-reference') {
    return [{ text, origin: 'derived-reference' }];
  }

  // origin === 'mixed'
  const origTokens = extractVerseOriginalIastTokens(verse);
  const { pieces, aksharaIndices, aksharaFlags } = matchIastOriginalAksharaFlags(
    eff.iastText,
    origTokens
  );

  if (aksharaIndices.length === 0 || !aksharaFlags.some(Boolean)) {
    return [{ text, origin: 'derived-reference' }];
  }

  if (field === 'iast') {
    const pieceOrigins = computePieceOrigins(pieces, aksharaIndices, aksharaFlags);
    return mergeAdjacentSegments(
      pieces.map((p, idx) => ({ text: p.text, origin: pieceOrigins[idx] }))
    );
  }

  if (field === 'siddham') {
    const directSliced = sliceScriptByAksharaFlags(text, SIDDHAM_AKSHARA_RE, aksharaFlags);
    if (directSliced) return directSliced;

    const pieceOrigins = computePieceOrigins(pieces, aksharaIndices, aksharaFlags);
    return mergeAdjacentSegments(
      pieces.map((p, idx) => ({
        text: p.isAkshara
          ? iastToSiddham(p.text)
          : p.text === '||'
          ? '𑗃'
          : p.text === '|'
          ? '𑗂'
          : p.text,
        origin: pieceOrigins[idx],
      }))
    );
  }

  if (field === 'devanagari') {
    const directSliced = sliceScriptByAksharaFlags(text, DEVANAGARI_AKSHARA_RE, aksharaFlags);
    if (directSliced) return directSliced;

    const pieceOrigins = computePieceOrigins(pieces, aksharaIndices, aksharaFlags);
    return mergeAdjacentSegments(
      pieces.map((p, idx) => ({
        text: p.isAkshara
          ? iastToDevanagari(p.text)
          : p.text === '||'
          ? '॥'
          : p.text === '|'
          ? '।'
          : p.text,
        origin: pieceOrigins[idx],
      }))
    );
  }

  return [{ text, origin: 'derived-reference' }];
}

/**
 * Maps prosodic syllables and Brahmi orthographic subwords to `'db-original'` vs `'derived-reference'`
 * for karaoke playback highlighting in `VerseBlock` when a verse has `'mixed'` provenance.
 */
export function resolveVersePlaybackTokenOrigins(
  verse: DharaniVerse,
  subwordsIast: string[],
  syllablesIast: string[]
): {
  subwordOrigins: Array<'db-original' | 'derived-reference'>;
  syllableOrigins: Array<'db-original' | 'derived-reference'>;
} {
  const origTokens = extractVerseOriginalIastTokens(verse);
  const { pieces, aksharaIndices, aksharaFlags } = matchIastOriginalAksharaFlags(
    verse.iast,
    origTokens
  );

  if (aksharaIndices.length === 0 || !aksharaFlags.some(Boolean)) {
    return {
      subwordOrigins: subwordsIast.map(() => 'derived-reference'),
      syllableOrigins: syllablesIast.map(() => 'derived-reference'),
    };
  }

  // Build normalized character flag array over exact IAST letters
  const charFlags: boolean[] = [];
  for (let a = 0; a < aksharaIndices.length; a++) {
    const len = pieces[aksharaIndices[a]].normExact.length;
    for (let c = 0; c < len; c++) {
      charFlags.push(aksharaFlags[a]);
    }
  }

  const mapChunks = (chunks: string[]): Array<'db-original' | 'derived-reference'> => {
    let pos = 0;
    return chunks.map((chunk) => {
      const ne = normalizeExactIast(chunk);
      const start = pos;
      const end = Math.min(charFlags.length, pos + ne.length);
      pos = end;
      let hasOrig = false;
      for (let i = start; i < end; i++) {
        if (charFlags[i]) {
          hasOrig = true;
          break;
        }
      }
      return hasOrig ? 'db-original' : 'derived-reference';
    });
  };

  return {
    subwordOrigins: mapChunks(subwordsIast),
    syllableOrigins: mapChunks(syllablesIast),
  };
}

export function getFieldProvenanceTooltip(
  field: VerseTrackableField,
  state: EntryFieldOriginState
): string {
  if (state === 'mixed') {
    switch (field) {
      case 'siddham':
        return '【原载+参考】朱砂红字为原典石刻/写本原载悉昙梵字（如 CBETA <cb:tt> #SD-* 字元），青金蓝字为未标梵字处系统转写补全参考。';
      case 'iast':
        return '【原载+参考】朱砂红字为原典对音或残叶实存梵文音节，青金蓝字为系统依对音规则与平行梵本重构补全参考。';
      case 'devanagari':
        return '【原载+参考】朱砂红字为原数据库收录天城体原文，青金蓝字为系统转写补全参考。';
      default:
        return `【原载+参考】${TRACKABLE_FIELD_LABELS_ZH[field]}：朱砂红字取自数据库原载内容，青金蓝字由系统自动推导补全作为参考。`;
    }
  }
  if (state === 'db-original') {
    switch (field) {
      case 'modernPhoneticZh':
        return '【库藏原文】本条梵音拼读为数据库固有内容，系统完整保留原载拼读，未做算法覆盖。';
      case 'classicalTranslitZh':
        return '【库藏原文】本条古汉语音译直接取自大藏经、房山石经或平行对勘数据库原典原文。';
      case 'iast':
        return '【库藏原文】本条梵文 IAST 直接取自梵文贝叶经、校勘本或字库原载文本。';
      case 'siddham':
        return '【库藏原文】本条悉昙梵字直接取自原数据库收录之悉昙字元（如 CBETA #SD-*）。';
      case 'devanagari':
        return '【库藏原文】本条天城梵文直接取自原数据库收录之天城体文本。';
      case 'meaningZh':
        return '【库藏原文】本条汉文释义取自数据库原载译文或校勘释义。';
      case 'meaningEn':
        return '【库藏原文】本条英文释义取自数据库原载权威英译（如 84000 / Polyglotta 校勘译文）。';
      case 'words':
        return '【库藏原文】本条逐词解析取自数据库原载词条释义。';
      default:
        return `【库藏原文】${TRACKABLE_FIELD_LABELS_ZH[field]}为数据库原有内容。`;
    }
  }

  // derived-reference
  switch (field) {
    case 'modernPhoneticZh':
      return '【处理参考】原数据库未载梵音拼读，此项由系统据梵文经声明学规则自动拼读生成，仅供参考。';
    case 'classicalTranslitZh':
      return '【处理参考】原数据库无汉译音译文，此项由系统按唐宋译经对音规则自动拟音生成，仅供参考。';
    case 'iast':
      return '【处理参考】原数据库仅存汉译/藏译音写，此梵文 IAST 由系统根据对音规则重构还原，仅供参考。';
    case 'siddham':
      return '【转写参考】原数据库未直接附带悉昙字形，此项由系统据梵文 IAST 自动转写生成，仅供参考。';
    case 'devanagari':
      return '【转写参考】原数据库未直接附带天城体字形，此项由系统据梵文 IAST 自动转写生成，仅供参考。';
    case 'ipa':
      return '【处理参考】国际音标由系统按古典梵语语音学规则自动标音生成，仅供参考。';
    case 'prosody':
      return '【处理参考】逐音节轻重拍与三体跟读卡由系统按摩多律（Guru/Laghu）自动切分推导，仅供参考。';
    case 'meaningZh':
      return '【拟译参考】原数据库未载汉文译文，此项由系统调用《翻译名义大集》等 4.1 万词梵汉辞典自动拟译，仅供参考。';
    case 'meaningEn':
      return '【拟译参考】原数据库未载英文译文，此项由系统调用梵英学术辞典自动拟译，仅供参考 (Derived Lexicon Reference)。';
    case 'words':
      return '【处理参考】原数据库未载逐词表，此词根与语法格位由系统自动分词检索梵汉辞典生成，仅供参考。';
  }
}

