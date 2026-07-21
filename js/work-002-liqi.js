/* 作品002《礼器碑并阴》专属内容。
 * 只在 detail.html?id=002 时覆盖第二、三栏目的内容；
 * 沿用统一的栏目结构、CSS类名、交互和第四栏目联动方式。
 */
(function(){
  "use strict";

  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
  if(parentId!=="002"||window.__WORK_002_LIQI_CONTENT__)return;
  window.__WORK_002_LIQI_CONTENT__=true;

  const SECTION_TITLE="二、碑文释文";
  const WORK_TITLE="礼器碑并阴";
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const TEXT_URL="data/liqi_full_text.txt?v=20260715_liqi_v1";
  const DAMAGE_TITLE="三、碑文残损与AI释读";
  const DAMAGE_INTRO="碑刻文字在长期保存、传拓与数字化整理过程中，常因石面风化、剥蚀、漫漶、拓印差异及古文字字形复杂等因素出现残损或识读偏差。本栏目结合拓片图像、原始释文与AI辅助分析，展示疑难字辨识、形近字校正和残文推测的过程。";

  const CASES=[
    {
      i:"01",n:"古字识别",s:"“𩥉”字恢复",t:"古字识别——“𩥉”字恢复",
      o:"自天王以下，至于初学，莫不?思，叹卬师镜。",
      c:"自天王以下，至于初学，莫不𩥉思，叹卬师镜。",
      r:"孔子近圣，为汉定道。自天王以下，至于初学，莫不𩥉思，叹卬师镜。颜氏圣舅，家居鲁亲里；并官圣妃，在安乐里。",
      image:"assets/page_images/002_礼器碑并阴/images/0007_七.jpg",page:7,
      canvas:{w:1473,h:2257},crop:{x:430,y:320,w:390,h:1740},target:{x:472,y:400,w:266,h:266},
      e:[
        "原始释文以问号标示该字无法识别，并非一个确定文字。",
        "拓片保留了结构复杂的实际字形，经人工核对可释为生僻字“𩥉”。",
        "该字超出常用字范围，常规OCR和部分字体难以稳定识别。",
        "本处属于根据真实字形进行的古字识别，不是根据语境随意补字。"
      ]
    },
    {
      i:"02",n:"残损碑文恢复",s:"“壶”字补录",t:"残损碑文恢复——“笾柉禁□”",
      o:"君于是造立礼器，乐之音符，钟磬瑟鼓，雷洗觞觚，爵鹿柤梪，笾柉禁□。修饰宅庙。",
      c:"君于是造立礼器，乐之音符，钟磬瑟鼓，雷洗觞觚，爵鹿柤梪，笾柉禁〔壶〕。修饰宅庙。",
      r:"君于是造立礼器，乐之音符，钟磬瑟鼓，雷洗觞觚，爵鹿柤梪，笾柉禁壶。修饰宅庙，更作二舆，朝车威熹。",
      image:"assets/page_images/002_礼器碑并阴/images/0013_十三.jpg",page:13,
      canvas:{w:1473,h:2257},crop:{x:970,y:330,w:390,h:1740},target:{x:1039,y:1756,w:287,h:287},
      e:[
        "红框中的残字虽有漫漶，但仍可辨出上部近“士”形、下部近“亞”形的层叠轮廓，这与汉隶“壺”字的整体结构较为接近。",
        "该字位于“钟磬、瑟鼓、雷洗、觞觚、爵、鹿、柤、梪、笾、柉、禁”之后，前后正在连续列举礼器和乐器；“壶”是盛酒的礼器，放在这里语义相合。",
        "相关录文保存“笾柉禁壶”的写法，而栏目二此处恰好只有一个“□”，因此候选字数与缺字数量一致。",
        "综合拓片残存字形、器物列举的上下文和相关录文，本处判断为“壶”；若以后发现更清晰旧拓，应再以实际字形复核。"
      ]
    },
    {
      i:"03",n:"残损碑文恢复",nav:"缺字推测",s:"“子”字推测",t:"缺字推测——“卞吕松子远”（低置信度）",
      o:"相史卞吕松□远百。",
      c:"AI推测为：相史卞吕松子远百。",
      r:"相中贼史薛虞韶兴公二百。薛弓奉高二百。相史卞吕松子远百。驺韦伯卿二百。",
      image:"assets/page_images/002_礼器碑并阴/images/0056_五十六.jpg",page:56,
      canvas:{w:1473,h:2257},crop:{x:120,y:350,w:350,h:1640},target:{x:184,y:1702,w:220,h:220},
      e:[
        "原始释文以“□”明确标示此处缺一字，现存拓片在该位置漫漶严重，难以直接据字形确认。",
        "该题名可按“官职＋姓名／表字＋捐资额”的结构理解，其中“吕松”较可能是姓名，“□远”较可能是两字表字。",
        "同碑题名中多见“子高”“子长”“子慎”等以“子”开头的两字表字，因此“子远”在命名结构上较为顺畅。",
        "目前仍缺少可以直接确认该字的清晰旧拓或权威录文，因此这里只暂拟为“子”，置信度低。"
      ]
    }
  ];

  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  function paragraphHtml(text){
    return String(text||"").replace(/\r\n?/g,"\n").split(/\n\s*\n/).map(item=>item.trim()).filter(Boolean).map(item=>`<p>${esc(item)}</p>`).join("");
  }

  function setMenuTitle(index,title){
    const link=document.querySelector(`.side a:nth-of-type(${index})`);
    if(link)link.textContent=title;
  }

  async function renderTranscript(){
    const section=document.getElementById("calligraphy");
    if(!section)return;
    setMenuTitle(2,SECTION_TITLE);
    section.className="content-card full-transcript-section";
    section.innerHTML=`<h2 class="section-title">${SECTION_TITLE}</h2><p class="full-transcript-note">${NOTE}</p><div class="full-transcript-card"><div class="full-transcript-loading">正在读取碑文释文……</div></div>`;
    const card=section.querySelector(".full-transcript-card");
    try{
      const response=await fetch(TEXT_URL,{cache:"no-store"});
      if(!response.ok)throw new Error(`${TEXT_URL} ${response.status}`);
      card.innerHTML=`<header class="full-transcript-header"><h3>${WORK_TITLE}</h3><span class="full-transcript-ornament" aria-hidden="true"></span></header><div class="full-transcript-body">${paragraphHtml(await response.text())}</div>`;
    }catch(error){
      console.warn("[work-002] transcript load failed",error);
      card.innerHTML='<div class="full-transcript-error">碑文释文暂时无法读取，请刷新页面后重试。</div>';
    }
  }

  window.DAMAGE_AI_CASES=CASES.map(item=>({...item,canvas:{...item.canvas},crop:{...item.crop},target:{...item.target},e:[...item.e]}));

  let current=0,expanded=false;
  const tabs=()=>CASES.map((item,index)=>`<button class="damage-tab${index===current?" active":""}" data-case-index="${index}" type="button"><b>${item.i}</b><span class="name">${esc(item.nav||item.n)}</span></button>`).join("");

  function imageHtml(item){
    return `<div class="damage-viewport" data-image="${esc(item.image)}" title="双击查看原始拓片"><svg class="damage-crop-svg" viewBox="${item.crop.x} ${item.crop.y} ${item.crop.w} ${item.crop.h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(item.t)}对应拓片局部"><image href="${esc(item.image)}" x="0" y="0" width="${item.canvas.w}" height="${item.canvas.h}" preserveAspectRatio="none"></image><rect class="damage-box" x="${item.target.x}" y="${item.target.y}" width="${item.target.w}" height="${item.target.h}"></rect></svg></div><p class="damage-caption">《${WORK_TITLE}》第${item.page}页，对应问题字局部</p>`;
  }

  function panel(item){
    const evidence=item.e.map(line=>`<li>${esc(line)}</li>`).join("");
    return `<div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${CASES.length}</span><div class="damage-heading">${esc(item.t)}</div><div class="damage-pager"><button data-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${CASES.length}</span><button data-action="next" type="button" ${current===CASES.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list">${tabs()}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${imageHtml(item)}</section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别（OCR结果）</span><div class="damage-text">${esc(item.o)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">修正结果（AI识别）</span><div class="damage-text damage-new">${esc(item.c)}</div></div><div class="damage-block"><span class="damage-label">恢复后的上下文</span><div class="damage-restored">${esc(item.r)}</div></div><div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><div class="damage-evidence${expanded?" open":""}"><ol>${evidence}</ol></div><button class="damage-expand" data-action="expand" type="button">${expanded?"收起内容⌃":"展开更多⌄"}</button></div></div></section></div></div>`;
  }

  function renderDamage(){
    const section=document.getElementById("people");
    if(!section)return;
    setMenuTitle(3,DAMAGE_TITLE);
    section.className="content-card damage-ai";
    section.innerHTML=`<h2 class="section-title">${DAMAGE_TITLE}</h2><p class="damage-intro">${DAMAGE_INTRO}</p><div class="damage-shell">${panel(CASES[current])}</div>`;
    section.querySelectorAll("[data-case-index]").forEach(button=>button.addEventListener("click",()=>{current=Number(button.dataset.caseIndex)||0;expanded=false;renderDamage();}));
    section.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>{const action=button.dataset.action;if(action==="prev"&&current>0){current--;expanded=false;}else if(action==="next"&&current<CASES.length-1){current++;expanded=false;}else if(action==="expand")expanded=!expanded;renderDamage();}));
    section.querySelector(".damage-viewport")?.addEventListener("dblclick",event=>{const src=event.currentTarget.dataset.image;if(src&&typeof window.openZoom==="function")window.openZoom(src);});
  }

  function patchSharedAnalysis(){
    const root=document.querySelector("#people [data-integrity-v2-root]");
    if(!root)return;
    const originalNode=Array.from(root.querySelectorAll(".damage-text")).find(node=>!node.classList.contains("damage-new"));
    const original=String(originalNode?.textContent||"");
    const item=CASES.find(value=>original===value.o||original.includes(value.o)||value.o.includes(original));
    if(!item)return;

    const signature=`${item.i}:${item.e.join("|")}`;
    const evidence=root.querySelector(".damage-evidence ol");
    if(evidence&&root.dataset.liqiAnalysis!==signature){
      evidence.innerHTML=item.e.map(line=>`<li>${esc(line)}</li>`).join("");
      root.dataset.liqiAnalysis=signature;
    }

    const shared=Array.isArray(window.DAMAGE_AI_CASES)?window.DAMAGE_AI_CASES.find(row=>String(row?.o??row?.original??"")===item.o):null;
    if(shared){
      shared.e=[...item.e];
      shared.analysis=[...item.e];
    }
  }

  function installSharedAnalysisPatch(){
    window.addEventListener("damage-case-integrity-ready",()=>setTimeout(patchSharedAnalysis,0));
    const section=document.getElementById("people");
    if(section){
      let scheduled=false;
      new MutationObserver(()=>{
        if(scheduled)return;
        scheduled=true;
        requestAnimationFrame(()=>{scheduled=false;patchSharedAnalysis();});
      }).observe(section,{childList:true,subtree:true});
    }
    setTimeout(patchSharedAnalysis,0);
  }

  function init(){
    renderTranscript();
    renderDamage();
    installSharedAnalysisPatch();
    window.__WORK_002_CONTENT_READY__=true;
    window.dispatchEvent(new CustomEvent("work-002-content-ready"));
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();