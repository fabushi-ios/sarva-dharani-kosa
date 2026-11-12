"""
Regression tests for Siddhaṃ 18 Chapters & Bīja Syllable Pronunciation Accuracy:
1. Deterministic SLP1 vs IAST / Devanāgarī / Siddhaṃ disambiguation (`resolve_slp1_or_iast_to_slp1`).
2. MMS 16kHz native Kannada vocabulary mapping for all 16 standalone Svaras (including `ṛ`/`ṝ` without OOB crashes).
3. Studio/Mobile 24kHz -> 48kHz Daṇḍa prosodic right-context conditioning & `core_char_count` frame slicing
   (`chau`, `u`, `ū`, `kṛ`, `tu`, `vi`, `ṭho`, `haṃ`, `am̐`, `ḷa`, `rka`, `ṅka`, `phaṭ`, `oṃ`, `ka` vs `kā`).
4. FastAPI `/api/syllable/{slp1_key}` multi-script query resolution.
"""
from __future__ import annotations

import sys
import urllib.parse
from pathlib import Path

import anyio
import httpx

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.sanskrit_tts_engine import (
    STANDALONE_SVARAS,
    TARGET_SAMPLE_RATE,
    VITS_INHERENT_A_MARKER,
    condition_single_syllable_slp1,
    get_tts_engine,
    resolve_slp1_or_iast_to_slp1,
    slp1_to_devanagari,
)
from backend.tts_server import app


def test_resolve_slp1_or_iast_disambiguation() -> None:
    cases = [
        ("CO", "CO", "छौ"),
        ("chau", "CO", "छौ"),
        ("cO", "cO", "चौ"),
        ("cau", "cO", "चौ"),
        ("kf", "kf", "कृ"),
        ("kṛ", "kf", "कृ"),
        ("Paw", "Paw", "फट्"),
        ("phaṭ", "Paw", "फट्"),
        ("phat", "Paw", "फट्"),
        ("BrUM", "BrUM", "भ्रूं"),
        ("bhrūṃ", "BrUM", "भ्रूं"),
        ("DIH", "DIH", "धीः"),
        ("dhīḥ", "DIH", "धीः"),
        ("wa", "wa", "ट"),
        ("ṭa", "wa", "ट"),
        ("Wo", "Wo", "ठो"),
        ("ṭho", "Wo", "ठो"),
        ("qa", "qa", "ड"),
        ("ḍa", "qa", "ड"),
        ("za", "za", "ष"),
        ("ṣa", "za", "ष"),
        ("La", "La", "ळ"),
        ("ḷa", "La", "ळ"),
        ("LO", "LO", "ळौ"),
        ("ḷau", "LO", "ळौ"),
        ("x", "x", "ऌ"),
        ("X", "X", "ॡ"),
        ("kḷpta", "kxpta", "कॢप्त"),
        ("a~", "a~", "अँ"),
        ("am\u0310", "a~", "अँ"),
        ("rka", "rka", "र्क"),
        ("Nka", "Nka", "ङ्क"),
        ("ṅka", "Nka", "ङ्क"),
        ("Yca", "Yca", "ञ्च"),
        ("ñca", "Yca", "ञ्च"),
        ("Rwa", "Rwa", "ण्ट"),
        ("ṇṭa", "Rwa", "ण्ट"),
        ("छौ", "CO", "छौ"),
        ("चौ", "cO", "चौ"),
        ("क्", "k", "क्"),
        ("𑖌𑖼", "o~", "ओँ"),
        ("𑖌𑖽", "oM", "ॐ"),
        ("𑖮𑖿𑖨𑖱𑖾", "hrIH", "ह्रीः"),
        ("om", "oM", "ॐ"),
        ("hum", "hUM", "हूं"),
        ("swaha", "svAhA", "स्वाहा"),
    ]
    for raw, expected_slp1, expected_deva in cases:
        resolved = resolve_slp1_or_iast_to_slp1(raw)
        assert resolved == expected_slp1, f"raw={raw!r}: got {resolved!r}, expected {expected_slp1!r}"
        assert slp1_to_devanagari(resolved) == expected_deva


def test_conditioning_candrabindu_and_siddham_medial_clusters() -> None:
    c_candrabindu = condition_single_syllable_slp1("a~")
    assert c_candrabindu["deva"] == "अँ"
    assert c_candrabindu["engine"] == "studio_24k"
    assert c_candrabindu["vitsQuery"] == "अँ"

    c_rka = condition_single_syllable_slp1("rka")
    assert c_rka["deva"] == "र्क"
    assert c_rka["vitsQuery"] == f"अर्क{VITS_INHERENT_A_MARKER}"

    c_nka = condition_single_syllable_slp1("Nka")
    assert c_nka["deva"] == "ङ्क"
    assert c_nka["vitsQuery"] == f"अङ्क{VITS_INHERENT_A_MARKER}"

    c_pra = condition_single_syllable_slp1("pra")
    assert c_pra["vitsQuery"] == f"प्र{VITS_INHERENT_A_MARKER}"


def test_all_svaras_and_critical_syllables_synthesize_cleanly_48khz() -> None:
    engine = get_tts_engine()

    # 1. All 16 standalone Svaras + Candrabindu Svara ('a~') across male (MMS 16k->48k) and female (Studio 24k->48k)
    for svara in list(STANDALONE_SVARAS) + ["a~"]:
        for voice in ("male", "female"):
            res = engine.synthesize_single_syllable(svara, voice=voice, rate=1.0)
            assert res["sampleRate"] == TARGET_SAMPLE_RATE
            assert res["peak"] >= 0.80, f"Low peak for svara={svara} ({voice}): {res['peak']}"
            assert res["rms"] >= 0.05, f"Low RMS for svara={svara} ({voice}): {res['rms']}"
            assert 0.07 <= res["durationSec"] <= 0.75, f"Bad duration for svara={svara} ({voice}): {res['durationSec']}"

    # 2. Previously broken / noisy Bījas, diphthongs, retroflexes, Vedic ḷa, and Siddhaṃ Ch. 8–15 ligatures
    critical_keys = [
        "CO", "cO", "kf", "tu", "vi", "Wo", "haM", "La", "LO",
        "rka", "Nka", "Yca", "Rwu", "Paw", "oM", "hrIH", "BrUM",
    ]
    for key in critical_keys:
        for voice in ("male", "female", "mobile"):
            res = engine.synthesize_single_syllable(key, voice=voice, rate=1.0)
            assert res["sampleRate"] == TARGET_SAMPLE_RATE
            assert res["peak"] >= 0.80, f"Low peak for {key} ({voice}): {res['peak']}"
            assert res["rms"] >= 0.05, f"Low RMS for {key} ({voice}): {res['rms']}"
            assert 0.12 <= res["durationSec"] <= 0.75, f"Bad duration for {key} ({voice}): {res['durationSec']}"

    # 3. Guru vs Laghu prosodic ratio invariant
    res_ka = engine.synthesize_single_syllable("ka", voice="male", rate=1.0)
    res_kA = engine.synthesize_single_syllable("kA", voice="male", rate=1.0)
    assert res_kA["durationSec"] > res_ka["durationSec"] * 1.45


def test_fastapi_syllable_endpoint_multi_script_queries() -> None:
    async def _run() -> None:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            queries = [
                ("chau", "छौ"),
                ("CO", "छौ"),
                ("छौ", "छौ"),
                ("चौ", "चौ"),
                ("ḷa", "ळ"),
                ("am\u0310", "अँ"),
                ("ṛ", "ऋ"),
                ("क्", "क्"),
                ("rka", "र्क"),
                ("𑖌𑖼", "ओँ"),
                ("𑖌𑖽", "ॐ"),
            ]
            for raw_q, expected_deva in queries:
                encoded = urllib.parse.quote(raw_q, safe="")
                resp = await client.get(f"/api/syllable/{encoded}?voice=male&format=json")
                assert resp.status_code == 200, f"HTTP {resp.status_code} for {raw_q!r}: {resp.text}"
                data = resp.json()
                assert data["deva"] == expected_deva
                assert data["sampleRate"] == TARGET_SAMPLE_RATE
                assert data["durationSec"] > 0.05
                assert len(data["audioBase64Wav"]) > 1000

    anyio.run(_run)
