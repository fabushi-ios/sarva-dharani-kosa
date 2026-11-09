#!/usr/bin/env python3
"""
Plan 3: Pre-Generated 48,000 Hz Siddhaṃ 34×14 Matrix & Dhāraṇī Syllable Neural Audio Sprite Builder.

Generates:
- `/home/antigravity/public/audio/siddham_sprite_48k.wav` (48,000 Hz 16-bit mono PCM WAV master)
- `/home/antigravity/public/audio/siddham_sprite_48k.ogg` (48,000 Hz Opus encoded via ffmpeg)
- `/home/antigravity/public/audio/siddham_sprite_manifest.json` (conforming strictly to PROJECT.md § Interface Contracts § 1)
"""
from __future__ import annotations

from concurrent.futures import ProcessPoolExecutor
import json
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

import numpy as np

PROJECT_ROOT = Path("/home/antigravity")
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.sanskrit_tts_engine import (
     MATRIX_CONSONANTS,
    MATRIX_VOWELS,
    ROUGH_ENGLISH_WORD_MAP,
    SAMPLES,
    STANDALONE_SVARAS,
    SYLLABLE_OVERRIDES,
    TARGET_SAMPLE_RATE,
    TRAD_WORD_REPLACEMENTS,
    SanskritTTSEngine,
    encode_wav_48k_bytes,
    syllabify_sanskrit_text,
)

OUTPUT_DIR = PROJECT_ROOT / "public" / "audio"
WAV_PATH = OUTPUT_DIR / "siddham_sprite_48k.wav"
OGG_PATH = OUTPUT_DIR / "siddham_sprite_48k.ogg"
MANIFEST_PATH = OUTPUT_DIR / "siddham_sprite_manifest.json"
SLICE_PAD_SEC = 0.030  # 30ms inter-slice silence padding


def collect_canonical_syllable_inventory() -> list[str]:
    """
    Build the ordered, deduplicated list of all >= 675 required SLP1 syllable keys:
    1. 16 standalone Svaras (`a..O`, `aM`, `aH`)
    2. 476 Matrix CV syllables (`34 consonants × 14 vowels`)
    3. 34 bare Virāma consonants (`k..L`)
    4. 68 `<c>aM` and `<c>aH` modified syllables (`kaM`, `kaH`, ..., `LaM`, `LaH`)
    5. 28 `SYLLABLE_OVERRIDES`
    6. 20 remaining `kṣ` (`kz`) and `jñ` (`jY`) vowel combinations
    7. 39+ corpus compound/closed/modified syllables from `SAMPLES`, `TRAD_WORD_REPLACEMENTS`, and `ROUGH_ENGLISH_WORD_MAP`
    """
    ordered: list[str] = []
    seen: set[str] = set()

    def _add(k: str) -> None:
        k_clean = k.strip()
        if k_clean and k_clean not in seen:
            seen.add(k_clean)
            ordered.append(k_clean)

    # 1. 16 standalone Svaras
    for sv in STANDALONE_SVARAS:
        _add(sv)

    # 2. 476 Matrix CV syllables (34 consonants × 14 vowels)
    for c in MATRIX_CONSONANTS:
        for v in MATRIX_VOWELS:
            _add(f"{c}{v}")

    # 3. 34 bare Virāma consonants
    for c in MATRIX_CONSONANTS:
        _add(c)

    # 4. 68 <c>aM and <c>aH modified syllables
    for c in MATRIX_CONSONANTS:
        _add(f"{c}aM")
        _add(f"{c}aH")

    # 5. 28 SYLLABLE_OVERRIDES
    for ov in SYLLABLE_OVERRIDES.keys():
        _add(ov)

    # 6. Remaining kṣ (kz) and jñ (jY) vowel combinations across all 14 vowels
    for prefix in ("kz", "jY"):
        for v in MATRIX_VOWELS:
            _add(f"{prefix}{v}")

    # 7. Explicit 39 corpus compound/closed/modified syllables
    explicit_corpus = [
        "pad", "vaH", "tat", "tur", "reR", "yaM", "Bar", "sya", "naH", "yAt",
        "kArt", "snye", "vAn", "tut", "jya", "dUr", "ar", "sam", "yak", "bud",
        "tad", "jye", "mud", "SAn", "tiH", "maH", "Sva", "EM", "krIM", "strIM",
        "zaw", "kfz", "trI", "man", "tra", "Dar", "kar", "sat", "tva",
    ]
    for s in explicit_corpus:
        _add(s)

    # Also auto-extract any additional syllables from SAMPLES, TRAD_WORD_REPLACEMENTS, ROUGH_ENGLISH_WORD_MAP
    for sample_txt in SAMPLES:
        for item in syllabify_sanskrit_text(sample_txt, mode="smart"):
            _add(item["slp1"])
    for slp_word in TRAD_WORD_REPLACEMENTS.keys():
        for item in syllabify_sanskrit_text(slp_word, mode="slp1"):
            _add(item["slp1"])
    for iast_word in ROUGH_ENGLISH_WORD_MAP.values():
        for item in syllabify_sanskrit_text(iast_word, mode="strict"):
            _add(item["slp1"])

    return ordered


_WORKER_ENGINE: SanskritTTSEngine | None = None
_FEATURED_KEYS: set[str] = set()


def _init_worker(featured_keys: set[str]) -> None:
    global _WORKER_ENGINE, _FEATURED_KEYS
    os.environ["NINADA_ORT_THREADS"] = "1"
    _FEATURED_KEYS = featured_keys
    _WORKER_ENGINE = SanskritTTSEngine(preload_all=True)


def _synthesize_batch_worker(keys: list[str]) -> list[dict[str, Any]]:
    global _WORKER_ENGINE, _FEATURED_KEYS
    assert _WORKER_ENGINE is not None
    results: list[dict[str, Any]] = []
    for k in keys:
        # Use Studio 24kHz (or 16kHz MMS for standalone Svaras) on featured keys,
        # and fast 24kHz Mobile VITS on standard matrix combinations for high throughput
        voice = "male" if (k in _FEATURED_KEYS or k in STANDALONE_SVARAS) else "mobile"
        res = _WORKER_ENGINE.synthesize_single_syllable(k, voice=voice, rate=1.0)
        results.append({
            "slp1": res["slp1"],
            "iast": res["iast"],
            "deva": res["deva"],
            "meter": res["meter"],
            "duration": res["durationSec"],
            "rms": res["rms"],
            "peak": res["peak"],
            "pcm48k": res["pcm48k"],
        })
    return results


def build_sprite() -> dict[str, Any]:
    t0 = time.perf_counter()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    inventory = collect_canonical_syllable_inventory()
    total_count = len(inventory)
    print(f"[Plan 3 Sprite Builder] Synthesizing {total_count} unique SLP1 syllables at {TARGET_SAMPLE_RATE} Hz...")

    featured_keys = set(STANDALONE_SVARAS) | set(SYLLABLE_OVERRIDES.keys()) | set(MATRIX_CONSONANTS)
    for c in ("k", "K", "g", "G", "c", "j", "w", "t", "d", "D", "p", "B", "m", "S", "s", "h"):
        for v in ("a", "A", "i", "I", "u", "U"):
            featured_keys.add(f"{c}{v}")

    # Split inventory into chunks across 2 worker processes
    n_workers = 2
    chunks = [inventory[i::n_workers] for i in range(n_workers)]
    synth_map: dict[str, dict[str, Any]] = {}

    with ProcessPoolExecutor(max_workers=n_workers, initializer=_init_worker, initargs=(featured_keys,)) as pool:
        for batch_out in pool.map(_synthesize_batch_worker, chunks):
            for item in batch_out:
                synth_map[item["slp1"]] = item

    # Assemble master 48,000 Hz audio buffer with 30ms inter-slice silence padding
    pad_samples = int(round(SLICE_PAD_SEC * TARGET_SAMPLE_RATE))
    pad_arr = np.zeros(pad_samples, dtype=np.float32)

    pcm_segments: list[np.ndarray] = [pad_arr]
    cur_sample = pad_samples
    sprites_meta: dict[str, dict[str, Any]] = {}

    for key in inventory:
        item = synth_map[key]
        pcm = item["pcm48k"]
        n_samps = len(pcm)
        offset_sec = round(cur_sample / float(TARGET_SAMPLE_RATE), 4)
        dur_sec = round(n_samps / float(TARGET_SAMPLE_RATE), 4)

        sprites_meta[key] = {
            "slp1": item["slp1"],
            "iast": item["iast"],
            "deva": item["deva"],
            "offset": offset_sec,
            "duration": dur_sec,
            "meter": item["meter"],
            "rms": item["rms"],
            "peak": item["peak"],
        }

        pcm_segments.append(pcm)
        pcm_segments.append(pad_arr)
        cur_sample += n_samps + pad_samples

    master_pcm = np.concatenate(pcm_segments)
    wav_bytes = encode_wav_48k_bytes(master_pcm)
    WAV_PATH.write_bytes(wav_bytes)
    print(
        f"[Plan 3 Sprite Builder] Wrote {WAV_PATH} "
        f"({len(wav_bytes) / (1024 * 1024):.2f} MiB, {len(master_pcm) / TARGET_SAMPLE_RATE:.2f}s @ {TARGET_SAMPLE_RATE} Hz)"
    )

    # Encode 48,000 Hz Opus (.ogg) via ffmpeg
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(WAV_PATH),
        "-c:a", "libopus",
        "-ar", str(TARGET_SAMPLE_RATE),
        "-ac", "1",
        "-b:a", "64k",
        "-vbr", "on",
        str(OGG_PATH),
    ]
    subprocess.run(cmd, check=True)
    print(f"[Plan 3 Sprite Builder] Encoded {OGG_PATH} ({OGG_PATH.stat().st_size / (1024 * 1024):.2f} MiB)")

    manifest = {
        "version": "3.0.0",
        "sampleRate": TARGET_SAMPLE_RATE,
        "model": "gnumanth/ninada (IIT Madras Rasa Classical Sanskrit VITS)",
        "audioUrlOgg": "/audio/siddham_sprite_48k.ogg",
        "audioUrlWav": "/audio/siddham_sprite_48k.wav",
        "totalCount": total_count,
        "categories": {
            "vowels": list(STANDALONE_SVARAS),
            "consonants": list(MATRIX_CONSONANTS),
            "matrixVowels": list(MATRIX_VOWELS),
            "overrides": list(SYLLABLE_OVERRIDES.keys()),
        },
        "sprites": sprites_meta,
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    elapsed = time.perf_counter() - t0
    print(
        f"[Plan 3 Sprite Builder] Wrote {MANIFEST_PATH} with {total_count} syllables in {elapsed:.1f}s."
    )
    return manifest


if __name__ == "__main__":
    build_sprite()
