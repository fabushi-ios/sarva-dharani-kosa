/**
 * src/core/transliterator.ts
 * Multi-Script Transliteration Engine (Devanāgarī ↔ IAST ↔ SLP1 ↔ Unicode Siddhaṃ ↔ Tibetan EWTS ↔ IPA)
 * Ported from sanskrit_phonetic_engine.html (Module 1, lines 322–517) and extended with
 * Unicode Siddhaṃ (U+11580–U+115FF), Tibetan EWTS/Wylie → IAST, and IPA generation.
 */

import { CONS_MATRIX, VOWEL_IPA_MAP } from '../data/siddhamMatrix';
import type { SyllableAnalysis, LineAnalysis } from '../types/dharani';

export type { SyllableAnalysis, LineAnalysis };
export type InputMode = 'smart' | 'strict' | 'slp1';

export const DEVA_TO_SLP1: Record<string, string> = {
  // 14 Independent Vowels
  'अ': 'a', 'आ': 'A', 'इ': 'i', 'ई': 'I', 'उ': 'u', 'ऊ': 'U',
  'ऋ': 'f', 'ॠ': 'F', 'ऌ': 'x', 'ॡ': 'X', 'ए': 'e', 'ऐ': 'E', 'ओ': 'o', 'औ': 'O',
  // 13 Dependent Vowel Signs (Matras)
  'ा': 'A', 'ि': 'i', 'ी': 'I', 'ु': 'u', 'ू': 'U',
  'ृ': 'f', 'ॄ': 'F', 'ॢ': 'x', 'ॣ': 'X', 'े': 'e', 'ै': 'E', 'ो': 'o', 'ौ': 'O',
  // Modifiers & Symbols
  'ं': 'M', 'ः': 'H', 'ँ': '~', 'ऽ': "'", 'ॐ': 'oM', '।': '|', '॥': '||',
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  // 34 Consonants
  'क': 'k', 'ख': 'K', 'ग': 'g', 'घ': 'G', 'ङ': 'N',
  'च': 'c', 'छ': 'C', 'ज': 'j', 'झ': 'J', 'ञ': 'Y',
  'ट': 'w', 'ठ': 'W', 'ड': 'q', 'ढ': 'Q', 'ण': 'R',
  'त': 't', 'थ': 'T', 'द': 'd', 'ध': 'D', 'न': 'n',
  'प': 'p', 'फ': 'P', 'ब': 'b', 'भ': 'B', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
  'श': 'S', 'ष': 'z', 'स': 's', 'ह': 'h', 'ळ': 'L',
  // Precomposed Nukta Consonants
  'क़': 'k', 'ख़': 'K', 'ग़': 'g', 'ज़': 'j', 'ड़': 'q', 'ढ़': 'Q', 'फ़': 'P'
};

const DEVA_CONSONANTS = new Set('कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहळ'.split(''));
const DEVA_MATRAS = new Set('ािीुूृॄॢॣेैोौ'.split(''));
const DEVA_IGNORE = new Set(['\u0951', '\u0952', '\u0953', '\u0954', '\u200c', '\u200d']);

export function devanagariToSlp1(text: string): string {
  const norm = text.normalize('NFC');
  let out = '';
  for (let i = 0; i < norm.length; i++) {
    const ch = norm[i];
    if (DEVA_IGNORE.has(ch)) continue;
    const next = norm[i + 1];
    if (DEVA_CONSONANTS.has(ch)) {
      out += DEVA_TO_SLP1[ch];
      if (next === '्') {
        i++; // Virāma suppresses inherent 'a'
      } else if (DEVA_MATRAS.has(next)) {
        out += DEVA_TO_SLP1[next];
        i++;
      } else if (next === '़') {
        // Combining Nukta followed by optional Virāma or Matra
        i++;
        const afterNukta = norm[i + 1];
        if (afterNukta === '्') {
          i++;
        } else if (DEVA_MATRAS.has(afterNukta)) {
          out += DEVA_TO_SLP1[afterNukta];
          i++;
        } else {
          out += 'a';
        }
      } else {
        out += 'a';
      }
    } else if (DEVA_TO_SLP1[ch] !== undefined) {
      out += DEVA_TO_SLP1[ch];
    } else {
      out += ch;
    }
  }
  return out;
}

export const IAST_TO_SLP1_RULES: Array<[string, string]> = [
  ['ai', 'E'], ['au', 'O'],
  ['kh', 'K'], ['gh', 'G'], ['ch', 'C'], ['jh', 'J'],
  ['ṭh', 'W'], ['ḍh', 'Q'], ['th', 'T'], ['dh', 'D'], ['ph', 'P'], ['bh', 'B'],
  ['ṝ', 'F'], ['ḹ', 'X'], ['ā', 'A'], ['ī', 'I'], ['ū', 'U'], ['ṛ', 'f'], ['ḷ', 'x'],
  ['ē', 'e'], ['ō', 'o'],
  ['ṅ', 'N'], ['ñ', 'Y'], ['ṭ', 'w'], ['ḍ', 'q'], ['ṇ', 'R'], ['ś', 'S'], ['ṣ', 'z'],
  ['ṃ\u0310', '~'], ['ṁ\u0310', '~'], ['m\u0310', '~'], ['\u0310', '~'],
  ['ṃ', 'M'], ['ṁ', 'M'], ['ḥ', 'H'], ['ँ', '~']
];

export const ROUGH_ENGLISH_WORD_MAP: Record<string, string> = {
  'om': 'oṃ', 'aum': 'oṃ', 'hum': 'hūṃ', 'hrim': 'hrīṃ', 'hreem': 'hrīṃ',
  'shrim': 'śrīṃ', 'shreem': 'śrīṃ', 'srim': 'śrīṃ', 'klim': 'klīṃ', 'kleem': 'klīṃ',
  'aim': 'aiṃ', 'krim': 'krīṃ', 'kreem': 'krīṃ', 'strim': 'strīṃ',
  'svaha': 'svāhā', 'swaha': 'svāhā', 'namah': 'namaḥ', 'namaha': 'namaḥ',
  'phat': 'phaṭ', 'vashat': 'vaṣaṭ', 'vasat': 'vaṣaṭ', 'vaushat': 'vauṣaṭ',
  'shanti': 'śāntiḥ', 'shantih': 'śāntiḥ', 'santi': 'śāntiḥ',
  'mani': 'maṇi', 'padme': 'padme', 'tare': 'tāre', 'tuttare': 'tuttāre', 'ture': 'ture',
  'shiva': 'śiva', 'shivaya': 'śivāya', 'krishna': 'kṛṣṇa', 'rama': 'rāma',
  'gayatri': 'gāyatrī', 'mantra': 'mantra', 'dharma': 'dharma', 'karma': 'karma',
  'buddha': 'buddha', 'bodhi': 'bodhi', 'sattva': 'sattva', 'bhagavate': 'bhagavate',
  'vasudevaya': 'vāsudevāya', 'narayanaya': 'nārāyaṇāya', 'ganeshaya': 'gaṇeśāya',
  'shri': 'śrī', 'sri': 'śrī', 'hridaya': 'hṛdaya', 'amrita': 'amṛta',
  'prajna': 'prajñā', 'paramita': 'pāramitā', 'avalokiteshvara': 'avalokiteśvara',
  'gate': 'gate', 'paragate': 'pāragate', 'parasamgate': 'pārasaṃgate'
};

export function iastToSlp1(chunk: string, mode: InputMode = 'strict'): string {
  if (mode === 'slp1') {
    return chunk;
  }
  let s = chunk.normalize('NFC').toLowerCase();
  if (mode === 'smart') {
    s = s.replace(/[a-zāīūṛṝḷḹṅñṭḍṇśṣṃṁḥ']+/g, (word) => {
      if (ROUGH_ENGLISH_WORD_MAP[word]) return ROUGH_ENGLISH_WORD_MAP[word];
      if (!/[āīūṛṝḷḹṅñṭḍṇśṣṃṁḥ]/.test(word)) {
        return word
          .replace(/shh/g, 'ṣ')
          .replace(/ksh/g, 'kṣ')
          .replace(/sh/g, 'ś')
          .replace(/aa/g, 'ā')
          .replace(/ee/g, 'ī')
          .replace(/oo/g, 'ū');
      }
      return word;
    });
  }
  for (const [iast, slp] of IAST_TO_SLP1_RULES) {
    s = s.split(iast).join(slp);
  }
  return s;
}

/* ============================================================================
 * Unicode Siddhaṃ (U+11580..U+115FF) ↔ SLP1 Mapping Tables
 * ========================================================================== */

const SLP1_VOWEL_TO_SIDDHAM: Record<string, string> = {
  'a': '\u{11580}', // 𑖀
  'A': '\u{11581}', // 𑖁
  'i': '\u{11582}', // 𑖂
  'I': '\u{11583}', // 𑖃
  'u': '\u{11584}', // 𑖄
  'U': '\u{11585}', // 𑖅
  'f': '\u{11586}', // 𑖆
  'F': '\u{11587}', // 𑖇
  'x': '\u{11588}', // 𑖈
  'X': '\u{11589}', // 𑖉
  'e': '\u{1158A}', // 𑖊
  'E': '\u{1158B}', // 𑖋
  'o': '\u{1158C}', // 𑖌
  'O': '\u{1158D}'  // 𑖍
};

const SLP1_MATRA_TO_SIDDHAM: Record<string, string> = {
  'a': '',
  'A': '\u{115AF}', // 𑖯
  'i': '\u{115B0}', // 𑖰
  'I': '\u{115B1}', // 𑖱
  'u': '\u{115B2}', // 𑖲
  'U': '\u{115B3}', // 𑖳
  'f': '\u{115B4}', // 𑖴
  'F': '\u{115B5}', // 𑖵
  'x': '\u{115BF}\u{115A9}\u{115B4}', // virāma + la + vocalic r sign (since U+115B6 is reserved)
  'X': '\u{115BF}\u{115A9}\u{115B5}', // virāma + la + vocalic rr sign
  'e': '\u{115B8}', // 𑖸
  'E': '\u{115B9}', // 𑖹
  'o': '\u{115BA}', // 𑖺
  'O': '\u{115BB}'  // 𑖻
};

const SLP1_CONS_TO_SIDDHAM: Record<string, string> = {
  'k': '\u{1158E}', 'K': '\u{1158F}', 'g': '\u{11590}', 'G': '\u{11591}', 'N': '\u{11592}',
  'c': '\u{11593}', 'C': '\u{11594}', 'j': '\u{11595}', 'J': '\u{11596}', 'Y': '\u{11597}',
  'w': '\u{11598}', 'W': '\u{11599}', 'q': '\u{1159A}', 'Q': '\u{1159B}', 'R': '\u{1159C}',
  't': '\u{1159D}', 'T': '\u{1159E}', 'd': '\u{1159F}', 'D': '\u{115A0}', 'n': '\u{115A1}',
  'p': '\u{115A2}', 'P': '\u{115A3}', 'b': '\u{115A4}', 'B': '\u{115A5}', 'm': '\u{115A6}',
  'y': '\u{115A7}', 'r': '\u{115A8}', 'l': '\u{115A9}', 'v': '\u{115AA}',
  'S': '\u{115AB}', 'z': '\u{115AC}', 's': '\u{115AD}', 'h': '\u{115AE}', 'L': '\u{115A9}'
};

const SIDDHAM_VOWEL_TO_SLP1: Record<string, string> = Object.fromEntries(
  Object.entries(SLP1_VOWEL_TO_SIDDHAM).map(([k, v]) => [v, k])
);

const SIDDHAM_MATRA_TO_SLP1: Record<string, string> = {
  '\u{115AF}': 'A',
  '\u{115B0}': 'i',
  '\u{115B1}': 'I',
  '\u{115B2}': 'u',
  '\u{115B3}': 'U',
  '\u{115B4}': 'f',
  '\u{115B5}': 'F',
  '\u{115B8}': 'e',
  '\u{115B9}': 'E',
  '\u{115BA}': 'o',
  '\u{115BB}': 'O',
  // Fallback for alternative Siddham vowel combinations
  '\u{115DC}': 'u',
  '\u{115DD}': 'U'
};

const SIDDHAM_CONS_TO_SLP1: Record<string, string> = {};
for (const [k, v] of Object.entries(SLP1_CONS_TO_SIDDHAM)) {
  if (k !== 'L') {
    SIDDHAM_CONS_TO_SLP1[v] = k;
  }
}

const SIDDHAM_MOD_TO_SLP1: Record<string, string> = {
  '\u{115BC}': '~', // 𑖼 Candrabindu
  '\u{115BD}': 'M', // 𑖽 Anusvāra
  '\u{115BE}': 'H', // 𑖾 Visarga
  '\u{115C2}': '|', // 𑗂 Daṇḍa
  '\u{115C3}': '||' // 𑗃 Double Daṇḍa
};

export function slp1ToSiddhamUnicode(slp: string): string {
  let out = '';
  for (let i = 0; i < slp.length; i++) {
    const ch = slp[i];
    const next = slp[i + 1];
    if (SLP1_CONS_TO_SIDDHAM[ch]) {
      out += SLP1_CONS_TO_SIDDHAM[ch];
      if (SLP1_MATRA_TO_SIDDHAM[next] !== undefined) {
        out += SLP1_MATRA_TO_SIDDHAM[next];
        i++;
      } else {
        out += '\u{115BF}'; // 𑖿 Virāma
      }
    } else if (SLP1_VOWEL_TO_SIDDHAM[ch]) {
      out += SLP1_VOWEL_TO_SIDDHAM[ch];
    } else if (ch === 'M') {
      out += '\u{115BD}';
    } else if (ch === 'H') {
      out += '\u{115BE}';
    } else if (ch === '~') {
      out += '\u{115BC}';
    } else if (ch === '|' && next === '|') {
      out += '\u{115C3}';
      i++;
    } else if (ch === '|') {
      out += '\u{115C2}';
    } else {
      out += ch;
    }
  }
  return out;
}

export function iastToSiddhamUnicode(iast: string): string {
  return slp1ToSiddhamUnicode(iastToSlp1(iast, 'strict'));
}

export function siddhamUnicodeToSlp1(siddhamText: string): string {
  const chars = Array.from(siddhamText);
  let out = '';
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const next = chars[i + 1];
    if (SIDDHAM_CONS_TO_SLP1[ch]) {
      out += SIDDHAM_CONS_TO_SLP1[ch];
      // Check for post-consonantal vocalic l/ll sequence: virāma + la + vocalic r/rr sign
      if (
        next === '\u{115BF}' &&
        chars[i + 2] === '\u{115A9}' &&
        (chars[i + 3] === '\u{115B4}' || chars[i + 3] === '\u{115B5}')
      ) {
        out += chars[i + 3] === '\u{115B4}' ? 'x' : 'X';
        i += 3;
        continue;
      }
      if (next === '\u{115BF}') {
        i++; // Virāma
      } else if (next && SIDDHAM_MATRA_TO_SLP1[next]) {
        out += SIDDHAM_MATRA_TO_SLP1[next];
        i++;
      } else {
        out += 'a';
      }
    } else if (SIDDHAM_VOWEL_TO_SLP1[ch]) {
      out += SIDDHAM_VOWEL_TO_SLP1[ch];
    } else if (SIDDHAM_MOD_TO_SLP1[ch]) {
      out += SIDDHAM_MOD_TO_SLP1[ch];
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * Segment-safe multi-script → SLP1 converter.
 * Prevents Devanāgarī or Siddhaṃ uppercase SLP1 output from being lowercased by Latin rules.
 */
export function inputToSlp1(text: string, mode: InputMode = 'smart'): string {
  const parts =
    text.match(
      /[\u0900-\u097F\u200c\u200d]+|[\u{11580}-\u{115FF}]+|[^\u0900-\u097F\u200c\u200d\u{11580}-\u{115FF}]+/gu
    ) || [];
  return parts
    .map((part) => {
      if (/[\u0900-\u097F]/.test(part)) {
        return devanagariToSlp1(part);
      }
      if (/[\u{11580}-\u{115FF}]/u.test(part)) {
        return siddhamUnicodeToSlp1(part);
      }
      return iastToSlp1(part, mode);
    })
    .join('');
}

const SLP1_TO_IAST: Record<string, string> = {
  'a': 'a', 'A': 'ā', 'i': 'i', 'I': 'ī', 'u': 'u', 'U': 'ū',
  'f': 'ṛ', 'F': 'ṝ', 'x': 'ḷ', 'X': 'ḹ', 'e': 'e', 'E': 'ai', 'o': 'o', 'O': 'au',
  'M': 'ṃ', 'H': 'ḥ', '~': 'ँ', "'": "'",
  'k': 'k', 'K': 'kh', 'g': 'g', 'G': 'gh', 'N': 'ṅ',
  'c': 'c', 'C': 'ch', 'j': 'j', 'J': 'jh', 'Y': 'ñ',
  'w': 'ṭ', 'W': 'ṭh', 'q': 'ḍ', 'Q': 'ḍh', 'R': 'ṇ',
  't': 't', 'T': 'th', 'd': 'd', 'D': 'dh', 'n': 'n',
  'p': 'p', 'P': 'ph', 'b': 'b', 'B': 'bh', 'm': 'm',
  'y': 'y', 'r': 'r', 'l': 'l', 'v': 'v',
  'S': 'ś', 'z': 'ṣ', 's': 's', 'h': 'h', 'L': 'ḷ'
};

const SLP1_VOWEL_TO_DEVA: Record<string, string> = {
  'a': 'अ', 'A': 'आ', 'i': 'इ', 'I': 'ई', 'u': 'उ', 'U': 'ऊ',
  'f': 'ऋ', 'F': 'ॠ', 'x': 'ऌ', 'X': 'ॡ', 'e': 'ए', 'E': 'ऐ', 'o': 'ओ', 'O': 'औ'
};

const SLP1_MATRA_TO_DEVA: Record<string, string> = {
  'a': '', 'A': 'ा', 'i': 'ि', 'I': 'ी', 'u': 'ु', 'U': 'ू',
  'f': 'ृ', 'F': 'ॄ', 'x': 'ॢ', 'X': 'ॣ', 'e': 'े', 'E': 'ै', 'o': 'ो', 'O': 'ौ'
};

const SLP1_CONS_TO_DEVA: Record<string, string> = {
  'k': 'क', 'K': 'ख', 'g': 'ग', 'G': 'घ', 'N': 'ङ',
  'c': 'च', 'C': 'छ', 'j': 'ज', 'J': 'झ', 'Y': 'ञ',
  'w': 'ट', 'W': 'ठ', 'q': 'ड', 'Q': 'ढ', 'R': 'ण',
  't': 'त', 'T': 'थ', 'd': 'द', 'D': 'ध', 'n': 'न',
  'p': 'प', 'P': 'फ', 'b': 'ब', 'B': 'भ', 'm': 'म',
  'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व',
  'S': 'श', 'z': 'ष', 's': 'स', 'h': 'ह', 'L': 'ळ'
};

export function slp1ToIast(slp: string): string {
  return slp
    .split('')
    .map((c) => SLP1_TO_IAST[c] ?? c)
    .join('');
}

export function slp1ToDevanagari(slp: string): string {
  let out = '';
  for (let i = 0; i < slp.length; i++) {
    if (
      slp.slice(i, i + 2) === 'oM' &&
      (i === 0 || !SLP1_CONS_TO_DEVA[slp[i - 1]]) &&
      !SLP1_VOWEL_TO_DEVA[slp[i + 2]]
    ) {
      out += 'ॐ';
      i++;
      continue;
    }
    const ch = slp[i];
    const next = slp[i + 1];
    if (SLP1_CONS_TO_DEVA[ch]) {
      out += SLP1_CONS_TO_DEVA[ch];
      if (SLP1_MATRA_TO_DEVA[next] !== undefined) {
        out += SLP1_MATRA_TO_DEVA[next];
        i++;
      } else {
        out += '्';
      }
    } else if (SLP1_VOWEL_TO_DEVA[ch]) {
      out += SLP1_VOWEL_TO_DEVA[ch];
    } else if (ch === 'M') out += 'ं';
    else if (ch === 'H') out += 'ः';
    else if (ch === '~') out += 'ँ';
    else if (ch === "'") out += 'ऽ';
    else if (ch === '|' && next === '|') {
      out += '॥';
      i++;
    } else if (ch === '|') out += '।';
    else out += ch;
  }
  return out;
}

/* ============================================================================
 * Tibetan Extended Wylie (EWTS) / rKTs Sanskrit → IAST (`ewtsToIast`)
 * ========================================================================== */

const EWTS_SYLLABLE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/badz\+?ra/g, 'vajra'],
  [/badz\+?r/g, 'vajr'],
  [/pad\+ma/g, 'padma'],
  [/rat\+na/g, 'ratna'],
  [/sat\+?wa/g, 'sattva'],
  [/sar\+?ba/g, 'sarva'],
  [/sar\+?wa/g, 'sarva'],
  [/swA/g, 'svā'],
  [/swa/g, 'sva'],
  [/ts\+tsh/g, 'cch'],
  [/ts\+ts/g, 'cc'],
  [/dz\+dz/g, 'jj'],
  [/dz\+ny/g, 'jñ'],
  [/j\+ny/g, 'jñ'],
  [/b\+h/g, 'bh'],
  [/d\+h/g, 'dh'],
  [/g\+h/g, 'gh'],
  [/dz\+h/g, 'jh'],
  [/j\+h/g, 'jh'],
  [/D\+h/g, 'ḍh'],
  [/Dh/g, 'ḍh'],
  [/T\+h/g, 'ṭh'],
  [/Th/g, 'ṭh'],
  [/k\+Sh/g, 'kṣ'],
  [/k\+SH/g, 'kṣ'],
  [/tsh/g, 'ch'],
  [/ts/g, 'c'],
  [/dz/g, 'j'],
  [/Sh/g, 'ṣ'],
  [/SH/g, 'ṣ'],
  [/sh/g, 'ś'],
  [/ny/g, 'ñ'],
  [/ng/g, 'ṅ'],
  [/r-i/g, 'ṛ'],
  [/r-I/g, 'ṝ'],
  [/l-i/g, 'ḷ'],
  [/l-I/g, 'ḹ'],
  [/~M/g, 'ṃ'],
  [/~m/g, 'ṃ'],
  [/M/g, 'ṃ'],
  [/H/g, 'ḥ'],
  [/T/g, 'ṭ'],
  [/D/g, 'ḍ'],
  [/N/g, 'ṇ'],
  [/A/g, 'ā'],
  [/I/g, 'ī'],
  [/U/g, 'ū'],
  [/E/g, 'ai'],
  [/O/g, 'au'],
  [/a'i/g, 'ai'],
  [/a'u/g, 'au'],
  [/'a/g, 'ā'],
  [/'i/g, 'ī'],
  [/'u/g, 'ū'],
  [/\+/g, ''],
  [/w/g, 'v']
];

const EWTS_MULTI_SYLLABLE_COALESCENCE: Array<[RegExp, string]> = [
  [/(?<=^|\s)bho\s+dha\s+ra(?=\s|$)/gi, 'bhodhara'],
  [/(?<=^|\s)u\s+cchuṣma(?=\s|$)/gi, 'ucchuṣma'],
  [/(?<=^|\s)kro\s+dha(?=\s|$)/gi, 'krodha'],
  [/(?<=^|\s)svā\s+hā(?=\s|$)/gi, 'svāhā'],
  [/(?<=^|\s)ma\s+hā(?=\s|$)/gi, 'mahā'],
  [/(?<=^|\s)me\s+ru(?=\s|$)/gi, 'meru'],
  [/(?<=^|\s)śi\s+khar(?=\s|$)/gi, 'śikhar'],
  [/(?<=^|\s)śi\s+kha\s+ra(?=\s|$)/gi, 'śikhara'],
  [/(?<=^|\s)kū\s+ṭa\s+gā\s+ra(?=\s|$)/gi, 'kūṭagāra'],
  [/(?<=^|\s)dhā\s+ra\s+ṇī(?=\s|$)/gi, 'dhāraṇī'],
  [/(?<=^|\s)ta\s+dya\s+thā(?=\s|$)/gi, 'tadyathā'],
  [/(?<=^|\s)bha\s+ga\s+va\s+te(?=\s|$)/gi, 'bhagavate'],
  [/(?<=^|\s)bha\s+ga\s+vā\s+n(?=\s|$)/gi, 'bhagavān'],
  [/(?<=^|\s)ta\s+thā\s+ga\s+ta(?=\s|$)/gi, 'tathāgata'],
  [/(?<=^|\s)bo\s+dhi\s+sa\s+ttva(?=\s|$)/gi, 'bodhisattva'],
  [/(?<=^|\s)bo\s+dhi\s+sattva(?=\s|$)/gi, 'bodhisattva'],
  [/(?<=^|\s)bo\s+dhi(?=\s|$)/gi, 'bodhi'],
  [/(?<=^|\s)na\s+mo(?=\s|$)/gi, 'namo'],
  [/(?<=^|\s)na\s+maḥ(?=\s|$)/gi, 'namaḥ'],
  [/(?<=^|\s)sa\s+man\s+ta(?=\s|$)/gi, 'samanta'],
  [/(?<=^|\s)a\s+mo\s+gha(?=\s|$)/gi, 'amogha'],
  [/(?<=^|\s)u\s*ṣṇī\s*ṣa(?=\s|$)/gi, 'uṣṇīṣa'],
  [/(?<=^|\s)uṣ\s*ṇī\s*ṣa(?=\s|$)/gi, 'uṣṇīṣa'],
  [/(?<=^|\s)pa\s+dma(?=\s|$)/gi, 'padma'],
  [/(?<=^|\s)pad\s+ma(?=\s|$)/gi, 'padma'],
  [/(?<=^|\s)pa\s+dme(?=\s|$)/gi, 'padme'],
  [/(?<=^|\s)pad\s+me(?=\s|$)/gi, 'padme'],
  [/(?<=^|\s)ma\s+ṇi(?=\s|$)/gi, 'maṇi'],
  [/(?<=^|\s)hṛ\s+da\s+ya(?=\s|$)/gi, 'hṛdaya'],
  [/(?<=^|\s)ma\s+ntra(?=\s|$)/gi, 'mantra'],
  [/(?<=^|\s)man\s+tra(?=\s|$)/gi, 'mantra'],
  [/(?<=^|\s)vi\s+dyā(?=\s|$)/gi, 'vidyā'],
  [/(?<=^|\s)sū\s+tra(?=\s|$)/gi, 'sūtra'],
  [/(?<=^|\s)nā\s+ma(?=\s|$)/gi, 'nāma'],
  [/(?<=^|\s)sar\s+va(?=\s|$)/gi, 'sarva'],
  [/(?<=^|\s)vaj\s+ra(?=\s|$)/gi, 'vajra']
];

export function ewtsToIast(ewtsText: string): string {
  // Step 1: Strip folio/line headers, @#*/ markers, rgya gar skad du/, and shads
  let s = ewtsText
    .replace(/^\d+'?[ab]\d+\([^)]*\):\s*/g, '')
    .replace(/^[@#*!\s/]+/g, '')
    .replace(/^rgya\s+gar\s+skad\s+du\s*\/?\s*/i, '')
    .replace(/\/+/g, ' ')
    .trim();

  // Step 2: Apply syllable-level EWTS → IAST rules
  for (const [pattern, replacement] of EWTS_SYLLABLE_REPLACEMENTS) {
    s = s.replace(pattern, replacement);
  }
  // Strip any remaining leading apostrophe (a-chung before initial vowel)
  s = s.replace(/(^|\s)'([aiuāīūṛṝḷḹeao])/g, '$1$2');

  // Step 3: Coalesce multi-syllable Sanskrit words separated by Tibetan tsheg spaces
  s = s.replace(/\s+/g, ' ').trim();
  for (const [pattern, replacement] of EWTS_MULTI_SYLLABLE_COALESCENCE) {
    s = s.replace(pattern, replacement);
  }

  return s.replace(/\s+/g, ' ').trim();
}

/* ============================================================================
 * IPA Phonetic Transcription (`slp1ToIpa` & `iastToIpa`)
 * ========================================================================== */

export function slp1ToIpa(slp: string): string {
  let out = '';
  for (let i = 0; i < slp.length; i++) {
    const ch = slp[i];
    const next = slp[i + 1];
    if (CONS_MATRIX[ch]) {
      out += CONS_MATRIX[ch].ipa;
    } else if (VOWEL_IPA_MAP[ch]) {
      out += VOWEL_IPA_MAP[ch];
    } else if (ch === 'M' || ch === '~') {
      if (next && 'kKgGN'.includes(next)) out += 'ŋ';
      else if (next && 'cCjJYSy'.includes(next)) out += 'ɲ';
      else if (next && 'wWqQR'.includes(next)) out += 'ɳ';
      else if (next && 'tTdDnsz'.includes(next)) out += 'n̪';
      else out += 'm';
    } else if (ch === 'H') {
      out += 'h';
    } else if (ch === "'") {
      out += 'ː';
    } else {
      out += ch;
    }
  }
  return out;
}

export function iastToIpa(iast: string): string {
  return slp1ToIpa(iastToSlp1(iast, 'strict'));
}
