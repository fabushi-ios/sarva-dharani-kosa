#!/usr/bin/env python3
"""Opaque-Box E2E Test Suite Runner for Sanskrit Phonetic Engine v3.0 & Sarva-Dhāraṇī-Kośa.

Usage:
  python3 /home/antigravity/tests/e2e/run_e2e_tests.py
  python3 /home/antigravity/tests/e2e/run_e2e_tests.py --tier 1
  python3 /home/antigravity/tests/e2e/run_e2e_tests.py --tier 2
  python3 /home/antigravity/tests/e2e/run_e2e_tests.py --tier 3
  python3 /home/antigravity/tests/e2e/run_e2e_tests.py --tier 4
  python3 /home/antigravity/tests/e2e/run_e2e_tests.py --collect-only
"""

from __future__ import annotations

import argparse
import subprocess
import sys
import time
from pathlib import Path
from typing import Dict, List

E2E_DIR = Path(__file__).resolve().parent

TIER_PATHS: Dict[str, Path] = {
    "1": E2E_DIR / "tier1_feature_coverage",
    "2": E2E_DIR / "tier2_boundary_corner",
    "3": E2E_DIR / "tier3_cross_feature",
    "4": E2E_DIR / "tier4_real_world",
    "5": E2E_DIR / "tier5_adversarial",
}

TIER_NAMES: Dict[str, str] = {
    "1": "Tier 1: Feature Coverage (F1-F8)",
    "2": "Tier 2: Boundary & Corner Cases (F1-F8)",
    "3": "Tier 3: Cross-Feature Combinations",
    "4": "Tier 4: Real-World User Scenarios",
    "5": "Tier 5: White-Box Adversarial Hardening",
}


def run_tier(tier_key: str, collect_only: bool = False, extra_args: List[str] | None = None) -> int:
    tier_path = TIER_PATHS[tier_key]
    if not tier_path.exists():
        return 0
    test_files = list(tier_path.glob("test_*.py"))
    if not test_files:
        return 0

    cmd = [sys.executable, "-m", "pytest", str(tier_path), "-v"]
    if collect_only:
        cmd.append("--collect-only")
    if extra_args:
        cmd.extend(extra_args)

    print(f"\n{'=' * 78}")
    print(f"Running {TIER_NAMES.get(tier_key, f'Tier {tier_key}')} -> {tier_path}")
    print(f"{'=' * 78}")
    start = time.time()
    proc = subprocess.run(cmd)
    elapsed = time.time() - start
    status = "PASSED" if proc.returncode == 0 else f"FAILED (exit {proc.returncode})"
    print(f"[{TIER_NAMES.get(tier_key, tier_key)}] {status} in {elapsed:.2f}s")
    return proc.returncode


def main() -> int:
    parser = argparse.ArgumentParser(description="Run E2E Test Suite (Tiers 1-4/5)")
    parser.add_argument(
        "--tier",
        choices=["1", "2", "3", "4", "5", "all"],
        default="all",
        help="Select which test tier to run (default: all)",
    )
    parser.add_argument(
        "--collect-only",
        action="store_true",
        help="Only collect tests without executing them",
    )
    args, unknown = parser.parse_known_args()

    selected_tiers = ["1", "2", "3", "4"] if args.tier == "all" else [args.tier]
    if args.tier == "all" and (TIER_PATHS["5"].exists() and list(TIER_PATHS["5"].glob("test_*.py"))):
        selected_tiers.append("5")

    results: Dict[str, int] = {}
    overall_start = time.time()
    for t in selected_tiers:
        results[t] = run_tier(t, collect_only=args.collect_only, extra_args=unknown)

    total_elapsed = time.time() - overall_start
    print(f"\n{'=' * 78}")
    print("E2E TEST SUITE SUMMARY")
    print(f"{'=' * 78}")
    any_failed = False
    for t, code in results.items():
        badge = "PASS" if code == 0 else f"FAIL ({code})"
        if code != 0:
            any_failed = True
        print(f"  {TIER_NAMES.get(t, t):45s} : {badge}")
    print(f"{'-' * 78}")
    print(f"Total Elapsed: {total_elapsed:.2f}s")
    print(f"{'=' * 78}")
    return 1 if any_failed else 0


if __name__ == "__main__":
    sys.exit(main())
