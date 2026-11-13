/**
 * src/services/ai/buddhistQaService.ts
 *
 * Frontend Streaming Client & Auto Keep-Alive Beacon for the Hugging Face MITRA-Qwen3.5
 * Buddhist Sutra Q&A API (`buddhist-nlp/mitra-qwen35-it`):
 *   - Routes through same-origin `/qa-api` edge proxy first, then dedicated Hugging Face Space
 *     (`bhrum108/sarva-dharani-kosa-buddhist-qa` by default, or user-configured Space ID)
 *   - Sends 20-minute 0-GPU-cost `/api/qa/health` keep-alive beacons during active study sessions
 *   - Provides structured local-corpus RAG preview fallback if remote Space is warming up or not yet deployed
 */
import type {
  ActiveScripturePayload,
  RagRetrievedPassage,
} from './sutraRagRetriever';

export const DEFAULT_HF_QA_SPACE_ID = 'bhrum108/sarva-dharani-kosa-buddhist-qa';

export function normalizeSpaceInputToBaseUrl(rawInput: string): string {
  const trimmed = rawInput.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(trimmed)) {
    const slug = trimmed.replace(/\//g, '-').toLowerCase();
    return `https://${slug}.hf.space`;
  }
  return trimmed;
}

function resolveDefaultHfQaUrl(): string {
  const envObj =
    typeof import.meta !== 'undefined'
      ? (import.meta as unknown as { env?: Record<string, string> }).env
      : undefined;
  if (envObj?.VITE_HF_QA_API_URL) {
    return envObj.VITE_HF_QA_API_URL.replace(/\/+$/, '');
  }
  const spaceId = envObj?.VITE_HF_QA_SPACE_ID || DEFAULT_HF_QA_SPACE_ID;
  return normalizeSpaceInputToBaseUrl(spaceId);
}

export const DEFAULT_HF_QA_SPACE_URL = resolveDefaultHfQaUrl();

const QA_SETTINGS_STORAGE_KEY = 'sarva_kosa_buddhist_qa_settings_v1';

export interface BuddhistQaSettings {
  customApiBaseUrl: string;
  temperature: number;
  enableWebsiteRag: boolean;
  focusActiveScripture: boolean;
}

export interface QaChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  model?: string;
  citations?: RagRetrievedPassage[];
  isOfflineFallback?: boolean;
}

export interface QaSpaceHealthStatus {
  online: boolean;
  checking: boolean;
  model: string;
  endpointUsed: string;
  backendMode?: string;
  latencyMs?: number;
  errorHint?: string;
}

export function loadBuddhistQaSettings(): BuddhistQaSettings {
  const defaults: BuddhistQaSettings = {
    customApiBaseUrl: '',
    temperature: 0.25,
    enableWebsiteRag: true,
    focusActiveScripture: true,
  };
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem(QA_SETTINGS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<BuddhistQaSettings>;
    return {
      customApiBaseUrl:
        typeof parsed.customApiBaseUrl === 'string' ? parsed.customApiBaseUrl.trim() : '',
      temperature:
        typeof parsed.temperature === 'number' &&
        parsed.temperature >= 0.05 &&
        parsed.temperature <= 1.0
          ? parsed.temperature
          : 0.25,
      enableWebsiteRag: parsed.enableWebsiteRag !== false,
      focusActiveScripture: parsed.focusActiveScripture !== false,
    };
  } catch {
    return defaults;
  }
}

export function saveBuddhistQaSettings(settings: BuddhistQaSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(QA_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage quota errors
  }
}

function getCandidateApiBases(customBaseUrl = ''): string[] {
  const normalizedCustom = normalizeSpaceInputToBaseUrl(customBaseUrl);
  if (normalizedCustom) {
    return [normalizedCustom];
  }
  const list: string[] = [];
  if (typeof window !== 'undefined' && window.location?.origin) {
    list.push(`${window.location.origin}/qa-api`);
  }
  list.push(DEFAULT_HF_QA_SPACE_URL);
  return list;
}

let qaKeepAliveStarted = false;

export function startBuddhistQaKeepAliveBeacon(customBaseUrl = ''): void {
  if (qaKeepAliveStarted || typeof window === 'undefined' || typeof fetch === 'undefined') {
    return;
  }
  qaKeepAliveStarted = true;

  const fire = () => {
    const ts = Date.now();
    for (const base of getCandidateApiBases(customBaseUrl)) {
      void fetch(`${base}/api/qa/health?keepalive=${ts}`, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
      }).catch(() => {});
    }
  };

  setTimeout(fire, 500);
  const timer = setInterval(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }
    fire();
  }, 20 * 60 * 1000);

  if (typeof (timer as unknown as { unref?: () => void })?.unref === 'function') {
    (timer as unknown as { unref: () => void }).unref();
  }
}

export async function checkBuddhistQaHealth(customBaseUrl = ''): Promise<QaSpaceHealthStatus> {
  const bases = getCandidateApiBases(customBaseUrl);
  let lastError = '';

  for (const base of bases) {
    const t0 = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8500);
      const resp = await fetch(`${base}/api/qa/health?t=${t0}`, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!resp.ok) {
        lastError = `HTTP ${resp.status}`;
        continue;
      }
      const ct = (resp.headers.get('content-type') || '').toLowerCase();
      if (!ct.includes('application/json')) {
        lastError = 'Non-JSON response';
        continue;
      }
      const data = (await resp.json()) as {
        status?: string;
        model?: string;
        backendMode?: string;
      };
      if (data.status === 'ok') {
        return {
          online: true,
          checking: false,
          model: data.model || 'buddhist-nlp/mitra-qwen35-it',
          backendMode: data.backendMode,
          endpointUsed: base,
          latencyMs: Date.now() - t0,
        };
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  return {
    online: false,
    checking: false,
    model: 'buddhist-nlp/mitra-qwen35-it',
    endpointUsed: normalizeSpaceInputToBaseUrl(customBaseUrl) || DEFAULT_HF_QA_SPACE_URL,
    errorHint: lastError || 'Space 尚未推送上线或正在冷启动唤醒',
  };
}

function buildLocalCorpusFallbackAnswer(
  question: string,
  passages: RagRetrievedPassage[],
  activeScripture: ActiveScripturePayload | null
): string {
  const lines: string[] = [];
  lines.push(
    '【提示】远端 Hugging Face 微调佛经模型推理服务尚未完成首次部署或正在唤醒。已先为您从本网站数据库（CBETA 27 部类全藏经 + 全球 12 大国际梵典库）完成实时检索：'
  );
  lines.push('');

  if (activeScripture) {
    lines.push(`【当前聚焦经典】${activeScripture.titleZh}（${activeScripture.taishoNo}）`);
    if (activeScripture.originalExcerpt) {
      lines.push(activeScripture.originalExcerpt.slice(0, 400));
      lines.push('');
    }
  }

  if (passages.length > 0) {
    lines.push(`【检索命中的本库原典证据（共 ${passages.length} 条）】`);
    passages.forEach((p, idx) => {
      lines.push(
        `${idx + 1}. ${p.title}（${p.badge}${p.translator ? ` · ${p.translator}` : ''}）\n${p.snippet}`
      );
    });
    lines.push('');
    lines.push(
      '点击下方任意引用卡片的「在阅读器中打开」即可直看原卷全文。运行 `npm run deploy:qa-hf` 将 `hf-buddhist-qa-space/` 部署到 Hugging Face Spaces 后，即可开启 `buddhist-nlp/mitra-qwen35-it` 佛经大模型的流式义理深度解答。'
    );
  } else {
    lines.push(
      `未在当前本地分片中直接命中「${question}」。您可以尝试输入具体经名（如《金刚经》《心经》《大悲咒》）、经号（如 T08n0235、F28n1071）或梵文词根，或在右上角「HF API 配置」中填写已部署的 Hugging Face Space。`
    );
  }
  return lines.join('\n');
}

export interface StreamBuddhistQaParams {
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  passages: RagRetrievedPassage[];
  activeScripture: ActiveScripturePayload | null;
  temperature: number;
  customApiBaseUrl?: string;
  signal?: AbortSignal;
  onToken: (delta: string, fullSoFar: string) => void;
  onMeta?: (modelId: string) => void;
}

export async function streamBuddhistQaChat(
  params: StreamBuddhistQaParams
): Promise<{ content: string; model: string; isOfflineFallback: boolean }> {
  const {
    history,
    passages,
    activeScripture,
    temperature,
    customApiBaseUrl = '',
    signal,
    onToken,
    onMeta,
  } = params;

  const bases = getCandidateApiBases(customApiBaseUrl);
  const ragPayload = passages.map((p) => ({
    entryId: p.entryId || '',
    canonId: p.canonId || '',
    title: p.title,
    badge: p.badge,
    translator: p.translator,
    snippet: p.snippet,
    url: p.url || '',
  }));

  for (const base of bases) {
    try {
      const resp = await fetch(`${base}/api/qa/chat`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream, application/json',
        },
        body: JSON.stringify({
          messages: history,
          ragContext: ragPayload,
          activeScripture,
          enableServerRag: true,
          stream: true,
          temperature,
          maxTokens: 1024,
        }),
        signal,
      });

      if (!resp.ok) continue;

      const ct = (resp.headers.get('content-type') || '').toLowerCase();
      if (ct.includes('text/html')) continue;

      if (ct.includes('application/json')) {
        const json = (await resp.json()) as { answer?: string; model?: string };
        const ans = (json.answer || '').trim();
        if (ans) {
          onMeta?.(json.model || 'buddhist-nlp/mitra-qwen35-it');
          onToken(ans, ans);
          return {
            content: ans,
            model: json.model || 'buddhist-nlp/mitra-qwen35-it',
            isOfflineFallback: false,
          };
        }
        continue;
      }

      if (!resp.body) continue;

      const reader = resp.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulated = '';
      let activeModel = 'buddhist-nlp/mitra-qwen35-it';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const rawEv of events) {
          for (const line of rawEv.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const dataStr = trimmed.slice(5).trim();
            if (!dataStr || dataStr === '[DONE]') continue;
            try {
              const ev = JSON.parse(dataStr) as {
                type?: string;
                model?: string;
                content?: string;
                error?: string;
              };
              if (ev.type === 'meta' && ev.model) {
                activeModel = ev.model;
                onMeta?.(activeModel);
              } else if (ev.type === 'delta' && ev.content) {
                accumulated += ev.content;
                onToken(ev.content, accumulated);
              } else if (ev.type === 'error' && ev.error) {
                throw new Error(ev.error);
              }
            } catch {
              // ignore partial frame
            }
          }
        }
      }

      if (accumulated.trim()) {
        return {
          content: accumulated.trim(),
          model: activeModel,
          isOfflineFallback: false,
        };
      }
    } catch (err) {
      if (signal?.aborted) {
        throw err;
      }
    }
  }

  const latestUserQuestion =
    [...history].reverse().find((m) => m.role === 'user')?.content || '';
  const fallback = buildLocalCorpusFallbackAnswer(latestUserQuestion, passages, activeScripture);
  onToken(fallback, fallback);
  return {
    content: fallback,
    model: 'local-corpus-rag-fallback',
    isOfflineFallback: true,
  };
}
