#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# 正式版 (Production) 部署脚本 — Cloudflare Pages 全球边缘网络
#
# 架构说明：
#   • 测试版 (Staging) 运行在 Hugging Face Static Space:
#     https://bhrum108-sarva-dharani-kosa.static.hf.space
#   • 正式版 (Production) 运行在 Cloudflare Pages (绑定 Cloudflare 自定义域名)
#   • 48kHz 古典梵文神经 VITS 实时语音 API 与全量云端语料分片自动调用 Hugging Face ZeroGPU & Hub CDN
#
# 用法：
#   export CLOUDFLARE_API_TOKEN="你的_Cloudflare_API_Token"
#   export CLOUDFLARE_ACCOUNT_ID="你的_Account_ID"   # 可选（多账户时建议设置）
#   npm run deploy:prod
# ==============================================================================

CF_PROJECT_NAME="${CF_PAGES_PROJECT:-sarva-dharani-kosa}"
HF_USER="${HF_USER:-bhrum108}"
TTS_API_SPACE_NAME="${HF_TTS_API_SPACE_NAME:-sarva-dharani-kosa-tts-api}"
MODEL_REPO_NAME="${HF_MODEL_REPO_NAME:-sarva-dharani-kosa-tts}"

HF_TTS_API_URL="https://$(echo "${HF_USER}-${TTS_API_SPACE_NAME}" | tr '[:upper:]' '[:lower:]' | tr '_' '-').hf.space"
HF_MODEL_CDN="https://huggingface.co/${HF_USER}/${MODEL_REPO_NAME}/resolve/main"

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "❌ 未检测到 CLOUDFLARE_API_TOKEN 环境变量。"
  echo "请在 Cloudflare 控制台 (My Profile -> API Tokens) 创建具备 'Cloudflare Pages: Edit' 权限的 Token，然后执行："
  echo "  export CLOUDFLARE_API_TOKEN='你的_Token'"
  echo "  npm run deploy:prod"
  exit 1
fi

echo "=== [1/3] 生成云端语料分片与检索索引 ==="
if [ ! -d "node_modules" ]; then
  npm ci
fi
npx tsx scripts/build_cloud_corpus_shards.ts

echo "=== [2/3] 构建 Cloudflare Pages 正式版前端包 (dist/) ==="
VITE_HF_MODEL_BASE_URL="${HF_MODEL_CDN}" \
VITE_HF_TTS_API_URL="${HF_TTS_API_URL}" \
npm run build

# 二次确保移除任何超过 Cloudflare Pages 25 MiB 限制的未压缩单文件（保留 .json.gz 及 HF CDN 后备）
find dist -type f -size +24M -delete || true

echo "=== [3/3] 推送正式版至 Cloudflare Pages (${CF_PROJECT_NAME}) ==="
npx --yes wrangler pages project create "${CF_PROJECT_NAME}" --production-branch=main 2>/dev/null || true
npx --yes wrangler pages deploy dist --project-name="${CF_PROJECT_NAME}" --branch=main --commit-dirty=true

echo "🎉 正式版 (Production) 已成功发布至 Cloudflare Pages！"
echo "  • Cloudflare 默认域名: https://${CF_PROJECT_NAME}.pages.dev"
echo "  • 绑定你的自定义域名: Cloudflare Dashboard -> Workers & Pages -> ${CF_PROJECT_NAME} -> Custom domains"
