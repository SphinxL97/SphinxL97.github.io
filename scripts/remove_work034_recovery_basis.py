from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, got {count}: {old[:80]!r}")
    file.write_text(text.replace(old, new, 1), encoding="utf-8")


# 034专属脚本：增加运行时移除、重渲染监听和CSS兜底。
replace_once(
    "js/work-034.js",
    'const VERSION="20260726_zhangjilao_034_v1";',
    'const VERSION="20260726_zhangjilao_034_v2";'
)
replace_once(
    "js/work-034.js",
    'let cases=[],current=0,expanded=false,pageMap=new Map(),listScrollTop=0;',
    '''let cases=[],current=0,expanded=false,pageMap=new Map(),listScrollTop=0,recoveryObserver=null,recoveryCleanupScheduled=false;

  function isRecoveryBasisBlock(node){
    if(!(node instanceof Element))return false;
    if(node.matches(".damage-basis-block,.damage-basis-card,[data-damage-basis]"))return true;
    if(!node.classList.contains("damage-block"))return false;
    return String(node.querySelector(":scope > .damage-label")?.textContent||"").trim()==="恢复依据";
  }
  function removeRecoveryBasis(root=document){
    const targets=new Set();
    if(root instanceof Element&&isRecoveryBasisBlock(root))targets.add(root);
    root.querySelectorAll?.(".damage-basis-block,.damage-basis-card,[data-damage-basis]").forEach(node=>targets.add(node));
    root.querySelectorAll?.(".damage-block").forEach(node=>{if(isRecoveryBasisBlock(node))targets.add(node);});
    targets.forEach(node=>node.remove());
  }
  function observeRecoveryBasis(root){
    if(!(root instanceof Element))return;
    if(recoveryObserver)recoveryObserver.disconnect();
    recoveryObserver=new MutationObserver(()=>{
      if(recoveryCleanupScheduled)return;
      recoveryCleanupScheduled=true;
      queueMicrotask(()=>{recoveryCleanupScheduled=false;removeRecoveryBasis(root);});
    });
    recoveryObserver.observe(root,{childList:true,subtree:true});
  }'''
)
replace_once(
    "js/work-034.js",
    'section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell"><div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${cases.length}</span><div class="damage-heading">${esc(item.category)}——“${esc(item.title)}” <span class="damage-heading-confidence">（${esc(item.confidence)}置信度）</span></div><div class="damage-pager"><button data-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${cases.length}</span><button data-action="next" type="button" ${current===cases.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list" aria-label="碑文残损与AI释读案例">${caseTabs()}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（定位）</h3>${locationHTML(item)}</section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别或缺字槽位</span><div class="damage-text">${esc(item.original)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">${esc(item.category)}</span><div class="damage-text damage-new">${markedHTML(item.corrected)}</div></div><div class="damage-block"><span class="damage-label">恢复后的上下文</span><div class="damage-restored">${esc(plainRestored(item.corrected))}</div></div><div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><div class="damage-evidence${expanded?" open":""}"><ol>${analysis}</ol><p><strong>建议置信度：</strong>${esc(item.confidence)}</p></div><button class="damage-expand" data-action="expand" type="button">${expanded?"收起内容⌃":"展开更多⌄"}</button></div></div></section></div></div></div>`;',
    'section.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><p class="damage-intro">${INTRO}</p><div class="damage-shell"><div class="damage-toolbar"><span class="damage-count">案例 ${current+1} / ${cases.length}</span><div class="damage-heading">${esc(item.category)}——“${esc(item.title)}” <span class="damage-heading-confidence">（${esc(item.confidence)}置信度）</span></div><div class="damage-pager"><button data-action="prev" type="button" ${current===0?"disabled":""}>‹ 上一个</button><span class="damage-page">${current+1} / ${cases.length}</span><button data-action="next" type="button" ${current===cases.length-1?"disabled":""}>下一个 ›</button></div></div><div class="damage-body"><nav class="damage-list" aria-label="碑文残损与AI释读案例">${caseTabs()}</nav><div class="damage-stage"><section class="damage-card damage-image-card"><h3>拓片原图（定位）</h3>${locationHTML(item)}</section><section class="damage-card damage-analysis"><h3>AI辅助校勘</h3><div class="damage-flow"><div class="damage-block"><span class="damage-label">原始识别或缺字槽位</span><div class="damage-text">${esc(item.original)}</div></div><div class="damage-arrow">↓</div><div class="damage-block"><span class="damage-label">${esc(item.category)}</span><div class="damage-text damage-new">${markedHTML(item.corrected)}</div></div><div class="damage-block"><span class="damage-label">恢复后的上下文</span><div class="damage-restored">${esc(plainRestored(item.corrected))}</div></div><div class="damage-block damage-evidence-block"><span class="damage-label">AI分析依据</span><div class="damage-evidence${expanded?" open":""}"><ol>${analysis}</ol><p><strong>建议置信度：</strong>${esc(item.confidence)}</p></div><button class="damage-expand" data-action="expand" type="button">${expanded?"收起内容⌃":"展开更多⌄"}</button></div></div></section></div></div></div>`;removeRecoveryBasis(section);observeRecoveryBasis(section);'
)
replace_once(
    "js/work-034.js",
    'if(typeof window.applyDamageCategoryUI==="function")window.applyDamageCategoryUI();',
    'if(typeof window.applyDamageCategoryUI==="function")window.applyDamageCategoryUI();removeRecoveryBasis(section);'
)
replace_once(
    "js/work-034.js",
    '.damage-location-missing{display:flex;align-items:center;justify-content:center;min-height:250px;padding:30px;border:1px dashed #d8c69f;border-radius:14px;background:#fffaf0;color:#7b6c5a;text-align:center}";',
    '.damage-location-missing{display:flex;align-items:center;justify-content:center;min-height:250px;padding:30px;border:1px dashed #d8c69f;border-radius:14px;background:#fffaf0;color:#7b6c5a;text-align:center}#people[data-work034-dedicated="true"] .damage-basis-block,#people[data-work034-dedicated="true"] .damage-basis-card,#people[data-work034-dedicated="true"] [data-damage-basis]{display:none!important}";'
)
replace_once(
    "js/work-034.js",
    'ensureStyle();applySupplementalInfo();const damage=document.getElementById("people");if(damage)damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-loading">正在读取《${TITLE}》释读案例……</div></div>`;',
    'ensureStyle();applySupplementalInfo();const damage=document.getElementById("people");if(damage){damage.innerHTML=`<h2 class="section-title">三、碑文残损与AI释读</h2><div class="damage-shell"><div class="full-transcript-loading">正在读取《${TITLE}》释读案例……</div></div>`;removeRecoveryBasis(damage);observeRecoveryBasis(damage);}'
)

# 共享路由和入口缓存刷新。
replace_once(
    "js/damage_ai_reading.js",
    'if(window.__DAMAGE_AI_READING_ROUTER_V73__)return;\n  window.__DAMAGE_AI_READING_ROUTER_V73__=true;',
    'if(window.__DAMAGE_AI_READING_ROUTER_V74__)return;\n  window.__DAMAGE_AI_READING_ROUTER_V74__=true;\n  window.__DAMAGE_AI_READING_ROUTER_V73__=true;'
)
replace_once(
    "js/damage_ai_reading.js",
    'js/work-034.js?v=20260726_zhangjilao_034_v1',
    'js/work-034.js?v=20260726_zhangjilao_034_v2'
)
replace_once(
    "js/detail_info_patch.js",
    'if(window.__DETAIL_INFO_STABLE_ENTRY_V33__)return;\n  window.__DETAIL_INFO_STABLE_ENTRY_V33__=true;',
    'if(window.__DETAIL_INFO_STABLE_ENTRY_V34__)return;\n  window.__DETAIL_INFO_STABLE_ENTRY_V34__=true;\n  window.__DETAIL_INFO_STABLE_ENTRY_V33__=true;'
)
replace_once(
    "js/detail_info_patch.js",
    'const recoveryVersion="20260726_zhangjilao_034_v1_route";',
    'const recoveryVersion="20260726_zhangjilao_034_v2_no_basis";'
)
replace_once(
    "detail.html",
    'js/detail_info_patch.js?v=20260726_zhangjilao_034_v1',
    'js/detail_info_patch.js?v=20260726_zhangjilao_034_v2'
)
replace_once(
    "detail.html",
    'js/damage_ai_reading.js?v=20260726_zhangjilao_034_v1',
    'js/damage_ai_reading.js?v=20260726_zhangjilao_034_v2'
)
