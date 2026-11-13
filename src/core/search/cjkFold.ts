import { CJK_PHONETIC_GROUPS } from './generated/cjkPhoneticFold';
import { CJK_VARIANT_GROUPS } from './generated/cjkVariantFold';

/**
 * Character -> representative of its toneless Mandarin syllable (derived from Unicode Unihan).
 * Used for phonetic dhāraṇī transliteration matching and fallback when literal match is absent.
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

/**
 * Character -> canonical Traditional/Simplified/Variant representative (derived from Unihan_Variants).
 * Preserves exact lexical identity without collapsing distinct homophones (e.g. 地 != 德 != 的 != 帝).
 */
export const CJK_VARIANT_FOLD: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const line of CJK_VARIANT_GROUPS.split('\n')) {
    if (!line) continue;
    const chars = Array.from(line);
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

export function foldCjkVariant(text: string): string {
  let out = '';
  for (const ch of text) out += CJK_VARIANT_FOLD.get(ch) ?? ch;
  return out;
}
