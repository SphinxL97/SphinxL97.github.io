async function loadJSON(url){
  const r = await fetch(url, {cache:"no-store"});
  if(!r.ok) throw new Error(url + " " + r.status);
  return await r.json();
}

let catalog = [];

function padId(id){
  return String(id || "001").padStart(3, "0");
}

const MISSING_MULTIVOLUME_WORKS = [
  {
    id:"014",
    title:"颜真卿李玄靖碑",
    cover:"assets/page_images/014_颜真卿李玄靖碑/images/01_顏真卿李玄靖碑册一/0001_一.jpg",
    active:true,
    has_volumes:true,
    detail_url:"#",
    status:"多册可选",
    creator:"颜真卿",
    script:"楷书",
    dynasty:"唐",
    shelf_mark:"22BT013",
    subtitle:"封面、逐页图像与释文已接入。",
    resource_uri:"http://data.library.sh.cn/bt/resource/work/zt6lmz7qu6grnw9q",
    viewer_url:"http://iiif.library.sh.cn/api/viewer/22BT013",
    volumes:[
      {
        volume_id:"01",
        volume_title:"顏真卿李玄靖碑册一",
        virtual_id:"014-01",
        cover:"assets/page_images/014_颜真卿李玄靖碑/images/01_顏真卿李玄靖碑册一/0001_一.jpg",
        detail_url:"detail.html?id=014-01"
      },
      {
        volume_id:"02",
        volume_title:"顏真卿李玄靖碑册二",
        virtual_id:"014-02",
        cover:"assets/page_images/014_颜真卿李玄靖碑/images/02_顏真卿李玄靖碑册二/0001_一.jpg",
        detail_url:"detail.html?id=014-02"
      }
    ]
  },
  {
    id:"031",
    title:"黄庭堅青原山诗刻石",
    cover:"assets/page_images/031_黄庭堅青原山诗刻石/images/01_黄庭堅青原山诗刻石(第一辑)册一/0001_一.jpg",
    active:true,
    has_volumes:true,
    detail_url:"#",
    status:"多册可选",
    creator:"黄庭坚",
    script:"行书",
    dynasty:"宋",
    shelf_mark:"49B840",
    subtitle:"封面、逐页图像与释文已接入。",
    resource_uri:"http://data.library.sh.cn/bt/resource/work/yqhlk3zvpje37f8m",
    viewer_url:"http://iiif.library.sh.cn/api/viewer/49B840",
    volumes:[
      {
        volume_id:"01",
        volume_title:"黄庭堅青原山诗刻石(第一辑)册一",
        virtual_id:"031-01",
        cover:"assets/page_images/031_黄庭堅青原山诗刻石/images/01_黄庭堅青原山诗刻石(第一辑)册一/0001_一.jpg",
        detail_url:"detail.html?id=031-01"
      },
      {
        volume_id:"02",
        volume_title:"黄庭堅青原山诗刻石(第一辑)册二",
        virtual_id:"031-02",
        cover:"assets/page_images/031_黄庭堅青原山诗刻石/images/02_黄庭堅青原山诗刻石(第一辑)册二/0001_一.jpg",
        detail_url:"detail.html?id=031-02"
      }
    ]
  },
  {
    id:"039",
    title:"淳化阁帖",
    cover:"assets/page_images/039_淳化阁帖/images/01_淳化阁帖册一/0001_一.jpg",
    active:true,
    has_volumes:true,
    detail_url:"#",
    status:"多册可选",
    creator:"资料待补",
    script:"行书",
    dynasty:"宋",
    shelf_mark:"48/B843",
    subtitle:"封面、逐页图像与释文已接入。",
    resource_uri:"http://data.library.sh.cn/bt/resource/work/tnox7vs9zecfdmu7",
    viewer_url:"http://iiif.library.sh.cn/api/viewer/48%2FB843",
    volumes:[
      {volume_id:"01",volume_title:"淳化阁帖册一",virtual_id:"039-01",cover:"assets/page_images/039_淳化阁帖/images/01_淳化阁帖册一/0001_一.jpg",detail_url:"detail.html?id=039-01"},
      {volume_id:"02",volume_title:"淳化阁帖册二",virtual_id:"039-02",cover:"assets/page_images/039_淳化阁帖/images/02_淳化阁帖册二/0001_一.jpg",detail_url:"detail.html?id=039-02"},
      {volume_id:"03",volume_title:"淳化阁帖册三",virtual_id:"039-03",cover:"assets/page_images/039_淳化阁帖/images/03_淳化阁帖册三/0001_一.jpg",detail_url:"detail.html?id=039-03"},
      {volume_id:"04",volume_title:"淳化阁帖册四",virtual_id:"039-04",cover:"assets/page_images/039_淳化阁帖/images/04_淳化阁帖册四/0001_一.jpg",detail_url:"detail.html?id=039-04"},
      {volume_id:"05",volume_title:"淳化阁帖册五",virtual_id:"039-05",cover:"assets/page_images/039_淳化阁帖/images/05_淳化阁帖册五/0001_一.jpg",detail_url:"detail.html?id=039-05"},
      {volume_id:"06",volume_title:"淳化阁帖册六",virtual_id:"039-06",cover:"assets/page_images/039_淳化阁帖/images/06_淳化阁帖册六/0001_一.jpg",detail_url:"detail.html?id=039-06"},
      {volume_id:"07",volume_title:"淳化阁帖册七",virtual_id:"039-07",cover:"assets/page_images/039_淳化阁帖/images/07_淳化阁帖册七/0001_一.jpg",detail_url:"detail.html?id=039-07"},
      {volume_id:"08",volume_title:"淳化阁帖册八",virtual_id:"039-08",cover:"assets/page_images/039_淳化阁帖/images/08_淳化阁帖册八/0001_一.jpg",detail_url:"detail.html?id=039-08"},
      {volume_id:"09",volume_title:"淳化阁帖册九",virtual_id:"039-09",cover:"assets/page_images/039_淳化阁帖/images/09_淳化阁帖册九/0001_一.jpg",detail_url:"detail.html?id=039-09"},
      {volume_id:"10",volume_title:"淳化阁帖册十",virtual_id:"039-10",cover:"assets/page_images/039_淳化阁帖/images/10_淳化阁帖册十/0001_一.jpg",detail_url:"detail.html?id=039-10"}
    ]
  }
];

function mergeMissingWorks(data){
  const map = new Map();
  (Array.isArray(data) ? data : []).forEach(item=>{
    if(item && item.id) map.set(padId(item.id), item);
  });
  MISSING_MULTIVOLUME_WORKS.forEach(item=>{
    if(!map.has(padId(item.id))) map.set(padId(item.id), item);
  });
  return Array.from(map.values()).sort((a,b)=>{
    const na = parseInt(a.id, 10) || 0;
    const nb = parseInt(b.id, 10) || 0;
    return na - nb || String(a.id).localeCompare(String(b.id));
  });
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
  catalog = mergeMissingWorks(data || []);
  render();

  const input = document.getElementById("gallerySearch");
  if(input) input.addEventListener("input", e=>render(e.target.value));
}).catch(err=>{
  catalog = mergeMissingWorks([]);
  render();
  const grid = document.getElementById("galleryGrid");
  if(grid && !catalog.length) grid.innerHTML = `<div style="padding:20px;color:#9f3025;">读取 data/beitie_catalog.json 失败：${err.message}</div>`;
});
