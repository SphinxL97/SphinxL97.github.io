/* 016《上尊号碑受禅表合册》栏目一逐页真实坐标适配。 */
(function(){
  "use strict";

  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="016"||window.__WORK_016_COORDINATE_ADAPTER__)return;

  const CACHE_TAG="20260723_zunhao_shanrang_v1";
  const ROOT="data/glyph_boxes/iiif/016";
  const original=typeof window.loadPageGlyphBoxes==="function"?window.loadPageGlyphBoxes:null;
  const pagePromises=new Map();
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  function rect(row){
    return {
      x:Number(row.x??row.bbox_x??row.bbox?.[0]??0),
      y:Number(row.y??row.bbox_y??row.bbox?.[1]??0),
      w:Number(row.w??row.bbox_w??row.bbox?.[2]??0),
      h:Number(row.h??row.bbox_h??row.bbox?.[3]??0)
    };
  }

  function normalizeRow(row,page,index){
    const box=rect(row);
    if(box.w<=0||box.h<=0)return null;
    const pageNo=Number(row.canvas_index||row.page||page||0);
    if(!pageNo)return null;
    const text=String(row.char||row.text||"").slice(0,1);
    return {
      ...row,work_id:"016",canvas_index:pageNo,
      glyph_id:String(row.glyph_id||`016_${pageNo}_${index+1}`),
      char:text,text,
      order_in_page:Number(row.order_in_page||row.annotation_index||index+1),
      bbox_x:box.x,bbox_y:box.y,bbox_w:box.w,bbox_h:box.h,
      bbox:[box.x,box.y,box.w,box.h]
    };
  }

  async function fetchRows(page){
    const pageNo=Number(page||0);
    if(!pageNo)return [];
    if(pagePromises.has(pageNo))return pagePromises.get(pageNo);
    const promise=(async()=>{
      const url=`${ROOT}/page_${String(pageNo).padStart(4,"0")}.json?v=${CACHE_TAG}`;
      let lastError=null;
      for(let attempt=1;attempt<=3;attempt+=1){
        try{
          const response=await fetch(url,{cache:attempt===1?"force-cache":"reload"});
          if(response.status===404)return [];
          if(!response.ok)throw new Error(`${response.status} ${response.statusText}`);
          const rows=await response.json();
          return (Array.isArray(rows)?rows:[]).map((row,index)=>normalizeRow(row,pageNo,index)).filter(Boolean).sort((a,b)=>a.order_in_page-b.order_in_page);
        }catch(error){
          lastError=error;
          if(attempt<3)await sleep(350*attempt);
        }
      }
      throw lastError||new Error("016坐标读取失败");
    })().catch(error=>{
      pagePromises.delete(pageNo);
      console.warn("[work-016-coordinate-adapter]",pageNo,error);
      return [];
    });
    pagePromises.set(pageNo,promise);
    return promise;
  }

  window.loadPageGlyphBoxes=async function(id,pageObj){
    const normalized=String(id||"").match(/^(\d{3})/)?.[1]||String(id||"").padStart(3,"0");
    if(normalized!=="016")return original?original(id,pageObj):[];
    const page=Number(pageObj?.canvas_index||pageObj?.page||0);
    const rows=(await fetchRows(page)).map(row=>({...row,local_image:pageObj?.image||row.local_image||""}));
    if(rows.length)return rows;
    return original?original(id,pageObj):[];
  };

  window.WORK_016_COORDINATES={loadPageRows:fetchRows};
  window.__WORK_016_COORDINATE_ADAPTER__=true;

  function refreshReader(attempt=0){
    try{
      if(typeof pages!=="undefined"&&Array.isArray(pages)&&pages.length&&typeof loadPage==="function"){
        loadPage(typeof currentPageIndex==="number"?currentPageIndex:0);
        return;
      }
    }catch(error){
      console.warn("[work-016-coordinate-adapter] reader refresh",error);
    }
    if(attempt<100)setTimeout(()=>refreshReader(attempt+1),100);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>refreshReader(),{once:true});
  else refreshReader();
})();
