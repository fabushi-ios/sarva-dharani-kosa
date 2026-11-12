/**
 * src/core/sources/applyCuratedCanon.ts
 *
 * Serves every hand-authored entry with its source database's wording: the CBETA Chinese and
 * GRETIL Sanskrit extracted by code (scripts/build-citation-check.ts → curatedCanon.ts). The
 * hand-typed text is kept only where no source contains the dhāraṇī, and is then labelled as not
 * coming from a database (`derived-reference`). Citation fields are rewritten from the source the
 * text was actually taken from. Applied downstream of the curated modules (src/data/index.ts), so
 * the citation check itself still sees the hand-typed text it locates.
 */
import type { DharaniEntry, DharaniVerse } from '../../types/kosaTypes';
import { CURATED_CANON } from '../../data/kosa-generated/curatedCanon';
import { buildWordGlossesFromIast, generateVerseChinesePhonetics } from '../sanskrit/phoneticMapper';
import { cbetaOnlineUrl, cbetaXmlUrl } from './citationCheck';
import { cleanEditorialIast, siddhamToIast } from '../sanskrit/transliterator';

export function isCuratedEntry(id: string): boolean {
  return id in CURATED_CANON;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

/**
 * CBETA keeps interlinear notes (clause numbers, 二合, fanqie 反切, tones) inline in parentheses.
 * They are the editor's apparatus, not syllables: the line keeps the syllables, the notes go to
 * `tangNoteZh` in order. Concatenating both loses nothing of the source.
 */
export function splitInterlinearNotes(s: string): { text: string; notes: string[] } {
  const notes: string[] = [];
  const text = s
    .replace(/[(（]([^()（）]*)[)）]/g, (_m, inner: string) => {
      if (inner.trim()) notes.push(`(${inner.trim()})`);
      return ' ';
    })
    .replace(/\s+/g, ' ')
    .trim();
  return { text, notes };
}

/** GRETIL plain-text convention: "/" marks a daṇḍa and digits are verse/line numbers. */
export function gretilVerseIast(raw: string): string {
  return cleanEditorialIast(raw)
    .replace(/\d+(?:[.,]\d+)*/g, ' ')
    .replace(/\/+/g, '|')
    .replace(/\|(?:\s*\|)+/g, '|')
    .replace(/\s+/g, ' ')
    .replace(/^[\s|]+|[\s|]+$/g, '')
    .trim();
}

const letters = (x: string) => x.normalize('NFC').toLowerCase().replace(/[^a-zāīūṛṝḷḹṃṁḥṅñṭḍṇśṣ]/g, '').replace(/ṁ/g, 'ṃ');
export function isTransliteratedSiddham(v: DharaniVerse): boolean {
  if (!v.siddhamOriginal || !v.iast) return false;
  const a = letters(siddhamToIast(v.siddhamOriginal));
  return a.length > 0 && a === letters(v.iast);
}

export function applyCuratedCanon(entry: DharaniEntry): DharaniEntry {
  const canon = CURATED_CANON[entry.id];
  if (!canon) return entry;
  const { han, sanskrit } = canon;

  const verses: DharaniVerse[] = entry.verses.map((v, k) => {
    const out: DharaniVerse = { ...v, fieldSources: { ...(v.fieldSources || {}) } };
    // A verse the aligned source passage has no wording for keeps its hand text, labelled non-DB.
    const hanVerse = han ? splitInterlinearNotes(han.verses[k] ?? '') : null;
    const sktVerse = sanskrit ? gretilVerseIast(sanskrit.verses[k] ?? '') : '';
    if (hanVerse && hanVerse.text.trim()) {
      const { text, notes } = hanVerse;
      out.classicalTranslitZh = text;
      if (notes.length) out.tangNoteZh = notes.join(' ');
      out.fieldSources!.classicalTranslitZh = 'db-original';
    } else {
      out.fieldSources!.classicalTranslitZh = 'derived-reference';
    }
    if (sktVerse) {
      const iast = sktVerse;
      if (iast !== v.iast) {
        out.iast = iast;
        // Everything computed from the IAST is recomputed from the source wording.
        out.modernPhoneticZh = generateVerseChinesePhonetics(iast, false).modernPhoneticZh;
        out.words = buildWordGlossesFromIast(iast);
        out.fieldSources!.words = 'derived-reference';
        out.fieldSources!.modernPhoneticZh = 'derived-reference';
        delete out.originalIastTokens;
      }
      out.fieldSources!.iast = 'db-original';
    } else {
      // Without a GRETIL witness the IAST is still DB text when it is the transliteration of the
      // verse's CBETA Siddhaṃ original.
      out.fieldSources!.iast = isTransliteratedSiddham(v) ? 'db-original' : 'derived-reference';
    }
    // Explanatory fields of a hand-authored entry come from no database: labelled as such, the
    // reader shows the code-derived (lexicon) meaning of the verse instead.
    out.fieldSources!.meaningZh = 'derived-reference';
    out.fieldSources!.meaningEn = 'derived-reference';
    return out;
  });

  const notes: string[] = [];
  const next: DharaniEntry = { ...entry, verses, provenance: { ...entry.provenance } };
  if (han) {
    const originalCitation = [entry.taishoNo, entry.sutraSourceZh].filter(Boolean).join(' ');
    next.taishoNo = han.sourceId;
    next.sutraSourceZh = `《${han.title}》(${han.sourceId})`;
    if (han.byline) next.translatorZh = han.byline;
    next.provenance.cbetaId = han.sourceId;
    next.provenance.cbetaRawXmlUrl = cbetaXmlUrl(han.sourceId);
    next.provenance.cbetaOnlineUrl = cbetaOnlineUrl(han.sourceId);
    next.provenance.editionCitation = `CBETA XML-P5 ${han.sourceId}《${han.title}》${han.byline ? `（${han.byline}）` : ''}`;
    notes.push(
      `汉字咒文逐字取自 CBETA ${han.sourceId}《${han.title}》原文（代码比对定位，与整理稿吻合 ${pct(han.coverage)}）。` +
        (originalCitation && !originalCitation.includes(han.sourceId) ? `整理稿原标出处：${originalCitation}。` : '')
    );
  } else {
    notes.push('CBETA 全藏中未检得本条汉字咒文，现显示整理稿文字（非原典原文）。');
  }
  if (sanskrit) {
    next.provenance.gretilFile = sanskrit.file;
    if (sanskrit.url) next.provenance.gretilRawUrl = sanskrit.url;
    notes.push(`梵文转写逐字取自 GRETIL ${sanskrit.file}（吻合 ${pct(sanskrit.coverage)}）。`);
  } else {
    notes.push('梵文转写在已收梵文原典（GRETIL）中未检得，为整理者参考转写。');
  }
  next.provenance.manuscriptNotesZh = [notes.join(''), entry.provenance.manuscriptNotesZh].filter(Boolean).join('\n');
  return next;
}
