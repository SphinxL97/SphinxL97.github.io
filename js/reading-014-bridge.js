(function(){
  "use strict";

  const previousFetch = window.fetch.bind(window);

  function requestUrl(input){
    if(typeof input === "string") return input;
    return input && typeof input.url === "string" ? input.url : "";
  }

  function matches(input,path){
    return requestUrl(input).split(/[?#]/,1)[0].endsWith(path);
  }

  function patchedResponse(source,data){
    const headers = new Headers(source.headers);
    headers.set("content-type","application/json; charset=utf-8");
    return new Response(JSON.stringify(data),{
      status:source.status,
      statusText:source.statusText,
      headers
    });
  }

  function addCatalog014(data){
    const items = Array.isArray(data) ? data : [];
    if(items.some(item=>String(item && item.id).padStart(3,"0") === "014")) return items;
    return [...items,{
      id:"014",
      title:"颜真卿李玄靖碑",
      cover:"assets/page_images/014_颜真卿李玄靖碑/images/01_顏真卿李玄靖碑册一/0001_一.jpg",
      dynasty:"唐",
      script:"楷书",
      creator:"颜真卿",
      active:true,
      has_volumes:true,
      detail_url:"detail.html?id=014-01",
      status:"多册可选",
      subtitle:"两册图像、释文与赏读入口已接入。",
      shelf_mark:"22BT013"
    }];
  }

  function addMetadata014(data){
    const items = Array.isArray(data) ? data : [];
    if(items.some(item=>String(item && item.id).padStart(3,"0") === "014")) return items;
    return [...items,{
      id:"014",
      title:"颜真卿李玄靖碑",
      aliases:["茅山玄靖先生碑","大唐茅山玄靖先生广陵李君碑铭"],
      type:["碑"],
      dynasty:["唐"],
      reign:"大历十二年",
      year:777,
      place:["江苏句容茅山","原石散佚"],
      script:["楷书"],
      authors:["颜真卿"],
      writers:["颜真卿"],
      copy_era:["南宋"],
      version_type:["拓本"],
      themes:["道教","高道传记","茅山","书法"],
      keywords:["李玄靖碑","李含光","茅山","吴崇休"]
    }];
  }

  window.fetch = async function(input,init){
    const response = await previousFetch(input,init);
    if(!response.ok) return response;
    try{
      if(matches(input,"data/beitie_catalog.json")){
        return patchedResponse(response,addCatalog014(await response.clone().json()));
      }
      if(matches(input,"data/beitie_search_metadata.json")){
        return patchedResponse(response,addMetadata014(await response.clone().json()));
      }
    }catch(error){
      console.error("[reading-014-bridge] 数据补全失败",error);
    }
    return response;
  };
})();
