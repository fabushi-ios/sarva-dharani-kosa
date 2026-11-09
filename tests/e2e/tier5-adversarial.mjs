/**
 * Tier 5: Adversarial Coverage Hardening Suite (T5-ADV-01..T5-ADV-32)
 * Populated during Final Milestone M5 Phase 2 (Challenger -> Worker -> Reviewer loop).
 */
import assert from 'node:assert/strict';
import path from 'node:path';
import { tsImport } from 'tsx/esm/api';
import {
  ROOT_DIR,
  CANONICAL_DB_IDS,
  readProjectFile,
  readJsonFile,
  findFilesRecursive,
  runKosaCliJson,
  runKosaCliAllowError,
  stringifyDeep,
  assertContainsAll,
  assertContainsAny,
} from './helpers/harness.mjs';

const tsModuleCache = new Map();
async function loadTs(relPath) {
  if (tsModuleCache.has(relPath)) return tsModuleCache.get(relPath);
  const absPath = path.join(ROOT_DIR, relPath);
  const mod = await tsImport(absPath, import.meta.url);
  tsModuleCache.set(relPath, mod);
  return mod;
}

export const TIER5_TESTS = [
  // =========================================================================
  // T5-ADV-01..16: Core Engines (F1, F2, F15) & React UI / CLI (F16)
  // =========================================================================
  {
    id: 'T5-ADV-01',
    tier: 5,
    features: ['F1', 'F2'],
    title: 'CBETA 2,240 Gaiji (#SD-*/#RJ-*) Zero-PUA Audit, T18–T21 Volume Partition & Siddhaṃ Glyph Round-Trip',
    async run() {
      const cbeta = await loadTs('src/data/generated/cbetaAuthRecords.ts');
      const mikkyo = await loadTs('src/data/generated/taishoMikkyoIndex.ts');
      const trans = await loadTs('src/core/transliterator.ts');

      const keys = Object.keys(cbeta.CBETA_GAIJI_MAP);
      assert.equal(keys.length, 2240, 'CBETA_GAIJI_MAP must contain exactly 2,240 entries');
      assert.equal(keys.filter((k) => k.startsWith('SD-')).length, 2074, 'Must contain 2,074 SD-* Siddhaṃ entries');
      assert.equal(keys.filter((k) => k.startsWith('RJ-')).length, 166, 'Must contain 166 RJ-* Ranjana entries');
      assert.equal(cbeta.CBETA_AUTH_RECORDS.length, 19, 'Must contain 19 core CBETA <cb:tt> scriptures');
      assert.equal(cbeta.CBETA_TOTAL_TT_ALIGNMENTS, 916, 'Must contain 916 <cb:tt> interlinear alignments');
      assert.equal(mikkyo.TAISHO_MIKKYO_INDEX.length, 614, 'Must index 614 Taishō Mikkyō works');

      const ka = cbeta.CBETA_GAIJI_MAP['SD-A440'];
      assert.equal(trans.siddhamUnicodeToSlp1(ka.siddhamUnicode), 'ka');
      assert.equal(trans.slp1ToDevanagari('ka'), ka.devanagari);
    },
  },
  {
    id: 'T5-ADV-02',
    tier: 5,
    feature: 'F2',
    title: 'Unicode NFD vs. NFC Normalization, Precomposed/Combining Devanāgarī Nukta & Candrabindu Round-Trip',
    async run() {
      const trans = await loadTs('src/core/transliterator.ts');
      const nfdIast = 'o\u0304m\u0323 prajn\u0303a\u0304 kr\u0323s\u0323n\u0323a r\u0323\u0304 l\u0323\u0304';
      assert.equal(
        trans.iastToSlp1(nfdIast, 'strict'),
        'oM prajYA kfzRa F X',
        'Decomposed NFD IAST must normalize to NFC before SLP1 rule application'
      );

      const nuktaDeva = 'क़ख़ग़ज़ड़ढ़फ़ क\u093c\u094d क\u093c\u093e क\u093c';
      assert.equal(
        trans.devanagariToSlp1(nuktaDeva),
        'kaKagajaqaQaPa k kA ka',
        'Precomposed and combining Devanāgarī Nukta consonants must map cleanly to SLP1'
      );

      const candraSlp = trans.devanagariToSlp1('ओँ हूँ');
      assert.equal(candraSlp, 'o~ hU~');
      assert.equal(trans.iastToSlp1('oṃ\u0310 hūm\u0310', 'strict'), 'o~ hU~');
      const candraSid = trans.slp1ToSiddhamUnicode(candraSlp);
      assert.ok(candraSid.includes('\u{115BC}'), 'Candrabindu ~ must map to U+115BC in Unicode Siddhaṃ');
      assert.equal(trans.siddhamUnicodeToSlp1(candraSid), 'o~ hU~');
    },
  },
  {
    id: 'T5-ADV-03',
    tier: 5,
    feature: 'F2',
    title: 'Unicode Siddhaṃ Post-Consonantal Vocalic ḷ/ḹ (x/X) 3-Codepoint Sequence, Alt u/U Matras & Daṇḍas',
    async run() {
      const trans = await loadTs('src/core/transliterator.ts');
      const slp = 'kxpti kXpti | ||';
      const sid = trans.slp1ToSiddhamUnicode(slp);
      assert.ok(sid.includes('\u{115BF}\u{115A9}\u{115B4}'), 'Vocalic l (x) must encode as virāma + la + vocalic r');
      assert.ok(sid.includes('\u{115BF}\u{115A9}\u{115B5}'), 'Vocalic ll (X) must encode as virāma + la + vocalic rr');
      assert.ok(sid.includes('\u{115C2}') && sid.includes('\u{115C3}'), 'Single and double Siddhaṃ daṇḍas must be encoded');
      assert.equal(trans.siddhamUnicodeToSlp1(sid), slp, 'Vocalic l/ll and daṇḍas must round-trip losslessly to SLP1');
      assert.equal(
        trans.siddhamUnicodeToSlp1('\u{1158E}\u{115DC}\u{1158E}\u{115DD}'),
        'kukU',
        'Alternative Siddhaṃ vowel signs U+115DC and U+115DD must decode to u and U'
      );
    },
  },
  {
    id: 'T5-ADV-04',
    tier: 5,
    features: ['F2', 'F11'],
    title: 'Tibetan EWTS Adversarial Folio Headers, Subjoined Stacks, Vocalic r-i/l-i, A-chung & Multi-Syllable Coalescence',
    async run() {
      const trans = await loadTs('src/core/transliterator.ts');
      const rawEwts =
        "24b3(rgyud): @## / ! / rgya gar skad du / oM badz+ra sat+wa u ts+tshuSh+ma dz+nyA na k+Sha ya r-i r-I l-i l-I 'a 'i 'u bho dha ra kū ṭa gā ra ta dya thā bo dhi sa ttva swA hA //";
      const iast = trans.ewtsToIast(rawEwts);
      assertContainsAll(
        iast,
        [
          'oṃ',
          'vajra',
          'sattva',
          'ucchuṣma',
          'jñā na',
          'kṣa ya',
          'ṛ',
          'ṝ',
          'ḷ',
          'ḹ',
          'ā',
          'ī',
          'ū',
          'bhodhara',
          'kūṭagāra',
          'tadyathā',
          'bodhisattva',
          'svāhā',
        ],
        'Comprehensive EWTS → IAST rules and multi-syllable coalescence'
      );
    },
  },
  {
    id: 'T5-ADV-05',
    tier: 5,
    feature: 'F2',
    title: '3-Pass Akṣara Syllabifier Untested Branches: Override + Coda (SrIm), Pure Virāma Cluster (kz) & Geminate Coda Suppression (budDa)',
    async run() {
      const prosody = await loadTs('src/core/prosody.ts');
      const srim = prosody.parseAndTransliterateWord('SrIm');
      assert.equal(srim.length, 1);
      assert.equal(srim[0].varga, '复合闭音节', 'Override syllable SrI + coda m must hit composite closed-syllable branch');
      assert.equal(srim[0].meter, '—');

      const pureCons = prosody.parseAndTransliterateWord('kz');
      assert.equal(pureCons.length, 1);
      assert.equal(pureCons[0].meter, '', 'Pure vowelless consonant cluster must have empty meter');
      assert.ok(pureCons[0].note.includes('Virāma'), 'Pure vowelless cluster must report Virāma note');

      const buddha = prosody.parseAndTransliterateWord('budDa');
      assert.equal(buddha.length, 2);
      assert.equal(buddha[0].m, '不', 'Modern phonetic must suppress duplicate dental stop d before D');
      assert.equal(buddha[0].t, '部陀', 'Tang reconstruction must retain closed coda character 陀');

      const noAssim = prosody.analyzeSanskritLine('saṃgate', { assimilate: false });
      assert.equal(noAssim.words[0].syllables[0].modernPhonetic, '萨姆', 'Disabling assimilation must preserve labial 萨姆');
    },
  },
  {
    id: 'T5-ADV-06',
    tier: 5,
    feature: 'F2',
    title: '6-Grade Visarga (ḥ) Echo-Vowel Matrix & 5-Place Anusvāra (ṃ/~) IPA Assimilation with Avagraha Length',
    async run() {
      const prosody = await loadTs('src/core/prosody.ts');
      const trans = await loadTs('src/core/transliterator.ts');

      assert.equal(prosody.resolveModifiers('H', 'i', '', true).mMod, '希');
      assert.equal(prosody.resolveModifiers('H', 'u', '', true).mMod, '呼');
      assert.equal(prosody.resolveModifiers('H', 'e', '', true).mMod, '嘿');
      assert.equal(prosody.resolveModifiers('H', 'o', '', true).mMod, '豁');
      assert.equal(prosody.resolveModifiers('H', 'f', '', true).mMod, '里希');
      assert.equal(prosody.resolveModifiers('H', 'a', '', true).mMod, '哈');

      assert.ok(trans.slp1ToIpa('saMka').includes('ŋ'), 'Velar IPA assimilation [ŋ]');
      assert.ok(trans.slp1ToIpa('saMca').includes('ɲ'), 'Palatal IPA assimilation [ɲ]');
      assert.ok(trans.slp1ToIpa('saMwa').includes('ɳ'), 'Retroflex IPA assimilation [ɳ]');
      assert.ok(trans.slp1ToIpa('saMta').includes('n̪'), 'Dental IPA assimilation [n̪]');
      assert.ok(trans.slp1ToIpa('saMpa').includes('m'), 'Labial IPA assimilation [m]');
      assert.ok(trans.slp1ToIpa("so'ham").includes('ː'), 'Avagraha must generate IPA length mark ː');
    },
  },
  {
    id: 'T5-ADV-07',
    tier: 5,
    feature: 'F2',
    title: '136.1 Hz Web Audio Formant Engine Boundary Rate Clamping, 14-Vowel Formant Table & Headless speakSanskrit',
    async run() {
      const audio = await loadTs('src/services/sanskritAudioEngine.ts');
      const vowels = Object.keys(audio.VOWEL_FORMANTS);
      assert.equal(vowels.length, 14, 'VOWEL_FORMANTS must cover all 14 Sanskrit vowels');

      for (const v of vowels) {
        const prof = audio.computeSyllableAcousticProfile(`k${v}M`, 0);
        assert.equal(prof.fundamentalHz, 136.1);
        assert.equal(prof.subHarmonicHz, 272.2);
        assert.equal(prof.vowel, v);
        assert.equal(prof.hasNasal, true);
        assert.ok(Number.isFinite(prof.durationSec) && prof.durationSec > 0, `Rate=0 must clamp cleanly for vowel ${v}`);
      }

      const spoken = audio.speakSanskrit('oṃ āḥ hūṃ svāhā', { mode: 'synth', rate: 1.0 });
      assert.equal(spoken.modeUsed, 'synth');
      assert.ok(spoken.totalDurationSec > 1.0);
      spoken.stop();
    },
  },
  {
    id: 'T5-ADV-08',
    tier: 5,
    feature: 'F15',
    title: 'Dynamic Cross-Canonical Concordance Fallback Across All 5 Dynamic Sources (Curated Dhāraṇī, rKTs, 84000, CUDL, Polyglotta)',
    async run() {
      const conc = await loadTs('src/core/concordanceEngine.ts');
      const c1 = conc.resolveCanonicalConcordance('cintamanicakra-dharani');
      assert.equal(c1.primaryCluster?.clusterId, 'dynamic_dharani_cintamanicakra-dharani');

      const c2 = conc.resolveCanonicalConcordance('D849');
      assert.equal(c2.primaryCluster?.clusterId, 'dynamic_rkts_D849');

      const c3 = conc.resolveCanonicalConcordance('toh502');
      assert.ok(c3.primaryCluster?.clusterId.startsWith('dynamic_84000_'));

      const c4 = conc.resolveCanonicalConcordance('MS-ADD-01315');
      assert.equal(c4.primaryCluster?.clusterId, 'dynamic_cudl_MS-ADD-01315');

      const c5 = conc.resolveCanonicalConcordance('vid=727');
      assert.equal(c5.primaryCluster?.clusterId, 'dynamic_polyglotta_727');
    },
  },
  {
    id: 'T5-ADV-09',
    tier: 5,
    feature: 'F15',
    title: 'Unified Quadrilingual Glossary Retrieval Across Tibetan Unicode, Siddhaṃ Unicode, Wylie & T54 Lexicons',
    async run() {
      const conc = await loadTs('src/core/concordanceEngine.ts');
      const allGloss = conc.getUnifiedMultilingualGlossary();
      assert.ok(allGloss.length >= 150, `Expected >= 150 quadrilingual glossary entries, got ${allGloss.length}`);
      assert.ok(conc.getUnifiedMultilingualGlossary('ཤེས་རབ།').length >= 1, 'Must match Tibetan Unicode shes rab');
      assert.ok(conc.getUnifiedMultilingualGlossary('གཟུངས།').length >= 1, 'Must match Tibetan Unicode gzungs');
      assert.ok(conc.getUnifiedMultilingualGlossary('𑖠𑖯𑖨𑖜𑖰').length >= 1, 'Must match Siddhaṃ Unicode dhāraṇī');
      assert.ok(conc.getUnifiedMultilingualGlossary('T54n2135').length >= 1, 'Must include T54n2135 lexicon entries');
    },
  },
  {
    id: 'T5-ADV-10',
    tier: 5,
    features: ['F15', 'F14'],
    title: 'Tantric Bīja Engine: All 7 Supplemental Bījas, Unicode Siddhaṃ Sequence & Uddhāra Code-Name Reverse Lookup',
    async run() {
      const bija = await loadTs('src/core/bijaLexiconEngine.ts');
      assert.equal(bija.getAllBijaLexiconEntries().length, 21, 'UNIFIED_BIJA_LEXICON must contain 21 total entries');

      const queries = [
        'dhīḥ',
        'a',
        'vaṃ',
        'raṃ',
        'haṃ',
        'khaṃ',
        'hoḥ',
        'praṇava',
        'krodhabīja',
        'vāgbhava',
        'māyābīja',
        'amṛtabīja',
        'vyomabīja',
        'astrabīja',
        'vahnihetu',
      ];
      for (const q of queries) {
        const r = bija.decipherBijaSyllable(q);
        assert.equal(r.status, 'ok', `Expected decipherBijaSyllable("${q}") to succeed`);
      }

      const sidSeq = bija.decipherBijaSyllable('𑖌𑖽 𑖁𑖾 𑖮𑖳𑖽 𑖠𑖱𑖾');
      assert.equal(sidSeq.status, 'ok');
      assert.equal(sidSeq.isSequence, true);
      assert.deepEqual(
        sidSeq.entries.map((e) => e.bijaIast),
        ['oṃ', 'āḥ', 'hūṃ', 'dhīḥ']
      );
      assert.ok(sidSeq.matchedOchsVerses.length > 0, 'Must link deciphered bījas to OCHS verses');
    },
  },
  {
    id: 'T5-ADV-11',
    tier: 5,
    feature: 'F15',
    title: 'Unified Search Engine Automatic Siddhaṃ/Devanāgarī Script Expansion & Multi-DB Anti-Starvation Cap',
    async run() {
      const search = await loadTs('src/core/searchEngine.ts');
      const sidRes = search.searchUnifiedCorpus('𑖢𑖿𑖨𑖕𑖿𑖗𑖯');
      assert.ok(
        sidRes.databasesMatched.length >= 8,
        `Siddhaṃ query 𑖢𑖿𑖨𑖕𑖿𑖗𑖯 (prajñā) must expand and match >= 8 DBs, matched ${sidRes.databasesMatched.length}`
      );

      const devaRes = search.searchUnifiedCorpus('अवलोकितेश्वर');
      assert.ok(
        devaRes.databasesMatched.length >= 8,
        `Devanāgarī query अवलोकितेश्वर must expand and match >= 8 DBs, matched ${devaRes.databasesMatched.length}`
      );

      const svahaRes = search.searchUnifiedCorpus('svāhā', { limit: 60 });
      assert.ok(
        svahaRes.databasesMatched.length >= 10,
        `Unfiltered search for svāhā must span >= 10 DBs via perDbCap anti-starvation, matched ${svahaRes.databasesMatched.length}`
      );
    },
  },
  {
    id: 'T5-ADV-12',
    tier: 5,
    feature: 'F15',
    title: 'Strict Database Isolation (--db baseline & Numeric 1..12) and Invalid DB Rejection in searchAllDatabases',
    async run() {
      const search = await loadTs('src/core/searchEngine.ts');
      const baseHits = search.searchAllDatabases('svāhā', { dbId: 'baseline', limit: 15 });
      assert.ok(baseHits.length >= 5 && baseHits.every((h) => h.dbId === 'baseline'), 'dbId="baseline" must strictly return baseline hits');

      for (let i = 1; i <= 12; i++) {
        const dbHits = search.searchAllDatabases('a', { dbId: i, limit: 3 });
        assert.ok(
          dbHits.length > 0 && dbHits.every((h) => h.dbId === CANONICAL_DB_IDS[i - 1]),
          `Scoped search for DB #${i} (${CANONICAL_DB_IDS[i - 1]}) must isolate results strictly`
        );
      }

      assert.equal(search.searchAllDatabases('svāhā', { dbId: 'db99_invalid' }).length, 0);
    },
  },
  {
    id: 'T5-ADV-13',
    tier: 5,
    features: ['F15', 'F4', 'F7', 'F12'],
    title: 'Unified Corpus Registry Special Enrichments (T09n0262 Fanqie Pair, T08n0256 Alias, Dual-ID & Newar Normalization)',
    async run() {
      const reg = await loadTs('src/data/unifiedCorpusRegistry.ts');
      const t1 = await loadTs('src/services/tier1CorpusService.ts');
      const t23 = await loadTs('src/services/tier23CorpusService.ts');

      const rLotus = reg.inspectDatabaseRecords('db2_taisho_ext', 'T09n0262');
      assert.equal(rLotus.fanqieStats.T09n0262.fanqieNoteCount, 92);
      assert.equal(rLotus.fanqieStats.T16n0665.fanqieNoteCount, 132);

      const r256 = reg.inspectDatabaseRecords('db2_taisho_ext', 'T08n0256');
      assert.ok(String(r256.note).includes('T08n0250'), 'T08n0256 lookup must return explanatory note and 7 T08 Heart Sūtra records');

      assert.deepEqual(t1.resolveBuddhaNexusDualId('K12Xbsu017_u'), {
        staticFileId: 'K12Xbsu017_u',
        dharmaMitraApiId: 'SA_K12_bsu017_u',
      });

      const newar = t23.normalizeNewarToStandardSanskrit('ombajra sarvva dharmma sbāhā vajadhara o\uF141');
      assertContainsAll(newar.normalizedIast, ['oṃ vajra', 'sarva', 'dharma', 'svāhā', 'vajradhara', 'oṃ']);
      assert.ok(newar.notes.length >= 4);
    },
  },
  {
    id: 'T5-ADV-14',
    tier: 5,
    feature: 'F16',
    title: 'CLI (scripts/kosa-cli.mjs) Flag Permutations (--help, --db=, --limit=) & Non-Zero Error Exit Contracts',
    async run() {
      const helpRes = runKosaCliJson(['--help']);
      assert.equal(helpRes.subcommands.length, 8, '--help must list all 8 valid subcommands');

      const limRes = runKosaCliJson(['search', 'svāhā', '--db=db8_polyglotta', '--limit=2']);
      assert.ok(
        limRes.results.length <= 2 && limRes.results.every((r) => r.dbId === 'db8_polyglotta'),
        'Equals-syntax --db= and --limit= flags must filter and cap results'
      );

      const errNoDb = runKosaCliAllowError(['inspect', '--json']);
      assert.equal(errNoDb.exitCode, 1, 'inspect with missing dbId must exit with code 1');

      const errBadFilter = runKosaCliAllowError(['search', 'svāhā', '--db=db99_bad', '--json']);
      assert.equal(errBadFilter.exitCode, 1, 'search with invalid --db filter must exit with code 1');

      const errNoRec = runKosaCliAllowError(['inspect', 'db5_buddhanexus', '__NO_SUCH_REC_999__', '--json']);
      assert.equal(errNoRec.exitCode, 1, 'inspect with non-existent recordId in db5 must exit with code 1');
    },
  },
  {
    id: 'T5-ADV-15',
    tier: 5,
    feature: 'F16',
    title: 'React Web Application (App.tsx & All 6 Scholarly Workbenches) Full SSR DOM & Telemetry Verification',
    async run() {
      const React = (await import('react')).default;
      const { renderToStaticMarkup } = await import('react-dom/server');
      const { App } = await loadTs('src/App.tsx');
      const { DatabaseHubExplorer } = await loadTs('src/components/DatabaseHubExplorer.tsx');
      const { MultiScriptDharaniReader } = await loadTs('src/components/MultiScriptDharaniReader.tsx');
      const { FangshanTaishoInterlinearStudio } = await loadTs('src/components/FangshanTaishoInterlinearStudio.tsx');
      const { ConcordanceParallelStudio } = await loadTs('src/components/ConcordanceParallelStudio.tsx');
      const { CudlPalmLeafViewer } = await loadTs('src/components/CudlPalmLeafViewer.tsx');
      const { SiddhamBijaAcademy } = await loadTs('src/components/SiddhamBijaAcademy.tsx');

      const htmls = [
        renderToStaticMarkup(React.createElement(App)),
        renderToStaticMarkup(React.createElement(DatabaseHubExplorer)),
        renderToStaticMarkup(React.createElement(MultiScriptDharaniReader)),
        renderToStaticMarkup(React.createElement(FangshanTaishoInterlinearStudio)),
        renderToStaticMarkup(React.createElement(ConcordanceParallelStudio)),
        renderToStaticMarkup(React.createElement(CudlPalmLeafViewer)),
        renderToStaticMarkup(React.createElement(SiddhamBijaAcademy)),
      ];
      for (const h of htmls) {
        assert.ok(h.length > 500, 'Every workbench must render substantive HTML markup');
        assert.ok(!/\bNaN\b/.test(h), 'Rendered HTML must not contain NaN');
      }
      const combinedHtml = htmls.join('\n');
      assert.ok(!combinedHtml.includes('[object Object]'), 'SSR HTML across all 6 workbenches must not contain [object Object]');
      assertContainsAll(
        combinedHtml,
        ['Sarva-Dhāraṇī-Kośa', '136.1', 'F28n1071', '12,529', 'MS-ADD-01326', 'vid=1175', 'Bījanighaṇṭu'],
        'SSR HTML across all 6 scholarly workbenches'
      );
    },
  },
  {
    id: 'T5-ADV-16',
    tier: 5,
    features: ['F1', 'F2', 'F15', 'F16'],
    title: 'End-to-End 6-Stage Pipeline Torture Test: Diplomatic EWTS → IAST → Prosody/Sandhi → Bīja → Concordance → 136.1 Hz Audio',
    async run() {
      const trans = await loadTs('src/core/transliterator.ts');
      const prosody = await loadTs('src/core/prosody.ts');
      const bija = await loadTs('src/core/bijaLexiconEngine.ts');
      const conc = await loadTs('src/core/concordanceEngine.ts');
      const audio = await loadTs('src/services/sanskritAudioEngine.ts');

      const iast = trans.ewtsToIast('1b1(gzungs): @# / oM badz+ra sat+wa hU~M phaT swA hA /');
      assert.equal(iast, 'oṃ vajra sattva hūṃ phaṭ svāhā');

      const line = prosody.analyzeSanskritLine(iast);
      assert.equal(line.words.length, 6);
      assertContainsAny(line.siddhamUnicode, ['\u{1158C}', '\u{115AE}'], 'Siddhaṃ Unicode output in pipeline');

      const bDec = bija.decipherBijaSyllable('oṃ hūṃ phaṭ svāhā');
      assert.equal(bDec.entries.length, 4);

      const spk = audio.speakSanskrit(iast, { mode: 'synth' });
      assert.ok(spk.totalDurationSec > 1.5);
      spk.stop();

      const cRes = conc.resolveCanonicalConcordance('Sarvatathāgatatattvasaṅgraha');
      assert.equal(cRes.status, 'ok');
    },
  },

  // =========================================================================
  // T5-ADV-17..32: 12-Database Ingestion, Sanitization, Payload Integrity &
  // Cross-Corpus Edge-Case Hardening (Features F3–F14, Challenger M5_2)
  // =========================================================================
  {
    id: 'T5-ADV-17',
    tier: 5,
    features: ['F9', 'F16'],
    title: 'DB #7 (db7_cudl_hidas) Zero [object Object] Coercion & Genuine Sanskrit IAST Mantra Extraction Across All 9 Hidas Editions',
    async run() {
      const cliPayload = runKosaCliJson(['inspect', 'db7_cudl_hidas']);
      const jsonDisk = readJsonFile('public/data/tier23/db7_cudl_hidas.json');
      const tsSource = readProjectFile('src/data/generated/tier23Databases.ts');

      assert.ok(
        !stringifyDeep(cliPayload).includes('[object Object]'),
        'CLI inspect db7_cudl_hidas must contain zero [object Object] coercion strings'
      );
      assert.ok(
        !stringifyDeep(jsonDisk).includes('[object Object]'),
        'public/data/tier23/db7_cudl_hidas.json must contain zero [object Object] coercion strings'
      );
      assert.ok(
        !tsSource.includes('[object Object]'),
        'src/data/generated/tier23Databases.ts must contain zero [object Object] coercion strings'
      );

      const editions = cliPayload.hidasCriticalEditions || jsonDisk.hidasCriticalEditions || [];
      assert.equal(editions.length, 9, 'DB #7 must contain all 9 Gergely Hidas critical editions');
      for (const ed of editions) {
        assert.ok(Array.isArray(ed.segments) && ed.segments.length >= 4, `Hidas edition ${ed.id} must have >= 4 segments`);
        assert.ok(
          typeof ed.extractedMantraIast === 'string' && ed.extractedMantraIast.length >= 20,
          `Hidas edition ${ed.id} must have non-empty extractedMantraIast`
        );
        assert.ok(
          !ed.extractedMantraIast.includes('[object Object]'),
          `Hidas edition ${ed.id} extractedMantraIast must not contain [object Object]`
        );
        for (const seg of ed.segments) {
          assert.ok(
            typeof seg.textIast === 'string' && seg.textIast.length > 0 && !seg.textIast.includes('[object Object]'),
            `Hidas edition ${ed.id} segment ${seg.segnr} must contain genuine textIast`
          );
          assert.ok(
            !/<[^>]+>/.test(seg.textIast),
            `Hidas edition ${ed.id} segment ${seg.segnr} must not leak raw angle-bracket tags: ${seg.textIast}`
          );
        }
      }
    },
  },
  {
    id: 'T5-ADV-18',
    tier: 5,
    features: ['F9', 'F6', 'F11'],
    title: 'DB #7 (db7_cudl_hidas) Specific Hidas Critical Edition Mantras & CUDL/Tohoku/rKTs Witness Cross-References',
    async run() {
      const manibhadra = runKosaCliJson(['inspect', 'db7_cudl_hidas', 'SA_K12_Āgama_Māṇibhadradhāraṇī_Hidas']);
      assertContainsAll(
        manibhadra,
        ['māṇibhadrāya', 'mahāyakṣasenāpataye', 'hili māṇibhadra', 'svāhā', 'MS-ADD-01326', 'Toh 764', 'D970'],
        'Māṇibhadradhāraṇī Hidas critical edition mantra & cross-refs'
      );

      const surupa = runKosaCliJson(['inspect', 'db7_cudl_hidas', 'SA_K12_Āgama_Surūpādhāraṇī']);
      assertContainsAll(
        surupa,
        ['namaḥ surūpāya', 'suru suru prasuru prasuru', 'sarvapretānāṃ svāhā', 'D 540', '1078'],
        'Surūpādhāraṇī Hidas critical edition mantra (Unicode boundary extraction)'
      );

      const sarvakarma = runKosaCliJson(['inspect', 'db7_cudl_hidas', 'SA_K12_Āgama_Sarvakarmāvaraṇaviśodhanīdhāraṇī']);
      assertContainsAll(
        sarvakarma,
        ['kakani kakani', 'rocani rocani', 'troṭani', 'sarvakarmaparamparāni me svāhā', 'D 743', '1009'],
        'Sarvakarmāvaraṇaviśodhanīdhāraṇī Hidas critical edition mantra'
      );

      const mahasri = runKosaCliJson(['inspect', 'db7_cudl_hidas', 'SA_K12_Āgama_Mahāśrīnāmadvādaśaka_Hidas']);
      assertContainsAll(
        mahasri,
        ['namas tārāyai', 'padmamālinī', 'alakṣmīṃ', 'D 741', '1006'],
        'Mahāśrīnāmadvādaśaka Hidas critical edition mantra'
      );
    },
  },
  {
    id: 'T5-ADV-19',
    tier: 5,
    features: ['F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'F13', 'F14'],
    title: 'All-12-Database Generated TS & Public JSON Sanitization Audit (Zero [object Object], Zero \\u00AD Soft Hyphens, Zero PUA, Zero .jp2.jp2)',
    async run() {
      const filesToAudit = [
        'src/data/generated/tier1Databases.ts',
        'src/data/generated/tier23Databases.ts',
        ...findFilesRecursive('public/data/tier1', (r) => r.endsWith('.json')),
        ...findFilesRecursive('public/data/tier23', (r) => r.endsWith('.json')),
      ];
      assert.ok(filesToAudit.length >= 14, 'Expected at least 14 generated TS and public JSON files across Tier 1 & Tier 2/3');

      for (const relPath of filesToAudit) {
        const content = readProjectFile(relPath);
        assert.ok(!content.includes('[object Object]'), `${relPath} must not contain [object Object]`);
        assert.ok(!/\u00AD/.test(content), `${relPath} must not contain Unicode soft hyphens (\\u00AD)`);
        assert.ok(!/[\uE000-\uF8FF]/.test(content), `${relPath} must not contain literal BMP Private Use Area characters`);
        assert.ok(!/\.jp2\.jp2/i.test(content), `${relPath} must not contain duplicate .jp2.jp2 extensions`);
        assert.ok(
          !/<(?:locus|pb|del)\b|class="fotnote"|<div\s+class="note"/i.test(content),
          `${relPath} must not contain unstripped TEI/HTML apparatus tags`
        );
      }
    },
  },
  {
    id: 'T5-ADV-20',
    tier: 5,
    features: ['F3'],
    title: 'DB #1 (db1_fangshan) F28n1071 Exact Telemetry Invariants & F28n1072 Body Paragraph Non-Header Fidelity',
    async run() {
      const db1 = runKosaCliJson(['inspect', 'db1_fangshan']);
      const stats = db1.f28n1071Stats;
      assert.equal(stats.totalRolls, 30, 'F28n1071 must have 30 rolls');
      assert.equal(stats.totalDharaniBlocks, 730, 'F28n1071 must have 730 dharani blocks');
      assert.equal(stats.totalTtBlocks, 8291, 'F28n1071 must have 8,291 <cb:tt> blocks');
      assert.equal(stats.totalSdGlyphs, 8297, 'F28n1071 must have 8,297 #SD-* glyphs');
      assert.equal(stats.totalInlineNotes, 49095, 'F28n1071 must have 49,095 inline notes');
      assert.equal(stats.erHeCount, 12529, 'F28n1071 二合 count must be 12,529');
      assert.equal(stats.sanHeCount, 248, 'F28n1071 三合 count must be 248');
      assert.equal(stats.yinCount, 15964, 'F28n1071 引 count must be 15,964');
      assert.equal(stats.tanSheCount, 10, 'F28n1071 彈舌/轉舌 count must be 10');

      const f1072 = runKosaCliJson(['inspect', 'db1_fangshan', 'F28n1072']);
      const rec = f1072.record || (f1072.records && f1072.records[0]);
      assert.ok(rec, 'F28n1072 record must be present');
      assert.ok(
        !String(rec.plainChineseText || '').includes('Available for non-commercial use'),
        'F28n1072 plainChineseText must extract genuine Chinese body text, not the English TEI header license'
      );
      assert.ok(
        /[\u4E00-\u9FFF]/.test(String(rec.plainChineseText || '')),
        'F28n1072 plainChineseText must contain Chinese characters from the scripture body'
      );
    },
  },
  {
    id: 'T5-ADV-21',
    tier: 5,
    features: ['F4'],
    title: 'DB #2 (db2_taisho_ext) 10 T54 Lexicons, 11 T84 Treatises (KR6t0412–0422), 18 Siddhaṃ Chapters (6,442 Cells) & T08n0256 Resilience',
    async run() {
      const db2 = runKosaCliJson(['inspect', 'db2_taisho_ext']);
      const t54WorkIds = new Set((db2.lexiconEntries || []).map((e) => e.workId));
      for (const expectedId of [
        'T54n2128', 'T54n2129', 'T54n2130', 'T54n2131', 'T54n2132',
        'T54n2133A', 'T54n2133B', 'T54n2134', 'T54n2135', 'T54n2136',
      ]) {
        assert.ok(t54WorkIds.has(expectedId), `DB #2 lexiconEntries must include ${expectedId}`);
      }
      assert.equal((db2.siddhamTreatises || []).length, 11, 'DB #2 must include all 11 T84 treatises (T84n2701–2711)');
      assert.equal((db2.siddham18Chapters || []).length, 18, 'DB #2 must include all 18 Siddhaṃ chapters');
      assert.equal(db2.siddhamRegistryStats.totalChapterCells, 6442, 'Siddhaṃ registry must report 6,442 chapter cells');
      assert.equal(db2.siddhamRegistryStats.totalSyllables, 6874, 'Siddhaṃ registry must report 6,874 syllables');
      assert.equal(db2.siddhamRegistryStats.totalGlyphs, 9066, 'Siddhaṃ registry must report 9,066 glyphs');

      const t256 = runKosaCliJson(['inspect', 'db2_taisho_ext', 'T08n0256']);
      assert.ok((t256.ancientDharanis || []).length === 7, 'T08n0256 query must gracefully return all 7 T08 Heart Sūtra editions');
      assertContainsAll(t256, ['T08n0250', 'T08n0251', 'T08n0255', 'T08n0257'], '7 T08 Heart Sūtra editions');
    },
  },
  {
    id: 'T5-ADV-22',
    tier: 5,
    features: ['F5'],
    title: 'DB #3 (db3_dsbc_gretil) DSBC 100 Sections (820/2949 ↔ 824/2953), 15 Dhāraṇī Books & GRETIL 108 Stotras (#1..#108) Exact Verification',
    async run() {
      const db3 = runKosaCliJson(['inspect', 'db3_dsbc_gretil']);
      assert.equal((db3.dharaniSamgrahaSections || []).length, 100, 'DSBC Dhāraṇī Saṃgraha must have 100 numbered sections');
      assert.equal((db3.dsbcBooks || []).length, 15, 'DSBC list/4 must have 15 standalone Dhāraṇī books');
      assert.equal(db3.dsbcCatalogStats.romanizedBooksCount, 486, 'DSBC catalog must report 486 romanized books');
      assert.equal(db3.dsbcCatalogStats.devanagariBooksCount, 475, 'DSBC catalog must report 475 Devanāgarī books');
      assert.equal(db3.dsbcCatalogStats.gretilTotalFilesCount, 261, 'GRETIL catalog must report 261 Buddhist Sanskrit files');

      const stotras = (db3.gretilExpandedRecords || []).filter((r) => r.filename === 'bst-108u.htm');
      assert.equal(stotras.length, 108, 'bst-108u.htm must parse all 108 numbered stotras');
      assert.equal(stotras[0].stotraNumber, 1, 'First stotra must be #1');
      assert.equal(stotras[107].stotraNumber, 108, 'Last stotra must be #108');
      assertContainsAny(stotras[107], ['Mañjuśrī', 'Nāmasaṃgīti', 'nāmasaṅgīti', 'mañjunāthāya'], 'Stotra #108 Mañjuśrīnāmasaṃgīti');
    },
  },
  {
    id: 'T5-ADV-23',
    tier: 5,
    features: ['F6'],
    title: 'DB #4 (db4_84000) Multi-Tohoku Resolution (toh507,883 & toh141,526,916), TMtoh862 Alignment & Clean Mantra Extraction',
    async run() {
      const r883 = runKosaCliJson(['inspect', 'db4_84000', '883']);
      assert.ok(r883.matchedCount >= 1, 'Numeric query 883 must resolve to multi-Tohoku toh507,883 record');
      assertContainsAll(r883.record, ['UT22084-088-001', 'toh507', 'toh883', 'MW22084_0507', 'W22084'], 'Toh 507,883 TEI + RDF metadata');

      const r916 = runKosaCliJson(['inspect', 'db4_84000', 'toh916']);
      assertContainsAll(r916.record, ['toh141', 'toh526', 'toh916', 'Ṣaṇmukhī'], 'Multi-Tohoku toh141,526,916 Ṣaṇmukhīdhāraṇī');

      const r862 = runKosaCliJson(['inspect', 'db4_84000', 'toh862']);
      assert.ok(Array.isArray(r862.record?.tibetanAlignedLines) && r862.record.tibetanAlignedLines.length >= 2, 'Toh 862 must include TMtoh862 Tibetan aligned lines');
      assert.ok(Array.isArray(r862.record?.englishAlignedLines) && r862.record.englishAlignedLines.length >= 2, 'Toh 862 must include TMtoh862 English aligned lines');
      assertContainsAll(r862.record, ['bhaiṣajyaguru', 'bhaiṣajye mahābhaiṣajye', 'svāhā'], 'Bhaiṣajyaguru mantra in Toh 862');
    },
  },
  {
    id: 'T5-ADV-24',
    tier: 5,
    features: ['F7'],
    title: 'DB #5 (db5_buddhanexus) Dual-ID Alias Resolution (K12*/T01*/T02* ↔ SA_*), K12n2949u 7,700 Segments & Candrakīrti 6,412 Segments',
    async run() {
      const k12 = runKosaCliJson(['inspect', 'db5_buddhanexus', 'K12Xbsu017_u']);
      const saK12 = runKosaCliJson(['inspect', 'db5_buddhanexus', 'SA_K12_bsu017_u']);
      assert.equal(k12.record?.fileId, 'K12Xbsu017_u', 'Static fileId K12Xbsu017_u must resolve');
      assert.equal(saK12.record?.fileId, 'K12Xbsu017_u', 'DharmaMitra alias SA_K12_bsu017_u must resolve to same record');
      assertContainsAll(k12.record, ['Hayagrīvavidyā', 'namo ratnatrayāya'], 'K12Xbsu017_u Hayagrīvavidyā content');

      const n2949 = runKosaCliJson(['inspect', 'db5_buddhanexus', 'SA_K12_n2949u']);
      assert.equal(n2949.record?.totalSegments, 7700, 'K12n2949u must have 7,700 segments');
      const jsonDisk = readJsonFile('public/data/tier1/db5_buddhanexus.json');
      const full2949 = (jsonDisk.records || []).find((r) => r.fileId === 'K12n2949u');
      assert.ok(full2949 && full2949.colophonsExtracted.length >= 113, 'Full JSON K12n2949u must preserve >= 113 samāpta colophons');

      const pradipa = runKosaCliJson(['inspect', 'db5_buddhanexus', 'SA_T02_Candrakīrti_Pradīpoddyotana-Guhyasamājatantra_Chakravarti_1984']);
      assert.equal(pradipa.record?.totalSegments, 6412, 'Candrakīrti Pradīpoddyotana must report 6,412 segments');
    },
  },
  {
    id: 'T5-ADV-25',
    tier: 5,
    features: ['F8'],
    title: 'DB #6 (db6_sarit) Caryāmelāpakapradīpa Ch. 3 Mantratattva Compound-Dot Coalescence, Apparatus Sigla & 27 TEI Works',
    async run() {
      const db6 = runKosaCliJson(['inspect', 'db6_sarit']);
      assert.equal((db6.records || []).length, 27, 'DB #6 must contain 27 SARIT TEI works');
      const cmp = db6.records.find((r) => r.filename === 'caryamelapakapradipa.xml');
      assert.ok(cmp && cmp.featuredUnits.length >= 160, 'Caryāmelāpakapradīpa must include >= 160 featured units (CMP03.001..160 + CMP01.034)');

      const u001 = cmp.featuredUnits.find((u) => u.unitId === 'CMP03.001');
      assert.ok(u001, 'CMP03.001 must be present');
      assertContainsAll(
        u001,
        ['kāyavākcitta', 'tryakṣara vajrajāpa', 'oṃ āḥ hūṃ', 'Asiatic Society', 'MS 3-363', 'Toh 1803'],
        'CMP03.001 normalized compound terms & critical apparatus sigla'
      );
      for (const u of cmp.featuredUnits) {
        assert.ok(!/<locus|<pb\b|<del\b|<note\b/i.test(u.cleanSanskritIast), `Unit ${u.unitId} must be free of raw TEI tags`);
        assert.ok(!/[a-z]\.[a-z]/i.test(u.cleanSanskritIast), `Unit ${u.unitId} must coalesce intra-word compound dots: ${u.cleanSanskritIast}`);
      }
    },
  },
  {
    id: 'T5-ADV-26',
    tier: 5,
    features: ['F9'],
    title: 'DB #7 (db7_cudl_hidas) 69 Unique CUDL Manuscripts, 3-Part MS-ADD-01680-00008 Bundle Rubrics & 770 CE PR-FG-00870',
    async run() {
      const db7 = runKosaCliJson(['inspect', 'db7_cudl_hidas']);
      assert.equal((db7.manuscripts || []).length, 69, 'DB #7 must contain exactly 69 unique CUDL manuscripts');
      const uniqueIds = new Set(db7.manuscripts.map((m) => m.cudlId));
      assert.equal(uniqueIds.size, 69, 'All 69 CUDL manuscript IDs must be unique across pagination');

      const bundle = runKosaCliJson(['inspect', 'db7_cudl_hidas', 'MS-ADD-01680-00008']);
      assert.equal((bundle.bundleSubItems || []).length, 3, 'MS-ADD-01680-00008 bundle must resolve to all 3 palm-leaf sub-items');
      assertContainsAll(
        bundle,
        ['[4r1]', '[15r2]', '[1r4]', '[15v2]', '[17bisr1]', '[23v5]', '[36r4]', 'āryoṣṇīṣavijayā', 'āryacundā', 'āryadhātukaraṇḍā'],
        'Diplomatic folio rubrics across MS-ADD-01680-00008-00001..3'
      );

      const hyakumanto = runKosaCliJson(['inspect', 'db7_cudl_hidas', 'PR-FG-00870']);
      assertContainsAll(
        hyakumanto,
        ['PR-FG-00870', '770 CE', 'Hyakumantō darani', 'MS-ADD-01315', 'MS-ADD-01325', 'Saptavāra', 'Pañcarakṣā'],
        '770 CE Hyakumantō darani with Saptavāra and Pañcarakṣā parallels'
      );
    },
  },
  {
    id: 'T5-ADV-27',
    tier: 5,
    features: ['F10'],
    title: 'DB #8 (db8_polyglotta) 16-Witness Heart Sūtra (vid=1175), Dual Mahāvyutpatti Chapters (vid=263&cid=335411 / 338889) & Clean Cells',
    async run() {
      const v1175 = runKosaCliJson(['inspect', 'db8_polyglotta', 'vid=1175']);
      assert.equal(v1175.volume?.witnesses?.length, 16, 'Polyglotta vid=1175 Heart Sūtra must have 16 aligned witnesses');
      assertContainsAll(
        v1175.volume,
        ['Vaidya', 'Conze', 'T.250', 'T.251', 'T.257', 'gate gate pāragate pārasaṃgate bodhi svāhā'],
        '16-witness Heart Sūtra alignment & mantra'
      );

      const mvy25 = runKosaCliJson(['inspect', 'db8_polyglotta', 'vid=263&cid=335411']);
      const mvy198 = runKosaCliJson(['inspect', 'db8_polyglotta', 'vid=263&cid=338889']);
      assert.equal(mvy25.volume?.cid, 335411, 'vid=263&cid=335411 must resolve to Mahāvyutpatti §25 Dhāraṇī-nāmāni');
      assert.equal(mvy198.volume?.cid, 338889, 'vid=263&cid=338889 must resolve to Mahāvyutpatti §198 Mantranayāvanirgatāni');
      assert.ok((mvy198.mahavyutpattiEsotericGlossary || []).length >= 50, 'Mvy §198 esoteric glossary must have >= 50 entries');
    },
  },
  {
    id: 'T5-ADV-28',
    tier: 5,
    features: ['F11'],
    title: 'DB #9 (db9_rkts) 16,179 Standard Works, 265 Derge Zungdu (D846–D1095) & 143 1D/100–101.txt EWTS→IAST Mantra Conversions',
    async run() {
      const db9 = runKosaCliJson(['inspect', 'db9_rkts']);
      assert.equal(db9.concordanceStats.totalStandardWorks, 16179, 'rKTs standard.xml must report 16,179 works');
      assert.equal(db9.concordanceStats.totalWorksWithSanskritTitle, 4997, 'rKTs standard.xml must report 4,997 works with <skt>');
      assert.equal(db9.concordanceStats.totalCanonicalCollections, 68, 'rKTs collections.json must report 68 collections');
      assert.equal(db9.concordanceStats.dergeZungduItemsCount, 265, 'rKTs D.xml must report 265 Zungdu items');
      assert.equal(db9.concordanceStats.dergeRgyudItemsCount, 3115, 'rKTs D.xml must report 3,115 rgyud items');

      const jsonDisk = readJsonFile('public/data/tier23/db9_rkts.json');
      assert.equal(jsonDisk.dergeZungduCatalog.length, 265, 'Full Zungdu catalog must have 265 items');
      assert.equal(jsonDisk.zungduEtextEntries.length, 143, '1D/100.txt & 101.txt must yield 143 EWTS mantra/title entries');

      const d848 = runKosaCliJson(['inspect', 'db9_rkts', 'D848']);
      assertContainsAll(
        d848,
        ['D848', 'K521', 'jñānolka', 'sarvagatipariśodhanī', 'tadyathā', 'svāhā'],
        'D848 ↔ K521 resolution and EWTS→IAST conversion without raw + stacks'
      );
    },
  },
  {
    id: 'T5-ADV-29',
    tier: 5,
    features: ['F12'],
    title: 'DB #10 (db10_all_nibs) 106 Sanskrit MSS (10 NIBS + 96 Varanasi), SA00019.001 Candrabindu Preservation & 35 Newar Witnesses',
    async run() {
      const db10 = runKosaCliJson(['inspect', 'db10_all_nibs']);
      assert.equal(db10.apiStats.totalSanskritManuscripts, 106, 'ALL-NIBS must contain 106 Sanskrit manuscripts');
      assert.equal(db10.apiStats.nibsKathmanduCount, 10, 'ALL-NIBS must contain 10 [NIBS] Kathmandu manuscripts');
      assert.equal(db10.apiStats.varanasiPreservationCount, 96, 'ALL-NIBS must contain 96 [Varanasi] manuscripts');
      assert.equal((db10.newarDharaniWitnesses || []).length, 35, 'ALL-NIBS must contain 35 Newar dhāraṇī witnesses');

      const sa19 = runKosaCliJson(['inspect', 'db10_all_nibs', 'SA00019.001']);
      assertContainsAll(
        sa19.manuscript,
        ['SA00019.001', 'KSK-00556', 'Suvarṇa Prabhāsottama', '@1a', 'śruti smṛti gati vijaye svāhā'],
        'SA00019.001 Suvarṇaprabhāsottama diplomatic folio transcription & KSK-00556 code'
      );

      for (const nw of db10.newarDharaniWitnesses) {
        const notes = nw.orthographicNotes || nw.normalizationNotes || [];
        assert.ok(notes.length >= 1, `Newar witness ${nw.id} must record orthographic normalization notes`);
        assert.ok(
          !/sbāh[aā]|\bbajr|sarvv|dharmm|āryy/i.test(nw.normalizedMantraIast),
          `Newar witness ${nw.id} normalizedMantraIast must normalize sbāhā→svāhā, bajra→vajra, sarvva→sarva: ${nw.normalizedMantraIast}`
        );
      }
    },
  },
  {
    id: 'T5-ADV-30',
    tier: 5,
    features: ['F13'],
    title: 'DB #11 (db11_idp_dunhuang) Silk Road Berlin IDP, Vienna CEToM THT 3187 Prakrit Orthography & CBETA Dunhuang T85/ZW Partitioning',
    async run() {
      const db11 = runKosaCliJson(['inspect', 'db11_idp_dunhuang']);
      assert.equal(db11.corpusStats.idpXmlDumpsCount, 16, 'IDP Berlin must report 16 XML dumps');
      assert.equal(db11.corpusStats.cetomPelliotSanskritCount, 12, 'CEToM must report 12 Pelliot Sanskrit manuscripts');
      assert.equal((db11.cetomRecords || []).length, 13, 'CEToM records must include THT 3187 + 12 Pelliot Sanskrit MSS');

      const tht = runKosaCliJson(['inspect', 'db11_idp_dunhuang', 'tht3187']);
      assertContainsAll(
        tht.matchedCetomRecords,
        ['tht3187', 'THT 3187', 'Nīlakaṇṭha', 'kāruṇikāya', 'cara vicara'],
        'CEToM THT 3187 Kizil Brāhmī Nīlakaṇṭha-dhāraṇī transcription'
      );

      const iol397 = runKosaCliJson(['inspect', 'db11_idp_dunhuang', 'IOL San 397']);
      assertContainsAll(
        iol397.matchedIdpRecords,
        ['IOL San 397', 'Kudo_2006b', 'buddheṇa', 'nirjito', 'amāñi vihi phali'],
        'IDP Kudo_2006b IOL San 397 Silk Road Prakrit orthography'
      );

      const t85Count = (db11.cbetaDunhuangRecords || []).filter((r) => String(r.collection).startsWith('T85')).length;
      const zwCount = (db11.cbetaDunhuangRecords || []).filter((r) => String(r.collection).startsWith('ZW')).length;
      assert.ok(t85Count >= 2 && zwCount >= 6, `Expected both T85 (${t85Count}) and ZW (${zwCount}) Dunhuang records`);
    },
  },
  {
    id: 'T5-ADV-31',
    tier: 5,
    features: ['F14'],
    title: 'DB #12 (db12_muktabodha_ochs) Muktabodha 499-Work Catalog (M00247 Uddhārakośa), ERC DHARMA STTS/SVU & OCHS #30 Bījanighaṇṭu',
    async run() {
      const db12 = runKosaCliJson(['inspect', 'db12_muktabodha_ochs']);
      assert.equal(db12.corpusStats.muktabodhaTotalTexts, 499, 'Muktabodha catalog must report 499 texts');
      assert.equal(db12.corpusStats.ochsTotalManuscripts, 1603, 'OCHS catalog must report 1,603 manuscripts');
      assert.equal((db12.muktabodhaTexts || []).length, 10, 'DB #12 must include 10 Muktabodha Tantric/Bīja full texts');
      assert.equal((db12.ochsLexiconManuscripts || []).length, 4, 'DB #12 must include 4 OCHS lexicon manuscripts (#30, #46, #259, #262)');
      assert.equal((db12.bijaLexicon || []).length, 14, 'DB #12 must include 14 primary Bīja lexicon entries');

      const m247 = runKosaCliJson(['inspect', 'db12_muktabodha_ochs', 'M00247']);
      assertContainsAll(m247.matchedMuktabodha, ['M00247', 'Uddhārakośa', 'Dakṣiṇāmūrti'], 'Muktabodha M00247 Uddhārakośa');

      const ochs30 = runKosaCliJson(['inspect', 'db12_muktabodha_ochs', '30']);
      assertContainsAll(
        ochs30.matchedOchsLexicon,
        ['Bījanighaṇṭu', 'vyomāsya', 'vidārī', 'nādabindu', 'krodhabīja'],
        'OCHS #30 Bījanighaṇṭu Tantric Uddhāra verse for hūṃ'
      );
    },
  },
  {
    id: 'T5-ADV-32',
    tier: 5,
    features: ['F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'F13', 'F14', 'F15', 'F16'],
    title: '12-Database Summary ↔ Public JSON Record Count Parity & CLI verify-all 100% Integrity Invariant',
    async run() {
      const verifyRes = runKosaCliJson(['verify-all']);
      assert.equal(verifyRes.valid, true, 'verify-all must report valid: true');
      assert.equal(verifyRes.totalDatabases, 12, 'verify-all must verify all 12 databases');
      assert.equal(verifyRes.baseline.cbetaGaijiCount, 2240, 'Baseline Gaiji count must be 2,240');
      assert.equal(verifyRes.baseline.cbetaTotalTtAlignments, 916, 'Baseline <cb:tt> alignments count must be 916');
      assert.equal(verifyRes.baseline.taishoMikkyoCount, 614, 'Baseline Taishō Mikkyō index count must be 614');
      assert.equal(verifyRes.baseline.gretilBaselineCount, 25, 'Baseline GRETIL count must be 25');

      for (const dbCheck of verifyRes.databases) {
        assert.equal(dbCheck.passed, true, `Database ${dbCheck.id} must pass integrity check`);
        const isTier1 = dbCheck.priorityTier === 1;
        const jsonRel = `public/data/${isTier1 ? 'tier1' : 'tier23'}/${dbCheck.id}.json`;
        const diskJson = readJsonFile(jsonRel);
        assert.equal(
          dbCheck.totalRecordsCount,
          diskJson.summary?.totalRecordsCount,
          `Summary totalRecordsCount for ${dbCheck.id} must match ${jsonRel}`
        );
        assert.equal(
          dbCheck.mantraOrDharaniCount,
          diskJson.summary?.mantraOrDharaniCount,
          `Summary mantraOrDharaniCount for ${dbCheck.id} must match ${jsonRel}`
        );
      }
    },
  },
];
