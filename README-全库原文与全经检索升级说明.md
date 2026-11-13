梵音宝典 (Sarva-Dhāraṇī-Kośa) 全库原文直读与全藏经典统一检索升级说明
本升级包（sarva-dharani-kosa (全库原文与全经检索升级包)）针对主项目目录 sarva-dharani-kosa (原始目录)（已集成 sarva-dharani-kosa (分享功能代码包) 的扫码听音与海报分享能力）提供零新增 npm 依赖、严格 TypeScript（strict: true）兼容的增量覆盖升级。配套底层协议与验收细节可参阅同目录技术详单 ARCHITECTURE-十二库原文协议与检索升级技术详单.md。
一、核心升级能力总览
1. 全球十二大数据库与全藏经 100% 页面内嵌原文直读
* 服务与组件升级：新增统一多源原文加载引擎 universalSourceService.ts 与页面内嵌阅读面板 InlineOriginalTextPanel.tsx，升级多源协议定义 entrySources.ts 与全屏弹窗 OriginalFullTextModal.tsx。
* 多源文献覆盖：全面打通 CBETA 全藏经（27 部类）、GRETIL 梵文库、DB1 房山石经、DB2 大正藏悉昙部（T84）/梵汉字书（T54）/古译陀罗尼、DB3 尼泊尔 DSBC 双本与 GRETIL 扩充经典、DB4 84000 藏经 TEI XML、DB5 BuddhaNexus 分词梵文 JSON、DB6 SARIT TEI-P5 密续与因明论书、DB7 剑桥大学 CUDL 贝叶经与 Hidas 校勘本、DB8 奥斯陆大学 Polyglotta 四语对勘、DB9 维也纳大学 rKTs 德格版电子原卷、DB10 ALL-NIBS 梵文写本与尼瓦尔梵本、DB11 柏林 IDP / 维也纳 CEToM / 敦煌遗书（T85 与 ZW）、DB12 法国 ERC DHARMA 校勘本 / 牛津 OCHS 种子字辞典 / Muktabodha 密续文库的页面直接原文查看。
* 安全代理与降级机制：新增边缘安全代理 functions/source-proxy/[[path]].js 与本地开发中间件 vite.config.ts，解决 HTTP 混合内容拦截（如 DB9 rKTs、DB11 IDP）与跨域（CORS）限制，并在离线或远端不可达时自动回退至本地 public/data/tier1 与 public/data/tier23 语料快照。
2. 全量经典（含无陀罗尼纯经文与含陀罗尼经典）统一检索与阅读
* 引擎与服务优化：升级主搜索引擎 searchEngine.ts 与全藏经目录服务 canonLibraryService.ts，内置高频佛典简繁双向映射（支持简体检索如"金刚经""阿弥陀经""法华经""心经""鸠摩罗什""玄奘"直接命中繁体原藏经目），并在顶部导航栏 Header.tsx 搜索框与侧边栏 SidebarFilter.tsx 中合并检索陀罗尼库条目 + CBETA 全藏经目录（含全部无陀罗尼经律论），提供「全部 / 含陀罗尼 / 纯经文（无咒）」筛选开关。
* 十二库适配扩展：升级十二库适配器 twelve-databases-adapter.ts，将此前未映射的 DB2 T54 梵汉字书、DB3 GRETIL 扩充赞颂经论、DB4 84000 无咒纯经论卷目、DB11 CBETA 敦煌遗书（T85 古逸部与 ZW 藏外文献）全量纳入主站检索与原文直读体系。
3. 自适应双模式阅读器（"无咒纯经文"与"原文 + 陀罗尼同屏"自动切换）
* 架构解耦：升级核心阅读器 DharaniReader.tsx、主视图 App.tsx、全藏经书库 CanonLibrary.tsx 及大正藏密教部浏览器 TaishoCanonExplorer.tsx（彻底移除无咒经文曾注入占位测试咒句的旧逻辑）。
* 无陀罗尼经典（verses.length === 0）：自动隐藏所有陀罗尼专属 UI 栏目（包括本尊种子字印章、全咒同步跟诵按钮、发音方案切换、六体脚本控制栏、整篇六体汇总卡、逐句咒文卡片、MP3/WAV 导出、真言海报二维码分享以及底部全局音频播放栏 AudioPlayerBar），默认全幅展开原典经文全文阅读器（支持分卷切换、经文内关键字高亮检索、简繁阅读字号调节与复制）。
* 包含陀罗尼经典（verses.length > 0）：页面同时呈现原典全文阅读面板与完整陀罗尼六体对照、48kHz 梵音跟诵及海报扫码分享栏目，并可通过阅读器顶部视图模式切换（「原文 + 陀罗尼同屏」/「仅看原文」/「仅看陀罗尼」）自由调整布局。
二、升级包完整文件清单（共 19 个源码文件）
相对路径
	类型
	核心职责
	文件链接
	vite.config.ts
	修改
	新增本地开发 /hf-cdn/*、/canon/* 与 /source-proxy/* 多源原文代理中间件
	vite.config.ts
	functions/source-proxy/[[path]].js
	新增
	Cloudflare Pages Functions 生产环境白名单安全代理（解决 HTTP 混合内容与 CORS）
	[[path]].js
	scripts/build-canon-library.ts
	修改
	升级全藏经分片构建脚本，为每部经典写入精确 hasDharani 与 dharaniCount 元数据
	build-canon-library.ts
	scripts/build_cloud_corpus_shards.ts
	修改
	移除十二库分片截断限制，导出全量十二大数据库原始记录供离线原文回退
	build_cloud_corpus_shards.ts
	src/main.tsx
	修改
	引入原典全文内嵌阅读器样式表 originalReader.css
	main.tsx
	src/styles/originalReader.css
	新增
	内嵌原典阅读面板、卷次导航、全文检索高亮与多脚本排版样式
	originalReader.css
	src/core/sources/entrySources.ts
	修改
	扩展 EntrySourceRef 支持全部 12 大数据库协议、在线/代理/本地三级回退来源识别
	entrySources.ts
	src/services/sources/universalSourceService.ts
	新增
	统一原文获取与结构化解析服务（TEI-XML / HTML / JSON / YAML / 藏文 EWTS / 本地分片回退）
	universalSourceService.ts
	src/services/canon/canonLibraryService.ts
	修改
	修复 /hf-cdn/canon 路由优先级，新增佛典简繁双向检索归一与无咒经文合成条目转换
	canonLibraryService.ts
	src/core/search/searchEngine.ts
	修改
	修正 DB11/DB12 库键名，支持简繁统一检索、contentMode（全部/含咒/纯经文）过滤与全藏经联合搜索
	searchEngine.ts
	src/data/kosa-corpus/twelve-databases-adapter.ts
	修改
	补齐 DB2 T54 字书、DB3 GRETIL 扩充卷、DB4 84000 纯经文、DB11 敦煌遗书（T85/ZW）及全库原文摘录
	twelve-databases-adapter.ts
	src/components/reader/InlineOriginalTextPanel.tsx
	新增
	页面直接内嵌原文查看器（支持多来源切换、CBETA 分卷加载、原文内搜索、字号调节与全屏展开）
	InlineOriginalTextPanel.tsx
	src/components/reader/OriginalFullTextModal.tsx
	修改
	接入 universalSourceService 支持全十二库全屏原文阅读与一键复制
	OriginalFullTextModal.tsx
	src/components/reader/DharaniReader.tsx
	修改
	实现无陀罗尼经文纯净原文模式（隐藏全部陀罗尼/音频/海报栏目）与含陀罗尼经典"原文+真言同屏"双模式，完整保留二维码分享功能
	DharaniReader.tsx
	src/App.tsx
	修改
	贯通全站经文/真言统一检索打开流程，当浏览无陀罗尼纯经文时自动隐藏底部 AudioPlayerBar，完整兼容 ?dharani=...&autoplay=1 扫码播放
	App.tsx
	src/components/layout/Header.tsx
	修改
	升级顶部全局搜索下拉框，实时混排展示主库真言与 CBETA 全藏经经典（清晰标注「含陀罗尼」或「纯经文」）
	Header.tsx
	src/components/layout/SidebarFilter.tsx
	修改
	新增「全部内容 / 含陀罗尼 / 纯经文」筛选器，并在侧边栏直接展示匹配的全藏经无咒/含咒经卷
	SidebarFilter.tsx
	src/components/catalog/CanonLibrary.tsx
	修改
	新增「含陀罗尼 / 纯经文」筛选标签与「在主阅读器打开（原文+陀罗尼同屏 / 纯经文视图）」直达按钮
	CanonLibrary.tsx
	src/components/catalog/TaishoCanonExplorer.tsx
	修改
	移除无咒经典的虚拟占位梵咒逻辑，无咒经文直接进入纯原文阅读，含咒经文同步呈现原文与真言
	TaishoCanonExplorer.tsx
	三、一键合并与运行步骤
1. 从 Google Drive 下载升级包目录 sarva-dharani-kosa (全库原文与全经检索升级包)，解压后在终端将源码目录直接覆盖合并至本地项目根目录（若本地尚未合并二维码分享包，请先合并 sarva-dharani-kosa (分享功能代码包)，再执行本升级包覆盖）：


cp -R functions scripts src vite.config.ts /path/to/sarva-dharani-kosa/

2. 启动本地开发服务器并验证 TypeScript 编译与生产构建（无需安装任何新依赖）：


cd /path/to/sarva-dharani-kosa
npm run dev
npm run build

3. （可选）离线语料分片重生成：若本地备有完整 CBETA XML-P5 语料目录并希望更新 public/canon/catalog.json.gz 中的 hasDharani 精确统计或全量导出 public/data/tier1、public/data/tier23 离线快照，可执行：


npx tsx scripts/build_cloud_corpus_shards.ts
CBETA_DIR=/path/to/cbeta-xml-p5 npx tsx scripts/build-canon-library.ts

即使不重新运行离线脚本，前端运行时也会自动根据已知密教/含咒经号映射与卷内 <cb:dharani> 实时检测准确区分含咒经典与无咒纯经文。