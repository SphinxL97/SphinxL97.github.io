# -*- coding: utf-8 -*-
"""
一键修复碑帖总览与详情索引

放置位置：
    网站根目录，和 gallery.html / detail.html / assets / data 同级。

功能：
1. 扫描 assets/page_images 下每件碑帖的 images/0001_一.jpg；
2. 更新 data/beitie_catalog.json，让总览封图改为每件的第一页；
3. 所有碑帖 active=true，detail_url=detail.html?id=编号，避免除道因外打不开；
4. 生成/更新 data/page_images_index.json，让详情页能读取每件碑帖的全部页图；
5. 用 001 道因法师碑的详情信息作为其他碑帖的临时占位；
6. 覆盖 js/gallery.js，去掉“示例”角标。

运行：
    python 01_fix_gallery_cover_and_detail_index.py
"""

from pathlib import Path
import json
import copy
import re

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
PAGE_ROOT_CANDIDATES = [
    ROOT / "assets" / "page_images",
    ROOT / "page_images",
]

IMG_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

CN_NUM = {
    "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9, "十": 10,
    "十一": 11, "十二": 12, "十三": 13, "十四": 14, "十五": 15, "十六": 16, "十七": 17, "十八": 18, "十九": 19,
    "二十": 20, "三十": 30, "四十": 40, "五十": 50, "六十": 60, "七十": 70, "八十": 80, "九十": 90,
}

def cn_to_num(s):
    s = (s or "").strip()
    if not s:
        return 0
    if s in CN_NUM:
        return CN_NUM[s]
    if "十" in s:
        parts = s.split("十")
        if parts[0] == "":
            tens = 1
        else:
            tens = CN_NUM.get(parts[0], 0)
        ones = CN_NUM.get(parts[1], 0) if len(parts) > 1 and parts[1] else 0
        return tens * 10 + ones
    return CN_NUM.get(s, 0)

def read_json(path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))

def write_json(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")

def find_page_root():
    for p in PAGE_ROOT_CANDIDATES:
        if p.exists():
            return p
    return None

def clean_title_from_folder(name):
    t = re.sub(r"^\d{3}[_\-\s]*", "", name).strip()
    return t or name

def page_label_from_filename(stem):
    if "_" in stem:
        return stem.split("_", 1)[1]
    if "-" in stem:
        return stem.split("-", 1)[1]
    return ""

def page_no_from_filename(stem, fallback):
    m = re.match(r"^(\d+)", stem)
    if m:
        return int(m.group(1))
    label = page_label_from_filename(stem)
    n = cn_to_num(label)
    return n or fallback

def find_works(page_root):
    works = {}
    if not page_root or not page_root.exists():
        return works

    for folder in sorted(page_root.iterdir(), key=lambda x: x.name):
        if not folder.is_dir():
            continue
        m = re.match(r"^(\d{3})", folder.name)
        if not m:
            continue

        wid = m.group(1)
        title = clean_title_from_folder(folder.name)

        img_dir = folder / "images"
        if not img_dir.exists():
            img_dir = folder

        images = [p for p in img_dir.iterdir() if p.is_file() and p.suffix.lower() in IMG_EXTS]
        images.sort(key=lambda p: (page_no_from_filename(p.stem, 999999), p.name))

        if not images:
            continue

        cover = None
        for p in images:
            if p.stem.startswith("0001"):
                cover = p
                break
        if cover is None:
            cover = images[0]

        pages = []
        for idx, p in enumerate(images, 1):
            stem = p.stem
            page_no = page_no_from_filename(stem, idx)
            label = page_label_from_filename(stem) or str(page_no)
            rel = p.relative_to(ROOT).as_posix()
            pages.append({
                "page": page_no,
                "label": label,
                "image": rel,
                "text_clean": "",
                "text_raw": "",
                "char_count": 0,
                "has_char_boxes": False
            })

        works[wid] = {
            "id": wid,
            "title": title,
            "folder": folder.relative_to(ROOT).as_posix(),
            "cover": cover.relative_to(ROOT).as_posix(),
            "pages": sorted(pages, key=lambda x: x["page"])
        }

    return works

def main():
    DATA.mkdir(exist_ok=True)

    page_root = find_page_root()
    if not page_root:
        print("ERROR: 没找到 assets/page_images 或 page_images 目录。")
        print("请确认你的页图目录存在。")
        return

    print("Page images root:", page_root)
    works = find_works(page_root)
    print("发现碑帖目录数量:", len(works))

    if not works:
        print("ERROR: page_images 下没有发现以 001 / 002 / 003 开头的碑帖目录。")
        return

    catalog_path = DATA / "beitie_catalog.json"
    details_path = DATA / "beitie_details.json"
    old_pages_path = DATA / "beitie_pages.json"

    catalog = read_json(catalog_path, [])
    details = read_json(details_path, {})
    old_pages = read_json(old_pages_path, {})

    catalog_by_id = {str(item.get("id", "")).zfill(3): item for item in catalog if item.get("id") is not None}

    placeholder_dynasty = "龙朔三年十月十日刻立（663）"
    placeholder_script = "楷书"
    placeholder_creator = "欧阳通（楷书），李俨（撰文）"
    placeholder_status = "封面入口"
    placeholder_subtitle = "封面、逐页图像与释文已接入；其余说明暂以《道因法师碑》信息作占位。"

    new_catalog = []

    all_ids = sorted(works.keys())
    for wid in all_ids:
        w = works[wid]
        old = catalog_by_id.get(wid, {})
        item = dict(old)
        item["id"] = wid
        item["title"] = old.get("title") or w["title"]
        item["cover"] = w["cover"]
        item["dynasty"] = old.get("dynasty") or placeholder_dynasty
        item["script"] = old.get("script") or placeholder_script
        item["creator"] = old.get("creator") or placeholder_creator
        item["shelf_mark"] = old.get("shelf_mark") or "暂缺"
        item["active"] = True
        item["detail_url"] = f"detail.html?id={wid}"
        item["status"] = old.get("status") or placeholder_status
        item["subtitle"] = old.get("subtitle") or placeholder_subtitle
        new_catalog.append(item)

    write_json(catalog_path, new_catalog)

    page_index = {"works": {}}
    for wid, w in works.items():
        pages = copy.deepcopy(w["pages"])
        old_page_map = {}
        if isinstance(old_pages, dict) and wid in old_pages:
            for p in old_pages[wid]:
                old_page_map[int(p.get("page", 0))] = p
        elif wid == "001" and isinstance(old_pages, dict) and "001" in old_pages:
            for p in old_pages["001"]:
                old_page_map[int(p.get("page", 0))] = p

        for p in pages:
            old = old_page_map.get(int(p["page"]))
            if old:
                p["text_clean"] = old.get("text_clean", "")
                p["text_raw"] = old.get("text_raw", "")
                p["char_count"] = old.get("char_count", len(p["text_clean"]))
                p["has_char_boxes"] = old.get("has_char_boxes", False)

        title = next((x["title"] for x in new_catalog if x["id"] == wid), w["title"])
        page_index["works"][wid] = {
            "id": wid,
            "title": title,
            "cover": w["cover"],
            "pages": pages
        }

    write_json(DATA / "page_images_index.json", page_index)

    template = details.get("001") or {}
    new_details = {}
    for item in new_catalog:
        wid = item["id"]
        if wid == "001" and "001" in details:
            d = copy.deepcopy(details["001"])
        else:
            d = copy.deepcopy(template)
            d["id"] = wid
            d["title"] = item["title"]
            d["cover"] = item["cover"]
            d["summary"] = f"《{item['title']}》已接入封面与逐页图像；说明文字暂以《道因法师碑》信息作占位，后续可逐件替换。"
            if isinstance(d.get("basic"), dict):
                d["basic"]["责任者"] = item.get("creator", placeholder_creator)
                d["basic"]["书体"] = item.get("script", placeholder_script)
                d["basic"]["年代"] = item.get("dynasty", placeholder_dynasty)
                d["basic"]["馆藏号"] = item.get("shelf_mark", "暂缺")
        new_details[wid] = d
    write_json(details_path, new_details)

    js_dir = ROOT / "js"
    js_dir.mkdir(exist_ok=True)
    gallery_js = """async function loadJSON(url){ const r = await fetch(url, {cache:"no-store"}); return await r.json(); }
let catalog = [];

function cardHTML(item){
  const url = item.detail_url || `detail.html?id=${item.id || "001"}`;
  const meta1 = item.creator || item.script || item.dynasty || "资料待整理";
  const meta2 = item.script || item.dynasty || "";
  return `<a class="beitie-card" href="${url}">
    <div class="thumb">
      ${item.cover ? `<img src="${item.cover}" alt="${item.title}" loading="lazy">` : ""}
    </div>
    <div class="card-info">
      <h3 title="${item.title}">${item.title}</h3>
      <div class="meta">
        ${item.status ? `<span class="ready">⌘ ${item.status}</span>` : ""}
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
"""
    (js_dir / "gallery.js").write_text(gallery_js, encoding="utf-8")

    print("已更新：")
    print(" - data/beitie_catalog.json")
    print(" - data/beitie_details.json")
    print(" - data/page_images_index.json")
    print(" - js/gallery.js")
    print("")
    print("下一步：")
    print("1. 运行 python -m http.server 8088 --bind 127.0.0.1")
    print("2. 浏览器打开 http://127.0.0.1:8088/gallery.html")
    print("3. 按 Ctrl + F5 强制刷新")

if __name__ == "__main__":
    main()
