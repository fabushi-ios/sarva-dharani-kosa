/**
 * src/core/sanskrit/phoneticMapper.ts
 *
 * Professor-Grade Deterministic Sanskrit Phonological & Phonetic Engine:
 * 1. Complete 34 × 14 Akṣara Phonetic Matrix (Modern Mandarin Phonetics & Tang Siddhaṃ Classical Orthography)
 *    with zero Extension-B tofu characters, zero Siddhaṃ leakage, and zero fallback concatenation artifacts.
 * 2. Standard Sub-Syllabic Subscript Notation (`₍...₎` -> UI `<sub class="phon-sub">...</sub>`):
 *    - Enforces 1-to-1 Akṣara-to-Full-Character isomorphism: every Sanskrit syllable has exactly 1 full-sized
 *      Chinese character for its vocalic/nasal nucleus, while vowelless onset prefixes (`svā` -> `₍斯₎瓦`,
 *      `hrīḥ` -> `₍赫₎里₍希₎`), Virāma codas (`phaṭ` -> `帕₍特₎`, `sarva` -> `萨₍尔₎瓦`, `padme` -> `巴₍德₎美`),
 *      and Visarga breath releases (`namaḥ` -> `拿玛₍赫₎`, `āḥ` -> `阿₍赫₎`, `raḥ` -> `啦₍赫₎`) are rendered in
 *      small subscript notation per professional Sino-Sanskrit phonetic standards.
 * 3. Context-Aware Śikṣā Sandhi & Coarticulation:
 *    - Abhinidhāna (Homorganic geminate stop closure absorption: bud-dhā -> 布达, sat-tvā -> 萨₍特₎瓦, sid-dhe -> 悉叠)
 *    - Parasavarṇa (Anusvāra ṃ place-of-articulation assimilation: [ŋ] velar, [ɲ/ɳ/n̪] coronal, [m/m̃] labial/final)
 *    - Single-Character Mandarin Nasal Rhyme Synthesis (man -> 曼, cin -> 津, śān -> 善, kaṇ -> 干, khūṃ -> 空)
 *    - Full Śikṣā Vowel-Colored Visarga ḥ (-aḥ/-āḥ/-oḥ -> ₍赫₎, -iḥ/-īḥ/-aiḥ -> ₍希₎, -eḥ -> ₍嘿₎, -uḥ/-ūḥ/-auḥ -> ₍忽₎)
 *    - Pre-Palatal Repha Svarabhakti (-r before y- -> ₍哩₎: ār-yā -> 阿₍哩₎呀, vai-ḍūr-ya -> 歪杜₍哩₎呀)
 *    - Dual-Mode Onset Cluster Prefixes (palatal glide before -y vs minimal schwa before -r/-l/-v/stops)
 * 4. Sanskrit Samāsa Compound Stem Hyphenator for long polysyllabic compounds.
 * 5. 100% Unified Single-Source-of-Truth between Verse-Level "梵音拼读参考" and Syllable-Level "逐音节三体对照跟读卡".
 */

import { cleanEditorialIast } from './transliterator';
import {
  analyzeSanskritProsody,
  tokenizeWordPhonemes,
  type SyllableAnalysis,
} from './prosody';

export const PHONETIC_SUB_OPEN = '₍'; // U+208D (BMP-safe subscript delimiter)
export const PHONETIC_SUB_CLOSE = '₎'; // U+208E (BMP-safe subscript delimiter)

export interface PhoneticRichSegment {
  text: string;
  kind: 'normal' | 'sub' | 'iast';
}

/**
 * Wraps vowelless sub-syllabic Chinese phonetic characters (Visarga -ḥ, Virāma coda, conjunct onset)
 * in BMP-safe subscript delimiters `₍...₎` for UI `<sub class="phon-sub">` rendering.
 */
export function wrapSubscriptPhonetic(text: string): string {
  if (!text) return '';
  const clean = text.replace(/[₍₎]/g, '');
  return clean ? `${PHONETIC_SUB_OPEN}${clean}${PHONETIC_SUB_CLOSE}` : '';
}

/**
 * Merges adjacent `₎₍` runs within a syllable into a single contiguous `₍...₎` group
 * (e.g., `₍特₎₍哩₎呀` -> `₍特哩₎呀`, `₍吉₎₍尼₎亚` -> `₍吉尼₎亚`).
 */
export function coalesceSubscriptRuns(text: string): string {
  if (!text) return '';
  return text.replace(/₎₍/g, '');
}

/**
 * Strips `₍` and `₎` subscript markers for plain-text search indexing or TTS speech synthesis.
 */
export function stripPhoneticSubscriptMarkers(text: string): string {
  if (!text) return '';
  return text.replace(/[₍₎]/g, '');
}

const IAST_PAREN_TOKEN_RE =
  /^\([a-zA-ZāīūṛṝḷḹēōṃṁḥṅñṭḍṇśṣĀĪŪṚṜḶḸĒŌṂḤṄÑṬḌṆŚṢ'\u0310\s.|/-]+\)/;

/**
 * Parses a phonetic display string into coalesced rich typographic segments:
 * - `'sub'`: vowelless sub-syllabic characters inside `₍...₎` (coalescing adjacent `₎₍` across syllable joins)
 * - `'iast'`: parenthesized `(iast)` annotations when bracket display is enabled
 * - `'normal'`: full-sized syllabic Chinese characters and separators
 */
export function parsePhoneticRichSegments(text: string): PhoneticRichSegment[] {
  if (!text) return [];
  const merged = text.replace(/₎₍/g, '');
  const segments: PhoneticRichSegment[] = [];
  let i = 0;

  const pushSeg = (kind: PhoneticRichSegment['kind'], chunk: string) => {
    if (!chunk) return;
    const prev = segments[segments.length - 1];
    if (prev && prev.kind === kind) {
      prev.text += chunk;
    } else {
      segments.push({ text: chunk, kind });
    }
  };

  while (i < merged.length) {
    const ch = merged[i];
    if (ch === PHONETIC_SUB_OPEN) {
      const closeIdx = merged.indexOf(PHONETIC_SUB_CLOSE, i + 1);
      if (closeIdx === -1) {
        // Gracefully handle truncated search snippets with unclosed `₍`
        pushSeg('sub', merged.slice(i + 1));
        break;
      }
      pushSeg('sub', merged.slice(i + 1, closeIdx));
      i = closeIdx + 1;
      continue;
    }
    if (ch === PHONETIC_SUB_CLOSE) {
      i += 1;
      continue;
    }
    if (ch === '(') {
      const iastMatch = merged.slice(i).match(IAST_PAREN_TOKEN_RE);
      if (iastMatch) {
        pushSeg('iast', iastMatch[0]);
        i += iastMatch[0].length;
        continue;
      }
    }
    let nextSpecial = i + 1;
    while (
      nextSpecial < merged.length &&
      merged[nextSpecial] !== PHONETIC_SUB_OPEN &&
      merged[nextSpecial] !== PHONETIC_SUB_CLOSE &&
      merged[nextSpecial] !== '('
    ) {
      nextSpecial++;
    }
    pushSeg('normal', merged.slice(i, nextSpecial));
    i = nextSpecial;
  }

  return segments;
}

export interface SyllablePhoneticContext {
  onset?: string[];
  vowel?: string;
  modifiers?: string[];
  coda?: string[];
  isWordStart?: boolean;
  isWordEnd?: boolean;
  sameSubwordNext?: boolean;
  acrossPauseNext?: boolean;
  nextOnset?: string[];
}

export interface EnrichedPhoneticSyllable extends SyllableAnalysis {
  classicalZh: string;
  modernZh: string;
  compoundHyphenBefore: boolean;
}

/**
 * Authoritative Classical Tang/Song Sūtra whole-word transliterations & glosses
 * (used for Classical Chinese fallback & word-level vyākaraṇa glossing).
 */
const WORD_CLASSICAL_DICTIONARY: Record<
  string,
  { classicalZh: string; meaningZh?: string }
> = {
  om: { classicalZh: '唵', meaningZh: '三身总持圣音' },
  oṃ: { classicalZh: '唵', meaningZh: '三身总持圣音' },
  namo: { classicalZh: '南无 / 曩谟', meaningZh: '归命、敬礼' },
  namaḥ: { classicalZh: '曩莫', meaningZh: '归命、顶礼' },
  namas: { classicalZh: '曩莫', meaningZh: '归命、顶礼' },
  nama: { classicalZh: '曩莫', meaningZh: '归命' },
  nam: { classicalZh: '喃', meaningZh: '敬礼/句尾鼻音' },
  naṃ: { classicalZh: '喃', meaningZh: '敬礼/句尾随韵' },
  nām: { classicalZh: '喃', meaningZh: '诸尊（属格复数尾音）' },
  nāṃ: { classicalZh: '喃', meaningZh: '诸尊（属格复数尾音）' },
  buddhāya: { classicalZh: '佛驮耶 / 没驮耶', meaningZh: '向佛陀觉者' },
  dharmāya: { classicalZh: '达摩耶', meaningZh: '向正法' },
  saṃghāya: { classicalZh: '僧伽耶', meaningZh: '向圣僧伽' },
  bhagavate: { classicalZh: '薄伽伐帝 / 婆誐嚩帝', meaningZh: '向世尊' },
  bhagavatyai: { classicalZh: '婆誐嚩底曳', meaningZh: '向世尊佛母' },
  ratnatrayāya: { classicalZh: '喝啰怛那哆啰夜耶', meaningZh: '向三宝' },
  tathāgatāya: { classicalZh: '怛他蘖多耶', meaningZh: '向如来' },
  arhate: { classicalZh: '阿啰诃帝', meaningZh: '向应供' },
  samyaksaṃbuddhāya: { classicalZh: '三藐三没驮耶', meaningZh: '向正等正觉' },
  samantabuddhānām: { classicalZh: '三曼多没驮喃', meaningZh: '普遍一切诸佛' },
  samantabuddhānāṃ: { classicalZh: '三曼多没驮喃', meaningZh: '普遍一切诸佛' },
  ārya: { classicalZh: '阿哩耶', meaningZh: '圣尊' },
  āryāvalokiteśvarāya: { classicalZh: '阿唎耶婆卢羯帝烁钵啰耶', meaningZh: '向圣观自在菩萨' },
  avalokiteśvarāya: { classicalZh: '阿嚩卢枳帝湿嚩啰耶', meaningZh: '向观自在菩萨' },
  bodhisattvāya: { classicalZh: '菩提萨埵耶 / 冒地萨怛嚩耶', meaningZh: '向菩萨' },
  mahāsattvāya: { classicalZh: '摩诃萨埵耶', meaningZh: '向摩诃萨（大有情）' },
  mahākāruṇikāya: { classicalZh: '摩诃迦噜抳迦耶', meaningZh: '向大悲圣尊' },
  tadyathā: { classicalZh: '怛侄他 / 怛你也他', meaningZh: '即说咒曰' },
  svāhā: { classicalZh: '娑嚩诃 / 萨婆诃', meaningZh: '圆满吉祥成就' },
  hūṃ: { classicalZh: '吽', meaningZh: '金刚不坏心印' },
  phaṭ: { classicalZh: '泮吒 / 发吒', meaningZh: '摧破魔障' },
  hrīḥ: { classicalZh: '纥哩', meaningZh: '莲华部种子字' },
  dhīḥ: { classicalZh: '地 / 谛', meaningZh: '文殊般若种子字' },
  bhrūṃ: { classicalZh: '勃笼', meaningZh: '佛顶尊胜一字心' },
  gate: { classicalZh: '揭谛', meaningZh: '度越吧' },
  pāragate: { classicalZh: '波罗揭谛', meaningZh: '度向彼岸吧' },
  pārasaṃgate: { classicalZh: '波罗僧揭谛', meaningZh: '普同度至彼岸吧' },
  bodhi: { classicalZh: '菩提 / 冒地', meaningZh: '正觉菩提' },
  sarva: { classicalZh: '萨嚩 / 萨婆', meaningZh: '一切' },
  mahā: { classicalZh: '摩诃', meaningZh: '大、广大' },
  vajra: { classicalZh: '嚩日啰 / 跋折罗', meaningZh: '金刚' },
  padme: { classicalZh: '钵讷铭', meaningZh: '莲华中' },
  padma: { classicalZh: '钵纳摩', meaningZh: '莲华' },
  maṇi: { classicalZh: '摩抳', meaningZh: '摩尼宝珠' },
  maṇipadme: { classicalZh: '摩抳钵讷铭', meaningZh: '持摩尼宝与莲华尊' },
  śuddhe: { classicalZh: '戍第', meaningZh: '清净尊' },
  viśuddhe: { classicalZh: '尾戍第', meaningZh: '最极清净尊' },
  tathāgatānām: { classicalZh: '怛他孽多喃', meaningZh: '诸诸如来（属格复数）' },
  tathāgatānāṃ: { classicalZh: '怛他孽多喃', meaningZh: '诸诸如来（属格复数）' },
  sarvatathāgatānām: { classicalZh: '萨嚩怛他孽多喃', meaningZh: '一切诸诸如来' },
  sarvatathāgatānāṃ: { classicalZh: '萨嚩怛他孽多喃', meaningZh: '一切诸诸如来' },
  sarvabuddhabodhisattvebhyaḥ: { classicalZh: '萨嚩没驮冒地萨怛吠毗药', meaningZh: '向一切诸佛菩萨' },
  sarvasattvānām: { classicalZh: '萨嚩萨埵喃', meaningZh: '一切诸有情众生' },
  sarvasattvānāṃ: { classicalZh: '萨嚩萨埵喃', meaningZh: '一切诸有情众生' },
};

/**
 * 8 Vowel Quality Indices for the 34 × 8 Phonetic Quality Matrix:
 * 0: a / ā
 * 1: i / ī
 * 2: u / ū
 * 3: ṛ / ṝ / ḷ / ḹ
 * 4: e
 * 5: ai
 * 6: o
 * 7: au
 */
const VOWEL_QUALITY_IDX: Record<string, number> = {
  a: 0,
  ā: 0,
  i: 1,
  ī: 1,
  u: 2,
  ū: 2,
  ṛ: 3,
  ṝ: 3,
  ḷ: 3,
  ḹ: 3,
  e: 4,
  ai: 5,
  o: 6,
  au: 7,
};

const INHERENT_LONG_SET = new Set(['ā', 'ī', 'ū', 'ṝ', 'ḹ']);

/**
 * Standalone Independent Vowels (Svara)
 */
const INDEPENDENT_VOWEL_MAP: Record<string, { modern: string; tang: string }> = {
  a: { modern: '阿', tang: '阿' },
  ā: { modern: '阿', tang: '阿(引)' },
  i: { modern: '伊', tang: '伊' },
  ī: { modern: '伊', tang: '伊(引)' },
  u: { modern: '乌', tang: '坞' },
  ū: { modern: '乌', tang: '污(引)' },
  ṛ: { modern: '日', tang: '哩' },
  ṝ: { modern: '日', tang: '哩(引)' },
  ḷ: { modern: '里', tang: '里' },
  ḹ: { modern: '里', tang: '里(引)' },
  e: { modern: '诶', tang: '翳' },
  ai: { modern: '爱', tang: '蔼' },
  o: { modern: '欧', tang: '污' },
  au: { modern: '奥', tang: '奥' },
};

type EightRow = [string, string, string, string, string, string, string, string];

/**
 * Complete 34-Consonant × 8-Vowel-Quality Modern Mandarin Phonetic Matrix (`CV_MODERN_MATRIX`)
 * Every cell has exactly 1 full-sized Chinese syllable nucleus character, with vowelless consonant
 * onsets before vocalic `ṛ/ṝ` (or `ṅ/ñ` glides) marked as small subscripts `₍...₎`:
 * - Vocalic `ṛ/ṝ` (Mūrdhanya rhotic vowel `[r̩ / ɻ̩]`) uses retroflex syllabic `'日'` (`hṛ` -> `'₍赫₎日'`).
 * - Retroflex sibilant `ṣ` (`[ʂ]`) uses `'沙 / 师 / 舒 / ₍师₎日 / 奢 / 筛 / 硕 / 稍'` (distinct from palatal `ś` `'希/谢'` and dental `s` `'悉/塞'`).
 * - Unaspirated stops (`k, c, ṭ, t, p`) strictly map to Mandarin unaspirated `[k, tɕ, t, p]` (`pe` -> `'贝'`, distinct from aspirated `phe` -> `'佩'`).
 * [a/ā, i/ī, u/ū, ṛ/ṝ, e, ai, o, au]
 */
const CV_MODERN_MATRIX: Record<string, EightRow> = {
  // Ka-varga (Velars 喉音)
  k:  ['嘎', '给', '古', '₍克₎日', '给', '该', '果', '高'],
  kh: ['卡', '奇', '库', '₍克₎日', '开', '凯', '阔', '考'],
  g:  ['嘎', '吉', '古', '₍格₎日', '给', '该', '果', '高'],
  gh: ['嘎', '吉', '古', '₍格₎日', '给', '该', '果', '高'],
  ṅ:  ['昂', '₍昂₎伊', '₍昂₎乌', '₍昂₎日', '₍昂₎诶', '₍昂₎爱', '₍昂₎欧', '₍昂₎奥'],

  // Ca-varga (Palatals 颚音)
  c:  ['佳', '吉', '主', '₍吉₎日', '杰', '斋', '卓', '招'],
  ch: ['恰', '奇', '楚', '₍奇₎日', '切', '拆', '绰', '超'],
  j:  ['佳', '吉', '居', '₍吉₎日', '杰', '斋', '久', '焦'],
  jh: ['佳', '吉', '居', '₍吉₎日', '杰', '斋', '久', '焦'],
  ñ:  ['₍尼₎亚', '尼', '纽', '₍尼₎日', '涅', '₍尼₎崖', '₍尼₎优', '₍尼₎妖'],

  // Ṭa-varga (Retroflexes 卷舌顶音)
  ṭ:  ['达', '蒂', '度', '₍特₎日', '帝', '呆', '多', '刀'],
  ṭh: ['他', '提', '图', '₍特₎日', '提', '胎', '托', '掏'],
  ḍ:  ['达', '迪', '杜', '₍德₎日', '叠', '代', '多', '导'],
  ḍh: ['达', '迪', '杜', '₍德₎日', '叠', '代', '多', '导'],
  ṇ:  ['拿', '尼', '努', '₍尼₎日', '内', '乃', '诺', '挠'],

  // Ta-varga (Dentals 齿音)
  t:  ['达', '帝', '度', '₍特₎日', '帝', '呆', '多', '刀'],
  th: ['他', '提', '图', '₍特₎日', '提', '泰', '托', '涛'],
  d:  ['达', '地', '杜', '₍德₎日', '叠', '代', '多', '道'],
  dh: ['达', '地', '杜', '₍德₎日', '叠', '代', '多', '道'],
  n:  ['拿', '尼', '努', '₍尼₎日', '内', '奈', '诺', '恼'],

  // Pa-varga (Labials 唇音)
  p:  ['巴', '比', '布', '₍普₎日', '贝', '拜', '波', '包'],
  ph: ['帕', '批', '普', '₍普₎日', '佩', '派', '坡', '抛'],
  b:  ['巴', '比', '布', '₍布₎日', '贝', '白', '博', '包'],
  bh: ['巴', '比', '布', '₍布₎日', '贝', '拜', '博', '包'],
  m:  ['玛', '米', '穆', '₍姆₎日', '美', '麦', '摩', '毛'],

  // Antaḥstha & Ūṣman (Semivowels & Sibilants 半元音与擦音)
  y:  ['呀', '伊', '尤', '₍伊₎日', '耶', '崖', '优', '妖'],
  r:  ['啦', '里', '鲁', '日',     '雷', '来', '洛', '劳'],
  l:  ['啦', '利', '卢', '₍勒₎日', '雷', '赖', '洛', '牢'],
  v:  ['瓦', '维', '武', '₍维₎日', '威', '歪', '沃', '沃'],
  ś:  ['沙', '希', '舒', '₍希₎日', '谢', '晒', '硕', '烧'],
  ṣ:  ['沙', '师', '舒', '₍师₎日', '奢', '筛', '硕', '稍'],
  s:  ['萨', '悉', '苏', '₍斯₎日', '塞', '赛', '索', '骚'],
  h:  ['哈', '嘿', '呼', '₍赫₎日', '嘿', '嗨', '霍', '豪'],
};

/**
 * Complete 34-Consonant × 8-Vowel-Quality Classical Tang Siddhaṃ Matrix (`CV_TANG_MATRIX`)
 * 100% BMP-safe Unicode characters (zero Extension-B tofu glyphs, zero Siddhaṃ leakage).
 */
const CV_TANG_MATRIX: Record<string, EightRow> = {
  k:  ['迦', '枳', '矩', '讫哩', '计', '皆', '俱', '憍'],
  kh: ['佉', '企', '区', '企哩', '契', '楷', '寇', '考'],
  g:  ['誐', '拟', '具', '吃哩', '诣', '盖', '瞿', '豪'],
  gh: ['伽', '祇', '具', '伽哩', '诣', '慨', '瞿', '豪'],
  ṅ:  ['仰', '儗', '隅', '仰哩', '倪', '捱', '悟', '敖'],

  c:  ['者', '只', '主', '室哩', '制', '斋', '祖', '昭'],
  ch: ['车', '齿', '刍', '痴哩', '掣', '差', '初', '抄'],
  j:  ['惹', '自', '儒', '日哩', '逝', '惹', '树', '招'],
  jh: ['社', '时', '殊', '社哩', '誓', '寨', '祚', '召'],
  ñ:  ['若', '你', '柔', '若哩', '泥', '乃', '尿', '饶'],

  ṭ:  ['吒', '置', '都', '致哩', '致', '斋', '都', '嘲'],
  ṭh: ['侘', '耻', '偷', '耻哩', '体', '泰', '侘', '滔'],
  ḍ:  ['拏', '腻', '度', '荼哩', '提', '代', '度', '陶'],
  ḍh: ['茶', '腻', '度', '荼哩', '提', '代', '度', '陶'],
  ṇ:  ['拏', '抳', '怒', '拏哩', '宁', '乃', '诺', '闹'],

  t:  ['怛', '底', '都', '底哩', '帝', '带', '睹', '刀'],
  th: ['他', '耻', '土', '他哩', '替', '太', '吐', '讨'],
  d:  ['捺', '地', '努', '陀哩', '泥', '代', '怒', '道'],
  dh: ['驮', '地', '度', '驮哩', '第', '代', '度', '道'],
  n:  ['曩', '你', '努', '那哩', '祢', '乃', '怒', '恼'],

  p:  ['跛', '比', '补', '钵哩', '闭', '拜', '布', '宝'],
  ph: ['颇', '匹', '普', '颇哩', '沛', '派', '破', '泡'],
  b:  ['跋', '尾', '没', '跋哩', '陛', '败', '冒', '暴'],
  bh: ['婆', '毗', '部', '婆哩', '陛', '拜', '部', '鲍'],
  m:  ['摩', '弭', '母', '蜜哩', '铭', '迈', '谟', '矛'],

  y:  ['耶', '以', '庾', '拽哩', '曳', '耶', '瑜', '要'],
  r:  ['啰', '哩', '噜', '哩',   '隶', '来', '嚧', '牢'],
  l:  ['攞', '里', '噜', '嚧',   '隶', '赖', '路', '劳'],
  v:  ['嚩', '尾', '嚩', '嚩哩', '吠', '吠', '嚩', '嚩'],
  ś:  ['舍', '室', '戍', '室哩', '势', '晒', '戍', '烧'],
  ṣ:  ['洒', '瑟', '刍', '瑟哩', '晒', '晒', '疏', '梢'],
  s:  ['萨', '悉', '苏', '悉哩', '细', '赛', '苏', '骚'],
  h:  ['诃', '呬', '呼', '纥哩', '醯', '海', '护', '豪'],
};

/**
 * Distinct Classical Tang characters for inherent long vowels (ā, ī, ū) where attested in Tang Sūtras
 */
const TANG_LONG_CV_OVERRIDES: Record<string, string> = {
  nā: '那(引)',
  nī: '泥',
  kā: '迦(引)',
  kī: '计',
  kū: '俱',
  gā: '誐(引)',
  cā: '左',
  cī: '支',
  jā: '惹(引)',
  jī: '时',
  ṇā: '拏(引)',
  ṇī: '抳(引)',
  tā: '多',
  tī: '底(引)',
  tū: '都(引)',
  thā: '他(引)',
  dā: '陀',
  dī: '第',
  dhā: '驮(引)',
  dhī: '地(引)',
  pā: '波',
  pū: '布',
  bā: '跋(引)',
  bhā: '婆(引)',
  bhī: '鼻',
  bhū: '部(引)',
  mā: '摩(引)',
  yā: '夜',
  yū: '愉',
  rā: '啰(引)',
  rī: '哩(引)',
  rū: '噜(引)',
  lā: '攞(引)',
  vā: '嚩(引)',
  vī: '味',
  śā: '奢',
  śī: '尸',
  śū: '输',
  sā: '娑',
  sī: '私',
  sū: '素',
  hā: '诃',
  hī: '醯',
  hū: '虎',
};

const TANG_NASAL_CORE_OVERRIDES: Record<string, string> = {
  a: '暗',
  ā: '盎',
  i: '印',
  ī: '印(引)',
  u: '温',
  ū: '温(引)',
  ai: '蔼',
  ka: '剑',
  kā: '剑(引)',
  kha: '欠',
  khā: '欠(引)',
  ga: '俨',
  gā: '俨(引)',
  gha: '憾',
  ca: '瞻',
  ja: '瞻',
  ña: '染',
  ṭa: '站',
  ḍa: '喃',
  ṇa: '喃',
  ṇā: '喃(引)',
  ta: '担',
  tā: '担(引)',
  da: '昙',
  dā: '昙(引)',
  dha: '昙',
  dhā: '昙(引)',
  na: '喃',
  nā: '喃(引)',
  ni: '宁',
  nī: '宁(引)',
  pa: '伴',
  pā: '伴(引)',
  pha: '泛',
  ba: '鍐',
  bā: '鍐(引)',
  bha: '梵',
  bhā: '梵(引)',
  ma: '莽',
  mā: '莽(引)',
  ya: '演',
  yā: '焰',
  ra: '览',
  rā: '囕',
  la: '蓝',
  lā: '蓝(引)',
  va: '鑁',
  vā: '鍐',
  śa: '苫',
  ṣa: '忏',
  sa: '三',
  sā: '三(引)',
  ha: '唅',
  hā: '憾',
  hu: '吽',
  hū: '吽',
};

/**
 * Single-character Mandarin Coronal Nasal (`-n`) Rhyme Table:
 * [a/ā + n, i/ī + n, u/ū + n, ṛ + n, e/ai + n, o/au + n]
 */
type SixNasalRow = [string, string, string, string, string, string];

const NASAL_N_MATRIX: Record<string, SixNasalRow> = {
  '':  ['安', '因', '温', '仁',       '恩',     '温'],
  k:   ['干', '金', '滚', '₍克₎仁',   '根',     '滚'],
  kh:  ['堪', '钦', '坤', '₍克₎仁',   '肯',     '坤'],
  g:   ['甘', '金', '滚', '₍格₎仁',   '根',     '滚'],
  gh:  ['甘', '金', '滚', '₍格₎仁',   '根',     '滚'],
  ṅ:   ['昂', '因', '温', '₍昂₎仁',   '恩',     '翁'],
  c:   ['詹', '津', '准', '₍吉₎仁',   '珍',     '准'],
  ch:  ['产', '亲', '春', '₍奇₎仁',   '嗔',     '春'],
  j:   ['詹', '津', '准', '₍吉₎仁',   '珍',     '准'],
  jh:  ['詹', '津', '准', '₍吉₎仁',   '珍',     '准'],
  ñ:   ['年', '宁', '₍尼₎温', '₍尼₎仁', '年',   '农'],
  ṭ:   ['丹', '丁', '敦', '₍特₎仁',   '得₍恩₎', '敦'],
  ṭh:  ['滩', '听', '吞', '₍特₎仁',   '特₍恩₎', '吞'],
  ḍ:   ['丹', '丁', '敦', '₍德₎仁',   '得₍恩₎', '敦'],
  ḍh:  ['丹', '丁', '敦', '₍德₎仁',   '得₍恩₎', '敦'],
  ṇ:   ['南', '宁', '嫩', '₍尼₎仁',   '嫩',     '农'],
  t:   ['丹', '丁', '敦', '₍特₎仁',   '得₍恩₎', '敦'],
  th:  ['滩', '听', '吞', '₍特₎仁',   '特₍恩₎', '吞'],
  d:   ['丹', '丁', '敦', '₍德₎仁',   '得₍恩₎', '敦'],
  dh:  ['丹', '丁', '敦', '₍德₎仁',   '得₍恩₎', '敦'],
  n:   ['南', '宁', '嫩', '₍尼₎仁',   '嫩',     '农'],
  p:   ['班', '宾', '奔', '₍普₎仁',   '本',     '奔'],
  ph:  ['潘', '拼', '喷', '₍普₎仁',   '盆',     '喷'],
  b:   ['班', '宾', '奔', '₍布₎仁',   '本',     '奔'],
  bh:  ['班', '宾', '奔', '₍布₎仁',   '本',     '奔'],
  m:   ['曼', '民', '闷', '₍姆₎仁',   '门',     '闷'],
  y:   ['延', '因', '晕', '₍伊₎仁',   '延',     '晕'],
  r:   ['兰', '林', '伦', '仁',       '伦',     '伦'],
  l:   ['兰', '林', '伦', '₍勒₎仁',   '伦',     '伦'],
  v:   ['万', '文', '温', '₍维₎仁',   '文',     '温'],
  ś:   ['善', '心', '顺', '₍希₎仁',   '申',     '顺'],
  ṣ:   ['山', '申', '顺', '₍师₎仁',   '申',     '顺'],
  s:   ['散', '辛', '孙', '₍斯₎仁',   '森',     '孙'],
  h:   ['罕', '欣', '昏', '₍赫₎仁',   '痕',     '昏'],
};

/**
 * Single-character Mandarin Velar / Resonant Nasal (`-ng`) Rhyme Table:
 * [a/ā + ng, i/ī + ng, u/ū + ng, ṛ + ng, e/ai + ng, o/au + ng]
 */
const NASAL_NG_MATRIX: Record<string, SixNasalRow> = {
  '':  ['昂', '英', '翁', '仍',     '鞥', '嗡'],
  k:   ['刚', '京', '工', '₍克₎仍', '耕', '工'],
  kh:  ['康', '卿', '空', '₍克₎仍', '坑', '空'],
  g:   ['刚', '京', '工', '₍格₎仍', '耕', '工'],
  gh:  ['刚', '京', '工', '₍格₎仍', '耕', '工'],
  ṅ:   ['昂', '英', '翁', '₍昂₎仍', '鞥', '翁'],
  c:   ['章', '精', '中', '₍吉₎仍', '征', '中'],
  ch:  ['昌', '清', '充', '₍奇₎仍', '称', '充'],
  j:   ['章', '精', '中', '₍吉₎仍', '征', '中'],
  jh:  ['章', '精', '中', '₍吉₎仍', '征', '中'],
  ñ:   ['娘', '宁', '浓', '₍尼₎仍', '宁', '浓'],
  ṭ:   ['当', '丁', '东', '₍特₎仍', '登', '东'],
  ṭh:  ['汤', '听', '通', '₍特₎仍', '腾', '通'],
  ḍ:   ['当', '丁', '东', '₍德₎仍', '登', '东'],
  ḍh:  ['当', '丁', '东', '₍德₎仍', '登', '东'],
  ṇ:   ['南', '宁', '农', '₍尼₎仍', '能', '农'],
  t:   ['当', '定', '东', '₍特₎仍', '登', '东'],
  th:  ['汤', '听', '通', '₍特₎仍', '腾', '通'],
  d:   ['当', '定', '东', '₍德₎仍', '登', '东'],
  dh:  ['当', '定', '东', '₍德₎仍', '登', '东'],
  n:   ['南', '宁', '农', '₍尼₎仍', '能', '农'],
  p:   ['邦', '兵', '崩', '₍普₎仍', '崩', '崩'],
  ph:  ['滂', '娉', '烹', '₍普₎仍', '烹', '烹'],
  b:   ['邦', '兵', '崩', '₍布₎仍', '崩', '崩'],
  bh:  ['邦', '兵', '崩', '₍布₎仍', '崩', '崩'],
  m:   ['芒', '明', '蒙', '₍姆₎仍', '盟', '蒙'],
  y:   ['央', '英', '雍', '₍伊₎仍', '英', '雍'],
  r:   ['朗', '灵', '隆', '仍',     '棱', '隆'],
  l:   ['朗', '灵', '隆', '₍勒₎仍', '棱', '隆'],
  v:   ['旺', '文', '翁', '₍维₎仍', '翁', '翁'],
  ś:   ['商', '星', '顺', '₍希₎仍', '生', '顺'],
  ṣ:   ['伤', '生', '顺', '₍师₎仍', '生', '顺'],
  s:   ['桑', '星', '松', '₍斯₎仍', '僧', '松'],
  h:   ['罕', '兴', '吽', '₍赫₎仍', '哼', '轰'],
};

/**
 * Universal Sacred Esoteric Syllables & Exact Akṣara Overrides (valid in any word position)
 * Sub-syllabic vowelless onsets, Virāma codas, and Visarga releases are marked with `₍...₎`.
 */
const UNIVERSAL_AKSARA_OVERRIDES: Record<string, { modern: string; tang: string }> = {
  oṃ: { modern: '嗡', tang: '唵' },
  om: { modern: '嗡', tang: '唵' },
  hūṃ: { modern: '吽', tang: '吽' },
  hum: { modern: '吽', tang: '吽' },
  huṃ: { modern: '吽', tang: '吽' },
  khūṃ: { modern: '空', tang: '吽' },
  hrīḥ: { modern: '₍赫₎里₍希₎', tang: '纥哩' },
  hrīṃ: { modern: '₍赫₎林', tang: '纥哩' },
  dhīḥ: { modern: '迪₍希₎', tang: '地' },
  bhrūṃ: { modern: '₍部₎隆', tang: '勃笼' },
  trūṃ: { modern: '₍特₎隆', tang: '都嚧瓮' },
  ṭrūṃ: { modern: '₍特₎隆', tang: '吒嚧瓮' },
  śrīṃ: { modern: '₍希₎林', tang: '室哩' },
  śrī: { modern: '₍希₎里', tang: '室利' },
  klīṃ: { modern: '₍克₎林', tang: '讫哩' },
  krīṃ: { modern: '₍克₎林', tang: '讫哩' },
  phaṭ: { modern: '帕₍特₎', tang: '泮吒' },
  svā: { modern: '₍斯₎瓦', tang: '娑嚩' },
  pad: { modern: '巴₍德₎', tang: '钵讷' },
  hoḥ: { modern: '霍₍赫₎', tang: '斛' },
  jaḥ: { modern: '佳₍赫₎', tang: '弱' },
  tsa: { modern: '杂', tang: '縒' },
  tsal: { modern: '杂₍尔₎', tang: '縒攞' },
  ysa: { modern: '₍伊₎萨', tang: '也娑' },
};

/**
 * Standalone 1-Syllable Bīja Overrides (applied ONLY when standalone word, not medial saṃ/laṃ/raṃ sandhi)
 */
const STANDALONE_BIJA_OVERRIDES: Record<string, { modern: string; tang: string }> = {
  aiṃ: { modern: '爱₍姆₎', tang: '蔼' },
  vaṃ: { modern: '汪', tang: '鑁' },
  vam: { modern: '汪', tang: '鑁' },
  kham: { modern: '康', tang: '欠' },
  khaṃ: { modern: '康', tang: '欠' },
  ram: { modern: '兰', tang: '览' },
  raṃ: { modern: '朗', tang: '览' },
  lam: { modern: '兰', tang: '蓝' },
  laṃ: { modern: '兰', tang: '蓝' },
  ham: { modern: '罕', tang: '唅' },
  haṃ: { modern: '罕', tang: '唅' },
  mam: { modern: '芒', tang: '莽' },
  maṃ: { modern: '芒', tang: '莽' },
  nam: { modern: '南', tang: '喃' },
  naṃ: { modern: '南', tang: '喃' },
  nām: { modern: '南', tang: '喃(引)' },
  nāṃ: { modern: '南', tang: '喃(引)' },
};

/**
 * Minimal vowelless onset prefix before liquids/glides/stops (-r, -l, -v, stops)
 */
const CLUSTER_PREFIX_MINIMAL: Record<string, { modern: string; tang: string }> = {
  k: { modern: '克', tang: '讫' },
  kh: { modern: '克', tang: '佉' },
  g: { modern: '格', tang: '伽' },
  gh: { modern: '格', tang: '伽' },
  ṅ: { modern: '昂', tang: '仰' },
  c: { modern: '吉', tang: '遮' },
  ch: { modern: '奇', tang: '车' },
  j: { modern: '吉', tang: '日' },
  jh: { modern: '吉', tang: '社' },
  ñ: { modern: '尼', tang: '若' },
  ṭ: { modern: '特', tang: '吒' },
  ṭh: { modern: '特', tang: '侘' },
  ḍ: { modern: '德', tang: '荼' },
  ḍh: { modern: '德', tang: '茶' },
  ṇ: { modern: '尼', tang: '拏' },
  t: { modern: '特', tang: '怛' },
  th: { modern: '特', tang: '他' },
  d: { modern: '德', tang: '捺' },
  dh: { modern: '德', tang: '驮' },
  n: { modern: '尼', tang: '曩' },
  p: { modern: '普', tang: '钵' },
  ph: { modern: '普', tang: '颇' },
  b: { modern: '布', tang: '跋' },
  bh: { modern: '布', tang: '婆' },
  m: { modern: '姆', tang: '摩' },
  y: { modern: '伊', tang: '耶' },
  r: { modern: '尔', tang: '啰' },
  l: { modern: '勒', tang: '逻' },
  v: { modern: '维', tang: '嚩' },
  ś: { modern: '希', tang: '室' },
  ṣ: { modern: '师', tang: '瑟' },
  s: { modern: '斯', tang: '娑' },
  h: { modern: '赫', tang: '纥' },
};

/**
 * Palatalized onset prefix specifically when IMMEDIATELY preceding palatal semivowel `-y`
 * (e.g., tadyathā -> 达-₍地₎呀-他, tryadhvikānāṃ -> ₍特哩₎呀..., devebhyaḥ -> 叠-威-₍比₎呀₍赫₎)
 */
const CLUSTER_PREFIX_BEFORE_Y: Record<string, { modern: string; tang: string }> = {
  ...CLUSTER_PREFIX_MINIMAL,
  t: { modern: '蒂', tang: '底' },
  th: { modern: '提', tang: '耻' },
  d: { modern: '地', tang: '地' },
  dh: { modern: '地', tang: '地' },
  ṭ: { modern: '蒂', tang: '置' },
  ḍ: { modern: '迪', tang: '腻' },
  p: { modern: '皮', tang: '比' },
  ph: { modern: '批', tang: '匹' },
  b: { modern: '比', tang: '毗' },
  bh: { modern: '比', tang: '毗' },
  n: { modern: '尼', tang: '你' },
  ṇ: { modern: '尼', tang: '抳' },
  m: { modern: '姆', tang: '弭' },
  r: { modern: '哩', tang: '哩' },
  v: { modern: '维', tang: '尾' },
  k: { modern: '克', tang: '枳' },
  g: { modern: '格', tang: '拟' },
  j: { modern: '吉', tang: '惹' },
};

/**
 * Oral stop place-of-articulation groups for Abhinidhāna (homorganic geminate closure absorption)
 */
function getStopPlaceGroup(c: string): string | null {
  if (c === 'k' || c === 'kh' || c === 'g' || c === 'gh') return 'velar';
  if (c === 'c' || c === 'ch' || c === 'j' || c === 'jh') return 'palatal';
  if (c === 'ṭ' || c === 'ṭh' || c === 'ḍ' || c === 'ḍh') return 'retroflex';
  if (c === 't' || c === 'th' || c === 'd' || c === 'dh') return 'dental';
  if (c === 'p' || c === 'ph' || c === 'b' || c === 'bh') return 'labial';
  return null;
}

function isNasalConsonant(c: string): boolean {
  return c === 'ṅ' || c === 'ñ' || c === 'ṇ' || c === 'n' || c === 'm';
}

function getNasalVowelSlot(vowel: string): number {
  if (vowel === 'a' || vowel === 'ā') return 0;
  if (vowel === 'i' || vowel === 'ī') return 1;
  if (vowel === 'u' || vowel === 'ū') return 2;
  if (vowel === 'ṛ' || vowel === 'ṝ' || vowel === 'ḷ' || vowel === 'ḹ') return 3;
  if (vowel === 'e' || vowel === 'ai') return 4;
  return 5; // o / au
}

function renderNasalizedCore(mainC: string, vowel: string, mode: 'n' | 'ng'): string {
  if (vowel === 'ḷ' || vowel === 'ḹ') {
    const pre = mainC && mainC !== 'l' ? CLUSTER_PREFIX_MINIMAL[mainC]?.modern || '' : '';
    return wrapSubscriptPhonetic(pre) + (mode === 'ng' ? '灵' : '林');
  }
  const slot = getNasalVowelSlot(vowel);
  const table = mode === 'ng' ? NASAL_NG_MATRIX : NASAL_N_MATRIX;
  const row = table[mainC] || table[''];
  return row[slot];
}

function renderOpenCore(mainC: string, vowel: string): { modern: string; tang: string } {
  if (!mainC) {
    return INDEPENDENT_VOWEL_MAP[vowel] || { modern: '阿', tang: '阿' };
  }
  if (vowel === 'ḷ' || vowel === 'ḹ') {
    const preMod = mainC === 'l' ? '' : CLUSTER_PREFIX_MINIMAL[mainC]?.modern || '';
    const preTang = mainC === 'l' ? '' : CLUSTER_PREFIX_MINIMAL[mainC]?.tang || '';
    return {
      modern: `${wrapSubscriptPhonetic(preMod)}里`,
      tang: `${preTang}里${vowel === 'ḹ' ? '(引)' : ''}`,
    };
  }
  const qIdx = VOWEL_QUALITY_IDX[vowel] ?? 0;
  const modRow = CV_MODERN_MATRIX[mainC];
  const tangRow = CV_TANG_MATRIX[mainC];
  const modern = modRow ? modRow[qIdx] : mainC;

  const cvKey = mainC + vowel;
  let tang = TANG_LONG_CV_OVERRIDES[cvKey] || (tangRow ? tangRow[qIdx] : '阿');
  if (!TANG_LONG_CV_OVERRIDES[cvKey] && INHERENT_LONG_SET.has(vowel)) {
    tang += '(引)';
  }
  return { modern, tang };
}

/**
 * Śikṣā Vowel-Colored Visarga (`-ḥ` 涅槃点/止声) Breath Release:
 * - High-front & palatal offglide (`i, ī, ai`): palatal breath `[ç / hʲ]` -> `希` (Tang `醯`)
 * - Mid-front (`e`): mid-front breath `[eːh]` -> `嘿` (Tang `醯`)
 * - Rounded back & labial offglide (`u, ū, au`): labial-velar breath `[hʷ / xʷ]` -> `忽` (Tang `虎`)
 * - Open/central/mid-back (`a, ā, ṛ, ṝ, ḷ, ḹ, o`): glottal breath `[h]` -> `赫` (Tang `入`)
 */
function renderVisargaTail(vowel: string): { modern: string; tang: string } {
  if (vowel === 'i' || vowel === 'ī' || vowel === 'ai') {
    return { modern: '希', tang: '醯' };
  }
  if (vowel === 'e') {
    return { modern: '嘿', tang: '醯' };
  }
  if (vowel === 'u' || vowel === 'ū' || vowel === 'au') {
    return { modern: '忽', tang: '虎' };
  }
  return { modern: '赫', tang: '诃' };
}

function renderCodaConsonant(
  c: string,
  nextOnsetFirst: string,
  sameSubwordNext: boolean
): { modern: string; tang: string } {
  // Rule B1: Abhinidhāna & Varṇakrama — Homorganic stop closure or identical geminate absorption
  // within the same word (e.g., bud-dhā -> 布+达, sat-tvā -> 萨+₍特₎瓦, sarv-va -> 萨₍尔₎+瓦, āry-ya -> 阿₍哩₎+呀)
  if (sameSubwordNext && nextOnsetFirst) {
    const g1 = getStopPlaceGroup(c);
    const g2 = getStopPlaceGroup(nextOnsetFirst);
    if (g1 && g1 === g2) {
      return { modern: '', tang: c === 'd' || c === 'b' ? '没' : '怛' };
    }
    if (c === nextOnsetFirst) {
      return { modern: '', tang: c === 'l' ? '攞' : '' };
    }
  }

  // Rule B4: Pre-palatal Repha Svarabhakti (-r before y- in same word -> 哩, else 尔)
  if (c === 'r') {
    if (sameSubwordNext && nextOnsetFirst === 'y') {
      return { modern: '哩', tang: '哩' };
    }
    return { modern: '尔', tang: '哩' };
  }
  if (c === 'l') return { modern: '尔', tang: '攞' };
  if (c === 'k' || c === 'kh') return { modern: '克', tang: '羯' };
  if (c === 'g' || c === 'gh') return { modern: '格', tang: '伽' };
  if (c === 'c') return { modern: '吉', tang: '遮' };
  if (c === 'ch') return { modern: '奇', tang: '遮' };
  if (c === 'j' || c === 'jh') return { modern: '吉', tang: '日' };
  if (c === 'ṭ' || c === 'ṭh' || c === 't' || c === 'th') return { modern: '特', tang: '怛' };
  if (c === 'ḍ' || c === 'ḍh' || c === 'd' || c === 'dh') return { modern: '德', tang: '讷' };
  if (c === 'p' || c === 'ph') return { modern: '普', tang: '钵' };
  if (c === 'b' || c === 'bh') return { modern: '布', tang: '跋' };
  if (c === 'ś') return { modern: '希', tang: '室' };
  if (c === 'ṣ') return { modern: '师', tang: '瑟' };
  if (c === 's') return { modern: '斯', tang: '悉' };
  if (c === 'h') return { modern: '赫', tang: '纥' };
  if (c === 'v') return { modern: '夫', tang: '嚩' };
  if (c === 'y') return { modern: '伊', tang: '以' };
  if (isNasalConsonant(c)) return { modern: '恩', tang: '喃' };
  return { modern: '', tang: '' };
}

function parseStandaloneSyllableStructure(cleanSyl: string): {
  onset: string[];
  vowel: string;
  modifiers: string[];
  coda: string[];
} {
  const tokens = tokenizeWordPhonemes(cleanSyl);
  const onset: string[] = [];
  const modifiers: string[] = [];
  const coda: string[] = [];
  let vowel = 'a';
  let idx = 0;

  while (idx < tokens.length && tokens[idx].type === 'C') {
    onset.push(tokens[idx].val);
    idx++;
  }
  if (idx < tokens.length && tokens[idx].type === 'V') {
    vowel = tokens[idx].val;
    idx++;
  }
  while (idx < tokens.length && tokens[idx].type === 'M') {
    modifiers.push(tokens[idx].val);
    idx++;
  }
  while (idx < tokens.length) {
    if (tokens[idx].type === 'C') coda.push(tokens[idx].val);
    idx++;
  }
  return { onset, vowel, modifiers, coda };
}

/**
 * Convert a Sanskrit syllable (Akṣara) into both Classical Tang Chinese (古汉语音译)
 * and Modern Mandarin Phonetic reading (现代梵音拼读), honoring optional inter-syllable context.
 */
export function mapSyllableToChinesePhonetics(
  rawSyl: string,
  context?: SyllablePhoneticContext
): {
  classicalZh: string;
  modernZh: string;
} {
  const s = cleanEditorialIast(rawSyl)
    .toLowerCase()
    .replace(/[|/\s.,;!?—–-]+/g, '')
    .trim();

  if (!s) {
    return { classicalZh: '', modernZh: '' };
  }

  const nextOnset = context?.nextOnset || [];
  const nextFirst = nextOnset[0] || '';
  const sameSubwordNext = Boolean(context?.sameSubwordNext);
  const isStandaloneSyllable =
    context === undefined || Boolean(context.isWordStart && context.isWordEnd);

  const lookupKey = s.replace(/m\u0310/g, 'ṃ');

  if (UNIVERSAL_AKSARA_OVERRIDES[lookupKey]) {
    return {
      classicalZh: UNIVERSAL_AKSARA_OVERRIDES[lookupKey].tang,
      modernZh: UNIVERSAL_AKSARA_OVERRIDES[lookupKey].modern,
    };
  }
  if (isStandaloneSyllable && STANDALONE_BIJA_OVERRIDES[lookupKey]) {
    return {
      classicalZh: STANDALONE_BIJA_OVERRIDES[lookupKey].tang,
      modernZh: STANDALONE_BIJA_OVERRIDES[lookupKey].modern,
    };
  }

  const parsed =
    context?.onset && context?.vowel
      ? {
          onset: context.onset,
          vowel: context.vowel,
          modifiers: context.modifiers || [],
          coda: context.coda || [],
        }
      : parseStandaloneSyllableStructure(s);

  const { onset, vowel, modifiers, coda } = parsed;
  const hasAnusvara = modifiers.includes('ṃ') || modifiers.includes('m\u0310');
  const hasVisarga = modifiers.includes('ḥ');

  // Build onset cluster prefix + main consonant
  let prefixModern = '';
  let prefixTang = '';
  let mainC = '';

  if (onset.length > 0) {
    const joinedOnset = onset.join('');

    // Special Sanskrit conjuncts with dedicated phonetic realizations
    if (joinedOnset.endsWith('kṣ')) {
      for (const pre of onset.slice(0, -2)) {
        prefixModern += CLUSTER_PREFIX_MINIMAL[pre]?.modern || '';
        prefixTang += CLUSTER_PREFIX_MINIMAL[pre]?.tang || '';
      }
      prefixModern += '克';
      prefixTang += '乞';
      mainC = 'ṣ';
    } else if (joinedOnset.endsWith('jñ')) {
      for (const pre of onset.slice(0, -2)) {
        prefixModern += CLUSTER_PREFIX_MINIMAL[pre]?.modern || '';
        prefixTang += CLUSTER_PREFIX_MINIMAL[pre]?.tang || '';
      }
      prefixModern += '吉';
      prefixTang += '枳';
      mainC = 'ñ';
    } else if (joinedOnset === 'śv' && (vowel === 'a' || vowel === 'ā')) {
      prefixModern = '湿';
      prefixTang = '湿';
      mainC = 'v';
    } else {
      mainC = onset[onset.length - 1];
      const prefixList = onset.slice(0, -1);
      for (let pIdx = 0; pIdx < prefixList.length; pIdx++) {
        const pre = prefixList[pIdx];
        const nextInOnset = onset[pIdx + 1];
        // Absorb geminate or homorganic stop inside onset cluster (e.g. subword-initial `ttva` -> `₍特₎瓦`)
        const gPre = getStopPlaceGroup(pre);
        const gNext = getStopPlaceGroup(nextInOnset);
        if (pre === nextInOnset || (gPre && gPre === gNext)) {
          continue;
        }
        const prefixTable =
          nextInOnset === 'y' ? CLUSTER_PREFIX_BEFORE_Y : CLUSTER_PREFIX_MINIMAL;
        prefixModern += prefixTable[pre]?.modern || '';
        prefixTang += prefixTable[pre]?.tang || '';
      }
    }
  }

  // Rule B6: Subword-final external `yaṇ-sandhi` coda (`-Cy` from `-Ci`, `-Cv` from `-Cu`,
  // e.g. `ity evaṃ` -> `伊₍帝₎`, `koṭy-uṣṇīṣaṃ` -> `果₍蒂₎`, `agny-udaka` -> `阿₍格尼₎`, `ehy ehi` -> `诶₍嘿₎`)
  let remainingCoda = [...coda];
  let yanSandhiTailModern = '';
  let yanSandhiTailTang = '';

  if (!sameSubwordNext && remainingCoda.length >= 2) {
    const lastC = remainingCoda[remainingCoda.length - 1];
    const penultC = remainingCoda[remainingCoda.length - 2];
    if (lastC === 'y' || lastC === 'v') {
      const targetVowel = lastC === 'y' ? 'i' : 'u';
      remainingCoda.splice(remainingCoda.length - 2, 2);
      const yanMapped = renderOpenCore(penultC, targetVowel);
      yanSandhiTailModern = yanMapped.modern;
      yanSandhiTailTang = yanMapped.tang;
    }
  }

  // Determine if the nucleus + nasal (either modifier `ṃ` or leading nasal coda `ṅ/ñ/ṇ/n/m`)
  // fuses into a single Mandarin nasal syllable!
  let nasalMode: 'n' | 'ng' | null = null;
  let explicitLabialMu = false;
  let tangNasalSuffix = '';

  if (hasAnusvara) {
    // Context-sensitive Anusvāra (Pāṇini 8.4.58 parasavarṇa within the same word/syllable;
    // word-final `-ṃ` per 8.4.59 maintains consistent resonant reading across whitespace boundaries)
    const effNext =
      remainingCoda.length > 0
        ? remainingCoda[0]
        : sameSubwordNext
          ? nextFirst
          : '';
    if (effNext && ['k', 'kh', 'g', 'gh', 'ṅ'].includes(effNext)) {
      nasalMode = 'ng';
      tangNasalSuffix = mainC === 's' && vowel === 'a' ? '' : '僧';
    } else if (
      effNext &&
      ['c', 'ch', 'j', 'jh', 'ñ', 'ṭ', 'ṭh', 'ḍ', 'ḍh', 'ṇ', 't', 'th', 'd', 'dh', 'n'].includes(
        effNext
      )
    ) {
      nasalMode = 'n';
      tangNasalSuffix = '喃';
    } else if (effNext && ['p', 'ph', 'b', 'bh', 'm'].includes(effNext)) {
      // Traditional Chinese Sanskrit mantra convention: saṃbuddha -> 桑布达, saṃbhava -> 桑巴瓦, siddhaṃbhave -> 悉当巴威
      nasalMode = 'ng';
      tangNasalSuffix = '三';
    } else {
      // Word-final or before sibilant/semivowel (saṃskāra -> 桑₍斯₎嘎啦, hṛdayaṃ -> ₍赫₎日达央, puṣṭiṃ -> 布₍师₎丁)
      nasalMode = vowel === 'i' || vowel === 'ī' ? 'n' : 'ng';
      tangNasalSuffix = '喃';
    }
  } else if (remainingCoda.length > 0 && isNasalConsonant(remainingCoda[0])) {
    const nasalC = remainingCoda.shift()!;
    if (nasalC === 'm' && sameSubwordNext && nextFirst === 'y') {
      // e.g. sam-yak -> 萨₍姆₎-呀₍克₎ (keep labial [m] distinct before [j])
      explicitLabialMu = true;
      tangNasalSuffix = '摩';
    } else if (nasalC === 'm' && (vowel === 'ṛ' || vowel === 'ṝ')) {
      // e.g. vijṛmbhamāṇa -> 维₍吉₎日₍姆₎巴玛拿
      explicitLabialMu = true;
      tangNasalSuffix = '摩';
    } else if (nasalC === 'ṅ') {
      nasalMode = 'ng';
      tangNasalSuffix = '仰';
    } else if (nasalC === 'm' && !sameSubwordNext && remainingCoda.length === 0 && !yanSandhiTailModern) {
      // Word-final -am / -ām / -im / -um (e.g. śubham -> 舒邦, imam -> 伊芒, samantabuddhānām -> 萨曼达布达南)
      nasalMode = mainC === 'n' || mainC === 'ṇ' || vowel === 'i' || vowel === 'ī' ? 'n' : 'ng';
      tangNasalSuffix = '喃';
    } else {
      // Coronal/palatal nasal codas (n, ṇ, ñ) or medial m before labial stop (man-tra -> 曼, cin-tā -> 津, śān-ti -> 善, jam-bha -> 詹)
      nasalMode = 'n';
      tangNasalSuffix = '喃';
    }
  }

  let coreModern = '';
  let coreTang = '';

  if (nasalMode) {
    // Special classical Tang overrides for common nasal syllables
    const rawNoRestCoda = onset.join('') + vowel + (hasAnusvara ? 'ṃ' : 'n');
    const cvBaseKey = mainC + vowel;
    coreModern = renderNasalizedCore(mainC, vowel, nasalMode);
    if (
      (rawNoRestCoda === 'saṃ' || rawNoRestCoda === 'san') &&
      nasalMode === 'ng'
    ) {
      coreTang = '三';
    } else if (!hasAnusvara && (cvBaseKey === 'ma' || cvBaseKey === 'mā') && nasalMode === 'n') {
      coreTang = vowel === 'ā' ? '满' : '曼';
    } else if (
      tangNasalSuffix !== '三' &&
      tangNasalSuffix !== '僧' &&
      tangNasalSuffix !== '仰' &&
      TANG_NASAL_CORE_OVERRIDES[cvBaseKey]
    ) {
      coreTang = TANG_NASAL_CORE_OVERRIDES[cvBaseKey];
    } else {
      const openCore = renderOpenCore(mainC, vowel);
      const baseTangNoYin = openCore.tang.replace(/\(引\)$/g, '');
      coreTang = baseTangNoYin + (tangNasalSuffix || '喃');
    }
  } else {
    const openCore = renderOpenCore(mainC, vowel);
    coreModern = openCore.modern + (explicitLabialMu ? wrapSubscriptPhonetic('姆') : '');
    coreTang = openCore.tang + (explicitLabialMu ? tangNasalSuffix : '');
  }

  // Process any remaining non-nasal coda consonants
  let codaModern = '';
  let codaTang = '';
  for (let cIdx = 0; cIdx < remainingCoda.length; cIdx++) {
    const c = remainingCoda[cIdx];
    const isLastCoda = cIdx === remainingCoda.length - 1;
    const mappedCoda = renderCodaConsonant(
      c,
      isLastCoda ? (yanSandhiTailModern ? '' : nextFirst) : remainingCoda[cIdx + 1],
      isLastCoda ? (yanSandhiTailModern ? false : sameSubwordNext) : true
    );
    codaModern += mappedCoda.modern;
    codaTang += mappedCoda.tang;
  }

  // Special traditional Tang single-character readings for closed syllables (e.g. bud -> 没, dhar -> 达哩, sar -> 萨哩)
  if (s === 'bud') {
    coreTang = '没';
    codaTang = '';
  } else if (s === 'dhar') {
    coreTang = '达';
    codaTang = '哩';
  } else if (s === 'sar') {
    coreTang = '萨';
    codaTang = '哩';
  }

  // Visarga (-ḥ) tail
  let visargaModern = '';
  let visargaTang = '';
  if (hasVisarga) {
    const vTail = renderVisargaTail(vowel);
    visargaModern = vTail.modern;
    visargaTang = vTail.tang;
  }

  const modernSyllable = coalesceSubscriptRuns(
    wrapSubscriptPhonetic(prefixModern) +
      coreModern +
      wrapSubscriptPhonetic(codaModern) +
      wrapSubscriptPhonetic(yanSandhiTailModern) +
      wrapSubscriptPhonetic(visargaModern)
  );

  let classicalOut = prefixTang + coreTang + codaTang + yanSandhiTailTang + visargaTang;
  if (hasVisarga && remainingCoda.length === 0 && !nasalMode) {
    if (lookupKey === 'bhyaḥ') {
      classicalOut = '毗药';
    } else if (lookupKey === 'maḥ') {
      classicalOut = '莫';
    } else if (lookupKey === 'naḥ') {
      classicalOut = '诺';
    } else if (lookupKey === 'duḥ') {
      classicalOut = '耨';
    } else if (mainC === 'y' && vowel === 'a') {
      classicalOut = `${prefixTang}药`;
    }
  }

  return {
    classicalZh: classicalOut,
    modernZh: modernSyllable,
  };
}

/**
 * Known Sanskrit morphological compound prefixes/stems for clean Samāsa-viccheda hyphenation
 * inside long unhyphenated Sanskrit compounds (>= 5 syllables).
 */
const COMPOUND_STEM_PREFIXES = new Set([
  'ārya',
  'āryā',
  'avalokita',
  'avalokite',
  'valokita',
  'valokite',
  'mahā',
  'sarva',
  'sarvā',
  'sarvo',
  'samanta',
  'samyak',
  'bodhi',
  'buddha',
  'buddhā',
  'dharma',
  'dharmā',
  'saṃgha',
  'ratna',
  'vajra',
  'vajro',
  'padma',
  'padmo',
  'maṇi',
  'cintā',
  'cakra',
  'tathāgata',
  'tathāgato',
  'tathāgatā',
  'bhagava',
  'aparimita',
  'aparimitā',
  'aparimitāyur',
  'apratihata',
  'suviniścita',
  'sitātapatra',
  'sitātapatro',
  'uṣṇīṣa',
  'uṣṇīṣā',
  'ṣṇīṣa',
  'ṣṇīṣā',
  'hṛdaya',
  'hṛdayā',
  'dhātu',
  'gagana',
  'svabhāva',
  'saṃskāra',
  'pari',
  'upasaṃ',
  'amṛta',
  'amṛto',
  'trailokya',
  'bhaiṣajya',
  'vaiḍūrya',
  'prabhā',
  'jñāna',
  'tejo',
  'āyur',
  'āyuḥ',
  'puṇya',
  'kāya',
  'citta',
  'citto',
  'loka',
  'loke',
  'lokā',
  'deva',
  'nāga',
  'yakṣa',
  'gandharva',
  'amogha',
  'viśva',
  'sahasra',
  'paripūraṇa',
  'supratiṣṭhita',
  'adhiṣṭhāna',
  'adhiṣṭhānā',
  'dhiṣṭhāna',
  'dhiṣṭhānā',
]);

/**
 * Compute morphological compound hyphen positions within a single unhyphenated subword
 * when the subword has >= 5 syllables.
 */
function computeSubwordStemHyphens(subSyls: SyllableAnalysis[]): Set<number> {
  const breakIndices = new Set<number>();
  if (subSyls.length < 5) return breakIndices;

  let start = 0;
  while (start < subSyls.length - 2) {
    let matchedEnd = -1;
    // Prefer longest stem match that leaves at least 2 syllables remaining
    const maxEnd = subSyls.length - 2;
    for (let end = Math.min(maxEnd, start + 6); end >= start + 1; end--) {
      const candidate = subSyls
        .slice(start, end)
        .map((s) => s.iast)
        .join('');
      if (COMPOUND_STEM_PREFIXES.has(candidate)) {
        matchedEnd = end;
        break;
      }
    }
    if (matchedEnd !== -1) {
      breakIndices.add(matchedEnd);
      start = matchedEnd;
    } else {
      break;
    }
  }

  return breakIndices;
}

/**
 * Enrich an array of prosodic syllables from `analyzeSanskritProsody` with full
 * inter-syllable Sandhi, coarticulation, and Samāsa compound hyphenation metadata.
 */
export function enrichSyllablesWithPhonetics(
  syllables: SyllableAnalysis[]
): EnrichedPhoneticSyllable[] {
  if (syllables.length === 0) return [];

  // Precompute morphological compound hyphen breaks per subword
  const subwordGroups = new Map<number, SyllableAnalysis[]>();
  for (const syl of syllables) {
    const sw = syl.subwordIndex ?? syl.wordIndex ?? 0;
    const list = subwordGroups.get(sw) || [];
    list.push(syl);
    subwordGroups.set(sw, list);
  }

  const autoHyphenSylIndices = new Set<number>();
  for (const group of subwordGroups.values()) {
    const localBreaks = computeSubwordStemHyphens(group);
    for (const bIdx of localBreaks) {
      if (group[bIdx]) {
        autoHyphenSylIndices.add(group[bIdx].index);
      }
    }
  }

  return syllables.map((syl, idx) => {
    const nextSyl = syllables[idx + 1];
    const sameSubwordNext = Boolean(
      nextSyl &&
        syl.subwordIndex !== undefined &&
        syl.subwordIndex === nextSyl.subwordIndex
    );
    const acrossPauseNext = Boolean(syl.dandaAfter || nextSyl?.dandaBefore);

    const mapped = mapSyllableToChinesePhonetics(syl.iast, {
      onset: syl.onset,
      vowel: syl.vowel,
      modifiers: syl.modifiers,
      coda: syl.coda,
      isWordStart: syl.isWordStart,
      isWordEnd: syl.isWordEnd,
      sameSubwordNext,
      acrossPauseNext,
      nextOnset: nextSyl?.onset,
    });

    return {
      ...syl,
      classicalZh: mapped.classicalZh,
      modernZh: mapped.modernZh,
      compoundHyphenBefore: Boolean(
        syl.hyphenBefore || autoHyphenSylIndices.has(syl.index)
      ),
    };
  });
}

/**
 * Convert an entire Sanskrit IAST sentence/verse into:
 * - Full Classical Tang/Song Chinese Transliteration (古汉语音译)
 * - Full Modern Sanskrit Phonetic Guide (梵音拼读参考)
 *
 * Guaranteed 100% consistent with `enrichSyllablesWithPhonetics` used by the per-syllable cards!
 */
export function generateVerseChinesePhonetics(
  iastVerse: string,
  includeIastBrackets = true
): {
  classicalTranslitZh: string;
  modernPhoneticZh: string;
} {
  const syllables = analyzeSanskritProsody(iastVerse);
  if (syllables.length === 0) {
    return { classicalTranslitZh: '', modernPhoneticZh: '' };
  }

  const enriched = enrichSyllablesWithPhonetics(syllables);

  // Group enriched syllables by wordIndex
  const wordsMap = new Map<number, EnrichedPhoneticSyllable[]>();
  const wordOrder: number[] = [];
  for (const syl of enriched) {
    const wIdx = syl.wordIndex ?? 0;
    if (!wordsMap.has(wIdx)) {
      wordsMap.set(wIdx, []);
      wordOrder.push(wIdx);
    }
    wordsMap.get(wIdx)!.push(syl);
  }

  const classicalPieces: string[] = [];
  const modernPieces: Array<{ text: string; isDanda: boolean }> = [];

  for (const wIdx of wordOrder) {
    const wSyls = wordsMap.get(wIdx)!;
    const first = wSyls[0];
    const last = wSyls[wSyls.length - 1];
    const wordIast = (first.wordIast || wSyls.map((s) => s.iast).join('')).replace(
      /[|.,;!?—–]+/g,
      ''
    );
    const dictKey = wordIast.replace(/-/g, '').replace(/m\u0310/g, 'ṃ');

    if (first.dandaBefore) {
      classicalPieces.push(first.dandaBefore);
      modernPieces.push({ text: first.dandaBefore, isDanda: true });
    }

    // Build modern phonetic word directly from enriched syllables (100% aligned with syllable pills)
    let wordModern = '';
    for (let i = 0; i < wSyls.length; i++) {
      const s = wSyls[i];
      if (i > 0 && s.compoundHyphenBefore) {
        wordModern += '-';
      }
      wordModern += s.modernZh;
    }
    wordModern = coalesceSubscriptRuns(wordModern);

    modernPieces.push({
      text: includeIastBrackets ? `${wordModern}(${wordIast})` : wordModern,
      isDanda: false,
    });

    // Build classical Tang word (use whole-word sutra transliteration if in dictionary, else join syllables)
    const dictHit = WORD_CLASSICAL_DICTIONARY[dictKey];
    if (dictHit) {
      classicalPieces.push(dictHit.classicalZh.split('/')[0].trim());
    } else {
      classicalPieces.push(wSyls.map((s) => s.classicalZh).join(''));
    }

    if (last.dandaAfter) {
      classicalPieces.push(last.dandaAfter);
      modernPieces.push({ text: last.dandaAfter, isDanda: true });
    }
  }

  // Format modernPieces cleanly:
  // - Without brackets: `拿摩 布达呀 | 拿摩 达尔玛呀`
  // - With brackets: `拿摩(namo) · 布达呀(buddhāya) | 拿摩(namo) · 达尔玛呀(dharmāya)`
  let modernOut = '';
  for (let i = 0; i < modernPieces.length; i++) {
    const cur = modernPieces[i];
    const prev = modernPieces[i - 1];
    if (i > 0) {
      if (cur.isDanda || prev.isDanda) {
        modernOut += ' ';
      } else {
        modernOut += includeIastBrackets ? ' · ' : ' ';
      }
    }
    modernOut += cur.text;
  }

  // Trim trailing single/double danda on modernPhoneticZh only when brackets are off?
  // Keeping trailing danda stripped or clean matches curated reading flow (`拿摩 布达呀 | ... 玛哈-嘎鲁尼嘎呀`)
  modernOut = modernOut.replace(/\s+\|\|?\s*$/, '').trim();

  return {
    classicalTranslitZh: classicalPieces.join(' '),
    modernPhoneticZh: modernOut,
  };
}

/**
 * Formats a verse's Modern Phonetic Guide (梵音拼读) according to the user's
 * toggle preference for showing or hiding parenthesized (IAST) annotations.
 *
 * Strict Provenance Contract:
 * 1. When `rawModernPhoneticZh` is provided (from the database / source entry),
 *    ALWAYS preserve the database's Chinese phonetic text verbatim — NEVER overwrite it
 *    with algorithmic phonetics. Only attach/strip `(iast)` brackets as requested.
 * 2. ONLY when `rawModernPhoneticZh` is empty/absent does it fall back to
 *    `generateVerseChinesePhonetics(iastVerse, showIastBracket)`.
 */
export function formatModernPhoneticWithIastOption(
  rawModernPhoneticZh: string,
  iastVerse: string,
  showIastBracket: boolean
): string {
  const trimmedRaw = (rawModernPhoneticZh || '').trim();

  if (!trimmedRaw) {
    if (iastVerse && iastVerse.trim()) {
      return generateVerseChinesePhonetics(iastVerse, showIastBracket).modernPhoneticZh;
    }
    return '';
  }

  const hasExistingBrackets = /\([a-zA-Zāīūṛṝḷḹṅñṭḍṇśṣṃṁḥ\s'-]+\)/.test(trimmedRaw);

  if (!showIastBracket) {
    if (!hasExistingBrackets) return trimmedRaw;
    return trimmedRaw
      .replace(/\s*\([a-zA-Zāīūṛṝḷḹṅñṭḍṇśṣṃṁḥ\s'-]+\)/g, '')
      .replace(/\s+·\s+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  // `showIastBracket` is true: preserve database `trimmedRaw` characters and attach `(IAST)`
  if (hasExistingBrackets || !iastVerse || !iastVerse.trim()) {
    return trimmedRaw;
  }

  const dandaRe = /^(?:\|\||\|+|｜|।|॥)$/;
  const rawTokens = trimmedRaw
    .replace(/\s*(\|\||\|+|｜|।|॥)\s*/g, ' $1 ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const zhWordTokens = rawTokens.filter((t) => !dandaRe.test(t));

  const cleanedIast = cleanEditorialIast(iastVerse).replace(/\s*(?:\|\||\|+|।|॥)\s*$/, '').trim();
  const iastTokens = cleanedIast
    .replace(/\s*(\|\||\|+|।|॥)\s*/g, ' $1 ')
    .trim()
    .split(/\s+/)
    .filter((t) => Boolean(t) && !dandaRe.test(t));

  if (zhWordTokens.length > 0 && zhWordTokens.length === iastTokens.length) {
    let wordIdx = 0;
    const pieces: Array<{ text: string; isDanda: boolean }> = rawTokens.map((tok) => {
      if (dandaRe.test(tok)) {
        return { text: tok, isDanda: true };
      }
      const pairedIast = iastTokens[wordIdx++];
      return { text: `${tok}(${pairedIast})`, isDanda: false };
    });

    let out = '';
    for (let i = 0; i < pieces.length; i++) {
      const cur = pieces[i];
      const prev = pieces[i - 1];
      if (i > 0) {
        out += cur.isDanda || prev.isDanda ? ' ' : ' · ';
      }
      out += cur.text;
    }
    return out.trim();
  }

  return cleanedIast ? `${trimmedRaw} (${cleanedIast})` : trimmedRaw;
}

import { analyzeSanskritWord } from './sanskritLexicon';
import type { FieldOrigin } from '../../types/kosaTypes';

/**
 * Automatically generates structured WordGloss[] for any Sanskrit IAST verse line
 * as a derived reference fallback (`origin: 'derived-reference'`) when a database entry
 * does not natively contain per-word glosses.
 */
export function buildWordGlossesFromIast(iastVerse: string): Array<{
  iast: string;
  stem?: string;
  grammar?: string;
  transliterationZh: string;
  meaningZh: string;
  meaningEn?: string;
  origin: FieldOrigin;
}> {
  const cleaned = cleanEditorialIast(iastVerse);
  const rawTokens = cleaned
    .split(/[\s\-—–|॥।,.;!?/()[\]:]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 1 && /[a-zA-Zāīūṛṝḷḹṅñṭḍṇśṣṃṁḥ]/.test(w));

  return rawTokens.map((word) => {
    const lower = word.toLowerCase();
    const dictHit = WORD_CLASSICAL_DICTIONARY[lower];
    const phon = generateVerseChinesePhonetics(word, false);
    const analysis = analyzeSanskritWord(word);

    return {
      iast: word,
      stem: analysis.stem,
      grammar: analysis.grammar,
      transliterationZh: `${dictHit?.classicalZh || phon.classicalTranslitZh}（拼读参考：${phon.modernPhoneticZh}）`,
      meaningZh: analysis.meaningZh,
      meaningEn: analysis.meaningEn || undefined,
      origin: 'derived-reference',
    };
  });
}

