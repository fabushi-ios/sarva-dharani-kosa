/**
 * src/core/sanskrit/phoneticMapper.ts
 *
 * Deterministic Sanskrit-to-Classical Tang Chinese Transliteration (唐代不空/玄奘译音规范)
 * and Modern Mandarin Sanskrit Phonetic Guide (现代梵音拼读参考) Engine.
 *
 * Ensures that EVERY verse and EVERY individual syllable in the application has:
 * 1. Authentic Classical Chinese Sūtra Transliteration (古汉语音译)
 * 2. Clear Modern Mandarin Phonetic Guide (梵音拼读参考), with optional (IAST) bracket toggle.
 */

import { cleanEditorialIast } from './transliterator';
import { analyzeSanskritProsody } from './prosody';

/**
 * High-frequency Buddhist Sanskrit whole-word dictionary for Classical Tang/Song transliteration
 * and modern phonetic reading.
 */
const WORD_CLASSICAL_DICTIONARY: Record<
  string,
  { classicalZh: string; modernZh: string; meaningZh?: string }
> = {
  om: { classicalZh: '唵', modernZh: '嗡', meaningZh: '三身总持圣音' },
  oṃ: { classicalZh: '唵', modernZh: '嗡', meaningZh: '三身总持圣音' },
  namo: { classicalZh: '南无 / 曩谟', modernZh: '拿摩', meaningZh: '归命、敬礼' },
  namaḥ: { classicalZh: '曩莫', modernZh: '拿玛哈', meaningZh: '归命、顶礼' },
  namas: { classicalZh: '曩莫', modernZh: '拿玛斯', meaningZh: '归命、顶礼' },
  nama: { classicalZh: '曩莫', modernZh: '拿玛', meaningZh: '归命' },
  nam: { classicalZh: '喃', modernZh: '南', meaningZh: '敬礼/句尾鼻音' },
  naṃ: { classicalZh: '喃', modernZh: '南', meaningZh: '敬礼/句尾随韵' },
  nām: { classicalZh: '喃', modernZh: '南—', meaningZh: '诸尊（属格复数尾音）' },
  nāṃ: { classicalZh: '喃', modernZh: '南—', meaningZh: '诸尊（属格复数尾音）' },
  bhagavate: { classicalZh: '薄伽伐帝 / 婆誐嚩帝', modernZh: '巴嘎瓦帝', meaningZh: '向世尊' },
  bhagavatyai: { classicalZh: '婆誐嚩底曳', modernZh: '巴嘎瓦蒂耶', meaningZh: '向世尊佛母' },
  ratnatrayāya: { classicalZh: '喝啰怛那哆啰夜耶', modernZh: '啦特拿-特啦呀呀', meaningZh: '向三宝' },
  tathāgatāya: { classicalZh: '怛他蘖多耶', modernZh: '达他嘎达呀', meaningZh: '向如来' },
  arhate: { classicalZh: '阿啰诃帝', modernZh: '阿尔哈帝', meaningZh: '向应供' },
  samyaksaṃbuddhāya: {
    classicalZh: '三藐三没驮耶',
    modernZh: '萨姆呀克-桑布达呀',
    meaningZh: '向正等正觉',
  },
  samantabuddhānām: {
    classicalZh: '三曼多没驮喃',
    modernZh: '萨曼达-布达南',
    meaningZh: '普遍一切诸佛',
  },
  samantabuddhānāṃ: {
    classicalZh: '三曼多没驮喃',
    modernZh: '萨曼达-布达南',
    meaningZh: '普遍一切诸佛',
  },
  ārya: { classicalZh: '阿哩耶', modernZh: '阿哩呀', meaningZh: '圣尊' },
  avalokiteśvarāya: {
    classicalZh: '阿嚩卢枳帝湿嚩啰耶',
    modernZh: '阿瓦洛给帝-湿瓦啦呀',
    meaningZh: '向观自在菩萨',
  },
  bodhisattvāya: {
    classicalZh: '菩提萨埵耶 / 冒地萨怛嚩耶',
    modernZh: '博地-萨特瓦呀',
    meaningZh: '向菩萨',
  },
  mahāsattvāya: {
    classicalZh: '摩诃萨埵耶',
    modernZh: '玛哈-萨特瓦呀',
    meaningZh: '向摩诃萨（大有情）',
  },
  mahākāruṇikāya: {
    classicalZh: '摩诃迦噜抳迦耶',
    modernZh: '玛哈-嘎鲁尼嘎呀',
    meaningZh: '向大悲圣尊',
  },
  tadyathā: { classicalZh: '怛侄他 / 怛你也他', modernZh: '达地呀他', meaningZh: '即说咒曰' },
  svāhā: { classicalZh: '娑嚩诃 / 萨婆诃', modernZh: '斯瓦哈', meaningZh: '圆满吉祥成就' },
  hūṃ: { classicalZh: '吽', modernZh: '吽', meaningZh: '金刚不坏心印' },
  phaṭ: { classicalZh: '泮吒 / 发吒', modernZh: '帕特', meaningZh: '摧破魔障' },
  hrīḥ: { classicalZh: '纥哩', modernZh: '赫哩希', meaningZh: '莲华部种子字' },
  dhīḥ: { classicalZh: '地 / 哩', modernZh: '迪希', meaningZh: '文殊般若种子字' },
  bhrūṃ: { classicalZh: '勃笼', modernZh: '部隆', meaningZh: '佛顶尊胜一字心' },
  gate: { classicalZh: '揭谛', modernZh: '嘎帝', meaningZh: '度越吧' },
  pāragate: { classicalZh: '波罗揭谛', modernZh: '巴啦-嘎帝', meaningZh: '度向彼岸吧' },
  pārasaṃgate: { classicalZh: '波罗僧揭谛', modernZh: '巴啦-桑嘎帝', meaningZh: '普同度至彼岸吧' },
  bodhi: { classicalZh: '菩提 / 冒地', modernZh: '博地', meaningZh: '正觉菩提' },
  sarva: { classicalZh: '萨嚩 / 萨婆', modernZh: '萨尔瓦', meaningZh: '一切' },
  mahā: { classicalZh: '摩诃', modernZh: '玛哈', meaningZh: '大、广大' },
  vajra: { classicalZh: '嚩日啰 / 跋折罗', modernZh: '瓦吉啦', meaningZh: '金刚' },
  padme: { classicalZh: '钵讷铭', modernZh: '帕德美', meaningZh: '莲华中' },
  padma: { classicalZh: '钵纳摩', modernZh: '帕德玛', meaningZh: '莲华' },
  maṇi: { classicalZh: '摩抳', modernZh: '玛尼', meaningZh: '摩尼宝珠' },
  maṇipadme: { classicalZh: '摩抳钵讷铭', modernZh: '玛尼-帕德美', meaningZh: '持摩尼宝与莲华尊' },
  śuddhe: { classicalZh: '戍第', modernZh: '舒得黑', meaningZh: '清净尊' },
  viśuddhe: { classicalZh: '尾戍第', modernZh: '维舒得黑', meaningZh: '最极清净尊' },
};

/**
 * Consonant onset mapping to Classical Tang Chinese & Modern Mandarin Phonetics
 */
const CONSONANT_ONSET_MAP: Record<string, { tang: string; modern: string }> = {
  k: { tang: '迦', modern: '嘎' },
  kh: { tang: '佉', modern: '卡' },
  g: { tang: '誐', modern: '嘎' },
  gh: { tang: '伽', modern: '嘎哈' },
  ṅ: { tang: '仰', modern: '昂' },
  c: { tang: '者', modern: '佳' },
  ch: { tang: '车', modern: '恰' },
  j: { tang: '惹', modern: '佳' },
  jh: { tang: '社', modern: '佳哈' },
  ñ: { tang: '若', modern: '尼亚' },
  ṭ: { tang: '吒', modern: '达' },
  ṭh: { tang: '侘', modern: '塔' },
  ḍ: { tang: '拏', modern: '达' },
  ḍh: { tang: '茶', modern: '达哈' },
  ṇ: { tang: '抳', modern: '拿' },
  t: { tang: '怛', modern: '达' },
  th: { tang: '他', modern: '他' },
  d: { tang: '捺', modern: '达' },
  dh: { tang: '驮', modern: '达哈' },
  n: { tang: '曩', modern: '拿' },
  p: { tang: '钵', modern: '巴' },
  ph: { tang: '颇', modern: '帕' },
  b: { tang: '跋', modern: '巴' },
  bh: { tang: '婆', modern: '巴哈' },
  m: { tang: '摩', modern: '玛' },
  y: { tang: '耶', modern: '呀' },
  r: { tang: '啰', modern: '啦' },
  l: { tang: '逻', modern: '啦' },
  v: { tang: '嚩', modern: '瓦' },
  ś: { tang: '舍', modern: '夏' },
  ṣ: { tang: '洒', modern: '沙' },
  s: { tang: '萨', modern: '萨' },
  h: { tang: '诃', modern: '哈' },
};

/**
 * Full-syllable (CV and CVC/CVṃ) lookup for accurate Classical Tang & Modern Phonetics
 */
const SYLLABARY_OVERRIDE: Record<string, { tang: string; modern: string }> = {
  a: { tang: '阿', modern: '阿' },
  ā: { tang: '阿(引)', modern: '啊—' },
  aḥ: { tang: '恶', modern: '阿哈' },
  āḥ: { tang: '噁', modern: '啊哈' },
  aṃ: { tang: '𑖀𑖼(暗)', modern: '安' },
  am: { tang: '暗', modern: '安' },
  i: { tang: '伊', modern: '伊' },
  ī: { tang: '伊(引)', modern: '衣—' },
  u: { tang: '坞', modern: '乌' },
  ū: { tang: '污(引)', modern: '乌—' },
  ṛ: { tang: '哩', modern: '哩' },
  e: { tang: '翳', modern: '诶' },
  ai: { tang: '爱', modern: '爱' },
  o: { tang: '污', modern: '欧' },
  au: { tang: '奥', modern: '奥' },
  oṃ: { tang: '唵', modern: '嗡' },
  om: { tang: '唵', modern: '嗡' },
  hūṃ: { tang: '吽', modern: '吽' },
  hum: { tang: '吽', modern: '吽' },
  hrīḥ: { tang: '纥哩', modern: '赫哩' },
  dhīḥ: { tang: '地', modern: '迪希' },
  bhrūṃ: { tang: '勃笼', modern: '部隆' },
  trūṃ: { tang: '都嚧瓮', modern: '德隆' },
  phaṭ: { tang: '泮吒', modern: '帕特' },
  svā: { tang: '娑嚩', modern: '斯瓦' },
  hā: { tang: '诃', modern: '哈' },
  // Nasalized / closed syllables (-m / -ṃ / -n) so "nam/naṃ/nāṃ" is accurately "喃 / 南"
  nam: { tang: '喃', modern: '南' },
  naṃ: { tang: '喃', modern: '南' },
  nām: { tang: '喃(引)', modern: '南—' },
  nāṃ: { tang: '喃(引)', modern: '南—' },
  nan: { tang: '难', modern: '南' },
  nān: { tang: '难(引)', modern: '南—' },
  sam: { tang: '三', modern: '桑' },
  saṃ: { tang: '三', modern: '桑' },
  sāṃ: { tang: '三(引)', modern: '桑—' },
  vam: { tang: '鑁', modern: '汪' },
  vaṃ: { tang: '鑁', modern: '汪' },
  bam: { tang: '鍐', modern: '班' },
  baṃ: { tang: '鍐', modern: '班' },
  ram: { tang: '览', modern: '兰' },
  raṃ: { tang: '览', modern: '兰' },
  lam: { tang: '蓝', modern: '兰' },
  laṃ: { tang: '蓝', modern: '兰' },
  ham: { tang: '唅', modern: '罕' },
  haṃ: { tang: '唅', modern: '罕' },
  kham: { tang: '欠', modern: '康' },
  khaṃ: { tang: '欠', modern: '康' },
  kam: { tang: '剑', modern: '刚' },
  kaṃ: { tang: '剑', modern: '刚' },
  gam: { tang: '誐', modern: '刚' },
  gaṃ: { tang: '誐', modern: '刚' },
  tam: { tang: '耽', modern: '当' },
  taṃ: { tang: '耽', modern: '当' },
  dam: { tang: '檀', modern: '丹' },
  daṃ: { tang: '檀', modern: '丹' },
  pam: { tang: '半', modern: '邦' },
  paṃ: { tang: '半', modern: '邦' },
  mam: { tang: '𤚥', modern: '芒' },
  maṃ: { tang: '𤚥', modern: '芒' },
  yam: { tang: '阎', modern: '央' },
  yaṃ: { tang: '阎', modern: '央' },
  // Standard open syllables
  na: { tang: '曩', modern: '拿' },
  nā: { tang: '拿', modern: '拿—' },
  ni: { tang: '你', modern: '尼' },
  nī: { tang: '泥', modern: '尼—' },
  nu: { tang: '努', modern: '努' },
  no: { tang: '怒', modern: '诺' },
  mo: { tang: '谟', modern: '摩' },
  ma: { tang: '摩', modern: '玛' },
  mā: { tang: '𤚥', modern: '玛—' },
  mi: { tang: '弭', modern: '咪' },
  mu: { tang: '母', modern: '穆' },
  me: { tang: '铭', modern: '美' },
  ra: { tang: '啰', modern: '啦' },
  rā: { tang: '啰(引)', modern: '啦—' },
  ri: { tang: '哩', modern: '哩' },
  rī: { tang: '哩(引)', modern: '哩—' },
  ru: { tang: '噜', modern: '鲁' },
  rū: { tang: '噜(引)', modern: '鲁—' },
  re: { tang: '隶', modern: '蕾' },
  ro: { tang: '嚧', modern: '洛' },
  la: { tang: '攞', modern: '啦' },
  lā: { tang: '攞(引)', modern: '啦—' },
  li: { tang: '里', modern: '利' },
  lu: { tang: '噜', modern: '卢' },
  lo: { tang: '路', modern: '洛' },
  le: { tang: '隶', modern: '蕾' },
  va: { tang: '嚩', modern: '瓦' },
  vā: { tang: '嚩(引)', modern: '瓦—' },
  vi: { tang: '尾', modern: '维' },
  vī: { tang: '味', modern: '维—' },
  vu: { tang: '嚩', modern: '武' },
  ve: { tang: '吠', modern: '威' },
  vo: { tang: '嚩', modern: '沃' },
  ka: { tang: '迦', modern: '嘎' },
  kā: { tang: '迦(引)', modern: '嘎—' },
  ki: { tang: '枳', modern: '吉' },
  kī: { tang: '计', modern: '吉—' },
  ku: { tang: '矩', modern: '古' },
  kū: { tang: '俱', modern: '古—' },
  ke: { tang: '计', modern: '给' },
  ko: { tang: '俱', modern: '果' },
  kha: { tang: '佉', modern: '卡' },
  khā: { tang: '佉(引)', modern: '卡—' },
  khi: { tang: '企', modern: '奇' },
  khe: { tang: '契', modern: '凯' },
  ga: { tang: '孽', modern: '嘎' },
  gā: { tang: '誐', modern: '嘎—' },
  gi: { tang: '拟', modern: '吉' },
  gu: { tang: '具', modern: '古' },
  ge: { tang: '诣', modern: '给' },
  go: { tang: '瞿', modern: '果' },
  gha: { tang: '伽', modern: '嘎哈' },
  gho: { tang: '具', modern: '果哈' },
  ca: { tang: '者', modern: '佳' },
  cā: { tang: '左', modern: '佳—' },
  ci: { tang: '只', modern: '奇' },
  cī: { tang: '支', modern: '奇—' },
  cu: { tang: '主', modern: '楚' },
  ce: { tang: '制', modern: '切' },
  ja: { tang: '惹', modern: '佳' },
  jā: { tang: '惹(引)', modern: '佳—' },
  ji: { tang: '自', modern: '吉' },
  jī: { tang: '时', modern: '吉—' },
  ju: { tang: '儒', modern: '朱' },
  je: { tang: '逝', modern: '杰' },
  jo: { tang: '树', modern: '卓' },
  ṭa: { tang: '吒', modern: '达' },
  ṭi: { tang: '置', modern: '蒂' },
  ṭu: { tang: '吒坞', modern: '度' },
  ḍa: { tang: '拏', modern: '达' },
  ḍi: { tang: '腻', modern: '迪' },
  ṇa: { tang: '拏', modern: '拿' },
  ṇā: { tang: '拏(引)', modern: '拿—' },
  ṇi: { tang: '抳', modern: '尼' },
  ṇī: { tang: '抳(引)', modern: '尼—' },
  ṇu: { tang: '怒', modern: '努' },
  ṇe: { tang: '宁', modern: '内' },
  ta: { tang: '怛', modern: '达' },
  tā: { tang: '多', modern: '达—' },
  ti: { tang: '底', modern: '帝' },
  tī: { tang: '底(引)', modern: '帝—' },
  tu: { tang: '都', modern: '度' },
  tū: { tang: '都(引)', modern: '度—' },
  te: { tang: '帝', modern: '帝' },
  to: { tang: '睹', modern: '多' },
  tha: { tang: '他', modern: '他' },
  thā: { tang: '他(引)', modern: '他—' },
  thi: { tang: '耻', modern: '提' },
  da: { tang: '捺', modern: '达' },
  dā: { tang: '陀', modern: '达—' },
  di: { tang: '地', modern: '迪' },
  dī: { tang: '第', modern: '迪—' },
  du: { tang: '努', modern: '杜' },
  de: { tang: '泥', modern: '得' },
  do: { tang: '怒', modern: '多' },
  dha: { tang: '驮', modern: '达哈' },
  dhā: { tang: '驮(引)', modern: '达哈—' },
  dhi: { tang: '地', modern: '迪' },
  dhī: { tang: '地(引)', modern: '迪—' },
  dhu: { tang: '度', modern: '度' },
  dhe: { tang: '第', modern: '得黑' },
  dho: { tang: '度', modern: '多哈' },
  pa: { tang: '跛', modern: '巴' },
  pā: { tang: '波', modern: '巴—' },
  pi: { tang: '比', modern: '比' },
  pu: { tang: '补', modern: '普' },
  pū: { tang: '布', modern: '普—' },
  pe: { tang: '闭', modern: '佩' },
  po: { tang: '布', modern: '波' },
  pha: { tang: '颇', modern: '帕' },
  ba: { tang: '跋', modern: '巴' },
  bā: { tang: '么', modern: '巴—' },
  bi: { tang: '尾', modern: '比' },
  bu: { tang: '没', modern: '布' },
  bo: { tang: '冒', modern: '博' },
  bha: { tang: '婆', modern: '巴哈' },
  bhā: { tang: '婆(引)', modern: '巴哈—' },
  bhi: { tang: '毗', modern: '比' },
  bhī: { tang: '鼻', modern: '比—' },
  bhu: { tang: '部', modern: '布' },
  bhū: { tang: '部(引)', modern: '布—' },
  bhe: { tang: '陛', modern: '贝' },
  bho: { tang: '𤚥', modern: '博' },
  ya: { tang: '耶', modern: '呀' },
  yā: { tang: '夜', modern: '呀—' },
  yi: { tang: '以', modern: '伊' },
  yu: { tang: '庾', modern: '尤' },
  yū: { tang: '愉', modern: '尤—' },
  ye: { tang: '曳', modern: '耶' },
  yo: { tang: '瑜', modern: '哟' },
  śa: { tang: '舍', modern: '夏' },
  śā: { tang: '奢', modern: '夏—' },
  śi: { tang: '室', modern: '希' },
  śī: { tang: '尸', modern: '希—' },
  śu: { tang: '戍', modern: '舒' },
  śū: { tang: '输', modern: '舒—' },
  śe: { tang: '势', modern: '谢' },
  śo: { tang: '戍', modern: '硕' },
  śrī: { tang: '室哩', modern: '室利' },
  ṣa: { tang: '洒', modern: '沙' },
  ṣi: { tang: '瑟', modern: '希' },
  ṣu: { tang: '刍', modern: '舒' },
  ṣe: { tang: '晒', modern: '晒' },
  sa: { tang: '萨', modern: '萨' },
  sā: { tang: '娑', modern: '萨—' },
  si: { tang: '悉', modern: '悉' },
  sī: { tang: '私', modern: '悉—' },
  su: { tang: '苏', modern: '苏' },
  sū: { tang: '素', modern: '苏—' },
  se: { tang: '细', modern: '塞' },
  so: { tang: '苏', modern: '索' },
  ha: { tang: '诃', modern: '哈' },
  hi: { tang: '呬', modern: '嘿' },
  hī: { tang: '醯', modern: '嘿—' },
  hu: { tang: '呼', modern: '呼' },
  hū: { tang: '虎', modern: '呼—' },
  he: { tang: '醯', modern: '黑' },
  ho: { tang: '护', modern: '霍' },
  hoḥ: { tang: '斛', modern: '霍赫' },
  jaḥ: { tang: '弱', modern: '佳赫' },
  pra: { tang: '钵啰', modern: '普啦' },
  tra: { tang: '怛啰', modern: '特啦' },
  trāḥ: { tang: '怛𑖨𑖯𑖾', modern: '特啦哈' },
  kṣa: { tang: '乞洒', modern: '克沙' },
  jña: { tang: '枳娘', modern: '佳拿' },
  jñā: { tang: '枳娘', modern: '佳拿—' },
  vaj: { tang: '嚩日', modern: '瓦吉' },
  pad: { tang: '钵讷', modern: '帕德' },
  sar: { tang: '萨哩', modern: '萨尔' },
  dhar: { tang: '达哩', modern: '达尔' },
  bud: { tang: '没', modern: '布德' },
  sat: { tang: '萨怛', modern: '萨特' },
  tva: { tang: '嚩', modern: '特瓦' },
  tvā: { tang: '嚩(引)', modern: '特瓦—' },
};

const VOWEL_RHYME_MAP: Record<string, { tangSuffix: string; modernVowel: string }> = {
  a: { tangSuffix: '', modernVowel: '阿' },
  ā: { tangSuffix: '(引)', modernVowel: '啊' },
  i: { tangSuffix: '伊', modernVowel: '伊' },
  ī: { tangSuffix: '伊(引)', modernVowel: '衣' },
  u: { tangSuffix: '坞', modernVowel: '乌' },
  ū: { tangSuffix: '污(引)', modernVowel: '乌' },
  ṛ: { tangSuffix: '哩', modernVowel: '哩' },
  ṝ: { tangSuffix: '哩(引)', modernVowel: '哩' },
  ḷ: { tangSuffix: '里', modernVowel: '里' },
  e: { tangSuffix: '曳', modernVowel: '诶' },
  ai: { tangSuffix: '爱', modernVowel: '爱' },
  o: { tangSuffix: '污', modernVowel: '欧' },
  au: { tangSuffix: '奥', modernVowel: '奥' },
};

/**
 * Convert a single Sanskrit syllable (Akṣara) into both Classical Tang Chinese (古汉语音译)
 * and Modern Mandarin Phonetic reading (现代梵音拼读).
 */
export function mapSyllableToChinesePhonetics(rawSyl: string): {
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

  if (SYLLABARY_OVERRIDE[s]) {
    return {
      classicalZh: SYLLABARY_OVERRIDE[s].tang,
      modernZh: SYLLABARY_OVERRIDE[s].modern,
    };
  }

  // Handle trailing anusvāra (ṃ) or visarga (ḥ)
  let base = s;
  let nasalTail = false;
  let visargaTail = false;

  if (base.endsWith('ṃ') || base.endsWith('ṁ')) {
    nasalTail = true;
    base = base.slice(0, -1);
  } else if (base.endsWith('ḥ')) {
    visargaTail = true;
    base = base.slice(0, -1);
  }

  if (SYLLABARY_OVERRIDE[base]) {
    const hit = SYLLABARY_OVERRIDE[base];
    return {
      classicalZh: hit.tang + (nasalTail ? '喃' : visargaTail ? '入' : ''),
      modernZh: hit.modern + (nasalTail ? '恩' : visargaTail ? '哈' : ''),
    };
  }

  // Deconstruct consonant cluster + vowel + coda
  const consonantTokens = [
    'kh', 'gh', 'ch', 'jh', 'ṭh', 'ḍh', 'th', 'dh', 'ph', 'bh',
    'k', 'g', 'ṅ', 'c', 'j', 'ñ', 'ṭ', 'ḍ', 'ṇ', 't', 'd', 'n',
    'p', 'b', 'm', 'y', 'r', 'l', 'v', 'ś', 'ṣ', 's', 'h',
  ];
  const vowelTokens = ['ai', 'au', 'ṝ', 'ḹ', 'ā', 'ī', 'ū', 'ṛ', 'ḷ', 'e', 'o', 'a', 'i', 'u'];

  let idx = 0;
  const onsets: string[] = [];
  while (idx < base.length) {
    const rest = base.slice(idx);
    const vMatch = vowelTokens.find((v) => rest.startsWith(v));
    if (vMatch) break;
    const cMatch = consonantTokens.find((c) => rest.startsWith(c));
    if (cMatch) {
      onsets.push(cMatch);
      idx += cMatch.length;
    } else {
      idx++;
    }
  }

  let vowel = 'a';
  const restAfterOnset = base.slice(idx);
  const vFound = vowelTokens.find((v) => restAfterOnset.startsWith(v));
  if (vFound) {
    vowel = vFound;
    idx += vFound.length;
  }

  const coda = base.slice(idx);

  // Check if the final (lastC + vowel + coda) or (lastC + vowel + ṃ) is in SYLLABARY_OVERRIDE
  let tangParts = '';
  let modernParts = '';

  if (onsets.length === 0) {
    const vEntry = SYLLABARY_OVERRIDE[vowel] || { tang: '阿', modern: '阿' };
    tangParts = vEntry.tang;
    modernParts = vEntry.modern;
  } else {
    for (let k = 0; k < onsets.length - 1; k++) {
      const c = onsets[k];
      tangParts += CONSONANT_ONSET_MAP[c]?.tang || '萨';
      modernParts += CONSONANT_ONSET_MAP[c]?.modern || '斯';
    }
    const lastC = onsets[onsets.length - 1];
    const lastClosed = lastC + vowel + (coda || (nasalTail ? 'ṃ' : ''));
    if (SYLLABARY_OVERRIDE[lastClosed]) {
      return {
        classicalZh: tangParts + SYLLABARY_OVERRIDE[lastClosed].tang,
        modernZh: modernParts + SYLLABARY_OVERRIDE[lastClosed].modern,
      };
    }

    const lastCV = lastC + vowel;
    if (SYLLABARY_OVERRIDE[lastCV]) {
      tangParts += SYLLABARY_OVERRIDE[lastCV].tang;
      modernParts += SYLLABARY_OVERRIDE[lastCV].modern;
    } else {
      const cMap = CONSONANT_ONSET_MAP[lastC] || { tang: '阿', modern: '阿' };
      const vMap = VOWEL_RHYME_MAP[vowel] || { tangSuffix: '', modernVowel: '' };
      tangParts += cMap.tang + vMap.tangSuffix;
      modernParts += cMap.modern + (vowel === 'a' ? '' : vMap.modernVowel);
    }
  }

  // Handle coda consonants (e.g., r, m, n, t, k)
  if (coda) {
    if (coda === 'm' || coda === 'n' || coda === 'ṇ' || coda === 'ṅ' || coda === 'ñ') {
      tangParts += '喃';
      modernParts += '恩';
    } else if (coda === 'r') {
      tangParts += '哩';
      modernParts += '尔';
    } else if (coda === 't' || coda === 'd' || coda === 'ṭ') {
      tangParts += '怛';
      modernParts += '特';
    } else if (coda === 'k') {
      tangParts += '羯';
      modernParts += '克';
    } else if (coda === 's' || coda === 'ś' || coda === 'ṣ') {
      tangParts += '悉';
      modernParts += '斯';
    }
  }

  if (nasalTail) {
    tangParts += '喃';
    modernParts += '恩';
  }
  if (visargaTail) {
    modernParts += '哈';
  }

  return {
    classicalZh: tangParts,
    modernZh: modernParts,
  };
}

/**
 * Convert an entire Sanskrit IAST sentence/verse into:
 * - Full Classical Tang/Song Chinese Transliteration (古汉语音译)
 * - Full Modern Sanskrit Phonetic Guide (梵音拼读参考)
 */
export function generateVerseChinesePhonetics(
  iastVerse: string,
  includeIastBrackets = true
): {
  classicalTranslitZh: string;
  modernPhoneticZh: string;
} {
  const cleaned = cleanEditorialIast(iastVerse);
  const rawTokens = cleaned.split(/\s+/).filter(Boolean);

  const classicalTokens: string[] = [];
  const modernTokens: string[] = [];

  for (const tok of rawTokens) {
    if (tok === '|' || tok === '||') {
      classicalTokens.push(tok);
      modernTokens.push(tok);
      continue;
    }

    const strippedWord = tok.toLowerCase().replace(/[|.,;!?—–-]+/g, '');
    if (!strippedWord) continue;

    const dictHit = WORD_CLASSICAL_DICTIONARY[strippedWord];
    if (dictHit) {
      classicalTokens.push(dictHit.classicalZh.split('/')[0].trim());
      modernTokens.push(
        includeIastBrackets ? `${dictHit.modernZh}(${strippedWord})` : dictHit.modernZh
      );
      continue;
    }

    const syllables = analyzeSanskritProsody(tok);
    if (syllables.length === 0) continue;

    const sylClassical: string[] = [];
    const sylModern: string[] = [];
    for (const syl of syllables) {
      const mapped = mapSyllableToChinesePhonetics(syl.iast);
      if (mapped.classicalZh) sylClassical.push(mapped.classicalZh);
      if (mapped.modernZh) sylModern.push(mapped.modernZh);
    }

    classicalTokens.push(sylClassical.join(''));
    const joinedModern = sylModern.join('-');
    modernTokens.push(
      includeIastBrackets ? `${joinedModern}(${strippedWord})` : joinedModern
    );
  }

  return {
    classicalTranslitZh: classicalTokens.join(' '),
    modernPhoneticZh: modernTokens.join(' · '),
  };
}

/**
 * Formats a verse's Modern Phonetic Guide (梵音拼读参考) according to the user's
 * toggle preference for showing or hiding parenthesized (IAST) annotations.
 */
export function formatModernPhoneticWithIastOption(
  rawModernPhoneticZh: string,
  iastVerse: string,
  showIastBracket: boolean
): string {
  const hasExistingBrackets = /\([a-zA-Zāīūṛṝḷḹṅñṭḍṇśṣṃṁḥ'-]+\)/.test(
    rawModernPhoneticZh
  );

  if (!showIastBracket) {
    if (!hasExistingBrackets) return rawModernPhoneticZh;
    // Strip parenthesized Latin/IAST annotations while preserving Chinese notes
    return rawModernPhoneticZh
      .replace(/\s*\([a-zA-Zāīūṛṝḷḹṅñṭḍṇśṣṃṁḥ\s'-]+\)/g, '')
      .replace(/\s+·\s+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  // User enabled showIastBracket === true
  if (hasExistingBrackets) {
    return rawModernPhoneticZh;
  }

  // If the curated verse did not embed (iast) brackets in modernPhoneticZh,
  // align word tokens or generate bracketed phonetic guide
  const iastWords = cleanEditorialIast(iastVerse)
    .split(/\s+/)
    .map((w) => w.replace(/[|.,;!?—–-]+/g, '').trim())
    .filter(Boolean);

  const zhTokens = rawModernPhoneticZh
    .split(/\s+/)
    .filter((t) => t !== '|' && t !== '||' && t !== '—');

  if (iastWords.length > 0 && iastWords.length === zhTokens.length) {
    let wordIdx = 0;
    return rawModernPhoneticZh
      .split(/(\s+)/)
      .map((piece) => {
        const trimmed = piece.trim();
        if (!trimmed || trimmed === '|' || trimmed === '||' || trimmed === '—') {
          return piece;
        }
        const iastW = iastWords[wordIdx++];
        if (iastW && !trimmed.includes('(')) {
          return `${trimmed}(${iastW.toLowerCase()})`;
        }
        return piece;
      })
      .join('');
  }

  return generateVerseChinesePhonetics(iastVerse, true).modernPhoneticZh;
}

const SANSKRIT_GRAMMAR_MEANING_HINTS: Array<{
  pattern: RegExp;
  grammar: string;
  meaningZh: string;
}> = [
  { pattern: /^o[ṃṁm]$/i, grammar: 'Pranava · 圣音', meaningZh: '三身总持圣音（法报化三身摄受）' },
  { pattern: /^nam(o|aḥ|as|a)$/i, grammar: 'Indecl. · 归敬词', meaningZh: '归命、顶礼、礼敬' },
  { pattern: /^tadyathā$/i, grammar: 'Adv. · 咒引词', meaningZh: '所谓、即说咒曰' },
  { pattern: /^svāhā$/i, grammar: 'Indecl. · 结印词', meaningZh: '圆满吉祥成就、善说决定' },
  { pattern: /^hū[ṃṁm]$/i, grammar: 'Bīja · 金刚种子字', meaningZh: '菩提心坚固不坏、摧伏一切障' },
  { pattern: /^phaṭ$/i, grammar: 'Bīja · 摧破音', meaningZh: '顿断无明烦恼与魔障' },
  { pattern: /^hrīḥ$/i, grammar: 'Bīja · 莲华部种子', meaningZh: '清净惭愧、观自在与弥陀心印' },
  { pattern: /^bhrū[ṃṁm]$/i, grammar: 'Bīja · 佛顶种子字', meaningZh: '一字顶轮王与尊胜佛顶最上心印' },
  { pattern: /^dhīḥ$/i, grammar: 'Bīja · 般若种子字', meaningZh: '文殊菩萨与般若波罗蜜甚深智慧' },
  { pattern: /āya$/i, grammar: 'Dat. Sg. · 为格单数', meaningZh: '向…致敬 / 为…故（归命对象）' },
  { pattern: /(ebhyaḥ|bhyaḥ)$/i, grammar: 'Dat. Pl. · 为格复数', meaningZh: '向一切诸尊顶礼' },
  { pattern: /(ānāṃ|ānām|nāṃ|nām)$/i, grammar: 'Gen. Pl. · 属格复数', meaningZh: '一切诸尊之总持' },
  { pattern: /(syā|sya)$/i, grammar: 'Gen. Sg. · 属格单数', meaningZh: '彼尊之秘密法印' },
  { pattern: /(e|i)$/i, grammar: 'Voc./Loc. · 呼格/处格', meaningZh: '呼请本尊安住加持' },
];

/**
 * Automatically generates structured WordGloss[] for any Sanskrit IAST verse line
 * so every entry across DB1–DB12, GRETIL, and CBETA has unified word-by-word analysis.
 */
export function buildWordGlossesFromIast(iastVerse: string): Array<{
  iast: string;
  stem?: string;
  grammar?: string;
  transliterationZh: string;
  meaningZh: string;
}> {
  const cleaned = cleanEditorialIast(iastVerse);
  const rawTokens = cleaned
    .split(/[\s\-—–|॥।,.;!?]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 1);

  return rawTokens.slice(0, 14).map((word) => {
    const lower = word.toLowerCase();
    const dictHit = WORD_CLASSICAL_DICTIONARY[lower];
    const phon = generateVerseChinesePhonetics(word, false);

    let grammar = 'Mantra-pada · 真言句义';
    let meaningZh = dictHit?.meaningZh || `梵音密语「${phon.modernPhoneticZh}」· 契入本尊三昧总持`;

    for (const hint of SANSKRIT_GRAMMAR_MEANING_HINTS) {
      if (hint.pattern.test(lower)) {
        grammar = hint.grammar;
        if (!dictHit?.meaningZh) {
          meaningZh = hint.meaningZh;
        }
        break;
      }
    }

    if (lower.includes('sarva') && !dictHit?.meaningZh) {
      meaningZh = '一切、普皆遍满';
    } else if (lower.includes('buddh') && !dictHit?.meaningZh) {
      meaningZh = '诸佛觉者';
    } else if (lower.includes('bodhisattv') && !dictHit?.meaningZh) {
      meaningZh = '菩提萨埵（觉有情）';
    } else if (lower.includes('vajr') && !dictHit?.meaningZh) {
      meaningZh = '金刚不坏智';
    } else if (lower.includes('padm') && !dictHit?.meaningZh) {
      meaningZh = '妙法莲华';
    } else if (lower.includes('rakṣ') && !dictHit?.meaningZh) {
      meaningZh = '拥护、守护行者';
    } else if (lower.includes('śānt') && !dictHit?.meaningZh) {
      meaningZh = '寂静、息灾吉祥';
    } else if (lower.includes('viśuddh') && !dictHit?.meaningZh) {
      meaningZh = '最极清净无垢';
    }

    return {
      iast: word,
      stem: lower.replace(/(āya|ebhyaḥ|ānāṃ|ānām|sya)$/i, ''),
      grammar,
      transliterationZh: `${dictHit?.classicalZh || phon.classicalTranslitZh}（拼读：${dictHit?.modernZh || phon.modernPhoneticZh}）`,
      meaningZh,
    };
  });
}

