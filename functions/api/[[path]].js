/**
 * Cloudflare Pages Edge Function: /api/*
 * Transparently proxies /api/tts, /api/syllable/*, /api/health, and /api/tts/cache/*
 * from sarvakosa.com (via Visa Cloudflare Anycast IPs) to the Hugging Face 48kHz Sanskrit Neural VITS API Space,
 * enabling mainland China users to use 48kHz neural recitation directly without a VPN/proxy.
 */
const HF_TTS_UPSTREAM = 'https://bhrum108-sarva-dharani-kosa-tts-api.hf.space';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range, Accept',
};

export async function onRequest(context) {
  const { request } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const incomingUrl = new URL(request.url);
  const upstreamUrl = `${HF_TTS_UPSTREAM}${incomingUrl.pathname}${incomingUrl.search}`;

  const headers = new Headers();
  for (const key of ['content-type', 'accept', 'range']) {
    const val = request.headers.get(key);
    if (val) headers.set(key, val);
  }

  const init = {
    method: request.method,
    headers,
    redirect: 'follow',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
  }

  try {
    const upstreamResp = await fetch(upstreamUrl, init);
    const respHeaders = new Headers(upstreamResp.headers);
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
      respHeaders.set(k, v);
    }
    return new Response(upstreamResp.body, {
      status: upstreamResp.status,
      headers: respHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Upstream TTS API unreachable', detail: String(err) }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...CORS_HEADERS,
        },
      }
    );
  }
}
