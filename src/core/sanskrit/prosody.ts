/**
 * src/core/sanskrit/prosody.ts
 *
 * Sanskrit Śikṣā & Chandas (Prosody / Meter) Analysis Engine
 * Segments Sanskrit IAST verses into Akṣaras / phonological syllables,
 * determines Guru (— Heavy, 2 Mātrā) vs Laghu (⌣ Light, 1 Mātrā) prosodic weight,
 * detects phonetic articulation features, and computes acoustic formant targets
 * for the Web Audio API Sanskrit Chant Synthesizer.
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

// Valid 2-consonant syllable-initial onset clusters in Sanskrit
const VALID_INITIAL_CLUSTERS = new Set([
  'pr', 'pl', 'br', 'bhr', 'tr', 'tv', 'ty', 'dr', 'dv', 'dy', 'dhr', 'dhv', 'dhy',
  'kr', 'kl', 'kv', 'ky', 'kṣ', 'khy', 'gr', 'gl', 'gy', 'ghr',
  'cy', 'jy', 'jv', 'jñ',
  'śr', 'śl', 'śv', 'śy', 'ṣṭ', 'ṣṭh', 'ṣṇ', 'st', 'sth', 'sn', 'sm', 'sv', 'sy', 'sr', 'sk', 'sp', 'sph',
  'vy', 'vr', 'ny', 'ny', 'my', 'ly', 'hy', 'hr', 'hl', 'hv',
]);

interface PhonemeToken {
  type: 'C' | 'V' | 'M'; // Consonant, Vowel, Modifier (ṃ/ḥ)
  val: string;
}

function tokenizeWordPhonemes(word: string): PhonemeToken[] {
  const s = word.toLowerCase().trim();
  const tokens: PhonemeToken[] = [];
  let i = 0;

  while (i < s.length) {
    const rest = s.slice(i);
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

interface RawSyllable {
  onset: string[];
  vowel: string;
  modifiers: string[];
  coda: string[];
}

function syllabifySingleWord(word: string): RawSyllable[] {
  const tokens = tokenizeWordPhonemes(word);
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

      // If there is a previous syllable in this same word and cluster has >= 2 consonants,
      // split off the first consonant(s) into the previous syllable's coda unless the cluster
      // is an inseparable Sanskrit initial onset (like kṣ, jñ, pr, tr, śr, sv, tv).
      let onset = cluster;
      if (syllables.length > 0 && cluster.length >= 2) {
        const prevSyl = syllables[syllables.length - 1];
        if (prevSyl.modifiers.length === 0) {
          const lastTwo = cluster.slice(-2).join('');
          if (cluster.length >= 3) {
            if (VALID_INITIAL_CLUSTERS.has(lastTwo)) {
              prevSyl.coda.push(...cluster.slice(0, -2));
              onset = cluster.slice(-2);
            } else {
              prevSyl.coda.push(...cluster.slice(0, -1));
              onset = cluster.slice(-1);
            }
          } else {
            // 2 consonants between vowels: e.g. rat-na, pad-ma, sar-va, dhar-ma, sam-an-ta, bud-dha
            // Only keep together if it is kṣ, jñ, or stop+glide (pr, tr, kr, śr, sv, tv, dv, vy, dhy)
            const keepTogether = new Set([
              'kṣ', 'jñ', 'pr', 'tr', 'kr', 'gr', 'dr', 'bhr', 'dhr', 'śr',
              'sv', 'tv', 'dv', 'jv', 'vy', 'ty', 'dy', 'dhy', 'ky', 'gy', 'śy', 'sy', 'ny',
            ]);
            if (keepTogether.has(lastTwo)) {
              onset = cluster;
            } else {
              prevSyl.coda.push(cluster[0]);
              onset = [cluster[1]];
            }
          }
        }
      }

      syllables.push({ onset, vowel, modifiers, coda: [] });
    } else if (cluster.length > 0) {
      // Word-final consonant(s) (e.g. "nam", "phaṭ", "buddhānām", "sam")
      if (syllables.length > 0) {
        syllables[syllables.length - 1].coda.push(...cluster);
      } else {
        // Standalone vowelless consonant token
        syllables.push({ onset: cluster, vowel: 'a', modifiers: [], coda: [] });
      }
    } else {
      i++;
    }
  }

  return syllables;
}

/**
 * Segment a Sanskrit IAST verse into syllables (Akṣaras) respecting word boundaries
 * and compute Śikṣā prosodic weights.
 */
export function analyzeSanskritProsody(rawIast: string): SyllableAnalysis[] {
  const cleaned = cleanEditorialIast(rawIast);
  // Split into words on whitespace and punctuation so word-final consonants (like -m in "nam")
  // never jump across word boundaries!
  const words = cleaned
    .toLowerCase()
    .split(/[\s|/.,;!?—–\-()[\]'’\d]+/)
    .filter(Boolean);

  const rawSyllables: RawSyllable[] = [];
  for (const w of words) {
    rawSyllables.push(...syllabifySingleWord(w));
  }

  return rawSyllables.map((syl, idx) => {
    const nextSyl = rawSyllables[idx + 1];
    const nextOnsetCount = nextSyl ? nextSyl.onset.length : 0;

    const iastSyl =
      syl.onset.join('') + syl.vowel + syl.modifiers.join('') + syl.coda.join('');

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
      weightReasonZh = `后接双辅音丛 (${nextSyl.onset.join('')}-) · 位置重音 (Saṃyogapūrva Guru, 2拍)`;
    }

    const features: PhoneticFeatureBadge[] = [];
    const allConsonants = [...syl.onset, ...syl.coda];

    if (allConsonants.some((c) => ['ṭ', 'ṭh', 'ḍ', 'ḍh', 'ṇ', 'ṣ'].includes(c)) || syl.vowel === 'ṛ') {
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
      ipa: iastToIpa(iastSyl),
      vowel: syl.vowel,
      weight,
      matraCount: weight === 'guru' ? 2 : 1,
      weightReasonZh,
      features,
      formantHz: VOWEL_FORMANTS[syl.vowel] || { f1: 650, f2: 1200 },
    };
  });
}
