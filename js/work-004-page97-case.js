/* 《麓山寺碑并阴》第97页残字：栏目二保留原部件，栏目三新增AI暂拟案例。 */
(function(){
  "use strict";

  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const id=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(id!=="004"||window.__WORK_004_PAGE97_CASE_PATCH__) return;
  window.__WORK_004_PAGE97_CASE_PATCH__=true;

  const TITLE="麓山寺碑并阴";
  const RADICAL="";
  const ORIGINAL_SENTENCE=`赞曰：名家意，君子心；${RADICAL}众木，繁林。阶下无讼，堂上有琴；大经既雅，小绮不淫。`;
  const PAGE97_CASE={
    i:"08",
    n:"残损碑文恢复",
    nav:"残字推测",
    s:"“蔚”字推测",
    t:"残损碑文恢复——“蔚众木”",
    o:ORIGINAL_SENTENCE,
    c:"赞曰：名家意，君子心；〔蔚〕众木，繁林。阶下无讼，堂上有琴；大经既雅，小绮不淫。",
    r:"赞曰：名家意，君子心；〔蔚〕众木，繁林。阶下无讼，堂上有琴；大经既雅，小绮不淫。",
    image:"assets/page_images/004_麓山寺碑并阴/images/0097_九十七.jpg",
    page:97,
    canvas:{w:1482,h:2212},
    targets:[{x:1109,y:1706,w:186,h:224}],
    e:[
      `原拓该字残损，逐字数据只保留可显示为部件字符“${RADICAL}”的局部；栏目二因此恢复原部件，不直接写成完整汉字。`,
      "该处位于赞辞“名家意，君子心；□众木，繁林”中，后接“繁林”，语义集中在草木繁盛。",
      "“蔚”可表示草木茂盛、繁密，暂拟为“蔚众木，繁林”后，与下文意象较为连贯。",
      "现存笔画不足以单凭字形确认全字，因此〔蔚〕只作为AI辅助推测，仍需其他拓本或权威录文核验。"
    ],
    confidence:"中",
    groupCount:1,
    boxCount:1
  };

  const esc=value=>String(value==null?"":value)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");

  const cloneCase=item=>({
    ...item,
    canvas:{...(item.canvas||{})},
    targets:Array.isArray(item.targets)
      ? item.targets.map(target=>({...target}))
      : item.target?[{...item.target}]:[],
    e:Array.isArray(item.e)?[...item.e]:[]
  });

  let cases=[];
  let current=0;
  let expanded=false;
  let listScrollTop=0;

  function crop(item){
    const targets=item.targets||[];
    if(!targets.length) return {x:0,y:0,w:item.canvas.w||1,h:item.canvas.h||1};
    const px=150,py=250;
    const left=Math.min(...targets.map(target=>target.x));
    const top=Math.min(...targets.map(target=>target.y));
    const right=Math.max(...targets.map(target=>target.x+target.w));
    const bottom=Math.max(...targets.map(target=>target.y+target.h));
    const x=Math.max(0,left-px),y=Math.max(0,top-py);
    return {
      x,y,
      w:Math.min(item.canvas.w-x,Math.max(420,right-left+px*2)),
      h:Math.min(item.canvas.h-y,Math.max(900,bottom-top+py*2))
    };
  }

  function tabs(){
    return cases.map((item,index)=>`
      <button class="damage-tab${index===current?" active":""}" data-case-index="${index}" type="button" aria-pressed="${index===current}">
        <b>${esc(item.i)}</b><span class="name">${esc(item.nav||item.n)}</span>
      </button>
    `).join("");
  }

  function image(item){
    const area=crop(item);
    const rects=(item.targets||[]).map(target=>`<rect class="damage-box" x="${target.x}" y="${target.y}" width="${target.w}" height="${target.h}"></rect>`).join("");
    return `<div class="damage-viewport" data-image="${esc(item.image)}" title="双击查看原始拓片"><svg class="damage-crop-svg" viewBox="${area.x} ${area.y} ${area.w} ${area.h}" preserveAspectRatio="xMidYMid meet"><image href="${esc(item.image)}" x="0" y="0" width="${item.canvas.w}" height="${item.canvas.h}" preserveAspectRatio="none"></image>${rects}</svg></div>`;
  }

  function panel(item){
    const evidence=(item.e||[]).map(line=>`<li>${esc(line)}</li>`).join("");
    return `<div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${cases.length}</span><div class="damage-heading">${esc(item.t)}</div><div class="damage-pager"><button data-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${cases.length}</span><button data-action="next" type="button" ${current===cases.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list" aria-label="碑文残损与AI释读案例">${tabs()}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${image(item)}<p class="damage-caption">《${TITLE}》第${item.page}页，本句残字局部</p></section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别（OCR结果）</span><div class="damage-text">${esc(item.o)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">修正结果（AI识别）</span><div class="damage-text damage-new">${esc(item.c)}</div></div><div class="damage-block"><span class="damage-label">恢复后的上下文</span><div class="damage-restored">${esc(item.r)}</div></div><div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><div class="damage-evidence${expanded?" open":""}"><ol>${evidence}</ol><p><strong>本句残字：</strong>${item.groupCount||1}组，共${item.boxCount||1}处</p><p><strong>建议置信度：</strong>${esc(item.confidence||"")}</p></div><button class="damage-expand" data-action="expand" type="button">${expanded?"收起内容⌃":"展开更多⌄"}</button></div></div></section></div></div>`;
  }

  function remember(section){
    const list=section?.querySelector(".damage-list");
    if(list) listScrollTop=list.scrollTop;
  }

  function restore(section){
    const list=section.querySelector(".damage-list");
    if(!list) return;
    list.scrollTop=listScrollTop;
    list.addEventListener("scroll",()=>{listScrollTop=list.scrollTop;},{passive:true});
    requestAnimationFrame(()=>{
      const active=list.querySelector(".damage-tab.active");
      if(!active) return;
      const top=active.offsetTop;
      const bottom=top+active.offsetHeight;
      const viewTop=list.scrollTop;
      const viewBottom=viewTop+list.clientHeight;
      if(top<viewTop) list.scrollTop=top;
      else if(bottom>viewBottom) list.scrollTop=bottom-list.clientHeight;
      listScrollTop=list.scrollTop;
    });
  }

  function bind(section){
    section.querySelectorAll("[data-case-index]").forEach(button=>{
      button.addEventListener("click",()=>{
        remember(section);
        current=Number(button.dataset.caseIndex)||0;
        expanded=false;
        render();
      });
    });
    section.querySelectorAll("[data-action]").forEach(button=>{
      button.addEventListener("click",()=>{
        remember(section);
        const action=button.dataset.action;
        if(action==="prev"&&current>0) current-=1;
        if(action==="next"&&current<cases.length-1) current+=1;
        if(action==="expand") expanded=!expanded;
        else expanded=false;
        render();
      });
    });
    const viewport=section.querySelector(".damage-viewport");
    if(viewport){
      viewport.addEventListener("dblclick",()=>{
        const src=viewport.dataset.image;
        if(src&&typeof window.openZoom==="function") window.openZoom(src);
      });
    }
  }

  function render(){
    const section=document.getElementById("people");
    if(!section||!cases.length) return;
    const menu=document.querySelector(".side a:nth-of-type(3)");
    if(menu) menu.textContent="三、碑文残损与AI释读";
    section.classList.add("damage-ai");
    section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">碑刻文字在长期保存、传拓与数字化整理过程中，常因石面风化、剥蚀、漫漶、拓印差异及古文字字形复杂等因素出现残损或识读偏差。本栏目以完整句子为单位，按照原文中的出现顺序展示疑难文字。同一句中不论有一组还是多组“□”，均合并为一个案例。每一处均提供AI暂拟候选；其中题名、人名与官职残损多缺乏唯一依据，低置信度候选使用〔〕标明，仅供讨论，不作为确定释文。</p><div class="damage-shell">${panel(cases[current])}</div>`;
    bind(section);
    restore(section);
  }

  function insertCase(){
    if(!Array.isArray(window.DAMAGE_AI_CASES)||!window.DAMAGE_AI_CASES.length) return false;
    if(window.DAMAGE_AI_CASES.some(item=>Number(item.page)===97&&String(item.o||"").includes(RADICAL))) return true;

    cases=window.DAMAGE_AI_CASES.map(cloneCase);
    const insertAt=cases.findIndex(item=>Number(item.page)>97);
    cases.splice(insertAt<0?cases.length:insertAt,0,cloneCase(PAGE97_CASE));
    cases=cases.map((item,index)=>({...item,i:String(index+1).padStart(2,"0")}));
    window.DAMAGE_AI_CASES=cases.map(cloneCase);
    render();
    window.dispatchEvent(new CustomEvent("work-004-page97-case-ready"));
    return true;
  }

  function wrapExactText(){
    const body=document.querySelector("#calligraphy .full-transcript-body");
    if(!body) return false;
    if(body.querySelector('[data-page97-problem="true"]')) return true;

    const walker=document.createTreeWalker(body,NodeFilter.SHOW_TEXT,{
      acceptNode(node){
        if(!node.nodeValue.includes(ORIGINAL_SENTENCE)) return NodeFilter.FILTER_REJECT;
        if(node.parentElement?.closest("strong.transcript-problem-sentence")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const node=walker.nextNode();
    if(!node) return false;
    const index=node.nodeValue.indexOf(ORIGINAL_SENTENCE);
    const tail=node.splitText(index);
    tail.splitText(ORIGINAL_SENTENCE.length);
    const strong=document.createElement("strong");
    strong.className="transcript-problem-sentence";
    strong.dataset.page97Problem="true";
    strong.textContent=ORIGINAL_SENTENCE;
    tail.replaceWith(strong);
    return true;
  }

  function start(){
    insertCase();
    wrapExactText();
    const observer=new MutationObserver(()=>{
      insertCase();
      wrapExactText();
    });
    observer.observe(document.getElementById("people")||document.body,{childList:true,subtree:true});
    const transcript=document.getElementById("calligraphy");
    if(transcript) observer.observe(transcript,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),10000);
  }

  window.addEventListener("work-004-content-ready",start,{once:true});
  if(window.__WORK_004_CONTENT_READY__) start();
  else setTimeout(start,600);
})();
