import type { ActiveWorkspaceTab, DharaniCategoryId, DharaniEntry } from '../../types/kosaTypes';
import type { TaishoMikkyoFileEntry } from '../../data/kosa-generated/taishoMikkyoIndex';
import { stripDiacritics } from '../sanskrit/transliterator';
import { devanagariToSlp1, siddhamUnicodeToSlp1, slp1ToIast } from '../transliterator';

export interface SearchFilterOptions {
  query: string;
  categoryId: DharaniCategoryId | 'all';
  onlyBookmarked: boolean;
  bookmarkedIds: Set<string>;
  sourceFilter: 'all' | 'global-12db' | 'cbeta-siddham' | 'gretil-sanskrit';
}

export interface SearchSuggestionItem {
  kind: 'canon-entry' | 'taisho-scripture' | 'global-12db-hit';
  entry?: DharaniEntry;
  taishoScriptureId?: string;
  targetTab?: ActiveWorkspaceTab;
  titleZh: string;
  taishoNo: string;
  matchTypeLabel: string;
  matchedVerseId?: string;
  matchedVerseIndex?: number;
  snippetPrimary: string;
  snippetSecondary: string;
}

const TRAD_SIMP_BUDDHIST_PAIRS: string[] = [
  // Buddhist transliteration & Fangshan/Dunhuang/CBETA variant characters
  '毘毗', '盧卢', '變变', '經经', '說说', '誦诵', '攝摄', '蓮莲', '華华', '會会',
  '攞罗', '廣广', '儀仪', '軌轨', '養养', '羅罗', '標标', '幟帜', '龍龙', '記记',
  '隨随', '門门', '頂顶', '勝胜', '薩萨', '觀观', '聖圣', '礙碍', '㝵碍', '呪咒',
  '剛刚', '輪轮', '寶宝', '篋箧', '樓楼', '閣阁', '祕秘', '藥药', '師师', '無无',
  '壽寿', '決决', '準准', '葉叶', '羂罥', '馬马', '頭头', '穢秽', '跡迹', '烏乌',
  '樞枢', '芻刍', '軍军', '閻阎', '愛爱', '動动', '歡欢', '雙双', '堅坚', '辯辩',
  '熾炽', '災灾', '難难', '滅灭', '業业', '淨净', '彌弥', '閼閦', '閦閦', '虛虚',
  '聞闻', '賢贤', '釋释', '鉢钵', '囉啰', '謨谟', '馱驮', '䭾驮', '駄驮', '滿满',
  '願愿', '莊庄', '嚴严', '傘伞', '蓋盖', '迴回', '壞坏', '諸诸', '眾众', '衆众',
  '離离', '惡恶', '獄狱', '瓔璎', '陁陀', '櫱蘖', '蘗蘖', '讚赞', '禮礼', '歸归',
  '靈灵', '驗验', '義义', '韋韦', '濕湿', '爍烁', '奧奥', '圓圆', '辭辞', '劍剑',
  '橋桥', '陸陆', '維维', '納纳', '總总', '揔总', '護护', '國国', '發发', '開开',
  '壇坛', '懺忏', '𡰱尼', '𤚥吽', '嚩缚', '縛缚', '鎖锁', '鈴铃', '鉤钩', '鬘鬘',
  // Full coverage of DB1 Fangshan + DB2 Taisho + Chinese Buddhist canon Traditional chars
  '來来', '雜杂', '譯译', '聲声', '語语', '視视', '惱恼', '瘧疟', '熱热', '請请',
  '兒儿', '讀读', '結结', '帶带', '賊贼', '雲云', '繫系', '乾干', '穀谷', '種种',
  '絕绝', '腫肿', '燒烧', '應应', '現现', '顛颠', '體体', '覺觉', '縮缩', '癩癞',
  '傷伤', '氣气', '處处', '過过', '禪禅', '見见', '從从', '盡尽', '敵敌', '嚙啮',
  '讇谄', '諂谄', '燋焦', '瘡疮', '腳脚', '闇暗', '鈍钝', '轉转', '聾聋', '竈灶',
  '厭厌', '癰痈', '蟲虫', '齒齿', '癭瘿', '膿脓', '騶驺', '斷断', '還还', '著着',
  '夢梦', '復复', '時时', '與与', '進进', '證证', '縷缕', '蘇苏', '飢饥', '餓饿',
  '樂乐', '擲掷', '涼凉', '曇昙', '讖谶', '調调', '曠旷', '濟济', '須须', '積积',
  '邊边', '財财', '爾尔', '貴贵', '銀银', '陳陈', '勸劝', '鳩鸠', '琉璃', '璃璃',
  // General Traditional -> Simplified Chinese coverage
  '萬万', '與与', '專专', '東东', '絲丝', '兩两', '喪丧', '個个', '豐丰', '臨临',
  '為为', '麗丽', '舉举', '麼么', '久久', '義义', '樂乐', '習习', '鄉乡', '書书',
  '買买', '亂乱', '爭争', '於于', '虧亏', '亞亚', '產产', '畝亩', '親亲', '褻亵',
  '億亿', '僅仅', '僕仆', '從从', '侖仑', '倉仓', '儀仪', '們们', '價价', '眾众',
  '優优', '夥伙', '傘伞', '偉伟', '傳传', '傷伤', '倀伥', '倫伦', '傖伧', '偽伪',
  '佇伫', '體体', '餘余', '傭佣', '僉佥', '俠侠', '侶侣', '僥侥', '偵侦', '側侧',
  '僑侨', '儈侩', '儕侪', '儂侬', '俁俣', '儔俦', '儼俨', '倆俩', '儷俪', '儉俭',
  '債债', '傾倾', '傯偬', '僂偻', '僨偾', '償偿', '儻傥', '儐傧', '儲储', '儺傩',
  '兒儿', '兌兑', '兗兖', '黨党', '蘭兰', '關关', '興兴', '茲兹', '養养', '獸兽',
  '囅冁', '內内', '岡冈', '冊册', '寫写', '軍军', '農农', '塚冢', '馮冯', '沖冲',
  '決决', '況况', '凍冻', '淨净', '淒凄', '涼凉', '凌凌', '減减', '湊凑', '凜凛',
  '幾几', '鳳凤', '鳧凫', '憑凭', '凱凯', '擊击', '鑿凿', '芻刍', '劃划', '劉刘',
  '則则', '剛刚', '創创', '刪删', '別别', '剄刭', '剎刹', '劊刽', '劌刿', '剴剀',
  '劑剂', '剮剐', '劍剑', '剝剥', '劇剧', '勸劝', '辦办', '務务', '勱劢', '動动',
  '勵励', '勁劲', '勞劳', '勢势', '勳勋', '猛猛', '勦剿', '勻匀', '匭匦', '匱匮',
  '區区', '醫医', '華华', '協协', '單单', '賣卖', '盧卢', '滷卤', '臥卧', '衛卫',
  '卻却', '巹卺', '廠厂', '廳厅', '歷历', '厲厉', '壓压', '厭厌', '厙厍', '廁厕',
  '廂厢', '厴厣', '廈厦', '廚厨', '廄厩', '廝厮', '縣县', '參参', '靉靆', '雙双',
  '發发', '變变', '敘叙', '疊叠', '隻只', '臺台', '葉叶', '號号', '嘆叹', '嘰叽',
  '籲吁', '後后', '嚇吓', '呂吕', '嗎吗', '噸吨', '聽听', '啟启', '吳吴', '嘸呒',
  '囈呓', '嘔呕', '嚦呖', '唄呗', '員员', '咼咼', '嗆呛', '嗚呜', '詠咏', '咔咔',
  '嚨咙', '嚀咛', '噝咝', '響响', '啞哑', '噠哒', '嘵哓', '嗶哔', '噦哕', '嘩哗',
  '噲哙', '嚌啐', '噥哝', '喲哟', '嘜唛', '嗊唝', '嘮唠', '啢唡', '嗩唢', '唕唕',
  '喚唤', '嘖啧', '嗇啬', '囀啭', '齧啮', '囉啰', '嘽啴', '嘯啸', '噴喷', '嘍喽',
  '嚳喾', '囁嗫', '團团', '園园', '困困', '囪囱', '圍围', '圇囵',
  '國国', '圖图', '圓圆', '聖圣', '壙圹', '場场', '壞坏', '塊块', '堅坚', '壇坛',
  '壢坜', '壩坝', '塢坞', '墳坟', '墜坠', '壟垄', '壚垆', '壘垒', '墾垦', '坰坰',
  '堊垩', '墊垫', '埡垭', '墶垯', '墁墁', '塏垲', '堖垴', '塒埘', '塤埙', '堝埚',
  '墊垫', '塹堑', '墮堕', '墑墒', '牆墙', '壯壮', '聲声', '殼壳', '壺壶', '處处',
  '備备', '復复', '夠够', '頭头', '誇夸', '夾夹', '奪夺', '奩奁', '奐奂', '奮奋',
  '獎奖', '奧奥', '妝妆', '婦妇', '媽妈', '嫵妩', '嫗妪', '媯妫', '姍姗', '婁娄',
  '婭娅', '嬈娆', '嬌娇', '孌娈', '娛娱', '媧娲', '嫻娴', '嬰婴', '嬋婵', '嬸婶',
  '媼媪', '嫋袅', '嬪嫔', '嬤嬷', '孫孙', '學学', '孿孪', '寧宁', '寶宝', '實实',
  '寵宠', '審审', '憲宪', '宮宫', '寬宽', '賓宾', '寢寝', '對对', '尋寻', '導导',
  '壽寿', '將将', '爾尔', '塵尘', '嘗尝', '堯尧', '尷尴', '屍尸', '盡尽', '層层',
  '屜屉', '屆届', '屬属', '屢屡', '屨屦', '嶼屿', '歲岁', '豈岂', '嶇岖', '崗岗',
  '峴岘', '嵐岚', '島岛', '嶺岭', '崠岽', '巋岿', '嶧峄', '峽峡', '嶢峣', '嶠峤',
  '崢峥', '巒峦', '巔巅', '巖岩', '帥帅', '師师', '幃帏', '帳帐', '幟帜', '帶带',
  '幀帧', '席席', '幫帮', '幬帱', '幘帻', '幗帼', '冪幂', '廣广', '慶庆', '廬庐',
  '廡庑', '庫库', '應应', '廟庙', '龐庞', '廢废', '廩廪', '開开', '異异', '棄弃',
  '弒弑', '張张', '彌弥', '弳弪', '彎弯', '彈弹', '強强', '歸归', '當当', '錄录',
  '彥彦', '徹彻', '徑径', '徠徕', '憶忆', '懺忏', '憂忧', '愾忾', '懷怀', '態态',
  '慫怂', '憮怃', '慪怄', '悵怅', '愴怆', '憐怜', '總总', '懟怼', '懌怿', '戀恋',
  '懇恳', '惡恶', '慟恸', '懨恹', '愷恺', '惻恻', '惱恼', '惲恽', '悅悦', '愨悫',
  '懸悬', '慳悭', '憫悯', '驚惊', '懼惧', '慘惨', '懲惩', '憊惫', '愜惬', '慚惭',
  '憚惮', '慣惯', '惰惰', '慍愠', '憤愤', '憒愦', '願愿', '懾慑', '懣懑', '懶懒',
  '懍懔', '戇戆', '戲戏', '戧戗', '戰战', '戩戬', '戶户', '撲扑', '扦扦', '執执',
  '擴扩', '捫扪', '掃扫', '揚扬', '擾扰', '撫抚', '拋抛', '摶抟', '摳抠', '掄抡',
  '搶抢', '護护', '報报', '擔担', '擬拟', '攏拢', '揀拣', '擁拥', '攔拦', '擰拧',
  '撥拨', '擇择', '掛挂', '摯挚', '攣挛', '掗挜', '撾挝', '撻挞', '挾挟', '撓挠',
  '擋挡', '撟挢', '掙挣', '擠挤', '揮挥', '撏挦', '撈捞', '損损', '撿捡', '換换',
  '搗捣', '據据', '擄掳', '摑掴', '擲掷', '撣掸', '摻掺', '摜掼', '揸揸', '攬揽',
  '撳揿', '攙搀', '擱搁', '摟搂', '攪搅', '攜携', '攝摄', '攄摅', '擺摆', '搖摇',
  '擯摈', '攤摊', '攖撄', '撐撑', '攆撵', '擷撷', '擼撸', '攛撺', '擻擞', '攢攒',
  '敵敌', '斂敛', '數数', '齋斋', '斕斓', '斬斩', '斷断', '無无', '舊旧', '時时',
  '曠旷', '暘旸', '曇昙', '晝昼', '曨昽', '顯显', '晉晋', '曬晒', '曉晓', '曄晔',
  '暈晕', '暉晖', '暫暂', '曖暧', '札札', '術术', '朱朱', '樸朴', '機机', '殺杀',
  '雜杂', '權权', '條条', '來来', '楊杨', '榪杩', '傑杰', '極极', '構构', '樅枞',
  '樞枢', '棗枣', '櫪枥', '梘', '棖枨', '槍枪', '楓枫', '梟枭', '櫃柜', '檸柠',
  '檉柽', '梔栀', '柵栅', '標标', '棧栈', '櫛栉', '櫳栊', '棟栋', '櫨栌', '櫟栎',
  '欄栏', '樹树', '棲栖', '樣样', '欒栾', '桊棬', '樁桩', '夢梦', '檢检', '欞棂',
  '槨椁', '櫝椟', '槧椠', '欏椤', '橢椭', '樓楼', '欖榄', '櫬榇', '櫚榈', '櫸榉',
  '檟槚', '檻槛', '檳槟', '櫧槠', '橫横', '檣樯', '櫻樱', '樵樵', '櫥橱', '櫓橹',
  '櫞橼', '檐檐', '檁檩', '歡欢', '歟欤', '歐欧', '殲歼', '歿殁', '殤殇', '殘残',
  '殞殒', '殮殓', '殫殚', '殯殡', '毆殴', '毀毁', '轂毂', '畢毕', '斃毙', '氈毡',
  '毿毵', '氌氇', '氣气', '氫氢', '氬氩', '氳氲', '匯汇', '漢汉', '汙污', '湯汤',
  '洶汹', '決决', '溝沟', '沒没', '灃沣', '漚沤', '瀝沥', '淪沦', '滄沧', '溈沩',
  '滬沪', '濘泞', '淚泪', '澩泶', '瀧泷', '瀘泸', '濼泺', '瀉泻', '潑泼', '澤泽',
  '涇泾', '潔洁', '灑洒', '窪洼', '浹浃', '淺浅', '漿浆', '澆浇', '湞浈', '濁浊',
  '測测', '澮浍', '濟济', '瀏浏', '滻浐', '渾浑', '滸浒', '濃浓', '潯浔', '濤涛',
  '澇涝', '淶涞', '漣涟', '潿涠', '渦涡', '渙涣', '滌涤', '潤润', '澗涧', '漲涨',
  '澀涩', '淵渊', '淥渌', '漬渍', '瀆渎', '漸渐', '澠渑', '漁渔', '瀋渖', '滲渗',
  '溫温', '灣湾', '濕湿', '潰溃', '濺溅', '漵溆', '潙沩', '滾滚', '滯滞', '灄滠',
  '滿满', '瀅滢', '濾滤', '濫滥', '灤滦', '濱滨', '灘滩', '澦滪', '灕漓', '漣涟',
  '滅灭', '燈灯', '灰灰', '靈灵', '災灾', '燦灿', '煬炀', '爐炉', '燉炖', '煒炜',
  '熗炝', '點点', '煉炼', '熾炽', '爍烁', '爛烂', '烴烃', '燭烛', '煙烟', '煩烦',
  '燒烧', '燁烨', '燴烩', '燙烫', '燼烬', '熱热', '煥焕', '燜焖', '燾焘', '愛爱',
  '爺爷', '牘牍', '牽牵', '犧牺', '犢犊', '狀状', '獁犸', '猶犹', '狽狈', '獰狞',
  '獨独', '狹狭', '獅狮', '獪狯', '猙狰', '獄狱', '猻狲', '獵猎', '獼猕', '玀猡',
  '豬猪', '貓猫', '獻献', '獺獭', '璣玑', '璵玙', '玚', '瑪玛', '瑋玮', '環环',
  '現现', '瑲玱', '璽玺', '璫珰', '琺珐', '瓏珑', '瓔璎', '瓊琼', '璉琏', '璦瑷',
  '璿璇', '瓔璎', '瓚瓒', '甕瓮', '甌瓯', '電电', '畫画', '暢畅', '畬畲', '疇畴',
  '癤疖', '療疗', '瘧疟', '癘疠', '瘍疡', '疿痱', '癡痴', '瘋疯', '瘍疡', '瘓痪',
  '癇痫', '癉瘅', '瘞瘗', '瘻瘘', '痙痉', '癱瘫', '癮瘾', '癭瘿', '癩癞', '癬癣',
  '癲癫', '皚皑', '皺皱', '盌碗', '盞盏', '鹽盐', '監监', '蓋盖', '盜盗', '盤盘',
  '眥眦', '瞼睑', '著着', '睜睁', '睞睐', '睦睦', '睪睾', '睫睫', '矚瞩', '矯矫',
  '磯矶', '礬矾', '礦矿', '碭砀', '碼码', '磚砖', '硨砗', '硯砚', '碸砜', '礪砺',
  '礱砻', '礫砾', '礎础', '硜硁', '碩硕', '硤硖', '磽硗', '確确', '鹼碱', '礙碍',
  '磧碛', '磣碜', '禮礼', '禡', '禰祢', '禎祯', '禱祷', '禍祸', '稟禀', '祿禄',
  '禪禅', '離离', '禿秃', '稈秆', '種种', '積积', '稱称', '穢秽', '穠秾', '穌稣',
  '穩稳', '穡穑', '窮穷', '竊窃', '竅窍', '窯窑', '竄窜', '窩窝', '窺窥', '竇窦',
  '窶窭', '豎竖', '競竞', '篤笃', '筍笋', '筆笔', '筧笕', '箋笺', '籠笼', '籩笾',
  '築筑', '篳筚', '篩筛', '箏筝', '籌筹', '簽签', '簡简', '籙箓', '簀箦', '篋箧',
  '籜箨', '籮箩', '簞箪', '簫箫', '簣篑', '簍篓', '籃篮', '籬篱', '籪簖', '籟籁',
  '糴籴', '類类', '秈籼', '糶粜', '糲粝', '粵粤', '糞粪', '糧粮', '糝糁', '餱糇',
  '緊紧', '縶絷', '糾纠', '紆纡', '紅红', '紂纣', '纖纤', '紇纥', '約约', '級级',
  '紈纨', '纊纩', '紀纪', '紉纫', '緯纬', '紜纭', '紘纮', '純纯', '紕纰', '紗纱',
  '綱纲', '納纳', '紝纴', '縱纵', '綸纶', '紛纷', '紙纸', '紋纹', '紡纺', '紵纻',
  '紼绋', '紐纽', '紓纾', '線线', '紺绀', '紲绁', '紱绂', '練练', '組组', '紳绅',
  '細细', '織织', '終终', '縐绉', '絆绊', '紼绋', '絀绌', '紹绍', '繹绎', '經经',
  '紿绐', '綁绑', '絨绒', '結结', '絝绔', '繞绕', '絰绖', '絎绗', '繪绘', '給给',
  '絢绚', '絳绛', '絡络', '絕绝', '絞绞', '統统', '綆绠', '綃绡', '絹绢', '繡绣',
  '綌绤', '綏绥', '絛绦', '繼继', '綈绨', '績绩', '緒绪', '綾绫', '續续', '綺绮',
  '緋绯', '綽绰', '緄绲', '繩绳', '維维', '綿绵', '綬绶', '繃绷', '綢绸', '綹绺',
  '綣绻', '綜综', '綻绽', '綰绾', '綠绿', '綴缀', '緇缁', '緙缂', '緗缃', '緘缄',
  '緬缅', '纜缆', '緹缇', '緲缈', '緝缉', '緦缌', '緞缎', '緶缏', '緱缑', '縋缒',
  '緩缓', '締缔', '縷缕', '編编', '緡缗', '緣缘', '縉缙', '縛缚', '縟缛', '縝缜',
  '縫缝', '縞缟', '纏缠', '縭缡', '縊缢', '縑缣', '繽缤', '縹缥', '縵缦', '縲缧',
  '纓缨', '縮缩', '繆缪', '繅缫', '纈缬', '繚缭', '繕缮', '繒缯', '韁缰', '繾缱',
  '繰缲', '繯缳', '繳缴', '纘缵', '罌罂', '網网', '羅罗', '罰罚', '罷罢', '羆罴',
  '羈羁', '羥羟', '羨羡', '翹翘', '翽翙', '聳耸', '恥耻', '聶聂', '聾聋', '職职',
  '聹聍', '聯联', '聵聩', '聰聪', '肅肃', '腸肠', '膚肤', '骯肮', '腎肾', '腫肿',
  '脹胀', '脅胁', '膽胆', '勝胜', '朧胧', '臚胪', '脛胫', '膠胶', '脈脉', '膾脍',
  '臟脏', '臍脐', '腦脑', '膿脓', '臠脔', '腳脚', '脫脱', '腡脶', '臉脸', '臘腊',
  '膩腻', '膕腘', '騰腾', '臏膑', '輿舆', '艤舣', '艦舰', '艙舱', '艫舻', '艱艰',
  '艷艳', '艸艹', '藝艺', '節节', '羋芈', '薌芗', '蕪芜', '蘆芦', '蕓芸', '萇苌',
  '蒼苍', '苧苎', '蘇苏', '蘋苹', '莖茎', '蘢茏', '蔦茑', '塋茔', '煢茕', '繭茧',
  '荊荆', '薦荐', '莢荚', '蕘荛', '蓽荜', '蕎荞', '薈荟', '薺荠', '蕩荡', '榮荣',
  '葷荤', '滎荥', '犖荦', '熒荧', '蕁荨', '藎荩', '蓀荪', '蔭荫', '葒荭', '葤荮',
  '藥药', '蒞莅', '萊莱', '蓮莲', '蒔莳', '萵莴', '薟莶', '獲获', '蕕莸', '瑩莹',
  '鶯莺', '蓴莼', '蘿萝', '螢萤', '營营', '縈萦', '蕭萧', '薩萨', '蔥葱', '蕆蒇',
  '蕢蒉', '蔣蒋', '蔞蒌', '藍蓝', '薊蓟', '蘺蓠', '蕷蓣', '鎣蓥', '驀蓦', '薔蔷',
  '蘞蔹', '藺蔺', '藹蔼', '蘄蕲', '蘊蕴', '藪薮', '藁槁', '蘚藓', '虜虏', '慮虑',
  '虛虚', '蟲虫', '虯虬', '蟣虮', '雖虽', '蝦虾', '蠆虿', '蝕蚀', '蟻蚁', '螞蚂',
  '蠶蚕', '蠔蚝', '蜆蚬', '蠱蛊', '蠣蛎', '蟶蛏', '蠻蛮', '蟄蛰', '蛺蛱', '蟯蛲',
  '螄蛳', '蠐蛴', '蛻蜕', '蝸蜗', '蠟蜡', '蠅蝇', '蟈蝈', '蟬蝉', '蠍蝎', '螻蝼',
  '蠑蝾', '螿螀', '蟎螨', '蠨蟏', '釁衅', '銜衔', '補补', '襯衬', '袞衮', '襖袄',
  '嫋袅', '襪袜', '襲袭', '裝装', '襠裆', '褳裢', '襝裣', '褲裤', '襇裥', '褸褛',
  '襤褴', '見见', '觀观', '規规', '覓觅', '視视', '覘觇', '覽览', '覺觉', '覬觊',
  '覡觋', '覿觏', '覦觎', '覯觌', '覲觐', '覷觑', '觴觞', '觸触', '觶觯', '譽誉',
  '謄誊', '計计', '訂订', '訃讣', '認认', '譏讥', '訐讦', '訌讧', '討讨', '讓让',
  '訕讪', '訖讫', '訓训', '議议', '訊讯', '記记', '講讲', '諱讳', '謳讴', '詎讵',
  '訝讶', '訥讷', '許许', '訛讹', '論论', '訟讼', '諷讽', '設设', '訪访', '訣诀',
  '證证', '詁诂', '訶诃', '評评', '詛诅', '識识', '詐诈', '訴诉', '診诊', '詆诋',
  '謅诌', '詞词', '詘绌', '詔诏', '詖诐', '譯译', '詒诒', '誆诓', '誄诔', '試试',
  '詿诖', '詩诗', '詰诘', '詼诙', '誠诚', '誅诛', '誄诔', '話话', '誕诞', '詬诟',
  '詮诠', '詭诡', '詢询', '詣诣', '諍诤', '該该', '詳详', '詫诧', '諢诨', '詡诩',
  '誡诫', '誣诬', '語语', '誚诮', '誤误', '誥诰', '誘诱', '誨诲', '誑诳', '說说',
  '誦诵', '誒诶', '請请', '諸诸', '諏诹', '諾诺', '讀读', '諑诼', '誹诽', '課课',
  '諉诿', '諛谀', '誰谁', '諗谂', '調调', '諂谄', '諒谅', '諄谆', '誶谇', '談谈',
  '誼谊', '謀谋', '諶谌', '諜谍', '謊谎', '諫谏', '諧谐', '謔谑', '謁谒', '謂谓',
  '諤谔', '諭谕', '諼谖', '讒谗', '諮咨', '諳谙', '諺谚', '諦谛', '謎谜', '諞谝',
  '謨谟', '讜谠', '謖谡', '謝谢', '謠谣', '謗谤', '謐谧', '謙谦', '謐谧', '謹谨',
  '謾谩', '謫谪', '譾谫', '謬谬', '譚谭', '譖谮', '譙谯', '譫谵', '譜谱', '譎谲',
  '讞谳', '譴谴', '譭毁', '讖谶', '貝贝', '貞贞', '負负', '財财', '貢贡', '貧贫',
  '貨货', '販贩', '貪贪', '貫贯', '責责', '貯贮', '貰贳', '貲赀', '貳贰', '貴贵',
  '貶贬', '買买', '貸贷', '貺贶', '費费', '貼贴', '貽贻', '貿贸', '賀贺', '賁贲',
  '賂赂', '賃赁', '賄贿', '賅赅', '資资', '賈贾', '賊贼', '賑赈', '賒赊', '賓宾',
  '賕赇', '賙赒', '賤贱', '賬账', '賭赌', '賢贤', '賣卖', '賜赐', '賞赏', '賠赔',
  '賡赓', '賦赋', '賧赕', '質质', '贅赘', '賴赖', '賵赗', '賺赚', '賽赛', '賾赜',
  '贗赝', '贊赞', '贈赠', '贍赡', '贏赢', '贛赣', '趙赵', '趕赶', '趨趋', '趲趱',
  '跡迹', '踐践', '踴踊', '蹌跄', '蹕跸', '躊踌', '躋跻', '躍跃', '躑踯', '躒跞',
  '躓踬', '躡蹑', '蹰', '跹', '躦躜', '軀躯', '車车', '軋轧', '軌轨', '軒轩',
  '軔轫', '轉转', '軛轭', '輪轮', '軟软', '轟轰', '軻轲', '轤轳', '軸轴', '軹轵',
  '軼轶', '軫轸', '轢轹', '較较', '軾轼', '載载', '輊轾', '轎轿', '輒辄', '輓挽',
  '輔辅', '輕轻', '輛辆', '輜辎', '輝辉', '輟辍', '輩辈', '輦辇', '輪轮', '輯辑',
  '輸输', '轡辔', '轅辕', '轄辖', '輾辗', '轆辘', '轍辙', '轔辚', '辦办', '辭辞',
  '辮辫', '辯辩', '農农', '邊边', '遼辽', '達达', '遷迁', '過过', '邁迈', '運运',
  '還还', '這这', '進进', '遠远', '違违', '連连', '遲迟', '邇迩', '逕迳', '跡迹',
  '適适', '選选', '遜逊', '遞递', '邐逦', '邏逻', '遺遗', '遙遥', '鄧邓', '鄺邝',
  '鄔邬', '郵邮', '鄒邹', '鄴邺', '鄰邻', '鬱郁', '郊郊', '鄶郐', '鄭郑', '鄆郓',
  '酈郦', '釅酽', '酤酤', '醜丑', '醞酝', '醫医', '醬酱', '釀酿', '釁衅', '釋释',
  '釐厘', '鑑鉴', '鑾銮', '鏨錾', '鋦锔', '銠铑', '銷销', '鎖锁', '鍋锅', '錘锤',
  '錐锥', '錦锦', '鍁锨', '錁锞', '錠锭', '鍵键', '鋸锯', '錳锰', '錙锱', '鍥锲',
  '鏘锵', '鍶锶', '鍔锷', '鍾钟', '鍛锻', '鍰锾', '鍍镀', '鎂镁', '鏤镂', '鎮镇',
  '鏌镆', '鎳镍', '鐫镌', '鏡镜', '鏑镝', '鏃镞', '鏇镟', '鏈链', '鏌镆', '鏢镖',
  '鏘锵', '鏝镘', '鏟铲', '鏡镜', '鏨錾', '鐵铁', '鑄铸', '鑑鉴', '鑒鉴', '鑠铄',
  '鑣镳', '鑰钥', '鑲镶', '鑷镊', '鑼锣', '鑽钻', '鑾銮', '鑿凿', '長长', '門门',
  '閂闩', '閃闪', '閆闫', '閉闭', '問问', '闖闯', '閏闰', '闈闱', '閒闲', '閎闳',
  '間间', '閔闵', '閘闸', '閡阂', '閣阁', '閥阀', '閨闺', '閩闽', '閫阃', '閬阆',
  '閭闾', '閱阅', '閹阉', '閼阏', '閾阈', '閿阌', '闃阒', '闆板', '闈闱', '闊阔',
  '闋阕', '闌阑', '闍阇', '闐阗', '闕阙', '闖闯', '關关', '闡阐', '闢辟', '闤阛',
  '隊队', '陽阳', '陰阴', '陣阵', '階阶', '際际', '陸陆', '隴陇', '陳陈', '陘陉',
  '陝陕', '隕陨', '險险', '隨随', '隱隐', '隸隶', '隻只', '雋隽', '雖虽', '雙双',
  '雛雏', '雜杂', '雞鸡', '離离', '難难', '雲云', '電电', '霑沾', '霆霆', '霽霁',
  '靂雳', '靄霭', '靈灵', '靚靓', '靜静', '靨靥', '鞏巩固', '鞦秋', '鞽鞒', '韃鞑',
  '韆千', '韉鞯', '韋韦', '韌韧', '韓韩', '韙韪', '韞韫', '韜韬', '韻韵', '頁页',
  '頂顶', '頃顷', '項项', '順顺', '頇顸', '須须', '頊顼', '頑顽', '顧顾', '頓顿',
  '頎颀', '頒颁', '頌颂', '頏吭', '預预', '顱颅', '領领', '頗颇', '頸颈', '頡颉',
  '頰颊', '頷颔', '潁颍', '頦颏', '頤颐', '頻频', '頹颓', '頷颔', '穎颖', '顆颗',
  '題题', '額额', '顎颚', '顏颜', '顓颛', '願愿', '顛颠', '類类', '饣', '餞饯',
  '飾饰', '飽饱', '飼饲', '飴饴', '餌饵', '饒饶', '餉饷', '餃饺', '餅饼', '餑饽',
  '餓饿', '餘余', '餒馁', '館馆', '餞饯', '餡馅', '餵喂', '餼饩', '餾馏', '饈馐',
  '饉馑', '饅馒', '饌馔', '馕', '馬马', '馭驭', '馱驮', '馴驯', '馳驰', '驅驱',
  '駁驳', '驢驴', '駛驶', '駟驷', '駙驸', '駒驹', '駐驻', '駝驼', '駕驾', '驛驿',
  '駑驽', '罵骂', '驍骁', '驕骄', '驊骅', '駱骆', '駭骇', '駢骈', '驪骊', '騁骋',
  '驗验', '駿骏', '騏骐', '騎骑', '騍骒', '騅骓', '驂骖', '騙骗', '騭骘', '騷骚',
  '騖骛', '驁骜', '騮骝', '騫骞', '騸骟', '驃骠', '騾骡', '驄骢', '驏骣', '驟骤',
  '驥骥', '驤骧', '髏髅', '髒脏', '體体', '髕髌', '髖髋', '髮发', '鬆松', '鬍胡',
  '鬚须', '鬢鬓', '鬥斗', '鬧闹', '鬩阋', '鬮阄', '鬱郁', '魎魉', '魘魇', '魚鱼',
  '魯鲁', '魴鲂', '魷鱿', '鮑鲍', '鮮鲜', '鯇鲩', '鯉鲤', '鯊鲨', '鯀鲧', '鯔鲻',
  '鯖鲭', '鯛鲷', '鯡鲱', '鯢鲵', '鯤鲲', '鯧鲳', '鯨鲸', '鯰鲇', '鯽鲫', '鰈鲽',
  '鰓鳃', '鱷鳄', '鰍鳅', '鰒鲒', '鰉鳇', '鰲鳌', '鰭鳍', '鰥鳏', '鰨鳎', '鰩鳐',
  '鳓', '鰾鳔', '鱈鳕', '鰻鳗', '鱅鳙', '鱔鳝', '鱗鳞', '鱒鳟', '鱧鳢', '鳥鸟',
  '鳩鸠', '鳶鸢', '鳴鸣', '鷗鸥', '鴉鸦', '鴇鸨', '鴆鸩', '鴣鸪', '鴦鸯', '鴨鸭',
  '鴻鸿', '鴿鸽', '鴰鸹', '鵂鸺', '鵜鹈', '鵝鹅', '鵠鹄', '鵡鹉', '鵪鹌', '鵬鹏',
  '鵯鹎', '鵲鹊', '鶉鹑', '鶘鹕', '鶚鹗', '鶻鹘', '鶿鹚', '鶩骛', '鶯莺', '鶴鹤',
  '鷂鹞', '鷓鹧', '鷗鸥', '鷲鹫', '鷦鹪', '鷹鹰', '鷺鹭', '鸛鹳', '鸞鸾', '鹵卤',
  '鹹咸', '鹼碱', '鹽盐', '麗丽', '麥麦', '麩麸', '麴曲', '麵面', '麼么', '黃黄',
  '黌黉', '點点', '黨党', '黲黪', '黴霉', '黶黡', '黷黩', '鼇鳌', '鼉鼍', '鼕冬',
  '鼴鼹', '齊齐', '齋斋', '齎赍', '齏齑', '齒齿', '齔龀', '齟龃', '齡龄', '齙龅',
  '齠龆', '齪龊', '齬龉', '齲龋', '齷龌', '龍龙', '龐庞', '龔龚', '龕龛', '龜龟',
];

const TRAD_TO_SIMP_SEARCH_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const pair of TRAD_SIMP_BUDDHIST_PAIRS) {
    const cps = Array.from(pair);
    if (cps.length === 2 && cps[0] !== cps[1]) {
      map[cps[0]] = cps[1];
    }
  }
  // Ensure Ākṣobhya variants normalize identically whether queried as 阿閦 or 阿閼
  map['閼'] = '閦';
  map['阏'] = '閦';
  return map;
})();

const COLLOQUIAL_ALIAS_MAP: Array<{ pattern: RegExp; expansion: string }> = [
  // Core fix for user query: 帝天神咒 covers both homophone 地天神咒 (Pṛthivī) and 帝释天神咒 (Śakrendra/Indra)
  {
    pattern: /帝天神咒|帝天咒|帝天陀罗尼/g,
    expansion:
      '地天神咒 地天陀罗尼 坚牢地天 坚牢地神 prthivi drdha 帝释天 天帝释 帝释神咒 尊胜幢臂印 天帝幢旗 dhvajagrakeyura sakrendra',
  },
  {
    pattern: /地天神咒|地天咒|地天陀罗尼|坚牢地天|坚牢地神|地神咒|安土地/g,
    expansion: 'prthivi drdha 坚牢地天 坚牢地神 地天陀罗尼 安土地真言',
  },
  {
    pattern: /帝释天神咒|帝释神咒|帝释咒|天帝神咒|天帝释|尊胜幢臂印|天帝幢旗/g,
    expansion: 'sakrendra indra dhvajagrakeyura 天帝释 尊胜幢 护命',
  },
  { pattern: /散脂大将|散脂鬼神|僧慎尔耶/g, expansion: 'samjna pancika 散脂 僧慎尔耶 药叉大将' },
  { pattern: /日光菩萨|日光遍照/g, expansion: 'suryaprabha 日光菩萨护持大悲神咒' },
  { pattern: /月光菩萨|月光遍照/g, expansion: 'candraprabha 月光菩萨护持大悲神咒' },
  { pattern: /嗡嘛呢呗美吽|嗡嘛呢叭咪吽|六字大明/g, expansion: 'mani padme 观自在 六字' },
  { pattern: /揭谛揭谛|波罗揭谛|心经咒/g, expansion: 'gate paragate prajnaparamita 般若心经' },
  { pattern: /绿度母|度母心咒|二十一度母/g, expansion: 'tarauttare tare tuttare 圣救度佛母 多罗' },
  { pattern: /白度母/g, expansion: 'tara ayuh punya 如意轮 救度' },
  { pattern: /往生咒|拔一切业障/g, expansion: 'sukhavati amrta 阿弥陀 拔一切业障根本得生净土' },
  { pattern: /大悲咒|千手千眼/g, expansion: 'nilakantha 千手千眼观世音菩萨广大圆满无碍大悲心陀罗尼' },
  { pattern: /楞严咒|首楞严/g, expansion: 'surangama sitatapatra 大佛顶首楞严' },
  { pattern: /尊胜咒|佛顶尊胜/g, expansion: 'usnisavijaya 佛顶尊胜陀罗尼' },
  { pattern: /宝箧印|一切如来心秘密/g, expansion: 'sarvatathagata karandamudra 一切如来心秘密全身舍利宝箧印陀罗尼' },
  { pattern: /大随求|随求即得|如意宝印/g, expansion: 'mahapratisara vipulagarbhe 普遍光明清净炽盛如意宝印心无能胜大明王大随求' },
  { pattern: /五护陀罗尼|五护经/g, expansion: 'pancaraksa mahapratisara mahamayuri mahasahasrapramardani mahasitavati mahamantranusarini' },
  { pattern: /准提咒|准提神咒/g, expansion: 'cundi cale cule 七俱胝佛母准提大明陀罗尼' },
  { pattern: /药师咒|药师灌顶/g, expansion: 'bhaisajya 药师琉璃光如来' },
  { pattern: /秽迹金刚|乌枢沙摩|乌刍瑟摩/g, expansion: 'ucchusma 秽迹金刚禁百变法 乌枢沙摩' },
  { pattern: /孔雀明王/g, expansion: 'mahamayuri mayurakrante 佛母大孔雀明王' },
  { pattern: /光明真言|大灌顶光/g, expansion: 'amogha vairocana 不空罥索毗卢遮那佛大灌顶光真言' },
  { pattern: /黄财神|财宝天王|瞻巴拉|毗沙门/g, expansion: 'jambhala vaisravana vasudhara 宝藏神 财源 毗沙门' },
  { pattern: /雨宝陀罗尼|持世菩萨|财源天母/g, expansion: 'vasudhara 雨宝 持世 财源' },
  { pattern: /宝楼阁|大宝广博楼阁/g, expansion: 'vipulavimana 宝楼阁善住秘密陀罗尼' },
  { pattern: /金刚摧碎|坏相金刚/g, expansion: 'vajravidarana 金刚摧碎陀罗尼' },
  { pattern: /不动佛|阿閦佛|阿閦如来/g, expansion: 'aksobhya 不动如来 阿閦' },
  { pattern: /智炬如来|破地狱/g, expansion: 'jnanolka 智炬如来 破地狱' },
  { pattern: /白伞盖/g, expansion: 'sitatapatra 大白伞盖' },
  { pattern: /文殊心咒|五字真言|八字文殊/g, expansion: 'arapacana manjusri abhavira 文殊师利' },
  { pattern: /不动明王/g, expansion: 'acala candamaharosana 不动尊' },
  { pattern: /摩利支天|具光佛母/g, expansion: 'marici 摩利支' },
  { pattern: /叶衣佛母|叶衣观音/g, expansion: 'parnasavari 叶衣' },
  { pattern: /伽耶特黎|太阳神咒|吠陀母咒/g, expansion: 'gayatri savitur tat savitur varenyam 梨俱吠陀' },
  { pattern: /大死胜咒|湿婆长寿咒|三目神咒/g, expansion: 'mahamrtyunjaya tryambakam yajamahe 湿婆' },
  { pattern: /湿婆|五字圣咒|嗡那玛希瓦亚/g, expansion: 'siva sivaya pancaksara rudra aghora' },
  { pattern: /毗湿奴|那罗延|克里希纳|黑天|罗摩/g, expansion: 'visnu narayana vasudevaya krsna rama narsimha' },
  { pattern: /难近母|杜尔迦|九字真言|十慧母|时母|卡莉/g, expansion: 'durga camundaye navarna mahavidya kali sri vidya' },
  { pattern: /象头神|伽内什|欢喜天/g, expansion: 'ganapati ganesa vakratunda' },
  { pattern: /吉祥天女|辩才天女|妙音天女/g, expansion: 'mahalaksmi srisukta sarasvati vagvadini' },
  { pattern: /九曜|星宿|行星咒|宿曜/g, expansion: 'navagraha grahamatrka surya candra 炽盛光' },
  { pattern: /耆那|五敬礼咒/g, expansion: 'namokara pancanamaskara arham arihantanam' },
  { pattern: /奥义书|平安咒|商蒂/g, expansion: 'upanisad santi pavamana purnamadah' },
  { pattern: /娑婆诃|梭哈|娑诃/g, expansion: 'svaha' },
  { pattern: /南无|那摩|曩谟/g, expansion: 'namo namah' },
];

const DB_BADGE_MAP: Record<string, { labelZh: string; tab: ActiveWorkspaceTab }> = {
  db1_fangshan: { labelZh: 'DB1 · 房山石经与释教最上乘陀罗尼集', tab: 'interlinear' },
  db2_taisho_ext: { labelZh: 'DB2 · 大正藏T54悉昙字书与续藏', tab: 'interlinear' },
  db3_dsbc_gretil: { labelZh: 'DB3 · 尼泊尔DSBC百品陀罗尼集', tab: 'hub' },
  db4_84000: { labelZh: 'DB4 · 84000藏文大藏经陀罗尼集', tab: 'hub' },
  db5_buddhanexus: { labelZh: 'DB5 · BuddhaNexus梵汉藏巴四语平行库', tab: 'concordance' },
  db6_sarit: { labelZh: 'DB6 · SARIT密续与金刚幕续梵本', tab: 'hub' },
  db7_cudl_hidas: { labelZh: 'DB7 · 剑桥CUDL贝叶经与Hidas校勘本', tab: 'cudl' },
  db8_polyglotta: { labelZh: 'DB8 · 奥斯陆16本心经与多语对勘库', tab: 'concordance' },
  db9_rkts: { labelZh: 'DB9 · 维也纳rKTs德格版陀罗尼集(Zungdu)', tab: 'hub' },
  db10_all_nibs: { labelZh: 'DB10 · ALL-NIBS尼瓦尔梵本写本库', tab: 'hub' },
  db11_idp_cetom: { labelZh: 'DB11 · 大英图书馆IDP/CEToM西域丝路梵本', tab: 'hub' },
  db12_ochs_muktabodha: { labelZh: 'DB12 · 牛津OCHS种子字辞典与金刚顶经', tab: 'phonetics-academy' },
};

export function normalizeSearchText(input: string): string {
  let raw = (input || '').replace(/[₍₎]/g, '');
  if (/[\u0900-\u097F]/.test(raw)) {
    try {
      raw += ' ' + slp1ToIast(devanagariToSlp1(raw));
    } catch {
      // keep raw
    }
  }
  if (/[\u{11580}-\u{115FF}]/u.test(raw)) {
    try {
      raw += ' ' + slp1ToIast(siddhamUnicodeToSlp1(raw));
    } catch {
      // keep raw
    }
  }
  const base = stripDiacritics(raw.normalize('NFKC'));
  let out = '';
  for (const ch of base) {
    out += TRAD_TO_SIMP_SEARCH_MAP[ch] || ch;
  }
  out = out
    .replace(/\bswaha\b/g, 'svaha')
    .replace(/\bnamaha\b/g, 'namah')
    .replace(/\baum\b/g, 'om')
    .replace(/\bhreem\b/g, 'hrim')
    .replace(/\bkleem\b/g, 'klim')
    .replace(/\bshree\b/g, 'sri')
    .replace(/\bshri\b/g, 'sri');
  return out;
}

interface IndexedEntryDoc {
  normTitle: string;
  normDbAndNo: string;
  normDeity: string;
  normHeader: string;
  normVerses: string[];
  normFull: string;
}

const ENTRY_INDEX_CACHE = new WeakMap<DharaniEntry, IndexedEntryDoc>();
const PREBUILT_ENTRY_INDEX_BY_ID = new Map<string, IndexedEntryDoc>();

export interface PrebuiltEntrySearchRecord {
  id: string;
  t: string;
  d: string;
  m: string;
  v: string[];
}

export interface Specialized12DbSearchRecord {
  id: string;
  dbId: string;
  databaseNumber: number;
  title: string;
  subtitle: string;
  sanskritIast?: string;
  chineseText?: string;
  tibetanText?: string;
  snippet: string;
  canonicalRefs?: string[];
  normHay: string;
}

export interface CloudSearchIndexPayload {
  version?: string;
  entries?: PrebuiltEntrySearchRecord[];
  specialized12DbRecords?: Specialized12DbSearchRecord[];
}

let loadedTaishoIndex: Array<TaishoMikkyoFileEntry & { normHay?: string }> = [];
let loadedSpecialized12DbRecords: Specialized12DbSearchRecord[] = [];

export function hydrateCloudSearchIndex(payload: CloudSearchIndexPayload): void {
  if (Array.isArray(payload.entries)) {
    for (const item of payload.entries) {
      const normHeader = `${item.t} ${item.d} ${item.m}`;
      const normFull = `${normHeader} ${item.v.join(' ')}`;
      PREBUILT_ENTRY_INDEX_BY_ID.set(item.id, {
        normTitle: item.t,
        normDbAndNo: item.d,
        normDeity: item.m,
        normHeader,
        normVerses: item.v,
        normFull,
      });
    }
  }
  if (Array.isArray(payload.specialized12DbRecords)) {
    loadedSpecialized12DbRecords = payload.specialized12DbRecords;
  }
}

export function hydrateTaishoSearchIndex(
  items: Array<TaishoMikkyoFileEntry & { normHay?: string }>
): void {
  if (Array.isArray(items)) {
    loadedTaishoIndex = items;
  }
}

function getIndexedEntryDoc(entry: DharaniEntry): IndexedEntryDoc {
  const cached = ENTRY_INDEX_CACHE.get(entry);
  if (cached) return cached;

  const prebuilt = PREBUILT_ENTRY_INDEX_BY_ID.get(entry.id);
  if (prebuilt) {
    ENTRY_INDEX_CACHE.set(entry, prebuilt);
    return prebuilt;
  }

  const normTitle = normalizeSearchText(
    `${entry.titleZh} ${entry.titleSanskritIast} ${entry.titleEnglish}`
  );
  const normDbAndNo = normalizeSearchText(
    `${entry.taishoNo} ${entry.provenance.cbetaId || ''} ${entry.provenance.gretilFile || ''} ${entry.provenance.databaseId || ''} ${entry.provenance.databaseBadgeZh || ''}`
  );
  const normDeity = normalizeSearchText(
    `${entry.deityZh} ${entry.translatorZh} ${entry.sutraSourceZh} ${entry.meritsAndSummaryZh} ${entry.provenance.editionCitation || ''} ${entry.provenance.manuscriptNotesZh || ''} ${entry.provenance.rawSnippet || ''}`
  );
  const normHeader = `${normTitle} ${normDbAndNo} ${normDeity}`;
  const normVerses = entry.verses.map((v) => {
    const wordsDesc = Object.getOwnPropertyDescriptor(v, 'words');
    const eagerWords = wordsDesc && 'value' in wordsDesc && Array.isArray(wordsDesc.value) ? wordsDesc.value : [];
    const wordsStr = eagerWords
      .map((w: { iast: string; transliterationZh: string; meaningZh: string }) => `${w.iast} ${w.transliterationZh} ${w.meaningZh}`)
      .join(' ');
    const classicalDesc = Object.getOwnPropertyDescriptor(v, 'classicalTranslitZh');
    const classicalStr = classicalDesc && 'value' in classicalDesc ? String(classicalDesc.value || '') : '';
    const modernDesc = Object.getOwnPropertyDescriptor(v, 'modernPhoneticZh');
    const modernStr = modernDesc && 'value' in modernDesc ? String(modernDesc.value || '') : '';
    return normalizeSearchText(
      `${v.iast} ${classicalStr} ${modernStr} ${v.meaningZh} ${v.meaningEn} ${wordsStr}`
    );
  });
  const normFull = `${normHeader} ${normVerses.join(' ')}`;

  const doc: IndexedEntryDoc = {
    normTitle,
    normDbAndNo,
    normDeity,
    normHeader,
    normVerses,
    normFull,
  };
  ENTRY_INDEX_CACHE.set(entry, doc);
  return doc;
}

function buildQueryVariantsAndTokens(rawQuery: string): {
  normQuery: string;
  tokens: string[];
  aliasTerms: string[];
} {
  const normQuery = normalizeSearchText(rawQuery.trim());
  const tokens = normQuery.split(/\s+/).filter(Boolean);
  const aliasTerms: string[] = [];
  for (const rule of COLLOQUIAL_ALIAS_MAP) {
    if (rule.pattern.test(normQuery)) {
      aliasTerms.push(...normalizeSearchText(rule.expansion).split(/\s+/).filter(Boolean));
    }
    rule.pattern.lastIndex = 0;
  }
  return { normQuery, tokens, aliasTerms };
}

function matchesDoc(
  doc: IndexedEntryDoc,
  normQuery: string,
  tokens: string[],
  aliasTerms: string[]
): boolean {
  if (!normQuery) return true;
  if (doc.normFull.includes(normQuery)) return true;
  if (tokens.length > 1 && tokens.every((tk) => doc.normFull.includes(tk))) {
    return true;
  }
  if (aliasTerms.length > 0 && aliasTerms.some((term) => doc.normFull.includes(term))) {
    return true;
  }
  return false;
}

export function filterDharanis(
  entries: DharaniEntry[],
  options: SearchFilterOptions
): DharaniEntry[] {
  const { normQuery, tokens, aliasTerms } = buildQueryVariantsAndTokens(options.query);

  return entries.filter((entry) => {
    if (options.categoryId !== 'all' && entry.categoryId !== options.categoryId) {
      return false;
    }

    if (options.onlyBookmarked && !options.bookmarkedIds.has(entry.id)) {
      return false;
    }

    if (options.sourceFilter === 'global-12db') {
      if (
        entry.provenance.sourceType !== 'GLOBAL-12DB' &&
        !entry.provenance.databaseId
      ) {
        return false;
      }
    } else if (options.sourceFilter === 'cbeta-siddham') {
      const hasSiddham =
        (entry.provenance.cbetaInterlinearTokens &&
          entry.provenance.cbetaInterlinearTokens.length > 0) ||
        Boolean(entry.provenance.cbetaId);
      if (!hasSiddham) return false;
    } else if (options.sourceFilter === 'gretil-sanskrit') {
      if (!entry.provenance.gretilFile) return false;
    }

    if (!normQuery) {
      return true;
    }

    const doc = getIndexedEntryDoc(entry);
    return matchesDoc(doc, normQuery, tokens, aliasTerms);
  });
}

function sliceCp(text: string | undefined | null, maxCodePoints: number): string {
  if (!text) return '';
  return Array.from(text).slice(0, maxCodePoints).join('');
}

function toCanonSuggestionItem(
  entry: DharaniEntry,
  matchTypeLabel: string,
  matchedVerse?: DharaniEntry['verses'][number]
): SearchSuggestionItem {
  const previewVerse = matchedVerse || entry.verses[0];
  const badgePrefix = entry.provenance.databaseBadgeZh
    ? `🌐 ${entry.provenance.databaseBadgeZh} · `
    : '';
  return {
    kind: 'canon-entry',
    entry,
    titleZh: entry.titleZh,
    taishoNo: entry.taishoNo,
    matchTypeLabel: `${badgePrefix}${matchTypeLabel}`,
    matchedVerseId: matchedVerse?.id,
    matchedVerseIndex: matchedVerse?.index,
    snippetPrimary: previewVerse
      ? `梵音：${sliceCp(previewVerse.iast, 72)}`
      : entry.titleSanskritIast,
    snippetSecondary: previewVerse
      ? `古汉语：${sliceCp(previewVerse.classicalTranslitZh, 42)} · 梵音拼读：${sliceCp(previewVerse.modernPhoneticZh, 42)}`
      : entry.deityZh,
  };
}

/**
 * Generates instant selectable autocomplete results below the header search input,
 * searching across all 1,419+ authentic Sanskrit entries (including all 12 International Databases DB1–DB12,
 * Curated Multi-Script, World Mantras Encyclopedia, 200 GRETIL Sanskrit Manuscripts) +
 * Unified 12-Database Specialized Lexicons/Catalogs + 614 Taishō Esoteric Canon Scriptures.
 */
export function getSearchSuggestions(
  entries: DharaniEntry[],
  rawQuery: string,
  limit = 20
): SearchSuggestionItem[] {
  const { normQuery: q, tokens, aliasTerms } = buildQueryVariantsAndTokens(rawQuery);

  if (!q) {
    // Show 6 classic flagship Dhāraṇīs + 10 representative entries across DB1–DB12
    const classicPicks = entries
      .filter((e) => !e.provenance.databaseId)
      .slice(0, 6)
      .map((entry) => toCanonSuggestionItem(entry, '核心经典陀罗尼'));

    const dbSeen = new Set<string>();
    const dbPicks: SearchSuggestionItem[] = [];
    for (const entry of entries) {
      const dbId = entry.provenance.databaseId;
      if (dbId && !dbSeen.has(dbId)) {
        dbSeen.add(dbId);
        dbPicks.push(toCanonSuggestionItem(entry, '12大国际权威梵典库'));
        if (dbPicks.length >= 10) break;
      }
    }

    return [...classicPicks, ...dbPicks].slice(0, limit);
  }

  // Score all matching entries across the entire 2,051-entry corpus so DB1–DB12 are never starved
  const scoredCanon: Array<{
    score: number;
    is12Db: boolean;
    entry: DharaniEntry;
    matchTypeLabel: string;
    matchedVerse?: DharaniEntry['verses'][number];
  }> = [];

  for (const entry of entries) {
    const doc = getIndexedEntryDoc(entry);
    if (!matchesDoc(doc, q, tokens, aliasTerms)) {
      continue;
    }

    const is12Db = Boolean(
      entry.provenance.databaseId || entry.provenance.sourceType === 'GLOBAL-12DB'
    );

    const titleMatch =
      doc.normTitle.includes(q) ||
      (tokens.length > 1 && tokens.every((tk) => doc.normTitle.includes(tk))) ||
      (aliasTerms.length > 0 && aliasTerms.some((term) => doc.normTitle.includes(term)));
    const dbOrNoMatch =
      doc.normDbAndNo.includes(q) ||
      (tokens.length > 1 && tokens.every((tk) => doc.normDbAndNo.includes(tk)));
    const deityMatch =
      doc.normDeity.includes(q) ||
      (aliasTerms.length > 0 && aliasTerms.some((term) => doc.normDeity.includes(term)));

    let matchedVerse: DharaniEntry['verses'][number] | undefined;
    if (!titleMatch && !dbOrNoMatch && !deityMatch) {
      const vIdx = doc.normVerses.findIndex(
        (vStr) =>
          vStr.includes(q) ||
          (tokens.length > 1 && tokens.every((tk) => vStr.includes(tk))) ||
          (aliasTerms.length > 0 && aliasTerms.some((term) => vStr.includes(term)))
      );
      if (vIdx >= 0) {
        matchedVerse = entry.verses[vIdx];
      }
    }

    let score = 20;
    if (doc.normTitle.startsWith(q)) score += 120;
    else if (titleMatch) score += 90;
    if (dbOrNoMatch) score += 85;
    if (deityMatch) score += 55;
    if (matchedVerse) score += 35;
    if (is12Db && dbOrNoMatch) score += 30;

    let matchTypeLabel = is12Db ? '全球12大梵典专集' : '四体梵音精校库';
    if (entry.categoryId === 'gretil-canonical') {
      matchTypeLabel = `GRETIL 梵文贝叶经 (${entry.provenance.gretilFile || ''})`;
    } else if (dbOrNoMatch && !titleMatch) {
      matchTypeLabel = `经号/数据库匹配 (${entry.taishoNo})`;
    } else if (deityMatch && !titleMatch) {
      matchTypeLabel = `本尊/译者匹配 (${entry.deityZh.slice(0, 14)})`;
    } else if (matchedVerse && !titleMatch) {
      matchTypeLabel = `匹配第 ${matchedVerse.index} 句梵音/古汉语`;
    }

    scoredCanon.push({
      score,
      is12Db,
      entry,
      matchTypeLabel,
      matchedVerse,
    });
  }

  scoredCanon.sort((a, b) => b.score - a.score);

  // Interleave top curated & top 12-DB canon entries so both appear prominently in dropdown
  const classicResults = scoredCanon.filter((x) => !x.is12Db);
  const db12CanonResults = scoredCanon.filter((x) => x.is12Db);

  const results: SearchSuggestionItem[] = [];
  let cIdx = 0;
  let dIdx = 0;
  const maxCanonSlots = Math.max(10, limit - 6);

  while (
    results.length < maxCanonSlots &&
    (cIdx < classicResults.length || dIdx < db12CanonResults.length)
  ) {
    if (cIdx < classicResults.length) {
      const hit = classicResults[cIdx++];
      results.push(toCanonSuggestionItem(hit.entry, hit.matchTypeLabel, hit.matchedVerse));
    }
    if (results.length < maxCanonSlots && dIdx < db12CanonResults.length) {
      const hit = db12CanonResults[dIdx++];
      results.push(toCanonSuggestionItem(hit.entry, hit.matchTypeLabel, hit.matchedVerse));
    }
  }

  // Also query the Cloud-Hydrated Unified 12-Database Records for specialized lexicon/glossary/manuscript hits
  try {
    const existingTitles = new Set(results.map((r) => normalizeSearchText(r.titleZh)));
    let added12Db = 0;

    for (const hit of loadedSpecialized12DbRecords) {
      if (results.length >= limit || added12Db >= 6) break;
      if (hit.dbId === 'baseline') continue;
      const matchesHit =
        hit.normHay.includes(q) ||
        (tokens.length > 1 && tokens.every((tk) => hit.normHay.includes(tk))) ||
        (aliasTerms.length > 0 && aliasTerms.some((term) => hit.normHay.includes(term)));
      if (!matchesHit) continue;

      const normHitTitle = normalizeSearchText(hit.title);
      if (existingTitles.has(normHitTitle)) continue;
      existingTitles.add(normHitTitle);

      const dbMeta = DB_BADGE_MAP[hit.dbId] || {
        labelZh: `DB${hit.databaseNumber} · 国际梵典数据库`,
        tab: 'hub' as ActiveWorkspaceTab,
      };

      const linkedEntry = entries.find(
        (e) =>
          e.id.includes(hit.id) ||
          (hit.canonicalRefs &&
            hit.canonicalRefs.some((ref) => e.taishoNo.includes(ref)))
      );

      results.push({
        kind: linkedEntry ? 'canon-entry' : 'global-12db-hit',
        entry: linkedEntry,
        targetTab: dbMeta.tab,
        titleZh: hit.title,
        taishoNo: (hit.canonicalRefs && hit.canonicalRefs[0]) || hit.id,
        matchTypeLabel: `🌐 ${dbMeta.labelZh}`,
        snippetPrimary: hit.sanskritIast
          ? `梵音/转写：${sliceCp(hit.sanskritIast, 76)}`
          : sliceCp(hit.snippet, 76),
        snippetSecondary: `${hit.subtitle} · ${hit.chineseText || hit.tibetanText || sliceCp(hit.snippet, 48)}`,
      });
      added12Db++;
    }
  } catch {
    // Ignore if unified search encounters edge case
  }

  // Also include Taishō Esoteric Canon XML Scripture matches
  for (const ts of loadedTaishoIndex) {
    if (results.length >= limit) break;
    const hay =
      ts.normHay ||
      normalizeSearchText(
        `${ts.id} ${ts.titleZh} ${ts.titleTrad} ${ts.translator} ${ts.sampleDharanis.join(' ')}`
      );
    const matchesTaisho =
      hay.includes(q) ||
      (tokens.length > 1 && tokens.every((tk) => hay.includes(tk))) ||
      (aliasTerms.length > 0 && aliasTerms.some((term) => hay.includes(term)));
    if (matchesTaisho) {
      results.push({
        kind: 'taisho-scripture',
        taishoScriptureId: ts.id,
        titleZh: `【大正藏原典】${ts.titleZh}`,
        taishoNo: `${ts.id} (${ts.vol})`,
        matchTypeLabel: `大正藏密教部原典 · 含真言 ${ts.dharaniBlockCount} 段`,
        snippetPrimary: `译者：${ts.translator} · 点击查看 CBETA TEI-P5 原典全部真言`,
        snippetSecondary: ts.sampleDharanis[0]
          ? `原典咒句：${sliceCp(ts.sampleDharanis[0], 72)}...`
          : `CBETA 经号 ${ts.id}.xml`,
      });
    }
  }

  return results;
}
