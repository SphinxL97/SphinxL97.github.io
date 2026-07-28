(function(){
  "use strict";

  document.documentElement.classList.add("catalog-ui-pending");
  if(!document.getElementById("reading-ui-pending-style")){
    const pendingStyle=document.createElement("style");
    pendingStyle.id="reading-ui-pending-style";
    pendingStyle.textContent="html.catalog-ui-pending #readingGroups,html.catalog-ui-pending #categoryStrip{visibility:hidden;}";
    document.head.appendChild(pendingStyle);
  }

  const previousFetch = window.fetch.bind(window);
  const originalFreeze = Object.freeze;

  const CATALOG_014 = {
    id:"014",title:"颜真卿李玄靖碑",
    cover:"assets/page_images/014_颜真卿李玄靖碑/images/01_顏真卿李玄靖碑册一/0001_一.jpg",
    dynasty:"唐",script:"楷书",creator:"颜真卿撰并书",
    detail_url:"detail.html?id=014-01",has_volumes:true
  };
  const CATALOG_031 = {
    id:"031",title:"黄庭堅青原山诗刻石",
    cover:"assets/page_images/031_黄庭堅青原山诗刻石/images/01_黄庭堅青原山诗刻石(第一辑)册一/0001_一.jpg",
    dynasty:"北宋",script:"行书",creator:"黄庭坚",
    detail_url:"detail.html?id=031-01",has_volumes:true
  };

  function padId(value){return String(value || "").padStart(3,"0")}
  function asArray(value){
    if(Array.isArray(value)) return value.filter(Boolean);
    if(value === undefined || value === null || value === "") return [];
    return [value];
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
  function normalizeWriters(value){
    return [...new Set(asArray(value).map(normalizeWriterName).filter(Boolean))];
  }
  function requestUrl(input){
    if(typeof input === "string") return input;
    return input && typeof input.url === "string" ? input.url : "";
  }
  function matches(input,path){return requestUrl(input).split(/[?#]/,1)[0].endsWith(path)}
  function jsonResponse(source,data){
    const headers = new Headers(source.headers);
    headers.set("content-type","application/json; charset=utf-8");
    return new Response(JSON.stringify(data),{status:source.status,statusText:source.statusText,headers});
  }
  function addCatalogWork(items,work){
    if(items.some(item=>padId(item && item.id) === work.id)) return;
    items.push({...work});
  }
  function ensureCatalog(data){
    const items = Array.isArray(data) ? data.map(item=>({...item})) : [];
    addCatalogWork(items,CATALOG_014);
    addCatalogWork(items,CATALOG_031);
    return items;
  }
  function ensureMetadata(data){
    const items = Array.isArray(data)
      ? data.map(item=>({...item,writers:normalizeWriters(item && item.writers)}))
      : [];
    const map = new Map(items.map(item=>[padId(item && item.id),item]));

    if(!map.has("014")){
      const item={id:"014",title:"颜真卿李玄靖碑",aliases:["茅山玄靖先生碑"],type:["碑"],dynasty:["唐"],script:["楷书"],authors:["颜真卿"],writers:["颜真卿"],copy_era:["南宋"],themes:["道教","高道传记","茅山","书法"],keywords:["李玄靖碑","李含光","茅山"]};
      items.push(item);map.set("014",item);
    }
    if(!map.has("031")){
      const item={id:"031",title:"黄庭堅青原山诗刻石",aliases:["黄庭坚青原山诗刻石"],type:["刻石"],dynasty:["北宋"],script:["行书"],authors:["黄庭坚"],writers:["黄庭坚"],copy_era:["旧拓待核"],themes:["书法","诗歌","山川游历"],keywords:["黄庭坚","青原山","诗刻石"]};
      items.push(item);map.set("031",item);
    }

    let crane = map.get("036");
    if(!crane){
      crane={id:"036",title:"瘗鹤铭",aliases:["瘞鶴銘"],type:["刻石"],dynasty:["南朝梁"],script:["正书"],authors:["华阳真逸"],writers:["上皇山樵"],copy_era:["宋代"],themes:["道教","葬鹤","摩崖书法","书法"],keywords:["瘗鹤铭","焦山","正书"]};
      items.push(crane);map.set("036",crane);
    }else{
      crane.script=["正书"];
      crane.writers=normalizeWriters(crane.writers);
    }
    return items;
  }

  Object.freeze = function(value){
    let restoreAfterFreeze = false;
    if(Array.isArray(value)){
      const scriptConfig = value.find(item=>item && item.key === "script" && Array.isArray(item.values));
      if(scriptConfig && !scriptConfig.values.includes("正书")) scriptConfig.values.splice(1,0,"正书");
      const typeIndex=value.findIndex(item=>item && item.key === "type");
      const scriptIndex=value.findIndex(item=>item && item.key === "script");
      if(typeIndex>=0 && scriptIndex>typeIndex){
        const [scriptItem]=value.splice(scriptIndex,1);
        value.splice(typeIndex,0,scriptItem);
      }
    }else if(value && typeof value === "object"){
      if(value["楷书"] && value["隶书"] && !value["正书"]){
        value["正书"]="以端正、庄重的书写面貌为主，兼具碑刻体势与自然书写意味。";
      }
      if(value["006"] && value["007"] && value["030"]){
        if(!value["014"]) value["014"]={...CATALOG_014};
        if(!value["031"]) value["031"]={...CATALOG_031};
        restoreAfterFreeze = true;
      }
    }
    const frozen = originalFreeze(value);
    if(restoreAfterFreeze) Object.freeze = originalFreeze;
    return frozen;
  };

  window.fetch = async function(input,init){
    const response = await previousFetch(input,init);
    if(!response.ok) return response;
    try{
      if(matches(input,"data/beitie_catalog.json")) return jsonResponse(response,ensureCatalog(await response.clone().json()));
      if(matches(input,"data/beitie_search_metadata.json")) return jsonResponse(response,ensureMetadata(await response.clone().json()));
    }catch(error){
      console.error("[reading-final-fix] 数据补全失败",error);
    }
    return response;
  };
})();

(function(){
  if(!document.querySelector('script[data-card-catalog-display]')){
    const script=document.createElement("script");
    script.src="js/card-catalog-display.js?v=20260728_centered_v2";
    script.dataset.cardCatalogDisplay="true";
    document.head.appendChild(script);
  }
  if(!document.querySelector('script[data-catalog-ui-polish]')){
    const polish=document.createElement("script");
    polish.src="js/catalog-ui-polish.js?v=20260728_continuous_hover_v4";
    polish.dataset.catalogUiPolish="true";
    document.head.appendChild(polish);
  }
})();
