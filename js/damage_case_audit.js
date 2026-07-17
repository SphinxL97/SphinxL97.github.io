/*
 * 前四件碑帖栏目三证据审核层。
 * 原则：字形、旧拓与金石著录优先；找不到可靠对校依据时，撤销纯语境猜测并保留缺字。
 */
(function(){
  "use strict";
  if(window.__DAMAGE_CASE_AUDIT_V1__) return;
  window.__DAMAGE_CASE_AUDIT_V1__=true;

  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  const clone=value=>JSON.parse(JSON.stringify(value));
  const originalSnapshots=new Map();

  function unresolved(item,basis,extra={}){
    const original=String(item.o||"");
    return {
      ...item,
      n:"残损碑文恢复",
      nav:"保留缺字",
      s:extra.s||"缺字暂不恢复",
      t:extra.t||"残损碑文恢复——缺字暂不恢复",
      c:extra.c||original,
      r:extra.r||original,
      confidence:extra.confidence||"暂无法判断",
      recoveryBasisType:extra.recoveryBasisType||"文献对校后保留缺字",
      recoveryBasis:basis,
      e:extra.e||[
        "已核对当前拓片可见字形及可检索的旧拓、金石著录和通行录文。",
        "现有证据不足以唯一确定缺失文字，继续按语义补写会造成无依据的文本生成。",
        "本次撤销原先的纯AI猜测，栏目二与栏目三均保留原缺字或原始部件。",
        "待取得更清晰旧拓、馆藏著录或可靠校勘成果后再行修订。"
      ]
    };
  }

  function apply001(cases){
    return cases.map(item=>{
      if(Number(item.page)===56){
        return {...item,n:"古字识别",s:"“𢂀”字恢复",c:"循堂室而濡涕，对几〔𢂀〕而流恸。",r:"弟子玄凝等，禀训餐风，斯称上足。而以慈灯罢照，崇山无仰。循堂室而濡涕，对几〔𢂀〕而流恸。",confidence:"高",recoveryBasisType:"金石著录对校",recoveryBasis:"《金石萃编》所录《道因法师碑》明确作“对几𢂀而流恸”，并与当前拓片字位及上下文相合。",e:["该字在拓片中有实际字位，并非根据语境补出的缺字。","《金石萃编》录文明确保存“对几𢂀而流恸”。","“𢂀”为生僻字，常规OCR与输入法容易漏识。","本案属于古字识别，可作为较高置信度释读。"]};
      }
      if(Number(item.page)===19){
        return {...item,n:"形近字纠错",s:"“丱”字识别",c:"逮乎初〔丱〕，方蒙落发。",r:"逮乎初〔丱〕，方蒙落发。",confidence:"高",recoveryBasisType:"多来源录文对校",recoveryBasis:"多种《道因法师碑》全文录文均作“逮乎初丱，方蒙落发”；“丱”表示童年，与出家语境相合。",e:["拓片原字与“卝”形近，OCR容易混淆。","多种全文录文均保存“初丱”。","“丱”可指童年时期，与“方蒙落发”语义连贯。","本案属于形近字纠错，不是缺字猜测。"]};
      }
      if(Number(item.page)===63){
        return unresolved(item,"现有《全唐文》系统录文在此明确标为“沦羲（阙五字）光”，未保存“晦曜、慧日无”等五字；未找到足以证明原AI补文的可靠旧拓或金石著录。",{s:"铭辞五字阙文",t:"残损碑文恢复——铭辞五字阙文",e:["当前拓本在“沦羲”与“光”之间缺五字。","《全唐文》系统录文同样标记为阙五字，没有给出确定文字。","原先“晦曜，慧日无”主要依据语义生成，缺少直接文献和字形证据。","本次撤销该补文，保留缺字，等待更完整旧拓核验。"]});
      }
      return item;
    });
  }

  function apply002(cases){
    return cases.map(item=>{
      if(Number(item.page)===7){
        return {...item,n:"古字识别",s:"“𩥉”字对校",c:"自天王以下，至于初学，莫不〔𩥉〕思，叹卬师镜。",confidence:"中高",recoveryBasisType:"旧录与馆藏录文对校",recoveryBasis:"北宋洪适《隶释》系统录文作“莫不𩥉思”；台北故宫数字档案另录作“驥思”，说明该字存在异体或释读分歧，网站暂从《隶释》字形并保留异文说明。",e:["该位置有实际碑字，不属于碑面空缺。","《隶释》录作“𩥉”，可为当前释读提供直接文献依据。","台北故宫数字档案录作“驥”，提示不同录文存在差异。","因此保留“𩥉”，置信度定为中高而非绝对确定。"]};
      }
      if(Number(item.page)===13){
        return {...item,n:"残损碑文恢复",s:"“壶”字补录",c:"君于是造立礼器，乐之音符，钟磬瑟鼓，雷洗觞觚，爵鹿柤梪，笾柉禁〔壶〕，修饰宅庙。",r:"君于是造立礼器，乐之音符，钟磬瑟鼓，雷洗觞觚，爵鹿柤梪，笾柉禁〔壶〕。修饰宅庙，更作二舆，朝车威熹。",confidence:"高",recoveryBasisType:"多来源全文对校",recoveryBasis:"《隶释》与台北故宫《汉礼器碑墨拓本》数字录文均保存“籩柉禁壺”，可确认“禁”后有“壶”字。",e:["上下文连续列举礼器名称。","《隶释》明确录作“籩柉禁壺”。","台北故宫数字档案同样录作“籩柉禁壺”。","多来源一致，故本案可作高置信度补录。"]};
      }
      if(Number(item.page)===56){
        return unresolved(item,"宋洪适《隶释》录作“相史卞吕松远百”，多种现代录文则保留为“卞吕松□远百”；未见可靠资料支持在其中补入“子”字。",{s:"“卞吕松□远”待考",t:"残损碑文恢复——“卞吕松□远”待考",e:["当前拓本与多种现代录文均在“松”与“远”之间保留缺字。","《隶释》对应录文直接作“卞吕松远百”，未见“子”字。","原先补作“子远”仅凭常见表字结构推测，不能排除其他文字或无字的可能。","本次删除“子”字猜测，继续保留缺字符号。"]});
      }
      return item;
    });
  }

  function apply003(cases){
    return cases.map(item=>{
      if(Number(item.page)===39){
        return {...item,n:"残损碑文恢复",s:"“王孝仙”人名恢复",c:"恒州刺史、鄂国公、金城王孝〔仙〕，世业重于金张。",r:"太师、上柱国、大威公之世子，使持节、左武卫将军、上开府仪同三司、恒州诸军事、恒州刺史、鄂国公、金城王孝〔仙〕，世业重于金张，器识逾于许郭。",confidence:"高",recoveryBasisType:"宋代金石著录对校",recoveryBasis:"欧阳修《集古录》及后世《金石文考略》等均明确著录造寺者为“金城王孝仙”，可直接校复末字。",e:["缺字处位于完整人名“王孝□”。","欧阳修《集古录》明确录作“金城王孝仙”。","后世多种金石著录沿用并核实该人名。","文献证据一致，本案可作高置信度恢复。"]};
      }
      if(Number(item.page)===65){
        return {...item,n:"残损碑文恢复",s:"“张公礼撰”题署恢复",c:"齐开府长、兼行参军、九门张公礼之〔撰〕。",r:"开皇六年十二月五日题写。齐开府长、兼行参军、九门张公礼之〔撰〕。",confidence:"高",recoveryBasisType:"宋代金石著录对校",recoveryBasis:"欧阳修《集古录》及《金石文考略》均明确记载“齐开府长兼行参军九门张公礼撰”，原网站补作“书”不符合著录，现改为“撰”。",e:["该句位于碑末题署。","欧阳修《集古录》明确著录张公礼为撰文者。","后世金石著录亦反复作“张公礼撰”。","因此撤销原“书”字猜测，恢复为“撰”。"]};
      }
      return unresolved(item,"已检查可检索的《集古录》《金石文考略》及相关龙藏寺碑著录，现有资料未提供本处缺字的完整逐字录文；当前候选主要来自句法、对偶或佛教常用语，不能据此视为确定释文。",{s:item.s||"缺字待考",t:`残损碑文恢复——${item.s||"缺字待考"}`});
    });
  }

  function apply004(cases){
    return cases.map(item=>{
      const page=Number(item.page);
      const original=String(item.o||"");
      if(page===85){
        return {...item,n:"残损碑文恢复",nav:"文献对校",s:"“庚午九月、朔”恢复",t:"残损碑文恢复——“庚午九月、朔”恢复",c:"大唐开元十八年，岁次庚〔午九〕月壬子〔朔〕，十一日壬戌建。",r:"大唐开元十八年，岁次庚〔午九〕月壬子〔朔〕，十一日壬戌建。",confidence:"高",recoveryBasisType:"旧拓与全文录文对校",recoveryBasis:"较完整旧拓及多种全文录文均作“开元十八年，岁次庚午九月壬子朔，十一日壬戌建”；原网站“正月”系误补，现改为“九月”。",e:["开元十八年为庚午年。","较完整旧拓与通行全文均保存“九月壬子朔”。","原先补作“正月”与旧拓录文不合。","据多来源一致文本，本案改为高置信度文献对校恢复。"]};
      }
      if(page===87){
        return {...item,n:"残损碑文恢复",nav:"文献对校",s:"“其德允烁”恢复",t:"残损碑文恢复——“其德允烁”恢复",c:"赞曰：英英披雾，其〔德允〕烁；卓立㑺寸，标举明略。",r:"赞曰：英英披雾，其〔德允〕烁；卓立㑺寸，标举明略。",confidence:"高",recoveryBasisType:"旧拓与金石著录对校",recoveryBasis:"《古泉山馆金石跋》记旧翻刻足本作“其德允烁”，并指出残石尚可见“德允”部分；多种完整录文亦一致。原“华灼”为无文献依据的AI生成，现删除。",e:["当前拓本在“其”与“烁”之间缺两字。","旧翻刻足本和多种全文录文均作“其德允烁”。","金石跋语还记载残石中“德允”部分可辨。","原补“华灼”缺乏任何著录支持，现改为“德允”。"]};
      }
      if(page===97&&original.includes("众木")){
        return unresolved(item,"台北故宫康熙拓本题跋释读、八琼室金石补正等资料在此处仅保存为“北/阙字＋众木繁林”等不完整状态，未发现支持“蔚”字的可靠著录；故恢复栏目二原部件并撤销“蔚”字猜测。",{s:"“众木”残字待考",t:"残损碑文恢复——“众木”残字待考",e:["当前拓片只保存残损部件，无法据字形确认完整汉字。","不同旧录在此处均显示残缺或异读，并未形成统一释文。","未找到可靠来源支持原先“蔚众木”的补法。","本次撤销“蔚”字，保留原部件字符等待旧拓进一步核验。"]});
      }
      if(page===94&&original.includes("有力豊碑")){
        return unresolved(item,"台北故宫康熙拓本题跋仅能确认“有力豊碑克祀”等残存文字，并注明该行有脱失；未见可靠旧录支持“克昌百祀无疆”的完整补法。",{s:"“有力豊碑，克□□祀□□”待考",t:"残损碑文恢复——祝颂残句待考",e:["旧拓题跋能够确认部分残字，但没有保存完整句子。","“克昌百祀无疆”符合祝颂语气，却缺少直接字形和著录依据。","语义通顺不能替代文献证据。","本次撤销完整补句，保留原缺字。"]});
      }
      return unresolved(item,"已核对现有旧拓题跋、金石著录和可检索全文。本处多为碑阴人名、官衔或大段漫漶文字，现有资料只保存零散可辨字，无法支持原先按常见姓名或句法生成的完整补文。",{s:item.s||"缺字待考",t:`残损碑文恢复——${item.s||"缺字待考"}`});
    });
  }

  function audit(cases){
    if(workId==="001") return apply001(cases);
    if(workId==="002") return apply002(cases);
    if(workId==="003") return apply003(cases);
    if(workId==="004") return apply004(cases);
    return cases;
  }

  function apply(){
    if(!Array.isArray(window.DAMAGE_AI_CASES)||!window.DAMAGE_AI_CASES.length) return false;
    const signature=window.DAMAGE_AI_CASES.map(item=>`${item.page}|${item.i}|${item.o}`).join("\u0001");
    if(originalSnapshots.get(workId)===signature&&window.__DAMAGE_CASE_AUDIT_READY__) return true;
    const audited=audit(clone(window.DAMAGE_AI_CASES));
    window.DAMAGE_AI_CASES=audited;
    originalSnapshots.set(workId,audited.map(item=>`${item.page}|${item.i}|${item.o}`).join("\u0001"));
    window.__DAMAGE_CASE_AUDIT_READY__=true;
    window.dispatchEvent(new CustomEvent("damage-case-audit-ready",{detail:{workId,count:audited.length}}));
    return true;
  }

  function start(){
    apply();
    let attempts=0;
    const timer=setInterval(()=>{
      attempts+=1;
      apply();
      if(attempts>=40) clearInterval(timer);
    },150);
    ["work-002-content-ready","work-003-content-ready","work-004-content-ready","work-004-page97-case-ready"].forEach(name=>window.addEventListener(name,()=>setTimeout(apply,0)));
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
