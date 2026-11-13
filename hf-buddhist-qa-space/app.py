#!/usr/bin/env python3
"""
hf-buddhist-qa-space/app.py

Authoritative Fine-Tuned Buddhist Sutra Q&A Model + RAG API Server for Hugging Face Spaces.

Primary Authoritative Model:
  - `buddhist-nlp/mitra-qwen35-it` (Dharmamitra Project / UC Berkeley, 9B parameters,
    262K context, continuously pretrained on ~22B tokens of CBETA Buddhist Chinese,
    GRETIL/DCS Sanskrit, Kangyur/Tengyur Tibetan, and Pāli + instruction-tuned for
    Buddhist canonical Q&A and classical translation).
  - Quantized GGUF Fallback / CPU-Docker Mode:
    `christian-steinert/mitra-qwen35-it-GGUF` (`Mitra-IT-Qwen3.5-9.0B-Q4_K_M.gguf`)

Important MITRA-Qwen3.5 Requirement:
  - Always disables Qwen3.5 `<think>` mode via `enable_thinking=False` in chat template
    and uses Dharmamitra's anti-loop sampling (`temperature=0.25, top_k=40, repetition_penalty=1.05`).

Exposes:
  - `GET  /api/qa/health` & `GET /api/health` (0s ZeroGPU CPU keep-alive endpoint)
  - `GET  /api/qa/search?q=...` (Server-side 12-DB + CBETA Canon RAG search)
  - `POST /api/qa/chat` (JSON & SSE streaming RAG Q&A with website scripture citations)
  - `POST /v1/chat/completions` (OpenAI-compatible REST & SSE endpoint)
  - `/` Interactive Gradio Buddhist Sutra Q&A Studio
"""
from __future__ import annotations

import asyncio
import inspect
import json
import os
import sys
import tempfile
import threading
import time
import urllib.request
from pathlib import Path
from typing import Any, Iterator

# Prevent Gradio's SSR Node proxy from binding port 7860 ahead of uvicorn
os.environ["GRADIO_SSR_MODE"] = "false"

# ZeroGPU requires `import spaces` BEFORE torch or transformers
try:
    import spaces  # type: ignore[import-not-found]
except ImportError:

    class _FallbackSpaces:
        @staticmethod
        def GPU(*_args: Any, **_kwargs: Any):
            def _decorator(fn: Any) -> Any:
                return fn

            return _decorator

    spaces = _FallbackSpaces()  # type: ignore[assignment]

import gradio as gr
import uvicorn
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

THIS_DIR = Path(__file__).resolve().parent
if str(THIS_DIR) not in sys.path:
    sys.path.insert(0, str(THIS_DIR))

from rag_corpus import GLOBAL_CORPUS_INDEX  # noqa: E402

PRIMARY_MODEL_ID = os.environ.get("HF_BUDDHIST_MODEL_ID", "buddhist-nlp/mitra-qwen35-it")
GGUF_REPO_ID = os.environ.get("HF_BUDDHIST_GGUF_REPO", "christian-steinert/mitra-qwen35-it-GGUF")
GGUF_FILENAME = os.environ.get("HF_BUDDHIST_GGUF_FILE", "Mitra-IT-Qwen3.5-9.0B-Q4_K_M.gguf")
BACKEND_MODE = os.environ.get("HF_QA_BACKEND_MODE", "auto").strip().lower()
LLAMACPP_UPSTREAM = os.environ.get("HF_QA_LLAMACPP_URL", "").strip().rstrip("/")
API_BEARER_KEY = os.environ.get("SARVA_QA_API_KEY", "").strip()
LOAD_IN_4BIT = os.environ.get("HF_LOAD_IN_4BIT", "1").strip() != "0"

BUDDHIST_SYSTEM_PROMPT = """你是「梵音宝典 · Sarva-Dhāraṇī-Kośa」专属微调佛经与梵文陀罗尼学术问答助手，底层采用加州大学伯克利分校 Dharmamitra（佛学自然语言处理团队）在 CBETA 汉文大藏经、GRETIL 梵文原典、藏文甘珠尔/丹珠尔与巴利三藏（约 220 亿词元）上持续预训练并指令微调的权威佛学大模型 MITRA-Qwen3.5-IT（buddhist-nlp/mitra-qwen35-it）。

请严格遵循以下佛教学术与文献校勘准则回答用户：
1. 【优先依据本库检索原文】：当上下文中提供了【梵音宝典网站检索证据（RAG Context）】或【当前阅读经典上下文】时，必须优先依据所附原典经文、经号（如 T08n0235、F28n1071、Toh-597、CUDL 写本号）、译者及梵汉对音作答，并在文中明确标注经名与经号（如《金刚般若波罗蜜经》(T08n0235)）。
2. 【严禁臆造经文与伪经】：引用佛经原句时忠实于原载文本；若本库检索片段未包含某细节，请明确区分“本库原典记载”与“佛学通说/模型知识”，绝不编造不存在的经号、卷次或梵文咒句。
3. 【梵汉藏多语与声明学精准解析】：涉及梵文陀罗尼、悉昙字门（Siddhaṃ）、种子字（Bīja）或 IAST 转写（如随韵 ṃ、止韵 ḥ、二合复辅音、轻重律 Guru/Laghu）时，给出准确的梵文词根（dhātu/prātipadika）、语法格位与历代译师（鸠摩罗什、玄奘、不空等）的译音/译意对比。
4. 【清晰易读】：使用现代中文（保留原典引文原貌）条理清晰地分点或分段解答，语气温和、严谨、客观。"""

_MODEL_LOCK = threading.Lock()
_LOADED_HF_PIPELINE: dict[str, Any] = {}
_LOADED_LLAMACPP: Any = None
_BOOT_TS = time.time()


class ChatMessage(BaseModel):
    role: str
    content: str


class RagPassageInput(BaseModel):
    entryId: str | None = None
    canonId: str | None = None
    title: str = ""
    badge: str | None = None
    translator: str | None = None
    snippet: str = ""
    url: str | None = None


class ActiveScriptureInput(BaseModel):
    entryId: str | None = None
    titleZh: str = ""
    taishoNo: str | None = None
    translatorZh: str | None = None
    hasDharani: bool = False
    summarySnippet: str | None = None
    originalExcerpt: str | None = None


class BuddhistQaRequest(BaseModel):
    messages: list[ChatMessage] = Field(default_factory=list)
    ragContext: list[RagPassageInput] = Field(default_factory=list)
    activeScripture: ActiveScriptureInput | None = None
    enableServerRag: bool = True
    stream: bool = True
    temperature: float = 0.25
    maxTokens: int = 1024


class OpenAiChatRequest(BaseModel):
    model: str = PRIMARY_MODEL_ID
    messages: list[ChatMessage]
    stream: bool = False
    temperature: float = 0.25
    max_tokens: int = 1024


def _verify_auth(req: Request) -> None:
    if not API_BEARER_KEY:
        return
    auth = req.headers.get("authorization") or ""
    if auth != f"Bearer {API_BEARER_KEY}":
        raise HTTPException(status_code=401, detail="Invalid or missing Authorization Bearer token.")


def _build_grounded_messages(
    user_messages: list[ChatMessage],
    frontend_rag: list[RagPassageInput],
    active_scripture: ActiveScriptureInput | None,
    enable_server_rag: bool = True,
) -> tuple[list[dict[str, str]], list[dict[str, Any]]]:
    latest_user_query = ""
    for msg in reversed(user_messages):
        if msg.role == "user" and msg.content.strip():
            latest_user_query = msg.content.strip()
            break

    citations: list[dict[str, Any]] = []
    seen_keys: set[str] = set()

    for p in frontend_rag[:8]:
        key = f"{p.canonId or p.entryId}|{p.title}"
        if key in seen_keys:
            continue
        seen_keys.add(key)
        citations.append(
            {
                "sourceKind": "website-rag",
                "entryId": p.entryId or "",
                "canonId": p.canonId or "",
                "title": p.title,
                "badge": p.badge or p.canonId or "网站原典库",
                "translator": p.translator or "",
                "snippet": p.snippet,
                "url": p.url or "",
            }
        )

    if enable_server_rag and latest_user_query and len(citations) < 4:
        try:
            server_hits = GLOBAL_CORPUS_INDEX.retrieve(latest_user_query, top_k=5)
            for hit in server_hits:
                key = f"{hit.get('canonId')}|{hit.get('title')}"
                if key in seen_keys:
                    continue
                seen_keys.add(key)
                citations.append(hit)
                if len(citations) >= 7:
                    break
        except Exception:
            pass

    context_blocks: list[str] = []
    if active_scripture and active_scripture.titleZh:
        act_lines = [
            "【用户当前在网站阅读器打开的经典】",
            f"- 经名：{active_scripture.titleZh}（经号/标识：{active_scripture.taishoNo or '未标'}，译校：{active_scripture.translatorZh or '原典'}）",
            f"- 类型：{'含陀罗尼经典' if active_scripture.hasDharani else '纯经文原典（无陀罗尼）'}",
        ]
        if active_scripture.summarySnippet:
            act_lines.append(f"- 提要：{active_scripture.summarySnippet[:350]}")
        if active_scripture.originalExcerpt:
            act_lines.append(f"- 当前展示原典片段：{active_scripture.originalExcerpt[:900]}")
        context_blocks.append("\n".join(act_lines))

    if citations:
        ev_lines = ["【梵音宝典网站全库检索命中的权威经文与梵典证据（RAG Context）】"]
        for idx, c in enumerate(citations, start=1):
            ev_lines.append(
                f"[证据 {idx}] {c['title']} ({c.get('badge') or c.get('canonId') or ''})"
                f"{' · ' + c['translator'] if c.get('translator') else ''}\n"
                f"原文/内容摘录：{c['snippet'][:650]}"
            )
        context_blocks.append("\n\n".join(ev_lines))

    full_system = BUDDHIST_SYSTEM_PROMPT
    if context_blocks:
        full_system += "\n\n" + "\n\n".join(context_blocks)

    chat_msgs: list[dict[str, str]] = [{"role": "system", "content": full_system}]
    for m in user_messages[-10:]:
        if m.role in ("user", "assistant") and m.content.strip():
            chat_msgs.append({"role": m.role, "content": m.content.strip()})
    return chat_msgs, citations


def _ensure_transformers_model() -> tuple[Any, Any]:
    if "model" in _LOADED_HF_PIPELINE and "tokenizer" in _LOADED_HF_PIPELINE:
        return _LOADED_HF_PIPELINE["model"], _LOADED_HF_PIPELINE["tokenizer"]

    with _MODEL_LOCK:
        if "model" in _LOADED_HF_PIPELINE and "tokenizer" in _LOADED_HF_PIPELINE:
            return _LOADED_HF_PIPELINE["model"], _LOADED_HF_PIPELINE["tokenizer"]

        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer

        hf_token = os.environ.get("HF_TOKEN") or None
        tokenizer = AutoTokenizer.from_pretrained(
            PRIMARY_MODEL_ID,
            trust_remote_code=True,
            token=hf_token,
        )

        model_kwargs: dict[str, Any] = {
            "trust_remote_code": True,
            "token": hf_token,
            "low_cpu_mem_usage": True,
        }
        has_cuda = torch.cuda.is_available()
        if has_cuda and LOAD_IN_4BIT:
            try:
                from transformers import BitsAndBytesConfig

                model_kwargs["quantization_config"] = BitsAndBytesConfig(
                    load_in_4bit=True,
                    bnb_4bit_quant_type="nf4",
                    bnb_4bit_use_double_quant=True,
                    bnb_4bit_compute_dtype=torch.bfloat16,
                )
                model_kwargs["device_map"] = "auto"
            except Exception:
                model_kwargs["torch_dtype"] = torch.bfloat16
                model_kwargs["device_map"] = "auto"
        elif has_cuda:
            model_kwargs["torch_dtype"] = torch.bfloat16
            model_kwargs["device_map"] = "auto"
        else:
            model_kwargs["torch_dtype"] = torch.float32

        model = AutoModelForCausalLM.from_pretrained(PRIMARY_MODEL_ID, **model_kwargs)
        model.eval()
        _LOADED_HF_PIPELINE["model"] = model
        _LOADED_HF_PIPELINE["tokenizer"] = tokenizer
        return model, tokenizer


def _format_mitra_prompt(tokenizer: Any, messages: list[dict[str, str]]) -> str:
    """
    Applies Qwen3.5 chat template with `enable_thinking=False` as strictly required
    by `buddhist-nlp/mitra-qwen35-it` model card.
    """
    try:
        return tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True,
            enable_thinking=False,
        )
    except TypeError:
        rendered = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True,
        )
        # Ensure empty think block if older transformers lacks `enable_thinking` kwarg
        if "<think>" not in rendered:
            rendered += "<think>\n\n</think>\n\n"
        return rendered


def _strip_residual_think_tags(text: str) -> str:
    cleaned = re.sub(r"<think>[\s\S]*?</think>\s*", "", text)
    return cleaned.strip()


def _stream_llamacpp_upstream(
    messages: list[dict[str, str]],
    temperature: float,
    max_tokens: int,
) -> Iterator[str]:
    payload = json.dumps(
        {
            "model": GGUF_REPO_ID,
            "messages": messages,
            "temperature": max(0.05, min(1.2, temperature)),
            "top_k": 40,
            "top_p": 0.2,
            "repeat_penalty": 1.05,
            "max_tokens": max(64, min(2048, max_tokens)),
            "stream": True,
            "chat_template_kwargs": {"enable_thinking": False},
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        f"{LLAMACPP_UPSTREAM}/v1/chat/completions",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        for raw_line in resp:
            line = raw_line.decode("utf-8", errors="ignore").strip()
            if not line.startswith("data:"):
                continue
            data_str = line[5:].strip()
            if data_str == "[DONE]":
                break
            try:
                chunk = json.loads(data_str)
                delta = ((chunk.get("choices") or [{}])[0].get("delta") or {}).get("content")
                if delta:
                    yield delta
            except Exception:
                continue


@spaces.GPU(duration=65)
def generate_mitra_stream(
    messages: list[dict[str, str]],
    temperature: float = 0.25,
    max_tokens: int = 1024,
) -> Iterator[str]:
    if LLAMACPP_UPSTREAM or BACKEND_MODE == "llamacpp":
        yield from _stream_llamacpp_upstream(messages, temperature, max_tokens)
        return

    import torch
    from transformers import TextIteratorStreamer

    model, tokenizer = _ensure_transformers_model()
    prompt_text = _format_mitra_prompt(tokenizer, messages)
    inputs = tokenizer(prompt_text, return_tensors="pt")
    target_device = next(model.parameters()).device
    inputs = {k: v.to(target_device) for k, v in inputs.items()}

    streamer = TextIteratorStreamer(
        tokenizer,
        skip_prompt=True,
        skip_special_tokens=True,
        timeout=90.0,
    )

    eff_temp = max(0.05, min(1.0, float(temperature or 0.25)))
    gen_kwargs: dict[str, Any] = {
        **inputs,
        "streamer": streamer,
        "max_new_tokens": max(64, min(2048, int(max_tokens or 1024))),
        "do_sample": eff_temp > 0.05,
        "temperature": eff_temp,
        "top_k": 40,
        "top_p": 0.25,
        "repetition_penalty": 1.05,
        "pad_token_id": tokenizer.eos_token_id,
    }

    worker = threading.Thread(target=lambda: _run_torch_generate(model, gen_kwargs, torch), daemon=True)
    worker.start()

    in_think = False
    buf = ""
    for piece in streamer:
        if not piece:
            continue
        buf += piece
        if "<think>" in buf and "</think>" not in buf:
            in_think = True
            continue
        if in_think:
            if "</think>" in buf:
                in_think = False
                after = buf.split("</think>", 1)[1].lstrip()
                buf = ""
                if after:
                    yield after
            continue
        yield piece
        buf = ""


def _run_torch_generate(model: Any, gen_kwargs: dict[str, Any], torch_mod: Any) -> None:
    with torch_mod.inference_mode():
        model.generate(**gen_kwargs)


@spaces.GPU(duration=65)
def generate_mitra_sync(
    messages: list[dict[str, str]],
    temperature: float = 0.25,
    max_tokens: int = 1024,
) -> str:
    chunks = list(generate_mitra_stream(messages, temperature=temperature, max_tokens=max_tokens))
    return _strip_residual_think_tags("".join(chunks))


fastapi_app = FastAPI(
    title="Sarva-Dhāraṇī-Kośa · MITRA-Qwen3.5 Buddhist Sutra RAG API",
    version="1.0.0",
)

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@fastapi_app.on_event("startup")
async def _on_startup() -> None:
    # Pre-warm corpus index in a background daemon thread so first /api/qa/health is instant (0ms)
    threading.Thread(target=GLOBAL_CORPUS_INDEX.ensure_loaded, daemon=True).start()

    # Optional in-container self keep-alive loop if SPACE_HOST is present
    space_host = os.environ.get("SPACE_HOST", "").strip()
    if space_host:
        asyncio.create_task(_internal_self_keepalive(f"https://{space_host}/api/qa/health"))


async def _internal_self_keepalive(health_url: str) -> None:
    while True:
        await asyncio.sleep(25 * 60)
        try:
            req = urllib.request.Request(
                health_url,
                headers={"User-Agent": "Sarva-Internal-SelfKeepAlive/1.0"},
            )
            urllib.request.urlopen(req, timeout=10).read()
        except Exception:
            pass


@fastapi_app.api_route("/api/qa/health", methods=["GET", "HEAD"])
@fastapi_app.api_route("/api/health", methods=["GET", "HEAD"])
def api_qa_health() -> dict[str, Any]:
    """
    Zero-GPU-cost CPU health endpoint used by GitHub Actions 30-min keep-alive
    and website frontend status check (consumes 0s of ZeroGPU quota!).
    """
    return {
        "status": "ok",
        "service": "sarva-dharani-kosa-buddhist-qa",
        "model": PRIMARY_MODEL_ID,
        "ggufFallback": f"{GGUF_REPO_ID}:{GGUF_FILENAME}",
        "backendMode": "llamacpp" if LLAMACPP_UPSTREAM else BACKEND_MODE,
        "thinkingModeDisabled": True,
        "uptimeSec": round(time.time() - _BOOT_TS, 1),
        "corpusIndex": GLOBAL_CORPUS_INDEX.stats(),
        "endpoints": [
            "/api/qa/health",
            "/api/qa/search",
            "/api/qa/chat",
            "/v1/chat/completions",
        ],
    }


@fastapi_app.get("/api/qa/search")
def api_qa_search(
    q: str = Query(default="", description="Query across 12 Databases, Dhāraṇīs, and CBETA 27 Collections"),
    top_k: int = Query(default=6, ge=1, le=15),
) -> JSONResponse:
    if not q.strip():
        return JSONResponse({"query": q, "results": []})
    hits = GLOBAL_CORPUS_INDEX.retrieve(q.strip(), top_k=top_k)
    return JSONResponse({"query": q, "results": hits})


@fastapi_app.post("/api/qa/chat")
def api_qa_chat(req_body: BuddhistQaRequest, request: Request):
    _verify_auth(request)
    if not req_body.messages:
        raise HTTPException(status_code=400, detail="messages must not be empty.")

    grounded_msgs, citations = _build_grounded_messages(
        user_messages=req_body.messages,
        frontend_rag=req_body.ragContext,
        active_scripture=req_body.activeScripture,
        enable_server_rag=req_body.enableServerRag,
    )

    if not req_body.stream:
        answer = generate_mitra_sync(
            grounded_msgs,
            temperature=req_body.temperature,
            max_tokens=req_body.maxTokens,
        )
        return JSONResponse(
            {
                "model": PRIMARY_MODEL_ID,
                "answer": answer,
                "citations": citations,
            }
        )

    def _sse_event_stream() -> Iterator[bytes]:
        meta_event = {
            "type": "meta",
            "model": PRIMARY_MODEL_ID,
            "citations": citations,
        }
        yield f"data: {json.dumps(meta_event, ensure_ascii=False)}\n\n".encode("utf-8")
        try:
            for token in generate_mitra_stream(
                grounded_msgs,
                temperature=req_body.temperature,
                max_tokens=req_body.maxTokens,
            ):
                payload = {"type": "delta", "content": token}
                yield f"data: {json.dumps(payload, ensure_ascii=False)}\n\n".encode("utf-8")
            yield b'data: {"type":"done"}\n\n'
        except Exception as exc:
            err_payload = {"type": "error", "error": str(exc)}
            yield f"data: {json.dumps(err_payload, ensure_ascii=False)}\n\n".encode("utf-8")

    return StreamingResponse(
        _sse_event_stream(),
        media_type="text/event-stream; charset=utf-8",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )


@fastapi_app.post("/v1/chat/completions")
def openai_compatible_chat(req_body: OpenAiChatRequest, request: Request):
    _verify_auth(request)
    grounded_msgs, citations = _build_grounded_messages(
        user_messages=req_body.messages,
        frontend_rag=[],
        active_scripture=None,
        enable_server_rag=True,
    )
    created_ts = int(time.time())

    if not req_body.stream:
        answer = generate_mitra_sync(
            grounded_msgs,
            temperature=req_body.temperature,
            max_tokens=req_body.max_tokens,
        )
        return JSONResponse(
            {
                "id": f"chatcmpl-mitra-{created_ts}",
                "object": "chat.completion",
                "created": created_ts,
                "model": PRIMARY_MODEL_ID,
                "choices": [
                    {
                        "index": 0,
                        "message": {"role": "assistant", "content": answer},
                        "finish_reason": "stop",
                    }
                ],
                "sarva_citations": citations,
            }
        )

    def _openai_sse() -> Iterator[bytes]:
        for token in generate_mitra_stream(
            grounded_msgs,
            temperature=req_body.temperature,
            max_tokens=req_body.max_tokens,
        ):
            chunk = {
                "id": f"chatcmpl-mitra-{created_ts}",
                "object": "chat.completion.chunk",
                "created": created_ts,
                "model": PRIMARY_MODEL_ID,
                "choices": [{"index": 0, "delta": {"content": token}, "finish_reason": None}],
            }
            yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n".encode("utf-8")
        yield b"data: [DONE]\n\n"

    return StreamingResponse(
        _openai_sse(),
        media_type="text/event-stream; charset=utf-8",
        headers={"Cache-Control": "no-cache, no-transform", "Access-Control-Allow-Origin": "*"},
    )


def _gradio_rag_chat(question: str, use_rag: bool, temperature: float) -> tuple[str, list[dict[str, Any]]]:
    q = (question or "").strip()
    if not q:
        return "请输入佛经、陀罗尼、悉昙声明学或跨库对勘问题。", []
    msgs, citations = _build_grounded_messages(
        user_messages=[ChatMessage(role="user", content=q)],
        frontend_rag=[],
        active_scripture=None,
        enable_server_rag=bool(use_rag),
    )
    ans = generate_mitra_sync(msgs, temperature=temperature, max_tokens=1024)
    return ans, citations


with gr.Blocks(title="梵音宝典 · MITRA-Qwen3.5 佛经大模型问答 API") as demo:
    gr.Markdown(
        "## ☸️ 梵音宝典 · MITRA-Qwen3.5 权威佛经微调大模型问答与全藏 RAG 服务\n"
        f"**核心底座模型**：[`{PRIMARY_MODEL_ID}`](https://huggingface.co/{PRIMARY_MODEL_ID}) "
        "（UC Berkeley Dharmamitra 佛学 NLP 团队基于 CBETA 全藏经、GRETIL 梵本、藏文甘珠尔与巴利三藏微调）\n\n"
        "- **健康与保活端点（0秒 GPU 消耗）**：`GET /api/qa/health`\n"
        "- **全站语料 RAG 问答流式 API**：`POST /api/qa/chat`\n"
        "- **OpenAI 兼容接口**：`POST /v1/chat/completions`"
    )
    with gr.Row():
        q_box = gr.Textbox(
            label="输入佛经义理、原典出处、梵文陀罗尼或悉昙声韵问题",
            value="《金刚般若波罗蜜经》中“应无所住而生其心”的梵文原词与核心义理是什么？",
            lines=2,
        )
    with gr.Row():
        rag_chk = gr.Checkbox(value=True, label="启用梵音宝典全藏经 + 12大国际梵典库 RAG 检索增强")
        temp_slider = gr.Slider(minimum=0.1, maximum=0.8, value=0.25, step=0.05, label="采样温度 (Temperature)")
    ask_btn = gr.Button("检索本库原典并生成解答 (MITRA-Qwen3.5-IT)", variant="primary")
    ans_md = gr.Markdown(label="模型回答")
    cit_json = gr.JSON(label="命中的本库原典证据 (RAG Citations)")

    ask_btn.click(
        fn=_gradio_rag_chat,
        inputs=[q_box, rag_chk, temp_slider],
        outputs=[ans_md, cit_json],
        api_name="ask_buddhist_sutra",
    )

# Register `@spaces.GPU` with ZeroGPU broker on loopback 7861 while leaving 0.0.0.0:7860 for FastAPI + Gradio
_prev_port = os.environ.get("GRADIO_SERVER_PORT")
os.environ["GRADIO_SERVER_PORT"] = "7861"
try:
    _launch_kwargs: dict[str, Any] = {
        "prevent_thread_lock": True,
        "server_name": "127.0.0.1",
        "server_port": 7861,
        "quiet": True,
        "show_error": False,
        "allowed_paths": [tempfile.gettempdir()],
    }
    if "ssr_mode" in inspect.signature(demo.launch).parameters:
        _launch_kwargs["ssr_mode"] = False
    demo.launch(**_launch_kwargs)
finally:
    if _prev_port is None:
        os.environ.pop("GRADIO_SERVER_PORT", None)
    else:
        os.environ["GRADIO_SERVER_PORT"] = _prev_port

_mount_kwargs: dict[str, Any] = {}
if "ssr_mode" in inspect.signature(gr.mount_gradio_app).parameters:
    _mount_kwargs["ssr_mode"] = False

app = gr.mount_gradio_app(fastapi_app, demo, path="/", **_mount_kwargs)

if __name__ == "__main__":
    listen_port = int(os.environ.get("PORT", os.environ.get("GRADIO_SERVER_PORT", "7860")))
    uvicorn.run(app, host="0.0.0.0", port=listen_port, log_level="info")
