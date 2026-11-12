/**
 * src/core/sanskrit/transliterator.ts
 *
 * Deterministic Sanskrit Multi-Script Transliteration Engine
 * Converts standard IAST (International Alphabet of Sanskrit Transliteration) into:
 * 1. Devanāgarī (天城文 Unicode U+0900..U+097F)
 * 2. Siddhaṃ (悉昙梵字 Unicode U+11580..U+115FF)
 * 3. IPA (International Phonetic Alphabet 国际音标)
 */

// Ordered longest-first for greedy tokenization
const VOWEL_TOKENS = [
  'ai',
  'au',
  'ṝ',
  'ḹ',
  'ā',
  'ī',
  'ū',
  'ṛ',
  'ḷ',
  'e',
  'o',
  'a',
  'i',
  'u',
] as const;

const CONSONANT_TOKENS = [
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
  'ḻ',
] as const;

const DEVANAGARI_INDEPENDENT_VOWELS: Record<string, string> = {
  a: 'अ',
  ā: 'आ',
  i: 'इ',
  ī: 'ई',
  u: 'उ',
  ū: 'ऊ',
  ṛ: 'ऋ',
  ṝ: 'ॠ',
  ḷ: 'ऌ',
  ḹ: 'ॡ',
  e: 'ए',
  ai: 'ऐ',
  o: 'ओ',
  au: 'औ',
};

const DEVANAGARI_MATRAS: Record<string, string> = {
  a: '',
  ā: 'ा',
  i: 'ि',
  ī: 'ी',
  u: 'ु',
  ū: 'ू',
  ṛ: 'ृ',
  ṝ: 'ॄ',
  ḷ: 'ॢ',
  ḹ: 'ॣ',
  e: 'े',
  ai: 'ै',
  o: 'ो',
  au: 'ौ',
};

const DEVANAGARI_CONSONANTS: Record<string, string> = {
  k: 'क',
  kh: 'ख',
  g: 'ग',
  gh: 'घ',
  ṅ: 'ङ',
  c: 'च',
  ch: 'छ',
  j: 'ज',
  jh: 'झ',
  ñ: 'ञ',
  ṭ: 'ट',
  ṭh: 'ठ',
  ḍ: 'ड',
  ḍh: 'ढ',
  ṇ: 'ण',
  t: 'त',
  th: 'थ',
  d: 'द',
  dh: 'ध',
  n: 'न',
  p: 'प',
  ph: 'फ',
  b: 'ब',
  bh: 'भ',
  m: 'म',
  y: 'य',
  r: 'र',
  l: 'ल',
  v: 'व',
  ś: 'श',
  ṣ: 'ष',
  s: 'स',
  h: 'ह',
  ḻ: 'ळ',
};

const DEVANAGARI_VIRAMA = '्';

// Siddhaṃ Unicode Block (U+11580..U+115FF)
const SIDDHAM_INDEPENDENT_VOWELS: Record<string, string> = {
  a: '𑖀',
  ā: '𑖁',
  i: '𑖂',
  ī: '𑖃',
  u: '𑖄',
  ū: '𑖅',
  ṛ: '𑖆',
  ṝ: '𑖇',
  ḷ: '𑖈',
  ḹ: '𑖉',
  e: '𑖊',
  ai: '𑖋',
  o: '𑖌',
  au: '𑖍',
};

const SIDDHAM_MATRAS: Record<string, string> = {
  a: '',
  ā: '𑖯',
  i: '𑖰',
  ī: '𑖱',
  u: '𑖲',
  ū: '𑖳',
  ṛ: '𑖴',
  ṝ: '𑖵',
  // Unicode Standard Ch. 15 (Siddham): U+115B6..U+115B7 are reserved;
  // post-consonantal vocalic ḷ / ḹ are represented as virāma + la + vocalic r/rr sign
  ḷ: '𑖿𑖩𑖴',
  ḹ: '𑖿𑖩𑖵',
  e: '𑖸',
  ai: '𑖹',
  o: '𑖺',
  au: '𑖻',
};

const SIDDHAM_CONSONANTS: Record<string, string> = {
  k: '𑖎',
  kh: '𑖏',
  g: '𑖐',
  gh: '𑖑',
  ṅ: '𑖒',
  c: '𑖓',
  ch: '𑖔',
  j: '𑖕',
  jh: '𑖖',
  ñ: '𑖗',
  ṭ: '𑖘',
  ṭh: '𑖙',
  ḍ: '𑖚',
  ḍh: '𑖛',
  ṇ: '𑖜',
  t: '𑖝',
  th: '𑖞',
  d: '𑖟',
  dh: '𑖠',
  n: '𑖡',
  p: '𑖢',
  ph: '𑖣',
  b: '𑖤',
  bh: '𑖥',
  m: '𑖦',
  y: '𑖧',
  r: '𑖨',
  l: '𑖩',
  v: '𑖪',
  ś: '𑖫',
  ṣ: '𑖬',
  s: '𑖭',
  h: '𑖮',
  ḻ: '𑖩',
};

const SIDDHAM_VIRAMA = '𑖿';

const DEVANAGARI_TO_IAST_VOWELS: Record<string, string> = Object.fromEntries(
  Object.entries(DEVANAGARI_INDEPENDENT_VOWELS).map(([iast, deva]) => [deva, iast])
);

const DEVANAGARI_TO_IAST_MATRAS: Record<string, string> = Object.fromEntries(
  Object.entries(DEVANAGARI_MATRAS)
    .filter(([, deva]) => deva.length > 0)
    .map(([iast, deva]) => [deva, iast])
);

const DEVANAGARI_TO_IAST_CONSONANTS: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(DEVANAGARI_CONSONANTS).map(([iast, deva]) => [deva, iast])
  ),
  ळ: 'ḷ',
  क़: 'k',
  ख़: 'kh',
  ग़: 'g',
  ज़: 'j',
  ड़: 'ḍ',
  ढ़: 'ḍh',
  फ़: 'ph',
};

const SIDDHAM_TO_IAST_VOWELS: Record<string, string> = Object.fromEntries(
  Object.entries(SIDDHAM_INDEPENDENT_VOWELS).map(([iast, sid]) => [sid, iast])
);

const SIDDHAM_TO_IAST_MATRAS: Record<string, string> = {
  '𑖯': 'ā',
  '𑖰': 'i',
  '𑖱': 'ī',
  '𑖲': 'u',
  '𑖳': 'ū',
  '𑖴': 'ṛ',
  '𑖵': 'ṝ',
  '𑖸': 'e',
  '𑖹': 'ai',
  '𑖺': 'o',
  '𑖻': 'au',
  '\u{115DC}': 'u',
  '\u{115DD}': 'ū',
};

const SIDDHAM_TO_IAST_CONSONANTS: Record<string, string> = Object.fromEntries(
  Object.entries(SIDDHAM_CONSONANTS)
    .filter(([iast]) => iast !== 'ḻ')
    .map(([iast, sid]) => [sid, iast])
);

/**
 * Convert embedded Devanāgarī script (U+0900..U+097F) to standard IAST
 */
export function devanagariToIast(text: string): string {
  const norm = text.normalize('NFC');
  let out = '';
  for (let i = 0; i < norm.length; i++) {
    const ch = norm[i];
    if (
      ch === '\u0951' ||
      ch === '\u0952' ||
      ch === '\u0953' ||
      ch === '\u0954' ||
      ch === '\u0970' ||
      ch === '\u200c' ||
      ch === '\u200d' ||
      (ch >= '\u0966' && ch <= '\u096F')
    ) {
      continue;
    }
    const next = norm[i + 1];
    if (DEVANAGARI_TO_IAST_CONSONANTS[ch]) {
      out += DEVANAGARI_TO_IAST_CONSONANTS[ch];
      if (next === DEVANAGARI_VIRAMA) {
        i++;
      } else if (next && DEVANAGARI_TO_IAST_MATRAS[next]) {
        out += DEVANAGARI_TO_IAST_MATRAS[next];
        i++;
      } else if (next === '\u093C') {
        // Combining Nukta followed by optional Virāma or Matra
        i++;
        const afterNukta = norm[i + 1];
        if (afterNukta === DEVANAGARI_VIRAMA) {
          i++;
        } else if (afterNukta && DEVANAGARI_TO_IAST_MATRAS[afterNukta]) {
          out += DEVANAGARI_TO_IAST_MATRAS[afterNukta];
          i++;
        } else {
          out += 'a';
        }
      } else {
        out += 'a';
      }
    } else if (DEVANAGARI_TO_IAST_VOWELS[ch]) {
      out += DEVANAGARI_TO_IAST_VOWELS[ch];
    } else if (ch === 'ं') {
      out += 'ṃ';
    } else if (ch === 'ः') {
      out += 'ḥ';
    } else if (ch === 'ँ') {
      out += 'm\u0310';
    } else if (ch === 'ऽ') {
      out += "'";
    } else if (ch === 'ॐ') {
      out += 'oṃ';
    } else if (ch === '॥') {
      out += ' || ';
    } else if (ch === '।') {
      out += ' | ';
    } else if (ch !== '\u093C' && ch !== DEVANAGARI_VIRAMA) {
      out += ch;
    }
  }
  return out;
}

/**
 * Convert embedded Siddhaṃ script (U+11580..U+115FF) to standard IAST
 */
export function siddhamToIast(text: string): string {
  const chars = Array.from(text);
  let out = '';
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const next = chars[i + 1];
    if (SIDDHAM_TO_IAST_CONSONANTS[ch]) {
      out += SIDDHAM_TO_IAST_CONSONANTS[ch];
      if (
        next === SIDDHAM_VIRAMA &&
        chars[i + 2] === '𑖩' &&
        (chars[i + 3] === '𑖴' || chars[i + 3] === '𑖵')
      ) {
        out += chars[i + 3] === '𑖴' ? 'ḷ' : 'ḹ';
        i += 3;
        continue;
      }
      if (next === SIDDHAM_VIRAMA) {
        i++;
      } else if (next && SIDDHAM_TO_IAST_MATRAS[next]) {
        out += SIDDHAM_TO_IAST_MATRAS[next];
        i++;
      } else {
        out += 'a';
      }
    } else if (SIDDHAM_TO_IAST_VOWELS[ch]) {
      out += SIDDHAM_TO_IAST_VOWELS[ch];
    } else if (ch === '𑖼') {
      out += 'm\u0310';
    } else if (ch === '𑖽') {
      out += 'ṃ';
    } else if (ch === '𑖾') {
      out += 'ḥ';
    } else if (ch === '𑗃') {
      out += ' || ';
    } else if (ch === '𑗂') {
      out += ' | ';
    } else {
      const cp = ch.codePointAt(0) ?? 0;
      if (cp < 0x11580 || cp > 0x115ff) {
        out += ch;
      }
    }
  }
  return out;
}

const IPA_MAP: Record<string, string> = {
  a: 'ɐ',
  ā: 'ɑː',
  i: 'ɪ',
  ī: 'iː',
  u: 'ʊ',
  ū: 'uː',
  ṛ: 'r̩',
  ṝ: 'r̩ː',
  ḷ: 'l̩',
  ḹ: 'l̩ː',
  e: 'eː',
  ai: 'ɐi̯',
  o: 'oː',
  au: 'ɐu̯',
  k: 'k',
  kh: 'kʰ',
  g: 'ɡ',
  gh: 'ɡʱ',
  ṅ: 'ŋ',
  c: 't͡ɕ',
  ch: 't͡ɕʰ',
  j: 'd͡ʑ',
  jh: 'd͡ʑʱ',
  ñ: 'ɲ',
  ṭ: 'ʈ',
  ṭh: 'ʈʰ',
  ḍ: 'ɖ',
  ḍh: 'ɖʱ',
  ṇ: 'ɳ',
  t: 't̪',
  th: 't̪ʰ',
  d: 'd̪',
  dh: 'd̪ʱ',
  n: 'n̪',
  p: 'p',
  ph: 'pʰ',
  b: 'b',
  bh: 'bʱ',
  m: 'm',
  y: 'j',
  r: 'ɾ',
  l: 'l',
  v: 'ʋ',
  ś: 'ɕ',
  ṣ: 'ʂ',
  s: 's',
  h: 'ɦ',
  ḻ: 'ɭ',
  ṃ: 'm̃',
  ṁ: 'm̃',
  ḥ: 'h',
};

/**
 * Clean GRETIL / SARIT / manuscript editorial brackets & apparatus while normalizing
 * embedded Devanāgarī / Siddhaṃ / Candrabindu (`m̐`, `U+0310`) into pure Sanskrit IAST.
 */
export function cleanEditorialIast(raw: string): string {
  if (!raw) return '';
  let s = raw.normalize('NFC').replace(/[\x00-\x1f\x7f\u00AD]/g, ' ');

  if (/[\u0900-\u097F]/.test(s)) {
    s = s.replace(/[\u0900-\u097F\u200c\u200d]+/g, (m) => devanagariToIast(m));
  }
  if (/[\u{11580}-\u{115FF}]/u.test(s)) {
    s = s.replace(/[\u{11580}-\u{115FF}]+/gu, (m) => siddhamToIast(m));
  }

  // Canonicalize Candrabindu (`m̐`, `ṃ̐`, `ṁ̐`, `ँ`, or post-vocalic `\u0310` as in `hū̐`)
  if (/[\u0310\u0901]/.test(s)) {
    s = s.replace(/(?:[mṃṁ]\u0310|\u0901|\u0310)/gi, 'm\u0310');
  }

  return s
    .replace(/\\var\{[^}]*(?:\}|$)/g, '')
    .replace(/\\[A-Za-z]+\s*\}?/g, '')
    .replace(/\{\\[^}\s]*\}?/g, '')
    .replace(/<<[^>]*>>/g, '')
    .replace(/@[^@]*@@/g, '')
    .replace(/〚[^〛]*〛/g, '')
    .replace(/\bCMP\d+\.\d+\/?/g, '')
    .replace(/\(?\b[A-Z][A-Za-z0-9]{1,8}_\d+(?:\.\d+)*\b\)?/g, '')
    .replace(
      /\[(?:\s*\d+[rv]\d*\s*|\s*fol\.[^\]]*|\s*p\.[^\]]*|\s*missing\b[^\]]*|\s*lacuna\b[^\]]*|\s*explicit\b[^\]]*|\s*illegible\b[^\]]*|\s*\?+\s*|\s*\.+\s*)\]/gi,
      ''
    )
    .replace(/ñ\d+\.\d+/g, '')
    .replace(/\[([^\]]*)\]/g, '$1')
    .replace(/\{([^}]*)\}/g, '')
    .replace(/<([^>]*)>/g, '$1')
    .replace(
      /(^|[^|/\d\s]\s+|\s+)([a-zA-Zāīūṛṝḷḹēōṃṁḥṅñṭḍṇśṣ']{2,})\s+2(?=\s*(?:[|/,;.]|$|\s+[a-zA-Zāīūṛṝḷḹēōṃṁḥṅñṭḍṇśṣ]))/g,
      '$1$2 $2'
    )
    .replace(/[@#*+$^&%=_\\§"“”«»]/g, ' ')
    .replace(/[ōŌ]/g, 'o')
    .replace(/[ēĒ]/g, 'e')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeForeignSanskritLoans(lowerIast: string): string {
  return lowerIast
    .replace(/ḷ(?=[aāiīuūṛṝeaoēō])/g, 'ḻ')
    .replace(/ö/g, 'o')
    .replace(/ä/g, 'a')
    .replace(/ù/g, 'u')
    .replace(/ź/g, 'ś')
    .replace(/ń/g, 'ṅ')
    .replace(/dz/g, 'j')
    .replace(/f/g, 'ph')
    .replace(/w/g, 'v')
    .replace(/z/g, 'j')
    .replace(/q/g, 'k')
    .replace(/x/g, 'kṣ');
}

/**
 * Convert IAST string to Devanāgarī script
 */
export function iastToDevanagari(rawInput: string): string {
  const input = normalizeForeignSanskritLoans(cleanEditorialIast(rawInput).toLowerCase());
  let out = '';
  let i = 0;
  let afterConsonant = false;

  while (i < input.length) {
    // Sacred Om ligature at word boundary
    const prevChar = i === 0 ? ' ' : input[i - 1];
    const rest = input.slice(i);
    if (/[\s|/.,;!-]/.test(prevChar)) {
      const omMatch = rest.match(/^(om\u0310|oṃ|oṁ|om)(?=[\s|/.,;!-]|$)/);
      if (omMatch) {
        out += 'ॐ';
        i += omMatch[0].length;
        afterConsonant = false;
        continue;
      }
    }

    // Punctuation & Dandas
    if (rest.startsWith('||') || rest.startsWith('//')) {
      if (afterConsonant) {
        out += DEVANAGARI_VIRAMA;
        afterConsonant = false;
      }
      out += '॥';
      i += 2;
      continue;
    }
    if (rest.startsWith('|') || rest.startsWith('/')) {
      if (afterConsonant) {
        out += DEVANAGARI_VIRAMA;
        afterConsonant = false;
      }
      out += '।';
      i += 1;
      continue;
    }

    // Avagraha
    if (rest[0] === "'" || rest[0] === '’') {
      if (afterConsonant) {
        out += DEVANAGARI_VIRAMA;
        afterConsonant = false;
      }
      out += 'ऽ';
      i += 1;
      continue;
    }

    // Candrabindu (`m̐`), Anusvāra (`ṃ`/`ṁ`), & Visarga (`ḥ`)
    if (rest.startsWith('m\u0310')) {
      afterConsonant = false;
      out += 'ँ';
      i += 2;
      continue;
    }
    if (rest[0] === 'ṃ' || rest[0] === 'ṁ') {
      afterConsonant = false;
      out += 'ं';
      i += 1;
      continue;
    }
    if (rest[0] === 'ḥ') {
      afterConsonant = false;
      out += 'ः';
      i += 1;
      continue;
    }

    // Check Vowels
    let matchedVowel: string | null = null;
    for (const v of VOWEL_TOKENS) {
      if (rest.startsWith(v)) {
        matchedVowel = v;
        break;
      }
    }
    if (matchedVowel) {
      if (afterConsonant) {
        out += DEVANAGARI_MATRAS[matchedVowel];
        afterConsonant = false;
      } else {
        out += DEVANAGARI_INDEPENDENT_VOWELS[matchedVowel];
      }
      i += matchedVowel.length;
      continue;
    }

    // Check Consonants
    let matchedConsonant: string | null = null;
    for (const c of CONSONANT_TOKENS) {
      if (rest.startsWith(c)) {
        matchedConsonant = c;
        break;
      }
    }
    if (matchedConsonant) {
      if (afterConsonant) {
        out += DEVANAGARI_VIRAMA;
      }
      out += DEVANAGARI_CONSONANTS[matchedConsonant];
      afterConsonant = true;
      i += matchedConsonant.length;
      continue;
    }

    // Whitespace or other character
    if (afterConsonant) {
      out += DEVANAGARI_VIRAMA;
      afterConsonant = false;
    }
    out += rest[0];
    i += 1;
  }

  if (afterConsonant) {
    out += DEVANAGARI_VIRAMA;
  }

  return out;
}

/**
 * Convert IAST string to Siddhaṃ script (Unicode U+11580..U+115FF).
 * Every emitted codepoint is strictly within NotoSansSiddham-Regular.woff2's mapped cmap
 * (`U+11580..U+115B5`, `U+115B8..U+115DD`, and `U+0020` space), guaranteeing zero `.notdef` tofu boxes.
 */
export function iastToSiddham(rawInput: string): string {
  const input = normalizeForeignSanskritLoans(cleanEditorialIast(rawInput).toLowerCase());
  let out = '';
  let i = 0;
  let afterConsonant = false;

  while (i < input.length) {
    const rest = input.slice(i);

    // Punctuation & Siddham Dandas
    if (rest.startsWith('||') || rest.startsWith('//')) {
      if (afterConsonant) {
        out += SIDDHAM_VIRAMA;
        afterConsonant = false;
      }
      out += ' 𑗃 ';
      i += 2;
      continue;
    }
    if (rest.startsWith('|') || rest.startsWith('/')) {
      if (afterConsonant) {
        out += SIDDHAM_VIRAMA;
        afterConsonant = false;
      }
      out += ' 𑗂 ';
      i += 1;
      continue;
    }

    // Avagraha (silent elision in Siddhaṃ orthography)
    if (rest[0] === "'" || rest[0] === '’') {
      if (afterConsonant) {
        out += SIDDHAM_VIRAMA;
        afterConsonant = false;
      }
      i += 1;
      continue;
    }

    // Candrabindu (`m̐` -> U+115BC 𑖼), Anusvāra (`ṃ`/`ṁ` -> U+115BD 𑖽), & Visarga (`ḥ` -> U+115BE 𑖾)
    if (rest.startsWith('m\u0310')) {
      afterConsonant = false;
      out += '𑖼';
      i += 2;
      continue;
    }
    if (rest[0] === 'ṃ' || rest[0] === 'ṁ') {
      afterConsonant = false;
      out += '𑖽';
      i += 1;
      continue;
    }
    if (rest[0] === 'ḥ') {
      afterConsonant = false;
      out += '𑖾';
      i += 1;
      continue;
    }

    // Vowels
    let matchedVowel: string | null = null;
    for (const v of VOWEL_TOKENS) {
      if (rest.startsWith(v)) {
        matchedVowel = v;
        break;
      }
    }
    if (matchedVowel) {
      if (afterConsonant) {
        out += SIDDHAM_MATRAS[matchedVowel];
        afterConsonant = false;
      } else {
        out += SIDDHAM_INDEPENDENT_VOWELS[matchedVowel];
      }
      i += matchedVowel.length;
      continue;
    }

    // Consonants
    let matchedConsonant: string | null = null;
    for (const c of CONSONANT_TOKENS) {
      if (rest.startsWith(c)) {
        matchedConsonant = c;
        break;
      }
    }
    if (matchedConsonant) {
      if (afterConsonant) {
        out += SIDDHAM_VIRAMA;
      }
      out += SIDDHAM_CONSONANTS[matchedConsonant];
      afterConsonant = true;
      i += matchedConsonant.length;
      continue;
    }

    // Word/compound separators, punctuation, or unmapped characters -> close virāma & emit clean space
    if (afterConsonant) {
      out += SIDDHAM_VIRAMA;
      afterConsonant = false;
    }
    out += ' ';
    i += 1;
  }

  if (afterConsonant) {
    out += SIDDHAM_VIRAMA;
  }

  return out.replace(/\s+/g, ' ').trim();
}

/**
 * Convert IAST string to International Phonetic Alphabet (IPA)
 */
export function iastToIpa(rawInput: string): string {
  const input = cleanEditorialIast(rawInput)
    .toLowerCase()
    .replace(/ḷ(?=[aāiīuūṛṝeaoēō])/g, 'ḻ');
  let out = '';
  let i = 0;

  while (i < input.length) {
    const rest = input.slice(i);

    if (rest.startsWith('||') || rest.startsWith('//')) {
      out += ' ‖ ';
      i += 2;
      continue;
    }
    if (rest.startsWith('|') || rest.startsWith('/')) {
      out += ' | ';
      i += 1;
      continue;
    }

    if (rest[0] === "'" || rest[0] === '’') {
      i += 1;
      continue;
    }

    const isCandrabindu = rest.startsWith('m\u0310');
    if (isCandrabindu || rest[0] === 'ṃ' || rest[0] === 'ṁ') {
      const stepLen = isCandrabindu ? 2 : 1;
      // Context-sensitive Pāṇinian Anusvāra assimilation (parasavarṇa)
      const lookahead = rest.slice(stepLen).replace(/^[\s\-—–']+/g, '');
      let nextCons: string | null = null;
      for (const c of CONSONANT_TOKENS) {
        if (lookahead.startsWith(c)) {
          nextCons = c;
          break;
        }
      }
      const prevSlice = input.slice(Math.max(0, i - 4), i);
      const isLabialBija = /(^|[\s|/.,;!-])(o|hū|hu|bhrū|bhru|trū|ṭrū)$/.test(prevSlice);

      if (isLabialBija && !nextCons) {
        out += 'm';
      } else if (nextCons && ['k', 'kh', 'g', 'gh', 'ṅ'].includes(nextCons)) {
        out += 'ŋ';
      } else if (nextCons && ['c', 'ch', 'j', 'jh', 'ñ'].includes(nextCons)) {
        out += 'ɲ';
      } else if (nextCons && ['ṭ', 'ṭh', 'ḍ', 'ḍh', 'ṇ'].includes(nextCons)) {
        out += 'ɳ';
      } else if (nextCons && ['t', 'th', 'd', 'dh', 'n'].includes(nextCons)) {
        out += 'n̪';
      } else if (nextCons && ['p', 'ph', 'b', 'bh', 'm'].includes(nextCons)) {
        out += 'm';
      } else {
        out += 'm̃';
      }
      i += stepLen;
      continue;
    }

    let matched: string | null = null;
    for (const v of VOWEL_TOKENS) {
      if (rest.startsWith(v)) {
        matched = v;
        break;
      }
    }
    if (!matched) {
      for (const c of CONSONANT_TOKENS) {
        if (rest.startsWith(c)) {
          matched = c;
          break;
        }
      }
    }
    if (!matched && rest[0] === 'ḥ') {
      matched = 'ḥ';
    }

    if (matched && IPA_MAP[matched]) {
      out += IPA_MAP[matched];
      i += matched.length;
      continue;
    }

    out += rest[0];
    i += 1;
  }

  return out.replace(/\s+/g, ' ').trim();
}

/**
 * Strip diacritics for fuzzy / diacritic-insensitive search
 */
export function stripDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Sanskrit & Siddhaṃ Varṇamālā (50-Letter Canonical Alphabet Matrix)
 * Used in the Phonetics & Siddhaṃ Academy module
 */
export interface VarnamalaLetter {
  iast: string;
  devanagari: string;
  siddham: string;
  ipa: string;
  tangTranslitZh: string;
  articulationPlaceZh: string;
  articulationMethodZh: string;
  bijaMeaningZh: string;
}

export const SIDDHAM_VARNAMALA_VOWELS: VarnamalaLetter[] = [
  { iast: 'a', devanagari: 'अ', siddham: '𑖀', ipa: 'ɐ', tangTranslitZh: '阿 (短)', articulationPlaceZh: '喉音 (Kaṇṭhya)', articulationMethodZh: '短元音 (Hrasva · 1拍)', bijaMeaningZh: '本不生际，一切法本初门' },
  { iast: 'ā', devanagari: 'आ', siddham: '𑖁', ipa: 'ɑː', tangTranslitZh: '阿 (长引)', articulationPlaceZh: '喉音 (Kaṇṭhya)', articulationMethodZh: '长元音 (Dīrgha · 2拍)', bijaMeaningZh: '远离诸法寂静行相门' },
  { iast: 'i', devanagari: 'इ', siddham: '𑖂', ipa: 'ɪ', tangTranslitZh: '伊 (短)', articulationPlaceZh: '腭音 (Tālavya)', articulationMethodZh: '短元音 (Hrasva · 1拍)', bijaMeaningZh: '诸法根不可得门' },
  { iast: 'ī', devanagari: 'ई', siddham: '𑖃', ipa: 'iː', tangTranslitZh: '伊 (长引)', articulationPlaceZh: '腭音 (Tālavya)', articulationMethodZh: '长元音 (Dīrgha · 2拍)', bijaMeaningZh: '定慧自在清净门' },
  { iast: 'u', devanagari: 'उ', siddham: '𑖄', ipa: 'ʊ', tangTranslitZh: '坞 (短)', articulationPlaceZh: '唇音 (Oṣṭhya)', articulationMethodZh: '短元音 (Hrasva · 1拍)', bijaMeaningZh: '譬喻不可得门' },
  { iast: 'ū', devanagari: 'ऊ', siddham: '𑖅', ipa: 'uː', tangTranslitZh: '污 (长引)', articulationPlaceZh: '唇音 (Oṣṭhya)', articulationMethodZh: '长元音 (Dīrgha · 2拍)', bijaMeaningZh: '损减不可得门' },
  { iast: 'ṛ', devanagari: 'ऋ', siddham: '𑖆', ipa: 'r̩', tangTranslitZh: '哩 (弹舌短)', articulationPlaceZh: '顶音/卷舌 (Mūrdhanya)', articulationMethodZh: '卷舌成音节元音 (1拍)', bijaMeaningZh: '神通变化远离门' },
  { iast: 'ṝ', devanagari: 'ॠ', siddham: '𑖇', ipa: 'r̩ː', tangTranslitZh: '哩 (弹舌长)', articulationPlaceZh: '顶音/卷舌 (Mūrdhanya)', articulationMethodZh: '长卷舌元音 (2拍)', bijaMeaningZh: '类例不可得门' },
  { iast: 'ḷ', devanagari: 'ऌ', siddham: '𑖈', ipa: 'l̩', tangTranslitZh: '里 (边音短)', articulationPlaceZh: '齿音 (Dantya)', articulationMethodZh: '齿边成音节元音 (1拍)', bijaMeaningZh: '一切法相染着不可得门' },
  { iast: 'ḹ', devanagari: 'ॡ', siddham: '𑖉', ipa: 'l̩ː', tangTranslitZh: '里 (边音长)', articulationPlaceZh: '齿音 (Dantya)', articulationMethodZh: '长齿边成音节元音 (2拍)', bijaMeaningZh: '世间流转相断灭门' },
  { iast: 'e', devanagari: 'ए', siddham: '𑖊', ipa: 'eː', tangTranslitZh: '翳 (长)', articulationPlaceZh: '喉腭合音 (Kaṇṭhatālavya)', articulationMethodZh: '复合长元音 (Guṇa · 2拍)', bijaMeaningZh: '求不可得门' },
  { iast: 'ai', devanagari: 'ऐ', siddham: '𑖋', ipa: 'ɐi̯', tangTranslitZh: '爱 (二合长)', articulationPlaceZh: '喉腭合音 (Kaṇṭhatālavya)', articulationMethodZh: '强化复合元音 (Vṛddhi · 2拍)', bijaMeaningZh: '大威德自在门' },
  { iast: 'o', devanagari: 'ओ', siddham: '𑖌', ipa: 'oː', tangTranslitZh: '污/奥 (长)', articulationPlaceZh: '喉唇合音 (Kaṇṭhoṣṭhya)', articulationMethodZh: '复合长元音 (Guṇa · 2拍)', bijaMeaningZh: '瀑流远离门' },
  { iast: 'au', devanagari: 'औ', siddham: '𑖍', ipa: 'ɐu̯', tangTranslitZh: '奥 (二合长)', articulationPlaceZh: '喉唇合音 (Kaṇṭhoṣṭhya)', articulationMethodZh: '强化复合元音 (Vṛddhi · 2拍)', bijaMeaningZh: '化生不可得门' },
  { iast: 'aṃ', devanagari: 'अं', siddham: '𑖀𑖽', ipa: 'ɐm̃', tangTranslitZh: '暗 (空点)', articulationPlaceZh: '鼻音随韵 (Anusvāra)', articulationMethodZh: '菩提点 U+115BD · 重音 (Guru)', bijaMeaningZh: '发菩提心究竟空性门' },
  { iast: 'am̐', devanagari: 'अँ', siddham: '𑖀𑖼', ipa: 'ɐ̃', tangTranslitZh: '仰月空点', articulationPlaceZh: '鼻化仰月点 (Candrabindu)', articulationMethodZh: '大空智点 U+115BC · 重音 (Guru)', bijaMeaningZh: '大空智月轮摄持一切三昧门' },
  { iast: 'aḥ', devanagari: 'अः', siddham: '𑖀𑖾', ipa: 'ɐh', tangTranslitZh: '恶 (涅槃点)', articulationPlaceZh: '喉擦止韵 (Visarga)', articulationMethodZh: '涅槃点 U+115BE · 重音 (Guru)', bijaMeaningZh: '大般涅槃寂灭门' },
];

export interface VargaRow {
  vargaNameZh: string;
  vargaNameSanskrit: string;
  placeZh: string;
  letters: VarnamalaLetter[];
}

export const SIDDHAM_CONSONANT_VARGAS: VargaRow[] = [
  {
    vargaNameZh: '牙音/喉音部 (迦字门)',
    vargaNameSanskrit: 'Ka-varga (Kaṇṭhya)',
    placeZh: '舌根抵软腭 (Velar)',
    letters: [
      { iast: 'ka', devanagari: 'क', siddham: '𑖎', ipa: 'kɐ', tangTranslitZh: '迦', articulationPlaceZh: '喉/软腭', articulationMethodZh: '清不送气', bijaMeaningZh: '一切法作业不可得 (Kārya)' },
      { iast: 'kha', devanagari: 'ख', siddham: '𑖏', ipa: 'kʰɐ', tangTranslitZh: '佉', articulationPlaceZh: '喉/软腭', articulationMethodZh: '清送气 (Mahāprāṇa)', bijaMeaningZh: '一切法等虚空不可得 (Kha)' },
      { iast: 'ga', devanagari: 'ग', siddham: '𑖐', ipa: 'ɡɐ', tangTranslitZh: '誐', articulationPlaceZh: '喉/软腭', articulationMethodZh: '浊不送气 (Ghoṣavat)', bijaMeaningZh: '一切法行不可得 (Gati)' },
      { iast: 'gha', devanagari: 'घ', siddham: '𑖑', ipa: 'ɡʱɐ', tangTranslitZh: '伽', articulationPlaceZh: '喉/软腭', articulationMethodZh: '浊送气 (気息音)', bijaMeaningZh: '一切法合集不可得 (Ghana)' },
      { iast: 'ṅa', devanagari: 'ङ', siddham: '𑖒', ipa: 'ŋɐ', tangTranslitZh: '仰', articulationPlaceZh: '喉/软腭', articulationMethodZh: '鼻音 (Anunāsika)', bijaMeaningZh: '一切法支分不可得 (Aṅga)' },
    ],
  },
  {
    vargaNameZh: '齿龈硬腭部 (遮字门)',
    vargaNameSanskrit: 'Ca-varga (Tālavya)',
    placeZh: '舌面抵硬腭 (Palatal)',
    letters: [
      { iast: 'ca', devanagari: 'च', siddham: '𑖓', ipa: 't͡ɕɐ', tangTranslitZh: '遮', articulationPlaceZh: '硬腭', articulationMethodZh: '清不送气', bijaMeaningZh: '一切法离一切迁变 (Cyuti)' },
      { iast: 'cha', devanagari: 'छ', siddham: '𑖔', ipa: 't͡ɕʰɐ', tangTranslitZh: '车', articulationPlaceZh: '硬腭', articulationMethodZh: '清送气', bijaMeaningZh: '一切法影像不可得 (Chāyā)' },
      { iast: 'ja', devanagari: 'ज', siddham: '𑖕', ipa: 'd͡ʑɐ', tangTranslitZh: '惹', articulationPlaceZh: '硬腭', articulationMethodZh: '浊不送气', bijaMeaningZh: '一切法生不可得 (Jāti)' },
      { iast: 'jha', devanagari: 'झ', siddham: '𑖖', ipa: 'd͡ʑʱɐ', tangTranslitZh: '社', articulationPlaceZh: '硬腭', articulationMethodZh: '浊送气', bijaMeaningZh: '一切法战敌不可得 (Jhamalla)' },
      { iast: 'ña', devanagari: 'ञ', siddham: '𑖗', ipa: 'ɲɐ', tangTranslitZh: '若', articulationPlaceZh: '硬腭', articulationMethodZh: '鼻音', bijaMeaningZh: '一切法智不可得 (Jñāna)' },
    ],
  },
  {
    vargaNameZh: '顶音/卷舌部 (吒字门)',
    vargaNameSanskrit: 'Ṭa-varga (Mūrdhanya)',
    placeZh: '舌尖卷起抵上颚顶 (Retroflex)',
    letters: [
      { iast: 'ṭa', devanagari: 'ट', siddham: '𑖘', ipa: 'ʈɐ', tangTranslitZh: '吒', articulationPlaceZh: '上颚顶', articulationMethodZh: '卷舌清不送气', bijaMeaningZh: '一切法慢不可得 (Ṭaṅka)' },
      { iast: 'ṭha', devanagari: 'ठ', siddham: '𑖙', ipa: 'ʈʰɐ', tangTranslitZh: '侘', articulationPlaceZh: '上颚顶', articulationMethodZh: '卷舌清送气', bijaMeaningZh: '一切法长养不可得 (Viṭhapana)' },
      { iast: 'ḍa', devanagari: 'ड', siddham: '𑖚', ipa: 'ɖɐ', tangTranslitZh: '拏', articulationPlaceZh: '上颚顶', articulationMethodZh: '卷舌浊不送气', bijaMeaningZh: '一切法怨对不可得 (Ḍamara)' },
      { iast: 'ḍha', devanagari: 'ढ', siddham: '𑖛', ipa: 'ɖʱɐ', tangTranslitZh: '茶', articulationPlaceZh: '上颚顶', articulationMethodZh: '卷舌浊送气', bijaMeaningZh: '一切法执持不可得' },
      { iast: 'ṇa', devanagari: 'ण', siddham: '𑖜', ipa: 'ɳɐ', tangTranslitZh: '拏 (鼻)', articulationPlaceZh: '上颚顶', articulationMethodZh: '卷舌鼻音', bijaMeaningZh: '一切法诤不可得 (Raṇa)' },
    ],
  },
  {
    vargaNameZh: '舌音/齿音部 (多字门)',
    vargaNameSanskrit: 'Ta-varga (Dantya)',
    placeZh: '舌尖抵上齿背 (Dental)',
    letters: [
      { iast: 'ta', devanagari: 'त', siddham: '𑖝', ipa: 't̪ɐ', tangTranslitZh: '多/怛', articulationPlaceZh: '上齿背', articulationMethodZh: '齿清不送气', bijaMeaningZh: '一切法如如不可得 (Tathatā)' },
      { iast: 'tha', devanagari: 'थ', siddham: '𑖞', ipa: 't̪ʰɐ', tangTranslitZh: '他', articulationPlaceZh: '上齿背', articulationMethodZh: '齿清送气', bijaMeaningZh: '一切法住处不可得 (Sthāna)' },
      { iast: 'da', devanagari: 'द', siddham: '𑖟', ipa: 'd̪ɐ', tangTranslitZh: '娜/达', articulationPlaceZh: '上齿背', articulationMethodZh: '齿浊不送气', bijaMeaningZh: '一切法施不可得 (Dāna)' },
      { iast: 'dha', devanagari: 'ध', siddham: '𑖠', ipa: 'd̪ʱɐ', tangTranslitZh: '陀/驮', articulationPlaceZh: '上齿背', articulationMethodZh: '齿浊送气', bijaMeaningZh: '一切法法界不可得 (Dharma)' },
      { iast: 'na', devanagari: 'न', siddham: '𑖡', ipa: 'n̪ɐ', tangTranslitZh: '曩/那', articulationPlaceZh: '上齿背', articulationMethodZh: '齿鼻音', bijaMeaningZh: '一切法名相不可得 (Nāma)' },
    ],
  },
  {
    vargaNameZh: '唇音部 (波字门)',
    vargaNameSanskrit: 'Pa-varga (Oṣṭhya)',
    placeZh: '双唇闭合 (Labial)',
    letters: [
      { iast: 'pa', devanagari: 'प', siddham: '𑖢', ipa: 'pɐ', tangTranslitZh: '波/钵', articulationPlaceZh: '双唇', articulationMethodZh: '唇清不送气', bijaMeaningZh: '一切法第一义谛不可得 (Paramārtha)' },
      { iast: 'pha', devanagari: 'फ', siddham: '𑖣', ipa: 'pʰɐ', tangTranslitZh: '颇/发', articulationPlaceZh: '双唇', articulationMethodZh: '唇清送气', bijaMeaningZh: '一切法不坚如聚沫 (Phena)' },
      { iast: 'ba', devanagari: 'ब', siddham: '𑖤', ipa: 'bɐ', tangTranslitZh: '么/跋', articulationPlaceZh: '双唇', articulationMethodZh: '唇浊不送气', bijaMeaningZh: '一切法缚不可得 (Bandhana)' },
      { iast: 'bha', devanagari: 'भ', siddham: '𑖥', ipa: 'bʱɐ', tangTranslitZh: '婆/薄', articulationPlaceZh: '双唇', articulationMethodZh: '唇浊送气', bijaMeaningZh: '一切法有不可得 (Bhava)' },
      { iast: 'ma', devanagari: 'म', siddham: '𑖦', ipa: 'mɐ', tangTranslitZh: '摩/莽', articulationPlaceZh: '双唇', articulationMethodZh: '唇鼻音', bijaMeaningZh: '一切法吾我不可得 (Mama)' },
    ],
  },
  {
    vargaNameZh: '半元音与擦音遍口部 (也/奢字门)',
    vargaNameSanskrit: 'Antaḥstha & Ūṣman',
    placeZh: '硬腭 · 卷舌 · 齿 · 唇齿 · 声门',
    letters: [
      { iast: 'ya', devanagari: 'य', siddham: '𑖧', ipa: 'jɐ', tangTranslitZh: '野/耶', articulationPlaceZh: '硬腭', articulationMethodZh: '半元音 (Antaḥstha)', bijaMeaningZh: '一切法乘不可得 (Yāna)' },
      { iast: 'ra', devanagari: 'र', siddham: '𑖨', ipa: 'ɾɐ', tangTranslitZh: '啰 (弹舌)', articulationPlaceZh: '上颚闪音', articulationMethodZh: '半元音 · 唐注「转舌呼」', bijaMeaningZh: '一切法离诸尘染 (Rajas)' },
      { iast: 'la', devanagari: 'ल', siddham: '𑖩', ipa: 'lɐ', tangTranslitZh: '逻', articulationPlaceZh: '齿边音', articulationMethodZh: '半元音', bijaMeaningZh: '一切法相不可得 (Lakṣaṇa)' },
      { iast: 'va', devanagari: 'व', siddham: '𑖪', ipa: 'ʋɐ', tangTranslitZh: '嚩 (无可反)', articulationPlaceZh: '唇齿近音', articulationMethodZh: '半元音', bijaMeaningZh: '一切法语言道断 (Vāc)' },
      { iast: 'śa', devanagari: 'श', siddham: '𑖫', ipa: 'ɕɐ', tangTranslitZh: '奢/舍', articulationPlaceZh: '硬腭擦音', articulationMethodZh: '舌面清擦音 (似汉语 x)', bijaMeaningZh: '一切法本性寂静 (Śānti)' },
      { iast: 'ṣa', devanagari: 'ष', siddham: '𑖬', ipa: 'ʂɐ', tangTranslitZh: '沙/瑟', articulationPlaceZh: '卷舌擦音', articulationMethodZh: '卷舌清擦音 (似汉语 sh)', bijaMeaningZh: '一切法性钝无执 (Ṣaḍ)' },
      { iast: 'sa', devanagari: 'स', siddham: '𑖭', ipa: 'sɐ', tangTranslitZh: '娑/萨', articulationPlaceZh: '齿擦音', articulationMethodZh: '舌尖清擦音 (似汉语 s)', bijaMeaningZh: '一切法一切谛不可得 (Satya)' },
      { iast: 'ha', devanagari: 'ह', siddham: '𑖮', ipa: 'ɦɐ', tangTranslitZh: '贺/诃', articulationPlaceZh: '喉浊擦音', articulationMethodZh: '带音喉擦音', bijaMeaningZh: '一切法因不可得 (Hetu)' },
    ],
  },
];
