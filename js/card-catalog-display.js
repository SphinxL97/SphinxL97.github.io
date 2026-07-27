(function(){
  "use strict";

  if(window.__BEITIE_COMPACT_CARD_DISPLAY__) return;
  window.__BEITIE_COMPACT_CARD_DISPLAY__ = true;

  const METADATA_URL = "data/beitie_search_metadata.json";
  const metadataMap = new Map();
  const FALLBACK_METADATA = [
    {id:"014",writers:["颜真卿"],script:["楷书"]},
    {id:"031",writers:["黄庭坚"],script:["行书"]}
  ];

  function asArray(value){
    if(Array.isArray(value)) return value.filter(Boolean);
    if(value === undefined || value === null || value === "") return [];
    return [value];
  }

  function padId(value){
    return String(value || "").padStart(3,"0");
  }

  function normalizeWriterName(value){
    const original = String(value || "").trim();
    const compact = original.normalize("NFKC").replace(/\s+/g,"")
      .replaceAll("臨","临").replaceAll("傳","传")
      .replaceAll("懷","怀").replaceAll("書","书");
    if(compact === "褚遂良(临/传)") return "";
    if(compact === "怀仁集王羲之书") return "王羲之";
    return original;
  }

  function normalizedWriters(meta){
    if(!meta || meta.person_search_excluded) return [];
    return [...new Set(asArray(meta.writers).map(normalizeWriterName).filter(Boolean))];
  }

  function writerLabel(value){
    const original = String(value || "").trim();
    const compact = original.normalize("NFKC").replace(/\s+/g,"")
      .replaceAll("臨","临").replaceAll("傳","传")
      .replaceAll("書","书");

    const transmitted = compact.match(/^(.+?)[（(]传[）)]$/);
    if(transmitted) return `传${transmitted[1]}书`;

    const copied = compact.match(/^(.+?)[（(]临[）)]$/);
    if(copied) return `${copied[1]}临`;

    if(/书$/.test(compact)) return compact;
    return `${original}书`;
  }

  function responsibilityFor(id,meta){
    if(id === "025") return "王羲之集字";
    const writers = normalizedWriters(meta);
    if(!writers.length) return "书者待考";
    return writers.map(writerLabel).join("、");
  }

  function scriptFor(meta){
    return asArray(meta && meta.script)[0] || "书体待考";
  }

  function cardId(card){
    const badge = card.querySelector(".card-id");
    if(badge && /^\d{1,3}$/.test(badge.textContent.trim())) return padId(badge.textContent.trim());

    const href = card.getAttribute("href") || "";
    const hrefMatch = href.match(/[?&]id=(\d{3})(?:-\d+)?/);
    if(hrefMatch) return hrefMatch[1];

    const onclick = card.getAttribute("onclick") || "";
    const modalMatch = onclick.match(/openVolumeModal\(['"](\d{3})['"]\)/);
    return modalMatch ? modalMatch[1] : "";
  }

  function compactMeta(card){
    const id = cardId(card);
    if(!id) return;

    const meta = metadataMap.get(id);
    if(!meta) return;

    const host = card.querySelector(".card-info .meta, .reading-card-info .card-meta");
    if(!host || host.dataset.compactCatalogMeta === "1") return;

    host.textContent = "";
    host.classList.add("card-attribution");

    const writer = document.createElement("span");
    writer.className = "writer-relation";
    writer.textContent = responsibilityFor(id,meta);

    const separator = document.createElement("span");
    separator.className = "meta-separator";
    separator.textContent = "·";

    const script = document.createElement("span");
    script.className = "script-name";
    script.textContent = scriptFor(meta);

    host.append(writer,separator,script);
    host.dataset.compactCatalogMeta = "1";
  }

  function applyAll(root=document){
    root.querySelectorAll(".beitie-card, .reading-card").forEach(compactMeta);
  }

  function observeCards(){
    ["galleryGrid","readingGroups"].forEach(id=>{
      const host = document.getElementById(id);
      if(!host) return;
      new MutationObserver(()=>applyAll(host)).observe(host,{childList:true,subtree:true});
      applyAll(host);
    });
  }

  function addStyle(){
    if(document.getElementById("compact-catalog-card-style")) return;
    const style = document.createElement("style");
    style.id = "compact-catalog-card-style";
    style.textContent = `
      #galleryGrid .card-info,
      .reading-card .reading-card-info{
        min-height:99px;
        padding:13px 16px 16px;
      }
      #galleryGrid .card-info h3,
      .reading-card .reading-card-info h4{
        margin-bottom:12px;
      }
      #galleryGrid .meta.card-attribution,
      .reading-card .card-meta.card-attribution{
        min-height:22px;
        display:flex;
        align-items:center;
        flex-wrap:nowrap;
        gap:8px;
        overflow:hidden;
        color:#796b5d;
        font-size:13px;
        line-height:1.5;
      }
      .card-attribution .writer-relation{
        min-width:0;
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
        color:#57493d;
      }
      .card-attribution .meta-separator{
        flex:0 0 auto;
        color:#b5a18b;
      }
      .card-attribution .script-name{
        flex:0 0 auto;
        white-space:nowrap;
        color:#826b50;
      }
    `;
    document.head.appendChild(style);
  }

  async function init(){
    addStyle();
    observeCards();
    try{
      const response = await fetch(METADATA_URL,{cache:"no-store"});
      if(!response.ok) throw new Error(`${METADATA_URL} ${response.status}`);
      const data = await response.json();
      asArray(data).forEach(item=>{
        if(item && item.id) metadataMap.set(padId(item.id),item);
      });
      FALLBACK_METADATA.forEach(item=>{
        if(!metadataMap.has(item.id)) metadataMap.set(item.id,item);
      });
      applyAll();
    }catch(error){
      console.error("[card-display] 卡片责任者信息读取失败",error);
    }
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();