import { CJK_PHONETIC_GROUPS } from './generated/cjkPhoneticFold';

/**
 * Character → representative of its toneless Mandarin syllable (derived from Unicode Unihan,
 * see scripts/build-cjk-phonetic-fold.mjs). Folding both the indexed text and the query with
 * this one table makes Chinese search compare by sound, which uniformly covers
 * Traditional/Simplified forms, dhāraṇī transliteration variants and homophone typos —
 * without any hand-maintained character, alias or per-dhāraṇī lists.
 */
export const CJK_PHONETIC_FOLD: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const line of CJK_PHONETIC_GROUPS.split('\n')) {
    const chars = Array.from(line.slice(line.indexOf(':') + 1));
    const rep = chars[0];
    for (const ch of chars) map.set(ch, rep);
  }
  return map;
})();

export function foldCjkPhonetic(text: string): string {
  let out = '';
  for (const ch of text) out += CJK_PHONETIC_FOLD.get(ch) ?? ch;
  return out;
}
