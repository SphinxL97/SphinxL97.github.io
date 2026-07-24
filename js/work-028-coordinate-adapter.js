/* 028《晋唐小楷九种》逐页真实坐标适配。 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="028"||window.__WORK_028_COORDINATE_ADAPTER__)return;
  const CACHE_TAG="20260725_jintang_nine_v1";
  const ROOT="data/glyph_boxes/iiif/028";
  const originalLoader=typeof window.loadPageGlyphBoxes==="function"?window.loadPageGlyphBoxes:null;
  const pagePromises=new Map();
  function rect(row){return{x:Number(row.x??row.bbox_x??row.bbox?.[0]??0),y:Number(row.y??row.bbox_y??row.bbox?.[1]??0),w:Number(row.w??row.bbox_w??row.bbox?.[2]??0),h:Number(row.h??row.bbox_h??row.bbox?.[3]??0)};}
  function normalizeRow(row,page,index){const box=rect(row);if(box.w<=0||box.h<=0)return null;const pageNo=Number(row.canvas_index||row.page||page||0);if(!pageNo)return null;const text=String(row.char||row.text||"").slice(0,1);return{...row,work_id:"028",canvas_index:pageNo,glyph_id:String(row.glyph_id||`028_${pageNo}_${index+1}`),char:text,text,order_in_page:Number(row.order_in_page||row.annotation_index||index+1),bbox_x:box.x,bbox_y:box.y,bbox_w:box.w,bbox_h:box.h,bbox:[box.x,box.y,box.w,box.h]};}
  async function fetchRows(page){const pageNo=Number(page||0);if(!pageNo)return[];if(pagePromises.has(pageNo))return pagePromises.get(pageNo);const promise=(async()=>{const response=await fetch(`${ROOT}/page_${String(pageNo).padStart(4,"0")}.json?v=${CACHE_TAG}`,{cache:"force-cache"});if(response.status===404)return[];if(!response.ok)throw new Error(`${response.status} ${response.statusText}`);const rows=await response.json();return(Array.isArray(rows)?rows:[]).map((row,index)=>normalizeRow(row,pageNo,index)).filter(Boolean).sort((a,b)=>a.order_in_page-b.order_in_page);})().catch(error=>{pagePromises.delete(pageNo);console.warn("[work-028-coordinate-adapter]",pageNo,error);return[];});pagePromises.set(pageNo,promise);return promise;}
  window.loadPageGlyphBoxes=async function(id,pageObj){const normalized=String(id||"").match(/^(\d{3})/)?.[1]||String(id||"").padStart(3,"0");if(normalized!=="028")return originalLoader?originalLoader(id,pageObj):[];const page=Number(pageObj?.canvas_index||pageObj?.page||0);const rows=(await fetchRows(page)).map(row=>({...row,local_image:pageObj?.image||row.local_image||""}));return rows.length?rows:(originalLoader?originalLoader(id,pageObj):[]);};
  window.WORK_028_COORDINATES={loadPageRows:fetchRows};
  window.__WORK_028_COORDINATE_ADAPTER__=true;
  window.dispatchEvent(new CustomEvent("work-028-coordinate-adapter-ready"));
})();
