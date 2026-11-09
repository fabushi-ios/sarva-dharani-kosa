# E2E Test Infrastructure (`TEST_INFRA.md`) — 梵音宝典 · Sarva-Dhāraṇī-Kośa

## 1. Overview & Opaque-Box Design Philosophy

This document defines the requirement-driven, opaque-box 4-Tier End-to-End (E2E) Test Suite for **梵音宝典 · Sarva-Dhāraṇī-Kośa**. Designed independently from the Implementation Track (`M1`–`M4`) directly against `/home/antigravity/.agents/teamwork/ORIGINAL_REQUEST.md`, `/home/antigravity/PROJECT.md`, and the Phase 0 technical surveys (`explorer_survey_1..3`), this suite verifies all **16 Features (`F1`–`F16`)** across:
1. **Deterministic CLI Execution** (`node scripts/kosa-cli.mjs <subcommand> --json` for `stats`, `dbs`, `inspect`, `search`, `concordance`, `phonetics`, `bija`, `verify-all`).
2. **Authoritative Data & Module Artifacts** (`src/data/generated/*`, `public/data/{baseline,tier1,tier23}/*`, `public/fonts/NotoSansSiddham-Regular.woff2`, `src/core/*`, `src/data/unifiedCorpusRegistry.ts`).
3. **Production Build & Interactive Web UI Verification** (`npm run build` artifact check, React UI component/tab structure, 12-Database Hub Explorer, Multi-Script Reader, Interlinear Viewer, Parallel Alignment Studio, CUDL IIIF Viewer, Siddhaṃ 18-Chapter & *Bīja* Academy).

---

## 2. Test Runner Architecture & CLI Commands

The E2E test suite is located in `/home/antigravity/tests/e2e/` and uses pure Node.js ES modules (`node:assert/strict`, `node:child_process`, `node:fs`, `node:path`) with zero external test-runner dependencies so it can execute deterministically at any time.

### Entry Point: `/home/antigravity/tests/e2e/run-e2e-suite.mjs`

| Command | Description |
|---------|-------------|
| `node tests/e2e/run-e2e-suite.mjs` (or `--all`) | Runs all E2E test tiers (Tiers 1–4 = 196 tests, plus Tier 5 if populated) sequentially and exits `0` iff 100% of test cases pass. |
| `node tests/e2e/run-e2e-suite.mjs --tier 1` | Runs **Tier 1: Feature Coverage** (`80` tests, `5` per feature `F1`–`F16`: `T1-F1-01`..`T1-F16-05`). |
| `node tests/e2e/run-e2e-suite.mjs --tier 2` | Runs **Tier 2: Boundary & Corner Cases** (`80` tests, `5` per feature `F1`–`F16`: `T2-F1-01`..`T2-F16-05`). |
| `node tests/e2e/run-e2e-suite.mjs --tier 3` | Runs **Tier 3: Cross-Feature Combinations** (`24` pairwise & multi-feature interaction tests: `T3-CF-01`..`T3-CF-24`). |
| `node tests/e2e/run-e2e-suite.mjs --tier 4` | Runs **Tier 4: Real-World Application Scenarios** (`12` end-to-end scholar/practitioner workflows: `T4-RW-01`..`T4-RW-12`). |
| `node tests/e2e/run-e2e-suite.mjs --tier 5` | Runs **Tier 5: Adversarial Coverage Hardening** (populated in Final Milestone M5 Phase 2). |
| `node tests/e2e/run-e2e-suite.mjs --feature <F1..F16>` | Filters execution to tests covering the specified feature (`F1`..`F16`). |
| `node tests/e2e/run-e2e-suite.mjs --id <testId>` | Runs a single test case by ID (e.g., `T1-F2-01`), optionally combined with `--json`. |
| `node tests/e2e/run-e2e-suite.mjs --validate-suite [--json]` | Self-validates the E2E suite structure, verifying that all 16 features (`F1`–`F16`) have ≥ 5 Tier 1 tests (`80` total) and ≥ 5 Tier 2 tests (`80` total), Tier 3 has ≥ 20 cross-feature tests (`24` total), Tier 4 has ≥ 10 real-world scenarios (`12` total), total ≥ 190 tests (`196` total), and every test contains genuine executable assertions (`run()` function). |

---

## 3. Feature Inventory & Coverage Matrix (`N = 16`)

| Feature ID | Feature Name | Milestone | Tier 1 Min | Tier 2 Min | Primary Verification Surfaces |
|------------|--------------|-----------|------------|------------|-------------------------------|
| **F1** | Baseline CBETA Gaiji (2,240), `T18–T21` (614), 16 Tang `<cb:tt>` (916), 25 GRETIL & Siddhaṃ Font | M1 | ≥ 5 | ≥ 5 | `cbetaAuthRecords.ts`, `gretilAuthRecords.ts`, `taishoMikkyoIndex.ts`, `NotoSansSiddham-Regular.woff2`, CLI `stats` |
| **F2** | Multi-Script Transliteration, 34×14 Phonetic Matrix, Prosody & 136.1 Hz Audio Engine | M1 | ≥ 5 | ≥ 5 | `kosa-cli.mjs phonetics`, `transliterator.ts`, `prosody.ts`, `siddhamMatrix.ts`, `sanskritAudioEngine.ts` |
| **F3** | DB #1 (`db1_fangshan`): CBETA Fangshan `F28n1071` (30 rolls, 730 dhāraṇīs, 8,291 `<cb:tt>`, 49,095 notes) & `F24/F27` | M2 | ≥ 5 | ≥ 5 | `kosa-cli.mjs inspect db1_fangshan`, `search`, `DB1_FANGSHAN_CORPUS` |
| **F4** | DB #2 (`db2_taisho_ext`): CBETA Taishō `T54` Lexicons, `T84` Siddhaṃ & 18 Chapters, `T08–T21` Ancient Dhāraṇīs | M2 | ≥ 5 | ≥ 5 | `kosa-cli.mjs inspect db2_taisho_ext`, `search`, `DB2_TAISHO_EXT_CORPUS` |
| **F5** | DB #3 (`db3_dsbc_gretil`): Nepal DSBC (*Dhāraṇī Saṃgraha* `820/2949` & `824/2953`, `list/4`, 486 catalog) & GRETIL 261 Texts | M2 | ≥ 5 | ≥ 5 | `kosa-cli.mjs inspect db3_dsbc_gretil`, `search`, `DB3_DSBC_GRETIL_CORPUS` |
| **F6** | DB #4 (`db4_84000`): 84000 Open TEI (`Toh 502–808` & `Toh 846–1095`), TM Alignments, RDF & Trilingual Glossary | M2 | ≥ 5 | ≥ 5 | `kosa-cli.mjs inspect db4_84000`, `search`, `DB4_84000_CORPUS` |
| **F7** | DB #5 (`db5_buddhanexus`): BuddhaNexus Segmented Sanskrit (`K12n2949u`, `K12*`, `T01*`, `T02*`) & DharmaMitra API | M2 | ≥ 5 | ≥ 5 | `kosa-cli.mjs inspect db5_buddhanexus`, `search`, `DB5_BUDDHANEXUS_CORPUS` |
| **F8** | DB #6 (`db6_sarit`): SARIT TEI-P5 Corpus (*Caryāmelāpakapradīpa* Ch. 3 *Mantratattva* & 21 Buddhist Works) | M2 | ≥ 5 | ≥ 5 | `kosa-cli.mjs inspect db6_sarit`, `search`, `DB6_SARIT_CORPUS` |
| **F9** | DB #7 (`db7_cudl_hidas`): Cambridge CUDL 69 Dhāraṇī MSS (`MS-ADD-01326`, `MS-ADD-01680-00008-00001..3`) & Hidas Editions | M3 | ≥ 5 | ≥ 5 | `kosa-cli.mjs inspect db7_cudl_hidas`, `search`, `DB7_CUDL_HIDAS_CORPUS` |
| **F10** | DB #8 (`db8_polyglotta`): Oslo Bibliotheca Polyglotta (`vid=1175` 16-Witness Heart Sūtra, `1134`, `727`, `483`, *Mahāvyutpatti* §25/§198) | M3 | ≥ 5 | ≥ 5 | `kosa-cli.mjs inspect db8_polyglotta`, `search`, `DB8_POLYGLOTTA_CORPUS` |
| **F11** | DB #9 (`db9_rkts`): Vienna rKTs (`standard.xml` 16,179 works, `D.xml` 265 *Zungdu* items, `1D/100.txt` & `101.txt` EWTS mantras) | M3 | ≥ 5 | ≥ 5 | `kosa-cli.mjs inspect db9_rkts`, `search`, `DB9_RKTS_CORPUS` |
| **F12** | DB #10 (`db10_all_nibs`): ALL-NIBS Dharani Preservation Project (106 Sanskrit MSS `SA00019.001`.. & Newar Witnesses) | M3 | ≥ 5 | ≥ 5 | `kosa-cli.mjs inspect db10_all_nibs`, `search`, `DB10_ALL_NIBS_CORPUS` |
| **F13** | DB #11 (`db11_idp_dunhuang`): IDP Berlin XML Dumps (`Dalton_vanSchaik_2005`, `Kudo_2006b` `IOL San 397`), CEToM `THT 3187` & CBETA `T85`/`ZW` | M3 | ≥ 5 | ≥ 5 | `kosa-cli.mjs inspect db11_idp_dunhuang`, `search`, `DB11_IDP_DUNHUANG_CORPUS` |
| **F14** | DB #12 (`db12_muktabodha_ochs`): Muktabodha 499 Tantric Texts (*Uddhārakośa*, *Mantrakoṣa*), DHARMA *STTS* & OCHS *Bījanighaṇṭu* `#30` | M3 | ≥ 5 | ≥ 5 | `kosa-cli.mjs inspect db12_muktabodha_ochs`, `bija`, `DB12_MUKTABODHA_OCHS_CORPUS` |
| **F15** | Unified 12-Database Cross-Canonical Concordance, Quadrilingual Glossary & *Bīja-Nighaṇṭu* Decipherment Engine | M4 | ≥ 5 | ≥ 5 | `kosa-cli.mjs concordance`, `kosa-cli.mjs bija`, `concordanceEngine.ts`, `bijaLexiconEngine.ts` |
| **F16** | Interactive React Web Application & Deterministic CLI (`scripts/kosa-cli.mjs`) | M4 | ≥ 5 | ≥ 5 | `kosa-cli.mjs stats/dbs/verify-all`, `npm run build` (`dist/`), `src/App.tsx`, `src/components/**` |

---

## 4. Directory Layout (`/home/antigravity/tests/e2e/`)

```
/home/antigravity/tests/e2e/
├── run-e2e-suite.mjs              # Main CLI runner (--tier 1..5, --all, --validate-suite)
├── helpers/
│   └── harness.mjs                # Shared CLI/file/module/JSON assertion helpers & caching
├── tier1-feature-coverage.mjs     # Tier 1: ≥ 80 happy-path tests across F1–F16 (≥ 5 per feature)
├── tier2-boundary-corner.mjs      # Tier 2: ≥ 80 boundary & orthographic edge-case tests across F1–F16 (≥ 5 per feature)
├── tier3-cross-feature.mjs        # Tier 3: ≥ 20 pairwise cross-feature interaction tests
├── tier4-real-world-scenarios.mjs # Tier 4: ≥ 10 end-to-end scholar/practitioner workflows
└── tier5-adversarial.mjs          # Tier 5: Adversarial hardening extension hook for Final Milestone M5 Phase 2
```
