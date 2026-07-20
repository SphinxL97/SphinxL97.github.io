/*
 * 全文浏览单字红框对齐修正。
 * 直接使用当前页逐字坐标，并根据图片实际渲染宽、高分别计算比例，
 * 避免单一缩放比例造成红框横向或纵向偏移。
 */
(function(){
  "use strict";
  if(window.__READER_BOX_ALIGNMENT_PATCH_V1__)return;
  window.__READER_BOX_ALIGNMENT_PATCH_V1__=true;

  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw:raw.padStart(3,"0"));
  const imageWrap=document.getElementById("imageWrap");
  const pageImage=document.getElementById("pageImage");
  if(!imageWrap||!pageImage)return;

  const pageCache=new Map();
  let requestToken=0;
  let frame=0;

  function pageNumber(){
    const first=imageWrap.querySelector(".glyph-box[data-glyph-id]");
    const id=String(first?.dataset.glyphId||"");
    const byId=id.match(/_p(\d{4})_/i);
    if(byId)return Number(byId[1]);
    const text=String(document.getElementById("readerStatus")?.textContent||"");
    const byStatus=text.match(/当前第\s*(\d+)\s*页/);
    return byStatus?Number(byStatus[1]):NaN;
  }

  async function recordsFor(page){
    const key=`${workId}:${page}`;
    if(pageCache.has(key))return pageCache.get(key);
    const folder=workId;
    const path=`data/glyph_boxes/iiif/${folder}/page_${String(page).padStart(4,"0")}.json?v=20260718_box_align_v1`;
    try{
      const response=await fetch(path,{cache:"no-store"});
      if(!response.ok){pageCache.set(key,null);return null;}
      const rows=await response.json();
      const value=Array.isArray(rows)&&rows.length?rows:null;
      pageCache.set(key,value);
      return value;
    }catch(_){pageCache.set(key,null);return null;}
  }

  async function sync(){
    const token=++requestToken;
    const page=pageNumber();
    const boxes=Array.from(imageWrap.querySelectorAll(".glyph-box[data-glyph-id]"));
    if(!Number.isFinite(page)||!boxes.length||!pageImage.clientWidth||!pageImage.clientHeight)return;
    const rows=await recordsFor(page);
    if(token!==requestToken||!rows?.length)return;

    const first=rows[0]||{};
    const canvasWidth=Number(first.canvas_width||pageImage.naturalWidth||1);
    const canvasHeight=Number(first.canvas_height||pageImage.naturalHeight||1);
    if(!(canvasWidth>0&&canvasHeight>0))return;

    const scaleX=pageImage.clientWidth/canvasWidth;
    const scaleY=pageImage.clientHeight/canvasHeight;
    const byId=new Map(rows.map(row=>[String(row.glyph_id||""),row]));

    boxes.forEach(box=>{
      const row=byId.get(String(box.dataset.glyphId||""));
      if(!row)return;
      const x=Number(row.bbox_x??row.x??row.bbox?.[0]);
      const y=Number(row.bbox_y??row.y??row.bbox?.[1]);
      const w=Number(row.bbox_w??row.w??row.bbox?.[2]);
      const h=Number(row.bbox_h??row.h??row.bbox?.[3]);
      if(![x,y,w,h].every(Number.isFinite))return;
      box.style.left=`${x*scaleX}px`;
      box.style.top=`${y*scaleY}px`;
      box.style.width=`${w*scaleX}px`;
      box.style.height=`${h*scaleY}px`;
    });
    imageWrap.dataset.boxAlignmentReady=String(page);
  }

  function schedule(){
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{sync();});
  }

  new MutationObserver(schedule).observe(imageWrap,{childList:true,subtree:false});
  if("ResizeObserver" in window)new ResizeObserver(schedule).observe(pageImage);
  pageImage.addEventListener("load",schedule);
  document.getElementById("pageSelect")?.addEventListener("change",()=>setTimeout(schedule,40));
  document.getElementById("bottomPrevBtn")?.addEventListener("click",()=>setTimeout(schedule,80));
  document.getElementById("bottomNextBtn")?.addEventListener("click",()=>setTimeout(schedule,80));
  window.addEventListener("resize",schedule,{passive:true});
  schedule();
})();