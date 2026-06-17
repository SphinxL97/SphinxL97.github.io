
async function loadJSON(u){return await (await fetch(u)).json()}
function card(x){let img=x.cover?`<img src="${x.cover}" alt="${x.title}">`:'';return `<a class="beitie-card" href="${x.active?x.detail_url:'javascript:void(0)'}"><div class="cover">${img}</div><div class="card-body"><h3>${x.id} ${x.title}</h3><span class="tag">${x.script||'待补充'}</span><div class="status ${x.active?'ready':''}">${x.active?'可查看完整内容':'封面入口，待补充详情'}</div></div></a>`}
loadJSON('data/beitie_catalog.json').then(d=>{let box=document.getElementById('homeCards');if(box)box.innerHTML=d.slice(0,8).map(card).join('')});
const btn=document.getElementById('homeSearchBtn'),inp=document.getElementById('homeSearch');if(btn&&inp){btn.onclick=()=>{let q=inp.value.trim();if(!q){location.href='gallery.html';return} if(q.includes('欧阳')||q.includes('王存善')||q.includes('何绍基')||q.includes('玄奘')||q.includes('道因')) location.href='people.html?q='+encodeURIComponent(q); else location.href='gallery.html?q='+encodeURIComponent(q)}}
