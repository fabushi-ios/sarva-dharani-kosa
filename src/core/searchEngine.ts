/**
 * Cross-Script Diacritic-Insensitive Search Engine (`src/core/searchEngine.ts`)
 * Supports searching across IAST, Devanāgarī, Siddhaṃ, SLP1, Chinese titles,
 * Tang phonetic transcriptions, and Taishō / GRETIL IDs.
 */

import { DharaniCategory, DharaniEntry } from '../types/dharani';
import { inputToSlp1 } from './transliterator';

export function normalizeSearchQuery(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function filterDharaniCorpus(
  entries: DharaniEntry[],
  category: DharaniCategory,
  query: string,
  bookmarkedIds?: Set<string>,
  onlyBookmarks = false
): DharaniEntry[] {
  const normQuery = normalizeSearchQuery(query);
  const querySlp1 = query.trim() ? inputToSlp1(query.trim(), 'smart').toLowerCase() : '';

  return entries.filter((entry) => {
    if (category !== 'all' && entry.category !== category) {
      return false;
    }
    if (onlyBookmarks && bookmarkedIds && !bookmarkedIds.has(entry.id)) {
      return false;
    }
    if (!normQuery) {
      return true;
    }

    const searchableFields = [
      entry.id,
      entry.titleZh,
      entry.titleSanskrit,
      entry.titleDevanagari,
      entry.titleSiddham,
      entry.deityOrSubject,
      entry.summaryZh,
      entry.benefitsZh,
      entry.sourceMetadata.taishoId,
      entry.sourceMetadata.cbetaXmlId,
      entry.sourceMetadata.gretilId || '',
      entry.sourceMetadata.translator,
      ...entry.verses.flatMap((v) => [
        v.iast,
        v.devanagari || '',
        v.tangTranslit,
        v.meaningZh,
        v.meaningEn || '',
      ]),
    ];

    for (const field of searchableFields) {
      if (!field) continue;
      if (field.toLowerCase().includes(query.trim().toLowerCase())) {
        return true;
      }
      if (normalizeSearchQuery(field).includes(normQuery)) {
        return true;
      }
      if (querySlp1 && inputToSlp1(field, 'smart').toLowerCase().includes(querySlp1)) {
        return true;
      }
    }

    return false;
  });
}
