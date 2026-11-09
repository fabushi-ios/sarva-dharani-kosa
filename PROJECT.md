# Project: 梵音宝典 · Sarva-Dhāraṇī-Kośa (Full 12-Database Pan-Buddhist Sanskrit Dhāraṇī & Esoteric Literature Integration)

## Architecture

**梵音宝典 · Sarva-Dhāraṇī-Kośa** is a comprehensive, dual-interface (Interactive Web App + Deterministic CLI) Sanskrit Dhāraṇī, Siddhaṃ Phonetics, and Pan-Buddhist Esoteric Literature platform built with **TypeScript, React 19, Vite, and Node.js**, unifying the original baseline corpus (`cbeta_gaiji`, `T18–T21` Mikkyō catalog & `<cb:tt>` interlinear texts, and 25 GRETIL editions) with **all 12 international Sanskrit Dhāraṇī & Esoteric Buddhist databases** requested in `ORIGINAL_REQUEST.md`:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                     Build-Time & Live Authoritative Ingestion Layer                      │
│  • scripts/fetch-baseline-data.mjs  → Baseline CBETA Gaiji (2,240), T18-T21 (614),       │
│                                       16 Tang <cb:tt> texts, 25 GRETIL texts             │
│  • scripts/fetch-tier1-databases.mjs → DB #1 (CBETA Fangshan F28n1071 + F24/F27),        │
│                                        DB #2 (Taishō T54 Lexicons, T84 Siddhaṃ via       │
│                                        bkkbooks/KR6t0412-0422 & siddham-registry 18      │
│                                        Chapters, T08-T21 Ancient Dhāraṇīs),              │
│                                        DB #3 (DSBC Dhāraṇī Saṃgraha 820/2949 & 824/2953, │
│                                        list/4, GRETIL bst-108u.htm 108 Stotras & 261     │
│                                        Buddhist texts),                                  │
│                                        DB #4 (84000 Open TEI Toh 502-808 & Toh 846-1095, │
│                                        TM Alignments, RDF & Trilingual Glossary),        │
│                                        DB #5 (BuddhaNexus segmented-sanskrit K12/T01/T02 │
│                                        & DharmaMitra REST API),                          │
│                                        DB #6 (SARIT TEI-P5 Corpus Caryāmelāpakapradīpa   │
│                                        Ch.3 Mantratattva & 22 Buddhist Sanskrit works)   │
│  • scripts/fetch-tier23-databases.mjs → DB #7 (Cambridge CUDL 69 Dhāraṇī MSS, Add.1326,  │
│                                        Add.1680.8.1-3 & Gergely Hidas critical editions),│
│                                        DB #8 (Oslo Bibliotheca Polyglotta vid=1175,1134, │
│                                        727,207,483,1020,1264 & Mahāvyutpatti §25/§198),  │
│                                        DB #9 (Vienna rKTs standard.xml 16,179 items,     │
│                                        D.xml 265 Zungdu items, 1D/100.txt & 101.txt,     │
│                                        tokushige-koyasan/tibetan-corpus),                │
│                                        DB #10 (ALL-NIBS Public API 106 Sanskrit MSS +    │
│                                        NIBS/DSBC Newar Dhāraṇī Saṃgraha witnesses),      │
│                                        DB #11 (IDP Berlin oo_cat_rss.xml Silk Road dumps,│
│                                        Vienna CEToM Pelliot Sanskrit & THT 3187, CBETA   │
│                                        Dunhuang T85 & ZW esoteric rituals),              │
│                                        DB #12 (Muktabodha 499 Tantric IAST e-texts,      │
│                                        ERC DHARMA STTS & Sarvavajrodayā, Oxford OCHS     │
│                                        Bījanighaṇṭu, Ekākṣarakośa & Mantrakoṣa)          │
└───────────────────────────────────────────────┬──────────────────────────────────────────┘
                                                │
                                                ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                 Core Linguistic, Phonetic, Concordance & Decipherment Layer              │
│  • src/core/transliterator.ts    (Devanāgarī ↔ IAST ↔ SLP1 ↔ Unicode Siddhaṃ ↔ EWTS)     │
│  • src/core/prosody.ts           (3-pass Akṣara syllabifier, Anusvāra/Visarga Sandhi,    │
│                                   Chandas Guru — / Laghu ⏑ meter analysis)               │
│  • src/data/siddhamMatrix.ts     (34×14 Dual-Track Modern & Tang Siddhaṃ Matrix +        │
│                                   18 Siddhaṃ Chapters & Kūkai T84n2701 Akṣara-mukha)     │
│  • src/core/bijaLexiconEngine.ts (Tantric Bīja/Ekākṣara/Uddhāra code-word decoder from   │
│                                   Bījanighaṇṭu, Ekākṣarakośa, Uddhārakośa, Mantrakoṣa)   │
│  • src/core/concordanceEngine.ts (Cross-canonical resolver: Taishō ↔ Fangshan F ↔        │
│                                   Tohoku/Derge ↔ rKTs ↔ DSBC/GRETIL ↔ BuddhaNexus ↔      │
│                                   CUDL MS ↔ Polyglotta ↔ ALL-NIBS ↔ IDP/CEToM ↔ OCHS)    │
│  • src/core/searchEngine.ts      (Unified multi-script search across all 12 databases)   │
└──────────────────────┬─────────────────────────────────────────────┬─────────────────────┘
                       │                                             │
                       ▼                                             ▼
┌─────────────────────────────────────────────┐ ┌──────────────────────────────────────────┐
│         Interactive Web UI (React)          │ │     Deterministic CLI (kosa-cli.mjs)     │
│  • 12-Database Hub & Corpus Explorer        │ │  • node scripts/kosa-cli.mjs stats       │
│  • Multi-Script Dhāraṇī Reader & Audio      │ │  • node scripts/kosa-cli.mjs dbs         │
│  • Fangshan & T54 Siddhaṃ Interlinear View  │ │  • node scripts/kosa-cli.mjs inspect ... │
│  • Multi-Witness Parallel Alignment Studio  │ │  • node scripts/kosa-cli.mjs search ...  │
│  • CUDL IIIF Palm-Leaf Manuscript Viewer    │ │  • node scripts/kosa-cli.mjs concordance │
│  • Siddhaṃ 18-Chapter & Bīja Decipherer     │ │  • node scripts/kosa-cli.mjs phonetics   │
│  • Custom Dhāraṇī & Mantra Compiler         │ │  • node scripts/kosa-cli.mjs bija ...    │
└─────────────────────────────────────────────┘ └──────────────────────────────────────────┘
```

---

## Feature Inventory

Every feature discovered in the Phase 0 Survey (persisted baseline + all 12 new databases + unified engines + CLI/UI) is listed below with its assigned Milestone (`M1`–`M4`). No feature is left unassigned.

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | **Baseline CBETA Gaiji, T18–T21 & GRETIL Restoration** | Restore project scaffolding in `/home/antigravity`, `cbeta-org/cbeta_gaiji` (`cbeta_sanskrit.json` 2,240 `#SD-*`/`#RJ-*` mappings), `T18–T21` 614 esoteric scriptures catalog, 16 core Tang `<cb:tt>` Siddhaṃ-Chinese interlinear texts (916 alignments), 25 baseline GRETIL editions, and bundle `NotoSansSiddham-Regular.woff2`. | M1 | survey (`explorer_survey_1`, `explorer_survey_2`) |
| F2 | **Multi-Script Transliteration, Prosody & Web Audio Formant Engine** | Port the 1,638-line `sanskrit_phonetic_engine.html` engine into TypeScript: Devanāgarī ↔ IAST ↔ SLP1 ↔ Unicode Siddhaṃ ↔ Tibetan EWTS transliterator, 34×14 dual-track phonetic matrix (modern acoustic + Tang Siddhaṃ reconstruction), 3-pass akṣara syllabifier, Anusvāra place-of-articulation nasal assimilation, Visarga echo-vowel expansion, Chandas Guru/Laghu meter analyzer, and 136.1 Hz Om Web Audio API formant synthesizer + Web Speech TTS. | M1 | survey (`explorer_survey_1`, `explorer_survey_2`) |
| F3 | **DB #1: CBETA Fangshan Stone Canon Dhāraṇī Collection (`F28n1071` & `F24/F27`)** | Fetch and parse `cbeta-org/xml-p5/F/F28/F28n1071.xml` (《釋教最上乘秘密藏陀羅尼集》30 rolls, 730 `<p cb:type="dharani">`, 8,291 `<cb:tt>`, 8,297 `#SD-*` Siddhaṃ glyphs, and 49,095 inline `<note place="inline">` phonetic tags: `二合` 12,529, `三合` 248, `引` 15,964, `彈舌/轉舌` 10), preserving mixed inline `<cb:tt>` and plain text + inline notes, plus the 9 Tantric dhāraṇī works in `F24`/`F27` (`F24n0761`, `F27n1048`, `F27n1050`, `F27n1056`, `F27n1060–1064`) and `F28n1072`. | M2 | survey (`explorer_survey_1`) |
| F4 | **DB #2: CBETA Taishō Siddhaṃ (`T84`), Sanskrit-Chinese Lexicons (`T54`) & Ancient Dhāraṇīs (`T08–T21`)** | Ingest all 3 sub-corpora of DB #2: (a) `T54n2132–2136.xml` (`悉曇字記`, `梵語千字文` A/B, `唐梵文字`, `梵語雜名` 3-way `<cb:tt>`, `唐梵兩語雙對集` — 5,278 `<cb:tt>`, 19,410 `#SD-*`) + `T54n2128–2131.xml` (`一切經音義`, `續一切經音義`, `翻梵語`, `翻譯名義集`); (b) all 11 works of `T84n2701–2711` from `bkkbooks/KR6t0412`–`KR6t0422` (Kūkai's `梵字悉曇字母并釋義`, Annen's `悉曇藏`, Myōkaku's `悉曇要訣`, etc.) + 18 Siddhaṃ Chapters (`siddham-chapters.js`, `siddham-syllables.js`, `siddham-glyphs.js`) from `scottgfhong310/siddham-registry`; (c) ancient dhāraṇīs in `T21n1336.xml` (278 dhāraṇīs), `T13n0397.xml` (134), `T11n0310.xml` (42), `T16n0665.xml` (38 + 92 `<cb:tt>`), `T16n0664.xml` (28), `T13n0402.xml` (25), `T09n0262.xml` (132 `<cb:tt>` + 14 `<cb:fan>`), `T10n0293.xml` (83 `#SD-*`), and `T08n0250–0257.xml`. | M2 | survey (`explorer_survey_1`) |
| F5 | **DB #3: Nepal Digital Sanskrit Buddhist Canon (DSBC) & Full GRETIL Buddhist Expansion** | Fetch and parse `dsbcproject.org/canon-text/content/820/2949` (*Dhāraṇī Saṃgraha* IAST, 100 sections / 811 `<p>` blocks) & `content/824/2953` (Devanāgarī), `content/862/2990` (*Grahamātṛkā*), the 15 standalone dhāraṇī books (`list/4`), and the 486 Romanized / 475 Devanāgarī book catalog (`browse-by-list/1` & `77`) using required browser `Accept` headers; plus expand `INDOLOGY/GRETIL-mirror` with `bst-108u.htm` (108 Buddhist Stotras *Bauddha Stotra Saṃgrahaḥ*), `busto1_u.htm`, and all additional dhāraṇī/sādhana/tantra `.htm` files across the 261 Buddhist Sanskrit files. | M2 | survey (`explorer_survey_1`, `explorer_survey_3`) |
| F6 | **DB #4: 84000 Open TEI (`Toh 502–808` & `Toh 846–1095`), TM Alignments & Trilingual Glossary** | Fetch and parse `84000/data-tei` (handling multi-Tohoku comma-separated filenames and `<bibl key="toh...">` across 176 published Tantra/Dhāraṇī TEI files including 130 *Kriyātantra* `Toh 502–808` and 97 *Gzungs 'dus* `Toh 846–1095` + Kangyur placeholder titles), sanitizing `<mantra xml:lang="Sa-Ltn">` (stripping `<note>`, `<ref>`, and `\u00AD` soft hyphens while extracting critical apparatus notes and English mantra translations), extracting `<list type="glossary">` trilingual Sanskrit-Tibetan-English terms, and linking `84000/data-tm-alignments` parallel lines and `84000/data-rdf` BDRC IDs. | M2 | survey (`explorer_survey_2`) |
| F7 | **DB #5: BuddhaNexus Segmented Sanskrit (`K12*`, `T01*`, `T02*`) & Live DharmaMitra API** | Fetch and parse `BuddhaNexus/segmented-sanskrit/segmented_files/` (`K12n2949u.json` with 7,700 segments / 113+ colophons of *Dhāraṇīsaṃgraha*, 42 `K12*` Kanjur Tantra/Dhāraṇī files, 105 `T01*` DSBC Stotra/Dhāraṇī files, 65 `T02*` Tantra treatise/sādhana files) and integrate the `https://dharmamitra.org/api-db/menudata/?language=sa` catalog (3,548 Sanskrit texts) and live `POST /api-db/text-view/text-parallels/` query client. | M2 | survey (`explorer_survey_1`, `explorer_survey_2`) |
| F8 | **DB #6: SARIT Indology TEI-P5 Corpus (*Caryāmelāpakapradīpa* & Buddhist Sanskrit Works)** | Fetch and parse `sarit/SARIT-corpus` (`caryamelapakapradipa.xml` Āryadeva's *Caryāmelāpakapradīpa* with Chapter 3 *Vāgviveka/Mantratattva* `CMP03.001–145` on Guhyasamāja mantra theory, *vajrajāpa*, and *mantroddhāra*, stripping inline `<note>`, `<locus>`, `<pb>`, `<del>` while preserving critical apparatus, plus catalog/excerpts of the 21 Buddhist philosophical/narrative TEI works and Tantric/Yoga works). | M2 | survey (`explorer_survey_2`) |
| F9 | **DB #7: Cambridge University CUDL *Dhāraṇīsaṃgraha* Palm-Leaf MSS & Gergely Hidas Critical Editions** | Fetch and parse all 69 Dhāraṇī manuscripts from `cudl.lib.cam.ac.uk/search/JSON?keyword=Dh%C4%81ra%E1%B9%87%C4%AB` and full JSON/TEI/IIIF metadata from `services.cudl.lib.cam.ac.uk/v1/metadata/json/<ID>` for `MS-ADD-01326` (458 pages), `MS-ADD-01680-00008-00001..3` (30+ transcribed dhāraṇī section rubrics), *Saptavāra*, *Pañcarakṣā*, and `PR-FG-00870` (770 CE *Hyakumantō darani*), plus Gergely Hidas's open-access critical/diplomatic editions based on `CUL Add. 1326` and `CUL Add. 1680.8` (`SA_K12_Āgama_Māṇibhadradhāraṇī_Hidas`, `SA_K12_Āgama_Mahādhāraṇī`, `SA_K12_Āgama_Sarvakarmāvaraṇaviśodhanīdhāraṇī`, `SA_K12_Āgama_Mahāśrīnāmadvādaśaka_Hidas`, `SA_K12_Āgama_Sahasrāvartādhāraṇī`, `SA_K12_Āgama_Surūpādhāraṇī`, `SA_K12_Āgama_Mahādaṇḍadhāraṇīśītavatī_Hidas`, `SA_K12_Āgama_Vajratuṇḍanāgasamaya_Hidas`, `SA_T01_Vajraḍākadaṇḍakastotra_CUL`). | M3 | survey (`explorer_survey_2`) |
| F10 | **DB #8: University of Oslo Bibliotheca Polyglotta / Thesaurus Literaturae Buddhicae (`polyglotta.uio.no`)** | Fetch and parse quadrilingual sentence-by-sentence alignments (`<div class='BolkContainer'>`) from `https://polyglotta.uio.no/index.php?page=fulltext&view=fulltext&vid=...` for `vid=1175` (*Prajñāpāramitāhṛdaya* 16-witness alignment), `vid=1134` (*Tārānamaskāraikaviṃśatistotra*), `vid=727` (*Nirvikalpapraveśadhāraṇī*), `vid=207` (*Drāmiḍāvidyārājā*), `vid=1020` (*Bhaiṣajyagurusūtra*), `vid=1264` (*Caṇḍamahāroṣaṇatantra*), `vid=483&cid=456868` (*Saddharmapuṇḍarīka* Ch. 21 *Dhāraṇīparivarta*), `vid=263&cid=335411` (*Mahāvyutpatti* §25 *Bodhisattvadhāraṇyaḥ*), `vid=263&cid=338889` (*Mahāvyutpatti* §198 *Mantranayāvanirgatāni* 103 quadrilingual esoteric terms + `sGra sbyor bam po gñis pa`), and Kanjur esoteric Prajñāpāramitā volumes (`vid=691`, `689`, `688`, `697`, `686`, `685`, `683`). | M3 | survey (`explorer_survey_2`) |
| F11 | **DB #9: University of Vienna rKTs (Kanjur/Tanjur Concordance & Derge *Zungdu* Dhāraṇī Compendium)** | Fetch and parse `http://www.rkts.org/rkts1/data/general/standard.xml` (16,179 canonical works, 4,997 standardized `<skt>` titles), `collections.json` (68 collections), `D/D.xml` (265 `<sec>gzungs</sec>` *Zungdu* Dhāraṇī items `D846–D1095` + 3,115 `<sec>rgyud</sec>` Tantra items), per-work cross-witness XMLs (`catalogs/K/K846.xml` etc.), full-text *Zungdu* diplomatic e-texts `1D/100.txt` & `1D/101.txt` (143 `rgya gar skad du/` Sanskrit titles + 90+ full EWTS mantras converted to Tibetan & IAST), and `tokushige-koyasan/tibetan-corpus` (`catalog.csv` of 3,452 Derge Kanjur/Tanjur Tantra texts). | M3 | survey (`explorer_survey_3`) |
| F12 | **DB #10: ALL-NIBS Dharani Preservation Project (Asian Legacy Library × Nagarjuna Institute)** | Query `https://publicapi.asianlegacylibrary.org/resources?indexes=sa&page=1&page_size=150&q=` with header `Authorization: Bearer byang-chub-kyi-sems` to index all 106 Sanskrit manuscript editions (`10 NIBS` Kathmandu + `96 Varanasi Preservation Center`) and fetch diplomatic full-text transcriptions (`/resources/{id}/search?...` for key Dhāraṇī/Tantra/Sūtra MSS such as `SA00019.001` *Suvarṇaprabhāsottama*, `SA00016.001` *Saṃpuṭatantra*, `SA00024.001` *Sekoddeśaṭīkā*, `SA00025.001` *Pradīpoddyotana*, `SA00028.001` *Sādhanamālā*, `SA00005.001`, `SA00007.001`, etc.), cross-linked with the 33+ Newar Sanskrit dhāraṇīs in NIBS/DSBC *Dhāraṇī Saṃgraha* (with Newar-to-standard Sanskrit orthographic normalization `b→v`, `sbāhā→svāhā`). | M3 | survey (`explorer_survey_3`) |
| F13 | **DB #11: IDP, BnF Pelliot Sanskrit, CEToM & CBETA Dunhuang (`T85` & `ZW`) Silk Road Corpus** | Fetch and parse IDP Berlin XML dumps (`http://idp.bbaw.de/database/oo_cat_rss.xml?shortref=...` for `Dalton_vanSchaik_2005` 348 Dunhuang Tantric MSS, `PelliotTibetain_I`, `PelliotChinois_I`, `BLSF_II_04` Hoernle Sanskrit MSS, `Karashima_2009`, `Wille_2006a/b`, `Wille_2009a/b` Khotanese Brāhmī dhāraṇīs, `Kudo_2006b` `IOL San 397` Dunhuang Mahāyāna vidyārājñī charm, `Suzuki_2006` `IOL San 913`, `SHT_0001-0099`), Vienna CEToM Pelliot Sanskrit (`PS`) & Silk Road Dhāraṇī editions (`?m-tht3187` Kizil Brāhmī *Nīlakaṇṭha Dhāraṇī*, `?m-psbl13`..`?m-psuv67`), and CBETA Dunhuang `T/T85` & `ZW` esoteric/dhāraṇī texts (`T85n2880`, `T85n2898`, `ZW01n0011`, `ZW03n0023`, `ZW06n0051`, `ZW06n0055`, `ZW11n0091`, `ZW11n0092`). | M3 | survey (`explorer_survey_3`) |
| F14 | **DB #12: Muktabodha Digital Library, ERC DHARMA Critical Editions & Oxford OCHS *Bīja*/Mantra Lexicons** | Fetch and parse `tokushige-koyasan/muktabodha-corpus` (`catalog.csv` of 499 Tantric IAST e-texts + full texts of Dakṣiṇāmūrti's *Uddhārakośa* `M00247`, Āśāditya's *Mantrakoṣa* `M00292`, *Mantracandrikā* `M00635`, *Mantrakaumudī* `M00229`, *Mātṛkārṇanighaṇṭu* `M00626`, and Buddhist *Advayavajrasaṃgraha* `M00018`), `tokushige-koyasan/dharma-editions-corpus` (`stts_crited.txt` *Sarvatathāgatatattvasaṅgraha* & `svu_crited.txt` *Sarvavajrodayā*), and Oxford OCHS Indic Manuscript Database (`ochs-database.netlify.app/sakta/` catalog + full JSON verse lexicons of `ochs_000_000_030_bijanighantu` *Bījanighaṇṭu*, `ochs_000_000_046_ekaksarakosa` *Ekākṣarakośa*, `ochs_000_000_259_mantrakosa` *Mantrakoṣa*, and `ochs_000_000_262_matrkarnanighantu` *Mātṛkārṇanighaṇṭu*). | M3 | survey (`explorer_survey_2`, `explorer_survey_3`) |
| F15 | **Unified 12-Database Cross-Canonical Concordance, Quadrilingual Glossary & *Bīja-Nighaṇṭu* Decipherment Engine** | Cross-reference entities across all 12 databases by canonical ID (`Taishō`, `Fangshan F`, `Tohoku/Derge`, `rKTs`, `DSBC/GRETIL`, `BuddhaNexus`, `CUDL MS`, `Polyglotta vid`, `ALL-NIBS`, `IDP/Pelliot/CEToM`, `Muktabodha/OCHS`), unify the 84000 + *Mahāvyutpatti* (§25 & §198) + `T54` quadrilingual glossary, and provide a Tantric *Bīja*/*Ekākṣara*/*Uddhāra* seed-syllable decipherer (*Bījanighaṇṭu*, *Ekākṣarakośa*, *Uddhārakośa*, Kūkai `T84n2701`). | M4 | survey (`explorer_survey_1`, `explorer_survey_2`, `explorer_survey_3`) |
| F16 | **Interactive React Web Application & Deterministic CLI (`kosa-cli.mjs`)** | Build the full React UI (12-Database Hub Explorer, Multi-Script Dhāraṇī Reader with 136.1 Hz Web Audio Synth, Fangshan `F28n1071` & `T54` Siddhaṃ-Chinese Interlinear Viewer with `二合`/`三合`/`引`/`彈舌` tags, Multi-Witness Parallel Alignment & CUDL IIIF Palm-Leaf Facsimile Viewer, Siddhaṃ 18-Chapter Academy & *Bīja* Decipherer, Custom Dhāraṇī Compiler) and `scripts/kosa-cli.mjs` CLI (`stats`, `dbs`, `inspect`, `search`, `concordance`, `phonetics`, `bija`, `verify-all`). | M4 | survey (`explorer_survey_1`, `explorer_survey_2`, `explorer_survey_3`) |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | **M1: Core Foundation, Baseline Restoration & Phonetic/Siddhaṃ Engine** | Initialize Vite + React + TypeScript project in `/home/antigravity`, define unified schemas (`src/types/dharani.ts`, `src/types/corpus.ts`), port the 1,638-line `sanskrit_phonetic_engine.html` into `src/core/transliterator.ts`, `src/core/prosody.ts`, `src/data/siddhamMatrix.ts`, and `src/services/sanskritAudioEngine.ts`, bundle `NotoSansSiddham-Regular.woff2`, and restore baseline datasets (`cbeta_gaiji` 2,240 glyphs, `T18–T21` 614 catalog entries, 19 Tang `<cb:tt>` texts with 916 alignments, 25 GRETIL works) via `scripts/fetch-baseline-data.mjs`. Covers **F1, F2**. | none | DONE (`sub_orch_m1` `6b8044f042bcfb1eed8a9936b955d4fe`, Gate PASS, 16/16 unit tests) |
| 2 | **M2: Category I Direct Open-Source Structured Corpora Ingestion (DBs #1–#6)** | Implement and run `scripts/fetch-tier1-databases.mjs` and `src/services/tier1CorpusService.ts` to genuinely fetch, parse, normalize, and compile **DB #1** (CBETA Fangshan `F28n1071` 730 dhāraṇīs / 8,291 `<cb:tt>` / 49,095 inline notes + `F24/F27`), **DB #2** (`T54n2128–2136`, `T84n2701–2711` via `bkkbooks/KR6t0412–0422` & `scottgfhong310/siddham-registry` 18 Chapters, `T08–T21` ancient dhāraṇīs incl. `T21n1336` 278 dhāraṇīs), **DB #3** (DSBC *Dhāraṇī Saṃgraha* `820/2949` & `824/2953`, `list/4`, 486-book catalog, GRETIL `bst-108u.htm` 108 Stotras & 261 Buddhist texts), **DB #4** (84000 Open TEI `Toh 502–808` & `Toh 846–1095` clean `<mantra>` + critical notes + trilingual `<gloss>` + TM alignments + RDF), **DB #5** (BuddhaNexus `segmented-sanskrit` `K12n2949u.json` 7,700 segments, `K12*`/`T01*`/`T02*` + DharmaMitra `menudata` 3,548-text catalog & API client), and **DB #6** (SARIT `caryamelapakapradipa.xml` Ch. 3 *Mantratattva* + 21 Buddhist TEI works) into `src/data/generated/tier1Databases.ts` and `public/data/tier1/`. Covers **F3, F4, F5, F6, F7, F8**. | M1 | DONE (`sub_orch_m2_gen2` `249e17f5101e06dadc27857029b482cd`, Gate PASS, 19/19 unit tests) |
| 3 | **M3: Category II & III Academic Editions, Multilingual Alignments & Silk Road/Tantric Databases (DBs #7–#12)** | Implement and run `scripts/fetch-tier23-databases.mjs` and `src/services/tier23CorpusService.ts` to genuinely fetch, parse, normalize, and compile **DB #7** (Cambridge CUDL 69 Dhāraṇī MSS, `MS-ADD-01326`, `MS-ADD-01680-00008-00001..3` + Gergely Hidas critical editions via DharmaMitra `SA_K12_Āgama_*_Hidas`), **DB #8** (Oslo Bibliotheca Polyglotta `polyglotta.uio.no` `vid=1175` 16-witness Heart Sūtra, `1134` Tārā 21 Praises, `727`, `207`, `1020`, `1264`, `483&cid=456868` Lotus Ch. 21, `263&cid=335411` & `338889` *Mahāvyutpatti* §25 & §198 116 quadrilingual terms), **DB #9** (Vienna rKTs `standard.xml` 16,179 items / 4,997 Sanskrit titles, `D/D.xml` 265 *Zungdu* items, `1D/100.txt` & `101.txt` full-text *Zungdu* e-texts with EWTS→IAST conversion, `tokushige-koyasan/tibetan-corpus` catalog), **DB #10** (ALL-NIBS Public API `publicapi.asianlegacylibrary.org` 106 Sanskrit MSS + full-text transcriptions & NIBS/DSBC Newar dhāraṇī witnesses), **DB #11** (IDP Berlin `oo_cat_rss.xml` 16+ Silk Road XML dumps incl. `Dalton_vanSchaik_2005`, `PelliotTibetain_I`, `BLSF_II_04`, `Wille_2009a`, `Kudo_2006b` `IOL San 397`, Vienna CEToM Pelliot Sanskrit & `THT 3187` *Nīlakaṇṭha*, CBETA Dunhuang `T85` & `ZW`), and **DB #12** (Muktabodha `tokushige-koyasan/muktabodha-corpus` 499 catalog + *Uddhārakośa* `M00247`, *Mantrakoṣa* `M00292`, *Mantracandrikā* `M00635`, *Mantrakaumudī* `M00229`, *Mātṛkārṇanighaṇṭu* `M00626`, *Advayavajrasaṃgraha* `M00018`, ERC DHARMA *STTS* & *Sarvavajrodayā*, Oxford OCHS *Bījanighaṇṭu* `#30` & *Ekākṣarakośa* `#46`) into `src/data/generated/tier23Databases.ts` and `public/data/tier23/`. Covers **F9, F10, F11, F12, F13, F14**. | M1 | DONE (`sub_orch_m3_gen2` `8c11833c1cdc0886f569bc37ac5db512`, Gate PASS, 25/25 unit tests) |
| 4 | **M4: Unified 12-Database Cross-Canonical Search, Concordance, Bīja Lexicon & Full Web UI / CLI Integration** | Implement `src/data/unifiedCorpusRegistry.ts`, `src/core/concordanceEngine.ts`, `src/core/bijaLexiconEngine.ts`, `src/core/searchEngine.ts`, `scripts/kosa-cli.mjs`, and the full React UI (`src/App.tsx`, `src/components/**`) exposing all baseline + 12 integrated databases, multi-script phonetics/audio, Fangshan/`T54` interlinear `<cb:tt>`, Polyglotta/84000/rKTs parallel witnesses, CUDL IIIF facsimiles, Siddhaṃ 18-Chapter Academy, and *Bīja-nighaṇṭu* seed-syllable decipherer. Covers **F15, F16**. | M1, M2, M3 | DONE (`sub_orch_m4` `e495a914f838bcb0db32367830052470`, Gate PASS, 74/74 unit tests, 196/196 E2E Tiers 1–4) |
| 5 | **M5: Final Milestone — Phase 1: 100% E2E Test Suite Pass (Tiers 1–4) + Phase 2: Adversarial Coverage Hardening (Tier 5)** | Phase 1: Wait for `TEST_READY.md` from E2E Testing Track and pass 100% of Tiers 1–4 E2E tests sequentially. Phase 2: Spawn Tier 5 sub-orchestrator running the Challenger (2) → Worker → Reviewer loop until zero coverage gaps remain. | M4, TEST_READY.md | DONE (`sub_orch_m5` `e7d41792154c800dc59fbff3155c6d37`, Gate PASS, 228/228 E2E Tiers 1–5, 74/74 unit tests) |

---

## Interface Contracts

### 1. Core Database & Entity Identifiers (`src/types/corpus.ts`)
```typescript
export type DatabaseId =
  | 'db1_fangshan'      // 1. CBETA Fangshan Stone Canon Dhāraṇī Collection (F28n1071, F24/F27)
  | 'db2_taisho_ext'    // 2. CBETA Taishō Siddhaṃ (T84), Lexicons (T54) & Ancient Dhāraṇīs (T08-T21)
  | 'db3_dsbc_gretil'   // 3. Nepal DSBC (Dhāraṇī Saṃgraha, list/4, 486 catalog) & GRETIL 261 Buddhist texts
  | 'db4_84000'         // 4. 84000 Open TEI (Toh 502-808 & Toh 846-1095), TM Alignments & Glossary
  | 'db5_buddhanexus'   // 5. BuddhaNexus Segmented Sanskrit (K12*, T01*, T02*) & DharmaMitra API
  | 'db6_sarit'         // 6. SARIT Indology TEI-P5 Corpus (Caryāmelāpakapradīpa & Buddhist works)
  | 'db7_cudl_hidas'    // 7. Cambridge CUDL Dhāraṇīsaṃgraha Palm-Leaf MSS & Gergely Hidas Editions
  | 'db8_polyglotta'    // 8. Oslo Bibliotheca Polyglotta / TLB Quadrilingual Alignments & Mahāvyutpatti
  | 'db9_rkts'          // 9. Vienna rKTs Kanjur/Tanjur Concordance & Derge Zungdu E-Texts
  | 'db10_all_nibs'     // 10. ALL-NIBS Dharani Preservation Project (106 Sanskrit MSS & Newar witnesses)
  | 'db11_idp_dunhuang' // 11. IDP Berlin, BnF Pelliot Sanskrit / CEToM & CBETA Dunhuang (T85 & ZW)
  | 'db12_muktabodha_ochs'; // 12. Muktabodha 499 Tantric E-Texts, DHARMA STTS & OCHS Bīja Lexicons

export interface DatabaseMetadataSummary {
  id: DatabaseId;
  number: number; // 1..12
  priorityTier: 1 | 2 | 3;
  nameZh: string;
  nameEn: string;
  institution: string;
  primarySourceUrls: string[];
  totalRecordsCount: number;
  mantraOrDharaniCount: number;
  scriptsAvailable: Array<'IAST' | 'Devanagari' | 'Siddham' | 'SLP1' | 'Tibetan-Unicode' | 'Tibetan-EWTS' | 'Chinese' | 'Brahmi' | 'Khotanese' | 'English'>;
  highlights: string[];
}
```

### 2. Core Transliteration, Prosody & Audio Engine (`src/core/transliterator.ts` & `src/core/prosody.ts`)
```typescript
export interface SyllableAnalysis {
  rawIast: string;
  slp1: string;
  devanagari: string;
  siddhamUnicode: string;
  modernPhonetic: string;      // Modern acoustic approximation (34x14 matrix m[])
  tangReconstruction: string;  // Tang Siddhaṃ phonetic transcription (34x14 matrix t[])
  ipa: string;
  weight: 'Guru' | 'Laghu';    // '—' (2 morae) or '⏑' (1 mora)
  sandhiNotes: string[];       // Anusvāra nasal assimilation / Visarga echo vowel notes
  bijaMeaning?: string;        // Seed syllable meaning if applicable
}

export interface LineAnalysis {
  originalText: string;
  normalizedIast: string;
  devanagari: string;
  siddhamUnicode: string;
  slp1: string;
  words: Array<{
    wordIast: string;
    wordDevanagari: string;
    wordSiddham: string;
    syllables: SyllableAnalysis[];
  }>;
}
```

### 3. Milestone Data Module Exports (`M1`, `M2`, `M3` → `M4`)
- **M1 (`src/data/generated/cbetaAuthRecords.ts`, `gretilAuthRecords.ts`, `taishoMikkyoIndex.ts`)**:
  Exports `CBETA_GAIJI_MAP`, `CBETA_AUTH_RECORDS`, `GRETIL_AUTH_RECORDS`, `TAISHO_MIKKYO_INDEX`.
- **M2 (`src/data/generated/tier1Databases.ts` & `public/data/tier1/*.json`)**:
  Exports `DB1_FANGSHAN_CORPUS`, `DB2_TAISHO_EXT_CORPUS`, `DB3_DSBC_GRETIL_CORPUS`, `DB4_84000_CORPUS`, `DB5_BUDDHANEXUS_CORPUS`, `DB6_SARIT_CORPUS`, and `TIER1_DATABASE_SUMMARIES` (6 `DatabaseMetadataSummary` objects for `db1_fangshan`..`db6_sarit`).
- **M3 (`src/data/generated/tier23Databases.ts` & `public/data/tier23/*.json`)**:
  Exports `DB7_CUDL_HIDAS_CORPUS`, `DB8_POLYGLOTTA_CORPUS`, `DB9_RKTS_CORPUS`, `DB10_ALL_NIBS_CORPUS`, `DB11_IDP_DUNHUANG_CORPUS`, `DB12_MUKTABODHA_OCHS_CORPUS`, and `TIER23_DATABASE_SUMMARIES` (6 `DatabaseMetadataSummary` objects for `db7_cudl_hidas`..`db12_muktabodha_ochs`).
- **M4 (`src/data/unifiedCorpusRegistry.ts` & `scripts/kosa-cli.mjs`)**:
  Combines Baseline + M2 (`tier1Databases.ts`) + M3 (`tier23Databases.ts`) into `UNIFIED_12_DATABASES`, `searchAllDatabases(query, options)`, `resolveCanonicalConcordance(idOrTitle)`, `decipherBijaSyllable(syllable)`, and exposes them in both the React Web UI and the CLI (`node scripts/kosa-cli.mjs`).

### 4. Standard Build, CLI & Test Entry Points (`package.json`)
- `npm run build` — Runs `tsc -b && vite build` (must exit 0 with zero errors).
- `npm test` — Runs `vitest run` unit/integration tests.
- `npm run kosa-cli -- <subcommand> [args]` (or `node scripts/kosa-cli.mjs <subcommand> [args]`):
  - `node scripts/kosa-cli.mjs stats [--json]` — Prints summary statistics for Baseline + all 12 integrated databases (`db1_fangshan`..`db12_muktabodha_ochs`).
  - `node scripts/kosa-cli.mjs dbs [--json]` — Lists all 12 integrated databases with record counts, scripts, and sample IDs.
  - `node scripts/kosa-cli.mjs inspect <dbId> [recordId] [--json]` — Returns detailed records/mantras/annotations from the specified database (`db1_fangshan`..`db12_muktabodha_ochs` or `1`..`12`).
  - `node scripts/kosa-cli.mjs search <query> [--db <dbId>] [--json]` — Searches across all 12 databases + baseline by Sanskrit IAST, Devanāgarī, Siddhaṃ, Chinese, Tibetan Wylie/Unicode, English, Taishō ID, Fangshan ID, Tohoku/Derge ID, rKTs ID, or CUDL ID.
  - `node scripts/kosa-cli.mjs concordance <idOrName> [--json]` — Resolves cross-canonical parallels across CBETA Taishō/Fangshan, 84000 Tohoku, rKTs Derge Zungdu, DSBC/GRETIL, BuddhaNexus, Cambridge CUDL, Oslo Polyglotta, ALL-NIBS, and IDP/CEToM.
  - `node scripts/kosa-cli.mjs phonetics <text> [--json]` — Runs multi-script transliteration (IAST, Devanāgarī, SLP1, Siddhaṃ), 34×14 dual-track phonetics (Tang + Modern), Anusvāra/Visarga sandhi, and Chandas Guru/Laghu prosody on any input string.
  - `node scripts/kosa-cli.mjs bija <syllable> [--json]` — Deciphers esoteric seed syllables (`oṃ`, `hūṃ`, `hrīḥ`, `krīṃ`, `aiṃ`, `phaṭ`, `svāhā`, etc.) using `T84n2701` (Kūkai), *Bījanighaṇṭu* (OCHS `#30`), *Ekākṣarakośa* (OCHS `#46`), *Uddhārakośa* (Muktabodha `M00247`), and *Mātṛkārṇanighaṇṭu* (`M00626`).
  - `node scripts/kosa-cli.mjs verify-all [--json]` — Runs end-to-end integrity assertions verifying non-empty, authentic records across all 12 databases and baseline corpora.

---

## Code Layout

Strict file ownership boundaries per milestone to prevent concurrent write conflicts:

```
/home/antigravity/
├── PROJECT.md                                 # Owned by Project Orchestrator
├── TEST_INFRA.md                              # Owned by E2E Testing Orchestrator
├── TEST_READY.md                              # Owned by E2E Testing Orchestrator
├── package.json                               # Owned by M1 (M4 may add CLI script alias if needed after M1-M3 finish)
├── tsconfig.json                              # Owned by M1
├── vite.config.ts                             # Owned by M1
├── index.html                                 # Owned by M1
├── public/
│   ├── fonts/NotoSansSiddham-Regular.woff2    # Owned by M1
│   └── data/
│       ├── baseline/                          # Owned by M1
│       ├── tier1/                             # Owned by M2 (DBs #1–#6 raw/compiled JSON artifacts)
│       └── tier23/                            # Owned by M3 (DBs #7–#12 raw/compiled JSON artifacts)
├── scripts/
│   ├── fetch-baseline-data.mjs                # Owned by M1
│   ├── fetch-tier1-databases.mjs              # Owned by M2
│   ├── fetch-tier23-databases.mjs             # Owned by M3
│   └── kosa-cli.mjs                           # Owned by M4
├── src/
│   ├── types/
│   │   ├── dharani.ts                         # Owned by M1
│   │   └── corpus.ts                          # Owned by M1
│   ├── core/
│   │   ├── transliterator.ts                  # Owned by M1
│   │   ├── prosody.ts                         # Owned by M1
│   │   ├── concordanceEngine.ts               # Owned by M4
│   │   ├── bijaLexiconEngine.ts               # Owned by M4
│   │   └── searchEngine.ts                    # Owned by M4
│   ├── data/
│   │   ├── siddhamMatrix.ts                   # Owned by M1
│   │   ├── corpus/                            # Owned by M1 (baseline curateddharanis)
│   │   ├── generated/
│   │   │   ├── cbetaAuthRecords.ts            # Owned by M1
│   │   │   ├── gretilAuthRecords.ts           # Owned by M1
│   │   │   ├── taishoMikkyoIndex.ts           # Owned by M1
│   │   │   ├── tier1Databases.ts              # Owned by M2 (DBs #1–#6)
│   │   │   └── tier23Databases.ts             # Owned by M3 (DBs #7–#12)
│   │   └── unifiedCorpusRegistry.ts           # Owned by M4
│   ├── services/
│   │   ├── sanskritAudioEngine.ts             # Owned by M1
│   │   ├── tier1CorpusService.ts              # Owned by M2
│   │   └── tier23CorpusService.ts             # Owned by M3
│   ├── components/                            # Owned by M4
│   ├── App.tsx                                # Owned by M4
│   ├── main.tsx                               # Owned by M1 (updated by M4)
│   └── index.css                              # Owned by M1 (updated by M4)
└── tests/
    ├── unit/
    │   ├── m1-foundation.test.ts              # Owned by M1
    │   ├── m2-tier1-databases.test.ts         # Owned by M2
    │   ├── m3-tier23-databases.test.ts        # Owned by M3
    │   └── m4-integration-ui.test.ts          # Owned by M4
    └── e2e/                                   # Owned by E2E Testing Track (and M5 Phase 2 for Tier 5)
```
