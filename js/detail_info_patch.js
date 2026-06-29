/* 碑帖简介 / 收藏历史 / 背景故事补丁
   只读取 data/beitie_info_texts.json 并覆盖详情页文字，不改变原有翻页、红框、弹窗等功能。 */
(function(){
  const INFO_URL = "data/beitie_info_texts.json?v=20260629_info";
  let infoCache = null;

  function workId(){
    const raw = String(new URLSearchParams(location.search).get("id") || "001");
    const id = raw.includes("-") ? raw.split("-")[0] : raw.padStart(3,"0");
    return id;
  }

  function esc(s){
    return String(s == null ? "" : s)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;");
  }

  function isInfoLabel(line){
    const s = String(line || "").trim();
    const normalized = s.replace(/\s+/g, "");
    return /^(流传经历|题记|题跋|递藏|版本流传|收藏经过|背景说明|相关故事|故事)[:：]$/.test(normalized);
  }

  function textToHtml(s){
    const lines = String(s || "")
      .replace(/\r\n/g,"\n").replace(/\r/g,"\n")
      .split("\n")
      .map(x=>x.trim())
      .filter(Boolean);
    if(!lines.length) return "";
    return '<div class="beitie-info-text">' + lines.map(x=>{
      const cls = isInfoLabel(x) ? ' class="beitie-info-label"' : '';
      return `<p${cls}>${esc(x)}</p>`;
    }).join("") + '</div>';
  }

  function setText(selector, text){
    const el = document.querySelector(selector);
    if(el && text) el.textContent = text;
  }

  function updateMetaLine(label, value){
    if(!value) return;
    document.querySelectorAll(".meta-line").forEach(line=>{
      const b=line.querySelector("b"), span=line.querySelector("span");
      if(b && span && b.textContent.trim().includes(label)){
        span.textContent = value;
      }
    });
  }

  function applyBasic(info){
    if(!info) return;
    if(info.title){
      document.title = info.title + " · 碑帖智能读析平台";
      setText(".info-panel h1", info.title);
      setText(".side .work-name", info.title);
      setText(".cover-label", info.title);
    }
    if(info.summary) setText(".alias", info.summary);
    const b = info.basic || {};
    updateMetaLine("责任者", b["责任者"]);
    updateMetaLine("书体", b["书体"]);
    updateMetaLine("版本", b["版本"]);
    updateMetaLine("数量", b["数量"]);
    updateMetaLine("尺寸", b["尺寸"]);
    updateMetaLine("年代", b["年代"]);
    updateMetaLine("地点", b["地点"]);
    updateMetaLine("馆藏", b["馆藏"]);
    updateMetaLine("来源", b["来源"]);
  }

  function setModal(kind, title, subtitle, bodyText){
    const btn = document.querySelector(`[data-modal="${kind}"]`);
    const modal = document.getElementById(`modal-${kind}`);
    if(!btn || !modal) return;

    if(!bodyText){
      btn.style.display = "none";
      return;
    }

    btn.style.display = "";
    const strong = btn.querySelector("strong");
    const desc = btn.querySelector("span:last-child");
    if(strong) strong.textContent = title;
    if(desc) desc.textContent = subtitle;

    const titleEl = modal.querySelector(".modal-title");
    const subEl = modal.querySelector(".modal-subtitle");
    const body = modal.querySelector(".modal-body");
    if(titleEl) titleEl.textContent = title;
    if(subEl) subEl.textContent = subtitle;
    if(body) body.innerHTML = textToHtml(bodyText);
  }

  function ensureStyle(){
    if(document.getElementById("beitie-info-style")) return;
    const style=document.createElement("style");
    style.id="beitie-info-style";
    style.textContent = `
      .alias{display:none!important;}
      .work-hero{align-items:stretch!important;}
      .work-hero .cover-panel{height:auto!important;min-height:310px!important;align-self:stretch!important;}
      .work-hero .cover-panel img{width:100%!important;height:100%!important;object-fit:cover!important;}
      .work-hero .info-panel{height:100%!important;align-self:stretch!important;}
      .beitie-info-text{font-size:15px;line-height:1.95;color:#342820;}
      .beitie-info-text p{margin:0 0 8px!important;text-indent:0!important;}
      .beitie-info-text p:last-child{margin-bottom:0!important;}
      .beitie-info-text .beitie-info-label{
        font-size:19px!important;
        font-weight:900!important;
        color:#9f3025!important;
        margin:6px 0 4px!important;
        letter-spacing:.03em;
        line-height:1.55!important;
      }
    `;
    document.head.appendChild(style);
  }

  function applyInfo(info){
    ensureStyle();
    applyBasic(info);
    setModal("history", "收藏历史", "流传经历与题记。", info.history || "");
    setModal("story", "背景故事", "作品背景、版本线索与重要考据点。", info.story || "");
  }

  async function loadAndApply(){
    try{
      if(!infoCache){
        const res = await fetch(INFO_URL, {cache:"no-store"});
        if(!res.ok) return;
        infoCache = await res.json();
      }
      const info = infoCache && infoCache.items && infoCache.items[workId()];
      if(!info) return;
      applyInfo(info);

      // detail.html 本身会异步读取旧数据，所以这里重复覆盖几次，避免被旧模板反写。
      let n=0;
      const timer=setInterval(()=>{
        applyInfo(info);
        n += 1;
        if(n >= 12) clearInterval(timer);
      }, 350);
    }catch(e){
      console.warn("[beitie-info] failed", e);
    }
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", loadAndApply);
  }else{
    loadAndApply();
  }
})();