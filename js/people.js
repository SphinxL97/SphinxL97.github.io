
async function loadJSON(url){ const r = await fetch(url); return await r.json(); }
let graph, nodes, links, selected="道因法师碑", svg, W=980,H=620;
const typeColor={"碑帖":"#a43122","人物":"#7f4f24","地点/机构":"#55715a","收藏机构":"#5a668f","收藏/地点":"#55715a"};
function init(){
  svg=document.getElementById("relationGraph");
  loadJSON("data/beitie_people_graph.json").then(data=>{graph=data; nodes=data.nodes.map((d,i)=>({...d,x:W/2+Math.cos(i)*180,y:H/2+Math.sin(i)*120,vx:0,vy:0})); links=data.links; renderSamples(data.samples||[]); tick();});
  document.getElementById("searchPersonBtn").onclick=()=>searchPerson();
  document.getElementById("personSearch").addEventListener("keydown",e=>{if(e.key==="Enter") searchPerson();});
}
function renderSamples(arr){ document.getElementById("samplePeople").innerHTML=arr.map(n=>`<button onclick="selectNode('${n}')">${n}</button>`).join(""); }
function searchPerson(){ const q=document.getElementById("personSearch").value.trim(); if(q) selectNode(q); }
function selectNode(name){
  const found=nodes.find(n=>n.label.includes(name)||n.id.includes(name));
  if(found){ selected=found.id; document.getElementById("personSearch").value=found.label; }
  else { selected=name; }
  updateInfo();
}
function updateInfo(){
  const n=nodes.find(x=>x.id===selected)||nodes.find(x=>x.label.includes(selected));
  const related=links.filter(l=>l.source===selected||l.target===selected|| (n && (l.source===n.id||l.target===n.id)) );
  const info=document.getElementById("graphInfo");
  if(!n){ info.innerHTML=`<h2>未找到：${selected}</h2><p>当前样例数据中没有这个人物。后续接入45件碑帖人物名单后，可扩展更多人物。</p>`; return; }
  info.innerHTML=`<h2>${n.label}</h2><p><span class="tag">${n.type}</span></p><p>${n.summary||""}</p><h3>相关关系</h3>`+ (related.length?`<ul>${related.map(l=>`<li>${l.source} — <b>${l.relation}</b> — ${l.target}</li>`).join("")}</ul>`:`<p>暂无关系。</p>`);
}
function step(){
  const center=nodes.find(n=>n.id===selected)||nodes[0];
  nodes.forEach(n=>{
    let tx=W/2, ty=H/2;
    if(n===center){ tx=W/2; ty=H/2; }
    else {
      const idx=nodes.indexOf(n); const angle=(idx/nodes.length)*Math.PI*2 + Date.now()/9000;
      tx=W/2+Math.cos(angle)*280; ty=H/2+Math.sin(angle)*190;
    }
    n.vx += (tx-n.x)*0.003 + (Math.random()-.5)*0.09;
    n.vy += (ty-n.y)*0.003 + (Math.random()-.5)*0.09;
    n.vx*=0.88; n.vy*=0.88; n.x+=n.vx; n.y+=n.vy;
  });
}
function tick(){ step(); draw(); requestAnimationFrame(tick); }
function draw(){
  if(!nodes) return;
  let html="";
  links.forEach(l=>{
    const s=nodes.find(n=>n.id===l.source), t=nodes.find(n=>n.id===l.target); if(!s||!t) return;
    const active=(s.id===selected||t.id===selected);
    html+=`<line x1="${s.x}" y1="${s.y}" x2="${t.x}" y2="${t.y}" class="g-link ${active?'active':''}"/>`;
    html+=`<text x="${(s.x+t.x)/2}" y="${(s.y+t.y)/2}" class="g-rel">${l.relation}</text>`;
  });
  nodes.forEach(n=>{
    const active=n.id===selected;
    const r=(active? n.size*1.45 : n.size);
    html+=`<g class="g-node ${active?'active':''}" onclick="selectNode('${n.id}')"><circle cx="${n.x}" cy="${n.y}" r="${r}" fill="${typeColor[n.type]||'#87623e'}"/><text x="${n.x}" y="${n.y+5}" text-anchor="middle">${n.label}</text></g>`;
  });
  svg.innerHTML=html;
}
window.selectNode=selectNode;
init();
