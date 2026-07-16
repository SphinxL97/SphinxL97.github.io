/* 作品003《龙藏寺碑》众智释读坐标适配。
 * 将已上传的逐页 IIIF 单字坐标转换为现有栏目四需要的分片数据格式。
 * 仅在 detail.html?id=003 时启用，不修改其他作品坐标。
 */
(function(){
  "use strict";

  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
  if(parentId!=="003"||window.__WORK_003_COORDINATE_ADAPTER__) return;
  window.__WORK_003_COORDINATE_ADAPTER__=true;

  const nativeFetch=window.fetch.bind(window);
  let coordinatePromise=null;
  const number=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const requestUrl=input=>typeof input==="string"?input:(input&&input.url)||"";
  const isShard=input=>/data\/model_boxes\/glyph_model_border_001_005\.json$/i.test(requestUrl(input).split("?")[0]);

  function normalizePage(boxes,pageNo){
    return (Array.isArray(boxes)?boxes:[]).map((box,index)=>{
      const bbox=Array.isArray(box.bbox)?box.bbox:[];
      const x=number(box.x,number(box.bbox_x,number(bbox[0])));
      const y=number(box.y,number(box.bbox_y,number(bbox[1])));
      const w=number(box.w,number(box.bbox_w,number(bbox[2])));
      const h=number(box.h,number(box.bbox_h,number(bbox[3])));
      return {
        ...box,
        virtual_id:"003",
        work_id:"003",
        canvas_index:pageNo,
        page:pageNo,
        glyph_id:String(box.glyph_id||`003_${pageNo}_${index+1}`),
        char:String(box.char||box.text||"").slice(0,1),
        text:String(box.char||box.text||"").slice(0,1),
        order_in_page:number(box.order_in_page,index+1),
        canvas_width:number(box.canvas_width,1539),
        canvas_height:number(box.canvas_height,2250),
        x,y,w,h,
        bbox_x:x,bbox_y:y,bbox_w:w,bbox_h:h
      };
    }).sort((a,b)=>a.order_in_page-b.order_in_page);
  }

  async function buildRows(){
    const pageResponse=await nativeFetch("data/page_images_index.json?v=20260716_longzangsi_coords_v1",{cache:"no-store"});
    if(!pageResponse.ok) throw new Error(`page index ${pageResponse.status}`);
    const pageData=await pageResponse.json();
    const pages=Array.isArray(pageData?.works?.["003"]?.pages)?pageData.works["003"].pages:[];
    const groups=await Promise.all(pages.map(async(page,index)=>{
      const pageNo=number(page.canvas_index||page.page,index+1);
      const path=`data/glyph_boxes/iiif/003/page_${String(pageNo).padStart(4,"0")}.json?v=20260716_longzangsi_coords_v1`;
      try{
        const response=await nativeFetch(path,{cache:"no-store"});
        if(!response.ok) return [];
        return normalizePage(await response.json(),pageNo);
      }catch(_){return [];}
    }));
    return groups.flat();
  }

  window.fetch=async function(input,init){
    if(!isShard(input)) return nativeFetch(input,init);
    try{
      coordinatePromise=coordinatePromise||buildRows();
      return new Response(JSON.stringify(await coordinatePromise),{status:200,headers:{"Content-Type":"application/json; charset=utf-8"}});
    }catch(error){
      console.error("[work-003-coordinates] IIIF坐标转换失败",error);
      return nativeFetch(input,init);
    }
  };
})();
