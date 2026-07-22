/* 007《伊阙佛龛碑》栏目一真实逐字坐标适配。 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="007"||window.__WORK_007_COORDINATE_ADAPTER__)return;
  window.__WORK_007_COORDINATE_ADAPTER__=true;

  const MODEL_URL="data/model_boxes/glyph_model_border_006_010.json?v=20260722_yique_final_v1";
  const original=typeof window.loadPageGlyphBoxes==="function"?window.loadPageGlyphBoxes:null;
  let groupedPromise=null;

  function rect(row){
    return {
      x:Number(row.x??row.bbox_x??row.bbox?.[0]??0),
      y:Number(row.y??row.bbox_y??row.bbox?.[1]??0),
      w:Number(row.w??row.bbox_w??row.bbox?.[2]??0),
      h:Number(row.h??row.bbox_h??row.bbox?.[3]??0)
    };
  }

  function loadGroupedRows(){
    if(!groupedPromise){
      groupedPromise=fetch(MODEL_URL,{cache:"force-cache"})
        .then(response=>{if(!response.ok)throw new Error(`伊阙佛龛碑坐标 ${response.status}`);return response.json();})
        .then(rows=>{
          const groups=new Map();
          (Array.isArray(rows)?rows:[])
            .filter(row=>String(row.work_id||"").padStart(3,"0")==="007")
            .forEach((row,index)=>{
              const page=Number(row.canvas_index||row.page||0);
              if(!page)return;
              const box=rect(row);
              if(box.w<=0||box.h<=0)return;
              if(!groups.has(page))groups.set(page,[]);
              const text=String(row.char||row.text||"").slice(0,1);
              groups.get(page).push({
                ...row,work_id:"007",canvas_index:page,
                glyph_id:String(row.glyph_id||`007_${page}_${index+1}`),
                char:text,text,
                order_in_page:Number(row.order_in_page||index+1),
                bbox_x:box.x,bbox_y:box.y,bbox_w:box.w,bbox_h:box.h,
                bbox:[box.x,box.y,box.w,box.h]
              });
            });
          groups.forEach(list=>list.sort((a,b)=>a.order_in_page-b.order_in_page));
          return groups;
        })
        .catch(error=>{console.error("[work-007-coordinate-adapter]",error);return new Map();});
    }
    return groupedPromise;
  }

  window.loadPageGlyphBoxes=async function(id,pageObj){
    const normalized=String(id||"").split("-")[0].padStart(3,"0");
    if(normalized!=="007")return original?original(id,pageObj):[];
    const groups=await loadGroupedRows();
    const page=Number(pageObj?.canvas_index||pageObj?.page||0);
    const rows=(groups.get(page)||[]).map(row=>({...row,local_image:pageObj?.image||row.local_image||""}));
    if(rows.length)return rows;
    return original?original(id,pageObj):[];
  };
})();