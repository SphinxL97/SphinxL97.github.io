/* 《礼器碑并阴》作品全文浏览修正。
 * 仅在 detail.html?id=002 时启用：
 * 1. 直接读取作品002已上传的逐页 IIIF 单字坐标；
 * 2. 按“从上到下、从右到左”重新计算列、行与连续释文顺序；
 * 3. 根据相邻字中心缩小重叠字框，使选中字与拓片位置准确对应。
 * 不修改其他碑帖、页面样式或栏目功能。
 */
(function(){
  "use strict";

  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
  if(parentId!=="002") return;
  if(window.__LIQI_READER_SPATIAL_FIX__) return;
  window.__LIQI_READER_SPATIAL_FIX__=true;

  const VERSION="20260716_liqi_reader_v1";
  const nativeFetch=window.fetch.bind(window);
  const pageCache=new Map();

  const finite=(value,fallback=0)=>{
    const n=Number(value);
    return Number.isFinite(n)?n:fallback;
  };

  const median=values=>{
    const list=values.filter(Number.isFinite).sort((a,b)=>a-b);
    if(!list.length) return 0;
    const middle=Math.floor(list.length/2);
    return list.length%2?list[middle]:(list[middle-1]+list[middle])/2;
  };

  function rawRows(boxes,pageObj,pageNo){
    return (Array.isArray(boxes)?boxes:[]).map((box,index)=>{
      const bbox=Array.isArray(box.bbox)?box.bbox:[];
      const x=finite(box.x,finite(box.bbox_x,finite(bbox[0])));
      const y=finite(box.y,finite(box.bbox_y,finite(bbox[1])));
      const w=Math.max(1,finite(box.w,finite(box.bbox_w,finite(bbox[2],1))));
      const h=Math.max(1,finite(box.h,finite(box.bbox_h,finite(bbox[3],1))));
      const canvasWidth=finite(box.canvas_width,finite(pageObj?.canvas_width,1473));
      const canvasHeight=finite(box.canvas_height,finite(pageObj?.canvas_height,2257));
      return {
        ...box,
        virtual_id:"002",
        work_id:"002",
        canvas_index:pageNo,
        page:pageNo,
        canvas_label:box.canvas_label||pageObj?.canvas_label||pageObj?.label||String(pageNo),
        local_image:pageObj?.image||box.local_image||"",
        glyph_id:String(box.glyph_id||`002_p${String(pageNo).padStart(4,"0")}_c${String(index+1).padStart(3,"0")}`),
        char:String(box.char||box.text||"□").slice(0,1)||"□",
        text:String(box.char||box.text||"□").slice(0,1)||"□",
        canvas_width:canvasWidth,
        canvas_height:canvasHeight,
        original_x:x,
        original_y:y,
        original_w:w,
        original_h:h,
        center_x:x+w/2,
        center_y:y+h/2,
        x,y,w,h
      };
    });
  }

  function groupColumns(rows){
    if(!rows.length) return [];
    const typicalWidth=Math.max(24,median(rows.map(row=>row.original_w)));
    const tolerance=Math.max(34,typicalWidth*.48);
    const columns=[];

    [...rows].sort((a,b)=>b.center_x-a.center_x||a.center_y-b.center_y).forEach(row=>{
      let best=null;
      let distance=Infinity;
      columns.forEach(column=>{
        const d=Math.abs(row.center_x-column.center);
        if(d<=tolerance&&d<distance){best=column;distance=d;}
      });
      if(!best){
        best={center:row.center_x,rows:[]};
        columns.push(best);
      }
      best.rows.push(row);
      best.center=best.rows.reduce((sum,item)=>sum+item.center_x,0)/best.rows.length;
    });

    return columns.sort((a,b)=>b.center-a.center);
  }

  function normalizeSpatial(boxes,pageObj,pageNo){
    const rows=rawRows(boxes,pageObj,pageNo);
    const columns=groupColumns(rows);
    let order=1;

    columns.forEach((column,columnIndex)=>{
      column.rows.sort((a,b)=>a.center_y-b.center_y||a.center_x-b.center_x);
      const rightGap=columnIndex>0?columns[columnIndex-1].center-column.center:Infinity;
      const leftGap=columnIndex<columns.length-1?column.center-columns[columnIndex+1].center:Infinity;
      const nearestColumnGap=Math.min(rightGap,leftGap);

      column.rows.forEach((row,rowIndex)=>{
        const previous=column.rows[rowIndex-1];
        const next=column.rows[rowIndex+1];
        const previousGap=previous?row.center_y-previous.center_y:Infinity;
        const nextGap=next?next.center_y-row.center_y:Infinity;
        const nearestRowGap=Math.min(previousGap,nextGap);

        const widthLimit=Number.isFinite(nearestColumnGap)?nearestColumnGap*.72:row.original_w;
        const heightLimit=Number.isFinite(nearestRowGap)?nearestRowGap*.78:row.original_h;
        const width=Math.max(18,Math.min(row.original_w,widthLimit));
        const height=Math.max(18,Math.min(row.original_h,heightLimit));
        const x=Math.max(0,Math.min(row.canvas_width-width,row.center_x-width/2));
        const y=Math.max(0,Math.min(row.canvas_height-height,row.center_y-height/2));

        Object.assign(row,{
          x,y,w:width,h:height,
          bbox_x:x,bbox_y:y,bbox_w:width,bbox_h:height,
          auto_col:columnIndex,
          auto_row:rowIndex,
          order_in_page:order,
          source:"iiif_spatial_order_fixed"
        });
        order+=1;
      });
    });

    return columns.flatMap(column=>column.rows);
  }

  async function loadPageRows(pageObj){
    const pageNo=finite(pageObj?.canvas_index??pageObj?.page,0);
    if(!pageNo) return [];
    if(pageCache.has(pageNo)) return pageCache.get(pageNo);

    const promise=(async()=>{
      const path=`data/glyph_boxes/iiif/002/page_${String(pageNo).padStart(4,"0")}.json?v=${VERSION}`;
      const response=await nativeFetch(path,{cache:"no-store"});
      if(!response.ok) throw new Error(`${path} ${response.status}`);
      const boxes=await response.json();
      return normalizeSpatial(boxes,pageObj,pageNo);
    })().catch(error=>{
      console.warn("[liqi-reader-fix] 单字坐标读取失败",error);
      return [];
    });

    pageCache.set(pageNo,promise);
    return promise;
  }

  function install(){
    if(typeof window.loadPageGlyphBoxes!=="function"){
      setTimeout(install,40);
      return;
    }
    if(window.loadPageGlyphBoxes.__liqiSpatialFixed) return;

    const previous=window.loadPageGlyphBoxes;
    const wrapped=async function(id,pageObj){
      const rows=await loadPageRows(pageObj);
      if(rows.length) return rows;
      return previous.apply(this,arguments);
    };
    wrapped.__liqiSpatialFixed=true;
    window.loadPageGlyphBoxes=wrapped;

    const rerender=()=>{
      try{
        if(typeof window.loadPage==="function"&&typeof window.currentPageIndex==="number"){
          window.loadPage(window.currentPageIndex);
        }else if(typeof loadPage==="function"&&typeof currentPageIndex==="number"){
          loadPage(currentPageIndex);
        }
      }catch(error){
        console.warn("[liqi-reader-fix] 当前页重绘失败",error);
      }
    };
    [0,160,420].forEach(delay=>setTimeout(rerender,delay));
  }

  install();
})();
