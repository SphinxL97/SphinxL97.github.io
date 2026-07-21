/* 作品003《龙藏寺碑》专属内容。
 * 直接渲染栏目二、三，并把同一批案例交给栏目四。
 * AI分析只说明为什么判断为当前候选字，不使用通用处理模板。
 */
(function(){
  "use strict";

  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
  if(parentId!=="003"||window.__WORK_003_LONGZANGSI_CONTENT__)return;
  window.__WORK_003_LONGZANGSI_CONTENT__=true;

  /* 旧路由可能仍尝试加载这些共享脚本。003必须完全使用自己的案例和分析。 */
  window.__DAMAGE_CASE_UNBRACKETED_ADAPTER__=true;
  window.__DAMAGE_CASE_INTEGRITY_V2__=true;
  window.__DAMAGE_CASE_PARTIAL_STATUS__=true;

  const WORK_TITLE="龙藏寺碑";
  const TEXT_URL="data/longzangsi_full_text.txt?v=20260716_longzangsi_v2";
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const INTRO="本栏目以当前网页释文为底稿，只对原释文中明确标出的缺字或疑难字提出校读意见。AI分析重点说明为什么判断为当前候选字，包括拓片字形、句法结构、对偶关系、人物地名与佛教用语等依据。";

  const CASES=[
    {
      i:"01",id:"01",n:"残损碑文恢复",category:"残损碑文恢复",t:"残损碑文恢复——“说□之□”",title:"说法之主",
      o:"释迦文非说□之□，须菩提岂证果之人？",original:"释迦文非说□之□，须菩提岂证果之人？",
      c:"释迦文非说〔法〕之〔主〕，须菩提岂证果之人？",corrected:"释迦文非说〔法〕之〔主〕，须菩提岂证果之人？",
      r:"若论乾闼之城皆妄，巴蕉之树尽空，应化讵真，权假宁实？释迦文非说法之主，须菩提岂证果之人？然则习因之指安归？求道之趣奚向？",
      image:"assets/page_images/003_龙藏寺碑/images/0011_十一.jpg",page:11,canvas:{w:1539,h:2250},crop:{x:600,y:760,w:330,h:1220},target:{x:640,y:1510,w:210,h:430},
      e:[
        "第一处缺字位于“说□”，在佛教语境中“说法”是表示宣讲佛法的固定搭配，能够直接承接主语“释迦文”。",
        "第二处缺字位于“之□”，后句对应位置为“之人”；补作“主”后形成“说法之主—证果之人”的同构对举。",
        "两处原释文各缺一字，“法”“主”分别与两个“□”一一对应，没有增加原句其他位置的文字。",
        "因此本例判断为“法、主”，核心依据是佛教固定用语和上下句句法对偶。"
      ],confidence:"中高"
    },
    {
      i:"02",id:"02",n:"残损碑文恢复",category:"残损碑文恢复",t:"残损碑文恢复——“持律□□”",title:"持律沙门",
      o:"护戒比丘，翻同雹草；持律□□，忽等霜莲。",original:"护戒比丘，翻同雹草；持律□□，忽等霜莲。",
      c:"护戒比丘，翻同雹草；持律〔沙门〕，忽等霜莲。",corrected:"护戒比丘，翻同雹草；持律〔沙门〕，忽等霜莲。",
      r:"李园之内，结其恶党；竹林之下，亡其善聚。护戒比丘，翻同雹草；持律沙门，忽等霜莲。慧殿仙宫，寂寥安在。",
      image:"assets/page_images/003_龙藏寺碑/images/0018_十八.jpg",page:18,canvas:{w:1539,h:2250},crop:{x:650,y:760,w:300,h:1050},target:{x:675,y:790,w:230,h:430},
      e:[
        "原句前半是“护戒比丘”，后半“持律□□”也需要一个两字僧侣称谓，才能形成相同的语法结构。",
        "“沙门”是佛教碑铭中常见的两字僧人称谓，与“比丘”词性相同，也正好对应连续两个“□”。",
        "补作“持律沙门”后，与“护戒比丘”形成“行为特征＋僧侣称谓”的对偶，后面的“雹草—霜莲”也保持对应。",
        "因此判断为“沙门”，依据是缺字数量、佛教称谓和全句对偶三者一致。"
      ],confidence:"中"
    },
    {
      i:"03",id:"03",n:"残损碑文恢复",category:"残损碑文恢复",t:"残损碑文恢复——“途通□而指卫”",title:"途通赵而指卫",
      o:"路款晋而适秦，途通□而指卫。",original:"路款晋而适秦，途通□而指卫。",
      c:"路款晋而适秦，途通〔赵〕而指卫。",corrected:"路款晋而适秦，途通〔赵〕而指卫。",
      r:"青山敛雾，绿水扬波。路款晋而适秦，途通赵而指卫。□□之落，矩步非遥；平原之楼，规行讵远。",
      image:"assets/page_images/003_龙藏寺碑/images/0036_三十六.jpg",page:36,canvas:{w:1539,h:2250},crop:{x:650,y:760,w:300,h:1220},target:{x:730,y:1535,w:180,h:220},
      e:[
        "缺字位于“通□而指卫”中，只缺一字，并且应当是能够与“卫”并列的地域名称。",
        "上句“晋—秦”列举两个古国名；下句补“赵”后，形成“晋秦—赵卫”两组古国名称的对应关系。",
        "龙藏寺所在区域与古赵地相近，“途通赵而指卫”也符合道路通向赵、卫方向的地理叙述。",
        "因此判断为“赵”，主要依据是单字缺位、古国名对举和地域语境。"
      ],confidence:"中"
    },
    {
      i:"04",id:"04",n:"残损碑文恢复",category:"残损碑文恢复",t:"残损碑文恢复——“□□之落”",title:"邯郸之落",
      o:"□□之落，矩步非遥；平原之楼，规行讵远。",original:"□□之落，矩步非遥；平原之楼，规行讵远。",
      c:"〔邯郸〕之落，矩步非遥；平原之楼，规行讵远。",corrected:"〔邯郸〕之落，矩步非遥；平原之楼，规行讵远。",
      r:"路款晋而适秦，途通□而指卫。邯郸之落，矩步非遥；平原之楼，规行讵远。寻泒避世，彼亦河人。",
      image:"assets/page_images/003_龙藏寺碑/images/0036_三十六.jpg",page:36,canvas:{w:1539,h:2250},crop:{x:470,y:760,w:300,h:1220},target:{x:515,y:1160,w:210,h:440},
      e:[
        "“□□之落”开头连续缺两字，语法上应是一个两字地名，用来修饰后面的“落”。",
        "前一句刚出现“赵”，邯郸是赵地最具代表性的都城名称，地理关系能够自然承接。",
        "后半句以“平原之楼”领起；补作“邯郸之落”后，两句都形成“地名＋之＋处所名词”的结构。",
        "因此两字暂判断为“邯郸”，主要依据是地名长度、赵地语境和上下句结构；因拓片残损较重，置信度仍较低。"
      ],confidence:"低"
    },
    {
      i:"05",id:"05",n:"历史人物识别",category:"历史人物识别",t:"历史人物识别——“王孝?”",title:"金城王孝仙",
      o:"恒州刺史、鄂国公、金城王孝?，世业重于金张。",original:"恒州刺史、鄂国公、金城王孝?，世业重于金张。",
      c:"恒州刺史、鄂国公、金城王孝〔仙〕，世业重于金张。",corrected:"恒州刺史、鄂国公、金城王孝〔仙〕，世业重于金张。",
      r:"太师、上柱国、大威公之世子，使持节、左武卫将军、上开府仪同三司、恒州诸军事、恒州刺史、鄂国公、金城王孝仙，世业重于金张，器识逾于许郭。",
      image:"assets/page_images/003_龙藏寺碑/images/0039_三十九.jpg",page:39,canvas:{w:1539,h:2250},crop:{x:900,y:760,w:340,h:1220},target:{x:990,y:1535,w:200,h:230},
      e:[
        "疑难字位于完整官爵之后的“王孝?”，位置明确属于人物姓名的末字，而不是官名或地名。",
        "相关人物著录保存“王孝仙”这一姓名，与碑中“恒州刺史、鄂国公、金城”的官爵组合能够对应。",
        "补作“仙”后，姓名“王孝仙”完整，后接“世业重于金张”也能顺畅转入对其家世的赞述。",
        "因此识为“仙”，依据是人物著录、姓名位置和官爵链条的对应关系。"
      ],confidence:"高"
    },
    {
      i:"06",id:"06",n:"残损碑文恢复",category:"残损碑文恢复",t:"残损碑文恢复——“领袖诸□”",title:"领袖诸蕃",
      o:"领袖诸□，冠冕群俊。",original:"领袖诸□，冠冕群俊。",
      c:"领袖诸〔蕃〕，冠冕群俊。",corrected:"领袖诸〔蕃〕，冠冕群俊。",
      r:"军府号为飞将，朝廷称为虎臣。领袖诸蕃，冠冕群俊。探赜索隐，应变知机。",
      image:"assets/page_images/003_龙藏寺碑/images/0040_四十.jpg",page:40,canvas:{w:1539,h:2250},crop:{x:300,y:760,w:330,h:1220},target:{x:325,y:1155,w:230,h:240},
      e:[
        "“诸□”只缺一字，“诸”后需要接一个表示群体或区域的名词，作为“领袖”的宾语。",
        "“蕃”可指各地属部或边地群体，与前文“军府”“飞将”“虎臣”的军政身份语境相合。",
        "“领袖诸蕃”与“冠冕群俊”形成“动词＋群体名词”的对举，语义分别为统领诸蕃、冠绝群俊。",
        "因此候选为“蕃”，依据是单字缺位、军政语境和上下句对偶。"
      ],confidence:"中"
    },
    {
      i:"07",id:"07",n:"残损碑文恢复",category:"残损碑文恢复",t:"残损碑文恢复——“张公礼之□”",title:"张公礼之书",
      o:"齐开府长、兼行参军、九门张公礼之□。",original:"齐开府长、兼行参军、九门张公礼之□。",
      c:"齐开府长、兼行参军、九门张公礼之〔书〕。",corrected:"齐开府长、兼行参军、九门张公礼之〔书〕。",
      r:"开皇六年十二月五日题写。齐开府长、兼行参军、九门张公礼之书。",
      image:"assets/page_images/003_龙藏寺碑/images/0065_六十五.jpg",page:65,canvas:{w:1539,h:2250},crop:{x:760,y:760,w:500,h:900},target:{x:820,y:1160,w:220,h:260},
      e:[
        "缺字位于碑末题署，前面已经完整列出官职、籍贯和姓名“九门张公礼”，末字应说明其与碑文的关系。",
        "碑刻题署常用“某某之书”或“某某书”标明书写者，“书”在这一位置属于常见格式用语。",
        "原释文只缺一个字，补“书”后成为“张公礼之书”，能够完整表达张公礼书写此碑。",
        "因此判断为“书”，主要依据是题署位置、碑刻署名格式和单字缺位。"
      ],confidence:"低至中"
    },
    {
      i:"08",id:"08",n:"残损碑文恢复",category:"残损碑文恢复",t:"残损碑文恢复——“□然饮食”",title:"自然饮食",
      o:"不求床坐，来会之众何忧；□然饮食，持钵之侣奚念。",original:"不求床坐，来会之众何忧；□然饮食，持钵之侣奚念。",
      c:"不求床坐，来会之众何忧；〔自〕然饮食，持钵之侣奚念。",corrected:"不求床坐，来会之众何忧；〔自〕然饮食，持钵之侣奚念。",
      r:"夜漏将竭，听鸣钟于寺内；晓相既分，见承露于云表。不求床坐，来会之众何忧；自然饮食，持钵之侣奚念。",
      image:"assets/page_images/003_龙藏寺碑/images/0053_五十三.jpg",page:53,canvas:{w:1539,h:2250},crop:{x:1080,y:760,w:330,h:1220},target:{x:1150,y:805,w:230,h:250},
      e:[
        "缺字位于“□然饮食”，只缺一字；补入后需要组成能够修饰“饮食”的双音词。",
        "“自然”在这里可理解为饮食自有供给、不必忧虑，与前句“不求床坐，来会之众何忧”共同说明寺院接待条件完备。",
        "上下两句分别围绕“床坐”和“饮食”，并以“何忧—奚念”形成反问对偶；补“自”后句法和对偶都完整。",
        "因此判断为“自”，依据是“自然”的词语结构、供养语境和前后句对应关系。"
      ],confidence:"中高"
    }
  ];

  CASES.forEach(item=>{item.analysis=[...item.e];});

  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const paragraphHtml=text=>String(text||"").replace(/\r\n?/g,"\n").split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean).map(s=>`<p>${esc(s)}</p>`).join("");
  const setMenuTitle=(index,title)=>{const link=document.querySelector(`.side a:nth-of-type(${index})`);if(link)link.textContent=title;};
  function markedHtml(value){
    const text=String(value||"");let html="",cursor=0,match;const re=/〔([^〕]*)〕/g;
    while((match=re.exec(text))){html+=esc(text.slice(cursor,match.index));html+=`<span class="damage-added">〔${esc(match[1])}〕</span>`;cursor=match.index+match[0].length;}
    return html+esc(text.slice(cursor));
  }

  async function renderTranscript(){
    const section=document.getElementById("calligraphy");if(!section)return;
    setMenuTitle(2,"二、碑文释文");
    section.className="content-card full-transcript-section";
    section.innerHTML=`<h2 class="section-title">二、碑文释文</h2><p class="full-transcript-note">${NOTE}</p><div class="full-transcript-card"><div class="full-transcript-loading">正在读取碑文释文……</div></div>`;
    const card=section.querySelector(".full-transcript-card");
    try{
      const response=await fetch(TEXT_URL,{cache:"no-store"});if(!response.ok)throw new Error(`${TEXT_URL} ${response.status}`);
      card.innerHTML=`<header class="full-transcript-header"><h3>${WORK_TITLE}</h3><span class="full-transcript-ornament" aria-hidden="true"></span></header><div class="full-transcript-body">${paragraphHtml(await response.text())}</div>`;
    }catch(error){console.warn("[work-003] transcript",error);card.innerHTML='<div class="full-transcript-error">碑文释文暂时无法读取，请刷新页面后重试。</div>';}
  }

  window.DAMAGE_AI_CASES=CASES.map(item=>JSON.parse(JSON.stringify(item)));
  let current=0,expanded=false,listScrollTop=0,rendering=false;
  const tabs=()=>CASES.map((item,index)=>`<button class="damage-tab${index===current?" active":""}" data-case-index="${index}" type="button"><b>${item.i}</b><span class="name">${esc(item.n)}</span></button>`).join("");
  const imageHtml=item=>`<div class="damage-viewport" data-image="${esc(item.image)}" title="双击查看原始拓片"><svg class="damage-crop-svg" viewBox="${item.crop.x} ${item.crop.y} ${item.crop.w} ${item.crop.h}" preserveAspectRatio="xMidYMid meet"><image href="${esc(item.image)}" x="0" y="0" width="${item.canvas.w}" height="${item.canvas.h}" preserveAspectRatio="none"></image><rect class="damage-box" x="${item.target.x}" y="${item.target.y}" width="${item.target.w}" height="${item.target.h}"></rect></svg></div><p class="damage-caption">《${WORK_TITLE}》第${item.page}页，对应问题字局部</p>`;

  function panel(item){
    const evidence=item.e.map(line=>`<li>${esc(line)}</li>`).join("");
    return `<div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${CASES.length}</span><div class="damage-heading">${esc(item.t)} <span class="damage-heading-confidence">（${esc(item.confidence)}）</span></div><div class="damage-pager"><button data-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${CASES.length}</span><button data-action="next" type="button" ${current===CASES.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list">${tabs()}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${imageHtml(item)}</section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别（OCR结果）</span><div class="damage-text">${esc(item.o)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">校读结果</span><div class="damage-text damage-new">${markedHtml(item.c)}</div></div><div class="damage-block"><span class="damage-label">恢复后的上下文</span><div class="damage-restored">${esc(item.r)}</div></div><div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><div class="damage-evidence${expanded?" open":""}"><ol>${evidence}</ol><p><strong>建议置信度：</strong>${esc(item.confidence)}</p></div><button class="damage-expand" data-action="expand" type="button">${expanded?"收起内容⌃":"展开更多⌄"}</button></div></div></section></div></div>`;
  }

  function renderDamage(){
    const section=document.getElementById("people");if(!section||rendering)return;
    rendering=true;
    setMenuTitle(3,"三、碑文残损与AI释读");
    section.className="content-card damage-ai";
    section.innerHTML=`<div data-work003-root><h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell">${panel(CASES[current])}</div></div>`;
    const list=section.querySelector(".damage-list");if(list){list.scrollTop=listScrollTop;list.addEventListener("scroll",()=>{listScrollTop=list.scrollTop;},{passive:true});}
    section.querySelectorAll("[data-case-index]").forEach(button=>button.addEventListener("click",()=>{current=Number(button.dataset.caseIndex)||0;expanded=false;renderDamage();}));
    section.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>{const action=button.dataset.action;if(action==="prev"&&current>0)current--;else if(action==="next"&&current<CASES.length-1)current++;else if(action==="expand")expanded=!expanded;renderDamage();}));
    section.querySelector(".damage-viewport")?.addEventListener("dblclick",event=>{const src=event.currentTarget.dataset.image;if(src&&typeof window.openZoom==="function")window.openZoom(src);});
    rendering=false;
  }

  function protectOwnPanel(){
    const section=document.getElementById("people");if(!section)return;
    let scheduled=false;
    new MutationObserver(()=>{
      if(rendering||section.querySelector("[data-work003-root]"))return;
      if(scheduled)return;
      scheduled=true;
      requestAnimationFrame(()=>{scheduled=false;renderDamage();});
    }).observe(section,{childList:true,subtree:false});
  }

  function init(){
    renderTranscript();
    renderDamage();
    protectOwnPanel();
    window.__WORK_003_CONTENT_READY__=true;
    window.dispatchEvent(new CustomEvent("work-003-content-ready"));
    window.dispatchEvent(new CustomEvent("work-003-cases-ready",{detail:{count:CASES.length}}));
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();