#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# 一键部署脚本：
#   1. Hugging Face ZeroGPU Space (托管 48kHz 古典梵文神经 VITS 实时推理 API，供首次访问零等待发音)
#   2. Hugging Face Model Hub CDN (托管 48kHz 梵文神经 VITS ONNX 模型与全量云端语料检索分片，供浏览器后台缓存)
#   3. Hugging Face Static Space (免费托管完整前端与后台 WebAssembly 神经缓存引擎)
#   4. Cloudflare Pages (全球边缘 CDN 部署，可选)
#
# 用法：
#   export HF_TOKEN="hf_xxxxxxxx"
#   export CLOUDFLARE_API_TOKEN="xxxxxxxx"   # 可选
#   bash scripts/deploy-hf-and-cf.sh
# ==============================================================================

SPACE_NAME="${HF_SPACE_NAME:-sarva-dharani-kosa}"
TTS_API_SPACE_NAME="${HF_TTS_API_SPACE_NAME:-sarva-dharani-kosa-tts-api}"
MODEL_REPO_NAME="${HF_MODEL_REPO_NAME:-sarva-dharani-kosa-tts}"
CF_PROJECT_NAME="${CF_PAGES_PROJECT:-sarva-dharani-kosa}"

echo "=== [1/5] 检查 Hugging Face CLI 与认证状态 ==="
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
TTS_API_SPACE_ID="${HF_USER}/${TTS_API_SPACE_NAME}"
MODEL_ID="${HF_USER}/${MODEL_REPO_NAME}"
HF_STATIC_URL="https://$(echo "${HF_USER}-${SPACE_NAME}" | tr '[:upper:]' '[:lower:]' | tr '_' '-').static.hf.space"
HF_TTS_API_URL="https://$(echo "${HF_USER}-${TTS_API_SPACE_NAME}" | tr '[:upper:]' '[:lower:]' | tr '_' '-').hf.space"
HF_MODEL_CDN="https://huggingface.co/${MODEL_ID}/resolve/main"

echo "✅ 已认证 Hugging Face 用户: ${HF_USER}"
echo "🎙️ 48kHz 神经模型 API Space: https://huggingface.co/spaces/${TTS_API_SPACE_ID} (${HF_TTS_API_URL})"
echo "🧠 48kHz ONNX 模型仓库: https://huggingface.co/${MODEL_ID}"
echo "🚀 目标前端 Static Space: https://huggingface.co/spaces/${SPACE_ID}"
echo "🌐 独立直连访问地址: ${HF_STATIC_URL}"

echo "=== [2/5] 部署 48kHz 古典梵文神经 VITS API 至 Hugging Face ZeroGPU Space (${TTS_API_SPACE_ID}) ==="
TTS_STAGE_DIR="$(mktemp -d)"
trap 'rm -rf "${TTS_STAGE_DIR}"' EXIT

mkdir -p "${TTS_STAGE_DIR}/backend" "${TTS_STAGE_DIR}/models"
cp backend/hf_space_app.py "${TTS_STAGE_DIR}/app.py"
cp backend/*.py "${TTS_STAGE_DIR}/backend/" 2>/dev/null || true
cp -r models/ninada "${TTS_STAGE_DIR}/models/ninada"

cat > "${TTS_STAGE_DIR}/packages.txt" <<'PKG_EOF'
ffmpeg
PKG_EOF

cat > "${TTS_STAGE_DIR}/requirements.txt" <<'REQ_EOF'
onnxruntime>=1.17.0
numpy>=1.24.0
scipy>=1.11.0
REQ_EOF

cat > "${TTS_STAGE_DIR}/README.md" <<'README_EOF'
---
title: Sarva-Dhāraṇī-Kośa 48kHz Sanskrit Neural VITS TTS API
emoji: 🕉️
colorFrom: yellow
colorTo: red
sdk: gradio
sdk_version: 5.50.0
app_file: app.py
pinned: false
---

# 48,000 Hz Classical Sanskrit Neural VITS TTS API (`sa.onnx` / `sa_female.onnx`)

Provides real-time 48,000 Hz Classical Sanskrit Neural VITS synthesis (`/api/health`, `/api/tts`, `/api/syllable/{slp1}`) for **Sarva-Dhāraṇī-Kośa (梵音宝典)** so first-time visitors receive instant neural recitation while the browser caches ONNX models in the background.
README_EOF

python3 - "${TTS_API_SPACE_ID}" "${TTS_STAGE_DIR}" <<'EOF'
import os, sys
from huggingface_hub import HfApi

tts_space_id = sys.argv[1]
stage_dir = sys.argv[2]
api = HfApi(token=os.environ.get("HF_TOKEN") or None)

space_exists = False
try:
    info = api.repo_info(repo_id=tts_space_id, repo_type="space")
    space_exists = True
    print(f"ℹ️ TTS API Space already exists: {tts_space_id} (sdk={getattr(info, 'sdk', None)})")
except Exception:
    space_exists = False

if not space_exists:
    api.create_repo(
        repo_id=tts_space_id,
        repo_type="space",
        space_sdk="gradio",
        space_hardware="zero-a10g",
        exist_ok=True,
        private=False,
    )

api.upload_folder(
    folder_path=stage_dir,
    repo_id=tts_space_id,
    repo_type="space",
    ignore_patterns=["**/__pycache__/**", "**/*.pyc"],
    commit_message="Deploy 48kHz Classical Sanskrit Neural VITS FastAPI + Gradio ZeroGPU Space",
)
print(f"✅ 48kHz 梵文神经 VITS API Space 已同步至 https://huggingface.co/spaces/{tts_space_id}")
EOF

echo "=== [3/5] 编译全量世界梵文真言陀罗尼云端分片与检索索引，并同步至 Hugging Face Hub CDN ==="
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
try:
    api.repo_info(repo_id=model_id, repo_type="model")
except Exception:
    api.create_repo(repo_id=model_id, repo_type="model", exist_ok=True, private=False)

ninada_dir = Path("models/ninada")
if ninada_dir.is_dir() and any(ninada_dir.rglob("*.onnx")):
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

echo "=== [3b/5] 藏经全文库：检查或同步 CBETA 全部藏经原文 (canon/) ==="
CANON_EXISTS=$(python3 - "${MODEL_ID}" <<'EOF'
import os, sys
from huggingface_hub import HfApi
api = HfApi(token=os.environ.get("HF_TOKEN") or None)
try:
    ok = api.file_exists(repo_id=sys.argv[1], filename="canon/catalog.json.gz", repo_type="model")
    print("1" if ok else "0")
except Exception:
    print("0")
EOF
)
if [ "${FORCE_REBUILD_CANON:-0}" != "1" ] && [ "${CANON_EXISTS}" = "1" ]; then
  echo "ℹ️ 藏经全文库 (canon/catalog.json.gz) 已存在于 ${MODEL_ID}，跳过全量 XML 重编译（如需强制重建请设 FORCE_REBUILD_CANON=1）"
else
  CBETA_XML_DIR="${CBETA_XML_DIR:-$(mktemp -d)/xml-p5}"
  if [ ! -d "${CBETA_XML_DIR}" ]; then
    git clone -q --depth 1 https://github.com/cbeta-org/xml-p5.git "${CBETA_XML_DIR}"
  fi
  CBETA_XML_DIR="${CBETA_XML_DIR}" CANON_OUT_DIR="build/canon" npx tsx scripts/build-canon-library.ts

  python3 - "${MODEL_ID}" <<'EOF'
import os, sys
from huggingface_hub import HfApi

api = HfApi(token=os.environ.get("HF_TOKEN") or None)
api.upload_folder(
    folder_path="build/canon",
    path_in_repo="canon",
    repo_id=sys.argv[1],
    repo_type="model",
    commit_message="Upload 藏经全文库: complete CBETA canon (every collection), one gzip JSON per text + catalog",
)
print("✅ 藏经全文库已同步")
EOF
fi

echo "=== [4/5] 构建生产环境前端包 (dist/) 并部署至 Hugging Face Static Space ==="
VITE_HF_MODEL_BASE_URL="${HF_MODEL_CDN}" VITE_HF_TTS_API_URL="${HF_TTS_API_URL}" npm run build

python3 - "${SPACE_ID}" <<'EOF'
import os, sys
from pathlib import Path
from huggingface_hub import HfApi

space_id = sys.argv[1]
api = HfApi(token=os.environ.get("HF_TOKEN") or None)
try:
    api.repo_info(repo_id=space_id, repo_type="space")
except Exception:
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
    commit_message="Deploy Sarva-Dharani-Kosa production static web bundle with Cloud HF Neural TTS API + Background ONNX Caching",
)
print(f"✅ 成功部署至 https://huggingface.co/spaces/{space_id}")
EOF

if [ "${SKIP_CLOUDFLARE:-0}" = "1" ] || [ "${1:-}" = "--hf-only" ]; then
  echo "🎉 Hugging Face 测试版 (Staging) 部署完成！（已按配置跳过 Cloudflare 正式版推送）"
  echo "  • Hugging Face 测试版站点: ${HF_STATIC_URL}"
  echo "  • Hugging Face 48kHz 梵文神经 API: ${HF_TTS_API_URL}"
  echo "  • Hugging Face Space 主页: https://huggingface.co/spaces/${SPACE_ID}"
  exit 0
fi

echo "=== [5/5] 使用 Cloudflare Wrangler CLI 部署至 Cloudflare Pages ==="
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "⚠️ 未检测到 CLOUDFLARE_API_TOKEN，跳过 Cloudflare Pages 推送（Hugging Face 测试版已上线：${HF_STATIC_URL}，神经语音 API：${HF_TTS_API_URL}）。"
  exit 0
fi

find dist -type f -size +24M -delete || true
npx --yes wrangler pages project create "${CF_PROJECT_NAME}" --production-branch=main 2>/dev/null || true
npx --yes wrangler pages deploy dist --project-name="${CF_PROJECT_NAME}" --branch=main --commit-dirty=true

echo "🎉 部署全部完成！"
echo "  • Hugging Face 48kHz 梵文神经 API: ${HF_TTS_API_URL}"
echo "  • Hugging Face 测试版在线站点: ${HF_STATIC_URL}"
echo "  • Hugging Face Space 主页: https://huggingface.co/spaces/${SPACE_ID}"
echo "  • Cloudflare Pages 正式版全球边缘站点: https://${CF_PROJECT_NAME}.pages.dev"
