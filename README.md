---
title: 梵音宝典 · Sarva-Dhāraṇī-Kośa (48kHz Sanskrit Neural VITS)
emoji: 🪷
colorFrom: amber
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

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

### 3. 全球 12 大梵文陀罗尼与密教原典权威数据库全量接入 (`src/data/` & `public/data/`)
除原有的 **CBETA 悉昙/兰札字库 (`cbeta_gaiji`)**、**CBETA 大正藏密教部 (`T18–T21`)** 与 **哥廷根大学 GRETIL 梵文库** 外，系统已完整接入全球 **12 大国际权威梵文陀罗尼与密教原典数据库**：

| 编号 | 梯队 | 数据库名称 | 权威机构 / 馆藏来源 | 核心收录内容 |
| :--- | :--- | :--- | :--- | :--- |
| `db1_fangshan` | Tier 1 | **房山石经《释教最上乘秘密藏陀罗尼集》** | 房山云居寺石经山（辽金刻石 30 卷） | 金代觉苑、通理大师依梵夹重校 **788–831 首陀罗尼**，存留大量《大正藏》失载孤本真言与辽金汉字注音 |
| `db2_bds_thesaurus` | Tier 1 | **BDS / TLB 佛学多语陀罗尼平行语料库** | 挪威奥斯陆大学 (Jens Braarvig) & 德国哥廷根科学院 | **梵 (IAST) · 藏 (Wylie) · 汉 · 英** 四语逐句平行对齐（《心经》《大悲咒》《楞严咒》《尊胜》《宝箧印》等） |
| `db3_sarvavid` | Tier 1 | **Sarvavid 密教汉梵陀罗尼构拟音韵库** | 汉梵历史音韵对勘库 (Baxter-Sagart / 切韵 / 悉昙对音) | 玄奘、不空、法天、施护、法贤、金总持等历代译师音译陀罗尼之中古汉语 (`MC`) ↔ 梵文 (`IAST`) 历史语音构拟 |
| `db4_dsbc_naritasan` | Tier 1 | **DSBC 西亚山大学 & 日本成田山《陀罗尼字典》** | 尼泊尔纳嘉宗佛学院 (DSBC) & 成田山佛教学研究所 | 尼泊尔现存 116 部大乘陀罗尼经集（*Dhāraṇīsaṃgraha*）及密教全本真言词典与出处索引 |
| `db5_cudl_pauli` | Tier 2 | **剑桥大学图书馆 (CUDL) 尼泊尔梵文贝叶经特藏** | University of Cambridge Digital Library | 9–12 世纪帕拉王朝贝叶经写本（`MS Add.1346` 尊胜陀罗尼、`MS Add.1645` 随求、`MS Add.1706` 孔雀明王）叶面抄本转写 |
| `db6_idp_stein` | Tier 2 | **国际敦煌项目 (IDP) 梵藏汉密教写卷数据库** | 大英图书馆 / 法国国家图书馆 (Stein & Pelliot) | 敦煌莫高窟藏经洞出土于阗文、粟特文、藏文注音梵文陀罗尼及悉昙字轮写卷（`Pelliot sanskrit` / `IOL San` / `S.2498`） |
| `db7_sat_dzk` | Tier 2 | **东京大学 SAT 大正新修大藏经 & 图像部** | 东京大学人文情报学 (SAT Taishō Shinshū Daizōkyō) | 《大正藏》第 18–21 卷密教部全卷索引及图像部（曼荼罗、尊像印契、悉昙梵字真言位图） |
| `db8_buda_rkts` | Tier 2 | **BUDA (BDRC) 佛教数字资源中心 & RKTS 甘露藏** | 维也纳大学 RKTS & BDRC | 藏文《甘珠尔·秘密部 (`rgyud 'bum`)》及《陀罗尼集部 (`gzungs 'bum`)》藏转梵音（`Tibetan Sanskrit Transliteration`）对勘 |
| `db9_foguang_dharani` | Tier 3 | **《佛光大辞典》&《中华佛教百科全书》真言库** | 佛光山文教基金会 / 中华电子佛典 | 常用与罕见真言之教理源流、修法仪轨、三密相应观想、手印（Mudrā）与功德释义 |
| `db10_bija_mandala` | Tier 3 | **日本真言宗/天台宗两部曼荼罗种子字谱 (`Bīja-maṇḍala`)** | 东密高野山 & 台密比叡山悉昙传流 | 胎藏界（中台八叶院等）与金刚界（成身会三十七尊）诸尊梵字种子字、三摩耶形、真言与本誓 |
| `db11_sanskrit_lexicon` | Tier 3 | **科隆大学数字梵文词典群 (Cologne Digital Lexicon)** | 德国科隆大学 (MW / Edgerton BHS / Pāṇini) | Monier-Williams 梵英词典与 Edgerton《佛教混合梵语词典》密教特有的呼格（`-e`/`-i`）、祈使语气与破格语法解析 |
| `db12_muktabodha_ochs` | Tier 3 | **Muktabodha 印度学数字图书馆 & 牛津 OCHS 密续库** | Muktabodha Indological Library & Oxford Centre | 印度教—佛教早期共享密续（*Kriyā* / *Caryā* / *Yoginī*）咒语结构、护摩仪轨与咒语语法规则 |

---

## 六大核心交互工作台 (`src/components/`)

1. **多体梵音陀罗尼精校阅读器 (`MultiScriptDharaniReader.tsx`)**：四体同步渲染（悉昙 `U+11580` / 天城体 / IAST / 汉译）、Guru (`—`) & Laghu (`⏑`) 诗律节拍标记、Web Audio 48kHz 梵音吟诵及 CBETA/GRETIL 权威文献溯源弹窗。
2. **全球 12 大梵文陀罗尼数据库总览中心 (`DatabaseHubExplorer.tsx`)**：按 Tier 1/2/3 梯队、传承流派与文种筛选浏览 12 大国际数据库，支持跨库联合全文检索与 JSON/CSV 学术导出。
3. **房山石经 × 大正藏梵汉逐字对勘工作台 (`FangshanTaishoInterlinearStudio.tsx`)**：辽金房山石经《释教最上乘秘密藏陀罗尼集》与《大正藏》密教部对勘，集成 **Sarvavid 中古汉语 (`MC`) ↔ 梵文 (`IAST`) 历史音韵构拟卡片**与科隆 BHS 语法解析。
4. **梵·藏·汉·英四语平行语料与甘珠尔对勘台 (`ConcordanceParallelStudio.tsx`)**：BDS/TLB 四语逐句平行对齐、BUDA/RKTS《甘珠尔·秘密部》藏转梵音对勘，以及内置 Levenshtein 音节级自动校勘矩阵。
5. **剑桥贝叶经 (CUDL) & 敦煌写卷 (IDP) 数字化工作台 (`CudlPalmLeafViewer.tsx`)**：帕拉王朝贝叶经（`MS Add.1346/1645/1706`）叶面行号逐行转写与敦煌藏经洞（`Pelliot` / `Stein`）悉昙写卷文献元数据检视。
6. **悉昙五十音摩多体文 & 两部曼荼罗种子字学院 (`SiddhamBijaAcademy.tsx`)**：悉昙 16 摩多 + 34 体文发音部位矩阵、两部曼荼罗（胎藏界/金刚界）诸尊梵字种子字谱，以及实时四体 + 韵律沙盒编译器。

---

## 本地运行、CLI 与自动化测试

```bash
# 1. 启动前端开发服务器 (:5173)
npm install
npm run dev

# 2. (可选) 启动 48kHz 梵文神经语音后端服务 (:8765)
python3 backend/tts_server.py

# 3. 命令行检索与对勘工具 (kosa-cli)
npm run cli -- --list-dbs
npm run cli -- --search "avalokiteśvara"
npm run cli -- --concordance "oṃ maṇi padme hūṃ"

# 4. 生产环境类型检查与构建
npm run build

# 5. 运行全套单元测试 (74 tests) 与 5 级 Playwright 端到端测试 (228 tests)
npm run test:unit
npm run test:e2e
```

