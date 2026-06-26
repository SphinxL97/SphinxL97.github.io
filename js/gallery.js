async function loadJSON(url){
  const r = await fetch(url, {cache:"no-store"});
  if(!r.ok) throw new Error(url + " " + r.status);
  return await r.json();
}

let catalog = [];

function padId(id){
  return String(id || "001").padStart(3, "0");
}

function cardHTML(item){
  const id = padId(item.id);
  const cover = item.cover || "";
  const meta1 = item.creator || item.script || item.dynasty || "资料待整理";
  const meta2 = item.script || item.dynasty || "";

  const clickAttr = item.has_volumes
    ? `href="javascript:void(0)" onclick="openVolumeModal('${id}')"`
    : `href="${item.detail_url || `detail.html?id=${id}`}"`;

  return `<a class="beitie-card" ${clickAttr}>
    <div class="thumb">
      ${cover ? `<img src="${cover}" alt="${item.title}" loading="lazy">` : ""}
    </div>
    <div class="card-info">
      <h3 title="${item.title}">${item.title}</h3>
      <div class="meta">
        ${item.has_volumes ? `<span class="ready">多册可选</span>` : (item.status ? `<span class="ready">${item.status}</span>` : "")}
        <span>${meta1}</span>
        ${meta2 && meta2 !== meta1 ? `<span>${meta2}</span>` : ""}
      </div>
    </div>
  </a>`;
}

function render(q=""){
  q = q.trim();

  const filtered = catalog.filter(x=>{
    const hay = [
      x.id,
      x.title,
      x.creator,
      x.script,
      x.dynasty,
      x.shelf_mark,
      (x.tags || []).join(" ")
    ].join(" ");

    return !q || hay.includes(q);
  });

  const grid = document.getElementById("galleryGrid");
  grid.innerHTML = filtered.map(cardHTML).join("");

  const count = document.getElementById("countText");
  if(count) count.textContent = filtered.length;
}

function ensureVolumeModal(){
  if(document.getElementById("volumeModal")) return;

  const style = document.createElement("style");
  style.textContent = `
    .volume-mask{
      position:fixed;
      inset:0;
      background:rgba(25,18,12,.42);
      z-index:9999;
      display:none;
      align-items:center;
      justify-content:center;
      padding:24px;
    }
    .volume-dialog{
      width:min(680px,calc(100vw - 48px));
      max-height:82vh;
      overflow:auto;
      background:#fffdf8;
      border:1px solid #dfd1bd;
      border-radius:24px;
      box-shadow:0 28px 90px rgba(30,20,10,.28);
      padding:26px;
    }
    .volume-head{
      display:flex;
      justify-content:space-between;
      align-items:flex-start;
      gap:16px;
      border-bottom:1px solid #ead9c5;
      padding-bottom:14px;
      margin-bottom:18px;
    }
    .volume-head h2{
      margin:0;
      font-family:"SimSun","Songti SC",serif;
      font-size:30px;
      letter-spacing:.05em;
    }
    .volume-head p{
      margin:8px 0 0;
      color:#75685c;
    }
    .volume-close{
      border:1px solid #dfd1bd;
      background:#fff7e8;
      color:#7b2119;
      border-radius:999px;
      padding:6px 14px;
      cursor:pointer;
      font-weight:700;
    }
    .volume-list{
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(230px,1fr));
      gap:14px;
    }
    .volume-item{
      display:flex;
      gap:12px;
      align-items:center;
      border:1px solid #ead9c5;
      background:#fff7e8;
      border-radius:16px;
      padding:12px;
      transition:.16s;
    }
    .volume-item:hover{
      transform:translateY(-2px);
      box-shadow:0 10px 28px rgba(52,35,20,.12);
      border-color:#b58b53;
    }
    .volume-item img{
      width:72px;
      height:96px;
      object-fit:cover;
      border-radius:8px;
      border:1px solid #dfd1bd;
      background:#f6f0e5;
    }
    .volume-item strong{
      display:block;
      font-size:16px;
      color:#211b16;
      margin-bottom:4px;
    }
    .volume-item span{
      color:#9f3025;
      font-size:13px;
      font-weight:700;
    }
  `;

  document.head.appendChild(style);

  const modal = document.createElement("div");
  modal.id = "volumeModal";
  modal.className = "volume-mask";

  modal.innerHTML = `
    <div class="volume-dialog">
      <div class="volume-head">
        <div>
          <h2 id="volumeTitle">请选择册次</h2>
          <p id="volumeDesc">该碑帖包含多册，请先选择要浏览的册。</p>
        </div>
        <button class="volume-close" onclick="closeVolumeModal()">关闭</button>
      </div>
      <div class="volume-list" id="volumeList"></div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener("click", function(e){
    if(e.target === modal) closeVolumeModal();
  });
}

function openVolumeModal(id){
  ensureVolumeModal();

  const item = catalog.find(x => padId(x.id) === padId(id));

  if(!item || !item.volumes || !item.volumes.length){
    location.href = `detail.html?id=${id}`;
    return;
  }

  document.getElementById("volumeTitle").textContent = item.title;
  document.getElementById("volumeDesc").textContent = "该碑帖包含多册，请选择一册进入全文浏览。";

  const list = document.getElementById("volumeList");

  list.innerHTML = item.volumes.map(v => `
    <a class="volume-item" href="${(v.detail_url && !String(v.detail_url).includes('detail_multi.html')) ? v.detail_url : `detail.html?id=${v.virtual_id}`}">
      ${v.cover ? `<img src="${v.cover}" alt="${v.volume_title}">` : ""}
      <div>
        <strong>${v.volume_title}</strong>
        <span>进入浏览</span>
      </div>
    </a>
  `).join("");

  document.getElementById("volumeModal").style.display = "flex";
}

function closeVolumeModal(){
  const modal = document.getElementById("volumeModal");
  if(modal) modal.style.display = "none";
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