
async function loadJSON(url){ const r=await fetch(url); return await r.json(); }
function cardHTML(item){
 return `<a class="beitie-card" href="${item.active?'detail.html?id=001':'javascript:void(0)'}"><div class="cover">${item.cover?`<img src="${item.cover}" alt="${item.title}"/>`:''}</div><div class="card-body"><h3>${item.id} ${item.title}</h3><div class="tags"><span class="tag">AI配图待定</span>${item.active?'<span class="tag">001样例</span>':''}</div><div class="status ${item.active?'ready':''}">${item.status}</div><p class="status">${item.prompt_hint}</p></div></a>`;
}
loadJSON('data/ai_gallery.json').then(data=>{document.getElementById('aiGrid').innerHTML=data.map(cardHTML).join('');});
