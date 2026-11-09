"""
Tier 5 White-Box Adversarial Verification & Stress Suite (Challenger 1: `challenger_m4_1`).

Targets Plan 1 Neural Sanskrit TTS Backend (`backend/sanskrit_tts_engine.py`, `backend/tts_server.py` on `:8765`)
and Plan 3 48,000 Hz Neural Audio Sprite Library (`public/audio/siddham_sprite_48k.{wav,ogg}`, `siddham_sprite_manifest.json`):
1. OOV & complex Vedic/Tantric inputs (`ॐ`, `ॠ`, `ऌ`, `ॡ`, `ऽ` Avagraha, 5-consonant clusters `kārtsnyena`,
   `strīṃ`, `bhrūṃ`, `jñānāmṛta`, `kṣatriya`, word-final Visarga `namaḥ`, `śāntiḥ`, `duḥkha`,
   word-final short-a `dharma`, `buddha`, `padme`, `svāhā`).
2. Acoustic DSP invariants at 48,000 Hz: zero NaN/Inf, `|dc_offset| < 0.005`, `peak <= 1.0`, non-silent RMS.
3. Distinct consonant waveforms (`ka` vs `kha` vs `ga` vs `gha`, `ta` vs `ṭa` vs `pa`, `śa` vs `ṣa` vs `sa`, `jña` vs `gya`).
4. Guru (`—`) > Laghu (`⏑`) duration ratio across all voices (`male`, `female`, `mobile`) and rates (`0.6`, `1.0`, `1.5`).
5. White-box DSP filter stress tests & API security / parameter boundary hardening.
"""
from __future__ import annotations

import json
import sys
import wave
from pathlib import Path
from typing import Any

import httpx
import numpy as np
import pytest

PROJECT_ROOT = Path("/home/antigravity")
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
E2E_DIR = PROJECT_ROOT / "tests" / "e2e"
if str(E2E_DIR) not in sys.path:
    sys.path.insert(0, str(E2E_DIR))

from backend.sanskrit_tts_engine import (
    MATRIX_CONSONANTS,
    PEAK_TARGET_LINEAR,
    TARGET_SAMPLE_RATE,
    _enhance_visarga_tail_48k,
    apply_dc_blocker,
    apply_mastering_envelope_48k,
    condition_single_syllable_slp1,
    get_tts_engine,
    input_to_slp1,
    normalize_sanskrit_siksha,
    syllabify_sanskrit_text,
    upsample_to_48k,
)
from e2e_helpers import (
    BACKEND_URL,
    SPRITE_OGG_PATH,
    SPRITE_WAV_PATH,
    analyze_pcm_samples,
    decode_base64_wav,
    decode_wav_bytes,
    load_sprite_manifest,
    slice_sprite_wav,
)


def _assert_48k_dsp_invariants(metrics: dict[str, Any], label: str, min_rms: float = 0.015) -> None:
    """Verify strict 48,000 Hz DSP acoustic invariants on a decoded waveform."""
    assert metrics["sample_rate"] == 48000, f"[{label}] Expected 48000 Hz, got {metrics['sample_rate']}"
    assert metrics.get("channels", 1) == 1, f"[{label}] Expected mono (1 channel), got {metrics.get('channels')}"
    assert metrics.get("sample_width", 2) == 2, f"[{label}] Expected 16-bit PCM, got {metrics.get('sample_width')}"
    assert metrics["has_nan_or_inf"] is False, f"[{label}] Waveform contains NaN or Inf"
    assert abs(metrics["dc_offset"]) < 0.005, (
        f"[{label}] DC offset {metrics['dc_offset']:.6f} exceeds +/- 0.005 bound"
    )
    assert 0.10 <= metrics["peak"] <= 1.0, (
        f"[{label}] Peak {metrics['peak']:.4f} outside valid mastered range [0.10, 1.0]"
    )
    assert metrics["rms"] >= min_rms, (
        f"[{label}] RMS {metrics['rms']:.4f} below non-silent floor {min_rms}"
    )


def _pairwise_waveform_metrics(a: np.ndarray, b: np.ndarray) -> tuple[float, float]:
    """Return (pearson_corr, relative_l2_distance) between two 48kHz waveforms."""
    n = min(len(a), len(b))
    assert n > 500, f"Waveforms too short for comparison ({n} samples)"
    sa = a[:n].astype(np.float64)
    sb = b[:n].astype(np.float64)
    corr = float(np.dot(sa, sb) / (np.linalg.norm(sa) * np.linalg.norm(sb) + 1e-12))
    rel_l2 = float(np.linalg.norm(sa - sb) / (np.linalg.norm(sa) + 1e-12))
    return corr, rel_l2


# ============================================================================
# 1. OOV, Vedic Vocalic Liquids, Avagraha & Tantric Clusters Stress Tests
# ============================================================================


def test_t5_siksha_oov_sacred_and_vedic_vocalic_liquids() -> None:
    """Stress-test OOV sacred symbols & rare Vedic vocalic liquids (ॐ, ॠ, ॄ, ऌ, ॡ, ॢ, ॣ, ळ, ँ, accents, nuktas)."""
    with httpx.Client(base_url=BACKEND_URL, timeout=30.0, trust_env=False) as client:
        # 1. Standalone sacred Oṃ and vocalic liquids
        oov_singles = [
            ("ॐ", "oM", "—"),
            ("ऋ", "f", "⏑"),
            ("ॠ", "F", "—"),
            ("ऌ", "x", "⏑"),
            ("ॡ", "X", "—"),
        ]
        durations: dict[str, float] = {}
        for text, expected_slp, expected_meter in oov_singles:
            norm = normalize_sanskrit_siksha(text)
            assert "ॐ" not in norm["normalizedDeva"]
            assert "ॠ" not in norm["normalizedDeva"]
            assert "ऌ" not in norm["normalizedDeva"]
            assert "ॡ" not in norm["normalizedDeva"]

            resp = client.post("/api/tts", json={"text": text, "voice": "male", "rate": 1.0})
            assert resp.status_code == 200, f"Failed on {text}: {resp.text}"
            data = resp.json()
            assert data["slp1"] == expected_slp
            assert len(data["syllableTimings"]) == 1
            assert data["syllableTimings"][0]["meter"] == expected_meter

            m = decode_base64_wav(data["audioBase64Wav"])
            _assert_48k_dsp_invariants(m, f"OOV-{text}", min_rms=0.02)
            durations[expected_slp] = m["duration_sec"]

        # Long vocalic ॠ (F) and ॡ (X) must be Guru (> 1.45x Laghu ऋ (f) and ऌ (x))
        assert durations["F"] > durations["f"] * 1.45, (
            f"Expected ॠ ({durations['F']:.3f}s) > 1.45x ऋ ({durations['f']:.3f}s)"
        )
        assert durations["X"] > durations["x"] * 1.45, (
            f"Expected ॡ ({durations['X']:.3f}s) > 1.45x ऌ ({durations['x']:.3f}s)"
        )

        # 2. Compound words with matra forms ॄ, ॢ, ॣ, Vedic ळ, Candrabindu ँ, Vedic accents, and Nuktas
        vedic_compounds = [
            "पितॄणाम् क्लृप्त कॣ अग्निमीळे पुरोहितम्",
            "अ\u0951ग्निमी\u0952ळे\u200c पु\u200dरोहितम् हूँ",
            "क़ ख़ ग़ ज़ ड़ ढ़ फ़",
        ]
        for vc in vedic_compounds:
            resp = client.post("/api/tts", json={"text": vc, "voice": "male", "rate": 1.0})
            assert resp.status_code == 200
            data = resp.json()
            m = decode_base64_wav(data["audioBase64Wav"])
            _assert_48k_dsp_invariants(m, f"Vedic-{vc[:12]}", min_rms=0.02)
            assert len(data["syllableTimings"]) >= 4


def test_t5_avagraha_and_danda_prosodic_pauses() -> None:
    """Stress-test Avagraha (ऽ) vowel prolongation and Daṇḍa (। / ॥) prosodic clause pause injection."""
    norm_av = normalize_sanskrit_siksha("सोऽहम् शिवोऽहम् तेऽवदन्")
    assert norm_av["hasAvagraha"] is True
    assert "ऽ" not in norm_av["normalizedDeva"]

    with httpx.Client(base_url=BACKEND_URL, timeout=30.0, trust_env=False) as client:
        for av_word, expected_syls in [
            ("सोऽहम्", ["so", "ham"]),
            ("so'ham", ["so", "ham"]),
            ("शिवोऽहम्", ["Si", "vo", "ham"]),
            ("तेऽवदन्", ["te", "va", "dan"]),
        ]:
            resp = client.post("/api/tts", json={"text": av_word, "voice": "male", "rate": 1.0})
            assert resp.status_code == 200
            data = resp.json()
            assert [t["slp1"] for t in data["syllableTimings"]] == expected_syls
            m = decode_base64_wav(data["audioBase64Wav"])
            _assert_48k_dsp_invariants(m, f"Avagraha-{av_word}", min_rms=0.02)

        # Compare clause without Daṇḍa vs single Daṇḍa (250ms) vs double Daṇḍa (450ms)
        r_no_danda = client.post("/api/tts", json={"text": "गते गते बोधि स्वाहा"}).json()
        r_single_danda = client.post("/api/tts", json={"text": "गते गते । बोधि स्वाहा"}).json()
        r_double_danda = client.post("/api/tts", json={"text": "गते गते ॥ बोधि स्वाहा"}).json()

        d0 = float(r_no_danda["durationSec"])
        d1 = float(r_single_danda["durationSec"])
        d2 = float(r_double_danda["durationSec"])
        assert d1 > d0 + 0.15, f"Single Daṇḍa did not insert ~250ms pause: d1={d1:.3f}s vs d0={d0:.3f}s"
        assert d2 > d1 + 0.12, f"Double Daṇḍa did not insert ~450ms pause: d2={d2:.3f}s vs d1={d1:.3f}s"

        for tag, r_obj in [("no_danda", r_no_danda), ("single_danda", r_single_danda), ("double_danda", r_double_danda)]:
            m = decode_base64_wav(r_obj["audioBase64Wav"])
            _assert_48k_dsp_invariants(m, tag, min_rms=0.02)


def test_t5_five_consonant_and_tantric_conjunct_clusters() -> None:
    """Stress-test 5-consonant & Tantric clusters: kārtsnyena, strīṃ, bhrūṃ, jñānāmṛta, kṣatriya."""
    cases = [
        ("kārtsnyena", ["kArt", "snye", "na"], ["—", "—", "⏑"]),
        ("कार्त्स्न्येन", ["kArt", "snye", "na"], ["—", "—", "⏑"]),
        ("strīṃ", ["strIM"], ["—"]),
        ("स्त्रीं", ["strIM"], ["—"]),
        ("bhrūṃ", ["BrUM"], ["—"]),
        ("भ्रूं", ["BrUM"], ["—"]),
        ("jñānāmṛta", ["jYA", "nA", "mf", "ta"], ["—", "—", "⏑", "⏑"]),
        ("ज्ञानामृत", ["jYA", "nA", "mf", "ta"], ["—", "—", "⏑", "⏑"]),
        ("kṣatriya", ["kza", "tri", "ya"], ["—", "⏑", "⏑"]),
        ("क्षत्रिय", ["kza", "tri", "ya"], ["—", "⏑", "⏑"]),
    ]
    with httpx.Client(base_url=BACKEND_URL, timeout=30.0, trust_env=False) as client:
        for text, expected_slp, expected_meters in cases:
            resp = client.post("/api/tts", json={"text": text, "voice": "male", "rate": 1.0})
            assert resp.status_code == 200, f"Failed on {text}: {resp.text}"
            data = resp.json()
            timings = data["syllableTimings"]
            assert [t["slp1"] for t in timings] == expected_slp, (
                f"[{text}] Expected syllables {expected_slp}, got {[t['slp1'] for t in timings]}"
            )
            assert [t["meter"] for t in timings] == expected_meters, (
                f"[{text}] Expected meters {expected_meters}, got {[t['meter'] for t in timings]}"
            )
            # Verify contiguous monotonic syllable timing windows
            for idx, t in enumerate(timings):
                assert t["index"] == idx
                assert t["endMs"] > t["startMs"]
                assert t["durationMs"] == t["endMs"] - t["startMs"]
                if idx > 0:
                    assert t["startMs"] >= timings[idx - 1]["endMs"] - 1

            m = decode_base64_wav(data["audioBase64Wav"])
            _assert_48k_dsp_invariants(m, f"Cluster-{text}", min_rms=0.02)


def test_t5_word_final_visarga_aspiration_and_echo_energy() -> None:
    """Verify word-final & medial Visarga (namaḥ, śāntiḥ, duḥkha, bhūḥ, svaḥ, hrīḥ, dhīḥ) is never silenced."""
    visarga_cases = [
        ("namaḥ", ["na", "maH"], ["⏑", "—"]),
        ("नमः", ["na", "maH"], ["⏑", "—"]),
        ("śāntiḥ", ["SAn", "tiH"], ["—", "—"]),
        ("शान्तिः", ["SAn", "tiH"], ["—", "—"]),
        ("duḥkha", ["duH", "Ka"], ["—", "⏑"]),
        ("दुःख", ["duH", "Ka"], ["—", "⏑"]),
        ("bhūḥ", ["BUH"], ["—"]),
        ("svaḥ", ["svaH"], ["—"]),
        ("hrīḥ", ["hrIH"], ["—"]),
        ("dhīḥ", ["DIH"], ["—"]),
    ]
    with httpx.Client(base_url=BACKEND_URL, timeout=30.0, trust_env=False) as client:
        for text, expected_slp, expected_meters in visarga_cases:
            resp = client.post("/api/tts", json={"text": text, "voice": "male", "rate": 1.0})
            assert resp.status_code == 200
            data = resp.json()
            assert [t["slp1"] for t in data["syllableTimings"]] == expected_slp
            assert [t["meter"] for t in data["syllableTimings"]] == expected_meters
            m = decode_base64_wav(data["audioBase64Wav"])
            _assert_48k_dsp_invariants(m, f"Visarga-{text}", min_rms=0.02)
            assert m["tail_rms_35"] >= 0.015, (
                f"[{text}] Visarga tail silenced: tail_rms_35={m['tail_rms_35']:.4f} < 0.015"
            )

    # White-box check of _enhance_visarga_tail_48k when tail energy is artificially attenuated
    synth_body = np.sin(2.0 * np.pi * 220.0 * np.arange(int(0.25 * TARGET_SAMPLE_RATE), dtype=np.float32) / TARGET_SAMPLE_RATE) * 0.4
    synth_body[int(len(synth_body) * 0.65) :] = 0.0  # Dead silent tail
    enhanced = _enhance_visarga_tail_48k(synth_body, seed=108)
    enh_metrics = analyze_pcm_samples(enhanced, TARGET_SAMPLE_RATE)
    assert enh_metrics["tail_rms_35"] >= 0.015, "White-box _enhance_visarga_tail_48k failed to restore Visarga aspiration tail"


def test_t5_zero_schwa_deletion_dharma_buddha_padme_namah_svaha() -> None:
    """Verify 100% preservation of word-final and medial short 'a' (dharma, buddha, padme, namaḥ, svāhā)."""
    schwa_cases = [
        ("dharma", "धर्म", ["Dar", "ma"], ["—", "⏑"], True),
        ("buddha", "बुद्ध", ["bud", "Da"], ["—", "⏑"], True),
        ("padme", "पद्मे", ["pad", "me"], ["—", "—"], False),
        ("namaḥ", "नमः", ["na", "maH"], ["⏑", "—"], False),
        ("svāhā", "स्वाहा", ["svA", "hA"], ["—", "—"], False),
    ]
    with httpx.Client(base_url=BACKEND_URL, timeout=30.0, trust_env=False) as client:
        for iast_w, deva_w, expected_slp, expected_meters, has_final_inherent_a in schwa_cases:
            for variant in (iast_w, deva_w):
                norm = normalize_sanskrit_siksha(variant)
                if has_final_inherent_a:
                    assert norm["vitsDeva"].endswith("अ"), (
                        f"[{variant}] Expected explicit final 'अ' conditioning in vitsDeva, got {norm['vitsDeva']!r}"
                    )
                resp = client.post("/api/tts", json={"text": variant, "voice": "male", "rate": 1.0})
                assert resp.status_code == 200
                data = resp.json()
                timings = data["syllableTimings"]
                assert [t["slp1"] for t in timings] == expected_slp
                assert [t["meter"] for t in timings] == expected_meters
                assert timings[-1]["durationMs"] >= 140, (
                    f"[{variant}] Word-final syllable '{timings[-1]['slp1']}' truncated to {timings[-1]['durationMs']}ms"
                )
                m = decode_base64_wav(data["audioBase64Wav"])
                _assert_48k_dsp_invariants(m, f"Schwa-{variant}", min_rms=0.02)
                assert m["tail_rms_35"] >= 0.015, (
                    f"[{variant}] Acoustic schwa deletion detected: tail_rms_35={m['tail_rms_35']:.4f}"
                )

        # Contrast full Sanskrit 'धर्म' (dharma, 2 syllables) against halanta 'धर्म्' (dharm, 1 syllable)
        r_dharma = client.post("/api/tts", json={"text": "धर्म", "voice": "male", "rate": 1.0}).json()
        r_dharm = client.post("/api/tts", json={"text": "धर्म्", "voice": "male", "rate": 1.0}).json()
        assert len(r_dharma["syllableTimings"]) == 2
        assert len(r_dharm["syllableTimings"]) == 1
        assert float(r_dharma["durationSec"]) > float(r_dharm["durationSec"]) * 1.25


# ============================================================================
# 2. Acoustic DSP Invariants & Distinct Consonant Waveforms at 48,000 Hz
# ============================================================================


def test_t5_distinct_consonant_waveforms_velar_and_place_of_articulation() -> None:
    """Verify distinct 48,000 Hz neural waveforms across ka/kha/ga/gha, ta/ṭa/pa, śa/ṣa/sa, and jña/gya."""
    manifest = load_sprite_manifest()
    sprites = manifest["sprites"]

    contrast_groups = [
        ("Velar Voicing & Aspiration", ["ka", "Ka", "ga", "Ga"]),
        ("Place of Articulation (Dental/Retroflex/Labial)", ["ta", "wa", "pa"]),
        ("Sibilant Triad (Palatal/Retroflex/Dental)", ["Sa", "za", "sa"]),
    ]

    with httpx.Client(base_url=BACKEND_URL, timeout=30.0, trust_env=False) as client:
        for group_name, keys in contrast_groups:
            waveforms_sprite: dict[str, np.ndarray] = {}
            waveforms_api: dict[str, np.ndarray] = {}
            for k in keys:
                # 1. Inspect Plan 3 48kHz Sprite slice
                meta = sprites[k]
                sm = slice_sprite_wav(meta["offset"], meta["duration"])
                _assert_48k_dsp_invariants(sm, f"Sprite-{k}", min_rms=0.02)
                waveforms_sprite[k] = sm["samples"]

                # 2. Inspect Plan 1 /api/syllable/{k} dynamic female synthesis
                resp = client.get(f"/api/syllable/{k}", params={"voice": "female", "rate": 1.0, "format": "json"})
                assert resp.status_code == 200
                am = decode_base64_wav(resp.json()["audioBase64Wav"])
                _assert_48k_dsp_invariants(am, f"API-female-{k}", min_rms=0.02)
                waveforms_api[k] = am["samples"]

            # Pairwise distinctness verification
            for i in range(len(keys)):
                for j in range(i + 1, len(keys)):
                    k1, k2 = keys[i], keys[j]
                    corr_s, l2_s = _pairwise_waveform_metrics(waveforms_sprite[k1], waveforms_sprite[k2])
                    assert abs(corr_s) < 0.80 and l2_s > 0.40, (
                        f"[{group_name} Sprite] {k1} vs {k2} not sufficiently distinct: corr={corr_s:.4f}, rel_l2={l2_s:.4f}"
                    )
                    corr_a, l2_a = _pairwise_waveform_metrics(waveforms_api[k1], waveforms_api[k2])
                    assert abs(corr_a) < 0.80 and l2_a > 0.40, (
                        f"[{group_name} API] {k1} vs {k2} not sufficiently distinct: corr={corr_a:.4f}, rel_l2={l2_a:.4f}"
                    )

        # Verify authentic Sanskrit jña (ज्ञ) != modern Hindi corruption gya (ग्य)
        r_jya = client.get("/api/syllable/jYa", params={"voice": "male", "rate": 1.0, "format": "json"}).json()
        r_gya = client.get("/api/syllable/gya", params={"voice": "male", "rate": 1.0, "format": "json"}).json()
        m_jya = decode_base64_wav(r_jya["audioBase64Wav"])
        m_gya = decode_base64_wav(r_gya["audioBase64Wav"])
        _assert_48k_dsp_invariants(m_jya, "jYa", min_rms=0.02)
        _assert_48k_dsp_invariants(m_gya, "gya", min_rms=0.02)
        corr_jg, l2_jg = _pairwise_waveform_metrics(m_jya["samples"], m_gya["samples"])
        assert abs(corr_jg) < 0.80 and l2_jg > 0.40, (
            f"Sanskrit jña (ज्ञ) collapsed into gya (ग्य): corr={corr_jg:.4f}, rel_l2={l2_jg:.4f}"
        )


# ============================================================================
# 3. Guru (—) > Laghu (⏑) Prosody Across All Voices & Speech Rates
# ============================================================================


@pytest.mark.parametrize("voice", ["male", "female", "mobile"])
@pytest.mark.parametrize("rate", [0.6, 1.0, 1.5])
def test_t5_guru_gt_laghu_across_all_voices_and_rates(voice: str, rate: float) -> None:
    """Verify Guru (—) > Laghu (⏑) duration ratio and DSP invariants across all voices (male, female, mobile) and rates (0.6, 1.0, 1.5)."""
    with httpx.Client(base_url=BACKEND_URL, timeout=30.0, trust_env=False) as client:
        for laghu_key, guru_key in [("ka", "kA"), ("ti", "tI"), ("pu", "pU")]:
            r_laghu = client.get(
                f"/api/syllable/{laghu_key}",
                params={"voice": voice, "rate": rate, "format": "json"},
            )
            r_guru = client.get(
                f"/api/syllable/{guru_key}",
                params={"voice": voice, "rate": rate, "format": "json"},
            )
            assert r_laghu.status_code == 200 and r_guru.status_code == 200
            d_laghu = r_laghu.json()
            d_guru = r_guru.json()
            assert d_laghu["meter"] == "⏑"
            assert d_guru["meter"] == "—"

            m_laghu = decode_base64_wav(d_laghu["audioBase64Wav"])
            m_guru = decode_base64_wav(d_guru["audioBase64Wav"])
            _assert_48k_dsp_invariants(m_laghu, f"{laghu_key}-{voice}-{rate}", min_rms=0.02)
            _assert_48k_dsp_invariants(m_guru, f"{guru_key}-{voice}-{rate}", min_rms=0.02)

            ratio = m_guru["duration_sec"] / m_laghu["duration_sec"]
            assert ratio >= 1.45, (
                f"[{voice} @ {rate}x] Expected Guru {guru_key} ({m_guru['duration_sec']:.3f}s) >= 1.45x "
                f"Laghu {laghu_key} ({m_laghu['duration_sec']:.3f}s), got ratio={ratio:.3f}"
            )

        # Full mantra synthesis at (voice, rate)
        r_tts = client.post(
            "/api/tts",
            json={
                "text": "गते गते पारगते बोधि स्वाहा",
                "voice": voice,
                "rate": rate,
                "response_format": "json",
            },
        )
        assert r_tts.status_code == 200
        tts_data = r_tts.json()
        m_tts = decode_base64_wav(tts_data["audioBase64Wav"])
        _assert_48k_dsp_invariants(m_tts, f"TTS-{voice}-{rate}", min_rms=0.02)

        timings = tts_data["syllableTimings"]
        laghu_ms = [t["durationMs"] for t in timings if t["meter"] == "⏑"]
        guru_ms = [t["durationMs"] for t in timings if t["meter"] == "—"]
        assert len(laghu_ms) >= 3 and len(guru_ms) >= 5
        assert np.mean(guru_ms) > np.mean(laghu_ms) * 1.25, (
            f"[{voice} @ {rate}x] Sentence Guru mean ({np.mean(guru_ms):.1f}ms) not > 1.25x Laghu mean ({np.mean(laghu_ms):.1f}ms)"
        )


def test_t5_monotonic_rate_scaling_across_all_voices() -> None:
    """Verify duration(rate=0.6) > duration(rate=1.0) > duration(rate=1.5) for all voices (male, female, mobile)."""
    with httpx.Client(base_url=BACKEND_URL, timeout=30.0, trust_env=False) as client:
        for voice in ("male", "female", "mobile"):
            durs = []
            for rate in (0.6, 1.0, 1.5):
                resp = client.post(
                    "/api/tts",
                    json={"text": "ॐ मणि पद्मे हूं", "voice": voice, "rate": rate},
                )
                assert resp.status_code == 200
                data = resp.json()
                m = decode_base64_wav(data["audioBase64Wav"])
                _assert_48k_dsp_invariants(m, f"RateScale-{voice}-{rate}", min_rms=0.02)
                durs.append(m["duration_sec"])
            assert durs[0] > durs[1] * 1.25, f"[{voice}] rate=0.6 ({durs[0]:.3f}s) not > 1.25x rate=1.0 ({durs[1]:.3f}s)"
            assert durs[1] > durs[2] * 1.20, f"[{voice}] rate=1.0 ({durs[1]:.3f}s) not > 1.20x rate=1.5 ({durs[2]:.3f}s)"


# ============================================================================
# 4. White-Box DSP Pipeline & Full 675-Slice Sprite Exhaustive Audit
# ============================================================================


def test_t5_whitebox_dsp_pipeline_and_675_sprite_slices_audit() -> None:
    """Stress-test upsample_to_48k, apply_dc_blocker, apply_mastering_envelope_48k, and audit all 675 sprite slices."""
    # 1. White-box DSP filter tests with severe DC bias (+0.85 on apply_dc_blocker, +0.08 on full mastering chain)
    for src_sr, expected_mult in [(16000, 3), (24000, 2), (48000, 1), (22050, 48000 / 22050)]:
        n_src = src_sr // 2  # 500ms
        t = np.arange(n_src, dtype=np.float32) / float(src_sr)
        extreme_dc_sig = 0.35 * np.sin(2.0 * np.pi * 240.0 * t) + 0.85
        dc_blocked = apply_dc_blocker(extreme_dc_sig)
        assert abs(float(np.mean(dc_blocked))) < 1e-5, f"apply_dc_blocker failed at {src_sr}Hz"

        biased_sig = 0.35 * np.sin(2.0 * np.pi * 240.0 * t) + 0.08
        up = upsample_to_48k(biased_sig, src_sr)
        assert abs(len(up) - int(round(n_src * expected_mult))) <= 2
        mastered = apply_mastering_envelope_48k(up)
        m = analyze_pcm_samples(mastered, TARGET_SAMPLE_RATE)
        _assert_48k_dsp_invariants(m, f"WhiteBox-DSP-{src_sr}Hz", min_rms=0.10)
        assert abs(m["peak"] - PEAK_TARGET_LINEAR) < 0.005

    # Empty array edge case must not raise or produce NaN
    empty_out = apply_mastering_envelope_48k(np.array([], dtype=np.float32))
    assert len(empty_out) == 0

    # 2. Exhaustive audit of all 675 slices in siddham_sprite_48k.wav & siddham_sprite_manifest.json
    manifest = load_sprite_manifest()
    sprites = manifest["sprites"]
    assert len(sprites) >= 675

    for key, meta in sprites.items():
        sm = slice_sprite_wav(meta["offset"], meta["duration"])
        assert sm["sample_rate"] == 48000
        assert sm["has_nan_or_inf"] is False, f"NaN/Inf in sprite slice {key}"
        assert 0.10 <= sm["peak"] <= 1.0, f"Invalid peak in sprite slice {key}: {sm['peak']}"
        assert sm["rms"] >= 0.015, f"Low RMS in sprite slice {key}: {sm['rms']}"
        if meta["meter"] in ("⏑", "—"):
            assert abs(sm["dc_offset"]) < 0.005, (
                f"Voiced sprite slice {key} has |dc_offset|={abs(sm['dc_offset']):.6f} >= 0.005"
            )

    # 3. Verify all 34 consonants x 5 short/long vowel pairs + CaM/CaH obey Guru > 1.4x Laghu in sprite
    for c in MATRIX_CONSONANTS:
        for sv, lv in [("a", "A"), ("i", "I"), ("u", "U"), ("f", "F"), ("x", "X")]:
            d_short = float(sprites[f"{c}{sv}"]["duration"])
            d_long = float(sprites[f"{c}{lv}"]["duration"])
            assert d_long > d_short * 1.40, (
                f"Sprite Guru/Laghu violation on {c}{lv} ({d_long:.3f}s) vs {c}{sv} ({d_short:.3f}s)"
            )
        d_ca = float(sprites[f"{c}a"]["duration"])
        assert float(sprites[f"{c}aM"]["duration"]) > d_ca * 1.40
        assert float(sprites[f"{c}aH"]["duration"]) > d_ca * 1.40


def test_t5_api_security_path_traversal_and_parameter_clamping() -> None:
    """Verify path traversal rejection, extreme rate clamping, unknown voice fallback, and OGG/Opus format headers."""
    with httpx.Client(base_url=BACKEND_URL, timeout=30.0, trust_env=False) as client:
        # Path traversal attempts must return 404 (never leak files outside CACHE_DIR)
        for traversal in [
            "/api/tts/cache/..%2F..%2FPROJECT.md",
            "/api/tts/cache/..%2F..%2Fbackend%2Ftts_server.py",
            "/api/tts/cache/nonexistent_file_12345.wav",
        ]:
            r_trav = client.get(traversal)
            assert r_trav.status_code in (400, 404), f"Unexpected status {r_trav.status_code} on {traversal}"

        # Extreme low rate (0.05 -> clamped to 0.5) & extreme high rate (99.0 -> clamped to 2.0) & unknown voice
        r_low = client.post("/api/tts", json={"text": "स्वाहा", "voice": "nonexistent_voice", "rate": 0.05})
        r_high = client.post("/api/tts", json={"text": "स्वाहा", "voice": "nonexistent_voice", "rate": 99.0})
        assert r_low.status_code == 200 and r_high.status_code == 200
        d_low = r_low.json()
        d_high = r_high.json()
        assert d_low["voice"] == "male"
        assert float(d_low["durationSec"]) > float(d_high["durationSec"]) * 2.0

        m_low = decode_base64_wav(d_low["audioBase64Wav"])
        m_high = decode_base64_wav(d_high["audioBase64Wav"])
        _assert_48k_dsp_invariants(m_low, "Clamped-Low-Rate", min_rms=0.02)
        _assert_48k_dsp_invariants(m_high, "Clamped-High-Rate", min_rms=0.02)

        # Single syllable OGG/Opus negotiation + X-Syllable-Timings & X-Audio-Source headers
        r_syl_ogg = client.get("/api/syllable/hrIH", params={"format": "opus"})
        assert r_syl_ogg.status_code == 200
        assert r_syl_ogg.headers["content-type"].startswith("audio/ogg")
        assert r_syl_ogg.headers.get("x-sample-rate") == "48000"
        assert r_syl_ogg.headers.get("x-audio-source") in ("neural-sprite", "neural-tts")
        timings_hdr = json.loads(r_syl_ogg.headers["x-syllable-timings"])
        assert len(timings_hdr) == 1 and timings_hdr[0]["slp1"] == "hrIH" and timings_hdr[0]["meter"] == "—"
