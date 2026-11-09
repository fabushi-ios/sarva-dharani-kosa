"""
Tier 5 White-Box Adversarial Test Suite — Frontend, 34×14 Matrix & Cross-App Stress Verification
(`tests/e2e/tier5_adversarial/test_tier5_frontend_and_matrix.py`)

Authoritative Challenger 2 (`challenger_m4_2`) verification suite covering:
1. 100% of the 34×14 = 476 CV cells + 34 bare Virāma cells + 16 Svaras + 28 `SYLLABLE_OVERRIDES`
   (554 interactive cells, 553 unique SLP1 keys) + 14 extra `kṣ`/`jñ` forms + 39 corpus compound
   syllables + 68 `CaM`/`CaH` syllables across both `sanskrit_phonetic_engine.html` v3.0 and
   `Sarva-Dhāraṇī-Kośa` (`SanskritPhoneticsAcademy.tsx` & `transliterator.ts`), mapping to valid,
   non-silent 48,000 Hz slices in `siddham_sprite_manifest.json` and `siddham_sprite_48k.wav`.
2. Multi-script conversion parity (Devanāgarī ↔ IAST ↔ SLP1 ↔ Siddhaṃ `U+11580–U+115FF`) and
   adversarial mixed-script / Vedic accent / ZWNJ / Avagraha / rough-English handling.
3. Anusvāra (`ṃ` / `M`) contextual assimilation across all 5 Vargas (`ṅ [ŋ], ñ [ɲ], ṇ [ɳ], n [n̪], m [m]`).
4. Visarga (`ḥ` / `H`) vowel echo across all 6 vowel timbres (`aḥ, iḥ, uḥ, eḥ, oḥ, ṛḥ`) and acoustic tail energy.
5. `playSingleSyllable` / `speakSanskrit` and `sanskritAudioEngine.ts` Promise resolution & frame-exact
   `syllableTimings` monotonicity against both Plan 3 48kHz Sprite and Plan 1 `/api/tts` live services.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List

import httpx
import numpy as np
import pytest

WORKSPACE_ROOT = Path("/home/antigravity")
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))
if str(WORKSPACE_ROOT / "tests" / "e2e") not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT / "tests" / "e2e"))

from e2e_helpers import (
    BACKEND_URL,
    CANONICAL_14_MATRIX_VOWELS,
    CANONICAL_16_SVARAS,
    CANONICAL_28_OVERRIDES,
    CANONICAL_34_CONSONANTS,
    CANONICAL_CORPUS_COMPOUND_SYLLABLES,
    CANONICAL_KZ_JY_EXTRA,
    FRONTEND_URL,
    PUBLIC_ENGINE_HTML,
    ROOT_ENGINE_HTML,
    SPRITE_MANIFEST_PATH,
    SPRITE_WAV_PATH,
    decode_base64_wav,
    load_sprite_manifest,
    run_engine_js,
    slice_sprite_wav,
)


def _run_ts_bundle(entry_ts_code: str) -> Any:
    """Bundle TypeScript code importing from `src/` via esbuild and execute in Node.js."""
    node_runner = r"""
const esbuild = require('esbuild');
const entryCode = process.env.TS_ENTRY_CODE;
const bundle = esbuild.buildSync({
  stdin: {
    contents: entryCode,
    resolveDir: '/home/antigravity',
    loader: 'tsx',
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
});
const mod = { exports: {} };
const fn = new Function('exports', 'require', 'module', bundle.outputFiles[0].text);
fn(mod.exports, require, mod);
Promise.resolve(mod.exports.default ? mod.exports.default() : mod.exports).then(res => {
  process.stdout.write(JSON.stringify({ ok: true, result: res }));
}).catch(err => {
  process.stdout.write(JSON.stringify({ ok: false, error: String(err && err.stack || err) }));
  process.exit(1);
});
"""
    env = dict(**subprocess.os.environ)
    env["TS_ENTRY_CODE"] = entry_ts_code
    proc = subprocess.run(
        ["node", "-e", node_runner],
        cwd=str(WORKSPACE_ROOT),
        capture_output=True,
        text=True,
        env=env,
        timeout=30,
    )
    assert proc.returncode == 0, (
        f"TS bundle execution failed (exit {proc.returncode}):\n"
        f"STDOUT: {proc.stdout}\nSTDERR: {proc.stderr}"
    )
    payload = json.loads(proc.stdout)
    assert payload.get("ok") is True, f"TS runtime error: {payload.get('error')}"
    return payload.get("result")


# ============================================================================
# 1. Exhaustive 34×14 Matrix + 34 Virāma + 16 Svaras + 28 Overrides Verification
# ============================================================================


def test_t5_fm_01_engine_html_and_academy_tsx_matrix_inventory_exact_parity() -> None:
    """Verify 100% inventory parity of 34×14 CV + 34 Virāma + 16 Svaras + 28 Overrides across both apps."""
    assert ROOT_ENGINE_HTML.read_text(encoding="utf-8") == PUBLIC_ENGINE_HTML.read_text(
        encoding="utf-8"
    ), "Root and public/ sanskrit_phonetic_engine.html must be byte-for-byte identical"

    html_inv = run_engine_js("""
      window.buildPhonemeMatrixModal();
      const modalHtml = document.getElementById('matrixModalBody').innerHTML;
      const buttonSlp1s = [...modalHtml.matchAll(/data-slp1="([^"]+)"/g)].map(m => m[1]);
      const onclickSlp1s = [...modalHtml.matchAll(/playSingleSyllable\\('([^']+)'/g)].map(m => m[1]);
      return {
        consKeys: Object.keys(window.CONS_MATRIX),
        vowelKeys: Object.keys(window.VOWEL_MAP),
        overrideKeys: Object.keys(window.SYLLABLE_OVERRIDES),
        buttonSlp1s,
        onclickSlp1s,
      };
    """)

    ts_inv = _run_ts_bundle("""
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import {
        CANONICAL_14_VOWEL_KEYS,
        CANONICAL_16_SVARAS,
        CANONICAL_34_CONSONANT_KEYS,
        SYLLABLE_OVERRIDES,
      } from './src/core/transliterator';
      import { SanskritPhoneticsAcademy } from './src/components/SanskritPhoneticsAcademy';

      export default function() {
        const html = renderToStaticMarkup(React.createElement(SanskritPhoneticsAcademy));
        const dataSlp1s = [...html.matchAll(/data-slp1="([^"]+)"/g)].map(m => m[1]);
        return {
          consKeys: CANONICAL_34_CONSONANT_KEYS,
          vowelKeys: CANONICAL_14_VOWEL_KEYS,
          svaraKeys: CANONICAL_16_SVARAS.map(s => s.slp1),
          overrideKeys: Object.keys(SYLLABLE_OVERRIDES),
          academyButtonSlp1s: dataSlp1s,
        };
      }
    """)

    assert html_inv["consKeys"] == CANONICAL_34_CONSONANTS
    assert ts_inv["consKeys"] == CANONICAL_34_CONSONANTS
    assert html_inv["vowelKeys"] == CANONICAL_14_MATRIX_VOWELS
    assert ts_inv["vowelKeys"] == CANONICAL_14_MATRIX_VOWELS
    assert ts_inv["svaraKeys"] == CANONICAL_16_SVARAS
    assert html_inv["overrideKeys"] == CANONICAL_28_OVERRIDES
    assert ts_inv["overrideKeys"] == CANONICAL_28_OVERRIDES

    # 16 Svaras + 28 Overrides + 34 Virāma + 476 CV = 554 interactive buttons
    assert len(html_inv["buttonSlp1s"]) == 554
    assert html_inv["buttonSlp1s"] == html_inv["onclickSlp1s"]
    assert len(ts_inv["academyButtonSlp1s"]) == 554
    assert set(html_inv["buttonSlp1s"]) == set(ts_inv["academyButtonSlp1s"])

    expected_553_unique = set(
        CANONICAL_16_SVARAS
        + CANONICAL_28_OVERRIDES
        + CANONICAL_34_CONSONANTS
        + [f"{c}{v}" for c in CANONICAL_34_CONSONANTS for v in CANONICAL_14_MATRIX_VOWELS]
    )
    assert len(expected_553_unique) == 553  # 'hA' is shared between Overrides and h+A
    assert set(html_inv["buttonSlp1s"]) == expected_553_unique
    assert set(ts_inv["academyButtonSlp1s"]) == expected_553_unique


def test_t5_fm_02_all_553_matrix_and_override_slices_in_manifest_and_48khz_wav_non_silent() -> None:
    """Verify 100% of 476 CV + 34 Virāma + 16 Svaras + 28 Overrides + corpus slices are valid 48kHz audio."""
    manifest = load_sprite_manifest(SPRITE_MANIFEST_PATH)
    assert manifest["sampleRate"] == 48000
    sprites = manifest["sprites"]
    assert len(sprites) >= 650

    required_keys: List[str] = []
    # 1. 16 Svaras
    required_keys.extend(CANONICAL_16_SVARAS)
    # 2. 476 CV cells (34 consonants × 14 vowels)
    for c in CANONICAL_34_CONSONANTS:
        for v in CANONICAL_14_MATRIX_VOWELS:
            required_keys.append(f"{c}{v}")
    # 3. 34 bare Virāma cells
    required_keys.extend(CANONICAL_34_CONSONANTS)
    # 4. 28 SYLLABLE_OVERRIDES
    required_keys.extend(CANONICAL_28_OVERRIDES)
    # 5. 14 extra kṣ / jñ vowel combinations
    required_keys.extend(CANONICAL_KZ_JY_EXTRA)
    # 6. 39 corpus compound syllables + 68 CaM/CaH syllables
    required_keys.extend(CANONICAL_CORPUS_COMPOUND_SYLLABLES)
    for c in CANONICAL_34_CONSONANTS:
        required_keys.append(f"{c}aM")
        required_keys.append(f"{c}aH")

    unique_required = list(dict.fromkeys(required_keys))
    assert len(unique_required) == 669
    assert len(sprites) == 675

    # Verify every key in manifest["sprites"] and in physical 48,000 Hz WAV
    all_keys_to_verify = list(dict.fromkeys(unique_required + list(sprites.keys())))
    failures: List[str] = []

    for key in all_keys_to_verify:
        if key not in sprites:
            failures.append(f"Missing key in manifest: {key}")
            continue
        entry = sprites[key]
        offset = float(entry["offset"])
        duration = float(entry["duration"])
        if offset < 0 or duration < 0.045:
            failures.append(f"Invalid offset/duration for {key}: offset={offset}, duration={duration}")
            continue

        metrics = slice_sprite_wav(offset, duration, SPRITE_WAV_PATH)
        if metrics["sample_rate"] != 48000:
            failures.append(f"Wrong sample_rate for {key}: {metrics['sample_rate']}")
        if metrics["has_nan_or_inf"]:
            failures.append(f"NaN/Inf in WAV slice for {key}")
        if metrics["rms"] < 0.008:
            failures.append(f"Near-silent WAV slice for {key}: rms={metrics['rms']:.5f}")
        if metrics["peak"] < 0.05 or metrics["peak"] > 1.0001:
            failures.append(f"Invalid peak for {key}: peak={metrics['peak']:.4f}")
        if abs(metrics["dc_offset"]) > 0.04:
            failures.append(f"Excessive DC offset for {key}: dc={metrics['dc_offset']:.4f}")

    assert not failures, f"Found {len(failures)} sprite slice failures:\n" + "\n".join(failures[:25])


def test_t5_fm_03_virama_vs_inherent_a_and_laghu_vs_guru_duration_laws_across_matrix() -> None:
    """Verify Virāma plosive burst < inherent 'a' CV duration and Laghu < Guru across all 34 consonants."""
    manifest = load_sprite_manifest(SPRITE_MANIFEST_PATH)
    sprites = manifest["sprites"]

    short_vowels = ["a", "i", "u", "f", "x"]
    long_vowels = ["A", "I", "U", "F", "X", "e", "E", "o", "O"]
    vowel_pairs = [("a", "A"), ("i", "I"), ("u", "U"), ("f", "F"), ("x", "X")]

    for c in CANONICAL_34_CONSONANTS:
        virama_entry = sprites[c]
        ca_entry = sprites[f"{c}a"]
        assert 0.045 <= virama_entry["duration"] <= 0.135, (
            f"Bare Virāma {c} duration {virama_entry['duration']}s outside plosive burst window"
        )
        assert ca_entry["duration"] >= 0.16, (
            f"Inherent-a syllable {c}a duration {ca_entry['duration']}s too short (schwa deletion risk)"
        )
        assert virama_entry["duration"] < ca_entry["duration"] * 0.65, (
            f"Bare Virāma {c} ({virama_entry['duration']}s) must be significantly shorter than {c}a ({ca_entry['duration']}s)"
        )

        # Check meter labels across all 14 vowels for consonant c
        for sv in short_vowels:
            assert sprites[f"{c}{sv}"]["meter"] == "⏑", f"Expected Laghu ⏑ for {c}{sv}"
        for lv in long_vowels:
            assert sprites[f"{c}{lv}"]["meter"] == "—", f"Expected Guru — for {c}{lv}"

        # Check Guru duration > Laghu duration for all 5 short/long pairs
        for v_short, v_long in vowel_pairs:
            d_short = sprites[f"{c}{v_short}"]["duration"]
            d_long = sprites[f"{c}{v_long}"]["duration"]
            assert d_long > d_short * 1.25, (
                f"Guru {c}{v_long} ({d_long:.3f}s) not >= 1.25x Laghu {c}{v_short} ({d_short:.3f}s)"
            )


# ============================================================================
# 2. Multi-Script Conversion Parity (Devanāgarī ↔ IAST ↔ SLP1 ↔ Siddhaṃ)
# ============================================================================


def test_t5_fm_04_multi_script_roundtrip_and_cross_app_parity_all_553_keys() -> None:
    """Verify Devanāgarī ↔ IAST ↔ SLP1 ↔ Siddhaṃ (`U+11580–U+115FF`) parity across all 553 matrix/override keys."""
    all_553_keys = list(
        dict.fromkeys(
            CANONICAL_16_SVARAS
            + CANONICAL_28_OVERRIDES
            + CANONICAL_34_CONSONANTS
            + [f"{c}{v}" for c in CANONICAL_34_CONSONANTS for v in CANONICAL_14_MATRIX_VOWELS]
        )
    )
    assert len(all_553_keys) == 553

    html_conv = run_engine_js(f"""
      const keys = {json.dumps(all_553_keys)};
      const out = {{}};
      for (const k of keys) {{
        const deva = window.slp1ToDevanagari(k);
        const iast = window.slp1ToIast(k);
        const rtDeva = window.inputToSlp1(deva, 'strict');
        const rtIast = window.inputToSlp1(iast, 'strict');
        out[k] = {{ deva, iast, rtDeva, rtIast }};
      }}
      return out;
    """)

    ts_conv = _run_ts_bundle(f"""
      import {{
        inputToSlp1,
        slp1ToDevanagari,
        slp1ToIast,
        slp1ToSiddham,
        slp1ToIpa,
      }} from './src/core/transliterator';

      export default function() {{
        const keys = {json.dumps(all_553_keys)};
        const out: Record<string, any> = {{}};
        for (const k of keys) {{
          const deva = slp1ToDevanagari(k);
          const iast = slp1ToIast(k);
          const siddham = slp1ToSiddham(k);
          const ipa = slp1ToIpa(k);
          const rtDeva = inputToSlp1(deva, 'strict');
          const rtIast = inputToSlp1(iast, 'strict');
          out[k] = {{ deva, iast, siddham, ipa, rtDeva, rtIast }};
        }}
        return out;
      }}
    """)

    for k in all_553_keys:
        h = html_conv[k]
        t = ts_conv[k]
        # 1. Exact cross-app parity for Devanāgarī and IAST
        assert h["deva"] == t["deva"], f"Devanāgarī mismatch on {k}: HTML={h['deva']} vs TS={t['deva']}"
        assert h["iast"] == t["iast"], f"IAST mismatch on {k}: HTML={h['iast']} vs TS={t['iast']}"

        # 2. Lossless Devanāgarī -> SLP1 round-trip across all 553 keys in both apps
        assert h["rtDeva"] == k, f"HTML Deva->SLP1 roundtrip failed for {k} ({h['deva']} -> {h['rtDeva']})"
        assert t["rtDeva"] == k, f"TS Deva->SLP1 roundtrip failed for {k} ({t['deva']} -> {t['rtDeva']})"

        # 3. Lossless IAST -> SLP1 round-trip for all keys not containing Vedic 'L' (which shares IAST 'ḷ' with vocalic 'x')
        if "L" not in k:
            assert h["rtIast"] == k, f"HTML IAST->SLP1 roundtrip failed for {k} ({h['iast']} -> {h['rtIast']})"
            assert t["rtIast"] == k, f"TS IAST->SLP1 roundtrip failed for {k} ({t['iast']} -> {t['rtIast']})"

        # 4. Siddhaṃ Unicode block validation (U+11580..U+115FF)
        siddham_str = t["siddham"]
        assert len(siddham_str) >= 1, f"Empty Siddhaṃ output for {k}"
        for ch in siddham_str:
            cp = ord(ch)
            assert 0x11580 <= cp <= 0x115FF, (
                f"Character {ch!r} (U+{cp:04X}) in slp1ToSiddham({k!r}) outside Siddhaṃ block U+11580..U+115FF"
            )

        # Bare Virāma consonants must end with Siddhaṃ Virāma U+115BF (𑖿)
        if k in CANONICAL_34_CONSONANTS:
            assert siddham_str.endswith("\U000115bf"), f"Bare consonant {k} Siddhaṃ {siddham_str!r} missing Virāma"


def test_t5_fm_05_adversarial_mixed_script_vedic_accents_zwj_and_rough_english() -> None:
    """Stress-test mixed Devanāgarī + IAST + rough English + Vedic accents + ZWNJ/ZWJ + Avagraha + Daṇḍas."""
    adversarial_cases = [
        (
            "ॐ\u0951 भूर्भुवः\u0952 स्वः । तत्सवितुर्वरेण्यं भर्गो\u200c देवस्य\u200d धीमहि ॥",
            "oM BUrBuvaH svaH | tatsaviturvareRyaM Bargo devasya DImahi ||",
        ),
        (
            "गते gate पारगते pārasaṃgate बोधि svaha",
            "gate gate pAragate pArasaMgate boDi svAhA",
        ),
        (
            "om mani padme hum | namo bhagavate vasudevaya",
            "oM maRi padme hUM | namo Bagavate vAsudevAya",
        ),
        (
            "प्रज्ञापारमिता prajñāpāramitā सोऽहं so'haṃ",
            "prajYApAramitA prajYApAramitA so'haM so'haM",
        ),
    ]

    html_res = run_engine_js(f"""
      const cases = {json.dumps(adversarial_cases)};
      return cases.map(([inp, exp]) => ({{
        inp,
        exp,
        got: window.inputToSlp1(inp, 'smart'),
        deva: window.slp1ToDevanagari(window.inputToSlp1(inp, 'smart')),
        iast: window.slp1ToIast(window.inputToSlp1(inp, 'smart')),
      }}));
    """)

    ts_res = _run_ts_bundle(f"""
      import {{ inputToSlp1, slp1ToDevanagari, slp1ToIast, slp1ToSiddham }} from './src/core/transliterator';
      export default function() {{
        const cases = {json.dumps(adversarial_cases)};
        return cases.map(([inp, exp]: [string, string]) => {{
          const got = inputToSlp1(inp, 'smart');
          return {{
            inp,
            exp,
            got,
            deva: slp1ToDevanagari(got),
            iast: slp1ToIast(got),
            siddham: slp1ToSiddham(got),
          }};
        }});
      }}
    """)

    for h_item, t_item in zip(html_res, ts_res):
        assert h_item["got"] == h_item["exp"], f"HTML mixed-script failure: {h_item}"
        assert t_item["got"] == t_item["exp"], f"TS mixed-script failure: {t_item}"
        assert h_item["deva"] == t_item["deva"]
        assert h_item["iast"] == t_item["iast"]
        assert any(0x11580 <= ord(c) <= 0x115FF for c in t_item["siddham"])


# ============================================================================
# 3. Anusvāra Contextual Assimilation Across All 5 Vargas (ṅ, ñ, ṇ, n, m)
# ============================================================================


def test_t5_fm_06_anusvara_5_varga_contextual_assimilation() -> None:
    """Stress-test Anusvāra (ṃ / M) assimilation across all 5 Vargas in IPA, modern Chinese, and Tang gloss."""
    varga_test_words = [
        # (varga_name, slp1_word, next_cons, expected_ipa_nasal, expected_modern_substr)
        ("velar_k", "saMkalpa", "k", "ŋ", "昂"),
        ("velar_g", "pArasaMgate", "g", "ŋ", "昂"),
        ("velar_G", "saMGa", "G", "ŋ", "昂"),
        ("palatal_c", "saMcaya", "c", "ɲ", "恩"),
        ("palatal_j", "saMjYA", "j", "ɲ", "恩"),
        ("retroflex_w", "saMwAna", "w", "ɳ", "恩"),
        ("retroflex_q", "saMqIna", "q", "ɳ", "恩"),
        ("dental_t", "saMtAna", "t", "n̪", "恩"),
        ("dental_d", "saMdoha", "d", "n̪", "恩"),
        ("dental_B_budDa", "samyaksaMbudDAya", "b", "m", "姆"),
        ("labial_p", "saMpada", "p", "m", "姆"),
        ("word_final", "oM", "", "m", "嗡"),
        ("word_final_yaM", "vareRyaM", "", "m", "姆"),
    ]

    html_assim = run_engine_js(f"""
      const items = {json.dumps(varga_test_words)};
      return items.map(([name, word, nextC, expIpa, expMod]) => {{
        const pOn = window.parseAndTransliterateWord(word, {{ assimilate: true, sep: '·' }});
        const pOff = window.parseAndTransliterateWord(word, {{ assimilate: false, sep: '·' }});
        const modDirect = nextC ? window.resolveModifiers('M', 'a', nextC, true) : window.resolveModifiers('M', 'a', '', true);
        const modOff = window.resolveModifiers('M', 'a', nextC || '', false);
        return {{
          name,
          word,
          modernOn: pOn.modernWord,
          modernOff: pOff.modernWord,
          mModOn: modDirect.mMod,
          mModOff: modOff.mMod,
          expMod,
        }};
      }});
    """)

    ts_assim = _run_ts_bundle(f"""
      import {{ slp1ToDevanagari, slp1ToIpa }} from './src/core/transliterator';
      import {{ analyzeSanskritText, resolveModifiers }} from './src/core/prosody';

      export default function() {{
        const items = {json.dumps(varga_test_words)};
        return items.map(([name, word, nextC, expIpa, expMod]: [string, string, string, string, string]) => {{
          const ipa = slp1ToIpa(word);
          const devaInput = slp1ToDevanagari(word);
          const aOn = analyzeSanskritText(devaInput, {{ assimilate: true }});
          const aOff = analyzeSanskritText(devaInput, {{ assimilate: false }});
          const modOn = resolveModifiers('M', 'a', nextC || '', true);
          const modOff = resolveModifiers('M', 'a', nextC || '', false);
          return {{
            name,
            word,
            ipa,
            expIpa,
            modernOn: aOn.modernFull,
            modernOff: aOff.modernFull,
            mModOn: modOn.mMod,
            mModOff: modOff.mMod,
            expMod,
          }};
        }});
      }}
    """)

    for h, t in zip(html_assim, ts_assim):
        assert t["expIpa"] in t["ipa"], (
            f"Anusvāra IPA assimilation failed for {t['name']} ({t['word']}): expected {t['expIpa']!r} in {t['ipa']!r}"
        )
        assert h["expMod"] in h["modernOn"], (
            f"HTML modern assimilation failed for {h['name']} ({h['word']}): expected {h['expMod']!r} in {h['modernOn']!r}"
        )
        assert t["expMod"] in t["modernOn"], (
            f"TS modern assimilation failed for {t['name']} ({t['word']}): expected {t['expMod']!r} in {t['modernOn']!r}"
        )
        assert h["mModOff"] == "姆"
        assert t["mModOff"] == "姆"


# ============================================================================
# 4. Visarga Vowel Echo (aḥ, iḥ, uḥ, eḥ, oḥ, ṛḥ) & Acoustic Tail Verification
# ============================================================================


def test_t5_fm_07_visarga_vowel_echo_all_6_vowel_timbres() -> None:
    """Verify Visarga (ḥ / H) contextual vowel echo across aḥ, iḥ, uḥ, eḥ, oḥ, ṛḥ in both apps and /api/tts."""
    visarga_cases = [
        # (label, vowel_slp1, word_slp1, deva_word, expected_echo_char, expected_tang_char)
        ("aḥ", "a", "namaH", "नमः", "哈", "诃"),
        ("iḥ", "i", "muniH", "मुनिः", "希", "醯"),
        ("uḥ", "u", "guruH", "गुरुः", "呼", "虎"),
        ("eḥ", "e", "deveH", "देवेः", "嘿", "醯"),
        ("oḥ", "o", "praBoH", "प्रभोः", "豁", "呼"),
        ("ṛḥ", "f", "pitfH", "पितृः", "希", "醯"),
    ]

    html_vis = run_engine_js(f"""
      const cases = {json.dumps(visarga_cases)};
      return cases.map(([label, v, word, deva, expM, expT]) => {{
        const modOn = window.resolveModifiers('H', v, '', true);
        const modOff = window.resolveModifiers('H', v, '', false);
        const parsed = window.parseAndTransliterateWord(word, {{ assimilate: true }});
        return {{
          label,
          mModOn: modOn.mMod,
          tModOn: modOn.tMod,
          mModOff: modOff.mMod,
          tModOff: modOff.tMod,
          modernWord: parsed.modernWord,
          expM,
          expT,
        }};
      }});
    """)

    ts_vis = _run_ts_bundle(f"""
      import {{ analyzeSanskritText, resolveModifiers }} from './src/core/prosody';
      export default function() {{
        const cases = {json.dumps(visarga_cases)};
        return cases.map(([label, v, word, deva, expM, expT]: string[]) => {{
          const modOn = resolveModifiers('H', v, '', true);
          const modOff = resolveModifiers('H', v, '', false);
          const analyzed = analyzeSanskritText(deva, {{ assimilate: true }});
          return {{
            label,
            mModOn: modOn.mMod,
            tModOn: modOn.tMod,
            mModOff: modOff.mMod,
            tModOff: modOff.tMod,
            modernWord: analyzed.modernFull,
            expM,
            expT,
          }};
        }});
      }}
    """)

    for h, t in zip(html_vis, ts_vis):
        assert h["expM"] in h["mModOn"] and h["expM"] in h["modernWord"], f"HTML Visarga echo failed: {h}"
        assert h["expT"] in h["tModOn"], f"HTML Visarga Tang echo failed: {h}"
        assert t["expM"] in t["mModOn"] and t["expM"] in t["modernWord"], f"TS Visarga echo failed: {t}"
        assert t["expT"] in t["tModOn"], f"TS Visarga Tang echo failed: {t}"
        assert h["mModOff"] == "哈" and h["tModOff"] == "诃"
        assert t["mModOff"] == "哈" and t["tModOff"] == "诃"

    # Acoustic check: synthesize all 6 Visarga forms via live /api/tts and verify audible tail energy
    with httpx.Client(trust_env=False, timeout=30.0) as client:
        for label, _, word_slp1, deva_word, _, _ in visarga_cases:
            resp = client.post(
                f"{BACKEND_URL}/api/tts",
                json={
                    "text": deva_word,
                    "script": "auto",
                    "voice": "male",
                    "rate": 1.0,
                    "response_format": "json",
                },
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["sampleRate"] == 48000
            wav_metrics = decode_base64_wav(data["audioBase64Wav"])
            assert wav_metrics["sample_rate"] == 48000
            assert wav_metrics["tail_rms_35"] > 0.012, (
                f"Visarga {label} ({deva_word}) tail RMS too weak ({wav_metrics['tail_rms_35']:.4f})"
            )


# ============================================================================
# 5. playSingleSyllable / speakSanskrit & sanskritAudioEngine Promise & Timings
# ============================================================================


def test_t5_fm_08_play_single_syllable_and_speak_sanskrit_promise_and_timings_monotonicity() -> None:
    """Stress-test playSingleSyllable across all 553 keys and speakSanskrit across all 8 SAMPLES."""
    all_553_keys = list(
        dict.fromkeys(
            CANONICAL_16_SVARAS
            + CANONICAL_28_OVERRIDES
            + CANONICAL_34_CONSONANTS
            + [f"{c}{v}" for c in CANONICAL_34_CONSONANTS for v in CANONICAL_14_MATRIX_VOWELS]
        )
    )

    res = run_engine_js(f"""
      const keys = {json.dumps(all_553_keys)};
      __playedSources.length = 0;
      const playResults = [];
      for (let i = 0; i < keys.length; i++) {{
        const r = await window.playSingleSyllable(keys[i], -1);
        playResults.push(r);
      }}
      const totalPlayedAfter553 = __playedSources.length;

      // Test unseen compound syllable fallback
      const unseenRes = await window.playSingleSyllable('kArtsnyena', -1);

      // Test speakSanskrit across all 8 SAMPLES in neural-sprite mode
      const sampleRuns = [];
      document.getElementById('audioModeSelect').value = 'neural-sprite';
      for (let sIdx = 0; sIdx < window.SAMPLES.length; sIdx++) {{
        window.loadSample(sIdx);
        const sr = await window.speakSanskrit();
        window.stopSpeaking();
        sampleRuns.push({{
          sampleIdx: sIdx,
          mode: sr.mode,
          sampleRate: sr.sampleRate,
          durationSec: sr.durationSec,
          timings: sr.syllableTimings,
        }});
      }}

      // Also test neural-tts mode on Sample 0
      document.getElementById('audioModeSelect').value = 'neural-tts';
      window.loadSample(0);
      const ttsRun = await window.speakSanskrit();
      window.stopSpeaking();

      return {{
        playCount: playResults.length,
        totalPlayedAfter553,
        invalidPlayResults: playResults.filter(
          r => r.source !== 'neural-sprite' || r.sampleRate !== 48000 || !(r.durationSec > 0.04) || !(r.offset >= 0)
        ),
        unseenRes,
        sampleRuns,
        ttsRun,
      }};
    """)

    assert res["playCount"] == 553
    assert res["totalPlayedAfter553"] == 553
    assert res["invalidPlayResults"] == [], f"Invalid playSingleSyllable results: {res['invalidPlayResults'][:5]}"
    assert res["unseenRes"]["sampleRate"] == 48000
    assert res["unseenRes"]["durationSec"] > 0.1

    assert len(res["sampleRuns"]) == 8
    for run in res["sampleRuns"]:
        assert run["mode"] == "neural-sprite"
        assert run["sampleRate"] == 48000
        assert run["durationSec"] > 0.5
        timings = run["timings"]
        assert len(timings) >= 4, f"Too few syllableTimings for sample {run['sampleIdx']}"
        prev_start = -1
        for idx, t in enumerate(timings):
            assert t["index"] == idx
            assert t["startMs"] >= prev_start, (
                f"Non-monotonic startMs at sample {run['sampleIdx']} idx {idx}: {t['startMs']} < {prev_start}"
            )
            assert t["endMs"] > t["startMs"], f"endMs <= startMs at sample {run['sampleIdx']} idx {idx}: {t}"
            assert t["durationMs"] == t["endMs"] - t["startMs"]
            assert t["meter"] in ("—", "⏑")
            prev_start = t["startMs"]

    assert res["ttsRun"]["mode"] == "neural-tts"
    assert res["ttsRun"]["sampleRate"] == 48000
    assert len(res["ttsRun"]["syllableTimings"]) >= 2


def test_t5_fm_09_sarva_dharani_kosa_audio_engine_ts_and_live_proxy_timings_monotonicity() -> None:
    """Execute sanskritAudioEngine.ts in Node and verify live :5173 /api/tts & /api/syllable monotonicity."""
    ts_engine_res = _run_ts_bundle(f"""
      import fs from 'fs';
      import {{ sanskritAudioEngine }} from './src/services/audio/sanskritAudioEngine';
      import {{ CANONICAL_16_SVARAS, SYLLABLE_OVERRIDES }} from './src/core/transliterator';

      export default async function() {{
        const manifestRaw = JSON.parse(
          fs.readFileSync('/home/antigravity/public/audio/siddham_sprite_manifest.json', 'utf8')
        );

        class MockSource {{
          buffer: any = null;
          playbackRate = {{ value: 1.0 }};
          onended: any = null;
          connect() {{ return this; }}
          disconnect() {{}}
          start() {{
            if (this.onended) setTimeout(() => this.onended(), 1);
          }}
          stop() {{}}
        }}

        class MockGain {{
          gain = {{
            setValueAtTime() {{}},
            linearRampToValueAtTime() {{}},
          }};
          connect() {{ return this; }}
        }}

        class MockAudioCtx {{
          sampleRate = 48000;
          currentTime = 0;
          state = 'running';
          destination = {{}};
          resume() {{ return Promise.resolve(); }}
          createBufferSource() {{ return new MockSource(); }}
          createGain() {{ return new MockGain(); }}
          decodeAudioData() {{
            return Promise.resolve({{
              sampleRate: 48000,
              duration: 2.4,
              length: 48000 * 2.4,
              numberOfChannels: 1,
            }});
          }}
        }}

        (globalThis as any).window = globalThis;
        (globalThis as any).AudioContext = MockAudioCtx;
        (globalThis as any).atob = (b64: string) => Buffer.from(b64, 'base64').toString('binary');
        (globalThis as any).fetch = async (url: string, opts?: any) => {{
          const u = String(url);
          if (u.includes('/api/health')) {{
            return {{
              ok: true,
              json: async () => ({{
                status: 'ok',
                engine: 'ninada-vits-sanskrit-48khz',
                sampleRate: 48000,
                modelsLoaded: ['sa_studio_male', 'sa_studio_female', 'sa_mobile_male', 'sa_mms_16k'],
                spriteCount: Object.keys(manifestRaw.sprites).length,
                spriteReady: true,
              }}),
            }};
          }}
          if (u.includes('siddham_sprite_manifest.json')) {{
            return {{ ok: true, json: async () => manifestRaw }};
          }}
          if (u.includes('siddham_sprite_48k')) {{
            return {{ ok: true, arrayBuffer: async () => new ArrayBuffer(1024) }};
          }}
          if (u.includes('/api/tts')) {{
            return {{
              ok: true,
              json: async () => ({{
                sampleRate: 48000,
                durationSec: 2.4,
                audioUrl: '/api/tts/cache/test.wav',
                audioBase64Wav: Buffer.from('RIFFxxxxWAVEfmt ').toString('base64'),
                syllableTimings: [
                  {{ index: 0, slp1: 'oM', deva: 'ॐ', iast: 'oṃ', meter: '—', startMs: 0, endMs: 380, durationMs: 380 }},
                  {{ index: 1, slp1: 'ma', deva: 'म', iast: 'ma', meter: '⏑', startMs: 380, endMs: 600, durationMs: 220 }},
                  {{ index: 2, slp1: 'Ri', deva: 'णि', iast: 'ṇi', meter: '⏑', startMs: 600, endMs: 830, durationMs: 230 }},
                  {{ index: 3, slp1: 'pad', deva: 'पद्', iast: 'pad', meter: '—', startMs: 830, endMs: 1210, durationMs: 380 }},
                  {{ index: 4, slp1: 'me', deva: 'मे', iast: 'me', meter: '—', startMs: 1210, endMs: 1590, durationMs: 380 }},
                  {{ index: 5, slp1: 'hUM', deva: 'हूँ', iast: 'hūṃ', meter: '—', startMs: 1590, endMs: 2050, durationMs: 460 }},
                ],
              }}),
            }};
          }}
          return {{ ok: false, status: 404 }};
        }};

        await sanskritAudioEngine.init();
        const health = sanskritAudioEngine.getHealthStatus();

        const svaraPlays = [];
        for (const s of CANONICAL_16_SVARAS) {{
          svaraPlays.push(await sanskritAudioEngine.playSyllable(s.slp1));
        }}
        const overridePlays = [];
        for (const ov of Object.keys(SYLLABLE_OVERRIDES)) {{
          overridePlays.push(await sanskritAudioEngine.playSyllable(ov));
        }}

        const ttsSpeak = await sanskritAudioEngine.speakText(
          'oṃ maṇi padme hūṃ',
          {{ mode: 'neural-tts', voice: 'male', rate: 1.0 }}
        );
        sanskritAudioEngine.stop();

        const spriteSpeak = await sanskritAudioEngine.speakText(
          'gate gate pāragate pārasaṃgate bodhi svāhā',
          {{ mode: 'neural-sprite', voice: 'male', rate: 1.0 }}
        );
        sanskritAudioEngine.stop();

        return {{
          health,
          svaraPlays,
          overridePlays,
          ttsSpeak,
          spriteSpeak,
        }};
      }}
    """)

    assert ts_engine_res["health"]["backendOnline"] is True
    assert ts_engine_res["health"]["sampleRate"] == 48000
    assert ts_engine_res["health"]["spriteReady"] is True
    assert ts_engine_res["health"]["spriteBufferDecoded"] is True

    for r in ts_engine_res["svaraPlays"] + ts_engine_res["overridePlays"]:
        assert r["source"] == "neural-sprite"
        assert r["sampleRate"] == 48000
        assert r["durationSec"] > 0.05

    assert ts_engine_res["ttsSpeak"]["mode"] == "neural-tts"
    assert ts_engine_res["ttsSpeak"]["sampleRate"] == 48000
    assert len(ts_engine_res["ttsSpeak"]["syllableTimings"]) == 6

    sprite_timings = ts_engine_res["spriteSpeak"]["syllableTimings"]
    assert ts_engine_res["spriteSpeak"]["mode"] == "neural-sprite"
    assert ts_engine_res["spriteSpeak"]["sampleRate"] == 48000
    assert len(sprite_timings) == 17
    prev_ms = -1
    for idx, t in enumerate(sprite_timings):
        assert t["index"] == idx
        assert t["startMs"] >= prev_ms
        assert t["endMs"] > t["startMs"]
        assert t["durationMs"] == t["endMs"] - t["startMs"]
        prev_ms = t["startMs"]

    # Live proxy verification against http://localhost:5173/api/tts across voices & scripts
    with httpx.Client(trust_env=False, timeout=35.0) as client:
        for voice in ["male", "female", "mobile"]:
            resp = client.post(
                f"{FRONTEND_URL}/api/tts",
                json={
                    "text": "ॐ मणि पद्मे हूँ",
                    "script": "auto",
                    "voice": voice,
                    "rate": 1.0,
                    "response_format": "json",
                },
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["sampleRate"] == 48000
            assert data["voice"] == voice
            timings = data["syllableTimings"]
            assert len(timings) == 6
            last_start = -1
            for idx, item in enumerate(timings):
                assert item["index"] == idx
                assert item["startMs"] >= last_start
                assert item["endMs"] > item["startMs"]
                assert item["durationMs"] > 0
                last_start = item["startMs"]
            wav_info = decode_base64_wav(data["audioBase64Wav"])
            assert wav_info["sample_rate"] == 48000
            assert wav_info["rms"] > 0.015
            assert abs(timings[-1]["endMs"] - wav_info["duration_sec"] * 1000.0) <= 60.0


def test_t5_fm_10_sanskrit_phonetics_academy_varga_partition_and_553_ts_play_syllable() -> None:
    """Verify Varga filter partition (5+5+5+5+5+4+3+1+1 = 34) and playSyllable across all 553 keys in TS engine."""
    all_553_keys = list(
        dict.fromkeys(
            CANONICAL_16_SVARAS
            + CANONICAL_28_OVERRIDES
            + CANONICAL_34_CONSONANTS
            + [f"{c}{v}" for c in CANONICAL_34_CONSONANTS for v in CANONICAL_14_MATRIX_VOWELS]
        )
    )

    res = _run_ts_bundle(f"""
      import fs from 'fs';
      import {{ CONS_MATRIX, CANONICAL_34_CONSONANT_KEYS }} from './src/core/transliterator';
      import {{ sanskritAudioEngine }} from './src/services/audio/sanskritAudioEngine';

      export default async function() {{
        const manifestRaw = JSON.parse(
          fs.readFileSync('/home/antigravity/public/audio/siddham_sprite_manifest.json', 'utf8')
        );

        const vargaGroups = [
          '喉音 (Ka-varga)',
          '颚音 (Ca-varga)',
          '卷舌音 (Ṭa-varga)',
          '齿音 (Ta-varga)',
          '唇音 (Pa-varga)',
          '半元音 (Antaḥstha)',
          '擦音 (Ūṣman)',
          '气音 (Ūṣman)',
          '吠陀音 (Vedic)',
        ];
        const countsByVarga: Record<string, number> = {{}};
        for (const vg of vargaGroups) {{
          countsByVarga[vg] = CANONICAL_34_CONSONANT_KEYS.filter(k => CONS_MATRIX[k].varga === vg).length;
        }}

        class MockSource {{
          buffer: any = null;
          playbackRate = {{ value: 1.0 }};
          onended: any = null;
          connect() {{ return this; }}
          disconnect() {{}}
          start() {{}}
          stop() {{}}
        }}
        class MockGain {{
          gain = {{ setValueAtTime() {{}}, linearRampToValueAtTime() {{}} }};
          connect() {{ return this; }}
        }}
        class MockAudioCtx {{
          sampleRate = 48000;
          currentTime = 0;
          state = 'running';
          destination = {{}};
          resume() {{ return Promise.resolve(); }}
          createBufferSource() {{ return new MockSource(); }}
          createGain() {{ return new MockGain(); }}
          decodeAudioData() {{
            return Promise.resolve({{ sampleRate: 48000, duration: 180.0, length: 48000 * 180, numberOfChannels: 1 }});
          }}
        }}

        (globalThis as any).window = globalThis;
        (globalThis as any).AudioContext = MockAudioCtx;
        (globalThis as any).fetch = async (url: string) => {{
          const u = String(url);
          if (u.includes('siddham_sprite_manifest.json')) return {{ ok: true, json: async () => manifestRaw }};
          if (u.includes('siddham_sprite_48k')) return {{ ok: true, arrayBuffer: async () => new ArrayBuffer(1024) }};
          if (u.includes('/api/health')) return {{ ok: true, json: async () => ({{ status: 'ok', sampleRate: 48000, spriteReady: true }}) }};
          return {{ ok: false, status: 404 }};
        }};

        await sanskritAudioEngine.init();
        const keys: string[] = {json.dumps(all_553_keys)};
        const results = [];
        for (const k of keys) {{
          results.push(await sanskritAudioEngine.playSyllable(k));
        }}
        return {{
          countsByVarga,
          totalPlayed: results.length,
          badResults: results.filter(r => r.source !== 'neural-sprite' || r.sampleRate !== 48000 || !(r.durationSec > 0.045)),
        }};
      }}
    """)

    expected_varga_counts = {
        "喉音 (Ka-varga)": 5,
        "颚音 (Ca-varga)": 5,
        "卷舌音 (Ṭa-varga)": 5,
        "齿音 (Ta-varga)": 5,
        "唇音 (Pa-varga)": 5,
        "半元音 (Antaḥstha)": 4,
        "擦音 (Ūṣman)": 3,
        "气音 (Ūṣman)": 1,
        "吠陀音 (Vedic)": 1,
    }
    assert res["countsByVarga"] == expected_varga_counts
    assert sum(res["countsByVarga"].values()) == 34
    assert res["totalPlayed"] == 553
    assert res["badResults"] == []


def test_t5_fm_11_3_pass_prosodic_cluster_splitting_and_chandas_meter_parity() -> None:
    """Verify 3-pass prosodic cluster splitting and Guru/Laghu Chandas meter parity across both apps."""
    test_words_slp1 = [
        "kArtsnyena",
        "tatsaviturvareRyaM",
        "samyaksaMbudDAya",
        "avalokiteSvara",
        "prajYApAramitA",
        "vEdUryapraBarAjAya",
        "uzRIzavijaya",
        "vajrasattva",
    ]

    html_prosody = run_engine_js(f"""
      const words = {json.dumps(test_words_slp1)};
      return words.map(w => {{
        const p = window.parseAndTransliterateWord(w, {{ assimilate: true }});
        return {{
          word: w,
          syls: p.syllables.filter(s => !s.isSymbol).map(s => ({{ slp1: s.raw, meter: s.meter }})),
        }};
      }});
    """)

    ts_prosody = _run_ts_bundle(f"""
      import {{ slp1ToDevanagari }} from './src/core/transliterator';
      import {{ analyzeSanskritText }} from './src/core/prosody';
      export default function() {{
        const words: string[] = {json.dumps(test_words_slp1)};
        return words.map(w => {{
          const a = analyzeSanskritText(slp1ToDevanagari(w), {{ assimilate: true }});
          return {{
            word: w,
            syls: a.syllables.filter(s => !s.isSymbol).map(s => ({{ slp1: s.slp1, meter: s.meter }})),
          }};
        }});
      }}
    """)

    for h, t in zip(html_prosody, ts_prosody):
        assert len(h["syls"]) == len(t["syls"]), (
            f"Syllable count mismatch on {h['word']}: HTML={h['syls']} vs TS={t['syls']}"
        )
        assert [s["meter"] for s in h["syls"]] == [s["meter"] for s in t["syls"]], (
            f"Chandas meter mismatch on {h['word']}:\n"
            f"  HTML: {h['syls']}\n  TS:   {t['syls']}"
        )
        if h["word"] != "samyaksaMbudDAya":
            assert h["syls"] == t["syls"], (
                f"Prosodic syllabification mismatch on {h['word']}:\n"
                f"  HTML: {h['syls']}\n  TS:   {t['syls']}"
            )
