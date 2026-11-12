/** 藏经全文库 file formats (scripts/build-canon-library.ts → public/canon). */
export interface CanonCatalogItem {
  id: string;
  collection: string;
  vol: string;
  title: string;
  byline: string;
  /** characters of body text */
  chars: number;
  /** number of passages the source marks as dhāraṇī */
  dharani: number;
}

export interface CanonDharani {
  title?: string;
  text: string;
  siddham?: string;
  iast?: string;
}

export interface CanonTextFile {
  id: string;
  collection: string;
  vol: string;
  title: string;
  byline: string;
  url: string;
  /** [kind, text]: 'h' heading, 't' prose, 'd' dhāraṇī */
  paragraphs: Array<[string, string]>;
  dharani: CanonDharani[];
}
