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
      return hasOwnConcreteValue(verse, 'modernPhoneticZh')
        ? 'db-original'
        : 'derived-reference';
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
 * 1. If the database already contains a field (`'db-original'`), preserve it verbatim without overwriting.
 * 2. ONLY when the database lacks that field (`'derived-reference'`), compute the reference fallback.
 */
export function resolveEffectiveVerseFields(
  verse: DharaniVerse,
  showPhoneticIastBracket: boolean
): EffectiveVerseFields {
  const siddhamOrigin = resolveVerseFieldOrigin(verse, 'siddham');
  const siddhamText =
    siddhamOrigin === 'db-original' && verse.siddhamOriginal?.trim()
      ? verse.siddhamOriginal.trim()
      : iastToSiddham(verse.iast);

  const devanagariOrigin = resolveVerseFieldOrigin(verse, 'devanagari');
  const devanagariText =
    devanagariOrigin === 'db-original' && verse.devanagariOriginal?.trim()
      ? verse.devanagariOriginal.trim()
      : iastToDevanagari(verse.iast);

  const iastOrigin = resolveVerseFieldOrigin(verse, 'iast');
  const iastText = verse.iast;

  const modernPhoneticOrigin = resolveVerseFieldOrigin(verse, 'modernPhoneticZh');
  const classicalTranslitOrigin = resolveVerseFieldOrigin(verse, 'classicalTranslitZh');

  // Compute algorithmic phonetics ONLY when needed for a missing field
  const needAutoModern =
    modernPhoneticOrigin === 'derived-reference' || !verse.modernPhoneticZh?.trim();
  const needAutoClassical =
    classicalTranslitOrigin === 'derived-reference' ||
    !verse.classicalTranslitZh?.trim() ||
    verse.classicalTranslitZh.startsWith('【GRETIL');

  const autoPhonetics =
    needAutoModern || needAutoClassical
      ? generateVerseChinesePhonetics(verse.iast, showPhoneticIastBracket)
      : null;

  const modernPhoneticZh = !needAutoModern
    ? formatModernPhoneticWithIastOption(
        verse.modernPhoneticZh,
        verse.iast,
        showPhoneticIastBracket
      )
    : autoPhonetics!.modernPhoneticZh;

  const classicalTranslitZh = !needAutoClassical
    ? verse.classicalTranslitZh
    : autoPhonetics!.classicalTranslitZh;

  const ipaOrigin = resolveVerseFieldOrigin(verse, 'ipa');
  const ipaText = iastToIpa(verse.iast);
  const prosodyOrigin = resolveVerseFieldOrigin(verse, 'prosody');

  const meaningZhOrigin = resolveVerseFieldOrigin(verse, 'meaningZh');
  const meaningEnOrigin = resolveVerseFieldOrigin(verse, 'meaningEn');
  const fallbackMeaning =
    meaningZhOrigin === 'derived-reference' || meaningEnOrigin === 'derived-reference'
      ? resolveEffectiveVerseMeaning(verse)
      : null;

  const meaningZh =
    meaningZhOrigin === 'db-original' && verse.meaningZh?.trim()
      ? verse.meaningZh
      : fallbackMeaning!.meaningZh;

  const meaningEn =
    meaningEnOrigin === 'db-original' && verse.meaningEn?.trim()
      ? verse.meaningEn
      : fallbackMeaning!.meaningEn;

  return {
    siddhamText,
    siddhamOrigin:
      siddhamOrigin === 'db-original' && verse.siddhamOriginal?.trim()
        ? 'db-original'
        : 'derived-reference',
    devanagariText,
    devanagariOrigin:
      devanagariOrigin === 'db-original' && verse.devanagariOriginal?.trim()
        ? 'db-original'
        : 'derived-reference',
    iastText,
    iastOrigin,
    modernPhoneticZh,
    modernPhoneticOrigin: !needAutoModern ? 'db-original' : 'derived-reference',
    classicalTranslitZh,
    classicalTranslitOrigin: !needAutoClassical ? 'db-original' : 'derived-reference',
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
    let derived = 0;
    for (const v of entry.verses) {
      const o = resolveVerseFieldOrigin(v, field);
      if (o === 'db-original') orig++;
      else derived++;
    }
    const state: EntryFieldOriginState =
      orig > 0 && derived === 0
        ? 'db-original'
        : orig > 0 && derived > 0
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

export function getFieldProvenanceTooltip(
  field: VerseTrackableField,
  state: EntryFieldOriginState
): string {
  if (state === 'mixed') {
    return `${TRACKABLE_FIELD_LABELS_ZH[field]}：部分章句取自数据库原载内容，缺失部分由系统自动推导补全作为参考。`;
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
