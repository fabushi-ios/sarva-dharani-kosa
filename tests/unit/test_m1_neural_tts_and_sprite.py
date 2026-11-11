"""
Milestone M1 Unit & Integration Test Suite:
Covers F1 (Self-Contained ONNX Models), F2 (Classical Sanskrit Śikṣā Normalizer),
F3 (48kHz Polyphase DSP & Prosody), F4 (FastAPI Server on :8765), and
F5 (Plan 3 Pre-Generated 48kHz Siddhaṃ 34×14 & Dhāraṇī Audio Sprite Library).
"""
from __future__ import annotations

import base64
import io
import json
import sys
import wave
from pathlib import Path

import httpx
import numpy as np
import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.sanskrit_tts_engine import (
    MATRIX_CONSONANTS,
    MATRIX_VOWELS,
    MODELS_DIR,
    ROUGH_ENGLISH_WORD_MAP,
    SAMPLES,
    STANDALONE_SVARAS,
    SYLLABLE_OVERRIDES,
    TARGET_SAMPLE_RATE,
    TRAD_WORD_REPLACEMENTS,
    apply_dc_blocker,
    apply_mastering_envelope_48k,
    condition_single_syllable_slp1,
    get_tts_engine,
    input_to_slp1,
    normalize_sanskrit_siksha,
    resolve_modifiers,
    slp1_to_devanagari,
    slp1_to_iast,
    syllabify_sanskrit_text,
    upsample_to_48k,
)

PUBLIC_AUDIO_DIR = PROJECT_ROOT / "public" / "audio"
MANIFEST_PATH = PUBLIC_AUDIO_DIR / "siddham_sprite_manifest.json"
WAV_PATH = PUBLIC_AUDIO_DIR / "siddham_sprite_48k.wav"
OGG_PATH = PUBLIC_AUDIO_DIR / "siddham_sprite_48k.ogg"
API_BASE = "http://127.0.0.1:8765"


def test_f1_models_bundled_and_loaded() -> None:
    required_files = [
        MODELS_DIR / "onnx" / "sa.onnx",
        MODELS_DIR / "onnx" / "sa_female.onnx",
        MODELS_DIR / "onnx_mobile" / "sa.onnx",
        MODELS_DIR / "onnx_mobile" / "sa_female.onnx",
        MODELS_DIR / "vocabs.json",
        MODELS_DIR / "onnx" / "sa" / "encoder_flow_quantized.onnx",
        MODELS_DIR / "onnx" / "sa" / "vocoder_quantized.onnx",
        MODELS_DIR / "onnx" / "sa" / "vocab.json",
    ]
    for p in required_files:
        assert p.exists() and p.stat().st_size > 100, f"Missing model asset: {p}"

    engine = get_tts_engine()
    assert set(engine.models_loaded) >= {
        "sa_studio_male",
        "sa_studio_female",
        "sa_mobile_male",
        "sa_mms_16k",
    }


def test_f2_siksha_normalizer_and_zero_schwa_deletion() -> None:
    norm = normalize_sanskrit_siksha("ॐ मणि पद्मे हूं । धर्म बुद्ध नमः स्वाहा ॥")
    assert "ओम्" in norm["normalizedDeva"]
    assert "ॐ" not in norm["normalizedDeva"]
    assert len(norm["clauses"]) == 2
    assert norm["clauses"][0]["pauseMs"] == 250
    assert norm["clauses"][1]["pauseMs"] == 450
    # Word-final inherent-'a' consonants ('धर्म', 'बुद्ध') must be conditioned with U+200A ('\u200a')
    assert "धर्म\u200a" in norm["vitsDeva"]
    assert "बुद्ध\u200a" in norm["vitsDeva"]

    # Rare vocalic liquids and Avagraha
    norm_rare = normalize_sanskrit_siksha("पितॄणाम् क्लृप्त सोऽहम्")
    assert norm_rare["hasLongVocalic"] is True
    assert norm_rare["hasAvagraha"] is True
    assert "ऽ" not in norm_rare["normalizedDeva"]

    # Rough English & IAST & Devanagari equivalence
    assert input_to_slp1("om mani padme hum", mode="smart") == "oM maRi padme hUM"
    assert slp1_to_iast("prajYApAramitA") == "prajñāpāramitā"
    assert slp1_to_devanagari("oM") == "ॐ"


def test_f2_single_syllable_conditioning_categories() -> None:
    c_virama = condition_single_syllable_slp1("k")
    assert c_virama["category"] == "virama"
    assert c_virama["meter"] == ""

    c_svara = condition_single_syllable_slp1("a")
    assert c_svara["category"] == "svara"
    assert c_svara["engine"] == "mms_16k"
    assert c_svara["meter"] == "⏑"

    c_inh = condition_single_syllable_slp1("pra")
    assert c_inh["category"] == "inherent_a"
    assert c_inh["vitsQuery"].endswith("\u200a")
    assert c_inh["meter"] == "⏑"

    c_mod = condition_single_syllable_slp1("kaH")
    assert c_mod["category"] == "modified_a"
    assert c_mod["hasVisarga"] is True
    assert c_mod["meter"] == "—"


def test_f2_modifier_assimilation_and_samples_coverage() -> None:
    assert resolve_modifiers("M", "a", "g", True)["mMod"] == "昂"
    assert resolve_modifiers("M", "a", "c", True)["mMod"] == "恩"
    assert resolve_modifiers("M", "a", "t", True)["mMod"] == "恩"
    assert resolve_modifiers("M", "a", "p", True)["mMod"] == "姆"
    assert resolve_modifiers("H", "i", "", True)["mMod"] == "希"
    assert resolve_modifiers("H", "u", "", True)["mMod"] == "呼"
    assert resolve_modifiers("H", "a", "", True)["mMod"] == "哈"

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    sprites = manifest["sprites"]
    for sample_txt in SAMPLES:
        syls = syllabify_sanskrit_text(sample_txt, mode="smart")
        assert len(syls) > 0
        for s in syls:
            assert s["slp1"] in sprites, f"Sample syllable {s['slp1']} missing from sprite"
    for w in TRAD_WORD_REPLACEMENTS:
        for s in syllabify_sanskrit_text(w, mode="slp1"):
            assert s["slp1"] in sprites
    for w in ROUGH_ENGLISH_WORD_MAP.values():
        for s in syllabify_sanskrit_text(w, mode="strict"):
            assert s["slp1"] in sprites


def test_f3_48khz_polyphase_dsp_and_guru_laghu_prosody() -> None:
    t24 = np.sin(2 * np.pi * 440.0 * np.arange(2400, dtype=np.float32) / 24000.0) + 0.25
    u48 = upsample_to_48k(t24, 24000)
    assert len(u48) == 4800
    dc_blocked = apply_dc_blocker(u48)
    assert abs(float(np.mean(dc_blocked))) < 1e-5
    mastered = apply_mastering_envelope_48k(u48)
    assert abs(float(np.mean(mastered))) < 0.01
    assert 0.88 <= float(np.max(np.abs(mastered))) <= 0.90

    engine = get_tts_engine()
    res_ka = engine.synthesize_single_syllable("ka", voice="male", rate=1.0)
    res_kA = engine.synthesize_single_syllable("kA", voice="male", rate=1.0)
    assert res_ka["sampleRate"] == 48000
    assert res_kA["sampleRate"] == 48000
    assert res_kA["durationSec"] > res_ka["durationSec"] * 1.45


def test_f5_sprite_manifest_and_48khz_audio_files() -> None:
    assert MANIFEST_PATH.exists(), "Missing siddham_sprite_manifest.json"
    assert WAV_PATH.exists() and WAV_PATH.stat().st_size > 1_000_000, "Missing or small siddham_sprite_48k.wav"
    assert OGG_PATH.exists() and OGG_PATH.stat().st_size > 100_000, "Missing or small siddham_sprite_48k.ogg"

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    assert manifest["version"] == "3.0.0"
    assert manifest["sampleRate"] == 48000
    assert manifest["audioUrlOgg"] == "/audio/siddham_sprite_48k.ogg"
    assert manifest["audioUrlWav"] == "/audio/siddham_sprite_48k.wav"
    assert manifest["totalCount"] >= 650

    sprites = manifest["sprites"]
    assert len(sprites) == manifest["totalCount"]
    assert len(sprites) >= 650

    # Verify all 16 standalone vowels
    for sv in STANDALONE_SVARAS:
        assert sv in sprites, f"Missing standalone Svara: {sv}"

    # Verify all 476 34×14 CV combinations, 34 bare Virāma, and 68 CaM/CaH
    for c in MATRIX_CONSONANTS:
        assert c in sprites, f"Missing bare Virama consonant: {c}"
        assert f"{c}aM" in sprites, f"Missing {c}aM"
        assert f"{c}aH" in sprites, f"Missing {c}aH"
        for v in MATRIX_VOWELS:
            assert f"{c}{v}" in sprites, f"Missing matrix CV cell: {c}{v}"

    # Verify all 28 SYLLABLE_OVERRIDES
    for ov in SYLLABLE_OVERRIDES:
        assert ov in sprites, f"Missing override syllable: {ov}"

    # Verify all kz and jY vowel combinations
    for prefix in ("kz", "jY"):
        for v in MATRIX_VOWELS:
            assert f"{prefix}{v}" in sprites, f"Missing conjunct syllable: {prefix}{v}"

    # Verify all 39 explicit corpus compound syllables
    explicit_corpus = [
        "pad", "vaH", "tat", "tur", "reR", "yaM", "Bar", "sya", "naH", "yAt",
        "kArt", "snye", "vAn", "tut", "jya", "dUr", "ar", "sam", "yak", "bud",
        "tad", "jye", "mud", "SAn", "tiH", "maH", "Sva", "EM", "krIM", "strIM",
        "zaw", "kfz", "trI", "man", "tra", "Dar", "kar", "sat", "tva",
    ]
    for s in explicit_corpus:
        assert s in sprites, f"Missing corpus syllable: {s}"

    # Verify every slice is non-silent (rms >= 0.015) and Guru > Laghu
    for key, meta in sprites.items():
        assert meta["rms"] >= 0.015, f"Slice {key} has low RMS: {meta['rms']}"
        assert meta["duration"] > 0.05, f"Slice {key} has invalid duration: {meta['duration']}"

    for c in ("k", "t", "p"):
        assert sprites[f"{c}A"]["duration"] > sprites[f"{c}a"]["duration"] * 1.4
        assert sprites[f"{c}I"]["duration"] > sprites[f"{c}i"]["duration"] * 1.4
        assert sprites[f"{c}U"]["duration"] > sprites[f"{c}u"]["duration"] * 1.4

    with wave.open(str(WAV_PATH), "rb") as wf:
        assert wf.getframerate() == 48000
        assert wf.getnchannels() == 1
        assert wf.getsampwidth() == 2


def test_f4_fastapi_server_endpoints() -> None:
    with httpx.Client(base_url=API_BASE, timeout=30.0, trust_env=False) as client:
        # 1. GET /api/health
        r_health = client.get("/api/health")
        assert r_health.status_code == 200
        h = r_health.json()
        assert h["status"] == "ok"
        assert h["engine"] == "ninada-vits-sanskrit-48khz"
        assert h["sampleRate"] == 48000
        assert h["spriteCount"] >= 650
        assert h["spriteReady"] is True
        assert "sa_studio_male" in h["modelsLoaded"]

        # 2. Empty/whitespace text rejection (400 or 422)
        r_empty = client.post("/api/tts", json={"text": "   "})
        assert r_empty.status_code in (400, 422)
        r_empty_get = client.get("/api/tts", params={"text": ""})
        assert r_empty_get.status_code in (400, 422)

        # 3. POST /api/tts JSON response + timings + cache URL
        r_tts = client.post(
            "/api/tts",
            json={
                "text": "गते गते पारगते पारसंगते बोधि स्वाहा",
                "script": "auto",
                "voice": "male",
                "rate": 1.0,
                "response_format": "json",
            },
        )
        assert r_tts.status_code == 200
        data = r_tts.json()
        assert data["sampleRate"] == 48000
        assert data["slp1"] == "gate gate pAragate pArasaMgate boDi svAhA"
        assert data["durationSec"] > 1.5
        assert len(data["syllableTimings"]) == 17
        assert data["syllableTimings"][0]["slp1"] == "ga"
        assert data["syllableTimings"][0]["meter"] == "⏑"
        assert data["syllableTimings"][1]["slp1"] == "te"
        assert data["syllableTimings"][1]["meter"] == "—"

        wav_raw = base64.b64decode(data["audioBase64Wav"])
        with wave.open(io.BytesIO(wav_raw), "rb") as wf:
            assert wf.getframerate() == 48000
            assert wf.getnchannels() == 1

        # Verify cached audioUrl is served and missing cache file returns 404
        r_cache = client.get(data["audioUrl"])
        assert r_cache.status_code == 200
        assert r_cache.headers["content-type"].startswith("audio/wav")
        r_cache_404 = client.get("/api/tts/cache/nonexistent_hash.wav")
        assert r_cache_404.status_code == 404

        # 4. GET /api/tts binary WAV & OGG responses + Accept header negotiation
        r_wav = client.get(
            "/api/tts",
            params={"text": "oṃ maṇi padme hūṃ", "format": "wav"},
        )
        assert r_wav.status_code == 200
        assert r_wav.headers["content-type"].startswith("audio/wav")
        assert r_wav.headers.get("x-sample-rate") == "48000"
        timings_hdr = json.loads(r_wav.headers["x-syllable-timings"])
        assert len(timings_hdr) == 6
        assert [t["slp1"] for t in timings_hdr] == ["oM", "ma", "Ri", "pad", "me", "hUM"]

        r_ogg = client.get("/api/tts", params={"text": "oṃ", "response_format": "ogg"})
        assert r_ogg.status_code == 200
        assert r_ogg.headers["content-type"].startswith("audio/ogg")
        assert len(r_ogg.content) > 100

        r_accept_wav = client.post(
            "/api/tts",
            json={"text": "svāhā"},
            headers={"Accept": "audio/wav"},
        )
        assert r_accept_wav.status_code == 200
        assert r_accept_wav.headers["content-type"].startswith("audio/wav")

        # 5. GET /api/syllable/{slp1_key} from sprite (SLP1, Deva, IAST) and dynamic synthesis
        r_syl_json = client.get("/api/syllable/kza", params={"format": "json"})
        assert r_syl_json.status_code == 200
        syl_data = r_syl_json.json()
        assert syl_data["slp1"] == "kza"
        assert syl_data["sampleRate"] == 48000
        assert syl_data["source"] == "neural-sprite"

        r_syl_deva = client.get("/api/syllable/ॐ", params={"format": "json"})
        assert r_syl_deva.status_code == 200
        assert r_syl_deva.json()["slp1"] == "oM"
        assert r_syl_deva.json()["source"] == "neural-sprite"

        r_syl_wav = client.get("/api/syllable/oM", params={"format": "wav"})
        assert r_syl_wav.status_code == 200
        assert r_syl_wav.headers["content-type"].startswith("audio/wav")
        assert r_syl_wav.headers.get("x-sample-rate") == "48000"

        r_syl_dyn = client.get("/api/syllable/kra", params={"voice": "female", "format": "json"})
        assert r_syl_dyn.status_code == 200
        assert r_syl_dyn.json()["source"] == "neural-tts"
        assert r_syl_dyn.json()["sampleRate"] == 48000

        # 6. Static /audio/siddham_sprite_manifest.json with CORS
        r_static = client.get(
            "/audio/siddham_sprite_manifest.json",
            headers={"Origin": "http://localhost:5173"},
        )
        assert r_static.status_code == 200
        assert r_static.headers.get("access-control-allow-origin") == "*"

