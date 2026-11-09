import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
export const CLI_PATH = path.join(ROOT_DIR, 'scripts', 'kosa-cli.mjs');

export const CANONICAL_DB_IDS = [
  'db1_fangshan',
  'db2_taisho_ext',
  'db3_dsbc_gretil',
  'db4_84000',
  'db5_buddhanexus',
  'db6_sarit',
  'db7_cudl_hidas',
  'db8_polyglotta',
  'db9_rkts',
  'db10_all_nibs',
  'db11_idp_dunhuang',
  'db12_muktabodha_ochs',
];

export const ALL_FEATURES = [
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8',
  'F9', 'F10', 'F11', 'F12', 'F13', 'F14', 'F15', 'F16',
];

const cliCache = new Map();
const fileCache = new Map();
const dbCombinedCache = new Map();

/**
 * Checks whether a project-relative path exists on disk.
 */
export function fileExists(relPath) {
  return fs.existsSync(path.join(ROOT_DIR, relPath));
}

/**
 * Reads a project-relative UTF-8 text file with caching.
 */
export function readProjectFile(relPath) {
  if (fileCache.has(relPath)) return fileCache.get(relPath);
  const fullPath = path.join(ROOT_DIR, relPath);
  assert.ok(fs.existsSync(fullPath), `Expected project file to exist: ${relPath}`);
  const text = fs.readFileSync(fullPath, 'utf8');
  fileCache.set(relPath, text);
  return text;
}

/**
 * Reads a project-relative file if it exists, or returns empty string.
 */
export function readProjectFileOptional(relPath) {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(fullPath)) return '';
  if (fileCache.has(relPath)) return fileCache.get(relPath);
  try {
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) return '';
    const text = fs.readFileSync(fullPath, 'utf8');
    fileCache.set(relPath, text);
    return text;
  } catch {
    return '';
  }
}

/**
 * Reads and parses a JSON file from a project-relative path.
 */
export function readJsonFile(relPath) {
  const raw = readProjectFile(relPath);
  return JSON.parse(raw);
}

/**
 * Recursively finds files under a project-relative directory matching an optional predicate.
 */
export function findFilesRecursive(relDir, predicate = () => true) {
  const baseDir = path.join(ROOT_DIR, relDir);
  if (!fs.existsSync(baseDir)) return [];
  const results = [];
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.agents') {
        continue;
      }
      const abs = path.join(currentDir, entry.name);
      const rel = path.relative(ROOT_DIR, abs);
      if (entry.isDirectory()) {
        walk(abs);
      } else if (entry.isFile() && predicate(rel, abs)) {
        results.push(rel);
      }
    }
  }
  walk(baseDir);
  return results.sort();
}

/**
 * Executes `node scripts/kosa-cli.mjs <args>` with memoization.
 */
export function runKosaCli(args, { allowNonZero = false, useCache = true, timeout = 45000 } = {}) {
  const cacheKey = `${allowNonZero ? 'allow:' : 'strict:'}${JSON.stringify(args)}`;
  if (useCache && cliCache.has(cacheKey)) {
    return cliCache.get(cacheKey);
  }
  assert.ok(fs.existsSync(CLI_PATH), `Missing CLI script at ${CLI_PATH}`);
  try {
    const stdout = execFileSync(process.execPath, [CLI_PATH, ...args.map(String)], {
      cwd: ROOT_DIR,
      encoding: 'utf8',
      timeout,
      maxBuffer: 64 * 1024 * 1024,
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    });
    const result = { exitCode: 0, stdout: String(stdout || ''), stderr: '' };
    if (useCache) cliCache.set(cacheKey, result);
    return result;
  } catch (err) {
    const result = {
      exitCode: typeof err.status === 'number' ? err.status : 1,
      stdout: String(err.stdout || ''),
      stderr: String(err.stderr || err.message || ''),
    };
    if (!allowNonZero) {
      assert.fail(
        `CLI command failed: node scripts/kosa-cli.mjs ${args.join(' ')}\n` +
        `Exit Code: ${result.exitCode}\n` +
        `Stdout: ${result.stdout.slice(0, 800)}\n` +
        `Stderr: ${result.stderr.slice(0, 800)}`
      );
    }
    if (useCache) cliCache.set(cacheKey, result);
    return result;
  }
}

/**
 * Executes `node scripts/kosa-cli.mjs <args>` allowing non-zero exit codes (for negative/error tests).
 */
export function runKosaCliAllowError(args) {
  return runKosaCli(args, { allowNonZero: true, useCache: true });
}

/**
 * Resiliently parses JSON output from CLI stdout.
 */
export function parseJsonResilient(rawText, contextLabel = 'CLI JSON output') {
  const trimmed = String(rawText || '').trim();
  assert.ok(trimmed.length > 0, `Expected non-empty output for ${contextLabel}`);
  try {
    return JSON.parse(trimmed);
  } catch {
    const firstIdx = trimmed.search(/[\[{]/);
    const lastBrace = Math.max(trimmed.lastIndexOf('}'), trimmed.lastIndexOf(']'));
    if (firstIdx >= 0 && lastBrace > firstIdx) {
      try {
        return JSON.parse(trimmed.slice(firstIdx, lastBrace + 1));
      } catch {
        // Fall through to assertion failure
      }
    }
    assert.fail(`Failed to parse valid JSON from ${contextLabel}:\n${trimmed.slice(0, 800)}`);
  }
}

/**
 * Executes `node scripts/kosa-cli.mjs <args> --json` and parses the JSON response.
 */
export function runKosaCliJson(args, options = {}) {
  const finalArgs = args.includes('--json') ? [...args] : [...args, '--json'];
  const res = runKosaCli(finalArgs, options);
  if (options.allowNonZero && res.exitCode !== 0 && !res.stdout.trim()) {
    return { error: res.stderr || 'Non-zero exit', exitCode: res.exitCode };
  }
  return parseJsonResilient(res.stdout || res.stderr, `kosa-cli ${finalArgs.join(' ')}`);
}

/**
 * Serializes any value into a searchable string.
 */
export function stringifyDeep(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value) || '';
  } catch {
    return String(value);
  }
}

/**
 * Strips Sanskrit/Latin diacritics for fuzzy orthographic comparison when needed.
 */
export function stripDiacritics(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC');
}

/**
 * Asserts that `haystack` (string or object) contains all `needles` (case-insensitive NFC).
 */
export function assertContainsAll(haystack, needles, label = 'payload') {
  const raw = stringifyDeep(haystack);
  const norm = raw.toLowerCase().normalize('NFC');
  const normAscii = stripDiacritics(norm);
  for (const needle of needles) {
    const nNorm = String(needle).toLowerCase().normalize('NFC');
    const foundExact = norm.includes(nNorm);
    const foundAscii = normAscii.includes(stripDiacritics(nNorm));
    assert.ok(
      foundExact || foundAscii,
      `Expected ${label} to contain "${needle}". Snippet: ${raw.slice(0, 500)}`
    );
  }
}

/**
 * Asserts that `haystack` (string or object) contains at least one of `needles` (case-insensitive NFC).
 */
export function assertContainsAny(haystack, needles, label = 'payload') {
  const raw = stringifyDeep(haystack);
  const norm = raw.toLowerCase().normalize('NFC');
  const normAscii = stripDiacritics(norm);
  const matched = needles.some((needle) => {
    const nNorm = String(needle).toLowerCase().normalize('NFC');
    return norm.includes(nNorm) || normAscii.includes(stripDiacritics(nNorm));
  });
  assert.ok(
    matched,
    `Expected ${label} to contain at least one of [${needles.join(', ')}]. Snippet: ${raw.slice(0, 500)}`
  );
}

/**
 * Extracts an array of items from flexible CLI/module container shapes.
 */
export function unwrapList(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  const candidateKeys = [
    'records', 'items', 'results', 'databases', 'dbs', 'entries',
    'matches', 'hits', 'parallels', 'witnesses', 'dharanis', 'mantras',
    'works', 'texts', 'manuscripts', 'segments', 'glossary', 'editions',
    'stotras', 'books', 'chapters', 'lexicons', 'AlignedRows', 'alignedRows',
    'clusters', 'concordances', 'syllables', 'words', 'data',
  ];
  for (const key of candidateKeys) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  for (const subKey of ['data', 'corpus', 'database', 'record', 'result', 'summary']) {
    if (payload[subKey] && typeof payload[subKey] === 'object') {
      const nested = unwrapList(payload[subKey]);
      if (nested.length > 0) return nested;
    }
  }
  const arrayValues = Object.values(payload).filter(Array.isArray);
  if (arrayValues.length > 0) {
    return [...arrayValues].sort((a, b) => b.length - a.length)[0];
  }
  return [];
}

/**
 * Finds a specific database summary entry from `dbs --json` or `stats --json`.
 */
export function findDbEntry(dbsPayload, dbId, dbNum) {
  const list = unwrapList(dbsPayload);
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    if (
      item.id === dbId ||
      item.dbId === dbId ||
      item.databaseId === dbId ||
      (dbNum !== undefined && (item.number === dbNum || item.dbNumber === dbNum))
    ) {
      return item;
    }
  }
  if (dbsPayload && typeof dbsPayload === 'object') {
    if (dbsPayload[dbId]) return dbsPayload[dbId];
    for (const containerKey of ['databases', 'dbs', 'byId', 'summaries']) {
      if (dbsPayload[containerKey] && typeof dbsPayload[containerKey] === 'object') {
        if (dbsPayload[containerKey][dbId]) return dbsPayload[containerKey][dbId];
        const nested = findDbEntry(dbsPayload[containerKey], dbId, dbNum);
        if (nested) return nested;
      }
    }
  }
  return null;
}

/**
 * Extracts a numeric metric from an object by checking multiple candidate keys or nested objects.
 */
export function extractNumericMetric(obj, candidateKeys, fallbackMin = 0) {
  if (!obj || typeof obj !== 'object') return fallbackMin;
  for (const key of candidateKeys) {
    if (typeof obj[key] === 'number' && !Number.isNaN(obj[key])) {
      return obj[key];
    }
    if (Array.isArray(obj[key])) {
      return obj[key].length;
    }
  }
  for (const val of Object.values(obj)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      for (const key of candidateKeys) {
        if (typeof val[key] === 'number' && !Number.isNaN(val[key])) {
          return val[key];
        }
        if (Array.isArray(val[key])) {
          return val[key].length;
        }
      }
    }
  }
  return fallbackMin;
}

/**
 * Combines CLI `inspect <dbId> --json` output with physical generated data files for `<dbId>`
 * so tests verify both CLI contract compliance and rich corpus content.
 */
export function getDbCorpusCombined(dbId) {
  if (dbCombinedCache.has(dbId)) return dbCombinedCache.get(dbId);
  const cliPayload = runKosaCliJson(['inspect', dbId]);
  const parts = [stringifyDeep(cliPayload)];

  const isTier1 = ['db1_fangshan', 'db2_taisho_ext', 'db3_dsbc_gretil', 'db4_84000', 'db5_buddhanexus', 'db6_sarit'].includes(dbId);
  if (isTier1) {
    parts.push(readProjectFileOptional('src/data/generated/tier1Databases.ts'));
    parts.push(readProjectFileOptional('src/services/tier1CorpusService.ts'));
    for (const rel of findFilesRecursive('public/data/tier1', (r) => r.endsWith('.json'))) {
      parts.push(readProjectFileOptional(rel));
    }
  } else {
    parts.push(readProjectFileOptional('src/data/generated/tier23Databases.ts'));
    parts.push(readProjectFileOptional('src/services/tier23CorpusService.ts'));
    for (const rel of findFilesRecursive('public/data/tier23', (r) => r.endsWith('.json'))) {
      parts.push(readProjectFileOptional(rel));
    }
  }
  parts.push(readProjectFileOptional('src/data/unifiedCorpusRegistry.ts'));

  const combined = {
    cliPayload,
    combinedText: parts.filter(Boolean).join('\n'),
  };
  dbCombinedCache.set(dbId, combined);
  return combined;
}

/**
 * Inspects a specific record in a database via CLI, with resilient fallback to search + corpus inspection.
 */
export function inspectDbRecordResilient(dbId, recordId) {
  const direct = runKosaCliJson(['inspect', dbId, String(recordId)], { allowNonZero: true });
  const directStr = stringifyDeep(direct);
  const { cliPayload, combinedText } = getDbCorpusCombined(dbId);
  const searchRes = runKosaCliJson(['search', String(recordId), '--db', dbId], { allowNonZero: true });
  return {
    direct,
    cliPayload,
    searchRes,
    combinedText: `${directStr}\n${stringifyDeep(searchRes)}\n${combinedText}`,
  };
}

/**
 * Normalizes `node scripts/kosa-cli.mjs phonetics <text> --json` output into a consistent shape
 * while preserving the raw CLI output.
 */
export function runPhoneticsNormalized(inputText) {
  const raw = runKosaCliJson(['phonetics', inputText]);
  const root = (raw && typeof raw === 'object' && (raw.analysis || raw.lineAnalysis || raw.result || raw.data)) || raw;

  const normalizedIast =
    root.normalizedIast ?? root.iast ?? root.romanized ?? raw.normalizedIast ?? raw.iast ?? '';
  const slp1 =
    root.slp1 ?? raw.slp1 ?? '';
  const devanagari =
    root.devanagari ?? root.deva ?? raw.devanagari ?? '';
  const siddhamUnicode =
    root.siddhamUnicode ?? root.siddham ?? raw.siddhamUnicode ?? raw.siddham ?? '';

  const rawWords = Array.isArray(root.words)
    ? root.words
    : Array.isArray(raw.words)
      ? raw.words
      : [];

  const words = rawWords.map((w) => {
    const rawSyls = Array.isArray(w.syllables) ? w.syllables : [];
    const syllables = rawSyls.map((s) => {
      const wVal = String(s.weight ?? s.meter ?? s.chandas ?? '');
      const isGuru =
        wVal === 'Guru' ||
        wVal === 'guru' ||
        wVal === '—' ||
        wVal === '-' ||
        s.isGuru === true ||
        s.morae === 2;
      return {
        ...s,
        rawIast: s.rawIast ?? s.iast ?? s.syllable ?? s.text ?? '',
        slp1: s.slp1 ?? '',
        devanagari: s.devanagari ?? s.deva ?? '',
        siddhamUnicode: s.siddhamUnicode ?? s.siddham ?? '',
        modernPhonetic: s.modernPhonetic ?? s.modern ?? s.m ?? s.zhModern ?? '',
        tangReconstruction: s.tangReconstruction ?? s.tang ?? s.t ?? s.zhTang ?? '',
        weightNormalized: isGuru ? 'Guru' : 'Laghu',
        weightSymbol: isGuru ? '—' : '⏑',
        sandhiNotes: Array.isArray(s.sandhiNotes)
          ? s.sandhiNotes
          : Array.isArray(s.notes)
            ? s.notes
            : s.sandhiNote
              ? [String(s.sandhiNote)]
              : [],
      };
    });
    return {
      ...w,
      wordIast: w.wordIast ?? w.iast ?? w.word ?? '',
      syllables,
    };
  });

  const flatSyllables = words.flatMap((w) => w.syllables);

  return {
    raw,
    normalizedIast: String(normalizedIast),
    slp1: String(slp1),
    devanagari: String(devanagari),
    siddhamUnicode: String(siddhamUnicode),
    words,
    flatSyllables,
    rawText: stringifyDeep(raw),
  };
}
