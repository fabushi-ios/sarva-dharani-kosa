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
    classicalTranslitZh: string;
    meaningZh: string;
    meaningEn: string;
    tangNoteZh?: string;
  }>;
}

function buildEncyclopediaEntry(seed: CompactMantraSeed): DharaniEntry {
  const cbetaMatch = seed.taishoNo.match(/T\d{2}n\d{4}/);
  const cbetaId = cbetaMatch ? cbetaMatch[0] : undefined;

  const verses: DharaniVerse[] = seed.verses.map((v, idx) => {
    const rawClassical = v.classicalTranslitZh.trim();
    const autoPhonetics = generateVerseChinesePhonetics(v.iast, false);
    return {
      id: `${seed.id}-v${idx + 1}`,
      index: idx + 1,
      iast: v.iast,
      classicalTranslitZh: rawClassical,
      modernPhoneticZh: autoPhonetics.modernPhoneticZh,
      meaningZh: v.meaningZh,
      meaningEn: v.meaningEn,
      tangNoteZh: v.tangNoteZh,
      words: buildWordGlossesFromIast(v.iast),
      fieldSources: {
        iast: 'db-original',
        siddham: 'derived-reference',
        devanagari: 'derived-reference',
        classicalTranslitZh: cbetaId ? 'db-original' : 'derived-reference',
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
    titleZh: `${seed.titleZh}（${seed.aliasesZh.split(',').slice(0, 3).join(' · ')}）`,
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
      '本条严格遵奉「一咒一条目、零省略全文收录」原则，点击单句即可播放梵音合成唱诵并对照悉昙天城六体。',
    provenance: {
      sourceType: cbetaId ? 'CBETA-XML-P5' : 'Academic-Critical-Edition',
      cbetaId,
      cbetaOnlineUrl: cbetaId ? `https://cbetaonline.dila.edu.tw/zh/${cbetaId}` : undefined,
      editionCitation: `${seed.sutraSourceZh} (${seed.taishoNo}) · 梵汉原典全文校订本`,
      manuscriptNotesZh: `独立单咒全文收录，零省略号截断，含完整常用俗称与别名索引（${seed.aliasesZh}）。`,
    },
    verses,
  };
}

const WORLD_MANTRA_SEEDS: CompactMantraSeed[] = [
  {
    "id": "surangama-five-heart-mantra",
    "titleZh": "大佛顶首楞严咒心 · 五大心咒与根本心咒",
    "aliasesZh": "楞严咒心,五大心咒,叱陀你,阿迦罗,蜜唎柱,般唎怛罗耶,儜揭唎,楞严经心咒,大佛顶首楞严咒心",
    "titleSanskritIast": "Śūraṅgama-Pañca-Hṛdaya-Mūla-Mantra",
    "titleEnglish": "Five Heart Mantras & Root Heart Mantra of the Śūraṅgama Dhāraṇī",
    "categoryId": "supreme-mantras",
    "taishoNo": "T19n0945 (卷七)",
    "translatorZh": "（唐）般剌密帝 译 / 不空三藏 对音",
    "sutraSourceZh": "《大佛顶如来密因修证了义诸菩萨万行首楞严经》卷七 (T19n0945)",
    "deityZh": "大佛顶如来 · 大白伞盖佛母",
    "meritsAndSummaryZh": "专取《大佛顶首楞严咒》第五会破魔核心「五大心咒」与全咒最末「跢侄他」后之根本心咒。历代祖师开示五大心咒与楞严咒心专破天魔外道一切邪术蛊毒，护持正定。",
    "verses": [
      {
        "iast": "chedani akāla mṛtyu paritrāyaṇa karī",
        "classicalTranslitZh": "叱陀你 阿迦罗 蜜唎柱 般唎怛罗耶 儜揭唎",
        "meaningZh": "【第五会核心·五大心咒】斩断一切非时横死与天魔邪术灾障，圆满救护度脱一切众生！",
        "meaningEn": "Five Great Heart Mantras: O cutter of untimely death, she who grants complete protection and deliverance!",
        "tangNoteZh": "《楞严经》卷七第五会核心「五大心咒」原字"
      },
      {
        "iast": "tadyathā | oṃ anale anale viśade viśade vīra vajradhare bandha bandhani vajrapāṇi phaṭ hūṃ bhrūṃ phaṭ svāhā",
        "classicalTranslitZh": "跢侄他 唵 阿那隶 阿那隶 毗舍提 毗舍提 鞞啰 跋阇啰陀唎 盘陀盘陀你 跋阇啰谤尼泮 虎信都嚧瓮泮 莎婆诃",
        "meaningZh": "【全咒最末根本心咒】即说咒曰：嗡！猛火遍照、清净无染、勇猛执持金刚杵者！结界缚魔、执金刚手摧破一切魔障，圆满成就！",
        "meaningEn": "Ultimate Heart Mantra of Śūraṅgama: Oṃ! O fiery, pure, heroic holder of the vajra! Bind, O binder, Vajra-in-hand, phaṭ hūṃ bhrūṃ phaṭ svāhā!",
        "tangNoteZh": "《楞严经》卷七全咒结诵根本心咒（常诵108遍）"
      }
    ]
  },
  {
    "id": "sitatapatra-kavaca-hrdaya-mantra",
    "titleZh": "大白伞盖佛母坚甲护身心咒",
    "aliasesZh": "大白伞盖心咒,大白伞盖坚甲咒,白伞盖佛母心咒,吽妈妈吽呢梭哈",
    "titleSanskritIast": "Sitātapatrā-Kavaca-Hṛdaya-Mantra",
    "titleEnglish": "Armor Protection Heart Mantra of Ārya-Sitātapatrā",
    "categoryId": "supreme-mantras",
    "taishoNo": "T19n0976 / T19n0977",
    "translatorZh": "（元）沙啰巴 译 / 不空 译本参校",
    "sutraSourceZh": "《佛顶大白伞盖陀罗尼经》(T19n0976)",
    "deityZh": "佛顶大白伞盖无能胜佛母 (Ārya-Sitātapatrā Aparājitā)",
    "meritsAndSummaryZh": "大白伞盖佛母独立坚甲护身短心咒，回遮一切恶咒、横祸、灾疫、怨敌与非人侵扰，护国息灾。",
    "verses": [
      {
        "iast": "hūṃ mama hūṃ ni svāhā",
        "classicalTranslitZh": "吽 摩摩 吽 儞 娑嚩贺",
        "meaningZh": "吽！祈请大白伞盖佛母金刚坚甲护佑于我，摧灭诸恶灾障，圆满吉祥！",
        "meaningEn": "Armor Heart Mantra of Sitātapatrā: Hūṃ! Protect me, hūṃ ni svāhā!",
        "tangNoteZh": "藏汉通行音：吽 妈妈 吽 呢 梭哈"
      }
    ]
  },
  {
    "id": "padmasambhava-vajra-guru-mantra",
    "titleZh": "莲花生大士根本心咒（十二音金刚上师心咒）",
    "aliasesZh": "莲师心咒,金刚上师咒,莲花生大士真言,嗡阿吽班杂咕噜贝玛悉地吽,邬金莲师心咒",
    "titleSanskritIast": "Padmasambhava-Vajra-Guru-Dvādaśākṣara-Mantra",
    "titleEnglish": "Twelve-Syllable Vajra Guru Mantra of Padmasambhava",
    "categoryId": "buddhas-bodhisattvas",
    "taishoNo": "宁玛伏藏梵藏对勘本",
    "translatorZh": "莲花生大士 传授 / 伏藏大师噶玛林巴 取出",
    "sutraSourceZh": "《金刚上师心咒功德经》",
    "deityZh": "第二佛陀 · 邬金莲花生大士 (Padmasambhava)",
    "meritsAndSummaryZh": "三世诸佛身语意总集化现莲花生大士之十二音根本心咒，迅速消除修行违缘与内外密障碍，获胜共二种悉地。",
    "verses": [
      {
        "iast": "oṃ āḥ hūṃ vajra guru padma siddhi hūṃ",
        "classicalTranslitZh": "唵 噁 吽 嚩日啰 具噜 钵纳摩 悉地 吽",
        "meaningZh": "嗡（身金刚）、阿（语金刚）、吽（意金刚）！祈请金刚上师莲花生大士，赐予共与不共一切成就悉地，吽！",
        "meaningEn": "Oṃ Āḥ Hūṃ! O Vajra Guru Lotus-Born (Padmasambhava), grant all spiritual accomplishments (siddhi), Hūṃ!",
        "tangNoteZh": "藏传通行音：嗡 阿 吽 班杂 咕噜 贝玛 悉地 吽"
      }
    ]
  },
  {
    "id": "six-realms-vajra-liberation-mantra",
    "titleZh": "六道金刚咒（大圆满听闻解脱六字真言）",
    "aliasesZh": "六道金刚咒,听闻解脱咒,大圆满六字真言,啊阿夏萨玛哈,普贤王如来度亡咒",
    "titleSanskritIast": "Ṣaḍ-Gati-Vajra-Śravaṇa-Mukti-Mantra",
    "titleEnglish": "Six-Realm Vajra Mantra of Liberation Upon Hearing",
    "categoryId": "supreme-mantras",
    "taishoNo": "大圆满无垢忏悔续 / 听闻解脱密续",
    "translatorZh": "毗玛拉米扎 传授 / 诺那呼图克图 弘传",
    "sutraSourceZh": "《大圆满寂静愤怒百尊听闻解脱经》",
    "deityZh": "普贤王如来 (Samantabhadra) · 金刚萨埵",
    "meritsAndSummaryZh": "专度六道众生出离轮回之无上总持真言，一历耳根即植解脱金刚种子，超拔中阴及恶趣众生。",
    "verses": [
      {
        "iast": "a āḥ śa sa ma ha",
        "classicalTranslitZh": "阿 噁 舍 娑 摩 诃",
        "meaningZh": "以本初法界六根本种子字，封闭天、阿修罗、人、畜生、饿鬼、地狱六道受生之门，立证本净觉性！",
        "meaningEn": "The Six Seed Syllables closing the gates of rebirth in the six realms and awakening primordial awareness.",
        "tangNoteZh": "通行读音：啊 阿 夏 萨 玛 哈"
      }
    ]
  },
  {
    "id": "trikaya-om-ah-hum-mantra",
    "titleZh": "诸佛三金刚根本种子三字明（嗡阿吽）",
    "aliasesZh": "三字明,三字总持真言,嗡阿吽,身语意三密加持咒",
    "titleSanskritIast": "Trikāya-Vajra-Tryakṣara-Mūla-Mantra",
    "titleEnglish": "Three Vajra Seed Syllables of Body, Speech, and Mind (Oṃ Āḥ Hūṃ)",
    "categoryId": "supreme-mantras",
    "taishoNo": "T18n0885",
    "translatorZh": "（宋）施护 译",
    "sutraSourceZh": "《佛说一切如来真实摄大乘现证三昧大教王经》及《密集根本续》(T18n0885)",
    "deityZh": "十方三世一切诸佛身语意三金刚",
    "meritsAndSummaryZh": "一切密乘修法加持供品、清净身语意三业、转化贪瞋痴五毒为五智之根本三字总持。",
    "verses": [
      {
        "iast": "oṃ āḥ hūṃ",
        "classicalTranslitZh": "唵 噁 吽",
        "meaningZh": "清净一切众生身业（嗡）、语业（阿）、意业（吽），与诸佛身语意三密相应无二！",
        "meaningEn": "The Three Vajra Seed Syllables of Awakened Body (Oṃ), Speech (Āḥ), and Mind (Hūṃ)."
      }
    ]
  },
  {
    "id": "simhamukha-dakini-mantra",
    "titleZh": "狮面空行母回遮除障根本心咒",
    "aliasesZh": "狮面空行母心咒,狮面佛母回遮咒,阿迦萨玛拉杂沙达拉萨玛拉雅呸",
    "titleSanskritIast": "Siṃhamukhā-Ḍākinī-Pratyaṅgirā-Mantra",
    "titleEnglish": "Curse-Averting Heart Mantra of Lion-Faced Ḍākinī (Siṃhamukhā)",
    "categoryId": "vidyarajas-protectors",
    "taishoNo": "藏密新旧译派共传梵藏对勘本",
    "translatorZh": "莲花生大士 / 巴日译师 传承",
    "sutraSourceZh": "《圣狮面空行母成就仪轨》",
    "deityZh": "智悲狮面空行母 (Jñāna-Siṃhamukhā Ḍākinī)",
    "meritsAndSummaryZh": "十四音节无上回遮真言，猛力斩断并回遮一切诅咒、蛊毒、邪术、恶曜及内外违缘魔障。",
    "verses": [
      {
        "iast": "aḥ ka sa ma ra ca śa da ra sa ma ra ya phaṭ",
        "classicalTranslitZh": "噁 迦 娑 摩 啰 左 舍 陀 啰 娑 摩 啰 也 发吒",
        "meaningZh": "以本初法界空行威猛大音，粉碎并回遮一切诅咒恶缘与邪障，立令清净解脱！",
        "meaningEn": "Siṃhamukhā (Lion-Faced Ḍākinī) fourteen-syllable mantra for averting curses and negative forces.",
        "tangNoteZh": "藏音通行：阿 迦 萨 玛 啰 匝 沙 达 啰 萨 玛 啰 雅 呸"
      }
    ]
  },
  {
    "id": "vajrayogini-sarvabuddhadakini-mantra",
    "titleZh": "金刚瑜伽母（金刚亥母）三嗡根本心咒",
    "aliasesZh": "金刚瑜伽母心咒,金刚亥母心咒,那若空行母咒,三嗡咒",
    "titleSanskritIast": "Vajrayoginī-Sarvabuddhaḍākinī-Mūla-Mantra",
    "titleEnglish": "Three-Oṃ Root Mantra of Vajrayoginī / Vajravārāhī",
    "categoryId": "vidyarajas-protectors",
    "taishoNo": "GRETIL sadhm_u.htm (Sādhanamālā)",
    "translatorZh": "那洛巴尊者 传承 · 梵本《成就法鬘（Sādhanamālā）》校勘",
    "sutraSourceZh": "梵本《成就法鬘·金刚亥母成就法》(Vajravārāhī-Sādhana)",
    "deityZh": "至尊金刚瑜伽母 · 金刚亥母 (Śrī-Vajrayoginī / Vajravārāhī)",
    "meritsAndSummaryZh": "无上瑜伽母续空行主尊金刚瑜伽母之「三嗡咒」根本真言，总摄诸佛空行、金刚妙色、金刚遍照三身乐空大智。",
    "verses": [
      {
        "iast": "oṃ oṃ oṃ sarvabuddhaḍākinīye vajravarṇanīye vajravairocanīye hūṃ hūṃ hūṃ phaṭ phaṭ phaṭ svāhā",
        "classicalTranslitZh": "唵 唵 唵 萨嚩没驮荼吉尼曳 嚩日啰嚩啰拏尼曳 嚩日啰吠嚧遮尼曳 吽 吽 吽 发吒 发吒 发吒 娑嚩贺",
        "meaningZh": "嗡嗡嗡！顶礼一切诸佛空行母、金刚妙色严饰母、金刚大日遍照母！吽吽吽，摧破无明我执，圆满乐空大印成就！",
        "meaningEn": "Three-Oṃ Root Mantra of Vajrayoginī (Sarvabuddhaḍākinī, Vajravarṇanī, Vajravairocanī)."
      }
    ]
  },
  {
    "id": "sita-jambhala-mantra",
    "titleZh": "白财神（骑龙白宝藏王）祛病增福心咒",
    "aliasesZh": "白财神心咒,骑龙白财神咒,观音化现白宝藏王咒",
    "titleSanskritIast": "Sita-Jambhala-Padmakrodha-Hṛdaya-Mantra",
    "titleEnglish": "Heart Mantra of White Jambhala (Dragon-Riding Jambhala)",
    "categoryId": "vidyarajas-protectors",
    "taishoNo": "阿底峡尊者传规梵本对勘",
    "translatorZh": "阿底峡尊者（燃灯吉祥智）传承",
    "sutraSourceZh": "《圣观自在化现骑龙白瞻巴拉成就法》",
    "deityZh": "骑龙白财神 (Sita-Jambhala)",
    "meritsAndSummaryZh": "观世音菩萨大悲眼泪所化现之白财神独立心咒，平息病苦灾厄、扭转贫穷恶业、增长善法资粮。",
    "verses": [
      {
        "iast": "oṃ padmakrodha āryajambhala hṛdaya hūṃ phaṭ",
        "classicalTranslitZh": "唵 钵纳摩俱噜陀 阿哩也瞻婆攞 纥哩陀也 吽 发吒",
        "meaningZh": "嗡！莲花部威怒圣宝藏王心印，净除一切贫病违缘，赐予无尽福慧资粮，吽，发吒！",
        "meaningEn": "Heart Mantra of White Jambhala of the Lotus Family: Oṃ padmakrodha āryajambhala hṛdaya hūṃ phaṭ!"
      }
    ]
  },
  {
    "id": "rakta-jambhala-mantra",
    "titleZh": "红财神怀摄善缘资粮心咒",
    "aliasesZh": "红财神心咒,金刚萨埵化现红宝藏王咒",
    "titleSanskritIast": "Rakta-Jambhala-Vasīkaraṇa-Mantra",
    "titleEnglish": "Magnetizing Prosperity Mantra of Red Jambhala",
    "categoryId": "vidyarajas-protectors",
    "taishoNo": "萨迦与宁玛传规梵本对勘",
    "translatorZh": "印度大成就者 传承",
    "sutraSourceZh": "《红瞻巴拉怀摄受用成就仪轨》",
    "deityZh": "红财神 (Rakta-Jambhala)",
    "meritsAndSummaryZh": "金刚萨埵所化现之红财神独立心咒，怀摄人天善缘、汇聚世出世间福德财富与法缘受用。",
    "verses": [
      {
        "iast": "oṃ jambhala jalendrāya dhanaṃ medehi hrīḥ ḍākinījālasaṃvara svāhā",
        "classicalTranslitZh": "唵 瞻婆攞 惹连捺啰也 檀南 迷提呬 纥哩 荼吉尼惹攞三嚩啰 娑嚩贺",
        "meaningZh": "嗡！祈请水中自在宝藏王赐予法财受用，以莲花部纥哩字与空行网摄持加持，圆满吉祥！",
        "meaningEn": "Red Jambhala Heart Mantra for magnetizing prosperity and auspicious conditions."
      }
    ]
  },
  {
    "id": "krsna-jambhala-mantra",
    "titleZh": "黑财神极速除障赐福心咒",
    "aliasesZh": "黑财神心咒,不动佛化现黑宝藏王咒,嗡英扎尼穆看巴玛哩梭哈",
    "titleSanskritIast": "Kṛṣṇa-Jambhala-Mūla-Mantra",
    "titleEnglish": "Swift Obstacle-Removing Wealth Mantra of Black Jambhala",
    "categoryId": "vidyarajas-protectors",
    "taishoNo": "什巴尊者与阿底峡传规梵本对勘",
    "translatorZh": "阿底峡尊者 / 萨迦班智达 传承",
    "sutraSourceZh": "《黑瞻巴拉成就法》(Kṛṣṇa-Jambhala-Sādhana)",
    "deityZh": "黑财神 (Kṛṣṇa-Jambhala)",
    "meritsAndSummaryZh": "东方阿閦不动佛化现之黑财神独立心咒，极速驱除怨敌盗贼、恶运衰败，迅速加持修行资粮无缺。",
    "verses": [
      {
        "iast": "oṃ indrāyaṇi mukhaṃ bhramari svāhā",
        "classicalTranslitZh": "唵 因捺啰也抳 目欠 婆啰摩哩 娑嚩贺",
        "meaningZh": "嗡！以帝释天女威神妙力旋破一切穷困衰厄，迅速赐予清净资财，圆满成就！",
        "meaningEn": "Black Jambhala Heart Mantra for swiftly removing misfortune and poverty."
      }
    ]
  },
  {
    "id": "syama-jambhala-mantra",
    "titleZh": "绿财神事业成就心咒",
    "aliasesZh": "绿财神心咒,不空成就佛化现绿宝藏王咒",
    "titleSanskritIast": "Śyāma-Jambhala-Karma-Mantra",
    "titleEnglish": "Enlightened Activity Wealth Mantra of Green Jambhala",
    "categoryId": "vidyarajas-protectors",
    "taishoNo": "时轮与伏藏传规梵本对勘",
    "translatorZh": "时轮续部传承",
    "sutraSourceZh": "《绿瞻巴拉事业成就法》",
    "deityZh": "绿财神 (Śyāma-Jambhala)",
    "meritsAndSummaryZh": "北方不空成就佛化现之绿财神独立心咒，净除事业障碍，令一切善法功德与正命资财速疾成办。",
    "verses": [
      {
        "iast": "oṃ karma jambhala āḥ svāhā",
        "classicalTranslitZh": "唵 羯磨 瞻婆攞 噁 娑嚩贺",
        "meaningZh": "嗡！祈请事业宝藏王加持一切善妙事业顺遂成办、受用丰饶，圆满吉祥！",
        "meaningEn": "Green Jambhala Heart Mantra for accomplishing virtuous activities and prosperity."
      }
    ]
  },
  {
    "id": "kalacakra-dasaksari-mantra",
    "titleZh": "时轮金刚十相自在根本心咒",
    "aliasesZh": "时轮金刚心咒,十相自在咒,嗡罕叉玛拉瓦拉雅梭哈",
    "titleSanskritIast": "Śrī-Kālacakra-Daśākṣarī-Mūla-Mantra",
    "titleEnglish": "Tenfold Powerful Syllable Mantra of Śrī Kālacakra",
    "categoryId": "vidyarajas-protectors",
    "taishoNo": "GRETIL kalacaku.htm (Laghukālacakratantra)",
    "translatorZh": "月贤法王 传授 · 梵本《无垢光大疏（Vimalaprabhā）》对勘",
    "sutraSourceZh": "《吉祥时轮根本略续》(Laghukālacakratantra)",
    "deityZh": "吉祥时轮金刚 (Śrī-Kālacakra)",
    "meritsAndSummaryZh": "无二瑜伽续之王《时轮根本略续》核心十相自在根本心咒，统摄地水火风空识智七界，镇宅辟邪、转化内外别三时轮为清净佛土。",
    "verses": [
      {
        "iast": "oṃ haṃ kṣa ma la va ra yaṃ svāhā",
        "classicalTranslitZh": "唵 憾 叉 摩 攞 嚩 啰 焰 娑嚩贺",
        "meaningZh": "嗡！十相自在七字与三界顶严合集，转染污世间时轮为无上乐空不变大智，圆满吉祥！",
        "meaningEn": "Kālacakra Tenfold Powerful Syllable Mantra (Daśākṣarī) from the Vimalaprabhā."
      }
    ]
  },
  {
    "id": "guhyasamaja-mula-mantra",
    "titleZh": "密集金刚（一切如来真实摄）根本心咒",
    "aliasesZh": "密集金刚心咒,密集阿閦金刚咒",
    "titleSanskritIast": "Śrī-Guhyasamāja-Akṣobhyavajra-Mūla-Mantra",
    "titleEnglish": "Root Heart Mantra of Guhyasamāja Akṣobhyavajra",
    "categoryId": "vidyarajas-protectors",
    "taishoNo": "T18n0885 / GRETIL guhysamu.htm",
    "translatorZh": "（宋）施护 译 · GRETIL《Guhyasamājatantra》梵本对勘",
    "sutraSourceZh": "《佛说一切如来真实摄大乘现证三昧大教王经》(T18n0885)",
    "deityZh": "密集不动金刚 (Guhyasamāja Akṣobhyavajra)",
    "meritsAndSummaryZh": "无上瑜伽父续之王《密集根本续》根本心咒，证悟幻身与光明双运之金刚大持果位。",
    "verses": [
      {
        "iast": "oṃ āḥ vajradhṛk hūṃ hūṃ",
        "classicalTranslitZh": "唵 噁 嚩日啰特哩克 吽 吽",
        "meaningZh": "嗡、阿！执持五智不坏金刚之密集世尊，双运证入法身不动大智，吽吽！",
        "meaningEn": "Root Mantra of Guhyasamāja Akṣobhyavajra (Guhyasamājatantra)."
      }
    ]
  },
  {
    "id": "cakrasamvara-heruka-mula-mantra",
    "titleZh": "胜乐金刚（上乐轮黑鲁迦）根本心咒",
    "aliasesZh": "胜乐金刚心咒,上乐金刚咒,鲁伊巴胜乐心咒",
    "titleSanskritIast": "Śrī-Cakrasaṃvara-Heruka-Mūla-Mantra",
    "titleEnglish": "Root Heart Mantra of Śrī Cakrasaṃvara Heruka",
    "categoryId": "vidyarajas-protectors",
    "taishoNo": "GRETIL samvarau.htm (Laghusaṃvaratantra)",
    "translatorZh": "鲁伊巴 / 那洛巴 传承 · GRETIL《Laghusaṃvaratantra》梵本对勘",
    "sutraSourceZh": "《吉祥胜乐根本略续》(Śrīcakrasaṃvaratantra)",
    "deityZh": "吉祥胜乐轮黑鲁迦 (Śrī-Cakrasaṃvara Heruka)",
    "meritsAndSummaryZh": "无上瑜伽母续之王《胜乐根本续》核心心咒，总摄空行网俱生大乐智慧，净除三界贪执微细习气。",
    "verses": [
      {
        "iast": "oṃ śrī vajra he he ru ru kaṃ hūṃ hūṃ phaṭ ḍākinījālasaṃvaraṃ svāhā",
        "classicalTranslitZh": "唵 室哩 嚩日啰 醯 醯 噜 噜 剑 吽 吽 泮吒 荼吉尼惹攞三嚩啰 娑嚩贺",
        "meaningZh": "嗡！吉祥金刚饮血尊黑鲁迦，吽吽摧破二障，空行大网殊胜乐轮总摄圆满成就！",
        "meaningEn": "Root Mantra of Śrī Cakrasaṃvara Heruka (Laghusaṃvaratantra)."
      }
    ]
  },
  {
    "id": "hevajra-astaksara-mula-mantra",
    "titleZh": "喜金刚（大悲空智金刚）八字根本心咒",
    "aliasesZh": "喜金刚心咒,呼金刚咒,大悲空智金刚咒",
    "titleSanskritIast": "Śrī-Hevajra-Aṣṭākṣara-Mūla-Mantra",
    "titleEnglish": "Eight-Syllable Root Heart Mantra of Śrī Hevajra",
    "categoryId": "vidyarajas-protectors",
    "taishoNo": "T18n0892 / GRETIL hevajrau.htm",
    "translatorZh": "（宋）法护 译 · Snellgrove《Hevajratantra》梵本对勘",
    "sutraSourceZh": "《佛说大悲空智金刚大教王仪轨经》卷二 (T18n0892)",
    "deityZh": "吉祥喜金刚 · 呼金刚 (Śrī-Hevajra)",
    "meritsAndSummaryZh": "《大悲空智金刚大教王经》（《喜金刚本续王》第1分第2品）所载之八字根本心咒，悲智双运，摧破四魔。",
    "verses": [
      {
        "iast": "oṃ deva picu vajra hūṃ hūṃ hūṃ phaṭ svāhā",
        "classicalTranslitZh": "唵 提嚩 必祖 嚩日啰 吽 吽 吽 泮吒 娑嚩贺",
        "meaningZh": "嗡！天中胜妙金刚大悲空智尊，吽吽吽摧伏四魔，证入俱生双运悉地！",
        "meaningEn": "Root Heart Mantra of Śrī Hevajra (Hevajratantra I.2)."
      }
    ]
  },
  {
    "id": "vajrakilaya-mula-mantra",
    "titleZh": "普巴金刚（金刚橛）除障根本心咒",
    "aliasesZh": "普巴金刚心咒,金刚橛心咒,移喜措嘉除障咒",
    "titleSanskritIast": "Vajrakīlaya-Sarvavighna-Vināśana-Mūla-Mantra",
    "titleEnglish": "Obstacle-Annihilating Root Mantra of Vajrakīlaya",
    "categoryId": "vidyarajas-protectors",
    "taishoNo": "梵藏本《金刚橛根本续》对勘",
    "translatorZh": "莲花生大士 / 毗玛拉米扎 传译",
    "sutraSourceZh": "《吉祥金刚橛根本续片段》(Vajrakīlaya-Mūla-Tantra)",
    "deityZh": "吉祥普巴金刚 · 孺童金刚橛尊 (Vajrakumāra / Vajrakīlaya)",
    "meritsAndSummaryZh": "一切诸佛事业总集化现普巴金刚之根本除障心咒，如金刚宝橛钉伏并转化一切修道违缘与魔障。",
    "verses": [
      {
        "iast": "oṃ vajra kīli kīlaya sarvavighnān baṃ hūṃ phaṭ",
        "classicalTranslitZh": "唵 嚩日啰 枳哩 枳攞也 萨嚩尾觐南 鍐 吽 发吒",
        "meaningZh": "嗡！金刚橛尊以智慧宝橛钉伏一切魔障违缘，摄缚转化，摧破无明，吽，发吒！",
        "meaningEn": "Vajrakīlaya Root Mantra for pinning down and transforming all obstacles."
      }
    ]
  },
  {
    "id": "vajrapani-bodhisattva-mantra",
    "titleZh": "金刚手菩萨（秘密主）大势降魔心咒",
    "aliasesZh": "金刚手菩萨心咒,秘密主心咒,执金刚菩萨咒,嗡班杂巴尼吽呸",
    "titleSanskritIast": "Vajrapāṇi-Guhyapati-Hṛdaya-Mantra",
    "titleEnglish": "Heart Mantra of Vajrapāṇi Bodhisattva (Lord of Secrets)",
    "categoryId": "buddhas-bodhisattvas",
    "taishoNo": "T20n1125 / T18n0848",
    "translatorZh": "（唐）不空 译",
    "sutraSourceZh": "《金刚手光明灌顶经最胜立印圣无动尊大威怒王念诵仪轨》及《大日经》(T18n0848)",
    "deityZh": "金刚手菩萨 · 秘密主 (Vajrapāṇi Bodhisattva)",
    "meritsAndSummaryZh": "十方三世一切诸佛大威神力总集、密教结集主尊金刚手菩萨独立根本心咒，遣除怯弱魔障、坚固菩提道心。",
    "verses": [
      {
        "iast": "oṃ vajrapāṇi hūṃ phaṭ",
        "classicalTranslitZh": "唵 嚩日啰波抳 吽 发吒",
        "meaningZh": "嗡！执持金刚杵之秘密主菩萨，以诸佛大力摧灭一切魔军与内外障碍！",
        "meaningEn": "Heart Mantra of Vajrapāṇi (Lord of Secrets & Power): Oṃ vajrapāṇi hūṃ phaṭ!"
      }
    ]
  },
  {
    "id": "sarvanivaranaviskambhin-mantra",
    "titleZh": "除盖障菩萨净除五盖业障真言",
    "aliasesZh": "除盖障菩萨心咒,净除一切盖障真言",
    "titleSanskritIast": "Sarvanīvaraṇaviṣkambhin-Bodhisattva-Mantra",
    "titleEnglish": "Obstacle-Clearing Mantra of Sarvanīvaraṇaviṣkambhin Bodhisattva",
    "categoryId": "buddhas-bodhisattvas",
    "taishoNo": "T18n0848 / T20n1167",
    "translatorZh": "（唐）善无畏 译",
    "sutraSourceZh": "《大毗卢遮那成佛神变加持经》卷二除盖障院真言 (T18n0848)",
    "deityZh": "八大菩萨之一 · 除盖障菩萨 (Sarvanīvaraṇaviṣkambhin)",
    "meritsAndSummaryZh": "《大日经》胎藏界除盖障院主尊独立真言，专除贪欲、瞋恚、睡眠、掉悔、疑五盖及烦恼所知二障。",
    "verses": [
      {
        "iast": "namaḥ samantabuddhānāṃ aḥ sattvahitābhyudgata traṃ traṃ raṃ raṃ svāhā",
        "classicalTranslitZh": "曩莫 三曼多没驮喃 噁 萨怛嚩呬多毘庾讷蘖多 怛蓝 怛蓝 览 览 娑嚩贺",
        "meaningZh": "归命普遍诸佛！阿！为饶益一切有情而涌现之大士，净除一切重障垢染，圆满吉祥！",
        "meaningEn": "Garbhadhātu Mantra of Sarvanīvaraṇaviṣkambhin Bodhisattva (T18n0848)."
      }
    ]
  },
  {
    "id": "mahavairocana-garbhadhatu-mantra",
    "titleZh": "毗卢遮那佛（大日如来）胎藏界五字明真言",
    "aliasesZh": "大日如来心咒,毗卢遮那佛心咒,胎藏界五字真言,阿尾啰吽欠",
    "titleSanskritIast": "Mahāvairocana-Garbhadhātu-Pañcākṣara-Mantra",
    "titleEnglish": "Garbhadhātu Five-Element Root Mantra of Mahāvairocana Buddha",
    "categoryId": "buddhas-bodhisattvas",
    "taishoNo": "T18n0848",
    "translatorZh": "（唐）善无畏 共一行 译",
    "sutraSourceZh": "《大毗卢遮那成佛神变加持经》卷二真言藏品 (T18n0848)",
    "deityZh": "法身毗卢遮那如来 · 大日如来 (Mahāvairocana)",
    "meritsAndSummaryZh": "《大日经》最上根本满足一切智智五字真言（a vi ra hūṃ khaṃ），地水火风空五大当体即入法界体性智。",
    "verses": [
      {
        "iast": "namaḥ samantabuddhānāṃ a vi ra hūṃ khaṃ",
        "classicalTranslitZh": "曩莫 三曼多没驮喃 阿 尾 啰 吽 欠",
        "meaningZh": "归命普遍一切诸佛！地（阿）、水（尾）、火（啰）、风（吽）、空（欠）五大法界体性本不生，证一切智智！",
        "meaningEn": "Mahāvairocana Garbhadhātu Five-Element Mantra (T18n0848)."
      }
    ]
  },
  {
    "id": "mahavairocana-vajradhatu-mantra",
    "titleZh": "毗卢遮那佛（大日如来）金刚界一字心真言",
    "aliasesZh": "金刚界大日如来心咒,鑁字真言,嗡缚日啰驮都鑁",
    "titleSanskritIast": "Mahāvairocana-Vajradhātu-Ekākṣara-Mantra",
    "titleEnglish": "Vajradhātu One-Syllable Heart Mantra of Mahāvairocana",
    "categoryId": "buddhas-bodhisattvas",
    "taishoNo": "T18n0865",
    "translatorZh": "（唐）不空 译",
    "sutraSourceZh": "《金刚顶一切如来真实摄大乘现证大教王经》(T18n0865)",
    "deityZh": "金刚界大日如来 (Vajradhātu Mahāvairocana)",
    "meritsAndSummaryZh": "金刚顶经智法身大日如来最胜一字心真言，总摄金刚界三十七尊五智菩提海。",
    "verses": [
      {
        "iast": "oṃ vajradhātu vaṃ",
        "classicalTranslitZh": "唵 嚩日啰驮都 鑁",
        "meaningZh": "嗡！契入坚固不坏金刚界五智法身，鑁（智水周遍法界）！",
        "meaningEn": "Mahāvairocana Vajradhātu Heart Mantra: Oṃ vajradhātu vaṃ!"
      }
    ]
  },
  {
    "id": "ratnasambhava-buddha-mantra",
    "titleZh": "南方宝生如来平等性智根本心咒",
    "aliasesZh": "宝生佛心咒,南方宝生如来真言",
    "titleSanskritIast": "Ratnasambhava-Tathāgata-Hṛdaya-Mantra",
    "titleEnglish": "Heart Mantra of Ratnasambhava Buddha of the South",
    "categoryId": "buddhas-bodhisattvas",
    "taishoNo": "T18n0865",
    "translatorZh": "（唐）不空 译",
    "sutraSourceZh": "《金刚顶一切如来真实摄大乘现证大教王经》(T18n0865)",
    "deityZh": "南方欢喜宝庄严世界 · 宝生如来 (Ratnasambhava)",
    "meritsAndSummaryZh": "五方佛之南方宝生如来独立根本真言，转我慢烦恼为平等性智，圆满福德摩尼宝藏。",
    "verses": [
      {
        "iast": "oṃ ratnasambhava trāḥ",
        "classicalTranslitZh": "唵 啰怛曩三婆嚩 怛啰",
        "meaningZh": "嗡！三宝功德出生之宝生如来，以平等性智普施一切众生如意法宝，怛啰！",
        "meaningEn": "Heart Mantra of Ratnasambhava Tathāgata: Oṃ ratnasambhava trāḥ!"
      }
    ]
  },
  {
    "id": "amoghasiddhi-buddha-mantra",
    "titleZh": "北方不空成就如来成所作智根本心咒",
    "aliasesZh": "不空成就佛心咒,北方不空成就如来真言",
    "titleSanskritIast": "Amoghasiddhi-Tathāgata-Hṛdaya-Mantra",
    "titleEnglish": "Heart Mantra of Amoghasiddhi Buddha of the North",
    "categoryId": "buddhas-bodhisattvas",
    "taishoNo": "T18n0865",
    "translatorZh": "（唐）不空 译",
    "sutraSourceZh": "《金刚顶一切如来真实摄大乘现证大教王经》(T18n0865)",
    "deityZh": "北方胜业净土 · 不空成就如来 (Amoghasiddhi)",
    "meritsAndSummaryZh": "五方佛之北方不空成就如来独立根本真言，转嫉妒烦恼为成所作智，令一切菩提善业不空圆满。",
    "verses": [
      {
        "iast": "oṃ amoghasiddhi āḥ",
        "classicalTranslitZh": "唵 阿谟伽悉地 噁",
        "meaningZh": "嗡！无空过妙业圆满之不空成就如来，净除一切障嫉，成办利生大业，阿！",
        "meaningEn": "Heart Mantra of Amoghasiddhi Tathāgata: Oṃ amoghasiddhi āḥ!"
      }
    ]
  },
  {
    "id": "amitayus-amarani-mantra",
    "titleZh": "长寿佛（无量寿智如来）延命短心咒",
    "aliasesZh": "长寿佛心咒,无死长寿如来心咒,嗡阿玛拉尼祖弯帝耶梭哈",
    "titleSanskritIast": "Amitāyus-Amaraṇi-Jīvantī-Hṛdaya-Mantra",
    "titleEnglish": "Immortal Longevity Short Heart Mantra of Amitāyus Buddha",
    "categoryId": "buddhas-bodhisattvas",
    "taishoNo": "T19n0937 梵藏心咒对勘",
    "translatorZh": "莲花生大士 / 马头金刚与长寿三尊传承",
    "sutraSourceZh": "《圣无量寿智大乘陀罗尼经》心要传承",
    "deityZh": "报身无量寿智如来 · 长寿佛 (Amitāyus)",
    "meritsAndSummaryZh": "长寿三尊之主尊长寿佛独立延命短心咒，勾招散失之寿元与四大精华，获无死智慧金刚寿命。",
    "verses": [
      {
        "iast": "oṃ amaraṇi jīvantīye svāhā",
        "classicalTranslitZh": "唵 阿摩啰抳 耆嚩底曳 娑嚩贺",
        "meaningZh": "嗡！赐予不死甘露与蓬勃慧命之无量寿尊，护持寿命坚固绵长，圆满吉祥！",
        "meaningEn": "Short Longevity Heart Mantra of Amitāyus Buddha: Oṃ amaraṇi jīvantīye svāhā!"
      }
    ]
  },
  {
    "id": "bhaisajyaguru-dvadasa-yaksa-mantra",
    "titleZh": "药师琉璃光如来十二药叉大将守护真言",
    "aliasesZh": "药师十二神将咒,十二药叉大将真言,宫毗罗等十二神将名号咒",
    "titleSanskritIast": "Bhaiṣajyaguru-Dvādaśa-Mahāyakṣasenāpati-Mantra",
    "titleEnglish": "Protective Mantra of the Twelve Great Yakṣa Generals of Bhaiṣajyaguru",
    "categoryId": "vidyarajas-protectors",
    "taishoNo": "T14n0450 / GRETIL bhaissu.htm",
    "translatorZh": "（唐）玄奘 译 · 吉尔吉特梵本《Bhaiṣajyagurusūtra》对勘",
    "sutraSourceZh": "《药师琉璃光如来本愿功德经》(T14n0450)",
    "deityZh": "宫毗罗、伐折罗等药师十二药叉大将",
    "meritsAndSummaryZh": "《药师经》所载十二药叉大将各自统领七千药叉眷属，昼夜十二时辰轮流拥护受持药师琉璃光如来名号行者，解脱一切苦难厄结。",
    "verses": [
      {
        "iast": "oṃ kumbhīra vajra mihira aṇḍīra anila śaṇḍilya indra pajra mahoraga sindūra catura vikala svāhā",
        "classicalTranslitZh": "唵 宫毗罗 伐折罗 迷企罗 安底罗 頞你罗 珊底罗 因达罗 波夷罗 摩虎罗 真达罗 招杜罗 毗羯罗 娑嚩贺",
        "meaningZh": "嗡！召请宫毗罗、伐折罗、迷企罗、安底罗、頞你罗、珊底罗、因达罗、波夷罗、摩虎罗、真达罗、招杜罗、毗羯罗十二大药叉神将昼夜护持，消灾吉祥！",
        "meaningEn": "Invocation Mantra of the Twelve Yakṣa Generals from the Bhaiṣajyaguru Sūtra."
      }
    ]
  },
  {
    "id": "avatamsaka-catvarimsad-aksara-dharani",
    "titleZh": "《大方广佛华严经》善财童子四十二字般若门陀罗尼",
    "aliasesZh": "华严四十二字门,四十二字陀罗尼门,阿字门,般若四十二字门",
    "titleSanskritIast": "Gaṇḍavyūha-Catvāriṃśad-Dvyakṣara-Prajñāmukha-Dhāraṇī",
    "titleEnglish": "Forty-Two Syllable Prajñāpāramitā Gate Dhāraṇī from the Gaṇḍavyūha Sūtra",
    "categoryId": "prajna-sutra-hrdaya",
    "taishoNo": "T10n0279 / T10n0293 / GRETIL bsu037_u.htm",
    "translatorZh": "（唐）实叉难陀 / 般若 译 · GRETIL 梵本《Gaṇḍavyūhasūtra》对勘",
    "sutraSourceZh": "《大方广佛华严经·入法界品》善知众艺童子章 (T10n0279)",
    "deityZh": "毗卢遮那如来 · 善知众艺童子 · 善财童子",
    "meritsAndSummaryZh": "《华严经·入法界品》善知众艺童子传授善财童子之四十二字般若波罗蜜门，唱阿字至荼字每一音皆契入无量法界解脱海。",
    "verses": [
      {
        "iast": "a ra pa ca na la da ba ḍa ṣa va ta ya ṣṭa ka sa ma ga stha ja śva dha śa kha kṣa sta jña rtha bha cha sma hva tsa gha ṭha ṇa pha ska ysa śca ṭa ḍha",
        "classicalTranslitZh": "阿 多 波 左 那 逻 柁 婆 茶 沙 嚩 多 耶 瑟吒 迦 娑 摩 伽 他 阇 室嚩 陀 奢 佉 叉 娑多 若 曷攞多 婆 车 娑摩 诃嚩 縒 伽 吒 拏 颇 娑迦 也娑 室左 侘 陀",
        "meaningZh": "唱阿字入一切法本不生般若门，乃至唱侘、陀字入一切法无尽究竟寂静般若波罗蜜门！",
        "meaningEn": "The Forty-Two Syllables Gate of Prajñāpāramitā from the Gaṇḍavyūha Sūtra (bsu037_u.htm)."
      }
    ]
  },
  {
    "id": "lankavatara-sutra-dharani",
    "titleZh": "《入楞伽经·陀罗尼品》护持正法首章陀罗尼",
    "aliasesZh": "楞伽经陀罗尼,入楞伽经咒,大乘入楞伽经陀罗尼",
    "titleSanskritIast": "Laṅkāvatāra-Sūtra-Dhāraṇī",
    "titleEnglish": "Protective Dhāraṇī from Chapter 9 of the Laṅkāvatāra Sūtra",
    "categoryId": "prajna-sutra-hrdaya",
    "taishoNo": "T16n0671 / T16n0672 / GRETIL bsu026_u.htm",
    "translatorZh": "（元魏）菩提流支 / （唐）实叉难陀 译 · 南条文雄校勘梵本《Laṅkāvatārasūtra》对勘",
    "sutraSourceZh": "《入楞伽经》卷八《陀罗尼品第十六》(T16n0671)",
    "deityZh": "本师释迦牟尼佛 · 大慧菩萨摩诃萨",
    "meritsAndSummaryZh": "世尊于楞伽山顶为大慧菩萨宣说之护持唯识如来藏正法陀罗尼，受持读诵此章句者，一切外道恶魔夜叉罗刹不能得便。",
    "verses": [
      {
        "iast": "tadyathā | padme padmadeve sadāmejinī rane raṇajite svāhā",
        "classicalTranslitZh": "但界他 钵头摩 钵头摩提婆 萨陀迷支尼 啰泥 啰那支提 莎诃",
        "meaningZh": "即说咒曰：清净莲花、莲花天尊、常胜智慧母、于烦恼战阵中获究竟胜解者，圆满成就！",
        "meaningEn": "Opening Dhāraṇī from Chapter 9 of the Laṅkāvatāra Sūtra (GRETIL bsu026_u.htm)."
      }
    ]
  },
  {
    "id": "tsongkhapa-migtsema-mantra",
    "titleZh": "宗喀巴大师（善慧名称吉祥）祈请心咒",
    "aliasesZh": "宗喀巴大师心咒,密集嘛心咒,善慧名称吉祥咒",
    "titleSanskritIast": "Guru-Sumatikīrti-Vajradhara-Mantra",
    "titleEnglish": "Heart Mantra of Je Tsongkhapa (Sumatikīrti)",
    "categoryId": "buddhas-bodhisattvas",
    "taishoNo": "格鲁派上师瑜伽梵藏对勘本",
    "translatorZh": "文殊菩萨亲传 · 宗喀巴大师（洛桑扎巴）传规",
    "sutraSourceZh": "《兜率百尊上师瑜伽》",
    "deityZh": "三部主合一 · 宗喀巴大师 (Je Tsongkhapa / Sumatikīrti)",
    "meritsAndSummaryZh": "观音大悲、文殊大智、金刚手大力三尊合一之宗喀巴大师（梵号善慧名称吉祥 Sumatikīrti）独立智慧心咒，开显中观正见与广大辩才。",
    "verses": [
      {
        "iast": "oṃ āḥ guru vajradhara sumatikīrti siddhi hūṃ hūṃ",
        "classicalTranslitZh": "唵 噁 具噜 嚩日啰驮啰 苏摩底枳哩底 悉地 吽 吽",
        "meaningZh": "嗡、阿！祈请金刚总持上师善慧名称吉祥尊，赐予显密双运胜共悉地，吽吽！",
        "meaningEn": "Heart Mantra of Je Tsongkhapa (Sumatikīrti): Oṃ āḥ guru vajradhara sumatikīrti siddhi hūṃ hūṃ!"
      }
    ]
  },
  {
    "id": "rgveda-savitr-gayatri-mantra",
    "titleZh": "《梨俱吠陀》娑维特里伽耶特黎圣咒（Gāyatrī Mantra）",
    "aliasesZh": "伽耶特黎咒,吠陀之母,太阳神咒,萨维特里真言,Gayatri Mantra,Savitri Mantra,Rigveda 3.62.10",
    "titleSanskritIast": "Ṛgveda-Sāvitrī-Gāyatrī-Mantra",
    "titleEnglish": "The Vedic Gāyatrī Mantra (Ṛgveda 3.62.10)",
    "categoryId": "vedic-tantra-siddhanta",
    "taishoNo": "Ṛgveda 3.62.10 (GRETIL rv_au_u.htm)",
    "translatorZh": "众友仙人（Viśvāmitra Ṛṣi）传诵 · Aufrecht / van Nooten 梵本校勘",
    "sutraSourceZh": "《梨俱吠陀本集（Ṛgveda-Saṃhitā）》第 3 卷 62 首 10 颂",
    "deityZh": "太阳创造神娑维特里 (Savitar)",
    "meritsAndSummaryZh": "人类现存最古老梵文圣典《梨俱吠陀》3.62.10 所载最高核心圣咒，被尊为「吠陀之母（Vedamātā）」，含三界大宣说词与二十四音节娑维特里光明祈请颂。",
    "verses": [
      {
        "iast": "oṃ bhūr bhuvaḥ svaḥ | tat savitur vareṇyaṃ bhargo devasya dhīmahi | dhiyo yo naḥ pracodayāt",
        "classicalTranslitZh": "唵 婆卢 婆嚩 娑嚩 | 怛 萨尾睹哩 嚩隶尼也 婆啰伽 提嚩写 提摩醯 | 提瑜 瑜 那 钵啰祖那夜",
        "meaningZh": "嗡！遍满地界、空界、天界！我等至心禅思彼太阳创造神娑维特里最胜崇高之神圣净光，愿彼圣光启发并引导我等之灵性智慧！",
        "meaningEn": "Oṃ Bhūr Bhuvaḥ Svaḥ! We meditate upon that supreme, adorable effulgence of the divine Vivifier Savitar; may He illuminate and inspire our intellects! (Ṛgveda 3.62.10)"
      }
    ]
  },
  {
    "id": "rgveda-agni-sukta-mantra",
    "titleZh": "《梨俱吠陀》开篇第一颂圣火阿耆尼礼赞颂",
    "aliasesZh": "梨俱吠陀第一颂,阿耆尼赞,圣火真言,Agnim Ide Purohitam,Rigveda 1.1.1",
    "titleSanskritIast": "Ṛgveda-Agni-Sūkta-Prathama-Mantra",
    "titleEnglish": "Opening Agni Invocation of the Ṛgveda (1.1.1)",
    "categoryId": "vedic-tantra-siddhanta",
    "taishoNo": "Ṛgveda 1.1.1 (GRETIL rv_au_u.htm)",
    "translatorZh": "蜜多罗湿婆仙人（Madhucchandas Vaiśvāmitra）传诵",
    "sutraSourceZh": "《梨俱吠陀本集（Ṛgveda-Saṃhitā）》第 1 卷 1 首 1 颂",
    "deityZh": "圣火天尊阿耆尼 (Agni)",
    "meritsAndSummaryZh": "整部《梨俱吠陀》开宗明义第一颂，礼赞连接人天两界之光明智慧圣火阿耆尼。",
    "verses": [
      {
        "iast": "agnim īḍe purohitaṃ yajñasya devam ṛtvijam | hotāraṃ ratnadhātamam",
        "classicalTranslitZh": "阿耆尼 伊礼 补噜醯多 夜若写 提嚩 讫哩得尾瞻 | 呼多蓝 啰怛那陀多摩",
        "meaningZh": "我礼赞圣火阿耆尼——祭礼之首座导师、神圣之主祭司、召请诸神且最富妙宝之施主！",
        "meaningEn": "I praise Agni, the household priest, the divine minister of the sacrifice, the invoker who bestows supreme treasures. (Ṛgveda 1.1.1)"
      }
    ]
  },
  {
    "id": "rgveda-samjnana-unity-mantra",
    "titleZh": "《梨俱吠陀》压卷同心和合真言（Saṃjñāna Mantra）",
    "aliasesZh": "同心和合咒,梨俱吠陀结尾颂,Sam Gacchadhvam,Samjnana Sukta",
    "titleSanskritIast": "Ṛgveda-Saṃjñāna-Ekya-Mantra",
    "titleEnglish": "Vedic Mantra of Harmony and Unity (Ṛgveda 10.191.2–3)",
    "categoryId": "vedic-tantra-siddhanta",
    "taishoNo": "Ṛgveda 10.191.2–3 (GRETIL rv_au_u.htm)",
    "translatorZh": "三婆那仙人（Saṃvanana Āṅgirasa）传诵",
    "sutraSourceZh": "《梨俱吠陀本集（Ṛgveda-Saṃhitā）》第 10 卷 191 首 2–3 颂",
    "deityZh": "和合圣众之灵光",
    "meritsAndSummaryZh": "《梨俱吠陀》全十卷最末收束压卷真言，祈愿大众偕行共进、言辞和睦、心智融通如一。",
    "verses": [
      {
        "iast": "saṃ gacchadhvaṃ saṃ vadadhvaṃ saṃ vo manāṃsi jānatām | samāno mantraḥ samitiḥ samānī samānaṃ manaḥ saha cittam eṣām",
        "classicalTranslitZh": "三 伽车特嚩 三 嚩那特嚩 三 嚩 摩难悉 惹那担 | 三摩奴 曼怛啰 三弥底 三摩尼 三摩南 摩那 萨诃 质多 翳衫",
        "meaningZh": "愿尔等偕行共进，和合共语，心意相通如一！同持真言，同聚圣会，心志合一，慧念融通！",
        "meaningEn": "Walk together in harmony, speak together in harmony, let your minds know unity; united be your mantra, united your assembly, united your mind and consciousness! (Ṛgveda 10.191.2–3)"
      }
    ]
  },
  {
    "id": "rgveda-mahamrtyunjaya-mantra",
    "titleZh": "《梨俱吠陀》三目尊大胜死长寿解脱真言（Mahāmṛtyuñjaya）",
    "aliasesZh": "大胜死咒,三目湿婆长寿咒,摩诃木提云佳亚咒,超越死亡真言,Mahamrityunjaya Mantra,Tryambakam Mantra",
    "titleSanskritIast": "Ṛgveda-Tryambaka-Mahāmṛtyuñjaya-Mantra",
    "titleEnglish": "The Great Death-Conquering Mantra (Ṛgveda 7.59.12)",
    "categoryId": "vedic-tantra-siddhanta",
    "taishoNo": "Ṛgveda 7.59.12 (GRETIL rv_au_u.htm)",
    "translatorZh": "婆私吒仙人（Vasiṣṭha Ṛṣi）传诵",
    "sutraSourceZh": "《梨俱吠陀》第 7 卷 59 首 12 颂",
    "deityZh": "三目甘露胜死尊 (Tryambaka Rudra)",
    "meritsAndSummaryZh": "出自《梨俱吠陀》7.59.12 之印度最高疗愈延寿圣咒，喻如熟瓜自然脱离藤蔓束缚，祈愿远离横死病厄、证入不死甘露解脱。",
    "verses": [
      {
        "iast": "tryambakaṃ yajāmahe sugandhiṃ puṣṭivardhanam | urvārukam iva bandhanān mṛtyor mukṣīya māmṛtāt",
        "classicalTranslitZh": "怛哩焰婆剑 也惹摩醯 苏健廷 补瑟置嚩啰陀南 | 乌啰嚩噜剑 伊嚩 盘陀难 蜜栗底瑜 目吃史也 摩蜜栗多",
        "meaningZh": "我等虔诚礼敬三目圣尊——芬芳遍满、增益生命福德滋养者！愿我如成熟甜瓜自然脱离瓜藤般，从死亡束缚中解脱，而永不远离不死甘露自性！",
        "meaningEn": "We worship the Three-Eyed One (Tryambaka), fragrant and nourishing all beings; like a ripe cucumber released from its stem, may I be liberated from death, never from immortality! (Ṛgveda 7.59.12)"
      },
      {
        "iast": "oṃ hrauṃ jūṃ saḥ | oṃ bhūr bhuvaḥ svaḥ | tryambakaṃ yajāmahe sugandhiṃ puṣṭivardhanam | urvārukam iva bandhanān mṛtyor mukṣīya māmṛtāt | oṃ svaḥ bhuvaḥ bhūḥ | oṃ saḥ jūṃ hrauṃ oṃ",
        "classicalTranslitZh": "唵 诃哢 戎 萨 | 唵 婆卢 婆嚩 娑嚩 | 怛哩焰婆剑 也惹摩醯 苏健廷 补瑟置嚩啰陀南 | 乌啰嚩噜剑 伊嚩 盘陀难 蜜栗底瑜 目吃史也 摩蜜栗多 | 唵 娑嚩 婆嚩 婆卢 | 唵 萨 戎 诃哢 唵",
        "meaningZh": "前后以甘露长寿种子字「oṃ hrauṃ jūṃ saḥ」及三界大宣说词双向结界护持之完整修持轨（Saṃpuṭita），专用于祛疾延寿。",
        "meaningEn": "Full Encased (Saṃpuṭita) Mahāmṛtyuñjaya Mantra with the immortalizing bīja-cluster Oṃ Hrauṃ Jūṃ Saḥ."
      }
    ]
  },
  {
    "id": "yajurveda-sri-rudram-namakam",
    "titleZh": "《黑夜柔吠陀·Śrī Rudram》大天十一尊号顶礼咒",
    "aliasesZh": "室利楼陀罗赞,十一尊号顶礼咒,Sri Rudram Namakam",
    "titleSanskritIast": "Taittirīya-Śrī-Rudra-Ekādaśa-Namaskāra-Mantra",
    "titleEnglish": "Eleven-Epithet Salutation of Śrī Rudram (Taittirīya Saṃhitā 4.5)",
    "categoryId": "vedic-tantra-siddhanta",
    "taishoNo": "Taittirīya Saṃhitā 4.5 (GRETIL ts_u.htm)",
    "translatorZh": "黑夜柔吠陀泰帝利耶学派 传诵",
    "sutraSourceZh": "《黑夜柔吠陀·泰帝利耶本集》4.5《Śrī Rudram》开篇礼敬文",
    "deityZh": "吉祥楼陀罗大天 (Śrī Rudra-Mahādeva)",
    "meritsAndSummaryZh": "《黑夜柔吠陀》核心《Śrī Rudram》传统开篇十一尊号顶礼咒，圆满无省字收录全部十一尊德名号。",
    "verses": [
      {
        "iast": "namas te astu bhagavan viśveśvarāya mahādevāya tryambakāya tripurāntakāya trikālāgnikālāya kālāgnirudrāya nīlakaṇṭhāya mṛtyuñjayāya sarveśvarāya sadāśivāya śrīmanmahādevāya namaḥ",
        "classicalTranslitZh": "曩莫 娑帝 阿娑睹 婆誐梵 尾室吠室嚩啰也 摩诃提嚩也 怛哩焰婆迦也 怛哩补烂多迦也 怛哩迦攞耆尼迦攞也 迦攞耆尼噜捺啰也 尼攞建侘也 蜜栗底匀惹也也 萨嚩伊室嚩啰也 萨陀尸嚩也 室哩曼摩诃提嚩也 曩莫",
        "meaningZh": "顶礼世尊、宇宙之主、大天、三目尊、破三城尊、三时劫火尊、劫火楼陀罗尊、青颈尊、胜死尊、一切自在尊、常住吉祥大天！",
        "meaningEn": "Śrī Rudram Eleven-Epithet Salutation to Viśveśvara, Mahādeva, Tryambaka, Tripurāntaka, Trikālāgnikāla, Kālāgnirudra, Nīlakaṇṭha, Mṛtyuñjaya, Sarveśvara, Sadāśiva, and Śrīman-Mahādeva."
      }
    ]
  },
  {
    "id": "upanisad-pavamana-santi-mantra",
    "titleZh": "《广林奥义书》净心升华吉祥和平咒（Pavamāna Mantra）",
    "aliasesZh": "帕瓦玛纳咒,导我向真实咒,导我向光明咒,Asato Ma Sad Gamaya",
    "titleSanskritIast": "Bṛhadāraṇyaka-Pavamāna-Śānti-Mantra",
    "titleEnglish": "The Pavamāna Mantra: Lead Me from the Unreal to the Real (Bṛhadāraṇyaka 1.3.28)",
    "categoryId": "vedic-tantra-siddhanta",
    "taishoNo": "Bṛhadāraṇyaka Upaniṣad 1.3.28 (GRETIL)",
    "translatorZh": "古印度森林哲人仙人 传授 · Olivelle 梵本校勘",
    "sutraSourceZh": "《广林奥义书（Bṛhadāraṇyaka Upaniṣad）》1.3.28",
    "deityZh": "最高实相光明 (Sat-Jyotis-Amṛta)",
    "meritsAndSummaryZh": "《广林奥义书》1.3.28 著名三句祈祷圣咒，祈愿从虚妄证入真实、从无明黑暗证入般若光明、从生死束缚证入不死甘露。",
    "verses": [
      {
        "iast": "oṃ asato mā sad gamaya | tamaso mā jyotir gamaya | mṛtyor mā amṛtaṃ gamaya | oṃ śāntiḥ śāntiḥ śāntiḥ",
        "classicalTranslitZh": "唵 阿萨睹 摩 萨 伽摩也 | 多摩苏 摩 殊底 伽摩也 | 蜜栗底瑜 摩 阿蜜栗多 伽摩也 | 唵 扇底 扇底 扇底",
        "meaningZh": "嗡！祈导我从虚妄走向真实，导我从黑暗走向光明，导我从死亡走向不死甘露！嗡，寂静、寂静、寂静！",
        "meaningEn": "Oṃ! Lead me from the unreal to the Real; lead me from darkness to Light; lead me from death to Immortality! Oṃ Peace, Peace, Peace! (Bṛhadāraṇyaka Upaniṣad 1.3.28)"
      }
    ]
  },
  {
    "id": "upanisad-purnamadah-santi-mantra",
    "titleZh": "《伊沙奥义书》圆满不二吉祥和平咒（Pūrṇam Adaḥ）",
    "aliasesZh": "圆满咒,伊沙奥义书开篇和平咒,Purnam Adah Purnam Idam",
    "titleSanskritIast": "Īśāvāsya-Pūrṇam-Adaḥ-Śānti-Mantra",
    "titleEnglish": "Invocation of Wholeness (Pūrṇam Adaḥ, Īśā / Bṛhadāraṇyaka 5.1.1)",
    "categoryId": "vedic-tantra-siddhanta",
    "taishoNo": "Īśā Upaniṣad / Bṛhadāraṇyaka 5.1.1 (GRETIL)",
    "translatorZh": "白夜柔吠陀奥义书传人 传诵",
    "sutraSourceZh": "《伊沙奥义书（Īśā Upaniṣad）》开篇和平颂",
    "deityZh": "圆满不二本源",
    "meritsAndSummaryZh": "白夜柔吠陀系奥义书开篇和平咒，宣示超越界与显现界本自圆满无缺之不二实相。",
    "verses": [
      {
        "iast": "oṃ pūrṇam adaḥ pūrṇam idaṃ pūrṇāt pūrṇam udacyate | pūrṇasya pūrṇam ādāya pūrṇam evāvaśiṣyate | oṃ śāntiḥ śāntiḥ śāntiḥ",
        "classicalTranslitZh": "唵 补啰拏 阿那 补啰拏 伊南 补啰拏 补啰拏 乌那遮帝 | 补啰拏写 补啰拏 阿陀也 补啰拏 翳嚩嚩尸沙帝 | 唵 扇底 扇底 扇底",
        "meaningZh": "嗡！彼是圆满，此亦是圆满；由圆满中生起圆满；即便从圆满中取走圆满，所余依然纯粹圆满！嗡，寂静、寂静、寂静！",
        "meaningEn": "Oṃ! That is Full; this is Full; from Fullness, Fullness arises. When Fullness is taken from Fullness, Fullness alone remains! Oṃ Peace, Peace, Peace!"
      }
    ]
  },
  {
    "id": "upanisad-sahanavavatu-santi-mantra",
    "titleZh": "《泰帝利耶奥义书》师徒共修吉祥和平咒（Saha Nāv Avatu）",
    "aliasesZh": "师生共修和平咒,卡塔奥义书开篇咒,Saha Nav Avatu",
    "titleSanskritIast": "Taittirīya-Sahanāvavatu-Śānti-Mantra",
    "titleEnglish": "Teacher-Disciple Peace Invocation (Saha Nāv Avatu, Taittirīya / Kaṭha)",
    "categoryId": "vedic-tantra-siddhanta",
    "taishoNo": "Taittirīya Upaniṣad 2.1 / Kaṭha Upaniṣad (GRETIL)",
    "translatorZh": "黑夜柔吠陀森林学派 传诵",
    "sutraSourceZh": "《泰帝利耶奥义书》与《卡塔奥义书》开篇和平颂",
    "deityZh": "最高圣智光明",
    "meritsAndSummaryZh": "印度传统讲学共修前师徒同诵之吉祥和平咒，祈愿师徒同蒙护佑、勇猛精进、慧解光明、永无乖诤。",
    "verses": [
      {
        "iast": "oṃ saha nāv avatu | saha nau bhunaktu | saha vīryaṃ karavāvahai | tejasvi nāv adhītam astu mā vidviṣāvahai | oṃ śāntiḥ śāntiḥ śāntiḥ",
        "classicalTranslitZh": "唵 萨诃 脑 阿嚩睹 | 萨诃 脑 婆那讫睹 | 萨诃 尾哩也 迦啰嚩嚩海 | 帝惹娑尾 脑 阿提多 阿娑睹 摩 尾捺尾沙嚩海 | 唵 扇底 扇底 扇底",
        "meaningZh": "嗡！愿圣道同护我师徒二人，同赐资养，同发勇猛精进；愿我等所学光明辉煌，永不生丝毫乖违嗔嫌！嗡，寂静、寂静、寂静！",
        "meaningEn": "Oṃ! May It protect us both together; may It nourish us both; may we work together with great vigor; may our study be luminous and effective; may we never harbor animosity!"
      }
    ]
  },
  {
    "id": "upanisad-bhadram-karnebhih-mantra",
    "titleZh": "《蒙达卡奥义书》吉祥听闻和平咒（Bhadraṃ Karṇebhiḥ）",
    "aliasesZh": "耳闻吉祥和平咒,蛙氏奥义书和平咒,Bhadram Karnebhih",
    "titleSanskritIast": "Muṇḍaka-Bhadraṃ-Karṇebhiḥ-Śānti-Mantra",
    "titleEnglish": "Auspicious Perception Peace Mantra (Ṛgveda 1.89.8 / Muṇḍaka Upaniṣad)",
    "categoryId": "vedic-tantra-siddhanta",
    "taishoNo": "Ṛgveda 1.89.8 / Muṇḍaka Upaniṣad (GRETIL)",
    "translatorZh": "乔答摩仙人（Gotama Rāhūgaṇa）传诵",
    "sutraSourceZh": "《梨俱吠陀》1.89.8 ·《蒙达卡奥义书》《蛙氏奥义书》开篇和平颂",
    "deityZh": "一切诸天善神 (Viśvedevāḥ)",
    "meritsAndSummaryZh": "阿闼婆吠陀系《蒙达卡奥义书》与《蛙氏奥义书》开篇和平咒，祈愿耳闻善音、目睹瑞相、四大康健、寿慧圆满。",
    "verses": [
      {
        "iast": "oṃ bhadraṃ karṇebhiḥ śṛṇuyāma devāḥ | bhadraṃ paśyemākṣabhir yajatrāḥ | sthirair aṅgais tuṣṭuvāṃsas tanūbhir vyaśema devahitaṃ yad āyuḥ | oṃ śāntiḥ śāntiḥ śāntiḥ",
        "classicalTranslitZh": "唵 跋捺蓝 羯尼毗 室哩努夜摩 提嚩 | 跋捺蓝 钵尸摩叉毗 也惹怛啰 | 娑体赖 盎盖 睹瑟睹嚩萨 怛努毗 尾也尸摩 提嚩醯多 也 阿庾 | 唵 扇底 扇底 扇底",
        "meaningZh": "嗡！诸天圣众啊，愿我等双耳唯闻吉祥正音，双目唯见善妙瑞相；肢体康健赞咏圣德，圆满享有天赐慧命！嗡，寂静、寂静、寂静！",
        "meaningEn": "Oṃ! O Gods, may we hear with our ears what is auspicious; O Worshipful Ones, may we see with our eyes what is auspicious; with firm limbs may we enjoy our divinely allotted life!"
      }
    ]
  },
  {
    "id": "ganapati-vakratunda-prarthana",
    "titleZh": "《象头神脑顶奥义书》伽那钵底曲鼻大身除障祈请咒",
    "aliasesZh": "象头神除障咒,曲鼻大身祈请颂,Vakratunda Mahakaya,Ganapati Atharvasirsa",
    "titleSanskritIast": "Śrī-Gaṇapati-Vakratuṇḍa-Nirvighna-Mantra",
    "titleEnglish": "Vakratuṇḍa Obstacle-Removing Prayer & Gaṇeśa Gāyatrī",
    "categoryId": "vedic-tantra-siddhanta",
    "taishoNo": "Gaṇapati Atharvaśīrṣa Upaniṣad (GRETIL)",
    "translatorZh": "阿闼婆仙人（Atharvan Ṛṣi）传诵",
    "sutraSourceZh": "《阿闼婆吠陀·象头神脑顶奥义书（Gaṇapatyatharvaśīrṣopaniṣad）》",
    "deityZh": "群主象头神 · 除障尊 (Śrī Mahāgaṇapati)",
    "meritsAndSummaryZh": "印度一切经典修习与善业开端必诵之伽那钵底除障祈请颂及《象头神脑顶奥义书》第8节伽耶特黎真言。",
    "verses": [
      {
        "iast": "vakratuṇḍa mahākāya sūryakoṭisamaprabha | nirvighnaṃ kuru me deva sarvakāryeṣu sarvadā",
        "classicalTranslitZh": "嚩讫啰顿拏 摩诃迦也 苏哩也俱胝三摩钵啰婆 | 尼啰尾伽南 俱噜 弥 提嚩 萨嚩迦哩曳数 萨嚩陀",
        "meaningZh": "具妙曲象鼻、巍峨大身、光明犹如千万太阳之天尊啊！祈愿恒时于我一切善业修持中，净除一切违缘障碍！",
        "meaningEn": "O Lord with the curved trunk and mighty form, whose splendor equals ten million suns, make all my undertakings ever free of obstacles!"
      },
      {
        "iast": "oṃ ekadantāya vidmahe vakratuṇḍāya dhīmahi | tan no dantiḥ pracodayāt",
        "classicalTranslitZh": "唵 翳迦难多也 尾捺摩醯 嚩讫啰顿拏也 提摩醯 | 怛 奴 难底 钵啰祖那夜",
        "meaningZh": "嗡！我等证知独牙一相尊，禅思曲鼻除障尊；愿象牙圣尊启发我等之无碍智慧！",
        "meaningEn": "Gaṇeśa Gāyatrī Mantra from Gaṇapati Atharvaśīrṣa Upaniṣad 8."
      }
    ]
  },
  {
    "id": "saiva-pancaksara-mula-mantra",
    "titleZh": "《夜柔吠陀》湿婆五字根本大明咒（Namaḥ Śivāya）",
    "aliasesZh": "湿婆五字真言,湿婆六字心咒,嗡拿玛希瓦亚,Om Namah Shivaya,Panchakshara Mantra",
    "titleSanskritIast": "Śaiva-Pañcākṣara-Mūla-Mantra",
    "titleEnglish": "Five-Syllable Root Mantra of Śiva (Taittirīya Saṃhitā 4.5.8)",
    "categoryId": "vedic-tantra-siddhanta",
    "taishoNo": "Taittirīya Saṃhitā 4.5.8 (GRETIL ts_u.htm)",
    "translatorZh": "《黑夜柔吠陀》与湿婆阿笈摩圣传",
    "sutraSourceZh": "《黑夜柔吠陀·泰帝利耶本集》4.5.8 正中心圣句",
    "deityZh": "吉祥寂静大自在尊湿婆 (Sadāśiva)",
    "meritsAndSummaryZh": "位于《黑夜柔吠陀·Śrī Rudram》全篇正中心之五音节根本圣咒（na-maḥ-śi-vā-ya），统摄五大元素与纯净觉性。",
    "verses": [
      {
        "iast": "namaḥ śivāya | oṃ namaḥ śivāya",
        "classicalTranslitZh": "曩莫 尸嚩也 | 唵 曩莫 尸嚩也",
        "meaningZh": "顶礼吉祥寂静大自在尊！五字真言与嗡字六字明清净业障，归入本来清净觉识。",
        "meaningEn": "The Five-Syllable (Pañcākṣara, TS 4.5.8) and Six-Syllable (Ṣaḍakṣara) Root Mantra of Śiva."
      }
    ]
  },
  {
    "id": "netratantra-mrtyunjaya-mantra",
    "titleZh": "克什米尔《净眼密续》甘露胜死三字真言（Netra-Mṛtyuñjaya）",
    "aliasesZh": "净眼密续胜死咒,甘露主尊真言,Om Jum Sah,Netratantra Mantra",
    "titleSanskritIast": "Netratantra-Amṛteśvara-Mṛtyuñjaya-Mantra",
    "titleEnglish": "Amṛteśvara Mṛtyuñjaya Mantra from the Kashmirian Netratantra",
    "categoryId": "vedic-tantra-siddhanta",
    "taishoNo": "Netratantra 7 (GRETIL netrat_u.htm)",
    "translatorZh": "克什米尔三元论阿阇梨 传授 · 刹摩罗阇（Kṣemarāja）注疏对勘",
    "sutraSourceZh": "克什米尔梵本《净眼密续（Netratantra）》第 7 章",
    "deityZh": "甘露自在主尊 (Amṛteśvara)",
    "meritsAndSummaryZh": "克什米尔非二元密续《净眼续》核心甘露主尊三字真言「oṃ juṃ saḥ」及广咒，灌注生命甘露、平息病苦。",
    "verses": [
      {
        "iast": "oṃ juṃ saḥ | oṃ hrauṃ juṃ saḥ amṛteśvarāya mṛtyuñjayāya svāhā",
        "classicalTranslitZh": "唵 戎 萨 | 唵 诃哢 戎 萨 阿蜜栗帝室嚩啰也 蜜栗底匀惹也也 娑嚩贺",
        "meaningZh": "嗡、戎、萨！顶礼甘露自在尊、超越死亡苦厄之胜死主，圆满成就！",
        "meaningEn": "The Three-Syllable Netra-Mṛtyuñjaya Mantra (Oṃ Juṃ Saḥ) and extended invocation from the Netratantra."
      }
    ]
  },
  {
    "id": "vijnanabhairava-hamsa-soham-mantra",
    "titleZh": "《识怖畏续》天鹅自然呼吸真言（Haṃsa So'ham）",
    "aliasesZh": "天鹅呼吸咒,索罕呼吸真言,自然持诵伽耶特黎,So Ham,Hamsa Mantra,Ajapa Gayatri",
    "titleSanskritIast": "Vijñānabhairava-Haṃsa-Ajapā-Mantra",
    "titleEnglish": "Natural Breath Haṃsa Mantra from the Vijñānabhairava Tantra",
    "categoryId": "vedic-tantra-siddhanta",
    "taishoNo": "Vijñānabhairava 24 & 156 (GRETIL vijbh_u.htm)",
    "translatorZh": "克什米尔《识怖畏续》瑜伽传人 传授",
    "sutraSourceZh": "梵本《识怖畏续（Vijñānabhairava）》第 24、156 颂",
    "deityZh": "遍在觉识自性 (Paramaśiva)",
    "meritsAndSummaryZh": "《识怖畏续》112种禅观法门之首——随顺出入息自然流转之无作持诵真言（Ajapā-Japa），昼夜二万一千六百息念念觉照。",
    "verses": [
      {
        "iast": "so 'ham | haṃsaḥ śivo 'ham",
        "classicalTranslitZh": "苏 憾 | 憾萨 尸嚩 憾",
        "meaningZh": "入息「苏（彼最高觉性）」、出息「憾（即是我）」，翻转即成天鹅真言（憾萨），当下体认本净吉祥觉性！",
        "meaningEn": "Natural Breath Mantra (So ’ham / Haṃsaḥ) from Vijñānabhairava Tantra 24 & 156."
      }
    ]
  },
  {
    "id": "vaisnava-narayana-astaksara-mantra",
    "titleZh": "《那罗延奥义书》那罗延八字根本真言（Oṃ Namo Nārāyaṇāya）",
    "aliasesZh": "那罗延八字真言,毗湿奴八字心咒,Om Namo Narayanaya,Ashtakshara Mantra",
    "titleSanskritIast": "Nārāyaṇa-Aṣṭākṣara-Mūla-Mantra",
    "titleEnglish": "Eight-Syllable Root Mantra of Nārāyaṇa (Nārāyaṇa Upaniṣad)",
    "categoryId": "vedic-tantra-siddhanta",
    "taishoNo": "Nārāyaṇa Upaniṣad 4 (GRETIL)",
    "translatorZh": "五夜教阿笈摩（Pañcarātra Āgama）圣传",
    "sutraSourceZh": "《那罗延奥义书（Nārāyaṇopaniṣad）》第 4 节",
    "deityZh": "宇宙遍住主那罗延 (Śrīmān Nārāyaṇa)",
    "meritsAndSummaryZh": "毗湿奴派与五夜教最高八音节根本真言（Aṣṭākṣara），礼敬万有众生最终依止处那罗延尊。",
    "verses": [
      {
        "iast": "oṃ namo nārāyaṇāya",
        "classicalTranslitZh": "唵 曩莫 那啰也拏也",
        "meaningZh": "嗡！至诚顶礼宇宙万有之本源与归宿那罗延世尊！",
        "meaningEn": "The Eight-Syllable Nārāyaṇa Root Mantra (Nārāyaṇa Upaniṣad 4)."
      }
    ]
  },
  {
    "id": "vaisnava-vasudeva-dvadasaksara-mantra",
    "titleZh": "《薄伽梵往世书》婆苏提婆十二字解脱真言",
    "aliasesZh": "婆苏提婆十二字真言,薄伽梵往世书根本咒,Om Namo Bhagavate Vasudevaya,Dvadashakshara Mantra",
    "titleSanskritIast": "Bhāgavata-Vāsudeva-Dvādaśākṣara-Mantra",
    "titleEnglish": "Twelve-Syllable Liberation Mantra of Vāsudeva (Bhāgavata Purāṇa 4.8.54)",
    "categoryId": "vedic-tantra-siddhanta",
    "taishoNo": "Bhāgavata Purāṇa 4.8.54 (GRETIL bhagp_u.htm)",
    "translatorZh": "那罗陀仙人（Nārada Muni）传授陀鲁婆童子",
    "sutraSourceZh": "《薄伽梵往世书（Bhāgavata Purāṇa）》4.8.54",
    "deityZh": "遍住世尊婆苏提婆 (Bhagavān Vāsudeva)",
    "meritsAndSummaryZh": "那罗陀仙人亲授陀鲁婆王子之十二音节解脱大咒（Dvādaśākṣara），亦为整部《薄伽梵往世书》开篇礼敬本尊。",
    "verses": [
      {
        "iast": "oṃ namo bhagavate vāsudevāya",
        "classicalTranslitZh": "唵 曩莫 婆誐嚩帝 嚩苏提嚩也",
        "meaningZh": "嗡！至心归命遍住一切众生心间之六德圆满世尊婆苏提婆！",
        "meaningEn": "The Twelve-Syllable Vāsudeva Liberation Mantra (Bhāgavata Purāṇa 4.8.54)."
      }
    ]
  },
  {
    "id": "visnusahasranama-santakaram-stotra",
    "titleZh": "《毗湿奴千名赞》寂静庄严相禅观礼赞颂（Śāntākāraṃ）",
    "aliasesZh": "毗湿奴禅定颂,扇多迦蓝礼赞偈,Shantakaram Bhujagashayanam,Vishnu Sahasranama Dhyanam",
    "titleSanskritIast": "Viṣṇusahasranāma-Śāntākāra-Dhyāna-Śloka",
    "titleEnglish": "Meditation Verse of the Viṣṇusahasranāma (Mahābhārata Anuśāsanaparvan)",
    "categoryId": "vedic-tantra-siddhanta",
    "taishoNo": "Mahābhārata 13.135 (GRETIL mbh13_u.htm)",
    "translatorZh": "毗耶娑仙人（Vyāsa）编纂 · 毗湿摩传诵",
    "sutraSourceZh": "《摩诃婆罗多·教诫篇·毗湿奴千名赞》禅观颂",
    "deityZh": "遍入天毗湿奴 (Mahāviṣṇu)",
    "meritsAndSummaryZh": "《毗湿奴千名赞》持诵前著名四句禅观礼赞偈，完整收录全颂对音，无一字省略。",
    "verses": [
      {
        "iast": "śāntākāraṃ bhujagaśayanaṃ padmanābhaṃ sureśaṃ viśvādhāraṃ gaganasadṛśaṃ meghavarṇaṃ śubhāṅgam | lakṣmīkāntaṃ kamalanayanaṃ yogibhir dhyānagamyaṃ vande viṣṇuṃ bhavabhayaharaṃ sarvalokaikanātham",
        "classicalTranslitZh": "扇多迦蓝 婆惹伽舍也南 钵纳摩那婆 苏隶苫 尾室嚩陀蓝 伽伽那萨捺哩苫 迷伽嚩啰南 戍旁甘 | 攞吃瑟弥建多 迦摩攞那也南 瑜祇毗 提夜那伽弥阎 嚩泥 尾瑟努 婆嚩婆也诃蓝 萨嚩路迦翳迦那探",
        "meaningZh": "寂静庄严相、安卧蛇王宝座、脐生妙莲、诸天之主、宇宙所依、浩瀚如空、肤若青云、妙好圆满；吉祥天女所敬、莲花妙目、瑜伽禅定所证——我顶礼净除轮回怖畏之三界唯一依怙毗湿奴尊！",
        "meaningEn": "Meditation Verse (Dhyāna-Śloka) of the Viṣṇusahasranāma praising Peaceful Viṣṇu who removes the fear of worldly existence."
      }
    ]
  },
  {
    "id": "kali-santarana-hare-krsna-mahamantra",
    "titleZh": "《度越诤世奥义书》哈瑞奎师那十六词摩诃曼陀罗",
    "aliasesZh": "哈瑞奎师那大咒,十六词三十二音摩诃曼陀罗,Hare Krishna Mahamantra,Kali Santarana Upanisad",
    "titleSanskritIast": "Kali-Santaraṇa-Ṣoḍaśanāma-Mahāmantra",
    "titleEnglish": "Sixteen-Word Hare Kṛṣṇa Mahāmantra (Kali-Santaraṇa Upaniṣad)",
    "categoryId": "vedic-tantra-siddhanta",
    "taishoNo": "Kali-Santaraṇa Upaniṣad (GRETIL)",
    "translatorZh": "大梵天传授那罗陀仙人 · 柴坦尼亚传承",
    "sutraSourceZh": "黑夜柔吠陀《度越诤世奥义书（Kali-Santaraṇa Upaniṣad）》",
    "deityZh": "奎师那与罗摩圣名 (Śrī Kṛṣṇa & Rāma)",
    "meritsAndSummaryZh": "《度越诤世奥义书》所载十六词三十二音节圣名大咒（Mahāmantra），藉清净唱诵涤除遮蔽本觉心识之尘垢。",
    "verses": [
      {
        "iast": "hare kṛṣṇa hare kṛṣṇa kṛṣṇa kṛṣṇa hare hare | hare rāma hare rāma rāma rāma hare hare",
        "classicalTranslitZh": "诃隶 讫哩瑟拏 诃隶 讫哩瑟拏 讫哩瑟拏 讫哩瑟拏 诃隶 诃隶 | 诃隶 啰摩 诃隶 啰摩 啰摩 啰摩 诃隶 诃隶",
        "meaningZh": "呼唤神圣大悲妙力（诃隶）、全善吸引者（讫哩瑟拏）与大乐喜悦之源（啰摩），唤醒本具清净灵明奉爱！",
        "meaningEn": "The Sixteen-Word, Thirty-Two-Syllable Mahāmantra from the Kali-Santaraṇa Upaniṣad."
      }
    ]
  },
  {
    "id": "devi-mahatmya-navarna-mantra",
    "titleZh": "《摩根德耶往世书·女神颂》难近母旃陀利九音根本真言",
    "aliasesZh": "难近母九字真言,旃陀利九音咒,Navarna Mantra,Om Aim Hrim Klim Camundayai Vicce",
    "titleSanskritIast": "Devīmāhātmya-Caṇḍī-Navārṇa-Mūla-Mantra",
    "titleEnglish": "Nine-Syllable Root Mantra of Caṇḍī / Durgā (Navārṇa Mantra)",
    "categoryId": "vedic-tantra-siddhanta",
    "taishoNo": "Mārkaṇḍeya Purāṇa 81–93 (GRETIL markp_u.htm)",
    "translatorZh": "摩根德耶仙人（Mārkaṇḍeya）传诵",
    "sutraSourceZh": "《摩根德耶往世书·女神颂（Devī-Māhātmya / Durgā-Saptaśatī）》根本咒",
    "deityZh": "难近母旃陀利 (Caṇḍikā / Mahādurgā)",
    "meritsAndSummaryZh": "性力派最高经典《女神颂（七百颂）》根本九音真言（Navārṇa Mantra），统摄大辩才智慧（aiṃ）、大吉祥妙有（hrīṃ）、大黑天破障（klīṃ）三圣力。",
    "verses": [
      {
        "iast": "oṃ aiṃ hrīṃ klīṃ cāmuṇḍāyai vicce",
        "classicalTranslitZh": "唵 盎 纥哩 讫哩 左闷拏裔 尾制",
        "meaningZh": "嗡！摄集般若明智（盎）、清净光明（纥哩）、降魔大力（讫哩），归命摧伏无明魔军之遮文荼圣母，圆满朗照！",
        "meaningEn": "The Nine-Syllable (Navārṇa) Root Mantra of Caṇḍī uniting Mahāsarasvatī, Mahālakṣmī, and Mahākālī."
      }
    ]
  },
  {
    "id": "devi-mahatmya-sarvamangala-stotra",
    "titleZh": "《女神颂》一切吉祥中之至极吉祥礼赞颂（Sarvamaṅgalamāṅgalye）",
    "aliasesZh": "女神颂吉祥赞,那罗延尼礼赞咒,Sarvamangala Mangalye",
    "titleSanskritIast": "Devīmāhātmya-Sarvamaṅgalā-Nārāyaṇī-Stuti",
    "titleEnglish": "Auspiciousness of All Auspiciousness Verse (Devī-Māhātmya 11.10)",
    "categoryId": "vedic-tantra-siddhanta",
    "taishoNo": "Devī-Māhātmya 11.10 (GRETIL markp_u.htm)",
    "translatorZh": "摩根德耶仙人（Mārkaṇḍeya）传诵",
    "sutraSourceZh": "《摩根德耶往世书·女神颂》第 11 章《那罗延尼赞》第 10 颂",
    "deityZh": "吉祥救护母那罗延尼 (Gaurī Nārāyaṇī)",
    "meritsAndSummaryZh": "《女神颂》第十一章诸天礼赞圣母之最著名核心颂，祈赐一切世出世间吉祥安隐。",
    "verses": [
      {
        "iast": "sarvamaṅgalamāṅgalye śive sarvārthasādhike | śaraṇye tryambake gauri nārāyaṇi namo 'stu te",
        "classicalTranslitZh": "萨嚩莽伽攞莽伽梨 尸吠 萨嚩曷他娑地计 | 舍啰尼 怛哩焰婆计 高哩 那啰也抳 曩莫 娑睹 帝",
        "meaningZh": "一切吉祥中之至极吉祥母、寂静善妙母、成办一切义利母、归依救护母、三慧眼皎洁母那罗延尼啊，至诚顶礼于你！",
        "meaningEn": "Auspiciousness of all that is auspicious, O Śivā, accomplisher of all aims, refuge, three-eyed Gaurī, O Nārāyaṇī, salutations to Thee! (Devī-Māhātmya 11.10)"
      }
    ]
  },
  {
    "id": "srividya-pancadasaksari-mantra",
    "titleZh": "《三城热奥义书》室利明妃十五音根本大明（Pañcadaśākṣarī）",
    "aliasesZh": "室利明妃十五音咒,丽三城圣母根本咒,Sri Vidya Pancadasi Mantra",
    "titleSanskritIast": "Śrīvidyā-Kādi-Pañcadaśākṣarī-Mūla-Mantra",
    "titleEnglish": "Fifteen-Syllable Root Mantra of Śrīvidyā (Tripurātāpinī Upaniṣad)",
    "categoryId": "vedic-tantra-siddhanta",
    "taishoNo": "Tripurātāpinī Upaniṣad 1 (GRETIL)",
    "translatorZh": "室利明妃派（Śrīvidyā）迦摩罗阇传承",
    "sutraSourceZh": "阿闼婆吠陀《三城热奥义书（Tripurātāpinyupaniṣad）》第 1 章",
    "deityZh": "丽三城圣母 (Śrī Lalitā Tripurasundarī)",
    "meritsAndSummaryZh": "南方室利轮（Śrīcakra）传承最高秘密十五音根本大明（迦字起首 Kādi 传规），严密分摄语聚、爱聚、力聚三重坛城。",
    "verses": [
      {
        "iast": "ka e ī la hrīṃ | ha sa ka ha la hrīṃ | sa ka la hrīṃ",
        "classicalTranslitZh": "迦 翳 伊 攞 纥哩 | 诃 萨 迦 诃 攞 纥哩 | 萨 迦 攞 纥哩",
        "meaningZh": "第一语聚五字开显本觉妙智，第二爱聚六字周遍大悲光明，第三力聚四字收归乐空一如心印！",
        "meaningEn": "The Three-Peak Fifteen-Syllable Mantra (Kādi Pañcadaśākṣarī) of Śrīvidyā corresponding to the Śrīcakra."
      }
    ]
  },
  {
    "id": "ayurveda-dhanvantari-mantra",
    "titleZh": "阿育吠陀医神檀梵陀利甘露宝瓶疗愈真言（Dhanvantari Mantra）",
    "aliasesZh": "阿育吠陀医神咒,檀梵陀利疗愈真言,Dhanvantari Healing Mantra",
    "titleSanskritIast": "Āyurveda-Śrī-Dhanvantari-Mahāmantra",
    "titleEnglish": "Āyurvedic Healing Mantra of Lord Dhanvantari",
    "categoryId": "vedic-tantra-siddhanta",
    "taishoNo": "Bhāgavata / Brahmāṇḍa Purāṇa Āyurveda Tradition",
    "translatorZh": "阿育吠陀医学古仙传承",
    "sutraSourceZh": "《阿育吠陀》传统开诊与煎药前必诵医王祈请真言",
    "deityZh": "手持甘露宝瓶之医神檀梵陀利 (Śrī Dhanvantari)",
    "meritsAndSummaryZh": "印度传统医学（Āyurveda）鼻祖檀梵陀利独立疗愈真言，祈愿甘露法药净除一切身心沉疴病苦。",
    "verses": [
      {
        "iast": "oṃ namo bhagavate vāsudevāya dhanvantaraye amṛtakalaśahastāya sarvāmayavināśanāya trailokyanāthāya śrīmahāviṣṇave namaḥ",
        "classicalTranslitZh": "唵 曩莫 婆誐嚩帝 嚩苏提嚩也 檀嚩多啰曳 阿蜜栗多迦攞舍诃娑多也 萨嚩摩也尾那舍那也 怛赖路枳也那他也 室哩摩诃尾瑟拏吠 曩莫",
        "meaningZh": "嗡！顶礼世尊婆苏提婆化现之医王檀梵陀利——手持不死甘露宝瓶、净除一切身心疾疫病苦、三界依怙吉祥大毗湿奴尊！",
        "meaningEn": "The Āyurvedic Healing Mantra of Lord Dhanvantari holding the nectar-jar, destroyer of all diseases."
      }
    ]
  },
  {
    "id": "ramayana-aditya-hrdaya-mantra",
    "titleZh": "《罗摩衍那》太阳神阿底提亚伽耶特黎光明真言",
    "aliasesZh": "太阳心咒,阿底提亚伽耶特黎咒,Surya Gayatri,Aditya Hridayam",
    "titleSanskritIast": "Rāmāyaṇa-Āditya-Sūrya-Gāyatrī-Mantra",
    "titleEnglish": "Sūrya Āditya Mantra & Gāyatrī (Rāmāyaṇa Yuddha-Kāṇḍa 105)",
    "categoryId": "vedic-tantra-siddhanta",
    "taishoNo": "Rāmāyaṇa 6.105 / Taittirīya Āraṇyaka 10.1 (GRETIL ram_06u.htm)",
    "translatorZh": "投山仙人阿伽斯底耶（Agastya Ṛṣi）传授",
    "sutraSourceZh": "《罗摩衍那·战斗篇》第 105 章《太阳心咒》及《泰帝利耶森林书》",
    "deityZh": "太阳神苏利耶阿底提亚 (Sūrya Āditya)",
    "meritsAndSummaryZh": "阿伽斯底耶仙人于决战前传授罗摩之太阳神光明真言与太阳伽耶特黎咒，完整无省字对音，祛除忧惧疲敝、激发无畏心力。",
    "verses": [
      {
        "iast": "oṃ ghṛṇiḥ sūrya ādityaḥ | oṃ bhāskarāya vidmahe mahādyutikarāya dhīmahi | tan no ādityaḥ pracodayāt",
        "classicalTranslitZh": "唵 伽哩抳 苏哩也 阿你底也 | 唵 婆娑迦啰也 尾捺摩醯 摩诃你逾底迦啰也 提摩醯 | 怛 奴 阿你底也 钵啰祖那夜",
        "meaningZh": "嗡，慈悲光明太阳阿底提亚尊！我等证知造作光明之尊，禅思放大威光之主；愿阿底提亚太阳尊启发我等之智慧光明！",
        "meaningEn": "Vedic Eight-Syllable Sūrya Mantra and Sūrya Gāyatrī Mantra."
      }
    ]
  },
  {
    "id": "sarve-bhavantu-sukhinah-mantra",
    "titleZh": "普世慈悲四无量和平祈愿真言（Sarve Bhavantu Sukhinaḥ）",
    "aliasesZh": "愿一切众生安乐咒,普世和平梵文祈愿颂,Sarve Bhavantu Sukhinah,Lokah Samastah Sukhino Bhavantu",
    "titleSanskritIast": "Sarve-Bhavantu-Sukhinaḥ-Viśva-Śānti-Mantra",
    "titleEnglish": "Universal Prayer for the Happiness and Wellbeing of All Beings",
    "categoryId": "vedic-tantra-siddhanta",
    "taishoNo": "Classical Sanskrit Śānti-Prārthanā",
    "translatorZh": "印度古典梵文祈愿传统",
    "sutraSourceZh": "梵文古典普世慈悲回向颂",
    "deityZh": "遍法界一切有情众生",
    "meritsAndSummaryZh": "流传全球之梵文普世慈悲回向颂，祈愿十方一切有情皆得安乐、远离疾疫、咸见吉祥、无有苦厄。",
    "verses": [
      {
        "iast": "sarve bhavantu sukhinaḥ sarve santu nirāmayāḥ | sarve bhadrāṇi paśyantu mā kaścid duḥkhabhāg bhavet | lokāḥ samastāḥ sukhino bhavantu",
        "classicalTranslitZh": "萨嚩 婆嚩睹 苏企那 萨嚩 三睹 尼啰摩夜 | 萨嚩 跋捺啰抳 钵尸演睹 摩 迦室质 度佉薄 婆吠 | 路迦 三摩娑多 苏企奴 婆嚩睹",
        "meaningZh": "愿一切众生皆得安乐，愿一切众生远离病苦；愿一切众生皆见吉祥善妙，愿无有一人遭受苦厄！愿十方世界一切众生皆得幸福安乐！",
        "meaningEn": "May all beings be happy; may all be free from illness; may all behold what is auspicious; may none suffer sorrow! May all worlds be happy and free!"
      }
    ]
  },
  {
    "id": "jaina-namokara-patanjali-yoga-mantras",
    "titleZh": "耆那教最高圣咒《五敬礼真言（Pañca-Namaskāra）》",
    "aliasesZh": "耆那教五敬礼咒,那摩卡拉真言,五尊礼赞咒,Namokar Mantra,Navkar Mantra,Panca Namaskara",
    "titleSanskritIast": "Jaina-Pañca-Namaskāra-Mūla-Mantra",
    "titleEnglish": "Jaina Supreme Fivefold Salutation Mantra (Pañca-Namaskāra / Namokāra Mantra)",
    "categoryId": "vedic-tantra-siddhanta",
    "taishoNo": "Ṣaṭkhaṇḍāgama 1.1 (GRETIL jaina)",
    "translatorZh": "大雄尊者（Mahāvīra）沙门圣众传承",
    "sutraSourceZh": "耆那教《六分阿笈摩（Ṣaṭkhaṇḍāgama）》开篇根本圣咒（梵文与古俗语双本对勘）",
    "deityZh": "五阶解脱圣众（阿罗汉 · 悉达 · 阿阇梨 · 亲教师 · 一切清净沙门）",
    "meritsAndSummaryZh": "印度沙门传统跨越两千五百年之耆那教最高根本圣咒《五敬礼真言（Namokāra Mantra）》，纯粹礼敬五阶解脱觉者之清净德行，完整收录标准梵文本与《六分阿笈摩》古俗语原典本全文对音，绝无半字省略。",
    "verses": [
      {
        "iast": "namo arhadbhyaḥ | namo siddhebhyaḥ | namo ācāryebhyaḥ | namo upādhyāyebhyaḥ | namo loke sarvasādhubhyaḥ | eṣa pañcanamaskāraḥ sarvapāpapraṇāśanaḥ | maṅgalānāṃ ca sarveṣāṃ prathamaṃ bhavati maṅgalam",
        "classicalTranslitZh": "曩莫 阿啰诃毗也 | 曩莫 悉提毗也 | 曩莫 阿遮哩曳毗也 | 曩莫 乌波提夜曳毗也 | 曩莫 路计 萨嚩娑度毗也 | 翳沙 般遮曩莫娑迦啰 萨嚩播波钵啰拏舍那 | 莽伽攞南 遮 萨嚩衫 钵啰他摩 婆嚩底 莽伽蓝",
        "meaningZh": "顶礼诸阿罗汉！顶礼诸成就悉达！顶礼诸轨范师阿阇梨！顶礼诸亲教师邬波驮耶！顶礼世间一切清净修行沙门！此五重敬礼灭除一切罪障，于一切吉祥中为第一至高吉祥！",
        "meaningEn": "Homage to the Arhats, Siddhas, Ācāryas, Upādhyāyas, and all Sādhus in the universe! This fivefold salutation destroys all karma and is the foremost of all auspiciousness."
      },
      {
        "iast": "namo arihantāṇaṃ | namo siddhāṇaṃ | namo āyariyāṇaṃ | namo uvajjhāyāṇaṃ | namo loe savvasāhūṇaṃ",
        "classicalTranslitZh": "那摩 阿里汉达南 | 那摩 悉达南 | 那摩 阿亚里亚南 | 那摩 乌瓦迦亚南 | 那摩 洛耶 萨瓦萨胡南",
        "meaningZh": "《六分阿笈摩》与公元前二世纪哈提古姆帕石刻所载古俗语（Prakrit）原音五敬礼真言。",
        "meaningEn": "Original Ardhamāgadhī / Śaurasenī Prakrit Namokāra Mantra opening the Ṣaṭkhaṇḍāgama.",
        "tangNoteZh": "古俗语（Prakrit）原典传诵音"
      }
    ]
  },
  {
    "id": "patanjali-yoga-invocation-stotra",
    "titleZh": "《帕坦伽利大仙祈请颂（Yogena Cittasya）》",
    "aliasesZh": "帕坦伽利瑜伽祈请颂,瑜伽经课前祈请咒,Yogena Cittasya Padena Vacam,Patanjali Mantra",
    "titleSanskritIast": "Patañjali-Muni-Prārthanā-Śloka",
    "titleEnglish": "Traditional Sanskrit Invocation to Sage Patañjali (Yogena Cittasya)",
    "categoryId": "vedic-tantra-siddhanta",
    "taishoNo": "Pātañjala-Yogaśāstra Tradition (Bhojarāja)",
    "translatorZh": "波阇王（Bhojarāja）造赞 · 全球古典瑜伽传承",
    "sutraSourceZh": "《瑜伽经》传统注疏开篇礼敬颂",
    "deityZh": "瑜伽祖师帕坦伽利大牟尼 (Maharṣi Patañjali)",
    "meritsAndSummaryZh": "古典瑜伽修习前独立礼敬帕坦伽利大仙之祈请颂，礼赞其以《瑜伽经》净心、以《语法大疏》净语、以《医典》净身之三业清净功德。",
    "verses": [
      {
        "iast": "yogena cittasya padena vācāṃ malaṃ śarīrasya ca vaidyakena | yo 'pākarot taṃ pravaraṃ munīnāṃ patañjaliṃ prāñjalir ānato 'smi",
        "classicalTranslitZh": "瑜祇那 质多写 波提那 嚩瞻 摩蓝 舍哩啰写 遮 吠你也计那 | 瑜 波迦路 担 钵啰嚩蓝 牟尼南 钵檀惹林 钵烂惹哩 阿那睹 娑弥",
        "meaningZh": "以瑜伽净除心识之垢、以语法净除语言之垢、以医学净除身体之垢——我合十虔敬顶礼彼牟尼中之最胜尊帕坦伽利！",
        "meaningEn": "I bow with folded hands to Patañjali, the foremost of sages, who removed the impurities of mind through Yoga, of speech through Grammar, and of body through Medicine."
      }
    ]
  }
];

export const WORLD_ENCYCLOPEDIA_DHARANIS: DharaniEntry[] =
  WORLD_MANTRA_SEEDS.map(buildEncyclopediaEntry);
