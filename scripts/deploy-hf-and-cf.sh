#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# 一键部署脚本：
#   1. Hugging Face Model Hub CDN (托管 155MB 48kHz 梵文神经 VITS ONNX 模型)
#   2. Hugging Face Static Space (免费托管完整前端与 WebAssembly 神经 TTS)
#   3. Cloudflare Pages (全球边缘 CDN 部署，可选)
#
# 用法：
#   export HF_TOKEN="hf_xxxxxxxx"
#   export CLOUDFLARE_API_TOKEN="xxxxxxxx"   # 可选
#   bash scripts/deploy-hf-and-cf.sh
# ==============================================================================

SPACE_NAME="${HF_SPACE_NAME:-sarva-dharani-kosa}"
MODEL_REPO_NAME="${HF_MODEL_REPO_NAME:-sarva-dharani-kosa-tts}"
CF_PROJECT_NAME="${CF_PAGES_PROJECT:-sarva-dharani-kosa}"

echo "=== [1/4] 检查 Hugging Face CLI 与认证状态 ==="
if ! python3 -c "import huggingface_hub" >/dev/null 2>&1; then
  echo "正在安装 huggingface_hub CLI..."
  pip install --user --break-system-packages -q "huggingface_hub"
fi

export PATH="$HOME/.local/bin:$PATH"

HF_USER=$(python3 - <<'EOF'
import os, sys
from huggingface_hub import HfApi
token = os.environ.get("HF_TOKEN") or None
try:
    api = HfApi(token=token)
    info = api.whoami()
    print(info["name"])
except Exception:
    sys.exit(1)
EOF
) || {
  echo "❌ 未检测到有效的 Hugging Face 登录凭证。请先设置环境变量 HF_TOKEN='hf_xxx'（需具有 Write 权限）。"
  exit 1
}

SPACE_ID="${HF_USER}/${SPACE_NAME}"
MODEL_ID="${HF_USER}/${MODEL_REPO_NAME}"
HF_STATIC_URL="https://$(echo "${HF_USER}-${SPACE_NAME}" | tr '[:upper:]' '[:lower:]' | tr '_' '-').static.hf.space"
HF_MODEL_CDN="https://huggingface.co/${MODEL_ID}/resolve/main"

echo "✅ 已认证 Hugging Face 用户: ${HF_USER}"
echo "🧠 48kHz ONNX 模型仓库: https://huggingface.co/${MODEL_ID}"
echo "🚀 目标 Hugging Face Space: https://huggingface.co/spaces/${SPACE_ID}"
echo "🌐 独立直连访问地址: ${HF_STATIC_URL}"

echo "=== [2/4] 编译全量世界梵文真言陀罗尼云端分片与检索索引，并同步至 Hugging Face Hub CDN ==="
if [ ! -d "node_modules" ]; then
  npm ci
fi
npx tsx scripts/build_cloud_corpus_shards.ts

python3 - "${MODEL_ID}" <<'EOF'
import os, sys
from pathlib import Path
from huggingface_hub import HfApi

model_id = sys.argv[1]
api = HfApi(token=os.environ.get("HF_TOKEN") or None)
api.create_repo(repo_id=model_id, repo_type="model", exist_ok=True, private=False)
ninada_dir = Path("models/ninada")
if ninada_dir.is_dir() and any(ninada_dir.glob("*.onnx")):
    api.upload_folder(
        folder_path="models/ninada",
        repo_id=model_id,
        repo_type="model",
        commit_message="Upload 48kHz Classical Sanskrit Neural VITS ONNX models (sa.onnx, sa_female.onnx, vocabs.json)",
    )
api.upload_folder(
    folder_path="public/corpus",
    path_in_repo="corpus",
    repo_id=model_id,
    repo_type="model",
    commit_message="Upload Untruncated World Sanskrit Mantra & Dharani Cloud Corpus Shards (2,482 Entries + 12 Global DBs + 297 GRETIL Canons)",
)
print(f"✅ 模型与云端语料检索分片已同步至 https://huggingface.co/{model_id}")
EOF

echo "=== [3/4] 构建生产环境前端包 (dist/) 并部署至 Hugging Face Space ==="
VITE_HF_MODEL_BASE_URL="${HF_MODEL_CDN}" npm run build

python3 - "${SPACE_ID}" <<'EOF'
import os, sys
from pathlib import Path
from huggingface_hub import HfApi

space_id = sys.argv[1]
api = HfApi(token=os.environ.get("HF_TOKEN") or None)
api.create_repo(
    repo_id=space_id,
    repo_type="space",
    space_sdk="static",
    exist_ok=True,
    private=False,
)

readme_path = Path("dist/README.md")
readme_path.write_text("""---
title: 梵音宝典 · Sarva-Dhāraṇī-Kośa
emoji: 🪷
colorFrom: yellow
colorTo: red
sdk: static
app_file: index.html
pinned: true
---

# 梵音宝典 · Sarva-Dhāraṇī-Kośa (一切陀罗尼全书)
""", encoding="utf-8")

api.upload_folder(
    folder_path="dist",
    repo_id=space_id,
    repo_type="space",
    ignore_patterns=["audio/cache/**"],
    commit_message="Deploy Sarva-Dharani-Kosa production static web bundle with 48kHz ONNX Neural VITS TTS",
)
print(f"✅ 成功部署至 https://huggingface.co/spaces/{space_id}")
EOF

echo "=== [4/4] 使用 Cloudflare Wrangler CLI 部署至 Cloudflare Pages ==="
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "⚠️ 未检测到 CLOUDFLARE_API_TOKEN，跳过 Cloudflare Pages 推送（Hugging Face Space 已上线：${HF_STATIC_URL}）。"
  exit 0
fi

npx --yes wrangler pages project create "${CF_PROJECT_NAME}" --production-branch=main 2>/dev/null || true
npx --yes wrangler pages deploy dist --project-name="${CF_PROJECT_NAME}" --branch=main --commit-dirty=true

echo "🎉 部署全部完成！"
echo "  • Hugging Face 完整在线站点: ${HF_STATIC_URL}"
echo "  • Hugging Face Space 主页: https://huggingface.co/spaces/${SPACE_ID}"
echo "  • Cloudflare Pages 全球边缘站点: https://${CF_PROJECT_NAME}.pages.dev"
