/**
 * src/data/corpus/buddhas-bodhisattvas.ts
 * 12 Core Prajñāpāramitā, Buddha, Bodhisattva, Vidyārāja & Pañcarakṣā Dhāraṇīs
 * + 12 Primary Esoteric Seed Syllables (CURATED_SEED_SYLLABLES)
 */

import type { DharaniItem, DharaniVerse, WordGloss, SeedSyllable } from '../../types/dharani';
import {
  iastToSlp1,
  slp1ToDevanagari,
  slp1ToSiddhamUnicode,
  iastToIpa
} from '../../core/transliterator';
import { analyzeSanskritLine } from '../../core/prosody';

function makeWord(
  sanskrit: string,
  tangPhonetic: string,
  meaningZh: string,
  meaningEn: string,
  rootOrStem?: string,
  grammar?: string,
  tangInlineNote?: string
): WordGloss {
  const slp = iastToSlp1(sanskrit, 'strict');
  return {
    sanskrit,
    devanagari: slp1ToDevanagari(slp),
    siddham: slp1ToSiddhamUnicode(slp),
    rootOrStem,
    grammar,
    tangPhonetic,
    meaningZh,
    meaningEn,
    ...(tangInlineNote ? { tangInlineNote } : {})
  };
}

function makeVerse(
  verseNumber: number,
  sectionTitle: string,
  iast: string,
  tangChinese: string,
  meaningZh: string,
  meaningEn: string,
  tangPhoneticNotes: string[],
  words: WordGloss[]
): DharaniVerse {
  const slp = iastToSlp1(iast, 'strict');
  const analysis = analyzeSanskritLine(iast, { mode: 'strict', longMarkSymbol: '～' });
  const modernApprox = analysis.words.map((w) => w.wordModernPhonetic).join(' ');
  return {
    verseNumber,
    sectionTitle,
    iast,
    devanagari: slp1ToDevanagari(slp),
    siddham: slp1ToSiddhamUnicode(slp),
    ipa: iastToIpa(iast),
    tangChinese,
    modernApprox,
    meaningZh,
    meaningEn,
    tangPhoneticNotes,
    words
  };
}

export const BUDDHAS_BODHISATTVAS_DHARANIS: DharaniItem[] = [
  {
    id: 'prajnaparamita-hrdaya-mantra',
    titleZh: '般若波羅蜜多心經大神咒',
    shortTitleZh: '般若心咒',
    titleSanskrit: 'Prajñāpāramitā-hṛdaya-dhāraṇī',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Prajñāpāramitā-hṛdaya-dhāraṇī', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Prajñāpāramitā-hṛdaya-dhāraṇī', 'strict')),
    titleTibetan: 'ཤེས་རབ་ཀྱི་ཕ་རོལ་ཏུ་ཕྱིན་པའི་སྙིང་པོའི་སྔགས།',
    titleEn: 'Heart of Perfection of Wisdom (Prajñāpāramitā-Hṛdaya) Mantra',
    category: 'buddhas-bodhisattvas',
    deity: '般若佛母・觀自在菩薩 (Prajñāpāramitā Bhagavatī & Avalokiteśvara)',
    taishoId: 'T08n0251',
    translator: '唐・玄奘三藏 (Xuanzang) / 不空三藏 (Amoghavajra) 譯',
    period: '唐貞觀廿三年 (649 CE)',
    summaryZh:
      '大乘佛教三藏十二部經之精髓，被尊為「大神咒、大明咒、無上咒、無等等咒」。梵本完存於日本法隆寺貝葉寫本、GRETIL (prajnhsu.htm) 及奧斯陸大學 Bibliotheca Polyglotta 十六本對勘庫 (vid=1175)。',
    ritualBenefits:
      '能除一切苦，真實不虛，頓超生死輪迴彼岸，速證阿耨多羅三藐三菩提。',
    cbetaInterlinearXmlId: 'T08n0251',
    gretilRecordId: 'gretil-prajnhsu',
    verses: [
      makeVerse(
        1,
        '般若波羅蜜多根本真言',
        'tadyathā oṃ gate gate pāragate pārasaṃgate bodhi svāhā |',
        '即說咒曰：揭諦揭諦。波羅揭諦。波羅僧揭諦。菩提薩婆訶。',
        '即說咒曰：唵！去吧、去吧，度向彼岸吧，大眾普皆共度彼岸吧，速證無上菩提正覺，圓滿成就！',
        'Namely: Oṃ! Gone, gone, gone beyond, gone completely beyond, O Awakening (Bodhi), svāhā!',
        ['玄奘定本', '二合'],
        [
          makeWord('tadyathā', '怛姪他', '即說咒曰', 'namely, thus', 'tad-yathā', 'Indecl.'),
          makeWord('oṃ', '唵', '三身法界體性種子字', 'Sacred syllable Oṃ', 'oṃ', 'Bīja'),
          makeWord('gate', '揭諦', '去吧、已度者', 'O Gone One!', 'gatā-', 'Voc./Loc. Sg. Fem.'),
          makeWord('pāragate', '波羅揭諦', '度向彼岸者', 'O One gone to the other shore!', 'pāra-gatā-', 'Voc./Loc. Sg. Fem.'),
          makeWord('pārasaṃgate', '波羅僧揭諦', '普皆共度彼岸者', 'O One completely gone beyond!', 'pāra-saṃgatā-', 'Voc./Loc. Sg. Fem.'),
          makeWord('bodhi', '菩提', '正覺、無上菩提智', 'O Awakening / Enlightenment!', 'bodhi-', 'Voc. Sg. Fem.'),
          makeWord('svāhā', '薩婆訶', '圓滿吉祥成就', 'Hail! Accomplished!', 'svāhā', 'Indecl.')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T08n0251',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T08/T08n0251.xml',
      taishoLocation: 'T08, no. 251, p. 848c',
      gretilId: 'prajnhsu.htm',
      gretilRawUrl: 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/prajnhsu.htm',
      sanskritEditionCitation:
        'Hōryū-ji Palm-Leaf MS & Edward Conze / Vaidya (prajnhsu.htm) & Oslo Polyglotta 16-Witness Alignment (vid=1175)',
      tangPhoneticNotes: ['玄奘音譯'],
      rawExcerpt: 'tadyathā oṃ gate gate pāragate pārasaṃgate bodhi svāhā',
      crossRefs: {
        taishoIds: ['T08n0251', 'T08n0250', 'T08n0252', 'T08n0253', 'T08n0254', 'T08n0255', 'T08n0257'],
        fangshanIds: ['F28n1071'],
        tohokuIds: ['Toh 21', 'Toh 531'],
        rktsIds: ['K21', 'K531', 'D21', 'D531'],
        dsbcIds: ['820/2949'],
        gretilIds: ['prajnhsu.htm'],
        polyglottaVids: ['vid=1175', 'vid=689']
      }
    }
  },
  {
    id: 'amoghapasa-vairocana-mahaprabha-mantra',
    titleZh: '不空羂索毘盧遮那佛大灌頂光真言（光明真言）',
    shortTitleZh: '光明真言',
    titleSanskrit: 'Amoghapāśa-vairocana-mahāprabhābhiṣeka-mantra',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Amoghapāśa-vairocana-mahāprabhābhiṣeka-mantra', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Amoghapāśa-vairocana-mahāprabhābhiṣeka-mantra', 'strict')),
    titleTibetan: 'དོན་ཡོད་ཞགས་པའི་རྣམ་པར་སྣང་མཛད་ཀྱི་དབང་བསྐུར་བའི་སྔགས།',
    titleEn: 'Mantra of Light (Mahāprabhābhiṣeka of Amoghapāśa Vairocana)',
    category: 'buddhas-bodhisattvas',
    deity: '大日如來・不空羂索毘盧遮那佛 (Mahāvairocana & Amoghapāśa)',
    taishoId: 'T19n1002',
    translator: '唐・不空三藏 (Amoghavajra) 譯',
    period: '盛唐天寶年間 (8th Century CE)',
    summaryZh:
      '唐密與東密真言宗最尊勝之二十三字大灌頂光真言。T19n1002 原典完整保存23組 `<cb:tt>` 悉曇梵字與漢語音譯對照，並與梵本《不空羂索心經》（amoghapu.htm）相呼應。',
    ritualBenefits:
      '若有眾生隨處得聞此大灌頂光真言，二七遍經耳根，即得除滅一切罪障；加持土沙散亡者墓上或屍陀林，亡者即得光明及身，超生極樂。',
    cbetaInterlinearXmlId: 'T19n1002',
    gretilRecordId: 'gretil-amoghapu',
    verses: [
      makeVerse(
        1,
        '二十三字大灌頂光真言全文',
        'oṃ amogha vairocana mahāmudrā maṇi padma jvāla pravartaya hūṃ |',
        '唵。阿謨伽。尾嚧左曩。摩訶母捺囉。麽抳。鉢納麽。入嚩攞。鉢囉靺多野。吽。',
        '唵！不空無礙、遍照法界毘盧遮那如來、大法契印，由摩尼寶珠與清淨蓮花放大光明，轉變開顯無量佛智，吽！',
        'Oṃ! O Unfailing (Amogha) Illuminator (Vairocana), Great Seal (Mahāmudrā), Jewel (Maṇi) and Lotus (Padma): cause the radiant flame (Jvāla) to turn forth and manifest (Pravartaya), Hūṃ!',
        ['二合', '引'],
        [
          makeWord('oṃ', '唵', '法界體性三身種子字', 'Sacred syllable Oṃ', 'oṃ', 'Bīja'),
          makeWord('amogha', '阿謨伽', '不空成就、無虛棄者', 'O Unfailing / Infallible One', 'amogha-', 'Voc. Sg. Masc.'),
          makeWord('vairocana', '尾嚧左曩', '大日遍照如來', 'O Illuminator (Vairocana)', 'vairocana-', 'Voc. Sg. Masc.'),
          makeWord('mahāmudrā', '摩訶母捺囉', '大三昧耶法印', 'O Great Seal', 'mahā-mudrā-', 'Voc./Nom. Sg. Fem.', '二合'),
          makeWord('maṇi padma jvāla', '麽抳鉢納麽入嚩攞', '摩尼寶珠與蓮花大光明焰', 'Flame of the Jewel and Lotus', 'maṇi-padma-jvāla-', 'Voc./Acc. Sg.', '二合'),
          makeWord('pravartaya', '鉢囉靺多野', '轉動、開顯、加持流布', 'Turn forth! Set in motion!', 'pra-√vṛt- (caus.)', '2nd Sg. Imperative', '二合'),
          makeWord('hūṃ', '吽', '菩提心圓滿成就種子字', 'Vajra seed syllable Hūṃ', 'hūṃ', 'Bīja', '引')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T19n1002',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n1002.xml',
      taishoLocation: 'T19, no. 1002, p. 606b',
      gretilId: 'amoghapu.htm',
      gretilRawUrl: 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/amoghapu.htm',
      sanskritEditionCitation: 'Amoghavajra Siddhaṃ Edition (T19n1002, 23 <cb:tt> pairs) & Amoghapāśahṛdaya (amoghapu.htm)',
      tangPhoneticNotes: ['二合', '引'],
      rawExcerpt: '<cb:tt><cb:t xml:lang="sa-Sidd"><g ref="#SD-CFC5"/></cb:t><cb:t xml:lang="zh-Hant">唵</cb:t></cb:tt>',
      crossRefs: {
        taishoIds: ['T19n1002', 'T20n1092'],
        fangshanIds: ['F28n1071'],
        tohokuIds: ['Toh 681', 'Toh 686'],
        rktsIds: ['K681', 'K686', 'D686'],
        gretilIds: ['amoghapu.htm']
      }
    }
  },
  {
    id: 'ekadasamukha-avalokitesvara-dharani',
    titleZh: '十一面觀世音神咒',
    shortTitleZh: '十一面觀音咒',
    titleSanskrit: 'Ekādaśamukha-avalokiteśvara-hṛdaya-dhāraṇī',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Ekādaśamukha-avalokiteśvara-hṛdaya-dhāraṇī', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Ekādaśamukha-avalokiteśvara-hṛdaya-dhāraṇī', 'strict')),
    titleTibetan: 'འཕགས་པ་སྤྱན་རས་གཟིགས་དབང་ཕྱུག་ཞལ་བཅུ་གཅིག་པའི་གཟུངས།',
    titleEn: 'Eleven-Faced Avalokiteśvara Heart Dhāraṇī (Gilgit Edition)',
    category: 'buddhas-bodhisattvas',
    deity: '十一面觀自在菩薩 (Ekādaśamukha Avalokiteśvara)',
    taishoId: 'T20n1071',
    translator: '唐・玄奘三藏 (Xuanzang) / 唐・不空三藏 (Amoghavajra) 譯',
    period: '盛唐 (7th–8th Century CE)',
    summaryZh:
      '世間廣傳之「藏傳大悲咒」實即此《十一面觀世音神咒》。巴基斯坦吉爾吉特（Gilgit）出土6世紀樺樹皮梵本（ekmuhr_u.htm，N. Dutt 校勘）與玄奘譯《十一面神咒心經》（T20n1070）、不空譯本（T20n1071）逐字吻合。',
    ritualBenefits:
      '十方諸佛同所宣說，離諸病苦、惡夢、橫難，臨命終時見十方佛，生蓮華藏世界。',
    gretilRecordId: 'gretil-ekmuhr',
    verses: [
      makeVerse(
        1,
        '吉爾吉特梵本十一面觀音根本咒 (Ekādaśamukha Mūlamantra)',
        'namo ratnatrayāya | nama āryāvalokiteśvarāya bodhisattvāya mahāsattvāya mahākāruṇikāya | namaḥ sarvabuddhabodhisattvebhyaḥ | tadyathā oṃ dhara dhara dhiri dhiri dhuru dhuru iṭṭe vaṭṭe cale cale pracale pracale kusume kusumavare ili mili citijvālam āpanaya svāhā |',
        '敬禮三寶。敬禮聖觀自在菩薩摩訶薩大悲者。敬禮一切諸佛菩薩。怛姪他。唵。達囉達囉。地利地利。吐露吐露。伊知।伐知。遮禮遮禮。鉢囉遮禮鉢囉遮禮。俱蘇謎。俱蘇摩伐隸。伊利彌利。遮隸。遮盧摩波那耶。娑嚩訶。',
        '歸命三寶！歸命聖觀自在菩薩摩訶薩、具大悲心者！歸命一切諸佛菩薩！即說咒曰：唵！任持、堅固任持、總持不失！自在大力、震動大千、妙花開敷、最勝覺花，息滅一切熾然煩惱火聚，圓滿成就，娑嚩訶！',
        'Homage to the Triple Gem! Homage to Noble Avalokiteśvara, the Greatly Compassionate One! Homage to all Buddhas and Bodhisattvas! Namely: Oṃ! Hold fast, sustain, bear up! O Sovereign One, move, move forth, O Flower, Supreme Flower, remove the blazing flame of affliction, svāhā!',
        ['吉爾吉特梵本', '二合'],
        [
          makeWord('dhara dhara dhiri dhiri dhuru dhuru', '達囉達囉地利地利吐露吐露', '任持、堅持、護持不失', 'Hold, sustain, support!', '√dhṛ-', 'Imperative'),
          makeWord('cale cale pracale pracale', '遮禮遮禮鉢囉遮禮鉢囉遮禮', '行動、普皆震動救度', 'Move, move forth!', '√cal- / pra-√cal-', 'Imperative'),
          makeWord('kusume kusumavare', '俱蘇謎俱蘇摩伐隸', '妙花、最上勝妙花尊', 'O Flower, O Supreme Flower!', 'kusuma- / kusuma-vara-', 'Voc. Sg.'),
          makeWord('citijvālam āpanaya', '遮隸遮盧摩波那耶', '除滅熾盛火聚', 'lead away / extinguish the blazing pyre-flame', 'citi-jvālā- + apa-√nī-', 'Acc. Sg. + Imperative')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T20n1071',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1071.xml',
      taishoLocation: 'T20, no. 1070 & 1071, p. 152b–154c',
      gretilId: 'ekmuhr_u.htm',
      gretilRawUrl: 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/ekmuhr_u.htm',
      sanskritEditionCitation: 'Nalinaksha Dutt, Gilgit Manuscripts Vol. I, pp. 35–40 (ekmuhr_u.htm) & DSBC 15/207',
      tangPhoneticNotes: ['玄奘音譯', '不空音譯'],
      rawExcerpt: 'tadyathā oṃ dhara dhara dhiri dhiri dhuru dhuru iṭṭe vaṭṭe cale cale pracale pracale kusume kusumavare',
      crossRefs: {
        taishoIds: ['T20n1069', 'T20n1070', 'T20n1071'],
        fangshanIds: ['F28n1071'],
        tohokuIds: ['Toh 693', 'Toh 694', 'Toh 900'],
        rktsIds: ['K693', 'D693', 'D900'],
        dsbcIds: ['15/207'],
        gretilIds: ['ekmuhr_u.htm'],
        buddhaNexusIds: ['K12ekmuhr_u']
      }
    }
  },
  {
    id: 'sadaksari-mahavidya-mantra',
    titleZh: '觀自在菩薩六字大明王陀羅尼',
    shortTitleZh: '六字大明咒',
    titleSanskrit: 'Ṣaḍakṣarī-mahāvidyā-dhāraṇī',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Ṣaḍakṣarī-mahāvidyā-dhāraṇī', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Ṣaḍakṣarī-mahāvidyā-dhāraṇī', 'strict')),
    titleTibetan: 'ཡི་གེ་དྲུག་མའི་རིག་སྔགས་ཆེན་མོ།',
    titleEn: 'Six-Syllable Great Vidyā Queen (Oṃ Maṇi Padme Hūṃ)',
    category: 'buddhas-bodhisattvas',
    deity: '四臂觀音・六字大明王 (Ṣaḍakṣarī Lokeśvara)',
    taishoId: 'T20n1050',
    translator: '宋・天息災 (Devaśānti) 譯《佛說大乘莊嚴寶王經》',
    period: '北宋太平興國八年 (983 CE)',
    summaryZh:
      '出自《佛說大乘莊嚴寶王經》（*Kāraṇḍavyūha-sūtra*，T20n1050，GRETIL `bsu019_u.htm`）。經云此六字大明陀羅尼乃觀自在菩薩微妙本心，總攝八萬四千法門與六波羅蜜，閉塞六道輪迴之門。',
    ritualBenefits:
      '持誦一遍同誦八萬四千法藏，得無礙辯才、清淨六根，六道四生聞咒皆證菩薩地。',
    gretilRecordId: 'gretil-bsu019',
    verses: [
      makeVerse(
        1,
        '六字大明根本心咒',
        'oṃ maṇi padme hūṃ |',
        '唵。麽抳。鉢訥銘。吽。',
        '唵！持蓮花與如意摩尼寶珠之尊（或：於蓮花上之摩尼寶珠），吽！',
        'Oṃ! O She who holds the Jewel and Lotus (Maṇipadme), Hūṃ!',
        ['二合', '引'],
        [
          makeWord('oṃ', '唵', '諸佛身語意三業清淨種子字', 'Sacred syllable Oṃ', 'oṃ', 'Bīja'),
          makeWord('maṇi', '麽抳', '如意摩尼寶珠（象徵方便與菩提心）', 'Jewel / Cintāmaṇi', 'maṇi-', 'Stem'),
          makeWord('padme', '鉢訥銘', '紅白蓮花（象徵出淤泥不染之空性般若）', 'in the Lotus / O Jewel-Lotus Holder', 'padma- / maṇipadmā-', 'Loc. Sg. Neut. / Voc. Sg. Fem.', '二合'),
          makeWord('hūṃ', '吽', '悲智雙運不二金剛種子字', 'Indivisible Vajra-Mind syllable Hūṃ', 'hūṃ', 'Bīja', '引')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T20n1060',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1060.xml',
      taishoLocation: 'T20, no. 1050, p. 62b',
      gretilId: 'bsu019_u.htm',
      gretilRawUrl: 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/bsu019_u.htm',
      sanskritEditionCitation: 'P.L. Vaidya (1961), Kāraṇḍavyūhasūtra (BST 17, bsu019_u.htm) & 84000 Toh 116',
      tangPhoneticNotes: ['二合', '引'],
      rawExcerpt: 'oṃ maṇipadme hūṃ',
      crossRefs: {
        taishoIds: ['T20n1050'],
        fangshanIds: ['F28n1071'],
        tohokuIds: ['Toh 116'],
        rktsIds: ['K116', 'D116'],
        dsbcIds: ['19/211'],
        gretilIds: ['bsu019_u.htm'],
        buddhaNexusIds: ['K12bsu019_u']
      }
    }
  },
  {
    id: 'manjusri-pancaksara-mantra',
    titleZh: '文殊師利菩薩五字真言暨真實名經心咒',
    shortTitleZh: '文殊五字真言',
    titleSanskrit: 'Mañjuśrī-pañcākṣara-nāmasaṃgīti-mantra',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Mañjuśrī-pañcākṣara-nāmasaṃgīti-mantra', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Mañjuśrī-pañcākṣara-nāmasaṃgīti-mantra', 'strict')),
    titleTibetan: 'འཇམ་དཔལ་ཡེ་ཤེས་སེམས་དཔའི་དོན་དམ་པའི་མཚན་ཡང་དག་པར་བརྗོད་པ།',
    titleEn: 'Mañjuśrī Five-Syllable Arapacana & Nāmasaṃgīti Mantra',
    category: 'buddhas-bodhisattvas',
    deity: '大智文殊師利童真菩薩 (Mañjuśrī Jñānasattva)',
    taishoId: 'T20n1173',
    translator: '唐・不空三藏 (Amoghavajra) / 宋・釋智吉祥 譯',
    period: '盛唐至北宋 (8th–10th Century CE)',
    summaryZh:
      '融合《金剛頂經瑜伽文殊師利菩薩法》（T20n1173）、《大方廣佛華嚴經》四十二字門首五字（a-ra-pa-ca-na，T10n0293）與無上瑜伽部《文殊真實名經》（*Mañjuśrīnāmasaṃgīti*，GRETIL `manjn1pu.htm`）之智慧總持。',
    ritualBenefits:
      '破除愚癡暗障，速得總持不忘、利根智慧、無礙辯才，通達一切三藏般若法門。',
    gretilRecordId: 'gretil-manjn1pu',
    verses: [
      makeVerse(
        1,
        '文殊五字真言暨《文殊真實名經》梵本心咒',
        'oṃ a ra pa ca na dhīḥ | oṃ sarva-dharmābhāva-svabhāva-viśuddha vajra a ā aṃ aḥ |',
        '唵。阿囉跛左曩。諦。唵。薩嚩達磨婆嚩娑嚩婆嚩尾戌駄。嚩日囉。阿。阿引。暗。惡。',
        '唵！阿（無生義）、囉（離塵垢義）、跛（第一義諦）、左（無諸行義）、曩（無性相義）、諦（甚深般若智種子）！唵！一切諸法無自性清淨金剛：阿、阿、暗、惡！',
        'Oṃ! A (unborn), Ra (dustless), Pa (ultimate truth), Ca (beyond course), Na (nameless), Dhīḥ (Prajñā)! Oṃ! Vajra pure through the intrinsic non-existence of all dharmas: A Ā Aṃ Aḥ!',
        ['五字門釋', '引'],
        [
          makeWord('a', '阿', '一切法本不生（阿字門）', 'All dharmas are primordially unborn', 'a-', 'Akṣara-mukha 1'),
          makeWord('ra', '囉', '一切法離諸塵垢（囉字門）', 'All dharmas are free from stain', 'ra-', 'Akṣara-mukha 2'),
          makeWord('pa', '跛', '一切法第一義諦顯現（跛字門）', 'All dharmas reveal ultimate truth', 'pa-', 'Akṣara-mukha 3'),
          makeWord('ca', '左', '一切法無減無行（左字門）', 'All dharmas are without decrease or course', 'ca-', 'Akṣara-mukha 4'),
          makeWord('na', '曩', '一切法遠離名相（曩字門）', 'All dharmas transcend names and signs', 'na-', 'Akṣara-mukha 5'),
          makeWord('dhīḥ', '諦', '文殊般若甚深智慧種子字', 'Prajñā wisdom seed syllable Dhīḥ', 'dhīḥ', 'Bīja')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T20n1173',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1173.xml',
      taishoLocation: 'T20, no. 1173, p. 710b; T20, no. 1187',
      gretilId: 'manjn1pu.htm',
      gretilRawUrl: 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/manjn1pu.htm',
      sanskritEditionCitation: 'Ronald M. Davidson (1981), Mañjuśrīnāmasaṃgīti (manjn1pu.htm) & T10n0293 Arapacana',
      tangPhoneticNotes: ['五字門', '引'],
      rawExcerpt: 'oṃ sarvadharmābhāvasvabhāvaviśuddha vajra a ā aṃ aḥ',
      crossRefs: {
        taishoIds: ['T20n1173', 'T20n1187', 'T10n0293'],
        fangshanIds: ['F28n1071'],
        tohokuIds: ['Toh 360'],
        rktsIds: ['K360', 'D360'],
        gretilIds: ['manjn1pu.htm'],
        buddhaNexusIds: ['K12manjn1pu'],
        cudlMsIds: ['MS-ADD-01326']
      }
    }
  },
  {
    id: 'aryatara-mulamantra',
    titleZh: '聖救度佛母根本十字心咒暨二十一禮讚',
    shortTitleZh: '綠度母心咒',
    titleSanskrit: 'Ārya-tārā-mūlamantra-namaskāraikaviṃśati',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Ārya-tārā-mūlamantra-namaskāraikaviṃśati', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Ārya-tārā-mūlamantra-namaskāraikaviṃśati', 'strict')),
    titleTibetan: 'རྗེ་བཙུན་འཕགས་མ་སྒྲོལ་མའི་རྩ་སྔགས།',
    titleEn: 'Noble Ārya-Tārā Ten-Syllable Root Mantra',
    category: 'buddhas-bodhisattvas',
    deity: '聖救度佛母・綠度母 (Ārya-Tārā Bhagavatī)',
    taishoId: 'T20n1102',
    translator: '唐・不空三藏 (Amoghavajra) / 元・安藏 譯',
    period: '盛唐至元代 (8th–13th Century CE)',
    summaryZh:
      '觀音菩薩悲淚化現之聖救度佛母根本十字真言。梵本《聖度母百八名讚》（`tarb108u.htm`）存於 GRETIL，而《二十一度母禮讚經》梵藏漢英四語逐句對勘本收於奧斯陸大學 Bibliotheca Polyglotta (`vid=1134`)。',
    ritualBenefits:
      '速疾救度八難十六怖畏（獅難、象難、火難、蛇難、盜賊、牢獄、水溺、非人等），滿願除障最極神速。',
    gretilRecordId: 'gretil-tarb108u',
    verses: [
      makeVerse(
        1,
        '聖救度佛母十字根本真言',
        'oṃ tāre tuttāre ture svāhā |',
        '唵。多。都多。都。娑嚩訶。',
        '唵！度母尊（度脫輪迴苦）、大救度尊（拔濟八大怖畏）、速疾勇母（疾速賜予世出世間成就），圓滿吉祥，娑嚩訶！',
        'Oṃ! O Liberator (Tāre), Savior from all fears (Tuttāre), Swift Heroine granting siddhi (Ture), svāhā!',
        ['二合', '引'],
        [
          makeWord('oṃ', '唵', '諸佛三身總持種子字', 'Sacred syllable Oṃ', 'oṃ', 'Bīja'),
          makeWord('tāre', '多', '度母尊（度脫三界輪迴）', 'O Savior / Liberator from Saṃsāra', 'tārā-', 'Voc. Sg. Fem.'),
          makeWord('tuttāre', '都多', '救度八難一切怖畏尊', 'O Deliverer from the eight great terrors', 'uttārā- / tuttārā-', 'Voc. Sg. Fem.'),
          makeWord('ture', '都', '速疾勇猛賜予成就尊', 'O Swift One who removes disease and grants siddhi', 'turā-', 'Voc. Sg. Fem.'),
          makeWord('svāhā', '娑嚩訶', '圓滿吉祥成就', 'Hail! Accomplished!', 'svāhā', 'Indecl.', '二合')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T20n1102',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1102.xml',
      taishoLocation: 'T20, no. 1102, p. 454a; T20, no. 1108A',
      gretilId: 'tarb108u.htm',
      gretilRawUrl: 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/tarb108u.htm',
      sanskritEditionCitation:
        'Godefroy de Blonay (1895), Tārābhaṭṭārikānāmāṣṭottaraśatakastotra (tarb108u.htm) & Oslo Polyglotta vid=1134',
      tangPhoneticNotes: ['二合', '引'],
      rawExcerpt: 'oṃ tāre tuttāre ture svāhā',
      crossRefs: {
        taishoIds: ['T20n1102', 'T20n1108A'],
        fangshanIds: ['F28n1071'],
        tohokuIds: ['Toh 438', 'Toh 728'],
        rktsIds: ['K438', 'D438', 'D728'],
        dsbcIds: ['820/2949'],
        gretilIds: ['tarb108u.htm'],
        polyglottaVids: ['vid=1134'],
        cudlMsIds: ['MS-ADD-01326']
      }
    }
  },
  {
    id: 'marici-dharani',
    titleZh: '摩利支天菩薩陀羅尼',
    shortTitleZh: '摩利支天咒',
    titleSanskrit: 'Ārya-mārīcī-nāma-dhāraṇī',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Ārya-mārīcī-nāma-dhāraṇī', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Ārya-mārīcī-nāma-dhāraṇī', 'strict')),
    titleTibetan: 'འཕགས་མ་འོད་ཟེར་ཅན་མ་ཞེས་བྱ་བའི་གཟུངས།',
    titleEn: 'Noble Mārīcī (Goddess of Dawn & Mirage Light) Dhāraṇī',
    category: 'buddhas-bodhisattvas',
    deity: '摩利支天菩薩・具光佛母 (Ārya-Mārīcī)',
    taishoId: 'T21n1257',
    translator: '唐・不空三藏 (Amoghavajra) / 宋・天息災 (Devaśānti) 譯',
    period: '盛唐至北宋 (8th–10th Century CE)',
    summaryZh:
      '摩利支天意為「陽焰、威光」，常行日前，日天不見彼，無人能見、無人能捉、無人能害、無人能欺誑、無人能債其財物。梵本存於 GRETIL (`maricdhu.htm`) 及劍橋 CUDL `MS-ADD-01680-00008-00003`，宋譯廣本《佛說大摩里支菩薩經》（T21n1257）收錄223段真言。',
    ritualBenefits:
      '隱身護命，遠離王難、賊難、行路難、水火刀兵一切厄難，所求善願速得成就。',
    cbetaInterlinearXmlId: 'T21n1257',
    gretilRecordId: 'gretil-maricdhu',
    verses: [
      makeVerse(
        1,
        '摩利支天根本陀羅尼暨心真言',
        'namo ratnatrayāya | tadyathā oṃ arkamasi markamasi sudhumasi cīvaramasi mahācīvaramasi antardhānamasi svāhā | oṃ mārīcyai māṃ svāhā |',
        '南無三滿多沒馱喃。唵。摩利支玉。娑嚩訶。怛姪他。遏迦摩私。末迦摩私。蘇圖摩私。支鉢囉摩私。摩訶支鉢囉摩私。安怛陀那摩私。娑嚩訶。',
        '歸命三寶！即說咒曰：唵！如日光威耀、如疾風迅行、善妙威光、法衣覆護、大法衣遍覆、成就微妙隱身法，娑嚩訶！唵，歸命摩利支天菩薩護我（māṃ），娑嚩訶！',
        'Homage to the Triple Gem! Namely: Oṃ! You are solar radiance (arkamasi), swift light (markamasi), pure light, protective robe (cīvaramasi), great robe, and complete invisibility (antardhānamasi), svāhā! Oṃ, to Mārīcī, protect me (māṃ), svāhā!',
        ['二合', '引'],
        [
          makeWord('arkamasi', '遏迦摩私', '汝即日光威耀', 'You are the sun-ray', 'arka- + asi', 'Nom. + 2nd Sg. √as-'),
          makeWord('cīvaramasi', '支鉢囉摩私', '汝即護身法衣', 'You are the protective robe', 'cīvara- + asi', 'Nom. + 2nd Sg. √as-'),
          makeWord('antardhānamasi', '安怛陀那摩私', '汝即隱形無見神通', 'You are complete invisibility', 'antardhāna- + asi', 'Nom. + 2nd Sg. √as-'),
          makeWord('mārīcyai', '摩利支玉', '敬禮摩利支天尊', 'to Mārīcī', 'mārīcī-', 'Dat. Sg. Fem. (第四格)')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T21n1257',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T21/T21n1257.xml',
      taishoLocation: 'T21, no. 1255B & no. 1257, p. 262a–285c',
      gretilId: 'maricdhu.htm',
      gretilRawUrl: 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/maricdhu.htm',
      sanskritEditionCitation: 'Dhīḥ 42 (2006), pp. 157–158 (maricdhu.htm) & Cambridge CUL MS Add. 1680.8.3',
      tangPhoneticNotes: ['二合', '引'],
      rawExcerpt: 'tadyathā oṃ arkamasi markamasi sudhumasi cīvaramasi mahācīvaramasi antardhānamasi svāhā',
      crossRefs: {
        taishoIds: ['T21n1255B', 'T21n1257'],
        fangshanIds: ['F28n1071'],
        tohokuIds: ['Toh 564', 'Toh 988'],
        rktsIds: ['K564', 'D564', 'D988'],
        dsbcIds: ['13/206', '820/2949'],
        gretilIds: ['maricdhu.htm'],
        buddhaNexusIds: ['K12maricdhu'],
        cudlMsIds: ['MS-ADD-01680-00008-00003', 'MS-ADD-01326']
      }
    }
  },
  {
    id: 'vasudhara-dharani',
    titleZh: '持世菩薩（財源天母）陀羅尼',
    shortTitleZh: '持世菩薩咒',
    titleSanskrit: 'Ārya-vasudhārā-nāma-dhāraṇī',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Ārya-vasudhārā-nāma-dhāraṇī', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Ārya-vasudhārā-nāma-dhāraṇī', 'strict')),
    titleTibetan: 'འཕགས་མ་ནོར་རྒྱུན་མ་ཞེས་བྱ་བའི་གཟུངས།',
    titleEn: 'Noble Vasudhārā (Stream of Wealth & Abundance) Dhāraṇī',
    category: 'buddhas-bodhisattvas',
    deity: '持世菩薩・財源佛母 (Ārya-Vasudhārā)',
    taishoId: 'T20n1162',
    translator: '唐・玄奘三藏 (Xuanzang) / 唐・不空 (Amoghavajra) / 宋・法天 譯',
    period: '唐永徽五年 (654 CE)',
    summaryZh:
      '尼泊爾新瓦爾佛教與藏傳密教最尊崇之增益法本尊。玄奘譯為《佛說持世陀羅尼經》（T20n1162），不空譯為《雨寶陀羅尼經》（T20n1163）。梵本完存於 GRETIL (`vadhdhdu.htm`)、DSBC (`21/223`) 及劍橋 CUDL `MS-ADD-01355`。',
    ritualBenefits:
      '普雨無量法財與世間資糧穀麥珍寶，除一切貧窮飢饉，令施者道糧充足，速成菩提。',
    gretilRecordId: 'gretil-vadhdhdu',
    verses: [
      makeVerse(
        1,
        '持世雨寶根本心咒',
        'namo ratnatrayāya | oṃ vasudhāre svāhā | oṃ śrī-vasumukhī svāhā |',
        '南無喝囉怛那多囉夜耶。唵。嚩蘇陀隸。娑嚩訶。唵。室哩嚩蘇穆棄。娑嚩訶。',
        '歸命三寶！唵！持世寶流母，娑嚩訶！唵！吉祥寶相圓滿母，娑嚩訶！',
        'Homage to the Triple Gem! Oṃ! O Vasudhārā (Stream of Gems), svāhā! Oṃ! O Auspicious Face of Abundance (Śrī-Vasumukhī), svāhā!',
        ['二合', '引'],
        [
          makeWord('vasudhāre', '嚩蘇陀隸', '持世尊、雨寶流母', 'O Stream of Treasure (Vasudhārā)', 'vasu-dhārā-', 'Voc. Sg. Fem.'),
          makeWord('śrī-vasumukhī', '室哩嚩蘇穆棄', '吉祥寶面母', 'O Auspicious Treasure-Faced One', 'śrī-vasu-mukhī-', 'Voc. Sg. Fem.', '二合')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T20n1162',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1162.xml',
      taishoLocation: 'T20, no. 1162, p. 666c; T20, no. 1163',
      gretilId: 'vadhdhdu.htm',
      gretilRawUrl: 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/vadhdhdu.htm',
      sanskritEditionCitation: 'Dhīḥ 44 (2007) Vasudhārādhāraṇī (vadhdhdu.htm), DSBC 21/223 & CUDL MS Add. 1355',
      tangPhoneticNotes: ['二合', '引'],
      rawExcerpt: 'namo ratnatrayāya oṃ vasudhāre svāhā oṃ śrīvasumukhī svāhā',
      crossRefs: {
        taishoIds: ['T20n1162', 'T20n1163'],
        fangshanIds: ['F28n1071'],
        tohokuIds: ['Toh 662', 'Toh 959'],
        rktsIds: ['K662', 'D662', 'D959'],
        dsbcIds: ['21/223', '820/2949'],
        gretilIds: ['vadhdhdu.htm'],
        buddhaNexusIds: ['K12vadhdhdu'],
        cudlMsIds: ['MS-ADD-01326', 'MS-ADD-01680-00008-00002']
      }
    }
  },
  {
    id: 'mahamayuri-vidyarajni-dharani',
    titleZh: '佛母大孔雀明王心陀羅尼',
    shortTitleZh: '孔雀明王咒',
    titleSanskrit: 'Mahāmāyūrī-vidyārājñī-hṛdaya-dhāraṇī',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Mahāmāyūrī-vidyārājñī-hṛdaya-dhāraṇī', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Mahāmāyūrī-vidyārājñī-hṛdaya-dhāraṇī', 'strict')),
    titleTibetan: 'རིག་སྔགས་ཀྱི་རྒྱལ་མོ་རྨ་བྱ་ཆེན་མོའི་སྙིང་པོ།',
    titleEn: 'Great Peahen Queen of Vidyās (Mahāmāyūrī Vidyārājñī) Heart Dhāraṇī',
    category: 'buddhas-bodhisattvas',
    deity: '佛母大金曜孔雀明王 (Mahāmāyūrī Vidyārājñī)',
    taishoId: 'T19n0982',
    translator: '唐・不空三藏 (Amoghavajra) / 唐・義淨 (Yijing) 譯',
    period: '盛唐 (8th Century CE)',
    summaryZh:
      '「五護陀羅尼」（Pañcarakṣā）核心經典之一。因莎底比丘為黑蛇所螫，佛為阿難宣說此大孔雀明王陀羅尼。不空三藏譯本（T19n0982）含347條梵漢校勘注，田久保周譽（1972）校勘梵本完存於 GRETIL (`mmayuvru.htm`)。',
    ritualBenefits:
      '能滅一切蛇毒、蠱毒、瘟疫、鬼魅、惡星災障，祈雨止雨最極靈驗。',
    cbetaInterlinearXmlId: 'T19n0982',
    gretilRecordId: 'gretil-mmayuvru',
    verses: [
      makeVerse(
        1,
        '佛母大孔雀明王根本心真言',
        'namo buddhāya | namo dharmāya | namaḥ saṃghāya | namo suvarṇāvabhāsasya mayūrarājñaḥ | tadyathā siddhe susiddhe mocani mokṣaṇi mukte vimukte amale vimale nirmale maṅgalye hiraṇyagarbhe ratnagarbhe bhadre subhadre samantabhadre sarvārthasādhani paramārthasādhani sarvānarthapraśamani sarvamaṅgalasādhani manasi mānasi mahāmānasi adbhute atyadbhute acyute ajare vijare vimale amṛte amare amarani brahme brahmasvare pūrṇe pūrṇamanorathe mṛtasaṃjīvani śrībhadre candre candraprabhe sūrye sūryakānte vītabhaye suvarṇabrahmaghoṣe brahmajuṣṭe sarvatrāpratihate svāhā | oṃ mayūrākrānte svāhā |',
        '南無母馱耶。南無達磨耶。南無僧伽耶。南無蘇嚩囉拏嚩婆娑寫。摩瑜囉囉惹寫。怛姪他。悉第蘇悉第。謨左儞謨剎儞。目帝尾目帝。阿摩隸尾摩隸儞摩隸。忙誐隸。呬囉若蘗陛。囉怛那蘗陛。婆捺隸蘇婆捺隸三曼多婆捺隸。薩嚩囉他娑馱儞。鉢囉摩囉他娑馱儞。娑嚩訶。唵。摩瑜囉訖蘭帝。娑嚩訶。',
        '歸命佛、法、僧！歸命放金色光孔雀王尊！即說咒曰：成就、善成就，能解脫、能救脫，離垢、無垢、極清淨，吉祥、金胎藏、寶胎藏，賢善、普賢善，成辦一切義利與第一義諦，息滅一切非義災禍，起死回生，普於一切處無礙自在，娑嚩訶！唵，乘御孔雀尊，娑嚩訶！',
        'Homage to the Buddha, Dharma, and Saṃgha! Homage to the Golden-Radiant Peacock King! Namely: O Accomplished, Well-Accomplished, Liberating, Stainless, Auspicious, Golden-Womb, Jewel-Womb, Universally Good, Accomplisher of all aims and the ultimate aim, Reviver of the dead, Unobstructed everywhere, svāhā! Oṃ! O She who mounts the Peacock, svāhā!',
        ['二合', '引'],
        [
          makeWord('suvarṇāvabhāsasya mayūrarājñaḥ', '蘇嚩囉拏嚩婆娑寫摩瑜囉囉惹寫', '放金色光之孔雀王尊', 'of the Golden-Radiant Peacock King', 'suvarṇa-avabhāsa- + mayūra-rājan-', 'Gen. Sg. Masc.'),
          makeWord('mocani mokṣaṇi', '謨左儞謨剎儞', '能解脫、能救度母', 'O Liberator, Deliverer!', 'mocanī- + mokṣaṇī-', 'Voc. Sg. Fem.'),
          makeWord('hiraṇyagarbhe ratnagarbhe', '呬囉若蘗陛囉怛那蘗陛', '金胎藏母、寶胎藏母', 'O Golden Matrix, Jewel Matrix!', 'hiraṇya-garbhā- + ratna-garbhā-', 'Voc. Sg. Fem.', '二合'),
          makeWord('mayūrākrānte', '摩瑜囉訖蘭帝', '乘御孔雀大明王尊', 'O She who strides upon the Peacock', 'mayūra-ākrāntā-', 'Voc. Sg. Fem.', '二合')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T19n0982',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n0982.xml',
      taishoLocation: 'T19, no. 982, p. 415a–446b',
      gretilId: 'mmayuvru.htm',
      gretilRawUrl: 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/mmayuvru.htm',
      sanskritEditionCitation: 'Shūyo Takubo (1972), Ārya-Mahā-Māyūrī Vidyā-Rājñī (mmayuvru.htm) & Pañcarakṣā (psarkdhu.htm)',
      tangPhoneticNotes: ['二合', '引'],
      rawExcerpt: 'siddhe susiddhe mocani mokṣaṇi mukte vimukte amale vimale nirmale',
      crossRefs: {
        taishoIds: ['T19n0982', 'T19n0984', 'T19n0985'],
        fangshanIds: ['F28n1071'],
        tohokuIds: ['Toh 559'],
        rktsIds: ['K559', 'D559'],
        gretilIds: ['mmayuvru.htm', 'psarkdhu.htm'],
        buddhaNexusIds: ['K12mmayuvru'],
        cudlMsIds: ['MS-ADD-01326', 'MS-ADD-01680-00008-00002']
      }
    }
  },
  {
    id: 'vajravidarana-dharani',
    titleZh: '金剛摧碎陀羅尼',
    shortTitleZh: '金剛摧碎咒',
    titleSanskrit: 'Vajravidāraṇā-nāma-dhāraṇī',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Vajravidāraṇā-nāma-dhāraṇī', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Vajravidāraṇā-nāma-dhāraṇī', 'strict')),
    titleTibetan: 'རྡོ་རྗེ་རྣམ་པར་འཇོམས་པ་ཞེས་བྱ་བའི་གཟུངས།',
    titleEn: 'Vajravidāraṇā (All-Shattering Vajra) Dhāraṇī',
    category: 'buddhas-bodhisattvas',
    deity: '金剛手菩薩・金剛摧碎尊 (Vajrapāṇi / Vajravidāraṇa)',
    taishoId: 'T21n1416',
    translator: '宋・慈賢三藏 (Maitribhadra) 譯',
    period: '北宋／契丹時代 (10th–11th Century CE)',
    summaryZh:
      '金剛手菩薩入「金剛摧碎大三昧」所說之除障淨業無上總持。梵本雙版本（岩本裕 1937 校本 `vajvidhu.htm` 與《Dhīḥ》40 校本 `vjviddhu.htm`）存於 GRETIL，84000 工程亦收錄 Toh 750/965 完整對勘。',
    ritualBenefits:
      '如金剛杵摧碎一切惡業、病魔、邪咒、死魔與五毒煩惱，加持淨水沐浴能淨一切晦氣重疾。',
    gretilRecordId: 'gretil-vajvidhu',
    verses: [
      makeVerse(
        1,
        '金剛摧碎根本真言',
        'namas candravajrapāṇaye mahāyakṣasenāpataye | tadyathā oṃ trūṭa trūṭa troṭaya troṭaya sphuṭa sphuṭa sphoṭaya sphoṭaya ghūrṇa ghūrṇa ghūrṇāpaya ghūrṇāpaya sarvasattvāni bodhaya bodhaya saṃbodhaya saṃbodhaya bhrama bhrama saṃbhramaya saṃbhramaya sarvabhūtāni kuṭṭa kuṭṭa saṃkuṭṭaya saṃkuṭṭaya sarvaśatrūn ghaṭa ghaṭa saṃghaṭaya saṃghaṭaya sarvavidyā vajra vajra sphoṭaya vajra vajra kaṭa vajra vajra maṭa vajra vajra matha vajra vajra aṭṭahāsa nīlavajra su-vajrāya svāhā |',
        '南無室戰拏嚩日囉播拏曳。摩訶藥叉細曩鉢多曳。怛姪他。唵。咄嚕吒咄嚕吒。都嚕吒也。娑普吒娑普吒。娑破吒也。具囉拏具囉拏。具囉拏波也。薩嚩薩埵儞。冒馱也冒馱也。三冒馱也。婆囉摩婆囉摩。三婆囉摩也。薩嚩部多儞。矩吒矩吒。三矩吒也。薩嚩設咄嚕。嚩日囉嚩日囉。娑破吒也。娑嚩訶。',
        '歸命暴惡威猛金剛手、大藥叉軍主！即說咒曰：唵！斷截、令斷截，摧裂、令摧裂，震動、令震動，令一切有情覺悟、正等覺悟，令一切部多鬼神迷伏，擣碎一切怨敵，以金剛杵摧破一切惡咒，大笑威震青金剛、妙金剛尊，娑嚩訶！',
        'Homage to Fierce Vajrapāṇi, Great General of the Yakṣas! Namely: Oṃ! Cut, sever, burst, shatter, whirl, shake! Awaken, fully awaken all beings! Confound all bhūtas, crush all enemies, shatter all hostile spells with the Vajra! O Loud-Laughing Blue Vajra, Supreme Vajra, svāhā!',
        ['二合', '引'],
        [
          makeWord('candravajrapāṇaye', '室戰拏嚩日囉播拏曳', '威猛忿怒金剛手尊', 'to Fierce/Radiant Vajrapāṇi', 'caṇḍa/candra-vajrapāṇi-', 'Dat. Sg. Masc.', '二合'),
          makeWord('mahāyakṣasenāpataye', '摩訶藥叉細曩鉢多曳', '大藥叉軍大將', 'to the Great General of the Yakṣas', 'mahā-yakṣa-senāpati-', 'Dat. Sg. Masc.'),
          makeWord('trūṭa trūṭa troṭaya troṭaya', '咄嚕吒咄嚕吒都嚕吒也', '截斷、令截斷結縛', 'Break, sever, cause to shatter!', '√truṭ-', 'Imperative', '二合'),
          makeWord('sphuṭa sphuṭa sphoṭaya sphoṭaya', '娑普吒娑普吒娑破吒也', '迸裂、令摧破無明', 'Burst, cleave, cause to burst!', '√sphuṭ-', 'Imperative', '二合'),
          makeWord('nīlavajra su-vajrāya', '尼攞嚩日囉蘇嚩日囉耶', '青金剛、善妙金剛尊', 'to the Blue Vajra, Supreme Vajra', 'nīla-vajra- + su-vajra-', 'Dat. Sg. Masc.')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T20n1113B',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T21/T21n1416.xml',
      taishoLocation: 'T21, no. 1416, p. 931a; F28, no. 1071',
      gretilId: 'vajvidhu.htm',
      gretilRawUrl: 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/vajvidhu.htm',
      sanskritEditionCitation:
        'Yutaka Iwamoto (1937), Vajravidāraṇā-dhāraṇī (vajvidhu.htm) & Dhīḥ 40 (2005) (vjviddhu.htm) & 84000 Toh 750/965',
      tangPhoneticNotes: ['二合', '引'],
      rawExcerpt: 'namas candravajrapāṇaye mahāyakṣasenāpataye tadyathā oṃ trūṭa trūṭa troṭaya troṭaya',
      crossRefs: {
        taishoIds: ['T21n1416', 'T21n1417'],
        fangshanIds: ['F28n1071'],
        tohokuIds: ['Toh 750', 'Toh 965'],
        rktsIds: ['K750', 'D750', 'D965'],
        dsbcIds: ['12/205'],
        gretilIds: ['vajvidhu.htm', 'vjviddhu.htm'],
        buddhaNexusIds: ['K12vajvidhu'],
        cudlMsIds: ['MS-ADD-01680-00008-00001', 'MS-ADD-01326']
      }
    }
  },
  {
    id: 'hayagriva-vidya-mantra',
    titleZh: '聖觀自在菩薩馬頭明王心陀羅尼',
    shortTitleZh: '馬頭明王咒',
    titleSanskrit: 'Āryāvalokiteśvara-hayagrīva-vidyā-dhāraṇī',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Āryāvalokiteśvara-hayagrīva-vidyā-dhāraṇī', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Āryāvalokiteśvara-hayagrīva-vidyā-dhāraṇī', 'strict')),
    titleTibetan: 'འཕགས་པ་སྤྱན་རས་གཟིགས་དབང་ཕྱུག་རྟ་མགྲིན་གྱི་རིག་སྔགས།',
    titleEn: 'Noble Avalokiteśvara Hayagrīva (Horse-Necked Vidyārāja) Dhāraṇī',
    category: 'buddhas-bodhisattvas',
    deity: '馬頭觀音・馬頭金剛明王 (Hayagrīva Vidyārāja)',
    taishoId: 'T20n1072A',
    translator: '唐・智通 / 唐・不空三藏 (Amoghavajra) 譯',
    period: '盛唐 (7th–8th Century CE)',
    summaryZh:
      '觀自在菩薩教令輪身（獅子無畏相）。吉爾吉特（Gilgit）出土6世紀樺樹皮梵本（N. Dutt 校勘）完存於 GRETIL (`bsu017_u.htm`)、DSBC (`16/208`) 及 BuddhaNexus (`K12Xbsu017_u`)。',
    ritualBenefits:
      '猶如轉輪聖王寶馬巡行四洲，於一念頃噉盡一切無明魔障、病苦與非人毒害。',
    gretilRecordId: 'gretil-bsu017',
    verses: [
      makeVerse(
        1,
        '吉爾吉特梵本馬頭明王甘露破障真言',
        'namo ratnatrayāya | nama āryāvalokiteśvarāya bodhisattvāya mahāsattvāya mahākāruṇikāya | tadyathā oṃ amṛtodbhave amṛtasambhave amṛtagarbhe amṛtasiddhe amṛtateje amṛtavihāriṇe amṛtavikrāntagāmini gagana-kīrti-kare sarva-kleśa-kṣayaṃ-kari svāhā | oṃ hūṃ hrīḥ phaṭ |',
        '南無喝囉怛那多囉夜耶。南無阿唎耶嚩盧枳帝濕嚩囉耶。怛姪他。唵。阿蜜慄都納婆吠。阿蜜慄多三婆吠。阿蜜慄多蘗陛。阿蜜慄多悉第。阿蜜慄多帝際。阿蜜慄多尾訖磷多誐弭儞。誐誐曩計慄底迦隸。薩嚩吉隸舍乞灑央迦隸。娑嚩訶。唵。吽。紇哩。發吒。',
        '歸命三寶！歸命大悲聖觀自在菩薩摩訶薩！即說咒曰：唵！甘露所生、甘露正生、甘露胎藏、甘露成就、甘露威光、甘露安住、甘露神力遍行、虛空廣稱、滅盡一切煩惱尊，娑嚩訶！唵，吽，紇哩，發吒！',
        'Homage to the Triple Gem! Homage to the Greatly Compassionate Noble Avalokiteśvara! Namely: Oṃ! O Ambrosia-Born, Ambrosia-Arisen, Ambrosia-Womb, Ambrosia-Accomplished, Ambrosia-Blazing, Ambrosia-Abiding, Ambrosia-Striding, Maker of Sky-Vast Renown, Destroyer of all afflictions, svāhā! Oṃ hūṃ hrīḥ phaṭ!',
        ['吉爾吉特梵本', '二合'],
        [
          makeWord('amṛtagarbhe', '阿蜜慄多蘗陛', '甘露胎藏尊', 'O Ambrosial Womb', 'amṛta-garbhā-', 'Voc. Sg. Fem.', '二合'),
          makeWord('amṛtateje', '阿蜜慄多帝際', '甘露威光熾盛尊', 'O Ambrosial Radiance', 'amṛta-tejas-', 'Voc. Sg.'),
          makeWord('oṃ hūṃ hrīḥ phaṭ', '唵吽紇哩發吒', '馬頭明王四字破障心印', 'Oṃ Hūṃ Hrīḥ Phaṭ (Hayagrīva Heart)', 'hūṃ-hrīḥ-phaṭ', 'Bīja-mantra')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T20n1060',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1072A.xml',
      taishoLocation: 'T20, no. 1072A, p. 166a',
      gretilId: 'bsu017_u.htm',
      gretilRawUrl: 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/bsu017_u.htm',
      sanskritEditionCitation: 'Nalinaksha Dutt, Gilgit Manuscripts Vol. I (bsu017_u.htm) & DSBC 16/208',
      tangPhoneticNotes: ['二合', '引'],
      rawExcerpt: 'tadyathā oṃ amṛtodbhave amṛtasambhave amṛtagarbhe amṛtasiddhe amṛtateje',
      crossRefs: {
        taishoIds: ['T20n1072A', 'T20n1072B'],
        fangshanIds: ['F28n1071'],
        tohokuIds: ['Toh 706', 'Toh 931'],
        rktsIds: ['K706', 'D706', 'D931'],
        dsbcIds: ['16/208'],
        gretilIds: ['bsu017_u.htm'],
        buddhaNexusIds: ['K12Xbsu017_u']
      }
    }
  },
  {
    id: 'ekaksara-usnisacakra-mantra',
    titleZh: '一字奇特佛頂輪王真言',
    shortTitleZh: '一字金輪咒',
    titleSanskrit: 'Ekākṣara-uṣṇīṣacakra-rāja-mantra',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Ekākṣara-uṣṇīṣacakra-rāja-mantra', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Ekākṣara-uṣṇīṣacakra-rāja-mantra', 'strict')),
    titleTibetan: 'གཙུག་ཏོར་ཡི་གེ་གཅིག་པའི་འཁོར་ལོས་སྒྱུར་བའི་སྔགས།',
    titleEn: 'Single-Syllable Supreme Uṣṇīṣacakravartin (Oṃ Bhrūṃ) Mantra',
    category: 'buddhas-bodhisattvas',
    deity: '一字金輪佛頂尊 (Ekākṣara-Uṣṇīṣacakravartin)',
    taishoId: 'T19n0953',
    translator: '唐・不空三藏 (Amoghavajra) / 唐・菩提流志 (Bodhiruci) 譯',
    period: '盛唐 (8th Century CE)',
    summaryZh:
      '一切佛頂尊中之最高無上輪王尊。出自《一字奇特佛頂經》（T19n0953）及《一字佛頂輪王經》（T19n0951），《大乘理趣六波羅蜜多經》與藏文《一切法母一字般若經》（Polyglotta `vid=685`）亦詳述一字總攝一切諸法實相之密意。',
    ritualBenefits:
      '如轉輪聖王金輪出現，眾星朗月莫不歸伏；於諸真言後加誦此一字金輪（`oṃ bhrūṃ`），即令諸咒威力倍增速疾成就。',
    verses: [
      makeVerse(
        1,
        '一字金輪佛頂根本真言',
        'namaḥ samanta-buddhānām apratihata-śāsanānām | oṃ bhrūṃ |',
        '曩謨三滿多母馱喃。阿鉢囉底賀多舍娑曩喃。唵。勃籠。',
        '歸命普遍十方諸佛、無礙教令輪者！唵，勃籠（一字金輪大佛頂種子字）！',
        'Homage to the Universal Buddhas whose teachings are unobstructed! Oṃ Bhrūṃ!',
        ['三合', '引'],
        [
          makeWord('samanta-buddhānām', '三滿多母馱喃', '普遍一切諸佛', 'of the Universal Buddhas', 'samanta-buddha-', 'Gen. Pl. Masc.'),
          makeWord('apratihata-śāsanānām', '阿鉢囉底賀多舍娑曩喃', '無礙教令輪者', 'whose teachings are unobstructed', 'apratihata-śāsana-', 'Gen. Pl.'),
          makeWord('oṃ', '唵', '三身法界體性種子字', 'Sacred syllable Oṃ', 'oṃ', 'Bīja'),
          makeWord('bhrūṃ', '勃籠', '一字金輪大佛頂三合引音種子字（bh + r + ū + ṃ）', 'Supreme Ekākṣara-Uṣṇīṣacakra seed syllable Bhrūṃ', 'bhrūṃ', 'Bīja', '三合、引')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T19n0974B',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n0953.xml',
      taishoLocation: 'T19, no. 951, p. 224a; T19, no. 953, p. 286c',
      sanskritEditionCitation: 'Amoghavajra Ekākṣara-buddhoṣṇīṣarāja (T19n0953) & Polyglotta vid=685',
      tangPhoneticNotes: ['三合', '引'],
      rawExcerpt: '曩謨三滿多母馱喃阿鉢囉底賀多舍娑曩喃唵勃籠',
      crossRefs: {
        taishoIds: ['T19n0951', 'T19n0953', 'T19n0957'],
        fangshanIds: ['F28n1071'],
        tohokuIds: ['Toh 600'],
        rktsIds: ['K600', 'D600'],
        polyglottaVids: ['vid=685'],
        muktabodhaOrOchsIds: ['M00247', 'ochs_000_000_030_bijanighantu']
      }
    }
  }
];

/**
 * 12 Primary Esoteric Seed Syllables (`CURATED_SEED_SYLLABLES`)
 */
export const CURATED_SEED_SYLLABLES: SeedSyllable[] = [
  {
    id: 'bija-om',
    iast: 'oṃ',
    slp1: 'oM',
    devanagari: 'ॐ',
    siddham: slp1ToSiddhamUnicode('oM'),
    cbetaSdCode: 'SD-CFC5',
    tangChinese: '唵',
    modernPhonetic: '嗡',
    ipa: '/oːm/',
    deity: '毘盧遮那佛・三身諸佛總持 (Mahāvairocana & All Buddhas)',
    buddhaFamily: 'Tathāgata-kula (佛部總攝五部)',
    aksaraMukhaMeaning: '由 a（法身本不生）+ u（報身受用）+ m（化身大悲隨類）三音合成，總攝歸命、供養、警覺、三身無二之體性。',
    kukaiT84Note: '空海《梵字悉曇字母并釋義》（T84n2701）：「唵字者，三身義、無見頂相義、流注不絕義。」',
    nighantuCodeTerms: ['praṇava', 'tāra', 'setu', 'dhruva', 'trideva']
  },
  {
    id: 'bija-ah',
    iast: 'āḥ',
    slp1: 'AH',
    devanagari: slp1ToDevanagari('AH'),
    siddham: slp1ToSiddhamUnicode('AH'),
    cbetaSdCode: 'SD-A442',
    tangChinese: '阿',
    modernPhonetic: '阿～哈',
    ipa: '/ɑːh/',
    deity: '大日如來・無量光如來語金剛 (Mahāvairocana / Amitābha Vāgvajra)',
    buddhaFamily: 'Tathāgata / Padma-kula (佛部・蓮花部語密)',
    aksaraMukhaMeaning: '阿字本不生門加長音（修行行門）與涅槃止韻（ḥ），表從本不生智發起菩提行、證入大般涅槃。',
    kukaiT84Note: '空海《悉曇字母并釋義》（T84n2701）：「阿字者一切法本不生義，加點畫則具菩提行與大涅槃果。」',
    nighantuCodeTerms: ['visarga', 'ānanda', 'pāśa']
  },
  {
    id: 'bija-hum',
    iast: 'hūṃ',
    slp1: 'hUM',
    devanagari: slp1ToDevanagari('hUM'),
    siddham: slp1ToSiddhamUnicode('hUM'),
    cbetaSdCode: 'SD-A5E5',
    tangChinese: '吽',
    modernPhonetic: '轟',
    ipa: '/ɦuːm/',
    deity: '阿閦如來・金剛手菩薩・五大明王 (Akṣobhya / Vajrapāṇi / Krodha-Vidyārājas)',
    buddhaFamily: 'Vajra-kula (金剛部)',
    aksaraMukhaMeaning: 'h（因業不可得）+ a（本不生）+ ū（損減諸障）+ ṃ（大空菩提心），堅固不壞金剛菩提心種子。',
    kukaiT84Note: '空海《吽字義》（T77n2430）：「賀字門一切法因不可得，烏字門損減義，摩字門吾我不可得，合為金剛部大菩提心。」',
    nighantuCodeTerms: ['kūrca', 'kavaca', 'vyomāsya', 'krodhabīja']
  },
  {
    id: 'bija-hrih',
    iast: 'hrīḥ',
    slp1: 'hrIH',
    devanagari: slp1ToDevanagari('hrIH'),
    siddham: slp1ToSiddhamUnicode('hrIH'),
    cbetaSdCode: 'SD-D957',
    tangChinese: '紇哩',
    modernPhonetic: '赫里希',
    ipa: '/ɦriːh/',
    deity: '阿彌陀佛・千手觀音・如意輪觀音 (Amitābha & Avalokiteśvara)',
    buddhaFamily: 'Padma-kula (蓮花部)',
    aksaraMukhaMeaning: 'h（因不可得）+ r（離諸塵垢）+ ī（自在三昧）+ ḥ（清淨無漏涅槃），代表蓮花部慚愧清淨與大悲拔苦。',
    kukaiT84Note: '《悉曇藏》（T84n2702）：「紇哩字者，蓮華部阿彌陀如來並觀自在菩薩通用種子，具慚愧離垢四字門。」',
    nighantuCodeTerms: ['lajjā', 'padmabīja', 'māyā']
  },
  {
    id: 'bija-bhrum',
    iast: 'bhrūṃ',
    slp1: 'BrUM',
    devanagari: slp1ToDevanagari('BrUM'),
    siddham: slp1ToSiddhamUnicode('BrUM'),
    cbetaSdCode: 'SD-D7C4',
    tangChinese: '勃籠',
    modernPhonetic: '布魯姆',
    ipa: '/bʱruːm/',
    deity: '一字金輪佛頂・佛頂尊勝佛母 (Ekākṣara-Uṣṇīṣacakra & Uṣṇīṣavijayā)',
    buddhaFamily: 'Uṣṇīṣa-Cakravartin (佛頂輪王部)',
    aksaraMukhaMeaning: 'bh（諸法離有無諦相）+ r（離塵）+ ū（最勝增益）+ ṃ（法界無盡），統領一切佛頂尊之最高輪王印。',
    kukaiT84Note: '《一字奇特佛頂經》（T19n0953）：「勃籠一字頂輪王，一切如來無見頂相之總體。」',
    nighantuCodeTerms: ['cakravartibīja', 'uṣṇīṣabīja']
  },
  {
    id: 'bija-dhih',
    iast: 'dhīḥ',
    slp1: 'DIH',
    devanagari: slp1ToDevanagari('DIH'),
    siddham: slp1ToSiddhamUnicode('DIH'),
    cbetaSdCode: 'SD-A5A8',
    tangChinese: '諦',
    modernPhonetic: '迪希',
    ipa: '/d̪ʱiːh/',
    deity: '大智文殊師利菩薩 (Mañjuśrī Jñānasattva)',
    buddhaFamily: 'Prajñā / Vajra-tīkṣṇa (金剛利般若部)',
    aksaraMukhaMeaning: 'dh（dharmadhātu 法界甚深）+ ī（禪定智慧自在）+ ḥ（斷除二障），代表般若波羅蜜多金剛利劍。',
    kukaiT84Note: '《文殊五字瑜伽》（T20n1173）：「諦字者，般若勝慧義，能斷一切無明分別網。」',
    nighantuCodeTerms: ['prajñābīja', 'buddhi', 'medhā']
  },
  {
    id: 'bija-srim',
    iast: 'śrīṃ',
    slp1: 'SrIM',
    devanagari: slp1ToDevanagari('SrIM'),
    siddham: slp1ToSiddhamUnicode('SrIM'),
    cbetaSdCode: 'SD-D5B4',
    tangChinese: '室哩',
    modernPhonetic: '什里姆',
    ipa: '/ɕriːm/',
    deity: '大吉祥天女・寶生如來眷屬 (Śrī-Mahādevī / Mahālakṣmī)',
    buddhaFamily: 'Ratna-kula (寶部・增益部)',
    aksaraMukhaMeaning: 'ś（本性寂靜 śānti）+ r（離垢）+ ī（廣大自在）+ ṃ（福智圓滿），能生世出世間無盡功德珍寶。',
    kukaiT84Note: '《大吉祥天女經》：「室哩者，吉祥福德聚義。」',
    nighantuCodeTerms: ['lakṣmībīja', 'śrībīja', 'ramā', 'sampat']
  },
  {
    id: 'bija-krim',
    iast: 'krīṃ',
    slp1: 'krIM',
    devanagari: slp1ToDevanagari('krIM'),
    siddham: slp1ToSiddhamUnicode('krIM'),
    cbetaSdCode: 'SD-A661',
    tangChinese: '訖哩',
    modernPhonetic: '克里姆',
    ipa: '/kriːm/',
    deity: '大黑天・金剛亥母・除障明王 (Mahākāla / Vajravārāhī)',
    buddhaFamily: 'Karma / Krodha-kula (事業部・忿怒部)',
    aksaraMukhaMeaning: 'k（作業無作 kārya）+ r（智火焚障）+ ī（大自在力）+ ṃ（攝歸空性），速疾摧滅魔障與生死業縛。',
    kukaiT84Note: '《悉曇字記》：「迦字合囉字引伊音加點，名訖哩，大威德事業種子。」',
    nighantuCodeTerms: ['kālībīja', 'ādyābīja', 'krodha']
  },
  {
    id: 'bija-aim',
    iast: 'aiṃ',
    slp1: 'EM',
    devanagari: slp1ToDevanagari('EM'),
    siddham: slp1ToSiddhamUnicode('EM'),
    cbetaSdCode: 'SD-A456',
    tangChinese: '藹',
    modernPhonetic: '愛姆',
    ipa: '/ɐi̯m/',
    deity: '妙音佛母・白文殊・語金剛 (Sarasvatī / Sita-Mañjughoṣa)',
    buddhaFamily: 'Vāg-vajra (語金剛・大辯才部)',
    aksaraMukhaMeaning: 'ai（大自在法音教化）+ ṃ（無盡總持），開顯四無礙解與六十四梵音妙智。',
    kukaiT84Note: '空海《悉曇字母并釋義》（T84n2701）：「愛（ai）字者，自在教化眾生義。」',
    nighantuCodeTerms: ['vāgbhavabīja', 'sārasvata', 'vāṇī']
  },
  {
    id: 'bija-klim',
    iast: 'klīṃ',
    slp1: 'klIM',
    devanagari: slp1ToDevanagari('klIM'),
    siddham: slp1ToSiddhamUnicode('klIM'),
    cbetaSdCode: 'SD-A6B2',
    tangChinese: '訖哩',
    modernPhonetic: '克里姆',
    ipa: '/kliːm/',
    deity: '愛染明王・作明佛母 (Rāgarāja / Kurukullā)',
    buddhaFamily: 'Vajra-rāga / Padma-ākarṣaṇa (敬愛鉤召部)',
    aksaraMukhaMeaning: 'k（大悲作業）+ l（相好離垢 lakṣaṇa）+ ī（三昧攝受）+ ṃ（染淨不二），轉染愛為大菩提大悲鉤召。',
    kukaiT84Note: '《瑜祇經》系統：「攝一切眾生愛染心同歸法界大菩提之鉤召種子。」',
    nighantuCodeTerms: ['kāmabīja', 'manmatha', 'mohana', 'ākarṣaṇī']
  },
  {
    id: 'bija-phat',
    iast: 'phaṭ',
    slp1: 'Paw',
    devanagari: slp1ToDevanagari('Paw'),
    siddham: slp1ToSiddhamUnicode('Paw'),
    cbetaSdCode: 'SD-A592',
    tangChinese: '發吒',
    modernPhonetic: '帕特',
    ipa: '/pʰɐʈ/',
    deity: '大威德明王・穢跡金剛・大白傘蓋 (Yamāntaka / Ucchuṣma / Sitātapatrā)',
    buddhaFamily: 'Vidyārāja-Astra (明王破障金剛仗印)',
    aksaraMukhaMeaning: 'ph（phala 果德頓顯）+ aṭ（摧破無明四魔），密咒結尾之金剛破障結界音（Astramantra）。',
    kukaiT84Note: '《一切經音義》（T54n2128）：「發吒，二合，梵語破障摧伏之聲。」',
    nighantuCodeTerms: ['astramantra', 'vidāraṇa', 'visphoṭana']
  },
  {
    id: 'bija-svaha',
    iast: 'svāhā',
    slp1: 'svAhA',
    devanagari: slp1ToDevanagari('svAhA'),
    siddham: slp1ToSiddhamUnicode('svAhA'),
    cbetaSdCode: 'SD-CFCA',
    tangChinese: '娑嚩訶',
    modernPhonetic: '斯哇～哈～',
    ipa: '/sʋɑːɦɑː/',
    deity: '一切諸佛菩薩息災增益圓滿結印 (Universal Peaceful & Accomplishing Terminus)',
    buddhaFamily: 'Sarva-kula (普門總攝圓滿成就)',
    aksaraMukhaMeaning: 'su-āha（善說、真實語）或 sva-āhā（自性清淨供養），息災、增益諸陀羅尼究竟圓滿成就之結尾聖語。',
    kukaiT84Note: '《悉曇藏》（T84n2702）：「娑嚩訶具有六義：成就義、吉祥義、圓寂義、息災義、增益義、無住義。」',
    nighantuCodeTerms: ['vahnijāyā', 'hutāśanī', 'śāntikam']
  }
];
