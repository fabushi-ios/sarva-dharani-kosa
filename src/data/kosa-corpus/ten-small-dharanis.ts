import type { DharaniEntry } from '../../types/kosaTypes';
import { AUTHORITATIVE_CBETA_RECORDS } from '../kosa-generated/cbetaAuthRecords';
import { AUTHORITATIVE_GRETIL_RECORDS } from '../kosa-generated/gretilAuthRecords';
import { iastToSiddham } from '../../core/sanskrit/transliterator';

const cbetaT20n1080 = AUTHORITATIVE_CBETA_RECORDS.find((r) => r.id === 'T20n1080');
const cbetaT19n0963 = AUTHORITATIVE_CBETA_RECORDS.find((r) => r.id === 'T19n0963');
const cbetaT20n1075 = AUTHORITATIVE_CBETA_RECORDS.find((r) => r.id === 'T20n1075');
const cbetaT19n0936 = AUTHORITATIVE_CBETA_RECORDS.find((r) => r.id === 'T19n0936');
const cbetaT12n0368 = AUTHORITATIVE_CBETA_RECORDS.find((r) => r.id === 'T12n0368');

const gretilAparimitayuh = AUTHORITATIVE_GRETIL_RECORDS.find((r) => r.id === 'gretil-aparimitayuh-sutra');
const gretilBhaisajya = AUTHORITATIVE_GRETIL_RECORDS.find((r) => r.id === 'gretil-bhaisajyaguru');
const gretilSrimahadevi = AUTHORITATIVE_GRETIL_RECORDS.find((r) => r.id === 'gretil-srimahadevi');
const gretilKarandavyuha = AUTHORITATIVE_GRETIL_RECORDS.find((r) => r.id === 'gretil-karandavyuha');

const RAW_TEN_SMALL_DHARANIS: DharaniEntry[] = [
  {
    id: 'ten-small-01-cintamanicakra',
    titleZh: '十小咒之一：如意宝轮王陀罗尼（含 CBETA 89字悉昙梵汉逐字对音 · 5句全本）',
    titleSanskritIast: 'Cintāmaṇicakra-dhāraṇī',
    titleEnglish: 'Wish-Fulfilling Jewel Wheel King Dhāraṇī (Cintāmaṇicakra)',
    categoryId: 'ten-small-mantras',
    taishoNo: 'T20n1080',
    translatorZh: '唐·南天竺三藏法师菩提流志 译 / 唐·义净 译',
    sutraSourceZh: '《如意轮陀罗尼经》(T20n1080)',
    deityZh: '如意轮观自在菩萨 (Cintāmaṇicakra Avalokiteśvara)',
    meritsAndSummaryZh:
      '《十小咒》首篇，全本共 5 句，统摄三宝观音归敬（第1句）、根本长咒（第2–3句）、大心咒（第4句）与随心咒（第5句）。观自在菩萨手执如意摩尼宝珠与法轮，能满一切世出世间善愿。本词条直接接入从 CBETA 官方库下载之《T20n1080.xml》全部 89 个悉昙梵字与汉文逐字对音数据。',
    recitationTipsZh:
      '本咒由三宝观音归敬、根本咒、大心咒（oṃ padmacintāmaṇi jvāla hūṃ）与随心咒（oṃ varada padme hūṃ）五句一气呵成。',
    provenance: {
      sourceType: 'CBETA-XML-P5',
      cbetaId: 'T20n1080',
      cbetaRawXmlUrl: cbetaT20n1080?.cbetaRawUrl || 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1080.xml',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T20n1080',
      editionCitation:
        'CBETA XML-P5 T20n1080《如意轮陀罗尼经》(唐·菩提流志译，含 89 个 #SD-* 悉昙梵字对音与 29 处陀罗尼段落)。',
      manuscriptNotesZh:
        '已从 github.com/cbeta-org/xml-p5 下载 T20n1080.xml 并提取全部 89 个原典悉昙梵汉对音单元。',
      rawSnippet: cbetaT20n1080?.dharaniParagraphs.slice(0, 5).map((p) => p.text).join('\n'),
      cbetaInterlinearTokens: cbetaT20n1080?.interlinearTokens || [],
    },
    verses: [
      {
            "id": "cintamani-1",
            "index": 1,
            "iast": "namo buddhāya | namo dharmāya | namaḥ saṃghāya | namo āryāvalokiteśvarāya bodhisattvāya mahāsattvāya mahākāruṇikāya |",
            "classicalTranslitZh": "南无佛驮耶 南无达摩耶 南无僧伽耶 南无观自在菩萨摩诃萨 具大悲心者",
            "modernPhoneticZh": "拿摩 布达呀 | 拿摩 达₍尔₎玛呀 | 拿玛₍赫₎ 桑嘎呀 | 拿摩 阿₍哩₎呀-瓦洛给帝-₍湿₎瓦啦呀 博地-萨₍特₎瓦呀 玛哈-萨₍特₎瓦呀 玛哈-嘎鲁尼嘎呀",
            "meaningZh": "归命佛陀！归命正法！归命圣僧！归命圣观自在菩萨摩诃萨、具足大悲心者！",
            "meaningEn": "Homage to the Buddha! Homage to the Dharma! Homage to the Saṃgha! Homage to Noble Avalokiteśvara, Bodhisattva Mahāsattva, the Greatly Compassionate One!",
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
                        "iast": "buddhāya",
                        "stem": "buddha",
                        "grammar": "Noun · 佛号 · Dat. Sg. · 为格单数",
                        "transliterationZh": "佛驮耶 / 没驮耶（拼读参考：布达呀）",
                        "meaningZh": "向佛陀、觉者",
                        "meaningEn": "to/for Buddha, the Awakened One",
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
                        "iast": "dharmāya",
                        "stem": "dharma",
                        "grammar": "Noun · 法宝 · Dat. Sg. · 为格单数",
                        "transliterationZh": "达摩耶（拼读参考：达₍尔₎玛呀）",
                        "meaningZh": "向正法、诸法实相",
                        "meaningEn": "to/for Dharma, cosmic truth/teaching/phenomena",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "namaḥ",
                        "stem": "namaḥ",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "曩莫（拼读参考：拿玛₍赫₎）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  }
            ],
            "siddhamOriginal": "𑖡𑖦𑖺 𑖤𑖲𑖟𑖿𑖠𑖯𑖧 𑗂 𑖡𑖦𑖺 𑖠𑖨𑖿𑖦𑖯𑖧 𑗂 𑖡𑖦𑖾 𑖭𑖽𑖑𑖯𑖧 𑗂 𑖡𑖦𑖺 𑖁𑖨𑖿𑖧𑖯𑖪𑖩𑖺𑖎𑖰𑖝𑖸𑖫𑖿𑖪𑖨𑖯𑖧 𑖤𑖺𑖠𑖰𑖭𑖝𑖿𑖝𑖿𑖪𑖯𑖧 𑖦𑖮𑖯𑖭𑖝𑖿𑖝𑖿𑖪𑖯𑖧 𑖦𑖮𑖯𑖎𑖯𑖨𑖲𑖜𑖰𑖎𑖯𑖧 𑗂",
            "fieldSources": {
                  "siddham": "db-original"
            }
      },
      {
            "id": "cintamani-2",
            "index": 2,
            "iast": "tadyathā | oṃ cakravarti-cintāmaṇi mahāpadme",
            "classicalTranslitZh": "怛侄他 唵 斫羯啰伐底 震多末尼 摩诃钵蹬谜",
            "modernPhoneticZh": "达₍地₎呀他 | 嗡 佳₍克₎啦瓦₍尔₎帝-津达玛尼 玛哈巴₍德₎美",
            "meaningZh": "即说根本咒曰：嗡！转轮圣王如意宝珠、大清净红莲华尊！",
            "meaningEn": "Namely: Oṃ! Wheel-Turning Sovereign Wish-Fulfilling Gem, O Great Lotus!",
            "words": [
                  {
                        "iast": "tadyathā",
                        "stem": "tadyathā",
                        "grammar": "Adv. · 咒引词",
                        "transliterationZh": "怛侄他 / 怛你也他（拼读参考：达₍地₎呀他）",
                        "meaningZh": "即说咒曰、所谓",
                        "meaningEn": "namely, thus goes the mantra",
                        "origin": "derived-reference"
                  },
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
                        "iast": "cakravarti",
                        "stem": "cakravartin",
                        "grammar": "Noun · 转轮圣王 · Voc. Fem. / Loc. · 呼格/处格",
                        "transliterationZh": "者讫啰嚩哩底（拼读参考：佳₍克₎啦瓦₍尔₎帝）",
                        "meaningZh": "转轮圣王尊",
                        "meaningEn": "O Cakravartin, universal wheel-turning monarch",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "cintāmaṇi",
                        "stem": "cintāmaṇi",
                        "grammar": "Samāsa · 如意宝珠",
                        "transliterationZh": "只喃多摩抳（拼读参考：津达玛尼）",
                        "meaningZh": "如意摩尼宝珠（随心满愿宝）",
                        "meaningEn": "Cintāmaṇi, wish-fulfilling gem",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "mahāpadme",
                        "stem": "mahāpadma",
                        "grammar": "Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "摩诃钵讷铭（拼读参考：玛哈巴₍德₎美）",
                        "meaningZh": "大红莲华尊",
                        "meaningEn": "O Mahapadma / in Mahapadma",
                        "origin": "derived-reference"
                  }
            ],
            "siddhamOriginal": "𑖝𑖟𑖿𑖧𑖞𑖯 𑗂 𑖌𑖽 𑖓𑖎𑖿𑖨𑖪𑖨𑖿𑖝𑖰 𑖓𑖰𑖡𑖿𑖝𑖯𑖦𑖜𑖰 𑖦𑖮𑖯𑖢𑖟𑖿𑖦𑖸",
            "fieldSources": {
                  "siddham": "db-original"
            }
      },
      {
            "id": "cintamani-3",
            "index": 3,
            "iast": "ruru ruru tiṣṭha jvāla ākarṣaya hūṃ phaṭ svāhā",
            "classicalTranslitZh": "噜噜噜噜 底瑟姹 篅啰阿羯利沙也 吽 癹 莎诃",
            "modernPhoneticZh": "鲁鲁 鲁鲁 帝₍师₎他 ₍吉₎瓦啦 阿嘎₍尔₎沙呀 吽 帕₍特₎ ₍斯₎瓦哈",
            "meaningZh": "妙光流注、坚固安住，放智慧火焰钩召摄受一切善法，吽、癹、莎诃！",
            "meaningEn": "Stream forth, abide firm, blaze with light and magnetize all blessings, Hūṃ Phaṭ Svāhā!",
            "words": [
                  {
                        "iast": "ruru",
                        "stem": "ruru",
                        "grammar": "Mantra-Impv. · 悲光流注",
                        "transliterationZh": "噜噜（拼读参考：鲁鲁）",
                        "meaningZh": "大悲流注、光明赫奕！",
                        "meaningEn": "radiate compassionate light!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ruru",
                        "stem": "ruru",
                        "grammar": "Mantra-Impv. · 悲光流注",
                        "transliterationZh": "噜噜（拼读参考：鲁鲁）",
                        "meaningZh": "大悲流注、光明赫奕！",
                        "meaningEn": "radiate compassionate light!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "tiṣṭha",
                        "stem": "tiṣṭha",
                        "grammar": "Impv. 2nd Sg. · 祈使安住",
                        "transliterationZh": "底瑟侘（拼读参考：帝₍师₎他）",
                        "meaningZh": "祈请安住加持",
                        "meaningEn": "abide steadfastly & bestow grace!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "jvāla",
                        "stem": "jvāla",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "日嚩(引)攞（拼读参考：₍吉₎瓦啦）",
                        "meaningZh": "焰光",
                        "meaningEn": "light, flame; torch, hot infusion",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ākarṣaya",
                        "stem": "ākarṣaya",
                        "grammar": "Impv.2.Sg. · 钩召祈使",
                        "transliterationZh": "阿(引)迦哩洒耶（拼读参考：阿嘎₍尔₎沙呀）",
                        "meaningZh": "请钩召、慈悲摄引善法！",
                        "meaningEn": "attract! summon! draw near!",
                        "origin": "derived-reference"
                  }
            ],
            "siddhamOriginal": "𑖨𑖲𑖨𑖲 𑖨𑖲𑖨𑖲 𑖝𑖰𑖬𑖿𑖙 𑖕𑖿𑖪𑖯𑖩 𑖁𑖎𑖨𑖿𑖬𑖧 𑖮𑖳𑖽 𑖣𑖘𑖿 𑖭𑖿𑖪𑖯𑖮𑖯",
            "fieldSources": {
                  "siddham": "db-original"
            }
      },
      {
            "id": "cintamani-4",
            "index": 4,
            "iast": "oṃ padmacintāmaṇi jvāla hūṃ",
            "classicalTranslitZh": "唵 钵蹋摩 震多末尼 篅攞 吽",
            "modernPhoneticZh": "嗡 巴₍德₎玛-津达-玛尼 ₍吉₎瓦啦 吽",
            "meaningZh": "【大心咒】嗡！红莲如意摩尼宝珠放无量光，吽！",
            "meaningEn": "[Heart Mantra] Oṃ! Lotus Wish-Fulfilling Gem, blaze forth, Hūṃ!",
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
                        "iast": "padmacintāmaṇi",
                        "stem": "padma-cintāmaṇi",
                        "grammar": "Samāsa · 如意宝珠",
                        "transliterationZh": "钵讷摩只喃多摩抳（拼读参考：巴₍德₎玛-津达-玛尼）",
                        "meaningZh": "莲华如意摩尼宝珠",
                        "meaningEn": "lotus flower + Cintāmaṇi",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "jvāla",
                        "stem": "jvāla",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "日嚩(引)攞（拼读参考：₍吉₎瓦啦）",
                        "meaningZh": "焰光",
                        "meaningEn": "light, flame; torch, hot infusion",
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
            ],
            "siddhamOriginal": "𑖌𑖽 𑖢𑖟𑖿𑖦𑖓𑖰𑖡𑖿𑖝𑖯𑖦𑖜𑖰 𑖕𑖿𑖪𑖯𑖩 𑖮𑖳𑖽",
            "fieldSources": {
                  "siddham": "db-original"
            }
      },
      {
            "id": "cintamani-5",
            "index": 5,
            "iast": "oṃ varada padme hūṃ",
            "classicalTranslitZh": "唵 跋喇陀 钵亶谜 吽",
            "modernPhoneticZh": "嗡 瓦啦达 巴₍德₎美 吽",
            "meaningZh": "【随心咒】嗡！施予胜愿之红莲华尊，吽！",
            "meaningEn": "[Inner-Heart Mantra] Oṃ! Boon-Granting Sacred Lotus, Hūṃ!",
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
                        "iast": "varada",
                        "stem": "varada",
                        "grammar": "Samāsa · 施愿尊",
                        "transliterationZh": "嚩啰捺（拼读参考：瓦啦达）",
                        "meaningZh": "施愿者、满善愿尊",
                        "meaningEn": "boon-granting, wish-bestowing",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "padme",
                        "stem": "padma",
                        "grammar": "Noun · 莲华 · Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "钵讷铭（拼读参考：巴₍德₎美）",
                        "meaningZh": "莲华（出淤泥而不染清净心）尊",
                        "meaningEn": "O lotus flower (pure, unstained) / in lotus flower (pure, unstained)",
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
            ],
            "siddhamOriginal": "𑖌𑖽 𑖪𑖨𑖟 𑖢𑖟𑖿𑖦𑖸 𑖮𑖳𑖽",
            "fieldSources": {
                  "siddham": "db-original"
            }
      }
],
  },
  {
    id: 'ten-small-02-jvalosnisa',
    titleZh: '十小咒之二：消灾吉祥神咒（炽盛光大威德消灾吉祥陀罗尼 · 6句全本）',
    titleSanskritIast: 'Jvāloṣṇīṣa-mahāteja-dhāraṇī',
    titleEnglish: 'Blazing Crown (Jvāloṣṇīṣa) Disaster-Averting Auspicious Dhāraṇī',
    categoryId: 'ten-small-mantras',
    taishoNo: 'T19n0963 / T19n0964',
    translatorZh: '唐·大兴善寺三藏沙门大广智不空 奉诏译',
    sutraSourceZh: '《佛说炽盛光大威德消灾吉祥陀罗尼经》(T19n0963)',
    deityZh: '炽盛光佛顶如来 (Jvāloṣṇīṣa / Tejaprabhā Buddha)',
    meritsAndSummaryZh:
      '释迦牟尼佛于净居天宫为诸宿曜、九执、二十八宿宣说之消灾解厄总持，共 6 句。凡遇星曜凌逼、国界灾厄、疾疫障难，持诵此咒悉令消除，转不吉祥为大吉祥。直接关联 CBETA《T19n0963.xml》原典。',
    recitationTipsZh:
      '句首 namaḥ samantabuddhānāṃ 为密教诸佛通归敬句，apratihataśāsanānāṃ 意为「无碍教令者」，持诵时气势宏大光明。',
    provenance: {
      sourceType: 'CBETA-XML-P5',
      cbetaId: 'T19n0963',
      cbetaRawXmlUrl: cbetaT19n0963?.cbetaRawUrl || 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n0963.xml',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T19n0963',
      editionCitation: 'CBETA XML-P5 T19n0963《佛说炽盛光大威德消灾吉祥陀罗尼经》(唐·不空三藏译)。',
      manuscriptNotesZh: '已从 github.com/cbeta-org/xml-p5 下载 T19n0963.xml 原典并按六句仪轨句读建档。',
      rawSnippet: cbetaT19n0963?.dharaniParagraphs.map((p) => p.text).join('\n'),
    },
    verses: [
      {
            "id": "jvalosnisa-1",
            "index": 1,
            "iast": "namaḥ samantabuddhānām",
            "classicalTranslitZh": "曩谟三满多母驮喃",
            "modernPhoneticZh": "拿玛₍赫₎ 萨曼达-布达南",
            "meaningZh": "顶礼普遍十方三世一切诸佛！",
            "meaningEn": "Homage to all universal Buddhas everywhere!",
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
                        "iast": "samantabuddhānām",
                        "stem": "samanta-buddhānām",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "三曼多没驮喃（拼读参考：萨曼达-布达南）",
                        "meaningZh": "普遍没驮南",
                        "meaningEn": "universal + buddhānām",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "jvalosnisa-2",
            "index": 2,
            "iast": "apratihataśāsanānām",
            "classicalTranslitZh": "阿钵啰(二合)底贺多舍娑曩喃",
            "modernPhoneticZh": "阿₍普₎啦帝哈达-沙萨拿南",
            "meaningZh": "具足无能障碍威神教令者！",
            "meaningEn": "Whose teachings and command are unobstructed!",
            "words": [
                  {
                        "iast": "apratihataśāsanānām",
                        "stem": "apratihata-śāsana",
                        "grammar": "Samāsa · 复合词 (Gen. Pl. · 属格复数)",
                        "transliterationZh": "阿钵啰底诃怛奢萨那(引)喃(引)（拼读参考：阿₍普₎啦帝哈达-沙萨拿南）",
                        "meaningZh": "无碍诸传",
                        "meaningEn": "unobstructed + of all chastising",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "jvalosnisa-3",
            "index": 3,
            "iast": "tadyathā | oṃ khāhi khāhi khūṃ khūṃ",
            "classicalTranslitZh": "怛侄他 唵 佉佉 佉呬佉呬 吽吽",
            "modernPhoneticZh": "达₍地₎呀他 | 嗡 卡嘿 卡嘿 空 空",
            "meaningZh": "即说咒曰：嗡！吞啖、吞啖一切恶星灾障，吽吽！",
            "meaningEn": "Namely: Oṃ! Devour, consume all calamities, Khūṃ Khūṃ!",
            "words": [
                  {
                        "iast": "tadyathā",
                        "stem": "tadyathā",
                        "grammar": "Adv. · 咒引词",
                        "transliterationZh": "怛侄他 / 怛你也他（拼读参考：达₍地₎呀他）",
                        "meaningZh": "即说咒曰、所谓",
                        "meaningEn": "namely, thus goes the mantra",
                        "origin": "derived-reference"
                  },
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
                        "iast": "khāhi",
                        "stem": "khāhi",
                        "grammar": "Impv.2.Sg. · 吞啖除障",
                        "transliterationZh": "佉(引)呬（拼读参考：卡嘿）",
                        "meaningZh": "请吞啖、纳受（火供/一切灾障）！",
                        "meaningEn": "devour! consume all calamities!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "khāhi",
                        "stem": "khāhi",
                        "grammar": "Impv.2.Sg. · 吞啖除障",
                        "transliterationZh": "佉(引)呬（拼读参考：卡嘿）",
                        "meaningZh": "请吞啖、纳受（火供/一切灾障）！",
                        "meaningEn": "devour! consume all calamities!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "khūṃ",
                        "stem": "khūṃ",
                        "grammar": "Bīja · 忿怒种子",
                        "transliterationZh": "吽（拼读参考：空）",
                        "meaningZh": "忿怒炽盛光金刚种子字（吞啖灾障）",
                        "meaningEn": "wrathful blazing vajra syllable Khūṃ",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "jvalosnisa-4",
            "index": 4,
            "iast": "jvala jvala prajvala prajvala",
            "classicalTranslitZh": "入嚩(二合)攞入嚩攞 钵啰(二合)入嚩攞钵啰入嚩攞",
            "modernPhoneticZh": "₍吉₎瓦啦 ₍吉₎瓦啦 ₍普₎啦₍吉₎瓦啦 ₍普₎啦₍吉₎瓦啦",
            "meaningZh": "放光炽盛、极炽盛放佛顶大威德光！",
            "meaningEn": "Blaze forth, blaze brilliantly with wisdom-fire!",
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
                  },
                  {
                        "iast": "prajvala",
                        "stem": "prajvala",
                        "grammar": "Impv.2.Sg. · 炽盛放光",
                        "transliterationZh": "钵啰日嚩攞（拼读参考：₍普₎啦₍吉₎瓦啦）",
                        "meaningZh": "请极炽盛放光、朗照无余！",
                        "meaningEn": "blaze brightly! shine forth intensely!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "prajvala",
                        "stem": "prajvala",
                        "grammar": "Impv.2.Sg. · 炽盛放光",
                        "transliterationZh": "钵啰日嚩攞（拼读参考：₍普₎啦₍吉₎瓦啦）",
                        "meaningZh": "请极炽盛放光、朗照无余！",
                        "meaningEn": "blaze brightly! shine forth intensely!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "jvalosnisa-5",
            "index": 5,
            "iast": "tiṣṭha tiṣṭha ṣṭri ṣṭri",
            "classicalTranslitZh": "底瑟姹(二合)底瑟姹 瑟致(二合)哩瑟致哩",
            "modernPhoneticZh": "帝₍师₎他 帝₍师₎他 ₍师特₎里 ₍师特₎里",
            "meaningZh": "坚固安住、镇定不摇！",
            "meaningEn": "Stand firm, abide unshakably!",
            "words": [
                  {
                        "iast": "tiṣṭha",
                        "stem": "tiṣṭha",
                        "grammar": "Impv. 2nd Sg. · 祈使安住",
                        "transliterationZh": "底瑟侘（拼读参考：帝₍师₎他）",
                        "meaningZh": "祈请安住加持",
                        "meaningEn": "abide steadfastly & bestow grace!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "tiṣṭha",
                        "stem": "tiṣṭha",
                        "grammar": "Impv. 2nd Sg. · 祈使安住",
                        "transliterationZh": "底瑟侘（拼读参考：帝₍师₎他）",
                        "meaningZh": "祈请安住加持",
                        "meaningEn": "abide steadfastly & bestow grace!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ṣṭri",
                        "stem": "ṣa",
                        "grammar": "Akṣara-mukha · 啰字门",
                        "transliterationZh": "瑟吒哩（拼读参考：₍师特₎里）",
                        "meaningZh": "啰字门（清净离诸尘垢（rajas）·诸根清净自在）",
                        "meaningEn": "stainless purity free from dust (rajas) — purified faculties",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "ṣṭri",
                        "stem": "ṣa",
                        "grammar": "Akṣara-mukha · 啰字门",
                        "transliterationZh": "瑟吒哩（拼读参考：₍师特₎里）",
                        "meaningZh": "啰字门（清净离诸尘垢（rajas）·诸根清净自在）",
                        "meaningEn": "stainless purity free from dust (rajas) — purified faculties",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "jvalosnisa-6",
            "index": 6,
            "iast": "sphoṭa sphoṭa śāntika śrīye svāhā",
            "classicalTranslitZh": "娑癹(二合)吒娑癹吒 扇底迦 室哩(二合)曳 娑嚩(二合)诃",
            "modernPhoneticZh": "₍斯₎坡达 ₍斯₎坡达 善帝嘎 ₍希₎里耶 ₍斯₎瓦哈",
            "meaningZh": "摧裂粉碎一切灾厄，成就息灾寂静与大吉祥福德，娑嚩诃！",
            "meaningEn": "Shatter all obstacles! For pacification and auspicious glory, Svāhā!",
            "words": [
                  {
                        "iast": "sphoṭa",
                        "stem": "sphoṭa",
                        "grammar": "Impv.2.Sg. · 摧裂破障",
                        "transliterationZh": "娑破吒（拼读参考：₍斯₎坡达）",
                        "meaningZh": "请摧裂、粉碎一切灾障恶星！",
                        "meaningEn": "burst asunder! shatter obstacles!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "sphoṭa",
                        "stem": "sphoṭa",
                        "grammar": "Impv.2.Sg. · 摧裂破障",
                        "transliterationZh": "娑破吒（拼读参考：₍斯₎坡达）",
                        "meaningZh": "请摧裂、粉碎一切灾障恶星！",
                        "meaningEn": "burst asunder! shatter obstacles!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "śāntika",
                        "stem": "śāntika",
                        "grammar": "Adj./Noun · 息灾法",
                        "transliterationZh": "奢喃底迦（拼读参考：善帝嘎）",
                        "meaningZh": "扇底迦（息灾吉祥法）",
                        "meaningEn": "pacifying, rite of pacification (Śāntika)",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "śrīye",
                        "stem": "śri-iya",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "室利曳（拼读参考：₍希₎里耶）",
                        "meaningZh": "清癯此处尊",
                        "meaningEn": "lean",
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
    id: 'ten-small-03-gunaratnasaila',
    titleZh: '十小咒之三：功德宝山神咒（5句全本）',
    titleSanskritIast: 'Guṇaratnaśaila-dhāraṇī',
    titleEnglish: 'Mount of Merit-Jewels Dhāraṇī (Guṇaratnaśaila)',
    categoryId: 'ten-small-mantras',
    taishoNo: 'X19 / 大藏集咒',
    translatorZh: '历代课诵传本（源自《圆因往生集》暨密部赞佛功德咒）',
    sutraSourceZh: '《诸经日诵集要》暨《大藏全咒》',
    deityZh: '十方三宝暨功德宝山胜境如来',
    meritsAndSummaryZh:
      '赞叹三宝无量功德如须弥宝山，全咒共 5 句。诵持此咒能积聚广大福德资粮，临命终时消融罪业，决定蒙佛接引。',
    recitationTipsZh:
      '前三句归命佛法僧三宝，后二句 siddhe huru huru siddhūru kṛpā kṛpa 等句注意颤音 r 的轻盈连读。',
    provenance: {
      sourceType: 'Academic-Critical-Edition',
      editionCitation: '《诸经日诵集要》音译本暨林光明《十小咒研究》梵文构拟还原校勘本。',
      manuscriptNotesZh: '结合梵文佛典常见祈愿句式（siddhe, kṛpā, puruṇi）校订之标准 IAST 梵本。',
    },
    verses: [
      {
            "id": "gunaratna-1",
            "index": 1,
            "iast": "namo buddhāya",
            "classicalTranslitZh": "南无佛驮耶",
            "modernPhoneticZh": "拿摩 布达呀",
            "meaningZh": "归命佛陀无上正遍知！",
            "meaningEn": "Homage to the Buddha!",
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
                        "iast": "buddhāya",
                        "stem": "buddha",
                        "grammar": "Noun · 佛号 · Dat. Sg. · 为格单数",
                        "transliterationZh": "佛驮耶 / 没驮耶（拼读参考：布达呀）",
                        "meaningZh": "向佛陀、觉者",
                        "meaningEn": "to/for Buddha, the Awakened One",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "gunaratna-2",
            "index": 2,
            "iast": "namo dharmāya",
            "classicalTranslitZh": "南无达摩耶",
            "modernPhoneticZh": "拿摩 达₍尔₎玛呀",
            "meaningZh": "归命正法清净海！",
            "meaningEn": "Homage to the Dharma!",
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
                        "iast": "dharmāya",
                        "stem": "dharma",
                        "grammar": "Noun · 法宝 · Dat. Sg. · 为格单数",
                        "transliterationZh": "达摩耶（拼读参考：达₍尔₎玛呀）",
                        "meaningZh": "向正法、诸法实相",
                        "meaningEn": "to/for Dharma, cosmic truth/teaching/phenomena",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "gunaratna-3",
            "index": 3,
            "iast": "namaḥ saṃghāya",
            "classicalTranslitZh": "南无僧伽耶",
            "modernPhoneticZh": "拿玛₍赫₎ 桑嘎呀",
            "meaningZh": "归命贤圣大僧伽！",
            "meaningEn": "Homage to the Saṃgha!",
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
                        "iast": "saṃghāya",
                        "stem": "saṃgha",
                        "grammar": "Noun · 僧宝 · Dat. Sg. · 为格单数",
                        "transliterationZh": "僧伽耶（拼读参考：桑嘎呀）",
                        "meaningZh": "向圣僧伽、清净海众",
                        "meaningEn": "to/for Saṃgha, noble spiritual community",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "gunaratna-4",
            "index": 4,
            "iast": "oṃ siddhe huru huru siddhūru",
            "classicalTranslitZh": "唵 悉帝护嚧噜 悉都噜",
            "modernPhoneticZh": "嗡 悉叠 呼鲁 呼鲁 悉杜鲁",
            "meaningZh": "嗡！广大悉地妙尊，速疾摄受、妙善成就！",
            "meaningEn": "Oṃ! O Accomplished One, hasten, accomplish well!",
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
                        "iast": "siddhe",
                        "stem": "siddha",
                        "grammar": "Adj./Noun · 成就尊 · Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "悉没第（拼读参考：悉叠）",
                        "meaningZh": "成就者、已成就尊",
                        "meaningEn": "O accomplished, perfected adept (Siddha) / in accomplished, perfected adept (Siddha)",
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
                        "iast": "siddhūru",
                        "stem": "√siddh",
                        "grammar": "Mantra Impv. · 真言警策句",
                        "transliterationZh": "悉没度(引)噜（拼读参考：悉杜鲁）",
                        "meaningZh": "悉地成就·一切诸谛圆满（警策成就）",
                        "meaningEn": "perfected (imperative seal)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "gunaratna-5",
            "index": 5,
            "iast": "kṛpā kṛpa siddhāni puruṇi svāhā",
            "classicalTranslitZh": "只利波 吉利婆 悉达哩 布嚧哩 娑嚩诃",
            "modernPhoneticZh": "₍克₎日巴 ₍克₎日巴 悉达尼 布鲁尼 ₍斯₎瓦哈",
            "meaningZh": "以无缘大悲垂悯摄持，令一切功德宝山悉地圆满具足，娑嚩诃！",
            "meaningEn": "Through boundless compassion, fulfill all spiritual accomplishments completely, Svāhā!",
            "words": [
                  {
                        "iast": "kṛpā",
                        "stem": "kṛpā",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "讫哩波（拼读参考：₍克₎日巴）",
                        "meaningZh": "慈悲 / 悲",
                        "meaningEn": "compassion, pity",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "kṛpa",
                        "stem": "ka-pa",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "讫哩跛（拼读参考：₍克₎日巴）",
                        "meaningZh": "造作离相·第一义谛",
                        "meaningEn": "freedom from karmic agency & ultimate truth",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "siddhāni",
                        "stem": "siddha",
                        "grammar": "Adj./Noun · 成就尊 · Nom./Acc. Pl. Neut. · 复数中性",
                        "transliterationZh": "悉没驮(引)你（拼读参考：悉达尼）",
                        "meaningZh": "一切成就者、已成就",
                        "meaningEn": "accomplished, perfected adept (Siddha) (plural)",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "puruṇi",
                        "stem": "pa-ra-ṇa",
                        "grammar": "Mantra Voc. · 真言呼请句",
                        "transliterationZh": "补噜抳（拼读参考：布鲁尼）",
                        "meaningZh": "第一义谛·清净离诸尘垢·离诸诤论无诤（呼请加持）",
                        "meaningEn": "ultimate truth & stainless purity free from dust & conflict-free peace (vocative invocation)",
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
    id: 'ten-small-04-mahacundi',
    titleZh: '十小咒之四：七俱胝佛母准提大明陀罗尼（准提神咒原典纯本）',
    titleSanskritIast: 'Saptakoṭibuddhamātṛ-cundī-mahāvidyā-dhāraṇī',
    titleEnglish: 'Great Vidyā-Dhāraṇī of Cundī, Mother of Seventy Million Buddhas',
    categoryId: 'ten-small-mantras',
    taishoNo: 'T20n1075 / T20n1076 / T20n1077 / T20n1050',
    translatorZh: '唐·金刚智三藏 译 (T20n1075) / 唐·地婆诃罗 译 / 唐·不空 译',
    sutraSourceZh: '《佛说七俱胝佛母准提大明陀罗尼经》(T20n1075) 暨 GRETIL《大乘庄严宝王经 Kāraṇḍavyūha》(bsu019_u.htm)',
    deityZh: '七俱胝佛母准提菩萨 (Mahācundī Bhagavatī)',
    meritsAndSummaryZh:
      '过去七俱胝（七千万）诸佛共同宣说之佛母心印，原典纯本共 2 句（七俱胝佛归敬句 + 九字准提咒心，不混入《显密圆通》外附之一字大轮咒，一字大轮咒已单列独立词条）。在家出家皆可持诵，不拣净秽，感应至速。',
    recitationTipsZh:
      'cunde（准提，意为清净最胜）中 c 发舌面音，nd 为鼻音加齿塞音；cale cule cunde 音律清越庄严。',
    provenance: {
      sourceType: 'CBETA+GRETIL',
      cbetaId: 'T20n1075',
      cbetaRawXmlUrl: cbetaT20n1075?.cbetaRawUrl || 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1075.xml',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T20n1075',
      gretilFile: 'bsu019_u.htm',
      gretilRawUrl: gretilKarandavyuha?.gretilRawUrl || 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/main/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/bsu019_u.htm',
      editionCitation:
        'GRETIL bsu019_u.htm (Kāraṇḍavyūha-sūtra, ed. P.L. Vaidya, Buddhist Sanskrit Texts 17) & CBETA T20n1075《佛说七俱胝佛母准提大明陀罗尼经》(唐·金刚智译)。',
      manuscriptNotesZh:
        '严格按 GRETIL bsu019_u.htm（namaḥ saptānāṃ samyaksaṃbuddhakoṭīnāṃ tadyathā oṃ cale cule cunde svāhā）及 T20n1075.xml 收录纯粹本咒。',
      rawSnippet: cbetaT20n1075?.dharaniParagraphs.slice(0, 4).map((p) => p.text).join('\n'),
    },
    verses: [
      {
            "id": "cundi-1",
            "index": 1,
            "iast": "namaḥ saptānāṃ samyaksaṃbuddhakoṭīnām",
            "classicalTranslitZh": "南无飒哆喃 三藐三勃陀 俱胝喃",
            "modernPhoneticZh": "拿玛₍赫₎ 萨₍普₎达南 萨₍姆₎呀₍克₎-桑布达果蒂南",
            "meaningZh": "顶礼过去七俱胝（七千万）正等正觉诸佛！",
            "meaningEn": "Homage to Seventy Million Perfectly Awakened Buddhas!",
            "tangNoteZh": "诵前常冠龙树菩萨开咒偈：「稽首皈依苏悉帝，头面顶礼七俱胝，我今称赞大准提，唯愿慈悲垂加护」。",
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
            "id": "cundi-2",
            "index": 2,
            "iast": "tadyathā | oṃ cale cule cunde svāhā",
            "classicalTranslitZh": "怛侄他 唵 折戾 主戾 准提 娑婆诃",
            "modernPhoneticZh": "达₍地₎呀他 | 嗡 佳雷 主雷 准叠 ₍斯₎瓦哈",
            "meaningZh": "即说咒曰：嗡！游行起用尊（折戾）、升起觉树尊（主戾）、清净最胜佛母尊（准提），吉祥圆满成就，娑婆诃！",
            "meaningEn": "Namely: Oṃ! O Moving One (Cale), Arising One (Cule), Pure Sovereign Mother (Cunde), Svāhā!",
            "tangNoteZh": "《佛说七俱胝佛母准提大明陀罗尼经》(T20n1075) 暨 GRETIL《大乘庄严宝王经》(bsu019_u.htm) 原典正宗咒文（显密圆通合诵之一字大轮咒另列独立专条）。",
            "words": [
                  {
                        "iast": "tadyathā",
                        "stem": "tadyathā",
                        "grammar": "Adv. · 咒引词",
                        "transliterationZh": "怛侄他 / 怛你也他（拼读参考：达₍地₎呀他）",
                        "meaningZh": "即说咒曰、所谓",
                        "meaningEn": "namely, thus goes the mantra",
                        "origin": "derived-reference"
                  },
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
                        "iast": "cale",
                        "stem": "cala",
                        "grammar": "Impv. 2nd Sg. · 祈使式 · Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "者隶（拼读参考：佳雷）",
                        "meaningZh": "震动警觉、破除昏沉（左攞）尊",
                        "meaningEn": "O stir awake and shake off delusion! / in stir awake and shake off delusion!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "cule",
                        "stem": "ca-la",
                        "grammar": "Mantra Voc. · 真言呼请句",
                        "transliterationZh": "主隶（拼读参考：主雷）",
                        "meaningZh": "妙行迁变空·离一切相无相（呼请加持）",
                        "meaningEn": "awakened conduct beyond flux & freedom from conditioned marks (vocative invocation)",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "cunde",
                        "stem": "cunde",
                        "grammar": "Voc.Sg.F. · 准提呼格",
                        "transliterationZh": "主喃泥（拼读参考：准叠）",
                        "meaningZh": "准提清净佛母！（呼格）",
                        "meaningEn": "O Cundā, Pure Goddess!",
                        "origin": "derived-reference"
                  }
            ]
      }
],
  },
  {
    id: 'ten-small-05-aparimitayur',
    titleZh: '十小咒之五：圣无量寿决定光明王陀罗尼（GRETIL 贝叶经对照 · 5句全本）',
    titleSanskritIast: 'Aparimitāyur-jñāna-suviniścitatejorāja-dhāraṇī',
    titleEnglish: 'Dhāraṇī of the King of Boundless Life, Wisdom, and Well-Determined Radiance',
    categoryId: 'ten-small-mantras',
    taishoNo: 'T19n0936 / T19n0937',
    translatorZh: '宋·西天中印土摩伽陀国三藏法师法天 奉诏译',
    sutraSourceZh: '《大乘圣无量寿决定光明王如来陀罗尼经》(T19n0936) 暨 GRETIL《Aparimitāyuḥsūtra》(bsu003_u.htm)',
    deityZh: '无量寿决定光明王如来 (Aparimitāyur-jñāna-suviniścitatejorāja Tathāgata)',
    meritsAndSummaryZh:
      '专主延寿、增福、消弭横死短命定业之如来根本陀罗尼，全咒共 5 句。经云若自书写或教人书写受持，纵寿尽命促，亦得延寿满百岁，临终往生无量寿佛净土。直接接入 GRETIL《bsu003_u.htm》及 CBETA《T19n0936.xml》！',
    recitationTipsZh:
      '前二句礼敬无量寿智决定光明王如来，后三句宣演诸行清净、虚空出生、大乘眷属围绕之延寿心印。',
    provenance: {
      sourceType: 'CBETA+GRETIL',
      cbetaId: 'T19n0936',
      cbetaRawXmlUrl: cbetaT19n0936?.cbetaRawUrl || 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n0936.xml',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T19n0936',
      gretilFile: 'bsu003_u.htm',
      gretilRawUrl: gretilAparimitayuh?.gretilRawUrl || 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/main/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/bsu003_u.htm',
      editionCitation:
        'Digital Sanskrit Buddhist Canon (DSBC Sutra No. 3) / GRETIL bsu003_u.htm (Aparimitāyuḥsūtra) & CBETA T19n0936 (宋·法天译)。',
      manuscriptNotesZh:
        '已从 INDOLOGY/GRETIL-mirror 下载 bsu003_u.htm 尼泊尔梵文写本并按五句完整建档。',
      rawSnippet: gretilAparimitayuh?.rawSnippet,
    },
    verses: [
      {
            "id": "aparimita-1",
            "index": 1,
            "iast": "namo bhagavate aparimitāyurjñānasuviniścitatejorājāya",
            "classicalTranslitZh": "唵 捺摩巴葛瓦帝 阿巴啰密沓 阿优哩阿纳 苏必你实执沓 牒左啰宰也",
            "modernPhoneticZh": "拿摩 巴嘎瓦帝 阿巴里米达尤₍尔₎-₍吉尼₎亚拿-苏维尼₍希₎吉达-帝久-啦佳呀",
            "meaningZh": "归命世尊、无量寿智决定光明王尊！",
            "meaningEn": "Homage to the Blessed One, King of Boundless Life, Wisdom, and Well-Ascertained Radiance!",
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
                  },
                  {
                        "iast": "aparimitāyurjñānasuviniścitatejorājāya",
                        "stem": "aparimitāyus-jñāna-su-viniścita-tejaḥ-rāja",
                        "grammar": "Samāsa · 复合词 (Dat. Sg. · 为格单数)",
                        "transliterationZh": "阿跛哩弭多庾哩枳若(引)曩苏尾你室只怛帝树啰(引)惹(引)耶（拼读参考：阿巴里米达尤₍尔₎-₍吉尼₎亚拿-苏维尼₍希₎吉达-帝久-啦佳呀）",
                        "meaningZh": "向无量寿智决定王如来·圣智·报刊往外·决定·威光·王",
                        "meaningEn": "Aparimitāyus + primordial wisdom + press out + determined to + to",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "aparimita-2",
            "index": 2,
            "iast": "tathāgatāyārhate samyaksaṃbuddhāya",
            "classicalTranslitZh": "怛塔哿达也 阿啰诃帝 三药三不达也",
            "modernPhoneticZh": "达他嘎达-呀₍尔₎哈帝 萨₍姆₎呀₍克₎-桑布达呀",
            "meaningZh": "如来、应供、无上正等正觉！",
            "meaningEn": "The Tathāgata, Arhat, Perfectly Awakened Buddha!",
            "words": [
                  {
                        "iast": "tathāgatāyārhate",
                        "stem": "tathāgata-āya-ārhata",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "怛他(引)誐多夜哩诃帝（拼读参考：达他嘎达-呀₍尔₎哈帝）",
                        "meaningZh": "如来·出·堪敬尊",
                        "meaningEn": "Tathāgata + income",
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
            "id": "aparimita-3",
            "index": 3,
            "iast": "tadyathā | oṃ sarvasaṃskārapariśuddha dharmate",
            "classicalTranslitZh": "怛你也塔 唵 萨哩巴 桑斯葛哩 叭哩述沓 达哩马帝",
            "modernPhoneticZh": "达₍地₎呀他 | 嗡 萨₍尔₎瓦-桑₍斯₎嘎啦-巴里-舒达 达₍尔₎玛帝",
            "meaningZh": "即说咒曰：嗡！一切诸行究竟清净之法性真如尊！",
            "meaningEn": "Namely: Oṃ! O Dharma-Nature pure of all conditioned formations!",
            "words": [
                  {
                        "iast": "tadyathā",
                        "stem": "tadyathā",
                        "grammar": "Adv. · 咒引词",
                        "transliterationZh": "怛侄他 / 怛你也他（拼读参考：达₍地₎呀他）",
                        "meaningZh": "即说咒曰、所谓",
                        "meaningEn": "namely, thus goes the mantra",
                        "origin": "derived-reference"
                  },
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
                        "iast": "sarvasaṃskārapariśuddha",
                        "stem": "sarva-saṃskāra-pariśuddha",
                        "grammar": "Samāsa · 复合词 (Part. · 圆满清净)",
                        "transliterationZh": "萨哩嚩三娑迦(引)啰跛哩戍没驮（拼读参考：萨₍尔₎瓦-桑₍斯₎嘎啦-巴里-舒达）",
                        "meaningZh": "一切·行·圆满清净",
                        "meaningEn": "all + volitional formations + thoroughly pure",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "dharmate",
                        "stem": "dharma",
                        "grammar": "Noun · 法宝 · Ātmanepada 3rd Sg. · 为自言单数",
                        "transliterationZh": "达哩摩帝（拼读参考：达₍尔₎玛帝）",
                        "meaningZh": "正法、诸法实相",
                        "meaningEn": "Dharma, cosmic truth/teaching/phenomena",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "aparimita-4",
            "index": 4,
            "iast": "gaganasamudgate svabhāvaviśuddhe",
            "classicalTranslitZh": "哿哿捺 萨穆得哿帝 莎巴瓦 比述帝",
            "modernPhoneticZh": "嘎嘎拿-萨穆₍德₎嘎帝 ₍斯₎瓦巴瓦-维舒叠",
            "meaningZh": "如太虚空般无碍显现、自性本来清净无垢尊！",
            "meaningEn": "Arisen like the sky, pure in intrinsic nature!",
            "words": [
                  {
                        "iast": "gaganasamudgate",
                        "stem": "gagana-samudga",
                        "grammar": "Samāsa · 复合词 (Ātmanepada 3rd Sg. · 为自言单数)",
                        "transliterationZh": "誐誐曩萨母讷誐帝（拼读参考：嘎嘎拿-萨穆₍德₎嘎帝）",
                        "meaningZh": "虚空器箧",
                        "meaningEn": "sky + tip",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "svabhāvaviśuddhe",
                        "stem": "svabhāva-viśuddha",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "娑嚩婆(引)嚩尾戍没第（拼读参考：₍斯₎瓦巴瓦-维舒叠）",
                        "meaningZh": "自性最极清净",
                        "meaningEn": "own-being + O completely purified",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "aparimita-5",
            "index": 5,
            "iast": "mahānayaparivāre svāhā",
            "classicalTranslitZh": "马喝捺也 叭哩瓦哩 娑喝",
            "modernPhoneticZh": "玛哈-拿呀巴里瓦雷 ₍斯₎瓦哈",
            "meaningZh": "大乘妙理圆满眷属周匝围绕尊，决定延寿吉祥成就，娑喝！",
            "meaningEn": "Encompassed by the retinue of the Great Way, Svāhā!",
            "words": [
                  {
                        "iast": "mahānayaparivāre",
                        "stem": "mahān-aya-parivāra",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "摩诃曩耶跛哩嚩(引)隶（拼读参考：玛哈-拿呀巴里瓦雷）",
                        "meaningZh": "大·此处·眷属尊",
                        "meaningEn": "walk + O accessory",
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
    id: 'ten-small-06-bhaisajyaguru',
    titleZh: '十小咒之六：药师琉璃光如来灌顶真言（GRETIL 梵本对照 · 4句全本）',
    titleSanskritIast: 'Bhaiṣajyaguru-vaiḍūryaprabhā-tathāgata-dhāraṇī',
    titleEnglish: 'Medicine Buddha (Bhaiṣajyaguru) Lapis Lazuli Consecration Dhāraṇī',
    categoryId: 'ten-small-mantras',
    taishoNo: 'T14n0450 / T14n0451 / T19n0924A',
    translatorZh: '唐·三藏法师玄奘 译 / 唐·义净 译',
    sutraSourceZh: '《药师琉璃光如来本愿功德经》(T14n0450) 暨 GRETIL《Bhaiṣajyagurusūtra》(bsu012_u.htm)',
    deityZh: '东方净琉璃世界药师琉璃光如来 (Bhaiṣajyaguru Vaiḍūryaprabhārāja)',
    meritsAndSummaryZh:
      '药师如来入「除灭一切众生苦恼」三摩地，于肉髻中放大光明所宣说之大陀罗尼，全咒共 4 句。若见病苦者，于清净食、水或药上咒一百八遍与彼服食，所有病苦悉皆消灭，无有横死，究竟得菩提。直接接入 GRETIL《bsu012_u.htm》！',
    recitationTipsZh:
      '核心咒心「oṃ bhaiṣajye bhaiṣajye mahābhaiṣajye bhaiṣajyasamudgate svāhā」中，bhaiṣajye（法药）的 bh 为浊送气唇音，ṣ 为卷舌擦音。',
    provenance: {
      sourceType: 'CBETA+GRETIL',
      cbetaId: 'T14n0450',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T14n0450',
      gretilFile: 'bsu012_u.htm',
      gretilRawUrl: gretilBhaisajya?.gretilRawUrl || 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/main/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/bsu012_u.htm',
      editionCitation:
        'GRETIL bsu012_u.htm (Bhaiṣajyaguruvaiḍūryaprabhārājasūtra, ed. P.L. Vaidya, Buddhist Sanskrit Texts 17, 1961) & CBETA T14n0450 / T14n0451。',
      manuscriptNotesZh:
        '已从 INDOLOGY/GRETIL-mirror 下载吉尔吉特 (Gilgit) 梵文写本校勘本 bsu012_u.htm 原文。',
      rawSnippet: gretilBhaisajya?.rawSnippet,
    },
    verses: [
      {
            "id": "bhaisajya-1",
            "index": 1,
            "iast": "namo bhagavate bhaiṣajyaguru-vaiḍūryaprabhārājāya",
            "classicalTranslitZh": "南谟薄伽伐帝 鞞杀社窭噜 薛琉璃 钵喇婆 喝啰阇也",
            "modernPhoneticZh": "拿摩 巴嘎瓦帝 拜沙₍吉₎呀-古鲁-歪杜₍哩₎呀-₍普₎啦巴-啦佳呀",
            "meaningZh": "归命世尊、药师琉璃光王尊！",
            "meaningEn": "Homage to the Blessed One, Medicine Master and King of Lapis Lazuli Light!",
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
                  },
                  {
                        "iast": "bhaiṣajyaguru",
                        "stem": "bhaiṣajyaguru",
                        "grammar": "Prop.Noun · 药师佛",
                        "transliterationZh": "拜洒惹耶具噜（拼读参考：拜沙₍吉₎呀-古鲁）",
                        "meaningZh": "药师琉璃光如来",
                        "meaningEn": "Bhaiṣajyaguru, Medicine Master Buddha",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "vaiḍūryaprabhārājāya",
                        "stem": "vaiḍūrya-prabhā-āja",
                        "grammar": "Samāsa · 复合词 (Dat. Sg. · 为格单数)",
                        "transliterationZh": "吠度(引)哩耶钵啰婆(引)啰(引)惹(引)耶（拼读参考：歪杜₍哩₎呀-₍普₎啦巴-啦佳呀）",
                        "meaningZh": "向净琉璃宝光明来诣",
                        "meaningEn": "lapis lazuli + light + to",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "bhaisajya-2",
            "index": 2,
            "iast": "tathāgatāyārhate samyaksaṃbuddhāya",
            "classicalTranslitZh": "怛他揭多也 阿啰喝帝 三藐三勃陀也",
            "modernPhoneticZh": "达他嘎达-呀₍尔₎哈帝 萨₍姆₎呀₍克₎-桑布达呀",
            "meaningZh": "如来、应供、正遍知！",
            "meaningEn": "The Tathāgata, Arhat, Perfectly Awakened Buddha!",
            "words": [
                  {
                        "iast": "tathāgatāyārhate",
                        "stem": "tathāgata-āya-ārhata",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "怛他(引)誐多夜哩诃帝（拼读参考：达他嘎达-呀₍尔₎哈帝）",
                        "meaningZh": "如来·出·堪敬尊",
                        "meaningEn": "Tathāgata + income",
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
            "id": "bhaisajya-3",
            "index": 3,
            "iast": "tadyathā | oṃ bhaiṣajye bhaiṣajye mahābhaiṣajye",
            "classicalTranslitZh": "怛侄他 唵 鞞杀逝 鞞杀逝 鞞杀社",
            "modernPhoneticZh": "达₍地₎呀他 | 嗡 拜沙₍吉₎耶 拜沙₍吉₎耶 玛哈-拜沙₍吉₎耶",
            "meaningZh": "即说咒曰：嗡！妙药、妙药、疗愈身心生死大病之无上法药！",
            "meaningEn": "Namely: Oṃ! Healing medicine, healing medicine, supreme healing medicine!",
            "words": [
                  {
                        "iast": "tadyathā",
                        "stem": "tadyathā",
                        "grammar": "Adv. · 咒引词",
                        "transliterationZh": "怛侄他 / 怛你也他（拼读参考：达₍地₎呀他）",
                        "meaningZh": "即说咒曰、所谓",
                        "meaningEn": "namely, thus goes the mantra",
                        "origin": "derived-reference"
                  },
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
                        "iast": "bhaiṣajye",
                        "stem": "bhaiṣajya",
                        "grammar": "Noun · 妙药 · Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "拜洒惹曳（拼读参考：拜沙₍吉₎耶）",
                        "meaningZh": "法药、疗病妙药尊",
                        "meaningEn": "O medicine, healing remedy / in medicine, healing remedy",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bhaiṣajye",
                        "stem": "bhaiṣajya",
                        "grammar": "Noun · 妙药 · Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "拜洒惹曳（拼读参考：拜沙₍吉₎耶）",
                        "meaningZh": "法药、疗病妙药尊",
                        "meaningEn": "O medicine, healing remedy / in medicine, healing remedy",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "mahābhaiṣajye",
                        "stem": "mahā-bhaiṣajya",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "摩诃拜洒惹曳（拼读参考：玛哈-拜沙₍吉₎耶）",
                        "meaningZh": "大法药",
                        "meaningEn": "great + O medicine",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "bhaisajya-4",
            "index": 4,
            "iast": "bhaiṣajyasamudgate svāhā",
            "classicalTranslitZh": "三没揭帝 莎诃",
            "modernPhoneticZh": "拜沙₍吉₎呀-萨穆₍德₎嘎帝 ₍斯₎瓦哈",
            "meaningZh": "以医王法药普令众生度脱苦海升登觉岸尊，圆满成就，莎诃！",
            "meaningEn": "Risen forth through supreme Dharma-medicine to heal all beings, Svāhā!",
            "words": [
                  {
                        "iast": "bhaiṣajyasamudgate",
                        "stem": "bhaiṣajyasamudgata",
                        "grammar": "Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "拜洒惹耶萨母讷誐帝（拼读参考：拜沙₍吉₎呀-萨穆₍德₎嘎帝）",
                        "meaningZh": "药上菩萨尊",
                        "meaningEn": "O Supreme Medicine Bodhisattva / in Supreme Medicine Bodhisattva",
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
    id: 'ten-small-07-avalokitesvara-inspiration',
    titleZh: '十小咒之七：观音灵感真言（5句全本）',
    titleSanskritIast: 'Avalokiteśvara-tejo-dhāraṇī',
    titleEnglish: 'Miraculous Inspiration Mantra of Avalokiteśvara',
    categoryId: 'ten-small-mantras',
    taishoNo: 'T20 / 禅门日诵',
    translatorZh: '元明课诵传本',
    sutraSourceZh: '《禅门日诵》暨《大藏全咒》',
    deityZh: '大慈大悲救苦救难观世音菩萨',
    meritsAndSummaryZh:
      '全咒共 5 句，以六字大明咒「oṃ maṇi padme hūṃ」为首，接大智（mahājñāna）、发菩提心（cittotpāda）、心寂静（cittaśayana）、离寻伺（vitarka）及世自在王归敬，专祈观音菩萨寻声救苦、消除定业灾厄。',
    recitationTipsZh:
      '本咒五句皆为纯正大乘梵语教理词汇，理解词义后持诵尤为摄心。',
    provenance: {
      sourceType: 'Academic-Critical-Edition',
      editionCitation: '《禅门日诵》音译底本暨林光明《十小咒研究》梵文词根考订本。',
      manuscriptNotesZh: '逐句还原 mahājñāna, cittotpāda, sarvārtha, nāgapūraṇa, lokeśvarāya 等标准梵语复合词。',
    },
    verses: [
      {
            "id": "guanyin-insp-1",
            "index": 1,
            "iast": "oṃ maṇi padme hūṃ",
            "classicalTranslitZh": "唵 嘛呢叭咪吽",
            "modernPhoneticZh": "嗡 玛尼 巴₍德₎美 吽",
            "meaningZh": "嗡！莲华摩尼宝珠大悲心印，吽！",
            "meaningEn": "Oṃ! O Jewel in the Lotus, Hūṃ!",
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
                        "iast": "maṇi",
                        "stem": "maṇi",
                        "grammar": "Noun · 摩尼宝珠",
                        "transliterationZh": "摩抳（拼读参考：玛尼）",
                        "meaningZh": "摩尼宝珠（如意离垢宝）",
                        "meaningEn": "Maṇi jewel, luminous gem",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "padme",
                        "stem": "padma",
                        "grammar": "Noun · 莲华 · Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "钵讷铭（拼读参考：巴₍德₎美）",
                        "meaningZh": "莲华（出淤泥而不染清净心）尊",
                        "meaningEn": "O lotus flower (pure, unstained) / in lotus flower (pure, unstained)",
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
            "id": "guanyin-insp-2",
            "index": 2,
            "iast": "mahājñāna cittotpāda",
            "classicalTranslitZh": "麻曷倪牙纳 积都特巴达",
            "modernPhoneticZh": "玛哈₍吉尼₎亚拿 吉多₍特₎巴达",
            "meaningZh": "无上般若大圆镜智、发起阿耨多罗三藐三菩提心！",
            "meaningEn": "Supreme Wisdom (Mahājñāna), Generation of Awakening Mind (Cittotpāda)!",
            "words": [
                  {
                        "iast": "mahājñāna",
                        "stem": "mah-ājñāna",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "摩诃枳若(引)曩（拼读参考：玛哈₍吉尼₎亚拿）",
                        "meaningZh": "乐趣权威",
                        "meaningEn": "gladden + authority",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "cittotpāda",
                        "stem": "cittotpāda",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "只怛睹怛波捺（拼读参考：吉多₍特₎巴达）",
                        "meaningZh": "产制意愿、信解",
                        "meaningEn": "production of intention, resolution; by even so much as a single",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "guanyin-insp-3",
            "index": 3,
            "iast": "cittaśayana vitarka",
            "classicalTranslitZh": "积特些纳 微达哩葛",
            "modernPhoneticZh": "吉达-沙呀拿 维达₍尔₎嘎",
            "meaningZh": "令心寂静安住三摩地、超离一切妄想寻伺！",
            "meaningEn": "Serenity of Mind, Transcending Discursive Thought!",
            "words": [
                  {
                        "iast": "cittaśayana",
                        "stem": "citta-śayana",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "只怛怛舍耶曩（拼读参考：吉达-沙呀拿）",
                        "meaningZh": "心寝",
                        "meaningEn": "mind + resting",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "vitarka",
                        "stem": "vitarka",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "尾怛哩迦（拼读参考：维达₍尔₎嘎）",
                        "meaningZh": "寻",
                        "meaningEn": "conjecture, supposition, deliberation, doubt",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "guanyin-insp-4",
            "index": 4,
            "iast": "sarvārtha bhūri siddha kāma nāgapūraṇa",
            "classicalTranslitZh": "萨而斡而塔 卜哩悉塔葛 纳补啰纳",
            "modernPhoneticZh": "萨₍尔₎瓦₍尔₎他 布里 悉达 嘎玛 拿嘎-布啦拿",
            "meaningZh": "成就一切广大自利利他胜义、圆满人天龙神一切善愿！",
            "meaningEn": "Accomplishing All Noble Aims, Fulfilling All Wishes!",
            "words": [
                  {
                        "iast": "sarvārtha",
                        "stem": "sarvārtha",
                        "grammar": "Samāsa · 一切义利",
                        "transliterationZh": "萨哩嚩(引)哩他（拼读参考：萨₍尔₎瓦₍尔₎他）",
                        "meaningZh": "一切义利、一切所求善愿",
                        "meaningEn": "all aims and benefits",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bhūri",
                        "stem": "bhūri",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "部(引)哩（拼读参考：布里）",
                        "meaningZh": "聪慧",
                        "meaningEn": "intelligence",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "siddha",
                        "stem": "siddha",
                        "grammar": "Adj./Noun · 成就尊",
                        "transliterationZh": "悉没驮（拼读参考：悉达）",
                        "meaningZh": "成就者、已成就",
                        "meaningEn": "accomplished, perfected adept (Siddha)",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "kāma",
                        "stem": "kāma",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "迦(引)摩（拼读参考：嘎玛）",
                        "meaningZh": "希",
                        "meaningEn": "wish",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "nāgapūraṇa",
                        "stem": "nāga-pūraṇa",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "那(引)誐布啰拏（拼读参考：拿嘎-布啦拿）",
                        "meaningZh": "龙族遂",
                        "meaningEn": "Nāga + satisfy",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "guanyin-insp-5",
            "index": 5,
            "iast": "bhūri bhūri uttama | namo lokeśvarāya svāhā",
            "classicalTranslitZh": "纳卜哩 丢忒班纳 捺麻嚧吉 说啰耶 娑诃",
            "modernPhoneticZh": "布里 布里 乌达玛 | 拿摩 洛给-₍湿₎瓦啦呀 ₍斯₎瓦哈",
            "meaningZh": "广大复广大、最上无等伦！归命世间自在王观世音菩萨，娑诃！",
            "meaningEn": "Vast, Supreme! Homage to Lokeśvara (Sovereign of the World), Svāhā!",
            "words": [
                  {
                        "iast": "bhūri",
                        "stem": "bhūri",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "部(引)哩（拼读参考：布里）",
                        "meaningZh": "聪慧",
                        "meaningEn": "intelligence",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "bhūri",
                        "stem": "bhūri",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "部(引)哩（拼读参考：布里）",
                        "meaningZh": "聪慧",
                        "meaningEn": "intelligence",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "uttama",
                        "stem": "uttama",
                        "grammar": "Adj. · 最上",
                        "transliterationZh": "坞怛怛摩（拼读参考：乌达玛）",
                        "meaningZh": "最上、至高无上",
                        "meaningEn": "highest, supreme, most excellent",
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
                        "iast": "lokeśvarāya",
                        "stem": "lokeśvara",
                        "grammar": "Samāsa · 世自在尊 · Dat. Sg. · 为格单数",
                        "transliterationZh": "路计湿嚩啰(引)耶（拼读参考：洛给-₍湿₎瓦啦呀）",
                        "meaningZh": "向世间自在王（观音尊号）",
                        "meaningEn": "to/for Lokeśvara, Sovereign Lord of the World",
                        "origin": "derived-reference"
                  }
            ]
      }
],
  },
  {
    id: 'ten-small-08-sapta-buddha-papa',
    titleZh: '十小咒之八：七佛灭罪真言（通行8句全本）',
    titleSanskritIast: 'Saptātītabuddha-karṣaṇīya-pāpa-vināśana-dhāraṇī',
    titleEnglish: 'Karmic-Transgression-Eradicating Dhāraṇī of the Seven Past Buddhas (8 Clauses)',
    categoryId: 'ten-small-mantras',
    taishoNo: 'T24n1492 / T21n1339',
    translatorZh: '失译（附东晋录）《大方等陀罗尼经》卷四',
    sutraSourceZh: '《大方等陀罗尼经》(T21n1339) 暨《舍利弗悔过经》(T24n1492)',
    deityZh: '过去七佛（毗婆尸佛、尸弃佛、毗舍浮佛、拘留孙佛、拘那含牟尼佛、迦叶佛、释迦牟尼佛）',
    meritsAndSummaryZh:
      '过去七佛为愍念末法众生造作四重五逆重罪而同声宣说之灭罪真言，通行课诵共 8 句完整单列。至诚忏悔持诵，能涤除宿世罪障，心地清凉。',
    recitationTipsZh:
      '全咒八句采用重叠双声韵律（lipā lipate, kuha kuhate, traṭi traṭite, nirghārate...），犹如法水层层洗涤心垢，念诵时宜清澈舒缓。',
    provenance: {
      sourceType: 'CBETA-XML-P5',
      cbetaId: 'T21n1339',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T21n1339',
      editionCitation: 'CBETA T21n1339《大方等陀罗尼经》卷四暨《舍利弗悔过经》(T24n1492)。',
      manuscriptNotesZh: '依据《大方等陀罗尼经》原典八句句读与梵文韵律结构逐句校订。',
    },
    verses: [
      {
            "id": "sapta-buddha-1",
            "index": 1,
            "iast": "lipā lipate",
            "classicalTranslitZh": "离婆离婆帝",
            "modernPhoneticZh": "利巴 利巴帝",
            "meaningZh": "涤除染污、远离一切三业尘垢尊！",
            "meaningEn": "O One Freed from Stain and Defilement!",
            "words": [
                  {
                        "iast": "lipā",
                        "stem": "la-pa",
                        "grammar": "Mantra-pada · 陀罗尼字门合释",
                        "transliterationZh": "里波（拼读参考：利巴）",
                        "meaningZh": "离一切相无相·第一义谛",
                        "meaningEn": "freedom from conditioned marks & ultimate truth",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "lipate",
                        "stem": "lip",
                        "grammar": "Ātmanepada 3rd Sg. · 为自言单数",
                        "transliterationZh": "里跛帝（拼读参考：利巴帝）",
                        "meaningZh": "诬蔑、垢染",
                        "meaningEn": "smear, stain, soil , besmear with or smear a over or on a , stick on to; cleave or st",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "sapta-buddha-2",
            "index": 2,
            "iast": "kuha kuhate",
            "classicalTranslitZh": "求诃求诃帝",
            "modernPhoneticZh": "古哈 古哈帝",
            "meaningZh": "破除覆藏、洞照深密心源尊！",
            "meaningEn": "O Dispeller of Hidden Faults!",
            "words": [
                  {
                        "iast": "kuha",
                        "stem": "kuha",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "矩诃（拼读参考：古哈）",
                        "meaningZh": "何为",
                        "meaningEn": "how?; how will you get that?",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "kuhate",
                        "stem": "kuha",
                        "grammar": "Ātmanepada 3rd Sg. · 为自言单数",
                        "transliterationZh": "矩诃帝（拼读参考：古哈帝）",
                        "meaningZh": "何为",
                        "meaningEn": "how?; how will you get that?",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "sapta-buddha-3",
            "index": 3,
            "iast": "traṭi traṭite",
            "classicalTranslitZh": "陀罗尼帝",
            "modernPhoneticZh": "₍特₎啦蒂 ₍特₎啦蒂帝",
            "meaningZh": "金刚总持、碎裂无始恶业结缚尊！",
            "meaningEn": "O Upholder of Dhāraṇī Shattering Karmic Bonds!",
            "words": [
                  {
                        "iast": "traṭi",
                        "stem": "ta-ra-ṭa",
                        "grammar": "Mantra Voc. · 真言呼请句",
                        "transliterationZh": "怛啰置（拼读参考：₍特₎啦蒂）",
                        "meaningZh": "真如实际·清净离诸尘垢·断除憍慢执障（呼请加持）",
                        "meaningEn": "immutable Suchness & stainless purity free from dust & cutting rigid pride (vocative invocation)",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "traṭite",
                        "stem": "ta-ra-ṭa",
                        "grammar": "Mantra Voc. · 真言呼请句",
                        "transliterationZh": "怛啰置帝（拼读参考：₍特₎啦蒂帝）",
                        "meaningZh": "真如实际·清净离诸尘垢·断除憍慢执障（呼请加持）",
                        "meaningEn": "immutable Suchness & stainless purity free from dust & cutting rigid pride (vocative invocation)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "sapta-buddha-4",
            "index": 4,
            "iast": "nirghārate",
            "classicalTranslitZh": "尼诃啰帝",
            "modernPhoneticZh": "尼₍尔₎嘎啦帝",
            "meaningZh": "彻底拔除五逆十恶罪根尊！",
            "meaningEn": "O Uprooter of All Karmic Transgressions!",
            "words": [
                  {
                        "iast": "nirghārate",
                        "stem": "na-ra-gha",
                        "grammar": "Mantra Voc. · 真言呼请句",
                        "transliterationZh": "你哩伽(引)啰帝（拼读参考：尼₍尔₎嘎啦帝）",
                        "meaningZh": "离名相假立·清净离诸尘垢·破暗合集（呼请加持）",
                        "meaningEn": "beyond nominal designation & stainless purity free from dust & dissolving dense ignorance (vocative invocation)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "sapta-buddha-5",
            "index": 5,
            "iast": "vimalate",
            "classicalTranslitZh": "毗黎你帝",
            "modernPhoneticZh": "维玛啦帝",
            "meaningZh": "远离尘垢、清净光明遍照尊！",
            "meaningEn": "O Immaculate and Stainless One!",
            "words": [
                  {
                        "iast": "vimalate",
                        "stem": "vimala",
                        "grammar": "Adj. · 离垢清净 · Ātmanepada 3rd Sg. · 为自言单数",
                        "transliterationZh": "尾摩攞帝（拼读参考：维玛啦帝）",
                        "meaningZh": "离垢、清净无瑕",
                        "meaningEn": "immaculate, stainless, crystal-pure",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "sapta-buddha-6",
            "index": 6,
            "iast": "mahāgatye",
            "classicalTranslitZh": "摩诃伽帝",
            "modernPhoneticZh": "玛哈嘎₍蒂₎耶",
            "meaningZh": "安住无上大乘菩提正道尊！",
            "meaningEn": "O Traveler on the Great Path of Awakening!",
            "words": [
                  {
                        "iast": "mahāgatye",
                        "stem": "maha-aga-tya",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "摩诃誐底曳（拼读参考：玛哈嘎₍蒂₎耶）",
                        "meaningZh": "酒席·宝树宝山·那个尊",
                        "meaningEn": "feast + tree or mountain + O that",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "sapta-buddha-7",
            "index": 7,
            "iast": "śāntiṅgare",
            "classicalTranslitZh": "真陵乾帝",
            "modernPhoneticZh": "善定嘎雷",
            "meaningZh": "施予罪灭心安、大寂静清凉尊！",
            "meaningEn": "O Bestower of Supreme Peace and Tranquility!",
            "words": [
                  {
                        "iast": "śāntiṅgare",
                        "stem": "śa-na-ta",
                        "grammar": "Mantra Voc. · 真言呼请句",
                        "transliterationZh": "奢喃底仰誐隶（拼读参考：善定嘎雷）",
                        "meaningZh": "本性寂静止息·离名相假立·真如实际（呼请加持）",
                        "meaningEn": "primordial tranquil peace & beyond nominal designation & immutable Suchness (vocative invocation)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "sapta-buddha-8",
            "index": 8,
            "iast": "svāhā",
            "classicalTranslitZh": "莎婆诃",
            "modernPhoneticZh": "₍斯₎瓦哈",
            "meaningZh": "一切罪障悉皆消灭、吉祥圆满成就，莎婆诃！",
            "meaningEn": "May all karmic obstacles be eradicated, Svāhā!",
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
    id: 'ten-small-09-sukhavativyuha',
    titleZh: '十小咒之九：拔一切业障根本得生净土陀罗尼（往生咒14句59字全本）',
    titleSanskritIast: 'Sarvakarmāvaraṇamūla-nikṛntana-sukhāvatīvyūha-dhāraṇī',
    titleEnglish: 'Dhāraṇī for Uprooting All Karmic Obstacles and Rebirth in Sukhāvatī (14 Clauses)',
    categoryId: 'ten-small-mantras',
    taishoNo: 'T12n0368 / T19n0930',
    translatorZh: '刘宋·天竺三藏求那跋陀罗 译 / 唐·不空三藏 译《无量寿如来观行供养仪轨》',
    sutraSourceZh: '《拔一切业障根本得生净土神咒》(T12n0368)',
    deityZh: '西方极乐世界阿弥陀如来 (Amitābha / Amitāyus Tathāgata)',
    meritsAndSummaryZh:
      '净土宗与汉传佛教最广为传诵之阿弥陀佛根本心咒，严格按传统课诵十四句、全 59 字逐句完整单列。经云若有善男子善女人能诵此咒者，阿弥陀佛常住其顶日夜拥护，现世常得安隐，临命终时任运往生极乐国土。直接关联 CBETA《T12n0368.xml》原典。',
    recitationTipsZh:
      '全咒共 14 句 59 字，以 amṛta（无量寿不死甘露）为主轴，四次呼唤甘露现起、甘露成就、甘露神通超越、甘露广行接引，音韵如甘露流泉。',
    provenance: {
      sourceType: 'CBETA-XML-P5',
      cbetaId: 'T12n0368',
      cbetaRawXmlUrl: cbetaT12n0368?.cbetaRawUrl || 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T12/T12n0368.xml',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T12n0368',
      editionCitation:
        'CBETA XML-P5 T12n0368《拔一切业障根本得生净土神咒》(刘宋·求那跋陀罗译，十四句五十九字全本) & T19n0930 (唐·不空译)。',
      manuscriptNotesZh:
        '已从 github.com/cbeta-org/xml-p5 下载 T12n0368.xml 原典并按传统十四句逐句建档。',
      rawSnippet: cbetaT12n0368?.dharaniParagraphs.map((p) => p.text).join('\n'),
    },
    verses: [
      {
            "id": "sukhavati-1",
            "index": 1,
            "iast": "namo amitābhāya",
            "classicalTranslitZh": "南无阿弥多婆夜",
            "modernPhoneticZh": "拿摩 阿米达巴呀",
            "meaningZh": "归命无量光佛（阿弥陀佛）！",
            "meaningEn": "Homage to Amitābha (Infinite Light)!",
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
            "id": "sukhavati-2",
            "index": 2,
            "iast": "tathāgatāya",
            "classicalTranslitZh": "哆他伽多夜",
            "modernPhoneticZh": "达他嘎达呀",
            "meaningZh": "如来！",
            "meaningEn": "The Tathāgata!",
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
            "id": "sukhavati-3",
            "index": 3,
            "iast": "tadyathā",
            "classicalTranslitZh": "哆地夜他",
            "modernPhoneticZh": "达₍地₎呀他",
            "meaningZh": "即说拔一切业障神咒曰：",
            "meaningEn": "Namely, the Dhāraṇī is as follows:",
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
            "id": "sukhavati-4",
            "index": 4,
            "iast": "amṛtodbhave",
            "classicalTranslitZh": "阿弥利都婆毗",
            "modernPhoneticZh": "阿₍姆₎日多₍德₎巴威",
            "meaningZh": "不死甘露法水出生尊！",
            "meaningEn": "O Fountainhead of Immortal Ambrosia!",
            "words": [
                  {
                        "iast": "amṛtodbhave",
                        "stem": "amṛta-udbhava",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "阿蜜哩睹讷婆吠（拼读参考：阿₍姆₎日多₍德₎巴威）",
                        "meaningZh": "甘露氏族",
                        "meaningEn": "ambrosia + O origin",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "sukhavati-5",
            "index": 5,
            "iast": "amṛta",
            "classicalTranslitZh": "阿弥利哆",
            "modernPhoneticZh": "阿₍姆₎日达",
            "meaningZh": "无量寿清净甘露！",
            "meaningEn": "O Immortal Nectar (Amṛta)!",
            "words": [
                  {
                        "iast": "amṛta",
                        "stem": "amṛta",
                        "grammar": "Noun/Adj. · 不死甘露",
                        "transliterationZh": "阿蜜哩怛（拼读参考：阿₍姆₎日达）",
                        "meaningZh": "甘露、不死妙法",
                        "meaningEn": "ambrosia, nectar of immortality",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "sukhavati-6",
            "index": 6,
            "iast": "siddhaṃbhave",
            "classicalTranslitZh": "悉耽婆毗",
            "modernPhoneticZh": "悉当巴威",
            "meaningZh": "圆满成就一切净土善根尊！",
            "meaningEn": "O Accomplisher of All Pure-Land Merits!",
            "words": [
                  {
                        "iast": "siddhaṃbhave",
                        "stem": "siddhaṃ-bhava",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "悉没驮三婆吠（拼读参考：悉当巴威）",
                        "meaningZh": "悉昙愿成",
                        "meaningEn": "Siddham + O be! become!",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "sukhavati-7",
            "index": 7,
            "iast": "amṛta",
            "classicalTranslitZh": "阿弥唎哆",
            "modernPhoneticZh": "阿₍姆₎日达",
            "meaningZh": "大悲不死甘露！",
            "meaningEn": "O Ambrosia of Boundless Life!",
            "words": [
                  {
                        "iast": "amṛta",
                        "stem": "amṛta",
                        "grammar": "Noun/Adj. · 不死甘露",
                        "transliterationZh": "阿蜜哩怛（拼读参考：阿₍姆₎日达）",
                        "meaningZh": "甘露、不死妙法",
                        "meaningEn": "ambrosia, nectar of immortality",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "sukhavati-8",
            "index": 8,
            "iast": "vikrānte",
            "classicalTranslitZh": "毗迦兰帝",
            "modernPhoneticZh": "维₍克₎兰帝",
            "meaningZh": "大神通力超越三界生死尊！",
            "meaningEn": "Transcendent in Miraculous Power!",
            "words": [
                  {
                        "iast": "vikrānte",
                        "stem": "vikrānta",
                        "grammar": "Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "尾讫囕帝（拼读参考：维₍克₎兰帝）",
                        "meaningZh": "勇健 / 具艺尊",
                        "meaningEn": "O bold, valiant / in bold, valiant",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "sukhavati-9",
            "index": 9,
            "iast": "amṛta",
            "classicalTranslitZh": "阿弥唎哆",
            "modernPhoneticZh": "阿₍姆₎日达",
            "meaningZh": "无碍解脱甘露！",
            "meaningEn": "O Liberating Ambrosia!",
            "words": [
                  {
                        "iast": "amṛta",
                        "stem": "amṛta",
                        "grammar": "Noun/Adj. · 不死甘露",
                        "transliterationZh": "阿蜜哩怛（拼读参考：阿₍姆₎日达）",
                        "meaningZh": "甘露、不死妙法",
                        "meaningEn": "ambrosia, nectar of immortality",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "sukhavati-10",
            "index": 10,
            "iast": "vikrānta",
            "classicalTranslitZh": "毗迦兰多",
            "modernPhoneticZh": "维₍克₎兰达",
            "meaningZh": "广大无畏神力奋迅！",
            "meaningEn": "Striding Forth with Heroic Might!",
            "words": [
                  {
                        "iast": "vikrānta",
                        "stem": "vikrānta",
                        "grammar": "Lexeme · 梵语词义",
                        "transliterationZh": "尾讫囕怛（拼读参考：维₍克₎兰达）",
                        "meaningZh": "勇健 / 具艺",
                        "meaningEn": "bold, valiant",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "sukhavati-11",
            "index": 11,
            "iast": "gāmini",
            "classicalTranslitZh": "伽弥腻",
            "modernPhoneticZh": "嘎米尼",
            "meaningZh": "周遍十方接引众生往生极乐尊！",
            "meaningEn": "Guiding Sentient Beings to Sukhāvatī!",
            "words": [
                  {
                        "iast": "gāmini",
                        "stem": "ga-ma-na",
                        "grammar": "Mantra Voc. · 真言呼请句",
                        "transliterationZh": "誐(引)弭你（拼读参考：嘎米尼）",
                        "meaningZh": "妙行趣入·无我大慈三昧·离名相假立（呼请加持）",
                        "meaningEn": "awakened spiritual movement & selfless great loving-kindness & beyond nominal designation (vocative invocation)",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "sukhavati-12",
            "index": 12,
            "iast": "gagana",
            "classicalTranslitZh": "伽伽那",
            "modernPhoneticZh": "嘎嘎拿",
            "meaningZh": "犹如太虚空般广大无边际！",
            "meaningEn": "Vast as the Boundless Sky!",
            "words": [
                  {
                        "iast": "gagana",
                        "stem": "gagana",
                        "grammar": "Noun · 虚空",
                        "transliterationZh": "誐誐曩（拼读参考：嘎嘎拿）",
                        "meaningZh": "虚空、清净苍穹",
                        "meaningEn": "sky, boundless space, firmament",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "sukhavati-13",
            "index": 13,
            "iast": "kīrtikare",
            "classicalTranslitZh": "枳多迦利",
            "modernPhoneticZh": "给₍尔₎帝嘎雷",
            "meaningZh": "令佛名功德称赞遍满十方世界尊！",
            "meaningEn": "Filling the Cosmos with Glorious Renown!",
            "words": [
                  {
                        "iast": "kīrtikare",
                        "stem": "kīrti-kara",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "计哩底迦隶（拼读参考：给₍尔₎帝嘎雷）",
                        "meaningZh": "誉掌尊",
                        "meaningEn": "renown + O palm",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "sukhavati-14",
            "index": 14,
            "iast": "svāhā",
            "classicalTranslitZh": "娑婆诃",
            "modernPhoneticZh": "₍斯₎瓦哈",
            "meaningZh": "拔除一切业障、决定得生极乐净土，娑婆诃（十四句五十九字全本）！",
            "meaningEn": "Uprooting all karmic obstacles for rebirth in Sukhāvatī, Svāhā!",
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
    id: 'ten-small-10-mahasridevi',
    titleZh: '十小咒之十：大吉祥天女咒 / 善女天咒（GRETIL 梵本对照 · 7句全本）',
    titleSanskritIast: 'Mahāśrīdevī-dhāraṇī (Suvarṇaprabhāsa)',
    titleEnglish: 'Dhāraṇī of the Great Auspicious Goddess Mahāśrīdevī (Lakṣmī)',
    categoryId: 'ten-small-mantras',
    taishoNo: 'T16n0665 / T21n1252',
    translatorZh: '唐·三藏法师义净 奉制译《金光明最胜王经·大吉祥天女增长财物品》',
    sutraSourceZh: '《金光明最胜王经》(T16n0665) 暨 GRETIL《Suvarṇaprabhāsasūtra / Śrīmahādevīvyākaraṇam》(bsu007_u.htm)',
    deityZh: '大吉祥天女 / 功德天 (Mahāśrīdevī)',
    meritsAndSummaryZh:
      '《十小咒》圆满结篇，出自《金光明最胜王经》，全咒共 7 句。大吉祥天女于过去宝髻如来所种诸善根，能为修行者增益衣食财宝、资具无乏，令所修福慧速得圆满。直接接入 GRETIL 梵文原典《bsu007_u.htm》！',
    recitationTipsZh:
      '前二句礼敬十方三宝与大吉祥天女，后五句宣演行愿圆满、普门照见、大慈相应之增益法印。',
    provenance: {
      sourceType: 'CBETA+GRETIL',
      cbetaId: 'T16n0665',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T16n0665_008',
      gretilFile: 'bsu007_u.htm',
      gretilRawUrl: gretilSrimahadevi?.gretilRawUrl || 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/main/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/bsu007_u.htm',
      editionCitation:
        'GRETIL bsu007_u.htm (Śrīmahādevīvyākaraṇam, DSBC Sutra No. 7) & bsu035_u.htm (Suvarṇaprabhāsasūtra, ed. S. Bagchi, BST 8) & CBETA T16n0665 (唐·义净译)。',
      manuscriptNotesZh:
        '已从 INDOLOGY/GRETIL-mirror 下载 bsu007_u.htm 梵文原典并与义净译本完成七句逐句对齐。',
      rawSnippet: gretilSrimahadevi?.rawSnippet,
    },
    verses: [
      {
            "id": "mahasri-1",
            "index": 1,
            "iast": "namo buddhāya | namo dharmāya | namaḥ saṃghāya",
            "classicalTranslitZh": "南无佛陀 南无达摩 南无僧伽",
            "modernPhoneticZh": "拿摩 布达呀 | 拿摩 达₍尔₎玛呀 | 拿玛₍赫₎ 桑嘎呀",
            "meaningZh": "归命佛陀！归命正法！归命圣僧！",
            "meaningEn": "Homage to the Buddha! Homage to the Dharma! Homage to the Saṃgha!",
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
                        "iast": "buddhāya",
                        "stem": "buddha",
                        "grammar": "Noun · 佛号 · Dat. Sg. · 为格单数",
                        "transliterationZh": "佛驮耶 / 没驮耶（拼读参考：布达呀）",
                        "meaningZh": "向佛陀、觉者",
                        "meaningEn": "to/for Buddha, the Awakened One",
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
                        "iast": "dharmāya",
                        "stem": "dharma",
                        "grammar": "Noun · 法宝 · Dat. Sg. · 为格单数",
                        "transliterationZh": "达摩耶（拼读参考：达₍尔₎玛呀）",
                        "meaningZh": "向正法、诸法实相",
                        "meaningEn": "to/for Dharma, cosmic truth/teaching/phenomena",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "namaḥ",
                        "stem": "namaḥ",
                        "grammar": "Indecl. · 归敬词",
                        "transliterationZh": "曩莫（拼读参考：拿玛₍赫₎）",
                        "meaningZh": "归命、顶礼",
                        "meaningEn": "homage, reverent salutation",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "mahasri-2",
            "index": 2,
            "iast": "namaḥ śrīmahādevyāya | tadyathā",
            "classicalTranslitZh": "南无室利摩诃提鼻耶 怛你也他",
            "modernPhoneticZh": "拿玛₍赫₎ ₍希₎里玛哈叠₍维₎呀呀 | 达₍地₎呀他",
            "meaningZh": "归命大吉祥功德天女！即说真言曰：",
            "meaningEn": "Homage to the Great Auspicious Goddess Śrīmahādevī! Namely:",
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
                        "iast": "śrīmahādevyāya",
                        "stem": "√śrī+√mah",
                        "grammar": "Mantra Dat. · 真言为格句",
                        "transliterationZh": "室利摩诃泥尾夜耶（拼读参考：₍希₎里玛哈叠₍维₎呀呀）",
                        "meaningZh": "吉祥庄严·广大殊胜·本性寂静止息（归敬施与）",
                        "meaningEn": "glorious, great (reverent offering)",
                        "origin": "derived-reference"
                  },
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
            "id": "mahasri-3",
            "index": 3,
            "iast": "paripūraṇacare samantadarśane",
            "classicalTranslitZh": "波利富楼那遮利 三曼陀达舍尼",
            "modernPhoneticZh": "巴里布啦拿-佳雷 萨曼达-达₍尔₎沙内",
            "meaningZh": "圆满一切善愿行持尊、普门慈眼周遍照察尊！",
            "meaningEn": "O One of Perfectly Fulfilled Conduct, All-Beholding Vision!",
            "words": [
                  {
                        "iast": "paripūraṇacare",
                        "stem": "pari-pūraṇa-cara",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "跛哩布啰拏者隶（拼读参考：巴里布啦拿-佳雷）",
                        "meaningZh": "般·遂·行持妙道",
                        "meaningEn": "wisdom + satisfy + O move forth in compassionate activity!",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "samantadarśane",
                        "stem": "samanta-darśana",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "萨曼怛捺哩舍祢（拼读参考：萨曼达-达₍尔₎沙内）",
                        "meaningZh": "普遍观照",
                        "meaningEn": "universal + O false",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "mahasri-4",
            "index": 4,
            "iast": "mahāvihāragate samantavidhamane",
            "classicalTranslitZh": "摩诃毗诃罗伽帝 三曼陀毗尼伽帝",
            "modernPhoneticZh": "玛哈-维哈啦嘎帝 萨曼达-维达玛内",
            "meaningZh": "安住广大慈悲梵住尊、普遍破除贫匮暗障尊！",
            "meaningEn": "Abiding in the Great Sublime Abode, Dispelling Universal Obstructions!",
            "words": [
                  {
                        "iast": "mahāvihāragate",
                        "stem": "mahā-vihāra-gate",
                        "grammar": "Samāsa · 复合词 (Voc./Part. · 度越彼岸)",
                        "transliterationZh": "摩诃尾诃啰誐帝（拼读参考：玛哈-维哈啦嘎帝）",
                        "meaningZh": "大·佛殿·度越吧",
                        "meaningEn": "great + dwelling + gone",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "samantavidhamane",
                        "stem": "samanta-vidhamana",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "萨曼怛尾驮摩祢（拼读参考：萨曼达-维达玛内）",
                        "meaningZh": "普遍扇子尊",
                        "meaningEn": "universal + O fan",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "mahasri-5",
            "index": 5,
            "iast": "mahākāryapratiṣṭhāpane sarvārthasādhane supratipūre",
            "classicalTranslitZh": "摩诃迦梨野 波祢婆啰 波祢萨哩嚩栗他 三曼陀修钵黎帝",
            "modernPhoneticZh": "玛哈-嘎₍哩₎呀₍普₎啦帝₍师₎他巴内 萨₍尔₎瓦₍尔₎他萨达内 苏₍普₎啦帝布雷",
            "meaningZh": "善安立广大佛事、成办一切义利、令福德极善充满尊！",
            "meaningEn": "Establisher of Great Sacred Works, Accomplisher of All Aims, Well-Filled!",
            "words": [
                  {
                        "iast": "mahākāryapratiṣṭhāpane",
                        "stem": "mahā-kārya-pratiṣṭhāpana",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "摩诃迦(引)哩耶钵啰底瑟侘(引)跛祢（拼读参考：玛哈-嘎₍哩₎呀₍普₎啦帝₍师₎他巴内）",
                        "meaningZh": "大·果·板凳尊",
                        "meaningEn": "great + to be done + O stool",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "sarvārthasādhane",
                        "stem": "sarvārtha-sādhana",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "萨哩嚩(引)哩他娑驮祢（拼读参考：萨₍尔₎瓦₍尔₎他萨达内）",
                        "meaningZh": "一切义利成就法",
                        "meaningEn": "all aims and benefits + O accomplishing",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "supratipūre",
                        "stem": "su-pratipūra",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "苏钵啰底布隶（拼读参考：苏₍普₎啦帝布雷）",
                        "meaningZh": "报刊往外充分",
                        "meaningEn": "press out + O full",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "mahasri-6",
            "index": 6,
            "iast": "āyānadharmatā mahāvikurvite",
            "classicalTranslitZh": "富隶那 阿利那 达摩帝 摩诃毗鼓毕帝",
            "modernPhoneticZh": "阿呀拿达₍尔₎玛达 玛哈-维古₍尔₎维帝",
            "meaningZh": "契入不生法性真如、示现广大神通自在变化尊！",
            "meaningEn": "True Dharma-Nature, Manifesting Great Miraculous Transformations!",
            "words": [
                  {
                        "iast": "āyānadharmatā",
                        "stem": "āyāna-dharmatā",
                        "grammar": "Samāsa · 复合词末支",
                        "transliterationZh": "阿(引)夜曩达哩摩多（拼读参考：阿呀拿达₍尔₎玛达）",
                        "meaningZh": "来诣实相",
                        "meaningEn": "coming + true appearance",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "mahāvikurvite",
                        "stem": "mahā-vikurvita",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "摩诃尾矩哩尾帝（拼读参考：玛哈-维古₍尔₎维帝）",
                        "meaningZh": "大神变尊",
                        "meaningEn": "great + O miracle",
                        "origin": "derived-reference"
                  }
            ]
      },
      {
            "id": "mahasri-7",
            "index": 7,
            "iast": "mahāmaitrī-upasaṃhite mahākleśasupratiṣṭhite svāhā",
            "classicalTranslitZh": "摩诃弥勒帝 娄簸僧祇帝 醯帝簁 僧祇醯帝 三曼陀阿他阿耨婆罗尼 娑婆诃",
            "modernPhoneticZh": "玛哈麦₍特₎里-乌巴桑-嘿帝 玛哈-₍克₎雷沙苏₍普₎啦帝₍师₎提帝 ₍斯₎瓦哈",
            "meaningZh": "大慈心恒常相应摄受、于烦恼世间善安立众生福慧资粮尊，娑婆诃！",
            "meaningEn": "Endowed with Great Loving-Kindness, Firmly Sustaining All Beings, Svāhā!",
            "words": [
                  {
                        "iast": "mahāmaitrī",
                        "stem": "mahā-maitrī",
                        "grammar": "Samāsa · 复合词 (Noun · 大慈)",
                        "transliterationZh": "摩诃迈怛哩(引)（拼读参考：玛哈麦₍特₎里）",
                        "meaningZh": "大慈心",
                        "meaningEn": "great + loving-kindness",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "upasaṃhite",
                        "stem": "upasaṃhita",
                        "grammar": "Voc. Fem. / Loc. Sg. · 呼格佛母/处格",
                        "transliterationZh": "坞跛三呬帝（拼读参考：乌巴桑-嘿帝）",
                        "meaningZh": "拣尊",
                        "meaningEn": "O connected / in connected",
                        "origin": "derived-reference"
                  },
                  {
                        "iast": "mahākleśasupratiṣṭhite",
                        "stem": "mahā-kleśa-supratiṣṭhita",
                        "grammar": "Samāsa · 复合词 (Voc. Fem. / Loc. Sg. · 呼格佛母/处格)",
                        "transliterationZh": "摩诃讫隶舍苏钵啰底瑟耻帝（拼读参考：玛哈-₍克₎雷沙苏₍普₎啦帝₍师₎提帝）",
                        "meaningZh": "大·烦恼·安住尊",
                        "meaningEn": "great + affliction + O well grounded or situated",
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
];

export const TEN_SMALL_DHARANIS: DharaniEntry[] = RAW_TEN_SMALL_DHARANIS.map((e) =>
  e.id === 'ten-small-01-cintamanicakra'
    ? {
        ...e,
        verses: e.verses.map((v) => ({
          ...v,
          siddhamOriginal: iastToSiddham(v.iast),
          fieldSources: {
            ...v.fieldSources,
            siddham: 'db-original' as const,
          },
        })),
      }
    : e
);
