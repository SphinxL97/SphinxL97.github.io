/* 029《鲜于光祖墓志》真实模型坐标适配：运行时只筛选029，不生成或借用相邻字框。 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="029"||window.__WORK_029_COORDINATE_ADAPTER__)return;
  const VERSION="20260725_xianyu_v1";
  const MODEL_URL=`data/model_boxes/glyph_model_border_026_030.json?v=${VERSION}`;
  const originalLoader=typeof window.loadPageGlyphBoxes==="function"?window.loadPageGlyphBoxes:null;
  const pages=new Map();
  let rows=[];
  const variant={"於":"于","國":"国","與":"与","為":"为","後":"后","門":"门","書":"书","誌":"志","鮮":"鲜","陽":"阳","趙":"赵","頫":"俯","並":"并","聞":"闻","風":"风","義":"义","舉":"举","縱":"纵","盡":"尽","轉":"转","遷":"迁","圍":"围","勳":"勋","喪":"丧","臺":"台","許":"许","樞":"枢","數":"数","復":"复","從":"从","長":"长","萬":"万","無":"无","見":"见","時":"时","來":"来","終":"终","實":"实","讀":"读","禮":"礼","開":"开","縣":"县","餘":"余","謂":"谓","貧":"贫","遠":"远","隂":"阴","屬":"属","彊":"强","淂":"得","莭":"节"};
  const punct=/[\s，。；：、“”‘’！？、（）《》【】—…·,.!?;:'"()<>\[\]{}]/g;
  function norm(value){return Array.from(String(value||"")).map(ch=>variant[ch]||ch).join("").replace(punct,"");}
  function lcsRatio(a,b){a=String(a||"");b=String(b||"");if(!a&&!b)return 1;if(!a||!b)return 0;const prev=new Array(b.length+1).fill(0),cur=new Array(b.length+1).fill(0);for(let i=1;i<=a.length;i++){cur.fill(0);for(let j=1;j<=b.length;j++)cur[j]=a[i-1]===b[j-1]?prev[j-1]+1:Math.max(prev[j],cur[j-1]);for(let j=0;j<=b.length;j++)prev[j]=cur[j];}return 2*prev[b.length]/(a.length+b.length);}
  function rect(row){return{x:Number(row.x??row.bbox_x??row.bbox?.[0]??0),y:Number(row.y??row.bbox_y??row.bbox?.[1]??0),w:Number(row.w??row.bbox_w??row.bbox?.[2]??0),h:Number(row.h??row.bbox_h??row.bbox?.[3]??0)};}
  function normalizeRow(row,index){const box=rect(row),page=Number(row.canvas_index||row.page||0);if(!page||box.w<=0||box.h<=0)return null;const text=String(row.char||row.text||"").slice(0,1);return{...row,work_id:"029",canvas_index:page,glyph_id:String(row.glyph_id||`029_${page}_${index+1}`),char:text,text,order_in_page:Number(row.order_in_page||row.annotation_index||index+1),bbox_x:box.x,bbox_y:box.y,bbox_w:box.w,bbox_h:box.h,bbox:[box.x,box.y,box.w,box.h]};}
  const ready=(async()=>{
    const response=await fetch(MODEL_URL,{cache:"force-cache"});
    if(!response.ok)throw new Error(`${MODEL_URL} ${response.status}`);
    const all=await response.json();
    rows=(Array.isArray(all)?all:[]).filter(row=>String(row.work_id)==="029").map(normalizeRow).filter(Boolean).sort((a,b)=>a.canvas_index-b.canvas_index||a.order_in_page-b.order_in_page);
    rows.forEach(row=>{if(!pages.has(row.canvas_index))pages.set(row.canvas_index,[]);pages.get(row.canvas_index).push(row);});
    if(!rows.length)throw new Error("029模型坐标为空");
    window.dispatchEvent(new CustomEvent("work-029-coordinate-model-ready",{detail:{rows:rows.length,pages:pages.size}}));
    return rows;
  })().catch(error=>{console.error("[work-029-coordinate-adapter]",error);return[];});
  async function loadPageRows(page){await ready;return (pages.get(Number(page||0))||[]).map(row=>({...row}));}
  async function locateCases(items){await ready;const modelChars=rows.map(row=>norm(row.char)||" ");const squareIndices=rows.map((row,index)=>row.char==="□"?index:-1).filter(index=>index>=0),used=new Set();return (Array.isArray(items)?items:[]).map(item=>{if(item.locations?.length)return item;const original=String(item.original||item.o||""),at=original.indexOf("□");if(at<0)return item;const before=norm(original.slice(0,at)).slice(-14),after=norm(original.slice(at+1)).slice(0,14);let best=null;squareIndices.forEach(index=>{if(used.has(index))return;const mb=modelChars.slice(Math.max(0,index-14),index).join("").slice(-14),ma=modelChars.slice(index+1,index+15).join("").slice(0,14),score=(lcsRatio(before,mb)+lcsRatio(after,ma))/2;if(!best||score>best.score)best={index,score};});if(!best||best.score<0.45){item.analysis=[...(item.analysis||[]),`坐标核验：局部前后文最高相似度${best?best.score.toFixed(3):"0.000"}，未达到0.45，故不写入bbox。`];return item;}used.add(best.index);const row=rows[best.index],box=rect(row),page=row.canvas_index;item.locations=[{page,glyph_id:row.glyph_id,bbox:box,canvas:{w:Number(row.canvas_width||0),h:Number(row.canvas_height||0)},image:`assets/page_images/029_鲜于光祖墓志/images/${String(page).padStart(4,"0")}_${["零","一","二","三","四","五","六","七","八","九","十","十一","十二","十三","十四","十五","十六","十七","十八","十九","二十","二十一","二十二","二十三","二十四","二十五","二十六","二十七","二十八","二十九","三十","三十一","三十二","三十三"][page]}.jpg`,match:"local-context-verified-model-square",score:Number(best.score.toFixed(4))}];item.page=page;item.analysis=[...(item.analysis||[]),`坐标核验：第${page}页真实模型方框，局部前后文相似度${best.score.toFixed(3)}。`];return item;});}
  window.loadPageGlyphBoxes=async function(id,pageObj){const normalized=String(id||"").match(/^(\d{3})/)?.[1]||String(id||"").padStart(3,"0");if(normalized!=="029")return originalLoader?originalLoader(id,pageObj):[];const page=Number(pageObj?.canvas_index||pageObj?.page||0),pageRows=(await loadPageRows(page)).map(row=>({...row,local_image:pageObj?.image||row.local_image||""}));return pageRows.length?pageRows:(originalLoader?originalLoader(id,pageObj):[]);};
  window.WORK_029_COORDINATES={ready,loadPageRows,locateCases,getStats:async()=>{await ready;return{rows:rows.length,pages:pages.size,squares:rows.filter(row=>row.char==="□").length};}};
  window.__WORK_029_COORDINATE_ADAPTER__=true;
  window.dispatchEvent(new CustomEvent("work-029-coordinate-adapter-ready"));
})();
