
async function loadJSON(url){ const r = await fetch(url); return await r.json(); }
let catalog = [];
function cardHTML(item){
  const url = item.active ? (item.detail_url || "detail.html?id=001") : "javascript:void(0)";
  const cls = item.active ? "beitie-card" : "beitie-card card-disabled";
  const meta1 = item.creator || item.script || "资料待整理";
  const status = item.active ? "完整样板" : "封面入口";
  return `<a class="${cls}" href="${url}">
    <div class="thumb">
      ${item.cover ? `<img src="${item.cover}" alt="${item.title}">` : ""}
      <span class="ribbon">示例</span>
    </div>
    <div class="card-info">
      <h3 title="${item.title}">${item.title}</h3>
      <div class="meta"><span class="${item.active?'ready':''}">⌘ ${status}</span><span>${meta1}</span></div>
    </div>
  </a>`;
}
function render(q=""){
  q = q.trim();
  const filtered = catalog.filter(x=>{
    const hay = [x.id,x.title,x.creator,x.script,x.dynasty,x.shelf_mark,(x.tags||[]).join(" ")].join(" ");
    return !q || hay.includes(q);
  });
  const grid = document.getElementById("galleryGrid");
  grid.innerHTML = filtered.map(cardHTML).join("");
  const count = document.getElementById("countText");
  if(count) count.textContent = filtered.length;
}
loadJSON("data/beitie_catalog.json").then(data=>{
  catalog = data || [];
  render();
  const input = document.getElementById("gallerySearch");
  if(input) input.addEventListener("input", e=>render(e.target.value));
});
