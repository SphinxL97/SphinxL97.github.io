/* 碑帖详情页核心兼容入口：保留原功能，仅统一栏目一坐标来源。
   014、031 使用 IIIF；其余作品只使用深度学习模型结果。
 */
(function(){
  "use strict";
  if(window.__DETAIL_CORE_COORDINATE_POLICY_V1__)return;
  window.__DETAIL_CORE_COORDINATE_POLICY_V1__=true;

  const LEGACY_COMMIT="0f1114e833fe77ad7afac50e228b4dfbe2999a1d";
  const LEGACY_SOURCES=[
    `https://cdn.jsdelivr.net/gh/SphinxL97/SphinxL97.github.io@${LEGACY_COMMIT}/js/detail_info_patch_core.js`,
    `https://raw.githubusercontent.com/SphinxL97/SphinxL97.github.io/${LEGACY_COMMIT}/js/detail_info_patch_core.js`
  ];
  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
  const iiifOnly=new Set(["014","031"]);
  const useIiif=iiifOnly.has(parentId);
  const IIIF_DATA_URL="data/glyph_records_iiif.json?v=20260727_column_one_policy_v2";

  function loadLegacyCore(){
    for(const url of LEGACY_SOURCES){
      try{
        const request=new XMLHttpRequest();
        request.open("GET",url,false);
        request.send(null);
        if((request.status>=200&&request.status<300)||request.status===0){
          (0,eval)(`${request.responseText}\n//# sourceURL=${url}`);
          return true;
        }
      }catch(error){
        console.warn("[detail-core-policy] legacy core source failed",url,error);
      }
    }
    console.error("[detail-core-policy] legacy core unavailable; coordinate policy remains isolated from columns 2-4");
    return false;
  }

  function rectOf(row){
    const bbox=Array.isArray(row?.bbox)?row.bbox:[];
    const bboxXYWH=Array.isArray(row?.bbox_xywh)?row.bbox_xywh:[];
    return{
      x:Number(row?.x??row?.border_x??row?.display_x??row?.model_x??row?.bbox_x??bbox[0]??bboxXYWH[0]??0),
      y:Number(row?.y??row?.border_y??row?.display_y??row?.model_y??row?.bbox_y??bbox[1]??bboxXYWH[1]??0),
      w:Number(row?.w??row?.border_w??row?.display_w??row?.model_w??row?.bbox_w??bbox[2]??bboxXYWH[2]??0),
      h:Number(row?.h??row?.border_h??row?.display_h??row?.model_h??row?.bbox_h??bbox[3]??bboxXYWH[3]??0)
    };
  }
  function isIiifSource(row){
    const source=String(row?.source||"").toLowerCase();
    return source.includes("iiif")||source.includes("annotation_target_xywh");
  }
  function isModelSource(row){
    const source=String(row?.source||"").toLowerCase();
    return source.includes("model")||source.includes("border_refined")||source.includes("deep");
  }
  function normalizeRows(rows,pageObj,source){
    return rows.map((row,index)=>{
      const box=rectOf(row);
      const text=String(row?.char||row?.text||"").slice(0,1);
      return{
        ...row,
        glyph_id:String(row?.glyph_id||`${rawId}_p${pageObj.canvas_index}_${source}_${index+1}`),
        char:text,
        text,
        order_in_page:Number(row?.order_in_page||row?.annotation_index||index+1),
        canvas_index:Number(pageObj.canvas_index||pageObj.page||0),
        canvas_label:pageObj.canvas_label||pageObj.label||pageObj.canvas_index,
        local_image:pageObj.image||row?.local_image||"",
        canvas_width:Number(row?.canvas_width||pageObj.canvas_width||0),
        canvas_height:Number(row?.canvas_height||pageObj.canvas_height||0),
        x:box.x,y:box.y,w:box.w,h:box.h,
        bbox_x:box.x,bbox_y:box.y,bbox_w:box.w,bbox_h:box.h,
        bbox:[box.x,box.y,box.w,box.h],
        source:row?.source||source
      };
    }).filter(row=>row.w>0&&row.h>0);
  }
  function textOnlyRows(pageObj,source){
    const chars=Array.from(String(pageObj?.text_clean||""));
    const page=Number(pageObj?.canvas_index||pageObj?.page||0);
    if(!chars.length)chars.push("");
    return chars.map((char,index)=>({
      glyph_id:`${rawId}_p${page}_${source}_empty_${index+1}`,
      char,text:char,order_in_page:index+1,canvas_index:page,
      canvas_label:pageObj?.canvas_label||pageObj?.label||page,
      local_image:pageObj?.image||"",no_box:true,source
    }));
  }

  let iiifPromise=null;
  async function loadIiifData(){
    if(iiifPromise)return iiifPromise;
    iiifPromise=fetch(IIIF_DATA_URL,{cache:"no-store"})
      .then(response=>{
        if(!response.ok)throw new Error(`${IIIF_DATA_URL} ${response.status}`);
        return response.json();
      })
      .then(data=>Array.isArray(data)?data:[])
      .catch(error=>{
        console.warn("[detail-core-policy] IIIF data load failed",error);
        return[];
      });
    return iiifPromise;
  }
  async function iiifRowsForPage(pageObj){
    const data=await loadIiifData();
    const page=Number(pageObj?.canvas_index||pageObj?.page||0);
    const effective=(typeof EFFECTIVE_WORK_ID!=="undefined"&&EFFECTIVE_WORK_ID)?String(EFFECTIVE_WORK_ID):rawId;
    const rows=data.filter(row=>{
      const virtual=String(row?.virtual_id||"");
      const work=String(row?.work_id||"");
      const workPrefix=(work.match(/^(\d{3})/)||[])[1]||String(row?.work_index||"").padStart(3,"0");
      const idMatch=virtual?virtual===effective:workPrefix===parentId;
      return idMatch&&Number(row?.canvas_index||row?.page||0)===page&&isIiifSource(row);
    });
    return normalizeRows(rows,pageObj,"iiif_annotation_target_xywh");
  }

  loadLegacyCore();

  let downstreamLoader=typeof window.loadPageGlyphBoxes==="function"?window.loadPageGlyphBoxes:null;
  let policyDepth=0;
  const policyLoader=async function(id,pageObj){
    if(policyDepth>0)return textOnlyRows(pageObj,useIiif?"iiif_no_box":"model_no_box");
    policyDepth+=1;
    try{
      if(useIiif){
        const direct=await iiifRowsForPage(pageObj);
        return direct.length?direct:textOnlyRows(pageObj,"iiif_no_box");
      }
      const downstream=downstreamLoader&&downstreamLoader!==policyLoader?await downstreamLoader(id,pageObj):[];
      const model=normalizeRows((Array.isArray(downstream)?downstream:[]).filter(isModelSource),pageObj,"model_border_refined");
      return model.length?model:textOnlyRows(pageObj,"model_no_box");
    }finally{
      policyDepth-=1;
    }
  };

  function enforcePolicyLoader(){
    const current=window.loadPageGlyphBoxes;
    if(current!==policyLoader){
      if(typeof current==="function"&&current!==policyLoader)downstreamLoader=current;
      window.loadPageGlyphBoxes=policyLoader;
    }
  }
  enforcePolicyLoader();
  let guardChecks=0;
  const guard=setInterval(()=>{
    enforcePolicyLoader();
    guardChecks+=1;
    if(guardChecks>=200)clearInterval(guard);
  },50);

  window.__COLUMN_ONE_COORDINATE_POLICY__={
    parentId,
    rawId,
    policy:useIiif?"iiif":"model",
    exceptions:["014","031"],
    version:"20260727_column_one_policy_v2"
  };

  function refreshReader(attempt=0){
    try{
      if(typeof loadPage==="function"&&typeof currentPageIndex!=="undefined"){
        enforcePolicyLoader();
        loadPage(currentPageIndex);
        return;
      }
    }catch(error){
      console.warn("[detail-core-policy] reader refresh failed",error);
    }
    if(attempt<120)setTimeout(()=>refreshReader(attempt+1),100);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>refreshReader(),{once:true});
  else refreshReader();
})();
