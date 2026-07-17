/*
 * 前四件碑帖栏目三证据审核层。
 * 有直接资料时采用文献对校；无直接资料时保留AI候选，并明确标注为语境暂拟。
 * 本脚本应在碑帖专属内容模块之前加载，以避免先显示未经审核的结果。
 */
(function(){
  "use strict";
  if(window.__DAMAGE_CASE_AUDIT_V2__) return;
  window.__DAMAGE_CASE_AUDIT_V2__=true;

  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  const clone=value=>JSON.parse(JSON.stringify(value));

  function documentary(item,extra){
    return {...item,...extra,basisMode:"documentary",recoveryBasisType:extra.recoveryBasisType||"文献对校",sourceFinding:extra.sourceFinding||extra.recoveryBasis||"已找到可直接支持本例的旧拓、著录或可靠录文。",usageNote:"本例依据可核验资料校勘，不属于仅凭上下文生成的AI补字。"};
  }

  function provisional(item,sourceFinding,extra={}){
    const proposal=String(extra.c??item.c??item.o??"");
    const context=String(extra.r??item.r??proposal);
    return {...item,...extra,n:extra.n||item.n||"残损碑文恢复",nav:extra.nav||"AI暂拟",c:proposal,r:context,confidence:extra.confidence||item.confidence||"低",basisMode:"ai_provisional",recoveryBasisType:"未见直接录文 · AI语境暂拟",sourceFinding,recoveryBasis:sourceFinding,aiProposal:proposal,usageNote:"〔〕内文字仅为AI辅助候选，不代表已经从原拓辨认出原字；栏目二继续保留原缺字、问号或残损部件。",e:Array.isArray(extra.e)?extra.e:(Array.isArray(item.e)?item.e:[])};
  }

  function apply001(cases){
    return cases.map(item=>{
      if(Number(item.page)===56)return documentary(item,{n:"古字识别",s:"“𢂀”字恢复",c:"循堂室而濡涕，对几〔𢂀〕而流恸。",r:"弟子玄凝等，禀训餐风，斯称上足。而以慈灯罢照，崇山无仰。循堂室而濡涕，对几〔𢂀〕而流恸。",confidence:"高",recoveryBasisType:"金石著录对校",sourceFinding:"《金石萃编》所录《道因法师碑》明确作“对几𢂀而流恸”，并与当前拓片字位及上下文相合。",e:["该字在拓片中有实际字位，并非根据语境补出的缺字。","《金石萃编》录文明确保存“对几𢂀而流恸”。","“𢂀”为生僻字，常规OCR与输入法容易漏识。","本案属于古字识别，可作为高置信度释读。"]});
      if(Number(item.page)===19)return documentary(item,{n:"形近字纠错",s:"“丱”字识别",c:"逮乎初〔丱〕，方蒙落发。",r:"逮乎初〔丱〕，方蒙落发。",confidence:"高",recoveryBasisType:"多来源录文对校",sourceFinding:"多种《道因法师碑》全文录文均作“逮乎初丱，方蒙落发”；“丱”表示童年，与出家语境相合。",e:["拓片原字与“卝”形近，OCR容易混淆。","多种全文录文均保存“初丱”。","“丱”可指童年时期，与“方蒙落发”语义连贯。","本案属于形近字纠错，不是缺字猜测。"]});
      if(Number(item.page)===63)return provisional(item,"现有《全唐文》系统录文在此处同样标为“沦羲（阙五字）光”，没有保存中间五字；目前未查到能够直接确认这五字的可靠旧拓或金石著录。",{s:"铭辞五字AI暂拟",t:"残损碑文恢复——铭辞五字AI暂拟",c:"沦羲〔晦曜〕，〔慧日无〕光。",r:"沦羲〔晦曜〕，〔慧日无〕光。",confidence:"低",e:["当前拓本在“沦羲”与“光”之间缺五字。","“羲”“曜”“慧日”“光”可构成光明意象。","“晦曜”“慧日无光”符合悼念法师圆寂的铭辞语境。","补字数量与缺字数相合，但没有直接字形或文献证明，因此仅作低置信度候选。"]});
      return item;
    });
  }

  function apply002(cases){
    return cases.map(item=>{
      if(Number(item.page)===7)return documentary(item,{n:"古字识别",s:"“𩥉”字对校",c:"自天王以下，至于初学，莫不〔𩥉〕思，叹卬师镜。",confidence:"中高",recoveryBasisType:"旧录与馆藏录文对校",sourceFinding:"北宋洪适《隶释》系统录文作“莫不𩥉思”；台北故宫数字档案另录作“驥思”，说明该字存在异体或释读分歧，网站暂从《隶释》字形并保留异文说明。",e:["该位置有实际碑字，不属于碑面空缺。","《隶释》录作“𩥉”，可为当前释读提供直接文献依据。","台北故宫数字档案录作“驥”，提示不同录文存在差异。","因此保留“𩥉”，置信度定为中高而非绝对确定。"]});
      if(Number(item.page)===13)return documentary(item,{n:"残损碑文恢复",s:"“壶”字补录",c:"君于是造立礼器，乐之音符，钟磬瑟鼓，雷洗觞觚，爵鹿柤梪，笾柉禁〔壶〕，修饰宅庙。",r:"君于是造立礼器，乐之音符，钟磬瑟鼓，雷洗觞觚，爵鹿柤梪，笾柉禁〔壶〕。修饰宅庙，更作二舆，朝车威熹。",confidence:"高",recoveryBasisType:"多来源全文对校",sourceFinding:"《隶释》与台北故宫《汉礼器碑墨拓本》数字录文均保存“籩柉禁壺”，可确认“禁”后有“壶”字。",e:["上下文连续列举礼器名称。","《隶释》明确录作“籩柉禁壺”。","台北故宫数字档案同样录作“籩柉禁壺”。","多来源一致，故本案可作高置信度补录。"]});
      if(Number(item.page)===56)return provisional(item,"宋洪适《隶释》对应录文作“相史卞吕松远百”，没有保存中间一字；多种现代录文写作“卞吕松□远百”。目前未查到能够直接确认该字的可靠资料。",{s:"“子远”AI暂拟",t:"残损碑文恢复——“子远”AI暂拟",c:"相史卞吕松〔子〕远百。",r:"相中贼史薛虞韶兴公二百。薛弓奉高二百。相史卞吕松〔子〕远百。驺韦伯卿二百。",confidence:"低",e:["该题名可按“官职＋姓名／籍贯＋表字＋捐资额”的结构理解。","“吕松”可能是姓名，“□远”可能是两字表字。","同碑题名中可见“子高”“子长”“子慎”等以“子”开头的表字结构。","因此“子远”在命名结构上较为顺畅，但其他文字或无字的可能仍不能排除。"]});
      return item;
    });
  }

  function apply003(cases){
    return cases.map(item=>{
      const page=Number(item.page);
      if(page===39)return documentary(item,{n:"残损碑文恢复",s:"“王孝仙”人名恢复",c:"恒州刺史、鄂国公、金城王孝〔仙〕，世业重于金张。",r:"太师、上柱国、大威公之世子，使持节、左武卫将军、上开府仪同三司、恒州诸军事、恒州刺史、鄂国公、金城王孝〔仙〕，世业重于金张，器识逾于许郭。",confidence:"高",recoveryBasisType:"宋代金石著录对校",sourceFinding:"欧阳修《集古录》及后世《金石文考略》等均明确著录造寺者为“金城王孝仙”，可直接校复末字。",e:["缺字处位于完整人名“王孝□”。","欧阳修《集古录》明确录作“金城王孝仙”。","后世多种金石著录沿用并核实该人名。","文献证据一致，本案可作高置信度恢复。"]});
      if(page===65)return documentary(item,{n:"残损碑文恢复",s:"“张公礼撰”题署恢复",c:"齐开府长、兼行参军、九门张公礼之〔撰〕。",r:"开皇六年十二月五日题写。齐开府长、兼行参军、九门张公礼之〔撰〕。",confidence:"高",recoveryBasisType:"宋代金石著录对校",sourceFinding:"欧阳修《集古录》及《金石文考略》均明确记载“齐开府长兼行参军九门张公礼撰”，原网站补作“书”不符合著录，现改为“撰”。",e:["该句位于碑末题署。","欧阳修《集古录》明确著录张公礼为撰文者。","后世金石著录亦反复作“张公礼撰”。","因此撤销原“书”字猜测，恢复为“撰”。"]});
      const source="已检查可检索的《集古录》《金石文考略》及相关《龙藏寺碑》著录，现有资料没有提供本处缺字的完整逐字录文，尚不能直接确认缺字。";
      const map={11:{s:"“说法之主”AI暂拟",confidence:"低至中"},18:{s:"“持律沙门”AI暂拟",confidence:"低至中"},36:{s:String(item.o||"").startsWith("□□")?"“邯郸之落”AI暂拟":"“途通赵而指卫”AI暂拟",confidence:"低"},40:{s:"“领袖诸蕃”AI暂拟",confidence:"低"},53:{s:"“自然饮食”AI暂拟",confidence:"低至中"}};
      const extra=map[page]||{s:item.s||"缺字AI暂拟",confidence:"低"};
      return provisional(item,source,{...extra,t:`残损碑文恢复——${extra.s}`});
    });
  }

  function apply004(cases){
    return cases.map(item=>{
      const page=Number(item.page),original=String(item.o||"");
      if(page===85)return documentary(item,{n:"残损碑文恢复",nav:"文献对校",s:"“庚午九月、朔”恢复",t:"残损碑文恢复——“庚午九月、朔”恢复",c:"大唐开元十八年，岁次庚〔午九〕月壬子〔朔〕，十一日壬戌建。",r:"大唐开元十八年，岁次庚〔午九〕月壬子〔朔〕，十一日壬戌建。",confidence:"高",recoveryBasisType:"旧拓与全文录文对校",sourceFinding:"较完整旧拓及多种全文录文均作“开元十八年，岁次庚午九月壬子朔，十一日壬戌建”；原网站“正月”系误补，现改为“九月”。",e:["开元十八年为庚午年。","较完整旧拓与通行全文均保存“九月壬子朔”。","原先补作“正月”与旧拓录文不合。","据多来源一致文本，本案改为高置信度文献对校恢复。"]});
      if(page===87)return documentary(item,{n:"残损碑文恢复",nav:"文献对校",s:"“其德允烁”恢复",t:"残损碑文恢复——“其德允烁”恢复",c:"赞曰：英英披雾，其〔德允〕烁；卓立㑺寸，标举明略。",r:"赞曰：英英披雾，其〔德允〕烁；卓立㑺寸，标举明略。",confidence:"高",recoveryBasisType:"旧拓与金石著录对校",sourceFinding:"《古泉山馆金石跋》记旧翻刻足本作“其德允烁”，并指出残石尚可见“德允”部分；多种完整录文亦一致。原“华灼”为无文献依据的AI生成，现删除。",e:["当前拓本在“其”与“烁”之间缺两字。","旧翻刻足本和多种全文录文均作“其德允烁”。","金石跋语还记载残石中“德允”部分可辨。","原补“华灼”缺乏著录支持，现改为“德允”。"]});
      let source="已核对现有旧拓题跋、金石著录和可检索全文。本处多为碑阴人名、官衔或大段漫漶文字，现有资料未保存能够直接确认全部缺字的完整录文。";
      let extra={s:item.s||"缺字AI暂拟",t:`残损碑文恢复——${item.s||"缺字AI暂拟"}`,confidence:item.confidence||"低"};
      if(page===94&&original.includes("有力豊碑")){source="现有旧拓题跋只能确认“有力豊碑”“克”“祀”等残存文字，没有保存完整句子；目前未查到直接支持全部四个缺字的资料。";extra={s:"“克昌百祀无疆”AI暂拟",t:"残损碑文恢复——祝颂残句AI暂拟",confidence:"低至中"};}
      else if(page===97&&original.includes("众木")){source="当前拓片只保留一个残损部件，现有旧录在这一处也存在残缺或异读；目前未查到能够直接证明完整字为“蔚”的资料。";extra={s:"“蔚众木”AI暂拟",t:"残损碑文恢复——“蔚众木”AI暂拟",confidence:"低至中"};}
      else if(page===99&&original.includes("刘员外"))extra={s:"“刘员外同正”AI暂拟",t:"残损碑文恢复——“刘员外同正”AI暂拟",confidence:"低至中"};
      else if(page===103&&original.includes("□城宰"))extra={s:"“武城宰”AI暂拟",t:"残损碑文恢复——“武城宰”AI暂拟",confidence:"低至中"};
      return provisional(item,source,extra);
    });
  }

  function audit(cases){if(!Array.isArray(cases))return cases;if(workId==="001")return apply001(cases);if(workId==="002")return apply002(cases);if(workId==="003")return apply003(cases);if(workId==="004")return apply004(cases);return cases;}
  let store,dispatchQueued=false;
  function setCases(value){store=Array.isArray(value)?audit(clone(value)):value;window.__DAMAGE_CASE_AUDIT_READY__=true;if(!dispatchQueued){dispatchQueued=true;queueMicrotask(()=>{dispatchQueued=false;window.dispatchEvent(new CustomEvent("damage-case-audit-ready",{detail:{workId,count:Array.isArray(store)?store.length:0}}));});}}
  const existing=window.DAMAGE_AI_CASES;
  try{Object.defineProperty(window,"DAMAGE_AI_CASES",{configurable:true,enumerable:true,get(){return store;},set:setCases});if(existing!==undefined)setCases(existing);}catch(_){window.auditDamageCases=value=>audit(clone(value));if(existing!==undefined)window.DAMAGE_AI_CASES=audit(clone(existing));}
  window.auditDamageCases=value=>audit(clone(value));
})();
