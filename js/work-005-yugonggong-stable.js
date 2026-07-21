/* 005《虞恭公温彦博碑》栏目二、三专属内容。
 * 只在当前释文明确标出的“□”位置提出候选；
 * AI分析只解释为什么判断为当前候选字，不使用共享操作模板。
 */
(function(){
  "use strict";

  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
  if(parentId!=="005"||window.__WORK_005_YUGONGGONG_STABLE__)return;
  window.__WORK_005_YUGONGGONG_STABLE__=true;

  /* 005完全使用自己的案例、图片和分析，阻止旧共享脚本二次覆盖。 */
  window.__DAMAGE_CASE_UNBRACKETED_ADAPTER__=true;
  window.__DAMAGE_CASE_INTEGRITY_V2__=true;
  window.__DAMAGE_CASE_PARTIAL_STATUS__=true;
  window.__DAMAGE_CASE_AUDIT_V2__=true;
  window.__DAMAGE_CASE_STANDARD_PATCH_V4__=true;

  const WORK_TITLE="虞恭公温彦博碑";
  const TEXT_URL="data/yugonggong_full_text.txt?v=20260720_stable_v1";
  const CASE_URL="data/yugonggong_all_damage_cases.json?v=20260721_yugonggong_analysis_v4";
  const PAGE_INDEX_URL="data/page_images_index.json?v=20260720_stable_v1";
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const INTRO="本栏目以当前网页释文为底稿，只对原释文中明确标出的缺字提出校读意见。AI分析重点说明为什么判断为当前候选字，包括固定词语、官职名称、人物谱系、典故、对偶结构及拓片残存字形等依据；无法与原缺字逐字对应的外部录文不直接写入恢复结果。";

  const OVERRIDES={
    "02":{
      category:"残损碑文恢复",title:"上柱国",corrected:"唐故特進尚書右㒒射上柱〔國〕虞恭公温公碑。",mode:"documentary",confidence:"高",
      analysis:["缺字位于“上柱”之后，而“上柱国”是隋唐时期完整的勋官名称。","其后紧接“虞恭公温公碑”，语法上应先结束官爵，再进入碑名。","因此此处一个“□”补作“國”；原有“㒒”不在缺字符号位置，本例不另作改写。"]
    },
    "03":{
      category:"残损碑文恢复",title:"六卿扬其职",corrected:"有周誕命，六卿揚其〔職〕□，釣棇也。",mode:"mixed",confidence:"分项判断",
      analysis:["前句“九官奮其庸”与本句“六卿揚其……”构成平行结构，“庸”指功业，“職”正可作六卿所扬之对象。","“扬其职”是语法完整的动宾结构，也与六卿分职治事的含义相合。","原处有两个“□”，现有依据只能把第一个位置判断为“職”；第二个缺字与后面的“釣棇也”存在串接，继续保留。"]
    },
    "04":{
      category:"残损碑文恢复",title:"感其灵者人杰",corrected:"若夫昴宿麗天，感其靈者人〔傑〕；",mode:"documentary",confidence:"高",
      analysis:["“人杰”是称颂杰出人物的固定词语，正好对应“人□”的一字缺口。","下句以“国桢”比喻国家栋梁，“人杰—国桢”形成意义相近的赞语对举。","相关录文在同一位置也保存“人杰”，故判断缺字为“傑”。"]
    },
    "05":{
      category:"残损碑文恢复",title:"嵩岳镇地与国桢",corrected:"嵩〔岳〕鎮〔地〕，降其神者〔國〕楨。",mode:"documentary",confidence:"高",
      analysis:["“嵩岳”是嵩山的正式称谓，补“岳”后与上句“昴宿丽天”形成星宿与名山的对应。","“镇地”与前句“丽天”在句法上相对，分别说明山岳镇守大地、星宿列于天空。","“国桢”以桢干比喻国家重臣，与前句“人杰”相应，因此三处依次补“岳、地、国”。"]
    },
    "06":{
      category:"残损碑文恢复",title:"唐叔之遥源",corrected:"臨系姬文之逺胄，洙唐〔叔〕之遥源。",mode:"documentary",confidence:"高",
      analysis:["缺字位于“唐”与“之遥源”之间，“唐叔”是周武王之子叔虞的称号。","唐叔虞被封于唐，是晋国及相关姓氏谱系叙述中常见的远祖。","“系姬文之远胄—唐叔之遥源”同属追溯家族源流的句式，因此补“叔”。"]
    },
    "07":{
      category:"残损碑文恢复",title:"世功开其绪",corrected:"食邑河内，世功〔開〕其緒；",mode:"documentary",confidence:"高",
      analysis:["“绪”可指家族功业的端绪和传承，前面需要能支配“其绪”的动词。","“开其绪”表示开创家族功业，与前面的“世功”衔接自然。","相关录文同样保存“世功开其绪”，故缺字判断为“開”。"]
    },
    "08":{
      category:"残损碑文恢复",title:"表缀、翘首、结辙",corrected:"著袒裕，魏太中大夫，言為准的，行成〔表〕綴，廊廟翹〔首〕，搢紳結〔轍〕。",mode:"documentary",confidence:"高",
      analysis:["“表缀”承接“言为准的”，表示其德行可作为表率和联属，补“表”后词组成立。","“翘首”是仰首企望的固定词语，“廊庙翘首”表现朝廷人士仰望其才。","“结辙”以车辙相接形容士绅追随，与“搢绅”搭配合理，因此三处分别补“表、首、辙”。"]
    },
    "09":{
      category:"残损碑文恢复",title:"能兼之者、不亦优",corrected:"穎川陳君，哀榮無聞扵異代，能兼〔之〕者，不亦〔優〕？",mode:"documentary",confidence:"高",
      analysis:["“能兼□者”需要一个代词承接前面所列德行和荣誉，补“之”后成为常见的“能兼之者”。","“不亦□”是反问结构，形容兼具诸美者十分优越，补“优”后语义完整。","两个候选分别只占一个缺字位置，不改变原句已有的“无闻”等文字。"]
    },
    "10":{
      category:"残损碑文恢复",title:"列圣之所重",corrected:"若乃三徳六行，列聖之所〔重〕也。",mode:"provisional",confidence:"低至中",
      analysis:["“三德六行”是儒家用来概括品德规范的术语，后文应说明历代圣贤对它的态度。","“列圣之所重也”可解释为历代圣贤所重视，句法完整且语义连贯。","“尚”等近义字也可能成立，现有拓片字形不足以唯一排除，因此“重”仅作暂拟。"]
    },
    "11":{
      category:"残损碑文恢复",title:"维地肇自涓流",corrected:"〔維〕地肇自涓流。",mode:"documentary",confidence:"中高",
      analysis:["缺字位于句首，后接“地肇自涓流”，需要一个起提示作用的虚词。","“维”常用于古文句首，引出判断或陈述，补后形成“维地肇自涓流”。","相关录文在对应位置保存“维”字，因此判断为“維”。"]
    },
    "12":{
      category:"残损碑文恢复",title:"宾王、正辞、敛笏与玉振",corrected:"是以平津筮仕，由賔〔王〕而佩印，文終創業，階□牢籠多士，太子洗馬李綱，直道正〔辭〕，羽儀海内，並下堂見禮，〔斂〕笏鳳池，垂紳鸞閣，瓌姿月舉，韶音玉〔振〕。",mode:"mixed",confidence:"分项判断",
      analysis:["“宾王”有辅佐、归顺王室之义，与后面的“佩印”衔接，因此第一处补“王”。","“正辞”与“直道”并列，均形容李纲言行正直；“敛笏”是朝臣持笏肃立的动作；“玉振”常比喻声誉和文辞清越。","“阶□牢笼多士”中的单字无法从较长异本缺文中准确映射，故该处继续保留“□”。"]
    },
    "13":{
      category:"残损碑文恢复",title:"文武在列",corrected:"每至〔文〕武在列，華度在乎經國。",mode:"documentary",confidence:"高",
      analysis:["缺字位于“武”之前，“文武”是并称文臣武将的固定结构。","“文武在列”指文武百官列于朝堂，与后面的“经国”同属朝政语境。","一个“□”正好对应“文”字，故作此判断。"]
    },
    "14":{
      category:"残损碑文恢复",title:"孺慕之感、哀毁之极",corrected:"大業之始，以親喪去官，〔孺〕慕之感，〔哀〕毀之極。",mode:"documentary",confidence:"高",
      analysis:["“孺慕”指像幼儿一样思慕父母，常用于形容居丧至孝，与“亲丧去官”直接相接。","“哀毁”指因哀伤过度而损伤身体，是传统丧礼叙述中的固定表达。","两处各缺一字，补“孺、哀”后形成意义相承的居丧赞语。"]
    },
    "15":{
      category:"残损碑文恢复",title:"与兄出奔高丽",corrected:"與〔兄〕出奔髙麗，既而乗轅南反，詔公銜命蕃境，申眀臣莭，陳之以□，擁莭無㓛扵月氏，又以公為東北道招慰大使。",mode:"mixed",confidence:"分项判断",
      analysis:["“与□出奔高丽”中的缺字位于表示同行关系的位置，补“兄”后成为“与兄出奔”，符合人物传记叙事。","相关人物材料可支持兄弟同行的可能，因此“兄”作为低置信度候选。","“陈之以□”在其他录文中常见“逆顺”等两字表达，但当前只有一个“□”，无法逐字对应，故该处不强行补写。"]
    },
    "16":{
      category:"残损碑文恢复",title:"天地横溃、光宠与勋庸",corrected:"属天地横〔潰〕□之鼎，艾綬銀章，弓旌先扵髦俊，建社班瑞，光〔寵〕屬扵〔勳〕庸。",mode:"mixed",confidence:"分项判断",
      analysis:["“天地横溃”是形容天下崩乱的常见表达，第一组缺字可先确认“溃”，另一字因与后文存在长段错接而保留。","“光宠”指显赫恩宠，与前面的封爵、银章相应。","“勋庸”指功勋和劳绩，“光宠属于勋庸”说明荣宠授予有功之人，因此后两处补“宠、勋”。"]
    },
    "17":{
      category:"残损碑文恢复",title:"庶绩与蹉跎",corrected:"庶〔績〕刑而滅沒不羣，豈蹉〔跎〕扵吴阪；",mode:"mixed",confidence:"分项判断",
      analysis:["“庶绩”是古文中表示各种政绩、众多功业的常见词，相关录文的长段也以“庶绩”起首，因此第一处暂补“绩”。","“蹉跎”是表示失意、耽搁的固定双音词，原文已有“蹉”，缺字应为“跎”。","第一处后面仍有长段压缩和错接，补“绩”只能确认开头词语，不能据此恢复整段。"]
    },
    "18":{
      category:"残损碑文恢复",title:"特达于章台",corrected:"清越振響，终特逹〔于章臺〕。",mode:"documentary",confidence:"高",
      analysis:["原处连续三个“□”，候选“于章台”正好也是三个字。","“章台”可代指朝廷台省，人物声誉“特达于章台”符合仕途显达的语境。","相关录文在对应位置保存“于章台”，故三字可逐一对应恢复。"]
    },
    "19":{
      category:"残损碑文恢复",title:"复在兹焉",corrected:"徴□則孝若飛聲扵洛下，云誰嗣響，復在〔兹〕焉。",mode:"mixed",confidence:"分项判断",
      analysis:["“复在兹焉”中的“兹”是指示代词，补后表示能够继承前人声誉者又在此人。","相关录文可直接确认“复在兹焉”，一个缺字与“兹”相合。","“徴□”处在其他版本中对应较长官职履历，不能压缩成一个确定字，因此第一处继续保留。"]
    },
    "20":{
      category:"残损碑文恢复",title:"猃狁、单于、南风与龟宝",corrected:"屬獫〔狁〕縱〔慝〕□□□軍長史，十萬之師，方絶大漢，五飣之術，必繫單〔于〕，而〔南〕風褰〔律〕，澆俗侔扵結〔繩〕，叶和萬邦，逺〔夷〕同扵編戸，威慴龍瀚，澤浸〔龜寶〕。",mode:"mixed",confidence:"分项判断",
      analysis:["“猃狁”是古代北方族名，缺字位于“猃”后，应为“狁”；“纵慝”表示放纵邪恶，因此四连缺字的首字暂补“慝”。","“单于”是匈奴首领称号；“南风”“褰律”“结绳”“远夷”分别可由固定词语和上下文确定。","句末两个缺字补“龟宝”，与恩泽远及珍宝的赞颂语境相合；四连缺字剩余三字因无法逐字映射继续保留。"]
    },
    "21":{
      category:"残损碑文恢复",title:"王佐与九霄",corrected:"公望為時宗，才稱〔王〕佐，鴻翼所漸，自囬溪而薄〔九〕霄；",mode:"documentary",confidence:"高",
      analysis:["“王佐”指能够辅佐帝王的人才，与“才称”组成“才称王佐”。","“九霄”指极高的天空，正与前面的“鸿翼”高飞意象相合。","两处各缺一字，补“王、九”后分别形成固定词语。"]
    },
    "22":{
      category:"残损碑文恢复",title:"骥足既驰、四至与十旬",corrected:"〔驥〕足既〔馳〕，爵命曰隆，寵祿嵗厚，猶司馬之〔四〕，至慈眀之〔十〕旬。",mode:"documentary",confidence:"中高",
      analysis:["“骥足”以良马比喻人才，“既驰”表示才华已经施展，与前文“鸿翼”构成连续比喻。","“司马之四至”是相关录文保存的数量表达，当前缺字补“四”，并与后面现有的“至”共同组成“四至”。","“十旬”以十个旬日表示时段，一个缺字补“十”后词组完整。"]
    },
    "23":{
      category:"残损碑文恢复",title:"职司八柄与公又处之",corrected:"乃以□官□柄，公又〔處〕□之。",mode:"mixed",confidence:"分项判断",
      analysis:["相关录文在此包含较长的官职迁转文字，并出现“职司八柄，公又处之”。","“公又□□之”中的首个缺字可判断为“处”，构成“公又处之”，表示再次居其职。","前两处单框和“处”后的另一框无法与长段官职文字逐字对应，因此继续保留。"]
    },
    "24":{
      category:"残损碑文恢复",title:"纠察、简册与肃周行",corrected:"故能出捴糺〔察〕，入專機管，執簡〔冊〕以〔肅周〕，行□□。",mode:"mixed",confidence:"分项判断",
      analysis:["“纠察”是监察纠举的固定词语，与“出总”组成其外任职责。","“简册”指文书册籍，与“执简”相接；“肃周行”表示整肃朝廷百官，正好对应两个缺字“肃周”。","末尾“行□□”在相关录文中属于另一段较长句子，无法只用两个字准确恢复，故保留。"]
    },
    "25":{
      category:"残损碑文恢复",title:"赞百揆",corrected:"中陽之令□□十□而□□之運四時，下料人事，邁元愷之賛百〔揆〕。",mode:"mixed",confidence:"分项判断",
      analysis:["“百揆”是总理百官、统摄政务的古代政治用语，“赞百揆”即辅佐百官之长处理政事。","前面以“下料人事”称其识人治政，后接“迈元恺之赞百揆”语义顺畅。","句首多组缺字在其他录文中对应长段文字，无法按现有框数逐字映射，因此本例只确认最后的“揆”。"]
    },
    "26":{
      category:"残损碑文恢复",title:"钦昔□、兴宪□待考",corrected:"聖朝欽昔□，興憲□，道勤行而不倦；",mode:"unresolved",confidence:"暂无法判断",
      analysis:["两个缺字分别位于“钦昔”与“兴宪”之后，但现有句面不能组成可唯一确认的固定词语。","其他录文常见“钦若前典、宪章往代”等较长表达，却需要改变原有“昔、兴”的位置，不能作为两个单字直接填入。","拓片残存笔画不足以区分候选，因此两处继续保留“□”。"]
    },
    "27":{
      category:"残损碑文恢复",title:"历选前哲",corrected:"厯選〔前〕哲，仰止而無怠。",mode:"documentary",confidence:"高",
      analysis:["“前哲”指前代贤哲，是古文中的常见词语。","后面的“仰止”表示敬仰贤者，与“历选前哲”语义直接衔接。","缺字位于“选”与“哲”之间，一个“前”字即可形成完整词组。"]
    },
    "28":{
      category:"残损碑文恢复",title:"忠允、忠恕、于仁厚与规矩",corrected:"是以忠〔允〕寬裕，□□〔忠〕恕，損益之義，皆出〔于〕仁厚，違〔規〕矩，抂尋尺，光其家而弗為；",mode:"mixed",confidence:"分项判断",
      analysis:["“忠允”表示忠诚诚信，与后面的“宽裕”并列概括品德，因此第一处补“允”。","三连缺字之后现有“恕”，相关录文以“忠恕”成词，只能把最后一格判断为“忠”，前两格继续保留。","“出于仁厚”和“违规矩”均为完整的介词、动宾结构，因此后两处分别补“于、规”。"]
    },
    "29":{
      category:"残损碑文恢复",title:"利□所同待考",corrected:"利□所同，必擇善以利物；",mode:"unresolved",confidence:"暂无法判断",
      analysis:["当前释文明确保存“利□所同”，缺字只能在“利”与“所同”之间判断。","其他录文常作“心之所同”，但采用该读法必须把现有“利”改成“心”，并不能单独证明“□”就是“之”。","在没有更清晰拓片字形前，不能通过改变原有文字来补足，因此继续保留“□”。"]
    },
    "30":{
      category:"残损碑文恢复",title:"德义为宫墙",corrected:"闢〔德〕義為〔宮牆〕，約以孝敬之道，移扵哲兄；",mode:"documentary",confidence:"高",
      analysis:["“德义”是并列的道德概念，缺字位于“辟”与“义”之间，补“德”后词义完整。","“宫墙”常用作屏障和范围的比喻，“以德义为宫墙”表示以道德自守。","第二组连续两个“□”与“宫墙”字数一致，故依次补“宫、墙”。"]
    },
    "31":{
      category:"残损碑文恢复",title:"洽于犹子",corrected:"行慈惠子心，〔洽〕扵猶子。",mode:"documentary",confidence:"高",
      analysis:["“洽”有遍及、普遍施予之义，“洽于犹子”表示慈惠遍及侄辈。","缺字位于句首动词位置，后接介词“于”和对象“犹子”，补“洽”后语法完整。","原有“子心”不在缺字符号位置，本例只恢复“洽”字。"]
    },
    "32":{
      category:"残损碑文恢复",title:"允□□□待考",corrected:"允□□□。",mode:"unresolved",confidence:"暂无法判断",
      analysis:["句中只保存“允”和三个缺字，缺少能够限定词性的后文，单靠“允”无法确定后三字。","其他录文有“允所谓朝廷之栋干”等较长结论，但长度远超过三个“□”，无法逐字映射到当前释文。","拓片残损区也没有足够笔画可以区分具体候选，因此三字暂不恢复。"]
    },
    "33":{
      category:"残损碑文恢复",title:"两楹之奠既兆",corrected:"兩楹之奠既〔兆〕□，豎之灾忘扵舉能；",mode:"mixed",confidence:"分项判断",
      analysis:["“两楹之奠”用孔子梦见自己奠于两楹之间的典故预示死亡，后接“既兆”表示死亡征兆已经显现。","第一个缺字补“兆”后典故和句法均成立。","原处连续两个“□”，相关录文只直接支持一个“兆”字，第二格及后面的残句不能逐字确定，故继续保留。"]
    },
    "34":{
      category:"残损碑文恢复",title:"护丧、令官给与给之",corrected:"扵斯一揆，六月詔民部尚書莒國公唐儉、工部侍郎盧義恭護〔喪〕，行中書□之側，并給東園秘噐，賻贈二千段，喪葬所湏，並〔令〕官給〔之〕□也。",mode:"mixed",confidence:"分项判断",
      analysis:["“护丧”是奉诏主持、护送丧事的固定词语，唐俭、卢义恭之后接此职责，故第一处补“丧”。","“并令官给”是诏令中常见结构，说明丧葬所需由官府供给，因此补“令”。","“官给之也”可由“给之”构成动宾关系，但原处有两个“□”，只能确认首字“之”；“行中书□之侧”涉及长段错接，继续保留。"]
    },
    "35":{
      category:"残损碑文恢复",title:"凤沼",corrected:"宻勿鸞閣，便繁鳳〔沼〕□。",mode:"mixed",confidence:"分项判断",
      analysis:["“凤沼”是对中书省等宫廷官署环境的华美称谓，与前面的“鸾阁”形成鸟类祥瑞意象的对举。","相关录文保存“密勿鸾阁，便繁凤沼”，故连续两个缺字中的首字可判断为“沼”。","现有释文多出第二个“□”，没有独立文字可以与之对应，因此继续保留。"]
    },
    "36":{
      category:"残损碑文恢复",title:"一水逝黄、光沈赵",corrected:"一〔水〕逝〔黄〕，陂光〔沈〕趙曰：稅駕天府，夷體泉室；",mode:"documentary",confidence:"中高",
      analysis:["“一水”以河流比喻生命流逝，第一处补“水”后成为完整名词结构。","相关录文保存“一水逝黄陂，光沈赵日”，现有释文的列序和标点发生错接；在不改变已有文字的前提下，三个缺字可依次判断为“水、黄、沈”。","“曰”属于现有文字而非缺字符号，本例不把它改成“日”。"]
    },
    "37":{
      category:"残损碑文恢复",title:"麟阁图形",original:"麟閣□形",corrected:"麟閣〔圖〕形",mode:"documentary",confidence:"高",highlight:"麟閣□形",
      analysis:["“图形”在古文中可指绘制人物形象，“麟阁图形”即把功臣画像绘于麒麟阁。","缺字位于“麟阁”与“形”之间，补“图”后构成固定的历史典故表达。","相关录文明确保存“麟阁图形”，且当前拓片逐字位置可找到这一缺字，故判断为“圖”。"]
    },
    "38":{
      category:"残损碑文恢复",title:"配天箕毕",original:"维地河山，□天箕毕。",corrected:"维地河山，〔配〕天箕毕。",mode:"provisional",confidence:"低至中",highlight:"维地河山，□天箕毕",locationNote:"本句属于碑末续录，当前逐字坐标中未保存“□天箕毕”的可靠字形，因此不设置虚构红框。",
      analysis:["“河山”属于地上事物，“箕、毕”是天上星宿，前后形成地与天的对应。","“配天”是碑铭中称颂功德与天相配的常见表达，补“配”后成为“维地河山，配天箕毕”。","由于现有拓片没有保存可辨的缺字笔画，“丽、列”等候选尚不能完全排除，因此仅作低至中置信度暂拟。"]
    }
  };

  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const clone=value=>JSON.parse(JSON.stringify(value));
  const setMenuTitle=(index,title)=>{const link=document.querySelector(`.side a:nth-of-type(${index})`);if(link&&link.textContent!==title)link.textContent=title;};
  const paragraphHtml=text=>String(text||"").replace(/\r\n?/g,"\n").split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean).map(s=>`<p>${esc(s)}</p>`).join("");
  const plainRestored=value=>String(value||"").replace(/[〔〕]/g,"");

  function markedHtml(value){
    const text=String(value||"");let html="",cursor=0,match;
    const pattern=/〔([^〕]*)〕/g;
    while((match=pattern.exec(text))){
      html+=esc(text.slice(cursor,match.index));
      html+=`<span class="damage-added">〔${esc(match[1])}〕</span>`;
      cursor=match.index+match[0].length;
    }
    return html+esc(text.slice(cursor));
  }

  function reviseCases(rawCases){
    const cases=(Array.isArray(rawCases)?rawCases:[]).filter(item=>item.id!=="01").map(item=>{
      const sourceId=String(item.id||"").padStart(2,"0");
      const merged={...clone(item),...clone(OVERRIDES[sourceId]||{})};
      merged.sourceId=sourceId;
      merged.original=String(merged.original||"");
      merged.corrected=String(merged.corrected||merged.original);
      merged.analysis=Array.isArray(merged.analysis)?merged.analysis:[];
      merged.category=merged.category||"残损碑文恢复";
      merged.title=merged.title||`第${sourceId}处缺字`;
      merged.mode=merged.mode||"provisional";
      merged.confidence=merged.confidence||"低至中";
      return merged;
    });
    cases.forEach((item,index)=>{
      item.id=String(index+1).padStart(2,"0");
      item.n=item.category;
      item.t=item.title;
      item.o=item.original;
      item.c=item.corrected;
      item.page=item.page||"—";
      item.original=item.o;
      item.corrected=item.c;
      item.analysis=[...(item.analysis||[])];
    });
    return cases;
  }

  function highlightTranscript(root,cases){
    const phrases=cases.map(item=>item.highlight||item.original).filter(Boolean).sort((a,b)=>b.length-a.length);
    root.querySelectorAll("p").forEach(paragraph=>{
      const text=paragraph.textContent||"",matches=[];
      phrases.forEach(phrase=>{let from=0;while(from<text.length){const index=text.indexOf(phrase,from);if(index<0)break;matches.push({index,end:index+phrase.length});from=index+phrase.length;}});
      if(!matches.length)return;
      matches.sort((a,b)=>a.index-b.index||b.end-a.end);
      const accepted=[];let cursor=-1;
      matches.forEach(match=>{if(match.index>=cursor){accepted.push(match);cursor=match.end;}});
      const fragment=document.createDocumentFragment();let offset=0;
      accepted.forEach(match=>{if(match.index>offset)fragment.appendChild(document.createTextNode(text.slice(offset,match.index)));const strong=document.createElement("strong");strong.className="transcript-problem-sentence";strong.textContent=text.slice(match.index,match.end);fragment.appendChild(strong);offset=match.end;});
      if(offset<text.length)fragment.appendChild(document.createTextNode(text.slice(offset)));
      paragraph.replaceChildren(fragment);
    });
  }

  async function renderTranscript(cases){
    const section=document.getElementById("calligraphy");if(!section)return;
    setMenuTitle(2,"二、碑文释文");
    section.className="content-card full-transcript-section";
    section.innerHTML=`<h2 class="section-title">二、碑文释文</h2><p class="full-transcript-note">${NOTE}</p><div class="full-transcript-card"><div class="full-transcript-loading">正在读取碑文释文……</div></div>`;
    const card=section.querySelector(".full-transcript-card");
    try{
      const response=await fetch(TEXT_URL,{cache:"no-store"});if(!response.ok)throw new Error(`${TEXT_URL} ${response.status}`);
      card.innerHTML=`<header class="full-transcript-header"><h3>${WORK_TITLE}</h3><span class="full-transcript-ornament" aria-hidden="true"></span></header><div class="full-transcript-body">${paragraphHtml(await response.text())}</div>`;
      highlightTranscript(card,cases);
    }catch(error){console.warn("[work-005] transcript",error);card.innerHTML='<div class="full-transcript-error">碑文释文暂时无法读取，请刷新页面后重试。</div>';}
  }

  const normalizeMap={"僕":"仆","㒒":"仆","國":"国","職":"职","靈":"灵","傑":"杰","嶽":"岳","楨":"桢","逺":"远","遠":"远","緒":"绪","晉":"晋","陽":"阳","綴":"缀","廟":"庙","翹":"翘","紳":"绅","轍":"辙","榮":"荣","間":"间","優":"优","徳":"德","聖":"圣","賔":"宾","賓":"宾","辭":"辞","斂":"敛","鳳":"凤","鸞":"鸾","閣":"阁","毀":"毁","順":"顺","暢":"畅","禍":"祸","潰":"溃","華":"华","蕩":"荡","寵":"宠","勳":"勋","餌":"饵","飣":"饵","單":"单","於":"于","扵":"于","鳥":"鸟","烏":"乌","圖":"图","宻":"密","髙":"高","乗":"乘","莭":"节","眀":"明","㓛":"功","終":"终","逹":"达","徴":"征","屬":"属","獫":"猃","縱":"纵","萬":"万","編":"编","澤":"泽","稱":"称","鴻":"鸿","囬":"回","驥":"骥","馳":"驰","簡":"简","冊":"册","肅":"肃","絲":"丝","綸":"纶","欽":"钦","憲":"宪","厯":"历","寬":"宽","損":"损","義":"义","違":"违","闢":"辟","牆":"墙","約":"约","猶":"犹","兩":"两","豎":"竖","顔":"颜","唘":"启","護":"护","書":"书","儉":"俭","側":"侧","給":"给","園":"园","噐":"器","賻":"赙","贈":"赠","喪":"丧","湏":"须","並":"并"};
  const normChar=ch=>normalizeMap[ch]||ch;
  const cleanChars=value=>Array.from(String(value||"")).filter(ch=>!/[\s，。；：、？！“”‘’（）《》【】\-—……,.!?;:]/.test(ch)).map(normChar);
  const rectOf=box=>({x:Number(box.bbox_x??box.x??box.bbox?.[0]??0),y:Number(box.bbox_y??box.y??box.bbox?.[1]??0),w:Number(box.bbox_w??box.w??box.bbox?.[2]??0),h:Number(box.bbox_h??box.h??box.bbox?.[3]??0)});

  let pageListPromise=null;
  function getPageList(){
    if(!pageListPromise)pageListPromise=fetch(PAGE_INDEX_URL,{cache:"force-cache"}).then(response=>{if(!response.ok)throw new Error(String(response.status));return response.json();}).then(data=>Array.isArray(data?.works?.["005"]?.pages)?data.works["005"].pages:[]);
    return pageListPromise;
  }

  function firstPatterns(original){
    const chars=cleanChars(original),start=chars.indexOf("□");
    if(start<0)return[];
    let end=start+1;while(end<chars.length&&chars[end]==="□")end+=1;
    const patterns=[];
    [[8,8],[7,7],[6,6],[5,5],[4,4],[3,3],[2,5],[5,2],[2,2],[1,4],[4,1],[1,1]].forEach(([leftCount,rightCount])=>{
      const pattern=[...chars.slice(Math.max(0,start-leftCount),start),...Array(end-start).fill("."),...chars.slice(end,Math.min(chars.length,end+rightCount))];
      if(pattern.filter(char=>char!==".").length)patterns.push(pattern);
    });
    return patterns;
  }

  function matchPage(boxes,patterns){
    const chars=boxes.map(box=>normChar(box.char||box.text||""));
    for(const pattern of patterns){
      for(let start=0;start<=chars.length-pattern.length;start+=1){
        let matched=true;
        for(let index=0;index<pattern.length;index+=1){if(pattern[index]!=="."&&pattern[index]!==chars[start+index]){matched=false;break;}}
        if(!matched)continue;
        for(let index=0;index<pattern.length;index+=1){if(pattern[index]===".")return boxes[start+index];}
      }
    }
    return null;
  }

  function makeLocation(page,boxes,selected){
    const rect=rectOf(selected);if(rect.w<=0||rect.h<=0)return null;
    const first=boxes[0],canvas={w:Number(first.canvas_width||1466),h:Number(first.canvas_height||2228)};
    const pad=12,target={x:Math.max(0,rect.x-pad),y:Math.max(0,rect.y-pad),w:Math.min(canvas.w,rect.w+pad*2),h:Math.min(canvas.h,rect.h+pad*2)};
    const cropWidth=Math.min(canvas.w,Math.max(460,target.w+380));
    const cropHeight=Math.min(canvas.h,Math.max(900,target.h+660));
    const crop={x:Math.max(0,Math.min(canvas.w-cropWidth,target.x+target.w/2-cropWidth/2)),y:Math.max(0,Math.min(canvas.h-cropHeight,target.y+target.h/2-cropHeight/2)),w:cropWidth,h:cropHeight};
    return {page:Number(page.page||page.canvas_index||0),image:page.image,canvas,crop,target};
  }

  const locationCache=new Map();
  const locationJobs=new Map();
  async function locateCase(item){
    if(item.locationNote)return[];
    if(locationCache.has(item.id))return locationCache.get(item.id);
    if(locationJobs.has(item.id))return locationJobs.get(item.id);
    const job=(async()=>{
      const pages=await getPageList(),patterns=firstPatterns(item.original);
      if(!patterns.length)return[];
      for(const page of pages){
        const pageNo=Number(page.page||page.canvas_index||0);if(!pageNo)continue;
        try{
          const response=await fetch(`data/glyph_boxes/iiif/005/page_${String(pageNo).padStart(4,"0")}.json?v=20260721_yugonggong_firstbox_v1`,{cache:"force-cache"});
          if(!response.ok)continue;
          const boxes=(await response.json()).slice().sort((a,b)=>Number(a.order_in_page||0)-Number(b.order_in_page||0));
          const selected=matchPage(boxes,patterns);if(!selected)continue;
          const location=makeLocation(page,boxes,selected);
          if(location){
            item.page=location.page;
            item.locations=[{page:location.page,bbox:{...location.target}}];
            locationCache.set(item.id,[location]);
            syncGlobalCases();
            return[location];
          }
        }catch(_){ }
        await new Promise(resolve=>setTimeout(resolve,0));
      }
      locationCache.set(item.id,[]);return[];
    })().finally(()=>locationJobs.delete(item.id));
    locationJobs.set(item.id,job);return job;
  }

  function imageHtml(item){
    const locations=locationCache.get(item.id);
    if(item.locationNote)return`<div class="damage-location-missing"><p>${esc(item.locationNote)}</p></div>`;
    if(!locations)return'<div class="damage-location-missing damage-location-loading"><p>正在读取本句第一个问题字的拓片局部……</p></div>';
    if(!locations.length)return'<div class="damage-location-missing"><p>现有逐字坐标中暂未可靠定位本句第一个问题字。系统不会使用无关字形代替，请在栏目一按原句继续核对。</p></div>';
    const location=locations[0];
    return`<div class="damage-viewport" data-image="${esc(location.image)}" title="双击查看原始拓片"><svg class="damage-crop-svg" viewBox="${location.crop.x} ${location.crop.y} ${location.crop.w} ${location.crop.h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(item.title)}对应拓片局部"><image href="${esc(location.image)}" x="0" y="0" width="${location.canvas.w}" height="${location.canvas.h}" preserveAspectRatio="none"></image><rect class="damage-box" x="${location.target.x}" y="${location.target.y}" width="${location.target.w}" height="${location.target.h}"></rect></svg></div><p class="damage-caption">《${WORK_TITLE}》第${location.page}页，本句第一个问题字局部</p>`;
  }

  const resultLabel=item=>item.mode==="documentary"?"文献对校结果":item.mode==="unresolved"?"暂未恢复":item.mode==="mixed"?"部分恢复":"AI暂拟补全";
  const confidenceLabel=value=>["分项判断","暂无法判断"].includes(String(value||""))?String(value):`${value}置信度`;

  let cases=[],current=0,expanded=false,listScrollTop=0,renderToken=0,rendering=false;
  function syncGlobalCases(){
    window.DAMAGE_AI_CASES=cases.map(item=>({
      ...clone(item),n:item.category,t:item.title,o:item.original,c:item.corrected,
      category:item.category,title:item.title,original:item.original,corrected:item.corrected,
      analysis:[...(item.analysis||[])],page:item.page||"—"
    }));
    window.dispatchEvent(new CustomEvent("work-005-cases-ready",{detail:{count:cases.length}}));
  }

  const tabs=()=>cases.map((item,index)=>`<button class="damage-tab${index===current?" active":""}" data-case-index="${index}" type="button" aria-pressed="${index===current}"><b>${esc(item.id)}</b><span class="name">${esc(item.category)}</span></button>`).join("");
  function panel(item){
    const evidence=(item.analysis||[]).map(line=>`<li>${esc(line)}</li>`).join("");
    return`<div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${cases.length}</span><div class="damage-heading">${esc(item.category)}——“${esc(item.title)}” <span class="damage-heading-confidence">（${esc(confidenceLabel(item.confidence))}）</span></div><div class="damage-pager"><button data-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${cases.length}</span><button data-action="next" type="button" ${current===cases.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list" aria-label="碑文残损与AI释读案例">${tabs()}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${imageHtml(item)}</section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别（OCR结果）</span><div class="damage-text">${esc(item.original)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">${resultLabel(item)}</span><div class="damage-text damage-new">${markedHtml(item.corrected)}</div></div><div class="damage-block"><span class="damage-label">恢复后的上下文</span><div class="damage-restored">${esc(plainRestored(item.corrected))}</div></div><div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><div class="damage-evidence${expanded?" open":""}"><ol>${evidence}</ol><p><strong>建议置信度：</strong>${esc(item.confidence)}</p></div><button class="damage-expand" data-action="expand" type="button">${expanded?"收起内容⌃":"展开更多⌄"}</button></div></div></section></div></div>`;
  }

  function renderDamage(){
    const section=document.getElementById("people");if(!section||!cases.length)return;
    rendering=true;
    const token=++renderToken,item=cases[current];
    setMenuTitle(3,"三、碑文残损与AI释读");
    syncGlobalCases();
    section.className="content-card damage-ai";
    section.dataset.work005Dedicated="true";
    section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell">${panel(item)}</div>`;
    const list=section.querySelector(".damage-list");
    if(list){list.scrollTop=listScrollTop;list.addEventListener("scroll",()=>{listScrollTop=list.scrollTop;},{passive:true});requestAnimationFrame(()=>list.querySelector(".damage-tab.active")?.scrollIntoView({block:"nearest"}));}
    section.querySelectorAll("[data-case-index]").forEach(button=>button.addEventListener("click",()=>{current=Number(button.dataset.caseIndex)||0;expanded=false;renderDamage();}));
    section.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>{const action=button.dataset.action;if(action==="prev"&&current>0)current-=1;else if(action==="next"&&current<cases.length-1)current+=1;else if(action==="expand")expanded=!expanded;renderDamage();}));
    section.querySelector(".damage-viewport[data-image]")?.addEventListener("dblclick",event=>{if(typeof window.openZoom==="function")window.openZoom(event.currentTarget.dataset.image);});
    rendering=false;

    if(!item.locationNote&&!locationCache.has(item.id)){
      setTimeout(()=>locateCase(item).then(()=>{if(token===renderToken&&cases[current]===item)renderDamage();}).catch(error=>console.warn("[work-005] locate",error)),120);
    }
  }

  function ensureStyle(){
    if(document.getElementById("work005-dedicated-style"))return;
    const style=document.createElement("style");style.id="work005-dedicated-style";
    style.textContent=`.damage-heading-confidence{font-size:.78em;color:#675b4e;white-space:nowrap}.damage-text.damage-new{color:#2e251e!important;font-weight:400!important}.damage-added{padding:0 .12em;border-bottom:2px solid #a53529;border-radius:4px;background:#f8e1cf;color:#9f3025!important;font-weight:900}.damage-location-missing{padding:28px;border:1px dashed #d8c69f;border-radius:14px;background:#fffaf0;color:#7b6c5a}.damage-location-loading{min-height:260px;display:flex;align-items:center;justify-content:center}.damage-basis-block,.damage-basis-card,[data-damage-basis]{display:none!important}`;
    document.head.appendChild(style);
  }

  async function init(){
    ensureStyle();
    const damage=document.getElementById("people");
    if(damage)damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-loading">正在读取《${WORK_TITLE}》释读案例……</div></div>`;
    try{
      const response=await fetch(CASE_URL,{cache:"no-store"});if(!response.ok)throw new Error(`${CASE_URL} ${response.status}`);
      cases=reviseCases(await response.json());
      renderTranscript(cases);
      renderDamage();
      window.__WORK_005_CONTENT_READY__=true;
      window.dispatchEvent(new CustomEvent("work-005-content-ready"));

      const section=document.getElementById("people");
      if(section){
        const observer=new MutationObserver(()=>{
          if(rendering)return;
          const generic=section.textContent?.includes("当前原释文包含")||section.textContent?.includes("其他录文仅作为判断缺字候选")||section.querySelector(".damage-basis-block,.damage-basis-card,[data-damage-basis]");
          if(section.dataset.work005Dedicated!=="true"||generic)renderDamage();
        });
        observer.observe(section,{childList:true,subtree:true});
        setTimeout(()=>observer.disconnect(),15000);
      }
    }catch(error){
      console.error("[work-005]",error);
      if(damage)damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-error">《${WORK_TITLE}》释读案例暂时无法读取，请刷新页面后重试。</div></div>`;
    }
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();