import type { DharaniEntry } from '../../types/kosaTypes';
import type { CanonCatalogItem } from './canonLibraryTypes';

export type CbetaBuleiId =
  | 'mikkyo'
  | 'prajna'
  | 'lotus'
  | 'avatamsaka'
  | 'ratnakuta'
  | 'nirvana'
  | 'mahasamghata'
  | 'sutra-samnipata'
  | 'agama'
  | 'jataka'
  | 'vinaya'
  | 'sutra-sastra'
  | 'abhidharma'
  | 'madhyamaka'
  | 'yogacara'
  | 'sastra-samnipata'
  | 'pureland'
  | 'chan'
  | 'history'
  | 'encyclopedia'
  | 'dunhuang-extra';

export interface CbetaBuleiMeta {
  id: CbetaBuleiId;
  labelTrad: string;
  labelZh: string;
  shortZh: string;
  taishoRangeNote: string;
}

export const CBETA_BULEI_LIST: CbetaBuleiMeta[] = [
  { id: 'mikkyo', labelTrad: '密教部類', labelZh: '密教部类', shortZh: '密教部', taishoRangeNote: 'T18–T21 · 房山密咒 · 梵藏密续' },
  { id: 'prajna', labelTrad: '般若部類', labelZh: '般若部类', shortZh: '般若部', taishoRangeNote: 'T05–T08 · 心经 · 金刚经' },
  { id: 'lotus', labelTrad: '法華部類', labelZh: '法华部类', shortZh: '法华部', taishoRangeNote: 'T09a · 法华三部经' },
  { id: 'avatamsaka', labelTrad: '華嚴部類', labelZh: '华严部类', shortZh: '华严部', taishoRangeNote: 'T09b–T10 · 华严经系' },
  { id: 'ratnakuta', labelTrad: '寶積部類', labelZh: '宝积部类', shortZh: '宝积部', taishoRangeNote: 'T11–T12a · 大宝积经系' },
  { id: 'nirvana', labelTrad: '涅槃部類', labelZh: '涅槃部类', shortZh: '涅槃部', taishoRangeNote: 'T12b · 大般涅槃经系' },
  { id: 'mahasamghata', labelTrad: '大集部類', labelZh: '大集部类', shortZh: '大集部', taishoRangeNote: 'T13 · 大方等大集经系' },
  { id: 'sutra-samnipata', labelTrad: '經集部類', labelZh: '经集部类', shortZh: '经集部', taishoRangeNote: 'T14–T17 · 诸大乘显教经集' },
  { id: 'pureland', labelTrad: '淨土宗部類', labelZh: '净土宗部类', shortZh: '净土部', taishoRangeNote: '净土群经与历代注疏' },
  { id: 'agama', labelTrad: '阿含部類', labelZh: '阿含部类', shortZh: '阿含部', taishoRangeNote: 'T01–T02 · 四阿含与南传尼柯耶' },
  { id: 'jataka', labelTrad: '本緣部類', labelZh: '本缘部类', shortZh: '本缘部', taishoRangeNote: 'T03–T04 · 本生与佛传' },
  { id: 'vinaya', labelTrad: '律部類', labelZh: '律部类', shortZh: '律部', taishoRangeNote: 'T22–T24 · 戒本与广律' },
  { id: 'sutra-sastra', labelTrad: '釋經論部類', labelZh: '释经论部类', shortZh: '释经论', taishoRangeNote: 'T25–T26a · 大智度论等' },
  { id: 'abhidharma', labelTrad: '毘曇部類', labelZh: '毗昙部类', shortZh: '毗昙部', taishoRangeNote: 'T26b–T29 · 俱舍与婆沙' },
  { id: 'madhyamaka', labelTrad: '中觀部類', labelZh: '中观部类', shortZh: '中观部', taishoRangeNote: 'T30a · 中论与三论' },
  { id: 'yogacara', labelTrad: '瑜伽部類', labelZh: '瑜伽部类', shortZh: '瑜伽部', taishoRangeNote: 'T30b–T31 · 瑜伽唯识诸论' },
  { id: 'sastra-samnipata', labelTrad: '論集部類', labelZh: '论集部类', shortZh: '论集部', taishoRangeNote: 'T32 · 起信论等诸论' },
  { id: 'chan', labelTrad: '禪宗部類', labelZh: '禅宗部类', shortZh: '禅宗部', taishoRangeNote: 'T47–T48 · 禅门语录灯史' },
  { id: 'history', labelTrad: '史傳部類', labelZh: '史传部类', shortZh: '史传部', taishoRangeNote: 'T49–T52 · 僧传与寺志' },
  { id: 'encyclopedia', labelTrad: '事彙部類', labelZh: '事汇部类', shortZh: '事汇·悉昙', taishoRangeNote: 'T53–T54 · T84 悉昙字书与辞书' },
  { id: 'dunhuang-extra', labelTrad: '新編部類', labelZh: '新编与古逸部类', shortZh: '古逸·新编', taishoRangeNote: 'T85 敦煌古逸 · 丝路梵本与外典' },
];

export const CBETA_BULEI_MAP: Record<CbetaBuleiId, CbetaBuleiMeta> = Object.fromEntries(
  CBETA_BULEI_LIST.map((b) => [b.id, b])
) as Record<CbetaBuleiId, CbetaBuleiMeta>;

function inferBuleiByTitle(title: string, col = ''): CbetaBuleiId {
  if (col === 'CC' || col === 'J' || /語錄|禪師|宗鏡|傳燈|公案|拈古|頌古|五燈|碧巖|無門關|壇經/.test(title)) {
    if (!/陀羅尼|陁羅尼|儀軌|真言/.test(title)) return 'chan';
  }
  if (col === 'GA' || col === 'GB' || col === 'ZS' || /高僧傳|寺志|山志|佛祖統紀|開元釋教錄|出三藏記/.test(title)) {
    return 'history';
  }
  if (col === 'N') return 'agama';
  if (/悉曇|字記|梵語|翻譯名義|一切經音義|法苑珠林|經律異相|種子字|Bīja|Varṇa|Siddham/i.test(title)) {
    return 'encyclopedia';
  }
  if (/般若|金剛般若|心經|Prajñāpāramitā|Vajracchedikā/i.test(title)) {
    return 'prajna';
  }
  if (/法華|蓮華經|無量義經|觀普賢菩薩行法|Saddharmapuṇḍarīka/i.test(title)) {
    return 'lotus';
  }
  if (/華嚴|十地經|入法界品|普賢行願|Gaṇḍavyūha|Bhadracarī|Daśabhūmika/i.test(title)) {
    return 'avatamsaka';
  }
  if (/阿彌陀|無量壽|觀無量壽|淨土|往生論|西方合論|Sukhāvatī/i.test(title) && !/陀羅尼|真言|儀軌/.test(title)) {
    return 'pureland';
  }
  if (/寶積|勝鬘|維摩詰/.test(title) && /寶積/.test(title)) {
    return 'ratnakuta';
  }
  if (/涅槃|泥洹/.test(title) && !/阿含/.test(title)) {
    return 'nirvana';
  }
  if (/大集經|虛空藏|十輪經/.test(title) && !/陀羅尼|真言|儀軌/.test(title)) {
    return 'mahasamghata';
  }
  if (/戒本|比丘戒|四分律|五分律|十誦律|梵網|菩薩戒|羯磨|行事鈔/.test(title)) {
    return 'vinaya';
  }
  if (/俱舍|婆沙|阿毘達磨|阿毗達磨|發智論|識身足/.test(title)) {
    return 'abhidharma';
  }
  if (/中論|百論|十二門論|掌珍論|中觀/.test(title)) {
    return 'madhyamaka';
  }
  if (/瑜伽師地|唯識|攝大乘|辨中邊|二十唯識|三十唯識|因明/.test(title)) {
    return 'yogacara';
  }
  if (/大智度論/.test(title)) {
    return 'sutra-sastra';
  }
  if (/起信論|寶性論|集論/.test(title)) {
    return 'sastra-samnipata';
  }
  if (/阿含|大樓炭|起世經|大三摩惹/.test(title)) {
    return 'agama';
  }
  if (/本生|譬喻|法句|佛本行|佛所行讚/.test(title)) {
    return 'jataka';
  }
  if (/陀羅尼|陁羅尼|真言|神咒|神呪|儀軌|曼荼羅|金剛頂|大日經|蘇悉地|明王|佛頂|準提|准提|大悲|楞嚴|尊勝|度母|Dhāraṇī|Mantra|Tantra|Sādhana/i.test(title)) {
    return 'mikkyo';
  }
  if (col === 'F') return 'mikkyo';
  if (col === 'ZW' || col === 'B' || col === 'Y' || col === 'TX' || col === 'LC' || col === 'YP') {
    return 'dunhuang-extra';
  }
  return 'sutra-samnipata';
}

export function resolveCanonIdBulei(canonId: string, title = ''): CbetaBuleiId {
  const cleaned = (canonId || '').trim();
  const tm = cleaned.match(/^T(\d{2})n0*(\d+)/i);
  if (tm) {
    const vol = Number(tm[1]);
    const num = Number(tm[2]);
    if (num >= 1 && num <= 151) return 'agama';
    if (num >= 152 && num <= 219) return 'jataka';
    if (num >= 220 && num <= 261) return 'prajna';
    if (num >= 262 && num <= 277) return 'lotus';
    if (num >= 278 && num <= 309) return 'avatamsaka';
    if (num >= 310 && num <= 373) {
      if (num >= 360 && num <= 370) return 'pureland';
      return 'ratnakuta';
    }
    if (num >= 374 && num <= 396) return 'nirvana';
    if (num >= 397 && num <= 424) return 'mahasamghata';
    if (num >= 425 && num <= 847) return 'sutra-samnipata';
    if (num >= 848 && num <= 1420) return 'mikkyo';
    if (num >= 1421 && num <= 1504) return 'vinaya';
    if (num >= 1505 && num <= 1535) return 'sutra-sastra';
    if (num >= 1536 && num <= 1563) return 'abhidharma';
    if (num >= 1564 && num <= 1578) return 'madhyamaka';
    if (num >= 1579 && num <= 1627) return 'yogacara';
    if (num >= 1628 && num <= 1692) return 'sastra-samnipata';
    if (vol === 47 || vol === 48) {
      if (num >= 1957 && num <= 1984) return 'pureland';
      return 'chan';
    }
    if (vol >= 49 && vol <= 52) return 'history';
    if ((vol >= 53 && vol <= 55) || vol === 84) return 'encyclopedia';
    if (vol === 85) return 'dunhuang-extra';
    return inferBuleiByTitle(title, 'T');
  }

  const colMatch = cleaned.match(/^([A-Z]{1,2})\d/i);
  const col = colMatch ? colMatch[1].toUpperCase() : '';
  if (cleaned.startsWith('F28n1071') || cleaned.startsWith('F27') || cleaned.startsWith('F28')) {
    return 'mikkyo';
  }
  return inferBuleiByTitle(title, col);
}

export function resolveCanonItemBulei(
  item: Pick<CanonCatalogItem, 'id' | 'collection' | 'vol' | 'title'>
): CbetaBuleiId {
  return resolveCanonIdBulei(item.id, item.title);
}

const ENTRY_BULEI_CACHE = new WeakMap<DharaniEntry, CbetaBuleiId>();

export function resolveEntryBulei(entry: DharaniEntry): CbetaBuleiId {
  const cached = ENTRY_BULEI_CACHE.get(entry);
  if (cached) return cached;

  let res: CbetaBuleiId;
  if (entry.categoryId === 'vedic-tantra-siddhanta') {
    res = 'dunhuang-extra';
  } else if (entry.provenance.databaseId === 'db11_idp_dunhuang') {
    res = 'dunhuang-extra';
  } else if (entry.provenance.databaseId === 'db12_muktabodha_ochs' && /bīja|nighaṇṭu|kośa|种子字/i.test(entry.titleZh + ' ' + entry.titleSanskritIast)) {
    res = 'encyclopedia';
  } else if (entry.provenance.databaseId === 'db8_polyglotta' && /心经|Prajñāpāramitā/i.test(entry.titleZh + ' ' + entry.titleSanskritIast)) {
    res = 'prajna';
  } else {
    const cbetaId =
      entry.provenance.cbetaId ||
      (entry.taishoNo.match(/([A-Z]{1,2}\d{2,3}n[0-9A-Za-z]+)/) || ['', ''])[1];
    if (cbetaId) {
      res = resolveCanonIdBulei(cbetaId, entry.titleZh);
    } else {
      res = inferBuleiByTitle(`${entry.titleZh} ${entry.titleSanskritIast} ${entry.sutraSourceZh}`);
    }
  }

  ENTRY_BULEI_CACHE.set(entry, res);
  return res;
}

const SYNONYM_GROUPS: string[][] = [
  ['地天', '地神', '堅牢地神', '堅牢地天', '持地神', '比里底毘', '鉢羅體吠', '畢哩體微', '畢哩體吠', '堅牢', '堅固地神', '地神天', '堅牢地祇', 'Pṛthivī'],
  ['觀音', '观音', '觀世音', '觀自在', '聖觀自在', '大悲咒', '千手千眼', 'Avalokiteśvara', 'Nīlakaṇṭha', '六字大明'],
  ['文殊', '曼殊室利', '文殊師利', '妙吉祥', '五字真言', '八字真言', 'Mañjuśrī', 'Arapacana'],
  ['尊勝', '尊胜', '佛頂尊勝', '尊勝陀羅尼', '淨除一切惡道', 'Uṣṇīṣavijayā', '白傘蓋'],
  ['心經', '心经', '般若心經', '般若波羅蜜多心經', 'Prajñāpāramitāhṛdaya', '揭諦'],
  ['金剛', '金刚', '金剛經', '金剛般若波羅蜜經', '金剛頂', '金剛薩埵', '穢跡金剛', 'Vajracchedikā'],
  ['藥師', '药师', '藥師琉璃光如來', '藥師灌頂真言', '十二神將', 'Bhaiṣajyaguru'],
  ['阿彌陀', '阿弥陀', '彌陀', '無量壽經', '往生咒', '拔一切業障根本得生淨土', 'Amitābha', 'Sukhāvatī'],
  ['準提', '准提', '七俱胝佛母', '準提陀羅尼', 'Cundī', '折隸主隸'],
  ['不動', '不动', '不動明王', '聖無動尊', '慈救真言', '火界咒', 'Acalanātha'],
  ['度母', '多羅', '綠度母', '聖救度佛母', '二十一禮讚', 'Tārā'],
  ['雨寶', '雨宝', '財源天母', '持世菩薩', '大吉祥天女', 'Vasudhārā', 'Mahāśrī'],
  ['楞嚴', '楞严', '首楞嚴', '大白傘蓋', 'Sitātapatrā', 'Śūraṅgama'],
  ['地藏', '地藏菩薩', '滅定業真言', '十輪經', 'Kṣitigarbha'],
  ['孔雀', '大孔雀明王', '佛母大孔雀', '五護陀羅尼', 'Mahāmāyūrī', 'Pañcarakṣā'],
  ['隨求', '随求', '大隨求', '普遍光明清淨熾盛', 'Mahāpratisarā'],
  ['寶篋', '宝箧', '寶篋印陀羅尼', '全身舍利', 'Kāraṇḍamudrā'],
];

export function getRelatedQuerySuggestions(rawQuery: string): string[] {
  const q = rawQuery.trim();
  if (!q) return [];
  const lower = q.toLowerCase();
  const matched = new Set<string>();
  for (const grp of SYNONYM_GROUPS) {
    if (grp.some((term) => term.toLowerCase().includes(lower) || lower.includes(term.toLowerCase()))) {
      for (const term of grp) {
        if (term.toLowerCase() !== lower) matched.add(term);
      }
    }
  }
  return Array.from(matched).slice(0, 12);
}
