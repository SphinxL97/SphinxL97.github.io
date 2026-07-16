/* 作品003《龙藏寺碑》专属内容。
 * 只在 detail.html?id=003 时覆盖第二、三栏目；
 * 沿用作品001、002现有HTML结构、CSS类名、交互和第四栏目联动方式。
 */
(function(){
  "use strict";

  const rawId=String(new URLSearchParams(location.search).get("id")||"001");
  const parentId=(rawId.includes("-")?rawId.split("-")[0]:rawId).padStart(3,"0");
  if(parentId!=="003"||window.__WORK_003_LONGZANGSI_CONTENT__) return;
  window.__WORK_003_LONGZANGSI_CONTENT__=true;

  const WORK_TITLE="龙藏寺碑";
  const TEXT_URL="data/longzangsi_full_text.txt?v=20260716_longzangsi_v1";
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const INTRO="碑刻文字在长期保存、传拓与数字化整理过程中，常因石面风化、剥蚀、漫漶、拓印差异及古文字字形复杂等因素出现残损或识读偏差。本栏目通过典型案例，结合拓片图像、OCR识别结果与AI辅助分析，展示疑难字辨识、形近字校正和残文推测的过程。相关结论仅供辅助参考，仍需结合原拓、录文及相关研究进一步核验。";

  const CASES=[
    {
      i:"01",n:"残损碑文恢复",s:"“法、主”二字推测",t:"残损碑文恢复——“说法之主”",
      o:"释迦文非说□之□，须菩提岂证果之人？",
      c:"释迦文非说法之主，须菩提岂证果之人？",
      r:"若论乾闼之城皆妄，巴蕉之树尽空，应化讵真，权假宁实？释迦文非说法之主，须菩提岂证果之人？然则习因之指安归？求道之趣奚向？",
      image:"assets/page_images/003_龙藏寺碑/images/0011_十一.jpg",page:11,canvas:{w:1539,h:2250},crop:{x:600,y:760,w:330,h:1220},target:{x:640,y:1510,w:210,h:430},
      e:["原文在“说”后和“之”后各缺一字，句式需要同时恢复。","“说法”是佛教文献中常见的固定搭配，可与前文“释迦文”相承。","“说法之主”与后句“证果之人”在结构上形成对应，语义较为完整。","该恢复仍需结合原拓中两处残存笔画及权威录文继续核验。"],confidence:"中高"
    },
    {
      i:"02",n:"残损碑文恢复",s:"“沙门”二字推测",t:"残损碑文恢复——“持律沙门”",
      o:"护戒比丘，翻同雹草；持律□□，忽等霜莲。",
      c:"护戒比丘，翻同雹草；持律沙门，忽等霜莲。",
      r:"李园之内，结其恶党；竹林之下，亡其善聚。护戒比丘，翻同雹草；持律沙门，忽等霜莲。慧殿仙宫，寂寥安在。",
      image:"assets/page_images/003_龙藏寺碑/images/0018_十八.jpg",page:18,canvas:{w:1539,h:2250},crop:{x:650,y:760,w:300,h:1050},target:{x:675,y:790,w:230,h:430},
      e:["“护戒比丘”与“持律□□”构成对偶，缺失处应为对僧侣身份的称谓。","“沙门”是佛教碑铭中常见的僧人称谓，与“比丘”相对成文。","补作“持律沙门”后，句法、词性和上下文均较连贯。","由于两字在拓片中残损明显，仍需借助其他拓本或旧录确认。"],confidence:"中"
    },
    {
      i:"03",n:"残损碑文恢复",s:"“赵”字推测",t:"残损碑文恢复——“途通赵而指卫”",
      o:"路款晋而适秦，途通□而指卫。",
      c:"路款晋而适秦，途通赵而指卫。",
      r:"青山敛雾，绿水扬波。路款晋而适秦，途通赵而指卫。□□之落，矩步非遥；平原之楼，规行讵远。",
      image:"assets/page_images/003_龙藏寺碑/images/0036_三十六.jpg",page:36,canvas:{w:1539,h:2250},crop:{x:650,y:760,w:300,h:1220},target:{x:730,y:1535,w:180,h:220},
      e:["上句以“晋—秦”并举，下句以另一组地域名称与“卫”相对。","“赵”与“卫”均为古国名，且与龙藏寺所在区域的地理叙述相合。","补作“赵”后形成“晋秦、赵卫”的整齐结构。","本处仍需以第36页拓片的残存字形为最终依据。"],confidence:"中"
    },
    {
      i:"04",n:"残损碑文恢复",s:"“邯郸”二字推测",t:"残损碑文恢复——“邯郸之落”",
      o:"□□之落，矩步非遥；平原之楼，规行讵远。",
      c:"邯郸之落，矩步非遥；平原之楼，规行讵远。",
      r:"路款晋而适秦，途通□而指卫。邯郸之落，矩步非遥；平原之楼，规行讵远。寻泒避世，彼亦河人。",
      image:"assets/page_images/003_龙藏寺碑/images/0036_三十六.jpg",page:36,canvas:{w:1539,h:2250},crop:{x:470,y:760,w:300,h:1220},target:{x:515,y:1160,w:210,h:440},
      e:["缺失的两字位于地名位置，并与后句“平原之楼”构成对应。","“邯郸”为赵地重要城邑，与前文“途通赵而指卫”的地域关系可以衔接。","补作“邯郸之落”后，前后两句均以地名领起。","“落”字的具体含义及两字字形仍需原拓和相关著录进一步确认。"],confidence:"低"
    },
    {
      i:"05",n:"历史人物识别",s:"“仙”字恢复",t:"历史人物识别——“金城王孝仙”",
      o:"恒州刺史、鄂国公、金城王孝?，世业重于金张。",
      c:"恒州刺史、鄂国公、金城王孝仙，世业重于金张。",
      r:"太师、上柱国、大威公之世子，使持节、左武卫将军、上开府仪同三司、恒州诸军事、恒州刺史、鄂国公、金城王孝仙，世业重于金张，器识逾于许郭。",
      image:"assets/page_images/003_龙藏寺碑/images/0039_三十九.jpg",page:39,canvas:{w:1539,h:2250},crop:{x:900,y:760,w:340,h:1220},target:{x:990,y:1535,w:200,h:230},
      e:["缺字位于“王孝□”这一明确的人名位置。","结合碑文所列官职、封爵和相关人物资料，可将该人名对读为“王孝仙”。","补作“仙”后，人名与后文叙述能够完整衔接。","网站仍保留原拓局部，便于读者继续核对残存笔画。"],confidence:"高"
    },
    {
      i:"06",n:"残损碑文恢复",s:"“蕃”字推测",t:"残损碑文恢复——“领袖诸蕃”",
      o:"领袖诸□，冠冕群俊。",
      c:"领袖诸蕃，冠冕群俊。",
      r:"军府号为飞将，朝廷称为虎臣。领袖诸蕃，冠冕群俊。探赜索隐，应变知机。",
      image:"assets/page_images/003_龙藏寺碑/images/0040_四十.jpg",page:40,canvas:{w:1539,h:2250},crop:{x:300,y:760,w:330,h:1220},target:{x:325,y:1155,w:230,h:240},
      e:["“领袖”后应接统摄或表率的对象，“诸□”需要补成名词。","“诸蕃”可指各地藩镇或属部，与恒州刺史的身份和地方治理语境相合。","“领袖诸蕃，冠冕群俊”在语义和对偶结构上较完整。","该字仍需结合第40页拓片核验。"],confidence:"中"
    },
    {
      i:"07",n:"残损碑文恢复",s:"“乃”字推测",t:"残损碑文恢复——“乃奉敕”",
      o:"瞻彼伽篮，事因草创。□奉敕劝奖州内士庶壹万人等，共广福田。",
      c:"瞻彼伽篮，事因草创。乃奉敕劝奖州内士庶壹万人等，共广福田。",
      r:"下车未几，善政斯归。瞻彼伽篮，事因草创。乃奉敕劝奖州内士庶壹万人等，共广福田。公爰启至诚，虔心徙石。",
      image:"assets/page_images/003_龙藏寺碑/images/0044_四十四.jpg",page:44,canvas:{w:1539,h:2250},crop:{x:150,y:760,w:300,h:1220},target:{x:160,y:790,w:230,h:300},
      e:["缺字位于新一句开头，承担承接前文、引出奉敕营建的作用。","“乃”常用于碑文叙事中的转折和承接，补入后句意顺畅。","“事因草创。乃奉敕……”能够清楚说明由草创转入奉敕劝建。","原拓中该字位于“奉”字之前，仍需核对残存笔画。"],confidence:"中低"
    },
    {
      i:"08",n:"残损碑文恢复",s:"“自”字推测",t:"残损碑文恢复——“自然饮食”",
      o:"不求床坐，来会之众何忧；□然饮食，持钵之侣奚念。",
      c:"不求床坐，来会之众何忧；自然饮食，持钵之侣奚念。",
      r:"夜漏将竭，听鸣钟于寺内；晓相既分，见承露于云表。不求床坐，来会之众何忧；自然饮食，持钵之侣奚念。",
      image:"assets/page_images/003_龙藏寺碑/images/0053_五十三.jpg",page:53,canvas:{w:1539,h:2250},crop:{x:1080,y:760,w:330,h:1220},target:{x:1150,y:805,w:230,h:250},
      e:["前半句说明来寺众人不必忧虑床坐，后半句应说明僧侣饮食亦无所忧。","补作“自然饮食”后，与“不求床坐”共同表现寺院设施和供养完备。","“自然”在句中作状语，语法通顺，并与后面的反问句相衔接。","该恢复仍需以第53页拓片字形为准。"],confidence:"中高"
    },
    {
      i:"09",n:"残损碑文恢复",s:"“书”字推测",t:"残损碑文恢复——“张公礼之书”",
      o:"齐开府长、兼行参军、九门张公礼之□。",
      c:"齐开府长、兼行参军、九门张公礼之书。",
      r:"开皇六年十二月五日题写。齐开府长、兼行参军、九门张公礼之书。",
      image:"assets/page_images/003_龙藏寺碑/images/0065_六十五.jpg",page:65,canvas:{w:1539,h:2250},crop:{x:760,y:760,w:500,h:900},target:{x:820,y:1160,w:220,h:260},
      e:["该句位于碑文末尾题署，前文已列张公礼的官职与籍贯。","碑刻题署中常用“某某之书”说明书写者，补作“书”符合文体习惯。","补字后可完整表达“九门张公礼书写此碑”的含义。","因末字残损，仍应结合末页拓片和旧录确认。"],confidence:"低至中"
    }
  ];

  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const paragraphHtml=text=>String(text||"").replace(/\r\n?/g,"\n").split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean).map(s=>`<p>${esc(s)}</p>`).join("");
  const setMenuTitle=(index,title)=>{const link=document.querySelector(`.side a:nth-of-type(${index})`);if(link)link.textContent=title;};

  async function renderTranscript(){
    const section=document.getElementById("calligraphy");
    if(!section) return;
    setMenuTitle(2,"二、碑文释文");
    section.classList.add("full-transcript-section");
    section.innerHTML=`<h2 class="section-title">二、碑文释文</h2><p class="full-transcript-note">${NOTE}</p><div class="full-transcript-card" aria-live="polite"><div class="full-transcript-loading">正在读取碑文释文……</div></div>`;
    const card=section.querySelector(".full-transcript-card");
    try{
      const response=await fetch(TEXT_URL,{cache:"no-store"});
      if(!response.ok) throw new Error(`${TEXT_URL} ${response.status}`);
      card.innerHTML=`<header class="full-transcript-header"><h3>${WORK_TITLE}</h3><span class="full-transcript-ornament" aria-hidden="true"></span></header><div class="full-transcript-body">${paragraphHtml(await response.text())}</div>`;
    }catch(error){console.warn("[work-003] transcript load failed",error);card.innerHTML='<div class="full-transcript-error">碑文释文暂时无法读取，请刷新页面后重试。</div>';}
  }

  window.DAMAGE_AI_CASES=CASES.map(item=>({...item,canvas:{...item.canvas},crop:{...item.crop},target:{...item.target},e:[...item.e]}));
  let current=0,expanded=false;
  const caseTabs=()=>CASES.map((item,index)=>`<button class="damage-tab${index===current?" active":""}" data-case-index="${index}" type="button" aria-pressed="${index===current}"><b>${item.i}</b><span class="name">${esc(item.n)}</span></button>`).join("");
  const exactImage=item=>`<div class="damage-viewport" data-image="${esc(item.image)}" title="双击查看原始拓片"><svg class="damage-crop-svg" viewBox="${item.crop.x} ${item.crop.y} ${item.crop.w} ${item.crop.h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(item.t)}对应拓片局部"><image href="${esc(item.image)}" x="0" y="0" width="${item.canvas.w}" height="${item.canvas.h}" preserveAspectRatio="none"></image><rect class="damage-box" x="${item.target.x}" y="${item.target.y}" width="${item.target.w}" height="${item.target.h}"></rect></svg></div>`;

  function casePanel(item){
    return `<div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${CASES.length}</span><div class="damage-heading">${esc(item.t)}</div><div class="damage-pager"><button data-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${CASES.length}</span><button data-action="next" type="button" ${current===CASES.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list" aria-label="碑文残损与AI释读案例">${caseTabs()}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（局部）</h3>${exactImage(item)}<p class="damage-caption">《${WORK_TITLE}》第${item.page}页，对应问题字局部</p></section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别（OCR结果）</span><div class="damage-text">${esc(item.o)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">修正结果（AI识别）</span><div class="damage-text damage-new">${esc(item.c)}</div></div><div class="damage-block"><span class="damage-label">恢复后的上下文</span><div class="damage-restored">${esc(item.r)}</div></div><div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><div class="damage-evidence${expanded?" open":""}"><ol>${item.e.map(line=>`<li>${esc(line)}</li>`).join("")}</ol><p><strong>建议置信度：</strong>${esc(item.confidence)}</p></div><button class="damage-expand" data-action="expand" type="button">${expanded?"收起内容⌃":"展开更多⌄"}</button></div></div></section></div></div>`;
  }

  function bind(section){
    section.querySelectorAll("[data-case-index]").forEach(button=>button.addEventListener("click",()=>{current=Number(button.dataset.caseIndex)||0;expanded=false;renderDamage();}));
    section.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>{const action=button.dataset.action;if(action==="prev"&&current>0)current-=1;if(action==="next"&&current<CASES.length-1)current+=1;if(action==="expand")expanded=!expanded;else expanded=false;renderDamage();}));
    const viewport=section.querySelector(".damage-viewport");
    if(viewport)viewport.addEventListener("dblclick",()=>{const src=viewport.dataset.image;if(src&&typeof window.openZoom==="function")window.openZoom(src);});
  }

  function renderDamage(){
    const section=document.getElementById("people");
    if(!section) return;
    setMenuTitle(3,"三、碑文残损与AI释读");
    section.classList.add("damage-ai");
    section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell">${casePanel(CASES[current])}</div>`;
    bind(section);
  }

  function init(){renderTranscript();renderDamage();window.__WORK_003_CONTENT_READY__=true;window.dispatchEvent(new CustomEvent("work-003-content-ready"));}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
