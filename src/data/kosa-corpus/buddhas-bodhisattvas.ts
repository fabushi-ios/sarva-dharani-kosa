import type { DharaniEntry } from '../../types/kosaTypes';
import { AUTHORITATIVE_CBETA_RECORDS } from '../kosa-generated/cbetaAuthRecords';
import { AUTHORITATIVE_GRETIL_RECORDS } from '../kosa-generated/gretilAuthRecords';

function findCbeta(id: string) {
  const r = AUTHORITATIVE_CBETA_RECORDS.find((item) => item.id === id);
  return r ? { ...r, rawXmlUrl: r.cbetaRawUrl } : undefined;
}

function findGretil(file: string) {
  const r = AUTHORITATIVE_GRETIL_RECORDS.find((item) => item.file === file);
  return r
    ? {
        ...r,
        rawUrl: r.gretilRawUrl,
        editionInfo: r.headerCitation.split('\n')[0] || r.titleSanskrit,
        extractedMantras: r.extractedVerses,
      }
    : undefined;
}

const cbetaT08n0251 = findCbeta('T08n0251');
const cbetaT21n1257 = findCbeta('T21n1257');

const gretilPrajna = findGretil('prajnhsu.htm');
const gretilKarandavyuha = findGretil('bsu019_u.htm');
const gretilEkadasamukha = findGretil('ekmuhr_u.htm');
const gretilAmoghapasa = findGretil('amoghapu.htm');
const gretilManjusri = findGretil('manjn1pu.htm');
const gretilTara = findGretil('tarb108u.htm');
const gretilPratisara = findGretil('psarkdhu.htm');
const gretilMahamayuri = findGretil('mmayuvru.htm');
const gretilMarici = findGretil('maricdhu.htm');
const gretilVajravidarana = findGretil('vjviddhu.htm');
const gretilVasudhara = findGretil('vadhdhdu.htm');
const gretilManibhadra = findGretil('manivdhu.htm');

export const BUDDHAS_AND_PROTECTORS_DHARANIS: DharaniEntry[] = [
  // ============================================================================
  // 诸佛菩萨本尊部 (buddhas-bodhisattvas)
  // ============================================================================
  {
    id: 'karandavyuha-sadaksari',
    titleZh: '大乘庄严宝王经·观自在菩萨六字大明王陀罗尼',
    titleSanskritIast: 'Kāraṇḍavyūha-ṣaḍakṣarī-mahāvidyā-rājñī',
    titleEnglish: 'Six-Syllable Great Vidyā Queen of Avalokiteśvara (Oṃ Maṇi Padme Hūṃ)',
    categoryId: 'buddhas-bodhisattvas',
    taishoNo: 'T20n1050 / GRETIL bsu019_u',
    translatorZh: '（宋）天息灾 奉诏译 · 哥廷根大学 GRETIL 梵文《Kāraṇḍavyūha》原典对勘',
    sutraSourceZh: '《佛说大乘庄严宝王经》卷四 (T20n1050) / GRETIL bsu019_u.htm',
    deityZh: '四臂观音 / 圣观自在菩萨 (Ṣaḍakṣarī-Lokeśvara)',
    meritsAndSummaryZh:
      '观自在菩萨微妙本心，在梵本《大乘庄严宝王经（Kāraṇḍavyūha）》中被称为「六字大明王陀罗尼（Ṣaḍakṣarī Mahāvidyā）」。经载持诵此六字大明章句，等同持诵八万四千法蕴，能闭塞六道生死之门，疾得无上正等菩提。',
    recitationTipsZh:
      '「maṇipadme」在梵语语法中为复合词呼格（Vocative singular feminine of maṇipadmā，「持摩尼宝与莲华者啊！」），其中「ṇi」为卷舌鼻音，「padme」中 d 为不送气浊齿音。',
    provenance: {
      sourceType: 'GRETIL/DSBC',
      cbetaId: 'T20n1050',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T20n1050',
      gretilFile: 'bsu019_u.htm',
      gretilRawUrl: gretilKarandavyuha?.rawUrl,
      editionCitation:
        gretilKarandavyuha?.editionInfo ||
        'Kāraṇḍavyūha (Vaidya, Buddhist Sanskrit Texts 17, Darbhanga 1961, pp. 258-308).',
      manuscriptNotesZh:
        '本条直接关联自德国哥廷根大学 GRETIL 梵文原典库下载之《Kāraṇḍavyūhasūtra》（bsu019_u.htm），原典明确记载「oṃ maṇipadme hūṃ」及其前后赞颂文。',
      rawSnippet: gretilKarandavyuha?.extractedMantras.slice(0, 4).join('\n\n'),
    },
    verses: [
      {
        id: 'sadaksari-v1',
        index: 1,
        iast: 'namaḥ sarvabuddhabodhisattvebhyaḥ | oṃ maṇipadme hūṃ ||',
        classicalTranslitZh: '曩莫 萨嚩没驮冒地萨怛吠瓢 | 唵 摩抳钵讷铭 吽 ||',
        modernPhoneticZh: '拿玛赫 萨尔瓦-布达-博地-萨特威比呀赫 | 嗡 玛尼帕德美 吽',
        meaningZh: '归命一切诸佛菩萨！嗡！持摩尼宝珠与莲华之圣尊啊！吽（愿成满菩提）！',
        meaningEn:
          'Homage to all Buddhas and Bodhisattvas! Oṃ! O Jewel-Lotus Holder (Avalokiteśvara)! Hūṃ!',
        tangNoteZh: '梵本《庄严宝王经》正文：「imāṃ ṣaḍakṣarīṃ mahāvidyārājñīm udāharati sma — oṃ maṇipadme hūṃ」',
        words: [
          {
            iast: 'namaḥ',
            stem: 'namas',
            grammar: 'Nom. sg. n.',
            transliterationZh: '曩莫',
            meaningZh: '归命、敬礼',
            meaningEn: 'homage',
          },
          {
            iast: 'sarvabuddhabodhisattvebhyaḥ',
            stem: 'sarva-buddha-bodhisattva',
            grammar: 'Dat. pl. m.',
            transliterationZh: '萨嚩没驮冒地萨怛吠瓢',
            meaningZh: '向一切诸佛与菩萨众',
            meaningEn: 'to all Buddhas and Bodhisattvas',
          },
          {
            iast: 'oṃ',
            stem: 'oṃ',
            grammar: 'Pranava Bīja',
            transliterationZh: '唵',
            meaningZh: '三身总持圣音',
            meaningEn: 'sacred syllable Oṃ',
          },
          {
            iast: 'maṇipadme',
            stem: 'maṇipadmā',
            grammar: 'Voc. sg. f. (Bahuvrīhi)',
            transliterationZh: '摩抳钵讷铭',
            meaningZh: '摩尼宝莲华持有者啊（或：宝珠在莲华中）',
            meaningEn: 'O holder of the jewel and lotus',
          },
          {
            iast: 'hūṃ',
            stem: 'hūṃ',
            grammar: 'Vajra Bīja',
            transliterationZh: '吽',
            meaningZh: '金刚不坏大悲心印种子字',
            meaningEn: 'seed syllable Hūṃ',
          },
        ],
      },
      {
        id: 'sadaksari-v2',
        index: 2,
        iast: 'namo ratnatrayāya | nama āryāvalokiteśvarāya bodhisattvāya mahāsattvāya mahākāruṇikāya | oṃ maṇipadme hūṃ hrīḥ ||',
        classicalTranslitZh: '曩谟 啰怛曩怛啰夜耶 | 曩莫 阿哩耶嚩路枳帝湿嚩啰耶 冒地萨怛嚩耶 摩诃萨怛嚩耶 摩诃迦噜抳迦耶 | 唵 摩抳钵讷铭 吽 纥哩 ||',
        modernPhoneticZh: '拿摩 啦特拿-特啦呀呀 | 拿玛 阿哩呀-瓦洛给帝-湿瓦啦呀 博地-萨特瓦呀 玛哈-萨特瓦呀 玛哈-嘎鲁尼嘎呀 | 嗡 玛尼帕德美 吽 赫哩希',
        meaningZh: '【庄严宝王经归敬与七字连种子心印】归命三宝！归命圣观自在菩萨摩诃萨、大慈大悲尊！嗡！摩尼莲华尊，吽、纥哩（阿弥陀佛与观音共同莲华部心印）！',
        meaningEn:
          'Homage to the Three Jewels! Homage to Noble Avalokiteśvara, Bodhisattva Mahāsattva, the Greatly Compassionate One! Oṃ Maṇipadme Hūṃ Hrīḥ!',
        words: [
          {
            iast: 'hrīḥ',
            stem: 'hrīḥ',
            grammar: 'Padma-kula Bīja',
            transliterationZh: '纥哩',
            meaningZh: '莲华部阿弥陀佛与观自在菩萨根本种子字',
            meaningEn: 'Lotus-family seed syllable of Avalokiteśvara and Amitābha',
          },
        ],
      },
    ],
  },
  {
    id: 'ekadasamukha-hrdaya-gilgit',
    titleZh: '吉尔吉特梵本·圣十一面观自在菩萨根本心咒',
    titleSanskritIast: 'Ārya-Ekādaśamukha-dhāraṇī (Gilgit Manuscript)',
    titleEnglish: 'Eleven-Faced Avalokiteśvara Fundamental Dhāraṇī (Gilgit MS)',
    categoryId: 'buddhas-bodhisattvas',
    taishoNo: 'T20n1070 / T20n1071 / GRETIL ekmuhr_u',
    translatorZh: '（唐）玄奘 / 不空 译 · 1931年克什米尔吉尔吉特（Gilgit）出土6世纪桦树皮梵文写本对勘',
    sutraSourceZh: '《佛说十一面观世音神咒经》/ Gilgit Manuscripts Vol. III (GRETIL ekmuhr_u.htm)',
    deityZh: '十一面观自在菩萨 (Ekādaśamukha-Avalokiteśvara)',
    meritsAndSummaryZh:
      '本咒常以「藏传大悲咒」名世，实为《十一面观世音神咒经》之根本陀罗尼。1931年于克什米尔吉尔吉特（Gilgit）古塔出土了公元6世纪梵文桦树皮写本《Ekādaśamukha》，由学者 Nalinaksha Dutt 校订出版，证明此咒在印度的古老传承。',
    recitationTipsZh:
      '吉尔吉特写本中「dhara dhara dhiri dhiri dhuru dhuru」三叠元音（a → i → u）展现了古印度陀罗尼声韵递进结构，分别对应摄持大地、光明清净与金刚安住。',
    provenance: {
      sourceType: 'GRETIL/DSBC',
      cbetaId: 'T20n1071',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T20n1071',
      gretilFile: 'ekmuhr_u.htm',
      gretilRawUrl: gretilEkadasamukha?.rawUrl,
      editionCitation:
        gretilEkadasamukha?.editionInfo ||
        'Ekādaśamukham, ed. Nalinaksha Dutt, Gilgit Manuscripts Vol. III, Part 1, Srinagar 1939.',
      manuscriptNotesZh:
        '直接采自 GRETIL 下载之吉尔吉特出土写本《Ekādaśamukham》（ekmuhr_u.htm），保留6世纪西北印度佛教梵语原始面貌。',
      rawSnippet: gretilEkadasamukha?.extractedMantras.join('\n\n'),
    },
    verses: [
      {
        id: 'ekadasa-v1',
        index: 1,
        iast: 'namo ratnatrayāya | nama āryajñānasāgaravairocana-vyūharājāya tathāgatāyārhate samyaksaṃbuddhāya |',
        classicalTranslitZh: '曩谟 啰怛曩怛啰夜耶 | 曩莫 阿哩耶枳娘曩娑孽啰吠嚧者曩 尾庾诃啰惹耶 怛他孽多夜啰诃帝 三藐三没驮耶 |',
        modernPhoneticZh: '拿摩 啦特拿-特啦呀呀 | 拿玛 阿哩呀-吉尼亚拿-萨嘎啦歪洛佳拿-维尤哈啦佳呀 达他嘎达-呀尔哈帝 萨姆呀克-桑布达呀',
        meaningZh: '归命三宝！归命圣智海遍照庄严王如来、应供、正等觉！',
        meaningEn:
          'Homage to the Three Jewels! Homage to the Noble Tathāgata, Arhat, Perfectly Awakened One, King of the Array of Vairocana Ocean of Wisdom!',
        words: [
          {
            iast: 'namo ratnatrayāya',
            stem: 'ratnatraya',
            grammar: 'Dat. sg. n.',
            transliterationZh: '曩谟 啰怛曩怛啰夜耶',
            meaningZh: '归命三宝',
            meaningEn: 'homage to the Three Jewels',
          },
          {
            iast: 'āryajñānasāgaravairocana-vyūharājāya',
            stem: 'vyūharāja',
            grammar: 'Dat. sg. m.',
            transliterationZh: '阿哩耶枳娘曩娑孽啰吠嚧者曩尾庾诃啰惹耶',
            meaningZh: '向圣智海毗卢遮那庄严王（十一面观音之本师佛）',
            meaningEn: 'to the King of the Array of Vairocana Ocean of Noble Wisdom',
          },
        ],
      },
      {
        id: 'ekadasa-v2',
        index: 2,
        iast: 'namaḥ sarvatathāgatebhyo \'rhadbhyaḥ samyaksaṃbuddhebhyaḥ | nama āryāvalokiteśvarāya bodhisattvāya mahāsattvāya mahākāruṇikāya |',
        classicalTranslitZh: '曩莫 萨嚩怛他孽帝毗药 啰诃毗药 三藐三没第毗药 | 曩莫 阿哩耶嚩路枳帝湿嚩啰耶 冒地萨怛嚩耶 摩诃萨怛嚩耶 摩诃迦噜抳迦耶 |',
        modernPhoneticZh: '拿玛赫 萨尔瓦-达他嘎帝比优 尔哈德比呀赫 萨姆呀克-桑布叠比呀赫 | 拿玛 阿哩呀-瓦洛给帝-湿瓦啦呀 博地-萨特瓦呀 玛哈-萨特瓦呀 玛哈-嘎鲁尼嘎呀',
        meaningZh: '归命一切如来、应供、正等觉！归命圣观自在菩萨摩诃萨、大悲圣尊！',
        meaningEn:
          'Homage to all Tathāgatas, Arhats, Perfectly Awakened Ones! Homage to the Noble Avalokiteśvara, Bodhisattva Mahāsattva, the Greatly Compassionate One!',
        words: [
          {
            iast: 'sarvatathāgatebhyo',
            stem: 'sarva-tathāgata',
            grammar: 'Dat. pl. m.',
            transliterationZh: '萨嚩怛他孽帝毗药',
            meaningZh: '向一切如来',
            meaningEn: 'to all Tathāgatas',
          },
          {
            iast: 'mahākāruṇikāya',
            stem: 'mahākāruṇika',
            grammar: 'Dat. sg. m.',
            transliterationZh: '摩诃迦噜抳迦耶',
            meaningZh: '向具足大慈悲者',
            meaningEn: 'to the Greatly Compassionate One',
          },
        ],
      },
      {
        id: 'ekadasa-v3',
        index: 3,
        iast: 'tadyathā — oṃ dhara dhara dhiri dhiri dhuru dhuru itte vatte cale cale pracale pracale kusume kusumavare ili mili viṭi svāhā ||',
        classicalTranslitZh: '怛你也他 — 唵 驮啰 驮啰 地哩 地哩 度噜 度噜 壹帝 嚩帝 者隶 者隶 钵啰者隶 钵啰者隶 矩苏铭 矩苏摩嚩隶 壹里 弭里 尾置 娑嚩诃 ||',
        modernPhoneticZh: '达地呀他 | 嗡 达啦 达啦 地哩 地哩 杜鲁 杜鲁 伊帝 瓦帝 佳咧 佳咧 普啦佳咧 普啦佳咧 古苏美 古苏玛瓦咧 伊利 米利 维蒂 斯瓦哈',
        meaningZh: '即说咒曰：嗡！任持、任持！坚固、坚固！安住、安住！自在运转、妙转震动、胜妙前行！于心花与最胜妙花中，远离热恼，圆满成就，娑婆诃！',
        meaningEn:
          'Namely: Oṃ! Hold, hold! Sustain, sustain! Bear firmly, bear firmly! Move, move, advance, advance! O Flower, O Best of Flowers! Ili mili viṭi svāhā!',
        tangNoteZh: '吉尔吉特梵本紧接心咒：「oṃ lokeśvara hrīḥ ||」（嗡 世自在王 纥哩！）',
        words: [
          {
            iast: 'dhara dhara dhiri dhiri dhuru dhuru',
            stem: '√dhṛ',
            grammar: 'Impv. 2nd sg. (a/i/u ablaut)',
            transliterationZh: '驮啰驮啰 地哩地哩 度噜度噜',
            meaningZh: '忆持、摄持、坚固护持',
            meaningEn: 'hold, sustain, bear firmly',
          },
          {
            iast: 'cale cale pracale pracale',
            stem: '√cal / pra-√cal',
            grammar: 'Voc./Loc. sg.',
            transliterationZh: '者隶者隶 钵啰者隶钵啰者隶',
            meaningZh: '行动、奋迅游行救度',
            meaningEn: 'move, advance swiftly',
          },
          {
            iast: 'kusume kusumavare',
            stem: 'kusuma / kusuma-vara',
            grammar: 'Loc./Voc. sg.',
            transliterationZh: '矩苏铭 矩苏摩嚩隶',
            meaningZh: '妙花、最胜妙华庄严',
            meaningEn: 'in the flower, in the supreme flower',
          },
        ],
      },
    ],
  },
  {
    id: 'amoghapasa-hrdaya',
    titleZh: '不空羂索心王母陀罗尼（梵本校勘）',
    titleSanskritIast: 'Ārya-Amoghapāśa-hṛdaya-mahāvidyārājñī',
    titleEnglish: 'Heart Mantra of Noble Amoghapāśa Avalokiteśvara',
    categoryId: 'buddhas-bodhisattvas',
    taishoNo: 'T20n1093 / GRETIL amoghapu',
    translatorZh: '（唐）玄奘 / 菩提流志 译 · 东京大正大学梵文贝叶写本（Meiseisha 1997）对勘',
    sutraSourceZh: '《不空羂索神咒心经》(T20n1093) / GRETIL amoghapu.htm',
    deityZh: '不空羂索观自在菩萨 (Amoghapāśa-Lokeśvara)',
    meritsAndSummaryZh:
      '以大悲智羂索摄引众生、定不唐捐（不空）。日本大正大学梵语佛典研究会根据尼泊尔贝叶写本与敦煌写本合校出版了梵文《Amoghapāśahṛdaya》，已完整收录于本库。',
    recitationTipsZh:
      '注意「cara cara」（游行救度）与「cili cili」（清净法流）的清塞擦音与浊卷舌音对比，末尾「hūṃ phaṭ」具有破除魔障之力。',
    provenance: {
      sourceType: 'GRETIL/DSBC',
      cbetaId: 'T20n1093',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T20n1093',
      gretilFile: 'amoghapu.htm',
      gretilRawUrl: gretilAmoghapasa?.rawUrl,
      editionCitation:
        gretilAmoghapasa?.editionInfo ||
        'Amoghapāśahṛdaya, ed. Silk / Taisho University Study Group, Tokyo: Meiseisha 1997.',
      manuscriptNotesZh:
        '直接关联自 GRETIL 下载之《Amoghapāśahṛdaya》（amoghapu.htm）梵文校勘本。',
      rawSnippet: gretilAmoghapasa?.extractedMantras.slice(0, 2).join('\n\n'),
    },
    verses: [
      {
        id: 'amoghapasa-v1',
        index: 1,
        iast: 'oṃ cara cara cili cili curu curu mahākāruṇika | siri siri ciri ciri miri miri | mahāpadmahasta kalakala kilikili kulukulu mahāśuddhasattva budhyabudhya |',
        classicalTranslitZh: '唵 者啰 者啰 只里 只里 主噜 主噜 摩诃迦噜抳迦 | 悉里 悉里 只里 只里 弥里 弥里 | 摩诃钵头摩诃娑多 迦啰迦啰 枳里枳里 俱嚧俱嚧 摩诃戍陀萨埵 勃陀勃陀 |',
        modernPhoneticZh: '嗡 佳啦 佳啦 吉利 吉利 主鲁 主鲁 玛哈-嘎鲁尼嘎 | 悉哩 悉哩 吉哩 吉哩 米哩 米哩 | 玛哈-帕德玛-哈斯达 嘎啦嘎啦 给利给利 古卢古卢 玛哈-舒达萨特瓦 布地呀布地呀',
        meaningZh: '嗡！游行救度、清净普覆，大悲圣尊啊！手持大莲华者、大清净有情啊！祈愿觉悟、觉照！',
        meaningEn:
          'Oṃ! Move, move, O Greatly Compassionate One! O Holder of the Great Lotus, O Great Pure Being, awaken, awaken!',
        words: [
          {
            iast: 'mahākāruṇika',
            stem: 'mahākāruṇika',
            grammar: 'Voc. sg. m.',
            transliterationZh: '摩诃迦噜抳迦',
            meaningZh: '大悲圣尊啊',
            meaningEn: 'O Greatly Compassionate One',
          },
          {
            iast: 'mahāpadmahasta',
            stem: 'mahā-padma-hasta',
            grammar: 'Voc. sg. m.',
            transliterationZh: '摩诃钵头摩诃娑多',
            meaningZh: '手持大莲华者啊',
            meaningEn: 'O Holder of the Great Lotus in hand',
          },
          {
            iast: 'mahāśuddhasattva',
            stem: 'mahā-śuddha-sattva',
            grammar: 'Voc. sg. m.',
            transliterationZh: '摩诃戍陀萨埵',
            meaningZh: '大清净菩萨（有情）啊',
            meaningEn: 'O Great Pure Being',
          },
        ],
      },
      {
        id: 'amoghapasa-v2',
        index: 2,
        iast: 'dhara dhara dhiri dhiri dhuru dhuru tāraya tāraya māṃ sarvasattvāṃś ca | oṃ amoghavijaya hūṃ phaṭ svāhā ||',
        classicalTranslitZh: '驮啰 驮啰 地哩 地哩 度噜 度噜 多啰耶 多啰耶 𤚥 萨嚩萨怛嚩室者 | 唵 阿谟伽尾惹耶 吽 泮吒 娑嚩诃 ||',
        modernPhoneticZh: '达啦 达啦 地哩 地哩 杜鲁 杜鲁 达啦呀 达啦呀 芒 萨尔瓦萨特旺什 佳 | 嗡 阿摩嘎-维佳呀 吽 帕特 斯瓦哈',
        meaningZh: '忆持护念！救度我及一切众生度越苦海！嗡！不空尊胜！吽！摧破无明！圆满成就！',
        meaningEn:
          'Hold, sustain! Deliver, deliver me and all sentient beings! Oṃ O Unfailing Victor, Hūṃ Phaṭ Svāhā!',
        words: [
          {
            iast: 'tāraya tāraya',
            stem: '√tṛ (caus.)',
            grammar: 'Impv. 2nd sg.',
            transliterationZh: '多啰耶 多啰耶',
            meaningZh: '请救度、令度脱彼岸',
            meaningEn: 'rescue, cause to cross over',
          },
          {
            iast: 'amoghavijaya',
            stem: 'amogha-vijaya',
            grammar: 'Voc. sg. m.',
            transliterationZh: '阿谟伽尾惹耶',
            meaningZh: '不空最胜尊啊',
            meaningEn: 'O Unfailing Victor',
          },
        ],
      },
    ],
  },
  {
    id: 'manjusri-namasangiti-hrdaya',
    titleZh: '圣妙吉祥真实名经·文殊五字真言与六字心咒',
    titleSanskritIast: 'Mañjuśrī-jñānasattvasya-paramārtha-nāmasaṃgīti-mantra',
    titleEnglish: 'Mañjuśrī Five-Syllable (Arapacana) & Nāmasaṃgīti Heart Mantras',
    categoryId: 'buddhas-bodhisattvas',
    taishoNo: 'T20n1187 / T20n1173 / GRETIL manjn1pu',
    translatorZh: '（唐）不空 /（宋）释智吉祥 译 · 戴维森（Ronald M. Davidson 1981）梵本《Nāmasaṃgīti》对勘',
    sutraSourceZh: '《金刚顶经曼殊室利菩萨五字心陀罗尼品》(T20n1173) / 《圣妙吉祥真实名经》GRETIL manjn1pu.htm',
    deityZh: '大智文殊师利菩萨 (Mañjuśrī-Jñānasattva)',
    meritsAndSummaryZh:
      '汇聚文殊菩萨两大根本真言：一为五字真言「a ra pa ca na dhīḥ」（古印度佉卢文及大乘般若字母表之首五字，表一切法本不生、离尘垢、第一义谛、诸行无常、远离性相）；二为《圣妙吉祥真实名经（Mañjuśrīnāmasaṃgīti）》开篇六字明王「oṃ vākyedaṃ namaḥ」。',
    recitationTipsZh:
      '「a ra pa ca na」五字各为短元音 Laghu（1摩多），唯末尾种子字「dhīḥ」为送气浊齿音加长元音 ī 与止声 ḥ（2摩多 Guru），诵时尾音悠长清越。',
    provenance: {
      sourceType: 'GRETIL/DSBC',
      cbetaId: 'T20n1173',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T20n1173',
      gretilFile: 'manjn1pu.htm',
      gretilRawUrl: gretilManjusri?.rawUrl,
      editionCitation:
        gretilManjusri?.editionInfo ||
        'Mañjuśrījñānasattvasya Paramārthanāmasaṅgītiḥ, ed. Ronald M. Davidson, MCB 20 (1981), pp. 1-69.',
      manuscriptNotesZh:
        '关联自 GRETIL 下载之《Mañjuśrīnāmasaṃgīti》（manjn1pu.htm）梵文校勘本。',
      rawSnippet: gretilManjusri?.extractedMantras.join('\n\n'),
    },
    verses: [
      {
        id: 'manjusri-v1',
        index: 1,
        iast: 'oṃ a ra pa ca na dhīḥ ||',
        classicalTranslitZh: '唵 阿 啰 跛 者 曩 地 ||',
        modernPhoneticZh: '嗡 阿 啦 巴 佳 拿 迪希',
        meaningZh: '嗡！一切法本不生（A）、离诸尘染（Ra）、第一义谛清净（Pa）、诸法无自性行（Ca）、远离一切名相（Na），般若大智圆满（Dhīḥ）！',
        meaningEn:
          'Oṃ! Primordial non-arising (A), freedom from dust (Ra), ultimate truth (Pa), absence of inherent movement (Ca), transcendence of names (Na) — Supreme Wisdom (Dhīḥ)!',
        words: [
          {
            iast: 'a',
            stem: 'ādyanutpāda',
            grammar: 'Arapacana 1st syllable',
            transliterationZh: '阿',
            meaningZh: '阿字门：一切法本不生',
            meaningEn: 'primordial non-arising of all dharmas',
          },
          {
            iast: 'ra',
            stem: 'rajas',
            grammar: 'Arapacana 2nd syllable',
            transliterationZh: '啰',
            meaningZh: '啰字门：离诸尘垢',
            meaningEn: 'freedom from defilement/dust',
          },
          {
            iast: 'pa',
            stem: 'paramārtha',
            grammar: 'Arapacana 3rd syllable',
            transliterationZh: '跛',
            meaningZh: '跛字门：第一义谛显现',
            meaningEn: 'ultimate truth',
          },
          {
            iast: 'ca',
            stem: 'caryā',
            grammar: 'Arapacana 4th syllable',
            transliterationZh: '者',
            meaningZh: '者字门：一切法无可迁行',
            meaningEn: 'absence of inherent course',
          },
          {
            iast: 'na',
            stem: 'nāma',
            grammar: 'Arapacana 5th syllable',
            transliterationZh: '曩',
            meaningZh: '曩字门：一切法远离名相',
            meaningEn: 'transcendence of names',
          },
          {
            iast: 'dhīḥ',
            stem: 'dhī',
            grammar: 'Nom. sg. f. (Prajñā Bīja)',
            transliterationZh: '地',
            meaningZh: '甚深般若智慧种子字',
            meaningEn: 'seed syllable of supreme intelligence/wisdom',
          },
        ],
      },
      {
        id: 'manjusri-v2',
        index: 2,
        iast: 'oṃ sarvadharmābhāvasvabhāvaviśuddhavajra a ā aṃ aḥ | prakṛtipariśuddhāḥ sarvadharmā yaduta sarvatathāgatajñānakāyamañjuśrīpariśuddhitām upādāyeti | a āḥ sarvatathāgata-hṛdaya hara hara | oṃ hūṃ hrīḥ bhagavan jñānamūrte vāgīśvara mahāpaca sarvadharmagaganāmalasupariśuddhadharmadhātujñānagarbha āḥ ||',
        classicalTranslitZh: '唵 萨嚩达磨婆嚩娑嚩婆嚩尾戍驮嚩日啰 阿 阿 暗 恶 | 钵啰讫哩底钵哩戍驮 萨嚩达磨 也努多 萨嚩怛他孽多枳娘曩迦耶曼殊室哩钵哩戍地多目波那曳底 | 阿 恶 萨嚩怛他孽多纥哩那耶 诃啰 诃啰 | 唵 吽 纥哩 婆孽鑁 枳娘曩母哩帝 嚩拟湿嚩啰 摩诃跛者 萨嚩达磨孽孽曩摩啰苏钵哩戍驮达磨驮睹枳娘曩孽婆 恶 ||',
        modernPhoneticZh: '嗡 萨尔瓦-达尔玛-巴瓦斯瓦巴瓦维舒达瓦吉啦 阿 阿 昂 阿赫 | 普啦克哩帝巴哩舒达赫 萨尔瓦达尔玛 呀杜达 萨尔瓦-达他嘎达-吉尼亚拿-嘎呀-曼居什哩巴哩舒地当 乌巴达耶帝 | 阿 阿赫 萨尔瓦-达他嘎达-赫哩达呀 哈啦 哈啦 | 嗡 吽 赫哩希 巴嘎万 吉尼亚拿穆尔帝 瓦吉湿瓦啦 玛哈巴佳 萨尔瓦-达尔玛-嘎嘎拿玛啦苏巴哩舒达达尔玛达图吉尼亚拿嘎尔巴 阿赫',
        meaningZh: '嗡！一切诸法无性自性清净金刚！阿、阿、暗、恶！一切诸法自性清净，所谓由一切如来智身妙吉祥清净性故。阿、恶！一切如来心，摄持、摄持！嗡、吽、纥哩！世尊、智慧身尊、语自在王、大成熟者、一切法如虚空无垢极清净法界智藏啊！恶！',
        meaningEn:
          'Oṃ! Vajra of the pure nature of the non-existence of all dharmas: A Ā Aṃ Aḥ! All dharmas are naturally pure by virtue of the purity of Mañjuśrī, the Wisdom-Body of all Tathāgatas. O Bhagavan, Embodiment of Wisdom, Lord of Speech (Vāgīśvara), Womb of the Wisdom of the utterly pure Dharmadhātu spotless like the sky of all dharmas: Āḥ!',
        tangNoteZh: '此段直接引自本库下载之 GRETIL《Mañjuśrīnāmasaṃgīti》（manjn1pu.htm）第15节陀罗尼原文。',
        words: [
          {
            iast: 'jñānamūrte',
            stem: 'jñāna-mūrti',
            grammar: 'Voc. sg. m.',
            transliterationZh: '枳娘曩母哩帝',
            meaningZh: '智慧化身尊啊',
            meaningEn: 'O Embodiment of Wisdom',
          },
          {
            iast: 'vāgīśvara',
            stem: 'vāc-īśvara',
            grammar: 'Voc. sg. m.',
            transliterationZh: '嚩拟湿嚩啰',
            meaningZh: '语自在王（文殊别号）啊',
            meaningEn: 'O Lord of Speech',
          },
          {
            iast: 'dharmadhātujñānagarbha',
            stem: 'dharmadhātu-jñāna-garbha',
            grammar: 'Voc. sg. m.',
            transliterationZh: '达磨驮睹枳娘曩孽婆',
            meaningZh: '法界体性智胎藏尊啊',
            meaningEn: 'O Womb of Dharmadhātu Wisdom',
          },
        ],
      },
    ],
  },
  {
    id: 'arya-tara-hrdaya-108',
    titleZh: '圣救度佛母十字心咒与百八名陀罗尼',
    titleSanskritIast: 'Ārya-Tārā-mūla-mantra & Aṣṭottaraśatanāma',
    titleEnglish: 'Noble Ārya Tārā Ten-Syllable Heart Mantra & 108 Names',
    categoryId: 'buddhas-bodhisattvas',
    taishoNo: 'T20n1102 / T20n1105 / GRETIL tarb108u',
    translatorZh: '（唐）不空 /（宋）法贤 译 · 尼泊尔数字化梵文佛典（DSBC / GRETIL tarb108u.htm）对勘',
    sutraSourceZh: '《佛说圣多罗菩萨一百八名陀罗尼经》(T20n1105) / GRETIL tarb108u.htm',
    deityZh: '圣绿度母 / 多罗菩萨 (Ārya-Tārā)',
    meritsAndSummaryZh:
      '多罗菩萨（Tārā，意译救度母、度脱母）从观自在菩萨大悲泪珠化现，能迅速救度狮、象、火、蛇、盗贼、牢狱、水溺、非人等八大怖畏（Aṣṭamahābhaya）。',
    recitationTipsZh:
      '「tāre（度母啊！阴性单数呼格）→ tuttāre（极度脱八难者啊！）→ ture（疾速救度者啊！）」三重递进，展现度母悲智力量的层层加被。',
    provenance: {
      sourceType: 'GRETIL/DSBC',
      cbetaId: 'T20n1105',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T20n1105',
      gretilFile: 'tarb108u.htm',
      gretilRawUrl: gretilTara?.rawUrl,
      editionCitation:
        gretilTara?.editionInfo ||
        'Tārābhaṭṭārikāyā nāmāṣṭottaraśatakam (Vaidya, Buddhist Sanskrit Texts 17, Darbhanga 1961).',
      manuscriptNotesZh:
        '关联自 GRETIL 下载之《Tārābhaṭṭārikāyā nāmāṣṭottaraśatakam》（tarb108u.htm）梵文校勘本。',
      rawSnippet: gretilTara?.extractedMantras.join('\n\n'),
    },
    verses: [
      {
        id: 'tara-v1',
        index: 1,
        iast: 'oṃ tāre tuttāre ture svāhā ||',
        classicalTranslitZh: '唵 多隶 咄多隶 都隶 娑嚩诃 ||',
        modernPhoneticZh: '嗡 达咧 图达咧 图咧 斯瓦哈',
        meaningZh: '嗡！圣救度母啊（度脱轮回者）！救度一切八大怖畏苦难之慈母啊！疾速赐予解脱成就者啊！圆满吉祥！',
        meaningEn:
          'Oṃ! O Savioress (Tāre)! O Deliverer from all fears (Tuttāre)! O Swift Heroine (Ture)! Svāhā!',
        words: [
          {
            iast: 'oṃ',
            stem: 'oṃ',
            grammar: 'Bīja',
            transliterationZh: '唵',
            meaningZh: '归命三身圣音',
            meaningEn: 'sacred syllable Oṃ',
          },
          {
            iast: 'tāre',
            stem: 'tārā',
            grammar: 'Voc. sg. f.',
            transliterationZh: '多隶',
            meaningZh: '救度母啊（令度生死海者）',
            meaningEn: 'O Savioress / She who ferries across',
          },
          {
            iast: 'tuttāre',
            stem: 'ud-tārā',
            grammar: 'Voc. sg. f.',
            transliterationZh: '咄多隶',
            meaningZh: '拔济苦难母啊（救脱八大怖畏）',
            meaningEn: 'O Supreme Deliverer from suffering',
          },
          {
            iast: 'ture',
            stem: 'turā',
            grammar: 'Voc. sg. f.',
            transliterationZh: '都隶',
            meaningZh: '迅疾勇猛救度母啊',
            meaningEn: 'O Swift One',
          },
          {
            iast: 'svāhā',
            stem: 'svāhā',
            grammar: 'Indecl.',
            transliterationZh: '娑嚩诃',
            meaningZh: '愿吉祥扎根成就',
            meaningEn: 'hail, so be it',
          },
        ],
      },
      {
        id: 'tara-v2',
        index: 2,
        iast: 'namo ratnatrayāya | nama āryāvalokiteśvarāya bodhisattvāya mahāsattvāya mahākāruṇikāya | tadyathā — oṃ tāre tuttāre ture sarvaduṣṭapraduṣṭān māṃ mocaya svāhā ||',
        classicalTranslitZh: '曩谟 啰怛曩怛啰夜耶 | 曩莫 阿哩耶嚩路枳帝湿嚩啰耶 冒地萨怛嚩耶 摩诃萨怛嚩耶 摩诃迦噜抳迦耶 | 怛你也他 — 唵 多隶 咄多隶 都隶 萨嚩訥瑟吒钵啰訥瑟吒 𤚥 谟左耶 娑嚩诃 ||',
        modernPhoneticZh: '拿摩 啦特拿-特啦呀呀 | 拿玛 阿哩呀-瓦洛给帝-湿瓦啦呀 博地-萨特瓦呀 玛哈-萨特瓦呀 玛哈-嘎鲁尼嘎呀 | 达地呀他 | 嗡 达咧 图达咧 图咧 萨尔瓦-杜什达普啦杜什丹 芒 摩佳呀 斯瓦哈',
        meaningZh: '【圣多罗菩萨根本长咒】归命三宝！归命圣观自在菩萨摩诃萨、具大慈悲者！即说咒曰：嗡！度母、救苦度母、疾速度母啊！请令我从一切恶毒、暴恶灾障中悉得解脱，圆满成就！',
        meaningEn:
          '[Fundamental Long Dhāraṇī of Ārya Tārā] Homage to the Three Jewels and Noble Avalokiteśvara! Namely: Oṃ Tāre Tuttāre Ture, liberate me from all wicked and hostile forces, Svāhā!',
        words: [
          {
            iast: 'mocaya',
            stem: '√muc (caus.)',
            grammar: 'Impv. 2nd sg.',
            transliterationZh: '谟左耶',
            meaningZh: '请令解脱、度脱',
            meaningEn: 'liberate, set free',
          },
        ],
      },
    ],
  },
  {
    id: 'ksitigarbha-karma-irm',
    titleZh: '地藏菩萨灭定业真言与根本真言',
    titleSanskritIast: 'Kṣitigarbha-niyatakarmāvaraṇa-viśodhana-mantra',
    titleEnglish: 'Kṣitigarbha Bodhisattva Mantra for Eradicating Fixed Karma',
    categoryId: 'buddhas-bodhisattvas',
    taishoNo: 'T20n1159B / T19n0974E',
    translatorZh: '（唐）不空 译《陀罗尼集》及汉传课诵传本',
    sutraSourceZh: '《地藏菩萨仪轨》(T20n1159B) / 显密圆通成佛心要集',
    deityZh: '大愿地藏王菩萨 (Mahāpraṇidhāna-Kṣitigarbha)',
    meritsAndSummaryZh:
      '汉传佛教最广为持诵之地藏法门心咒。「oṃ pramardani svāhā」意为摧伏、粉碎一切宿世定业结缚，令行者重报转轻、资粮具足。',
    recitationTipsZh:
      '汉传古音「唵 钵啰末邻陀宁 娑婆诃」对应的梵文还原为「oṃ pramardani svāhā」（或呼格 pramardane），词根 pra-√mṛd 意为彻底粉碎、摧灭（罪障）。',
    provenance: {
      sourceType: 'Academic-Critical-Edition',
      cbetaId: 'T20n1159B',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T20n1159B',
      editionCitation:
        'CBETA T20n1159B & Sanskrit reconstruction of Oṃ pramardani svāhā (cf. Digital Dictionary of Buddhism / 蔡文端梵文咒语校勘).',
      manuscriptNotesZh:
        '对勘唐密地藏菩萨真言「曩莫三曼多没驮喃 诃诃诃 素怛拿 娑嚩诃」与灭定业真言「唵 钵啰末邻陀宁 娑嚩诃」。',
    },
    verses: [
      {
        id: 'ksiti-v1',
        index: 1,
        iast: 'oṃ pramardani svāhā ||',
        classicalTranslitZh: '唵 钵啰末邻陀宁 娑嚩诃 ||',
        modernPhoneticZh: '嗡 普啦玛尔达尼 斯瓦哈',
        meaningZh: '嗡！彻底摧碎一切定业烦恼障之圣力啊！圆满吉祥！',
        meaningEn: 'Oṃ! O Crusher and Destroyer (of fixed karmic obstacles)! Svāhā!',
        words: [
          {
            iast: 'oṃ',
            stem: 'oṃ',
            grammar: 'Bīja',
            transliterationZh: '唵',
            meaningZh: '归命圣音',
            meaningEn: 'Oṃ',
          },
          {
            iast: 'pramardani',
            stem: 'pra-mardanī (pra-√mṛd)',
            grammar: 'Voc. sg. f.',
            transliterationZh: '钵啰末邻陀宁',
            meaningZh: '摧碎、研磨灭尽（定业罪障）者啊',
            meaningEn: 'O Crusher / Destroyer of obstacles',
          },
          {
            iast: 'svāhā',
            stem: 'svāhā',
            grammar: 'Indecl.',
            transliterationZh: '娑嚩诃',
            meaningZh: '圆满成就',
            meaningEn: 'Svāhā',
          },
        ],
      },
      {
        id: 'ksiti-v2',
        index: 2,
        iast: 'namaḥ samantabuddhānāṃ | ha ha ha sutanu svāhā ||',
        classicalTranslitZh: '曩莫 三曼多没驮喃 | 诃 诃 诃 素怛拿 娑嚩诃 ||',
        modernPhoneticZh: '拿玛赫 萨曼达-布达南 | 哈 哈 哈 苏达努 斯瓦哈',
        meaningZh: '归命普遍一切诸佛！哈哈（三解脱门法尔欢笑）！善妙庄严身（或希有胜妙尊）啊！圆满成就！',
        meaningEn:
          'Homage to the Universal Buddhas! Ha Ha Ha (Threefold Liberation)! O Wondrous Embodiment! Svāhā!',
        words: [
          {
            iast: 'ha ha ha',
            stem: 'ha-traya',
            grammar: 'Bīja',
            transliterationZh: '诃诃诃',
            meaningZh: '空、无相、无愿三解脱门种子字',
            meaningEn: 'Threefold liberation seed syllables',
          },
          {
            iast: 'sutanu',
            stem: 'su-tanu',
            grammar: 'Voc. sg.',
            transliterationZh: '素怛拿',
            meaningZh: '妙色身尊啊（地藏六道化现妙身）',
            meaningEn: 'O Wondrous Form',
          },
        ],
      },
    ],
  },

  // ============================================================================
  // 明王护法与五护部 (vidyarajas-protectors)
  // ============================================================================
  {
    id: 'acalanatha-karuna-mantra',
    titleZh: '圣无动尊大威怒王慈救咒与火界咒',
    titleSanskritIast: 'Ārya-Acalanātha-vidyārāja-mantra',
    titleEnglish: 'Ārya Acalanātha (Fudō Myōō) Compassionate Rescue & Fire-Realm Mantras',
    categoryId: 'vidyarajas-protectors',
    taishoNo: 'T19n0848 / T21n1200',
    translatorZh: '（唐）善无畏 译《大毗卢遮那成佛神变加持经》/（唐）不空 译《底哩三昧耶不动尊圣者念诵秘密法》',
    sutraSourceZh: '《大日经》卷二 (T18n0848) / 《不动使者陀罗尼秘密法》(T21n1200)',
    deityZh: '不动明王 / 圣无动尊 (Ārya-Acalanātha)',
    meritsAndSummaryZh:
      '五大明王之主尊，为大日如来教令轮身。右手持智慧利剑断除无明贪嗔，左手执金刚羂索系缚刚强难化众生令入菩提。本条收录最核心之「慈救咒（中咒）」与「一字心真言」。',
    recitationTipsZh:
      '「caṇḍamahāroṣaṇa」中「ṇḍ」与「ṣaṇa」均为卷舌音；「sphoṭaya（摧破、粉碎）」起首为复辅音 sph-，发音如清擦音 s 紧接送气清双唇塞音 ph。',
    provenance: {
      sourceType: 'CBETA-XML-P5',
      cbetaId: 'T18n0848',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T18n0848',
      editionCitation:
        'CBETA T18n0848 《大毗卢遮那成佛神变加持经》卷二〈真言藏品〉& T21n1200 不空译轨.',
      manuscriptNotesZh:
        '依据唐密与东密传持之悉昙梵字写本《不动明王慈救咒》与《一字心真言》校订。',
    },
    verses: [
      {
        id: 'acala-v1',
        index: 1,
        iast: 'namaḥ samantavajrāṇāṃ | caṇḍamahāroṣaṇa sphoṭaya hūṃ traṭ hāṃ māṃ ||',
        classicalTranslitZh: '曩莫 三曼多嚩日啰赧 | 战拏摩诃嚧洒拏 娑破吒耶 吽 怛啰吒 憾 𤚥 ||',
        modernPhoneticZh: '拿玛赫 萨曼达-瓦吉啦南 | 詹达玛哈洛沙拿 斯坡达呀 吽 特啦特 罕 芒',
        meaningZh: '归命普遍一切金刚众！暴恶大忿怒威德尊啊！请摧碎、击破一切魔障无明！吽！叱破（怛啰吒）！种子字憾、𤚥！',
        meaningEn:
          'Homage to the Universal Vajras! O Fierce and Greatly Wrathful One (Caṇḍamahāroṣaṇa), shatter and burst asunder (all obstacles)! Hūṃ Traṭ Hāṃ Māṃ!',
        words: [
          {
            iast: 'samantavajrāṇāṃ',
            stem: 'samanta-vajra',
            grammar: 'Gen. pl. m.',
            transliterationZh: '三曼多嚩日啰赧',
            meaningZh: '普遍一切金刚部圣众',
            meaningEn: 'of the universal Vajras',
          },
          {
            iast: 'caṇḍamahāroṣaṇa',
            stem: 'caṇḍa-mahā-roṣaṇa',
            grammar: 'Voc. sg. m.',
            transliterationZh: '战拏摩诃嚧洒拏',
            meaningZh: '威猛大忿怒尊（不动明王）啊',
            meaningEn: 'O Fierce and Greatly Wrathful One',
          },
          {
            iast: 'sphoṭaya',
            stem: '√sphuṭ (caus.)',
            grammar: 'Impv. 2nd sg.',
            transliterationZh: '娑破吒耶',
            meaningZh: '请粉碎、炸裂（一切业障魔军）',
            meaningEn: 'shatter, burst asunder',
          },
          {
            iast: 'hūṃ traṭ hāṃ māṃ',
            stem: 'bīja-catuṣka',
            grammar: 'Vidyārāja Bījas',
            transliterationZh: '吽 怛啰吒 憾 𤚥',
            meaningZh: '恐怖摧破与不动明王根本种子字（hāṃ māṃ）',
            meaningEn: 'seed syllables of wrathful subjugation and Acalanātha',
          },
        ],
      },
      {
        id: 'acala-v2',
        index: 2,
        iast: 'namaḥ samantavajrāṇāṃ hāṃ ||',
        classicalTranslitZh: '曩莫 三曼多嚩日啰赧 憾 ||',
        modernPhoneticZh: '拿玛赫 萨曼达-瓦吉啦南 罕',
        meaningZh: '归命普遍一切金刚众！憾（不动明王一字心印）！',
        meaningEn: 'Homage to the Universal Vajras! Hāṃ!',
        words: [
          {
            iast: 'hāṃ',
            stem: 'hāṃ',
            grammar: 'Acala Bīja',
            transliterationZh: '憾',
            meaningZh: '不动尊菩提心不可动摇之根本种子字',
            meaningEn: 'Root seed syllable of Acalanātha',
          },
        ],
      },
    ],
  },
  {
    id: 'mahapratisara-hrdaya',
    titleZh: '普遍光明清净炽盛如意宝印心无能胜大明王大随求陀罗尼（心咒与梵本）',
    titleSanskritIast: 'Ārya-Mahāpratisarā-mahāvidyārājñī',
    titleEnglish: 'Great Wish-Fulfilling Queen Mahāpratisarā Dhāraṇī (Pañcarakṣā I)',
    categoryId: 'vidyarajas-protectors',
    taishoNo: 'T20n1153 / GRETIL psarkdhu',
    translatorZh: '（唐）不空 译 · 尼泊尔《五护陀罗尼（Pañcarakṣā）》梵文贝叶本（GRETIL psarkdhu.htm）对勘',
    sutraSourceZh: '《普遍光明清净炽盛如意宝印心无能胜大明王大随求陀罗尼经》(T20n1153) / GRETIL psarkdhu.htm',
    deityZh: '大随求菩萨 (Mahāpratisarā)',
    meritsAndSummaryZh:
      '印度与尼泊尔佛教最受尊崇之《五护陀罗尼（Pañcarakṣā）》第一部。唐代与辽代塔葬常置大随求陀罗尼经幢或佩带梵字坛城，随众生所求皆令圆满，灭一切重罪。',
    recitationTipsZh:
      '随求心咒「oṃ bhara bhara saṃbhara saṃbhara indriyabalaviśodhani hūṃ hūṃ ruru cale svāhā」兼具福智资粮聚集（saṃbhara）与诸根力清净（indriyabalaviśodhani）。',
    provenance: {
      sourceType: 'GRETIL/DSBC',
      cbetaId: 'T20n1153',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T20n1153',
      gretilFile: 'psarkdhu.htm',
      gretilRawUrl: gretilPratisara?.rawUrl,
      editionCitation:
        gretilPratisara?.editionInfo ||
        'Pañcarakṣā: Mahāpratisarāvidyārājñī (Digital Sanskrit Buddhist Canon / GRETIL psarkdhu.htm).',
      manuscriptNotesZh:
        '直接关联自 GRETIL 下载之《Pañcarakṣā》大随求部梵本（psarkdhu.htm）。',
      rawSnippet: gretilPratisara?.extractedMantras.slice(0, 2).join('\n\n'),
    },
    verses: [
      {
        id: 'pratisara-v1',
        index: 1,
        iast: 'oṃ bhara bhara saṃbhara saṃbhara indriyabalaviśodhani hūṃ hūṃ ruru cale svāhā ||',
        classicalTranslitZh: '唵 跋啰 跋啰 三跋啰 三跋啰 因捺哩耶嚩攞尾戍驮你 吽 吽 噜噜 者隶 娑嚩诃 ||',
        modernPhoneticZh: '嗡 巴啦 巴啦 桑巴啦 桑巴啦 因德哩呀巴啦维硕达尼 吽 吽 鲁鲁 佳咧 斯瓦哈',
        meaningZh: '嗡！任持护念、积集福智二种资粮！净治五根五力之圣母啊！吽、吽！光明照耀、神通无碍！圆满吉祥！',
        meaningEn:
          'Oṃ! Sustain, sustain! Accumulate, accumulate (merit and wisdom)! O Purifier of the faculties and spiritual powers! Hūṃ Hūṃ Ruru Cale Svāhā!',
        words: [
          {
            iast: 'saṃbhara saṃbhara',
            stem: 'sam-√bhṛ',
            grammar: 'Impv. 2nd sg.',
            transliterationZh: '三跋啰 三跋啰',
            meaningZh: '集聚、圆满福智二种资粮',
            meaningEn: 'accumulate, bring together',
          },
          {
            iast: 'indriyabalaviśodhani',
            stem: 'indriya-bala-viśodhanī',
            grammar: 'Voc. sg. f.',
            transliterationZh: '因捺哩耶嚩攞尾戍驮你',
            meaningZh: '清净信等五根、五力之圣母啊',
            meaningEn: 'O Purifier of the spiritual faculties and powers',
          },
        ],
      },
      {
        id: 'pratisara-v2',
        index: 2,
        iast: 'oṃ maṇidhari vajriṇi mahāpratisare hūṃ hūṃ phaṭ phaṭ svāhā ||',
        classicalTranslitZh: '唵 摩抳驮哩 嚩日哩抳 摩诃钵啰底萨隶 吽 吽 泮吒 泮吒 娑嚩诃 ||',
        modernPhoneticZh: '嗡 玛尼达哩 瓦吉哩尼 玛哈-普啦帝萨咧 吽 吽 帕特 帕特 斯瓦哈',
        meaningZh: '嗡！持摩尼宝珠母啊、执金刚母啊、大随求圣母啊！吽吽！摧破一切障碍（泮吒泮吒）！圆满成就！',
        meaningEn:
          'Oṃ! O Jewel-Holder, O Vajra-Holder, O Great Pratisarā! Hūṃ Hūṃ Phaṭ Phaṭ Svāhā!',
        tangNoteZh: '此句为尼泊尔梵本《Pañcarakṣā》（psarkdhu.htm）卷末大随求根本随心真言原句。',
        words: [
          {
            iast: 'maṇidhari',
            stem: 'maṇi-dharī',
            grammar: 'Voc. sg. f.',
            transliterationZh: '摩抳驮哩',
            meaningZh: '执持如意宝珠母啊',
            meaningEn: 'O Female Holder of the Wish-Fulfilling Gem',
          },
          {
            iast: 'vajriṇi',
            stem: 'vajriṇī',
            grammar: 'Voc. sg. f.',
            transliterationZh: '嚩日哩抳',
            meaningZh: '具有金刚威力母啊',
            meaningEn: 'O Female Wielder of the Vajra',
          },
          {
            iast: 'mahāpratisare',
            stem: 'mahā-pratisarā',
            grammar: 'Voc. sg. f.',
            transliterationZh: '摩诃钵啰底萨隶',
            meaningZh: '大随求大明王母啊',
            meaningEn: 'O Great Wish-Fulfilling Mahāpratisarā',
          },
        ],
      },
    ],
  },
  {
    id: 'mahamayuri-vidyarajni',
    titleZh: '佛母大孔雀明王心咒与根本陀罗尼（Pañcarakṣā）',
    titleSanskritIast: 'Ārya-Mahāmāyūrī-vidyārājñī-dhāraṇī',
    titleEnglish: 'Great Peacock Queen Mahāmāyūrī Vidyārājñī Dhāraṇī (Pañcarakṣā II)',
    categoryId: 'vidyarajas-protectors',
    taishoNo: 'T19n0982 / GRETIL mmayuvru',
    translatorZh: '（唐）不空 译 · 东京大学高楠顺次郎校订梵本《Mahāmāyūrī》（GRETIL mmayuvru.htm）对勘',
    sutraSourceZh: '《佛母大孔雀明王经》(T19n0982) / GRETIL mmayuvru.htm',
    deityZh: '佛母大孔雀明王 (Mahāmāyūrī-Vidyārājñī)',
    meritsAndSummaryZh:
      '《五护陀罗尼》第二部。缘起于莎底比丘为毒蛇所螫，佛陀宣说此大孔雀明王真言，能除一切蛇毒、蛊毒、瘟疫、天旱水涝，护国息灾。',
    recitationTipsZh:
      '孔雀明王心咒「oṃ mayūrakrānte svāhā」意为「乘孔雀而行之圣母啊，吉祥成就！」其中 krānte 来自词根 √kram（跨步、乘御）。',
    provenance: {
      sourceType: 'GRETIL/DSBC',
      cbetaId: 'T19n0982',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T19n0982',
      gretilFile: 'mmayuvru.htm',
      gretilRawUrl: gretilMahamayuri?.rawUrl,
      editionCitation:
        gretilMahamayuri?.editionInfo ||
        'Mahāmāyūrī Vidyārājñī, ed. Takakusu Junjirō, Tokyo 1972 (GRETIL mmayuvru.htm).',
      manuscriptNotesZh:
        '直接关联自 GRETIL 下载之《Mahāmāyūrī Vidyārājñī》（mmayuvru.htm）梵文校勘本。',
      rawSnippet: gretilMahamayuri?.extractedMantras.slice(0, 3).join('\n\n'),
    },
    verses: [
      {
        id: 'mayuri-v1',
        index: 1,
        iast: 'namo buddhāya | namo dharmāya | namaḥ saṃghāya | namo suvarṇāvabhāsasya mayūrarājño | namo mahāmāyūryai vidyārājñyai ||',
        classicalTranslitZh: '曩谟 没驮耶 | 曩谟 达磨耶 | 曩谟 僧伽耶 | 曩谟 苏嚩啰拏嚩婆萨写 摩愉啰啰惹 | 曩谟 摩诃摩愉哩曳 尾你也啰惹曳 ||',
        modernPhoneticZh: '拿摩 布达呀 | 拿摩 达尔玛呀 | 拿玛赫 桑嘎呀 | 拿摩 苏瓦尔拿瓦巴萨斯呀 玛尤啦啦吉尼优 | 拿摩 玛哈-玛尤哩崖 维地呀啦吉尼崖',
        meaningZh: '归命佛！归命法！归命僧！归命放金色光焰之孔雀王！归命佛母大孔雀明王尊！',
        meaningEn: 'Homage to the Buddha, Dharma, and Saṃgha! Homage to the Golden-Radiant Peacock King! Homage to Mahāmāyūrī Vidyārājñī!',
        words: [
          {
            iast: 'suvarṇāvabhāsasya mayūrarājño',
            stem: 'suvarṇa-avabhāsa mayūra-rājan',
            grammar: 'Gen./Dat. sg. m.',
            transliterationZh: '苏嚩啰拏嚩婆萨写 摩愉啰啰惹',
            meaningZh: '金色光耀之孔雀王（释迦佛前生瑞相）',
            meaningEn: 'of the Golden-Radiant Peacock King',
          },
          {
            iast: 'mahāmāyūryai vidyārājñyai',
            stem: 'mahā-māyūrī vidyā-rājñī',
            grammar: 'Dat. sg. f.',
            transliterationZh: '摩诃摩愉哩曳 尾你也啰惹曳',
            meaningZh: '向大孔雀佛母明王尊致敬',
            meaningEn: 'to Mahāmāyūrī, Queen of Vidyās',
          },
        ],
      },
      {
        id: 'mayuri-v2',
        index: 2,
        iast: 'tadyathā — siddhe susiddhe mocani mokṣaṇi mukte vimukte amale vimale nirmale maṅgalye hiraṇyagarbhe ratnagarbhe bhadre subhadre samantabhadre sarvārthasādhani | oṃ mayūrakrānte svāhā ||',
        classicalTranslitZh: '怛侄他 — 悉第 苏悉第 谟左你 谟刹你 目帝 尾目帝 阿摩隶 尾摩隶 涅摩隶 瞢誐隶 呬啰尼耶蘖陛 啰怛曩蘖陛 跋捺隶 苏跋捺隶 三曼多跋捺隶 萨嚩啰他娑陀你 | 唵 摩愉啰讫兰帝 娑嚩诃 ||',
        modernPhoneticZh: '达地呀他 | 悉叠 苏悉叠 摩佳尼 摩克沙尼 穆克帝 维穆克帝 阿玛咧 维玛咧 尼尔玛咧 芒嘎勒耶 嘿啦尼呀嘎尔贝 啦特拿嘎尔贝 巴德咧 苏巴德咧 萨曼达-巴德咧 萨尔瓦尔他萨达尼 | 嗡 玛尤啦克兰帝 斯瓦哈',
        meaningZh: '即说咒曰：成就母、善成就母、解脱母、无垢离染母、吉祥金胎宝藏母、普贤善母、满一切义利母！嗡！乘御金翅孔雀王遨游法界之大明王母啊，息除诸毒，圆满成就！',
        meaningEn: 'Namely: O Accomplished One, Liberator, Stainless One, Golden-Womb, Jewel-Womb, All-Good One, Fulfiller of all aims! Oṃ! O She who mounts the Peacock (Mayūrakrānte), Svāhā!',
        words: [
          {
            iast: 'mayūrakrānte',
            stem: 'mayūra-krāntā',
            grammar: 'Voc. sg. f.',
            transliterationZh: '摩愉啰讫兰帝',
            meaningZh: '乘孔雀王而行之佛母啊',
            meaningEn: 'O She who mounts the peacock',
          },
          {
            iast: 'svāhā',
            stem: 'svāhā',
            grammar: 'Indecl.',
            transliterationZh: '娑嚩诃',
            meaningZh: '息毒吉祥成就',
            meaningEn: 'Svāhā',
          },
        ],
      },
    ],
  },
  {
    id: 'marici-devi-dharani',
    titleZh: '佛说摩利支天菩萨陀罗尼与心咒（梵汉双校本）',
    titleSanskritIast: 'Ārya-Mārīcī-nāma-dhāraṇī',
    titleEnglish: 'Noble Goddess of Dawn Mārīcī Protection Dhāraṇī',
    categoryId: 'vidyarajas-protectors',
    taishoNo: 'T21n1257 / GRETIL maricdhu',
    translatorZh: '（宋）法天 译 · 梵本《Āryamārīcīnāmadhāraṇī》（GRETIL maricdhu.htm）与 CBETA T21n1257 对勘',
    sutraSourceZh: '《佛说大摩里支菩萨经》(T21n1257) / GRETIL maricdhu.htm',
    deityZh: '摩利支天菩萨 / 积光天母 (Ārya-Mārīcī)',
    meritsAndSummaryZh:
      '摩利支（Mārīcī）意为「阳焰、威光」，常行日月之前，无人能见、无人能捉、无人能害、无人能欺诳、无人能债其财物。此咒为行路、辟难、隐身护命之殊胜总持。',
    recitationTipsZh:
      '本条同时关联了 CBETA T21n1257 XML 原典与 GRETIL 尼泊尔梵本 `maricdhu.htm`，梵本中保留了「rakṣa rakṣa māṃ sarvasattvāṃś ca svāhā」之完整护身祈愿句。',
    provenance: {
      sourceType: 'CBETA+GRETIL',
      cbetaId: 'T21n1257',
      cbetaRawXmlUrl: cbetaT21n1257?.rawXmlUrl,
      cbetaOnlineUrl: cbetaT21n1257?.cbetaOnlineUrl,
      gretilFile: 'maricdhu.htm',
      gretilRawUrl: gretilMarici?.rawUrl,
      editionCitation:
        `${gretilMarici?.editionInfo || 'Āryamārīcīnāmadhāraṇī (BST 17, 1961)'} & CBETA T21n1257.`,
      manuscriptNotesZh:
        '双源实证：同时对勘自哥廷根大学 GRETIL 下载之梵文《Āryamārīcīnāmadhāraṇī》（maricdhu.htm）与 CBETA T21n1257 XML。',
      rawSnippet: gretilMarici?.extractedMantras.join('\n\n'),
    },
    verses: [
      {
        id: 'marici-v1',
        index: 1,
        iast: 'tadyathā — oṃ padākramaṇi | arkamasi markamasi | cīvaramasi mahācīvaramasi | antardhānamasi svāhā ||',
        classicalTranslitZh: '怛侄他 — 唵 钵那讫啰摩抳 | 遏迦摩私 末迦摩私 | 支嚩啰摩私 摩诃支嚩啰摩私 | 安怛驮曩摩私 娑嚩诃 ||',
        modernPhoneticZh: '达地呀他 | 嗡 巴达克啦玛尼 | 阿尔嘎玛悉 玛尔嘎玛悉 | 吉瓦啦玛悉 玛哈-吉瓦啦玛悉 | 安达尔达拿玛悉 斯瓦哈',
        meaningZh: '即说咒曰：嗡！疾步前行于日月之前者啊！汝是日光威德、汝是迅疾光明、汝是护法衣、汝是大法衣、汝是隐形不可得之大威神力！圆满成就！',
        meaningEn:
          'Namely: Oṃ! O Strider before the Sun! You are solar radiance, you are swift light, you are the protective robe, you are the great robe, you are the power of invisibility! Svāhā!',
        words: [
          {
            iast: 'padākramaṇi',
            stem: 'pada-ākramaṇī',
            grammar: 'Voc. sg. f.',
            transliterationZh: '钵那讫啰摩抳',
            meaningZh: '跨步疾行于前之天母啊',
            meaningEn: 'O She who strides forward',
          },
          {
            iast: 'arkamasi',
            stem: 'arka + asi',
            grammar: '2nd sg. pres. as',
            transliterationZh: '遏迦摩私',
            meaningZh: '汝即是太阳威光',
            meaningEn: 'you are the sun/radiance',
          },
          {
            iast: 'antardhānamasi',
            stem: 'antardhāna + asi',
            grammar: '2nd sg. pres. as',
            transliterationZh: '安怛驮曩摩私',
            meaningZh: '汝即是隐身无碍大威神力',
            meaningEn: 'you are invisibility/concealment from harm',
          },
        ],
      },
      {
        id: 'marici-v2',
        index: 2,
        iast: 'oṃ mārīcyai māṃ hūṃ hūṃ phaṭ phaṭ svāhā ||',
        classicalTranslitZh: '唵 摩哩支曳 𤚥 吽 吽 泮吒 泮吒 娑嚩诃 ||',
        modernPhoneticZh: '嗡 玛哩奇崖 芒 吽 吽 帕特 帕特 斯瓦哈',
        meaningZh: '嗡！归命摩利支天菩萨！护我（𤚥）！吽吽！摧伏一切冤害（泮吒泮吒）！吉祥成就！',
        meaningEn: 'Oṃ! To Mārīcī! Protect me (Māṃ)! Hūṃ Hūṃ Phaṭ Phaṭ Svāhā!',
        words: [
          {
            iast: 'mārīcyai',
            stem: 'mārīcī',
            grammar: 'Dat. sg. f.',
            transliterationZh: '摩哩支曳',
            meaningZh: '向摩利支天菩萨致敬',
            meaningEn: 'to Noble Mārīcī',
          },
          {
            iast: 'māṃ',
            stem: 'mad',
            grammar: 'Acc. sg. / Bīja',
            transliterationZh: '𤚥',
            meaningZh: '护念我 / 摩利支天根本种子字',
            meaningEn: 'me / seed syllable Māṃ',
          },
        ],
      },
    ],
  },
  {
    id: 'vajravidarana-dharani',
    titleZh: '佛说金刚摧碎陀罗尼（梵本校勘）',
    titleSanskritIast: 'Vajravidāraṇā-nāma-dhāraṇī',
    titleEnglish: 'Diamond-Shattering Vajravidāraṇā Purification Dhāraṇī',
    categoryId: 'vidyarajas-protectors',
    taishoNo: 'T20n1416 / GRETIL vjviddhu',
    translatorZh: '（宋）慈贤 译 · 梵本《Vajravidāraṇā-nāma-dhāraṇī》（GRETIL vjviddhu.htm）对勘',
    sutraSourceZh: '《佛说金刚摧碎陀罗尼》(T20n1416) / GRETIL vjviddhu.htm',
    deityZh: '摧破金刚 / 金刚手菩萨 (Vajravidāraṇa / Vajrapāṇi)',
    meritsAndSummaryZh:
      '金刚手菩萨于金刚三摩地中宣说，如金刚杵能摧碎一切山岳恶业、疫病、诅咒与不祥，为密乘最重要之沐浴净障陀罗尼。',
    recitationTipsZh:
      '梵本中「hana hana（击碎）、daha daha（焚烧）、paca paca（成熟净治）、matha matha（搅拌摧伏）、vidhvaṃsaya（彻底粉碎）」一气呵成，极具金刚部声韵力量。',
    provenance: {
      sourceType: 'GRETIL/DSBC',
      cbetaId: 'T20n1416',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T20n1416',
      gretilFile: 'vjviddhu.htm',
      gretilRawUrl: gretilVajravidarana?.rawUrl,
      editionCitation:
        gretilVajravidarana?.editionInfo ||
        'Vajravidāraṇā-nāma-dhāraṇī (Vaidya, Buddhist Sanskrit Texts 17, Darbhanga 1961, p. 165).',
      manuscriptNotesZh:
        '直接采自 GRETIL 下载之《Vajravidāraṇā-nāma-dhāraṇī》（vjviddhu.htm）梵本全文。',
      rawSnippet: gretilVajravidarana?.extractedMantras.join('\n\n'),
    },
    verses: [
      {
        id: 'vajravid-v1',
        index: 1,
        iast: 'namaścaṇḍavajrapāṇaye mahāyakṣasenāpataye | tadyathā — oṃ truṭa truṭa troṭaya troṭaya | sphuṭa sphuṭa sphoṭaya sphoṭaya | ghūrṇa ghūrṇa ghūrṇāpaya ghūrṇāpaya |',
        classicalTranslitZh: '曩莫室战拏嚩日啰波拏曳 摩诃药叉细曩钵多曳 | 怛侄他 — 唵 咄噜吒 咄噜吒 咄嚧吒耶 咄嚧吒耶 | 娑普吒 娑普吒 娑破吒耶 娑破吒耶 | 具哩拏 具哩拏 具哩拏跛耶 具哩拏跛耶 |',
        modernPhoneticZh: '拿玛什詹达瓦吉啦巴拿耶 玛哈-呀克沙-塞拿巴达耶 | 达地呀他 | 嗡 特鲁达 特鲁达 特洛达呀 特洛达呀 | 斯普达 斯普达 斯坡达呀 斯坡达呀 | 古尔拿 古尔拿 古尔拿巴呀 古尔拿巴呀',
        meaningZh: '归命暴恶威猛执金刚手菩萨、大药叉军主！即说咒曰：嗡！断除、断除，令彼折断！破裂、破裂，令彼粉碎！旋动、旋动，令诸魔障震动瓦解！',
        meaningEn:
          'Homage to Fierce Vajrapāṇi, Great Commander of the Yakṣa hosts! Namely: Oṃ! Break, break, cause to break! Burst, burst, cause to burst! Whirl, whirl, cause to whirl away!',
        words: [
          {
            iast: 'caṇḍavajrapāṇaye',
            stem: 'caṇḍa-vajrapāṇi',
            grammar: 'Dat. sg. m.',
            transliterationZh: '战拏嚩日啰波拏曳',
            meaningZh: '向威猛暴恶执金刚手菩萨',
            meaningEn: 'to Fierce Vajrapāṇi',
          },
          {
            iast: 'truṭa truṭa troṭaya troṭaya',
            stem: '√truṭ (intrans. & caus.)',
            grammar: 'Impv. 2nd sg.',
            transliterationZh: '咄噜吒 咄嚧吒耶',
            meaningZh: '断裂、令折断（一切恶业系缚）',
            meaningEn: 'break, cause to snap',
          },
          {
            iast: 'sphuṭa sphuṭa sphoṭaya sphoṭaya',
            stem: '√sphuṭ (intrans. & caus.)',
            grammar: 'Impv. 2nd sg.',
            transliterationZh: '娑普吒 娑破吒耶',
            meaningZh: '炸裂、令彻底粉碎',
            meaningEn: 'burst, cause to shatter',
          },
        ],
      },
      {
        id: 'vajravid-v2',
        index: 2,
        iast: 'sarvasattvāni bodhaya bodhaya | saṃbodhaya saṃbodhaya | bhrama bhrama saṃbhramaya saṃbhramaya | sarvabhūtāni kuṭṭa kuṭṭa saṃkuṭṭaya saṃkuṭṭaya | sarvaśatrūn ghaṭa ghaṭa saṃghaṭaya saṃghaṭaya | sarvavidyāvajravajriṇi | vajraratnavajriṇi | vajratejovajriṇi | vajramālā-vajriṇi | vajrajihvāvajriṇi | vajrāṅkuśavajriṇi | vajrakrodhavajriṇi | vajradharavajriṇi | hūṃ hūṃ hūṃ phaṭ phaṭ phaṭ svāhā ||',
        classicalTranslitZh: '萨嚩萨怛嚩你 冒驮耶 冒驮耶 | 三冒驮耶 三冒驮耶 | 勃啰摩 勃啰摩 三勃啰摩耶 | 萨嚩部多你 矩吒 矩吒 三矩吒耶 | 萨嚩设咄嚧 伽吒 伽吒 三伽吒耶 | 萨嚩尾你也嚩日啰嚩日哩抳 ... 吽 吽 吽 泮吒 泮吒 泮吒 娑嚩诃 ||',
        modernPhoneticZh: '萨尔瓦-萨特瓦尼 博达呀 博达呀 | 桑博达呀 桑博达呀 | 布啦玛 布啦玛 桑布啦玛呀 桑布啦玛呀 | 萨尔瓦-布达尼 古达 古达 桑古达呀 桑古达呀 | 萨尔瓦沙特伦 嘎达 嘎达 桑嘎达呀 桑嘎达呀 | 萨尔瓦-维地呀瓦吉啦瓦吉哩尼 | 瓦吉啦-啦特拿-瓦吉哩尼 | 瓦吉啦-帝久-瓦吉哩尼 | 瓦吉啦玛啦-瓦吉哩尼 | 瓦吉啦-吉赫瓦瓦吉哩尼 | 瓦吉朗古沙瓦吉哩尼 | 瓦吉啦-克洛达瓦吉哩尼 | 瓦吉啦-达啦瓦吉哩尼 | 吽 吽 吽 帕特 帕特 帕特 斯瓦哈',
        meaningZh: '令一切有情觉悟、正等觉悟！摧伏一切鬼魅冤敌！一切明咒金刚母、金刚宝母、金刚威光母、金刚鬘母、金刚舌母、金刚钩母、金刚忿怒母、持金刚母！吽吽吽！泮吒泮吒泮吒！娑婆诃！',
        meaningEn:
          'Awaken, fully awaken all beings! Crush all hostile forces! O Vajra of all Vidyās, O Vajra-Jewel, O Vajra-Radiance, O Vajra-Garland, O Vajra-Holder! Hūṃ Hūṃ Hūṃ Phaṭ Phaṭ Phaṭ Svāhā!',
        words: [
          {
            iast: 'bodhaya saṃbodhaya',
            stem: '√budh (caus.)',
            grammar: 'Impv. 2nd sg.',
            transliterationZh: '冒驮耶 三冒驮耶',
            meaningZh: '令觉悟、令正等觉悟',
            meaningEn: 'awaken, fully enlighten',
          },
          {
            iast: 'hūṃ hūṃ hūṃ phaṭ phaṭ phaṭ',
            stem: 'tri-hūṃ-phaṭ',
            grammar: 'Vajra Mantra Seal',
            transliterationZh: '吽吽吽 泮吒泮吒泮吒',
            meaningZh: '三身金刚威震、摧破三毒三障',
            meaningEn: 'triple Hūṃ and triple Phaṭ destroying all obstacles',
          },
        ],
      },
    ],
  },
  {
    id: 'vasudhara-dharani',
    titleZh: '佛说圣持世菩萨（财源天母）陀罗尼（梵本校勘）',
    titleSanskritIast: 'Ārya-Vasudhārā-dhāraṇī-mantra',
    titleEnglish: 'Noble Vasudhārā (Stream of Gems) Prosperity & Wisdom Dhāraṇī',
    categoryId: 'vidyarajas-protectors',
    taishoNo: 'T20n1162 / GRETIL vadhdhdu',
    translatorZh: '（唐）玄奘 译《佛说持世陀罗尼经》/（宋）法天 译 · 梵本《Vasudhārādhāraṇī》（GRETIL vadhdhdu.htm）对勘',
    sutraSourceZh: '《佛说持世陀罗尼经》(T20n1162) / GRETIL vadhdhdu.htm',
    deityZh: '持世菩萨 / 财源天母 (Ārya-Vasudhārā)',
    meritsAndSummaryZh:
      'Vasudhārā 意为「持世、财流、宝藏之流」。佛为憍萨罗国苏达多长者宣说，能令修行者远离贫匮饥馑，世出世间谷麦财宝与法财智慧相续不断。',
    recitationTipsZh:
      '梵本中「oṃ śrīvasudhārāratnanidhānakṣetri svāhā」直接呼召「吉祥持世宝藏刹土之圣母」，「vasudhe svāhā」为其最简心咒。',
    provenance: {
      sourceType: 'GRETIL/DSBC',
      cbetaId: 'T20n1162',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T20n1162',
      gretilFile: 'vadhdhdu.htm',
      gretilRawUrl: gretilVasudhara?.rawUrl,
      editionCitation:
        gretilVasudhara?.editionInfo ||
        'Vasudhārādhāraṇī (Vaidya, Buddhist Sanskrit Texts 17, Darbhanga 1961).',
      manuscriptNotesZh:
        '直接关联自 GRETIL 下载之《Vasudhārādhāraṇī》（vadhdhdu.htm）梵文校勘本。',
      rawSnippet: gretilVasudhara?.extractedMantras.slice(0, 3).join('\n\n'),
    },
    verses: [
      {
        id: 'vasudhara-v1',
        index: 1,
        iast: 'namo ratnatrayāya | oṃ vasudhariṇi mahāvasuvṛṣṭinipātini svāhā ||',
        classicalTranslitZh: '曩谟 啰怛曩怛啰夜耶 | 唵 嚩苏驮哩抳 摩诃嚩苏尾哩瑟置你波底你 娑嚩诃 ||',
        modernPhoneticZh: '拿摩 啦特拿-特啦呀呀 | 嗡 瓦苏达哩尼 玛哈-瓦苏维哩什蒂尼巴帝尼 斯瓦哈',
        meaningZh: '归命三宝！嗡！持世宝藏母、降下大宝雨之圣母啊，圆满成就！',
        meaningEn:
          'Homage to the Three Jewels! Oṃ! O Holder of Treasure, O She who showers down a great rain of wealth and merit, Svāhā!',
        words: [
          {
            iast: 'vasudhariṇi',
            stem: 'vasu-dhariṇī',
            grammar: 'Voc. sg. f.',
            transliterationZh: '嚩苏驮哩抳',
            meaningZh: '执持财宝与大地者啊',
            meaningEn: 'O Holder of Wealth/Earth',
          },
          {
            iast: 'mahāvasuvṛṣṭinipātini',
            stem: 'mahā-vasu-vṛṣṭi-nipātinī',
            grammar: 'Voc. sg. f.',
            transliterationZh: '摩诃嚩苏尾哩瑟置你波底你',
            meaningZh: '普降大财宝甘露雨之天母啊',
            meaningEn: 'O She who causes a great rain of treasure to fall',
          },
        ],
      },
      {
        id: 'vasudhara-v2',
        index: 2,
        iast: 'oṃ śrīvasudhārāratnanidhānakṣetri svāhā | oṃ śrīvasumukhi svāhā | oṃ vasudhe svāhā ||',
        classicalTranslitZh: '唵 室哩嚩苏驮啰啰怛曩你驮曩乞晒怛哩 娑嚩诃 | 唵 室哩嚩苏穆企 娑嚩诃 | 唵 嚩苏第 娑嚩诃 ||',
        modernPhoneticZh: '嗡 什哩瓦苏达啦啦特拿尼达拿克晒特哩 斯瓦哈 | 嗡 什哩瓦苏穆奇 斯瓦哈 | 嗡 瓦苏叠 斯瓦哈',
        meaningZh: '嗡！吉祥持世宝藏刹土圣母，圆满成就！嗡！吉祥宝相面门母，圆满成就！嗡！持世圣母啊，圆满成就！',
        meaningEn:
          'Oṃ! O Sacred Field of the Jewel-Treasury of Glorious Vasudhārā, Svāhā! Oṃ O Glorious Treasure-Faced One, Svāhā! Oṃ O Vasudhā, Svāhā!',
        words: [
          {
            iast: 'śrīvasumukhi',
            stem: 'śrī-vasu-mukhī',
            grammar: 'Voc. sg. f.',
            transliterationZh: '室哩嚩苏穆企',
            meaningZh: '吉祥宝藏面门圣母啊',
            meaningEn: 'O Glorious Treasure-Faced One',
          },
          {
            iast: 'vasudhe',
            stem: 'vasudhā',
            grammar: 'Voc. sg. f.',
            transliterationZh: '嚩苏第',
            meaningZh: '持世财源天母啊',
            meaningEn: 'O Vasudhā',
          },
        ],
      },
    ],
  },

  // ============================================================================
  // 般若与经典总持门 (prajna-sutra-hrdaya)
  // ============================================================================
  {
    id: 'prajnaparamita-hrdaya-mantra',
    titleZh: '般若波罗蜜多心经·大神咒大明咒（梵汉双校本）',
    titleSanskritIast: 'Prajñāpāramitā-hṛdaya-sūtra-mahāmantra',
    titleEnglish: 'Heart Sūtra Great Mantra of Transcendent Wisdom (Gate Gate Pāragate)',
    categoryId: 'prajna-sutra-hrdaya',
    taishoNo: 'T08n0251 / GRETIL prajnhsu',
    translatorZh: '（唐）玄奘 译 · 爱德华·孔泽（Edward Conze 1967）梵本《Prajñāpāramitāhṛdayasūtra》与法隆寺贝叶本对勘',
    sutraSourceZh: '《般若波罗蜜多心经》(T08n0251) / GRETIL prajnhsu.htm',
    deityZh: '般若佛母 (Bhagavatī-Prajñāpāramitā) & 观自在菩萨',
    meritsAndSummaryZh:
      '三世诸佛依般若波罗蜜多故，得阿耨多罗三藐三菩提。心经末后宣说此般若总持，被称为「是大神咒（mahāmantra）、是大明咒（mahāvidyāmantra）、是无上咒（anuttaramantra）、是无等等咒（asamasamamantra），能除一切苦，真实不虚」。',
    recitationTipsZh:
      '「gate gate pāragate pārasaṃgate bodhi svāhā」在梵语语法中，「gate、pāragate、pārasaṃgate、bodhi」既可解作阴性单数呼格（呼唤般若佛母：「度越者啊！度至彼岸者啊！带领大众同登彼岸者啊！菩提觉智啊！」），亦可解作处格绝对结构（Locative Absolute）。',
    provenance: {
      sourceType: 'CBETA+GRETIL',
      cbetaId: 'T08n0251',
      cbetaRawXmlUrl: cbetaT08n0251?.rawXmlUrl,
      cbetaOnlineUrl: cbetaT08n0251?.cbetaOnlineUrl,
      gretilFile: 'prajnhsu.htm',
      gretilRawUrl: gretilPrajna?.rawUrl,
      editionCitation:
        `${gretilPrajna?.editionInfo || 'Conze, Thirty Years of Buddhist Studies, 1967, pp. 149-154'} & CBETA T08n0251.`,
      manuscriptNotesZh:
        '双源实证：同时对勘自哥廷根大学 GRETIL 下载之梵文《Prajñāpāramitāhṛdayasūtra》（prajnhsu.htm）与 CBETA 玄奘译本 T08n0251 XML。',
      rawSnippet: gretilPrajna?.extractedMantras.join('\n\n'),
    },
    verses: [
      {
        id: 'prajna-v1',
        index: 1,
        iast: 'tasmāj jñātavyam — prajñāpāramitā mahāmantro mahāvidyāmantro \'nuttaramantro \'samasamamantraḥ, sarvaduḥkhapraśamanaḥ, satyam amithyatvāt | prajñāpāramitāyām ukto mantraḥ |',
        classicalTranslitZh: '故知般若波罗蜜多，是大神咒，是大明咒，是无上咒，是无等等咒，能除一切苦，真实不虚。故说般若波罗蜜多咒，',
        modernPhoneticZh: '达斯玛吉 吉尼亚达维央 | 普啦吉尼亚巴啦米达 玛哈曼特洛 玛哈-维地呀曼特洛 努达啦曼特洛 萨玛萨玛曼特啦赫 萨尔瓦-杜忽卡普啦沙玛拿赫 萨蒂央 阿米提呀特瓦特 | 普啦吉尼亚巴啦米达央 乌克多 曼特啦赫',
        meaningZh: '是故应当了知：般若波罗蜜多是大神咒、是大明咒、是无上咒、是无等等咒，能平息一切苦厄，因不虚妄故真实不虚。于般若波罗蜜多中宣说真言：',
        meaningEn:
          'Therefore one should know: the Perfection of Wisdom is a great mantra, a mantra of great knowledge, the utmost mantra, the peerless mantra, allayer of all suffering, truth because of its non-falsity. By the Perfection of Wisdom has this mantra been uttered:',
        tangNoteZh: '此段为 GRETIL 梵本 `prajnhsu.htm` 与玄奘译文逐句严密对应之总持赞辞。',
        words: [
          {
            iast: 'mahāmantro mahāvidyāmantro',
            stem: 'mahā-mantra / mahā-vidyā-mantra',
            grammar: 'Nom. sg. m.',
            transliterationZh: '摩诃曼怛嚧 摩诃尾你也曼怛嚧',
            meaningZh: '是大神咒、是大明咒',
            meaningEn: 'is the great mantra, the mantra of great knowledge',
          },
          {
            iast: '\'nuttaramantro \'samasamamantraḥ',
            stem: 'anuttara / asamasama',
            grammar: 'Nom. sg. m.',
            transliterationZh: '阿耨多啰曼怛嚧 阿三摩三摩曼怛啰',
            meaningZh: '是无上咒、是无等等咒',
            meaningEn: 'the unsurpassed mantra, the unequalled-equalling mantra',
          },
          {
            iast: 'sarvaduḥkhapraśamanaḥ',
            stem: 'sarva-duḥkha-praśamana',
            grammar: 'Nom. sg. m.',
            transliterationZh: '萨嚩耨佉钵啰舍摩曩',
            meaningZh: '能除一切苦（平息一切苦厄）',
            meaningEn: 'allaying all suffering',
          },
        ],
      },
      {
        id: 'prajna-v2',
        index: 2,
        iast: 'tadyathā — oṃ gate gate pāragate pārasaṃgate bodhi svāhā ||',
        classicalTranslitZh: '即说咒曰：揭谛 揭谛 波罗揭谛 波罗僧揭谛 菩提 萨婆诃 ||',
        modernPhoneticZh: '达地呀他 | 嗡 嘎帝 嘎帝 巴啦嘎帝 巴啦桑嘎帝 博地 斯瓦哈',
        meaningZh: '即说咒曰：嗡！去吧、去吧（度吧、度吧）！度向彼岸吧！大众圆满同登彼岸吧！觉悟菩提，圆满吉祥！',
        meaningEn:
          'Namely: Oṃ! Gone, gone, gone beyond, gone altogether beyond — O Awakening (Bodhi), Svāhā!',
        words: [
          {
            iast: 'tadyathā',
            stem: 'tad-yathā',
            grammar: 'Indecl.',
            transliterationZh: '怛侄他',
            meaningZh: '即说咒曰（所谓）',
            meaningEn: 'namely, thus',
          },
          {
            iast: 'gate gate',
            stem: 'gatā (√gam)',
            grammar: 'Voc./Loc. sg. f.',
            transliterationZh: '揭谛 揭谛',
            meaningZh: '去吧、度越吧（超越人我执与法我执）',
            meaningEn: 'gone, gone / O She who has gone across',
          },
          {
            iast: 'pāragate',
            stem: 'pāra-gatā',
            grammar: 'Voc./Loc. sg. f.',
            transliterationZh: '波罗揭谛',
            meaningZh: '度到生死彼岸吧',
            meaningEn: 'gone to the other shore (Nirvāṇa)',
          },
          {
            iast: 'pārasaṃgate',
            stem: 'pāra-saṃ-gatā',
            grammar: 'Voc./Loc. sg. f.',
            transliterationZh: '波罗僧揭谛',
            meaningZh: '普同大众一切彻底抵达彼岸吧',
            meaningEn: 'gone completely/together to the other shore',
          },
          {
            iast: 'bodhi',
            stem: 'bodhi',
            grammar: 'Voc. sg. f.',
            transliterationZh: '菩提',
            meaningZh: '无上正等觉智啊',
            meaningEn: 'O Awakening / Enlightenment',
          },
          {
            iast: 'svāhā',
            stem: 'svāhā',
            grammar: 'Indecl.',
            transliterationZh: '萨婆诃',
            meaningZh: '速疾圆满成就',
            meaningEn: 'hail, so be it',
          },
        ],
      },
    ],
  },
  {
    id: 'mahamanivipulavimana-dharani',
    titleZh: '广大宝楼阁善住秘密陀罗尼（根本心咒与随心咒）',
    titleSanskritIast: 'Mahāmaṇivipulavimāna-viśvasupratiṣṭhita-guhya-parama-rahasya-kalparāja-dhāraṇī',
    titleEnglish: 'Great Jeweled Pavilion (Mahāmaṇivipulavimāna) Secret Dhāraṇī',
    categoryId: 'prajna-sutra-hrdaya',
    taishoNo: 'T19n1005A / T19n1006',
    translatorZh: '（唐）菩提流志 译《广大宝楼阁善住秘密陀罗尼经》/（唐）不空 译',
    sutraSourceZh: '《广大宝楼阁善住秘密陀罗尼经》(T19n1006)',
    deityZh: '毗卢遮那如来 & 金刚手、宝金刚、莲华金刚三族姓尊',
    meritsAndSummaryZh:
      '汉藏两地共尊之「三大咒王」之一（与佛顶尊胜、大悲咒并列）。经载即使仅闻此咒音、或触此陀罗尼经影及尘风，皆能灭除五无间罪，不堕恶趣，决定成就无上菩提。',
    recitationTipsZh:
      '心咒「oṃ maṇivajre hūṃ」与随心咒「oṃ maṇidhari hūṃ phaṭ」短小精悍，总摄金刚宝楼阁曼荼罗三部秘密。',
    provenance: {
      sourceType: 'CBETA-XML-P5',
      cbetaId: 'T19n1006',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T19n1006',
      gretilFile: 'manivdhu.htm',
      gretilRawUrl: gretilManibhadra?.rawUrl,
      editionCitation:
        'CBETA T19n1006 《广大宝楼阁善住秘密陀罗尼经》（唐·菩提流志译）及 Schopen (1985) 梵文残卷研究.',
      manuscriptNotesZh:
        '依据唐菩提流志译本与学界梵文还原本整理根本咒、心咒与随心咒。',
    },
    verses: [
      {
        id: 'vimana-v1',
        index: 1,
        iast: 'namaḥ sarvatathāgatānām | oṃ vipulagarbhe maṇiprabhe tathāgatanidarśane | maṇi maṇi suprabhe vimale sāgaragambhīre hūṃ hūṃ jvala jvala buddhavilokite guhyādhiṣṭhiteagarbhe svāhā ||',
        classicalTranslitZh: '曩莫 萨嚩怛他蘖多喃 | 唵 尾补攞蘖陛 摩抳钵啰陛 怛他蘖多你捺舍宁 | 摩抳 摩抳 苏钵啰陛 尾摩隶 娑蘖啰俨鼻隶 吽 吽 入嚩攞 入嚩攞 没驮尾路枳帝 具呬夜地瑟耻帝蘖陛 娑嚩诃 ||',
        modernPhoneticZh: '拿玛赫 萨尔瓦-达他嘎达南 | 嗡 维布啦嘎尔贝 玛尼普啦贝 达他嘎达-尼达尔沙内 | 玛尼 玛尼 苏普啦贝 维玛咧 萨嘎啦甘比咧 吽 吽 吉瓦啦 吉瓦啦 布达-维洛给帝 古赫呀地什提帝阿嘎尔贝 斯瓦哈',
        meaningZh: '归命一切如来！嗡！广大胎藏、摩尼宝光、如来示现印啊！摩尼宝、摩尼宝、妙光明、离垢清净、如海甚深！吽、吽！炽然放光、炽然放光！诸佛所垂慈鉴照、秘密加持胎藏啊！圆满成就！',
        meaningEn:
          'Homage to all Tathāgatas! Oṃ! O Vast Womb, Jewel-Radiance, Manifestation of the Tathāgatas! O Gem, O Gem, Wondrous Light, Stainless One, Profound as the Ocean! Hūṃ Hūṃ! Blaze, blaze! O Womb gazed upon by the Buddhas and blessed with secret power! Svāhā!',
        words: [
          {
            iast: 'vipulagarbhe maṇiprabhe',
            stem: 'vipula-garbhā / maṇi-prabhā',
            grammar: 'Voc. sg. f.',
            transliterationZh: '尾补攞蘖陛 摩抳钵啰陛',
            meaningZh: '广大宝藏、摩尼光明尊啊',
            meaningEn: 'O Vast Womb, O Jewel-Light',
          },
          {
            iast: 'sāgaragambhīre',
            stem: 'sāgara-gambhīrā',
            grammar: 'Voc. sg. f.',
            transliterationZh: '娑蘖啰俨鼻隶',
            meaningZh: '犹如大海般甚深难测者啊',
            meaningEn: 'O Profound as the Ocean',
          },
          {
            iast: 'guhyādhiṣṭhiteagarbhe',
            stem: 'guhya-adhiṣṭhita-garbhā',
            grammar: 'Voc. sg. f.',
            transliterationZh: '具呬夜地瑟耻帝蘖陛',
            meaningZh: '秘密神力所加持之胎藏啊',
            meaningEn: 'O Womb consecrated by secret empowerment',
          },
        ],
      },
      {
        id: 'vimana-v2',
        index: 2,
        iast: 'oṃ maṇivajre hūṃ | oṃ maṇidhari hūṃ phaṭ ||',
        classicalTranslitZh: '唵 摩抳嚩日礼 吽（心咒）| 唵 摩抳驮哩 吽 泮吒（随心咒）||',
        modernPhoneticZh: '嗡 玛尼瓦吉咧 吽 | 嗡 玛尼达哩 吽 帕特',
        meaningZh: '【心咒】嗡！摩尼宝金刚！吽！【随心咒】嗡！执持摩尼宝母！吽！摧破业障！',
        meaningEn: '[Heart Mantra] Oṃ! O Jewel-Vajra, Hūṃ! [Near-Heart Mantra] Oṃ! O Jewel-Holder, Hūṃ Phaṭ!',
        words: [
          {
            iast: 'maṇivajre',
            stem: 'maṇi-vajrā',
            grammar: 'Voc. sg. f.',
            transliterationZh: '摩抳嚩日礼',
            meaningZh: '如意宝金刚尊啊（宝楼阁心咒）',
            meaningEn: 'O Jewel-Vajra',
          },
          {
            iast: 'maṇidhari',
            stem: 'maṇi-dharī',
            grammar: 'Voc. sg. f.',
            transliterationZh: '摩抳驮哩',
            meaningZh: '执持摩尼宝珠母啊（宝楼阁随心咒）',
            meaningEn: 'O Holder of the Gem',
          },
        ],
      },
    ],
  },
  {
    id: 'dharmadhatu-paripurana-mantras',
    titleZh: '修习总持三要门：净法界真言 · 三昧耶戒真言 · 补阙圆满真言',
    titleSanskritIast: 'Dharmadhātu-viśuddhi, Samaya & Anūnapūraṇa Mantras',
    titleEnglish: 'Three Essential Liturgical Mantras: Dharmadhātu Purification, Samaya & Completion',
    categoryId: 'prajna-sutra-hrdaya',
    taishoNo: 'T18n0848 / T20n1060',
    translatorZh: '（唐）善无畏 / 不空 译 · 唐密与汉传日常修持总持轨范',
    sutraSourceZh: '《大毗卢遮那成佛神变加持经》及唐密诸部念诵仪轨',
    deityZh: '法界毗卢遮那如来 & 金刚萨埵',
    meritsAndSummaryZh:
      '一切陀罗尼念诵前后必备之三道总持：一、净法界真言（oṃ raṃ）清净器世间与身心；二、三昧耶戒真言（oṃ samayas tvaṃ）令行者与诸佛本誓无二；三、补阙圆满真言（oṃ hūru hūru jaya mukhe svāhā）令所诵咒句即使偶有脱漏亦得百千万倍圆满功德。',
    recitationTipsZh:
      '「oṃ samayas tvaṃ」在梵语语法中直译为「嗡！汝（tvaṃ）即是三昧耶（samayaḥ，本誓平等体）！」，是密乘行人顿入佛位的核心口诀。',
    provenance: {
      sourceType: 'CBETA-XML-P5',
      cbetaId: 'T18n0848',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T18n0848',
      editionCitation:
        'CBETA T18n0848 《大日经》& 唐代不空译诸部念诵仪轨.',
      manuscriptNotesZh:
        '汇编唐密修法仪轨核心三真言，提供精确梵语语法分析。',
    },
    verses: [
      {
        id: 'liturgy-v1',
        index: 1,
        iast: 'oṃ raṃ svāhā | oṃ svabhāvaśuddhāḥ sarvadharmāḥ svabhāvaśuddho \'ham ||',
        classicalTranslitZh: '唵 囕 娑嚩诃（净法界真言）| 唵 娑嚩婆嚩秫驮 萨嚩达磨 娑嚩婆嚩秫度憾（净三业观空真言）||',
        modernPhoneticZh: '嗡 朗 斯瓦哈 | 嗡 斯瓦巴瓦-舒达赫 萨尔瓦达尔玛赫 斯瓦巴瓦-舒多 罕',
        meaningZh: '【净法界与净三业真言】嗡！法界智火清净一切尘垢（囕）！一切诸法自性清净，我亦自性本来清净！',
        meaningEn:
          '[Dharmadhātu & Threefold Purity Mantra] Oṃ Raṃ Svāhā! Oṃ! Naturally pure are all dharmas; naturally pure am I!',
        words: [
          {
            iast: 'raṃ',
            stem: 'raṃ',
            grammar: 'Agni/Dharmadhātu Bīja',
            transliterationZh: '囕',
            meaningZh: '火大与法界清净智火种子字',
            meaningEn: 'seed syllable of purifying wisdom fire',
          },
          {
            iast: 'svabhāvaśuddhāḥ sarvadharmāḥ',
            stem: 'svabhāva-śuddha sarva-dharma',
            grammar: 'Nom. pl. m.',
            transliterationZh: '娑嚩婆嚩秫驮 萨嚩达磨',
            meaningZh: '一切诸法本来性净',
            meaningEn: 'all dharmas are intrinsically pure',
          },
        ],
      },
      {
        id: 'liturgy-v2',
        index: 2,
        iast: 'oṃ samayas tvaṃ | oṃ samaya stvaṃ | oṃ vajrasamaya hūṃ ||',
        classicalTranslitZh: '唵 三昧耶 萨怛鑁（三昧耶戒真言）| 唵 嚩日啰三昧耶 吽 ||',
        modernPhoneticZh: '嗡 萨玛呀斯 特旺 | 嗡 萨玛呀 斯特旺 | 嗡 瓦吉啦-萨玛呀 吽',
        meaningZh: '【三昧耶戒真言】嗡！汝即诸佛平等本誓（三昧耶），身心与诸佛三密无二无别！',
        meaningEn:
          '[Samaya Precept Mantra] Oṃ! You are the Samaya (sacred bond of equality with the Buddhas)! Oṃ Vajrasamaya Hūṃ!',
        words: [
          {
            iast: 'samayas tvaṃ',
            stem: 'samaya + tvam',
            grammar: 'Nom. sg. m. + 2nd sg. pron.',
            transliterationZh: '三昧耶 萨怛鑁',
            meaningZh: '汝即是三昧耶（佛我一如之本誓）',
            meaningEn: 'You are the Samaya (sacred bond/equality)',
          },
        ],
      },
      {
        id: 'liturgy-v3',
        index: 3,
        iast: 'oṃ hūru hūru jaya mukhe svāhā | oṃ dhuru dhuru jaya mukhe svāhā ||',
        classicalTranslitZh: '唵 呼嚧 呼嚧 社曳 穆契 娑嚩诃（补阙真言）| 唵 度噜 度噜 阇耶 穆契 娑嚩诃（补阙圆满真言）||',
        modernPhoneticZh: '嗡 呼鲁 呼鲁 佳呀 穆开 斯瓦哈 | 嗡 杜鲁 杜鲁 佳呀 穆开 斯瓦哈',
        meaningZh: '【补阙圆满真言】嗡！速疾速疾，于最胜解脱法门中令所诵真言圆满无缺，功德增长百千万倍，吉祥成就！',
        meaningEn:
          '[Completion & Rectification Mantra] Oṃ! Swiftly, swiftly, in the gateway of victory, may all recitations be completely fulfilled, Svāhā!',
        words: [
          {
            iast: 'jaya mukhe',
            stem: 'jaya-mukha',
            grammar: 'Loc./Voc. sg.',
            transliterationZh: '社曳 穆契',
            meaningZh: '于最胜尊胜法门中',
            meaningEn: 'in the gateway of victory',
          },
        ],
      },
    ],
  },
];
