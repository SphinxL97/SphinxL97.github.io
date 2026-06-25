async function loadJSON(url){
  const r = await fetch(url, {cache:"no-store"});
  if(!r.ok) throw new Error(url + " " + r.status);
  return await r.json();
}

let catalog = [];

function padId(id){
  return String(id || "001").padStart(3, "0");
}

function localCoverPath(item){
  const id = padId(item.id);
  const title = item.title || "";
  return `assets/page_images/${id}_${title}/images/0001_一.jpg`;
}

function detailUrl(item){
  const id = padId(item.id);
  const raw = item.detail_url || "";
  if(!raw || raw === "#" || raw.startsWith("javascript:")) return `detail.html?id=${id}`;
  return raw;
}

function cardHTML(item){
  const url = detailUrl(item);
  const cover = localCoverPath(item);
  const meta1 = item.creator || item.script || item.dynasty || "资料待整理";
  const meta2 = item.script || item.dynasty || "";

  return `<a class="beitie-card" href="${url}">
    <div class="thumb">
      <img src="${cover}" alt="${item.title}" loading="lazy" onerror="this.onerror=null;this.src='${item.cover || ""}'">
    </div>
    <div class="card-info">
      <h3 title="${item.title}">${item.title}</h3>
      <div class="meta">
        ${item.status ? `<span class="ready">${item.status}</span>` : ""}
        <span>${meta1}</span>
        ${meta2 && meta2 !== meta1 ? `<span>${meta2}</span>` : ""}
      </div>
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
}).catch(err=>{
  const grid = document.getElementById("galleryGrid");
  if(grid) grid.innerHTML = `<div style="padding:20px;color:#9f3025;">读取 data/beitie_catalog.json 失败：${err.message}</div>`;
});
