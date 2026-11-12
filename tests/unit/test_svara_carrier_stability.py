"""Isolated Svara carrier regression tests (lone-vowel onset artefact: `u` -> "ao-u", blurred `i`/`ī`)."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from backend.sanskrit_tts_engine import (  # noqa: E402
    SVARA_CARRIER_TABLE,
    get_tts_engine,
)

pytest.importorskip("onnxruntime")


def _lpc_f1_f2(x: np.ndarray, sr: int = 24000) -> tuple[float, float]:
    from scipy.linalg import solve_toeplitz
    from scipy.signal import lfilter

    if len(x) < 200:
        return 0.0, 0.0
    x = lfilter([1, -0.97], 1, x) * np.hamming(len(x))
    p = int(sr / 1000) + 2
    r = np.correlate(x, x, "full")[len(x) - 1 : len(x) + p]
    if r[0] <= 0:
        return 0.0, 0.0
    a = solve_toeplitz(r[:p], r[1 : p + 1])
    roots = np.roots(np.r_[1, -a])
    roots = roots[np.imag(roots) > 0]
    fr = sorted(f for f in np.angle(roots) * sr / (2 * np.pi) if f > 250)
    return (fr[0], fr[1]) if len(fr) > 1 else (0.0, 0.0)


def _instability(pcm48k: np.ndarray) -> float:
    n = len(pcm48k)
    pts = []
    for q in np.linspace(0.15, 0.85, 6):
        c = int(n * q)
        pts.append(_lpc_f1_f2(pcm48k[max(0, c - 480) : c + 480][::2]))
    t = np.asarray(pts, dtype=float)
    return float(t[:, 0].std() / max(1.0, t[:, 0].mean()) + t[:, 1].std() / max(1.0, t[:, 1].mean()))


def test_table_entries_are_well_formed() -> None:
    for voice, table in SVARA_CARRIER_TABLE.items():
        for unit, (reps, head) in table.items():
            assert head >= 1 and reps > head, (voice, unit)


@pytest.mark.parametrize("voice", ["male", "female"])
@pytest.mark.parametrize("key", ["I", "u", "U", "o", "A"])
def test_monophthong_svara_is_steady_and_long_enough(voice: str, key: str) -> None:
    eng = get_tts_engine()
    r = eng.synthesize_single_syllable(key, voice)
    assert r["model"].endswith("sa.onnx") or "female" in r["model"].lower() or "sa_" in r["model"]
    guru = key in {"I", "U", "o", "A"}
    assert r["durationSec"] >= (0.20 if guru else 0.11), (voice, key, r["durationSec"])
    # Single steady articulation, not an open-vowel onset gliding into the target.
    assert _instability(r["pcm48k"]) < 0.45, (voice, key)


@pytest.mark.parametrize("voice", ["male", "female"])
def test_u_and_i_have_distinct_formants(voice: str) -> None:
    eng = get_tts_engine()

    def mid_f2(key: str) -> float:
        w = eng.synthesize_single_syllable(key, voice)["pcm48k"]
        n = len(w)
        vals = [_lpc_f1_f2(w[int(n * q) - 480 : int(n * q) + 480][::2])[1] for q in (0.3, 0.4, 0.5, 0.6, 0.7)]
        return float(np.median(vals))

    assert mid_f2("u") < 1300 < mid_f2("i")
