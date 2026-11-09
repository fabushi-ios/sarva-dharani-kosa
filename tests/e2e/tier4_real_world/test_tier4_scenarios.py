"""Tier 4: Real-World Application Scenario E2E Tests (8 end-to-end user scenarios).

Each test simulates a complete, multi-step scholar/practitioner workflow across
both `sanskrit_phonetic_engine.html` v3.0 and `Sarva-Dhāraṇī-Kośa` (`:5173` & `:8765`).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from e2e_helpers import (
    BACKEND_URL,
    CANONICAL_14_MATRIX_VOWELS,
    CANONICAL_16_SVARAS,
    CANONICAL_34_CONSONANTS,
    FRONTEND_URL,
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


def test_t4_01_heart_sutra_mantra_full_pipeline_and_frame_timings() -> None:
    """Scenario 1: Heart Sūtra Mantra end-to-end transliteration, per-card 48kHz sprite, and /api/tts timings."""
    mantra = "gate gate pāragate pārasaṃgate bodhi svāhā"
    js_res = run_engine_js(f"""
      document.getElementById('sanskritInput').value = {json.dumps(mantra)};
      if (typeof processInput === 'function') processInput();
      const cards = [...document.getElementById('breakdownContainer').innerHTML.matchAll(/data-raw="([^"]+)"/g)].map(m => m[1]);
      const cardPlays = [];
      for (let i = 0; i < cards.length; i++) {{
        cardPlays.push(await window.playSingleSyllable(cards[i], i));
      }}
      return {{
        iast: document.getElementById('iastOut').textContent,
        deva: document.getElementById('devaOut').textContent,
        slp1: document.getElementById('slp1Out').textContent,
        modern: document.getElementById('modernOut').textContent,
        trad: document.getElementById('tradOut').textContent,
        cards,
        cardPlays
      }};
    """)
    expected_cards = [
        "ga", "te", "ga", "te",
        "pA", "ra", "ga", "te",
        "pA", "ra", "saM", "ga", "te",
        "bo", "Di", "svA", "hA",
    ]
    # Note: gate (2) + gate (2) + pAragate (4) + pArasaMgate (5) + boDi (2) + svAhA (2) = 15 syllables
    expected_15 = [
        "ga", "te", "ga", "te",
        "pA", "ra", "ga", "te",
        "pA", "ra", "saM", "ga", "te",
        "bo", "Di", "svA", "hA",
    ]
    # Wait: 2 + 2 + 4 + 5 + 2 + 2 = 17? Let's check:
    # ga-te (2), ga-te (2), pA-ra-ga-te (4), pA-ra-saM-ga-te (5), bo-Di (2), svA-hA (2) -> 2+2+4+5+2+2 = 17 or 15?
    # Wait: 2+2=4, +4=8, +5=13, +2=15, +2=17! Wait: why did explorer_survey_3 say 15 tokens? Because gate is repeated twice!
    assert js_res["cards"] == expected_15
    assert all(p["sampleRate"] == 48000 and p["source"] == "neural-sprite" for p in js_res["cardPlays"])
    assert "揭谛" in js_res["trad"] and "萨婆诃" in js_res["trad"]

    tts_res = synthesize_tts_json(mantra)
    assert tts_res["sampleRate"] == 48000
    assert [t["slp1"] for t in tts_res["syllableTimings"]] == expected_15
    wav_info = decode_base64_wav(tts_res["audioBase64Wav"])
    assert wav_info["sample_rate"] == 48000
    assert wav_info["duration_sec"] >= 2.2
    assert wav_info["rms"] >= 0.025


def test_t4_02_six_syllable_and_vasudeva_mantra_with_danda_and_closed_pad() -> None:
    """Scenario 2: oṃ maṇi padme hūṃ | namo bhagavate vāsudevāya with Daṇḍa pause and closed 'pad'."""
    mantra = "oṃ maṇi padme hūṃ | namo bhagavate vāsudevāya"
    js_res = run_engine_js(f"""
      document.getElementById('sanskritInput').value = {json.dumps(mantra)};
      if (typeof processInput === 'function') processInput();
      const cards = [...document.getElementById('breakdownContainer').innerHTML.matchAll(/data-raw="([^"]+)"/g)].map(m => m[1]);
      return {{
        deva: document.getElementById('devaOut').textContent,
        slp1: document.getElementById('slp1Out').textContent,
        cards
      }};
    """)
    expected_syls = [
        "oM", "ma", "Ri", "pad", "me", "hUM",
        "na", "mo", "Ba", "ga", "va", "te", "vA", "su", "de", "vA", "ya",
    ]
    assert js_res["cards"] == expected_syls

    manifest = load_sprite_manifest()
    pad_entry = get_sprite_entry(manifest, "pad")
    assert pad_entry["meter"] == "—"
    pad_wav = slice_sprite_wav(pad_entry["offset"], pad_entry["duration"])
    assert pad_wav["rms"] >= 0.02

    tts_res = synthesize_tts_json(mantra)
    assert [t["slp1"] for t in tts_res["syllableTimings"]] == expected_syls
    assert tts_res["syllableTimings"][3]["slp1"] == "pad"
    assert tts_res["syllableTimings"][3]["meter"] == "—"


def test_t4_03_vedic_gayatri_mantra_devanagari_end_to_end() -> None:
    """Scenario 3: Vedic Gāyatrī Mantra in Devanagari verifying ॐ, भूर्, भुवः, स्वः, नः, प्रचोदयात्."""
    gayatri = "ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्"
    js_res = run_engine_js(f"""
      document.getElementById('sanskritInput').value = {json.dumps(gayatri)};
      if (typeof processInput === 'function') processInput();
      const cards = [...document.getElementById('breakdownContainer').innerHTML.matchAll(/data-raw="([^"]+)"/g)].map(m => m[1]);
      return {{
        iast: document.getElementById('iastOut').textContent,
        slp1: document.getElementById('slp1Out').textContent,
        cards
      }};
    """)
    expected_28 = [
        "oM", "BUr", "Bu", "vaH", "svaH",
        "tat", "sa", "vi", "tur", "va", "reR", "yaM",
        "Bar", "go", "de", "va", "sya", "DI", "ma", "hi",
        "Di", "yo", "yo", "naH", "pra", "co", "da", "yAt",
    ]
    assert js_res["cards"] == expected_28

    manifest = load_sprite_manifest()
    for key in ["oM", "BUr", "Bu", "vaH", "svaH", "tat", "tur", "reR", "yaM", "Bar", "sya", "naH", "pra", "co", "da", "yAt"]:
        ent = get_sprite_entry(manifest, key)
        wav_slice = slice_sprite_wav(ent["offset"], ent["duration"])
        assert wav_slice["rms"] >= 0.015, f"Gāyatrī syllable {key} silent in 48kHz sprite"

    tts_res = synthesize_tts_json(gayatri)
    assert tts_res["sampleRate"] == 48000
    assert [t["slp1"] for t in tts_res["syllableTimings"]] == expected_28
    wav_info = decode_base64_wav(tts_res["audioBase64Wav"])
    assert wav_info["duration_sec"] >= 4.0 and wav_info["rms"] >= 0.025


def test_t4_04_medicine_buddha_bhaisajyaguru_dharani_55_syllable_recitation() -> None:
    """Scenario 4: Bhaiṣajyaguru Dhāraṇī full recitation & 100% syllable coverage check."""
    dharani = (
        "namo bhagavate bhaiṣajyaguru vaidūryaprabharājāya tathāgatāya "
        "arhate samyaksaṃbuddhāya tadyathā oṃ bhaiṣajye bhaiṣajye "
        "mahābhaiṣajye rājasamudgate svāhā"
    )
    js_res = run_engine_js(f"""
      document.getElementById('sanskritInput').value = {json.dumps(dharani)};
      if (typeof processInput === 'function') processInput();
      const cards = [...document.getElementById('breakdownContainer').innerHTML.matchAll(/data-raw="([^"]+)"/g)].map(m => m[1]);
      return cards;
    """)
    assert len(js_res) >= 53

    manifest = load_sprite_manifest()
    missing = [s for s in set(js_res) if s not in manifest["sprites"]]
    assert not missing, f"Bhaiṣajyaguru syllables missing from 48kHz sprite: {missing}"

    tts_res = synthesize_tts_json(dharani)
    assert tts_res["sampleRate"] == 48000
    assert [t["slp1"] for t in tts_res["syllableTimings"]] == js_res
    wav_info = decode_base64_wav(tts_res["audioBase64Wav"])
    assert wav_info["duration_sec"] >= 6.0 and not wav_info["has_nan_or_inf"]


def test_t4_05_complete_34x14_siddham_phonetic_matrix_acoustic_sweep() -> None:
    """Scenario 5: Complete 34×14 Siddhaṃ Phonetic Matrix acoustic sweep across all 5 Vargas + Semivowels + Sibilants."""
    manifest = load_sprite_manifest()
    varga_groups = {
        "Velar (Ka-varga)": ["k", "K", "g", "G", "N"],
        "Palatal (Ca-varga)": ["c", "C", "j", "J", "Y"],
        "Retroflex (Ṭa-varga)": ["w", "W", "q", "Q", "R"],
        "Dental (Ta-varga)": ["t", "T", "d", "D", "n"],
        "Labial (Pa-varga)": ["p", "P", "b", "B", "m"],
        "Semivowels (Antaḥstha)": ["y", "r", "l", "v"],
        "Sibilants & Aspirate (Ūṣman + Vedic)": ["S", "z", "s", "h", "L"],
    }
    laghu_set = {"a", "i", "u", "f", "x"}

    for group_name, cons_list in varga_groups.items():
        group_laghu = []
        group_guru = []
        for c in cons_list:
            for v in CANONICAL_14_MATRIX_VOWELS:
                key = f"{c}{v}"
                ent = get_sprite_entry(manifest, key)
                dur = float(ent["duration"])
                rms = float(ent.get("rms", 0.05))
                peak = float(ent.get("peak", 0.5))
                assert dur >= 0.12, f"{group_name} cell {key} duration too short: {dur}"
                assert rms >= 0.015, f"{group_name} cell {key} RMS too low: {rms}"
                assert 0.05 <= peak <= 1.0, f"{group_name} cell {key} peak out of range: {peak}"
                if v in laghu_set:
                    group_laghu.append(dur)
                else:
                    group_guru.append(dur)

        assert (sum(group_guru) / len(group_guru)) > (sum(group_laghu) / len(group_laghu)) * 1.25, (
            f"Guru/Laghu contrast failed in {group_name}"
        )


def test_t4_06_rough_english_user_input_auto_correction_to_48khz_speech() -> None:
    """Scenario 6: Rough English user input auto-corrected to Classical Sanskrit and synthesized at 48kHz."""
    rough_inputs = [
        (
            "om mani padme hum | om shanti shanti shantih",
            "oM maRi padme hUM | oM SAntiH SAntiH SAntiH",
            "ॐ मणि पद्मे हूं । ॐ शान्तिः शान्तिः शान्तिः",
        ),
        (
            "namo ratna trayaya",
            "namo ratna trayAya",
            "नमो रत्न त्रयाय",
        ),
    ]
    for raw_en, expected_slp, expected_deva in rough_inputs:
        js_out = run_engine_js(f"""
          setInputMode('smart');
          document.getElementById('sanskritInput').value = {json.dumps(raw_en)};
          if (typeof processInput === 'function') processInput();
          return {{
            slp1: document.getElementById('slp1Out').textContent,
            deva: document.getElementById('devaOut').textContent,
            iast: document.getElementById('iastOut').textContent
          }};
        """)
        assert js_out["slp1"] == expected_slp
        assert js_out["deva"] == expected_deva

        tts_res = synthesize_tts_json(raw_en, script="auto")
        assert tts_res["sampleRate"] == 48000
        assert tts_res["slp1"] == expected_slp
        wav_info = decode_base64_wav(tts_res["audioBase64Wav"])
        assert wav_info["rms"] >= 0.025


def test_t4_07_sacred_bija_mantra_male_vs_female_prosody_study() -> None:
    """Scenario 7: Sacred Bīja Mantra study (oṃ, hūṃ, hrīḥ, śrīṃ, klīṃ, dhīḥ, bhrūṃ, phaṭ) across Male & Female voices."""
    bijas_slp = ["oM", "hUM", "hrIH", "SrIM", "klIM", "DIH", "BrUM", "Paw"]
    bija_text_iast = "oṃ hūṃ hrīḥ śrīṃ klīṃ dhīḥ bhrūṃ phaṭ"

    manifest = load_sprite_manifest()
    for b in bijas_slp:
        ent = get_sprite_entry(manifest, b)
        assert ent["meter"] == "—", f"Sacred Bīja {b} must be Guru (—)"
        assert float(ent["duration"]) >= 0.22, f"Sacred Bīja {b} too short in sprite: {ent['duration']}"
        w = slice_sprite_wav(ent["offset"], ent["duration"])
        assert w["rms"] >= 0.025

    res_male = synthesize_tts_json(bija_text_iast, voice="male", rate=1.0)
    res_female = synthesize_tts_json(bija_text_iast, voice="female", rate=1.0)

    assert [t["slp1"] for t in res_male["syllableTimings"]] == bijas_slp
    assert [t["slp1"] for t in res_female["syllableTimings"]] == bijas_slp
    assert all(t["meter"] == "—" for t in res_male["syllableTimings"])

    wav_m = decode_base64_wav(res_male["audioBase64Wav"])
    wav_f = decode_base64_wav(res_female["audioBase64Wav"])
    assert wav_m["sample_rate"] == 48000 and wav_f["sample_rate"] == 48000
    assert wav_m["rms"] >= 0.025 and wav_f["rms"] >= 0.025
    assert res_male["audioBase64Wav"] != res_female["audioBase64Wav"]


def test_t4_08_sarva_dharani_kosa_full_user_journey_across_all_views() -> None:
    """Scenario 8: Sarva-Dhāraṇī-Kośa (http://localhost:5173/) end-to-end journey across all views & proxy."""
    # 1. Main app shell loads on :5173
    s_idx, _, b_idx = http_get_bytes(f"{FRONTEND_URL}/")
    assert s_idx == 200 and b"root" in b_idx

    # 2. Embedded Engine v3.0 loads on :5173/sanskrit_phonetic_engine.html
    s_eng, _, b_eng = http_get_bytes(f"{FRONTEND_URL}/sanskrit_phonetic_engine.html")
    assert s_eng == 200 and b"SPRITE_MANIFEST" in b_eng

    # 3. Phonetics Academy & Reader fetch Plan 3 manifest & 48kHz Ogg via :5173/audio/*
    s_man, _, man_json = http_get_json(f"{FRONTEND_URL}/audio/siddham_sprite_manifest.json")
    assert s_man == 200 and man_json["sampleRate"] == 48000 and len(man_json["sprites"]) >= 600

    s_ogg, _, b_ogg = http_get_bytes(f"{FRONTEND_URL}/audio/siddham_sprite_48k.ogg")
    assert s_ogg == 200 and len(b_ogg) > 200_000

    # 4. Single-syllable click via :5173/api/syllable/oM
    s_syl, _, b_syl = http_get_bytes(f"{FRONTEND_URL}/api/syllable/oM?format=wav")
    assert s_syl == 200
    assert decode_wav_bytes(b_syl)["sample_rate"] == 48000

    # 5. Custom Dhāraṇī Compiler / Reader verse recitation via :5173/api/tts
    s_tts, _, tts_data = http_post_json(
        f"{FRONTEND_URL}/api/tts",
        {
            "text": "ॐ भूर्भुवः स्वः । गते गते पारगते पारसंगते बोधि स्वाहा",
            "voice": "male",
            "rate": 1.0,
            "response_format": "json",
        },
    )
    assert s_tts == 200
    assert tts_data["sampleRate"] == 48000
    assert len(tts_data["syllableTimings"]) == 22
    assert decode_base64_wav(tts_data["audioBase64Wav"])["rms"] >= 0.025
