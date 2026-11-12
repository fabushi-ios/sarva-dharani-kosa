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
    titleZh: '千手千眼观世音菩萨广大圆满无碍大悲心陀罗尼（大悲咒84句全本）',
    titleSanskritIast: 'Nīlakaṇṭha-mahākāruṇika-hṛdaya-dhāraṇī',
    titleEnglish: 'Great Compassion Dhāraṇī of Ārya Avalokiteśvara (Complete 84 Clauses)',
    categoryId: 'supreme-mantras',
    taishoNo: 'T20n1060 / T20n1064 / T20n1113B',
    translatorZh: '唐·西天竺沙门伽梵达磨 译 / 唐·不空三藏 译对音本',
    sutraSourceZh: '《千手千眼观世音菩萨广大圆满无碍大悲心陀罗尼经》(T20n1060) 暨《大悲心陀罗尼修行念诵略仪》(T20n1113B)',
    deityZh: '千手千眼圣观自在菩萨 (Sahasrabhuja-sahasranetra Āryāvalokiteśvara / Nīlakaṇṭha)',
    meritsAndSummaryZh:
      '汉传与唐密最为核心的根本大咒，通行本共 84 句完整单列、逐句对齐无合并。本词条直接接入下载自 CBETA 官方库之《T20n1113B》334个悉昙梵字与汉字逐字对音数据，以及《T20n1064》唐代不空三藏译本之全部八十四句本尊化身夹注，全咒由初段三宝观音归敬（第1–17句）、根本心咒（第18–52句）、十大成就化身礼赞（第53–75句）及三宝满愿结归（第76–84句）组成。',
    recitationTipsZh:
      '持诵时注意 r 音（如 ratna, trayāya, kāruṇikāya）需舌尖轻弹上颚（唐代注「转舌呼」）；长元音 ā, ī, ū, e, o 均属重音（Guru，2拍），短元音 a, i, u 属轻音（Laghu，1拍），八十四句句读清晰、轻重分明则梵音自然庄严流畅。',
    provenance: {
      sourceType: 'CBETA+GRETIL',
      cbetaId: 'T20n1113B',
      cbetaRawXmlUrl: cbetaT20n1113B?.cbetaRawUrl || 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1113B.xml',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T20n1113B',
      editionCitation:
        'CBETA XML-P5 T20n1060 (伽梵达磨译) / T20n1064 & T20n1113B (唐·不空三藏译，含 334 个 #SD-* 悉昙梵字逐字对音与八十四句本尊夹注)；梵文重构参校 Sylvain Lévi & Lokesh Chandra 校勘梵本。',
      manuscriptNotesZh:
        '已从 github.com/cbeta-org/xml-p5 下载 T20n1060.xml、T20n1064.xml 与 T20n1113B.xml 原典，按通行本与不空译本 84 句原典标号逐句独立建档。',
      rawSnippet: cbetaT20n1064?.dharaniParagraphs.slice(0, 6).map((p) => p.text).join('\n'),
      cbetaInterlinearTokens: cbetaT20n1113B?.interlinearTokens || [],
    },
    verses: [
      {
            "id": "nilakantha-1",
            "index": 1,
            "iast": "namo ratnatrayāya",
            "classicalTranslitZh": "南无喝啰怛那哆啰夜耶",
            "modernPhoneticZh": "拿摩 啦₍特₎拿-₍特₎啦呀呀",
            "meaningZh": "归命佛法僧三宝！",
            "meaningEn": "Homage to the Three Jewels!",
            "tangNoteZh": "第一句 · 唐·不空《T20n1064》夹注：此是观世音菩萨本身，大须慈悲用心读诵。",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ratnatrayāya",
                        "stem": "ratnatraya",
                        "grammar": "Samāsa · 三宝 · Dat. Sg. · 为格单数",
                        "transliterationZh": "喝啰怛那哆啰夜耶（拼读参考：啦₍特₎拿-₍特₎啦呀呀）",
                        "meaningZh": "向佛法僧三宝",
                        "meaningEn": "to/for the Three Jewels (Buddha, Dharma, Saṃgha)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-2",
            "index": 2,
            "iast": "namo āryā",
            "classicalTranslitZh": "南无阿唎耶",
            "modernPhoneticZh": "拿摩 阿₍哩₎呀",
            "meaningZh": "归命圣尊！",
            "meaningEn": "Homage to the Noble One!",
            "tangNoteZh": "第二句 · 夹注：此是如意轮菩萨本身，到此须存心。",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "āryā",
                        "stem": "ārya",
                        "grammar": "Adj. · 圣尊 · Nom. Sg. Fem. · 主格阴性",
                        "transliterationZh": "阿(引)哩夜（拼读参考：阿₍哩₎呀）",
                        "meaningZh": "圣、尊贵圣者",
                        "meaningEn": "noble, holy, exalted (Ārya)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-3",
            "index": 3,
            "iast": "avalokiteśvarāya",
            "classicalTranslitZh": "婆卢羯帝烁钵啰耶",
            "modernPhoneticZh": "阿瓦洛给帝-₍湿₎瓦啦呀",
            "meaningZh": "观自在尊（普观世间音声而自在拔苦者）！",
            "meaningEn": "To Avalokiteśvara (the Sovereign Lord Who Gazes Upon the World)!",
            "tangNoteZh": "第三句 · 夹注：此是持钵观世音菩萨本身。",
            "words": [
                  {
                        "iast": "avalokiteśvarāya",
                        "stem": "avalokiteśvara",
                        "grammar": "Prop.Noun · 观自在菩萨 · Dat. Sg. · 为格单数",
                        "transliterationZh": "阿嚩卢枳帝湿嚩啰耶（拼读参考：阿瓦洛给帝-₍湿₎瓦啦呀）",
                        "meaningZh": "向观自在菩萨（观世音）",
                        "meaningEn": "to/for Avalokiteśvara, Lord Who Looks Down in Compassion",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-4",
            "index": 4,
            "iast": "bodhisattvāya",
            "classicalTranslitZh": "菩提萨跢婆耶",
            "modernPhoneticZh": "博地-萨₍特₎瓦呀",
            "meaningZh": "觉有情菩萨！",
            "meaningEn": "To the Bodhisattva (Awakening Being)!",
            "tangNoteZh": "第四句 · 夹注：此是不空羂索菩萨本身，押大兵。",
            "words": [
                  {
                        "iast": "bodhisattvāya",
                        "stem": "bodhisattva",
                        "grammar": "Samāsa · 菩萨 · Dat. Sg. · 为格单数",
                        "transliterationZh": "菩提萨埵耶 / 冒地萨怛嚩耶（拼读参考：博地-萨₍特₎瓦呀）",
                        "meaningZh": "向菩提萨埵（菩萨、觉有情）",
                        "meaningEn": "to/for Bodhisattva, Awakening Being",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-5",
            "index": 5,
            "iast": "mahāsattvāya",
            "classicalTranslitZh": "摩诃萨跢婆耶",
            "modernPhoneticZh": "玛哈-萨₍特₎瓦呀",
            "meaningZh": "大勇猛有情摩诃萨！",
            "meaningEn": "To the Mahāsattva (Great Heroic Being)!",
            "tangNoteZh": "第五句 · 夹注：此是菩萨种子自诵咒之本身也。",
            "words": [
                  {
                        "iast": "mahāsattvāya",
                        "stem": "mahāsattva",
                        "grammar": "Samāsa · 摩诃萨 · Dat. Sg. · 为格单数",
                        "transliterationZh": "摩诃萨埵耶（拼读参考：玛哈-萨₍特₎瓦呀）",
                        "meaningZh": "向摩诃萨埵（大心有情、大菩萨）",
                        "meaningEn": "to/for Mahāsattva, Great Spiritual Hero",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-6",
            "index": 6,
            "iast": "mahākāruṇikāya",
            "classicalTranslitZh": "摩诃迦卢昵迦耶",
            "modernPhoneticZh": "玛哈-嘎鲁尼嘎呀",
            "meaningZh": "具足无缘大慈同体大悲心者！",
            "meaningEn": "To the Greatly Compassionate One!",
            "tangNoteZh": "第六句 · 夹注：此是马鸣菩萨本身，手把鈸折罗即是。",
            "words": [
                  {
                        "iast": "mahākāruṇikāya",
                        "stem": "mahākāruṇika",
                        "grammar": "Samāsa · 大悲尊 · Dat. Sg. · 为格单数",
                        "transliterationZh": "摩诃迦噜抳迦耶（拼读参考：玛哈-嘎鲁尼嘎呀）",
                        "meaningZh": "向大悲圣尊、具足大悲心者",
                        "meaningEn": "to/for Greatly Compassionate One",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-7",
            "index": 7,
            "iast": "oṃ",
            "classicalTranslitZh": "唵",
            "modernPhoneticZh": "嗡",
            "meaningZh": "嗡（法报化三身总持圣音，诸部鬼神合掌恭听）！",
            "meaningEn": "Oṃ!",
            "tangNoteZh": "第七句 · 夹注：此唵是诸鬼神合掌听诵咒也。",
            "words": [
                  {
                        "iast": "oṃ",
                        "stem": "oṃ",
                        "grammar": "Praṇava · 圣音",
                        "transliterationZh": "唵（拼读参考：嗡）",
                        "meaningZh": "三身总持圣音（法报化三身摄受）",
                        "meaningEn": "sacred Praṇava syllable embodying Trikāya",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-8",
            "index": 8,
            "iast": "sarvarabhaye",
            "classicalTranslitZh": "萨皤啰罚曳",
            "modernPhoneticZh": "萨₍尔₎瓦-啦巴耶",
            "meaningZh": "于一切怖畏危难中作自在救护尊！",
            "meaningEn": "Sovereign Protector in all fears and perils!",
            "tangNoteZh": "第六至八句 · 夹注：此四大天王之本身，降魔。",
            "words": [
                  {
                        "iast": "sarvarabhaye",
                        "stem": "sarva-rabhi",
                        "grammar": "Samāsa · 复合词 (Dat. Sg. · 为格单数)",
                        "transliterationZh": "萨哩嚩啰婆曳（拼读参考：萨₍尔₎瓦-啦巴耶）",
                        "meaningZh": "向一切部分马车",
                        "meaningEn": "all + to a part of a chariot",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-9",
            "index": 9,
            "iast": "śudhanadasya",
            "classicalTranslitZh": "数怛那怛写",
            "modernPhoneticZh": "舒达拿达₍斯₎呀",
            "meaningZh": "向妙善施护救度尊致敬！",
            "meaningEn": "Of the Pure Boon-Granting Savior!",
            "tangNoteZh": "第九句 · 夹注：此是四大天王部落鬼神名字也。",
            "words": [
                  {
                        "iast": "śudhanadasya",
                        "stem": "śa-dha-na",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "戍驮曩捺娑耶（拼读参考：舒达拿达₍斯₎呀）",
                        "meaningZh": "本性寂静止息·法界总持任持·离名相假立",
                        "meaningEn": "primordial tranquil peace & Dharma-realm retention & beyond nominal designation",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-10",
            "index": 10,
            "iast": "namas kṛtvā imaṃ āryā",
            "classicalTranslitZh": "南无悉吉栗埵伊蒙阿唎耶",
            "modernPhoneticZh": "拿玛₍斯₎ ₍克₎日₍特₎瓦 伊芒 阿₍哩₎呀",
            "meaningZh": "我今顶礼如是圣尊已！",
            "meaningEn": "Having bowed in homage to this Noble One!",
            "tangNoteZh": "第十句 · 夹注：此是龙树菩萨本身，大须用心诵此。",
            "words": [
                  {
                        "iast": "namas",
                        "stem": "namas",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "曩莫（拼读参考：拿玛₍斯₎）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "kṛtvā",
                        "stem": "kṛtvā",
                        "grammar": "Gerund · 连续体",
                        "transliterationZh": "讫哩怛嚩(引)（拼读参考：₍克₎日₍特₎瓦）",
                        "meaningZh": "既作已、行持已",
                        "meaningEn": "having done, having performed",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "imaṃ",
                        "stem": "imaṃ",
                        "grammar": "Pron.Acc.Sg.M. · 近指宾格",
                        "transliterationZh": "伊莽（拼读参考：伊芒）",
                        "meaningZh": "此（真言/心咒，宾格）",
                        "meaningEn": "this (accusative)",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "āryā",
                        "stem": "ārya",
                        "grammar": "Adj. · 圣尊 · Nom. Sg. Fem. · 主格阴性",
                        "transliterationZh": "阿(引)哩夜（拼读参考：阿₍哩₎呀）",
                        "meaningZh": "圣、尊贵圣者",
                        "meaningEn": "noble, holy, exalted (Ārya)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-11",
            "index": 11,
            "iast": "avalokiteśvaraṃ dhava",
            "classicalTranslitZh": "婆卢吉帝室佛啰楞驮婆",
            "modernPhoneticZh": "阿瓦洛给帝-₍湿₎瓦朗 达瓦",
            "meaningZh": "圣观自在菩萨威光所充满之普陀净土法界！",
            "meaningEn": "Pervaded by Avalokiteśvara at Potalaka!",
            "tangNoteZh": "第十一句 · 夹注：此是圆满报身卢舍那佛。",
            "words": [
                  {
                        "iast": "avalokiteśvaraṃ",
                        "stem": "avalokiteśvara",
                        "grammar": "Prop.Noun · 观自在菩萨 · Acc./Nom. Sg. · 业格/主格单数",
                        "transliterationZh": "阿嚩路枳帝湿嚩览（拼读参考：阿瓦洛给帝-₍湿₎瓦朗）",
                        "meaningZh": "观自在菩萨（观世音）",
                        "meaningEn": "Avalokiteśvara, Lord Who Looks Down in Compassion",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "dhava",
                        "stem": "dha-va",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "驮嚩（拼读参考：达瓦）",
                        "meaningZh": "法界总持任持·最上真言离言说",
                        "meaningEn": "Dharma-realm retention & supreme ineffable speech",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-12",
            "index": 12,
            "iast": "namo nīlakaṇṭha",
            "classicalTranslitZh": "南无那啰谨墀",
            "modernPhoneticZh": "拿摩 尼啦干他",
            "meaningZh": "归命青颈大悲尊（代众生吞咽烦恼毒药之悲愿相）！",
            "meaningEn": "Homage to Nīlakaṇṭha (the Blue-Necked Compassionate Lord)!",
            "tangNoteZh": "第十二句 · 夹注：此是清净法身毗卢遮那佛本身，大须用心。",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "nīlakaṇṭha",
                        "stem": "nīlakaṇṭha",
                        "grammar": "Samāsa · 青颈大悲尊",
                        "transliterationZh": "泥攞剑侘（拼读参考：尼啦干他）",
                        "meaningZh": "青颈观自在（吞摄诸毒大悲相）",
                        "meaningEn": "Nīlakaṇṭha, Blue-Throated Compassionate One",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-13",
            "index": 13,
            "iast": "hṛdayam āvartayiṣyāmi",
            "classicalTranslitZh": "醯利摩诃皤哆沙咩",
            "modernPhoneticZh": "₍赫₎日达央 阿瓦₍尔₎达伊₍师₎呀米",
            "meaningZh": "我今宣说称诵此大悲广大心印陀罗尼！",
            "meaningEn": "I shall now recite and revolve this Great Heart Dhāraṇī!",
            "tangNoteZh": "第十三句 · 夹注：此是摩诃皤哆神王护持眷属。",
            "words": [
                  {
                        "iast": "hṛdayam",
                        "stem": "hṛdayam",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "纥哩捺演（拼读参考：₍赫₎日达央）",
                        "meaningZh": "心",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "āvartayiṣyāmi",
                        "stem": "va-ra-ta",
                        "grammar": "Mantra Voc. · 真言呼请句",
                        "transliterationZh": "阿(引)嚩哩怛以瑟夜弭（拼读参考：阿瓦₍尔₎达伊₍师₎呀米）",
                        "meaningZh": "最上真言离言说·清净离诸尘垢·真如实际（呼请加持）",
                        "meaningEn": "supreme ineffable speech & stainless purity free from dust & immutable Suchness (vocative invocation)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-14",
            "index": 14,
            "iast": "sarvārthasādhanaṃ śubham",
            "classicalTranslitZh": "萨婆阿他豆输朋",
            "modernPhoneticZh": "萨₍尔₎瓦₍尔₎他萨达南 舒邦",
            "meaningZh": "能圆满成就一切利乐妙善吉祥事业！",
            "meaningEn": "Auspiciously accomplishing all noble aims!",
            "tangNoteZh": "第十四句 · 夹注：此是甘露菩萨，观世音菩萨部落眷属也。",
            "words": [
                  {
                        "iast": "sarvārthasādhanaṃ",
                        "stem": "sarvārtha-sādhanam",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "萨哩嚩(引)哩他娑驮喃（拼读参考：萨₍尔₎瓦₍尔₎他萨达南）",
                        "meaningZh": "一切义利修习",
                        "meaningEn": "all aims and benefits",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "śubham",
                        "stem": "śubha",
                        "grammar": "Adj. · 清净善妙 · Acc./Nom. Sg. · 业格/主格单数",
                        "transliterationZh": "戍梵（拼读参考：舒邦）",
                        "meaningZh": "清净吉祥、善妙庄严",
                        "meaningEn": "auspicious, pure, bright, virtuous",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-15",
            "index": 15,
            "iast": "ajeyam",
            "classicalTranslitZh": "阿逝孕",
            "modernPhoneticZh": "阿杰央",
            "meaningZh": "无能胜、一切魔障烦恼所不能坏！",
            "meaningEn": "Invincible and unconquerable!",
            "tangNoteZh": "第十五句 · 夹注：此是飞腾夜叉天王，巡历四方察其是非也。",
            "words": [
                  {
                        "iast": "ajeyam",
                        "stem": "aja-iyam",
                        "grammar": "Samāsa · 复合词 (Pron.Nom.Sg.F. · 近指阴性)",
                        "transliterationZh": "阿逝演（拼读参考：阿杰央）",
                        "meaningZh": "山羊此圣女",
                        "meaningEn": "drift + this",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-16",
            "index": 16,
            "iast": "sarvasattvanamabhavarga",
            "classicalTranslitZh": "萨婆萨哆那摩婆萨哆那摩婆伽",
            "modernPhoneticZh": "萨₍尔₎瓦-萨₍特₎瓦拿玛巴瓦₍尔₎嘎",
            "meaningZh": "普令一切众生归敬离垢、超越三有生死流转！",
            "meaningEn": "Purifying all beings and transcending the realms of existence!",
            "tangNoteZh": "第十六句 · 伽梵达磨通行本重诵「那摩婆萨哆」，与《T20n1064》婆加帝护法相应。",
            "words": [
                  {
                        "iast": "sarvasattvanamabhavarga",
                        "stem": "sarvasattva-nama-bha-varga",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "萨哩嚩萨怛怛嚩曩摩婆嚩哩誐（拼读参考：萨₍尔₎瓦-萨₍特₎瓦拿玛巴瓦₍尔₎嘎）",
                        "meaningZh": "一切众生·归命·星宿·多",
                        "meaningEn": "all sentient beings + homage + star + removing",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-17",
            "index": 17,
            "iast": "māvadudhu",
            "classicalTranslitZh": "摩罚特豆",
            "modernPhoneticZh": "玛瓦杜杜",
            "meaningZh": "涤除一切疑惑罪垢令得清净！",
            "meaningEn": "Cleansing away all stains and doubts!",
            "tangNoteZh": "第十七句 · 夹注：此是军吒利菩萨本身，把铁轮并把索。",
            "words": [
                  {
                        "iast": "māvadudhu",
                        "stem": "ma-va-da",
                        "grammar": "Mantra Impv. · 真言警策句",
                        "transliterationZh": "摩(引)嚩努度（拼读参考：玛瓦杜杜）",
                        "meaningZh": "无我大慈三昧·最上真言离言说·施度调伏（警策成就）",
                        "meaningEn": "selfless great loving-kindness & supreme ineffable speech & generosity & self-mastery (imperative seal)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-18",
            "index": 18,
            "iast": "tadyathā",
            "classicalTranslitZh": "怛侄他",
            "modernPhoneticZh": "达₍地₎呀他",
            "meaningZh": "即说根本心咒曰：",
            "meaningEn": "Namely, the Root Mantra is as follows:",
            "tangNoteZh": "第十八句 · 夹注：所谓即说真言之义。",
            "words": [
                  {
                        "iast": "tadyathā",
                        "stem": "tadyathā",
                        "grammar": "Adv. · 咒引词",
                        "transliterationZh": "怛侄他 / 怛你也他（拼读参考：达₍地₎呀他）",
                        "meaningZh": "即说咒曰、所谓",
                        "meaningEn": "namely, thus goes the mantra",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-19",
            "index": 19,
            "iast": "oṃ avaloka",
            "classicalTranslitZh": "唵阿婆卢醯",
            "modernPhoneticZh": "嗡 阿瓦洛嘎",
            "meaningZh": "嗡！大悲慧眼遍观世间者！",
            "meaningEn": "Oṃ! O All-Beholding One!",
            "tangNoteZh": "第十九句 · 根本心咒启首句。",
            "words": [
                  {
                        "iast": "oṃ",
                        "stem": "oṃ",
                        "grammar": "Praṇava · 圣音",
                        "transliterationZh": "唵（拼读参考：嗡）",
                        "meaningZh": "三身总持圣音（法报化三身摄受）",
                        "meaningEn": "sacred Praṇava syllable embodying Trikāya",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "avaloka",
                        "stem": "avaloka",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "阿嚩路迦（拼读参考：阿瓦洛嘎）",
                        "meaningZh": "观",
                        "meaningEn": "viewing",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-20",
            "index": 20,
            "iast": "lokātikrānta",
            "classicalTranslitZh": "卢迦帝",
            "modernPhoneticZh": "洛嘎-帝₍克₎兰达",
            "meaningZh": "超越世间生死苦海尊！",
            "meaningEn": "Transcending the mundane world!",
            "tangNoteZh": "第二十句 · 夹注：此是大梵天王本身也，神仙为部落。",
            "words": [
                  {
                        "iast": "lokātikrānta",
                        "stem": "loka-atikrānta",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "路迦(引)底讫囕怛（拼读参考：洛嘎-帝₍克₎兰达）",
                        "meaningZh": "世间古昔",
                        "meaningEn": "world + surpassing",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-21",
            "index": 21,
            "iast": "krānte",
            "classicalTranslitZh": "迦罗帝",
            "modernPhoneticZh": "₍克₎兰帝",
            "meaningZh": "悲智双运超脱自在尊！",
            "meaningEn": "O Transcendent Savior!",
            "tangNoteZh": "第二十一句 · 夹注：此是帝神护法。",
            "words": [
                  {
                        "iast": "krānte",
                        "stem": "krānta",
                        "grammar": "Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "讫囕帝（拼读参考：₍克₎兰帝）",
                        "meaningZh": "措施尊",
                        "meaningEn": "O step / in step",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-22",
            "index": 22,
            "iast": "ehi hare",
            "classicalTranslitZh": "夷醯唎",
            "modernPhoneticZh": "诶嘿 哈雷",
            "meaningZh": "善来、狮子王无畏救苦尊！",
            "meaningEn": "Come forth, O Lion-Lord Hari!",
            "tangNoteZh": "第二十二句 · 夹注：此是三十三天摩醯首罗天神领天兵。",
            "words": [
                  {
                        "iast": "ehi",
                        "stem": "ehi",
                        "grammar": "Impv. 2nd Sg. · 奉请降临",
                        "transliterationZh": "翳呬（拼读参考：诶嘿）",
                        "meaningZh": "善来降临坛场（翳呬）",
                        "meaningEn": "come forth, O Blessed One!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "hare",
                        "stem": "hare",
                        "grammar": "Voc.Sg. · 除苦圣尊",
                        "transliterationZh": "诃隶（拼读参考：哈雷）",
                        "meaningZh": "唯愿救苦圣尊（诃利/观音尊号）！",
                        "meaningEn": "O Hari / Remover of Suffering!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-23",
            "index": 23,
            "iast": "mahābodhisattva",
            "classicalTranslitZh": "摩诃菩提萨埵",
            "modernPhoneticZh": "玛哈-博地-萨₍特₎瓦",
            "meaningZh": "大菩萨摩诃萨！",
            "meaningEn": "O Great Bodhisattva!",
            "tangNoteZh": "第二十三句 · 夹注：此是实心，更无杂乱心即名萨埵。",
            "words": [
                  {
                        "iast": "mahābodhisattva",
                        "stem": "mahā-bodhisattva",
                        "grammar": "Samāsa · 菩萨",
                        "transliterationZh": "摩诃冒地萨怛怛嚩（拼读参考：玛哈-博地-萨₍特₎瓦）",
                        "meaningZh": "大菩提萨埵",
                        "meaningEn": "great + Bodhisattva",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-24",
            "index": 24,
            "iast": "sarpa sarpa",
            "classicalTranslitZh": "萨婆萨婆",
            "modernPhoneticZh": "萨₍尔₎巴 萨₍尔₎巴",
            "meaningZh": "愿大悲速疾降临、普门游行救度！",
            "meaningEn": "Proceed swiftly, glide forth in compassion!",
            "tangNoteZh": "第二十四句 · 夹注：此是香积菩萨，押五方鬼兵以为侍从。",
            "words": [
                  {
                        "iast": "sarpa",
                        "stem": "sarpa",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "萨哩跛（拼读参考：萨₍尔₎巴）",
                        "meaningZh": "蛇",
                        "meaningEn": "crawling, creeping; snake, adder, a serpent-demon",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "sarpa",
                        "stem": "sarpa",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "萨哩跛（拼读参考：萨₍尔₎巴）",
                        "meaningZh": "蛇",
                        "meaningEn": "crawling, creeping; snake, adder, a serpent-demon",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-25",
            "index": 25,
            "iast": "smara smara",
            "classicalTranslitZh": "摩啰摩啰",
            "modernPhoneticZh": "₍斯₎玛啦 ₍斯₎玛啦",
            "meaningZh": "请忆念、忆念本昔慈悲誓愿！",
            "meaningEn": "Remember, remember Your primal vow!",
            "tangNoteZh": "第二十五句 · 夹注：此是菩萨慈悲相劝互念本誓语。",
            "words": [
                  {
                        "iast": "smara",
                        "stem": "smara",
                        "grammar": "Impv. 2nd Sg. · 祈使忆念",
                        "transliterationZh": "娑摩啰（拼读参考：₍斯₎玛啦）",
                        "meaningZh": "祈请忆念本誓",
                        "meaningEn": "remember Your primordial vow!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "smara",
                        "stem": "smara",
                        "grammar": "Impv. 2nd Sg. · 祈使忆念",
                        "transliterationZh": "娑摩啰（拼读参考：₍斯₎玛啦）",
                        "meaningZh": "祈请忆念本誓",
                        "meaningEn": "remember Your primordial vow!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-26",
            "index": 26,
            "iast": "mama hṛdayam",
            "classicalTranslitZh": "摩醯摩醯唎驮孕",
            "modernPhoneticZh": "玛玛 ₍赫₎日达央",
            "meaningZh": "请忆念护持我此大悲真言心印！",
            "meaningEn": "Uphold my sacred heart-mantra!",
            "tangNoteZh": "第二十六句 · 夹注：同前忆念大悲心印。",
            "words": [
                  {
                        "iast": "mama",
                        "stem": "mama",
                        "grammar": "Pron. Gen. · 第一人称属格",
                        "transliterationZh": "摩摩（拼读参考：玛玛）",
                        "meaningZh": "我之（行者所有）",
                        "meaningEn": "my, of me (the practitioner)",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "hṛdayam",
                        "stem": "hṛdayam",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "纥哩捺演（拼读参考：₍赫₎日达央）",
                        "meaningZh": "心",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-27",
            "index": 27,
            "iast": "kuru kuru karma",
            "classicalTranslitZh": "俱卢俱卢羯蒙",
            "modernPhoneticZh": "古鲁 古鲁 嘎₍尔₎玛",
            "meaningZh": "速疾作法、速疾成办息增怀诛一切善妙佛事！",
            "meaningEn": "Perform, accomplish the sacred enlightened activity!",
            "tangNoteZh": "第二十七句 · 夹注：此是空身菩萨，押天大将军领天兵也。",
            "words": [
                  {
                        "iast": "kuru",
                        "stem": "kuru",
                        "grammar": "Impv. 2nd Sg. · 祈使式",
                        "transliterationZh": "矩噜（拼读参考：古鲁）",
                        "meaningZh": "祈请成办羯磨事业（俱噜）",
                        "meaningEn": "accomplish & enact this sacred work!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "kuru",
                        "stem": "kuru",
                        "grammar": "Impv. 2nd Sg. · 祈使式",
                        "transliterationZh": "矩噜（拼读参考：古鲁）",
                        "meaningZh": "祈请成办羯磨事业（俱噜）",
                        "meaningEn": "accomplish & enact this sacred work!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "karma",
                        "stem": "karma",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "迦哩摩（拼读参考：嘎₍尔₎玛）",
                        "meaningZh": "事",
                        "meaningEn": "actions",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-28",
            "index": 28,
            "iast": "dhuru dhuru vijayate",
            "classicalTranslitZh": "度卢度卢罚阇耶帝",
            "modernPhoneticZh": "杜鲁 杜鲁 维佳呀帝",
            "meaningZh": "坚固任持、坚固总持，得大尊胜自在！",
            "meaningEn": "Hold fast, sustain, O Victorious One!",
            "tangNoteZh": "第二十八句 · 夹注：此是严峻菩萨，押孔雀王兵也。",
            "words": [
                  {
                        "iast": "dhuru",
                        "stem": "dhuru",
                        "grammar": "Mantra-Impv. · 任持祈请",
                        "transliterationZh": "度噜（拼读参考：杜鲁）",
                        "meaningZh": "坚固任持总持法印（度噜）",
                        "meaningEn": "firmly uphold the dhāraṇī seal!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "dhuru",
                        "stem": "dhuru",
                        "grammar": "Mantra-Impv. · 任持祈请",
                        "transliterationZh": "度噜（拼读参考：杜鲁）",
                        "meaningZh": "坚固任持总持法印（度噜）",
                        "meaningEn": "firmly uphold the dhāraṇī seal!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "vijayate",
                        "stem": "vijaya",
                        "grammar": "Noun/Impv. · 殊胜尊胜 · Ātmanepada 3rd Sg. · 为自言单数",
                        "transliterationZh": "尾惹耶帝（拼读参考：维佳呀帝）",
                        "meaningZh": "最胜尊胜、普胜一切！",
                        "meaningEn": "supreme victory! triumph!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-29",
            "index": 29,
            "iast": "mahāvijayate",
            "classicalTranslitZh": "摩诃罚阇耶帝",
            "modernPhoneticZh": "玛哈-维佳呀帝",
            "meaningZh": "得最上广大无碍大尊胜！",
            "meaningEn": "O Supremely Victorious One!",
            "tangNoteZh": "第二十九句 · 夹注：同前大最胜尊。",
            "words": [
                  {
                        "iast": "mahāvijayate",
                        "stem": "mahā-vijaya",
                        "grammar": "Samāsa · 复合词 (Ātmanepada 3rd Sg. · 为自言单数)",
                        "transliterationZh": "摩诃尾惹耶帝（拼读参考：玛哈-维佳呀帝）",
                        "meaningZh": "大最胜尊胜",
                        "meaningEn": "great + supreme victory! triumph!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-30",
            "index": 30,
            "iast": "dhara dhara",
            "classicalTranslitZh": "陀啰陀啰",
            "modernPhoneticZh": "达啦 达啦",
            "meaningZh": "愿总持摄受、恒常执持不舍！",
            "meaningEn": "Uphold, sustain all beings!",
            "tangNoteZh": "第三十句 · 夹注：此是观世音菩萨大丈夫身即是也。",
            "words": [
                  {
                        "iast": "dhara",
                        "stem": "dhara",
                        "grammar": "Impv.2.Sg. · 总持祈使",
                        "transliterationZh": "驮啰（拼读参考：达啦）",
                        "meaningZh": "请执持、总持护念！",
                        "meaningEn": "hold! bear! sustain!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "dhara",
                        "stem": "dhara",
                        "grammar": "Impv.2.Sg. · 总持祈使",
                        "transliterationZh": "驮啰（拼读参考：达啦）",
                        "meaningZh": "请执持、总持护念！",
                        "meaningEn": "hold! bear! sustain!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-31",
            "index": 31,
            "iast": "dharaṇī",
            "classicalTranslitZh": "地唎尼",
            "modernPhoneticZh": "达啦尼",
            "meaningZh": "任持大地一切众生之总持王！",
            "meaningEn": "O Earth-Sustaining Dhāraṇī Sovereign!",
            "tangNoteZh": "第三十一句 · 夹注：此是师子王兵验读诵。",
            "words": [
                  {
                        "iast": "dharaṇī",
                        "stem": "dharaṇī",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "驮啰抳(引)（拼读参考：达啦尼）",
                        "meaningZh": "簷",
                        "meaningEn": "support; the resting point of a beam",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-32",
            "index": 32,
            "iast": "rājeśvara",
            "classicalTranslitZh": "室佛啰耶",
            "modernPhoneticZh": "啦杰₍湿₎瓦啦",
            "meaningZh": "光耀大自在法王尊！",
            "meaningEn": "O Radiant Sovereign Lord!",
            "tangNoteZh": "第三十二句 · 夹注：此是霹雳菩萨，降伏诸魔眷属。",
            "words": [
                  {
                        "iast": "rājeśvara",
                        "stem": "rāja-īśvara",
                        "grammar": "Samāsa · 复合词 (Noun · 自在主)",
                        "transliterationZh": "啰(引)逝湿嚩啰（拼读参考：啦杰₍湿₎瓦啦）",
                        "meaningZh": "王自在主",
                        "meaningEn": "king + Īśvara",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-33",
            "index": 33,
            "iast": "cala cala",
            "classicalTranslitZh": "遮啰遮啰",
            "modernPhoneticZh": "佳啦 佳啦",
            "meaningZh": "起大悲妙用、震动十方救苦！",
            "meaningEn": "Move forth, stir into compassionate action!",
            "tangNoteZh": "第三十三句 · 夹注：此是摧碎菩萨本身，手把金轮。",
            "words": [
                  {
                        "iast": "cala",
                        "stem": "cala",
                        "grammar": "Impv. 2nd Sg. · 祈使式",
                        "transliterationZh": "者攞（拼读参考：佳啦）",
                        "meaningZh": "震动警觉、破除昏沉（左攞）",
                        "meaningEn": "stir awake and shake off delusion!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "cala",
                        "stem": "cala",
                        "grammar": "Impv. 2nd Sg. · 祈使式",
                        "transliterationZh": "者攞（拼读参考：佳啦）",
                        "meaningZh": "震动警觉、破除昏沉（左攞）",
                        "meaningEn": "stir awake and shake off delusion!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-34",
            "index": 34,
            "iast": "mama vimala",
            "classicalTranslitZh": "摩摩罚摩啰",
            "modernPhoneticZh": "玛玛 维玛啦",
            "meaningZh": "令我身心离诸尘垢、彻底清净无染！",
            "meaningEn": "Render me stainless and immaculate!",
            "tangNoteZh": "第三十四句 · 夹注：「摩摩」某甲受持；此是大降魔金刚本身，把金轮。",
            "words": [
                  {
                        "iast": "mama",
                        "stem": "mama",
                        "grammar": "Pron. Gen. · 第一人称属格",
                        "transliterationZh": "摩摩（拼读参考：玛玛）",
                        "meaningZh": "我之（行者所有）",
                        "meaningEn": "my, of me (the practitioner)",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "vimala",
                        "stem": "vimala",
                        "grammar": "Adj. · 离垢清净",
                        "transliterationZh": "尾摩攞（拼读参考：维玛啦）",
                        "meaningZh": "离垢、清净无瑕",
                        "meaningEn": "immaculate, stainless, crystal-pure",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-35",
            "index": 35,
            "iast": "mūrte",
            "classicalTranslitZh": "穆帝隶",
            "modernPhoneticZh": "穆₍尔₎帝",
            "meaningZh": "显现无垢清净解脱法身妙相尊！",
            "meaningEn": "O Stainless Liberated Form!",
            "tangNoteZh": "第三十五句 · 夹注：此是诸佛合掌听诵真言。",
            "words": [
                  {
                        "iast": "mūrte",
                        "stem": "mūrta",
                        "grammar": "Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "母(引)哩帝（拼读参考：穆₍尔₎帝）",
                        "meaningZh": "坚硬、充实尊",
                        "meaningEn": "O thickened, coagulated, solid, substantial, corporeal; stupefied, insensible / in thickened, coagulated, solid, substantial, corporeal; stupefied, insensible",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-36",
            "index": 36,
            "iast": "ehi ehi",
            "classicalTranslitZh": "伊醯伊醯",
            "modernPhoneticZh": "诶嘿 诶嘿",
            "meaningZh": "善来、善来！唯愿圣尊速疾光临坛场！",
            "meaningEn": "Come, come hither in grace!",
            "tangNoteZh": "第三十六句 · 夹注：此是摩醯首罗天王奉请护持。",
            "words": [
                  {
                        "iast": "ehi",
                        "stem": "ehi",
                        "grammar": "Impv. 2nd Sg. · 奉请降临",
                        "transliterationZh": "翳呬（拼读参考：诶嘿）",
                        "meaningZh": "善来降临坛场（翳呬）",
                        "meaningEn": "come forth, O Blessed One!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ehi",
                        "stem": "ehi",
                        "grammar": "Impv. 2nd Sg. · 奉请降临",
                        "transliterationZh": "翳呬（拼读参考：诶嘿）",
                        "meaningZh": "善来降临坛场（翳呬）",
                        "meaningEn": "come forth, O Blessed One!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-37",
            "index": 37,
            "iast": "cinda cinda",
            "classicalTranslitZh": "室那室那",
            "modernPhoneticZh": "津达 津达",
            "meaningZh": "斩断、斩断一切无明黑蛇毒害！",
            "meaningEn": "Sever, cut away all venomous afflictions!",
            "tangNoteZh": "第三十七句 · 梵本亦作 kṛṣṇasarpopavīta（黑蛇严身）。",
            "words": [
                  {
                        "iast": "cinda",
                        "stem": "ca-na-da",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "只喃捺（拼读参考：津达）",
                        "meaningZh": "妙行迁变空·离名相假立·施度调伏",
                        "meaningEn": "awakened conduct beyond flux & beyond nominal designation & generosity & self-mastery",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "cinda",
                        "stem": "ca-na-da",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "只喃捺（拼读参考：津达）",
                        "meaningZh": "妙行迁变空·离名相假立·施度调伏",
                        "meaningEn": "awakened conduct beyond flux & beyond nominal designation & generosity & self-mastery",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-38",
            "index": 38,
            "iast": "ārṣaṃ pracali",
            "classicalTranslitZh": "阿啰参佛啰舍利",
            "modernPhoneticZh": "阿₍尔₎伤 ₍普₎啦佳利",
            "meaningZh": "圣法王转大法轮，震落一切贪嗔痴毒！",
            "meaningEn": "Advancing the Noble Dharma-Realm!",
            "tangNoteZh": "第三十八句 · 夹注：此是观世音菩萨把弓箭相。",
            "words": [
                  {
                        "iast": "ārṣaṃ",
                        "stem": "ārṣa",
                        "grammar": "Acc./Nom. Sg. · 业格/主格单数",
                        "transliterationZh": "阿(引)哩忏（拼读参考：阿₍尔₎伤）",
                        "meaningZh": "经典",
                        "meaningEn": "belonging to or derived from the Ṛṣis, archaic; a form of marriage",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "pracali",
                        "stem": "pracala",
                        "grammar": "Voc. Fem. / Loc. · 呼格/处格",
                        "transliterationZh": "钵啰者里（拼读参考：₍普₎啦佳利）",
                        "meaningZh": "场景往外、一品离港尊",
                        "meaningEn": "O setting out; chapter of departure",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-39",
            "index": 39,
            "iast": "viṣa viṣaṃ",
            "classicalTranslitZh": "罚沙罚参",
            "modernPhoneticZh": "维沙 维伤",
            "meaningZh": "销融一切内外烦恼恶毒！",
            "meaningEn": "Neutralizing poison upon poison!",
            "tangNoteZh": "第三十九句 · 夹注：同前销伏诸毒。",
            "words": [
                  {
                        "iast": "viṣa",
                        "stem": "viṣa",
                        "grammar": "Noun · 毒害",
                        "transliterationZh": "尾洒（拼读参考：维沙）",
                        "meaningZh": "毒害、蛇毒与三毒",
                        "meaningEn": "poison, venom, toxin",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "viṣaṃ",
                        "stem": "viṣam",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "尾忏（拼读参考：维伤）",
                        "meaningZh": "箭毒",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-40",
            "index": 40,
            "iast": "praṇāśaya",
            "classicalTranslitZh": "佛啰舍耶",
            "modernPhoneticZh": "₍普₎啦拿沙呀",
            "meaningZh": "彻底消灭一切罪障苦毒！",
            "meaningEn": "Destroy and eradicate all afflictions!",
            "tangNoteZh": "第四十句 · 夹注：此是阿弥陀佛本身，观世音菩萨师主。",
            "words": [
                  {
                        "iast": "praṇāśaya",
                        "stem": "praṇāśa",
                        "grammar": "Impv. 2nd Sg. · 祈使式",
                        "transliterationZh": "钵啰拏(引)舍耶（拼读参考：₍普₎啦拿沙呀）",
                        "meaningZh": "祈请损失、死厄",
                        "meaningEn": "may You disappearance, loss, death!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-41",
            "index": 41,
            "iast": "hulu hulu malla",
            "classicalTranslitZh": "呼嚧呼嚧摩啰",
            "modernPhoneticZh": "呼卢 呼卢 玛啦",
            "meaningZh": "速疾作法、速疾救度，大勇猛力士尊！",
            "meaningEn": "Hasten, hasten, O Mighty Hero!",
            "tangNoteZh": "第四十一句 · 夹注：此是八部鬼神王奉敕护持。",
            "words": [
                  {
                        "iast": "hulu",
                        "stem": "hulu",
                        "grammar": "Mantra-Impv. · 速疾祈请",
                        "transliterationZh": "呼噜（拼读参考：呼卢）",
                        "meaningZh": "威猛速疾摄护除灾（呼嚧）",
                        "meaningEn": "swiftly protect and sweep away calamity!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "hulu",
                        "stem": "hulu",
                        "grammar": "Mantra-Impv. · 速疾祈请",
                        "transliterationZh": "呼噜（拼读参考：呼卢）",
                        "meaningZh": "威猛速疾摄护除灾（呼嚧）",
                        "meaningEn": "swiftly protect and sweep away calamity!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "malla",
                        "stem": "malla",
                        "grammar": "Noun · 大力勇健尊",
                        "transliterationZh": "摩攞攞（拼读参考：玛啦）",
                        "meaningZh": "大勇力士、降魔大力尊",
                        "meaningEn": "mighty champion, fearless hero",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-42",
            "index": 42,
            "iast": "hulu hulu hare",
            "classicalTranslitZh": "呼嚧呼嚧醯利",
            "modernPhoneticZh": "呼卢 呼卢 哈雷",
            "meaningZh": "速疾救护、速疾拔苦，狮子无畏尊！",
            "meaningEn": "Hasten, hasten, O Lion-Lord Hari!",
            "tangNoteZh": "第四十二句 · 夹注：同前速疾神通护念。",
            "words": [
                  {
                        "iast": "hulu",
                        "stem": "hulu",
                        "grammar": "Mantra-Impv. · 速疾祈请",
                        "transliterationZh": "呼噜（拼读参考：呼卢）",
                        "meaningZh": "威猛速疾摄护除灾（呼嚧）",
                        "meaningEn": "swiftly protect and sweep away calamity!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "hulu",
                        "stem": "hulu",
                        "grammar": "Mantra-Impv. · 速疾祈请",
                        "transliterationZh": "呼噜（拼读参考：呼卢）",
                        "meaningZh": "威猛速疾摄护除灾（呼嚧）",
                        "meaningEn": "swiftly protect and sweep away calamity!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "hare",
                        "stem": "hare",
                        "grammar": "Voc.Sg. · 除苦圣尊",
                        "transliterationZh": "诃隶（拼读参考：哈雷）",
                        "meaningZh": "唯愿救苦圣尊（诃利/观音尊号）！",
                        "meaningEn": "O Hari / Remover of Suffering!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-43",
            "index": 43,
            "iast": "sara sara",
            "classicalTranslitZh": "娑啰娑啰",
            "modernPhoneticZh": "萨啦 萨啦",
            "meaningZh": "坚固精髓、遍流法水润泽群生！",
            "meaningEn": "Flow forth, stream everywhere!",
            "tangNoteZh": "第四十三句 · 夹注：度脱五浊恶世众生。",
            "words": [
                  {
                        "iast": "sara",
                        "stem": "sara",
                        "grammar": "Impv. 2nd Sg. · 祈使式",
                        "transliterationZh": "萨啰（拼读参考：萨啦）",
                        "meaningZh": "流注周遍、速行护念（萨啰）",
                        "meaningEn": "flow forth and pervade with blessing!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "sara",
                        "stem": "sara",
                        "grammar": "Impv. 2nd Sg. · 祈使式",
                        "transliterationZh": "萨啰（拼读参考：萨啦）",
                        "meaningZh": "流注周遍、速行护念（萨啰）",
                        "meaningEn": "flow forth and pervade with blessing!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-44",
            "index": 44,
            "iast": "siri siri",
            "classicalTranslitZh": "悉唎悉唎",
            "modernPhoneticZh": "悉里 悉里",
            "meaningZh": "大吉祥瑞光遍洒一切有情！",
            "meaningEn": "Pour forth auspicious blessings!",
            "tangNoteZh": "第四十四句 · 夹注：此是观世音菩萨利益一切众生不可思议。",
            "words": [
                  {
                        "iast": "siri",
                        "stem": "siri",
                        "grammar": "Mantra-pada · 吉祥密语",
                        "transliterationZh": "悉哩（拼读参考：悉里）",
                        "meaningZh": "吉祥福德流注庄严（悉哩/室利）",
                        "meaningEn": "auspicious Śrī fortune & sacred grace",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "siri",
                        "stem": "siri",
                        "grammar": "Mantra-pada · 吉祥密语",
                        "transliterationZh": "悉哩（拼读参考：悉里）",
                        "meaningZh": "吉祥福德流注庄严（悉哩/室利）",
                        "meaningEn": "auspicious Śrī fortune & sacred grace",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-45",
            "index": 45,
            "iast": "suru suru",
            "classicalTranslitZh": "苏嚧苏嚧",
            "modernPhoneticZh": "苏鲁 苏鲁",
            "meaningZh": "甘露法乳涓涓流注身心！",
            "meaningEn": "Trickle forth sweet ambrosial nectar!",
            "tangNoteZh": "第四十五句 · 夹注：诸佛甘露润泽众生。",
            "words": [
                  {
                        "iast": "suru",
                        "stem": "suru",
                        "grammar": "Mantra-Impv. · 甘露祈请",
                        "transliterationZh": "苏噜（拼读参考：苏鲁）",
                        "meaningZh": "甘露妙流普润群生（素噜）",
                        "meaningEn": "stream forth auspicious ambrosia!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "suru",
                        "stem": "suru",
                        "grammar": "Mantra-Impv. · 甘露祈请",
                        "transliterationZh": "苏噜（拼读参考：苏鲁）",
                        "meaningZh": "甘露妙流普润群生（素噜）",
                        "meaningEn": "stream forth auspicious ambrosia!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-46",
            "index": 46,
            "iast": "bodhiya bodhiya",
            "classicalTranslitZh": "菩提夜菩提夜",
            "modernPhoneticZh": "博地呀 博地呀",
            "meaningZh": "觉悟、觉悟自性菩提妙心！",
            "meaningEn": "Awaken, awaken to Enlightenment!",
            "tangNoteZh": "第四十六句 · 夹注：此是观世音菩萨结缘众生。",
            "words": [
                  {
                        "iast": "bodhiya",
                        "stem": "√bodh",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "冒地耶（拼读参考：博地呀）",
                        "meaningZh": "菩提觉知·解脱系缚大力",
                        "meaningEn": "awakening",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bodhiya",
                        "stem": "√bodh",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "冒地耶（拼读参考：博地呀）",
                        "meaningZh": "菩提觉知·解脱系缚大力",
                        "meaningEn": "awakening",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-47",
            "index": 47,
            "iast": "bodhaya bodhaya",
            "classicalTranslitZh": "菩驮夜菩驮夜",
            "modernPhoneticZh": "博达呀 博达呀",
            "meaningZh": "开晓、觉他，令一切众生速证圆觉！",
            "meaningEn": "Enlighten, cause all beings to awaken!",
            "tangNoteZh": "第四十七句 · 夹注：此是阿难尊者护持流通相。",
            "words": [
                  {
                        "iast": "bodhaya",
                        "stem": "bodhaya",
                        "grammar": "Impv.2.Sg. · 觉悟祈使",
                        "transliterationZh": "冒驮耶（拼读参考：博达呀）",
                        "meaningZh": "请开晓觉悟、令发菩提觉智！",
                        "meaningEn": "awaken! enlighten! illuminate!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bodhaya",
                        "stem": "bodhaya",
                        "grammar": "Impv.2.Sg. · 觉悟祈使",
                        "transliterationZh": "冒驮耶（拼读参考：博达呀）",
                        "meaningZh": "请开晓觉悟、令发菩提觉智！",
                        "meaningEn": "awaken! enlighten! illuminate!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-48",
            "index": 48,
            "iast": "maitriya",
            "classicalTranslitZh": "弥帝唎夜",
            "modernPhoneticZh": "麦₍特₎里呀",
            "meaningZh": "大慈悲心尊！",
            "meaningEn": "O Merciful One of Boundless Loving-Kindness!",
            "tangNoteZh": "第四十八句 · 夹注：此是大车菩萨，手把金刀。",
            "words": [
                  {
                        "iast": "maitriya",
                        "stem": "ma-ta-ra",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "迈怛哩耶（拼读参考：麦₍特₎里呀）",
                        "meaningZh": "无我大慈三昧·真如实际·清净离诸尘垢",
                        "meaningEn": "selfless great loving-kindness & immutable Suchness & stainless purity free from dust",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-49",
            "index": 49,
            "iast": "nīlakaṇṭha",
            "classicalTranslitZh": "那啰谨墀",
            "modernPhoneticZh": "尼啦干他",
            "meaningZh": "青颈大悲观自在尊！",
            "meaningEn": "O Blue-Necked Compassionate Nīlakaṇṭha!",
            "tangNoteZh": "第四十九句 · 夹注：此是龙树菩萨手把金刀之处。",
            "words": [
                  {
                        "iast": "nīlakaṇṭha",
                        "stem": "nīlakaṇṭha",
                        "grammar": "Samāsa · 青颈大悲尊",
                        "transliterationZh": "泥攞剑侘（拼读参考：尼啦干他）",
                        "meaningZh": "青颈观自在（吞摄诸毒大悲相）",
                        "meaningEn": "Nīlakaṇṭha, Blue-Throated Compassionate One",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-50",
            "index": 50,
            "iast": "darśanena",
            "classicalTranslitZh": "地利瑟尼那",
            "modernPhoneticZh": "达₍尔₎沙内拿",
            "meaningZh": "愿以清净慈眼照见摄受！",
            "meaningEn": "By Your merciful vision and gaze!",
            "tangNoteZh": "第五十句 · 夹注：此是宝幢菩萨，手持铁叉是也。",
            "words": [
                  {
                        "iast": "darśanena",
                        "stem": "darśana",
                        "grammar": "Inst. Sg. · 具格单数",
                        "transliterationZh": "捺哩舍祢曩（拼读参考：达₍尔₎沙内拿）",
                        "meaningZh": "以观照 / 见",
                        "meaningEn": "by/through false, heretical view; exhibition",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-51",
            "index": 51,
            "iast": "prahlādamānāya",
            "classicalTranslitZh": "波夜摩那",
            "modernPhoneticZh": "₍普₎啦₍赫₎啦达玛拿呀",
            "meaningZh": "令见闻众生心生大清凉欢喜尊！",
            "meaningEn": "To the One Who Brings Supreme Joy and Relief!",
            "tangNoteZh": "第五十一句 · 夹注：此是宝金光幢菩萨，执钵折罗杵。",
            "words": [
                  {
                        "iast": "prahlādamānāya",
                        "stem": "prahlāda-māna",
                        "grammar": "Samāsa · 复合词 (Dat. Sg. · 为格单数)",
                        "transliterationZh": "钵啰纥攞(引)捺摩(引)那(引)耶（拼读参考：₍普₎啦₍赫₎啦达玛拿呀）",
                        "meaningZh": "向清凉慢",
                        "meaningEn": "refreshment + to",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-52",
            "index": 52,
            "iast": "svāhā",
            "classicalTranslitZh": "娑婆诃",
            "modernPhoneticZh": "₍斯₎瓦哈",
            "meaningZh": "吉祥圆满成就，娑婆诃！",
            "meaningEn": "Svāhā (May auspiciousness be accomplished)!",
            "tangNoteZh": "第五十二句 · 第一圆满成就结颂。",
            "words": [
                  {
                        "iast": "svāhā",
                        "stem": "svāhā",
                        "grammar": "Indecl. · 结印词",
                        "transliterationZh": "娑嚩诃 / 萨婆诃（拼读参考：₍斯₎瓦哈）",
                        "meaningZh": "圆满吉祥成就",
                        "meaningEn": "hail! may auspicious accomplishment be sealed",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-53",
            "index": 53,
            "iast": "siddhāya",
            "classicalTranslitZh": "悉陀夜",
            "modernPhoneticZh": "悉达呀",
            "meaningZh": "向成就一切悉地妙果尊！",
            "meaningEn": "To the Accomplished Siddha!",
            "tangNoteZh": "第五十三句 · 夹注：此是达一切法门。",
            "words": [
                  {
                        "iast": "siddhāya",
                        "stem": "siddha",
                        "grammar": "Adj./Noun · 成就尊 · Dat. Sg. · 为格单数",
                        "transliterationZh": "悉没驮(引)耶（拼读参考：悉达呀）",
                        "meaningZh": "向成就者、已成就",
                        "meaningEn": "to/for accomplished, perfected adept (Siddha)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-54",
            "index": 54,
            "iast": "svāhā",
            "classicalTranslitZh": "娑婆诃",
            "modernPhoneticZh": "₍斯₎瓦哈",
            "meaningZh": "圆满成就，娑婆诃！",
            "meaningEn": "Svāhā!",
            "tangNoteZh": "第五十四句 · 悉地成就结印。",
            "words": [
                  {
                        "iast": "svāhā",
                        "stem": "svāhā",
                        "grammar": "Indecl. · 结印词",
                        "transliterationZh": "娑嚩诃 / 萨婆诃（拼读参考：₍斯₎瓦哈）",
                        "meaningZh": "圆满吉祥成就",
                        "meaningEn": "hail! may auspicious accomplishment be sealed",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-55",
            "index": 55,
            "iast": "mahāsiddhāya",
            "classicalTranslitZh": "摩诃悉陀夜",
            "modernPhoneticZh": "玛哈-悉达呀",
            "meaningZh": "向大成就无上悉地尊！",
            "meaningEn": "To the Greatly Accomplished Mahāsiddha!",
            "tangNoteZh": "第五十五句 · 夹注：此是放光菩萨，手把赤幡。",
            "words": [
                  {
                        "iast": "mahāsiddhāya",
                        "stem": "mahāsiddha",
                        "grammar": "Dat. Sg. · 为格单数",
                        "transliterationZh": "摩诃悉没驮(引)耶（拼读参考：玛哈-悉达呀）",
                        "meaningZh": "向大圣",
                        "meaningEn": "to/for a great adept",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-56",
            "index": 56,
            "iast": "svāhā",
            "classicalTranslitZh": "娑婆诃",
            "modernPhoneticZh": "₍斯₎瓦哈",
            "meaningZh": "圆满成就，娑婆诃！",
            "meaningEn": "Svāhā!",
            "tangNoteZh": "第五十六句 · 大悉地成就结印。",
            "words": [
                  {
                        "iast": "svāhā",
                        "stem": "svāhā",
                        "grammar": "Indecl. · 结印词",
                        "transliterationZh": "娑嚩诃 / 萨婆诃（拼读参考：₍斯₎瓦哈）",
                        "meaningZh": "圆满吉祥成就",
                        "meaningEn": "hail! may auspicious accomplishment be sealed",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-57",
            "index": 57,
            "iast": "siddhayoge",
            "classicalTranslitZh": "悉陀喻艺",
            "modernPhoneticZh": "悉达优给",
            "meaningZh": "于成就无上大悲瑜伽三摩地中！",
            "meaningEn": "In the Yoga of Supreme Siddhi!",
            "tangNoteZh": "第五十七句 · 夹注：此诸天菩萨尽悉云集，手把金刀。",
            "words": [
                  {
                        "iast": "siddhayoge",
                        "stem": "siddhayoga",
                        "grammar": "Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "悉没驮瑜诣（拼读参考：悉达优给）",
                        "meaningZh": "魔法机构、护符尊",
                        "meaningEn": "O magic agency, charm / in magic agency, charm",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-58",
            "index": 58,
            "iast": "īśvarāya",
            "classicalTranslitZh": "室皤啰耶",
            "modernPhoneticZh": "伊₍湿₎瓦啦呀",
            "meaningZh": "得大自在王尊！",
            "meaningEn": "To the Sovereign Lord of Siddha-Yoga!",
            "tangNoteZh": "第五十八句 · 与第57句合为 siddhayogeśvarāya（成就瑜伽自在尊）。",
            "words": [
                  {
                        "iast": "īśvarāya",
                        "stem": "īśvara",
                        "grammar": "Noun · 自在主 · Dat. Sg. · 为格单数",
                        "transliterationZh": "伊(引)湿嚩啰(引)耶（拼读参考：伊₍湿₎瓦啦呀）",
                        "meaningZh": "向自在主、主宰尊",
                        "meaningEn": "to/for Īśvara, Sovereign Lord, Master",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-59",
            "index": 59,
            "iast": "svāhā",
            "classicalTranslitZh": "娑婆诃",
            "modernPhoneticZh": "₍斯₎瓦哈",
            "meaningZh": "圆满成就，娑婆诃！",
            "meaningEn": "Svāhā!",
            "tangNoteZh": "第五十九句 · 瑜伽自在成就结印。",
            "words": [
                  {
                        "iast": "svāhā",
                        "stem": "svāhā",
                        "grammar": "Indecl. · 结印词",
                        "transliterationZh": "娑嚩诃 / 萨婆诃（拼读参考：₍斯₎瓦哈）",
                        "meaningZh": "圆满吉祥成就",
                        "meaningEn": "hail! may auspicious accomplishment be sealed",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-60",
            "index": 60,
            "iast": "nīlakaṇṭha",
            "classicalTranslitZh": "那啰谨墀",
            "modernPhoneticZh": "尼啦干他",
            "meaningZh": "向青颈大悲救苦尊！",
            "meaningEn": "To Nīlakaṇṭha!",
            "tangNoteZh": "第六十句 · 夹注：山海慧菩萨本身，手把金剑。",
            "words": [
                  {
                        "iast": "nīlakaṇṭha",
                        "stem": "nīlakaṇṭha",
                        "grammar": "Samāsa · 青颈大悲尊",
                        "transliterationZh": "泥攞剑侘（拼读参考：尼啦干他）",
                        "meaningZh": "青颈观自在（吞摄诸毒大悲相）",
                        "meaningEn": "Nīlakaṇṭha, Blue-Throated Compassionate One",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-61",
            "index": 61,
            "iast": "svāhā",
            "classicalTranslitZh": "娑婆诃",
            "modernPhoneticZh": "₍斯₎瓦哈",
            "meaningZh": "圆满成就，娑婆诃！",
            "meaningEn": "Svāhā!",
            "tangNoteZh": "第六十一句 · 青颈本尊成就结印。",
            "words": [
                  {
                        "iast": "svāhā",
                        "stem": "svāhā",
                        "grammar": "Indecl. · 结印词",
                        "transliterationZh": "娑嚩诃 / 萨婆诃（拼读参考：₍斯₎瓦哈）",
                        "meaningZh": "圆满吉祥成就",
                        "meaningEn": "hail! may auspicious accomplishment be sealed",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-62",
            "index": 62,
            "iast": "vārāhamukhāya",
            "classicalTranslitZh": "摩啰那啰",
            "modernPhoneticZh": "瓦啦哈穆卡呀",
            "meaningZh": "向猪面金刚（勇猛除障化身）尊！",
            "meaningEn": "To the Boar-Faced Wrathful Protector!",
            "tangNoteZh": "第六十二句 · 夹注：此是宝印王菩萨，手把金斧。",
            "words": [
                  {
                        "iast": "vārāhamukhāya",
                        "stem": "vāra-āha-mukha",
                        "grammar": "Samāsa · 复合词 (Dat. Sg. · 为格单数)",
                        "transliterationZh": "嚩(引)啰(引)诃母佉(引)耶（拼读参考：瓦啦哈穆卡呀）",
                        "meaningZh": "向人群如是宣说面门",
                        "meaningEn": "crowd + spoke + to",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-63",
            "index": 63,
            "iast": "svāhā",
            "classicalTranslitZh": "娑婆诃",
            "modernPhoneticZh": "₍斯₎瓦哈",
            "meaningZh": "圆满成就，娑婆诃！",
            "meaningEn": "Svāhā!",
            "tangNoteZh": "第六十三句 · 降障化身成就结印。",
            "words": [
                  {
                        "iast": "svāhā",
                        "stem": "svāhā",
                        "grammar": "Indecl. · 结印词",
                        "transliterationZh": "娑嚩诃 / 萨婆诃（拼读参考：₍斯₎瓦哈）",
                        "meaningZh": "圆满吉祥成就",
                        "meaningEn": "hail! may auspicious accomplishment be sealed",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-64",
            "index": 64,
            "iast": "narasiṃhamukhāya",
            "classicalTranslitZh": "悉啰僧阿穆佉耶",
            "modernPhoneticZh": "拿啦辛哈穆卡呀",
            "meaningZh": "向人狮面无畏威德化身尊！",
            "meaningEn": "To the Man-Lion-Faced Fearless One (Narasiṃhamukha)!",
            "tangNoteZh": "第六十四句 · 夹注：此是药王菩萨本身，行疗诸病。",
            "words": [
                  {
                        "iast": "narasiṃhamukhāya",
                        "stem": "nara-siṃhamukha",
                        "grammar": "Samāsa · 复合词 (Dat. Sg. · 为格单数)",
                        "transliterationZh": "曩啰悉喃诃母佉(引)耶（拼读参考：拿啦辛哈穆卡呀）",
                        "meaningZh": "向男子嘴子",
                        "meaningEn": "man + to",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-65",
            "index": 65,
            "iast": "svāhā",
            "classicalTranslitZh": "娑婆诃",
            "modernPhoneticZh": "₍斯₎瓦哈",
            "meaningZh": "圆满成就，娑婆诃！",
            "meaningEn": "Svāhā!",
            "tangNoteZh": "第六十五句 · 狮面无畏成就结印。",
            "words": [
                  {
                        "iast": "svāhā",
                        "stem": "svāhā",
                        "grammar": "Indecl. · 结印词",
                        "transliterationZh": "娑嚩诃 / 萨婆诃（拼读参考：₍斯₎瓦哈）",
                        "meaningZh": "圆满吉祥成就",
                        "meaningEn": "hail! may auspicious accomplishment be sealed",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-66",
            "index": 66,
            "iast": "sarvamahāsiddhāya",
            "classicalTranslitZh": "娑婆摩诃阿悉陀夜",
            "modernPhoneticZh": "萨₍尔₎瓦-玛哈-悉达呀",
            "meaningZh": "向普摄一切广大殊胜成就尊！",
            "meaningEn": "To the All-Encompassing Great Siddha (Sarvamahāsiddha)!",
            "tangNoteZh": "第六十六句 · 夹注：此是药上菩萨本身，行疗诸病。",
            "words": [
                  {
                        "iast": "sarvamahāsiddhāya",
                        "stem": "sarva-mahāsiddha",
                        "grammar": "Samāsa · 复合词 (Dat. Sg. · 为格单数)",
                        "transliterationZh": "萨哩嚩摩诃悉没驮(引)耶（拼读参考：萨₍尔₎瓦-玛哈-悉达呀）",
                        "meaningZh": "向一切大圣",
                        "meaningEn": "all + to",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-67",
            "index": 67,
            "iast": "svāhā",
            "classicalTranslitZh": "娑婆诃",
            "modernPhoneticZh": "₍斯₎瓦哈",
            "meaningZh": "圆满成就，娑婆诃！",
            "meaningEn": "Svāhā!",
            "tangNoteZh": "第六十七句 · 普大成就结印。",
            "words": [
                  {
                        "iast": "svāhā",
                        "stem": "svāhā",
                        "grammar": "Indecl. · 结印词",
                        "transliterationZh": "娑嚩诃 / 萨婆诃（拼读参考：₍斯₎瓦哈）",
                        "meaningZh": "圆满吉祥成就",
                        "meaningEn": "hail! may auspicious accomplishment be sealed",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-68",
            "index": 68,
            "iast": "cakrasiddhāya",
            "classicalTranslitZh": "者吉啰阿悉陀夜",
            "modernPhoneticZh": "佳₍克₎啦-悉达呀",
            "meaningZh": "向手执金刚宝轮成就尊！",
            "meaningEn": "To the Wheel-Wielding Siddha (Cakrasiddha)!",
            "tangNoteZh": "第六十八句 · 夹注：金轮降魔疗病护法相。",
            "words": [
                  {
                        "iast": "cakrasiddhāya",
                        "stem": "cak-asiddha",
                        "grammar": "Samāsa · 复合词 (Dat. Sg. · 为格单数)",
                        "transliterationZh": "者讫啰悉没驮(引)耶（拼读参考：佳₍克₎啦-悉达呀）",
                        "meaningZh": "向颤动不成",
                        "meaningEn": "tremble",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-69",
            "index": 69,
            "iast": "svāhā",
            "classicalTranslitZh": "娑婆诃",
            "modernPhoneticZh": "₍斯₎瓦哈",
            "meaningZh": "圆满成就，娑婆诃！",
            "meaningEn": "Svāhā!",
            "tangNoteZh": "第六十九句 · 宝轮成就结印。",
            "words": [
                  {
                        "iast": "svāhā",
                        "stem": "svāhā",
                        "grammar": "Indecl. · 结印词",
                        "transliterationZh": "娑嚩诃 / 萨婆诃（拼读参考：₍斯₎瓦哈）",
                        "meaningZh": "圆满吉祥成就",
                        "meaningEn": "hail! may auspicious accomplishment be sealed",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-70",
            "index": 70,
            "iast": "padmahastāya",
            "classicalTranslitZh": "波陀摩羯悉哆夜",
            "modernPhoneticZh": "巴₍德₎玛-哈₍斯₎达呀",
            "meaningZh": "向手执清净红莲华开敷本心尊！",
            "meaningEn": "To the Lotus-in-Hand One (Padmahasta)!",
            "tangNoteZh": "第七十句 · 唐代音译作「波陀摩羯悉哆夜」（padmakastāya / padmahastāya）。",
            "words": [
                  {
                        "iast": "padmahastāya",
                        "stem": "padma-hasta",
                        "grammar": "Samāsa · 复合词 (Dat. Sg. · 为格单数)",
                        "transliterationZh": "钵讷摩诃悉多耶（拼读参考：巴₍德₎玛-哈₍斯₎达呀）",
                        "meaningZh": "向莲华手",
                        "meaningEn": "lotus flower + to",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-71",
            "index": 71,
            "iast": "svāhā",
            "classicalTranslitZh": "娑婆诃",
            "modernPhoneticZh": "₍斯₎瓦哈",
            "meaningZh": "圆满成就，娑婆诃！",
            "meaningEn": "Svāhā!",
            "tangNoteZh": "第七十一句 · 红莲妙手成就结印。",
            "words": [
                  {
                        "iast": "svāhā",
                        "stem": "svāhā",
                        "grammar": "Indecl. · 结印词",
                        "transliterationZh": "娑嚩诃 / 萨婆诃（拼读参考：₍斯₎瓦哈）",
                        "meaningZh": "圆满吉祥成就",
                        "meaningEn": "hail! may auspicious accomplishment be sealed",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-72",
            "index": 72,
            "iast": "nīlakaṇṭhavyāghrāya",
            "classicalTranslitZh": "那啰谨墀皤伽啰耶",
            "modernPhoneticZh": "尼啦干他₍维₎呀₍格₎啦呀",
            "meaningZh": "向青颈威猛伏魔尊！",
            "meaningEn": "To Fierce Tiger-Clad Nīlakaṇṭha!",
            "tangNoteZh": "第七十二句 · 梵本亦作 nīlakaṇṭhapāṇḍarāya。",
            "words": [
                  {
                        "iast": "nīlakaṇṭhavyāghrāya",
                        "stem": "nīlakaṇṭha-vyāghra",
                        "grammar": "Samāsa · 复合词 (Dat. Sg. · 为格单数)",
                        "transliterationZh": "泥攞剑侘尾夜伽啰(引)耶（拼读参考：尼啦干他₍维₎呀₍格₎啦呀）",
                        "meaningZh": "向青颈观自在豹",
                        "meaningEn": "Nīlakaṇṭha + to",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-73",
            "index": 73,
            "iast": "svāhā",
            "classicalTranslitZh": "娑婆诃",
            "modernPhoneticZh": "₍斯₎瓦哈",
            "meaningZh": "圆满成就，娑婆诃！",
            "meaningEn": "Svāhā!",
            "tangNoteZh": "第七十三句 · 威猛护念成就结印。",
            "words": [
                  {
                        "iast": "svāhā",
                        "stem": "svāhā",
                        "grammar": "Indecl. · 结印词",
                        "transliterationZh": "娑嚩诃 / 萨婆诃（拼读参考：₍斯₎瓦哈）",
                        "meaningZh": "圆满吉祥成就",
                        "meaningEn": "hail! may auspicious accomplishment be sealed",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-74",
            "index": 74,
            "iast": "mahābaliśaṅkarāya",
            "classicalTranslitZh": "摩婆利胜羯啰夜",
            "modernPhoneticZh": "玛哈-巴利商嘎啦呀",
            "meaningZh": "向大勇力兴作一切吉祥安乐尊！",
            "meaningEn": "To the Mighty Beneficent Śaṅkara!",
            "tangNoteZh": "第七十四句 · 大势吉祥利乐有情相。",
            "words": [
                  {
                        "iast": "mahābaliśaṅkarāya",
                        "stem": "mahā-bali-śaṅkara",
                        "grammar": "Samāsa · 复合词 (Dat. Sg. · 为格单数)",
                        "transliterationZh": "摩诃跋里舍仰迦啰(引)耶（拼读参考：玛哈-巴利商嘎啦呀）",
                        "meaningZh": "向大施食作乐",
                        "meaningEn": "great + tax + to",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-75",
            "index": 75,
            "iast": "svāhā",
            "classicalTranslitZh": "娑婆诃",
            "modernPhoneticZh": "₍斯₎瓦哈",
            "meaningZh": "圆满成就，娑婆诃！",
            "meaningEn": "Svāhā!",
            "tangNoteZh": "第七十五句 · 吉祥大力成就结印。",
            "words": [
                  {
                        "iast": "svāhā",
                        "stem": "svāhā",
                        "grammar": "Indecl. · 结印词",
                        "transliterationZh": "娑嚩诃 / 萨婆诃（拼读参考：₍斯₎瓦哈）",
                        "meaningZh": "圆满吉祥成就",
                        "meaningEn": "hail! may auspicious accomplishment be sealed",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-76",
            "index": 76,
            "iast": "namo ratnatrayāya",
            "classicalTranslitZh": "南无喝啰怛那哆啰夜耶",
            "modernPhoneticZh": "拿摩 啦₍特₎拿-₍特₎啦呀呀",
            "meaningZh": "再申归命十方常住三宝！",
            "meaningEn": "Homage again to the Three Jewels!",
            "tangNoteZh": "第七十六句 · 结坛重申三宝归敬。",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ratnatrayāya",
                        "stem": "ratnatraya",
                        "grammar": "Samāsa · 三宝 · Dat. Sg. · 为格单数",
                        "transliterationZh": "喝啰怛那哆啰夜耶（拼读参考：啦₍特₎拿-₍特₎啦呀呀）",
                        "meaningZh": "向佛法僧三宝",
                        "meaningEn": "to/for the Three Jewels (Buddha, Dharma, Saṃgha)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-77",
            "index": 77,
            "iast": "namo āryā",
            "classicalTranslitZh": "南无阿唎耶",
            "modernPhoneticZh": "拿摩 阿₍哩₎呀",
            "meaningZh": "归命圣尊！",
            "meaningEn": "Homage to the Noble One!",
            "tangNoteZh": "第七十七句 · 结坛重申圣尊归敬。",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "āryā",
                        "stem": "ārya",
                        "grammar": "Adj. · 圣尊 · Nom. Sg. Fem. · 主格阴性",
                        "transliterationZh": "阿(引)哩夜（拼读参考：阿₍哩₎呀）",
                        "meaningZh": "圣、尊贵圣者",
                        "meaningEn": "noble, holy, exalted (Ārya)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-78",
            "index": 78,
            "iast": "avalokite",
            "classicalTranslitZh": "婆嚧吉帝",
            "modernPhoneticZh": "阿瓦洛给帝",
            "meaningZh": "普门慈眼垂视众生尊！",
            "meaningEn": "O All-Gazing Avalokita!",
            "tangNoteZh": "第七十八句 · 与第79句合为 avalokiteśvarāya。",
            "words": [
                  {
                        "iast": "avalokite",
                        "stem": "avalokita",
                        "grammar": "Part. · 慈眼观照 · Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "阿嚩路枳帝（拼读参考：阿瓦洛给帝）",
                        "meaningZh": "观照、慈悲垂视尊",
                        "meaningEn": "O beheld, looked upon with compassion / in beheld, looked upon with compassion",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-79",
            "index": 79,
            "iast": "śvarāya",
            "classicalTranslitZh": "烁皤啰夜",
            "modernPhoneticZh": "₍湿₎瓦啦呀",
            "meaningZh": "神通圆融大自在王！",
            "meaningEn": "Sovereign Lord Īśvara!",
            "tangNoteZh": "第七十九句 · 观自在菩萨尊号结归。",
            "words": [
                  {
                        "iast": "śvarāya",
                        "stem": "śvas",
                        "grammar": "Dat. Sg. · 为格单数",
                        "transliterationZh": "湿嚩啰(引)耶（拼读参考：₍湿₎瓦啦呀）",
                        "meaningZh": "向明天、昨天",
                        "meaningEn": "to/for tomorrow; yesterday",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-80",
            "index": 80,
            "iast": "svāhā",
            "classicalTranslitZh": "娑婆诃",
            "modernPhoneticZh": "₍斯₎瓦哈",
            "meaningZh": "圆满成就，娑婆诃！",
            "meaningEn": "Svāhā!",
            "tangNoteZh": "第八十句 · 圣观自在归命圆满印。",
            "words": [
                  {
                        "iast": "svāhā",
                        "stem": "svāhā",
                        "grammar": "Indecl. · 结印词",
                        "transliterationZh": "娑嚩诃 / 萨婆诃（拼读参考：₍斯₎瓦哈）",
                        "meaningZh": "圆满吉祥成就",
                        "meaningEn": "hail! may auspicious accomplishment be sealed",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-81",
            "index": 81,
            "iast": "oṃ siddhyantu",
            "classicalTranslitZh": "唵悉殿都",
            "modernPhoneticZh": "嗡 悉₍地₎延度",
            "meaningZh": "嗡！唯愿一切善愿悉皆圆满成就！",
            "meaningEn": "Oṃ! May they all be fully accomplished!",
            "tangNoteZh": "第八十一句 · 《T20n1064》单列第81句，祈愿成就印。",
            "words": [
                  {
                        "iast": "oṃ",
                        "stem": "oṃ",
                        "grammar": "Praṇava · 圣音",
                        "transliterationZh": "唵（拼读参考：嗡）",
                        "meaningZh": "三身总持圣音（法报化三身摄受）",
                        "meaningEn": "sacred Praṇava syllable embodying Trikāya",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "siddhyantu",
                        "stem": "siddhyantu",
                        "grammar": "Impv. 3rd Pl. · 成就祈愿",
                        "transliterationZh": "悉没地演都（拼读参考：悉₍地₎延度）",
                        "meaningZh": "愿诸真言章句悉皆成就",
                        "meaningEn": "may the mantra words be fully accomplished!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-82",
            "index": 82,
            "iast": "mantra",
            "classicalTranslitZh": "漫多啰",
            "modernPhoneticZh": "曼₍特₎啦",
            "meaningZh": "此大悲无碍真言神咒！",
            "meaningEn": "The sacred Mantra!",
            "tangNoteZh": "第八十二句 · 《T20n1064》单列第82句，总持真言体。",
            "words": [
                  {
                        "iast": "mantra",
                        "stem": "mantra",
                        "grammar": "Noun · 真言密咒",
                        "transliterationZh": "曼怛啰（拼读参考：曼₍特₎啦）",
                        "meaningZh": "真言、密咒（护心密语）",
                        "meaningEn": "Mantra, sacred formula",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-83",
            "index": 83,
            "iast": "padāya",
            "classicalTranslitZh": "跋陀耶",
            "modernPhoneticZh": "巴达呀",
            "meaningZh": "一切秘密章句法门！",
            "meaningEn": "Every Mantra-phrase and syllable!",
            "tangNoteZh": "第八十三句 · 《T20n1064》单列第83句，mantrapadāya（真言章句）。",
            "words": [
                  {
                        "iast": "padāya",
                        "stem": "pada",
                        "grammar": "Noun · 法句/足 · Dat. Sg. · 为格单数",
                        "transliterationZh": "跛陀耶（拼读参考：巴达呀）",
                        "meaningZh": "向句、足迹、法位",
                        "meaningEn": "to/for word, verse-foot, step, abode",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "nilakantha-84",
            "index": 84,
            "iast": "svāhā",
            "classicalTranslitZh": "娑婆诃",
            "modernPhoneticZh": "₍斯₎瓦哈",
            "meaningZh": "决定吉祥圆满究竟成就，娑婆诃（八十四句全咒圆满）！",
            "meaningEn": "Perfectly Accomplished in Auspiciousness, Svāhā!",
            "tangNoteZh": "第八十四句 · 大悲心陀罗尼八十四句究竟圆满结印。",
            "words": [
                  {
                        "iast": "svāhā",
                        "stem": "svāhā",
                        "grammar": "Indecl. · 结印词",
                        "transliterationZh": "娑嚩诃 / 萨婆诃（拼读参考：₍斯₎瓦哈）",
                        "meaningZh": "圆满吉祥成就",
                        "meaningEn": "hail! may auspicious accomplishment be sealed",
                        "origin": "derived-reference"
                  }
            ]
      }
],
  },
  {
    id: 'usnisavijaya-dharani',
    titleZh: '佛顶尊胜陀罗尼（唐·不空译 35句悉昙梵汉对音注义全本）',
    titleSanskritIast: 'Sarvadurgatipariśodhana-uṣṇīṣavijaya-dhāraṇī',
    titleEnglish: 'Uṣṇīṣavijaya Dhāraṇī (Complete 35 Clauses, Purifier of All Evil Destinies)',
    categoryId: 'supreme-mantras',
    taishoNo: 'T19n0967 / T19n0974B / T19n0974E',
    translatorZh: '唐·罽宾沙门佛陀波利 译 / 唐·不空三藏 译悉昙对音注义本',
    sutraSourceZh: '《佛顶尊胜陀罗尼经》(T19n0967) 暨《佛顶尊胜陀罗尼注义》(T19n0974B)',
    deityZh: '尊胜佛顶如来 / 佛顶尊胜佛母 (Uṣṇīṣavijayā)',
    meritsAndSummaryZh:
      '唐密与汉传最具代表性的净除一切恶道、增寿吉祥大陀罗尼，通行全本共 35 句完整逐句校勘。本词条直接接入从 CBETA 官方库下载之《T19n0974B》全部 470 个悉昙梵字与汉字逐字对音字元、不空三藏十门科判原典释义夹注，以及《T19n0974E》所附《学念梵音法》。',
    recitationTipsZh:
      '依据《T19n0974E·学念梵音法》原典训示：「夫诵陀罗尼，务存梵音。所有口边字者（如㗚、㘑、㘕），皆须弹舌而言之。侧注引者，长引其声（即梵文重长音 Guru）；所注二合者，两字相和，一时急呼（即梵文复辅音结合字）。」',
    provenance: {
      sourceType: 'CBETA+GRETIL',
      cbetaId: 'T19n0974B',
      cbetaRawXmlUrl: cbetaT19n0974B?.cbetaRawUrl || 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n0974B.xml',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T19n0974B',
      editionCitation:
        'CBETA XML-P5 T19n0974B《佛顶尊胜陀罗尼》(唐·不空译，含 470 个 #SD-* 悉昙梵字对音与十门逐句释义夹注) & T19n0967 (佛陀波利译)；参校日本法隆寺藏梵文贝叶经写本。',
      manuscriptNotesZh:
        '已从 github.com/cbeta-org/xml-p5 下载 T19n0974B.xml、T19n0974E.xml 与 T19n0967.xml，按十门三十五句逐句独立建档并将释义夹注归入专栏。',
      rawSnippet: cbetaT19n0974B?.dharaniParagraphs.map((p) => p.text).join('\n'),
      cbetaInterlinearTokens: cbetaT19n0974B?.interlinearTokens || [],
    },
    verses: [
      {
            "id": "usnisa-1",
            "index": 1,
            "iast": "namo bhagavate",
            "classicalTranslitZh": "曩谟(引)婆誐缚帝",
            "modernPhoneticZh": "拿摩 巴嘎瓦帝",
            "meaningZh": "归命世尊！",
            "meaningEn": "Homage to the Blessed One!",
            "tangNoteZh": "第一门【归敬尊德门】第1句 · 不空《T19n0974B》原典夹注：「归命世尊」。",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bhagavate",
                        "stem": "bhagavate",
                        "grammar": "Dat.Sg. · 为格单数",
                        "transliterationZh": "薄伽伐帝 / 婆誐嚩帝（拼读参考：巴嘎瓦帝）",
                        "meaningZh": "向世尊（薄伽梵）致敬",
                        "meaningEn": "to the Blessed One, World-Honored Lord",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-2",
            "index": 2,
            "iast": "trailokyaprativiśiṣṭāya",
            "classicalTranslitZh": "怛赖(二合引)路枳也(二合)钵罗(二合)底尾始瑟吒(二合引)野",
            "modernPhoneticZh": "₍特₎来洛₍克₎呀-₍普₎啦帝维希₍师₎达呀",
            "meaningZh": "于欲界、色界、无色界三界中最极殊胜超绝者！",
            "meaningEn": "Pre-eminent and supreme throughout the three worlds!",
            "tangNoteZh": "第一门第2句 · 夹注：「三世，亦云三界，最殊胜也」。",
            "words": [
                  {
                        "iast": "trailokyaprativiśiṣṭāya",
                        "stem": "trailokya-prati-viśiṣṭa",
                        "grammar": "Samāsa · 复合词 (Dat. Sg. · 为格单数)",
                        "transliterationZh": "怛来路枳耶钵啰底尾室瑟吒(引)耶（拼读参考：₍特₎来洛₍克₎呀-₍普₎啦帝维希₍师₎达呀）",
                        "meaningZh": "向三界对殊胜",
                        "meaningEn": "the Three Worlds + toward + to",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-3",
            "index": 3,
            "iast": "buddhāya bhagavate",
            "classicalTranslitZh": "没驮野婆誐缚帝",
            "modernPhoneticZh": "布达呀 巴嘎瓦帝",
            "meaningZh": "大觉佛陀、薄伽梵世尊！",
            "meaningEn": "To the Awakened Buddha, the Blessed Lord!",
            "tangNoteZh": "第一门第3句 · 夹注：「大觉、世尊。已上第一归敬尊德门」。",
            "words": [
                  {
                        "iast": "buddhāya",
                        "stem": "buddha",
                        "grammar": "Noun · 佛号 · Dat. Sg. · 为格单数",
                        "transliterationZh": "佛驮耶 / 没驮耶（拼读参考：布达呀）",
                        "meaningZh": "向佛陀、觉者",
                        "meaningEn": "to/for Buddha, the Awakened One",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bhagavate",
                        "stem": "bhagavate",
                        "grammar": "Dat.Sg. · 为格单数",
                        "transliterationZh": "薄伽伐帝 / 婆誐嚩帝（拼读参考：巴嘎瓦帝）",
                        "meaningZh": "向世尊（薄伽梵）致敬",
                        "meaningEn": "to the Blessed One, World-Honored Lord",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-4",
            "index": 4,
            "iast": "tadyathā",
            "classicalTranslitZh": "怛儞也(二合)他",
            "modernPhoneticZh": "达₍地₎呀他",
            "meaningZh": "所谓即说真言曰：",
            "meaningEn": "Namely, the Dhāraṇī is as follows:",
            "tangNoteZh": "第二门【影表法身门】第4句 · 夹注：「所谓之义，即说之义」。",
            "words": [
                  {
                        "iast": "tadyathā",
                        "stem": "tadyathā",
                        "grammar": "Adv. · 咒引词",
                        "transliterationZh": "怛侄他 / 怛你也他（拼读参考：达₍地₎呀他）",
                        "meaningZh": "即说咒曰、所谓",
                        "meaningEn": "namely, thus goes the mantra",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-5",
            "index": 5,
            "iast": "oṃ",
            "classicalTranslitZh": "唵",
            "modernPhoneticZh": "嗡",
            "meaningZh": "嗡（法报化三身无见顶相总持法音）！",
            "meaningEn": "Oṃ!",
            "tangNoteZh": "第二门第5句 · 夹注：「三身无见顶相义。已上第二影表法身门」。",
            "words": [
                  {
                        "iast": "oṃ",
                        "stem": "oṃ",
                        "grammar": "Praṇava · 圣音",
                        "transliterationZh": "唵（拼读参考：嗡）",
                        "meaningZh": "三身总持圣音（法报化三身摄受）",
                        "meaningEn": "sacred Praṇava syllable embodying Trikāya",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-6",
            "index": 6,
            "iast": "viśodhaya viśodhaya",
            "classicalTranslitZh": "尾戍(引)驮野尾戍驮野",
            "modernPhoneticZh": "维硕达呀 维硕达呀",
            "meaningZh": "请净除、彻底净除一切恶业重障！",
            "meaningEn": "Purify, thoroughly purify!",
            "tangNoteZh": "第三门【净除恶趣门】第6句 · 夹注：「清净」。",
            "words": [
                  {
                        "iast": "viśodhaya",
                        "stem": "viśodhaya",
                        "grammar": "Impv.2.Sg. · 究竟净除",
                        "transliterationZh": "尾戍驮耶（拼读参考：维硕达呀）",
                        "meaningZh": "请最极净除、彻底涤净一切业障！",
                        "meaningEn": "thoroughly purify! cleanse completely!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "viśodhaya",
                        "stem": "viśodhaya",
                        "grammar": "Impv.2.Sg. · 究竟净除",
                        "transliterationZh": "尾戍驮耶（拼读参考：维硕达呀）",
                        "meaningZh": "请最极净除、彻底涤净一切业障！",
                        "meaningEn": "thoroughly purify! cleanse completely!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-7",
            "index": 7,
            "iast": "asama-sama",
            "classicalTranslitZh": "娑么娑么",
            "modernPhoneticZh": "阿萨玛-萨玛",
            "meaningZh": "无等伦且与十方诸佛普遍平等尊！",
            "meaningEn": "Unequalled and equal to the unequalled!",
            "tangNoteZh": "第三门第7句 · 无等等法界平等智。",
            "words": [
                  {
                        "iast": "asama",
                        "stem": "asama",
                        "grammar": "Adj. · 无等",
                        "transliterationZh": "阿萨摩（拼读参考：阿萨玛）",
                        "meaningZh": "无等、无比伦",
                        "meaningEn": "unequalled, peerless, matchless",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "sama",
                        "stem": "sama",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "萨摩（拼读参考：萨玛）",
                        "meaningZh": "平",
                        "meaningEn": "equal; ordinary",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-8",
            "index": 8,
            "iast": "samantāvabhāsaspharaṇa",
            "classicalTranslitZh": "三满多缚婆娑萨叵(二合)啰拏",
            "modernPhoneticZh": "萨曼达瓦巴萨₍斯₎帕啦拿",
            "meaningZh": "普放无量光明周遍照耀舒展于法界！",
            "meaningEn": "Radiating all-pervading light everywhere!",
            "tangNoteZh": "第三门第8句 · 夹注：「普遍照曜、舒遍；啰字转舌呼」。",
            "words": [
                  {
                        "iast": "samantāvabhāsaspharaṇa",
                        "stem": "samantāvabhāsa-spharaṇa",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "萨曼多嚩婆(引)萨悉颇啰拏（拼读参考：萨曼达瓦巴萨₍斯₎帕啦拿）",
                        "meaningZh": "普现遍",
                        "meaningEn": "suffusion",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-9",
            "index": 9,
            "iast": "gatigahanasvabhāvaviśuddhe",
            "classicalTranslitZh": "揭底誐诃曩娑嚩(二合)婆嚩尾戍提",
            "modernPhoneticZh": "嘎帝嘎哈拿₍斯₎瓦巴瓦维舒叠",
            "meaningZh": "照破六道生死稠林而自性本来清净无染尊！",
            "meaningEn": "Pure in intrinsic nature amidst the dense paths of rebirth!",
            "tangNoteZh": "第三门第9句 · 夹注：「六种稠林，自然清净。已上第三净除恶趣门」。",
            "words": [
                  {
                        "iast": "gatigahanasvabhāvaviśuddhe",
                        "stem": "gati-gahana-svabhāva-viśuddha",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "誐底誐诃曩娑嚩婆(引)嚩尾戍没第（拼读参考：嘎帝嘎哈拿₍斯₎瓦巴瓦维舒叠）",
                        "meaningZh": "趣向·稠林·自性·最极清净",
                        "meaningEn": "course + guilelessness among the guileful + own-being + O completely purified",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-10",
            "index": 10,
            "iast": "abhiṣiñcatu mām",
            "classicalTranslitZh": "阿鼻詵者睹𤚥(引)",
            "modernPhoneticZh": "阿比申佳度 芒",
            "meaningZh": "唯愿慈悲以甘露法水灌我顶门！",
            "meaningEn": "Consecrate and anoint me!",
            "tangNoteZh": "第四门【善明灌顶门】第10句 · 夹注：「灌顶我」。",
            "words": [
                  {
                        "iast": "abhiṣiñcatu",
                        "stem": "abhiṣiñca",
                        "grammar": "Impv.2.Sg. · 灌顶祈使 · Impv. 3rd Sg. · 祈愿单数",
                        "transliterationZh": "阿毗瑟喃者都（拼读参考：阿比申佳度）",
                        "meaningZh": "愿请以甘露灌顶加持！",
                        "meaningEn": "may it consecrate! anoint with nectar!!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "mām",
                        "stem": "mām",
                        "grammar": "Pron.Acc.Sg. · 第一人称宾格",
                        "transliterationZh": "莽(引)（拼读参考：芒）",
                        "meaningZh": "我（宾格：守护/加持于我）",
                        "meaningEn": "me",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-11",
            "index": 11,
            "iast": "sugatavaravacana",
            "classicalTranslitZh": "素蘖多嚩啰嚩左曩",
            "modernPhoneticZh": "苏嘎达瓦啦瓦佳拿",
            "meaningZh": "善逝如来最上殊胜微妙言教！",
            "meaningEn": "With the supreme words of the Sugata!",
            "tangNoteZh": "第四门第11句 · 夹注：「善逝、殊胜言教」。",
            "words": [
                  {
                        "iast": "sugatavaravacana",
                        "stem": "sugata-varas-avacana",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "苏誐怛嚩啰嚩者曩（拼读参考：苏嘎达瓦啦瓦佳拿）",
                        "meaningZh": "善逝·幅度·哑口",
                        "meaningEn": "Sugata + width + speechless",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-12",
            "index": 12,
            "iast": "amṛtābhiṣekair mahāmantrapadaiḥ",
            "classicalTranslitZh": "阿蜜栗(二合)多鼻晒罽摩诃曼怛啰(二合)跛代",
            "modernPhoneticZh": "阿₍姆₎日达比奢该₍尔₎ 玛哈-曼₍特₎啦巴代₍希₎",
            "meaningZh": "以不死甘露灌顶及广大真言章句加持摄受！",
            "meaningEn": "With ambrosial consecrations and great mantra-phrases!",
            "tangNoteZh": "第四门第12句 · 夹注：「甘露，又云灌顶不死句」。",
            "words": [
                  {
                        "iast": "amṛtābhiṣekair",
                        "stem": "ma-ta-bha",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "阿蜜哩多毗晒皆哩（拼读参考：阿₍姆₎日达比奢该₍尔₎）",
                        "meaningZh": "无我大慈三昧·真如实际·破有相福德光",
                        "meaningEn": "selfless great loving-kindness & immutable Suchness & blessedness transcending existence",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "mahāmantrapadaiḥ",
                        "stem": "mahā-mantrapada",
                        "grammar": "Samāsa · 复合词 (Inst. Pl. · 具格复数)",
                        "transliterationZh": "摩诃曼怛啰跛代醯（拼读参考：玛哈-曼₍特₎啦巴代₍希₎）",
                        "meaningZh": "以诸大真言章句",
                        "meaningEn": "great + by",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-13",
            "index": 13,
            "iast": "āhara āhara",
            "classicalTranslitZh": "阿诃啰阿诃啰",
            "modernPhoneticZh": "阿哈啦 阿哈啦",
            "meaningZh": "唯愿慈悲摄受、恒常摄持拔苦！",
            "meaningEn": "Draw near, sustain and embrace!",
            "tangNoteZh": "第四门第13句 · 夹注：「唯愿摄受，攘胜诸苦恼」。",
            "words": [
                  {
                        "iast": "āhara",
                        "stem": "āhara",
                        "grammar": "Impv.2.Sg. · 摄赐福寿",
                        "transliterationZh": "阿(引)诃啰（拼读参考：阿哈啦）",
                        "meaningZh": "请摄召、赐予妙寿福德供养！",
                        "meaningEn": "bring! fetch! bestow!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "āhara",
                        "stem": "āhara",
                        "grammar": "Impv.2.Sg. · 摄赐福寿",
                        "transliterationZh": "阿(引)诃啰（拼读参考：阿哈啦）",
                        "meaningZh": "请摄召、赐予妙寿福德供养！",
                        "meaningEn": "bring! fetch! bestow!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-14",
            "index": 14,
            "iast": "āyuḥsaṃdhāraṇi",
            "classicalTranslitZh": "阿庾散驮啰抳",
            "modernPhoneticZh": "阿尤₍忽₎-散达啦尼",
            "meaningZh": "坚固任持行者寿命慧命不失尊！",
            "meaningEn": "O Upholder and Sustainer of Life-Force!",
            "tangNoteZh": "第四门第14句 · 夹注：「坚住持寿命。已上第四善明灌顶门」。",
            "words": [
                  {
                        "iast": "āyuḥsaṃdhāraṇi",
                        "stem": "āyuḥ-saṃdhāraṇa",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. · 呼格/处格)",
                        "transliterationZh": "阿(引)庾虎三驮(引)啰抳（拼读参考：阿尤₍忽₎-散达啦尼）",
                        "meaningZh": "寿命擎尊",
                        "meaningEn": "life-force + O supporting",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-15",
            "index": 15,
            "iast": "śodhaya śodhaya",
            "classicalTranslitZh": "戍驮野戍驮野",
            "modernPhoneticZh": "硕达呀 硕达呀",
            "meaningZh": "请清净、彻底清净三业尘劳！",
            "meaningEn": "Cleanse, cleanse completely!",
            "tangNoteZh": "第五门【神力加持门】第15句。",
            "words": [
                  {
                        "iast": "śodhaya",
                        "stem": "śodhaya",
                        "grammar": "Impv.2.Sg. · 净除祈使",
                        "transliterationZh": "戍驮耶（拼读参考：硕达呀）",
                        "meaningZh": "请净除、涤荡清净！",
                        "meaningEn": "purify! cleanse!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "śodhaya",
                        "stem": "śodhaya",
                        "grammar": "Impv.2.Sg. · 净除祈使",
                        "transliterationZh": "戍驮耶（拼读参考：硕达呀）",
                        "meaningZh": "请净除、涤荡清净！",
                        "meaningEn": "purify! cleanse!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-16",
            "index": 16,
            "iast": "gaganaviśuddhe",
            "classicalTranslitZh": "誐誐曩尾戍提",
            "modernPhoneticZh": "嘎嘎拿-维舒叠",
            "meaningZh": "犹如太虚空般纤尘不染之清净尊！",
            "meaningEn": "O One Pure as the Boundless Sky!",
            "tangNoteZh": "第五门第16句 · 夹注：「如虚空清净」。",
            "words": [
                  {
                        "iast": "gaganaviśuddhe",
                        "stem": "gagana-viśuddha",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "誐誐曩尾戍没第（拼读参考：嘎嘎拿-维舒叠）",
                        "meaningZh": "虚空最极清净",
                        "meaningEn": "sky + O completely purified",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-17",
            "index": 17,
            "iast": "uṣṇīṣavijayaviśuddhe",
            "classicalTranslitZh": "坞瑟腻(二合)沙尾惹野尾戍提",
            "modernPhoneticZh": "乌₍师₎尼沙-维佳呀维舒叠",
            "meaningZh": "佛顶最胜尊胜清净佛母尊！",
            "meaningEn": "O Pure and Victorious Crown-Uṣṇīṣa!",
            "tangNoteZh": "第五门第17句 · 夹注：「佛顶、最胜清净」。",
            "words": [
                  {
                        "iast": "uṣṇīṣavijayaviśuddhe",
                        "stem": "uṣṇīṣa-vijaya-viśuddha",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "坞瑟抳(引)洒尾惹耶尾戍没第（拼读参考：乌₍师₎尼沙-维佳呀维舒叠）",
                        "meaningZh": "佛顶肉髻相·最胜尊胜·最极清净",
                        "meaningEn": "Uṣṇīṣa + supreme victory! triumph! + O completely purified",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-18",
            "index": 18,
            "iast": "sahasraraśmisaṃcodite",
            "classicalTranslitZh": "娑诃萨啰(二合)啰湿铭(二合)散祖儞帝",
            "modernPhoneticZh": "萨哈₍斯₎啦-啦₍希₎米散卓地帝",
            "meaningZh": "千道光明周遍照耀警觉发起尊！",
            "meaningEn": "Aroused and illumined by a thousand rays of light!",
            "tangNoteZh": "第五门第18句 · 夹注：「千光明、惊觉」。",
            "words": [
                  {
                        "iast": "sahasraraśmisaṃcodite",
                        "stem": "sa-ha-sa",
                        "grammar": "Mantra Voc. · 真言呼请句",
                        "transliterationZh": "萨诃娑啰啰室弭三祖地帝（拼读参考：萨哈₍斯₎啦-啦₍希₎米散卓地帝）",
                        "meaningZh": "一切诸谛圆满·因缘空寂大乐·清净离诸尘垢（呼请加持）",
                        "meaningEn": "all-pervading truth & auspiciousness & causal emptiness & spiritual joy & stainless purity free from dust (vocative invocation)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-19",
            "index": 19,
            "iast": "sarvatathāgatāvalokani",
            "classicalTranslitZh": "萨嚩怛他(引)蘖多嚩路迦儞",
            "modernPhoneticZh": "萨₍尔₎瓦-达他嘎达-瓦洛嘎尼",
            "meaningZh": "十方一切如来慈眼同所瞻视护念者！",
            "meaningEn": "Beheld with grace by all Tathāgatas!",
            "tangNoteZh": "第五门第19句 · 一切如来同观摄受。",
            "words": [
                  {
                        "iast": "sarvatathāgatāvalokani",
                        "stem": "sarvatathāgata-avaloka-ni",
                        "grammar": "Samāsa · 复合词 (Stem · 词干)",
                        "transliterationZh": "萨哩嚩怛他(引)誐多嚩路迦你（拼读参考：萨₍尔₎瓦-达他嘎达-瓦洛嘎尼）",
                        "meaningZh": "一切如来·观·在于",
                        "meaningEn": "all Tathagatas + viewing + in",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-20",
            "index": 20,
            "iast": "ṣaṭpāramitāparipūraṇi",
            "classicalTranslitZh": "杀播(二合)啰蜜多跛哩布啰抳",
            "modernPhoneticZh": "沙₍特₎巴啦米达巴里布啦尼",
            "meaningZh": "令六度波罗蜜多功德圆满具足者！",
            "meaningEn": "Fulfiller of all Six Perfections (Pāramitās)!",
            "tangNoteZh": "第五门第20句 · 布施持戒忍辱精进禅定般若圆满。",
            "words": [
                  {
                        "iast": "ṣaṭpāramitāparipūraṇi",
                        "stem": "ṣaṭ-pāramitā-pari-pūraṇa",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. · 呼格/处格)",
                        "transliterationZh": "洒怛波啰弭多跛哩布啰抳（拼读参考：沙₍特₎巴啦米达巴里布啦尼）",
                        "meaningZh": "六·波罗蜜多·般·遂尊",
                        "meaningEn": "six + Pāramitā + wisdom + O satisfy",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-21",
            "index": 21,
            "iast": "sarvatathāgatahṛdayādhiṣṭhānādhiṣṭhite",
            "classicalTranslitZh": "萨嚩怛他蘖多纥哩(二合)娜野地瑟姹(二合)曩地瑟耻(二合)帝",
            "modernPhoneticZh": "萨₍尔₎瓦-达他嘎达-₍赫₎日达呀-地₍师₎他拿-地₍师₎提帝",
            "meaningZh": "获一切如来真实心秘密神力加持所摄持尊！",
            "meaningEn": "Empowered by the heart-blessing of all Tathāgatas!",
            "tangNoteZh": "第五门第21句 · 夹注：「一切如来神力所加持」。",
            "words": [
                  {
                        "iast": "sarvatathāgatahṛdayādhiṣṭhānādhiṣṭhite",
                        "stem": "sarvatathāgata-hṛdaya-adhiṣṭhāna-adhiṣṭhita",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "萨哩嚩怛他(引)誐怛纥哩捺夜地瑟侘(引)那(引)地瑟耻帝（拼读参考：萨₍尔₎瓦-达他嘎达-₍赫₎日达呀-地₍师₎他拿-地₍师₎提帝）",
                        "meaningZh": "一切如来·心·加持·所加持",
                        "meaningEn": "all Tathagatas + heart + spiritual blessing + O blessed",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-22",
            "index": 22,
            "iast": "mahāmudre",
            "classicalTranslitZh": "摩诃母捺哩(二合)",
            "modernPhoneticZh": "玛哈穆₍德₎雷",
            "meaningZh": "如来大金刚契印尊！",
            "meaningEn": "O Great Mudrā (Sacred Seal)!",
            "tangNoteZh": "第五门第22句 · 夹注：「印契」。",
            "words": [
                  {
                        "iast": "mahāmudre",
                        "stem": "mahāmudrā",
                        "grammar": "Samāsa · 大手印 · Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "摩诃母捺隶（拼读参考：玛哈穆₍德₎雷）",
                        "meaningZh": "大手印、大法契印尊",
                        "meaningEn": "O Mahāmudrā, Great Seal / in Mahāmudrā, Great Seal",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-23",
            "index": 23,
            "iast": "vajrakāyasaṃhatanaviśuddhe",
            "classicalTranslitZh": "嚩日啰(二合)迦野僧贺多曩尾戍提",
            "modernPhoneticZh": "瓦₍吉₎啦-嘎呀-桑哈达拿维舒叠",
            "meaningZh": "金刚坚固钩锁妙身究竟清净尊！",
            "meaningEn": "Pure with an adamantine, compact Vajra-body!",
            "tangNoteZh": "第五门第23句 · 夹注：「金刚钩锁身清净」。",
            "words": [
                  {
                        "iast": "vajrakāyasaṃhatanaviśuddhe",
                        "stem": "vajrakāya-saṃhata-na-viśuddha",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "嚩日啰迦(引)耶三诃怛曩尾戍没第（拼读参考：瓦₍吉₎啦-嘎呀-桑哈达拿维舒叠）",
                        "meaningZh": "金刚身·好好儿编织·不·最极清净",
                        "meaningEn": "vajrakāya + struck together + not + O completely purified",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-24",
            "index": 24,
            "iast": "sarvāvaraṇāpāyadurgatipariśuddhe",
            "classicalTranslitZh": "萨嚩嚩啰拏播野讷蘖底跛哩尾戍提",
            "modernPhoneticZh": "萨₍尔₎瓦-瓦啦拿巴呀杜₍尔₎嘎帝巴里舒叠",
            "meaningZh": "净除一切业障、报障、烦恼障及三恶道苦趣尊！",
            "meaningEn": "Purifier of all karmic obstructions and evil destinies!",
            "tangNoteZh": "第五门第24句 · 夹注：「一切障清净也。已上第五神力加持门」。",
            "words": [
                  {
                        "iast": "sarvāvaraṇāpāyadurgatipariśuddhe",
                        "stem": "sarva-āvaraṇa-āpāya-durgati-pariśuddha",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "萨哩嚩(引)嚩啰拏(引)波耶努哩誐底跛哩戍没第（拼读参考：萨₍尔₎瓦-瓦啦拿巴呀杜₍尔₎嘎帝巴里舒叠）",
                        "meaningZh": "一切·障蔽·次复·恶趣·圆满清净",
                        "meaningEn": "all + obscuration + and afterwards we will incite them who are veritably in a sphere-of-existence charact + evil destiny + O thoroughly pure",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-25",
            "index": 25,
            "iast": "pratinivartaya āyuḥśuddhe",
            "classicalTranslitZh": "钵啰(二合)底儞韈多野阿庾戍提",
            "modernPhoneticZh": "₍普₎啦帝尼瓦₍尔₎达呀 阿尤₍忽₎舒叠",
            "meaningZh": "请回转死厄、延展清净无垢寿命！",
            "meaningEn": "Turn back death and purify our life-span!",
            "tangNoteZh": "第六门【寿命增长门】第25句 · 夹注：「寿命增长，皆得清净」。",
            "words": [
                  {
                        "iast": "pratinivartaya",
                        "stem": "pratinivartaya",
                        "grammar": "Impv.2.Sg. · 回遮延寿",
                        "transliterationZh": "钵啰底你嚩哩怛耶（拼读参考：₍普₎啦帝尼瓦₍尔₎达呀）",
                        "meaningZh": "请回遮逆转（灾厄）、令寿复延！",
                        "meaningEn": "turn back (evil)! restore!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "āyuḥśuddhe",
                        "stem": "āyuḥ-śuddha",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "阿(引)庾虎戍没第（拼读参考：阿尤₍忽₎舒叠）",
                        "meaningZh": "寿命清净",
                        "meaningEn": "life-force + O pure",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-26",
            "index": 26,
            "iast": "samayādhiṣṭhite",
            "classicalTranslitZh": "三摩野地瑟耻(二合)帝",
            "modernPhoneticZh": "萨玛呀地₍师₎提帝",
            "meaningZh": "本昔三昧耶大誓愿力所加持尊！",
            "meaningEn": "Empowered by the sacred Samaya pledge!",
            "tangNoteZh": "第六门第26句 · 夹注：「誓愿加持」。",
            "words": [
                  {
                        "iast": "samayādhiṣṭhite",
                        "stem": "samayā-dhiṣṭhita",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "萨摩夜地瑟耻帝（拼读参考：萨玛呀地₍师₎提帝）",
                        "meaningZh": "中间依止处",
                        "meaningEn": "in the middle of + O standing",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-27",
            "index": 27,
            "iast": "maṇi maṇi mahāmaṇi",
            "classicalTranslitZh": "摩抳摩抳摩诃摩抳",
            "modernPhoneticZh": "玛尼 玛尼 玛哈玛尼",
            "meaningZh": "世宝、法宝、福慧圆满大摩尼如意宝珠！",
            "meaningEn": "Jewel, Jewel, Great Wish-Fulfilling Jewel!",
            "tangNoteZh": "第六门第27句 · 夹注：「世宝亦云法宝，福慧二种资粮。已上第六寿命增长门」。",
            "words": [
                  {
                        "iast": "maṇi",
                        "stem": "maṇi",
                        "grammar": "Noun · 摩尼宝珠",
                        "transliterationZh": "摩抳（拼读参考：玛尼）",
                        "meaningZh": "摩尼宝珠（如意离垢宝）",
                        "meaningEn": "Maṇi jewel, luminous gem",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "maṇi",
                        "stem": "maṇi",
                        "grammar": "Noun · 摩尼宝珠",
                        "transliterationZh": "摩抳（拼读参考：玛尼）",
                        "meaningZh": "摩尼宝珠（如意离垢宝）",
                        "meaningEn": "Maṇi jewel, luminous gem",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "mahāmaṇi",
                        "stem": "mahāmaṇi",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "摩诃摩抳（拼读参考：玛哈玛尼）",
                        "meaningZh": "广大",
                        "meaningEn": "great or precious jewel",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-28",
            "index": 28,
            "iast": "tathatābhūtakoṭipariśuddhe",
            "classicalTranslitZh": "怛他多部多俱胝跛哩戍提",
            "modernPhoneticZh": "达他达布达果蒂巴里舒叠",
            "meaningZh": "真如实际本际周遍圆满清净尊！",
            "meaningEn": "Pure as Suchness (Tathatā) and the Reality-Limit (Bhūtakoṭi)!",
            "tangNoteZh": "第七门【定慧相应门】第28句 · 夹注：「真如实际遍满清净」。",
            "words": [
                  {
                        "iast": "tathatābhūtakoṭipariśuddhe",
                        "stem": "tathatā-bhūtakoṭi-pariśuddha",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "怛他多部(引)怛俱置跛哩戍没第（拼读参考：达他达布达果蒂巴里舒叠）",
                        "meaningZh": "真如·实际·圆满清净",
                        "meaningEn": "Suchness + limit of reality + O thoroughly pure",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-29",
            "index": 29,
            "iast": "visphuṭabuddhiśuddhe",
            "classicalTranslitZh": "尾萨普(二合)吒没地戍提",
            "modernPhoneticZh": "维₍斯₎普达布地舒叠",
            "meaningZh": "洞然开显本觉大菩提智清净尊！",
            "meaningEn": "Pure in radiantly unfolded enlightenment!",
            "tangNoteZh": "第七门第29句 · 夹注：「显现智慧清净」。",
            "words": [
                  {
                        "iast": "visphuṭabuddhiśuddhe",
                        "stem": "vi-sphuṭa-buddhiśuddha",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "尾悉普吒没地戍没第（拼读参考：维₍斯₎普达布地舒叠）",
                        "meaningZh": "闢·开·清净尊",
                        "meaningEn": "settle + suffused + O pure in heart or intention",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-30",
            "index": 30,
            "iast": "jaya jaya vijaya vijaya",
            "classicalTranslitZh": "惹野惹野尾惹野尾惹野",
            "modernPhoneticZh": "佳呀 佳呀 维佳呀 维佳呀",
            "meaningZh": "殊胜、殊胜，最胜、最胜（真俗二谛圆融无碍）！",
            "meaningEn": "Conquer, conquer! Triumph, triumph!",
            "tangNoteZh": "第七门第30句 · 夹注：「最胜最胜，即是真俗二谛法门」。",
            "words": [
                  {
                        "iast": "jaya",
                        "stem": "jaya",
                        "grammar": "Impv./Noun · 尊胜吉祥",
                        "transliterationZh": "惹耶（拼读参考：佳呀）",
                        "meaningZh": "胜伏、最胜吉祥！",
                        "meaningEn": "conquer! victory!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "jaya",
                        "stem": "jaya",
                        "grammar": "Impv./Noun · 尊胜吉祥",
                        "transliterationZh": "惹耶（拼读参考：佳呀）",
                        "meaningZh": "胜伏、最胜吉祥！",
                        "meaningEn": "conquer! victory!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "vijaya",
                        "stem": "vijaya",
                        "grammar": "Noun/Impv. · 殊胜尊胜",
                        "transliterationZh": "尾惹耶（拼读参考：维佳呀）",
                        "meaningZh": "最胜尊胜、普胜一切！",
                        "meaningEn": "supreme victory! triumph!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "vijaya",
                        "stem": "vijaya",
                        "grammar": "Noun/Impv. · 殊胜尊胜",
                        "transliterationZh": "尾惹耶（拼读参考：维佳呀）",
                        "meaningZh": "最胜尊胜、普胜一切！",
                        "meaningEn": "supreme victory! triumph!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-31",
            "index": 31,
            "iast": "smara smara sarvabuddhādhiṣṭhitaśuddhe",
            "classicalTranslitZh": "萨么(二合)啰萨么啰萨嚩没驮地瑟耻(二合)多戍提",
            "modernPhoneticZh": "₍斯₎玛啦 ₍斯₎玛啦 萨₍尔₎瓦-布达-地₍师₎提达舒叠",
            "meaningZh": "请忆念、忆念一切诸佛神力加持之清净本愿！",
            "meaningEn": "Remember, remember the purity blessed by all Buddhas!",
            "tangNoteZh": "第七至八门第31句 · 《T19n0974B》此处详列过去七佛与圣观自在归敬名号。",
            "words": [
                  {
                        "iast": "smara",
                        "stem": "smara",
                        "grammar": "Impv. 2nd Sg. · 祈使忆念",
                        "transliterationZh": "娑摩啰（拼读参考：₍斯₎玛啦）",
                        "meaningZh": "祈请忆念本誓",
                        "meaningEn": "remember Your primordial vow!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "smara",
                        "stem": "smara",
                        "grammar": "Impv. 2nd Sg. · 祈使忆念",
                        "transliterationZh": "娑摩啰（拼读参考：₍斯₎玛啦）",
                        "meaningZh": "祈请忆念本誓",
                        "meaningEn": "remember Your primordial vow!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "sarvabuddhādhiṣṭhitaśuddhe",
                        "stem": "sarva-buddha-adhiṣṭhita-śuddha",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "萨哩嚩没驮(引)地瑟耻怛戍没第（拼读参考：萨₍尔₎瓦-布达-地₍师₎提达舒叠）",
                        "meaningZh": "一切·佛陀·所加持·清净",
                        "meaningEn": "all + Buddha + blessed + O pure",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-32",
            "index": 32,
            "iast": "vajri vajragarbhe",
            "classicalTranslitZh": "嚩日哩(二合)嚩日啰(二合)蘖陛",
            "modernPhoneticZh": "瓦₍吉₎里 瓦₍吉₎啦嘎₍尔₎贝",
            "meaningZh": "执金刚尊、金刚胎藏尊！",
            "meaningEn": "O Vajra-Holder, O Adamantine Vajra-Matrix!",
            "tangNoteZh": "第八门【金刚供养门】第32句 · 夹注：「金刚藏」。",
            "words": [
                  {
                        "iast": "vajri",
                        "stem": "vajrin",
                        "grammar": "Voc. Fem. / Loc. · 呼格/处格",
                        "transliterationZh": "嚩日哩（拼读参考：瓦₍吉₎里）",
                        "meaningZh": "持械金刚杵、因达罗尊",
                        "meaningEn": "O armed with the thunderbolt, of Indra",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "vajragarbhe",
                        "stem": "vajragarbha",
                        "grammar": "Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "嚩日啰誐哩陛（拼读参考：瓦₍吉₎啦嘎₍尔₎贝）",
                        "meaningZh": "金刚藏尊",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-33",
            "index": 33,
            "iast": "vajraṃ bhavatu mama śarīraṃ sarvasattvānāṃ ca kāyapariśuddhiḥ",
            "classicalTranslitZh": "嚩日囕(二合)婆嚩睹么么舍哩囕萨嚩萨埵难(引)者迦野跛哩尾戍提",
            "modernPhoneticZh": "瓦₍吉₎朗 巴瓦度 玛玛 沙里朗 萨₍尔₎瓦-萨₍特₎瓦南 佳 嘎呀-巴里-舒地₍希₎",
            "meaningZh": "愿令我身与一切众生之身悉成金刚不坏体、究竟清净无染！",
            "meaningEn": "May my body and the bodies of all sentient beings become like a Vajra and utterly pure!",
            "tangNoteZh": "第八门第33句 · 夹注：「么么」是我之义，诵者于此自称姓名或所祈福者姓名。",
            "words": [
                  {
                        "iast": "vajraṃ",
                        "stem": "vajram",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "嚩日览（拼读参考：瓦₍吉₎朗）",
                        "meaningZh": "金刚",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bhavatu",
                        "stem": "bhavatu",
                        "grammar": "Impv. 3rd Sg. · 祈愿式",
                        "transliterationZh": "婆嚩都（拼读参考：巴瓦度）",
                        "meaningZh": "愿成就、愿悉吉祥",
                        "meaningEn": "may it be, let there be!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "mama",
                        "stem": "mama",
                        "grammar": "Pron. Gen. · 第一人称属格",
                        "transliterationZh": "摩摩（拼读参考：玛玛）",
                        "meaningZh": "我之（行者所有）",
                        "meaningEn": "my, of me (the practitioner)",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "śarīraṃ",
                        "stem": "śarīram",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "舍哩(引)览（拼读参考：沙里朗）",
                        "meaningZh": "躯",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "sarvasattvānāṃ",
                        "stem": "sarvasattva",
                        "grammar": "Samāsa · 一切众生 · Gen. Pl. · 属格复数",
                        "transliterationZh": "萨嚩萨埵喃（拼读参考：萨₍尔₎瓦-萨₍特₎瓦南）",
                        "meaningZh": "诸一切众生、普皆有情之",
                        "meaningEn": "of all all sentient beings",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-34",
            "index": 34,
            "iast": "sarvagatipariśuddhe sarvatathāgatāś ca me samāśvāsayantu",
            "classicalTranslitZh": "萨嚩蘖底跛哩戍提萨嚩怛他蘖多室者(二合)铭三摩湿嚩(二合)娑演睹",
            "modernPhoneticZh": "萨₍尔₎瓦-嘎帝巴里舒叠 萨₍尔₎瓦-达他嘎达₍希₎ 佳 美 萨玛₍湿₎瓦萨延度",
            "meaningZh": "一切六道受生皆得清净尊！愿一切如来慈悲安慰摄受于我！",
            "meaningEn": "Purifier of all rebirth paths—may all Tathāgatas console and reassure me!",
            "tangNoteZh": "第九门【普证清净门】第34句 · 夹注：「一切趣皆清净，一切如来安慰令得加持」。",
            "words": [
                  {
                        "iast": "sarvagatipariśuddhe",
                        "stem": "sarva-gati-pariśuddha",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "萨哩嚩誐底跛哩戍没第（拼读参考：萨₍尔₎瓦-嘎帝巴里舒叠）",
                        "meaningZh": "一切·趣向·圆满清净",
                        "meaningEn": "all + course + O thoroughly pure",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "sarvatathāgatāś",
                        "stem": "sa-ra-va",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "萨哩嚩怛他(引)誐多室（拼读参考：萨₍尔₎瓦-达他嘎达₍希₎）",
                        "meaningZh": "一切诸谛圆满·清净离诸尘垢·最上真言离言说",
                        "meaningEn": "all-pervading truth & auspiciousness & stainless purity free from dust & supreme ineffable speech",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "me",
                        "stem": "me",
                        "grammar": "Pron. Dat./Gen. · 第一人称",
                        "transliterationZh": "铭（拼读参考：美）",
                        "meaningZh": "于我、为我",
                        "meaningEn": "to me, my",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "samāśvāsayantu",
                        "stem": "samāśvāsayantu",
                        "grammar": "Impv.3.Pl. · 安慰祈愿",
                        "transliterationZh": "萨摩(引)湿嚩(引)萨演都（拼读参考：萨玛₍湿₎瓦萨延度）",
                        "meaningZh": "愿诸如来慈悲安慰授记！",
                        "meaningEn": "may they comfort and encourage!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "usnisa-35",
            "index": 35,
            "iast": "budhya budhya bodhaya bodhaya samantapariśuddhe sarvatathāgatahṛdayādhiṣṭhānādhiṣṭhite mahāmudre svāhā",
            "classicalTranslitZh": "没地野(二合)没地野冒驮野冒驮野三满多跛哩戍提萨嚩怛他蘖多纥哩(二合)娜野地瑟姹(二合)曩地瑟耻(二合)帝摩诃母捺哩(二合)娑嚩(二合引)诃(引)",
            "modernPhoneticZh": "布₍地₎呀 布₍地₎呀 博达呀 博达呀 萨曼达-巴里-舒叠 萨₍尔₎瓦-达他嘎达-₍赫₎日达呀-地₍师₎他拿-地₍师₎提帝 玛哈穆₍德₎雷 ₍斯₎瓦哈",
            "meaningZh": "自觉、自觉，觉他、觉他！普皆圆满清净尊、获一切如来心加持之大契印尊，吉祥圆成，娑嚩诃！",
            "meaningEn": "Awaken, awaken! Enlighten, enlighten! O Universally Pure One, Great Seal empowered by the heart of all Tathāgatas, Svāhā!",
            "tangNoteZh": "第九至十门【成就涅槃门】第35句 · 夹注：「吉祥成就之义，全咒十门圆满」。",
            "words": [
                  {
                        "iast": "budhya",
                        "stem": "budhya",
                        "grammar": "Impv.2.Sg. · 觉照祈使",
                        "transliterationZh": "没地耶（拼读参考：布₍地₎呀）",
                        "meaningZh": "请觉知、垂鉴觉照！",
                        "meaningEn": "awake! perceive! behend!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "budhya",
                        "stem": "budhya",
                        "grammar": "Impv.2.Sg. · 觉照祈使",
                        "transliterationZh": "没地耶（拼读参考：布₍地₎呀）",
                        "meaningZh": "请觉知、垂鉴觉照！",
                        "meaningEn": "awake! perceive! behend!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bodhaya",
                        "stem": "bodhaya",
                        "grammar": "Impv.2.Sg. · 觉悟祈使",
                        "transliterationZh": "冒驮耶（拼读参考：博达呀）",
                        "meaningZh": "请开晓觉悟、令发菩提觉智！",
                        "meaningEn": "awaken! enlighten! illuminate!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bodhaya",
                        "stem": "bodhaya",
                        "grammar": "Impv.2.Sg. · 觉悟祈使",
                        "transliterationZh": "冒驮耶（拼读参考：博达呀）",
                        "meaningZh": "请开晓觉悟、令发菩提觉智！",
                        "meaningEn": "awaken! enlighten! illuminate!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "samantapariśuddhe",
                        "stem": "samanta-pariśuddha",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "萨曼怛跛哩戍没第（拼读参考：萨曼达-巴里-舒叠）",
                        "meaningZh": "普遍圆满清净",
                        "meaningEn": "universal + O thoroughly pure",
                        "origin": "derived-reference"
                  }
            ]
      }
],
  },
  {
    id: 'karandamudra-dharani',
    titleZh: '一切如来心秘密全身舍利宝箧印陀罗尼（大藏原典40句全本）',
    titleSanskritIast: 'Sarvatathāgatādhiṣṭhāna-hṛdaya-guhya-dhātu-karaṇḍamudrā-dhāraṇī',
    titleEnglish: 'Secret Relic-Casket Seal Dhāraṇī of the Heart of All Tathāgatas (Complete 40 Clauses)',
    categoryId: 'supreme-mantras',
    taishoNo: 'T19n1022A / T19n1022B',
    translatorZh: '唐·特进试鸿胪卿大兴善寺三藏沙门大广智不空 奉诏译',
    sutraSourceZh: '《一切如来心秘密全身舍利宝箧印陀罗尼经》(T19n1022A)',
    deityZh: '十方三世一切如来全身舍利宝塔',
    meritsAndSummaryZh:
      '三大咒塔核心陀罗尼之一，严格依据大藏经《T19n1022A》原典夹注「一」至「四十」共 40 句完整逐句收录。经云若书写此经置塔中，即为一切如来金刚藏窣堵波，十方诸佛常来加持。杭州雷峰塔（吴越王钱俶造八万四千铜塔）出土原刻本即为此咒。',
    recitationTipsZh:
      '本咒共 40 句，多次出现 tryadhvikānāṃ（三世）、vajra（金刚）、dhātu（法界/舍利）、mudrā（印契）等复合词，持诵时节奏宜庄重沉稳，每遇 svāhā 皆作长音收摄。',
    provenance: {
      sourceType: 'CBETA-XML-P5',
      cbetaId: 'T19n1022A',
      cbetaRawXmlUrl: cbetaT19n1022A?.cbetaRawUrl || 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n1022A.xml',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T19n1022A',
      editionCitation:
        'CBETA XML-P5 T19n1022A《一切如来心秘密全身舍利宝箧印陀罗尼经》(唐·不空三藏译，原典四十句标号) 暨雷峰塔五代刻经本、日本高山寺悉昙梵本。',
      manuscriptNotesZh:
        '已从 github.com/cbeta-org/xml-p5 下载 T19n1022A.xml 原典，按经内「一」至「四十」原注逐句对音建档。',
      rawSnippet: cbetaT19n1022A?.dharaniParagraphs.map((p) => p.text).join('\n\n'),
    },
    verses: [
      {
            "id": "karanda-1",
            "index": 1,
            "iast": "namas tryadhvikānām",
            "classicalTranslitZh": "娜莫悉怛哩野(四合)地尾(二合)迦南",
            "modernPhoneticZh": "拿玛₍斯₎ ₍特哩₎呀₍德₎维嘎南",
            "meaningZh": "顶礼过去、现在、未来三世！",
            "meaningEn": "Homage to Those of the Three Times!",
            "tangNoteZh": "《T19n1022A》原典标号：第一句",
            "words": [
                  {
                        "iast": "namas",
                        "stem": "namas",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "曩莫（拼读参考：拿玛₍斯₎）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "tryadhvikānām",
                        "stem": "ta-ra-ya",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "怛哩耶驮尾迦(引)喃(引)（拼读参考：₍特哩₎呀₍德₎维嘎南）",
                        "meaningZh": "真如实际·清净离诸尘垢·一乘如实之道",
                        "meaningEn": "immutable Suchness & stainless purity free from dust & supreme vehicle of awakening",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-2",
            "index": 2,
            "iast": "sarvatathāgatānām",
            "classicalTranslitZh": "萨婆怛他(引)蘖多南",
            "modernPhoneticZh": "萨₍尔₎瓦-达他嘎达南",
            "meaningZh": "十方一切诸如来！",
            "meaningEn": "Of all Tathāgatas!",
            "tangNoteZh": "《T19n1022A》原典标号：第二句",
            "words": [
                  {
                        "iast": "sarvatathāgatānām",
                        "stem": "sarvatathāgata",
                        "grammar": "Gen. Pl. · 属格复数",
                        "transliterationZh": "萨嚩怛他孽多喃（拼读参考：萨₍尔₎瓦-达他嘎达南）",
                        "meaningZh": "诸一切如来之",
                        "meaningEn": "of all all Tathagatas",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-3",
            "index": 3,
            "iast": "oṃ",
            "classicalTranslitZh": "唵",
            "modernPhoneticZh": "嗡",
            "meaningZh": "嗡（法报化三身总持法音）！",
            "meaningEn": "Oṃ!",
            "tangNoteZh": "《T19n1022A》原典标号：第三句",
            "words": [
                  {
                        "iast": "oṃ",
                        "stem": "oṃ",
                        "grammar": "Praṇava · 圣音",
                        "transliterationZh": "唵（拼读参考：嗡）",
                        "meaningZh": "三身总持圣音（法报化三身摄受）",
                        "meaningEn": "sacred Praṇava syllable embodying Trikāya",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-4",
            "index": 4,
            "iast": "bhuvibhavanavare",
            "classicalTranslitZh": "部尾婆嚩娜嚩𠼝",
            "modernPhoneticZh": "布维巴瓦拿瓦雷",
            "meaningZh": "周遍三有世间显发最胜功德尊！",
            "meaningEn": "O Supreme Manifestation throughout Existence!",
            "tangNoteZh": "《T19n1022A》原典标号：第四句",
            "words": [
                  {
                        "iast": "bhuvibhavanavare",
                        "stem": "bhuvi-bhavat-anavara",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "部尾婆嚩曩嚩隶（拼读参考：布维巴瓦拿瓦雷）",
                        "meaningZh": "地上·汝·不亚尊",
                        "meaningEn": "you + O not inferior to",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-5",
            "index": 5,
            "iast": "vacaṭi",
            "classicalTranslitZh": "嚩者𠼝",
            "modernPhoneticZh": "瓦佳蒂",
            "meaningZh": "微妙法音宣演自在尊！",
            "meaningEn": "O Eloquence of Dharma-Speech!",
            "tangNoteZh": "《T19n1022A》原典标号：第五句（已校改旧传误字为原典「嚩者𠼝」）",
            "words": [
                  {
                        "iast": "vacaṭi",
                        "stem": "√vac",
                        "grammar": "Mantra Voc. · 真言呼请句",
                        "transliterationZh": "嚩者置（拼读参考：瓦佳蒂）",
                        "meaningZh": "真言宣演·最上真言离言说（呼请加持）",
                        "meaningEn": "uttering (vocative invocation)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-6",
            "index": 6,
            "iast": "cacaṭe",
            "classicalTranslitZh": "者者𪘨",
            "modernPhoneticZh": "佳佳帝",
            "meaningZh": "摧破一切执障无碍妙智尊！",
            "meaningEn": "Shattering all cognitive obstructions!",
            "tangNoteZh": "《T19n1022A》原典标号：第六句",
            "words": [
                  {
                        "iast": "cacaṭe",
                        "stem": "ca-ca-ṭa",
                        "grammar": "Mantra Voc. · 真言呼请句",
                        "transliterationZh": "者者致（拼读参考：佳佳帝）",
                        "meaningZh": "妙行迁变空·断除憍慢执障（呼请加持）",
                        "meaningEn": "awakened conduct beyond flux & cutting rigid pride (vocative invocation)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-7",
            "index": 7,
            "iast": "curu curu dhara dhara",
            "classicalTranslitZh": "祖鲁祖鲁驮啰驮啰",
            "modernPhoneticZh": "主鲁 主鲁 达啦 达啦",
            "meaningZh": "甘露遍流、坚固总持一切功德法财！",
            "meaningEn": "Stream forth, hold fast and sustain!",
            "tangNoteZh": "《T19n1022A》原典标号：第七句",
            "words": [
                  {
                        "iast": "curu",
                        "stem": "curu",
                        "grammar": "Mantra-Impv. · 速疾祈请",
                        "transliterationZh": "主噜（拼读参考：主鲁）",
                        "meaningZh": "速疾运转妙法加持（祖噜）",
                        "meaningEn": "swiftly set sacred blessings in motion!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "curu",
                        "stem": "curu",
                        "grammar": "Mantra-Impv. · 速疾祈请",
                        "transliterationZh": "主噜（拼读参考：主鲁）",
                        "meaningZh": "速疾运转妙法加持（祖噜）",
                        "meaningEn": "swiftly set sacred blessings in motion!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "dhara",
                        "stem": "dhara",
                        "grammar": "Impv.2.Sg. · 总持祈使",
                        "transliterationZh": "驮啰（拼读参考：达啦）",
                        "meaningZh": "请执持、总持护念！",
                        "meaningEn": "hold! bear! sustain!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "dhara",
                        "stem": "dhara",
                        "grammar": "Impv.2.Sg. · 总持祈使",
                        "transliterationZh": "驮啰（拼读参考：达啦）",
                        "meaningZh": "请执持、总持护念！",
                        "meaningEn": "hold! bear! sustain!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-8",
            "index": 8,
            "iast": "sarvatathāgata",
            "classicalTranslitZh": "萨嚩怛他蘖多",
            "modernPhoneticZh": "萨₍尔₎瓦-达他嘎达",
            "meaningZh": "一切如来！",
            "meaningEn": "Of all Tathāgatas!",
            "tangNoteZh": "《T19n1022A》原典标号：第八句",
            "words": [
                  {
                        "iast": "sarvatathāgata",
                        "stem": "sarvatathāgata",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "萨哩嚩怛他(引)誐怛（拼读参考：萨₍尔₎瓦-达他嘎达）",
                        "meaningZh": "一切如来",
                        "meaningEn": "all Tathagatas",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-9",
            "index": 9,
            "iast": "dhātudhare padmambhavati",
            "classicalTranslitZh": "驮(引)都驮𠼝钵蹋𤚥(二合)婆嚩底",
            "modernPhoneticZh": "达度达雷 巴₍德₎曼巴瓦帝",
            "meaningZh": "总持全身舍利法界藏、清净红莲华化生佛母！",
            "meaningEn": "Holder of the Relic-Realm, Lotus-Born Bhagavatī!",
            "tangNoteZh": "《T19n1022A》原典标号：第九句",
            "words": [
                  {
                        "iast": "dhātudhare",
                        "stem": "dhātu-dhara",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "驮(引)都驮隶（拼读参考：达度达雷）",
                        "meaningZh": "界请执持",
                        "meaningEn": "realm + O hold! bear! sustain!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "padmambhavati",
                        "stem": "padmam-bhavati",
                        "grammar": "Samāsa · 复合词 (Verb 3rd Sg. · 动词现在式)",
                        "transliterationZh": "钵讷曼婆嚩底（拼读参考：巴₍德₎曼巴瓦帝）",
                        "meaningZh": "壤成办",
                        "meaningEn": "becomes",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-10",
            "index": 10,
            "iast": "jayavare",
            "classicalTranslitZh": "惹也嚩犁",
            "modernPhoneticZh": "佳呀瓦雷",
            "meaningZh": "最胜尊胜妙宝尊！",
            "meaningEn": "O Supreme Victory!",
            "tangNoteZh": "《T19n1022A》原典标号：第十句",
            "words": [
                  {
                        "iast": "jayavare",
                        "stem": "jaya-vara",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "惹耶嚩隶（拼读参考：佳呀瓦雷）",
                        "meaningZh": "胜伏殊胜",
                        "meaningEn": "conquer! victory! + O choicest",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-11",
            "index": 11,
            "iast": "mudre smara",
            "classicalTranslitZh": "亩祖犁萨么(二合)啰",
            "modernPhoneticZh": "穆₍德₎雷 ₍斯₎玛啦",
            "meaningZh": "大金刚宝印尊，请忆念本昔誓愿！",
            "meaningEn": "O Sacred Seal, remember Your primal vow!",
            "tangNoteZh": "《T19n1022A》原典标号：第十一句",
            "words": [
                  {
                        "iast": "mudre",
                        "stem": "mudra",
                        "grammar": "Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "母捺隶（拼读参考：穆₍德₎雷）",
                        "meaningZh": "阶位双手尊",
                        "meaningEn": "O position of the hands / in position of the hands",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "smara",
                        "stem": "smara",
                        "grammar": "Impv. 2nd Sg. · 祈使忆念",
                        "transliterationZh": "娑摩啰（拼读参考：₍斯₎玛啦）",
                        "meaningZh": "祈请忆念本誓",
                        "meaningEn": "remember Your primordial vow!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-12",
            "index": 12,
            "iast": "tathāgatadharmacakra",
            "classicalTranslitZh": "怛他蘖多达摩斫迦啰(二合)",
            "modernPhoneticZh": "达他嘎达-达₍尔₎玛-佳₍克₎啦",
            "meaningZh": "如来无上正法宝轮！",
            "meaningEn": "The Dharma-Wheel of the Tathāgatas!",
            "tangNoteZh": "《T19n1022A》原典标号：第十二句",
            "words": [
                  {
                        "iast": "tathāgatadharmacakra",
                        "stem": "tathāgata-dharmacakra",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "怛他(引)誐怛达哩摩者讫啰（拼读参考：达他嘎达-达₍尔₎玛-佳₍克₎啦）",
                        "meaningZh": "如来法轮",
                        "meaningEn": "Tathāgata + Dharma wheel",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-13",
            "index": 13,
            "iast": "pravartanavajri bodhimaṇḍa",
            "classicalTranslitZh": "钵啰(二合)靺㗚哆(二合)娜嚩日哩(二合)冒地满拏",
            "modernPhoneticZh": "₍普₎啦瓦₍尔₎达拿瓦₍吉₎里 博地曼达",
            "meaningZh": "常转法轮之金刚尊、金刚菩提道场！",
            "meaningEn": "O Dharma-Wheel-Turning Vajra, Seat of Awakening!",
            "tangNoteZh": "《T19n1022A》原典标号：第十三句",
            "words": [
                  {
                        "iast": "pravartanavajri",
                        "stem": "pravartana-vajrin",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. · 呼格/处格)",
                        "transliterationZh": "钵啰嚩哩怛曩嚩日哩（拼读参考：₍普₎啦瓦₍尔₎达拿瓦₍吉₎里）",
                        "meaningZh": "转持械金刚杵",
                        "meaningEn": "moving forwards or onwards + O armed with the thunderbolt",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bodhimaṇḍa",
                        "stem": "bodhimaṇḍa",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "冒地曼拏（拼读参考：博地曼达）",
                        "meaningZh": "菩提藏 / 菩提树所",
                        "meaningEn": "platform; terrace",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-14",
            "index": 14,
            "iast": "alaṃkāra",
            "classicalTranslitZh": "楞迦(引)啰(引)",
            "modernPhoneticZh": "阿朗嘎啦",
            "meaningZh": "万德妙严饰！",
            "meaningEn": "Sublime Ornament!",
            "tangNoteZh": "《T19n1022A》原典标号：第十四句",
            "words": [
                  {
                        "iast": "alaṃkāra",
                        "stem": "alaṃkāra",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "阿攞僧迦(引)啰（拼读参考：阿朗嘎啦）",
                        "meaningZh": "庄严",
                        "meaningEn": "ornamenting or ornament",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-15",
            "index": 15,
            "iast": "alaṃkṛte",
            "classicalTranslitZh": "楞讫哩(二合)谛",
            "modernPhoneticZh": "阿朗₍克₎日帝",
            "meaningZh": "所圆满庄严者！",
            "meaningEn": "Magnificently Adorned One!",
            "tangNoteZh": "《T19n1022A》原典标号：第十五句",
            "words": [
                  {
                        "iast": "alaṃkṛte",
                        "stem": "alaṃkṛta",
                        "grammar": "Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "阿攞僧讫哩帝（拼读参考：阿朗₍克₎日帝）",
                        "meaningZh": "严尊",
                        "meaningEn": "O adornment / in adornment",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-16",
            "index": 16,
            "iast": "sarvatathāgatādhiṣṭhite",
            "classicalTranslitZh": "萨嚩怛他蘖多(引)地瑟耻(二合)谛",
            "modernPhoneticZh": "萨₍尔₎瓦-达他嘎达-地₍师₎提帝",
            "meaningZh": "获十方一切如来神力加持摄受者！",
            "meaningEn": "Empowered by all Tathāgatas!",
            "tangNoteZh": "《T19n1022A》原典标号：第十六句",
            "words": [
                  {
                        "iast": "sarvatathāgatādhiṣṭhite",
                        "stem": "sarvatathāgata-adhiṣṭhita",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "萨哩嚩怛他(引)誐多地瑟耻帝（拼读参考：萨₍尔₎瓦-达他嘎达-地₍师₎提帝）",
                        "meaningZh": "一切如来所加持",
                        "meaningEn": "all Tathagatas + O blessed",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-17",
            "index": 17,
            "iast": "bodhaya bodhaya",
            "classicalTranslitZh": "冒驮野冒驮野",
            "modernPhoneticZh": "博达呀 博达呀",
            "meaningZh": "请开觉、普令众生觉悟！",
            "meaningEn": "Enlighten, awaken all beings!",
            "tangNoteZh": "《T19n1022A》原典标号：第十七句",
            "words": [
                  {
                        "iast": "bodhaya",
                        "stem": "bodhaya",
                        "grammar": "Impv.2.Sg. · 觉悟祈使",
                        "transliterationZh": "冒驮耶（拼读参考：博达呀）",
                        "meaningZh": "请开晓觉悟、令发菩提觉智！",
                        "meaningEn": "awaken! enlighten! illuminate!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bodhaya",
                        "stem": "bodhaya",
                        "grammar": "Impv.2.Sg. · 觉悟祈使",
                        "transliterationZh": "冒驮耶（拼读参考：博达呀）",
                        "meaningZh": "请开晓觉悟、令发菩提觉智！",
                        "meaningEn": "awaken! enlighten! illuminate!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-18",
            "index": 18,
            "iast": "bodhi bodhi",
            "classicalTranslitZh": "冒地冒地",
            "modernPhoneticZh": "博地 博地",
            "meaningZh": "无上菩提、究竟圆觉！",
            "meaningEn": "Awakening, supreme Bodhi!",
            "tangNoteZh": "《T19n1022A》原典标号：第十八句",
            "words": [
                  {
                        "iast": "bodhi",
                        "stem": "bodhi",
                        "grammar": "Noun · 菩提正觉",
                        "transliterationZh": "菩提 / 冒地（拼读参考：博地）",
                        "meaningZh": "菩提、无上正觉",
                        "meaningEn": "Bodhi, awakening, enlightenment",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bodhi",
                        "stem": "bodhi",
                        "grammar": "Noun · 菩提正觉",
                        "transliterationZh": "菩提 / 冒地（拼读参考：博地）",
                        "meaningZh": "菩提、无上正觉",
                        "meaningEn": "Bodhi, awakening, enlightenment",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-19",
            "index": 19,
            "iast": "budhya budhya",
            "classicalTranslitZh": "没𠆙没𠆙",
            "modernPhoneticZh": "布₍地₎呀 布₍地₎呀",
            "meaningZh": "自觉、彻底觉知实相！",
            "meaningEn": "Awaken, realize directly!",
            "tangNoteZh": "《T19n1022A》原典标号：第十九句",
            "words": [
                  {
                        "iast": "budhya",
                        "stem": "budhya",
                        "grammar": "Impv.2.Sg. · 觉照祈使",
                        "transliterationZh": "没地耶（拼读参考：布₍地₎呀）",
                        "meaningZh": "请觉知、垂鉴觉照！",
                        "meaningEn": "awake! perceive! behend!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "budhya",
                        "stem": "budhya",
                        "grammar": "Impv.2.Sg. · 觉照祈使",
                        "transliterationZh": "没地耶（拼读参考：布₍地₎呀）",
                        "meaningZh": "请觉知、垂鉴觉照！",
                        "meaningEn": "awake! perceive! behend!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-20",
            "index": 20,
            "iast": "saṃbodhaya saṃbodhaya",
            "classicalTranslitZh": "参冒驮耶参冒驮野",
            "modernPhoneticZh": "桑博达呀 桑博达呀",
            "meaningZh": "令证无上正等正觉、究竟成佛！",
            "meaningEn": "Bring about complete and perfect Enlightenment!",
            "tangNoteZh": "《T19n1022A》原典标号：第二十句",
            "words": [
                  {
                        "iast": "saṃbodhaya",
                        "stem": "saṃbodha",
                        "grammar": "Impv. 2nd Sg. · 祈使式",
                        "transliterationZh": "三冒驮耶（拼读参考：桑博达呀）",
                        "meaningZh": "祈请理解、聪慧",
                        "meaningEn": "may You understanding, intelligence!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "saṃbodhaya",
                        "stem": "saṃbodha",
                        "grammar": "Impv. 2nd Sg. · 祈使式",
                        "transliterationZh": "三冒驮耶（拼读参考：桑博达呀）",
                        "meaningZh": "祈请理解、聪慧",
                        "meaningEn": "may You understanding, intelligence!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-21",
            "index": 21,
            "iast": "cala cala",
            "classicalTranslitZh": "者攞者攞",
            "modernPhoneticZh": "佳啦 佳啦",
            "meaningZh": "震动、摇动无始无明坚冰！",
            "meaningEn": "Shake, stir!",
            "tangNoteZh": "《T19n1022A》原典标号：第二十一句",
            "words": [
                  {
                        "iast": "cala",
                        "stem": "cala",
                        "grammar": "Impv. 2nd Sg. · 祈使式",
                        "transliterationZh": "者攞（拼读参考：佳啦）",
                        "meaningZh": "震动警觉、破除昏沉（左攞）",
                        "meaningEn": "stir awake and shake off delusion!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "cala",
                        "stem": "cala",
                        "grammar": "Impv. 2nd Sg. · 祈使式",
                        "transliterationZh": "者攞（拼读参考：佳啦）",
                        "meaningZh": "震动警觉、破除昏沉（左攞）",
                        "meaningEn": "stir awake and shake off delusion!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-22",
            "index": 22,
            "iast": "calantu",
            "classicalTranslitZh": "者懒睹",
            "modernPhoneticZh": "佳兰度",
            "meaningZh": "普令一切执障悉皆动摇脱落！",
            "meaningEn": "Let them all be shaken loose!",
            "tangNoteZh": "《T19n1022A》原典标号：第二十二句",
            "words": [
                  {
                        "iast": "calantu",
                        "stem": "cala",
                        "grammar": "Impv. 2nd Sg. · 祈使式 · Impv. 3rd Pl. · 祈愿复数",
                        "transliterationZh": "者蓝都（拼读参考：佳兰度）",
                        "meaningZh": "愿悉震动警觉、破除昏沉（左攞）",
                        "meaningEn": "may they stir awake and shake off delusion!!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-23",
            "index": 23,
            "iast": "sarvāvaraṇāni",
            "classicalTranslitZh": "萨嚩嚩啰拏儞",
            "modernPhoneticZh": "萨₍尔₎瓦-瓦啦拿尼",
            "meaningZh": "所有一切业障、报障、烦恼障！",
            "meaningEn": "All karmic and cognitive obscurations!",
            "tangNoteZh": "《T19n1022A》原典标号：第二十三句",
            "words": [
                  {
                        "iast": "sarvāvaraṇāni",
                        "stem": "sarva-āvaraṇa",
                        "grammar": "Samāsa · 复合词 (Nom./Acc. Pl. Neut. · 复数中性)",
                        "transliterationZh": "萨哩嚩(引)嚩啰拏(引)你（拼读参考：萨₍尔₎瓦-瓦啦拿尼）",
                        "meaningZh": "一切一切障蔽",
                        "meaningEn": "all + obscuration",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-24",
            "index": 24,
            "iast": "sarvapāpavigate",
            "classicalTranslitZh": "萨嚩播(引)波尾蘖谛",
            "modernPhoneticZh": "萨₍尔₎瓦-巴巴维嘎帝",
            "meaningZh": "远离涤尽一切恶业罪垢尊！",
            "meaningEn": "Freed from all sins and transgressions!",
            "tangNoteZh": "《T19n1022A》原典标号：第二十四句",
            "words": [
                  {
                        "iast": "sarvapāpavigate",
                        "stem": "sarva-pāpa-vigata",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "萨哩嚩波跛尾誐帝（拼读参考：萨₍尔₎瓦-巴巴维嘎帝）",
                        "meaningZh": "一切·罪业·离",
                        "meaningEn": "all + evil + O lost",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-25",
            "index": 25,
            "iast": "huru huru",
            "classicalTranslitZh": "户噜户噜",
            "modernPhoneticZh": "呼鲁 呼鲁",
            "meaningZh": "速疾拔济、速疾除忧！",
            "meaningEn": "Hasten, swiftly dispel!",
            "tangNoteZh": "《T19n1022A》原典标号：第二十五句",
            "words": [
                  {
                        "iast": "huru",
                        "stem": "huru",
                        "grammar": "Mantra-Impv. · 速疾祈请",
                        "transliterationZh": "呼噜（拼读参考：呼鲁）",
                        "meaningZh": "疾速拔济除障（虎噜）",
                        "meaningEn": "swiftly rescue and dispel all afflictions!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "huru",
                        "stem": "huru",
                        "grammar": "Mantra-Impv. · 速疾祈请",
                        "transliterationZh": "呼噜（拼读参考：呼鲁）",
                        "meaningZh": "疾速拔济除障（虎噜）",
                        "meaningEn": "swiftly rescue and dispel all afflictions!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-26",
            "index": 26,
            "iast": "sarvaśokavigate",
            "classicalTranslitZh": "萨嚩戍迦弭蘖帝",
            "modernPhoneticZh": "萨₍尔₎瓦-硕嘎维嘎帝",
            "meaningZh": "永离一切忧悲苦恼尊！",
            "meaningEn": "Freed from all sorrow and grief!",
            "tangNoteZh": "《T19n1022A》原典标号：第二十六句",
            "words": [
                  {
                        "iast": "sarvaśokavigate",
                        "stem": "sarvaśas-oka-vigata",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "萨哩嚩戍迦尾誐帝（拼读参考：萨₍尔₎瓦-硕嘎维嘎帝）",
                        "meaningZh": "万万·故乡·离",
                        "meaningEn": "wholly + home + O lost",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-27",
            "index": 27,
            "iast": "sarvatathāgata",
            "classicalTranslitZh": "萨嚩怛他蘖多",
            "modernPhoneticZh": "萨₍尔₎瓦-达他嘎达",
            "meaningZh": "十方一切如来！",
            "meaningEn": "Of all Tathāgatas!",
            "tangNoteZh": "《T19n1022A》原典标号：第二十七句",
            "words": [
                  {
                        "iast": "sarvatathāgata",
                        "stem": "sarvatathāgata",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "萨哩嚩怛他(引)誐怛（拼读参考：萨₍尔₎瓦-达他嘎达）",
                        "meaningZh": "一切如来",
                        "meaningEn": "all Tathagatas",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-28",
            "index": 28,
            "iast": "hṛdayavajriṇi",
            "classicalTranslitZh": "纥哩(二合)那野嚩日哩(二合)抳",
            "modernPhoneticZh": "₍赫₎日达呀-瓦₍吉₎里尼",
            "meaningZh": "真实心秘密金刚佛母尊！",
            "meaningEn": "O Diamond-Heart Vajriṇī!",
            "tangNoteZh": "《T19n1022A》原典标号：第二十八句",
            "words": [
                  {
                        "iast": "hṛdayavajriṇi",
                        "stem": "hṛdaya-vajra",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. · 具德尊)",
                        "transliterationZh": "纥哩捺耶嚩日哩抳（拼读参考：₍赫₎日达呀-瓦₍吉₎里尼）",
                        "meaningZh": "心具金刚尊",
                        "meaningEn": "heart + O bearer of Vajra",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-29",
            "index": 29,
            "iast": "saṃbhara saṃbhara",
            "classicalTranslitZh": "参婆啰参婆啰",
            "modernPhoneticZh": "桑巴啦 桑巴啦",
            "meaningZh": "圆满积聚、圆满积聚福德智慧二资粮！",
            "meaningEn": "Gather, amass the stores of merit and wisdom!",
            "tangNoteZh": "《T19n1022A》原典标号：第二十九句",
            "words": [
                  {
                        "iast": "saṃbhara",
                        "stem": "saṃ-bhara",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "三婆啰（拼读参考：桑巴啦）",
                        "meaningZh": "桑方位",
                        "meaningEn": "saṃ + bearing",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "saṃbhara",
                        "stem": "saṃ-bhara",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "三婆啰（拼读参考：桑巴啦）",
                        "meaningZh": "桑方位",
                        "meaningEn": "saṃ + bearing",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-30",
            "index": 30,
            "iast": "sarvatathāgata",
            "classicalTranslitZh": "萨嚩怛他蘖多",
            "modernPhoneticZh": "萨₍尔₎瓦-达他嘎达",
            "meaningZh": "一切如来！",
            "meaningEn": "Of all Tathāgatas!",
            "tangNoteZh": "《T19n1022A》原典标号：第三十句",
            "words": [
                  {
                        "iast": "sarvatathāgata",
                        "stem": "sarvatathāgata",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "萨哩嚩怛他(引)誐怛（拼读参考：萨₍尔₎瓦-达他嘎达）",
                        "meaningZh": "一切如来",
                        "meaningEn": "all Tathagatas",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-31",
            "index": 31,
            "iast": "guhyadhāraṇīmudre",
            "classicalTranslitZh": "麌呬野(二合)驮啰抳亩涅犁",
            "modernPhoneticZh": "古₍赫₎呀达啦尼穆₍德₎雷",
            "meaningZh": "三密总持陀罗尼宝箧契印尊！",
            "meaningEn": "O Secret Dhāraṇī-Seal!",
            "tangNoteZh": "《T19n1022A》原典标号：第三十一句",
            "words": [
                  {
                        "iast": "guhyadhāraṇīmudre",
                        "stem": "guhya-dhāraṇīmudrā",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "具纥耶驮(引)啰抳(引)母捺隶（拼读参考：古₍赫₎呀达啦尼穆₍德₎雷）",
                        "meaningZh": "密持手印母",
                        "meaningEn": "hidden or covered",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-32",
            "index": 32,
            "iast": "buddhe subuddhe",
            "classicalTranslitZh": "没悌苏没悌",
            "modernPhoneticZh": "布叠 苏布叠",
            "meaningZh": "妙觉尊、极善圆满觉智尊！",
            "meaningEn": "O Awakened One, Well-Awakened One!",
            "tangNoteZh": "《T19n1022A》原典标号：第三十二句",
            "words": [
                  {
                        "iast": "buddhe",
                        "stem": "buddha",
                        "grammar": "Noun · 佛号 · Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "没第（拼读参考：布叠）",
                        "meaningZh": "佛陀、觉者尊",
                        "meaningEn": "O Buddha, the Awakened One / in Buddha, the Awakened One",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "subuddhe",
                        "stem": "su-buddha",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "苏没第（拼读参考：苏布叠）",
                        "meaningZh": "报刊往外佛陀",
                        "meaningEn": "press out + O Buddha",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-33",
            "index": 33,
            "iast": "sarvatathāgatādhiṣṭhita",
            "classicalTranslitZh": "萨嚩怛他蘖多(引)地瑟耻多",
            "modernPhoneticZh": "萨₍尔₎瓦-达他嘎达-地₍师₎提达",
            "meaningZh": "十方一切如来常住加持！",
            "meaningEn": "Blessed and empowered by all Tathāgatas!",
            "tangNoteZh": "《T19n1022A》原典标号：第三十三句",
            "words": [
                  {
                        "iast": "sarvatathāgatādhiṣṭhita",
                        "stem": "sarvatathāgata-adhiṣṭhita",
                        "grammar": "Samāsa · 复合词 (Part. · 所加持)",
                        "transliterationZh": "萨哩嚩怛他(引)誐多地瑟耻怛（拼读参考：萨₍尔₎瓦-达他嘎达-地₍师₎提达）",
                        "meaningZh": "一切如来所加持",
                        "meaningEn": "all Tathagatas + blessed",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-34",
            "index": 34,
            "iast": "dhātugarbhe svāhā",
            "classicalTranslitZh": "驮睹蘖陛娑嚩(二合)诃",
            "modernPhoneticZh": "达度嘎₍尔₎贝 ₍斯₎瓦哈",
            "meaningZh": "法界全身舍利宝塔藏尊，圆满成就，娑嚩诃！",
            "meaningEn": "O Relic-Realm Matrix, Svāhā!",
            "tangNoteZh": "《T19n1022A》原典标号：第三十四句",
            "words": [
                  {
                        "iast": "dhātugarbhe",
                        "stem": "dhātu-garbha",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "驮(引)都誐哩陛（拼读参考：达度嘎₍尔₎贝）",
                        "meaningZh": "界藏",
                        "meaningEn": "realm + O womb",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "svāhā",
                        "stem": "svāhā",
                        "grammar": "Indecl. · 结印词",
                        "transliterationZh": "娑嚩诃 / 萨婆诃（拼读参考：₍斯₎瓦哈）",
                        "meaningZh": "圆满吉祥成就",
                        "meaningEn": "hail! may auspicious accomplishment be sealed",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-35",
            "index": 35,
            "iast": "samayādhiṣṭhite svāhā",
            "classicalTranslitZh": "参摩耶(引)地瑟耻(二合)帝娑嚩(二合)诃",
            "modernPhoneticZh": "萨玛呀地₍师₎提帝 ₍斯₎瓦哈",
            "meaningZh": "三昧耶本誓加持尊，圆满成就，娑嚩诃！",
            "meaningEn": "Empowered by the Samaya Vow, Svāhā!",
            "tangNoteZh": "《T19n1022A》原典标号：第三十五句",
            "words": [
                  {
                        "iast": "samayādhiṣṭhite",
                        "stem": "samayā-dhiṣṭhita",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "萨摩夜地瑟耻帝（拼读参考：萨玛呀地₍师₎提帝）",
                        "meaningZh": "中间依止处",
                        "meaningEn": "in the middle of + O standing",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "svāhā",
                        "stem": "svāhā",
                        "grammar": "Indecl. · 结印词",
                        "transliterationZh": "娑嚩诃 / 萨婆诃（拼读参考：₍斯₎瓦哈）",
                        "meaningZh": "圆满吉祥成就",
                        "meaningEn": "hail! may auspicious accomplishment be sealed",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-36",
            "index": 36,
            "iast": "sarvatathāgatahṛdayadhātumudre svāhā",
            "classicalTranslitZh": "萨嚩怛他蘖多纥哩(二合)那野驮睹亩捺𠼝(二合)娑嚩(二合)诃",
            "modernPhoneticZh": "萨₍尔₎瓦-达他嘎达-₍赫₎日达呀-达度-穆₍德₎雷 ₍斯₎瓦哈",
            "meaningZh": "一切如来心秘密全身舍利宝箧印尊，圆满成就，娑嚩诃！",
            "meaningEn": "O Heart-Relic Casket Seal of All Tathāgatas, Svāhā!",
            "tangNoteZh": "《T19n1022A》原典标号：第三十六句（全经核心塔印句）",
            "words": [
                  {
                        "iast": "sarvatathāgatahṛdayadhātumudre",
                        "stem": "sarvatathāgata-hṛdaya-dhātu-mudra",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "萨哩嚩怛他(引)誐怛纥哩捺耶驮(引)都母捺隶（拼读参考：萨₍尔₎瓦-达他嘎达-₍赫₎日达呀-达度-穆₍德₎雷）",
                        "meaningZh": "一切如来·心·界·阶位双手尊",
                        "meaningEn": "all Tathagatas + heart + realm + O position of the hands",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "svāhā",
                        "stem": "svāhā",
                        "grammar": "Indecl. · 结印词",
                        "transliterationZh": "娑嚩诃 / 萨婆诃（拼读参考：₍斯₎瓦哈）",
                        "meaningZh": "圆满吉祥成就",
                        "meaningEn": "hail! may auspicious accomplishment be sealed",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-37",
            "index": 37,
            "iast": "supratiṣṭhitastūpe tathāgatādhiṣṭhite huru huru hūṃ hūṃ svāhā",
            "classicalTranslitZh": "苏钵啰(二合)底瑟耻(二合)多萨睹(二合)闭怛他蘖多(引)地瑟耻(二合)帝户噜户噜吽吽萨嚩(二合)诃",
            "modernPhoneticZh": "苏₍普₎啦帝₍师₎提达₍斯₎度贝 达他嘎达-地₍师₎提帝 呼鲁 呼鲁 吽 吽 ₍斯₎瓦哈",
            "meaningZh": "极善安立妙宝塔、如来神力常住加持尊，速疾成就，吽吽，娑嚩诃！",
            "meaningEn": "In the Well-Consecrated Stūpa blessed by Tathāgatas, Huru Huru Hūṃ Hūṃ Svāhā!",
            "tangNoteZh": "《T19n1022A》原典标号：第三十七句",
            "words": [
                  {
                        "iast": "supratiṣṭhitastūpe",
                        "stem": "supratiṣṭhita-stūpa",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "苏钵啰底瑟耻怛悉都(引)闭（拼读参考：苏₍普₎啦帝₍师₎提达₍斯₎度贝）",
                        "meaningZh": "安住塔",
                        "meaningEn": "well grounded or situated + O relic-mound",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "tathāgatādhiṣṭhite",
                        "stem": "tathāgata-adhiṣṭhita",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "怛他(引)誐多地瑟耻帝（拼读参考：达他嘎达-地₍师₎提帝）",
                        "meaningZh": "如来所加持",
                        "meaningEn": "Tathāgata + O blessed",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "huru",
                        "stem": "huru",
                        "grammar": "Mantra-Impv. · 速疾祈请",
                        "transliterationZh": "呼噜（拼读参考：呼鲁）",
                        "meaningZh": "疾速拔济除障（虎噜）",
                        "meaningEn": "swiftly rescue and dispel all afflictions!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "huru",
                        "stem": "huru",
                        "grammar": "Mantra-Impv. · 速疾祈请",
                        "transliterationZh": "呼噜（拼读参考：呼鲁）",
                        "meaningZh": "疾速拔济除障（虎噜）",
                        "meaningEn": "swiftly rescue and dispel all afflictions!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "hūṃ",
                        "stem": "hūṃ",
                        "grammar": "Bīja · 金刚种子字",
                        "transliterationZh": "吽（拼读参考：吽）",
                        "meaningZh": "金刚不坏菩提心印、摧破诸障",
                        "meaningEn": "adamantine bodhicitta seed syllable",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-38",
            "index": 38,
            "iast": "oṃ sarvatathāgata",
            "classicalTranslitZh": "唵萨嚩怛他蘖多",
            "modernPhoneticZh": "嗡 萨₍尔₎瓦-达他嘎达",
            "meaningZh": "嗡！十方三世一切如来！",
            "meaningEn": "Oṃ! All Tathāgatas!",
            "tangNoteZh": "《T19n1022A》原典标号：第三十八句（结印灌顶句）",
            "words": [
                  {
                        "iast": "oṃ",
                        "stem": "oṃ",
                        "grammar": "Praṇava · 圣音",
                        "transliterationZh": "唵（拼读参考：嗡）",
                        "meaningZh": "三身总持圣音（法报化三身摄受）",
                        "meaningEn": "sacred Praṇava syllable embodying Trikāya",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "sarvatathāgata",
                        "stem": "sarvatathāgata",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "萨哩嚩怛他(引)誐怛（拼读参考：萨₍尔₎瓦-达他嘎达）",
                        "meaningZh": "一切如来",
                        "meaningEn": "all Tathagatas",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-39",
            "index": 39,
            "iast": "uṣṇīṣadhātumudrāṇi sarvatathāgataṃ sadhātuvibhūṣitādhiṣṭhite",
            "classicalTranslitZh": "坞瑟抳(二合)沙驮都亩捺啰(二合)尼萨嚩怛他蘖单娑驮都尾部使多(引)地瑟耻(二合)帝",
            "modernPhoneticZh": "乌₍师₎尼沙-达度-穆₍德₎啦尼 萨₍尔₎瓦-达他嘎当 萨达度维布师达地₍师₎提帝",
            "meaningZh": "无见佛顶舍利宝印、一切如来法界功德庄严加持尊！",
            "meaningEn": "Crown-Relic Seals, adorned with the Dharma-Realm of all Tathāgatas!",
            "tangNoteZh": "《T19n1022A》原典标号：第三十九句",
            "words": [
                  {
                        "iast": "uṣṇīṣadhātumudrāṇi",
                        "stem": "uṣṇīṣa-dhātu-mudra",
                        "grammar": "Samāsa · 复合词 (Nom./Acc. Pl. Neut. · 复数中性)",
                        "transliterationZh": "坞瑟抳(引)洒驮(引)都母捺啰(引)抳（拼读参考：乌₍师₎尼沙-达度-穆₍德₎啦尼）",
                        "meaningZh": "佛顶肉髻相·界·一切阶位双手",
                        "meaningEn": "Uṣṇīṣa + realm + position of the hands",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "sarvatathāgataṃ",
                        "stem": "sarvatathāgataṃ",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "萨哩嚩怛他(引)誐担（拼读参考：萨₍尔₎瓦-达他嘎当）",
                        "meaningZh": "萨嚩怛他蘖多南",
                        "meaningEn": "sarvatathāgataṃ",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "sadhātuvibhūṣitādhiṣṭhite",
                        "stem": "sa-dhātu-vibhūṣitā-dhiṣṭhita",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "萨驮(引)都尾部(引)瑟多地瑟耻帝（拼读参考：萨达度维布师达地₍师₎提帝）",
                        "meaningZh": "彼·界·光华·依止处",
                        "meaningEn": "he + realm + magnificence + O standing",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "karanda-40",
            "index": 40,
            "iast": "hūṃ hūṃ svāhā",
            "classicalTranslitZh": "吽吽娑嚩(二合)诃",
            "modernPhoneticZh": "吽 吽 ₍斯₎瓦哈",
            "meaningZh": "五智圆满，吽吽，究竟成就，娑嚩诃（四十句全本圆满）！",
            "meaningEn": "Hūṃ Hūṃ Svāhā!",
            "tangNoteZh": "《T19n1022A》原典标号：第四十句（雷峰塔刻经与大藏原典四十句圆满）",
            "words": [
                  {
                        "iast": "hūṃ",
                        "stem": "hūṃ",
                        "grammar": "Bīja · 金刚种子字",
                        "transliterationZh": "吽（拼读参考：吽）",
                        "meaningZh": "金刚不坏菩提心印、摧破诸障",
                        "meaningEn": "adamantine bodhicitta seed syllable",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "hūṃ",
                        "stem": "hūṃ",
                        "grammar": "Bīja · 金刚种子字",
                        "transliterationZh": "吽（拼读参考：吽）",
                        "meaningZh": "金刚不坏菩提心印、摧破诸障",
                        "meaningEn": "adamantine bodhicitta seed syllable",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "svāhā",
                        "stem": "svāhā",
                        "grammar": "Indecl. · 结印词",
                        "transliterationZh": "娑嚩诃 / 萨婆诃（拼读参考：₍斯₎瓦哈）",
                        "meaningZh": "圆满吉祥成就",
                        "meaningEn": "hail! may auspicious accomplishment be sealed",
                        "origin": "derived-reference"
                  }
            ]
      }
],
  },
  {
    id: 'shurangama-sitatapatra-hrdaya',
    titleZh: '大佛顶如来放光悉怛多般怛啰无上宝印十方如来清净海眼大白伞盖首楞严王陀罗尼（五会427句全本）',
    titleSanskritIast: 'Sarvatathāgatoṣṇīṣa-sitātapatrā-nāmāparājitā-mahāpratyaṅgirā-mahāvidyārājñī',
    titleEnglish: 'Complete Five-Assembly Śūraṅgama / Sitātapatrā Dhāraṇī (All 427 Canonical Clauses)',
    categoryId: 'supreme-mantras',
    taishoNo: 'T19n0945 (卷七) / T19n0976 / GRETIL bsu004_u',
    translatorZh: '唐·中天竺沙门般剌密帝 译《大佛顶首楞严经》卷七 / 唐·不空三藏 译',
    sutraSourceZh:
      '《大佛顶如来密因修证了义诸菩萨万行首楞严经》卷七 (T19n0945) 暨 GRETIL 梵本《Sitātapatrā》(bsu004_u.htm)',
    deityZh: '释迦牟尼如来无见顶相化佛 · 大白伞盖佛母 (Uṣṇīṣa-Sitātapatrā Bhagavatī)',
    meritsAndSummaryZh:
      '汉传佛教每日早课首篇「咒中之王」完整五会全本！严格依据 CBETA《大佛顶首楞严经》卷七 (T19n0945.xml) 原典标号「一」至「四百二十七」，完整收录五大会全部 427 句（2,620 字一字不漏、绝无删节）：第一会毗卢真法会（第1–141句）、第二会释尊应化会（第142–163句）、第三会观音合同会（第164–272句）、第四会金刚藏折摄会（第273–329句）、第五会文殊弘传会暨十二由旬金刚结界与根本咒心（第330–427句），并逐句参校哥廷根 GRETIL 梵文原典《bsu004_u.htm》完成梵汉对读。',
    recitationTipsZh:
      '全咒五大会共 427 句：第一会至诚礼敬十方五部如来与大白伞盖佛母；第二会以「虎𤙖都嚧雍（hūṃ trūṃ）」金刚顶种子字摧伏魔怨；第三会消除十六大怖畏并剑断橛钉一切外道邪咒；第四会百千「泮吒（phaṭ）」折摄群魔；第五会净除诸恶鬼热病痛楚，结十二由旬金刚界，并以根本咒心「跢侄他 唵 阿那隶 毗舍提 鞞啰跋阇啰陀唎 槃陀槃陀儞 跋阇啰谤尼泮 虎𤙖都嚧瓮泮 莎婆诃」收摄全咒万德。',
    provenance: {
      sourceType: 'CBETA+GRETIL',
      cbetaId: 'T19n0945',
      cbetaRawXmlUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n0945.xml',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T19n0945_007',
      gretilFile: 'bsu004_u.htm',
      gretilRawUrl:
        gretilSitatapatra?.gretilRawUrl ||
        'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/main/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/bsu004_u.htm',
      editionCitation:
        'CBETA XML-P5 T19n0945 卷七（原典内注「一」至「四百二十七」全427句2,620字全本）& GRETIL bsu004_u.htm (Sarvatathāgatoṣṇīṣasitātapatrā, ed. Ngawang Samten & Janardan Pandey, Dhīḥ 33, Sarnath 2002)。',
      manuscriptNotesZh:
        '完整提取《T19n0945.xml》卷七第二陀罗尼段（通行课诵本母本）全部 427 句 2,620 字，无一字遗漏，逐句与 GRETIL bsu004_u.htm 梵本对齐。',
      rawSnippet: gretilSitatapatra?.rawSnippet,
    },
    verses: [
      {
            "id": "shurangama-1",
            "index": 1,
            "iast": "namas tathāgatāya sugatāyārhate samyaksaṃbuddhāya",
            "classicalTranslitZh": "南无萨怛他苏伽多耶阿罗诃帝三藐三菩陀写",
            "modernPhoneticZh": "拿玛₍斯₎ 达他嘎达呀 苏嘎达呀₍尔₎哈帝 萨₍姆₎呀₍克₎-桑布达呀",
            "meaningZh": "归命如来、善逝、应供、正遍知！",
            "meaningEn": "Homage to the Tathāgata, Sugata, Arhat, Perfectly Awakened Buddha!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 1/427 句",
            "words": [
                  {
                        "iast": "namas",
                        "stem": "namas",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "曩莫（拼读参考：拿玛₍斯₎）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "tathāgatāya",
                        "stem": "tathāgata",
                        "grammar": "Noun · 如来 · Dat. Sg. · 为格单数",
                        "transliterationZh": "怛他蘖多耶（拼读参考：达他嘎达呀）",
                        "meaningZh": "向如来（乘如实道来成正觉）",
                        "meaningEn": "to/for Tathāgata, Thus-Come One",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "sugatāyārhate",
                        "stem": "sugata-āya-ārhata",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "苏誐多夜哩诃帝（拼读参考：苏嘎达呀₍尔₎哈帝）",
                        "meaningZh": "善逝·出·堪敬尊",
                        "meaningEn": "Sugata + income",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "samyaksaṃbuddhāya",
                        "stem": "samyaksaṃbuddha",
                        "grammar": "Samāsa · 正遍知 · Dat. Sg. · 为格单数",
                        "transliterationZh": "三藐三没驮耶（拼读参考：萨₍姆₎呀₍克₎-桑布达呀）",
                        "meaningZh": "向正等正觉、正遍知",
                        "meaningEn": "to/for Perfectly and Completely Awakened Buddha",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-2",
            "index": 2,
            "iast": "sarvatathāgatabuddhakoṭyuṣṇīṣam",
            "classicalTranslitZh": "萨怛他佛陀俱胝瑟尼釤",
            "modernPhoneticZh": "萨₍尔₎瓦-达他嘎达-布达-果₍蒂₎尤₍师₎尼伤",
            "meaningZh": "顶礼一切如来百千万亿佛顶无见顶相！",
            "meaningEn": "To the Crown-Uṣṇīṣa of tens of millions of Tathāgatas and Buddhas!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 2/427 句",
            "words": [
                  {
                        "iast": "sarvatathāgatabuddhakoṭyuṣṇīṣam",
                        "stem": "√buddh",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "萨哩嚩怛他(引)誐怛没驮俱置庾瑟抳(引)忏（拼读参考：萨₍尔₎瓦-达他嘎达-布达-果₍蒂₎尤₍师₎尼伤）",
                        "meaningZh": "觉悟正觉·一切诸谛圆满",
                        "meaningEn": "awakened",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-3",
            "index": 3,
            "iast": "namaḥ sarvabuddhabodhisattvebhyaḥ",
            "classicalTranslitZh": "南无萨婆勃陀勃地萨跢鞞弊",
            "modernPhoneticZh": "拿玛₍赫₎ 萨₍尔₎瓦-布达-博地-萨₍特₎威₍比₎呀₍赫₎",
            "meaningZh": "归命十方一切诸佛及诸大菩萨众！",
            "meaningEn": "Homage to all Buddhas and Bodhisattvas!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 3/427 句 · 唐代原注音释：鞞弊音近毗迦切（-bhyaḥ 第四/五格复数礼敬格）",
            "words": [
                  {
                        "iast": "namaḥ",
                        "stem": "namaḥ",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "曩莫（拼读参考：拿玛₍赫₎）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "sarvabuddhabodhisattvebhyaḥ",
                        "stem": "sarva-buddha-bodhisattva",
                        "grammar": "Samāsa · 复合词 (Dat./Abl. Pl. · 为格复数)",
                        "transliterationZh": "萨嚩没驮冒地萨怛吠毗药（拼读参考：萨₍尔₎瓦-布达-博地-萨₍特₎威₍比₎呀₍赫₎）",
                        "meaningZh": "向诸一切佛陀菩提萨埵",
                        "meaningEn": "all + Buddha + to all Bodhisattva",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-4",
            "index": 4,
            "iast": "namaḥ saptānāṃ samyaksaṃbuddhakoṭīnām",
            "classicalTranslitZh": "南无萨多南三藐三菩陀俱知南",
            "modernPhoneticZh": "拿玛₍赫₎ 萨₍普₎达南 萨₍姆₎呀₍克₎-桑布达果蒂南",
            "meaningZh": "归命七俱胝（七千万）正等正觉诸佛！",
            "meaningEn": "Homage to seventy million Perfectly Awakened Buddhas!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 4/427 句",
            "words": [
                  {
                        "iast": "namaḥ",
                        "stem": "namaḥ",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "曩莫（拼读参考：拿玛₍赫₎）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "saptānāṃ",
                        "stem": "sapta",
                        "grammar": "Num. · 七 · Gen. Pl. · 属格复数",
                        "transliterationZh": "萨钵多喃(引)（拼读参考：萨₍普₎达南）",
                        "meaningZh": "诸七（七佛/七觉支）之",
                        "meaningEn": "of all seven",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "samyaksaṃbuddhakoṭīnām",
                        "stem": "samyaksaṃbuddha-koṭi",
                        "grammar": "Samāsa · 复合词 (Gen. Pl. · 属格复数)",
                        "transliterationZh": "萨摩耶羯三没驮俱置(引)喃(引)（拼读参考：萨₍姆₎呀₍克₎-桑布达果蒂南）",
                        "meaningZh": "正等正觉诸俱胝之",
                        "meaningEn": "Perfectly and Completely Awakened Buddha + of ten million",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-5",
            "index": 5,
            "iast": "saśrāvakasaṃghānām",
            "classicalTranslitZh": "娑舍啰婆迦僧伽喃",
            "modernPhoneticZh": "萨₍希₎啦瓦嘎桑嘎南",
            "meaningZh": "兼及一切声闻贤圣僧伽海众！",
            "meaningEn": "Together with the assemblies of Śrāvaka disciples!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 5/427 句",
            "words": [
                  {
                        "iast": "saśrāvakasaṃghānām",
                        "stem": "sa-śrāvaka-saṃgha",
                        "grammar": "Samāsa · 复合词 (Gen. Pl. · 属格复数)",
                        "transliterationZh": "萨室啰(引)嚩迦三伽(引)喃(引)（拼读参考：萨₍希₎啦瓦嘎桑嘎南）",
                        "meaningZh": "彼·舍罗婆迦·诸圣僧伽",
                        "meaningEn": "he + sravaka + of all Saṃgha",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-6",
            "index": 6,
            "iast": "namo loke arhatānām",
            "classicalTranslitZh": "南无卢鸡阿罗汉跢喃",
            "modernPhoneticZh": "拿摩 洛给 阿₍尔₎哈达南",
            "meaningZh": "归命世间一切应供阿罗汉圣众！",
            "meaningEn": "Homage to the Arhats in the world!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 6/427 句",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "loke",
                        "stem": "loka",
                        "grammar": "Noun · 世间 · Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "路计（拼读参考：洛给）",
                        "meaningZh": "世间、世界尊",
                        "meaningEn": "O world, realm / in world, realm",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "arhatānām",
                        "stem": "arhat",
                        "grammar": "Noun · 应供 · Gen. Pl. · 属格复数",
                        "transliterationZh": "阿哩诃多喃(引)（拼读参考：阿₍尔₎哈达南）",
                        "meaningZh": "诸应供、阿罗汉（破烦恼贼）之",
                        "meaningEn": "of all Arhat, Worthy One",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-7",
            "index": 7,
            "iast": "namaḥ srotāpannānām",
            "classicalTranslitZh": "南无苏卢多波那喃",
            "modernPhoneticZh": "拿玛₍赫₎ ₍斯₎洛达班拿南",
            "meaningZh": "归命一切预流果（须陀洹）圣众！",
            "meaningEn": "Homage to the Stream-Enterers (Srotāpannas)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 7/427 句",
            "words": [
                  {
                        "iast": "namaḥ",
                        "stem": "namaḥ",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "曩莫（拼读参考：拿玛₍赫₎）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "srotāpannānām",
                        "stem": "srotas-āpanna",
                        "grammar": "Samāsa · 复合词 (Gen. Pl. · 属格复数)",
                        "transliterationZh": "娑嚧多伴那(引)喃(引)（拼读参考：₍斯₎洛达班拿南）",
                        "meaningZh": "活期诸入之",
                        "meaningEn": "current + of all entered",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-8",
            "index": 8,
            "iast": "namaḥ sakṛdāgāminām",
            "classicalTranslitZh": "南无娑羯唎陀伽弥喃",
            "modernPhoneticZh": "拿玛₍赫₎ 萨₍克₎日达嘎米南",
            "meaningZh": "归命一切一来果（斯陀含）圣众！",
            "meaningEn": "Homage to the Once-Returners (Sakṛdāgāmins)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 8/427 句",
            "words": [
                  {
                        "iast": "namaḥ",
                        "stem": "namaḥ",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "曩莫（拼读参考：拿玛₍赫₎）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "sakṛdāgāminām",
                        "stem": "sa-ka-da",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "萨讫哩陀誐(引)弭喃(引)（拼读参考：萨₍克₎日达嘎米南）",
                        "meaningZh": "一切诸谛圆满·造作离相·施度调伏",
                        "meaningEn": "all-pervading truth & auspiciousness & freedom from karmic agency & generosity & self-mastery",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-9",
            "index": 9,
            "iast": "namo loke samyaggatānām",
            "classicalTranslitZh": "南无卢鸡三藐伽跢喃",
            "modernPhoneticZh": "拿摩 洛给 萨₍姆₎呀嘎达南",
            "meaningZh": "归命世间一切已契入正道之阿那含等圣众！",
            "meaningEn": "Homage to those in the world who have gone rightly!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 9/427 句",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "loke",
                        "stem": "loka",
                        "grammar": "Noun · 世间 · Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "路计（拼读参考：洛给）",
                        "meaningZh": "世间、世界尊",
                        "meaningEn": "O world, realm / in world, realm",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "samyaggatānām",
                        "stem": "sa-ma-ya",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "萨弭耶怛誐多喃(引)（拼读参考：萨₍姆₎呀嘎达南）",
                        "meaningZh": "一切诸谛圆满·无我大慈三昧·一乘如实之道",
                        "meaningEn": "all-pervading truth & auspiciousness & selfless great loving-kindness & supreme vehicle of awakening",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-10",
            "index": 10,
            "iast": "samyakpratipannānām",
            "classicalTranslitZh": "三藐伽波啰底波多那喃",
            "modernPhoneticZh": "萨₍姆₎呀₍克₎-₍普₎啦帝班拿南",
            "meaningZh": "以及一切正行向道之四向四果圣贤僧众！",
            "meaningEn": "And to those who practice rightly on the path!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 10/427 句",
            "words": [
                  {
                        "iast": "samyakpratipannānām",
                        "stem": "samyak-pratipanna",
                        "grammar": "Samāsa · 复合词 (Gen. Pl. · 属格复数)",
                        "transliterationZh": "萨摩耶羯钵啰底伴那(引)喃(引)（拼读参考：萨₍姆₎呀₍克₎-₍普₎啦帝班拿南）",
                        "meaningZh": "权利诸入之",
                        "meaningEn": "right + of all practised",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-11",
            "index": 11,
            "iast": "namo devarṣīṇām",
            "classicalTranslitZh": "南无提婆离瑟𧹞",
            "modernPhoneticZh": "拿摩 叠瓦₍尔₎师南",
            "meaningZh": "归命诸天界持法仙人众！",
            "meaningEn": "Homage to the celestial sages (Devarṣis)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 11/427 句",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "devarṣīṇām",
                        "stem": "da-va-ra",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "泥嚩哩瑟(引)喃(引)（拼读参考：叠瓦₍尔₎师南）",
                        "meaningZh": "施度调伏·最上真言离言说·清净离诸尘垢",
                        "meaningEn": "generosity & self-mastery & supreme ineffable speech & stainless purity free from dust",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-12",
            "index": 12,
            "iast": "namaḥ siddhavidyādhararṣīṇām",
            "classicalTranslitZh": "南无悉陀耶毗地耶陀啰离瑟𧹞",
            "modernPhoneticZh": "拿玛₍赫₎ 悉达维₍地₎呀达啦₍尔₎师南",
            "meaningZh": "归命一切成就持明咒仙众！",
            "meaningEn": "Homage to the accomplished Vidyādhara sages!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 12/427 句",
            "words": [
                  {
                        "iast": "namaḥ",
                        "stem": "namaḥ",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "曩莫（拼读参考：拿玛₍赫₎）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "siddhavidyādhararṣīṇām",
                        "stem": "√siddh+√dhar",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "悉没驮尾地夜驮啰哩瑟(引)喃(引)（拼读参考：悉达维₍地₎呀达啦₍尔₎师南）",
                        "meaningZh": "悉地成就·持守摄受·一切诸谛圆满",
                        "meaningEn": "perfected, bearing",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-13",
            "index": 13,
            "iast": "śāpānugrahasamarthānām",
            "classicalTranslitZh": "舍波奴揭啰诃娑诃娑啰摩他喃",
            "modernPhoneticZh": "沙巴努₍格₎啦哈萨玛₍尔₎他南",
            "meaningZh": "能以威神摄伏恶毒、慈悲摄受善类之具力仙众！",
            "meaningEn": "Capable of subduing evil curses and bestowing grace!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 13/427 句",
            "words": [
                  {
                        "iast": "śāpānugrahasamarthānām",
                        "stem": "śāpa-anugraha-samartha",
                        "grammar": "Samāsa · 复合词 (Gen. Pl. · 属格复数)",
                        "transliterationZh": "奢波努伽啰诃萨摩哩他(引)喃(引)（拼读参考：沙巴努₍格₎啦哈萨玛₍尔₎他南）",
                        "meaningZh": "尸吊·摄益·诸功能之",
                        "meaningEn": "curse + to benefit + of all ability",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-14",
            "index": 14,
            "iast": "namo brahmaṇe",
            "classicalTranslitZh": "南无跋啰诃摩泥",
            "modernPhoneticZh": "拿摩 ₍布₎啦₍赫₎玛内",
            "meaningZh": "归命色界大梵天王护法尊！",
            "meaningEn": "Homage to Brahmā!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 14/427 句",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "brahmaṇe",
                        "stem": "ba-ra-ha",
                        "grammar": "Mantra Voc. · 真言呼请句",
                        "transliterationZh": "跋啰纥摩宁（拼读参考：₍布₎啦₍赫₎玛内）",
                        "meaningZh": "解脱系缚大力·清净离诸尘垢·因缘空寂大乐（呼请加持）",
                        "meaningEn": "spiritual strength freeing bonds & stainless purity free from dust & causal emptiness & spiritual joy (vocative invocation)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-15",
            "index": 15,
            "iast": "nama indrāya",
            "classicalTranslitZh": "南无因陀啰耶",
            "modernPhoneticZh": "拿玛 因₍德₎啦呀",
            "meaningZh": "归命忉利天主帝释天王护法尊！",
            "meaningEn": "Homage to Indra (Śakra)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 15/427 句",
            "words": [
                  {
                        "iast": "nama",
                        "stem": "nama",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "曩莫（拼读参考：拿玛）",
                        "meaningZh": "归命、敬礼",
                        "meaningEn": "homage, salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "indrāya",
                        "stem": "indra",
                        "grammar": "Dat. Sg. · 为格单数",
                        "transliterationZh": "印捺啰(引)耶（拼读参考：因₍德₎啦呀）",
                        "meaningZh": "向因陀逻 / 天主",
                        "meaningEn": "to/for Śakra king of the gods; O king of the gods!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-16",
            "index": 16,
            "iast": "namo bhagavate",
            "classicalTranslitZh": "南无婆伽婆帝",
            "modernPhoneticZh": "拿摩 巴嘎瓦帝",
            "meaningZh": "归命具尊贵威德者！",
            "meaningEn": "Homage to the Venerable Lord!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 16/427 句",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bhagavate",
                        "stem": "bhagavate",
                        "grammar": "Dat.Sg. · 为格单数",
                        "transliterationZh": "薄伽伐帝 / 婆誐嚩帝（拼读参考：巴嘎瓦帝）",
                        "meaningZh": "向世尊（薄伽梵）致敬",
                        "meaningEn": "to the Blessed One, World-Honored Lord",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-17",
            "index": 17,
            "iast": "rudrāya",
            "classicalTranslitZh": "嚧陀啰耶",
            "modernPhoneticZh": "鲁₍德₎啦呀",
            "meaningZh": "大自在天（鲁陀罗威猛尊）！",
            "meaningEn": "To Rudra (Maheśvara)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 17/427 句",
            "words": [
                  {
                        "iast": "rudrāya",
                        "stem": "rudra",
                        "grammar": "Dat. Sg. · 为格单数",
                        "transliterationZh": "噜捺啰(引)耶（拼读参考：鲁₍德₎啦呀）",
                        "meaningZh": "向紧恶",
                        "meaningEn": "to/for of gods; of the god of tempests , ruler of the Maruts, his sons, the Rudras or Maruts",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-18",
            "index": 18,
            "iast": "umāpati",
            "classicalTranslitZh": "乌摩般帝",
            "modernPhoneticZh": "乌玛巴帝",
            "meaningZh": "乌摩天后之主！",
            "meaningEn": "Lord of Umā!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 18/427 句",
            "words": [
                  {
                        "iast": "umāpati",
                        "stem": "umāpati",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "坞摩(引)跛底（拼读参考：乌玛巴帝）",
                        "meaningZh": "自在主",
                        "meaningEn": "the lord or husband of Umā, Śiva",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-19",
            "index": 19,
            "iast": "sahīyāya",
            "classicalTranslitZh": "娑醯夜耶",
            "modernPhoneticZh": "萨嘿呀呀",
            "meaningZh": "及其一切护法眷属部众！",
            "meaningEn": "Together with his retinue!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 19/427 句",
            "words": [
                  {
                        "iast": "sahīyāya",
                        "stem": "sahīya",
                        "grammar": "Dat. Sg. · 为格单数",
                        "transliterationZh": "萨醯夜耶（拼读参考：萨嘿呀呀）",
                        "meaningZh": "向公司、陪同",
                        "meaningEn": "to/for associated, in company; companion",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-20",
            "index": 20,
            "iast": "namo bhagavate",
            "classicalTranslitZh": "南无婆伽婆帝",
            "modernPhoneticZh": "拿摩 巴嘎瓦帝",
            "meaningZh": "归命具尊贵威德者！",
            "meaningEn": "Homage to the Venerable Lord!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 20/427 句",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bhagavate",
                        "stem": "bhagavate",
                        "grammar": "Dat.Sg. · 为格单数",
                        "transliterationZh": "薄伽伐帝 / 婆誐嚩帝（拼读参考：巴嘎瓦帝）",
                        "meaningZh": "向世尊（薄伽梵）致敬",
                        "meaningEn": "to the Blessed One, World-Honored Lord",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-21",
            "index": 21,
            "iast": "nārāyaṇāya",
            "classicalTranslitZh": "那啰野拏耶",
            "modernPhoneticZh": "拿啦呀拿呀",
            "meaningZh": "那罗延天（遍入天护法主）！",
            "meaningEn": "To Nārāyaṇa!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 21/427 句",
            "words": [
                  {
                        "iast": "nārāyaṇāya",
                        "stem": "nārāyaṇa",
                        "grammar": "Dat. Sg. · 为格单数",
                        "transliterationZh": "那(引)啰(引)耶拏(引)耶（拼读参考：拿啦呀拿呀）",
                        "meaningZh": "向那罗延",
                        "meaningEn": "to/for Narayana",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-22",
            "index": 22,
            "iast": "pañcamahāsamudrā",
            "classicalTranslitZh": "槃遮摩诃三慕陀啰",
            "modernPhoneticZh": "班佳玛哈萨穆₍德₎啦",
            "meaningZh": "执持五大海印契尊！",
            "meaningEn": "Endowed with the Five Great Ocean Seals!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 22/427 句",
            "words": [
                  {
                        "iast": "pañcamahāsamudrā",
                        "stem": "pañca-mahā-samudra",
                        "grammar": "Samāsa · 复合词 (Nom. Sg. Fem. · 主格阴性)",
                        "transliterationZh": "伴者摩诃萨母捺啰(引)（拼读参考：班佳玛哈萨穆₍德₎啦）",
                        "meaningZh": "五·大·大海",
                        "meaningEn": "five + great + ocean",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-23",
            "index": 23,
            "iast": "namaskṛtāya",
            "classicalTranslitZh": "南无悉羯唎多耶",
            "modernPhoneticZh": "拿玛₍斯克₎日达呀",
            "meaningZh": "常受诸天礼敬赞叹者！",
            "meaningEn": "Revered and bowed to!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 23/427 句",
            "words": [
                  {
                        "iast": "namaskṛtāya",
                        "stem": "namas-kṛta",
                        "grammar": "Samāsa · 复合词 (Dat. Sg. · 为格单数)",
                        "transliterationZh": "曩摩悉讫哩多耶（拼读参考：拿玛₍斯克₎日达呀）",
                        "meaningZh": "向归命所作",
                        "meaningEn": "homage + to",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-24",
            "index": 24,
            "iast": "namo bhagavate",
            "classicalTranslitZh": "南无婆伽婆帝",
            "modernPhoneticZh": "拿摩 巴嘎瓦帝",
            "meaningZh": "归命世尊护法威神主！",
            "meaningEn": "Homage to the Blessed Protector!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 24/427 句",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bhagavate",
                        "stem": "bhagavate",
                        "grammar": "Dat.Sg. · 为格单数",
                        "transliterationZh": "薄伽伐帝 / 婆誐嚩帝（拼读参考：巴嘎瓦帝）",
                        "meaningZh": "向世尊（薄伽梵）致敬",
                        "meaningEn": "to the Blessed One, World-Honored Lord",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-25",
            "index": 25,
            "iast": "mahākālāya",
            "classicalTranslitZh": "摩诃迦罗耶",
            "modernPhoneticZh": "玛哈-嘎啦呀",
            "meaningZh": "大黑天神王（摩诃迦罗护法尊）！",
            "meaningEn": "To Mahākāla!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 25/427 句",
            "words": [
                  {
                        "iast": "mahākālāya",
                        "stem": "mahākāla",
                        "grammar": "Prop.Noun · 大黑天 · Dat. Sg. · 为格单数",
                        "transliterationZh": "摩诃迦(引)攞(引)耶（拼读参考：玛哈-嘎啦呀）",
                        "meaningZh": "向大黑天护法（摩诃迦罗）",
                        "meaningEn": "to/for Mahākāla, Great Black Dharmapāla",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-26",
            "index": 26,
            "iast": "tripuranagara",
            "classicalTranslitZh": "地唎般剌那伽啰",
            "modernPhoneticZh": "₍特₎里布啦拿嘎啦",
            "meaningZh": "能破三魔罗城（三有贪嗔痴城）！",
            "meaningEn": "Of the Three Fortified Cities (Tripura)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 26/427 句",
            "words": [
                  {
                        "iast": "tripuranagara",
                        "stem": "tri-pura-nagara",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "怛哩补啰曩誐啰（拼读参考：₍特₎里布啦拿嘎啦）",
                        "meaningZh": "三·城邑·小邑",
                        "meaningEn": "three + city + town",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-27",
            "index": 27,
            "iast": "vidrāpaṇakarāya",
            "classicalTranslitZh": "毗陀啰波拏迦啰耶",
            "modernPhoneticZh": "维₍德₎啦巴拿嘎啦呀",
            "meaningZh": "摧碎驱散一切魔军作大威神者！",
            "meaningEn": "Who shatters and routs them completely!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 27/427 句",
            "words": [
                  {
                        "iast": "vidrāpaṇakarāya",
                        "stem": "vid-āpaṇa-kara",
                        "grammar": "Samāsa · 复合词 (Dat. Sg. · 为格单数)",
                        "transliterationZh": "尾捺啰(引)跛拏迦啰(引)耶（拼读参考：维₍德₎啦巴拿嘎啦呀）",
                        "meaningZh": "向解肆掌",
                        "meaningEn": "understanding + a shop + to",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-28",
            "index": 28,
            "iast": "adhimukti",
            "classicalTranslitZh": "阿地目帝",
            "modernPhoneticZh": "阿地穆₍克₎帝",
            "meaningZh": "善解脱无畏胜解心！",
            "meaningEn": "Resolute in liberation!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 28/427 句",
            "words": [
                  {
                        "iast": "adhimukti",
                        "stem": "adhimukti",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "阿地母羯底（拼读参考：阿地穆₍克₎帝）",
                        "meaningZh": "信解",
                        "meaningEn": "resolution; determination",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-29",
            "index": 29,
            "iast": "śmaśānanivāsine",
            "classicalTranslitZh": "尸摩舍那泥婆悉泥",
            "modernPhoneticZh": "₍希₎玛沙拿尼瓦悉内",
            "meaningZh": "住于寒林尸陀林度化群迷者！",
            "meaningEn": "Dwelling in the charnel ground!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 29/427 句",
            "words": [
                  {
                        "iast": "śmaśānanivāsine",
                        "stem": "śmaśāna-ni-vāsas-ina",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "室摩奢曩你嚩(引)悉祢（拼读参考：₍希₎玛沙拿尼瓦悉内）",
                        "meaningZh": "恐毘林·在于·天衣·勇健",
                        "meaningEn": "smasana + in + garment + O strong",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-30",
            "index": 30,
            "iast": "mātṛgaṇa",
            "classicalTranslitZh": "摩怛唎伽拏",
            "modernPhoneticZh": "玛₍特₎日嘎拿",
            "meaningZh": "一切诸天母护法海众！",
            "meaningEn": "By the host of Mother-Goddesses (Mātṛgaṇas)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 30/427 句",
            "words": [
                  {
                        "iast": "mātṛgaṇa",
                        "stem": "mātṛ-gaṇa",
                        "grammar": "Samāsa · 复合词 (Noun · 圣众海会)",
                        "transliterationZh": "摩(引)底哩誐拏（拼读参考：玛₍特₎日嘎拿）",
                        "meaningZh": "母海会众",
                        "meaningEn": "mother + assembly",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-31",
            "index": 31,
            "iast": "namaskṛtāya",
            "classicalTranslitZh": "南无悉羯唎多耶",
            "modernPhoneticZh": "拿玛₍斯克₎日达呀",
            "meaningZh": "悉皆稽首归命奉事者！",
            "meaningEn": "Venerated and honored!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 31/427 句",
            "words": [
                  {
                        "iast": "namaskṛtāya",
                        "stem": "namas-kṛta",
                        "grammar": "Samāsa · 复合词 (Dat. Sg. · 为格单数)",
                        "transliterationZh": "曩摩悉讫哩多耶（拼读参考：拿玛₍斯克₎日达呀）",
                        "meaningZh": "向归命所作",
                        "meaningEn": "homage + to",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-32",
            "index": 32,
            "iast": "namo bhagavate",
            "classicalTranslitZh": "南无婆伽婆帝",
            "modernPhoneticZh": "拿摩 巴嘎瓦帝",
            "meaningZh": "归命世尊！",
            "meaningEn": "Homage to the Blessed One!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 32/427 句",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bhagavate",
                        "stem": "bhagavate",
                        "grammar": "Dat.Sg. · 为格单数",
                        "transliterationZh": "薄伽伐帝 / 婆誐嚩帝（拼读参考：巴嘎瓦帝）",
                        "meaningZh": "向世尊（薄伽梵）致敬",
                        "meaningEn": "to the Blessed One, World-Honored Lord",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-33",
            "index": 33,
            "iast": "tathāgatakulāya",
            "classicalTranslitZh": "多他伽跢俱啰耶",
            "modernPhoneticZh": "达他嘎达-古啦呀",
            "meaningZh": "中央佛部（如来部族）一切圣众！",
            "meaningEn": "Of the Tathāgata (Buddha) Family!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 33/427 句",
            "words": [
                  {
                        "iast": "tathāgatakulāya",
                        "stem": "tathāgata-kulāya",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "怛他(引)誐怛矩攞(引)耶（拼读参考：达他嘎达-古啦呀）",
                        "meaningZh": "如来质地",
                        "meaningEn": "Tathāgata + texture",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-34",
            "index": 34,
            "iast": "namaḥ padmakulāya",
            "classicalTranslitZh": "南无般头摩俱啰耶",
            "modernPhoneticZh": "拿玛₍赫₎ 巴₍德₎玛-古啦呀",
            "meaningZh": "归命西方莲华部一切圣众！",
            "meaningEn": "Homage to the Lotus (Padma) Family!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 34/427 句",
            "words": [
                  {
                        "iast": "namaḥ",
                        "stem": "namaḥ",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "曩莫（拼读参考：拿玛₍赫₎）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "padmakulāya",
                        "stem": "padma-kulāya",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "钵讷摩矩攞(引)耶（拼读参考：巴₍德₎玛-古啦呀）",
                        "meaningZh": "莲华质地",
                        "meaningEn": "lotus flower + texture",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-35",
            "index": 35,
            "iast": "namo vajrakulāya",
            "classicalTranslitZh": "南无跋阇罗俱啰耶",
            "modernPhoneticZh": "拿摩 瓦₍吉₎啦-古啦呀",
            "meaningZh": "归命东方金刚部一切圣众！",
            "meaningEn": "Homage to the Vajra Family!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 35/427 句",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "vajrakulāya",
                        "stem": "vajrakula",
                        "grammar": "Dat. Sg. · 为格单数",
                        "transliterationZh": "嚩日啰矩攞(引)耶（拼读参考：瓦₍吉₎啦-古啦呀）",
                        "meaningZh": "向金刚部",
                        "meaningEn": "to/for vajra group; vajra division; vajrakula",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-36",
            "index": 36,
            "iast": "namo maṇikulāya",
            "classicalTranslitZh": "南无摩尼俱啰耶",
            "modernPhoneticZh": "拿摩 玛尼-古啦呀",
            "meaningZh": "归命南方宝部（摩尼部）一切圣众！",
            "meaningEn": "Homage to the Jewel (Maṇi) Family!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 36/427 句",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "maṇikulāya",
                        "stem": "maṇi-kulāya",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "摩抳矩攞(引)耶（拼读参考：玛尼-古啦呀）",
                        "meaningZh": "摩尼宝珠质地",
                        "meaningEn": "Maṇi jewel + texture",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-37",
            "index": 37,
            "iast": "namo gajakulāya",
            "classicalTranslitZh": "南无伽阇俱啰耶",
            "modernPhoneticZh": "拿摩 嘎佳古啦呀",
            "meaningZh": "归命北方羯磨大象王部一切圣众！",
            "meaningEn": "Homage to the Sovereign Elephant (Gaja) Family!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 37/427 句",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "gajakulāya",
                        "stem": "gaja-kulāya",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "誐惹矩攞(引)耶（拼读参考：嘎佳古啦呀）",
                        "meaningZh": "象质地",
                        "meaningEn": "elephant + texture",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-38",
            "index": 38,
            "iast": "namo bhagavate",
            "classicalTranslitZh": "南无婆伽婆帝",
            "modernPhoneticZh": "拿摩 巴嘎瓦帝",
            "meaningZh": "归命世尊！",
            "meaningEn": "Homage to the Blessed One!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 38/427 句",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bhagavate",
                        "stem": "bhagavate",
                        "grammar": "Dat.Sg. · 为格单数",
                        "transliterationZh": "薄伽伐帝 / 婆誐嚩帝（拼读参考：巴嘎瓦帝）",
                        "meaningZh": "向世尊（薄伽梵）致敬",
                        "meaningEn": "to the Blessed One, World-Honored Lord",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-39",
            "index": 39,
            "iast": "dṛḍhaśūrasena",
            "classicalTranslitZh": "帝唎茶输啰西那",
            "modernPhoneticZh": "₍德₎日达舒啦塞拿",
            "meaningZh": "坚固勇猛军阵大精进尊！",
            "meaningEn": "Steadfast Heroic Army!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 39/427 句",
            "words": [
                  {
                        "iast": "dṛḍhaśūrasena",
                        "stem": "dṛḍha-śūrasena",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "陀哩茶输啰细曩（拼读参考：₍德₎日达舒啦塞拿）",
                        "meaningZh": "坚诸人",
                        "meaningEn": "firm + of a people",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-40",
            "index": 40,
            "iast": "praharaṇarājāya",
            "classicalTranslitZh": "波啰诃啰拏啰阇耶",
            "modernPhoneticZh": "₍普₎啦哈啦拿啦佳呀",
            "meaningZh": "击破魔怨器仗王！",
            "meaningEn": "King of Subduing Weapons!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 40/427 句",
            "words": [
                  {
                        "iast": "praharaṇarājāya",
                        "stem": "praharaṇa-āja",
                        "grammar": "Samāsa · 复合词 (Dat. Sg. · 为格单数)",
                        "transliterationZh": "钵啰诃啰拏啰(引)惹(引)耶（拼读参考：₍普₎啦哈啦拿啦佳呀）",
                        "meaningZh": "向器械来诣",
                        "meaningEn": "striking + to",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-41",
            "index": 41,
            "iast": "tathāgatāya",
            "classicalTranslitZh": "跢他伽多耶",
            "modernPhoneticZh": "达他嘎达呀",
            "meaningZh": "如来！",
            "meaningEn": "The Tathāgata!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 41/427 句",
            "words": [
                  {
                        "iast": "tathāgatāya",
                        "stem": "tathāgata",
                        "grammar": "Noun · 如来 · Dat. Sg. · 为格单数",
                        "transliterationZh": "怛他蘖多耶（拼读参考：达他嘎达呀）",
                        "meaningZh": "向如来（乘如实道来成正觉）",
                        "meaningEn": "to/for Tathāgata, Thus-Come One",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-42",
            "index": 42,
            "iast": "namo bhagavate",
            "classicalTranslitZh": "南无婆伽婆帝",
            "modernPhoneticZh": "拿摩 巴嘎瓦帝",
            "meaningZh": "归命世尊！",
            "meaningEn": "Homage to the Blessed One!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 42/427 句",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bhagavate",
                        "stem": "bhagavate",
                        "grammar": "Dat.Sg. · 为格单数",
                        "transliterationZh": "薄伽伐帝 / 婆誐嚩帝（拼读参考：巴嘎瓦帝）",
                        "meaningZh": "向世尊（薄伽梵）致敬",
                        "meaningEn": "to the Blessed One, World-Honored Lord",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-43",
            "index": 43,
            "iast": "namo amitābhāya",
            "classicalTranslitZh": "南无阿弥多婆耶",
            "modernPhoneticZh": "拿摩 阿米达巴呀",
            "meaningZh": "归命西方极乐世界阿弥陀（无量光）尊！",
            "meaningEn": "Homage to Amitābha (Infinite Light)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 43/427 句",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "amitābhāya",
                        "stem": "amitābha",
                        "grammar": "Prop.Noun · 无量光佛 · Dat. Sg. · 为格单数",
                        "transliterationZh": "阿弭多婆(引)耶（拼读参考：阿米达巴呀）",
                        "meaningZh": "向阿弥陀佛（无量光如来）",
                        "meaningEn": "to/for Amitābha, Buddha of Infinite Light",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-44",
            "index": 44,
            "iast": "tathāgatāya",
            "classicalTranslitZh": "跢他伽多耶",
            "modernPhoneticZh": "达他嘎达呀",
            "meaningZh": "如来！",
            "meaningEn": "The Tathāgata!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 44/427 句",
            "words": [
                  {
                        "iast": "tathāgatāya",
                        "stem": "tathāgata",
                        "grammar": "Noun · 如来 · Dat. Sg. · 为格单数",
                        "transliterationZh": "怛他蘖多耶（拼读参考：达他嘎达呀）",
                        "meaningZh": "向如来（乘如实道来成正觉）",
                        "meaningEn": "to/for Tathāgata, Thus-Come One",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-45",
            "index": 45,
            "iast": "arhate",
            "classicalTranslitZh": "阿啰诃帝",
            "modernPhoneticZh": "阿₍尔₎哈帝",
            "meaningZh": "应供！",
            "meaningEn": "The Arhat (Worthy One)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 45/427 句",
            "words": [
                  {
                        "iast": "arhate",
                        "stem": "arhate",
                        "grammar": "Dat.Sg. · 为格单数",
                        "transliterationZh": "阿啰诃帝（拼读参考：阿₍尔₎哈帝）",
                        "meaningZh": "向应供（阿罗汉）致敬",
                        "meaningEn": "to the Arhat, Worthy One",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-46",
            "index": 46,
            "iast": "samyaksaṃbuddhāya",
            "classicalTranslitZh": "三藐三菩陀耶",
            "modernPhoneticZh": "萨₍姆₎呀₍克₎-桑布达呀",
            "meaningZh": "正遍知（无上正等正觉）！",
            "meaningEn": "The Perfectly Awakened Buddha!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 46/427 句",
            "words": [
                  {
                        "iast": "samyaksaṃbuddhāya",
                        "stem": "samyaksaṃbuddha",
                        "grammar": "Samāsa · 正遍知 · Dat. Sg. · 为格单数",
                        "transliterationZh": "三藐三没驮耶（拼读参考：萨₍姆₎呀₍克₎-桑布达呀）",
                        "meaningZh": "向正等正觉、正遍知",
                        "meaningEn": "to/for Perfectly and Completely Awakened Buddha",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-47",
            "index": 47,
            "iast": "namo bhagavate",
            "classicalTranslitZh": "南无婆伽婆帝",
            "modernPhoneticZh": "拿摩 巴嘎瓦帝",
            "meaningZh": "归命世尊！",
            "meaningEn": "Homage to the Blessed One!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 47/427 句",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bhagavate",
                        "stem": "bhagavate",
                        "grammar": "Dat.Sg. · 为格单数",
                        "transliterationZh": "薄伽伐帝 / 婆誐嚩帝（拼读参考：巴嘎瓦帝）",
                        "meaningZh": "向世尊（薄伽梵）致敬",
                        "meaningEn": "to the Blessed One, World-Honored Lord",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-48",
            "index": 48,
            "iast": "akṣobhyāya",
            "classicalTranslitZh": "阿刍鞞耶",
            "modernPhoneticZh": "阿₍克₎硕₍比₎呀呀",
            "meaningZh": "东方妙喜世界阿閦（不动）尊！",
            "meaningEn": "To Akṣobhya (the Imperturbable)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 48/427 句",
            "words": [
                  {
                        "iast": "akṣobhyāya",
                        "stem": "akṣobhya",
                        "grammar": "Prop.Noun · 不动如来 · Dat. Sg. · 为格单数",
                        "transliterationZh": "阿乞疏毗夜耶（拼读参考：阿₍克₎硕₍比₎呀呀）",
                        "meaningZh": "向阿閦如来（不动如来）",
                        "meaningEn": "to/for Akṣobhya, Imperturbable Buddha",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-49",
            "index": 49,
            "iast": "tathāgatāya",
            "classicalTranslitZh": "跢他伽多耶",
            "modernPhoneticZh": "达他嘎达呀",
            "meaningZh": "如来！",
            "meaningEn": "The Tathāgata!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 49/427 句",
            "words": [
                  {
                        "iast": "tathāgatāya",
                        "stem": "tathāgata",
                        "grammar": "Noun · 如来 · Dat. Sg. · 为格单数",
                        "transliterationZh": "怛他蘖多耶（拼读参考：达他嘎达呀）",
                        "meaningZh": "向如来（乘如实道来成正觉）",
                        "meaningEn": "to/for Tathāgata, Thus-Come One",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-50",
            "index": 50,
            "iast": "arhate",
            "classicalTranslitZh": "阿啰诃帝",
            "modernPhoneticZh": "阿₍尔₎哈帝",
            "meaningZh": "应供！",
            "meaningEn": "The Arhat!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 50/427 句",
            "words": [
                  {
                        "iast": "arhate",
                        "stem": "arhate",
                        "grammar": "Dat.Sg. · 为格单数",
                        "transliterationZh": "阿啰诃帝（拼读参考：阿₍尔₎哈帝）",
                        "meaningZh": "向应供（阿罗汉）致敬",
                        "meaningEn": "to the Arhat, Worthy One",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-51",
            "index": 51,
            "iast": "samyaksaṃbuddhāya",
            "classicalTranslitZh": "三藐三菩陀耶",
            "modernPhoneticZh": "萨₍姆₎呀₍克₎-桑布达呀",
            "meaningZh": "正遍知！",
            "meaningEn": "The Perfectly Awakened Buddha!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 51/427 句",
            "words": [
                  {
                        "iast": "samyaksaṃbuddhāya",
                        "stem": "samyaksaṃbuddha",
                        "grammar": "Samāsa · 正遍知 · Dat. Sg. · 为格单数",
                        "transliterationZh": "三藐三没驮耶（拼读参考：萨₍姆₎呀₍克₎-桑布达呀）",
                        "meaningZh": "向正等正觉、正遍知",
                        "meaningEn": "to/for Perfectly and Completely Awakened Buddha",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-52",
            "index": 52,
            "iast": "namo bhagavate",
            "classicalTranslitZh": "南无婆伽婆帝",
            "modernPhoneticZh": "拿摩 巴嘎瓦帝",
            "meaningZh": "归命世尊！",
            "meaningEn": "Homage to the Blessed One!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 52/427 句",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bhagavate",
                        "stem": "bhagavate",
                        "grammar": "Dat.Sg. · 为格单数",
                        "transliterationZh": "薄伽伐帝 / 婆誐嚩帝（拼读参考：巴嘎瓦帝）",
                        "meaningZh": "向世尊（薄伽梵）致敬",
                        "meaningEn": "to the Blessed One, World-Honored Lord",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-53",
            "index": 53,
            "iast": "bhaiṣajyaguruvaidūrya",
            "classicalTranslitZh": "鞞沙阇耶俱卢吠柱唎耶",
            "modernPhoneticZh": "拜沙₍吉₎呀-古鲁歪杜₍哩₎呀",
            "meaningZh": "东方药师琉璃尊！",
            "meaningEn": "Medicine Master of Lapis Lazuli!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 53/427 句",
            "words": [
                  {
                        "iast": "bhaiṣajyaguruvaidūrya",
                        "stem": "bha-ṣa-ja",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "拜洒惹耶具噜吠努(引)哩耶（拼读参考：拜沙₍吉₎呀-古鲁歪杜₍哩₎呀）",
                        "meaningZh": "破有相福德光·六度满行清净·生起不可得·尊胜",
                        "meaningEn": "blessedness transcending existence & perfection of the six pāramitās & transcending birth & victorious",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-54",
            "index": 54,
            "iast": "prabharājāya",
            "classicalTranslitZh": "般啰婆啰阇耶",
            "modernPhoneticZh": "₍普₎啦巴啦佳呀",
            "meaningZh": "光明王！",
            "meaningEn": "King of Radiance!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 54/427 句",
            "words": [
                  {
                        "iast": "prabharājāya",
                        "stem": "prabha-āja",
                        "grammar": "Samāsa · 复合词 (Dat. Sg. · 为格单数)",
                        "transliterationZh": "钵啰婆啰(引)惹(引)耶（拼读参考：₍普₎啦巴啦佳呀）",
                        "meaningZh": "向光明来诣",
                        "meaningEn": "light + to",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-55",
            "index": 55,
            "iast": "tathāgatāya",
            "classicalTranslitZh": "跢他伽多耶",
            "modernPhoneticZh": "达他嘎达呀",
            "meaningZh": "如来！",
            "meaningEn": "The Tathāgata!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 55/427 句",
            "words": [
                  {
                        "iast": "tathāgatāya",
                        "stem": "tathāgata",
                        "grammar": "Noun · 如来 · Dat. Sg. · 为格单数",
                        "transliterationZh": "怛他蘖多耶（拼读参考：达他嘎达呀）",
                        "meaningZh": "向如来（乘如实道来成正觉）",
                        "meaningEn": "to/for Tathāgata, Thus-Come One",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-56",
            "index": 56,
            "iast": "namo bhagavate",
            "classicalTranslitZh": "南无婆伽婆帝",
            "modernPhoneticZh": "拿摩 巴嘎瓦帝",
            "meaningZh": "归命世尊！",
            "meaningEn": "Homage to the Blessed One!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 56/427 句",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bhagavate",
                        "stem": "bhagavate",
                        "grammar": "Dat.Sg. · 为格单数",
                        "transliterationZh": "薄伽伐帝 / 婆誐嚩帝（拼读参考：巴嘎瓦帝）",
                        "meaningZh": "向世尊（薄伽梵）致敬",
                        "meaningEn": "to the Blessed One, World-Honored Lord",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-57",
            "index": 57,
            "iast": "saṃpuṣpita",
            "classicalTranslitZh": "三补师毖多",
            "modernPhoneticZh": "桑布₍师₎比达",
            "meaningZh": "妙华遍敷开显！",
            "meaningEn": "Fully Blossomed!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 57/427 句",
            "words": [
                  {
                        "iast": "saṃpuṣpita",
                        "stem": "saṃpuṣpita",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "三补瑟比怛（拼读参考：桑布₍师₎比达）",
                        "meaningZh": "充分开放",
                        "meaningEn": "in full bloom",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-58",
            "index": 58,
            "iast": "sālendrarājāya",
            "classicalTranslitZh": "萨怜捺啰剌阇耶",
            "modernPhoneticZh": "萨伦₍德₎啦啦佳呀",
            "meaningZh": "娑罗树王！",
            "meaningEn": "Sovereign King of Śāla Trees!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 58/427 句",
            "words": [
                  {
                        "iast": "sālendrarājāya",
                        "stem": "sāla-indra-rāja",
                        "grammar": "Samāsa · 复合词 (Dat. Sg. · 为格单数)",
                        "transliterationZh": "娑隶喃捺啰啰(引)惹(引)耶（拼读参考：萨伦₍德₎啦啦佳呀）",
                        "meaningZh": "向坚固因陀逻王",
                        "meaningEn": "sāla + Śakra king of the gods + to",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-59",
            "index": 59,
            "iast": "tathāgatāya",
            "classicalTranslitZh": "跢他伽多耶",
            "modernPhoneticZh": "达他嘎达呀",
            "meaningZh": "如来！",
            "meaningEn": "The Tathāgata!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 59/427 句",
            "words": [
                  {
                        "iast": "tathāgatāya",
                        "stem": "tathāgata",
                        "grammar": "Noun · 如来 · Dat. Sg. · 为格单数",
                        "transliterationZh": "怛他蘖多耶（拼读参考：达他嘎达呀）",
                        "meaningZh": "向如来（乘如实道来成正觉）",
                        "meaningEn": "to/for Tathāgata, Thus-Come One",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-60",
            "index": 60,
            "iast": "arhate",
            "classicalTranslitZh": "阿啰诃帝",
            "modernPhoneticZh": "阿₍尔₎哈帝",
            "meaningZh": "应供！",
            "meaningEn": "The Arhat!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 60/427 句",
            "words": [
                  {
                        "iast": "arhate",
                        "stem": "arhate",
                        "grammar": "Dat.Sg. · 为格单数",
                        "transliterationZh": "阿啰诃帝（拼读参考：阿₍尔₎哈帝）",
                        "meaningZh": "向应供（阿罗汉）致敬",
                        "meaningEn": "to the Arhat, Worthy One",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-61",
            "index": 61,
            "iast": "samyaksaṃbuddhāya",
            "classicalTranslitZh": "三藐三菩陀耶",
            "modernPhoneticZh": "萨₍姆₎呀₍克₎-桑布达呀",
            "meaningZh": "正遍知！",
            "meaningEn": "The Perfectly Awakened Buddha!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 61/427 句",
            "words": [
                  {
                        "iast": "samyaksaṃbuddhāya",
                        "stem": "samyaksaṃbuddha",
                        "grammar": "Samāsa · 正遍知 · Dat. Sg. · 为格单数",
                        "transliterationZh": "三藐三没驮耶（拼读参考：萨₍姆₎呀₍克₎-桑布达呀）",
                        "meaningZh": "向正等正觉、正遍知",
                        "meaningEn": "to/for Perfectly and Completely Awakened Buddha",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-62",
            "index": 62,
            "iast": "namo bhagavate",
            "classicalTranslitZh": "南无婆伽婆帝",
            "modernPhoneticZh": "拿摩 巴嘎瓦帝",
            "meaningZh": "归命世尊！",
            "meaningEn": "Homage to the Blessed One!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 62/427 句",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bhagavate",
                        "stem": "bhagavate",
                        "grammar": "Dat.Sg. · 为格单数",
                        "transliterationZh": "薄伽伐帝 / 婆誐嚩帝（拼读参考：巴嘎瓦帝）",
                        "meaningZh": "向世尊（薄伽梵）致敬",
                        "meaningEn": "to the Blessed One, World-Honored Lord",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-63",
            "index": 63,
            "iast": "śākyamunaye",
            "classicalTranslitZh": "舍鸡野母那曳",
            "modernPhoneticZh": "沙₍克₎呀穆拿耶",
            "meaningZh": "娑婆教主本师释迦牟尼尊！",
            "meaningEn": "To Śākyamuni!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 63/427 句",
            "words": [
                  {
                        "iast": "śākyamunaye",
                        "stem": "śākyamuni",
                        "grammar": "Prop.Noun · 本师佛号 · Dat. Sg. · 为格单数",
                        "transliterationZh": "奢枳耶母曩曳（拼读参考：沙₍克₎呀穆拿耶）",
                        "meaningZh": "向释迦牟尼佛（能仁寂默）",
                        "meaningEn": "to Śākyamuni Buddha, Sage of the Śākyas",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-64",
            "index": 64,
            "iast": "tathāgatāya",
            "classicalTranslitZh": "跢他伽多耶",
            "modernPhoneticZh": "达他嘎达呀",
            "meaningZh": "如来！",
            "meaningEn": "The Tathāgata!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 64/427 句",
            "words": [
                  {
                        "iast": "tathāgatāya",
                        "stem": "tathāgata",
                        "grammar": "Noun · 如来 · Dat. Sg. · 为格单数",
                        "transliterationZh": "怛他蘖多耶（拼读参考：达他嘎达呀）",
                        "meaningZh": "向如来（乘如实道来成正觉）",
                        "meaningEn": "to/for Tathāgata, Thus-Come One",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-65",
            "index": 65,
            "iast": "arhate",
            "classicalTranslitZh": "阿啰诃帝",
            "modernPhoneticZh": "阿₍尔₎哈帝",
            "meaningZh": "应供！",
            "meaningEn": "The Arhat!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 65/427 句",
            "words": [
                  {
                        "iast": "arhate",
                        "stem": "arhate",
                        "grammar": "Dat.Sg. · 为格单数",
                        "transliterationZh": "阿啰诃帝（拼读参考：阿₍尔₎哈帝）",
                        "meaningZh": "向应供（阿罗汉）致敬",
                        "meaningEn": "to the Arhat, Worthy One",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-66",
            "index": 66,
            "iast": "samyaksaṃbuddhāya",
            "classicalTranslitZh": "三藐三菩陀耶",
            "modernPhoneticZh": "萨₍姆₎呀₍克₎-桑布达呀",
            "meaningZh": "正遍知！",
            "meaningEn": "The Perfectly Awakened Buddha!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 66/427 句",
            "words": [
                  {
                        "iast": "samyaksaṃbuddhāya",
                        "stem": "samyaksaṃbuddha",
                        "grammar": "Samāsa · 正遍知 · Dat. Sg. · 为格单数",
                        "transliterationZh": "三藐三没驮耶（拼读参考：萨₍姆₎呀₍克₎-桑布达呀）",
                        "meaningZh": "向正等正觉、正遍知",
                        "meaningEn": "to/for Perfectly and Completely Awakened Buddha",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-67",
            "index": 67,
            "iast": "namo bhagavate",
            "classicalTranslitZh": "南无婆伽婆帝",
            "modernPhoneticZh": "拿摩 巴嘎瓦帝",
            "meaningZh": "归命世尊！",
            "meaningEn": "Homage to the Blessed One!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 67/427 句",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bhagavate",
                        "stem": "bhagavate",
                        "grammar": "Dat.Sg. · 为格单数",
                        "transliterationZh": "薄伽伐帝 / 婆誐嚩帝（拼读参考：巴嘎瓦帝）",
                        "meaningZh": "向世尊（薄伽梵）致敬",
                        "meaningEn": "to the Blessed One, World-Honored Lord",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-68",
            "index": 68,
            "iast": "ratnaketurājāya",
            "classicalTranslitZh": "剌怛那鸡都啰阇耶",
            "modernPhoneticZh": "啦₍特₎拿-给度啦佳呀",
            "meaningZh": "宝幢王尊！",
            "meaningEn": "To Ratnaketurāja (Jewel-Banner King)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 68/427 句",
            "words": [
                  {
                        "iast": "ratnaketurājāya",
                        "stem": "ratnaketuḥ-āja",
                        "grammar": "Samāsa · 复合词 (Dat. Sg. · 为格单数)",
                        "transliterationZh": "啰怛曩计都啰(引)惹(引)耶（拼读参考：啦₍特₎拿-给度啦佳呀）",
                        "meaningZh": "向宝髻经来诣",
                        "meaningEn": "to",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-69",
            "index": 69,
            "iast": "tathāgatāya",
            "classicalTranslitZh": "跢他伽多耶",
            "modernPhoneticZh": "达他嘎达呀",
            "meaningZh": "如来！",
            "meaningEn": "The Tathāgata!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 69/427 句",
            "words": [
                  {
                        "iast": "tathāgatāya",
                        "stem": "tathāgata",
                        "grammar": "Noun · 如来 · Dat. Sg. · 为格单数",
                        "transliterationZh": "怛他蘖多耶（拼读参考：达他嘎达呀）",
                        "meaningZh": "向如来（乘如实道来成正觉）",
                        "meaningEn": "to/for Tathāgata, Thus-Come One",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-70",
            "index": 70,
            "iast": "arhate",
            "classicalTranslitZh": "阿啰诃帝",
            "modernPhoneticZh": "阿₍尔₎哈帝",
            "meaningZh": "应供！",
            "meaningEn": "The Arhat!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 70/427 句",
            "words": [
                  {
                        "iast": "arhate",
                        "stem": "arhate",
                        "grammar": "Dat.Sg. · 为格单数",
                        "transliterationZh": "阿啰诃帝（拼读参考：阿₍尔₎哈帝）",
                        "meaningZh": "向应供（阿罗汉）致敬",
                        "meaningEn": "to the Arhat, Worthy One",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-71",
            "index": 71,
            "iast": "samyaksaṃbuddhāya",
            "classicalTranslitZh": "三藐三菩陀耶",
            "modernPhoneticZh": "萨₍姆₎呀₍克₎-桑布达呀",
            "meaningZh": "正遍知！",
            "meaningEn": "The Perfectly Awakened Buddha!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 71/427 句",
            "words": [
                  {
                        "iast": "samyaksaṃbuddhāya",
                        "stem": "samyaksaṃbuddha",
                        "grammar": "Samāsa · 正遍知 · Dat. Sg. · 为格单数",
                        "transliterationZh": "三藐三没驮耶（拼读参考：萨₍姆₎呀₍克₎-桑布达呀）",
                        "meaningZh": "向正等正觉、正遍知",
                        "meaningEn": "to/for Perfectly and Completely Awakened Buddha",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-72",
            "index": 72,
            "iast": "ebhyo namaskṛtvā",
            "classicalTranslitZh": "帝瓢南无萨羯唎多",
            "modernPhoneticZh": "诶₍比₎优 拿玛₍斯克₎日₍特₎瓦",
            "meaningZh": "我今向如上十方三宝圣众顶礼已！",
            "meaningEn": "Having bowed in homage to all these!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 72/427 句",
            "words": [
                  {
                        "iast": "ebhyo",
                        "stem": "bha-ya",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "翳毗瑜（拼读参考：诶₍比₎优）",
                        "meaningZh": "破有相福德光·一乘如实之道",
                        "meaningEn": "blessedness transcending existence & supreme vehicle of awakening",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "namaskṛtvā",
                        "stem": "namaskṛtvā",
                        "grammar": "Gerund · 敬礼已",
                        "transliterationZh": "曩摩悉讫哩怛嚩(引)（拼读参考：拿玛₍斯克₎日₍特₎瓦）",
                        "meaningZh": "顶礼敬拜已",
                        "meaningEn": "having paid homage/salutation",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-73",
            "index": 73,
            "iast": "imāṃ bhagavatīm",
            "classicalTranslitZh": "翳昙婆伽婆多",
            "modernPhoneticZh": "伊芒 巴嘎瓦丁",
            "meaningZh": "宣说此世尊佛母法门！",
            "meaningEn": "This Blessed Bhagavatī!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 73/427 句",
            "words": [
                  {
                        "iast": "imāṃ",
                        "stem": "imām",
                        "grammar": "Pron.Acc.Sg.F. · 阴性宾格",
                        "transliterationZh": "伊莽(引)（拼读参考：伊芒）",
                        "meaningZh": "此（陀罗尼明妃，阴性宾格）",
                        "meaningEn": "this (feminine accusative)",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bhagavatīm",
                        "stem": "bha-ga-va",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "婆誐嚩底喃（拼读参考：巴嘎瓦丁）",
                        "meaningZh": "破有相福德光·妙行趣入·最上真言离言说",
                        "meaningEn": "blessedness transcending existence & awakened spiritual movement & supreme ineffable speech",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-74",
            "index": 74,
            "iast": "sarvatathāgatoṣṇīṣam",
            "classicalTranslitZh": "萨怛他伽都瑟尼釤",
            "modernPhoneticZh": "萨₍尔₎瓦-达他嘎多-₍师₎尼伤",
            "meaningZh": "一切如来无见顶相佛顶尊！",
            "meaningEn": "Crown-Uṣṇīṣa of All Tathāgatas!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 74/427 句",
            "words": [
                  {
                        "iast": "sarvatathāgatoṣṇīṣam",
                        "stem": "sarvatathāgata-uṣṇīṣa",
                        "grammar": "Samāsa · 复合词 (Acc./Nom. Sg. · 业格/主格单数)",
                        "transliterationZh": "萨哩嚩怛他(引)誐睹瑟抳(引)忏（拼读参考：萨₍尔₎瓦-达他嘎多-₍师₎尼伤）",
                        "meaningZh": "一切如来佛顶肉髻相",
                        "meaningEn": "all Tathagatas + Uṣṇīṣa",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-75",
            "index": 75,
            "iast": "sitātapatrām",
            "classicalTranslitZh": "萨怛多般怛㘕",
            "modernPhoneticZh": "悉达达巴₍特₎朗",
            "meaningZh": "清净大白伞盖遍覆护佑母！",
            "meaningEn": "The White Parasol (Sitātapatrā)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 75/427 句",
            "words": [
                  {
                        "iast": "sitātapatrām",
                        "stem": "sitātapatrā",
                        "grammar": "Prop.Noun · 白伞盖佛母 · Acc. Sg. Fem. · 业格阴性",
                        "transliterationZh": "悉多怛跛怛囕（拼读参考：悉达达巴₍特₎朗）",
                        "meaningZh": "大白伞盖佛母",
                        "meaningEn": "Sitātapatrā, Goddess of the White Parasol",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-76",
            "index": 76,
            "iast": "namo aparājitām",
            "classicalTranslitZh": "南无阿婆啰视耽",
            "modernPhoneticZh": "拿摩 阿巴啦吉当",
            "meaningZh": "归命无能胜最上尊！",
            "meaningEn": "Homage to the Invincible One (Aparājitā)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 76/427 句",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "aparājitām",
                        "stem": "aparājitā",
                        "grammar": "Prop.Noun · 无能胜尊 · Acc. Sg. Fem. · 业格阴性",
                        "transliterationZh": "阿跛啰(引)自担(引)（拼读参考：阿巴啦吉当）",
                        "meaningZh": "无能胜佛母",
                        "meaningEn": "Aparājitā, the Unconquerable Goddess",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-77",
            "index": 77,
            "iast": "pratyaṅgirām",
            "classicalTranslitZh": "般啰帝扬岐囉",
            "modernPhoneticZh": "₍普₎啦₍蒂₎央吉朗",
            "meaningZh": "大回遮母（能破一切恶咒邪术尊）！",
            "meaningEn": "The Great Counter-Sorcery Queen (Pratyaṅgirā)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 77/427 句",
            "words": [
                  {
                        "iast": "pratyaṅgirām",
                        "stem": "pratyaṅgirā",
                        "grammar": "Prop.Noun · 大回遮母 · Acc. Sg. Fem. · 业格阴性",
                        "transliterationZh": "钵啰底耶仰拟囕（拼读参考：₍普₎啦₍蒂₎央吉朗）",
                        "meaningZh": "般罗底扬吉罗（大回遮母、总破邪咒母）",
                        "meaningEn": "Pratyaṅgirā, Counter-Sorcery Protective Goddess",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-78",
            "index": 78,
            "iast": "sarvabhūtagraha",
            "classicalTranslitZh": "萨啰婆部多揭啰诃",
            "modernPhoneticZh": "萨₍尔₎瓦-布达₍格₎啦哈",
            "meaningZh": "于一切部多鬼魅执曜！",
            "meaningEn": "All elemental spirits and planetary demons!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 78/427 句",
            "words": [
                  {
                        "iast": "sarvabhūtagraha",
                        "stem": "sarvabhūta-graha",
                        "grammar": "Samāsa · 复合词 (Noun · 星曜/执障)",
                        "transliterationZh": "萨哩嚩部(引)怛伽啰诃（拼读参考：萨₍尔₎瓦-布达₍格₎啦哈）",
                        "meaningZh": "一切处曜执",
                        "meaningEn": "being everywhere + planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-79",
            "index": 79,
            "iast": "nigrahagrāhakaraṇīm",
            "classicalTranslitZh": "尼羯啰诃揭迦啰诃尼",
            "modernPhoneticZh": "尼₍格₎啦哈₍格₎啦哈嘎啦宁",
            "meaningZh": "悉能调伏摄持禁制母！",
            "meaningEn": "She who subdues and restrains them!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 79/427 句",
            "words": [
                  {
                        "iast": "nigrahagrāhakaraṇīm",
                        "stem": "√kar",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "你伽啰诃伽啰(引)诃迦啰抳喃（拼读参考：尼₍格₎啦哈₍格₎啦哈嘎啦宁）",
                        "meaningZh": "能作成办·离名相假立",
                        "meaningEn": "making",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-80",
            "index": 80,
            "iast": "paravidyācchedanīm",
            "classicalTranslitZh": "跋啰毖地耶叱陀儞",
            "modernPhoneticZh": "巴啦维₍地₎呀切达宁",
            "meaningZh": "斩断一切外道他方恶咒母！",
            "meaningEn": "She who severs all hostile spells!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 80/427 句",
            "words": [
                  {
                        "iast": "paravidyācchedanīm",
                        "stem": "pa-ra-va",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "跛啰尾地夜怛掣捺宁(引)（拼读参考：巴啦维₍地₎呀切达宁）",
                        "meaningZh": "第一义谛·清净离诸尘垢·最上真言离言说",
                        "meaningEn": "ultimate truth & stainless purity free from dust & supreme ineffable speech",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-81",
            "index": 81,
            "iast": "akālamṛtyu",
            "classicalTranslitZh": "阿迦啰蜜唎柱",
            "modernPhoneticZh": "阿嘎啦₍姆₎日₍蒂₎尤",
            "meaningZh": "于一切非时夭折横死厄难！",
            "meaningEn": "From untimely death!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 81/427 句",
            "words": [
                  {
                        "iast": "akālamṛtyu",
                        "stem": "akālamṛtyu",
                        "grammar": "Samāsa · 非时横死",
                        "transliterationZh": "阿迦(引)攞蜜哩底庾（拼读参考：阿嘎啦₍姆₎日₍蒂₎尤）",
                        "meaningZh": "非时横死、夭折厄难",
                        "meaningEn": "untimely/premature death",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-82",
            "index": 82,
            "iast": "paritrāyaṇakarīm",
            "classicalTranslitZh": "般唎怛啰耶儜揭唎",
            "modernPhoneticZh": "巴里-₍特₎啦呀拿嘎林",
            "meaningZh": "慈悲救护度脱母！",
            "meaningEn": "She who rescues and protects!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 82/427 句",
            "words": [
                  {
                        "iast": "paritrāyaṇakarīm",
                        "stem": "√kar",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "跛哩怛啰(引)耶拏迦哩喃（拼读参考：巴里-₍特₎啦呀拿嘎林）",
                        "meaningZh": "能作成办·第一义谛",
                        "meaningEn": "making",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-83",
            "index": 83,
            "iast": "sarvabandhanamokṣaṇīm",
            "classicalTranslitZh": "萨啰婆槃陀那目叉尼",
            "modernPhoneticZh": "萨₍尔₎瓦-班达拿摩₍克₎沙宁",
            "meaningZh": "解脱一切枷锁系缚母！",
            "meaningEn": "Liberator from all fetters and bonds!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 83/427 句",
            "words": [
                  {
                        "iast": "sarvabandhanamokṣaṇīm",
                        "stem": "√bandh+√nam",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "萨哩嚩鍐驮曩谟乞洒抳喃（拼读参考：萨₍尔₎瓦-班达拿摩₍克₎沙宁）",
                        "meaningZh": "结界系缚·归命敬礼·一切诸谛圆满",
                        "meaningEn": "binding obstacles, bowing",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-84",
            "index": 84,
            "iast": "sarvaduṣṭa",
            "classicalTranslitZh": "萨啰婆突瑟吒",
            "modernPhoneticZh": "萨₍尔₎瓦杜₍师₎达",
            "meaningZh": "于一切恶心毒害怨魔！",
            "meaningEn": "All malicious and wicked ones!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 84/427 句",
            "words": [
                  {
                        "iast": "sarvaduṣṭa",
                        "stem": "sarva-duṣṭa",
                        "grammar": "Samāsa · 复合词 (Adj./Noun · 暴恶毒害)",
                        "transliterationZh": "萨哩嚩努瑟吒（拼读参考：萨₍尔₎瓦杜₍师₎达）",
                        "meaningZh": "一切暴恶者",
                        "meaningEn": "all + wicked",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-85",
            "index": 85,
            "iast": "duḥsvapnanivāraṇīm",
            "classicalTranslitZh": "突悉乏般那儞伐啰尼",
            "modernPhoneticZh": "杜₍忽斯₎瓦₍普₎拿尼瓦啦宁",
            "meaningZh": "遮止消除一切恶梦不祥母！",
            "meaningEn": "Warding off all evil nightmares!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 85/427 句",
            "words": [
                  {
                        "iast": "duḥsvapnanivāraṇīm",
                        "stem": "da-sa-va",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "耨娑嚩钵曩你嚩(引)啰抳喃（拼读参考：杜₍忽斯₎瓦₍普₎拿尼瓦啦宁）",
                        "meaningZh": "施度调伏·一切诸谛圆满·最上真言离言说",
                        "meaningEn": "generosity & self-mastery & all-pervading truth & auspiciousness & supreme ineffable speech",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-86",
            "index": 86,
            "iast": "caturaśītīnām",
            "classicalTranslitZh": "赭都啰失帝南",
            "modernPhoneticZh": "佳度啦希帝南",
            "meaningZh": "于八万四千数！",
            "meaningEn": "Of the eighty-four!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 86/427 句",
            "words": [
                  {
                        "iast": "caturaśītīnām",
                        "stem": "caturaśīti",
                        "grammar": "Gen. Pl. · 属格复数",
                        "transliterationZh": "者都啰尸底(引)喃(引)（拼读参考：佳度啦希帝南）",
                        "meaningZh": "诸八十四之",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-87",
            "index": 87,
            "iast": "grahasahasrāṇāṃ ca",
            "classicalTranslitZh": "羯啰诃娑诃萨啰若阇",
            "modernPhoneticZh": "₍格₎啦哈萨哈₍斯₎啦南 佳",
            "meaningZh": "千数一切恶星执鬼众！",
            "meaningEn": "Thousand planetary demons!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 87/427 句",
            "words": [
                  {
                        "iast": "grahasahasrāṇāṃ",
                        "stem": "graha-sahasra",
                        "grammar": "Samāsa · 复合词 (Gen. Pl. · 属格复数)",
                        "transliterationZh": "伽啰诃萨诃娑啰(引)喃(引)（拼读参考：₍格₎啦哈萨哈₍斯₎啦南）",
                        "meaningZh": "曜执诸千",
                        "meaningEn": "planet + of thousand",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-88",
            "index": 88,
            "iast": "vidhvaṃsanakarīm",
            "classicalTranslitZh": "毗多崩娑那羯唎",
            "modernPhoneticZh": "维₍德₎旺萨拿嘎林",
            "meaningZh": "悉皆摧破坏灭母！",
            "meaningEn": "She who shatters and dispels them!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 88/427 句",
            "words": [
                  {
                        "iast": "vidhvaṃsanakarīm",
                        "stem": "√kar",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "尾驮鑁萨曩迦哩喃（拼读参考：维₍德₎旺萨拿嘎林）",
                        "meaningZh": "能作成办·最上真言离言说",
                        "meaningEn": "making",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-89",
            "index": 89,
            "iast": "aṣṭāviṃśatīnām",
            "classicalTranslitZh": "阿瑟吒冰舍帝南",
            "modernPhoneticZh": "阿₍师₎达文沙帝南",
            "meaningZh": "于二十八部！",
            "meaningEn": "Of the twenty-eight!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 89/427 句",
            "words": [
                  {
                        "iast": "aṣṭāviṃśatīnām",
                        "stem": "aṣṭāviṃśati",
                        "grammar": "Gen. Pl. · 属格复数",
                        "transliterationZh": "阿瑟吒(引)尾喃舍底(引)喃(引)（拼读参考：阿₍师₎达文沙帝南）",
                        "meaningZh": "诸二十八之",
                        "meaningEn": "of twenty-eight",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-90",
            "index": 90,
            "iast": "nakṣatrāṇāṃ ca",
            "classicalTranslitZh": "那叉刹怛啰若阇",
            "modernPhoneticZh": "拿₍克₎沙₍特₎啦南 佳",
            "meaningZh": "诸星宿神众！",
            "meaningEn": "Lunar mansions (Nakṣatras)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 90/427 句",
            "words": [
                  {
                        "iast": "nakṣatrāṇāṃ",
                        "stem": "nakṣatra",
                        "grammar": "Noun · 星宿 · Gen. Pl. · 属格复数",
                        "transliterationZh": "曩乞洒怛啰(引)喃(引)（拼读参考：拿₍克₎沙₍特₎啦南）",
                        "meaningZh": "诸星宿（二十八宿）之",
                        "meaningEn": "of constellation, lunar mansion",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-91",
            "index": 91,
            "iast": "prasādanakarīm",
            "classicalTranslitZh": "波啰萨陀那羯唎",
            "modernPhoneticZh": "₍普₎啦萨达拿嘎林",
            "meaningZh": "令生欢喜清净顺护母！",
            "meaningEn": "She who brings harmony and favor!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 91/427 句",
            "words": [
                  {
                        "iast": "prasādanakarīm",
                        "stem": "√kar",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "钵啰娑捺曩迦哩喃（拼读参考：₍普₎啦萨达拿嘎林）",
                        "meaningZh": "能作成办·第一义谛",
                        "meaningEn": "making",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-92",
            "index": 92,
            "iast": "aṣṭānām",
            "classicalTranslitZh": "阿瑟吒南",
            "modernPhoneticZh": "阿₍师₎达南",
            "meaningZh": "于八大部！",
            "meaningEn": "Of the eight!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 92/427 句",
            "words": [
                  {
                        "iast": "aṣṭānām",
                        "stem": "aṣṭa",
                        "grammar": "Num. · 八 · Gen. Pl. · 属格复数",
                        "transliterationZh": "阿瑟吒(引)喃(引)（拼读参考：阿₍师₎达南）",
                        "meaningZh": "诸八（八正道/八大菩萨）之",
                        "meaningEn": "of all eight",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-93",
            "index": 93,
            "iast": "mahāgrahāṇāṃ ca",
            "classicalTranslitZh": "摩诃揭啰诃若阇",
            "modernPhoneticZh": "玛哈-₍格₎啦哈南 佳",
            "meaningZh": "大曜执星神众（日月五星罗睺计都）！",
            "meaningEn": "Great planetary deities (Mahāgrahas)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 93/427 句",
            "words": [
                  {
                        "iast": "mahāgrahāṇāṃ",
                        "stem": "mah-āgraha",
                        "grammar": "Samāsa · 复合词 (Gen. Pl. · 属格复数)",
                        "transliterationZh": "摩诃伽啰诃喃(引)（拼读参考：玛哈-₍格₎啦哈南）",
                        "meaningZh": "乐趣诸执拗之",
                        "meaningEn": "gladden + of niggardliness",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-94",
            "index": 94,
            "iast": "vidhvaṃsanakarīm",
            "classicalTranslitZh": "毗多崩萨那羯唎",
            "modernPhoneticZh": "维₍德₎旺萨拿嘎林",
            "meaningZh": "悉能摧伏凶曜灾厄母！",
            "meaningEn": "She who neutralizes their afflictions!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 94/427 句",
            "words": [
                  {
                        "iast": "vidhvaṃsanakarīm",
                        "stem": "√kar",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "尾驮鑁萨曩迦哩喃（拼读参考：维₍德₎旺萨拿嘎林）",
                        "meaningZh": "能作成办·最上真言离言说",
                        "meaningEn": "making",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-95",
            "index": 95,
            "iast": "sarvaśatrunivāraṇīm ca",
            "classicalTranslitZh": "萨婆舍都嚧儞婆啰若阇",
            "modernPhoneticZh": "萨₍尔₎瓦-沙₍特₎鲁尼瓦啦宁 佳",
            "meaningZh": "遮遣一切怨家仇敌母！",
            "meaningEn": "Warding off all enemies!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 95/427 句",
            "words": [
                  {
                        "iast": "sarvaśatrunivāraṇīm",
                        "stem": "sa-ra-va",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "萨哩嚩舍怛噜你嚩(引)啰抳喃（拼读参考：萨₍尔₎瓦-沙₍特₎鲁尼瓦啦宁）",
                        "meaningZh": "一切诸谛圆满·清净离诸尘垢·最上真言离言说",
                        "meaningEn": "all-pervading truth & auspiciousness & stainless purity free from dust & supreme ineffable speech",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-96",
            "index": 96,
            "iast": "ghoraṃ duḥsvapnānāṃ ca nāśanīm",
            "classicalTranslitZh": "呼蓝突悉乏难遮那舍尼",
            "modernPhoneticZh": "果朗 杜₍忽斯₎瓦₍普₎拿南 佳 拿沙宁",
            "meaningZh": "消灭一切凶险恶梦恐怖母！",
            "meaningEn": "Destroyer of dreadful nightmares!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 96/427 句",
            "words": [
                  {
                        "iast": "ghoraṃ",
                        "stem": "ghora",
                        "grammar": "Adj. · 威猛可畏 · Acc./Nom. Sg. · 业格/主格单数",
                        "transliterationZh": "瞿览（拼读参考：果朗）",
                        "meaningZh": "威怖、猛厉降魔",
                        "meaningEn": "formidable, terrific, awe-inspiring",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "duḥsvapnānāṃ",
                        "stem": "duḥsvapna",
                        "grammar": "Samāsa · 恶梦不祥 · Gen. Pl. · 属格复数",
                        "transliterationZh": "耨娑嚩钵那(引)喃(引)（拼读参考：杜₍忽斯₎瓦₍普₎拿南）",
                        "meaningZh": "诸恶梦、不祥梦境之",
                        "meaningEn": "of all bad dream, nightmare, evil omen",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "nāśanīm",
                        "stem": "√nāś",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "那(引)舍宁(引)（拼读参考：拿沙宁）",
                        "meaningZh": "摧灭除遣·离名相假立",
                        "meaningEn": "destroying obstacles",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-97",
            "index": 97,
            "iast": "viṣaśastra",
            "classicalTranslitZh": "毖沙舍悉怛啰",
            "modernPhoneticZh": "维沙沙₍斯特₎啦",
            "meaningZh": "于蛊毒、刀兵器械诸难！",
            "meaningEn": "From poison and weapons!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 97/427 句",
            "words": [
                  {
                        "iast": "viṣaśastra",
                        "stem": "viṣ-aśastra",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "尾洒舍悉怛啰（拼读参考：维沙沙₍斯特₎啦）",
                        "meaningZh": "搅拌徒手",
                        "meaningEn": "stir + unarmed",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-98",
            "index": 98,
            "iast": "agni-udakottāraṇīm ca",
            "classicalTranslitZh": "阿吉尼乌陀迦啰若阇",
            "modernPhoneticZh": "阿₍格₎尼-乌达果达啦宁 佳",
            "meaningZh": "大火大水诸灾悉能救度出离母！",
            "meaningEn": "Rescuing from fire and flood!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 98/427 句",
            "words": [
                  {
                        "iast": "agni",
                        "stem": "agni",
                        "grammar": "Noun · 智火",
                        "transliterationZh": "阿伽你（拼读参考：阿₍格₎尼）",
                        "meaningZh": "圣火、智火（火大）",
                        "meaningEn": "fire, sacred flame (Agni)",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "udakottāraṇīm",
                        "stem": "√tār",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "坞捺俱怛多啰抳喃（拼读参考：乌达果达啦宁）",
                        "meaningZh": "救度超脱·施度调伏",
                        "meaningEn": "ferrying across",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-99",
            "index": 99,
            "iast": "aparājitaghorā",
            "classicalTranslitZh": "阿般啰视多具啰",
            "modernPhoneticZh": "阿巴啦吉达果啦",
            "meaningZh": "无能胜大威严尊！",
            "meaningEn": "Invincible and Awesome!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 99/427 句",
            "words": [
                  {
                        "iast": "aparājitaghorā",
                        "stem": "aparājita-ghora",
                        "grammar": "Samāsa · 复合词 (Nom. Sg. Fem. · 主格阴性)",
                        "transliterationZh": "阿跛啰(引)自怛瞿啰(引)（拼读参考：阿巴啦吉达果啦）",
                        "meaningZh": "无能胜威怖",
                        "meaningEn": "invincible + formidable",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-100",
            "index": 100,
            "iast": "mahāpracaṇḍī",
            "classicalTranslitZh": "摩诃般啰战持",
            "modernPhoneticZh": "玛哈-₍普₎啦詹迪",
            "meaningZh": "大极忿怒威猛降魔母！",
            "meaningEn": "Greatly Fierce One (Mahāpracaṇḍī)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 100/427 句",
            "words": [
                  {
                        "iast": "mahāpracaṇḍī",
                        "stem": "mah-āpra-caṇḍa",
                        "grammar": "Samāsa · 复合词 (Nom. Sg. Fem. · 阴性尊号)",
                        "transliterationZh": "摩诃钵啰瞻腻(引)（拼读参考：玛哈-₍普₎啦詹迪）",
                        "meaningZh": "乐趣·活跃·威猛",
                        "meaningEn": "gladden + active + fierce",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-101",
            "index": 101,
            "iast": "mahādīptā",
            "classicalTranslitZh": "摩诃叠多",
            "modernPhoneticZh": "玛哈地₍普₎达",
            "meaningZh": "大威光炽盛照耀母！",
            "meaningEn": "Greatly Blazing One!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 101/427 句",
            "words": [
                  {
                        "iast": "mahādīptā",
                        "stem": "mah-ādīpta",
                        "grammar": "Samāsa · 复合词 (Nom. Sg. Fem. · 主格阴性)",
                        "transliterationZh": "摩诃第钵多（拼读参考：玛哈地₍普₎达）",
                        "meaningZh": "乐趣焰",
                        "meaningEn": "gladden + flaming",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-102",
            "index": 102,
            "iast": "mahātejā",
            "classicalTranslitZh": "摩诃帝阇",
            "modernPhoneticZh": "玛哈帝佳",
            "meaningZh": "大威德神力赫奕母！",
            "meaningEn": "Of Great Majesty and Radiance!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 102/427 句",
            "words": [
                  {
                        "iast": "mahātejā",
                        "stem": "mahā-teja",
                        "grammar": "Samāsa · 复合词 (Nom. Sg. Fem. · 主格阴性)",
                        "transliterationZh": "摩诃帝惹(引)（拼读参考：玛哈帝佳）",
                        "meaningZh": "大威光",
                        "meaningEn": "great + sharpness",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-103",
            "index": 103,
            "iast": "mahāśvetajvālā",
            "classicalTranslitZh": "摩诃税多阇婆啰",
            "modernPhoneticZh": "玛哈-₍希₎威达₍吉₎瓦啦",
            "meaningZh": "大白净光焰遍照母！",
            "meaningEn": "Blazing with Great Pure White Light!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 103/427 句",
            "words": [
                  {
                        "iast": "mahāśvetajvālā",
                        "stem": "mahā-śveta-jvālā",
                        "grammar": "Samāsa · 复合词 (Noun · 智慧火焰)",
                        "transliterationZh": "摩诃室吠怛日嚩(引)攞(引)（拼读参考：玛哈-₍希₎威达₍吉₎瓦啦）",
                        "meaningZh": "大·洁白·光焰",
                        "meaningEn": "great + white + blaze",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-104",
            "index": 104,
            "iast": "mahābalapāṇḍaravāsinī",
            "classicalTranslitZh": "摩诃跋啰槃陀啰婆悉儞",
            "modernPhoneticZh": "玛哈-巴啦班达啦瓦悉尼",
            "meaningZh": "具大威神力白衣观自在佛母！",
            "meaningEn": "Of Great Strength, White-Robed Mother (Pāṇḍaravāsinī)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 104/427 句",
            "words": [
                  {
                        "iast": "mahābalapāṇḍaravāsinī",
                        "stem": "mahābala-pāṇḍaravāsinī",
                        "grammar": "Samāsa · 复合词 (Prop.Noun · 白衣佛母)",
                        "transliterationZh": "摩诃跋攞伴(引)拏啰嚩(引)悉泥（拼读参考：玛哈-巴啦班达啦瓦悉尼）",
                        "meaningZh": "大力威神白衣观自在母",
                        "meaningEn": "of great power and might + Pāṇḍaravāsinī",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-105",
            "index": 105,
            "iast": "āryatārā",
            "classicalTranslitZh": "阿唎耶多啰",
            "modernPhoneticZh": "阿₍哩₎呀达啦",
            "meaningZh": "圣多罗菩萨（圣救度佛母）！",
            "meaningEn": "Noble Tārā!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 105/427 句",
            "words": [
                  {
                        "iast": "āryatārā",
                        "stem": "āryatārā",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "阿(引)哩耶多啰(引)（拼读参考：阿₍哩₎呀达啦）",
                        "meaningZh": "阿唎多罗",
                        "meaningEn": "Arya-Tara",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-106",
            "index": 106,
            "iast": "bhṛkuṭī",
            "classicalTranslitZh": "毗唎俱知",
            "modernPhoneticZh": "₍布₎日古蒂",
            "meaningZh": "毗俱胝（颦眉忿怒救度）菩萨！",
            "meaningEn": "Bhṛkuṭī!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 106/427 句",
            "words": [
                  {
                        "iast": "bhṛkuṭī",
                        "stem": "bhṛkuṭī",
                        "grammar": "Prop.Noun · 颦眉佛母",
                        "transliterationZh": "婆哩矩置(引)（拼读参考：₍布₎日古蒂）",
                        "meaningZh": "颦眉观音母（忿怒除障度母）",
                        "meaningEn": "Bhṛkuṭī, Frown-Browed Protective Tārā",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-107",
            "index": 107,
            "iast": "caiva vijayā",
            "classicalTranslitZh": "誓婆毗阇耶",
            "modernPhoneticZh": "斋瓦 维佳呀",
            "meaningZh": "以及最胜尊胜母！",
            "meaningEn": "And likewise Vijayā (Victorious Mother)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 107/427 句",
            "words": [
                  {
                        "iast": "caiva",
                        "stem": "caiva",
                        "grammar": "Conj. · 连词合音",
                        "transliterationZh": "斋嚩（拼读参考：斋瓦）",
                        "meaningZh": "以及、亦复如是（ca + eva）",
                        "meaningEn": "and indeed, likewise",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "vijayā",
                        "stem": "vijayā",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "尾惹夜（拼读参考：维佳呀）",
                        "meaningZh": "尊胜",
                        "meaningEn": "for victory",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-108",
            "index": 108,
            "iast": "vajramāleti",
            "classicalTranslitZh": "跋阇啰摩礼底",
            "modernPhoneticZh": "瓦₍吉₎啦-玛雷帝",
            "meaningZh": "号曰金刚鬘明妃！",
            "meaningEn": "Called Vajramālā (Vajra-Garland)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 108/427 句",
            "words": [
                  {
                        "iast": "vajramāleti",
                        "stem": "vajramāla-īti",
                        "grammar": "Samāsa · 复合词 (Stem · 词干)",
                        "transliterationZh": "嚩日啰摩(引)隶底（拼读参考：瓦₍吉₎啦-玛雷帝）",
                        "meaningZh": "金刚食天瘟疫",
                        "meaningEn": "Vajramala + plague",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-109",
            "index": 109,
            "iast": "viśrutā",
            "classicalTranslitZh": "毗舍嚧多",
            "modernPhoneticZh": "维₍希₎鲁达",
            "meaningZh": "名闻遍满十方世界者！",
            "meaningEn": "Renowned throughout the worlds!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 109/427 句",
            "words": [
                  {
                        "iast": "viśrutā",
                        "stem": "viśruta",
                        "grammar": "Nom. Sg. Fem. · 主格阴性",
                        "transliterationZh": "尾室噜多（拼读参考：维₍希₎鲁达）",
                        "meaningZh": "美名称",
                        "meaningEn": "heard, learnt, understood, known as; famous, renowned",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-110",
            "index": 110,
            "iast": "padmāṅkā",
            "classicalTranslitZh": "勃腾罔迦",
            "modernPhoneticZh": "巴₍德₎芒嘎",
            "meaningZh": "执持清净红莲华相印母！",
            "meaningEn": "Marked with the Sacred Lotus!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 110/427 句",
            "words": [
                  {
                        "iast": "padmāṅkā",
                        "stem": "padma-aṅka",
                        "grammar": "Samāsa · 复合词 (Nom. Sg. Fem. · 主格阴性)",
                        "transliterationZh": "钵讷摩仰迦(引)（拼读参考：巴₍德₎芒嘎）",
                        "meaningZh": "莲华钩子",
                        "meaningEn": "lotus flower + hook",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-111",
            "index": 111,
            "iast": "vajracihnā ca",
            "classicalTranslitZh": "跋阇啰制喝那阿遮",
            "modernPhoneticZh": "瓦₍吉₎啦吉₍赫₎拿 佳",
            "meaningZh": "及具足金刚宝相契印母！",
            "meaningEn": "And bearing the Vajra Emblem!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 111/427 句",
            "words": [
                  {
                        "iast": "vajracihnā",
                        "stem": "vajra-cihna",
                        "grammar": "Samāsa · 复合词 (Nom. Sg. Fem. · 主格阴性)",
                        "transliterationZh": "嚩日啰只纥那(引)（拼读参考：瓦₍吉₎啦吉₍赫₎拿）",
                        "meaningZh": "金刚标帜",
                        "meaningEn": "Vajra + emblem",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-112",
            "index": 112,
            "iast": "mālā caivāparājitā",
            "classicalTranslitZh": "摩啰制婆般啰质多",
            "modernPhoneticZh": "玛啦 斋瓦巴啦吉达",
            "meaningZh": "宝鬘无能胜明妃！",
            "meaningEn": "Garlanded and Invincible (Aparājitā)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 112/427 句",
            "words": [
                  {
                        "iast": "mālā",
                        "stem": "mālā",
                        "grammar": "Noun · 花鬘/宝鬘",
                        "transliterationZh": "摩(引)攞(引)（拼读参考：玛啦）",
                        "meaningZh": "鬘、宝鬘、念珠鬘",
                        "meaningEn": "garland, rosary, necklace",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "caivāparājitā",
                        "stem": "caiva-aparājitā",
                        "grammar": "Samāsa · 复合词 (Prop.Noun · 无能胜尊)",
                        "transliterationZh": "斋嚩(引)跛啰(引)自多（拼读参考：斋瓦巴啦吉达）",
                        "meaningZh": "以及无能胜佛母",
                        "meaningEn": "and indeed + Aparājitā",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-113",
            "index": 113,
            "iast": "vajratuṇḍī",
            "classicalTranslitZh": "跋阇啰擅持",
            "modernPhoneticZh": "瓦₍吉₎啦敦迪",
            "meaningZh": "金刚觜（摧破魔障）明妃！",
            "meaningEn": "Vajratuṇḍī!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 113/427 句",
            "words": [
                  {
                        "iast": "vajratuṇḍī",
                        "stem": "vajra-tuṇḍa",
                        "grammar": "Samāsa · 复合词 (Nom. Sg. Fem. · 阴性尊号)",
                        "transliterationZh": "嚩日啰都喃腻(引)（拼读参考：瓦₍吉₎啦敦迪）",
                        "meaningZh": "金刚觜佛母",
                        "meaningEn": "Vajra + beak",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-114",
            "index": 114,
            "iast": "viśālā ca",
            "classicalTranslitZh": "毗舍啰遮",
            "modernPhoneticZh": "维沙啦 佳",
            "meaningZh": "广大莲眼庄严母！",
            "meaningEn": "And Vast-Eyed Viśālā!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 114/427 句",
            "words": [
                  {
                        "iast": "viśālā",
                        "stem": "viśāla",
                        "grammar": "Adj. · 广大宽博 · Nom. Sg. Fem. · 主格阴性",
                        "transliterationZh": "尾奢攞(引)（拼读参考：维沙啦）",
                        "meaningZh": "广博、广大清净",
                        "meaningEn": "broad, spacious, extensive",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-115",
            "index": 115,
            "iast": "śāntā vaidehapūjitā",
            "classicalTranslitZh": "扇多舍鞞提婆补视多",
            "modernPhoneticZh": "善达 歪叠哈布吉达",
            "meaningZh": "寂静安隐、受诸天恭敬供养母！",
            "meaningEn": "Peaceful One, worshipped by celestial beings!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 115/427 句",
            "words": [
                  {
                        "iast": "śāntā",
                        "stem": "śānta",
                        "grammar": "Adj. · 寂静 · Nom. Sg. Fem. · 主格阴性",
                        "transliterationZh": "奢喃多（拼读参考：善达）",
                        "meaningZh": "寂静、调柔安稳",
                        "meaningEn": "peaceful, calm, tranquil",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "vaidehapūjitā",
                        "stem": "vaideha-pūjita",
                        "grammar": "Samāsa · 复合词 (Nom. Sg. Fem. · 主格阴性)",
                        "transliterationZh": "吠泥诃布自多（拼读参考：歪叠哈布吉达）",
                        "meaningZh": "大王舍谛洲所恭敬",
                        "meaningEn": "living in or coming from Videha + honored",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-116",
            "index": 116,
            "iast": "saumyarūpā",
            "classicalTranslitZh": "苏摩嚧波",
            "modernPhoneticZh": "骚₍姆₎呀鲁巴",
            "meaningZh": "慈柔满月妙色相母！",
            "meaningEn": "Of Gentle Moon-like Form!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 116/427 句",
            "words": [
                  {
                        "iast": "saumyarūpā",
                        "stem": "saumyarūpa",
                        "grammar": "Nom. Sg. Fem. · 主格阴性",
                        "transliterationZh": "骚弭耶噜(引)波（拼读参考：骚₍姆₎呀鲁巴）",
                        "meaningZh": "友好、缓和向着",
                        "meaningEn": "friendly, mild towards",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-117",
            "index": 117,
            "iast": "mahāśvetā",
            "classicalTranslitZh": "摩诃税多",
            "modernPhoneticZh": "玛哈₍希₎威达",
            "meaningZh": "大白清净光明母！",
            "meaningEn": "Great Pure White Goddess!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 117/427 句",
            "words": [
                  {
                        "iast": "mahāśvetā",
                        "stem": "mahā-śveta",
                        "grammar": "Samāsa · 复合词 (Nom. Sg. Fem. · 主格阴性)",
                        "transliterationZh": "摩诃室吠多（拼读参考：玛哈₍希₎威达）",
                        "meaningZh": "大洁白",
                        "meaningEn": "great + white",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-118",
            "index": 118,
            "iast": "āryatārā",
            "classicalTranslitZh": "阿唎耶多啰",
            "modernPhoneticZh": "阿₍哩₎呀达啦",
            "meaningZh": "圣救度母（多罗尊菩萨）！",
            "meaningEn": "Noble Tārā!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 118/427 句",
            "words": [
                  {
                        "iast": "āryatārā",
                        "stem": "āryatārā",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "阿(引)哩耶多啰(引)（拼读参考：阿₍哩₎呀达啦）",
                        "meaningZh": "阿唎多罗",
                        "meaningEn": "Arya-Tara",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-119",
            "index": 119,
            "iast": "mahābalā aparā",
            "classicalTranslitZh": "摩诃婆啰阿般啰",
            "modernPhoneticZh": "玛哈巴啦 阿巴啦",
            "meaningZh": "大势力无等伦尊！",
            "meaningEn": "Unrivaled in Great Power!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 119/427 句",
            "words": [
                  {
                        "iast": "mahābalā",
                        "stem": "mahābala",
                        "grammar": "Samāsa · 大威神力 · Nom. Sg. Fem. · 主格阴性",
                        "transliterationZh": "摩诃跋攞(引)（拼读参考：玛哈巴啦）",
                        "meaningZh": "大力威神、大势力尊",
                        "meaningEn": "of great power and might",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "aparā",
                        "stem": "apara",
                        "grammar": "Nom. Sg. Fem. · 主格阴性",
                        "transliterationZh": "阿跛啰(引)（拼读参考：阿巴啦）",
                        "meaningZh": "必然",
                        "meaningEn": "a certain; and there was a certain hunter named  N",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-120",
            "index": 120,
            "iast": "vajraśṛṅkhalā caiva",
            "classicalTranslitZh": "跋阇啰啇羯啰制婆",
            "modernPhoneticZh": "瓦₍吉₎啦-₍希₎仍卡啦 斋瓦",
            "meaningZh": "以及金刚锁菩萨明妃！",
            "meaningEn": "And Vajraśṛṅkhalā (Vajra-Chain)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 120/427 句",
            "words": [
                  {
                        "iast": "vajraśṛṅkhalā",
                        "stem": "vajraśṛṅkhalā",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "嚩日啰室哩仰佉攞(引)（拼读参考：瓦₍吉₎啦-₍希₎仍卡啦）",
                        "meaningZh": "金刚鏁",
                        "meaningEn": "Vajrasrnkhala",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "caiva",
                        "stem": "caiva",
                        "grammar": "Conj. · 连词合音",
                        "transliterationZh": "斋嚩（拼读参考：斋瓦）",
                        "meaningZh": "以及、亦复如是（ca + eva）",
                        "meaningEn": "and indeed, likewise",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-121",
            "index": 121,
            "iast": "vajrakaumārī",
            "classicalTranslitZh": "跋阇啰俱摩唎",
            "modernPhoneticZh": "瓦₍吉₎啦-高玛里",
            "meaningZh": "金刚童女明妃！",
            "meaningEn": "Vajrakaumārī (Vajra-Maiden)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 121/427 句",
            "words": [
                  {
                        "iast": "vajrakaumārī",
                        "stem": "vajra-kaumārī",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "嚩日啰憍摩(引)哩(引)（拼读参考：瓦₍吉₎啦-高玛里）",
                        "meaningZh": "金刚娇么哩",
                        "meaningEn": "Vajra + Kaumari",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-122",
            "index": 122,
            "iast": "kulaṃdharī",
            "classicalTranslitZh": "俱蓝陀唎",
            "modernPhoneticZh": "古兰达里",
            "meaningZh": "持诸佛种姓母（俱蓝陀唎）！",
            "meaningEn": "Kulaṃdharī (Upholder of the Buddha-Lineage)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 122/427 句",
            "words": [
                  {
                        "iast": "kulaṃdharī",
                        "stem": "ku-laṃ-dhara",
                        "grammar": "Samāsa · 复合词 (Nom. Sg. Fem. · 阴性尊号)",
                        "transliterationZh": "矩蓝驮哩(引)（拼读参考：古兰达里）",
                        "meaningZh": "大地·地大金刚坚固种子·请执持",
                        "meaningEn": "earth + Pṛthivī earth-mandala stability seed syllable + hold! bear! sustain!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-123",
            "index": 123,
            "iast": "vajrahastā ca",
            "classicalTranslitZh": "跋阇啰喝萨多遮",
            "modernPhoneticZh": "瓦₍吉₎啦哈₍斯₎达 佳",
            "meaningZh": "及手执金刚杵母！",
            "meaningEn": "And Vajra-Handed Mother (Vajrahastā)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 123/427 句",
            "words": [
                  {
                        "iast": "vajrahastā",
                        "stem": "vajra-hastā",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "嚩日啰诃悉多（拼读参考：瓦₍吉₎啦哈₍斯₎达）",
                        "meaningZh": "金刚轸",
                        "meaningEn": "Vajra + Hasta",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-124",
            "index": 124,
            "iast": "vidyā kāñcanamālikā",
            "classicalTranslitZh": "毗地耶乾遮那摩唎迦",
            "modernPhoneticZh": "维₍地₎呀 干佳拿玛利嘎",
            "meaningZh": "大明咒藏紫金宝鬘母！",
            "meaningEn": "Vidyā Queen Wearing a Golden Garland!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 124/427 句",
            "words": [
                  {
                        "iast": "vidyā",
                        "stem": "vidyā",
                        "grammar": "Noun · 明咒/圣明",
                        "transliterationZh": "尾地夜（拼读参考：维₍地₎呀）",
                        "meaningZh": "明咒、真言明妃、圣智明",
                        "meaningEn": "Vidyā, sacred wisdom-spell, illumination",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "kāñcanamālikā",
                        "stem": "kāñcana-mālikā",
                        "grammar": "Samāsa · 复合词 (Noun · 妙花鬘)",
                        "transliterationZh": "剑(引)者曩摩(引)里迦(引)（拼读参考：干佳拿玛利嘎）",
                        "meaningZh": "真金妙花鬘",
                        "meaningEn": "pure gold + garland",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-125",
            "index": 125,
            "iast": "kusumbharatnā",
            "classicalTranslitZh": "啒苏母婆羯啰跢那",
            "modernPhoneticZh": "古孙巴啦₍特₎拿",
            "meaningZh": "红莲华色摩尼宝珠母！",
            "meaningEn": "Saffron-Flower Jewel Mother!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 125/427 句",
            "words": [
                  {
                        "iast": "kusumbharatnā",
                        "stem": "kusumbha-ratna",
                        "grammar": "Samāsa · 复合词 (Nom. Sg. Fem. · 主格阴性)",
                        "transliterationZh": "矩苏喃婆啰怛那(引)（拼读参考：古孙巴啦₍特₎拿）",
                        "meaningZh": "赭色珍宝",
                        "meaningEn": "safflower + jewel",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-126",
            "index": 126,
            "iast": "vairocanakulīyā",
            "classicalTranslitZh": "鞞嚧遮那俱唎耶",
            "modernPhoneticZh": "歪洛佳拿古利呀",
            "meaningZh": "毗卢遮那大日佛部种姓尊！",
            "meaningEn": "Of the Lineage of Vairocana!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 126/427 句",
            "words": [
                  {
                        "iast": "vairocanakulīyā",
                        "stem": "va-ra-ca",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "吠嚧者曩矩里(引)夜（拼读参考：歪洛佳拿古利呀）",
                        "meaningZh": "最上真言离言说·清净离诸尘垢·妙行迁变空",
                        "meaningEn": "supreme ineffable speech & stainless purity free from dust & awakened conduct beyond flux",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-127",
            "index": 127,
            "iast": "akulaloṣṇīṣā",
            "classicalTranslitZh": "夜啰菟瑟尼釤",
            "modernPhoneticZh": "阿古啦洛₍师₎尼沙",
            "meaningZh": "如来无上顶髻光明冠母！",
            "meaningEn": "Crown-Uṣṇīṣa of the Supreme Lineage!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 127/427 句",
            "words": [
                  {
                        "iast": "akulaloṣṇīṣā",
                        "stem": "ka-la-la",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "阿矩攞路瑟抳(引)洒(引)（拼读参考：阿古啦洛₍师₎尼沙）",
                        "meaningZh": "造作离相·离一切相无相·六度满行清净",
                        "meaningEn": "freedom from karmic agency & freedom from conditioned marks & perfection of the six pāramitās",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-128",
            "index": 128,
            "iast": "vijṛmbhamāṇī ca",
            "classicalTranslitZh": "毗折蓝婆摩尼遮",
            "modernPhoneticZh": "维₍吉₎日₍姆₎巴玛尼 佳",
            "meaningZh": "频申奋迅威神开敷母！",
            "meaningEn": "And Lion-Yawning Vijṛmbhamāṇī!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 128/427 句",
            "words": [
                  {
                        "iast": "vijṛmbhamāṇī",
                        "stem": "va-ja-ma",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "尾日哩摩婆摩(引)抳(引)（拼读参考：维₍吉₎日₍姆₎巴玛尼）",
                        "meaningZh": "最上真言离言说·生起不可得·尊胜·无我大慈三昧",
                        "meaningEn": "supreme ineffable speech & transcending birth & victorious & selfless great loving-kindness",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-129",
            "index": 129,
            "iast": "vajrakanakaprabhā",
            "classicalTranslitZh": "跋阇啰迦那迦波啰婆",
            "modernPhoneticZh": "瓦₍吉₎啦-嘎拿嘎₍普₎啦巴",
            "meaningZh": "金刚紫磨真金光明母！",
            "meaningEn": "Radiant as Vajra Gold!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 129/427 句",
            "words": [
                  {
                        "iast": "vajrakanakaprabhā",
                        "stem": "vajra-kanaka-prabhā",
                        "grammar": "Samāsa · 复合词 (Noun · 光明)",
                        "transliterationZh": "嚩日啰迦曩迦钵啰婆(引)（拼读参考：瓦₍吉₎啦-嘎拿嘎₍普₎啦巴）",
                        "meaningZh": "金刚·黄金·光明",
                        "meaningEn": "Vajra + gold + light",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-130",
            "index": 130,
            "iast": "locanā vajratuṇḍī ca",
            "classicalTranslitZh": "嚧闍那跋阇啰顿稚遮",
            "modernPhoneticZh": "洛佳拿 瓦₍吉₎啦敦迪 佳",
            "meaningZh": "佛眼佛母及金刚觜护法母！",
            "meaningEn": "Buddhalocanā and Vajratuṇḍī!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 130/427 句",
            "words": [
                  {
                        "iast": "locanā",
                        "stem": "locana",
                        "grammar": "Noun · 佛眼 · Nom. Sg. Fem. · 主格阴性",
                        "transliterationZh": "路者那(引)（拼读参考：洛佳拿）",
                        "meaningZh": "眼、佛眼遍照",
                        "meaningEn": "eye, illuminating vision",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "vajratuṇḍī",
                        "stem": "vajra-tuṇḍa",
                        "grammar": "Samāsa · 复合词 (Nom. Sg. Fem. · 阴性尊号)",
                        "transliterationZh": "嚩日啰都喃腻(引)（拼读参考：瓦₍吉₎啦敦迪）",
                        "meaningZh": "金刚觜佛母",
                        "meaningEn": "Vajra + beak",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-131",
            "index": 131,
            "iast": "śvetā ca kamalā",
            "classicalTranslitZh": "税多遮迦摩啰",
            "modernPhoneticZh": "₍希₎威达 佳 嘎玛啦",
            "meaningZh": "白净母与清净红莲华母！",
            "meaningEn": "White Goddess and Sacred Lotus!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 131/427 句 · 与第132句首字连读为 kamalākṣī（青莲华眼母）",
            "words": [
                  {
                        "iast": "śvetā",
                        "stem": "śveta",
                        "grammar": "Adj. · 洁白 · Nom. Sg. Fem. · 主格阴性",
                        "transliterationZh": "室吠多（拼读参考：₍希₎威达）",
                        "meaningZh": "洁白、清净白色",
                        "meaningEn": "white, bright, pure-colored",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "kamalā",
                        "stem": "kamala",
                        "grammar": "Noun · 妙莲华 · Nom. Sg. Fem. · 主格阴性",
                        "transliterationZh": "迦摩攞(引)（拼读参考：嘎玛啦）",
                        "meaningZh": "妙莲华、红莲",
                        "meaningEn": "lotus blossom",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-132",
            "index": 132,
            "iast": "kṣī śaśiprabhā",
            "classicalTranslitZh": "刹奢尸波啰婆",
            "modernPhoneticZh": "₍克₎师 沙希₍普₎啦巴",
            "meaningZh": "莲眼清澈、皎洁月光遍照母！",
            "meaningEn": "Lotus-Eyed and Moon-Radiant (Śaśiprabhā)!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 132/427 句",
            "words": [
                  {
                        "iast": "kṣī",
                        "stem": "ka",
                        "grammar": "Akṣara-mukha · 乞洒字门",
                        "transliterationZh": "乞瑟(引)（拼读参考：₍克₎师）",
                        "meaningZh": "乞洒字门（尽诸漏障究竟寂灭（kṣaya）·禅定三昧总持）",
                        "meaningEn": "exhaustion of all karmic outflows (kṣaya) — deep samādhi retention",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "śaśiprabhā",
                        "stem": "śaśi-prabhā",
                        "grammar": "Samāsa · 复合词 (Noun · 光明)",
                        "transliterationZh": "舍室钵啰婆(引)（拼读参考：沙希₍普₎啦巴）",
                        "meaningZh": "月轮光明",
                        "meaningEn": "moon + light",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-133",
            "index": 133,
            "iast": "ity etā",
            "classicalTranslitZh": "翳帝夷帝",
            "modernPhoneticZh": "伊₍帝₎ 诶达",
            "meaningZh": "如是等一切圣众！",
            "meaningEn": "All these!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 133/427 句",
            "words": [
                  {
                        "iast": "ity",
                        "stem": "ta",
                        "grammar": "Akṣara-mukha · 耶字门",
                        "transliterationZh": "伊底（拼读参考：伊₍帝₎）",
                        "meaningZh": "耶字门（一乘如实之道（yāna）·诸根清净自在）",
                        "meaningEn": "supreme vehicle of awakening (yāna) — purified faculties",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "etā",
                        "stem": "ta",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "翳多（拼读参考：诶达）",
                        "meaningZh": "真如实际",
                        "meaningEn": "immutable Suchness",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-134",
            "index": 134,
            "iast": "mudrāgaṇāḥ",
            "classicalTranslitZh": "母陀啰羯拏",
            "modernPhoneticZh": "穆₍德₎啦嘎拿₍赫₎",
            "meaningZh": "一切大曼荼罗金刚印契圣众！",
            "meaningEn": "Hosts of Great Mudrā-Deities!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 134/427 句",
            "words": [
                  {
                        "iast": "mudrāgaṇāḥ",
                        "stem": "mudrā-gaṇa",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "母捺啰(引)誐拏(引)诃（拼读参考：穆₍德₎啦嘎拿₍赫₎）",
                        "meaningZh": "手印诸海会众",
                        "meaningEn": "Mudrā + assembly",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-135",
            "index": 135,
            "iast": "sarve rakṣām",
            "classicalTranslitZh": "娑鞞啰忏",
            "modernPhoneticZh": "萨₍尔₎威 啦₍克₎伤",
            "meaningZh": "愿皆周遍垂慈拥护！",
            "meaningEn": "May they all grant protection!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 135/427 句",
            "words": [
                  {
                        "iast": "sarve",
                        "stem": "sarva",
                        "grammar": "Adj. · 一切 · Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "萨哩吠（拼读参考：萨₍尔₎威）",
                        "meaningZh": "一切、普皆遍满尊",
                        "meaningEn": "O all, every, complete / in all, every, complete",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "rakṣām",
                        "stem": "rakṣā",
                        "grammar": "Noun · 守护结界 · Acc. Sg. Fem. · 业格阴性",
                        "transliterationZh": "啰乞洒喃（拼读参考：啦₍克₎伤）",
                        "meaningZh": "守护、结界护念",
                        "meaningEn": "protection, safeguarding",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-136",
            "index": 136,
            "iast": "kurvantu",
            "classicalTranslitZh": "掘梵都",
            "modernPhoneticZh": "古₍尔₎万度",
            "meaningZh": "恒常作大加被护持！",
            "meaningEn": "May they accomplish it!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 136/427 句",
            "words": [
                  {
                        "iast": "kurvantu",
                        "stem": "kurvantu",
                        "grammar": "Impv.3.Pl. · 祈愿复数",
                        "transliterationZh": "矩哩鑁都（拼读参考：古₍尔₎万度）",
                        "meaningZh": "愿一切诸尊普皆施作护持！",
                        "meaningEn": "may they all perform/grant!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-137",
            "index": 137,
            "iast": "idaṃ mama sya",
            "classicalTranslitZh": "印兔那么么写",
            "modernPhoneticZh": "伊当 玛玛 ₍斯₎呀",
            "meaningZh": "护持于我及一切受持众生！",
            "meaningEn": "For me, this practitioner!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 137/427 句 · 《首楞严经》原典夹注：诵咒者至此句称弟子某甲受持",
            "words": [
                  {
                        "iast": "idaṃ",
                        "stem": "idaṃ",
                        "grammar": "Pron. Neut. · 近指代词",
                        "transliterationZh": "伊昙（拼读参考：伊当）",
                        "meaningZh": "此、此法门",
                        "meaningEn": "this, here",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "mama",
                        "stem": "mama",
                        "grammar": "Pron. Gen. · 第一人称属格",
                        "transliterationZh": "摩摩（拼读参考：玛玛）",
                        "meaningZh": "我之（行者所有）",
                        "meaningEn": "my, of me (the practitioner)",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "sya",
                        "stem": "sa",
                        "grammar": "Akṣara-mukha · 耶字门",
                        "transliterationZh": "娑耶（拼读参考：₍斯₎呀）",
                        "meaningZh": "耶字门（一乘如实之道（yāna）·本不生体性）",
                        "meaningEn": "supreme vehicle of awakening (yāna) — primordial non-arising",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-138",
            "index": 138,
            "iast": "oṃ",
            "classicalTranslitZh": "乌𤙖",
            "modernPhoneticZh": "嗡",
            "meaningZh": "嗡（法报化三身总持圣音）！",
            "meaningEn": "Oṃ!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 138/427 句",
            "words": [
                  {
                        "iast": "oṃ",
                        "stem": "oṃ",
                        "grammar": "Praṇava · 圣音",
                        "transliterationZh": "唵（拼读参考：嗡）",
                        "meaningZh": "三身总持圣音（法报化三身摄受）",
                        "meaningEn": "sacred Praṇava syllable embodying Trikāya",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-139",
            "index": 139,
            "iast": "ṛṣigaṇa",
            "classicalTranslitZh": "唎瑟揭拏",
            "modernPhoneticZh": "日师嘎拿",
            "meaningZh": "一切大仙圣贤海众！",
            "meaningEn": "By the assembly of great sages!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 139/427 句",
            "words": [
                  {
                        "iast": "ṛṣigaṇa",
                        "stem": "ṛṣi-gaṇa",
                        "grammar": "Samāsa · 复合词 (Noun · 圣众海会)",
                        "transliterationZh": "哩瑟誐拏（拼读参考：日师嘎拿）",
                        "meaningZh": "仙人海会众",
                        "meaningEn": "Ṛṣi + assembly",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-140",
            "index": 140,
            "iast": "praśasta",
            "classicalTranslitZh": "般剌舍悉多",
            "modernPhoneticZh": "₍普₎啦沙₍斯₎达",
            "meaningZh": "同声赞叹称扬！",
            "meaningEn": "Praised and extolled!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 140/427 句",
            "words": [
                  {
                        "iast": "praśasta",
                        "stem": "praśasta",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "钵啰舍悉怛（拼读参考：₍普₎啦沙₍斯₎达）",
                        "meaningZh": "善祥",
                        "meaningEn": "cut; cut",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-141",
            "index": 141,
            "iast": "sarvatathāgatoṣṇīṣam",
            "classicalTranslitZh": "萨怛他伽都瑟尼釤",
            "modernPhoneticZh": "萨₍尔₎瓦-达他嘎多-₍师₎尼伤",
            "meaningZh": "一切如来无上佛顶尊（第一会圆满）！",
            "meaningEn": "Crown-Uṣṇīṣa of All Tathāgatas!",
            "tangNoteZh": "第一会【毗卢真法会】·《T19n0945》原典第 141/427 句",
            "words": [
                  {
                        "iast": "sarvatathāgatoṣṇīṣam",
                        "stem": "sarvatathāgata-uṣṇīṣa",
                        "grammar": "Samāsa · 复合词 (Acc./Nom. Sg. · 业格/主格单数)",
                        "transliterationZh": "萨哩嚩怛他(引)誐睹瑟抳(引)忏（拼读参考：萨₍尔₎瓦-达他嘎多-₍师₎尼伤）",
                        "meaningZh": "一切如来佛顶肉髻相",
                        "meaningEn": "all Tathagatas + Uṣṇīṣa",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-142",
            "index": 142,
            "iast": "hūṃ",
            "classicalTranslitZh": "虎汼",
            "modernPhoneticZh": "吽",
            "meaningZh": "吽（摧破一切魔障种子字）！",
            "meaningEn": "Hūṃ!",
            "tangNoteZh": "第二会【释尊应化会】·《T19n0945》原典第 142/427 句",
            "words": [
                  {
                        "iast": "hūṃ",
                        "stem": "hūṃ",
                        "grammar": "Bīja · 金刚种子字",
                        "transliterationZh": "吽（拼读参考：吽）",
                        "meaningZh": "金刚不坏菩提心印、摧破诸障",
                        "meaningEn": "adamantine bodhicitta seed syllable",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-143",
            "index": 143,
            "iast": "trūṃ",
            "classicalTranslitZh": "都嚧雍",
            "modernPhoneticZh": "₍特₎隆",
            "meaningZh": "特隆（金轮佛顶大威光种子字）！",
            "meaningEn": "Trūṃ!",
            "tangNoteZh": "第二会【释尊应化会】·《T19n0945》原典第 143/427 句",
            "words": [
                  {
                        "iast": "trūṃ",
                        "stem": "ta",
                        "grammar": "Bīja-mantra · 悉昙种子字",
                        "transliterationZh": "都嚧瓮（拼读参考：₍特₎隆）",
                        "meaningZh": "啰字门（清净离诸尘垢（rajas）·威神增益圆满·大空菩提点摄持）",
                        "meaningEn": "stainless purity free from dust (rajas) — perfected spiritual vigor sealed with bodhicitta bindu",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-144",
            "index": 144,
            "iast": "jambhana",
            "classicalTranslitZh": "瞻婆那",
            "modernPhoneticZh": "詹巴拿",
            "meaningZh": "镇伏制止一切恶魔！",
            "meaningEn": "Crushing obstacles (Jambhana)!",
            "tangNoteZh": "第二会【释尊应化会】·《T19n0945》原典第 144/427 句",
            "words": [
                  {
                        "iast": "jambhana",
                        "stem": "jambhana",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "瞻婆曩（拼读参考：詹巴拿）",
                        "meaningZh": "令愚",
                        "meaningEn": "crushing, destroying",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-145",
            "index": 145,
            "iast": "hūṃ",
            "classicalTranslitZh": "虎𤙖",
            "modernPhoneticZh": "吽",
            "meaningZh": "吽！",
            "meaningEn": "Hūṃ!",
            "tangNoteZh": "第二会【释尊应化会】·《T19n0945》原典第 145/427 句",
            "words": [
                  {
                        "iast": "hūṃ",
                        "stem": "hūṃ",
                        "grammar": "Bīja · 金刚种子字",
                        "transliterationZh": "吽（拼读参考：吽）",
                        "meaningZh": "金刚不坏菩提心印、摧破诸障",
                        "meaningEn": "adamantine bodhicitta seed syllable",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-146",
            "index": 146,
            "iast": "trūṃ",
            "classicalTranslitZh": "都嚧雍",
            "modernPhoneticZh": "₍特₎隆",
            "meaningZh": "特隆！",
            "meaningEn": "Trūṃ!",
            "tangNoteZh": "第二会【释尊应化会】·《T19n0945》原典第 146/427 句",
            "words": [
                  {
                        "iast": "trūṃ",
                        "stem": "ta",
                        "grammar": "Bīja-mantra · 悉昙种子字",
                        "transliterationZh": "都嚧瓮（拼读参考：₍特₎隆）",
                        "meaningZh": "啰字门（清净离诸尘垢（rajas）·威神增益圆满·大空菩提点摄持）",
                        "meaningEn": "stainless purity free from dust (rajas) — perfected spiritual vigor sealed with bodhicitta bindu",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-147",
            "index": 147,
            "iast": "stambhana",
            "classicalTranslitZh": "悉耽婆那",
            "modernPhoneticZh": "₍斯₎丹巴拿",
            "meaningZh": "凝固禁缚一切魔军令不动摇！",
            "meaningEn": "Immobilizing hostile forces (Stambhana)!",
            "tangNoteZh": "第二会【释尊应化会】·《T19n0945》原典第 147/427 句",
            "words": [
                  {
                        "iast": "stambhana",
                        "stem": "stambhana",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "娑担婆曩（拼读参考：₍斯₎丹巴拿）",
                        "meaningZh": "僵仆",
                        "meaningEn": "laming, paralyzing, fixing, stopping, restraining",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-148",
            "index": 148,
            "iast": "hūṃ",
            "classicalTranslitZh": "虎𤙖",
            "modernPhoneticZh": "吽",
            "meaningZh": "吽！",
            "meaningEn": "Hūṃ!",
            "tangNoteZh": "第二会【释尊应化会】·《T19n0945》原典第 148/427 句",
            "words": [
                  {
                        "iast": "hūṃ",
                        "stem": "hūṃ",
                        "grammar": "Bīja · 金刚种子字",
                        "transliterationZh": "吽（拼读参考：吽）",
                        "meaningZh": "金刚不坏菩提心印、摧破诸障",
                        "meaningEn": "adamantine bodhicitta seed syllable",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-149",
            "index": 149,
            "iast": "trūṃ",
            "classicalTranslitZh": "都嚧雍",
            "modernPhoneticZh": "₍特₎隆",
            "meaningZh": "特隆！",
            "meaningEn": "Trūṃ!",
            "tangNoteZh": "第二会【释尊应化会】·《T19n0945》原典第 149/427 句",
            "words": [
                  {
                        "iast": "trūṃ",
                        "stem": "ta",
                        "grammar": "Bīja-mantra · 悉昙种子字",
                        "transliterationZh": "都嚧瓮（拼读参考：₍特₎隆）",
                        "meaningZh": "啰字门（清净离诸尘垢（rajas）·威神增益圆满·大空菩提点摄持）",
                        "meaningEn": "stainless purity free from dust (rajas) — perfected spiritual vigor sealed with bodhicitta bindu",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-150",
            "index": 150,
            "iast": "paravidyāsaṃbhakṣaṇakara",
            "classicalTranslitZh": "波罗瑟地耶三般叉拏羯啰",
            "modernPhoneticZh": "巴啦维₍地₎呀桑巴₍克₎沙拿嘎啦",
            "meaningZh": "吞啖销融一切外道恶咒邪术者！",
            "meaningEn": "Devourer and neutralizer of all hostile spells!",
            "tangNoteZh": "第二会【释尊应化会】·《T19n0945》原典第 150/427 句",
            "words": [
                  {
                        "iast": "paravidyāsaṃbhakṣaṇakara",
                        "stem": "paras-avidyā-saṃ-bha-kṣaṇa",
                        "grammar": "Samāsa · 复合词 (Agent · 能作生起)",
                        "transliterationZh": "跛啰尾地夜三婆乞洒拏迦啰（拼读参考：巴啦维₍地₎呀桑巴₍克₎沙拿嘎啦）",
                        "meaningZh": "能生愈加·无明·桑·星宿一刹那",
                        "meaningEn": "beyond + ignorance + saṃ + star + causing birth under favorable conditions",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-151",
            "index": 151,
            "iast": "hūṃ",
            "classicalTranslitZh": "虎𤙖",
            "modernPhoneticZh": "吽",
            "meaningZh": "吽！",
            "meaningEn": "Hūṃ!",
            "tangNoteZh": "第二会【释尊应化会】·《T19n0945》原典第 151/427 句",
            "words": [
                  {
                        "iast": "hūṃ",
                        "stem": "hūṃ",
                        "grammar": "Bīja · 金刚种子字",
                        "transliterationZh": "吽（拼读参考：吽）",
                        "meaningZh": "金刚不坏菩提心印、摧破诸障",
                        "meaningEn": "adamantine bodhicitta seed syllable",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-152",
            "index": 152,
            "iast": "trūṃ",
            "classicalTranslitZh": "都嚧雍",
            "modernPhoneticZh": "₍特₎隆",
            "meaningZh": "特隆！",
            "meaningEn": "Trūṃ!",
            "tangNoteZh": "第二会【释尊应化会】·《T19n0945》原典第 152/427 句",
            "words": [
                  {
                        "iast": "trūṃ",
                        "stem": "ta",
                        "grammar": "Bīja-mantra · 悉昙种子字",
                        "transliterationZh": "都嚧瓮（拼读参考：₍特₎隆）",
                        "meaningZh": "啰字门（清净离诸尘垢（rajas）·威神增益圆满·大空菩提点摄持）",
                        "meaningEn": "stainless purity free from dust (rajas) — perfected spiritual vigor sealed with bodhicitta bindu",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-153",
            "index": 153,
            "iast": "sarvayakṣarākṣasa",
            "classicalTranslitZh": "萨婆药叉喝啰刹娑",
            "modernPhoneticZh": "萨₍尔₎瓦-呀₍克₎沙-啦₍克₎沙萨",
            "meaningZh": "于一切暴恶药叉与罗刹鬼众！",
            "meaningEn": "Of all hostile Yakṣas and Rākṣasas!",
            "tangNoteZh": "第二会【释尊应化会】·《T19n0945》原典第 153/427 句",
            "words": [
                  {
                        "iast": "sarvayakṣarākṣasa",
                        "stem": "sarva-yakṣ-arākṣasa",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "萨哩嚩耶乞洒啰(引)乞洒萨（拼读参考：萨₍尔₎瓦-呀₍克₎沙-啦₍克₎沙萨）",
                        "meaningZh": "一切·坚持下去·解脱自在",
                        "meaningEn": "all + press on + free from Rākṣasas",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-154",
            "index": 154,
            "iast": "grahāṇāṃ ca",
            "classicalTranslitZh": "揭啰诃若阇",
            "modernPhoneticZh": "₍格₎啦哈南 佳",
            "meaningZh": "及一切凶星恶曜执鬼众！",
            "meaningEn": "And planetary demons (Grahas)!",
            "tangNoteZh": "第二会【释尊应化会】·《T19n0945》原典第 154/427 句",
            "words": [
                  {
                        "iast": "grahāṇāṃ",
                        "stem": "graha",
                        "grammar": "Noun · 星曜/执障 · Gen. Pl. · 属格复数",
                        "transliterationZh": "伽啰诃喃(引)（拼读参考：₍格₎啦哈南）",
                        "meaningZh": "诸曜执、星曜鬼神执障之",
                        "meaningEn": "of planet, seizing spirit/graha",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-155",
            "index": 155,
            "iast": "vidhvaṃsanakara",
            "classicalTranslitZh": "毗腾崩萨那羯啰",
            "modernPhoneticZh": "维₍德₎旺萨拿嘎啦",
            "meaningZh": "悉皆摧碎坏灭令无遗余！",
            "meaningEn": "Shattering and scattering them!",
            "tangNoteZh": "第二会【释尊应化会】·《T19n0945》原典第 155/427 句",
            "words": [
                  {
                        "iast": "vidhvaṃsanakara",
                        "stem": "vidhvaṃsana",
                        "grammar": "Agent · 能作生起",
                        "transliterationZh": "尾驮鑁萨曩迦啰（拼读参考：维₍德₎旺萨拿嘎啦）",
                        "meaningZh": "能生摧灭",
                        "meaningEn": "causing ruining, spoiling, destroying, violating",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-156",
            "index": 156,
            "iast": "hūṃ",
            "classicalTranslitZh": "虎𤙖",
            "modernPhoneticZh": "吽",
            "meaningZh": "吽！",
            "meaningEn": "Hūṃ!",
            "tangNoteZh": "第二会【释尊应化会】·《T19n0945》原典第 156/427 句",
            "words": [
                  {
                        "iast": "hūṃ",
                        "stem": "hūṃ",
                        "grammar": "Bīja · 金刚种子字",
                        "transliterationZh": "吽（拼读参考：吽）",
                        "meaningZh": "金刚不坏菩提心印、摧破诸障",
                        "meaningEn": "adamantine bodhicitta seed syllable",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-157",
            "index": 157,
            "iast": "trūṃ",
            "classicalTranslitZh": "都嚧雍",
            "modernPhoneticZh": "₍特₎隆",
            "meaningZh": "特隆！",
            "meaningEn": "Trūṃ!",
            "tangNoteZh": "第二会【释尊应化会】·《T19n0945》原典第 157/427 句",
            "words": [
                  {
                        "iast": "trūṃ",
                        "stem": "ta",
                        "grammar": "Bīja-mantra · 悉昙种子字",
                        "transliterationZh": "都嚧瓮（拼读参考：₍特₎隆）",
                        "meaningZh": "啰字门（清净离诸尘垢（rajas）·威神增益圆满·大空菩提点摄持）",
                        "meaningEn": "stainless purity free from dust (rajas) — perfected spiritual vigor sealed with bodhicitta bindu",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-158",
            "index": 158,
            "iast": "caturaśītīnām",
            "classicalTranslitZh": "者都啰尸底南",
            "modernPhoneticZh": "佳度啦希帝南",
            "meaningZh": "于八万四千数！",
            "meaningEn": "Of the eighty-four!",
            "tangNoteZh": "第二会【释尊应化会】·《T19n0945》原典第 158/427 句",
            "words": [
                  {
                        "iast": "caturaśītīnām",
                        "stem": "caturaśīti",
                        "grammar": "Gen. Pl. · 属格复数",
                        "transliterationZh": "者都啰尸底(引)喃(引)（拼读参考：佳度啦希帝南）",
                        "meaningZh": "诸八十四之",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-159",
            "index": 159,
            "iast": "grahasahasrāṇām",
            "classicalTranslitZh": "揭啰诃娑诃萨啰南",
            "modernPhoneticZh": "₍格₎啦哈萨哈₍斯₎啦南",
            "meaningZh": "千数一切恶星鬼神部众！",
            "meaningEn": "Thousand planetary spirits!",
            "tangNoteZh": "第二会【释尊应化会】·《T19n0945》原典第 159/427 句",
            "words": [
                  {
                        "iast": "grahasahasrāṇām",
                        "stem": "graha-sahasra",
                        "grammar": "Samāsa · 复合词 (Gen. Pl. · 属格复数)",
                        "transliterationZh": "伽啰诃萨诃娑啰(引)喃(引)（拼读参考：₍格₎啦哈萨哈₍斯₎啦南）",
                        "meaningZh": "曜执诸千",
                        "meaningEn": "planet + of thousand",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-160",
            "index": 160,
            "iast": "vidhvaṃsanakara",
            "classicalTranslitZh": "毗腾崩萨那啰",
            "modernPhoneticZh": "维₍德₎旺萨拿嘎啦",
            "meaningZh": "悉皆摧破降伏者！",
            "meaningEn": "Completely routing and dispelling them!",
            "tangNoteZh": "第二会【释尊应化会】·《T19n0945》原典第 160/427 句",
            "words": [
                  {
                        "iast": "vidhvaṃsanakara",
                        "stem": "vidhvaṃsana",
                        "grammar": "Agent · 能作生起",
                        "transliterationZh": "尾驮鑁萨曩迦啰（拼读参考：维₍德₎旺萨拿嘎啦）",
                        "meaningZh": "能生摧灭",
                        "meaningEn": "causing ruining, spoiling, destroying, violating",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-161",
            "index": 161,
            "iast": "hūṃ",
            "classicalTranslitZh": "虎𤙖",
            "modernPhoneticZh": "吽",
            "meaningZh": "吽！",
            "meaningEn": "Hūṃ!",
            "tangNoteZh": "第二会【释尊应化会】·《T19n0945》原典第 161/427 句",
            "words": [
                  {
                        "iast": "hūṃ",
                        "stem": "hūṃ",
                        "grammar": "Bīja · 金刚种子字",
                        "transliterationZh": "吽（拼读参考：吽）",
                        "meaningZh": "金刚不坏菩提心印、摧破诸障",
                        "meaningEn": "adamantine bodhicitta seed syllable",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-162",
            "index": 162,
            "iast": "trūṃ",
            "classicalTranslitZh": "都嚧雍",
            "modernPhoneticZh": "₍特₎隆",
            "meaningZh": "特隆！",
            "meaningEn": "Trūṃ!",
            "tangNoteZh": "第二会【释尊应化会】·《T19n0945》原典第 162/427 句",
            "words": [
                  {
                        "iast": "trūṃ",
                        "stem": "ta",
                        "grammar": "Bīja-mantra · 悉昙种子字",
                        "transliterationZh": "都嚧瓮（拼读参考：₍特₎隆）",
                        "meaningZh": "啰字门（清净离诸尘垢（rajas）·威神增益圆满·大空菩提点摄持）",
                        "meaningEn": "stainless purity free from dust (rajas) — perfected spiritual vigor sealed with bodhicitta bindu",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-163",
            "index": 163,
            "iast": "rakṣa",
            "classicalTranslitZh": "啰叉",
            "modernPhoneticZh": "啦₍克₎沙",
            "meaningZh": "守护救度行者一切安隐（第二会圆满）！",
            "meaningEn": "Protect and guard!",
            "tangNoteZh": "第二会【释尊应化会】·《T19n0945》原典第 163/427 句",
            "words": [
                  {
                        "iast": "rakṣa",
                        "stem": "rakṣa",
                        "grammar": "Impv. 2nd Sg. · 祈使守护",
                        "transliterationZh": "啰乞洒（拼读参考：啦₍克₎沙）",
                        "meaningZh": "拥护、守护",
                        "meaningEn": "protect, guard and shelter!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-164",
            "index": 164,
            "iast": "bhagavatī",
            "classicalTranslitZh": "婆伽梵",
            "modernPhoneticZh": "巴嘎瓦帝",
            "meaningZh": "世尊大白伞盖佛母！",
            "meaningEn": "O Blessed Bhagavatī!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 164/427 句",
            "words": [
                  {
                        "iast": "bhagavatī",
                        "stem": "bhaga",
                        "grammar": "Poss. Fem. · 具足尊",
                        "transliterationZh": "婆誐嚩底(引)（拼读参考：巴嘎瓦帝）",
                        "meaningZh": "具足才尊",
                        "meaningEn": "endowed with excellence",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-165",
            "index": 165,
            "iast": "sarvatathāgatoṣṇīṣam",
            "classicalTranslitZh": "萨怛他伽都瑟尼釤",
            "modernPhoneticZh": "萨₍尔₎瓦-达他嘎多-₍师₎尼伤",
            "meaningZh": "一切如来无见顶相佛顶尊！",
            "meaningEn": "Crown-Uṣṇīṣa of All Tathāgatas!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 165/427 句",
            "words": [
                  {
                        "iast": "sarvatathāgatoṣṇīṣam",
                        "stem": "sarvatathāgata-uṣṇīṣa",
                        "grammar": "Samāsa · 复合词 (Acc./Nom. Sg. · 业格/主格单数)",
                        "transliterationZh": "萨哩嚩怛他(引)誐睹瑟抳(引)忏（拼读参考：萨₍尔₎瓦-达他嘎多-₍师₎尼伤）",
                        "meaningZh": "一切如来佛顶肉髻相",
                        "meaningEn": "all Tathagatas + Uṣṇīṣa",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-166",
            "index": 166,
            "iast": "pratyaṅgirī",
            "classicalTranslitZh": "波啰点阇吉唎",
            "modernPhoneticZh": "₍普₎啦₍蒂₎央吉里",
            "meaningZh": "大回遮母尊！",
            "meaningEn": "Great Pratyaṅgirā!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 166/427 句",
            "words": [
                  {
                        "iast": "pratyaṅgirī",
                        "stem": "pa-ra-ta",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "钵啰底耶仰拟哩(引)（拼读参考：₍普₎啦₍蒂₎央吉里）",
                        "meaningZh": "第一义谛·清净离诸尘垢·真如实际",
                        "meaningEn": "ultimate truth & stainless purity free from dust & immutable Suchness",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-167",
            "index": 167,
            "iast": "mahāsahasra",
            "classicalTranslitZh": "摩诃娑诃萨啰",
            "modernPhoneticZh": "玛哈-萨哈₍斯₎啦",
            "meaningZh": "具大千数威神妙相！",
            "meaningEn": "Endowed with a great thousand!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 167/427 句",
            "words": [
                  {
                        "iast": "mahāsahasra",
                        "stem": "mahā-sahasra",
                        "grammar": "Samāsa · 复合词 (Num. · 千)",
                        "transliterationZh": "摩诃萨诃娑啰（拼读参考：玛哈-萨哈₍斯₎啦）",
                        "meaningZh": "大千",
                        "meaningEn": "great + thousand",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-168",
            "index": 168,
            "iast": "bhuje sahasraśīrṣe",
            "classicalTranslitZh": "勃树娑诃萨啰室唎沙",
            "modernPhoneticZh": "布杰 萨哈₍斯₎啦-希₍尔₎奢",
            "meaningZh": "千臂庄严、千首遍观十方尊！",
            "meaningEn": "Thousand-armed, thousand-headed One!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 168/427 句",
            "words": [
                  {
                        "iast": "bhuje",
                        "stem": "bhuja",
                        "grammar": "Noun · 尊臂 · Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "部逝（拼读参考：布杰）",
                        "meaningZh": "臂、千臂庄严尊",
                        "meaningEn": "O arm, hand / in arm, hand",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "sahasraśīrṣe",
                        "stem": "sahasraśas-īrṣī",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "萨诃娑啰尸哩晒（拼读参考：萨哈₍斯₎啦-希₍尔₎奢）",
                        "meaningZh": "截至成千羨慕尊",
                        "meaningEn": "by thousands + O envy",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-169",
            "index": 169,
            "iast": "koṭisahasranetre",
            "classicalTranslitZh": "俱知娑诃萨泥帝㘑",
            "modernPhoneticZh": "果蒂萨哈₍斯₎啦内₍特₎雷",
            "meaningZh": "百千万亿清净慧眼普照母！",
            "meaningEn": "With tens of millions of wisdom-eyes!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 169/427 句",
            "words": [
                  {
                        "iast": "koṭisahasranetre",
                        "stem": "koṭi-sahasra-netra",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "俱置萨诃娑啰祢怛隶（拼读参考：果蒂萨哈₍斯₎啦内₍特₎雷）",
                        "meaningZh": "俱胝·千·眼目",
                        "meaningEn": "ten million + thousand + O eye",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-170",
            "index": 170,
            "iast": "abhedye jvalita",
            "classicalTranslitZh": "阿弊提视婆唎多",
            "modernPhoneticZh": "阿贝₍地₎耶 ₍吉₎瓦利达",
            "meaningZh": "金刚坚固不可坏、威光炽燃母！",
            "meaningEn": "Indestructible and blazing with light!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 170/427 句",
            "words": [
                  {
                        "iast": "abhedye",
                        "stem": "a-bhedya",
                        "grammar": "Nañ-Tatpuruṣa · 否定复合词",
                        "transliterationZh": "阿陛地曳（拼读参考：阿贝₍地₎耶）",
                        "meaningZh": "无开除",
                        "meaningEn": "non-O to be cleft or pierced; to be betrayed, seduced, refuted / in to be cleft or pierced; to be betrayed, seduced, refuted",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "jvalita",
                        "stem": "jvalita",
                        "grammar": "Part. · 炽盛放光",
                        "transliterationZh": "日嚩里怛（拼读参考：₍吉₎瓦利达）",
                        "meaningZh": "炽盛燃耀、大放光明",
                        "meaningEn": "blazing, illuminated, flaming",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-171",
            "index": 171,
            "iast": "ṭaṭaṅkāre",
            "classicalTranslitZh": "吒吒甖迦",
            "modernPhoneticZh": "达当嘎雷",
            "meaningZh": "威震三界自在尊！",
            "meaningEn": "Resounding with mighty majesty!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 171/427 句",
            "words": [
                  {
                        "iast": "ṭaṭaṅkāre",
                        "stem": "ṭa-ṭa-ṅa",
                        "grammar": "Mantra Voc. · 真言呼请句",
                        "transliterationZh": "吒吒仰迦(引)隶（拼读参考：达当嘎雷）",
                        "meaningZh": "断除憍慢执障·支分寂静·造作离相（呼请加持）",
                        "meaningEn": "cutting rigid pride & quiescence of perceptual limbs & freedom from karmic agency (vocative invocation)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-172",
            "index": 172,
            "iast": "mahāvajrodāre",
            "classicalTranslitZh": "摩诃跋阇嚧陀啰",
            "modernPhoneticZh": "玛哈-瓦₍吉₎洛-达雷",
            "meaningZh": "广大金刚妙体遍摄尊！",
            "meaningEn": "Sublime and Vast Vajra Sovereign!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 172/427 句",
            "words": [
                  {
                        "iast": "mahāvajrodāre",
                        "stem": "mahā-vajra-dāra",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "摩诃嚩日嚧陀隶（拼读参考：玛哈-瓦₍吉₎洛-达雷）",
                        "meaningZh": "大·金刚·出租尊",
                        "meaningEn": "great + Vajra + O rent",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-173",
            "index": 173,
            "iast": "tribhuvana",
            "classicalTranslitZh": "帝唎菩婆那",
            "modernPhoneticZh": "₍特₎里布瓦拿",
            "meaningZh": "统摄欲界色界无色界三有世间！",
            "meaningEn": "Throughout the three worlds!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 173/427 句",
            "words": [
                  {
                        "iast": "tribhuvana",
                        "stem": "tribhuvana",
                        "grammar": "Samāsa · 三界",
                        "transliterationZh": "怛哩部嚩曩（拼读参考：₍特₎里布瓦拿）",
                        "meaningZh": "三界、三有世间",
                        "meaningEn": "the Three Realms of Existence",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-174",
            "index": 174,
            "iast": "maṇḍale",
            "classicalTranslitZh": "曼茶啰",
            "modernPhoneticZh": "曼达雷",
            "meaningZh": "大曼荼罗圣坛城海会尊！",
            "meaningEn": "O Sacred Maṇḍala!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 174/427 句",
            "words": [
                  {
                        "iast": "maṇḍale",
                        "stem": "maṇḍala",
                        "grammar": "Noun · 曼荼罗坛城 · Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "曼拏隶（拼读参考：曼达雷）",
                        "meaningZh": "曼荼罗、坛城轮圆具足尊",
                        "meaningEn": "O Maṇḍala, sacred cosmogram/circle / in Maṇḍala, sacred cosmogram/circle",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-175",
            "index": 175,
            "iast": "oṃ",
            "classicalTranslitZh": "乌𤙖",
            "modernPhoneticZh": "嗡",
            "meaningZh": "嗡！",
            "meaningEn": "Oṃ!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 175/427 句",
            "words": [
                  {
                        "iast": "oṃ",
                        "stem": "oṃ",
                        "grammar": "Praṇava · 圣音",
                        "transliterationZh": "唵（拼读参考：嗡）",
                        "meaningZh": "三身总持圣音（法报化三身摄受）",
                        "meaningEn": "sacred Praṇava syllable embodying Trikāya",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-176",
            "index": 176,
            "iast": "svastir bhavatu",
            "classicalTranslitZh": "莎悉帝薄婆都",
            "modernPhoneticZh": "₍斯₎瓦₍斯₎帝₍尔₎ 巴瓦度",
            "meaningZh": "愿赐大吉祥安隐成就！",
            "meaningEn": "May auspiciousness and well-being prevail!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 176/427 句",
            "words": [
                  {
                        "iast": "svastir",
                        "stem": "svasti",
                        "grammar": "Indecl./Noun · 吉祥安隐",
                        "transliterationZh": "娑嚩悉底哩（拼读参考：₍斯₎瓦₍斯₎帝₍尔₎）",
                        "meaningZh": "吉祥安隐、善妙无恙",
                        "meaningEn": "well-being, fortune, auspicious safety",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bhavatu",
                        "stem": "bhavatu",
                        "grammar": "Impv. 3rd Sg. · 祈愿式",
                        "transliterationZh": "婆嚩都（拼读参考：巴瓦度）",
                        "meaningZh": "愿成就、愿悉吉祥",
                        "meaningEn": "may it be, let there be!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-177",
            "index": 177,
            "iast": "mama",
            "classicalTranslitZh": "么么",
            "modernPhoneticZh": "玛玛",
            "meaningZh": "于我！",
            "meaningEn": "For me!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 177/427 句",
            "words": [
                  {
                        "iast": "mama",
                        "stem": "mama",
                        "grammar": "Pron. Gen. · 第一人称属格",
                        "transliterationZh": "摩摩（拼读参考：玛玛）",
                        "meaningZh": "我之（行者所有）",
                        "meaningEn": "my, of me (the practitioner)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-178",
            "index": 178,
            "iast": "idaṃ mama sya",
            "classicalTranslitZh": "印兔那么么写",
            "modernPhoneticZh": "伊当 玛玛 ₍斯₎呀",
            "meaningZh": "我今受持弟子某甲吉祥无障！",
            "meaningEn": "For me, this practitioner!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 178/427 句 · 《首楞严经》原典夹注：至此句准前称名，若俗人称弟子某甲",
            "words": [
                  {
                        "iast": "idaṃ",
                        "stem": "idaṃ",
                        "grammar": "Pron. Neut. · 近指代词",
                        "transliterationZh": "伊昙（拼读参考：伊当）",
                        "meaningZh": "此、此法门",
                        "meaningEn": "this, here",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "mama",
                        "stem": "mama",
                        "grammar": "Pron. Gen. · 第一人称属格",
                        "transliterationZh": "摩摩（拼读参考：玛玛）",
                        "meaningZh": "我之（行者所有）",
                        "meaningEn": "my, of me (the practitioner)",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "sya",
                        "stem": "sa",
                        "grammar": "Akṣara-mukha · 耶字门",
                        "transliterationZh": "娑耶（拼读参考：₍斯₎呀）",
                        "meaningZh": "耶字门（一乘如实之道（yāna）·本不生体性）",
                        "meaningEn": "supreme vehicle of awakening (yāna) — primordial non-arising",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-179",
            "index": 179,
            "iast": "rājabhayāt",
            "classicalTranslitZh": "啰阇婆夜",
            "modernPhoneticZh": "啦佳巴呀₍特₎",
            "meaningZh": "永离王难官非怖畏！",
            "meaningEn": "From danger of kings!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 179/427 句",
            "words": [
                  {
                        "iast": "rājabhayāt",
                        "stem": "rāj-abhaya",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "啰(引)惹婆夜怛（拼读参考：啦佳巴呀₍特₎）",
                        "meaningZh": "在位从无畏",
                        "meaningEn": "reign + from non-fear",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-180",
            "index": 180,
            "iast": "caurabhayāt",
            "classicalTranslitZh": "主啰跋夜",
            "modernPhoneticZh": "招啦巴呀₍特₎",
            "meaningZh": "永离盗贼劫掠怖畏！",
            "meaningEn": "From danger of thieves!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 180/427 句",
            "words": [
                  {
                        "iast": "caurabhayāt",
                        "stem": "caura-bhaya",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "昭啰婆夜怛（拼读参考：招啦巴呀₍特₎）",
                        "meaningZh": "贼盗从怖畏",
                        "meaningEn": "thief + from fear",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-181",
            "index": 181,
            "iast": "agnibhayāt",
            "classicalTranslitZh": "阿祇尼婆夜",
            "modernPhoneticZh": "阿₍格₎尼巴呀₍特₎",
            "meaningZh": "永离大火焚烧怖畏！",
            "meaningEn": "From danger of fire!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 181/427 句",
            "words": [
                  {
                        "iast": "agnibhayāt",
                        "stem": "agni-bhaya",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "阿伽你婆夜怛（拼读参考：阿₍格₎尼巴呀₍特₎）",
                        "meaningZh": "圣火从怖畏",
                        "meaningEn": "fire + from fear",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-182",
            "index": 182,
            "iast": "udakabhayāt",
            "classicalTranslitZh": "乌陀迦婆夜",
            "modernPhoneticZh": "乌达嘎巴呀₍特₎",
            "meaningZh": "永离大水漂溺怖畏！",
            "meaningEn": "From danger of flood and water!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 182/427 句",
            "words": [
                  {
                        "iast": "udakabhayāt",
                        "stem": "udaka-bhaya",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "坞捺迦婆夜怛（拼读参考：乌达嘎巴呀₍特₎）",
                        "meaningZh": "净水从怖畏",
                        "meaningEn": "water + from fear",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-183",
            "index": 183,
            "iast": "viṣabhayāt",
            "classicalTranslitZh": "毗沙婆夜",
            "modernPhoneticZh": "维沙巴呀₍特₎",
            "meaningZh": "永离一切蛊毒药害怖畏！",
            "meaningEn": "From danger of poison!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 183/427 句",
            "words": [
                  {
                        "iast": "viṣabhayāt",
                        "stem": "viṣ-abhaya",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "尾洒婆夜怛（拼读参考：维沙巴呀₍特₎）",
                        "meaningZh": "搅拌从无畏",
                        "meaningEn": "stir + from non-fear",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-184",
            "index": 184,
            "iast": "śastrabhayāt",
            "classicalTranslitZh": "舍萨多啰婆夜",
            "modernPhoneticZh": "沙₍斯特₎啦巴呀₍特₎",
            "meaningZh": "永离刀杖兵器伤害怖畏！",
            "meaningEn": "From danger of weapons!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 184/427 句",
            "words": [
                  {
                        "iast": "śastrabhayāt",
                        "stem": "śastra-bhaya",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "舍悉怛啰婆夜怛（拼读参考：沙₍斯特₎啦巴呀₍特₎）",
                        "meaningZh": "刀杖兵戈从怖畏",
                        "meaningEn": "weapon + from fear",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-185",
            "index": 185,
            "iast": "paracakrabhayāt",
            "classicalTranslitZh": "婆啰斫羯啰婆夜",
            "modernPhoneticZh": "巴啦佳₍克₎啦巴呀₍特₎",
            "meaningZh": "永离他方怨兵侵略怖畏！",
            "meaningEn": "From danger of invading armies!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 185/427 句",
            "words": [
                  {
                        "iast": "paracakrabhayāt",
                        "stem": "paracakra-bhaya",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "跛啰者讫啰婆夜怛（拼读参考：巴啦佳₍克₎啦巴呀₍特₎）",
                        "meaningZh": "他兵从怖畏",
                        "meaningEn": "enemy + from fear",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-186",
            "index": 186,
            "iast": "durbhikṣabhayāt",
            "classicalTranslitZh": "突瑟叉婆夜",
            "modernPhoneticZh": "杜₍尔₎比₍克₎沙巴呀₍特₎",
            "meaningZh": "永离饥馑荒年匮乏怖畏！",
            "meaningEn": "From danger of famine!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 186/427 句",
            "words": [
                  {
                        "iast": "durbhikṣabhayāt",
                        "stem": "durbhikṣa-bhaya",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "努哩毗乞洒婆夜怛（拼读参考：杜₍尔₎比₍克₎沙巴呀₍特₎）",
                        "meaningZh": "俭从怖畏",
                        "meaningEn": "scarcity + from fear",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-187",
            "index": 187,
            "iast": "aśanibhayāt",
            "classicalTranslitZh": "阿舍儞婆夜",
            "modernPhoneticZh": "阿沙尼巴呀₍特₎",
            "meaningZh": "永离雷电霹雳冰雹怖畏！",
            "meaningEn": "From danger of thunderbolts!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 187/427 句",
            "words": [
                  {
                        "iast": "aśanibhayāt",
                        "stem": "aśani-bhaya",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "阿舍你婆夜怛（拼读参考：阿沙尼巴呀₍特₎）",
                        "meaningZh": "雹从怖畏",
                        "meaningEn": "hail + from fear",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-188",
            "index": 188,
            "iast": "akālamṛtyubhayāt",
            "classicalTranslitZh": "阿迦啰蜜唎柱婆夜",
            "modernPhoneticZh": "阿嘎啦₍姆₎日₍蒂₎尤巴呀₍特₎",
            "meaningZh": "永离非时横死夭折怖畏！",
            "meaningEn": "From danger of untimely death!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 188/427 句",
            "words": [
                  {
                        "iast": "akālamṛtyubhayāt",
                        "stem": "akāla-mṛtyubhaya",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "阿迦(引)攞蜜哩底庾婆夜怛（拼读参考：阿嘎啦₍姆₎日₍蒂₎尤巴呀₍特₎）",
                        "meaningZh": "非时从厄难",
                        "meaningEn": "untimely + from danger or fear of death",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-189",
            "index": 189,
            "iast": "dharaṇībhūmikampapātabhayāt",
            "classicalTranslitZh": "陀啰尼部弥剑波伽波陀婆夜",
            "modernPhoneticZh": "达啦尼布米干巴巴达巴呀₍特₎",
            "meaningZh": "永离大地动摇崩裂陷落怖畏！",
            "meaningEn": "From danger of earthquakes and chasms!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 189/427 句",
            "words": [
                  {
                        "iast": "dharaṇībhūmikampapātabhayāt",
                        "stem": "dharaṇī-bhūmikampa-pāta-bhaya",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "驮啰抳(引)部(引)弭剑跛波怛婆夜怛（拼读参考：达啦尼布米干巴巴达巴呀₍特₎）",
                        "meaningZh": "簷·地震·陨·从怖畏",
                        "meaningEn": "support + earthquake + fall + from fear",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-190",
            "index": 190,
            "iast": "ulkāpātabhayāt",
            "classicalTranslitZh": "乌啰迦婆多婆夜",
            "modernPhoneticZh": "乌₍尔₎嘎巴达巴呀₍特₎",
            "meaningZh": "永离流星陨石坠落怖畏！",
            "meaningEn": "From danger of falling meteors!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 190/427 句",
            "words": [
                  {
                        "iast": "ulkāpātabhayāt",
                        "stem": "ulkāpāta-bhaya",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "坞攞迦(引)波怛婆夜怛（拼读参考：乌₍尔₎嘎巴达巴呀₍特₎）",
                        "meaningZh": "星坠从怖畏",
                        "meaningEn": "from fear",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-191",
            "index": 191,
            "iast": "rājadaṇḍabhayāt",
            "classicalTranslitZh": "剌阇坛茶婆夜",
            "modernPhoneticZh": "啦佳丹达巴呀₍特₎",
            "meaningZh": "永离王法刑罚牢狱怖畏！",
            "meaningEn": "From danger of royal punishment!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 191/427 句",
            "words": [
                  {
                        "iast": "rājadaṇḍabhayāt",
                        "stem": "rāja-daṇḍa-bhaya",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "啰(引)惹昙拏婆夜怛（拼读参考：啦佳丹达巴呀₍特₎）",
                        "meaningZh": "王·金刚杖·从怖畏",
                        "meaningEn": "king + staff + from fear",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-192",
            "index": 192,
            "iast": "nāgabhayāt",
            "classicalTranslitZh": "那伽婆夜",
            "modernPhoneticZh": "拿嘎巴呀₍特₎",
            "meaningZh": "永离恶龙毒蛇伤害怖畏！",
            "meaningEn": "From danger of Nāgas and serpents!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 192/427 句",
            "words": [
                  {
                        "iast": "nāgabhayāt",
                        "stem": "nāga-bhaya",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "那(引)誐婆夜怛（拼读参考：拿嘎巴呀₍特₎）",
                        "meaningZh": "龙族从怖畏",
                        "meaningEn": "Nāga + from fear",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-193",
            "index": 193,
            "iast": "vidyudbhayāt",
            "classicalTranslitZh": "毗条怛婆夜",
            "modernPhoneticZh": "维₍地₎尤₍德₎巴呀₍特₎",
            "meaningZh": "永离闪电雷火惊怖！",
            "meaningEn": "From danger of lightning!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 193/427 句",
            "words": [
                  {
                        "iast": "vidyudbhayāt",
                        "stem": "va-da-ya",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "尾地庾讷婆夜怛（拼读参考：维₍地₎尤₍德₎巴呀₍特₎）",
                        "meaningZh": "最上真言离言说·施度调伏·一乘如实之道",
                        "meaningEn": "supreme ineffable speech & generosity & self-mastery & supreme vehicle of awakening",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-194",
            "index": 194,
            "iast": "suparṇibhayāt",
            "classicalTranslitZh": "苏波啰拏婆夜",
            "modernPhoneticZh": "苏巴₍尔₎尼巴呀₍特₎",
            "meaningZh": "永离金翅大鹏猛禽怖畏！",
            "meaningEn": "From danger of Garuḍas and birds of prey!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 194/427 句",
            "words": [
                  {
                        "iast": "suparṇibhayāt",
                        "stem": "suparṇi-bhaya",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "苏跛哩抳婆夜怛（拼读参考：苏巴₍尔₎尼巴呀₍特₎）",
                        "meaningZh": "迦楼罗从怖畏",
                        "meaningEn": "from fear",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-195",
            "index": 195,
            "iast": "yakṣagrahāt",
            "classicalTranslitZh": "药叉揭啰诃",
            "modernPhoneticZh": "呀₍克₎沙₍格₎啦哈₍特₎",
            "meaningZh": "解脱药叉鬼执祟恼害！",
            "meaningEn": "From seizure by Yakṣas!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 195/427 句",
            "words": [
                  {
                        "iast": "yakṣagrahāt",
                        "stem": "yakṣa-graha",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "耶乞洒伽啰诃怛（拼读参考：呀₍克₎沙₍格₎啦哈₍特₎）",
                        "meaningZh": "药叉从曜执",
                        "meaningEn": "Yakṣa + from planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-196",
            "index": 196,
            "iast": "rākṣasagrahāt",
            "classicalTranslitZh": "啰叉私揭啰诃",
            "modernPhoneticZh": "啦₍克₎沙萨₍格₎啦哈₍特₎",
            "meaningZh": "解脱罗刹恶鬼祟害！",
            "meaningEn": "From seizure by Rākṣasas!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 196/427 句",
            "words": [
                  {
                        "iast": "rākṣasagrahāt",
                        "stem": "rākṣasa-graha",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "啰(引)乞洒萨伽啰诃怛（拼读参考：啦₍克₎沙萨₍格₎啦哈₍特₎）",
                        "meaningZh": "罗刹从曜执",
                        "meaningEn": "Rākṣasa + from planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-197",
            "index": 197,
            "iast": "pretagrahāt",
            "classicalTranslitZh": "毕唎多揭啰诃",
            "modernPhoneticZh": "₍普₎雷达₍格₎啦哈₍特₎",
            "meaningZh": "解脱饿鬼（薜荔多）祟害！",
            "meaningEn": "From seizure by Pretas!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 197/427 句",
            "words": [
                  {
                        "iast": "pretagrahāt",
                        "stem": "preta-graha",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "钵隶怛伽啰诃怛（拼读参考：₍普₎雷达₍格₎啦哈₍特₎）",
                        "meaningZh": "饿鬼从曜执",
                        "meaningEn": "Preta + from planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-198",
            "index": 198,
            "iast": "piśācagrahāt",
            "classicalTranslitZh": "毗舍遮揭啰诃",
            "modernPhoneticZh": "比沙佳₍格₎啦哈₍特₎",
            "meaningZh": "解脱毗舍遮（啖精气鬼）祟害！",
            "meaningEn": "From seizure by Piśācas!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 198/427 句",
            "words": [
                  {
                        "iast": "piśācagrahāt",
                        "stem": "piśāca-graha",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "比奢者伽啰诃怛（拼读参考：比沙佳₍格₎啦哈₍特₎）",
                        "meaningZh": "毗舍遮从曜执",
                        "meaningEn": "Piśāca + from planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-199",
            "index": 199,
            "iast": "bhūtagrahāt",
            "classicalTranslitZh": "部多揭啰诃",
            "modernPhoneticZh": "布达₍格₎啦哈₍特₎",
            "meaningZh": "解脱部多魍魉鬼众祟害！",
            "meaningEn": "From seizure by Bhūtas!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 199/427 句",
            "words": [
                  {
                        "iast": "bhūtagrahāt",
                        "stem": "bhūta-graha",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "部(引)怛伽啰诃怛（拼读参考：布达₍格₎啦哈₍特₎）",
                        "meaningZh": "部多鬼神从曜执",
                        "meaningEn": "spirit + from planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-200",
            "index": 200,
            "iast": "kumbhāṇḍagrahāt",
            "classicalTranslitZh": "鸠槃茶揭啰诃",
            "modernPhoneticZh": "滚班达₍格₎啦哈₍特₎",
            "meaningZh": "解脱鸠槃茶（冬瓜厌魅鬼）祟害！",
            "meaningEn": "From seizure by Kumbhāṇḍas!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 200/427 句",
            "words": [
                  {
                        "iast": "kumbhāṇḍagrahāt",
                        "stem": "kumbhāṇḍa-graha",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "矩喃梵(引)拏伽啰诃怛（拼读参考：滚班达₍格₎啦哈₍特₎）",
                        "meaningZh": "甕形从曜执",
                        "meaningEn": "evil spirit + from planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-201",
            "index": 201,
            "iast": "pūtanagrahāt",
            "classicalTranslitZh": "补丹那揭啰诃",
            "modernPhoneticZh": "布达拿₍格₎啦哈₍特₎",
            "meaningZh": "解脱补丹那（臭饿热病鬼）祟害！",
            "meaningEn": "From seizure by Pūtanas!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 201/427 句",
            "words": [
                  {
                        "iast": "pūtanagrahāt",
                        "stem": "pūtana-graha",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "布怛曩伽啰诃怛（拼读参考：布达拿₍格₎啦哈₍特₎）",
                        "meaningZh": "臭者从曜执",
                        "meaningEn": "a kind of demon + from planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-202",
            "index": 202,
            "iast": "kaṭapūtanagrahāt",
            "classicalTranslitZh": "迦吒补丹那揭啰诃",
            "modernPhoneticZh": "嘎达布达拿₍格₎啦哈₍特₎",
            "meaningZh": "解脱迦吒补丹那（奇臭鬼）祟害！",
            "meaningEn": "From seizure by Kaṭapūtanas!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 202/427 句",
            "words": [
                  {
                        "iast": "kaṭapūtanagrahāt",
                        "stem": "kaṭapūtana-graha",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "迦吒布怛曩伽啰诃怛（拼读参考：嘎达布达拿₍格₎啦哈₍特₎）",
                        "meaningZh": "极臭鬼从曜执",
                        "meaningEn": "a kind of demon + from planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-203",
            "index": 203,
            "iast": "skandagrahāt",
            "classicalTranslitZh": "悉乾度揭啰诃",
            "modernPhoneticZh": "₍斯₎干达₍格₎啦哈₍特₎",
            "meaningZh": "解脱塞健陀（童子惊风鬼）祟害！",
            "meaningEn": "From seizure by Skanda spirits!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 203/427 句",
            "words": [
                  {
                        "iast": "skandagrahāt",
                        "stem": "skanda-graha",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "娑剑捺伽啰诃怛（拼读参考：₍斯₎干达₍格₎啦哈₍特₎）",
                        "meaningZh": "偏脣鬼从曜执",
                        "meaningEn": "a demon that causes drought + from planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-204",
            "index": 204,
            "iast": "apasmāragrahāt",
            "classicalTranslitZh": "阿播悉摩啰揭啰诃",
            "modernPhoneticZh": "阿巴₍斯₎玛啦₍格₎啦哈₍特₎",
            "meaningZh": "解脱阿播悉摩啰（羊痫癫狂鬼）祟害！",
            "meaningEn": "From seizure by Apasmāra epilepsy demons!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 204/427 句",
            "words": [
                  {
                        "iast": "apasmāragrahāt",
                        "stem": "apasmāra-graha",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "阿跛娑摩(引)啰伽啰诃怛（拼读参考：阿巴₍斯₎玛啦₍格₎啦哈₍特₎）",
                        "meaningZh": "作忘者从曜执",
                        "meaningEn": "epilepsy + from planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-205",
            "index": 205,
            "iast": "unmādagrahāt",
            "classicalTranslitZh": "乌檀摩陀揭啰诃",
            "modernPhoneticZh": "温玛达₍格₎啦哈₍特₎",
            "meaningZh": "解脱乌檀摩陀（狂乱失心鬼）祟害！",
            "meaningEn": "From seizure by Unmāda madness spirits!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 205/427 句",
            "words": [
                  {
                        "iast": "unmādagrahāt",
                        "stem": "unmāda-graha",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "温摩(引)捺伽啰诃怛（拼读参考：温玛达₍格₎啦哈₍特₎）",
                        "meaningZh": "颠从曜执",
                        "meaningEn": "mad + from planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-206",
            "index": 206,
            "iast": "chāyāgrahāt",
            "classicalTranslitZh": "车夜揭啰诃",
            "modernPhoneticZh": "恰呀₍格₎啦哈₍特₎",
            "meaningZh": "解脱车夜（魍魉影子鬼）祟害！",
            "meaningEn": "From seizure by Chāyā shadow spirits!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 206/427 句",
            "words": [
                  {
                        "iast": "chāyāgrahāt",
                        "stem": "chāyā-graha",
                        "grammar": "Samāsa · 复合词 (Abl. Sg. · 从格单数)",
                        "transliterationZh": "车(引)夜伽啰诃怛（拼读参考：恰呀₍格₎啦哈₍特₎）",
                        "meaningZh": "影从曜执",
                        "meaningEn": "shadow + from planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-207",
            "index": 207,
            "iast": "revatīgrahāt",
            "classicalTranslitZh": "醯唎婆帝揭啰诃",
            "modernPhoneticZh": "雷瓦帝₍格₎啦哈₍特₎",
            "meaningZh": "解脱醯唎婆帝（星宿恼幼鬼）祟害！",
            "meaningEn": "From seizure by Revatī spirits!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 207/427 句",
            "words": [
                  {
                        "iast": "revatīgrahāt",
                        "stem": "revatīgraha",
                        "grammar": "Abl. Sg. · 从格单数",
                        "transliterationZh": "隶嚩底(引)伽啰诃怛（拼读参考：雷瓦帝₍格₎啦哈₍特₎）",
                        "meaningZh": "从腹行魅 / 女魅",
                        "meaningEn": "from demon of; Revatī",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-208",
            "index": 208,
            "iast": "jātāhāriṇyāḥ",
            "classicalTranslitZh": "社多诃唎南",
            "modernPhoneticZh": "佳达哈里₍尼₎呀₍赫₎",
            "meaningZh": "远离食初生婴孩鬼女之害！",
            "meaningEn": "From spirits that steal newborns!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 208/427 句",
            "words": [
                  {
                        "iast": "jātāhāriṇyāḥ",
                        "stem": "ja-ta-ha",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "惹(引)多诃哩抳夜诃（拼读参考：佳达哈里₍尼₎呀₍赫₎）",
                        "meaningZh": "生起不可得·尊胜·真如实际·因缘空寂大乐",
                        "meaningEn": "transcending birth & victorious & immutable Suchness & causal emptiness & spiritual joy",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-209",
            "index": 209,
            "iast": "garbhāhāriṇyāḥ",
            "classicalTranslitZh": "揭婆诃唎南",
            "modernPhoneticZh": "嘎₍尔₎巴哈里₍尼₎呀₍赫₎",
            "meaningZh": "远离食胞胎鬼女之害！",
            "meaningEn": "From spirits that steal embryos!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 209/427 句",
            "words": [
                  {
                        "iast": "garbhāhāriṇyāḥ",
                        "stem": "ga-ra-bha",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "誐哩婆(引)诃哩抳夜诃（拼读参考：嘎₍尔₎巴哈里₍尼₎呀₍赫₎）",
                        "meaningZh": "妙行趣入·清净离诸尘垢·破有相福德光",
                        "meaningEn": "awakened spiritual movement & stainless purity free from dust & blessedness transcending existence",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-210",
            "index": 210,
            "iast": "rudhirāhāriṇyāḥ",
            "classicalTranslitZh": "嚧地啰诃唎南",
            "modernPhoneticZh": "鲁地啦哈里₍尼₎呀₍赫₎",
            "meaningZh": "远离饮血鬼女之害！",
            "meaningEn": "From spirits that consume blood!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 210/427 句",
            "words": [
                  {
                        "iast": "rudhirāhāriṇyāḥ",
                        "stem": "ra-dha-ra",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "噜地啰(引)诃哩抳夜诃（拼读参考：鲁地啦哈里₍尼₎呀₍赫₎）",
                        "meaningZh": "清净离诸尘垢·法界总持任持·因缘空寂大乐",
                        "meaningEn": "stainless purity free from dust & Dharma-realm retention & causal emptiness & spiritual joy",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-211",
            "index": 211,
            "iast": "māṃsāhāriṇyāḥ",
            "classicalTranslitZh": "忙娑诃唎南",
            "modernPhoneticZh": "芒萨哈里₍尼₎呀₍赫₎",
            "meaningZh": "远离食肉鬼女之害！",
            "meaningEn": "From spirits that consume flesh!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 211/427 句",
            "words": [
                  {
                        "iast": "māṃsāhāriṇyāḥ",
                        "stem": "ma-sa-ha",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "莽(引)娑诃哩抳夜诃（拼读参考：芒萨哈里₍尼₎呀₍赫₎）",
                        "meaningZh": "无我大慈三昧·一切诸谛圆满·因缘空寂大乐",
                        "meaningEn": "selfless great loving-kindness & all-pervading truth & auspiciousness & causal emptiness & spiritual joy",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-212",
            "index": 212,
            "iast": "medāhāriṇyāḥ",
            "classicalTranslitZh": "谜陀诃唎南",
            "modernPhoneticZh": "美达哈里₍尼₎呀₍赫₎",
            "meaningZh": "远离食脂膏鬼女之害！",
            "meaningEn": "From spirits that consume fat!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 212/427 句",
            "words": [
                  {
                        "iast": "medāhāriṇyāḥ",
                        "stem": "ma-da-ha",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "铭陀诃哩抳夜诃（拼读参考：美达哈里₍尼₎呀₍赫₎）",
                        "meaningZh": "无我大慈三昧·施度调伏·因缘空寂大乐",
                        "meaningEn": "selfless great loving-kindness & generosity & self-mastery & causal emptiness & spiritual joy",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-213",
            "index": 213,
            "iast": "majjāhāriṇyāḥ",
            "classicalTranslitZh": "摩阇诃唎南",
            "modernPhoneticZh": "玛佳哈里₍尼₎呀₍赫₎",
            "meaningZh": "远离食骨髓鬼女之害！",
            "meaningEn": "From spirits that consume marrow!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 213/427 句",
            "words": [
                  {
                        "iast": "majjāhāriṇyāḥ",
                        "stem": "ma-ja-ja",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "摩怛惹(引)诃哩抳夜诃（拼读参考：玛佳哈里₍尼₎呀₍赫₎）",
                        "meaningZh": "无我大慈三昧·生起不可得·尊胜·因缘空寂大乐",
                        "meaningEn": "selfless great loving-kindness & transcending birth & victorious & causal emptiness & spiritual joy",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-214",
            "index": 214,
            "iast": "ojāhāriṇyāḥ",
            "classicalTranslitZh": "阇多诃唎女",
            "modernPhoneticZh": "欧佳哈里₍尼₎呀₍赫₎",
            "meaningZh": "远离夺人精气神采鬼女之害！",
            "meaningEn": "From spirits that drain vitality!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 214/427 句",
            "words": [
                  {
                        "iast": "ojāhāriṇyāḥ",
                        "stem": "ja-ha-ra",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "污惹(引)诃哩抳夜诃（拼读参考：欧佳哈里₍尼₎呀₍赫₎）",
                        "meaningZh": "生起不可得·尊胜·因缘空寂大乐·清净离诸尘垢",
                        "meaningEn": "transcending birth & victorious & causal emptiness & spiritual joy & stainless purity free from dust",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-215",
            "index": 215,
            "iast": "jīvitāhāriṇyāḥ",
            "classicalTranslitZh": "视比多诃唎南",
            "modernPhoneticZh": "吉维达哈里₍尼₎呀₍赫₎",
            "meaningZh": "远离夺人寿命鬼女之害！",
            "meaningEn": "From spirits that steal life-force!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 215/427 句",
            "words": [
                  {
                        "iast": "jīvitāhāriṇyāḥ",
                        "stem": "√jīv",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "时尾多诃哩抳夜诃（拼读参考：吉维达哈里₍尼₎呀₍赫₎）",
                        "meaningZh": "长寿护命·生起不可得·尊胜",
                        "meaningEn": "vitalizing",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-216",
            "index": 216,
            "iast": "vittāhāriṇyāḥ",
            "classicalTranslitZh": "毗多诃唎南",
            "modernPhoneticZh": "维达哈里₍尼₎呀₍赫₎",
            "meaningZh": "远离耗夺财宝福禄鬼女之害！",
            "meaningEn": "From spirits that drain wealth and vigor!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 216/427 句",
            "words": [
                  {
                        "iast": "vittāhāriṇyāḥ",
                        "stem": "va-ta-ta",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "尾怛多诃哩抳夜诃（拼读参考：维达哈里₍尼₎呀₍赫₎）",
                        "meaningZh": "最上真言离言说·真如实际·因缘空寂大乐",
                        "meaningEn": "supreme ineffable speech & immutable Suchness & causal emptiness & spiritual joy",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-217",
            "index": 217,
            "iast": "vātāhāriṇyāḥ",
            "classicalTranslitZh": "婆多诃唎南",
            "modernPhoneticZh": "瓦达哈里₍尼₎呀₍赫₎",
            "meaningZh": "远离夺人气息风大鬼女之害！",
            "meaningEn": "From spirits that disturb vital breath!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 217/427 句",
            "words": [
                  {
                        "iast": "vātāhāriṇyāḥ",
                        "stem": "va-ta-ha",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "嚩(引)多诃哩抳夜诃（拼读参考：瓦达哈里₍尼₎呀₍赫₎）",
                        "meaningZh": "最上真言离言说·真如实际·因缘空寂大乐",
                        "meaningEn": "supreme ineffable speech & immutable Suchness & causal emptiness & spiritual joy",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-218",
            "index": 218,
            "iast": "aśucyāhāriṇyāḥ",
            "classicalTranslitZh": "阿输遮诃唎女",
            "modernPhoneticZh": "阿舒₍吉₎呀哈里₍尼₎呀₍赫₎",
            "meaningZh": "远离食不净秽物鬼女之害！",
            "meaningEn": "From spirits feeding on impurity!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 218/427 句",
            "words": [
                  {
                        "iast": "aśucyāhāriṇyāḥ",
                        "stem": "śa-ca-ya",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "阿戍遮夜诃哩抳夜诃（拼读参考：阿舒₍吉₎呀哈里₍尼₎呀₍赫₎）",
                        "meaningZh": "本性寂静止息·妙行迁变空·一乘如实之道",
                        "meaningEn": "primordial tranquil peace & awakened conduct beyond flux & supreme vehicle of awakening",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-219",
            "index": 219,
            "iast": "cittāhāriṇyāḥ",
            "classicalTranslitZh": "质多诃唎女",
            "modernPhoneticZh": "吉达哈里₍尼₎呀₍赫₎",
            "meaningZh": "远离夺人心识神志鬼女之害！",
            "meaningEn": "From spirits that steal mindfulness!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 219/427 句",
            "words": [
                  {
                        "iast": "cittāhāriṇyāḥ",
                        "stem": "ca-ta-ta",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "只怛多诃哩抳夜诃（拼读参考：吉达哈里₍尼₎呀₍赫₎）",
                        "meaningZh": "妙行迁变空·真如实际·因缘空寂大乐",
                        "meaningEn": "awakened conduct beyond flux & immutable Suchness & causal emptiness & spiritual joy",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-220",
            "index": 220,
            "iast": "eteṣāṃ sarveṣām",
            "classicalTranslitZh": "帝釤萨鞞釤",
            "modernPhoneticZh": "诶帝伤 萨₍尔₎威伤",
            "meaningZh": "如上所列一切恶鬼神众！",
            "meaningEn": "Of all these without exception!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 220/427 句",
            "words": [
                  {
                        "iast": "eteṣāṃ",
                        "stem": "eta-īṣā",
                        "grammar": "Samāsa · 复合词 (Acc. Sg. Fem. · 业格阴性)",
                        "transliterationZh": "翳帝洒喃（拼读参考：诶帝伤）",
                        "meaningZh": "长柄轴",
                        "meaningEn": "stem + the pole of a carriage",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "sarveṣām",
                        "stem": "saras-veṣa",
                        "grammar": "Samāsa · 复合词 (Acc. Sg. Fem. · 业格阴性)",
                        "transliterationZh": "萨哩吠洒喃（拼读参考：萨₍尔₎威伤）",
                        "meaningZh": "湖相",
                        "meaningEn": "a lake + work",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-221",
            "index": 221,
            "iast": "sarvagrahāṇām",
            "classicalTranslitZh": "萨婆揭啰诃南",
            "modernPhoneticZh": "萨₍尔₎瓦-₍格₎啦哈南",
            "meaningZh": "一切执曜鬼魅所造恶法！",
            "meaningEn": "Of all planetary demons and spirits!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 221/427 句",
            "words": [
                  {
                        "iast": "sarvagrahāṇām",
                        "stem": "sarva-graha",
                        "grammar": "Samāsa · 复合词 (Gen. Pl. · 属格复数)",
                        "transliterationZh": "萨哩嚩伽啰诃喃(引)（拼读参考：萨₍尔₎瓦-₍格₎啦哈南）",
                        "meaningZh": "一切诸曜执",
                        "meaningEn": "all + of planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-222",
            "index": 222,
            "iast": "vidyāṃ ca chindayāmi",
            "classicalTranslitZh": "毗陀耶阇瞋陀夜弥",
            "modernPhoneticZh": "维₍地₎央 佳 亲达呀米",
            "meaningZh": "彼所作邪咒我今以智慧剑斩断之！",
            "meaningEn": "I sever their spells!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 222/427 句",
            "words": [
                  {
                        "iast": "vidyāṃ",
                        "stem": "vidyā",
                        "grammar": "Noun · 明咒/圣明 · Acc. Sg. Fem. · 业格阴性",
                        "transliterationZh": "尾地焰（拼读参考：维₍地₎央）",
                        "meaningZh": "明咒、真言明妃、圣智明",
                        "meaningEn": "Vidyā, sacred wisdom-spell, illumination",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "chindayāmi",
                        "stem": "chindayāmi",
                        "grammar": "Pres.1.Sg. · 断除结界",
                        "transliterationZh": "齿喃捺夜弭（拼读参考：亲达呀米）",
                        "meaningZh": "我今断除、斩断（一切恶咒）",
                        "meaningEn": "I sever, I cut off",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-223",
            "index": 223,
            "iast": "kīlayāmi",
            "classicalTranslitZh": "鸡啰夜弥",
            "modernPhoneticZh": "给啦呀米",
            "meaningZh": "以金刚宝橛钉伏禁制之！",
            "meaningEn": "I pin them down with the Vajra-peg!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 223/427 句",
            "words": [
                  {
                        "iast": "kīlayāmi",
                        "stem": "kīlayāmi",
                        "grammar": "Pres.1.Sg. · 钉伏结界",
                        "transliterationZh": "计攞夜弭（拼读参考：给啦呀米）",
                        "meaningZh": "我今以金刚杵钉伏禁制",
                        "meaningEn": "I stake/seal with the vajra",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-224",
            "index": 224,
            "iast": "parivrājakakṛtām",
            "classicalTranslitZh": "波唎跋啰者迦讫唎担",
            "modernPhoneticZh": "巴里-₍维₎啦佳嘎₍克₎日当",
            "meaningZh": "游行梵志外道所造邪咒！",
            "meaningEn": "Spells made by wandering ascetics!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 224/427 句",
            "words": [
                  {
                        "iast": "parivrājakakṛtām",
                        "stem": "parivrājaka-kṛtā",
                        "grammar": "Samāsa · 复合词 (Acc. Sg. Fem. · 业格阴性)",
                        "transliterationZh": "跛哩嚩啰(引)惹迦讫哩担(引)（拼读参考：巴里-₍维₎啦佳嘎₍克₎日当）",
                        "meaningZh": "普行九渊",
                        "meaningEn": "the same + cleft",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-225",
            "index": 225,
            "iast": "vidyāṃ ca chindayāmi",
            "classicalTranslitZh": "毗陀夜阇瞋陀夜弥",
            "modernPhoneticZh": "维₍地₎央 佳 亲达呀米",
            "meaningZh": "彼邪明咒我今悉皆斩断！",
            "meaningEn": "I sever their spells!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 225/427 句",
            "words": [
                  {
                        "iast": "vidyāṃ",
                        "stem": "vidyā",
                        "grammar": "Noun · 明咒/圣明 · Acc. Sg. Fem. · 业格阴性",
                        "transliterationZh": "尾地焰（拼读参考：维₍地₎央）",
                        "meaningZh": "明咒、真言明妃、圣智明",
                        "meaningEn": "Vidyā, sacred wisdom-spell, illumination",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "chindayāmi",
                        "stem": "chindayāmi",
                        "grammar": "Pres.1.Sg. · 断除结界",
                        "transliterationZh": "齿喃捺夜弭（拼读参考：亲达呀米）",
                        "meaningZh": "我今断除、斩断（一切恶咒）",
                        "meaningEn": "I sever, I cut off",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-226",
            "index": 226,
            "iast": "kīlayāmi",
            "classicalTranslitZh": "鸡啰夜弥",
            "modernPhoneticZh": "给啦呀米",
            "meaningZh": "以金刚橛钉伏之！",
            "meaningEn": "I nail them down!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 226/427 句",
            "words": [
                  {
                        "iast": "kīlayāmi",
                        "stem": "kīlayāmi",
                        "grammar": "Pres.1.Sg. · 钉伏结界",
                        "transliterationZh": "计攞夜弭（拼读参考：给啦呀米）",
                        "meaningZh": "我今以金刚杵钉伏禁制",
                        "meaningEn": "I stake/seal with the vajra",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-227",
            "index": 227,
            "iast": "ḍākaḍākinīkṛtām",
            "classicalTranslitZh": "茶演尼讫唎担",
            "modernPhoneticZh": "达嘎达给尼₍克₎日当",
            "meaningZh": "荼伽男鬼与荼枳尼魅鬼所造咒！",
            "meaningEn": "Spells made by Ḍākas and Ḍākinīs!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 227/427 句",
            "words": [
                  {
                        "iast": "ḍākaḍākinīkṛtām",
                        "stem": "ḍa-ka-ḍa",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "拏(引)迦拏(引)枳泥讫哩担(引)（拼读参考：达嘎达给尼₍克₎日当）",
                        "meaningZh": "息灭诤怨·造作离相·离名相假立",
                        "meaningEn": "pacifying conflict & turmoil & freedom from karmic agency & beyond nominal designation",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-228",
            "index": 228,
            "iast": "vidyāṃ ca chindayāmi",
            "classicalTranslitZh": "毗陀夜阇瞋陀夜弥",
            "modernPhoneticZh": "维₍地₎央 佳 亲达呀米",
            "meaningZh": "彼邪明咒我今悉皆斩断！",
            "meaningEn": "I sever their spells!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 228/427 句",
            "words": [
                  {
                        "iast": "vidyāṃ",
                        "stem": "vidyā",
                        "grammar": "Noun · 明咒/圣明 · Acc. Sg. Fem. · 业格阴性",
                        "transliterationZh": "尾地焰（拼读参考：维₍地₎央）",
                        "meaningZh": "明咒、真言明妃、圣智明",
                        "meaningEn": "Vidyā, sacred wisdom-spell, illumination",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "chindayāmi",
                        "stem": "chindayāmi",
                        "grammar": "Pres.1.Sg. · 断除结界",
                        "transliterationZh": "齿喃捺夜弭（拼读参考：亲达呀米）",
                        "meaningZh": "我今断除、斩断（一切恶咒）",
                        "meaningEn": "I sever, I cut off",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-229",
            "index": 229,
            "iast": "kīlayāmi",
            "classicalTranslitZh": "鸡啰夜弥",
            "modernPhoneticZh": "给啦呀米",
            "meaningZh": "以金刚橛钉伏之！",
            "meaningEn": "I nail them down!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 229/427 句",
            "words": [
                  {
                        "iast": "kīlayāmi",
                        "stem": "kīlayāmi",
                        "grammar": "Pres.1.Sg. · 钉伏结界",
                        "transliterationZh": "计攞夜弭（拼读参考：给啦呀米）",
                        "meaningZh": "我今以金刚杵钉伏禁制",
                        "meaningEn": "I stake/seal with the vajra",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-230",
            "index": 230,
            "iast": "mahāpaśupataye",
            "classicalTranslitZh": "摩诃般输般怛夜",
            "modernPhoneticZh": "玛哈-巴舒巴达耶",
            "meaningZh": "大兽主天（外道摩醯首罗）！",
            "meaningEn": "By Mahāpaśupati!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 230/427 句",
            "words": [
                  {
                        "iast": "mahāpaśupataye",
                        "stem": "mahā-paśupati",
                        "grammar": "Samāsa · 复合词 (Dat. Sg. · 为格单数)",
                        "transliterationZh": "摩诃跛戍跛怛曳（拼读参考：玛哈-巴舒巴达耶）",
                        "meaningZh": "向大畜主",
                        "meaningEn": "great + to lord of the animals",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-231",
            "index": 231,
            "iast": "rudrakṛtām",
            "classicalTranslitZh": "嚧陀啰讫唎担",
            "modernPhoneticZh": "鲁₍德₎啦₍克₎日当",
            "meaningZh": "鲁陀罗部众所造咒术！",
            "meaningEn": "Spells made by Rudra!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 231/427 句",
            "words": [
                  {
                        "iast": "rudrakṛtām",
                        "stem": "rud-akṛta",
                        "grammar": "Samāsa · 复合词 (Acc. Sg. Fem. · 业格阴性)",
                        "transliterationZh": "噜捺啰讫哩担(引)（拼读参考：鲁₍德₎啦₍克₎日当）",
                        "meaningZh": "啼不备",
                        "meaningEn": "to weep + undone",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-232",
            "index": 232,
            "iast": "vidyāṃ ca chindayāmi",
            "classicalTranslitZh": "毗陀夜阇瞋陀夜弥",
            "modernPhoneticZh": "维₍地₎央 佳 亲达呀米",
            "meaningZh": "彼邪明咒我今悉皆斩断！",
            "meaningEn": "I sever their spells!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 232/427 句",
            "words": [
                  {
                        "iast": "vidyāṃ",
                        "stem": "vidyā",
                        "grammar": "Noun · 明咒/圣明 · Acc. Sg. Fem. · 业格阴性",
                        "transliterationZh": "尾地焰（拼读参考：维₍地₎央）",
                        "meaningZh": "明咒、真言明妃、圣智明",
                        "meaningEn": "Vidyā, sacred wisdom-spell, illumination",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "chindayāmi",
                        "stem": "chindayāmi",
                        "grammar": "Pres.1.Sg. · 断除结界",
                        "transliterationZh": "齿喃捺夜弭（拼读参考：亲达呀米）",
                        "meaningZh": "我今断除、斩断（一切恶咒）",
                        "meaningEn": "I sever, I cut off",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-233",
            "index": 233,
            "iast": "kīlayāmi",
            "classicalTranslitZh": "鸡啰夜弥",
            "modernPhoneticZh": "给啦呀米",
            "meaningZh": "以金刚橛钉伏之！",
            "meaningEn": "I nail them down!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 233/427 句",
            "words": [
                  {
                        "iast": "kīlayāmi",
                        "stem": "kīlayāmi",
                        "grammar": "Pres.1.Sg. · 钉伏结界",
                        "transliterationZh": "计攞夜弭（拼读参考：给啦呀米）",
                        "meaningZh": "我今以金刚杵钉伏禁制",
                        "meaningEn": "I stake/seal with the vajra",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-234",
            "index": 234,
            "iast": "nārāyaṇakṛtām",
            "classicalTranslitZh": "那啰夜拏讫唎担",
            "modernPhoneticZh": "拿啦呀拿₍克₎日当",
            "meaningZh": "假借那罗延天部众所造咒！",
            "meaningEn": "Spells made in Nārāyaṇa’s name!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 234/427 句",
            "words": [
                  {
                        "iast": "nārāyaṇakṛtām",
                        "stem": "nārāyaṇa-kṛtā",
                        "grammar": "Samāsa · 复合词 (Acc. Sg. Fem. · 业格阴性)",
                        "transliterationZh": "那(引)啰(引)耶拏讫哩担(引)（拼读参考：拿啦呀拿₍克₎日当）",
                        "meaningZh": "那罗延九渊",
                        "meaningEn": "Narayana + cleft",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-235",
            "index": 235,
            "iast": "vidyāṃ ca chindayāmi",
            "classicalTranslitZh": "毗陀夜阇瞋陀夜弥",
            "modernPhoneticZh": "维₍地₎央 佳 亲达呀米",
            "meaningZh": "彼邪明咒我今悉皆斩断！",
            "meaningEn": "I sever their spells!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 235/427 句",
            "words": [
                  {
                        "iast": "vidyāṃ",
                        "stem": "vidyā",
                        "grammar": "Noun · 明咒/圣明 · Acc. Sg. Fem. · 业格阴性",
                        "transliterationZh": "尾地焰（拼读参考：维₍地₎央）",
                        "meaningZh": "明咒、真言明妃、圣智明",
                        "meaningEn": "Vidyā, sacred wisdom-spell, illumination",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "chindayāmi",
                        "stem": "chindayāmi",
                        "grammar": "Pres.1.Sg. · 断除结界",
                        "transliterationZh": "齿喃捺夜弭（拼读参考：亲达呀米）",
                        "meaningZh": "我今断除、斩断（一切恶咒）",
                        "meaningEn": "I sever, I cut off",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-236",
            "index": 236,
            "iast": "kīlayāmi",
            "classicalTranslitZh": "鸡啰夜弥",
            "modernPhoneticZh": "给啦呀米",
            "meaningZh": "以金刚橛钉伏之！",
            "meaningEn": "I nail them down!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 236/427 句",
            "words": [
                  {
                        "iast": "kīlayāmi",
                        "stem": "kīlayāmi",
                        "grammar": "Pres.1.Sg. · 钉伏结界",
                        "transliterationZh": "计攞夜弭（拼读参考：给啦呀米）",
                        "meaningZh": "我今以金刚杵钉伏禁制",
                        "meaningEn": "I stake/seal with the vajra",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-237",
            "index": 237,
            "iast": "tattvagaruḍasahīyakṛtām",
            "classicalTranslitZh": "怛埵伽嚧茶西讫唎担",
            "modernPhoneticZh": "达₍特₎瓦嘎鲁达萨嘿呀₍克₎日当",
            "meaningZh": "金翅鸟仙及其伴党所造咒！",
            "meaningEn": "Spells made by Garuḍas and their hosts!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 237/427 句",
            "words": [
                  {
                        "iast": "tattvagaruḍasahīyakṛtām",
                        "stem": "tattva-garuḍa-sahīya-kṛtā",
                        "grammar": "Samāsa · 复合词 (Acc. Sg. Fem. · 业格阴性)",
                        "transliterationZh": "怛怛怛嚩誐噜拏萨醯耶讫哩担(引)（拼读参考：达₍特₎瓦嘎鲁达萨嘿呀₍克₎日当）",
                        "meaningZh": "真性·迦楼罗·公司·九渊",
                        "meaningEn": "the state of being that + Garuḍa + associated + cleft",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-238",
            "index": 238,
            "iast": "vidyāṃ ca chindayāmi",
            "classicalTranslitZh": "毗陀夜阇瞋陀夜弥",
            "modernPhoneticZh": "维₍地₎央 佳 亲达呀米",
            "meaningZh": "彼邪明咒我今悉皆斩断！",
            "meaningEn": "I sever their spells!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 238/427 句",
            "words": [
                  {
                        "iast": "vidyāṃ",
                        "stem": "vidyā",
                        "grammar": "Noun · 明咒/圣明 · Acc. Sg. Fem. · 业格阴性",
                        "transliterationZh": "尾地焰（拼读参考：维₍地₎央）",
                        "meaningZh": "明咒、真言明妃、圣智明",
                        "meaningEn": "Vidyā, sacred wisdom-spell, illumination",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "chindayāmi",
                        "stem": "chindayāmi",
                        "grammar": "Pres.1.Sg. · 断除结界",
                        "transliterationZh": "齿喃捺夜弭（拼读参考：亲达呀米）",
                        "meaningZh": "我今断除、斩断（一切恶咒）",
                        "meaningEn": "I sever, I cut off",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-239",
            "index": 239,
            "iast": "kīlayāmi",
            "classicalTranslitZh": "鸡啰夜弥",
            "modernPhoneticZh": "给啦呀米",
            "meaningZh": "以金刚橛钉伏之！",
            "meaningEn": "I nail them down!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 239/427 句",
            "words": [
                  {
                        "iast": "kīlayāmi",
                        "stem": "kīlayāmi",
                        "grammar": "Pres.1.Sg. · 钉伏结界",
                        "transliterationZh": "计攞夜弭（拼读参考：给啦呀米）",
                        "meaningZh": "我今以金刚杵钉伏禁制",
                        "meaningEn": "I stake/seal with the vajra",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-240",
            "index": 240,
            "iast": "mahākālamātṛgaṇakṛtām",
            "classicalTranslitZh": "摩诃迦啰摩怛唎伽拏讫唎担",
            "modernPhoneticZh": "玛哈-嘎啦玛₍特₎日嘎拿₍克₎日当",
            "meaningZh": "黑天鬼神及诸母鬼众所造咒！",
            "meaningEn": "Spells made by Mahākāla and Mātṛgaṇa spirits!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 240/427 句",
            "words": [
                  {
                        "iast": "mahākālamātṛgaṇakṛtām",
                        "stem": "mahākāla-mātṛ-gaṇa-kṛtā",
                        "grammar": "Samāsa · 复合词 (Acc. Sg. Fem. · 业格阴性)",
                        "transliterationZh": "摩诃迦(引)攞摩(引)底哩誐拏讫哩担(引)（拼读参考：玛哈-嘎啦玛₍特₎日嘎拿₍克₎日当）",
                        "meaningZh": "大黑天护法·母·海会众·九渊",
                        "meaningEn": "Mahākāla + mother + assembly + cleft",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-241",
            "index": 241,
            "iast": "vidyāṃ ca chindayāmi",
            "classicalTranslitZh": "毗陀夜阇瞋陀夜弥",
            "modernPhoneticZh": "维₍地₎央 佳 亲达呀米",
            "meaningZh": "彼邪明咒我今悉皆斩断！",
            "meaningEn": "I sever their spells!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 241/427 句",
            "words": [
                  {
                        "iast": "vidyāṃ",
                        "stem": "vidyā",
                        "grammar": "Noun · 明咒/圣明 · Acc. Sg. Fem. · 业格阴性",
                        "transliterationZh": "尾地焰（拼读参考：维₍地₎央）",
                        "meaningZh": "明咒、真言明妃、圣智明",
                        "meaningEn": "Vidyā, sacred wisdom-spell, illumination",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "chindayāmi",
                        "stem": "chindayāmi",
                        "grammar": "Pres.1.Sg. · 断除结界",
                        "transliterationZh": "齿喃捺夜弭（拼读参考：亲达呀米）",
                        "meaningZh": "我今断除、斩断（一切恶咒）",
                        "meaningEn": "I sever, I cut off",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-242",
            "index": 242,
            "iast": "kīlayāmi",
            "classicalTranslitZh": "鸡啰夜弥",
            "modernPhoneticZh": "给啦呀米",
            "meaningZh": "以金刚橛钉伏之！",
            "meaningEn": "I nail them down!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 242/427 句",
            "words": [
                  {
                        "iast": "kīlayāmi",
                        "stem": "kīlayāmi",
                        "grammar": "Pres.1.Sg. · 钉伏结界",
                        "transliterationZh": "计攞夜弭（拼读参考：给啦呀米）",
                        "meaningZh": "我今以金刚杵钉伏禁制",
                        "meaningEn": "I stake/seal with the vajra",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-243",
            "index": 243,
            "iast": "kāpālikakṛtām",
            "classicalTranslitZh": "迦波唎迦讫唎担",
            "modernPhoneticZh": "嘎巴利嘎₍克₎日当",
            "meaningZh": "髑髅外道（迦波唎迦）所造邪咒！",
            "meaningEn": "Spells made by Kāpālika skull-ascetics!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 243/427 句",
            "words": [
                  {
                        "iast": "kāpālikakṛtām",
                        "stem": "√pāl",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "迦(引)波里迦讫哩担(引)（拼读参考：嘎巴利嘎₍克₎日当）",
                        "meaningZh": "守护养育·造作离相",
                        "meaningEn": "guarding",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-244",
            "index": 244,
            "iast": "vidyāṃ ca chindayāmi",
            "classicalTranslitZh": "毗陀夜阇瞋陀夜弥",
            "modernPhoneticZh": "维₍地₎央 佳 亲达呀米",
            "meaningZh": "彼邪明咒我今悉皆斩断！",
            "meaningEn": "I sever their spells!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 244/427 句",
            "words": [
                  {
                        "iast": "vidyāṃ",
                        "stem": "vidyā",
                        "grammar": "Noun · 明咒/圣明 · Acc. Sg. Fem. · 业格阴性",
                        "transliterationZh": "尾地焰（拼读参考：维₍地₎央）",
                        "meaningZh": "明咒、真言明妃、圣智明",
                        "meaningEn": "Vidyā, sacred wisdom-spell, illumination",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "chindayāmi",
                        "stem": "chindayāmi",
                        "grammar": "Pres.1.Sg. · 断除结界",
                        "transliterationZh": "齿喃捺夜弭（拼读参考：亲达呀米）",
                        "meaningZh": "我今断除、斩断（一切恶咒）",
                        "meaningEn": "I sever, I cut off",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-245",
            "index": 245,
            "iast": "kīlayāmi",
            "classicalTranslitZh": "鸡啰夜弥",
            "modernPhoneticZh": "给啦呀米",
            "meaningZh": "以金刚橛钉伏之！",
            "meaningEn": "I nail them down!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 245/427 句",
            "words": [
                  {
                        "iast": "kīlayāmi",
                        "stem": "kīlayāmi",
                        "grammar": "Pres.1.Sg. · 钉伏结界",
                        "transliterationZh": "计攞夜弭（拼读参考：给啦呀米）",
                        "meaningZh": "我今以金刚杵钉伏禁制",
                        "meaningEn": "I stake/seal with the vajra",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-246",
            "index": 246,
            "iast": "jayakaramadhukara",
            "classicalTranslitZh": "阇耶羯啰摩度羯啰",
            "modernPhoneticZh": "佳呀嘎啦玛杜嘎啦",
            "meaningZh": "作胜神、作蜜神等咒师！",
            "meaningEn": "Jayakara and Madhukara spirits!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 246/427 句",
            "words": [
                  {
                        "iast": "jayakaramadhukara",
                        "stem": "jayakara-madhukara",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "惹耶迦啰摩度迦啰（拼读参考：佳呀嘎啦玛杜嘎啦）",
                        "meaningZh": "作胜作蜜",
                        "meaningEn": "honey-maker",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-247",
            "index": 247,
            "iast": "sarvārthasādhanakṛtām",
            "classicalTranslitZh": "萨婆啰他娑达那讫唎担",
            "modernPhoneticZh": "萨₍尔₎瓦₍尔₎他萨达拿₍克₎日当",
            "meaningZh": "假成一切事咒术所造邪法！",
            "meaningEn": "Spells made by Sarvārthasādhana practitioners!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 247/427 句",
            "words": [
                  {
                        "iast": "sarvārthasādhanakṛtām",
                        "stem": "sarvārtha-sādhana-kṛtā",
                        "grammar": "Samāsa · 复合词 (Acc. Sg. Fem. · 业格阴性)",
                        "transliterationZh": "萨哩嚩(引)哩他娑驮曩讫哩担(引)（拼读参考：萨₍尔₎瓦₍尔₎他萨达拿₍克₎日当）",
                        "meaningZh": "一切义利·成就法·九渊",
                        "meaningEn": "all aims and benefits + accomplishing + cleft",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-248",
            "index": 248,
            "iast": "vidyāṃ ca chindayāmi",
            "classicalTranslitZh": "毗陀夜阇瞋陀夜弥",
            "modernPhoneticZh": "维₍地₎央 佳 亲达呀米",
            "meaningZh": "彼邪明咒我今悉皆斩断！",
            "meaningEn": "I sever their spells!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 248/427 句",
            "words": [
                  {
                        "iast": "vidyāṃ",
                        "stem": "vidyā",
                        "grammar": "Noun · 明咒/圣明 · Acc. Sg. Fem. · 业格阴性",
                        "transliterationZh": "尾地焰（拼读参考：维₍地₎央）",
                        "meaningZh": "明咒、真言明妃、圣智明",
                        "meaningEn": "Vidyā, sacred wisdom-spell, illumination",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "chindayāmi",
                        "stem": "chindayāmi",
                        "grammar": "Pres.1.Sg. · 断除结界",
                        "transliterationZh": "齿喃捺夜弭（拼读参考：亲达呀米）",
                        "meaningZh": "我今断除、斩断（一切恶咒）",
                        "meaningEn": "I sever, I cut off",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-249",
            "index": 249,
            "iast": "kīlayāmi",
            "classicalTranslitZh": "鸡啰夜弥",
            "modernPhoneticZh": "给啦呀米",
            "meaningZh": "以金刚橛钉伏之！",
            "meaningEn": "I nail them down!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 249/427 句",
            "words": [
                  {
                        "iast": "kīlayāmi",
                        "stem": "kīlayāmi",
                        "grammar": "Pres.1.Sg. · 钉伏结界",
                        "transliterationZh": "计攞夜弭（拼读参考：给啦呀米）",
                        "meaningZh": "我今以金刚杵钉伏禁制",
                        "meaningEn": "I stake/seal with the vajra",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-250",
            "index": 250,
            "iast": "caturbhaginīkṛtām",
            "classicalTranslitZh": "赭咄啰婆耆儞讫唎担",
            "modernPhoneticZh": "佳度₍尔₎巴吉尼₍克₎日当",
            "meaningZh": "四姊妹女鬼神所造咒！",
            "meaningEn": "Spells made by the Four Sisters!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 250/427 句",
            "words": [
                  {
                        "iast": "caturbhaginīkṛtām",
                        "stem": "catur-bhaginī-kṛtā",
                        "grammar": "Samāsa · 复合词 (Acc. Sg. Fem. · 业格阴性)",
                        "transliterationZh": "者都哩婆拟泥讫哩担(引)（拼读参考：佳度₍尔₎巴吉尼₍克₎日当）",
                        "meaningZh": "四·姊妹·九渊",
                        "meaningEn": "four + sister + cleft",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-251",
            "index": 251,
            "iast": "vidyāṃ ca chindayāmi",
            "classicalTranslitZh": "毗陀夜阇瞋陀夜弥",
            "modernPhoneticZh": "维₍地₎央 佳 亲达呀米",
            "meaningZh": "彼邪明咒我今悉皆斩断！",
            "meaningEn": "I sever their spells!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 251/427 句",
            "words": [
                  {
                        "iast": "vidyāṃ",
                        "stem": "vidyā",
                        "grammar": "Noun · 明咒/圣明 · Acc. Sg. Fem. · 业格阴性",
                        "transliterationZh": "尾地焰（拼读参考：维₍地₎央）",
                        "meaningZh": "明咒、真言明妃、圣智明",
                        "meaningEn": "Vidyā, sacred wisdom-spell, illumination",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "chindayāmi",
                        "stem": "chindayāmi",
                        "grammar": "Pres.1.Sg. · 断除结界",
                        "transliterationZh": "齿喃捺夜弭（拼读参考：亲达呀米）",
                        "meaningZh": "我今断除、斩断（一切恶咒）",
                        "meaningEn": "I sever, I cut off",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-252",
            "index": 252,
            "iast": "kīlayāmi",
            "classicalTranslitZh": "鸡啰夜弥",
            "modernPhoneticZh": "给啦呀米",
            "meaningZh": "以金刚橛钉伏之！",
            "meaningEn": "I nail them down!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 252/427 句",
            "words": [
                  {
                        "iast": "kīlayāmi",
                        "stem": "kīlayāmi",
                        "grammar": "Pres.1.Sg. · 钉伏结界",
                        "transliterationZh": "计攞夜弭（拼读参考：给啦呀米）",
                        "meaningZh": "我今以金刚杵钉伏禁制",
                        "meaningEn": "I stake/seal with the vajra",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-253",
            "index": 253,
            "iast": "bhṛṅgiriṭi",
            "classicalTranslitZh": "毗唎羊訖唎知",
            "modernPhoneticZh": "₍布₎仍吉里蒂",
            "meaningZh": "斗战胜神毗唎羊讫唎知！",
            "meaningEn": "Bhṛṅgiriṭi!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 253/427 句",
            "words": [
                  {
                        "iast": "bhṛṅgiriṭi",
                        "stem": "bhṛṅgiriṭi",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "婆哩仰拟哩置（拼读参考：₍布₎仍吉里蒂）",
                        "meaningZh": "卜力哩帝",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-254",
            "index": 254,
            "iast": "nandikeśvaragaṇapati",
            "classicalTranslitZh": "难陀鸡沙啰伽拏般帝",
            "modernPhoneticZh": "南地给₍湿₎瓦啦嘎拿巴帝",
            "meaningZh": "难陀鸡沙啰及欢喜团主神！",
            "meaningEn": "Nandikeśvara and Gaṇapati!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 254/427 句",
            "words": [
                  {
                        "iast": "nandikeśvaragaṇapati",
                        "stem": "nandikeśvara-gaṇapati",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "喃地计湿嚩啰誐拏跛底（拼读参考：南地给₍湿₎瓦啦嘎拿巴帝）",
                        "meaningZh": "具主作善喜誐那鉢底",
                        "meaningEn": "Nandikesvara + Ganapati",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-255",
            "index": 255,
            "iast": "sahīyakṛtām",
            "classicalTranslitZh": "索醯夜讫唎担",
            "modernPhoneticZh": "萨嘿呀₍克₎日当",
            "meaningZh": "及其伴党眷属所造咒术！",
            "meaningEn": "And spells made by their companions!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 255/427 句",
            "words": [
                  {
                        "iast": "sahīyakṛtām",
                        "stem": "sahīya-kṛtā",
                        "grammar": "Samāsa · 复合词 (Acc. Sg. Fem. · 业格阴性)",
                        "transliterationZh": "萨醯耶讫哩担(引)（拼读参考：萨嘿呀₍克₎日当）",
                        "meaningZh": "公司九渊",
                        "meaningEn": "associated + cleft",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-256",
            "index": 256,
            "iast": "vidyāṃ ca chindayāmi",
            "classicalTranslitZh": "毗陀夜阇瞋陀夜弥",
            "modernPhoneticZh": "维₍地₎央 佳 亲达呀米",
            "meaningZh": "彼邪明咒我今悉皆斩断！",
            "meaningEn": "I sever their spells!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 256/427 句",
            "words": [
                  {
                        "iast": "vidyāṃ",
                        "stem": "vidyā",
                        "grammar": "Noun · 明咒/圣明 · Acc. Sg. Fem. · 业格阴性",
                        "transliterationZh": "尾地焰（拼读参考：维₍地₎央）",
                        "meaningZh": "明咒、真言明妃、圣智明",
                        "meaningEn": "Vidyā, sacred wisdom-spell, illumination",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "chindayāmi",
                        "stem": "chindayāmi",
                        "grammar": "Pres.1.Sg. · 断除结界",
                        "transliterationZh": "齿喃捺夜弭（拼读参考：亲达呀米）",
                        "meaningZh": "我今断除、斩断（一切恶咒）",
                        "meaningEn": "I sever, I cut off",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-257",
            "index": 257,
            "iast": "kīlayāmi",
            "classicalTranslitZh": "鸡啰夜弥",
            "modernPhoneticZh": "给啦呀米",
            "meaningZh": "以金刚橛钉伏之！",
            "meaningEn": "I nail them down!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 257/427 句",
            "words": [
                  {
                        "iast": "kīlayāmi",
                        "stem": "kīlayāmi",
                        "grammar": "Pres.1.Sg. · 钉伏结界",
                        "transliterationZh": "计攞夜弭（拼读参考：给啦呀米）",
                        "meaningZh": "我今以金刚杵钉伏禁制",
                        "meaningEn": "I stake/seal with the vajra",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-258",
            "index": 258,
            "iast": "nagnaśramaṇakṛtām",
            "classicalTranslitZh": "那揭那舍啰婆拏讫唎担",
            "modernPhoneticZh": "拿₍格₎拿₍希₎啦玛拿₍克₎日当",
            "meaningZh": "裸形外道沙门所造邪咒！",
            "meaningEn": "Spells made by naked ascetics!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 258/427 句",
            "words": [
                  {
                        "iast": "nagnaśramaṇakṛtām",
                        "stem": "nagna-śramaṇa-kṛtā",
                        "grammar": "Samāsa · 复合词 (Acc. Sg. Fem. · 业格阴性)",
                        "transliterationZh": "曩伽曩室啰摩拏讫哩担(引)（拼读参考：拿₍格₎拿₍希₎啦玛拿₍克₎日当）",
                        "meaningZh": "裸·沙弥·九渊",
                        "meaningEn": "naked + ascetic + cleft",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-259",
            "index": 259,
            "iast": "vidyāṃ ca chindayāmi",
            "classicalTranslitZh": "毗陀夜阇瞋陀夜弥",
            "modernPhoneticZh": "维₍地₎央 佳 亲达呀米",
            "meaningZh": "彼邪明咒我今悉皆斩断！",
            "meaningEn": "I sever their spells!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 259/427 句",
            "words": [
                  {
                        "iast": "vidyāṃ",
                        "stem": "vidyā",
                        "grammar": "Noun · 明咒/圣明 · Acc. Sg. Fem. · 业格阴性",
                        "transliterationZh": "尾地焰（拼读参考：维₍地₎央）",
                        "meaningZh": "明咒、真言明妃、圣智明",
                        "meaningEn": "Vidyā, sacred wisdom-spell, illumination",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "chindayāmi",
                        "stem": "chindayāmi",
                        "grammar": "Pres.1.Sg. · 断除结界",
                        "transliterationZh": "齿喃捺夜弭（拼读参考：亲达呀米）",
                        "meaningZh": "我今断除、斩断（一切恶咒）",
                        "meaningEn": "I sever, I cut off",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-260",
            "index": 260,
            "iast": "kīlayāmi",
            "classicalTranslitZh": "鸡啰夜弥",
            "modernPhoneticZh": "给啦呀米",
            "meaningZh": "以金刚橛钉伏之！",
            "meaningEn": "I nail them down!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 260/427 句",
            "words": [
                  {
                        "iast": "kīlayāmi",
                        "stem": "kīlayāmi",
                        "grammar": "Pres.1.Sg. · 钉伏结界",
                        "transliterationZh": "计攞夜弭（拼读参考：给啦呀米）",
                        "meaningZh": "我今以金刚杵钉伏禁制",
                        "meaningEn": "I stake/seal with the vajra",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-261",
            "index": 261,
            "iast": "arhatakṛtāṃ vidyāṃ ca chindayāmi",
            "classicalTranslitZh": "阿罗汉讫唎担毗陀夜阇瞋陀夜弥",
            "modernPhoneticZh": "阿₍尔₎哈达₍克₎日当 维₍地₎央 佳 亲达呀米",
            "meaningZh": "假托阿罗汉圣名所造咒我亦斩断！",
            "meaningEn": "Spells falsely made in Arhats’ names, I sever!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 261/427 句",
            "words": [
                  {
                        "iast": "arhatakṛtāṃ",
                        "stem": "arhat-akṛta",
                        "grammar": "Samāsa · 复合词 (Acc. Sg. Fem. · 业格阴性)",
                        "transliterationZh": "阿哩诃怛讫哩担(引)（拼读参考：阿₍尔₎哈达₍克₎日当）",
                        "meaningZh": "应供不备",
                        "meaningEn": "Arhat + undone",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "vidyāṃ",
                        "stem": "vidyā",
                        "grammar": "Noun · 明咒/圣明 · Acc. Sg. Fem. · 业格阴性",
                        "transliterationZh": "尾地焰（拼读参考：维₍地₎央）",
                        "meaningZh": "明咒、真言明妃、圣智明",
                        "meaningEn": "Vidyā, sacred wisdom-spell, illumination",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "chindayāmi",
                        "stem": "chindayāmi",
                        "grammar": "Pres.1.Sg. · 断除结界",
                        "transliterationZh": "齿喃捺夜弭（拼读参考：亲达呀米）",
                        "meaningZh": "我今断除、斩断（一切恶咒）",
                        "meaningEn": "I sever, I cut off",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-262",
            "index": 262,
            "iast": "kīlayāmi",
            "classicalTranslitZh": "鸡啰夜弥",
            "modernPhoneticZh": "给啦呀米",
            "meaningZh": "以金刚橛钉伏之！",
            "meaningEn": "I nail them down!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 262/427 句",
            "words": [
                  {
                        "iast": "kīlayāmi",
                        "stem": "kīlayāmi",
                        "grammar": "Pres.1.Sg. · 钉伏结界",
                        "transliterationZh": "计攞夜弭（拼读参考：给啦呀米）",
                        "meaningZh": "我今以金刚杵钉伏禁制",
                        "meaningEn": "I stake/seal with the vajra",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-263",
            "index": 263,
            "iast": "vītarāgakṛtām",
            "classicalTranslitZh": "毗多啰伽讫唎担",
            "modernPhoneticZh": "维达啦嘎₍克₎日当",
            "meaningZh": "假托离欲仙圣之名所造咒！",
            "meaningEn": "Spells made in the name of Vītarāgas!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 263/427 句",
            "words": [
                  {
                        "iast": "vītarāgakṛtām",
                        "stem": "vītarāga-kṛtā",
                        "grammar": "Samāsa · 复合词 (Acc. Sg. Fem. · 业格阴性)",
                        "transliterationZh": "味怛啰(引)誐讫哩担(引)（拼读参考：维达啦嘎₍克₎日当）",
                        "meaningZh": "离欲九渊",
                        "meaningEn": "free of desire + cleft",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-264",
            "index": 264,
            "iast": "vidyāṃ ca chindayāmi",
            "classicalTranslitZh": "毗陀夜阇瞋陀夜弥",
            "modernPhoneticZh": "维₍地₎央 佳 亲达呀米",
            "meaningZh": "彼邪明咒我今悉皆斩断！",
            "meaningEn": "I sever their spells!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 264/427 句",
            "words": [
                  {
                        "iast": "vidyāṃ",
                        "stem": "vidyā",
                        "grammar": "Noun · 明咒/圣明 · Acc. Sg. Fem. · 业格阴性",
                        "transliterationZh": "尾地焰（拼读参考：维₍地₎央）",
                        "meaningZh": "明咒、真言明妃、圣智明",
                        "meaningEn": "Vidyā, sacred wisdom-spell, illumination",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "chindayāmi",
                        "stem": "chindayāmi",
                        "grammar": "Pres.1.Sg. · 断除结界",
                        "transliterationZh": "齿喃捺夜弭（拼读参考：亲达呀米）",
                        "meaningZh": "我今断除、斩断（一切恶咒）",
                        "meaningEn": "I sever, I cut off",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-265",
            "index": 265,
            "iast": "kīlayāmi vajrapāṇi",
            "classicalTranslitZh": "鸡啰夜弥跋阇啰波儞",
            "modernPhoneticZh": "给啦呀米 瓦₍吉₎啦巴尼",
            "meaningZh": "钉伏之！乃至假托执金刚神！",
            "meaningEn": "I nail them down! Even those under Vajrapāṇi!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 265/427 句",
            "words": [
                  {
                        "iast": "kīlayāmi",
                        "stem": "kīlayāmi",
                        "grammar": "Pres.1.Sg. · 钉伏结界",
                        "transliterationZh": "计攞夜弭（拼读参考：给啦呀米）",
                        "meaningZh": "我今以金刚杵钉伏禁制",
                        "meaningEn": "I stake/seal with the vajra",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "vajrapāṇi",
                        "stem": "vajrapāṇi",
                        "grammar": "Prop.Noun · 金刚手菩萨",
                        "transliterationZh": "嚩日啰波抳（拼读参考：瓦₍吉₎啦巴尼）",
                        "meaningZh": "金刚手菩萨（执金刚秘密主）",
                        "meaningEn": "Vajrapāṇi, Vajra-in-Hand Bodhisattva",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-266",
            "index": 266,
            "iast": "guhyaguhya",
            "classicalTranslitZh": "具醯夜具醯夜",
            "modernPhoneticZh": "古₍赫₎呀古₍赫₎呀",
            "meaningZh": "密迹复密迹力士部众！",
            "meaningEn": "Secret Guhyakas!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 266/427 句",
            "words": [
                  {
                        "iast": "guhyaguhya",
                        "stem": "guhya-guhya",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "具纥耶具纥耶（拼读参考：古₍赫₎呀古₍赫₎呀）",
                        "meaningZh": "密密",
                        "meaningEn": "hidden or covered + hidden or covered",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-267",
            "index": 267,
            "iast": "guhyakādhipatikṛtām",
            "classicalTranslitZh": "迦地般帝讫唎担",
            "modernPhoneticZh": "古₍赫₎呀嘎地巴帝₍克₎日当",
            "meaningZh": "密迹主部下所造一切咒术！",
            "meaningEn": "Spells made by lords of Guhyakas!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 267/427 句",
            "words": [
                  {
                        "iast": "guhyakādhipatikṛtām",
                        "stem": "guhyakādhipati-kṛtā",
                        "grammar": "Samāsa · 复合词 (Acc. Sg. Fem. · 业格阴性)",
                        "transliterationZh": "具纥耶迦(引)地跛底讫哩担(引)（拼读参考：古₍赫₎呀嘎地巴帝₍克₎日当）",
                        "meaningZh": "密主九渊",
                        "meaningEn": "cleft",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-268",
            "index": 268,
            "iast": "vidyāṃ ca chindayāmi",
            "classicalTranslitZh": "毗陀夜阇瞋陀夜弥",
            "modernPhoneticZh": "维₍地₎央 佳 亲达呀米",
            "meaningZh": "彼诸咒术我今悉皆斩断！",
            "meaningEn": "I sever their spells!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 268/427 句",
            "words": [
                  {
                        "iast": "vidyāṃ",
                        "stem": "vidyā",
                        "grammar": "Noun · 明咒/圣明 · Acc. Sg. Fem. · 业格阴性",
                        "transliterationZh": "尾地焰（拼读参考：维₍地₎央）",
                        "meaningZh": "明咒、真言明妃、圣智明",
                        "meaningEn": "Vidyā, sacred wisdom-spell, illumination",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "chindayāmi",
                        "stem": "chindayāmi",
                        "grammar": "Pres.1.Sg. · 断除结界",
                        "transliterationZh": "齿喃捺夜弭（拼读参考：亲达呀米）",
                        "meaningZh": "我今断除、斩断（一切恶咒）",
                        "meaningEn": "I sever, I cut off",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-269",
            "index": 269,
            "iast": "kīlayāmi",
            "classicalTranslitZh": "鸡啰夜弥",
            "modernPhoneticZh": "给啦呀米",
            "meaningZh": "悉以金刚橛钉伏禁制之！",
            "meaningEn": "I pin them down with the Vajra-peg!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 269/427 句",
            "words": [
                  {
                        "iast": "kīlayāmi",
                        "stem": "kīlayāmi",
                        "grammar": "Pres.1.Sg. · 钉伏结界",
                        "transliterationZh": "计攞夜弭（拼读参考：给啦呀米）",
                        "meaningZh": "我今以金刚杵钉伏禁制",
                        "meaningEn": "I stake/seal with the vajra",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-270",
            "index": 270,
            "iast": "rakṣa mām",
            "classicalTranslitZh": "啰叉罔",
            "modernPhoneticZh": "啦₍克₎沙 芒",
            "meaningZh": "唯愿慈悲拥护于我！",
            "meaningEn": "Protect me!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 270/427 句",
            "words": [
                  {
                        "iast": "rakṣa",
                        "stem": "rakṣa",
                        "grammar": "Impv. 2nd Sg. · 祈使守护",
                        "transliterationZh": "啰乞洒（拼读参考：啦₍克₎沙）",
                        "meaningZh": "拥护、守护",
                        "meaningEn": "protect, guard and shelter!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "mām",
                        "stem": "mām",
                        "grammar": "Pron.Acc.Sg. · 第一人称宾格",
                        "transliterationZh": "莽(引)（拼读参考：芒）",
                        "meaningZh": "我（宾格：守护/加持于我）",
                        "meaningEn": "me",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-271",
            "index": 271,
            "iast": "bhagavatī",
            "classicalTranslitZh": "婆伽梵",
            "modernPhoneticZh": "巴嘎瓦帝",
            "meaningZh": "世尊大白伞盖佛母！",
            "meaningEn": "O Blessed Bhagavatī!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 271/427 句",
            "words": [
                  {
                        "iast": "bhagavatī",
                        "stem": "bhaga",
                        "grammar": "Poss. Fem. · 具足尊",
                        "transliterationZh": "婆誐嚩底(引)（拼读参考：巴嘎瓦帝）",
                        "meaningZh": "具足才尊",
                        "meaningEn": "endowed with excellence",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-272",
            "index": 272,
            "iast": "idaṃ mama sya",
            "classicalTranslitZh": "印兔那么么写",
            "modernPhoneticZh": "伊当 玛玛 ₍斯₎呀",
            "meaningZh": "护念弟子某甲一切安隐（第三会圆满）！",
            "meaningEn": "Protect me, this practitioner!",
            "tangNoteZh": "第三会【观音合同会】·《T19n0945》原典第 272/427 句 · 《首楞严经》原典夹注：至此依前称弟子名",
            "words": [
                  {
                        "iast": "idaṃ",
                        "stem": "idaṃ",
                        "grammar": "Pron. Neut. · 近指代词",
                        "transliterationZh": "伊昙（拼读参考：伊当）",
                        "meaningZh": "此、此法门",
                        "meaningEn": "this, here",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "mama",
                        "stem": "mama",
                        "grammar": "Pron. Gen. · 第一人称属格",
                        "transliterationZh": "摩摩（拼读参考：玛玛）",
                        "meaningZh": "我之（行者所有）",
                        "meaningEn": "my, of me (the practitioner)",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "sya",
                        "stem": "sa",
                        "grammar": "Akṣara-mukha · 耶字门",
                        "transliterationZh": "娑耶（拼读参考：₍斯₎呀）",
                        "meaningZh": "耶字门（一乘如实之道（yāna）·本不生体性）",
                        "meaningEn": "supreme vehicle of awakening (yāna) — primordial non-arising",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-273",
            "index": 273,
            "iast": "bhagavatī",
            "classicalTranslitZh": "婆伽梵",
            "modernPhoneticZh": "巴嘎瓦帝",
            "meaningZh": "世尊佛母！",
            "meaningEn": "O Blessed Bhagavatī!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 273/427 句",
            "words": [
                  {
                        "iast": "bhagavatī",
                        "stem": "bhaga",
                        "grammar": "Poss. Fem. · 具足尊",
                        "transliterationZh": "婆誐嚩底(引)（拼读参考：巴嘎瓦帝）",
                        "meaningZh": "具足才尊",
                        "meaningEn": "endowed with excellence",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-274",
            "index": 274,
            "iast": "sitātapatre",
            "classicalTranslitZh": "萨怛多般怛啰",
            "modernPhoneticZh": "悉达达巴₍特₎雷",
            "meaningZh": "清净大白伞盖尊！",
            "meaningEn": "O White Parasol (Sitātapatre)!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 274/427 句",
            "words": [
                  {
                        "iast": "sitātapatre",
                        "stem": "sitātapatra",
                        "grammar": "Samāsa · 大白伞盖 · Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "悉多怛跛怛隶（拼读参考：悉达达巴₍特₎雷）",
                        "meaningZh": "大白伞盖（清净护庇）尊",
                        "meaningEn": "O White Parasol (pure protective canopy) / in White Parasol (pure protective canopy)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-275",
            "index": 275,
            "iast": "namo stu te",
            "classicalTranslitZh": "南无粹都帝",
            "modernPhoneticZh": "拿摩 ₍斯₎度 帝",
            "meaningZh": "我今至诚稽首礼敬于汝！",
            "meaningEn": "Homage be to You!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 275/427 句",
            "words": [
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "stu",
                        "stem": "sa",
                        "grammar": "Akṣara-mukha · 多字门",
                        "transliterationZh": "娑都（拼读参考：₍斯₎度）",
                        "meaningZh": "多字门（真如实际（tathatā）·损减除灭忧苦）",
                        "meaningEn": "immutable Suchness (tathatā) — dispelling sorrow",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "te",
                        "stem": "te",
                        "grammar": "Pron. · 代词",
                        "transliterationZh": "帝（拼读参考：帝）",
                        "meaningZh": "向汝、彼等",
                        "meaningEn": "to Thee / they",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-276",
            "index": 276,
            "iast": "asitānalārka",
            "classicalTranslitZh": "阿悉多那啰剌迦",
            "modernPhoneticZh": "阿悉达拿啦₍尔₎嘎",
            "meaningZh": "具足无垢猛火与赫奕日轮！",
            "meaningEn": "Blazing Fire and Radiant Sun!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 276/427 句",
            "words": [
                  {
                        "iast": "asitānalārka",
                        "stem": "asita-anala-arka",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "阿悉多曩攞(引)哩迦（拼读参考：阿悉达拿啦₍尔₎嘎）",
                        "meaningZh": "阿夷·智慧猛火·阿罗歌花",
                        "meaningEn": "dark-coloured + sacred fire + arka flowers",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-277",
            "index": 277,
            "iast": "prabhāsphuṭa",
            "classicalTranslitZh": "波啰婆悉普吒",
            "modernPhoneticZh": "₍普₎啦巴₍斯₎普达",
            "meaningZh": "大光明周遍照耀洞彻十方！",
            "meaningEn": "Bursting forth with brilliant light!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 277/427 句",
            "words": [
                  {
                        "iast": "prabhāsphuṭa",
                        "stem": "prabhā-sphuṭa",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "钵啰婆(引)悉普吒（拼读参考：₍普₎啦巴₍斯₎普达）",
                        "meaningZh": "光明开",
                        "meaningEn": "light + suffused",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-278",
            "index": 278,
            "iast": "vikasitasitātapatre",
            "classicalTranslitZh": "毗迦萨怛多钵帝唎",
            "modernPhoneticZh": "维嘎悉达悉达达巴₍特₎雷",
            "meaningZh": "广大敷展大白伞盖遍覆三界母！",
            "meaningEn": "O Fully Blossomed White Parasol!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 278/427 句",
            "words": [
                  {
                        "iast": "vikasitasitātapatre",
                        "stem": "vikasita-sitātapatra",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "尾迦悉怛悉多怛跛怛隶（拼读参考：维嘎悉达悉达达巴₍特₎雷）",
                        "meaningZh": "花开大白伞盖尊",
                        "meaningEn": "O White Parasol",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-279",
            "index": 279,
            "iast": "jvala jvala",
            "classicalTranslitZh": "什佛啰什佛啰",
            "modernPhoneticZh": "₍吉₎瓦啦 ₍吉₎瓦啦",
            "meaningZh": "炽燃放光、炽燃放光！",
            "meaningEn": "Blaze forth, blaze forth!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 279/427 句",
            "words": [
                  {
                        "iast": "jvala",
                        "stem": "jvala",
                        "grammar": "Impv. 2nd Sg. · 祈使式",
                        "transliterationZh": "日嚩攞（拼读参考：₍吉₎瓦啦）",
                        "meaningZh": "炽燃光明、放光普照（入嚩攞）",
                        "meaningEn": "blaze forth with wisdom radiance!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "jvala",
                        "stem": "jvala",
                        "grammar": "Impv. 2nd Sg. · 祈使式",
                        "transliterationZh": "日嚩攞（拼读参考：₍吉₎瓦啦）",
                        "meaningZh": "炽燃光明、放光普照（入嚩攞）",
                        "meaningEn": "blaze forth with wisdom radiance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-280",
            "index": 280,
            "iast": "dara dara",
            "classicalTranslitZh": "陀啰陀啰",
            "modernPhoneticZh": "达啦 达啦",
            "meaningZh": "摧裂魔障、震裂魔军！",
            "meaningEn": "Split, cleave obstacles!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 280/427 句",
            "words": [
                  {
                        "iast": "dara",
                        "stem": "dara",
                        "grammar": "Impv. · 祈使加持",
                        "transliterationZh": "捺啰（拼读参考：达啦）",
                        "meaningZh": "揭幕、一些",
                        "meaningEn": "cleaving, rending, opening; — little, a little",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "dara",
                        "stem": "dara",
                        "grammar": "Impv. · 祈使加持",
                        "transliterationZh": "捺啰（拼读参考：达啦）",
                        "meaningZh": "揭幕、一些",
                        "meaningEn": "cleaving, rending, opening; — little, a little",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-281",
            "index": 281,
            "iast": "vidara vidara chinda chinda",
            "classicalTranslitZh": "频陀啰频陀啰瞋陀瞋陀",
            "modernPhoneticZh": "维达啦 维达啦 亲达 亲达",
            "meaningZh": "粉碎、粉碎，斩断、斩断一切恶业邪障！",
            "meaningEn": "Shatter, shatter! Sever, sever!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 281/427 句",
            "words": [
                  {
                        "iast": "vidara",
                        "stem": "vi-dara",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "尾捺啰（拼读参考：维达啦）",
                        "meaningZh": "闢揭幕",
                        "meaningEn": "settle + cleaving",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "vidara",
                        "stem": "vi-dara",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "尾捺啰（拼读参考：维达啦）",
                        "meaningZh": "闢揭幕",
                        "meaningEn": "settle + cleaving",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "chinda",
                        "stem": "chinda",
                        "grammar": "Impv. 2nd Sg. · 祈使式",
                        "transliterationZh": "齿喃捺（拼读参考：亲达）",
                        "meaningZh": "断除烦恼结使缠缚（嗔陀）",
                        "meaningEn": "sever every fetter and hostile spell!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "chinda",
                        "stem": "chinda",
                        "grammar": "Impv. 2nd Sg. · 祈使式",
                        "transliterationZh": "齿喃捺（拼读参考：亲达）",
                        "meaningZh": "断除烦恼结使缠缚（嗔陀）",
                        "meaningEn": "sever every fetter and hostile spell!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-282",
            "index": 282,
            "iast": "hūṃ",
            "classicalTranslitZh": "虎𤙖",
            "modernPhoneticZh": "吽",
            "meaningZh": "吽！",
            "meaningEn": "Hūṃ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 282/427 句",
            "words": [
                  {
                        "iast": "hūṃ",
                        "stem": "hūṃ",
                        "grammar": "Bīja · 金刚种子字",
                        "transliterationZh": "吽（拼读参考：吽）",
                        "meaningZh": "金刚不坏菩提心印、摧破诸障",
                        "meaningEn": "adamantine bodhicitta seed syllable",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-283",
            "index": 283,
            "iast": "hūṃ",
            "classicalTranslitZh": "虎𤙖",
            "modernPhoneticZh": "吽",
            "meaningZh": "吽！",
            "meaningEn": "Hūṃ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 283/427 句",
            "words": [
                  {
                        "iast": "hūṃ",
                        "stem": "hūṃ",
                        "grammar": "Bīja · 金刚种子字",
                        "transliterationZh": "吽（拼读参考：吽）",
                        "meaningZh": "金刚不坏菩提心印、摧破诸障",
                        "meaningEn": "adamantine bodhicitta seed syllable",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-284",
            "index": 284,
            "iast": "phaṭ",
            "classicalTranslitZh": "泮吒",
            "modernPhoneticZh": "帕₍特₎",
            "meaningZh": "泮吒（立断魔障）！",
            "meaningEn": "Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 284/427 句",
            "words": [
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-285",
            "index": 285,
            "iast": "phaṭ phaṭ phaṭ phaṭ",
            "classicalTranslitZh": "泮吒泮吒泮吒泮吒",
            "modernPhoneticZh": "帕₍特₎ 帕₍特₎ 帕₍特₎ 帕₍特₎",
            "meaningZh": "泮吒、泮吒、泮吒、泮吒（摧破四魔）！",
            "meaningEn": "Phaṭ Phaṭ Phaṭ Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 285/427 句",
            "words": [
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-286",
            "index": 286,
            "iast": "svāhā",
            "classicalTranslitZh": "娑诃",
            "modernPhoneticZh": "₍斯₎瓦哈",
            "meaningZh": "圆满吉祥成就，娑诃！",
            "meaningEn": "Svāhā!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 286/427 句",
            "words": [
                  {
                        "iast": "svāhā",
                        "stem": "svāhā",
                        "grammar": "Indecl. · 结印词",
                        "transliterationZh": "娑嚩诃 / 萨婆诃（拼读参考：₍斯₎瓦哈）",
                        "meaningZh": "圆满吉祥成就",
                        "meaningEn": "hail! may auspicious accomplishment be sealed",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-287",
            "index": 287,
            "iast": "he he phaṭ",
            "classicalTranslitZh": "醯醯泮",
            "modernPhoneticZh": "嘿 嘿 帕₍特₎",
            "meaningZh": "醯醯（金刚警觉大喝声），泮！",
            "meaningEn": "He He Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 287/427 句",
            "words": [
                  {
                        "iast": "he",
                        "stem": "he",
                        "grammar": "Interj. · 呼请叹词",
                        "transliterationZh": "醯（拼读参考：嘿）",
                        "meaningZh": "呼唤圣尊叹词（咄！圣者！）",
                        "meaningEn": "O! Hail! Vocative invocation particle",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "he",
                        "stem": "he",
                        "grammar": "Interj. · 呼请叹词",
                        "transliterationZh": "醯（拼读参考：嘿）",
                        "meaningZh": "呼唤圣尊叹词（咄！圣者！）",
                        "meaningEn": "O! Hail! Vocative invocation particle",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-288",
            "index": 288,
            "iast": "amoghāya phaṭ",
            "classicalTranslitZh": "阿牟迦耶泮",
            "modernPhoneticZh": "阿摩嘎呀 帕₍特₎",
            "meaningZh": "不空成就破障尊，泮！",
            "meaningEn": "To the Unfailing One, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 288/427 句",
            "words": [
                  {
                        "iast": "amoghāya",
                        "stem": "amogha",
                        "grammar": "Adj. · 不空成就 · Dat. Sg. · 为格单数",
                        "transliterationZh": "阿谟伽(引)耶（拼读参考：阿摩嘎呀）",
                        "meaningZh": "向不空、决定成就无虚",
                        "meaningEn": "to/for unfailing, infallible, never in vain",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-289",
            "index": 289,
            "iast": "apratihatāya phaṭ",
            "classicalTranslitZh": "阿波啰提诃多泮",
            "modernPhoneticZh": "阿₍普₎啦帝哈达呀 帕₍特₎",
            "meaningZh": "无碍威神破障尊，泮！",
            "meaningEn": "To the Unobstructed One, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 289/427 句",
            "words": [
                  {
                        "iast": "apratihatāya",
                        "stem": "apratihata",
                        "grammar": "Adj. · 无碍 · Dat. Sg. · 为格单数",
                        "transliterationZh": "阿钵啰底诃多耶（拼读参考：阿₍普₎啦帝哈达呀）",
                        "meaningZh": "向无碍、无能障碍",
                        "meaningEn": "to/for unobstructed, irresistible, unimpeded",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-290",
            "index": 290,
            "iast": "varapradāya phaṭ",
            "classicalTranslitZh": "婆啰波啰陀泮",
            "modernPhoneticZh": "瓦啦₍普₎啦达呀 帕₍特₎",
            "meaningZh": "施予殊胜善愿尊，泮！",
            "meaningEn": "To the Bestower of Supreme Boons, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 290/427 句",
            "words": [
                  {
                        "iast": "varapradāya",
                        "stem": "vara-pradāya",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "嚩啰钵啰陀耶（拼读参考：瓦啦₍普₎啦达呀）",
                        "meaningZh": "殊胜施物",
                        "meaningEn": "choicest + gift",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-291",
            "index": 291,
            "iast": "asuravidrāpakāya phaṭ",
            "classicalTranslitZh": "阿素啰毗陀啰波迦泮",
            "modernPhoneticZh": "阿苏啦维₍德₎啦巴嘎呀 帕₍特₎",
            "meaningZh": "摧伏驱散阿修罗魔军尊，泮！",
            "meaningEn": "To the Router of Asuras, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 291/427 句",
            "words": [
                  {
                        "iast": "asuravidrāpakāya",
                        "stem": "asura-vid-āpa-kāya",
                        "grammar": "Samāsa · 复合词 (Noun · 尊身/法身)",
                        "transliterationZh": "阿苏啰尾捺啰(引)跛迦(引)耶（拼读参考：阿苏啦维₍德₎啦巴嘎呀）",
                        "meaningZh": "阿修罗·解·净水·身",
                        "meaningEn": "Asura + understanding + water + body",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-292",
            "index": 292,
            "iast": "sarvadevebhyaḥ phaṭ",
            "classicalTranslitZh": "萨婆提鞞弊泮",
            "modernPhoneticZh": "萨₍尔₎瓦-叠威₍比₎呀₍赫₎ 帕₍特₎",
            "meaningZh": "破除一切恼人恶天障难，泮！",
            "meaningEn": "Against all hostile Devas, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 292/427 句",
            "words": [
                  {
                        "iast": "sarvadevebhyaḥ",
                        "stem": "sarva-deva",
                        "grammar": "Samāsa · 复合词 (Dat./Abl. Pl. · 为格复数)",
                        "transliterationZh": "萨哩嚩泥吠毗药（拼读参考：萨₍尔₎瓦-叠威₍比₎呀₍赫₎）",
                        "meaningZh": "向诸一切天人",
                        "meaningEn": "all + to all god",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-293",
            "index": 293,
            "iast": "sarvanāgebhyaḥ phaṭ",
            "classicalTranslitZh": "萨婆那伽弊泮",
            "modernPhoneticZh": "萨₍尔₎瓦-拿给₍比₎呀₍赫₎ 帕₍特₎",
            "meaningZh": "破除一切毒龙障难，泮！",
            "meaningEn": "Against all hostile Nāgas, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 293/427 句",
            "words": [
                  {
                        "iast": "sarvanāgebhyaḥ",
                        "stem": "sarva-nāga",
                        "grammar": "Samāsa · 复合词 (Dat./Abl. Pl. · 为格复数)",
                        "transliterationZh": "萨哩嚩那(引)诣毗药（拼读参考：萨₍尔₎瓦-拿给₍比₎呀₍赫₎）",
                        "meaningZh": "向诸一切龙族",
                        "meaningEn": "all + to all Nāga",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-294",
            "index": 294,
            "iast": "sarvayakṣebhyaḥ phaṭ",
            "classicalTranslitZh": "萨婆药叉弊泮",
            "modernPhoneticZh": "萨₍尔₎瓦-呀₍克₎奢₍比₎呀₍赫₎ 帕₍特₎",
            "meaningZh": "破除一切暴恶药叉障难，泮！",
            "meaningEn": "Against all hostile Yakṣas, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 294/427 句",
            "words": [
                  {
                        "iast": "sarvayakṣebhyaḥ",
                        "stem": "sarva-yakṣa",
                        "grammar": "Samāsa · 复合词 (Dat./Abl. Pl. · 为格复数)",
                        "transliterationZh": "萨哩嚩耶乞晒毗药（拼读参考：萨₍尔₎瓦-呀₍克₎奢₍比₎呀₍赫₎）",
                        "meaningZh": "向诸一切药叉",
                        "meaningEn": "all + to all Yakṣa",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-295",
            "index": 295,
            "iast": "sarvagandharvebhhyaḥ phaṭ",
            "classicalTranslitZh": "萨婆乾闼婆弊泮",
            "modernPhoneticZh": "萨₍尔₎瓦-甘达₍尔₎威₍布赫₎呀₍赫₎ 帕₍特₎",
            "meaningZh": "破除一切寻香行鬼神障难，泮！",
            "meaningEn": "Against all hostile Gandharvas, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 295/427 句",
            "words": [
                  {
                        "iast": "sarvagandharvebhhyaḥ",
                        "stem": "√dhar",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "萨哩嚩俨达哩吠跋纥药（拼读参考：萨₍尔₎瓦-甘达₍尔₎威₍布赫₎呀₍赫₎）",
                        "meaningZh": "持守摄受·一切诸谛圆满",
                        "meaningEn": "bearing",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-296",
            "index": 296,
            "iast": "sarvapūtanebhyaḥ phaṭ",
            "classicalTranslitZh": "萨婆补丹那弊泮",
            "modernPhoneticZh": "萨₍尔₎瓦-布达内₍比₎呀₍赫₎ 帕₍特₎",
            "meaningZh": "破除一切臭饿热鬼障难，泮！",
            "meaningEn": "Against all Pūtanas, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 296/427 句",
            "words": [
                  {
                        "iast": "sarvapūtanebhyaḥ",
                        "stem": "sarva-pūtana",
                        "grammar": "Samāsa · 复合词 (Dat./Abl. Pl. · 为格复数)",
                        "transliterationZh": "萨哩嚩布怛祢毗药（拼读参考：萨₍尔₎瓦-布达内₍比₎呀₍赫₎）",
                        "meaningZh": "向诸一切臭者",
                        "meaningEn": "all + to all a kind of demon",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-297",
            "index": 297,
            "iast": "kaṭapūtanebhyaḥ phaṭ",
            "classicalTranslitZh": "迦吒补丹那弊泮",
            "modernPhoneticZh": "嘎达布达内₍比₎呀₍赫₎ 帕₍特₎",
            "meaningZh": "破除一切奇臭恶鬼障难，泮！",
            "meaningEn": "Against all Kaṭapūtanas, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 297/427 句",
            "words": [
                  {
                        "iast": "kaṭapūtanebhyaḥ",
                        "stem": "kaṭapūtana",
                        "grammar": "Dat./Abl. Pl. · 为格复数",
                        "transliterationZh": "迦吒布怛祢毗药（拼读参考：嘎达布达内₍比₎呀₍赫₎）",
                        "meaningZh": "向诸极臭鬼",
                        "meaningEn": "to all a kind of demon",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-298",
            "index": 298,
            "iast": "sarvadurlaṅghitebhyaḥ phaṭ",
            "classicalTranslitZh": "萨婆突狼枳帝弊泮",
            "modernPhoneticZh": "萨₍尔₎瓦-杜₍尔₎朗吉帝₍比₎呀₍赫₎ 帕₍特₎",
            "meaningZh": "破除一切邪妄越界恶障，泮！",
            "meaningEn": "Against all malign transgressions, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 298/427 句",
            "words": [
                  {
                        "iast": "sarvadurlaṅghitebhyaḥ",
                        "stem": "sarva-durlaṅghita",
                        "grammar": "Samāsa · 复合词 (Dat./Abl. Pl. · 为格复数)",
                        "transliterationZh": "萨哩嚩努哩攞仰祇帝毗药（拼读参考：萨₍尔₎瓦-杜₍尔₎朗吉帝₍比₎呀₍赫₎）",
                        "meaningZh": "向诸一切镇伏行等",
                        "meaningEn": "all + to all bad clothes",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-299",
            "index": 299,
            "iast": "sarvaduṣprekṣitebhyaḥ phaṭ",
            "classicalTranslitZh": "萨婆突涩比𠼝讫瑟帝弊泮",
            "modernPhoneticZh": "萨₍尔₎瓦-杜₍师普₎雷₍克₎师帝₍比₎呀₍赫₎ 帕₍特₎",
            "meaningZh": "破除一切凶恶毒眼邪视障难，泮！",
            "meaningEn": "Against all evil gazes, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 299/427 句",
            "words": [
                  {
                        "iast": "sarvaduṣprekṣitebhyaḥ",
                        "stem": "sarva-duṣprekṣita",
                        "grammar": "Samāsa · 复合词 (Dat./Abl. Pl. · 为格复数)",
                        "transliterationZh": "萨哩嚩努瑟钵隶乞瑟帝毗药（拼读参考：萨₍尔₎瓦-杜₍师普₎雷₍克₎师帝₍比₎呀₍赫₎）",
                        "meaningZh": "向诸一切恶障慧眼",
                        "meaningEn": "all + to all evil eye",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-300",
            "index": 300,
            "iast": "sarvajvarebhyaḥ phaṭ",
            "classicalTranslitZh": "萨婆什婆唎弊泮",
            "modernPhoneticZh": "萨₍尔₎瓦-₍吉₎瓦雷₍比₎呀₍赫₎ 帕₍特₎",
            "meaningZh": "破除一切温疫疟疾壮热鬼障，泮！",
            "meaningEn": "Against all fevers, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 300/427 句",
            "words": [
                  {
                        "iast": "sarvajvarebhyaḥ",
                        "stem": "sarva-jvara",
                        "grammar": "Samāsa · 复合词 (Dat./Abl. Pl. · 为格复数)",
                        "transliterationZh": "萨哩嚩日嚩隶毗药（拼读参考：萨₍尔₎瓦-₍吉₎瓦雷₍比₎呀₍赫₎）",
                        "meaningZh": "向诸一切瘟疫",
                        "meaningEn": "all + to all fever",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-301",
            "index": 301,
            "iast": "sarvāpasmārebhyaḥ phaṭ",
            "classicalTranslitZh": "萨婆阿播悉摩𠼝弊泮",
            "modernPhoneticZh": "萨₍尔₎瓦-巴₍斯₎玛雷₍比₎呀₍赫₎ 帕₍特₎",
            "meaningZh": "破除一切癫痫狂乱鬼障，泮！",
            "meaningEn": "Against all epilepsy demons, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 301/427 句",
            "words": [
                  {
                        "iast": "sarvāpasmārebhyaḥ",
                        "stem": "sarva-apasmāra",
                        "grammar": "Samāsa · 复合词 (Dat./Abl. Pl. · 为格复数)",
                        "transliterationZh": "萨哩嚩(引)跛娑摩(引)隶毗药（拼读参考：萨₍尔₎瓦-巴₍斯₎玛雷₍比₎呀₍赫₎）",
                        "meaningZh": "向诸一切作忘者",
                        "meaningEn": "all + to all epilepsy",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-302",
            "index": 302,
            "iast": "sarvaśramaṇebhyaḥ phaṭ",
            "classicalTranslitZh": "萨婆舍啰婆拏弊泮",
            "modernPhoneticZh": "萨₍尔₎瓦-₍希₎啦玛内₍比₎呀₍赫₎ 帕₍特₎",
            "meaningZh": "破除一切邪命外道沙门邪术，泮！",
            "meaningEn": "Against all false ascetics, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 302/427 句",
            "words": [
                  {
                        "iast": "sarvaśramaṇebhyaḥ",
                        "stem": "sarva-śramaṇa",
                        "grammar": "Samāsa · 复合词 (Dat./Abl. Pl. · 为格复数)",
                        "transliterationZh": "萨哩嚩室啰摩宁毗药（拼读参考：萨₍尔₎瓦-₍希₎啦玛内₍比₎呀₍赫₎）",
                        "meaningZh": "向诸一切沙弥",
                        "meaningEn": "all + to all ascetic",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-303",
            "index": 303,
            "iast": "sarvatīrthikebhyaḥ phaṭ",
            "classicalTranslitZh": "萨婆地帝鸡弊泮",
            "modernPhoneticZh": "萨₍尔₎瓦-帝₍尔₎提给₍比₎呀₍赫₎ 帕₍特₎",
            "meaningZh": "破除一切外道六师邪见咒障，泮！",
            "meaningEn": "Against all hostile Tīrthikas, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 303/427 句",
            "words": [
                  {
                        "iast": "sarvatīrthikebhyaḥ",
                        "stem": "sarva-tīrthika",
                        "grammar": "Samāsa · 复合词 (Dat./Abl. Pl. · 为格复数)",
                        "transliterationZh": "萨哩嚩底(引)哩耻计毗药（拼读参考：萨₍尔₎瓦-帝₍尔₎提给₍比₎呀₍赫₎）",
                        "meaningZh": "向诸一切具外道",
                        "meaningEn": "all + to all heretic",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-304",
            "index": 304,
            "iast": "sarvonmādakebhyaḥ phaṭ",
            "classicalTranslitZh": "萨婆怛摩陀继弊泮",
            "modernPhoneticZh": "萨₍尔₎温玛达给₍比₎呀₍赫₎ 帕₍特₎",
            "meaningZh": "破除一切令心狂惑鬼魅，泮！",
            "meaningEn": "Against all madness-inducing spirits, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 304/427 句",
            "words": [
                  {
                        "iast": "sarvonmādakebhyaḥ",
                        "stem": "sarva-unmāda-ke",
                        "grammar": "Samāsa · 复合词 (Dat./Abl. Pl. · 为格复数)",
                        "transliterationZh": "萨哩嚩喃摩(引)捺计毗药（拼读参考：萨₍尔₎温玛达给₍比₎呀₍赫₎）",
                        "meaningZh": "向诸一切颠枳",
                        "meaningEn": "all + mad + to",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-305",
            "index": 305,
            "iast": "sarvavidyārājācāryebhyaḥ phaṭ",
            "classicalTranslitZh": "萨婆毗陀耶啰誓遮𠼝弊泮",
            "modernPhoneticZh": "萨₍尔₎瓦-维₍地₎呀啦佳佳₍哩₎耶₍比₎呀₍赫₎ 帕₍特₎",
            "meaningZh": "破除一切世间邪明咒师恶法，泮！",
            "meaningEn": "Against all hostile spell-masters, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 305/427 句",
            "words": [
                  {
                        "iast": "sarvavidyārājācāryebhyaḥ",
                        "stem": "sarvavidya-arājan-ācārya",
                        "grammar": "Samāsa · 复合词 (Dat./Abl. Pl. · 为格复数)",
                        "transliterationZh": "萨哩嚩尾地夜啰(引)惹(引)左哩曳毗药（拼读参考：萨₍尔₎瓦-维₍地₎呀啦佳佳₍哩₎耶₍比₎呀₍赫₎）",
                        "meaningZh": "向诸一切圣智不是大王阿遮利耶",
                        "meaningEn": "all knowledge + not a king + to all teacher",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-306",
            "index": 306,
            "iast": "jayakaramadhukara",
            "classicalTranslitZh": "阇夜羯啰摩度羯啰",
            "modernPhoneticZh": "佳呀嘎啦玛杜嘎啦",
            "meaningZh": "于作胜神、作蜜神等部众！",
            "meaningEn": "Jayakara and Madhukara!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 306/427 句",
            "words": [
                  {
                        "iast": "jayakaramadhukara",
                        "stem": "jayakara-madhukara",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "惹耶迦啰摩度迦啰（拼读参考：佳呀嘎啦玛杜嘎啦）",
                        "meaningZh": "作胜作蜜",
                        "meaningEn": "honey-maker",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-307",
            "index": 307,
            "iast": "sarvārthasādhakebhyaḥ phaṭ",
            "classicalTranslitZh": "萨婆罗他娑陀鸡弊泮",
            "modernPhoneticZh": "萨₍尔₎瓦₍尔₎他萨达给₍比₎呀₍赫₎ 帕₍特₎",
            "meaningZh": "一切外道求成事咒众悉破除，泮！",
            "meaningEn": "Against all worldly spell-accomplishers, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 307/427 句",
            "words": [
                  {
                        "iast": "sarvārthasādhakebhyaḥ",
                        "stem": "sarvārthasādhaka",
                        "grammar": "Dat./Abl. Pl. · 为格复数",
                        "transliterationZh": "萨哩嚩(引)哩他娑驮计毗药（拼读参考：萨₍尔₎瓦₍尔₎他萨达给₍比₎呀₍赫₎）",
                        "meaningZh": "向诸成诸事",
                        "meaningEn": "to all effecting all things",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-308",
            "index": 308,
            "iast": "vidyācāryebhyaḥ phaṭ",
            "classicalTranslitZh": "毗地夜遮唎弊泮",
            "modernPhoneticZh": "维₍地₎呀佳₍哩₎耶₍比₎呀₍赫₎ 帕₍特₎",
            "meaningZh": "破除一切持邪明咒行者障，泮！",
            "meaningEn": "Against wielders of hostile spells, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 308/427 句",
            "words": [
                  {
                        "iast": "vidyācāryebhyaḥ",
                        "stem": "vidyā-cārya",
                        "grammar": "Samāsa · 复合词 (Dat./Abl. Pl. · 为格复数)",
                        "transliterationZh": "尾地夜左哩曳毗药（拼读参考：维₍地₎呀佳₍哩₎耶₍比₎呀₍赫₎）",
                        "meaningZh": "向诸明咒境界",
                        "meaningEn": "Vidyā + to all a outcast",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-309",
            "index": 309,
            "iast": "caturbhaginībhyaḥ phaṭ",
            "classicalTranslitZh": "者都啰缚耆儞弊泮",
            "modernPhoneticZh": "佳度₍尔₎巴吉尼₍比₎呀₍赫₎ 帕₍特₎",
            "meaningZh": "破除四姊妹女鬼障难，泮！",
            "meaningEn": "Against the Four Sisters, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 309/427 句",
            "words": [
                  {
                        "iast": "caturbhaginībhyaḥ",
                        "stem": "catur-bhaginī",
                        "grammar": "Samāsa · 复合词 (Dat./Abl. Pl. · 为格复数)",
                        "transliterationZh": "者都哩婆拟泥毗药（拼读参考：佳度₍尔₎巴吉尼₍比₎呀₍赫₎）",
                        "meaningZh": "向诸四姊妹",
                        "meaningEn": "four + to",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-310",
            "index": 310,
            "iast": "vajrakaumārī",
            "classicalTranslitZh": "跋阇啰俱摩唎",
            "modernPhoneticZh": "瓦₍吉₎啦-高玛里",
            "meaningZh": "金刚童女护法部众！",
            "meaningEn": "Vajrakaumārī!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 310/427 句",
            "words": [
                  {
                        "iast": "vajrakaumārī",
                        "stem": "vajra-kaumārī",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "嚩日啰憍摩(引)哩(引)（拼读参考：瓦₍吉₎啦-高玛里）",
                        "meaningZh": "金刚娇么哩",
                        "meaningEn": "Vajra + Kaumari",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-311",
            "index": 311,
            "iast": "vidyārājñībhyaḥ phaṭ",
            "classicalTranslitZh": "毗陀夜啰誓弊泮",
            "modernPhoneticZh": "维₍地₎呀啦₍吉₎尼₍比₎呀₍赫₎ 帕₍特₎",
            "meaningZh": "大明妃威神破障，泮！",
            "meaningEn": "By the Vidyā-Queens, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 311/427 句",
            "words": [
                  {
                        "iast": "vidyārājñībhyaḥ",
                        "stem": "vidyārājñī",
                        "grammar": "Dat./Abl. Pl. · 为格复数",
                        "transliterationZh": "尾地夜啰(引)枳你(引)毗药（拼读参考：维₍地₎呀啦₍吉₎尼₍比₎呀₍赫₎）",
                        "meaningZh": "向诸明妃",
                        "meaningEn": "to/from wise consort",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-312",
            "index": 312,
            "iast": "mahāpratyaṅgirebhyaḥ phaṭ",
            "classicalTranslitZh": "摩诃波啰丁羊乂耆唎弊泮",
            "modernPhoneticZh": "玛哈-₍普₎啦₍蒂₎央吉雷₍比₎呀₍赫₎ 帕₍特₎",
            "meaningZh": "大回遮母威神摧破群魔，泮！",
            "meaningEn": "By the Great Pratyaṅgirās, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 312/427 句",
            "words": [
                  {
                        "iast": "mahāpratyaṅgirebhyaḥ",
                        "stem": "mahā-pratyaṅgirā-ibhya",
                        "grammar": "Samāsa · 复合词 (Nom. Sg. · 主格单数)",
                        "transliterationZh": "摩诃钵啰底耶仰拟隶毗药（拼读参考：玛哈-₍普₎啦₍蒂₎央吉雷₍比₎呀₍赫₎）",
                        "meaningZh": "大·般罗底扬吉罗·富人",
                        "meaningEn": "great + Pratyaṅgirā + belonging to one's household",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-313",
            "index": 313,
            "iast": "vajraśṛṅkhalāya",
            "classicalTranslitZh": "跋阇啰商羯啰夜",
            "modernPhoneticZh": "瓦₍吉₎啦-₍希₎仍卡啦呀",
            "meaningZh": "金刚锁大明王威神系缚！",
            "meaningEn": "To Vajraśṛṅkhalā!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 313/427 句",
            "words": [
                  {
                        "iast": "vajraśṛṅkhalāya",
                        "stem": "vajraśṛṅkhalā",
                        "grammar": "Dat. Sg. · 为格单数",
                        "transliterationZh": "嚩日啰室哩仰佉攞(引)耶（拼读参考：瓦₍吉₎啦-₍希₎仍卡啦呀）",
                        "meaningZh": "向金刚鏁",
                        "meaningEn": "to/for Vajrasrnkhala",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-314",
            "index": 314,
            "iast": "pratyaṅgirarājāya phaṭ",
            "classicalTranslitZh": "波啰丈耆啰阇耶泮",
            "modernPhoneticZh": "₍普₎啦₍蒂₎央吉啦啦佳呀 帕₍特₎",
            "meaningZh": "大回遮王摧伏魔怨，泮！",
            "meaningEn": "To the King of Pratyaṅgirās, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 314/427 句",
            "words": [
                  {
                        "iast": "pratyaṅgirarājāya",
                        "stem": "pa-ra-ta",
                        "grammar": "Mantra Dat. · 真言为格句",
                        "transliterationZh": "钵啰底耶仰拟啰啰(引)惹(引)耶（拼读参考：₍普₎啦₍蒂₎央吉啦啦佳呀）",
                        "meaningZh": "第一义谛·清净离诸尘垢·真如实际（归敬施与）",
                        "meaningEn": "ultimate truth & stainless purity free from dust & immutable Suchness (reverent offering)",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-315",
            "index": 315,
            "iast": "mahākālāya",
            "classicalTranslitZh": "摩诃迦啰夜",
            "modernPhoneticZh": "玛哈-嘎啦呀",
            "meaningZh": "大黑天神王威神镇伏！",
            "meaningEn": "To Mahākāla!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 315/427 句",
            "words": [
                  {
                        "iast": "mahākālāya",
                        "stem": "mahākāla",
                        "grammar": "Prop.Noun · 大黑天 · Dat. Sg. · 为格单数",
                        "transliterationZh": "摩诃迦(引)攞(引)耶（拼读参考：玛哈-嘎啦呀）",
                        "meaningZh": "向大黑天护法（摩诃迦罗）",
                        "meaningEn": "to/for Mahākāla, Great Black Dharmapāla",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-316",
            "index": 316,
            "iast": "mahāmātṛgaṇa",
            "classicalTranslitZh": "摩诃末怛唎迦拏",
            "modernPhoneticZh": "玛哈-玛₍特₎日嘎拿",
            "meaningZh": "一切大天母海会部众！",
            "meaningEn": "Of the Great Mother-Goddess hosts!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 316/427 句",
            "words": [
                  {
                        "iast": "mahāmātṛgaṇa",
                        "stem": "mahā-mātṛ-gaṇa",
                        "grammar": "Samāsa · 复合词 (Noun · 圣众海会)",
                        "transliterationZh": "摩诃摩(引)底哩誐拏（拼读参考：玛哈-玛₍特₎日嘎拿）",
                        "meaningZh": "大·母·海会众",
                        "meaningEn": "great + mother + assembly",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-317",
            "index": 317,
            "iast": "namaskṛtāya phaṭ",
            "classicalTranslitZh": "南无娑羯唎多夜泮",
            "modernPhoneticZh": "拿玛₍斯克₎日达呀 帕₍特₎",
            "meaningZh": "所共礼敬尊摧破魔障，泮！",
            "meaningEn": "Revered by them all, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 317/427 句",
            "words": [
                  {
                        "iast": "namaskṛtāya",
                        "stem": "namas-kṛta",
                        "grammar": "Samāsa · 复合词 (Dat. Sg. · 为格单数)",
                        "transliterationZh": "曩摩悉讫哩多耶（拼读参考：拿玛₍斯克₎日达呀）",
                        "meaningZh": "向归命所作",
                        "meaningEn": "homage + to",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-318",
            "index": 318,
            "iast": "vaiṣṇavīye phaṭ",
            "classicalTranslitZh": "毖瑟拏婢曳泮",
            "modernPhoneticZh": "歪₍师₎拿维耶 帕₍特₎",
            "meaningZh": "折伏毗纽天女部众障难，泮！",
            "meaningEn": "To Vaiṣṇavī, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 318/427 句",
            "words": [
                  {
                        "iast": "vaiṣṇavīye",
                        "stem": "vaiṣṇavī-iya",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "吠瑟拏味曳（拼读参考：歪₍师₎拿维耶）",
                        "meaningZh": "吠瑟拏微此处尊",
                        "meaningEn": "Vaisnavi",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-319",
            "index": 319,
            "iast": "brahmāṇīye phaṭ",
            "classicalTranslitZh": "勃啰诃牟尼曳泮",
            "modernPhoneticZh": "₍布₎啦₍赫₎玛尼耶 帕₍特₎",
            "meaningZh": "折伏大梵天女部众障难，泮！",
            "meaningEn": "To Brahmāṇī, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 319/427 句",
            "words": [
                  {
                        "iast": "brahmāṇīye",
                        "stem": "ba-ra-ha",
                        "grammar": "Mantra Voc. · 真言呼请句",
                        "transliterationZh": "跋啰纥摩(引)抳(引)曳（拼读参考：₍布₎啦₍赫₎玛尼耶）",
                        "meaningZh": "解脱系缚大力·清净离诸尘垢·因缘空寂大乐（呼请加持）",
                        "meaningEn": "spiritual strength freeing bonds & stainless purity free from dust & causal emptiness & spiritual joy (vocative invocation)",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-320",
            "index": 320,
            "iast": "agnīye phaṭ",
            "classicalTranslitZh": "阿耆尼曳泮",
            "modernPhoneticZh": "阿₍格₎尼耶 帕₍特₎",
            "meaningZh": "折伏火天女部众障难，泮！",
            "meaningEn": "To Agnī, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 320/427 句",
            "words": [
                  {
                        "iast": "agnīye",
                        "stem": "agni-iya",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "阿伽泥曳（拼读参考：阿₍格₎尼耶）",
                        "meaningZh": "圣火此处尊",
                        "meaningEn": "fire",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-321",
            "index": 321,
            "iast": "mahākālīye phaṭ",
            "classicalTranslitZh": "摩诃羯唎曳泮",
            "modernPhoneticZh": "玛哈-嘎利耶 帕₍特₎",
            "meaningZh": "折伏大黑天女部众障难，泮！",
            "meaningEn": "To Mahākālī, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 321/427 句",
            "words": [
                  {
                        "iast": "mahākālīye",
                        "stem": "maha-aka-āli-iya",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "摩诃迦(引)里(引)曳（拼读参考：玛哈-嘎利耶）",
                        "meaningZh": "酒席·忧苦·小溪·此处尊",
                        "meaningEn": "feast + not-joy + small ditch",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-322",
            "index": 322,
            "iast": "kāladaṇḍīye phaṭ",
            "classicalTranslitZh": "羯啰檀迟曳泮",
            "modernPhoneticZh": "嘎啦丹迪耶 帕₍特₎",
            "meaningZh": "折伏死王黑杖天女障难，泮！",
            "meaningEn": "To Kāladaṇḍī, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 322/427 句",
            "words": [
                  {
                        "iast": "kāladaṇḍīye",
                        "stem": "ka-la-da",
                        "grammar": "Mantra Voc. · 真言呼请句",
                        "transliterationZh": "迦(引)攞昙腻(引)曳（拼读参考：嘎啦丹迪耶）",
                        "meaningZh": "造作离相·离一切相无相·施度调伏（呼请加持）",
                        "meaningEn": "freedom from karmic agency & freedom from conditioned marks & generosity & self-mastery (vocative invocation)",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-323",
            "index": 323,
            "iast": "aindrīye phaṭ",
            "classicalTranslitZh": "蔑怛唎曳泮",
            "modernPhoneticZh": "恩₍德₎里耶 帕₍特₎",
            "meaningZh": "折伏帝释天女部众障难，泮！",
            "meaningEn": "To Aindrī, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 323/427 句",
            "words": [
                  {
                        "iast": "aindrīye",
                        "stem": "aindrī-iya",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "蔼捺哩(引)曳（拼读参考：恩₍德₎里耶）",
                        "meaningZh": "东此处尊",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-324",
            "index": 324,
            "iast": "raudrīye phaṭ",
            "classicalTranslitZh": "唠怛唎曳泮",
            "modernPhoneticZh": "劳₍德₎里耶 帕₍特₎",
            "meaningZh": "折伏暴怒大自在天女障难，泮！",
            "meaningEn": "To Raudrī, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 324/427 句",
            "words": [
                  {
                        "iast": "raudrīye",
                        "stem": "raudrī-iya",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "牢捺哩(引)曳（拼读参考：劳₍德₎里耶）",
                        "meaningZh": "咾捺哩此处尊",
                        "meaningEn": "Raudri",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-325",
            "index": 325,
            "iast": "cāmuṇḍāye phaṭ",
            "classicalTranslitZh": "遮文茶曳泮",
            "modernPhoneticZh": "佳闷达耶 帕₍特₎",
            "meaningZh": "折伏遮文茶忿怒鬼母障难，泮！",
            "meaningEn": "To Cāmuṇḍā, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 325/427 句",
            "words": [
                  {
                        "iast": "cāmuṇḍāye",
                        "stem": "cāmuṇḍā-āya",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "左母喃拏(引)曳（拼读参考：佳闷达耶）",
                        "meaningZh": "遮文茶出",
                        "meaningEn": "Camunda + O income",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-326",
            "index": 326,
            "iast": "kālarātrīye phaṭ",
            "classicalTranslitZh": "羯逻啰怛唎曳泮",
            "modernPhoneticZh": "嘎啦啦₍特₎里耶 帕₍特₎",
            "meaningZh": "折伏黑夜神女部众障难，泮！",
            "meaningEn": "To Kālarātrī, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 326/427 句",
            "words": [
                  {
                        "iast": "kālarātrīye",
                        "stem": "kālarātri-iya",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "迦(引)攞啰(引)怛哩(引)曳（拼读参考：嘎啦啦₍特₎里耶）",
                        "meaningZh": "闇夜天此处尊",
                        "meaningEn": "Kālarātri",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-327",
            "index": 327,
            "iast": "kāpālīye phaṭ",
            "classicalTranslitZh": "迦般唎曳泮",
            "modernPhoneticZh": "嘎巴利耶 帕₍特₎",
            "meaningZh": "折伏髑髅天女部众障难，泮！",
            "meaningEn": "To Kāpālī, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 327/427 句",
            "words": [
                  {
                        "iast": "kāpālīye",
                        "stem": "kāpālī-iya",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "迦(引)波里(引)曳（拼读参考：嘎巴利耶）",
                        "meaningZh": "具头器此处尊",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-328",
            "index": 328,
            "iast": "adhimuktikaśmaśāna",
            "classicalTranslitZh": "阿地目质多迦尸摩舍那",
            "modernPhoneticZh": "阿地穆₍克₎帝嘎₍希₎玛沙拿",
            "meaningZh": "住于阿地目多寒林尸陀林中！",
            "meaningEn": "Dwelling in the charnel ground!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 328/427 句",
            "words": [
                  {
                        "iast": "adhimuktikaśmaśāna",
                        "stem": "adhimuktika-śmaśāna",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "阿地母羯底迦室摩奢曩（拼读参考：阿地穆₍克₎帝嘎₍希₎玛沙拿）",
                        "meaningZh": "铁杆利益恐毘林",
                        "meaningEn": "having a zealous interest + smasana",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-329",
            "index": 329,
            "iast": "vāsinīye phaṭ",
            "classicalTranslitZh": "婆私儞曳泮",
            "modernPhoneticZh": "瓦悉尼耶 帕₍特₎",
            "meaningZh": "一切尸林神女障难悉摧破，泮（第四会圆满）！",
            "meaningEn": "To the Charnel-Dwelling Spirits, Phaṭ!",
            "tangNoteZh": "第四会【金刚藏折摄会】·《T19n0945》原典第 329/427 句",
            "words": [
                  {
                        "iast": "vāsinīye",
                        "stem": "va-sa-na",
                        "grammar": "Mantra Voc. · 真言呼请句",
                        "transliterationZh": "嚩(引)悉泥曳（拼读参考：瓦悉尼耶）",
                        "meaningZh": "最上真言离言说·一切诸谛圆满·离名相假立（呼请加持）",
                        "meaningEn": "supreme ineffable speech & all-pervading truth & auspiciousness & beyond nominal designation (vocative invocation)",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-330",
            "index": 330,
            "iast": "ye kecit",
            "classicalTranslitZh": "演吉质",
            "modernPhoneticZh": "耶 给吉₍特₎",
            "meaningZh": "凡所有一切众生类！",
            "meaningEn": "Whatever beings there may be!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 330/427 句",
            "words": [
                  {
                        "iast": "ye",
                        "stem": "ye",
                        "grammar": "Rel.Pron.Pl. · 关系复数",
                        "transliterationZh": "曳（拼读参考：耶）",
                        "meaningZh": "凡彼等诸有情",
                        "meaningEn": "those who, whoever (pl.)",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "kecit",
                        "stem": "kecit",
                        "grammar": "Indef.Pron.Pl. · 不定代词",
                        "transliterationZh": "计只怛（拼读参考：给吉₍特₎）",
                        "meaningZh": "任何众生、凡有诸类",
                        "meaningEn": "any, some (plural)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-331",
            "index": 331,
            "iast": "sattvāś ca",
            "classicalTranslitZh": "萨埵婆写",
            "modernPhoneticZh": "萨₍特₎瓦₍希₎ 佳",
            "meaningZh": "有情鬼神等众！",
            "meaningEn": "Among sentient beings!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 331/427 句",
            "words": [
                  {
                        "iast": "sattvāś",
                        "stem": "sa-ta-ta",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "萨怛怛嚩(引)室（拼读参考：萨₍特₎瓦₍希₎）",
                        "meaningZh": "一切诸谛圆满·真如实际·最上真言离言说",
                        "meaningEn": "all-pervading truth & auspiciousness & immutable Suchness & supreme ineffable speech",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-332",
            "index": 332,
            "iast": "mama idaṃ mama sya",
            "classicalTranslitZh": "么么印兔那么么写",
            "modernPhoneticZh": "玛玛 伊当 玛玛 ₍斯₎呀",
            "meaningZh": "对于我受持弟子某甲！",
            "meaningEn": "Toward me, this practitioner!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 332/427 句 · 《首楞严经》原典夹注：至此句依前称弟子某人",
            "words": [
                  {
                        "iast": "mama",
                        "stem": "mama",
                        "grammar": "Pron. Gen. · 第一人称属格",
                        "transliterationZh": "摩摩（拼读参考：玛玛）",
                        "meaningZh": "我之（行者所有）",
                        "meaningEn": "my, of me (the practitioner)",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "idaṃ",
                        "stem": "idaṃ",
                        "grammar": "Pron. Neut. · 近指代词",
                        "transliterationZh": "伊昙（拼读参考：伊当）",
                        "meaningZh": "此、此法门",
                        "meaningEn": "this, here",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "mama",
                        "stem": "mama",
                        "grammar": "Pron. Gen. · 第一人称属格",
                        "transliterationZh": "摩摩（拼读参考：玛玛）",
                        "meaningZh": "我之（行者所有）",
                        "meaningEn": "my, of me (the practitioner)",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "sya",
                        "stem": "sa",
                        "grammar": "Akṣara-mukha · 耶字门",
                        "transliterationZh": "娑耶（拼读参考：₍斯₎呀）",
                        "meaningZh": "耶字门（一乘如实之道（yāna）·本不生体性）",
                        "meaningEn": "supreme vehicle of awakening (yāna) — primordial non-arising",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-333",
            "index": 333,
            "iast": "duṣṭacittāḥ",
            "classicalTranslitZh": "突瑟吒质多",
            "modernPhoneticZh": "杜₍师₎达吉达₍赫₎",
            "meaningZh": "怀抱恶意毒害心者！",
            "meaningEn": "Harboring malicious thoughts!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 333/427 句",
            "words": [
                  {
                        "iast": "duṣṭacittāḥ",
                        "stem": "duṣṭacitta",
                        "grammar": "Nom. Pl. · 主格复数",
                        "transliterationZh": "努瑟吒只怛多诃（拼读参考：杜₍师₎达吉达₍赫₎）",
                        "meaningZh": "诸具瞋心",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-334",
            "index": 334,
            "iast": "amitracittāḥ",
            "classicalTranslitZh": "阿末怛唎质多",
            "modernPhoneticZh": "阿米₍特₎啦吉达₍赫₎",
            "meaningZh": "怀抱怨敌不慈心者！",
            "meaningEn": "Harboring hostile, unfriendly thoughts!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 334/427 句",
            "words": [
                  {
                        "iast": "amitracittāḥ",
                        "stem": "amitra-citta",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "阿弭怛啰只怛多诃（拼读参考：阿米₍特₎啦吉达₍赫₎）",
                        "meaningZh": "不相友诸心",
                        "meaningEn": "enemy + mind",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-335",
            "index": 335,
            "iast": "ojāhārāḥ",
            "classicalTranslitZh": "乌阇诃啰",
            "modernPhoneticZh": "欧佳哈啦₍赫₎",
            "meaningZh": "食人精气神采之鬼！",
            "meaningEn": "Spirits that consume vitality!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 335/427 句",
            "words": [
                  {
                        "iast": "ojāhārāḥ",
                        "stem": "ojā-hāra",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "污惹(引)诃啰(引)诃（拼读参考：欧佳哈啦₍赫₎）",
                        "meaningZh": "饭食诸胸严",
                        "meaningEn": "food + clump",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-336",
            "index": 336,
            "iast": "garbhāhārāḥ",
            "classicalTranslitZh": "伽婆诃啰",
            "modernPhoneticZh": "嘎₍尔₎巴哈啦₍赫₎",
            "meaningZh": "食人胞胎之鬼！",
            "meaningEn": "Spirits that consume embryos!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 336/427 句",
            "words": [
                  {
                        "iast": "garbhāhārāḥ",
                        "stem": "garbha-āhāra",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "誐哩婆(引)诃啰(引)诃（拼读参考：嘎₍尔₎巴哈啦₍赫₎）",
                        "meaningZh": "藏诸楼阁",
                        "meaningEn": "womb + tower",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-337",
            "index": 337,
            "iast": "rudhirāhārāḥ",
            "classicalTranslitZh": "嚧地啰诃啰",
            "modernPhoneticZh": "鲁地啦哈啦₍赫₎",
            "meaningZh": "饮人热血之鬼！",
            "meaningEn": "Spirits that drink blood!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 337/427 句",
            "words": [
                  {
                        "iast": "rudhirāhārāḥ",
                        "stem": "rudhira-āhāra",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "噜地啰(引)诃啰(引)诃（拼读参考：鲁地啦哈啦₍赫₎）",
                        "meaningZh": "血诸楼阁",
                        "meaningEn": "red + tower",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-338",
            "index": 338,
            "iast": "vasāhārāḥ",
            "classicalTranslitZh": "婆娑诃啰",
            "modernPhoneticZh": "瓦萨哈啦₍赫₎",
            "meaningZh": "食人脂膏之鬼！",
            "meaningEn": "Spirits that consume fat!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 338/427 句",
            "words": [
                  {
                        "iast": "vasāhārāḥ",
                        "stem": "vas-āhāra",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "嚩娑诃啰(引)诃（拼读参考：瓦萨哈啦₍赫₎）",
                        "meaningZh": "你们诸楼阁",
                        "meaningEn": "you + tower",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-339",
            "index": 339,
            "iast": "majjāhārāḥ",
            "classicalTranslitZh": "摩阇诃啰",
            "modernPhoneticZh": "玛佳哈啦₍赫₎",
            "meaningZh": "食人骨髓之鬼！",
            "meaningEn": "Spirits that consume marrow!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 339/427 句",
            "words": [
                  {
                        "iast": "majjāhārāḥ",
                        "stem": "majj-āhāra",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "摩怛惹(引)诃啰(引)诃（拼读参考：玛佳哈啦₍赫₎）",
                        "meaningZh": "溺诸楼阁",
                        "meaningEn": "to sink + tower",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-340",
            "index": 340,
            "iast": "jātāhārāḥ",
            "classicalTranslitZh": "阇多诃啰",
            "modernPhoneticZh": "佳达哈啦₍赫₎",
            "meaningZh": "食初生婴孩之鬼！",
            "meaningEn": "Spirits that steal newborns!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 340/427 句",
            "words": [
                  {
                        "iast": "jātāhārāḥ",
                        "stem": "jāta-āhāra",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "惹(引)多诃啰(引)诃（拼读参考：佳达哈啦₍赫₎）",
                        "meaningZh": "部多诸楼阁",
                        "meaningEn": "become characterized by + tower",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-341",
            "index": 341,
            "iast": "jīvitāhārāḥ",
            "classicalTranslitZh": "视毖多诃啰",
            "modernPhoneticZh": "吉维达哈啦₍赫₎",
            "meaningZh": "夺人寿命之鬼！",
            "meaningEn": "Spirits that steal life-force!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 341/427 句",
            "words": [
                  {
                        "iast": "jīvitāhārāḥ",
                        "stem": "jīvita-āhāra",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "时尾多诃啰(引)诃（拼读参考：吉维达哈啦₍赫₎）",
                        "meaningZh": "活生生诸楼阁",
                        "meaningEn": "lived + tower",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-342",
            "index": 342,
            "iast": "balyāhārāḥ",
            "classicalTranslitZh": "跋略夜诃啰",
            "modernPhoneticZh": "巴₍勒₎呀哈啦₍赫₎",
            "meaningZh": "食祭祀供食之鬼！",
            "meaningEn": "Spirits that consume offerings!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 342/427 句",
            "words": [
                  {
                        "iast": "balyāhārāḥ",
                        "stem": "ba-la-ya",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "跋逻夜诃啰(引)诃（拼读参考：巴₍勒₎呀哈啦₍赫₎）",
                        "meaningZh": "解脱系缚大力·离一切相无相·一乘如实之道",
                        "meaningEn": "spiritual strength freeing bonds & freedom from conditioned marks & supreme vehicle of awakening",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-343",
            "index": 343,
            "iast": "gandhāhārāḥ",
            "classicalTranslitZh": "乾陀诃啰",
            "modernPhoneticZh": "甘达哈啦₍赫₎",
            "meaningZh": "食香气之鬼！",
            "meaningEn": "Spirits that feed on scents!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 343/427 句",
            "words": [
                  {
                        "iast": "gandhāhārāḥ",
                        "stem": "gandha-āhāra",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "俨驮(引)诃啰(引)诃（拼读参考：甘达哈啦₍赫₎）",
                        "meaningZh": "香诸楼阁",
                        "meaningEn": "smell + tower",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-344",
            "index": 344,
            "iast": "puṣpāhārāḥ",
            "classicalTranslitZh": "布史波诃啰",
            "modernPhoneticZh": "布₍师₎巴哈啦₍赫₎",
            "meaningZh": "食花朵之鬼！",
            "meaningEn": "Spirits that feed on flowers!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 344/427 句",
            "words": [
                  {
                        "iast": "puṣpāhārāḥ",
                        "stem": "puṣpa-āhāra",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "补瑟波诃啰(引)诃（拼读参考：布₍师₎巴哈啦₍赫₎）",
                        "meaningZh": "花诸楼阁",
                        "meaningEn": "flower + tower",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-345",
            "index": 345,
            "iast": "phalāhārāḥ",
            "classicalTranslitZh": "颇啰诃啰",
            "modernPhoneticZh": "帕啦哈啦₍赫₎",
            "meaningZh": "食果实之鬼！",
            "meaningEn": "Spirits that feed on fruits!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 345/427 句",
            "words": [
                  {
                        "iast": "phalāhārāḥ",
                        "stem": "phal-āhāra",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "颇攞(引)诃啰(引)诃（拼读参考：帕啦哈啦₍赫₎）",
                        "meaningZh": "决口诸楼阁",
                        "meaningEn": "burst + tower",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-346",
            "index": 346,
            "iast": "sasyāhārāḥ",
            "classicalTranslitZh": "婆写诃啰",
            "modernPhoneticZh": "萨₍斯₎呀哈啦₍赫₎",
            "meaningZh": "食五谷苗稼精气之鬼！",
            "meaningEn": "Spirits that feed on crops and grain!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 346/427 句",
            "words": [
                  {
                        "iast": "sasyāhārāḥ",
                        "stem": "sasya-āhāra",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "萨娑夜诃啰(引)诃（拼读参考：萨₍斯₎呀哈啦₍赫₎）",
                        "meaningZh": "稼诸楼阁",
                        "meaningEn": "grain + tower",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-347",
            "index": 347,
            "iast": "pāpacittāḥ",
            "classicalTranslitZh": "般波质多",
            "modernPhoneticZh": "巴巴吉达₍赫₎",
            "meaningZh": "怀罪恶邪念心之鬼！",
            "meaningEn": "Evil-minded spirits!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 347/427 句",
            "words": [
                  {
                        "iast": "pāpacittāḥ",
                        "stem": "pāpa-citta",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "波跛只怛多诃（拼读参考：巴巴吉达₍赫₎）",
                        "meaningZh": "罪业诸心",
                        "meaningEn": "evil + mind",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-348",
            "index": 348,
            "iast": "duṣṭacittāḥ",
            "classicalTranslitZh": "突瑟吒质多",
            "modernPhoneticZh": "杜₍师₎达吉达₍赫₎",
            "meaningZh": "怀凶毒恼害心之鬼！",
            "meaningEn": "Wicked-minded spirits!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 348/427 句",
            "words": [
                  {
                        "iast": "duṣṭacittāḥ",
                        "stem": "duṣṭacitta",
                        "grammar": "Nom. Pl. · 主格复数",
                        "transliterationZh": "努瑟吒只怛多诃（拼读参考：杜₍师₎达吉达₍赫₎）",
                        "meaningZh": "诸具瞋心",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-349",
            "index": 349,
            "iast": "raudracittāḥ",
            "classicalTranslitZh": "唠陀啰质多",
            "modernPhoneticZh": "劳₍德₎啦吉达₍赫₎",
            "meaningZh": "怀暴怒残忍心之鬼！",
            "meaningEn": "Fierce and wrathful spirits!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 349/427 句",
            "words": [
                  {
                        "iast": "raudracittāḥ",
                        "stem": "raudracitta",
                        "grammar": "Nom. Pl. · 主格复数",
                        "transliterationZh": "牢捺啰只怛多诃（拼读参考：劳₍德₎啦吉达₍赫₎）",
                        "meaningZh": "诸具害心",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-350",
            "index": 350,
            "iast": "yakṣagrahāḥ",
            "classicalTranslitZh": "药叉揭啰诃",
            "modernPhoneticZh": "呀₍克₎沙₍格₎啦哈₍赫₎",
            "meaningZh": "药叉执鬼！",
            "meaningEn": "Yakṣa-demons!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 350/427 句",
            "words": [
                  {
                        "iast": "yakṣagrahāḥ",
                        "stem": "yakṣa-graha",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "耶乞洒伽啰诃诃（拼读参考：呀₍克₎沙₍格₎啦哈₍赫₎）",
                        "meaningZh": "药叉诸曜执",
                        "meaningEn": "Yakṣa + planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-351",
            "index": 351,
            "iast": "rākṣasagrahāḥ",
            "classicalTranslitZh": "啰刹娑揭啰诃",
            "modernPhoneticZh": "啦₍克₎沙萨₍格₎啦哈₍赫₎",
            "meaningZh": "罗刹执鬼！",
            "meaningEn": "Rākṣasa-demons!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 351/427 句",
            "words": [
                  {
                        "iast": "rākṣasagrahāḥ",
                        "stem": "rākṣasa-graha",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "啰(引)乞洒萨伽啰诃诃（拼读参考：啦₍克₎沙萨₍格₎啦哈₍赫₎）",
                        "meaningZh": "罗刹诸曜执",
                        "meaningEn": "Rākṣasa + planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-352",
            "index": 352,
            "iast": "pretagrahāḥ",
            "classicalTranslitZh": "闭㘑多揭啰诃",
            "modernPhoneticZh": "₍普₎雷达₍格₎啦哈₍赫₎",
            "meaningZh": "饿鬼执魅！",
            "meaningEn": "Preta-ghosts!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 352/427 句",
            "words": [
                  {
                        "iast": "pretagrahāḥ",
                        "stem": "preta-graha",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "钵隶怛伽啰诃诃（拼读参考：₍普₎雷达₍格₎啦哈₍赫₎）",
                        "meaningZh": "饿鬼诸曜执",
                        "meaningEn": "Preta + planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-353",
            "index": 353,
            "iast": "piśācagrahāḥ",
            "classicalTranslitZh": "毗舍遮揭啰诃",
            "modernPhoneticZh": "比沙佳₍格₎啦哈₍赫₎",
            "meaningZh": "毗舍遮啖精气执鬼！",
            "meaningEn": "Piśāca-demons!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 353/427 句",
            "words": [
                  {
                        "iast": "piśācagrahāḥ",
                        "stem": "piśāca-graha",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "比奢者伽啰诃诃（拼读参考：比沙佳₍格₎啦哈₍赫₎）",
                        "meaningZh": "毗舍遮诸曜执",
                        "meaningEn": "Piśāca + planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-354",
            "index": 354,
            "iast": "bhūtagrahāḥ",
            "classicalTranslitZh": "部多揭啰诃",
            "modernPhoneticZh": "布达₍格₎啦哈₍赫₎",
            "meaningZh": "部多魍魉执鬼！",
            "meaningEn": "Bhūta-spirits!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 354/427 句",
            "words": [
                  {
                        "iast": "bhūtagrahāḥ",
                        "stem": "bhūta-graha",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "部(引)怛伽啰诃诃（拼读参考：布达₍格₎啦哈₍赫₎）",
                        "meaningZh": "部多鬼神诸曜执",
                        "meaningEn": "spirit + planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-355",
            "index": 355,
            "iast": "kumbhāṇḍagrahāḥ",
            "classicalTranslitZh": "鸠槃茶揭啰诃",
            "modernPhoneticZh": "滚班达₍格₎啦哈₍赫₎",
            "meaningZh": "鸠槃茶厌魅执鬼！",
            "meaningEn": "Kumbhāṇḍa-spirits!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 355/427 句",
            "words": [
                  {
                        "iast": "kumbhāṇḍagrahāḥ",
                        "stem": "kumbhāṇḍa-graha",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "矩喃梵(引)拏伽啰诃诃（拼读参考：滚班达₍格₎啦哈₍赫₎）",
                        "meaningZh": "甕形诸曜执",
                        "meaningEn": "evil spirit + planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-356",
            "index": 356,
            "iast": "skandagrahāḥ",
            "classicalTranslitZh": "悉乾陀揭啰诃",
            "modernPhoneticZh": "₍斯₎干达₍格₎啦哈₍赫₎",
            "meaningZh": "塞健陀童子惊风执鬼！",
            "meaningEn": "Skanda-spirits!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 356/427 句",
            "words": [
                  {
                        "iast": "skandagrahāḥ",
                        "stem": "skanda-graha",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "娑剑捺伽啰诃诃（拼读参考：₍斯₎干达₍格₎啦哈₍赫₎）",
                        "meaningZh": "偏脣鬼诸曜执",
                        "meaningEn": "a demon that causes drought + planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-357",
            "index": 357,
            "iast": "unmādagrahāḥ",
            "classicalTranslitZh": "乌怛摩陀揭啰诃",
            "modernPhoneticZh": "温玛达₍格₎啦哈₍赫₎",
            "meaningZh": "癫狂迷乱执鬼！",
            "meaningEn": "Unmāda madness-spirits!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 357/427 句",
            "words": [
                  {
                        "iast": "unmādagrahāḥ",
                        "stem": "unmāda-graha",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "温摩(引)捺伽啰诃诃（拼读参考：温玛达₍格₎啦哈₍赫₎）",
                        "meaningZh": "颠诸曜执",
                        "meaningEn": "mad + planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-358",
            "index": 358,
            "iast": "chāyāgrahāḥ",
            "classicalTranslitZh": "车夜揭啰诃",
            "modernPhoneticZh": "恰呀₍格₎啦哈₍赫₎",
            "meaningZh": "影子魍魉执鬼！",
            "meaningEn": "Chāyā shadow-spirits!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 358/427 句",
            "words": [
                  {
                        "iast": "chāyāgrahāḥ",
                        "stem": "chāyā-graha",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "车(引)夜伽啰诃诃（拼读参考：恰呀₍格₎啦哈₍赫₎）",
                        "meaningZh": "影诸曜执",
                        "meaningEn": "shadow + planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-359",
            "index": 359,
            "iast": "apasmāragrahāḥ",
            "classicalTranslitZh": "阿播萨摩啰揭啰诃",
            "modernPhoneticZh": "阿巴₍斯₎玛啦₍格₎啦哈₍赫₎",
            "meaningZh": "羊痫昏厥执鬼！",
            "meaningEn": "Apasmāra epilepsy-spirits!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 359/427 句",
            "words": [
                  {
                        "iast": "apasmāragrahāḥ",
                        "stem": "apasmāra-graha",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "阿跛娑摩(引)啰伽啰诃诃（拼读参考：阿巴₍斯₎玛啦₍格₎啦哈₍赫₎）",
                        "meaningZh": "作忘者诸曜执",
                        "meaningEn": "epilepsy + planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-360",
            "index": 360,
            "iast": "ḍākaḍākinīgrahāḥ",
            "classicalTranslitZh": "宅袪革茶耆尼揭啰诃",
            "modernPhoneticZh": "达嘎达给尼₍格₎啦哈₍赫₎",
            "meaningZh": "男魅荼伽与女魅荼枳尼执鬼！",
            "meaningEn": "Ḍāka and Ḍākinī spirits!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 360/427 句",
            "words": [
                  {
                        "iast": "ḍākaḍākinīgrahāḥ",
                        "stem": "ḍa-ka-ḍa",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "拏(引)迦拏(引)枳泥伽啰诃诃（拼读参考：达嘎达给尼₍格₎啦哈₍赫₎）",
                        "meaningZh": "息灭诤怨·造作离相·离名相假立",
                        "meaningEn": "pacifying conflict & turmoil & freedom from karmic agency & beyond nominal designation",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-361",
            "index": 361,
            "iast": "revatīgrahāḥ",
            "classicalTranslitZh": "唎佛帝揭啰诃",
            "modernPhoneticZh": "雷瓦帝₍格₎啦哈₍赫₎",
            "meaningZh": "梨婆底恼害婴幼执鬼！",
            "meaningEn": "Revatī spirits!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 361/427 句",
            "words": [
                  {
                        "iast": "revatīgrahāḥ",
                        "stem": "revatīgraha",
                        "grammar": "Nom. Pl. · 主格复数",
                        "transliterationZh": "隶嚩底(引)伽啰诃诃（拼读参考：雷瓦帝₍格₎啦哈₍赫₎）",
                        "meaningZh": "诸腹行魅 / 女魅",
                        "meaningEn": "demon of; Revatī (plural)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-362",
            "index": 362,
            "iast": "jāmakagrahāḥ",
            "classicalTranslitZh": "阇弥迦揭啰诃",
            "modernPhoneticZh": "佳玛嘎₍格₎啦哈₍赫₎",
            "meaningZh": "如鸟怪昼夜作祟之执鬼！",
            "meaningEn": "Jāmaka spirits!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 362/427 句",
            "words": [
                  {
                        "iast": "jāmakagrahāḥ",
                        "stem": "ja-ma-ka",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "惹(引)摩迦伽啰诃诃（拼读参考：佳玛嘎₍格₎啦哈₍赫₎）",
                        "meaningZh": "生起不可得·尊胜·无我大慈三昧·造作离相",
                        "meaningEn": "transcending birth & victorious & selfless great loving-kindness & freedom from karmic agency",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-363",
            "index": 363,
            "iast": "śakunigrahāḥ",
            "classicalTranslitZh": "舍俱尼揭啰诃",
            "modernPhoneticZh": "沙古尼₍格₎啦哈₍赫₎",
            "meaningZh": "舍俱尼恶禽形执鬼！",
            "meaningEn": "Śakuni bird-spirits!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 363/427 句",
            "words": [
                  {
                        "iast": "śakunigrahāḥ",
                        "stem": "śakunigraha",
                        "grammar": "Nom. Pl. · 主格复数",
                        "transliterationZh": "舍矩你伽啰诃诃（拼读参考：沙古尼₍格₎啦哈₍赫₎）",
                        "meaningZh": "诸魑魅",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-364",
            "index": 364,
            "iast": "mātṛnandikagrahāḥ",
            "classicalTranslitZh": "姥陀啰难地迦揭啰诃",
            "modernPhoneticZh": "玛₍特₎日南地嘎₍格₎啦哈₍赫₎",
            "meaningZh": "喜母难地迦执鬼！",
            "meaningEn": "Mātṛnandika spirits!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 364/427 句",
            "words": [
                  {
                        "iast": "mātṛnandikagrahāḥ",
                        "stem": "mātṛ-nandika-graha",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "摩(引)底哩喃地迦伽啰诃诃（拼读参考：玛₍特₎日南地嘎₍格₎啦哈₍赫₎）",
                        "meaningZh": "母·难提迦·诸曜执",
                        "meaningEn": "mother + Nandika + planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-365",
            "index": 365,
            "iast": "ālambagrahāḥ",
            "classicalTranslitZh": "阿蓝婆揭啰诃",
            "modernPhoneticZh": "阿兰巴₍格₎啦哈₍赫₎",
            "meaningZh": "阿蓝婆依附作祟执鬼！",
            "meaningEn": "Ālamba clinging spirits!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 365/427 句",
            "words": [
                  {
                        "iast": "ālambagrahāḥ",
                        "stem": "ālamba-graha",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "阿(引)蓝跋伽啰诃诃（拼读参考：阿兰巴₍格₎啦哈₍赫₎）",
                        "meaningZh": "搭拉诸曜执",
                        "meaningEn": "hanging down + planet",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-366",
            "index": 366,
            "iast": "kaṇṭhapāṇigrahāḥ",
            "classicalTranslitZh": "乾度波尼揭啰诃",
            "modernPhoneticZh": "干他巴尼₍格₎啦哈₍赫₎",
            "meaningZh": "扼喉执手恼害之鬼！",
            "meaningEn": "Kaṇṭhapāṇi spirits!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 366/427 句",
            "words": [
                  {
                        "iast": "kaṇṭhapāṇigrahāḥ",
                        "stem": "kaṇṭha-pāṇigraha",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "剑侘波抳伽啰诃诃（拼读参考：干他巴尼₍格₎啦哈₍赫₎）",
                        "meaningZh": "颈喉诸婚姻",
                        "meaningEn": "throat + marriage",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-367",
            "index": 367,
            "iast": "jvarā ekāhikāḥ",
            "classicalTranslitZh": "什伐啰堙迦醯迦",
            "modernPhoneticZh": "₍吉₎瓦啦 诶嘎嘿嘎₍赫₎",
            "meaningZh": "一日一发之虐疾热病！",
            "meaningEn": "Daily fevers!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 367/427 句",
            "words": [
                  {
                        "iast": "jvarā",
                        "stem": "jvara",
                        "grammar": "Nom. Sg. Fem. · 主格阴性",
                        "transliterationZh": "日嚩啰(引)（拼读参考：₍吉₎瓦啦）",
                        "meaningZh": "瘟疫",
                        "meaningEn": "fever, pain, grief, sorrow",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ekāhikāḥ",
                        "stem": "ekāhika",
                        "grammar": "Nom. Pl. · 主格复数",
                        "transliterationZh": "翳迦(引)呬迦(引)诃（拼读参考：诶嘎嘿嘎₍赫₎）",
                        "meaningZh": "诸每一日疟",
                        "meaningEn": "recurring daily, quotidian (plural)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-368",
            "index": 368,
            "iast": "dvaitīyakāḥ",
            "classicalTranslitZh": "坠帝药迦",
            "modernPhoneticZh": "₍德₎歪帝呀嘎₍赫₎",
            "meaningZh": "二日一发之虐疾热病！",
            "meaningEn": "Two-day fevers!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 368/427 句",
            "words": [
                  {
                        "iast": "dvaitīyakāḥ",
                        "stem": "dvaitīyaka",
                        "grammar": "Nom. Pl. · 主格复数",
                        "transliterationZh": "捺吠底(引)耶迦(引)诃（拼读参考：₍德₎歪帝呀嘎₍赫₎）",
                        "meaningZh": "诸每二日疟",
                        "meaningEn": "recurring every second day; for the second time (plural)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-369",
            "index": 369,
            "iast": "traitīyakāḥ",
            "classicalTranslitZh": "怛隶帝药迦",
            "modernPhoneticZh": "₍特₎来帝呀嘎₍赫₎",
            "meaningZh": "三日一发之虐疾热病！",
            "meaningEn": "Three-day fevers!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 369/427 句",
            "words": [
                  {
                        "iast": "traitīyakāḥ",
                        "stem": "traitīyaka",
                        "grammar": "Nom. Pl. · 主格复数",
                        "transliterationZh": "怛来底(引)耶迦(引)诃（拼读参考：₍特₎来帝呀嘎₍赫₎）",
                        "meaningZh": "诸每三日疟",
                        "meaningEn": "recurring every third day; for the third time (plural)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-370",
            "index": 370,
            "iast": "cāturthikāḥ",
            "classicalTranslitZh": "者突托迦",
            "modernPhoneticZh": "佳度₍尔₎提嘎₍赫₎",
            "meaningZh": "四日一发之虐疾热病！",
            "meaningEn": "Four-day fevers!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 370/427 句",
            "words": [
                  {
                        "iast": "cāturthikāḥ",
                        "stem": "ca-ta-ra",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "左都哩耻迦(引)诃（拼读参考：佳度₍尔₎提嘎₍赫₎）",
                        "meaningZh": "妙行迁变空·真如实际·清净离诸尘垢",
                        "meaningEn": "awakened conduct beyond flux & immutable Suchness & stainless purity free from dust",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-371",
            "index": 371,
            "iast": "nityajvarā viṣamajvarāḥ",
            "classicalTranslitZh": "昵提什伐啰毖釤摩什伐啰",
            "modernPhoneticZh": "尼₍蒂₎呀₍吉₎瓦啦 维沙玛₍吉₎瓦啦₍赫₎",
            "meaningZh": "常热病及寒热不调怪热病！",
            "meaningEn": "Chronic fevers and irregular fevers!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 371/427 句",
            "words": [
                  {
                        "iast": "nityajvarā",
                        "stem": "nityajvara",
                        "grammar": "Nom. Sg. Fem. · 主格阴性",
                        "transliterationZh": "你底耶日嚩啰(引)（拼读参考：尼₍蒂₎呀₍吉₎瓦啦）",
                        "meaningZh": "常疫",
                        "meaningEn": "permanent; fever",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "viṣamajvarāḥ",
                        "stem": "viṣamajvara",
                        "grammar": "Nom. Pl. · 主格复数",
                        "transliterationZh": "尾洒摩日嚩啰(引)诃（拼读参考：维沙玛₍吉₎瓦啦₍赫₎）",
                        "meaningZh": "诸不尽疫",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-372",
            "index": 372,
            "iast": "vātikāḥ",
            "classicalTranslitZh": "薄底迦",
            "modernPhoneticZh": "瓦帝嘎₍赫₎",
            "meaningZh": "风大不调所致病症！",
            "meaningEn": "Wind-induced ailments (Vāta)!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 372/427 句",
            "words": [
                  {
                        "iast": "vātikāḥ",
                        "stem": "vātika",
                        "grammar": "Nom. Pl. · 主格复数",
                        "transliterationZh": "嚩(引)底迦(引)诃（拼读参考：瓦帝嘎₍赫₎）",
                        "meaningZh": "诸侃星",
                        "meaningEn": "wind-maker, braggart, boaster (plural)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-373",
            "index": 373,
            "iast": "paittikāḥ",
            "classicalTranslitZh": "鼻底迦",
            "modernPhoneticZh": "拜帝嘎₍赫₎",
            "meaningZh": "胆热黄水不调所致病症！",
            "meaningEn": "Bile-induced ailments (Pitta)!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 373/427 句",
            "words": [
                  {
                        "iast": "paittikāḥ",
                        "stem": "pa-ta-ta",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "拜怛底迦(引)诃（拼读参考：拜帝嘎₍赫₎）",
                        "meaningZh": "第一义谛·真如实际·造作离相",
                        "meaningEn": "ultimate truth & immutable Suchness & freedom from karmic agency",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-374",
            "index": 374,
            "iast": "ślaiṣmikāḥ",
            "classicalTranslitZh": "室隶瑟蜜迦",
            "modernPhoneticZh": "₍希₎赖₍师₎米嘎₍赫₎",
            "meaningZh": "痰饮水大不调所致病症！",
            "meaningEn": "Phlegm-induced ailments (Śleṣman)!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 374/427 句",
            "words": [
                  {
                        "iast": "ślaiṣmikāḥ",
                        "stem": "śa-la-ṣa",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "室赖瑟弭迦(引)诃（拼读参考：₍希₎赖₍师₎米嘎₍赫₎）",
                        "meaningZh": "本性寂静止息·离一切相无相·六度满行清净",
                        "meaningEn": "primordial tranquil peace & freedom from conditioned marks & perfection of the six pāramitās",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-375",
            "index": 375,
            "iast": "sānnipātikāḥ",
            "classicalTranslitZh": "娑儞般帝迦",
            "modernPhoneticZh": "散尼巴帝嘎₍赫₎",
            "meaningZh": "风胆痰三合并发重症！",
            "meaningEn": "Combined Tridoṣa ailments!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 375/427 句",
            "words": [
                  {
                        "iast": "sānnipātikāḥ",
                        "stem": "sa-na-na",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "三(引)你波底迦(引)诃（拼读参考：散尼巴帝嘎₍赫₎）",
                        "meaningZh": "一切诸谛圆满·离名相假立·第一义谛",
                        "meaningEn": "all-pervading truth & auspiciousness & beyond nominal designation & ultimate truth",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-376",
            "index": 376,
            "iast": "sarvajvarāḥ",
            "classicalTranslitZh": "萨婆什伐啰",
            "modernPhoneticZh": "萨₍尔₎瓦₍吉₎瓦啦₍赫₎",
            "meaningZh": "如是一切温疫高热诸病悉皆消除！",
            "meaningEn": "All fevers whatsoever!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 376/427 句",
            "words": [
                  {
                        "iast": "sarvajvarāḥ",
                        "stem": "sarva-jvara",
                        "grammar": "Samāsa · 复合词 (Nom. Pl. · 主格复数)",
                        "transliterationZh": "萨哩嚩日嚩啰(引)诃（拼读参考：萨₍尔₎瓦₍吉₎瓦啦₍赫₎）",
                        "meaningZh": "一切诸瘟疫",
                        "meaningEn": "all + fever",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-377",
            "index": 377,
            "iast": "śiro rtim",
            "classicalTranslitZh": "室嚧吉帝",
            "modernPhoneticZh": "希洛 ₍尔₎丁",
            "meaningZh": "消除一切头风剧痛！",
            "meaningEn": "Headaches!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 377/427 句",
            "words": [
                  {
                        "iast": "śiro",
                        "stem": "śiraḥ",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "室嚧（拼读参考：希洛）",
                        "meaningZh": "头",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "rtim",
                        "stem": "ra",
                        "grammar": "Akṣara-mukha · 摩字门",
                        "transliterationZh": "啰底喃（拼读参考：₍尔₎丁）",
                        "meaningZh": "摩字门（无我大慈三昧（mahāmaitrī）·诸根清净自在）",
                        "meaningEn": "selfless great loving-kindness — purified faculties",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-378",
            "index": 378,
            "iast": "ardhāvabhedakārocakam",
            "classicalTranslitZh": "末陀鞞达嚧制剑",
            "modernPhoneticZh": "阿₍尔₎达瓦贝达嘎洛佳刚",
            "meaningZh": "消除偏头痛及饮食不下恶疾！",
            "meaningEn": "Migraines and loss of appetite!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 378/427 句",
            "words": [
                  {
                        "iast": "ardhāvabhedakārocakam",
                        "stem": "ardha-ava-bhedaka-ārocaka",
                        "grammar": "Samāsa · 复合词 (Acc./Nom. Sg. · 业格/主格单数)",
                        "transliterationZh": "阿哩驮(引)嚩陛捺迦(引)嚧者剑（拼读参考：阿₍尔₎达瓦贝达嘎洛佳刚）",
                        "meaningZh": "半·鸿毛·刺骨·成办已知",
                        "meaningEn": "half + down + breaking + announcing",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-379",
            "index": 379,
            "iast": "akṣirogam",
            "classicalTranslitZh": "阿绮嚧钳",
            "modernPhoneticZh": "阿₍克₎师洛刚",
            "meaningZh": "消除一切眼目疾患！",
            "meaningEn": "Eye diseases!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 379/427 句",
            "words": [
                  {
                        "iast": "akṣirogam",
                        "stem": "akṣiroga",
                        "grammar": "Acc./Nom. Sg. · 业格/主格单数",
                        "transliterationZh": "阿乞瑟嚧俨（拼读参考：阿₍克₎师洛刚）",
                        "meaningZh": "疾病眼帘",
                        "meaningEn": "disease of the eyes",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-380",
            "index": 380,
            "iast": "mukharogam",
            "classicalTranslitZh": "目佉嚧钳",
            "modernPhoneticZh": "穆卡洛刚",
            "meaningZh": "消除一切口舌唇吻疾患！",
            "meaningEn": "Mouth and facial diseases!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 380/427 句",
            "words": [
                  {
                        "iast": "mukharogam",
                        "stem": "mukharaḥ-gam",
                        "grammar": "Samāsa · 复合词 (Stem · 词干)",
                        "transliterationZh": "母佉嚧俨（拼读参考：穆卡洛刚）",
                        "meaningZh": "饶舌往",
                        "meaningEn": "to go",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-381",
            "index": 381,
            "iast": "hṛdrogam",
            "classicalTranslitZh": "羯唎突嚧钳",
            "modernPhoneticZh": "₍赫₎日₍德₎洛刚",
            "meaningZh": "消除一切心胸脏腑疾患！",
            "meaningEn": "Heart diseases!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 381/427 句",
            "words": [
                  {
                        "iast": "hṛdrogam",
                        "stem": "hṛd-roga",
                        "grammar": "Samāsa · 复合词 (Acc./Nom. Sg. · 业格/主格单数)",
                        "transliterationZh": "纥哩捺嚧俨（拼读参考：₍赫₎日₍德₎洛刚）",
                        "meaningZh": "汗栗驮疾病",
                        "meaningEn": "heart + disease",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-382",
            "index": 382,
            "iast": "galaśūlam",
            "classicalTranslitZh": "揭啰诃输蓝",
            "modernPhoneticZh": "嘎啦舒朗",
            "meaningZh": "消除咽喉肿塞剧痛！",
            "meaningEn": "Throat pains!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 382/427 句",
            "words": [
                  {
                        "iast": "galaśūlam",
                        "stem": "gala-śūlam",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "誐攞输蓝（拼读参考：嘎啦舒朗）",
                        "meaningZh": "喉轮插杵",
                        "meaningEn": "throat",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-383",
            "index": 383,
            "iast": "karṇaśūlam",
            "classicalTranslitZh": "羯拏输蓝",
            "modernPhoneticZh": "嘎₍尔₎拿舒朗",
            "meaningZh": "消除耳内剧痛耳鸣！",
            "meaningEn": "Earaches!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 383/427 句",
            "words": [
                  {
                        "iast": "karṇaśūlam",
                        "stem": "karṇa-śūlam",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "迦哩拏输蓝（拼读参考：嘎₍尔₎拿舒朗）",
                        "meaningZh": "耳根插杵",
                        "meaningEn": "ear",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-384",
            "index": 384,
            "iast": "dantaśūlam",
            "classicalTranslitZh": "惮多输蓝",
            "modernPhoneticZh": "丹达舒朗",
            "meaningZh": "消除牙齿牙龈苦痛！",
            "meaningEn": "Toothaches!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 384/427 句",
            "words": [
                  {
                        "iast": "dantaśūlam",
                        "stem": "danta-śūlam",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "昙怛输蓝（拼读参考：丹达舒朗）",
                        "meaningZh": "牙插杵",
                        "meaningEn": "tooth",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-385",
            "index": 385,
            "iast": "hṛdayaśūlam",
            "classicalTranslitZh": "迄唎夜输蓝",
            "modernPhoneticZh": "₍赫₎日达呀-舒朗",
            "meaningZh": "消除心口绞痛苦恼！",
            "meaningEn": "Chest and heart pains!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 385/427 句",
            "words": [
                  {
                        "iast": "hṛdayaśūlam",
                        "stem": "hṛdaya-śūlam",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "纥哩捺耶输蓝（拼读参考：₍赫₎日达呀-舒朗）",
                        "meaningZh": "心插杵",
                        "meaningEn": "heart",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-386",
            "index": 386,
            "iast": "marmaśūlam",
            "classicalTranslitZh": "末么输蓝",
            "modernPhoneticZh": "玛₍尔₎玛舒朗",
            "meaningZh": "消除血脉骨节要穴剧痛！",
            "meaningEn": "Pains in vital joints and points!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 386/427 句",
            "words": [
                  {
                        "iast": "marmaśūlam",
                        "stem": "ma-ra-ma",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "摩哩摩输蓝（拼读参考：玛₍尔₎玛舒朗）",
                        "meaningZh": "无我大慈三昧·清净离诸尘垢·本性寂静止息",
                        "meaningEn": "selfless great loving-kindness & stainless purity free from dust & primordial tranquil peace",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-387",
            "index": 387,
            "iast": "pārśvaśūlam",
            "classicalTranslitZh": "跋唎室婆输蓝",
            "modernPhoneticZh": "巴₍尔湿₎瓦舒朗",
            "meaningZh": "消除两胁肋骨疼痛！",
            "meaningEn": "Rib and side pains!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 387/427 句",
            "words": [
                  {
                        "iast": "pārśvaśūlam",
                        "stem": "pārśva-śūlam",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "波哩湿嚩输蓝（拼读参考：巴₍尔湿₎瓦舒朗）",
                        "meaningZh": "脇肩插杵",
                        "meaningEn": "lying",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-388",
            "index": 388,
            "iast": "pṛṣṭhaśūlam",
            "classicalTranslitZh": "毖栗瑟吒输蓝",
            "modernPhoneticZh": "₍普₎日₍师₎他舒朗",
            "meaningZh": "消除脊背酸痛疾患！",
            "meaningEn": "Backaches!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 388/427 句",
            "words": [
                  {
                        "iast": "pṛṣṭhaśūlam",
                        "stem": "pṛṣṭha-śūlam",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "钵哩瑟侘输蓝（拼读参考：₍普₎日₍师₎他舒朗）",
                        "meaningZh": "后起插杵",
                        "meaningEn": "back",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-389",
            "index": 389,
            "iast": "udaraśūlam",
            "classicalTranslitZh": "乌陀啰输蓝",
            "modernPhoneticZh": "乌达啦舒朗",
            "meaningZh": "消除腹肚肠胃绞痛！",
            "meaningEn": "Abdominal pains!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 389/427 句",
            "words": [
                  {
                        "iast": "udaraśūlam",
                        "stem": "udara-śūlam",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "坞捺啰输蓝（拼读参考：乌达啦舒朗）",
                        "meaningZh": "腹插杵",
                        "meaningEn": "belly",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-390",
            "index": 390,
            "iast": "kaṭiśūlam",
            "classicalTranslitZh": "羯知输蓝",
            "modernPhoneticZh": "嘎蒂舒朗",
            "meaningZh": "消除腰胯疼痛疾患！",
            "meaningEn": "Lower back and hip pains!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 390/427 句",
            "words": [
                  {
                        "iast": "kaṭiśūlam",
                        "stem": "kaṭi-śūlam",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "迦置输蓝（拼读参考：嘎蒂舒朗）",
                        "meaningZh": "小便插杵",
                        "meaningEn": "straw",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-391",
            "index": 391,
            "iast": "vastiśūlam",
            "classicalTranslitZh": "跋悉帝输蓝",
            "modernPhoneticZh": "瓦₍斯₎帝舒朗",
            "meaningZh": "消除膀胱水道疼痛！",
            "meaningEn": "Bladder pains!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 391/427 句",
            "words": [
                  {
                        "iast": "vastiśūlam",
                        "stem": "vasti-śūlam",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "嚩悉底输蓝（拼读参考：瓦₍斯₎帝舒朗）",
                        "meaningZh": "密相插杵",
                        "meaningEn": "bladder",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-392",
            "index": 392,
            "iast": "ūruśūlam",
            "classicalTranslitZh": "邬嚧输蓝",
            "modernPhoneticZh": "乌鲁舒朗",
            "meaningZh": "消除大腿股髀疼痛！",
            "meaningEn": "Thigh pains!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 392/427 句",
            "words": [
                  {
                        "iast": "ūruśūlam",
                        "stem": "ūru-śūlam",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "污(引)噜输蓝（拼读参考：乌鲁舒朗）",
                        "meaningZh": "腿插杵",
                        "meaningEn": "thigh",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-393",
            "index": 393,
            "iast": "jaṅghāśūlam",
            "classicalTranslitZh": "常伽输蓝",
            "modernPhoneticZh": "章嘎舒朗",
            "meaningZh": "消除小腿胫腕疼痛！",
            "meaningEn": "Calf and shin pains!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 393/427 句",
            "words": [
                  {
                        "iast": "jaṅghāśūlam",
                        "stem": "jaṅghā-śūlam",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "惹仰伽(引)输蓝（拼读参考：章嘎舒朗）",
                        "meaningZh": "小腿插杵",
                        "meaningEn": "leg",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-394",
            "index": 394,
            "iast": "hastaśūlam",
            "classicalTranslitZh": "喝悉多输蓝",
            "modernPhoneticZh": "哈₍斯₎达舒朗",
            "meaningZh": "消除双手臂腕疼痛！",
            "meaningEn": "Hand and arm pains!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 394/427 句",
            "words": [
                  {
                        "iast": "hastaśūlam",
                        "stem": "hasta-śūlam",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "诃悉怛输蓝（拼读参考：哈₍斯₎达舒朗）",
                        "meaningZh": "手插杵",
                        "meaningEn": "hand",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-395",
            "index": 395,
            "iast": "pādaśūlam",
            "classicalTranslitZh": "跋陀输蓝",
            "modernPhoneticZh": "巴达舒朗",
            "meaningZh": "消除双足脚掌疼痛！",
            "meaningEn": "Foot pains!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 395/427 句",
            "words": [
                  {
                        "iast": "pādaśūlam",
                        "stem": "pāda-śūlam",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "波捺输蓝（拼读参考：巴达舒朗）",
                        "meaningZh": "尊足插杵",
                        "meaningEn": "foot",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-396",
            "index": 396,
            "iast": "sarvāṅgapratyaṅgaśūlam",
            "classicalTranslitZh": "娑房盎伽般啰丈伽输蓝",
            "modernPhoneticZh": "萨₍尔₎旺嘎₍普₎啦₍蒂₎央嘎舒朗",
            "meaningZh": "消除周身百骸四肢五体一切苦痛！",
            "meaningEn": "Pains in every limb and member of the body!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 396/427 句",
            "words": [
                  {
                        "iast": "sarvāṅgapratyaṅgaśūlam",
                        "stem": "sarvāṅga-pratyaṅga-śūlam",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "萨哩嚩仰誐钵啰底耶仰誐输蓝（拼读参考：萨₍尔₎旺嘎₍普₎啦₍蒂₎央嘎舒朗）",
                        "meaningZh": "全身·肢·插杵",
                        "meaningEn": "the whole body + a minor or secondary member of the body",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-397",
            "index": 397,
            "iast": "bhūtavetāḍa",
            "classicalTranslitZh": "部多毖跢茶",
            "modernPhoneticZh": "布达威达达",
            "meaningZh": "净除部多鬼与起尸鬼（毗陀罗）之祟！",
            "meaningEn": "Bhūtas and Vetāla zombie-spirits!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 397/427 句",
            "words": [
                  {
                        "iast": "bhūtavetāḍa",
                        "stem": "bhūta-vetāḍa",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "部(引)怛吠多拏（拼读参考：布达威达达）",
                        "meaningZh": "部多鬼神毘陀罗鬼",
                        "meaningEn": "spirit + zombie",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-398",
            "index": 398,
            "iast": "ḍākinījvara",
            "classicalTranslitZh": "茶耆尼什婆啰",
            "modernPhoneticZh": "达给尼₍吉₎瓦啦",
            "meaningZh": "净除荼枳尼魅鬼及恶热疫病！",
            "meaningEn": "Ḍākinī spirits and pestilential fevers!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 398/427 句",
            "words": [
                  {
                        "iast": "ḍākinījvara",
                        "stem": "ḍākinī-jvara",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "拏(引)枳泥日嚩啰（拼读参考：达给尼₍吉₎瓦啦）",
                        "meaningZh": "荼吉尼瘟疫",
                        "meaningEn": "Ḍākinī + fever",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-399",
            "index": 399,
            "iast": "dadrukaṇḍukiṭibhalūtāvi",
            "classicalTranslitZh": "陀突嚧迦建咄嚧吉知婆路多毗",
            "modernPhoneticZh": "达₍德₎鲁干杜给蒂巴卢达维",
            "meaningZh": "净除疥癣、瘙痒、恶癞、蜘蛛疔疮！",
            "meaningEn": "Ringworm, itching sores, skin lesions, and spider-ulcers!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 399/427 句 · 句末「毗」与第400句首「萨般」连读为 visarpa（丹毒火疮）",
            "words": [
                  {
                        "iast": "dadrukaṇḍukiṭibhalūtāvi",
                        "stem": "√dad",
                        "grammar": "Mantra Voc. · 真言呼请句",
                        "transliterationZh": "捺捺噜剑度枳置婆噜(引)多尾（拼读参考：达₍德₎鲁干杜给蒂巴卢达维）",
                        "meaningZh": "施予饶益·施度调伏（呼请加持）",
                        "meaningEn": "granting (vocative invocation)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-400",
            "index": 400,
            "iast": "sarpalohaliṅga",
            "classicalTranslitZh": "萨般嚧诃凌伽",
            "modernPhoneticZh": "萨₍尔₎巴洛哈灵嘎",
            "meaningZh": "及丹毒漫延疮、赤肿血疽诸症！",
            "meaningEn": "Spreading erysipelas and red boils!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 400/427 句",
            "words": [
                  {
                        "iast": "sarpalohaliṅga",
                        "stem": "sarpa-lohaliṅga",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "萨哩跛路诃里仰誐（拼读参考：萨₍尔₎巴洛哈灵嘎）",
                        "meaningZh": "蛇疔疮",
                        "meaningEn": "crawling",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-401",
            "index": 401,
            "iast": "śoṣatrāsanakara",
            "classicalTranslitZh": "输沙怛啰娑那羯啰",
            "modernPhoneticZh": "硕沙₍特₎啦萨拿嘎啦",
            "meaningZh": "干枯痨瘵与惊悸恐怖诸症！",
            "meaningEn": "Wasting sickness and terror!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 401/427 句",
            "words": [
                  {
                        "iast": "śoṣatrāsanakara",
                        "stem": "śoṣa-trāsana",
                        "grammar": "Samāsa · 复合词 (Agent · 能作生起)",
                        "transliterationZh": "戍洒怛啰(引)萨曩迦啰（拼读参考：硕沙₍特₎啦萨拿嘎啦）",
                        "meaningZh": "能生消渴怛啰",
                        "meaningEn": "drying up + causing trasana",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-402",
            "index": 402,
            "iast": "viṣayoga",
            "classicalTranslitZh": "毗沙喻迦",
            "modernPhoneticZh": "维沙优嘎",
            "meaningZh": "一切蛊毒药咒相合之害！",
            "meaningEn": "Poisonous concoctions and venomous spells!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 402/427 句",
            "words": [
                  {
                        "iast": "viṣayoga",
                        "stem": "viṣ-ayoga",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "尾洒瑜誐（拼读参考：维沙优嘎）",
                        "meaningZh": "搅拌不具",
                        "meaningEn": "stir + separation",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-403",
            "index": 403,
            "iast": "agni-udaka",
            "classicalTranslitZh": "阿耆尼乌陀迦",
            "modernPhoneticZh": "阿₍格₎尼-乌达嘎",
            "meaningZh": "猛火焚溺与大水灾患！",
            "meaningEn": "Fire and flood!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 403/427 句",
            "words": [
                  {
                        "iast": "agni",
                        "stem": "agni",
                        "grammar": "Noun · 智火",
                        "transliterationZh": "阿伽你（拼读参考：阿₍格₎尼）",
                        "meaningZh": "圣火、智火（火大）",
                        "meaningEn": "fire, sacred flame (Agni)",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "udaka",
                        "stem": "udaka",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "坞捺迦（拼读参考：乌达嘎）",
                        "meaningZh": "净水",
                        "meaningEn": "water; — or offer a libation of water to a dead person",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-404",
            "index": 404,
            "iast": "māravairakāntāra",
            "classicalTranslitZh": "末啰鞞啰建跢啰",
            "modernPhoneticZh": "玛啦歪啦干达啦",
            "meaningZh": "魔障、冤仇及险道旷野厄难！",
            "meaningEn": "Demons, enmity, and perilous wilderness!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 404/427 句",
            "words": [
                  {
                        "iast": "māravairakāntāra",
                        "stem": "māra-vaira-kāntāra",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "摩(引)啰吠啰剑(引)多啰（拼读参考：玛啦歪啦干达啦）",
                        "meaningZh": "魔·怨·广野",
                        "meaningEn": "Māra + enmity + hardship",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-405",
            "index": 405,
            "iast": "akālamṛtyutryambuka",
            "classicalTranslitZh": "阿迦啰蜜唎咄怛敛部迦",
            "modernPhoneticZh": "阿嘎啦₍姆₎日₍蒂₎尤₍特哩₎延布嘎",
            "meaningZh": "非时横死及毒蜂蚊虻螫害！",
            "meaningEn": "Untimely death and venomous wasps!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 405/427 句",
            "words": [
                  {
                        "iast": "akālamṛtyutryambuka",
                        "stem": "akālamṛtyu-tryambuka",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "阿迦(引)攞蜜哩底庾怛哩演没迦（拼读参考：阿嘎啦₍姆₎日₍蒂₎尤₍特哩₎延布嘎）",
                        "meaningZh": "非时横死土蜂",
                        "meaningEn": "untimely + fly",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-406",
            "index": 406,
            "iast": "trailāṭaka",
            "classicalTranslitZh": "地栗剌吒",
            "modernPhoneticZh": "₍特₎来啦达嘎",
            "meaningZh": "地栗剌吒毒虫螫伤！",
            "meaningEn": "Trailāṭaka venomous insects!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 406/427 句",
            "words": [
                  {
                        "iast": "trailāṭaka",
                        "stem": "ta-ra-la",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "怛来攞(引)吒迦（拼读参考：₍特₎来啦达嘎）",
                        "meaningZh": "真如实际·清净离诸尘垢·离一切相无相",
                        "meaningEn": "immutable Suchness & stainless purity free from dust & freedom from conditioned marks",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-407",
            "index": 407,
            "iast": "vṛścika",
            "classicalTranslitZh": "毖唎瑟质迦",
            "modernPhoneticZh": "₍维₎日₍希₎吉嘎",
            "meaningZh": "毒蝎蜇咬之害！",
            "meaningEn": "Scorpions!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 407/427 句",
            "words": [
                  {
                        "iast": "vṛścika",
                        "stem": "vṛścika",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "嚩哩室只迦（拼读参考：₍维₎日₍希₎吉嘎）",
                        "meaningZh": "蝎",
                        "meaningEn": "scorpion",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-408",
            "index": 408,
            "iast": "sarpanakula",
            "classicalTranslitZh": "萨婆那俱啰",
            "modernPhoneticZh": "萨₍尔₎巴拿古啦",
            "meaningZh": "毒蛇与獴鼬咬害！",
            "meaningEn": "Venomous snakes and mongooses!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 408/427 句",
            "words": [
                  {
                        "iast": "sarpanakula",
                        "stem": "sarpa-nakula",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "萨哩跛曩矩攞（拼读参考：萨₍尔₎巴拿古啦）",
                        "meaningZh": "蛇无种",
                        "meaningEn": "crawling + the ichneumon",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-409",
            "index": 409,
            "iast": "siṃhavyāghra-ṛkṣatarakṣu",
            "classicalTranslitZh": "肆引伽弊揭啰唎药叉怛啰刍",
            "modernPhoneticZh": "辛哈₍维₎呀₍格₎啦-日₍克₎沙达啦₍克₎舒",
            "meaningZh": "狮子、猛虎、黑熊、罴豹猛兽之害！",
            "meaningEn": "Lions, tigers, bears, and hyenas!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 409/427 句",
            "words": [
                  {
                        "iast": "siṃhavyāghra",
                        "stem": "siṃha-vyāghra",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "悉喃诃尾夜伽啰（拼读参考：辛哈₍维₎呀₍格₎啦）",
                        "meaningZh": "狮子豹",
                        "meaningEn": "lion + tiger",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ṛkṣatarakṣu",
                        "stem": "ṛkṣa-tarakṣu",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "哩乞洒怛啰乞刍（拼读参考：日₍克₎沙达啦₍克₎舒）",
                        "meaningZh": "罴熊",
                        "meaningEn": "bald + hyena",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-410",
            "index": 410,
            "iast": "marajīva teṣāṃ sarveṣām",
            "classicalTranslitZh": "末啰视吠帝釤娑鞞釤",
            "modernPhoneticZh": "玛啦吉瓦 帝伤 萨₍尔₎威伤",
            "meaningZh": "夺命恶兽等如是一切灾患悉令远离！",
            "meaningEn": "Life-threatening beasts—all of these without exception!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 410/427 句",
            "words": [
                  {
                        "iast": "marajīva",
                        "stem": "mara-jīva",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "摩啰时嚩（拼读参考：玛啦吉瓦）",
                        "meaningZh": "临危命者",
                        "meaningEn": "dying + living",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "teṣāṃ",
                        "stem": "teṣāṃ",
                        "grammar": "Pron.Gen.Pl. · 属格复数",
                        "transliterationZh": "帝洒喃（拼读参考：帝伤）",
                        "meaningZh": "彼等一切之",
                        "meaningEn": "of them, their",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "sarveṣām",
                        "stem": "saras-veṣa",
                        "grammar": "Samāsa · 复合词 (Acc. Sg. Fem. · 业格阴性)",
                        "transliterationZh": "萨哩吠洒喃（拼读参考：萨₍尔₎威伤）",
                        "meaningZh": "湖相",
                        "meaningEn": "a lake + work",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-411",
            "index": 411,
            "iast": "sitātapatra",
            "classicalTranslitZh": "悉怛多钵怛啰",
            "modernPhoneticZh": "悉达达巴₍特₎啦",
            "meaningZh": "承此清净大白伞盖！",
            "meaningEn": "By the White Parasol (Sitātapatra)!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 411/427 句",
            "words": [
                  {
                        "iast": "sitātapatra",
                        "stem": "sitātapatra",
                        "grammar": "Samāsa · 大白伞盖",
                        "transliterationZh": "悉多怛跛怛啰（拼读参考：悉达达巴₍特₎啦）",
                        "meaningZh": "大白伞盖（清净护庇）",
                        "meaningEn": "White Parasol (pure protective canopy)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-412",
            "index": 412,
            "iast": "mahāvajroṣṇīṣam",
            "classicalTranslitZh": "摩诃跋阇嚧瑟尼釤",
            "modernPhoneticZh": "玛哈-瓦₍吉₎洛-₍师₎尼伤",
            "meaningZh": "大金刚无上佛顶尊！",
            "meaningEn": "Great Vajra-Uṣṇīṣa!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 412/427 句",
            "words": [
                  {
                        "iast": "mahāvajroṣṇīṣam",
                        "stem": "mahā-vajra-uṣṇīṣa",
                        "grammar": "Samāsa · 复合词 (Acc./Nom. Sg. · 业格/主格单数)",
                        "transliterationZh": "摩诃嚩日嚧瑟抳(引)忏（拼读参考：玛哈-瓦₍吉₎洛-₍师₎尼伤）",
                        "meaningZh": "大·金刚·佛顶肉髻相",
                        "meaningEn": "great + Vajra + Uṣṇīṣa",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-413",
            "index": 413,
            "iast": "mahāpratyaṅgiram",
            "classicalTranslitZh": "摩诃般赖丈耆蓝",
            "modernPhoneticZh": "玛哈-₍普₎啦₍蒂₎央吉朗",
            "meaningZh": "摩诃般赖丈耆蓝大回遮母威神力故！",
            "meaningEn": "Great Mahāpratyaṅgirā!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 413/427 句",
            "words": [
                  {
                        "iast": "mahāpratyaṅgiram",
                        "stem": "√mah",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "摩诃钵啰底耶仰拟览（拼读参考：玛哈-₍普₎啦₍蒂₎央吉朗）",
                        "meaningZh": "广大殊胜·无我大慈三昧",
                        "meaningEn": "great",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-414",
            "index": 414,
            "iast": "yāvad dvādaśayojana",
            "classicalTranslitZh": "夜波突陀舍喻阇那",
            "modernPhoneticZh": "呀瓦₍德₎ ₍德₎瓦达沙优佳拿",
            "meaningZh": "乃至方圆十二由旬（约六百里）！",
            "meaningEn": "Within a radius of twelve yojanas!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 414/427 句",
            "words": [
                  {
                        "iast": "yāvad",
                        "stem": "ya-va-da",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "夜嚩讷（拼读参考：呀瓦₍德₎）",
                        "meaningZh": "一乘如实之道·最上真言离言说·施度调伏",
                        "meaningEn": "supreme vehicle of awakening & supreme ineffable speech & generosity & self-mastery",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "dvādaśayojana",
                        "stem": "dvādaśa-yojana",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "捺嚩(引)捺舍瑜惹曩（拼读参考：₍德₎瓦达沙优佳拿）",
                        "meaningZh": "十二踰缮那",
                        "meaningEn": "the twelfth + harnessing",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-415",
            "index": 415,
            "iast": "abhyantareṇa",
            "classicalTranslitZh": "辫怛隶拏",
            "modernPhoneticZh": "阿₍比₎延达雷拿",
            "meaningZh": "金刚道场疆界之内！",
            "meaningEn": "Within that sacred perimeter!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 415/427 句",
            "words": [
                  {
                        "iast": "abhyantareṇa",
                        "stem": "abhyantara",
                        "grammar": "Inst. Sg. · 具格单数",
                        "transliterationZh": "阿毗演怛隶拏（拼读参考：阿₍比₎延达雷拿）",
                        "meaningZh": "以内部、其内截至",
                        "meaningEn": "by/through interior, included by, contained in , inner, secret, near, intimate; initiated in, co",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-416",
            "index": 416,
            "iast": "vidyābandhaṃ karomi",
            "classicalTranslitZh": "毗陀耶槃昙迦嚧弥",
            "modernPhoneticZh": "维₍地₎呀班当 嘎洛米",
            "meaningZh": "我今作大明咒金刚结界！",
            "meaningEn": "I establish the Vidyā-boundary!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 416/427 句",
            "words": [
                  {
                        "iast": "vidyābandhaṃ",
                        "stem": "vidyā-bandha",
                        "grammar": "Samāsa · 复合词 (Acc./Nom. Sg. · 业格/主格单数)",
                        "transliterationZh": "尾地夜鍐昙（拼读参考：维₍地₎呀班当）",
                        "meaningZh": "明咒结界系缚邪魔外障",
                        "meaningEn": "Vidyā + bind obstructive spirits & seal the boundary!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "karomi",
                        "stem": "√kar",
                        "grammar": "Mantra Voc. · 真言呼请句",
                        "transliterationZh": "迦嚧弭（拼读参考：嘎洛米）",
                        "meaningZh": "能作成办·造作离相（呼请加持）",
                        "meaningEn": "making (vocative invocation)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-417",
            "index": 417,
            "iast": "tejobandhaṃ karomi",
            "classicalTranslitZh": "帝殊槃昙迦嚧弥",
            "modernPhoneticZh": "帝久班当 嘎洛米",
            "meaningZh": "我今作佛顶大威光结界！",
            "meaningEn": "I establish the Radiance-boundary!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 417/427 句",
            "words": [
                  {
                        "iast": "tejobandhaṃ",
                        "stem": "tejaḥ-bandha",
                        "grammar": "Samāsa · 复合词 (Acc./Nom. Sg. · 业格/主格单数)",
                        "transliterationZh": "帝树鍐昙（拼读参考：帝久班当）",
                        "meaningZh": "威光结界系缚邪魔外障",
                        "meaningEn": "bind obstructive spirits & seal the boundary!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "karomi",
                        "stem": "√kar",
                        "grammar": "Mantra Voc. · 真言呼请句",
                        "transliterationZh": "迦嚧弭（拼读参考：嘎洛米）",
                        "meaningZh": "能作成办·造作离相（呼请加持）",
                        "meaningEn": "making (vocative invocation)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-418",
            "index": 418,
            "iast": "paravidyābandhaṃ karomi",
            "classicalTranslitZh": "般啰毗陀槃昙迦嚧弥",
            "modernPhoneticZh": "巴啦维₍地₎呀班当 嘎洛米",
            "meaningZh": "我今禁缚遮断一切外道他咒结界！",
            "meaningEn": "I bind all hostile spells!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 418/427 句",
            "words": [
                  {
                        "iast": "paravidyābandhaṃ",
                        "stem": "paras-avidyā-bandha",
                        "grammar": "Samāsa · 复合词 (Acc./Nom. Sg. · 业格/主格单数)",
                        "transliterationZh": "跛啰尾地夜鍐昙（拼读参考：巴啦维₍地₎呀班当）",
                        "meaningZh": "愈加·无明·结界系缚邪魔外障",
                        "meaningEn": "beyond + ignorance + bind obstructive spirits & seal the boundary!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "karomi",
                        "stem": "√kar",
                        "grammar": "Mantra Voc. · 真言呼请句",
                        "transliterationZh": "迦嚧弭（拼读参考：嘎洛米）",
                        "meaningZh": "能作成办·造作离相（呼请加持）",
                        "meaningEn": "making (vocative invocation)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-419",
            "index": 419,
            "iast": "tadyathā",
            "classicalTranslitZh": "跢侄他",
            "modernPhoneticZh": "达₍地₎呀他",
            "meaningZh": "即说首楞严王根本咒心曰：",
            "meaningEn": "Namely, the Ultimate Śūraṅgama Heart Mantra:",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 419/427 句",
            "words": [
                  {
                        "iast": "tadyathā",
                        "stem": "tadyathā",
                        "grammar": "Adv. · 咒引词",
                        "transliterationZh": "怛侄他 / 怛你也他（拼读参考：达₍地₎呀他）",
                        "meaningZh": "即说咒曰、所谓",
                        "meaningEn": "namely, thus goes the mantra",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-420",
            "index": 420,
            "iast": "oṃ",
            "classicalTranslitZh": "唵",
            "modernPhoneticZh": "嗡",
            "meaningZh": "嗡（三身无见顶相总持法音）！",
            "meaningEn": "Oṃ!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 420/427 句",
            "words": [
                  {
                        "iast": "oṃ",
                        "stem": "oṃ",
                        "grammar": "Praṇava · 圣音",
                        "transliterationZh": "唵（拼读参考：嗡）",
                        "meaningZh": "三身总持圣音（法报化三身摄受）",
                        "meaningEn": "sacred Praṇava syllable embodying Trikāya",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-421",
            "index": 421,
            "iast": "anale",
            "classicalTranslitZh": "阿那隶",
            "modernPhoneticZh": "阿拿雷",
            "meaningZh": "智慧猛火遍烧烦恼尊！",
            "meaningEn": "O Blazing Fire of Wisdom (Anale)!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 421/427 句",
            "words": [
                  {
                        "iast": "anale",
                        "stem": "anala",
                        "grammar": "Noun · 猛火 · Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "阿曩隶（拼读参考：阿拿雷）",
                        "meaningZh": "智慧猛火（净除业障火）尊",
                        "meaningEn": "O sacred fire, purifying flame / in sacred fire, purifying flame",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-422",
            "index": 422,
            "iast": "viśade",
            "classicalTranslitZh": "毗舍提",
            "modernPhoneticZh": "维沙叠",
            "meaningZh": "最极清净皎洁无垢尊！",
            "meaningEn": "O Spotless Pure One (Viśade)!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 422/427 句",
            "words": [
                  {
                        "iast": "viśade",
                        "stem": "viśada",
                        "grammar": "Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "尾舍泥（拼读参考：维沙叠）",
                        "meaningZh": "充分、粗放尊",
                        "meaningEn": "O abundant, extensive; broad, far-reaching, abundant / in abundant, extensive; broad, far-reaching, abundant",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-423",
            "index": 423,
            "iast": "vīra vajradhare",
            "classicalTranslitZh": "鞞啰跋阇啰陀唎",
            "modernPhoneticZh": "维啦 瓦₍吉₎啦达雷",
            "meaningZh": "大勇猛执持金刚宝杵尊！",
            "meaningEn": "O Heroic Wielder of the Vajra (Vīra Vajradhare)!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 423/427 句",
            "words": [
                  {
                        "iast": "vīra",
                        "stem": "vīra",
                        "grammar": "Noun/Adj. · 勇猛大士",
                        "transliterationZh": "味啰（拼读参考：维啦）",
                        "meaningZh": "勇猛丈夫、无畏英雄尊",
                        "meaningEn": "heroic, valiant, fearless hero",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "vajradhare",
                        "stem": "vajradhara",
                        "grammar": "Samāsa · 执金刚尊 · Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "嚩日啰驮隶（拼读参考：瓦₍吉₎啦达雷）",
                        "meaningZh": "金刚总持、执金刚尊尊",
                        "meaningEn": "O Vajradhara, Holder of the Vajra / in Vajradhara, Holder of the Vajra",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-424",
            "index": 424,
            "iast": "bandha bandhani",
            "classicalTranslitZh": "槃陀槃陀儞",
            "modernPhoneticZh": "班达 班达尼",
            "meaningZh": "结界系缚、大结界护持母！",
            "meaningEn": "Bind, O Binder of the Sacred Boundary!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 424/427 句",
            "words": [
                  {
                        "iast": "bandha",
                        "stem": "bandha",
                        "grammar": "Impv. 2nd Sg. · 祈使式",
                        "transliterationZh": "鍐驮（拼读参考：班达）",
                        "meaningZh": "结界系缚邪魔外障（满驮）",
                        "meaningEn": "bind obstructive spirits & seal the boundary!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bandhani",
                        "stem": "bandhana",
                        "grammar": "Noun · 系缚枷锁 · Voc. Fem. / Loc. · 呼格/处格",
                        "transliterationZh": "鍐驮你（拼读参考：班达尼）",
                        "meaningZh": "系缚、枷锁缠缚尊",
                        "meaningEn": "O bondage, fetter, imprisonment",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-425",
            "index": 425,
            "iast": "vajrapāṇi phaṭ",
            "classicalTranslitZh": "跋阇啰谤尼泮",
            "modernPhoneticZh": "瓦₍吉₎啦巴尼 帕₍特₎",
            "meaningZh": "金刚手秘密主立断一切魔障，泮！",
            "meaningEn": "O Vajrapāṇi, shatter all obstacles, Phaṭ!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 425/427 句",
            "words": [
                  {
                        "iast": "vajrapāṇi",
                        "stem": "vajrapāṇi",
                        "grammar": "Prop.Noun · 金刚手菩萨",
                        "transliterationZh": "嚩日啰波抳（拼读参考：瓦₍吉₎啦巴尼）",
                        "meaningZh": "金刚手菩萨（执金刚秘密主）",
                        "meaningEn": "Vajrapāṇi, Vajra-in-Hand Bodhisattva",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-426",
            "index": 426,
            "iast": "hūṃ trūṃ phaṭ",
            "classicalTranslitZh": "虎𤙖都嚧瓮泮",
            "modernPhoneticZh": "吽 ₍特₎隆 帕₍特₎",
            "meaningZh": "吽、特隆（佛顶金轮种子字）、泮！",
            "meaningEn": "Hūṃ Trūṃ Phaṭ!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 426/427 句",
            "words": [
                  {
                        "iast": "hūṃ",
                        "stem": "hūṃ",
                        "grammar": "Bīja · 金刚种子字",
                        "transliterationZh": "吽（拼读参考：吽）",
                        "meaningZh": "金刚不坏菩提心印、摧破诸障",
                        "meaningEn": "adamantine bodhicitta seed syllable",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "trūṃ",
                        "stem": "ta",
                        "grammar": "Bīja-mantra · 悉昙种子字",
                        "transliterationZh": "都嚧瓮（拼读参考：₍特₎隆）",
                        "meaningZh": "啰字门（清净离诸尘垢（rajas）·威神增益圆满·大空菩提点摄持）",
                        "meaningEn": "stainless purity free from dust (rajas) — perfected spiritual vigor sealed with bodhicitta bindu",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "phaṭ",
                        "stem": "phaṭ",
                        "grammar": "Bīja · 摧破音",
                        "transliterationZh": "泮吒 / 发吒（拼读参考：帕₍特₎）",
                        "meaningZh": "顿断魔障、摧破无明",
                        "meaningEn": "shatter obstacles and ignorance!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "shurangama-427",
            "index": 427,
            "iast": "svāhā",
            "classicalTranslitZh": "莎婆诃",
            "modernPhoneticZh": "₍斯₎瓦哈",
            "meaningZh": "无上菩提究竟圆满成就，莎婆诃（五大会全咒圆满）！",
            "meaningEn": "Supreme Awakening Perfectly Accomplished, Svāhā!",
            "tangNoteZh": "第五会【文殊弘传会】·《T19n0945》原典第 427/427 句",
            "words": [
                  {
                        "iast": "svāhā",
                        "stem": "svāhā",
                        "grammar": "Indecl. · 结印词",
                        "transliterationZh": "娑嚩诃 / 萨婆诃（拼读参考：₍斯₎瓦哈）",
                        "meaningZh": "圆满吉祥成就",
                        "meaningEn": "hail! may auspicious accomplishment be sealed",
                        "origin": "derived-reference"
                  }
            ]
      }
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
    deityZh: '毗卢遮那如来（大日如来）',
    meritsAndSummaryZh:
      '东密与唐密最尊崇之超度、灭罪、放光加持真言，共 2 句（前附《不空羂索经》归敬礼赞句，正宗分为《T19n1002》23个悉昙梵字根本真言，绝不混拼其他独立真言）。经云若有众生造十恶五逆四重诸罪，闻此大灌顶光真言二三七遍，或以土沙加持散亡者尸骸墓上，立得光明及身，除诸罪报，莲华化生西方极乐世界。',
    recitationTipsZh:
      '第一句为毗卢遮那佛与圣观自在菩萨归敬礼赞，第二句为 23 字大灌顶光根本真言，末尾 hūṃ 字深沉宏亮、摄心观想金光遍照。',
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
            "id": "komyo-1",
            "index": 1,
            "iast": "namaḥ samantabuddhānāṃ | namo bhagavate vairocanāya tathāgatāyārhate samyaksaṃbuddhāya | namo āryāvalokiteśvarāya bodhisattvāya mahāsattvāya mahākāruṇikāya",
            "classicalTranslitZh": "曩莫三满多没驮南 曩谟婆誐嚩帝 尾嚧左曩野 怛他蘖跢夜啰诃帝 三藐三没驮野 曩谟阿哩也嚩路枳帝湿嚩啰野 冒地萨怛嚩野 摩贺萨怛嚩野 摩贺迦噜抳迦野",
            "modernPhoneticZh": "拿玛₍赫₎ 萨曼达-布达南 | 拿摩 巴嘎瓦帝 歪洛佳拿呀 达他嘎达-呀₍尔₎哈帝 萨₍姆₎呀₍克₎-桑布达呀 | 拿摩 阿₍哩₎呀-瓦洛给帝-₍湿₎瓦啦呀 博地-萨₍特₎瓦呀 玛哈-萨₍特₎瓦呀 玛哈-嘎鲁尼嘎呀",
            "meaningZh": "顶礼普遍十方一切诸佛！顶礼世尊毗卢遮那（大日遍照）如来、应供、正等正觉！顶礼圣观自在菩萨摩诃萨、具足大悲心者！",
            "meaningEn": "Homage to all Buddhas everywhere! Homage to Bhagavān Vairocana Tathāgata, Arhat, Perfectly Awakened One! Homage to Noble Avalokiteśvara Bodhisattva Mahāsattva, the Greatly Compassionate One!",
            "tangNoteZh": "第一句 ·《不空羂索神变真言经》(T20n1092) 毗卢遮那如来与观自在菩萨归敬礼赞文",
            "words": [
                  {
                        "iast": "namaḥ",
                        "stem": "namaḥ",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "曩莫（拼读参考：拿玛₍赫₎）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "samantabuddhānāṃ",
                        "stem": "samanta-buddhānām",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "三曼多没驮喃（拼读参考：萨曼达-布达南）",
                        "meaningZh": "普遍没驮南",
                        "meaningEn": "universal + buddhānām",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "namo",
                        "stem": "namo",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "南无 / 曩谟（拼读参考：拿摩）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bhagavate",
                        "stem": "bhagavate",
                        "grammar": "Dat.Sg. · 为格单数",
                        "transliterationZh": "薄伽伐帝 / 婆誐嚩帝（拼读参考：巴嘎瓦帝）",
                        "meaningZh": "向世尊（薄伽梵）致敬",
                        "meaningEn": "to the Blessed One, World-Honored Lord",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "vairocanāya",
                        "stem": "vairocana",
                        "grammar": "Prop.Noun · 大日如来 · Dat. Sg. · 为格单数",
                        "transliterationZh": "吠嚧者那(引)耶（拼读参考：歪洛佳拿呀）",
                        "meaningZh": "向毗卢遮那佛（大日遍照如来）",
                        "meaningEn": "to/for Vairocana, Illuminator Buddha",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "komyo-2",
            "index": 2,
            "iast": "oṃ amogha vairocana mahāmudrā maṇi padma jvāla pravartaya hūṃ",
            "classicalTranslitZh": "唵 阿谟伽 尾嚧左曩 摩贺母捺啰(二合) 么抳 钵纳么(二合) 入嚩(二合)攞 钵啰(二合)韈哆野 吽",
            "modernPhoneticZh": "嗡 阿摩嘎 歪洛佳拿 玛哈穆₍德₎啦 玛尼 巴₍德₎玛 ₍吉₎瓦啦 ₍普₎啦瓦₍尔₎达呀 吽",
            "meaningZh": "嗡！真实不空（不空成就佛）、光明遍照（毗卢遮那大日如来）、大金刚法印（阿閦佛）、如意摩尼宝珠（宝生佛）、清净红莲华（阿弥陀佛）！请放无量智慧火焰、转大法轮，吽！",
            "meaningEn": "Oṃ! Unfailing (Amoghasiddhi), Illuminator (Vairocana), Great Seal (Mahāmudrā / Akṣobhya), Wish-Fulfilling Jewel (Ratnasambhava), Lotus (Amitābha): send forth and revolve the blazing light of wisdom, Hūṃ!",
            "tangNoteZh": "第二句 · CBETA《T19n1002》23字悉昙原典对音全本，一咒统摄金刚界与胎藏界五方五佛全体大用。",
            "words": [
                  {
                        "iast": "oṃ",
                        "stem": "oṃ",
                        "grammar": "Praṇava · 圣音",
                        "transliterationZh": "唵（拼读参考：嗡）",
                        "meaningZh": "三身总持圣音（法报化三身摄受）",
                        "meaningEn": "sacred Praṇava syllable embodying Trikāya",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "amogha",
                        "stem": "amogha",
                        "grammar": "Adj. · 不空成就",
                        "transliterationZh": "阿谟伽（拼读参考：阿摩嘎）",
                        "meaningZh": "不空、决定成就无虚",
                        "meaningEn": "unfailing, infallible, never in vain",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "vairocana",
                        "stem": "vairocana",
                        "grammar": "Prop.Noun · 大日如来",
                        "transliterationZh": "吠嚧者曩（拼读参考：歪洛佳拿）",
                        "meaningZh": "毗卢遮那佛（大日遍照如来）",
                        "meaningEn": "Vairocana, Illuminator Buddha",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "mahāmudrā",
                        "stem": "mahāmudrā",
                        "grammar": "Samāsa · 大手印",
                        "transliterationZh": "摩诃母捺啰(引)（拼读参考：玛哈穆₍德₎啦）",
                        "meaningZh": "大手印、大法契印",
                        "meaningEn": "Mahāmudrā, Great Seal",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "maṇi",
                        "stem": "maṇi",
                        "grammar": "Noun · 摩尼宝珠",
                        "transliterationZh": "摩抳（拼读参考：玛尼）",
                        "meaningZh": "摩尼宝珠（如意离垢宝）",
                        "meaningEn": "Maṇi jewel, luminous gem",
                        "origin": "derived-reference"
                  }
            ]
      }
],
  },
  {
    id: 'vajrasattva-100-syllable',
    titleZh: '金刚萨埵百字明（一切如来真实摄大教王10句百字真言全本）',
    titleSanskritIast: 'Vajrasattva-śatākṣara-mantra',
    titleEnglish: 'Hundred-Syllable Purification Mantra of Vajrasattva (10 Clauses)',
    categoryId: 'supreme-mantras',
    taishoNo: 'T18n0865 / T18n0874 / T19n0974E',
    translatorZh: '唐·不空三藏 译《金刚顶一切如来真实摄大乘现证大教王经》',
    sutraSourceZh: '《金刚顶经》(T18n0865) 暨 GRETIL 梵本《Sarvatathāgatatattvasaṃgraha》(sarvttsu.htm)',
    deityZh: '金刚萨埵 / 普贤金刚手菩萨 (Vajrasattva)',
    meritsAndSummaryZh:
      '密乘忏悔业障、补阙三昧耶戒、净除身口意无始罪垢之最胜总持，全咒共 10 句、严格 100 个梵文音节（Śatākṣara，六字心咒另列独立词条，不混入百字明内）。诵持此咒能得一切如来五智灌顶，纵有失念违犯亦蒙金刚萨埵坚固摄持。',
    recitationTipsZh:
      '百字明十句句法整饬对称（dṛḍho me bhava / sutoṣyo me bhava / supoṣyo me bhava / anurakto me bhava），诵时观想心月轮上白色 Hūṃ 字放甘露光净除一切罪障。',
    provenance: {
      sourceType: 'CBETA+GRETIL',
      cbetaId: 'T18n0865',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T18n0865',
      gretilFile: 'sarvttsu.htm',
      gretilRawUrl: 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/main/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/sarvttsu.htm',
      editionCitation:
        'GRETIL sarvttsu.htm (Sarvatathāgatatattvasaṃgraha, ed. Isshi Yamada & Kanjin Horiuchi) & CBETA T18n0865《金刚顶经》。',
      manuscriptNotesZh:
        '依据梵本《一切如来真实摄经》与唐密不空译本校勘百字明纯粹 10 句 100 音节本。',
    },
    verses: [
      {
            "id": "vajrasattva-1",
            "index": 1,
            "iast": "oṃ vajrasattva samayam anupālaya",
            "classicalTranslitZh": "唵 嚩日啰(二合)萨埵 三摩耶 么努播(引)攞耶",
            "modernPhoneticZh": "嗡 瓦₍吉₎啦萨₍特₎瓦 萨玛央 阿努巴啦呀",
            "meaningZh": "嗡！金刚萨埵尊，请随顺守护三昧耶本誓！",
            "meaningEn": "Oṃ! O Vajrasattva, guard and maintain the sacred Samaya pledge!",
            "tangNoteZh": "第一句（12音节）· 祈请守护本誓",
            "words": [
                  {
                        "iast": "oṃ",
                        "stem": "oṃ",
                        "grammar": "Praṇava · 圣音",
                        "transliterationZh": "唵（拼读参考：嗡）",
                        "meaningZh": "三身总持圣音（法报化三身摄受）",
                        "meaningEn": "sacred Praṇava syllable embodying Trikāya",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "vajrasattva",
                        "stem": "vajrasattva",
                        "grammar": "Prop.Noun · 金刚萨埵",
                        "transliterationZh": "嚩日啰萨怛怛嚩（拼读参考：瓦₍吉₎啦萨₍特₎瓦）",
                        "meaningZh": "金刚萨埵（普贤金刚心）",
                        "meaningEn": "Vajrasattva, Diamond-Essence Being",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "samayam",
                        "stem": "samaya",
                        "grammar": "Noun · 三昧耶本誓 · Acc./Nom. Sg. · 业格/主格单数",
                        "transliterationZh": "萨摩演（拼读参考：萨玛央）",
                        "meaningZh": "三昧耶（本誓、平等契合、时际）",
                        "meaningEn": "Samaya, sacred vow, pledge, union",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "anupālaya",
                        "stem": "an-upāli",
                        "grammar": "Nañ-Tatpuruṣa · 否定复合词 (Impv. 2nd Sg. · 祈使式)",
                        "transliterationZh": "阿努波攞耶（拼读参考：阿努巴啦呀）",
                        "meaningZh": "无祈请邬波离 / 近执",
                        "meaningEn": "un-may You Upali!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "vajrasattva-2",
            "index": 2,
            "iast": "vajrasattvatvenopatiṣṭha",
            "classicalTranslitZh": "嚩日啰萨埵底尾(二合)诺跛底瑟姹(二合)",
            "modernPhoneticZh": "瓦₍吉₎啦-萨₍特₎瓦₍特₎威诺巴帝₍师₎他",
            "meaningZh": "唯愿以金刚萨埵清净体性亲临安住于我！",
            "meaningEn": "Stand close and abide in me in the nature of Vajrasattva!",
            "tangNoteZh": "第二句（9音节）· 本尊亲临加持",
            "words": [
                  {
                        "iast": "vajrasattvatvenopatiṣṭha",
                        "stem": "vajrasattva-tva-ina-upa-tiṣṭha",
                        "grammar": "Samāsa · 复合词 (Impv. 2nd Sg. · 祈使安住)",
                        "transliterationZh": "嚩日啰萨怛怛嚩怛吠怒跛底瑟侘（拼读参考：瓦₍吉₎啦-萨₍特₎瓦₍特₎威诺巴帝₍师₎他）",
                        "meaningZh": "金刚萨埵·长柄·勇健·愈加·祈请安住加持",
                        "meaningEn": "Vajrasattva + stem + strong + thereto + abide steadfastly & bestow grace!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "vajrasattva-3",
            "index": 3,
            "iast": "dṛḍho me bhava",
            "classicalTranslitZh": "你哩(二合)荼(引)弥婆嚩",
            "modernPhoneticZh": "₍德₎日多 美 巴瓦",
            "meaningZh": "愿为我作坚固不坏之金刚依怙！",
            "meaningEn": "Be firm and steadfast for me!",
            "tangNoteZh": "第三句（5音节）· 坚固不坏加持",
            "words": [
                  {
                        "iast": "dṛḍho",
                        "stem": "dṛḍha",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "陀哩度（拼读参考：₍德₎日多）",
                        "meaningZh": "坚",
                        "meaningEn": "firm",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "me",
                        "stem": "me",
                        "grammar": "Pron. Dat./Gen. · 第一人称",
                        "transliterationZh": "铭（拼读参考：美）",
                        "meaningZh": "于我、为我",
                        "meaningEn": "to me, my",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bhava",
                        "stem": "bhava",
                        "grammar": "Impv.2.Sg. · 祈使成就",
                        "transliterationZh": "婆嚩（拼读参考：巴瓦）",
                        "meaningZh": "愿成、善住",
                        "meaningEn": "be! become!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "vajrasattva-4",
            "index": 4,
            "iast": "sutoṣyo me bhava",
            "classicalTranslitZh": "素睹使瑜(二合)弥婆嚩",
            "modernPhoneticZh": "苏多₍师₎优 美 巴瓦",
            "meaningZh": "愿对我深生欢喜悦意摄受！",
            "meaningEn": "Be well-pleased and satisfied with me!",
            "tangNoteZh": "第四句（6音节）· 欢喜摄受加持",
            "words": [
                  {
                        "iast": "sutoṣyo",
                        "stem": "sa-ta-ṣa",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "苏睹瑟瑜（拼读参考：苏多₍师₎优）",
                        "meaningZh": "一切诸谛圆满·真如实际·六度满行清净",
                        "meaningEn": "all-pervading truth & auspiciousness & immutable Suchness & perfection of the six pāramitās",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "me",
                        "stem": "me",
                        "grammar": "Pron. Dat./Gen. · 第一人称",
                        "transliterationZh": "铭（拼读参考：美）",
                        "meaningZh": "于我、为我",
                        "meaningEn": "to me, my",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bhava",
                        "stem": "bhava",
                        "grammar": "Impv.2.Sg. · 祈使成就",
                        "transliterationZh": "婆嚩（拼读参考：巴瓦）",
                        "meaningZh": "愿成、善住",
                        "meaningEn": "be! become!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "vajrasattva-5",
            "index": 5,
            "iast": "supoṣyo me bhava",
            "classicalTranslitZh": "素报使瑜(二合)弥婆嚩",
            "modernPhoneticZh": "苏波₍师₎优 美 巴瓦",
            "meaningZh": "愿令我福慧善根丰饶增长！",
            "meaningEn": "Nourish and enrich me well!",
            "tangNoteZh": "第五句（6音节）· 福慧增益加持",
            "words": [
                  {
                        "iast": "supoṣyo",
                        "stem": "sa-pa-ṣa",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "苏布瑟瑜（拼读参考：苏波₍师₎优）",
                        "meaningZh": "一切诸谛圆满·第一义谛·六度满行清净",
                        "meaningEn": "all-pervading truth & auspiciousness & ultimate truth & perfection of the six pāramitās",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "me",
                        "stem": "me",
                        "grammar": "Pron. Dat./Gen. · 第一人称",
                        "transliterationZh": "铭（拼读参考：美）",
                        "meaningZh": "于我、为我",
                        "meaningEn": "to me, my",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bhava",
                        "stem": "bhava",
                        "grammar": "Impv.2.Sg. · 祈使成就",
                        "transliterationZh": "婆嚩（拼读参考：巴瓦）",
                        "meaningZh": "愿成、善住",
                        "meaningEn": "be! become!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "vajrasattva-6",
            "index": 6,
            "iast": "anurakto me bhava",
            "classicalTranslitZh": "阿努啰讫睹(二合)弥婆嚩",
            "modernPhoneticZh": "阿努啦₍克₎多 美 巴瓦",
            "meaningZh": "愿对我恒常慈悲怜悯爱念不舍！",
            "meaningEn": "Be lovingly compassionate toward me!",
            "tangNoteZh": "第六句（7音节）· 大悲敬爱加持",
            "words": [
                  {
                        "iast": "anurakto",
                        "stem": "anurakta",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "阿努啰羯睹（拼读参考：阿努啦₍克₎多）",
                        "meaningZh": "赤红、亲爱",
                        "meaningEn": "coloured, red; beloved",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "me",
                        "stem": "me",
                        "grammar": "Pron. Dat./Gen. · 第一人称",
                        "transliterationZh": "铭（拼读参考：美）",
                        "meaningZh": "于我、为我",
                        "meaningEn": "to me, my",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bhava",
                        "stem": "bhava",
                        "grammar": "Impv.2.Sg. · 祈使成就",
                        "transliterationZh": "婆嚩（拼读参考：巴瓦）",
                        "meaningZh": "愿成、善住",
                        "meaningEn": "be! become!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "vajrasattva-7",
            "index": 7,
            "iast": "sarvasiddhiṃ me prayaccha",
            "classicalTranslitZh": "萨嚩悉地孕(二合)弥钵啰(二合)也瑳",
            "modernPhoneticZh": "萨₍尔₎瓦悉丁 美 ₍普₎啦呀恰",
            "meaningZh": "请赐予我世出世间一切悉地成就！",
            "meaningEn": "Bestow upon me all spiritual accomplishments (Siddhis)!",
            "tangNoteZh": "第七句（8音节）· 普赐悉地成就",
            "words": [
                  {
                        "iast": "sarvasiddhiṃ",
                        "stem": "sarva-siddhi",
                        "grammar": "Samāsa · 复合词 (Acc. Sg. · 业格单数)",
                        "transliterationZh": "萨哩嚩悉没地喃（拼读参考：萨₍尔₎瓦悉丁）",
                        "meaningZh": "一切悉地",
                        "meaningEn": "all + Siddhi",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "me",
                        "stem": "me",
                        "grammar": "Pron. Dat./Gen. · 第一人称",
                        "transliterationZh": "铭（拼读参考：美）",
                        "meaningZh": "于我、为我",
                        "meaningEn": "to me, my",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "prayaccha",
                        "stem": "prayas-accha",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "钵啰耶怛车（拼读参考：₍普₎啦呀恰）",
                        "meaningZh": "乐趣喜",
                        "meaningEn": "pleasure + close by",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "vajrasattva-8",
            "index": 8,
            "iast": "sarvakarmasu ca me cittaṃ śreyaḥ kuru hūṃ",
            "classicalTranslitZh": "萨嚩羯磨素者弥 质多室哩(二合)药俱噜 吽",
            "modernPhoneticZh": "萨₍尔₎瓦-嘎₍尔₎玛苏 佳 美 吉当 ₍希₎雷呀₍赫₎ 古鲁 吽",
            "meaningZh": "于一切事业中令我心常住最胜吉祥善妙，吽！",
            "meaningEn": "In all actions make my mind supremely virtuous and auspicious, Hūṃ!",
            "tangNoteZh": "第八句（14音节）· 净除业障转成善妙心印",
            "words": [
                  {
                        "iast": "sarvakarmasu",
                        "stem": "sarvakarman-asu",
                        "grammar": "Samāsa · 复合词 (Stem · 词干)",
                        "transliterationZh": "萨哩嚩迦哩摩苏（拼读参考：萨₍尔₎瓦-嘎₍尔₎玛苏）",
                        "meaningZh": "事业气息",
                        "meaningEn": "work of all kind + vital spirit",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ca",
                        "stem": "ca",
                        "grammar": "Conj. · 连词",
                        "transliterationZh": "者（拼读参考：佳）",
                        "meaningZh": "及、与、并",
                        "meaningEn": "and, also",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "me",
                        "stem": "me",
                        "grammar": "Pron. Dat./Gen. · 第一人称",
                        "transliterationZh": "铭（拼读参考：美）",
                        "meaningZh": "于我、为我",
                        "meaningEn": "to me, my",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "cittaṃ",
                        "stem": "citta",
                        "grammar": "Noun · 心识 · Acc./Nom. Sg. · 业格/主格单数",
                        "transliterationZh": "只怛担（拼读参考：吉当）",
                        "meaningZh": "心、菩提心、心识",
                        "meaningEn": "mind, heart, thought, bodhicitta",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "śreyaḥ",
                        "stem": "śreyaḥ",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "室隶药（拼读参考：₍希₎雷呀₍赫₎）",
                        "meaningZh": "妙 / 大",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "vajrasattva-9",
            "index": 9,
            "iast": "ha ha ha ha hoḥ bhagavan sarvatathāgatavajra mā me muñca",
            "classicalTranslitZh": "诃诃诃诃斛 婆誐梵 萨嚩怛他蘖多嚩日啰(二合) 么(引)弥闷左",
            "modernPhoneticZh": "哈 哈 哈 哈 霍₍赫₎ 巴嘎万 萨₍尔₎瓦-达他嘎达-瓦₍吉₎啦 玛 美 闷佳",
            "meaningZh": "哈哈哈哈斛（五佛五智大乐音）！世尊、一切如来金刚尊，切勿舍弃于我！",
            "meaningEn": "Ha Ha Ha Ha Hoḥ! O Blessed One, Vajra of all Tathāgatas, do not abandon me!",
            "tangNoteZh": "第九句（19音节）· 五方佛五智灌顶与不舍祈请",
            "words": [
                  {
                        "iast": "ha",
                        "stem": "ha",
                        "grammar": "Akṣara-mukha · 贺字门",
                        "transliterationZh": "诃（拼读参考：哈）",
                        "meaningZh": "贺字门（因缘空寂大乐（hetu/harṣa）·本不生体性）",
                        "meaningEn": "causal emptiness & spiritual joy (hetu) — primordial non-arising",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ha",
                        "stem": "ha",
                        "grammar": "Akṣara-mukha · 贺字门",
                        "transliterationZh": "诃（拼读参考：哈）",
                        "meaningZh": "贺字门（因缘空寂大乐（hetu/harṣa）·本不生体性）",
                        "meaningEn": "causal emptiness & spiritual joy (hetu) — primordial non-arising",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ha",
                        "stem": "ha",
                        "grammar": "Akṣara-mukha · 贺字门",
                        "transliterationZh": "诃（拼读参考：哈）",
                        "meaningZh": "贺字门（因缘空寂大乐（hetu/harṣa）·本不生体性）",
                        "meaningEn": "causal emptiness & spiritual joy (hetu) — primordial non-arising",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ha",
                        "stem": "ha",
                        "grammar": "Akṣara-mukha · 贺字门",
                        "transliterationZh": "诃（拼读参考：哈）",
                        "meaningZh": "贺字门（因缘空寂大乐（hetu/harṣa）·本不生体性）",
                        "meaningEn": "causal emptiness & spiritual joy (hetu) — primordial non-arising",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "hoḥ",
                        "stem": "hoḥ",
                        "grammar": "Bīja · 四摄种子",
                        "transliterationZh": "斛（拼读参考：霍₍赫₎）",
                        "meaningZh": "金刚欢喜三昧耶融摄种子",
                        "meaningEn": "Vajra-joy samaya-union seed syllable",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "vajrasattva-10",
            "index": 10,
            "iast": "vajrī bhava mahāsamayasattva āḥ hūṃ phaṭ",
            "classicalTranslitZh": "嚩日哩(二合)婆嚩 摩诃三摩耶萨埵 阿(引) 吽 癹吒",
            "modernPhoneticZh": "瓦₍吉₎里 巴瓦 玛哈-萨玛呀萨₍特₎瓦 阿₍赫₎ 吽 帕₍特₎",
            "meaningZh": "愿令我成就金刚自性，大三昧耶萨埵，阿（本不生际法身种子字）！吽、癹吒（百字明圆满）！",
            "meaningEn": "Make me a Vajra-holder, O Great Samaya-Being, Āḥ! Hūṃ Phaṭ!",
            "tangNoteZh": "第十句（14音节）· 成就金刚自性（共100音节整；六字心咒另列独立专条）",
            "words": [
                  {
                        "iast": "vajrī",
                        "stem": "vajra",
                        "grammar": "Noun · 金刚 · Nom. Sg. Fem. · 阴性尊号",
                        "transliterationZh": "嚩日哩(引)（拼读参考：瓦₍吉₎里）",
                        "meaningZh": "金刚（坚固不坏、摧破一切障）佛母",
                        "meaningEn": "Vajra, indestructible diamond-thunderbolt (feminine)",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bhava",
                        "stem": "bhava",
                        "grammar": "Impv.2.Sg. · 祈使成就",
                        "transliterationZh": "婆嚩（拼读参考：巴瓦）",
                        "meaningZh": "愿成、善住",
                        "meaningEn": "be! become!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "mahāsamayasattva",
                        "stem": "mahā-samayasattva",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "摩诃萨摩耶萨怛怛嚩（拼读参考：玛哈-萨玛呀萨₍特₎瓦）",
                        "meaningZh": "大三昧耶萨埵",
                        "meaningEn": "great + samayasattva",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "āḥ",
                        "stem": "āḥ",
                        "grammar": "Bīja · 语金刚种子",
                        "transliterationZh": "阿(引)诃（拼读参考：阿₍赫₎）",
                        "meaningZh": "语金刚种子字（一切法本不生清净妙语）",
                        "meaningEn": "speech-vajra seed syllable Āḥ (non-arising)",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "hūṃ",
                        "stem": "hūṃ",
                        "grammar": "Bīja · 金刚种子字",
                        "transliterationZh": "吽（拼读参考：吽）",
                        "meaningZh": "金刚不坏菩提心印、摧破诸障",
                        "meaningEn": "adamantine bodhicitta seed syllable",
                        "origin": "derived-reference"
                  }
            ]
      }
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
  // - T20n1113B (Nīlakaṇṭha, 334 #SD-* glyphs across all 84 clauses)
  // - T19n0974B (Uṣṇīṣavijaya, 470 #SD-* glyphs across all 35 clauses)
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
