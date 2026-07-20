/* 006《史晨后碑》栏目一逐字坐标适配。第11页仅保留原图，不展示释文或字框。 */
(function(){"use strict";
const raw=String(new URLSearchParams(location.search).get("id")||"001");
const id=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
if(id!=="006"||window.__WORK_006_COORDINATE_ADAPTER__)return;
window.__WORK_006_COORDINATE_ADAPTER__=true;
const URL="data/model_boxes/glyph_model_border_006_010.json?v=20260720_work006_v2",SKIP=11;
const nativeFetch=window.fetch.bind(window),oldLoad=typeof window.loadPageGlyphBoxes==="function"?window.loadPageGlyphBoxes:null;
const urlOf=x=>typeof x==="string"?x:(x&&x.url)||"";
const pageOf=x=>Number(x?.canvas_index||x?.page||0);
let promise=null;
window.fetch=async function(input,init){const response=await nativeFetch(input,init);if(!/data\/model_boxes\/glyph_model_border_006_010\.json$/i.test(urlOf(input).split("?")[0]))return response;try{const rows=await response.clone().json();if(!Array.isArray(rows))return response;const kept=rows.filter(row=>!(String(row?.work_id||"").padStart(3,"0")==="006"&&pageOf(row)===SKIP));return new Response(JSON.stringify(kept),{status:response.status,statusText:response.statusText,headers:{"Content-Type":"application/json; charset=utf-8"}});}catch(error){console.warn("[work-006-coordinate-adapter]",error);return response;}};
function rows(){if(!promise)promise=fetch(URL,{cache:"force-cache"}).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.json();}).then(all=>{const groups=new Map();(Array.isArray(all)?all:[]).filter(row=>String(row.work_id||"").padStart(3,"0")==="006"&&pageOf(row)!==SKIP).forEach((row,index)=>{const page=pageOf(row);if(!page)return;if(!groups.has(page))groups.set(page,[]);const char=String(row.char||row.text||"").slice(0,1);groups.get(page).push({...row,work_id:"006",canvas_index:page,glyph_id:String(row.glyph_id||`006_${page}_${index+1}`),char,text:char,order_in_page:Number(row.order_in_page||index+1),bbox_x:Number(row.x??row.bbox_x??0),bbox_y:Number(row.y??row.bbox_y??0),bbox_w:Number(row.w??row.bbox_w??0),bbox_h:Number(row.h??row.bbox_h??0)});});groups.forEach(list=>list.sort((a,b)=>a.order_in_page-b.order_in_page));return groups;}).catch(error=>{console.error("[work-006-coordinate-adapter]",error);return new Map();});return promise;}
window.loadPageGlyphBoxes=async function(work,pageObj){const workId=String(work||"").split("-")[0].padStart(3,"0");if(workId!=="006")return oldLoad?oldLoad(work,pageObj):[];const page=pageOf(pageObj);if(page===SKIP)return[];const groups=await rows(),found=(groups.get(page)||[]).map(row=>({...row,local_image:pageObj?.image||""}));return found.length?found:(oldLoad?oldLoad(work,pageObj):[]);};
function page(){const select=document.getElementById("pageSelect"),label=String(select?.selectedOptions?.[0]?.textContent||"");const m=label.match(/^\s*(\d+)/);return m?Number(m[1]):Number(select?.value||-1)+1;}
const oldBoxes=window.renderImageBoxes;if(typeof oldBoxes==="function")window.renderImageBoxes=function(){if(page()===SKIP){document.querySelectorAll("#imageWrap .glyph-box").forEach(n=>n.remove());return;}return oldBoxes.apply(this,arguments);};
const oldGrid=window.renderTranscriptGrid;if(typeof oldGrid==="function")window.renderTranscriptGrid=function(){if(page()===SKIP){document.getElementById("transcriptGrid")?.replaceChildren();return;}return oldGrid.apply(this,arguments);};
})();