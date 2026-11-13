#!/usr/bin/env python3
"""
hf-buddhist-qa-space/deploy_to_hf.py

One-command deployer for the Sarva-Dhāraṇī-Kośa MITRA-Qwen3.5 Buddhist Sutra Q&A Space.
Generates `README.md` (with Hugging Face Space YAML frontmatter) and `requirements.txt`,
creates or updates the Space on Hugging Face Hub (`bhrum108/sarva-dharani-kosa-buddhist-qa`),
and uploads `app.py` + `rag_corpus.py` in a single step.

Usage:
  1. Authenticate once via `huggingface-cli login` (or set `HF_TOKEN` in environment)
  2. Run: `npm run deploy:qa-hf`
"""
from __future__ import annotations

import argparse
import os
import shutil
import tempfile
from pathlib import Path

from huggingface_hub import HfApi

SPACE_DIR = Path(__file__).resolve().parent

REQUIREMENTS_TXT = "\n".join(
    [
        "fastapi>=0.115.0",
        "uvicorn[standard]>=0.30.0",
        "gradio>=5.9.1",
        "pydantic>=2.7.0",
        "torch>=2.4.0",
        "transformers>=4.48.0",
        "accelerate>=1.1.0",
        "bitsandbytes>=0.45.0",
        "huggingface_hub>=0.26.0",
        "sentencepiece>=0.2.0",
        "protobuf>=4.25.0",
        "",
    ]
)

SPACE_README_MD = "\n".join(
    [
        "---",
        "title: Sarva-Dhāraṇī-Kośa · MITRA-Qwen3.5 Buddhist Sutra Q&A API",
        "emoji: ☸️",
        "colorFrom: yellow",
        "colorTo: red",
        "sdk: gradio",
        "sdk_version: 5.50.0",
        "app_file: app.py",
        "pinned: false",
        "license: apache-2.0",
        "models:",
        "  - buddhist-nlp/mitra-qwen35-it",
        "  - christian-steinert/mitra-qwen35-it-GGUF",
        "short_description: Fine-tuned MITRA-Qwen3.5 Buddhist Sutra RAG Q&A API",
        "---",
        "",
        "# ☸️ 梵音宝典 · MITRA-Qwen3.5 佛经大模型问答与全藏 RAG API",
        "",
        "本 Space 为 **梵音宝典（Sarva-Dhāraṇī-Kośa）** 提供微调佛经大模型在线对话与全库原典检索增强（RAG）API：",
        "",
        "- **权威微调模型**：[`buddhist-nlp/mitra-qwen35-it`](https://huggingface.co/buddhist-nlp/mitra-qwen35-it)（UC Berkeley Dharmamitra 佛学自然语言处理项目，在 CBETA 汉文藏经、GRETIL 梵本、藏文甘珠尔及巴利三藏上持续预训练并指令微调）",
        "- **量化权重兼容**：[`christian-steinert/mitra-qwen35-it-GGUF`](https://huggingface.co/christian-steinert/mitra-qwen35-it-GGUF)",
        "- **核心 API 端点**：",
        "  - `GET /api/qa/health`：0秒 GPU 消耗健康检查与自动保活探针",
        "  - `GET /api/qa/search?q=...`：检索 12 大国际梵典库与 CBETA 27 部类全藏经",
        "  - `POST /api/qa/chat`：支持 SSE 流式输出与原典引用返回的佛经 RAG 问答接口",
        "  - `POST /v1/chat/completions`：OpenAI 标准兼容接口",
        "",
    ]
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Deploy Buddhist Sutra Q&A Space to Hugging Face")
    parser.add_argument(
        "--space-id",
        default=os.environ.get("HF_QA_SPACE_ID", "bhrum108/sarva-dharani-kosa-buddhist-qa"),
        help="Target Hugging Face Space repo ID (owner/space-name)",
    )
    parser.add_argument(
        "--hardware",
        default=os.environ.get("HF_QA_HARDWARE", "zero-a10g"),
        help="Suggested Hugging Face Space hardware flavor (default: zero-a10g)",
    )
    parser.add_argument(
        "--write-local-only",
        action="store_true",
        help="Write README.md and requirements.txt locally without uploading",
    )
    args = parser.parse_args()

    (SPACE_DIR / "requirements.txt").write_text(REQUIREMENTS_TXT, encoding="utf-8")
    (SPACE_DIR / "README.md").write_text(SPACE_README_MD, encoding="utf-8")

    if args.write_local_only:
        print(f"Generated local README.md and requirements.txt in {SPACE_DIR}")
        return

    api = HfApi()
    create_kwargs: dict[str, object] = {
        "repo_id": args.space_id,
        "repo_type": "space",
        "space_sdk": "gradio",
        "exist_ok": True,
        "private": False,
        "space_hardware": args.hardware,
    }

    try:
        api.create_repo(**create_kwargs)
    except Exception as exc:
        print(f"[deploy_to_hf] Hardware tier fallback ({exc}), creating Space with default hardware...")
        create_kwargs.pop("space_hardware", None)
        api.create_repo(**create_kwargs)

    stage_dir = Path(tempfile.mkdtemp(prefix="sarva-qa-space-"))
    try:
        shutil.copy2(SPACE_DIR / "app.py", stage_dir / "app.py")
        shutil.copy2(SPACE_DIR / "rag_corpus.py", stage_dir / "rag_corpus.py")
        (stage_dir / "requirements.txt").write_text(REQUIREMENTS_TXT, encoding="utf-8")
        (stage_dir / "README.md").write_text(SPACE_README_MD, encoding="utf-8")

        api.upload_folder(
            repo_id=args.space_id,
            repo_type="space",
            folder_path=str(stage_dir),
            commit_message="Deploy MITRA-Qwen3.5 Buddhist Sutra RAG Q&A API for Sarva-Dhāraṇī-Kośa",
        )
    finally:
        shutil.rmtree(stage_dir, ignore_errors=True)

    print(f"Successfully deployed Space repository: {args.space_id}")


if __name__ == "__main__":
    main()
