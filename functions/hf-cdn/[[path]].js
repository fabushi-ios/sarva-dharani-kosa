/**
 * Cloudflare Pages Edge Function: /hf-cdn/*
 * Proxies ONNX neural models (sa.onnx, sa_female.onnx, vocabs.json) and cloud corpus shards
 * from Hugging Face Hub CDN through Cloudflare's edge with 7-day caching so users in mainland China
 * can download models & shards at full speed without a VPN.
 */
const HF_CDN_UPSTREAM = 'https://huggingface.co/bhrum108/sarva-dharani-kosa-tts/resolve/main';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range, Accept',
};

export async function onRequest(context) {
  const { request, params } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const pathSegments = Array.isArray(params.path)
    ? params.path.join('/')
    : String(params.path || '');
  const incomingUrl = new URL(request.url);
  const upstreamUrl = `${HF_CDN_UPSTREAM}/${pathSegments}${incomingUrl.search}`;

  try {
    const upstreamResp = await fetch(upstreamUrl, {
      method: request.method,
      redirect: 'follow',
      cf: {
        cacheEverything: true,
        cacheTtl: 604800,
      },
    });

    const respHeaders = new Headers(upstreamResp.headers);
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
      respHeaders.set(k, v);
    }
    if (upstreamResp.ok) {
      respHeaders.set('Cache-Control', 'public, max-age=604800, immutable');
    }

    return new Response(upstreamResp.body, {
      status: upstreamResp.status,
      headers: respHeaders,
    });
  } catch (err) {
    return new Response(`HF CDN Proxy Error: ${String(err)}`, {
      status: 502,
      headers: CORS_HEADERS,
    });
  }
}
