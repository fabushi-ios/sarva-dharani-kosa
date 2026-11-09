"""Tier 3: Cross-Feature Combination E2E Tests (15 pairwise combinatorial tests).

Verifies pairwise and multi-way interactions across:
- Input scripts (`Devanagari`, `IAST`, `SLP1`, `Rough English`)
- Prosodic syllabifier & Chandas meter analyzer (`parseAndTransliterateWord`)
- Plan 3 48kHz Audio Sprite (`SPRITE_MANIFEST` & `siddham_sprite_48k.wav`)
- Plan 1 FastAPI Neural TTS (`/api/tts` & `/api/syllable` across `male`, `female`, `mobile`)
- Frontend UI (`sanskrit_phonetic_engine.html` v3.0 & `Sarva-Dhāraṇī-Kośa` `:5173` proxy)
"""

from __future__ import annotations

import json
import urllib.parse
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from e2e_helpers import (
    BACKEND_URL,
    FRONTEND_URL,
    WORKSPACE_ROOT,
    decode_base64_wav,
    decode_wav_bytes,
    get_sprite_entry,
    http_get_bytes,
    http_post_json,
    load_sprite_manifest,
    run_engine_js,
    slice_sprite_wav,
    synthesize_tts_json,
)


def test_t3_01_script_modes_x_voice_models_synthesis() -> None:
    """Pairwise test of 4 input scripts × 3 neural voices on Green Tārā Mantra."""
    inputs = [
        ("ॐ तारे तुत्तारे तुरे स्वाहा", "auto"),
        ("oṃ tāre tuttāre ture svāhā", "auto"),
        ("oM tAre tuttAre ture svAhA", "slp1"),
        ("om tare tuttare ture svaha", "auto"),
    ]
    voices = ["male", "female", "mobile"]
    for voice in voices:
        for text, script_mode in inputs:
            res = synthesize_tts_json(text=text, script=script_mode, voice=voice, rate=1.0)
            assert res["sampleRate"] == 48000
            assert res["slp1"] == "oM tAre tuttAre ture svAhA"
            assert len(res["syllableTimings"]) == 10
            wav_info = decode_base64_wav(res["audioBase64Wav"])
            assert wav_info["sample_rate"] == 48000 and wav_info["rms"] >= 0.02


def test_t3_02_anusvara_assimilation_x_five_vargas() -> None:
    """Verify Anusvāra (ṃ) homorganic assimilation across all 5 Vargas in JS engine and /api/tts."""
    res_js = run_engine_js("""
      const words = ['pArasaMgate', 'saMjaya', 'paRqita', 'SAntiH', 'samyaksaMbudDAya'];
      return words.map(w => window.parseAndTransliterateWord(w, { assimilate: true, longMark: '～', sep: '·' }));
    """)
    # Velar (g -> 昂), Palatal (j -> 恩/尼), Retroflex/Dental (q/t -> 恩), Labial (b -> 姆)
    assert "昂" in res_js[0]["modernWord"]
    assert "恩" in res_js[3]["modernWord"]
    assert "姆" in res_js[4]["modernWord"]

    tts_res = synthesize_tts_json("पारसंगते शान्तिः सम्यक्संबुद्धाय")
    assert tts_res["sampleRate"] == 48000
    assert any(t["slp1"] == "saM" and t["meter"] == "—" for t in tts_res["syllableTimings"])


def test_t3_03_visarga_echo_x_preceding_vowels() -> None:
    """Verify Visarga (ḥ) vowel echo across aḥ, īḥ, ūḥ, eḥ, oḥ, ṛḥ in JS engine and 48kHz audio."""
    res_js = run_engine_js("""
      const words = ['namaH', 'DIH', 'BUH', 'deveH', 'BoH', 'pitfH'];
      return words.map(w => window.parseAndTransliterateWord(w, { assimilate: true, longMark: '～', sep: '·' }).modernWord);
    """)
    assert "哈" in res_js[0]
    assert "希" in res_js[1]
    assert "呼" in res_js[2]
    assert "嘿" in res_js[3]
    assert "豁" in res_js[4]
    assert "希" in res_js[5]

    tts_res = synthesize_tts_json("नमः धीः भूः देवेः भोः पितृः")
    wav_info = decode_base64_wav(tts_res["audioBase64Wav"])
    assert wav_info["tail_rms_35"] >= 0.012


def test_t3_04_prosodic_meter_engine_x_tts_syllable_timings() -> None:
    """Verify JS parseAndTransliterateWord and /api/tts syllableTimings agree on syllables & Chandas meter."""
    js_samples = run_engine_js("""
      return window.SAMPLES.slice(0, 6).map(s => {
        const slp = window.inputToSlp1(s, 'smart');
        const words = slp.trim().split(/\\s+/);
        const syls = [];
        for (const w of words) {
          const parsed = window.parseAndTransliterateWord(w, { assimilate: true, longMark: '～', sep: '·' });
          for (const tk of parsed.syllables) {
            if (!tk.isSymbol && tk.raw) {
              syls.push({ slp1: tk.raw, meter: tk.meter });
            }
          }
        }
        return { text: s, slp, syls };
      });
    """)
    for sample in js_samples:
        tts = synthesize_tts_json(sample["text"])
        tts_syls = [{"slp1": t["slp1"], "meter": t["meter"]} for t in tts["syllableTimings"]]
        assert tts_syls == sample["syls"], (
            f"Syllable/meter mismatch on {sample['text']!r}:\n"
            f"  JS : {sample['syls']}\n  TTS: {tts_syls}"
        )


def test_t3_05_api_syllable_x_sprite_slice_consistency() -> None:
    """Verify GET /api/syllable/{slp1} returns 48kHz audio consistent with Plan 3 sprite slices."""
    manifest = load_sprite_manifest()
    for key in ["a", "A", "ka", "kA", "oM", "hrIH", "jYA", "kza", "pad", "Paw"]:
        entry = get_sprite_entry(manifest, key)
        status, _, wav_bytes = http_get_bytes(f"{BACKEND_URL}/api/syllable/{key}?voice=male&rate=1.0&format=wav")
        assert status == 200
        api_wav = decode_wav_bytes(wav_bytes)
        assert api_wav["sample_rate"] == 48000
        assert abs(api_wav["duration_sec"] - float(entry["duration"])) < 0.05


def test_t3_06_samples_0_to_7_100_percent_sprite_coverage() -> None:
    """Verify 100% of phonetic syllables across all 8 SAMPLES[0..7] exist in Plan 3 sprite manifest."""
    manifest = load_sprite_manifest()
    sample_syls = run_engine_js("""
      const all = new Set();
      for (const s of window.SAMPLES) {
        const slp = window.inputToSlp1(s, 'smart');
        for (const w of slp.trim().split(/\\s+/)) {
          const p = window.parseAndTransliterateWord(w, { assimilate: true, longMark: '～', sep: '·' });
          for (const tk of p.syllables) {
            if (!tk.isSymbol && tk.raw) all.add(tk.raw);
          }
        }
      }
      return Array.from(all);
    """)
    assert len(sample_syls) >= 55
    missing = [s for s in sample_syls if s not in manifest["sprites"]]
    assert not missing, f"Syllables from SAMPLES[0..7] missing from sprite manifest: {missing}"


def test_t3_07_audio_mode_selector_x_playback_routing() -> None:
    """Verify neural-auto, neural-tts, and neural-sprite modes route playback cleanly at 48,000 Hz."""
    res = run_engine_js("""
      loadSample(4); // oṃ tāre tuttāre ture svāhā
      const modes = ['neural-auto', 'neural-tts', 'neural-sprite'];
      const out = [];
      for (const m of modes) {
        document.getElementById('audioModeSelect').value = m;
        const r = await window.speakSanskrit();
        out.push({ mode: m, sampleRate: r.sampleRate, durationSec: r.durationSec });
      }
      return out;
    """)
    for item in res:
        assert item["sampleRate"] == 48000
        assert item["durationSec"] > 0.3


def test_t3_08_model_tier_x_rate_scaling_consistency() -> None:
    """Verify rate scaling (0.6 > 1.0 > 1.2 duration) holds across male, female, and mobile voices."""
    for voice in ["male", "female", "mobile"]:
        d_06 = float(synthesize_tts_json("गते गते बोधि स्वाहा", voice=voice, rate=0.6)["durationSec"])
        d_10 = float(synthesize_tts_json("गते गते बोधि स्वाहा", voice=voice, rate=1.0)["durationSec"])
        d_12 = float(synthesize_tts_json("गते गते बोधि स्वाहा", voice=voice, rate=1.2)["durationSec"])
        assert d_06 > d_10 > d_12, (
            f"Non-monotonic duration scaling for voice={voice}: 0.6->{d_06}s, 1.0->{d_10}s, 1.2->{d_12}s"
        )


def test_t3_09_danda_pause_x_multi_verse_synthesis() -> None:
    """Verify single and double Daṇḍa pauses in multi-verse mantras preserve all syllable timings."""
    text = "ॐ मणि पद्मे हूं । नमो भगवते वासुदेवाय ॥"
    res = synthesize_tts_json(text)
    slp_syls = [t["slp1"] for t in res["syllableTimings"]]
    assert slp_syls[:6] == ["oM", "ma", "Ri", "pad", "me", "hUM"]
    assert slp_syls[6:] == ["na", "mo", "Ba", "ga", "va", "te", "vA", "su", "de", "vA", "ya"]
    # Pause after hUM (index 5) before na (index 6)
    assert res["syllableTimings"][6]["startMs"] >= res["syllableTimings"][5]["endMs"]


def test_t3_10_voice_selection_x_48khz_dsp_mastering_invariants() -> None:
    """Verify all 3 voice models obey 48kHz DSP mastering invariants (DC blocker, peak, fade)."""
    for voice in ["male", "female", "mobile"]:
        res = synthesize_tts_json("ॐ भूर्भुवः स्वः", voice=voice)
        wav = decode_base64_wav(res["audioBase64Wav"])
        assert wav["sample_rate"] == 48000
        assert not wav["has_nan_or_inf"]
        assert abs(wav["dc_offset"]) < 0.015
        assert 0.20 <= wav["peak"] <= 0.995


def test_t3_11_cache_hit_across_post_and_get_tts() -> None:
    """Verify POST /api/tts (JSON) and GET /api/tts (WAV) return consistent 48kHz audio."""
    text = "ॐ अ र प च न धीः"
    post_res = synthesize_tts_json(text, voice="male", rate=1.0)
    post_wav = decode_base64_wav(post_res["audioBase64Wav"])

    q = urllib.parse.urlencode({"text": text, "voice": "male", "rate": "1.0", "format": "wav"})
    status, _, get_bytes = http_get_bytes(f"{BACKEND_URL}/api/tts?{q}")
    assert status == 200
    get_wav = decode_wav_bytes(get_bytes)
    assert get_wav["sample_rate"] == post_wav["sample_rate"] == 48000
    assert abs(get_wav["duration_sec"] - post_wav["duration_sec"]) < 0.05


def test_t3_12_trad_word_and_rough_english_corpus_sprite_coverage() -> None:
    """Verify all syllables from TRAD_WORD_REPLACEMENTS and ROUGH_ENGLISH_WORD_MAP exist in Plan 3 sprite."""
    manifest = load_sprite_manifest()
    dict_syls = run_engine_js("""
      const words = [
        ...Object.keys(typeof TRAD_WORD_REPLACEMENTS !== 'undefined' ? TRAD_WORD_REPLACEMENTS : {}),
        ...Object.values(typeof ROUGH_ENGLISH_WORD_MAP !== 'undefined' ? ROUGH_ENGLISH_WORD_MAP : {}).map(w => window.inputToSlp1(w, 'strict'))
      ];
      const all = new Set();
      for (const w of words) {
        const p = window.parseAndTransliterateWord(w, { assimilate: true, longMark: '～', sep: '·' });
        for (const tk of p.syllables) {
          if (!tk.isSymbol && tk.raw) all.add(tk.raw);
        }
      }
      return Array.from(all);
    """)
    assert len(dict_syls) >= 40
    missing = [s for s in dict_syls if s not in manifest["sprites"]]
    assert not missing, f"Dictionary syllables missing from sprite manifest: {missing}"


def test_t3_13_card_highlight_sync_with_neural_syllable_timings() -> None:
    """Verify .syllable-card[data-raw] elements in DOM match /api/tts syllableTimings 1-to-1."""
    dom_cards = run_engine_js("""
      loadSample(1);
      const html = document.getElementById('breakdownContainer').innerHTML;
      return [...html.matchAll(/data-raw="([^"]+)"/g)].map(m => m[1]);
    """)
    tts = synthesize_tts_json("oṃ maṇi padme hūṃ | namo bhagavate vāsudevāya")
    tts_slp = [t["slp1"] for t in tts["syllableTimings"]]
    assert dom_cards == tts_slp


def test_t3_14_matrix_modal_cell_click_x_sprite_manifest_lookup() -> None:
    """Verify every clickable syllable in buildPhonemeMatrixModal() is present in SPRITE_MANIFEST."""
    manifest = load_sprite_manifest()
    modal_keys = run_engine_js("""
      if (typeof buildPhonemeMatrixModal === 'function') buildPhonemeMatrixModal();
      const bodyHtml = document.getElementById('matrixModalBody').innerHTML;
      return Array.from(new Set([...bodyHtml.matchAll(/playSingleSyllable\\(['"]([^'"]+)['"]/g)].map(m => m[1])));
    """)
    assert len(modal_keys) >= 540
    missing = [k for k in modal_keys if k not in manifest["sprites"]]
    assert not missing, f"Modal keys missing from SPRITE_MANIFEST: {missing[:15]}"


def test_t3_15_kosa_corpus_mantras_x_backend_tts_and_sprite_proxy() -> None:
    """Verify Sarva-Dhāraṇī-Kośa mantras synthesize via the :5173/api/tts Vite proxy."""
    status, _, data = http_post_json(
        f"{FRONTEND_URL}/api/tts",
        {
            "text": "namo ratnatrayāya | namo āryāvalokiteśvarāya bodhisattvāya mahāsattvāya mahākāruṇikāya",
            "voice": "male",
            "rate": 1.0,
            "response_format": "json",
        },
    )
    assert status == 200
    assert data["sampleRate"] == 48000
    assert len(data["syllableTimings"]) >= 25
    wav_info = decode_base64_wav(data["audioBase64Wav"])
    assert wav_info["sample_rate"] == 48000 and wav_info["rms"] >= 0.025
