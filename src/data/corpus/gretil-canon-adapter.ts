/**
 * GRETIL & DSBC Buddhist Sanskrit Manuscript Adapter (`src/data/corpus/gretil-canon-adapter.ts`)
 * Converts authoritative GRETIL Sanskrit manuscript records (`gretilAuthRecords.ts`) into
 * browsable `DharaniEntry` items and exports the unified `ALL_CANONICAL_DHARANIS` corpus.
 */

import { slp1ToSiddham, inputToSlp1 } from '../../core/transliterator';
import { DharaniEntry } from '../../types/dharani';
import { GRETIL_TEXT_RECORDS } from '../generated/gretilAuthRecords';
import { BUDDHAS_BODHISATTVAS_DHARANIS } from './buddhas-bodhisattvas';
import { MAJOR_DHARANIS } from './major-dharanis';
import { TEN_SMALL_DHARANIS } from './ten-small-dharanis';

export const GRETIL_MANUSCRIPT_DHARANIS: DharaniEntry[] = GRETIL_TEXT_RECORDS.map((rec, idx) => {
  const slpTitle = inputToSlp1(rec.titleSanskrit.split(' ')[0], 'strict');
  return {
    id: `gretil-${rec.gretilId.replace('.htm', '')}`,
    titleZh: `[GRETIL 梵本 #${idx + 1}] ${rec.titleZh}`,
    titleSanskrit: rec.titleSanskrit,
    titleDevanagari: rec.mantraExcerptDeva.split('।')[0].trim(),
    titleSiddham: slp1ToSiddham(slpTitle),
    category: 'gretil-manuscripts',
    deityOrSubject: `哥廷根大学 GRETIL 梵文贝叶经定本 (${rec.gretilId})`,
    summaryZh: `${rec.editorCitation} 对应大正藏经号：${rec.correspondingTaisho}。`,
    benefitsZh: rec.meaningZh,
    sourceMetadata: {
      taishoId: rec.correspondingTaisho,
      cbetaXmlId: rec.correspondingTaisho.split('/')[0].trim(),
      cbetaRawUrl: `https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/${rec.correspondingTaisho.slice(0, 3)}/${rec.correspondingTaisho.split('/')[0].trim()}.xml`,
      gretilId: rec.gretilId,
      gretilRawUrl: rec.gretilUrl,
      translator: rec.editorCitation,
      dynasty: '梵文写本原典',
      sanskritEditionCitation: `${rec.editorCitation} (${rec.sourcePublication})`,
      manuscriptProvenance: rec.sourcePublication,
      tangPhoneticNotes: ['GRETIL 国际梵文学界校勘定本', '保留全部古典梵文连声 (Sandhi) 与词尾短元音 a'],
      rawXmlExcerpt: rec.rawHeaderExcerpt,
      rawGretilExcerpt: `${rec.rawHeaderExcerpt}\n\n${rec.mantraExcerptIast}\n${rec.mantraExcerptDeva}`,
    },
    verses: [
      {
        id: `gretil-v-${idx + 1}`,
        verseNumber: 1,
        sectionTitle: `${rec.titleSanskrit} (GRETIL ${rec.gretilId})`,
        iast: rec.mantraExcerptIast,
        devanagari: rec.mantraExcerptDeva,
        tangTranslit: `【梵文贝叶经原典直读】对应《大正藏》${rec.correspondingTaisho}`,
        meaningZh: rec.meaningZh,
      },
    ],
  };
});

export const ALL_CANONICAL_DHARANIS: DharaniEntry[] = [
  ...MAJOR_DHARANIS,
  ...TEN_SMALL_DHARANIS,
  ...BUDDHAS_BODHISATTVAS_DHARANIS,
  ...GRETIL_MANUSCRIPT_DHARANIS,
];
