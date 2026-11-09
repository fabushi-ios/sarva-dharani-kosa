/**
 * src/data/corpus/index.ts
 * Unified Barrel Export for Baseline Curated Multi-Script Dhāraṇī Corpus (28 Dhāraṇīs + 12 Seed Syllables)
 */

import type { DharaniItem, DharaniCategory, SeedSyllable } from '../../types/dharani';
import { MAJOR_DHARANIS } from './major-dharanis';
import { TEN_SMALL_DHARANIS } from './ten-small-dharanis';
import {
  BUDDHAS_BODHISATTVAS_DHARANIS,
  CURATED_SEED_SYLLABLES
} from './buddhas-bodhisattvas';

export {
  MAJOR_DHARANIS,
  TEN_SMALL_DHARANIS,
  BUDDHAS_BODHISATTVAS_DHARANIS,
  CURATED_SEED_SYLLABLES
};

export const BASELINE_CURATED_DHARANIS: DharaniItem[] = [
  ...MAJOR_DHARANIS,
  ...TEN_SMALL_DHARANIS,
  ...BUDDHAS_BODHISATTVAS_DHARANIS
];

export const DHARANI_CATEGORIES: Array<{
  id: DharaniCategory;
  labelZh: string;
  labelEn: string;
  count: number;
}> = [
  {
    id: 'major-dharanis',
    labelZh: '四大咒與根本長咒',
    labelEn: 'Four Great & Fundamental Long Dhāraṇīs',
    count: MAJOR_DHARANIS.length
  },
  {
    id: 'ten-small-dharanis',
    labelZh: '十小咒全集',
    labelEn: 'Complete Ten Small Dhāraṇīs',
    count: TEN_SMALL_DHARANIS.length
  },
  {
    id: 'buddhas-bodhisattvas',
    labelZh: '諸佛菩薩・明王五護・般若心咒',
    labelEn: 'Buddhas, Bodhisattvas, Vidyārājas & Pañcarakṣā',
    count: BUDDHAS_BODHISATTVAS_DHARANIS.length
  },
  {
    id: 'gretil-editions',
    labelZh: 'GRETIL / DSBC 梵文貝葉經校勘本',
    labelEn: 'GRETIL & DSBC Critical Sanskrit Editions',
    count: 25
  },
  {
    id: 'custom',
    labelZh: '自定義梵咒編譯器',
    labelEn: 'Custom Sanskrit Mantra Compiler',
    count: 0
  }
];

export function getDharaniById(id: string): DharaniItem | undefined {
  return BASELINE_CURATED_DHARANIS.find((item) => item.id === id);
}

export function getDharanisByCategory(category: DharaniCategory): DharaniItem[] {
  return BASELINE_CURATED_DHARANIS.filter((item) => item.category === category);
}

export function getSeedSyllableByIastOrSlp1(query: string): SeedSyllable | undefined {
  const q = query.trim();
  return CURATED_SEED_SYLLABLES.find(
    (s) =>
      s.iast.toLowerCase() === q.toLowerCase() ||
      s.slp1 === q ||
      s.devanagari === q ||
      s.siddham === q ||
      s.tangChinese === q
  );
}
