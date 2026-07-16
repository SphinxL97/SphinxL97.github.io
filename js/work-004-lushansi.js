/* 作品004《麓山寺碑并阴》栏目二、三专属内容。 */
(function(){
"use strict";
const raw=String(new URLSearchParams(location.search).get("id")||"001");
const id=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
if(id!=="004"||window.__WORK_004_LUSHANSI_CONTENT__)return;
window.__WORK_004_LUSHANSI_CONTENT__=true;
const TITLE="麓山寺碑并阴";
const TEXT_URL="data/lushansi_full_text.txt?v=20260716_lushansi_v2";
const CASE_URL="data/lushansi_damage_cases.json?v=20260716_lushansi_v1";
const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
const INTRO="碑刻文字在长期保存、传拓与数字化整理过程中，常因石面风化、剥蚀、漫漶、拓印差异及古文字字形复杂等因素出现残损或识读偏差。本栏目以完整句子为单位，按照原文中的出现顺序展示疑难文字。同一句中不论有一组还是多组“□”，均合并为一个案例。每一处均提供AI暂拟候选；其中题名、人名与官职残损多缺乏唯一依据，低置信度候选使用〔〕标明，仅供讨论，不作为确定释文。";

/* 第03—16处必须给出可供讨论的AI猜想。
 * 〔〕内均为低置信度暂拟字，不直接替换栏目二的原始缺字符号。
 */
const OVERRIDES={
  "03":{
    nav:"AI暂拟",t:"AI暂拟补释——第03处",
    c:"军刘制器，军参军尔朱浚，录事王敬〔之道〕，李博士张长卿，博士王元礼，〔监〕市令程〔元道〕。",
    r:"军刘制器，军参军尔朱浚，录事王敬〔之道〕，李博士张长卿，博士王元礼，〔监〕市令程〔元道〕。",
    e:["本句缺损集中在人名和官职位置，无法仅凭上下文唯一确定。","“监市令”属于可能的官职结构，因此将“□市令”暂拟为“监市令”。","“之道”“元道”仅按唐代常见人名用字提出候选，未获得字形或著录支持。","所有〔〕内文字均为低置信度猜想，后续需逐字核对拓片。"],confidence:"低"
  },
  "04":{
    nav:"AI暂拟",t:"AI暂拟补释——第04处",
    c:"赞曰：〔文武兼资崇〕礼乐，仕门贤才，君子同〔归道〕。",
    r:"赞曰：〔文武兼资崇〕礼乐，仕门贤才，君子同〔归道〕。",
    e:["本句为赞辞，前后内容均在称颂人物才德。","“文武兼资”可与“仕门贤才”相应，“崇礼乐”也符合赞辞语境。","句末暂拟“同归道”，用于承接君子共同归向正道之意。","该补法主要依据文意与对偶结构，缺乏可靠字形证据。"],confidence:"低"
  },
  "05":{
    nav:"AI暂拟",t:"AI暂拟补释——第05处",
    c:"参军〔张元礼〕，曹〔参〕军功曹员外同正〔录〕功军，仓曹员外同正李曹参军〔王士亨〕，军士曹参军〔李元〕亨，参军赵挹。",
    r:"参军〔张元礼〕，曹〔参〕军功曹员外同正〔录〕功军，仓曹员外同正李曹参军〔王士亨〕，军士曹参军〔李元〕亨，参军赵挹。",
    e:["该句是官员题名，多个缺损分别落在人名和官职内部。","“参军”“功曹”“员外同正”等结构可帮助判断词类，但不能确定具体姓名。","“张元礼”“王士亨”“李元亨”等仅按同段常见姓名形式暂拟。","整句候选置信度很低，应优先以原拓和旧录校核。"],confidence:"低"
  },
  "07":{
    nav:"AI暂拟",t:"AI暂拟补释——第07处",
    c:"康椘元同正成麟，尉上柱国〔王〕怀靖，卢元尉员外同正，皇甫尉员外同正，刘思义，前主簿五思〔文〕。",
    r:"康椘元同正成麟，尉上柱国〔王〕怀靖，卢元尉员外同正，皇甫尉员外同正，刘思义，前主簿五思〔文〕。",
    e:["两处缺字均位于人名中。","“王怀靖”与“五思文”在音节和姓名结构上可成立，因此作为暂拟候选。","现有上下文无法排除其他姓氏或名字用字。","〔王〕与〔文〕均须结合第95、96页拓片核验。"],confidence:"低"
  },
  "08":{
    nav:"AI暂拟",t:"AI暂拟补释——第08处",
    c:"醴陵令李仁瓒，〔丞〕张〔玄〕道〔正〕，主簿张思已，李灵尉张光庭〔县〕尉。",
    r:"醴陵令李仁瓒，〔丞〕张〔玄〕道〔正〕，主簿张思已，李灵尉张光庭〔县〕尉。",
    e:["本句依次列举县令、属官和尉职，缺字应主要属于官衔或姓名。","句首暂拟“丞”，以形成县令之后接县丞的官员排列。","“张玄道”按唐代常见人名结构暂拟，“正”可能属于后续衔名。","“县尉”是常见官职，但该处具体语序仍需拓片核对。"],confidence:"低"
  },
  "09":{
    nav:"AI暂拟",t:"AI暂拟补释——第09处",
    c:"衡令刘威之，刘员外〔同正〕，刘之尉，员员外尉王光大，尉周待徵。",
    r:"衡令刘威之，刘员外〔同正〕，刘之尉，员员外尉王光大，尉周待徵。",
    e:["同段题名多次出现“员外同正”这一官衔结构。","“刘员外□□”补作“刘员外同正”与前后官职排列相符。","该判断主要依据同碑内部用语，而非单纯凭空补名。","仍需检查缺损处是否确为“同正”二字。"],confidence:"中"
  },
  "10":{
    nav:"AI暂拟",t:"AI暂拟补释——第10处",
    c:"湘乡令王武信，主簿〔张承庆员外〕，尉〔李元礼正〕。",
    r:"湘乡令王武信，主簿〔张承庆员外〕，尉〔李元礼正〕。",
    e:["本句为湘乡县官员题名，缺损均位于主簿和县尉姓名、衔名处。","“张承庆”“李元礼”仅按唐代常见姓名形式提出。","“员外”“正”用于尝试解释缺字数量，未能由现有上下文独立验证。","本案属于开放式低置信度候选，主要供栏目四继续讨论。"],confidence:"低"
  },
  "11":{
    nav:"AI暂拟",t:"AI暂拟补释——第11处",
    c:"益阳令孟〔昭〕，主簿张〔元礼〕。",
    r:"益阳令孟〔昭〕，主簿张〔元礼〕。",
    e:["两处缺损均在人名位置，句法结构本身比较明确。","“孟昭”与“张元礼”均符合唐代双字或三字姓名的常见形式。","候选只解决姓名结构，不代表已经从拓片辨认出相应笔画。","需要结合第100页拓片和地方官员资料复核。"],confidence:"低"
  },
  "12":{
    nav:"AI暂拟",t:"AI暂拟补释——第12处",
    c:"赞曰：华宗旧德，利器良播；〔仁风〕政震，雷和〔雨〕。有典有则，惟始惟终。",
    r:"赞曰：华宗旧德，利器良播；〔仁风〕政震，雷和〔雨〕。有典有则，惟始惟终。",
    e:["该段为赞辞，语义集中在德政与教化。","“仁风”可与“政震”组成德政远播之意。","“雷和雨”借雷雨比喻政令与恩泽，和上下文较为协调。","候选依据语义和对偶关系提出，字形仍需核实。"],confidence:"中"
  },
  "13":{
    nav:"AI暂拟",t:"AI暂拟补释——第13处",
    c:"大夫〔武〕城宰张守日〔新〕，安主簿盛老〔成〕，邓洪敏〔王〕思〔玄德〕，梁元〔礼之〕，祝仁期〔之〕，张文远、石泰、张恽〔之〕，朱封禅〔员外同正〕，桓嗣宗、杨庭训、罗元〔礼之〕，邓希、王晁〔之〕，王暠〔任〕西同〔正〕，庶苑道林，景德晚〔成〕。",
    r:"大夫〔武〕城宰张守日〔新〕，安主簿盛老〔成〕，邓洪敏〔王〕思〔玄德〕，梁元〔礼之〕，祝仁期〔之〕，张文远、石泰、张恽〔之〕，朱封禅〔员外同正〕，桓嗣宗、杨庭训、罗元〔礼之〕，邓希、王晁〔之〕，王暠〔任〕西同〔正〕，庶苑道林，景德晚〔成〕。",
    e:["该句包含大量题名，缺损跨越人名、地名和官衔，无法形成唯一恢复。","“武城宰”与第16处相同结构相互参照，因此暂拟“武”。","“员外同正”是同段反复出现的官衔，可作为“朱封禅□□□□”的结构候选。","其余姓名用字均为低置信度试拟，目的在于提供可讨论文本，而非宣布定论。"],confidence:"低"
  },
  "14":{
    nav:"AI暂拟",t:"AI暂拟补释——第14处",
    c:"政〔在〕癸也，岁四月十〔五〕日〔甲子朔日建〕。",
    r:"政〔在〕癸也，岁四月十〔五〕日〔甲子朔日建〕。",
    e:["本句属于纪年纪日文字，缺字应服务于时间表达。","“四月十五日”是完整日期结构，因此单字暂拟为“五”。","句末五字暂拟“甲子朔日建”，用以形成干支、朔日和建刻信息。","“政在癸也”的“在”仅为语义试补，整句仍需旧拓或著录确认。"],confidence:"低至中"
  },
  "15":{
    nav:"AI暂拟",t:"AI暂拟补释——第15处",
    c:"梁国虞王〔亲临〕阅〔碑文〕。",
    r:"梁国虞王〔亲临〕阅〔碑文〕。",
    e:["“梁国虞王”之后应接动作或身份说明，“阅”后应有宾语。","暂拟“亲临阅碑文”，可形成语义完整的题记。","该候选主要依靠句法补全，不能据此确认原字。","建议在栏目四中保留其他读者提出不同候选的空间。"],confidence:"低"
  },
  "16":{
    nav:"AI暂拟",t:"AI暂拟补释——第16处",
    c:"通义程暭，明迪稽山石彦和子，惠朝请大夫〔武〕城宰张守昚。",
    r:"通义程暭，明迪稽山石彦和子，惠朝请大夫〔武〕城宰张守昚。",
    e:["缺字位于“□城宰”这一官职或地名结构中。","第13处同样出现“大夫□城宰”，两处可相互参照。","暂拟“武城宰”，将“武城”理解为地名，“宰”为县令。","该候选具有一定结构依据，但仍需拓片与官员资料核实。"],confidence:"中"
  }
};

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
  try{
    const r=await fetch(CASE_URL,{cache:"no-store"});if(!r.ok)throw Error(r.status);
    CASES=(await r.json()).map(item=>{
      const override=OVERRIDES[item.i];
      return override?{...item,...override,e:[...override.e]}:item;
    });
    window.DAMAGE_AI_CASES=CASES.map(x=>({...x,canvas:{...x.canvas},targets:x.targets.map(t=>({...t})),e:[...x.e]}));
    render();
    window.__WORK_004_CONTENT_READY__=true;
    window.dispatchEvent(new CustomEvent("work-004-content-ready"));
  }catch(e){console.error("[work-004] cases",e);}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();