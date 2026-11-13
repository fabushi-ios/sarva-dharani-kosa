/**
 * Cloudflare Pages Edge Function: /qa-api/*
 * Transparently proxies /qa-api/api/qa/chat, /qa-api/api/qa/health, /qa-api/api/qa/search,
 * and /qa-api/v1/chat/completions (including real-time SSE `text/event-stream` streaming)
 * from the website domain to the dedicated Hugging Face MITRA-Qwen3.5 Buddhist Sutra Q&A Space.
 */
const DEFAULT_QA_SPACE_ID = 'bhrum108/sarva-dharani-kosa-buddhist-qa';
const DEFAULT_UPSTREAM = `https://${DEFAULT_QA_SPACE_ID.replace(/\//g, '-').toLowerCase()}.hf.space`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const incomingUrl = new URL(request.url);
  const strippedPath = incomingUrl.pathname.replace(/^\/qa-api/, '') || '/';
  const upstreamBase = (
    env && env.HF_QA_UPSTREAM ? String(env.HF_QA_UPSTREAM) : DEFAULT_UPSTREAM
  ).replace(/\/+$/, '');
  const upstreamUrl = `${upstreamBase}${strippedPath}${incomingUrl.search}`;

  const headers = new Headers();
  for (const key of ['content-type', 'accept']) {
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
    const ct = (respHeaders.get('content-type') || '').toLowerCase();
    if (ct.includes('text/event-stream')) {
      respHeaders.set('Cache-Control', 'no-cache, no-transform');
    }
    return new Response(upstreamResp.body, {
      status: upstreamResp.status,
      headers: respHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: 'Upstream Buddhist Q&A Space unreachable',
        upstream: upstreamBase,
        detail: String(err),
      }),
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
