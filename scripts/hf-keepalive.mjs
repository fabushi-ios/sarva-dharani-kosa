#!/usr/bin/env node
/**
 * scripts/hf-keepalive.mjs
 *
 * Automated Keep-Alive, Auto-Wake & Inference Warmup Script for Sarva-Dhāraṇī-Kośa on Hugging Face:
 * - Neural TTS API Docker Space: bhrum108/sarva-dharani-kosa-tts-api
 *   (https://bhrum108-sarva-dharani-kosa-tts-api.hf.space)
 * - Frontend Static Space: bhrum108/sarva-dharani-kosa
 *   (https://bhrum108-sarva-dharani-kosa.static.hf.space)
 * - TTS Model & Cloud Corpus CDN: bhrum108/sarva-dharani-kosa-tts
 *
 * Prevents Hugging Face 48-hour inactivity hibernation, automatically wakes any SLEEPING/PAUSED/STOPPED
 * Space via the Hub API, and keeps both male & female 48kHz VITS ONNX sessions warm in RAM for first-time visitors.
 */

const SPACE_ID = process.env.HF_SPACE_ID || 'bhrum108/sarva-dharani-kosa';
const TTS_SPACE_ID = process.env.HF_TTS_SPACE_ID || 'bhrum108/sarva-dharani-kosa-tts-api';
const MODEL_ID = process.env.HF_MODEL_ID || 'bhrum108/sarva-dharani-kosa-tts';
const SPACE_LIVE_URL =
  process.env.HF_SPACE_LIVE_URL || 'https://bhrum108-sarva-dharani-kosa.static.hf.space';
const TTS_API_URL =
  process.env.HF_TTS_API_URL || 'https://bhrum108-sarva-dharani-kosa-tts-api.hf.space';
const HF_TOKEN = process.env.HF_TOKEN || '';

const authHeaders = HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {};

async function pingEndpoint(label, url, method = 'GET', extraHeaders = {}, body = undefined) {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'User-Agent': 'Sarva-Dharani-Kosa-KeepAlive/2.0',
        ...extraHeaders,
      },
      body,
      redirect: 'follow',
    });
    const elapsedMs = Date.now() - start;
    console.log(`[KEEPALIVE] ✓ ${label} -> HTTP ${res.status} (${elapsedMs}ms) [${url}]`);
    return { ok: res.ok, status: res.status, res };
  } catch (err) {
    const elapsedMs = Date.now() - start;
    console.warn(`[KEEPALIVE] ! ${label} -> FAILED (${elapsedMs}ms): ${err.message}`);
    return { ok: false, status: 0, res: null };
  }
}

async function checkAndAutoWakeSpace(spaceId, label) {
  await pingEndpoint(
    `${label} Landing Page`,
    `https://huggingface.co/spaces/${spaceId}`,
    'GET',
    authHeaders
  );

  const apiRes = await pingEndpoint(
    `${label} Hub Runtime Status`,
    `https://huggingface.co/api/spaces/${spaceId}`,
    'GET',
    authHeaders
  );

  if (apiRes.ok && apiRes.res) {
    try {
      const info = await apiRes.res.json();
      const stage = info?.runtime?.stage || 'RUNNING';
      console.log(`[KEEPALIVE] Space "${spaceId}" runtime stage: ${stage}`);

      if (
        HF_TOKEN &&
        (stage === 'SLEEPING' ||
          stage === 'PAUSED' ||
          stage === 'STOPPED' ||
          stage === 'RUNTIME_ERROR')
      ) {
        console.log(
          `[KEEPALIVE] Space "${spaceId}" is in ${stage} state — triggering automatic wake/restart...`
        );
        await pingEndpoint(
          `${label} Auto-Wake Restart`,
          `https://huggingface.co/api/spaces/${spaceId}/restart`,
          'POST',
          authHeaders
        );
      }
    } catch {
      // ignore JSON parse issues
    }
  }
}

async function checkAndWakeAll() {
  console.log(
    `=== Sarva-Dhāraṇī-Kośa Hugging Face Auto Keep-Alive (${new Date().toISOString()}) ===`
  );

  // 1. Check & auto-wake both Hugging Face Spaces first (especially the Docker Neural TTS API Space)
  await checkAndAutoWakeSpace(TTS_SPACE_ID, 'Neural TTS API Docker Space');
  await checkAndAutoWakeSpace(SPACE_ID, 'Static Web App Space');

  // 2. Ping & warm up the Live 48kHz Classical Sanskrit Neural VITS API Docker Space
  await pingEndpoint('Neural TTS API Root', `${TTS_API_URL}/`, 'GET');
  await pingEndpoint('Neural TTS API /api/health', `${TTS_API_URL}/api/health`, 'GET');
  await pingEndpoint(
    'Neural TTS Warmup Syllable oṃ (male)',
    `${TTS_API_URL}/api/syllable/oM?voice=male&format=json`,
    'GET'
  );
  await pingEndpoint(
    'Neural TTS Warmup Syllable oṃ (female)',
    `${TTS_API_URL}/api/syllable/oM?voice=female&format=json`,
    'GET'
  );
  await pingEndpoint(
    'Neural TTS Warmup Verse /api/tts',
    `${TTS_API_URL}/api/tts`,
    'POST',
    { 'Content-Type': 'application/json' },
    JSON.stringify({
      text: 'gate gate pāragate pārasaṃgate bodhi svāhā',
      script: 'auto',
      voice: 'male',
      rate: 1.0,
      response_format: 'json',
    })
  );

  // 3. Ping Live Static Web App & Standalone Phonetic Engine
  await pingEndpoint('Live Web App (index.html)', `${SPACE_LIVE_URL}/index.html`, 'GET');
  await pingEndpoint(
    'Standalone Phonetic Engine v3.0',
    `${SPACE_LIVE_URL}/sanskrit_phonetic_engine.html`,
    'HEAD'
  );

  // 4. Warm up 48kHz Sanskrit Neural VITS ONNX Model + Cloud Corpus Search Index CDN endpoints
  const modelBase = `https://huggingface.co/${MODEL_ID}/resolve/main`;
  await pingEndpoint('TTS Vocab JSON', `${modelBase}/vocabs.json`, 'GET');
  await pingEndpoint('Cloud Corpus Manifest', `${modelBase}/corpus/manifest.json`, 'GET');
  await pingEndpoint(
    'Cloud Search Index Gzip Shard',
    `${modelBase}/corpus/search-index-v1.json.gz`,
    'HEAD'
  );
  await pingEndpoint(
    'TTS Male ONNX Model (Range 0-1023)',
    `${modelBase}/onnx_mobile/sa.onnx`,
    'GET',
    { Range: 'bytes=0-1023' }
  );
  await pingEndpoint(
    'TTS Female ONNX Model (Range 0-1023)',
    `${modelBase}/onnx_mobile/sa_female.onnx`,
    'GET',
    { Range: 'bytes=0-1023' }
  );

  // 5. Ping Model Repo API to keep model activity fresh
  await pingEndpoint(
    'HF Model API Status',
    `https://huggingface.co/api/models/${MODEL_ID}`,
    'GET',
    authHeaders
  );

  console.log('=== Keep-Alive Completed Successfully ===');
}

checkAndWakeAll().catch((err) => {
  console.error('[KEEPALIVE] Unhandled error:', err);
  process.exitCode = 1;
});
