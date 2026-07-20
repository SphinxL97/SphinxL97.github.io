/* 006《史晨后碑》题签页过滤。
 * 第11页为题签、题记与后人书写，不纳入碑文释文、残损案例及AI补字意见。
 * 本脚本只过滤006案例数据，不修改其他碑帖。
 */
(function(){
  "use strict";

  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
  if(parentId!=="006"||window.__WORK_006_TITLE_PAGE_FILTER__)return;
  window.__WORK_006_TITLE_PAGE_FILTER__=true;

  const nativeFetch=window.fetch.bind(window);
  const requestUrl=input=>typeof input==="string"?input:(input&&input.url)||"";

  window.fetch=async function(input,init){
    const response=await nativeFetch(input,init);
    const url=requestUrl(input);
    if(!/data\/shichenhou_damage_cases\.json(?:\?|$)/i.test(url))return response;

    try{
      const rows=await response.clone().json();
      if(!Array.isArray(rows))return response;

      const filtered=rows.filter(item=>{
        const original=String(item?.o||item?.original||"");
        const originalId=String(item?.id||"").padStart(2,"0");
        return originalId!=="01"&&!original.includes("惜道味齋");
      });

      filtered.forEach((item,index)=>{
        item.id=String(index+1).padStart(2,"0");
      });

      return new Response(JSON.stringify(filtered),{
        status:response.status,
        statusText:response.statusText,
        headers:{"Content-Type":"application/json; charset=utf-8"}
      });
    }catch(error){
      console.warn("[work-006-title-page-filter]",error);
      return response;
    }
  };
})();