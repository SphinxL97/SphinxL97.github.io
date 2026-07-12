(function(){
  "use strict";

  const TITLE="碑文残损与AI释读";
  const INTRO="碑刻文字在长期保存、传拓与数字化整理过程中，常因石面风化、剥蚀、漫漶、拓印差异及古文字字形复杂等因素出现残损或识读偏差。本栏目通过典型案例，结合拓片图像、OCR识别结果与AI辅助分析，展示疑难字辨识、形近字校正和残文推测的过程。相关结论仅供辅助参考，仍需结合原拓、录文及相关研究进一步核验。";

  const CASES=[
    {
      i:"01",n:"古字识别",s:"“𢂀”字恢复",t:"古字识别——“𢂀”字恢复",
      o:"循堂室而濡涕，对几□而流恸。",
      c:"循堂室而濡涕，对几𢂀而流恸。",
      r:"弟子玄凝等，禀训餐风，斯称上足。而以慈灯罢照，崇山无仰。循堂室而濡涕，对几𢂀而流恸。",
      image:"assets/page_images/001_道因法师碑/images/0056_五十六.jpg",
      page:56,
      canvas:{w:1452,h:2221},
      crop:{x:63,y:353,w:537,h:1731},
      target:{x:153,y:654,w:189,h:188},
      e:[
        "拓片中该字位置有清晰笔画，并非碑面剥蚀造成的缺损。",
        "该字为巾部古字，字形结构复杂，常规OCR难以识别。",
        "结合上下文悼念法师、睹物伤情的语境，用“𢂀”更为恰当。"
      ]
    },
    {
      i:"02",n:"形近字纠错",s:"“丱”字识别",t:"形近字纠错——“丱”字识别",
      o:"逮乎初卝，方蒙落发。",
      c:"逮乎初丱，方蒙落发。",
      r:"逮乎初丱，方蒙落发。",
      image:"assets/page_images/001_道因法师碑/images/0019_十九.jpg",
      page:19,
      canvas:{w:1444,h:2213},
      crop:{x:1006,y:362,w:370,h:1726},
      target:{x:1096,y:1019,w:188,h:191},
      e:[
        "“丱”表示童年时期，是古代碑志中常见的年龄表述。",
        "“卝”与“丱”字形相近，碑刻图像识别时容易混淆。",
        "上下文记述道因法师幼年出家，“初丱”与“方蒙落发”语意连贯。"
      ]
    },
    {
      i:"03",n:"残损碑文恢复",s:"五字推测恢复",t:"残损碑文恢复——五字推测恢复",
      o:"沦羲□□，□□□光。",
      c:"沦羲晦曜，慧日无光。",
      r:"沦羲晦曜，慧日无光。遽嗟分岸，永泣摧梁。",
      image:"assets/page_images/001_道因法师碑/images/0063_六十三.jpg",
      page:63,
      canvas:{w:1452,h:2221},
      crop:{x:450,y:669,w:428,h:1466},
      target:{x:570,y:1178,w:188,h:592},
      e:[
        "该处位于碑铭“其词曰”部分，语境为悼念道因法师圆寂。",
        "“羲”可关联羲和、日光，与“晦曜”“无光”等光明意象相应。",
        "“慧日”既与佛教智慧之光有关，也呼应道因法师所在的慧日寺。",
        "该恢复属于AI辅助推测，仍需结合高清拓片及其他录本进一步校验。"
      ]
    }
  ];

  let current=0;
  let expanded=false;

  const esc=value=>String(value??"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");

  function caseTabs(){
    return CASES.map((item,index)=>`
      <button class="damage-tab${index===current?" active":""}" data-case-index="${index}" type="button" aria-pressed="${index===current}">
        <b>${item.i}</b>
        <span class="name">${esc(item.n)}</span>
        <span class="sub">${esc(item.s)}</span>
      </button>
    `).join("");
  }

  function exactImage(item){
    const crop=item.crop,target=item.target,canvas=item.canvas;
    return `
      <div class="damage-viewport" data-image="${esc(item.image)}" title="双击查看原始拓片">
        <svg class="damage-crop-svg" viewBox="${crop.x} ${crop.y} ${crop.w} ${crop.h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(item.t)}对应拓片局部">
          <image href="${esc(item.image)}" x="0" y="0" width="${canvas.w}" height="${canvas.h}" preserveAspectRatio="none"></image>
          <rect class="damage-box" x="${target.x}" y="${target.y}" width="${target.w}" height="${target.h}"></rect>
        </svg>
      </div>
    `;
  }

  function casePanel(item){
    const evidence=item.e.map(line=>`<li>${esc(line)}</li>`).join("");
    return `
      <div class="damage-toolbar">
        <span class="damage-count">案例 ${current+1} / ${CASES.length}</span>
        <div class="damage-heading">${esc(item.t)}</div>
        <div class="damage-pager">
          <button data-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button>
          <span class="damage-page">${current+1} / ${CASES.length}</span>
          <button data-action="next" type="button" ${current===CASES.length-1?"disabled":""}>下一个 ›</button>
        </div>
      </div>
      <div class="damage-body">
        <nav class="damage-list" aria-label="碑文残损与AI释读案例">${caseTabs()}</nav>
        <div class="damage-stage">
          <section class="damage-card damage-image-card">
            <h3>拓片原图（局部）</h3>
            ${exactImage(item)}
            <p class="damage-caption">《道因法师碑》第${item.page}页，对应问题字局部</p>
          </section>
          <section class="damage-card damage-analysis">
            <h3>AI辅助校勘</h3>
            <div class="damage-flow">
              <div class="damage-block">
                <span class="damage-label">原始识别（OCR结果）</span>
                <div class="damage-text">${esc(item.o)}</div>
              </div>
              <div class="damage-arrow">↓</div>
              <div class="damage-block">
                <span class="damage-label">修正结果（AI识别）</span>
                <div class="damage-text damage-new">${esc(item.c)}</div>
              </div>
              <div class="damage-block">
                <span class="damage-label">恢复后的上下文</span>
                <div class="damage-restored">${esc(item.r)}</div>
              </div>
              <div class="damage-block damage-evidence-block">
                <span class="damage-label">AI分析依据</span>
                <div class="damage-evidence${expanded?" open":""}"><ol>${evidence}</ol></div>
                <button class="damage-expand" data-action="expand" type="button">${expanded?"收起内容⌃":"展开更多⌄"}</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;
  }

  function bind(section){
    section.querySelectorAll("[data-case-index]").forEach(button=>{
      button.addEventListener("click",()=>{
        current=Number(button.dataset.caseIndex)||0;
        expanded=false;
        render();
      });
    });
    section.querySelectorAll("[data-action]").forEach(button=>{
      button.addEventListener("click",()=>{
        const action=button.dataset.action;
        if(action==="prev"&&current>0){current-=1;expanded=false;}
        if(action==="next"&&current<CASES.length-1){current+=1;expanded=false;}
        if(action==="expand") expanded=!expanded;
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
    if(!section) return;
    section.classList.add("damage-ai");
    section.innerHTML=`
      <h2 class="section-title">${TITLE}</h2>
      <p class="damage-intro">${INTRO}</p>
      <div class="damage-shell">${casePanel(CASES[current])}</div>
    `;
    bind(section);
  }

  function init(){
    const thirdLink=document.querySelector(".side a:nth-of-type(3)");
    if(thirdLink) thirdLink.textContent=TITLE;
    render();
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init);
  else init();
})();
