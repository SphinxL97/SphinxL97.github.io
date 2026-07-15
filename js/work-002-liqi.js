/* 作品002《礼器碑并阴》专属内容。
 * 只在 detail.html?id=002 时覆盖第二、三栏目的内容；
 * 沿用《道因法师碑》现有HTML结构、CSS类名、交互和第四栏目联动方式。
 */
(function(){
  "use strict";

  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
  if(parentId!=="002") return;
  if(window.__WORK_002_LIQI_CONTENT__) return;
  window.__WORK_002_LIQI_CONTENT__=true;

  const SECTION_TITLE="二、碑文释文";
  const WORK_TITLE="礼器碑并阴";
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const TEXT_URL="data/liqi_full_text.txt?v=20260715_liqi_v1";

  const DAMAGE_TITLE="三、碑文残损与AI释读";
  const DAMAGE_INTRO="碑刻文字在长期保存、传拓与数字化整理过程中，常因石面风化、剥蚀、漫漶、拓印差异及古文字字形复杂等因素出现残损或识读偏差。本栏目通过典型案例，结合拓片图像、OCR识别结果与AI辅助分析，展示疑难字辨识、形近字校正和残文推测的过程。相关结论仅供辅助参考，仍需结合原拓、录文及相关研究进一步核验。";

  const CASES=[
    {
      i:"01",n:"古字识别",s:"“𩥉”字恢复",t:"古字识别——“𩥉”字恢复",
      o:"自天王以下，至于初学，莫不?思，叹卬师镜。",
      c:"自天王以下，至于初学，莫不𩥉思，叹卬师镜。",
      r:"孔子近圣，为汉定道。自天王以下，至于初学，莫不𩥉思，叹卬师镜。颜氏圣舅，家居鲁亲里；并官圣妃，在安乐里。",
      image:"assets/page_images/002_礼器碑并阴/images/0007_七.jpg",
      page:7,
      canvas:{w:1473,h:2257},
      crop:{x:430,y:320,w:390,h:1740},
      target:{x:472,y:400,w:266,h:266},
      e:[
        "原始释文以问号标示该字无法识别，并非一个确定文字。",
        "经人工确认，该处应恢复为生僻字“𩥉”。",
        "“𩥉”字结构复杂，常规OCR和部分输入法难以稳定识别。",
        "网站正式展示时应保留原拓局部，供读者继续核验字形。",
        "本处属于生僻古字识别，不是根据语境随意补字。"
      ]
    },
    {
      i:"02",n:"残损碑文恢复",s:"“壶”字补录",t:"残损碑文恢复——“壶”字补录",
      o:"君于是造立礼器，乐之音符，钟磬瑟鼓，雷洗觞觚，爵鹿柤梪，笾柉禁，修饰宅庙。",
      c:"君于是造立礼器，乐之音符，钟磬瑟鼓，雷洗觞觚，爵鹿柤梪，笾柉禁壶，修饰宅庙。",
      r:"君于是造立礼器，乐之音符，钟磬瑟鼓，雷洗觞觚，爵鹿柤梪，笾柉禁壶。修饰宅庙，更作二舆，朝车威熹。",
      image:"assets/page_images/002_礼器碑并阴/images/0013_十三.jpg",
      page:13,
      canvas:{w:1473,h:2257},
      crop:{x:970,y:330,w:390,h:1740},
      target:{x:1039,y:1756,w:287,h:287},
      e:[
        "原始释文在“禁”字之后留有异常空缺，说明此处可能存在漏录。",
        "上下文连续列举礼器和乐器，句式属于器物名称并列。",
        "补入“壶”后，句子仍保持连续列举器物的结构。",
        "该恢复属于AI辅助补录，必须结合原拓中字位和残存笔画确认。",
        "若原拓中不存在“壶”字或不存在相应字位，应撤销这一恢复。"
      ]
    },
    {
      i:"03",n:"残损碑文恢复",nav:"缺字待考",s:"“卞吕松□远”缺字",t:"缺字待考——“卞吕松□远”暂未恢复",
      o:"相史卞吕松□远百。",
      c:"暂未恢复（保留原缺字符号“□”）",
      r:"相中贼史薛虞韶兴公二百。薛弓奉高二百。相史卞吕松□远百。驺韦伯卿二百。",
      image:"assets/page_images/002_礼器碑并阴/images/0056_五十六.jpg",
      page:56,
      canvas:{w:1473,h:2257},
      crop:{x:120,y:350,w:350,h:1640},
      target:{x:184,y:1702,w:220,h:220},
      e:[
        "原始释文已经用“□”明确标示此处缺一字。",
        "该缺字位于人名或表字之中，前后语境无法提供可靠的语义推断。",
        "在没有清晰拓片字形或可靠文献依据时，强行补字容易造成错误。",
        "AI在本案例中不提出未经证实的候选字，继续保留缺字符号。",
        "此处适合通过众智释读收集读者提供的字形判断、录文依据和候选字。"
      ]
    }
  ];

  const esc=value=>String(value??"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");

  function paragraphHtml(text){
    const paragraphs=String(text||"")
      .replace(/\r\n/g,"\n")
      .replace(/\r/g,"\n")
      .split(/\n\s*\n/)
      .map(item=>item.trim())
      .filter(Boolean);
    return paragraphs.map(paragraph=>`<p>${esc(paragraph)}</p>`).join("");
  }

  function setMenuTitle(index,title){
    const link=document.querySelector(`.side a:nth-of-type(${index})`);
    if(link) link.textContent=title;
  }

  async function renderTranscript(){
    const section=document.getElementById("calligraphy");
    if(!section) return;

    setMenuTitle(2,SECTION_TITLE);
    section.classList.add("full-transcript-section");
    section.innerHTML=`
      <h2 class="section-title">${SECTION_TITLE}</h2>
      <p class="full-transcript-note">${NOTE}</p>
      <div class="full-transcript-card" aria-live="polite">
        <div class="full-transcript-loading">正在读取碑文释文……</div>
      </div>
    `;

    const card=section.querySelector(".full-transcript-card");
    try{
      const response=await fetch(TEXT_URL,{cache:"no-store"});
      if(!response.ok) throw new Error(`${TEXT_URL} ${response.status}`);
      const text=await response.text();
      card.innerHTML=`
        <header class="full-transcript-header">
          <h3>${WORK_TITLE}</h3>
          <span class="full-transcript-ornament" aria-hidden="true"></span>
        </header>
        <div class="full-transcript-body">${paragraphHtml(text)}</div>
      `;
    }catch(error){
      console.warn("[work-002] transcript load failed",error);
      card.innerHTML="<div class=\"full-transcript-error\">碑文释文暂时无法读取，请刷新页面后重试。</div>";
    }
  }

  window.DAMAGE_AI_CASES=CASES.map(item=>({
    ...item,
    canvas:{...item.canvas},
    crop:{...item.crop},
    target:{...item.target},
    e:[...item.e]
  }));

  let current=0;
  let expanded=false;

  function caseTabs(){
    return CASES.map((item,index)=>`
      <button class="damage-tab${index===current?" active":""}" data-case-index="${index}" type="button" aria-pressed="${index===current}">
        <b>${item.i}</b>
        <span class="name">${esc(item.nav||item.n)}</span>
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
            <p class="damage-caption">《${WORK_TITLE}》第${item.page}页，对应问题字局部</p>
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

  function bindDamage(section){
    section.querySelectorAll("[data-case-index]").forEach(button=>{
      button.addEventListener("click",()=>{
        current=Number(button.dataset.caseIndex)||0;
        expanded=false;
        renderDamage();
      });
    });
    section.querySelectorAll("[data-action]").forEach(button=>{
      button.addEventListener("click",()=>{
        const action=button.dataset.action;
        if(action==="prev"&&current>0){current-=1;expanded=false;}
        if(action==="next"&&current<CASES.length-1){current+=1;expanded=false;}
        if(action==="expand") expanded=!expanded;
        renderDamage();
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

  function renderDamage(){
    const section=document.getElementById("people");
    if(!section) return;
    setMenuTitle(3,DAMAGE_TITLE);
    section.classList.add("damage-ai");
    section.innerHTML=`
      <h2 class="section-title">${DAMAGE_TITLE}</h2>
      <p class="damage-intro">${DAMAGE_INTRO}</p>
      <div class="damage-shell">${casePanel(CASES[current])}</div>
    `;
    bindDamage(section);
  }

  function init(){
    renderTranscript();
    renderDamage();
    window.__WORK_002_CONTENT_READY__=true;
    window.dispatchEvent(new CustomEvent("work-002-content-ready"));
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();