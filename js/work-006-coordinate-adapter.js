/* 006《史晨后碑》栏目一逐字坐标适配。
 * detail.html 默认读取逐页 IIIF 文件；006 的现有坐标保存在 006—010 分片中。
 * 本脚本只替换006的逐页坐标读取函数，不拦截全局 fetch，不影响其他碑帖。
 */
(function(){
  "use strict";

  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
  if(parentId!=="006"||window.__WORK_006_COORDINATE_ADAPTER__)return;
  window.__WORK_006_COORDINATE_ADAPTER__=true;

  const MODEL_URL="data/model_boxes/glyph_model_border_006_010.json?v=20260720_work006_v1";
  const original=typeof window.loadPageGlyphBoxes==="function"?window.loadPageGlyphBoxes:null;
  let rowsPromise=null;

  function loadRows(){
    if(!rowsPromise){
      rowsPromise=fetch(MODEL_URL,{cache:"force-cache"}).then(response=>{
        if(!response.ok)throw new Error(`史晨后碑坐标 ${response.status}`);
        return response.json();
      }).then(rows=>{
        const groups=new Map();
        (Array.isArray(rows)?rows:[]).filter(row=>String(row.work_id||"").padStart(3,"0")==="006").forEach((row,index)=>{
          const page=Number(row.canvas_index||row.page||0);if(!page)return;
          if(!groups.has(page))groups.set(page,[]);
          const char=String(row.char||row.text||"").slice(0,1);
          groups.get(page).push({
            ...row,
            work_id:"006",
            canvas_index:page,
            glyph_id:String(row.glyph_id||`006_${page}_${index+1}`),
            char,
            text:char,
            order_in_page:Number(row.order_in_page||index+1),
            bbox_x:Number(row.x??row.bbox_x??0),
            bbox_y:Number(row.y??row.bbox_y??0),
            bbox_w:Number(row.w??row.bbox_w??0),
            bbox_h:Number(row.h??row.bbox_h??0),
            bbox:[
              Number(row.x??row.bbox_x??0),
              Number(row.y??row.bbox_y??0),
              Number(row.w??row.bbox_w??0),
              Number(row.h??row.bbox_h??0)
            ]
          });
        });
        groups.forEach(list=>list.sort((a,b)=>a.order_in_page-b.order_in_page));
        return groups;
      }).catch(error=>{
        console.error("[work-006-coordinate-adapter]",error);
        return new Map();
      });
    }
    return rowsPromise;
  }

  window.loadPageGlyphBoxes=async function(id,pageObj){
    const normalized=String(id||"").split("-")[0].padStart(3,"0");
    if(normalized!=="006")return original?original(id,pageObj):[];
    const groups=await loadRows();
    const page=Number(pageObj?.canvas_index||pageObj?.page||0);
    const rows=(groups.get(page)||[]).map(row=>({...row,local_image:pageObj?.image||row.local_image||""}));
    if(rows.length)return rows;
    return original?original(id,pageObj):[];
  };
})();