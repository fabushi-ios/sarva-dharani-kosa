# 梵音宝典 · Sarva-Dhāraṇī-Kośa & 梵音 100% 全覆盖音译与发声引擎 v2.0

本项目汇集并完整实现了两个核心梵文陀罗尼工程：

1. **梵音宝典 · Sarva-Dhāraṇī-Kośa**（模块化 TypeScript + React 梵文陀罗尼数据库与 CBETA / GRETIL 权威文献对勘系统）
2. **梵音 100% 全覆盖音译与发声引擎 v2.0**（独立完整版 `sanskrit_phonetic_engine.html` 及内置于 React 应用的发音学院与编译器模块）

---

## 核心特性

### 1. 权威文献底层直连（CBETA & GRETIL）
- **CBETA 悉昙/兰札字库 (`cbeta_gaiji`)**：内置 2,240 条 `#SD-*` / `#RJ-*` 悉昙与兰札梵字 Unicode（`U+11580–U+115FF`）、天城体与 IAST 权威映射。
- **CBETA 大正藏 TEI-P5 (`xml-p5`)**：预打包 16 部核心唐密陀罗尼原典（含不空译 T19n0974B《大佛顶陀罗尼》470 组悉昙逐字对勘、T20n1113B《青颈观自在心陀罗尼》334 组悉昙对勘等共 1,008 组 `<cb:tt>` 字对），并内置 **《大正藏》密教部 T18–T21 全 573 部经典目录与实时 XML 解析器**。
- **哥廷根大学 GRETIL 梵文原典库 (`GRETIL-mirror`)**：整合 25 部核心大乘与密续梵文写本（含《般若心经》广本/略本、《金刚经》、《妙法莲华经》陀罗尼品、《金光明最胜王经》、《大孔雀明王经》、《圣救度母二十一礼赞经》等）。

### 2. 六维梵汉文字与双轨注音引擎
- **悉昙梵字 (Siddhaṃ)**：`U+11580` 区块实时渲染与 CBETA 原典 `<cb:tt>` 逐字对勘。
- **天城体 (Devanāgarī)**：支持元音附标（Mātrā）与复辅音去元音符号（Virāma `्`）双向无损转写。
- **国际梵文转写 (IAST) & 国际音标 (IPA)**：精确标注卷舌音、颚音、送气清浊音与长短元音。
- **双轨中文注音系统**：
  - **轨道 A（现代直拼谐音轨）**：依据现代普通话与粤/闽声韵母精确拟合梵文原音（如 `svāhā` → `斯哇哈`）。
  - **轨道 B（唐密佛经古音轨）**：还原玄奘、不空、善无畏三藏传统音译体系（如 `svāhā` → `娑婆诃`），彻底打通古今读音差异。

### 3. 三级递进梵音发声引擎（Web Speech API + Web Audio 共振峰合成）
1. **Level 1**：优先调用系统原装梵文/印地语男声语音包（`sa-IN` / `hi-IN`）。
2. **Level 2**：智能回退至多语种语音包并注入纯粹音标。
3. **Level 3**：内置零依赖 **Web Audio API 梵文音素共振峰合成器（Formant Synthesizer）**，模拟胸腔男低音基频（`118Hz–125Hz`）、五类辅音爆破/擦音包络与寺院钟磬泛音，在任何无语音包的浏览器中均可 100% 离线发声。

---

## 目录结构

```text
├── sanskrit_phonetic_engine.html         # 独立单文件版《梵音 100% 全覆盖音译与发声引擎 v2.0》
├── public/sanskrit_phonetic_engine.html  # 静态资源镜像（可在应用顶部一键新窗口打开）
├── scripts/
│   └── fetch-authoritative-data.mjs      # CBETA (cbeta_gaiji + xml-p5) 与 GRETIL 数据抓取及编译脚本
├── data/raw/                             # 抓取自 CBETA 与 GRETIL 的权威原始 JSON/XML/HTML 数据
└── src/
    ├── types/dharani.ts                  # 核心数据结构定义
    ├── core/
    │   ├── transliterator.ts             # IAST ↔ 天城体 ↔ 悉昙体 ↔ IPA ↔ 双轨汉字注音核心算法
    │   ├── prosody.ts                    # 梵文轻重音律 (Laghu / Guru / Mātrā) 分析器
    │   └── searchEngine.ts               # 多文字归一化模糊检索引擎
    ├── services/
    │   ├── sanskritAudioEngine.ts        # 三级递进梵音发声与 WebAudio 共振峰合成引擎
    │   ├── cbeta/cbetaLiveService.ts     # 大正藏密教部 573 部经典实时 CBETA XML 解析服务
    │   └── storageService.ts             # 个人经匣与收藏持久化服务
    ├── data/
    │   ├── generated/                    # 由权威原始数据自动生成的 TypeScript 数据库
    │   └── corpus/                       # 四大核心大藏经陀罗尼分卷语料库
    └── components/                       # 模块化 React 界面组件
```

---

## 本地运行与构建

```bash
# 安装依赖
npm install

# 重新从 CBETA & GRETIL 官方仓库同步并编译权威原始数据（可选，仓库已内置生成结果）
npm run sync-data

# 启动开发服务器
npm run dev

# 生产环境类型检查与构建
npm run build
```
