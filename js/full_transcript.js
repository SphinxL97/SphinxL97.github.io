/* 001《道因法师碑》专用的第二栏目“碑文释文”。 */
(function(){
  "use strict";

  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
  if(parentId!=="001"||window.__DAOYIN_FULL_TRANSCRIPT__) return;
  window.__DAOYIN_FULL_TRANSCRIPT__=true;

  const SECTION_TITLE="二、碑文释文";
  const WORK_TITLE="道因法师碑";
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const TEXT_URL="data/daoyin_full_text.txt?v=20260713";

  function escapeHtml(value){
    return String(value==null?"":value)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;");
  }

  function paragraphHtml(text){
    const paragraphs=String(text||"")
      .replace(/\r\n/g,"\n")
      .replace(/\r/g,"\n")
      .split(/\n\s*\n/)
      .map(item=>item.trim())
      .filter(Boolean);

    return paragraphs.map(paragraph=>`<p>${escapeHtml(paragraph)}</p>`).join("");
  }

  function setMenuTitle(){
    const secondLink=document.querySelector(".side a:nth-of-type(2)");
    if(secondLink) secondLink.textContent=SECTION_TITLE;
  }

  async function renderTranscript(){
    const section=document.getElementById("calligraphy");
    if(!section) return;

    setMenuTitle();
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
      console.warn("[full-transcript] load failed",error);
      card.innerHTML="<div class=\"full-transcript-error\">碑文释文暂时无法读取，请刷新页面后重试。</div>";
    }
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",renderTranscript,{once:true});
  }else{
    renderTranscript();
  }
})();

/* 加载左侧目录下方的碑帖地点地图。 */
(function(){
  "use strict";
  if(document.querySelector('script[data-beitie-location-map]')) return;
  const script=document.createElement("script");
  script.src="js/beitie_location_map.js?v=20260716_map_v1";
  script.async=false;
  script.dataset.beitieLocationMap="true";
  document.head.appendChild(script);
})();

/* 027栏目三左侧案例列表定位修复：复用详情页原本就会加载的脚本作为稳定入口。 */
(function(){
  "use strict";
  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
  if(parentId!=="027"||window.__WORK_027_LIST_SCROLL_LOADER_V2__)return;
  window.__WORK_027_LIST_SCROLL_LOADER_V2__=true;
  const src="js/work-027-list-scroll-fix.js?v=20260725_work027_scroll_v2";
  if(Array.from(document.scripts).some(node=>(node.getAttribute("src")||"").includes("work-027-list-scroll-fix.js")))return;
  const script=document.createElement("script");
  script.src=src;
  script.async=false;
  script.dataset.work027ListScrollFix="true";
  script.addEventListener("error",()=>console.error("[work027-list-scroll] 修复脚本加载失败",src),{once:true});
  document.head.appendChild(script);
})();
