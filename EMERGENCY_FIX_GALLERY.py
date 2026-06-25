# -*- coding: utf-8 -*-
"""
EMERGENCY_FIX_GALLERY.py

专门修复“碑帖总览页 + 45件详情页入口”。

放置位置：
    放到网站根目录运行。
    网站根目录就是有 gallery.html / detail.html / assets / data / js 的那一层。

修复内容：
1. 总览页卡片封面改为每件碑帖自己的 assets/page_images/xxx/images/0001_一.jpg。
2. 去掉总览页右上角“示例”斜角标。
3. 45件碑帖全部可点击，链接为 detail.html?id=001 / 002 / 003 ...
4. 生成 data/page_images_index.json，让详情页按 id 读取对应碑帖的全部页图。
5. 其他碑帖缺少著录信息时，暂时复用道因法师碑模板。
6. 自动备份旧文件到 backup_gallery_fix_时间戳 文件夹。
"""

from pathlib import Path
import json
import re
import shutil
import time

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
JS = ROOT / "js"
IMG_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def read_text(path, default=""):
    return path.read_text(encoding="utf-8") if path.exists() else default


def write_text(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def read_json(path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")


def backup_files(paths):
    stamp = time.strftime("%Y%m%d_%H%M%S")
    bdir = ROOT / f"backup_gallery_fix_{stamp}"
    bdir.mkdir(exist_ok=True)
    for p in paths:
        if p.exists():
            rel = p.relative_to(ROOT)
            dst = bdir / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(p, dst)
    print("[备份目录]", bdir)


def find_page_root():
    for p in [ROOT / "assets" / "page_images", ROOT / "page_images"]:
        if p.exists():
            return p
    return None


def clean_title(name):
    return re.sub(r"^\d{3}[_\-\s]*", "", name).strip() or name


def page_no(path, fallback):
    m = re.match(r"^(\d+)", path.stem)
    return int(m.group(1)) if m else fallback


def page_label(path):
    stem = path.stem
    if "_" in stem:
        return stem.split("_", 1)[1]
    if "-" in stem:
        return stem.split("-", 1)[1]
    return ""


def find_works(page_root):
    works = {}
    for folder in sorted(page_root.iterdir(), key=lambda p: p.name):
        if not folder.is_dir():
            continue

        m = re.match(r"^(\d{3})", folder.name)
        if not m:
            continue

        wid = m.group(1)
        title = clean_title(folder.name)

        img_dir = folder / "images"
        if not img_dir.exists():
            img_dir = folder

        imgs = [p for p in img_dir.iterdir() if p.is_file() and p.suffix.lower() in IMG_EXTS]
        imgs.sort(key=lambda p: (page_no(p, 999999), p.name))

        if not imgs:
            continue

        cover = None
        for p in imgs:
            if p.stem.startswith("0001"):
                cover = p
                break
        if cover is None:
            cover = imgs[0]

        pages = []
        for i, p in enumerate(imgs, 1):
            pages.append({
                "page": page_no(p, i),
                "label": page_label(p) or str(page_no(p, i)),
                "image": p.relative_to(ROOT).as_posix(),
                "text_clean": "",
                "text_raw": "",
                "char_count": 0,
                "has_char_boxes": False
            })

        works[wid] = {
            "id": wid,
            "title": title,
            "cover": cover.relative_to(ROOT).as_posix(),
            "pages": pages
        }

    return works


def patch_gallery_js():
    gallery_js = """async function loadJSON(url){
  const r = await fetch(url, {cache:"no-store"});
  if(!r.ok) throw new Error(url + " " + r.status);
  return await r.json();
}

let catalog = [];

function cardHTML(item){
  const id = String(item.id || "001").padStart(3, "0");
  const url = item.detail_url || `detail.html?id=${id}`;
  const meta1 = item.creator || item.script || item.dynasty || "资料待整理";
  const meta2 = item.script || item.dynasty || "";

  return `<a class="beitie-card" href="${url}">
    <div class="thumb">
      ${item.cover ? `<img src="${item.cover}" alt="${item.title}" loading="lazy">` : ""}
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
"""
    write_text(JS / "gallery.js", gallery_js)
    print("[已写入] js/gallery.js：已去掉“示例”角标，并强制所有卡片可点击。")


def patch_gallery_html():
    path = ROOT / "gallery.html"
    if not path.exists():
        print("[跳过] gallery.html 不存在")
        return

    html = read_text(path)

    # 即使旧 CSS 还残留，也强制隐藏 ribbon
    if ".ribbon{display:none!important}" not in html:
        html = html.replace("</style>", "\n.ribbon{display:none!important}\n</style>")

    # 给 js/gallery.js 加时间戳，强制浏览器加载新 JS
    stamp = str(int(time.time()))
    html = re.sub(
        r'src=["\']js/gallery\.js(?:\?v=[^"\']*)?["\']',
        f'src="js/gallery.js?v={stamp}"',
        html
    )

    write_text(path, html)
    print("[已写入] gallery.html：已隐藏 ribbon，并给 js/gallery.js 加缓存版本号。")


def update_catalog_and_pages(works):
    catalog_path = DATA / "beitie_catalog.json"
    details_path = DATA / "beitie_details.json"
    old_pages_path = DATA / "beitie_pages.json"

    old_catalog = read_json(catalog_path, [])
    old_by_id = {str(x.get("id", "")).zfill(3): x for x in old_catalog if x.get("id") is not None}
    old_pages = read_json(old_pages_path, {})
    details = read_json(details_path, {})

    new_catalog = []
    for wid in sorted(works.keys()):
        w = works[wid]
        old = old_by_id.get(wid, {})
        item = dict(old)
        item["id"] = wid
        item["title"] = old.get("title") or w["title"]
        item["cover"] = w["cover"]
        item["active"] = True
        item["detail_url"] = f"detail.html?id={wid}"
        item["status"] = old.get("status") or "封面入口"
        item["creator"] = old.get("creator") or "欧阳通（楷书），李俨（撰文）"
        item["script"] = old.get("script") or "楷书"
        item["dynasty"] = old.get("dynasty") or "龙朔三年十月十日刻立（663）"
        item["shelf_mark"] = old.get("shelf_mark") or "暂缺"
        item["subtitle"] = old.get("subtitle") or "封面、逐页图像与释文已接入；其余说明暂以《道因法师碑》信息作占位。"
        new_catalog.append(item)

    write_json(catalog_path, new_catalog)
    print("[已写入] data/beitie_catalog.json：封面改为每件 0001_一，全部 active=true。")

    page_index = {"works": {}}
    for wid, w in works.items():
        pages = [dict(p) for p in w["pages"]]

        # 尽量保留旧数据里的逐页释文
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
    print("[已写入] data/page_images_index.json：详情页可按 id 读取各碑帖页图。")

    # 其他碑帖详情暂时复用 001 模板
    template = details.get("001") or {}
    new_details = {}
    for item in new_catalog:
        wid = item["id"]
        if wid == "001" and "001" in details:
            d = dict(details["001"])
        else:
            d = json.loads(json.dumps(template, ensure_ascii=False))
            d["id"] = wid
            d["title"] = item["title"]
            d["cover"] = item["cover"]
            d["summary"] = f"《{item['title']}》已接入封面与逐页图像；说明文字暂以《道因法师碑》信息作占位，后续可逐件替换。"
            if isinstance(d.get("basic"), dict):
                d["basic"]["责任者"] = item["creator"]
                d["basic"]["书体"] = item["script"]
                d["basic"]["年代"] = item["dynasty"]
                d["basic"]["馆藏号"] = item["shelf_mark"]
        new_details[wid] = d

    write_json(details_path, new_details)
    print("[已写入] data/beitie_details.json：其他碑帖详情暂用 001 模板占位。")


def main():
    print("ROOT:", ROOT)

    page_root = find_page_root()
    if not page_root:
        print("ERROR: 没找到 assets/page_images 或 page_images。")
        print("你的网站根目录应该有 assets/page_images/001.../images/0001_一.jpg")
        return

    print("PAGE_ROOT:", page_root)
    works = find_works(page_root)
    print("发现碑帖数量:", len(works))

    if not works:
        print("ERROR: page_images 下没发现以 001、002、003 开头的碑帖文件夹。")
        return

    backup_files([
        DATA / "beitie_catalog.json",
        DATA / "beitie_details.json",
        DATA / "page_images_index.json",
        JS / "gallery.js",
        ROOT / "gallery.html",
    ])

    patch_gallery_js()
    patch_gallery_html()
    update_catalog_and_pages(works)

    print("")
    print("完成。现在请：")
    print("1. 打开 http://127.0.0.1:8088/js/gallery.js")
    print("2. 搜索 ribbon 或 示例。正常应该搜不到。")
    print("3. 再打开 http://127.0.0.1:8088/gallery.html")
    print("4. 按 Ctrl + F5 强制刷新。")


if __name__ == "__main__":
    main()
