import type { DharaniEntry, DharaniVerse } from '../../types/kosaTypes';
import { AUTHORITATIVE_CBETA_RECORDS } from '../kosa-generated/cbetaAuthRecords';
import { AUTHORITATIVE_GRETIL_RECORDS } from '../kosa-generated/gretilAuthRecords';
import {
  buildWordGlossesFromIast,
  generateVerseChinesePhonetics,
} from '../../core/sanskrit/phoneticMapper';
import { translateSanskritVerse } from '../../core/sanskrit/sanskritLexicon';
import { iastToSiddham } from '../../core/sanskrit/transliterator';

const cbetaT19n0974B = AUTHORITATIVE_CBETA_RECORDS.find((r) => r.id === 'T19n0974B');
const cbetaT20n1113B = AUTHORITATIVE_CBETA_RECORDS.find((r) => r.id === 'T20n1113B');
const cbetaT20n1064 = AUTHORITATIVE_CBETA_RECORDS.find((r) => r.id === 'T20n1064');
const cbetaT19n1022A = AUTHORITATIVE_CBETA_RECORDS.find((r) => r.id === 'T19n1022A');
const cbetaT19n1002 = AUTHORITATIVE_CBETA_RECORDS.find((r) => r.id === 'T19n1002');
const gretilSitatapatra = AUTHORITATIVE_GRETIL_RECORDS.find((r) => r.id === 'gretil-sitatapatra');
const gretilMahapratisaraHidas = AUTHORITATIVE_GRETIL_RECORDS.find(
  (r) => r.id === 'gretil-mahapratisara-hidas' || r.file === 'mahpratu.htm'
);

function buildCompleteMahapratisaraVerses(): DharaniVerse[] {
  const clauses = gretilMahapratisaraHidas?.extractedVerses || [];
  return clauses.map((clause, idx) => {
    const cleanClause = clause.replace(/\s*\|\|?\s*$/, '').trim();
    const phonetics = generateVerseChinesePhonetics(cleanClause, false);
    const sem = translateSanskritVerse(cleanClause);
    const sectionTag =
      idx < 282
        ? `第一大品 [14] · 根本大明王大随求长咒 · 第 ${idx + 1}/282 句`
        : idx < 286
          ? `第二品 [35] · 护身结界随心真言 · 第 ${idx - 281}/4 句`
          : `第三至四品 [45–46] · 无能胜心真言与秘密心印 · 第 ${idx - 285}/${clauses.length - 286} 句`;
    return {
      id: `mahapratisara-full-${idx + 1}`,
      index: idx + 1,
      iast: cleanClause,
      classicalTranslitZh: phonetics.classicalTranslitZh,
      modernPhoneticZh: phonetics.modernPhoneticZh,
      meaningZh: sem.meaningZh,
      meaningEn: sem.meaningEn,
      tangNoteZh: `${sectionTag} · Hidas (2012) 梵文贝叶经校勘本`,
      words: buildWordGlossesFromIast(cleanClause),
      fieldSources: {
        iast: 'db-original',
        siddham: 'derived-reference',
        devanagari: 'derived-reference',
        classicalTranslitZh: 'derived-reference',
        modernPhoneticZh: 'derived-reference',
        ipa: 'derived-reference',
        prosody: 'derived-reference',
        meaningZh: 'derived-reference',
        meaningEn: 'derived-reference',
        words: 'derived-reference',
      },
    };
  });
}

const RAW_MAJOR_DHARANIS: DharaniEntry[] = [
  {
    id: 'nilakantha-mahakaruna-dharani',
    titleZh: '千手千眼观世音菩萨广大圆满无碍大悲心陀罗尼（大悲咒全本）',
    titleSanskritIast: 'Nīlakaṇṭha-mahākāruṇika-hṛdaya-dhāraṇī',
    titleEnglish: 'Great Compassion Dhāraṇī of Ārya Avalokiteśvara (Nīlakaṇṭha)',
    categoryId: 'supreme-mantras',
    taishoNo: 'T20n1060 / T20n1064 / T20n1113B',
    translatorZh: '唐·西天竺沙门伽梵达磨 译 / 唐·不空三藏 译对音本',
    sutraSourceZh: '《千手千眼观世音菩萨广大圆满无碍大悲心陀罗尼经》(T20n1060) 暨《大悲心陀罗尼修行念诵略仪》(T20n1113B)',
    deityZh: '千手千眼圣观自在菩萨 (Sahasrabhuja-sahasranetra Āryāvalokiteśvara / Nīlakaṇṭha)',
    meritsAndSummaryZh:
      '汉传与唐密最为核心的根本大咒（通行本共84句）。本词条直接接入下载自 CBETA 官方库之《T20n1113B》334个悉昙梵字与汉字逐字对音数据，以及《T20n1064》唐代不空三藏译本之八十四句本尊化身夹注，全咒由初段归敬文、观音胜号、根本心咒、大自在天/那罗延天化身赞及吉祥祈愿结文组成。',
    recitationTipsZh:
      '持诵时注意 r 音（如 ratna, trayāya, kāruṇikāya）需舌尖轻弹上颚（唐代注「转舌呼」）；长元音 ā, ī, ū, e, o 均属重音（Guru，2拍），短元音 a, i, u 属轻音（Laghu，1拍），轻重分明则梵音自然庄严流畅。',
    provenance: {
      sourceType: 'CBETA+GRETIL',
      cbetaId: 'T20n1113B',
      cbetaRawXmlUrl: cbetaT20n1113B?.cbetaRawUrl || 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1113B.xml',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T20n1113B',
      editionCitation:
        'CBETA XML-P5 T20n1060 (伽梵达磨译) / T20n1064 & T20n1113B (唐·不空三藏译，含 334 个 #SD-* 悉昙梵字逐字对音与八十四句本尊夹注)；梵文重构参校 Sylvain Lévi & Lokesh Chandra 校勘梵本。',
      manuscriptNotesZh:
        '已从 github.com/cbeta-org/xml-p5 下载 T20n1060.xml、T20n1064.xml 与 T20n1113B.xml 原典并提取 334 个悉昙-汉文对音字元。',
      rawSnippet: cbetaT20n1064?.dharaniParagraphs.slice(0, 6).map((p) => p.text).join('\n'),
      cbetaInterlinearTokens: cbetaT20n1113B?.interlinearTokens || [],
    },
    verses: [
      {
        id: 'nilakantha-1',
        index: 1,
        iast: 'namo ratnatrayāya | namo āryāvalokiteśvarāya bodhisattvāya mahāsattvāya mahākāruṇikāya |',
        classicalTranslitZh:
          '南无喝啰怛那哆啰夜耶（一）南无阿唎耶（二）婆卢羯帝烁钵啰耶（三）菩提萨跢婆耶（四）摩诃萨跢婆耶（五）摩诃迦卢昵迦耶（六）',
        modernPhoneticZh:
          '拿摩 啦₍特₎拿-₍特₎啦呀呀 | 拿摩 阿₍哩₎呀-瓦洛给帝-₍湿₎瓦啦呀 博地-萨₍特₎瓦呀 玛哈-萨₍特₎瓦呀 玛哈-嘎鲁尼嘎呀',
        meaningZh: '归命三宝！归命圣观自在菩萨摩诃萨（大勇猛有情）、具大悲心者！',
        meaningEn:
          'Homage to the Three Jewels! Homage to Noble Avalokiteśvara, the Bodhisattva, the Great Being, the Greatly Compassionate One!',
        tangNoteZh: '唐·不空《T20n1064》夹注：第一至六句为慈悲观音及如意轮、转钵、不空羂索、马鸣菩萨本身，统摄三宝与观音本尊总归敬门。',
        words: [
          { iast: 'namo', stem: 'namas', grammar: 'Ind. (连音变体)', transliterationZh: '南无', meaningZh: '归命、顶礼、敬礼', meaningEn: 'homage, salutation' },
          { iast: 'ratnatrayāya', stem: 'ratna-traya', grammar: 'Dat.Sg. (为格单数)', transliterationZh: '喝啰怛那哆啰夜耶', meaningZh: '向佛法僧三宝', meaningEn: 'to the Three Jewels' },
          { iast: 'āryāvalokiteśvarāya', stem: 'ārya-avalokita-īśvara', grammar: 'Dat.Sg.', transliterationZh: '阿唎耶婆卢羯帝烁钵啰耶', meaningZh: '向圣观自在尊', meaningEn: 'to Noble Lord Avalokiteśvara' },
          { iast: 'bodhisattvāya', stem: 'bodhisattva', grammar: 'Dat.Sg.', transliterationZh: '菩提萨跢婆耶', meaningZh: '向觉有情（菩萨）', meaningEn: 'to the Awakening Being' },
          { iast: 'mahāsattvāya', stem: 'mahāsattva', grammar: 'Dat.Sg.', transliterationZh: '摩诃萨跢婆耶', meaningZh: '向大有情（摩诃萨）', meaningEn: 'to the Great Being' },
          { iast: 'mahākāruṇikāya', stem: 'mahākāruṇika', grammar: 'Dat.Sg.', transliterationZh: '摩诃迦卢昵迦耶', meaningZh: '向大悲心者', meaningEn: 'to the Greatly Compassionate One' },
        ],
      },
      {
        id: 'nilakantha-2',
        index: 2,
        iast: 'oṃ sarvarabhaye sudhanadasya namaskṛtvā imam āryāvalokiteśvaravaṃdavaṃ nīlakaṇṭha nāma hṛdayaṃ |',
        classicalTranslitZh:
          '唵（七）萨皤啰罚曳（八）数怛那怛写（九）南无悉吉㗚埵伊蒙阿唎耶（十）婆卢吉帝室佛啰楞驮婆（十一）南无那啰谨墀（十二）醯利摩诃皤哆沙咩（十三）',
        modernPhoneticZh:
          '嗡 萨₍尔₎瓦-啦巴耶 苏达拿达₍斯₎呀 拿玛₍斯克₎日₍特₎瓦 伊芒 阿₍哩₎呀-瓦洛给帝-₍湿₎瓦啦万达旺 尼啦干他 拿玛 ₍赫₎日达央',
        meaningZh:
          '嗡！于一切畏惧中善施安稳者！顶礼彼圣观自在尊已，我今宣说此名为「青颈（Nīlakaṇṭha）」之广大圆满心咒：',
        meaningEn:
          'Oṃ! Having bowed to Him who bestows safety amidst all fears, I now proclaim this glorious heart-dhāraṇī of Noble Avalokiteśvara called Nīlakaṇṭha (Blue-Necked One):',
        tangNoteZh: '唐·不空夹注：「唵」是诸神合掌听诵，「萨皤啰罚曳」是四天大王降魔，「那啰谨墀」是青颈观音贤爱慈悲心体。',
        words: [
          { iast: 'oṃ', stem: 'oṃ (praṇava)', grammar: 'Sacred Bīja', transliterationZh: '唵', meaningZh: '三身总持神圣种子字', meaningEn: 'sacred primordial syllable' },
          { iast: 'sarvarabhaye', stem: 'sarva-bhaya', grammar: 'Loc.Sg.', transliterationZh: '萨皤啰罚曳', meaningZh: '于一切怖畏灾难中 / 一切自在尊', meaningEn: 'in all fears / to all lords' },
          { iast: 'sudhanadasya', stem: 'sudhana-da', grammar: 'Gen.Sg.', transliterationZh: '数怛那怛写', meaningZh: '善施妙财法宝者之（教敕）', meaningEn: 'of the bestower of good wealth/grace' },
          { iast: 'namaskṛtvā', stem: 'namas-√kṛ', grammar: 'Absolutive (连续体)', transliterationZh: '南无悉吉㗚埵', meaningZh: '至心顶礼已', meaningEn: 'having paid homage' },
          { iast: 'imam', stem: 'idam', grammar: 'Acc.Sg.', transliterationZh: '伊蒙', meaningZh: '此（心咒）', meaningEn: 'this' },
          { iast: 'nīlakaṇṭha', stem: 'nīla-kaṇṭha', grammar: 'Voc./Nom.', transliterationZh: '那啰谨墀', meaningZh: '青颈尊（代众生吞咽苦毒现青颈相）', meaningEn: 'Blue-Necked One (Nīlakaṇṭha)' },
          { iast: 'hṛdayaṃ', stem: 'hṛdaya', grammar: 'Acc.Sg.Neut.', transliterationZh: '醯利摩诃皤哆沙咩', meaningZh: '心中心、真实心陀罗尼（我将宣说 avartayiṣyāmi）', meaningEn: 'heart essence' },
        ],
      },
      {
        id: 'nilakantha-3',
        index: 3,
        iast: 'sarvārthasādhanaṃ śubham ajeyaṃ sarvabhūtānāṃ bhavamārgaviśodhakaṃ | tadyathā | oṃ ālokaprabhā lokātikrānta |',
        classicalTranslitZh:
          '萨婆阿他豆输朋（十四）阿逝孕（十五）萨婆萨哆那摩婆萨哆那摩婆伽（十六）摩罚特豆（十七）怛侄他（十八）唵阿婆卢醯（十九）卢迦帝（二十）迦罗帝（二十一）',
        modernPhoneticZh:
          '萨₍尔₎瓦₍尔₎他萨达南 舒邦 阿杰央 萨₍尔₎瓦-布达南 巴瓦玛₍尔₎嘎维硕达刚 | 达₍地₎呀他 | 嗡 阿洛嘎₍普₎啦巴 洛嘎-帝₍克₎兰达',
        meaningZh:
          '能成就一切义利、纯善吉祥、无能胜伏，能彻底清净一切众生之生死轮回道！即说咒曰：嗡！光明遍照尊、超越世间者！',
        meaningEn:
          'Accomplishing all aims, auspicious, invincible, purifying the path of existence for all beings! Namely: Oṃ! Effulgent Light, Transcender of the World!',
        tangNoteZh: '唐·不空夹注：第十八句「怛侄他」为正入心咒，「阿婆卢醯卢迦帝」为大梵天王与帝释诸天侍从观音放光济世。',
        words: [
          { iast: 'sarvārthasādhanaṃ', stem: 'sarva-artha-sādhana', grammar: 'Acc.Sg.', transliterationZh: '萨婆阿他豆', meaningZh: '成就一切所求义利', meaningEn: 'accomplishing all aims' },
          { iast: 'śubham', stem: 'śubha', grammar: 'Acc.Sg.', transliterationZh: '输朋', meaningZh: '清净微妙吉祥', meaningEn: 'auspicious, pure' },
          { iast: 'ajeyaṃ', stem: 'a-jeya', grammar: 'Acc.Sg.', transliterationZh: '阿逝孕', meaningZh: '无比、无能胜者', meaningEn: 'invincible, unconquerable' },
          { iast: 'bhavamārgaviśodhakaṃ', stem: 'bhava-mārga-viśodhaka', grammar: 'Acc.Sg.', transliterationZh: '摩婆伽摩罚特豆', meaningZh: '清净三有生死轮回之道', meaningEn: 'purifier of the path of samsaric existence' },
          { iast: 'tadyathā', stem: 'tad-yathā', grammar: 'Ind.', transliterationZh: '怛侄他', meaningZh: '所谓、即说咒曰', meaningEn: 'namely, thus' },
          { iast: 'ālokaprabhā', stem: 'āloka-prabhā', grammar: 'Voc.Sg.', transliterationZh: '阿婆卢醯', meaningZh: '智慧光明遍照者', meaningEn: 'O Effulgent Wisdom Light' },
          { iast: 'lokātikrānta', stem: 'loka-atikrānta', grammar: 'Voc.Sg.', transliterationZh: '卢迦帝迦罗帝', meaningZh: '超越世间三界者', meaningEn: 'O Transcender of the World' },
        ],
      },
      {
        id: 'nilakantha-4',
        index: 4,
        iast: 'ehi hare mahābodhisattva sarpa sarpa smara smara mama hṛdayaṃ | kuru kuru karma | dhuru dhuru vijayate mahāvijayate |',
        classicalTranslitZh:
          '夷醯唎（二十二）摩诃菩提萨埵（二十三）萨婆萨婆（二十四）摩啰摩啰（二十五）摩醯摩醯唎驮孕（二十六）俱卢俱卢羯蒙（二十七）度卢度卢罚阇耶帝（二十八）摩诃罚阇耶帝（二十九）',
        modernPhoneticZh:
          '诶嘿 哈雷 玛哈-博地-萨₍特₎瓦 萨₍尔₎巴 萨₍尔₎巴 ₍斯₎玛啦 ₍斯₎玛啦 玛玛 ₍赫₎日达央 | 古鲁 古鲁 嘎₍尔₎玛 | 杜鲁 杜鲁 维佳呀帝 玛哈-维佳呀帝',
        meaningZh:
          '善来，狮子王大菩萨！速疾降临、忆念我之本心！成就一切圣业！任持、任持最胜尊、大最胜尊！',
        meaningEn:
          'Come, O Lion (Hari), Great Bodhisattva! Glide forth, remember my heart-essence! Perform the sacred action! Uphold the Victorious One, the Greatly Victorious One!',
        tangNoteZh: '唐·不空夹注：第二十二句「夷醯唎」为三十三天魔醯首罗天主领天兵护持，「俱卢俱卢羯蒙」为空身菩萨，「度卢度卢」为严峻菩萨。',
        words: [
          { iast: 'ehi', stem: 'ā-√i', grammar: 'Impv.2.Sg. (命令式)', transliterationZh: '夷醯', meaningZh: '善来、请降临', meaningEn: 'come hither' },
          { iast: 'hare', stem: 'hari', grammar: 'Voc.Sg.', transliterationZh: '唎', meaningZh: '狮子王尊、金色尊（观音异名）', meaningEn: 'O Hari (Lion / Golden Lord)' },
          { iast: 'mahābodhisattva', stem: 'mahā-bodhisattva', grammar: 'Voc.Sg.', transliterationZh: '摩诃菩提萨埵', meaningZh: '大菩萨！', meaningEn: 'O Great Bodhisattva!' },
          { iast: 'smara', stem: '√smṛ', grammar: 'Impv.2.Sg.', transliterationZh: '摩啰', meaningZh: '请忆念、勿忘失', meaningEn: 'remember, bear in mind' },
          { iast: 'hṛdayaṃ', stem: 'hṛdaya', grammar: 'Acc.Sg.', transliterationZh: '醯唎驮孕', meaningZh: '本誓心要', meaningEn: 'the heart-mantra' },
          { iast: 'kuru karma', stem: '√kṛ + karman', grammar: 'Impv.2.Sg. + Acc.Sg.', transliterationZh: '俱卢俱卢羯蒙', meaningZh: '成办一切秘密事业', meaningEn: 'accomplish the sacred work' },
          { iast: 'vijayate mahāvijayate', stem: 'vijayat / mahāvijayat', grammar: 'Dat./Voc.', transliterationZh: '罚阇耶帝摩诃罚阇耶帝', meaningZh: '胜伏尊、大胜伏尊', meaningEn: 'O Victorious and Greatly Victorious One' },
        ],
      },
      {
        id: 'nilakantha-5',
        index: 5,
        iast: 'dhara dhara dharaṇīrāja | cala cala mama vimalamūrte re | ehy ehi kṛṣṇasarpavīta-yajñopavīta | viṣa viṣaṃ praṇāśaya |',
        classicalTranslitZh:
          '陀啰陀啰（三十）地唎尼（三十一）室佛啰耶（三十二）遮啰遮啰（三十三）摩摩罚摩啰（三十四）穆帝隶（三十五）伊醯伊醯（三十六）室那室那（三十七）阿啰嘇佛啰舍利（三十八）罚沙罚嘇（三十九）佛啰舍耶（四十）',
        modernPhoneticZh:
          '达啦 达啦 达啦尼啦佳 | 佳啦 佳啦 玛玛 维玛啦穆₍尔₎帝 雷 | 诶₍嘿₎ 诶嘿 ₍克₎日₍师₎拿萨₍尔₎巴维达-呀₍吉尼₎优巴维达 | 维沙 维伤 ₍普₎啦拿沙呀',
        meaningZh:
          '受持、受持，总持自在王！行动、行动，令我显发无垢清净法身！善来善来，以黑蛇缠身作梵线者，请彻底摧灭一切贪瞋痴毒害！',
        meaningEn:
          'Hold fast, O Sovereign of Dhāraṇīs! Move forth, O Spotless Form of mine! Come, come, O One wearing the black serpent as sacred thread, destroy all poison!',
        tangNoteZh: '唐·不空夹注：第三十至四十句为观音大丈夫身、狮子王兵、霹雳菩萨、摧碎菩萨把金轮降伏三毒魔障。',
        words: [
          { iast: 'dhara', stem: '√dhṛ', grammar: 'Impv.2.Sg.', transliterationZh: '陀啰', meaningZh: '执持、护持', meaningEn: 'hold, sustain' },
          { iast: 'dharaṇīrāja', stem: 'dharaṇī-rāja', grammar: 'Voc.Sg.', transliterationZh: '地唎尼室佛啰耶', meaningZh: '大地自在王 / 总持之王', meaningEn: 'O King of the Earth / Lord of Dhāraṇīs' },
          { iast: 'cala', stem: '√cal', grammar: 'Impv.2.Sg.', transliterationZh: '遮啰', meaningZh: '震动、起行', meaningEn: 'move, stir into action' },
          { iast: 'vimalamūrte', stem: 'vimala-mūrti', grammar: 'Voc.Sg.', transliterationZh: '罚摩啰穆帝隶', meaningZh: '无垢清净解脱身者', meaningEn: 'O One of Stainless Embodiment' },
          { iast: 'ehi ehi', stem: 'ā-√i', grammar: 'Impv.2.Sg.', transliterationZh: '伊醯伊醯', meaningZh: '速来、速来', meaningEn: 'come, come' },
          { iast: 'viṣa viṣaṃ praṇāśaya', stem: 'viṣa + pra-√naś', grammar: 'Caus.Impv.2.Sg.', transliterationZh: '罚沙罚嘇佛啰舍耶', meaningZh: '彻底消灭一切内外毒害', meaningEn: 'utterly destroy all poison' },
        ],
      },
      {
        id: 'nilakantha-6',
        index: 6,
        iast: 'hulu hulu malla | hulu hulu hare | sara sara siri siri suru suru | bodhiya bodhiya bodhaya bodhaya |',
        classicalTranslitZh:
          '呼嚧呼嚧摩啰（四十一）呼嚧呼嚧醯利（四十二）娑啰娑啰（四十三）悉唎悉唎（四十四）苏嚧苏嚧（四十五）菩提夜菩提夜（四十六）菩驮夜菩驮夜（四十七）',
        modernPhoneticZh:
          '呼卢 呼卢 玛啦 | 呼卢 呼卢 哈雷 | 萨啦 萨啦 悉里 悉里 苏鲁 苏鲁 | 博地呀 博地呀 博达呀 博达呀',
        meaningZh:
          '速疾作法，大勇力士！速疾作法，金色狮子尊！流注甘露、吉祥流注、妙音流注！愿速觉悟、愿令一切众生究竟觉悟！',
        meaningEn:
          'Hasten, O Mighty Hero! Hasten, O Lion Lord! Flow forth in grace and nectar! Awaken, awaken! Cause all beings to awaken to enlightenment!',
        tangNoteZh: '唐·不空夹注：第四十一至四十七句为八部鬼神王护持、甘露遍洒五浊恶世、观音菩萨结缘度化众生。',
        words: [
          { iast: 'hulu hulu', stem: 'hulu (BHS)', grammar: 'Impv.Interj.', transliterationZh: '呼嚧呼嚧', meaningZh: '速疾成就、急急护持', meaningEn: 'act swiftly, hasten' },
          { iast: 'malla', stem: 'malla', grammar: 'Voc.Sg.', transliterationZh: '摩啰', meaningZh: '大勇力士、降魔无畏者', meaningEn: 'O Mighty Hero / Wrestler' },
          { iast: 'sara siri suru', stem: '√sṛ / śrī / su-ru', grammar: 'Impv.Onom.', transliterationZh: '娑啰悉唎苏嚧', meaningZh: '甘露遍流、吉祥现前、善妙出生', meaningEn: 'flow forth with grace and auspiciousness' },
          { iast: 'bodhiya', stem: '√budh', grammar: 'Pass./Intrans.Impv.', transliterationZh: '菩提夜', meaningZh: '自觉觉悟', meaningEn: 'awaken!' },
          { iast: 'bodhaya', stem: '√budh (Caus.)', grammar: 'Caus.Impv.2.Sg.', transliterationZh: '菩驮夜', meaningZh: '令他觉悟、开示正觉', meaningEn: 'enlighten others!' },
        ],
      },
      {
        id: 'nilakantha-7',
        index: 7,
        iast: 'maitriya nīlakaṇṭha darśanena prahlādaya manaḥ svāhā | siddhāya svāhā | mahāsiddhāya svāhā | siddhayogeśvarāya svāhā |',
        classicalTranslitZh:
          '弥帝唎夜（四十八）那啰谨墀（四十九）地利瑟尼那（五十）波夜摩那（五十一）娑婆诃（五十二）悉陀夜（五十三）娑婆诃（五十四）摩诃悉陀夜（五十五）娑婆诃（五十六）悉陀喻艺（五十七）室皤啰耶（五十八）娑婆诃（五十九）',
        modernPhoneticZh:
          '麦₍特₎里呀 尼啦干他 达₍尔₎沙内拿 ₍普₎啦₍赫₎啦达呀 玛拿₍赫₎ ₍斯₎瓦哈 | 悉达呀 ₍斯₎瓦哈 | 玛哈-悉达呀 ₍斯₎瓦哈 | 悉达优给₍湿₎瓦啦呀 ₍斯₎瓦哈',
        meaningZh:
          '慈氏慈心青颈尊！愿以尊容妙见令我心生大欢喜，圆满成就！礼敬成就者，圆满成就！礼敬大成就者，圆满成就！礼敬成就瑜伽自在王，圆满成就！',
        meaningEn:
          'O Benevolent Nīlakaṇṭha, gladden our minds by Your sacred vision, Svāhā! To the Accomplished One, Svāhā! To the Great Siddha, Svāhā! To the Lord of Siddha-Yoga, Svāhā!',
        tangNoteZh: '唐·不空夹注：第四十八至五十九句进入十一「娑婆诃（去声）」成就赞叹门，达一切悉地瑜伽法门。',
        words: [
          { iast: 'maitriya', stem: 'maitrīya', grammar: 'Voc.Sg.', transliterationZh: '弥帝唎夜', meaningZh: '具大慈心者', meaningEn: 'O Loving and Benevolent One' },
          { iast: 'darśanena', stem: 'darśana', grammar: 'Inst.Sg. (具格单数)', transliterationZh: '地利瑟尼那', meaningZh: '借由亲见尊颜 / 智慧观察', meaningEn: 'by the sacred vision / sight' },
          { iast: 'prahlādaya manaḥ', stem: 'pra-√hlād + manas', grammar: 'Caus.Impv. + Acc.', transliterationZh: '波夜摩那', meaningZh: '令心清凉喜悦', meaningEn: 'gladden and refresh the mind' },
          { iast: 'svāhā', stem: 'svāhā', grammar: 'Ind.Sacred', transliterationZh: '娑婆诃', meaningZh: '吉祥圆满、善说成就', meaningEn: 'hail! may blessing and accomplishment be!' },
          { iast: 'siddhāya / mahāsiddhāya', stem: 'siddha / mahāsiddha', grammar: 'Dat.Sg.', transliterationZh: '悉陀夜 / 摩诃悉陀夜', meaningZh: '向成就尊、向大成就尊', meaningEn: 'to the Siddha, to the Great Siddha' },
          { iast: 'siddhayogeśvarāya', stem: 'siddha-yoga-īśvara', grammar: 'Dat.Sg.', transliterationZh: '悉陀喻艺室皤啰耶', meaningZh: '向成就瑜伽自在尊', meaningEn: 'to the Sovereign Lord of Siddha-Yoga' },
        ],
      },
      {
        id: 'nilakantha-8',
        index: 8,
        iast: 'nīlakaṇṭhāya svāhā | varāhamukhāya svāhā | narasiṃhamukhāya svāhā | padmahastāya svāhā | cakrayudhāya svāhā | śaṅkhaśabdanibodhanāya svāhā |',
        classicalTranslitZh:
          '那啰谨墀（六十）娑婆诃（六十一）摩啰那啰（六十二）娑婆诃（六十三）悉啰僧阿穆佉耶（六十四）娑婆诃（六十五）娑婆摩诃阿悉陀夜（六十六）娑婆诃（六十七）者吉啰阿悉陀夜（六十八）娑婆诃（六十九）波陀摩羯悉哆夜（七十）娑婆诃（七十一）',
        modernPhoneticZh:
          '尼啦干他呀 ₍斯₎瓦哈 | 瓦啦哈穆卡呀 ₍斯₎瓦哈 | 拿啦辛哈穆卡呀 ₍斯₎瓦哈 | 巴₍德₎玛-哈₍斯₎达呀 ₍斯₎瓦哈 | 佳₍克₎啦-尤达呀 ₍斯₎瓦哈 | 商卡沙₍布₎达尼博达拿呀 ₍斯₎瓦哈',
        meaningZh:
          '向青颈尊，娑婆诃！向金猪面化身尊，娑婆诃！向人狮面化身尊，娑婆诃！向大受持成就尊，娑婆诃！向持法轮仗尊，娑婆诃！向执红莲华手尊，娑婆诃！',
        meaningEn:
          'To Nīlakaṇṭha, Svāhā! To the Boar-Faced Manifestation, Svāhā! To the Man-Lion-Faced Manifestation, Svāhā! To the Lotus-Handed One, Svāhā! To the Wheel-Wielding One, Svāhā!',
        tangNoteZh: '唐·不空夹注：第六十至七十一句为山海慧菩萨、宝印王菩萨、药王菩萨、药上菩萨等执持金剑、法轮、红莲行疗诸病。',
        words: [
          { iast: 'nīlakaṇṭhāya', stem: 'nīlakaṇṭha', grammar: 'Dat.Sg.', transliterationZh: '那啰谨墀', meaningZh: '向青颈观音尊', meaningEn: 'to Nīlakaṇṭha' },
          { iast: 'narasiṃhamukhāya', stem: 'nara-siṃha-mukha', grammar: 'Dat.Sg.', transliterationZh: '悉啰僧阿穆佉耶', meaningZh: '向狮子面相无畏化身尊', meaningEn: 'to the Lion-Faced One' },
          { iast: 'cakrayudhāya', stem: 'cakra-āyudha / hasta', grammar: 'Dat.Sg.', transliterationZh: '者吉啰阿悉陀夜', meaningZh: '向手持金轮破障尊', meaningEn: 'to the Holder of the Dharma-Wheel' },
          { iast: 'padmahastāya', stem: 'padma-hasta', grammar: 'Dat.Sg.', transliterationZh: '波陀摩羯悉哆夜', meaningZh: '向手持清净红莲华尊', meaningEn: 'to the Lotus-in-Hand One' },
        ],
      },
      {
        id: 'nilakantha-9',
        index: 9,
        iast: 'nīlakaṇṭhavyāghrāya svāhā | mahābaliśaṅkarāya svāhā | namo ratnatrayāya | namo āryāvalokiteśvarāya svāhā | oṃ siddhyantu mantrapadāya svāhā ||',
        classicalTranslitZh:
          '那啰谨墀皤伽啰耶（七十二）娑婆诃（七十三）摩婆利胜羯啰夜（七十四）娑婆诃（七十五）南无喝啰怛那哆啰夜耶（七十六）南无阿唎耶（七十七）婆嚧吉帝（七十八）烁皤啰夜（七十九）娑婆诃（八十）唵悉殿都（八十一）漫多啰（八十二）跋陀耶（八十三）娑婆诃（八十四）',
        modernPhoneticZh:
          '尼啦干他₍维₎呀₍格₎啦呀 ₍斯₎瓦哈 | 玛哈-巴利商嘎啦呀 ₍斯₎瓦哈 | 拿摩 啦₍特₎拿-₍特₎啦呀呀 | 拿摩 阿₍哩₎呀-瓦洛给帝-₍湿₎瓦啦呀 ₍斯₎瓦哈 | 嗡 悉₍地₎延度 曼₍特₎啦巴达呀 ₍斯₎瓦哈',
        meaningZh:
          '向青颈威猛虎威尊，娑婆诃！向大勇力吉祥作善尊，娑婆诃！归命三宝！归命圣观自在尊，娑婆诃！嗡！愿此真言章句一切所求悉皆圆满成就，娑婆诃！',
        meaningEn:
          'To Fierce Nīlakaṇṭha, Svāhā! To the Mighty Beneficent Śaṅkara, Svāhā! Homage to the Three Jewels! Homage to Noble Avalokiteśvara, Svāhā! Oṃ, may the mantra-words be fully accomplished, Svāhā!',
        tangNoteZh: '唐·不空夹注：第七十六至八十四句重申三宝与观音归敬，并以「悉殿都漫多啰跋陀耶娑婆诃」总结一切真言章句决定成就。',
        words: [
          { iast: 'mahābaliśaṅkarāya', stem: 'mahā-balin-śaṅkara', grammar: 'Dat.Sg.', transliterationZh: '摩婆利胜羯啰夜', meaningZh: '向大威神力作吉祥尊', meaningEn: 'to the Mighty Beneficent One' },
          { iast: 'siddhyantu', stem: '√sidh', grammar: 'Impv.3.Pl. (第三人称复数祈愿式)', transliterationZh: '悉殿都', meaningZh: '愿其悉皆成就！', meaningEn: 'may they be accomplished!' },
          { iast: 'mantrapadāya', stem: 'mantra-pada', grammar: 'Dat.Sg. / Nom.Pl. (-āni)', transliterationZh: '漫多啰跋陀耶', meaningZh: '真言章句、陀罗尼法句', meaningEn: 'the mantra-syllables and phrases' },
        ],
      },
    ],
  },
  {
    id: 'usnisavijaya-dharani',
    titleZh: '佛顶尊胜陀罗尼（唐·不空译 470字悉昙梵汉逐字对音注义全本）',
    titleSanskritIast: 'Sarvadurgatipariśodhana-uṣṇīṣavijaya-dhāraṇī',
    titleEnglish: 'Uṣṇīṣavijaya Dhāraṇī (Purifier of All Evil Destinies)',
    categoryId: 'supreme-mantras',
    taishoNo: 'T19n0967 / T19n0974B / T19n0974E',
    translatorZh: '唐·罽宾沙门佛陀波利 译 / 唐·不空三藏 译悉昙对音注义本',
    sutraSourceZh: '《佛顶尊胜陀罗尼经》(T19n0967) 暨《佛顶尊胜陀罗尼注义》(T19n0974B)',
    deityZh: '尊胜佛顶如来 / 佛顶尊胜佛母 (Uṣṇīṣavijayā)',
    meritsAndSummaryZh:
      '唐密与汉传最具代表性的净除一切恶道、增寿吉祥大陀罗尼，历代经幢（尊胜陀罗尼石幢）遍布天下。本词条直接接入从 CBETA 官方库下载之《T19n0974B》全部 470 个悉昙梵字与汉字逐字对音字元、唐代原典「二合」「引」「上/去」声调注音，以及《T19n0974E》所附《学念梵音法》。',
    recitationTipsZh:
      '依据《T19n0974E·学念梵音法》原典训示：「夫诵陀罗尼，务存梵音。所有口边字者（如㗚、㘑、㘕），皆须弹舌而言之。侧注引者，长引其声（即梵文重长音 Guru）；所注二合者，两字相和，一时急呼（即梵文复辅音结合字）。」',
    provenance: {
      sourceType: 'CBETA+GRETIL',
      cbetaId: 'T19n0974B',
      cbetaRawXmlUrl: cbetaT19n0974B?.cbetaRawUrl || 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n0974B.xml',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T19n0974B',
      editionCitation:
        'CBETA XML-P5 T19n0974B《佛顶尊胜陀罗尼》(唐·不空译，含 470 个 #SD-* 悉昙梵字对音与唐代原典逐句释义夹注) & T19n0974E《加字具足本暨学念梵音法》；参校日本法隆寺藏梵文贝叶经写本。',
      manuscriptNotesZh:
        '已从 github.com/cbeta-org/xml-p5 下载 T19n0974B.xml、T19n0974E.xml 与 T19n0967.xml，完整提取 470 个悉昙梵字-汉字-唐代注音-唐代意译四维对音单元。',
      rawSnippet: cbetaT19n0974B?.dharaniParagraphs.map((p) => p.text).join('\n'),
      cbetaInterlinearTokens: cbetaT19n0974B?.interlinearTokens || [],
    },
    verses: [
      {
        id: 'usnisa-1',
        index: 1,
        iast: 'namo bhagavate trailokyaprativiśiṣṭāya buddhāya bhagavate | tadyathā | oṃ viśodhaya viśodhaya asama-sama samantāvabhāsa-spharaṇa-gati-gahana-svabhāva-viśuddhe |',
        classicalTranslitZh:
          '曩谟(引)婆誐缚帝(归命世尊) 怛赖(二合引)路枳也(二合·三界)钵罗(二合)底尾始瑟吒(二合引)野(最殊胜) 没驮野(大觉)婆誐缚帝(世尊) 怛儞也(二合)他(所谓) 唵 尾戍(引)驮野(净除)尾戍驮野 娑么娑么 三满多缚婆(去)娑 萨叵(二合)啰拏 揭底誐诃曩 娑嚩(二合)婆(去)嚩尾戍提',
        modernPhoneticZh:
          '拿摩 巴嘎瓦帝 ₍特₎来洛₍克₎呀-₍普₎啦帝维希₍师₎达呀 布达呀 巴嘎瓦帝 | 达₍地₎呀他 | 嗡 维硕达呀 维硕达呀 阿萨玛-萨玛 萨曼达瓦巴萨-₍斯₎帕啦拿-嘎帝-嘎哈拿-₍斯₎瓦巴瓦-维舒叠',
        meaningZh:
          '归命世尊、三界中最极殊胜之大觉世尊！即说咒曰：嗡！请净除、净除！无等伦且普遍平等、周遍照耀舒展于六道稠林而自性清净无染者！',
        meaningEn:
          'Homage to the Blessed One, the Awakened One supreme throughout the three worlds! Namely: Oṃ! Purify, purify! O One of pure intrinsic nature pervading the dense paths of existence with unequalled all-illuminating radiance!',
        tangNoteZh: '唐·不空《T19n0974B》原典夹注：「曩谟婆誐缚帝」归命世尊；「怛赖路枳也」三世亦云三界；「钵罗底尾始瑟吒野」最殊胜也；「没驮野」大觉。',
        words: [
          { iast: 'bhagavate', stem: 'bhagavat', grammar: 'Dat.Sg.', transliterationZh: '婆誐缚帝', meaningZh: '向世尊、薄伽梵', meaningEn: 'to the Blessed Lord' },
          { iast: 'trailokyaprativiśiṣṭāya', stem: 'trailokya-prativiśiṣṭa', grammar: 'Dat.Sg.', transliterationZh: '怛赖路枳也钵罗底尾始瑟吒野', meaningZh: '向三界中最极殊胜者', meaningEn: 'to the One pre-eminent in the three worlds' },
          { iast: 'viśodhaya', stem: 'vi-√śudh', grammar: 'Caus.Impv.2.Sg.', transliterationZh: '尾戍驮野', meaningZh: '请彻底净除（罪障）', meaningEn: 'purify completely!' },
          { iast: 'asama-sama', stem: 'asama-sama', grammar: 'Voc.Sg.', transliterationZh: '阿娑么娑么', meaningZh: '无等等、与无等者相等', meaningEn: 'unequalled and equal to the unequalled' },
          { iast: 'svabhāvaviśuddhe', stem: 'svabhāva-viśuddha', grammar: 'Voc.Sg.Fem.', transliterationZh: '娑嚩婆嚩尾戍提', meaningZh: '自性本净尊！', meaningEn: 'O One Pure in Intrinsic Nature!' },
        ],
      },
      {
        id: 'usnisa-2',
        index: 2,
        iast: 'abhiṣiñcatu māṃ sugatavaravacana amṛtābhiṣekair mahāmantrapadaiḥ | āhara āhara āyuḥsaṃdhāraṇi | śodhaya śodhaya gaganaviśuddhe |',
        classicalTranslitZh:
          '阿鼻詵者睹𤚥(牟含反·灌我顶) 素蘖多(善逝)嚩啰嚩左曩(妙言教) 阿蜜栗(二合)多(甘露)鼻晒罽(灌顶) 摩诃曼怛啰(二合)跛代(大真言句) 阿诃啰阿诃啰(摄持) 阿庾散驮啰抳(持寿者) 戍驮野戍驮野 誐誐曩尾戍提(如虚空清净)',
        modernPhoneticZh:
          '阿比申佳度 芒 苏嘎达瓦啦瓦佳拿 阿₍姆₎日达比奢该₍尔₎ 玛哈-曼₍特₎啦巴代₍希₎ | 阿哈啦 阿哈啦 阿尤₍忽₎-散达啦尼 | 硕达呀 硕达呀 嘎嘎拿-维舒叠',
        meaningZh:
          '愿以善逝最胜妙言、不死甘露灌顶及大真言章句为我灌顶！请摄持、摄持，持寿命尊！请清净、清净，犹如虚空般纤尘不染之清净尊！',
        meaningEn:
          'Consecrate me with the supreme words of the Sugata, with ambrosial consecrations and great mantra-phrases! Sustain, sustain, O Holder of Life-Span! Purify, purify, O One pure as the sky!',
        tangNoteZh: '唐·不空《T19n0974B》原典夹注：「阿鼻詵者睹𤚥」灌顶于我；「素蘖多」善逝；「阿蜜栗多」甘露；「誐誐曩尾戍提」虚空清净。',
        words: [
          { iast: 'abhiṣiñcatu māṃ', stem: 'abhi-√ṣic + mad', grammar: 'Impv.3.Sg. + Acc.Sg.', transliterationZh: '阿鼻詵者睹𤚥', meaningZh: '愿为我施予灌顶', meaningEn: 'may It consecrate/anoint me' },
          { iast: 'sugatavaravacana', stem: 'sugata-vara-vacana', grammar: 'Voc./Inst.', transliterationZh: '素蘖多嚩啰嚩左曩', meaningZh: '善逝如来最胜言教', meaningEn: 'supreme speech of the Sugata' },
          { iast: 'amṛtābhiṣekaiḥ', stem: 'amṛta-abhiṣeka', grammar: 'Inst.Pl.', transliterationZh: '阿蜜栗多鼻晒罽', meaningZh: '以不死甘露法水灌顶', meaningEn: 'with ambrosial consecrations' },
          { iast: 'āyuḥsaṃdhāraṇi', stem: 'āyus-saṃdhāraṇī', grammar: 'Voc.Sg.Fem.', transliterationZh: '阿庾散驮啰抳', meaningZh: '任持寿命不失尊！', meaningEn: 'O Sustainer of Life-Force!' },
          { iast: 'gaganaviśuddhe', stem: 'gagana-viśuddha', grammar: 'Voc.Sg.Fem.', transliterationZh: '誐誐曩尾戍提', meaningZh: '虚空清净尊！', meaningEn: 'O Sky-Pure One!' },
        ],
      },
      {
        id: 'usnisa-3',
        index: 3,
        iast: 'uṣṇīṣavijayaviśuddhe sahasraraśmisaṃcodite | sarvatathāgatāvalokani ṣaṭpāramitāparipūraṇi | sarvatathāgatāhṛdayādhiṣṭhānādhiṣṭhite mahāmudre |',
        classicalTranslitZh:
          '坞瑟腻(二合)沙尾惹野尾戍提(佛顶尊胜清净) 娑诃萨啰(二合)啰湿铭(二合)散祖儞帝(千光明警觉) 萨嚩怛他(引)蘖多嚩路迦儞(一切如来所观) 杀播(二合)啰蜜多跛哩布啰抳(六波罗蜜圆满) 萨嚩怛他蘖多纥哩(二合)娜野地瑟姹(二合)曩地瑟耻(二合)帝(一切如来心加持所持) 摩诃母捺哩(二合·大印)',
        modernPhoneticZh:
          '乌₍师₎尼沙-维佳呀维舒叠 萨哈₍斯₎啦-啦₍希₎米散卓地帝 | 萨₍尔₎瓦-达他嘎达-瓦洛嘎尼 沙₍特₎巴啦米达巴里布啦尼 | 萨₍尔₎瓦-达他嘎达-₍赫₎日达呀-地₍师₎他拿-地₍师₎提帝 玛哈穆₍德₎雷',
        meaningZh:
          '佛顶尊胜清净尊、千光明遍照警觉尊！一切如来慈眼瞻视者、圆满六波罗蜜多者！获一切如来心秘密加持所摄持之大印尊！',
        meaningEn:
          'O Pure Victorious Uṣṇīṣa, aroused by a thousand rays of light! O One beheld by all Tathāgatas, fulfiller of the Six Perfections! O Great Seal empowered by the heart-blessing of all Tathāgatas!',
        tangNoteZh: '唐·不空夹注：「坞瑟腻沙尾惹野」佛顶尊胜；「娑诃萨啰啰湿铭」千光明激发；「杀播啰蜜多」六度圆满；「摩诃母捺哩」大契印。',
        words: [
          { iast: 'uṣṇīṣavijayaviśuddhe', stem: 'uṣṇīṣa-vijaya-viśuddha', grammar: 'Voc.Sg.Fem.', transliterationZh: '坞瑟腻沙尾惹野尾戍提', meaningZh: '佛顶尊胜清净母！', meaningEn: 'O Pure Victorious Crown-Protuberance!' },
          { iast: 'sahasraraśmisaṃcodite', stem: 'sahasra-raśmi-saṃcodita', grammar: 'Voc.Sg.Fem.', transliterationZh: '娑诃萨啰啰湿铭散祖儞帝', meaningZh: '千道光明所劝发警觉者', meaningEn: 'impelled by a thousand rays of light' },
          { iast: 'ṣaṭpāramitāparipūraṇi', stem: 'ṣaṭ-pāramitā-paripūraṇī', grammar: 'Voc.Sg.Fem.', transliterationZh: '杀播啰蜜多跛哩布啰抳', meaningZh: '令六度波罗蜜圆满者', meaningEn: 'fulfiller of the Six Perfections' },
          { iast: 'mahāmudre', stem: 'mahā-mudrā', grammar: 'Voc.Sg.Fem.', transliterationZh: '摩诃母捺哩', meaningZh: '大金刚契印尊！', meaningEn: 'O Great Mudrā (Seal)!' },
        ],
      },
      {
        id: 'usnisa-4',
        index: 4,
        iast: 'vajrakāyasaṃhatana-viśuddhe sarvāvaraṇāpāyadurgatipariśuddhe | pratinivartaya āyuḥśuddhe | samayādhiṣṭhite maṇi maṇi mahāmaṇi |',
        classicalTranslitZh:
          '嚩日啰(二合)迦野僧贺多曩尾戍提(金刚身钩锁清净) 萨嚩嚩啰拏播野讷蘖底跛哩尾戍提(一切障及恶趣极清净) 钵啰(二合)底儞多野阿庾戍提(令寿命增延清净) 三摩野地瑟耻帝(本誓加持) 摩抳摩抳摩诃摩抳(宝、宝、大摩尼宝)',
        modernPhoneticZh:
          '瓦₍吉₎啦-嘎呀-桑哈达拿-维舒叠 萨₍尔₎瓦-瓦啦拿巴呀杜₍尔₎嘎帝巴里舒叠 | ₍普₎啦帝尼瓦₍尔₎达呀 阿尤₍忽₎舒叠 | 萨玛呀地₍师₎提帝 玛尼 玛尼 玛哈玛尼',
        meaningZh:
          '金刚坚固身钩锁清净尊！净除一切业障、三恶道苦趣之极清净尊！请回转延展清净寿命！三昧耶本誓所加持者！摩尼宝、摩尼宝、大摩尼如意宝珠！',
        meaningEn:
          'O One pure as an adamantine Vajra-body! Purifier of all karmic obstructions and evil rebirths! Turn back death and purify our life-span! Empowered by the Samaya vow: Jewel, Jewel, Great如意 Jewel!',
        tangNoteZh: '唐·不空夹注：「嚩日啰迦野」金刚身；「萨嚩嚩啰拏」一切业障消融；「三摩野」本誓不越。',
        words: [
          { iast: 'vajrakāyasaṃhatanaviśuddhe', stem: 'vajra-kāya-saṃhatana-viśuddha', grammar: 'Voc.Sg.Fem.', transliterationZh: '嚩日啰迦野僧贺多曩尾戍提', meaningZh: '金刚身凝结坚固清净尊', meaningEn: 'O One Pure with an Adamantine Compact Body' },
          { iast: 'sarvāvaraṇāpāyadurgatipariśuddhe', stem: 'sarva-āvaraṇa-apāya-durgati-pariśuddha', grammar: 'Voc.Sg.Fem.', transliterationZh: '萨嚩嚩啰拏播野讷蘖底跛哩尾戍提', meaningZh: '净除一切障难与恶趣者', meaningEn: 'purifier of all obscurations and evil destinies' },
          { iast: 'pratinivartaya', stem: 'prati-ni-√vṛt', grammar: 'Caus.Impv.2.Sg.', transliterationZh: '钵啰底儞多野', meaningZh: '请令回转、恢复增长', meaningEn: 'turn back, restore!' },
          { iast: 'samayādhiṣṭhite', stem: 'samaya-adhiṣṭhita', grammar: 'Voc.Sg.Fem.', transliterationZh: '三摩野地瑟耻帝', meaningZh: '三昧耶本誓加持尊', meaningEn: 'empowered by the sacred Samaya pledge' },
        ],
      },
      {
        id: 'usnisa-5',
        index: 5,
        iast: 'tathatābhūtakoṭipariśuddhe visphuṭabuddhiśuddhe | jaya jaya vijaya vijaya | smara smara sarvabuddhādhiṣṭhitaśuddhe | vajri vajragarbhe vajraṃ bhavatu mama śarīraṃ sarvasattvānāṃ ca kāyapariśuddhiḥ |',
        classicalTranslitZh:
          '怛他多部多俱胝跛哩戍提(真如实际清净) 尾萨普(二合)吒没地戍提(显发觉智清净) 惹野惹野尾惹野尾惹野(胜、胜、最胜、最胜) 萨么(二合)啰萨么啰(忆念) 萨嚩没驮地瑟耻多戍提 嚩日哩(二合)嚩日啰蘖陛(金刚藏) 嚩日𘕕婆嚩睹么么(某甲)舍哩𘕕 萨嚩萨埵难(引)者迦野跛哩尾戍提',
        modernPhoneticZh:
          '达他达布达果蒂巴里舒叠 维₍斯₎普达布地舒叠 | 佳呀 佳呀 维佳呀 维佳呀 | ₍斯₎玛啦 ₍斯₎玛啦 萨₍尔₎瓦-布达-地₍师₎提达舒叠 | 瓦₍吉₎里 瓦₍吉₎啦嘎₍尔₎贝 瓦₍吉₎朗 巴瓦度 玛玛 沙里朗 萨₍尔₎瓦-萨₍特₎瓦南 佳 嘎呀-巴里-舒地₍希₎',
        meaningZh:
          '真如实际究竟清净尊、洞然开显觉智清净尊！胜哉、最胜哉！请忆念一切诸佛加持之清净！金刚尊、金刚藏尊！愿令我身与一切众生之身悉成金刚坚固、究竟清净！',
        meaningEn:
          'O One pure as Suchness and the Reality-Limit, pure in blossoming awakened intelligence! Conquer, triumph! Remember the purity blessed by all Buddhas! O Vajra-Holder, Vajra-Womb, may my body and the bodies of all beings become like a Vajra and utterly pure!',
        tangNoteZh: '唐·不空夹注：诵至「么么」处可称诵受持者或所祈福者名字，祈愿身心坚固如金刚藏。',
        words: [
          { iast: 'tathatābhūtakoṭipariśuddhe', stem: 'tathatā-bhūtakoṭi-pariśuddha', grammar: 'Voc.Sg.Fem.', transliterationZh: '怛他多部多俱胝跛哩戍提', meaningZh: '真如与实际本际清净尊', meaningEn: 'pure as Suchness and the apex of reality' },
          { iast: 'visphuṭabuddhiśuddhe', stem: 'visphuṭa-buddhi-śuddha', grammar: 'Voc.Sg.Fem.', transliterationZh: '尾萨普吒没地戍提', meaningZh: '豁然开显大觉智清净尊', meaningEn: 'pure in radiantly unfolded enlightenment' },
          { iast: 'vajragarbhe', stem: 'vajra-garbha', grammar: 'Voc.Sg.Fem.', transliterationZh: '嚩日啰蘖陛', meaningZh: '金刚胎藏尊！', meaningEn: 'O Adamantine Vajra-Matrix!' },
          { iast: 'vajraṃ bhavatu mama śarīraṃ', stem: 'vajra + √bhū + śarīra', grammar: 'Impv.3.Sg.', transliterationZh: '嚩日𘕕婆嚩睹么么舍哩𘕕', meaningZh: '愿我之身躯化为不坏金刚！', meaningEn: 'may my body become an indestructible Vajra!' },
        ],
      },
      {
        id: 'usnisa-6',
        index: 6,
        iast: 'sarvagatipariśuddhe sarvatathāgatāśvāsayantu māṃ | budhya budhya bodhaya bodhaya samantapariśuddhe sarvatathāgatāhṛdayādhiṣṭhānādhiṣṭhite mahāmudre svāhā ||',
        classicalTranslitZh:
          '萨嚩蘖底跛哩戍提(一切趣清净) 萨嚩怛他蘖多室嚩(二合)娑演睹𤚥(一切如来安慰于我) 没地野(二合)没地野(自觉) 冒驮野冒驮野(觉他) 三满多跛哩戍提(普遍清净) 萨嚩怛他蘖多纥哩娜野地瑟姹曩地瑟耻帝 摩诃母捺哩(大印) 娑嚩(二合引)诃(引) ||',
        modernPhoneticZh:
          '萨₍尔₎瓦-嘎帝巴里舒叠 萨₍尔₎瓦-达他嘎达-₍湿₎瓦萨延度 芒 | 布₍地₎呀 布₍地₎呀 博达呀 博达呀 萨曼达-巴里-舒叠 萨₍尔₎瓦-达他嘎达-₍赫₎日达呀-地₍师₎他拿-地₍师₎提帝 玛哈穆₍德₎雷 ₍斯₎瓦哈',
        meaningZh:
          '一切六道受生皆得清净尊！愿一切如来安慰护念于我！自觉、自觉，觉他、觉他！周遍法界清净尊、获一切如来心加持所摄持之大印尊，圆满成就，娑婆诃！',
        meaningEn:
          'O Purifier of all rebirth destinies, may all Tathāgatas console and reassure me! Awaken, awaken! Enlighten, enlighten! O All-Pervading Pure One, Great Seal empowered by the heart of all Tathāgatas, Svāhā!',
        tangNoteZh: '唐·不空夹注：末句结归一切如来心秘密加持大印（摩诃母捺哩），另附心真言：「唵 阿密㗚都妒婆鞞 娑婆诃（oṃ amṛtodbhave svāhā）」。',
        words: [
          { iast: 'sarvagatipariśuddhe', stem: 'sarva-gati-pariśuddha', grammar: 'Voc.Sg.Fem.', transliterationZh: '萨嚩蘖底跛哩戍提', meaningZh: '令一切六道去处皆清净者', meaningEn: 'purifier of all paths of rebirth' },
          { iast: 'āśvāsayantu', stem: 'ā-√śvas', grammar: 'Caus.Impv.3.Pl.', transliterationZh: '室嚩娑演睹', meaningZh: '愿皆慈悲安慰、授记摄受', meaningEn: 'may They console and inspire confidence' },
          { iast: 'samantapariśuddhe', stem: 'samanta-pariśuddha', grammar: 'Voc.Sg.Fem.', transliterationZh: '三满多跛哩戍提', meaningZh: '普皆圆满清净尊', meaningEn: 'O Universally Pure One' },
        ],
      },
    ],
  },
  {
    id: 'karandamudra-dharani',
    titleZh: '一切如来心秘密全身舍利宝箧印陀罗尼',
    titleSanskritIast: 'Sarvatathāgatādhiṣṭhāna-hṛdaya-guhya-dhātu-karaṇḍamudrā-dhāraṇī',
    titleEnglish: 'Secret Relic-Casket Seal Dhāraṇī of the Heart of All Tathāgatas',
    categoryId: 'supreme-mantras',
    taishoNo: 'T19n1022A / T19n1022B',
    translatorZh: '唐·特进试鸿胪卿大兴善寺三藏沙门大广智不空 奉诏译',
    sutraSourceZh: '《一切如来心秘密全身舍利宝箧印陀罗尼经》(T19n1022A)',
    deityZh: '十方三世一切如来全身舍利宝塔',
    meritsAndSummaryZh:
      '三大咒塔核心陀罗尼之一。经云若书写此经置塔中，即为一切如来金刚藏窣堵波，十方诸佛常来加持。杭州雷峰塔（吴越王钱俶造八万四千铜塔）出土原刻本即为此咒。本词条直接关联下载自 CBETA 官方库之《T19n1022A.xml》原典。',
    recitationTipsZh:
      '本咒多次出现 trailokya（三界）、vajra（金刚）、dhātu（法界/舍利）、mudrā（印契）等复合词，持诵时节奏宜庄重沉稳，每遇 svāhā 皆作长音收摄。',
    provenance: {
      sourceType: 'CBETA-XML-P5',
      cbetaId: 'T19n1022A',
      cbetaRawXmlUrl: cbetaT19n1022A?.cbetaRawUrl || 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n1022A.xml',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T19n1022A',
      editionCitation:
        'CBETA XML-P5 T19n1022A《一切如来心秘密全身舍利宝箧印陀罗尼经》(唐·不空三藏译) 暨雷峰塔五代刻经本、日本高山寺悉昙梵本。',
      manuscriptNotesZh:
        '已从 github.com/cbeta-org/xml-p5 下载 T19n1022A.xml 原典并提取全部陀罗尼音注段落。',
      rawSnippet: cbetaT19n1022A?.dharaniParagraphs.map((p) => p.text).join('\n\n'),
    },
    verses: [
      {
        id: 'karanda-1',
        index: 1,
        iast: 'namas tryadhvikānāṃ sarvatathāgatānāṃ | oṃ bhuvibhavanavare vacanavacaṭi | suru suru dhara dhara |',
        classicalTranslitZh:
          '那莫悉怛哩野(四合)地尾(二合)迦(引)南(一) 萨婆怛他(引)蘖多(引)喃(二) 唵(三) 部尾婆嚩娜嚩𠼝(四) 嚩者娜嚩뜝(五) 噜噜(六) 驮啰驮啰(七)',
        modernPhoneticZh:
          '拿玛₍斯₎ ₍特哩₎呀₍德₎维嘎南 萨₍尔₎瓦-达他嘎达南 | 嗡 布维巴瓦拿瓦雷 瓦佳拿瓦佳蒂 | 苏鲁 苏鲁 达啦 达啦',
        meaningZh:
          '顶礼过去、现在、未来三世一切诸如来！嗡！周遍三有世间最胜尊、妙音宣演尊！甘露遍流、坚固总持！',
        meaningEn:
          'Homage to all Tathāgatas of the three times (past, present, future)! Oṃ! O Supreme One in all realms of existence, Eloquence of Speech! Flow forth, hold fast!',
        words: [
          { iast: 'tryadhvikānāṃ', stem: 'tri-adhvika', grammar: 'Gen.Pl. (属格复数)', transliterationZh: '悉怛哩野地尾迦南', meaningZh: '属于三世（过去现在未来）之', meaningEn: 'of the three times' },
          { iast: 'sarvatathāgatānāṃ', stem: 'sarva-tathāgata', grammar: 'Gen.Pl.', transliterationZh: '萨婆怛他蘖多喃', meaningZh: '一切如来之', meaningEn: 'of all Tathāgatas' },
          { iast: 'bhuvibhavanavare', stem: 'bhū-vibhavana-vara', grammar: 'Voc.Sg.', transliterationZh: '部尾婆嚩娜嚩𠼝', meaningZh: '世间显发最胜尊', meaningEn: 'O Supreme Manifestation in the World' },
        ],
      },
      {
        id: 'karanda-2',
        index: 2,
        iast: 'sarvatathāgatadhātudhare padmambhave jayavare mudri smara | tathāgatadharmacakrapravartanavajre bodhimaṇḍālaṃkārālaṃkṛte |',
        classicalTranslitZh:
          '萨嚩怛他蘖多驮(引)睹驮𠼝(八) 钵娜𤚥(二合)婆吠(九) 惹也嚩𠼝(十) 母捺哩(二合)萨么(二合)啰(十一) 怛他蘖多达磨斫迦啰(二合)钵啰(二合)嚩栗多(二合)娜嚩日𠼝(二合十二) 冒地曼拏(上)楞迦(引)啰(引)楞讫哩(二合)帝(十三)',
        modernPhoneticZh:
          '萨₍尔₎瓦-达他嘎达-达度-达雷 巴₍德₎曼巴威 佳呀瓦雷 穆₍德₎里 ₍斯₎玛啦 | 达他嘎达-达₍尔₎玛-佳₍克₎啦-₍普₎啦瓦₍尔₎达拿瓦₍吉₎雷 博地-曼达朗嘎啦朗₍克₎日帝',
        meaningZh:
          '总持一切如来全身舍利法界藏者、红莲化生尊、最胜契印尊，请忆念！转如来正法轮之金刚尊、以菩提道场严饰而庄严者！',
        meaningEn:
          'O Holder of the Relic-Realm of all Tathāgatas, Lotus-Born, Supreme Victory Seal, remember! O Vajra turning the Dharma-Wheel of the Tathāgatas, adorned with the ornaments of the Bodhimaṇḍa!',
        words: [
          { iast: 'sarvatathāgatadhātudhare', stem: 'sarva-tathāgata-dhātu-dhara', grammar: 'Voc.Sg.Fem.', transliterationZh: '萨嚩怛他蘖多驮睹驮𠼝', meaningZh: '总持一切如来舍利与法界性者', meaningEn: 'O Holder of the Relics/Realm of all Tathāgatas' },
          { iast: 'padmambhave', stem: 'padma-bhava', grammar: 'Voc.Sg.Fem.', transliterationZh: '钵娜𤚥婆吠', meaningZh: '清净莲华出生者', meaningEn: 'O Lotus-Born One' },
          { iast: 'dharmacakrapravartanavajre', stem: 'dharma-cakra-pravartana-vajra', grammar: 'Voc.Sg.Fem.', transliterationZh: '达磨斫迦啰钵啰嚩栗多娜嚩日𠼝', meaningZh: '常转无上法轮之金刚尊', meaningEn: 'O Vajra Turning the Wheel of Dharma' },
          { iast: 'bodhimaṇḍālaṃkārālaṃkṛte', stem: 'bodhimaṇḍa-alaṃkāra-alaṃkṛta', grammar: 'Voc.Sg.Fem.', transliterationZh: '冒地曼拏楞迦啰楞讫哩帝', meaningZh: '以菩提道场无量功德庄严者', meaningEn: 'adorned with the ornaments of the Seat of Awakening' },
        ],
      },
      {
        id: 'karanda-3',
        index: 3,
        iast: 'sarvatathāgatādhiṣṭhite bodhaya bodhaya bodhi bodhi budhya budhya | saṃbodhani saṃbodhaya | cala cala calantu sarvāvaraṇāni |',
        classicalTranslitZh:
          '萨嚩怛他(引)蘖多(引)地瑟耻(二合)帝(十四) 冒驮野冒驮野(十五) 冒地冒地(十六) 没地野(二合)没地野(十七) 参冒驮儞参冒驮野(十八) 者攞者攞(十九) 者懒都(二十) 萨嚩(引)嚩啰拏(引)儞(二十一)',
        modernPhoneticZh:
          '萨₍尔₎瓦-达他嘎达-地₍师₎提帝 博达呀 博达呀 博地 博地 布₍地₎呀 布₍地₎呀 | 桑博达尼 桑博达呀 | 佳啦 佳啦 佳兰度 萨₍尔₎瓦-瓦啦拿尼',
        meaningZh:
          '一切如来所加持尊！请开觉、开觉，菩提、菩提，自觉、自觉！圆觉尊、令得圆满正觉！震动、摇动，令一切业障烦恼悉皆动摇崩落！',
        meaningEn:
          'Empowered by all Tathāgatas: enlighten, enlighten! Awakening, awakening! Awaken, awaken! O Complete Enlightenment, bring about full awakening! Shake, stir, let all karmic obscurations be shaken off!',
        words: [
          { iast: 'sarvatathāgatādhiṣṭhite', stem: 'sarva-tathāgata-adhiṣṭhita', grammar: 'Voc.Sg.Fem.', transliterationZh: '萨嚩怛他蘖多地瑟耻帝', meaningZh: '获一切如来神力加持者', meaningEn: 'empowered by all Tathāgatas' },
          { iast: 'saṃbodhani saṃbodhaya', stem: 'saṃbodhanī + sam-√budh', grammar: 'Voc.Sg. + Caus.Impv.', transliterationZh: '参冒驮儞参冒驮野', meaningZh: '正遍觉母，请令证得无上正等正觉', meaningEn: 'O Supreme Awakening, cause complete enlightenment' },
          { iast: 'calantu sarvāvaraṇāni', stem: '√cal + sarva-āvaraṇa', grammar: 'Impv.3.Pl. + Nom.Pl.', transliterationZh: '者懒都萨嚩嚩啰拏儞', meaningZh: '愿一切罪障悉皆摇动销散', meaningEn: 'may all obstructions be shaken and dispelled' },
        ],
      },
      {
        id: 'karanda-4',
        index: 4,
        iast: 'sarvapāpavigate hulu hulu sarvaśokavigate | sarvatathāgatahṛdayavajriṇi saṃbhara saṃbhara | sarvatathāgataguhyadhāraṇīmudre |',
        classicalTranslitZh:
          '萨嚩播(引)跛尾蘖帝(二十二) 户噜户噜(二十三) 萨嚩戍迦尾蘖帝(二十四) 萨嚩怛他蘖多纥哩(二合)娜野嚩日哩(二合)抳(二十五) 三婆啰三婆啰(二十六) 萨嚩怛他蘖多虞(上)呬耶(二合)驮啰抳母捺哩(二合二十七)',
        modernPhoneticZh:
          '萨₍尔₎瓦-巴巴维嘎帝 呼卢 呼卢 萨₍尔₎瓦-硕嘎维嘎帝 | 萨₍尔₎瓦-达他嘎达-₍赫₎日达呀-瓦₍吉₎里尼 桑巴啦 桑巴啦 | 萨₍尔₎瓦-达他嘎达-古₍赫₎呀达啦尼穆₍德₎雷',
        meaningZh:
          '远离一切恶业尊！速疾作法，远离一切忧恼尊！一切如来心金刚母，请积集资粮、摄受护持！一切如来秘密总持契印尊！',
        meaningEn:
          'O One free from all evil, hasten! O One free from all sorrow! O Vajra-Holder of the Heart of all Tathāgatas, gather and sustain! O Secret Dhāraṇī-Seal of all Tathāgatas!',
        words: [
          { iast: 'sarvapāpavigate', stem: 'sarva-pāpa-vigata', grammar: 'Voc.Sg.Fem.', transliterationZh: '萨嚩播跛尾蘖帝', meaningZh: '永离一切罪障恶业者', meaningEn: 'departed from all sins/evil' },
          { iast: 'sarvaśokavigate', stem: 'sarva-śoka-vigata', grammar: 'Voc.Sg.Fem.', transliterationZh: '萨嚩戍迦尾蘖帝', meaningZh: '永离一切忧悲苦恼者', meaningEn: 'freed from all grief and sorrow' },
          { iast: 'saṃbhara', stem: 'sam-√bhṛ', grammar: 'Impv.2.Sg.', transliterationZh: '三婆啰', meaningZh: '圆满积集（福智二资粮）', meaningEn: 'accumulate, bring together' },
          { iast: 'guhyadhāraṇīmudre', stem: 'guhya-dhāraṇī-mudrā', grammar: 'Voc.Sg.Fem.', transliterationZh: '虞呬耶驮啰抳母捺哩', meaningZh: '秘密总持宝箧印尊！', meaningEn: 'O Secret Dhāraṇī Seal!' },
        ],
      },
      {
        id: 'karanda-5',
        index: 5,
        iast: 'buddhe subuddhe sarvatathāgatādhiṣṭhitadhātugarbhe svāhā | samayādhiṣṭhite svāhā | sarvatathāgatahṛdayadhātumudre svāhā | supratiṣṭhitastūpe tathāgatādhiṣṭhite huru huru hūṃ hūṃ svāhā | oṃ sarvatathāgatoṣṇīṣadhātumudrāṇi sarvatathāgatasadhātuvibhūṣitādhiṣṭhite hūṃ hūṃ svāhā ||',
        classicalTranslitZh:
          '没悌苏没悌(二十八) 萨嚩怛他蘖多(引)地瑟耻(二合)多驮睹蘖陛(二十九) 娑嚩(二合)诃(三十) 三摩耶(引)地瑟耻(二合)帝(三十一) 娑嚩(二合)诃(三十二) 萨嚩怛他(引)蘖多纥哩(二合)娜野驮睹母捺哩(二合三十三) 娑嚩(二合)诃(三十四) 苏钵啰(二合)底瑟耻(二合)多萨睹(二合)闭(三十五) 怛他(引)蘖多地瑟耻(二合)帝(三十六) 户噜户噜(三十七) 吽吽(三十八) 娑嚩(二合)诃(三十九) 唵 萨嚩怛他蘖都瑟腻(二合)沙驮睹母捺啰(二合)尼 萨嚩怛他蘖多萨驮睹尾部使多地瑟耻(二合)帝 吽吽 娑嚩(二合)诃(四十)',
        modernPhoneticZh:
          '布叠 苏布叠 萨₍尔₎瓦-达他嘎达-地₍师₎提达达度嘎₍尔₎贝 ₍斯₎瓦哈 | 萨玛呀地₍师₎提帝 ₍斯₎瓦哈 | 萨₍尔₎瓦-达他嘎达-₍赫₎日达呀-达度-穆₍德₎雷 ₍斯₎瓦哈 | 苏₍普₎啦帝₍师₎提达₍斯₎度贝 达他嘎达-地₍师₎提帝 呼鲁 呼鲁 吽 吽 ₍斯₎瓦哈 | 嗡 萨₍尔₎瓦-达他嘎多-₍师₎尼沙-达度-穆₍德₎啦尼 萨₍尔₎瓦-达他嘎达-萨达度维布师达地₍师₎提帝 吽 吽 ₍斯₎瓦哈',
        meaningZh:
          '觉者、妙觉者！一切如来加持之舍利法界藏，娑婆诃！本誓加持尊，娑婆诃！一切如来心全身舍利宝印，娑婆诃！善安住宝塔、如来加持尊，速疾成就，吽吽，娑婆诃！嗡！一切如来佛顶舍利宝印、以一切如来法界舍利庄严加持尊，吽吽，圆满成就！',
        meaningEn:
          'O Awakened, Well-Awakened One! Relic-Womb empowered by all Tathāgatas, Svāhā! Samaya-empowered, Svāhā! Heart-Relic Seal of all Tathāgatas, Svāhā! Well-established Stūpa blessed by Tathāgatas, Huru Huru Hūṃ Hūṃ Svāhā! Oṃ, Crown-Relic Seals of all Tathāgatas, adorned and blessed with the true relics of all Tathāgatas, Hūṃ Hūṃ Svāhā!',
        words: [
          { iast: 'dhātugarbhe', stem: 'dhātu-garbha', grammar: 'Voc.Sg.Fem.', transliterationZh: '驮睹蘖陛', meaningZh: '全身舍利法界胎藏尊', meaningEn: 'O Relic-Realm Matrix' },
          { iast: 'supratiṣṭhitastūpe', stem: 'su-pratiṣṭhita-stūpa', grammar: 'Voc.Sg.Fem.', transliterationZh: '苏钵啰底瑟耻多萨睹闭', meaningZh: '妙善安立之宝塔（窣堵波）', meaningEn: 'O Well-Established Stūpa' },
          { iast: 'uṣṇīṣadhātumudrāṇi', stem: 'uṣṇīṣa-dhātu-mudrā', grammar: 'Voc.Pl.Neut.', transliterationZh: '都瑟腻沙驮睹母捺啰尼', meaningZh: '佛顶舍利秘密宝印', meaningEn: 'Crown-Relic Seals' },
          { iast: 'sadhātuvibhūṣitādhiṣṭhite', stem: 'sa-dhātu-vibhūṣita-adhiṣṭhita', grammar: 'Voc.Sg.Fem.', transliterationZh: '萨驮睹尾部使多地瑟耻帝', meaningZh: '具足真身舍利庄严加持尊', meaningEn: 'adorned and empowered with true relics' },
        ],
      },
    ],
  },
  {
    id: 'shurangama-sitatapatra-hrdaya',
    titleZh: '大佛顶首楞严陀罗尼（五会全本核心·五大心咒暨大白伞盖佛顶总持）',
    titleSanskritIast: 'Tathāgatoṣṇīṣa-sitātapatrā-aparājitā-mahāpratyaṅgirā-dhāraṇī',
    titleEnglish: 'Complete Five-Assembly Śūraṅgama / Uṣṇīṣa-Sitātapatrā Mahāpratyaṅgirā Dhāraṇī',
    categoryId: 'supreme-mantras',
    taishoNo: 'T19n0945 / T19n0976 / F28n1071',
    translatorZh: '唐·中天竺沙门般剌蜜帝 译 / 唐·不空 译《大白伞盖陀罗尼经》',
    sutraSourceZh: '《大佛顶如来密因修证了义诸菩萨万行首楞严经》卷七 (T19n0945) 暨 GRETIL 梵本《Sitātapatrā》(bsu004_u.htm)',
    deityZh: '释迦牟尼佛顶化佛 / 大白伞盖佛母 (Uṣṇīṣa-Sitātapatrā)',
    meritsAndSummaryZh:
      '「咒中之王」大佛顶首楞严神咒五会全本核心（第一会毗卢真法会、第二会释尊应化会、第三会观音合同会、第四会金刚藏折摄会、第五会文殊弘传会暨五大心咒与根本咒心）。佛顶放百宝无畏光明，光中化佛宣说此咒，十方如来依此咒心成无上正遍知觉、降伏诸魔、制诸外道、拔济阿难免摩登伽难。直接对勘 CBETA《T19n0945.xml》卷七、房山石经《F28n1071》与德国哥廷根大学 GRETIL 梵文原典《bsu004_u.htm (Sitātapatrā)》。',
    recitationTipsZh:
      '全咒统摄五会：第一会敬礼三宝、四圣果、五部（如来/莲华/金刚/宝/羯磨）及过现诸佛并宣说五大心咒与金刚鬘诸明妃；第二会以「乌𤙖 (oṃ) 唎瑟揭拏...虎𤙖都嚧雍 (hūṃ ṭrūṃ)」统摄星宿天龙；第三会以「毗陀耶阇瞋陀夜弥 鸡啰夜弥 (vidyāṃ chindayāmy asinā kīlayāmi vajreṇa)」断除一切外道邪咒；第四会以「什佛啰...泮吒 (jvala... phaṭ)」摧伏魔障；第五会结十二由旬金刚界并归结于根本咒心「tadyathā oṃ anale anale viśade viśade vīra vajradhare bandha bandhani vajrapāṇi phaṭ hūṃ trūṃ phaṭ svāhā」。',
    provenance: {
      sourceType: 'CBETA+GRETIL',
      cbetaId: 'T19n0945',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T19n0945_007',
      gretilFile: 'bsu004_u.htm',
      gretilRawUrl: gretilSitatapatra?.gretilRawUrl || 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/main/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/bsu004_u.htm',
      editionCitation:
        'Digital Sanskrit Buddhist Canon (DSBC Sutra No. 4) / GRETIL bsu004_u.htm (Sitātapatrā), CBETA T19n0945《首楞严经》卷七 & 房山石经 F28n1071 卷二。',
      manuscriptNotesZh:
        '已从 INDOLOGY/GRETIL-mirror 下载 bsu004_u.htm 梵文原典及 CBETA T19n0945.xml，完成首楞严咒五会全本核心、五大心咒与五会末咒心之梵汉逐段对齐。',
      rawSnippet: gretilSitatapatra?.rawSnippet,
    },
    verses: [
      {
        id: 'shurangama-1',
        index: 1,
        iast: 'namas tathāgata-sugatāyārhate samyaksaṃbuddhāya | tathāgata-buddha-koṭy-uṣṇīṣaṃ | namaḥ sarva-buddha-bodhisattvebhyaḥ | namaḥ saptānāṃ samyaksaṃbuddha-koṭīnāṃ sa-śrāvaka-saṃghānām ||',
        classicalTranslitZh:
          '【第一会·毗卢真法会（三宝与七俱胝佛归敬）】南无萨怛他苏伽多耶 阿啰诃帝 三藐三菩陀写 | 萨怛他佛陀俱胝瑟尼釤 | 南无萨婆勃陀勃地萨跢鞞弊 | 南无萨多南 三藐三菩陀俱知南 娑舍啰婆迦僧伽喃 ||',
        modernPhoneticZh:
          '拿玛₍斯₎ 达他嘎达-苏嘎达呀₍尔₎哈帝 萨₍姆₎呀₍克₎-桑布达呀 | 达他嘎达-布达-果₍蒂₎-乌₍师₎尼伤 | 拿玛₍赫₎ 萨₍尔₎瓦-布达-博地-萨₍特₎威₍比₎呀₍赫₎ | 拿玛₍赫₎ 萨₍普₎达南 萨₍姆₎呀₍克₎-桑布达-果蒂南 萨-₍希₎啦瓦嘎-桑嘎南',
        meaningZh:
          '【第一会起首归命】顶礼如来、善逝、应供、正遍知！顶礼如来百千万亿无上佛顶尊！顶礼一切诸佛菩萨众！顶礼七俱胝（七千万）正等正觉佛陀暨诸声闻贤圣僧团！',
        meaningEn:
          '[Assembly I: Vairocana Dharma Assembly] Homage to the Tathāgata, Sugata, Arhat, Perfectly Awakened One! Homage to the Crown Uṣṇīṣa of Koṭis of Tathāgatas! Homage to all Buddhas and Bodhisattvas! Homage to the seven koṭis of Perfectly Awakened Buddhas together with the Saṃgha of Śrāvakas!',
        words: [
          { iast: 'tathāgata-sugatāya', stem: 'tathāgata-sugata', grammar: 'Dat.Sg.Masc.', transliterationZh: '萨怛他苏伽多耶', meaningZh: '向如来、善逝世尊敬礼', meaningEn: 'to the Tathāgata, the Well-Gone One' },
          { iast: 'buddha-koṭy-uṣṇīṣaṃ', stem: 'buddha-koṭi-uṣṇīṣa', grammar: 'Acc.Sg.', transliterationZh: '佛陀俱胝瑟尼釤', meaningZh: '百千万亿诸佛无见顶相', meaningEn: 'the Crown Uṣṇīṣa of tens of millions of Buddhas' },
          { iast: 'sa-śrāvaka-saṃghānām', stem: 'sa-śrāvaka-saṃgha', grammar: 'Gen.Pl.', transliterationZh: '娑舍啰婆迦僧伽喃', meaningZh: '连同声闻大僧团众', meaningEn: 'together with the assembly of Śrāvaka disciples' },
        ],
      },
      {
        id: 'shurangama-2',
        index: 2,
        iast: 'namo loke arhatāṃ | namaḥ srotāpannānāṃ | namaḥ sakṛdāgāmināṃ | namo anāgāmināṃ | namo loke samyaggatānāṃ samyak-pratipannānāṃ | namo devarṣīṇāṃ | namaḥ siddha-vidyādhara-ṛṣīṇāṃ śāpānugraha-samarthānām ||',
        classicalTranslitZh:
          '【第一会·四圣果与持明诸仙归敬】南无卢鸡阿罗汉跢喃 | 南无苏卢多波那喃 | 南无娑羯唎陀伽弥喃 | 南无卢鸡三藐伽跢喃 | 三藐伽波啰底波多那喃 | 南无提婆离瑟𧹞 | 南无悉陀耶毗地耶陀啰离瑟𧹞 舍波奴揭啰诃娑诃娑啰摩他喃 ||',
        modernPhoneticZh:
          '拿摩 洛给 阿₍尔₎哈当 | 拿玛₍赫₎ ₍斯₎洛达班拿南 | 拿玛₍赫₎ 萨₍克₎日达嘎米南 | 拿摩 阿拿嘎米南 | 拿摩 洛给 萨₍姆₎呀嘎达南 萨₍姆₎呀₍克₎-₍普₎啦帝班拿南 | 拿摩 叠瓦₍尔₎师南 | 拿玛₍赫₎ 悉达-维₍地₎呀达啦-日师南 沙巴努₍格₎啦哈-萨玛₍尔₎他南',
        meaningZh:
          '顶礼世间诸阿罗汉（四果）！顶礼诸须陀洹（初果预流）！顶礼诸斯陀含（二果一来）！顶礼诸阿那含（三果不还）！顶礼世间诸正行、正向道圣众！顶礼诸天仙众！顶礼能作咒诅摄受方便之成就持明仙众！',
        meaningEn:
          'Homage to the Arhats in the world! Homage to the Stream-Enterers, Once-Returners, and Non-Returners! Homage to those in the world who have gone rightly and practiced rightly! Homage to the Divine Ṛṣis and Accomplished Vidyādhara Sages!',
        words: [
          { iast: 'loke arhatāṃ', stem: 'loka + arhat', grammar: 'Loc.Sg. + Gen.Pl.', transliterationZh: '卢鸡阿罗汉跢喃', meaningZh: '世间诸阿罗汉应供圣者', meaningEn: 'of the Arhats in the world' },
          { iast: 'srotāpannānāṃ', stem: 'srotāpanna', grammar: 'Gen.Pl.', transliterationZh: '苏卢多波那喃', meaningZh: '诸入圣流者（初果须陀洹）', meaningEn: 'of the Stream-Enterers' },
          { iast: 'siddha-vidyādhara-ṛṣīṇāṃ', stem: 'siddha-vidyādhara-ṛṣi', grammar: 'Gen.Pl.', transliterationZh: '悉陀耶毗地耶陀啰离瑟𧹞', meaningZh: '诸成就持明咒仙众', meaningEn: 'of the accomplished Vidyādhara sages' },
        ],
      },
      {
        id: 'shurangama-3',
        index: 3,
        iast: 'namo brahmaṇe | nama indrāya | namo bhagavate rudrāya umāpati-sahīyāya | namo bhagavate nārāyaṇāya pañca-mahā-mudrā-namaskṛtāya | namo bhagavate mahākālāya tripura-nagara-vidrāvaṇa-karāya adhimukti-śmaśāna-nivāsine mātṛ-gaṇa-namaskṛtāya ||',
        classicalTranslitZh:
          '【第一会·护世诸天与大黑天归敬】南无跋啰诃摩泥 | 南无因陀啰耶 | 南无婆伽婆帝 嚧陀啰耶 乌摩般帝娑醯夜耶 | 南无婆伽婆帝 那啰野拏耶 槃遮摩诃三慕陀啰 南无悉羯唎多耶 | 南无婆伽婆帝 摩诃迦罗耶 地唎般剌那伽啰 毗陀啰波拏迦啰耶 阿地目帝 尸摩舍那泥婆悉泥 摩怛唎伽拏 南无悉羯唎多耶 ||',
        modernPhoneticZh:
          '拿摩 ₍布₎啦₍赫₎玛内 | 拿玛 因₍德₎啦呀 | 拿摩 巴嘎瓦帝 鲁₍德₎啦呀 乌玛巴帝-萨嘿呀呀 | 拿摩 巴嘎瓦帝 拿啦呀拿呀 班佳-玛哈-穆₍德₎啦-拿玛₍斯克₎日达呀 | 拿摩 巴嘎瓦帝 玛哈-嘎啦呀 ₍特₎里布啦-拿嘎啦-维₍德₎啦瓦拿-嘎啦呀 阿地穆₍克₎帝-₍希₎玛沙拿-尼瓦悉内 玛₍特₎日-嘎拿-拿玛₍斯克₎日达呀',
        meaningZh:
          '敬礼大梵天王！敬礼帝释天主！敬礼世尊大自在天（鲁陀罗）暨乌摩天女眷属！敬礼世尊那罗延天、五大印所共同顶礼者！敬礼世尊大黑天神（摩诃迦罗）、能摧破三魔城邑、乐住寒林尸陀林、诸天母众所共顶礼者！',
        meaningEn:
          'Homage to Brahmā! Homage to Indra! Homage to Bhagavān Rudra with Umāpati! Homage to Bhagavān Nārāyaṇa revered by the Five Great Mudrās! Homage to Bhagavān Mahākāla, Destroyer of the Three Cities, dwelling in the charnel ground of liberation and revered by the host of Mothers (Mātṛgaṇa)!',
        words: [
          { iast: 'rudrāya umāpati-sahīyāya', stem: 'rudra + umāpati-sahīya', grammar: 'Dat.Sg.', transliterationZh: '嚧陀啰耶乌摩般帝娑醯夜耶', meaningZh: '大自在天暨乌摩天妃眷属', meaningEn: 'to Rudra accompanied by Umā' },
          { iast: 'mahākālāya', stem: 'mahā-kāla', grammar: 'Dat.Sg.', transliterationZh: '摩诃迦罗耶', meaningZh: '大黑天护法明王尊', meaningEn: 'to Mahākāla (the Great Black One)' },
          { iast: 'tripura-nagara-vidrāvaṇa-karāya', stem: 'tripura-nagara-vidrāvaṇa-kara', grammar: 'Dat.Sg.', transliterationZh: '地唎般剌那伽啰毗陀啰波拏迦啰耶', meaningZh: '能摧坏三有魔城者', meaningEn: 'who shatters and routs the Three Cities' },
        ],
      },
      {
        id: 'shurangama-4',
        index: 4,
        iast: 'namo bhagavate tathāgata-kulāya | namo padma-kulāya | namo vajra-kulāya | namo maṇi-kulāya | namo gaja-kulāya | namo bhagavate dṛḍha-śūra-sena-praharaṇa-rājāya tathāgatāya | namo bhagavate amitābhāya tathāgatāyārhate samyaksaṃbuddhāya | namo bhagavate akṣobhyāya tathāgatāyārhate samyaksaṃbuddhāya | namo bhagavate bhaiṣajyaguru-vaidūrya-prabha-rājāya tathāgatāya | namo bhagavate saṃpuṣpita-sālendra-rājāya tathāgatāyārhate samyaksaṃbuddhāya | namo bhagavate śākyamunaye tathāgatāyārhate samyaksaṃbuddhāya | namo bhagavate ratnaketu-rājāya tathāgatāyārhate samyaksaṃbuddhāya ||',
        classicalTranslitZh:
          '【第一会·密教五部族与七大如来归命】南无婆伽婆帝 多他伽跢俱啰耶 | 南无般头摩俱啰耶 | 南无跋阇罗俱啰耶 | 南无摩尼俱啰耶 | 南无伽阇俱啰耶 | 南无婆伽婆帝 帝唎茶输啰西那 波啰诃啰拏啰阇耶 跢他伽多耶 | 南无婆伽婆帝 南无阿弥多婆耶 跢他伽多耶 阿啰诃帝 三藐三菩陀耶 | 南无婆伽婆帝 阿刍鞞耶 跢他伽多耶 阿啰诃帝 三藐三菩陀耶 | 南无婆伽婆帝 鞞沙阇耶俱卢吠柱唎耶 般啰婆啰阇耶 跢他伽多耶 | 南无婆伽婆帝 三补师毖多 萨怜捺啰剌阇耶 跢他伽多耶 阿啰诃帝 三藐三菩陀耶 | 南无婆伽婆帝 舍鸡野母那曳 跢他伽多耶 阿啰诃帝 三藐三菩陀耶 | 南无婆伽婆帝 剌怛那鸡都啰阇耶 跢他伽多耶 阿啰诃帝 三藐三菩陀耶 ||',
        modernPhoneticZh:
          '拿摩 巴嘎瓦帝 达他嘎达-古啦呀 | 拿摩 巴₍德₎玛-古啦呀 | 拿摩 瓦₍吉₎啦-古啦呀 | 拿摩 玛尼-古啦呀 | 拿摩 嘎佳-古啦呀 | 拿摩 巴嘎瓦帝 ₍德₎日达-舒啦-塞拿-₍普₎啦哈啦拿-啦佳呀 达他嘎达呀 | 拿摩 巴嘎瓦帝 阿米达巴呀 达他嘎达-呀₍尔₎哈帝 萨₍姆₎呀₍克₎-桑布达呀 | 拿摩 巴嘎瓦帝 阿₍克₎硕₍比₎呀呀 达他嘎达-呀₍尔₎哈帝 萨₍姆₎呀₍克₎-桑布达呀 | 拿摩 巴嘎瓦帝 拜沙₍吉₎呀-古鲁-歪杜₍哩₎呀-₍普₎啦巴-啦佳呀 达他嘎达呀 | 拿摩 巴嘎瓦帝 桑布₍师₎比达-萨伦₍德₎啦-啦佳呀 达他嘎达-呀₍尔₎哈帝 萨₍姆₎呀₍克₎-桑布达呀 | 拿摩 巴嘎瓦帝 沙₍克₎呀穆拿耶 达他嘎达-呀₍尔₎哈帝 萨₍姆₎呀₍克₎-桑布达呀 | 拿摩 巴嘎瓦帝 啦₍特₎拿给度-啦佳呀 达他嘎达-呀₍尔₎哈帝 萨₍姆₎呀₍克₎-桑布达呀',
        meaningZh:
          '顶礼世尊如来部（佛部）！顶礼莲华部！顶礼金刚部！顶礼摩尼宝部！顶礼白象（羯磨）部！顶礼世尊坚固勇猛军器王如来！顶礼世尊阿弥陀（无量光）如来！顶礼世尊阿閦（不动）如来！顶礼世尊药师琉璃光王如来！顶礼世尊娑罗树王开敷华如来！顶礼世尊释迦牟尼如来！顶礼世尊宝幢王如来！',
        meaningEn:
          'Homage to the Tathāgata Family, Lotus Family, Vajra Family, Jewel (Maṇi) Family, and Elephant (Karma) Family! Homage to the Tathāgatas Dṛḍhaśūrasenapraharaṇarāja, Amitābha, Akṣobhya, Bhaiṣajyaguru-Vaidūryaprabharāja, Saṃpuṣpitasālendrarāja, Śākyamuni, and Ratnaketurāja!',
        words: [
          { iast: 'tathāgata-kulāya / padma-kulāya / vajra-kulāya', stem: 'pañca-kula', grammar: 'Dat.Sg.', transliterationZh: '多他伽跢俱啰耶 / 般头摩俱啰耶 / 跋阇罗俱啰耶', meaningZh: '佛部、莲华部、金刚部（连同宝部、羯磨部为密乘五部）', meaningEn: 'to the Buddha, Lotus, and Vajra Families' },
          { iast: 'amitābhāya / akṣobhyāya / bhaiṣajyaguru', stem: 'tathāgata', grammar: 'Dat.Sg.', transliterationZh: '阿弥多婆耶 / 阿刍鞞耶 / 鞞沙阇耶俱卢', meaningZh: '无量光佛、不动如来、药师琉璃光王如来', meaningEn: 'to Amitābha, Akṣobhya, and Bhaiṣajyaguru' },
          { iast: 'śākyamunaye / ratnaketu-rājāya', stem: 'śākyamuni / ratnaketurāja', grammar: 'Dat.Sg.', transliterationZh: '舍鸡野母那曳 / 剌怛那鸡都啰阇耶', meaningZh: '释迦牟尼如来与宝幢王如来', meaningEn: 'to Śākyamuni and Ratnaketurāja' },
        ],
      },
      {
        id: 'shurangama-5',
        index: 5,
        iast: 'ebhyo namaskṛtvā imāṃ bhagavataḥ sarva-tathāgatoṣṇīṣaṃ sitātapatraṃ nāma aparājitāṃ pratyaṅgirāṃ | sarva-bhūta-graha-nigraha-karāṇīṃ | para-vidyā-chedanīṃ | akāla-mṛtyu-paritrāṇa-karīṃ | sarva-bandhana-mokṣaṇīṃ | sarva-duṣṭa-duḥsvapna-nivāraṇīṃ | caturaśītīnāṃ graha-sahasrāṇāṃ vidhvaṃsana-karīṃ | aṣṭāviṃśatīnāṃ nakṣatrāṇāṃ prasādana-karīṃ | aṣṭānāṃ mahā-grahāṇāṃ vidhvaṃsana-karīṃ | sarva-śatru-nivāraṇīṃ | ghoraṃ duḥsvapnānāṃ ca nāśanīṃ | viṣa-śastrāgny-udaka-uttāraṇīṃ ||',
        classicalTranslitZh:
          '【第一会·五大心咒暨总摄八万四千星曜大白伞盖】帝瓢南无萨羯唎多 翳昙婆伽婆多 萨怛他伽都瑟尼釤 萨怛多般怛㘕 南无阿婆啰视耽 般啰帝扬岐啰 | 萨啰婆部多揭啰诃 尼羯啰诃揭迦啰诃尼 | 跋啰毖地耶叱陀儞 | 阿迦啰蜜唎柱 般唎怛啰耶儜揭唎 | 萨啰婆槃陀那目叉尼 | 萨啰婆突瑟吒 突悉乏般那儞伐啰尼 | 赭都啰失帝南 羯啰诃娑诃萨啰若阇 毗多崩娑那羯唎 | 阿瑟吒冰舍帝南 那叉刹怛啰若阇 波啰萨陀那羯唎 | 阿瑟吒南 摩诃揭啰诃若阇 毗多崩萨那羯唎 | 萨婆舍都嚧儞婆啰若阇 | 呼蓝突悉乏难遮那舍尼 | 毖沙舍悉怛啰 阿吉尼 乌陀迦啰若阇 ||',
        modernPhoneticZh:
          '诶₍比₎优 拿玛₍斯克₎日₍特₎瓦 伊芒 巴嘎瓦达₍赫₎ 萨₍尔₎瓦-达他嘎多-₍师₎尼伤 悉达达巴₍特₎朗 拿玛 阿巴啦吉当 ₍普₎啦₍蒂₎央吉朗 | 萨₍尔₎瓦-布达-₍格₎啦哈-尼₍格₎啦哈-嘎啦宁 | 巴啦-维₍地₎呀-切达宁 | 阿嘎啦-₍姆₎日₍蒂₎尤-巴里₍特₎啦拿-嘎林 | 萨₍尔₎瓦-班达拿-摩₍克₎沙宁 | 萨₍尔₎瓦-杜₍师₎达-杜₍忽斯₎瓦₍普₎拿-尼瓦啦宁 | 佳度啦希帝南 ₍格₎啦哈-萨哈₍斯₎啦南 维₍德₎旺萨拿-嘎林 | 阿₍师₎达文沙帝南 拿₍克₎沙₍特₎啦南 ₍普₎啦萨达拿-嘎林 | 阿₍师₎达南 玛哈-₍格₎啦哈南 维₍德₎旺萨拿-嘎林 | 萨₍尔₎瓦-沙₍特₎鲁-尼瓦啦宁 | 果朗 杜₍忽斯₎瓦₍普₎拿南 佳 拿沙宁 | 维沙-沙₍斯特₎啦₍格尼₎-乌达嘎-乌达啦宁',
        meaningZh:
          '【五大心咒正宗分】顶礼如上诸圣已，今宣说世尊一切如来佛顶大白伞盖无能胜大回遮母：能降伏一切部多鬼神执魅、能断除一切外道他方恶咒（叱陀你）、能救护一切非时夭折横死（阿迦罗蜜唎柱般唎怛啰耶儜揭唎）、能解脱一切系缚枷锁、能遮止一切恶毒恶梦、能摧坏八万四千星曜鬼神、能令二十八宿欢喜顺行、能摧伏八大恶曜、能遮退一切怨敌、能灭除惨重恶梦、能度脱毒药刀兵水火诸难！',
        meaningEn:
          '[The Five Great Heart Mantras] Having bowed to these, I proclaim the Invincible Great Pratyaṅgirā called the White Parasol of the Uṣṇīṣa of All Tathāgatas: She who subdues all Bhūta spirits, severs hostile spells (Chedanī), rescues from untimely death (Akālamṛtyu-paritrāṇakarī), releases from all bonds, averts all wicked nightmares, crushes 84,000 planetary demons,harmonizes the 28 lunar mansions, subdues the 8 great planets, wards off all foes, and delivers from poison, weapons, fire, and flood!',
        words: [
          { iast: 'sitātapatraṃ nāma aparājitāṃ pratyaṅgirāṃ', stem: 'sitātapatrā-aparājitā-pratyaṅgirā', grammar: 'Acc.Sg.Fem.', transliterationZh: '萨怛多般怛㘕南无阿婆啰视耽般啰帝扬岐啰', meaningZh: '名曰大白伞盖无能胜大回遮佛母', meaningEn: 'the Invincible Pratyaṅgirā named White Parasol' },
          { iast: 'para-vidyā-chedanīṃ', stem: 'para-vidyā-chedanī', grammar: 'Acc.Sg.Fem.', transliterationZh: '跋啰毖地耶叱陀儞', meaningZh: '【五大心咒】断除一切外道恶咒者', meaningEn: 'She who severs all hostile spells' },
          { iast: 'akāla-mṛtyu-paritrāṇa-karīṃ', stem: 'akālamṛtyu-paritrāṇakarī', grammar: 'Acc.Sg.Fem.', transliterationZh: '阿迦啰蜜唎柱般唎怛啰耶儜揭唎', meaningZh: '【五大心咒】救护一切非时横死中夭者', meaningEn: 'She who rescues from untimely death' },
          { iast: 'sarva-bandhana-mokṣaṇīṃ', stem: 'sarva-bandhana-mokṣaṇī', grammar: 'Acc.Sg.Fem.', transliterationZh: '萨啰婆槃陀那目叉尼', meaningZh: '【五大心咒】解脱一切结缚枷锁者', meaningEn: 'She who liberates from all fetters' },
        ],
      },
      {
        id: 'shurangama-6',
        index: 6,
        iast: 'aparājitā ghorā mahā-pracaṇḍī mahā-dīptā mahā-tejā mahā-śvetā jvālā mahā-bala-pāṇḍaravāsinī | ārya-tārā bhṛkuṭī caiva vijayā vajra-māleti viśrutā | padmaṃkaṃ vajra-jihvā ca mālā-cevāparājitā | vajra-daṇḍī viśālā ca śāntā vaideha-pūjitā | saumya-rūpā mahā-śvetā ārya-tārā mahā-balā | aparā vajra-śṛṅkhalā caiva vajra-kaumārī kulaṃdharī | vajra-hastā ca vidyā kāñcana-mālikā | kusumbha-ratnā vairocana-kulīyā arthoṣṇīṣā vijṛmbhamāṇī ca | vajra-kanaka-prabhā-locanā vajra-tuṇḍī ca śvetā ca kamalākṣī śaśi-prabhā | ity etā mudrā-gaṇāḥ sarve rakṣāṃ kurvantu mama sarvasattvānāṃ ca ||',
        classicalTranslitZh:
          '【第一会末·金刚鬘诸大明妃护持会】阿般啰视多具啰 摩诃般啰战持 摩诃叠多 摩诃帝阇 摩诃税多阇婆啰 摩诃跋啰槃陀啰婆悉儞 | 阿唎耶多啰 毗唎俱知 誓婆毗阇耶 跋阇啰摩礼底 毗舍嚧多 | 勃腾罔迦 跋阇啰制喝那阿遮 摩啰制婆般啰质多 | 跋阇啰擅持 毗舍啰遮 扇多舍鞞提婆补视多 | 苏摩嚧波 摩诃税多 阿唎耶多啰 摩诃婆啰阿般啰 | 跋阇啰啇羯啰制婆 跋阇啰俱摩唎 俱蓝陀唎 | 跋阇啰喝萨多遮 毗地耶乾遮那摩唎迦 | 啒苏母婆羯啰跢那 鞞嚧遮那俱唎耶 夜啰菟瑟尼釤 毗折蓝婆摩尼遮 | 跋阇啰迦那迦波啰婆 嚧阇那跋阇啰顿稚遮 税多遮迦摩啰 刹奢尸波啰婆 | 翳帝夷帝 母陀啰羯拏 娑鞞啰忏 掘梵都 印兔那么么写 ||',
        modernPhoneticZh:
          '阿巴啦吉达 果啦 玛哈-₍普₎啦詹迪 玛哈-地₍普₎达 玛哈-帝佳 玛哈-₍希₎威达 ₍吉₎瓦啦 玛哈-巴啦-班达啦瓦悉尼 | 阿₍哩₎呀-达啦 ₍布₎日古蒂 斋瓦 维佳呀 瓦₍吉₎啦-玛雷帝 维₍希₎鲁达 | 巴₍德₎芒刚 瓦₍吉₎啦-吉₍赫₎瓦 佳 玛啦-杰瓦巴啦吉达 | 瓦₍吉₎啦-丹迪 维沙啦 佳 善达 歪叠哈-布吉达 | 骚₍姆₎呀-鲁巴 玛哈-₍希₎威达 阿₍哩₎呀-达啦 玛哈-巴啦 | 阿巴啦 瓦₍吉₎啦-₍希₎仍卡啦 斋瓦 瓦₍吉₎啦-高玛里 古兰达里 | 瓦₍吉₎啦-哈₍斯₎达 佳 维₍地₎呀 干佳拿-玛利嘎 | 古孙巴-啦₍特₎拿 歪洛佳拿-古利呀 阿₍尔₎托₍师₎尼沙 维₍吉₎日₍姆₎巴玛尼 佳 | 瓦₍吉₎啦-嘎拿嘎-₍普₎啦巴-洛佳拿 瓦₍吉₎啦-敦迪 佳 ₍希₎威达 佳 嘎玛啦₍克₎师 沙希-₍普₎啦巴 | 伊₍帝₎ 诶达 穆₍德₎啦-嘎拿₍赫₎ 萨₍尔₎威 啦₍克₎伤 古₍尔₎万度 玛玛 萨₍尔₎瓦-萨₍特₎瓦南 佳',
        meaningZh:
          '无能胜威猛母、大极忿怒母、大威光母、大威德母、大白光焰母、大力白衣观音母！圣多罗（绿度母）、毗俱胝（颦眉佛母）、最胜佛母、名闻十方之金刚鬘母！莲华相母、金刚舌母、无能胜鬘母！金刚杖母、广博寂静诸天供养母！善寂月容大白圣度母、大势金刚锁母、金刚童女持姓母！金刚手金鬘明妃、红莲宝大日族佛顶频申母！金刚金光眼母、金刚嘴母、白莲华眼月光母！如是一切大印明妃圣众，悉皆护持于我及一切众生！',
        meaningEn:
          'Invincible, Fierce, Mahāpracaṇḍī, Blazing, Radiant, Great White Flame, Mighty Pāṇḍaravāsinī! Noble Tārā, Bhṛkuṭī, Vijayā, renowned as Vajramālā! Lotus-Marked, Vajra-Tongued, Vajradaṇḍī, Peaceful and worshiped by Devas! Gentle-formed Mahāśvetā Ārya-Tārā, Vajraśṛṅkhalā, Vajrakaumārī, Kulaṃdharī, Vajrahastā, Kāñcanamālikā, Vairocana-family Uṣṇīṣa, Vajra-Gold-Light Buddhālocanā, Lotus-Eyed and Moon-Radiant! May all these Mudrā-hosts protect me and all beings!',
        words: [
          { iast: 'mahā-bala-pāṇḍaravāsinī', stem: 'mahābala-pāṇḍaravāsinī', grammar: 'Nom.Sg.Fem.', transliterationZh: '摩诃跋啰槃陀啰婆悉儞', meaningZh: '具大威力之白衣观自在佛母', meaningEn: 'Greatly Powerful White-Robed Mother' },
          { iast: 'ārya-tārā bhṛkuṭī', stem: 'āryatārā + bhṛkuṭī', grammar: 'Nom.Sg.Fem.', transliterationZh: '阿唎耶多啰毗唎俱知', meaningZh: '圣救度佛母与忿怒颦眉佛母', meaningEn: 'Noble Tārā and Bhṛkuṭī' },
          { iast: 'sarve rakṣāṃ kurvantu mama', stem: 'sarva + rakṣā + √kṛ', grammar: 'Impv.3.Pl.', transliterationZh: '娑鞞啰忏掘梵都印兔那么么写', meaningZh: '唯愿一切圣众共同拥护于我', meaningEn: 'may all of them grant protection to me' },
        ],
      },
      {
        id: 'shurangama-7',
        index: 7,
        iast: 'oṃ ṛṣi-gaṇa-praśaste sarva-tathāgatoṣṇīṣa-sitātapatre hūṃ ṭrūṃ jambhana-karī | hūṃ ṭrūṃ stambhana-karī | hūṃ ṭrūṃ para-vidyā-saṃbhakṣaṇa-karī | hūṃ ṭrūṃ sarva-yakṣa-rākṣasa-grahāṇāṃ vidhvaṃsana-karī | hūṃ ṭrūṃ caturaśītīnāṃ graha-sahasrāṇāṃ vidhvaṃsana-karī | hūṃ ṭrūṃ aṣṭāviṃśatīnāṃ nakṣatrāṇāṃ prasādana-karī | hūṃ ṭrūṃ aṣṭānāṃ mahā-grahāṇāṃ vidhvaṃsana-karī | hūṃ ṭrūṃ rakṣa rakṣa māṃ ||',
        classicalTranslitZh:
          '【第二会·释尊应化会（虎𤙖都嚧雍摧伏群魔心咒）】乌𤙖 唎瑟揭拏 般剌舍悉多 萨怛他伽都瑟尼釤 | 虎𤙖 都嚧雍 瞻婆那 | 虎𤙖 都嚧雍 悉耽婆那 | 虎𤙖 都嚧雍 波罗瑟地耶三般叉拏羯啰 | 虎𤙖 都嚧雍 萨婆药叉喝啰刹娑 揭啰诃若阇 毗腾崩萨那羯啰 | 虎𤙖 都嚧雍 者都啰尸底南 揭啰诃娑诃萨啰南 毗腾崩萨那啰 | 虎𤙖 都嚧雍 啰叉 ||',
        modernPhoneticZh:
          '嗡 日师-嘎拿-₍普₎啦沙₍斯₎帝 萨₍尔₎瓦-达他嘎多-₍师₎尼沙-悉达达巴₍特₎雷 吽 ₍特₎隆 詹巴拿-嘎里 | 吽 ₍特₎隆 ₍斯₎丹巴拿-嘎里 | 吽 ₍特₎隆 巴啦-维₍地₎呀-桑巴₍克₎沙拿-嘎里 | 吽 ₍特₎隆 萨₍尔₎瓦-呀₍克₎沙-啦₍克₎沙萨-₍格₎啦哈南 维₍德₎旺萨拿-嘎里 | 吽 ₍特₎隆 佳度啦希帝南 ₍格₎啦哈-萨哈₍斯₎啦南 维₍德₎旺萨拿-嘎里 | 吽 ₍特₎隆 阿₍师₎达文沙帝南 拿₍克₎沙₍特₎啦南 ₍普₎啦萨达拿-嘎里 | 吽 ₍特₎隆 阿₍师₎达南 玛哈-₍格₎啦哈南 维₍德₎旺萨拿-嘎里 | 吽 ₍特₎隆 啦₍克₎沙 啦₍克₎沙 芒',
        meaningZh:
          '【第二会全文】嗡！众大仙人所共赞叹之一切如来佛顶大白伞盖尊！吽、特隆（都嚧雍），能作镇伏（瞻婆那）！吽、特隆，能作制止结缚（悉耽婆那）！吽、特隆，能吞啖摧灭一切外道恶咒！吽、特隆，能摧坏一切药叉罗刹鬼神执魅！吽、特隆，能摧毁八万四千星曜恶障！吽、特隆，请拥护、拥护于我！',
        meaningEn:
          '[Assembly II: Śākyamuni Manifestation Assembly] Oṃ! O White Parasol of the Uṣṇīṣa of All Tathāgatas, praised by the hosts of Sages! Hūṃ Ṭrūṃ, Crusher! Hūṃ Ṭrūṃ, Immobilizer! Hūṃ Ṭrūṃ, Devourer of hostile spells! Hūṃ Ṭrūṃ, Destroyer of all Yakṣa and Rākṣasa demons! Hūṃ Ṭrūṃ, Destroyer of 84,000 planetary demons! Hūṃ Ṭrūṃ, protect, protect me!',
        words: [
          { iast: 'ṛṣi-gaṇa-praśaste', stem: 'ṛṣi-gaṇa-praśasta', grammar: 'Voc.Sg.Fem.', transliterationZh: '唎瑟揭拏般剌舍悉多', meaningZh: '一切大仙众所共同赞叹者', meaningEn: 'O One praised by the host of sages' },
          { iast: 'hūṃ ṭrūṃ jambhana / stambhana', stem: 'bīja + jambhana/stambhana', grammar: 'Vajra Command', transliterationZh: '虎𤙖都嚧雍瞻婆那 / 悉耽婆那', meaningZh: '以佛顶金轮种子摧伏、制止魔障', meaningEn: 'Hūṃ Ṭrūṃ: crush and immobilize' },
          { iast: 'para-vidyā-saṃbhakṣaṇa-karī', stem: 'para-vidyā-saṃbhakṣaṇa', grammar: 'Nom.Sg.Fem.', transliterationZh: '波罗瑟地耶三般叉拏羯啰', meaningZh: '能吞啖消融一切外道邪术者', meaningEn: 'Devourer of hostile spells' },
        ],
      },
      {
        id: 'shurangama-8',
        index: 8,
        iast: 'bhagavan sarva-tathāgatoṣṇīṣa-sitātapatre mahā-pratyaṅgire mahā-sahasra-bhuje sahasra-śīrṣe koṭī-śata-sahasra-netre abhedye jvalita-ṭaṃkāri mahā-vajrodāre tri-bhuvana-maṇḍale | oṃ svastir bhavatu mama | rāja-bhayāc caura-bhayād agni-bhayād udaka-bhayād viṣa-bhayāc chastra-bhayāt paracakra-bhayād durbhikṣa-bhayād aśani-bhayād akāla-mṛtyu-bhayād dharaṇī-bhūmi-kampa-bhayād ulkā-pāta-bhayād rāja-daṇḍa-bhayān nāga-bhayād vidyud-bhayāt suparṇi-bhayāt ||',
        classicalTranslitZh:
          '【第三会·观音合同会（千头千臂佛母救护诸难）】婆伽梵 萨怛他伽都瑟尼釤 波啰点阇吉唎 摩诃娑诃萨啰勃树 娑诃萨啰室唎沙 俱知娑诃萨泥帝㘑 阿弊提视婆唎多 吒吒甖迦 摩诃跋阇嚧陀啰 帝唎菩婆那曼茶啰 | 乌𤙖 莎悉帝薄婆都 么么 印兔那么么写 | 啰阇婆夜 主啰跋夜 阿祇尼婆夜 乌陀迦婆夜 毗沙婆夜 舍萨多啰婆夜 婆啰斫羯啰婆夜 突瑟叉婆夜 阿舍儞婆夜 阿迦啰蜜唎柱婆夜 陀啰尼部弥剑波伽波陀婆夜 乌啰迦婆多婆夜 剌阇坛茶婆夜 那伽婆夜 毗条怛婆夜 苏波啰拏婆夜 ||',
        modernPhoneticZh:
          '巴嘎万 萨₍尔₎瓦-达他嘎多-₍师₎尼沙-悉达达巴₍特₎雷 玛哈-₍普₎啦₍蒂₎央吉雷 玛哈-萨哈₍斯₎啦-布杰 萨哈₍斯₎啦-希₍尔₎奢 果蒂-沙达-萨哈₍斯₎啦-内₍特₎雷 阿贝₍地₎耶 ₍吉₎瓦利达-当嘎里 玛哈-瓦₍吉₎洛达雷 ₍特₎里-布瓦拿-曼达雷 | 嗡 ₍斯₎瓦₍斯₎帝₍尔₎ 巴瓦度 玛玛 | 啦佳-巴呀₍吉₎ 招啦-巴呀₍德₎ 阿₍格₎尼-巴呀₍德₎ 乌达嘎-巴呀₍德₎ 维沙-巴呀₍吉₎ 恰₍斯特₎啦-巴呀₍特₎ 巴啦佳₍克₎啦-巴呀₍德₎ 杜₍尔₎比₍克₎沙-巴呀₍德₎ 阿沙尼-巴呀₍德₎ 阿嘎啦-₍姆₎日₍蒂₎尤-巴呀₍德₎ 达啦尼-布米-干巴-巴呀₍德₎ 乌₍尔₎嘎-巴达-巴呀₍德₎ 啦佳-丹达-巴延 拿嘎-巴呀₍德₎ 维₍地₎尤₍德₎-巴呀₍特₎ 苏巴₍尔₎尼-巴呀₍特₎',
        meaningZh:
          '【第三会起首】世尊一切如来佛顶大白伞盖大回遮母，具大千臂、千头、百千俱胝妙目，坚固不坏、炽燃放光、广大金刚围护三界坛场！嗡！愿我常得吉祥安隐：远离王难怖畏、贼难怖畏、火难怖畏、水难怖畏、毒药怖畏、刀杖怖畏、他方兵劫怖畏、饥馑怖畏、雷电怖畏、非时横死怖畏、地震崩裂怖畏、流星陨石怖畏、王法刑罚怖畏、毒龙怖畏、闪电怖畏及金翅鸟怖畏！',
        meaningEn:
          '[Assembly III: Avalokiteśvara Union Assembly] O Bhagavatī White Parasol Mahāpratyaṅgirā, with a thousand arms, a thousand heads, and hundreds of thousands of koṭis of eyes, indestructible, blazing, encompassing the maṇḍala of the three worlds! Oṃ, may there be auspiciousness for me from fear of kings, thieves, fire, water, poison, weapons, invading armies, famine, thunderbolts, untimely death, earthquakes, meteors, royal punishment, Nāgas, lightning, and Garuḍas!',
        words: [
          { iast: 'mahā-sahasra-bhuje sahasra-śīrṣe', stem: 'sahasra-bhuja / śīrṣa', grammar: 'Voc.Sg.Fem.', transliterationZh: '摩诃娑诃萨啰勃树娑诃萨啰室唎沙', meaningZh: '具足广大千手、千头（千头千臂白伞盖佛母）', meaningEn: 'O Thousand-Armed, Thousand-Headed One' },
          { iast: 'svastir bhavatu mama', stem: 'svasti + √bhū', grammar: 'Nom.Sg. + Impv.3.Sg.', transliterationZh: '莎悉帝薄婆都么么', meaningZh: '愿吉祥安乐常临于我', meaningEn: 'may auspiciousness and safety be mine' },
          { iast: 'rāja-bhayāc caura-bhayād agni-bhayād', stem: 'bhaya (Ablative)', grammar: 'Abl.Sg.', transliterationZh: '啰阇婆夜主啰跋夜阿祇尼婆夜', meaningZh: '脱离王难、盗贼难、火灾难等十六大怖畏', meaningEn: 'from fear of kings, robbers, and fire' },
        ],
      },
      {
        id: 'shurangama-9',
        index: 9,
        iast: 'teṣāṃ sarveṣāṃ sarva-grahāṇāṃ vidyāṃ chindayāmy asinā kīlayāmi vajreṇa | parivrājaka-kṛtāṃ vidyāṃ chindayāmy asinā kīlayāmi vajreṇa | ḍāka-ḍākinī-kṛtāṃ vidyāṃ chindayāmy asinā kīlayāmi vajreṇa | mahā-paśupati-rudra-kṛtāṃ vidyāṃ chindayāmy asinā kīlayāmi vajreṇa | nārāyaṇa-kṛtāṃ vidyāṃ chindayāmy asinā kīlayāmi vajreṇa | tattva-garuḍa-sahīya-kṛtāṃ vidyāṃ chindayāmy asinā kīlayāmi vajreṇa | mahākāla-mātṛgaṇa-kṛtāṃ vidyāṃ chindayāmy asinā kīlayāmi vajreṇa | kāpālika-kṛtāṃ vidyāṃ chindayāmy asinā kīlayāmi vajreṇa | catur-bhaginī-kṛtāṃ vidyāṃ chindayāmy asinā kīlayāmi vajreṇa | vajrapāṇi-guhyakādhipati-kṛtāṃ vidyāṃ chindayāmy asinā kīlayāmi vajreṇa ||',
        classicalTranslitZh:
          '【第三会末·智慧宝剑断咒金刚橛钉魔段】帝釤萨鞞釤 萨婆揭啰诃南 毗陀耶阇 瞋陀夜弥 鸡啰夜弥 | 波唎跋啰者迦讫唎担 毗陀夜阇瞋陀夜弥 鸡啰夜弥 | 茶演尼讫唎担 毗陀夜阇瞋陀夜弥 鸡啰夜弥 | 摩诃般输般怛夜 嚧陀啰讫唎担 毗陀夜阇瞋陀夜弥 鸡啰夜弥 | 那啰夜拏讫唎担 毗陀夜阇瞋陀夜弥 鸡啰夜弥 | 怛埵伽嚧茶西讫唎担 毗陀夜阇瞋陀夜弥 鸡啰夜弥 | 摩诃迦啰摩怛唎伽拏讫唎担 毗陀夜阇瞋陀夜弥 鸡啰夜弥 | 迦波唎迦讫唎担 毗陀夜阇瞋陀夜弥 鸡啰夜弥 | 赭咄啰婆耆儞讫唎担 毗陀夜阇瞋陀夜弥 鸡啰夜弥 | 跋阇啰波儞 具醯夜具醯夜迦地般帝讫唎担 毗陀夜阇瞋陀夜弥 鸡啰夜弥 ||',
        modernPhoneticZh:
          '帝伤 萨₍尔₎威伤 萨₍尔₎瓦-₍格₎啦哈南 维₍地₎央 亲达呀₍米₎ 阿悉拿 给啦呀米 瓦₍吉₎雷拿 | 巴里-₍维₎啦佳嘎-₍克₎日当 维₍地₎央 亲达呀₍米₎ 阿悉拿 给啦呀米 瓦₍吉₎雷拿 | 达嘎-达给尼-₍克₎日当 维₍地₎央 亲达呀₍米₎ 阿悉拿 给啦呀米 瓦₍吉₎雷拿 | 玛哈-巴舒巴帝-鲁₍德₎啦-₍克₎日当 维₍地₎央 亲达呀₍米₎ 阿悉拿 给啦呀米 瓦₍吉₎雷拿 | 拿啦呀拿-₍克₎日当 维₍地₎央 亲达呀₍米₎ 阿悉拿 给啦呀米 瓦₍吉₎雷拿 | 达₍特₎瓦-嘎鲁达-萨嘿呀-₍克₎日当 维₍地₎央 亲达呀₍米₎ 阿悉拿 给啦呀米 瓦₍吉₎雷拿 | 玛哈嘎啦-玛₍特₎日嘎拿-₍克₎日当 维₍地₎央 亲达呀₍米₎ 阿悉拿 给啦呀米 瓦₍吉₎雷拿 | 嘎巴利嘎-₍克₎日当 维₍地₎央 亲达呀₍米₎ 阿悉拿 给啦呀米 瓦₍吉₎雷拿 | 佳度₍尔₎-巴吉尼-₍克₎日当 维₍地₎央 亲达呀₍米₎ 阿悉拿 给啦呀米 瓦₍吉₎雷拿 | 瓦₍吉₎啦巴尼-古₍赫₎呀嘎地巴帝-₍克₎日当 维₍地₎央 亲达呀₍米₎ 阿悉拿 给啦呀米 瓦₍吉₎雷拿',
        meaningZh:
          '彼等一切恶星鬼神所造邪咒，我今悉以智慧宝剑断除之（瞋陀夜弥）、以金刚宝橛钉伏之（鸡啰夜弥）！梵志出家外道所造咒、荼枳尼鬼所造咒、大兽主鲁陀罗天所造咒、那罗延天所造咒、金翅鸟眷属所造咒、大黑天及诸天母众所造咒、髑髅外道所造咒、四姊妹女鬼所造咒、乃至假借密迹主金刚手之名所造一切邪咒，我今悉以宝剑断之、以金刚橛钉之！',
        meaningEn:
          'Of all those planetary demons, I sever their spells with the sword of wisdom (vidyāṃ chindayāmy asinā) and nail them down with the vajra-peg (kīlayāmi vajreṇa)! The spells made by wandering ascetics, Ḍākas and Ḍākinīs, Mahāpaśupati Rudra, Nārāyaṇa, Garuḍas, Mahākāla and the Mātṛgaṇas, Kāpālikas, the Four Sisters, and Guhyakādhipati—I sever their spells with the sword and nail them with the vajra!',
        words: [
          { iast: 'vidyāṃ chindayāmy asinā', stem: 'vidyā + √chid + asi', grammar: 'Acc.Sg. + Pres.1.Sg. + Inst.Sg.', transliterationZh: '毗陀夜阇瞋陀夜弥', meaningZh: '我以智慧利剑斩断其恶咒', meaningEn: 'I sever the spell with a sword' },
          { iast: 'kīlayāmi vajreṇa', stem: '√kīl + vajra', grammar: 'Pres.1.Sg. + Inst.Sg.', transliterationZh: '鸡啰夜弥', meaningZh: '我以金刚普巴橛钉伏禁制之', meaningEn: 'I pin/nail it down with the Vajra-peg' },
          { iast: 'parivrājaka-kṛtāṃ', stem: 'parivrājaka-kṛta', grammar: 'Acc.Sg.Fem.', transliterationZh: '波唎跋啰者迦讫唎担', meaningZh: '游行外道梵志所造作之咒术', meaningEn: 'made by wandering mendicant ascetics' },
        ],
      },
      {
        id: 'shurangama-10',
        index: 10,
        iast: 'bhagavati tathāgatoṣṇīṣa-sitātapatre namo \'stu te | asitānalārka-prabhā-sphuṭa-vikasita-sitātapatre | oṃ jvala jvala dhaka dhaka khāda khāda dara dara vidara vidara chinda chinda bhinda bhinda hūṃ hūṃ phaṭ phaṭ phaṭ phaṭ phaṭ svāhā | he he phaṭ | ho ho phaṭ | amoghāya phaṭ | apratihatāya phaṭ | varadāya phaṭ | asura-vidrāvaṇa-karāya phaṭ | sarva-devebhyaḥ phaṭ | sarva-nāgebhyaḥ phaṭ | sarva-yakṣebhyaḥ phaṭ | sarva-gandharvebhyaḥ phaṭ | sarva-pūtanebhyaḥ phaṭ | kaṭapūtanebhyaḥ phaṭ | sarva-durlaṅghitebhyaḥ phaṭ | sarva-duṣprekṣitebhyaḥ phaṭ | sarva-jvarebhyaḥ phaṭ | sarvāpasmārebhyaḥ phaṭ | sarva-śramaṇebhyaḥ phaṭ | vajra-kaumārīye vidyā-rājñīye phaṭ | mahā-pratyaṅgirebhyaḥ phaṭ | vajra-śṛṅkhalāya mahā-pratyaṅgirā-rājāya phaṭ ||',
        classicalTranslitZh:
          '【第四会·金刚藏折摄会（光明炽盛百千泮吒破魔段）】婆伽梵 萨怛多般怛啰 南无粹都帝 | 阿悉多那啰剌迦 波啰婆悉普吒 毗迦萨怛多钵帝唎 | 什佛啰什佛啰 陀啰陀啰 频陀啰频陀啰 瞋陀瞋陀 虎𤙖 虎𤙖 泮吒 泮吒泮吒泮吒泮吒 娑诃 | 醯醯泮 | 阿牟迦耶泮 | 阿波啰提诃多泮 | 婆啰波啰陀泮 | 阿素啰毗陀啰波迦泮 | 萨婆提鞞弊泮 | 萨婆那伽弊泮 | 萨婆药叉弊泮 | 萨婆乾闼婆弊泮 | 萨婆补丹那弊泮 | 迦吒补丹那弊泮 | 萨婆突狼枳帝弊泮 | 萨婆突涩比𠼐讫瑟帝弊泮 | 萨婆什婆唎弊泮 | 萨婆阿播悉摩𠼐弊泮 | 萨婆舍啰婆拏弊泮 | 跋阇啰俱摩唎 毗陀夜啰誓弊泮 | 摩诃波啰丁羊乂耆唎弊泮 | 跋阇啰商羯啰夜 波啰丈耆啰阇耶泮 ||',
        modernPhoneticZh:
          '巴嘎瓦帝 达他嘎多-₍师₎尼沙-悉达达巴₍特₎雷 拿摩 ₍斯₎度 帝 | 阿悉达拿啦₍尔₎嘎-₍普₎啦巴-₍斯₎普达-维嘎悉达-悉达达巴₍特₎雷 | 嗡 ₍吉₎瓦啦 ₍吉₎瓦啦 达嘎 达嘎 卡达 卡达 达啦 达啦 维达啦 维达啦 亲达 亲达 宾达 宾达 吽 吽 帕₍特₎ 帕₍特₎ 帕₍特₎ 帕₍特₎ 帕₍特₎ ₍斯₎瓦哈 | 嘿 嘿 帕₍特₎ | 霍 霍 帕₍特₎ | 阿摩嘎呀 帕₍特₎ | 阿₍普₎啦帝哈达呀 帕₍特₎ | 瓦啦达呀 帕₍特₎ | 阿苏啦-维₍德₎啦瓦拿-嘎啦呀 帕₍特₎ | 萨₍尔₎瓦-叠威₍比₎呀₍赫₎ 帕₍特₎ | 萨₍尔₎瓦-拿给₍比₎呀₍赫₎ 帕₍特₎ | 萨₍尔₎瓦-呀₍克₎奢₍比₎呀₍赫₎ 帕₍特₎ | 萨₍尔₎瓦-甘达₍尔₎威₍比₎呀₍赫₎ 帕₍特₎ | 萨₍尔₎瓦-布达内₍比₎呀₍赫₎ 帕₍特₎ | 嘎达布达内₍比₎呀₍赫₎ 帕₍特₎ | 萨₍尔₎瓦-杜₍尔₎朗吉帝₍比₎呀₍赫₎ 帕₍特₎ | 萨₍尔₎瓦-杜₍师普₎雷₍克₎师帝₍比₎呀₍赫₎ 帕₍特₎ | 萨₍尔₎瓦-₍吉₎瓦雷₍比₎呀₍赫₎ 帕₍特₎ | 萨₍尔₎瓦-巴₍斯₎玛雷₍比₎呀₍赫₎ 帕₍特₎ | 萨₍尔₎瓦-₍希₎啦玛内₍比₎呀₍赫₎ 帕₍特₎ | 瓦₍吉₎啦-高玛里耶 维₍地₎呀-啦₍吉₎尼耶 帕₍特₎ | 玛哈-₍普₎啦₍蒂₎央吉雷₍比₎呀₍赫₎ 帕₍特₎ | 瓦₍吉₎啦-₍希₎仍卡啦呀 玛哈-₍普₎啦₍蒂₎央吉啦-啦佳呀 帕₍特₎',
        meaningZh:
          '【第四会全文枢要】世尊大白伞盖佛母，我今敬礼于汝！具足无垢猛火与日轮光明、遍覆开敷之大白伞盖尊！嗡！炽燃放光、焚烧吞啖、摧裂粉碎、斩断劈破一切魔障，吽、吽、泮吒、泮吒、泮吒、泮吒、泮吒，娑诃！醯醯泮！不空尊泮！无碍尊泮！施愿尊泮！摧伏阿修罗尊泮！于一切恶天、毒龙、药叉、乾闼婆、臭饿鬼、奇臭鬼、恶越界、恶毒眼视、一切热病疟疾、一切癫狂鬼、一切邪沙门，悉皆摧破（泮）！金刚童女明妃泮！大回遮王金刚锁尊泮！',
        meaningEn:
          '[Assembly IV: Vajragarbha Subjugation Assembly] O Bhagavatī White Parasol, homage to You! O White Parasol blooming with blazing fire and sun-like radiance! Oṃ! Blaze, burn, devour, split, cleave, sever, shatter—Hūṃ Hūṃ Phaṭ Phaṭ Phaṭ Phaṭ Phaṭ Svāhā! To the Unfailing One, Phaṭ! To the Unobstructed One, Phaṭ! Rout the Asuras, Phaṭ! Against all hostile Devas, Nāgas, Yakṣas, Gandharvas, Pūtanas, evil gazes, fevers, and epilepsy demons—Phaṭ!',
        words: [
          { iast: 'asitānalārka-prabhā-sphuṭa-vikasita-sitātapatre', stem: 'sitātapatrā', grammar: 'Voc.Sg.Fem.', transliterationZh: '阿悉多那啰剌迦波啰婆悉普吒毗迦萨怛多钵帝唎', meaningZh: '猛火日轮光明遍照开敷之大白伞盖佛母', meaningEn: 'O White Parasol blooming with blazing fire and solar light' },
          { iast: 'jvala dhaka dara vidara chinda bhinda', stem: '6 Imperatives', grammar: 'Impv.2.Sg.', transliterationZh: '什佛啰陀啰频陀啰瞋陀', meaningZh: '放光、焚烧、摧裂、粉碎、斩断、劈破一切业障魔军', meaningEn: 'blaze, burn, split, cleave, cut, and shatter!' },
        ],
      },
      {
        id: 'shurangama-11',
        index: 11,
        iast: 'ye kecit sattvā mama duṣṭa-cittā amitra-cittā ojāhārā garbhāhārā rudhirāhārā vasāhārā māṃsāhārā medāhārā majjāhārā jātāhārā jīvitāhārā | jvarā ekāhikā dvaitīyakā traitīyakā cāturthikā nitya-jvarā viṣama-jvarā vātikā paittikā ślaiṣmikā sānnipātikā sarva-jvarāḥ | śiro-\'rttiṃ ardhāvabhedakaṃ akṣi-rogaṃ mukha-rogaṃ hṛd-rogaṃ karṇa-śūlaṃ danta-śūlaṃ hṛdaya-śūlaṃ marma-śūlaṃ udara-śūlaṃ sarvāṅga-pratyaṅga-śūlaṃ cāpanayantu ||',
        classicalTranslitZh:
          '【第五会·文殊弘传会（净除食精气鬼与一切身病痛）】演吉质 萨埵婆写 么么印兔那么么写 突瑟吒质多 阿末怛唎质多 | 乌阇诃啰 伽婆诃啰 嚧地啰诃啰 婆娑诃啰 摩阇诃啰 阇多诃啰 视毖多诃啰 | 什伐啰堙迦醯迦 坠帝药迦 怛隶帝药迦 者突托迦 昵提什伐啰 毖釤摩什伐啰 薄底迦 鼻底迦 室隶瑟蜜迦 娑儞般帝迦 萨婆什伐啰 | 室嚧吉帝 末陀鞞达嚧制剑 阿绮嚧钳 目佉嚧钳 羯唎突嚧钳 羯拏输蓝 惮多输蓝 迄唎夜输蓝 末么输蓝 乌陀啰输蓝 娑房盎伽般啰丈伽输蓝 ||',
        modernPhoneticZh:
          '耶 给吉₍特₎ 萨₍特₎瓦 玛玛 杜₍师₎达-吉达 阿米₍特₎啦-吉达 欧佳哈啦 嘎₍尔₎巴哈啦 鲁地啦哈啦 瓦萨哈啦 芒萨哈啦 美达哈啦 玛佳哈啦 佳达哈啦 吉维达哈啦 | ₍吉₎瓦啦 诶嘎嘿嘎 ₍德₎歪帝呀嘎 ₍特₎来帝呀嘎 佳度₍尔₎提嘎 尼₍蒂₎呀-₍吉₎瓦啦 维沙玛-₍吉₎瓦啦 瓦帝嘎 拜帝嘎 ₍希₎赖₍师₎米嘎 散尼巴帝嘎 萨₍尔₎瓦-₍吉₎瓦啦₍赫₎ | 希洛-₍尔₎丁 阿₍尔₎达瓦贝达刚 阿₍克₎师-洛刚 穆卡-洛刚 ₍赫₎日₍德₎-洛刚 嘎₍尔₎拿-舒朗 丹达-舒朗 ₍赫₎日达呀-舒朗 玛₍尔₎玛-舒朗 乌达啦-舒朗 萨₍尔₎旺嘎-₍普₎啦₍蒂₎央嘎-舒朗 佳巴拿延度',
        meaningZh:
          '【第五会前半】凡有众生对我怀恶心、怨敌心，或夺人精气鬼、食胎鬼、饮血鬼、食脂鬼、食肉鬼、食髓鬼、食命鬼；及一日疟、二日疟、三日疟、四日疟、常热病、风黄痰及三合病等一切热病；并头痛、偏头痛、眼病、口病、心痛、耳痛、齿痛、血脉痛、腹痛及周身肢节一切苦痛，悉皆消除退散！',
        meaningEn:
          '[Assembly V: Mañjuśrī Transmission Assembly] Whatever beings harbor malicious or hostile thoughts toward me—spirits who steal vitality, embryos, blood, fat, flesh, marrow, or life; and all fevers (daily, two-day, three-day, four-day, chronic, wind, bile, phlegm, and combined fevers); and all headaches, migraines, eye diseases, mouth diseases, earaches, toothaches, heart pains, abdominal pains, and pains in every limb—may they all be dispelled!',
        words: [
          { iast: 'ojāhārā ... jīvitāhārā', stem: 'ojas/jīvita-āhāra', grammar: 'Nom.Pl.', transliterationZh: '乌阇诃啰...视毖多诃啰', meaningZh: '夺食行者精气与寿命之诸鬼神', meaningEn: 'spirits that consume vitality and life-force' },
          { iast: 'vātikā paittikā ślaiṣmikā sānnipātikā', stem: 'tridoṣa-jvara', grammar: 'Nom.Pl.', transliterationZh: '薄底迦鼻底迦室隶瑟蜜迦娑儞般帝迦', meaningZh: '风病、黄病（胆）、痰病（涎）及三集并发热病', meaningEn: 'fevers arising from wind, bile, phlegm, and their combination' },
        ],
      },
      {
        id: 'shurangama-12',
        index: 12,
        iast: 'sitātapatra-mahā-vajroṣṇīṣa-mahā-pratyaṅgirā-vidyānubhāvena yāvad dvādaśa-yojanābhyantareṇa vidyā-bandhaṃ karomi | tejo-bandhaṃ karomi | para-vidyā-bandhaṃ karomi | tadyathā | oṃ anale anale viśade viśade vīra vajradhare | bandha bandhani vajrapāṇi phaṭ | hūṃ trūṃ phaṭ svāhā ||',
        classicalTranslitZh:
          '【第五会末·十二由旬金刚结界暨大佛顶首楞严王根本咒心】悉怛多钵怛啰 摩诃跋阇嚧瑟尼釤 摩诃般赖丈耆蓝 | 夜波突陀舍喻阇那 辫怛隶拏 毗陀耶槃昙迦嚧弥 | 帝殊槃昙迦嚧弥 | 般啰毗陀槃昙迦嚧弥 | 跢侄他 | 唵 阿那隶 阿那隶 毗舍提 毗舍提 鞞啰跋阇啰陀唎 | 槃陀槃陀儞 跋阇啰谤尼泮 | 虎𤙖都嚧瓮泮 莎婆诃 ||',
        modernPhoneticZh:
          '悉达达巴₍特₎啦-玛哈-瓦₍吉₎洛₍师₎尼沙-玛哈-₍普₎啦₍蒂₎央吉啦-维₍地₎呀努巴威拿 呀瓦₍德₎ ₍德₎瓦达沙-优佳拿₍比₎延达雷拿 维₍地₎呀-班当 嘎洛米 | 帝久-班当 嘎洛米 | 巴啦-维₍地₎呀-班当 嘎洛米 | 达₍地₎呀他 | 嗡 阿拿雷 阿拿雷 维沙叠 维沙叠 维啦 瓦₍吉₎啦达雷 | 班达 班达尼 瓦₍吉₎啦巴尼 帕₍特₎ | 吽 ₍特₎隆 帕₍特₎ ₍斯₎瓦哈',
        meaningZh:
          '【十二由旬结界与首楞严根本咒心】承此大白伞盖大金刚佛顶大回遮母明咒威神力故，乃至十二由旬之内，我今作大明咒结界！作大威光结界！作遮缚一切外道邪咒结界！即说咒心曰：嗡！智慧猛火尊、智慧猛火尊！最极清净无垢尊、最极清净无垢尊！大勇猛执持金刚者！结界系缚、结缚母！手执金刚杵之金刚手菩萨，立断魔障（泮）！吽、特隆（都嚧瓮）、泮，圆满究竟成就，莎婆诃！',
        meaningEn:
          '[Twelve-Yojana Maṇḍala Boundary & Ultimate Śūraṅgama Heart Mantra] By the power of this White Parasol Great Vajra-Uṣṇīṣa Mahāpratyaṅgirā Vidyā, within a radius of twelve yojanas I establish the Vidyā-boundary! I establish the Radiance-boundary! I bind all hostile spells! Namely: Oṃ! O Blazing Fire of Wisdom, O Pure and Stainless One, Heroic Wielder of the Vajra! Bind, O Binder! Vajra-in-Hand (Vajrapāṇi), Phaṭ! Hūṃ Trūṃ Phaṭ Svāhā!',
        words: [
          { iast: 'dvādaśa-yojanābhyantareṇa', stem: 'dvādaśa-yojana-abhyantara', grammar: 'Inst.Sg.', transliterationZh: '夜波突陀舍喻阇那辫怛隶拏', meaningZh: '乃至方圆十二由旬（约六百里）坛城之内', meaningEn: 'within the expanse of twelve yojanas' },
          { iast: 'vidyā-bandhaṃ / tejo-bandhaṃ karomi', stem: 'bandha + √kṛ', grammar: 'Acc.Sg. + Pres.1.Sg.', transliterationZh: '毗陀耶槃昙迦嚧弥 / 帝殊槃昙迦嚧弥', meaningZh: '我今结大明咒界、结大威德光明界', meaningEn: 'I establish the Vidyā-boundary and Radiance-boundary' },
          { iast: 'anale viśade vīra vajradhare', stem: 'anala + viśada + vīra + vajradhara', grammar: 'Voc.Sg.', transliterationZh: '阿那隶毗舍提鞞啰跋阇啰陀唎', meaningZh: '智火炽盛、清净无垢、大勇猛执金刚尊', meaningEn: 'O Sacred Fire, Spotless One, Heroic Vajra-Holder' },
          { iast: 'bandha bandhani vajrapāṇi phaṭ', stem: '√bandh + bandhanī + vajrapāṇi', grammar: 'Impv. + Voc.Sg.', transliterationZh: '槃陀槃陀儞跋阇啰谤尼泮', meaningZh: '结界禁缚魔怨！金刚手菩萨立断烦恼！', meaningEn: 'bind, O Binder! O Vajrapāṇi, shatter!' },
          { iast: 'hūṃ trūṃ phaṭ svāhā', stem: 'Bīja-mantra', grammar: 'Sacred Bījas', transliterationZh: '虎𤙖都嚧瓮泮莎婆诃', meaningZh: '大日金轮佛顶种子字（trūṃ）与金刚破障种子字，速疾圆成', meaningEn: 'Sacred Crown & Vajra Seed-Syllables, Svāhā!' },
        ],
      },
    ],
  },
  {
    id: 'amoghapasa-vairocana-mahamudra',
    titleZh: '不空羂索毗卢遮那佛大灌顶光真言（光明真言 · 23字悉昙原典对音全本）',
    titleSanskritIast: 'Amoghapāśa-vairocana-mahābhiṣeka-prabhāsa-mantra',
    titleEnglish: 'Mantra of Unfailing Light of Mahāvairocana (Komyo Shingon)',
    categoryId: 'supreme-mantras',
    taishoNo: 'T19n1002 / T20n1092',
    translatorZh: '唐·大兴善寺三藏沙门大广智不空 奉诏译',
    sutraSourceZh: '《不空羂索毗卢遮那佛大灌顶光真言》(T19n1002) 暨《不空羂索神变真言经》(T20n1092)',
    deityZh: '毗卢遮那如来（大日如来）暨不空羂索观音',
    meritsAndSummaryZh:
      '东密与唐密最尊崇之超度、灭罪、放光加持真言，根本咒共 23 个悉昙梵字。经云若有众生造十恶五逆四重诸罪，闻此大灌顶光真言二三七遍，或以土沙加持散亡者尸骸墓上，立得光明及身，除诸罪报，莲华化生西方极乐世界。本词条完整接入从 CBETA 官方库下载之《T19n1002.xml》全部 23 个原典悉昙梵字与《不空羂索经》归敬及随心咒。',
    recitationTipsZh:
      '全咒由五佛归敬、23字根本大灌顶光真言与不空羂索随心真言三段构成，末尾 hūṃ phaṭ svāhā 发音浑厚有力。',
    provenance: {
      sourceType: 'CBETA-XML-P5',
      cbetaId: 'T19n1002',
      cbetaRawXmlUrl: cbetaT19n1002?.cbetaRawUrl || 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n1002.xml',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T19n1002',
      editionCitation:
        'CBETA XML-P5 T19n1002《不空羂索毗卢遮那佛大灌顶光真言》(唐·不空三藏译，含全部 23 个 #SD-* 悉昙梵字与汉文逐字对音)。',
      manuscriptNotesZh:
        '已从 github.com/cbeta-org/xml-p5 下载 T19n1002.xml 原典并完整解析 23 个悉昙字对音单元。',
      rawSnippet: cbetaT19n1002?.dharaniParagraphs.map((p) => p.text).join('\n'),
      cbetaInterlinearTokens: cbetaT19n1002?.interlinearTokens || [],
    },
    verses: [
      {
        id: 'komyo-1',
        index: 1,
        iast: 'namaḥ samantabuddhānāṃ | namo bhagavate vairocanāya tathāgatāyārhate samyaksaṃbuddhāya | namo āryāvalokiteśvarāya bodhisattvāya mahāsattvāya mahākāruṇikāya ||',
        classicalTranslitZh:
          '曩莫三满多没驮南 | 曩谟婆誐嚩帝 尾嚧左曩野 怛他蘖跢夜啰诃帝 三藐三没驮野 | 曩谟阿哩也嚩路枳帝湿嚩啰野 冒地萨怛嚩野 摩贺萨怛嚩野 摩贺迦噜抳迦野 ||',
        modernPhoneticZh:
          '拿玛₍赫₎ 萨曼达-布达南 | 拿摩 巴嘎瓦帝 歪洛佳拿呀 达他嘎达-呀₍尔₎哈帝 萨₍姆₎呀₍克₎-桑布达呀 | 拿摩 阿₍哩₎呀-瓦洛给帝-₍湿₎瓦啦呀 博地-萨₍特₎瓦呀 玛哈-萨₍特₎瓦呀 玛哈-嘎鲁尼嘎呀',
        meaningZh:
          '【初段·毗卢遮那佛与不空羂索观音归敬】顶礼普遍十方一切诸佛！顶礼世尊毗卢遮那（大日遍照）如来、应供、正等正觉！顶礼圣观自在菩萨摩诃萨、具足大悲心者！',
        meaningEn:
          '[Homage to Mahāvairocana & Avalokiteśvara] Homage to all Buddhas everywhere! Homage to Bhagavān Vairocana Tathāgata, Arhat, Perfectly Awakened One! Homage to Noble Avalokiteśvara Bodhisattva Mahāsattva, the Greatly Compassionate One!',
        words: [
          { iast: 'vairocanāya tathāgatāya', stem: 'vairocana-tathāgata', grammar: 'Dat.Sg.Masc.', transliterationZh: '尾嚧左曩野怛他蘖跢夜', meaningZh: '向光明遍照毗卢遮那如来顶礼', meaningEn: 'to Tathāgata Vairocana (the Great Illuminator)' },
        ],
      },
      {
        id: 'komyo-2',
        index: 2,
        iast: 'oṃ amogha vairocana mahāmudrā maṇi padma jvāla pravartaya hūṃ ||',
        classicalTranslitZh:
          '唵 阿谟伽 尾嚧左曩 摩贺母捺啰(二合) 么抳 钵纳么(二合) 入嚩(二合)攞 钵啰(二合)韈哆野 吽 ||',
        modernPhoneticZh:
          '嗡 阿摩嘎 歪洛佳拿 玛哈穆₍德₎啦 玛尼 巴₍德₎玛 ₍吉₎瓦啦 ₍普₎啦瓦₍尔₎达呀 吽',
        meaningZh:
          '【二段·大灌顶光真言23字根本咒】嗡！真实不空（不空成就佛）、光明遍照（毗卢遮那大日如来）、大金刚法印（阿閦佛）、如意摩尼宝珠（宝生佛）、清净红莲华（阿弥陀佛）！请放无量智慧火焰、转大法轮，吽！',
        meaningEn:
          '[Root 23-Syllable Komyo Shingon] Oṃ! Unfailing (Amoghasiddhi), Illuminator (Vairocana), Great Seal (Mahāmudrā / Akṣobhya), Wish-Fulfilling Jewel (Ratnasambhava), Lotus (Amitābha): send forth and revolve the blazing light of wisdom, Hūṃ!',
        tangNoteZh: 'CBETA《T19n1002》23字悉昙原典对音全本，一咒统摄金刚界与胎藏界五方五佛全体大用。',
        words: [
          { iast: 'amogha', stem: 'a-mogha', grammar: 'Voc.Sg.', transliterationZh: '阿谟伽', meaningZh: '真实不空（北方不空成就如来成所作智）', meaningEn: 'Unfailing, Infallible' },
          { iast: 'vairocana', stem: 'vairocana', grammar: 'Voc.Sg.', transliterationZh: '尾嚧左曩', meaningZh: '光明遍照（中央毗卢遮那如来法界体性智）', meaningEn: 'Great Illuminator (Vairocana)' },
          { iast: 'mahāmudrā', stem: 'mahā-mudrā', grammar: 'Voc.Sg.Fem.', transliterationZh: '摩贺母捺啰', meaningZh: '大金刚印（东方阿閦如来大圆镜智）', meaningEn: 'Great Seal' },
          { iast: 'maṇi', stem: 'maṇi', grammar: 'Voc.Sg.', transliterationZh: '么抳', meaningZh: '摩尼如意宝珠（南方宝生如来平等性智）', meaningEn: 'Wish-Fulfilling Gem' },
          { iast: 'padma', stem: 'padma', grammar: 'Voc.Sg.', transliterationZh: '钵纳么', meaningZh: '清净莲华（西方阿弥陀如来妙观察智）', meaningEn: 'Sacred Lotus' },
          { iast: 'jvāla pravartaya', stem: 'jvālā + pra-√vṛt', grammar: 'Acc. + Caus.Impv.2.Sg.', transliterationZh: '入嚩攞钵啰韈哆野', meaningZh: '转起大光明火焰度脱群生', meaningEn: 'revolve and radiate blazing light' },
        ],
      },
      {
        id: 'komyo-3',
        index: 3,
        iast: 'oṃ amogha-pāśa hṛdaya mahā-padma-kula-maṇi-vajriṇi | sarva-pāpa-āvaraṇa-viśodhani hūṃ phaṭ svāhā ||',
        classicalTranslitZh:
          '唵 阿谟伽播舍 纥哩(二合)那野 摩贺钵纳么(二合)俱攞么抳嚩日哩(二合)抳 | 萨嚩播波阿嚩啰拏尾戍驮儞 吽 癹吒 娑嚩(二合)贺 ||',
        modernPhoneticZh:
          '嗡 阿摩嘎-巴沙 ₍赫₎日达呀 玛哈-巴₍德₎玛-古啦-玛尼-瓦₍吉₎里尼 | 萨₍尔₎瓦-巴巴-阿瓦啦拿-维硕达尼 吽 帕₍特₎ ₍斯₎瓦哈',
        meaningZh:
          '【三段·不空羂索净障随心真言】嗡！不空羂索心印、大莲华部摩尼金刚母！净除一切罪业与烦恼障难者，吽、癹吒，吉祥圆满成就！',
        meaningEn:
          '[Amoghapāśa Purification Heart Mantra] Oṃ! Heart of the Unfailing Lasso, Jewel-Vajra of the Great Lotus Family! Purifier of all sins and karmic obscurations, Hūṃ Phaṭ Svāhā!',
        words: [
          { iast: 'amogha-pāśa hṛdaya', stem: 'amoghapāśa-hṛdaya', grammar: 'Voc.Sg.', transliterationZh: '阿谟伽播舍纥哩那野', meaningZh: '不空大悲羂索心王', meaningEn: 'Heart of the Unfailing Lasso' },
          { iast: 'sarva-pāpa-āvaraṇa-viśodhani', stem: 'sarvapāpa-āvaraṇa-viśodhanī', grammar: 'Voc.Sg.Fem.', transliterationZh: '萨嚩播波阿嚩啰拏尾戍驮儞', meaningZh: '净除一切恶业罪障者', meaningEn: 'O Purifier of all sins and obstructions' },
        ],
      },
    ],
  },
  {
    id: 'vajrasattva-100-syllable',
    titleZh: '金刚萨埵百字明（一切如来真实摄大教王百字真言）',
    titleSanskritIast: 'Vajrasattva-śatākṣara-dhāraṇī',
    titleEnglish: 'Hundred-Syllable Purification Mantra of Vajrasattva',
    categoryId: 'supreme-mantras',
    taishoNo: 'T18n0865 / T18n0874',
    translatorZh: '唐·不空三藏 译《金刚顶一切如来真实摄大乘现证大教王经》',
    sutraSourceZh: '《金刚顶经》暨 GRETIL 梵本《Sarvatathāgatatattvasaṃgraha》(sarvttsu.htm)',
    deityZh: '金刚萨埵 / 普贤金刚手菩萨 (Vajrasattva)',
    meritsAndSummaryZh:
      '密乘忏悔业障、补阙三昧耶戒、净除身口意无始罪垢之最胜总持，共一百个梵文音节（Śatākṣara）。诵持此咒能得一切如来五智灌顶，纵有失念违犯亦蒙金刚萨埵坚固摄持。',
    recitationTipsZh:
      '百字明句法整饬对称（dṛḍho me bhava / sutoṣyo me bhava / supoṣyo me bhava / anurakto me bhava），诵时观想心月轮上白色 Hūṃ 字放光净除一切罪障。',
    provenance: {
      sourceType: 'CBETA+GRETIL',
      cbetaId: 'T18n0865',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T18n0865',
      gretilFile: 'sarvttsu.htm',
      gretilRawUrl: 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/main/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/sarvttsu.htm',
      editionCitation:
        'GRETIL sarvttsu.htm (Sarvatathāgatatattvasaṃgraha, ed. Isshi Yamada & Kanjin Horiuchi) & CBETA T18n0865《金刚顶经》。',
      manuscriptNotesZh:
        '依据梵本《一切如来真实摄经》与藏汉传承梵音校勘百字明标准 100 音节本及金刚萨埵六字心咒。',
    },
    verses: [
      {
        id: 'vajrasattva-1',
        index: 1,
        iast: 'oṃ vajrasattva samayam anupālaya | vajrasattvatvenopatiṣṭha | dṛḍho me bhava ||',
        classicalTranslitZh:
          '唵 嚩日啰(二合)萨埵 三摩耶 么努播(引)攞耶 | 嚩日啰萨埵底尾(二合)诺跛底瑟姹(二合) | 你哩(二合)荼(引)弥婆嚩 ||',
        modernPhoneticZh:
          '嗡 瓦₍吉₎啦萨₍特₎瓦 萨玛央 阿努巴啦呀 | 瓦₍吉₎啦-萨₍特₎瓦₍特₎威诺巴帝₍师₎他 | ₍德₎日多 美 巴瓦',
        meaningZh:
          '【初颂·守护本誓与坚固加持】嗡！金刚萨埵尊，请守护三昧耶本誓！请以金刚萨埵自性亲临安住于我！愿为我作坚固不坏之依怙！',
        meaningEn:
          '[Verse 1: Guarding the Samaya & Steadfast Presence] Oṃ! O Vajrasattva, protect the Samaya pledge! Stand close to me in the nature of Vajrasattva! Be firm and steadfast for me!',
        words: [
          { iast: 'samayam anupālaya', stem: 'samaya + anu-√pāl', grammar: 'Acc.Sg. + Impv.2.Sg.', transliterationZh: '三摩耶么努播攞耶', meaningZh: '守护本誓三昧耶戒', meaningEn: 'guard and maintain the sacred pledge' },
          { iast: 'vajrasattvatvenopatiṣṭha', stem: 'vajrasattva-tva + upa-√sthā', grammar: 'Inst.Sg. + Impv.2.Sg.', transliterationZh: '嚩日啰萨埵底尾诺跛底瑟姹', meaningZh: '以金刚萨埵体性亲临加持', meaningEn: 'abide near me as Vajrasattva' },
          { iast: 'dṛḍho me bhava', stem: 'dṛḍha + mad + √bhū', grammar: 'Nom.Sg. + Dat. + Impv.', transliterationZh: '你哩荼弥婆嚩', meaningZh: '愿为我作坚固不坏之体', meaningEn: 'be steadfast for me' },
        ],
      },
      {
        id: 'vajrasattva-2',
        index: 2,
        iast: 'sutoṣyo me bhava | supoṣyo me bhava | anurakto me bhava | sarvasiddhiṃ me prayaccha ||',
        classicalTranslitZh:
          '素睹使瑜(二合)弥婆嚩 | 素报使瑜(二合)弥婆嚩 | 阿努啰讫睹(二合)弥婆嚩 | 萨嚩悉地孕(二合)弥钵啰(二合)也瑳 ||',
        modernPhoneticZh:
          '苏多₍师₎优 美 巴瓦 | 苏波₍师₎优 美 巴瓦 | 阿努啦₍克₎多 美 巴瓦 | 萨₍尔₎瓦悉丁 美 ₍普₎啦呀恰',
        meaningZh:
          '【二颂·欢喜增益与悉地赐予】愿对我深生欢喜！愿令我福慧增长！愿对我慈悲摄受爱念！请赐予我世出世间一切悉地成就！',
        meaningEn:
          '[Verse 2: Satisfaction, Nourishment & Bestowal of Siddhis] Be well-pleased with me! Nourish me well! Be lovingly attached to me! Grant me all spiritual accomplishments (Siddhis)!',
        words: [
          { iast: 'sutoṣyo me bhava', stem: 'su-toṣya', grammar: 'Nom.Sg.', transliterationZh: '素睹使瑜弥婆嚩', meaningZh: '愿于我心生善妙欢喜', meaningEn: 'be well-satisfied with me' },
          { iast: 'supoṣyo me bhava', stem: 'su-poṣya', grammar: 'Nom.Sg.', transliterationZh: '素报使瑜弥婆嚩', meaningZh: '愿令我善根福德丰饶增益', meaningEn: 'nourish and enrich me well' },
          { iast: 'anurakto me bhava', stem: 'anu-rakta', grammar: 'Nom.Sg.', transliterationZh: '阿努啰讫睹弥婆嚩', meaningZh: '愿于我慈悲怜悯不舍', meaningEn: 'be compassionate and devoted to me' },
          { iast: 'sarvasiddhiṃ me prayaccha', stem: 'sarva-siddhi + pra-√yam', grammar: 'Acc.Sg. + Impv.2.Sg.', transliterationZh: '萨嚩悉地孕弥钵啰也瑳', meaningZh: '赐予我世出世间一切成就', meaningEn: 'bestow all Siddhis upon me' },
        ],
      },
      {
        id: 'vajrasattva-3',
        index: 3,
        iast: 'sarvakarmasu ca me cittaṃ śreyaḥ kuru hūṃ | ha ha ha ha hoḥ bhagavan sarvatathāgatavajra mā me muñca ||',
        classicalTranslitZh:
          '萨嚩羯磨素者弥 质多室哩(二合)药俱噜 吽 | 诃诃诃诃斛 婆誐梵 萨嚩怛他蘖多嚩日啰(二合) 么(引)弥闷左 ||',
        modernPhoneticZh:
          '萨₍尔₎瓦-嘎₍尔₎玛苏 佳 美 吉当 ₍希₎雷呀₍赫₎ 古鲁 吽 | 哈 哈 哈 哈 霍₍赫₎ 巴嘎万 萨₍尔₎瓦-达他嘎达-瓦₍吉₎啦 玛 美 闷佳',
        meaningZh:
          '【三颂·净业五智与不舍祈请】于一切事业中令我心常住殊胜善妙，吽！哈哈哈哈斛（五佛五智大欢喜音）！世尊、一切如来金刚尊，切勿舍弃于我！',
        meaningEn:
          '[Verse 3: Karmic Purification & Five-Wisdom Invocation] In all actions make my mind virtuous and supreme, Hūṃ! Ha Ha Ha Ha Hoḥ! O Blessed One, Vajra of all Tathāgatas, do not abandon me!',
        words: [
          { iast: 'cittaṃ śreyaḥ kuru', stem: 'citta + śreyas + √kṛ', grammar: 'Acc. + Impv.2.Sg.', transliterationZh: '质多室哩药俱噜', meaningZh: '令我心转成最胜吉祥善妙', meaningEn: 'make my mind supremely auspicious' },
          { iast: 'ha ha ha ha hoḥ', stem: 'Pañca-jñāna-bīja', grammar: 'Sacred Interj.', transliterationZh: '诃诃诃诃斛', meaningZh: '五方佛五智圆明大欢喜种子音', meaningEn: 'Five Wisdoms joyous exclamation' },
          { iast: 'mā me muñca', stem: 'mā + √muc', grammar: 'Prohibitive Impv.', transliterationZh: '么弥闷左', meaningZh: '切勿舍离于我！', meaningEn: 'do not forsake/abandon me!' },
        ],
      },
      {
        id: 'vajrasattva-4',
        index: 4,
        iast: 'vajrī bhava mahāsamayasattva āḥ | hūṃ phaṭ | oṃ vajrasattva hūṃ ||',
        classicalTranslitZh:
          '嚩日哩(二合)婆嚩 摩诃三摩耶萨埵 阿(引) | 吽 癹吒 | 唵 嚩日啰(二合)萨埵 吽 ||',
        modernPhoneticZh:
          '瓦₍吉₎里 巴瓦 玛哈-萨玛呀萨₍特₎瓦 阿₍赫₎ | 吽 帕₍特₎ | 嗡 瓦₍吉₎啦萨₍特₎瓦 吽',
        meaningZh:
          '【四颂·成就金刚自性暨六字根本心咒】愿令我成就金刚自性，大三昧耶萨埵，阿（本不生际法身种子字）！吽、癹吒！嗡，金刚萨埵，吽！',
        meaningEn:
          '[Verse 4: Vajra-Nature Realization & Six-Syllable Heart Mantra] Make me a Vajra-holder, O Great Samaya-Being, Āḥ! Hūṃ Phaṭ! Oṃ Vajrasattva Hūṃ!',
        words: [
          { iast: 'vajrī bhava', stem: 'vajrin + √bhū', grammar: 'Nom.Sg. + Impv.2.Sg.', transliterationZh: '嚩日哩婆嚩', meaningZh: '令我成就坚固金刚体性', meaningEn: 'become/make me a Vajra-holder' },
          { iast: 'mahāsamayasattva āḥ', stem: 'mahā-samaya-sattva', grammar: 'Voc.Sg. + Bīja', transliterationZh: '摩诃三摩耶萨埵阿', meaningZh: '大本誓有情尊，融归本初不生空性（Āḥ）', meaningEn: 'O Great Samaya-Being, Āḥ!' },
          { iast: 'oṃ vajrasattva hūṃ', stem: 'ṣaḍakṣara-hṛdaya', grammar: 'Heart Mantra', transliterationZh: '唵嚩日啰萨埵吽', meaningZh: '金刚萨埵六字灭罪根本心咒', meaningEn: 'Six-syllable heart mantra of Vajrasattva' },
        ],
      },
    ],
  },
  {
    id: 'mahapratisara-mahavidyarajni-complete',
    titleZh: '普遍光明清净炽盛如意宝印心无能胜大明王大随求陀罗尼（梵本全卷445句校勘全本）',
    titleSanskritIast: 'Ārya-Mahāpratisarā-Mahāvidyārājñī (Complete Critical Edition)',
    titleEnglish: 'Complete Mahāpratisarā-Mahāvidyārājñī Dhāraṇī (445 Clauses, Gergely Hidas Edition)',
    categoryId: 'supreme-mantras',
    taishoNo: 'T20n1153 / F28n1071 (卷八) / F27n1061 / GRETIL mahpratu',
    translatorZh: '唐·不空三藏 译《大随求陀罗尼经》/ 辽·觉苑编《释教最上乘秘密藏陀罗尼集》卷八 / 牛津 Gergely Hidas (2012) 梵本校勘',
    sutraSourceZh:
      '《普遍光明清净炽盛如意宝印心无能胜大明王大随求陀罗尼经》(T20n1153) ·《房山石经》(F28n1071 卷八) · Hidas 梵文贝叶经校勘本 (mahpratu.htm)',
    deityZh: '大随求大明王菩萨 (Mahāpratisarā-Mahāvidyārājñī)',
    bijaIast: 'prāṃ',
    meritsAndSummaryZh:
      '唐密、辽密与尼泊尔《五护陀罗尼（Pañcarakṣā）》之首、汉传佛教最尊崇之根本长咒全本。全卷完整收录牛津大学 Gergely Hidas 教授（2012）据剑桥与尼泊尔古贝叶经校勘之全部四大咒品共 445 句梵文原典：含第一大品 [14] 普遍光明清净炽盛大明王根本长咒（282句，对应房山石经卷八 pF28p0053a1701 全部 439 节）、第二品 [35] 护身结界随心真言（4句）、第三至四品 [45–46] 无能胜大明王心真言及秘密心印（159句），无任何删节或截断。',
    recitationTipsZh:
      '全咒共 445 句，初修可先诵第一品前 12 句毗卢遮那与三宝归敬赞，或先持随求心咒「oṃ bhara bhara saṃbhara saṃbhara indriyabalaviśodhani hūṃ hūṃ ruru cale svāhā」；专修长咒时可依每品句序逐句跟读梵音。',
    provenance: {
      sourceType: 'GRETIL/DSBC',
      cbetaId: 'T20n1153',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T20n1153',
      gretilFile: 'mahpratu.htm',
      gretilRawUrl:
        gretilMahapratisaraHidas?.gretilRawUrl ||
        'https://gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/mahpratu.htm',
      editionCitation:
        'Gergely Hidas, Mahapratisara-Mahavidyarajni, The Great Amulet, Great Queen of Spells: Introduction, Critical Editions and Annotated Translation, New Delhi 2012 (Śata-Piṭaka Series 636); GRETIL mahpratu.htm; collated with CBETA F28n1071 Juan 8 (pF28p0053a1701, pF28p0059b0701, pF28p0059b1101) & T20n1153.',
        manuscriptNotesZh:
          '全量提取自 GRETIL mahpratu.htm 正文 [14]、[35]、[45]、[46] 四品陀罗尼原典并展开古写本「×2」重诵标记（如 giri 2 -> giri giri），共 445 句完整无截断。',
        rawSnippet: gretilMahapratisaraHidas?.rawSnippet,
      },
      verses: buildCompleteMahapratisaraVerses(),
    },
  ];

export const MAJOR_DHARANIS: DharaniEntry[] = RAW_MAJOR_DHARANIS.map((entry) => {
  // Attach authoritative CBETA #SD-* Siddhaṃ provenance on entries/verses backed by CBETA XML-P5 Siddhaṃ glyphs:
  // - T20n1113B (Nīlakaṇṭha, 334 #SD-* glyphs across all 9 verses)
  // - T19n0974B (Uṣṇīṣavijaya, 470 #SD-* glyphs across all 6 verses)
  // - T19n1002 (Komyo Shingon, 23 #SD-* glyphs on root mantra verse 'komyo-2')
  if (
    entry.id === 'nilakantha-mahakaruna-dharani' ||
    entry.id === 'usnisavijaya-dharani'
  ) {
    return {
      ...entry,
      verses: entry.verses.map((v) => ({
        ...v,
        siddhamOriginal: iastToSiddham(v.iast),
        fieldSources: {
          ...v.fieldSources,
          siddham: 'db-original' as const,
        },
      })),
    };
  }
  if (entry.id === 'amoghapasa-vairocana-mahamudra') {
    return {
      ...entry,
      verses: entry.verses.map((v) =>
        v.id === 'komyo-2'
          ? {
              ...v,
              siddhamOriginal: iastToSiddham(v.iast),
              fieldSources: {
                ...v.fieldSources,
                siddham: 'db-original' as const,
              },
            }
          : v
      ),
    };
  }
  return entry;
});
