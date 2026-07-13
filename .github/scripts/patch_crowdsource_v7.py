from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
js_path = ROOT / "assets/js/crowdsource.js"
css_path = ROOT / "assets/css/crowdsource.css"
detail_path = ROOT / "detail.html"
config_path = ROOT / "assets/js/form-config.js"


def replace_once(text, old, new, label):
    if old not in text:
        raise RuntimeError(f"missing replacement target: {label}")
    return text.replace(old, new, 1)


def regex_once(text, pattern, replacement, label):
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f"expected one regex replacement for {label}, got {count}")
    return updated


js = js_path.read_text(encoding="utf-8")

# Give the three tabs distinct, semantic icons instead of repeating the pencil icon.
old_tabs = '''          <button class="crowd-tab" data-tab="transcription" type="button">✎ 释文校订（针对单字）</button>
          <button class="crowd-tab" data-tab="punctuation" type="button">✎ 标点校订（针对句子）</button>
          <button class="crowd-tab" data-tab="missingText" type="button">▣ 缺字补录与争议（针对补字/缺字）</button>'''
new_tabs = '''          <button class="crowd-tab" data-tab="transcription" type="button"><span class="crowd-tab-icon" aria-hidden="true">字</span><span>释文校订（针对单字）</span></button>
          <button class="crowd-tab" data-tab="punctuation" type="button"><span class="crowd-tab-icon" aria-hidden="true">。</span><span>标点校订（针对句子）</span></button>
          <button class="crowd-tab" data-tab="missingText" type="button"><span class="crowd-tab-icon" aria-hidden="true">□</span><span>缺字补录与争议（针对补字/缺字）</span></button>'''
js = replace_once(js, old_tabs, new_tabs, "tab icons")

# When the currently open item is removed, open the most recent remaining item instead of leaving stale state.
old_remove_selected = '''    if(state.selected.has(key)){
      state.selected.delete(key);
      if(state.lastKey===key) state.lastKey="";
    }else{'''
new_remove_selected = '''    if(state.selected.has(key)){
      state.selected.delete(key);
      if(state.lastKey===key) state.lastKey=Array.from(state.selected.keys()).at(-1)||"";
    }else{'''
js = replace_once(js, old_remove_selected, new_remove_selected, "selected item removal")

# Replace the transcription card with an accordion card. Only one item is expanded at a time;
# adding a new item automatically collapses the previous one, while every item can be reopened manually.
new_card_function = r'''  function buildTranscriptionCard(item,index){
    const expanded=state.lastKey===item.key;
    const card=document.createElement("article");
    card.className=`crowd-item${expanded?" is-expanded":" is-collapsed"}`;
    card.dataset.itemKey=item.key;

    const head=document.createElement("div");head.className="crowd-item-head";
    const badge=document.createElement("span");badge.className="crowd-item-index";badge.textContent=String(index+1);
    const meta=document.createElement("div");meta.className="crowd-item-meta";
    if(item.manual){
      const strong=document.createElement("strong");strong.textContent="手动新增的位置与释文";meta.appendChild(strong);
      const summary=document.createElement("div");summary.textContent=item.pageNo&&item.line&&item.column?`第${item.pageNo}页 第${item.line}行 第${item.column}列｜${item.text||"待填写"}`:"请填写页码、行列与当前释文";meta.appendChild(summary);
    }else{
      const strong=document.createElement("strong");strong.textContent=`第${item.pageNo}页 第${item.line}行 第${item.column}列`;
      const current=document.createElement("div");current.textContent=`当前释文：${item.text||"□"}`;meta.append(strong,current);
    }

    const actions=document.createElement("div");actions.className="crowd-item-actions";
    const toggle=document.createElement("button");toggle.className="crowd-item-toggle";toggle.type="button";
    toggle.textContent=expanded?"收起":"展开";toggle.setAttribute("aria-expanded",String(expanded));
    toggle.title=expanded?"收起当前修改意见":"展开当前修改意见";
    toggle.addEventListener("click",()=>{state.lastKey=expanded?"":item.key;touch("transcription");renderTranscriptionItems();});
    const remove=document.createElement("button");remove.className="crowd-remove";remove.type="button";remove.title="删除当前意见";remove.textContent="⌫";
    remove.addEventListener("click",()=>{
      state.selected.delete(item.key);
      if(state.lastKey===item.key) state.lastKey=Array.from(state.selected.keys()).at(-1)||"";
      touch("transcription");renderTranscriptionItems();renderCurrentImage();
    });
    actions.append(toggle,remove);head.append(badge,meta,actions);card.appendChild(head);

    const body=document.createElement("div");body.className="crowd-item-body";body.hidden=!expanded;
    if(item.manual){
      const grid=document.createElement("div");grid.className="crowd-grid";
      const page=input("number",5);page.min="1";page.value=item.pageNo;page.addEventListener("input",()=>{item.pageNo=page.value;touch("transcription");});
      const line=input("number",5);line.min="1";line.value=item.line;line.addEventListener("input",()=>{item.line=line.value;touch("transcription");});
      const column=input("number",5);column.min="1";column.value=item.column;column.addEventListener("input",()=>{item.column=column.value;touch("transcription");});
      const current=input("text",30);current.value=item.text;current.addEventListener("input",()=>{item.text=current.value;touch("transcription");});
      grid.append(field("页码",page,true),field("行号",line,true),field("列号",column,true),field("当前释文",current,true));body.appendChild(grid);
    }

    const suggested=input("text",80);suggested.value=item.suggested;suggested.placeholder="可输入一个字或连续多个字";suggested.addEventListener("input",()=>{item.suggested=suggested.value;touch("transcription");});
    body.appendChild(field("建议修改为",suggested,true));
    const reason=textarea(800);reason.value=item.reason;reason.placeholder="请说明字形、上下文或其他判断理由";reason.addEventListener("input",()=>{item.reason=reason.value;touch("transcription");});
    body.appendChild(field("修改理由",reason,true));
    const reference=textarea(500);reference.value=item.reference;reference.placeholder="拓本、论文、字形、上下文或其他依据";reference.addEventListener("input",()=>{item.reference=reference.value;touch();});
    body.appendChild(field("参考依据（可选）",reference));
    card.appendChild(body);
    return card;
  }

  function renderSimplePanel'''
js = regex_once(
    js,
    r'  function buildTranscriptionCard\(item,index\)\{.*?\n  \}\n\n  function renderSimplePanel',
    new_card_function,
    "transcription accordion cards",
)

js_path.write_text(js, encoding="utf-8")

css = css_path.read_text(encoding="utf-8")
css = replace_once(
    css,
    '.crowd-tab{flex:1 0 240px;min-height:54px;border:0;border-right:1px solid #e2d6c4;background:transparent;color:#4c4035;padding:12px 18px;font-size:15px;font-weight:800;cursor:pointer;white-space:nowrap}',
    '.crowd-tab{flex:1 0 240px;min-height:54px;border:0;border-right:1px solid #e2d6c4;background:transparent;color:#4c4035;padding:12px 18px;font-size:15px;font-weight:800;cursor:pointer;white-space:nowrap;display:flex;align-items:center;justify-content:center;gap:9px}',
    "tab layout",
)
css = replace_once(
    css,
    '.crowd-workspace{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;align-items:stretch}',
    '.crowd-workspace{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;align-items:start}',
    "workspace alignment",
)
css = replace_once(
    css,
    '.crowd-pane{padding:16px;min-width:0;display:flex;flex-direction:column;height:100%}.crowd-pane-lead{margin:0 0 12px;color:#695b4e;font-size:13px;line-height:1.75}',
    '.crowd-pane{padding:16px;min-width:0;display:flex;flex-direction:column;height:auto;min-height:850px}.crowd-pane-lead{margin:0 0 12px;color:#695b4e;font-size:13px;line-height:1.75}',
    "fixed left pane",
)
css = replace_once(
    css,
    '.crowd-image-stage{position:relative;width:100%;height:720px;overflow:hidden;border:1px solid #eadfce;border-radius:13px;background:#f7f0e5;display:flex;align-items:center;justify-content:center;padding:10px;flex:1;min-height:0}',
    '.crowd-image-stage{position:relative;width:100%;height:720px;min-height:720px;max-height:720px;overflow:hidden;border:1px solid #eadfce;border-radius:13px;background:#f7f0e5;display:flex;align-items:center;justify-content:center;padding:10px;flex:0 0 720px}',
    "fixed image stage",
)
css = replace_once(
    css,
    '.crowd-right{min-width:0;height:100%}.crowd-list-card{padding:16px;height:100%;min-height:100%;display:flex;flex-direction:column}.crowd-list-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:13px;padding-bottom:11px;border-bottom:1px solid #eee2d0}.crowd-list-heading{min-width:0}.crowd-list-title{margin:0;font-family:"SimSun","Songti SC",serif;font-size:20px;line-height:1.25;color:#33291f;white-space:nowrap}.crowd-list-heading span{display:block;margin-top:3px;color:#8a7866;font-size:12px}.crowd-clear{flex:0 0 auto;border:1px solid #dbcab0;background:#fffaf1;color:#7b5c44;border-radius:999px;padding:7px 13px;cursor:pointer;white-space:nowrap}.crowd-clear:hover{color:#9a3025;border-color:#b98678;background:#fff4e4}',
    '.crowd-right{min-width:0;height:auto}.crowd-list-card{padding:16px;height:auto;min-height:850px;display:flex;flex-direction:column}.crowd-list-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:13px;padding-bottom:11px;border-bottom:1px solid #eee2d0}.crowd-list-heading{min-width:0}.crowd-list-title{margin:0;font-family:"SimSun","Songti SC",serif;font-size:20px;line-height:1.25;color:#33291f;white-space:nowrap}.crowd-list-heading span{display:block;margin-top:3px;color:#8a7866;font-size:12px}.crowd-clear{flex:0 0 auto;border:1px solid #dbcab0;background:#fffaf1;color:#7b5c44;border-radius:999px;padding:7px 13px;cursor:pointer;white-space:nowrap}.crowd-clear:hover{color:#9a3025;border-color:#b98678;background:#fff4e4}',
    "growing right pane",
)
css = replace_once(
    css,
    '.crowd-items{display:grid;gap:12px;flex:1;min-height:0;max-height:none;overflow-y:auto;padding-right:4px;scrollbar-width:thin;scrollbar-color:#b19a73 #f3ede2}.crowd-empty-list{border:1px dashed #dbcdb8;border-radius:12px;padding:28px 16px;text-align:center;color:#887765;background:#fcf8f1}.crowd-item{border:1px solid #e3d5c1;border-radius:13px;background:#fffdf9;padding:13px}.crowd-item-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px}.crowd-item-index{display:inline-flex;align-items:center;justify-content:center;width:25px;height:25px;border-radius:50%;background:#8f3b2f;color:#fff;font-size:12px;font-weight:900;flex:0 0 auto}.crowd-item-meta{flex:1;color:#5f5144;font-size:13px;line-height:1.6}.crowd-item-meta strong{color:#3f3329}.crowd-remove{border:0;background:transparent;color:#8e6d59;font-size:20px;cursor:pointer;line-height:1;padding:2px}.crowd-remove:hover{color:#a53125}',
    '.crowd-items{display:grid;gap:12px;flex:0 0 auto;min-height:0;max-height:none;overflow:visible;padding-right:0}.crowd-empty-list{border:1px dashed #dbcdb8;border-radius:12px;padding:28px 16px;text-align:center;color:#887765;background:#fcf8f1}.crowd-item{border:1px solid #e3d5c1;border-radius:13px;background:#fffdf9;padding:13px}.crowd-item-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:0}.crowd-item.is-expanded .crowd-item-head{margin-bottom:10px}.crowd-item-index{display:inline-flex;align-items:center;justify-content:center;width:25px;height:25px;border-radius:50%;background:#8f3b2f;color:#fff;font-size:12px;font-weight:900;flex:0 0 auto}.crowd-item-meta{flex:1;color:#5f5144;font-size:13px;line-height:1.6;min-width:0}.crowd-item-meta strong{color:#3f3329}.crowd-item-actions{display:flex;align-items:center;gap:5px;flex:0 0 auto}.crowd-item-toggle{border:1px solid #ddcdb5;border-radius:999px;background:#fffaf1;color:#755c47;padding:5px 11px;font-size:12px;font-weight:800;cursor:pointer}.crowd-item-toggle:hover{border-color:#b98578;color:#96372b;background:#fff4e7}.crowd-item-body[hidden]{display:none!important}.crowd-remove{border:0;background:transparent;color:#8e6d59;font-size:20px;cursor:pointer;line-height:1;padding:2px}.crowd-remove:hover{color:#a53125}',
    "accordion and natural list growth",
)

# Add semantic icon styling immediately after the tab state rules.
css = replace_once(
    css,
    '.crowd-tab:last-child{border-right:0}.crowd-tab:hover{background:#f4eadb;color:#8e3024}.crowd-tab.active{background:linear-gradient(135deg,#943b2e,#7d2e24);color:#fff}',
    '.crowd-tab:last-child{border-right:0}.crowd-tab:hover{background:#f4eadb;color:#8e3024}.crowd-tab.active{background:linear-gradient(135deg,#943b2e,#7d2e24);color:#fff}.crowd-tab-icon{display:inline-flex;align-items:center;justify-content:center;width:25px;height:25px;border:1px solid #cdbb9e;border-radius:8px;background:#fffaf1;color:#7e4d3c;font-family:"SimSun","Songti SC",serif;font-size:16px;line-height:1;font-weight:900;flex:0 0 auto}.crowd-tab.active .crowd-tab-icon{border-color:rgba(255,255,255,.48);background:rgba(255,255,255,.14);color:#fff}',
    "semantic icon styling",
)

css = replace_once(
    css,
    '@media(max-width:980px){.crowd-workspace{grid-template-columns:1fr}.crowd-items{max-height:none}.crowd-contact-grid{grid-template-columns:1fr 1fr}.crowd-contact-grid .crowd-field:last-child{grid-column:1/-1}}',
    '@media(max-width:980px){.crowd-workspace{grid-template-columns:1fr}.crowd-pane,.crowd-list-card{min-height:0}.crowd-image-stage{height:640px;min-height:640px;max-height:640px;flex-basis:640px}.crowd-items{max-height:none}.crowd-contact-grid{grid-template-columns:1fr 1fr}.crowd-contact-grid .crowd-field:last-child{grid-column:1/-1}}',
    "tablet fixed image size",
)
css = replace_once(
    css,
    '.crowd-image-stage{height:560px;padding:7px}',
    '.crowd-image-stage{height:560px;min-height:560px;max-height:560px;flex-basis:560px;padding:7px}',
    "mobile fixed image size",
)
css_path.write_text(css, encoding="utf-8")

for path in (detail_path, config_path):
    text = path.read_text(encoding="utf-8")
    if "20260713_fix6" not in text:
        raise RuntimeError(f"cache version target missing in {path}")
    path.write_text(text.replace("20260713_fix6", "20260713_fix7"), encoding="utf-8")

print("crowdsource v7 patch applied")
