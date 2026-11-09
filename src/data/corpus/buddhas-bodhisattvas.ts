/**
 * 诸佛菩萨·般若部·观音度母·明王五护语料库 (src/data/corpus/buddhas-bodhisattvas.ts)
 * 对接 CBETA XML-P5 (T08n0251, T20n1050, T20n1070, T19n0953 等) 与 GRETIL 梵文贝叶经库
 */

import { DharaniEntry } from '../../types/dharani';

export const BUDDHAS_BODHISATTVAS_DHARANIS: DharaniEntry[] = [
  {
    id: 'prajnaparamita-hrdaya',
    titleZh: '般若波罗蜜多心经大神咒 (玄奘译本 & 法隆寺/GRETIL 梵本)',
    titleSaIast: 'Prajñāpāramitā-hṛdaya-dhāraṇī',
    titleSaDeva: 'प्रज्ञापारमिताहृदयधारणी',
    titleSaSiddham: '𑖢𑖿𑖨𑖕𑖿𑖗𑖯𑖢𑖯𑖨𑖦𑖰𑖝𑖯𑖮𑖴𑖟𑖧𑖠𑖯𑖨𑖜𑖱',
    titleEn: 'Heart of Perfection of Wisdom Mantra (Prajñāpāramitāhṛdaya)',
    category: 'prajna',
    deityFocus: '般若佛母 / 观自在菩萨 (Prajñāpāramitā Bhagavatī)',
    seedSyllableIast: 'dhīḥ',
    seedSyllableSiddham: '𑖠𑖱𑖿',
    seedSyllableDeva: 'धीः',
    seedSyllableZh: '谛',
    summaryZh:
      '六百卷《大般若经》之精髓心印。本条目直接对齐 CBETA T08n0251 玄奘译本与德国哥廷根大学 GRETIL 馆藏梵本 prajnhsu.htm (Edward Conze / 法隆寺贝叶梵本)。',
    ritualBenefitsZh: '是大神咒、是大明咒、是无上咒、是无等等咒，能除一切苦，真实不虚，度一切苦厄直登彼岸。',
    sourceMeta: {
      cbetaXmlId: 'T08n0251',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T08/T08n0251.xml',
      taishoVolPage: 'T08, No. 251, p. 848c',
      ancientTranslator: '唐 三藏法师玄奘 奉诏译',
      gretilId: 'prajnhsu.htm',
      gretilRawUrl:
        'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/prajnhsu.htm',
      sanskritEditionCitation:
        'GRETIL prajnhsu.htm (Prajñāpāramitāhṛdayasūtra, ed. E. Conze 1948 / Hōryū-ji Palm-Leaf MS)',
      tangPhoneticNotes: ['गते गते (去吧、去吧) · पारगते (度向彼岸) · पारसंगते (大众同登彼岸)']
    },
    verses: [
      {
        id: 'pp-1',
        index: 1,
        sectionTag: '全一分 · 般若波罗蜜多究竟到彼岸咒 (GRETIL prajnhsu.htm 原句)',
        iast: 'tadyathā oṃ gate gate pāragate pārasaṃgate bodhi svāhā',
        tangTranslit: '即说咒曰：揭谛 揭谛 波罗揭谛 波罗僧揭谛 菩提 萨婆诃',
        meaningZh: '即说咒曰：嗡！去吧、去吧，度向彼岸吧，一切众生普遍同登彼岸吧，速证无上正等菩提：圆满成就！',
        meaningEn: 'Namely: Oṃ! Gone, gone, gone beyond, gone altogether beyond: O Awakening, Svāhā!',
        words: [
          { iast: 'gate', tangTranslit: '揭谛', grammar: '√gam 过去被动分词阴性单数呼格/处格', meaningZh: '度去吧、行进吧', meaningEn: 'gone, departed (O Wisdom)' },
          { iast: 'pāragate', tangTranslit: '波罗揭谛', grammar: 'pāra-gata 呼格', meaningZh: '度到生死彼岸者', meaningEn: 'gone to the further shore' },
          { iast: 'pārasaṃgate', tangTranslit: '波罗僧揭谛', grammar: 'pāra-saṃ-gata 呼格', meaningZh: '普摄自他究竟总登彼岸者', meaningEn: 'completely gone beyond together' },
          { iast: 'bodhi', tangTranslit: '菩提', grammar: '阴性单数呼格', meaningZh: '无上正遍知觉', meaningEn: 'O Enlightenment / Awakening' }
        ]
      }
    ]
  },
  {
    id: 'sadaksari-vidya',
    titleZh: '佛说大乘庄严宝王经 · 观自在菩萨六字大明陀罗尼',
    titleSaIast: 'Ṣaḍakṣarī-mahāvidyā-dhāraṇī (Oṃ Maṇi Padme Hūṃ)',
    titleSaDeva: 'षडक्षरी महाविद्या (ॐ मणि पद्मे हूँ)',
    titleSaSiddham: '𑖼𑗀 𑖦𑖜𑖰 𑖢𑖟𑖿𑖦𑖼 𑖮𑖳𑖾',
    titleEn: 'Six-Syllable Great Vidyā of Avalokiteśvara (Oṃ Maṇi Padme Hūṃ)',
    category: 'avalokitesvara',
    deityFocus: '圣观自在菩萨 / 四臂观音 (Ṣaḍakṣarī Lokeśvara)',
    seedSyllableIast: 'hrīḥ',
    seedSyllableSiddham: '𑖮𑖿𑖨𑖱𑖿',
    seedSyllableDeva: 'ह्रीः',
    seedSyllableZh: '纥哩',
    summaryZh:
      '出自《佛说大乘庄严宝王经》卷四 (CBETA T20n1050 天息灾译本) 暨德国哥廷根大学 GRETIL 梵本《Kāraṇḍavyūhasūtra》(bsu019_u.htm)。观自在菩萨微妙本心，总摄六波罗蜜与净除六道业障。',
    ritualBenefitsZh: '持诵此六字大明王陀罗尼，得无碍辩才，净除六道轮回种子，九十九亿恒河沙诸佛围绕护念。',
    sourceMeta: {
      cbetaXmlId: 'T20n1050',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1050.xml',
      taishoVolPage: 'T20, No. 1050, p. 59b',
      ancientTranslator: '宋 西天中印度三藏天息灾 奉诏译',
      gretilId: 'bsu019_u.htm',
      gretilRawUrl:
        'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/bsu019_u.htm',
      sanskritEditionCitation:
        'GRETIL bsu019_u.htm (Kāraṇḍavyūhasūtra, ed. P.L. Vaidya, BST 17, Darbhanga 1961)',
      tangPhoneticNotes: ['ॐ मणि पद्मे हूँ (嗡 摩尼宝珠 莲华尊 吽 — 悲智双运不二心印)']
    },
    verses: [
      {
        id: 'sv6-1',
        index: 1,
        sectionTag: '全一分 · 观自在菩萨微妙本心六字大明王真言',
        iast: 'namo ratnatrayāya | namaḥ āryāvalokiteśvarāya bodhisattvāya mahāsattvāya mahākāruṇikāya | tadyathā oṃ maṇi padme hūṃ',
        tangTranslit: '曩谟啰怛曩怛啰夜耶 ｜ 曩谟阿哩也嚩路吉帝湿嚩啰耶 冒地萨怛嚩耶 摩诃萨怛嚩耶 摩诃迦噜抳迦耶 ｜ 怛你也他 唵 么抳 钵讷铭 吽',
        meaningZh: '归命三宝！归命大悲圣观自在菩萨摩诃萨！即说咒曰：嗡！持摩尼如意宝与清净莲华尊（福智合一、悲智双运）：吽！',
        meaningEn: 'Homage to the Three Jewels! Homage to Greatly Compassionate Noble Avalokiteśvara! Namely: Oṃ! O Holder of the Jewel and Lotus (Maṇipadma): Hūṃ!',
        words: [
          { iast: 'oṃ', tangTranslit: '唵', grammar: 'a-u-m 三身总摄字', meaningZh: '佛身语意三密加持总持门', meaningEn: 'Sacred syllable Oṃ' },
          { iast: 'maṇi-padme', tangTranslit: '么抳钵讷铭', grammar: '阴性单数呼格 (maṇipadme)', meaningZh: '持摩尼宝与清净莲华尊（方便菩提心与空性智慧）', meaningEn: 'O Jewel-Lotus One' },
          { iast: 'hūṃ', tangTranslit: '吽', grammar: '圆满摧破种子字', meaningZh: '悲智不二、破除六道惑业速证菩提', meaningEn: 'Indivisible wisdom seed syllable Hūṃ' }
        ]
      }
    ]
  },
  {
    id: 'ekadasamukha',
    titleZh: '十一面观世音菩萨根本神咒 (吉尔吉特6世纪桦树皮写本 & 玄奘译本)',
    titleSaIast: 'Ekādaśamukha-hṛdaya-dhāraṇī',
    titleSaDeva: 'एकादशमुखहृदयधारणी',
    titleSaSiddham: '𑖊𑖎𑖯𑖟𑖫𑖦𑖲𑖏𑖮𑖴𑖟𑖧𑖠𑖯𑖨𑖜𑖱',
    titleEn: 'Eleven-Faced Avalokiteśvara Heart Dhāraṇī (Gilgit Birch-Bark MS)',
    category: 'avalokitesvara',
    deityFocus: '十一面观自在菩萨 (Ekādaśamukha Avalokiteśvara)',
    seedSyllableIast: 'hrīḥ',
    seedSyllableSiddham: '𑖮𑖿𑖨𑖱𑖿',
    seedSyllableDeva: 'ह्रीः',
    seedSyllableZh: '纥哩',
    summaryZh:
      '即民间传唱极广之「藏传大悲咒」梵文原典！本条目直接采用巴基斯坦吉尔吉特（Gilgit）出土公元 6 世纪桦树皮梵文古写本《Ekādaśamukhahṛdaya》(GRETIL ekmuhr_u.htm, N. Dutt 校勘) 对照玄奘译 T20n1071 及不空译 T20n1069。',
    ritualBenefitsZh: '十方一切诸佛同共宣说，能除一切疫病、怨敌、恶梦、非时横死，十种胜利、四种功德现世成就，临终往生极乐世界。',
    sourceMeta: {
      cbetaXmlId: 'T20n1071',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1071.xml',
      taishoVolPage: 'T20, No. 1070 (耶舍崛多译) & No. 1071 (玄奘译) & No. 1069 (不空译)',
      ancientTranslator: '唐 三藏法师玄奘 / 不空三藏 译',
      gretilId: 'ekmuhr_u.htm',
      gretilRawUrl:
        'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/ekmuhr_u.htm',
      sanskritEditionCitation:
        'GRETIL ekmuhr_u.htm (Ekādaśamukha, Gilgit Manuscripts Vol. I, ed. Nalinaksha Dutt 1939, pp. 35–40)',
      tangPhoneticNotes: [
        'वैरोचन (遍照如来) · पद्मधara (持莲华者)',
        'धरा धरा धिरि धिरि (总持、任持) · एह्येहि महाकारुणिक (善来大悲尊)'
      ]
    },
    verses: [
      {
        id: 'ek-1',
        index: 1,
        sectionTag: '第一分 · 归命三宝、遍照佛与十一面大悲世自在尊 (Gilgit ekmuhr_u.htm 原句)',
        iast: 'namo ratnatrayāya | namo vairocanāya tathāgatāya | namaḥ āryāvalokiteśvarāya bodhisattvāya mahāsattvāya mahākāruṇikāya',
        tangTranslit: '敬礼三宝 ｜ 敬礼毗卢遮那如来 ｜ 敬礼圣观自在菩萨摩诃萨具大悲者（曩谟 啰怛曩怛啰夜耶 曩谟 室哩夜地嚩迦喃）',
        meaningZh: '归命三宝！归命遍照毗卢遮那如来！归命大悲圣观自在菩萨摩诃萨！',
        meaningEn: 'Homage to the Three Jewels! Homage to Vairocana Tathāgata! Homage to Greatly Compassionate Noble Avalokiteśvara Bodhisattva Mahāsattva!',
        words: [
          { iast: 'vairocanāya tathāgatāya', tangTranslit: '毗卢遮那怛他揭多耶', grammar: '阳性单数第四为格', meaningZh: '向光明遍照如来', meaningEn: 'to Vairocana Tathāgata' }
        ]
      },
      {
        id: 'ek-2',
        index: 2,
        sectionTag: '第二分 · 十一面观音根本心咒 (Gilgit 桦树皮写本原文)',
        iast: 'tadyathā oṃ dhara dhara dhiri dhiri dhuru dhuru iṭṭe vaṭṭe cale cale pracale pracale kusume kusuma-vare ili mili viṭi svāhā',
        tangTranslit: '怛侄他 唵 达啰达啰 地利地利 度噜度噜 壹知伐知 遮隶遮隶 钵啰遮隶 钵啰遮隶 俱素谜 俱苏摩伐隶 伊利蜜利 毗知 娑嚩诃',
        tangYinNotes: ['钵啰(二合)', '娑嚩(二合)诃'],
        meaningZh: '即说咒曰：嗡！任持、任持！坚固受持、究竟总持！自在神变、游行十方、极妙庄严行！觉花开敷、最胜妙华庄严尊，寂静调柔周遍加被：娑嚩诃！',
        meaningEn: 'Namely: Oṃ! Hold, hold! Uphold firmly, sustain! In sovereign power, moving, moving forth! O Blossom, Supreme Flower of Awakening, in serene harmony: Svāhā!',
        words: [
          { iast: 'dhara dhiri dhuru', tangTranslit: '达啰地利度噜', grammar: '√dhṛ 祈使变格', meaningZh: '任持、坚固持守、究竟总持', meaningEn: 'hold, uphold, sustain!' },
          { iast: 'cale pracale', tangTranslit: '遮隶钵啰遮隶', yinNote: '二合', grammar: '呼格', meaningZh: '十方游行度生无碍者', meaningEn: 'O Moving, Forth-Moving One' },
          { iast: 'kusume kusuma-vare', tangTranslit: '俱素谜俱苏摩伐隶', grammar: '阴性单数呼格', meaningZh: '菩提妙花、最胜庄严花尊', meaningEn: 'O Flower, O Supreme Blossom' }
        ]
      }
    ]
  },
  {
    id: 'ekaksara-usnisa',
    titleZh: '一字奇特佛顶金轮王真言 (唐不空译本)',
    titleSaIast: 'Ekākṣara-uṣṇīṣa-cakravarti-mantra',
    titleSaDeva: 'एकाक्षरोष्णीषचक्रवर्तिमन्त्र',
    titleSaSiddham: '𑖼𑗀 𑖥𑖿𑖨𑖳𑖾',
    titleEn: 'One-Syllable Golden-Wheel Buddha-Crown Sovereign Mantra (Bhrūṃ)',
    category: 'buddhas',
    deityFocus: '一字金轮佛顶如来 (Ekākṣara-uṣṇīṣacakravartin)',
    seedSyllableIast: 'bhrūṃ',
    seedSyllableSiddham: '𑖥𑖿𑖨𑖳𑖾',
    seedSyllableDeva: 'भ्रूँ',
    seedSyllableZh: '勃笼(二合引)',
    summaryZh:
      '出自《一字奇特佛顶经》(CBETA T19n0953 不空译) 暨《菩提场所说一字顶轮王经》(T19n0950)。一切佛顶法门之最高统摄尊，仅以一字「勃笼 (bhrūṃ)」总摄无量三摩地。',
    ritualBenefitsZh: '诵此一字顶轮王真言，于一切真言仪轨中虽未入坛亦成入坛，速满一切息增怀诛妙业。',
    sourceMeta: {
      cbetaXmlId: 'T19n0953',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n0953.xml',
      taishoVolPage: 'T19, No. 953, p. 286c',
      ancientTranslator: '唐 三藏沙门大广智不空 奉诏译',
      sanskritEditionCitation: 'CBETA T19n0953 & Mañjuśrīmūlakalpa Ekākṣaroṣṇīṣa Section',
      tangPhoneticNotes: ['勃笼 (bhrūṃ — bh + r + ū + ṃ 三合长引空点，一字金轮佛顶最上心印)']
    },
    verses: [
      {
        id: 'eu-1',
        index: 1,
        sectionTag: '全一分 · 一字金轮佛顶王根本心真言',
        iast: 'namaḥ samanta-buddhānām apratihata-śāsanānām | oṃ bhrūṃ',
        tangTranslit: '曩谟 三满多 没驮喃 阿钵啰(二合)底贺多 舍娑曩喃 ｜ 唵 勃笼(二合引)',
        tangYinNotes: ['钵啰(二合)', '勃笼(二合引)'],
        meaningZh: '归命普遍诸佛、具足无碍教令轮尊！嗡 勃笼（一字金轮佛顶最胜大总持）！',
        meaningEn: 'Homage to the Universal Buddhas of unobstructed teachings! Oṃ Bhrūṃ!',
        words: [
          { iast: 'bhrūṃ', tangTranslit: '勃笼', yinNote: '二合引', grammar: '一字佛顶轮王种子字', meaningZh: '总摄三世如来无见顶相大金轮智印', meaningEn: 'Supreme One-Syllable Buddha-Crown Seed Bhrūṃ' }
        ]
      }
    ]
  },
  {
    id: 'arya-tara',
    titleZh: '圣救度佛母根本心咒 (绿度母十音节心咒 · GRETIL 梵本)',
    titleSaIast: 'Ārya-tārā-mūla-mantra',
    titleSaDeva: 'आर्यतारामूलमन्त्र (ॐ तारे तुत्तारे तुरे स्वाहा)',
    titleSaSiddham: '𑖼𑗀 𑖝𑖯𑖨𑖼 𑖝𑖲𑖝𑖿𑖝𑖯𑖨𑖼 𑖝𑖲𑖨𑖼 𑖭𑖿𑖪𑖯𑖮𑖯',
    titleEn: 'Noble Savioress Tārā Ten-Syllable Root Mantra',
    category: 'avalokitesvara',
    deityFocus: '圣救度佛母 / 绿度母 (Ārya-Tārā Bhagavatī)',
    seedSyllableIast: 'tāṃ',
    seedSyllableSiddham: '𑖝𑖯𑖾',
    seedSyllableDeva: 'तां',
    seedSyllableZh: '多(引空点)',
    summaryZh:
      '出自《佛说大方广曼殊室利经·观自在菩萨授记品》(T20n1101 不空译) 及德国哥廷根大学 GRETIL 梵本《圣度母百八名赞》(tarb108u.htm)。观音悲泪化现之速疾救度佛母。',
    ritualBenefitsZh: '度脱八难十六怖畏，速疾成办世出世间事业，增福增慧，吉祥如意。',
    sourceMeta: {
      cbetaXmlId: 'T20n1101',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1101.xml',
      taishoVolPage: 'T20, No. 1101, p. 448a',
      ancientTranslator: '唐 三藏沙门大广智不空 奉诏译',
      gretilId: 'tarb108u.htm',
      gretilRawUrl:
        'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/tarb108u.htm',
      sanskritEditionCitation: 'GRETIL tarb108u.htm (Tārābhaṭṭārikāyā nāmāṣṭottaraśatakastotra)',
      tangPhoneticNotes: ['तारे (度脱轮回) · तुत्तारे (度脱八难痛苦) · तुरे (速疾赐予解脱)']
    },
    verses: [
      {
        id: 'at-1',
        index: 1,
        sectionTag: '全一分 · 圣救度佛母十音节根本心咒',
        iast: 'oṃ tāre tuttāre ture svāhā',
        tangTranslit: '唵 多唎 都多唎 都唎 娑嚩诃',
        tangYinNotes: ['娑嚩(二合)诃'],
        meaningZh: '嗡！救度母、极救拔一切八难苦厄母、速疾勇猛施予究竟解脱母：娑嚩诃！',
        meaningEn: 'Oṃ! O Savioress (Tārā), O Liberator from all fears (Tuttārā), O Swift Heroine of Deliverance (Turā): Svāhā!',
        words: [
          { iast: 'tāre', tangTranslit: '多唎', grammar: 'tārā 阴性单数呼格', meaningZh: '度脱三界轮回海之救度母', meaningEn: 'O Savioress across cyclic existence' },
          { iast: 'tuttāre', tangTranslit: '都多唎', grammar: 'ud-tārā 阴性单数呼格', meaningZh: '拔济一切怖畏苦难者', meaningEn: 'O Deliverer from all terrors and sufferings' },
          { iast: 'ture', tangTranslit: '都唎', grammar: 'turā 阴性单数呼格', meaningZh: '速疾迅猛成办解脱者', meaningEn: 'O Swift One who grants liberation' }
        ]
      }
    ]
  },
  {
    id: 'manjusri-pancaksara',
    titleZh: '文殊师利菩萨五字真言 (金刚顶瑜伽五字文殊心咒)',
    titleSaIast: 'Mañjuśrī-pañcākṣara-mantra (Oṃ A Ra Pa Ca Na Dhīḥ)',
    titleSaDeva: 'ॐ अ र प च न धीः',
    titleSaSiddham: '𑖼𑗀 𑖀 𑖨 𑖢 𑖓 𑖡 𑖠𑖱𑖿',
    titleEn: 'Mañjuśrī Five-Syllable Arapacana Wisdom Mantra',
    category: 'prajna',
    deityFocus: '大智文殊师利法王子 (Mañjuśrī Kumārabhūta)',
    seedSyllableIast: 'dhīḥ',
    seedSyllableSiddham: '𑖠𑖱𑖿',
    seedSyllableDeva: 'धीः',
    seedSyllableZh: '谛',
    summaryZh:
      '出自《金刚顶超胜三界经说文殊五字真言胜相》(CBETA T20n1171 不空译) 暨《大般若经·四十二字门品》。阿、啰、跛、左、曩五字总摄一切般若空性智慧。',
    ritualBenefitsZh: '受持读诵此五字真言，速得文殊般若利剑，开大智慧、总持不忘、辩才无碍，破除一切愚痴暗障。',
    sourceMeta: {
      cbetaXmlId: 'T20n1171',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1171.xml',
      taishoVolPage: 'T20, No. 1171, p. 709b',
      ancientTranslator: '唐 三藏沙门大广智不空 奉诏译',
      sanskritEditionCitation: 'CBETA T20n1171 & GRETIL manjn1pu.htm (Mañjuśrīnāmasaṃgīti)',
      tangPhoneticNotes: [
        'अ (阿：本不生义) · र (啰：离诸尘垢义) · प (跛：第一义谛)',
        'च (左：无诸行迁变义) · न (曩：无性离名相义) · धीः (谛：般若妙观察智)'
      ]
    },
    verses: [
      {
        id: 'mp-1',
        index: 1,
        sectionTag: '全一分 · 文殊师利菩萨五字心真言暨智慧种子字',
        iast: 'oṃ a ra pa ca na dhīḥ',
        tangTranslit: '唵 阿 啰 跛 左 曩 谛',
        meaningZh: '嗡！诸法本不生（阿）、离一切尘垢（啰）、胜义第一义谛（跛）、离生灭迁变（左）、无自性离名言相（曩）：证入无上般若智慧（谛）！',
        meaningEn: 'Oṃ! Unborn from the beginning (A), free from dust (Ra), ultimate truth (Pa), beyond karmic modification (Ca), nameless and signless (Na): Supreme Wisdom (Dhīḥ)!',
        words: [
          { iast: 'a', tangTranslit: '阿', grammar: '字门第一', meaningZh: '一切诸法本不生故（阿字门）', meaningEn: 'All dharmas are primordially unborn' },
          { iast: 'ra', tangTranslit: '啰', grammar: '字门第二', meaningZh: '一切法离诸尘垢清净无染（啰字门）', meaningEn: 'Free from all defiling dust' },
          { iast: 'pa', tangTranslit: '跛', grammar: '字门第三', meaningZh: '一切法胜义第一义谛不可得（波字门）', meaningEn: 'Ultimate paramārtha truth' },
          { iast: 'ca', tangTranslit: '左', grammar: '字门第四', meaningZh: '一切法无有诸行迁流变易（遮字门）', meaningEn: 'Free from migration and change' },
          { iast: 'na', tangTranslit: '曩', grammar: '字门第五', meaningZh: '一切法远离名相假名施设（那字门）', meaningEn: 'Beyond names and conceptual signs' },
          { iast: 'dhīḥ', tangTranslit: '谛', grammar: 'dhī (阴性单数体格，般若妙慧)', meaningZh: '文殊般若觉慧种子字', meaningEn: 'Seed of transcendent intelligence (Dhīḥ)' }
        ]
      }
    ]
  },
  {
    id: 'vajrasattva-sataksara',
    titleZh: '金刚萨埵百字明真言 (一切如来金刚三业最上秘密心印)',
    titleSaIast: 'Vajrasattva-śatākṣara-mantra',
    titleSaDeva: 'वज्रसत्त्वशताक्षरमन्त्र',
    titleSaSiddham: '𑖪𑖕𑖿𑖨𑖭𑖝𑖿𑖝𑖿𑖪𑖫𑖝𑖯𑖎𑖿𑖬𑖨𑖦𑖡𑖿𑖝𑖿𑖨',
    titleEn: 'Hundred-Syllable Mantra of Vajrasattva',
    category: 'buddhas',
    deityFocus: '金刚萨埵 / 普贤金刚手菩萨 (Vajrasattva)',
    seedSyllableIast: 'hūṃ',
    seedSyllableSiddham: '𑖮𑖳𑖾',
    seedSyllableDeva: 'हूँ',
    seedSyllableZh: '吽',
    summaryZh:
      '出自《金刚顶瑜伽中略出念诵经》(CBETA T18n0866 金刚智译) 及 GRETIL 梵本《金刚顶一切如来真实摄大乘现证大教王经》(sarvttsu.htm)。唐密与藏密共同尊奉之忏罪净障、补阙圆满最上真言。',
    ritualBenefitsZh: '纵犯三昧耶根本重戒及无始劫罪障，至诚诵持百字明，五方佛与金刚萨埵甘露灌顶，悉皆清净无余，补足一切持咒阙漏。',
    sourceMeta: {
      cbetaXmlId: 'T18n0866',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T18/T18n0866.xml',
      taishoVolPage: 'T18, No. 866 & No. 865 (不空译《金刚顶经》)',
      ancientTranslator: '唐 三藏沙门金刚智 / 不空 译',
      sanskritEditionCitation:
        'Sarvatathāgatatattvasaṃgraha (GRETIL sarvttsu.htm, ed. Isshi Yamada 1981 / Lokesh Chandra)',
      tangPhoneticNotes: ['वज्रसत्त्व समयमनुपालय (金刚萨埵护持三昧耶) · सर्वसिद्धिं मे प्रयच्छ (赐我一切悉地)']
    },
    verses: [
      {
        id: 'vs-1',
        index: 1,
        sectionTag: '第一分 · 祈请金刚萨埵护持三昧耶与坚固安住分',
        iast: 'oṃ vajrasattva samayam anupālaya | vajrasattvatvenopatiṣṭha | dṛḍho me bhava | sutoṣyo me bhava | supoṣyo me bhava | anurakto me bhava',
        tangTranslit: '唵 嚩日啰(二合)萨怛嚩(二合) 三摩耶 么努播攞耶 ｜ 嚩日啰(二合)萨怛嚩(二合)底尾(二合)诺 跛底瑟姹(二合) ｜ 涅哩(二合)茶 铭 婆嚩 ｜ 苏睹使喻(二合) 铭 婆嚩 ｜ 苏报使喻(二合) 铭 婆嚩 ｜ 阿努啰讫睹(二合) 铭 婆嚩',
        tangYinNotes: ['嚩日啰(二合)', '萨怛嚩(二合)', '底瑟姹(二合)', '涅哩(二合)'],
        meaningZh: '嗡！金刚萨埵，唯愿随顺守护三昧耶本誓！以金刚萨埵自性亲临安住！愿于我作坚固不坏！愿于我作欢喜摄受！愿于我作增长增益！愿于我作慈悲怜爱！',
        meaningEn: 'Oṃ Vajrasattva, guard the Samaya pledge! Stand near me as Vajrasattva! Be steadfast for me! Be well-pleased with me! Nourish me! Be lovingly compassionate toward me!',
        words: [
          { iast: 'samayam anupālaya', tangTranslit: '三摩耶么努播攞耶', grammar: '业格 + 祈使式', meaningZh: '守护三昧耶本誓戒体', meaningEn: 'guard and uphold the Samaya vow' },
          { iast: 'dṛḍho me bhava', tangTranslit: '涅哩茶铭婆嚩', yinNote: '二合', grammar: '祈使句', meaningZh: '愿为我作坚固金刚自性', meaningEn: 'be firm and steadfast for me' }
        ]
      },
      {
        id: 'vs-2',
        index: 2,
        sectionTag: '第二分 · 赐予悉地、五佛哈哈四智与大三昧耶圆满分',
        iast: 'sarva-siddhiṃ me prayaccha | sarva-karmasu ca me cittaṃ śreyaḥ kuru hūṃ | ha ha ha ha hoḥ bhagavan sarva-tathāgata-vajra mā me muñca vajrī bhava mahāsamayasattva āḥ',
        tangTranslit: '萨嚩悉地 铭 钵啰(二合)也瑳 ｜ 萨嚩羯磨苏 左 铭 质多 室哩(二合)药 俱噜 吽 ｜ 诃诃诃诃 斛 婆伽梵 萨嚩怛他蘖多 嚩日啰(二合) 么 铭 闷左 嚩日哩(二合) 婆嚩 摩诃三摩耶萨怛嚩(二合) 恶',
        tangYinNotes: ['钵啰(二合)', '室哩(二合)', '嚩日啰(二合)'],
        meaningZh: '唯愿赐予我一切悉地成就！并令我心于一切事业皆得吉祥殊胜：吽！哈哈哈哈（四智四喜圆满）斛！世尊、一切如来金刚尊，勿舍离我，愿令我成办金刚体性，大三昧耶萨埵：阿（法界体性智）！',
        meaningEn: 'Grant me all siddhis! And in all actions make my mind most auspicious: Hūṃ! Ha Ha Ha Ha Hoḥ! O Blessed One, Vajra of all Tathāgatas, do not abandon me! Make me a Vajra-holder, O Great Samaya-Being: Āḥ!',
        words: [
          { iast: 'sarva-siddhiṃ me prayaccha', tangTranslit: '萨嚩悉地铭钵啰也瑳', grammar: '祈使句', meaningZh: '赐予我一切世出世间悉地成就', meaningEn: 'bestow all accomplishments upon me' },
          { iast: 'ha ha ha ha hoḥ', tangTranslit: '诃诃诃诃斛', grammar: '五方佛四无量心四智欢喜音', meaningZh: '四智四解脱门大欢喜印', meaningEn: 'Fourfold joyous laughter of the Five Wisdoms' },
          { iast: 'mā me muñca', tangTranslit: '么铭闷左', grammar: '禁止祈使句', meaningZh: '唯愿恒不舍离于我', meaningEn: 'do not abandon me!' }
        ]
      }
    ]
  },
  {
    id: 'acalanatha-karuna',
    titleZh: '圣无动尊大威怒王慈救真言 (不动明王中咒)',
    titleSaIast: 'Ārya-acalanātha-karuṇā-mantra',
    titleSaDeva: 'आर्याचलनाथकरुणामन्त्र',
    titleSaSiddham: '𑖁𑖨𑖿𑖧𑖯𑖓𑖩𑖡𑖯𑖞𑖦𑖡𑖿𑖝𑖿𑖨',
    titleEn: 'Noble Acalanātha (Immovable Wisdom King) Compassionate Deliverance Mantra',
    category: 'vidyaraja',
    deityFocus: '大圣不动明王 (Ārya-Acalanātha Vidyārāja)',
    seedSyllableIast: 'hāṃ',
    seedSyllableSiddham: '𑖮𑖯𑖾',
    seedSyllableDeva: 'हां',
    seedSyllableZh: '憾',
    summaryZh:
      '出自《底哩三昧耶不动尊威怒王使者念诵法》(CBETA T21n1200 不空译) 暨《不动使者陀罗尼秘密法》(T21n1202 金刚智译)。五大明王之主尊，大日如来教令轮身，摧破一切内外魔障。',
    ritualBenefitsZh: '智火烧尽一切罪障烦恼，金索缚住一切邪魔外道，护持行者道心坚固不动直至菩提。',
    sourceMeta: {
      cbetaXmlId: 'T21n1200',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T21/T21n1200.xml',
      taishoVolPage: 'T21, No. 1200, p. 5b',
      ancientTranslator: '唐 三藏沙门大广智不空 奉诏译',
      sanskritEditionCitation: 'CBETA T21n1200 & Caṇḍamahāroṣaṇa / Acalakalpa Sanskrit Parallels',
      tangPhoneticNotes: ['समन्तवज्राणाम् (普遍诸金刚部) · चण्डमहारोषण (暴恶大忿怒威德尊) · स्फोटय (摧碎魔障)']
    },
    verses: [
      {
        id: 'ak-1',
        index: 1,
        sectionTag: '全一分 · 圣不动明王慈救真言',
        iast: 'namaḥ samanta-vajrāṇām | caṇḍa-mahāroṣaṇa sphoṭaya hūṃ traṭ hāṃ māṃ',
        tangTranslit: '曩谟 三满多 嚩日啰(二合)赧 ｜ 战拏 摩诃嚧洒拏 娑破(二合)吒也 吽 怛啰(二合)吒 悍 𤚥',
        tangYinNotes: ['嚩日啰(二合)', '娑破(二合)', '怛啰(二合)'],
        meaningZh: '归命普遍一切执金刚圣众！大威猛极忿怒尊，摧碎一切无明魔障：吽 怛啰吒 憾 𤚥！',
        meaningEn: 'Homage to the Universal Vajra-Holders! O Fierce One of Great Wrathful Compassion, shatter all obstacles: Hūṃ Traṭ Hāṃ Māṃ!',
        words: [
          { iast: 'samanta-vajrāṇām', tangTranslit: '三满多嚩日啰赧', yinNote: '二合', grammar: '阳性复数第六属格', meaningZh: '普遍十方一切金刚部圣众', meaningEn: 'of the Universal Vajra-Beings' },
          { iast: 'caṇḍa-mahāroṣaṇa', tangTranslit: '战拏摩诃嚧洒拏', grammar: '阳性单数呼格', meaningZh: '大勇猛极忿怒威德明王', meaningEn: 'O Fierce One of Great Wrath' },
          { iast: 'sphoṭaya', tangTranslit: '娑破吒也', yinNote: '二合', grammar: '致使式祈使', meaningZh: '摧碎、破除一切魔怨惑业', meaningEn: 'shatter, burst asunder!' }
        ]
      }
    ]
  }
];
