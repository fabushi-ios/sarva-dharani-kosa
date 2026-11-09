# 梵音宝典 · Sarva-Dhāraṇī-Kośa & 梵音 100% 全覆盖音译与发声引擎 v3.0 (48kHz 原生梵文神经网络版)

本项目汇集并完整实现了两大梵文陀罗尼工程，并全面集成了 **方案 1（原生古典梵文神经网络 VITS 模型引擎）** 与 **方案 3（预生成 48,000 Hz 悉昙 34×14 矩阵及陀罗尼高频音节真人级神经采样库）**：

1. **梵音宝典 · Sarva-Dhāraṇī-Kośa**（模块化 TypeScript + React 梵文陀罗尼数据库与 CBETA / GRETIL 权威文献对勘系统）
2. **梵音 100% 全覆盖音译与发声引擎 v3.0**（独立完整版 `sanskrit_phonetic_engine.html` 及内置于 React 应用的悉昙发音学院与四体编译器模块）

---

## 核心特性

### 1. 方案 1：原生古典梵文神经网络 VITS 48kHz 发声引擎 (`models/ninada/` & `backend/`)
- **多模型古典梵文 ONNX 推理底座 (`models/ninada/`)**：
  - 内置基于 IIT Madras（印度理工学院）古典梵文真人学者朗读语料库训练的 `ai4bharat/Rasa` 与 `facebook/mms-tts-san` 古典梵文（`sa`）VITS ONNX 模型矩阵（含 `sa.onnx` 24kHz 浑厚男声、`sa_female.onnx` 24kHz 清亮女声、`onnx_mobile/` 端侧高速模型及 16kHz MMS-TTS 梵文专训模型）。
- **声明学（Śikṣā）防吞音预处理与 48kHz 声学 DSP (`backend/sanskrit_tts_engine.py`)**：
  - **彻底根除印地语吞短元音 `a`（Schwa Deletion）**：自动执行古典梵文音节显式保护（如 `dharma` → `da-rma`、`buddha` → `bu-dDa`、`padme` → `pa-dme`、`namaḥ` → `na-maH`），100% 保留词中与词尾短元音 `a`。
  - **特殊二合音、止韵与随韵精准还原**：真实还原 `jñ` `[dʑɲa]`、`kṣ` `[kʂa]`，显式展开词尾止韵 `ḥ`（Visarga）呼气回响，并按后接辅音五类发音部位执行随韵 `ṃ`（Anusvāra）同部位鼻音同化（`ṅ / ñ / ṇ / n / m`）。
  - **48,000 Hz 线性相位升采样与诗律包络**：经 `scipy.signal.resample_poly` 升采样至 **48,000 Hz**，配合去直流滤波、余弦包络、`-1.0 dBFS` 峰值归一化以及 Guru（`—` 2拍）/ Laghu（`⏑` 1拍）音节时长控制，输出帧级精度的 `syllableTimings` 同步高亮时间戳。
- **FastAPI 语音与静态音频服务 (`backend/tts_server.py`, `:8765`)**：
  - 提供 `GET /api/health`、`POST/GET /api/tts`、`GET /api/syllable/{slp1}` 及支持 HTTP Range 的 `/audio/*` 静态音频流。

### 2. 方案 3：预生成 48,000 Hz 悉昙 34×14 矩阵 & 陀罗尼高频音节神经采样库 (`public/audio/`)
- **全量离线构建管线 (`scripts/build_sanskrit_audio_sprite.py`)**：
  - 生成 `public/audio/siddham_sprite_48k.wav`（48kHz 16-bit PCM，总长 `251.50s`）、`public/audio/siddham_sprite_48k.ogg`（48kHz Opus 高清压缩包）与索引清单 `public/audio/siddham_sprite_manifest.json`。
  - **收录 675 个独立 48kHz 真人级神经音节切片**：
    - `16` 个独立摩多韵母（`a..O, aM, aH`）
    - `476` 个悉昙 `34 辅音 × 14 元音` 全矩阵音节（`ka..La` 至 `kau..Lau`）
    - `34` 个纯辅音半音（Virāma `k्..L्`，带真实塞音爆破窗口）
    - `68` 个随韵/止韵复合音节（`CaM / CaH`）
    - `28` 个核心陀罗尼种子字（`oM, hUM, hrIH, svA, hA, pra, jYA, kza, SrI, BUH` 等）与 `53` 个经咒高频闭音节/复辅音音节（`kArt, snye, pad, bud, Dar, sam, yak` 等）。
  - **100% 淘汰旧版 `136.1Hz` 锯齿波电子合成器**：点击任意音节卡片或五十音表时，直接通过 Web Audio `AudioBuffer` 0 延迟播放 48kHz 真人级神经采样。

### 3. 权威文献底层直连（CBETA & GRETIL）
- **CBETA 悉昙/兰札字库 (`cbeta_gaiji`)**：内置 `#SD-*` / `#RJ-*` 悉昙与兰札梵字 Unicode（`U+11580–U+115FF`）、天城体与 IAST 权威映射。
- **CBETA 大正藏 TEI-P5 (`xml-p5`)**：内置唐代不空/菩提流志原典 `<cb:tt>` 悉昙梵汉逐字对音及《大正藏》密教部 `T18–T21` 经轨索引与实时 XML 解析器。
- **哥廷根大学 GRETIL 梵文原典库 (`GRETIL-mirror`)**：整合现存大乘与密续梵文贝叶经校勘定本。

---

## 目录结构

```text
├── sanskrit_phonetic_engine.html            # 独立单文件版《梵音 100% 全覆盖音译与发声引擎 v3.0》
├── public/
│   ├── sanskrit_phonetic_engine.html        # 静态资源镜像
│   └── audio/                               # 方案 3 预生成 48kHz 675 音节神经采样库
│       ├── siddham_sprite_48k.ogg
│       ├── siddham_sprite_48k.wav
│       └── siddham_sprite_manifest.json
├── models/ninada/                           # 方案 1 古典梵文 VITS ONNX 模型矩阵 (男声/女声/端侧)
├── backend/                                 # 方案 1 梵文 Śikṣā 声学引擎与 FastAPI 服务 (:8765)
│   ├── sanskrit_tts_engine.py
│   └── tts_server.py
├── scripts/
│   ├── build_sanskrit_audio_sprite.py       # 方案 3 48kHz 悉昙音节采样构建脚本
│   └── fetch-authoritative-data.mjs         # CBETA & GRETIL 权威数据同步脚本
├── src/                                     # 梵音宝典 5 层模块化前端源码 (React + TypeScript)
│   ├── types/dharani.ts
│   ├── core/                                # 梵文转写、音节诗律 (Guru/Laghu) 与跨文种检索
│   ├── services/
│   │   ├── audio/sanskritAudioEngine.ts     # 方案 1 + 方案 3 双轨 48kHz 神经音频服务
│   │   ├── cbetaLiveService.ts
│   │   └── storageService.ts
│   ├── data/                                # 权威生成数据与分部陀罗尼语料库
│   └── components/                          # 模块化阅读器、声明学教室、编译器与同步播放栏
└── tests/                                   # 164 项单元测试与 5 级端到端自动化验证套件
```

---

## 本地运行与构建

```bash
# 1. 启动方案 1 + 方案 3 48kHz 梵文神经语音后端服务 (:8765)
python3 backend/tts_server.py

# 2. 安装前端依赖并启动开发服务器 (:5173, 自动代理 /api 与 /audio)
npm install
npm run dev

# 3. 生产环境类型检查与构建
npm run build

# 4. 运行自动化测试套件 (164 tests)
pytest tests/unit/
python3 tests/e2e/run_e2e_tests.py
```
