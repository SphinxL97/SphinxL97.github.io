from pathlib import Path
import re

DETAIL = Path("detail.html")
JS = Path("assets/js/crowdsource.js")
CFG = Path("assets/js/form-config.js")

fallback = '''<article class="content-card crowdsource-section" id="places" data-crowdsource-static="true"><h2 class="section-title">四、众智释读</h2><p class="crowd-intro">本栏目用于收集读者对碑文释文、标点整理及缺字补录的校订意见。所有提交内容将由网站管理者人工审核，不会直接修改网页或自动公开。</p><div class="crowd-shell crowd-static-shell"><div class="crowd-tabs" role="tablist" aria-label="众智释读类型"><button class="crowd-tab active" type="button">✎ 释文校订（针对单字）</button><button class="crowd-tab" type="button">✎ 标点校订（针对句子）</button><button class="crowd-tab" type="button">▣ 缺字补录与争议（针对补字/缺字）</button></div><section class="crowd-panel"><div class="crowd-empty-list" data-crowdsource-loading>众智释读功能正在加载，请稍候……</div></section></div><noscript><p class="crowd-status error">浏览器未启用 JavaScript，暂时无法使用众智释读交互功能。</p></noscript></article>'''

detail = DETAIL.read_text(encoding="utf-8")
pattern = r'<article class="content-card" id="places">.*?</article>'
detail, count = re.subn(pattern, fallback, detail, count=1, flags=re.S)
if count != 1 and 'data-crowdsource-static="true"' not in detail:
    raise RuntimeError(f"Expected one old places article, replaced {count}")
for old, new in (
    ("assets/css/crowdsource.css?v=20260713_fix2", "assets/css/crowdsource.css?v=20260713_fix3"),
    ("assets/js/form-config.js?v=20260713_fix2", "assets/js/form-config.js?v=20260713_fix3"),
    ("assets/js/crowdsource.js?v=20260713_fix2", "assets/js/crowdsource.js?v=20260713_fix3"),
):
    detail = detail.replace(old, new)
DETAIL.write_text(detail, encoding="utf-8")

js = JS.read_text(encoding="utf-8")
js = js.replace("点击右侧碑帖图片中的任意字", "点击左侧碑帖图片中的任意字")
marker = 'section.classList.add("crowdsource-section");\n    section.innerHTML='
if marker in js:
    js = js.replace(marker, 'section.classList.add("crowdsource-section");\n    section.dataset.crowdsourceReady="true";\n    section.innerHTML=', 1)
old_reset = '''  function resetModule(type){
    state.contacts[type]=blankContact();
    if(type==="transcription"){state.selected.clear();state.lastKey="";renderTranscriptionItems();renderCurrentImage();}
    if(type==="punctuation"){state.punctuation=[blankPunctuation()];renderSimpleItems(type);}
    if(type==="missingText"){state.missingText=[blankMissing()];renderSimpleItems(type);}
  }'''
new_reset = '''  function resetModule(type){
    state.contacts[type]=blankContact();
    if(type==="transcription"){
      state.selected.clear();state.lastKey="";
      renderTranscriptionPanel();renderPageControls();
    }
    if(type==="punctuation"){
      state.punctuation=[blankPunctuation()];renderSimplePanel(type);
    }
    if(type==="missingText"){
      state.missingText=[blankMissing()];renderSimplePanel(type);
    }
    switchTab(type);
  }'''
if old_reset in js:
    js = js.replace(old_reset, new_reset, 1)
elif "renderTranscriptionPanel();renderPageControls();" not in js:
    raise RuntimeError("resetModule block not found")
JS.write_text(js, encoding="utf-8")

cfg = CFG.read_text(encoding="utf-8")
cfg = cfg.replace('document.querySelector("#places .crowd-shell")', 'document.querySelector(\'#places[data-crowdsource-ready="true"]\')')
cfg = cfg.replace("assets/js/crowdsource.js?v=20260713_fix2", "assets/js/crowdsource.js?v=20260713_fix3")
CFG.write_text(cfg, encoding="utf-8")

checks = {
    "static fourth section": 'data-crowdsource-static="true"' in detail,
    "old place cards removed": "重要地名" not in detail and "历史事件" not in detail,
    "new asset version": "20260713_fix3" in detail,
    "runtime ready marker": 'crowdsourceReady="true"' in js,
    "left image instruction": "点击左侧碑帖图片" in js,
    "retry ready selector": "data-crowdsource-ready" in cfg,
}
failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise RuntimeError("Validation failed: " + ", ".join(failed))
print("PASS", checks)
