/* 碑帖详情页补丁
   1. 读取 data/beitie_info_texts.json 并覆盖作品简介、收藏历史、背景故事。
   2. 45件碑帖统一采用与深度学习结果一致的字框表示结构。
   3. 014、031、039沿用现有坐标数值，但在前端标准化为同样的 x/y/w/h 与 model_border_refined 表示。
*/
(function(){
  const MODEL_VERSION = "20260711_model_border_v2";
  const MODEL_COMPAT_WORKS = new Set(["014","031","039"]);
  const rawId = String(new URLSearchParams(location.search).get("id") || "001");
  const parentId = (rawId.includes("-") ? rawId.split("-")[0] : rawId).padStart(3,"0");

  let modelShardPromise = null;
  let originalLoadPageGlyphBoxes = null;
  let modelOverrideInstalled = false;

  function modelShardUrl(id){
    const n = Number(String(id).slice(0,3));
    if(!Number.isFinite(n) || n < 1 || n > 45) return "";
    const start = Math.floor((n - 1) / 5) * 5 + 1;
    const end = Math.min(start + 4, 45);
    const a = String(start).padStart(3,"0");
    const b = String(end).padStart(3,"0");
    return `data/model_boxes/glyph_model_border_${a}_${b}.json?v=${MODEL_VERSION}`;
  }

  async function loadModelShard(){
    if(modelShardPromise) return modelShardPromise;
    const url = modelShardUrl(parentId);
    if(!url) return [];
    modelShardPromise = fetch(url,{cache:"no-store"})
      .then(res=>{
        if(!res.ok) throw new Error(`${url} ${res.status}`);
        return res.json();
      })
      .then(data=>Array.isArray(data)?data:[])
      .catch(err=>{
        console.warn("[model-boxes] shard load failed",err);
        return [];
      });
    return modelShardPromise;
  }

  function normalizeModelRows(rows,pageObj){
    return rows.map((r,i)=>({
      ...r,
      glyph_id:r.glyph_id || `${parentId}_p${pageObj.canvas_index}_m${i+1}`,
      char:String(r.char || r.text || "").slice(0,1),
      text:String(r.char || r.text || "").slice(0,1),
      order_in_page:+(r.order_in_page || i+1),
      canvas_index:+pageObj.canvas_index,
      canvas_label:pageObj.canvas_label || pageObj.label || pageObj.canvas_index,
      local_image:pageObj.image,
      canvas_width:+(r.canvas_width || pageObj.canvas_width || 0),
      canvas_height:+(r.canvas_height || pageObj.canvas_height || 0),
      x:+r.x,
      y:+r.y,
      w:+r.w,
      h:+r.h,
      source:"model_border_refined"
    }));
  }

  function normalizeCompatibleRows(rows,pageObj){
    return rows.map((r,i)=>{
      const bbox = Array.isArray(r.bbox) ? r.bbox : [];
      const bboxXYWH = Array.isArray(r.bbox_xywh) ? r.bbox_xywh : [];
      const x = +(r.x ?? r.border_x ?? r.display_x ?? r.model_x ?? r.bbox_x ?? bbox[0] ?? bboxXYWH[0] ?? 0);
      const y = +(r.y ?? r.border_y ?? r.display_y ?? r.model_y ?? r.bbox_y ?? bbox[1] ?? bboxXYWH[1] ?? 0);
      const w = +(r.w ?? r.border_w ?? r.display_w ?? r.model_w ?? r.bbox_w ?? bbox[2] ?? bboxXYWH[2] ?? 0);
      const h = +(r.h ?? r.border_h ?? r.display_h ?? r.model_h ?? r.bbox_h ?? bbox[3] ?? bboxXYWH[3] ?? 0);
      return {
        ...r,
        glyph_id:r.glyph_id || `${parentId}_p${pageObj.canvas_index}_m${i+1}`,
        char:String(r.char || r.text || "").slice(0,1),
        text:String(r.char || r.text || "").slice(0,1),
        order_in_page:+(r.order_in_page || r.annotation_index || i+1),
        canvas_index:+pageObj.canvas_index,
        canvas_label:pageObj.canvas_label || pageObj.label || pageObj.canvas_index,
        local_image:pageObj.image,
        canvas_width:+(r.canvas_width || pageObj.canvas_width || 0),
        canvas_height:+(r.canvas_height || pageObj.canvas_height || 0),
        x,y,w,h,
        source:"model_border_refined"
      };
    });
  }

  function installModelBoxOverride(){
    if(modelOverrideInstalled) return;
    if(typeof loadPageGlyphBoxes !== "function"){
      setTimeout(installModelBoxOverride,50);
      return;
    }

    originalLoadPageGlyphBoxes = loadPageGlyphBoxes;
    loadPageGlyphBoxes = async function(id,pageObj){
      const shard = await loadModelShard();
      const pageNo = +(pageObj.canvas_index ?? pageObj.page ?? 0);
      const rows = shard.filter(r=>
        String(r.work_id || "").padStart(3,"0") === parentId &&
        +r.canvas_index === pageNo
      );
      if(rows.length) return normalizeModelRows(rows,pageObj);

      const compatibleRows = await originalLoadPageGlyphBoxes(id,pageObj);
      if(MODEL_COMPAT_WORKS.has(parentId) && compatibleRows.length){
        return normalizeCompatibleRows(compatibleRows,pageObj);
      }
      return compatibleRows;
    };
    modelOverrideInstalled = true;

    /* 首屏可能已开始读取旧字框；统一数据就绪后主动重绘当前页。 */
    loadModelShard().then(data=>{
      if(!data.length && !MODEL_COMPAT_WORKS.has(parentId)) return;
      setTimeout(()=>{
        try{
          if(typeof loadPage === "function" && typeof currentPageIndex !== "undefined"){
            loadPage(currentPageIndex);
          }
        }catch(err){
          console.warn("[model-boxes] rerender failed",err);
        }
      },0);
    });
  }

  installModelBoxOverride();

  const INFO_URL = "data/beitie_info_texts.json?v=20260629_info";
  let infoCache = null;

  function workId(){
    return parentId;
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

  function setText(selector,text){
    const el=document.querySelector(selector);
    if(el && text) el.textContent=text;
  }

  function updateMetaLine(label,value){
    if(!value) return;
    document.querySelectorAll(".meta-line").forEach(line=>{
      const b=line.querySelector("b"),span=line.querySelector("span");
      if(b && span && b.textContent.trim().includes(label)){
        span.textContent=value;
      }
    });
  }

  function applyBasic(info){
    if(!info) return;
    if(info.title){
      document.title=info.title+" · 碑帖智能读析平台";
      setText(".info-panel h1",info.title);
      setText(".side .work-name",info.title);
      setText(".cover-label",info.title);
    }
    if(info.summary) setText(".alias",info.summary);
    const b=info.basic || {};
    updateMetaLine("责任者",b["责任者"]);
    updateMetaLine("书体",b["书体"]);
    updateMetaLine("版本",b["版本"]);
    updateMetaLine("数量",b["数量"]);
    updateMetaLine("尺寸",b["尺寸"]);
    updateMetaLine("年代",b["年代"]);
    updateMetaLine("地点",b["地点"]);
    updateMetaLine("馆藏",b["馆藏"]);
    updateMetaLine("来源",b["来源"]);
  }

  function setModal(kind,title,subtitle,bodyText){
    const btn=document.querySelector(`[data-modal="${kind}"]`);
    const modal=document.getElementById(`modal-${kind}`);
    if(!btn || !modal) return;

    if(!bodyText){
      btn.style.display="none";
      return;
    }

    btn.style.display="";
    const strong=btn.querySelector("strong");
    const desc=btn.querySelector("span:last-child");
    if(strong) strong.textContent=title;
    if(desc) desc.textContent=subtitle;

    const titleEl=modal.querySelector(".modal-title");
    const subEl=modal.querySelector(".modal-subtitle");
    const body=modal.querySelector(".modal-body");
    if(titleEl) titleEl.textContent=title;
    if(subEl) subEl.textContent=subtitle;
    if(body) body.innerHTML=textToHtml(bodyText);
  }

  function ensureStyle(){
    if(document.getElementById("beitie-info-style")) return;
    const style=document.createElement("style");
    style.id="beitie-info-style";
    style.textContent=`
      .alias{display:none!important;}
      .work-hero{align-items:stretch!important;}
      .work-hero .cover-panel{height:auto!important;min-height:310px!important;align-self:stretch!important;}
      .work-hero .cover-panel img{width:100%!important;height:100%!important;object-fit:cover!important;}
      .work-hero .info-panel{
        height:100%!important;
        align-self:stretch!important;
        display:flex!important;
        flex-direction:column!important;
      }
      .work-hero .info-panel h1{margin-bottom:10px!important;}
      .work-hero .info-panel .meta-lines{
        flex:1!important;
        align-content:space-evenly!important;
        row-gap:8px!important;
      }
      .work-hero .info-panel .meta-line{
        min-height:0!important;
        align-items:center!important;
      }
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

  function updateSourceNote(){
    const sourceParagraph=document.querySelector("#sources p");
    if(!sourceParagraph) return;
    if(MODEL_COMPAT_WORKS.has(parentId)){
      sourceParagraph.innerHTML="本作品的单字定位已采用与深度学习结果一致的统一边框坐标结构。";
    }else{
      sourceParagraph.innerHTML="本作品的单字定位优先读取深度学习模型最终边框修正坐标；模型页无结果时，再读取备用坐标。";
    }
  }

  function applyInfo(info){
    ensureStyle();
    applyBasic(info);
    updateSourceNote();
    setModal("history","收藏历史","流传经历与题记。",info.history || "");
    setModal("story","背景故事","作品背景、版本线索与重要考据点。",info.story || "");
  }

  async function loadAndApply(){
    try{
      if(!infoCache){
        const res=await fetch(INFO_URL,{cache:"no-store"});
        if(!res.ok) return;
        infoCache=await res.json();
      }
      const info=infoCache && infoCache.items && infoCache.items[workId()];
      if(!info){
        updateSourceNote();
        return;
      }
      applyInfo(info);

      /* detail.html 会异步写入旧模板，短时间内重复覆盖。 */
      let n=0;
      const timer=setInterval(()=>{
        applyInfo(info);
        n+=1;
        if(n>=12) clearInterval(timer);
      },350);
    }catch(e){
      console.warn("[beitie-info] failed",e);
    }
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",loadAndApply);
  }else{
    loadAndApply();
  }
})();