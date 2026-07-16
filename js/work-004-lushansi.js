/* 作品004《麓山寺碑并阴》栏目二、三专属内容。 */
(function(){
"use strict";
const raw=String(new URLSearchParams(location.search).get("id")||"001");
const id=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
if(id!=="004"||window.__WORK_004_LUSHANSI_CONTENT__)return;
window.__WORK_004_LUSHANSI_CONTENT__=true;
const TITLE="麓山寺碑并阴";
const TEXT_URL="data/lushansi_full_text.txt?v=20260716_lushansi_v1";
const CASE_URL="data/lushansi_damage_cases.json?v=20260716_lushansi_v1";
const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
const INTRO="碑刻文字在长期保存、传拓与数字化整理过程中，常因石面风化、剥蚀、漫漶、拓印差异及古文字字形复杂等因素出现残损或识读偏差。本栏目以完整句子为单位，按照原文中的出现顺序展示疑难文字。同一句中不论有一组还是多组“□”，均合并为一个案例。对于缺乏可靠证据的题名、人名与官职残字，AI不强行补写，而明确显示“暂未恢复”。相关结论仅供辅助参考，仍需结合原拓、旧拓、著录及相关研究进一步核验。";
let CASES=[],current=0,expanded=false,listScrollTop=0;
const esc=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const title=(n,t)=>{const a=document.querySelector(`.side a:nth-of-type(${n})`);if(a)a.textContent=t;};
const paras=t=>String(t||"").replace(/\r\n?/g,"\n").split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean).map(s=>`<p>${esc(s)}</p>`).join("");
function crop(item){
  const px=150,py=250,left=Math.min(...item.targets.map(t=>t.x)),top=Math.min(...item.targets.map(t=>t.y));
  const right=Math.max(...item.targets.map(t=>t.x+t.w)),bottom=Math.max(...item.targets.map(t=>t.y+t.h));
  const x=Math.max(0,left-px),y=Math.max(0,top-py);
  return{x,y,w:Math.min(item.canvas.w-x,Math.max(420,right-left+px*2)),h:Math.min(item.canvas.h-y,Math.max(900,bottom-top+py*2))};
}
async function transcript(){
  const s=document.getElementById("calligraphy");if(!s)return;
  title(2,"二、碑文释文");s.classList.add("full-transcript-section");
  s.innerHTML=`<h2 class="section-title">二、碑文释文</h2><p class="full-transcript-note">${NOTE}</p><div class="full-transcript-card"><div class="full-transcript-loading">正在读取碑文释文……</div></div>`;
  const card=s.querySelector(".full-transcript-card");
  try{
    const r=await fetch(TEXT_URL,{cache:"no-store"});if(!r.ok)throw Error(r.status);
    card.innerHTML=`<header class="full-transcript-header"><h3>${TITLE}</h3><span class="full-transcript-ornament" aria-hidden="true"></span></header><div class="full-transcript-body">${paras(await r.text())}</div>`;
  }catch(e){console.warn("[work-004] transcript",e);card.innerHTML='<div class="full-transcript-error">碑文释文暂时无法读取，请刷新页面后重试。</div>';}
}
const tabs=()=>CASES.map((x,i)=>`<button class="damage-tab${i===current?" active":""}" data-case-index="${i}" type="button"><b>${x.i}</b><span class="name">${esc(x.nav||x.n)}</span></button>`).join("");
function image(item){
  const c=crop(item),rects=item.targets.map(t=>`<rect class="damage-box" x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}"></rect>`).join("");
  return`<div class="damage-viewport" data-image="${esc(item.image)}" title="双击查看原始拓片"><svg class="damage-crop-svg" viewBox="${c.x} ${c.y} ${c.w} ${c.h}" preserveAspectRatio="xMidYMid meet"><image href="${esc(item.image)}" x="0" y="0" width="${item.canvas.w}" height="${item.canvas.h}" preserveAspectRatio="none"></image>${rects}</svg></div>`;
}
function panel(item){
  const ev=item.e.map(x=>`<li>${esc(x)}</li>`).join("");
  return`<div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${CASES.length}</span><div class="damage-heading">${esc(item.t)}</div><div class="damage-pager"><button data-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${CASES.length}</span><button data-action="next" type="button" ${current===CASES.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list">${tabs()}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${image(item)}<p class="damage-caption">《${TITLE}》第${item.page}页，本句缺字局部</p></section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别（OCR结果）</span><div class="damage-text">${esc(item.o)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">修正结果（AI识别）</span><div class="damage-text damage-new">${esc(item.c)}</div></div><div class="damage-block"><span class="damage-label">恢复后的上下文</span><div class="damage-restored">${esc(item.r)}</div></div><div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><div class="damage-evidence${expanded?" open":""}"><ol>${ev}</ol><p><strong>本句缺字：</strong>${item.groupCount}组，共${item.boxCount}个“□”</p><p><strong>建议置信度：</strong>${esc(item.confidence)}</p></div><button class="damage-expand" data-action="expand" type="button">${expanded?"收起内容⌃":"展开更多⌄"}</button></div></div></section></div></div>`;
}
function remember(s){const l=s?.querySelector(".damage-list");if(l)listScrollTop=l.scrollTop;}
function restore(s){
  const l=s.querySelector(".damage-list");if(!l)return;l.scrollTop=listScrollTop;
  l.addEventListener("scroll",()=>listScrollTop=l.scrollTop,{passive:true});
  requestAnimationFrame(()=>{const a=l.querySelector(".damage-tab.active");if(!a)return;const t=a.offsetTop,b=t+a.offsetHeight,vt=l.scrollTop,vb=vt+l.clientHeight;if(t<vt)l.scrollTop=t;else if(b>vb)l.scrollTop=b-l.clientHeight;listScrollTop=l.scrollTop;});
}
function bind(s){
  s.querySelectorAll("[data-case-index]").forEach(b=>b.onclick=()=>{remember(s);current=Number(b.dataset.caseIndex)||0;expanded=false;render();});
  s.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>{remember(s);const a=b.dataset.action;if(a==="prev"&&current>0)current--;if(a==="next"&&current<CASES.length-1)current++;if(a==="expand")expanded=!expanded;else expanded=false;render();});
  const v=s.querySelector(".damage-viewport");if(v)v.ondblclick=()=>{if(typeof window.openZoom==="function")window.openZoom(v.dataset.image);};
}
function render(){
  const s=document.getElementById("people");if(!s||!CASES.length)return;
  title(3,"三、碑文残损与AI释读");s.classList.add("damage-ai");
  s.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell">${panel(CASES[current])}</div>`;
  bind(s);restore(s);
}
async function init(){
  transcript();
  try{const r=await fetch(CASE_URL,{cache:"no-store"});if(!r.ok)throw Error(r.status);CASES=await r.json();window.DAMAGE_AI_CASES=CASES.map(x=>({...x,canvas:{...x.canvas},targets:x.targets.map(t=>({...t})),e:[...x.e]}));render();window.__WORK_004_CONTENT_READY__=true;window.dispatchEvent(new CustomEvent("work-004-content-ready"));}catch(e){console.error("[work-004] cases",e);}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();