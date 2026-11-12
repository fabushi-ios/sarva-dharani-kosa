/**
 * Cloudflare Pages Edge Function: /ort-cdn/*
 * Proxies onnxruntime-web JS & WASM SIMD binaries through Cloudflare's edge with 1-year caching
 * so mainland China users never fail if cdn.jsdelivr.net or unpkg.com is throttled.
 */
const ORT_UPSTREAM = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
};

export async function onRequest(context) {
  const { request, params } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const file = Array.isArray(params.path) ? params.path.join('/') : String(params.path || '');
  const upstreamUrl = `${ORT_UPSTREAM}/${file}`;

  try {
    const upstreamResp = await fetch(upstreamUrl, {
      method: request.method,
      redirect: 'follow',
      cf: {
        cacheEverything: true,
        cacheTtl: 31536000,
      },
    });

    const respHeaders = new Headers(upstreamResp.headers);
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
      respHeaders.set(k, v);
    }
    if (file.endsWith('.wasm')) {
      respHeaders.set('Content-Type', 'application/wasm');
    } else if (file.endsWith('.js') || file.endsWith('.mjs')) {
      respHeaders.set('Content-Type', 'application/javascript; charset=utf-8');
    }
    if (upstreamResp.ok) {
      respHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    return new Response(upstreamResp.body, {
      status: upstreamResp.status,
      headers: respHeaders,
    });
  } catch (err) {
    return new Response(`ORT Proxy Error: ${String(err)}`, {
      status: 502,
      headers: CORS_HEADERS,
    });
  }
}
