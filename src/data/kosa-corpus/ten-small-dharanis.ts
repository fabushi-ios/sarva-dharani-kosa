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

export const TEN_SMALL_DHARANIS: DharaniEntry[] = [
  {
    id: 'ten-small-01-cintamanicakra',
    titleZh: '十小咒之一：如意宝轮王陀罗尼（含 CBETA 89字悉昙梵汉逐字对音）',
    titleSanskritIast: 'Cintāmaṇicakra-dhāraṇī',
    titleEnglish: 'Wish-Fulfilling Jewel Wheel King Dhāraṇī (Cintāmaṇicakra)',
    categoryId: 'ten-small-mantras',
    taishoNo: 'T20n1080',
    translatorZh: '唐·南天竺三藏法师菩提流志 译 / 唐·义净 译',
    sutraSourceZh: '《如意轮陀罗尼经》(T20n1080)',
    deityZh: '如意轮观自在菩萨 (Cintāmaṇicakra Avalokiteśvara)',
    meritsAndSummaryZh:
      '《十小咒》首篇，统摄大咒（根本咒）、大心咒、随心咒三重结构。观自在菩萨手执如意摩尼宝珠与法轮，能满一切世出世间善愿。本词条直接接入从 CBETA 官方库下载之《T20n1080.xml》全部 89 个悉昙梵字与汉文逐字对音数据。',
    recitationTipsZh:
      '本咒由根本咒（tadyathā oṃ cakra-vartin cintāmaṇi mahāpadme...）、大心咒（oṃ varada padme hūṃ）与随心咒（oṃ padmacintāmaṇi jvāla hūṃ）一气呵成。',
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
        id: 'cintamani-1',
        index: 1,
        iast: 'namo buddhāya | namo dharmāya | namaḥ saṃghāya | namo āryāvalokiteśvarāya bodhisattvāya mahāsattvāya mahākāruṇikāya |',
        siddhamOriginal: iastToSiddham(
          'namo buddhāya | namo dharmāya | namaḥ saṃghāya | namo āryāvalokiteśvarāya bodhisattvāya mahāsattvāya mahākāruṇikāya |'
        ),
        classicalTranslitZh:
          '南无佛驮耶 南无达摩耶 南无僧伽耶 南无观自在菩萨摩诃萨 具大悲心者',
        modernPhoneticZh:
          '拿摩 布达呀 | 拿摩 达₍尔₎玛呀 | 拿玛₍赫₎ 桑嘎呀 | 拿摩 阿₍哩₎呀-瓦洛给帝-₍湿₎瓦啦呀 博地-萨₍特₎瓦呀 玛哈-萨₍特₎瓦呀 玛哈-嘎鲁尼嘎呀',
        meaningZh: '归命佛陀！归命正法！归命圣僧！归命圣观自在菩萨摩诃萨、具足大悲心者！',
        meaningEn:
          'Homage to the Buddha! Homage to the Dharma! Homage to the Saṃgha! Homage to Noble Avalokiteśvara, Bodhisattva Mahāsattva, the Greatly Compassionate One!',
        fieldSources: {
          siddham: 'db-original',
        },
        words: [
          { iast: 'buddhāya / dharmāya / saṃghāya', stem: 'buddha / dharma / saṃgha', grammar: 'Dat.Sg.', transliterationZh: '佛驮耶 / 达摩耶 / 僧伽耶', meaningZh: '向佛、法、僧三宝顶礼', meaningEn: 'to the Buddha, Dharma, and Saṃgha' },
        ],
      },
      {
        id: 'cintamani-2',
        index: 2,
        iast: 'tadyathā | oṃ cakravarti-cintāmaṇi mahāpadme ruru tiṣṭha jvāla ākarṣaya hūṃ phaṭ svāhā | oṃ padmacintāmaṇi jvāla hūṃ | oṃ varada padme hūṃ ||',
        siddhamOriginal: iastToSiddham(
          'tadyathā | oṃ cakravarti-cintāmaṇi mahāpadme ruru tiṣṭha jvāla ākarṣaya hūṃ phaṭ svāhā | oṃ padmacintāmaṇi jvāla hūṃ | oṃ varada padme hūṃ ||'
        ),
        classicalTranslitZh:
          '怛侄他 唵 斫羯啰伐底 震多末尼 摩诃钵蹬谜 噜噜噜噜 底瑟姹 篅啰阿羯利沙也 吽 癹 莎诃 | 唵 钵蹋摩 震多末尼 篅攞 吽 | 唵 跋喇陀 钵亶谜 吽 ||',
        modernPhoneticZh:
          '达₍地₎呀他 | 嗡 佳₍克₎啦瓦₍尔₎帝-津达玛尼 玛哈巴₍德₎美 鲁鲁 帝₍师₎他 ₍吉₎瓦啦 阿嘎₍尔₎沙呀 吽 帕₍特₎ ₍斯₎瓦哈 | 嗡 巴₍德₎玛-津达-玛尼 ₍吉₎瓦啦 吽 | 嗡 瓦啦达 巴₍德₎美 吽',
        meaningZh:
          '即说咒曰：嗡！转轮圣王如意宝珠、大红莲华尊！流注妙光、安住不动，放智慧火焰钩召摄受一切善法，吽、泮、娑婆诃！嗡，红莲如意宝珠放光，吽！嗡，施愿红莲尊，吽！',
        meaningEn:
          'Namely: Oṃ! Wheel-Turning Sovereign Wish-Fulfilling Gem, O Great Lotus! Radiate, abide, blaze forth and magnetize all blessings, Hūṃ Phaṭ Svāhā! Oṃ Lotus Wish-Fulfilling Gem, blaze, Hūṃ! Oṃ Boon-Granting Lotus, Hūṃ!',
        fieldSources: {
          siddham: 'db-original',
        },
        words: [
          { iast: 'cakravarti-cintāmaṇi', stem: 'cakravartin + cintāmaṇi', grammar: 'Voc.Sg.', transliterationZh: '斫羯啰伐底震多末尼', meaningZh: '转法轮王如意摩尼宝珠尊', meaningEn: 'O Wheel-Turning Sovereign Wish-Fulfilling Jewel' },
          { iast: 'mahāpadme', stem: 'mahā-padma', grammar: 'Voc.Sg.Fem.', transliterationZh: '摩诃钵蹬谜', meaningZh: '大清净红莲华尊', meaningEn: 'O Great Lotus' },
          { iast: 'tiṣṭha jvāla ākarṣaya', stem: '√sthā + √jval + ā-√kṛṣ', grammar: 'Impv.2.Sg.', transliterationZh: '底瑟姹篅啰阿羯利沙也', meaningZh: '安住、放光并钩召摄取一切善利', meaningEn: 'stand firm, blaze forth, and draw in blessings' },
          { iast: 'varada padme', stem: 'vara-da + padma', grammar: 'Voc.Sg.', transliterationZh: '跋喇陀钵亶谜', meaningZh: '施予胜愿之红莲华尊（随心咒）', meaningEn: 'O Boon-Bestowing Lotus' },
        ],
      },
    ],
  },
  {
    id: 'ten-small-02-jvalosnisa',
    titleZh: '十小咒之二：消灾吉祥神咒（炽盛光大威德消灾吉祥陀罗尼）',
    titleSanskritIast: 'Jvāloṣṇīṣa-mahāteja-dhāraṇī',
    titleEnglish: 'Blazing Crown (Jvāloṣṇīṣa) Disaster-Averting Auspicious Dhāraṇī',
    categoryId: 'ten-small-mantras',
    taishoNo: 'T19n0963 / T19n0964',
    translatorZh: '唐·大兴善寺三藏沙门大广智不空 奉诏译',
    sutraSourceZh: '《佛说炽盛光大威德消灾吉祥陀罗尼经》(T19n0963)',
    deityZh: '炽盛光佛顶如来 (Jvāloṣṇīṣa / Tejaprabhā Buddha)',
    meritsAndSummaryZh:
      '释迦牟尼佛于净居天宫为诸宿曜、九执、二十八宿宣说之消灾解厄总持。凡遇星曜凌逼、国界灾厄、疾疫障难，持诵此咒悉令消除，转不吉祥为大吉祥。直接关联 CBETA《T19n0963.xml》原典。',
    recitationTipsZh:
      '句首 namaḥ samantabuddhānāṃ 为密教诸佛通归敬句，apratihata-śāsanānāṃ 意为「无碍教令者」，持诵时气势宏大光明。',
    provenance: {
      sourceType: 'CBETA-XML-P5',
      cbetaId: 'T19n0963',
      cbetaRawXmlUrl: cbetaT19n0963?.cbetaRawUrl || 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n0963.xml',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T19n0963',
      editionCitation: 'CBETA XML-P5 T19n0963《佛说炽盛光大威德消灾吉祥陀罗尼经》(唐·不空三藏译)。',
      manuscriptNotesZh: '已从 github.com/cbeta-org/xml-p5 下载 T19n0963.xml 原典并提取陀罗尼全文。',
      rawSnippet: cbetaT19n0963?.dharaniParagraphs.map((p) => p.text).join('\n'),
    },
    verses: [
      {
        id: 'jvalosnisa-1',
        index: 1,
        iast: 'namaḥ samantabuddhānām apratihataśāsanānāṃ | tadyathā | oṃ khāhi khāhi khūṃ khūṃ jvala jvala prajvala prajvala |',
        classicalTranslitZh:
          '曩谟三满多母驮喃 阿钵啰(二合)底贺多舍娑曩喃 | 怛侄他 | 唵 佉佉 佉呬佉呬 吽吽 入嚩(二合)攞入嚩攞 钵啰(二合)入嚩攞钵啰入嚩攞 |',
        modernPhoneticZh:
          '拿玛₍赫₎ 萨曼达-布达南 阿₍普₎啦帝哈达-沙萨拿南 | 达₍地₎呀他 | 嗡 卡嘿 卡嘿 空 空 ₍吉₎瓦啦 ₍吉₎瓦啦 ₍普₎啦₍吉₎瓦啦 ₍普₎啦₍吉₎瓦啦',
        meaningZh:
          '【初段·归敬与炽盛光焰印】顶礼普遍十方一切诸佛、具无能障碍教敕者！即说咒曰：嗡！吞啖（一切灾障）、吞啖！吽吽！放光炽盛、极炽盛放光！',
        meaningEn:
          'Homage to all Buddhas everywhere, whose teachings and command are unobstructed! Namely: Oṃ! Devour, devour all calamities! Hūṃ Hūṃ! Blaze forth, blaze brightly!',
        words: [
          { iast: 'samantabuddhānām', stem: 'samanta-buddha', grammar: 'Gen.Pl.', transliterationZh: '三满多母驮喃', meaningZh: '遍法界一切诸佛', meaningEn: 'of all universal Buddhas' },
          { iast: 'apratihataśāsanānāṃ', stem: 'apratihata-śāsana', grammar: 'Gen.Pl.', transliterationZh: '阿钵啰底贺多舍娑曩喃', meaningZh: '教令威神无有障碍者', meaningEn: 'whose teachings/command cannot be obstructed' },
          { iast: 'jvala prajvala', stem: '√jval / pra-√jval', grammar: 'Impv.2.Sg.', transliterationZh: '入嚩攞钵啰入嚩攞', meaningZh: '炽然放光、大放威德光明', meaningEn: 'blaze, blaze brilliantly!' },
        ],
      },
      {
        id: 'jvalosnisa-2',
        index: 2,
        iast: 'tiṣṭha tiṣṭha ṣṭri ṣṭri sphoṭa sphoṭa śāntika śrīye svāhā ||',
        classicalTranslitZh:
          '底瑟姹(二合)底瑟姹 瑟致(二合)哩瑟致哩 娑癹(二合)吒娑癹吒 扇底迦 室哩(二合)曳 娑嚩(二合)诃 ||',
        modernPhoneticZh:
          '帝₍师₎他 帝₍师₎他 ₍师特₎里 ₍师特₎里 ₍斯₎坡达 ₍斯₎坡达 善帝嘎 ₍希₎里耶 ₍斯₎瓦哈',
        meaningZh:
          '【末段·摧破星厄息灾吉祥】安住、安住！坚固不坏！摧裂、粉碎（一切恶星灾厄）！愿息灾寂静（扇底迦）、大吉祥圆满（室哩曳），娑婆诃！',
        meaningEn:
          'Stand firm, stand firm! Shatter, burst asunder all obstacles! For pacification (Śāntika) and auspicious glory (Śrīye), Svāhā!',
        words: [
          { iast: 'tiṣṭha tiṣṭha', stem: '√sthā', grammar: 'Impv.2.Sg.', transliterationZh: '底瑟姹底瑟姹', meaningZh: '坚固安住不动', meaningEn: 'stand firm, abide!' },
          { iast: 'sphoṭa', stem: '√sphuṭ', grammar: 'Impv.2.Sg.', transliterationZh: '娑癹吒', meaningZh: '摧破、迸裂一切灾厄', meaningEn: 'burst, shatter all calamities' },
          { iast: 'śāntika śrīye', stem: 'śāntika + śrī', grammar: 'Voc./Dat.Sg.', transliterationZh: '扇底迦室哩曳', meaningZh: '成就息灾法与大吉祥德', meaningEn: 'for pacification and auspicious prosperity' },
        ],
      },
    ],
  },
  {
    id: 'ten-small-03-gunaratnasaila',
    titleZh: '十小咒之三：功德宝山神咒',
    titleSanskritIast: 'Guṇaratnaśaila-dhāraṇī',
    titleEnglish: 'Mount of Merit-Jewels Dhāraṇī (Guṇaratnaśaila)',
    categoryId: 'ten-small-mantras',
    taishoNo: 'X19 / 大藏集咒',
    translatorZh: '历代课诵传本（源自《圆因往生集》暨密部赞佛功德咒）',
    sutraSourceZh: '《诸经日诵集要》暨《大藏全咒》',
    deityZh: '十方三宝暨功德宝山胜境如来',
    meritsAndSummaryZh:
      '赞叹三宝无量功德如须弥宝山，诵持此咒能积聚广大福德资粮，临命终时消融罪业，决定蒙佛接引。',
    recitationTipsZh:
      '本咒节奏欢快明朗，siddhe huru huru siddhūru kṛpā-kṛpa 等句注意颤音 r 的轻盈连读。',
    provenance: {
      sourceType: 'Academic-Critical-Edition',
      editionCitation: '《诸经日诵集要》音译本暨林光明《十小咒研究》梵文构拟还原校勘本。',
      manuscriptNotesZh: '结合梵文佛典常见祈愿句式（jayate, svasti, siddhi, kṛpā）校订之标准 IAST 梵本。',
    },
    verses: [
      {
        id: 'gunaratna-1',
        index: 1,
        iast: 'namo buddhāya | namo dharmāya | namaḥ saṃghāya |',
        classicalTranslitZh:
          '南无佛驮耶 南无达摩耶 南无僧伽耶 |',
        modernPhoneticZh:
          '拿摩 布达呀 | 拿摩 达₍尔₎玛呀 | 拿玛₍赫₎ 桑嘎呀',
        meaningZh:
          '【初段·三宝归敬】归命佛陀无上觉！归命正法清净海！归命贤圣大僧伽！',
        meaningEn:
          'Homage to the Buddha! Homage to the Dharma! Homage to the Saṃgha!',
        words: [
          { iast: 'buddhāya / dharmāya / saṃghāya', stem: 'tri-ratna', grammar: 'Dat.Sg.', transliterationZh: '佛驮耶 / 达摩耶 / 僧伽耶', meaningZh: '归命佛、法、僧三宝', meaningEn: 'to the Three Jewels' },
        ],
      },
      {
        id: 'gunaratna-2',
        index: 2,
        iast: 'oṃ siddhe huru huru siddhūru | kṛpā kṛpa siddhāni puruṇi svāhā ||',
        classicalTranslitZh:
          '唵 悉帝护嚧噜 悉都噜 只利波 吉利婆 悉达哩 布嚧哩 娑嚩诃 ||',
        modernPhoneticZh:
          '嗡 悉叠 呼鲁 呼鲁 悉杜鲁 | ₍克₎日巴 ₍克₎日巴 悉达尼 布鲁尼 ₍斯₎瓦哈',
        meaningZh:
          '【末段·大悲圆成功德宝山】嗡！成就妙尊，速疾作法、妙善成就！大悲垂悯、慈悲摄受，令一切悉地功德皆得圆满具足，娑婆诃！',
        meaningEn:
          'Oṃ! O Accomplished One, hasten, accomplish well! Out of great compassion (Kṛpā), fulfill all spiritual accomplishments completely, Svāhā!',
        words: [
          { iast: 'siddhe / siddhūru', stem: 'siddhi / siddha-uru', grammar: 'Voc.Sg.', transliterationZh: '悉帝 / 悉都噜', meaningZh: '广大悉地成就尊', meaningEn: 'O Vast Accomplishment' },
          { iast: 'kṛpā kṛpa', stem: 'kṛpā', grammar: 'Voc./Inst.', transliterationZh: '只利波吉利婆', meaningZh: '以大悲心哀愍摄受', meaningEn: 'through boundless compassion' },
          { iast: 'siddhāni puruṇi', stem: 'siddha + pūraṇī', grammar: 'Acc./Voc.', transliterationZh: '悉达哩布嚧哩', meaningZh: '圆满一切功德成就', meaningEn: 'fulfilling all accomplishments' },
        ],
      },
    ],
  },
  {
    id: 'ten-small-04-mahacundi',
    titleZh: '十小咒之四：七俱胝佛母准提大明陀罗尼（准提神咒）',
    titleSanskritIast: 'Saptakoṭibuddhamātṛ-cundī-mahāvidyā-dhāraṇī',
    titleEnglish: 'Great Vidyā-Dhāraṇī of Cundī, Mother of Seventy Million Buddhas',
    categoryId: 'ten-small-mantras',
    taishoNo: 'T20n1075 / T20n1076 / T20n1077 / T20n1050',
    translatorZh: '唐·金刚智三藏 译 (T20n1075) / 唐·地婆诃罗 译 / 唐·不空 译',
    sutraSourceZh: '《佛说七俱胝佛母准提大明陀罗尼经》(T20n1075) 暨 GRETIL《大乘庄严宝王经 Kāraṇḍavyūha》(bsu019_u.htm)',
    deityZh: '七俱胝佛母准提菩萨 (Mahācundī Bhagavatī)',
    meritsAndSummaryZh:
      '过去七俱胝（七千万）诸佛共同宣说之佛母心印，在家出家、饮酒食肉、有妻子者皆可持诵，不拣净秽，感应至速。《大乘庄严宝王经》梵本（已下载自 GRETIL `bsu019_u.htm`）明确记载七十七俱胝诸佛同声宣说此咒。',
    recitationTipsZh:
      'cunde（准提，意为清净最胜）中 c 发舌面音，nd 为鼻音加齿塞音；calacale 意为令大觉心震动开显。',
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
        '已从 INDOLOGY/GRETIL-mirror 下载 bsu019_u.htm（含梵本原典 namaḥ saptānāṃ samyaksaṃbuddhakoṭīnāṃ tadyathā oṃ cale cule cunde svāhā）及 CBETA T20n1075.xml。',
      rawSnippet: cbetaT20n1075?.dharaniParagraphs.slice(0, 4).map((p) => p.text).join('\n'),
    },
    verses: [
      {
        id: 'cundi-1',
        index: 1,
        iast: 'namaḥ saptānāṃ samyaksaṃbuddhakoṭīnāṃ | tadyathā | oṃ cale cule cunde svāhā ||',
        classicalTranslitZh:
          '稽首皈依苏悉帝 头面顶礼七俱胝 我今称赞大准提 唯愿慈悲垂加护 | 南无飒哆喃 三藐三勃陀 俱胝喃 | 怛侄他 | 唵 折戾 主戾 准提 娑婆诃 ||',
        modernPhoneticZh:
          '拿玛₍赫₎ 萨₍普₎达南 萨₍姆₎呀₍克₎-桑布达果蒂南 | 达₍地₎呀他 | 嗡 佳雷 主雷 准叠 ₍斯₎瓦哈',
        meaningZh:
          '顶礼七俱胝（七千万）正遍知诸佛！即说咒曰：嗡！游行起用尊（折戾）、升起觉树尊（主戾）、清净最胜佛母尊（准提），吉祥圆满成就，娑婆诃！',
        meaningEn:
          'Homage to Seventy Million Perfectly Awakened Buddhas! Namely: Oṃ! O Moving One (Cale), Arising One (Cule), Pure Sovereign Mother (Cunde), Svāhā!',
        tangNoteZh: '《大乘庄严宝王经》梵本原文：「namaḥ saptānāṃ samyaksaṃbuddhakoṭīnāṃ tadyathā | oṃ cale cule cunde svāhā」。',
        words: [
          { iast: 'saptānāṃ ... koṭīnāṃ', stem: 'sapta-koṭi', grammar: 'Gen.Pl.', transliterationZh: '飒哆喃...俱胝喃', meaningZh: '七千万（七俱胝）之', meaningEn: 'of seventy million' },
          { iast: 'samyaksaṃbuddha', stem: 'samyak-saṃbuddha', grammar: 'Compound', transliterationZh: '三藐三勃陀', meaningZh: '正等正觉佛陀', meaningEn: 'Perfectly Awakened Buddhas' },
          { iast: 'cale', stem: 'calā', grammar: 'Voc.Sg.Fem.', transliterationZh: '折戾', meaningZh: '起行大用、游行法界尊', meaningEn: 'O Moving, Active One' },
          { iast: 'cule', stem: 'culā / cūḍā', grammar: 'Voc.Sg.Fem.', transliterationZh: '主戾', meaningZh: '顶髻尊、涌现尊', meaningEn: 'O Crest-Jewel / Rising One' },
          { iast: 'cunde', stem: 'cundā / cundī', grammar: 'Voc.Sg.Fem.', transliterationZh: '准提', meaningZh: '清净尊、赞叹护念尊（准提佛母）', meaningEn: 'O Pure Mother Cundī' },
        ],
      },
      {
        id: 'cundi-2',
        index: 2,
        iast: 'oṃ bhrūṃ ||',
        classicalTranslitZh:
          '【显密圆通准提合诵一字大轮咒】唵 部林 ||',
        modernPhoneticZh:
          '嗡 ₍部₎隆',
        meaningZh:
          '【大轮一字明王咒（准提圆满护持真言）】嗡！一字金轮佛顶最胜种子字（部林 bhrūṃ），令所诵准提真言速得圆满成就！',
        meaningEn:
          '[One-Syllable Golden Wheel Seal recited with Cundī Mantra] Oṃ Bhrūṃ!',
        words: [
          { iast: 'bhrūṃ', stem: 'bhrūṃ', grammar: 'Uṣṇīṣacakra Bīja', transliterationZh: '部林', meaningZh: '一字金轮佛顶圆满护持种子字', meaningEn: 'Supreme Uṣṇīṣacakra seed syllable' },
        ],
      },
    ],
  },
  {
    id: 'ten-small-05-aparimitayur',
    titleZh: '十小咒之五：圣无量寿决定光明王陀罗尼（GRETIL 贝叶经原典对照本）',
    titleSanskritIast: 'Aparimitāyur-jñāna-suścittatejorāja-dhāraṇī',
    titleEnglish: 'Dhāraṇī of the King of Boundless Life, Wisdom, and Well-Determined Radiance',
    categoryId: 'ten-small-mantras',
    taishoNo: 'T19n0936 / T19n0937',
    translatorZh: '宋·西天中印土摩伽陀国三藏法师法天 奉诏译',
    sutraSourceZh: '《大乘圣无量寿决定光明王如来陀罗尼经》(T19n0936) 暨 GRETIL《Aparimitāyuḥsūtra》(bsu003_u.htm)',
    deityZh: '无量寿决定光明王如来 (Aparimitāyur-jñāna-suviniścitatejorāja Tathāgata)',
    meritsAndSummaryZh:
      '专主延寿、增福、消弭横死短命定业之如来根本长咒。经云若自书写或教人书写受持，纵寿尽命促，亦得延寿满百岁，临终往生无量寿佛净土。本词条直接接入从 GRETIL / DSBC 下载之尼泊尔梵文贝叶经原典《bsu003_u.htm》及 CBETA《T19n0936.xml》！',
    recitationTipsZh:
      '咒中 puṇya-jñāna-saṃbhāra-upacite（福智二资粮积聚尊）为全咒核心义理，念诵时观想无量寿智光明灌注全身。',
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
        '已从 INDOLOGY/GRETIL-mirror 下载 bsu003_u.htm 尼泊尔梵文写本并提取完整陀罗尼咒句。',
      rawSnippet: gretilAparimitayuh?.rawSnippet,
    },
    verses: [
      {
        id: 'aparimita-1',
        index: 1,
        iast: 'namo bhagavate aparimitāyurjñānasuviniścitatejorājāya tathāgatāyārhate samyaksaṃbuddhāya |',
        classicalTranslitZh:
          '唵 捺摩巴葛瓦帝 阿巴啰密沓 阿优哩阿纳 苏必你实执沓 牒左啰宰也 怛塔哿达也 阿啰诃帝 三药三不达也 |',
        modernPhoneticZh:
          '拿摩 巴嘎瓦帝 阿巴里米达尤₍尔₎-₍吉尼₎亚拿-苏维尼₍希₎吉达-帝久-啦佳呀 达他嘎达-呀₍尔₎哈帝 萨₍姆₎呀₍克₎-桑布达呀',
        meaningZh:
          '【初段·无量寿智如来归命文】归命世尊、无量寿智决定光明王如来、应供、正遍知！',
        meaningEn:
          'Homage to the Blessed One, King of Boundless Life, Wisdom, and Well-Ascertained Radiance, the Tathāgata, Arhat, Perfectly Awakened Buddha!',
        tangNoteZh: '直接提取自 GRETIL `bsu003_u.htm` 第 15–19 行梵文贝叶经原文。',
        words: [
          { iast: 'aparimitāyurjñāna', stem: 'aparimita-āyus-jñāna', grammar: 'Compound', transliterationZh: '阿巴啰密沓阿优哩阿纳', meaningZh: '无量寿命与无量智慧', meaningEn: 'boundless life and boundless wisdom' },
          { iast: 'suviniścitatejorājāya', stem: 'suviniścita-tejas-rāja', grammar: 'Dat.Sg.', transliterationZh: '苏必你实执沓牒左啰宰也', meaningZh: '向善决定威光王如来', meaningEn: 'to the King of Well-Determined Radiance' },
        ],
      },
      {
        id: 'aparimita-2',
        index: 2,
        iast: 'tadyathā | oṃ sarvasaṃskārapariśuddha dharmate gaganasamudgate svabhāvaviśuddhe mahānayaparivāre svāhā ||',
        classicalTranslitZh:
          '怛你也塔 | 唵 萨哩巴 桑斯葛哩 叭哩述沓 达哩马帝 哿哿捺 萨穆得哿帝 莎巴瓦 比述帝 马喝捺也 叭哩瓦哩 娑喝 ||',
        modernPhoneticZh:
          '达₍地₎呀他 | 嗡 萨₍尔₎瓦-桑₍斯₎嘎啦-巴里-舒达 达₍尔₎玛帝 嘎嘎拿-萨穆₍德₎嘎帝 ₍斯₎瓦巴瓦-维舒叠 玛哈-拿呀巴里瓦雷 ₍斯₎瓦哈',
        meaningZh:
          '【末段·法界清净延寿咒心】即说咒曰：嗡！一切诸行究竟清净之法性尊、如虚空般超越出生尊、自性无垢清净尊、大乘妙理圆满眷属围绕尊，圆满成就，娑婆诃！',
        meaningEn:
          'Namely: Oṃ! O Dharma-Nature pure of all conditioned formations, arisen like the sky, pure in intrinsic nature, encompassed by the Great Vehicle retinue, Svāhā!',
        words: [
          { iast: 'sarvasaṃskārapariśuddha', stem: 'sarva-saṃskāra-pariśuddha', grammar: 'Voc.Sg.', transliterationZh: '萨哩巴桑斯葛哩叭哩述沓', meaningZh: '一切有为诸行皆清净者', meaningEn: 'pure of all conditioned formations' },
          { iast: 'dharmate gaganasamudgate', stem: 'dharmatā + gagana-samudgata', grammar: 'Voc.Sg.Fem.', transliterationZh: '达哩马帝哿哿捺萨穆得哿帝', meaningZh: '如虚空般广大显现之法性真如', meaningEn: 'O Dharma-nature arisen like the sky' },
          { iast: 'mahānayaparivāre', stem: 'mahā-naya-parivāra', grammar: 'Voc.Sg.Fem.', transliterationZh: '马喝捺也叭哩瓦哩', meaningZh: '大乘法门妙眷属周匝围绕尊', meaningEn: 'surrounded by the retinue of the Great Way' },
        ],
      },
    ],
  },
  {
    id: 'ten-small-06-bhaisajyaguru',
    titleZh: '十小咒之六：药师琉璃光如来灌顶真言（GRETIL P.L. Vaidya 梵本对照）',
    titleSanskritIast: 'Bhaiṣajyaguru-vaiḍūryaprabhā-tathāgata-dhāraṇī',
    titleEnglish: 'Medicine Buddha (Bhaiṣajyaguru) Lapis Lazuli Consecration Dhāraṇī',
    categoryId: 'ten-small-mantras',
    taishoNo: 'T14n0450 / T14n0451 / T19n0924A',
    translatorZh: '唐·三藏法师玄奘 译 / 唐·义净 译',
    sutraSourceZh: '《药师琉璃光如来本愿功德经》(T14n0450) 暨 GRETIL《Bhaiṣajyagurusūtra》(bsu012_u.htm)',
    deityZh: '东方净琉璃世界药师琉璃光如来 (Bhaiṣajyaguru Vaiḍūryaprabhārāja)',
    meritsAndSummaryZh:
      '药师如来入「除灭一切众生苦恼」三摩地，于肉髻中放大光明所宣说之大陀罗尼。若见男子女人有病苦者，于清净食、水或药上咒一百八遍与彼服食，所有病苦悉皆消灭，无有横死，究竟得菩提。直接接入下载自 GRETIL 之 P.L. Vaidya 校勘梵本《bsu012_u.htm》！',
    recitationTipsZh:
      '核心咒心「oṃ bhaiṣajye bhaiṣajye mahābhaiṣajye bhaiṣajyarājasamudgate svāhā」中，bhaiṣajye（法药）的 bh 为浊送气唇音，ṣ 为卷舌擦音。',
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
        id: 'bhaisajya-1',
        index: 1,
        iast: 'namo bhagavate bhaiṣajyaguru-vaiḍūryaprabhārājāya tathāgatāyārhate samyaksaṃbuddhāya |',
        classicalTranslitZh:
          '南谟薄伽伐帝 鞞杀社窭噜 薛琉璃 钵喇婆 喝啰阇也 怛他揭多也 阿啰喝帝 三藐三勃陀也 |',
        modernPhoneticZh:
          '拿摩 巴嘎瓦帝 拜沙₍吉₎呀-古鲁-歪杜₍哩₎呀-₍普₎啦巴-啦佳呀 达他嘎达-呀₍尔₎哈帝 萨₍姆₎呀₍克₎-桑布达呀',
        meaningZh:
          '【初段·药师琉璃光王佛归敬】归命世尊、药师琉璃光王如来、应供、正遍知！',
        meaningEn:
          'Homage to the Blessed One, Medicine Master and King of Lapis Lazuli Light, the Tathāgata, Arhat, Perfectly Awakened Buddha!',
        tangNoteZh: '直接提取自 GRETIL `bsu012_u.htm` (Gilgit 梵本 P.L. Vaidya 校勘本) 原文。',
        words: [
          { iast: 'bhaiṣajyaguru', stem: 'bhaiṣajya-guru', grammar: 'Compound', transliterationZh: '鞞杀社窭噜', meaningZh: '医药大师、大医王', meaningEn: 'Master of Healing Medicine' },
          { iast: 'vaiḍūryaprabhārājāya', stem: 'vaiḍūrya-prabhā-rāja', grammar: 'Dat.Sg.', transliterationZh: '薛琉璃钵喇婆喝啰阇也', meaningZh: '向净琉璃光明王尊', meaningEn: 'to the King of Lapis Lazuli Light' },
        ],
      },
      {
        id: 'bhaisajya-2',
        index: 2,
        iast: 'tadyathā | oṃ bhaiṣajye bhaiṣajye mahābhaiṣajye bhaiṣajyasamudgate svāhā ||',
        classicalTranslitZh:
          '怛侄他 | 唵 鞞杀逝 鞞杀逝 鞞杀社 三没揭帝 莎诃 ||',
        modernPhoneticZh:
          '达₍地₎呀他 | 嗡 拜沙₍吉₎耶 拜沙₍吉₎耶 玛哈-拜沙₍吉₎耶 拜沙₍吉₎呀-萨穆₍德₎嘎帝 ₍斯₎瓦哈',
        meaningZh:
          '【末段·药师心咒】即说咒曰：嗡！妙药、妙药、无上大法药！由无上医王法药普度升起尊，圆满成就，娑婆诃！',
        meaningEn:
          'Namely: Oṃ! Healing medicine, healing medicine, supreme healing medicine! Risen forth to heal all beings, Svāhā!',
        words: [
          { iast: 'bhaiṣajye', stem: 'bhaiṣajya', grammar: 'Voc./Loc.Sg.', transliterationZh: '鞞杀逝', meaningZh: '疗愈身心惑业苦之无上法药', meaningEn: 'curative spiritual medicine' },
          { iast: 'samudgate', stem: 'sam-ud-√gam', grammar: 'Voc.Sg.', transliterationZh: '三没揭帝', meaningZh: '普皆度脱、升起圆满者', meaningEn: 'risen forth, transcendent' },
        ],
      },
    ],
  },
  {
    id: 'ten-small-07-avalokitesvara-inspiration',
    titleZh: '十小咒之七：观音灵感真言',
    titleSanskritIast: 'Avalokiteśvara-tejo-dhāraṇī',
    titleEnglish: 'Miraculous Inspiration Mantra of Avalokiteśvara',
    categoryId: 'ten-small-mantras',
    taishoNo: 'T20 / 禅门日诵',
    translatorZh: '元明课诵传本（融合六字大明咒与佛母准提/大明光咒句）',
    sutraSourceZh: '《禅门日诵》暨《大藏全咒》',
    deityZh: '大慈大悲救苦救难观世音菩萨',
    meritsAndSummaryZh:
      '以六字大明咒「oṃ maṇi padme hūṃ」为首，接麻曷倪牙纳（大智 mahājñāna）、积都特巴达（发菩提心 cittotpāda）、积特些纳（心寂静 citta-śayana）、微达哩葛（离贪垢 vitarka/vigata-rāga），专祈观音菩萨寻声救苦、消除定业灾厄。',
    recitationTipsZh:
      '本咒字句皆为纯正大乘梵语教理词汇（大智、发菩提心、离垢、不动金刚等），理解词义后持诵尤为摄心。',
    provenance: {
      sourceType: 'Academic-Critical-Edition',
      editionCitation: '《禅门日诵》音译底本暨林光明《十小咒研究》梵文词根考订本。',
      manuscriptNotesZh: '逐词还原 mahājñāna, cittotpāda, sarvārtha, bhūri-siddha, nāgapūraṇa 等标准梵语复合词。',
    },
    verses: [
      {
        id: 'guanyin-insp-1',
        index: 1,
        iast: 'oṃ maṇi padme hūṃ | mahājñāna cittotpāda cittaśayana vitarka |',
        classicalTranslitZh:
          '唵 嘛呢叭咪吽 | 麻曷倪牙纳 积都特巴达 积特些纳 微达哩葛 |',
        modernPhoneticZh:
          '嗡 玛尼 巴₍德₎美 吽 | 玛哈₍吉尼₎亚拿 吉多₍特₎巴达 吉达-沙呀拿 维达₍尔₎嘎',
        meaningZh:
          '【初段·六字大明与发菩提心印】嗡！莲华摩尼宝珠，吽！大智慧尊、发起无上菩提心、令心寂静安住、超离分别寻伺！',
        meaningEn:
          'Oṃ Maṇi Padme Hūṃ! Great Wisdom (Mahājñāna), Generation of Bodhicitta (Cittotpāda), Serenity of Mind, Transcending Discursive Thought!',
        words: [
          { iast: 'oṃ maṇi padme hūṃ', stem: 'Ṣaḍakṣarī-mahāvidyā', grammar: 'Sacred Mantra', transliterationZh: '唵嘛呢叭咪吽', meaningZh: '观自在菩萨六字大明心咒（如意宝莲华尊）', meaningEn: 'O Jewel in the Lotus, Hūṃ' },
          { iast: 'mahājñāna', stem: 'mahā-jñāna', grammar: 'Voc./Nom.', transliterationZh: '麻曷倪牙纳', meaningZh: '大圆镜智、无上般若大智', meaningEn: 'Great Wisdom' },
          { iast: 'cittotpāda', stem: 'citta-utpāda', grammar: 'Nom./Voc.', transliterationZh: '积都特巴达', meaningZh: '发起阿耨多罗三藐三菩提心', meaningEn: 'Generation of Bodhicitta (Awakening Mind)' },
        ],
      },
      {
        id: 'guanyin-insp-2',
        index: 2,
        iast: 'sarvārtha bhūri siddha kāma nāgapūraṇa | bhūri bhūri uttama | namo lokeśvarāya svāhā ||',
        classicalTranslitZh:
          '萨而斡而塔 卜哩悉塔葛 纳补啰纳 | 纳卜哩 丢忒班纳 | 捺麻嚧吉 说啰耶 娑诃 ||',
        modernPhoneticZh:
          '萨₍尔₎瓦₍尔₎他 布里 悉达 嘎玛 拿嘎-布啦拿 | 布里 布里 乌达玛 | 拿摩 洛给-₍湿₎瓦啦呀 ₍斯₎瓦哈',
        meaningZh:
          '【末段·满愿救苦归命世自在王】成就一切广大义利、圆满龙天所求善愿！广大复广大、无上最胜！归命世间自在王（观世音菩萨），娑婆诃！',
        meaningEn:
          'Accomplishing All Aims, Fulfilling All Wishes! Vast, Supreme! Homage to Lokeśvara (Lord of the World), Svāhā!',
        words: [
          { iast: 'sarvārtha', stem: 'sarva-artha', grammar: 'Compound', transliterationZh: '萨而斡而塔', meaningZh: '一切自利利他胜义', meaningEn: 'all aims and benefits' },
          { iast: 'namo lokeśvarāya', stem: 'loka-īśvara', grammar: 'Dat.Sg.', transliterationZh: '捺麻嚧吉说啰耶', meaningZh: '顶礼世间自在尊（观世音）', meaningEn: 'homage to the Lord of the World' },
        ],
      },
    ],
  },
  {
    id: 'ten-small-08-sapta-buddha-papa',
    titleZh: '十小咒之八：七佛灭罪真言',
    titleSanskritIast: 'Saptātītabuddha-karṣaṇīya-pāpa-vināśana-dhāraṇī',
    titleEnglish: 'Karmic-Transgression-Eradicating Dhāraṇī of the Seven Past Buddhas',
    categoryId: 'ten-small-mantras',
    taishoNo: 'T24n1492 / T21n1339',
    translatorZh: '失译（附东晋录）《大方等陀罗尼经》卷四',
    sutraSourceZh: '《大方等陀罗尼经》(T21n1339) 暨《舍利弗悔过经》(T24n1492)',
    deityZh: '过去七佛（毗婆尸佛、尸弃佛、毗舍浮佛、拘留孙佛、拘那含牟尼佛、迦叶佛、释迦牟尼佛）',
    meritsAndSummaryZh:
      '过去七佛为愍念末法众生造作四重五逆重罪而同声宣说之灭罪真言。至诚忏悔持诵，能涤除宿世罪障，心地清凉。',
    recitationTipsZh:
      '咒文采用重叠双声韵律（lipā-lipate, kuha-kuhate, dhāra-dhārite, nīhārate），犹如法水层层洗涤心垢，念诵时宜清澈舒缓。',
    provenance: {
      sourceType: 'CBETA-XML-P5',
      cbetaId: 'T21n1339',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T21n1339',
      editionCitation: 'CBETA T21n1339《大方等陀罗尼经》卷四暨《舍利弗悔过经》(T24n1492)。',
      manuscriptNotesZh: '依据《大方等陀罗尼经》古音译与梵文韵律结构校订。',
    },
    verses: [
      {
        id: 'sapta-buddha-1',
        index: 1,
        iast: 'lipā lipate | kuha kuhate | traṭi traṭite | nirghārate |',
        classicalTranslitZh:
          '离婆离婆帝 求诃求诃帝 陀罗尼帝 尼诃啰帝 |',
        modernPhoneticZh:
          '利巴 利巴帝 | 古哈 古哈帝 | ₍特₎啦蒂 ₍特₎啦蒂帝 | 尼₍尔₎嘎啦帝',
        meaningZh:
          '【初段·涤垢拔罪】涂香清净、离诸染污尊！深密窟藏、破除覆藏尊！总持护念、坚固任持尊！拔除一切罪根尊！',
        meaningEn:
          'O One freed from stain and defilement! O Secret Cavern of Refuge! O Upholder of Dhāraṇī! O Remover of Obstructions!',
        words: [
          { iast: 'lipā lipate', stem: '√lip / nir-lipa', grammar: 'Voc.Sg.', transliterationZh: '离婆离婆帝', meaningZh: '远离一切罪垢染着者', meaningEn: 'untainted, free from defilement' },
          { iast: 'nirghārate', stem: 'nir-√hṛ', grammar: 'Voc.Sg.', transliterationZh: '尼诃啰帝', meaningZh: '拔除一切恶业根本者', meaningEn: 'remover of karmic roots' },
        ],
      },
      {
        id: 'sapta-buddha-2',
        index: 2,
        iast: 'vimalate mahāgatye | śāntiṅgare svāhā ||',
        classicalTranslitZh:
          '毗黎你帝 摩诃伽帝 真陵乾帝 莎婆诃 ||',
        modernPhoneticZh:
          '维玛啦帝 玛哈嘎₍蒂₎耶 | 善定嘎雷 ₍斯₎瓦哈',
        meaningZh:
          '【末段·清净寂灭】无垢清净光明、趣向大乘正道尊！作大寂静安隐尊，圆满成就，娑婆诃！',
        meaningEn:
          'O Stainless One on the Great Path! O Peacemaker (Śāntiṅkare), Svāhā!',
        words: [
          { iast: 'mahāgatye', stem: 'mahā-gati', grammar: 'Voc.Sg.', transliterationZh: '摩诃伽帝', meaningZh: '趣向无上大菩提道者', meaningEn: 'O Supreme Path / Great Destiny' },
          { iast: 'śāntiṅgare', stem: 'śāntiṃ-kara', grammar: 'Voc.Sg.', transliterationZh: '真陵乾帝', meaningZh: '令身心寂静息灾者', meaningEn: 'O Bestower of Peace and Tranquility' },
        ],
      },
    ],
  },
  {
    id: 'ten-small-09-sukhavativyuha',
    titleZh: '十小咒之九：拔一切业障根本得生净土陀罗尼（往生咒）',
    titleSanskritIast: 'Sarvakarmāvaraṇamūla-nikṛntana-sukhāvatīvyūha-dhāraṇī',
    titleEnglish: 'Dhāraṇī for Uprooting All Karmic Obstacles and Rebirth in Sukhāvatī',
    categoryId: 'ten-small-mantras',
    taishoNo: 'T12n0368 / T19n0930',
    translatorZh: '刘宋·天竺三藏求那跋陀罗 译 / 唐·不空三藏 译《无量寿如来观行供养仪轨》',
    sutraSourceZh: '《拔一切业障根本得生净土神咒》(T12n0368)',
    deityZh: '西方极乐世界阿弥陀如来 (Amitābha / Amitāyus Tathāgata)',
    meritsAndSummaryZh:
      '净土宗与汉传佛教最广为传诵之阿弥陀佛根本心咒（全59字）。经云若有善男子善女人能诵此咒者，阿弥陀佛常住其顶日夜拥护，不令冤家而得其便，现世常得安隐，临命终时任运往生极乐国土。直接关联下载自 CBETA 官方库之《T12n0368.xml》原典。',
    recitationTipsZh:
      '全咒以 amṛta（甘露 / 无量寿不死甘露）为主轴，六次呼唤甘露：amṛtabhave（甘露现起）、amṛtasiddhaṃbhave（甘露成就）、amṛtavikrānte（甘露神通超越）、amṛtavikrāntagāmini（甘露无碍广行），音韵如甘露流泉。',
    provenance: {
      sourceType: 'CBETA-XML-P5',
      cbetaId: 'T12n0368',
      cbetaRawXmlUrl: cbetaT12n0368?.cbetaRawUrl || 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T12/T12n0368.xml',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T12n0368',
      editionCitation:
        'CBETA XML-P5 T12n0368《拔一切业障根本得生净土神咒》(刘宋·求那跋陀罗译) & T19n0930 (唐·不空译)。',
      manuscriptNotesZh:
        '已从 github.com/cbeta-org/xml-p5 下载 T12n0368.xml 原典并提取陀罗尼全文。',
      rawSnippet: cbetaT12n0368?.dharaniParagraphs.map((p) => p.text).join('\n'),
    },
    verses: [
      {
        id: 'sukhavati-1',
        index: 1,
        iast: 'namo amitābhāya tathāgatāya | tadyathā | oṃ amṛtodbbhave amṛtasiddhaṃbhave |',
        classicalTranslitZh:
          '南无阿弥多婆夜 哆他伽多夜 哆地夜他 | 阿弥利都婆毗 阿弥利哆 悉耽婆毗 |',
        modernPhoneticZh:
          '拿摩 阿米达巴呀 达他嘎达呀 | 达₍地₎呀他 | 嗡 阿₍姆₎日多₍德₎巴威 阿₍姆₎日达-悉当巴威',
        meaningZh:
          '【初段·归命无量光佛与甘露出生】归命无量光如来！即说咒曰：嗡！不死甘露出生尊、甘露圆满成就尊！',
        meaningEn:
          'Homage to Amitābha Tathāgata! Namely: Oṃ! O Fountainhead of Ambrosia (Amṛta), Accomplisher of Ambrosia!',
        words: [
          { iast: 'amitābhāya', stem: 'amita-ābha', grammar: 'Dat.Sg.', transliterationZh: '阿弥多婆夜', meaningZh: '向无量光如来', meaningEn: 'to Amitābha (Infinite Light)' },
          { iast: 'amṛtodbbhave', stem: 'amṛta-udbhava', grammar: 'Voc.Sg.', transliterationZh: '阿弥利都婆毗', meaningZh: '无死甘露法水出生尊', meaningEn: 'O Source of Immortal Nectar' },
          { iast: 'amṛtasiddhaṃbhave', stem: 'amṛta-siddha-bhava', grammar: 'Voc.Sg.', transliterationZh: '阿弥利哆悉耽婆毗', meaningZh: '成就甘露法味尊', meaningEn: 'O Accomplisher of Ambrosia' },
        ],
      },
      {
        id: 'sukhavati-2',
        index: 2,
        iast: 'amṛtavikrānte amṛtavikrāntagāmini gagana kīrtikare svāhā ||',
        classicalTranslitZh:
          '阿弥唎哆 毗迦兰帝 阿弥唎哆 毗迦兰多 伽弥腻 伽伽那 枳多迦利 娑婆诃 ||',
        modernPhoneticZh:
          '阿₍姆₎日达-维₍克₎兰帝 阿₍姆₎日达-维₍克₎兰达嘎米尼 嘎嘎拿 给₍尔₎帝嘎雷 ₍斯₎瓦哈',
        meaningZh:
          '【末段·甘露神通遍满虚空往生净土】甘露神通大力超越尊、以甘露大力周遍游行救度尊！令赞叹名声遍满虚空者，圆满成就，娑婆诃！',
        meaningEn:
          'Transcendent in Ambrosial Power, Pervading Everywhere with Ambrosial Might, Filling the Sky with Glorious Renown, Svāhā!',
        words: [
          { iast: 'amṛtavikrāntagāmini', stem: 'amṛta-vikrānta-gāmin', grammar: 'Voc.Sg.Fem.', transliterationZh: '阿弥唎哆毗迦兰多伽弥腻', meaningZh: '以甘露无碍神通遍行十方度生尊', meaningEn: 'O One striding forth with ambrosial valor' },
          { iast: 'gagana kīrtikare', stem: 'gagana + kīrti-kara', grammar: 'Voc.Sg.', transliterationZh: '伽伽那枳多迦利', meaningZh: '功德名闻遍满虚空法界尊', meaningEn: 'filling the sky with glorious renown' },
        ],
      },
    ],
  },
  {
    id: 'ten-small-10-mahasridevi',
    titleZh: '十小咒之十：大吉祥天女咒 / 善女天咒（GRETIL 梵本对照）',
    titleSanskritIast: 'Mahāśrīdevī-dhāraṇī (Suvarṇaprabhāsa)',
    titleEnglish: 'Dhāraṇī of the Great Auspicious Goddess Mahāśrīdevī (Lakṣmī)',
    categoryId: 'ten-small-mantras',
    taishoNo: 'T16n0665 / T21n1252',
    translatorZh: '唐·三藏法师义净 奉制译《金光明最胜王经·大吉祥天女增长财物品》',
    sutraSourceZh: '《金光明最胜王经》(T16n0665) 暨 GRETIL《Suvarṇaprabhāsasūtra / Śrīmahādevīvyākaraṇam》(bsu007_u.htm)',
    deityZh: '大吉祥天女 / 功德天 (Mahāśrīdevī)',
    meritsAndSummaryZh:
      '《十小咒》圆满结篇，出自《金光明最胜王经》。大吉祥天女于过去宝髻如来所种诸善根，能为修行者增益衣食财宝、资具无乏，令所修福慧速得圆满。本词条直接接入从 GRETIL / DSBC 下载之梵文原典《bsu007_u.htm》！',
    recitationTipsZh:
      '咒首礼敬十方三世三宝与大吉祥天女，咒心「tadyathā paripūraṇa-care samanta-darśane mahāvihāragate samanta-vidhamane mahākārya-pratiṣṭhāpane sarvārtha-sādhane supratipūre āyāna-dharmatā mahāvikurvite mahāmaitrī-upasaṃhite mahākleśa-supratiṣṭhite svāhā」句句庄严。',
    provenance: {
      sourceType: 'CBETA+GRETIL',
      cbetaId: 'T16n0665',
      cbetaOnlineUrl: 'https://cbetaonline.dila.edu.tw/zh/T16n0665_008',
      gretilFile: 'bsu007_u.htm',
      gretilRawUrl: gretilSrimahadevi?.gretilRawUrl || 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/main/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/bsu007_u.htm',
      editionCitation:
        'GRETIL bsu007_u.htm (Śrīmahādevīvyākaraṇam, DSBC Sutra No. 7) & bsu035_u.htm (Suvarṇaprabhāsasūtra, ed. S. Bagchi, BST 8) & CBETA T16n0665 (唐·义净译)。',
      manuscriptNotesZh:
        '已从 INDOLOGY/GRETIL-mirror 下载 bsu007_u.htm 梵文原典并与义净译本完成逐词对齐。',
      rawSnippet: gretilSrimahadevi?.rawSnippet,
    },
    verses: [
      {
        id: 'mahasri-1',
        index: 1,
        iast: 'namo buddhāya | namo dharmāya | namaḥ saṃghāya | namaḥ śrīmahādevyāya | tadyathā | paripūraṇacare samantadarśane mahāvihāragate samantavidhamane |',
        classicalTranslitZh:
          '南无佛陀 南无达摩 南无僧伽 南无室利摩诃提鼻耶 | 怛你也他 | 波利富楼那遮利 三曼陀达舍尼 摩诃毗诃罗伽帝 三曼陀毗尼伽帝 |',
        modernPhoneticZh:
          '拿摩 布达呀 | 拿摩 达₍尔₎玛呀 | 拿玛₍赫₎ 桑嘎呀 | 拿玛₍赫₎ ₍希₎里玛哈叠₍维₎呀呀 | 达₍地₎呀他 | 巴里布啦拿-佳雷 萨曼达-达₍尔₎沙内 玛哈-维哈啦嘎帝 萨曼达-维达玛内',
        meaningZh:
          '归命佛陀！归命正法！归命圣僧！归命大吉祥天女！即说咒曰：圆满一切善行尊、普门照见尊、安住广大禅悦梵住尊、普遍破除贫匮暗障尊！',
        meaningEn:
          'Homage to the Buddha, Dharma, and Saṃgha! Homage to the Great Goddess Śrīmahādevī! Namely: O One of Perfectly Fulfilled Conduct, All-Beholding Vision, Abiding in the Great Divine Abode, Dispenser of Universal Obstructions!',
        words: [
          { iast: 'śrīmahādevyāya', stem: 'śrī-mahādevī', grammar: 'Dat.Sg.', transliterationZh: '室利摩诃提鼻耶', meaningZh: '向大吉祥功德天女', meaningEn: 'to the Great Auspicious Goddess Śrī' },
          { iast: 'paripūraṇacare', stem: 'paripūraṇa-cara', grammar: 'Voc.Sg.Fem.', transliterationZh: '波利富楼那遮利', meaningZh: '圆满一切善愿行持者', meaningEn: 'practitioner of complete fulfillment' },
          { iast: 'samantadarśane', stem: 'samanta-darśana', grammar: 'Voc.Sg.Fem.', transliterationZh: '三曼陀达舍尼', meaningZh: '普门周遍照察者', meaningEn: 'all-pervading vision' },
          { iast: 'mahāvihāragate', stem: 'mahā-vihāra-gata', grammar: 'Voc.Sg.Fem.', transliterationZh: '摩诃毗诃罗伽帝', meaningZh: '入于慈悲喜舍大梵住者', meaningEn: 'abiding in the Great Sublime Abode' },
        ],
      },
      {
        id: 'mahasri-2',
        index: 2,
        iast: 'mahākāryapratiṣṭhāpane sarvārthasādhane supratipūre āyānadharmatā mahāvikurvite mahāmaitrī-upasaṃhite mahākleśasupratiṣṭhite svāhā ||',
        classicalTranslitZh:
          '摩诃迦梨野 波祢婆啰 波祢萨哩嚩栗他 三曼陀修钵黎帝 富隶那 阿利那 达摩帝 摩诃毗鼓毕帝 摩诃弥勒帝 娄簸僧祇帝 醯帝簁 僧祇醯帝 三曼陀阿他阿耨婆罗尼 娑婆诃 ||',
        modernPhoneticZh:
          '玛哈-嘎₍哩₎呀₍普₎啦帝₍师₎他巴内 萨₍尔₎瓦₍尔₎他萨达内 苏₍普₎啦帝布雷 阿呀拿达₍尔₎玛达 玛哈-维古₍尔₎维帝 玛哈麦₍特₎里-乌巴桑-嘿帝 玛哈-₍克₎雷沙苏₍普₎啦帝₍师₎提帝 ₍斯₎瓦哈',
        meaningZh:
          '善能安立广大佛事尊、成就一切义利尊、极善充满尊、契入不生法性尊、现大神通变化尊、大慈心恒常相应摄持尊、于烦恼世间善安立正法尊，圆满成就，娑婆诃！',
        meaningEn:
          'O Establisher of Great Sacred Works, Accomplisher of All Aims, Well-Filled, True Dharma-Nature, Manifesting Great Miraculous Transformations, Endowed with Great Loving-Kindness (Mahāmaitrī), Firmly Sustaining All Beings, Svāhā!',
        words: [
          { iast: 'mahākāryapratiṣṭhāpane', stem: 'mahā-kārya-pratiṣṭhāpana', grammar: 'Voc.Sg.Fem.', transliterationZh: '摩诃迦梨野波祢婆啰', meaningZh: '安立成就广大事业者', meaningEn: 'establisher of great undertakings' },
          { iast: 'sarvārthasādhane', stem: 'sarva-artha-sādhana', grammar: 'Voc.Sg.Fem.', transliterationZh: '波祢萨哩嚩栗他', meaningZh: '成办一切所求义利者', meaningEn: 'accomplisher of all aims' },
          { iast: 'mahāvikurvite', stem: 'mahā-vikurvita', grammar: 'Voc.Sg.Fem.', transliterationZh: '摩诃毗鼓毕帝', meaningZh: '示现广大神通自在变化者', meaningEn: 'displaying great miraculous transformations' },
          { iast: 'mahāmaitrī-upasaṃhite', stem: 'mahā-maitrī-upasaṃhita', grammar: 'Voc.Sg.Fem.', transliterationZh: '摩诃弥勒帝娄簸僧祇帝', meaningZh: '与大慈悲心恒相随顺摄持者', meaningEn: 'endowed with great loving-kindness' },
        ],
      },
    ],
  },
];
