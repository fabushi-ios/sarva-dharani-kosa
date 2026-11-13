/**
 * Cloudflare Pages Edge Function: /source-proxy/*
 *
 * Secure, allowlisted CORS & HTTP->HTTPS upgrade gateway for all 12 international Sanskrit/Buddhist
 * canonical databases (CBETA, GRETIL, Nepal DSBC, 84000 TEI, BuddhaNexus, SARIT, Cambridge CUDL,
 * Oslo Bibliotheca Polyglotta, Vienna rKTs, ALL-NIBS, IDP Berlin, Vienna CEToM, Oxford OCHS, DHARMA).
 *
 * Supports two invocation formats:
 *   1. /source-proxy/?url=https%3A%2F%2Fwww.dsbcproject.org%2F...
 *   2. /source-proxy/http/www.rkts.org/etexts/1D/100.txt
 */
const ALLOWED_HOSTS = new Set([
  'raw.githubusercontent.com',
  'cbdata.dila.edu.tw',
  'cbetaonline.dila.edu.tw',
  'www.dsbcproject.org',
  'dsbcproject.org',
  'gretil.sub.uni-goettingen.de',
  'dharmamitra.org',
  'www2.hf.uio.no',
  'polyglotta.uio.no',
  'www.rkts.org',
  'rkts.org',
  'publicapi.asianlegacylibrary.org',
  'idp.bbaw.de',
  'cetom.univie.ac.at',
  'services.cudl.lib.cam.ac.uk',
  'cudl.lib.cam.ac.uk',
  'ochs-database.netlify.app',
  'huggingface.co',
  'hf-mirror.com',
]);

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

  const incomingUrl = new URL(request.url);
  let targetUrlStr = incomingUrl.searchParams.get('url') || '';

  if (!targetUrlStr) {
    const pathSegments = Array.isArray(params.path)
      ? params.path.join('/')
      : String(params.path || '');
    const protoMatch = pathSegments.match(/^(https?)\/(.+)$/i);
    if (protoMatch) {
      targetUrlStr = `${protoMatch[1].toLowerCase()}://${protoMatch[2]}${incomingUrl.search}`;
    }
  }

  let parsedTarget;
  try {
    parsedTarget = new URL(targetUrlStr);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid target URL' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  if (!ALLOWED_HOSTS.has(parsedTarget.hostname.toLowerCase())) {
    return new Response(
      JSON.stringify({ error: `Upstream domain not allowed: ${parsedTarget.hostname}` }),
      {
        status: 403,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
      }
    );
  }

  try {
    const upstreamResp = await fetch(parsedTarget.toString(), {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'SarvaDharaniKosa/2.0 (+https://huggingface.co/bhrum108)',
        Accept: 'text/html,application/xhtml+xml,application/xml,application/json,text/plain,*/*',
      },
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
      respHeaders.set('Cache-Control', 'public, max-age=604800');
    }

    return new Response(upstreamResp.body, {
      status: upstreamResp.status,
      headers: respHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Source Proxy Error: ${String(err)}` }),
      {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
      }
    );
  }
}
