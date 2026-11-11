import type { DharaniCategoryId, DharaniEntry, DharaniVerse } from '../../types/kosaTypes';
import {
  buildWordGlossesFromIast,
  generateVerseChinesePhonetics,
} from '../../core/sanskrit/phoneticMapper';

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
  const cbetaMatch = seed.taishoNo.match(/T\d{2}n\d{4}/);
  const cbetaId = cbetaMatch ? cbetaMatch[0] : undefined;

  const verses: DharaniVerse[] = seed.verses.map((v, idx) => {
    let rawClassical = v.classicalTranslitZh ? v.classicalTranslitZh.trim() : '';
    let extractedTrailingNote = '';
    const trailingNoteMatch = rawClassical.match(/\s*[（(]([^）)]+)[）)]\s*$/);
    if (
      trailingNoteMatch &&
      !/^(?:引|二合|三合|四合|半音|切身|上|去|入|轻|重)$/.test(trailingNoteMatch[1].trim())
    ) {
      extractedTrailingNote = trailingNoteMatch[1].trim();
      rawClassical = rawClassical.slice(0, trailingNoteMatch.index).trim();
    }

    const hasDbClassical = Boolean(rawClassical);
    const hasDbModern = Boolean(v.modernPhoneticZh && v.modernPhoneticZh.trim());
    const autoPhonetics =
      !hasDbClassical || !hasDbModern
        ? generateVerseChinesePhonetics(v.iast, false)
        : null;
    const mergedTangNote =
      v.tangNoteZh && extractedTrailingNote && !v.tangNoteZh.includes(extractedTrailingNote)
        ? `${v.tangNoteZh} · ${extractedTrailingNote}`
        : v.tangNoteZh || extractedTrailingNote || undefined;
    return {
      id: `${seed.id}-v${idx + 1}`,
      index: idx + 1,
      iast: v.iast,
      classicalTranslitZh: hasDbClassical
        ? rawClassical
        : autoPhonetics!.classicalTranslitZh,
      modernPhoneticZh: hasDbModern
        ? v.modernPhoneticZh!.trim()
        : autoPhonetics!.modernPhoneticZh,
      meaningZh: v.meaningZh,
      meaningEn: v.meaningEn,
      tangNoteZh: mergedTangNote,
      words: buildWordGlossesFromIast(v.iast),
      fieldSources: {
        iast: 'db-original',
        siddham: 'derived-reference',
        devanagari: 'derived-reference',
        classicalTranslitZh:
          Boolean(cbetaId) && hasDbClassical ? 'db-original' : 'derived-reference',
        modernPhoneticZh: 'derived-reference',
        ipa: 'derived-reference',
        prosody: 'derived-reference',
        meaningZh: 'db-original',
        meaningEn: 'db-original',
        words: 'derived-reference',
      },
    };
  });

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
        modernPhoneticZh: '拿玛₍赫₎ 萨₍尔₎瓦-布达-博地-萨₍特₎威₍比₎呀₍赫₎ | 拿摩 巴嘎瓦帝 乌₍师₎尼沙呀 | 悉达达巴₍特₎雷 阿巴啦吉帝 ₍普₎啦₍蒂₎延吉啦呀',
        meaningZh: '【第一会核心·毗卢真法会】顶礼一切诸佛菩萨！归命世尊无见顶相、大白伞盖无能胜大回遮母！',
        meaningEn: 'First Assembly Essence: Homage to all Buddhas and Bodhisattvas! Homage to the Bhagavan’s Uṣṇīṣa, the Invincible White Parasol Sitātapatrā Pratyangirā!',
        tangNoteZh: '楞严咒第一会归命大佛顶大白伞盖总印',
      },
      {
        iast: 'hūṃ ṭrūṃ bandha bandha | vidyāṃ chindayāmy asinā kīlayāmi vajreṇa | jvala mahābalāya hūṃ phaṭ',
        classicalTranslitZh: '虎㖀都嚧雍 婆陀婆陀 | 毗陀夜 嗔陀夜弥 阿悉那 鸡罗夜弥 跋阇啰拏 | 入嚩啰 摩诃婆啰耶 吽 泮吒',
        modernPhoneticZh: '吽 ₍特₎隆 班达 班达 | 维₍地₎央 亲达呀₍米₎ 阿悉拿 给啦呀米 瓦₍吉₎雷拿 | ₍吉₎瓦啦 玛哈-巴啦呀 吽 帕₍特₎',
        meaningZh: '【第二至第四会核心·释尊应化/观音合同/金刚藏折摄会】吽、德隆，结界护持！以智慧宝剑斩断恶咒，以金刚宝橛钉伏魔怨，大威神光焰摧破一切业障！',
        meaningEn: 'Second to Fourth Assemblies Essence: Hūṃ Ṭrūṃ bind! With the sword I sever evil spells, with the vajra peg I pin down obstacles; blaze with great power, Hūṃ Phaṭ!',
        tangNoteZh: '楞严咒中段斩魔结界与金刚橛核心章句',
      },
      {
        iast: 'chedani akāla mṛtyu paritrāyaṇa karī',
        classicalTranslitZh: '叱陀你 阿迦罗 蜜唎柱 般唎怛罗耶 儜揭唎',
        modernPhoneticZh: '切达尼 阿嘎啦 ₍姆₎日₍蒂₎尤 巴里-₍特₎啦呀拿 嘎里',
        meaningZh: '【第五会核心·五大心咒】斩断一切非时横死与天魔邪术灾障，圆满救护度脱一切众生！',
        meaningEn: 'Five Great Heart Mantras: O cutter of untimely death, she who grants complete protection and deliverance!',
        tangNoteZh: '楞严咒第五会核心「五大心咒」',
      },
      {
        iast: 'tadyathā oṃ anale viśade vīra vajradhare bandha bandhani vajrapāṇi phaṭ hūṃ trūṃ phaṭ svāhā',
        classicalTranslitZh: '跢侄他 唵 阿那隶 毗舍提 鞞啰 跋阇啰陀唎 盘陀盘陀你 跋阇啰谤尼泮 虎信都嚧瓮泮 莎婆诃',
        modernPhoneticZh: '达₍地₎呀他 嗡 阿拿雷 维沙叠 维啦 瓦₍吉₎啦达雷 班达 班达尼 瓦₍吉₎啦巴尼 帕₍特₎ 吽 ₍特₎隆 帕₍特₎ ₍斯₎瓦哈',
        meaningZh: '【全咒最末根本心咒】即说咒曰：嗡！猛火清净遍照、勇猛执持金刚杵者！结界缚魔、执金刚手摧破一切魔障，吽、德隆、啪特，圆满成就！',
        meaningEn: 'Ultimate Heart Mantra: Namely: Oṃ! O fiery, pure, heroic holder of the vajra! Bind, O binder, Vajra-in-hand, phaṭ hūṃ trūṃ phaṭ svāhā!',
        tangNoteZh: '楞严咒最末根本心咒（常诵108遍）',
      },
      {
        iast: 'hūṃ mama hūṃ ni svāhā',
        classicalTranslitZh: '吽 妈妈 吽 呢 梭哈',
        modernPhoneticZh: '吽 玛玛 吽 尼 ₍斯₎瓦哈',
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
        modernPhoneticZh: '嗡 比豪 古鲁 玛哈-₍普₎啦玛拿 乌₍尔₎米嘎 吉₍赫₎瓦 玛尼 尼₍克₎洛达 吽 吽 吽 帕₍特₎ 帕₍特₎ 帕₍特₎ ₍斯₎瓦哈',
        meaningZh: '嗡！敬礼广大无量威德大忿怒尊乌枢沙摩金刚！以猛烈智慧火舌吞尽一切染污魔障，吽吽吽，摧破摧破，圆满成就！',
        meaningEn: 'Oṃ! Homage to the Great Wrathful One Ucchuṣma of boundless power! Hūṃ hūṃ hūṃ phaṭ phaṭ phaṭ svāhā!',
      },
      {
        iast: 'oṃ krodhana hūṃ jaḥ',
        classicalTranslitZh: '唵 俱噜陀那 吽 弱',
        modernPhoneticZh: '嗡 ₍克₎洛达拿 吽 佳₍赫₎',
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
        modernPhoneticZh: '嗡 阿₍赫₎ 吽 瓦₍吉₎啦 古鲁 巴₍德₎玛 悉地 吽',
        meaningZh: '嗡（身金刚）、阿（语金刚）、吽（意金刚）！祈请金刚上师莲花生大士，赐予共与不共一切成就悉地，吽！',
        meaningEn: 'Oṃ Āḥ Hūṃ! O Vajra Guru Lotus-Born (Padmasambhava), grant all spiritual accomplishments (siddhi), Hūṃ!',
      },
      {
        iast: 'oṃ āḥ hūṃ vajra guru padma thotreng tsal vajra samaya jaḥ siddhi phala hūṃ āḥ',
        classicalTranslitZh: '嗡 阿 吽 班杂 咕噜 贝玛 托创 杂 班杂 萨玛雅 杂 悉地 帕拉 吽 阿',
        modernPhoneticZh: '嗡 阿₍赫₎ 吽 瓦₍吉₎啦 古鲁 巴₍德₎玛 托₍特₎伦₍格₎ 杂₍尔₎ 瓦₍吉₎啦 萨玛呀 佳₍赫₎ 悉地 帕啦 吽 阿₍赫₎',
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
        modernPhoneticZh: '阿 阿₍赫₎ 沙 萨 玛 哈',
        meaningZh: '以本初法界六根本种子字，封闭天、阿修罗、人、畜生、饿鬼、地狱六道受生之门，立证大圆满觉性！',
        meaningEn: 'The Six Seed Syllables closing the gates of rebirth in the six realms and awakening primordial awareness.',
      },
      {
        iast: 'oṃ āḥ hūṃ',
        classicalTranslitZh: '唵 噁 吽（通行音：嗡 阿 吽）',
        modernPhoneticZh: '嗡 阿₍赫₎ 吽',
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
        modernPhoneticZh: '嗡 达雷 度达雷 度雷 ₍斯₎瓦哈',
        meaningZh: '【绿度母根本心咒】嗡！救度母、拔济苦难母、疾速救度母，圆满吉祥！',
        meaningEn: 'Green Tārā Heart Mantra: Oṃ! O Savioress, who liberates from all fears and swiftly delivers, svāhā!',
      },
      {
        iast: 'oṃ tāre tuttāre ture mama āyuḥ puṇya jñāna puṣṭiṃ kuru svāhā',
        classicalTranslitZh: '唵 多唎 咄多唎 咄唎 妈妈 阿优 布尼亚 嘉那 布真 咕噜 梭哈',
        modernPhoneticZh: '嗡 达雷 度达雷 度雷 玛玛 阿尤₍忽₎ 布₍尼₎呀 ₍吉尼₎亚拿 布₍师₎丁 古鲁 ₍斯₎瓦哈',
        meaningZh: '【白度母长寿增福慧心咒】祈请救度佛母令我寿命、福德、智慧皆得广大增益，圆满吉祥！',
        meaningEn: 'White Tārā Longevity Mantra: Increase my lifespan, merit, and wisdom, svāhā!',
      },
      {
        iast: 'oṃ kurukulle hrīḥ svāhā',
        classicalTranslitZh: '唵 俱噜俱梨 纥哩 娑嚩贺（通行音：嗡 咕噜咕列 啥 梭哈）',
        modernPhoneticZh: '嗡 古鲁古雷 ₍赫₎里₍希₎ ₍斯₎瓦哈',
        meaningZh: '【作明佛母 / 咕噜咕咧佛母心咒】怀柔摄受善缘、增进智慧与大悲威权。',
        meaningEn: 'Kurukullā Magnetizing Heart Mantra: Oṃ kurukulle hrīḥ svāhā!',
      },
      {
        iast: 'oṃ piśāci parṇaśavarī sarva jvara praśamanāya svāhā',
        classicalTranslitZh: '唵 毕舍支 钵啰拏舍嚩哩 萨嚩 入嚩啰 钵啰舍摩那耶 娑嚩贺',
        modernPhoneticZh: '嗡 比沙吉 巴₍尔₎拿沙瓦里 萨₍尔₎瓦 ₍吉₎瓦啦 ₍普₎啦沙玛拿呀 ₍斯₎瓦哈',
        meaningZh: '【叶衣佛母 / 叶衣观音除疫心咒】平息一切瘟疫、传染热病与毒害灾难。',
        meaningEn: 'Parṇaśabarī Anti-Epidemic & Healing Mantra: Pacify all fevers and plagues, svāhā!',
      },
      {
        iast: 'āḥ kā sa ma ra tsa śa da ra sa ma ra ya phaṭ',
        classicalTranslitZh: '阿 迦 萨 玛 啰 匝 沙 达 啰 萨 玛 啰 雅 呸',
        modernPhoneticZh: '阿₍赫₎ 嘎 萨 玛 啦 杂 沙 达 啦 萨 玛 啦 呀 帕₍特₎',
        meaningZh: '【狮面空行母回遮心咒】猛力回遮一切诅咒、邪术、恶曜及内外违缘障碍。',
        meaningEn: 'Siṃhamukhā (Lion-Faced Ḍākinī) Mantra for averting curses and negative forces.',
      },
      {
        iast: 'oṃ oṃ oṃ sarva buddha ḍākinīye vajra varṇanīye vajra vairocanīye hūṃ hūṃ hūṃ phaṭ phaṭ phaṭ svāhā',
        classicalTranslitZh: '唵 唵 唵 萨嚩 没驮 荼吉尼耶 嚩日啰 嚩啰拏尼耶 嚩日啰 吠嚧遮尼耶 吽吽吽 发吒发吒发吒 娑嚩贺',
        modernPhoneticZh: '嗡 嗡 嗡 萨₍尔₎瓦 布达 达给尼耶 瓦₍吉₎啦 瓦₍尔₎拿尼耶 瓦₍吉₎啦 歪洛佳尼耶 吽 吽 吽 帕₍特₎ 帕₍特₎ 帕₍特₎ ₍斯₎瓦哈',
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
        modernPhoneticZh: '嗡 詹巴啦 佳伦₍德₎啦呀 ₍斯₎瓦哈',
        meaningZh: '【黄财神（布禄金刚）根本心咒】南方宝生佛化现，令修行者资财丰足、远离贫穷匮乏。',
        meaningEn: 'Yellow Jambhala Heart Mantra: Oṃ jambhala jalendrāya svāhā!',
      },
      {
        iast: 'oṃ padma krodha ārya jambhala hṛdaya hūṃ phaṭ',
        classicalTranslitZh: '唵 钵纳摩 俱噜陀 阿哩耶 瞻巴拉 纥哩达耶 吽 发吒',
        modernPhoneticZh: '嗡 巴₍德₎玛 ₍克₎洛达 阿₍哩₎呀 詹巴啦 ₍赫₎日达呀 吽 帕₍特₎',
        meaningZh: '【白财神（骑龙白宝藏王）心咒】观世音菩萨悲泪化现，祛除病苦、灾障与贫苦，增长善业福报。',
        meaningEn: 'White Jambhala (born from Avalokiteśvara) Heart Mantra.',
      },
      {
        iast: 'oṃ jambhala jalendrāya dhanam medehi hrīḥ ḍākinī jāla śaṃvara svāhā',
        classicalTranslitZh: '唵 瞻巴拉 查冷扎耶 达南 美德依 纥哩 荼吉尼 扎拉 什嚩啰 娑嚩贺',
        modernPhoneticZh: '嗡 詹巴啦 佳伦₍德₎啦呀 达南 美叠嘿 ₍赫₎里₍希₎ 达给尼 佳啦 商瓦啦 ₍斯₎瓦哈',
        meaningZh: '【红财神心咒】金刚萨埵化现，怀摄受用、招聚顺缘资粮与世出世间财富。',
        meaningEn: 'Red Jambhala Heart Mantra for magnetizing prosperity and auspicious conditions.',
      },
      {
        iast: 'oṃ indrāyaṇi mukhaṃ bhramari svāhā',
        classicalTranslitZh: '唵 英扎尼 穆看 巴玛哩 娑嚩贺',
        modernPhoneticZh: '嗡 因₍德₎啦呀尼 穆康 ₍布₎啦玛里 ₍斯₎瓦哈',
        meaningZh: '【黑财神心咒】东方不动佛化现，极速驱除怨敌盗贼、恶运衰败，迅速赐予受用。',
        meaningEn: 'Black Jambhala Heart Mantra for swiftly removing misfortune and poverty.',
      },
      {
        iast: 'oṃ vaiśravaṇāya svāhā',
        classicalTranslitZh: '唵 吠室啰嚩拏耶 娑嚩贺（通行音：嗡 贝夏瓦那耶 梭哈）',
        modernPhoneticZh: '嗡 歪₍希₎啦瓦拿呀 ₍斯₎瓦哈',
        meaningZh: '【北方多闻天王 / 财宝天王根本心咒】护持佛法、赐予无尽财宝与吉祥胜福。',
        meaningEn: 'Vaiśravaṇa (Guardian King of the North & Lord of Wealth) Heart Mantra.',
      },
      {
        iast: 'oṃ vasudhāre svāhā',
        classicalTranslitZh: '唵 嚩苏陀隶 娑嚩贺（通行音：嗡 瓦苏达列 梭哈）',
        modernPhoneticZh: '嗡 瓦苏达雷 ₍斯₎瓦哈',
        meaningZh: '【财源天母 / 持世菩萨心咒】五谷丰登、资财宝藏相续不断。',
        meaningEn: 'Vasudhārā (Goddess of Abundance) Heart Mantra.',
      },
      {
        iast: 'oṃ gaṃ gaṇapataye svāhā',
        classicalTranslitZh: '唵 誐 誐那钵底耶 娑嚩贺',
        modernPhoneticZh: '嗡 刚 嘎拿巴达耶 ₍斯₎瓦哈',
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
        modernPhoneticZh: '嗡 罕 ₍克₎沙 玛 啦 瓦 啦 央 ₍斯₎瓦哈',
        meaningZh: '【时轮金刚（十相自在）根本心咒】转外内别三时轮为清净无上菩提，镇宅辟邪、汇聚十方吉祥。',
        meaningEn: 'Kālacakra Tenfold Powerful Syllables Mantra.',
      },
      {
        iast: 'oṃ āḥ vajradhṛk hūṃ hūṃ',
        classicalTranslitZh: '唵 噁 嚩日啰特勒克 吽 吽',
        modernPhoneticZh: '嗡 阿₍赫₎ 瓦₍吉₎啦₍德₎日₍克₎ 吽 吽',
        meaningZh: '【密集金刚（父续之王）根本心咒】证悟幻身与光明双运身金刚果位。',
        meaningEn: 'Guhyasamāja Akṣobhyavajra Heart Mantra.',
      },
      {
        iast: 'oṃ śrī vajra he he ru ru kaṃ hūṃ hūṃ phaṭ ḍākinī jāla śaṃvaraṃ svāhā',
        classicalTranslitZh: '唵 室哩 嚩日啰 醯醯 噜噜 剑 吽吽 发吒 荼吉尼 惹攞 三嚩啰 娑嚩贺',
        modernPhoneticZh: '嗡 ₍希₎里 瓦₍吉₎啦 嘿 嘿 鲁 鲁 刚 吽 吽 帕₍特₎ 达给尼 佳啦 商瓦朗 ₍斯₎瓦哈',
        meaningZh: '【胜乐金刚（母续之王·上乐金刚）根本心咒】总摄空行网大乐轮，证悟俱生大乐智慧。',
        meaningEn: 'Cakrasaṃvara Heruka Root Heart Mantra.',
      },
      {
        iast: 'oṃ deva picu vajra hūṃ hūṃ hūṃ phaṭ svāhā',
        classicalTranslitZh: '唵 提嚩 必祖 嚩日啰 吽吽吽 发吒 娑嚩贺',
        modernPhoneticZh: '嗡 叠瓦 比主 瓦₍吉₎啦 吽 吽 吽 帕₍特₎ ₍斯₎瓦哈',
        meaningZh: '【喜金刚（呼金刚·大悲空智金刚）根本心咒】悲智双运、摧破四魔。',
        meaningEn: 'Hevajra Eight-Syllable Root Heart Mantra.',
      },
      {
        iast: 'oṃ hrīḥ ṣṭrīḥ vikṛtānana hūṃ phaṭ',
        classicalTranslitZh: '唵 纥哩 瑟置哩 尾讫哩多曩曩 吽 发吒（大威德金刚行为心咒）',
        modernPhoneticZh: '嗡 ₍赫₎里₍希₎ ₍师特₎里₍希₎ 维₍克₎日达拿拿 吽 帕₍特₎',
        meaningZh: '【文殊大威德金刚（怖畏金刚）根本心咒】文殊菩萨忿怒化现，降伏死魔、烦恼魔、蕴魔、天子魔！',
        meaningEn: 'Vajrabhairava / Yamāntaka Action Heart Mantra.',
      },
      {
        iast: 'oṃ vajra kīli kīlaya sarva vighnān baṃ hūṃ phaṭ',
        classicalTranslitZh: '唵 嚩日啰 枳哩 枳攞耶 萨嚩 尾觐南 鍐 吽 发吒（普巴金刚心咒）',
        modernPhoneticZh: '嗡 瓦₍吉₎啦 给利 给啦呀 萨₍尔₎瓦 维₍格₎南 邦 吽 帕₍特₎',
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
        modernPhoneticZh: '拿摩 巴嘎瓦帝 阿₍克₎硕₍比₎呀呀 达他嘎达-呀₍尔₎哈帝 萨₍姆₎呀₍克₎-桑布达呀 | 达₍地₎呀他',
        meaningZh: '归命世尊东方不动（阿閦）如来、应供、正等正觉！即说真言曰：',
        meaningEn: 'Homage to the Blessed One Akṣobhya Tathāgata, the Arhat, the Perfectly Awakened Buddha! Namely:',
      },
      {
        iast: 'namo ratnatrayāya oṃ kaṃkani kaṃkani rocani rocani troṭani troṭani trāsani trāsani pratihana pratihana sarva karma paraṃparāṇi me sarva sattvānāṃ ca svāhā',
        classicalTranslitZh: '那谟 啰怛那怛啰夜耶 唵 羯伽尼 羯伽尼 嚧遮尼 嚧遮尼 咄嚧咤尼 咄嚧咤尼 怛逻萨尼 怛逻萨尼 般底喝那 般底喝那 萨嚩 羯磨 般滥般啰尼 谜 萨嚩 萨埵喃 遮 娑嚩贺',
        modernPhoneticZh: '拿摩 啦₍特₎拿-₍特₎啦呀呀 嗡 刚嘎尼 刚嘎尼 洛佳尼 洛佳尼 ₍特₎洛达尼 ₍特₎洛达尼 ₍特₎啦萨尼 ₍特₎啦萨尼 ₍普₎啦帝哈拿 ₍普₎啦帝哈拿 萨₍尔₎瓦 嘎₍尔₎玛 巴朗巴啦尼 美 萨₍尔₎瓦 萨₍特₎瓦南 佳 ₍斯₎瓦哈',
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
        modernPhoneticZh: '嗡 舒里 舒里 玛哈舒里 舒舒里 ₍斯₎瓦哈',
        meaningZh: '【净口业真言】清净一切口业妄语、恶口、两舌、绮语，令诵经音声清净微妙。',
        meaningEn: 'Speech Karma Purification Mantra.',
      },
      {
        iast: 'oṃ śuddhane śuddhane sarva pāpa viśodhani śuddhe viśuddhe svāhā',
        classicalTranslitZh: '唵 修哆唎 修哆唎 修摩唎 修摩唎 萨婆诃',
        modernPhoneticZh: '嗡 舒达内 舒达内 萨₍尔₎瓦 巴巴 维硕达尼 舒叠 维舒叠 ₍斯₎瓦哈',
        meaningZh: '【净身业真言】清净一切身业杀盗淫染污，令身器清净无垢。',
        meaningEn: 'Body Karma Purification Mantra.',
      },
      {
        iast: "oṃ svabhāva śuddhāḥ sarva dharmāḥ svabhāva śuddho 'ham",
        classicalTranslitZh: '唵 娑嚩婆嚩 秫驮 萨嚩达磨 娑嚩婆嚩 秫度憾',
        modernPhoneticZh: '嗡 ₍斯₎瓦巴瓦 舒达₍赫₎ 萨₍尔₎瓦 达₍尔₎玛₍赫₎ ₍斯₎瓦巴瓦 舒多 罕',
        meaningZh: '【净三业真言（观空真言）】一切诸法自性清净，我亦自性本来清净！',
        meaningEn: 'Three-Karma Emptiness Purification Mantra: All dharmas are naturally pure; I too am naturally pure.',
      },
      {
        iast: 'namaḥ samantabuddhānāṃ oṃ dhuru dhuru pṛthivīye svāhā',
        classicalTranslitZh: '南无三满哆 母驮喃 唵 度噜度噜 地尾 萨婆诃',
        modernPhoneticZh: '拿玛₍赫₎ 萨曼达-布达南 嗡 杜鲁 杜鲁 ₍普₎日提维耶 ₍斯₎瓦哈',
        meaningZh: '【安土地真言】归命普遍诸佛！护持一方地神坚固吉祥，结界护法。',
        meaningEn: 'Earth Deity Pacification Mantra.',
      },
      {
        iast: 'oṃ gagana saṃbhava vajra hoḥ',
        classicalTranslitZh: '唵 誐誐曩 三婆嚩 嚩日啰 斛',
        modernPhoneticZh: '嗡 嘎嘎拿 桑巴瓦 瓦₍吉₎啦 霍₍赫₎',
        meaningZh: '【普供养真言（虚空藏普供养咒）】等虚空界出生无量妙供具，普皆供养十方三世三宝。',
        meaningEn: 'Universal Sky-Treasury Offering Mantra.',
      },
      {
        iast: 'namo mṛtodgatāya svāhā',
        classicalTranslitZh: '南无 密栗多 哆婆曳 娑诃（报父母恩咒）',
        modernPhoneticZh: '拿摩 ₍姆₎日多₍德₎嘎达呀 ₍斯₎瓦哈',
        meaningZh: '【报父母恩咒】农历七月及日常报答现世父母与累世父母深恩，令得超拔安乐。',
        meaningEn: 'Mantra for Repaying the Kindness of Parents.',
      },
      {
        iast: 'oṃ kārāṭi keyūre svāhā',
        classicalTranslitZh: '唵 伽啰帝耶 娑婆诃',
        modernPhoneticZh: '嗡 嘎啦蒂 给尤雷 ₍斯₎瓦哈',
        meaningZh: '【破地狱真言】摧破一切铁围地狱门锁，令受苦众生顿获清凉解脱。',
        meaningEn: 'Hell-Shattering Mantra.',
      },
      {
        iast: 'namaḥ sarva tathāgatāvalokite oṃ saṃbhara saṃbhara hūṃ',
        classicalTranslitZh: '南无萨嚩怛他孽多 嚩噜枳帝 唵 三跋啰 三跋啰 吽',
        modernPhoneticZh: '拿玛₍赫₎ 萨₍尔₎瓦 达他嘎达-瓦洛给帝 嗡 桑巴啦 桑巴啦 吽',
        meaningZh: '【变食真言（无量威德自在光明殊胜妙力陀罗尼）】化七粒米或微少饮食为无量甘露妙食，普施法界旷野冥阳众生。',
        meaningEn: 'Food-Multiplying Dhāraṇī of Avalokiteśvara.',
      },
      {
        iast: 'namo surūpāya tathāgatāya tadyathā oṃ surūpe surūpe pra-surūpe svāhā',
        classicalTranslitZh: '南无苏噜婆耶 怛他孽多耶 怛侄他 唵 苏噜苏噜 钵啰苏噜 钵啰苏噜 娑婆诃',
        modernPhoneticZh: '拿摩 苏鲁巴呀 达他嘎达呀 达₍地₎呀他 嗡 苏鲁贝 苏鲁贝 ₍普₎啦-苏鲁贝 ₍斯₎瓦哈',
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
        modernPhoneticZh: '嗡 阿 啦 巴 佳 拿 迪₍希₎',
        meaningZh: '【文殊菩萨五字智慧心咒】开启俱生智慧、辩才无碍、博闻强记。',
        meaningEn: 'Five-Syllable Wisdom Mantra of Mañjuśrī.',
      },
      {
        iast: 'oṃ āḥ vī ra hūṃ kha ca raḥ',
        classicalTranslitZh: '唵 阿 味 啰 吽 佉 左 洛（文殊八字最胜大威德心咒）',
        modernPhoneticZh: '嗡 阿₍赫₎ 维 啦 吽 卡 佳 啦₍赫₎',
        meaningZh: '【文殊八字大威德心咒】《文殊师利宝藏陀罗尼经》核心，排解恶星宿曜、宿命灾厄，护国护家。',
        meaningEn: 'Eight-Syllable Heroic Sky-Farer Mantra of Mañjuśrī.',
      },
      {
        iast: 'namo ākāśagarbhāya oṃ ārya kamāri mauli svāhā',
        classicalTranslitZh: '南牟 阿迦舍揭婆耶 唵 阿唎耶 迦玛哩 慕唎 娑嚩贺（虚空藏求闻持咒）',
        modernPhoneticZh: '拿摩 阿嘎沙嘎₍尔₎巴呀 嗡 阿₍哩₎呀 嘎玛里 毛利 ₍斯₎瓦哈',
        meaningZh: '【虚空藏菩萨求闻持聪慧陀罗尼】唐密善无畏三藏传授、弘法大师空海修持之法，增进记忆力与过目不忘胜智。',
        meaningEn: 'Ākāśagarbha Memory-Retention (Gumonji) Dhāraṇī.',
      },
      {
        iast: 'oṃ vajrapāṇi hūṃ phaṭ',
        classicalTranslitZh: '唵 嚩日啰波抳 吽 发吒（金刚手菩萨心咒）',
        modernPhoneticZh: '嗡 瓦₍吉₎啦巴尼 吽 帕₍特₎',
        meaningZh: '【金刚手菩萨（秘密主/大势至忿怒相）心咒】十方诸佛大力总集，摧灭一切魔军与怯弱。',
        meaningEn: 'Vajrapāṇi (Lord of Secrets & Power) Heart Mantra.',
      },
      {
        iast: 'oṃ maitreya maitreya maitramānasa svāhā',
        classicalTranslitZh: '唵 梅怛梨耶 梅怛梨耶 梅怛啰摩那娑 娑嚩贺（弥勒菩萨心咒）',
        modernPhoneticZh: '嗡 麦₍特₎雷呀 麦₍特₎雷呀 麦₍特₎啦玛拿萨 ₍斯₎瓦哈',
        meaningZh: '【弥勒菩萨（慈氏）心咒】修习无量慈心，命终往生兜率内院，龙华三会必得授记。',
        meaningEn: 'Maitreya Bodhisattva Loving-Kindness Heart Mantra.',
      },
      {
        iast: 'oṃ ha ha ha vismaye svāhā',
        classicalTranslitZh: '唵 哈哈哈 微斯摩耶 娑嚩贺（地藏菩萨心咒）',
        modernPhoneticZh: '嗡 哈 哈 哈 维₍斯₎玛耶 ₍斯₎瓦哈',
        meaningZh: '【地藏菩萨欢喜稀有心咒】满一切众生善愿，坚固大地善根。',
        meaningEn: 'Kṣitigarbha Bodhisattva Heart Mantra.',
      },
      {
        iast: 'namaḥ samantabuddhānāṃ saṃ svāhā',
        classicalTranslitZh: '曩莫 三曼多没驮喃 三 娑嚩贺（普贤菩萨心咒）',
        modernPhoneticZh: '拿玛₍赫₎ 萨曼达-布达南 桑 ₍斯₎瓦哈',
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
        modernPhoneticZh: '拿玛₍赫₎ 萨曼达-布达南 阿 维 啦 吽 康',
        meaningZh: '【毗卢遮那佛（大日如来）胎藏界根本真言】地（a）、水（vi）、火（ra）、风（hūṃ）、空（khaṃ）五大皆入法界体性智。',
        meaningEn: 'Mahāvairocana Garbhadhātu Five-Element Mantra.',
      },
      {
        iast: 'oṃ vajradhātu vaṃ',
        classicalTranslitZh: '唵 嚩日啰驮都 鑁（大日如来金刚界一字心咒）',
        modernPhoneticZh: '嗡 瓦₍吉₎啦达度 汪',
        meaningZh: '【大日如来金刚界心咒】智法身金刚界最胜一字真言。',
        meaningEn: 'Mahāvairocana Vajradhātu Heart Mantra.',
      },
      {
        iast: 'oṃ mune mune mahāmunaye svāhā',
        classicalTranslitZh: '唵 牟尼 牟尼 摩诃牟尼耶 娑嚩贺（释迦牟尼佛心咒）',
        modernPhoneticZh: '嗡 穆内 穆内 玛哈-穆拿耶 ₍斯₎瓦哈',
        meaningZh: '【本师释迦牟尼佛心咒】顶礼寂默能仁、大寂默世尊，净除多劫业障。',
        meaningEn: 'Śākyamuni Buddha Root Heart Mantra.',
      },
      {
        iast: 'oṃ amṛta teje hara hūṃ',
        classicalTranslitZh: '唵 阿蜜栗多 帝际 贺啰 吽（阿弥陀佛一字心咒）',
        modernPhoneticZh: '嗡 阿₍姆₎日达 帝杰 哈啦 吽',
        meaningZh: '【阿弥陀佛心咒】无量甘露威光摄受一切念佛众生，临终决定往生极乐世界。',
        meaningEn: 'Amitābha Buddha Heart Mantra.',
      },
      {
        iast: 'oṃ amarani jīvantīye svāhā',
        classicalTranslitZh: '唵 阿玛啰尼 祖弯帝耶 娑嚩贺（长寿佛心咒）',
        modernPhoneticZh: '嗡 阿玛啦尼 吉万帝耶 ₍斯₎瓦哈',
        meaningZh: '【无量寿佛（长寿佛）短心咒】勾招散失之寿元与四大精华，令得无死金刚长寿。',
        meaningEn: 'Amitāyus Buddha Short Longevity Mantra.',
      },
      {
        iast: 'namaḥ aṣṭāśītīnāṃ samyaksaṃbuddha koṭīnāṃ oṃ jñānāvabhāsa dhiri dhiri hūṃ',
        classicalTranslitZh: '曩谟 阿瑟吒始底南 三藐三没驮 俱胝南 唵 若那嚩婆娑 地哩地哩 吽（智炬如来破地狱咒）',
        modernPhoneticZh: '拿玛₍赫₎ 阿₍师₎达希帝南 萨₍姆₎呀₍克₎-桑布达 果蒂南 嗡 ₍吉尼₎亚拿瓦巴萨 地里 地里 吽',
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
        modernPhoneticZh: '嗡 孙巴 尼孙巴 吽 ₍格₎日₍赫₎拿 ₍格₎日₍赫₎拿 吽 ₍格₎日₍赫₎拿巴呀 吽 阿拿呀 霍₍赫₎ 巴嘎万 瓦₍吉₎啦 吽 帕₍特₎',
        meaningZh: '【东方降三世明王根本真言】降伏三界贪瞋痴与大自在天慢障，结界辟邪最胜明咒。',
        meaningEn: 'Trailokyavijaya Vidyārāja Root Mantra.',
      },
      {
        iast: 'oṃ amṛte hūṃ phaṭ',
        classicalTranslitZh: '唵 阿蜜栗帝 吽 发吒',
        modernPhoneticZh: '嗡 阿₍姆₎日帝 吽 帕₍特₎',
        meaningZh: '【南方军荼利明王（甘露军荼利）根本真言】以甘露净治一切障难与毒害，加持饮食与坛城。',
        meaningEn: 'Kuṇḍali Amṛta Vidyārāja Mantra.',
      },
      {
        iast: 'oṃ mahārāga vajroṣṇīṣa vajrasattva jaḥ hūṃ vaṃ hoḥ',
        classicalTranslitZh: '唵 摩诃啰誐 嚩日啰瑟抳洒 嚩日啰萨怛嚩 弱 吽 鑁 斛（爱染明王心咒）',
        modernPhoneticZh: '嗡 玛哈啦嘎 瓦₍吉₎洛₍师₎尼沙 瓦₍吉₎啦萨₍特₎瓦 佳₍赫₎ 吽 汪 霍₍赫₎',
        meaningZh: '【爱染明王根本心咒】出自《金刚峰楼阁一切瑜伽瑜祇经》，转染爱烦恼即证大菩提，怀爱人天、家庭和合。',
        meaningEn: 'Rāgarāja (Aizen Myōō) Heart Mantra.',
      },
      {
        iast: 'oṃ vajra mahākāla kṣiṃ kṣetra vighnān vināyaka hūṃ hūṃ phaṭ phaṭ svāhā',
        classicalTranslitZh: '唵 嚩日啰 摩诃迦攞 乞产 乞晒怛啰 尾觐南 毗那夜迦 吽吽 发吒发吒 娑嚩贺',
        modernPhoneticZh: '嗡 瓦₍吉₎啦 玛哈嘎啦 ₍克₎申 ₍克₎奢₍特₎啦 维₍格₎南 维拿呀嘎 吽 吽 帕₍特₎ 帕₍特₎ ₍斯₎瓦哈',
        meaningZh: '【六臂大黑天（玛哈嘎拉）根本心咒】观音化现大护法，守护正法行者，遣除一切刹土魔障与毗那夜迦障。',
        meaningEn: 'Six-Armed Vajra Mahākāla Protector Mantra.',
      },
      {
        iast: 'oṃ sarasvatyai svāhā',
        classicalTranslitZh: '唵 萨啰娑嚩底曳 娑嚩贺（大辩才天女/妙音佛母心咒）',
        modernPhoneticZh: '嗡 萨啦₍斯₎瓦₍蒂₎崖 ₍斯₎瓦哈',
        meaningZh: '【大辩才天女（妙音佛母）心咒】赐予无碍乐音、文章才华、艺术灵感与妙辩智慧。',
        meaningEn: 'Sarasvatī (Goddess of Eloquence, Music & Wisdom) Mantra.',
      },
      {
        iast: 'oṃ kumbhīra vajra mihira aṇḍīra anila śaṇḍilya indra pajra mahoraga sindūra catura vikala svāhā',
        classicalTranslitZh: '唵 宫毗罗 伐折罗 迷企罗 安底罗 頞你罗 珊底罗 因达罗 波夷罗 摩虎罗 真达罗 招杜罗 毗羯罗 娑嚩贺',
        modernPhoneticZh: '嗡 滚比啦 瓦₍吉₎啦 米嘿啦 安迪啦 阿尼啦 善迪₍勒₎呀 因₍德₎啦 巴₍吉₎啦 玛霍啦嘎 辛杜啦 佳度啦 维嘎啦 ₍斯₎瓦哈',
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
        modernPhoneticZh: '阿₍尼₎耶 玛₍尼₎耶 玛内 玛玛内 吉帝 佳里帝 沙美 沙米达维 善帝 穆₍克₎帝 穆₍克₎达达美 萨美 阿维沙美 萨玛萨美 佳耶 ₍克₎沙耶 阿₍克₎师内 善帝 萨米帝 达啦尼 阿洛嘎巴奢 ₍普₎啦₍蒂₎呀威₍克₎沙尼 尼地鲁 阿₍比₎延达啦尼维₍师₎帝 阿₍比₎延达啦巴里舒地 穆₍特₎古雷 阿啦叠 巴啦叠 苏刚₍克₎师 阿萨玛萨美 布达-维洛给帝 达₍尔₎玛-巴里₍克₎师帝 桑嘎-尼₍尔₎果沙尼 尼₍尔₎果沙尼 巴呀巴呀维硕达尼 曼₍特₎雷 曼₍特₎啦₍克₎沙呀帝 鲁帝 鲁达高沙₍勒₎耶 阿₍克₎沙耶 阿₍克₎沙呀瓦拿达耶 瓦古雷 瓦洛达 阿玛₍尼₎呀拿达耶 ₍斯₎瓦哈',
        meaningZh: '【妙法莲华经·陀罗尼品·药王菩萨咒】六十二亿恒河沙诸佛同宣，护持受持《法华经》法师不受一切恶魔鬼神侵扰。',
        meaningEn: 'Bhaiṣajyarāja Bodhisattva Dhāraṇī from Chapter 26 of the Lotus Sūtra (GRETIL bsu032_u.htm).',
      },
      {
        iast: 'a ra pa ca na la da ba ḍa ṣa va ta ya ṣṭa ka sa ma ga stha ja śva dha śa kha kṣa sta jña rtha bha cha sma hva tsa gha ṭha ṇa pha ska ysa śca ṭa ḍha',
        classicalTranslitZh: '阿 多 波 左 那 逻 柁 婆 茶 沙 嚩 多 耶 瑟吒 迦 娑 摩 伽 他 阇 室嚩 陀 奢 佉 叉 娑多 若 曷攞多 婆 车 娑摩 诃嚩 縒 伽 吒 拏 颇 娑迦 也娑 室左 侘 陀',
        modernPhoneticZh: '阿 啦 巴 佳 拿 啦 达 巴 达 沙 瓦 达 呀 ₍师₎达 嘎 萨 玛 嘎 ₍斯₎他 佳 ₍湿₎瓦 达 沙 卡 ₍克₎沙 ₍斯₎达 ₍吉尼₎亚 ₍尔₎他 巴 恰 ₍斯₎玛 ₍赫₎瓦 杂 嘎 他 拿 帕 ₍斯₎嘎 ₍伊₎萨 ₍希₎佳 达 达',
        meaningZh: '【华严经·入法界品·四十二字门陀罗尼】唱阿（a）字时入般若波罗蜜门，悟一切法本不生；四十二字统摄一切文字般若。',
        meaningEn: 'The Forty-Two Syllables Gate of Prajñāpāramitā from the Gaṇḍavyūha Sūtra.',
      },
      {
        iast: 'tadyathā padme padmadeve sadāmejinī rane raṇajite svāhā',
        classicalTranslitZh: '但界他 钵头摩 钵头摩提婆 萨陀迷支尼 啰泥 啰那支提 莎诃',
        modernPhoneticZh: '达₍地₎呀他 巴₍德₎美 巴₍德₎玛叠威 萨达美吉尼 啦内 啦拿吉帝 ₍斯₎瓦哈',
        meaningZh: '【入楞伽经·陀罗尼品真言】佛告大慧菩萨，受持此楞伽陀罗尼章句，一切外道天魔不能得便。',
        meaningEn: 'Dhāraṇī from Chapter 9 of the Laṅkāvatāra Sūtra (GRETIL bsu026_u.htm).',
      },
      {
        iast: 'oṃ āḥ guru vajradhara sumatikīrti siddhi hūṃ hūṃ',
        classicalTranslitZh: '嗡 阿 咕噜 班杂达拉 苏玛蒂 吉尔蒂 悉地 吽 吽（宗喀巴大师心咒 / 密集嘛）',
        modernPhoneticZh: '嗡 阿₍赫₎ 古鲁 瓦₍吉₎啦达啦 苏玛帝给₍尔₎帝 悉地 吽 吽',
        meaningZh: '【宗喀巴大师（善慧名称吉祥）祈请心咒】观音、文殊、金刚手三尊合一宗喀巴大师之智慧心咒（配合《密集嘛》祈请颂持诵）。',
        meaningEn: 'Heart Mantra of Je Tsongkhapa (Sumatikīrti).',
      },
    ],
  },
  // ==================== 12. 无上瑜伽续部（时轮金刚·密集·胜乐·喜金刚·大威德·作明佛母） ====================
  {
    id: 'anuttarayoga-tantra-root-mantras',
    titleZh: '无上瑜伽密续根本真言总集（时轮十相自在·密集·胜乐·喜金刚·作明佛母）',
    aliasesZh: '时轮金刚心咒,十相自在咒,密集金刚心咒,胜乐金刚心咒,喜金刚心咒,呼金刚咒,作明佛母心咒,咕噜咕列佛母心咒,金刚瑜伽母心咒,空行母心咒',
    titleSanskritIast: 'Anuttarayoga-Tantra-Mūla-Mantra-Saṃgraha',
    titleEnglish: 'Root Mantras of the Anuttarayoga Tantras (Kālacakra, Guhyasamāja, Cakrasaṃvara, Hevajra, Kurukullā)',
    categoryId: 'vidyarajas-protectors',
    taishoNo: 'T18n0885 / T18n0892 (SARIT & GRETIL 梵本无上续对勘)',
    translatorZh: '宋·施护 / 法贤 译 · 梵文无上续贝叶经（Kālacakra / Hevajra / Guhyasamāja）校勘',
    sutraSourceZh: '《吉祥时轮根本略续》《一切如来真实摄密集根本续》《吉祥喜金刚本续王》《圣多罗作明佛母续》',
    deityZh: '时轮金刚 · 密集金刚 · 胜乐轮金刚 · 喜金刚 · 咕噜咕列作明佛母 · 金刚亥母',
    meritsAndSummaryZh:
      '汇集印度晚期梵文无上瑜伽续（父续、母续、无二续）现存贝叶经原典核心真言：时轮金刚十相自在根本咒、密集金刚三金刚咒、胜乐轮黑鲁迦根本心咒、喜金刚心咒、金刚亥母（多罗三嗡咒）与作明佛母怀爱摄受心咒。',
    verses: [
      {
        iast: 'oṃ haṃ kṣa ma la va ra yaṃ svāhā',
        classicalTranslitZh: '唵 憾 叉 摩 攞 嚩 啰 焰 娑嚩贺（时轮金刚十相自在根本心咒）',
        meaningZh: '【时轮金刚（Kālacakra）十相自在根本心咒】统摄外内别三时轮与地水火风空识智七界圆满坛城。',
        meaningEn: 'Kālacakra Ten-Fold Powerful Syllable Mantra (Daśākṣarī) from the Vimalaprabhā.',
      },
      {
        iast: 'oṃ āḥ vajradhṛk hūṃ hūṃ',
        classicalTranslitZh: '唵 阿 嚩日啰特哩克 吽 吽（密集金刚根本心咒）',
        meaningZh: '【密集金刚（Guhyasamāja Akṣobhyavajra）根本心咒】父续之王《密集根本续》执持五智金刚心印。',
        meaningEn: 'Root Mantra of Guhyasamāja Akṣobhyavajra (Guhyasamājatantra).',
      },
      {
        iast: 'oṃ śrī vajra he he ru ru kaṃ huṃ hūṃ phaṭ ḍākinījālasaṃvaraṃ svāhā',
        classicalTranslitZh: '唵 室哩 嚩日啰 醯醯 噜噜 剑 吽 吽 泮吒 荼吉尼惹攞三嚩啰 娑嚩贺',
        meaningZh: '【胜乐金刚（Cakrasaṃvara Heruka）根本心咒】母续之王胜乐轮黑鲁迦空行网大乐总摄心咒。',
        meaningEn: 'Root Mantra of Śrī Cakrasaṃvara Heruka (Laghusaṃvaratantra).',
      },
      {
        iast: 'oṃ deva picu vajra hūṃ hūṃ hūṃ phaṭ svāhā',
        classicalTranslitZh: '唵 提嚩 必祖 嚩日啰 吽 吽 吽 泮吒 娑嚩贺（《佛说大悲空智金刚大教王经》卷二）',
        meaningZh: '【喜金刚（Hevajra / 呼金刚）八字根本心咒】《喜金刚本续王》悲智双运摧破四魔根本真言。',
        meaningEn: 'Root Heart Mantra of Śrī Hevajra (Hevajratantra I.2).',
      },
      {
        iast: 'oṃ oṃ oṃ sarvabuddhaḍākinīye vajravarṇanīye vajravairocanīye hūṃ hūṃ hūṃ phaṭ phaṭ phaṭ svāhā',
        classicalTranslitZh: '唵 唵 唵 萨嚩没驮荼吉尼曳 嚩日啰嚩啰拏尼曳 嚩日啰吠路左尼曳 吽吽吽 泮吒泮吒泮吒 娑嚩贺',
        meaningZh: '【金刚瑜伽母 / 金刚亥母「三嗡咒」根本真言】诸佛空行母、金刚严饰母、金刚遍照母三身空乐智慧总持。',
        meaningEn: 'Three-Oṃ Mantra of Vajrayoginī / Vajravārāhī (Sarvabuddhaḍākinī).',
      },
      {
        iast: 'oṃ kurukulle hrīḥ svāhā',
        classicalTranslitZh: '唵 俱噜俱梨 纥哩 娑嚩贺（作明佛母 / 咕噜咕列佛母根本心咒）',
        meaningZh: '【作明佛母（Kurukullā / 咕噜咕列佛母）心咒】怀柔六道众生、圆满善缘人缘与智慧威德之红度母真言。',
        meaningEn: 'Heart Mantra of Goddess Kurukullā (Kalpokta-Kurukullā-Sādhana).',
      },
    ],
  },
  // ==================== 13. 四吠陀本集根本圣咒 · 伽耶特黎咒与太阳神赞 ====================
  {
    id: 'rgveda-gayatri-savitr-mantras',
    titleZh: '《梨俱吠陀》根本圣咒 · 娑维特里伽耶特黎咒（Gāyatrī）与吠陀晨祷总集',
    aliasesZh: '伽耶特黎咒,吠陀之母,太阳神咒,萨维特里真言,梨俱吠陀开篇阿耆尼赞,同心同德咒,Gayatri Mantra,Savitri Mantra,Rigveda',
    titleSanskritIast: 'Ṛgveda-Sāvitrī-Gāyatrī-Saṃjñāna-Mantra',
    titleEnglish: 'The Vedic Gāyatrī Mantra (Ṛgveda 3.62.10), Agni Opening & Saṃjñāna Unity Mantras',
    categoryId: 'vedic-tantra-siddhanta',
    taishoNo: 'Ṛgveda 3.62.10 / 1.1.1 / 10.191 (GRETIL rv_au_u.htm)',
    translatorZh: '众友仙人（Viśvāmitra Ṛṣi）等古吠陀圣仙 传诵 · Aufrecht / van Nooten 校勘本',
    sutraSourceZh: '《梨俱吠陀本集（Ṛgveda-Saṃhitā）》第 3 卷 62 首 10 颂、第 1 卷 1 首、第 10 卷 191 首',
    deityZh: '太阳创造神娑维特里 (Savitar) · 圣火阿耆尼 (Agni)',
    meritsAndSummaryZh:
      '人类现存最古老梵文圣典《梨俱吠陀》之最高核心真言。伽耶特黎咒（Gāyatrī Mantra）被尊为「一切吠陀之母（Vedamātā）」，含三界大宣说词（Mahāvyāhṛti: oṃ bhūr bhuvaḥ svaḥ）与二十四音节娑维特里光明祈请文，启迪无上觉性智慧；并收录《梨俱吠陀》第一颂圣火赞及全本压卷之《同心和合颂》。',
    verses: [
      {
        iast: 'oṃ bhūr bhuvaḥ svaḥ | tat savitur vareṇyaṃ bhargo devasya dhīmahi | dhiyo yo naḥ pracodayāt',
        classicalTranslitZh: '唵 婆卢 婆嚩 娑嚩 | 怛 萨尾睹哩 嚩隶尼也 婆啰伽 提嚩写 提摩醯 | 提瑜 瑜 那 钵啰祖那夜',
        meaningZh: '【吠陀之母·伽耶特黎根本圣咒（Ṛgveda 3.62.10）】嗡！遍满地界、空界、天界！我等至心禅思彼太阳创造神娑维特里最胜崇高之神圣净光，愿彼圣光启发并引导我等之灵性智慧！',
        meaningEn: 'Oṃ Bhūr Bhuvaḥ Svaḥ! We meditate upon that supreme, adorable effulgence of the divine Vivifier Savitar; may He illuminate and inspire our intellects! (Ṛgveda 3.62.10)',
      },
      {
        iast: 'agnim īḷe purohitaṃ yajñasya devam ṛtvijam | hotāraṃ ratnadhātamam',
        classicalTranslitZh: '阿耆尼 伊礼 补噜醯多 夜若写 提嚩 讫哩得尾瞻 | 呼多蓝 啰怛那陀多摩',
        meaningZh: '【《梨俱吠陀》全书开篇第一颂（Ṛgveda 1.1.1）】我礼赞圣火阿耆尼——祭礼之首座导师、神圣之主祭司、召请诸神且最富妙宝之施主！',
        meaningEn: 'I praise Agni, the household priest, the divine minister of the sacrifice, the invoker who bestows supreme treasures. (Ṛgveda 1.1.1)',
      },
      {
        iast: 'viśvāni deva savitar duritāni parāsuva | yad bhadraṃ tan na āsuva',
        classicalTranslitZh: '尾室嚩尼 提嚩 萨尾怛 度哩多尼 波啰苏嚩 | 也 跋捺蓝 怛 那 阿苏嚩',
        meaningZh: '【《白夜柔吠陀》娑维特里净障祈福咒（VS 30.3 / RV 5.82.5）】神圣太阳神娑维特里啊！愿你遣除我等一切恶业与灾障；凡属吉祥善妙者，悉愿赐予我等！',
        meaningEn: 'O Divine Savitar, drive away all afflictions and evil; bestow upon us whatever is auspicious and good! (Śukla-Yajurveda 30.3 / Ṛgveda 5.82.5)',
      },
      {
        iast: 'saṃ gacchadhvaṃ saṃ vadadhvaṃ saṃ vo manāṃsi jānatām | samāno mantraḥ samitiḥ samānī samānaṃ manaḥ saha cittam eṣām',
        classicalTranslitZh: '三 伽车特嚩 三 嚩那特嚩 三 嚩 摩难悉 惹那担 | 三摩奴 曼怛啰 三弥底 三摩尼 三摩南 摩那 萨诃 质多 翳衫',
        meaningZh: '【《梨俱吠陀》压卷之《同心和合真言》（Ṛgveda 10.191.2–3）】愿尔等偕行共进，和合共语，心意相通如一！同持真言，同聚圣会，心志合一，慧念融通！',
        meaningEn: 'Walk together in harmony, speak together in harmony, let your minds know unity; united be your mantra, united your assembly, united your mind and consciousness! (Ṛgveda 10.191.2–3)',
      },
    ],
  },
  // ==================== 14. 梨俱吠陀与夜柔吠陀 · 大胜死咒（Mahāmṛtyuñjaya）与楼陀罗圣咒 ====================
  {
    id: 'rgveda-mahamrtyunjaya-rudra-mantras',
    titleZh: '《梨俱吠陀》大胜死咒（Mahāmṛtyuñjaya 三目尊长寿解脱真言）与《夜柔吠陀》楼陀罗圣赞',
    aliasesZh: '大胜死咒,三目湿婆长寿咒,摩诃木提云佳亚咒,超越死亡真言,楼陀罗伽耶特黎咒,Mahamrityunjaya Mantra,Tryambakam Mantra,Sri Rudram',
    titleSanskritIast: 'Mahāmṛtyuñjaya-Tryambaka-Śrī-Rudra-Mantra',
    titleEnglish: 'The Great Death-Conquering Mantra (Ṛgveda 7.59.12) & Śrī Rudram Invocations',
    categoryId: 'vedic-tantra-siddhanta',
    taishoNo: 'Ṛgveda 7.59.12 / Taittirīya Saṃhitā 4.5 (GRETIL rv_au_u / ts_u)',
    translatorZh: '婆私吒仙人（Vasiṣṭha Ṛṣi）传诵 · 黑夜柔吠陀《Śrī Rudram》对勘',
    sutraSourceZh: '《梨俱吠陀》第 7 卷 59 首 12 颂 ·《黑夜柔吠陀·泰帝利耶本集》4.5《Śrī Rudram》',
    deityZh: '三目尊湿婆 · 甘露胜死尊 (Tryambaka Rudra-Śiva)',
    meritsAndSummaryZh:
      '印度与伽耶特黎咒并列之两大最高吠陀圣咒之一。出自《梨俱吠陀》7.59.12，礼敬三目慈尊（Tryambaka），喻如熟瓜自然脱离藤蔓之束缚，祈愿众生远离疾病横死、证入不死甘露解脱。',
    verses: [
      {
        iast: 'tryambakaṃ yajāmahe sugandhiṃ puṣṭivardhanam | urvārukam iva bandhanān mṛtyor mukṣīya māmṛtāt',
        classicalTranslitZh: '怛哩焰婆剑 也惹摩醯 苏健廷 补瑟置嚩啰陀南 | 乌啰嚩噜剑 伊嚩 盘陀难 蜜栗底瑜 目吃史也 摩蜜栗多',
        meaningZh: '【《梨俱吠陀》7.59.12 大胜死咒原典本颂】我等虔诚礼敬三目圣尊——芬芳遍满、增益生命福德滋养者！愿我如成熟甜瓜自然脱离瓜藤般，从死亡束缚中解脱，而永不远离不死甘露自性！',
        meaningEn: 'We worship the Three-Eyed One (Tryambaka), fragrant and nourishing all beings; like a ripe cucumber effortlessly released from its stem, may I be liberated from death, never from immortality! (Ṛgveda 7.59.12)',
      },
      {
        iast: 'oṃ hrauṃ jūṃ saḥ | oṃ bhūr bhuvaḥ svaḥ | tryambakaṃ yajāmahe sugandhiṃ puṣṭivardhanam | urvārukam iva bandhanān mṛtyor mukṣīya māmṛtāt | oṃ svaḥ bhuvaḥ bhūḥ | oṃ saḥ jūṃ hrauṃ oṃ',
        classicalTranslitZh: '唵 诃哢 戎 萨 | 唵 婆卢 婆嚩 娑嚩 | 怛哩焰婆剑 也惹摩醯... | 唵 萨 戎 诃哢 唵',
        meaningZh: '【坦陀罗甘露护身全轨·包裹种子字大胜死全咒（Saṃpuṭita Mahāmṛtyuñjaya）】前后以甘露长寿种子字「oṃ hrauṃ jūṃ saḥ」及三界大宣说词双向结界护持，专用于疗愈重疾、延寿消灾。',
        meaningEn: 'Full Tantric Encased (Saṃpuṭita) Mahāmṛtyuñjaya Mantra with the immortalizing bīja-cluster Oṃ Hrauṃ Jūṃ Saḥ.',
      },
      {
        iast: 'namas te astu bhagavan viśveśvarāya mahādevāya tryambakāya tripurāntakāya trikālāgnikālāya kālāgnirudrāya nīlakaṇṭhāya mṛtyuñjayāya sarveśvarāya sadāśivāya śrīmanmahādevāya namaḥ',
        classicalTranslitZh: '曩莫 娑帝 阿娑睹 婆誐梵 尾室吠室嚩啰也 摩诃提嚩也 怛哩焰婆迦也... 尼攞建侘也 蜜栗底匀惹也也 萨嚩伊室嚩啰也 萨陀尸嚩也 曩莫',
        meaningZh: '【《夜柔吠陀·Śrī Rudram》十一尊号顶礼总咒】顶礼世尊、宇宙之主、大天、三目尊、破三城尊、三时劫火尊、青颈尊、胜死尊、一切自在尊、常住吉祥湿婆大天！',
        meaningEn: 'Śrī Rudram / Namakam Eleven-Epithet Salutation to Viśveśvara, Mahādeva, Tryambaka, Nīlakaṇṭha, Mṛtyuñjaya, and Sadāśiva.',
      },
      {
        iast: 'oṃ tatpuruṣāya vidmahe mahādevāya dhīmahi | tan no rudraḥ pracodayāt',
        classicalTranslitZh: '唵 怛补噜沙也 尾捺摩醯 摩诃提嚩也 提摩醯 | 怛 奴 噜捺啰 钵啰祖那夜',
        meaningZh: '【楼陀罗伽耶特黎咒（Rudra Gāyatrī ·《泰帝利耶森林书》10.1）】嗡！我等证知彼至高原人，禅思大天湿婆；愿楼陀罗尊启发我等之灵明觉性！',
        meaningEn: 'Rudra Gāyatrī Mantra from Taittirīya Āraṇyaka 10.1 (Mahānārāyaṇa Upaniṣad).',
      },
    ],
  },
  // ==================== 15. 十三大奥义书 · 吉祥和平咒（Śānti-Mantra）与四大梵我格言 ====================
  {
    id: 'upanisad-santi-mahavakya-mantras',
    titleZh: '十三大《奥义书（Upaniṣad）》吉祥和平咒（Śānti-Mantra）与四大梵我格言全集',
    aliasesZh: '奥义书和平咒,帕瓦玛纳咒,导我向真实咒,圆满咒,师生共修和平咒,四大格言,梵我一如真言,Pavamana Mantra,Asato Ma Sad Gamaya,Purnam Adah,Saha Nav Avatu,Shanti Mantra',
    titleSanskritIast: 'Upaniṣad-Pañca-Śānti-Mantra-Mahāvākya-Saṃgraha',
    titleEnglish: 'Upaniṣadic Peace Mantras (Śānti-Pāṭha: Pavamāna, Pūrṇam Adaḥ, Saha Nāv Avatu) & Four Mahāvākyas',
    categoryId: 'vedic-tantra-siddhanta',
    taishoNo: 'Bṛhadāraṇyaka / Īśā / Taittirīya / Kaṭha / Muṇḍaka / Chāndogya (GRETIL upanisad)',
    translatorZh: '古印度森林哲人仙人 传授 · Olivelle / Limaye-Vadekar 梵本奥义书校勘',
    sutraSourceZh: '《广林奥义书》《伊沙奥义书》《泰帝利耶奥义书》《卡塔奥义书》《蒙达卡奥义书》《歌者奥义书》',
    deityZh: '最高梵 (Parabrahman) · 内在真我 (Ātman)',
    meritsAndSummaryZh:
      '完整汇集印度吠檀多哲学源头《十三大奥义书》开篇与结诵必诵之五大吉祥和平咒（Śānti-Pāṭha）——净心升华咒（Asato mā sad gamaya）、圆满自性咒（Pūrṇam adaḥ）、师徒同修护佑咒（Saha nāv avatu）、诸天吉祥祈愿咒（Śaṃ no mitraḥ / Bhadraṃ karṇebhiḥ），以及四部吠陀各自凝练之四大究竟格言（Mahāvākya）。',
    verses: [
      {
        iast: 'oṃ asato mā sad gamaya | tamaso mā jyotir gamaya | mṛtyor mā amṛtaṃ gamaya | oṃ śāntiḥ śāntiḥ śāntiḥ',
        classicalTranslitZh: '唵 阿萨睹 摩 萨 伽摩也 | 多摩苏 摩 殊底 伽摩也 | 蜜栗底瑜 摩 阿蜜栗多 伽摩也 | 唵 扇底 扇底 扇底',
        meaningZh: '【《广林奥义书》1.3.28 净心升华圣咒（Pavamāna Mantra）】嗡！祈导我从虚妄走向真实，导我从黑暗走向光明，导我从死亡走向不死甘露！嗡，寂静、寂静、寂静（息灭天灾、外患、内惑三重苦厄）！',
        meaningEn: 'Oṃ! Lead me from the unreal to the Real; lead me from darkness to Light; lead me from death to Immortality! Oṃ Peace, Peace, Peace! (Bṛhadāraṇyaka Upaniṣad 1.3.28)',
      },
      {
        iast: 'oṃ pūrṇam adaḥ pūrṇam idaṃ pūrṇāt pūrṇam udacyate | pūrṇasya pūrṇam ādāya pūrṇam evāvaśiṣyate | oṃ śāntiḥ śāntiḥ śāntiḥ',
        classicalTranslitZh: '唵 补啰拏 阿那 补啰拏 伊南 补啰拏 补啰拏 乌那遮帝 | 补啰拏写 补啰拏 阿陀也 补啰拏 翳嚩嚩尸沙帝 | 唵 扇底 扇底 扇底',
        meaningZh: '【《伊沙奥义书》暨《广林奥义书》5.1.1 圆满不二和平咒】嗡！彼（超越界）是圆满，此（显现界）亦是圆满；由圆满中生起圆满；即便从圆满中取走圆满，所余依然纯粹圆满！嗡，寂静、寂静、寂静！',
        meaningEn: 'Oṃ! That is Full; this is Full; from Fullness, Fullness arises. When Fullness is taken from Fullness, Fullness alone remains! Oṃ Peace, Peace, Peace! (Īśā / Bṛhadāraṇyaka 5.1.1)',
      },
      {
        iast: 'oṃ saha nāv avatu | saha nau bhunaktu | saha vīryaṃ karavāvahai | tejasvi nāv adhītam astu mā vidviṣāvahai | oṃ śāntiḥ śāntiḥ śāntiḥ',
        classicalTranslitZh: '唵 萨诃 脑 阿嚩睹 | 萨诃 脑 婆那讫睹 | 萨诃 尾哩也 迦啰嚩嚩海 | 帝惹娑尾 脑 阿提多 阿娑睹 摩 尾捺尾沙嚩海 | 唵 扇底 扇底 扇底',
        meaningZh: '【《卡塔奥义书》暨《泰帝利耶奥义书》师生共修和平咒】嗡！愿圣道同护我师徒二人，同赐资养，同发勇猛精进；愿我等所学光明辉煌，永不生丝毫乖违嗔嫌！嗡，寂静、寂静、寂静！',
        meaningEn: 'Oṃ! May It protect us both together; may It nourish us both; may we work together with great vigor; may our study be luminous and effective; may we never harbor animosity! (Taittirīya / Kaṭha Śānti-pāṭha)',
      },
      {
        iast: 'oṃ bhadraṃ karṇebhiḥ śṛṇuyāma devāḥ | bhadraṃ paśyemākṣabhir yajatrāḥ | sthirair aṅgais tuṣṭuvāṃsas tanūbhir vyaśema devahitaṃ yad āyuḥ | oṃ śāntiḥ śāntiḥ śāntiḥ',
        classicalTranslitZh: '唵 跋捺蓝 羯尼毗 室哩努夜摩 提嚩 | 跋捺蓝 钵尸摩叉毗 也惹怛啰... | 唵 扇底 扇底 扇底',
        meaningZh: '【《蒙达卡奥义书》暨《蛙氏奥义书》吉祥听闻和平咒】嗡！诸天圣众啊，愿我等双耳唯闻吉祥正音，双目唯见善妙瑞相；肢体康健赞咏圣德，圆满享有天赐慧命！嗡，寂静、寂静、寂静！',
        meaningEn: 'Oṃ! O Gods, may we hear with our ears what is auspicious; O Worshipful Ones, may we see with our eyes what is auspicious; with firm limbs may we enjoy our divinely allotted life! (Ṛgveda 1.89.8 / Muṇḍaka Śānti)',
      },
      {
        iast: 'oṃ śaṃ no mitraḥ śaṃ varuṇaḥ | śaṃ no bhavatv aryamā | śaṃ na indro bṛhaspatiḥ | śaṃ no viṣṇur urukramaḥ | namo brahmaṇe | namas te vāyo | tvam eva pratyakṣaṃ brahmāsi',
        classicalTranslitZh: '唵 苫 奴 弥怛啰 苫 嚩噜拏 | 苫 奴 婆嚩睹 阿哩也摩 | 苫 那 因捺噜 毗哩诃娑钵底 | 苫 奴 尾瑟努 乌噜讫啰摩 | 曩莫 婆啰憾摩尼',
        meaningZh: '【《泰帝利耶奥义书》1.1 开篇诸天吉祥祝祷咒】嗡！愿密多罗赐吉祥，伐楼拿赐吉祥，阿梨耶磨赐吉祥，因陀罗与祭主仙赐吉祥，广步毗湿奴赐吉祥！顶礼大梵，顶礼生命气息之神，你即是现前可证之梵！',
        meaningEn: 'Oṃ! May Mitra be propitious to us, may Varuṇa be propitious, may Aryaman, Indra, Bṛhaspati, and wide-striding Viṣṇu be propitious! Homage to Brahman! (Taittirīya Upaniṣad 1.1)',
      },
      {
        iast: 'prajñānaṃ brahma | ahaṃ brahmāsmi | tat tvam asi | ayam ātmā brahma | satyaṃ jñānam anantaṃ brahma',
        classicalTranslitZh: '钵啰若南 婆啰憾摩 | 阿憾 婆啰憾摩娑弥 | 怛 得嚩 阿悉 | 阿阎 阿怛摩 婆啰憾摩 | 萨底也 若南 阿难多 婆啰憾摩',
        meaningZh: '【四吠陀四大究竟格言（Mahāvākyāni）】般若灵知即是梵（梨俱·爱达罗氏）；我即是梵（夜柔·广林）；汝即是彼（娑摩·歌者）；此真我即是梵（阿闼婆·蛙氏）；真实、明觉、无限即是梵（泰帝利耶）！',
        meaningEn: 'The Four Great Upaniṣadic Mahāvākyas: Consciousness is Brahman (Aitareya 3.3); I am Brahman (Bṛhadāraṇyaka 1.4.10); That Thou Art (Chāndogya 6.8.7); This Self is Brahman (Māṇḍūkya 2).',
      },
    ],
  },
  // ==================== 16. 象头神脑顶奥义书（Gaṇapati Atharvaśīrṣa） ====================
  {
    id: 'ganapati-atharvasirsa-mantras',
    titleZh: '《象头神脑顶奥义书》伽那钵底（大圣欢喜天/象头财神）根本真言全集',
    aliasesZh: '象头神心咒,伽那钵底真言,除障神咒,象头财神咒,大圣欢喜天梵咒,Ganesh Mantra,Om Gam Ganapataye Namah,Vakratunda Mahakaya,Ganapati Atharvasirsa',
    titleSanskritIast: 'Śrī-Gaṇapati-Atharvaśīrṣa-Mūla-Mantra',
    titleEnglish: 'Sacred Mantras of Śrī Gaṇeśa (Gaṇapati Atharvaśīrṣa Upaniṣad & Vakratuṇḍa Stotra)',
    categoryId: 'vedic-tantra-siddhanta',
    taishoNo: 'Gaṇapati Atharvaśīrṣa Upaniṣad / Mudgala Purāṇa (GRETIL)',
    translatorZh: '阿闼婆仙人（Atharvan Ṛṣi）传诵 · 汉传参校唐·不空译《大圣欢喜双身毗那夜迦法》',
    sutraSourceZh: '《阿闼婆吠陀·象头神脑顶奥义书（Gaṇapatyatharvaśīrṣopaniṣad）》',
    deityZh: '群主象头神 · 毗那夜迦除障尊 (Śrī Mahāgaṇapati / Gaṇeśa)',
    meritsAndSummaryZh:
      '印度一切修法、庆典、经典开篇最先礼敬之除障与智慧之神伽那钵底（Gaṇapati，佛教尊为毗那夜迦/大圣欢喜天）之根本梵咒。完整收录一字种子根本咒、象头神伽耶特黎咒、千万日光曲鼻除障颂及《象头神脑顶奥义书》核心赞真言。',
    verses: [
      {
        iast: 'oṃ śrī gaṇeśāya namaḥ | oṃ gaṃ gaṇapataye namaḥ',
        classicalTranslitZh: '唵 室哩 誐尼舍也 曩莫 | 唵 颔 誐拏钵底曳 曩莫',
        meaningZh: '【象头神根本种子心咒（Gaṇapati Mūla-Mantra）】嗡！顶礼吉祥群主尊！嗡，颔（gaṃ 除障种子音），顶礼一切圣众之主伽那钵底！',
        meaningEn: 'Oṃ! Homage to auspicious Śrī Gaṇeśa! Oṃ Gaṃ, homage to Lord Gaṇapati! (Gaṇapati Atharvaśīrṣa 7)',
      },
      {
        iast: 'vakratuṇḍa mahākāya sūryakoṭisamaprabha | nirvighnaṃ kuru me deva sarvakāryeṣu sarvadā',
        classicalTranslitZh: '嚩讫啰顿拏 摩诃迦也 苏哩也俱胝三摩钵啰婆 | 尼啰尾伽南 俱噜 弥 提嚩 萨嚩迦哩曳数 萨嚩陀',
        meaningZh: '【曲鼻大身千万日光明除障祈请咒】具妙曲象鼻、巍峨大身、光明犹如千万太阳之天尊啊！祈愿恒时于我一切善业修持中，净除一切违缘障碍！',
        meaningEn: 'O Lord with the curved trunk and mighty form, whose splendor equals ten million suns, make all my undertakings ever free of obstacles! (Traditional Opening Prārthanā)',
      },
      {
        iast: 'oṃ ekadantāya vidmahe vakratuṇḍāya dhīmahi | tan no dantiḥ pracodayāt',
        classicalTranslitZh: '唵 翳迦难多也 尾捺摩醯 嚩讫啰顿拏也 提摩醯 | 怛 奴 难底 钵啰祖那夜',
        meaningZh: '【《象头神脑顶奥义书》第8节 · 象头神伽耶特黎咒（Gaṇeśa Gāyatrī）】嗡！我等证知独牙一相尊，禅思曲鼻除障尊；愿象牙圣尊启发我等之无碍智慧！',
        meaningEn: 'Gaṇeśa Gāyatrī Mantra: Oṃ! We know the Single-Tusked One, we meditate upon the Curved-Trunked One; may that Tusked Lord inspire us! (Gaṇapati Atharvaśīrṣa 8)',
      },
      {
        iast: 'oṃ namas te gaṇapataye | tvam eva pratyakṣaṃ tattvam asi | tvam eva kevalaṃ kartāsi | tvam eva kevalaṃ dhartāsi | tvam eva kevalaṃ hartāsi | tvam eva sarvaṃ khalv idaṃ brahmāsi',
        classicalTranslitZh: '唵 曩莫 娑帝 誐拏钵底曳 | 得嚩 翳嚩 钵啰底也叉 怛得嚩 阿悉... 得嚩 翳嚩 萨嚩 佉卢 伊南 婆啰憾摩悉',
        meaningZh: '【《象头神脑顶奥义书》开篇真谛宣说文】嗡，顶礼伽那钵底！你即是现量真如实相，唯你是创造者，唯你是任持者，唯你是收摄者，你实即是此宇宙万有一切大梵！',
        meaningEn: 'Opening invocation of the Gaṇapati Atharvaśīrṣa Upaniṣad (1–2): Homage to Gaṇapati! Thou alone art the manifest Truth, Creator, Sustainer, Dissolver, and verily all this Brahman!',
      },
    ],
  },
  // ==================== 17. 湿婆阿笈摩与克什米尔三元论（Śaiva Āgama & Kashmir Trika） ====================
  {
    id: 'saiva-agama-trika-mantras',
    titleZh: '湿婆阿笈摩与克什米尔三元论圣咒总集（五字大明·净眼续甘露咒·樟脑白颂·天鹅呼吸咒）',
    aliasesZh: '湿婆五字真言,湿婆六字心咒,嗡拿玛希瓦亚,净眼密续胜死咒,樟脑白悲心化身颂,商羯罗湿婆五字赞,克什米尔湿婆派真言,Om Namah Shivaya,Panchakshara Mantra,Karpuragauram,So Ham',
    titleSanskritIast: 'Śaiva-Āgama-Pañcākṣara-Netratantra-Trika-Mantra',
    titleEnglish: 'Śaiva Āgama & Kashmir Trika Mantras (Pañcākṣara, Netratantra Mṛtyuñjaya, Karpūragauraṃ & Haṃsa)',
    categoryId: 'vedic-tantra-siddhanta',
    taishoNo: 'TS 4.5.8 / Netratantra 7 / Vijñānabhairava (GRETIL saiva)',
    translatorZh: '《夜柔吠陀》与克什米尔《净眼续》《识怖畏续》阿阇梨 传授 · 商羯罗大师 赞颂',
    sutraSourceZh: '《泰帝利耶本集》4.5.8 · 克什米尔《净眼密续（Netratantra）》·《识怖畏续（Vijñānabhairava）》',
    deityZh: '大自在天湿婆 · 甘露主尊 (Sadāśiva / Amṛteśvara / Parameśvara)',
    meritsAndSummaryZh:
      '完整收录印度湿婆派（Śaivism）与克什米尔非二元三元论（Trika）原典真言：出自《夜柔吠陀》正中心之湿婆五字/六字根本真言（Pañcākṣara）、克什米尔《净眼密续》三字甘露胜死咒（Oṃ Juṃ Saḥ）、家喻户晓之《樟脑白大悲化身赞》、商羯罗《湿婆五字赞》首颂以及自然呼吸观修之《天鹅梵我真言（Haṃsa So\'ham）》。',
    verses: [
      {
        iast: 'namaḥ śivāya | oṃ namaḥ śivāya | śivāya nama oṃ',
        classicalTranslitZh: '曩莫 尸嚩也 | 唵 曩莫 尸嚩也 | 尸嚩也 曩莫 唵（湿婆五字/六字根本大明咒）',
        meaningZh: '【湿婆五字真言（Pañcākṣara）与六字心咒（Ṣaḍakṣara）】顶礼吉祥寂静大自在尊湿婆！na-maḥ-śi-vā-ya 五音节统摄地水火风空五大元素与纯净觉识。',
        meaningEn: 'The Five-Syllable (Pañcākṣara, Yajurveda TS 4.5.8) and Six-Syllable (Ṣaḍakṣara) Root Mantra of Lord Śiva.',
      },
      {
        iast: 'oṃ juṃ saḥ | oṃ hrauṃ juṃ saḥ amṛteśvarāya mṛtyuñjayāya svāhā',
        classicalTranslitZh: '唵 戎 萨 | 唵 诃哢 戎 萨 阿蜜栗帝室嚩啰也 蜜栗底匀惹也也 娑嚩贺',
        meaningZh: '【克什米尔《净眼密续（Netratantra）》三字甘露胜死心王咒】《净眼续》核心甘露主尊（Amṛteśvara）三字真言「oṃ juṃ saḥ」，灌注生命甘露、超越老病死苦。',
        meaningEn: 'The Three-Syllable Netra-Mṛtyuñjaya Mantra (Oṃ Juṃ Saḥ) of Amṛteśvara Bhairava from the Kashmirian Netratantra.',
      },
      {
        iast: 'karpūragauraṃ karuṇāvatāraṃ saṃsārasāraṃ bhujagendrahāram | sadā vasantaṃ hṛdayāravinde bhavaṃ bhavānīsahitaṃ namāmi',
        classicalTranslitZh: '羯补啰高蓝 迦噜拏嚩多蓝 三娑啰娑蓝 婆惹健捺啰诃蓝 | 萨陀 嚩散多 纥哩那也啰尾泥 婆嚩 婆嚩尼萨醯多 曩摩弥',
        meaningZh: '【《樟脑白大悲化身颂（Karpūragauraṃ）》】皎洁如纯白樟脑、大悲之化身、轮回之真实精髓、以龙王为璎珞，恒常安住于心莲之中——我顶礼偕同帕尔瓦蒂圣母之湿婆世尊！',
        meaningEn: 'Pure white like camphor, the incarnation of compassion, the essence of existence, garlanded with the serpent-king, ever dwelling in the lotus of the heart—I bow to Bhava together with Bhavānī!',
      },
      {
        iast: 'nāgendrahārāya trilocanāya bhasmāṅgarāgāya maheśvarāya | nityāya śuddhāya digambarāya tasmai nakārāya namaḥ śivāya',
        classicalTranslitZh: '那健捺啰诃啰也 怛哩路遮那也 婆娑莽伽啰伽也 摩醯室嚩啰也 | 尼底也也 戍陀也 地甘婆啰也 怛娑迈 那迦啰也 曩莫 尸嚩也',
        meaningZh: '【商羯罗《湿婆五字赞（Śivapañcākṣarastotra）》首颂】佩龙王璎珞者、具三慧眼者、圣灰涂身者、大自在主、常住清净以十方虚空为衣者——礼敬彼「na」字表征之湿婆尊！',
        meaningEn: 'First verse of Ādi Śaṅkara’s Śivapañcākṣarastotra honoring the syllable Na of Namaḥ Śivāya.',
      },
      {
        iast: "so 'ham | haṃsaḥ śivo 'ham | cidanandarūpaḥ śivo 'ham śivo 'ham",
        classicalTranslitZh: '苏 憾 | 憾萨 尸嚩 憾 | 质陀难陀噜波 尸嚩 憾 尸嚩 憾',
        meaningZh: '【《识怖畏续》天鹅自然呼吸真言暨商羯罗《涅槃六颂》心印】吸气「so（彼）」、呼气「ham（我）」自然成天鹅真言（Haṃsa）；纯知妙乐自性，我即是吉祥觉性湿婆！',
        meaningEn: 'Ajapā-Gāyatrī Breath Mantra (So ’ham / Haṃsaḥ, Vijñānabhairava 24 & 156) and Śaṅkara’s Nirvāṇaṣaṭkam refrain (Cidānandarūpaḥ Śivo ’ham).',
      },
    ],
  },
  // ==================== 18. 毗湿奴派五夜教、薄伽梵往世书与摩诃真言 ====================
  {
    id: 'vaisnava-pancaratra-rama-krsna-mantras',
    titleZh: '毗湿奴派圣咒总集（那罗延八字咒·婆苏提婆十二字咒·妙见神轮大咒·罗摩与哈瑞奎师那大咒）',
    aliasesZh: '那罗延八字真言,婆苏提婆十二字真言,薄伽梵往世书真言,毗湿奴禅定颂,妙翅善见神轮咒,罗摩渡海真言,哈瑞奎师那摩诃曼陀罗,Om Namo Narayanaya,Om Namo Bhagavate Vasudevaya,Hare Krishna Mahamantra,Sudarshana Mantra',
    titleSanskritIast: 'Vaiṣṇava-Aṣṭākṣara-Dvādaśākṣara-Mahāmantra-Saṃgraha',
    titleEnglish: 'Vaiṣṇava Sacred Mantras (Aṣṭākṣara, Dvādaśākṣara, Śāntākāraṃ, Sudarśana, Rāma Tāraka & Hare Kṛṣṇa Mahāmantra)',
    categoryId: 'vedic-tantra-siddhanta',
    taishoNo: 'Nārāyaṇa Upaniṣad / Bhāgavata Purāṇa / Kali-Santaraṇa Upaniṣad (GRETIL)',
    translatorZh: '那罗陀仙人（Nārada）与五夜教（Pañcarātra）圣传 · GRETIL 梵本往世书校勘',
    sutraSourceZh: '《那罗延奥义书》《薄伽梵往世书》《阿酰耶布达尼本集》《度越诤世奥义书》',
    deityZh: '遍入天毗湿奴 · 那罗延 · 罗摩 · 奎师那 (Śrīmān Nārāyaṇa / Vāsudeva / Rāma / Kṛṣṇa)',
    meritsAndSummaryZh:
      '全面汇集印度毗湿奴派（Vaiṣṇavism）四大传承与五夜教阿笈摩（Pañcarātra Āgama）核心梵文真言：那罗延八字根本大咒、婆苏提婆十二字解脱咒、《毗湿奴千名赞》禅定观想颂、善见金轮辟邪护身真言、罗摩渡苦海真言及十六词三十二音节《哈瑞奎师那摩诃曼陀罗》。',
    verses: [
      {
        iast: 'oṃ namo nārāyaṇāya | oṃ namo bhagavate vāsudevāya',
        classicalTranslitZh: '唵 曩莫 那啰也拏也 | 唵 曩莫 婆誐嚩帝 嚩苏提嚩也',
        meaningZh: '【那罗延八字根本真言（Aṣṭākṣara）暨婆苏提婆十二字解脱真言（Dvādaśākṣara）】嗡，顶礼宇宙万有依止处那罗延尊！嗡，顶礼遍住一切众生心间之世尊婆苏提婆！',
        meaningEn: 'The Eight-Syllable Nārāyaṇa Mantra (Tāra-sāra / Nārāyaṇa Upaniṣad) and Twelve-Syllable Vāsudeva Liberation Mantra (Bhāgavata Purāṇa 4.8.54).',
      },
      {
        iast: 'śāntākāraṃ bhujagaśayanaṃ padmanābhaṃ sureśaṃ viśvādhāraṃ gaganasadṛśaṃ meghavarṇaṃ śubhāṅgam | lakṣmīkāntaṃ kamalanayanaṃ yogibhir dhyānagamyaṃ vande viṣṇuṃ bhavabhayaharaṃ sarvalokaikanātham',
        classicalTranslitZh: '扇多迦蓝 婆惹伽舍也南 钵纳摩那婆 苏隶苫 尾室嚩陀蓝 伽伽那萨捺哩苫 迷伽嚩啰南 戍旁甘 | 攞吃瑟弥建多 迦摩攞那也南... 嚩泥 尾瑟努',
        meaningZh: '【《毗湿奴千名赞（Viṣṇusahasranāma）》经典禅观礼赞颂】寂静庄严相、安卧千头蛇床、脐生妙莲、诸天之主、宇宙所依、广大如虚空、肤若青云、吉祥天女挚爱、莲花妙目、瑜伽行者禅定所证——我顶礼净除轮回怖畏之三界唯一依怙毗湿奴尊！',
        meaningEn: 'Meditation Verse (Dhyāna-Śloka) of the Viṣṇusahasranāma Stotra praising Peaceful Viṣṇu reclining upon Ananta-Śeṣa.',
      },
      {
        iast: 'oṃ sahasrāra huṃ phaṭ | oṃ śrīṃ hrīṃ klīṃ kṛṣṇāya govindāya gopījanavallabhāya svāhā',
        classicalTranslitZh: '唵 萨诃娑啰啰 吽 泮吒 | 唵 室哩 纥哩 讫哩 讫哩瑟拏也 瞿尾那也 瞿比惹那嚩攞婆也 娑嚩贺',
        meaningZh: '【五夜教《阿酰耶布达尼本集》善见千辐金轮真言（Sudarśana）暨《瞿波罗前热奥义书》十八字奎师那根本咒】千辐妙轮摧破一切暗障，成就清净妙爱与解脱智慧！',
        meaningEn: 'Sudarśana Cakra Six-Syllable Mantra (Ahirbudhnya Saṃhitā) & Eighteen-Syllable Gopāla Mantra (Gopālatāpanīya Upaniṣad).',
      },
      {
        iast: 'oṃ śrī rāmāya namaḥ | śrī rāma jaya rāma jaya jaya rāma | rāma rāmeti rāmeti rame rāme manorame sahasranāma tattulyaṃ rāmanāma varānane',
        classicalTranslitZh: '唵 室哩 啰摩也 曩莫 | 室哩 啰摩 惹也 啰摩 惹也 惹也 啰摩 | 啰摩 啰迷底 啰迷底 啰迷 啰迷 摩奴啰迷...',
        meaningZh: '【罗摩渡海真言（Rāma Tāraka Mantra）暨《莲花往世书》千名等持偈】顶礼吉祥罗摩尊！湿婆开示帕尔瓦蒂：一称罗摩圣号，功德等同持诵毗湿奴千名全卷。',
        meaningEn: 'Śrī Rāma Tāraka Mantra (Rāmarahasya Upaniṣad) and the Sahasranāma-equivalence verse from the Padma Purāṇa.',
      },
      {
        iast: 'hare kṛṣṇa hare kṛṣṇa kṛṣṇa kṛṣṇa hare hare | hare rāma hare rāma rāma rāma hare hare',
        classicalTranslitZh: '诃隶 讫哩瑟拏 诃隶 讫哩瑟拏 讫哩瑟拏 讫哩瑟拏 诃隶 诃隶 | 诃隶 啰摩 诃隶 啰摩 啰摩 啰摩 诃隶 诃隶',
        meaningZh: '【《度越诤世奥义书（Kali-Santaraṇa Upaniṣad）》十六词三十二音摩诃曼陀罗】大梵天传授那罗陀仙人之度越末法障垢至高唱诵圣名大咒（Mahāmantra），唤醒本具灵性大爱（Bhakti）。',
        meaningEn: 'The Sixteen-Word, Thirty-Two-Syllable Hare Kṛṣṇa Mahāmantra from the Kali-Santaraṇa Upaniṣad.',
      },
    ],
  },
  // ==================== 19. 性力派《女神颂》与室利明妃派（Śākta Devī & Śrīvidyā） ====================
  {
    id: 'sakta-devi-srividya-mantras',
    titleZh: '性力派《女神颂（Devī-Māhātmya）》与室利明妃派圣咒全集（九字真言·吉祥天女·十五音根本咒）',
    aliasesZh: '难近母九字真言,旃陀利九音咒,女神颂真言,大吉祥天女招财梵咒,室利明妃十五音咒,巴拉三字明,时母卡莉真言,Navarna Mantra,Om Aim Hrim Klim,Mahalakshmi Mantra,Sri Vidya Pancadasi,Ya Devi Sarvabhuteshu',
    titleSanskritIast: 'Śākta-Caṇḍī-Navārṇa-Mahālakṣmī-Śrīvidyā-Pañcadaśī-Mantra',
    titleEnglish: 'Śākta & Śrīvidyā Mantras (Caṇḍī Navārṇa, Devī-Māhātmya Hymns, Mahālakṣmī & Śrīvidyā Pañcadaśākṣarī)',
    categoryId: 'vedic-tantra-siddhanta',
    taishoNo: 'Mārkaṇḍeya Purāṇa 81–93 / Tripurātāpinī Upaniṣad (GRETIL markp_u)',
    translatorZh: '摩根德耶仙人（Mārkaṇḍeya）与室利明妃派阿阇梨 传授 · GRETIL 梵本校勘',
    sutraSourceZh: '《摩根德耶往世书·女神颂（Devī-Māhātmya / Durgā-Saptaśatī）》·《三城热奥义书》',
    deityZh: '难近母杜尔迦 · 大吉祥天女 · 大辩才天女 · 丽三城圣母 (Durgā / Mahālakṣmī / Lalitā Tripurasundarī)',
    meritsAndSummaryZh:
      '完整收录印度性力派（Śāktism）最高圣典《女神颂（七百颂）》与南方室利轮（Śrīcakra）传承之核心真言：统摄三大天女（大黑、大吉祥、大辩才）之九音节旃陀利根本真言（Navārṇa Mantra）、《一切吉祥中之吉祥颂》、《遍住众生圣力礼赞》、莲花大吉祥天女真言，以及室利明妃派秘传之三城圣母十五音根本大明（Pañcadaśākṣarī）。',
    verses: [
      {
        iast: 'oṃ aiṃ hrīṃ klīṃ cāmuṇḍāyai vicce',
        classicalTranslitZh: '唵 盎 纥哩 讫哩 左闷拏裔 尾制（《女神颂》九字根本真言 Navārṇa Mantra）',
        meaningZh: '【难近母旃陀利九音根本真言（Navārṇa Mantra）】aiṃ（大辩才天女般若智慧）、hrīṃ（大吉祥天女清净妙有）、klīṃ（大黑天女摄伏大悲），归命降魔圣母遮文荼，圆满觉照！',
        meaningEn: 'The Nine-Syllable (Navārṇa) Root Mantra of Caṇḍī / Durgā uniting Mahāsarasvatī (Aiṃ), Mahālakṣmī (Hrīṃ), and Mahākālī (Klīṃ).',
      },
      {
        iast: "sarvamaṅgalamāṅgalye śive sarvārthasādhike | śaraṇye tryambake gauri nārāyaṇi namo 'stu te",
        classicalTranslitZh: '萨嚩莽伽攞莽伽梨 尸吠 萨嚩曷他娑地计 | 舍啰尼 怛哩焰婆计 高哩 那啰也抳 曩莫 娑睹 帝',
        meaningZh: '【《女神颂》第11章第10颂 · 一切吉祥中之至极吉祥赞】一切吉祥中之吉祥母、寂静善妙母、成办一切所求母、归依救护母、三慧眼皎洁母那罗延尼啊，顶礼于你！',
        meaningEn: 'Auspiciousness of all that is auspicious, O Śivā, accomplisher of all aims, refuge, three-eyed Gaurī, O Nārāyaṇī, salutations to Thee! (Devī-Māhātmya 11.10)',
      },
      {
        iast: 'yā devī sarvabhūteṣu śaktirūpeṇa saṃsthitā | yā devī sarvabhūteṣu mātṛrūpeṇa saṃsthitā | namas tasyai namas tasyai namas tasyai namo namaḥ',
        classicalTranslitZh: '也 提尾 萨嚩部帝数 铄讫底噜闭拏 三娑体多 | 曩莫 怛写裔 曩莫 怛写裔 曩莫 怛写裔 曩莫 曩莫',
        meaningZh: '【《女神颂》第5章 · 遍住一切众生圣力与慈母礼赞】彼以神圣能量与慈母之相遍住于一切众生心间之天女圣母啊，再三至诚顶礼于彼！',
        meaningEn: 'To that Goddess who abides in all beings in the form of Power (Śakti) and Divine Mother—salutations to Her again and again! (Devī-Māhātmya 5.32 & 5.74)',
      },
      {
        iast: 'oṃ śrīṃ hrīṃ śrīṃ kamale kamalālaye prasīda prasīda śrīṃ hrīṃ śrīṃ oṃ mahālakṣmyai namaḥ',
        classicalTranslitZh: '唵 室哩 纥哩 室哩 迦摩隶 迦摩攞攞曳 钵啰悉陀 钵啰悉陀 室哩 纥哩 室哩 唵 摩诃攞吃瑟弭裔 曩莫',
        meaningZh: '【大吉祥天女（Mahālakṣmī）二十四音丰饶赐福根本真言】嗡！安住妙莲宫殿之莲花吉祥圣母啊，愿垂慈悲欢喜加持，赐予内外福慧丰饶！',
        meaningEn: 'Classic Tantric Mantra of Goddess Mahālakṣmī residing in the lotus, bestowing spiritual and material abundance.',
      },
      {
        iast: 'oṃ aiṃ klīṃ sauḥ | ka e ī la hrīṃ | ha sa ka ha la hrīṃ | sa ka la hrīṃ',
        classicalTranslitZh: '唵 盎 讫哩 骚 | 迦 翳 伊 攞 纥哩 | 诃 萨 迦 诃 攞 纥哩 | 萨 迦 攞 纥哩',
        meaningZh: '【室利明妃派（Śrīvidyā）巴拉三字明暨丽三城圣母十五音根本大明（Pañcadaśākṣarī）】分三聚（语聚 Vāgbhava、爱聚 Kāmarāja、力聚 Śakti），与室利轮九重坛城严密对应之最高秘密真言。',
        meaningEn: 'Bālā Tripurasundarī Mantra (Aiṃ Klīṃ Sauḥ) and the Three-Peak Fifteen-Syllable Mantra (Kādi Pañcadaśākṣarī) of Lalitā Tripurasundarī.',
      },
    ],
  },
  // ==================== 20. 医神檀梵陀利真言、太阳心咒（Āditya-Hṛdaya）、九曜与普世祈福真言 ====================
  {
    id: 'surya-navagraha-dhanvantari-universal-mantras',
    titleZh: '阿育吠陀医神檀梵陀利真言·《罗摩衍那》太阳心咒·九曜星宿梵咒与普世和平祈愿颂',
    aliasesZh: '阿育吠陀医神咒,檀梵陀利疗愈真言,太阳心咒,阿底提亚心咒,九曜总咒,愿一切众生安乐咒,Dhanvantari Mantra,Aditya Hridayam,Navagraha Stotra,Sarve Bhavantu Sukhinah,Lokah Samastah Sukhino Bhavantu',
    titleSanskritIast: 'Dhanvantari-Ādityahṛdaya-Navagraha-Sarvamaṅgala-Mantra',
    titleEnglish: 'Āyurvedic Dhanvantari Healing Mantra, Āditya-Hṛdaya, Navagraha Mantra & Universal Peace Prayers',
    categoryId: 'vedic-tantra-siddhanta',
    taishoNo: 'Rāmāyaṇa 6.105 / Brahmāṇḍa Purāṇa (GRETIL ram_06u)',
    translatorZh: '阿伽斯底耶仙人（Agastya Ṛṣi）与毗耶娑仙人 传授 · GRETIL《罗摩衍那》校勘本',
    sutraSourceZh: '《罗摩衍那·战斗篇》第105章《太阳心咒》·《阿育吠陀医典》·《九曜赞》',
    deityZh: '医神檀梵陀利 (Dhanvantari) · 太阳神苏利耶 (Sūrya Āditya) · 九曜星神 (Navagraha)',
    meritsAndSummaryZh:
      '汇集印度医学、天文历算与普世慈悲祈祷四大传统经典真言：阿育吠陀医学鼻祖手持甘露宝瓶之檀梵陀利医神疗愈大咒、《罗摩衍那》投山仙人传授罗摩之《太阳心咒（Āditya-Hṛdayam）》、九曜星宿吉祥晨祷总咒，以及流传全球之《愿一切众生安乐无病祈愿真言》。',
    verses: [
      {
        iast: 'oṃ namo bhagavate vāsudevāya dhanvantaraye amṛtakalaśahastāya sarvāmayavināśanāya trailokyanāthāya śrīmahāviṣṇave namaḥ',
        classicalTranslitZh: '唵 曩莫 婆誐嚩帝 嚩苏提嚩也 檀嚩多啰曳 阿蜜栗多迦攞舍诃娑多也 萨嚩摩也尾那舍那也 怛赖路枳也那他也 室哩摩诃尾瑟拏吠 曩莫',
        meaningZh: '【阿育吠陀医神檀梵陀利（Dhanvantari）疗愈大咒】嗡！顶礼世尊婆苏提婆化现之医王檀梵陀利——手持不死甘露宝瓶、净除一切身心疾疫病苦、三界依怙吉祥大毗湿奴尊！',
        meaningEn: 'The Great Āyurvedic Healing Mantra of Lord Dhanvantari holding the nectar-jar (amṛta-kalaśa), destroyer of all diseases.',
      },
      {
        iast: 'oṃ ghṛṇiḥ sūrya ādityaḥ | santāpanāśakaraṃ jayakaraṃ akṣayyaṃ paramaṃ śivam | oṃ bhāskarāya vidmahe mahādyutikarāya dhīmahi | tan no ādityaḥ pracodayāt',
        classicalTranslitZh: '唵 伽哩抳 苏哩也 阿你底也 | 散多波那舍迦蓝 惹也迦蓝... | 唵 婆娑迦啰也 尾捺摩醯 摩诃你逾底迦啰也 提摩醯 | 怛 奴 阿你底也 钵啰祖那夜',
        meaningZh: '【八音节太阳神根本咒、《罗摩衍那》太阳心咒精要暨太阳伽耶特黎咒】除灭一切热恼忧患、赐予胜利与无尽吉祥，愿大光明太阳世尊阿底提亚照亮我等心识！',
        meaningEn: 'Vedic Eight-Syllable Sūrya Mantra, Āditya-Hṛdaya essence (Rāmāyaṇa 6.105), and Sūrya Gāyatrī Mantra.',
      },
      {
        iast: 'brahmā murāris tripurāntakārī bhānuḥ śaśī bhūmisuto budhaś ca | guruś ca śukraḥ śanirāhuhetavaḥ kurvantu sarve mama suprabhātam',
        classicalTranslitZh: '婆啰憾摩 亩啰哩 怛哩补烂多迦哩 婆努 舍尸 部弥苏睹 没陀 遮 | 具噜 遮 戍讫啰 舍尼啰怙醯多嚩 俱啰嚩睹 萨嚩 摩摩 苏钵啰婆多',
        meaningZh: '【印度天文《九曜吉祥晨祷总咒（Navagraha Suprabhāta Mantra）》】梵天、毗湿奴、湿婆三尊，以及日曜、月曜、火曜、水曜、木曜、金曜、土曜、罗睺、计都九曜星神，愿悉赐予我吉祥光明之良辰！',
        meaningEn: 'Traditional Navagraha (Nine Celestial Deities: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rāhu, Ketu) auspicious invocation.',
      },
      {
        iast: 'sarve bhavantu sukhinaḥ sarve santu nirāmayāḥ | sarve bhadrāṇi paśyantu mā kaścid duḥkhabhāg bhavet | lokāḥ samastāḥ sukhino bhavantu',
        classicalTranslitZh: '萨嚩 婆嚩睹 苏企那 萨嚩 三睹 尼啰摩夜 | 萨嚩 跋捺啰抳 钵尸演睹 摩 迦室质 度佉薄 婆吠 | 路迦 三摩娑多 苏企奴 婆嚩睹',
        meaningZh: '【普世慈悲和平祈愿真言（Sarve Bhavantu Sukhinaḥ & Lokāḥ Samastāḥ）】愿一切众生皆得安乐，愿一切众生远离病苦；愿一切众生皆见吉祥善妙，愿无有一人遭受苦厄！愿十方世界一切众生皆得幸福安乐！',
        meaningEn: 'May all beings be happy; may all be free from illness; may all behold what is auspicious; may none suffer sorrow! May all worlds be happy and free!',
      },
    ],
  },
  // ==================== 21. 耆那教最高圣咒《五敬礼真言（Namokāra）》与帕坦伽利瑜伽祈请颂 ====================
  {
    id: 'jaina-namokara-patanjali-yoga-mantras',
    titleZh: '耆那教最高圣咒《五敬礼真言（Pañca-Namaskāra）》· 上师梵赞与帕坦伽利瑜伽祈请咒',
    aliasesZh: '耆那教五敬礼咒,那摩卡拉真言,五尊礼赞咒,不害最高法印,上师三宝梵赞,帕坦伽利瑜伽经开篇祈请颂,Namokar Mantra,Navkar Mantra,Panca Namaskara,Gurur Brahma,Yogena Cittasya',
    titleSanskritIast: 'Jaina-Pañca-Namaskāra-Patañjali-Yoga-Guru-Mantra',
    titleEnglish: 'Jaina Supreme Namokāra Mantra (Sanskrit & Prakrit), Guru Stotra & Patañjali Yoga Invocation',
    categoryId: 'vedic-tantra-siddhanta',
    taishoNo: 'Ṣaṭkhaṇḍāgama 1.1 / Tattvārthasūtra / Skanda Purāṇa (GRETIL jaina)',
    translatorZh: '大雄尊者（Mahāvīra）传承圣众 · 乌玛斯瓦蒂《谛义证得经》与帕坦伽利传统',
    sutraSourceZh: '耆那教《六分阿笈摩》开篇根本咒 ·《谛义证得经（Tattvārthasūtra）》·《上师歌（Guru-Gītā）》',
    deityZh: '耆那五圣尊（阿罗汉·悉达·阿阇梨·亲教师·一切圣僧）· 瑜伽祖师帕坦伽利 (Patañjali)',
    meritsAndSummaryZh:
      '完整收录印度沙门传统另一瑰宝——耆那教（Jainism）跨越两千五百年之最高根本圣咒《五敬礼真言（Pañca-Namaskāra / Namokāra Mantra）》（梵文标准本与俗语古音本对勘，不求世间神祇恩宠而纯粹礼敬五阶解脱觉者之清净德行），并附印度全宗派共通之《上师礼赞咒（Gurur Brahmā）》及全球瑜伽行者课前必诵之《帕坦伽利祈请颂》。',
    verses: [
      {
        iast: 'namo arhadbhyaḥ | namo siddhebhyaḥ | namo ācāryebhyaḥ | namo upādhyāyebhyaḥ | namo loke sarvasādhubhyaḥ | eṣa pañcanamaskāraḥ sarvapāpapraṇāśanaḥ | maṅgalānāṃ ca sarveṣāṃ prathamaṃ bhavati maṅgalam',
        classicalTranslitZh: '曩莫 阿啰诃毗也 | 曩莫 悉提毗也 | 曩莫 阿遮哩曳毗也 | 曩莫 乌波提夜曳毗也 | 曩莫 路计 萨嚩娑度毗也...',
        meaningZh: '【耆那教《五敬礼真言（Pañca-Namaskāra）》标准梵文本】顶礼诸阿罗汉（断尽业障胜者）！顶礼诸成就悉达（究竟解脱灵明者）！顶礼诸轨范师阿阇梨！顶礼诸亲教师邬波驮耶！顶礼世间一切清净修行沙门！此五重敬礼灭除一切罪障，于一切吉祥中为第一至高吉祥！',
        meaningEn: 'The Supreme Jaina Pañca-Namaskāra Mantra in Sanskrit: Homage to the Arhats, Siddhas, Ācāryas, Upādhyāyas, and all Sādhus in the universe! This fivefold salutation destroys all karma and is the foremost of all auspiciousness.',
      },
      {
        iast: 'namo arihantāṇaṃ | namo siddhāṇaṃ | namo āyariyāṇaṃ | namo uvajjhāyāṇaṃ | namo loe savvasāhūṇaṃ',
        classicalTranslitZh: '那摩 阿里汉达南 | 那摩 悉达南 | 那摩 阿亚里亚南 | 那摩 乌瓦迦亚南 | 那摩 洛耶 萨瓦萨胡南（古俗语传诵音）',
        meaningZh: '【《六分阿笈摩》开篇古俗语（Prakrit）原典本五敬礼咒】公元前二世纪哈提古姆帕石刻（Hāthīgumphā）与《六分阿笈摩》所载最古老原音传诵本。',
        meaningEn: 'Original Ardhamāgadhī / Śaurasenī Prakrit Namokāra Mantra opening the Ṣaṭkhaṇḍāgama.',
      },
      {
        iast: 'ahiṃsā paramo dharmaḥ | parasparopagraho jīvānām | samyagdarśanajñānacāritrāṇi mokṣamārgaḥ',
        classicalTranslitZh: '阿呬娑 波啰摩 达摩 | 波啰娑波噜波伽啰怙 耆嚩南 | 三藐捺啰舍那若那遮哩怛啰抳 目叉摩啰伽',
        meaningZh: '【耆那教《谛义证得经（Tattvārthasūtra）》三大法印格言】不害（慈悲不伤生）为至高正法；众生本性相依互济（Tattvārthasūtra 5.21）；正见、正智、正行三宝合一即解脱之道（1.1）！',
        meaningEn: 'Supreme Non-Violence (Ahiṃsā) and the opening & ecological sutras of Umāsvāti’s Tattvārthasūtra (1.1 & 5.21, GRETIL uuztatsu.htm).',
      },
      {
        iast: 'gurur brahmā gurur viṣṇur gurur devo maheśvaraḥ | guruḥ sākṣāt paraṃ brahma tasmai śrīgurave namaḥ',
        classicalTranslitZh: '具噜 婆啰憾摩 具噜 尾瑟努 具噜 提嚩 摩醯室嚩啰 | 具噜 娑叉 波蓝 婆啰憾摩 怛娑迈 室哩具啰吠 曩莫',
        meaningZh: '【《塞建陀往世书·上师歌（Guru-Gītā）》上师三尊根本赞咒】上师即创造智慧梵天，上师即护持慈悲毗湿奴，上师即破惑自在湿婆；上师现前即是无上最高梵，顶礼彼吉祥尊贵上师！',
        meaningEn: 'Guru Stotra (Guru-Gītā 32): The Guru is Brahmā, Viṣṇu, and Maheśvara; the Guru is verily the Supreme Brahman—salutations to that revered Guru!',
      },
      {
        iast: "yogena cittasya padena vācāṃ malaṃ śarīrasya ca vaidyakena | yo 'pākarot taṃ pravaraṃ munīnāṃ patañjaliṃ prāñjalir ānato 'smi",
        classicalTranslitZh: '瑜祇那 质多写 波提那 嚩瞻 摩蓝 舍哩啰写 遮 吠你也计那 | 瑜 波迦路 担 钵啰嚩蓝 牟尼南 钵檀惹林 钵烂惹哩 阿那睹 娑弥',
        meaningZh: '【全球瑜伽传承课前必诵《帕坦伽利大仙祈请颂》】以《瑜伽经》净除心识之垢、以《语法大疏》净除语言之垢、以《医典》净除身体之垢——我合十虔敬顶礼彼牟尼中之最胜尊帕坦伽利！',
        meaningEn: 'Traditional Sanskrit invocation to Sage Patañjali, purifier of mind through Yoga, speech through Grammar (Mahābhāṣya), and body through Āyurveda.',
      },
    ],
  },
];

export const WORLD_ENCYCLOPEDIA_DHARANIS: DharaniEntry[] =
  WORLD_MANTRA_SEEDS.map(buildEncyclopediaEntry);
