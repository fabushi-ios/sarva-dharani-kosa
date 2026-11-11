#!/usr/bin/env python3
"""
Plan 1 FastAPI Native Classical Sanskrit Neural VITS TTS Service (48,000 Hz).

Listens on `http://127.0.0.1:8765` and provides:
- `GET /api/health`
- `POST /api/tts` and `GET /api/tts`
- `GET /api/tts/cache/{filename}`
- `GET /api/syllable/{slp1_key}` (100% Plan 1 Native Classical Sanskrit VITS synthesis)
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
import unicodedata
import urllib.parse
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.sanskrit_tts_engine import (
    CONS_SET,
    MOD_SET,
    STANDALONE_SVARAS,
    SYLLABLE_OVERRIDES,
    TARGET_SAMPLE_RATE,
    VOWEL_SET,
    get_tts_engine,
    input_to_slp1,
)

import os

PUBLIC_AUDIO_DIR = PROJECT_ROOT / "public" / "audio"
PUBLIC_FONTS_DIR = PROJECT_ROOT / "public" / "fonts"


def _init_writable_cache_dir() -> Path:
    preferred = Path(os.environ.get("TTS_CACHE_DIR", str(PUBLIC_AUDIO_DIR / "cache")))
    for candidate in (preferred, Path("/tmp/sarva-tts-cache")):
        try:
            candidate.mkdir(parents=True, exist_ok=True)
            probe = candidate / ".write_probe"
            probe.write_bytes(b"ok")
            probe.unlink(missing_ok=True)
            return candidate
        except OSError:
            continue
    return Path("/tmp")


try:
    PUBLIC_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
except OSError:
    pass
CACHE_DIR = _init_writable_cache_dir()


class TTSRequest(BaseModel):
    text: str = Field(default="")
    script: str = Field(default="auto")
    voice: str = Field(default="male")
    rate: float = Field(default=1.0)
    response_format: str | None = Field(default=None)
    format: str | None = Field(default=None)


_MEM_TTS_CACHE: dict[str, dict[str, Any]] = {}
_MEM_SYL_CACHE: dict[str, dict[str, Any]] = {}
_SYNTH_LOCK = threading.Lock()


def _normalize_slp1_key(raw_key: str) -> str:
    decoded = urllib.parse.unquote(raw_key or "").strip()
    if not decoded:
        return ""
    if decoded in STANDALONE_SVARAS or decoded in SYLLABLE_OVERRIDES:
        return decoded
    # If input contains Devanagari, IAST diacritics, or lowercase IAST aspirated/diphthong digraphs, convert via input_to_slp1
    if re.search(r"[\u0900-\u097Fāīūṛṝḷḹṅñṭḍṇśṣṃṁḥ]", decoded) or re.search(
        r"(kh|gh|ch|jh|th|dh|ph|bh|sh|ai|au)", decoded
    ):
        return input_to_slp1(decoded, mode="smart").strip()
    valid_slp_chars = CONS_SET | VOWEL_SET | MOD_SET
    if all(ch in valid_slp_chars for ch in decoded):
        return decoded
    return input_to_slp1(decoded, mode="smart").strip()


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

    key_str = f"v2_plan1|{clean_text}|{norm_script}|{norm_voice}|{eff_rate:.3f}"
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
    title="Plan 1 Classical Sanskrit Neural VITS TTS API (48kHz)",
    version="3.1.0",
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
    engine = get_tts_engine()
    for warm_voice in ("male", "female"):
        try:
            synth = engine.synthesize_single_syllable("oM", voice=warm_voice, rate=1.0)
            _MEM_SYL_CACHE[f"v2_plan1|oM|{warm_voice}|1.000"] = {
                **synth,
                "source": "neural-tts",
            }
        except Exception:
            pass


@app.api_route("/api/health", methods=["GET", "HEAD"])
def api_health() -> dict[str, Any]:
    engine = get_tts_engine()
    return {
        "status": "ok",
        "engine": "ninada-vits-sanskrit-48khz",
        "sampleRate": TARGET_SAMPLE_RATE,
        "modelsLoaded": engine.models_loaded,
    }


def _format_tts_response(entry: dict[str, Any], fmt: str) -> Response:
    timings_header = json.dumps(entry["syllableTimings"], ensure_ascii=True)
    headers: dict[str, str] = {
        "X-Sample-Rate": str(TARGET_SAMPLE_RATE),
        "X-Audio-Source": "neural-tts",
        "Access-Control-Expose-Headers": "X-Syllable-Timings, X-Sample-Rate, X-Audio-Source",
    }
    if len(timings_header) < 8000:
        headers["X-Syllable-Timings"] = timings_header
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
        "source": "neural-tts",
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

    cache_key = f"v2_plan1|{norm_key}|{norm_voice}|{eff_rate:.3f}"
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
        "X-Audio-Source": "neural-tts",
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
            "source": "neural-tts",
            "audioBase64Wav": base64.b64encode(res["wavBytes"]).decode("ascii"),
            "syllableTimings": timings,
        }
        return JSONResponse(content=payload, headers=headers)

    if fmt == "ogg":
        sha = hashlib.sha256(f"syl_v2|{norm_key}|{norm_voice}|{eff_rate:.3f}".encode("utf-8")).hexdigest()
        wav_tmp = CACHE_DIR / f"syl_{sha}.wav"
        ogg_tmp = CACHE_DIR / f"syl_{sha}.ogg"
        if not wav_tmp.exists():
            wav_tmp.write_bytes(res["wavBytes"])
        ogg_bytes = _convert_wav_to_ogg_bytes(wav_tmp, ogg_tmp)
        return Response(content=ogg_bytes, media_type="audio/ogg", headers=headers)

    return Response(content=res["wavBytes"], media_type="audio/wav", headers=headers)


PUBLIC_CORPUS_DIR = PROJECT_ROOT / "public" / "corpus"
try:
    PUBLIC_CORPUS_DIR.mkdir(parents=True, exist_ok=True)
except OSError:
    pass
_CORPUS_INDEX_CACHE: dict[str, Any] | None = None


def _get_corpus_index_cache() -> dict[str, Any]:
    global _CORPUS_INDEX_CACHE
    if _CORPUS_INDEX_CACHE is not None:
        return _CORPUS_INDEX_CACHE

    idx_path = PUBLIC_CORPUS_DIR / "search-index-v1.json"
    curated_path = PUBLIC_CORPUS_DIR / "shard-curated.json"
    db12_path = PUBLIC_CORPUS_DIR / "shard-12db.json"
    gretil_path = PUBLIC_CORPUS_DIR / "shard-gretil.json"
    taisho_path = PUBLIC_CORPUS_DIR / "shard-taisho-index.json"

    search_idx = json.loads(idx_path.read_text(encoding="utf-8")) if idx_path.exists() else {}
    entries_by_id: dict[str, dict[str, Any]] = {}
    for p in (curated_path, db12_path, gretil_path):
        if p.exists():
            for item in json.loads(p.read_text(encoding="utf-8")):
                entries_by_id[item["id"]] = item

    taisho_list = json.loads(taisho_path.read_text(encoding="utf-8")) if taisho_path.exists() else []
    _CORPUS_INDEX_CACHE = {
        "search_idx": search_idx,
        "entries_by_id": entries_by_id,
        "taisho_list": taisho_list,
    }
    return _CORPUS_INDEX_CACHE


@app.get("/api/corpus/{filename}")
def get_corpus_shard(filename: str) -> Response:
    safe_name = Path(filename).name
    target = PUBLIC_CORPUS_DIR / safe_name
    if not target.exists():
        raise HTTPException(status_code=404, detail=f"Corpus shard not found: {safe_name}")
    media_type = "application/gzip" if safe_name.endswith(".gz") else "application/json; charset=utf-8"
    return FileResponse(
        str(target),
        media_type=media_type,
        headers={
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
        },
    )


@app.get("/api/search")
def search_corpus_api(
    q: str = Query(default="", description="Search query across 2,051 Dhāraṇīs, 12 Databases, and 614 Taishō scriptures"),
    limit: int = Query(default=20, ge=1, le=100),
) -> JSONResponse:
    cache = _get_corpus_index_cache()
    search_idx = cache["search_idx"]
    entries_by_id = cache["entries_by_id"]
    taisho_list = cache["taisho_list"]

    norm_q = unicodedata.normalize("NFKC", q or "").strip().lower()
    tokens = [tk for tk in norm_q.split() if tk]
    results: list[dict[str, Any]] = []
    matched_ids: list[str] = []

    for rec in search_idx.get("entries", []):
        full_hay = f"{rec.get('t', '')} {rec.get('d', '')} {rec.get('m', '')} {' '.join(rec.get('v', []))}"
        if not norm_q or norm_q in full_hay or (len(tokens) > 1 and all(tk in full_hay for tk in tokens)):
            eid = rec["id"]
            matched_ids.append(eid)
            if len(results) < limit and eid in entries_by_id:
                entry = entries_by_id[eid]
                v0 = (entry.get("verses") or [{}])[0]
                results.append(
                    {
                        "kind": "canon-entry",
                        "id": eid,
                        "titleZh": entry.get("titleZh", ""),
                        "taishoNo": entry.get("taishoNo", ""),
                        "matchTypeLabel": entry.get("provenance", {}).get("databaseBadgeZh") or "四体梵音精校库",
                        "snippetPrimary": f"梵音：{str(v0.get('iast', ''))[:72]}",
                        "snippetSecondary": entry.get("deityZh", ""),
                    }
                )

    if norm_q and len(results) < limit:
        for ts in taisho_list:
            if len(results) >= limit:
                break
            if norm_q in ts.get("normHay", ""):
                results.append(
                    {
                        "kind": "taisho-scripture",
                        "taishoScriptureId": ts.get("id"),
                        "titleZh": f"【大正藏原典】{ts.get('titleZh', '')}",
                        "taishoNo": f"{ts.get('id')} ({ts.get('vol')})",
                        "matchTypeLabel": f"大正藏密教部原典 · 含真言 {ts.get('dharaniBlockCount', 0)} 段",
                        "snippetPrimary": f"译者：{ts.get('translator', '')}",
                        "snippetSecondary": (ts.get("sampleDharanis") or [""])[0][:72],
                    }
                )

    return JSONResponse(
        content={
            "query": q,
            "totalMatched": len(matched_ids),
            "matchedEntryIds": matched_ids[:limit],
            "results": results,
            "engine": "sarva-dharani-cloud-search-v1",
        }
    )


@app.get("/sanskrit_phonetic_engine.html")
def get_phonetic_engine_html() -> Response:
    root_html = PROJECT_ROOT / "sanskrit_phonetic_engine.html"
    pub_html = PROJECT_ROOT / "public" / "sanskrit_phonetic_engine.html"
    if root_html.exists():
        return FileResponse(str(root_html), media_type="text/html; charset=utf-8")
    if pub_html.exists():
        return FileResponse(str(pub_html), media_type="text/html; charset=utf-8")
    raise HTTPException(status_code=404, detail="sanskrit_phonetic_engine.html not found")


if PUBLIC_AUDIO_DIR.exists():
    app.mount("/audio", StaticFiles(directory=str(PUBLIC_AUDIO_DIR)), name="audio")
if PUBLIC_CORPUS_DIR.exists():
    app.mount("/corpus", StaticFiles(directory=str(PUBLIC_CORPUS_DIR)), name="corpus")
if PUBLIC_FONTS_DIR.exists():
    app.mount("/fonts", StaticFiles(directory=str(PUBLIC_FONTS_DIR)), name="fonts")

DIST_DIR = PROJECT_ROOT / "dist"
if DIST_DIR.exists() and (DIST_DIR / "index.html").exists():
    app.mount("/", StaticFiles(directory=str(DIST_DIR), html=True), name="frontend")
else:
    @app.api_route("/", methods=["GET", "HEAD"])
    def root_api_info() -> dict[str, Any]:
        engine = get_tts_engine()
        return {
            "status": "ok",
            "service": "sarva-dharani-kosa-tts-api",
            "engine": "ninada-vits-sanskrit-48khz",
            "sampleRate": TARGET_SAMPLE_RATE,
            "modelsLoaded": engine.models_loaded,
            "endpoints": ["/api/health", "/api/tts", "/api/syllable/{slp1_key}"],
        }


if __name__ == "__main__":
    import os
    import uvicorn

    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8765"))
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info",
    )

