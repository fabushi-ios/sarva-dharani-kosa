/**
 * src/core/sanskrit/prosody.ts
 *
 * Sanskrit Śikṣā & Chandas (Prosody / Meter) Analysis Engine
 * Segments Sanskrit IAST verses into Akṣaras / phonological syllables,
 * determines Guru (— Heavy, 2 Mātrā) vs Laghu (⌣ Light, 1 Mātrā) prosodic weight,
 * preserves word/compound/danda structural metadata for Sandhi & phonetic coarticulation,
 * detects phonetic articulation features, and computes acoustic formant targets.
 */

import { cleanEditorialIast, iastToDevanagari, iastToIpa, iastToSiddham } from './transliterator';

export type ProsodicWeight = 'guru' | 'laghu';

export interface PhoneticFeatureBadge {
  code: 'retroflex' | 'aspirated' | 'breathy' | 'conjunct' | 'anusvara' | 'visarga' | 'long-vowel';
  labelZh: string;
  tipZh: string;
}

export interface SyllableAnalysis {
  index: number;
  iast: string;
  devanagari: string;
  siddham: string;
  ipa: string;
  vowel: string;
  weight: ProsodicWeight;
  matraCount: 1 | 2;
  weightReasonZh: string;
  features: PhoneticFeatureBadge[];
  formantHz: { f1: number; f2: number };
  // Phonological structure & word-boundary metadata for context-aware Sandhi
  onset?: string[];
  modifiers?: string[];
  coda?: string[];
  wordIndex?: number;
  subwordIndex?: number;
  wordIast?: string;
  isWordStart?: boolean;
  isWordEnd?: boolean;
  hyphenBefore?: boolean;
  dandaBefore?: '|' | '||';
  dandaAfter?: '|' | '||';
}

const LONG_VOWELS = new Set(['ā', 'ī', 'ū', 'ṝ', 'ḹ', 'e', 'ai', 'o', 'au']);

const VOWEL_FORMANTS: Record<string, { f1: number; f2: number }> = {
  a: { f1: 680, f2: 1250 },
  ā: { f1: 750, f2: 1180 },
  i: { f1: 320, f2: 2150 },
  ī: { f1: 280, f2: 2300 },
  u: { f1: 350, f2: 880 },
  ū: { f1: 300, f2: 800 },
  ṛ: { f1: 460, f2: 1450 },
  ṝ: { f1: 460, f2: 1450 },
  ḷ: { f1: 420, f2: 1500 },
  ḹ: { f1: 420, f2: 1500 },
  e: { f1: 430, f2: 1950 },
  ai: { f1: 580, f2: 1750 },
  o: { f1: 450, f2: 920 },
  au: { f1: 600, f2: 1020 },
};

const VOWEL_LIST = ['ai', 'au', 'ṝ', 'ḹ', 'ā', 'ī', 'ū', 'ṛ', 'ḷ', 'e', 'o', 'a', 'i', 'u'];
const CONSONANT_LIST = [
  'kh',
  'gh',
  'ch',
  'jh',
  'ṭh',
  'ḍh',
  'th',
  'dh',
  'ph',
  'bh',
  'k',
  'g',
  'ṅ',
  'c',
  'j',
  'ñ',
  'ṭ',
  'ḍ',
  'ṇ',
  't',
  'd',
  'n',
  'p',
  'b',
  'm',
  'y',
  'r',
  'l',
  'v',
  'ś',
  'ṣ',
  's',
  'h',
];

/**
 * Rising-sonority 2-consonant Sanskrit Akṣara onset clusters (kept together intervocalically,
 * while triggering Pāṇini 1.4.11 `saṃyoge guru` positional heaviness on preceding short vowels).
 *
 * Includes:
 * - Inseparable ligatures: kṣ, jñ
 * - Stop / Aspirate / Sibilant + r (excluding rr)
 * - Stop / Aspirate / Sibilant + l (excluding rl, ll)
 * - Stop / Nasal / Sibilant / Aspirate / Glide + y (excluding ry, yy — `r+y` splits as Vr-yV)
 * - Stop / Nasal / Sibilant / Aspirate + v (excluding rv, vv — `r+v` splits as Vr-vV)
 */
const RISING_SONORITY_ONSET_PAIRS = new Set([
  // Inseparable ligatures
  'kṣ', 'jñ',
  // + r
  'kr', 'khr', 'gr', 'ghr', 'jr', 'ṭr', 'ṭhr', 'ḍr', 'ḍhr',
  'tr', 'thr', 'dr', 'dhr', 'pr', 'phr', 'br', 'bhr',
  'vr', 'śr', 'sr', 'hr',
  // + l
  'kl', 'khl', 'gl', 'pl', 'phl', 'bl', 'bhl', 'śl', 'hl',
  // + y (note: 'ry' and 'yy' intentionally excluded so ār-ya, vai-ḍūr-ya split cleanly)
  'ky', 'khy', 'gy', 'ghy', 'cy', 'chy', 'jy', 'jhy',
  'ṭy', 'ṭhy', 'ḍy', 'ḍhy', 'ṇy',
  'ty', 'thy', 'dy', 'dhy', 'ny',
  'py', 'phy', 'by', 'bhy', 'my',
  'ly', 'vy', 'śy', 'ṣy', 'sy', 'hy',
  // + v (note: 'rv' and 'vv' intentionally excluded so sar-va splits cleanly)
  'kv', 'khv', 'gv', 'ghv', 'jv',
  'ṭv', 'ḍv', 'tv', 'thv', 'dv', 'dhv', 'nv',
  'bhv', 'śv', 'ṣv', 'sv', 'hv',
  // Sibilant / Aspirate + Nasal (rising sonority: fricative < nasal < vowel; keeps ṣṇī, śmi, sma intact)
  'śm', 'śn', 'ṣṇ', 'ṣm', 'sm', 'sn', 'hm', 'hn',
]);

/**
 * Rising-sonority 3-consonant Sanskrit Akṣara onset clusters
 */
const RISING_SONORITY_ONSET_TRIPLES = new Set([
  'kṣṇ', 'kṣm', 'kṣv', 'kṣy', 'jñy',
  'str', 'sthy', 'sthr', 'sphr', 'sphy',
  'ṣṭr', 'ṣṭhr', 'ṣṭy', 'ṣṭhy',
  'try', 'dry', 'dhry', 'kry', 'gry', 'pry', 'bhry', 'śry',
]);

interface PhonemeToken {
  type: 'C' | 'V' | 'M'; // Consonant, Vowel, Modifier (ṃ/ḥ)
  val: string;
}

export function tokenizeWordPhonemes(word: string): PhonemeToken[] {
  const s = word.toLowerCase().trim();
  const tokens: PhonemeToken[] = [];
  let i = 0;

  while (i < s.length) {
    const rest = s.slice(i);
    if (rest.startsWith('m\u0310') || rest.startsWith('ṃ\u0310') || rest.startsWith('ṁ\u0310')) {
      tokens.push({ type: 'M', val: 'm\u0310' });
      i += 2;
      continue;
    }
    if (rest[0] === '\u0310' || rest[0] === 'ँ') {
      tokens.push({ type: 'M', val: 'm\u0310' });
      i += 1;
      continue;
    }
    if (rest[0] === 'ṃ' || rest[0] === 'ṁ' || rest[0] === 'ḥ') {
      tokens.push({ type: 'M', val: rest[0] === 'ṁ' ? 'ṃ' : rest[0] });
      i += 1;
      continue;
    }

    let vMatch: string | null = null;
    for (const v of VOWEL_LIST) {
      if (rest.startsWith(v)) {
        vMatch = v;
        break;
      }
    }
    if (vMatch) {
      tokens.push({ type: 'V', val: vMatch });
      i += vMatch.length;
      continue;
    }

    let cMatch: string | null = null;
    for (const c of CONSONANT_LIST) {
      if (rest.startsWith(c)) {
        cMatch = c;
        break;
      }
    }
    if (cMatch) {
      tokens.push({ type: 'C', val: cMatch });
      i += cMatch.length;
      continue;
    }

    i += 1;
  }

  return tokens;
}

export interface RawSyllable {
  onset: string[];
  vowel: string;
  modifiers: string[];
  coda: string[];
  wordIndex: number;
  subwordIndex: number;
  wordIast: string;
  isWordStart: boolean;
  isWordEnd: boolean;
  hyphenBefore: boolean;
  dandaBefore?: '|' | '||';
  dandaAfter?: '|' | '||';
}

function syllabifySingleSubword(
  subword: string,
  wordIndex: number,
  subwordIndex: number,
  wordIast: string,
  hyphenBefore: boolean
): RawSyllable[] {
  const tokens = tokenizeWordPhonemes(subword);
  if (tokens.length === 0) return [];

  const syllables: RawSyllable[] = [];
  let i = 0;

  while (i < tokens.length) {
    const cluster: string[] = [];
    while (i < tokens.length && tokens[i].type === 'C') {
      cluster.push(tokens[i].val);
      i++;
    }

    if (i < tokens.length && tokens[i].type === 'V') {
      const vowel = tokens[i].val;
      i++;
      const modifiers: string[] = [];
      while (i < tokens.length && tokens[i].type === 'M') {
        modifiers.push(tokens[i].val);
        i++;
      }

      let onset = cluster;
      if (syllables.length > 0 && cluster.length >= 2) {
        const prevSyl = syllables[syllables.length - 1];
        if (prevSyl.modifiers.length === 0) {
          const lastThree = cluster.length >= 3 ? cluster.slice(-3).join('') : '';
          const lastTwo = cluster.slice(-2).join('');

          if (cluster.length >= 3 && RISING_SONORITY_ONSET_TRIPLES.has(lastThree)) {
            // Note: intervocalic 'str' / 'ṣṭr' splits sibilant to coda (śās-tra, rāṣ-ṭra)
            // whereas after nasal (man-tra, daṃ-ṣṭrā) or kṣm/kṣṇ keeps valid onset
            if ((lastThree === 'str' || lastThree === 'ṣṭr') && cluster.length === 3) {
              prevSyl.coda.push(cluster[0]);
              onset = cluster.slice(1);
            } else {
              prevSyl.coda.push(...cluster.slice(0, -3));
              onset = cluster.slice(-3);
            }
          } else if (RISING_SONORITY_ONSET_PAIRS.has(lastTwo)) {
            // Note: in 'samyak' ('sam-' prefix + 'yak'), keep 'sam-yak' if followed by coda/sibilant,
            // or split 'm+y' only when 'sam-' prefix is detected at start of subword ('samyak...')
            if (
              cluster.length === 2 &&
              lastTwo === 'my' &&
              syllables.length === 1 &&
              subword.startsWith('samyak')
            ) {
              prevSyl.coda.push(cluster[0]);
              onset = [cluster[1]];
            } else {
              prevSyl.coda.push(...cluster.slice(0, -2));
              onset = cluster.slice(-2);
            }
          } else {
            prevSyl.coda.push(...cluster.slice(0, -1));
            onset = cluster.slice(-1);
          }
        }
      }

      syllables.push({
        onset,
        vowel,
        modifiers,
        coda: [],
        wordIndex,
        subwordIndex,
        wordIast,
        isWordStart: false,
        isWordEnd: false,
        hyphenBefore: syllables.length === 0 && hyphenBefore,
      });
    } else if (cluster.length > 0) {
      // Word-final consonant(s) (e.g. "nam", "phaṭ", "buddhānām", "samyak", "sattvāṃś")
      if (syllables.length > 0) {
        syllables[syllables.length - 1].coda.push(...cluster);
      } else {
        syllables.push({
          onset: cluster,
          vowel: 'a',
          modifiers: [],
          coda: [],
          wordIndex,
          subwordIndex,
          wordIast,
          isWordStart: false,
          isWordEnd: false,
          hyphenBefore,
        });
      }
    } else {
      i++;
    }
  }

  return syllables;
}

/**
 * Segment a Sanskrit IAST verse into syllables (Akṣaras) respecting word, compound,
 * and danda boundaries, and compute Śikṣā prosodic weights.
 */
export function analyzeSanskritProsody(rawIast: string): SyllableAnalysis[] {
  const cleaned = cleanEditorialIast(rawIast);
  const spaceTokens = cleaned.split(/\s+/).filter(Boolean);

  const rawSyllables: RawSyllable[] = [];
  let wordCounter = 0;
  let subwordCounter = 0;
  let pendingDandaBefore: '|' | '||' | undefined;

  for (const rawTok of spaceTokens) {
    const trimmed = rawTok.trim();
    if (!trimmed) continue;

    // Pure danda / punctuation token
    if (/^(?:\|\||\/\/|॥)$/.test(trimmed)) {
      if (rawSyllables.length > 0) {
        rawSyllables[rawSyllables.length - 1].dandaAfter = '||';
      } else {
        pendingDandaBefore = '||';
      }
      continue;
    }
    if (/^(?:\||\/|।|—|–)$/.test(trimmed)) {
      if (rawSyllables.length > 0) {
        if (!rawSyllables[rawSyllables.length - 1].dandaAfter) {
          rawSyllables[rawSyllables.length - 1].dandaAfter = '|';
        }
      } else {
        pendingDandaBefore = '|';
      }
      continue;
    }

    // Check leading or trailing danda attached to word token
    let tokCore = trimmed;
    let attachedBefore: '|' | '||' | undefined = pendingDandaBefore;
    let attachedAfter: '|' | '||' | undefined;

    if (/^(?:\|\||\/\/|॥)/.test(tokCore)) {
      attachedBefore = '||';
      tokCore = tokCore.replace(/^(?:\|\||\/\/|॥)+/, '');
    } else if (/^(?:\||\/|।)/.test(tokCore)) {
      attachedBefore = '|';
      tokCore = tokCore.replace(/^(?:\||\/|।)+/, '');
    }

    if (/(?:\|\||\/\/|॥)$/.test(tokCore)) {
      attachedAfter = '||';
      tokCore = tokCore.replace(/(?:\|\||\/\/|॥)+$/, '');
    } else if (/(?:\||\/|।)$/.test(tokCore)) {
      attachedAfter = '|';
      tokCore = tokCore.replace(/(?:\||\/|।)+$/, '');
    }

    // Strip editorial digits/brackets/punctuation; strip word-internal avagraha so attached sandhi
    // like `śiro'rtiṃ` or `so'ham` syllabifies naturally (`śi-ror-tiṃ`, `so-ham`), while keeping `-` as subword hyphen.
    const cleanWordDisplay = tokCore
      .replace(/[,;!?()[\]\d]+/g, '')
      .replace(/^['’]+/, '')
      .replace(/(['’])/g, '')
      .trim();
    if (!cleanWordDisplay) {
      if (attachedAfter && rawSyllables.length > 0) {
        rawSyllables[rawSyllables.length - 1].dandaAfter = attachedAfter;
      }
      continue;
    }

    pendingDandaBefore = undefined;
    const subParts = cleanWordDisplay
      .toLowerCase()
      .split(/[-—–]+/)
      .filter(Boolean);

    if (subParts.length === 0) continue;

    const currentWordIdx = wordCounter++;
    const wordStartSylIdx = rawSyllables.length;
    const hadExplicitHyphen = /[-—–]/.test(cleanWordDisplay);

    for (let sIdx = 0; sIdx < subParts.length; sIdx++) {
      let sub = subParts[sIdx];
      // Vowelless external yaṇ-sandhi clitic after elided vowel (e.g. `'py` from `api`, `'tv` from `tu`)
      if (!/[aāiīuūṛṝḷḹeo]/.test(sub)) {
        if (sub.endsWith('y') && sub.length > 1) {
          sub = sub.slice(0, -1) + 'i';
        } else if (sub.endsWith('v') && sub.length > 1) {
          sub = sub.slice(0, -1) + 'u';
        }
      }
      const subSyls = syllabifySingleSubword(
        sub,
        currentWordIdx,
        subwordCounter++,
        cleanWordDisplay.toLowerCase(),
        sIdx > 0 && hadExplicitHyphen
      );
      rawSyllables.push(...subSyls);
    }

    if (rawSyllables.length > wordStartSylIdx) {
      rawSyllables[wordStartSylIdx].isWordStart = true;
      rawSyllables[rawSyllables.length - 1].isWordEnd = true;
      if (attachedBefore) {
        rawSyllables[wordStartSylIdx].dandaBefore = attachedBefore;
      }
      if (attachedAfter) {
        rawSyllables[rawSyllables.length - 1].dandaAfter = attachedAfter;
      }
    }
  }

  return rawSyllables.map((syl, idx) => {
    const nextSyl = rawSyllables[idx + 1];
    // Positional Guru (saṃyogapūrva) applies within words and across continuous sandhi (unless separated by danda pause)
    const acrossPause = Boolean(syl.dandaAfter || nextSyl?.dandaBefore);
    const nextOnsetCount = !acrossPause && nextSyl ? nextSyl.onset.length : 0;

    const iastSyl =
      syl.onset.join('') + syl.vowel + syl.modifiers.join('') + syl.coda.join('');

    // Pass next consonant context for Anusvāra IPA assimilation when in continuous flow
    const nextConsHint =
      !acrossPause && nextSyl && nextSyl.onset.length > 0 ? nextSyl.onset[0] : '';
    const ipaRaw =
      (syl.modifiers.includes('ṃ') || syl.modifiers.includes('m\u0310')) && nextConsHint
        ? iastToIpa(`${iastSyl}${nextConsHint}`).slice(
            0,
            Math.max(1, iastToIpa(`${iastSyl}${nextConsHint}`).length - iastToIpa(nextConsHint).length)
          )
        : iastToIpa(iastSyl);

    const isLongVowel = LONG_VOWELS.has(syl.vowel);
    const hasModifier = syl.modifiers.length > 0;
    const hasCoda = syl.coda.length > 0;
    const beforeConjunct = nextOnsetCount >= 2;

    let weight: ProsodicWeight = 'laghu';
    let weightReasonZh = '短元音开音节 · 轻音 (Laghu, 1拍)';

    if (isLongVowel) {
      weight = 'guru';
      weightReasonZh = `含自然长元音 "${syl.vowel}" · 重音 (Dīrgha Guru, 2拍)`;
    } else if (hasModifier) {
      weight = 'guru';
      weightReasonZh = `含随韵/止韵 (${syl.modifiers.join('')}) · 重音 (Guru, 2拍)`;
    } else if (hasCoda) {
      weight = 'guru';
      weightReasonZh = `闭音节收尾 (-${syl.coda.join('')}) · 重音 (Guru, 2拍)`;
    } else if (beforeConjunct) {
      weight = 'guru';
      weightReasonZh = `后接双辅音丛 (${nextSyl!.onset.join('')}-) · 位置重音 (Saṃyogapūrva Guru, 2拍)`;
    }

    const features: PhoneticFeatureBadge[] = [];
    const allConsonants = [...syl.onset, ...syl.coda];

    if (
      allConsonants.some((c) => ['ṭ', 'ṭh', 'ḍ', 'ḍh', 'ṇ', 'ṣ'].includes(c)) ||
      syl.vowel === 'ṛ' ||
      syl.vowel === 'ṝ'
    ) {
      features.push({
        code: 'retroflex',
        labelZh: '卷舌顶音',
        tipZh: '舌尖向上卷起抵住硬腭顶部（Mūrdhanya），切勿发成普通平舌齿音',
      });
    }
    if (allConsonants.some((c) => ['kh', 'ch', 'ṭh', 'th', 'ph'].includes(c))) {
      features.push({
        code: 'aspirated',
        labelZh: '清送气音',
        tipZh: '强送气清塞音（Mahāprāṇa），h 表强烈气流而非独立擦音',
      });
    }
    if (allConsonants.some((c) => ['gh', 'jh', 'ḍh', 'dh', 'bh'].includes(c))) {
      features.push({
        code: 'breathy',
        labelZh: '浊送气音',
        tipZh: '声带振动同时送出深沉气息（Ghoṣavat Mahāprāṇa），如 bha/dha/gha',
      });
    }
    if (syl.onset.length >= 2) {
      features.push({
        code: 'conjunct',
        labelZh: '二合/多合音',
        tipZh: `唐代注「二合」(${syl.onset.join('+')})：前辅音无元音过渡，紧接后辅音急速连读`,
      });
    }
    if (syl.modifiers.includes('ṃ')) {
      features.push({
        code: 'anusvara',
        labelZh: '随韵空点 (ṃ)',
        tipZh: '鼻腔共鸣收尾（Anusvāra），随后续辅音部位同化为 ŋ/ɲ/ɳ/n/m',
      });
    } else if (syl.modifiers.includes('m\u0310')) {
      features.push({
        code: 'anusvara',
        labelZh: '仰月空点 (m̐)',
        tipZh: '仰月鼻化共鸣收尾（Candrabindu / Anunāsika），元音与鼻音圆融摄持',
      });
    }
    if (syl.modifiers.includes('ḥ')) {
      features.push({
        code: 'visarga',
        labelZh: '止韵涅槃点 (ḥ)',
        tipZh: '元音后伴随清脆喉部送气收尾（Visarga）',
      });
    }

    return {
      index: idx + 1,
      iast: iastSyl,
      devanagari: iastToDevanagari(iastSyl),
      siddham: iastToSiddham(iastSyl),
      ipa: ipaRaw,
      vowel: syl.vowel,
      weight,
      matraCount: weight === 'guru' ? 2 : 1,
      weightReasonZh,
      features,
      formantHz: VOWEL_FORMANTS[syl.vowel] || { f1: 650, f2: 1200 },
      onset: syl.onset,
      modifiers: syl.modifiers,
      coda: syl.coda,
      wordIndex: syl.wordIndex,
      subwordIndex: syl.subwordIndex,
      wordIast: syl.wordIast,
      isWordStart: syl.isWordStart,
      isWordEnd: syl.isWordEnd,
      hyphenBefore: syl.hyphenBefore,
      dandaBefore: syl.dandaBefore,
      dandaAfter: syl.dandaAfter,
    };
  });
}
