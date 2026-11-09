/**
 * 梵语文字学与悉昙声明学核心转写引擎 (src/core/transliterator.ts)
 *
 * 融合：
 * 1. CBETA 悉昙梵字 (Siddhaṃ Unicode U+11580–U+115FF) & 天城体 (Devanāgarī U+0900–U+097F) 精确互转
 * 2. 国际梵文转写 (IAST) ↔ 国际音标 (IPA) ↔ SLP1 单字符音素码
 * 3. 《改善语音发音方案》v2.0 的 34 辅音 × 14 元音双轨矩阵（现代声学听感跟读 + 玄奘/不空唐代悉昙古音译）
 * 4. 悉昙五十字母表（十四摩多 + 三十六体文五字门）完整声明学字典
 */

export interface SiddhamLetterEntry {
  iast: string;
  devanagari: string;
  siddham: string;
  ipa: string;
  tangChar: string;
  modernPhonetic: string;
  group: string;
  placeZh: string;
  esotericMeaningZh: string;
}

export interface DualTrackConsonantRow {
  slp: string;
  iast: string;
  deva: string;
  siddham: string;
  varga: string;
  bare: [string, string]; // [现代收音, 唐代收音]
  m: string[];            // 8 组元音列现代听感跟读: [a/ā, i/ī, u/ū, ṛ/ṝ/ḷ, e, ai, o, au]
  t: string[];            // 8 组元音列唐代悉昙古译
  note: string;
}

// 独立元音与附标映射表 (SLP1 基准)
export const DEVA_TO_SLP1: Record<string, string> = {
  'अ':'a', 'आ':'A', 'इ':'i', 'ई':'I', 'उ':'u', 'ऊ':'U',
  'ऋ':'f', 'ॠ':'F', 'ऌ':'x', 'ॡ':'X', 'ए':'e', 'ऐ':'E', 'ओ':'o', 'औ':'O',
  'ा':'A', 'ि':'i', 'ी':'I', 'ु':'u', 'ू':'U',
  'ृ':'f', 'ॄ':'F', 'ॢ':'x', 'ॣ':'X', 'े':'e', 'ै':'E', 'ो':'o', 'ौ':'O',
  'ं':'M', 'ः':'H', 'ँ':'~', 'ऽ':"'", 'ॐ':'oM', '।':'|', '॥':'||',
  'क':'k', 'ख':'K', 'ग':'g', 'घ':'G', 'ङ':'N',
  'च':'c', 'छ':'C', 'ज':'j', 'झ':'J', 'ञ':'Y',
  'ट':'w', 'ठ':'W', 'ड':'q', 'ढ':'Q', 'ण':'R',
  'त':'t', 'थ':'T', 'द':'d', 'ध':'D', 'न':'n',
  'प':'p', 'फ':'P', 'ब':'b', 'भ':'B', 'म':'m',
  'य':'y', 'र':'r', 'ल':'l', 'व':'v',
  'श':'S', 'ष':'z', 'स':'s', 'ह':'h', 'ळ':'L'
};

const DEVA_CONSONANTS = new Set('कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहळ'.split(''));
const DEVA_MATRAS = new Set('ािीुूृॄॢॣेैोौ'.split(''));
const DEVA_IGNORE = new Set(['\u0951', '\u0952', '\u0953', '\u0954', '\u200c', '\u200d']);

const IAST_TO_SLP1_RULES: [string, string][] = [
  ['ai', 'E'], ['au', 'O'],
  ['kh', 'K'], ['gh', 'G'], ['ch', 'C'], ['jh', 'J'],
  ['ṭh', 'W'], ['ḍh', 'Q'], ['th', 'T'], ['dh', 'D'], ['ph', 'P'], ['bh', 'B'],
  ['ṝ', 'F'], ['ḹ', 'X'], ['ā', 'A'], ['ī', 'I'], ['ū', 'U'], ['ṛ', 'f'], ['ḷ', 'x'],
  ['ē', 'e'], ['ō', 'o'],
  ['ṅ', 'N'], ['ñ', 'Y'], ['ṭ', 'w'], ['ḍ', 'q'], ['ṇ', 'R'], ['ś', 'S'], ['ṣ', 'z'],
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

export const SLP1_TO_IAST: Record<string, string> = {
  'a':'a','A':'ā','i':'i','I':'ī','u':'u','U':'ū','f':'ṛ','F':'ṝ','x':'ḷ','X':'ḹ','e':'e','E':'ai','o':'o','O':'au',
  'M':'ṃ','H':'ḥ','~':'ँ',"'":"'",
  'k':'k','K':'kh','g':'g','G':'gh','N':'ṅ','c':'c','C':'ch','j':'j','J':'jh','Y':'ñ',
  'w':'ṭ','W':'ṭh','q':'ḍ','Q':'ḍh','R':'ṇ','t':'t','T':'th','d':'d','D':'dh','n':'n',
  'p':'p','P':'ph','b':'b','B':'bh','m':'m','y':'y','r':'r','l':'l','v':'v','S':'ś','z':'ṣ','s':'s','h':'h','L':'ḷ'
};

export const SLP1_VOWEL_TO_DEVA: Record<string, string> = {
  'a':'अ','A':'आ','i':'इ','I':'ई','u':'उ','U':'ऊ','f':'ऋ','F':'ॠ','x':'ऌ','X':'ॡ','e':'ए','E':'ऐ','o':'ओ','O':'औ'
};
export const SLP1_MATRA_TO_DEVA: Record<string, string> = {
  'a':'','A':'ा','i':'ि','I':'ी','u':'ु','U':'ू','f':'ृ','F':'ॄ','x':'ॢ','X':'ॣ','e':'े','E':'ै','o':'ो','O':'ौ'
};
export const SLP1_CONS_TO_DEVA: Record<string, string> = {
  'k':'क','K':'ख','g':'ग','G':'घ','N':'ङ','c':'च','C':'छ','j':'ज','J':'झ','Y':'ञ',
  'w':'ट','W':'ठ','q':'ड','Q':'ढ','R':'ण','t':'त','T':'थ','d':'द','D':'ध','n':'न',
  'p':'प','P':'फ','b':'ब','B':'भ','m':'म','y':'य','r':'र','l':'ल','v':'व','S':'श','z':'ष','s':'स','h':'ह','L':'ळ'
};

// Unicode Siddhaṃ (U+11580–U+115FF) 映射表
export const SLP1_VOWEL_TO_SIDDHAM: Record<string, string> = {
  'a':'𑖀','A':'𑖁','i':'𑖂','I':'𑖃','u':'𑖄','U':'𑖅','f':'𑖆','F':'𑖇','x':'𑖈','X':'𑖉','e':'𑖊','E':'𑖋','o':'𑖌','O':'𑖍'
};
export const SLP1_MATRA_TO_SIDDHAM: Record<string, string> = {
  'a':'','A':'𑖯','i':'𑖰','I':'𑖱','u':'𑖲','U':'𑖳','f':'𑖴','F':'𑖵','x':'𑖴','X':'𑖵','e':'𑖼','E':'𑖽','o':'𑖾','O':'𑖿'
};
export const SLP1_CONS_TO_SIDDHAM: Record<string, string> = {
  'k':'𑖎','K':'𑖏','g':'𑖐','G':'𑖑','N':'𑖒','c':'𑖓','C':'𑖔','j':'𑖕','J':'𑖖','Y':'𑖗',
  'w':'𑖘','W':'𑖙','q':'𑖚','Q':'𑖛','R':'𑖜','t':'𑖝','T':'𑖞','d':'𑖟','D':'𑖠','n':'𑖡',
  'p':'𑖢','P':'𑖣','b':'𑖤','B':'𑖥','m':'𑖦','y':'𑖧','r':'𑖨','l':'𑖩','v':'𑖪','S':'𑖫','z':'𑖬','s':'𑖭','h':'𑖮','L':'𑖩'
};

// SLP1 -> IPA 国际音标映射
export const SLP1_TO_IPA: Record<string, string> = {
  'a':'ɐ','A':'ɑː','i':'i','I':'iː','u':'u','U':'uː','f':'r̩','F':'r̩ː','x':'l̩','X':'l̩ː','e':'eː','E':'ɐi̯','o':'oː','O':'ɐu̯',
  'M':'m̃','H':'h','~':'̃',"'":'ː',
  'k':'k','K':'kʰ','g':'ɡ','G':'ɡʱ','N':'ŋ','c':'tɕ','C':'tɕʰ','j':'dʑ','J':'dʑʱ','Y':'ɲ',
  'w':'ʈ','W':'ʈʰ','q':'ɖ','Q':'ɖʱ','R':'ɳ','t':'t̪','T':'t̪ʰ','d':'d̪','D':'d̪ʱ','n':'n̪',
  'p':'p','P':'pʰ','b':'b','B':'bʱ','m':'m','y':'j','r':'r','l':'l','v':'ʋ','S':'ɕ','z':'ʂ','s':'s','h':'ɦ','L':'ɭ'
};

/**
 * 100% 无死角梵音 -> 中文双轨字典矩阵 (34 辅音 × 14 元音 + 修饰符)
 * 源自《改善语音发音方案》v2.0
 */
export const VOWEL_DUAL_MAP: Record<string, [string, string]> = {
  'a': ['阿', '阿'], 'A': ['阿', '阿'],
  'i': ['伊', '伊'], 'I': ['衣', '伊'],
  'u': ['乌', '坞'], 'U': ['屋', '乌'],
  'f': ['里', '哩'], 'F': ['里', '哩'],
  'x': ['吕', '力'], 'X': ['吕', '力'],
  'e': ['诶', '翳'], 'E': ['爱', '蔼'],
  'o': ['欧', '污'], 'O': ['奥', '奥']
};

export const CONS_MATRIX: Record<string, {
  varga: string;
  bare: [string, string];
  m: string[];
  t: string[];
  note: string;
}> = {
  // 喉音 (Ka-varga / Velars)
  'k': { varga:'喉音 (Velar)', bare:['克','克'], m:['嘎','给','咕','格里','给','该','郭','高'], t:['迦','吉','俱','讫哩','计','皆','拘','憍'], note:'喉清不送气 (听感如 g)' },
  'K': { varga:'喉音 (Velar)', bare:['可','佉'], m:['卡','奇','枯','克里','开','凯','考','尻'], t:['佉','弃','区','企哩','契','楷','寇','考'], note:'喉清送气 (kh)' },
  'g': { varga:'喉音 (Velar)', bare:['格','伽'], m:['噶','吉','古','格里','给','改','果','搞'], t:['伽','祇','具','吃哩','艺','盖','瞿','豪'], note:'喉浊不送气 (g)' },
  'G': { varga:'喉音 (Velar)', bare:['格哈','伽'], m:['噶哈','吉哈','古哈','格里哈','给哈','改哈','果哈','搞哈'], t:['伽','祇','具','伽哩','诣','慨','瞿','豪'], note:'喉浊送气 (gh)' },
  'N': { varga:'喉音 (Velar)', bare:['昂','仰'], m:['昂阿','昂伊','昂乌','昂里','昂诶','昂爱','昂欧','昂奥'], t:['仰','儗','隅','仰哩','倪','捱','悟','敖'], note:'喉鼻音 (ṅ / ng)' },

  // 颚音 (Ca-varga / Palatals)
  'c': { varga:'颚音 (Palatal)', bare:['兹','遮'], m:['扎','几','租','兹里','哲','斋','卓','招'], t:['遮','支','主','室哩','制','斋','祖','昭'], note:'颚清不送气 (听感如 j/zh)' },
  'C': { varga:'颚音 (Palatal)', bare:['呲','车'], m:['擦','七','粗','次里','车','拆','绰','超'], t:['车','齿','刍','痴哩','掣','差','初','抄'], note:'颚清送气 (ch/q)' },
  'j': { varga:'颚音 (Palatal)', bare:['吉','阇'], m:['佳','吉','居','吉里','杰','宅','卓','焦'], t:['阇','尔','殊','日哩','逝','惹','助','招'], note:'颚浊不送气 (j)' },
  'J': { varga:'颚音 (Palatal)', bare:['吉哈','社'], m:['佳哈','吉哈','居哈','吉里哈','杰哈','宅哈','卓哈','焦哈'], t:['社','时','殊','社哩','誓','寨','祚','召'], note:'颚浊送气 (jh)' },
  'Y': { varga:'颚音 (Palatal)', bare:['尼','若'], m:['尼亚','尼','纽','尼里','涅','尼爱','尼欧','尼奥'], t:['若','你','柔','若哩','泥','乃','尿','饶'], note:'颚鼻音 (ñ / ny)' },

  // 卷舌音 (Ṭa-varga / Retroflexes)
  'w': { varga:'卷舌音 (Retroflex)', bare:['特','吒'], m:['哒','滴','嘟','德里','得','呆','多','刀'], t:['吒','知','都','致哩','致','斋','都','嘲'], note:'卷舌清不送气 (ṭ)' },
  'W': { varga:'卷舌音 (Retroflex)', bare:['踏','咤'], m:['踏','踢','突','特里','忒','胎','托','掏'], t:['咤','耻','偷','耻哩','体','泰','侘','滔'], note:'卷舌清送气 (ṭh)' },
  'q': { varga:'卷舌音 (Retroflex)', bare:['德','荼'], m:['达','迪','读','德里','得','代','夺','导'], t:['荼','腻','度','荼哩','提','代','度','陶'], note:'卷舌浊不送气 (ḍ)' },
  'Q': { varga:'卷舌音 (Retroflex)', bare:['德哈','荼'], m:['达哈','迪哈','读哈','德里哈','得哈','代哈','夺哈','导哈'], t:['荼','腻','度','荼哩','提','代','度','陶'], note:'卷舌浊送气 (ḍh)' },
  'R': { varga:'卷舌音 (Retroflex)', bare:['呐','拏'], m:['呐','尼','奴','呐里','内','乃','诺','挠'], t:['拏','尼','怒','拏哩','泥','乃','诺','闹'], note:'卷舌鼻音 (ṇ)' },

  // 齿音 (Ta-varga / Dentals)
  't': { varga:'齿音 (Dental)', bare:['特','多'], m:['搭','滴','督','特里','得','呆','多','刀'], t:['多','底','都','底哩','帝','带','都','刀'], note:'齿清不送气 (听感如 d)' },
  'T': { varga:'齿音 (Dental)', bare:['塔','他'], m:['塔','替','图','特里','太','泰','托','涛'], t:['他','体','土','他哩','替','太','吐','讨'], note:'齿清送气 (th)' },
  'd': { varga:'齿音 (Dental)', bare:['德','陀'], m:['达','迪','读','德里','代','歹','朵','道'], t:['陀','地','度','陀哩','提','代','度','道'], note:'齿浊不送气 (d)' },
  'D': { varga:'齿音 (Dental)', bare:['德哈','驮'], m:['达哈','迪哈','读哈','德里哈','代哈','歹哈','朵哈','道哈'], t:['驮','第','度','驮哩','提','代','度','道'], note:'齿浊送气 (dh)' },
  'n': { varga:'齿音 (Dental)', bare:['恩','那'], m:['那','尼','努','那哩','内','奈','诺','恼'], t:['那','尼','奴','那哩','祢','乃','怒','恼'], note:'齿鼻音 (n)' },

  // 唇音 (Pa-varga / Labials)
  'p': { varga:'唇音 (Labial)', bare:['普','波'], m:['巴','比','布','普里','贝','拜','波','包'], t:['波','比','补','钵哩','闭','拜','逋','宝'], note:'唇清不送气 (听感如 b)' },
  'P': { varga:'唇音 (Labial)', bare:['扑','颇'], m:['帕','批','铺','普里','胚','派','坡','抛'], t:['颇','匹','普','颇哩','沛','派','破','泡'], note:'唇清送气 (ph)' },
  'b': { varga:'唇音 (Labial)', bare:['布','婆'], m:['拔','鼻','不','布里','北','白','博','薄'], t:['婆','毗','部','跋哩','陛','败','菩','暴'], note:'唇浊不送气 (b)' },
  'B': { varga:'唇音 (Labial)', bare:['布哈','婆'], m:['巴(重)','比(重)','布(重)','布里(重)','贝(重)','拜(重)','博(重)','包(重)'], t:['婆','毗','部','婆哩','吠','拜','菩','鲍'], note:'唇浊送气 (bh)' },
  'm': { varga:'唇音 (Labial)', bare:['姆','摩'], m:['嘛','咪','木','姆里','美','麦','摩','毛'], t:['摩','弥','母','蜜哩','迷','迈','谟','矛'], note:'唇鼻音 (m)' },

  // 半元音与擦音 (Antaḥstha & Ūṣman)
  'y': { varga:'半元音 (Semivowel)', bare:['伊','耶'], m:['呀','伊','优','伊里','耶','崖','哟','妖'], t:['耶','以','由','拽哩','曳','耶','瑜','要'], note:'颚半元音 (y)' },
  'r': { varga:'半元音 (Semivowel)', bare:['尔','啰'], m:['啦','里','鲁','里','雷','来','罗','劳'], t:['啰','利','噜','哩','礼','来','路','牢'], note:'舌尖颤音 (r)' },
  'l': { varga:'半元音 (Semivowel)', bare:['勒','罗'], m:['拉','利','卢','勒里','雷','赖','洛','捞'], t:['罗','离','路','嚧','隶','赖','路','劳'], note:'齿边音 (l)' },
  'v': { varga:'半元音 (Semivowel)', bare:['夫','嚩'], m:['瓦','维','乌','弗里','威','歪','窝','凹'], t:['嚩','尾','无','嚩哩','吠','吠','务','嚩奥'], note:'唇齿半元音 (v/w)' },
  'S': { varga:'擦音 (Sibilant)', bare:['什','奢'], m:['夏','希','舒','什里','谁','晒','说','烧'], t:['奢','尸','输','室哩','世','晒','戍','烧'], note:'颚擦音 (ś / sh)' },
  'z': { varga:'擦音 (Sibilant)', bare:['嘶','沙'], m:['沙','师','书','什里','奢','筛','朔','稍'], t:['沙','史','刍','瑟哩','势','晒','疏','梢'], note:'卷舌擦音 (ṣ)' },
  's': { varga:'擦音 (Sibilant)', bare:['斯','娑'], m:['萨','西','苏','斯里','塞','腮','索','骚'], t:['娑','悉','苏','悉哩','细','赛','素','骚'], note:'齿擦音 (s)' },
  'h': { varga:'气音 (Aspirate)', bare:['赫','诃'], m:['哈','希','呼','赫里','黑','嗨','豁','好'], t:['诃','醯','虎','紇哩','醯','海','呼','豪'], note:'声门浊擦音 (h)' },
  'L': { varga:'吠陀音 (Vedic)', bare:['勒','罗'], m:['啦','里','卢','里','雷','赖','洛','捞'], t:['罗','离','路','哩','隶','赖','路','劳'], note:'吠陀卷舌边音 (ḷ)' }
};

export function devanagariChunkToSlp1(text: string): string {
  const norm = text.normalize('NFC');
  let out = '';
  for (let i = 0; i < norm.length; i++) {
    const ch = norm[i];
    if (DEVA_IGNORE.has(ch)) continue;
    const next = norm[i + 1];
    if (DEVA_CONSONANTS.has(ch)) {
      out += DEVA_TO_SLP1[ch];
      if (next === '्') {
        i++;
      } else if (DEVA_MATRAS.has(next)) {
        out += DEVA_TO_SLP1[next];
        i++;
      } else if (next === '़') {
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

export function latinChunkToSlp1(chunk: string, mode: 'smart' | 'strict' | 'slp1' = 'smart'): string {
  if (mode === 'slp1') return chunk;
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

export function inputToSlp1(text: string, mode: 'smart' | 'strict' | 'slp1' = 'smart'): string {
  const parts = text.match(/[\u0900-\u097F\u200c\u200d]+|[^\u0900-\u097F\u200c\u200d]+/g) || [];
  return parts.map(part => {
    if (/[\u0900-\u097F]/.test(part)) {
      return devanagariChunkToSlp1(part);
    }
    return latinChunkToSlp1(part, mode);
  }).join('');
}

export function slp1ToIast(slp: string): string {
  return slp.split('').map(c => SLP1_TO_IAST[c] ?? c).join('');
}

export function slp1ToDevanagari(slp: string): string {
  let out = '';
  for (let i = 0; i < slp.length; i++) {
    if (slp.slice(i, i + 2) === 'oM' && (i === 0 || !SLP1_CONS_TO_DEVA[slp[i - 1]]) && !SLP1_VOWEL_TO_DEVA[slp[i + 2]]) {
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
    else if (ch === '|' && next === '|') { out += '॥'; i++; }
    else if (ch === '|') out += '।';
    else out += ch;
  }
  return out;
}

export function slp1ToSiddham(slp: string): string {
  let out = '';
  for (let i = 0; i < slp.length; i++) {
    if (slp.slice(i, i + 2) === 'oM' && (i === 0 || !SLP1_CONS_TO_SIDDHAM[slp[i - 1]]) && !SLP1_VOWEL_TO_SIDDHAM[slp[i + 2]]) {
      out += '𑖼𑗀';
      i++;
      continue;
    }
    const ch = slp[i];
    const next = slp[i + 1];
    if (SLP1_CONS_TO_SIDDHAM[ch]) {
      out += SLP1_CONS_TO_SIDDHAM[ch];
      if (SLP1_MATRA_TO_SIDDHAM[next] !== undefined) {
        out += SLP1_MATRA_TO_SIDDHAM[next];
        i++;
      } else {
        out += '𑖿';
      }
    } else if (SLP1_VOWEL_TO_SIDDHAM[ch]) {
      out += SLP1_VOWEL_TO_SIDDHAM[ch];
    } else if (ch === 'M') out += '𑖾';
    else if (ch === 'H') out += '𑖿';
    else if (ch === '~') out += '𑖽';
    else if (ch === '|' && next === '|') { out += '𑗃'; i++; }
    else if (ch === '|') out += '𑗂';
    else out += ch;
  }
  return out;
}

export function slp1ToIpa(slp: string): string {
  return '/' + slp.split('').map(c => SLP1_TO_IPA[c] ?? c).join('') + '/';
}

export function iastToDevanagari(iast: string): string {
  return slp1ToDevanagari(inputToSlp1(iast, 'strict'));
}

export function iastToSiddham(iast: string): string {
  return slp1ToSiddham(inputToSlp1(iast, 'strict'));
}

export function iastToIpa(iast: string): string {
  return slp1ToIpa(inputToSlp1(iast, 'strict'));
}

/**
 * 悉昙五十字母表（十四摩多 + 三十六体文五字门）声明学与字门密义
 */
export const SIDDHAM_FIFTY_LETTERS: SiddhamLetterEntry[] = [
  // 十四摩多 (Svara / Vowels)
  { iast: 'a', devanagari: 'अ', siddham: '𑖀', ipa: 'ɐ', tangChar: '阿', modernPhonetic: '阿', group: '十四摩多 (韵母)', placeZh: '喉音开口短音', esotericMeaningZh: '阿字本不生门：一切诸法本不生故' },
  { iast: 'ā', devanagari: 'आ', siddham: '𑖁', ipa: 'ɑː', tangChar: '阿(引)', modernPhonetic: '阿～', group: '十四摩多 (韵母)', placeZh: '喉音开口长音(引)', esotericMeaningZh: '阿长字寂静门：一切法远离修行寂静故' },
  { iast: 'i', devanagari: 'इ', siddham: '𑖂', ipa: 'i', tangChar: '伊', modernPhonetic: '伊', group: '十四摩多 (韵母)', placeZh: '颚音扁唇短音', esotericMeaningZh: '伊字根门：一切诸法根不可得故' },
  { iast: 'ī', devanagari: 'ई', siddham: '𑖃', ipa: 'iː', tangChar: '伊(引)', modernPhonetic: '衣～', group: '十四摩多 (韵母)', placeZh: '颚音扁唇长音(引)', esotericMeaningZh: '伊长字灾祸不可得门' },
  { iast: 'u', devanagari: 'उ', siddham: '𑖄', ipa: 'u', tangChar: 'Vc/坞', modernPhonetic: '乌', group: '十四摩多 (韵母)', placeZh: '唇音聚唇短音', esotericMeaningZh: '坞字譬喻不可得门' },
  { iast: 'ū', devanagari: 'ऊ', siddham: '𑖅', ipa: 'uː', tangChar: '乌(引)', modernPhonetic: '屋～', group: '十四摩多 (韵母)', placeZh: '唇音聚唇长音(引)', esotericMeaningZh: '乌长字损减不可得门' },
  { iast: 'ṛ', devanagari: 'ऋ', siddham: '𑖆', ipa: 'r̩', tangChar: '哩', modernPhonetic: '里', group: '十四摩多 (韵母)', placeZh: '卷舌成音节短音', esotericMeaningZh: '哩字神通不可得门' },
  { iast: 'ṝ', devanagari: 'ॠ', siddham: '𑖇', ipa: 'r̩ː', tangChar: '哩(引)', modernPhonetic: '里～', group: '十四摩多 (韵母)', placeZh: '卷舌成音节长音', esotericMeaningZh: '哩长字类例不可得门' },
  { iast: 'ḷ', devanagari: 'ऌ', siddham: '𑖈', ipa: 'l̩', tangChar: '力', modernPhonetic: '吕', group: '十四摩多 (韵母)', placeZh: '齿边音成音节短音', esotericMeaningZh: '力字染相不可得门' },
  { iast: 'ḹ', devanagari: 'ॡ', siddham: '𑖉', ipa: 'l̩ː', tangChar: '力(引)', modernPhonetic: '吕～', group: '十四摩多 (韵母)', placeZh: '齿边音成音节长音', esotericMeaningZh: '力长字沉没不可得门' },
  { iast: 'e', devanagari: 'ए', siddham: '𑖊', ipa: 'eː', tangChar: '翳', modernPhonetic: '诶～', group: '十四摩多 (韵母)', placeZh: '喉颚合音长元音', esotericMeaningZh: '翳字求不可得门' },
  { iast: 'ai', devanagari: 'ऐ', siddham: '𑖋', ipa: 'ɐi̯', tangChar: '蔼', modernPhonetic: '爱～', group: '十四摩多 (韵母)', placeZh: '喉颚重复合音', esotericMeaningZh: '蔼字自在不可得门' },
  { iast: 'o', devanagari: 'ओ', siddham: '𑖌', ipa: 'oː', tangChar: '污', modernPhonetic: '欧～', group: '十四摩多 (韵母)', placeZh: '喉唇合音长元音', esotericMeaningZh: '污字瀑流不可得门' },
  { iast: 'au', devanagari: 'औ', siddham: '𑖍', ipa: 'ɐu̯', tangChar: '奥', modernPhonetic: '奥～', group: '十四摩多 (韵母)', placeZh: '喉唇重复合音', esotericMeaningZh: '奥字化生不可得门' },
  { iast: 'aṃ', devanagari: 'अं', siddham: '𑖀𑖾', ipa: 'ɐm̃', tangChar: '暗(空点)', modernPhonetic: '阿姆', group: '十四摩多 (韵母)', placeZh: '菩提空点随韵鼻音', esotericMeaningZh: '暗字大空菩提点门：趣向无上正等菩提' },
  { iast: 'aḥ', devanagari: 'अः', siddham: '𑖀𑖿', ipa: 'ɐh', tangChar: '恶(涅槃点)', modernPhonetic: '阿哈', group: '十四摩多 (韵母)', placeZh: '涅槃双点止韵送气', esotericMeaningZh: '恶字大般涅槃门：断除一切烦恼障入涅槃' },

  // 迦字门·牙喉音 (Ka-varga)
  { iast: 'ka', devanagari: 'क', siddham: '𑖎', ipa: 'kɐ', tangChar: '迦', modernPhonetic: '嘎', group: '迦字门 (喉音 Ka-varga)', placeZh: '舌根喉清不送气', esotericMeaningZh: '迦字作业不可得门：一切诸法作业不可得故' },
  { iast: 'kha', devanagari: 'ख', siddham: '𑖏', ipa: 'kʰɐ', tangChar: '佉', modernPhonetic: '卡', group: '迦字门 (喉音 Ka-varga)', placeZh: '舌根喉清送气', esotericMeaningZh: '佉字等虚空不可得门：一切法同虚空相' },
  { iast: 'ga', devanagari: 'ग', siddham: '𑖐', ipa: 'ɡɐ', tangChar: '伽', modernPhonetic: '噶', group: '迦字门 (喉音 Ka-varga)', placeZh: '舌根喉浊不送气', esotericMeaningZh: '伽字行不可得门：一切法去来行相不可得' },
  { iast: 'gha', devanagari: 'घ', siddham: '𑖑', ipa: 'ɡʱɐ', tangChar: '伽(重)', modernPhonetic: '噶哈', group: '迦字门 (喉音 Ka-varga)', placeZh: '舌根喉浊送气', esotericMeaningZh: '伽重字一合相不可得门：离一切稠林合聚相' },
  { iast: 'ṅa', devanagari: 'ङ', siddham: '𑖒', ipa: 'ŋɐ', tangChar: '仰', modernPhonetic: '昂阿', group: '迦字门 (喉音 Ka-varga)', placeZh: '舌根喉鼻音', esotericMeaningZh: '仰字支分不可得门' },

  // 遮字门·齿龈颚音 (Ca-varga)
  { iast: 'ca', devanagari: 'च', siddham: '𑖓', ipa: 'tɕɐ', tangChar: '遮', modernPhonetic: '扎', group: '遮字门 (颚音 Ca-varga)', placeZh: '舌面硬颚清不送气', esotericMeaningZh: '遮字离一切迁变门：诸法无有生灭迁流' },
  { iast: 'cha', devanagari: 'छ', siddham: '𑖔', ipa: 'tɕʰɐ', tangChar: '车', modernPhonetic: '擦', group: '遮字门 (颚音 Ca-varga)', placeZh: '舌面硬颚清送气', esotericMeaningZh: '车字影像不可得门：诸法如幻如影' },
  { iast: 'ja', devanagari: 'ज', siddham: '𑖕', ipa: 'dʑɐ', tangChar: '阇', modernPhonetic: '佳', group: '遮字门 (颚音 Ca-varga)', placeZh: '舌面硬颚浊不送气', esotericMeaningZh: '阇字生不可得门：一切法生相不可得' },
  { iast: 'jha', devanagari: 'झ', siddham: '𑖖', ipa: 'dʑʱɐ', tangChar: '社', modernPhonetic: '佳哈', group: '遮字门 (颚音 Ca-varga)', placeZh: '舌面硬颚浊送气', esotericMeaningZh: '社字战敌怨害不可得门' },
  { iast: 'ña', devanagari: 'ञ', siddham: '𑖗', ipa: 'ɲɐ', tangChar: '若', modernPhonetic: '尼亚', group: '遮字门 (颚音 Ca-varga)', placeZh: '舌面硬颚鼻音', esotericMeaningZh: '若字智不可得门：般若真智无能所相' },

  // 吒字门·舌上卷舌音 (Ṭa-varga)
  { iast: 'ṭa', devanagari: 'ट', siddham: '𑖘', ipa: 'ʈɐ', tangChar: '吒', modernPhonetic: '哒', group: '吒字门 (卷舌音 Ṭa-varga)', placeZh: '舌尖卷舌清不送气', esotericMeaningZh: '吒字慢不可得门：摧伏一切增上我慢' },
  { iast: 'ṭha', devanagari: 'ठ', siddham: '𑖙', ipa: 'ʈʰɐ', tangChar: '咤', modernPhonetic: '踏', group: '吒字门 (卷舌音 Ṭa-varga)', placeZh: '舌尖卷舌清送气', esotericMeaningZh: '咤字长养不可得门' },
  { iast: 'ḍa', devanagari: 'ड', siddham: '𑖚', ipa: 'ɖɐ', tangChar: '荼', modernPhonetic: '达', group: '吒字门 (卷舌音 Ṭa-varga)', placeZh: '舌尖卷舌浊不送气', esotericMeaningZh: '荼字怨对不可得门' },
  { iast: 'ḍha', devanagari: 'ढ', siddham: '𑖛', ipa: 'ɖʱɐ', tangChar: '荼(重)', modernPhonetic: '达哈', group: '吒字门 (卷舌音 Ṭa-varga)', placeZh: '舌尖卷舌浊送气', esotericMeaningZh: '荼重字执持不可得门' },
  { iast: 'ṇa', devanagari: 'ण', siddham: '𑖜', ipa: 'ɳɐ', tangChar: '拏', modernPhonetic: '呐', group: '吒字门 (卷舌音 Ṭa-varga)', placeZh: '舌尖卷舌鼻音', esotericMeaningZh: '拏字诤不可得门：永离一切世间诤论' },

  // 多字门·舌头齿音 (Ta-varga)
  { iast: 'ta', devanagari: 'त', siddham: '𑖝', ipa: 't̪ɐ', tangChar: '多', modernPhonetic: '搭', group: '多字门 (齿音 Ta-varga)', placeZh: '舌尖齿背清不送气', esotericMeaningZh: '多字真如门：一切诸法真如不动故' },
  { iast: 'tha', devanagari: 'थ', siddham: '𑖞', ipa: 't̪ʰɐ', tangChar: '他', modernPhonetic: '塔', group: '多字门 (齿音 Ta-varga)', placeZh: '舌尖齿背清送气', esotericMeaningZh: '他字住处不可得门' },
  { iast: 'da', devanagari: 'द', siddham: '𑖟', ipa: 'd̪ɐ', tangChar: '陀', modernPhonetic: '达', group: '多字门 (齿音 Ta-varga)', placeZh: '舌尖齿背浊不送气', esotericMeaningZh: '陀字施不可得门：三轮体空檀波罗蜜' },
  { iast: 'dha', devanagari: 'ध', siddham: '𑖠', ipa: 'd̪ʱɐ', tangChar: '驮', modernPhonetic: '达哈', group: '多字门 (齿音 Ta-varga)', placeZh: '舌尖齿背浊送气', esotericMeaningZh: '驮字法界不可得门：入无尽法界总持藏' },
  { iast: 'na', devanagari: 'न', siddham: '𑖡', ipa: 'n̪ɐ', tangChar: '那', modernPhonetic: '那', group: '多字门 (齿音 Ta-varga)', placeZh: '舌尖齿背鼻音', esotericMeaningZh: '那字名相不可得门：离一切名言假施设相' },

  // 波字门·双唇音 (Pa-varga)
  { iast: 'pa', devanagari: 'प', siddham: '𑖢', ipa: 'pɐ', tangChar: '波', modernPhonetic: '巴', group: '波字门 (唇音 Pa-varga)', placeZh: '双唇清不送气', esotericMeaningZh: '波字第一义谛门：一切诸法胜义谛不可得' },
  { iast: 'pha', devanagari: 'फ', siddham: '𑖣', ipa: 'pʰɐ', tangChar: '颇', modernPhonetic: '帕', group: '波字门 (唇音 Pa-varga)', placeZh: '双唇清送气', esotericMeaningZh: '颇字不坚如聚沫门：摧破一切坚固妄执' },
  { iast: 'ba', devanagari: 'ब', siddham: '𑖤', ipa: 'bɐ', tangChar: '婆', modernPhonetic: '拔', group: '波字门 (唇音 Pa-varga)', placeZh: '双唇浊不送气', esotericMeaningZh: '婆字缚不可得门：解脱一切结使系缚' },
  { iast: 'bha', devanagari: 'भ', siddham: '𑖥', ipa: 'bʱɐ', tangChar: '婆(重)', modernPhonetic: '巴(重)', group: '波字门 (唇音 Pa-varga)', placeZh: '双唇浊送气', esotericMeaningZh: '婆重字有不可得门：远离三有生死相' },
  { iast: 'ma', devanagari: 'म', siddham: '𑖦', ipa: 'mɐ', tangChar: '摩', modernPhonetic: '嘛', group: '波字门 (唇音 Pa-varga)', placeZh: '双唇鼻音', esotericMeaningZh: '摩字吾我不可得门：证无我大悲三昧' },

  // 遍口音·半元音与擦音 (Antaḥstha & Ūṣman)
  { iast: 'ya', devanagari: 'य', siddham: '𑖧', ipa: 'jɐ', tangChar: '耶', modernPhonetic: '呀', group: '遍口声 (半元音与擦音)', placeZh: '硬颚近音(半元音)', esotericMeaningZh: '耶字乘不可得门：诸佛大乘真实平等' },
  { iast: 'ra', devanagari: 'र', siddham: '𑖨', ipa: 'rɐ', tangChar: '啰', modernPhonetic: '啦', group: '遍口声 (半元音与擦音)', placeZh: '舌尖弹舌颤音(转舌呼)', esotericMeaningZh: '啰字离诸尘垢门：清净无染离一切客尘' },
  { iast: 'la', devanagari: 'ल', siddham: '𑖩', ipa: 'lɐ', tangChar: '罗', modernPhonetic: '拉', group: '遍口声 (半元音与擦音)', placeZh: '齿龈边音', esotericMeaningZh: '罗字相不可得门：凡所有相皆是虚妄' },
  { iast: 'va', devanagari: 'व', siddham: '𑖪', ipa: 'ʋɐ', tangChar: '嚩', modernPhonetic: '瓦', group: '遍口声 (半元音与擦音)', placeZh: '唇齿近音(半元音)', esotericMeaningZh: '嚩字言说不可得门：离言法性如实证智' },
  { iast: 'śa', devanagari: 'श', siddham: '𑖫', ipa: 'ɕɐ', tangChar: '奢', modernPhonetic: '夏', group: '遍口声 (半元音与擦音)', placeZh: '硬颚清擦音', esotericMeaningZh: '奢字本性寂静门：一切诸法自性寂静' },
  { iast: 'ṣa', devanagari: 'ष', siddham: '𑖬', ipa: 'ʂɐ', tangChar: '沙', modernPhonetic: '沙', group: '遍口声 (半元音与擦音)', placeZh: '卷舌清擦音', esotericMeaningZh: '沙字性钝不可得门：破除一切愚痴钝障' },
  { iast: 'sa', devanagari: 'स', siddham: '𑖭', ipa: 'sɐ', tangChar: '娑', modernPhonetic: '萨', group: '遍口声 (半元音与擦音)', placeZh: '齿尖清擦音', esotericMeaningZh: '娑字一切谛不可得门：诸圣谛平等无二' },
  { iast: 'ha', devanagari: 'ह', siddham: '𑖮', ipa: 'ɦɐ', tangChar: '诃', modernPhonetic: '哈', group: '遍口声 (半元音与擦音)', placeZh: '声门浊擦气音', esotericMeaningZh: '诃字因不可得门：诸法因缘空无自性' },
  { iast: 'kṣa', devanagari: 'क्ष', siddham: '𑖎𑖿𑖬', ipa: 'kʂɐ', tangChar: '叉(二合)', modernPhonetic: '克沙', group: '遍口声 (半元音与擦音)', placeZh: '喉+卷舌二合复辅音', esotericMeaningZh: '叉字尽不可得门：法界无尽三昧总持' }
];
