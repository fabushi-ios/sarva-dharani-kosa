/**
 * 梵文音节诗律状态机与声学共振峰拆解引擎 (src/core/prosody.ts)
 *
 * 完整融合《改善语音发音方案》v2.0 与《梵文陀罗尼数据库汇总》的核心算法：
 * 1. Akṣara 音节自动切分（词中复辅音自动切分为前音节闭音节收音 Coda + 后音节起音 Onset）
 * 2. 随韵 Anusvāra (ṃ) 根据后接辅音部位五类同化 (ṅ/ñ/ṇ/n/m)
 * 3. 止韵 Visarga (ḥ) 根据前接元音自动回响 (aḥ->哈, iḥ->希, uḥ->呼, eḥ->嘿, oḥ->豁)
 * 4. 梵文诗律 Chandas 轻重音节自动判定：Guru (— 重音, 2拍) vs Laghu (⌣ 轻音, 1拍)
 * 5. 元音第一、第二共振峰频率 (F1, F2 in Hz) 映射
 */

import {
  CONS_MATRIX,
  VOWEL_DUAL_MAP,
  inputToSlp1,
  slp1ToDevanagari,
  slp1ToIast,
  slp1ToIpa,
  slp1ToSiddham
} from './transliterator';

export interface AnalyzedSyllable {
  rawSlp: string;
  iast: string;
  devanagari: string;
  siddham: string;
  ipa: string;
  modernPhonetic: string;
  tangTranslit: string;
  meter: '—' | '⌣' | '';
  weightLabel: 'Guru (重音·2拍)' | 'Laghu (轻音·1拍)' | '符号';
  varga: string;
  note: string;
  f1: number;
  f2: number;
  baseDurationSec: number;
  isSymbol?: boolean;
}

export const VOWEL_FORMANTS: Record<string, [number, number, number]> = {
  'a': [720, 1240, 0.22], 'A': [750, 1280, 0.40],
  'i': [300, 2280, 0.22], 'I': [280, 2350, 0.40],
  'u': [320, 820,  0.22], 'U': [300, 780,  0.40],
  'f': [460, 1520, 0.26], 'F': [460, 1550, 0.42],
  'x': [440, 1620, 0.26], 'X': [440, 1650, 0.42],
  'e': [450, 1980, 0.36], 'E': [620, 1850, 0.42],
  'o': [460, 920,  0.36], 'O': [640, 1020, 0.42]
};

const VOWEL_INDEX: Record<string, number> = {
  'a':0,'A':0,'i':1,'I':1,'u':2,'U':2,'f':3,'F':3,'x':3,'X':3,'e':4,'E':5,'o':6,'O':7
};
const LONG_VOWELS = new Set(['A','I','U','F','X','e','E','o','O']);
export const INHERENT_LONG_VOWELS = new Set(['A','I','U','F','X']);
const VOWEL_SET = new Set('aAiIuUfFxXeEoO'.split(''));
const CONS_SET = new Set(Object.keys(CONS_MATRIX));
const MOD_SET = new Set(['M', 'H', '~']);

const VALID_ONSET_PAIRS = new Set([
  'pr','br','tr','dr','kr','gr','Sr','zr','sr','Pl','kl','gl','Sl',
  'sv','tv','dv','kv','gv','zv','Sv',
  'ky','gy','py','by','vy','ty','Dy','Sy','zy','sy','hy','jy','cy',
  'kz','jY','zw','zW','st','sT','sp','sP','sk','sK','sm','sn'
]);

export const SYLLABLE_OVERRIDES: Record<string, { m: string; t: string; note: string }> = {
  'oM':   { m: '嗡',     t: '唵',     note: '神圣三身种子字 (oṃ)' },
  'hUM':  { m: '轰',     t: '吽',     note: '金刚部圆满种子字 (hūṃ)' },
  'huM':  { m: '轰',     t: '吽',     note: '种子字 (huṃ)' },
  'hrIH': { m: '赫里希', t: '纥哩',   note: '莲花部陀罗尼种子字 (hrīḥ)' },
  'hrIM': { m: '赫里姆', t: '纥哩',   note: '种子字 (hrīṃ)' },
  'SrIM': { m: '什里姆', t: '室哩',   note: '大吉祥种子字 (śrīṃ)' },
  'klIM': { m: '克里姆', t: '讫哩',   note: '金刚钩召种子字 (klīṃ)' },
  'DIH':  { m: '迪希',   t: '谛',     note: '文殊般若智慧种子字 (dhīḥ)' },
  'BrUM': { m: '布鲁姆', t: '勃笼',   note: '一字金轮佛顶尊胜种子字 (bhrūṃ)' },
  'svA':  { m: '斯哇',   t: '娑婆',   note: '吉祥圆满词根 (svā)' },
  'sva':  { m: '斯瓦',   t: '娑嚩',   note: '自性/天界 (sva)' },
  'svaH': { m: '斯瓦哈', t: '娑嚩诃', note: '天界 (svaḥ)' },
  'svar': { m: '斯瓦尔', t: '娑嚩啰', note: '天界 (svar)' },
  'BUr':  { m: '布尔',   t: '婆啰',   note: '地界 (bhūr)' },
  'BUH':  { m: '布呼',   t: '婆诃',   note: '地界 (bhūḥ)' },
  'hA':   { m: '哈',     t: '诃',     note: '成就尾音 (hā)' },
  'SrI':  { m: '什里',   t: '室利',   note: '吉祥尊称 (śrī)' },
  'pra':  { m: '普拉',   t: '般若',   note: '胜义前缀 (pra)' },
  'jYA':  { m: '佳尼亚', t: '若',     note: '般若智慧词根 (jñā)' },
  'jYa':  { m: '佳尼亚', t: '若',     note: '智 (jña)' },
  'kza':  { m: '克沙',   t: '叉',     note: '二合复辅音 (kṣa)' },
  'kzA':  { m: '克沙',   t: '叉',     note: '二合复辅音 (kṣā)' },
  'kzi':  { m: '克希',   t: '絺',     note: '二合复辅音 (kṣi)' },
  'kzI':  { m: '克希',   t: '絺',     note: '二合复辅音 (kṣī)' },
  'kzu':  { m: '克书',   t: '刍',     note: '二合复辅音 (kṣu)' },
  'kze':  { m: '克奢',   t: '制',     note: '二合复辅音 (kṣe)' },
  'Paw':  { m: '帕特',   t: '发吒',   note: '摧破魔障种子字 (phaṭ)' },
  'saM':  { m: '萨姆',   t: '僧',     note: '正等/和合前缀 (saṃ)' }
};

export const TRAD_WORD_REPLACEMENTS: Record<string, string> = {
  'gate': '揭谛',
  'pAragate': '波罗揭谛',
  'pArasaMgate': '波罗僧揭谛',
  'boDi': '菩提',
  'svAhA': '萨婆诃',
  'namo': '南无',
  'namaH': '南无',
  'Bagavate': '婆伽伐帝',
  'BagavAn': '婆伽梵',
  'avalokiteSvara': '阿缚卢枳低湿伐逻',
  'prajYApAramitA': '般若波罗蜜多',
  'tadyaTA': '怛侄他',
  'padme': '钵头摩',
  'maRi': '摩尼',
  'tAre': '多',
  'tuttAre': '都多',
  'ture': '都',
  'Bezajye': '鞞杀逝',
  'mahABezajye': '摩诃鞞杀逝',
  'samudgate': '三没揭帝'
};

interface RawSyllableToken {
  onset: string;
  vowel: string;
  mod: string;
  coda: string;
  isOm?: boolean;
  symbol?: string;
}

export function syllabifySlp1Word(slpWord: string): RawSyllableToken[] {
  const rawTokens: RawSyllableToken[] = [];
  let i = 0;
  const n = slpWord.length;

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
      rawTokens.push({ onset: '', vowel: '', mod: '', coda: '', symbol: slpWord[i] });
      i++;
      continue;
    }

    rawTokens.push({ onset: consCluster, vowel, mod, coda: '' });
  }

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
        prev.coda += cur.onset;
        continue;
      }
    }
    merged.push(cur);
  }

  for (let idx = 1; idx < merged.length; idx++) {
    const prev = merged[idx - 1];
    const cur = merged[idx];
    if (!prev || !cur || prev.symbol || cur.symbol || !prev.vowel || !cur.vowel) continue;
    if (prev.mod || prev.coda) continue;

    const cluster = cur.onset;
    if (cluster.length >= 2) {
      const candidateWhole = cluster + cur.vowel + cur.mod;
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

export function resolveModifiers(
  mod: string,
  vowel: string,
  nextOnsetChar: string,
  enableAssimilation: boolean
): { mMod: string; tMod: string; modNote: string } {
  if (!mod) return { mMod: '', tMod: '', modNote: '' };
  let mMod = '';
  let tMod = '';
  const notes: string[] = [];

  if (mod.includes('M') || mod.includes('~')) {
    if (enableAssimilation && nextOnsetChar) {
      if ('kKgGN'.includes(nextOnsetChar)) {
        mMod += '昂'; tMod += '僧'; notes.push('随韵ṃ遇喉音同化为[ŋ]');
      } else if ('cCjJYSy'.includes(nextOnsetChar)) {
        mMod += '恩'; tMod += '若'; notes.push('随韵ṃ遇颚音同化为[ɲ]');
      } else if ('wWqQRtTdDnsz'.includes(nextOnsetChar)) {
        mMod += '恩'; tMod += '僧'; notes.push('随韵ṃ遇齿/卷舌音同化为[n]');
      } else {
        mMod += '姆'; tMod += '牟'; notes.push('随韵ṃ闭唇鼻音[m]');
      }
    } else {
      mMod += '姆';
      tMod += '南';
      notes.push('随韵空点鼻音(Anusvāra)');
    }
  }

  if (mod.includes('H')) {
    if (enableAssimilation) {
      if (vowel === 'i' || vowel === 'I') { mMod += '希'; tMod += '醯'; }
      else if (vowel === 'u' || vowel === 'U') { mMod += '呼'; tMod += '虎'; }
      else if (vowel === 'e' || vowel === 'E') { mMod += '嘿'; tMod += '醯'; }
      else if (vowel === 'o' || vowel === 'O') { mMod += '豁'; tMod += '呼'; }
      else if (vowel === 'f' || vowel === 'F') { mMod += '里希'; tMod += '哩醯'; }
      else { mMod += '哈'; tMod += '诃'; }
      notes.push('止韵ḥ涅槃点元音回响');
    } else {
      mMod += '哈';
      tMod += '诃';
      notes.push('止韵涅槃点送气(Visarga)');
    }
  }

  return { mMod, tMod, modNote: notes.join('·') };
}

export interface TransliterationOptions {
  assimilate?: boolean;
  longMarkSymbol?: string;
}

export function analyzeSanskritWord(
  slpWord: string,
  options: TransliterationOptions = {}
): AnalyzedSyllable[] {
  const { assimilate = true, longMarkSymbol = '～' } = options;
  const tokens = syllabifySlp1Word(slpWord);
  const syllables: AnalyzedSyllable[] = [];

  for (let idx = 0; idx < tokens.length; idx++) {
    const tk = tokens[idx];
    const nextTk = tokens[idx + 1];
    const nextOnsetChar = nextTk && nextTk.onset ? nextTk.onset[0] : '';

    if (tk.symbol !== undefined) {
      syllables.push({
        rawSlp: tk.symbol,
        iast: tk.symbol,
        devanagari: tk.symbol === '|' ? '।' : tk.symbol,
        siddham: tk.symbol === '|' ? '𑗂' : tk.symbol,
        ipa: '',
        modernPhonetic: tk.symbol === "'" ? '·' : tk.symbol,
        tangTranslit: tk.symbol === '|' ? '।' : '',
        meter: '',
        weightLabel: '符号',
        varga: '句读符号',
        note: tk.symbol === "'" ? '省音符 Avagraha' : '梵文句读符 Daṇḍa',
        f1: 500,
        f2: 1500,
        baseDurationSec: 0.1,
        isSymbol: true
      });
      continue;
    }

    const rawSyl = tk.onset + tk.vowel + tk.mod + tk.coda;
    const nextClusterLen = nextTk && nextTk.onset ? nextTk.onset.length : 0;
    const isGuru =
      LONG_VOWELS.has(tk.vowel) || Boolean(tk.mod) || Boolean(tk.coda) || nextClusterLen >= 2;
    const meter: '—' | '⌣' | '' = tk.vowel ? (isGuru ? '—' : '⌣') : '';
    const weightLabel = isGuru ? 'Guru (重音·2拍)' : 'Laghu (轻音·1拍)';
    const [f1, f2, baseDurationSec] = VOWEL_FORMANTS[tk.vowel || 'a'] || [720, 1240, 0.24];

    const buildNode = (
      m: string,
      t: string,
      varga: string,
      note: string
    ): AnalyzedSyllable => ({
      rawSlp: rawSyl,
      iast: slp1ToIast(rawSyl),
      devanagari: slp1ToDevanagari(rawSyl),
      siddham: slp1ToSiddham(rawSyl),
      ipa: slp1ToIpa(rawSyl),
      modernPhonetic: m,
      tangTranslit: t,
      meter,
      weightLabel,
      varga,
      note,
      f1,
      f2,
      baseDurationSec
    });

    if (tk.isOm || SYLLABLE_OVERRIDES[rawSyl]) {
      const ov = tk.isOm ? SYLLABLE_OVERRIDES['oM'] : SYLLABLE_OVERRIDES[rawSyl];
      let mText = ov.m;
      const tText = ov.t;
      if (longMarkSymbol && INHERENT_LONG_VOWELS.has(tk.vowel) && !tk.mod && !tk.coda) {
        mText += longMarkSymbol;
      }
      if (rawSyl === 'saM' && assimilate && nextOnsetChar) {
        const { mMod } = resolveModifiers('M', 'a', nextOnsetChar, true);
        mText = '萨' + mMod;
      }
      syllables.push(
        buildNode(
          mText,
          tText,
          '种子字/特例音节',
          `${ov.note} · ${weightLabel}`
        )
      );
      continue;
    }

    const baseWithoutCoda = tk.onset + tk.vowel + tk.mod;
    if (tk.coda && SYLLABLE_OVERRIDES[baseWithoutCoda]) {
      const ov = SYLLABLE_OVERRIDES[baseWithoutCoda];
      let codaM = '';
      let codaT = '';
      for (const c of tk.coda) {
        codaM += CONS_MATRIX[c]?.bare[0] ?? '';
        codaT += CONS_MATRIX[c]?.bare[1] ?? '';
      }
      const lMark =
        longMarkSymbol && INHERENT_LONG_VOWELS.has(tk.vowel) && !tk.mod ? longMarkSymbol : '';
      syllables.push(
        buildNode(
          ov.m + lMark + codaM,
          ov.t + codaT,
          '复合闭音节',
          `${ov.note} + 收音[-${slp1ToIast(tk.coda)}]`
        )
      );
      continue;
    }

    if (tk.onset && !tk.vowel) {
      const mParts: string[] = [];
      const tParts: string[] = [];
      for (const c of tk.onset) {
        mParts.push(CONS_MATRIX[c]?.bare[0] ?? c);
        tParts.push(CONS_MATRIX[c]?.bare[1] ?? c);
      }
      syllables.push(
        buildNode(
          `(${mParts.join('')})`,
          tParts.join(''),
          CONS_MATRIX[tk.onset[0]]?.varga ?? '纯辅音',
          '去元音收音辅音 (Virāma)'
        )
      );
      continue;
    }

    if (!tk.onset && tk.vowel) {
      let [mBase, tBase] = VOWEL_DUAL_MAP[tk.vowel] || [tk.vowel, tk.vowel];
      if (longMarkSymbol && INHERENT_LONG_VOWELS.has(tk.vowel)) {
        mBase += longMarkSymbol;
      }
      const { mMod, tMod, modNote } = resolveModifiers(tk.mod, tk.vowel, nextOnsetChar, assimilate);
      let codaM = '';
      let codaT = '';
      for (const c of tk.coda) {
        codaM += CONS_MATRIX[c]?.bare[0] ?? '';
        codaT += CONS_MATRIX[c]?.bare[1] ?? '';
      }
      syllables.push(
        buildNode(
          mBase + mMod + codaM,
          tBase + tMod + codaT,
          '十四摩多 (独立元音)',
          (LONG_VOWELS.has(tk.vowel) ? '独立长元音(引)' : '独立短元音') +
            (modNote ? ` · ${modNote}` : '') +
            (tk.coda ? ` · 收音[-${slp1ToIast(tk.coda)}]` : '')
        )
      );
      continue;
    }

    let prefixM = '';
    let prefixT = '';
    let prefixCons = tk.onset.slice(0, -1);
    let mainCons = tk.onset.slice(-1);
    let isSpecialConjunct = false;
    let specialNote = '';

    if (tk.onset.endsWith('kz')) {
      prefixCons = tk.onset.slice(0, -2);
      for (const c of prefixCons) {
        prefixM += CONS_MATRIX[c]?.bare[0] ?? '';
        prefixT += CONS_MATRIX[c]?.bare[1] ?? '';
      }
      prefixM += '克';
      mainCons = 'z';
      isSpecialConjunct = true;
      specialNote = '二合复辅音[kṣ]';
    } else if (tk.onset.endsWith('jY')) {
      prefixCons = tk.onset.slice(0, -2);
      for (const c of prefixCons) {
        prefixM += CONS_MATRIX[c]?.bare[0] ?? '';
        prefixT += CONS_MATRIX[c]?.bare[1] ?? '';
      }
      prefixM += '佳';
      mainCons = 'Y';
      isSpecialConjunct = true;
      specialNote = '二合复辅音[jñ]';
    } else {
      for (const c of prefixCons) {
        prefixM += CONS_MATRIX[c]?.bare[0] ?? '';
        prefixT += CONS_MATRIX[c]?.bare[1] ?? '';
      }
    }

    const vIdx = VOWEL_INDEX[tk.vowel] ?? 0;
    const cEntry = CONS_MATRIX[mainCons] || CONS_MATRIX['k'];
    let mainM = cEntry.m[vIdx];
    const mainT =
      isSpecialConjunct && tk.onset.endsWith('kz')
        ? ['叉', '絺', '刍', '刹哩', '制', '差', '初', '抄'][vIdx]
        : isSpecialConjunct && tk.onset.endsWith('jY')
          ? ['若', '若', '如', '若哩', '若', '若', '若', '若'][vIdx]
          : cEntry.t[vIdx];

    if (longMarkSymbol && INHERENT_LONG_VOWELS.has(tk.vowel)) {
      mainM += longMarkSymbol;
    }

    const { mMod, tMod, modNote } = resolveModifiers(tk.mod, tk.vowel, nextOnsetChar, assimilate);
    let codaM = '';
    let codaT = '';
    if (tk.coda) {
      for (const c of tk.coda) {
        if (
          nextOnsetChar &&
          (c === nextOnsetChar ||
            (c === 'd' && nextOnsetChar === 'D') ||
            (c === 't' && nextOnsetChar === 'T'))
        ) {
          codaT += CONS_MATRIX[c]?.bare[1] ?? '';
        } else {
          codaM += CONS_MATRIX[c]?.bare[0] ?? '';
          codaT += CONS_MATRIX[c]?.bare[1] ?? '';
        }
      }
    }

    const noteParts: string[] = [];
    if (prefixCons && !isSpecialConjunct) noteParts.push(`二合前置[${slp1ToIast(prefixCons)}-]`);
    if (specialNote) noteParts.push(specialNote);
    noteParts.push(cEntry.note);
    if (LONG_VOWELS.has(tk.vowel)) noteParts.push('长音(引)');
    if (modNote) noteParts.push(modNote);
    if (tk.coda) noteParts.push(`闭音节收音[-${slp1ToIast(tk.coda)}]`);

    syllables.push(
      buildNode(
        prefixM + mainM + mMod + codaM,
        prefixT + mainT + tMod + codaT,
        cEntry.varga,
        noteParts.join(' · ')
      )
    );
  }

  return syllables;
}

export function analyzeSanskritSentence(
  inputText: string,
  mode: 'smart' | 'strict' | 'slp1' = 'smart',
  options: TransliterationOptions = {}
): {
  slp1: string;
  iast: string;
  devanagari: string;
  siddham: string;
  ipa: string;
  modernFull: string;
  tradFull: string;
  syllables: AnalyzedSyllable[];
  guruCount: number;
  laghuCount: number;
} {
  const slp1 = inputToSlp1(inputText.trim(), mode);
  const iast = slp1ToIast(slp1);
  const devanagari = slp1ToDevanagari(slp1);
  const siddham = slp1ToSiddham(slp1);
  const ipa = slp1ToIpa(slp1);

  const rawWords = slp1.replace(/-/g, ' ').split(/\s+/).filter(Boolean);
  const modernWords: string[] = [];
  const tradWords: string[] = [];
  const allSyllables: AnalyzedSyllable[] = [];
  let guruCount = 0;
  let laghuCount = 0;

  for (const w of rawWords) {
    const syls = analyzeSanskritWord(w, options);
    if (syls.length === 1 && syls[0].isSymbol) {
      modernWords.push(syls[0].modernPhonetic);
      tradWords.push(syls[0].tangTranslit || '।');
      continue;
    }
    const wordModern = syls.filter(s => !s.isSymbol).map(s => s.modernPhonetic).join('');
    const wordTrad =
      TRAD_WORD_REPLACEMENTS[w] || syls.filter(s => !s.isSymbol).map(s => s.tangTranslit).join('');
    modernWords.push(wordModern);
    tradWords.push(wordTrad);

    for (const s of syls) {
      if (!s.isSymbol) {
        allSyllables.push(s);
        if (s.meter === '—') guruCount++;
        if (s.meter === '⌣') laghuCount++;
      }
    }
  }

  return {
    slp1,
    iast,
    devanagari,
    siddham,
    ipa,
    modernFull: modernWords.join('  '),
    tradFull: tradWords.join(' '),
    syllables: allSyllables,
    guruCount,
    laghuCount
  };
}
