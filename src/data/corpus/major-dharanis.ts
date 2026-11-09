/**
 * src/data/corpus/major-dharanis.ts
 * Six Core Great & Fundamental Long Dhāraṇīs (四大咒與根本長咒)
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

export const MAJOR_DHARANIS: DharaniItem[] = [
  {
    id: 'nilakantha-dharani',
    titleZh: '千手千眼觀世音菩薩廣大圓滿無礙大悲心陀羅尼',
    shortTitleZh: '大悲咒',
    titleSanskrit: 'Nīlakaṇṭha-mahākāruṇika-hṛdaya-dhāraṇī',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Nīlakaṇṭha-mahākāruṇika-hṛdaya-dhāraṇī', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Nīlakaṇṭha-mahākāruṇika-hṛdaya-dhāraṇī', 'strict')),
    titleTibetan: 'འཕགས་པ་སྤྱན་རས་གཟིགས་དབང་ཕྱུག་མགྲིན་པ་སྔོན་པོ་ཅན་གྱི་གཟུངས།',
    titleEn: 'Great Compassion Dhāraṇī of the Blue-Necked Avalokiteśvara',
    category: 'major-dharanis',
    deity: '千手千眼觀世音菩薩 (Sahasrabhuja-Avalokiteśvara / Nīlakaṇṭha Lokeśvara)',
    taishoId: 'T20n1060',
    translator: '唐・伽梵達摩 (Bhagavaddharma) 譯 / 唐・不空 (Amoghavajra) 對勘',
    period: '初唐至盛唐 (7th–8th Century CE)',
    summaryZh:
      '漢傳與藏傳佛教最核心之觀音法門根本總持。唐代有伽梵達摩84句通行本（T20n1060）、金剛智廣本（T20n1061）、不空三藏慈悲對音本（T20n1064）及《青頸大悲心陀羅尼》（T20n1113B，附334組悉曇梵漢對音）。',
    ritualBenefits:
      '滅除百千萬億劫生死重罪，臨命終時十方諸佛皆來授手，不墮三惡道，現世所求一切善願悉皆果遂。',
    cbetaInterlinearXmlId: 'T20n1113B',
    verses: [
      makeVerse(
        1,
        '初段・三寶與大悲觀音歸敬文 (Namaskāra)',
        'namo ratnatrayāya | nama āryāvalokiteśvarāya bodhisattvāya mahāsattvāya mahākāruṇikāya |',
        '南無喝囉怛那哆囉夜耶。南無阿唎耶。婆盧羯帝爍鉢囉耶。菩提薩埵婆耶。摩訶薩埵婆耶。摩訶迦盧尼迦耶。',
        '歸命三寶！歸命聖觀自在菩薩摩訶薩、具足大悲心者！',
        'Homage to the Triple Gem! Homage to the Noble Avalokiteśvara, Bodhisattva, Mahāsattva, the Greatly Compassionate One!',
        ['二合', '引'],
        [
          makeWord('namo', '南無', '歸命、敬禮', 'Homage to', 'namas-', 'Indecl. (不變詞)'),
          makeWord('ratnatrayāya', '喝囉怛那哆囉夜耶', '三寶', 'to the Three Jewels', 'ratna-traya-', 'Dat. Sg. Neut. (第四格・為格)', '二合'),
          makeWord('nama', '南無', '敬禮', 'Homage to', 'namas-', 'Indecl. (連音省ḥ)'),
          makeWord('āryāvalokiteśvarāya', '阿唎耶婆盧羯帝爍鉢囉耶', '聖觀自在', 'to Noble Avalokiteśvara', 'ārya-avalokita-īśvara-', 'Dat. Sg. Masc. (第四格)', '二合'),
          makeWord('bodhisattvāya', '菩提薩埵婆耶', '覺有情（菩薩）', 'to the Bodhisattva', 'bodhi-sattva-', 'Dat. Sg. Masc.'),
          makeWord('mahāsattvāya', '摩訶薩埵婆耶', '大有情（摩訶薩）', 'to the Great Being', 'mahā-sattva-', 'Dat. Sg. Masc.'),
          makeWord('mahākāruṇikāya', '摩訶迦盧尼迦耶', '具大悲心者', 'to the Greatly Compassionate One', 'mahā-kāruṇika-', 'Dat. Sg. Masc.')
        ]
      ),
      makeVerse(
        2,
        '二段・青頸觀音本尊禮讚 (Nīlakaṇṭha Invocation)',
        'oṃ sarvarabhaye sudhanadasya namaskṛtvā imaṃ āryāvalokiteśvara-stavaṃ nīlakaṇṭha-nāma-hṛdayaṃ vartayiṣyāmi |',
        '唵。薩皤囉罰曳。數怛那怛寫。南無悉吉慄埵伊蒙阿唎耶。婆盧吉帝室佛囉楞馱婆。南無那囉謹墀。',
        '唵！於一切怖畏中善施安樂者，我頂禮彼已，今當宣說聖觀自在禮讚名曰青頸大悲心咒！',
        'Oṃ! Having bowed to Him who grants safety in all fears, I shall now recite this hymn of Noble Avalokiteśvara called the Blue-Necked Heart Dhāraṇī!',
        ['二合', '引'],
        [
          makeWord('oṃ', '唵', '三身無上法界體性種子字', 'Sacred Praṇava seed syllable', 'oṃ', 'Bīja'),
          makeWord('sarvarabhaye', '薩皤囉罰曳', '於一切怖畏中', 'in all fears / perils', 'sarva-bhaya-', 'Loc. Sg.'),
          makeWord('namaskṛtvā', '南無悉吉慄埵', '頂禮已', 'having paid homage', 'namas-√kṛ-', 'Absolutive (絕對分詞)', '二合'),
          makeWord('nīlakaṇṭha', '那囉謹墀', '青頸尊（吞飲世間苦毒化成青頸）', 'the Blue-Necked One', 'nīla-kaṇṭha-', 'Voc./Stem')
        ]
      ),
      makeVerse(
        3,
        '三段・大悲根本咒心 (Hṛdaya Mantra)',
        'tadyathā oṃ avaloka lokātīta ehy ehi mahābodhisattva sarva-sarpa-mala-mala mahāhṛdaya kuru kuru karma dhuru dhuru vijayate mahāvijayate dhara dhara dharāṇi-rāja cala cala mama vimala-mūrte re ehy ehi kṛṣṇa-sarpavīta-yajñopavīta viṣa-viṣaṃ praṇāśaya hulu hulu malla hulu hulu hṛīḥ sāra sāra siri siri suru suru bodhiya bodhiya bodhaya bodhaya maitreya nīlakaṇṭha darśanena prahlādaya manaḥ svāhā siddhāya svāhā mahāsiddhāya svāhā siddha-yogeśvarāya svāhā nīlakaṇṭhāya svāhā |',
        '怛姪他。唵。阿婆盧醯。盧迦帝。迦羅帝。夷醯唎。摩訶菩提薩埵。薩婆薩婆。摩囉摩囉。摩訶摩囉。俱盧俱盧羯蒙。度盧度盧罰闍耶帝。摩訶罰闍耶帝。陀囉陀囉。地唎尼。室佛囉耶。遮囉遮囉。摩麼罰摩囉。穆帝隸。伊醯伊醯。室那室那。阿囉嘇佛囉舍利。罰沙罰嘇。佛囉舍耶。呼嚧呼嚧摩囉。呼嚧呼嚧醯利。娑囉娑囉。悉唎悉唎。蘇嚧蘇嚧。菩提夜菩提夜。菩馱夜菩馱夜。彌帝唎夜。那囉謹墀。地利瑟尼那。波夜摩那。娑婆訶。悉陀夜。娑婆訶。摩訶悉陀夜。娑婆訶。悉陀喻藝。室皤囉耶。娑婆訶。那囉謹墀。娑婆訶。',
        '即說咒曰：唵！觀照世間、超越世間者！善來善來，大菩薩！作持事業，得大尊勝，持地自在王，離垢清淨身，摧滅一切諸毒，令發菩提、令覺菩提，大慈青頸尊，以妙寶相令我心歡喜，圓滿成就，娑婆訶！',
        'Namely: Oṃ! O Observer who transcends the world! Come, come, Great Bodhisattva! Perform the action, triumph, hold fast O Lord of the Earth, destroy all poison, awaken bodhi, O benevolent Blue-Necked One, gladden our minds by your vision, svāhā! To the accomplished one, svāhā! To the Blue-Necked One, svāhā!',
        ['二合', '引', '彈舌呼'],
        [
          makeWord('tadyathā', '怛姪他', '即說咒曰、所謂', 'namely, thus', 'tad-yathā', 'Indecl.'),
          makeWord('avaloka', '阿婆盧醯', '觀照者', 'O Observer', 'ava-√lok-', 'Voc. Sg. Masc.'),
          makeWord('lokātīta', '盧迦帝', '超越世間者', 'O World-Transcending One', 'loka-atīta-', 'Voc. Sg. Masc.'),
          makeWord('ehy ehi', '伊醯伊醯', '善來、善來（召請）', 'Come, come!', 'ā-√i-', '2nd Sg. Imperative'),
          makeWord('kuru kuru karma', '俱盧俱盧羯蒙', '作持、作持事業', 'Perform, perform the action!', '√kṛ- + karman-', 'Imperative + Acc. Sg.'),
          makeWord('bodhaya bodhaya', '菩馱夜菩馱夜', '令覺悟、令開敷菩提', 'Awaken, awaken!', '√budh- (caus.)', '2nd Sg. Imperative'),
          makeWord('maitreya', '彌帝唎夜', '具大慈心者', 'O Benevolent One', 'maitreya-', 'Voc. Sg. Masc.'),
          makeWord('svāhā', '娑婆訶', '圓滿吉祥成就', 'Hail! May it be accomplished!', 'svāhā', 'Indecl. Mantra Terminus')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T20n1113B',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1113B.xml',
      taishoLocation: 'T20, no. 1060, p. 106c–107b; T20, no. 1113B, p. 498a–501b',
      sanskritEditionCitation:
        'Sylvain Lévi / DSBC 820/2949 (Nīlakaṇṭha-nāma-hṛdaya) & CEToM THT 3187 (Kizil Brāhmī MS)',
      tangPhoneticNotes: ['二合', '引', '彈舌'],
      rawExcerpt: '<cb:tt><cb:t xml:lang="sa-Sidd"><g ref="#SD-A5A9"/></cb:t><cb:t xml:lang="zh-Hant">南</cb:t></cb:tt>',
      crossRefs: {
        taishoIds: ['T20n1060', 'T20n1064', 'T20n1113B'],
        fangshanIds: ['F28n1071', 'F24n0761', 'F27n1050', 'F27n1064'],
        tohokuIds: ['Toh 679', 'Toh 902'],
        rktsIds: ['K679', 'D679', 'D902'],
        dsbcIds: ['820/2949', '824/2953'],
        buddhaNexusIds: ['K12n2949u'],
        idpOrCetomIds: ['THT 3187', 'Pelliot tibétain 42']
      }
    }
  },
  {
    id: 'surangama-dharani',
    titleZh: '大佛頂如來放光悉怛多般怛囉大神力都攝一切咒王陀羅尼',
    shortTitleZh: '楞嚴咒',
    titleSanskrit: 'Śūraṅgama-tathāgatoṣṇīṣa-sitātapatrā-mahāpratyaṅgirā-dhāraṇī',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Śūraṅgama-tathāgatoṣṇīṣa-sitātapatrā-mahāpratyaṅgirā-dhāraṇī', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Śūraṅgama-tathāgatoṣṇīṣa-sitātapatrā-mahāpratyaṅgirā-dhāraṇī', 'strict')),
    titleTibetan: 'དེ་བཞིན་གཤེགས་པའི་གཙུག་ཏོར་ནས་བྱུང་བའི་གདུགས་དཀར་པོ་ཅན་གཞན་གྱིས་མི་ཐུབ་པ་ཕྱིར་ཟློག་པ་ཆེན་མོ།',
    titleEn: 'Great Śūraṅgama Tathāgata-Uṣṇīṣa Sitātapatrā Mahāpratyaṅgirā Dhāraṇī',
    category: 'major-dharanis',
    deity: '釋迦牟尼佛頂化佛・大白傘蓋佛母 (Tathāgatoṣṇīṣa-Sitātapatrā)',
    taishoId: 'T19n0945',
    translator: '唐・般剌蜜帝 (Pramiti) 譯 / 唐・不空 (Amoghavajra) 另譯《大白傘蓋總持》',
    period: '唐神龍元年 (705 CE)',
    summaryZh:
      '《大佛頂首楞嚴經》卷七所載「咒中之王」，全咒分五會（毘盧真法會、釋尊應化會、觀音合同會、金剛藏折攝會、文殊弘傳會），與梵本《一切如來白傘蓋大佛頂大迴遮母陀羅尼》（bsu004_u.htm）及房山石經《釋教最上乘秘密藏陀羅尼集》同源互證。',
    ritualBenefits:
      '十方如來依此咒心成無上正遍知覺，降伏天魔外道，破除一切諸惡咒術，成就首楞嚴王三昧。',
    gretilRecordId: 'gretil-bsu004',
    verses: [
      makeVerse(
        1,
        '第一會・五部如來與諸大菩薩歸命文 (Pañcakula Namaskāra)',
        'namaḥ sarva-buddha-bodhisattvebhyaḥ | namo saptānāṃ samyaksaṃbuddha-koṭīnāṃ sa-śrāvaka-saṃghānām | namo loke arhatāṃ | namo srotāpannānāṃ | namo sakṛdāgāmināṃ | namo anāgāminām |',
        '南無薩怛他蘇伽多耶。阿囉訶帝。三藐三菩陀寫。薩怛他佛陀俱胝瑟尼釤。南無薩婆勃陀勃地薩蕀鞞弊。南無薩多南。三藐三勃陀俱知喃。娑舍囉婆迦僧伽喃。南無盧雞阿羅漢哆喃。南無蘇盧多波那喃。',
        '歸命一切諸佛菩薩！歸命七俱胝正等正覺暨聲聞僧伽！歸命世間諸阿羅漢、須陀洹、斯陀含、阿那含！',
        'Homage to all Buddhas and Bodhisattvas! Homage to the seven koṭis of Perfectly Awakened Buddhas together with the Saṃgha of Śrāvakas! Homage to the Arhats, Stream-enterers, Once-returners, and Non-returners in the world!',
        ['二合', '引'],
        [
          makeWord('namaḥ', '南無', '歸命、頂禮', 'Homage to', 'namas-', 'Indecl.'),
          makeWord('sarva-buddha-bodhisattvebhyaḥ', '薩婆勃陀勃地薩蕀鞞弊', '一切諸佛菩薩眾', 'to all Buddhas and Bodhisattvas', 'sarva-buddha-bodhisattva-', 'Dat. Pl. Masc. (第四格複數)', '二合'),
          makeWord('saptānāṃ', '薩多南', '七數之', 'of the seven', 'saptan-', 'Gen. Pl. (第六格・屬格)'),
          makeWord('samyaksaṃbuddha-koṭīnāṃ', '三藐三勃陀俱知喃', '正遍知百千萬億眾', 'of koṭis of Perfectly Awakened Ones', 'samyak-saṃbuddha-koṭi-', 'Gen. Pl.')
        ]
      ),
      makeVerse(
        2,
        '第五會・大佛頂首楞嚴王根本咒心 (Śūraṅgama Hṛdaya Mantra)',
        'tadyathā oṃ anale anale viśade viśade vīra vajradhare bandha bandhani vajrapāṇi phaṭ hūṃ trūṃ phaṭ svāhā |',
        '怛姪他。唵。阿那隸。毘舍提。鞞囉跋闍囉陀。槃陀槃陀你。跋闍囉謗尼泮。虎信都嚧甕泮。莎訶。',
        '即說咒心曰：唵！光明熾盛、光明熾盛，清淨無垢、清淨無垢，大勇猛持金剛者，結縛、結縛彼魔障，金剛手摧破！吽！敕嚕姆！泮！圓滿成就！',
        'Namely: Oṃ! O Fiery Radiance, O Pure Clarity, O Heroic Holder of the Vajra! Bind, bind! O Vajrapāṇi, shatter (phaṭ)! Hūṃ! Trūṃ! Phaṭ! Svāhā!',
        ['二合', '引', '破障音'],
        [
          makeWord('tadyathā', '怛姪他', '即說咒曰', 'namely, thus', 'tad-yathā', 'Indecl.'),
          makeWord('oṃ', '唵', '法界體性種子字', 'Sacred seed syllable Oṃ', 'oṃ', 'Bīja'),
          makeWord('anale', '阿那隸', '智火熾盛尊', 'O Fiery One / Unobstructed Flame', 'anala-', 'Voc. Sg. Fem.'),
          makeWord('viśade', '毘舍提', '清淨無垢離塵尊', 'O Pure and Stainless One', 'viśadā-', 'Voc. Sg. Fem.'),
          makeWord('vīra', '鞞囉', '大勇猛無畏尊', 'O Heroic One', 'vīra-', 'Voc. Sg.'),
          makeWord('vajradhare', '跋闍囉陀', '持金剛杵者', 'O Holder of the Vajra', 'vajra-dharā-', 'Voc. Sg.', '二合'),
          makeWord('bandha bandhani', '槃陀槃陀你', '結界縛魔、能結縛母', 'Bind! O Binder of obstacles!', '√bandh-', 'Imperative + Voc. Sg.'),
          makeWord('vajrapāṇi', '跋闍囉謗尼', '金剛手菩薩', 'O Vajrapāṇi', 'vajra-pāṇi-', 'Voc. Sg.'),
          makeWord('phaṭ', '泮', '摧破一切無明魔障', 'Shatter! Destroy obstacles!', 'phaṭ', 'Astramantra Bīja'),
          makeWord('hūṃ', '虎信', '金剛部大菩提心種子字', 'Vajra seed syllable Hūṃ', 'hūṃ', 'Bīja'),
          makeWord('trūṃ', '都嚧甕', '大佛頂金剛光網種子字', 'Uṣṇīṣa-cakra seed syllable Trūṃ', 'trūṃ', 'Bīja', '二合'),
          makeWord('svāhā', '莎訶', '究竟圓滿成就', 'Hail! Accomplished!', 'svāhā', 'Indecl.')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T19n0945',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n0945.xml',
      taishoLocation: 'T19, no. 945, p. 139a–141b',
      gretilId: 'bsu004_u.htm',
      gretilRawUrl: 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/bsu004_u.htm',
      sanskritEditionCitation:
        'Ngawang Samten & Janardan Pandey (2002), Āryatathāgatoṣṇīṣasitātapatrāparājitāmahāpratyaṅgirāparamasiddhanāmadhāraṇī',
      tangPhoneticNotes: ['二合', '三合', '引'],
      rawExcerpt: '怛姪他唵阿那隸毘舍提鞞囉跋闍囉陀槃陀槃陀你跋闍囉謗尼泮虎信都嚧甕泮莎訶',
      crossRefs: {
        taishoIds: ['T19n0945', 'T19n0976', 'T19n0977'],
        fangshanIds: ['F27n1048', 'F27n1063', 'F28n1071'],
        tohokuIds: ['Toh 590', 'Toh 591', 'Toh 983'],
        rktsIds: ['K590', 'K591', 'D591', 'D983'],
        dsbcIds: ['20/222', '820/2949'],
        gretilIds: ['bsu004_u.htm'],
        buddhaNexusIds: ['K12bsu004_u']
      }
    }
  },
  {
    id: 'usnisavijaya-dharani',
    titleZh: '佛頂尊勝陀羅尼',
    shortTitleZh: '尊勝咒',
    titleSanskrit: 'Sarvadurgatipariśodhana-uṣṇīṣavijayā-dhāraṇī',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Sarvadurgatipariśodhana-uṣṇīṣavijayā-dhāraṇī', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Sarvadurgatipariśodhana-uṣṇīṣavijayā-dhāraṇī', 'strict')),
    titleTibetan: 'ངན་འགྲོ་ཐམས་ཅད་ཡོངས་སུ་སྦྱོང་བ་གཙུག་ཏོར་རྣམ་པར་རྒྱལ་མའི་གཟུངས།',
    titleEn: 'Uṣṇīṣavijayā Dhāraṇī for Purifying All Evil Destinies',
    category: 'major-dharanis',
    deity: '尊勝佛頂尊・佛頂尊勝佛母 (Uṣṇīṣavijayā)',
    taishoId: 'T19n0974B',
    translator: '唐・不空三藏 (Amoghavajra) 譯 / 唐・佛陀波利 (Buddhapāla) 譯',
    period: '盛唐 (8th Century CE)',
    summaryZh:
      '唐代石經幢刻經最廣之無上總持。不空三藏譯《佛頂尊勝陀羅尼念誦儀軌》（T19n0974B）完整保存470組 `<cb:tt>` 悉曇梵字與漢語音譯、義釋夾注對照，為考訂唐代長安悉曇音系之最高權威文獻。',
    ritualBenefits:
      '淨除一切惡道，消滅百千劫積集重障，增延壽命，若書寫安於高幢、高山或塔中，影映塵沾皆得解脫惡趣。',
    cbetaInterlinearXmlId: 'T19n0974B',
    verses: [
      makeVerse(
        1,
        '初段・歸敬最勝世尊與根本灌頂啟請 (Namaskāra & Abhiṣeka)',
        'namo bhagavate trailokyaprativiśiṣṭāya buddhāya bhagavate | tadyathā oṃ viśodhani viśodhani asama-sama samantāvabhāsa-spharaṇa-gati-gahana-svabhāva-viśuddhe abhiṣiñcatu māṃ sugata-vara-vacana amṛtābhiṣekair mahāmudrā-mantra-padaiḥ |',
        '曩謨婆誐嚩帝。怛賴路枳也。鉢囉底尾始瑟吒耶。沒馱耶。婆誐嚩帝。怛你也他。唵。尾戌馱也。尾戌馱也。娑摩娑摩。三滿多嚩婆娑。娑破囉拏。揭底伽訶曩。娑嚩婆嚩尾第。阿鼻詵左睹𤚥。蘇蘖多嚩囉嚩左曩。阿蜜慄多鼻矖罽。摩訶曼怛囉跛乃。',
        '歸命世尊、三界最勝無比佛陀世尊！即說咒曰：唵！極善清淨、極善清淨！無等平等、普照十方遍滿六趣深密自性清淨者！唯願以善逝妙言、甘露灌頂及大印真言句為我灌頂！',
        'Homage to the Blessed One, the Buddha supreme throughout the Three Worlds! Namely: Oṃ! Purify, purify! Equal to the unequalled, naturally pure throughout all dense paths pervaded by universal light! Consecrate me with the supreme words of the Sugata, with ambrosial consecrations and great mudrā-mantra phrases!',
        ['二合', '引'],
        [
          makeWord('namo bhagavate', '曩謨婆誐嚩帝', '歸命世尊', 'Homage to the Blessed One', 'namas- + bhagavat-', 'Dat. Sg. Masc.', '二合'),
          makeWord('trailokyaprativiśiṣṭāya', '怛賴路枳也鉢囉底尾始瑟吒耶', '三界中最極殊勝者', 'to Him who is supreme in the three worlds', 'trailokya-prativiśiṣṭa-', 'Dat. Sg. Masc.', '二合、引'),
          makeWord('viśodhani', '尾戌馱也', '能淨除者、令清淨', 'O Purifier! Purify!', 'vi-√śudh-', 'Voc. Sg. Fem. / Imperative'),
          makeWord('svabhāva-viśuddhe', '娑嚩婆嚩尾第', '自性清淨尊', 'O One of pure intrinsic nature', 'svabhāva-viśuddhā-', 'Voc. Sg. Fem.', '二合'),
          makeWord('abhiṣiñcatu māṃ', '阿鼻詵左睹𤚥', '唯願為我灌頂', 'May You consecrate me!', 'abhi-√ṣic- + mad-', '3rd Sg. Imperative + Acc. Sg.')
        ]
      ),
      makeVerse(
        2,
        '二段・甘露淨障與尊勝佛頂心印 (Amṛta & Bhrūṃ Hṛdaya)',
        'oṃ amṛte amṛtodbhave amṛtavikrānte amṛtagāmini gagana-kīrti-kare sarva-kleśa-kṣayaṃ-kari svāhā | oṃ bhrūṃ svāhā | oṃ amṛtāyur-dade svāhā |',
        '唵。阿蜜慄帝。阿蜜慄妒納婆吠。阿蜜慄多尾訖磷帝。阿蜜慄多誐弭你。誐誐曩計慄底迦隸。薩嚩吉隸舍乞灑央迦隸。娑嚩訶。唵。勃籠。娑嚩訶。唵。阿蜜慄多欲娜泥。娑嚩訶。',
        '唵！甘露尊、甘露所生尊、甘露神通無礙尊、甘露遍行尊、虛空廣大稱揚尊、滅盡一切煩惱尊，娑嚩訶！唵，勃籠（佛頂金輪種子），娑嚩訶！唵，施甘露無量壽尊，娑嚩訶！',
        'Oṃ! O Ambrosia, Ambrosia-born, Ambrosia-striding, Ambrosia-going, Maker of sky-vast renown, Destroyer of all afflictions, svāhā! Oṃ bhrūṃ svāhā! Oṃ Giver of ambrosial longevity, svāhā!',
        ['二合', '三合', '引'],
        [
          makeWord('amṛte', '阿蜜慄帝', '甘露不死尊', 'O Immortal Ambrosia', 'amṛtā-', 'Voc. Sg. Fem.', '二合'),
          makeWord('amṛtodbhave', '阿蜜慄妒納婆吠', '甘露出生尊', 'O Ambrosia-Born One', 'amṛta-udbhavā-', 'Voc. Sg. Fem.', '二合'),
          makeWord('gagana-kīrti-kare', '誐誐曩計慄底迦隸', '如虛空廣作法音名稱者', 'O Maker of sky-vast renown', 'gagana-kīrti-karā-', 'Voc. Sg. Fem.', '二合'),
          makeWord('sarva-kleśa-kṣayaṃ-kari', '薩嚩吉隸舍乞灑央迦隸', '能滅盡一切煩惱者', 'O Destroyer of all kleśas', 'sarva-kleśa-kṣayaṃkarī-', 'Voc. Sg. Fem.', '二合'),
          makeWord('bhrūṃ', '勃籠', '一字金輪尊勝佛頂種子字', 'Uṣṇīṣavijayā / Ekākṣara seed syllable Bhrūṃ', 'bhrūṃ', 'Bīja', '二合、引')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T19n0974B',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n0974B.xml',
      taishoLocation: 'T19, no. 974B, p. 386b–388a',
      sanskritEditionCitation:
        'Amoghavajra Siddhaṃ-Chinese Interlinear Edition (T19n0974B, 470 <cb:tt> pairs) & Cambridge CUL MS Add. 1680.8.1 / MS Add. 1447',
      tangPhoneticNotes: ['二合', '引', '三合'],
      rawExcerpt: '<cb:tt><cb:t xml:lang="sa-Sidd"><g ref="#SD-A5A9"/></cb:t><cb:t xml:lang="zh-Hant">曩</cb:t></cb:tt>',
      crossRefs: {
        taishoIds: ['T19n0974B', 'T19n0974E', 'T19n0967'],
        fangshanIds: ['F27n1062', 'F28n1071'],
        tohokuIds: ['Toh 597', 'Toh 984'],
        rktsIds: ['K597', 'D597', 'D984'],
        dsbcIds: ['820/2949'],
        cudlMsIds: ['MS-ADD-01680-00008-00001', 'MS-ADD-01326']
      }
    }
  },
  {
    id: 'sitatapatra-dharani',
    titleZh: '一切如來白傘蓋大佛頂陀羅尼',
    shortTitleZh: '大白傘蓋佛母咒',
    titleSanskrit: 'Ārya-tathāgatoṣṇīṣa-sitātapatrāparājitā-mahāpratyaṅgirā-dhāraṇī',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Ārya-tathāgatoṣṇīṣa-sitātapatrāparājitā-mahāpratyaṅgirā-dhāraṇī', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Ārya-tathāgatoṣṇīṣa-sitātapatrāparājitā-mahāpratyaṅgirā-dhāraṇī', 'strict')),
    titleTibetan: 'འཕགས་པ་དེ་བཞིན་གཤེགས་པའི་གཙུག་ཏོར་ནས་བྱུང་བའི་གདུགས་དཀར་མོ་ཅན་གཞན་གྱིས་མི་ཐུབ་མ་ཕྱིར་ཟློག་པ་ཆེན་མོ།',
    titleEn: 'Noble Sitātapatrā Aparājitā Mahāpratyaṅgirā Dhāraṇī',
    category: 'major-dharanis',
    deity: '一切如來頂髻大白傘蓋無敵佛母 (Sitātapatrā Aparājitā)',
    taishoId: 'T19n0976',
    translator: '唐・不空三藏 (Amoghavajra) / 元・沙囉巴 (Śāntibhadra) 譯',
    period: '盛唐至元代 (8th–14th Century CE)',
    summaryZh:
      '從釋迦牟尼如來無見頂相化現之大白傘蓋佛母根本大迴遮法，梵本完存於尼泊尔 DSBC (20/222) 及 GRETIL (bsu004_u.htm)，德格版甘珠爾 Toh 591/983 亦有精密對勘。',
    ritualBenefits:
      '迴遮八萬四千災障、惡星變怪、非時橫死及一切怨敵厭禱咒詛，護國息災最極威猛。',
    gretilRecordId: 'gretil-bsu004',
    verses: [
      makeVerse(
        1,
        '大白傘蓋堅甲根本心咒 (Sitātapatrā Kavaca & Hṛdaya)',
        'oṃ sarva-tathāgatoṣṇīṣa-sitātapatre hūṃ druṃ hrīḥ ṣṭauṃ | jambhanī-karīṃ stambhanī-karīṃ mohanī-karīṃ para-vidyā-saṃbhakṣaṇa-karīṃ sarva-duṣṭānāṃ stambhana-karīṃ svāhā | hūṃ mama hūṃ ni svāhā |',
        '唵。薩嚩怛他蘖多烏瑟尼沙。悉怛多鉢怛隸。吽。都嚧雍。紇哩。瑟吒。瞻婆那迦哩。悉耽婆那迦哩。謨訶那迦哩。鉢囉尾你也吞啖迦哩。娑嚩訶。吽。摩摩。吽。尼。娑嚩訶。',
        '唵！一切如來佛頂大白傘蓋尊！吽！都嚧雍！紇哩！瑟吒！能作鎮伏、能作制止、能令迷悶、能吞啖一切外道惡咒、能制伏一切惡暴有情者，娑嚩訶！吽！護我（mama）！吽！尼！娑嚩訶！',
        'Oṃ! O White Parasol of the Uṣṇīṣa of all Tathāgatas! Hūṃ druṃ hrīḥ ṣṭauṃ! She who crushes, immobilizes, confounds, and devours hostile spells, immobilizing all wicked beings, svāhā! Hūṃ mama hūṃ ni svāhā!',
        ['二合', '三合', '引'],
        [
          makeWord('sarva-tathāgatoṣṇīṣa-sitātapatre', '薩嚩怛他蘖多烏瑟尼沙悉怛多鉢怛隸', '一切如來頂髻白傘蓋佛母', 'O White Parasol of all Tathāgata-Uṣṇīṣas', 'sarva-tathāgata-uṣṇīṣa-sitātapatrā-', 'Voc. Sg. Fem.', '二合'),
          makeWord('jambhanī-karīṃ', '瞻婆那迦哩', '能作摧伏者', 'Maker of crushing/subduing', 'jambhanī-karī-', 'Acc. Sg. Fem.'),
          makeWord('stambhanī-karīṃ', '悉耽婆那迦哩', '能作制止結縛者', 'Maker of immobilization', 'stambhanī-karī-', 'Acc. Sg. Fem.', '二合'),
          makeWord('mama', '摩摩', '於我、護我（行者自稱）', 'of me / for me', 'mad-', 'Gen./Dat. Sg. (第六/四格)')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T19n0976',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n0976.xml',
      taishoLocation: 'T19, no. 976, p. 399a–404c',
      gretilId: 'bsu004_u.htm',
      gretilRawUrl: 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/bsu004_u.htm',
      sanskritEditionCitation:
        'Ngawang Samten & Janardan Pandey (2002), DSBC Sutra no. 4 (bsu004_u.htm) & 84000 Toh 591/983',
      tangPhoneticNotes: ['二合', '三合', '引'],
      rawExcerpt: 'oṃ sarvatathāgatoṣṇīṣasitātapatre hūṃ druṃ hrīḥ ṣṭauṃ',
      crossRefs: {
        taishoIds: ['T19n0976', 'T19n0977', 'T19n0945'],
        fangshanIds: ['F27n1048', 'F27n1063'],
        tohokuIds: ['Toh 591', 'Toh 983'],
        rktsIds: ['K591', 'D591', 'D983'],
        dsbcIds: ['20/222'],
        gretilIds: ['bsu004_u.htm'],
        buddhaNexusIds: ['K12bsu004_u'],
        cudlMsIds: ['MS-ADD-01326']
      }
    }
  },
  {
    id: 'mahapratisara-dharani',
    titleZh: '普遍光明清淨熾盛如意寶印心無能勝大明王大隨求陀羅尼',
    shortTitleZh: '大隨求陀羅尼',
    titleSanskrit: 'Mahāpratisarā-mahāvidyārājñī-dhāraṇī',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Mahāpratisarā-mahāvidyārājñī-dhāraṇī', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Mahāpratisarā-mahāvidyārājñī-dhāraṇī', 'strict')),
    titleTibetan: 'འཕགས་པ་སོ་སོར་འབྲང་མ་ཆེན་མོ་ཞེས་བྱ་བའི་གཟུངས།',
    titleEn: 'Great Queen of Vidyās Mahāpratisarā Dhāraṇī',
    category: 'major-dharanis',
    deity: '大隨求佛母（五護陀羅尼之首）(Mahāpratisarā Mahāvidyārājñī)',
    taishoId: 'T20n1153',
    translator: '唐・不空三藏 (Amoghavajra) 譯',
    period: '盛唐 (8th Century CE)',
    summaryZh:
      '印度與尼泊爾佛教「五護陀羅尼」（Pañcarakṣā）之首部大經。不空三藏譯本（T20n1153）保存3,688個 `#SD-*` 悉曇梵字，Gergely Hidas 教授（2012）據劍橋與牛津貝葉寫本完成梵文精校本（mahpratu.htm）。',
    ritualBenefits:
      '隨眾生所求一切世出世間悉地無不果遂，佩帶此咒能除一切罪障、雷電火災、王難刀兵，臨終決定往生極樂。',
    cbetaInterlinearXmlId: 'T20n1153',
    gretilRecordId: 'gretil-mahpratu',
    verses: [
      makeVerse(
        1,
        '初段・根本真言核心句 (Mūla-Vidyā)',
        'namaḥ sarva-tathāgatebhyo arhadbhyaḥ samyaksaṃbuddhebhyaḥ | oṃ vipula-garbhe vipula-vimale jaya-garbhe vajra-jvālā-garbhe gati-gahane gagana-viśodhani sarva-pāpa-viśodhani oṃ guṇavati gagana-vicāriṇi giri-giri gamari-gamari gaha-gaha gārgari-gārgari gagari-gagari gambhāri-gambhāri gabhīre-gabhīre svāhā |',
        '南無薩嚩怛他蘗帝毘藥。阿囉𠿒毘藥。三藐三佛陀毘藥。唵。毘補攞蘗陛。毘補攞尾摩隸。惹耶蘗陛。嚩日囉入嚩攞蘗陛。蘗底蘗訶儞。蘗蘗那尾戌陀儞。薩嚩播波尾戌陀儞。唵。窶拏嚩底。蘗蘗那尾左哩儞。娑嚩訶。',
        '歸命一切如來、應供、正遍知！唵！廣博胎藏尊、廣博無垢尊、尊勝胎藏尊、金剛火焰胎藏尊、深密行道尊、淨除虛空尊、淨除一切罪障尊！唵！具足功德母、遊行虛空母，娑嚩訶！',
        'Homage to all Tathāgatas, Arhats, Perfectly Awakened Ones! Oṃ! O Vast Womb, Vast Stainless One, Victorious Womb, Vajra-Flame Womb, Deep Path, Sky-Purifier, Purifier of all sins! Oṃ! O Virtuous One coursing through the sky, svāhā!',
        ['二合', '引'],
        [
          makeWord('vipula-garbhe', '毘補攞蘗陛', '廣博胎藏母', 'O Vast Womb / Matrix', 'vipula-garbhā-', 'Voc. Sg. Fem.', '二合'),
          makeWord('vipula-vimale', '毘補攞尾摩隸', '廣大離垢清淨母', 'O Vast Stainless One', 'vipula-vimalā-', 'Voc. Sg. Fem.'),
          makeWord('vajra-jvālā-garbhe', '嚩日囉入嚩攞蘗陛', '金剛熾焰胎藏母', 'O Matrix of Vajra-Flames', 'vajra-jvālā-garbhā-', 'Voc. Sg. Fem.', '二合'),
          makeWord('sarva-pāpa-viśodhani', '薩嚩播波尾戌陀儞', '淨除一切罪業母', 'O Purifier of all evil karmas', 'sarva-pāpa-viśodhanī-', 'Voc. Sg. Fem.', '二合')
        ]
      ),
      makeVerse(
        2,
        '二段・大隨求八字最上心真言 (Aṣṭākṣara-Hṛdaya)',
        'oṃ bhara bhara saṃbhara saṃbhara indriya-viśodhani hūṃ hūṃ ruru cale svāhā |',
        '唵。婆囉婆囉。三婆囉三婆囉。印捺哩耶尾戌馱儞。吽吽。嚕嚕。左隸。娑嚩訶。',
        '唵！任持、任持，積集資糧、積集資糧，清淨諸根尊！吽、吽！光明疾速妙行母，娑嚩訶！',
        'Oṃ! Sustain, sustain! Accumulate, accumulate! O Purifier of the faculties! Hūṃ hūṃ! O Radiant Swift-Moving One, svāhā!',
        ['二合', '引'],
        [
          makeWord('bhara bhara', '婆囉婆囉', '護持、任持', 'Sustain, support!', '√bhṛ-', '2nd Sg. Imperative'),
          makeWord('saṃbhara saṃbhara', '三婆囉三婆囉', '圓滿積集福智資糧', 'Accumulate, bring together!', 'sam-√bhṛ-', '2nd Sg. Imperative'),
          makeWord('indriya-viśodhani', '印捺哩耶尾戌馱儞', '清淨六根者', 'O Purifier of the sense-faculties', 'indriya-viśodhanī-', 'Voc. Sg. Fem.', '二合'),
          makeWord('ruru cale', '嚕嚕左隸', '光明妙行尊', 'O Radiant Moving One', 'ruru-calā-', 'Voc. Sg. Fem.')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T20n1153',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T20/T20n1153.xml',
      taishoLocation: 'T20, no. 1153, p. 616a–637b',
      gretilId: 'mahpratu.htm',
      gretilRawUrl: 'https://raw.githubusercontent.com/INDOLOGY/GRETIL-mirror/master/gretil.sub.uni-goettingen.de/gretil/1_sanskr/4_rellit/buddh/mahpratu.htm',
      sanskritEditionCitation:
        'Gergely Hidas (2012), Mahāpratisarā-Mahāvidyārājñī: The Great Amulet, Great Queen of Spells (mahpratu.htm / psarkdhu.htm)',
      tangPhoneticNotes: ['二合', '三合', '引'],
      rawExcerpt: '<p xml:lang="sa-Sidd" cb:type="dharani"><g ref="#SD-A5A9"/></p>',
      crossRefs: {
        taishoIds: ['T20n1153', 'T20n1154'],
        fangshanIds: ['F27n1061', 'F28n1071'],
        tohokuIds: ['Toh 561'],
        rktsIds: ['K561', 'D561'],
        dsbcIds: ['10'],
        gretilIds: ['mahpratu.htm', 'psarkdhu.htm'],
        buddhaNexusIds: ['K12mahpratu'],
        cudlMsIds: ['MS-ADD-01326', 'MS-ADD-01680-00008-00002']
      }
    }
  },
  {
    id: 'guhyadhatukaranda-dharani',
    titleZh: '一切如來心秘密全身舍利寶篋印陀羅尼',
    shortTitleZh: '寶篋印陀羅尼',
    titleSanskrit: 'Sarvatathāgatādhiṣṭhāna-hṛdaya-guhyadhātukaraṇḍa-mudrā-dhāraṇī',
    titleDevanagari: slp1ToDevanagari(iastToSlp1('Sarvatathāgatādhiṣṭhāna-hṛdaya-guhyadhātukaraṇḍa-mudrā-dhāraṇī', 'strict')),
    titleSiddham: slp1ToSiddhamUnicode(iastToSlp1('Sarvatathāgatādhiṣṭhāna-hṛdaya-guhyadhātukaraṇḍa-mudrā-dhāraṇī', 'strict')),
    titleTibetan: 'དེ་བཞིན་གཤེགས་པ་ཐམས་ཅད་ཀྱི་བྱིན་གྱིས་བརླབས་ཀྱི་སྙིང་པོ་གསང་བ་རིང་བསྲེལ་གྱི་ཟ་མ་ཏོག་ཅེས་བྱ་བའི་གཟུངས།',
    titleEn: 'Dhāraṇī of the Seal of the Casket of Secret Relics of the Heart-Blessing of All Tathāgatas',
    category: 'major-dharanis',
    deity: '十方三世一切如來全身舍利寶塔 (Sarvatathāgata-Guhyadhātukaraṇḍa)',
    taishoId: 'T19n1022A',
    translator: '唐・不空三藏 (Amoghavajra) 譯',
    period: '盛唐 (8th Century CE)',
    summaryZh:
      '漢傳與日本密教造塔供養最核心之陀羅尼（如杭州雷峰塔吳越王錢俶藏經、日本770年《百萬塔陀羅尼》CUDL PR-FG-00870）。T19n1022A 附有262個 `#SD-*` 悉曇梵字，84000 佛典工程（Toh 507, 883）亦已完成標準梵藏英對勘。',
    ritualBenefits:
      '安置此咒於塔像中，即同十方三世一切如來全身舍利聚於一塔，禮拜右繞即滅五無間罪，速證菩提。',
    cbetaInterlinearXmlId: 'T19n1022A',
    verses: [
      makeVerse(
        1,
        '初段・三世如來歸命與法輪莊嚴句 (Tryadhvika-Tathāgata Homage)',
        'namas tryadhvikānāṃ sarva-tathāgatānām | oṃ bhuvi bhavanavare vacanavare | caṭa caṭa culu culu | dhara dhara sarva-tathāgata-dhātu-dhare padmaṃ bhavati jaya-vare mudri smara tathāgata-dharmacakra-pravartana vajra-bodhi-maṇḍālaṃkāra-ālaṃkṛte sarva-tathāgatādhiṣṭhite bodhaya bodhaya bodhi bodhi budhya budhya saṃbodhani saṃbodhaya |',
        '那莫悉怛哩野地尾迦南。薩嚩怛他蘗多南。唵。部尾婆嚩娜嚩隸。嚩左娜嚩隸。左吒左吒。祖嚕祖嚕。馱囉馱囉。薩嚩怛他蘗多馱睹馱隸。鉢納𤚥婆嚩底。惹也嚩隸。畝捺隸。娑摩囉。怛他蘗多達磨斫迦囉鉢囉嚩栗多娜。嚩日囉冒地曼拏楞迦囉楞訖慄帝。薩嚩怛他蘗多地瑟恥帝。冒馱也冒馱也。冒地冒地。沒ദ്ധ沒ദ്ധ。參冒馱儞參冒馱也。',
        '歸命三世一切如來！唵！於大地勝妙宮殿中、勝妙言教中，震動顯現，總持一切如來舍利法界者！蓮花開敷、最勝法印，憶念如來轉妙法輪，金剛菩提道場嚴飾莊嚴，一切如來威神加持，令覺悟、令開敷正覺！',
        'Homage to all Tathāgatas of the three times! Oṃ! In the supreme abode on earth, in supreme speech, dhara dhara, O Holder of the relics of all Tathāgatas! Remember the turning of the Dharma-wheel of the Tathāgatas, adorned with the ornaments of the vajra bodhimaṇḍa, blessed by all Tathāgatas: awaken, awaken, enlighten, enlighten!',
        ['二合', '三合', '引'],
        [
          makeWord('tryadhvikānāṃ', '悉怛哩野地尾迦南', '三世（過去現在未來）之', 'of the three times', 'tri-adhvika-', 'Gen. Pl. Masc.', '三合'),
          makeWord('sarva-tathāgata-dhātu-dhare', '薩嚩怛他蘗多馱睹馱隸', '任持一切如來舍利法界者', 'O Holder of the relics of all Tathāgatas', 'sarva-tathāgata-dhātu-dharā-', 'Voc. Sg. Fem.', '二合'),
          makeWord('tathāgata-dharmacakra-pravartana', '怛他蘗多達磨斫迦囉鉢囉嚩栗多娜', '如來轉妙法輪', 'turning the Dharma-wheel of the Tathāgata', 'tathāgata-dharmacakra-pravartana-', 'Voc./Stem', '二合'),
          makeWord('sarva-tathāgatādhiṣṭhite', '薩嚩怛他蘗多地瑟恥帝', '一切如來加持尊', 'O One blessed by all Tathāgatas', 'sarva-tathāgata-adhiṣṭhitā-', 'Voc. Sg. Fem.', '二合')
        ]
      ),
      makeVerse(
        2,
        '末段・大印總持結願句 (Mahāmudrā Siddhi)',
        'budhya budhya siddhya siddhya bodhaya bodhaya vibodhaya vibodhaya mocaya mocaya vimocaya vimocaya śodhaya śodhaya viśodhaya viśodhaya samantān mocaya samanta-raśmi-pariśuddhe sarva-tathāgata-hṛdayādhiṣṭhānādhiṣṭhite mudre mudre mahāmudre mahā-mantra-padāni svāhā |',
        '沒ദ്ധ沒ദ്ധ。悉ദ്ധ悉ദ്ധ。冒馱也冒馱也。尾冒馱也尾冒馱也。謨左也謨左也。尾謨左也尾謨左也。戌馱也戌馱也。尾戌馱也尾戌馱也。三曼多謨左也。三曼多囉濕彌鉢哩第。薩嚩怛他蘗多紇慄乃野地瑟姹娜地瑟恥帝。畝捺隸畝捺隸。摩訶畝捺隸。摩訶曼怛囉跛娜儞。娑嚩訶。',
        '覺悟、成就、開悟、普遍開悟、解脫、究竟解脫、清淨、究竟清淨！普遍解脫一切，普放光明遍淨無垢者，一切如來心加持所加持者，印、印、大契印，大真言句義，圓滿成就，娑嚩訶！',
        'Awaken, accomplish, enlighten, fully enlighten, liberate, fully liberate, purify, thoroughly purify! Liberate universally, O One completely pure with universal rays, blessed with the heart-blessing of all Tathāgatas! O Seal, Seal, Great Seal, Great Mantra-words, svāhā!',
        ['二合', '引'],
        [
          makeWord('mocaya mocaya', '謨左也謨左也', '令解脫、令解脫', 'Liberate, liberate!', '√muc- (caus.)', '2nd Sg. Imperative'),
          makeWord('viśodhaya viśodhaya', '尾戌馱也尾戌馱也', '令極清淨', 'Thoroughly purify!', 'vi-√śudh- (caus.)', '2nd Sg. Imperative'),
          makeWord('samanta-raśmi-pariśuddhe', '三曼多囉濕彌鉢哩第', '普遍光明遍清淨尊', 'O One completely pure with universal light-rays', 'samanta-raśmi-pariśuddhā-', 'Voc. Sg. Fem.', '二合'),
          makeWord('mudre mudre mahāmudre', '畝捺隸畝捺隸摩訶畝捺隸', '契印、契印、大契印尊', 'O Seal, Seal, Great Seal!', 'mudrā- / mahāmudrā-', 'Voc. Sg. Fem.', '二合')
        ]
      )
    ],
    authoritativeSource: {
      cbetaXmlId: 'T19n1022A',
      cbetaRawUrl: 'https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T19/T19n1022A.xml',
      taishoLocation: 'T19, no. 1022A, p. 710a–712b',
      sanskritEditionCitation:
        'Amoghavajra Siddhaṃ Edition (T19n1022A, 262 #SD-* glyphs) & 84000 Open TEI (UT22084-088-001, Toh 507 & Toh 883)',
      tangPhoneticNotes: ['二合', '三合', '引'],
      rawExcerpt: '<p xml:lang="sa-Sidd" cb:type="dharani" xml:id="pT19p0712a1801"><g ref="#SD-A5A9"/></p>',
      crossRefs: {
        taishoIds: ['T19n1022A', 'T19n1022B'],
        fangshanIds: ['F28n1071'],
        tohokuIds: ['Toh 507', 'Toh 883'],
        rktsIds: ['K507', 'D507', 'D883'],
        cudlMsIds: ['MS-ADD-01680-00008-00003', 'PR-FG-00870']
      }
    }
  }
];
