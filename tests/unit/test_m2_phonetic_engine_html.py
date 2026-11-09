"""
Milestone M2 Unit & Integration Test Suite (`test_m2_phonetic_engine_html.py`):
Covers F6 (Zero-Latency Web Audio API 48kHz Sprite Player & Prosodic Concatenator)
and F7 (Upgraded `sanskrit_phonetic_engine.html` v3.0 Neural + 48kHz 34×14 Matrix Edition).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import httpx
import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(PROJECT_ROOT / "tests" / "e2e") not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT / "tests" / "e2e"))

from e2e_helpers import (
    CANONICAL_14_MATRIX_VOWELS,
    CANONICAL_16_SVARAS,
    CANONICAL_28_OVERRIDES,
    CANONICAL_34_CONSONANTS,
    PUBLIC_ENGINE_HTML,
    ROOT_ENGINE_HTML,
    load_sprite_manifest,
    run_engine_js,
)

API_BASE = "http://127.0.0.1:8765"


def test_m2_01_files_exist_synced_and_served_on_8765() -> None:
    """Verify sanskrit_phonetic_engine.html exists at root and public/, is identical, and is served on :8765."""
    assert ROOT_ENGINE_HTML.exists(), f"Missing {ROOT_ENGINE_HTML}"
    assert PUBLIC_ENGINE_HTML.exists(), f"Missing {PUBLIC_ENGINE_HTML}"
    root_text = ROOT_ENGINE_HTML.read_text(encoding="utf-8")
    pub_text = PUBLIC_ENGINE_HTML.read_text(encoding="utf-8")
    assert len(root_text) > 50_000
    assert root_text == pub_text, "Root and public/ sanskrit_phonetic_engine.html must be identical"

    with httpx.Client(trust_env=False, timeout=15.0) as client:
        resp = client.get(f"{API_BASE}/sanskrit_phonetic_engine.html")
        assert resp.status_code == 200
        assert "CONS_MATRIX" in resp.text
        assert "SPRITE_MANIFEST" in resp.text
        assert "v3.0" in resp.text


def test_m2_02_legacy_136_1hz_sawtooth_completely_removed() -> None:
    """Verify legacy 136.1Hz sawtooth oscillator synthesis has been completely removed."""
    html_text = ROOT_ENGINE_HTML.read_text(encoding="utf-8")
    assert "136.1" not in html_text, "Legacy 136.1Hz oscillator frequency must not appear in v3.0 HTML"
    assert "sawtooth" not in html_text, "Legacy sawtooth oscillator must not appear in v3.0 HTML"


def test_m2_03_required_dom_elements_and_audio_voice_controls() -> None:
    """Verify all required DOM IDs, audio mode options, and voice selector options exist."""
    html_text = ROOT_ENGINE_HTML.read_text(encoding="utf-8")
    required_ids = [
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
    ]
    for dom_id in required_ids:
        assert f'id="{dom_id}"' in html_text, f"Missing required DOM element #{dom_id}"

    for mode_opt in ["neural-auto", "neural-tts", "neural-sprite", "legacy-tts"]:
        assert f'value="{mode_opt}"' in html_text, f"Missing audioModeSelect option {mode_opt}"

    for voice_opt in ["male", "female", "mobile"]:
        assert f'value="{voice_opt}"' in html_text, f"Missing voiceSelect option {voice_opt}"

    for rate_opt in ["0.6", "0.8", "1.0", "1.2"]:
        assert f'value="{rate_opt}"' in html_text, f"Missing speechRate option {rate_opt}"


def test_m2_04_window_globals_and_v2_modules_preserved() -> None:
    """Verify all required window.* globals and v2.0 transliteration/prosody functions work properly."""
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
        hasSpeakSanskrit: typeof window.speakSanskrit === 'function',
        hasStopSpeaking: typeof window.stopSpeaking === 'function',
        hasEnsureSprite: typeof window.ensureSpriteLoaded === 'function',
        hasManifest: Boolean(window.SPRITE_MANIFEST),
        hasBuffer: Boolean(window.spriteAudioBuffer)
      };
    """)
    assert res["consCount"] == 34
    assert res["vowelCount"] == 14
    assert res["overrideCount"] == 28
    assert res["samplesCount"] == 8
    for key in [
        "hasInputToSlp1",
        "hasSlp1ToIast",
        "hasSlp1ToDeva",
        "hasParseWord",
        "hasPlaySingle",
        "hasSpeakSanskrit",
        "hasStopSpeaking",
        "hasEnsureSprite",
        "hasManifest",
        "hasBuffer",
    ]:
        assert res[key] is True, f"Expected {key} to be True, got {res[key]}"


def test_m2_05_transliteration_syllabification_and_linguistic_rules() -> None:
    """Verify multi-script conversion, Chandas meter, Anusvāra assimilation, and Visarga echo."""
    res = run_engine_js("""
      const slpMixed = window.inputToSlp1('ॐ मणि padme hūṃ | नमो bhagavate', 'smart');
      const slpRough = window.inputToSlp1('namo ratna trayaya', 'smart');
      const p1 = window.parseAndTransliterateWord('pArasaMgate', { assimilate: true, longMark: '～', sep: '·' });
      const p2 = window.parseAndTransliterateWord('budDa', { assimilate: true, longMark: '～', sep: '·' });
      return {
        slpMixed,
        slpRough,
        devaRough: window.slp1ToDevanagari(slpRough),
        p1Modern: p1.modernWord,
        p1Trad: p1.tradWord,
        p1Syls: p1.syllables.map(s => ({ raw: s.raw, meter: s.meter })),
        p2Syls: p2.syllables.map(s => ({ raw: s.raw, meter: s.meter }))
      };
    """)
    assert res["slpMixed"] == "oM maRi padme hUM | namo Bagavate"
    assert res["slpRough"] == "namo ratna trayAya"
    assert res["devaRough"] == "नमो रत्न त्रयाय"
    assert "昂" in res["p1Modern"] and "～" in res["p1Modern"] and "·" in res["p1Modern"]
    assert res["p1Trad"] == "波罗僧揭谛"
    assert res["p1Syls"] == [
        {"raw": "pA", "meter": "—"},
        {"raw": "ra", "meter": "⏑"},
        {"raw": "saM", "meter": "—"},
        {"raw": "ga", "meter": "⏑"},
        {"raw": "te", "meter": "—"},
    ]
    assert res["p2Syls"] == [
        {"raw": "bud", "meter": "—"},
        {"raw": "Da", "meter": "⏑"},
    ]


def test_m2_06_zero_latency_48khz_sprite_player_and_fallback() -> None:
    """Verify playSingleSyllable plays 48kHz sprite slices and falls back cleanly on unseen clusters."""
    res = run_engine_js("""
      __playedSources.length = 0;
      const rKa = await window.playSingleSyllable('ka', 0);
      const rHrih = await window.playSingleSyllable('hrIH', 1);
      const rUnseen = await window.playSingleSyllable('krtsn', -1);
      return { rKa, rHrih, rUnseen, played: __playedSources };
    """)
    assert res["rKa"]["source"] == "neural-sprite"
    assert res["rKa"]["sampleRate"] == 48000
    assert res["rKa"]["durationSec"] >= 0.15
    assert res["rHrih"]["source"] == "neural-sprite"
    assert res["rHrih"]["sampleRate"] == 48000
    assert res["rUnseen"]["sampleRate"] == 48000
    assert res["rUnseen"]["source"] in ("neural-tts", "neural-sprite")
    assert len(res["played"]) >= 3
    assert res["played"][0]["offset"] > 0


def test_m2_07_full_sentence_recitation_modes_and_timings() -> None:
    """Verify speakSanskrit() in neural-auto, neural-tts, and neural-sprite modes."""
    res = run_engine_js("""
      document.getElementById('sanskritInput').value = 'oṃ maṇi padme hūṃ';
      window.processInput();

      document.getElementById('audioModeSelect').value = 'neural-sprite';
      __playedSources.length = 0;
      const spriteRes = await window.speakSanskrit();
      const spriteSlices = __playedSources.length;

      document.getElementById('audioModeSelect').value = 'neural-tts';
      const ttsRes = await window.speakSanskrit();

      window.stopSpeaking();
      return { spriteRes, spriteSlices, ttsRes };
    """)
    assert res["spriteRes"]["mode"] == "neural-sprite"
    assert res["spriteRes"]["sampleRate"] == 48000
    assert res["spriteSlices"] == 6
    assert len(res["spriteRes"]["syllableTimings"]) == 6

    assert res["ttsRes"]["mode"] == "neural-tts"
    assert res["ttsRes"]["sampleRate"] == 48000
    assert len(res["ttsRes"]["syllableTimings"]) >= 2


def test_m2_08_phoneme_matrix_modal_34x14_svaras_overrides_virama() -> None:
    """Verify buildPhonemeMatrixModal() renders all 16 Svaras, 28 Overrides, 476 CV cells, and 34 Virāmas."""
    manifest = load_sprite_manifest()
    res = run_engine_js("""
      window.buildPhonemeMatrixModal();
      const bodyHtml = document.getElementById('matrixModalBody').innerHTML;
      const keys = [...bodyHtml.matchAll(/playSingleSyllable\\(['"]([^'"]+)['"]/g)].map(m => m[1]);
      return {
        totalButtons: keys.length,
        uniqueKeys: Array.from(new Set(keys))
      };
    """)
    unique_keys = set(res["uniqueKeys"])
    assert res["totalButtons"] == 554
    # 'hA' appears in both SYLLABLE_OVERRIDES and the 34x14 matrix (h + A), yielding 553 unique keys
    assert len(unique_keys) == 553

    for v in CANONICAL_16_SVARAS:
        assert v in unique_keys, f"Missing Svara {v} in matrix modal"
    for ov in CANONICAL_28_OVERRIDES:
        assert ov in unique_keys, f"Missing Override {ov} in matrix modal"
    for c in CANONICAL_34_CONSONANTS:
        assert c in unique_keys, f"Missing bare Virāma {c} in matrix modal"
        for v in CANONICAL_14_MATRIX_VOWELS:
            assert f"{c}{v}" in unique_keys, f"Missing CV cell {c}{v} in matrix modal"

    missing_in_sprite = [k for k in unique_keys if k not in manifest["sprites"]]
    assert not missing_in_sprite, f"Matrix modal keys missing from sprite manifest: {missing_in_sprite}"


def test_m2_09_live_http_endpoints_and_engine_integration_on_8765() -> None:
    """Verify live HTTP serving of HTML, 48kHz sprite manifest, /api/syllable, and /api/tts on :8765."""
    with httpx.Client(trust_env=False, timeout=30.0) as client:
        h_resp = client.get(f"{API_BASE}/api/health")
        assert h_resp.status_code == 200
        h_data = h_resp.json()
        assert h_data["status"] == "ok"
        assert h_data["sampleRate"] == 48000
        assert h_data["spriteReady"] is True

        m_resp = client.get(f"{API_BASE}/audio/siddham_sprite_manifest.json")
        assert m_resp.status_code == 200
        m_data = m_resp.json()
        assert m_data["sampleRate"] == 48000
        assert len(m_data["sprites"]) >= 650

        s_resp = client.get(f"{API_BASE}/api/syllable/oM?voice=male&rate=1.0&format=json")
        assert s_resp.status_code == 200
        s_data = s_resp.json()
        assert s_data["sampleRate"] == 48000
        assert s_data["slp1"] == "oM"
        assert len(s_data["audioBase64Wav"]) > 1000

        t_resp = client.post(
            f"{API_BASE}/api/tts",
            json={
                "text": "gate gate pāragate pārasaṃgate bodhi svāhā",
                "script": "auto",
                "voice": "male",
                "rate": 1.0,
                "response_format": "json",
            },
        )
        assert t_resp.status_code == 200
        t_data = t_resp.json()
        assert t_data["sampleRate"] == 48000
        assert len(t_data["syllableTimings"]) == 17
        assert len(t_data["audioBase64Wav"]) > 5000

