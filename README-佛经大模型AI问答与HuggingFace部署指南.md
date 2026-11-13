梵音宝典 (Sarva-Dhāraṇī-Kośa) 专属微调佛经大模型 AI 问答、全库 RAG 与 Hugging Face 自动保活部署指南
本文档为已原地集成至主项目目录 sarva-dharani-kosa (原始目录) 的「微调佛经大模型 AI 问答 + 全库原典检索增强（RAG）+ Hugging Face 自动保活 API」完整架构与上线指南。所有被替换的 9 个旧版源码文件均已安全归档至 佛经AI问答升级前备份。
一、权威微调佛经大模型选型依据
经过对当前国际开源佛学计算语言学（Computational Buddhist Philology）模型体系的全面比选，本系统采用加州大学伯克利分校（UC Berkeley）Sebastian Nehrdich 等学者主持的 Dharmamitra 项目 最新发布的旗舰多语种佛典指令微调大模型家族（详见 WMT 2026 论文 MITRA-MT 与预印本 MITRA: A Large-Scale Parallel Corpus and Multilingual Pretrained Language Model）：


组件角色
	模型仓库与链接
	核心规格与佛典训练语料
	部署定位
	主力微调佛经对话与对勘模型
	buddhist-nlp/mitra-qwen35-it（Dharmamitra 官方 MITRA-Qwen3.5 集合）
	9B 参数、262K 上下文窗口、Apache-2.0 协议；在约 220 亿词元的 CBETA 与 Kanripo 汉文大藏经、GRETIL 梵文原典、84000/甘珠尔藏文及巴利三藏 + 百万级平行句对上持续预训练并指令微调
	部署于 Hugging Face ZeroGPU Spaces（4-bit NF4 仅占约 6.2 GB 显存），提供流式 SSE 问答 API
	量化 CPU / Docker 备选权重
	christian-steinert/mitra-qwen35-it-GGUF
	提供 Q4_K_M（5.24 GiB）至 Q8_0（8.87 GiB）量化权重，完美支持 llama.cpp 服务端
	供 Docker CPU-Basic（16GB 内存）或本地 Apple Silicon 无配额限制推理
	跨语种佛典语义检索向量模型
	buddhist-nlp/mitra-qwen35-2b-embedder / buddhist-nlp/gemma-2-mitra-it
	专用于汉、梵、藏、英跨语种经文平行句段对齐与语义重排
	与本站 BM25 + 简繁音韵归一索引组成混合 RAG
	

关键推理调优细节（已在服务端代码中内置固化）：根据 christian-steinert/mitra-qwen35-it-GGUF 模型卡说明，mitra-qwen35-it 不使用 <think> 思考链模式，调用聊天模板时必须显式传入 enable_thinking=False（以及 temperature=0.25、top_k=40、repetition_penalty=1.05 防止长串梵文转写重复循环），后端 app.py 已自动完成该配置。
二、全站数据打通（前后端双层 Hybrid RAG 架构）
系统彻底打通了 AI 模型与网站现有的全部佛典数据，使 AI 在回答时能够实时查找、引用并一键跳回原卷：
1. 前端全库实时检索引擎
参考模块：sutraRagRetriever.ts


* 当前阅读经典上下文直连：在阅读器 DharaniReader.tsx 阅读任意无陀罗尼纯经文（如《金刚经》《阿弥陀经》）或含陀罗尼经典时，点击右上角「问佛经AI」按钮即可自动提取当前经卷的原典正文段落送入模型上下文。
* 2,482+ 部精校陀罗尼与全球 12 大梵典库（DB1 房山石经至 DB12 牛津 OCHS 密续辞典）多字段检索：自动抽取用户问题中的经名、经号（如 T08n0235、F28n1071、Toh-597）、梵文 IAST 及核心法相词，实时检索匹配的梵音、古汉音译、词根释义与写本录文。
* CBETA 27 部类全藏经全文检索与段落截取：自动调用目录索引与 64 分桶全文检索，按需解压命中的经卷并提取核心原典段落作为证据注入 Prompt。
* 引用卡片一键回跳原典：AI 界面 BuddhistAiQaStudio.tsx 为每条回答附上「本次命中的本库原典卡片」，点击「在阅读器中打开」即可直接在主阅读器展开该经全文。
2. Hugging Face 服务端独立语料库检索兜底
参考模块：rag_corpus.py


* 即使外部程序直接通过 Hugging Face Spaces API 调用 POST /api/qa/chat 或 OpenAI 兼容接口 POST /v1/chat/completions，后端也会自动从云端语料仓库拉取并缓存分片索引完成服务端 RAG。
三、Hugging Face 部署、边缘代理与三重自动保活机制
1. 独立 Hugging Face Space 部署目录
参考目录：hf-buddhist-qa-space


* 包含 FastAPI + Gradio + ZeroGPU 推理入口 app.py、服务端检索引擎 rag_corpus.py 与一键部署脚本 deploy_to_hf.py。
* 注意事项：根据 Hugging Face 社区近期 Spaces 规则说明，新建免费计算型 Space 默认使用 Gradio ZeroGPU（要求已验证邮箱且注册满 30 天账号可免费托管最多 2 个 ZeroGPU Spaces；若使用 HF PRO 账号则可任意开启 CPU-Basic Docker 或更高配硬件）。deploy_to_hf.py 已默认配置为兼容性最佳的 Gradio + @spaces.GPU 架构。
2. 同源流式代理（消除跨域与国内直连障碍）
* 生产环境 Cloudflare Pages 边缘函数 functions/qa-api/[[path]].js 与本地开发服务器中间件（vite.config.ts）均已内置 /qa-api/* 流式透传（完整支持 text/event-stream 逐字流式输出）。
3. 三重自动保活机制（防止 Hugging Face 48 小时休眠）
* GitHub Actions 30 分钟定时巡检与自动重启：升级后的 hf-keepalive.mjs 与 .github/workflows/hf-keepalive.yml 每 30 分钟检查 bhrum108/sarva-dharani-kosa-buddhist-qa 运行状态；若检测到 SLEEPING / PAUSED / STOPPED 自动调用 Hub Restart API 唤醒，并访问纯 CPU 探针 GET /api/qa/health（0 秒 GPU 配额消耗，既永久保活又不损耗每日免费 GPU 时长）。
* 容器内自检协程：app.py 启动后内置 25 分钟异步自检心跳与语料索引常驻预热。
* 前端会话级预热信标：buddhistQaService.ts 在用户打开网页时即后台异步触发 /api/qa/health 保活预热。
四、新增与更新文件总表
项目路径
	操作类型
	说明与云端文件链接
	hf-buddhist-qa-space/app.py
	新增
	Hugging Face ZeroGPU + FastAPI + Gradio 流式佛经问答 API 服务端（app.py）
	hf-buddhist-qa-space/rag_corpus.py
	新增
	服务端 12 大数据库与 CBETA 全藏经混合 RAG 检索引擎（rag_corpus.py）
	hf-buddhist-qa-space/deploy_to_hf.py
	新增
	自动生成 Space 元数据并一键推送部署至 Hugging Face Spaces（deploy_to_hf.py）
	functions/qa-api/[[path]].js
	新增
	Cloudflare Pages /qa-api/* SSE 流式同源代理函数（[[path]].js）
	src/services/ai/sutraRagRetriever.ts
	新增
	前端全库（12库 + 2,482真言 + CBETA 27部类全藏经 + 当前经卷）深度检索器（sutraRagRetriever.ts）
	src/services/ai/buddhistQaService.ts
	新增
	前端 SSE 流式对话客户端、端点配置持久化与自动保活信标（buddhistQaService.ts）
	src/components/ai/BuddhistAiQaStudio.tsx
	新增
	佛经大模型 AI 问答工作台组件，支持原典证据展示与一键回跳阅读器（BuddhistAiQaStudio.tsx）
	src/styles/buddhistAiQa.css
	新增
	宣纸朱砂浅色 / 紫金写经深色双主题自适应 AI 工作台样式（buddhistAiQa.css）
	src/types/kosaTypes.ts
	更新
	扩展 ActiveWorkspaceTab 新增 'buddhist-ai'（kosaTypes.ts）
	src/main.tsx
	更新
	引入 buddhistAiQa.css 样式表（main.tsx）
	src/components/layout/Header.tsx
	更新
	顶部导航栏新增「佛经AI问答 · MITRA」标签页及全局搜索框一键转问 AI 按钮（Header.tsx）
	src/components/reader/DharaniReader.tsx
	更新
	在所有纯经文与含陀罗尼经典阅读页顶部新增「问佛经AI」联动按钮（DharaniReader.tsx）
	src/App.tsx
	更新
	挂载 BuddhistAiQaStudio 并贯通经典阅读器与 AI 引用卡片双向跳转（App.tsx）
	vite.config.ts
	更新
	新增本地开发与预览环境 /qa-api/* 流式代理中间件
	scripts/hf-keepalive.mjs & .github/workflows/hf-keepalive.yml
	更新
	将佛经问答 Space 纳入每 30 分钟自动唤醒与 0-GPU 保活体系（hf-keepalive.mjs、hf-keepalive.yml）
	package.json
	更新
	新增 deploy:qa-hf、qa:local 与 keepalive:hf 快捷命令（package.json）
	五、快速部署与本地运行步骤
1. 一键部署微调佛经大模型到 Hugging Face Spaces
pip install -U huggingface_hub
huggingface-cli login
npm run deploy:qa-hf

执行完毕后将自动在你的账号下创建并启动 bhrum108/sarva-dharani-kosa-buddhist-qa Space，暴露 /api/qa/health、/api/qa/search、/api/qa/chat 与 /v1/chat/completions 接口。
2. 启动网站前端并验证全库检索问答（无需安装任何新 npm 依赖）
h
npm install
npm run dev
npm run build



### 3. 启用自动保活


将更新后的代码推送至 GitHub 仓库（确保仓库 Secrets 已配置具有 Write 权限的 `HF_TOKEN`），`.github/workflows/hf-keepalive.yml` 即会自动每 30 分钟保活并在休眠时自动重启唤醒你的佛经问答 Space。
