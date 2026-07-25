/* 栏目三统一分类：古字识别、形近字纠错、残损碑文修复、AI暂拟。 */
(function(){
  "use strict";
  if(window.__DAMAGE_CATEGORY_STANDARDIZER_V1__)return;
  window.__DAMAGE_CATEGORY_STANDARDIZER_V1__=true;

  const CATEGORY_DEFINITIONS={
    "古字识别":"碑面字形基本完整，但属于古字、异体字、生僻字或扩展区字符；任务是确认该字的规范释读，不涉及误字纠正或缺损补字。",
    "形近字纠错":"原识别已经给出一个具体汉字，但因偏旁、轮廓或残笔相近而认成了另一个字；依据字形与上下文把误识字改正。",
    "残损碑文修复":"原文存在缺字或残损槽位，且能由清晰残笔、可靠录文、同碑异本或明确文献对校得到较可靠的补字。",
    "AI暂拟":"原文存在缺字或残损槽位，但缺少足够的字形或文献证据，只能主要依据语境、语法、人物和常用表达提出候选字；必须保留暂定性质。"
  };
  const ORDER=["古字识别","形近字纠错","残损碑文修复","AI暂拟"];
  const MISSING_RE=/[□■�]|[?？]{1,}|缺字|残缺|漫漶|泐损|阙文|空格待补|无法辨识/;
  const ANCIENT_RE=/古字识别|古文字识别|异体字识别|生僻字识别|扩展区字符|古今字识别/;
  const PROVISIONAL_RE=/AI暂拟|暂拟|待考|疑补|拟补|语境推|据语境|主要依据语境|上下文推|可能为|或为|疑为|无法确认|无法唯一|未见可靠|证据不足|低置信|暂定/;
  const DOCUMENTARY_RE=/文献对校|文献校勘|同碑异本|异本对校|可靠录文|传世录文|旧录|释文对校|拓本对校|原拓可辨|残笔可辨|字形可辨|明确可见|可据.*补|据.*录文/;
  const VISUAL_RE=/形近|误识|OCR误|识作|误作|偏旁|轮廓|字形相近|残笔相近|点画相近/;

  const clean=value=>String(value==null?"":value).trim();
  const getOriginal=item=>clean(item?.original||item?.o||item?.raw||item?.ocr||item?.source_text);
  const getCorrected=item=>clean(item?.corrected||item?.c||item?.restored||item?.answer||item?.result);
  const evidenceText=item=>[
    item?.category,item?.crowdsourceCategory,item?.mode,item?.type,item?.n,item?.title,item?.t,
    item?.reference,item?.source,item?.verification,item?.confidence,item?.note,
    ...(Array.isArray(item?.analysis)?item.analysis:[]),...(Array.isArray(item?.evidence)?item.evidence:[])
  ].map(clean).filter(Boolean).join(" ");
  const unmark=value=>clean(value).replace(/[〔〕【】\[\]（）()]/g,"").replace(/\s+/g,"");

  function classificationReason(item,category){
    const original=getOriginal(item),corrected=getCorrected(item),text=evidenceText(item);
    if(category==="古字识别")return "原字形仍在，任务是确认古字、异体字或生僻字的释读。";
    if(category==="形近字纠错")return `原识别为具体字符，修正后由“${original}”改为“${corrected}”，属于误识字纠正。`;
    if(category==="残损碑文修复")return DOCUMENTARY_RE.test(text)||String(item?.mode||"").toLowerCase()==="documentary"?"原文有缺损，并有文献对校、异本或可辨残笔作为较可靠依据。":"原文有缺损，现有字形与证据足以支持较可靠补字。";
    return "原文有缺损，但现有依据主要来自语境或推测，证据不足以作为确定修复。";
  }

  function classifyDamageCase(item){
    const original=getOriginal(item),corrected=getCorrected(item);
    const text=evidenceText(item);
    const rawCategory=clean(item?.category||item?.crowdsourceCategory||item?.n);
    const mode=clean(item?.mode).toLowerCase();
    const confidence=clean(item?.confidence);
    const hasMissing=MISSING_RE.test(original)||/□|缺|残损|漫漶|泐/.test(rawCategory);

    if(ANCIENT_RE.test(`${rawCategory} ${text}`))return "古字识别";

    if(original&&corrected&&unmark(original)!==unmark(corrected)&&!MISSING_RE.test(original)){
      return "形近字纠错";
    }

    if(hasMissing){
      if(mode==="ai_provisional"||PROVISIONAL_RE.test(`${rawCategory} ${text}`))return "AI暂拟";
      if(mode==="documentary"||mode==="verified"||mode==="collation")return "残损碑文修复";
      if(/文献对校|残损碑文修复/.test(rawCategory))return "残损碑文修复";
      const strongEvidence=DOCUMENTARY_RE.test(text)||(/高|确定|明确/.test(confidence)&&DOCUMENTARY_RE.test(`${text} ${rawCategory}`));
      if(strongEvidence&&!PROVISIONAL_RE.test(text))return "残损碑文修复";
      return "AI暂拟";
    }

    if(VISUAL_RE.test(`${rawCategory} ${text}`)||original&&corrected&&unmark(original)!==unmark(corrected))return "形近字纠错";
    if(/残损碑文修复|残损碑文恢复/.test(rawCategory))return "残损碑文修复";
    if(/AI暂拟/.test(rawCategory))return "AI暂拟";
    return rawCategory==="古字识别"?"古字识别":"形近字纠错";
  }

  function standardizeDamageCases(items){
    if(!Array.isArray(items))return [];
    return items.map((item,index)=>{
      const category=classifyDamageCase(item||{});
      return {...item,category,crowdsourceCategory:category,classificationCategory:category,classificationReason:classificationReason(item||{},category),classificationRuleVersion:"20260725_v1",classificationIndex:index+1};
    });
  }

  let storedCases=standardizeDamageCases(Array.isArray(window.DAMAGE_AI_CASES)?window.DAMAGE_AI_CASES:[]);
  try{
    Object.defineProperty(window,"DAMAGE_AI_CASES",{
      configurable:true,
      enumerable:true,
      get(){return storedCases;},
      set(value){storedCases=standardizeDamageCases(value);scheduleApply();}
    });
  }catch(error){
    console.warn("[damage-category] 无法安装案例拦截器，改用直接标准化",error);
    window.DAMAGE_AI_CASES=storedCases;
  }

  function countsOf(items){
    const counts=Object.fromEntries(ORDER.map(name=>[name,0]));
    items.forEach(item=>{const category=classifyDamageCase(item);counts[category]=(counts[category]||0)+1;});
    return counts;
  }

  function makeLegend(items){
    const counts=countsOf(items);
    const wrap=document.createElement("details");
    wrap.className="damage-category-standard";
    wrap.open=false;
    wrap.innerHTML=`<summary><strong>栏目三分类标准</strong><span>本碑：${ORDER.map(name=>`${name} ${counts[name]||0}`).join(" · ")}</span></summary><div class="damage-category-grid">${ORDER.map(name=>`<section><h4>${name}</h4><p>${CATEGORY_DEFINITIONS[name]}</p></section>`).join("")}</div>`;
    return wrap;
  }

  let applying=false,scheduled=false;
  function setText(node,value){if(node&&node.textContent!==value)node.textContent=value;}
  function applyDamageCategoryUI(){
    if(applying)return;
    const section=document.getElementById("people");
    if(!section)return;
    const items=standardizeDamageCases(storedCases);
    if(!items.length)return;
    applying=true;
    try{
      const oldLegend=section.querySelector(".damage-category-standard");
      const anchor=section.querySelector(".damage-intro")||section.querySelector(".section-title");
      const legend=makeLegend(items);
      if(oldLegend)oldLegend.replaceWith(legend);
      else if(anchor)anchor.insertAdjacentElement("afterend",legend);

      const tabs=Array.from(section.querySelectorAll(".damage-tab"));
      tabs.forEach((tab,index)=>{
        const item=items[index];if(!item)return;
        setText(tab.querySelector(".name"),item.category);
        tab.dataset.standardCategory=item.category;
        tab.title=item.classificationReason||CATEGORY_DEFINITIONS[item.category];
      });
      let activeIndex=tabs.findIndex(tab=>tab.classList.contains("active"));
      if(activeIndex<0){
        const match=clean(section.querySelector(".damage-count")?.textContent).match(/(\d+)\s*\/\s*(\d+)/);
        activeIndex=match?Math.max(0,Number(match[1])-1):0;
      }
      const current=items[activeIndex]||items[0];
      if(current){
        const heading=section.querySelector(".damage-heading");
        if(heading){
          const title=clean(current.title||current.t||heading.textContent.replace(/^.*?——/,"").replace(/[“”]/g,""));
          setText(heading,`${current.category}——“${title}”`);
        }
        const corrected=section.querySelector(".damage-text.damage-new,.damage-restored");
        const block=corrected?.closest(".damage-block");
        setText(block?.querySelector(".damage-label"),current.category);
      }
      section.dataset.categoryStandardVersion="20260725_v1";
      window.__DAMAGE_CATEGORY_AUDIT__={counts:countsOf(items),total:items.length,cases:items.map(item=>({id:item.id||item.classificationIndex,category:item.category,reason:item.classificationReason}))};
    }finally{applying=false;}
  }

  function scheduleApply(){
    if(scheduled)return;scheduled=true;
    queueMicrotask(()=>{scheduled=false;applyDamageCategoryUI();});
  }

  function ensureStyle(){
    if(document.getElementById("damage-category-standard-style"))return;
    const style=document.createElement("style");
    style.id="damage-category-standard-style";
    style.textContent=".damage-category-standard{margin:12px 0 16px;border:1px solid #dec8a2;border-radius:14px;background:#fff9ec;color:#4f4135}.damage-category-standard summary{cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:11px 14px;list-style:none}.damage-category-standard summary::-webkit-details-marker{display:none}.damage-category-standard summary strong{color:#8d2f24}.damage-category-standard summary span{font-size:12px;color:#756556;text-align:right}.damage-category-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:0 14px 14px}.damage-category-grid section{padding:10px 12px;border:1px solid #eadbc2;border-radius:11px;background:#fffdf8}.damage-category-grid h4{margin:0 0 4px;color:#8d2f24;font-size:14px}.damage-category-grid p{margin:0!important;text-indent:0!important;font-size:12.5px;line-height:1.65;color:#63564a}@media(max-width:760px){.damage-category-standard summary{align-items:flex-start;flex-direction:column}.damage-category-standard summary span{text-align:left}.damage-category-grid{grid-template-columns:1fr}}";
    document.head.appendChild(style);
  }

  ensureStyle();
  window.DAMAGE_CATEGORY_DEFINITIONS=CATEGORY_DEFINITIONS;
  window.classifyDamageCase=classifyDamageCase;
  window.standardizeDamageCases=standardizeDamageCases;
  window.applyDamageCategoryUI=applyDamageCategoryUI;

  const observer=new MutationObserver(scheduleApply);
  const observe=()=>{const section=document.getElementById("people");if(section){observer.observe(section,{childList:true,subtree:true,characterData:true});scheduleApply();}};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",observe,{once:true});else observe();
  window.addEventListener("load",scheduleApply,{once:true});
  [100,300,700,1500,3000].forEach(delay=>setTimeout(scheduleApply,delay));
})();
