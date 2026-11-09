/**
 * Sanskrit Chandas Prosody, Akṣara Syllabifier & Context-Aware Śikṣā Mapper (`src/core/prosody.ts`)
 * Implements 3-pass prosodic syllabification, Guru (— 2-mātrā) vs Laghu (⏑ 1-mātrā) Chandas weight,
 * homorganic Anusvāra (ṃ) nasal assimilation across all 5 Vargas, and Visarga (ḥ) vowel echo.
 */

import { ChandasMeter, SyllableToken } from '../types/dharani';
import {
  CANONICAL_14_VOWELS,
  CONS_MATRIX,
  SYLLABLE_OVERRIDES,
  inputToSlp1,
  slp1ToDevanagari,
  slp1ToIast,
  slp1ToIpa,
  slp1ToSiddham,
} from './transliterator';

const VOWEL_SET = new Set(CANONICAL_14_VOWELS.map((v) => v.slp1));
const LONG_VOWELS = new Set(['A', 'I', 'U', 'F', 'X', 'e', 'E', 'o', 'O']);
const INHERENT_LONG_VOWELS = new Set(['A', 'I', 'U', 'F', 'X']);
const VOWEL_INDEX: Record<string, number> = {
  a: 0, A: 0, i: 1, I: 1, u: 2, U: 2, f: 3, F: 3, x: 3, X: 3, e: 4, E: 5, o: 6, O: 7,
};
const CONS_SET = new Set(Object.keys(CONS_MATRIX));
const MOD_SET = new Set(['M', 'H', '~']);

const VALID_ONSET_PAIRS = new Set([
  'pr', 'pl', 'br', 'bl', 'tr', 'tv', 'dr', 'dv', 'kr', 'kl', 'kv', 'gr', 'gl', 'gv',
  'Sr', 'Sl', 'Sv', 'Sy', 'zw', 'zW', 'sn', 'sm', 'sv', 'sy', 'sr', 'st', 'sT', 'sp', 'sP', 'sk',
  'kz', 'jY', 'vy', 'vr', 'dy', 'dB', 'Dy', 'Dr', 'Dv', 'ny', 'nr', 'my', 'mr', 'ml',
  'ky', 'kr', 'gy', 'Gr', 'cy', 'jy', 'jv', 'ty', 'tr', 'py', 'pr', 'By', 'Br', 'hr', 'hl', 'hv',
]);

export const TRAD_WORD_REPLACEMENTS: Record<string, string> = {
  gate: '揭谛',
  pAragate: '波罗揭谛',
  pArasaMgate: '波罗僧揭谛',
  boDi: '菩提',
  svAhA: '萨婆诃',
  namo: '南无',
  namaH: '南无',
  Bagavate: '婆伽伐帝',
  BEzajyaguru: '鞞杀社窭噜',
  vEdUryapraBarAjAya: '吠琉璃钵喇婆喝啰阇耶',
  taTAgatAya: '怛他揭多耶',
  arhate: '阿啰喝帝',
  samyaksaMbudDAya: '三藐三勃陀耶',
  tadyaTA: '怛侄他',
  avalokiteSvara: '阿缚卢枳低湿伐逻',
  prajYApAramitA: '般若波罗蜜多',
  tAre: '多',
  tuttAre: '都多',
  ture: '都',
};

interface RawAksharaToken {
  onset: string;
  vowel: string;
  mod: string;
  coda: string;
  symbol?: string;
}

export function syllabifySlp1Word(slpWord: string): RawAksharaToken[] {
  const rawTokens: RawAksharaToken[] = [];
  let i = 0;
  const n = slpWord.length;

  while (i < n) {
    const ch = slpWord[i];
    if (!CONS_SET.has(ch) && !VOWEL_SET.has(ch) && !MOD_SET.has(ch)) {
      rawTokens.push({ onset: '', vowel: '', mod: '', coda: '', symbol: ch });
      i++;
      continue;
    }
    if (slpWord.startsWith('oM', i) && i === 0 && (n === 2 || !VOWEL_SET.has(slpWord[2]))) {
      rawTokens.push({ onset: '', vowel: 'o', mod: 'M', coda: '' });
      i += 2;
      continue;
    }
    let onset = '';
    while (i < n && CONS_SET.has(slpWord[i])) {
      onset += slpWord[i];
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
    rawTokens.push({ onset, vowel, mod, coda: '' });
  }

  // Pass 2: Merge vowelless trailing consonant clusters into previous syllable's coda
  const merged: RawAksharaToken[] = [];
  for (const tk of rawTokens) {
    if (tk.symbol) {
      merged.push(tk);
      continue;
    }
    if (!tk.vowel && tk.onset) {
      let prev: RawAksharaToken | null = null;
      for (let j = merged.length - 1; j >= 0; j--) {
        if (!merged[j].symbol && merged[j].vowel) {
          prev = merged[j];
          break;
        }
      }
      if (prev) {
        prev.coda += tk.onset;
      } else {
        merged.push(tk);
      }
    } else {
      merged.push(tk);
    }
  }

  // Pass 3: Medial consonant cluster splitting per Sanskrit Śikṣā prosodic laws
  for (let k = 1; k < merged.length; k++) {
    const cur = merged[k];
    const prev = merged[k - 1];
    if (cur.symbol || prev.symbol || !prev.vowel || !cur.vowel || prev.mod || prev.coda) continue;

    const cluster = cur.onset;
    if (cluster.length >= 2) {
      const candidateOverride = cluster + cur.vowel + cur.mod;
      if (SYLLABLE_OVERRIDES[candidateOverride]) continue;

      if (cluster.length === 2) {
        const c1 = cluster[0];
        const c2 = cluster[1];
        if (c1 === 'r' || c1 === c2 || !VALID_ONSET_PAIRS.has(cluster)) {
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

export function resolveModifiers(
  mod: string,
  vowel: string,
  nextOnsetChar: string,
  enableAssimilation = true
): { mMod: string; tMod: string; modNote: string } {
  if (!mod) return { mMod: '', tMod: '', modNote: '' };
  let mMod = '';
  let tMod = '';
  const notes: string[] = [];

  for (const mChar of mod) {
    if (mChar === 'M' || mChar === '~') {
      if (!enableAssimilation) {
        mMod += '姆';
        tMod += '南';
        notes.push('随韵 ṃ [m]');
      } else if (nextOnsetChar && /[kKgGN]/.test(nextOnsetChar)) {
        mMod += '昂';
        tMod += '僧';
        notes.push('随韵遇喉音同化为 [ŋ](ng)');
      } else if (nextOnsetChar && /[cCjJYSy]/.test(nextOnsetChar)) {
        mMod += '恩';
        tMod += 'ဉ';
        notes.push('随韵遇颚音同化为 [ɲ](ny)');
      } else if (nextOnsetChar && /[wWqQRtTdDnsz]/.test(nextOnsetChar)) {
        mMod += '恩';
        tMod += '南';
        notes.push('随韵遇齿/卷舌音同化为 [n]');
      } else {
        mMod += '姆';
        tMod += '牟';
        notes.push('随韵闭合为双唇鼻音 [m]');
      }
    } else if (mChar === 'H') {
      if (!enableAssimilation) {
        mMod += '哈';
        tMod += '诃';
        notes.push('止韵 ḥ [h]');
      } else {
        if (vowel === 'i' || vowel === 'I') {
          mMod += '希';
          tMod += '醯';
          notes.push('止韵 ḥ 随 i 元音回响为 [hi]');
        } else if (vowel === 'u' || vowel === 'U') {
          mMod += '呼';
          tMod += '虎';
          notes.push('止韵 ḥ 随 u 元音回响为 [hu]');
        } else if (vowel === 'e' || vowel === 'E') {
          mMod += '嘿';
          tMod += '醯';
          notes.push('止韵 ḥ 随 e 元音回响为 [he]');
        } else if (vowel === 'o' || vowel === 'O') {
          mMod += '豁';
          tMod += '呼';
          notes.push('止韵 ḥ 随 o 元音回响为 [ho]');
        } else if (vowel === 'f' || vowel === 'F') {
          mMod += '希';
          tMod += '醯';
          notes.push('止韵 ḥ 随 ṛ 元音回响');
        } else {
          mMod += '哈';
          tMod += '诃';
          notes.push('止韵 ḥ 送气回响 [ha]');
        }
      }
    }
  }
  return { mMod, tMod, modNote: notes.join('；') };
}

export function analyzeSanskritText(
  inputText: string,
  options: { assimilate?: boolean; longMark?: string; sep?: string } = {}
): {
  slp1: string;
  iast: string;
  deva: string;
  siddham: string;
  ipa: string;
  modernFull: string;
  tradFull: string;
  syllables: SyllableToken[];
  guruCount: number;
  laghuCount: number;
} {
  const assimilate = options.assimilate ?? true;
  const longMark = options.longMark ?? '～';
  const sep = options.sep ?? '·';

  const slp1 = inputToSlp1(inputText, 'smart');
  const iast = slp1ToIast(slp1);
  const deva = slp1ToDevanagari(slp1);
  const siddham = slp1ToSiddham(slp1);
  const ipa = slp1ToIpa(slp1);

  const words = slp1.trim().split(/\s+/).filter(Boolean);
  const allSyllables: SyllableToken[] = [];
  const modernWords: string[] = [];
  const tradWords: string[] = [];
  let guruCount = 0;
  let laghuCount = 0;
  let globalIndex = 0;

  const vowelMapBySlp = Object.fromEntries(CANONICAL_14_VOWELS.map((v) => [v.slp1, v]));

  for (const word of words) {
    const tokens = syllabifySlp1Word(word);
    const wordModParts: string[] = [];
    const wordTradParts: string[] = [];

    for (let idx = 0; idx < tokens.length; idx++) {
      const tk = tokens[idx];
      if (tk.symbol) {
        allSyllables.push({
          index: globalIndex++,
          slp1: tk.symbol,
          iast: tk.symbol,
          deva: tk.symbol === '||' ? '॥' : tk.symbol === '|' ? '।' : tk.symbol,
          siddham: tk.symbol === '||' ? '𑗃' : tk.symbol === '|' ? '𑗂' : tk.symbol,
          ipa: tk.symbol,
          modern: tk.symbol === '|' || tk.symbol === '||' ? '｜' : tk.symbol,
          trad: tk.symbol,
          meter: '',
          onset: '',
          vowel: '',
          mod: '',
          coda: '',
          vargaNote: '诗律分句停顿符 (Daṇḍa)',
          isSymbol: true,
        });
        continue;
      }

      const raw = tk.onset + tk.vowel + tk.mod + tk.coda;
      const nextTk = tokens[idx + 1];
      const nextOnset = nextTk && !nextTk.symbol ? nextTk.onset : '';
      const nextClusterLen = nextOnset.length;

      // Chandas Prosodic Meter (Guru — vs Laghu ⏑)
      const isGuru =
        LONG_VOWELS.has(tk.vowel) ||
        Boolean(tk.mod) ||
        Boolean(tk.coda) ||
        nextClusterLen >= 2;
      const meter: ChandasMeter = tk.vowel ? (isGuru ? '—' : '⏑') : '—';
      if (meter === '—') guruCount++;
      else if (meter === '⏑') laghuCount++;

      let mSyl = '';
      let tSyl = '';
      let vargaNote = '';

      if (SYLLABLE_OVERRIDES[raw]) {
        const ov = SYLLABLE_OVERRIDES[raw];
        mSyl = longMark !== '～' ? ov.m.replace(/～/g, longMark) : ov.m;
        if (raw === 'saM' && assimilate && nextOnset[0]) {
          const { mMod } = resolveModifiers('M', 'a', nextOnset[0], true);
          mSyl = '萨' + mMod;
        }
        tSyl = ov.t;
        vargaNote = ov.note;
      } else {
        const baseKey = tk.onset + tk.vowel + tk.mod;
        if (SYLLABLE_OVERRIDES[baseKey]) {
          const ov = SYLLABLE_OVERRIDES[baseKey];
          mSyl = longMark !== '～' ? ov.m.replace(/～/g, longMark) : ov.m;
          tSyl = ov.t;
          vargaNote = ov.note;
        } else {
          const vIdx = VOWEL_INDEX[tk.vowel] ?? 0;
          const isInherentLong = INHERENT_LONG_VOWELS.has(tk.vowel);
          if (!tk.onset) {
            const vEntry = vowelMapBySlp[tk.vowel];
            mSyl = vEntry ? (longMark !== '～' ? vEntry.modern.replace(/～/g, longMark) : vEntry.modern) : tk.vowel;
            tSyl = vEntry ? vEntry.trad : tk.vowel;
            vargaNote = vEntry ? vEntry.note : '独立元音摩多';
          } else if (tk.onset === 'kz') {
            const zRow = CONS_MATRIX.z;
            mSyl = '克' + zRow.m[vIdx] + (isInherentLong ? longMark : '');
            tSyl = ['叉', '絺', '刍', '刹哩', '制', '差', '初', '抄'][vIdx];
            vargaNote = '特殊二合复辅音 kṣ [kʂ]';
          } else if (tk.onset === 'jY') {
            const yRow = CONS_MATRIX.Y;
            mSyl = '佳' + yRow.m[vIdx] + (isInherentLong ? longMark : '');
            tSyl = ['若', '若', '如', '若哩', '若', '若', '若', '若'][vIdx];
            vargaNote = '般若二合复辅音 jñ [dʑɲ]';
          } else {
            const prefixCons = tk.onset.slice(0, -1);
            const mainCons = tk.onset.slice(-1);
            for (const pc of prefixCons) {
              if (CONS_MATRIX[pc]) {
                mSyl += CONS_MATRIX[pc].bare[0];
                tSyl += CONS_MATRIX[pc].bare[1];
              }
            }
            const mainRow = CONS_MATRIX[mainCons];
            if (mainRow) {
              mSyl += mainRow.m[vIdx] + (isInherentLong ? longMark : '');
              tSyl += mainRow.t[vIdx];
              vargaNote = mainRow.note;
            }
          }

          if (tk.mod) {
            const { mMod, tMod, modNote } = resolveModifiers(
              tk.mod,
              tk.vowel,
              tk.coda ? tk.coda[0] : nextOnset[0] || '',
              assimilate
            );
            mSyl += mMod;
            tSyl += tMod;
            if (modNote) vargaNote += ` · ${modNote}`;
          }
        }

        if (tk.coda && !SYLLABLE_OVERRIDES[raw]) {
          for (const cc of tk.coda) {
            const nextFirst = nextOnset[0] || '';
            const isGeminate =
              cc.toLowerCase() === nextFirst.toLowerCase() && /[kKgGcCjJwWqQtTdDpPbB]/.test(cc);
            if (!isGeminate && CONS_MATRIX[cc]) {
              mSyl += `(${CONS_MATRIX[cc].bare[0]})`;
            }
          }
        }
      }

      wordModParts.push(mSyl);
      wordTradParts.push(tSyl);

      allSyllables.push({
        index: globalIndex++,
        slp1: raw,
        iast: slp1ToIast(raw),
        deva: slp1ToDevanagari(raw),
        siddham: slp1ToSiddham(raw),
        ipa: slp1ToIpa(raw),
        modern: mSyl,
        trad: tSyl,
        meter,
        onset: tk.onset,
        vowel: tk.vowel,
        mod: tk.mod,
        coda: tk.coda,
        vargaNote,
        tangNote: tk.onset.length >= 2 ? '二合' : LONG_VOWELS.has(tk.vowel) ? '引' : undefined,
      });
    }

    if (wordModParts.length > 0) {
      modernWords.push(wordModParts.join(sep));
      const cleanWord = word.replace(/[|']/g, '');
      tradWords.push(TRAD_WORD_REPLACEMENTS[cleanWord] || wordTradParts.join(''));
    }
  }

  return {
    slp1,
    iast,
    deva,
    siddham,
    ipa,
    modernFull: modernWords.join(' '),
    tradFull: tradWords.join(' '),
    syllables: allSyllables,
    guruCount,
    laghuCount,
  };
}
