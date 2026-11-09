/**
 * src/data/siddhamMatrix.ts
 * 34×14 Dual-Track Modern Acoustic & Tang Siddhaṃ Phonetic Matrix
 * Ported from sanskrit_phonetic_engine.html (Module 2, lines 520–643)
 */

export interface ConsonantMatrixEntry {
  varga: string;
  bare: [string, string]; // [modernBare, tangBare]
  m: [string, string, string, string, string, string, string, string]; // 8 vowel-group modern phonetic strings
  t: [string, string, string, string, string, string, string, string]; // 8 vowel-group Tang Siddhaṃ strings
  ipa: string;
  note: string;
}

export interface SyllableOverrideEntry {
  m: string;
  t: string;
  note: string;
  bijaMeaning?: string;
}

export const VOWEL_MAP: Record<string, [string, string]> = {
  'a': ['阿', '阿'], 'A': ['阿', '阿'],
  'i': ['伊', '伊'], 'I': ['衣', '伊'],
  'u': ['乌', '坞'], 'U': ['屋', '乌'],
  'f': ['里', '哩'], 'F': ['里', '哩'],
  'x': ['吕', '力'], 'X': ['吕', '力'],
  'e': ['诶', '翳'], 'E': ['爱', '蔼'],
  'o': ['欧', '污'], 'O': ['奥', '奥']
};

export const VOWEL_IPA_MAP: Record<string, string> = {
  'a': 'ɐ', 'A': 'ɑː',
  'i': 'i', 'I': 'iː',
  'u': 'u', 'U': 'uː',
  'f': 'r̩', 'F': 'r̩ː',
  'x': 'l̩', 'X': 'l̩ː',
  'e': 'eː', 'E': 'ɐi̯',
  'o': 'oː', 'O': 'ɐu̯'
};

export const VOWEL_INDEX: Record<string, number> = {
  'a': 0, 'A': 0,
  'i': 1, 'I': 1,
  'u': 2, 'U': 2,
  'f': 3, 'F': 3, 'x': 3, 'X': 3,
  'e': 4,
  'E': 5,
  'o': 6,
  'O': 7
};

export const LONG_VOWELS = new Set(['A', 'I', 'U', 'F', 'X', 'e', 'E', 'o', 'O']);
export const INHERENT_LONG_VOWELS = new Set(['A', 'I', 'U', 'F', 'X']);

export const CONS_MATRIX: Record<string, ConsonantMatrixEntry> = {
  // 喉音 (Ka-varga / Velars)
  'k': { varga: '喉音 (Velar)', bare: ['克', '克'], m: ['嘎', '给', '咕', '格里', '给', '该', '郭', '高'], t: ['迦', '吉', '俱', '讫哩', '计', '皆', '拘', '憍'], ipa: 'k', note: '喉清不送气 (听感如 g)' },
  'K': { varga: '喉音 (Velar)', bare: ['可', '佉'], m: ['卡', '奇', '枯', '克里', '开', '凯', '考', '尻'], t: ['佉', '弃', '区', '企哩', '契', '楷', '寇', '考'], ipa: 'kʰ', note: '喉清送气 (kh)' },
  'g': { varga: '喉音 (Velar)', bare: ['格', '伽'], m: ['噶', '吉', '古', '格里', '给', '改', '果', '搞'], t: ['伽', '祇', '具', '吃哩', '艺', '盖', '瞿', '豪'], ipa: 'ɡ', note: '喉浊不送气 (g)' },
  'G': { varga: '喉音 (Velar)', bare: ['格哈', '伽'], m: ['噶哈', '吉哈', '古哈', '格里哈', '给哈', '改哈', '果哈', '搞哈'], t: ['伽', '祇', '具', '伽哩', '诣', '慨', '瞿', '豪'], ipa: 'ɡʱ', note: '喉浊送气 (gh)' },
  'N': { varga: '喉音 (Velar)', bare: ['昂', '仰'], m: ['昂阿', '昂伊', '昂乌', '昂里', '昂诶', '昂爱', '昂欧', '昂奥'], t: ['仰', '儗', '隅', '仰哩', '倪', '捱', '悟', '敖'], ipa: 'ŋ', note: '喉鼻音 (ṅ / ng)' },

  // 颚音 (Ca-varga / Palatals)
  'c': { varga: '颚音 (Palatal)', bare: ['兹', '遮'], m: ['扎', '几', '租', '兹里', '哲', '斋', '卓', '招'], t: ['遮', '支', '主', '室哩', '制', '斋', '祖', '昭'], ipa: 'tɕ', note: '颚清不送气 (听感如 j/zh)' },
  'C': { varga: '颚音 (Palatal)', bare: ['呲', '车'], m: ['擦', '七', '粗', '次里', '车', '拆', '绰', '超'], t: ['车', '齿', '刍', '痴哩', '掣', '差', '初', '抄'], ipa: 'tɕʰ', note: '颚清送气 (ch/q)' },
  'j': { varga: '颚音 (Palatal)', bare: ['吉', '阇'], m: ['佳', '吉', '居', '吉里', '杰', '宅', '卓', '焦'], t: ['阇', '尔', '殊', '日哩', '逝', '惹', '助', '招'], ipa: 'dʑ', note: '颚浊不送气 (j)' },
  'J': { varga: '颚音 (Palatal)', bare: ['吉哈', '社'], m: ['佳哈', '吉哈', '居哈', '吉里哈', '杰哈', '宅哈', '卓哈', '焦哈'], t: ['社', '时', '殊', '社哩', '誓', '寨', '祚', '召'], ipa: 'dʑʱ', note: '颚浊送气 (jh)' },
  'Y': { varga: '颚音 (Palatal)', bare: ['尼', '若'], m: ['尼亚', '尼', '纽', '尼里', '涅', '尼爱', '尼欧', '尼奥'], t: ['若', '你', '柔', '若哩', '泥', '乃', '尿', '饶'], ipa: 'ɲ', note: '颚鼻音 (ñ / ny)' },

  // 卷舌音 (Ṭa-varga / Retroflexes)
  'w': { varga: '卷舌音 (Retroflex)', bare: ['特', '吒'], m: ['哒', '滴', '嘟', '德里', '得', '呆', '多', '刀'], t: ['吒', '知', '都', '致哩', '致', '斋', '都', '嘲'], ipa: 'ʈ', note: '卷舌清不送气 (ṭ)' },
  'W': { varga: '卷舌音 (Retroflex)', bare: ['踏', '咤'], m: ['踏', '踢', '突', '特里', '忒', '胎', '托', '掏'], t: ['咤', '耻', '偷', '耻哩', '体', '泰', '侘', '滔'], ipa: 'ʈʰ', note: '卷舌清送气 (ṭh)' },
  'q': { varga: '卷舌音 (Retroflex)', bare: ['德', '荼'], m: ['达', '迪', '读', '德里', '得', '代', '夺', '导'], t: ['荼', '腻', '度', '荼哩', '提', '代', '度', '陶'], ipa: 'ɖ', note: '卷舌浊不送气 (ḍ)' },
  'Q': { varga: '卷舌音 (Retroflex)', bare: ['德哈', '荼'], m: ['达哈', '迪哈', '读哈', '德里哈', '得哈', '代哈', '夺哈', '导哈'], t: ['荼', '腻', '度', '荼哩', '提', '代', '度', '陶'], ipa: 'ɖʱ', note: '卷舌浊送气 (ḍh)' },
  'R': { varga: '卷舌音 (Retroflex)', bare: ['呐', '拏'], m: ['呐', '尼', '奴', '呐里', '内', '乃', '诺', '挠'], t: ['拏', '尼', '怒', '拏哩', '泥', '乃', '诺', '闹'], ipa: 'ɳ', note: '卷舌鼻音 (ṇ)' },

  // 齿音 (Ta-varga / Dentals)
  't': { varga: '齿音 (Dental)', bare: ['特', '多'], m: ['搭', '滴', '督', '特里', '得', '呆', '多', '刀'], t: ['多', '底', '都', '底哩', '帝', '带', '都', '刀'], ipa: 't̪', note: '齿清不送气 (听感如 d)' },
  'T': { varga: '齿音 (Dental)', bare: ['塔', '他'], m: ['塔', '替', '图', '特里', '太', '泰', '托', '涛'], t: ['他', '体', '土', '他哩', '替', '太', '吐', '讨'], ipa: 't̪ʰ', note: '齿清送气 (th)' },
  'd': { varga: '齿音 (Dental)', bare: ['德', '陀'], m: ['达', '迪', '读', '德里', '代', '歹', '朵', '道'], t: ['陀', '地', '度', '陀哩', '提', '代', '度', '道'], ipa: 'd̪', note: '齿浊不送气 (d)' },
  'D': { varga: '齿音 (Dental)', bare: ['德哈', '驮'], m: ['达哈', '迪哈', '读哈', '德里哈', '代哈', '歹哈', '朵哈', '道哈'], t: ['驮', '第', '度', '驮哩', '提', '代', '度', '道'], ipa: 'd̪ʱ', note: '齿浊送气 (dh)' },
  'n': { varga: '齿音 (Dental)', bare: ['恩', '那'], m: ['那', '尼', '努', '那哩', '内', '奈', '诺', '恼'], t: ['那', '尼', '奴', '那哩', '祢', '乃', '怒', '恼'], ipa: 'n̪', note: '齿鼻音 (n)' },

  // 唇音 (Pa-varga / Labials)
  'p': { varga: '唇音 (Labial)', bare: ['普', '波'], m: ['巴', '比', '布', '普里', '贝', '拜', '波', '包'], t: ['波', '比', '补', '钵哩', '闭', '拜', '逋', '宝'], ipa: 'p', note: '唇清不送气 (听感如 b)' },
  'P': { varga: '唇音 (Labial)', bare: ['扑', '颇'], m: ['帕', '批', '铺', '普里', '胚', '派', '坡', '抛'], t: ['颇', '匹', '普', '颇哩', '沛', '派', '破', '泡'], ipa: 'pʰ', note: '唇清送气 (ph)' },
  'b': { varga: '唇音 (Labial)', bare: ['布', '婆'], m: ['拔', '鼻', '不', '布里', '北', '白', '博', '薄'], t: ['婆', '毗', '部', '跋哩', '陛', '败', '菩', '暴'], ipa: 'b', note: '唇浊不送气 (b)' },
  'B': { varga: '唇音 (Labial)', bare: ['布哈', '婆'], m: ['巴(重)', '比(重)', '布(重)', '布里(重)', '贝(重)', '拜(重)', '博(重)', '包(重)'], t: ['婆', '毗', '部', '婆哩', '吠', '拜', '菩', '鲍'], ipa: 'bʱ', note: '唇浊送气 (bh)' },
  'm': { varga: '唇音 (Labial)', bare: ['姆', '摩'], m: ['嘛', '咪', '木', '姆里', '美', '麦', '摩', '毛'], t: ['摩', '弥', '母', '蜜哩', '迷', '迈', '谟', '矛'], ipa: 'm', note: '唇鼻音 (m)' },

  // 半元音与擦音 (Antaḥstha & Ūṣman)
  'y': { varga: '半元音 (Semivowel)', bare: ['伊', '耶'], m: ['呀', '伊', '优', '伊里', '耶', '崖', '哟', '妖'], t: ['耶', '以', '由', '拽哩', '曳', '耶', '瑜', '要'], ipa: 'j', note: '颚半元音 (y)' },
  'r': { varga: '半元音 (Semivowel)', bare: ['尔', '啰'], m: ['啦', '里', '鲁', '里', '雷', '来', '罗', '劳'], t: ['啰', '利', '噜', '哩', '礼', '来', '路', '牢'], ipa: 'r', note: '舌尖颤音 (r)' },
  'l': { varga: '半元音 (Semivowel)', bare: ['勒', '罗'], m: ['拉', '利', '卢', '勒里', '雷', '赖', '洛', '捞'], t: ['罗', '离', '路', '嚧', '隶', '赖', '路', '劳'], ipa: 'l', note: '齿边音 (l)' },
  'v': { varga: '半元音 (Semivowel)', bare: ['夫', '嚩'], m: ['瓦', '维', '乌', '弗里', '威', '歪', '窝', '凹'], t: ['嚩', '尾', '无', '嚩哩', '吠', '吠', '务', '嚩奥'], ipa: 'ʋ', note: '唇齿半元音 (v/w)' },
  'S': { varga: '擦音 (Sibilant)', bare: ['什', '奢'], m: ['夏', '希', '舒', '什里', '谁', '晒', '说', '烧'], t: ['奢', '尸', '输', '室哩', '世', '晒', '戍', '烧'], ipa: 'ɕ', note: '颚擦音 (ś / sh)' },
  'z': { varga: '擦音 (Sibilant)', bare: ['嘶', '沙'], m: ['沙', '师', '书', '什里', '奢', '筛', '朔', '稍'], t: ['沙', '史', '刍', '瑟哩', '势', '晒', '疏', '梢'], ipa: 'ʂ', note: '卷舌擦音 (ṣ)' },
  's': { varga: '擦音 (Sibilant)', bare: ['斯', '娑'], m: ['萨', '西', '苏', '斯里', '塞', '腮', '索', '骚'], t: ['娑', '悉', '苏', '悉哩', '细', '赛', '素', '骚'], ipa: 's', note: '齿擦音 (s)' },
  'h': { varga: '气音 (Aspirate)', bare: ['赫', '诃'], m: ['哈', '希', '呼', '赫里', '黑', '嗨', '豁', '好'], t: ['诃', '醯', '虎', '紇哩', '醯', '海', '呼', '豪'], ipa: 'ɦ', note: '声门浊擦音 (h)' },
  'L': { varga: '吠陀音 (Vedic)', bare: ['勒', '罗'], m: ['啦', '里', '卢', '里', '雷', '赖', '洛', '捞'], t: ['罗', '离', '路', '哩', '隶', '赖', '路', '劳'], ipa: 'ɭ', note: '吠陀卷舌边音 (ḷ)' }
};

export const SYLLABLE_OVERRIDES: Record<string, SyllableOverrideEntry> = {
  'oM':   { m: '嗡',     t: '唵',     note: '神圣种子字 (oṃ)', bijaMeaning: '三身无上法界体性种子字 (Praṇava)' },
  'hUM':  { m: '轰',     t: '吽',     note: '圆满种子字 (hūṃ)', bijaMeaning: '金刚部阿閦如来/愤怒尊菩提心种子字' },
  'huM':  { m: '轰',     t: '吽',     note: '种子字 (huṃ)', bijaMeaning: '金刚部种子字' },
  'hrIH': { m: '赫里希', t: '纥哩',   note: '莲花部种子字 (hrīḥ)', bijaMeaning: '阿弥陀佛/观自在菩萨莲花部清净种子字' },
  'hrIM': { m: '赫里姆', t: '纥哩',   note: '种子字 (hrīṃ)', bijaMeaning: '幻化母/大悲莲花钩召种子字 (Māyābīja)' },
  'SrIM': { m: '什里姆', t: '室哩',   note: '吉祥种子字 (śrīṃ)', bijaMeaning: '大吉祥天女增益福德种子字 (Lakṣmībīja)' },
  'klIM': { m: '克里姆', t: '讫哩',   note: '钩召种子字 (klīṃ)', bijaMeaning: '金刚爱染/敬爱钩召种子字 (Kāmabīja)' },
  'krIM': { m: '克里姆', t: '讫哩',   note: '愤怒明王种子字 (krīṃ)', bijaMeaning: '大黑天/电光母除障种子字' },
  'EM':   { m: '爱姆',   t: '蔼',     note: '语自在种子字 (aiṃ)', bijaMeaning: '妙音天女/文殊语轮智慧种子字 (Vāgbhavabīja)' },
  'DIH':  { m: '迪希',   t: '谛',     note: '文殊智慧种子字 (dhīḥ)', bijaMeaning: '文殊菩萨般若甚深智慧种子字' },
  'BrUM': { m: '布鲁姆', t: '勃',     note: '佛顶尊胜种子字 (bhrūṃ)', bijaMeaning: '一字金轮佛顶/尊胜佛顶轮王种子字' },
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
  'Paw':  { m: '帕特',   t: '发吒',   note: '破障催伏音 (phaṭ)', bijaMeaning: '摧破一切魔障无明结缚心咒尾音 (Astramantra)' },
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
