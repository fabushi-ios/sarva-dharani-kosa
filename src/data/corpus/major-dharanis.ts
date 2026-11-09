/**
 * 四大咒与根本大陀罗尼语料库 (src/data/corpus/major-dharanis.ts)
 * 数据源自 CBETA TEI-P5 (T19n0974B, T20n1113B, T19n0945, T19n1022A, T19n1002) 及 GRETIL 梵本
 */

import { DharaniEntry } from '../../types/dharani';

export const MAJOR_DHARANIS: DharaniEntry[] = [
  {
    id: 'usnisa-vijaya',
    titleZh: '佛顶尊胜陀罗尼 (唐不空译梵汉对音注义本)',
    titleSaIast: 'Sarvatathāgatoṣṇīṣavijayā nāma dhāraṇī',
    titleSaDeva: 'सर्वतथागतोष्णीषविजया नाम धारणी',
    titleSaSiddham: '𑖭𑖨𑖿𑖪𑖝𑖞𑖯𑖐𑖝𑖺𑖬𑖿𑖜𑖱𑖬𑖪𑖰𑖕𑖧𑖯 𑖡𑖯𑖦 𑖠𑖯𑖨𑖜𑖱',
    titleEn: 'Uṣṇīṣa Vijayā Dhāraṇī (Victorious Buddha-Crown Dhāraṇī)',
    category: 'major',
    deityFocus: '尊胜佛顶如来 (Uṣṇīṣavijayā)',
    seedSyllableIast: 'bhrūṃ',
    seedSyllableSiddham: '𑖥𑖿𑖨𑖳𑖾',
    seedSyllableDeva: 'भ्रूँ',
    seedSyllableZh: '勃笼(二合引)',
    summaryZh:
      '一切如来无上佛顶尊胜总持法门。本数据直接关联 CBETA《大正藏》第19册 No.0974B 不空三藏译《佛顶尊胜陀罗尼注义》全部 470 组 <cb:tt> 悉昙梵字与唐音对译、二合/引声调夹注。',
    ritualBenefitsZh: '净除一切恶道，能除一切千劫以来积造恶业重障，增寿吉祥，得一切如来智印加持。',
    sourceMeta: {
      cbetaXmlId: 'T19n0974B',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n0974B.xml',
      taishoVolPage: 'T19, No. 974B, pp. 384c–386b',
      ancientTranslator: '唐 三藏沙门大广智不空 奉诏注义',
      sanskritEditionCitation:
        'CBETA T19n0974B (470 Siddhaṃ-Chinese <cb:tt> interlinear blocks) & Hōryū-ji Palm-Leaf MS (法隆寺贝叶梵本)',
      tangPhoneticNotes: [
        '曩谟 (归命) · 婆伽嚩帝 (世尊)',
        '怛赖路枳也 (三界，赖字转舌) · 钵啰底尾始瑟吒也 (最胜殊特)',
        '乌瑟抳洒 (佛顶，瑟抳二合) · 尾戌uddha也 (极清净)',
        '勃笼 (bhrūṃ，一字金轮佛顶种子字，二合重引)'
      ]
    },
    verses: [
      {
        id: 'uv-1',
        index: 1,
        sectionTag: '第一分 · 三宝与三界最胜世尊归命分',
        iast: 'namo bhagavate trailokyaprativiśiṣṭāya buddhāya bhagavate',
        tangTranslit: '曩谟 婆伽嚩帝 怛赖(二合)路枳也(二合) 钵啰(二合)底尾始瑟吒(二合引)也 没驮也 婆伽嚩帝',
        tangYinNotes: ['怛赖(二合)', '枳也(二合)', '钵啰(二合)', '瑟吒(二合引)'],
        meaningZh: '归命世尊、三界中最极殊胜超绝之觉者佛陀世尊！',
        meaningEn: 'Homage to the Blessed One, the Awakened One who is supreme throughout the Three Worlds, the Blessed One!',
        words: [
          { iast: 'namo', tangTranslit: '曩谟', grammar: 'namas (中性单数体格连音)', meaningZh: '归命、顶礼', meaningEn: 'Homage to' },
          { iast: 'bhagavate', tangTranslit: '婆伽嚩帝', grammar: 'bhagavat (阳性单数第四为格)', meaningZh: '世尊、薄伽梵', meaningEn: 'to the Blessed One' },
          { iast: 'trailokya-prativiśiṣṭāya', tangTranslit: '怛赖路枳也钵啰底尾始瑟吒也', yinNote: '二合引', grammar: '复合词阳性单数第四为格', meaningZh: '于三界中最极殊胜尊特者', meaningEn: 'to the Most Distinguished in the Three Worlds' },
          { iast: 'buddhāya', tangTranslit: '没驮也', grammar: 'buddha (阳性单数第四为格)', meaningZh: '向觉者佛陀', meaningEn: 'to the Buddha' }
        ]
      },
      {
        id: 'uv-2',
        index: 2,
        sectionTag: '第二分 · 虚空清净与千光明惊觉分',
        iast: 'tadyathā oṃ viśodhaya viśodhaya asama-samanta avabhāsa-spharaṇa-gati-gahana-svabhāva-viśuddhe',
        tangTranslit: '怛你也(二合)他 唵 尾驮野 尾驮野 阿娑么 娑漫多 阿嚩婆娑 娑破(二合)啰拏 揭底 誐诃曩 娑嚩(二合)婆嚩 尾秫第',
        tangYinNotes: ['你也(二合)', '戍(引)', '娑破(二合)', '娑嚩(二合)'],
        meaningZh: '即说咒曰：嗡！令清净、令极清净！无等周遍光明舒遍五道稠林、自性本净尊！',
        meaningEn: 'Namely: Oṃ! Purify, purify! O One of pure intrinsic nature, whose unequalled all-pervading radiance illuminates all realms of existence!',
        words: [
          { iast: 'tadyathā', tangTranslit: '怛你也他', yinNote: '二合', grammar: 'tad-yathā (不变词)', meaningZh: '所谓、即说咒曰', meaningEn: 'namely, thus' },
          { iast: 'oṃ', tangTranslit: '唵', grammar: '神圣三身种子字', meaningZh: '三身无上正觉总持音', meaningEn: 'Sacred syllable Oṃ' },
          { iast: 'viśodhaya', tangTranslit: '尾驮野', yinNote: '引', grammar: 'vi-√śudh 致使式第二人称单数祈使', meaningZh: '唯愿净除、令清净', meaningEn: 'purify! cleanse!' },
          { iast: 'svabhāva-viśuddhe', tangTranslit: '娑嚩婆嚩尾秫第', grammar: '阴性单数呼格', meaningZh: '自性清净尊啊（如虚空清净）', meaningEn: 'O One pure in intrinsic nature' }
        ]
      },
      {
        id: 'uv-3',
        index: 3,
        sectionTag: '第三分 · 甘露灌顶与阿弥陀寿命加持分',
        iast: 'abhiṣiñcatu māṃ sugata-vara-vacana amṛtābhiṣekair mahā-mantra-padaiḥ āhara āhara āyuḥ-saṃdhāraṇi',
        tangTranslit: '阿鼻诜左睹 𤚥 素蘖多 嚩啰 嚩左曩 阿蜜栗(二合)多 鼻晒罽 摩诃 曼怛啰(二合) 跛奈 阿诃啰 阿诃啰 阿庾 散陀啰抳',
        tangYinNotes: ['蜜栗(二合)', '曼怛啰(二合)', '阿(去引)'],
        meaningZh: '唯愿以善逝妙言、甘露灌顶及大真言句为我灌顶！摄持、摄持！持寿命者！',
        meaningEn: 'Consecrate me with the supreme words of the Sugata, with nectar consecrations and great mantra phrases! Sustain, sustain, O Sustainer of life!',
        words: [
          { iast: 'abhiṣiñcatu', tangTranslit: '阿鼻诜左睹', grammar: 'abhi-√sic 第三人称单数祈使', meaningZh: '唯愿为我灌顶', meaningEn: 'may He consecrate' },
          { iast: 'amṛtābhiṣekaiḥ', tangTranslit: '阿蜜栗多鼻晒罽', yinNote: '二合', grammar: '中性复数第三具格', meaningZh: '以不死甘露灌顶水', meaningEn: 'with ambrosial consecrations' },
          { iast: 'āyuḥ-saṃdhāraṇi', tangTranslit: '阿庾散陀啰抳', grammar: '阴性单数呼格', meaningZh: '持寿命母、增寿总持尊', meaningEn: 'O Sustainer of longevity' }
        ]
      },
      {
        id: 'uv-4',
        index: 4,
        sectionTag: '第四分 · 佛顶尊胜与金刚钩锁护持分',
        iast: 'śodhaya śodhaya gagana-viśuddhe uṣṇīṣa-vijaya-viśuddhe sahasra-raśmi-saṃcodite',
        tangTranslit: '戍(引)驮野 戍(引)驮野 誐誐曩 尾秼第 坞瑟抳(二合)洒 尾惹野 尾秼第 娑贺娑啰(二合) 啰湿茗(二合) 散祖儞帝',
        tangYinNotes: ['戍(引)', '瑟抳(二合)', '娑啰(二合)', '湿茗(二合)'],
        meaningZh: '净除、净除！如虚空清净尊！佛顶最胜清净尊！千光明常所惊觉尊！',
        meaningEn: 'Purify, purify! O Sky-Pure One! O Victorious Buddha-Crown Pure One! O One aroused by a thousand rays of light!',
        words: [
          { iast: 'gagana-viśuddhe', tangTranslit: '誐誐曩尾秼第', grammar: '阴性单数呼格 (不空注：如虚空清净)', meaningZh: '如虚空清净尊', meaningEn: 'O One pure as the sky' },
          { iast: 'uṣṇīṣa-vijaya-viśuddhe', tangTranslit: '坞瑟抳洒尾惹野尾秼第', yinNote: '二合', grammar: '阴性单数呼格 (不空注：佛顶最胜清净)', meaningZh: '佛顶最胜清净尊', meaningEn: 'O Victorious Uṣṇīṣa Pure One' },
          { iast: 'sahasra-raśmi-saṃcodite', tangTranslit: '娑贺娑啰啰湿茗散祖儞帝', yinNote: '二合', grammar: '阴性单数呼格 (不空注：千光明惊觉)', meaningZh: '千光明惊觉尊', meaningEn: 'O One inspired by a thousand rays' }
        ]
      },
      {
        id: 'uv-5',
        index: 5,
        sectionTag: '第五分 · 一字金轮种子字与大圆满成就分',
        iast: 'sarva-tathāgatāvalokini ṣaṭ-pāramitā-paripūraṇi sarva-tathāgata-māte daśa-bhūmi-pratiṣṭhite oṃ bhrūṃ svāhā',
        tangTranslit: '萨缚 怛他誐多 嚩路(去)伽𩕳 娑(上)吒憣(二合)啰蜜哆 跛哩布啰抳 萨缚怛他誐多么帝 娜舍步弭 钵啰(二合)底瑟耻(二合)帝 唵 勃笼(二合引) 娑嚩(二合)诃',
        tangYinNotes: ['路(去)', '吒憣(二合)', '勃笼(二合引)', '娑嚩(二合)'],
        meaningZh: '一切如来所观照尊、圆满六波罗蜜多尊、一切如来佛母、安住十地尊！嗡 勃笼 娑嚩诃！',
        meaningEn: 'O One beheld by all Tathāgatas, Fulfiller of the Six Perfections, Mother of all Tathāgatas, Abiding on the Ten Grounds: Oṃ Bhrūṃ Svāhā!',
        words: [
          { iast: 'ṣaṭ-pāramitā-paripūraṇi', tangTranslit: '娑吒憣啰蜜哆跛哩布啰抳', yinNote: '二合', grammar: '阴性单数呼格', meaningZh: '圆满六度波罗蜜者', meaningEn: 'O Fulfiller of the Six Pāramitās' },
          { iast: 'daśa-bhūmi-pratiṣṭhite', tangTranslit: '娜舍步弭钵啰底瑟耻帝', yinNote: '二合', grammar: '阴性单数呼格', meaningZh: '安住于菩萨十地者', meaningEn: 'O One established on the Ten Bhūmis' },
          { iast: 'bhrūṃ', tangTranslit: '勃笼', yinNote: '二合引', grammar: '一字佛顶轮王种子字', meaningZh: '大金轮佛顶总持种子字', meaningEn: 'Seed syllable Bhrūṃ' },
          { iast: 'svāhā', tangTranslit: '娑嚩诃', yinNote: '二合', grammar: '圆满吉祥结语词', meaningZh: '圆满成就、吉祥究竟', meaningEn: 'May blessings and accomplishment prevail!' }
        ]
      }
    ]
  },
  {
    id: 'nilakantha',
    titleZh: '千手千眼观世音菩萨广大圆满无碍大悲心陀罗尼 (大悲咒)',
    titleSaIast: 'Nīlakaṇṭha-mahākāruṇika-hṛdaya-dhāraṇī',
    titleSaDeva: 'नीलकण्ठमहाकारुणिकहृदयधारणी',
    titleSaSiddham: '𑖡𑖱𑖩𑖎𑖜𑖿𑖙𑖦𑖮𑖯𑖎𑖯𑖨𑖲𑖜𑖰𑖎𑖮𑖴𑖟𑖧𑖠𑖯𑖨𑖜𑖱',
    titleEn: 'Great Compassion Dhāraṇī (Nīlakaṇṭha Lokeśvara Dhāraṇī)',
    category: 'major',
    deityFocus: '千手千眼观自在菩萨 / 青颈观音 (Nīlakaṇṭha Avalokiteśvara)',
    seedSyllableIast: 'hrīḥ',
    seedSyllableSiddham: '𑖮𑖿𑖨𑖱𑖿',
    seedSyllableDeva: 'ह्रीः',
    seedSyllableZh: '纥哩(二合)',
    summaryZh:
      '汉传与唐密最核心之观音大悲总持法门。本条目同步整合 CBETA《大正藏》T20n1113B 不空译青颈大悲心陀罗尼（含 334 组 <cb:tt> 悉昙梵汉逐字对音与唐代本尊注义）及 T20n1060 伽梵达摩译 84 句通行本。',
    ritualBenefitsZh: '过去九十九亿恒河沙诸佛所宣说，能满一切善愿，灭除十恶五逆重罪，临命终时十方诸佛皆来授手。',
    sourceMeta: {
      cbetaXmlId: 'T20n1113B',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1113B.xml',
      taishoVolPage: 'T20, No. 1113B (pp. 498a–501b) & No. 1060 (pp. 106c–111b)',
      ancientTranslator: '唐 不空三藏 (梵汉对音本 T20n1113B) / 唐 伽梵达摩 (84句通行本 T20n1060)',
      sanskritEditionCitation:
        'CBETA T20n1113B (334 Siddhaṃ-Chinese <cb:tt> pairs) & Sylvain Lévi / Lokesh Chandra Reconstruction',
      tangPhoneticNotes: [
        '曩谟啰怛曩怛啰夜耶 (归命三宝，怛啰二合) · 曩谟阿哩也嚩路吉帝湿嚩啰耶 (归命圣观自在)',
        '室哩 महाकारुणिकाय (大悲心者) · 萨嚩భయविशोधन (净除一切怖畏)',
        '昵攞建姹 (青颈尊，Nīlakaṇṭha) · 摩诃𡁠头摩曩婆 (大莲华脐/毗纽天身现相)'
      ]
    },
    verses: [
      {
        id: 'nk-1',
        index: 1,
        sectionTag: '第一分 · 归命三宝与大悲圣观自在菩萨分 (第1–15句)',
        iast: 'namo ratnatrayāya | namah āryāvalokiteśvarāya bodhisattvāya mahāsattvāya mahākāruṇikāya',
        tangTranslit: '南无 喝啰怛那 哆啰夜耶 ｜ 南无 阿唎耶 婆卢羯帝 烁钵啰耶 菩提萨埵婆耶 摩诃萨埵婆耶 摩诃迦卢尼迦耶',
        tangYinNotes: ['怛曩(二合)', '怛啰(二合)', '哩也(二合)', '湿嚩(二合)'],
        meaningZh: '归命三宝！归命圣观自在菩萨摩诃萨、具足大慈大悲心者！',
        meaningEn: 'Homage to the Three Jewels! Homage to Noble Avalokiteśvara, the Bodhisattva, the Mahāsattva, the Greatly Compassionate One!',
        words: [
          { iast: 'ratnatrayāya', tangTranslit: '喝啰怛那哆啰夜耶', yinNote: '二合', grammar: 'ratna-traya (中性单数第四为格)', meaningZh: '向佛法僧三宝', meaningEn: 'to the Triple Gem' },
          { iast: 'āryāvalokiteśvarāya', tangTranslit: '阿唎耶婆卢羯帝烁钵啰耶', yinNote: '二合', grammar: 'ārya-avalokita-īśvara (阳性单数第四为格)', meaningZh: '向圣观自在尊', meaningEn: 'to Noble Avalokiteśvara' },
          { iast: 'mahākāruṇikāya', tangTranslit: '摩诃迦卢尼迦耶', grammar: '阳性单数第四为格', meaningZh: '向具足大悲心者', meaningEn: 'to the Greatly Compassionate One' }
        ]
      },
      {
        id: 'nk-2',
        index: 2,
        sectionTag: '第二分 · 普遍摄受与离畏青颈心印分 (第16–28句)',
        iast: 'oṃ sarva-bhaya-śodhanāya tasya namaskṛtvā imu āryāvalokiteśvara-tava-namo nīlakaṇṭha',
        tangTranslit: '唵 萨皤啰罚曳 数怛那怛写 南无悉吉栗埵 伊蒙阿唎耶 婆卢吉帝 室佛啰愣驮婆 南无那啰谨墀',
        tangYinNotes: ['萨嚩(二合)', '訖哩(二合)', '怛嚩(二合)'],
        meaningZh: '嗡！于净除一切怖畏尊顶礼已，今演说圣观自在尊青颈大悲心陀罗尼！',
        meaningEn: 'Oṃ! Having bowed to Him who purifies all fears, I now proclaim this heart of Noble Avalokiteśvara, the Blue-Throated One (Nīlakaṇṭha)!',
        words: [
          { iast: 'sarva-bhaya-śodhanāya', tangTranslit: '萨皤啰罚曳数怛那', grammar: '阳性单数第四为格', meaningZh: '向净除一切怖畏者', meaningEn: 'to the Purifier of all fears' },
          { iast: 'namaskṛtvā', tangTranslit: '南无悉吉栗埵', yinNote: '二合', grammar: '绝对分词 (连续体)', meaningZh: '恭敬顶礼已', meaningEn: 'having paid homage' },
          { iast: 'nīlakaṇṭha', tangTranslit: '那啰谨墀 (昵攞建姹)', grammar: '阳性单数呼格', meaningZh: '青颈大悲尊（代众生受毒而颈呈青色）', meaningEn: 'O Blue-Throated Compassionate One' }
        ]
      },
      {
        id: 'nk-3',
        index: 3,
        sectionTag: '第三分 · 无垢清净光明与破烦恼障分 (第29–46句)',
        iast: 'hṛdayaṃ vartayiṣyāmi sarvārtha-sādhanaṃ śubham ajeyaṃ sarva-bhūtānāṃ bhava-mārga-viśodhakam',
        tangTranslit: '醯利摩诃皤哆沙咩 萨婆阿他豆输朋 阿逝孕 萨婆萨哆 那摩婆萨哆 那摩婆伽 摩罚特豆',
        tangYinNotes: ['纥哩(二合)', '萨嚩(二合)'],
        meaningZh: '我今宣说此心咒：能成办一切吉祥义利，于一切有情中无能胜，能净除三有生死道！',
        meaningEn: 'I shall set forth this heart-dhāraṇī, which accomplishes all auspicious aims, is invincible among all beings, and purifies the path of cyclic existence!',
        words: [
          { iast: 'hṛdayam', tangTranslit: '醯利 (纥哩娜野)', yinNote: '二合', grammar: '中性单数第二业格', meaningZh: '心印、心陀罗尼', meaningEn: 'the heart-mantra' },
          { iast: 'sarvārtha-sādhanam', tangTranslit: '萨婆阿他豆', grammar: '中性单数第二业格', meaningZh: '能成办一切义利', meaningEn: 'accomplishing all aims' },
          { iast: 'bhava-mārga-viśodhakam', tangTranslit: '摩罚特豆', grammar: '中性单数第二业格', meaningZh: '净除三有生死正道', meaningEn: 'purifying the path of existence' }
        ]
      },
      {
        id: 'nk-4',
        index: 4,
        sectionTag: '第四分 · 正诵心咒·大莲华主与十地自在分 (第47–68句)',
        iast: 'tadyathā oṃ avaloka lokātīta ehi hare mahābodhisattva sarpa-sarpa smara-smara mama hṛdayam',
        tangTranslit: '怛侄他 唵 阿婆卢醯 卢迦帝 迦罗帝 夷醯唎 摩诃菩提萨埵 萨婆萨婆 摩啰摩啰 摩醯摩醯 唎驮孕',
        tangYinNotes: ['怛你也(二合)', '娑么(二合)啰', '纥哩(二合)'],
        meaningZh: '即说咒曰：嗡！观照者、超世间者！善来大雄猛大菩萨！速疾降临，忆念、忆念吾之大悲本心！',
        meaningEn: 'Namely: Oṃ! O Beholder, Transcender of the World! Come, O Lion, Great Bodhisattva! Move forth, remember, remember my heart-vow!',
        words: [
          { iast: 'avaloka', tangTranslit: '阿婆卢醯', grammar: '阳性单数呼格', meaningZh: '慈悲遍观照世间者', meaningEn: 'O Beholder' },
          { iast: 'lokātīta', tangTranslit: '卢迦帝迦罗帝', grammar: '阳性单数呼格', meaningZh: '超越世间生死者', meaningEn: 'O Transcender of the world' },
          { iast: 'smara-smara', tangTranslit: '摩啰摩啰', yinNote: '二合', grammar: '√smṛ 第二人称单数祈使叠词', meaningZh: '忆念、恒常忆念本誓', meaningEn: 'remember, remember!' }
        ]
      },
      {
        id: 'nk-5',
        index: 5,
        sectionTag: '第五分 · 消除三毒与吉祥圆满成就分 (第69–84句)',
        iast: 'kuru-kuru karma dhuru-dhuru vijayate mahāvijayate dhara-dhara dharīṇīrāja cala-cala mama vimala-mūrte ehy-ehi svāhā | siddhyogeśvarāya svāhā | nīlakaṇṭhāya svāhā',
        tangTranslit: '俱卢俱卢羯蒙 度卢度卢罚阇耶帝 摩诃罚阇耶帝 陀啰陀啰 地唎尼 室佛啰耶 遮啰遮啰 摩摩罚摩啰 穆帝隶 伊醯伊醯 娑婆诃 ｜ 悉陀喻艺 室皤啰耶 娑婆诃 ｜ 那啰谨墀 娑婆诃',
        tangYinNotes: ['羯磨(二合)', '尾惹野', '娑嚩(二合)诃'],
        meaningZh: '作法成办、任持最胜大尊胜！总持自在王、显无垢清净妙色身！善来善来，圆满成就！向成就瑜伽自在尊成就！向青颈大悲尊成就！',
        meaningEn: 'Accomplish the work, uphold supreme victory! O Sovereign of Dhāraṇīs, manifest Your immaculate form! Come, come, Svāhā! To the Lord of Siddhi-Yoga, Svāhā! To Nīlakaṇṭha, Svāhā!',
        words: [
          { iast: 'vijayate mahāvijayate', tangTranslit: '罚阇耶帝摩诃罚阇耶帝', grammar: '呼格/动词称赞', meaningZh: '最胜、大尊胜者', meaningEn: 'Victorious, Greatly Victorious' },
          { iast: 'vimala-mūrte', tangTranslit: '罚摩啰穆帝隶', grammar: '阳性单数呼格', meaningZh: '具足无垢清净法身妙相者', meaningEn: 'O One of immaculate form' },
          { iast: 'siddhyogeśvarāya', tangTranslit: '悉陀喻艺室皤啰耶', grammar: 'siddhi-yoga-īśvara (第四为格)', meaningZh: '向成就瑜伽大自在尊', meaningEn: 'to the Sovereign of Siddhi-Yoga' }
        ]
      }
    ]
  },
  {
    id: 'surangama-atapatra',
    titleZh: '大佛顶首楞严陀罗尼 · 五大心咒暨白伞盖根本心咒',
    titleSaIast: 'Sarvatathāgatoṣṇīṣasitātapatrā-aparājitā-mahāpratyangirā-dhāraṇī',
    titleSaDeva: 'सर्वतथागतोष्णीषसितातपत्रा अपराजिता महाप्रत्यङ्गिरा धारणी',
    titleSaSiddham: '𑖭𑖨𑖿𑖪𑖝𑖞𑖯𑖐𑖝𑖺𑖬𑖿𑖜𑖱𑖬𑖭𑖰𑖝𑖯𑖝𑖢𑖝𑖿𑖨𑖯 𑖠𑖯𑖨𑖜𑖱',
    titleEn: 'Śūraṅgama / Sitātapatrā (White Parasol Buddha-Crown) Heart Dhāraṇī',
    category: 'major',
    deityFocus: '大白伞盖佛母 / 释迦如来无见顶相 (Sitātapatrā Uṣṇīṣa)',
    seedSyllableIast: 'hūṃ',
    seedSyllableSiddham: '𑖮𑖳𑖾',
    seedSyllableDeva: 'हूँ',
    seedSyllableZh: '吽',
    summaryZh:
      '《大佛顶如来密因修证了义诸菩萨万行首楞严经》卷七宣说之咒中之王。本条目对照 CBETA T19n0945 般刺蜜帝译本、T19n0976 不空译本及德国哥廷根大学 GRETIL 馆藏梵本 bsu004_u.htm。',
    ritualBenefitsZh: '十方如来依此心咒得成无上正遍知觉，降伏诸魔，制诸外道，摩登伽女顿断爱染证阿罗汉果。',
    sourceMeta: {
      cbetaXmlId: 'T19n0945',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n0945.xml',
      taishoVolPage: 'T19, No. 945, pp. 139a–141b',
      ancientTranslator: '唐 中天竺沙门般刺蜜帝 译 / 唐 不空三藏 译 (T19n0976)',
      gretilId: 'bsu004_u.htm',
      gretilRawUrl:
        'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/bsu004_u.htm',
      sanskritEditionCitation:
        'GRETIL bsu004_u.htm (Sarvatathāgatoṣṇīṣasitātapatrā nāma aparājitā dhāraṇī, DSBC / Göttingen)',
      tangPhoneticNotes: [
        '叱陀你 (断除一切结缚，佛部心) · 阿迦罗密哩柱 (横死灾障，莲花部/金刚部心)',
        '悉怛多般怛啰 (白伞盖，Sitātapatra) · 摩诃跋阇卢瑟尼钐 (大金刚佛顶)'
      ]
    },
    verses: [
      {
        id: 'sa-1',
        index: 1,
        sectionTag: '第一分 · 五方佛五大心咒（十方如来破魔救护总持心）',
        iast: 'chedani akāla-mṛtyu-paritrāṇa-kāriṇīye | bhagavatoṣṇīṣa-sitātapatre namo \'stu te',
        tangTranslit: '叱陀你 阿迦罗 密哩柱 般唎怛啰耶 儜揭唎 ｜ 婆伽婆独瑟尼钐 悉怛多般怛啰 南无粹都帝',
        tangYinNotes: ['蜜哩(二合)', '怛啰(二合)', '瑟尼(二合)'],
        meaningZh: '断除一切恶咒结缚、救护一切非时横死灾障母！世尊佛顶大白伞盖无能胜尊，我今顶礼赞叹汝！',
        meaningEn: 'O Cutter of bonds, Protector from untimely death! Homage and praise be to You, O Blessed White Parasol of the Buddha-Crown!',
        words: [
          { iast: 'chedani', tangTranslit: '叱陀你', grammar: '阴性单数呼格', meaningZh: '断除一切魔障邪咒者', meaningEn: 'O Cutter / Destroyer of evil spells' },
          { iast: 'akāla-mṛtyu-paritrāṇa-kāriṇīye', tangTranslit: '阿迦罗密哩柱般唎怛啰耶儜揭唎', yinNote: '二合', grammar: '阴性单数呼格/第四格', meaningZh: '拔济一切非时横死苦难者', meaningEn: 'O Protector against untimely death' },
          { iast: 'sitātapatre', tangTranslit: '悉怛多般怛啰', yinNote: '二合', grammar: 'sita-ātapatra (阴性单数呼格)', meaningZh: '清净大白伞盖佛母', meaningEn: 'O White Parasol' }
        ]
      },
      {
        id: 'sa-2',
        index: 2,
        sectionTag: '第二分 · 楞严根本全咒心（摩诃般若金刚王心咒）',
        iast: 'tadyathā oṃ anale anale viśade viśade vīra vajra-dhare bandha bandhani vajra-pāṇi phaṭ hūṃ trūṃ phaṭ svāhā',
        tangTranslit: '怛侄他 唵 阿那隶 阿那隶 毗舍提 毗舍提 鞞啰跋阇啰陀唎 盘陀盘陀你 跋阇啰谤尼泮 虎信都嚧瓮泮 莎婆诃',
        tangYinNotes: ['跋阇啰(二合)', '都嚧(二合)', '娑嚩(二合)诃'],
        meaningZh: '即说咒曰：嗡！智慧烈火、智慧烈火！清净无垢、清净无垢！大勇猛执金刚尊！结界缚魔、结界总持！执金刚手破除一切魔障！吽 敕隆 发吒 娑婆诃！',
        meaningEn: 'Namely: Oṃ! O Blazing Fire, Blazing Fire! O Pure One, Pure One! O Heroic Holder of the Vajra! Bind, O Binder! Vajra-in-Hand: Phaṭ! Hūṃ Trūṃ Phaṭ Svāhā!',
        words: [
          { iast: 'anale', tangTranslit: '阿那隶', grammar: '阴性单数呼格', meaningZh: '般若智慧猛火（烧尽无明欲习）', meaningEn: 'O Blazing Fire of Wisdom' },
          { iast: 'viśade', tangTranslit: '毗舍提', grammar: '阴性单数呼格', meaningZh: '清净无垢、广博明净', meaningEn: 'O Pure and Lucid One' },
          { iast: 'vajra-dhare', tangTranslit: '跋阇啰陀唎', yinNote: '二合', grammar: '呼格', meaningZh: '执持金刚智杵尊', meaningEn: 'O Holder of the Vajra' },
          { iast: 'vajra-pāṇi phaṭ', tangTranslit: '跋阇啰谤尼泮', grammar: '呼格 + 破障音', meaningZh: '金刚手菩萨摧碎群魔', meaningEn: 'O Vajrapāṇi, shatter!' }
        ]
      }
    ]
  },
  {
    id: 'karanda-mudra',
    titleZh: '一切如来心秘密全身舍利宝箧印陀罗尼',
    titleSaIast: 'Sarvatathāgatādhiṣṭhāna-hṛdaya-guhya-dhātu-karaṇḍa-mudrā-dhāraṇī',
    titleSaDeva: 'सर्वतथागताधिष्ठानहृदयगुह्यधातुकरण्डमुद्राधारणी',
    titleSaSiddham: '𑖭𑖨𑖿𑖪𑖝𑖞𑖯𑖐𑖝𑖯𑖠𑖰𑖬𑖿𑖙𑖯𑖡𑖮𑖴𑖟𑖧𑖐𑖲𑖮𑖿𑖧𑖠𑖯𑖝𑖲𑖎𑖨𑖜𑖿𑖚𑖦𑖲𑖟𑖿𑖨𑖯𑖠𑖯𑖨𑖜𑖱',
    titleEn: 'Precious Casket Seal Dhāraṇī (Karaṇḍamudrā Dhāraṇī)',
    category: 'major',
    deityFocus: '十方三世一切如来全身舍利宝塔 (Sarvatathāgata-dhātu-stūpa)',
    seedSyllableIast: 'stūpa',
    seedSyllableSiddham: '𑖭𑖿𑖝𑖳',
    seedSyllableDeva: 'स्तू',
    seedSyllableZh: '窣睹波',
    summaryZh:
      '唐不空三藏译《一切如来心秘密全身舍利宝箧印陀罗尼经》(CBETA T19n1022A)。十方一切如来三身舍利、八万四千法蕴总集之秘密法印。',
    ritualBenefitsZh: '塔所在处即有一切如来全身舍利，礼拜供养或诵持此咒，顿拔地狱苦楚，百病万恼一时消散，命终生于极乐净土。',
    sourceMeta: {
      cbetaXmlId: 'T19n1022A',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n1022A.xml',
      taishoVolPage: 'T19, No. 1022A, pp. 710a–712b',
      ancientTranslator: '唐 三藏沙门大广智不空 奉诏译',
      sanskritEditionCitation:
        'CBETA T19n1022A & Hangchow Leifeng Pagoda (975 CE) / Kanshin-ji Sanskrit Text Reconstruction',
      tangPhoneticNotes: [
        '那莫悉怛哩野地尾迦南 (归命三世一切如来) · 萨婆怛他蘖多南 (一切如来)',
        '婆嚩那嚩哩 (三有轮回结界) · 嚩左黎嚩左啰拆 (金刚火焰遍满)'
      ]
    },
    verses: [
      {
        id: 'km-1',
        index: 1,
        sectionTag: '第一分 · 归命十方三世一切如来分',
        iast: 'namas traiyadhvikānāṃ sarva-tathāgatānām | oṃ bhuvibhavanavare vacanavacaṭi',
        tangTranslit: '那莫 悉怛哩野(四合)地尾(二合)迦(引)南 萨婆怛他(引)蘖多(引)南 ｜ 唵 部尾婆嚩娜嚩哩 嚩左那嚩左𪘨',
        tangYinNotes: ['悉怛哩野(四合)', '地尾(二合)', '迦(引)'],
        meaningZh: '归命三世一切如来！嗡！于三界有情世间最胜庄严处，宣说金刚真言密句！',
        meaningEn: 'Homage to all Tathāgatas of the three times! Oṃ! In the supreme realms of existence, through the sacred speech of truth!',
        words: [
          { iast: 'traiyadhvikānām', tangTranslit: '悉怛哩野地尾迦南', yinNote: '四合', grammar: '形容词阳性复数第六属格', meaningZh: '属于过去现在未来三世的', meaningEn: 'of the three times (past, present, future)' },
          { iast: 'sarva-tathāgatānām', tangTranslit: '萨婆怛他蘖多南', yinNote: '引', grammar: '阳性复数第六属格', meaningZh: '一切如来世尊', meaningEn: 'of all Tathāgatas' }
        ]
      },
      {
        id: 'km-2',
        index: 2,
        sectionTag: '第二分 · 宝箧法印与全身舍利总持分',
        iast: 'suru suru dhara dhara sarva-tathāgata-dhātu-dhare padmaṃ bhavati jayavare mudre smara',
        tangTranslit: '祖噜祖噜 驮啰驮啰 萨嚩怛他蘖多 驮(引)睹驮梨 钵娜𤚥(二合) 婆嚩底 惹也嚩梨 亩怛梨(二合) 娑么(二合)啰',
        tangYinNotes: ['驮(引)', '钵娜𤚥(二合)', '亩怛梨(二合)', '娑么(二合)'],
        meaningZh: '流注甘露、流注甘露！总持、总持！任持一切如来全身舍利尊！红莲敷荣、最胜尊胜法印，恒常忆念本誓！',
        meaningEn: 'Flow, flow! Uphold, uphold! O Bearer of the relics of all Tathāgatas! The lotus blooms, O Victorious Seal, remember!',
        words: [
          { iast: 'sarva-tathāgata-dhātu-dhare', tangTranslit: '萨嚩怛他蘖多驮睹驮梨', yinNote: '引', grammar: '阴性单数呼格', meaningZh: '任持一切如来全身法身舍利者', meaningEn: 'O Holder of the relics of all Tathāgatas' },
          { iast: 'jayavare mudre', tangTranslit: '惹也嚩梨亩怛梨', yinNote: '二合', grammar: '阴性单数呼格', meaningZh: '最胜尊胜宝箧印母', meaningEn: 'O Supreme Seal of Victory' }
        ]
      },
      {
        id: 'km-3',
        index: 3,
        sectionTag: '第三分 · 法轮常转与金刚三昧耶成就分',
        iast: 'tathāgata-dharma-cakra-pravartana vajra-bodhi-maṇḍālaṃkāra-alaṃkṛte sarva-tathāgatādhiṣṭhite bodhaya bodhaya bodhi bodhi budhya budhya saṃbodhani saṃbodhaya cala cala calantu sarvāvaraṇāni sarva-pāpa-vigate huru huru sarva-śoka-vigate sarva-tathāgata-hṛdaya-vajriṇi saṃbhāra saṃbhāra sarva-tathāgata-guhya-dhāraṇī-mudre buddhe subuddhe sarva-tathāgatādhiṣṭhita-dhātu-garbhe svāhā | samayādhiṣṭhite svāhā | sarva-tathāgata-hṛdaya-dhātu-mudre svāhā',
        tangTranslit: '怛他蘖多 达磨斫羯啰(二合) 钵啰(二合)嚩哩怛(二合)娜 嚩日啰(二合)冒地满拏 楞迦啰 楞讫哩(二合)帝 萨嚩怛他蘖多 地瑟耻(二合)帝 冒驮野冒驮野 冒地冒地 没𠆙没𠆙 参冒驮你 参冒驮野 者攞者攞 者懒都 萨嚩嚩啰拏你 萨嚩播波尾蘖帝 户噜户噜 萨嚩迦尾蘖帝 萨嚩怛他蘖多 纥哩(二合)那野 嚩日哩(二合)抳 三婆啰三婆啰 萨嚩怛他蘖多 虞𡂖 驮啰抳 亩怛梨(二合) 没第苏没第 萨嚩怛他蘖多 地瑟耻(二合)多 驮睹蘖陛 娑嚩(二合)诃 ｜ 三摩耶地瑟耻(二合)帝 娑嚩(二合)诃 ｜ 萨嚩怛他蘖多 纥哩(二合)那野 驮睹亩怛犁(二合) 娑嚩(二合)诃',
        tangYinNotes: ['斫羯啰(二合)', '嚩日啰(二合)', '讫哩(二合)', '地瑟耻(二合)', '纥哩(二合)'],
        meaningZh: '转如来正法轮、庄严金刚菩提道场尊、一切如来所加持尊！令觉悟、令正觉！震动破除一切业障、远离一切罪垢与忧恼！一切如来心金刚母、圆满福智资粮、一切如来秘密陀罗尼印、觉中妙觉、一切如来加持舍利宝藏：娑嚩诃！三昧耶加持：娑嚩诃！一切如来心舍利宝印：娑嚩诃！',
        meaningEn: 'Turning the Dharma-wheel of the Tathāgata, adorning the Vajra Bodhimaṇḍa, blessed by all Tathāgatas! Awaken, awaken! Shake off all obscurations, free from all sins and sorrows! O Vajra Heart of all Tathāgatas, gather all accumulations, Secret Dhāraṇī Seal, Womb of Relics blessed by all Tathāgatas: Svāhā! Blessed by Samaya: Svāhā! Heart-Relic Seal of all Tathāgatas: Svāhā!',
        words: [
          { iast: 'dharma-cakra-pravartana', tangTranslit: '达磨斫羯啰钵啰嚩哩怛娜', yinNote: '二合', grammar: '复合词呼格', meaningZh: '常转无上法轮者', meaningEn: 'Turner of the Wheel of Dharma' },
          { iast: 'sarvāvaraṇāni', tangTranslit: '萨嚩嚩啰拏你', grammar: '中性复数第一体格', meaningZh: '一切烦恼障与业障', meaningEn: 'all obscurations and karmic obstacles' },
          { iast: 'dhātu-garbhe', tangTranslit: '驮睹蘖陛', grammar: '阴性单数呼格', meaningZh: '含藏如来全身舍利之宝胎藏', meaningEn: 'O Womb of Sacred Relics' }
        ]
      }
    ]
  },
  {
    id: 'amoghapasa-vairocana',
    titleZh: '不空羂索毗卢遮那佛大灌顶光真言 (光明真言)',
    titleSaIast: 'Amoghapāśa-vairocana-mahāśuddhābhiṣeka-mantra',
    titleSaDeva: 'अमोघपाशवैरोचनमहाशुद्धाभिषेकमन्त्र',
    titleSaSiddham: '𑖀𑖦𑖺𑖑𑖢𑖯𑖫𑖪𑖹𑖨𑖺𑖓𑖡𑖦𑖮𑖯𑖫𑖲𑖟𑖿𑖠𑖯𑖥𑖰𑖬𑖼𑖎𑖦𑖡𑖿𑖝𑖿𑖨',
    titleEn: 'Mantra of Light (Vairocana Mahābhiṣeka Mantra)',
    category: 'major',
    deityFocus: '毗卢遮那如来 / 大日如来 (Mahāvairocana)',
    seedSyllableIast: 'a',
    seedSyllableSiddham: '𑖀',
    seedSyllableDeva: 'अ',
    seedSyllableZh: '阿',
    summaryZh:
      '唐不空三藏译《不空羂索毗卢遮那佛大灌顶光真言》(CBETA T19n1002)。原典包含全部 23 组 <cb:tt> 悉昙梵字与汉字逐字对音，为唐密与东密超度、土砂加持最核心真言。',
    ritualBenefitsZh: '若有众生具造十恶五逆四重诸罪，闻此大灌顶光真言二三七遍，或以加持土砂散亡者尸骸墓上，即得光明及身，除诸罪报，莲华化生西方极乐世界。',
    sourceMeta: {
      cbetaXmlId: 'T19n1002',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n1002.xml',
      taishoVolPage: 'T19, No. 1002, p. 606a–b',
      ancientTranslator: '唐 三藏沙门大广智不空 奉诏译',
      sanskritEditionCitation:
        'CBETA T19n1002 (23 Siddhaṃ-Chinese <cb:tt> pairs) & Amoghapāśakalparāja Chapter 28',
      tangPhoneticNotes: [
        '唵 阿谟伽 (不空，Amogha) · 尾嚧左曩 (毗卢遮那光明遍照)',
        '摩诃母捺啰 (大印，捺啰二合) · 摩抳钵纳么 (摩尼宝莲华，纳么二合)',
        '入嚩攞 (光明炽盛，入嚩二合) · 钵啰嚩哩多野 (转易转化，钵啰二合)'
      ]
    },
    verses: [
      {
        id: 'av-1',
        index: 1,
        sectionTag: '全一分 · 大灌顶光真言（23字悉昙梵汉逐字对音全咒）',
        iast: 'oṃ amogha vairocana mahāmudrā maṇi-padma jvāla pravartaya hūṃ',
        tangTranslit: '唵 阿谟伽 尾嚧左曩 摩诃母捺啰(二合) 摩抳 钵纳么(二合) 入嚩(二合)攞 钵啰(二合)嚩哩多(二合)野 吽',
        tangYinNotes: ['母捺啰(二合)', '钵纳么(二合)', '入嚩(二合)攞', '钵啰(二合)'],
        meaningZh: '嗡！真实不空遍照毗卢遮那如来、大法身印、摩尼宝珠与清净莲华，放无量智慧光明，转一切众生无明业障成大菩提：吽！',
        meaningEn: 'Oṃ! Unfailing Illuminator Vairocana, Great Seal, Jewel and Lotus, blazing with radiant light: transform and turn the wheel of awakening! Hūṃ!',
        words: [
          { iast: 'amogha', tangTranslit: '阿谟伽', grammar: '呼格/复合词首', meaningZh: '真实不空、成就无虚', meaningEn: 'Unfailing, Infallible' },
          { iast: 'vairocana', tangTranslit: '尾嚧左曩', grammar: '阳性单数呼格', meaningZh: '毗卢遮那（光明遍照大日如来）', meaningEn: 'O Vairocana (Universal Illuminator)' },
          { iast: 'mahāmudrā', tangTranslit: '摩诃母捺啰', yinNote: '二合', grammar: '阴性单数呼格', meaningZh: '大法身三昧耶印', meaningEn: 'Great Seal (Mahāmudrā)' },
          { iast: 'maṇi-padma', tangTranslit: '摩抳钵纳么', yinNote: '二合', grammar: '呼格', meaningZh: '如意摩尼宝珠与微妙莲华（福智二严）', meaningEn: 'Jewel and Lotus' },
          { iast: 'jvāla pravartaya', tangTranslit: '入嚩攞钵啰嚩哩多野', yinNote: '二合', grammar: '致使式祈使', meaningZh: '放炽盛光明转易业障为净智', meaningEn: 'blaze forth and transform!' }
        ]
      }
    ]
  }
];
