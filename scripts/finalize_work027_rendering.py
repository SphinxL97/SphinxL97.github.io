#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
VERSION_OLD='20260724_wei_five_v1'
VERSION_NEW='20260724_wei_five_v2'

path=ROOT/'js/work-027.js'
text=path.read_text(encoding='utf-8')
old='''  function paragraphHTML(text){
    const parts=String(text||"").replaceAll("\\r\\n","\\n").replaceAll("\\r","\\n").split("\\n\\n").map(p=>p.trim()).filter(Boolean);
    return parts.map(part=>{
      const isTitle=/^(魏故|滄州|魏渤海太守王偃墓)/.test(part)&&part.indexOf("。")==part.lastIndexOf("。");
      return isTitle?`<h4 class="work027-part-title">${esc(part)}</h4>`:`<p>${esc(part)}</p>`;
    }).join("");
  }'''
new='''  function paragraphHTML(text){
    const parts=String(text||"").replaceAll("\\r\\n","\\n").replaceAll("\\r","\\n").split("\\n\\n").map(p=>p.trim()).filter(Boolean);
    const titles=["魏故懷令李君墓誌銘。","魏故咸陽太守劉府君墓誌銘。","滄州刾□王僧墓誌銘。","魏故使持節侍中驃騎大将軍太保太尉公録尚書事","魏故勃海太守王府君墓誌銘。"];
    return parts.map(part=>{
      if(part.startsWith("魏渤海太守王偃墓，葬臨齊城東六里。"))return `<h4 class="work027-part-title">王偃墓志清光绪元年出土后跋</h4><p>${esc(part)}</p>`;
      const title=titles.find(value=>part.startsWith(value));
      if(!title)return `<p>${esc(part)}</p>`;
      if(title.endsWith("事")){
        const cut=part.indexOf("墓誌銘。")+4;
        const fullTitle=part.slice(0,cut),body=part.slice(cut);
        return `<h4 class="work027-part-title">${esc(fullTitle)}</h4>${body?`<p>${esc(body)}</p>`:""}`;
      }
      const body=part.slice(title.length);
      return `<h4 class="work027-part-title">${esc(title)}</h4>${body?`<p>${esc(body)}</p>`:""}`;
    }).join("");
  }'''
if old not in text: raise RuntimeError('paragraphHTML block not found')
text=text.replace(old,new,1)
text=text.replace('window.__WORK_027_CROWDSSOURCE_READY__=true;','')
text=text.replace(VERSION_OLD,VERSION_NEW)
path.write_text(text,encoding='utf-8')

for rel in ('js/damage_ai_reading.js','js/detail_info_patch.js','detail.html'):
    p=ROOT/rel
    s=p.read_text(encoding='utf-8').replace(VERSION_OLD,VERSION_NEW)
    p.write_text(s,encoding='utf-8')

report_path=ROOT/'data/work027_coordinate_report.json'
import json
report=json.loads(report_path.read_text(encoding='utf-8'))
report['cache_version']=VERSION_NEW
report['section_heading_rendering']='五种墓志题名与王偃墓志光绪后跋独立显示'
report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
