/* 《礼器碑并阴》作品全文浏览修正。
 * 仅在 detail.html?id=002 时启用：
 * 1. 直接读取作品002已上传的逐页 IIIF 单字坐标；
 * 2. 按“从上到下、从右到左”重新计算列、行与连续释文顺序；
 * 3. 根据相邻字中心缩小重叠字框，使选中字与拓片位置准确对应；
 * 4. 修正第49页“内温朱”被误拆成四个字框的问题；
 * 5. 修正第49页“从事蕃”及第50页“加”的释文标注。
 * 不修改其他碑帖、页面样式或栏目功能。
 */
(function(){
  "use strict";

  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
  if(parentId!=="002") return;
  if(window.__LIQI_READER_SPATIAL_FIX__) return;
  window.__LIQI_READER_SPATIAL_FIX__=true;

  const VERSION="20260716_liqi_reader_v3";
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

  function rawBox(box){
    const bbox=Array.isArray(box?.bbox)?box.bbox:[];
    const x=finite(box?.x,finite(box?.bbox_x,finite(bbox[0])));
    const y=finite(box?.y,finite(box?.bbox_y,finite(bbox[1])));
    const w=Math.max(1,finite(box?.w,finite(box?.bbox_w,finite(bbox[2],1))));
    const h=Math.max(1,finite(box?.h,finite(box?.bbox_h,finite(bbox[3],1))));
    return {x,y,w,h,cx:x+w/2,cy:y+h/2};
  }

  /*
   * 第49页右侧题名应为：百故薛令河内温朱熊伯珍。
   * 原始注释把“内温朱”所在区域误拆为“广、约、□、水”四个高度重叠的框，
   * 因而释文多出一格，选中框也覆盖到相邻字。这里仅替换这四条异常注释，
   * 根据上方“河”和下方“熊”的中心位置均匀恢复三个独立字位。
   */
  function repairPage49NeiWenZhu(boxes,pageNo){
    if(pageNo!==49||!Array.isArray(boxes)) return boxes;

    const isProblem=box=>/_p0049_c0(?:19|20|21|22)$/.test(String(box?.glyph_id||""));
    const problem=boxes.filter(isProblem);
    if(problem.length!==4) return boxes;

    const river=boxes.find(box=>/_p0049_c018$/.test(String(box?.glyph_id||"")));
    const bear=boxes.find(box=>/_p0049_c023$/.test(String(box?.glyph_id||"")));
    if(!river||!bear) return boxes;

    const riverBox=rawBox(river);
    const bearBox=rawBox(bear);
    const sourceBoxes=problem.map(rawBox);
    const centerX=median(sourceBoxes.map(box=>box.cx))||riverBox.cx;
    const width=Math.max(120,Math.min(222,median(sourceBoxes.map(box=>box.w))||190));
    const height=Math.max(110,Math.min(170,median(sourceBoxes.map(box=>box.h))||150));
    const verticalStep=(bearBox.cy-riverBox.cy)/4;
    const template={...problem[0]};

    const repaired=["内","温","朱"].map((char,index)=>{
      const centerY=riverBox.cy+verticalStep*(index+1);
      const x=centerX-width/2;
      const y=centerY-height/2;
      return {
        ...template,
        glyph_id:`002_礼器碑并阴_p0049_fix_${index+1}`,
        char,
        text:char,
        annotation_index:19+index,
        order_in_page:19+index,
        bbox_x:x,
        bbox_y:y,
        bbox_w:width,
        bbox_h:height,
        x,y,w:width,h:height,
        source:"iiif_annotation_page49_neiwenzhu_fixed"
      };
    });

    return boxes.filter(box=>!isProblem(box)).concat(repaired);
  }

  /*
   * 已由拓片人工核定的两处释文：
   * 第49页左列 c011-c013 为“从事蕃”；第50页右列首字 c001 为“加”。
   * 此处只修正字符，不改变原始坐标。
   */
  function repairKnownCharacters(boxes,pageNo){
    if(!Array.isArray(boxes)) return boxes;
    const corrections=pageNo===49
      ?{
          "002_礼器碑并阴_p0049_c011":"从",
          "002_礼器碑并阴_p0049_c012":"事",
          "002_礼器碑并阴_p0049_c013":"蕃"
        }
      :pageNo===50
        ?{"002_礼器碑并阴_p0050_c001":"加"}
        :null;
    if(!corrections) return boxes;

    return boxes.map(box=>{
      const id=String(box?.glyph_id||"");
      const char=corrections[id];
      return char?{...box,char,text:char,source:"iiif_annotation_character_fixed"}:box;
    });
  }

  function rawRows(boxes,pageObj,pageNo){
    const repairedBoxes=repairKnownCharacters(repairPage49NeiWenZhu(boxes,pageNo),pageNo);
    return (Array.isArray(repairedBoxes)?repairedBoxes:[]).map((box,index)=>{
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
          source:String(row.source||"").includes("page49_neiwenzhu_fixed")
            ?"iiif_spatial_order_page49_neiwenzhu_fixed"
            :String(row.source||"").includes("character_fixed")
              ?"iiif_spatial_order_character_fixed"
              :"iiif_spatial_order_fixed"
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