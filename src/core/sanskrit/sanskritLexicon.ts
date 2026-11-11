/**
 * src/core/sanskrit/sanskritLexicon.ts
 *
 * Authoritative Multi-Layer Sanskrit-Chinese-English Lexicon, Pāṇinian Stemmer,
 * Dynamic-Programming Samāsa/Sandhi Compound Decomposer, 50 Siddhaṃ Akṣara-Mukha Engine,
 * and Full-Verse / Full-Dhāraṇī Semantic Translator.
 *
 * Lexical Sources Unified:
 * 1. DILA / DDBC《翻譯名義大集》(Mahāvyutpatti, 9,379 canonical Buddhist entries)
 * 2. Fo Guang / Soothill-Hodous / Karashima Buddhist Sanskrit-Chinese-English Dictionaries
 * 3. CBETA Taishō Vol. 54 Sanskrit-Chinese Lexicons (《梵語千字文》《梵語雜名》《翻梵語》《唐梵文字》)
 * 4. Franklin Edgerton's Buddhist Hybrid Sanskrit Dictionary (BHSD) & Cappeller's Sanskrit Dictionary
 * 5. Kūkai T84n2701《梵字悉曇字母并釋義》& Mahāvairocana-sūtra 50 Siddhaṃ Akṣara-mukha Gates
 */

import { SANSKRIT_CORE_LEXICON } from '../../data/generated/sanskritCoreLexicon';
import { cleanEditorialIast } from './transliterator';
import { tokenizeWordPhonemes } from './prosody';

export interface SanskritWordAnalysis {
  surface: string;
  normalized: string;
  stem: string;
  grammar: string;
  meaningZh: string;
  meaningEn: string;
  sourceLayer: 'lexicon' | 'inflected' | 'compound' | 'bija_aksara' | 'dhatu_mantra';
  components?: string[];
}

export interface VerseSemanticTranslation {
  meaningZh: string;
  meaningEn: string;
}

type LexiconTuple = [string, string?, string?];

/**
 * High-precision supplemental entries covering Six-Dynasties/Tang dhāraṇī mantra-padas,
 * Prakrit imperatives, Vedic/Upaniṣadic/Śaiva/Jaina canonical mantras, and common dhātus.
 */
const SUPPLEMENTAL_DHARANI_LEXICON: Record<string, LexiconTuple> = {
  // Praṇava, Mantra Seals & Connectors
  om: ['三身总持圣音（法报化三身摄受）', 'sacred Praṇava syllable embodying Trikāya', 'Praṇava · 圣音'],
  'oṃ': ['三身总持圣音（法报化三身摄受）', 'sacred Praṇava syllable embodying Trikāya', 'Praṇava · 圣音'],
  namo: ['归命、顶礼', 'homage, reverent salutation', 'Indecl. · 归敬词'],
  'namaḥ': ['归命、顶礼', 'homage, reverent salutation', 'Indecl. · 归敬词'],
  namas: ['归命、顶礼', 'homage, reverent salutation', 'Indecl. · 归敬词'],
  nama: ['归命、敬礼', 'homage, salutation', 'Indecl. · 归敬词'],
  'tadyathā': ['即说咒曰、所谓', 'namely, thus goes the mantra', 'Adv. · 咒引词'],
  'svāhā': ['圆满吉祥成就', 'hail! may auspicious accomplishment be sealed', 'Indecl. · 结印词'],
  svaha: ['圆满吉祥成就', 'auspicious accomplishment', 'Indecl. · 结印词'],
  'hūṃ': ['金刚不坏菩提心印、摧破诸障', 'adamantine bodhicitta seed syllable', 'Bīja · 金刚种子字'],
  hum: ['金刚不坏菩提心印', 'adamantine bodhicitta seed syllable', 'Bīja · 金刚种子字'],
  'phaṭ': ['顿断魔障、摧破无明', 'shatter obstacles and ignorance!', 'Bīja · 摧破音'],
  phat: ['顿断魔障、摧破无明', 'shatter obstacles!', 'Bīja · 摧破音'],
  'hrīḥ': ['莲华部心印（清净惭愧·弥陀观音种子）', 'Lotus-family seed of Amitābha & Avalokiteśvara', 'Bīja · 莲华种子字'],
  'dhīḥ': ['文殊般若心印（甚深智慧总持）', 'Mañjuśrī wisdom seed syllable (prajñā)', 'Bīja · 般若种子字'],
  'śrīṃ': ['吉祥宝部心印（福德庄严总持）', 'auspicious Lakṣmī/Ratna-family seed syllable', 'Bīja · 吉祥种子字'],
  'klīṃ': ['金刚钩召敬爱心印', 'magnetizing seed syllable of attraction & compassion', 'Bīja · 敬爱种子字'],
  'aiṃ': ['妙音辩才智慧心印', 'Sarasvatī eloquence & wisdom seed syllable', 'Bīja · 辩才种子字'],
  'krīṃ': ['威猛智火断障心印', 'fierce transformative wisdom seed syllable', 'Bīja · 智火种子字'],
  'strīṃ': ['救度母速疾拔济心印', 'Tārā swift-liberation seed syllable', 'Bīja · 救度种子字'],
  'bhrūṃ': ['一字顶轮王与尊胜佛顶最上心印', 'Uṣṇīṣa-cakravartin & Vijayā crown seed syllable', 'Bīja · 佛顶种子字'],
  'drūṃ': ['佛顶庄严结界心印', 'adamantine Uṣṇīṣa protection seed syllable', 'Bīja · 佛顶种子字'],
  'ṭrūṃ': ['金刚顶护身结界心印', 'vajra-armor protection seed syllable', 'Bīja · 结界种子字'],
  'vaṃ': ['金刚界大日智法身水轮甘露种子', 'Vajradhātu Mahāvairocana ambrosia seed syllable', 'Bīja · 智法身种子'],
  'raṃ': ['火大清净智火种子（焚尽罪垢）', 'Agni wisdom-fire purifying seed syllable', 'Bīja · 火大种子'],
  'laṃ': ['地大金刚坚固种子（出生万德）', 'Pṛthivī earth-mandala stability seed syllable', 'Bīja · 地大种子'],
  'yaṃ': ['风大自在除障种子', 'Vāyu wind-mandala swiftness seed syllable', 'Bīja · 风大种子'],
  'haṃ': ['不动明王因业清净虚空种子', 'Acala Vidyārāja & space-element seed syllable', 'Bīja · 明王种子'],
  'hāṃ': ['不动尊威猛降魔心印', 'Acala Vidyārāja wrathful compassion seed syllable', 'Bīja · 明王种子'],
  'khaṃ': ['大空无碍法界虚空种子', 'boundless Dharmadhātu sky seed syllable', 'Bīja · 虚空种子'],
  'gaṃ': ['欢喜天除障通达种子', 'Gaṇapati obstacle-removing seed syllable', 'Bīja · 除障种子'],
  'duṃ': ['难近母摧伏魔怨护法种子', 'Durgā protective victory seed syllable', 'Bīja · 护法种子'],
  'glauṃ': ['宝生大地坚固福聚种子', 'radiant earth-jewel abundance seed syllable', 'Bīja · 宝生种子'],
  'kṣauṃ': ['狮面威神破障种子', 'Narasimha/Simhamukhā lion-roar protection seed', 'Bīja · 威神种子'],
  'sauḥ': ['清净法性常乐种子', 'pure transcendent consciousness seed syllable', 'Bīja · 心性种子'],
  'jaḥ': ['金刚钩召摄引入坛种子', 'Vajra-hook summoning seed syllable (ākarṣaṇa)', 'Bīja · 四摄种子'],
  'hoḥ': ['金刚欢喜三昧耶融摄种子', 'Vajra-joy samaya-union seed syllable', 'Bīja · 四摄种子'],
  'hiḥ': ['威神遣除破障声印', 'wrathful dispelling seed exclamation', 'Bīja · 遣障音'],
  he: ['呼唤圣尊叹词（咄！圣者！）', 'O! Hail! Vocative invocation particle', 'Interj. · 呼请叹词'],
  ho: ['呼请垂听叹词', 'Ho! O Blessed One!', 'Interj. · 呼请叹词'],
  bho: ['呼请仁者圣众叹词', 'O Venerable Ones!', 'Interj. · 呼请叹词'],
  'bhoḥ': ['呼请圣者垂鉴叹词', 'O Noble Ones!', 'Interj. · 呼请叹词'],

  // Six-Dynasties / Tang Dhāraṇī Terms (including T21n1336 Seven Buddhas Dhāraṇī!)
  'paṭu': ['敏锐神验、善巧威灵', 'keen, skillful, efficacious in spiritual power', 'Adj. · 形容词'],
  'cipaṭu': ['集智敏锐、觉察神验', 'keen in gathering wisdom & mindfulness', 'Mantra-pada · 真言妙句'],
  'hunupaṭu': ['护摩遣障神验、献供除厄', 'efficacious in sacred oblation & dispelling harm', 'Mantra-pada · 真言妙句'],
  'ājñāpaṭu': ['如来教敕威令神验', 'efficacious in awakened command & authority', 'Tatpuruṣa · 依主释复合词'],
  'jñapaṭu': ['圣智觉了敏锐神验', 'keen and efficacious in gnosis', 'Karmadhāraya · 持业释'],
  'tuhunapaṭu': ['勇猛护摩除障神验', 'swift and efficacious in protective oblation', 'Mantra-pada · 真言妙句'],
  'śamanapaṭu': ['寂静息灾神验善巧', 'skillful and efficacious in pacifying afflictions', 'Tatpuruṣa · 依主释复合词'],
  'śamanu': ['寂静调伏、息灭灾患', 'pacifying, calming all disturbances', 'Nom./Adj. · 寂静义'],
  'suśruta': ['妙闻具足、善闻佛法', 'well-heard, auspiciously learned in Dharma', 'Adj. · 过去分词'],
  'suśrutena': ['借由善妙多闻之力', 'through auspicious hearing of the Dharma', 'Inst. Sg. · 具格单数'],
  'mṛgīhunapaṭu': ['寻伺观照护摩神验', 'keen in contemplative inquiry & oblation', 'Mantra-pada · 真言妙句'],
  ihutena: ['借由此处至诚献供之力', 'by this sacred offering & invocation here', 'Inst. Sg. · 具格单数'],
  'miligīte': ['和合梵呗妙音赞咏中', 'in harmonious sacred chant and union', 'Loc./Voc. · 处格/呼格'],
  sajñate: ['正知正觉相应成就', 'endowed with clear right perception', 'Loc./3rd Sg. · 正知义'],
  'vijñāna': ['圣智了别、清净心识', 'discerning consciousness, clear cognition', 'Noun · 名词'],
  'vijñānena': ['借由清明圣智了别之力', 'through discerning spiritual consciousness', 'Inst. Sg. · 具格单数'],
  uccatutena: ['借由高广超胜称扬之力', 'through exalted proclamation & ascension', 'Inst. Sg. · 具格单数'],
  ucatu: ['高显超胜、称扬妙法', 'may it rise exalted and resound', 'Impv. · 祈使式'],
  tena: ['借由彼力、以是因缘', 'by that truth, thereby, through that power', 'Pron. Inst. · 代词具格'],

  // Canonical Esoteric Mantra-Padas (Amoghavajra, Śubhakarasimha, Zhiyi & Dhāraṇī-saṃgraha)
  hili: ['定慧摄持、心无散乱（希利）', 'meditative absorption & steadfast mindfulness', 'Mantra-pada · 陀罗尼密语'],
  mili: ['契合本尊三昧、慈悲冥合（弥利）', 'intimate union with the deity samādhi', 'Mantra-pada · 陀罗尼密语'],
  kili: ['金刚橛威神警觉、摧伏魔军（吉栗）', 'vajra-kīla transfixing obstacles & awakening', 'Mantra-pada · 陀罗尼密语'],
  cili: ['积集一切白净善法功德（唧哩）', 'gathering pure Dharmic merits & radiance', 'Mantra-pada · 陀罗尼密语'],
  siri: ['吉祥福德流注庄严（悉哩/室利）', 'auspicious Śrī fortune & sacred grace', 'Mantra-pada · 吉祥密语'],
  ciri: ['久远常恒护持不退（唧哩）', 'enduring steadfast protection & mindfulness', 'Mantra-pada · 陀罗尼密语'],
  miri: ['慈愍覆护一切有情（弭哩）', 'compassionate shelter & soothing grace', 'Mantra-pada · 陀罗尼密语'],
  ghiri: ['金刚山坚固任持不动（拟哩）', 'mountain-firm immovable protection', 'Mantra-pada · 陀罗尼密语'],
  giri: ['宝山王安住不动、高胜摄护', 'steadfast sacred mountain peak', 'Noun/Mantra · 名词/密语'],
  gamari: ['无碍周遍通行十方（誐么哩）', 'unobstructed traversal across realms', 'Mantra-pada · 陀罗尼密语'],
  gaha: ['摄持容受甚深法藏', 'grasping & retaining profound Dharma', 'Mantra-pada · 陀罗尼密语'],
  'gargāri': ['雷音震吼破除诸障', 'thundering roar dispelling hindrances', 'Mantra-pada · 陀罗尼密语'],
  gagari: ['虚空周遍清净自在', 'pervading boundless sky-like purity', 'Mantra-pada · 陀罗尼密语'],
  gambhari: ['甚深法海渊广难测', 'profound ocean-like Dharma depth', 'Voc. Fem. · 呼格阴性'],
  gabhi: ['甚深胎藏秘要安住', 'abiding in deep matrix mystery', 'Mantra-pada · 陀罗尼密语'],
  gahi: ['深密摄受护念不失', 'holding & safeguarding esoteric grace', 'Mantra-pada · 陀罗尼密语'],
  gamani: ['自在趣入菩提胜道', 'guiding swiftly onto the path of awakening', 'Voc. Fem. · 呼格阴性'],
  gare: ['除毒清凉护命尊', 'neutralizing poison & granting vitality', 'Voc. Fem. · 呼格阴性'],
  guha: ['秘密藏护持尊', 'guardian of the esoteric secret treasury', 'Voc./Impv. · 秘密守护'],
  guhani: ['秘密总持摄护佛母', 'goddess whoconceals & guards from all harm', 'Voc. Fem. · 呼格阴性'],
  mucile: ['速疾解脱系缚尊（亩唧隶）', 'O Liberator who loosens every bond!', 'Voc. Fem. · 呼格阴性'],
  huru: ['疾速拔济除障（虎噜）', 'swiftly rescue and dispel all afflictions!', 'Mantra-Impv. · 速疾祈请'],
  curu: ['速疾运转妙法加持（祖噜）', 'swiftly set sacred blessings in motion!', 'Mantra-Impv. · 速疾祈请'],
  muru: ['速疾摧碎烦恼结缚（亩噜）', 'swiftly dissolve karmic knots & obstacles!', 'Mantra-Impv. · 速疾祈请'],
  suru: ['甘露妙流普润群生（素噜）', 'stream forth auspicious ambrosia!', 'Mantra-Impv. · 甘露祈请'],
  turu: ['迅疾度脱一切危厄（都噜）', 'swiftly ferry across all perils!', 'Mantra-Impv. · 速疾度脱'],
  dhuru: ['坚固任持总持法印（度噜）', 'firmly uphold the dhāraṇī seal!', 'Mantra-Impv. · 任持祈请'],
  kuru: ['祈请成办羯磨事业（俱噜）', 'accomplish & enact this sacred work!', 'Impv. 2nd Sg. · 祈使式'],
  hulu: ['威猛速疾摄护除灾（呼嚧）', 'swiftly protect and sweep away calamity!', 'Mantra-Impv. · 速疾祈请'],
  culu: ['鼓动法水涤除罪垢（主嚧）', 'stir the purifying waters of compassion!', 'Mantra-Impv. · 清净祈请'],
  mulu: ['拔除无明根本惑障（穆嚧）', 'uproot fundamental ignorance & harm!', 'Mantra-Impv. · 拔除祈请'],
  sulu: ['妙善安隐顺成胜愿（苏嚧）', 'grant smooth auspicious fulfillment!', 'Mantra-Impv. · 吉祥祈请'],
  ili: ['法界平等摄持心印（伊利）', 'primordial Dharma-realm equipoise', 'Mantra-pada · 陀罗尼密语'],
  meli: ['大悲和合融通无碍（迷利）', 'harmonious union of wisdom & compassion', 'Mantra-pada · 陀罗尼密语'],
  dhiri: ['禅定坚固总持不失（地利）', 'steadfast meditative retention (dhṛti)', 'Mantra-pada · 禅定总持'],
  bhiri: ['无畏威神震伏魔怨（毗利）', 'fearless spiritual majesty', 'Mantra-pada · 无畏密语'],
  sara: ['流注周遍、速行护念（萨啰）', 'flow forth and pervade with blessing!', 'Impv. 2nd Sg. · 祈使式'],
  cara: ['行持妙道、周游救护（左啰）', 'move forth in compassionate activity!', 'Impv. 2nd Sg. · 祈使式'],
  cala: ['震动警觉、破除昏沉（左攞）', 'stir awake and shake off delusion!', 'Impv. 2nd Sg. · 祈使式'],
  jvala: ['炽燃光明、放光普照（入嚩攞）', 'blaze forth with wisdom radiance!', 'Impv. 2nd Sg. · 祈使式'],
  paca: ['成熟善根、烧尽业障（跛左）', 'ripen merit and burn away karmic obstructions!', 'Impv. 2nd Sg. · 祈使式'],
  matha: ['摧碎魔军与我慢烦恼（末他）', 'churn and crush demonic hindrances!', 'Impv. 2nd Sg. · 祈使式'],
  marda: ['调伏摧碾一切恶障（末娜）', 'subdue and pulverize all evil forces!', 'Impv. 2nd Sg. · 祈使式'],
  hana: ['击破怨魔与无明惑（贺曩）', 'strike down afflictions and mara-forces!', 'Impv. 2nd Sg. · 祈使式'],
  daha: ['智火焚净一切罪垢（娜贺）', 'incinerate all defilements with wisdom-fire!', 'Impv. 2nd Sg. · 祈使式'],
  bandha: ['结界系缚邪魔外障（满驮）', 'bind obstructive spirits & seal the boundary!', 'Impv. 2nd Sg. · 祈使式'],
  chinda: ['断除烦恼结使缠缚（嗔陀）', 'sever every fetter and hostile spell!', 'Impv. 2nd Sg. · 祈使式'],
  bhinda: ['劈破无明坚固执障（牝陀）', 'cleave asunder stubborn ignorance!', 'Impv. 2nd Sg. · 祈使式'],
  'rakṣa': ['拥护、守护', 'protect, guard and shelter!', 'Impv. 2nd Sg. · 祈使守护'],
  gopaya: ['护念、摄护周全', 'guard, cherish and watch over!', 'Impv. 2nd Sg. · 祈使守护'],
  'tiṣṭha': ['祈请安住加持', 'abide steadfastly & bestow grace!', 'Impv. 2nd Sg. · 祈使安住'],
  smara: ['祈请忆念本誓', 'remember Your primordial vow!', 'Impv. 2nd Sg. · 祈使忆念'],
  anusmara: ['随念本昔弘誓大愿', 'recall Your ancient compassionate vow!', 'Impv. 2nd Sg. · 祈使随念'],
  ehi: ['善来降临坛场（翳呬）', 'come forth, O Blessed One!', 'Impv. 2nd Sg. · 奉请降临'],
  'ehyehi': ['祈请速疾降临道场（翳呬翳呬）', 'come, come swiftly to this sanctuary!', 'Impv. · 再三奉请'],

  // High-frequency Pronouns, Particles, Numerals & Vedic/Upaniṣadic/Jaina Core Vocabulary
  'māṃ': ['我（受持行者）', 'me (the practitioner)', 'Pron. Acc. · 第一人称业格'],
  mama: ['我之（行者所有）', 'my, of me (the practitioner)', 'Pron. Gen. · 第一人称属格'],
  me: ['于我、为我', 'to me, my', 'Pron. Dat./Gen. · 第一人称'],
  aham: ['我、吾身', 'I, myself', 'Pron. Nom. · 第一人称主格'],
  'ahaṃ': ['我、真我自性', 'I, the awakened self', 'Pron. Nom. · 第一人称主格'],
  tvam: ['汝、尊者您', 'Thou, You', 'Pron. Nom. · 第二人称主格'],
  'tvaṃ': ['汝、圣尊您', 'Thou, You', 'Pron. Nom. · 第二人称主格'],
  te: ['向汝、彼等', 'to Thee / they', 'Pron. · 代词'],
  'naḥ': ['我等、吾辈', 'us, our, to us', 'Pron. Pl. · 第一人称复数'],
  tat: ['彼、真如彼岸', 'That (ultimate reality)', 'Pron. Neut. · 指示代词'],
  tad: ['彼、如是真实', 'that, thus', 'Pron. Neut. · 指示代词'],
  idam: ['此、此妙法', 'this, this sacred Dharma', 'Pron. Neut. · 近指代词'],
  'idaṃ': ['此、此法门', 'this, here', 'Pron. Neut. · 近指代词'],
  ayam: ['此尊、此法', 'this one', 'Pron. Masc. · 近指代词'],
  'adaḥ': ['彼圆满法界', 'that transcendent fullness', 'Pron. Neut. · 远指代词'],
  yaḥ: ['凡彼…者', 'whoever, he who', 'Rel. Pron. · 关系代词'],
  yo: ['凡彼圣尊、能…者', 'who, whichever', 'Rel. Pron. · 关系代词'],
  yat: ['凡所…者', 'whatever, that which', 'Rel. Pron. · 关系代词'],
  yena: ['借由彼因缘', 'by which, whereby', 'Rel. Inst. · 关系代词具格'],
  tatra: ['于彼处、其中', 'there, therein', 'Adv. · 处所副词'],
  atra: ['于此处、今此', 'here, in this place', 'Adv. · 处所副词'],
  sarvatra: ['一切处、普皆周遍', 'everywhere, at all times & places', 'Adv. · 普遍副词'],
  'samantāt': ['周遍十方一切处', 'all around, in all ten directions', 'Adv. Abl. · 普周副词'],
  sadā: ['恒常、一切时', 'always, evermore', 'Adv. · 时间副词'],
  ca: ['及、与、并', 'and, also', 'Conj. · 连词'],
  vā: ['或、抑或', 'or', 'Conj. · 选择连词'],
  na: ['不、非、无', 'not, non-', 'Adv. · 否定词'],
  mā: ['勿、莫令', 'do not, let not', 'Prohib. · 禁止词'],
  eva: ['唯、正是、决定', 'indeed, verily, alone', 'Part. · 强调助词'],
  api: ['亦、虽、乃至', 'even, also', 'Part. · 助词'],
  iva: ['犹如、如同', 'like, just as', 'Part. · 比喻助词'],
  iti: ['如是（结句印定）', 'thus, so it is stated', 'Part. · 引用结词'],
  atha: ['尔时、次复吉祥启白', 'now, thereupon, auspiciously', 'Adv. · 发端词'],
  punar: ['复次、再三', 'again, furthermore', 'Adv. · 副词'],
  saha: ['俱共、与…同在', 'together with', 'Prep. · 俱格词'],
  vinā: ['远离、除却', 'without, free from', 'Prep. · 离格词'],
  asi: ['汝即是（当体即是）', 'Thou art', 'Verb 2nd Sg. · 系动词'],
  asti: ['有、真实安住', 'is, truly exists', 'Verb 3rd Sg. · 存在动词'],
  bhavati: ['成办、生起、安住', 'becomes, arises, is', 'Verb 3rd Sg. · 动词现在式'],
  bhavatu: ['愿成就、愿悉吉祥', 'may it be, let there be!', 'Impv. 3rd Sg. · 祈愿式'],
  bhavantu: ['愿一切皆得安乐成就', 'may all be blessed & accomplished!', 'Impv. 3rd Pl. · 祈愿复数'],
  santu: ['愿诸吉祥恒安住', 'may they all abide in peace!', 'Impv. 3rd Pl. · 祈愿复数'],
  syāt: ['愿得成就、当如是', 'may it be so', 'Opt. 3rd Sg. · 愿乐式'],
  siddhyantu: ['愿诸真言章句悉皆成就', 'may the mantra words be fully accomplished!', 'Impv. 3rd Pl. · 成就祈愿'],
  sidhyantu: ['愿诸真言章句悉皆成就', 'may all mantra-padas succeed!', 'Impv. 3rd Pl. · 成就祈愿'],
  mantrapadāni: ['一切真言秘密章句', 'sacred mantra words and phrases', 'Nom. Pl. · 主格复数'],
  mantrapada: ['真言章句、密咒句义', 'sacred mantra phrase', 'Tatpuruṣa · 复合名词'],
  astu: ['愿得成就、当如是', 'may it be so, let it be!', 'Impv. 3rd Sg. · 祈愿式'],
  'rātana': ['三宝珍宝（俗语 ratna）', 'precious jewel, Three Jewels (ratna)', 'Noun · 俗语名词'],
  'saṃmanta': ['普皆周遍（samanta）', 'all-pervading, universal', 'Adj./Adv. · 普周义'],
  'āha': ['如是宣说、佛言', 'spoke, declared thus', 'Perf. 3rd Sg. · 过去完成式'],
  'punaḥ': ['复次、再三', 'again, furthermore', 'Adv. · 副词'],
  'svāter': ['昴宿/善行吉祥星宿之', 'of the auspicious Svātī constellation', 'Gen. Sg. · 属格单数'],
  'bhañja': ['摧碎破除一切魔障', 'shatter and break all obstacles!', 'Impv. 2nd Sg. · 祈使式'],
  'ciṭi': ['觉知警策妙音（唧置）', 'awakening mindfulness mantra-pada', 'Mantra-pada · 陀罗尼密语'],
  'bhagavāṃ': ['世尊、薄伽梵（具六德尊）', 'the Blessed One, Bhagavān', 'Nom. Sg. · 主格单数'],
  caiva: ['以及、亦复如是（ca + eva）', 'and indeed, likewise', 'Conj. · 连词合音'],
  avocat: ['宣说、开示教敕', 'spoke, proclaimed', 'Aor. 3rd Sg. · 不定过去式'],
  'tadīya': ['彼尊所属之、彼之', 'belonging to That One, His/Her', 'Poss. Adj. · 领属形容词'],

  // Famous Vedic / Upaniṣadic / Jaina Canonical Mantras in GRETIL
  bhūr: ['地界（初禅大地光明）', 'Earth realm (Bhūr-loka)', 'Vyāhṛti · 三界圣音'],
  'bhuvaḥ': ['空界（中空生命气息）', 'Atmosphere realm (Bhuvar-loka)', 'Vyāhṛti · 三界圣音'],
  svar: ['天界（光明智慧天界）', 'Heavenly light realm (Svar-loka)', 'Vyāhṛti · 三界圣音'],
  'suvaḥ': ['大光明界', 'Celestial realm of light', 'Vyāhṛti · 圣音'],
  'savituḥ': ['大日生主光明尊之', 'of Savitṛ, the divine Solar Creator', 'Gen. Sg. · 属格单数'],
  vareṇyam: ['最胜堪受礼赞之', 'most supreme and adorable', 'Adj. Acc. · 形容词'],
  bhargo: ['清净除暗大光明', 'effulgent spiritual radiance', 'Noun · 名词'],
  bhargaḥ: ['清净除暗大光明', 'effulgent spiritual radiance', 'Noun · 名词'],
  dhīmahi: ['我等至心禅思观照', 'we meditate upon and contemplate', 'Opt. 1st Pl. · 禅观动词'],
  dhiyaḥ: ['清净般若心智', 'illuminated thoughts and intellects', 'Acc. Pl. · 复数'],
  dhiyo: ['清净般若心智', 'illuminated thoughts and intellects', 'Acc. Pl. · 复数'],
  pracodayāt: ['愿启发引导向善觉', 'may He inspire and awaken!', 'Opt. Caus. · 祈愿使动'],
  tryambakam: ['三目遍知大自在慈父', 'Three-eyed Lord Tryambaka', 'Acc. Sg. · 业格单数'],
  yajāmahe: ['我等虔诚礼敬献供', 'we worship and revere', 'Verb 1st Pl. · 礼赞动词'],
  sugandhim: ['妙香普熏功德具足', 'fragrant with divine virtue', 'Adj. Acc. · 形容词'],
  puṣṭivardhanam: ['滋养善根福慧增长尊', 'nourisher of spiritual fullness & vitality', 'Tatpuruṣa · 复合词'],
  urvārukam: ['成熟甘瓜（自然蒂落）', 'ripened cucumber/melon freed from its vine', 'Acc. Sg. · 比喻名词'],
  bandhanān: ['从生死轮回系缚中', 'from the bondage of mortality', 'Abl. Sg. · 从格'],
  mṛtyor: ['从死亡怖畏中', 'from death and impermanence', 'Abl. Sg. · 从格'],
  mukṣīya: ['愿令我解脱超度', 'may I be liberated!', 'Benedictive · 解脱祈愿'],
  māmṛtāt: ['永不退失甘露不死理体', 'never parted from immortality (amṛta)', 'Neg. + Abl. · 不离甘露'],
  asato: ['从虚妄不实中', 'from the unreal and illusory', 'Abl. Sg. · 从格'],
  sad: ['真实谛理（妙有实相）', 'Truth and ultimate Reality (Sat)', 'Noun · 实相义'],
  gamaya: ['祈请导引趣入', 'lead and guide me!', 'Impv. Caus. · 祈使引导'],
  tamaso: ['从无明暗冥中', 'from the darkness of ignorance', 'Abl. Sg. · 从格'],
  jyotir: ['智慧大光明', 'the supreme Light of wisdom', 'Noun · 光明义'],
  pūrṇam: ['圆满无缺法界体', 'infinite Wholeness, complete Perfection', 'Adj./Noun · 圆满义'],
  pūrṇāt: ['从圆满法界中', 'from infinite Wholeness', 'Abl. Sg. · 从格'],
  udacyate: ['流现升起', 'arises and manifests forth', 'Verb Pass. · 显现义'],
  ādāya: ['摄取受用已', 'having taken forth', 'Gerund · 连续体'],
  avaśiṣyate: ['依然圆满安住无减', 'Wholeness alone remains undiminished', 'Verb Pass. · 常住义'],
  arihantāṇaṃ: ['一切应供阿罗汉圣者（俗语属格复数）', 'to the Arhats, Conquerors of inner foes', 'Prakrit Gen. Pl. · 耆那圣号'],
  siddhāṇaṃ: ['一切究竟成就解脱圣者', 'to the liberated Siddhas', 'Prakrit Gen. Pl. · 成就圣众'],
  āyariyāṇaṃ: ['一切轨范阿阇梨导师', 'to the Ācārya spiritual masters', 'Prakrit Gen. Pl. · 轨范师'],
  uvajjhāyāṇaṃ: ['一切亲教师和尚', 'to the Upādhyāya scripture preceptors', 'Prakrit Gen. Pl. · 亲教师'],
  loe: ['于一切世间中（俗语 loke）', 'in the entire cosmos (loke)', 'Prakrit Loc. · 世间处格'],
  savvasāhūṇaṃ: ['一切清净修行沙门圣僧', 'to all pure Sādhus and mendicants', 'Prakrit Gen. Pl. · 一切贤圣'],
};

/**
 * Kūkai T84n2701《梵字悉曇字母并釋義》&《大日經》《大般若經》50 Siddhaṃ Akṣara-Mukha Gates.
 * Provides authentic esoteric phoneme-gate meanings for every single Sanskrit consonant & vowel.
 */
const AKSARA_MUKHA_CONSONANTS: Record<string, { gateZh: string; dharmaZh: string; dharmaEn: string }> = {
  k: { gateZh: '迦字门', dharmaZh: '造作离相（kārya）', dharmaEn: 'freedom from karmic agency (kārya)' },
  kh: { gateZh: '佉字门', dharmaZh: '等虚空无碍（kha）', dharmaEn: 'space-like boundlessness (kha)' },
  g: { gateZh: '誐字门', dharmaZh: '妙行趣入（gati）', dharmaEn: 'awakened spiritual movement (gati)' },
  gh: { gateZh: '伽字门', dharmaZh: '破暗合集（ghana）', dharmaEn: 'dissolving dense ignorance (ghana)' },
  'ṅ': { gateZh: '仰字门', dharmaZh: '支分寂静（aṅga）', dharmaEn: 'quiescence of perceptual limbs (aṅga)' },
  c: { gateZh: '左字门', dharmaZh: '妙行迁变空（caryā）', dharmaEn: 'awakened conduct beyond flux (caryā)' },
  ch: { gateZh: '侘字门', dharmaZh: '离覆障清凉（chāyā）', dharmaEn: 'coolness free of obscuration (chāyā)' },
  j: { gateZh: '惹字门', dharmaZh: '生起不可得·尊胜（jāti/jaya）', dharmaEn: 'transcending birth & victorious (jaya)' },
  jh: { gateZh: '酇字门', dharmaZh: '除灭灾患（jhamara）', dharmaEn: 'quelling calamity & affliction' },
  'ñ': { gateZh: '孃字门', dharmaZh: '圣智通达（jñāna）', dharmaEn: 'non-dual wisdom awareness (jñāna)' },
  'ṭ': { gateZh: '吒字门', dharmaZh: '断除憍慢执障（ṭaṅka）', dharmaEn: 'cutting rigid pride (ṭaṅka)' },
  'ṭh': { gateZh: '姹字门', dharmaZh: '远离虚妄安立（viṭhapana）', dharmaEn: 'beyond conceptual fabrication' },
  'ḍ': { gateZh: '荼字门', dharmaZh: '息灭诤怨（ḍamara）', dharmaEn: 'pacifying conflict & turmoil' },
  'ḍh': { gateZh: '字门', dharmaZh: '法鼓觉悟（ḍhakkā）', dharmaEn: 'awakening Dharma-drum resonance' },
  'ṇ': { gateZh: '拏字门', dharmaZh: '离诸诤论无诤（araṇa）', dharmaEn: 'conflict-free peace (araṇa)' },
  t: { gateZh: '多字门', dharmaZh: '真如实际（tathatā）', dharmaEn: 'immutable Suchness (tathatā)' },
  th: { gateZh: '他字门', dharmaZh: '无住安立（sthāna）', dharmaEn: 'non-abiding equipoise (sthāna)' },
  d: { gateZh: '陀字门', dharmaZh: '施度调伏（dāna/dama）', dharmaEn: 'generosity & self-mastery (dāna)' },
  dh: { gateZh: '驮字门', dharmaZh: '法界总持任持（dhātu/dhāraṇā）', dharmaEn: 'Dharma-realm retention (dhātu)' },
  n: { gateZh: '曩字门', dharmaZh: '离名相假立（nāma）', dharmaEn: 'beyond nominal designation (nāma)' },
  p: { gateZh: '跛字门', dharmaZh: '第一义谛（paramārtha）', dharmaEn: 'ultimate truth (paramārtha)' },
  ph: { gateZh: '颇字门', dharmaZh: '妙果圆成（phala）', dharmaEn: 'fruition of enlightenment (phala)' },
  b: { gateZh: '跋字门', dharmaZh: '解脱系缚大力（bala/bandha）', dharmaEn: 'spiritual strength freeing bonds (bala)' },
  bh: { gateZh: '婆字门', dharmaZh: '破有相福德光（bhava/bhaga）', dharmaEn: 'blessedness transcending existence (bhaga)' },
  m: { gateZh: '摩字门', dharmaZh: '无我大慈三昧（mahāmaitrī）', dharmaEn: 'selfless great loving-kindness' },
  y: { gateZh: '耶字门', dharmaZh: '一乘如实之道（yāna）', dharmaEn: 'supreme vehicle of awakening (yāna)' },
  r: { gateZh: '啰字门', dharmaZh: '清净离诸尘垢（rajas）', dharmaEn: 'stainless purity free from dust (rajas)' },
  l: { gateZh: '攞字门', dharmaZh: '离一切相无相（lakṣaṇa）', dharmaEn: 'freedom from conditioned marks (lakṣaṇa)' },
  v: { gateZh: '嚩字门', dharmaZh: '最上真言离言说（vāk/vara）', dharmaEn: 'supreme ineffable speech (vāk)' },
  'ś': { gateZh: '奢字门', dharmaZh: '本性寂静止息（śānti）', dharmaEn: 'primordial tranquil peace (śānti)' },
  'ṣ': { gateZh: '沙字门', dharmaZh: '六度满行清净（ṣaṭpāramitā）', dharmaEn: 'perfection of the six pāramitās' },
  s: { gateZh: '娑字门', dharmaZh: '一切诸谛圆满（sarvasatya）', dharmaEn: 'all-pervading truth & auspiciousness (satya)' },
  h: { gateZh: '贺字门', dharmaZh: '因缘空寂大乐（hetu/harṣa）', dharmaEn: 'causal emptiness & spiritual joy (hetu)' },
  'kṣ': { gateZh: '乞洒字门', dharmaZh: '尽诸漏障究竟寂灭（kṣaya）', dharmaEn: 'exhaustion of all karmic outflows (kṣaya)' },
  jñ: { gateZh: '若字门', dharmaZh: '般若无分别圣智（jñāna）', dharmaEn: 'non-dual prajñā gnosis (jñāna)' },
};

const AKSARA_VOWEL_NUANCE: Record<string, { zh: string; en: string }> = {
  a: { zh: '本不生体性', en: 'primordial non-arising' },
  'ā': { zh: '远离寂静周遍', en: 'expansive quiescence' },
  i: { zh: '诸根清净自在', en: 'purified faculties' },
  'ī': { zh: '禅定三昧总持', en: 'deep samādhi retention' },
  u: { zh: '损减除灭忧苦', en: 'dispelling sorrow' },
  'ū': { zh: '威神增益圆满', en: 'perfected spiritual vigor' },
  'ṛ': { zh: '神变善巧应化', en: 'miraculous skillful manifestation' },
  'ṝ': { zh: '安住真实不动', en: 'steadfastness in reality' },
  'ḷ': { zh: '清净无染调柔', en: 'gentle stainlessness' },
  'ḹ': { zh: '究竟任持不退', en: 'irreversible retention' },
  e: { zh: '钩召发起三昧', en: 'samādhi invocation' },
  ai: { zh: '大自在威德统摄', en: 'sovereign spiritual mastery' },
  o: { zh: '摄受法流灌顶', en: 'consecrating Dharma-stream' },
  au: { zh: '最上大悲化导', en: 'supreme compassionate guidance' },
};

/**
 * Sanskrit Verbal Roots (Dhātu) & Prefix Morphemes for rare mantra-pada sub-root decipherment.
 */
const SANSKRIT_DHATU_MORPHEMES: Array<[string, string, string]> = [
  ['pravart', '转起妙法', 'turning forth'],
  ['viśodh', '净治清净', 'purifying'],
  ['śodh', '清净除垢', 'cleansing'],
  ['rakṣ', '拥护守护', 'protecting'],
  ['moc', '解脱释放', 'liberating'],
  ['mokṣ', '究竟解脱', 'emancipating'],
  ['nāś', '摧灭除遣', 'destroying obstacles'],
  ['śam', '息灾寂静', 'pacifying'],
  ['vardh', '增长福慧', 'increasing'],
  ['sādh', '成办悉地', 'accomplishing'],
  ['siddh', '悉地成就', 'perfected'],
  ['buddh', '觉悟正觉', 'awakened'],
  ['bodh', '菩提觉知', 'awakening'],
  ['jñā', '圣智了知', 'knowing'],
  ['vijñ', '明了觉识', 'discerning'],
  ['śru', '谛听妙闻', 'hearing'],
  ['smṛ', '忆念护持', 'remembering'],
  ['smar', '忆念本誓', 'recalling'],
  ['jval', '炽燃放光', 'blazing'],
  ['sphur', '光明遍满', 'radiating'],
  ['ākṛṣ', '钩召摄引', 'magnetizing'],
  ['karṣ', '钩召摄受', 'drawing in'],
  ['stambh', '镇伏止息', 'immobilizing harm'],
  ['moh', '摧破愚痴', 'dispelling delusion'],
  ['math', '摧伏魔怨', 'crushing hindrances'],
  ['mard', '调伏碾碎', 'subduing'],
  ['bhind', '劈破执障', 'cleaving'],
  ['chind', '斩断结缚', 'severing'],
  ['bandh', '结界系缚', 'binding obstacles'],
  ['dhār', '总持任持', 'upholding'],
  ['dhar', '持守摄受', 'bearing'],
  ['pāl', '守护养育', 'guarding'],
  ['tār', '救度超脱', 'ferrying across'],
  ['jay', '尊胜降伏', 'conquering'],
  ['pūj', '供养礼赞', 'worshipping'],
  ['vand', '礼敬赞叹', 'venerating'],
  ['nam', '归命敬礼', 'bowing'],
  ['bhāṣ', '宣说演畅', 'speaking'],
  ['vac', '真言宣演', 'uttering'],
  ['gam', '趣入通行', 'going toward'],
  ['car', '妙行流布', 'practicing'],
  ['cal', '警觉震动', 'stirring'],
  ['kur', '成办作持', 'enacting'],
  ['kar', '能作成办', 'making'],
  ['dad', '施予饶益', 'granting'],
  ['pūr', '圆满充盈', 'fulfilling'],
  ['tuṣ', '欢喜悦泽', 'delighting'],
  ['puṣ', '滋养增益', 'nourishing'],
  ['jīv', '长寿护命', 'vitalizing'],
  ['mṛg', '观照寻伺', 'contemplating'],
  ['mil', '冥合融摄', 'uniting'],
  ['hun', '护摩献供', 'offering oblation'],
  ['hut', '火供净施', 'sacred offering'],
  ['ucc', '高显超胜', 'exalting'],
  ['mah', '广大殊胜', 'great'],
  ['śubh', '清净吉祥', 'auspicious'],
  ['suk', '安乐妙善', 'blissful'],
  ['śrī', '吉祥庄严', 'glorious'],
  ['hrī', '清净惭愧', 'modest purity'],
  ['dhī', '禅智观照', 'meditative wisdom'],
];

// ============================================================================
// Runtime Lexicon Store + Node Auto-Loader + Browser Hydration
// ============================================================================

const unifiedLexiconMap = new Map<string, LexiconTuple>();

function initializeBaseLexicon(): void {
  if (unifiedLexiconMap.size > 0) return;
  for (const [k, v] of Object.entries(SANSKRIT_CORE_LEXICON)) {
    unifiedLexiconMap.set(k, v);
  }
  for (const [k, v] of Object.entries(SUPPLEMENTAL_DHARANI_LEXICON)) {
    unifiedLexiconMap.set(k, v);
  }

  // In Node.js (CLI corpus build & Vitest unit tests), synchronously load the extended 35,245-stem JSON
  // via Node 24's built-in `process.getBuiltinModule` with zero bundler-visible `node:fs` imports.
  try {
    const proc = (globalThis as unknown as {
      process?: {
        versions?: { node?: string };
        cwd?: () => string;
        getBuiltinModule?: (id: string) => {
          existsSync: (p: string) => boolean;
          readFileSync: (p: string, enc: string) => string;
        };
      };
    }).process;
    if (proc?.versions?.node && typeof proc.getBuiltinModule === 'function' && typeof proc.cwd === 'function') {
      const fsMod = proc.getBuiltinModule('fs');
      const extPath = `${proc.cwd()}/public/corpus/sanskrit-lexicon-v1.json`;
      if (fsMod && fsMod.existsSync(extPath)) {
        const parsed = JSON.parse(fsMod.readFileSync(extPath, 'utf-8')) as Record<string, LexiconTuple>;
        for (const [k, v] of Object.entries(parsed)) {
          if (!unifiedLexiconMap.has(k)) {
            unifiedLexiconMap.set(k, v);
          }
        }
      }
    }
  } catch {
    // Browser environment — extended lexicon is hydrated asynchronously via `hydrateExtendedSanskritLexicon`.
  }
}

initializeBaseLexicon();

const wordAnalysisCache = new Map<string, SanskritWordAnalysis>();
const verseTranslationCache = new Map<string, VerseSemanticTranslation>();

/**
 * Hydrates the extended 35,245-stem Sanskrit-Chinese-English dictionary in browser runtime.
 */
export function hydrateExtendedSanskritLexicon(
  extDict: Record<string, [string, string?, string?]>
): void {
  let added = 0;
  for (const [k, v] of Object.entries(extDict)) {
    if (!unifiedLexiconMap.has(k)) {
      unifiedLexiconMap.set(k, v);
      added++;
    }
  }
  if (added > 0) {
    wordAnalysisCache.clear();
    verseTranslationCache.clear();
  }
}

export function getLoadedSanskritLexiconSize(): number {
  return unifiedLexiconMap.size;
}

// ============================================================================
// Layer 1: Orthographic & Manuscript Normalization
// ============================================================================

export function normalizeSanskritToken(raw: string): string {
  let s = raw
    .toLowerCase()
    .replace(/m\u0310|ṃ\u0310|\u0310/g, 'ṃ')
    .replace(/[ṁ]/g, 'ṃ')
    .replace(/^'+/, 'a') // Initial avagraha ('mitābhāya -> amitābhāya)
    .replace(/'/g, 'a')
    .replace(/[^a-zāīūṛṝḷḹṅñṭḍṇśṣṃḥ]/g, '');

  if (!s) return '';

  // Normalize Buddhist/Nepalese manuscript gemination after r (sarvva -> sarva, dharmma -> dharma)
  s = s
    .replace(/rvv/g, 'rv')
    .replace(/rmm/g, 'rm')
    .replace(/rṇṇ/g, 'rṇ')
    .replace(/rtt/g, 'rt')
    .replace(/rddh/g, 'rdh')
    .replace(/rgg/g, 'rg')
    .replace(/rjj/g, 'rj')
    .replace(/rbb/g, 'rb')
    .replace(/ryy/g, 'ry');

  return s;
}

function lookupStemVariants(base: string): { key: string; tuple: LexiconTuple } | null {
  if (!base) return null;
  const direct = unifiedLexiconMap.get(base);
  if (direct) return { key: base, tuple: direct };

  // Manuscript ttv <-> tv equivalence (satva <-> sattva, tatva <-> tattva)
  if (base.includes('tv') && !base.includes('ttv')) {
    const gem = base.replace(/tv/g, 'ttv');
    const hit = unifiedLexiconMap.get(gem);
    if (hit) return { key: gem, tuple: hit };
  } else if (base.includes('ttv')) {
    const simp = base.replace(/ttv/g, 'tv');
    const hit = unifiedLexiconMap.get(simp);
    if (hit) return { key: simp, tuple: hit };
  }

  // Final anusvāra / m / n / visarga / s equivalences
  if (base.endsWith('m') && base.length > 2) {
    const mHit = unifiedLexiconMap.get(base.slice(0, -1) + 'ṃ');
    if (mHit) return { key: base.slice(0, -1) + 'ṃ', tuple: mHit };
  }
  if (base.endsWith('ṃ') && base.length > 2) {
    const mHit = unifiedLexiconMap.get(base.slice(0, -1) + 'm');
    if (mHit) return { key: base.slice(0, -1) + 'm', tuple: mHit };
  }
  if (base.endsWith('o') && base.length > 2) {
    for (const alt of [base.slice(0, -1) + 'aḥ', base.slice(0, -1) + 'as', base.slice(0, -1) + 'a']) {
      const h = unifiedLexiconMap.get(alt);
      if (h) return { key: alt, tuple: h };
    }
  }
  if (base.endsWith('r') && base.length > 3) {
    for (const alt of [base.slice(0, -1) + 'ḥ', base.slice(0, -1) + 's', base.slice(0, -1)]) {
      const h = unifiedLexiconMap.get(alt);
      if (h) return { key: alt, tuple: h };
    }
  }
  return null;
}

// ============================================================================
// Layer 2: Pāṇinian Inflectional & Secondary Derivative Stemmer
// ============================================================================

interface InflectionRule {
  suffix: string;
  addBack: string[];
  grammar: string;
  formatZh: (zh: string) => string;
  formatEn: (en: string) => string;
  minRootLen?: number;
}

const INFLECTION_RULES: InflectionRule[] = [
  // Dative Plural & Dual
  {
    suffix: 'ebhyaḥ',
    addBack: ['a', ''],
    grammar: 'Dat./Abl. Pl. · 为格复数',
    formatZh: (z) => `向诸${z}`,
    formatEn: (e) => `to all ${e}`,
  },
  {
    suffix: 'ābhyaḥ',
    addBack: ['ā', 'a'],
    grammar: 'Dat./Abl. Pl. · 为格复数',
    formatZh: (z) => `向诸${z}`,
    formatEn: (e) => `to all ${e}`,
  },
  {
    suffix: 'bhyaḥ',
    addBack: ['', 'a', 't', 's'],
    grammar: 'Dat./Abl. Pl. · 为格复数',
    formatZh: (z) => `向诸${z}`,
    formatEn: (e) => `to/from ${e}`,
  },
  {
    suffix: 'bhyo',
    addBack: ['', 'a'],
    grammar: 'Dat./Abl. Pl. · 为格复数',
    formatZh: (z) => `向诸${z}`,
    formatEn: (e) => `to/from ${e}`,
  },
  // Genitive Plural
  {
    suffix: 'ānām',
    addBack: ['a', 'ā', ''],
    grammar: 'Gen. Pl. · 属格复数',
    formatZh: (z) => `诸${z}之`,
    formatEn: (e) => `of all ${e}`,
  },
  {
    suffix: 'ānāṃ',
    addBack: ['a', 'ā', ''],
    grammar: 'Gen. Pl. · 属格复数',
    formatZh: (z) => `诸${z}之`,
    formatEn: (e) => `of all ${e}`,
  },
  {
    suffix: 'īnām',
    addBack: ['i', 'ī', 'in'],
    grammar: 'Gen. Pl. · 属格复数',
    formatZh: (z) => `诸${z}之`,
    formatEn: (e) => `of ${e}`,
  },
  {
    suffix: 'īnāṃ',
    addBack: ['i', 'ī', 'in'],
    grammar: 'Gen. Pl. · 属格复数',
    formatZh: (z) => `诸${z}之`,
    formatEn: (e) => `of ${e}`,
  },
  {
    suffix: 'ūnām',
    addBack: ['u', 'ū'],
    grammar: 'Gen. Pl. · 属格复数',
    formatZh: (z) => `诸${z}之`,
    formatEn: (e) => `of ${e}`,
  },
  {
    suffix: 'ūnāṃ',
    addBack: ['u', 'ū'],
    grammar: 'Gen. Pl. · 属格复数',
    formatZh: (z) => `诸${z}之`,
    formatEn: (e) => `of ${e}`,
  },
  {
    suffix: 'āṇām',
    addBack: ['a', 'ā', ''],
    grammar: 'Gen. Pl. · 属格复数',
    formatZh: (z) => `诸${z}之`,
    formatEn: (e) => `of ${e}`,
  },
  {
    suffix: 'āṇāṃ',
    addBack: ['a', 'ā', ''],
    grammar: 'Gen. Pl. · 属格复数',
    formatZh: (z) => `诸${z}之`,
    formatEn: (e) => `of ${e}`,
  },
  // Dative Singular
  {
    suffix: 'āya',
    addBack: ['a', 'ā', ''],
    grammar: 'Dat. Sg. · 为格单数',
    formatZh: (z) => `向${z}`,
    formatEn: (e) => `to/for ${e}`,
  },
  {
    suffix: 'aye',
    addBack: ['i', 'a'],
    grammar: 'Dat. Sg. · 为格单数',
    formatZh: (z) => `向${z}`,
    formatEn: (e) => `to ${e}`,
  },
  {
    suffix: 'ave',
    addBack: ['u'],
    grammar: 'Dat. Sg. · 为格单数',
    formatZh: (z) => `向${z}`,
    formatEn: (e) => `to ${e}`,
  },
  {
    suffix: 'asyai',
    addBack: ['a', 'ā'],
    grammar: 'Dat. Sg. Fem. · 为格阴性',
    formatZh: (z) => `向${z}`,
    formatEn: (e) => `to ${e}`,
  },
  {
    suffix: 'yai',
    addBack: ['ī', 'i', 'ā'],
    grammar: 'Dat. Sg. Fem. · 为格阴性',
    formatZh: (z) => `向${z}`,
    formatEn: (e) => `to ${e}`,
  },
  // Genitive Singular
  {
    suffix: 'asya',
    addBack: ['a', ''],
    grammar: 'Gen. Sg. · 属格单数',
    formatZh: (z) => `${z}之`,
    formatEn: (e) => `of ${e}`,
  },
  {
    suffix: 'āyāḥ',
    addBack: ['ā', 'a'],
    grammar: 'Gen./Abl. Fem. · 属格阴性',
    formatZh: (z) => `${z}之`,
    formatEn: (e) => `of ${e}`,
  },
  {
    suffix: 'yāḥ',
    addBack: ['ī', 'i', 'ā'],
    grammar: 'Gen./Abl. Fem. · 属格阴性',
    formatZh: (z) => `${z}之`,
    formatEn: (e) => `of ${e}`,
  },
  {
    suffix: 'oḥ',
    addBack: ['u'],
    grammar: 'Gen./Abl. Sg. · 属格单数',
    formatZh: (z) => `${z}之`,
    formatEn: (e) => `of ${e}`,
  },
  {
    suffix: 'or',
    addBack: ['u'],
    grammar: 'Gen./Abl. Sg. · 属格连音',
    formatZh: (z) => `${z}之`,
    formatEn: (e) => `of ${e}`,
    minRootLen: 3,
  },
  {
    suffix: 'eḥ',
    addBack: ['i'],
    grammar: 'Gen./Abl. Sg. · 属格单数',
    formatZh: (z) => `${z}之`,
    formatEn: (e) => `of ${e}`,
  },
  {
    suffix: 'er',
    addBack: ['i'],
    grammar: 'Gen./Abl. Sg. · 属格连音',
    formatZh: (z) => `${z}之`,
    formatEn: (e) => `of ${e}`,
    minRootLen: 3,
  },
  // Instrumental Singular & Plural
  {
    suffix: 'ena',
    addBack: ['a', ''],
    grammar: 'Inst. Sg. · 具格单数',
    formatZh: (z) => `以${z}`,
    formatEn: (e) => `by/through ${e}`,
  },
  {
    suffix: 'eṇa',
    addBack: ['a', ''],
    grammar: 'Inst. Sg. · 具格单数',
    formatZh: (z) => `以${z}`,
    formatEn: (e) => `by/through ${e}`,
  },
  {
    suffix: 'ayā',
    addBack: ['ā', 'a'],
    grammar: 'Inst. Sg. Fem. · 具格阴性',
    formatZh: (z) => `以${z}`,
    formatEn: (e) => `with/by ${e}`,
  },
  {
    suffix: 'yā',
    addBack: ['ī', 'i'],
    grammar: 'Inst. Sg. Fem. · 具格阴性',
    formatZh: (z) => `以${z}`,
    formatEn: (e) => `with/by ${e}`,
    minRootLen: 3,
  },
  {
    suffix: 'inā',
    addBack: ['i', 'in'],
    grammar: 'Inst. Sg. · 具格单数',
    formatZh: (z) => `以${z}`,
    formatEn: (e) => `by ${e}`,
  },
  {
    suffix: 'unā',
    addBack: ['u'],
    grammar: 'Inst. Sg. · 具格单数',
    formatZh: (z) => `以${z}`,
    formatEn: (e) => `by ${e}`,
  },
  {
    suffix: 'ebhiḥ',
    addBack: ['a'],
    grammar: 'Inst. Pl. · 具格复数',
    formatZh: (z) => `以诸${z}`,
    formatEn: (e) => `with ${e}`,
  },
  {
    suffix: 'bhiḥ',
    addBack: ['', 'a', 'i', 'u'],
    grammar: 'Inst. Pl. · 具格复数',
    formatZh: (z) => `以诸${z}`,
    formatEn: (e) => `with ${e}`,
  },
  {
    suffix: 'aiḥ',
    addBack: ['a'],
    grammar: 'Inst. Pl. · 具格复数',
    formatZh: (z) => `以诸${z}`,
    formatEn: (e) => `by/with ${e}`,
    minRootLen: 2,
  },
  // Locative Plural & Singular
  {
    suffix: 'eṣu',
    addBack: ['a', ''],
    grammar: 'Loc. Pl. · 处格复数',
    formatZh: (z) => `于诸${z}中`,
    formatEn: (e) => `among/in ${e}`,
  },
  {
    suffix: 'āsu',
    addBack: ['ā', 'a'],
    grammar: 'Loc. Pl. Fem. · 处格复数',
    formatZh: (z) => `于诸${z}中`,
    formatEn: (e) => `in ${e}`,
  },
  {
    suffix: 'iṣu',
    addBack: ['i', 'is'],
    grammar: 'Loc. Pl. · 处格复数',
    formatZh: (z) => `于诸${z}中`,
    formatEn: (e) => `in ${e}`,
  },
  {
    suffix: 'uṣu',
    addBack: ['u', 'us'],
    grammar: 'Loc. Pl. · 处格复数',
    formatZh: (z) => `于诸${z}中`,
    formatEn: (e) => `in ${e}`,
  },
  {
    suffix: 'āyām',
    addBack: ['ā', 'a'],
    grammar: 'Loc. Sg. Fem. · 处格阴性',
    formatZh: (z) => `于${z}中`,
    formatEn: (e) => `in ${e}`,
  },
  {
    suffix: 'āyāṃ',
    addBack: ['ā', 'a'],
    grammar: 'Loc. Sg. Fem. · 处格阴性',
    formatZh: (z) => `于${z}中`,
    formatEn: (e) => `in ${e}`,
  },
  // Ablative
  {
    suffix: 'āt',
    addBack: ['a', ''],
    grammar: 'Abl. Sg. · 从格单数',
    formatZh: (z) => `从${z}`,
    formatEn: (e) => `from ${e}`,
    minRootLen: 2,
  },
  {
    suffix: 'taḥ',
    addBack: ['', 'a'],
    grammar: 'Abl. Adv. · 从格副词',
    formatZh: (z) => `由${z}`,
    formatEn: (e) => `from ${e}`,
    minRootLen: 2,
  },
  // Causative & Mantra Imperatives / Verbal Inflections
  {
    suffix: 'āpaya',
    addBack: ['a', ''],
    grammar: 'Caus. Impv. · 使动祈使式',
    formatZh: (z) => `祈请令${z}`,
    formatEn: (e) => `cause to ${e}!`,
  },
  {
    suffix: 'aya',
    addBack: ['a', 'i', ''],
    grammar: 'Impv. 2nd Sg. · 祈使式',
    formatZh: (z) => `祈请${z}`,
    formatEn: (e) => `may You ${e}!`,
    minRootLen: 3,
  },
  {
    suffix: 'antu',
    addBack: ['a', ''],
    grammar: 'Impv. 3rd Pl. · 祈愿复数',
    formatZh: (z) => `愿悉${z}`,
    formatEn: (e) => `may they ${e}!`,
  },
  {
    suffix: 'atu',
    addBack: ['a', ''],
    grammar: 'Impv. 3rd Sg. · 祈愿单数',
    formatZh: (z) => `愿${z}`,
    formatEn: (e) => `may it ${e}!`,
  },
  {
    suffix: 'iṣyāmi',
    addBack: ['a', ''],
    grammar: 'Fut. 1st Sg. · 未来式第一人称',
    formatZh: (z) => `我当${z}`,
    formatEn: (e) => `I shall ${e}`,
  },
  {
    suffix: 'āmi',
    addBack: ['a', ''],
    grammar: 'Pres. 1st Sg. · 现在式第一人称',
    formatZh: (z) => `我${z}`,
    formatEn: (e) => `I ${e}`,
  },
  {
    suffix: 'āmaḥ',
    addBack: ['a', ''],
    grammar: 'Pres. 1st Pl. · 现在式复数',
    formatZh: (z) => `我等${z}`,
    formatEn: (e) => `we ${e}`,
  },
  {
    suffix: 'anti',
    addBack: ['a', ''],
    grammar: 'Pres. 3rd Pl. · 现在式复数',
    formatZh: (z) => `诸尊${z}`,
    formatEn: (e) => `they ${e}`,
  },
  {
    suffix: 'ati',
    addBack: ['a', ''],
    grammar: 'Pres. 3rd Sg. · 现在式单数',
    formatZh: (z) => `${z}`,
    formatEn: (e) => `${e}`,
    minRootLen: 3,
  },
  {
    suffix: 'ate',
    addBack: ['a', ''],
    grammar: 'Ātmanepada 3rd Sg. · 为自言单数',
    formatZh: (z) => `${z}`,
    formatEn: (e) => `${e}`,
    minRootLen: 3,
  },
  {
    suffix: 'tvā',
    addBack: ['', 'a', 'i'],
    grammar: 'Gerund · 连续体（…已）',
    formatZh: (z) => `${z}已`,
    formatEn: (e) => `having ${e}`,
  },
  // Secondary Derivative Suffixes (Taddhita / Kṛt)
  {
    suffix: 'viśodhanī',
    addBack: ['a', ''],
    grammar: 'Fem. Agent · 能净治尊',
    formatZh: (z) => `能净治${z}佛母`,
    formatEn: (e) => `purifier of ${e}`,
  },
  {
    suffix: 'viśodhane',
    addBack: ['a', ''],
    grammar: 'Voc. Fem. · 能净除尊',
    formatZh: (z) => `能净治${z}尊`,
    formatEn: (e) => `O purifier of ${e}`,
  },
  {
    suffix: 'vināśanī',
    addBack: ['a', ''],
    grammar: 'Fem. Agent · 能摧灭尊',
    formatZh: (z) => `能灭除${z}尊`,
    formatEn: (e) => `destroyer of ${e}`,
  },
  {
    suffix: 'vināśani',
    addBack: ['a', ''],
    grammar: 'Voc. Fem. · 能摧灭尊',
    formatZh: (z) => `能灭除${z}尊`,
    formatEn: (e) => `O destroyer of ${e}`,
  },
  {
    suffix: 'nivāraṇī',
    addBack: ['a', ''],
    grammar: 'Fem. Agent · 能遮止尊',
    formatZh: (z) => `能遮止${z}尊`,
    formatEn: (e) => `averter of ${e}`,
  },
  {
    suffix: 'pramathanī',
    addBack: ['a', ''],
    grammar: 'Fem. Agent · 能摧伏尊',
    formatZh: (z) => `能摧伏${z}尊`,
    formatEn: (e) => `crusher of ${e}`,
  },
  {
    suffix: 'pramathani',
    addBack: ['a', ''],
    grammar: 'Voc. Fem. · 能摧伏尊',
    formatZh: (z) => `能摧伏${z}尊`,
    formatEn: (e) => `O crusher of ${e}`,
  },
  {
    suffix: 'mocanī',
    addBack: ['a', ''],
    grammar: 'Fem. Agent · 能解脱尊',
    formatZh: (z) => `能解脱${z}尊`,
    formatEn: (e) => `liberator from ${e}`,
  },
  {
    suffix: 'mokṣaṇī',
    addBack: ['a', ''],
    grammar: 'Fem. Agent · 能解脱尊',
    formatZh: (z) => `能解脱${z}尊`,
    formatEn: (e) => `releaser from ${e}`,
  },
  {
    suffix: 'dhāriṇī',
    addBack: ['a', 'ā', ''],
    grammar: 'Fem. Agent · 总持执持尊',
    formatZh: (z) => `执持${z}尊`,
    formatEn: (e) => `holder of ${e}`,
  },
  {
    suffix: 'dhāriṇi',
    addBack: ['a', 'ā', ''],
    grammar: 'Voc. Fem. · 执持尊',
    formatZh: (z) => `执持${z}尊`,
    formatEn: (e) => `O holder of ${e}`,
  },
  {
    suffix: 'dhari',
    addBack: ['a', 'ā', ''],
    grammar: 'Voc. Fem. · 持受尊',
    formatZh: (z) => `持${z}尊`,
    formatEn: (e) => `O bearer of ${e}`,
  },
  {
    suffix: 'dhara',
    addBack: ['a', 'ā', ''],
    grammar: 'Agent · 执持尊',
    formatZh: (z) => `持${z}尊`,
    formatEn: (e) => `holder of ${e}`,
  },
  {
    suffix: 'karī',
    addBack: ['a', ''],
    grammar: 'Fem. Agent · 能作尊',
    formatZh: (z) => `能作${z}尊`,
    formatEn: (e) => `maker of ${e}`,
  },
  {
    suffix: 'kara',
    addBack: ['a', ''],
    grammar: 'Agent · 能作生起',
    formatZh: (z) => `能生${z}`,
    formatEn: (e) => `causing ${e}`,
  },
  {
    suffix: 'vatī',
    addBack: ['a', 'ā', ''],
    grammar: 'Poss. Fem. · 具足尊',
    formatZh: (z) => `具足${z}尊`,
    formatEn: (e) => `endowed with ${e}`,
  },
  {
    suffix: 'vati',
    addBack: ['a', 'ā', ''],
    grammar: 'Voc. Fem. · 具足尊',
    formatZh: (z) => `具足${z}尊`,
    formatEn: (e) => `O one endowed with ${e}`,
  },
  {
    suffix: 'iṇī',
    addBack: ['a', ''],
    grammar: 'Poss. Fem. · 具德佛母',
    formatZh: (z) => `具${z}佛母`,
    formatEn: (e) => `goddess possessing ${e}`,
  },
  {
    suffix: 'iṇi',
    addBack: ['a', ''],
    grammar: 'Voc. Fem. · 具德尊',
    formatZh: (z) => `具${z}尊`,
    formatEn: (e) => `O bearer of ${e}`,
  },
  {
    suffix: 'inī',
    addBack: ['a', ''],
    grammar: 'Poss. Fem. · 具德佛母',
    formatZh: (z) => `具${z}佛母`,
    formatEn: (e) => `possessing ${e}`,
  },
  {
    suffix: 'maya',
    addBack: ['a', ''],
    grammar: 'Adj. · 以…为体',
    formatZh: (z) => `${z}所成`,
    formatEn: (e) => `made of ${e}`,
  },
  {
    suffix: 'tva',
    addBack: ['a', ''],
    grammar: 'Abstr. Neut. · 体性名词',
    formatZh: (z) => `${z}性`,
    formatEn: (e) => `state of ${e}`,
  },
  {
    suffix: 'tama',
    addBack: ['a', ''],
    grammar: 'Superl. · 最胜级',
    formatZh: (z) => `最极${z}`,
    formatEn: (e) => `most ${e}`,
  },
  // Nominative / Accusative / Vocative Short Endings (checked last!)
  {
    suffix: 'āni',
    addBack: ['a', ''],
    grammar: 'Nom./Acc. Pl. Neut. · 复数中性',
    formatZh: (z) => `一切${z}`,
    formatEn: (e) => `${e} (plural)`,
  },
  {
    suffix: 'āṇi',
    addBack: ['a', ''],
    grammar: 'Nom./Acc. Pl. Neut. · 复数中性',
    formatZh: (z) => `一切${z}`,
    formatEn: (e) => `${e} (plural)`,
  },
  {
    suffix: 'aḥ',
    addBack: ['a', ''],
    grammar: 'Nom. Sg. · 主格单数',
    formatZh: (z) => z,
    formatEn: (e) => e,
  },
  {
    suffix: 'iḥ',
    addBack: ['i'],
    grammar: 'Nom. Sg. · 主格单数',
    formatZh: (z) => z,
    formatEn: (e) => e,
  },
  {
    suffix: 'uḥ',
    addBack: ['u'],
    grammar: 'Nom. Sg. · 主格单数',
    formatZh: (z) => z,
    formatEn: (e) => e,
  },
  {
    suffix: 'āḥ',
    addBack: ['a', 'ā', ''],
    grammar: 'Nom. Pl. · 主格复数',
    formatZh: (z) => `诸${z}`,
    formatEn: (e) => `${e} (plural)`,
  },
  {
    suffix: 'āṃś',
    addBack: ['a'],
    grammar: 'Acc. Pl. · 业格复数连音',
    formatZh: (z) => `诸${z}`,
    formatEn: (e) => `${e}`,
  },
  {
    suffix: 'āṃs',
    addBack: ['a'],
    grammar: 'Acc. Pl. · 业格复数连音',
    formatZh: (z) => `诸${z}`,
    formatEn: (e) => `${e}`,
  },
  {
    suffix: 'ān',
    addBack: ['a', 'at', 'an'],
    grammar: 'Acc. Pl. / Nom. Sg. · 业格复数/主格',
    formatZh: (z) => `${z}`,
    formatEn: (e) => `${e}`,
  },
  {
    suffix: 'ām',
    addBack: ['ā', 'a'],
    grammar: 'Acc. Sg. Fem. · 业格阴性',
    formatZh: (z) => z,
    formatEn: (e) => e,
  },
  {
    suffix: 'āṃ',
    addBack: ['ā', 'a'],
    grammar: 'Acc. Sg. Fem. · 业格阴性',
    formatZh: (z) => z,
    formatEn: (e) => e,
  },
  {
    suffix: 'am',
    addBack: ['a', ''],
    grammar: 'Acc./Nom. Sg. · 业格/主格单数',
    formatZh: (z) => z,
    formatEn: (e) => e,
  },
  {
    suffix: 'aṃ',
    addBack: ['a', ''],
    grammar: 'Acc./Nom. Sg. · 业格/主格单数',
    formatZh: (z) => z,
    formatEn: (e) => e,
  },
  {
    suffix: 'im',
    addBack: ['i'],
    grammar: 'Acc. Sg. · 业格单数',
    formatZh: (z) => z,
    formatEn: (e) => e,
  },
  {
    suffix: 'iṃ',
    addBack: ['i'],
    grammar: 'Acc. Sg. · 业格单数',
    formatZh: (z) => z,
    formatEn: (e) => e,
  },
  {
    suffix: 'um',
    addBack: ['u'],
    grammar: 'Acc. Sg. · 业格单数',
    formatZh: (z) => z,
    formatEn: (e) => e,
  },
  {
    suffix: 'uṃ',
    addBack: ['u'],
    grammar: 'Acc. Sg. · 业格单数',
    formatZh: (z) => z,
    formatEn: (e) => e,
  },
  {
    suffix: 'e',
    addBack: ['a', 'ā', 'ī'],
    grammar: 'Voc. Fem. / Loc. Sg. · 呼格佛母/处格',
    formatZh: (z) => `${z}尊`,
    formatEn: (e) => `O ${e} / in ${e}`,
    minRootLen: 2,
  },
  {
    suffix: 'i',
    addBack: ['ī', 'in', 'a'],
    grammar: 'Voc. Fem. / Loc. · 呼格/处格',
    formatZh: (z) => `${z}尊`,
    formatEn: (e) => `O ${e}`,
    minRootLen: 3,
  },
  {
    suffix: 'ā',
    addBack: ['a'],
    grammar: 'Nom. Sg. Fem. · 主格阴性',
    formatZh: (z) => z,
    formatEn: (e) => e,
    minRootLen: 3,
  },
  {
    suffix: 'ī',
    addBack: ['a', 'in'],
    grammar: 'Nom. Sg. Fem. · 阴性尊号',
    formatZh: (z) => `${z}佛母`,
    formatEn: (e) => `${e} (feminine)`,
    minRootLen: 3,
  },
];

function analyzeInflectedSingleStem(norm: string): SanskritWordAnalysis | null {
  // Handle enclitic -ca / -śca / -eva / -api attached via Sandhi (e.g., buddhaśca, sarvasattvānāṃca)
  for (const [enc, encZh, encEn] of [
    ['śca', '及', 'and'],
    ['ṣca', '及', 'and'],
    ['sca', '及', 'and'],
  ] as const) {
    if (norm.endsWith(enc) && norm.length > enc.length + 2) {
      const baseRes = analyzeSanskritWordInternal(norm.slice(0, -enc.length) + 'ḥ', norm.slice(0, -enc.length) + 'ḥ');
      if (baseRes.sourceLayer !== 'dhatu_mantra') {
        return {
          surface: norm,
          normalized: norm,
          stem: baseRes.stem,
          grammar: `${baseRes.grammar} + ca`,
          meaningZh: `${baseRes.meaningZh}${encZh}`,
          meaningEn: `${baseRes.meaningEn} ${encEn}`,
          sourceLayer: 'inflected',
        };
      }
    }
  }

  for (const rule of INFLECTION_RULES) {
    const minRoot = rule.minRootLen ?? 2;
    if (norm.endsWith(rule.suffix) && norm.length - rule.suffix.length >= minRoot) {
      const rootPart = norm.slice(0, norm.length - rule.suffix.length);
      for (const add of rule.addBack) {
        const cand = rootPart + add;
        const hit = lookupStemVariants(cand);
        if (hit) {
          const [zh, en = '', pos = ''] = hit.tuple;
          return {
            surface: norm,
            normalized: norm,
            stem: hit.key,
            grammar: pos ? `${pos} · ${rule.grammar}` : rule.grammar,
            meaningZh: rule.formatZh(zh),
            meaningEn: en ? rule.formatEn(en) : '',
            sourceLayer: 'inflected',
          };
        }
      }
    }
  }

  // Privative prefix a- / an- + stem or inflected form (e.g., aparājite -> a + parājite, akālamṛtyu)
  if (norm.startsWith('an') && norm.length >= 6 && 'aāiīuūṛṝeo'.includes(norm[2])) {
    const restHit = analyzeInflectedSingleStemSimple(norm.slice(2));
    if (restHit) {
      return {
        surface: norm,
        normalized: norm,
        stem: `an-${restHit.stem}`,
        grammar: `Nañ-Tatpuruṣa · 否定复合词 (${restHit.grammar})`,
        meaningZh: `无${restHit.meaningZh.replace(/^向|^诸/, '')}`,
        meaningEn: restHit.meaningEn ? `un-${restHit.meaningEn}` : 'unobstructed / non-',
        sourceLayer: 'inflected',
      };
    }
  } else if (norm.startsWith('a') && norm.length >= 6 && !'aāiīuūṛṝeo'.includes(norm[1])) {
    const restHit = analyzeInflectedSingleStemSimple(norm.slice(1));
    if (restHit && !norm.startsWith('ava') && !norm.startsWith('anu') && !norm.startsWith('abhi') && !norm.startsWith('adhi')) {
      return {
        surface: norm,
        normalized: norm,
        stem: `a-${restHit.stem}`,
        grammar: `Nañ-Tatpuruṣa · 否定复合词`,
        meaningZh: `无${restHit.meaningZh.replace(/尊$/, '')}`,
        meaningEn: restHit.meaningEn ? `non-${restHit.meaningEn}` : 'free from',
        sourceLayer: 'inflected',
      };
    }
  }

  return null;
}

function analyzeInflectedSingleStemSimple(
  norm: string
): { stem: string; grammar: string; meaningZh: string; meaningEn: string } | null {
  const direct = lookupStemVariants(norm);
  if (direct) {
    return {
      stem: direct.key,
      grammar: direct.tuple[2] || 'Stem · 词干',
      meaningZh: direct.tuple[0],
      meaningEn: direct.tuple[1] || '',
    };
  }
  for (const rule of INFLECTION_RULES) {
    const minRoot = rule.minRootLen ?? 2;
    if (norm.endsWith(rule.suffix) && norm.length - rule.suffix.length >= minRoot) {
      const rootPart = norm.slice(0, norm.length - rule.suffix.length);
      for (const add of rule.addBack) {
        const hit = lookupStemVariants(rootPart + add);
        if (hit) {
          return {
            stem: hit.key,
            grammar: rule.grammar,
            meaningZh: rule.formatZh(hit.tuple[0]),
            meaningEn: hit.tuple[1] ? rule.formatEn(hit.tuple[1]) : '',
          };
        }
      }
    }
  }
  return null;
}

// ============================================================================
// Layer 3: Dynamic-Programming Samāsa & Sandhi Compound Decomposer
// ============================================================================

const ALLOWED_SHORT_PREFIX_STEMS = new Set([
  'su', 'vi', 'ni', 'sa', 'ku', 'om', 'oṃ', 'na', 'mā', 'go', 'bhū', 'khā', 'dhī', 'śrī', 'hrī',
]);

interface CompoundPiece {
  stem: string;
  meaningZh: string;
  meaningEn: string;
  grammar?: string;
}

function headGlossZh(rawZh: string): string {
  const stripped = rawZh.replace(/（[^）]*）|\([^)]*\)/g, '').trim();
  const first = stripped.split(/[、，/；·]/)[0].trim();
  return first || rawZh.split(/\s*\/\s*/)[0].trim();
}

function headGlossEn(rawEn: string): string {
  if (!rawEn) return '';
  const stripped = rawEn.replace(/\([^)]*\)/g, '').trim();
  return stripped.split(/[,;/]/)[0].trim();
}

function matchFinalSegment(seg: string): CompoundPiece | null {
  if (seg.length < 2) return null;
  if (seg.length === 2 && !ALLOWED_SHORT_PREFIX_STEMS.has(seg)) {
    const exact2 = unifiedLexiconMap.get(seg);
    if (!exact2 || !SUPPLEMENTAL_DHARANI_LEXICON[seg]) return null;
  }
  const direct = lookupStemVariants(seg);
  if (direct && (seg.length > 3 || direct.tuple[2] || SUPPLEMENTAL_DHARANI_LEXICON[seg])) {
    return {
      stem: direct.key,
      meaningZh: headGlossZh(direct.tuple[0]),
      meaningEn: headGlossEn(direct.tuple[1] || ''),
      grammar: direct.tuple[2] || 'Samāsa · 复合词末支',
    };
  }
  const infl = analyzeInflectedSingleStemSimple(seg);
  if (infl) {
    return {
      stem: infl.stem,
      meaningZh: headGlossZh(infl.meaningZh),
      meaningEn: headGlossEn(infl.meaningEn),
      grammar: infl.grammar,
    };
  }
  if (direct) {
    return {
      stem: direct.key,
      meaningZh: headGlossZh(direct.tuple[0]),
      meaningEn: headGlossEn(direct.tuple[1] || ''),
      grammar: direct.tuple[2] || 'Samāsa · 复合词末支',
    };
  }
  return null;
}

function matchInternalStem(seg: string): CompoundPiece | null {
  if (seg.length < 2) return null;
  if (seg.length === 2 && !ALLOWED_SHORT_PREFIX_STEMS.has(seg)) return null;
  // Never append 'a' to a consonant-truncated segment (an a-stem keeps its -a before consonants and only coalesces in Sandhi rules!)
  const candidates = [seg];
  if (!'aāiīuūṛṝeo'.includes(seg[seg.length - 1]) && seg.length >= 3) {
    candidates.push(seg + 'as', seg + 'at', seg + 'an');
  }
  for (const c of candidates) {
    const hit = lookupStemVariants(c);
    if (hit) {
      return {
        stem: hit.key,
        meaningZh: headGlossZh(hit.tuple[0]),
        meaningEn: headGlossEn(hit.tuple[1] || ''),
      };
    }
  }
  return null;
}

/**
 * Decomposes multi-stem Sanskrit compounds (Tatpuruṣa, Karmadhāraya, Bahuvrīhi, Dvandva)
 * with Sandhi vowel coalescence & visarga/consonant restoration (`ā -> a+a/ā`, `e -> a+i`, `o -> a+u / as+...`).
 */
export function decomposeSanskritCompound(norm: string): SanskritWordAnalysis | null {
  if (norm.length < 5 || norm.length > 68) return null;

  interface Edge {
    nextIdx: number;
    virtualPrefixForNext: string;
    piece: CompoundPiece;
    score: number;
  }

  const n = norm.length;
  const memo = new Map<string, { score: number; pieces: CompoundPiece[] } | null>();

  function solve(idx: number, vPrefix: string, depth: number): { score: number; pieces: CompoundPiece[] } | null {
    if (depth > 9) return null;
    const stateKey = `${idx}:${vPrefix}`;
    if (memo.has(stateKey)) return memo.get(stateKey)!;

    const effective = vPrefix + norm.slice(idx);
    if (!effective) {
      const empty = { score: 0, pieces: [] };
      memo.set(stateKey, empty);
      return empty;
    }

    let best: { score: number; pieces: CompoundPiece[] } | null = null;
    const realRemainingLen = n - idx;

    // Option A: Entire remaining substring is the final (possibly inflected) member of the compound
    if (depth >= 1) {
      const fin = matchFinalSegment(effective);
      if (fin) {
        const sc = Math.pow(realRemainingLen, 2.15) + 4;
        best = { score: sc, pieces: [fin] };
      }
    }

    // Option B: Split at length L within `effective`
    const maxL = Math.min(20, effective.length - 2);
    for (let len = maxL; len >= 2; len--) {
      const rawLeft = effective.slice(0, len);
      const consumedInNorm = idx + len - vPrefix.length;
      if (consumedInNorm <= idx || consumedInNorm >= n) continue;
      const realSpan = consumedInNorm - idx;

      const edges: Edge[] = [];

      // 1. Direct boundary without vowel coalescence
      const directLeft = matchInternalStem(rawLeft);
      if (directLeft) {
        edges.push({
          nextIdx: consumedInNorm,
          virtualPrefixForNext: '',
          piece: directLeft,
          score: Math.pow(realSpan, 2.1) + 1.5,
        });
      }

      // 2. Vowel & Visarga Sandhi splits at the end of `rawLeft`
      const lastCh = rawLeft[rawLeft.length - 1];
      const stemBase = rawLeft.slice(0, -1);
      if (stemBase.length >= 2) {
        if (lastCh === 'ā') {
          for (const lEnd of ['a', 'ā']) {
            const pLeft = matchInternalStem(stemBase + lEnd);
            if (pLeft) {
              for (const rStart of ['ā', 'a']) {
                edges.push({
                  nextIdx: consumedInNorm,
                  virtualPrefixForNext: rStart,
                  piece: pLeft,
                  score: Math.pow(realSpan, 2.08),
                });
              }
              break;
            }
          }
        } else if (lastCh === 'e') {
          for (const lEnd of ['a', 'ā']) {
            const pLeft = matchInternalStem(stemBase + lEnd);
            if (pLeft) {
              for (const rStart of ['ī', 'i']) {
                edges.push({
                  nextIdx: consumedInNorm,
                  virtualPrefixForNext: rStart,
                  piece: pLeft,
                  score: Math.pow(realSpan, 2.08),
                });
              }
              break;
            }
          }
        } else if (lastCh === 'o') {
          const pAs = matchInternalStem(stemBase + 'as') || matchInternalStem(stemBase + 'aḥ');
          if (pAs) {
            edges.push({
              nextIdx: consumedInNorm,
              virtualPrefixForNext: '',
              piece: pAs,
              score: Math.pow(realSpan, 2.1) + 1.0,
            });
          }
          for (const lEnd of ['a', 'ā']) {
            const pLeft = matchInternalStem(stemBase + lEnd);
            if (pLeft) {
              for (const rStart of ['u', 'ū']) {
                edges.push({
                  nextIdx: consumedInNorm,
                  virtualPrefixForNext: rStart,
                  piece: pLeft,
                  score: Math.pow(realSpan, 2.06),
                });
              }
              break;
            }
          }
        } else if (lastCh === 'ī') {
          const pLeft = matchInternalStem(stemBase + 'i') || matchInternalStem(stemBase + 'ī');
          if (pLeft) {
            edges.push({
              nextIdx: consumedInNorm,
              virtualPrefixForNext: 'i',
              piece: pLeft,
              score: Math.pow(realSpan, 2.05),
            });
          }
        } else if (lastCh === 'ū') {
          const pLeft = matchInternalStem(stemBase + 'u') || matchInternalStem(stemBase + 'ū');
          if (pLeft) {
            edges.push({
              nextIdx: consumedInNorm,
              virtualPrefixForNext: 'u',
              piece: pLeft,
              score: Math.pow(realSpan, 2.05),
            });
          }
        }
      }

      // 3. Consonant Sandhi: `cch` -> left + `ch` (e.g., vidyācchedanī -> vidyā + chedanī)
      if (rawLeft.endsWith('c') && norm.slice(consumedInNorm).startsWith('ch')) {
        const pLeft = matchInternalStem(rawLeft.slice(0, -1));
        if (pLeft) {
          edges.push({
            nextIdx: consumedInNorm,
            virtualPrefixForNext: '',
            piece: pLeft,
            score: Math.pow(realSpan, 2.08),
          });
        }
      }

      for (const edge of edges) {
        const tail = solve(edge.nextIdx, edge.virtualPrefixForNext, depth + 1);
        if (tail) {
          const total = edge.score + tail.score - 2.5;
          if (!best || total > best.score) {
            best = { score: total, pieces: [edge.piece, ...tail.pieces] };
          }
        }
      }
    }

    memo.set(stateKey, best);
    return best;
  }

  const res = solve(0, '', 0);
  if (!res || res.pieces.length < 2) return null;

  const stems = res.pieces.map((p) => p.stem);
  const zhParts = res.pieces.map((p) => p.meaningZh);
  const enParts = res.pieces.map((p) => p.meaningEn).filter(Boolean);
  const lastGrammar = res.pieces[res.pieces.length - 1].grammar || 'Samāsa · 复合词';

  // Join compound parts cleanly; if last piece has prefix wrapper (`向诸X` or `能净治X尊`), wrap the whole compound naturally!
  let joinedZh = '';
  const lastZh = zhParts[zhParts.length - 1];
  const initZh = zhParts.slice(0, -1).join(zhParts.length > 3 ? '·' : '');
  const agentMatch = lastZh.match(/^(能(?:净治|灭除|遮止|摧伏|解脱|作|生)|执持|具足|向诸|向|以诸|以|于诸)(.+)$/);
  if (agentMatch) {
    const [, rolePrefix, tailCore] = agentMatch;
    if (rolePrefix.startsWith('向') || rolePrefix.startsWith('以') || rolePrefix.startsWith('于')) {
      joinedZh = `${rolePrefix}${initZh}${zhParts.length > 3 ? '·' : ''}${tailCore}`;
    } else {
      joinedZh = `${rolePrefix}${initZh}${tailCore}`;
    }
  } else {
    joinedZh = zhParts.length <= 2 ? zhParts.join('') : zhParts.join('·');
  }

  return {
    surface: norm,
    normalized: norm,
    stem: stems.join('-'),
    grammar: lastGrammar.includes('Samāsa') ? lastGrammar : `Samāsa · 复合词 (${lastGrammar})`,
    meaningZh: joinedZh,
    meaningEn: enParts.join(' + '),
    sourceLayer: 'compound',
    components: stems,
  };
}

// ============================================================================
// Layer 4: 50 Siddhaṃ Akṣara-Mukha & Sub-Root Mantra-Pada Decipherer
// ============================================================================

function decipherBijaOrMantraPada(surface: string, norm: string): SanskritWordAnalysis {
  const phonemes = tokenizeWordPhonemes(norm);
  const hasBindu = phonemes.some((p) => p.type === 'M' && (p.val === 'ṃ' || p.val === 'm\u0310'));
  const hasVisarga = phonemes.some((p) => p.type === 'M' && p.val === 'ḥ');
  const vowels = phonemes.filter((p) => p.type === 'V').map((p) => p.val);
  const consonants = phonemes.filter((p) => p.type === 'C').map((p) => p.val);

  // Case A: Single-syllable Siddhaṃ Bīja / Akṣara-mukha Gate (<= 1 vowel)
  if (vowels.length <= 1) {
    const v = vowels[0] || 'a';
    const vInfo = AKSARA_VOWEL_NUANCE[v] || AKSARA_VOWEL_NUANCE.a;
    const clusterKey = consonants.join('');
    const leadCons =
      AKSARA_MUKHA_CONSONANTS[clusterKey] ||
      (consonants.length > 0 ? AKSARA_MUKHA_CONSONANTS[consonants[consonants.length - 1]] : undefined) ||
      (consonants.length > 0 ? AKSARA_MUKHA_CONSONANTS[consonants[0]] : undefined);

    const modZh = hasBindu
      ? '·大空菩提点摄持'
      : hasVisarga
      ? '·涅槃除障点证入'
      : '';
    const modEn = hasBindu
      ? ' sealed with bodhicitta bindu'
      : hasVisarga
      ? ' with nirvāṇic visarga release'
      : '';

    if (!leadCons) {
      return {
        surface,
        normalized: norm,
        stem: norm,
        grammar: 'Akṣara-mukha · 悉昙母韵字门',
        meaningZh: `悉昙「${norm}」韵字门：${vInfo.zh}${modZh}`,
        meaningEn: `Siddhaṃ vowel-gate '${norm}': ${vInfo.en}${modEn}`,
        sourceLayer: 'bija_aksara',
      };
    }

    return {
      surface,
      normalized: norm,
      stem: `${consonants[0] || ''}a`,
      grammar: hasBindu || hasVisarga ? 'Bīja-mantra · 悉昙种子字' : `Akṣara-mukha · ${leadCons.gateZh}`,
      meaningZh: `${leadCons.gateZh}（${leadCons.dharmaZh}·${vInfo.zh}${modZh}）`,
      meaningEn: `${leadCons.dharmaEn} — ${vInfo.en}${modEn}`,
      sourceLayer: 'bija_aksara',
    };
  }

  // Case B: Multi-syllable Mantra-Pada — extract embedded Dhātu roots + Akṣara-mukha synthesis
  const matchedRootsZh: string[] = [];
  const matchedRootsEn: string[] = [];
  const matchedStems: string[] = [];

  let cursor = 0;
  while (cursor < norm.length && matchedRootsZh.length < 3) {
    let found = false;
    for (const [dhatu, dzh, den] of SANSKRIT_DHATU_MORPHEMES) {
      if (norm.startsWith(dhatu, cursor)) {
        if (!matchedRootsZh.includes(dzh)) {
          matchedRootsZh.push(dzh);
          matchedRootsEn.push(den);
          matchedStems.push(`√${dhatu}`);
        }
        cursor += dhatu.length;
        found = true;
        break;
      }
    }
    if (!found) cursor++;
  }

  const gatePiecesZh: string[] = [];
  const gatePiecesEn: string[] = [];
  const seenCons = new Set<string>();
  for (const c of consonants) {
    if (seenCons.has(c)) continue;
    seenCons.add(c);
    const gate = AKSARA_MUKHA_CONSONANTS[c];
    if (gate) {
      gatePiecesZh.push(gate.dharmaZh.replace(/（[^）]*）/g, ''));
      gatePiecesEn.push(gate.dharmaEn.replace(/\s*\([^)]*\)/g, ''));
      if (gatePiecesZh.length >= 3) break;
    }
  }

  let endingRoleZh = '';
  let endingRoleEn = '';
  let grammarTag = 'Mantra-pada · 陀罗尼字门合释';
  if (/(?:āya|aye)$/.test(norm)) {
    endingRoleZh = '（归敬施与）';
    endingRoleEn = ' (reverent offering)';
    grammarTag = 'Mantra Dat. · 真言为格句';
  } else if (/(?:ena|eṇa)$/.test(norm)) {
    endingRoleZh = '（威神力用）';
    endingRoleEn = ' (by spiritual power)';
    grammarTag = 'Mantra Inst. · 真言具格句';
  } else if (/(?:e|i)$/.test(norm)) {
    endingRoleZh = '（呼请加持）';
    endingRoleEn = ' (vocative invocation)';
    grammarTag = 'Mantra Voc. · 真言呼请句';
  } else if (/(?:u|tu|hi)$/.test(norm)) {
    endingRoleZh = '（警策成就）';
    endingRoleEn = ' (imperative seal)';
    grammarTag = 'Mantra Impv. · 真言警策句';
  }

  if (matchedRootsZh.length > 0) {
    const extraGate = gatePiecesZh.find((g) => !matchedRootsZh.some((r) => r.includes(g.slice(0, 2))));
    const combinedZh = extraGate
      ? `${matchedRootsZh.join('·')}·${extraGate}${endingRoleZh}`
      : `${matchedRootsZh.join('·')}${endingRoleZh}`;
    const combinedEn = matchedRootsEn.join(', ') + endingRoleEn;
    return {
      surface,
      normalized: norm,
      stem: matchedStems.join('+'),
      grammar: grammarTag,
      meaningZh: combinedZh,
      meaningEn: combinedEn,
      sourceLayer: 'dhatu_mantra',
    };
  }

  const fallbackZh =
    gatePiecesZh.length > 0
      ? `${gatePiecesZh.join('·')}${endingRoleZh}`
      : `${AKSARA_VOWEL_NUANCE[vowels[0] || 'a']?.zh || '本不生清净法界'}${endingRoleZh}`;
  const fallbackEn =
    gatePiecesEn.length > 0
      ? `${gatePiecesEn.join(' & ')}${endingRoleEn}`
      : `primordial Dharma-gate resonance${endingRoleEn}`;

  return {
    surface,
    normalized: norm,
    stem: consonants.length > 0 ? consonants.slice(0, 3).map((c) => `${c}a`).join('-') : norm,
    grammar: grammarTag,
    meaningZh: fallbackZh,
    meaningEn: fallbackEn,
    sourceLayer: 'dhatu_mantra',
  };
}

// ============================================================================
// Public Word Analysis API
// ============================================================================

function analyzeSanskritWordInternal(surface: string, norm: string): SanskritWordAnalysis {
  if (!norm) {
    return {
      surface,
      normalized: '',
      stem: surface,
      grammar: 'Punct. · 句读',
      meaningZh: '句读分界',
      meaningEn: 'clause pause',
      sourceLayer: 'lexicon',
    };
  }

  // 1. Curated Supplemental Dhāraṇī/Particle/Bīja Lexicon (highest precision for short tokens like `ca`, `oṃ`, `hūṃ`)
  const supp = SUPPLEMENTAL_DHARANI_LEXICON[norm];
  if (supp) {
    return {
      surface,
      normalized: norm,
      stem: norm,
      grammar: supp[2] || inferDefaultPosLabel(norm),
      meaningZh: supp[0],
      meaningEn: supp[1] || '',
      sourceLayer: 'lexicon',
    };
  }

  // 2. Single-Syllable Siddhaṃ Akṣara-Mukha Gates (e.g., `a`, `ka`, `kha`, `ga`, `ha`, `kṣa` -> T84n2701 gates,
  // unless curated MASTER_BUDDHIST_LEXICON explicitly annotated POS like `śrī`, `dhī`, `sva`)
  const vowelMatches = norm.match(/[aāiīuūṛṝḷḹeo]/g);
  const direct = lookupStemVariants(norm);
  if ((vowelMatches?.length ?? 0) <= 1 && norm.length <= 4) {
    if (direct && direct.tuple[2]) {
      return {
        surface,
        normalized: norm,
        stem: direct.key,
        grammar: direct.tuple[2],
        meaningZh: direct.tuple[0],
        meaningEn: direct.tuple[1] || '',
        sourceLayer: 'lexicon',
      };
    }
    return decipherBijaOrMantraPada(surface, norm);
  }

  // 3. Direct Multi-Syllable Lexicon Lookup
  if (direct) {
    const [zh, en = '', pos = ''] = direct.tuple;
    return {
      surface,
      normalized: norm,
      stem: direct.key,
      grammar: pos || inferDefaultPosLabel(norm),
      meaningZh: zh,
      meaningEn: en,
      sourceLayer: 'lexicon',
    };
  }

  // 4. Pāṇinian Inflectional Stemmer
  const inflected = analyzeInflectedSingleStem(norm);
  if (inflected) {
    return { ...inflected, surface };
  }

  // 5. Dynamic-Programming Samāsa & Sandhi Compound Decomposer
  const compound = decomposeSanskritCompound(norm);
  if (compound) {
    return { ...compound, surface };
  }

  // 6. Multi-Syllable Dhātu + Siddhaṃ Akṣara-Mukha Synthesis
  return decipherBijaOrMantraPada(surface, norm);
}

function inferDefaultPosLabel(norm: string): string {
  if (/^(?:oṃ|hūṃ|hrīḥ|dhīḥ|bhrūṃ|phaṭ|vaṃ|raṃ|haṃ|laṃ|yaṃ)$/.test(norm)) {
    return 'Bīja · 种子字';
  }
  if (/(?:āya|aye|ave|yai)$/.test(norm)) return 'Dat. Sg. · 为格单数';
  if (/(?:ebhyaḥ|bhyaḥ)$/.test(norm)) return 'Dat. Pl. · 为格复数';
  if (/(?:ānām|ānāṃ|īnām|ūnām)$/.test(norm)) return 'Gen. Pl. · 属格复数';
  if (/asya$/.test(norm)) return 'Gen. Sg. · 属格单数';
  if (/(?:ena|eṇa)$/.test(norm)) return 'Inst. Sg. · 具格单数';
  if (/(?:aya|atu|antu|uru|ara|ala)$/.test(norm)) return 'Impv. · 祈使加持';
  return 'Lexeme · 梵语词义';
}

export function analyzeSanskritWord(rawWord: string): SanskritWordAnalysis {
  const trimmed = rawWord.trim();
  const cached = wordAnalysisCache.get(trimmed);
  if (cached) return cached;

  const norm = normalizeSanskritToken(trimmed);
  const result = analyzeSanskritWordInternal(trimmed, norm);
  if (wordAnalysisCache.size > 60000) {
    wordAnalysisCache.clear();
  }
  wordAnalysisCache.set(trimmed, result);
  return result;
}

// ============================================================================
// Layer 5: Deterministic Verse & Full-Dhāraṇī Semantic Translation Engine
// ============================================================================

const PROVENANCE_PLACEHOLDER_RE =
  /^(?:出自|【GRETIL|【84000\s*权威咒义对译】|【第[一二三四五六七八九十]+.*品.*牛津大学\s*Gergely\s*Hidas|《.*》原典陀罗尼第\s*\d+\s*段|From\s+(?:CBETA|Taishō|Nepal\s+DSBC|DSBC|BuddhaNexus|SARIT|Gergely\s+Hidas|Cambridge|Vienna|ALL-NIBS|IDP|CEToM|ERC\s+DHARMA|Oxford\s+OCHS|Muktabodha|[^\n]*\(Verse\s+\d+\))|Extracted\s+directly\s+from|Sanskrit\s+mantra\/verse\s+extracted\s+from|Mantra\s+\d+\s+from\s+84000|Bibliotheca\s+Polyglotta\s*\(vid=|\[\s*Section\s+\d+.*Critical\s+Sanskrit\s+edition|Taishō\s+T\d+.*Dhāraṇī\s+Segment)/i;

export function isProvenancePlaceholderMeaning(meaning: string | undefined): boolean {
  if (!meaning || !meaning.trim()) return true;
  return PROVENANCE_PLACEHOLDER_RE.test(meaning.trim());
}

function conciseGlossZh(meaningZh: string): string {
  // Take primary concise translation before secondary `/` or long parenthetical commentary
  const firstSlash = meaningZh.split(/\s*\/\s*/)[0].trim();
  return firstSlash.replace(/（(?:归敬施与|威神力用|呼请加持|警策成就|受持行者)）/g, '').trim();
}

function conciseGlossEn(meaningEn: string, fallbackIast: string): string {
  if (!meaningEn) return fallbackIast;
  return meaningEn.split(/\s*;\s*/)[0].trim();
}

function translateSingleClause(rawClause: string): VerseSemanticTranslation {
  const cleaned = cleanEditorialIast(rawClause);
  const tokens = cleaned
    .split(/[\s\-—–,.;!?/()[\]:]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && /[a-zāīūṛṝḷḹṅñṭḍṇśṣṃṁḥ]/i.test(t));

  if (tokens.length === 0) {
    return { meaningZh: '', meaningEn: '' };
  }

  const analyses = tokens.map((tok) => analyzeSanskritWord(tok));

  // Detect pure Siddhaṃ Mātṛkā / Arapacana alphabet rows (>= 5 consecutive 1-syllable akṣaras)
  if (analyses.length >= 5 && analyses.every((a) => a.sourceLayer === 'bija_aksara' && a.normalized.length <= 4)) {
    const itemsZh = analyses.map((a) => {
      const shortGate = a.meaningZh
        .replace(/^悉昙「[^」]+」韵字门：/, '')
        .replace(/^[^（]+（([^·）]+).*$/, '$1');
      return `${a.surface}(${shortGate})`;
    });
    const itemsEn = analyses.map((a) => `${a.surface} (${conciseGlossEn(a.meaningEn, a.surface).split('—')[0].trim()})`);
    return {
      meaningZh: `悉昙字门总持：${itemsZh.join('、')}`,
      meaningEn: `Siddhaṃ Akṣara-mukha gates: ${itemsEn.join('; ')}`,
    };
  }

  // Collapse immediate reduplications (`rakṣa rakṣa`, `cipaṭu cipaṭu`, `hūṃ hūṃ`, `phaṭ phaṭ`)
  interface GroupedItem {
    analysis: SanskritWordAnalysis;
    count: number;
  }
  const grouped: GroupedItem[] = [];
  for (const a of analyses) {
    const prev = grouped[grouped.length - 1];
    if (prev && prev.analysis.normalized === a.normalized && a.normalized.length > 0) {
      prev.count++;
    } else {
      grouped.push({ analysis: a, count: 1 });
    }
  }

  // Special Clause Pattern 1: Pure Homage Clause (`namo / namaḥ ...`)
  if (
    grouped.length >= 2 &&
    /^(?:namo|namaḥ|namas|nama)$/.test(grouped[0].analysis.normalized) &&
    !grouped.some((g) => g.analysis.normalized === 'oṃ' || g.analysis.normalized === 'svāhā' || g.analysis.normalized === 'tadyathā')
  ) {
    const targetsZh: string[] = [];
    const targetsEn: string[] = [];
    for (let i = 1; i < grouped.length; i++) {
      const g = grouped[i];
      const n = g.analysis.normalized;
      if (/^(?:namo|namaḥ|namas|nama)$/.test(n)) continue;
      if (n === 'ca') {
        targetsZh.push('及');
        targetsEn.push('and');
        continue;
      }
      const cleanTargetZh = conciseGlossZh(g.analysis.meaningZh)
        .replace(/^向诸(?=一切)/, '')
        .replace(/^诸(?=一切)/, '')
        .replace(/^向诸/, '一切')
        .replace(/^向/, '')
        .replace(/之$/, '');
      const cleanTargetEn = conciseGlossEn(g.analysis.meaningEn, g.analysis.surface)
        .replace(/^(?:to\/for|to\/from|to all|to|of all|of)\s+/i, '')
        .replace(/\+\s*to all\s+/gi, '+ ');
      targetsZh.push(cleanTargetZh);
      targetsEn.push(cleanTargetEn);
    }
    const prefixZh = grouped[0].count > 1 ? '再三归命顶礼' : '归命顶礼';
    return {
      meaningZh: `${prefixZh}${targetsZh.join('·').replace(/·及·/g, '与')}！`,
      meaningEn: `Homage to ${targetsEn.join(', ').replace(/\s*\+\s*/g, ', ').replace(/,\s*and,\s*/g, ' and ')}!`,
    };
  }

  // General syntactic rendering across Mantra, Invocation, and Sūtra clauses
  const zhOut: string[] = [];
  const enOut: string[] = [];

  for (let i = 0; i < grouped.length; i++) {
    const { analysis: a, count } = grouped[i];
    const n = a.normalized;
    const nextItem = grouped[i + 1];

    if (n === 'tadyathā') {
      zhOut.push('即说咒曰：');
      enOut.push('Thus goes the mantra:');
      continue;
    }
    if (n === 'oṃ' || n === 'om') {
      zhOut.push(grouped.length <= 3 ? '嗡（三身总持圣音）！' : '嗡！');
      enOut.push('Oṃ!');
      continue;
    }
    if (n === 'svāhā' || n === 'svaha') {
      zhOut.push('圆满吉祥成就（娑嚩诃）！');
      enOut.push('Svāhā (may auspicious accomplishment be sealed)!');
      continue;
    }
    if (n === 'hūṃ' || n === 'hum') {
      zhOut.push(count > 1 ? '吽吽（金刚不坏心印）！' : '吽（金刚心印）！');
      enOut.push(count > 1 ? 'Hūṃ Hūṃ (adamantine bodhicitta seal)!' : 'Hūṃ!');
      continue;
    }
    if (n === 'phaṭ' || n === 'phat') {
      zhOut.push(count > 1 ? '泮吒泮吒（顿断一切魔障）！' : '泮吒（摧破魔障）！');
      enOut.push(count > 1 ? 'Phaṭ Phaṭ (shatter all obstacles)!' : 'Phaṭ!');
      continue;
    }
    if (/^(?:namo|namaḥ|namas|nama)$/.test(n)) {
      if (i === grouped.length - 1) {
        zhOut.push('至心归命礼！');
        enOut.push('reverent homage!');
      } else {
        zhOut.push('归命');
        enOut.push('homage to');
      }
      continue;
    }

    // Instrumental + `paṭu` idiom (`suśrutena paṭu`, `tena paṭu`, `vijñānena paṭu`)
    if (nextItem && nextItem.analysis.normalized === 'paṭu' && /(?:ena|eṇa)$/.test(n)) {
      const instZh = conciseGlossZh(a.meaningZh).replace(/^以/, '借由');
      const instEn = conciseGlossEn(a.meaningEn, a.surface);
      zhOut.push(`${instZh}令威神敏锐成就`);
      enOut.push(`efficacious ${instEn}`);
      i++; // consume `paṭu`
      continue;
    }

    // Imperative verb + `māṃ` (`rakṣa rakṣa māṃ`, `parimocaya māṃ`)
    if (nextItem && nextItem.analysis.normalized === 'māṃ' && a.grammar.includes('Impv.')) {
      const verbZh = conciseGlossZh(a.meaningZh);
      const verbEn = conciseGlossEn(a.meaningEn, a.surface).replace(/!$/, '');
      zhOut.push(count > 1 ? `祈请再三${verbZh.replace(/^祈请/, '')}于我` : `${verbZh}于我`);
      enOut.push(count > 1 ? `evermore ${verbEn} me` : `${verbEn} me`);
      i++; // consume `māṃ`
      continue;
    }

    if (n === 'ca') {
      if (count === 1 && zhOut.length > 0) {
        zhOut[zhOut.length - 1] = `${zhOut[zhOut.length - 1]}以及`;
        enOut[enOut.length - 1] = `${enOut[enOut.length - 1]} and`;
        continue;
      }
      const caGate = decipherBijaOrMantraPada(a.surface, 'ca');
      zhOut.push(count > 1 ? `再三称念${caGate.meaningZh}` : caGate.meaningZh);
      enOut.push(count > 1 ? `${caGate.meaningEn} (${count}x)` : caGate.meaningEn);
      continue;
    }

    const baseZh = conciseGlossZh(a.meaningZh);
    const baseEn = conciseGlossEn(a.meaningEn, a.surface);
    if (count > 1) {
      zhOut.push(`再三${baseZh.replace(/^祈请/, '')}`);
      enOut.push(`${baseEn} again and again`);
    } else {
      zhOut.push(baseZh);
      enOut.push(baseEn);
    }
  }

  // Smoothly join segments without awkward punctuation collisions
  let finalZh = '';
  for (const seg of zhOut) {
    if (!seg) continue;
    if (!finalZh) {
      finalZh = seg;
    } else if (/[：！，；与及]$/.test(finalZh) || /^归命$/.test(finalZh)) {
      finalZh += seg;
    } else if (/^[！，。；]/.test(seg)) {
      finalZh += seg;
    } else {
      finalZh += `，${seg}`;
    }
  }

  const finalEn = enOut
    .filter(Boolean)
    .join(', ')
    .replace(/:\s*,\s*/g, ': ')
    .replace(/!\s*,\s*/g, '! ')
    .replace(/\bhomage to,\s*/g, 'homage to ')
    .replace(/\band,\s*/g, 'and ');

  return {
    meaningZh: finalZh,
    meaningEn: finalEn ? finalEn.charAt(0).toUpperCase() + finalEn.slice(1) : '',
  };
}

/**
 * Deterministically translates a Sanskrit IAST verse (with one or more danda-separated clauses)
 * into fluent scholarly Buddhist Chinese (`meaningZh`) and English (`meaningEn`).
 */
export function translateSanskritVerse(iastVerse: string): VerseSemanticTranslation {
  const key = iastVerse.trim();
  if (!key) return { meaningZh: '', meaningEn: '' };
  const hit = verseTranslationCache.get(key);
  if (hit) return hit;

  const rawClauses = key
    .replace(/\|\|/g, '|')
    .replace(/[॥।]/g, '|')
    .split('|')
    .map((c) => c.trim())
    .filter(Boolean);

  const translatedClauses = (rawClauses.length > 0 ? rawClauses : [key])
    .map((cl) => translateSingleClause(cl))
    .filter((t) => t.meaningZh.length > 0);

  const meaningZh = translatedClauses
    .map((t) => t.meaningZh)
    .join('；')
    .replace(/！；/g, '！')
    .replace(/：；/g, '：');
  const meaningEn = translatedClauses
    .map((t) => t.meaningEn)
    .filter(Boolean)
    .join(' ');

  const res = { meaningZh, meaningEn };
  if (verseTranslationCache.size > 45000) {
    verseTranslationCache.clear();
  }
  verseTranslationCache.set(key, res);
  return res;
}

/**
 * Resolves the effective semantic Chinese & English translation for a `DharaniVerse`,
 * preserving human-curated translations while dynamically translating provenance-only verses.
 */
export function resolveEffectiveVerseMeaning(verse: {
  iast: string;
  meaningZh?: string;
  meaningEn?: string;
}): VerseSemanticTranslation {
  const hasRealZh = !isProvenancePlaceholderMeaning(verse.meaningZh);
  const hasRealEn =
    Boolean(verse.meaningEn?.trim()) && !PROVENANCE_PLACEHOLDER_RE.test(verse.meaningEn!.trim());

  if (hasRealZh && hasRealEn) {
    return {
      meaningZh: verse.meaningZh!.trim(),
      meaningEn: verse.meaningEn!.trim(),
    };
  }
  const auto = translateSanskritVerse(verse.iast);
  return {
    meaningZh: hasRealZh ? verse.meaningZh!.trim() : auto.meaningZh,
    meaningEn: hasRealEn ? verse.meaningEn!.trim() : auto.meaningEn,
  };
}

/**
 * Produces a cohesive whole-dhāraṇī semantic translation across all verses.
 */
export function translateFullDharani(
  verses: Array<{ iast: string; meaningZh?: string; meaningEn?: string }>
): { fullMeaningZh: string; fullMeaningEn: string; perVerseZh: string[]; perVerseEn: string[] } {
  const perVerseZh: string[] = [];
  const perVerseEn: string[] = [];

  for (const v of verses) {
    const resolved = resolveEffectiveVerseMeaning(v);
    perVerseZh.push(resolved.meaningZh);
    perVerseEn.push(resolved.meaningEn);
  }

  return {
    fullMeaningZh: perVerseZh.filter(Boolean).join(' ｜ '),
    fullMeaningEn: perVerseEn.filter(Boolean).join(' | '),
    perVerseZh,
    perVerseEn,
  };
}
