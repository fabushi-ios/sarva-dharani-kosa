#!/usr/bin/env python3
"""
Plan 1 & Plan 3 FastAPI Neural Sanskrit TTS & 48kHz Audio Sprite Service.

Listens on `http://127.0.0.1:8765` and provides:
- `GET /api/health`
- `POST /api/tts` and `GET /api/tts`
- `GET /api/tts/cache/{filename}`
- `GET /api/syllable/{slp1_key}`
- Static `/audio/*` serving `/home/antigravity/public/audio/*` with CORS & exposed headers
- Static `/sanskrit_phonetic_engine.html` serving `/home/antigravity/sanskrit_phonetic_engine.html`
"""
from __future__ import annotations

import base64
import hashlib
import json
import re
import subprocess
import sys
import threading
import urllib.parse
import wave
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

PROJECT_ROOT = Path("/home/antigravity")
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.sanskrit_tts_engine import (
    CONS_SET,
    MOD_SET,
    STANDALONE_SVARAS,
    SYLLABLE_OVERRIDES,
    TARGET_SAMPLE_RATE,
    VOWEL_SET,
     encode_wav_48k_bytes,
    get_tts_engine,
    input_to_slp1,
)

PUBLIC_AUDIO_DIR = PROJECT_ROOT / "public" / "audio"
CACHE_DIR = PUBLIC_AUDIO_DIR / "cache"
SPRITE_WAV_PATH = PUBLIC_AUDIO_DIR / "siddham_sprite_48k.wav"
SPRITE_OGG_PATH = PUBLIC_AUDIO_DIR / "siddham_sprite_48k.ogg"
SPRITE_MANIFEST_PATH = PUBLIC_AUDIO_DIR / "siddham_sprite_manifest.json"

PUBLIC_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
CACHE_DIR.mkdir(parents=True, exist_ok=True)


class TTSRequest(BaseModel):
    text: str = Field(default="")
    script: str = Field(default="auto")
    voice: str = Field(default="male")
    rate: float = Field(default=1.0)
    response_format: str | None = Field(default=None)
    format: str | None = Field(default=None)


class SpriteStore:
    """Thread-safe in-memory loader for the Plan 3 48,000 Hz audio sprite and manifest."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.manifest: dict[str, Any] | None = None
        self.pcm_48k: np.ndarray | None = None
        self._manifest_mtime: float = 0.0
        self._wav_mtime: float = 0.0

    def ensure_loaded(self) -> tuple[dict[str, Any] | None, np.ndarray | None]:
        with self._lock:
            if not SPRITE_MANIFEST_PATH.exists() or not SPRITE_WAV_PATH.exists():
                return None, None
            try:
                m_mtime = SPRITE_MANIFEST_PATH.stat().st_mtime
                w_mtime = SPRITE_WAV_PATH.stat().st_mtime
                if (
                    self.manifest is not None
                    and self.pcm_48k is not None
                    and m_mtime == self._manifest_mtime
                    and w_mtime == self._wav_mtime
                ):
                    return self.manifest, self.pcm_48k

                manifest_data = json.loads(SPRITE_MANIFEST_PATH.read_text(encoding="utf-8"))
                with wave.open(str(SPRITE_WAV_PATH), "rb") as wf:
                    n_frames = wf.getnframes()
                    raw_bytes = wf.readframes(n_frames)
                    pcm_i16 = np.frombuffer(raw_bytes, dtype="<i2")
                    pcm_f32 = (pcm_i16.astype(np.float32) / 32767.0).copy()

                self.manifest = manifest_data
                self.pcm_48k = pcm_f32
                self._manifest_mtime = m_mtime
                self._wav_mtime = w_mtime
                return self.manifest, self.pcm_48k
            except Exception:
                return self.manifest, self.pcm_48k

    def slice_syllable(self, slp1_key: str) -> dict[str, Any] | None:
        manifest, pcm = self.ensure_loaded()
        if manifest is None or pcm is None:
            return None
        sprites = manifest.get("sprites", {})
        meta = sprites.get(slp1_key)
        if meta is None:
            return None
        offset_sec = float(meta["offset"])
        dur_sec = float(meta["duration"])
        st = max(0, int(round(offset_sec * TARGET_SAMPLE_RATE)))
        ed = min(len(pcm), st + max(1, int(round(dur_sec * TARGET_SAMPLE_RATE))))
        slice_pcm = pcm[st:ed].copy()
        wav_bytes = encode_wav_48k_bytes(slice_pcm)
        return {
            "slp1": meta["slp1"],
            "iast": meta["iast"],
            "deva": meta["deva"],
            "meter": meta["meter"],
            "sampleRate": TARGET_SAMPLE_RATE,
            "durationSec": round(len(slice_pcm) / float(TARGET_SAMPLE_RATE), 4),
            "rms": meta.get("rms", round(float(np.sqrt(np.mean(slice_pcm * slice_pcm))), 4)),
            "peak": meta.get("peak", round(float(np.max(np.abs(slice_pcm))), 4)),
            "voice": "male",
            "model": manifest.get("model", "gnumanth/ninada:onnx/sa.onnx"),
            "source": "neural-sprite",
            "pcm48k": slice_pcm,
            "wavBytes": wav_bytes,
        }


_SPRITE_STORE = SpriteStore()
_MEM_TTS_CACHE: dict[str, dict[str, Any]] = {}
_MEM_SYL_CACHE: dict[str, dict[str, Any]] = {}
_SYNTH_LOCK = threading.Lock()


def _normalize_slp1_key(raw_key: str) -> str:
    decoded = urllib.parse.unquote(raw_key or "").strip()
    if not decoded:
        return ""
    manifest, _ = _SPRITE_STORE.ensure_loaded()
    if manifest and decoded in manifest.get("sprites", {}):
        return decoded
    if decoded in STANDALONE_SVARAS or decoded in SYLLABLE_OVERRIDES:
        return decoded
    valid_slp_chars = CONS_SET | VOWEL_SET | MOD_SET
    if all(ch in valid_slp_chars for ch in decoded):
        return decoded
    # Convert Devanagari or IAST syllable into SLP1
    if re.search(r"[\u0900-\u097Fāīūṛṝḷḹṅñṭḍṇśṣṃṁḥ]", decoded):
        return input_to_slp1(decoded, mode="smart").strip()
    return decoded


def _convert_wav_to_ogg_bytes(wav_path: Path, ogg_path: Path) -> bytes:
    if not ogg_path.exists():
        cmd = [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(wav_path),
            "-c:a", "libopus",
            "-ar", str(TARGET_SAMPLE_RATE),
            "-ac", "1",
            "-b:a", "64k",
            "-vbr", "on",
            str(ogg_path),
        ]
        subprocess.run(cmd, check=True)
    return ogg_path.read_bytes()


def _resolve_response_format(
    explicit_response_format: str | None,
    explicit_format: str | None,
    request: Request,
    default_fmt: str = "json",
) -> str:
    chosen = (explicit_response_format or explicit_format or "").strip().lower()
    if chosen in ("json", "wav", "ogg", "opus"):
        return "ogg" if chosen == "opus" else chosen
    accept = (request.headers.get("accept") or "").lower()
    if "audio/wav" in accept or "audio/x-wav" in accept:
        return "wav"
    if "audio/ogg" in accept or "audio/opus" in accept:
        return "ogg"
    if "application/json" in accept:
        return "json"
    return default_fmt


def _run_cached_tts(text: str, script: str, voice: str, rate: float) -> dict[str, Any]:
    clean_text = (text or "").strip()
    if not clean_text:
        raise HTTPException(status_code=400, detail="Parameter 'text' must not be empty or whitespace-only.")
    try:
        eff_rate = max(0.5, min(2.0, float(rate)))
    except (TypeError, ValueError):
        eff_rate = 1.0
    norm_voice = (voice or "male").strip().lower()
    if norm_voice not in ("male", "female", "mobile", "mobile_female"):
        norm_voice = "male"
    norm_script = (script or "auto").strip().lower()

    key_str = f"v1|{clean_text}|{norm_script}|{norm_voice}|{eff_rate:.3f}"
    sha = hashlib.sha256(key_str.encode("utf-8")).hexdigest()
    wav_cache_path = CACHE_DIR / f"{sha}.wav"
    meta_cache_path = CACHE_DIR / f"{sha}.json"

    if sha in _MEM_TTS_CACHE and wav_cache_path.exists():
        return _MEM_TTS_CACHE[sha]

    if wav_cache_path.exists() and meta_cache_path.exists():
        try:
            meta = json.loads(meta_cache_path.read_text(encoding="utf-8"))
            wav_bytes = wav_cache_path.read_bytes()
            entry = {
                **meta,
                "wavBytes": wav_bytes,
                "wavPath": wav_cache_path,
                "sha256": sha,
            }
            _MEM_TTS_CACHE[sha] = entry
            return entry
        except Exception:
            pass

    with _SYNTH_LOCK:
        engine = get_tts_engine()
        res = engine.synthesize_text(
            text=clean_text,
            script=norm_script,
            voice=norm_voice,
            rate=eff_rate,
        )

    wav_bytes = res["wavBytes"]
    wav_cache_path.write_bytes(wav_bytes)
    meta_payload = {
        "text": res["text"],
        "normalizedDeva": res["normalizedDeva"],
        "slp1": res["slp1"],
        "iast": res["iast"],
        "sampleRate": TARGET_SAMPLE_RATE,
        "durationSec": res["durationSec"],
        "voice": norm_voice,
        "model": res["model"],
        "audioUrl": f"/api/tts/cache/{sha}.wav",
        "syllableTimings": res["syllableTimings"],
    }
    meta_cache_path.write_text(json.dumps(meta_payload, ensure_ascii=False, indent=2), encoding="utf-8")

    entry = {
        **meta_payload,
        "wavBytes": wav_bytes,
        "wavPath": wav_cache_path,
        "sha256": sha,
    }
    if len(_MEM_TTS_CACHE) >= 256:
        _MEM_TTS_CACHE.pop(next(iter(_MEM_TTS_CACHE)))
    _MEM_TTS_CACHE[sha] = entry
    return entry


app = FastAPI(
    title="Classical Sanskrit Neural TTS & 48kHz Audio Sprite API",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Syllable-Timings", "X-Sample-Rate", "X-Audio-Source"],
)


@app.on_event("startup")
def _startup_preload() -> None:
    get_tts_engine()
    _SPRITE_STORE.ensure_loaded()


@app.get("/api/health")
def api_health() -> dict[str, Any]:
    engine = get_tts_engine()
    manifest, pcm = _SPRITE_STORE.ensure_loaded()
    sprite_count = int(manifest.get("totalCount", len(manifest.get("sprites", {})))) if manifest else 0
    sprite_ready = bool(
        manifest is not None
        and pcm is not None
        and sprite_count >= 650
        and SPRITE_WAV_PATH.exists()
        and SPRITE_OGG_PATH.exists()
    )
    return {
        "status": "ok",
        "engine": "ninada-vits-sanskrit-48khz",
        "sampleRate": TARGET_SAMPLE_RATE,
        "modelsLoaded": engine.models_loaded,
        "spriteCount": sprite_count,
        "spriteReady": sprite_ready,
    }


def _format_tts_response(entry: dict[str, Any], fmt: str) -> Response:
    timings_header = json.dumps(entry["syllableTimings"], ensure_ascii=True)
    headers = {
        "X-Syllable-Timings": timings_header,
        "X-Sample-Rate": str(TARGET_SAMPLE_RATE),
        "Access-Control-Expose-Headers": "X-Syllable-Timings, X-Sample-Rate",
    }
    if fmt == "wav":
        return Response(
            content=entry["wavBytes"],
            media_type="audio/wav",
            headers=headers,
        )
    if fmt == "ogg":
        ogg_path = CACHE_DIR / f"{entry['sha256']}.ogg"
        ogg_bytes = _convert_wav_to_ogg_bytes(entry["wavPath"], ogg_path)
        return Response(
            content=ogg_bytes,
            media_type="audio/ogg",
            headers=headers,
        )
    payload = {
        "text": entry["text"],
        "normalizedDeva": entry["normalizedDeva"],
        "slp1": entry["slp1"],
        "iast": entry["iast"],
        "sampleRate": TARGET_SAMPLE_RATE,
        "durationSec": entry["durationSec"],
        "voice": entry["voice"],
        "model": entry["model"],
        "audioBase64Wav": base64.b64encode(entry["wavBytes"]).decode("ascii"),
        "audioUrl": entry["audioUrl"],
        "syllableTimings": entry["syllableTimings"],
    }
    return JSONResponse(content=payload, headers=headers)


@app.post("/api/tts")
def post_tts(
    req: TTSRequest,
    request: Request,
    format: str | None = Query(default=None),
    response_format: str | None = Query(default=None),
) -> Response:
    entry = _run_cached_tts(
        text=req.text,
        script=req.script,
        voice=req.voice,
        rate=req.rate,
    )
    fmt = _resolve_response_format(
        req.response_format or response_format,
        req.format or format,
        request,
        default_fmt="json",
    )
    return _format_tts_response(entry, fmt)


@app.get("/api/tts")
def get_tts(
    request: Request,
    text: str = Query(default=""),
    script: str = Query(default="auto"),
    voice: str = Query(default="male"),
    rate: float = Query(default=1.0),
    response_format: str | None = Query(default=None),
    format: str | None = Query(default=None),
) -> Response:
    entry = _run_cached_tts(
        text=text,
        script=script,
        voice=voice,
        rate=rate,
    )
    fmt = _resolve_response_format(
        response_format,
        format,
        request,
        default_fmt="json",
    )
    return _format_tts_response(entry, fmt)


@app.get("/api/tts/cache/{filename}")
def get_tts_cache_file(filename: str) -> Response:
    safe_name = Path(filename).name
    target = CACHE_DIR / safe_name
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail=f"Cached audio file not found: {safe_name}")
    media_type = "audio/ogg" if safe_name.endswith(".ogg") else "audio/wav"
    return FileResponse(
        path=str(target),
        media_type=media_type,
        headers={
            "X-Sample-Rate": str(TARGET_SAMPLE_RATE),
            "Access-Control-Expose-Headers": "X-Syllable-Timings, X-Sample-Rate",
        },
    )


@app.get("/api/syllable/{slp1_key:path}")
def get_syllable(
    slp1_key: str,
    request: Request,
    voice: str = Query(default="male"),
    rate: float = Query(default=1.0),
    format: str | None = Query(default=None),
    response_format: str | None = Query(default=None),
) -> Response:
    norm_key = _normalize_slp1_key(slp1_key)
    if not norm_key:
        raise HTTPException(status_code=400, detail="Syllable key must not be empty.")
    try:
        eff_rate = max(0.5, min(2.0, float(rate)))
    except (TypeError, ValueError):
        eff_rate = 1.0
    norm_voice = (voice or "male").strip().lower()
    if norm_voice not in ("male", "female", "mobile", "mobile_female"):
        norm_voice = "male"

    res: dict[str, Any] | None = None
    if norm_voice == "male" and abs(eff_rate - 1.0) < 1e-3:
        res = _SPRITE_STORE.slice_syllable(norm_key)

    if res is None:
        cache_key = f"{norm_key}|{norm_voice}|{eff_rate:.3f}"
        if cache_key in _MEM_SYL_CACHE:
            res = _MEM_SYL_CACHE[cache_key]
        else:
            with _SYNTH_LOCK:
                engine = get_tts_engine()
                synth = engine.synthesize_single_syllable(norm_key, voice=norm_voice, rate=eff_rate)
            res = {
                **synth,
                "source": "neural-tts",
            }
            if len(_MEM_SYL_CACHE) >= 512:
                _MEM_SYL_CACHE.pop(next(iter(_MEM_SYL_CACHE)))
            _MEM_SYL_CACHE[cache_key] = res

    dur_ms = int(round(res["durationSec"] * 1000.0))
    timings = [
        {
            "index": 0,
            "slp1": res["slp1"],
            "deva": res["deva"],
            "iast": res["iast"],
            "meter": res["meter"],
            "startMs": 0,
            "endMs": dur_ms,
            "durationMs": dur_ms,
        }
    ]
    headers = {
        "X-Sample-Rate": str(TARGET_SAMPLE_RATE),
        "X-Audio-Source": res["source"],
        "X-Syllable-Timings": json.dumps(timings, ensure_ascii=True),
        "Access-Control-Expose-Headers": "X-Syllable-Timings, X-Sample-Rate, X-Audio-Source",
    }

    fmt = _resolve_response_format(response_format, format, request, default_fmt="wav")
    if fmt == "json":
        payload = {
            "slp1": res["slp1"],
            "iast": res["iast"],
            "deva": res["deva"],
            "meter": res["meter"],
            "sampleRate": TARGET_SAMPLE_RATE,
            "durationSec": res["durationSec"],
            "rms": res["rms"],
            "peak": res["peak"],
            "voice": norm_voice,
            "model": res["model"],
            "source": res["source"],
            "audioBase64Wav": base64.b64encode(res["wavBytes"]).decode("ascii"),
            "syllableTimings": timings,
        }
        return JSONResponse(content=payload, headers=headers)

    if fmt == "ogg":
        sha = hashlib.sha256(f"syl|{norm_key}|{norm_voice}|{eff_rate:.3f}".encode("utf-8")).hexdigest()
        wav_tmp = CACHE_DIR / f"syl_{sha}.wav"
        ogg_tmp = CACHE_DIR / f"syl_{sha}.ogg"
        if not wav_tmp.exists():
            wav_tmp.write_bytes(res["wavBytes"])
        ogg_bytes = _convert_wav_to_ogg_bytes(wav_tmp, ogg_tmp)
        return Response(content=ogg_bytes, media_type="audio/ogg", headers=headers)

    return Response(content=res["wavBytes"], media_type="audio/wav", headers=headers)


@app.get("/sanskrit_phonetic_engine.html")
def get_phonetic_engine_html() -> Response:
    root_html = PROJECT_ROOT / "sanskrit_phonetic_engine.html"
    pub_html = PROJECT_ROOT / "public" / "sanskrit_phonetic_engine.html"
    if root_html.exists():
        return FileResponse(str(root_html), media_type="text/html; charset=utf-8")
    if pub_html.exists():
        return FileResponse(str(pub_html), media_type="text/html; charset=utf-8")
    raise HTTPException(status_code=404, detail="sanskrit_phonetic_engine.html not found")


app.mount("/audio", StaticFiles(directory=str(PUBLIC_AUDIO_DIR)), name="audio")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8765,
        log_level="info",
    )
