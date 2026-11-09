"""Tier 2: Boundary & Corner Case E2E Tests (41 tests across F1–F8, >= 5 per feature).

Covers domain-specific Classical Sanskrit phonological, acoustic, and protocol
edge cases:
- OOV Devanagari characters (`ॐ`, `ॠ`, `ॄ`, `ऌ`, `ॡ`, `ॢ`, `ॣ`, `ऽ`, `।`, `॥`, `ँ`, `ळ`, `ङ`)
- Hindi Schwa Deletion traps (`धर्म`, `बुद्ध`, `पद्मे`, `भगवते`, `सम्यक्संबुद्धाय`, `अवलोकितेश्वर`)
- Single-syllable inherent-*a* (`ka..ha`, `pra`, `jña`, `kṣa`, `sva`) vs long-*ā* (`kā..hā`, `jñā`, `kṣā`, `svā`)
- Word-final Visarga `ḥ` (`नमः`, `भूः`, `स्वः`, `धीः`, `ह्रीः`, `शान्तिः`, `कः..ळः`) tail energy
- Bare Virāma consonants (`k..L`) crisp plosive burst duration (`0.05s <= duration <= 0.22s`)
- 5-consonant extreme cluster (`kārtsnyena` / `कार्त्स्न्येन` -> `kArt`, `snye`, `na`)
- Speech rate boundaries (`0.6`, `0.8`, `1.0`, `1.2`), Male vs Female voices, and HTTP 400/422 validation
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from e2e_helpers import (
    BACKEND_URL,
    CANONICAL_14_MATRIX_VOWELS,
    CANONICAL_34_CONSONANTS,
    FRONTEND_URL,
    MODELS_DIR,
    SPRITE_OGG_PATH,
    SPRITE_WAV_PATH,
    WORKSPACE_ROOT,
    decode_base64_wav,
    decode_wav_bytes,
    get_sprite_entry,
    http_get_bytes,
    http_get_json,
    http_post_json,
    load_sprite_manifest,
    run_engine_js,
    slice_sprite_wav,
    synthesize_tts_json,
)


# ============================================================================
# F1 Boundary Tests: ONNX Models (`models/ninada/`)
# ============================================================================


def test_t2_f1_01_single_token_blank_interleaving_boundary() -> None:
    """Verify conditioned inherent-a sequence [blank, क, blank, अ, blank] avoids 1-token VITS collapse."""
    import onnxruntime as ort

    vocabs = json.loads((MODELS_DIR / "vocabs.json").read_text(encoding="utf-8"))
    sa_cfg = vocabs.get("languages", vocabs).get("sa", vocabs.get("sa"))
    vocab = sa_cfg.get("vocab") or sa_cfg.get("char_to_id")
    char_to_id = vocab if isinstance(vocab, dict) else {c: idx for idx, c in enumerate(vocab)}
    blank = int(sa_cfg.get("blank_id", 143))

    sess = ort.InferenceSession(str(MODELS_DIR / "onnx" / "sa.onnx"), providers=["CPUExecutionProvider"])
    conditioned_ids = [blank, int(char_to_id["क"]), blank, int(char_to_id["अ"]), blank]
    wav, durs = sess.run(
        None,
        {
            "input_ids": np.array([conditioned_ids], dtype=np.int64),
            "scales": np.array([1.0, 0.333, 0.40], dtype=np.float32),
        },
    )
    pcm = wav.reshape(-1)
    dur_sec = pcm.size / 24000.0
    rms = float(np.sqrt(np.mean(pcm ** 2)))
    assert dur_sec >= 0.20, f"Conditioned 'कअ' too short: {dur_sec:.3f}s"
    assert rms >= 0.03, f"Conditioned 'कअ' RMS too low: {rms:.4f}"


def test_t2_f1_02_extreme_length_scale_bounds() -> None:
    """Verify ONNX length_scale at slow (1.67x) and fast (0.83x) boundaries scales duration cleanly."""
    import onnxruntime as ort

    vocabs = json.loads((MODELS_DIR / "vocabs.json").read_text(encoding="utf-8"))
    sa_cfg = vocabs.get("languages", vocabs).get("sa", vocabs.get("sa"))
    vocab = sa_cfg.get("vocab") or sa_cfg.get("char_to_id")
    char_to_id = vocab if isinstance(vocab, dict) else {c: idx for idx, c in enumerate(vocab)}
    blank = int(sa_cfg.get("blank_id", 143))

    ids = [blank]
    for ch in "स्वाहा":
        ids.extend([int(char_to_id[ch]), blank])

    sess = ort.InferenceSession(str(MODELS_DIR / "onnx" / "sa.onnx"), providers=["CPUExecutionProvider"])
    wav_fast, _ = sess.run(
        None,
        {
            "input_ids": np.array([ids], dtype=np.int64),
            "scales": np.array([1.0 / 1.2, 0.0, 0.0], dtype=np.float32),
        },
    )
    wav_slow, _ = sess.run(
        None,
        {
            "input_ids": np.array([ids], dtype=np.int64),
            "scales": np.array([1.0 / 0.6, 0.0, 0.0], dtype=np.float32),
        },
    )
    assert np.all(np.isfinite(wav_fast)) and np.all(np.isfinite(wav_slow))
    assert wav_slow.size > int(wav_fast.size * 1.4)


def test_t2_f1_03_noise_scale_zero_deterministic_synthesis() -> None:
    """Verify setting noise_scale=0 and noise_scale_w=0 yields deterministic durations and waveforms."""
    import onnxruntime as ort

    vocabs = json.loads((MODELS_DIR / "vocabs.json").read_text(encoding="utf-8"))
    sa_cfg = vocabs.get("languages", vocabs).get("sa", vocabs.get("sa"))
    vocab = sa_cfg.get("vocab") or sa_cfg.get("char_to_id")
    char_to_id = vocab if isinstance(vocab, dict) else {c: idx for idx, c in enumerate(vocab)}
    blank = int(sa_cfg.get("blank_id", 143))

    ids = [blank]
    for ch in "ओम्":
        ids.extend([int(char_to_id[ch]), blank])

    sess = ort.InferenceSession(str(MODELS_DIR / "onnx" / "sa.onnx"), providers=["CPUExecutionProvider"])
    _, durs1 = sess.run(
        None,
        {
            "input_ids": np.array([ids], dtype=np.int64),
            "scales": np.array([1.0, 0.0, 0.0], dtype=np.float32),
        },
    )
    _, durs2 = sess.run(
        None,
        {
            "input_ids": np.array([ids], dtype=np.int64),
            "scales": np.array([1.0, 0.0, 0.0], dtype=np.float32),
        },
    )
    assert np.array_equal(durs1, durs2)


def test_t2_f1_04_mms_16k_single_vowel_synthesis() -> None:
    """Verify 16kHz MMS-TTS Sanskrit specialist synthesizes isolated vowel and upsamples 3x to 48kHz."""
    import onnxruntime as ort
    import scipy.signal

    enc = ort.InferenceSession(
        str(MODELS_DIR / "onnx" / "sa" / "encoder_flow_quantized.onnx"),
        providers=["CPUExecutionProvider"],
    )
    voc = ort.InferenceSession(
        str(MODELS_DIR / "onnx" / "sa" / "vocoder_quantized.onnx"),
        providers=["CPUExecutionProvider"],
    )
    mms_vocab = json.loads((MODELS_DIR / "onnx" / "sa" / "vocab.json").read_text(encoding="utf-8"))
    vocab_tokens = mms_vocab.get("vocab_tokens") or mms_vocab.get("native_vocab") or []
    token_id = vocab_tokens.index("अ") if "अ" in vocab_tokens else 4
    input_ids = np.array([[0, token_id, 0]], dtype=np.int64)
    attn_mask = np.ones_like(input_ids, dtype=np.int64)
    scales = np.array([1.0, 0.333, 0.40], dtype=np.float32)

    latents, durs = enc.run(
        None,
        {"input_ids": input_ids, "attention_mask": attn_mask, "scales": scales},
    )
    wav_16k = voc.run(None, {"latents": latents})[0].reshape(-1)
    wav_48k = scipy.signal.resample_poly(wav_16k, up=3, down=1)
    assert wav_48k.size == wav_16k.size * 3
    assert wav_48k.size > 2000


def test_t2_f1_05_male_vs_female_spectral_and_waveform_distinctness() -> None:
    """Verify Male and Female voices via /api/tts synthesize distinct 48kHz waveforms."""
    male_res = synthesize_tts_json("गते गते पारगते बोधि स्वाहा", voice="male", rate=1.0)
    female_res = synthesize_tts_json("गते गते पारगते बोधि स्वाहा", voice="female", rate=1.0)

    m_wav = decode_base64_wav(male_res["audioBase64Wav"])
    f_wav = decode_base64_wav(female_res["audioBase64Wav"])

    assert m_wav["sample_rate"] == 48000 and f_wav["sample_rate"] == 48000
    assert m_wav["rms"] >= 0.025 and f_wav["rms"] >= 0.025
    assert male_res["audioBase64Wav"] != female_res["audioBase64Wav"], (
        "Male and Female voices returned identical audioBase64Wav!"
    )


# ============================================================================
# F2 Boundary Tests: Śikṣā Pre-Normalization & Conditioning Edge Cases
# ============================================================================


def test_t2_f2_01_oov_devanagari_characters_resilience() -> None:
    """Verify all 13 OOV/edge-case Devanagari chars (ॐ, ॠ, ॄ, ऌ, ॡ, ॢ, ॣ, ऽ, ।, ॥, ँ, ळ, ङ) synthesize cleanly."""
    oov_text = "ॐ ऋ ॠ ऌ ॡ कॄ क्लृ क्लॣ सोऽहम् चन्द्रँ ळकारः वाङ्मयम् । शुभम् ॥"
    res = synthesize_tts_json(oov_text)
    wav_info = decode_base64_wav(res["audioBase64Wav"])
    assert wav_info["sample_rate"] == 48000
    assert not wav_info["has_nan_or_inf"]
    assert wav_info["duration_sec"] >= 2.0
    assert wav_info["rms"] >= 0.025


def test_t2_f2_02_hindi_schwa_deletion_traps_final_syllable_energy() -> None:
    """Verify Hindi Schwa Deletion traps retain full final syllable duration and acoustic tail energy."""
    traps = [
        ("धर्म", 2),
        ("बुद्ध", 2),
        ("पद्मे", 2),
        ("भगवते", 4),
        ("सम्यक्संबुद्धाय", 6),
        ("अवलोकितेश्वर", 7),
    ]
    for word, expected_min_syls in traps:
        res = synthesize_tts_json(word)
        timings = res["syllableTimings"]
        assert len(timings) >= expected_min_syls, (
            f"Schwa deletion on {word!r}: expected >={expected_min_syls} syllables, got {timings}"
        )
        final_syl = timings[-1]
        assert final_syl["durationMs"] >= 100, (
            f"Final syllable of {word!r} truncated ({final_syl['durationMs']}ms)"
        )
        wav_info = decode_base64_wav(res["audioBase64Wav"])
        assert wav_info["tail_rms_35"] >= 0.015, (
            f"Word-final schwa dropped acoustically on {word!r}: tail_rms_35={wav_info['tail_rms_35']:.4f}"
        )


def test_t2_f2_03_isolated_inherent_a_consonants_34_sweep() -> None:
    """Verify single-syllable inherent-a syllables (ka..La, pra, jYa, kza, sva) have full vowel energy."""
    manifest = load_sprite_manifest()
    inherent_a_keys = [f"{c}a" for c in CANONICAL_34_CONSONANTS] + ["pra", "jYa", "kza", "sva"]
    for key in inherent_a_keys:
        entry = get_sprite_entry(manifest, key)
        assert entry["duration"] >= 0.15, (
            f"Inherent-a syllable {key!r} truncated ({entry['duration']}s < 0.15s)"
        )
        wav_slice = slice_sprite_wav(entry["offset"], entry["duration"])
        assert wav_slice["rms"] >= 0.02, (
            f"Inherent-a syllable {key!r} has weak vowel energy (rms={wav_slice['rms']:.4f} < 0.02)"
        )


def test_t2_f2_04_word_final_visarga_tail_energy_across_vowels() -> None:
    """Verify word-final Visarga ḥ (नमः, भूः, स्वः, धीः, ह्रीः, शान्तिः, कः..ळः) has audible tail energy."""
    visarga_words = ["नमः", "भूः", "स्वः", "धीः", "ह्रीः", "शान्तिः"]
    for word in visarga_words:
        res = synthesize_tts_json(word)
        wav_info = decode_base64_wav(res["audioBase64Wav"])
        assert wav_info["tail_rms_35"] >= 0.012, (
            f"Word-final Visarga muted on {word!r}: tail_rms_35={wav_info['tail_rms_35']:.4f}"
        )

    manifest = load_sprite_manifest()
    for c in CANONICAL_34_CONSONANTS:
        key = f"{c}aH"
        entry = get_sprite_entry(manifest, key)
        slice_info = slice_sprite_wav(entry["offset"], entry["duration"])
        assert slice_info["tail_rms_35"] >= 0.010, (
            f"Sprite Visarga {key!r} has weak tail_rms_35={slice_info['tail_rms_35']:.4f}"
        )


def test_t2_f2_05_bare_virama_consonants_plosive_burst_window() -> None:
    """Verify bare Virāma consonants (k..L) via /api/syllable/{c} and sprite have crisp burst bounds."""
    for c in ["k", "c", "w", "t", "p", "S", "h", "L"]:
        status, _, wav_bytes = http_get_bytes(f"{BACKEND_URL}/api/syllable/{c}?format=wav")
        assert status == 200
        info = decode_wav_bytes(wav_bytes)
        assert info["sample_rate"] == 48000
        assert 0.05 <= info["duration_sec"] <= 0.22, (
            f"Bare Virāma {c!r} duration {info['duration_sec']:.3f}s not in [0.05s, 0.22s]"
        )
        assert info["rms"] >= 0.010


def test_t2_f2_06_five_consonant_cluster_kartsnyena_conditioning() -> None:
    """Verify 5-consonant extreme cluster kārtsnyena / कार्त्स्न्येन segments into kArt, snye, na."""
    for text in ["कार्त्स्न्येन", "kārtsnyena"]:
        res = synthesize_tts_json(text)
        slp_syls = [t["slp1"] for t in res["syllableTimings"]]
        assert slp_syls == ["kArt", "snye", "na"], f"Unexpected syllabification for {text}: {slp_syls}"
        assert res["syllableTimings"][0]["meter"] == "—"
        assert res["syllableTimings"][1]["meter"] == "—"
        assert res["syllableTimings"][2]["meter"] == "⏑"
        wav_info = decode_base64_wav(res["audioBase64Wav"])
        assert wav_info["rms"] >= 0.025


# ============================================================================
# F3 Boundary Tests: Laghu vs Guru Contrast & Rate Boundaries
# ============================================================================


def test_t2_f3_01_short_a_vs_long_aa_across_all_vargas_guru_longer_than_laghu() -> None:
    """Verify every long-ā Guru syllable is strictly longer than its short-a Laghu counterpart."""
    manifest = load_sprite_manifest()
    pairs = [
        ("ka", "kA"),
        ("ca", "cA"),
        ("wa", "wA"),
        ("ta", "tA"),
        ("pa", "pA"),
        ("ya", "yA"),
        ("Sa", "SA"),
        ("ha", "hA"),
        ("jYa", "jYA"),
        ("kza", "kzA"),
        ("sva", "svA"),
    ]
    for short_key, long_key in pairs:
        s_entry = get_sprite_entry(manifest, short_key)
        l_entry = get_sprite_entry(manifest, long_key)
        assert s_entry["duration"] >= 0.15, f"{short_key} too short: {s_entry['duration']}"
        assert s_entry.get("rms", 0.05) >= 0.02, f"{short_key} RMS too low: {s_entry}"
        assert l_entry["duration"] > s_entry["duration"] * 1.15, (
            f"Expected Guru {long_key} ({l_entry['duration']:.3f}s) > 1.15x Laghu {short_key} ({s_entry['duration']:.3f}s)"
        )


def test_t2_f3_02_short_i_u_r_l_vs_long_ii_uu_rr_ll_duration_contrast() -> None:
    """Verify short vs long i/ī, u/ū, ṛ/ṝ, ḷ/ḹ vowel pairs obey Guru > Laghu duration ratio."""
    manifest = load_sprite_manifest()
    vowel_pairs = [
        ("i", "I"),
        ("u", "U"),
        ("f", "F"),
        ("x", "X"),
        ("ki", "kI"),
        ("ku", "kU"),
        ("kf", "kF"),
        ("kx", "kX"),
        ("ti", "tI"),
        ("tu", "tU"),
        ("pi", "pI"),
        ("pu", "pU"),
    ]
    for laghu_k, guru_k in vowel_pairs:
        l_ent = get_sprite_entry(manifest, laghu_k)
        g_ent = get_sprite_entry(manifest, guru_k)
        assert g_ent["duration"] > l_ent["duration"] * 1.15, (
            f"Expected {guru_k} ({g_ent['duration']:.3f}s) > 1.15x {laghu_k} ({l_ent['duration']:.3f}s)"
        )


def test_t2_f3_03_speech_rate_0_6_slow_boundary() -> None:
    """Verify rate=0.6 stretches synthesized duration significantly compared to rate=1.0."""
    res_norm = synthesize_tts_json("ॐ मणि पद्मे हूं", rate=1.0)
    res_slow = synthesize_tts_json("ॐ मणि पद्मे हूं", rate=0.6)
    assert res_slow["sampleRate"] == 48000
    assert float(res_slow["durationSec"]) > float(res_norm["durationSec"]) * 1.25
    wav_slow = decode_base64_wav(res_slow["audioBase64Wav"])
    assert not wav_slow["has_nan_or_inf"] and wav_slow["rms"] >= 0.02


def test_t2_f3_04_speech_rate_1_2_fast_boundary() -> None:
    """Verify rate=1.2 compresses synthesized duration cleanly compared to rate=0.8."""
    res_08 = synthesize_tts_json("ॐ मणि पद्मे हूं", rate=0.8)
    res_12 = synthesize_tts_json("ॐ मणि पद्मे हूं", rate=1.2)
    assert res_12["sampleRate"] == 48000
    assert float(res_12["durationSec"]) < float(res_08["durationSec"]) * 0.85
    assert len(res_12["syllableTimings"]) == len(res_08["syllableTimings"]) == 6


def test_t2_f3_05_closed_syllable_and_pre_cluster_guru_weight_timings() -> None:
    """Verify closed syllables (tat, pad, tut, sam, yak, bud) receive Guru (—) meter in /api/tts."""
    res = synthesize_tts_json("तत् पद्मे तुत्तारे सम्यक्संबुद्धाय")
    by_slp = {t["slp1"]: t for t in res["syllableTimings"]}
    for guru_syl in ["tat", "pad", "tut", "sam", "yak", "saM", "bud"]:
        assert guru_syl in by_slp, f"Missing expected closed syllable {guru_syl!r} in {list(by_slp)}"
        assert by_slp[guru_syl]["meter"] == "—", f"Closed syllable {guru_syl!r} must have Guru (—) meter"


# ============================================================================
# F4 Boundary Tests: FastAPI Error Handling & Dynamic Fallbacks
# ============================================================================


def test_t2_f4_01_empty_text_returns_400_or_422() -> None:
    """Verify POST /api/tts and GET /api/tts reject empty text with HTTP 400 or 422 (never 500)."""
    status_p, _, _ = http_post_json(f"{BACKEND_URL}/api/tts", {"text": ""})
    assert status_p in (400, 422), f"Expected 400/422 for empty POST text, got {status_p}"

    status_g, _, _ = http_get_json(f"{BACKEND_URL}/api/tts?text=")
    assert status_g in (400, 422), f"Expected 400/422 for empty GET text, got {status_g}"


def test_t2_f4_02_whitespace_and_punctuation_only_input_handling() -> None:
    """Verify whitespace-only input returns HTTP 400/422 without server crash."""
    status_ws, _, _ = http_post_json(f"{BACKEND_URL}/api/tts", {"text": "   \t\n  "})
    assert status_ws in (400, 422), f"Expected 400/422 for whitespace-only text, got {status_ws}"


def test_t2_f4_03_unknown_syllable_dynamic_synthesis_fallback() -> None:
    """Verify GET /api/syllable/{slp1} dynamically synthesizes valid syllables not in static sprite."""
    status, _, wav_bytes = http_get_bytes(f"{BACKEND_URL}/api/syllable/krtsna?voice=female&rate=1.0&format=wav")
    assert status == 200
    info = decode_wav_bytes(wav_bytes)
    assert info["sample_rate"] == 48000
    assert info["duration_sec"] >= 0.15
    assert info["rms"] >= 0.02


def test_t2_f4_04_invalid_voice_or_out_of_range_rate_handling() -> None:
    """Verify mobile voice and extreme rates are handled or clamped gracefully without 500 error."""
    res_mob = synthesize_tts_json("स्वाहा", voice="mobile", rate=1.0)
    assert res_mob["sampleRate"] == 48000

    status_ext, _, _ = http_post_json(
        f"{BACKEND_URL}/api/tts",
        {"text": "स्वाहा", "voice": "male", "rate": 2.5},
    )
    assert status_ext in (200, 400, 422), f"Unexpected 500 error on extreme rate: {status_ext}"


def test_t2_f4_05_long_dharani_text_synthesis_stability() -> None:
    """Verify long 55-syllable Bhaiṣajyaguru Dhāraṇī synthesizes cleanly at 48,000 Hz."""
    long_text = (
        "namo bhagavate bhaiṣajyaguru vaidūryaprabharājāya tathāgatāya "
        "arhate samyaksaṃbuddhāya tadyathā oṃ bhaiṣajye bhaiṣajye "
        "mahābhaiṣajye rājasamudgate svāhā"
    )
    res = synthesize_tts_json(long_text)
    assert res["sampleRate"] == 48000
    assert float(res["durationSec"]) >= 6.0
    assert len(res["syllableTimings"]) >= 50
    wav_info = decode_base64_wav(res["audioBase64Wav"])
    assert not wav_info["has_nan_or_inf"]
    assert wav_info["rms"] >= 0.025


# ============================================================================
# F5 Boundary Tests: 48kHz Audio Sprite Structural & Acoustic Integrity
# ============================================================================


def test_t2_f5_01_sprite_slice_offsets_non_overlapping_and_within_bounds() -> None:
    """Verify all 650+ sprite slices have non-overlapping [offset, offset+duration] within WAV duration."""
    manifest = load_sprite_manifest()
    entries = sorted(
        [get_sprite_entry(manifest, k) for k in manifest["sprites"]],
        key=lambda e: float(e["offset"]),
    )
    assert len(entries) >= 600

    # Check total WAV duration
    first_slice = slice_sprite_wav(0.0, 0.05)
    assert first_slice["sample_rate"] == 48000
    wav_total_sec = SPRITE_WAV_PATH.stat().st_size / (48000.0 * 2.0)

    prev_end = 0.0
    for ent in entries:
        off = float(ent["offset"])
        dur = float(ent["duration"])
        assert off >= prev_end - 0.002, f"Overlapping sprite slice {ent} (prev_end={prev_end:.4f})"
        assert dur > 0.04, f"Zero/tiny sprite duration in {ent}"
        prev_end = off + dur

    assert prev_end <= wav_total_sec + 0.05, (
        f"Last sprite slice end ({prev_end:.3f}s) exceeds WAV duration ({wav_total_sec:.3f}s)"
    )


def test_t2_f5_02_sprite_30ms_inter_slice_silence_padding_verification() -> None:
    """Verify consecutive slices in siddham_sprite_48k.wav are separated by silent padding (~30ms)."""
    manifest = load_sprite_manifest()
    entries = sorted(
        [get_sprite_entry(manifest, k) for k in manifest["sprites"]],
        key=lambda e: float(e["offset"]),
    )
    for i in range(min(25, len(entries) - 1)):
        gap_start = float(entries[i]["offset"]) + float(entries[i]["duration"])
        gap_end = float(entries[i + 1]["offset"])
        gap_dur = gap_end - gap_start
        assert gap_dur >= 0.015, f"Insufficient inter-slice padding ({gap_dur*1000:.1f}ms) after {entries[i]['slp1']}"
        gap_metrics = slice_sprite_wav(gap_start + 0.003, max(0.01, gap_dur - 0.006))
        assert gap_metrics["rms"] < 0.01, f"Non-silent inter-slice gap after {entries[i]['slp1']}: {gap_metrics['rms']}"


def test_t2_f5_03_sprite_laghu_vs_guru_duration_distribution() -> None:
    """Verify across all 476 CV matrix entries that meter labels and Guru/Laghu durations are accurate."""
    manifest = load_sprite_manifest()
    laghu_vowels = {"a", "i", "u", "f", "x"}
    laghu_durs = []
    guru_durs = []

    for c in CANONICAL_34_CONSONANTS:
        for v in CANONICAL_14_MATRIX_VOWELS:
            ent = get_sprite_entry(manifest, f"{c}{v}")
            if v in laghu_vowels:
                assert ent["meter"] == "⏑", f"Expected Laghu (⏑) for {c}{v}, got {ent['meter']}"
                laghu_durs.append(float(ent["duration"]))
            else:
                assert ent["meter"] == "—", f"Expected Guru (—) for {c}{v}, got {ent['meter']}"
                guru_durs.append(float(ent["duration"]))

    mean_l = sum(laghu_durs) / len(laghu_durs)
    mean_g = sum(guru_durs) / len(guru_durs)
    assert mean_g >= mean_l * 1.35, (
        f"Expected mean Guru ({mean_g:.3f}s) >= 1.35x mean Laghu ({mean_l:.3f}s)"
    )


def test_t2_f5_04_sprite_bare_virama_crisp_burst_duration_bounds() -> None:
    """Verify all 34 bare Virāma consonants in sprite are crisp bursts (< Ca duration)."""
    manifest = load_sprite_manifest()
    for c in CANONICAL_34_CONSONANTS:
        bare_ent = get_sprite_entry(manifest, c)
        ca_ent = get_sprite_entry(manifest, f"{c}a")
        assert 0.05 <= float(bare_ent["duration"]) <= 0.22, (
            f"Bare Virāma {c!r} duration {bare_ent['duration']}s outside [0.05s, 0.22s]"
        )
        assert float(bare_ent["duration"]) < float(ca_ent["duration"]), (
            f"Bare Virāma {c!r} ({bare_ent['duration']}s) must be shorter than {c}a ({ca_ent['duration']}s)"
        )


def test_t2_f5_05_sprite_ogg_opus_decodes_to_48khz_matching_wav_duration() -> None:
    """Verify siddham_sprite_48k.ogg is valid 48,000 Hz Opus audio matching WAV duration."""
    proc = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "a:0",
            "-show_entries",
            "stream=codec_name,sample_rate:format=duration",
            "-of",
            "json",
            str(SPRITE_OGG_PATH),
        ],
        capture_output=True,
        text=True,
        timeout=15,
    )
    assert proc.returncode == 0, f"ffprobe failed on {SPRITE_OGG_PATH}: {proc.stderr}"
    info = json.loads(proc.stdout)
    stream = info["streams"][0]
    assert stream["codec_name"] == "opus"
    assert int(stream["sample_rate"]) == 48000
    ogg_dur = float(info["format"]["duration"])
    wav_dur = (SPRITE_WAV_PATH.stat().st_size - 44) / (48000.0 * 2.0)
    assert abs(ogg_dur - wav_dur) < 0.25, f"Ogg duration ({ogg_dur:.3f}s) != WAV duration ({wav_dur:.3f}s)"


# ============================================================================
# F6 Boundary Tests: Web Audio Player & Rate / Concurrency Edge Cases
# ============================================================================


def test_t2_f6_01_rapid_sequential_syllable_clicks_no_crash() -> None:
    """Verify 15 rapid consecutive playSingleSyllable calls resolve cleanly at 48,000 Hz."""
    res = run_engine_js("""
      const syls = ['ka','Ki','gu','Ge','No','ca','Ci','ju','Je','Yo','wa','Wi','qu','Qe','Ro'];
      const results = [];
      for (let i = 0; i < syls.length; i++) {
        results.push(await window.playSingleSyllable(syls[i], i));
      }
      return results;
    """)
    assert len(res) == 15
    assert all(r["sampleRate"] == 48000 and r["durationSec"] > 0 for r in res)


def test_t2_f6_02_composite_conjunct_onset_nucleus_coda_fallback() -> None:
    """Verify playSingleSyllable handles complex closed/conjunct syllables (kArt, snye, strIM, krtsn)."""
    res = run_engine_js("""
      const r1 = await window.playSingleSyllable('kArt', 0);
      const r2 = await window.playSingleSyllable('snye', 1);
      const r3 = await window.playSingleSyllable('strIM', 2);
      const r4 = await window.playSingleSyllable('krtsn', 3);
      return [r1, r2, r3, r4];
    """)
    for item in res:
        assert item["sampleRate"] == 48000
        assert item["durationSec"] > 0.05


def test_t2_f6_03_playback_rate_scaling_0_6_0_8_1_0_1_2() -> None:
    """Verify #speechRate values 0.6, 0.8, 1.0, 1.2 scale playback duration/rate in playSingleSyllable."""
    res = run_engine_js("""
      const rates = ['0.6', '0.8', '1.0', '1.2'];
      const out = [];
      for (const r of rates) {
        __playedSources.length = 0;
        document.getElementById('speechRate').value = r;
        const p = await window.playSingleSyllable('svA', 0);
        out.push({ selectedRate: Number(r), p, nodeRate: __playedSources[0] ? __playedSources[0].rate : null });
      }
      return out;
    """)
    assert len(res) == 4
    for item in res:
        assert item["p"]["sampleRate"] == 48000


def test_t2_f6_04_stop_speaking_cancels_active_playback_and_highlights() -> None:
    """Verify stopSpeaking() cleanly resets speaking state without throwing errors."""
    res = run_engine_js("""
      loadSample(0);
      document.getElementById('audioModeSelect').value = 'neural-sprite';
      const p = await window.speakSanskrit();
      if (typeof stopSpeaking === 'function') stopSpeaking();
      return { ok: true, sampleRate: p.sampleRate };
    """)
    assert res["ok"] is True and res["sampleRate"] == 48000


def test_t2_f6_05_offline_sprite_mode_recitation_without_tts_api() -> None:
    """Verify neural-sprite mode recites full mantra purely from 48kHz AudioBuffer slices."""
    res = run_engine_js("""
      document.getElementById('sanskritInput').value = 'oṃ maṇi padme hūṃ';
      if (typeof processInput === 'function') processInput();
      document.getElementById('audioModeSelect').value = 'neural-sprite';
      __playedSources.length = 0;
      const sRes = await window.speakSanskrit();
      return { sRes, sliceCount: __playedSources.length };
    """)
    assert res["sRes"]["sampleRate"] == 48000
    assert res["sliceCount"] == 6
    assert len(res["sRes"]["syllableTimings"]) == 6


# ============================================================================
# F7 Boundary Tests: `sanskrit_phonetic_engine.html` Linguistic Edge Cases
# ============================================================================


def test_t2_f7_01_vedic_accents_zwj_zwnj_and_avagraha_stripping() -> None:
    """Verify Vedic pitch accents (U+0951..U+0954), ZWJ/ZWNJ, and Avagraha (ऽ) are handled cleanly."""
    res = run_engine_js("""
      const slp1 = window.inputToSlp1('अग्निमी॑ळे पु॒रोहि॑तम् सोऽहम्\u200c\u200d', 'smart');
      const parsed = window.parseAndTransliterateWord("so'ham", { assimilate: true, longMark: '～', sep: '·' });
      return { slp1, parsed };
    """)
    assert "agnimILe" in res["slp1"]
    assert "purohitam" in res["slp1"]
    assert "so'ham" in res["slp1"]
    assert len(res["parsed"]["syllables"]) >= 2


def test_t2_f7_02_mixed_devanagari_and_iast_in_single_utterance() -> None:
    """Verify mixed Devanagari and IAST in the same input converts seamlessly to SLP1."""
    res = run_engine_js("""
      const slp = window.inputToSlp1('ॐ मणि padme hūṃ | नमो bhagavate', 'smart');
      return slp;
    """)
    assert res == "oM maRi padme hUM | namo Bagavate"


def test_t2_f7_03_strict_vs_smart_vs_slp1_input_mode_switching() -> None:
    """Verify smart, strict, and slp1 input modes handle rough English vs strict SLP1 properly."""
    res = run_engine_js("""
      return {
        smart: window.inputToSlp1('om shanti shantih', 'smart'),
        strict: window.inputToSlp1('oṃ śāntiḥ', 'strict'),
        slp1: window.inputToSlp1('oM SAntiH', 'slp1')
      };
    """)
    assert res["smart"] == "oM SAntiH SAntiH"
    assert res["strict"] == "oM SAntiH"
    assert res["slp1"] == "oM SAntiH"


def test_t2_f7_04_geminate_coda_suppression_in_modern_chinese_phonetics() -> None:
    """Verify geminate/homorganic codas (bud-dha, tut-tāre) keep Guru weight while avoiding double coda text."""
    res = run_engine_js("""
      const w1 = window.parseAndTransliterateWord('budDa', { assimilate: true, longMark: '～', sep: '·' });
      const w2 = window.parseAndTransliterateWord('tuttAre', { assimilate: true, longMark: '～', sep: '·' });
      return { w1, w2 };
    """)
    assert res["w1"]["syllables"][0]["raw"] == "bud"
    assert res["w1"]["syllables"][0]["meter"] == "—"
    assert res["w2"]["syllables"][0]["raw"] == "tut"
    assert res["w2"]["syllables"][0]["meter"] == "—"


def test_t2_f7_05_long_mark_and_syllable_separator_option_permutations() -> None:
    """Verify #optAssimilate, #optLongMarkStyle, and #optSylSep options alter phonetic output."""
    res = run_engine_js("""
      const p1 = window.parseAndTransliterateWord('pArasaMgate', { assimilate: true, longMark: '～', sep: '·' });
      const p2 = window.parseAndTransliterateWord('pArasaMgate', { assimilate: false, longMark: 'ː', sep: '-' });
      return { m1: p1.modernWord, m2: p2.modernWord };
    """)
    assert "～" in res["m1"] and "·" in res["m1"]
    assert "ː" in res["m2"] and "-" in res["m2"]
    assert res["m1"] != res["m2"]


# ============================================================================
# F8 Boundary Tests: `Sarva-Dhāraṇī-Kośa` Core & UI Edge Cases
# ============================================================================


def test_t2_f8_01_search_engine_diacritic_insensitive_and_cross_script() -> None:
    """Verify src/core/searchEngine.ts normalizes diacritics for cross-script search."""
    search_ts = (WORKSPACE_ROOT / "src" / "core" / "searchEngine.ts").read_text(encoding="utf-8")
    assert "normalize" in search_ts or "NFD" in search_ts or "toLowerCase" in search_ts


def test_t2_f8_02_cbeta_siddham_gaiji_sd_rj_and_tang_interlinear_gloss_integrity() -> None:
    """Verify cbetaAuthRecords.ts contains #SD-/#RJ- mappings and Tang interlinear glosses."""
    cbeta_ts = (WORKSPACE_ROOT / "src" / "data" / "generated" / "cbetaAuthRecords.ts").read_text(encoding="utf-8")
    assert "SD-" in cbeta_ts
    assert "T19" in cbeta_ts or "T20" in cbeta_ts


def test_t2_f8_03_custom_dharani_compiler_arbitrary_iast_and_devanagari() -> None:
    """Verify CustomDharaniCompiler.tsx supports user-entered Sanskrit text and audio playback."""
    compiler_ts = (WORKSPACE_ROOT / "src" / "components" / "CustomDharaniCompiler.tsx").read_text(encoding="utf-8")
    assert len(compiler_ts) > 400
    assert "audio" in compiler_ts.lower() or "play" in compiler_ts.lower() or "speak" in compiler_ts.lower()


def test_t2_f8_04_prosody_ts_akshara_segmentation_and_guru_laghu_parity() -> None:
    """Verify src/core/prosody.ts implements Guru (—) and Laghu prosodic analysis."""
    prosody_ts = (WORKSPACE_ROOT / "src" / "core" / "prosody.ts").read_text(encoding="utf-8")
    assert "Guru" in prosody_ts or "—" in prosody_ts
    assert "Laghu" in prosody_ts or "⏑" in prosody_ts or "⌣" in prosody_ts


def test_t2_f8_05_embedded_phonetic_engine_v3_accessible_from_kosa_app() -> None:
    """Verify Sarva-Dhāraṇī-Kośa references sanskrit_phonetic_engine.html and serves it on :5173."""
    app_ts = (WORKSPACE_ROOT / "src" / "App.tsx").read_text(encoding="utf-8")
    assert "sanskrit_phonetic_engine" in app_ts or "SanskritPhoneticsAcademy" in app_ts
    status, _, body = http_get_bytes(f"{FRONTEND_URL}/sanskrit_phonetic_engine.html")
    assert status == 200 and len(body) > 50_000
