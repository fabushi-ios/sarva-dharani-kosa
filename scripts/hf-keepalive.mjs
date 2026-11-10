#!/usr/bin/env node
/**
 * scripts/hf-keepalive.mjs
 *
 * Automated Keep-Alive & CDN Warmup Script for Sarva-Dhāraṇī-Kośa on Hugging Face:
 * - Space: bhrum108/sarva-dharani-kosa (https://bhrum108-sarva-dharani-kosa.static.hf.space)
 * - TTS Model Repo: bhrum108/sarva-dharani-kosa-tts (48,000 Hz Classical Sanskrit VITS ONNX)
 *
 * Prevents Hugging Face 48-hour inactivity hibernation and keeps CDN edge caches warm.
 */

const SPACE_ID = process.env.HF_SPACE_ID || 'bhrum108/sarva-dharani-kosa';
const MODEL_ID = process.env.HF_MODEL_ID || 'bhrum108/sarva-dharani-kosa-tts';
const SPACE_LIVE_URL =
  process.env.HF_SPACE_LIVE_URL || 'https://bhrum108-sarva-dharani-kosa.static.hf.space';
const HF_TOKEN = process.env.HF_TOKEN || '';

const authHeaders = HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {};

async function pingEndpoint(label, url, method = 'GET', extraHeaders = {}) {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'User-Agent': 'Sarva-Dharani-Kosa-KeepAlive/1.0',
        ...extraHeaders,
      },
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

async function checkAndWakeSpace() {
  console.log(`=== Sarva-Dhāraṇī-Kośa Hugging Face 48h Keep-Alive (${new Date().toISOString()}) ===`);

  // 1. Ping Live Web App & Space Landing Page
  await pingEndpoint('Live Web App (index.html)', `${SPACE_LIVE_URL}/index.html`, 'GET');
  await pingEndpoint(
    'Standalone Phonetic Engine v3.0',
    `${SPACE_LIVE_URL}/sanskrit_phonetic_engine.html`,
    'HEAD'
  );
  await pingEndpoint(
    'Hugging Face Space Page',
    `https://huggingface.co/spaces/${SPACE_ID}`,
    'GET',
    authHeaders
  );

  // 2. Warm up 48kHz Sanskrit Neural VITS ONNX Model CDN endpoints
  const modelBase = `https://huggingface.co/${MODEL_ID}/resolve/main`;
  await pingEndpoint('TTS Vocab JSON', `${modelBase}/vocabs.json`, 'GET');
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

  // 3. Check Space Runtime State via Hugging Face Hub API & auto-restart if sleeping
  const apiRes = await pingEndpoint(
    'HF Space API Status',
    `https://huggingface.co/api/spaces/${SPACE_ID}`,
    'GET',
    authHeaders
  );

  if (apiRes.ok && apiRes.res) {
    try {
      const info = await apiRes.res.json();
      const stage = info?.runtime?.stage || 'RUNNING';
      console.log(`[KEEPALIVE] Space "${SPACE_ID}" runtime stage: ${stage}`);

      if (
        HF_TOKEN &&
        (stage === 'SLEEPING' || stage === 'PAUSED' || stage === 'STOPPED' || stage === 'RUNTIME_ERROR')
      ) {
        console.log(`[KEEPALIVE] Space is in ${stage} state — triggering automatic wake/restart...`);
        await pingEndpoint(
          'HF Space Auto-Wake Restart',
          `https://huggingface.co/api/spaces/${SPACE_ID}/restart`,
          'POST',
          authHeaders
        );
      }
    } catch {
      // ignore JSON parse issues
    }
  }

  // 4. Ping Model Repo API to keep model download/activity stats fresh
  await pingEndpoint(
    'HF Model API Status',
    `https://huggingface.co/api/models/${MODEL_ID}`,
    'GET',
    authHeaders
  );

  console.log('=== Keep-Alive Completed Successfully ===');
}

checkAndWakeSpace().catch((err) => {
  console.error('[KEEPALIVE] Unhandled error:', err);
  process.exitCode = 1;
});
