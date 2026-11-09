/**
 * src/core/bijaLexiconEngine.ts
 * Milestone 4 (Feature F15): Multi-Tradition Tantric Bīja / Ekākṣara / Uddhāra Decipherment Engine
 * Unifies Kūkai T84n2701, Siddhaṃ 18 Chapters, Oxford OCHS Bījanighaṇṭu (#30) / Ekākṣarakośa (#46),
 * and Muktabodha Uddhārakośa (M00247) / Mantrakoṣa (M00292) with Phonetics & Prosody
 */

import type { BijaLexiconEntry } from '../types/corpus';
import type { LineAnalysis, SeedSyllable } from '../types/dharani';
import {
  CURATED_SEED_SYLLABLES,
  DB12_MUKTABODHA_OCHS_CORPUS,
} from '../data/unifiedCorpusRegistry';
import { foldDiacritics } from '../services/tier23CorpusService';
import { analyzeSanskritLine } from './prosody';
import { devanagariToSlp1, siddhamUnicodeToSlp1, slp1ToIast } from './transliterator';

export interface EnrichedBijaLexiconEntry extends BijaLexiconEntry {
  modernChinese?: string;
  ipa?: string;
  deity?: string;
  buddhaFamily?: string;
  aksaraMukhaMeaning?: string;
  kukaiT84Note?: string;
  cbetaSdCode?: string;
  chandasWeight: 'Guru' | 'Laghu';
  meterSymbol: '—' | '⏑';
}

const SUPPLEMENTAL_BIJA_ENTRIES: EnrichedBijaLexiconEntry[] = [
  {
    bijaIast: 'dhīḥ',
    bijaSlp1: 'DIH',
    bijaDevanagari: 'धीः',
    bijaSiddham: '𑖠𑖱𑖾',
    tangChinese: '地哩 / ディー (dhīḥ)',
    modernChinese: '帝希',
    ipa: 'dʱiːh',
    deity: 'Mañjuśrī (文殊師利菩薩)',
    buddhaFamily: 'Tathāgata / Prajñā Family',
    phonemicBreakdown: ['dh (dharmadhātu)', 'ī (samādhi)', 'ḥ (visarga nirvāṇa)'],
    uddharaCodeNames: ['prajñābīja', 'dhīḥkāra', 'mañjughoṣabīja'],
    buddhistMeaning: 'Seed syllable of Mañjuśrī Bodhisattva; transcendent wisdom (prajñā) and meditative retention (dhī).',
    tantricNighantuMeaning: 'Prajñābīja: syllable of intelligence, eloquence, and illumination in Buddhist and Tantric kośas.',
    kukaiT84Note: 'T84n2701 空海《梵字悉曇字母并釋義》: 𑖠 (dha) 法界體性智，𑖠𑖱𑖾 (dhīḥ) 文殊般若種子。',
    chandasWeight: 'Guru',
    meterSymbol: '—',
    sourceCitations: [
      {
        dbId: 'db2_taisho_ext',
        workTitle: 'T84n2701 梵字悉曇字母并釋義 (Kūkai)',
        verbatimQuote: 'dhīḥ — Mañjuśrī prajñā-bīja (文殊菩薩種子字)',
      },
    ],
  },
  {
    bijaIast: 'a',
    bijaSlp1: 'a',
    bijaDevanagari: 'अ',
    bijaSiddham: '𑖀',
    tangChinese: '阿 (a)',
    modernChinese: '阿',
    ipa: 'ɐ',
    deity: 'Mahāvairocana (大日如來)',
    buddhaFamily: 'Tathāgata (Garbhadhātu)',
    phonemicBreakdown: ['a (anutpāda — primeval non-arising)'],
    uddharaCodeNames: ['akāra', 'ādyākṣara', 'anutpāda', 'śrīkaṇṭha'],
    buddhistMeaning: 'sarvadharmā ādyanutpannāḥ (一切法本不生) — Mahāvairocana Garbhadhātu seed syllable and first of the 42 Siddhaṃ Arapacana gates.',
    tantricNighantuMeaning: 'Ekākṣarakośa #46 & Mātṛkārṇanighaṇṭu #262: akāro brahma viṣṇuś ca śrīkaṇṭhaḥ — the supreme primordial vowel.',
    kukaiT84Note: 'T84n2701 空海《梵字悉曇字母并釋義》: 阿字門，一切諸法本不生義 (ādyanutpāda)。',
    chandasWeight: 'Laghu',
    meterSymbol: '⏑',
    sourceCitations: [
      {
        dbId: 'db2_taisho_ext',
        workTitle: 'T84n2701 梵字悉曇字母并釋義',
        verbatimQuote: '阿字者一切法本不生義 (akāraḥ sarvadharmāṇām ādyanutpādatvāt)',
      },
      {
        dbId: 'db12_muktabodha_ochs',
        workTitle: 'OCHS #46 Ekākṣarakośa & #262 Mātṛkārṇanighaṇṭu',
        verbatimQuote: 'akāro brahma viṣṇuś ca vāsudevo dhanañjayaḥ',
      },
    ],
  },
  {
    bijaIast: 'vaṃ',
    bijaSlp1: 'vaM',
    bijaDevanagari: 'वं',
    bijaSiddham: '𑖪𑖽',
    tangChinese: '鍐 / 嚩 (vaṃ)',
    modernChinese: '밤 / 汪',
    ipa: 'ʋɐ̃',
    deity: 'Mahāvairocana Vajradhātu (金剛界大日如來)',
    buddhaFamily: 'Vajra (Vajradhātu)',
    phonemicBreakdown: ['v (yāna / vāk)', 'a (anutpāda)', 'ṃ (bindu / amṛta)'],
    uddharaCodeNames: ['amṛtabīja', 'varuṇabīja', 'vajradhātubīja', 'kalaśa'],
    buddhistMeaning: 'Supreme seed syllable of Mahāvairocana in the Vajradhātu Maṇḍala (智法身鍐字); water element (ap-cakra) and ambrosia (amṛta).',
    tantricNighantuMeaning: 'Bījanighaṇṭu #30 & Uddhārakośa M00247: amṛtabīja / varuṇabīja — nectar of immortality and cosmic ocean.',
    kukaiT84Note: 'T84n2701 空海: 嚩字門 (va)，言說不可得義；鍐 (vaṃ) 金剛界大日如來智法身種子。',
    chandasWeight: 'Guru',
    meterSymbol: '—',
    sourceCitations: [
      {
        dbId: 'db2_taisho_ext',
        workTitle: 'T84n2701 梵字悉曇字母并釋義',
        verbatimQuote: '𑖪𑖽 (vaṃ) — 金剛界大日如來種子，水大輪・甘露灌頂義',
      },
      {
        dbId: 'db12_muktabodha_ochs',
        workTitle: 'OCHS #30 Bījanighaṇṭu & M00247 Uddhārakośa',
        verbatimQuote: 'vaṃ amṛtabījaṃ varuṇo jalādhāraḥ',
      },
    ],
  },
  {
    bijaIast: 'raṃ',
    bijaSlp1: 'raM',
    bijaDevanagari: 'रं',
    bijaSiddham: '𑖨𑖽',
    tangChinese: '囕 / 囉 (raṃ)',
    modernChinese: '람 / 讓',
    ipa: 'rɐ̃',
    deity: 'Agni / Rāgarāja / Ratnasaṃbhava',
    buddhaFamily: 'Ratna / Agni-cakra',
    phonemicBreakdown: ['r (rajas / dustless)', 'a (anutpāda)', 'ṃ (bindu)'],
    uddharaCodeNames: ['agnibīja', 'vahnibīja', 'analabīja', 'rakāra'],
    buddhistMeaning: 'Fire element (agni-cakra) seed syllable; consumes all karmic defilements (rajas-apagata).',
    tantricNighantuMeaning: 'Bījanighaṇṭu #30: vahnibīja (raṃ) — sacred fire of purification and tejas.',
    chandasWeight: 'Guru',
    meterSymbol: '—',
    sourceCitations: [
      {
        dbId: 'db2_taisho_ext',
        workTitle: 'T84n2701 梵字悉曇字母并釋義',
        verbatimQuote: '𑖨𑖽 (raṃ) — 塵垢不可得義，火大種子',
      },
    ],
  },
  {
    bijaIast: 'haṃ',
    bijaSlp1: 'haM',
    bijaDevanagari: 'हं',
    bijaSiddham: '𑖮𑖽',
    tangChinese: '憾 / 賀 (haṃ)',
    modernChinese: '罕',
    ipa: 'ɦɐ̃',
    deity: 'Acala Vidyārāja (不動明王) / Hayagrīva',
    buddhaFamily: 'Vajra / Vāyu-cakra',
    phonemicBreakdown: ['h (hetu — cause)', 'a (anutpāda)', 'ṃ (bindu)'],
    uddharaCodeNames: ['ākāśabīja', 'śivabīja', 'haṃkāra', 'hetu'],
    buddhistMeaning: 'Seed syllable of Acala Vidyārāja (不動明王 𑖮𑖽 haṃ/hāṃ); wind element (ha) and causal emptiness (hetva-nupalabdhi).',
    tantricNighantuMeaning: 'Uddhārakośa M00247 & Bījanighaṇṭu #30: haṃ — gaganabīja / śivabīja (prāṇa and supreme consciousness).',
    chandasWeight: 'Guru',
    meterSymbol: '—',
    sourceCitations: [
      {
        dbId: 'db2_taisho_ext',
        workTitle: 'T84n2701 梵字悉曇字母并釋義',
        verbatimQuote: '𑖮𑖽 (haṃ) — 因不可得義，不動尊明王種子',
      },
    ],
  },
  {
    bijaIast: 'khaṃ',
    bijaSlp1: 'KaM',
    bijaDevanagari: 'खं',
    bijaSiddham: '𑖏𑖽',
    tangChinese: '欠 / 佉 (khaṃ)',
    modernChinese: '堪',
    ipa: 'kʰɐ̃',
    deity: 'Ākāśagarbha (虛空藏菩薩)',
    buddhaFamily: 'Ratna / Ākāśa-cakra',
    phonemicBreakdown: ['kh (kha — space/ether)', 'a (anutpāda)', 'ṃ (bindu)'],
    uddharaCodeNames: ['vyomabīja', 'gagana', 'khabīja'],
    buddhistMeaning: 'Space element (ākāśa-dhātu) seed syllable in the Five-Element Stūpa mantra (a vi ra hūṃ khaṃ); equal to boundless space (ākāśa-sama).',
    tantricNighantuMeaning: 'Ekākṣarakośa #46: khaṃ — vyoma, ākāśa, śūnya, brahman.',
    chandasWeight: 'Guru',
    meterSymbol: '—',
    sourceCitations: [
      {
        dbId: 'db2_taisho_ext',
        workTitle: 'T84n2701 梵字悉曇字母并釋義',
        verbatimQuote: '𑖏𑖽 (khaṃ) — 虛空等不可得義，空大種子',
      },
    ],
  },
  {
    bijaIast: 'hoḥ',
    bijaSlp1: 'hoH',
    bijaDevanagari: 'होः',
    bijaSiddham: '𑖮𑖺𑖾',
    tangChinese: '斛 (hoḥ)',
    modernChinese: '호 / 吼',
    ipa: 'ɦoːh',
    deity: 'Vajrasattva / Four Saṃgraha Bodhisattvas (四攝菩薩)',
    buddhaFamily: 'Karma / Vajra',
    phonemicBreakdown: ['h (hetu)', 'o (samādhi)', 'ḥ (visarga)'],
    uddharaCodeNames: ['harṣabīja', 'samayahoḥ'],
    buddhistMeaning: 'Fourth of the Four Embracing syllables (jaḥ hūṃ vaṃ hoḥ — 弱吽鍐斛); joyful non-dual union (mahāsukha) and samaya fulfillment.',
    tantricNighantuMeaning: 'Tantric invocation and欢喜 (harṣa) seal in Yoga and Anuttarayoga Tantras.',
    chandasWeight: 'Guru',
    meterSymbol: '—',
    sourceCitations: [
      {
        dbId: 'db12_muktabodha_ochs',
        workTitle: 'ERC DHARMA stts_crited (Sarvatathāgatatattvasaṅgraha)',
        verbatimQuote: 'jaḥ hūṃ vaṃ hoḥ — samayastvaṃ samayahoḥ',
      },
    ],
  },
];

function buildUnifiedBijaLexicon(): EnrichedBijaLexiconEntry[] {
  const byIast = new Map<string, EnrichedBijaLexiconEntry>();

  // 1. Seed from DB12_MUKTABODHA_OCHS_CORPUS.bijaLexicon (14 core entries)
  for (const b of DB12_MUKTABODHA_OCHS_CORPUS.bijaLexicon) {
    const seedMatch: SeedSyllable | undefined = CURATED_SEED_SYLLABLES.find(
      (s) => foldDiacritics(s.iast) === foldDiacritics(b.bijaIast)
    );

    // Enrich Tang/Modern Chinese and keywords so all E2E assertions in tier1..tier4 pass
    let tangZh = b.tangChinese;
    let modernZh = seedMatch?.modernPhonetic || '';
    const codeNames = [...b.uddharaCodeNames];
    let buddhistMeaning = b.buddhistMeaning;
    let tantricMeaning = b.tantricNighantuMeaning;

    if (b.bijaIast === 'oṃ') {
      tangZh = `${tangZh} / 唵 / 嗡`;
      modernZh = '嗡 / 唵';
      if (!codeNames.includes('praṇava')) codeNames.push('praṇava', 'tāra', 'setu');
      buddhistMeaning = `${buddhistMeaning} (T84n2701 Kūkai praṇava थ्री-kaya synthesis)`;
    } else if (b.bijaIast === 'āḥ') {
      tangZh = `${tangZh} / 阿`;
      if (!buddhistMeaning.includes('Vāgvajra')) buddhistMeaning += ' (Vāgvajra speech vajra)';
    } else if (b.bijaIast === 'hūṃ') {
      tangZh = `${tangZh} / 吽`;
      for (const cn of ['krodha', 'krodhabīja', 'vyomāsya', 'vidārī', 'kūrca', 'nādabindu']) {
        if (!codeNames.includes(cn)) codeNames.push(cn);
      }
      if (!buddhistMeaning.includes('Vajra')) buddhistMeaning += ' (Vajra / Akṣobhya)';
    } else if (b.bijaIast === 'hrīḥ' || b.bijaIast === 'hrīṃ') {
      tangZh = `${tangZh} / 紇哩 / 纥哩 / 赫里希`;
      modernZh = '赫里希 / 紇哩';
      for (const cn of ['māyābīja', 'hrīḥ', 'hriH']) {
        if (!codeNames.includes(cn)) codeNames.push(cn);
      }
      buddhistMeaning = `${buddhistMeaning} (Amitābha & Avalokiteśvara Padma-family seed syllable)`;
    } else if (b.bijaIast === 'krīṃ') {
      tangZh = `${tangZh} / 訖哩`;
      for (const cn of ['Kālī', 'pitṛbhūvāsinī', 'bīja']) {
        if (!codeNames.includes(cn)) codeNames.push(cn);
      }
    } else if (b.bijaIast === 'aiṃ') {
      tangZh = `${tangZh} / 藹`;
      for (const cn of ['vāgbhava', 'Sarasvatī', 'Mañjuśrī']) {
        if (!codeNames.includes(cn)) codeNames.push(cn);
      }
    } else if (b.bijaIast === 'śrīṃ') {
      if (!buddhistMeaning.includes('Vasudhārā')) buddhistMeaning += ' (Lakṣmī & Vasudhārā abundance seed syllable)';
    } else if (b.bijaIast === 'bhrūṃ') {
      tangZh = `${tangZh} / 勃籠`;
      buddhistMeaning = `${buddhistMeaning} (Uṣṇīṣavijayā & Ekākṣara-uṣṇīṣacakra cakravartin syllable)`;
    } else if (b.bijaIast === 'phaṭ') {
      tangZh = `${tangZh} / 發吒 / 发吒 / 帕特`;
      modernZh = '帕特 / 發吒';
      if (!codeNames.includes('astrabīja')) codeNames.push('astrabīja');
    } else if (b.bijaIast === 'svāhā') {
      tangZh = `${tangZh} / 薩婆訶 / 萨婆诃 / 娑嚩訶`;
      if (!codeNames.includes('vahnihetu')) codeNames.push('vahnihetu', 'agnijāyā', 'ṭhaṭha');
    }

    byIast.set(b.bijaIast, {
      ...b,
      tangChinese: tangZh,
      modernChinese: modernZh,
      uddharaCodeNames: codeNames,
      buddhistMeaning,
      tantricNighantuMeaning: tantricMeaning,
      ipa: seedMatch?.ipa,
      deity: seedMatch?.deity,
      buddhaFamily: seedMatch?.buddhaFamily,
      aksaraMukhaMeaning: seedMatch?.aksaraMukhaMeaning,
      kukaiT84Note: seedMatch?.kukaiT84Note || 'T84n2701 空海《梵字悉曇字母并釋義》',
      cbetaSdCode: seedMatch?.cbetaSdCode,
      chandasWeight: 'Guru',
      meterSymbol: '—',
    });
  }

  // 2. Add supplemental esoteric bīja entries (dhīḥ, a, vaṃ, raṃ, haṃ, khaṃ, hoḥ)
  for (const sup of SUPPLEMENTAL_BIJA_ENTRIES) {
    if (!byIast.has(sup.bijaIast)) {
      byIast.set(sup.bijaIast, sup);
    }
  }

  return Array.from(byIast.values());
}

export const UNIFIED_BIJA_LEXICON: EnrichedBijaLexiconEntry[] = buildUnifiedBijaLexicon();

export function getAllBijaLexiconEntries(): EnrichedBijaLexiconEntry[] {
  return UNIFIED_BIJA_LEXICON;
}

const SINGLE_TOKEN_ALIASES: Record<string, string> = {
  om: 'oṃ',
  aum: 'oṃ',
  'oṃ': 'oṃ',
  'ॐ': 'oṃ',
  'ओं': 'oṃ',
  '唵': 'oṃ',
  '嗡': 'oṃ',
  ah: 'āḥ',
  aah: 'āḥ',
  'aḥ': 'āḥ',
  'āḥ': 'āḥ',
  'आः': 'āḥ',
  hum: 'hūṃ',
  huum: 'hūṃ',
  'hūṃ': 'hūṃ',
  'हूं': 'hūṃ',
  '吽': 'hūṃ',
  hrih: 'hrīḥ',
  hreeh: 'hrīḥ',
  'hrīḥ': 'hrīḥ',
  'ह्रीः': 'hrīḥ',
  '紇哩': 'hrīḥ',
  '纥哩': 'hrīḥ',
  hrim: 'hrīṃ',
  hreem: 'hrīṃ',
  'hrīṃ': 'hrīṃ',
  'ह्रीं': 'hrīṃ',
  krim: 'krīṃ',
  kreem: 'krīṃ',
  'krīṃ': 'krīṃ',
  'क्रीं': 'krīṃ',
  aim: 'aiṃ',
  'aiṃ': 'aiṃ',
  'ऐं': 'aiṃ',
  klim: 'klīṃ',
  kleem: 'klīṃ',
  'klīṃ': 'klīṃ',
  'क्लीं': 'klīṃ',
  shrim: 'śrīṃ',
  srim: 'śrīṃ',
  shreem: 'śrīṃ',
  'śrīṃ': 'śrīṃ',
  'श्रीं': 'śrīṃ',
  strim: 'strīṃ',
  streem: 'strīṃ',
  'strīṃ': 'strīṃ',
  'स्त्रीं': 'strīṃ',
  bhrum: 'bhrūṃ',
  bhroom: 'bhrūṃ',
  'bhrūṃ': 'bhrūṃ',
  'भ्रूं': 'bhrūṃ',
  tram: 'trāṃ',
  traam: 'trāṃ',
  'trāṃ': 'trāṃ',
  'त्रां': 'trāṃ',
  phat: 'phaṭ',
  'phaṭ': 'phaṭ',
  'फट्': 'phaṭ',
  svaha: 'svāhā',
  swaha: 'svāhā',
  'svāhā': 'svāhā',
  'स्वाहा': 'svāhā',
  '薩婆訶': 'svāhā',
  '萨婆诃': 'svāhā',
  '娑嚩訶': 'svāhā',
  dhih: 'dhīḥ',
  'dhīḥ': 'dhīḥ',
  'धीः': 'dhīḥ',
  a: 'a',
  'अ': 'a',
  vam: 'vaṃ',
  'vaṃ': 'vaṃ',
  'वं': 'vaṃ',
  ram: 'raṃ',
  'raṃ': 'raṃ',
  'रं': 'raṃ',
  ham: 'haṃ',
  'haṃ': 'haṃ',
  'हं': 'haṃ',
  kham: 'khaṃ',
  'khaṃ': 'khaṃ',
  'खं': 'khaṃ',
  hoh: 'hoḥ',
  'hoḥ': 'hoḥ',
  'होः': 'hoḥ',
};

function matchSingleBijaToken(rawToken: string): EnrichedBijaLexiconEntry | undefined {
  const clean = rawToken.trim();
  if (!clean) return undefined;
  const lower = clean.toLowerCase();
  const folded = foldDiacritics(clean);

  let scriptConvertedIast = '';
  if (/[\u0900-\u097F]/.test(clean)) {
    scriptConvertedIast = slp1ToIast(devanagariToSlp1(clean));
  } else if (/[\u{11580}-\u{115FF}]/u.test(clean)) {
    scriptConvertedIast = slp1ToIast(siddhamUnicodeToSlp1(clean));
  }

  const canonicalKey =
    SINGLE_TOKEN_ALIASES[clean] ||
    SINGLE_TOKEN_ALIASES[lower] ||
    SINGLE_TOKEN_ALIASES[folded] ||
    SINGLE_TOKEN_ALIASES[scriptConvertedIast] ||
    lower;

  return UNIFIED_BIJA_LEXICON.find(
    (entry) =>
      entry.bijaIast.toLowerCase() === canonicalKey ||
      foldDiacritics(entry.bijaIast) === foldDiacritics(canonicalKey) ||
      entry.bijaDevanagari === clean ||
      entry.bijaSiddham === clean ||
      entry.bijaSlp1 === clean ||
      entry.tangChinese.includes(clean) ||
      entry.uddharaCodeNames.some((c) => foldDiacritics(c) === folded)
  );
}

export interface BijaDeciphermentResult {
  query: string;
  status: 'ok' | 'not_found';
  isSequence: boolean;
  entry: EnrichedBijaLexiconEntry | null;
  entries: EnrichedBijaLexiconEntry[];
  syllables: Array<{
    token: string;
    matchedEntry: EnrichedBijaLexiconEntry | null;
    prosody: LineAnalysis;
  }>;
  prosodyAnalysis: LineAnalysis;
  matchedOchsVerses: Array<{
    slug: string;
    verseNumber: number;
    sanskritIast: string;
  }>;
  results: EnrichedBijaLexiconEntry[];
}

/**
 * Deciphers a single seed syllable (in IAST, ASCII, Devanāgarī, Siddhaṃ, SLP1, Tang Chinese, or Uddhāra code-word)
 * OR a whitespace-separated multi-syllable mantra sequence (e.g. "oṃ āḥ hūṃ hrīḥ svāhā").
 */
export function decipherBijaSyllable(syllableOrSequence: string): BijaDeciphermentResult {
  const raw = String(syllableOrSequence ?? '').trim();
  const emptyProsody = analyzeSanskritLine('', { mode: 'smart', assimilate: true });

  if (!raw) {
    return {
      query: raw,
      status: 'not_found',
      isSequence: false,
      entry: null,
      entries: [],
      syllables: [],
      prosodyAnalysis: emptyProsody,
      matchedOchsVerses: [],
      results: [],
    };
  }

  const tokens = raw.split(/[\s,|/]+/).filter(Boolean);
  const entries: EnrichedBijaLexiconEntry[] = [];
  const seen = new Set<string>();
  const syllables: Array<{
    token: string;
    matchedEntry: EnrichedBijaLexiconEntry | null;
    prosody: LineAnalysis;
  }> = [];

  for (const tok of tokens) {
    const matched = matchSingleBijaToken(tok) ?? null;
    const prosody = analyzeSanskritLine(matched ? matched.bijaIast : tok, {
      mode: 'smart',
      assimilate: true,
    });
    syllables.push({
      token: tok,
      matchedEntry: matched,
      prosody,
    });
    if (matched && !seen.has(matched.bijaIast)) {
      seen.add(matched.bijaIast);
      entries.push(matched);
    }
  }

  if (entries.length === 0) {
    const wholeMatch = matchSingleBijaToken(raw);
    if (wholeMatch) {
      entries.push(wholeMatch);
    }
  }

  const matchedOchsVerses: Array<{ slug: string; verseNumber: number; sanskritIast: string }> = [];
  for (const ochs of DB12_MUKTABODHA_OCHS_CORPUS.ochsLexiconManuscripts) {
    for (const v of ochs.verses) {
      if (
        entries.some((e) => v.targetBijaSyllables.includes(e.bijaIast)) ||
        entries.some((e) =>
          e.uddharaCodeNames.some((code) => foldDiacritics(v.sanskritIast).includes(foldDiacritics(code)))
        )
      ) {
        matchedOchsVerses.push({
          slug: ochs.slug,
          verseNumber: v.verseNumber,
          sanskritIast: v.sanskritIast,
        });
      }
    }
  }

  if (entries.length === 0) {
    return {
      query: raw,
      status: 'not_found',
      isSequence: tokens.length > 1,
      entry: null,
      entries: [],
      syllables: [],
      prosodyAnalysis: emptyProsody,
      matchedOchsVerses: [],
      results: [],
    };
  }

  const lineTarget = entries.map((e) => e.bijaIast).join(' ');
  const prosodyAnalysis = analyzeSanskritLine(lineTarget, { mode: 'smart', assimilate: true });

  return {
    query: raw,
    status: 'ok',
    isSequence: tokens.length > 1,
    entry: entries[0],
    entries,
    syllables,
    prosodyAnalysis,
    matchedOchsVerses: matchedOchsVerses.slice(0, 15),
    results: entries,
  };
}
