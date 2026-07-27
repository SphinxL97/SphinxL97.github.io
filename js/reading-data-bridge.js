(function(){
  "use strict";

  const originalFetch = window.fetch.bind(window);

  function padId(value){
    return String(value || "").padStart(3,"0");
  }

  function asArray(value){
    if(Array.isArray(value)) return value.filter(Boolean);
    if(value === undefined || value === null || value === "") return [];
    return [value];
  }

  function requestUrl(input){
    if(typeof input === "string") return input;
    if(input && typeof input.url === "string") return input.url;
    return "";
  }

  function matchesFile(input,path){
    return requestUrl(input).split(/[?#]/,1)[0].endsWith(path);
  }

  function jsonResponse(source,data){
    const headers = new Headers(source.headers);
    headers.set("content-type","application/json; charset=utf-8");
    return new Response(JSON.stringify(data),{
      status:source.status,
      statusText:source.statusText,
      headers
    });
  }

  function ensureReadingCatalog(data){
    const catalog = Array.isArray(data) ? data.map(item=>({...item})) : [];
    const ids = new Set(catalog.map(item=>padId(item && item.id)));

    if(!ids.has("031")){
      catalog.push({
        id:"031",
        title:"黄庭堅青原山诗刻石",
        cover:"assets/page_images/031_黄庭堅青原山诗刻石/images/01_黄庭堅青原山诗刻石(第一辑)册一/0001_一.jpg",
        dynasty:"北宋",
        script:"行书",
        creator:"黄庭坚",
        active:true,
        has_volumes:true,
        detail_url:"detail.html?id=031-01",
        status:"多册可选",
        subtitle:"两册图像、释文与赏读入口已接入。",
        shelf_mark:"49B840",
        volumes:[
          {volume_id:"01",virtual_id:"031-01",detail_url:"detail.html?id=031-01"},
          {volume_id:"02",virtual_id:"031-02",detail_url:"detail.html?id=031-02"}
        ]
      });
    }

    return catalog;
  }

  function ensureReadingMetadata(data){
    const metadata = Array.isArray(data) ? data.map(item=>({...item})) : [];
    const map = new Map(metadata.map(item=>[padId(item && item.id),item]));

    if(!map.has("031")){
      const item = {
        id:"031",
        title:"黄庭堅青原山诗刻石",
        aliases:["黄庭坚青原山诗刻石"],
        type:["刻石"],
        dynasty:["北宋"],
        script:["行书"],
        authors:["黄庭坚"],
        writers:["黄庭坚"],
        copy_era:["旧拓待核"],
        version_type:["拓本"],
        themes:["书法","诗歌","山川游历"],
        keywords:["黄庭坚","青原山","诗刻石"]
      };
      metadata.push(item);
      map.set("031",item);
    }

    const crane = map.get("036");
    if(crane){
      const scripts = asArray(crane.script);
      if(!scripts.includes("楷书")) scripts.push("楷书");
      crane.script = scripts;
    }

    return metadata;
  }

  window.fetch = async function(input,init){
    const response = await originalFetch(input,init);
    if(!response.ok) return response;

    try{
      if(matchesFile(input,"data/beitie_catalog.json")){
        const data = await response.clone().json();
        return jsonResponse(response,ensureReadingCatalog(data));
      }
      if(matchesFile(input,"data/beitie_search_metadata.json")){
        const data = await response.clone().json();
        return jsonResponse(response,ensureReadingMetadata(data));
      }
    }catch(error){
      console.error("[reading-data-bridge] 数据补全失败",error);
    }

    return response;
  };
})();
