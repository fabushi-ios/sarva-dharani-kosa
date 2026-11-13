十二库原文协议映射与验收测试详单
本文档为升级包 sarva-dharani-kosa (全库原文与全经检索升级包) 的配套架构参考，与主说明文档 README-全库原文与全经检索说明.md 配合使用。


一、十二大数据库及全藏经原文直读协议矩阵
通过 entrySources.ts、universalSourceService.ts 与边缘代理 functions/source-proxy/[[path]].js 的三级加载链路（在线直连 / 同源安全代理 -> /hf-cdn/canon 与 /canon 预编译分片 -> public/data/tier1 与 public/data/tier23 离线快照），全部语料库均可在页面内嵌面板 InlineOriginalTextPanel.tsx 中直接展开阅读：


库编号与名称
	原文数据格式
	页面内嵌解析策略
	无咒/含咒自适应处理
	CBETA 全藏经（27 部类）
	Gzip 分卷 JSON + GitHub TEI-P5 XML
	优先读取 /hf-cdn/canon 或 /canon 分卷全文（支持切换卷次），自动回退 CBETA XML-P5 解析
	无 <cb:dharani> 经典（如《金刚经》《阿弥陀经》）隐藏全部陀罗尼栏；含咒经典同屏展示原文与陀罗尼
	DB1 · 房山石经（F28n1071 等）
	CBETA XML-P5 + <cb:tt> 悉昙双行对音
	解析原卷汉译正文、行号、声韵夹注与 #SD-* 悉昙逐字对音，离线回退 db1_fangshan.json
	同屏显示石经原卷全文与六体陀罗尼对照
	DB2 · 大正藏悉昙部（T84）/ 字书（T54）/ 古译
	CBETA XML-P5 + Kanripo YAML
	自动解析 TEI XML 或 YAML 论书文本；新增 T54 字书整卷映射（twelve-databases-adapter.ts）
	T54 字书卷目以纯原文模式直读；古译陀罗尼与 T84 字门同屏展示原文与咒句
	DB3 · 尼泊尔 DSBC 与 GRETIL 梵典
	DSBC 双本网页（IAST + 天城文）/ GRETIL HTML
	通过 /source-proxy 拉取并清洗 HTML 正文段落，支持 GRETIL 261 部梵本与 108 赞扩充库
	纯梵文经论/赞颂自动隐藏陀罗尼栏；含咒品目同屏展示梵本全文与真言
	DB4 · 84000 藏文大藏经 TEI 库
	84000 Open TEI XML + 藏英平行句段
	解析 TEI <body/> 经文正文、藏文 Unicode、英译与校勘记，新增无咒甘珠尔/丹珠尔经目映射
	无咒经典自动进入纯经文阅读模式；含咒密续同屏显示 TEI 原文与独立真言
	DB5 · BuddhaNexus 分词梵文
	Segmented Sanskrit JSON（segnr + text）
	结构化渲染全部 [segnr] 梵文分词句段与题跋，支持原文关键字过滤
	同屏显示分词梵文原卷与陀罗尼句段
	DB6 · SARIT 印度学 TEI-P5
	SARIT TEI-P5 XML（含 <locus> 与校勘记）
	提取章节标题、颂文段落、写本叶码与校勘异文
	因明/文学专书（Pramāṇa / Kāvya）进入纯原文模式；密续专书同屏显示原文与金刚诵句段
	DB7 · 剑桥大学 CUDL 贝叶经与 Hidas 校勘
	CUDL Metadata JSON / TEI + Hidas 分段文本
	解析贝叶写本外交转写、子品目目录、馆藏题记与 Hidas 校勘全文
	同屏展示剑桥贝叶经原卷记录与校勘真言
	DB8 · 奥斯陆大学 Polyglotta 四语对勘
	多语平行对勘表（梵 / 藏 / 汉 / 英 / 于阗）
	将全卷平行证本按句段对齐渲染为多语对照原典全文
	同屏展示多语平行全文与逐句梵音对照
	DB9 · 维也纳大学 rKTs 德格版电子原卷
	德格版甘珠尔电子文本（http://www.rkts.org）
	经 /source-proxy 安全升级 HTTPS 拉取原卷全文，定位叶码上下文并附藏文 Unicode / EWTS
	同屏展示德格版电子原卷全文与还原梵音
	DB10 · ALL-NIBS 梵文写本与尼瓦尔梵本
	Asian Legacy Library JSON API + 外交转写
	解析叶码外交转写（@1a, @1b）与古典梵语校勘双轨文本
	纯经疏/赞颂写本隐藏陀罗尼栏；含咒写本同屏显示原卷与真言
	DB11 · 柏林 IDP / CEToM / 敦煌遗书（T85 & ZW）
	IDP XML / CEToM 残叶行号转写 / CBETA XML
	升级 HTTP 安全代理并新增 cbetaDunhuangRecords 全量映射
	无咒敦煌遗书与西域赞颂进入纯经文模式；含咒写卷同屏展示原文与陀罗尼
	DB12 · DHARMA / 牛津 OCHS / Muktabodha
	ERC DHARMA 纯文本 / OCHS 颂词库 / Muktabodha 梵本
	直接拉取全书梵文母本与 OCHS 全本颂词及种子字隐语释义
	同屏展示密续母本全文与心印真言
	

二、功能验收测试清单
1. 无陀罗尼经典检索与纯净阅读验证：
   1. 在顶部导航栏 Header.tsx 或侧边栏 SidebarFilter.tsx 输入简体词“金刚般若波罗蜜经”或“阿弥陀经”，切换「纯经文」筛选标签。
   2. 点击任一无陀罗尼经典进入主阅读器 DharaniReader.tsx：确认页面顶部标注「纯经文 · 原典直读」，页面内不显示种子字印章、全咒同步跟诵、发音方案、六体汇总卡、MP3/WAV 导出、二维码分享按钮及底部 AudioPlayerBar（App.tsx），且直接展开完整原卷正文、支持分卷切换与经文内搜索高亮。
2. 含陀罗尼经典“原文 + 陀罗尼”同屏验证：
   1. 搜索“心经”“大悲心陀罗尼”或任一全球十二库含咒条目（如 DB1 房山石经、DB4 84000、DB9 rKTs、DB12 STTS《金刚顶经》）。
   2. 确认阅读器默认处于「原文 + 陀罗尼同屏」模式，上方或切换栏可直接查看原库完整经文原文，下方完整保留六体对照、48kHz 梵音合成朗读与 9:16 竖版二维码海报分享功能。
3. 跨库代理与离线回退验证：
   1. 打开 DB9 维也纳 rKTs 或 DB11 柏林 IDP 条目，确认通过本地开发中间件（vite.config.ts）或生产环境 Pages Function（functions/source-proxy/[[path]].js）正常加载原文且无浏览器 Mixed Content / CORS 报错；断开外网时自动平滑回退至本地语料分片内容。


      const iastLines = splitIastIntoVerseLines(mantraText, 11);