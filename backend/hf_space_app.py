#!/usr/bin/env python3
"""
Hugging Face ZeroGPU + Gradio + FastAPI ASGI Entrypoint (`app.py`) for
Sarva-Dhāraṇī-Kośa 48,000 Hz Classical Sanskrit Neural VITS TTS API.

Exposes:
- FastAPI CPU ONNX REST routes (`/api/health`, `/api/info`, `/api/tts`, `/api/syllable/{slp1_key}`)
  with `Access-Control-Allow-Origin: *` for zero-latency first-visit browser recitation
  (consumes 0 seconds of ZeroGPU quota).
- Interactive Gradio Blocks UI + `@spaces.GPU(duration=5)` handler at `/` so Hugging Face
  ZeroGPU (`zero-a10g`) startup verification and interactive testing work out of the box.
"""
from __future__ import annotations

import inspect
import os
import sys
import tempfile
from pathlib import Path
from typing import Any

# Prevent Gradio's SSR Node proxy from binding port 7860 ahead of uvicorn.
os.environ["GRADIO_SSR_MODE"] = "false"
os.environ.setdefault("TTS_CACHE_DIR", "/tmp/sarva-tts-cache")
os.environ["SARVA_GRADIO_ROOT"] = "1"

# ZeroGPU requires `import spaces` BEFORE torch or any CUDA-touching library.
try:
    import spaces  # type: ignore[import-not-found]
except ImportError:

    class _FallbackSpaces:
        @staticmethod
        def GPU(*_args: Any, **_kwargs: Any):
            def _decorator(fn: Any) -> Any:
                return fn

            return _decorator

    spaces = _FallbackSpaces()  # type: ignore[assignment]

import gradio as gr
import uvicorn

_THIS_DIR = Path(__file__).resolve().parent
if (_THIS_DIR / "backend" / "tts_server.py").exists():
    _REPO_ROOT = _THIS_DIR
elif (_THIS_DIR.parent / "backend" / "tts_server.py").exists():
    _REPO_ROOT = _THIS_DIR.parent
else:
    _REPO_ROOT = _THIS_DIR

if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from backend.sanskrit_tts_engine import TARGET_SAMPLE_RATE, get_tts_engine  # noqa: E402
from backend.tts_server import _startup_preload, app as fastapi_app  # noqa: E402

# Warm up both male and female 48,000 Hz VITS ONNX CPU sessions at startup.
_startup_preload()


@spaces.GPU(duration=5)
def gpu_zero_tts_synthesize(
    text: str,
    voice: str = "male",
    rate: float = 1.0,
) -> tuple[tuple[int, Any], dict[str, Any]]:
    clean_text = (text or "oṃ maṇi padme hūṃ").strip() or "oṃ"
    norm_voice = (voice or "male").strip().lower()
    if norm_voice not in ("male", "female", "mobile", "mobile_female"):
        norm_voice = "male"
    eff_rate = max(0.5, min(2.0, float(rate or 1.0)))

    engine = get_tts_engine()
    res = engine.synthesize_text(
        text=clean_text,
        script="auto",
        voice=norm_voice,
        rate=eff_rate,
    )
    return (
        (TARGET_SAMPLE_RATE, res["pcm48k"]),
        {
            "text": res["text"],
            "iast": res["iast"],
            "normalizedDeva": res["normalizedDeva"],
            "slp1": res["slp1"],
            "sampleRate": TARGET_SAMPLE_RATE,
            "durationSec": res["durationSec"],
            "voice": norm_voice,
            "model": res["model"],
            "syllableCount": len(res["syllableTimings"]),
            "syllableTimings": res["syllableTimings"],
        },
    )


with gr.Blocks(title="Sarva-Dhāraṇī-Kośa · 48kHz Sanskrit Neural VITS TTS API") as demo:
    gr.Markdown(
        "## 🕉️ Sarva-Dhāraṇī-Kośa · 48,000 Hz Classical Sanskrit Neural VITS TTS API\n"
        "Real-time 48,000 Hz Classical Sanskrit Śikṣā neural pronunciation service "
        "(`sa.onnx` & `sa_female.onnx`).\n\n"
        "- **Health Check**: `GET /api/health`\n"
        "- **Single Syllable API**: `GET /api/syllable/{slp1_key}?voice=male&format=wav`\n"
        "- **Full Verse / Dhāraṇī API**: `POST /api/tts` (`{\"text\": \"oṃ maṇi padme hūṃ\", \"voice\": \"male\", \"rate\": 1.0}`)"
    )
    with gr.Row():
        txt_input = gr.Textbox(
            label="Sanskrit Input (IAST / Devanāgarī / SLP1)",
            value="gate gate pāragate pārasaṃgate bodhi svāhā",
            lines=2,
        )
    with gr.Row():
        voice_input = gr.Radio(
            choices=["male", "female"],
            value="male",
            label="Neural Voice Specialist",
        )
        rate_input = gr.Slider(
            minimum=0.5,
            maximum=2.0,
            value=1.0,
            step=0.05,
            label="Chanting Rate",
        )
    synth_btn = gr.Button("Synthesize 48,000 Hz Classical Sanskrit Audio", variant="primary")
    audio_output = gr.Audio(label="48,000 Hz Neural VITS Waveform", type="numpy")
    meta_output = gr.JSON(label="Śikṣā Phonemic & Prosodic Alignment")

    synth_btn.click(
        fn=gpu_zero_tts_synthesize,
        inputs=[txt_input, voice_input, rate_input],
        outputs=[audio_output, meta_output],
        api_name="synthesize",
    )


# Fire ZeroGPU's patched `Blocks.launch` startup registration hook on loopback
# port 7861 so the ZeroGPU broker registers `@spaces.GPU(duration=5)` while
# leaving 0.0.0.0:7860 free for the combined FastAPI + Gradio ASGI server.
_prev_gradio_port = os.environ.get("GRADIO_SERVER_PORT")
os.environ["GRADIO_SERVER_PORT"] = "7861"
try:
    _launch_kwargs: dict[str, Any] = {
        "prevent_thread_lock": True,
        "server_name": "127.0.0.1",
        "server_port": 7861,
        "quiet": True,
        "show_error": False,
        "allowed_paths": [tempfile.gettempdir()],
    }
    if "ssr_mode" in inspect.signature(demo.launch).parameters:
        _launch_kwargs["ssr_mode"] = False
    demo.launch(**_launch_kwargs)
finally:
    if _prev_gradio_port is None:
        os.environ.pop("GRADIO_SERVER_PORT", None)
    else:
        os.environ["GRADIO_SERVER_PORT"] = _prev_gradio_port

_mount_kwargs: dict[str, Any] = {}
if "ssr_mode" in inspect.signature(gr.mount_gradio_app).parameters:
    _mount_kwargs["ssr_mode"] = False

app = gr.mount_gradio_app(fastapi_app, demo, path="/", **_mount_kwargs)


if __name__ == "__main__":
    listen_port = int(os.environ.get("PORT", os.environ.get("GRADIO_SERVER_PORT", "7860")))
    uvicorn.run(app, host="0.0.0.0", port=listen_port, log_level="info")
