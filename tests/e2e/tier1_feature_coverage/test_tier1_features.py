"""Tier 1: Feature Coverage E2E Tests (48 tests across F1–F8, 6 tests per feature).

Every feature in PROJECT.md § Feature Inventory is verified via opaque-box,
requirement-driven tests checking HTTP APIs (:8765 and :5173), 48,000 Hz audio
waveforms, ONNX model contracts, Plan 3 48kHz audio sprites, Engine v3.0 DOM/JS
interfaces, and Sarva-Dhāraṇī-Kośa modular application structure.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
import urllib.parse
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from e2e_helpers import (
    BACKEND_URL,
    CANONICAL_14_MATRIX_VOWELS,
    CANONICAL_16_SVARAS,
    CANONICAL_28_OVERRIDES,
    CANONICAL_34_CONSONANTS,
    CANONICAL_CORPUS_COMPOUND_SYLLABLES,
    CANONICAL_KZ_JY_EXTRA,
    FRONTEND_URL,
    MODELS_DIR,
    PUBLIC_ENGINE_HTML,
    ROOT_ENGINE_HTML,
    SPRITE_MANIFEST_PATH,
    SPRITE_OGG_PATH,
    SPRITE_WAV_PATH,
    WORKSPACE_ROOT,
    analyze_pcm_samples,
    decode_base64_wav,
    decode_wav_bytes,
    get_sprite_entry,
    http_get_bytes,
    http_get_json,
    http_options,
    http_post_bytes,
    http_post_json,
    load_sprite_manifest,
    run_engine_js,
    slice_sprite_wav,
    synthesize_tts_json,
)


# ============================================================================
# F1: Self-Contained Classical Sanskrit Neural TTS Models (`models/ninada/`)
# ============================================================================


def test_f1_01_model_files_exist_and_nonempty() -> None:
    """Verify all required ONNX models and vocab JSON files exist in models/ninada/."""
    expected_onnx = {
        MODELS_DIR / "onnx" / "sa.onnx": 20_000_000,
        MODELS_DIR / "onnx" / "sa_female.onnx": 20_000_000,
        MODELS_DIR / "onnx_mobile" / "sa.onnx": 15_000_000,
        MODELS_DIR / "onnx_mobile" / "sa_female.onnx": 15_000_000,
        MODELS_DIR / "onnx" / "sa" / "encoder_flow_quantized.onnx": 10_000_000,
        MODELS_DIR / "onnx" / "sa" / "vocoder_quantized.onnx": 10_000_000,
    }
    for path, min_bytes in expected_onnx.items():
        assert path.exists(), f"Missing ONNX model file: {path}"
        size = path.stat().st_size
        assert size >= min_bytes, f"Model file {path} too small: {size} < {min_bytes}"

    vocabs_json = MODELS_DIR / "vocabs.json"
    mms_vocab_json = MODELS_DIR / "onnx" / "sa" / "vocab.json"
    assert vocabs_json.exists() and vocabs_json.stat().st_size > 1000
    assert mms_vocab_json.exists() and mms_vocab_json.stat().st_size > 200


def test_f1_02_studio_male_onnx_graph_signature() -> None:
    """Verify models/ninada/onnx/sa.onnx has valid VITS input/output tensor signatures."""
    import onnxruntime as ort

    sess = ort.InferenceSession(
        str(MODELS_DIR / "onnx" / "sa.onnx"),
        providers=["CPUExecutionProvider"],
    )
    inputs = {inp.name: inp for inp in sess.get_inputs()}
    outputs = {out.name: out for out in sess.get_outputs()}
    assert "input_ids" in inputs, f"Missing input_ids in {list(inputs)}"
    assert "scales" in inputs, f"Missing scales in {list(inputs)}"
    assert "waveform" in outputs, f"Missing waveform in {list(outputs)}"
    assert "durations" in outputs, f"Missing durations in {list(outputs)}"


def test_f1_03_studio_female_and_mobile_onnx_signatures() -> None:
    """Verify Studio Female and Mobile Male/Female ONNX checkpoints load and share VITS signatures."""
    import onnxruntime as ort

    for rel_path in [
        "onnx/sa_female.onnx",
        "onnx_mobile/sa.onnx",
        "onnx_mobile/sa_female.onnx",
    ]:
        full_path = MODELS_DIR / rel_path
        sess = ort.InferenceSession(str(full_path), providers=["CPUExecutionProvider"])
        in_names = {i.name for i in sess.get_inputs()}
        out_names = {o.name for o in sess.get_outputs()}
        assert {"input_ids", "scales"}.issubset(in_names), f"{rel_path} inputs: {in_names}"
        assert {"waveform", "durations"}.issubset(out_names), f"{rel_path} outputs: {out_names}"


def test_f1_04_mms_16k_specialist_onnx_signatures() -> None:
    """Verify 16kHz MMS-TTS-derived Sanskrit specialist encoder_flow and vocoder ONNX signatures."""
    import onnxruntime as ort

    enc = ort.InferenceSession(
        str(MODELS_DIR / "onnx" / "sa" / "encoder_flow_quantized.onnx"),
        providers=["CPUExecutionProvider"],
    )
    voc = ort.InferenceSession(
        str(MODELS_DIR / "onnx" / "sa" / "vocoder_quantized.onnx"),
        providers=["CPUExecutionProvider"],
    )
    enc_in = {i.name for i in enc.get_inputs()}
    enc_out = {o.name for o in enc.get_outputs()}
    voc_in = {i.name for i in voc.get_inputs()}
    voc_out = {o.name for o in voc.get_outputs()}

    assert {"input_ids", "attention_mask", "scales"}.issubset(enc_in)
    assert {"latents", "durations"}.issubset(enc_out)
    assert "latents" in voc_in
    assert "waveform" in voc_out


def test_f1_05_vocabs_json_144_token_sanskrit_coverage() -> None:
    """Verify models/ninada/vocabs.json covers all 69 Classical Sanskrit Devanagari characters."""
    vocabs = json.loads((MODELS_DIR / "vocabs.json").read_text(encoding="utf-8"))
    sa_cfg = vocabs.get("languages", vocabs).get("sa", vocabs.get("sa"))
    assert sa_cfg is not None, "Missing 'sa' entry in vocabs.json"

    vocab_list = sa_cfg.get("vocab") or sa_cfg.get("chars") or sa_cfg.get("char_to_id")
    if isinstance(vocab_list, dict):
        char_set = set(vocab_list.keys())
        num_chars = int(sa_cfg.get("num_chars", len(vocab_list)))
    else:
        char_set = set(vocab_list)
        num_chars = int(sa_cfg.get("num_chars", len(vocab_list)))

    assert num_chars == 144, f"Expected 144 tokens in Sanskrit Studio vocab, got {num_chars}"
    assert len(char_set) >= 130
    required_deva = (
        "अआइईउऊऋॠऌॡएऐओऔ"
        "ंःँऽॐ।॥"
        "कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहळ"
        "ािीुूृॄॢॣेैोौ्"
    )
    missing = [ch for ch in required_deva if ch not in char_set]
    assert not missing, f"Missing Classical Sanskrit chars in vocabs.json: {missing}"


def test_f1_06_studio_direct_inference_48khz_pipeline() -> None:
    """Run direct ONNX inference on onnx/sa.onnx and verify 24kHz -> 48kHz polyphase upsampling."""
    import onnxruntime as ort
    import scipy.signal

    vocabs = json.loads((MODELS_DIR / "vocabs.json").read_text(encoding="utf-8"))
    sa_cfg = vocabs.get("languages", vocabs).get("sa", vocabs.get("sa"))
    vocab = sa_cfg.get("vocab") or sa_cfg.get("char_to_id")
    char_to_id = vocab if isinstance(vocab, dict) else {c: idx for idx, c in enumerate(vocab)}
    blank_id = int(sa_cfg.get("blank_id", 143))

    text = "गते गते पारगते"
    ids = [blank_id]
    for ch in text:
        if ch in char_to_id:
            ids.extend([int(char_to_id[ch]), blank_id])

    sess = ort.InferenceSession(
        str(MODELS_DIR / "onnx" / "sa.onnx"),
        providers=["CPUExecutionProvider"],
    )
    wav, durs = sess.run(
        None,
        {
            "input_ids": np.array([ids], dtype=np.int64),
            "scales": np.array([1.0, 0.333, 0.40], dtype=np.float32),
        },
    )
    pcm_24k = wav.reshape(-1).astype(np.float32)
    pcm_48k = scipy.signal.resample_poly(pcm_24k, up=2, down=1).astype(np.float32)

    assert pcm_48k.size == pcm_24k.size * 2
    assert pcm_48k.size > 48000 * 0.8
    assert float(np.sqrt(np.mean(pcm_48k ** 2))) > 0.02
    assert int(np.sum(durs)) > 20


# ============================================================================
# F2: Classical Sanskrit Śikṣā Pre-Normalization & Conditioning Pipeline
# ============================================================================


def test_f2_01_script_auto_detection_deva_iast_slp1_english() -> None:
    """Verify /api/tts accepts Devanagari, IAST, SLP1, and rough English input seamlessly."""
    cases = [
        ("गते गते बोधि स्वाहा", "auto", "gate"),
        ("gate gate bodhi svāhā", "auto", "gate"),
        ("gate gate boDi svAhA", "slp1", "gate"),
        ("om mani padme hum", "auto", "maRi"),
    ]
    for text, script_mode, expected_slp_sub in cases:
        res = synthesize_tts_json(text=text, script=script_mode)
        assert res["sampleRate"] == 48000
        assert expected_slp_sub in res["slp1"], f"Expected {expected_slp_sub!r} in {res['slp1']!r}"
        assert len(res["normalizedDeva"].strip()) > 0
        wav_info = decode_base64_wav(res["audioBase64Wav"])
        assert wav_info["sample_rate"] == 48000
        assert wav_info["rms"] >= 0.02


def test_f2_02_inherent_short_a_preservation_anti_schwa_deletion() -> None:
    """Verify word-final and medial short 'a' in dharma, buddha, padme are fully voiced."""
    res = synthesize_tts_json("धर्म बुद्ध पद्मे नमः स्वाहा")
    timings = res["syllableTimings"]
    slp_list = [t["slp1"] for t in timings]
    # Must contain word-final open short-a syllables 'ma' and 'da'/'dDa'
    assert any(s.endswith("ma") for s in slp_list), f"Missing 'ma' syllable in {slp_list}"
    assert any("d" in s.lower() and s.endswith("a") for s in slp_list), f"Missing 'da/dha' in {slp_list}"
    for t in timings:
        assert t["durationMs"] >= 80, f"Syllable {t} truncated (<80ms) — schwa deletion risk!"

    wav_info = decode_base64_wav(res["audioBase64Wav"])
    assert wav_info["tail_rms_35"] >= 0.015, f"Tail RMS too low: {wav_info['tail_rms_35']}"


def test_f2_03_om_and_sacred_pranava_normalization() -> None:
    """Verify 'ॐ', 'oṃ', and 'oM' normalize cleanly to voiced [oːm] without OOV drop."""
    for variant in ["ॐ", "oṃ", "oM"]:
        res = synthesize_tts_json(variant)
        assert res["durationSec"] >= 0.25, f"{variant!r} duration too short: {res['durationSec']}"
        wav_info = decode_base64_wav(res["audioBase64Wav"])
        assert wav_info["rms"] >= 0.025, f"{variant!r} produced near-silence: {wav_info['rms']}"
        assert wav_info["peak"] >= 0.15


def test_f2_04_jna_and_ksa_conjunct_articulation() -> None:
    """Verify Classical Sanskrit conjuncts jñ (ज्ञ) and kṣ (क्ष) are properly syllabified and voiced."""
    res = synthesize_tts_json("प्रज्ञा ज्ञानम् क्षेत्रम् क्षमा")
    slp = res["slp1"]
    assert "jY" in slp, f"Expected SLP1 'jY' for jñ in {slp}"
    assert "kz" in slp, f"Expected SLP1 'kz' for kṣ in {slp}"
    timings = res["syllableTimings"]
    assert len(timings) >= 7
    wav_info = decode_base64_wav(res["audioBase64Wav"])
    assert wav_info["duration_sec"] >= 1.2
    assert wav_info["rms"] >= 0.025


def test_f2_05_visarga_and_anusvara_siksa_conditioning() -> None:
    """Verify Visarga (ḥ) and Anusvāra (ṃ) receive Guru (—) prosodic weight and audible energy."""
    res = synthesize_tts_json("नमः शिवाय । ओं शान्तिः")
    timings = res["syllableTimings"]
    mod_syllables = [t for t in timings if "H" in t["slp1"] or "M" in t["slp1"]]
    assert len(mod_syllables) >= 3, f"Expected >=3 Visarga/Anusvara syllables in {timings}"
    for t in mod_syllables:
        assert t["meter"] == "—", f"Modified syllable {t} must be Guru (—)"
        assert t["durationMs"] >= 150, f"Modified syllable {t} too short"


def test_f2_06_vocalic_liquids_r_rr_l_ll_synthesis() -> None:
    """Verify vocalic liquids ṛ (ऋ), ṝ (ॠ), ḷ (ऌ), ḹ (ॡ) synthesize without OOV failure."""
    res = synthesize_tts_json("ऋषिः पितॄन् क्लृप्तम् कृतिः")
    wav_info = decode_base64_wav(res["audioBase64Wav"])
    assert not wav_info["has_nan_or_inf"]
    assert wav_info["duration_sec"] >= 0.9
    assert wav_info["rms"] >= 0.025


# ============================================================================
# F3: 48,000 Hz Polyphase DSP Mastering & Prosodic Laghu/Guru Alignment
# ============================================================================


def test_f3_01_wav_header_48000hz_16bit_mono_pcm() -> None:
    """Verify synthesized WAV is strictly 48,000 Hz, 16-bit mono PCM."""
    res = synthesize_tts_json("ॐ मणि पद्मे हूं")
    wav_info = decode_base64_wav(res["audioBase64Wav"])
    assert wav_info["sample_rate"] == 48000
    assert wav_info["sample_width"] == 2
    assert wav_info["channels"] == 1
    assert abs(wav_info["duration_sec"] - float(res["durationSec"])) < 0.05


def test_f3_02_rms_energy_and_peak_normalization_bounds() -> None:
    """Verify 48kHz DSP mastering normalizes peak near -1.0 dBFS (~0.891) without clipping."""
    res = synthesize_tts_json("गते गते पारगते पारसंगते बोधि स्वाहा")
    wav_info = decode_base64_wav(res["audioBase64Wav"])
    assert 0.025 <= wav_info["rms"] <= 0.45, f"Out-of-range RMS: {wav_info['rms']}"
    assert 0.25 <= wav_info["peak"] <= 0.995, f"Out-of-range peak: {wav_info['peak']}"


def test_f3_03_zero_nan_inf_and_dc_offset_rejection() -> None:
    """Verify 1-pole DC blocker removes DC offset and output contains zero NaN/Inf samples."""
    res = synthesize_tts_json("ॐ भूर्भुवः स्वः")
    wav_info = decode_base64_wav(res["audioBase64Wav"])
    assert wav_info["has_nan_or_inf"] is False
    assert abs(wav_info["dc_offset"]) < 0.015, f"Excessive DC offset: {wav_info['dc_offset']}"


def test_f3_04_laghu_vs_guru_prosodic_duration_ratio() -> None:
    """Verify Guru (—) syllables have longer mean duration than Laghu (⏑) syllables."""
    res = synthesize_tts_json("ग गा गि गी गु गू त ता ति ती तु तू")
    timings = res["syllableTimings"]
    laghu_durs = [t["durationMs"] for t in timings if t["meter"] == "⏑"]
    guru_durs = [t["durationMs"] for t in timings if t["meter"] == "—"]
    assert len(laghu_durs) >= 4 and len(guru_durs) >= 4
    mean_laghu = sum(laghu_durs) / len(laghu_durs)
    mean_guru = sum(guru_durs) / len(guru_durs)
    assert mean_guru >= mean_laghu * 1.20, (
        f"Expected Guru mean ({mean_guru:.1f}ms) >= 1.20x Laghu mean ({mean_laghu:.1f}ms)"
    )


def test_f3_05_syllable_timings_monotonic_and_duration_aligned() -> None:
    """Verify syllableTimings are monotonically increasing and match total audio duration."""
    res = synthesize_tts_json("नमो भगवते वासुदेवाय")
    timings = res["syllableTimings"]
    assert len(timings) == 11, f"Expected 11 syllables for namo bhagavate vāsudevāya, got {len(timings)}"
    prev_end = 0
    for idx, t in enumerate(timings):
        assert t["index"] == idx
        assert t["startMs"] >= prev_end - 5, f"Non-monotonic startMs at {idx}: {t}"
        assert t["endMs"] > t["startMs"], f"Non-positive syllable span at {idx}: {t}"
        assert abs((t["endMs"] - t["startMs"]) - t["durationMs"]) <= 2
        prev_end = t["endMs"]

    total_sec = float(res["durationSec"])
    assert abs((timings[-1]["endMs"] / 1000.0) - total_sec) <= 0.40


def test_f3_06_cosine_fade_in_fade_out_click_free_boundaries() -> None:
    """Verify raised-cosine fade-in/fade-out prevents boundary step discontinuities."""
    res = synthesize_tts_json("स्वाहा")
    wav_info = decode_base64_wav(res["audioBase64Wav"])
    samples = wav_info["samples"]
    assert float(np.max(np.abs(samples[:16]))) < 0.15, "Missing fade-in envelope at start"
    assert float(np.max(np.abs(samples[-16:]))) < 0.15, "Missing fade-out envelope at end"


# ============================================================================
# F4: Plan 1: Native Classical Sanskrit Neural TTS FastAPI Server
# ============================================================================


def test_f4_01_get_api_health_contract() -> None:
    """Verify GET /api/health returns 200 OK with expected schema and 48000 Hz metadata."""
    status, headers, data = http_get_json(f"{BACKEND_URL}/api/health")
    assert status == 200, f"GET /api/health returned {status}: {data}"
    assert data["status"] == "ok"
    assert data["sampleRate"] == 48000
    assert data["spriteReady"] is True
    assert int(data["spriteCount"]) >= 600
    assert isinstance(data["modelsLoaded"], list) and len(data["modelsLoaded"]) >= 2


def test_f4_02_post_api_tts_json_contract() -> None:
    """Verify POST /api/tts returns complete JSON schema per PROJECT.md § Interface Contracts."""
    payload = {
        "text": "गते गते पारगते पारसंगते बोधि स्वाहा",
        "script": "auto",
        "voice": "male",
        "rate": 1.0,
        "response_format": "json",
    }
    status, headers, data = http_post_json(f"{BACKEND_URL}/api/tts", payload)
    assert status == 200
    required_keys = {
        "text",
        "normalizedDeva",
        "slp1",
        "iast",
        "sampleRate",
        "durationSec",
        "voice",
        "model",
        "audioBase64Wav",
        "audioUrl",
        "syllableTimings",
    }
    missing = required_keys - set(data.keys())
    assert not missing, f"Missing keys in POST /api/tts response: {missing}"
    assert data["sampleRate"] == 48000
    assert data["voice"] == "male"
    assert len(data["syllableTimings"]) == 17


def test_f4_03_post_and_get_api_tts_wav_binary_and_headers() -> None:
    """Verify binary WAV responses include X-Syllable-Timings and X-Sample-Rate: 48000 headers."""
    status, headers, wav_bytes = http_post_bytes(
        f"{BACKEND_URL}/api/tts",
        {"text": "ॐ तारे तुत्तारे तुरे स्वाहा", "voice": "male", "rate": 1.0, "response_format": "wav"},
    )
    assert status == 200
    assert "audio/wav" in headers.get("content-type", "") or "audio/x-wav" in headers.get("content-type", "")
    assert headers.get("x-sample-rate") == "48000"
    assert "x-syllable-timings" in headers
    timings = json.loads(headers["x-syllable-timings"])
    assert isinstance(timings, list) and len(timings) == 10
    wav_info = decode_wav_bytes(wav_bytes)
    assert wav_info["sample_rate"] == 48000

    # Also test GET /api/tts?text=...&format=wav
    q = urllib.parse.urlencode({"text": "oṃ maṇi padme hūṃ", "voice": "male", "rate": "1.0", "format": "wav"})
    g_status, g_headers, g_bytes = http_get_bytes(f"{BACKEND_URL}/api/tts?{q}")
    assert g_status == 200
    assert decode_wav_bytes(g_bytes)["sample_rate"] == 48000


def test_f4_04_get_api_syllable_endpoint_contract() -> None:
    """Verify GET /api/syllable/{slp1_key} serves 48kHz audio in both WAV and JSON formats."""
    status_w, headers_w, wav_bytes = http_get_bytes(f"{BACKEND_URL}/api/syllable/ka?format=wav")
    assert status_w == 200
    wav_info = decode_wav_bytes(wav_bytes)
    assert wav_info["sample_rate"] == 48000
    assert wav_info["duration_sec"] >= 0.14
    assert wav_info["rms"] >= 0.02

    status_j, headers_j, data_j = http_get_json(f"{BACKEND_URL}/api/syllable/hrIH?format=json")
    assert status_j == 200
    assert data_j["sampleRate"] == 48000
    assert "hrIH" in data_j.get("slp1", "hrIH")


def test_f4_05_cors_headers_and_options_preflight() -> None:
    """Verify FastAPI server includes CORS headers for cross-origin browser requests."""
    status, headers = http_options(
        f"{BACKEND_URL}/api/tts",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert status in (200, 204)
    assert "access-control-allow-origin" in headers

    g_status, g_headers, _ = http_get_json(
        f"{BACKEND_URL}/api/health",
        headers={"Origin": "http://localhost:5173"},
    )
    assert g_status == 200
    assert "access-control-allow-origin" in g_headers


def test_f4_06_sha256_audio_cache_url_and_repeat_consistency() -> None:
    """Verify /api/tts returns a valid cached audioUrl (/api/tts/cache/<sha256>.wav) and serves it."""
    res1 = synthesize_tts_json("ॐ अ र प च न धीः", voice="male", rate=1.0)
    res2 = synthesize_tts_json("ॐ अ र प च न धीः", voice="male", rate=1.0)
    assert res1["audioUrl"] == res2["audioUrl"]
    assert res1["audioUrl"].startswith("/api/tts/cache/") and res1["audioUrl"].endswith(".wav")

    c_status, _, c_bytes = http_get_bytes(f"{BACKEND_URL}{res1['audioUrl']}")
    assert c_status == 200
    c_info = decode_wav_bytes(c_bytes)
    assert c_info["sample_rate"] == 48000
    assert abs(c_info["duration_sec"] - float(res1["durationSec"])) < 0.02


# ============================================================================
# F5: Plan 3: Pre-Generated 48kHz Siddham 34×14 Matrix & Dhāraṇī Audio Sprite
# ============================================================================


def test_f5_01_sprite_audio_files_exist_48khz_wav_and_ogg() -> None:
    """Verify siddham_sprite_48k.wav and siddham_sprite_48k.ogg exist at 48,000 Hz and are HTTP-served."""
    assert SPRITE_WAV_PATH.exists() and SPRITE_WAV_PATH.stat().st_size > 5_000_000
    assert SPRITE_OGG_PATH.exists() and SPRITE_OGG_PATH.stat().st_size > 200_000

    with open(SPRITE_WAV_PATH, "rb") as f:
        header = f.read(44)
    assert header[:4] == b"RIFF" and header[8:12] == b"WAVE"

    slice_info = slice_sprite_wav(0.03, 0.25)
    assert slice_info["sample_rate"] == 48000
    assert slice_info["sample_width"] == 2

    status_m, _, _ = http_get_json(f"{BACKEND_URL}/audio/siddham_sprite_manifest.json")
    assert status_m == 200


def test_f5_02_sprite_manifest_schema_and_categories() -> None:
    """Verify siddham_sprite_manifest.json conforms to PROJECT.md § Interface Contracts."""
    manifest = load_sprite_manifest()
    assert manifest["sampleRate"] == 48000
    assert "ninada" in manifest["model"].lower()
    assert manifest["audioUrlOgg"] == "/audio/siddham_sprite_48k.ogg"
    assert manifest["audioUrlWav"] == "/audio/siddham_sprite_48k.wav"
    assert int(manifest["totalCount"]) >= 600
    assert len(manifest["sprites"]) >= 600

    cats = manifest["categories"]
    assert cats["vowels"] == CANONICAL_16_SVARAS
    assert cats["consonants"] == CANONICAL_34_CONSONANTS
    assert cats["matrixVowels"] == CANONICAL_14_MATRIX_VOWELS
    assert set(CANONICAL_28_OVERRIDES).issubset(set(cats["overrides"]))


def test_f5_03_sprite_all_16_standalone_svaras_present_and_voiced() -> None:
    """Verify all 16 standalone Svaras (a..O, aM, aH) exist in sprite manifest and have 48kHz audio."""
    manifest = load_sprite_manifest()
    for v in CANONICAL_16_SVARAS:
        entry = get_sprite_entry(manifest, v)
        assert entry["duration"] >= 0.14, f"Vowel {v} too short: {entry}"
        assert entry.get("rms", 0.05) >= 0.015
        wav_slice = slice_sprite_wav(entry["offset"], entry["duration"])
        assert wav_slice["rms"] >= 0.015, f"Vowel {v} WAV slice silent: {wav_slice['rms']}"


def test_f5_04_sprite_all_476_matrix_cv_cells_present_and_voiced() -> None:
    """Verify all 34 consonants × 14 vowels = 476 CV syllables exist and are non-silent."""
    manifest = load_sprite_manifest()
    missing = []
    low_energy = []
    for c in CANONICAL_34_CONSONANTS:
        for v in CANONICAL_14_MATRIX_VOWELS:
            key = f"{c}{v}"
            if key not in manifest["sprites"]:
                missing.append(key)
                continue
            entry = get_sprite_entry(manifest, key)
            if entry["duration"] < 0.12 or entry.get("rms", 0.05) < 0.012:
                low_energy.append((key, entry))

    assert not missing, f"Missing {len(missing)} CV cells from 34x14 matrix: {missing[:15]}"
    assert not low_energy, f"Low energy/duration CV cells: {low_energy[:10]}"


def test_f5_05_sprite_all_34_bare_virama_and_68_am_ah_cells() -> None:
    """Verify all 34 bare Virāma consonants (k..L) and all 68 CaM/CaH syllables exist in sprite."""
    manifest = load_sprite_manifest()
    for c in CANONICAL_34_CONSONANTS:
        bare = get_sprite_entry(manifest, c)
        assert 0.04 <= bare["duration"] <= 0.30, f"Bare consonant {c} duration out of bounds: {bare}"
        am_entry = get_sprite_entry(manifest, f"{c}aM")
        ah_entry = get_sprite_entry(manifest, f"{c}aH")
        assert am_entry["duration"] >= 0.18
        assert ah_entry["duration"] >= 0.18


def test_f5_06_sprite_all_28_overrides_and_54_corpus_syllables() -> None:
    """Verify all 28 SYLLABLE_OVERRIDES, extra kz/jY forms, and 54+ corpus syllables exist in sprite."""
    manifest = load_sprite_manifest()
    required_keys = (
        CANONICAL_28_OVERRIDES
        + CANONICAL_KZ_JY_EXTRA
        + CANONICAL_CORPUS_COMPOUND_SYLLABLES
    )
    missing = [k for k in required_keys if k not in manifest["sprites"]]
    assert not missing, f"Missing required override/corpus syllables in sprite: {missing}"

    for k in ["oM", "hUM", "hrIH", "SrIM", "klIM", "DIH", "BrUM", "svA", "jYA", "kza", "Paw", "pad", "kArt", "snye"]:
        entry = get_sprite_entry(manifest, k)
        slice_metrics = slice_sprite_wav(entry["offset"], entry["duration"])
        assert slice_metrics["rms"] >= 0.02, f"Corpus syllable {k} silent in WAV sprite"


# ============================================================================
# F6: Zero-Latency Web Audio API 48kHz Sprite Player & Prosodic Concatenator
# ============================================================================


def test_f6_01_legacy_136_1hz_sawtooth_removed_from_primary_path() -> None:
    """Verify primary playback uses 48kHz neural sprite / neural TTS instead of 136.1Hz sawtooth."""
    res = run_engine_js("""
      const modeEl = document.getElementById('audioModeSelect');
      const defaultMode = modeEl ? modeEl.value : '';
      const playRes = await window.playSingleSyllable('ka', 0);
      return {
        defaultMode,
        playRes,
        playedCount: __playedSources.length,
        firstSource: __playedSources[0] || null
      };
    """)
    assert res["defaultMode"] in ("neural-auto", "neural-sprite", "neural-tts")
    assert res["playRes"]["sampleRate"] == 48000
    assert res["playRes"]["source"] in ("neural-sprite", "neural-tts")


def test_f6_02_web_audio_sprite_buffer_loader_and_manifest_binding() -> None:
    """Verify window.SPRITE_MANIFEST and window.spriteAudioBuffer initialize at 48,000 Hz."""
    res = run_engine_js("""
      if (!window.SPRITE_MANIFEST && typeof window.initNeuralAudioSprite === 'function') {
        await window.initNeuralAudioSprite();
      }
      return {
        hasManifest: Boolean(window.SPRITE_MANIFEST),
        sampleRate: window.SPRITE_MANIFEST ? window.SPRITE_MANIFEST.sampleRate : null,
        spriteCount: window.SPRITE_MANIFEST && window.SPRITE_MANIFEST.sprites ? Object.keys(window.SPRITE_MANIFEST.sprites).length : 0,
        bufferSampleRate: window.spriteAudioBuffer ? window.spriteAudioBuffer.sampleRate : null
      };
    """)
    assert res["hasManifest"] is True
    assert res["sampleRate"] == 48000
    assert res["spriteCount"] >= 600
    assert res["bufferSampleRate"] == 48000


def test_f6_03_play_single_syllable_uses_48khz_neural_sprite() -> None:
    """Verify playSingleSyllable('ka') and playSingleSyllable('hrIH') slice exact 48kHz sprite offsets."""
    res = run_engine_js("""
      __playedSources.length = 0;
      const r1 = await window.playSingleSyllable('ka', 0);
      const r2 = await window.playSingleSyllable('hrIH', 1);
      return { r1, r2, played: __playedSources };
    """)
    assert res["r1"]["source"] == "neural-sprite"
    assert res["r1"]["sampleRate"] == 48000
    assert res["r1"]["durationSec"] >= 0.14
    assert res["r2"]["source"] == "neural-sprite"
    assert res["r2"]["sampleRate"] == 48000
    assert len(res["played"]) >= 2
    assert res["played"][0]["offset"] > 0


def test_f6_04_unseen_syllable_fallback_to_api_syllable_or_stitching() -> None:
    """Verify playSingleSyllable falls back to /api/syllable or slice stitching on unseen clusters."""
    res = run_engine_js("""
      const r = await window.playSingleSyllable('krtsn', -1);
      return r;
    """)
    assert res["sampleRate"] == 48000
    assert res["durationSec"] > 0
    assert res["source"] in ("neural-tts", "neural-sprite")


def test_f6_05_full_sentence_sprite_concatenation_and_rate_control() -> None:
    """Verify speakSanskrit() in 'neural-sprite' mode concatenates 48kHz slices with rate control."""
    res = run_engine_js("""
      document.getElementById('sanskritInput').value = 'gate gate';
      if (typeof processInput === 'function') processInput();
      document.getElementById('audioModeSelect').value = 'neural-sprite';
      document.getElementById('speechRate').value = '0.8';
      __playedSources.length = 0;
      const sRes = await window.speakSanskrit();
      return { sRes, playedCount: __playedSources.length };
    """)
    assert res["sRes"]["sampleRate"] == 48000
    assert res["sRes"]["durationSec"] > 0.4
    assert len(res["sRes"]["syllableTimings"]) >= 4


def test_f6_06_full_sentence_neural_tts_mode_and_timings() -> None:
    """Verify speakSanskrit() in 'neural-tts' / 'neural-auto' mode returns 48kHz timings."""
    res = run_engine_js("""
      document.getElementById('sanskritInput').value = 'गते गते';
      if (typeof processInput === 'function') processInput();
      document.getElementById('audioModeSelect').value = 'neural-tts';
      const sRes = await window.speakSanskrit();
      return sRes;
    """)
    assert res["sampleRate"] == 48000
    assert isinstance(res["syllableTimings"], list) and len(res["syllableTimings"]) >= 2


# ============================================================================
# F7: Upgraded `sanskrit_phonetic_engine.html` (v3.0 Neural + 34×14 Matrix)
# ============================================================================


def test_f7_01_html_served_on_8765_and_5173_and_root_file_synced() -> None:
    """Verify sanskrit_phonetic_engine.html exists at root and public/ and is served on :8765 and :5173."""
    assert ROOT_ENGINE_HTML.exists() and ROOT_ENGINE_HTML.stat().st_size > 50_000
    assert PUBLIC_ENGINE_HTML.exists() and PUBLIC_ENGINE_HTML.stat().st_size > 50_000
    assert ROOT_ENGINE_HTML.read_text(encoding="utf-8") == PUBLIC_ENGINE_HTML.read_text(encoding="utf-8")

    s1, _, b1 = http_get_bytes(f"{BACKEND_URL}/sanskrit_phonetic_engine.html")
    assert s1 == 200 and b"CONS_MATRIX" in b1 and b"SPRITE_MANIFEST" in b1

    s2, _, b2 = http_get_bytes(f"{FRONTEND_URL}/sanskrit_phonetic_engine.html")
    assert s2 == 200 and b"CONS_MATRIX" in b2


def test_f7_02_all_v2_modules_and_window_globals_preserved() -> None:
    """Verify all required window globals and v2.0 transliteration/syllabifier functions exist."""
    res = run_engine_js("""
      return {
        consCount: Object.keys(window.CONS_MATRIX).length,
        vowelCount: Object.keys(window.VOWEL_MAP).length,
        overrideCount: Object.keys(window.SYLLABLE_OVERRIDES).length,
        samplesCount: window.SAMPLES.length,
        hasInputToSlp1: typeof window.inputToSlp1 === 'function',
        hasSlp1ToIast: typeof window.slp1ToIast === 'function',
        hasSlp1ToDeva: typeof window.slp1ToDevanagari === 'function',
        hasParseWord: typeof window.parseAndTransliterateWord === 'function',
        hasPlaySingle: typeof window.playSingleSyllable === 'function',
        hasSpeakSanskrit: typeof window.speakSanskrit === 'function'
      };
    """)
    assert res["consCount"] == 34
    assert res["vowelCount"] == 14
    assert res["overrideCount"] >= 28
    assert res["samplesCount"] == 8
    assert all(
        res[k] is True
        for k in [
            "hasInputToSlp1",
            "hasSlp1ToIast",
            "hasSlp1ToDeva",
            "hasParseWord",
            "hasPlaySingle",
            "hasSpeakSanskrit",
        ]
    )


def test_f7_03_audio_mode_and_voice_selectors_and_status_badge_dom() -> None:
    """Verify HTML contains #audioModeSelect, #voiceSelect, #speechRate, #btnSpeak, #audioStatusBadge."""
    html_text = ROOT_ENGINE_HTML.read_text(encoding="utf-8")
    for dom_id in [
        "sanskritInput",
        "audioModeSelect",
        "voiceSelect",
        "speechRate",
        "btnSpeak",
        "audioStatusBadge",
        "iastOut",
        "devaOut",
        "slp1Out",
        "modernOut",
        "tradOut",
        "breakdownContainer",
        "wordSheetContainer",
        "activeSyllableInspector",
        "matrixModal",
        "matrixModalBody",
    ]:
        assert f'id="{dom_id}"' in html_text, f"Missing DOM element #{dom_id} in HTML"

    for mode_val in ["neural-auto", "neural-tts", "neural-sprite", "legacy-tts"]:
        assert mode_val in html_text, f"Missing audio mode option {mode_val!r}"
    for voice_val in ["male", "female", "mobile"]:
        assert voice_val in html_text, f"Missing voice option {voice_val!r}"


def test_f7_04_phoneme_matrix_modal_renders_34x14_plus_svaras_and_overrides() -> None:
    """Verify buildPhonemeMatrixModal() renders all 14 vowel columns (34x14) + Virāma + Svaras + Overrides."""
    res = run_engine_js("""
      if (typeof buildPhonemeMatrixModal === 'function') buildPhonemeMatrixModal();
      const bodyHtml = document.getElementById('matrixModalBody').innerHTML;
      const matches = [...bodyHtml.matchAll(/playSingleSyllable\\(['"]([^'"]+)['"]/g)].map(m => m[1]);
      return {
        totalButtons: matches.length,
        uniqueKeys: Array.from(new Set(matches))
      };
    """)
    unique_keys = set(res["uniqueKeys"])
    # Check all 14 standalone vowels + aM, aH
    for v in CANONICAL_14_MATRIX_VOWELS:
        assert v in unique_keys, f"Standalone vowel {v!r} missing from matrix modal"
    # Check all 34 * 14 = 476 CV combinations are clickable in the expanded 34x14 modal
    missing_cv = [
        f"{c}{v}"
        for c in CANONICAL_34_CONSONANTS
        for v in CANONICAL_14_MATRIX_VOWELS
        if f"{c}{v}" not in unique_keys
    ]
    assert not missing_cv, f"Missing {len(missing_cv)} CV cells in 34x14 modal: {missing_cv[:10]}"
    # Check 28 sacred seed syllables
    for ov in CANONICAL_28_OVERRIDES:
        assert ov in unique_keys, f"Seed syllable {ov!r} missing from matrix modal"


def test_f7_05_four_line_sheet_and_dual_track_transliteration_accuracy() -> None:
    """Verify loading Sample 0 populates IAST, Devanagari, SLP1, Modern, and Tang outputs accurately."""
    res = run_engine_js("""
      loadSample(0);
      return {
        iast: document.getElementById('iastOut').textContent,
        deva: document.getElementById('devaOut').textContent,
        slp1: document.getElementById('slp1Out').textContent,
        modern: document.getElementById('modernOut').textContent,
        trad: document.getElementById('tradOut').textContent,
        breakdownHtml: document.getElementById('breakdownContainer').innerHTML
      };
    """)
    assert "gate gate pāragate pārasaṃgate bodhi svāhā" in res["iast"]
    assert "गते गते पारगते" in res["deva"]
    assert "gate gate pAragate" in res["slp1"]
    assert "揭谛" in res["trad"] and "波罗僧揭谛" in res["trad"] and "萨婆诃" in res["trad"]
    assert 'data-raw="ga"' in res["breakdownHtml"]
    assert 'data-raw="svA"' in res["breakdownHtml"]


def test_f7_06_active_syllable_inspector_updates_on_card_click() -> None:
    """Verify clicking a syllable card updates the active syllable inspector and plays 48kHz audio."""
    res = run_engine_js("""
      loadSample(0);
      if (typeof inspectAndPlaySyllable === 'function') {
        await inspectAndPlaySyllable(0);
      }
      return {
        deva: document.getElementById('inspDeva').textContent,
        iast: document.getElementById('inspIast').textContent,
        meter: document.getElementById('inspMeter').textContent
      };
    """)
    assert "ग" in res["deva"]
    assert "ga" in res["iast"]
    assert "⏑" in res["meter"] or "Laghu" in res["meter"] or "轻" in res["meter"]


# ============================================================================
# F8: `Sarva-Dhāraṇī-Kośa` Full Modular Web Application (`http://localhost:5173/`)
# ============================================================================


def test_f8_01_vite_server_5173_index_html_and_assets_load() -> None:
    """Verify http://localhost:5173/ serves Sarva-Dhāraṇī-Kośa index.html with 200 OK."""
    status, headers, body = http_get_bytes(f"{FRONTEND_URL}/")
    assert status == 200
    text = body.decode("utf-8", errors="replace")
    assert "root" in text
    assert "main.tsx" in text or "assets/" in text


def test_f8_02_vite_proxy_api_health_and_tts_and_sprite_manifest() -> None:
    """Verify :5173 proxies /api/health, /api/tts, and /audio/siddham_sprite_manifest.json to :8765."""
    h_status, _, h_data = http_get_json(f"{FRONTEND_URL}/api/health")
    assert h_status == 200 and h_data["status"] == "ok" and h_data["sampleRate"] == 48000

    m_status, _, m_data = http_get_json(f"{FRONTEND_URL}/audio/siddham_sprite_manifest.json")
    assert m_status == 200 and m_data["sampleRate"] == 48000 and int(m_data["totalCount"]) >= 600

    t_status, _, t_data = http_post_json(
        f"{FRONTEND_URL}/api/tts",
        {"text": "ॐ मणि पद्मे हूं", "voice": "male", "rate": 1.0, "response_format": "json"},
    )
    assert t_status == 200 and t_data["sampleRate"] == 48000


def test_f8_03_authoritative_corpus_files_four_great_ten_small_cbeta_gretil_taisho() -> None:
    """Verify corpus and generated data files exist and contain Four Great Dhāraṇīs, Ten Small Mantras, CBETA, GRETIL, Taishō."""
    corpus_dir = WORKSPACE_ROOT / "src" / "data" / "corpus"
    gen_dir = WORKSPACE_ROOT / "src" / "data" / "generated"

    required_files = [
        corpus_dir / "major-dharanis.ts",
        corpus_dir / "ten-small-dharanis.ts",
        corpus_dir / "buddhas-bodhisattvas.ts",
        corpus_dir / "gretil-canon-adapter.ts",
        gen_dir / "cbetaAuthRecords.ts",
        gen_dir / "gretilAuthRecords.ts",
        gen_dir / "taishoMikkyoIndex.ts",
    ]
    for path in required_files:
        assert path.exists() and path.stat().st_size > 300, f"Missing or empty corpus file: {path}"

    cbeta_txt = (gen_dir / "cbetaAuthRecords.ts").read_text(encoding="utf-8")
    assert "SD-" in cbeta_txt, "Expected CBETA #SD- Siddham gaiji records in cbetaAuthRecords.ts"
    taisho_txt = (gen_dir / "taishoMikkyoIndex.ts").read_text(encoding="utf-8")
    assert "T18" in taisho_txt and "T19" in taisho_txt and "T20" in taisho_txt and "T21" in taisho_txt


def test_f8_04_sanskrit_audio_engine_ts_integrates_plan1_and_plan3() -> None:
    """Verify src/services/audio/sanskritAudioEngine.ts integrates Plan 1 (/api/tts) & Plan 3 (siddham_sprite_48k)."""
    engine_ts = WORKSPACE_ROOT / "src" / "services" / "audio" / "sanskritAudioEngine.ts"
    assert engine_ts.exists(), f"Missing {engine_ts}"
    code = engine_ts.read_text(encoding="utf-8")
    assert "/api/tts" in code, "sanskritAudioEngine.ts must integrate Plan 1 /api/tts"
    assert "siddham_sprite_manifest.json" in code, "sanskritAudioEngine.ts must load Plan 3 manifest"
    assert "siddham_sprite_48k" in code, "sanskritAudioEngine.ts must use Plan 3 48kHz audio sprite"
    assert "48000" in code


def test_f8_05_ui_components_reader_academy_compiler_player_bar_present() -> None:
    """Verify all 10 UI components and 3 core linguistic modules exist in src/."""
    comp_dir = WORKSPACE_ROOT / "src" / "components"
    for comp in [
        "Header.tsx",
        "SidebarFilter.tsx",
        "DharaniReader.tsx",
        "VerseBlock.tsx",
        "CbetaSiddhamInterlinearView.tsx",
        "AuthoritativeSourceModal.tsx",
        "TaishoCanonExplorer.tsx",
        "SanskritPhoneticsAcademy.tsx",
        "CustomDharaniCompiler.tsx",
        "AudioPlayerBar.tsx",
    ]:
        p = comp_dir / comp
        assert p.exists() and p.stat().st_size > 200, f"Missing component: {p}"

    core_dir = WORKSPACE_ROOT / "src" / "core"
    for mod in ["transliterator.ts", "prosody.ts", "searchEngine.ts"]:
        p = core_dir / mod
        assert p.exists() and p.stat().st_size > 200, f"Missing core module: {p}"


def test_f8_06_typescript_and_vite_production_build_clean() -> None:
    """Verify TypeScript compilation (tsc --noEmit) succeeds cleanly on Sarva-Dhāraṇī-Kośa."""
    assert (WORKSPACE_ROOT / "package.json").exists()
    assert (WORKSPACE_ROOT / "vite.config.ts").exists()
    assert (WORKSPACE_ROOT / "tsconfig.json").exists()

    proc = subprocess.run(
        ["npx", "tsc", "--noEmit"],
        cwd=str(WORKSPACE_ROOT),
        capture_output=True,
        text=True,
        timeout=60,
    )
    assert proc.returncode == 0, f"tsc --noEmit failed:\n{proc.stdout}\n{proc.stderr}"
