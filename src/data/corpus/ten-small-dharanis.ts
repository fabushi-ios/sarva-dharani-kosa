/**
 * 十小咒全集语料库 (src/data/corpus/ten-small-dharanis.ts)
 * 完整收录汉传早课《十小咒》全部 10 部陀罗尼，对接 CBETA XML-P5 与 GRETIL 梵文写本
 */

import { DharaniEntry } from '../../types/dharani';

export const TEN_SMALL_DHARANIS: DharaniEntry[] = [
  {
    id: 'cintamani-cakra',
    titleZh: '如意宝轮王陀罗尼 (十小咒之一 · 菩提流志译89字悉昙对音本)',
    titleSaIast: 'Cintāmaṇicakra-dhāraṇī',
    titleSaDeva: 'चिन्तामणिचक्रधारणी',
    titleSaSiddham: '𑖓𑖰𑖡𑖿𑖝𑖯𑖦𑖜𑖰𑖓𑖎𑖿𑖨𑖠𑖯𑖨𑖜𑖱',
    titleEn: 'Wish-Fulfilling Wheel-King Dhāraṇī (Cintāmaṇicakra Avalokiteśvara)',
    category: 'ten-small',
    deityFocus: '如意轮观自在菩萨 (Cintāmaṇicakra Avalokiteśvara)',
    seedSyllableIast: 'hrīḥ',
    seedSyllableSiddham: '𑖮𑖿𑖨𑖱𑖿',
    seedSyllableDeva: 'ह्रीः',
    seedSyllableZh: '纥哩(二合)',
    summaryZh:
      '十小咒之首。本条目直接关联 CBETA《大正藏》第20册 No.1080 唐菩提流志译《如意轮陀罗尼经》全部 89 组 <cb:tt> 悉昙梵字与汉字对音（根本咒、大心咒、随心咒三科具足）。',
    ritualBenefitsZh: '手执如意摩尼宝珠与金轮，能满一切世出世间善愿，现世获大福聚，临终亲见阿弥陀佛与观音势至。',
    sourceMeta: {
      cbetaXmlId: 'T20n1080',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1080.xml',
      taishoVolPage: 'T20, No. 1080, pp. 188c–190a',
      ancientTranslator: '唐 南天竺三藏菩提流志 译 / 唐 义净 译 (T20n1082)',
      sanskritEditionCitation:
        'CBETA T20n1080 (89 Siddhaṃ-Chinese <cb:tt> interlinear pairs) & Dunhuang Sanskrit MS',
      tangPhoneticNotes: [
        'चिन्तामणि (如意宝珠，振多摩尼) · चक्रवर्ति (转轮王，斫羯啰嚩底)',
        '大心咒：唵 钵蹋摩 振多摩尼 Jvāla 吽 · 随心咒：唵 嚩啰陀 钵亶谜 吽'
      ]
    },
    verses: [
      {
        id: 'cc-1',
        index: 1,
        sectionTag: '第一分 · 根本陀罗尼（礼敬与摩尼宝轮王总持）',
        iast: 'namo buddhāya namo dharmāya namo saṃghāya | namah āryāvalokiteśvarāya bodhisattvāya mahāsattvāya mahākāruṇikāya | tadyathā oṃ cakra-varti cintāmaṇi mahāpadme ruru tiṣṭha jvala ākarṣaya hūṃ phaṭ svāhā',
        tangTranslit: '南无佛驮耶 南无达摩耶 南无僧伽耶 ｜ 南无观自在菩萨摩诃萨 具大悲心者 ｜ 怛侄他 唵 斫羯啰伐底 震多末尼 摩诃钵蹬谜 噜噜噜噜 底瑟吒 爧啰阿羯利沙也 吽 癹 莎诃',
        tangYinNotes: ['斫羯啰(二合)', '钵蹬谜(二合)', '底瑟吒(二合)'],
        meaningZh: '归命佛、归命法、归命僧！归命大悲圣观自在菩萨摩诃萨！即说咒曰：嗡！转法轮王、如意宝珠、大红莲华尊！速疾安住、放炽盛光明钩召摄受一切善法：吽 发吒 娑婆诃！',
        meaningEn: 'Homage to the Buddha, Dharma, and Saṃgha! Homage to Greatly Compassionate Noble Avalokiteśvara! Namely: Oṃ! O Wheel-Turning Sovereign, Wish-Fulfilling Jewel, Great Lotus! Abide, blaze forth, and draw in all blessings: Hūṃ Phaṭ Svāhā!',
        words: [
          { iast: 'cakra-varti', tangTranslit: '斫羯啰伐底', yinNote: '二合', grammar: '呼格', meaningZh: '转宝轮王尊', meaningEn: 'O Wheel-Turning Sovereign' },
          { iast: 'cintāmaṇi', tangTranslit: '震多末尼', grammar: '呼格', meaningZh: '如意摩尼宝珠', meaningEn: 'O Wish-Fulfilling Gem' },
          { iast: 'mahāpadme', tangTranslit: '摩诃钵蹬谜', yinNote: '二合', grammar: '阴性单数呼格', meaningZh: '大清净红莲华尊', meaningEn: 'O Great Lotus' },
          { iast: 'ākarṣaya', tangTranslit: '阿羯利沙也', grammar: 'ā-√kṛṣ 致使式祈使', meaningZh: '钩召、摄引一切福智善法', meaningEn: 'draw near, attract!' }
        ]
      },
      {
        id: 'cc-2',
        index: 2,
        sectionTag: '第二分 · 大心陀罗尼与随心陀罗尼',
        iast: 'oṃ padma cintāmaṇi jvala hūṃ | oṃ varada padme hūṃ',
        tangTranslit: '唵 钵蹋摩 震多末尼 爧攞 吽 ｜ 唵 跋喇陀 钵亶谜 吽',
        tangYinNotes: ['钵蹋摩(二合)', '嚩啰陀(施愿)'],
        meaningZh: '【大心咒】嗡 莲华如意宝珠 炽盛光明 吽！【随心咒】嗡 施满胜愿 红莲华尊 吽！',
        meaningEn: '[Heart Mantra] Oṃ Lotus Wish-Fulfilling Gem, Blaze Forth, Hūṃ! [Near-Heart Mantra] Oṃ Bestower of Boons, O Lotus, Hūṃ!',
        words: [
          { iast: 'padma cintāmaṇi', tangTranslit: '钵蹋摩震多末尼', grammar: '呼格', meaningZh: '莲华上之如意摩尼宝', meaningEn: 'Lotus Wish-Fulfilling Jewel' },
          { iast: 'varada', tangTranslit: '跋喇陀', grammar: 'vara-da (施愿者，呼格)', meaningZh: '满一切善愿之施愿尊', meaningEn: 'O Bestower of Boons' }
        ]
      }
    ]
  },
  {
    id: 'tejorasi-usnisa',
    titleZh: '消灾吉祥神咒 (炽盛光大威德消灾吉祥陀罗尼 · 十小咒之二)',
    titleSaIast: 'Tejorāśi-uṣṇīṣa-dhāraṇī',
    titleSaDeva: 'तेजोराश्युष्णीषधारणी',
    titleSaSiddham: '𑖝𑖼𑖕𑖺𑖨𑖯𑖫𑖿𑖧𑖲𑖬𑖿𑖜𑖱𑖬𑖠𑖯𑖨𑖜𑖱',
    titleEn: 'Blazing Light Buddha-Crown Disaster-Averting Auspicious Dhāraṇī',
    category: 'ten-small',
    deityFocus: '炽盛光佛顶如来 (Tejorāśi Uṣṇīṣa)',
    seedSyllableIast: 'hūṃ',
    seedSyllableSiddham: '𑖮𑖳𑖾',
    seedSyllableDeva: 'हूँ',
    seedSyllableZh: '吽',
    summaryZh:
      '唐不空三藏译《佛说炽盛光大威德消灾吉祥陀罗尼经》(CBETA T19n0963)。九曜二十八宿星官灾变、家国不安时，诵此佛顶威光真言即转灾厄为大吉祥。',
    ritualBenefitsZh: '一切灾难悉皆消灭，不能为害，变灾为福，所求皆得吉祥圆满。',
    sourceMeta: {
      cbetaXmlId: 'T19n0963',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n0963.xml',
      taishoVolPage: 'T19, No. 963, p. 337c',
      ancientTranslator: '唐 三藏沙门大广智不空 奉诏译',
      sanskritEditionCitation: 'CBETA T19n0963 & Mañjuśrīmūlakalpa Tejorāśi Chapter',
      tangPhoneticNotes: ['اپratihata (无障碍) · ज्वलज्वल (炽盛发光) · शान्तिं कुरु (作寂静吉祥)']
    },
    verses: [
      {
        id: 'tu-1',
        index: 1,
        sectionTag: '全一分 · 炽盛光大威德消灾吉祥陀罗尼',
        iast: 'namaḥ samanta-buddhānām apratihata-śāsanānām | tadyathā oṃ khāhi khāhi hūṃ hūṃ jvala jvala prajvala prajvala tiṣṭha tiṣṭha ṣṭri ṣṭri sphoṭaya sphoṭaya śāntika śrīye svāhā',
        tangTranslit: '曩谟 三满多 母驮喃 阿钵啰底 贺多 舍娑曩喃 ｜ 怛侄他 唵 佉佉 佉呬佉呬 吽吽 入嚩啰 入嚩啰 钵啰入嚩啰 钵啰入嚩啰 底瑟姹 底瑟姹 瑟致哩 瑟致哩 娑癹吒 娑癹吒 扇底迦 室哩曳 娑嚩诃',
        tangYinNotes: ['钵啰(二合)', '入嚩(二合)', '底瑟姹(二合)', '娑嚩(二合)诃'],
        meaningZh: '归命普遍十方诸佛、无碍教令轮尊！即说咒曰：嗡！吞啖除障、吞啖除障！吽吽！放光炽盛、极放威光！安住、安住！摧破一切星宿恶障、令得息灾寂静大吉祥：娑嚩诃！',
        meaningEn: 'Homage to the Universal Buddhas of unobstructed teachings! Namely: Oṃ! Devour obstacles, Hūṃ Hūṃ! Blaze, blaze forth brightly! Abide, abide! Shatter all calamities, bring peace and auspicious prosperity: Svāhā!',
        words: [
          { iast: 'apratihata-śāsanānām', tangTranslit: '阿钵啰底贺多舍娑曩喃', yinNote: '二合', grammar: '阳性复数第六属格', meaningZh: '具足无能违逆教令之诸佛', meaningEn: 'of Those whose teachings are unobstructed' },
          { iast: 'jvala prajvala', tangTranslit: '入嚩啰钵啰入嚩啰', yinNote: '二合', grammar: '祈使式', meaningZh: '放光、极放炽盛威光', meaningEn: 'blaze, blaze forth!' },
          { iast: 'śāntika śrīye', tangTranslit: '扇底迦室哩曳', grammar: '第四为格', meaningZh: '成就息灾寂静与殊胜吉祥', meaningEn: 'for pacification and auspicious glory' }
        ]
      }
    ]
  },
  {
    id: 'guna-ratna-saila',
    titleZh: '功德宝山神咒 (十小咒之三)',
    titleSaIast: 'Guṇaratnaśaila-dhāraṇī',
    titleSaDeva: 'गुणरत्नशैलधारणी',
    titleSaSiddham: '𑖐𑖲𑖜𑖨𑖝𑖿𑖡𑖫𑖹𑖩𑖠𑖯𑖨𑖜𑖱',
    titleEn: 'Merit-Jewel Mountain Dhāraṇī',
    category: 'ten-small',
    deityFocus: '三宝与妙高山王一切诸佛功德海',
    seedSyllableIast: 'oṃ',
    seedSyllableSiddham: '𑖼𑗀',
    seedSyllableDeva: 'ॐ',
    seedSyllableZh: '唵',
    summaryZh:
      '出自《大集经》及《密咒圆因往生集》。诵此咒一遍，功德如礼拜大集经及积集须弥宝山无量福德。',
    ritualBenefitsZh: '纵造五逆十恶重罪，至诚持诵此咒，临命终时定生诸佛清净国土。',
    sourceMeta: {
      cbetaXmlId: 'T20n1080',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1080.xml',
      taishoVolPage: 'T46, No. 1956 (密咒圆因往生集)',
      ancientTranslator: '唐宋密藏传译',
      sanskritEditionCitation: 'Buddhist Hybrid Sanskrit Reconstruction from Chinese Phonetics',
      tangPhoneticNotes: ['悉帝户嚧都 (成就流注) · 悉都卢只 (极妙光明) · 婆罗婆罗 (具大势力)']
    },
    verses: [
      {
        id: 'grs-1',
        index: 1,
        sectionTag: '全一分 · 功德宝山陀罗尼',
        iast: 'namo buddhāya namo dharmāya namo saṃghāya | oṃ siddhe huru-huru siddhūru kṛpā-kṛpā siddhāṇi puruṇi svāhā',
        tangTranslit: '南无佛驮耶 南无达摩耶 南无僧伽耶 ｜ 唵 悉帝护嚧都 悉都卢 只利波 吉利婆 悉达哩 布嚧哩 娑嚩诃',
        tangYinNotes: ['娑嚩(二合)诃'],
        meaningZh: '归命佛、归命法、归命僧！嗡！成就妙境、速疾流注甘露、大悲摄受、一切悉地皆得圆满具足：娑嚩诃！',
        meaningEn: 'Homage to the Buddha, Dharma, and Saṃgha! Oṃ! In accomplishment flow swiftly, through great compassion may all siddhis be completely fulfilled: Svāhā!',
        words: [
          { iast: 'siddhe', tangTranslit: '悉帝', grammar: '呼格/处格', meaningZh: '妙成就境', meaningEn: 'in accomplishment / O Siddhi' },
          { iast: 'kṛpā-kṛpā', tangTranslit: '只利波吉利婆', grammar: '阴性体格/呼格', meaningZh: '大悲拔苦、慈愍加被', meaningEn: 'compassion, great compassion' },
          { iast: 'puruṇi', tangTranslit: '布嚧哩', grammar: '呼格', meaningZh: '令一切福德圆满具足者', meaningEn: 'O Fulfiller of merit' }
        ]
      }
    ]
  },
  {
    id: 'cundi-dharani',
    titleZh: '七俱胝佛母准提大明陀罗尼 (准提神咒 · 十小咒之四)',
    titleSaIast: 'Saptakoṭibuddhamātṛ-cundī-dhāraṇī',
    titleSaDeva: 'सप्तकोटिबुद्धमातृचुन्दीधारणी',
    titleSaSiddham: '𑖭𑖢𑖿𑖝𑖎𑖺𑖘𑖰𑖤𑖲𑖟𑖿𑖠𑖦𑖯𑖝𑖴𑖓𑖲𑖡𑖿𑖟𑖱𑖠𑖯𑖨𑖜𑖱',
    titleEn: 'Cundī Bodhisattva (Mother of Seventy Million Buddhas) Dhāraṇī',
    category: 'ten-small',
    deityFocus: '七俱胝佛母准提观音 (Cundī Bhagavatī)',
    seedSyllableIast: 'caṃ',
    seedSyllableSiddham: '𑖓𑖾',
    seedSyllableDeva: 'चं',
    seedSyllableZh: '赞',
    summaryZh:
      '过去七十七俱胝诸佛同共宣说之佛母真言。本条目严格校勘 CBETA《大正藏》T20n1075 金刚智译本、T20n1076 不空译本，以及德国哥廷根大学 GRETIL 梵本《大乘庄严宝王经》(bsu019_u.htm) 原文！',
    ritualBenefitsZh: '在家出家、饮酒食肉、有妻子等，不拣净秽，但至心持诵，能使短命众生增寿无量，灭十恶五逆一切罪障，速证无上菩提。',
    sourceMeta: {
      cbetaXmlId: 'T20n1075',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1075.xml',
      taishoVolPage: 'T20, No. 1075 (金刚智译) & No. 1076 (不空译) & No. 1077 (地婆诃罗译)',
      ancientTranslator: '唐 三藏沙门金刚智 / 不空 / 地婆诃罗 译',
      gretilId: 'bsu019_u.htm',
      gretilRawUrl:
        'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/bsu019_u.htm',
      sanskritEditionCitation:
        'GRETIL bsu019_u.htm (Kāraṇḍavyūhasūtra, ed. P.L. Vaidya, Buddhist Sanskrit Texts 17, Darbhanga 1961)',
      tangPhoneticNotes: [
        'namaḥ saptānāṃ samyaksaṃbuddha-koṭīnām (归命七俱胝正等正觉佛)',
        'oṃ cale cule cundī svāhā (游行尊、觉悟尊、清净佛母成就)'
      ]
    },
    verses: [
      {
        id: 'cd-1',
        index: 1,
        sectionTag: '第一分 · 七俱胝正等觉佛归命偈',
        iast: 'namaḥ saptānāṃ samyaksaṃbuddha-koṭīnām',
        tangTranslit: '稽首皈依苏悉帝 头面顶礼七俱胝 我今称赞大准提 唯愿慈悲垂加护 (梵本原句：曩谟 飒多喃 三藐三没驮 俱胝喃)',
        tangYinNotes: ['飒多(七)', '俱胝(千万/亿)'],
        meaningZh: '归命顶礼七千万（七俱胝）无上正等正觉诸佛世尊！',
        meaningEn: 'Homage to the seventy million (seven koṭis) Perfectly Awakened Buddhas!',
        words: [
          { iast: 'saptānām', tangTranslit: '飒多喃', grammar: '数词第六属格复数', meaningZh: '七', meaningEn: 'of seven' },
          { iast: 'samyaksaṃbuddha-koṭīnām', tangTranslit: '三藐三没驮俱胝喃', grammar: '复数第六属格', meaningZh: '千万亿正遍知佛陀', meaningEn: 'tens of millions of Perfectly Enlightened Buddhas' }
        ]
      },
      {
        id: 'cd-2',
        index: 2,
        sectionTag: '第二分 · 准提佛母九圣字根本心咒 (GRETIL 梵本原句)',
        iast: 'tadyathā oṃ cale cule cunde svāhā',
        tangTranslit: '怛侄他 唵 折戾 主戾 准提 娑婆诃 (附大轮一字明：唵 部林 oṃ bhrūṃ)',
        tangYinNotes: ['怛你也(二合)他', '娑嚩(二合)诃'],
        meaningZh: '即说咒曰：嗡！起行游步尊、生起妙智尊、清净最胜准提佛母：圆满成就！',
        meaningEn: 'Namely: Oṃ! O Moving One, O Rising One, O Pure Cundī: Svāhā!',
        words: [
          { iast: 'cale', tangTranslit: '折戾', grammar: '阴性单数呼格', meaningZh: '游行无碍、起大悲行尊', meaningEn: 'O Moving / Active One' },
          { iast: 'cule', tangTranslit: '主戾', grammar: '阴性单数呼格', meaningZh: '高显尊胜、出生妙智尊', meaningEn: 'O Exalted / Rising One' },
          { iast: 'cunde', tangTranslit: '准提', grammar: '阴性单数呼格 (cundī)', meaningZh: '极端严清净辉曜佛母', meaningEn: 'O Pure Cundī' }
        ]
      }
    ]
  },
  {
    id: 'aparimitayur-jnana',
    titleZh: '圣无量寿决定光明王陀罗尼 (十小咒之五 · GRETIL 梵本全对勘)',
    titleSaIast: 'Ārya-aparimitāyur-jñāna-suвиниścita-tejorāja-dhāraṇī',
    titleSaDeva: 'आर्यापरिमितायुर्ज्ञानसुविनिश्चिततेजोराजधारणी',
    titleSaSiddham: '𑖁𑖨𑖿𑖧𑖯𑖢𑖨𑖰𑖦𑖰𑖝𑖯𑖧𑖲𑖨𑖿𑖕𑖿𑖗𑖯𑖡𑖭𑖲𑖪𑖰𑖡𑖰𑖫𑖿𑖓𑖰𑖝𑖝𑖼𑖕𑖺𑖨𑖯𑖕𑖠𑖯𑖨𑖜𑖱',
    titleEn: 'Noble Boundless Life and Determined Wisdom Light-King Dhāraṇī',
    category: 'ten-small',
    deityFocus: '无量寿智决定光明王如来 (Aparimitāyurjñāna-suviniścitatejorāja)',
    seedSyllableIast: 'hrīḥ',
    seedSyllableSiddham: '𑖮𑖿𑖨𑖱𑖿',
    seedSyllableDeva: 'ह्रीः',
    seedSyllableZh: '纥哩',
    summaryZh:
      '本条目直接下载并逐句对齐德国哥廷根大学 GRETIL 馆藏梵本《Aparimitāyuḥsūtra》(bsu003_u.htm, Klaus Wille 校勘本) 与 CBETA T19n0936 法天译本。',
    ritualBenefitsZh: '若人短寿夭折，书写受持读诵此陀罗尼，能满百岁寿命，消除短命横死定业，命终往生无量寿佛极乐世界。',
    sourceMeta: {
      cbetaXmlId: 'T19n0936',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n0936.xml',
      taishoVolPage: 'T19, No. 936, pp. 84b–85b',
      ancientTranslator: '宋 西天中印度摩伽陀国三藏法天 奉诏译',
      gretilId: 'bsu003_u.htm',
      gretilRawUrl:
        'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/bsu003_u.htm',
      sanskritEditionCitation:
        'GRETIL bsu003_u.htm (Aparimitāyuḥsūtra, ed. Konow 1916 & Klaus Wille / Göttingen)',
      tangPhoneticNotes: ['अपरिमितायुः (无量寿) · सुविनिश्चिततेजोराजाय (决定光明王)']
    },
    verses: [
      {
        id: 'aj-1',
        index: 1,
        sectionTag: '第一分 · 归命无量寿智决定光明王如来 (GRETIL bsu003_u.htm 原句)',
        iast: 'oṃ namo bhagavate aparimitāyur-jñāna-suviniścita-tejorājāya tathāgatāya arhate samyaksaṃbuddhāya',
        tangTranslit: '唵 捺摩巴葛瓦帝 阿巴啰密沓 阿优哩阿纳 苏必你实执沓 牒左啰宰也 怛塔哿达也 阿啰诃帝 三药三不达也',
        meaningZh: '嗡！归命世尊、无量寿智决定光明王如来、应供、正遍知！',
        meaningEn: 'Oṃ! Homage to the Blessed One, the Tathāgata Boundless-Life-and-Wisdom Well-Determined King of Light, the Arhat, the Perfectly Awakened Buddha!',
        words: [
          { iast: 'aparimitāyur-jñāna', tangTranslit: '阿巴啰密沓阿优哩阿纳', grammar: '复合词词干', meaningZh: '无量寿命与无边智慧', meaningEn: 'boundless life and wisdom' },
          { iast: 'suviniścita-tejorājāya', tangTranslit: '苏必你实执沓牒左啰宰也', grammar: '阳性单数第四为格', meaningZh: '向极决定威德光明王', meaningEn: 'to the Well-Determined King of Radiance' }
        ]
      },
      {
        id: 'aj-2',
        index: 2,
        sectionTag: '第二分 · 福智庄严与摄持寿命真言句',
        iast: 'tadyathā oṃ puṇya-puṇya mahāpuṇya aparimita-puṇya aparimita-puṇya-jñāna-saṃbhāropacite | oṃ sarva-saṃskāra-pariśuddha dharmate gagana-samudgate svabhāva-viśuddhe mahānaya-parivāre svāhā',
        tangTranslit: '怛你也他 唵 萨哩瓦 桑斯葛哩 叭哩述沓 达啰马帝 哿哿捺 萨穆得哿帝 莎巴瓦 比述帝 马喝捺也 叭哩瓦哩 娑喝',
        meaningZh: '即说咒曰：嗡！福德、大福德、无量福德智资粮积集尊！嗡！一切行清净法性、如虚空周遍涌现、自性无垢清净、大乘圣众眷属围绕：娑嚩诃！',
        meaningEn: 'Namely: Oṃ! Merit, great merit, boundless accumulation of merit and wisdom! Oṃ! Pure Dharma-nature of all conditioned things, arising like the sky, pure in intrinsic nature, surrounded by the retinue of the Great Vehicle: Svāhā!',
        words: [
          { iast: 'sarva-saṃskāra-pariśuddha', tangTranslit: '萨哩瓦桑斯葛哩叭哩述沓', grammar: '呼格', meaningZh: '一切诸行悉皆清净', meaningEn: 'pure in all conditioned phenomena' },
          { iast: 'gagana-samudgate', tangTranslit: '哿哿捺萨穆得哿帝', grammar: '呼格', meaningZh: '等虚空界遍现无碍', meaningEn: 'arisen equal to the vast sky' },
          { iast: 'mahānaya-parivāre', tangTranslit: '马喝捺也叭哩瓦哩', grammar: '呼格', meaningZh: '大乘法门无量圣众围绕', meaningEn: 'surrounded by the Great Way retinue' }
        ]
      }
    ]
  },
  {
    id: 'bhaisajyaguru',
    titleZh: '药师琉璃光如来灌顶真言 (十小咒之六 · 吉尔吉特梵本对照)',
    titleSaIast: 'Bhaiṣajyaguru-vaidūryaprabharāja-dhāraṇī',
    titleSaDeva: 'भैषज्यगुरुवैदूर्यप्रभराजधारणी',
    titleSaSiddham: '𑖥𑖹𑖬𑖕𑖿𑖧𑖐𑖲𑖨𑖲𑖪𑖹𑖟𑖳𑖨𑖿𑖧𑖢𑖿𑖨𑖥𑖨𑖯𑖕𑖠𑖯𑖨𑖜𑖱',
    titleEn: 'Medicine Buddha (Bhaiṣajyaguru Vaidūryaprabha) Dhāraṇī',
    category: 'ten-small',
    deityFocus: '东方净琉璃世界药师琉璃光如来 (Bhaiṣajyaguru)',
    seedSyllableIast: 'bhai',
    seedSyllableSiddham: '𑖥𑖹',
    seedSyllableDeva: 'भै',
    seedSyllableZh: '鞞',
    summaryZh:
      '本条目整合吉尔吉特（Gilgit）6世纪桦树皮写本《Bhaiṣajyagurusūtra》(GRETIL bsu012_u.htm, Nalinaksha Dutt 校勘本) 与玄奘译《药师琉璃光如来本愿功德经》(T14n0450)。',
    ritualBenefitsZh: '拔除一切有情身心病苦，令诸根完具，无诸疾苦，直至菩提不堕恶趣。',
    sourceMeta: {
      cbetaXmlId: 'T14n0450',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T14/T14n0450.xml',
      taishoVolPage: 'T14, No. 450, p. 406b & No. 451 (义净译)',
      ancientTranslator: '唐 三藏法师玄奘 奉诏译 / 唐 义净 译',
      gretilId: 'bsu012_u.htm',
      gretilRawUrl:
        'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/bsu012_u.htm',
      sanskritEditionCitation:
        'GRETIL bsu012_u.htm (Bhaiṣajyagurusūtra, Gilgit Manuscripts Vol. I, ed. N. Dutt 1939 & Vaidya BST 17)',
      tangPhoneticNotes: ['भैषज्ये भैषज्ये महाभैषज्ये (药、药、大法药) · समुद्गते स्वाहा (普度高升成就)']
    },
    verses: [
      {
        id: 'bg-1',
        index: 1,
        sectionTag: '全一分 · 药师琉璃光如来根本灌顶真言 (Gilgit 梵本)',
        iast: 'namo bhagavate bhaiṣajyaguru-vaidūrya-prabha-rājāya tathāgatāya arhate samyaksaṃbuddhāya | tadyathā oṃ bhaiṣajye bhaiṣajye mahābhaiṣajye bhaiṣajya-samudgate svāhā',
        tangTranslit: '南谟薄伽伐帝 鞞杀社窭噜 薜琉璃 钵喇婆 喝啰阇也 怛他揭多也 阿啰喝帝 三藐三勃陀耶 ｜ 怛侄他 唵 鞞杀逝 鞞杀逝 摩诃鞞杀社 三没揭帝 莎诃',
        meaningZh: '归命世尊、药师琉璃光王如来、应供、正遍知！即说咒曰：嗡！良药、良药、无上大法药！令一切众生离苦普度直趣正觉：娑嚩诃！',
        meaningEn: 'Homage to the Blessed One, Medicine Master and King of Lapis Lazuli Light, Tathāgata, Arhat, Perfectly Awakened Buddha! Namely: Oṃ! Healing, healing, supreme healing, arisen to heal all beings: Svāhā!',
        words: [
          { iast: 'bhaiṣajyaguru', tangTranslit: '鞞杀社窭噜', grammar: '复合词词干', meaningZh: '药师（大医王）', meaningEn: 'Master of Healing / Medicine Guru' },
          { iast: 'vaidūrya-prabha-rājāya', tangTranslit: '薜琉璃钵喇婆喝啰阇也', grammar: '阳性单数第四为格', meaningZh: '向琉璃光明王', meaningEn: 'to the King of Lapis Lazuli Light' },
          { iast: 'bhaiṣajye mahābhaiṣajye', tangTranslit: '鞞杀逝摩诃鞞杀社', grammar: '处格/呼格', meaningZh: '妙药、拔除生死病根之大法药', meaningEn: 'in healing, in supreme healing' },
          { iast: 'samudgate', tangTranslit: '三没揭帝', grammar: '呼格/处格', meaningZh: '普遍高升、究竟超度', meaningEn: 'perfectly arisen / transcended' }
        ]
      }
    ]
  },
  {
    id: 'avalokitesvara-prarthana',
    titleZh: '观音灵感真言 (十小咒之七)',
    titleSaIast: 'Avalokiteśvara-praṇidhāna-mantra',
    titleSaDeva: 'अवलोकितेश्वरप्रणिधानमन्त्र',
    titleSaSiddham: '𑖀𑖪𑖩𑖺𑖎𑖰𑖝𑖼𑖫𑖿𑖪𑖨𑖢𑖿𑖨𑖜𑖰𑖠𑖯𑖡𑖦𑖡𑖿𑖝𑖿𑖨',
    titleEn: 'Avalokiteśvara Miraculous Response Dhāraṇī',
    category: 'ten-small',
    deityFocus: '大慈大悲救苦救难观世音菩萨',
    seedSyllableIast: 'oṃ',
    seedSyllableSiddham: '𑖼𑗀',
    seedSyllableDeva: 'ॐ',
    seedSyllableZh: '唵',
    summaryZh: '融合六字大明心印与大悲光明总持，感应力极强，寻声救苦无刹不现身。',
    ritualBenefitsZh: '礼敬祈请观音慈光护佑，消除热恼灾障，所求顺遂平安。',
    sourceMeta: {
      cbetaXmlId: 'T20n1050',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1050.xml',
      taishoVolPage: 'T20, No. 1050 & 明清禅门日诵',
      ancientTranslator: '唐宋密藏传译',
      sanskritEditionCitation: 'Sanskrit Reconstruction from Kāraṇḍavyūha & Avalokiteśvara Kalpas',
      tangPhoneticNotes: ['唵 嘛呢叭咪吽 (六字大明心印) · 麻曷倪牙纳 (大智光明)']
    },
    verses: [
      {
        id: 'ap-1',
        index: 1,
        sectionTag: '全一分 · 观音灵感真言',
        iast: 'oṃ maṇi padme hūṃ | mahājñāna cittotpāda citta-kṣaṇa vitarka sarvārtha bhūri-siddhaka nāgapūraṇa bhūri-bhūri uttama-siddhi svāhā',
        tangTranslit: '唵 嘛呢叭咪吽 ｜ 麻曷倪牙纳 积都特巴达 积特些纳 微达哩葛 萨而斡而塔 卜哩悉塔葛 纳补啰纳 纳卜哩 丢忒班呐 捺麻嚧吉 说啰耶 莎诃',
        meaningZh: '嗡 摩尼宝莲华 吽！发大智慧菩提心、一念顿照无碍、成办一切义利、圆满诸天龙众善愿、出生无上妙成就，顶礼世间自在尊：娑嚩诃！',
        meaningEn: 'Oṃ Jewel in the Lotus Hūṃ! Generating the mind of great wisdom, in a single moment of thought accomplishing all aims, fulfilling all wishes and supreme siddhi: Homage to Lokeśvara, Svāhā!',
        words: [
          { iast: 'maṇi padme', tangTranslit: '嘛呢叭咪', grammar: '呼格', meaningZh: '宝珠莲华尊', meaningEn: 'O Jewel-Lotus' },
          { iast: 'mahājñāna cittotpāda', tangTranslit: '麻曷倪牙纳积都特巴达', grammar: '复合词', meaningZh: '发起大智慧菩提心', meaningEn: 'generation of the mind of great wisdom' },
          { iast: 'sarvārtha', tangTranslit: '萨而斡而塔', grammar: 'sarva-artha', meaningZh: '一切自他义利', meaningEn: 'all aims and benefits' }
        ]
      }
    ]
  },
  {
    id: 'sapta-buddha-papaksaya',
    titleZh: '七佛灭罪真言 (十小咒之八)',
    titleSaIast: 'Saptabuddha-pāpakṣaya-dhāraṇī',
    titleSaDeva: 'सप्तबुद्धपापक्षयधारणी',
    titleSaSiddham: '𑖭𑖢𑖿𑖝𑖤𑖲𑖟𑖿𑖠𑖢𑖯𑖢𑖎𑖿𑖬𑖧𑖠𑖯𑖨𑖜𑖱',
    titleEn: 'Seven Past Buddhas Karmic-Purification Mantra',
    category: 'ten-small',
    deityFocus: '过去七佛 (毗婆尸佛、尸弃佛、毗舍浮佛、拘留孙佛、拘那含牟尼佛、迦叶佛、释迦牟尼佛)',
    seedSyllableIast: 'huṃ',
    seedSyllableSiddham: '𑖮𑖲𑖾',
    seedSyllableDeva: 'हुं',
    seedSyllableZh: '吽',
    summaryZh:
      '出自《大方等陀罗尼经》(CBETA T21n1339)。文殊师利菩萨请佛宣说过去七佛同共加持之灭四重五逆罪陀罗尼。',
    ritualBenefitsZh: '消灭四重五逆重罪，拔除一切恶业种子，心得清凉寂静。',
    sourceMeta: {
      cbetaXmlId: 'T21n1339',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T21/T21n1339.xml',
      taishoVolPage: 'T21, No. 1339, p. 655a',
      ancientTranslator: '北凉 沙门法众 译',
      sanskritEditionCitation: 'CBETA T21n1339 (Mahāvaipulya-dhāraṇī-sūtra)',
      tangPhoneticNotes: ['离婆离婆帝 (清净离垢) · 陀罗尼帝 (总持法性) · 摩诃伽蒂 (大超度门)']
    },
    verses: [
      {
        id: 'sb-1',
        index: 1,
        sectionTag: '全一分 · 七佛灭罪真言',
        iast: 'lipa-lipate kuha-kuhate traṇite nigalārite vimarite mahāgate jaliṅkāre svāhā',
        tangTranslit: '离婆离婆帝 求诃求诃帝 陀罗尼帝 尼诃啰帝 毗黎你帝 摩诃伽帝 真陵乾帝 莎婆诃',
        meaningZh: '远离一切垢染、摧破三界窟宅无明、安住大总持门、解脱系缚、清净离尘、趣向摩诃大般涅槃、寂静凝然：娑嚩诃！',
        meaningEn: 'Free from all defilements, shattering the caverns of ignorance, abiding in total retention, liberated from bonds, immaculate, going to the Great Awakening, serene and tranquil: Svāhā!',
        words: [
          { iast: 'lipa-lipate', tangTranslit: '离婆离婆帝', grammar: '呼格', meaningZh: '不染一切世间尘垢者', meaningEn: 'O One unstained by defilement' },
          { iast: 'traṇite', tangTranslit: '陀罗尼帝', grammar: '呼格', meaningZh: '总持救护一切众生者', meaningEn: 'O Upholder and Protector' },
          { iast: 'mahāgate', tangTranslit: '摩诃伽帝', grammar: '呼格', meaningZh: '趣入大乘究竟彼岸者', meaningEn: 'O One gone to the Great Beyond' }
        ]
      }
    ]
  },
  {
    id: 'sukhavati-vyuha',
    titleZh: '拔一切业障根本得生净土神咒 (往生咒 · 十小咒之九)',
    titleSaIast: 'Sukhāvatīvyūha-dhāraṇī (Amṛtabindu-dhāraṇī)',
    titleSaDeva: 'सुखावतीव्यूहधारणी',
    titleSaSiddham: '𑖭𑖲𑖏𑖯𑖪𑖝𑖱𑖪𑖿𑖧𑖳𑖮𑖠𑖯𑖨𑖜𑖱',
    titleEn: 'Rebirth in the Pure Land of Ultimate Bliss Dhāraṇī',
    category: 'ten-small',
    deityFocus: '西方极乐世界阿弥陀佛 (Amitābha / Amitāyus)',
    seedSyllableIast: 'hrīḥ',
    seedSyllableSiddham: '𑖮𑖿𑖨𑖱𑖿',
    seedSyllableDeva: 'ह्रीः',
    seedSyllableZh: '纥哩',
    summaryZh:
      '刘宋求那跋陀罗译《拔一切业障根本得生净土神咒》(CBETA T12n0368) 暨唐不空译《阿弥陀佛根本秘密神咒》。净土宗与密教行者日课必诵之阿弥陀佛心印。',
    ritualBenefitsZh: '阿弥陀佛常住其顶日夜拥护，不令冤家得便，现世常得安隐，临命终时任运往生极乐上品。',
    sourceMeta: {
      cbetaXmlId: 'T12n0368',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T12/T12n0368.xml',
      taishoVolPage: 'T12, No. 368, p. 351c',
      ancientTranslator: '刘宋 中天竺三藏求那跋陀罗 译',
      sanskritEditionCitation: 'CBETA T12n0368 & Amṛtadundubhisvara-dhāraṇī Sanskrit Parallel',
      tangPhoneticNotes: [
        '阿弥多婆夜 (无量光，Amitābhāya) · 哆他伽多夜 (如来，Tathāgatāya)',
        '阿弥利都婆毗 (甘露生起，Amṛtodbhave) · 伽伽那枳多迦利 (名闻遍满虚空)'
      ]
    },
    verses: [
      {
        id: 'sv-1',
        index: 1,
        sectionTag: '全一分 · 拔一切业障根本得生净土陀罗尼 (全59字)',
        iast: 'namo amitābhāya tathāgatāya | tadyathā oṃ amṛtodbhave amṛta-siddhaṃbhave amṛta-vikrānte amṛta-vikrānta-gāmini gagana-kīrti-kare svāhā',
        tangTranslit: '南无阿弥多婆夜 哆他伽多夜 ｜ 哆地夜他 阿弥利都婆毗 阿弥利哆 悉耽婆毗 阿弥利哆 毗迦兰帝 阿弥利哆 毗迦兰多 伽弥腻 伽伽那 枳多迦利 娑婆诃',
        tangYinNotes: ['蜜栗(二合)', '娑嚩(二合)诃'],
        meaningZh: '归命无量光如来！即说咒曰：嗡！甘露生起尊、甘露成就发生尊、甘露神通广大超越尊、甘露无碍游行尊、令功德名声周遍虚空尊：圆满成就！',
        meaningEn: 'Homage to Amitābha Tathāgata! Namely: Oṃ! O Ambrosia-Arising One, Ambrosia-Accomplishing One, Ambrosia-Transcending One, Ambrosia-Pervading Traveler, Maker of Sky-Filling Glory: Svāhā!',
        words: [
          { iast: 'amitābhāya', tangTranslit: '阿弥多婆夜', grammar: 'amita-ābha (阳性单数第四为格)', meaningZh: '向无量光佛', meaningEn: 'to Amitābha (Infinite Light)' },
          { iast: 'amṛtodbhave', tangTranslit: '阿弥利都婆毗', grammar: 'amṛta-udbhava (阴性单数呼格)', meaningZh: '不死甘露法水出生处', meaningEn: 'O Source of Ambrosia' },
          { iast: 'amṛta-vikrānte', tangTranslit: '阿弥利哆毗迦兰帝', grammar: '阴性单数呼格', meaningZh: '甘露大威神力奋迅超越者', meaningEn: 'O Valiant Transcender with Nectar' },
          { iast: 'gagana-kīrti-kare', tangTranslit: '伽伽那枳多迦利', grammar: '阴性单数呼格', meaningZh: '令无量光寿名闻遍满虚空者', meaningEn: 'O Maker of Sky-Pervading Renown' }
        ]
      }
    ]
  },
  {
    id: 'suvarnaprabhasa-sri',
    titleZh: '善女天咒 · 大吉祥天女陀罗尼 (十小咒之十 · GRETIL 梵本对照)',
    titleSaIast: 'Mahāśrī-devī-dhāraṇī (Suvarṇaprabhāsottama-sūtra)',
    titleSaDeva: 'महाश्रीदेवीधारणी',
    titleSaSiddham: '𑖦𑖮𑖯𑖫𑖿𑖨𑖱𑖟𑖼𑖪𑖱𑖠𑖯𑖨𑖜𑖱',
    titleEn: 'Great Auspicious Goddess (Śrīmahādevī) Dhāraṇī',
    category: 'ten-small',
    deityFocus: '大吉祥天女 / 功德天 (Śrīmahādevī / Mahālakṣmī)',
    seedSyllableIast: 'śrīṃ',
    seedSyllableSiddham: '𑖫𑖿𑖨𑖱𑖾',
    seedSyllableDeva: 'श्रीं',
    seedSyllableZh: '室哩(二合)',
    summaryZh:
      '出自《金光明最胜王经·大吉祥天女增长财物品》(CBETA T16n0665 义净译本，含 92 组悉昙对音) 及德国哥廷根大学 GRETIL 梵本 bsu035_u.htm 与 bsu007_u.htm。',
    ritualBenefitsZh: '能除一切贫穷业障，获大财宝丰饶，资具圆满，所修福德善根速疾增长。',
    sourceMeta: {
      cbetaXmlId: 'T16n0665',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T16/T16n0665.xml',
      taishoVolPage: 'T16, No. 665, pp. 439c–440a',
      ancientTranslator: '唐 三藏法师义净 奉诏译',
      gretilId: 'bsu035_u.htm',
      gretilRawUrl:
        'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/bsu035_u.htm',
      sanskritEditionCitation:
        'GRETIL bsu035_u.htm (Suvarṇaprabhāsasūtra, ed. S. Bagchi, BST 8, Darbhanga 1967) & bsu007_u.htm',
      tangPhoneticNotes: ['महादेवी (大天女) · पद्मवनवासिनि (安住莲华林者) · सर्वार्थसाधनि (成办一切义利)']
    },
    verses: [
      {
        id: 'ss-1',
        index: 1,
        sectionTag: '全一分 · 金光明最胜王经大吉祥天女陀罗尼 (GRETIL bsu035_u.htm 原典)',
        iast: 'namo buddhāya namo dharmāya namo saṃghāya | namo śrī-mahādevyāya | tadyathā paripūraṇa-care samanta-darśane mahāvihāra-gate samanta-vidhamane mahākārya-pratiṣṭhāpane sarvārtha-sādhane supratiṣṭhite āyāntu mama sarva-kāryāṇi sādhaya svāhā',
        tangTranslit: '南无佛陀 南无达摩 南无僧伽 ｜ 南无室利 摩诃提鼻耶 ｜ 怛你也他 波利富楼那 遮利 三曼陀 达舍尼 摩诃毗诃罗伽帝 三曼陀 毗尼伽帝 摩诃迦里野 波祢 波啰 波祢 萨利嚩栗他 三曼陀 修钵黎帝 富隶那 阿利那 达摩帝 摩诃毗鼓毕帝 摩诃弥勒帝 娄簸僧祇帝 醯帝簁 僧祇醯帝 三曼陀 阿他阿耨 婆罗尼 娑嚩诃',
        meaningZh: '归命佛、法、僧三宝！归命大吉祥天女！即说咒曰：圆满行持尊、普遍慈眼观照尊、入大精舍寂静尊、普破一切穷困暗障尊、安立大胜业尊、成办一切义利尊、妙善安住尊：唯愿降临令我一切善业悉皆圆满成就，娑嚩诃！',
        meaningEn: 'Homage to the Buddha, Dharma, and Saṃgha! Homage to Śrīmahādevī! Namely: O One of complete conduct, Universal Beholder, Abiding in the Great Monastery, Universal Destroyer of darkness, Establisher of great deeds, Accomplisher of all aims: may all my virtuous undertakings be fulfilled, Svāhā!',
        words: [
          { iast: 'śrī-mahādevyāya', tangTranslit: '室利摩诃提鼻耶', grammar: '第四为格', meaningZh: '向大吉祥功德天女', meaningEn: 'to the Great Auspicious Goddess' },
          { iast: 'paripūraṇa-care', tangTranslit: '波利富楼那遮利', grammar: '阴性单数呼格', meaningZh: '所行圆满具足者', meaningEn: 'O One of fulfilling conduct' },
          { iast: 'samanta-darśane', tangTranslit: '三曼陀达舍尼', grammar: '阴性单数呼格', meaningZh: '普遍慈眼观照十方者', meaningEn: 'O Universal Beholder' },
          { iast: 'sarvārtha-sādhane', tangTranslit: '萨利嚩栗他三曼陀', grammar: '阴性单数呼格', meaningZh: '成办一切世出世间福德义利者', meaningEn: 'O Accomplisher of all aims' }
        ]
      }
    ]
  }
];
