/* 026《麻姑山仙坛记》栏目二、三、四专属模块。 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="026"||window.__WORK_026_MAGUSHAN__)return;
  window.__WORK_026_MAGUSHAN__=true;
  window.__DAMAGE_CASE_UNBRACKETED_ADAPTER__=true;
  window.__DAMAGE_CASE_INTEGRITY_V2__=true;
  window.__DAMAGE_CASE_PARTIAL_STATUS__=true;
  window.__DAMAGE_CASE_AUDIT_V2__=true;
  window.__DAMAGE_CASE_STANDARD_PATCH_V4__=true;

  const TITLE="麻姑山仙坛记";
  const VERSION="20260724_magushan_v1";
  const TEXT_URL=`data/work026_full_text.txt?v=${VERSION}`;
  const CASE_URL=`data/work026_damage_cases.json?v=${VERSION}`;
  const NOTE="本节页面展示释文为由AI整理阅读版，段落划分和标点符号由AI辅助校对，仅供阅读参考。";
  const EMPTY_TEXT="本篇用户底稿未标出可进入释读的残损方框或疑难字，暂不建立AI补字案例。";
  const escapeHTML=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;");

  async function fetchText(url){const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw new Error(`${url} ${response.status}`);return response.text();}
  async function fetchJSON(url){const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw new Error(`${url} ${response.status}`);return response.json();}
  function setMenuTitle(index,title){const link=document.querySelector(`.side a:nth-of-type(${index})`);if(link)link.textContent=title;}
  function paragraphHTML(text){
    const normalized=String(text||"").replaceAll("\r\n","\n").replaceAll("\r","\n");
    return normalized.split("\n\n").map(part=>part.trim()).filter(Boolean).map(part=>`<p>${escapeHTML(part)}</p>`).join("");
  }
  function renderTranscript(text){
    const section=document.getElementById("calligraphy");if(!section)return;
    setMenuTitle(2,"二、碑文释文");
    section.className="content-card full-transcript-section";
    section.innerHTML=`<h2 class="section-title">二、碑文释文</h2><p class="full-transcript-note">${NOTE}</p><div class="full-transcript-card"><header class="full-transcript-header"><h3>${TITLE}</h3><span class="full-transcript-ornament" aria-hidden="true"></span></header><div class="full-transcript-body">${paragraphHTML(text)}</div></div>`;
  }
  function renderDamageEmpty(){
    const section=document.getElementById("people");if(!section)return;
    setMenuTitle(3,"三、碑文残损与AI释读");
    section.className="content-card damage-ai work026-empty-damage";
    section.dataset.work026Dedicated="true";
    section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">本栏目仅处理用户底稿中明确出现的残损方框或疑难字。</p><div class="damage-shell"><div class="work026-empty-card"><b>本篇暂无残损补字案例</b><p>${EMPTY_TEXT}</p></div></div>`;
  }
  function renderCrowdsourceEmpty(){
    const panel=document.querySelector('#places [data-panel="missingText"]');
    if(!panel)return false;
    panel.dataset.work026Empty="true";
    panel.innerHTML=`<div class="work026-crowd-empty"><b>本篇暂无AI补字案例</b><p>栏目三没有残损补字案例。您仍可使用“释文校订”和“标点校订”两个页签提交意见。</p></div>`;
    return true;
  }
  function ensureStyle(){
    if(document.getElementById("work026-magushan-style"))return;
    const style=document.createElement("style");
    style.id="work026-magushan-style";
    style.textContent=".work026-empty-card,.work026-crowd-empty{margin:18px;padding:34px;border:1px dashed #d8c69f;border-radius:16px;background:#fffaf0;text-align:center;color:#756755}.work026-empty-card b,.work026-crowd-empty b{display:block;margin-bottom:10px;color:#8b2e24;font-size:18px}.work026-empty-card p,.work026-crowd-empty p{margin:0;line-height:1.9}.work026-empty-damage .damage-shell{padding:1px}";
    document.head.appendChild(style);
  }
  function publishEmptyCases(){
    window.DAMAGE_AI_CASES=[];
    window.dispatchEvent(new CustomEvent("work-026-cases-ready",{detail:{count:0}}));
  }
  function finishCrowdsource(){
    renderCrowdsourceEmpty();
    window.__WORK_026_CROWDSOURCE_READY__=true;
    window.dispatchEvent(new CustomEvent("work-026-crowdsource-ready",{detail:{count:0}}));
  }
  function ensureCrowdsource(){
    return new Promise(resolve=>{
      const stylePath="assets/css/crowdsource-v9.css";
      if(!Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(link=>(link.getAttribute("href")||"").split("?")[0].endsWith(stylePath))){
        const link=document.createElement("link");link.rel="stylesheet";link.href=`${stylePath}?v=${VERSION}`;document.head.appendChild(link);
      }
      const done=()=>{finishCrowdsource();resolve(true);};
      if(window.__CROWDSOURCE_MISSING_V10__){done();return;}
      const scriptPath="assets/js/crowdsource-v9.js";
      const existing=Array.from(document.scripts).find(script=>(script.getAttribute("src")||"").split("?")[0].endsWith(scriptPath));
      if(existing){existing.addEventListener("load",done,{once:true});requestAnimationFrame(done);return;}
      const script=document.createElement("script");script.src=`${scriptPath}?v=${VERSION}`;script.async=false;script.addEventListener("load",done,{once:true});script.addEventListener("error",done,{once:true});document.head.appendChild(script);
    });
  }
  async function init(){
    ensureStyle();
    publishEmptyCases();
    try{
      const [text,rows]=await Promise.all([fetchText(TEXT_URL),fetchJSON(CASE_URL)]);
      if(!Array.isArray(rows)||rows.length!==0)throw new Error("026案例文件应为空数组");
      renderTranscript(text);
      renderDamageEmpty();
      await ensureCrowdsource();
      window.__WORK_026_CONTENT_READY__=true;
      window.__WORK_026_STABLE_READY__=true;
      window.dispatchEvent(new CustomEvent("work-026-content-ready",{detail:{count:0}}));
      window.dispatchEvent(new CustomEvent("work-026-stable-ready",{detail:{cases:0}}));
    }catch(error){
      console.error("[work-026]",error);
      const transcript=document.getElementById("calligraphy"),damage=document.getElementById("people");
      if(transcript)transcript.innerHTML='<h2 class="section-title">二、碑文释文</h2><div class="full-transcript-error">026碑文数据读取失败，请刷新页面后重试。</div>';
      if(damage)damage.innerHTML='<h2 class="section-title">三、碑文残损与AI释读</h2><div class="full-transcript-error">026专属内容读取失败，请刷新页面后重试。</div>';
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
