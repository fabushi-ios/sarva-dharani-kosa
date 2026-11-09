"""Shared opaque-box E2E test helpers for Sanskrit Phonetic Engine v3.0 & Sarva-Dhāraṇī-Kośa.

Provides standard-library + numpy helpers for:
- HTTP REST API requests against :8765 (FastAPI Neural TTS) and :5173 (Vite React App)
- 48,000 Hz 16-bit PCM WAV and Opus decoding & acoustic signal metrics (RMS, peak, DC offset, tail energy)
- Plan 3 Audio Sprite manifest & slice inspection
- Node.js evaluation of `sanskrit_phonetic_engine.html` v3.0 DOM & phonetic/audio functions
"""

from __future__ import annotations

import base64
import functools
import io
import json
import math
import os
import re
import subprocess
import urllib.error
import urllib.parse
import urllib.request
import wave
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

WORKSPACE_ROOT = Path(__file__).resolve().parents[2]
MODELS_DIR = WORKSPACE_ROOT / "models" / "ninada"
PUBLIC_AUDIO_DIR = WORKSPACE_ROOT / "public" / "audio"
SPRITE_OGG_PATH = PUBLIC_AUDIO_DIR / "siddham_sprite_48k.ogg"
SPRITE_WAV_PATH = PUBLIC_AUDIO_DIR / "siddham_sprite_48k.wav"
SPRITE_MANIFEST_PATH = PUBLIC_AUDIO_DIR / "siddham_sprite_manifest.json"
ROOT_ENGINE_HTML = WORKSPACE_ROOT / "sanskrit_phonetic_engine.html"
PUBLIC_ENGINE_HTML = WORKSPACE_ROOT / "public" / "sanskrit_phonetic_engine.html"

BACKEND_URL = os.environ.get("SANSKRIT_TTS_URL", "http://127.0.0.1:8765")
FRONTEND_URL = os.environ.get("SARVA_DHARANI_URL", "http://localhost:5173")

# Canonical inventories from PROJECT.md § Interface Contracts
CANONICAL_16_SVARAS = [
    "a", "A", "i", "I", "u", "U", "f", "F", "x", "X", "e", "E", "o", "O", "aM", "aH"
]
CANONICAL_14_MATRIX_VOWELS = [
    "a", "A", "i", "I", "u", "U", "f", "F", "x", "X", "e", "E", "o", "O"
]
CANONICAL_34_CONSONANTS = [
    "k", "K", "g", "G", "N",
    "c", "C", "j", "J", "Y",
    "w", "W", "q", "Q", "R",
    "t", "T", "d", "D", "n",
    "p", "P", "b", "B", "m",
    "y", "r", "l", "v",
    "S", "z", "s", "h", "L",
]
CANONICAL_28_OVERRIDES = [
    "oM", "hUM", "huM", "hrIH", "hrIM", "SrIM", "klIM", "DIH", "BrUM",
    "svA", "sva", "svaH", "svar", "BUr", "BUH", "hA", "SrI", "pra",
    "jYA", "jYa", "kza", "kzA", "kzi", "kzI", "kzu", "kze", "Paw", "saM",
]
CANONICAL_KZ_JY_EXTRA = [
    "kzU", "kzf", "kzE", "kzo", "kzO",
    "jYi", "jYI", "jYu", "jYU", "jYf", "jYe", "jYE", "jYo", "jYO",
]
CANONICAL_CORPUS_COMPOUND_SYLLABLES = [
    "pad", "vaH", "tat", "tur", "reR", "yaM", "Bar", "sya", "naH", "yAt",
    "kArt", "snye", "vAn", "tut", "jya", "dUr", "ar", "sam", "yak", "bud",
    "tad", "jye", "mud", "SAn", "tiH", "maH", "Sva", "EM", "krIM", "strIM",
    "zaw", "kfz", "trI", "man", "tra", "Dar", "kar", "sat", "tva",
]


def _normalize_headers(headers: Any) -> Dict[str, str]:
    return {str(k).lower(): str(v) for k, v in headers.items()}


def http_get_bytes(
    url: str,
    headers: Optional[Dict[str, str]] = None,
    timeout: float = 30.0,
) -> Tuple[int, Dict[str, str], bytes]:
    req = urllib.request.Request(url, headers=headers or {}, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, _normalize_headers(resp.headers), resp.read()
    except urllib.error.HTTPError as exc:
        body = exc.read() if exc.fp else b""
        return exc.code, _normalize_headers(exc.headers or {}), body


def http_get_json(
    url: str,
    headers: Optional[Dict[str, str]] = None,
    timeout: float = 30.0,
) -> Tuple[int, Dict[str, str], Any]:
    status, resp_headers, body = http_get_bytes(url, headers=headers, timeout=timeout)
    try:
        parsed = json.loads(body.decode("utf-8")) if body else None
    except Exception:
        parsed = body.decode("utf-8", errors="replace")
    return status, resp_headers, parsed


def http_post_bytes(
    url: str,
    payload: Dict[str, Any],
    headers: Optional[Dict[str, str]] = None,
    timeout: float = 45.0,
) -> Tuple[int, Dict[str, str], bytes]:
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=req_headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, _normalize_headers(resp.headers), resp.read()
    except urllib.error.HTTPError as exc:
        body = exc.read() if exc.fp else b""
        return exc.code, _normalize_headers(exc.headers or {}), body


def http_post_json(
    url: str,
    payload: Dict[str, Any],
    headers: Optional[Dict[str, str]] = None,
    timeout: float = 45.0,
) -> Tuple[int, Dict[str, str], Any]:
    status, resp_headers, body = http_post_bytes(
        url, payload=payload, headers=headers, timeout=timeout
    )
    try:
        parsed = json.loads(body.decode("utf-8")) if body else None
    except Exception:
        parsed = body.decode("utf-8", errors="replace")
    return status, resp_headers, parsed


def http_options(
    url: str,
    headers: Optional[Dict[str, str]] = None,
    timeout: float = 15.0,
) -> Tuple[int, Dict[str, str]]:
    req = urllib.request.Request(url, headers=headers or {}, method="OPTIONS")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, _normalize_headers(resp.headers)
    except urllib.error.HTTPError as exc:
        return exc.code, _normalize_headers(exc.headers or {})


def analyze_pcm_samples(samples: np.ndarray, sample_rate: int) -> Dict[str, Any]:
    """Compute acoustic metrics on a normalized float32 [-1.0, 1.0] waveform."""
    if samples.size == 0:
        return {
            "sample_rate": sample_rate,
            "num_samples": 0,
            "duration_sec": 0.0,
            "rms": 0.0,
            "peak": 0.0,
            "dc_offset": 0.0,
            "has_nan_or_inf": False,
            "tail_rms_35": 0.0,
            "head_rms_25": 0.0,
            "active_duration_sec": 0.0,
            "samples": samples,
        }

    has_nan_or_inf = bool(not np.all(np.isfinite(samples)))
    clean = np.nan_to_num(samples, nan=0.0, posinf=0.0, neginf=0.0)
    rms = float(np.sqrt(np.mean(clean ** 2)))
    peak = float(np.max(np.abs(clean)))
    dc_offset = float(np.mean(clean))
    duration_sec = float(clean.size) / float(sample_rate)

    # Identify active voiced/fricative region above noise floor (2% of peak or 0.008)
    thresh = max(0.006, min(0.02, peak * 0.04))
    active_idx = np.where(np.abs(clean) >= thresh)[0]
    if active_idx.size >= 2:
        act_start = int(active_idx[0])
        act_end = int(active_idx[-1]) + 1
        active = clean[act_start:act_end]
    else:
        active = clean

    active_duration_sec = float(active.size) / float(sample_rate)
    tail_start = max(0, int(active.size * 0.65))
    tail_seg = active[tail_start:] if active.size > 0 else clean
    tail_rms_35 = float(np.sqrt(np.mean(tail_seg ** 2))) if tail_seg.size > 0 else 0.0

    head_end = max(1, int(active.size * 0.25))
    head_seg = active[:head_end] if active.size > 0 else clean
    head_rms_25 = float(np.sqrt(np.mean(head_seg ** 2))) if head_seg.size > 0 else 0.0

    return {
        "sample_rate": sample_rate,
        "num_samples": int(clean.size),
        "duration_sec": duration_sec,
        "active_duration_sec": active_duration_sec,
        "rms": rms,
        "peak": peak,
        "dc_offset": dc_offset,
        "has_nan_or_inf": has_nan_or_inf,
        "tail_rms_35": tail_rms_35,
        "head_rms_25": head_rms_25,
        "samples": clean,
    }


def decode_wav_bytes(wav_bytes: bytes) -> Dict[str, Any]:
    """Decode WAV bytes and return header metadata + acoustic signal metrics."""
    assert len(wav_bytes) >= 44, f"WAV payload too short ({len(wav_bytes)} bytes)"
    assert wav_bytes[:4] == b"RIFF", f"Invalid RIFF header: {wav_bytes[:4]!r}"
    assert wav_bytes[8:12] == b"WAVE", f"Invalid WAVE header: {wav_bytes[8:12]!r}"

    with wave.open(io.BytesIO(wav_bytes), "rb") as wf:
        channels = wf.getnchannels()
        sample_width = wf.getsampwidth()
        sample_rate = wf.getframerate()
        num_frames = wf.getnframes()
        raw_frames = wf.readframes(num_frames)

    if sample_width == 2:
        pcm = np.frombuffer(raw_frames, dtype=np.int16).astype(np.float32) / 32768.0
    elif sample_width == 4:
        pcm = np.frombuffer(raw_frames, dtype=np.int32).astype(np.float32) / 2147483648.0
    else:
        raise AssertionError(f"Unsupported WAV sample_width={sample_width}")

    if channels > 1:
        pcm = pcm.reshape(-1, channels).mean(axis=1)

    metrics = analyze_pcm_samples(pcm, sample_rate)
    metrics["channels"] = channels
    metrics["sample_width"] = sample_width
    metrics["num_frames"] = num_frames
    return metrics


def decode_base64_wav(b64_str: str) -> Dict[str, Any]:
    raw = base64.b64decode(b64_str)
    return decode_wav_bytes(raw)


@functools.lru_cache(maxsize=2)
def _load_cached_wav_array(wav_path_str: str) -> Tuple[int, int, int, np.ndarray]:
    path = Path(wav_path_str)
    assert path.exists(), f"Missing WAV file: {path}"
    with wave.open(str(path), "rb") as wf:
        channels = wf.getnchannels()
        sample_width = wf.getsampwidth()
        sample_rate = wf.getframerate()
        num_frames = wf.getnframes()
        raw_frames = wf.readframes(num_frames)
    pcm = np.frombuffer(raw_frames, dtype=np.int16).astype(np.float32) / 32768.0
    if channels > 1:
        pcm = pcm.reshape(-1, channels).mean(axis=1)
    return sample_rate, channels, sample_width, pcm


def slice_sprite_wav(
    offset_sec: float,
    duration_sec: float,
    wav_path: Path = SPRITE_WAV_PATH,
) -> Dict[str, Any]:
    sample_rate, channels, sample_width, pcm = _load_cached_wav_array(str(wav_path))
    start_idx = max(0, int(round(offset_sec * sample_rate)))
    end_idx = min(pcm.size, int(round((offset_sec + duration_sec) * sample_rate)))
    segment = pcm[start_idx:end_idx]
    metrics = analyze_pcm_samples(segment, sample_rate)
    metrics["channels"] = channels
    metrics["sample_width"] = sample_width
    return metrics


@functools.lru_cache(maxsize=2)
def load_sprite_manifest(manifest_path: Path = SPRITE_MANIFEST_PATH) -> Dict[str, Any]:
    assert manifest_path.exists(), f"Missing sprite manifest: {manifest_path}"
    return json.loads(manifest_path.read_text(encoding="utf-8"))


def get_sprite_entry(manifest: Dict[str, Any], slp1_key: str) -> Dict[str, Any]:
    sprites = manifest.get("sprites", {})
    assert slp1_key in sprites, f"Key {slp1_key!r} missing from manifest['sprites']"
    entry = sprites[slp1_key]
    if isinstance(entry, dict):
        return entry
    if isinstance(entry, (list, tuple)) and len(entry) >= 2:
        return {
            "slp1": slp1_key,
            "offset": float(entry[0]),
            "duration": float(entry[1]),
        }
    raise AssertionError(f"Invalid sprite entry format for {slp1_key}: {entry!r}")


def synthesize_tts_json(
    text: str,
    voice: str = "male",
    rate: float = 1.0,
    script: str = "auto",
    base_url: str = BACKEND_URL,
) -> Dict[str, Any]:
    status, headers, data = http_post_json(
        f"{base_url}/api/tts",
        {
            "text": text,
            "script": script,
            "voice": voice,
            "rate": rate,
            "response_format": "json",
        },
    )
    assert status == 200, f"POST /api/tts failed with {status}: {data}"
    assert isinstance(data, dict), f"Expected JSON object from /api/tts, got {type(data)}"
    return data


def run_engine_js(js_body: str, html_path: Path = ROOT_ENGINE_HTML) -> Any:
    """Execute JavaScript against the real `sanskrit_phonetic_engine.html` inside Node.js.

    Provides a realistic DOM + Web Audio + fetch harness so all v3.0 globals
    (`CONS_MATRIX`, `VOWEL_MAP`, `SYLLABLE_OVERRIDES`, `SAMPLES`, `inputToSlp1`,
    `slp1ToIast`, `slp1ToDevanagari`, `parseAndTransliterateWord`, `buildPhonemeMatrixModal`,
    `playSingleSyllable`, `speakSanskrit`, `SPRITE_MANIFEST`, `spriteAudioBuffer`)
    can be inspected and invoked in an isolated process.
    """
    assert html_path.exists(), f"Missing HTML file: {html_path}"
    runner_code = r"""
const fs = require('fs');
const vm = require('vm');
const htmlPath = process.env.ENGINE_HTML_PATH;
const userJs = process.env.ENGINE_USER_JS;
const manifestPath = process.env.SPRITE_MANIFEST_PATH;

const html = fs.readFileSync(htmlPath, 'utf8');
const scripts = [];
const scriptRe = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let m;
while ((m = scriptRe.exec(html)) !== null) {
  if (m[1] && m[1].trim().length > 0) {
    scripts.push(m[1]);
  }
}

let manifestData = null;
if (manifestPath && fs.existsSync(manifestPath)) {
  try {
    manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) {}
}

const elements = {};
function makeEl(id, tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    value: id === 'speechRate' ? '1.0' : (id === 'audioModeSelect' ? 'neural-auto' : (id === 'voiceSelect' ? 'male' : '')),
    checked: true,
    innerHTML: '',
    textContent: '',
    innerText: '',
    className: '',
    style: {},
    dataset: {},
    children: [],
    classList: {
      _set: new Set(),
      add(...cls) { cls.forEach(c => this._set.add(c)); },
      remove(...cls) { cls.forEach(c => this._set.delete(c)); },
      toggle(c) { if (this._set.has(c)) this._set.delete(c); else this._set.add(c); },
      contains(c) { return this._set.has(c); }
    },
    appendChild(child) { this.children.push(child); return child; },
    setAttribute(k, v) { this[k] = v; },
    getAttribute(k) { return this[k] || null; },
    addEventListener() {},
    removeEventListener() {},
    querySelector() { return makeEl('qs'); },
    querySelectorAll() { return []; },
    scrollIntoView() {},
    focus() {}
  };
}

function getEl(id) {
  if (!elements[id]) elements[id] = makeEl(id);
  return elements[id];
}

// Pre-populate standard DOM element defaults from HTML
['sanskritInput', 'audioModeSelect', 'voiceSelect', 'speechRate', 'btnSpeak',
 'audioStatusBadge', 'iastOut', 'devaOut', 'slp1Out', 'modernOut', 'tradOut',
 'breakdownContainer', 'wordSheetContainer', 'activeSyllableInspector',
 'matrixModal', 'matrixModalBody', 'charBar', 'optAssimilate',
 'optLongMarkStyle', 'optSylSep', 'optShowMeter'].forEach(getEl);
elements['optLongMarkStyle'].value = '～';
elements['optSylSep'].value = '·';

const playedSources = [];
class MockAudioBufferSourceNode {
  constructor() {
    this.buffer = null;
    this.playbackRate = { value: 1.0, setValueAtTime(v) { this.value = v; } };
    this.onended = null;
  }
  connect() { return this; }
  start(when = 0, offset = 0, duration = 0) {
    playedSources.push({ when, offset, duration, rate: this.playbackRate.value, sampleRate: this.buffer ? this.buffer.sampleRate : 48000 });
    if (typeof this.onended === 'function') {
      setTimeout(() => { try { this.onended(); } catch (e) {} }, 1);
    }
  }
  stop() {}
  disconnect() {}
}

class MockGainNode {
  constructor() {
    this.gain = {
      value: 1.0,
      setValueAtTime(v) { this.value = v; },
      linearRampToValueAtTime(v) { this.value = v; },
      exponentialRampToValueAtTime(v) { this.value = v; }
    };
  }
  connect() { return this; }
  disconnect() {}
}

class MockAudioContext {
  constructor() {
    this.sampleRate = 48000;
    this.currentTime = 0;
    this.state = 'running';
    this.destination = {};
  }
  resume() { return Promise.resolve(); }
  createBufferSource() { return new MockAudioBufferSourceNode(); }
  createGain() { return new MockGainNode(); }
  createBiquadFilter() {
    return {
      type: 'bandpass',
      frequency: { value: 500, setValueAtTime(v) { this.value = v; } },
      Q: { value: 1.0, setValueAtTime(v) { this.value = v; } },
      connect() { return this; }
    };
  }
  createOscillator() {
    return {
      type: 'sine',
      frequency: { value: 440, setValueAtTime(v) { this.value = v; }, linearRampToValueAtTime(v) { this.value = v; } },
      connect() { return this; },
      start() {},
      stop() {}
    };
  }
  createBuffer(channels, length, sampleRate) {
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      duration: length / sampleRate,
      getChannelData() { return new Float32Array(length); }
    };
  }
  decodeAudioData(ab) {
    const buf = this.createBuffer(1, 48000 * 60, 48000);
    return Promise.resolve(buf);
  }
}

async function mockFetch(url, opts) {
  const u = String(url);
  if (u.includes('siddham_sprite_manifest.json') && manifestData) {
    return {
      ok: true,
      status: 200,
      json: async () => manifestData,
      text: async () => JSON.stringify(manifestData),
      headers: { get: () => 'application/json' }
    };
  }
  if (u.includes('siddham_sprite_48k')) {
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(1024),
      headers: { get: () => 'audio/ogg' }
    };
  }
  if (u.includes('/api/health')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok', engine: 'ninada-vits-sanskrit-48khz', sampleRate: 48000, spriteReady: true, spriteCount: manifestData ? manifestData.totalCount : 650 })
    };
  }
  if (u.includes('/api/tts')) {
    let bodyObj = {};
    if (opts && opts.body) {
      try { bodyObj = JSON.parse(opts.body); } catch (e) {}
    }
    return {
      ok: true,
      status: 200,
      headers: { get: (k) => k.toLowerCase() === 'x-sample-rate' ? '48000' : '[]' },
      json: async () => ({
        text: bodyObj.text || 'ॐ',
        sampleRate: 48000,
        durationSec: 1.2,
        voice: bodyObj.voice || 'male',
        audioUrl: '/api/tts/cache/mock.wav',
        audioBase64Wav: '',
        syllableTimings: [
          { index: 0, slp1: 'ga', deva: 'ग', iast: 'ga', meter: '⏑', startMs: 0, endMs: 220, durationMs: 220 },
          { index: 1, slp1: 'te', deva: 'ते', iast: 'te', meter: '—', startMs: 220, endMs: 600, durationMs: 380 }
        ]
      }),
      arrayBuffer: async () => new ArrayBuffer(1024)
    };
  }
  if (u.includes('/api/syllable/')) {
    const slpKey = decodeURIComponent(u.split('/api/syllable/')[1].split('?')[0]);
    return {
      ok: true,
      status: 200,
      json: async () => ({ slp1: slpKey, sampleRate: 48000, durationSec: 0.28, source: 'neural-tts' }),
      arrayBuffer: async () => new ArrayBuffer(1024)
    };
  }
  return { ok: false, status: 404, json: async () => ({}) };
}

const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Promise,
  Uint8Array,
  Int16Array,
  Float32Array,
  ArrayBuffer,
  DataView,
  Math,
  JSON,
  Date,
  RegExp,
  Map,
  Set,
  Object,
  Array,
  String,
  Number,
  Boolean,
  Error,
  encodeURIComponent,
  decodeURIComponent,
  atob: (b64) => Buffer.from(b64, 'base64').toString('binary'),
  btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
  fetch: mockFetch,
  AudioContext: MockAudioContext,
  webkitAudioContext: MockAudioContext,
  Audio: function() {
    return { play: () => Promise.resolve(), pause: () => {}, addEventListener: () => {} };
  },
  navigator: { clipboard: { writeText: async () => {} } },
  speechSynthesis: {
    getVoices: () => [],
    speak: () => {},
    cancel: () => {},
    onvoiceschanged: null
  },
  SpeechSynthesisUtterance: function(t) { this.text = t; },
  document: {
    getElementById: getEl,
    querySelector: (sel) => makeEl(sel),
    querySelectorAll: (sel) => {
      if (sel.includes('syllable-card')) {
        const htmlStr = elements['breakdownContainer'].innerHTML || '';
        const cards = [];
        const re = /data-raw="([^"]+)"/g;
        let m2;
        while ((m2 = re.exec(htmlStr)) !== null) {
          const el = makeEl('card');
          el.dataset.raw = m2[1];
          el.getAttribute = (k) => k === 'data-raw' ? m2[1] : null;
          cards.push(el);
        }
        return cards;
      }
      return [];
    },
    createElement: (tag) => makeEl(tag, tag),
    addEventListener: (ev, fn) => { if (ev === 'DOMContentLoaded') sandbox._domReady = fn; }
  },
  __playedSources: playedSources,
  __elements: elements,
  __rawHtml: html
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.self = sandbox;

vm.createContext(sandbox);
for (const code of scripts) {
  vm.runInContext(code, sandbox);
}

(async () => {
  if (typeof sandbox._domReady === 'function') {
    try { await sandbox._domReady(); } catch (e) {}
  }
  const fn = vm.runInContext(`(async () => { ${userJs} })`, sandbox);
  const res = await fn();
  process.stdout.write(JSON.stringify({ ok: true, result: res }));
})().catch(err => {
  process.stdout.write(JSON.stringify({ ok: false, error: String(err && err.stack || err) }));
  process.exit(1);
});
"""
    env = os.environ.copy()
    env["ENGINE_HTML_PATH"] = str(html_path)
    env["ENGINE_USER_JS"] = js_body
    env["SPRITE_MANIFEST_PATH"] = str(SPRITE_MANIFEST_PATH)
    proc = subprocess.run(
        ["node", "-e", runner_code],
        capture_output=True,
        text=True,
        env=env,
        timeout=30,
    )
    assert proc.returncode == 0, (
        f"Node evaluation failed (exit {proc.returncode}):\n"
        f"STDOUT: {proc.stdout}\nSTDERR: {proc.stderr}"
    )
    payload = json.loads(proc.stdout)
    assert payload.get("ok") is True, f"JS error: {payload.get('error')}"
    return payload.get("result")
