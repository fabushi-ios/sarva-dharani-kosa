/**
 * 跨文种去重音符模糊检索引擎 (src/core/searchEngine.ts)
 * 支持：汉文经名、大正藏经号 (如 T19n0974B)、IAST 梵文、无变音符罗马拼音 (如 om mani padme hum)、天城体、悉昙体、本尊名号检索
 */

import { DharaniEntry, DharaniCategoryId } from '../types/dharani';

export function normalizeSanskritSearchQuery(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function filterDharanis(
  entries: DharaniEntry[],
  category: DharaniCategoryId,
  query: string
): DharaniEntry[] {
  const byCategory =
    category === 'all' ? entries : entries.filter(e => e.category === category);

  const q = query.trim();
  if (!q) return byCategory;

  const qNorm = normalizeSanskritSearchQuery(q);

  return byCategory.filter(entry => {
    const searchableFields = [
      entry.titleZh,
      entry.titleSaIast,
      entry.titleSaDeva,
      entry.titleEn,
      entry.deityFocus,
      entry.seedSyllableIast,
      entry.seedSyllableZh,
      entry.summaryZh,
      entry.sourceMeta.cbetaXmlId,
      entry.sourceMeta.gretilId || '',
      entry.sourceMeta.ancientTranslator,
      ...entry.verses.flatMap(v => [
        v.iast,
        v.tangTranslit,
        v.meaningZh,
        v.meaningEn,
        v.modernPhonetic || ''
      ])
    ];

    return searchableFields.some(field => {
      if (!field) return false;
      if (field.toLowerCase().includes(q.toLowerCase())) return true;
      return normalizeSanskritSearchQuery(field).includes(qNorm);
    });
  });
}
