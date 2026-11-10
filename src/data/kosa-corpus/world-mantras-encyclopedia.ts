import type { DharaniCategoryId, DharaniEntry, DharaniVerse } from '../../types/kosaTypes';
import { generateVerseChinesePhonetics } from '../../core/sanskrit/phoneticMapper';

interface CompactMantraSeed {
  id: string;
  titleZh: string;
  aliasesZh: string;
  titleSanskritIast: string;
  titleEnglish: string;
  categoryId: DharaniCategoryId;
  taishoNo: string;
  translatorZh: string;
  sutraSourceZh: string;
  deityZh: string;
  meritsAndSummaryZh: string;
  recitationTipsZh?: string;
  verses: Array<{
    iast: string;
    classicalTranslitZh?: string;
    modernPhoneticZh?: string;
    meaningZh: string;
    meaningEn: string;
    tangNoteZh?: string;
  }>;
}

function buildEncyclopediaEntry(seed: CompactMantraSeed): DharaniEntry {
  const verses: DharaniVerse[] = seed.verses.map((v, idx) => {
    const autoPhonetics = generateVerseChinesePhonetics(v.iast);
    return {
      id: `${seed.id}-v${idx + 1}`,
      index: idx + 1,
      iast: v.iast,
      classicalTranslitZh: v.classicalTranslitZh || autoPhonetics.classicalTranslitZh,
      modernPhoneticZh: v.modernPhoneticZh || autoPhonetics.modernPhoneticZh,
      meaningZh: v.meaningZh,
      meaningEn: v.meaningEn,
      tangNoteZh: v.tangNoteZh,
      words: [],
    };
  });

  const cbetaMatch = seed.taishoNo.match(/T\d{2}n\d{4}/);
  const cbetaId = cbetaMatch ? cbetaMatch[0] : undefined;

  return {
    id: seed.id,
    titleZh: `${seed.titleZh}（${seed.aliasesZh}）`,
    titleSanskritIast: seed.titleSanskritIast,
    titleEnglish: seed.titleEnglish,
    categoryId: seed.categoryId,
    taishoNo: seed.taishoNo,
    translatorZh: seed.translatorZh,
    sutraSourceZh: seed.sutraSourceZh,
    deityZh: seed.deityZh,
    meritsAndSummaryZh: `${seed.meritsAndSummaryZh} 【常用检索别称：${seed.aliasesZh}】`,
    recitationTipsZh:
      seed.recitationTipsZh ||
      '持诵时可对照上方「梵音拼读参考」与「古汉语音译」，点击单句播放高品质梵音合成唱诵。',
    provenance: {
      sourceType: cbetaId ? 'CBETA-XML-P5' : 'Academic-Critical-Edition',
      cbetaId,
      cbetaOnlineUrl: cbetaId ? `https://cbetaonline.dila.edu.tw/zh/${cbetaId}` : undefined,
      editionCitation: `${seed.sutraSourceZh} (${seed.taishoNo}) · 梵汉对勘校订本`,
      manuscriptNotesZh: `收录自大藏经与梵藏对勘文献，含完整常用俗称与别名索引（${seed.aliasesZh}）。`,
    },
    verses,
  };
}

const WORLD_MANTRA_SEEDS: CompactMantraSeed[] = [
  // ==================== 1. 楞严咒五大心咒与显密核心大咒 ====================
  {
    id: 'surangama-five-heart-mantra',
    titleZh: '楞严咒五会核心 · 五大心咒与大白伞盖坚甲咒',
    aliasesZh: '楞严咒心,五大心咒,叱陀你,阿迦罗,蜜唎柱,般唎怛罗耶,儜揭唎,楞严经心咒,大佛顶首楞严咒心',
    titleSanskritIast: 'Śūraṅgama-Pañca-Hṛdaya-Mantra',
    titleEnglish: 'Five Assemblies Essence & Five Heart Mantras of the Śūraṅgama Dhāraṇī',
    categoryId: 'supreme-mantras',
    taishoNo: 'T19n0945 (卷七)',
    translatorZh: '唐·般剌密帝 译 / 不空三藏 对音',
    sutraSourceZh: '《大佛顶如来密因修证了义诸菩萨万行首楞严经》卷七',
    deityZh: '大佛顶如来 · 大白伞盖佛母',
    meritsAndSummaryZh:
      '统摄《大佛顶首楞严咒》五会核心精髓，含第一会三宝与大白伞盖归命赞、第二至第四会降魔金刚结界心印、第五会「五大心咒」（破魔心咒）与全咒最后根本心咒（跢侄他 唵 阿那隶 毗舍提...），宣化上人等历代祖师开示此五大心咒专破天魔外道一切邪术蛊毒。',
    verses: [
      {
        iast: 'namaḥ sarvabuddhabodhisattvebhyaḥ | namo bhagavate uṣṇīṣāya | sitātapatre aparājite pratyangirāya',
        classicalTranslitZh: '南无萨羯唎多 翳昙婆伽婆多 萨怛他伽都瑟尼沙 萨怛多般怛啰 阿波啰视多 般啰帝扬岐啰',
        modernPhoneticZh: '那玛赫 萨尔瓦布达博迪萨特威比亚赫 | 那摩 巴嘎瓦得 乌什尼沙雅 | 悉达达巴德类 阿巴拉吉得 巴拉底扬吉拉雅',
        meaningZh: '【第一会核心·毗卢真法会】顶礼一切诸佛菩萨！归命世尊无见顶相、大白伞盖无能胜大回遮母！',
        meaningEn: 'First Assembly Essence: Homage to all Buddhas and Bodhisattvas! Homage to the Bhagavan’s Uṣṇīṣa, the Invincible White Parasol Sitātapatrā Pratyangirā!',
        tangNoteZh: '楞严咒第一会归命大佛顶大白伞盖总印',
      },
      {
        iast: 'hūṃ ṭrūṃ bandha bandha | vidyāṃ chindayāmy asinā kīlayāmi vajreṇa | jvala mahābalāya hūṃ phaṭ',
        classicalTranslitZh: '虎㖀都嚧雍 婆陀婆陀 | 毗陀夜 嗔陀夜弥 阿悉那 鸡罗夜弥 跋阇啰拏 | 入嚩啰 摩诃婆啰耶 吽 泮吒',
        modernPhoneticZh: '吽 德隆 班达 班达 | 维迪央 钦达雅米 阿悉那 给拉雅米 瓦吉雷那 | 吉瓦拉 玛哈巴拉雅 吽 啪特',
        meaningZh: '【第二至第四会核心·释尊应化/观音合同/金刚藏折摄会】吽、德隆，结界护持！以智慧宝剑斩断恶咒，以金刚宝橛钉伏魔怨，大威神光焰摧破一切业障！',
        meaningEn: 'Second to Fourth Assemblies Essence: Hūṃ Ṭrūṃ bind! With the sword I sever evil spells, with the vajra peg I pin down obstacles; blaze with great power, Hūṃ Phaṭ!',
        tangNoteZh: '楞严咒中段斩魔结界与金刚橛核心章句',
      },
      {
        iast: 'chedani akāla mṛtyu paritrāyaṇa karī',
        classicalTranslitZh: '叱陀你 阿迦罗 蜜唎柱 般唎怛罗耶 儜揭唎',
        modernPhoneticZh: '切达尼 阿嘎拉 姆哩丢 巴哩德拉雅那 嘎哩',
        meaningZh: '【第五会核心·五大心咒】斩断一切非时横死与天魔邪术灾障，圆满救护度脱一切众生！',
        meaningEn: 'Five Great Heart Mantras: O cutter of untimely death, she who grants complete protection and deliverance!',
        tangNoteZh: '楞严咒第五会核心「五大心咒」',
      },
      {
        iast: 'tadyathā oṃ anale viśade vīra vajradhare bandha bandhani vajrapāṇi phaṭ hūṃ trūṃ phaṭ svāhā',
        classicalTranslitZh: '跢侄他 唵 阿那隶 毗舍提 鞞啰 跋阇啰陀唎 盘陀盘陀你 跋阇啰谤尼泮 虎信都嚧瓮泮 莎婆诃',
        modernPhoneticZh: '达德雅他 嗡 阿那类 维沙得 维拉 瓦吉拉达类 班达 班达尼 瓦吉拉巴尼 啪特 吽 德隆 啪特 斯瓦哈',
        meaningZh: '【全咒最末根本心咒】即说咒曰：嗡！猛火清净遍照、勇猛执持金刚杵者！结界缚魔、执金刚手摧破一切魔障，吽、德隆、啪特，圆满成就！',
        meaningEn: 'Ultimate Heart Mantra: Namely: Oṃ! O fiery, pure, heroic holder of the vajra! Bind, O binder, Vajra-in-hand, phaṭ hūṃ trūṃ phaṭ svāhā!',
        tangNoteZh: '楞严咒最末根本心咒（常诵108遍）',
      },
      {
        iast: 'hūṃ mama hūṃ ni svāhā',
        classicalTranslitZh: '吽 妈妈 吽 呢 梭哈',
        modernPhoneticZh: '吽 玛玛 吽 尼 斯瓦哈',
        meaningZh: '【大白伞盖佛母坚甲心咒】吽！护佑于我，摧灭诸恶，圆满吉祥！',
        meaningEn: 'Armor Heart Mantra of Sitātapatrā: Hūṃ! Protect me, hūṃ ni svāhā!',
      },
    ],
  },
  {
    id: 'ucchusma-mahakrodha-dharani',
    titleZh: '秽迹金刚神咒（乌枢沙摩明王大圆满陀罗尼）',
    aliasesZh: '秽迹金刚咒,大权神王佛咒,乌刍沙摩明王咒,火头金刚咒,除秽真言,四十二字秽迹真言',
    titleSanskritIast: 'Ucchuṣma-Vajra-Krodha-Mahāparipūrṇa-Dhāraṇī',
    titleEnglish: 'Great Dhāraṇī of Ucchuṣma Vajra Krodha',
    categoryId: 'vidyarajas-protectors',
    taishoNo: 'T21n1228 / T21n1229',
    translatorZh: '唐·北天竺三藏阿质达霰 译',
    sutraSourceZh: '《秽迹金刚说神通大满陀罗尼法术灵要门》',
    deityZh: '释迦牟尼佛化现大权神王佛 · 秽迹金刚（乌枢沙摩明王）',
    meritsAndSummaryZh:
      '释迦牟尼佛临涅槃时左心化现不坏金刚（秽迹金刚）所宣说之四十二字神咒，净除一切不净污秽、降伏鬼神邪魔、转化烦恼染污为清净菩提。',
    verses: [
      {
        iast: 'oṃ bhihau guru mahāpramāṇa urmika jihvā mānī nikrodha hūṃ hūṃ hūṃ phaṭ phaṭ phaṭ svāhā',
        classicalTranslitZh: '唵 佛舌屈律 摩诃般啰很那 碍哩吻汁吻 酰摩尼 微咭微摩那栖 唵 斫急那 乌深暮 屈律 吽吽吽 泮泮泮 泮泮 娑诃',
        modernPhoneticZh: '嗡 比豪 咕噜 玛哈巴拉玛那 乌尔米嘎 吉瓦 玛尼 尼克罗达 吽 吽 吽 啪特 啪特 啪特 斯瓦哈',
        meaningZh: '嗡！敬礼广大无量威德大忿怒尊乌枢沙摩金刚！以猛烈智慧火舌吞尽一切染污魔障，吽吽吽，摧破摧破，圆满成就！',
        meaningEn: 'Oṃ! Homage to the Great Wrathful One Ucchuṣma of boundless power! Hūṃ hūṃ hūṃ phaṭ phaṭ phaṭ svāhā!',
      },
      {
        iast: 'oṃ krodhana hūṃ jaḥ',
        classicalTranslitZh: '唵 俱噜陀那 吽 弱',
        modernPhoneticZh: '嗡 克罗达那 吽 佳赫',
        meaningZh: '除秽金刚短心咒：嗡！大忿怒尊，净除一切秽垢，吽，召摄成就！',
        meaningEn: 'Short Mantra of Ucchuṣma for purifying impurity: Oṃ krodhana hūṃ jaḥ!',
      },
    ],
  },
  // ==================== 2. 莲花生大士、上师瑜伽与听闻解脱系列 ====================
  {
    id: 'padmasambhava-vajra-guru-mantra',
    titleZh: '莲花生大士心咒（十二音金刚上师咒 & 七句祈请文）',
    aliasesZh: '莲师心咒,金刚上师咒,莲花生大士真言,嗡阿吽班杂咕噜贝玛悉地吽,邬金莲师心咒,遣除道障祈请颂',
    titleSanskritIast: 'Padmasambhava-Vajra-Guru-Dvādaśākṣara-Mantra',
    titleEnglish: 'Twelve-Syllable Vajra Guru Mantra of Padmasambhava',
    categoryId: 'buddhas-bodhisattvas',
    taishoNo: 'T18 (大幻化网与宁玛伏藏梵本对勘)',
    translatorZh: '莲花生大士 传授 / 伏藏大师噶玛林巴 取出',
    sutraSourceZh: '《金刚上师心咒功德经》与《莲师七句祈请文》',
    deityZh: '第二佛陀 · 邬金莲花生大士 (Padmasambhava)',
    meritsAndSummaryZh:
      '三世诸佛身语意总集化现莲花生大士之根本心咒。十二音节摄尽显密八万四千法门精髓，能迅速消除修行违缘、内外密障碍，获三身二利悉地。',
    verses: [
      {
        iast: 'oṃ āḥ hūṃ vajra guru padma siddhi hūṃ',
        classicalTranslitZh: '唵 噁 吽 嚩日啰 具噜 钵纳摩 悉地 吽（藏音：嗡 阿 吽 班杂 咕噜 贝玛 悉地 吽）',
        modernPhoneticZh: '嗡 阿赫 吽 瓦吉拉 咕噜 巴德玛 悉地 吽',
        meaningZh: '嗡（身金刚）、阿（语金刚）、吽（意金刚）！祈请金刚上师莲花生大士，赐予共与不共一切成就悉地，吽！',
        meaningEn: 'Oṃ Āḥ Hūṃ! O Vajra Guru Lotus-Born (Padmasambhava), grant all spiritual accomplishments (siddhi), Hūṃ!',
      },
      {
        iast: 'oṃ āḥ hūṃ vajra guru padma thötreng tsal vajra samaya jaḥ siddhi phala hūṃ āḥ',
        classicalTranslitZh: '嗡 阿 吽 班杂 咕噜 贝玛 托创 杂 班杂 萨玛雅 杂 悉地 帕拉 吽 阿',
        modernPhoneticZh: '嗡 阿赫 吽 瓦吉拉 咕噜 巴德玛 托创 杂 瓦吉拉 萨玛雅 佳赫 悉地 帕拉 吽 阿赫',
        meaningZh: '莲师颅鬘力（忿怒除障）广咒：祈请颅鬘大力莲花生上师，护念三昧耶誓句，赐予胜共成就果位！',
        meaningEn: 'Extended Skull-Garlanded Power Mantra of Guru Padmasambhava for dispelling all obstacles.',
      },
    ],
  },
  {
    id: 'six-realms-vajra-liberation-mantra',
    titleZh: '六道金刚咒（大圆满听闻解脱咒 & 三字明）',
    aliasesZh: '六道金刚咒,听闻解脱咒,大圆满六字真言,啊阿夏萨玛哈,三字明,嗡阿吽,普贤如来根本咒',
    titleSanskritIast: 'Ṣaḍ-Gati-Vajra-Śravaṇa-Mukti-Mantra',
    titleEnglish: 'Six-Realm Vajra Mantra of Liberation Upon Hearing & Three Vajra Syllables',
    categoryId: 'supreme-mantras',
    taishoNo: '大圆满无垢忏悔续 / 听闻解脱密续',
    translatorZh: '毗玛拉米扎 / 诺那呼图克图 传授',
    sutraSourceZh: '《大圆满寂静愤怒百尊听闻解脱经》',
    deityZh: '普贤王如来 (Samantabhadra) · 金刚萨埵',
    meritsAndSummaryZh:
      '专度六道众生出离轮回之无上总持真言，一历耳根即种解脱种子；配合「三字明（oṃ āḥ hūṃ）」总摄诸佛身语意三密加持。',
    verses: [
      {
        iast: 'a āḥ śa sa ma ha',
        classicalTranslitZh: '阿 噁 捨 娑 麼 訶（通行音：啊 阿 夏 萨 玛 哈）',
        modernPhoneticZh: '阿 阿赫 夏 萨 玛 哈',
        meaningZh: '以本初法界六根本种子字，封闭天、阿修罗、人、畜生、饿鬼、地狱六道受生之门，立证大圆满觉性！',
        meaningEn: 'The Six Seed Syllables closing the gates of rebirth in the six realms and awakening primordial awareness.',
      },
      {
        iast: 'oṃ āḥ hūṃ',
        classicalTranslitZh: '唵 噁 吽（通行音：嗡 阿 吽）',
        modernPhoneticZh: '嗡 阿赫 吽',
        meaningZh: '三字明（一切诸佛身、语、意三金刚根本种子字）：清净身语意三业，转化五毒为五智。',
        meaningEn: 'The Three Vajra Seed Syllables of Awakened Body (Oṃ), Speech (Āḥ), and Mind (Hūṃ).',
      },
    ],
  },
  // ==================== 3. 二十一度母与女性佛母部全集 ====================
  {
    id: 'twenty-one-taras-full-mantras',
    titleZh: '圣救度佛母二十一礼赞与诸尊度母心咒总集',
    aliasesZh: '二十一度母心咒,绿度母心咒,白度母心咒,作明佛母心咒,咕噜咕咧佛母,叶衣佛母,尊胜佛母短咒,一髻佛母,狮面空行母,金刚亥母',
    titleSanskritIast: 'Ārya-Tārā-Ekaviṃśati-Mantra-Saṃgraha',
    titleEnglish: 'Complete Heart Mantras of Green Tārā, White Tārā, Kurukullā, Parṇaśabarī & Vajrayoginī',
    categoryId: 'buddhas-bodhisattvas',
    taishoNo: 'T20n1108A / GRETIL tarasto_u.htm',
    translatorZh: '元·安藏 译 / 龙树菩萨 传《度母二十一礼赞经》',
    sutraSourceZh: '《佛说圣救度佛母二十一种礼赞经》(T20n1108A)',
    deityZh: '绿度母 · 白度母 · 作明佛母 · 叶衣佛母 · 狮面空行母 · 金刚亥母',
    meritsAndSummaryZh:
      '汇集一切佛母与空行母核心真言：绿度母救八难心咒、白度母延寿心咒、作明佛母（咕噜咕咧佛母）怀爱人缘心咒、叶衣佛母除疫心咒、狮面空行母回遮魔法心咒、金刚亥母（金刚瑜伽母）根本咒。',
    verses: [
      {
        iast: 'oṃ tāre tuttāre ture svāhā',
        classicalTranslitZh: '唵 多唎 咄多唎 咄唎 娑嚩贺（通行音：嗡 达列 都达列 都列 梭哈）',
        modernPhoneticZh: '嗡 达类 都达类 都类 斯瓦哈',
        meaningZh: '【绿度母根本心咒】嗡！救度母、拔济苦难母、疾速救度母，圆满吉祥！',
        meaningEn: 'Green Tārā Heart Mantra: Oṃ! O Savioress, who liberates from all fears and swiftly delivers, svāhā!',
      },
      {
        iast: 'oṃ tāre tuttāre ture mama āyuḥ puṇya jñāna puṣṭiṃ kuru svāhā',
        classicalTranslitZh: '唵 多唎 咄多唎 咄唎 妈妈 阿优 布尼亚 嘉那 布真 咕噜 梭哈',
        modernPhoneticZh: '嗡 达类 都达类 都类 玛玛 阿尤赫 布尼亚 佳那 布什丁 咕噜 斯瓦哈',
        meaningZh: '【白度母长寿增福慧心咒】祈请救度佛母令我寿命、福德、智慧皆得广大增益，圆满吉祥！',
        meaningEn: 'White Tārā Longevity Mantra: Increase my lifespan, merit, and wisdom, svāhā!',
      },
      {
        iast: 'oṃ kurukulle hrīḥ svāhā',
        classicalTranslitZh: '唵 俱噜俱梨 纥哩 娑嚩贺（通行音：嗡 咕噜咕列 啥 梭哈）',
        modernPhoneticZh: '嗡 咕噜咕类 赫哩赫 斯瓦哈',
        meaningZh: '【作明佛母 / 咕噜咕咧佛母心咒】怀柔摄受善缘、增进智慧与大悲威权。',
        meaningEn: 'Kurukullā Magnetizing Heart Mantra: Oṃ kurukulle hrīḥ svāhā!',
      },
      {
        iast: 'oṃ piśāci parṇaśavarī sarva jvara praśamanāya svāhā',
        classicalTranslitZh: '唵 毕舍支 钵啰拏舍嚩哩 萨嚩 入嚩啰 钵啰舍摩那耶 娑嚩贺',
        modernPhoneticZh: '嗡 比夏吉 巴尔那夏瓦哩 萨尔瓦 吉瓦拉 巴拉夏玛那雅 斯瓦哈',
        meaningZh: '【叶衣佛母 / 叶衣观音除疫心咒】平息一切瘟疫、传染热病与毒害灾难。',
        meaningEn: 'Parṇaśabarī Anti-Epidemic & Healing Mantra: Pacify all fevers and plagues, svāhā!',
      },
      {
        iast: 'āḥ kā sa ma ra tsa śa da ra sa ma ra ya phaṭ',
        classicalTranslitZh: '阿 迦 萨 玛 啰 匝 沙 达 啰 萨 玛 啰 雅 呸',
        modernPhoneticZh: '阿赫 嘎 萨 玛 拉 杂 夏 达 拉 萨 玛 拉 雅 啪特',
        meaningZh: '【狮面空行母回遮心咒】猛力回遮一切诅咒、邪术、恶曜及内外违缘障碍。',
        meaningEn: 'Siṃhamukhā (Lion-Faced Ḍākinī) Mantra for averting curses and negative forces.',
      },
      {
        iast: 'oṃ oṃ oṃ sarva buddha ḍākinīye vajra varṇanīye vajra vairocanīye hūṃ hūṃ hūṃ phaṭ phaṭ phaṭ svāhā',
        classicalTranslitZh: '唵 唵 唵 萨嚩 没驮 荼吉尼耶 嚩日啰 嚩啰拏尼耶 嚩日啰 吠嚧遮尼耶 吽吽吽 发吒发吒发吒 娑嚩贺',
        modernPhoneticZh: '嗡 嗡 嗡 萨尔瓦 布达 达给尼耶 瓦吉拉 瓦尔那尼耶 瓦吉拉 外罗佳尼耶 吽 吽 吽 啪特 啪特 啪特 斯瓦哈',
        meaningZh: '【金刚瑜伽母 / 金刚亥母三嗡咒】祈请诸佛空行母、金刚妙色母、金刚遍照母赐予乐空双运大成就！',
        meaningEn: 'Vajrayoginī / Vajravārāhī Three-Oṃ Mantra.',
      },
    ],
  },
  // ==================== 4. 五姓财神与诸大财神总集 ====================
  {
    id: 'five-jambhalas-wealth-deities-mantras',
    titleZh: '五姓财神与诸天财宝本尊心咒大全（黄/白/红/黑/绿财神·财宝天王·象头王·财源天母）',
    aliasesZh: '五姓财神咒,黄财神心咒,白财神心咒,红财神心咒,黑财神心咒,绿财神心咒,财宝天王心咒,多闻天王咒,毗沙门天王咒,象头王财神咒,大圣欢喜天咒,财源天母心咒,持世菩萨咒',
    titleSanskritIast: 'Pañca-Jambhala-Vaiśravaṇa-Vasudhārā-Mantra-Kośa',
    titleEnglish: 'Complete Treasury of Wealth Deity Mantras (Five Jambhalas, Vaiśravaṇa, Gaṇapati & Vasudhārā)',
    categoryId: 'vidyarajas-protectors',
    taishoNo: 'T21n1245 / T20n1162 / GRETIL jambhalu.htm & vasudhau.htm',
    translatorZh: '唐·不空 / 宋·法天 / 梵本《Jambhalastotra》对勘',
    sutraSourceZh: '《佛说毗沙门天王经》·《大乘圣持世陀罗尼经》·《布禄金刚仪轨》',
    deityZh: '黄财神 · 白财神 · 红财神 · 黑财神 · 绿财神 · 多闻天王 · 财源天母',
    meritsAndSummaryZh:
      '完整收录佛教显密一切增长福德资粮之正法财神真言：五方佛化现之五姓财神（黄、白、红、黑、绿）、北方多闻天王（财宝天王）、持世菩萨（财源天母）及大圣欢喜天（象头王财神）。',
    verses: [
      {
        iast: 'oṃ jambhala jalendrāya svāhā',
        classicalTranslitZh: '唵 瞻巴拉 查冷扎耶 娑嚩贺（通行音：嗡 赞巴拉 扎连达耶 梭哈）',
        modernPhoneticZh: '嗡 詹巴拉 佳连德拉雅 斯瓦哈',
        meaningZh: '【黄财神（布禄金刚）根本心咒】南方宝生佛化现，令修行者资财丰足、远离贫穷匮乏。',
        meaningEn: 'Yellow Jambhala Heart Mantra: Oṃ jambhala jalendrāya svāhā!',
      },
      {
        iast: 'oṃ padma krodha ārya jambhala hṛdaya hūṃ phaṭ',
        classicalTranslitZh: '唵 钵纳摩 俱噜陀 阿哩耶 瞻巴拉 纥哩达耶 吽 发吒',
        modernPhoneticZh: '嗡 巴德玛 克罗达 阿哩雅 詹巴拉 赫哩达雅 吽 啪特',
        meaningZh: '【白财神（骑龙白宝藏王）心咒】观世音菩萨悲泪化现，祛除病苦、灾障与贫苦，增长善业福报。',
        meaningEn: 'White Jambhala (born from Avalokiteśvara) Heart Mantra.',
      },
      {
        iast: 'oṃ jambhala jalendrāya dhanam medehi hrīḥ ḍākinī jāla śaṃvara svāhā',
        classicalTranslitZh: '唵 瞻巴拉 查冷扎耶 达南 美德依 纥哩 荼吉尼 扎拉 什嚩啰 娑嚩贺',
        modernPhoneticZh: '嗡 詹巴拉 佳连德拉雅 达南 美得希 赫哩赫 达给尼 佳拉 尚瓦拉 斯瓦哈',
        meaningZh: '【红财神心咒】金刚萨埵化现，怀摄受用、招聚顺缘资粮与世出世间财富。',
        meaningEn: 'Red Jambhala Heart Mantra for magnetizing prosperity and auspicious conditions.',
      },
      {
        iast: 'oṃ indrāyaṇi mukhaṃ bhramari svāhā',
        classicalTranslitZh: '唵 英扎尼 穆看 巴玛哩 娑嚩贺',
        modernPhoneticZh: '嗡 因德拉雅尼 穆康 布拉玛哩 斯瓦哈',
        meaningZh: '【黑财神心咒】东方不动佛化现，极速驱除怨敌盗贼、恶运衰败，迅速赐予受用。',
        meaningEn: 'Black Jambhala Heart Mantra for swiftly removing misfortune and poverty.',
      },
      {
        iast: 'oṃ vaiśravaṇāya svāhā',
        classicalTranslitZh: '唵 吠室啰嚩拏耶 娑嚩贺（通行音：嗡 贝夏瓦那耶 梭哈）',
        modernPhoneticZh: '嗡 外什拉瓦那雅 斯瓦哈',
        meaningZh: '【北方多闻天王 / 财宝天王根本心咒】护持佛法、赐予无尽财宝与吉祥胜福。',
        meaningEn: 'Vaiśravaṇa (Guardian King of the North & Lord of Wealth) Heart Mantra.',
      },
      {
        iast: 'oṃ vasudhāre svāhā',
        classicalTranslitZh: '唵 嚩苏陀隶 娑嚩贺（通行音：嗡 瓦苏达列 梭哈）',
        modernPhoneticZh: '嗡 瓦苏达类 斯瓦哈',
        meaningZh: '【财源天母 / 持世菩萨心咒】五谷丰登、资财宝藏相续不断。',
        meaningEn: 'Vasudhārā (Goddess of Abundance) Heart Mantra.',
      },
      {
        iast: 'oṃ gaṃ gaṇapataye svāhā',
        classicalTranslitZh: '唵 誐 誐那钵底耶 娑嚩贺',
        modernPhoneticZh: '嗡 刚 嘎那巴达耶 斯瓦哈',
        meaningZh: '【大圣欢喜天 / 象头王财神心咒】遣除一切事业违缘障碍，令善愿顺遂圆满。',
        meaningEn: 'Ārya Gaṇapati (Lord of Overcoming Obstacles & Wealth) Mantra.',
      },
    ],
  },
  // ==================== 5. 无上瑜伽部与四大教派核心本尊心咒 ====================
  {
    id: 'anuttarayoga-tantra-deities-mantras',
    titleZh: '无上瑜伽密续诸大本尊心咒总集（时轮·密集·胜乐·喜金刚·大威德·普巴金刚）',
    aliasesZh: '时轮金刚心咒,十相自在咒,密集金刚心咒,胜乐金刚心咒,上乐金刚咒,喜金刚心咒,呼金刚咒,大威德金刚心咒,怖畏金刚咒,普巴金刚心咒,金刚橛心咒,大幻化网心咒',
    titleSanskritIast: 'Anuttarayoga-Tantra-Kālacakra-Guhyasamāja-Cakrasaṃvara-Hevajra-Yamāntaka-Mantra',
    titleEnglish: 'Supreme Yoga Tantra Deities Mantras (Kālacakra, Guhyasamāja, Cakrasaṃvara, Hevajra, Yamāntaka, Vajrakīlaya)',
    categoryId: 'vidyarajas-protectors',
    taishoNo: 'T18n0885 / T18n0892 / GRETIL guhysamu.htm & hevajrau.htm & samvarau.htm',
    translatorZh: '宋·施护 / 法护 译 & GRETIL 梵文原典对勘',
    sutraSourceZh: '《一切如来真实摄经》·《大悲空智金刚大教王经》·《时轮根本略续》',
    deityZh: '时轮金刚 · 密集金刚 · 胜乐金刚 · 喜金刚 · 大威德金刚 · 普巴金刚',
    meritsAndSummaryZh:
      '汇集无上瑜伽部父续、母续、无二续五大核心本尊与普巴金刚除障根本真言，直取GRETIL梵文续典原句。',
    verses: [
      {
        iast: 'oṃ haṃ kṣa ma la va ra yaṃ svāhā',
        classicalTranslitZh: '唵 唅 乞洒 摩 攞 嚩 啰 演 娑嚩贺（十相自在时轮心咒）',
        modernPhoneticZh: '嗡 罕 克夏 玛 拉 瓦 拉 央 斯瓦哈',
        meaningZh: '【时轮金刚（十相自在）根本心咒】转外内别三时轮为清净无上菩提，镇宅辟邪、汇聚十方吉祥。',
        meaningEn: 'Kālacakra Tenfold Powerful Syllables Mantra.',
      },
      {
        iast: 'oṃ āḥ vajradhṛk hūṃ hūṃ',
        classicalTranslitZh: '唵 噁 嚩日啰特勒克 吽 吽',
        modernPhoneticZh: '嗡 阿赫 瓦吉拉德哩克 吽 吽',
        meaningZh: '【密集金刚（父续之王）根本心咒】证悟幻身与光明双运身金刚果位。',
        meaningEn: 'Guhyasamāja Akṣobhyavajra Heart Mantra.',
      },
      {
        iast: 'oṃ śrī vajra he he ru ru kaṃ hūṃ hūṃ phaṭ ḍākinī jāla śaṃvaraṃ svāhā',
        classicalTranslitZh: '唵 室哩 嚩日啰 醯醯 噜噜 剑 吽吽 发吒 荼吉尼 惹攞 三嚩啰 娑嚩贺',
        modernPhoneticZh: '嗡 什哩 瓦吉拉 黑 黑 噜 噜 刚 吽 吽 啪特 达给尼 佳拉 尚瓦朗 斯瓦哈',
        meaningZh: '【胜乐金刚（母续之王·上乐金刚）根本心咒】总摄空行网大乐轮，证悟俱生大乐智慧。',
        meaningEn: 'Cakrasaṃvara Heruka Root Heart Mantra.',
      },
      {
        iast: 'oṃ deva picu vajra hūṃ hūṃ hūṃ phaṭ svāhā',
        classicalTranslitZh: '唵 提嚩 必祖 嚩日啰 吽吽吽 发吒 娑嚩贺',
        modernPhoneticZh: '嗡 得瓦 比祖 瓦吉拉 吽 吽 吽 啪特 斯瓦哈',
        meaningZh: '【喜金刚（呼金刚·大悲空智金刚）根本心咒】悲智双运、摧破四魔。',
        meaningEn: 'Hevajra Eight-Syllable Root Heart Mantra.',
      },
      {
        iast: 'oṃ hrīḥ ṣṭṛḥ vikṛtānana hūṃ phaṭ',
        classicalTranslitZh: '唵 纥哩 瑟置哩 尾讫哩多曩曩 吽 发吒（大威德金刚行为心咒）',
        modernPhoneticZh: '嗡 赫哩赫 什德哩赫 维克哩达那那 吽 啪特',
        meaningZh: '【文殊大威德金刚（怖畏金刚）根本心咒】文殊菩萨忿怒化现，降伏死魔、烦恼魔、蕴魔、天子魔！',
        meaningEn: 'Vajrabhairava / Yamāntaka Action Heart Mantra.',
      },
      {
        iast: 'oṃ vajra kīli kīlaya sarva vighnān baṃ hūṃ phaṭ',
        classicalTranslitZh: '唵 嚩日啰 枳哩 枳攞耶 萨嚩 尾觐南 鍐 吽 发吒（普巴金刚心咒）',
        modernPhoneticZh: '嗡 瓦吉拉 给哩 给拉雅 萨尔瓦 维格南 班 吽 啪特',
        meaningZh: '【普巴金刚（金刚橛）根本除障心咒】一切诸佛事业总集，如金刚橛钉住并粉碎一切违缘魔障！',
        meaningEn: 'Vajrakīlaya Root Mantra for annihilating all obstacles.',
      },
    ],
  },
  // ==================== 6. 不动佛（阿閦佛）灭重罪陀罗尼与净障超度部 ====================
  {
    id: 'aksobhya-buddha-purification-dharani',
    titleZh: '拔济苦难陀罗尼经 · 东方不动佛（阿閦如来）灭除重罪心咒',
    aliasesZh: '不动佛心咒,阿閦佛心咒,不动如来陀罗尼,灭定业重罪咒,那摩拉纳札雅雅嗡刚嘎尼',
    titleSanskritIast: 'Akṣobhya-Tathāgata-Sarva-Karma-Āvaraṇa-Viśodhana-Dhāraṇī',
    titleEnglish: 'Purification Dhāraṇī of Akṣobhya Buddha',
    categoryId: 'buddhas-bodhisattvas',
    taishoNo: 'T19n0920 / T11n0313',
    translatorZh: '唐·玄奘 / 不空 译',
    sutraSourceZh: '《拔济苦难陀罗尼经》·《阿閦佛国经》',
    deityZh: '东方妙喜世界 · 阿閦如来（不动佛）',
    meritsAndSummaryZh:
      '净除五无间罪、破戒重罪、堕恶趣障之极具威德陀罗尼。书此真言于亡者身或持诵回向，立拔三涂之苦，往生东方妙喜净土。',
    verses: [
      {
        iast: 'namo bhagavate akṣobhyāya tathāgatāyārhate samyaksaṃbuddhāya | tadyathā',
        classicalTranslitZh: '曩谟 婆誐嚩帝 阿閦鞞耶 怛他孽多夜啰诃帝 三藐三没驮耶 | 怛你也他',
        modernPhoneticZh: '那摩 巴嘎瓦得 阿克硕比亚雅 达他嘎达雅尔哈得 萨姆亚克桑布达雅 | 达德雅他',
        meaningZh: '归命世尊东方不动（阿閦）如来、应供、正等正觉！即说真言曰：',
        meaningEn: 'Homage to the Blessed One Akṣobhya Tathāgata, the Arhat, the Perfectly Awakened Buddha! Namely:',
      },
      {
        iast: 'namo ratnatrayāya oṃ kaṃkani kaṃkani rocani rocani troṭani troṭani trāsani trāsani pratihana pratihana sarva karma paraṃparāṇi me sarva sattvānāṃ ca svāhā',
        classicalTranslitZh: '那谟 啰怛那怛啰夜耶 唵 羯伽尼 羯伽尼 嚧遮尼 嚧遮尼 咄嚧咤尼 咄嚧咤尼 怛逻萨尼 怛逻萨尼 般底喝那 般底喝那 萨嚩 羯磨 般滥般啰尼 谜 萨嚩 萨埵喃 遮 娑嚩贺',
        modernPhoneticZh: '那摩 拉德那德拉雅雅 嗡 刚嘎尼 刚嘎尼 罗佳尼 罗佳尼 德罗达尼 德罗达尼 德拉萨尼 德拉萨尼 巴拉底哈那 巴拉底哈那 萨尔瓦 嘎尔玛 巴朗巴拉尼 美 萨尔瓦 萨德瓦南 佳 斯瓦哈',
        meaningZh: '敬礼三宝！嗡！金刚杵净治者、大光明照耀者、断碎烦恼者、震慑诸魔者、摧破业障者！请彻底击碎我与一切众生累世相续之恶业障，圆满吉祥！',
        meaningEn: 'Homage to the Three Jewels! Oṃ! Purify, illuminate, shatter, terrify, and destroy all continuous streams of karmic obscurations of mine and all beings, svāhā!',
      },
    ],
  },
  // ==================== 7. 禅门课诵、瑜伽焰口、蒙山施食、净三业、报父母恩全集 ====================
  {
    id: 'daily-liturgy-and-mengshan-feeding-mantras',
    titleZh: '汉传早晚课诵·蒙山施食·瑜伽焰口·放生仪轨十真言合集',
    aliasesZh: '净口业真言,净身业真言,净意业真言,净三业真言,安土地真言,普供养真言,变食真言,甘露水真言,开咽喉真言,破地狱真言,普召请真言,解怨结真言,报父母恩咒,三皈依真言',
    titleSanskritIast: 'Nitya-Pūjā-Preta-Tarpaṇa-Daśa-Mantra-Saṃgraha',
    titleEnglish: 'Ten Essential Ritual Mantras for Daily Liturgy, Pure Karma, Parents Gratitude & Mengshan Feeding',
    categoryId: 'prajna-sutra-hrdaya',
    taishoNo: 'T21n1313 / T21n1318 / T19n1005A',
    translatorZh: '唐·不空三藏 / 实叉难陀 译',
    sutraSourceZh: '《救拔焰口饿鬼陀罗尼经》·《瑜伽集要救阿难陀罗尼焰口轨仪经》·《禅门日诵》',
    deityZh: '十方三宝 · 观世音菩萨 · 多宝/妙色身/广博身/离怖畏如来',
    meritsAndSummaryZh:
      '完整收录汉传佛教诵经前必诵之净口、净身、净意、净三业、安土地、普供养真言，以及孝亲报父母恩咒、蒙山施食与放生核心真言（破地狱、普召请、解怨结、开咽喉、变食真言、甘露水真言）。',
    verses: [
      {
        iast: 'oṃ śuri śuri mahāśuri śuśuri svāhā',
        classicalTranslitZh: '唵 修利修利 摩诃修利 修修利 萨婆诃',
        modernPhoneticZh: '嗡 殊哩 殊哩 玛哈殊哩 殊殊哩 斯瓦哈',
        meaningZh: '【净口业真言】清净一切口业妄语、恶口、两舌、绮语，令诵经音声清净微妙。',
        meaningEn: 'Speech Karma Purification Mantra.',
      },
      {
        iast: 'oṃ śuddhane śuddhane sarva pāpa viśodhani śuddhe viśuddhe svāhā',
        classicalTranslitZh: '唵 修哆唎 修哆唎 修摩唎 修摩唎 萨婆诃',
        modernPhoneticZh: '嗡 殊达内 殊达内 萨尔瓦 巴巴 维硕达尼 殊得 维殊得 斯瓦哈',
        meaningZh: '【净身业真言】清净一切身业杀盗淫染污，令身器清净无垢。',
        meaningEn: 'Body Karma Purification Mantra.',
      },
      {
        iast: 'oṃ svabhāva śuddhāḥ sarva dharmāḥ svabhāva śuddho ’ham',
        classicalTranslitZh: '唵 娑嚩婆嚩 秫驮 萨嚩达磨 娑嚩婆嚩 秫度憾',
        modernPhoneticZh: '嗡 斯瓦巴瓦 殊达赫 萨尔瓦 达尔玛赫 斯瓦巴瓦 殊多 罕',
        meaningZh: '【净三业真言（观空真言）】一切诸法自性清净，我亦自性本来清净！',
        meaningEn: 'Three-Karma Emptiness Purification Mantra: All dharmas are naturally pure; I too am naturally pure.',
      },
      {
        iast: 'namaḥ samantabuddhānāṃ oṃ dhuru dhuru pṛthivīye svāhā',
        classicalTranslitZh: '南无三满哆 母驮喃 唵 度噜度噜 地尾 萨婆诃',
        modernPhoneticZh: '那玛赫 萨曼达布达南 嗡 都噜 都噜 普哩提维耶 斯瓦哈',
        meaningZh: '【安土地真言】归命普遍诸佛！护持一方地神坚固吉祥，结界护法。',
        meaningEn: 'Earth Deity Pacification Mantra.',
      },
      {
        iast: 'oṃ gagana saṃbhava vajra hoḥ',
        classicalTranslitZh: '唵 誐誐曩 三婆嚩 嚩日啰 斛',
        modernPhoneticZh: '嗡 嘎嘎那 桑巴瓦 瓦吉拉 霍赫',
        meaningZh: '【普供养真言（虚空藏普供养咒）】等虚空界出生无量妙供具，普皆供养十方三世三宝。',
        meaningEn: 'Universal Sky-Treasury Offering Mantra.',
      },
      {
        iast: 'namo mṛtodgatāya svāhā',
        classicalTranslitZh: '南无 密栗多 哆婆曳 娑诃（报父母恩咒）',
        modernPhoneticZh: '那摩 姆哩多德嘎达雅 斯瓦哈',
        meaningZh: '【报父母恩咒】农历七月及日常报答现世父母与累世父母深恩，令得超拔安乐。',
        meaningEn: 'Mantra for Repaying the Kindness of Parents.',
      },
      {
        iast: 'oṃ kārāṭi keyūre svāhā',
        classicalTranslitZh: '唵 伽啰帝耶 娑婆诃',
        modernPhoneticZh: '嗡 嘎拉底 给尤类 斯瓦哈',
        meaningZh: '【破地狱真言】摧破一切铁围地狱门锁，令受苦众生顿获清凉解脱。',
        meaningEn: 'Hell-Shattering Mantra.',
      },
      {
        iast: 'namaḥ sarva tathāgatāvalokite oṃ saṃbhara saṃbhara hūṃ',
        classicalTranslitZh: '南无萨嚩怛他孽多 嚩噜枳帝 唵 三跋啰 三跋啰 吽',
        modernPhoneticZh: '那玛赫 萨尔瓦 达他嘎达瓦洛给得 嗡 桑巴拉 桑巴拉 吽',
        meaningZh: '【变食真言（无量威德自在光明殊胜妙力陀罗尼）】化七粒米或微少饮食为无量甘露妙食，普施法界旷野冥阳众生。',
        meaningEn: 'Food-Multiplying Dhāraṇī of Avalokiteśvara.',
      },
      {
        iast: 'namo surūpāya tathāgatāya tadyathā oṃ surūpe surūpe pra-surūpe svāhā',
        classicalTranslitZh: '南无苏噜婆耶 怛他孽多耶 怛侄他 唵 苏噜苏噜 钵啰苏噜 钵啰苏噜 娑婆诃',
        modernPhoneticZh: '那摩 苏噜巴雅 达他嘎达雅 达德雅他 嗡 苏噜呗 苏噜呗 巴拉苏噜呗 斯瓦哈',
        meaningZh: '【甘露水真言】归命妙色身如来！化滴水为无量清凉甘露法水，解除饿鬼焦渴之苦。',
        meaningEn: 'Sweet-Dew Nectar Mantra of Surūpa Tathāgata.',
      },
    ],
  },
  // ==================== 8. 八大菩萨与文殊/虚空藏/普贤/弥勒/金刚手总集 ====================
  {
    id: 'eight-great-bodhisattvas-complete-mantras',
    titleZh: '八大菩萨心咒全集（文殊五字/八字·普贤·观音·金刚手/大势至·虚空藏求闻持·地藏·弥勒·除盖障）',
    aliasesZh: '八大菩萨心咒,文殊心咒,文殊八字咒,求闻持咒,虚空藏菩萨咒,聪明咒,考试咒,金刚手菩萨心咒,大势至菩萨心咒,普贤菩萨心咒,弥勒菩萨心咒,地藏菩萨心咒,除盖障菩萨心咒',
    titleSanskritIast: 'Aṣṭa-Mahā-Bodhisattva-Hṛdaya-Mantra-Maṇḍala',
    titleEnglish: 'Complete Heart Mantras of the Eight Great Bodhisattvas',
    categoryId: 'buddhas-bodhisattvas',
    taishoNo: 'T20n1167 / T20n1145 / T20n1184',
    translatorZh: '唐·善无畏 / 不空 / 宝思惟 译',
    sutraSourceZh: '《八大菩萨曼荼罗经》·《虚空藏菩萨能满诸愿最胜心陀罗尼求闻持法》·《文殊八字仪轨》',
    deityZh: '文殊 · 普贤 · 观音 · 金刚手(大势至) · 虚空藏 · 地藏 · 弥勒 · 除盖障',
    meritsAndSummaryZh:
      '完整收录大乘八大菩萨核心真言：含文殊五字聪慧咒、八字大威德文殊护身咒、虚空藏菩萨求闻持不忘陀罗尼（过目不忘智慧咒）、金刚手菩萨降魔大力咒、弥勒慈氏誓愿咒等。',
    verses: [
      {
        iast: 'oṃ a ra pa ca na dhīḥ',
        classicalTranslitZh: '唵 阿 啰 跛 左 曩 渧（文殊五字真言）',
        modernPhoneticZh: '嗡 阿 拉 巴 佳 那 蒂赫',
        meaningZh: '【文殊菩萨五字智慧心咒】开启俱生智慧、辩才无碍、博闻强记。',
        meaningEn: 'Five-Syllable Wisdom Mantra of Mañjuśrī.',
      },
      {
        iast: 'oṃ āḥ vī ra hūṃ kha ca raḥ',
        classicalTranslitZh: '唵 阿 味 啰 吽 佉 左 洛（文殊八字最胜大威德心咒）',
        modernPhoneticZh: '嗡 阿赫 维 拉 吽 卡 佳 拉赫',
        meaningZh: '【文殊八字大威德心咒】《文殊师利宝藏陀罗尼经》核心，排解恶星宿曜、宿命灾厄，护国护家。',
        meaningEn: 'Eight-Syllable Heroic Sky-Farer Mantra of Mañjuśrī.',
      },
      {
        iast: 'namo ākāśagarbhāya oṃ ārya kamāri mauli svāhā',
        classicalTranslitZh: '南牟 阿迦舍揭婆耶 唵 阿唎耶 迦玛哩 慕唎 娑嚩贺（虚空藏求闻持咒）',
        modernPhoneticZh: '那摩 阿嘎夏嘎尔巴雅 嗡 阿哩雅 嘎玛哩 矛哩 斯瓦哈',
        meaningZh: '【虚空藏菩萨求闻持聪慧陀罗尼】唐密善无畏三藏传授、弘法大师空海修持之法，增进记忆力与过目不忘胜智。',
        meaningEn: 'Ākāśagarbha Memory-Retention (Gumonji) Dhāraṇī.',
      },
      {
        iast: 'oṃ vajrapāṇi hūṃ phaṭ',
        classicalTranslitZh: '唵 嚩日啰波抳 吽 发吒（金刚手菩萨心咒）',
        modernPhoneticZh: '嗡 瓦吉拉巴尼 吽 啪特',
        meaningZh: '【金刚手菩萨（秘密主/大势至忿怒相）心咒】十方诸佛大力总集，摧灭一切魔军与怯弱。',
        meaningEn: 'Vajrapāṇi (Lord of Secrets & Power) Heart Mantra.',
      },
      {
        iast: 'oṃ maitreya maitreya maitramānasa svāhā',
        classicalTranslitZh: '唵 梅怛梨耶 梅怛梨耶 梅怛啰摩那娑 娑嚩贺（弥勒菩萨心咒）',
        modernPhoneticZh: '嗡 迈德雷雅 迈德雷雅 迈德拉玛那萨 斯瓦哈',
        meaningZh: '【弥勒菩萨（慈氏）心咒】修习无量慈心，命终往生兜率内院，龙华三会必得授记。',
        meaningEn: 'Maitreya Bodhisattva Loving-Kindness Heart Mantra.',
      },
      {
        iast: 'oṃ ha ha ha vismaye svāhā',
        classicalTranslitZh: '唵 哈哈哈 微斯摩耶 娑嚩贺（地藏菩萨心咒）',
        modernPhoneticZh: '嗡 哈 哈 哈 维斯玛耶 斯瓦哈',
        meaningZh: '【地藏菩萨欢喜稀有心咒】满一切众生善愿，坚固大地善根。',
        meaningEn: 'Kṣitigarbha Bodhisattva Heart Mantra.',
      },
      {
        iast: 'namaḥ samantabuddhānāṃ saṃ svāhā',
        classicalTranslitZh: '曩莫 三曼多没驮喃 三 娑嚩贺（普贤菩萨心咒）',
        modernPhoneticZh: '那玛赫 萨曼达布达南 桑 斯瓦哈',
        meaningZh: '【普贤菩萨一字心咒】圆满十大愿王，契入华严法界海。',
        meaningEn: 'Samantabhadra Bodhisattva Seed Mantra.',
      },
    ],
  },
  // ==================== 9. 五方佛、释迦佛、阿弥陀佛、长寿三尊与诸佛真言 ====================
  {
    id: 'five-dhyani-buddhas-and-longevity-triad',
    titleZh: '五方五智如来·释迦牟尼佛·长寿三尊·智炬如来心咒总集',
    aliasesZh: '五方佛心咒,大日如来心咒,毗卢遮那佛咒,宝生佛心咒,不空成就佛心咒,释迦牟尼佛心咒,阿弥陀佛一字心咒,长寿佛心咒,长寿三尊咒,智炬如来破地狱咒',
    titleSanskritIast: 'Pañca-Tathāgata-Śākyamuni-Amitāyus-Jñānolkā-Mantra',
    titleEnglish: 'Heart Mantras of the Five Dhyāni Buddhas, Śākyamuni, Amitāyus & Jñānolkā Tathāgata',
    categoryId: 'buddhas-bodhisattvas',
    taishoNo: 'T18n0848 / T18n0865 / T21n1393',
    translatorZh: '唐·善无畏 / 金刚智 / 不空 / 提云般若 译',
    sutraSourceZh: '《大毗卢遮那成佛神变加持经》·《金刚顶经》·《智炬陀罗尼经》',
    deityZh: '大日如来 · 阿閦佛 · 宝生佛 · 阿弥陀佛(长寿佛) · 不空成就佛 · 释迦佛 · 智炬如来',
    meritsAndSummaryZh:
      '涵盖胎藏界与金刚界五方佛根本真言（法界体性智、大圆镜智、平等性智、妙观察智、成所作智）、释迦牟尼佛本师心咒、长寿佛延命心咒与智炬如来心破地狱陀罗尼。',
    verses: [
      {
        iast: 'namaḥ samantabuddhānāṃ a vi ra hūṃ khaṃ',
        classicalTranslitZh: '曩莫 三曼多没驮喃 阿 尾 啰 吽 欠（大日如来胎藏界五字明）',
        modernPhoneticZh: '那玛赫 萨曼达布达南 阿 维 拉 吽 康',
        meaningZh: '【毗卢遮那佛（大日如来）胎藏界根本真言】地（a）、水（vi）、火（ra）、风（hūṃ）、空（khaṃ）五大皆入法界体性智。',
        meaningEn: 'Mahāvairocana Garbhadhātu Five-Element Mantra.',
      },
      {
        iast: 'oṃ vajradhātu vaṃ',
        classicalTranslitZh: '唵 嚩日啰驮都 鑁（大日如来金刚界一字心咒）',
        modernPhoneticZh: '嗡 瓦吉拉达都 汪',
        meaningZh: '【大日如来金刚界心咒】智法身金刚界最胜一字真言。',
        meaningEn: 'Mahāvairocana Vajradhātu Heart Mantra.',
      },
      {
        iast: 'oṃ mune mune mahāmunaye svāhā',
        classicalTranslitZh: '唵 牟尼 牟尼 摩诃牟尼耶 娑嚩贺（释迦牟尼佛心咒）',
        modernPhoneticZh: '嗡 穆内 穆内 玛哈穆那耶 斯瓦哈',
        meaningZh: '【本师释迦牟尼佛心咒】顶礼寂默能仁、大寂默世尊，净除多劫业障。',
        meaningEn: 'Śākyamuni Buddha Root Heart Mantra.',
      },
      {
        iast: 'oṃ amṛta teje hara hūṃ',
        classicalTranslitZh: '唵 阿蜜栗多 帝际 贺啰 吽（阿弥陀佛一字心咒）',
        modernPhoneticZh: '嗡 阿姆哩达 得杰 哈拉 吽',
        meaningZh: '【阿弥陀佛心咒】无量甘露威光摄受一切念佛众生，临终决定往生极乐世界。',
        meaningEn: 'Amitābha Buddha Heart Mantra.',
      },
      {
        iast: 'oṃ amarani jīvantīye svāhā',
        classicalTranslitZh: '唵 阿玛啰尼 祖弯帝耶 娑嚩贺（长寿佛心咒）',
        modernPhoneticZh: '嗡 阿玛拉尼 吉万底耶 斯瓦哈',
        meaningZh: '【无量寿佛（长寿佛）短心咒】勾招散失之寿元与四大精华，令得无死金刚长寿。',
        meaningEn: 'Amitāyus Buddha Short Longevity Mantra.',
      },
      {
        iast: 'namaḥ aṣṭāśītīnāṃ samyaksaṃbuddha koṭīnāṃ oṃ jñānāvabhāsa dhiri dhiri hūṃ',
        classicalTranslitZh: '曩谟 阿瑟吒始底南 三藐三没驮 俱胝南 唵 若那嚩婆娑 地哩地哩 吽（智炬如来破地狱咒）',
        modernPhoneticZh: '那玛赫 阿什达什底南 萨姆亚克桑布达 哥底南 嗡 佳那瓦巴萨 迪哩 迪哩 吽',
        meaningZh: '【智炬如来心破地狱真言】敬礼八十八俱胝正等觉佛！以智慧火炬光明照破一切阿鼻地狱苦。',
        meaningEn: 'Jñānolkā Tathāgata Hell-Illuminating Dhāraṇī.',
      },
    ],
  },
  // ==================== 10. 五大明王、八大明王与护法诸天、十二药叉大将 ====================
  {
    id: 'vidyarajas-and-dharmapala-devas-mantras',
    titleZh: '五大明王·爱染明王·大黑天玛哈嘎拉·护法诸天与药师十二神将真言全集',
    aliasesZh: '五大明王咒,降三世明王咒,军荼利明王咒,金刚夜叉明王咒,爱染明王心咒,大黑天心咒,玛哈嘎拉心咒,六臂玛哈嘎拉,辩才天女心咒,妙音佛母心咒,坚牢地神咒,药师十二药叉大将咒',
    titleSanskritIast: 'Pañca-Vidyārāja-Rāgarāja-Mahākāla-Dvādaśa-Yakṣa-Mantra',
    titleEnglish: 'Complete Mantras of the Five Vidyārājas, Rāgarāja, Mahākāla, Sarasvatī, Pṛthivī & Twelve Yakṣa Generals',
    categoryId: 'vidyarajas-protectors',
    taishoNo: 'T20n1125 / T21n1287 / T14n0450',
    translatorZh: '唐·金刚智 / 不空 / 玄奘 译',
    sutraSourceZh: '《瑜祇经》·《仁王护国般若波罗蜜多经陀罗尼念诵仪轨》·《药师琉璃光如来本愿功德经》',
    deityZh: '不动明王 · 降三世 · 军荼利 · 大威德 · 金刚夜叉 · 爱染明王 · 大黑天 · 辩才天 · 十二神将',
    meritsAndSummaryZh:
      '收录密教五大明王、爱染明王敬爱违缘转化咒、大黑天（六臂玛哈嘎拉）护法心咒、辩才天女（妙音佛母）智慧音声咒、坚牢地神护持大地真言及药师经十二药叉大将名号真言。',
    verses: [
      {
        iast: 'oṃ sumbha nisumbha hūṃ gṛhṇa gṛhṇa hūṃ gṛhṇāpaya hūṃ ānaya hoḥ bhagavan vajra hūṃ phaṭ',
        classicalTranslitZh: '唵 孙婆 尼孙婆 吽 羯哩摩 羯哩摩 吽 羯哩摩播耶 吽 阿那耶 斛 婆誐鑁 嚩日啰 吽 发吒',
        modernPhoneticZh: '嗡 孙巴 尼孙巴 吽 格哩赫那 格哩赫那 吽 格哩赫那巴雅 吽 阿那雅 霍赫 巴嘎万 瓦吉拉 吽 啪特',
        meaningZh: '【东方降三世明王根本真言】降伏三界贪瞋痴与大自在天慢障，结界辟邪最胜明咒。',
        meaningEn: 'Trailokyavijaya Vidyārāja Root Mantra.',
      },
      {
        iast: 'oṃ amṛte hūṃ phaṭ',
        classicalTranslitZh: '唵 阿蜜栗帝 吽 发吒',
        modernPhoneticZh: '嗡 阿姆哩得 吽 啪特',
        meaningZh: '【南方军荼利明王（甘露军荼利）根本真言】以甘露净治一切障难与毒害，加持饮食与坛城。',
        meaningEn: 'Kuṇḍali Amṛta Vidyārāja Mantra.',
      },
      {
        iast: 'oṃ mahārāga vajroṣṇīṣa vajrasattva jaḥ hūṃ vaṃ hoḥ',
        classicalTranslitZh: '唵 摩诃啰誐 嚩日啰瑟抳洒 嚩日啰萨怛嚩 弱 吽 鑁 斛（爱染明王心咒）',
        modernPhoneticZh: '嗡 玛哈拉嘎 瓦吉罗什尼夏 瓦吉拉萨德瓦 佳赫 吽 汪 霍赫',
        meaningZh: '【爱染明王根本心咒】出自《金刚峰楼阁一切瑜伽瑜祇经》，转染爱烦恼即证大菩提，怀爱人天、家庭和合。',
        meaningEn: 'Rāgarāja (Aizen Myōō) Heart Mantra.',
      },
      {
        iast: 'oṃ vajra mahākāla kṣiṃ kṣetra vighnān vināyaka hūṃ hūṃ phaṭ phaṭ svāhā',
        classicalTranslitZh: '唵 嚩日啰 摩诃迦攞 乞产 乞晒怛啰 尾觐南 毗那夜迦 吽吽 发吒发吒 娑嚩贺',
        modernPhoneticZh: '嗡 瓦吉拉 玛哈嘎拉 克欣 克谢德拉 维格南 维那雅嘎 吽 吽 啪特 啪特 斯瓦哈',
        meaningZh: '【六臂大黑天（玛哈嘎拉）根本心咒】观音化现大护法，守护正法行者，遣除一切刹土魔障与毗那夜迦障。',
        meaningEn: 'Six-Armed Vajra Mahākāla Protector Mantra.',
      },
      {
        iast: 'oṃ sarasvatyai svāhā',
        classicalTranslitZh: '唵 萨啰娑嚩底曳 娑嚩贺（大辩才天女/妙音佛母心咒）',
        modernPhoneticZh: '嗡 萨拉斯瓦德耶 斯瓦哈',
        meaningZh: '【大辩才天女（妙音佛母）心咒】赐予无碍乐音、文章才华、艺术灵感与妙辩智慧。',
        meaningEn: 'Sarasvatī (Goddess of Eloquence, Music & Wisdom) Mantra.',
      },
      {
        iast: 'oṃ kumbhīra vajra mihira aṇḍīra anila śaṇḍilya indra pajra mahoraga sindūra catura vikala svāhā',
        classicalTranslitZh: '唵 宫毗罗 伐折罗 迷企罗 安底罗 頞你罗 珊底罗 因达罗 波夷罗 摩虎罗 真达罗 招杜罗 毗羯罗 娑嚩贺',
        modernPhoneticZh: '嗡 贡比拉 瓦吉拉 米希拉 安底拉 阿尼拉 珊底利亚 因德拉 巴吉拉 玛霍拉嘎 辛都拉 佳都拉 维嘎拉 斯瓦哈',
        meaningZh: '【药师经十二药叉大将名号真言】十二神将各有七千药叉眷属，昼夜十二时辰轮流守护受持药师法门之行者。',
        meaningEn: 'Twelve Yakṣa Generals of Bhaiṣajyaguru Sūtra Mantra.',
      },
    ],
  },
  // ==================== 11. 法华经陀罗尼品、华严经四十二字门、楞伽经陀罗尼 ====================
  {
    id: 'lotus-avatamsaka-lankavatara-sutra-dharanis',
    titleZh: '《法华经·陀罗尼品》六神咒·《华严经》四十二字门·《楞伽经》陀罗尼总集',
    aliasesZh: '法华经陀罗尼,药王菩萨咒,勇施菩萨咒,十罗刹女咒,华严经四十二字门,阿字门,入楞伽经陀罗尼,宗喀巴大师祈请颂,密集嘛',
    titleSanskritIast: 'Saddharmapuṇḍarīka-Gaṇḍavyūha-Laṅkāvatāra-Dhāraṇī',
    titleEnglish: 'Dhāraṇīs of the Lotus Sūtra, Avataṃsaka 42-Syllable Gate & Laṅkāvatāra Sūtra',
    categoryId: 'prajna-sutra-hrdaya',
    taishoNo: 'T09n0262 / T10n0279 / T16n0671 (GRETIL bsu032_u / bsu037_u / bsu026_u)',
    translatorZh: '姚秦·鸠摩罗什 / 唐·实叉难陀 / 元魏·菩提流支 译',
    sutraSourceZh: '《妙法莲华经》卷七《陀罗尼品》·《大方广佛华严经·入法界品》·《入楞伽经》',
    deityZh: '药王菩萨 · 勇施菩萨 · 善财童子 · 宗喀巴大师',
    meritsAndSummaryZh:
      '汇集显教三大根本经典（法华、华严、楞伽）中之梵文原典陀罗尼：法华经药王菩萨护法神咒、华严经善财童子四十二字门般若总持门、入楞伽经百八句陀罗尼首章，以及格鲁派宗喀巴大师祈请颂（密集嘛）梵音真言。',
    verses: [
      {
        iast: 'anye manye mane mamane citte carite śame śamitāvi śānte mukte muktatame same aviṣame samasame jaye kṣaye akṣīṇe śānte samite dhāraṇi ālokabhāṣe pratyavekṣaṇi nidhiru abhyantaraniviṣṭe abhyantarapāriśuddhi mutkule araḍe paraḍe sukāṅkṣi asamasame buddhavilokite dharmaparīkṣite saṃghanirghoṣaṇi nirghoṣaṇi bhayābhayaviśodhani mantre mantrākṣayate rute rutakauśalye akṣaye akṣayavanatāye vakkule valoḍa amanyanatāye svāhā',
        classicalTranslitZh: '安尔 曼尔 摩祢 摩摩祢 旨隶 遮梨第 赊咩 赊履多玮 帝 目帝 目多履 娑履 阿玮娑履 桑履 娑履 叉裔 阿叉裔 帝 奢蜜帝 陀罗尼 阿卢伽婆娑 簸蔗毗叉腻 祢毗剃 阿便哆逻祢履剃... 娑婆诃',
        modernPhoneticZh: '阿涅 玛涅 玛内 玛玛内 吉得 佳哩得 夏美 夏米达维 珊得 穆克得 穆克达达美 萨美 阿维夏美 萨玛萨美 佳耶 克夏耶 阿克希内 珊得 萨米得 达拉尼... 斯瓦哈',
        meaningZh: '【妙法莲华经·陀罗尼品·药王菩萨咒】六十二亿恒河沙诸佛同宣，护持受持《法华经》法师不受一切恶魔鬼神侵扰。',
        meaningEn: 'Bhaiṣajyarāja Bodhisattva Dhāraṇī from Chapter 26 of the Lotus Sūtra (GRETIL bsu032_u.htm).',
      },
      {
        iast: 'a ra pa ca na la da ba ḍa ṣa va ta ya ṣṭa ka sa ma ga stha ja śva dha śa kha kṣa sta jña rtha bha cha sma hva tsa gha ṭha ṇa pha ska ysa śca ṭa ḍha',
        classicalTranslitZh: '阿 多 波 左 那 逻 柁 婆 茶 沙 嚩 多 耶 瑟吒 迦 娑 摩 伽 他 阇 室嚩 陀 奢 佉 叉 娑多 若 曷攞多 婆 车 娑摩 诃嚩 縒 伽 吒 拏 颇 娑迦 也娑 室左 侘 陀',
        modernPhoneticZh: '阿 拉 巴 佳 那 拉 达 巴 达 夏 瓦 达 雅 什达 嘎 萨 玛 嘎 斯他 佳 什瓦 达 夏 卡 克夏 斯达 佳 尔他 巴 恰 斯玛 赫瓦 杂 嘎 他 那 帕 斯嘎 亚萨 什佳 达 达',
        meaningZh: '【华严经·入法界品·四十二字门陀罗尼】唱阿（a）字时入般若波罗蜜门，悟一切法本不生；四十二字统摄一切文字般若。',
        meaningEn: 'The Forty-Two Syllables Gate of Prajñāpāramitā from the Gaṇḍavyūha Sūtra.',
      },
      {
        iast: 'tadyathā padme padmadeve sadāmejinī rane raṇajite svāhā',
        classicalTranslitZh: '但界他 钵头摩 钵头摩提婆 萨陀迷支尼 啰泥 啰那支提 莎诃',
        modernPhoneticZh: '达德雅他 巴德美 巴德玛得威 萨达美吉尼 拉内 拉那吉得 斯瓦哈',
        meaningZh: '【入楞伽经·陀罗尼品真言】佛告大慧菩萨，受持此楞伽陀罗尼章句，一切外道天魔不能得便。',
        meaningEn: 'Dhāraṇī from Chapter 9 of the Laṅkāvatāra Sūtra (GRETIL bsu026_u.htm).',
      },
      {
        iast: 'oṃ āḥ guru vajradhara sumatikīrti siddhi hūṃ hūṃ',
        classicalTranslitZh: '嗡 阿 咕噜 班杂达拉 苏玛蒂 吉尔蒂 悉地 吽 吽（宗喀巴大师心咒 / 密集嘛）',
        modernPhoneticZh: '嗡 阿赫 咕噜 瓦吉拉达拉 苏玛底给尔底 悉地 吽 吽',
        meaningZh: '【宗喀巴大师（善慧名称吉祥）祈请心咒】观音、文殊、金刚手三尊合一宗喀巴大师之智慧心咒（配合《密集嘛》祈请颂持诵）。',
        meaningEn: 'Heart Mantra of Je Tsongkhapa (Sumatikīrti).',
      },
    ],
  },
];

export const WORLD_ENCYCLOPEDIA_DHARANIS: DharaniEntry[] =
  WORLD_MANTRA_SEEDS.map(buildEncyclopediaEntry);
