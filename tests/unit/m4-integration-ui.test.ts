import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  CANONICAL_DATABASE_IDS,
  UNIFIED_12_DATABASES,
  getDatabaseSummary,
  getUnifiedSystemStats,
  inspectDatabaseRecords,
  resolveDatabaseId,
  verifyAllDatabasesIntegrity,
} from '../../src/data/unifiedCorpusRegistry';
import {
  CONCORDANCE_CLUSTERS,
  getUnifiedMultilingualGlossary,
  resolveCanonicalConcordance,
} from '../../src/core/concordanceEngine';
import {
  UNIFIED_BIJA_LEXICON,
  decipherBijaSyllable,
  getAllBijaLexiconEntries,
} from '../../src/core/bijaLexiconEngine';
import {
  searchAllDatabases,
  searchUnifiedCorpus,
} from '../../src/core/searchEngine';

import { App } from '../../src/App';
import { DatabaseHubExplorer } from '../../src/components/DatabaseHubExplorer';
import { MultiScriptDharaniReader } from '../../src/components/MultiScriptDharaniReader';
import { FangshanTaishoInterlinearStudio } from '../../src/components/FangshanTaishoInterlinearStudio';
import { ConcordanceParallelStudio } from '../../src/components/ConcordanceParallelStudio';
import { CudlPalmLeafViewer } from '../../src/components/CudlPalmLeafViewer';
import { SiddhamBijaAcademy } from '../../src/components/SiddhamBijaAcademy';

const ROOT_DIR = path.resolve(__dirname, '../..');
const CLI_PATH = path.join(ROOT_DIR, 'scripts/kosa-cli.mjs');

describe('Milestone 4: Unified 12-Database Registry, Concordance, Bīja Engine, Search, CLI & React Workbenches', () => {
  describe('Suite 1 — Unified 12-Database Registry (src/data/unifiedCorpusRegistry.ts)', () => {
    it('exports all 12 canonical databases ordered 1..12 with positive record counts', () => {
      expect(UNIFIED_12_DATABASES).toHaveLength(12);
      expect(CANONICAL_DATABASE_IDS).toHaveLength(12);
      UNIFIED_12_DATABASES.forEach((db, idx) => {
        expect(db.number).toBe(idx + 1);
        expect(db.id).toBe(CANONICAL_DATABASE_IDS[idx]);
        expect(db.totalRecordsCount).toBeGreaterThan(0);
        expect(db.mantraOrDharaniCount).toBeGreaterThan(0);
      });
    });

    it('resolves database summaries by canonical ID, numeric shorthand 1..12, and returns null for invalid IDs', () => {
      expect(resolveDatabaseId('db1_fangshan')).toBe('db1_fangshan');
      expect(resolveDatabaseId(1)).toBe('db1_fangshan');
      expect(resolveDatabaseId('7')).toBe('db7_cudl_hidas');
      expect(resolveDatabaseId(12)).toBe('db12_muktabodha_ochs');
      expect(resolveDatabaseId('db99_invalid')).toBeNull();
      expect(getDatabaseSummary('db1_fangshan')?.number).toBe(1);
      expect(getDatabaseSummary(12)?.id).toBe('db12_muktabodha_ochs');
      expect(getDatabaseSummary('db99_invalid')).toBeNull();
    });

    it('inspects records across all 12 databases with clean sanitized payloads', () => {
      const r1 = inspectDatabaseRecords('db1_fangshan', 'F28n1071');
      expect(JSON.stringify(r1)).toContain('釋教最上乘秘密藏陀羅尼集');

      const r7 = inspectDatabaseRecords(7, 'MS-ADD-01326');
      expect(JSON.stringify(r7)).toContain('MS-ADD-01326');

      const r8 = inspectDatabaseRecords('db8_polyglotta', '1175');
      expect(JSON.stringify(r8)).toContain('Prajñāpāramitāhṛdaya');

      const r10 = inspectDatabaseRecords('db10_all_nibs', 'SA00019.001');
      expect(JSON.stringify(r10)).toContain('KSK-00556');

      const r11 = inspectDatabaseRecords('db11_idp_dunhuang', 'IOL San 397');
      expect(JSON.stringify(r11)).toContain('IOL San 397');

      const r12 = inspectDatabaseRecords(12, 'M00247');
      expect(JSON.stringify(r12)).toContain('Uddhārakośa');
    });

    it('verifies end-to-end integrity across Baseline and all 12 databases', () => {
      const stats = getUnifiedSystemStats();
      expect(stats.cbetaGaijiCount).toBe(2240);
      expect(stats.totalDatabases).toBe(12);

      const report = verifyAllDatabasesIntegrity();
      expect(report.valid).toBe(true);
      expect(report.status).toBe('PASS');
      expect(report.databases).toHaveLength(12);
    });
  });

  describe('Suite 2 — Cross-Canonical Concordance & Quadrilingual Glossary (src/core/concordanceEngine.ts)', () => {
    it('resolves pan-Buddhist concordance clusters across Taishō, Fangshan, Tohoku, rKTs, CUDL, and Polyglotta aliases', () => {
      expect(CONCORDANCE_CLUSTERS.length).toBeGreaterThanOrEqual(16);

      const queries = [
        'Prajñāpāramitāhṛdaya',
        'T0251',
        'T08n0251',
        'Toh 507',
        'toh883',
        'MS-ADD-01326',
        'vid=1175',
        'Uṣṇīṣavijayā',
        'Vasudhārā',
        'Tārānamaskāraikaviṃśatistotra',
        'Bhaiṣajyaguru',
        'Nīlakaṇṭha',
      ];
      for (const q of queries) {
        const res = resolveCanonicalConcordance(q);
        expect(res.status).toBe('ok');
        expect(res.matchedClusters.length).toBeGreaterThan(0);
      }

      const unknown = resolveCanonicalConcordance('__NON_EXISTENT_XYZZY_99999__');
      expect(unknown.status).toBe('not_found');
      expect(unknown.matchedClusters).toHaveLength(0);
    });

    it('queries the unified quadrilingual glossary for dhāraṇī, prajñā, adhiṣṭhāna, and vidyārājñī', () => {
      const dharaniGloss = getUnifiedMultilingualGlossary('dhāraṇī');
      const dharaniStr = JSON.stringify(dharaniGloss);
      expect(dharaniStr).toContain('gzungs');
      expect(dharaniStr).toContain('陀羅尼');

      const vidyaGloss = getUnifiedMultilingualGlossary('vidyārājñī');
      expect(JSON.stringify(vidyaGloss)).toContain('rig sngags');
    });
  });

  describe('Suite 3 — Tantric Bīja-Nighaṇṭu Decipherment Engine (src/core/bijaLexiconEngine.ts)', () => {
    it('deciphers single seed syllables across IAST, ASCII, Devanāgarī, and Siddhaṃ', () => {
      expect(UNIFIED_BIJA_LEXICON.length).toBeGreaterThanOrEqual(15);
      expect(getAllBijaLexiconEntries().length).toBe(UNIFIED_BIJA_LEXICON.length);

      const syllables = ['oṃ', 'āḥ', 'hūṃ', 'hum', 'HUM', 'हूं', 'hrīḥ', 'hrih', 'krīṃ', 'krim', 'aiṃ', 'śrīṃ', 'bhrūṃ', 'phaṭ', 'svāhā'];
      for (const s of syllables) {
        const res = decipherBijaSyllable(s);
        expect(res.status).toBe('ok');
        expect(res.entries.length).toBeGreaterThan(0);
      }
    });

    it('deciphers compound multi-syllable mantra sequences and handles unknown tokens cleanly', () => {
      const seq = decipherBijaSyllable('oṃ āḥ hūṃ hrīḥ svāhā');
      expect(seq.status).toBe('ok');
      expect(seq.isSequence).toBe(true);
      expect(seq.entries.length).toBeGreaterThanOrEqual(5);

      const bad = decipherBijaSyllable('__NON_EXISTENT_XYZZY_99999__');
      expect(bad.status).toBe('not_found');
      expect(bad.entries).toHaveLength(0);
    });
  });

  describe('Suite 4 — Unified Multi-Script Search Engine (src/core/searchEngine.ts)', () => {
    it('spans >= 3 canonical databases for pan-Buddhist queries Avalokiteśvara and Uṣṇīṣavijayā', () => {
      const hitsAva = searchAllDatabases('Avalokiteśvara');
      const hitsUsn = searchAllDatabases('Uṣṇīṣavijayā');
      const dbsMatched = new Set([...hitsAva, ...hitsUsn].map((h) => h.dbId));
      expect(dbsMatched.size).toBeGreaterThanOrEqual(3);
    });

    it('strictly isolates results when options.dbId is provided', () => {
      const db1Hits = searchAllDatabases('svāhā', { dbId: 'db1_fangshan' });
      expect(db1Hits.length).toBeGreaterThan(0);
      for (const h of db1Hits) {
        expect(h.dbId).toBe('db1_fangshan');
      }

      const db4Hits = searchAllDatabases('svāhā', { dbId: 'db4_84000' });
      expect(db4Hits.length).toBeGreaterThan(0);
      for (const h of db4Hits) {
        expect(h.dbId).toBe('db4_84000');
      }
    });

    it('supports cross-script query equivalence (prajñā, प्रज्ञा, 般若, shes rab)', () => {
      for (const q of ['prajñā', 'प्रज्ञा', '般若', 'shes rab']) {
        const res = searchUnifiedCorpus(q);
        expect(res.results.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Suite 5 — Deterministic CLI (scripts/kosa-cli.mjs)', () => {
    it('executes all 8 CLI subcommands and returns valid JSON', () => {
      const commands = [
        ['stats', '--json'],
        ['dbs', '--json'],
        ['inspect', 'db1_fangshan', '--json'],
        ['search', 'svāhā', '--json'],
        ['concordance', 'Prajñāpāramitāhṛdaya', '--json'],
        ['phonetics', 'oṃ āḥ hūṃ', '--json'],
        ['bija', 'oṃ', '--json'],
        ['verify-all', '--json'],
      ];
      for (const args of commands) {
        const out = execFileSync(process.execPath, [CLI_PATH, ...args], {
          cwd: ROOT_DIR,
          encoding: 'utf8',
        });
        const parsed = JSON.parse(out);
        expect(parsed).toBeTypeOf('object');
      }
    });
  });

  describe('Suite 6 — React Web Application SSR & E2E Contract Verification', () => {
    it('renders App and all 6 scholarly workbenches via renderToStaticMarkup without errors', () => {
      const appHtml = renderToStaticMarkup(React.createElement(App));
      expect(appHtml).toContain('Sarva-Dhāraṇī-Kośa');
      expect(appHtml).toContain('db1_fangshan');
      expect(appHtml).toContain('db12_muktabodha_ochs');

      expect(renderToStaticMarkup(React.createElement(DatabaseHubExplorer)).length).toBeGreaterThan(200);
      expect(renderToStaticMarkup(React.createElement(MultiScriptDharaniReader)).length).toBeGreaterThan(200);
      expect(renderToStaticMarkup(React.createElement(FangshanTaishoInterlinearStudio)).length).toBeGreaterThan(200);
      expect(renderToStaticMarkup(React.createElement(ConcordanceParallelStudio)).length).toBeGreaterThan(200);
      expect(renderToStaticMarkup(React.createElement(CudlPalmLeafViewer)).length).toBeGreaterThan(200);
      expect(renderToStaticMarkup(React.createElement(SiddhamBijaAcademy)).length).toBeGreaterThan(200);
    });

    it('enforces zero placeholder/TODO/FIXME markers across all src/**/*.{ts,tsx} files', () => {
      const walk = (dir: string): string[] => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const files: string[] = [];
        for (const e of entries) {
          const full = path.join(dir, e.name);
          if (e.isDirectory()) files.push(...walk(full));
          else if (e.isFile() && (full.endsWith('.ts') || full.endsWith('.tsx'))) files.push(full);
        }
        return files;
      };
      const allSrcFiles = walk(path.join(ROOT_DIR, 'src'));
      expect(allSrcFiles.length).toBeGreaterThanOrEqual(10);
      for (const f of allSrcFiles) {
        const txt = fs.readFileSync(f, 'utf8');
        expect(txt).not.toMatch(/\bTODO\s*:/i);
        expect(txt).not.toMatch(/\bFIXME\s*:/i);
        expect(txt).not.toMatch(/\blorem ipsum\b/i);
      }
    });
  });
});
