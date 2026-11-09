#!/usr/bin/env node
import assert from 'node:assert/strict';
import { ALL_FEATURES } from './helpers/harness.mjs';
import { TIER1_TESTS } from './tier1-feature-coverage.mjs';
import { TIER2_TESTS } from './tier2-boundary-corner.mjs';
import { TIER3_TESTS } from './tier3-cross-feature.mjs';
import { TIER4_TESTS } from './tier4-real-world-scenarios.mjs';
import { TIER5_TESTS } from './tier5-adversarial.mjs';

const ALL_TIERS = [
  { tier: 1, name: 'Tier 1: Feature Coverage (Happy Path)', tests: TIER1_TESTS },
  { tier: 2, name: 'Tier 2: Boundary & Orthographic Corner Cases', tests: TIER2_TESTS },
  { tier: 3, name: 'Tier 3: Cross-Feature Combinations', tests: TIER3_TESTS },
  { tier: 4, name: 'Tier 4: Real-World Application Scenarios', tests: TIER4_TESTS },
  { tier: 5, name: 'Tier 5: Adversarial Coverage Hardening', tests: TIER5_TESTS },
];

function parseCliArgs(argv) {
  const opts = {
    validateSuite: false,
    json: false,
    tier: null,
    feature: null,
    id: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--validate-suite') {
      opts.validateSuite = true;
    } else if (arg === '--json') {
      opts.json = true;
    } else if (arg === '--all') {
      opts.tier = null;
    } else if (arg === '--tier' && i + 1 < argv.length) {
      opts.tier = Number(argv[++i]);
    } else if (arg.startsWith('--tier=')) {
      opts.tier = Number(arg.split('=')[1]);
    } else if (arg === '--feature' && i + 1 < argv.length) {
      opts.feature = argv[++i].toUpperCase();
    } else if (arg.startsWith('--feature=')) {
      opts.feature = arg.split('=')[1].toUpperCase();
    } else if (arg === '--id' && i + 1 < argv.length) {
      opts.id = argv[++i];
    } else if (arg.startsWith('--id=')) {
      opts.id = arg.split('=')[1];
    }
  }
  return opts;
}

function getFeaturesForTest(test) {
  if (Array.isArray(test.features)) return test.features;
  if (typeof test.feature === 'string') return [test.feature];
  return [];
}

function validateSuiteStructure(opts) {
  const errors = [];
  const allTests = [
    ...TIER1_TESTS,
    ...TIER2_TESTS,
    ...TIER3_TESTS,
    ...TIER4_TESTS,
    ...TIER5_TESTS,
  ];

  // 1. Unique IDs & Genuine Executable Test Functions
  const seenIds = new Set();
  for (const t of allTests) {
    if (!t.id || typeof t.id !== 'string') {
      errors.push(`Test missing valid id: ${JSON.stringify(t)}`);
    } else if (seenIds.has(t.id)) {
      errors.push(`Duplicate test ID detected: ${t.id}`);
    } else {
      seenIds.add(t.id);
    }

    if (!t.title || typeof t.title !== 'string' || t.title.trim().length < 5) {
      errors.push(`Test ${t.id} missing descriptive title`);
    }

    if (typeof t.run !== 'function') {
      errors.push(`Test ${t.id} missing executable run() function`);
    } else {
      const fnSource = t.run.toString();
      const hasRealAssertion =
        /assert\.|assertContains|runKosaCli|getDbCorpusCombined|inspectDbRecordResilient|runPhoneticsNormalized/.test(
          fnSource
        );
      const hasDummyStub = /assert(?:\.ok)?\(\s*true\s*\)/.test(fnSource);
      if (!hasRealAssertion) {
        errors.push(`Test ${t.id} run() lacks genuine assertion or harness calls`);
      }
      if (hasDummyStub) {
        errors.push(`Test ${t.id} contains forbidden dummy assert(true) stub`);
      }
    }
  }

  // 2. Per-feature counts for Tier 1 and Tier 2
  const featureMatrix = {};
  for (const f of ALL_FEATURES) {
    const t1Count = TIER1_TESTS.filter((t) => t.feature === f).length;
    const t2Count = TIER2_TESTS.filter((t) => t.feature === f).length;
    const t3Count = TIER3_TESTS.filter((t) => getFeaturesForTest(t).includes(f)).length;
    const t4Count = TIER4_TESTS.filter((t) => getFeaturesForTest(t).includes(f)).length;
    featureMatrix[f] = {
      tier1: t1Count,
      tier2: t2Count,
      tier3: t3Count,
      tier4: t4Count,
      total: t1Count + t2Count + t3Count + t4Count,
    };
    if (t1Count < 5) {
      errors.push(`Feature ${f} has only ${t1Count} Tier 1 tests (minimum required: 5)`);
    }
    if (t2Count < 5) {
      errors.push(`Feature ${f} has only ${t2Count} Tier 2 tests (minimum required: 5)`);
    }
    if (t3Count < 1) {
      errors.push(`Feature ${f} is not covered by any Tier 3 cross-feature test`);
    }
  }

  // 3. Tier totals
  if (TIER1_TESTS.length < 80) {
    errors.push(`Tier 1 has ${TIER1_TESTS.length} tests (minimum required: 80)`);
  }
  if (TIER2_TESTS.length < 80) {
    errors.push(`Tier 2 has ${TIER2_TESTS.length} tests (minimum required: 80)`);
  }
  if (TIER3_TESTS.length < 20) {
    errors.push(`Tier 3 has ${TIER3_TESTS.length} tests (minimum required: 20)`);
  }
  if (TIER4_TESTS.length < 10) {
    errors.push(`Tier 4 has ${TIER4_TESTS.length} tests (minimum required: 10)`);
  }

  const totalTiers1To4 =
    TIER1_TESTS.length + TIER2_TESTS.length + TIER3_TESTS.length + TIER4_TESTS.length;
  if (totalTiers1To4 < 190) {
    errors.push(`Total Tiers 1–4 tests is ${totalTiers1To4} (minimum required: 190)`);
  }

  const summary = {
    valid: errors.length === 0,
    featureCount: ALL_FEATURES.length,
    tierCounts: {
      tier1: TIER1_TESTS.length,
      tier2: TIER2_TESTS.length,
      tier3: TIER3_TESTS.length,
      tier4: TIER4_TESTS.length,
      tier5: TIER5_TESTS.length,
      totalTiers1To4,
      totalAll: allTests.length,
    },
    featureMatrix,
    errors,
  };

  if (opts.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log('================================================================================');
    console.log(' 梵音宝典 · Sarva-Dhāraṇī-Kośa — E2E Test Suite Validation (--validate-suite)');
    console.log('================================================================================');
    console.log(`  Features Covered (N) : ${summary.featureCount} (F1..F16)`);
    console.log(`  Tier 1 (Feature)     : ${summary.tierCounts.tier1} tests (min 80, >= 5/feature)`);
    console.log(`  Tier 2 (Boundary)    : ${summary.tierCounts.tier2} tests (min 80, >= 5/feature)`);
    console.log(`  Tier 3 (Cross-Feat)  : ${summary.tierCounts.tier3} tests (min 20)`);
    console.log(`  Tier 4 (Real-World)  : ${summary.tierCounts.tier4} tests (min 10)`);
    console.log(`  Tier 5 (Adversarial) : ${summary.tierCounts.tier5} tests (M5 Phase 2 hook)`);
    console.log(`  Total (Tiers 1–4)    : ${summary.tierCounts.totalTiers1To4} executable E2E tests`);
    console.log('--------------------------------------------------------------------------------');
    for (const f of ALL_FEATURES) {
      const m = featureMatrix[f];
      console.log(
        `  ${f.padEnd(4)} | T1: ${String(m.tier1).padStart(2)} | T2: ${String(m.tier2).padStart(2)} | T3: ${String(m.tier3).padStart(2)} | T4: ${String(m.tier4).padStart(2)} | Total: ${String(m.total).padStart(2)}`
      );
    }
    console.log('--------------------------------------------------------------------------------');
    if (summary.valid) {
      console.log('  [SUITE VALIDATION PASSED] 100% of structural & anti-stub checks succeeded.');
    } else {
      console.error('  [SUITE VALIDATION FAILED]');
      for (const e of errors) {
        console.error(`    - ${e}`);
      }
    }
    console.log('================================================================================');
  }

  assert.equal(errors.length, 0, `Suite validation failed with ${errors.length} error(s)`);
}

async function runSelectedTests(opts) {
  let selectedTiers = ALL_TIERS;
  if (opts.tier !== null) {
    selectedTiers = ALL_TIERS.filter((t) => t.tier === opts.tier);
    if (selectedTiers.length === 0) {
      console.error(`Invalid --tier ${opts.tier}. Expected 1, 2, 3, 4, or 5.`);
      process.exit(1);
    }
  }

  const results = [];
  let passed = 0;
  let failed = 0;
  const startAll = Date.now();

  if (!opts.json) {
    console.log('================================================================================');
    console.log(' 梵音宝典 · Sarva-Dhāraṇī-Kośa — Executing 4-Tier Opaque-Box E2E Test Suite');
    console.log('================================================================================');
  }

  for (const tierGroup of selectedTiers) {
    let tierTests = tierGroup.tests;
    if (opts.feature) {
      tierTests = tierTests.filter((t) => getFeaturesForTest(t).includes(opts.feature));
    }
    if (opts.id) {
      tierTests = tierTests.filter((t) => t.id === opts.id);
    }
    if (tierTests.length === 0) continue;

    if (!opts.json) {
      console.log(`\n--- ${tierGroup.name} (${tierTests.length} tests) ---`);
    }

    for (const test of tierTests) {
      const t0 = Date.now();
      try {
        await test.run();
        const durationMs = Date.now() - t0;
        passed++;
        results.push({
          id: test.id,
          tier: test.tier,
          features: getFeaturesForTest(test),
          title: test.title,
          status: 'PASS',
          durationMs,
        });
        if (!opts.json) {
          console.log(`  [PASS] ${test.id} (${durationMs}ms): ${test.title}`);
        }
      } catch (err) {
        const durationMs = Date.now() - t0;
        failed++;
        const errMsg = err instanceof Error ? err.message : String(err);
        results.push({
          id: test.id,
          tier: test.tier,
          features: getFeaturesForTest(test),
          title: test.title,
          status: 'FAIL',
          durationMs,
          error: errMsg,
        });
        if (!opts.json) {
          console.error(`  [FAIL] ${test.id} (${durationMs}ms): ${test.title}`);
          console.error(`         ${errMsg.split('\n')[0]}`);
        }
      }
    }
  }

  const totalDurationMs = Date.now() - startAll;
  const runSummary = {
    passed,
    failed,
    total: passed + failed,
    passRate: passed + failed > 0 ? `${((passed / (passed + failed)) * 100).toFixed(2)}%` : '100.00%',
    durationMs: totalDurationMs,
    results,
  };

  if (opts.json) {
    console.log(JSON.stringify(runSummary, null, 2));
  } else {
    console.log('\n================================================================================');
    console.log(
      ` E2E Summary: ${passed}/${passed + failed} passed (${runSummary.passRate}) in ${totalDurationMs}ms | Failed: ${failed}`
    );
    console.log('================================================================================');
  }

  if (failed > 0) {
    process.exit(1);
  }
}

async function main() {
  const opts = parseCliArgs(process.argv.slice(2));
  if (opts.validateSuite) {
    validateSuiteStructure(opts);
    return;
  }
  await runSelectedTests(opts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
