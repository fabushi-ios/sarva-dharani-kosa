/**
 * src/data/corpus/ten-small-dharanis.ts
 * Complete Ten Small Dhāraṇīs Corpus (十小咒全集)
 */

import type { DharaniItem, DharaniVerse, WordGloss } from '../../types/dharani';
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

export const TEN_SMALL_DHARANIS: DharaniItem[] = [
  {
    id: 'cintamanicakra-dharani',
    titleZh: '如意寶輪王陀羅尼',
    shortTitleZh: '如意輪咒',
    titleSanskrit: 'Cintāmaṇicakra-dhāraṇī',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Cintāmaṇicakra-dhāraṇī', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Cintāmaṇicakra-dhāraṇī', 'strict')),
    titleTibetan: 'ཡིད་བཞིན་གྱི་ནོར་བུ་འཁོར་ལོས་སྒྱུར་བའི་གཟུངས།',
    titleEn: 'Cintāmaṇicakra (Wish-Fulfilling Gem Wheel) Dhāraṇī',
    category: 'ten-small-dharanis',
    deity: '如意輪觀自在菩薩 (Cintāmaṇicakra Avalokiteśvara)',
    taishoId: 'T20n1080',
    translator: '唐・菩提流志 (Bodhiruci) / 唐・義淨 (Yijing) 譯',
    period: '唐景龍三年 (709 CE)',
    summaryZh:
      '十小咒之首。出自《如意輪陀羅尼經》（T20n1080），全經附有89組唐代 `<cb:tt>` 悉曇梵漢對音，包含根本陀羅尼、大心陀羅尼（`oṃ padma cintāmaṇi jvala hūṃ`）與隨心陀羅尼（`oṃ varada padme hūṃ`）。',
    ritualBenefits:
      '如摩尼寶珠與轉輪聖王寶輪，能滿一切有情世出世間善願，消除病苦災厄，獲大智慧辩才。',
    cbetaInterlinearXmlId: 'T20n1080',
    verses: [
      makeVerse(
        1,
        '根本咒・大心咒・隨心咒合誦',
        'namo buddhāya namo dharmāya namaḥ saṃghāya | namo āryāvalokiteśvarāya bodhisattvāya mahāsattvāya mahākāruṇikāya | tadyathā oṃ cakra-vartin cintāmaṇi mahāpadme ruru tiṣṭha jvala ākarṣāya hūṃ phaṭ svāhā | oṃ padma cintāmaṇi jvala hūṃ | oṃ varada padme hūṃ |',
        '南無佛馱耶。南無達摩耶。南無僧伽耶。南無觀自在菩薩摩訶薩。具大悲心者。怛姪他。唵。斫羯囉伐底。震多末尼。摩訶鉢蹬謎。嚕嚕嚕嚕。底瑟。篅囉阿羯利沙也。吽。篅。莎訶。唵。鉢蹋摩。震多末尼。篅囉吽。唵。跋陀。鉢亶謎。吽。',
        '歸命佛、法、僧！歸命大悲聖觀自在菩薩摩訶薩！即說咒曰：唵！轉法輪王、如意寶珠、大蓮花尊，光明安住、熾燃攝召，吽！泮！莎訶！唵，蓮花如意寶珠放光，吽！唵，施願蓮花尊，吽！',
        'Homage to the Buddha, Dharma, and Saṃgha! Homage to the Greatly Compassionate Noble Avalokiteśvara! Namely: Oṃ! O Wheel-Turner, Wish-Fulfilling Gem, Great Lotus! Shine, abide, blaze, draw near, hūṃ phaṭ svāhā! Oṃ Lotus Wish-Fulfilling Gem blaze hūṃ! Oṃ Boon-Granting Lotus hūṃ!',
        ['二合', '引'],
        [
          makeWord('cakra-vartin', '斫羯囉伐底', '轉輪聖王、轉寶輪尊', 'O Wheel-Turner', 'cakravartin-', 'Voc. Sg. Masc.', '二合'),
          makeWord('cintāmaṇi', '震多末尼', '如意寶珠', 'O Wish-Fulfilling Gem', 'cintā-maṇi-', 'Voc. Sg.'),
          makeWord('mahāpadme', '摩訶鉢蹬謎', '大蓮花尊', 'O Great Lotus', 'mahā-padmā-', 'Voc. Sg. Fem.', '二合'),
          makeWord('jvala ākarṣāya', '篅囉阿羯利沙也', '放光熾盛、鉤召攝引', 'Blaze and attract!', '√jval- + ā-√kṛṣ-', 'Imperative', '二合'),
          makeWord('varada', '跋陀', '施願尊、與願者', 'O Bestower of Boons', 'vara-da-', 'Voc. Sg.')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T20n1080',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1080.xml',
      taishoLocation: 'T20, no. 1080, p. 188c–190a',
      sanskritEditionCitation: 'Bodhiruci Siddhaṃ-Chinese Interlinear Edition (T20n1080, 89 <cb:tt> pairs) & Toh 692',
      tangPhoneticNotes: ['二合', '引'],
      rawExcerpt: '<cb:tt><cb:t xml:lang="sa-Sidd"><g ref="#SD-A5A9"/></cb:t><cb:t xml:lang="zh-Hant">曩</cb:t></cb:tt>',
      crossRefs: {
        taishoIds: ['T20n1080', 'T20n1082', 'T20n1083'],
        fangshanIds: ['F28n1071'],
        tohokuIds: ['Toh 692'],
        rktsIds: ['K692', 'D692'],
        dsbcIds: ['820/2949']
      }
    }
  },
  {
    id: 'jvala-mahaugra-dharani',
    titleZh: '消災吉祥神咒（佛說熾盛光大威德消災吉祥陀羅尼）',
    shortTitleZh: '消災吉祥神咒',
    titleSanskrit: 'Tejaprabhā-mahābalavega-jvālā-mahaugra-dhāraṇī',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Tejaprabhā-mahābalavega-jvālā-mahaugra-dhāraṇī', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Tejaprabhā-mahābalavega-jvālā-mahaugra-dhāraṇī', 'strict')),
    titleTibetan: 'གཙུག་ཏོར་འབར་བའི་གཟུངས།',
    titleEn: 'Blazing Light (Tejaprabhā) Disaster-Averting Auspicious Dhāraṇī',
    category: 'ten-small-dharanis',
    deity: '熾盛光佛頂如來 (Tejaprabhā Buddha / Uṣṇīṣa-Jvālā)',
    taishoId: 'T19n0963',
    translator: '唐・不空三藏 (Amoghavajra) 譯',
    period: '盛唐 (8th Century CE)',
    summaryZh:
      '十小咒之二。出自不空三藏譯《佛說熾盛光大威德消災吉祥陀羅尼經》（T19n0963）及宋慈賢譯房山石經《大威德熾盛光如來陀羅尼經》（F28n1071）。',
    ritualBenefits:
      '息滅日月薄蝕、五星廿八宿凌逼本命宿之災厄，轉一切不祥為大吉祥。',
    verses: [
      makeVerse(
        1,
        '熾盛光消災吉祥根本真言',
        'namaḥ samanta-buddhānām apratihata-śāsanānām | tadyathā oṃ khā khā khāhi khāhi hūṃ hūṃ jvala jvala prajvala prajvala tiṣṭha tiṣṭha ṣṭri ṣṭri sphoṭa sphoṭa śāntika śrīye svāhā |',
        '曩謨三滿多母馱喃。阿鉢囉底賀多舍娑曩喃。怛姪他。唵。佉佉。佉呬佉呬。吽吽。入嚩囉入嚩囉。鉢囉入嚩囉鉢囉入嚩囉。底瑟姹底瑟姹。瑟致哩瑟致哩。娑癹吒娑癹吒。扇底迦。室哩曳。娑嚩訶。',
        '歸命普遍諸佛、無礙教令輪者！即說咒曰：唵！虛空等持，吞啖一切災障！吽、吽！放光熾燃、極大熾燃，堅固安住，摧裂一切星曜惡障，成就息災（扇底迦）與大吉祥（室哩曳），娑嚩訶！',
        'Homage to the Universal Buddhas whose teachings are unobstructed! Namely: Oṃ! Devour, devour all calamities! Hūṃ hūṃ! Blaze, blaze, blaze forth! Abide firm! Shatter, shatter! For pacification (śāntika) and auspiciousness (śrīye), svāhā!',
        ['二合', '引'],
        [
          makeWord('samanta-buddhānām', '三滿多母馱喃', '普遍一切諸佛', 'of the Universal Buddhas', 'samanta-buddha-', 'Gen. Pl. Masc.'),
          makeWord('apratihata-śāsanānām', '阿鉢囉底賀多舍娑曩喃', '教令無有障礙者', 'whose teachings are unobstructed', 'apratihata-śāsana-', 'Gen. Pl.', '二合'),
          makeWord('jvala jvala prajvala prajvala', '入嚩囉入嚩囉鉢囉入嚩囉鉢囉入嚩囉', '熾燃放光、極大放光', 'Blaze, blaze, blaze intensely!', '√jval- / pra-√jval-', '2nd Sg. Imperative', '二合'),
          makeWord('śāntika', '扇底迦', '息災增益法', 'pacification of calamities', 'śāntika-', 'Stem/Adj.'),
          makeWord('śrīye', '室哩曳', '為成就大吉祥故', 'for auspiciousness and glory', 'śrī-', 'Dat. Sg. Fem. (第四格)', '二合')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T19n0963',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n0963.xml',
      taishoLocation: 'T19, no. 963, p. 337b–c',
      sanskritEditionCitation: 'Amoghavajra Edition (T19n0963) & Fangshan Stone Canon F28n1071',
      tangPhoneticNotes: ['二合', '引'],
      rawExcerpt: '曩謨三滿多母馱喃阿鉢囉底賀多舍娑曩喃怛姪他唵佉佉佉呬佉呬',
      crossRefs: {
        taishoIds: ['T19n0963', 'T19n0964'],
        fangshanIds: ['F28n1071']
      }
    }
  },
  {
    id: 'guna-ratnasila-dharani',
    titleZh: '功德寶山神咒',
    shortTitleZh: '功德寶山咒',
    titleSanskrit: 'Guṇaratnaśaila-dhāraṇī',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Guṇaratnaśaila-dhāraṇī', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Guṇaratnaśaila-dhāraṇī', 'strict')),
    titleEn: 'Merit-Jewel Mountain (Guṇaratnaśaila) Dhāraṇī',
    category: 'ten-small-dharanis',
    deity: '十方三寶暨大悲圓滿諸尊 (Triratna & Siddha-Vidyā)',
    taishoId: 'T20n1075',
    translator: '唐宋密藏傳承（收於《密咒圓因往生集》T46n1956）',
    period: '唐宋 (8th–12th Century CE)',
    summaryZh:
      '十小咒之三。源出《大集經》與《密咒圓因往生集》，讚歎三寶無量功德猶如須彌寶山，持誦一返同禮大佛名經四萬五千四百遍。',
    ritualBenefits:
      '縱造重罪，臨命終時任持此咒，不墮阿鼻地獄，決定往生西方極樂世界。',
    verses: [
      makeVerse(
        1,
        '功德寶山神咒全文',
        'namo buddhāya namo dharmāya namaḥ saṃghāya | oṃ siddhe huru huru siddhūru kṛpā-kṛpā siddhāṇi puruṇi svāhā |',
        '南無佛耶。南無達摩耶。南無僧伽耶。唵。悉帝護嚧嚕。悉都嚧。只利波。吉利婆。悉達哩。布嚧哩。娑嚩訶。',
        '歸命佛、法、僧三寶！唵！妙成就尊，速疾成就，具大悲心、大慈愍心，令一切悉地圓滿遍滿，娑嚩訶！',
        'Homage to the Buddha, Dharma, and Saṃgha! Oṃ! O Accomplished One, swiftly accomplish through great compassion (kṛpā-kṛpā), fulfill all siddhis completely, svāhā!',
        ['二合', '引'],
        [
          makeWord('siddhe', '悉帝', '妙成就尊', 'O Accomplished Siddhi', 'siddhā-', 'Voc. Sg. Fem.'),
          makeWord('huru huru', '護嚧嚕', '速疾加持', 'Swiftly, swiftly!', 'huru', 'Indecl.'),
          makeWord('kṛpā-kṛpā', '只利波吉利婆', '大悲、大悲愍', 'Compassion, compassion!', 'kṛpā-', 'Nom./Voc. Sg. Fem.', '二合'),
          makeWord('puruṇi', '布嚧哩', '圓滿充遍者', 'O Fulfiller', 'pūraṇī-', 'Voc. Sg. Fem.')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T20n1075',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1075.xml',
      taishoLocation: 'T46, no. 1956, p. 1009b',
      sanskritEditionCitation: 'Xixia/Song Esoteric Compendium《密咒圓因往生集》& Fangshan F28n1071',
      tangPhoneticNotes: ['二合'],
      rawExcerpt: '南無佛馱耶南無達摩耶南無僧伽耶唵悉帝護嚧嚕悉都嚧只利波吉利婆悉達哩布嚧哩娑嚩訶',
      crossRefs: {
        taishoIds: ['T20n1075'],
        fangshanIds: ['F28n1071']
      }
    }
  },
  {
    id: 'mahacundi-dharani',
    titleZh: '佛母準提神咒（七俱胝佛母心大準提陀羅尼）',
    shortTitleZh: '準提神咒',
    titleSanskrit: 'Saptakoṭi-buddhamātṛ-cundī-dhāraṇī',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Saptakoṭi-buddhamātṛ-cundī-dhāraṇī', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Saptakoṭi-buddhamātṛ-cundī-dhāraṇī', 'strict')),
    titleTibetan: 'སངས་རྒྱས་བྱེ་བ་ཕྲག་བདུན་གྱི་ཡུམ་ཙུནྡེའི་གཟུངས།',
    titleEn: 'Cundī Bodhisattva (Mother of Seven Koṭis of Buddhas) Dhāraṇī',
    category: 'ten-small-dharanis',
    deity: '七俱胝佛母準提觀音 (Mahācundī Bhagavatī)',
    taishoId: 'T20n1075',
    translator: '唐・金剛智 (Vajrabodhi) / 地婆訶羅 (Divākara) / 不空 (Amoghavajra) 譯',
    period: '盛唐開元十一年 (723 CE)',
    summaryZh:
      '十小咒之四。唐密「開元三大士」（善無畏、金剛智、不空）共譯之大法，不問在家出家、飲酒食肉、有妻子否，但至心持誦，使短命眾生增壽無量，所求悉地速得成就。',
    ritualBenefits:
      '滅十惡五逆一切重罪，成就一切白法功德，與一字金輪佛頂咒（`oṃ bhrūṃ`）合誦如日月交輝。',
    cbetaInterlinearXmlId: 'T20n1075',
    verses: [
      makeVerse(
        1,
        '七俱胝佛母準提根本真言暨一字金輪心印',
        'namaḥ saptānāṃ samyaksaṃbuddha-koṭīnām | tadyathā oṃ cale cule cundī svāhā | oṃ bhrūṃ |',
        '稽首皈依蘇悉帝，頭面頂禮七俱胝，我今稱讚大準提，唯願慈悲垂加護。南無颯哆喃。三藐三菩陀。俱胝喃。怛姪他。唵。折戾主戾。準提。娑婆訶。唵。部林。',
        '歸命七千萬億正遍知佛陀！即說咒曰：唵！遊行覺動尊、清淨升起尊、大清淨準提佛母，娑婆訶！唵，部林（一字金輪）！',
        'Homage to the seven koṭis of Perfectly Awakened Buddhas! Namely: Oṃ! O Moving One (cale), Rising One (cule), Pure Cundī, svāhā! Oṃ bhrūṃ!',
        ['二合', '引'],
        [
          makeWord('saptānāṃ', '颯哆喃', '七數之', 'of the seven', 'saptan-', 'Gen. Pl.', '二合'),
          makeWord('samyaksaṃbuddha-koṭīnām', '三藐三菩陀俱胝喃', '正遍知百千萬億佛眾', 'of koṭis of Perfectly Awakened Buddhas', 'samyak-saṃbuddha-koṭi-', 'Gen. Pl.'),
          makeWord('cale', '折戾', '覺動尊、遊行大悲尊', 'O Moving / Courser in Karuṇā', 'calā-', 'Voc. Sg. Fem.'),
          makeWord('cule', '主戾', '湧現高顯尊', 'O Rising / Exalted Peak', 'culā-', 'Voc. Sg. Fem.'),
          makeWord('cundī', '準提', '清淨無垢佛母尊', 'O Pure Cundī Bhagavatī', 'cundī-', 'Voc./Nom. Sg. Fem.')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T20n1075',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1075.xml',
      taishoLocation: 'T20, no. 1075, p. 173a–178c',
      sanskritEditionCitation:
        'Vajrabodhi (T20n1075), Amoghavajra (T20n1077), 84000 Toh 613/989 & CUDL MS Add. 1680.8',
      tangPhoneticNotes: ['二合', '引'],
      rawExcerpt: '南無颯哆喃三藐三菩陀俱胝喃怛姪他唵折戾主戾準提娑婆訶',
      crossRefs: {
        taishoIds: ['T20n1075', 'T20n1076', 'T20n1077'],
        fangshanIds: ['F28n1071', 'F27n1060'],
        tohokuIds: ['Toh 613', 'Toh 989'],
        rktsIds: ['K613', 'D613', 'D989'],
        dsbcIds: ['820/2949'],
        cudlMsIds: ['MS-ADD-01680-00008-00001']
      }
    }
  },
  {
    id: 'aparimitayur-jnana-dharani',
    titleZh: '聖無量壽決定光明王陀羅尼',
    shortTitleZh: '無量壽決定光明王咒',
    titleSanskrit: 'Ārya-aparimitāyur-jñāna-suviniścita-tejorāja-dhāraṇī',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Ārya-aparimitāyur-jñāna-suviniścita-tejorāja-dhāraṇī', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Ārya-aparimitāyur-jñāna-suviniścita-tejorāja-dhāraṇī', 'strict')),
    titleTibetan: 'འཕགས་པ་ཚེ་དང་ཡེ་ཤེས་དཔག་ཏུ་མེད་པ་ཤིན་ཏུ་ངེས་པ་གཟི་བརྗིད་ཀྱི་རྒྱལ་པོའི་གཟུངས།',
    titleEn: 'Noble Aparimitāyur-jñāna Suviniścita-tejorāja (Infinite Life and Wisdom) Dhāraṇī',
    category: 'ten-small-dharanis',
    deity: '聖無量壽決定光明王如來 (Aparimitāyur-jñāna Tathāgata / Amitāyus)',
    taishoId: 'T19n0936',
    translator: '唐・法成 (Chos grub) / 宋・法天 (Dharmadeva) 譯',
    period: '晚唐敦煌時期 (9th Century CE)',
    summaryZh:
      '十小咒之五。梵本完存於 GRETIL (bsu003_u.htm) 及尼泊爾 DSBC，敦煌大譯師法成自梵藏譯出《大乘聖無量壽決定光明王如來陀羅尼經》（T19n0936），於西域、敦煌（IDP Pelliot / Stein 寫卷）流傳極廣。',
    ritualBenefits:
      '若人短壽，至心持誦或書寫供養此陀羅尼，即得增延百歲無量壽命，臨終往生無量壽佛極樂剎土。',
    gretilRecordId: 'gretil-bsu003',
    verses: [
      makeVerse(
        1,
        '無量壽決定光明王根本真言',
        'oṃ namo bhagavate aparimitāyur-jñāna-suviniścita-tejorājāya tathāgatāyārhate samyaksaṃbuddhāya | tadyathā oṃ puṇye puṇye mahāpuṇye aparimita-puṇye aparimita-puṇya-jñāna-saṃbhāropacite | oṃ sarva-saṃskāra-pariśuddha-dharmate gagana-samudgate svabhāva-viśuddhe mahānaya-parivāre svāhā |',
        '唵。南無婆伽嚩帝。阿巴囉密沓。阿優哩阿納。蘇必你實執沓。牒左囉宰也。怛塔哿達也。阿囉訶帝。三藥三不達也。怛你也塔。唵。薩哩嚩。桑斯葛哩。叭哩述沓。達囉馬帝。哿哿捺。桑馬兀哿帝。莎巴嚩。比述帝。馬喝捺也。叭哩嚩哩。娑喝。',
        '唵！歸命世尊・無量壽智決定光明王如來・應供・正遍知！即說咒曰：唵！福德、大福德、無量福德、積集無量福智資糧者！唵！一切諸行遍清淨法性、如虛空普皆湧現、自性清淨、大乘眷屬圓滿者，娑嚩訶！',
        'Oṃ! Homage to the Blessed One, Aparimitāyur-jñāna-suviniścita-tejorāja, Tathāgata, Arhat, Perfectly Awakened One! Namely: Oṃ! O Merit, Great Merit, Infinite Merit, accumulated store of infinite merit and wisdom! Oṃ! O Dharma-nature pure in all formations, risen like the sky, intrinsically pure, surrounded by the Great Vehicle retinue, svāhā!',
        ['二合', '引'],
        [
          makeWord('aparimitāyur-jñāna', '阿巴囉密沓阿優哩阿納', '無量壽命與智慧', 'infinite life and wisdom', 'aparimita-āyus-jñāna-', 'Stem'),
          makeWord('suviniścita-tejorājāya', '蘇必你實執沓牒左囉宰也', '決定光明王', 'to the King of Well-Ascertained Radiance', 'suviniścita-tejorāja-', 'Dat. Sg. Masc.'),
          makeWord('puṇye mahāpuṇye', '布摩訶布', '福德、大福德尊', 'O Merit, Great Merit!', 'puṇyā-', 'Voc. Sg. Fem.'),
          makeWord('sarva-saṃskāra-pariśuddha-dharmate', '薩哩嚩桑斯葛哩叭哩述沓達囉馬帝', '一切行遍清淨法界性', 'O Dharma-nature pure of all conditioned formations', 'sarva-saṃskāra-pariśuddha-dharmatā-', 'Voc. Sg. Fem.')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T19n0936',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n0936.xml',
      taishoLocation: 'T19, no. 936, p. 81c–82c',
      gretilId: 'bsu003_u.htm',
      gretilRawUrl: 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/bsu003_u.htm',
      sanskritEditionCitation: 'DSBC Sutra no. 3 (bsu003_u.htm) & 84000 Toh 674/675/849',
      tangPhoneticNotes: ['二合', '引'],
      rawExcerpt: 'oṃ namo bhagavate aparimitāyurjñānasuviniścitatejorājāya tathāgatāyārhate samyaksaṃbuddhāya',
      crossRefs: {
        taishoIds: ['T19n0936', 'T19n0937'],
        fangshanIds: ['F28n1071'],
        tohokuIds: ['Toh 674', 'Toh 675', 'Toh 849'],
        rktsIds: ['K674', 'D674', 'D849'],
        dsbcIds: ['3/195'],
        gretilIds: ['bsu003_u.htm'],
        buddhaNexusIds: ['K12bsu003_u'],
        idpOrCetomIds: ['IOL Tib J 310']
      }
    }
  },
  {
    id: 'bhaisajyaguru-abhisecani-dharani',
    titleZh: '藥師灌頂真言',
    shortTitleZh: '藥師咒',
    titleSanskrit: 'Bhaiṣajyaguru-vaiḍūryaprabharāja-dhāraṇī',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Bhaiṣajyaguru-vaiḍūryaprabharāja-dhāraṇī', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Bhaiṣajyaguru-vaiḍūryaprabharāja-dhāraṇī', 'strict')),
    titleTibetan: 'སྨན་གྱི་བླ་བཻ་ཌཱུརྱ་འོད་ཀྱི་རྒྱལ་པོའི་གཟུངས།',
    titleEn: 'Medicine Buddha (Bhaiṣajyaguru Vaiḍūryaprabharāja) Consecration Dhāraṇī',
    category: 'ten-small-dharanis',
    deity: '東方淨琉璃世界藥師琉璃光如來 (Bhaiṣajyaguru Vaiḍūryaprabharāja)',
    taishoId: 'T14n0450',
    translator: '唐・玄奘三藏 (Xuanzang) / 唐・義淨三藏 (Yijing) 譯',
    period: '唐永徽元年 (650 CE)',
    summaryZh:
      '十小咒之六。出自《藥師琉璃光如來本願功德經》（T14n0450）及《藥師琉璃光七佛本願功德經》（T14n0451）。吉爾吉特（Gilgit）樺樹皮寫本梵本完整保存於 GRETIL (bsu012_u.htm)，奧斯陸大學 Polyglotta (vid=1020) 具梵漢藏逐句對勘。',
    ritualBenefits:
      '拔除一切眾生身心病苦，水火刀兵、橫病厄難皆得消散，現世安樂，臨終八大菩薩接引生淨琉璃世界。',
    gretilRecordId: 'gretil-bsu012',
    verses: [
      makeVerse(
        1,
        '藥師琉璃光如來灌頂真言',
        'namo bhagavate bhaiṣajyaguru-vaiḍūrya-prabha-rājāya tathāgatāyārhate samyaksaṃbuddhāya | tadyathā oṃ bhaiṣajye bhaiṣajye mahābhaiṣajye bhaiṣajya-samudgate svāhā |',
        '南謨薄伽伐帝。鞞殺社窶嚕。薜琉璃。鉢喇婆。喝囉闍也。怛他揭多耶。阿囉喝帝。三藐三勃陀耶。怛姪他。唵。鞞殺逝。鞞殺逝。鞞殺社。三沒揭帝。莎訶。',
        '歸命世尊・藥師琉璃光王如來・應供・正遍知！即說咒曰：唵！妙藥尊、妙藥尊、大法藥尊，令一切眾生由法藥普皆升進解脫，莎訶！',
        'Homage to the Blessed One, Bhaiṣajyaguru Vaiḍūryaprabharāja, Tathāgata, Arhat, Perfectly Awakened One! Namely: Oṃ! O Healing Medicine, Healing Medicine, Great Medicine, Risen to Supreme Healing, svāhā!',
        ['二合', '引'],
        [
          makeWord('bhaiṣajyaguru', '鞞殺社窶嚕', '藥師尊', 'Medicine Master / Guru', 'bhaiṣajya-guru-', 'Stem'),
          makeWord('vaiḍūrya-prabha-rājāya', '薜琉璃鉢喇婆喝囉闍也', '琉璃光王', 'to the King of Lapis Lazuli Light', 'vaiḍūrya-prabha-rāja-', 'Dat. Sg. Masc.', '二合'),
          makeWord('bhaiṣajye', '鞞殺逝', '妙藥、療癒法藥', 'O Healing Remedy', 'bhaiṣajya-', 'Loc./Voc. Sg.'),
          makeWord('mahābhaiṣajye', '摩訶鞞殺逝', '大法藥', 'O Great Remedy', 'mahā-bhaiṣajya-', 'Loc./Voc. Sg.'),
          makeWord('samudgate', '三沒揭帝', '普皆升起、究竟解脫', 'O One risen to transcendence', 'sam-ud-gata-', 'Voc. Sg.')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T14n0450',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T14/T14n0450.xml',
      taishoLocation: 'T14, no. 450, p. 406c',
      gretilId: 'bsu012_u.htm',
      gretilRawUrl: 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/bsu012_u.htm',
      sanskritEditionCitation:
        'P.L. Vaidya (1961), Bhaiṣajyaguruvaidūryaprabharājasūtra (BST 17, bsu012_u.htm) & Oslo Polyglotta vid=1020',
      tangPhoneticNotes: ['二合'],
      rawExcerpt: 'namo bhagavate bhaiṣajyaguruvaidūryaprabharājāya tathāgatāyārhate samyaksaṃbuddhāya',
      crossRefs: {
        taishoIds: ['T14n0450', 'T14n0451'],
        fangshanIds: ['F28n1071'],
        tohokuIds: ['Toh 504', 'Toh 862'],
        rktsIds: ['K504', 'D504', 'D862'],
        dsbcIds: ['12'],
        gretilIds: ['bsu012_u.htm'],
        buddhaNexusIds: ['K12bsu012_u'],
        polyglottaVids: ['vid=1020']
      }
    }
  },
  {
    id: 'aryavalokitesvara-vikurvana-dharani',
    titleZh: '觀音靈感真言',
    shortTitleZh: '觀音靈感咒',
    titleSanskrit: 'Āryāvalokiteśvara-bodhisattva-vikurvaṇa-dhāraṇī',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Āryāvalokiteśvara-bodhisattva-vikurvaṇa-dhāraṇī', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Āryāvalokiteśvara-bodhisattva-vikurvaṇa-dhāraṇī', 'strict')),
    titleEn: 'Miraculous Manifestation Dhāraṇī of Noble Avalokiteśvara',
    category: 'ten-small-dharanis',
    deity: '聖觀自在菩薩 (Ārya-Avalokiteśvara)',
    taishoId: 'T20n1060',
    translator: '唐宋密教課誦傳承',
    period: '唐宋 (8th–12th Century CE)',
    summaryZh:
      '十小咒之七。首句即六字大明咒（`oṃ maṇi padme hūṃ`），次讚觀音菩薩發大智菩提心、一念應現無量神通事業，結歸世間自在王（`namo lokeśvarāya svāhā`）。',
    ritualBenefits:
      '至心持誦，觀音菩薩即時尋聲救苦，有求必應，解除急難恐怖。',
    verses: [
      makeVerse(
        1,
        '觀音靈感真言全文',
        'oṃ maṇi padme hūṃ | mahājñāna-cittotpāda-citta-kṣaṇa-vitarka sarvārtha-bhūri-siddhaka-nāma-purāṇa bhūri-uttama | namo lokeśvarāya svāhā |',
        '唵。嘛呢叭咪吽。麻曷倪牙納。積都特巴達。積特些納。微達哩葛。薩而斡而塔。卜哩悉塔葛。納補囉納。納卜哩。丟忒班納。捺麻嚧吉。說囉耶。娑訶。',
        '唵！蓮花寶珠，吽！發起大智菩提心、一剎那心遍思惟，廣大成就一切義利、圓滿究竟最勝尊！歸命世間自在王，娑訶！',
        'Oṃ maṇi padme hūṃ! O Generation of the Mind of Great Wisdom, discerning in a single moment of thought, vast accomplisher of all aims, supreme and complete! Homage to Lokeśvara, svāhā!',
        ['二合'],
        [
          makeWord('oṃ maṇi padme hūṃ', '唵嘛呢叭咪吽', '六字大明心咒（蓮花寶珠尊）', 'Oṃ! O Jewel in the Lotus, Hūṃ!', 'maṇi-padma-', 'Voc. Sg.'),
          makeWord('mahājñāna-cittotpāda', '麻曷倪牙納積都特巴達', '發起大智菩提心', 'generation of the mind of great wisdom', 'mahā-jñāna-citta-utpāda-', 'Stem'),
          makeWord('sarvārtha-bhūri-siddhaka', '薩而斡而塔卜哩悉塔葛', '廣大成就一切義利者', 'vast accomplisher of all aims', 'sarva-artha-bhūri-siddhaka-', 'Voc. Sg.'),
          makeWord('namo lokeśvarāya', '捺麻嚧吉說囉耶', '歸命世間自在王', 'Homage to the Lord of the World', 'loka-īśvara-', 'Dat. Sg. Masc.')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T20n1060',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1060.xml',
      taishoLocation: 'T20, no. 1050, p. 62b',
      gretilId: 'bsu019_u.htm',
      gretilRawUrl: 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/bsu019_u.htm',
      sanskritEditionCitation: 'Kāraṇḍavyūhasūtra (bsu019_u.htm) & Chinese Buddhist Liturgical Recension',
      tangPhoneticNotes: ['二合'],
      rawExcerpt: 'oṃ maṇipadme hūṃ',
      crossRefs: {
        taishoIds: ['T20n1050', 'T20n1060'],
        fangshanIds: ['F28n1071'],
        gretilIds: ['bsu019_u.htm']
      }
    }
  },
  {
    id: 'sapta-atitabuddha-karasaniya-dharani',
    titleZh: '七佛滅罪真言',
    shortTitleZh: '七佛滅罪咒',
    titleSanskrit: 'Saptātītabuddha-karasaniya-dhāraṇī',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Saptātītabuddha-karasaniya-dhāraṇī', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Saptātītabuddha-karasaniya-dhāraṇī', 'strict')),
    titleTibetan: 'སངས་རྒྱས་བདུན་གྱི་སྡིག་སྦྱོང་གི་གཟུངས།',
    titleEn: 'Karma-Purifying Dhāraṇī of the Seven Past Buddhas',
    category: 'ten-small-dharanis',
    deity: '過去七佛（毘婆尸佛至釋迦牟尼佛）(Sapta-Atītabuddha)',
    taishoId: 'T21n1339',
    translator: '梁・僧伽婆羅 / 失譯（收於《大方等陀羅尼經》T21n1339 及《陀羅尼雜集》T21n1336）',
    period: '南北朝 (5th–6th Century CE)',
    summaryZh:
      '十小咒之八。出自《大方等陀羅尼經》卷四（T21n1339）及《陀羅尼雜集》（T21n1336），為過去七佛為消滅眾生四重五逆重罪所共同宣說之古陀羅尼。',
    ritualBenefits:
      '至心誦持，能滅四重五逆重罪，令身心清淨，得大自在。',
    verses: [
      makeVerse(
        1,
        '七佛滅罪真言全文',
        'lipā lipāte kuha kuhate tralīte nijagalīte vimalīte mahāgate jecantī svāhā |',
        '離婆離婆帝。求訶求訶帝。陀羅尼帝。尼訶囉帝。毘黎你帝。摩訶伽帝。真陵乾帝。莎婆訶。',
        '離垢染、究竟離垢染，破除覆藏、究竟破除幽暗，總持不失，永離熱惱，清淨無垢，趣入大乘究竟彼岸，寂靜涅槃，莎婆訶！',
        'Free from stain, utterly free from stain! Dispelling darkness, holding fast, removing defilements, stainless, gone to the Great Path, abiding in serene peace, svāhā!',
        ['古音譯'],
        [
          makeWord('lipā lipāte', '離婆離婆帝', '離諸染污垢障', 'Free from smear and defilement', '√lip-', 'Voc./Loc. Sg.'),
          makeWord('kuha kuhate', '求訶求訶帝', '破除幽暗覆藏', 'Dispelling hidden faults', 'kuha-', 'Voc./Loc. Sg.'),
          makeWord('vimalīte', '毘黎你帝', '清淨離垢尊', 'O Stainless One', 'vimalita-', 'Voc. Sg. Fem.'),
          makeWord('mahāgate', '摩訶伽帝', '趣向大道、大解脫行', 'O One gone to the Great Path', 'mahā-gati-', 'Voc. Sg. Fem.'),
          makeWord('jecantī', '真陵乾帝', '勝伏寂靜尊', 'Victorious and Peaceful', '√ji- / śānti-', 'Nom./Voc. Sg. Fem.')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T21n1336',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T21/T21n1336.xml',
      taishoLocation: 'T21, no. 1339, p. 656b; T21, no. 1336',
      sanskritEditionCitation: 'Early Six Dynasties Prākṛt/Sanskrit Transcription in T21n1339 & T21n1336',
      tangPhoneticNotes: ['六朝古音'],
      rawExcerpt: '離婆離婆帝求訶求訶帝陀羅尼帝尼訶囉帝毘黎你帝摩訶伽帝真陵乾帝莎婆訶',
      crossRefs: {
        taishoIds: ['T21n1339', 'T21n1336'],
        fangshanIds: ['F28n1071']
      }
    }
  },
  {
    id: 'sukhavat-vyuha-dharani',
    titleZh: '拔一切業障根本得生淨土陀羅尼（往生咒）',
    shortTitleZh: '往生咒',
    titleSanskrit: 'Sukhāvatīvyūha-amṛta-dundubhisvara-rāja-dhāraṇī',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Sukhāvatīvyūha-amṛta-dundubhisvara-rāja-dhāraṇī', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Sukhāvatīvyūha-amṛta-dundubhisvara-rāja-dhāraṇī', 'strict')),
    titleTibetan: 'བདེ་བ་ཅན་གྱི་བཀོད་པའི་གཟུངས།',
    titleEn: 'Dhāraṇī for Uprooting All Karmic Obstacles and Attaining Rebirth in Sukhāvatī',
    category: 'ten-small-dharanis',
    deity: '西方極樂世界阿彌陀佛 (Amitābha / Amitāyus Tathāgata)',
    taishoId: 'T12n0368',
    translator: '劉宋・求那跋陀羅 (Guṇabhadra) / 唐・不空 (Amoghavajra) 譯',
    period: '劉宋元嘉年間 (435–443 CE)',
    summaryZh:
      '十小咒之九。出自劉宋求那跋陀羅譯《拔一切業障根本得生淨土神咒》（T12n0368），又見於不空三藏譯《阿彌陀鼓音聲王陀羅尼經》系統，為淨土宗與密教共修之甘露法門。',
    ritualBenefits:
      '拔除一切業障根本，阿彌陀佛常住其頂日夜擁護，不為冤家所害，現世安隱，臨終任運往生極樂。',
    cbetaInterlinearXmlId: 'T12n0368',
    verses: [
      makeVerse(
        1,
        '拔一切業障根本得生淨土神咒',
        'namo amitābhāya tathāgatāya | tadyathā amṛtodbhave amṛta-siddhaṃbhave amṛta-vikrānte amṛta-vikrānta-gāmini gagana-kīrti-kare svāhā |',
        '南無阿彌多婆夜。哆他伽多夜。哆地夜他。阿彌利都婆毘。阿彌利哆。悉耽婆毘。阿彌利哆。毘迦蘭帝。阿彌利哆。毘迦蘭多。伽彌膩。伽伽那。枳多迦利。娑婆訶。',
        '歸命無量光如來！即說咒曰：甘露所生尊、甘露圓滿成就尊、甘露神通無礙尊、甘露無礙遍行尊、如虛空廣作法音名稱尊，娑婆訶！',
        'Homage to Amitābha Tathāgata! Namely: O Ambrosia-Born One, Producer of Ambrosial Siddhi, Ambrosia-Striding One, Coursing with Ambrosial Power, Maker of Sky-Vast Renown, svāhā!',
        ['二合', '引'],
        [
          makeWord('namo amitābhāya', '南無阿彌多婆夜', '歸命無量光佛', 'Homage to Amitābha', 'amita-ābha-', 'Dat. Sg. Masc.'),
          makeWord('tathāgatāya', '哆他伽多夜', '如來', 'to the Tathāgata', 'tathāgata-', 'Dat. Sg. Masc.'),
          makeWord('amṛtodbhave', '阿彌利都婆毘', '甘露出生尊', 'O Ambrosia-Born One', 'amṛta-udbhavā-', 'Voc. Sg. Fem.'),
          makeWord('amṛta-siddhaṃbhave', '阿彌利哆悉耽婆毘', '成就甘露悉地尊', 'O Producer of Ambrosial Accomplishment', 'amṛta-siddha-bhavā-', 'Voc. Sg. Fem.'),
          makeWord('amṛta-vikrānta-gāmini', '阿彌利哆毘迦蘭多伽彌膩', '甘露神力無礙遍行尊', 'O One coursing with ambrosial valor', 'amṛta-vikrānta-gāminī-', 'Voc. Sg. Fem.'),
          makeWord('gagana-kīrti-kare', '伽伽那枳多迦利', '如虛空廣播名稱功德尊', 'O Maker of sky-vast renown', 'gagana-kīrti-karā-', 'Voc. Sg. Fem.')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T12n0368',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T12/T12n0368.xml',
      taishoLocation: 'T12, no. 368, p. 351c',
      sanskritEditionCitation: 'Guṇabhadra (T12n0368) & Amṛtadundubhisvararāja-dhāraṇī (Toh 676)',
      tangPhoneticNotes: ['古音譯', '二合'],
      rawExcerpt: '南無阿彌多婆夜哆他伽多夜哆地夜他阿彌利都婆毘',
      crossRefs: {
        taishoIds: ['T12n0368'],
        fangshanIds: ['F28n1071'],
        tohokuIds: ['Toh 676'],
        rktsIds: ['K676', 'D676']
      }
    }
  },
  {
    id: 'sri-mahadevi-dharani',
    titleZh: '善女天咒（大吉祥天女十二名號陀羅尼）',
    shortTitleZh: '大吉祥天女咒',
    titleSanskrit: 'Ārya-śrīmahādevī-vyākaraṇa-dhāraṇī',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Ārya-śrīmahādevī-vyākaraṇa-dhāraṇī', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Ārya-śrīmahādevī-vyākaraṇa-dhāraṇī', 'strict')),
    titleTibetan: 'འཕགས་པ་དཔལ་ལྷ་མོ་ཆེན་མོའི་མཚན་བཅུ་གཉིས་པ།',
    titleEn: 'Noble Śrī-Mahādevī (Great Auspicious Goddess) Dhāraṇī',
    category: 'ten-small-dharanis',
    deity: '大吉祥天女（功德天）(Śrī-Mahādevī / Mahālakṣmī)',
    taishoId: 'T16n0665',
    translator: '唐・義淨三藏 (Yijing) / 北涼・曇無讖 (Dharmakṣema) / 唐・不空 譯',
    period: '唐長安三年 (703 CE)',
    summaryZh:
      '十小咒之十。出自《金光明最勝王經・大吉祥天女增物品》（T16n0665），吉爾吉特寫本梵本完整保存於 GRETIL (`bsu007_u.htm` 及 `bsu035_u.htm`)，Gergely Hidas 教授亦有劍橋貝葉本精校本 (`SA_K12_Āgama_Mahāśrīnāmadvādaśaka_Hidas`)。',
    ritualBenefits:
      '消除貧窮厄難，資財寶穀豐足，成就一切福德資糧與修道順緣。',
    cbetaInterlinearXmlId: 'T16n0665',
    gretilRecordId: 'gretil-bsu007',
    verses: [
      makeVerse(
        1,
        '大吉祥天女根本真言',
        'namo buddhāya | namo dharmāya | namaḥ saṃghāya | namo śrī-mahādevyāya | tadyathā paripūrṇa-care samanta-darśane mahā-vihāragate samanta-vidhāna-gate mahā-kārya-pratiṣṭhāpane sarvārtha-samarthāya suprati-pūri āyānāṃ dharmatā mahā-vikurvite mahā-maitreya-upasaṃhite mahā-kleśe susaṃgṛhīte samantārtha-anupālane svāhā |',
        '南無佛陀。南無達摩。南無僧伽。南無室利摩訶提鼻耶。怛你也他。波利富樓那遮利。三曼陀達舍尼。摩訶毘訶羅伽帝。三曼陀毘尼伽帝。摩訶迦利野。波禰。波囉。波禰。薩利嚩栗他。三曼陀。修鉢黎帝。富隸那。阿利那。達摩帝。摩訶毘鼓畢帝。摩訶彌勒帝。婁簸僧祇帝。醯帝簁。僧祇醯帝。三曼陀。阿他阿𦀽。婆羅尼。娑嚩訶。',
        '歸命佛、法、僧！歸命大吉祥天女！即說咒曰：圓滿妙行尊、普遍照見尊、住大自在住處尊、普遍調伏尊、安立大事業尊、能成辦一切義利、善滿所願、具大慈心、善攝一切眾生、普遍護持一切義利者，娑嚩訶！',
        'Homage to the Buddha, Dharma, and Saṃgha! Homage to Śrī-Mahādevī! Namely: O One of completely fulfilled conduct, Universal Vision, Abiding in the Great Vihāra, Establishing Great Deeds, Accomplisher of all aims, Endowed with Great Benevolence, Protector of universal welfare, svāhā!',
        ['二合', '引'],
        [
          makeWord('śrī-mahādevyāya', '室利摩訶提鼻耶', '大吉祥天女尊', 'to Śrī-Mahādevī', 'śrī-mahādevī-', 'Dat. Sg. Fem.', '二合'),
          makeWord('paripūrṇa-care', '波利富樓那遮利', '圓滿妙行母', 'O One of fulfilled conduct', 'paripūrṇa-carā-', 'Voc. Sg. Fem.'),
          makeWord('samanta-darśane', '三曼陀達舍尼', '普遍照見母', 'O One of universal vision', 'samanta-darśanā-', 'Voc. Sg. Fem.'),
          makeWord('mahā-maitreya-upasaṃhite', '摩訶彌勒帝婁簸僧祇帝', '與大慈心相應母', 'O One endowed with great benevolence', 'mahā-maitrī-upasaṃhitā-', 'Voc. Sg. Fem.')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T16n0665',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T16/T16n0665.xml',
      taishoLocation: 'T16, no. 665, p. 439c',
      gretilId: 'bsu007_u.htm',
      gretilRawUrl: 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/bsu007_u.htm',
      sanskritEditionCitation:
        'N. Dutt, Gilgit Manuscripts Vol. I (bsu007_u.htm), Bagchi Suvarṇaprabhāsasūtra (bsu035_u.htm) & Gergely Hidas (CUL Add. 1326)',
      tangPhoneticNotes: ['二合', '梵本夾注'],
      rawExcerpt: 'namo śrīmahādevyāya tadyathā paripūrṇacare samantadarśane',
      crossRefs: {
        taishoIds: ['T16n0665', 'T16n0663', 'T20n1252'],
        fangshanIds: ['F28n1071'],
        tohokuIds: ['Toh 556', 'Toh 740'],
        rktsIds: ['K556', 'D556', 'D740'],
        dsbcIds: ['7/199'],
        gretilIds: ['bsu007_u.htm', 'bsu035_u.htm'],
        buddhaNexusIds: ['SA_K12_Āgama_Mahāśrīnāmadvādaśaka_Hidas', 'K12bsu007_u'],
        cudlMsIds: ['MS-ADD-01326']
      }
    }
  }
];
