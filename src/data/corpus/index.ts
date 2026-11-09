/**
 * 陀罗尼语料库总索引 (src/data/corpus/index.ts)
 */

import { DharaniCategoryId, DharaniEntry } from '../../types/dharani';
import { MAJOR_DHARANIS } from './major-dharanis';
import { TEN_SMALL_DHARANIS } from './ten-small-dharanis';
import { BUDDHAS_BODHISATTVAS_DHARANIS } from './buddhas-bodhisattvas';
import { GRETIL_CANON_DHARANIS } from './gretil-canon-adapter';

export interface DharaniCategoryMeta {
  id: DharaniCategoryId;
  labelZh: string;
  labelSa: string;
  description: string;
}

export const DHARANI_CATEGORIES: DharaniCategoryMeta[] = [
  { id: 'all', labelZh: '全部陀罗尼总集', labelSa: 'Sarva-Dhāraṇī', description: '精校核心大咒、十小咒与 GRETIL 25部梵本全集' },
  { id: 'major', labelZh: '四大咒与根本大咒', labelSa: 'Mahā-Dhāraṇī', description: '尊胜、大悲、楞严、宝箧印、光明真言' },
  { id: 'ten-small', labelZh: '十小咒全集', labelSa: 'Daśa-Dhāraṇī', description: '如意轮、消灾吉祥、准提、无量寿、药师、往生、善女天等' },
  { id: 'avalokitesvara', labelZh: '观音与度母部', labelSa: 'Avalokiteśvara & Tārā', description: '六字大明、十一面观音桦树皮梵本、绿度母心咒' },
  { id: 'prajna', labelZh: '般若与文殊部', labelSa: 'Prajñā & Mañjuśrī', description: '般若心经咒、文殊五字真言' },
  { id: 'buddhas', labelZh: '诸佛金轮与忏罪部', labelSa: 'Tathāgata & Vajrasattva', description: '一字金轮佛顶、金刚萨埵百字明' },
  { id: 'vidyaraja', labelZh: '明王金刚护法部', labelSa: 'Vidyārāja', description: '圣不动明王慈救真言、金刚摧碎、马头明王' },
  { id: 'gretil-canon', labelZh: 'GRETIL 25部贝叶梵本', labelSa: 'GRETIL Palm-Leaf Canon', description: '德国哥廷根大学 GRETIL 25部现存梵文写本直读' }
];

export const CURATED_DHARANIS: DharaniEntry[] = [
  ...MAJOR_DHARANIS,
  ...TEN_SMALL_DHARANIS,
  ...BUDDHAS_BODHISATTVAS_DHARANIS
];

export const ALL_DHARANIS: DharaniEntry[] = [
  ...CURATED_DHARANIS,
  ...GRETIL_CANON_DHARANIS
];
