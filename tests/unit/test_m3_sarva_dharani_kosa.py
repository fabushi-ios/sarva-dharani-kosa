"""Unit & Integration Tests for Milestone M3: Sarva-Dhāraṇī-Kośa (`http://localhost:5173/` — Feature F8).

Verifies:
1. 5-layer modular codebase layout and TypeScript strict compilation (`tsc --noEmit`).
2. Plan 1 (`/api/tts`, `/api/syllable`, `/api/health`) & Plan 3 (`siddham_sprite_48k`, `48000` Hz)
   integration in `src/services/audio/sanskritAudioEngine.ts` with zero legacy 136.1Hz sawtooth code.
3. Authoritative corpus completeness (`major-dharanis.ts`, `ten-small-dharanis.ts`,
   `buddhas-bodhisattvas.ts`, `gretil-canon-adapter.ts`, `cbetaAuthRecords.ts`,
   `gretilAuthRecords.ts`, `taishoMikkyoIndex.ts`).
4. Live Vite server on `http://localhost:5173/` and proxy routes (`/api/*`, `/audio/*`,
   `/sanskrit_phonetic_engine.html`).
"""

from __future__ import annotations

import base64
import io
import json
import subprocess
import urllib.request
import wave
from pathlib import Path

WORKSPACE_ROOT = Path("/home/antigravity")
FRONTEND_URL = "http://localhost:5173"


def _http_get(url: str) -> tuple[int, dict[str, str], bytes]:
    req = urllib.request.Request(url, method="GET")
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with opener.open(req, timeout=20) as resp:
        headers = {k.lower(): v for k, v in resp.headers.items()}
        return resp.status, headers, resp.read()


def _http_post_json(url: str, payload: dict) -> tuple[int, dict[str, str], dict]:
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with opener.open(req, timeout=30) as resp:
        headers = {k.lower(): v for k, v in resp.headers.items()}
        return resp.status, headers, json.loads(resp.read().decode("utf-8"))


def test_m3_01_project_configs_and_5_layer_files_exist() -> None:
    """Verify all required M3 config files, core modules, corpus data, services, and UI components exist."""
    required_paths = [
        WORKSPACE_ROOT / "package.json",
        WORKSPACE_ROOT / "vite.config.ts",
        WORKSPACE_ROOT / "tsconfig.json",
        WORKSPACE_ROOT / "index.html",
        WORKSPACE_ROOT / "src" / "main.tsx",
        WORKSPACE_ROOT / "src" / "App.tsx",
        WORKSPACE_ROOT / "src" / "types" / "dharani.ts",
        WORKSPACE_ROOT / "src" / "core" / "transliterator.ts",
        WORKSPACE_ROOT / "src" / "core" / "prosody.ts",
        WORKSPACE_ROOT / "src" / "core" / "searchEngine.ts",
        WORKSPACE_ROOT / "src" / "services" / "audio" / "sanskritAudioEngine.ts",
        WORKSPACE_ROOT / "src" / "services" / "cbetaLiveService.ts",
        WORKSPACE_ROOT / "src" / "services" / "storageService.ts",
        WORKSPACE_ROOT / "src" / "data" / "corpus" / "major-dharanis.ts",
        WORKSPACE_ROOT / "src" / "data" / "corpus" / "ten-small-dharanis.ts",
        WORKSPACE_ROOT / "src" / "data" / "corpus" / "buddhas-bodhisattvas.ts",
        WORKSPACE_ROOT / "src" / "data" / "corpus" / "gretil-canon-adapter.ts",
        WORKSPACE_ROOT / "src" / "data" / "generated" / "cbetaAuthRecords.ts",
        WORKSPACE_ROOT / "src" / "data" / "generated" / "gretilAuthRecords.ts",
        WORKSPACE_ROOT / "src" / "data" / "generated" / "taishoMikkyoIndex.ts",
        WORKSPACE_ROOT / "src" / "components" / "Header.tsx",
        WORKSPACE_ROOT / "src" / "components" / "SidebarFilter.tsx",
        WORKSPACE_ROOT / "src" / "components" / "DharaniReader.tsx",
        WORKSPACE_ROOT / "src" / "components" / "VerseBlock.tsx",
        WORKSPACE_ROOT / "src" / "components" / "CbetaSiddhamInterlinearView.tsx",
        WORKSPACE_ROOT / "src" / "components" / "AuthoritativeSourceModal.tsx",
        WORKSPACE_ROOT / "src" / "components" / "TaishoCanonExplorer.tsx",
        WORKSPACE_ROOT / "src" / "components" / "SanskritPhoneticsAcademy.tsx",
        WORKSPACE_ROOT / "src" / "components" / "CustomDharaniCompiler.tsx",
        WORKSPACE_ROOT / "src" / "components" / "AudioPlayerBar.tsx",
    ]
    for path in required_paths:
        assert path.exists(), f"Missing M3 file: {path}"
        assert path.stat().st_size > 150, f"File unexpectedly small: {path}"


def test_m3_02_sanskrit_audio_engine_ts_plan1_and_plan3_contract() -> None:
    """Verify sanskritAudioEngine.ts integrates Plan 1 (/api/tts) & Plan 3 (48kHz sprite) without 136.1Hz sawtooth."""
    engine_path = WORKSPACE_ROOT / "src" / "services" / "audio" / "sanskritAudioEngine.ts"
    code = engine_path.read_text(encoding="utf-8")
    assert "/api/tts" in code
    assert "/api/syllable/" in code
    assert "/api/health" in code
    assert "siddham_sprite_manifest.json" in code
    assert "siddham_sprite_48k.ogg" in code
    assert "48000" in code
    assert "sarvaAudioEngine" in code
    assert "136.1" not in code, "Legacy 136.1Hz sawtooth must not appear in sanskritAudioEngine.ts"


def test_m3_03_authoritative_corpus_and_phonetics_academy_coverage() -> None:
    """Verify Four Great Dhāraṇīs, Ten Small Mantras, CBETA #SD-*, GRETIL, Taishō T18–T21, and 34x14 Academy."""
    major_txt = (WORKSPACE_ROOT / "src" / "data" / "corpus" / "major-dharanis.ts").read_text(encoding="utf-8")
    assert "heart-sutra-mantra" in major_txt
    assert "mahakaruna-dharani" in major_txt
    assert "usnisavijaya-dharani" in major_txt
    assert "surangama-dharani" in major_txt
    assert "mahapratisara-dharani" in major_txt

    ten_txt = (WORKSPACE_ROOT / "src" / "data" / "corpus" / "ten-small-dharanis.ts").read_text(encoding="utf-8")
    for slug in [
        "cintamanicakra-dharani",
        "jvalamahaugra-dharani",
        "cundi-dharani",
        "aparimitayuh-dharani",
        "bhaisajyaguru-dharani",
        "sukhavativyuha-dharani",
        "srimahadevi-dharani",
    ]:
        assert slug in ten_txt, f"Missing Ten Small Mantra {slug}"

    cbeta_txt = (WORKSPACE_ROOT / "src" / "data" / "generated" / "cbetaAuthRecords.ts").read_text(encoding="utf-8")
    assert "SD-" in cbeta_txt and "T19n0974B" in cbeta_txt and "T20n1064" in cbeta_txt

    taisho_txt = (WORKSPACE_ROOT / "src" / "data" / "generated" / "taishoMikkyoIndex.ts").read_text(encoding="utf-8")
    for vol in ["T18", "T19", "T20", "T21"]:
        assert vol in taisho_txt

    academy_txt = (WORKSPACE_ROOT / "src" / "components" / "SanskritPhoneticsAcademy.tsx").read_text(encoding="utf-8")
    assert "CANONICAL_16_SVARAS" in academy_txt
    assert "CANONICAL_14_VOWELS" in academy_txt
    assert "CANONICAL_34_CONSONANT_KEYS" in academy_txt
    assert "SYLLABLE_OVERRIDES" in academy_txt
    assert "data-slp1" in academy_txt


def test_m3_04_typescript_strict_typecheck_passes() -> None:
    """Verify npx tsc --noEmit passes with zero TypeScript errors."""
    proc = subprocess.run(
        ["npx", "tsc", "--noEmit"],
        cwd=str(WORKSPACE_ROOT),
        capture_output=True,
        text=True,
        timeout=60,
    )
    assert proc.returncode == 0, f"tsc --noEmit failed:\n{proc.stdout}\n{proc.stderr}"


def test_m3_05_vite_server_5173_serves_app_and_embedded_engine_v3() -> None:
    """Verify http://localhost:5173/ serves index.html and /sanskrit_phonetic_engine.html."""
    status, _, body = _http_get(f"{FRONTEND_URL}/")
    assert status == 200
    html = body.decode("utf-8", errors="replace")
    assert 'id="root"' in html
    assert "/src/main.tsx" in html or "assets/" in html

    s_eng, _, b_eng = _http_get(f"{FRONTEND_URL}/sanskrit_phonetic_engine.html")
    assert s_eng == 200
    assert len(b_eng) > 50_000
    assert b"SPRITE_MANIFEST" in b_eng and b"CONS_MATRIX" in b_eng


def test_m3_06_vite_5173_proxies_api_health_tts_syllable_and_sprite_assets() -> None:
    """Verify :5173 proxies /api/health, /api/tts, /api/syllable/{slp1}, and /audio/siddham_sprite_*."""
    # 1. /api/health
    s_h, _, b_h = _http_get(f"{FRONTEND_URL}/api/health")
    assert s_h == 200
    health = json.loads(b_h.decode("utf-8"))
    assert health["status"] == "ok"
    assert health["sampleRate"] == 48000
    assert health["spriteReady"] is True
    assert int(health["spriteCount"]) >= 600

    # 2. /audio/siddham_sprite_manifest.json & /audio/siddham_sprite_48k.ogg
    s_m, _, b_m = _http_get(f"{FRONTEND_URL}/audio/siddham_sprite_manifest.json")
    assert s_m == 200
    manifest = json.loads(b_m.decode("utf-8"))
    assert manifest["sampleRate"] == 48000
    assert len(manifest["sprites"]) >= 600

    s_ogg, _, b_ogg = _http_get(f"{FRONTEND_URL}/audio/siddham_sprite_48k.ogg")
    assert s_ogg == 200 and len(b_ogg) > 200_000

    # 3. /api/syllable/hrIH?format=wav
    s_syl, _, b_syl = _http_get(f"{FRONTEND_URL}/api/syllable/hrIH?format=wav")
    assert s_syl == 200
    with wave.open(io.BytesIO(b_syl), "rb") as wf:
        assert wf.getframerate() == 48000
        assert wf.getsampwidth() == 2
        assert wf.getnchannels() == 1

    # 4. POST /api/tts
    s_tts, _, tts_data = _http_post_json(
        f"{FRONTEND_URL}/api/tts",
        {
            "text": "गते गते पारगते पारसंगते बोधि स्वाहा",
            "voice": "male",
            "rate": 1.0,
            "response_format": "json",
        },
    )
    assert s_tts == 200
    assert tts_data["sampleRate"] == 48000
    assert len(tts_data["syllableTimings"]) == 17
    wav_bytes = base64.b64decode(tts_data["audioBase64Wav"])
    with wave.open(io.BytesIO(wav_bytes), "rb") as wf:
        assert wf.getframerate() == 48000


def test_m3_07_core_transliterator_prosody_and_search_runtime_behavior() -> None:
    """Verify runtime behavior of transliterator.ts, prosody.ts, and searchEngine.ts on Sanskrit edge cases."""
    node_script = """
      const esbuild = require('esbuild');
      const vm = require('vm');
      const path = require('path');

      const bundle = esbuild.buildSync({
        stdin: {
          contents: `
            import { inputToSlp1, slp1ToIast, slp1ToDevanagari, slp1ToSiddham, CONS_MATRIX, CANONICAL_14_VOWELS } from './src/core/transliterator.ts';
            import { analyzeSanskritText } from './src/core/prosody.ts';
            import { filterDharaniCorpus } from './src/core/searchEngine.ts';
            import { ALL_CANONICAL_DHARANIS } from './src/data/corpus/gretil-canon-adapter.ts';
            module.exports = { inputToSlp1, slp1ToIast, slp1ToDevanagari, slp1ToSiddham, CONS_MATRIX, CANONICAL_14_VOWELS, analyzeSanskritText, filterDharaniCorpus, ALL_CANONICAL_DHARANIS };
          `,
          resolveDir: '/home/antigravity',
          loader: 'ts',
        },
        bundle: true,
        platform: 'node',
        format: 'cjs',
        write: false,
      });

      const mod = { exports: {} };
      const fn = new Function('exports', 'require', 'module', bundle.outputFiles[0].text);
      fn(mod.exports, require, mod);
      const api = mod.exports;

      const karts = api.analyzeSanskritText('kārtsnyena śrī-bhagavān uvāca');
      const heart = api.analyzeSanskritText('gate gate pāragate pārasaṃgate bodhi svāhā');
      const searchHits = api.filterDharaniCorpus(api.ALL_CANONICAL_DHARANIS, 'all', 'usnisavijaya');

      console.log(JSON.stringify({
        consCount: Object.keys(api.CONS_MATRIX).length,
        vowelCount: api.CANONICAL_14_VOWELS.length,
        kartsSyls: karts.syllables.filter(s => !s.isSymbol).map(s => ({ slp1: s.slp1, meter: s.meter })),
        heartModern: heart.modernFull,
        heartTrad: heart.tradFull,
        siddhamOm: api.slp1ToSiddham('oM'),
        corpusTotal: api.ALL_CANONICAL_DHARANIS.length,
        searchHitIds: searchHits.map(e => e.id),
      }));
    """
    proc = subprocess.run(
        ["node", "-e", node_script],
        cwd=str(WORKSPACE_ROOT),
        capture_output=True,
        text=True,
        timeout=30,
    )
    assert proc.returncode == 0, f"Node runtime evaluation failed:\n{proc.stderr}"
    out = json.loads(proc.stdout.strip().splitlines()[-1])
    assert out["consCount"] == 34
    assert out["vowelCount"] == 14
    assert out["kartsSyls"][:3] == [
        {"slp1": "kArt", "meter": "—"},
        {"slp1": "snye", "meter": "—"},
        {"slp1": "na", "meter": "⏑"},
    ]
    assert "昂" in out["heartModern"]
    assert "波罗僧揭谛" in out["heartTrad"]
    assert out["siddhamOm"] == "𑖍𑖼"
    assert out["corpusTotal"] >= 25
    assert "usnisavijaya-dharani" in out["searchHitIds"]

