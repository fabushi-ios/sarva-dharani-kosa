# E2E Test Suite Ready (`TEST_READY.md`) — 梵音宝典 · Sarva-Dhāraṇī-Kośa

## Status: **READY FOR FINAL MILESTONE (M5 PHASE 1 & PHASE 2)**

The requirement-driven, opaque-box 4-Tier E2E Test Suite covering **all 16 features (`F1`–`F16`)** and **all 12 international Sanskrit Dhāraṇī & Esoteric Buddhist databases (`db1_fangshan`..`db12_muktabodha_ochs`)** in `/home/antigravity/PROJECT.md` has been implemented, verified, and forensically audited.

---

## 1. Test Runner Commands (`/home/antigravity/tests/e2e/run-e2e-suite.mjs`)

| Execution Mode | Command | Expected Exit Code |
|---|---|---|
| **Run Full Suite (All Tiers)** | `node /home/antigravity/tests/e2e/run-e2e-suite.mjs --all` | `0` iff 100% of executed tests pass |
| **Run Tier 1 (Feature Coverage — 80 tests)** | `node /home/antigravity/tests/e2e/run-e2e-suite.mjs --tier 1` | `0` iff 80/80 pass |
| **Run Tier 2 (Boundary & Corner Cases — 80 tests)** | `node /home/antigravity/tests/e2e/run-e2e-suite.mjs --tier 2` | `0` iff 80/80 pass |
| **Run Tier 3 (Cross-Feature Combinations — 24 tests)** | `node /home/antigravity/tests/e2e/run-e2e-suite.mjs --tier 3` | `0` iff 24/24 pass |
| **Run Tier 4 (Real-World Scenarios — 12 tests)** | `node /home/antigravity/tests/e2e/run-e2e-suite.mjs --tier 4` | `0` iff 12/12 pass |
| **Run Tier 5 (Adversarial Hardening — 32 tests)** | `node /home/antigravity/tests/e2e/run-e2e-suite.mjs --tier 5` | `0` iff 32/32 Tier 5 tests pass |
| **Filter by Feature (`F1`..`F16`)** | `node /home/antigravity/tests/e2e/run-e2e-suite.mjs --feature F3` | `0` iff all matching tests pass |
| **Filter by Single Test ID** | `node /home/antigravity/tests/e2e/run-e2e-suite.mjs --id T1-F1-01` | `0` iff test passes |
| **Validate Suite Structure & Anti-Stub Rules** | `node /home/antigravity/tests/e2e/run-e2e-suite.mjs --validate-suite` | `0` (`228` valid tests, `0` errors) |

*(Add `--json` to any command above for structured machine-readable JSON telemetry.)*

---

## 2. 5-Tier Coverage Summary Table (`N = 16` Features)

| Tier | File | Minimum Required | Implemented Count | Status |
|---|---|---:|---:|---|
| **Tier 1: Feature Coverage (Happy Path)** | `tests/e2e/tier1-feature-coverage.mjs` | ≥ 80 (≥ 5 / feature) | **80** (5 / feature) | **READY** |
| **Tier 2: Boundary & Orthographic Corner Cases** | `tests/e2e/tier2-boundary-corner.mjs` | ≥ 80 (≥ 5 / feature) | **80** (5 / feature) | **READY** |
| **Tier 3: Cross-Feature Combinations** | `tests/e2e/tier3-cross-feature.mjs` | ≥ 20 | **24** | **READY** |
| **Tier 4: Real-World Application Scenarios** | `tests/e2e/tier4-real-world-scenarios.mjs` | ≥ 10 | **12** | **READY** |
| **Tier 5: Adversarial Coverage Hardening** | `tests/e2e/tier5-adversarial.mjs` | M5 Phase 2 Suite | **32** (`T5-ADV-01..32`) | **READY** |
| **Total (Tiers 1–5)** | `tests/e2e/run-e2e-suite.mjs` | **≥ 190** | **228** | **READY** |

---

## 3. Feature-by-Feature Coverage Checklist (`F1`–`F16`)

- [x] **F1 — Baseline CBETA Gaiji, `T18–T21` & GRETIL Restoration**: 5 Tier 1 (`T1-F1-01..05`), 5 Tier 2 (`T2-F1-01..05`), 6 Tier 3, 10 Tier 4 tests (`26` total).
- [x] **F2 — Multi-Script Transliteration, 34×14 Phonetic Matrix, Prosody & 136.1 Hz Audio Engine**: 5 Tier 1 (`T1-F2-01..05`), 5 Tier 2 (`T2-F2-01..05`), 7 Tier 3, 11 Tier 4 tests (`28` total).
- [x] **F3 — DB #1 (`db1_fangshan`): CBETA Fangshan `F28n1071` (30 Rolls, 730 Dhāraṇīs, 8,291 `<cb:tt>`, 49,095 Inline Notes) & `F24/F27`**: 5 Tier 1 (`T1-F3-01..05`), 5 Tier 2 (`T2-F3-01..05`), 4 Tier 3, 7 Tier 4 tests (`21` total).
- [x] **F4 — DB #2 (`db2_taisho_ext`): CBETA Taishō `T54` Lexicons, `T84` Siddhaṃ & 18 Chapters, `T08–T21` Ancient Dhāraṇīs**: 5 Tier 1 (`T1-F4-01..05`), 5 Tier 2 (`T2-F4-01..05`), 5 Tier 3, 6 Tier 4 tests (`21` total).
- [x] **F5 — DB #3 (`db3_dsbc_gretil`): Nepal DSBC (*Dhāraṇī Saṃgraha* `820/2949` & `824/2953`, `list/4`, 486 Catalog) & GRETIL 261 Texts**: 5 Tier 1 (`T1-F5-01..05`), 5 Tier 2 (`T2-F5-01..05`), 4 Tier 3, 7 Tier 4 tests (`21` total).
- [x] **F6 — DB #4 (`db4_84000`): 84000 Open TEI (`Toh 502–808` & `Toh 846–1095`), TM Alignments, RDF & Trilingual Glossary**: 5 Tier 1 (`T1-F6-01..05`), 5 Tier 2 (`T2-F6-01..05`), 5 Tier 3, 7 Tier 4 tests (`22` total).
- [x] **F7 — DB #5 (`db5_buddhanexus`): BuddhaNexus Segmented Sanskrit (`K12n2949u`, `K12*`, `T01*`, `T02*`) & DharmaMitra API**: 5 Tier 1 (`T1-F7-01..05`), 5 Tier 2 (`T2-F7-01..05`), 3 Tier 3, 7 Tier 4 tests (`20` total).
- [x] **F8 — DB #6 (`db6_sarit`): SARIT Indology TEI-P5 Corpus (*Caryāmelāpakapradīpa* Ch. 3 *Mantratattva* & 21 Buddhist Works)**: 5 Tier 1 (`T1-F8-01..05`), 5 Tier 2 (`T2-F8-01..05`), 3 Tier 3, 3 Tier 4 tests (`16` total).
- [x] **F9 — DB #7 (`db7_cudl_hidas`): Cambridge CUDL 69 Dhāraṇī MSS (`MS-ADD-01326`, `MS-ADD-01680-00008-00001..3`) & 9 Hidas Editions**: 5 Tier 1 (`T1-F9-01..05`), 5 Tier 2 (`T2-F9-01..05`), 4 Tier 3, 8 Tier 4 tests (`22` total).
- [x] **F10 — DB #8 (`db8_polyglotta`): Oslo Bibliotheca Polyglotta (`vid=1175` 16-Witness Heart Sūtra, `1134`, `727`, `483`, *Mahāvyutpatti* §25/§198)**: 5 Tier 1 (`T1-F10-01..05`), 5 Tier 2 (`T2-F10-01..05`), 4 Tier 3, 4 Tier 4 tests (`18` total).
- [x] **F11 — DB #9 (`db9_rkts`): Vienna rKTs (`standard.xml` 16,179 Works, `D.xml` 265 *Zungdu* Items, `1D/100.txt` & `101.txt` EWTS Mantras)**: 5 Tier 1 (`T1-F11-01..05`), 5 Tier 2 (`T2-F11-01..05`), 3 Tier 3, 8 Tier 4 tests (`21` total).
- [x] **F12 — DB #10 (`db10_all_nibs`): ALL-NIBS Dharani Preservation Project (106 Sanskrit MSS `SA00019.001`.. & 33+ Newar Witnesses)**: 5 Tier 1 (`T1-F12-01..05`), 5 Tier 2 (`T2-F12-01..05`), 3 Tier 3, 6 Tier 4 tests (`19` total).
- [x] **F13 — DB #11 (`db11_idp_dunhuang`): IDP Berlin XML Dumps (`Dalton_vanSchaik_2005`, `Kudo_2006b` `IOL San 397`), CEToM `THT 3187` & CBETA `T85`/`ZW`**: 5 Tier 1 (`T1-F13-01..05`), 5 Tier 2 (`T2-F13-01..05`), 3 Tier 3, 2 Tier 4 tests (`15` total).
- [x] **F14 — DB #12 (`db12_muktabodha_ochs`): Muktabodha 499 Tantric Texts (*Uddhārakośa*, *Mantrakoṣa*), DHARMA *STTS* & OCHS *Bījanighaṇṭu* `#30`**: 5 Tier 1 (`T1-F14-01..05`), 5 Tier 2 (`T2-F14-01..05`), 4 Tier 3, 4 Tier 4 tests (`18` total).
- [x] **F15 — Unified 12-Database Cross-Canonical Concordance, Quadrilingual Glossary & *Bīja-Nighaṇṭu* Decipherment Engine**: 5 Tier 1 (`T1-F15-01..05`), 5 Tier 2 (`T2-F15-01..05`), 4 Tier 3, 12 Tier 4 tests (`26` total).
- [x] **F16 — Interactive React Web Application & Deterministic CLI (`scripts/kosa-cli.mjs`)**: 5 Tier 1 (`T1-F16-01..05`), 5 Tier 2 (`T2-F16-01..05`), 1 Tier 3, 4 Tier 4 tests (`15` total).
