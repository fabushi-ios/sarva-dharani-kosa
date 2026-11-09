#!/usr/bin/env node
/**
 * scripts/kosa-cli.mjs
 * Milestone 4 (Feature F16): Deterministic Philological & Corpus Verification CLI
 * Subcommands: stats | dbs | inspect | search | concordance | phonetics | bija | verify-all
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tsImport } from 'tsx/esm/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const VALID_SUBCOMMANDS = [
  'stats',
  'dbs',
  'inspect',
  'search',
  'concordance',
  'phonetics',
  'bija',
  'verify-all',
];

function parseCliArgs(argv) {
  const positional = [];
  let jsonFlag = false;
  let dbFilter = null;
  let limit = undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = String(argv[i]);
    if (arg === '--json' || arg === '-j') {
      jsonFlag = true;
    } else if (arg === '--db' || arg === '-d') {
      if (i + 1 < argv.length) {
        dbFilter = String(argv[++i]);
      }
    } else if (arg.startsWith('--db=')) {
      dbFilter = arg.slice('--db='.length);
    } else if (arg === '--limit' || arg === '-l') {
      if (i + 1 < argv.length) {
        const parsed = parseInt(String(argv[++i]), 10);
        if (!Number.isNaN(parsed) && parsed > 0) limit = parsed;
      }
    } else if (arg.startsWith('--limit=')) {
      const parsed = parseInt(arg.slice('--limit='.length), 10);
      if (!Number.isNaN(parsed) && parsed > 0) limit = parsed;
    } else if (arg === '--help' || arg === '-h') {
      positional.push('help');
    } else {
      positional.push(arg);
    }
  }

  return {
    subcommand: positional[0] ? positional[0].toLowerCase() : 'stats',
    args: positional.slice(1),
    jsonFlag,
    dbFilter,
    limit,
  };
}

function outputJson(payload, exitCode = 0) {
  const text = `${JSON.stringify(payload, null, 2)}\n`;
  process.exitCode = exitCode;
  process.stdout.write(text, () => {
    process.exit(exitCode);
  });
}

async function main() {
  const { subcommand, args, dbFilter, limit } = parseCliArgs(process.argv.slice(2));

  switch (subcommand) {
    case 'phonetics': {
      const prosodyMod = await tsImport(
        path.join(ROOT_DIR, 'src/core/prosody.ts'),
        import.meta.url
      );
      const text = args.join(' ').trim();
      const analysis = prosodyMod.analyzeSanskritLine(text, {
        mode: 'smart',
        assimilate: true,
      });
      outputJson(analysis, 0);
      break;
    }

    case 'stats': {
      const registryMod = await tsImport(
        path.join(ROOT_DIR, 'src/data/unifiedCorpusRegistry.ts'),
        import.meta.url
      );
      const stats = registryMod.getUnifiedSystemStats();
      outputJson(stats, 0);
      break;
    }

    case 'dbs': {
      const registryMod = await tsImport(
        path.join(ROOT_DIR, 'src/data/unifiedCorpusRegistry.ts'),
        import.meta.url
      );
      const dbs = registryMod.UNIFIED_12_DATABASES;
      outputJson(
        {
          totalDatabases: dbs.length,
          databases: dbs,
          dbs,
        },
        0
      );
      break;
    }

    case 'inspect': {
      const registryMod = await tsImport(
        path.join(ROOT_DIR, 'src/data/unifiedCorpusRegistry.ts'),
        import.meta.url
      );
      const dbIdOrNum = args[0];
      const recordId = args.slice(1).join(' ').trim() || undefined;
      if (!dbIdOrNum) {
        outputJson(
          {
            error: 'Missing database ID or number (1..12) for inspect subcommand',
            validDatabaseIds: registryMod.CANONICAL_DATABASE_IDS,
            results: [],
          },
          1
        );
        return;
      }

      const resolvedDb = registryMod.resolveDatabaseId(dbIdOrNum);
      if (!resolvedDb) {
        outputJson(
          {
            error: `Unknown database ID: ${dbIdOrNum}`,
            validDatabaseIds: registryMod.CANONICAL_DATABASE_IDS,
            results: [],
          },
          1
        );
        return;
      }

      const result = registryMod.inspectDatabaseRecords(resolvedDb, recordId);
      if (!result || result.error) {
        outputJson(
          result || {
            error: `Record not found: ${recordId || ''}`,
            dbId: resolvedDb,
            recordId: recordId || null,
            records: [],
          },
          1
        );
        return;
      }

      outputJson(result, 0);
      break;
    }

    case 'search': {
      const searchMod = await tsImport(
        path.join(ROOT_DIR, 'src/core/searchEngine.ts'),
        import.meta.url
      );
      const registryMod = await tsImport(
        path.join(ROOT_DIR, 'src/data/unifiedCorpusRegistry.ts'),
        import.meta.url
      );
      const query = args.join(' ').trim();
      if (dbFilter && dbFilter.toLowerCase() !== 'baseline') {
        const resolvedDb = registryMod.resolveDatabaseId(dbFilter);
        if (!resolvedDb) {
          outputJson(
            {
              error: `Unknown database filter: ${dbFilter}`,
              validDatabaseIds: registryMod.CANONICAL_DATABASE_IDS,
              query,
              count: 0,
              results: [],
            },
            1
          );
          return;
        }
      }

      const searchResult = searchMod.searchUnifiedCorpus(query, {
        dbId: dbFilter || undefined,
        limit,
      });

      if (searchResult.results.length === 0) {
        outputJson(
          {
            query,
            dbFilter: dbFilter || null,
            count: 0,
            totalHits: 0,
            results: [],
          },
          0
        );
        return;
      }

      outputJson(searchResult, 0);
      break;
    }

    case 'concordance': {
      const concordanceMod = await tsImport(
        path.join(ROOT_DIR, 'src/core/concordanceEngine.ts'),
        import.meta.url
      );
      const query = args.join(' ').trim();
      const result = concordanceMod.resolveCanonicalConcordance(query);
      outputJson(result, 0);
      break;
    }

    case 'bija': {
      const bijaMod = await tsImport(
        path.join(ROOT_DIR, 'src/core/bijaLexiconEngine.ts'),
        import.meta.url
      );
      const query = args.join(' ').trim();
      const result = bijaMod.decipherBijaSyllable(query);
      outputJson(result, 0);
      break;
    }

    case 'verify-all': {
      const registryMod = await tsImport(
        path.join(ROOT_DIR, 'src/data/unifiedCorpusRegistry.ts'),
        import.meta.url
      );
      const verification = registryMod.verifyAllDatabasesIntegrity();
      outputJson(verification, verification.valid ? 0 : 1);
      break;
    }

    case 'help': {
      outputJson(
        {
          cli: 'kosa-cli.mjs',
          subcommands: VALID_SUBCOMMANDS,
          usage: 'node scripts/kosa-cli.mjs <subcommand> [args...] [--db <dbId>] [--json]',
        },
        0
      );
      break;
    }

    default: {
      outputJson(
        {
          error: `Unknown subcommand: ${subcommand}`,
          validSubcommands: VALID_SUBCOMMANDS,
          results: [],
        },
        1
      );
      break;
    }
  }
}

main().catch((err) => {
  outputJson(
    {
      error: err instanceof Error ? err.message : String(err),
      results: [],
    },
    1
  );
});
