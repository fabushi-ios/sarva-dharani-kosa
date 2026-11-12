import { describe, expect, it } from 'vitest';
import { filterCatalog } from '../../src/services/canon/canonLibraryService';
import type { CanonCatalogItem } from '../../src/core/canon/canonLibraryTypes';

const item = (id: string, title: string, byline: string, dharani: number): CanonCatalogItem => ({
  id, title, byline, dharani, collection: id.match(/^[A-Z]+/)![0], vol: id.split('n')[0], chars: 1,
});

describe('藏经全文库 catalog search', () => {
  const cat = [
    item('T21n1286', '堅牢地天儀軌', '唐 善無畏譯', 1),
    item('T08n0251', '般若波羅蜜多心經', '唐 玄奘譯', 1),
    item('T09n0262', '妙法蓮華經', '姚秦 鳩摩羅什譯', 3),
    item('X01n0001', '大日經疏', '', 0),
  ];
  it('finds texts by title, number or translator, with or without dhāraṇīs', () => {
    expect(filterCatalog(cat, '堅牢地天').map((c) => c.id)).toEqual(['T21n1286']);
    expect(filterCatalog(cat, 't08n0251').map((c) => c.id)).toEqual(['T08n0251']);
    expect(filterCatalog(cat, '玄奘').map((c) => c.id)).toEqual(['T08n0251']);
    expect(filterCatalog(cat, '大日經疏').map((c) => c.id)).toEqual(['X01n0001']);
  });
  it('filters by collection and dhāraṇī presence', () => {
    expect(filterCatalog(cat, '', { collection: 'X' }).map((c) => c.id)).toEqual(['X01n0001']);
    expect(filterCatalog(cat, '', { dharaniOnly: true })).toHaveLength(3);
  });
});
