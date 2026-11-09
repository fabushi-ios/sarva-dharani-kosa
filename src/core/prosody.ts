/**
 * src/core/prosody.ts
 * 3-Pass Sanskrit Akṣara Syllabifier, Anusvāra/Visarga Sandhi & Chandas Guru/Laghu Meter Analyzer
 * Ported from sanskrit_phonetic_engine.html (Module 3, lines 646–1025)
 */

import type { SyllableAnalysis, LineAnalysis } from '../types/dharani';
import {
  inputToSlp1,
  slp1ToIast,
  slp1ToDevanagari,
  slp1ToSiddhamUnicode,
  slp1ToIpa,
  type InputMode
} from './transliterator';
import {
  VOWEL_MAP,
  CONS_MATRIX,
  VOWEL_INDEX,
  LONG_VOWELS,
  INHERENT_LONG_VOWELS,
  SYLLABLE_OVERRIDES,
  TRAD_WORD_REPLACEMENTS
} from '../data/siddhamMatrix';

export type { SyllableAnalysis, LineAnalysis };

const VOWEL_SET = new Set('aAiIuUfFxXeEoO'.split(''));
const CONS_SET = new Set(Object.keys(CONS_MATRIX));
const MOD_SET = new Set(['M', 'H', '~']);

export const VALID_ONSET_PAIRS = new Set([
  'pr', 'br', 'tr', 'dr', 'kr', 'gr', 'Sr', 'zr', 'sr', 'Pl', 'kl', 'gl', 'Sl',
  'sv', 'tv', 'dv', 'kv', 'gv', 'zv', 'Sv',
  'ky', 'gy', 'py', 'by', 'vy', 'ty', 'Dy', 'Sy', 'zy', 'sy', 'hy', 'jy', 'cy',
  'kz', 'jY', 'zw', 'zW', 'st', 'sT', 'sp', 'sP', 'sk', 'sK', 'sm', 'sn'
]);

export interface RawSyllableToken {
  onset?: string;
  vowel?: string;
  mod?: string;
  coda?: string;
  isOm?: boolean;
  symbol?: string;
}

export interface ParsedWordSyllable {
  raw: string;
  m: string;
  t: string;
  meter: '—' | '⏑' | '';
  varga: string;
  note: string;
  sandhiNotes: string[];
  bijaMeaning?: string;
  isSymbol?: boolean;
}

export interface ProsodyOptions {
  mode?: InputMode;
  assimilate?: boolean;
  longMarkSymbol?: string;
}

/**
 * 3-Pass Sanskrit Akṣara Tokenizer (`syllabifySlp1Word`)
 */
export function syllabifySlp1Word(slpWord: string): RawSyllableToken[] {
  const rawTokens: RawSyllableToken[] = [];
  let i = 0;
  const n = slpWord.length;

  // Pass 1: Group (onset, vowel, mod) or standalone oM / punctuation symbols
  while (i < n) {
    if (
      slpWord.slice(i, i + 2) === 'oM' &&
      (i === 0 || !CONS_SET.has(slpWord[i - 1])) &&
      (i + 2 === n || !VOWEL_SET.has(slpWord[i + 2]))
    ) {
      rawTokens.push({ onset: '', vowel: 'o', mod: 'M', coda: '', isOm: true });
      i += 2;
      continue;
    }

    let consCluster = '';
    while (i < n && CONS_SET.has(slpWord[i])) {
      consCluster += slpWord[i];
      i++;
    }

    let vowel = '';
    if (i < n && VOWEL_SET.has(slpWord[i])) {
      vowel = slpWord[i];
      i++;
    }

    let mod = '';
    while (i < n && MOD_SET.has(slpWord[i])) {
      mod += slpWord[i];
      i++;
    }

    if (!consCluster && !vowel && !mod) {
      const sym = slpWord[i];
      rawTokens.push({ symbol: sym });
      i++;
      continue;
    }

    rawTokens.push({ onset: consCluster, vowel, mod, coda: '' });
  }

  // Pass 2: Merge word-final vowelless consonant clusters into preceding syllable's coda
  const merged: RawSyllableToken[] = [];
  for (let idx = 0; idx < rawTokens.length; idx++) {
    const cur = rawTokens[idx];
    if (cur.symbol !== undefined) {
      merged.push(cur);
      continue;
    }
    if (cur.onset && !cur.vowel && !cur.mod && merged.length > 0) {
      const prev = merged[merged.length - 1];
      if (prev && prev.vowel && !prev.mod && !prev.isOm) {
        prev.coda = (prev.coda || '') + cur.onset;
        continue;
      }
    }
    merged.push(cur);
  }

  // Pass 3: Split medial consonant clusters (cluster.length >= 2) into prev.coda + cur.onset
  for (let idx = 1; idx < merged.length; idx++) {
    const prev = merged[idx - 1];
    const cur = merged[idx];
    if (!prev || !cur || prev.symbol || cur.symbol || !prev.vowel || !cur.vowel) continue;
    if (prev.mod || prev.coda) continue;

    const cluster = cur.onset || '';
    if (cluster.length >= 2) {
      const candidateWhole = cluster + cur.vowel + (cur.mod || '');
      if (SYLLABLE_OVERRIDES[candidateWhole]) continue;

      if (cluster.length === 2) {
        const c1 = cluster[0];
        const c2 = cluster[1];
        const shouldSplit = c1 === 'r' || c1 === c2 || !VALID_ONSET_PAIRS.has(cluster);
        if (shouldSplit) {
          prev.coda = c1;
          cur.onset = c2;
        }
      } else if (cluster.length >= 3) {
        if (cluster[0] === 'r' && 'tkpws'.includes(cluster[1]) && cluster.length >= 4) {
          prev.coda = cluster.slice(0, 2);
          cur.onset = cluster.slice(2);
        } else {
          prev.coda = cluster[0];
          cur.onset = cluster.slice(1);
        }
      }
    }
  }

  return merged;
}

/**
 * Context-Aware Anusvāra (ṃ / ~) Nasal Assimilation & Visarga (ḥ) Echo-Vowel Resolver
 */
export function resolveModifiers(
  mod: string,
  vowel: string,
  nextOnsetChar: string,
  enableAssimilation = true
): { mMod: string; tMod: string; modNote: string; sandhiNotes: string[] } {
  if (!mod) return { mMod: '', tMod: '', modNote: '', sandhiNotes: [] };
  let mMod = '';
  let tMod = '';
  const notes: string[] = [];

  if (mod.includes('M') || mod.includes('~')) {
    if (enableAssimilation && nextOnsetChar) {
      if ('kKgGN'.includes(nextOnsetChar)) {
        mMod += '昂';
        tMod += '僧';
        notes.push('随韵ṃ遇喉音同化为[ŋ]');
      } else if ('cCjJYSy'.includes(nextOnsetChar)) {
        mMod += '恩';
        tMod += 'ဉ';
        notes.push('随韵ṃ遇颚音同化为[ɲ]');
      } else if ('wWqQRtTdDnsz'.includes(nextOnsetChar)) {
        mMod += '恩';
        tMod += '僧';
        notes.push('随韵ṃ遇齿/卷舌音同化为[n]');
      } else {
        mMod += '姆';
        tMod += '牟';
        notes.push('随韵ṃ闭唇鼻音[m]');
      }
    } else {
      mMod += '姆';
      tMod += '南';
      notes.push('随韵鼻音(Anusvāra)');
    }
  }

  if (mod.includes('H')) {
    if (enableAssimilation) {
      if (vowel === 'i' || vowel === 'I') {
        mMod += '希';
        tMod += '醯';
      } else if (vowel === 'u' || vowel === 'U') {
        mMod += '呼';
        tMod += '虎';
      } else if (vowel === 'e' || vowel === 'E') {
        mMod += '嘿';
        tMod += '醯';
      } else if (vowel === 'o' || vowel === 'O') {
        mMod += '豁';
        tMod += '呼';
      } else if (vowel === 'f' || vowel === 'F') {
        mMod += '里希';
        tMod += '哩醯';
      } else {
        mMod += '哈';
        tMod += '诃';
      }
      notes.push('止韵ḥ元音回响');
    } else {
      mMod += '哈';
      tMod += '诃';
      notes.push('止韵送气(Visarga)');
    }
  }

  return { mMod, tMod, modNote: notes.join('·'), sandhiNotes: notes };
}

/**
 * Syllabify and transliterate a single SLP1 word into dual-track phonetics & Chandas prosody
 */
export function parseAndTransliterateWord(
  slpWord: string,
  options: ProsodyOptions = {}
): ParsedWordSyllable[] {
  const { assimilate = true, longMarkSymbol = '～' } = options;
  const tokens = syllabifySlp1Word(slpWord);
  const syllables: ParsedWordSyllable[] = [];

  for (let idx = 0; idx < tokens.length; idx++) {
    const tk = tokens[idx];
    const nextTk = tokens[idx + 1];
    const nextOnsetChar = nextTk && nextTk.onset ? nextTk.onset[0] : '';

    if (tk.symbol !== undefined) {
      if (tk.symbol === "'") {
        syllables.push({
          raw: "'",
          m: '·',
          t: '',
          meter: '',
          varga: '连音符',
          note: '省音符 Avagraha (前接长元音延音)',
          sandhiNotes: ['省音符 Avagraha'],
          isSymbol: true
        });
      } else if (tk.symbol === '|' || tk.symbol === '.') {
        syllables.push({
          raw: tk.symbol,
          m: '｜',
          t: '।',
          meter: '',
          varga: '标点',
          note: '梵文句读竖线 (Daṇḍa)',
          sandhiNotes: [],
          isSymbol: true
        });
      } else {
        syllables.push({
          raw: tk.symbol,
          m: tk.symbol,
          t: tk.symbol,
          meter: '',
          varga: '符号',
          note: '分隔符',
          sandhiNotes: [],
          isSymbol: true
        });
      }
      continue;
    }

    const onset = tk.onset || '';
    const vowel = tk.vowel || '';
    const mod = tk.mod || '';
    const coda = tk.coda || '';
    const rawSyl = onset + vowel + mod + coda;

    // Determine Chandas meter weight (Guru — vs Laghu ⏑)
    const nextClusterLen = nextTk && nextTk.onset ? nextTk.onset.length : 0;
    const isGuru =
      LONG_VOWELS.has(vowel) || Boolean(mod) || Boolean(coda) || nextClusterLen >= 2;
    const meter: '—' | '⏑' | '' = vowel ? (isGuru ? '—' : '⏑') : '';

    // 1. Check SYLLABLE_OVERRIDES first
    if (tk.isOm || SYLLABLE_OVERRIDES[rawSyl]) {
      const ov = tk.isOm ? SYLLABLE_OVERRIDES['oM'] : SYLLABLE_OVERRIDES[rawSyl];
      let mText = ov.m;
      const tText = ov.t;
      const sandhiNotes: string[] = [];

      if (longMarkSymbol && INHERENT_LONG_VOWELS.has(vowel) && !mod && !coda) {
        mText += longMarkSymbol;
      }
      if (rawSyl === 'saM' && assimilate && nextOnsetChar) {
        const res = resolveModifiers('M', 'a', nextOnsetChar, true);
        mText = '萨' + res.mMod;
        sandhiNotes.push(...res.sandhiNotes);
      } else if (mod) {
        const res = resolveModifiers(mod, vowel, nextOnsetChar, assimilate);
        sandhiNotes.push(...res.sandhiNotes);
      }

      syllables.push({
        raw: rawSyl,
        m: mText,
        t: tText,
        meter,
        varga: '特殊陀罗尼音节',
        note: ov.note + (isGuru ? ' · 重音节(Guru)' : ' · 轻音节(Laghu)'),
        sandhiNotes,
        ...(ov.bijaMeaning ? { bijaMeaning: ov.bijaMeaning } : {})
      });
      continue;
    }

    // Check override on base syllable without coda (e.g., SrI + coda)
    const baseWithoutCoda = onset + vowel + mod;
    if (coda && SYLLABLE_OVERRIDES[baseWithoutCoda]) {
      const ov = SYLLABLE_OVERRIDES[baseWithoutCoda];
      let codaM = '';
      let codaT = '';
      for (const c of coda) {
        codaM += CONS_MATRIX[c]?.bare[0] ?? c;
        codaT += CONS_MATRIX[c]?.bare[1] ?? c;
      }
      const lMark =
        longMarkSymbol && INHERENT_LONG_VOWELS.has(vowel) && !mod ? longMarkSymbol : '';
      syllables.push({
        raw: rawSyl,
        m: ov.m + lMark + codaM,
        t: ov.t + codaT,
        meter,
        varga: '复合闭音节',
        note: `${ov.note} + 尾收音[-${slp1ToIast(coda)}]`,
        sandhiNotes: [`闭音节收音[-${slp1ToIast(coda)}]`],
        ...(ov.bijaMeaning ? { bijaMeaning: ov.bijaMeaning } : {})
      });
      continue;
    }

    // 2. Pure vowelless consonant cluster
    if (onset && !vowel) {
      const mParts: string[] = [];
      const tParts: string[] = [];
      for (const c of onset) {
        mParts.push(CONS_MATRIX[c]?.bare[0] ?? c);
        tParts.push(CONS_MATRIX[c]?.bare[1] ?? c);
      }
      syllables.push({
        raw: rawSyl,
        m: `(${mParts.join('')})`,
        t: tParts.join(''),
        meter: '',
        varga: CONS_MATRIX[onset[0]]?.varga ?? '辅音',
        note: '无元音收音辅音 (Virāma)',
        sandhiNotes: ['无元音收音辅音 (Virāma)']
      });
      continue;
    }

    // 3. Independent vowel (no onset consonant)
    if (!onset && vowel) {
      let [mBase, tBase] = VOWEL_MAP[vowel] || [vowel, vowel];
      if (longMarkSymbol && INHERENT_LONG_VOWELS.has(vowel)) {
        mBase += longMarkSymbol;
      }
      const { mMod, tMod, modNote, sandhiNotes } = resolveModifiers(
        mod,
        vowel,
        nextOnsetChar,
        assimilate
      );
      let codaM = '';
      let codaT = '';
      for (const c of coda) {
        codaM += CONS_MATRIX[c]?.bare[0] ?? c;
        codaT += CONS_MATRIX[c]?.bare[1] ?? c;
      }
      if (coda) sandhiNotes.push(`闭音节收音[-${slp1ToIast(coda)}]`);
      syllables.push({
        raw: rawSyl,
        m: mBase + mMod + codaM,
        t: tBase + tMod + codaT,
        meter,
        varga: '独立元音 (Svara)',
        note:
          (LONG_VOWELS.has(vowel) ? '独立长元音' : '独立短元音') +
          (modNote ? ` · ${modNote}` : '') +
          (coda ? ` · 收音[-${slp1ToIast(coda)}]` : ''),
        sandhiNotes
      });
      continue;
    }

    // 4. Standard Consonant(s) + Vowel + (Modifier) + (Coda)
    let prefixM = '';
    let prefixT = '';
    let prefixCons = onset.slice(0, -1);
    let mainCons = onset.slice(-1);

    let isSpecialConjunct = false;
    let specialNote = '';
    if (onset.endsWith('kz')) {
      prefixCons = onset.slice(0, -2);
      for (const c of prefixCons) {
        prefixM += CONS_MATRIX[c]?.bare[0] ?? c;
        prefixT += CONS_MATRIX[c]?.bare[1] ?? c;
      }
      prefixM += '克';
      mainCons = 'z';
      isSpecialConjunct = true;
      specialNote = '二合辅音[kṣ] · ';
    } else if (onset.endsWith('jY')) {
      prefixCons = onset.slice(0, -2);
      for (const c of prefixCons) {
        prefixM += CONS_MATRIX[c]?.bare[0] ?? c;
        prefixT += CONS_MATRIX[c]?.bare[1] ?? c;
      }
      prefixM += '佳';
      mainCons = 'Y';
      isSpecialConjunct = true;
      specialNote = '二合辅音[jñ] · ';
    } else {
      for (const c of prefixCons) {
        prefixM += CONS_MATRIX[c]?.bare[0] ?? c;
        prefixT += CONS_MATRIX[c]?.bare[1] ?? c;
      }
    }

    const vIdx = VOWEL_INDEX[vowel] ?? 0;
    const cEntry = CONS_MATRIX[mainCons];
    let mainM = cEntry ? cEntry.m[vIdx] : mainCons;
    const mainT =
      isSpecialConjunct && onset.endsWith('kz')
        ? ['叉', '絺', '刍', '刹哩', '制', '差', '初', '抄'][vIdx]
        : isSpecialConjunct && onset.endsWith('jY')
          ? ['若', '若', '如', '若哩', '若', '若', '若', '若'][vIdx]
          : cEntry
            ? cEntry.t[vIdx]
            : mainCons;

    if (longMarkSymbol && INHERENT_LONG_VOWELS.has(vowel)) {
      mainM += longMarkSymbol;
    }

    const { mMod, tMod, modNote, sandhiNotes } = resolveModifiers(
      mod,
      vowel,
      nextOnsetChar,
      assimilate
    );

    let codaM = '';
    let codaT = '';
    if (coda) {
      for (const c of coda) {
        if (
          nextOnsetChar &&
          (c === nextOnsetChar ||
            (c === 'd' && nextOnsetChar === 'D') ||
            (c === 't' && nextOnsetChar === 'T'))
        ) {
          codaM += '';
          codaT += CONS_MATRIX[c]?.bare[1] ?? c;
        } else {
          codaM += CONS_MATRIX[c]?.bare[0] ?? c;
          codaT += CONS_MATRIX[c]?.bare[1] ?? c;
        }
      }
      sandhiNotes.push(`闭音节收音[-${slp1ToIast(coda)}]`);
    }

    const noteParts: string[] = [];
    if (prefixCons && !isSpecialConjunct) noteParts.push(`前置复辅音[${slp1ToIast(prefixCons)}-]`);
    if (specialNote) noteParts.push(specialNote.replace(' · ', ''));
    if (cEntry) noteParts.push(cEntry.note);
    if (LONG_VOWELS.has(vowel)) noteParts.push('长元音');
    if (modNote) noteParts.push(modNote);
    if (coda) noteParts.push(`闭音节收音[-${slp1ToIast(coda)}]`);

    syllables.push({
      raw: rawSyl,
      m: prefixM + mainM + mMod + codaM,
      t: prefixT + mainT + tMod + codaT,
      meter,
      varga: cEntry ? cEntry.varga : '辅音',
      note: noteParts.join(' · '),
      sandhiNotes
    });
  }

  return syllables;
}

/**
 * Analyze a full line of Sanskrit (in IAST, Devanāgarī, Siddhaṃ, or SLP1) into structured
 * words and syllables with multi-script representations, dual-track phonetics, Sandhi notes,
 * and Chandas Guru/Laghu prosody.
 */
export function analyzeSanskritLine(text: string, options: ProsodyOptions = {}): LineAnalysis {
  const { mode = 'smart', assimilate = true, longMarkSymbol = '～' } = options;
  const slp1Full = inputToSlp1(text.trim(), mode);
  const normalizedIast = slp1ToIast(slp1Full);
  const devanagari = slp1ToDevanagari(slp1Full);
  const siddhamUnicode = slp1ToSiddhamUnicode(slp1Full);

  const rawWords = slp1Full.replace(/-/g, ' ').split(/\s+/).filter(Boolean);
  const words = rawWords.map((w) => {
    const parsedSyls = parseAndTransliterateWord(w, { assimilate, longMarkSymbol });
    const syllables: SyllableAnalysis[] = parsedSyls
      .filter((s) => !s.isSymbol)
      .map((s) => ({
        rawIast: slp1ToIast(s.raw),
        slp1: s.raw,
        devanagari: slp1ToDevanagari(s.raw),
        siddhamUnicode: slp1ToSiddhamUnicode(s.raw),
        modernPhonetic: s.m,
        tangReconstruction: s.t,
        ipa: slp1ToIpa(s.raw),
        weight: s.meter === '—' ? 'Guru' : 'Laghu',
        meterSymbol: s.meter === '—' ? '—' : '⏑',
        varga: s.varga,
        acousticNote: s.note,
        sandhiNotes: s.sandhiNotes,
        ...(s.bijaMeaning ? { bijaMeaning: s.bijaMeaning } : {})
      }));

    const wordModernPhonetic = syllables.map((s) => s.modernPhonetic).join('');
    const wordTangReconstruction =
      TRAD_WORD_REPLACEMENTS[w] ?? syllables.map((s) => s.tangReconstruction).join('');

    return {
      wordIast: slp1ToIast(w),
      wordDevanagari: slp1ToDevanagari(w),
      wordSiddham: slp1ToSiddhamUnicode(w),
      wordModernPhonetic,
      wordTangReconstruction,
      syllables
    };
  });

  return {
    originalText: text,
    normalizedIast,
    devanagari,
    siddhamUnicode,
    slp1: slp1Full,
    words
  };
}
